import { getSupabaseClient, isSupabaseConfigured, SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from './client';
import {
  EducationSystem,
  SecondaryTrack,
  Student,
  StudyScope,
  Teacher,
  TeacherStatus,
} from '../types';
import { normalizePhoneAuth } from '../utils/authStorage';
import { normalizePhoneForMatch } from '../utils/storage';

function requireSupabase() {
  if (!SUPABASE_PROJECT_URL) {
    throw new Error(
      'رابط Supabase (NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL) غير متوفر أو غير صالح في إعدادات البيئة.'
    );
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'مفتاح الربط مع Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY) غير متوفر في إعدادات البيئة.'
    );
  }
  if (!isSupabaseConfigured()) {
    throw new Error('تعذر تهيئة الاتصال بـ Supabase.');
  }
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('تعذر تهيئة الاتصال بـ Supabase.');
  }
  return client;
}

function isNetworkFetchError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    err instanceof TypeError ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network request failed')
  );
}

export function sanitizeUserFacingError(
  err: unknown,
  fallback = 'حدث خطأ في الاتصال بالسيرفر، حاول مرة أخرى'
): string {
  if (!err) return fallback;
  if (isNetworkFetchError(err)) {
    return 'حدث خطأ في الاتصال بالسيرفر، حاول مرة أخرى';
  }
  const msg =
    typeof err === 'string'
      ? err
      : typeof (err as any)?.message === 'string'
      ? (err as any).message
      : '';
  const cleaned = msg.trim();
  if (!cleaned || /failed to fetch/i.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

function formatSupabaseError(
  err: any,
  tableName: string,
  silentNetworkLog = false
): string {
  const networkFail = isNetworkFetchError(err);
  const logFn = silentNetworkLog && networkFail ? console.warn : console.error;
  logFn(`[Supabase] Error on table "${tableName}":`, {
    targetUrl: SUPABASE_PROJECT_URL || '(MISSING)',
    code: err?.code,
    status: err?.status,
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    raw: err,
  });
  if (networkFail) {
    return 'حدث خطأ في الاتصال بالسيرفر، حاول مرة أخرى';
  }
  const rawMsg = String(err?.message || '').trim();
  const details = String(err?.details || '').trim();
  const hint = String(err?.hint || '').trim();
  const code = String(err?.code || '').trim();
  const fullErrorText = [rawMsg, details, hint].filter(Boolean).join(' — ');

  if (code === '42501' || rawMsg.toLowerCase().includes('row-level security')) {
    return `صلاحيات RLS على جدول (${tableName}) تمنع العملية: ${fullErrorText}`;
  }
  if (code === '42P01' || rawMsg.toLowerCase().includes('does not exist')) {
    return `جدول (${tableName}) غير موجود أو تعذر الوصول إليه في Supabase: ${fullErrorText}`;
  }
  if (code === '42703' || rawMsg.toLowerCase().includes('column')) {
    return `عدم تطابق أسماء الأعمدة في جدول (${tableName}): ${fullErrorText}`;
  }
  if (code === '23505' || rawMsg.toLowerCase().includes('duplicate')) {
    return 'رقم الهاتف مسجل بالفعل في قاعدة البيانات.';
  }
  return fullErrorText || `حدث خطأ أثناء الاتصال بجدول (${tableName}) في Supabase.`;
}

function buildPhoneVariants(phone: string): string[] {
  const set = new Set<string>();
  const trimmed = String(phone || '').trim();
  if (trimmed) set.add(trimmed);

  const norm = normalizePhoneForMatch(trimmed);
  if (norm) {
    set.add(norm);
    if (norm.startsWith('01') && norm.length === 11) {
      set.add(`+20${norm.slice(1)}`);
      set.add(`20${norm.slice(1)}`);
      set.add(`0020${norm.slice(1)}`);
      set.add(`02${norm}`);
      set.add(norm.slice(1));
    } else if (norm.startsWith('05') && norm.length === 10) {
      set.add(`+966${norm.slice(1)}`);
      set.add(`966${norm.slice(1)}`);
      set.add(`00966${norm.slice(1)}`);
    }
  }
  return Array.from(set).filter(Boolean);
}

function mapSupabaseStudentRow(row: any): Student {
  return {
    id: String(row.id),
    name: row.name || '',
    age: row.age !== undefined && row.age !== null ? String(row.age) : '',
    stage: row.stage || '',
    educationSystem: row.education_system === 'azhar' ? 'azhar' : 'general',
    gradeLevel: row.grade_level || '',
    track: row.track || '',
    studyScope: row.study_scope === 'single' ? 'single' : 'all',
    selectedSubjects: Array.isArray(row.selected_subjects) ? row.selected_subjects : [],
    registeredBySelf: Boolean(row.registered_by_self),
    phone: row.phone || '',
    course: row.course || 'حفظ القرآن الكريم',
    feeStatus: row.fee_status === 'paid' ? 'paid' : 'unpaid',
    notes: row.notes || '',
    parentName: row.parent_name || row.name || '',
    parentPhone: row.parent_phone || row.phone || '',
    registeredDate: row.registered_date || new Date().toISOString().split('T')[0],
  };
}

function extractMissingColumnName(err: any): string | null {
  const rawMsg = String(err?.message || '');
  const details = String(err?.details || '');
  const combined = `${rawMsg} ${details}`;
  const match = combined.match(
    /(?:Could not find the '([^']+)' column|column "([^"]+)" of relation|column [a-z0-9_]+\.([a-z0-9_]+) does not exist)/i
  );
  return match ? (match[1] || match[2] || match[3] || null) : null;
}

function mapSupabaseTeacherRow(row: any): Teacher {
  const rawPhone = row.phone || row.normalized_phone || '';
  const normPhone = normalizePhoneAuth(rawPhone) || rawPhone;
  const teachingStages = Array.isArray(row.teaching_stages)
    ? row.teaching_stages
    : row.stage
    ? [row.stage]
    : [];
  const teachingGrades = Array.isArray(row.teaching_grades)
    ? row.teaching_grades
    : row.grade
    ? [row.grade]
    : [];
  const subjects = Array.isArray(row.subjects) ? row.subjects : [];
  return {
    id: String(row.id ?? normPhone ?? Date.now()),
    name: row.name || row.full_name || '',
    phone: normPhone || row.phone || '',
    normalizedPhone: normPhone,
    role: 'teacher',
    status: (row.status as TeacherStatus) || 'pending',
    registeredBySelf:
      row.registered_by_self !== undefined ? Boolean(row.registered_by_self) : true,
    avatarUrl: row.profile_image_url || row.avatar_url || '',
    specialization:
      row.bio || row.specialization || row.qualification || subjects.join(' • '),
    age: row.age ? Number(row.age) : undefined,
    location: row.nationality || row.location || '',
    teachingSystems: row.teaching_type || row.teaching_systems || 'both',
    teachingMode: row.teaching_mode || (subjects.length > 1 ? 'multiple' : 'single'),
    teachingStages,
    teachingGrades,
    teachingTrack: row.teaching_track || '',
    subjects,
    dailyHours: row.daily_hours ? Number(row.daily_hours) : undefined,
    availablePeriod: row.available_period || 'الاتنين',
    experienceYears:
      row.experience_years !== undefined && row.experience_years !== null
        ? Number(row.experience_years)
        : undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

async function selectStudentsResilient(): Promise<{ rows: Student[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      rows: [],
      error:
        'إعدادات الاتصال بـ Supabase (NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL و ANON_KEY) غير مكتملة.',
    };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { rows: [], error: 'تعذر تهيئة عميل Supabase.' };
  }

  try {
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const code = String(error.code || '');
      const msg = String(error.message || '').toLowerCase();
      if (code === '42703' || msg.includes('created_at')) {
        const retry = await supabase.from('students').select('*');
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      return { rows: [], error: formatSupabaseError(error, 'students', true) };
    }
    if (!Array.isArray(data)) return { rows: [] };
    return { rows: data.map(mapSupabaseStudentRow) };
  } catch (err) {
    return { rows: [], error: formatSupabaseError(err, 'students', true) };
  }
}

async function selectTeachersResilient(): Promise<{ rows: Teacher[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      rows: [],
      error:
        'إعدادات الاتصال بـ Supabase (NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL و ANON_KEY) غير مكتملة.',
    };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { rows: [], error: 'تعذر تهيئة عميل Supabase.' };
  }

  try {
    let { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const code = String(error.code || '');
      const msg = String(error.message || '').toLowerCase();
      if (code === '42703' || msg.includes('created_at')) {
        const retry = await supabase.from('teachers').select('*');
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      return { rows: [], error: formatSupabaseError(error, 'teachers', true) };
    }
    if (!Array.isArray(data)) return { rows: [] };
    return { rows: data.map(mapSupabaseTeacherRow) };
  } catch (err) {
    return { rows: [], error: formatSupabaseError(err, 'teachers', true) };
  }
}

export async function checkStudentPhoneInSupabase(phone: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return false;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const clean = normalizePhoneForMatch(phone);
    if (!clean) return false;

    const variants = buildPhoneVariants(phone);
    const { data, error } = await supabase
      .from('students')
      .select('id, phone')
      .in('phone', variants)
      .limit(1);

    if (error) {
      console.error('[Supabase] checkStudentPhoneInSupabase error:', error);
      if (isNetworkFetchError(error)) return false;
    }

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }

    const { rows } = await selectStudentsResilient();
    return rows.some((s) => normalizePhoneForMatch(s.phone) === clean);
  } catch (err) {
    console.error('[Supabase] checkStudentPhoneInSupabase exception:', err);
    return false;
  }
}

