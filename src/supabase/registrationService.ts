import { getSupabaseClient, isSupabaseConfigured } from './client';
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
  if (!isSupabaseConfigured()) {
    throw new Error(
      'مفتاح الربط مع Supabase (VITE_SUPABASE_ANON_KEY) غير متوفر في إعدادات البيئة.'
    );
  }
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('تعذر تهيئة الاتصال بـ Supabase.');
  }
  return client;
}

function formatSupabaseError(err: any, tableName: string): string {
  const msg = String(err?.message || '');
  const code = String(err?.code || '');
  if (code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return `صلاحيات RLS على جدول (${tableName}) تمنع الإضافة حالياً — يرجى تطبيق سياسة السماح بالتسجيل (INSERT) في Supabase.`;
  }
  if (code === '42703' || msg.toLowerCase().includes('column')) {
    return `يوجد عدم تطابق في أسماء الأعمدة بجدول (${tableName}): ${msg}`;
  }
  if (code === '23505' || msg.toLowerCase().includes('duplicate')) {
    return 'رقم الهاتف مسجل بالفعل في قاعدة البيانات.';
  }
  return msg || `حدث خطأ أثناء الاتصال بجدول (${tableName}) في Supabase.`;
}

export async function checkStudentPhoneInSupabase(phone: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const clean = normalizePhoneForMatch(phone);
  if (!clean) return false;

  const { data, error } = await supabase
    .from('students')
    .select('id, phone')
    .eq('phone', clean)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

export async function checkTeacherPhoneInSupabase(phone: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const clean = normalizePhoneAuth(phone);
  if (!clean) return false;

  const { data, error } = await supabase
    .from('teachers')
    .select('id, phone')
    .eq('phone', clean)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
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
  const cleanParentPhone = normalizePhoneForMatch(input.parentPhone || input.phone) || input.phone.trim();

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

  // 2. Insert Parent record into `parents` table
  const { error: parentError } = await supabase.from('parents').insert({
    name: input.parentName.trim() || `ولي أمر ${input.name.trim()}`,
    phone: cleanParentPhone,
    student_id: input.id,
    student_name: input.name.trim(),
  });

  if (parentError) {
    throw new Error(formatSupabaseError(parentError, 'parents'));
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
  const { error } = await supabase.from('parents').insert({
    name: input.name.trim(),
    phone: cleanPhone,
    student_id: input.studentId || null,
    student_name: input.studentName || '',
  });
  if (error) {
    throw new Error(formatSupabaseError(error, 'parents'));
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

export async function registerTeacherInSupabase(
  input: SupabaseTeacherInput
): Promise<void> {
  const supabase = requireSupabase();
  const cleanPhone = normalizePhoneAuth(input.phone) || input.phone.trim();

  const { error } = await supabase.from('teachers').insert({
    id: input.id,
    name: input.name.trim(),
    phone: cleanPhone,
    normalized_phone: cleanPhone,
    age: input.age,
    location: input.location.trim(),
    teaching_systems: input.teachingSystems,
    teaching_mode: input.teachingMode,
    teaching_stages: input.teachingStages,
    teaching_grades: input.teachingGrades,
    teaching_track: input.teachingTrack || '',
    subjects: input.subjects,
    daily_hours: input.dailyHours,
    available_period: input.availablePeriod,
    experience_years: input.experienceYears,
    avatar_url: input.avatarUrl || '',
    specialization: input.specialization,
    status: 'pending',
    role: 'teacher',
    registered_by_self: true,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(formatSupabaseError(error, 'teachers'));
  }
}

export async function fetchStudentsFromSupabase(): Promise<Student[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(data)) return [];
  return data.map((row: any) => ({
    id: String(row.id),
    name: row.name || '',
    age: row.age ?? '',
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
  }));
}

export async function fetchTeachersFromSupabase(): Promise<Teacher[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(data)) return [];
  return data.map((row: any) => ({
    id: String(row.id),
    name: row.name || '',
    phone: row.phone || '',
    normalizedPhone: row.normalized_phone || row.phone || '',
    role: 'teacher',
    status: (row.status as TeacherStatus) || 'pending',
    registeredBySelf: Boolean(row.registered_by_self),
    avatarUrl: row.avatar_url || '',
    specialization: row.specialization || '',
    age: row.age ? Number(row.age) : undefined,
    location: row.location || '',
    teachingSystems: row.teaching_systems || 'both',
    teachingMode: row.teaching_mode || 'multiple',
    teachingStages: Array.isArray(row.teaching_stages) ? row.teaching_stages : [],
    teachingGrades: Array.isArray(row.teaching_grades) ? row.teaching_grades : [],
    teachingTrack: row.teaching_track || '',
    subjects: Array.isArray(row.subjects) ? row.subjects : [],
    dailyHours: row.daily_hours ? Number(row.daily_hours) : undefined,
    availablePeriod: row.available_period || 'الاتنين',
    experienceYears:
      row.experience_years !== undefined && row.experience_years !== null
        ? Number(row.experience_years)
        : undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }));
}

export async function updateTeacherStatusInSupabase(
  teacherId: string,
  status: TeacherStatus
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('teachers').update({ status }).eq('id', teacherId);
}