export async function checkTeacherPhoneInSupabase(phone: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return false;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const clean = normalizePhoneAuth(phone);
    if (!clean) return false;

    const variants = buildPhoneVariants(phone);
    const { data, error } = await supabase
      .from('teachers')
      .select('phone')
      .in('phone', variants)
      .limit(1);

    if (error) {
      console.error('[Supabase] checkTeacherPhoneInSupabase error:', error);
      if (isNetworkFetchError(error)) return false;
    }

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }

    const { rows } = await selectTeachersResilient();
    return rows.some(
      (t) => normalizePhoneAuth(t.normalizedPhone || t.phone) === clean
    );
  } catch (err) {
    console.error('[Supabase] checkTeacherPhoneInSupabase exception:', err);
    return false;
  }
}

export async function findStudentsInSupabaseByPhone(
  phone: string
): Promise<{ students: Student[]; error?: string }> {
  const clean = normalizePhoneForMatch(phone);
  if (!clean || !isSupabaseConfigured()) {
    return { students: [] };
  }

  const { rows, error } = await selectStudentsResilient();
  if (error) {
    return { students: [], error };
  }

  const matches = rows.filter(
    (s) =>
      normalizePhoneForMatch(s.phone) === clean ||
      normalizePhoneForMatch(s.parentPhone) === clean
  );
  return { students: matches };
}

export async function findTeacherInSupabaseByPhone(
  phone: string
): Promise<{ teacher: Teacher | null; error?: string }> {
  const clean = normalizePhoneAuth(phone);
  if (!clean || !isSupabaseConfigured()) {
    return { teacher: null };
  }

  const { rows, error } = await selectTeachersResilient();
  if (error) {
    return { teacher: null, error };
  }

  const matched =
    rows.find(
      (t) => normalizePhoneAuth(t.normalizedPhone || t.phone) === clean
    ) || null;
  return { teacher: matched };
}

export interface SupabaseStudentInput {
  id: string;
  name: string;
  age: number;
  phone: string;
  parentName: string;
  parentPhone: string;
  educationSystem: EducationSystem;
  stage: string;
  gradeLevel: string;
  track?: SecondaryTrack | '';
  studyScope: StudyScope;
  selectedSubjects: string[];
  course: string;
  registeredDate: string;
}

export async function registerStudentAndParentInSupabase(
  input: SupabaseStudentInput
): Promise<void> {
  const supabase = requireSupabase();
  const cleanStudentPhone = normalizePhoneForMatch(input.phone) || input.phone.trim();
  const cleanParentPhone =
    normalizePhoneForMatch(input.parentPhone || input.phone) || cleanStudentPhone;

  try {
    // 1. Insert Student into `students` table
    const { error: studentError } = await supabase.from('students').insert({
      id: input.id,
      name: input.name.trim(),
      age: input.age,
      phone: cleanStudentPhone,
      parent_name: input.parentName.trim(),
      parent_phone: cleanParentPhone,
      education_system: input.educationSystem,
      stage: input.stage,
      grade_level: input.gradeLevel,
      track: input.track || '',
      study_scope: input.studyScope,
      selected_subjects: input.selectedSubjects,
      course: input.course,
      fee_status: 'unpaid',
      registered_date: input.registeredDate,
      registered_by_self: true,
    });

    if (studentError) {
      throw new Error(formatSupabaseError(studentError, 'students'));
    }

    // 2. Best-effort Insert Parent record into `parents` table (never fail an already-saved student)
    try {
      const baseParent = {
        name: input.parentName.trim() || `ولي أمر ${input.name.trim()}`,
        phone: cleanParentPhone,
        student_id: input.id,
        student_name: input.name.trim(),
      };
      let { error: parentError } = await supabase.from('parents').insert(baseParent);

      if (parentError) {
        const pCode = String(parentError.code || '');
        const pMsg = String(parentError.message || '').toLowerCase();
        if (pCode === '23502' && pMsg.includes('id')) {
          const retryWithId = await supabase.from('parents').insert({
            id: `par-${input.id}`,
            ...baseParent,
          });
          parentError = retryWithId.error;
        } else if (pCode === '42703') {
          const retryMinimal = await supabase.from('parents').insert({
            name: baseParent.name,
            phone: baseParent.phone,
          });
          parentError = retryMinimal.error;
        }
        if (parentError) {
          console.warn('Supabase parents insert notice:', formatSupabaseError(parentError, 'parents'));
        }
      }
    } catch (parentErr) {
      console.warn('Supabase parents best-effort insert skipped:', parentErr);
    }
  } catch (err: any) {
    throw new Error(
      err instanceof Error && !isNetworkFetchError(err)
        ? err.message
        : formatSupabaseError(err, 'students')
    );
  }
}

export async function registerParentInSupabase(input: {
  name: string;
  phone: string;
  studentId?: string;
  studentName?: string;
}): Promise<void> {
  const supabase = requireSupabase();
  const cleanPhone = normalizePhoneForMatch(input.phone) || input.phone.trim();
  try {
    const { error } = await supabase.from('parents').insert({
      name: input.name.trim(),
      phone: cleanPhone,
      student_id: input.studentId || null,
      student_name: input.studentName || '',
    });
    if (error) {
      throw new Error(formatSupabaseError(error, 'parents'));
    }
  } catch (err: any) {
    throw new Error(
      err instanceof Error && !isNetworkFetchError(err)
        ? err.message
        : formatSupabaseError(err, 'parents')
    );
  }
}

export interface SupabaseTeacherInput {
  id: string;
  name: string;
  phone: string;
  age: number;
  location: string;
  teachingSystems: string;
  teachingMode: string;
  teachingStages: string[];
  teachingGrades: string[];
  teachingTrack?: string;
  subjects: string[];
  dailyHours: number;
  availablePeriod: string;
  experienceYears: number;
  avatarUrl?: string;
  specialization: string;
}

async function executeTeachersMutationWithSchemaHealing(
  mode: 'insert' | 'upsert',
  initialPayload: Record<string, any>,
  nameFallbackValue?: string
): Promise<void> {
  const supabase = requireSupabase();
  const payload: Record<string, any> = { ...initialPayload };
  let nameFallbackStage = 0;
  const maxAttempts = Object.keys(initialPayload).length + 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res =
      mode === 'insert'
        ? await supabase.from('teachers').insert(payload)
        : await supabase.from('teachers').upsert(payload, { onConflict: 'id' });

    const error = res.error;
    if (!error) return;

    const code = String(error.code || '');
    const msg = String(error.message || '').toLowerCase();

    // If `id` column is UUID in DB and rejects string id like 'tch-...', let Postgres auto-generate it
    if (
      (code === '22P02' || msg.includes('uuid')) &&
      msg.includes('uuid') &&
      'id' in payload
    ) {
      console.warn('[Supabase] Removing string id so DB generates UUID:', error.message);
      delete payload.id;
      if (mode === 'upsert') {
        mode = 'insert';
      }
      continue;
    }

    // If PostgREST / Postgres reports a missing column, adapt or remove it automatically and retry
    const missingCol = extractMissingColumnName(error);
    if (
      missingCol &&
      (code === 'PGRST204' ||
        code === '42703' ||
        msg.includes('schema cache') ||
        msg.includes('does not exist'))
    ) {
      console.warn(
        `[Supabase] Column "${missingCol}" not in teachers table; adapting payload and retrying.`
      );
      if (missingCol === 'name' && nameFallbackStage === 0 && nameFallbackValue) {
        nameFallbackStage = 1;
        delete payload.name;
        payload.full_name = nameFallbackValue;
        continue;
      }
      if (missingCol === 'full_name' && nameFallbackStage === 1 && nameFallbackValue) {
        nameFallbackStage = 2;
        delete payload.full_name;
        payload.teacher_name = nameFallbackValue;
        continue;
      }
      if (missingCol in payload) {
        delete payload[missingCol];
        continue;
      }
    }

    throw new Error(formatSupabaseError(error, 'teachers'));
  }

  throw new Error('تعذر حفظ بيانات المعلم في قاعدة البيانات بعد عدة محاولات.');
}

export async function registerTeacherInSupabase(
  input: SupabaseTeacherInput
): Promise<void> {
  requireSupabase();
  const cleanPhone = normalizePhoneAuth(input.phone) || input.phone.trim();
  const nowIso = new Date().toISOString();
  const roundedAge = Math.round(Number(input.age));
  const roundedHours = Math.round(Number(input.dailyHours));
  const roundedExp = Math.round(Number(input.experienceYears));

  const payload: Record<string, any> = {
    id: input.id,
    name: input.name.trim(),
    phone: cleanPhone,
    age: roundedAge,
    nationality: input.location.trim(),
    teaching_type: input.teachingSystems,
    stage: input.teachingStages[0] || '',
    grade: input.teachingGrades[0] || '',
    profile_image_url: input.avatarUrl || '',
    teaching_stages: input.teachingStages,
    teaching_grades: input.teachingGrades,
    teaching_track: input.teachingTrack || '',
    subjects: input.subjects,
    daily_hours: roundedHours,
    available_period: input.availablePeriod,
    experience_years: roundedExp,
    experience: `${roundedExp} سنوات خبرة`,
    bio: input.specialization,
    about: `نظام التدريس: ${input.teachingSystems} | الوضع: ${input.teachingMode}`,
    status: 'pending',
    created_at: nowIso,
    updated_at: nowIso,
  };

  try {
    await executeTeachersMutationWithSchemaHealing('insert', payload, input.name.trim());
  } catch (err: any) {
    throw new Error(
      err instanceof Error && !isNetworkFetchError(err)
        ? err.message
        : formatSupabaseError(err, 'teachers')
    );
  }
}

export async function fetchStudentsFromSupabase(): Promise<Student[]> {
  const { rows, error } = await selectStudentsResilient();
  if (error) {
    console.warn('fetchStudentsFromSupabase warning:', error);
  }
  return rows;
}

export async function fetchTeachersFromSupabase(): Promise<Teacher[]> {
  const { rows, error } = await selectTeachersResilient();
  if (error) {
    console.warn('fetchTeachersFromSupabase warning:', error);
  }
  return rows;
}

export async function updateTeacherStatusInSupabase(
  teacherId: string,
  status: TeacherStatus,
  fallbackPhone?: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('teachers')
      .update({ status })
      .eq('id', teacherId)
      .select('id');

    if (error) {
      console.warn('updateTeacherStatusInSupabase error:', formatSupabaseError(error, 'teachers'));
    }

    if ((!data || data.length === 0) && fallbackPhone) {
      const variants = buildPhoneVariants(fallbackPhone);
      if (variants.length > 0) {
        await supabase
          .from('teachers')
          .update({ status })
          .in('phone', variants);
      }
    }
  } catch (err) {
    console.warn('updateTeacherStatusInSupabase exception:', err);
  }
}

export async function upsertStudentInSupabase(student: Student): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const cleanPhone = normalizePhoneForMatch(student.phone) || student.phone.trim();
  const cleanParentPhone =
    normalizePhoneForMatch(student.parentPhone || student.phone) || cleanPhone;
  const numericAge = Number(student.age);

  try {
    const { error } = await supabase.from('students').upsert(
      {
        id: student.id,
        name: student.name.trim(),
        age: !isNaN(numericAge) && numericAge > 0 ? numericAge : null,
        phone: cleanPhone,
        parent_name: (student.parentName || student.name).trim(),
        parent_phone: cleanParentPhone,
        education_system: student.educationSystem || 'general',
        stage: student.stage || '',
        grade_level: student.gradeLevel || '',
        track: student.track || '',
        study_scope: student.studyScope || 'all',
        selected_subjects: Array.isArray(student.selectedSubjects)
          ? student.selectedSubjects
          : [],
        course: student.course || 'حفظ القرآن الكريم',
        fee_status: student.feeStatus === 'paid' ? 'paid' : 'unpaid',
        notes: student.notes || '',
        registered_date: student.registeredDate || new Date().toISOString().split('T')[0],
        registered_by_self: Boolean(student.registeredBySelf),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('upsertStudentInSupabase notice:', error.message);
    }
  } catch (err) {
    console.warn('upsertStudentInSupabase exception:', err);
  }
}

export async function upsertTeacherInSupabase(teacher: Teacher): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const cleanPhone = normalizePhoneAuth(teacher.normalizedPhone || teacher.phone) || teacher.phone;
  const nowIso = new Date().toISOString();
  const stages = Array.isArray(teacher.teachingStages) ? teacher.teachingStages : [];
  const grades = Array.isArray(teacher.teachingGrades) ? teacher.teachingGrades : [];

  const payload: Record<string, any> = {
    id: teacher.id,
    name: teacher.name.trim(),
    phone: cleanPhone,
    age: teacher.age ?? null,
    nationality: teacher.location || '',
    teaching_type: teacher.teachingSystems || 'both',
    stage: stages[0] || '',
    grade: grades[0] || '',
    profile_image_url: teacher.avatarUrl || '',
    teaching_stages: stages,
    teaching_grades: grades,
    teaching_track: teacher.teachingTrack || '',
    subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
    daily_hours: teacher.dailyHours ?? null,
    available_period: teacher.availablePeriod || 'الاتنين',
    experience_years: teacher.experienceYears ?? null,
    experience:
      teacher.experienceYears !== undefined ? `${teacher.experienceYears} سنوات خبرة` : '',
    bio: teacher.specialization || '',
    status: teacher.status || 'active',
    updated_at: nowIso,
  };

  try {
    await executeTeachersMutationWithSchemaHealing('upsert', payload, teacher.name.trim());
  } catch (err) {
    console.warn('upsertTeacherInSupabase exception:', err);
  }
}
