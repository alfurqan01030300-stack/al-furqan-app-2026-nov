import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocsFromServer,
  query,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, isFirebaseConfigured, OperationType } from './config';
import {
  AcademySettings,
  AppLocalAccount,
  AttendanceRecord,
  AttendanceStatus,
  CertificateRecord,
  EducationStage,
  EducationSystem,
  Exam,
  ExamGradeRecord,
  HalaqaGroup,
  HomeworkAssignment,
  LinkedGoogleAccount,
  ParentRecord,
  PaymentRecord,
  ScheduleAppointment,
  SecondaryTrack,
  Student,
  StudentExamResult,
  StudyScope,
  Teacher,
  TeacherGender,
  TeacherRating,
  TeacherStatus,
  TeacherStudyMode,
  TeacherSystemChoice,
  TrashEntityType,
  TrashItem,
  TrialLesson,
  TrialLessonStatus,
} from '../types';
import { DEFAULT_SETTINGS, normalizePhoneForMatch } from '../utils/storage';
import { normalizePhoneAuth } from '../utils/authStorage';
import {
  DurableAcademyBundle,
  TRASH_RETENTION_MS,
  deriveCertificatesFromStudents,
  deriveParentsFromStudents,
  sanitizeTrashId,
} from '../utils/localDataStore';

function assertAuthenticatedUid(uid: string): string {
  if (!isFirebaseConfigured() || !db || !auth) {
    throw new Error('Firebase is not configured yet.');
  }
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Authentication required: cannot access or store data without Gmail login.');
  }
  return uid;
}

export interface SyncMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

// ---------------- Normalizers ----------------
export function normalizeStudentDoc(id: string, data: Record<string, any>): Student {
  const edSys: EducationSystem | undefined =
    data.educationSystem === 'azhar' || data.educationSystem === 'general'
      ? data.educationSystem
      : undefined;
  const scope: StudyScope | undefined =
    data.studyScope === 'single' || data.studyScope === 'all' ? data.studyScope : undefined;
  const track: SecondaryTrack | '' =
    data.track === 'علمي علوم' || data.track === 'علمي رياضة' || data.track === 'أدبي'
      ? data.track
      : '';

  return {
    id,
    name: data.name || data.studentName || data.fullName || '',
    age: data.age !== undefined && data.age !== null ? String(data.age) : '',
    stage: data.stage || '',
    educationSystem: edSys,
    gradeLevel: data.gradeLevel || '',
    track,
    studyScope: scope,
    selectedSubjects: Array.isArray(data.selectedSubjects) ? data.selectedSubjects : undefined,
    registeredBySelf: Boolean(data.registeredBySelf),
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    phone: data.phone || data.mobile || data.parentPhone || '',
    course: data.course || data.level || 'حفظ القرآن الكريم',
    feeStatus: data.feeStatus === 'paid' ? 'paid' : 'unpaid',
    notes: data.notes || '',
    parentName: data.parentName || data.name || '',
    parentPhone: data.parentPhone || data.phone || '',
    assignedTeacherId: data.assignedTeacherId || '',
    halaqaId: data.halaqaId || '',
    halaqaName: data.halaqaName || '',
    registeredDate: data.registeredDate || new Date().toISOString().split('T')[0],
    stars: typeof data.stars === 'number' ? data.stars : 0,
    totalStarsEarned:
      typeof data.totalStarsEarned === 'number'
        ? data.totalStarsEarned
        : typeof data.stars === 'number'
        ? data.stars
        : 0,
    starCyclesCompleted: typeof data.starCyclesCompleted === 'number' ? data.starCyclesCompleted : 0,
    completedJuz: typeof data.completedJuz === 'number' ? data.completedJuz : 0,
    currentSurah: data.currentSurah || 'سورة الفاتحة',
    subscriptionAmount: typeof data.subscriptionAmount === 'number' ? data.subscriptionAmount : 250,
    nextPaymentDate: data.nextPaymentDate || '',
    lastPaymentDate: data.lastPaymentDate || '',
    certificates: Array.isArray(data.certificates) ? data.certificates : [],
    reports: Array.isArray(data.reports)
      ? data.reports.map((r: any, idx: number) => ({
          id: r.id || `rep-${idx}`,
          date: r.date || new Date().toISOString().split('T')[0],
          newMemorization: r.newMemorization || '',
          nearRevision: r.nearRevision || '',
          farRevision: r.farRevision || '',
          surahFrom: r.surahFrom || '',
          surahTo: r.surahTo || '',
          reportNotes: r.reportNotes || '',
          assistantName: r.assistantName || '',
          halaqaName: r.halaqaName || '',
          teacherName: r.teacherName || '',
          teacherPhone: r.teacherPhone || '',
          level:
            r.level === 'excellent' || r.level === 'medium' || r.level === 'weak'
              ? r.level
              : 'excellent',
          teacherNote: r.teacherNote || '',
          createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
        }))
      : [],
  };
}

export function normalizeTeacherDoc(id: string, data: Record<string, any>): Teacher {
  const rawPhone = data.phone || '';
  const registeredBySelf = Boolean(data.registeredBySelf);
  const resolvedStatus: TeacherStatus =
    data.status === 'pending' || data.status === 'active' || data.status === 'rejected'
      ? data.status
      : registeredBySelf
      ? 'pending'
      : 'active';

  const resolvedGender: TeacherGender | undefined =
    data.gender === 'ذكر' || data.gender === 'أنثى' ? data.gender : undefined;

  const teachingSystems: TeacherSystemChoice | undefined =
    data.teachingSystems === 'general' ||
    data.teachingSystems === 'azhar' ||
    data.teachingSystems === 'both'
      ? data.teachingSystems
      : undefined;

  const teachingMode: TeacherStudyMode | undefined =
    data.teachingMode === 'single' || data.teachingMode === 'multiple'
      ? data.teachingMode
      : undefined;

  const teachingStages: EducationStage[] | undefined = Array.isArray(data.teachingStages)
    ? data.teachingStages.filter(
        (st: any): st is EducationStage => st === 'ابتدائي' || st === 'إعدادي' || st === 'ثانوي'
      )
    : undefined;

  const teachingTrack: SecondaryTrack | '' =
    data.teachingTrack === 'علمي علوم' ||
    data.teachingTrack === 'علمي رياضة' ||
    data.teachingTrack === 'أدبي'
      ? data.teachingTrack
      : '';

  return {
    id,
    name: data.name || data.fullName || '',
    phone: normalizePhoneAuth(rawPhone) || rawPhone,
    normalizedPhone: data.normalizedPhone || normalizePhoneAuth(rawPhone),
    password: data.password || '',
    passwordHash: data.passwordHash || '',
    role: 'teacher',
    status: resolvedStatus,
    registeredBySelf,
    ownerUid: data.ownerUid || '',
    avatarUrl: data.avatarUrl || '',
    specialization: data.specialization || 'تحفيظ القرآن الكريم',
    birthDate: data.birthDate || '',
    age: typeof data.age === 'number' ? data.age : Number(data.age) || undefined,
    gender: resolvedGender,
    location: data.location || '',
    teachingSystems,
    teachingMode,
    teachingStages,
    teachingGrades: Array.isArray(data.teachingGrades) ? data.teachingGrades : undefined,
    teachingTrack,
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    dailyHours: typeof data.dailyHours === 'number' ? data.dailyHours : Number(data.dailyHours) || undefined,
    availablePeriod:
      data.availablePeriod === 'صباحي' ||
      data.availablePeriod === 'مسائي' ||
      data.availablePeriod === 'الاتنين'
        ? data.availablePeriod
        : undefined,
    experienceYears:
      typeof data.experienceYears === 'number'
        ? data.experienceYears
        : Number(data.experienceYears) >= 0 && data.experienceYears !== '' && data.experienceYears !== undefined && data.experienceYears !== null
        ? Number(data.experienceYears)
        : undefined,
    certificates: Array.isArray(data.certificates)
      ? data.certificates.map((c: any, idx: number) => ({
          id: c.id || `cert-${idx}`,
          name: c.name || 'شهادة',
          imageUrl: c.imageUrl || '',
        }))
      : [],
    notes: data.notes || '',
    sessionRate: typeof data.sessionRate === 'number' ? data.sessionRate : 40,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

export function normalizeHalaqaDoc(id: string, data: Record<string, any>): HalaqaGroup {
  return {
    id,
    name: data.name || '',
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    subject: data.subject || 'قرآن كريم',
    scheduleTime: data.scheduleTime || '',
    day: data.day || undefined,
    zoomUrl: data.zoomUrl || '',
    notes: data.notes || '',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

export function normalizeScheduleDoc(id: string, data: Record<string, any>): ScheduleAppointment {
  return {
    id,
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    day: data.day || 'السبت',
    time: data.time || '04:30 مساءً',
    courseType: data.courseType || 'حلقة قرآنية',
    sessionUrl: data.sessionUrl || '',
    notes: data.notes || '',
  };
}

export function normalizeExamDoc(id: string, data: Record<string, any>): Exam {
  const grades: ExamGradeRecord[] = Array.isArray(data.grades)
    ? data.grades.map((g: any, idx: number) => ({
        id: g.id || `grd-${id}-${idx}`,
        studentId: g.studentId || '',
        studentName: g.studentName || '',
        score: typeof g.score === 'number' ? g.score : Number(g.score || 0),
        maxScore:
          typeof g.maxScore === 'number'
            ? g.maxScore
            : typeof data.maxScore === 'number'
            ? data.maxScore
            : 100,
        gradeLabel: g.gradeLabel || 'ممتاز',
        notes: g.notes || '',
        gradedAt: typeof g.gradedAt === 'number' ? g.gradedAt : Date.now(),
      }))
    : [];

  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    title: data.title || 'اختبار',
    subject: data.subject || 'قرآن كريم',
    examDate: data.examDate || new Date().toISOString().split('T')[0],
    maxScore: typeof data.maxScore === 'number' && data.maxScore > 0 ? data.maxScore : 100,
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    halaqaId: data.halaqaId || '',
    halaqaName: data.halaqaName || '',
    description: data.description || '',
    grades,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  };
}

export function normalizeHomeworkDoc(id: string, data: Record<string, any>): HomeworkAssignment {
  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    teacherId: data.teacherId || '',
    teacherName: data.teacherName || '',
    subject: data.subject || 'قرآن كريم',
    educationSystem:
      data.educationSystem === 'general' ||
      data.educationSystem === 'azhar' ||
      data.educationSystem === 'both'
        ? data.educationSystem
        : 'both',
    stage: data.stage || '',
    gradeLevel: data.gradeLevel || '',
    title: data.title || 'واجب',
    description: data.description || '',
    dueDate: data.dueDate || new Date().toISOString().split('T')[0],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
  };
}

export function normalizeTrialLessonDoc(id: string, data: Record<string, any>): TrialLesson {
  return {
    id,
    studentName: data.studentName || data.name || '',
    parentPhone: data.parentPhone || data.phone || '',
    stageOrAge: data.stageOrAge || data.age || '',
    notes: data.notes || '',
    preferredTime: data.preferredTime || '',
    status: ['new', 'contacted', 'scheduled', 'enrolled', 'cancelled'].includes(data.status)
      ? (data.status as TrialLessonStatus)
      : 'new',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

// ---------------- Parents Collection (`parents`) ----------------
export async function saveParentToFirestore(uid: string, parent: ParentRecord): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `parents/${parent.id}`;
  try {
    await setDoc(
      doc(db!, 'parents', parent.id),
      {
        ownerUid: uid,
        name: parent.name,
        phone: parent.phone,
        normalizedPhone: parent.normalizedPhone,
        studentIds: parent.studentIds,
        studentNames: parent.studentNames,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncStudentParentAndCertificatesToFirestore(
  uid: string,
  student: Student
): Promise<void> {
  assertAuthenticatedUid(uid);
  const rawPhone = student.parentPhone || student.phone || '';
  const norm = normalizePhoneForMatch(rawPhone);
  const parentId = norm ? `par_${norm}` : sanitizeTrashId(`par_${student.id}`);

  try {
    const parentRef = doc(db!, 'parents', parentId);
    let existingIds: string[] = [];
    let existingNames: string[] = [];
    try {
      const snap = await getDoc(parentRef);
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.studentIds)) existingIds = d.studentIds;
        if (Array.isArray(d.studentNames)) existingNames = d.studentNames;
      }
    } catch {
      // first write for this parent
    }

    const nextIds = existingIds.includes(student.id)
      ? existingIds
      : [...existingIds, student.id];
    const nextNames = existingNames.includes(student.name)
      ? existingNames
      : [...existingNames, student.name];

    await setDoc(
      parentRef,
      {
        ownerUid: uid,
        name: student.parentName || `ولي أمر ${student.name}`,
        phone: rawPhone,
        normalizedPhone: norm,
        studentIds: nextIds,
        studentNames: nextNames,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `parents/${parentId}`);
  }

  for (const cert of student.certificates || []) {
    await saveCertificateToFirestore(uid, {
      ...cert,
      studentId: cert.studentId || student.id,
      studentName: cert.studentName || student.name,
    });
  }
}

// ---------------- Certificates Collection (`certificates`) ----------------
export async function saveCertificateToFirestore(
  uid: string,
  cert: CertificateRecord
): Promise<void> {
  assertAuthenticatedUid(uid);
  const certId = sanitizeTrashId(cert.id);
  const path = `certificates/${certId}`;
  try {
    await setDoc(
      doc(db!, 'certificates', certId),
      {
        ownerUid: uid,
        studentId: cert.studentId,
        studentName: cert.studentName,
        juzName: cert.juzName,
        completionDate: cert.completionDate,
        type: cert.type,
        createdAt: cert.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- Students Realtime Sync (`students`) ----------------
export function subscribeStudents(
  uid: string,
  onData: (students: Student[], meta: SyncMeta) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `students`;
  try {
    const q = query(collection(db, 'students'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeStudentDoc(docSnap.id, docSnap.data()));
        });
        onData(list, {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveStudentToFirestore(uid: string, student: Student): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `students/${student.id}`;
  try {
    const payload = {
      ownerUid: uid,
      name: student.name,
      age: student.age,
      stage: student.stage || '',
      educationSystem: student.educationSystem || 'general',
      gradeLevel: student.gradeLevel || '',
      track: student.track || '',
      studyScope: student.studyScope || 'all',
      selectedSubjects: student.selectedSubjects || [],
      registeredBySelf: Boolean(student.registeredBySelf),
      phone: student.phone,
      course: student.course,
      feeStatus: student.feeStatus,
      notes: student.notes || '',
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      assignedTeacherId: student.assignedTeacherId || '',
      halaqaId: student.halaqaId || '',
      halaqaName: student.halaqaName || '',
      registeredDate: student.registeredDate,
      reports: student.reports || [],
      stars: student.stars ?? 0,
      totalStarsEarned: student.totalStarsEarned ?? 0,
      starCyclesCompleted: student.starCyclesCompleted ?? 0,
      completedJuz: student.completedJuz ?? 0,
      currentSurah: student.currentSurah || '',
      subscriptionAmount: student.subscriptionAmount ?? 250,
      nextPaymentDate: student.nextPaymentDate || '',
      lastPaymentDate: student.lastPaymentDate || '',
      certificates: student.certificates || [],
      updatedAt: Date.now(),
    };
    await setDoc(doc(db!, 'students', student.id), payload, { merge: true });
    await syncStudentParentAndCertificatesToFirestore(uid, student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export function subscribePublicStudents(
  onData: (students: Student[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'students';
  try {
    return onSnapshot(
      collection(db, 'students'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeStudentDoc(docSnap.id, docSnap.data()));
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function findStudentInFirestoreByPhone(rawOrNormalizedPhone: string): Promise<Student | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const targetNorm = normalizePhoneForMatch(rawOrNormalizedPhone);
  if (!targetNorm) return null;

  try {
    let allSnap;
    try {
      allSnap = await getDocsFromServer(collection(db, 'students'));
    } catch {
      allSnap = await getDocs(collection(db, 'students'));
    }
    for (const d of allSnap.docs) {
      const data = d.data();
      const docPhone = normalizePhoneForMatch(data.phone || '');
      const docParentPhone = normalizePhoneForMatch(data.parentPhone || '');
      if ((docPhone && docPhone === targetNorm) || (docParentPhone && docParentPhone === targetNorm)) {
        return normalizeStudentDoc(d.id, data);
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'students');
    return null;
  }
}

export async function registerStudentAccountInFirestore(
  student: Student
): Promise<{ student: Student; alreadyExists?: boolean }> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `students/${student.id}`;
  try {
    await setDoc(
      doc(db, 'students', student.id),
      {
        ownerUid: student.ownerUid || 'academy_shared',
        name: student.name,
        age: student.age,
        stage: student.stage || '',
        educationSystem: student.educationSystem || 'general',
        gradeLevel: student.gradeLevel || '',
        track: student.track || '',
        studyScope: student.studyScope || 'all',
        selectedSubjects: student.selectedSubjects || [],
        registeredBySelf: true,
        phone: student.phone,
        course: student.course,
        feeStatus: student.feeStatus || 'unpaid',
        notes: student.notes || '',
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        assignedTeacherId: student.assignedTeacherId || '',
        halaqaId: student.halaqaId || '',
        halaqaName: student.halaqaName || '',
        registeredDate: student.registeredDate,
        reports: [],
        stars: 0,
        totalStarsEarned: 0,
        starCyclesCompleted: 0,
        completedJuz: 0,
        currentSurah: student.currentSurah || 'سورة الفاتحة',
        subscriptionAmount: student.subscriptionAmount ?? 250,
        nextPaymentDate: student.nextPaymentDate || '',
        lastPaymentDate: '',
        certificates: [],
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return { student };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteStudentFromFirestore(uid: string, studentId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db!, 'students', studentId));
    await deleteDoc(doc(db!, 'users', uid, 'students', studentId)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Teachers Realtime Sync & Auth Lookup (`teachers`) ----------------
export function subscribeTeachers(
  _uid: string | undefined,
  onData: (teachers: Teacher[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `teachers`;
  try {
    return onSnapshot(
      collection(db, 'teachers'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeTeacherDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTeacherToFirestore(
  uid: string | undefined,
  teacher: Teacher
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `teachers/${teacher.id}`;
  const normalized = teacher.normalizedPhone || normalizePhoneAuth(teacher.phone);
  try {
    await setDoc(
      doc(db, 'teachers', teacher.id),
      {
        ownerUid: uid || teacher.ownerUid || 'academy_shared',
        name: teacher.name,
        phone: normalized || teacher.phone,
        normalizedPhone: normalized,
        password: teacher.password || '',
        passwordHash: teacher.passwordHash || '',
        role: 'teacher',
        status: teacher.status || (teacher.registeredBySelf ? 'pending' : 'active'),
        registeredBySelf: Boolean(teacher.registeredBySelf),
        avatarUrl: teacher.avatarUrl || '',
        specialization: teacher.specialization || 'تحفيظ القرآن الكريم',
        birthDate: teacher.birthDate || '',
        age: teacher.age ?? null,
        gender: teacher.gender || null,
        location: teacher.location || '',
        teachingSystems: teacher.teachingSystems || 'both',
        teachingMode: teacher.teachingMode || 'multiple',
        teachingStages: teacher.teachingStages || [],
        teachingGrades: teacher.teachingGrades || [],
        teachingTrack: teacher.teachingTrack || '',
        subjects: teacher.subjects || [],
        dailyHours: teacher.dailyHours ?? null,
        availablePeriod: teacher.availablePeriod || null,
        experienceYears: teacher.experienceYears ?? null,
        certificates: teacher.certificates || [],
        notes: teacher.notes || '',
        sessionRate: teacher.sessionRate ?? 40,
        createdAt: teacher.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateTeacherStatusInFirestore(
  teacherId: string,
  status: TeacherStatus
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `teachers/${teacherId}`;
  try {
    await setDoc(
      doc(db, 'teachers', teacherId),
      {
        status,
        role: 'teacher',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function fetchAllTeachersFromFirestore(): Promise<Teacher[]> {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    let snap;
    try {
      snap = await getDocsFromServer(collection(db, 'teachers'));
    } catch {
      snap = await getDocs(collection(db, 'teachers'));
    }
    const list: Teacher[] = [];
    snap.forEach((d) => list.push(normalizeTeacherDoc(d.id, d.data())));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'teachers');
    return [];
  }
}

export async function findTeacherInFirestoreByPhone(rawOrNormalizedPhone: string): Promise<Teacher | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const targetNorm = normalizePhoneAuth(rawOrNormalizedPhone);
  if (!targetNorm) return null;

  try {
    let exactSnap;
    const q = query(collection(db, 'teachers'), where('normalizedPhone', '==', targetNorm));
    try {
      exactSnap = await getDocsFromServer(q);
    } catch {
      exactSnap = await getDocs(q);
    }
    if (!exactSnap.empty) {
      const firstDoc = exactSnap.docs[0];
      return normalizeTeacherDoc(firstDoc.id, firstDoc.data());
    }

    // Fallback scan for older teacher documents saved without normalizedPhone
    let allSnap;
    try {
      allSnap = await getDocsFromServer(collection(db, 'teachers'));
    } catch {
      allSnap = await getDocs(collection(db, 'teachers'));
    }
    for (const d of allSnap.docs) {
      const data = d.data();
      const docNorm = normalizePhoneAuth(data.normalizedPhone || data.phone || '');
      if (docNorm && docNorm === targetNorm) {
        return normalizeTeacherDoc(d.id, data);
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'teachers');
    return null;
  }
}

export async function registerTeacherAccountInFirestore(params: {
  name: string;
  phone: string;
  password?: string;
  passwordHash?: string;
  age?: number;
  birthDate?: string;
  gender?: TeacherGender;
  location?: string;
  teachingSystems?: TeacherSystemChoice;
  teachingMode?: TeacherStudyMode;
  teachingStages?: EducationStage[];
  teachingGrades?: string[];
  teachingTrack?: SecondaryTrack | '';
  subjects?: string[];
  dailyHours?: number;
  availablePeriod?: 'صباحي' | 'مسائي' | 'الاتنين';
  experienceYears?: number;
  avatarUrl?: string;
  certificates?: { id?: string; name: string; imageUrl: string }[];
  specialization?: string;
  sessionRate?: number;
  ownerUid?: string;
}): Promise<{ teacher: Teacher; alreadyExists?: boolean }> {
  const normalizedPhone = normalizePhoneAuth(params.phone);
  const now = Date.now();
  const existing = await findTeacherInFirestoreByPhone(normalizedPhone).catch(() => null);

  if (existing) {
    return { teacher: existing, alreadyExists: true };
  }

  const subjects = Array.isArray(params.subjects) ? params.subjects : [];
  const newTeacher: Teacher = {
    id: `tch-${normalizedPhone}-${now}`,
    name: params.name.trim(),
    phone: normalizedPhone,
    normalizedPhone,
    password: params.password || '',
    passwordHash: params.passwordHash || '',
    role: 'teacher',
    status: 'pending',
    registeredBySelf: true,
    ownerUid: params.ownerUid || 'academy_shared',
    avatarUrl: params.avatarUrl || '',
    age: params.age,
    birthDate: params.birthDate,
    gender: params.gender,
    location: params.location || '',
    teachingSystems: params.teachingSystems || 'both',
    teachingMode: params.teachingMode || 'multiple',
    teachingStages: params.teachingStages || [],
    teachingGrades: params.teachingGrades || [],
    teachingTrack: params.teachingTrack || '',
    subjects,
    dailyHours: params.dailyHours,
    availablePeriod: params.availablePeriod,
    experienceYears: params.experienceYears,
    certificates: params.certificates || [],
    specialization: params.specialization || subjects.join(' • ') || 'قرآن كريم',
    notes: '',
    sessionRate: params.sessionRate ?? 40,
    createdAt: now,
  };

  await saveTeacherToFirestore(newTeacher.ownerUid, newTeacher);
  return { teacher: newTeacher };
}

export async function findParentInFirestoreByPhone(rawOrNormalizedPhone: string): Promise<ParentRecord | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const targetNorm = normalizePhoneAuth(rawOrNormalizedPhone);
  if (!targetNorm) return null;

  try {
    const q = query(collection(db, 'parents'), where('normalizedPhone', '==', targetNorm));
    let exactSnap;
    try {
      exactSnap = await getDocsFromServer(q);
    } catch {
      exactSnap = await getDocs(q);
    }
    if (!exactSnap.empty) {
      const d = exactSnap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'ولي أمر',
        phone: data.phone || targetNorm,
        normalizedPhone: data.normalizedPhone || targetNorm,
        password: data.password,
        passwordHash: data.passwordHash,
        role: 'parent',
        studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
        studentNames: Array.isArray(data.studentNames) ? data.studentNames : [],
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      };
    }

    // Fallback scan over parents collection normalizing stored phone
    let allParents;
    try {
      allParents = await getDocsFromServer(collection(db, 'parents'));
    } catch {
      allParents = await getDocs(collection(db, 'parents'));
    }
    for (const d of allParents.docs) {
      const data = d.data();
      const docNorm = normalizePhoneAuth(data.normalizedPhone || data.phone || '');
      if (docNorm && docNorm === targetNorm) {
        return {
          id: d.id,
          name: data.name || 'ولي أمر',
          phone: data.phone || targetNorm,
          normalizedPhone: docNorm,
          password: data.password,
          passwordHash: data.passwordHash,
          role: 'parent',
          studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
          studentNames: Array.isArray(data.studentNames) ? data.studentNames : [],
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
      }
    }

    // Fallback check publicParentLinks if saved under normalized phone or last 9 digits
    const candidateKeys = [`phone_${targetNorm}`];
    if (targetNorm.length > 9) {
      candidateKeys.push(`phone_${targetNorm.slice(-9)}`);
    }
    for (const key of candidateKeys) {
      const snap = await getDoc(doc(db, 'publicParentLinks', key)).catch(() => null);
      if (snap && snap.exists()) {
        const d = snap.data();
        const st = d?.student;
        if (st) {
          return {
            id: `par_${targetNorm}`,
            name: st.parentName || `ولي أمر ${st.name}`,
            phone: st.parentPhone || st.phone || targetNorm,
            normalizedPhone: targetNorm,
            role: 'parent',
            studentIds: [st.id],
            studentNames: [st.name],
            updatedAt: Date.now(),
          };
        }
      }
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'parents');
    return null;
  }
}

export async function fetchTeacherPortalDataFromFirestore(teacherId: string): Promise<{
  schedules: ScheduleAppointment[];
  students: Student[];
  attendance: AttendanceRecord[];
}> {
  if (!isFirebaseConfigured() || !db || !teacherId) {
    return { schedules: [], students: [], attendance: [] };
  }
  try {
    const [schSnap, stdSnap, attSnap] = await Promise.all([
      getDocs(query(collection(db, 'schedules'), where('teacherId', '==', teacherId))).catch(() => null),
      getDocs(query(collection(db, 'students'), where('assignedTeacherId', '==', teacherId))).catch(() => null),
      getDocs(query(collection(db, 'attendance'), where('teacherId', '==', teacherId))).catch(() => null),
    ]);
    const schedules: ScheduleAppointment[] = [];
    schSnap?.forEach((d) => schedules.push(normalizeScheduleDoc(d.id, d.data())));
    const students: Student[] = [];
    stdSnap?.forEach((d) => students.push(normalizeStudentDoc(d.id, d.data())));
    const attendance: AttendanceRecord[] = [];
    attSnap?.forEach((d) => {
      const data = d.data();
      attendance.push({
        id: d.id,
        scheduleId: data.scheduleId || '',
        studentId: data.studentId || '',
        studentName: data.studentName || '',
        teacherId: data.teacherId || '',
        teacherName: data.teacherName || '',
        date: data.date || new Date().toISOString().split('T')[0],
        status: (data.status === 'absent' ? 'absent' : 'present') as AttendanceStatus,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      });
    });
    return { schedules, students, attendance };
  } catch {
    return { schedules: [], students: [], attendance: [] };
  }
}

export async function deleteTeacherFromFirestore(
  uid: string | undefined,
  teacherId: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `teachers/${teacherId}`;
  try {
    await deleteDoc(doc(db, 'teachers', teacherId));
    if (uid) {
      await deleteDoc(doc(db, 'users', uid, 'teachers', teacherId)).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Schedules Realtime Sync (`schedules`) ----------------
export function subscribeSchedules(
  uid: string,
  onData: (schedules: ScheduleAppointment[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `schedules`;
  try {
    const q = query(collection(db, 'schedules'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: ScheduleAppointment[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeScheduleDoc(docSnap.id, docSnap.data()));
        });
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveScheduleToFirestore(
  uid: string,
  schedule: ScheduleAppointment
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `schedules/${schedule.id}`;
  try {
    await setDoc(
      doc(db!, 'schedules', schedule.id),
      {
        ownerUid: uid,
        studentId: schedule.studentId,
        studentName: schedule.studentName,
        teacherId: schedule.teacherId,
        teacherName: schedule.teacherName,
        day: schedule.day,
        time: schedule.time,
        courseType: schedule.courseType || '',
        sessionUrl: schedule.sessionUrl || '',
        notes: schedule.notes || '',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteScheduleFromFirestore(uid: string, scheduleId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `schedules/${scheduleId}`;
  try {
    await deleteDoc(doc(db!, 'schedules', scheduleId));
    await deleteDoc(doc(db!, 'users', uid, 'schedules', scheduleId)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Halaqat Groups Realtime Sync (`halaqat`) ----------------
export function subscribeHalaqat(
  uid: string,
  onData: (halaqat: HalaqaGroup[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'halaqat';
  try {
    const q = query(collection(db, 'halaqat'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: HalaqaGroup[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeHalaqaDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveHalaqaToFirestore(uid: string, halaqa: HalaqaGroup): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `halaqat/${halaqa.id}`;
  try {
    await setDoc(
      doc(db!, 'halaqat', halaqa.id),
      {
        ownerUid: uid,
        name: halaqa.name,
        teacherId: halaqa.teacherId,
        teacherName: halaqa.teacherName,
        subject: halaqa.subject,
        scheduleTime: halaqa.scheduleTime,
        day: halaqa.day || '',
        zoomUrl: halaqa.zoomUrl || '',
        notes: halaqa.notes || '',
        createdAt: halaqa.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteHalaqaFromFirestore(uid: string, halaqaId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `halaqat/${halaqaId}`;
  try {
    await deleteDoc(doc(db!, 'halaqat', halaqaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Exams & Student Grades Realtime Sync (`exams`) ----------------
export function subscribeExams(
  _uid: string | undefined,
  onData: (exams: Exam[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'exams';
  try {
    return onSnapshot(
      collection(db, 'exams'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: Exam[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeExamDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveExamToFirestore(uid: string | undefined, exam: Exam): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `exams/${exam.id}`;
  try {
    await setDoc(
      doc(db, 'exams', exam.id),
      {
        ownerUid: exam.ownerUid || uid || 'academy_shared',
        title: exam.title,
        subject: exam.subject || 'قرآن كريم',
        examDate: exam.examDate,
        maxScore: exam.maxScore || 100,
        teacherId: exam.teacherId,
        teacherName: exam.teacherName,
        halaqaId: exam.halaqaId || '',
        halaqaName: exam.halaqaName || '',
        description: exam.description || '',
        grades: exam.grades || [],
        createdAt: exam.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteExamFromFirestore(uid: string | undefined, examId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  if (!uid || !auth?.currentUser) return;
  const path = `exams/${examId}`;
  try {
    await deleteDoc(doc(db, 'exams', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Homeworks Realtime Sync (`homeworks`) ----------------
export function subscribeHomeworks(
  _uid: string | undefined,
  onData: (homeworks: HomeworkAssignment[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = 'homeworks';
  try {
    return onSnapshot(
      collection(db, 'homeworks'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: HomeworkAssignment[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeHomeworkDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveHomeworkToFirestore(
  uid: string | undefined,
  homework: HomeworkAssignment
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured yet.');
  }
  const path = `homeworks/${homework.id}`;
  try {
    await setDoc(
      doc(db, 'homeworks', homework.id),
      {
        ownerUid: homework.ownerUid || uid || 'academy_shared',
        teacherId: homework.teacherId,
        teacherName: homework.teacherName,
        subject: homework.subject || 'قرآن كريم',
        educationSystem: homework.educationSystem || 'both',
        stage: homework.stage || '',
        gradeLevel: homework.gradeLevel || '',
        title: homework.title,
        description: homework.description || '',
        dueDate: homework.dueDate,
        createdAt: homework.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteHomeworkFromFirestore(
  _uid: string | undefined,
  homeworkId: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const path = `homeworks/${homeworkId}`;
  try {
    await deleteDoc(doc(db, 'homeworks', homeworkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Attendance Realtime Sync (`attendance`) ----------------
export function subscribeAttendance(
  uid: string,
  onData: (records: AttendanceRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `attendance`;
  try {
    const q = query(collection(db, 'attendance'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            scheduleId: data.scheduleId || '',
            halaqaId: data.halaqaId || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            date: data.date || new Date().toISOString().split('T')[0],
            status: (data.status === 'absent' ? 'absent' : 'present') as AttendanceStatus,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveAttendanceToFirestore(
  uid: string,
  record: AttendanceRecord
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `attendance/${record.id}`;
  try {
    await setDoc(
      doc(db!, 'attendance', record.id),
      {
        ownerUid: uid,
        scheduleId: record.scheduleId || '',
        halaqaId: record.halaqaId || '',
        studentId: record.studentId,
        studentName: record.studentName,
        teacherId: record.teacherId,
        teacherName: record.teacherName,
        date: record.date,
        status: record.status,
        createdAt: record.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Payments Realtime Sync (`payments`) ----------------
export function subscribePayments(
  uid: string,
  onData: (payments: PaymentRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `payments`;
  try {
    const q = query(collection(db, 'payments'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: PaymentRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            receiptNumber: data.receiptNumber || docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
            currency: data.currency || 'ر.س',
            date: data.date || new Date().toISOString().split('T')[0],
            monthKey:
              data.monthKey ||
              (data.date ? String(data.date).slice(0, 7) : new Date().toISOString().slice(0, 7)),
            notes: data.notes || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function savePaymentToFirestore(uid: string, payment: PaymentRecord): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `payments/${payment.id}`;
  try {
    await setDoc(
      doc(db!, 'payments', payment.id),
      {
        ownerUid: uid,
        receiptNumber: payment.receiptNumber,
        studentId: payment.studentId,
        studentName: payment.studentName,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.date,
        monthKey: payment.monthKey,
        notes: payment.notes || '',
        createdAt: payment.createdAt || Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Teacher Ratings Realtime Sync (`teacherRatings`) ----------------
export function subscribeTeacherRatings(
  uid: string,
  onData: (ratings: TeacherRating[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `teacherRatings`;
  try {
    const q = query(collection(db, 'teacherRatings'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: TeacherRating[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            parentPhone: data.parentPhone || '',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            comment: data.comment || '',
            date: data.date || new Date().toISOString().split('T')[0],
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTeacherRatingToFirestore(
  uid: string,
  rating: TeacherRating
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `teacherRatings/${rating.id}`;
  try {
    await setDoc(
      doc(db!, 'teacherRatings', rating.id),
      {
        ownerUid: uid,
        teacherId: rating.teacherId,
        teacherName: rating.teacherName,
        studentId: rating.studentId,
        studentName: rating.studentName,
        parentPhone: rating.parentPhone,
        rating: rating.rating,
        comment: rating.comment || '',
        date: rating.date,
        createdAt: rating.createdAt || Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Settings Realtime Sync (`settings`) ----------------
export function subscribeSettings(
  uid: string,
  onData: (settings: AcademySettings) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const docId = sanitizeTrashId(`academy_${uid}`);
  const path = `settings/${docId}`;
  try {
    return onSnapshot(
      doc(db, 'settings', docId),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData({
            academyName: data.academyName || DEFAULT_SETTINGS.academyName,
            logoDataUrl: data.logoDataUrl || '',
            loginBannerUrl: data.loginBannerUrl || '',
            managerWhatsApp: data.managerWhatsApp || '',
            managerPin: typeof data.managerPin === 'string' && data.managerPin.trim() ? data.managerPin.trim() : undefined,
            managerPinConfigured:
              typeof data.managerPinConfigured === 'boolean'
                ? data.managerPinConfigured
                : undefined,
            slogan: data.slogan || '',
            email: data.email || auth?.currentUser?.email || '',
            address: data.address || '',
            currency: data.currency || 'ر.س',
            defaultSessionRate:
              typeof data.defaultSessionRate === 'number' ? data.defaultSessionRate : 40,
            defaultSubscriptionAmount:
              typeof data.defaultSubscriptionAmount === 'number'
                ? data.defaultSubscriptionAmount
                : 250,
          });
        } else {
          onData({
            ...DEFAULT_SETTINGS,
            email: auth?.currentUser?.email || '',
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

export async function saveSettingsToFirestore(
  uid: string,
  settings: AcademySettings
): Promise<void> {
  assertAuthenticatedUid(uid);
  const docId = sanitizeTrashId(`academy_${uid}`);
  const path = `settings/${docId}`;
  try {
    await setDoc(
      doc(db!, 'settings', docId),
      {
        ...settings,
        ownerUid: uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Public Login Banner Sync (Visible to All Visitors) ----------------
export function subscribePublicLoginBanner(
  onData: (loginBannerUrl: string, exists: boolean) => void
): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      doc(db, 'publicConfig', 'loginBanner'),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData(typeof data.loginBannerUrl === 'string' ? data.loginBannerUrl : '', true);
        } else {
          onData('', false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'publicConfig/loginBanner');
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'publicConfig/loginBanner');
    return () => {};
  }
}

export async function savePublicLoginBanner(
  uid: string,
  loginBannerUrl: string
): Promise<{ publicSaved: boolean; permissionDenied: boolean }> {
  assertAuthenticatedUid(uid);
  const path = 'publicConfig/loginBanner';
  try {
    await setDoc(
      doc(db!, 'publicConfig', 'loginBanner'),
      {
        loginBannerUrl,
        updatedAt: Date.now(),
        updatedBy: uid,
      },
      { merge: true }
    );
    return { publicSaved: true, permissionDenied: false };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
    const msg = error?.message || '';
    const isPerm = error?.code === 'permission-denied' || msg.includes('permission-denied');
    return { publicSaved: false, permissionDenied: isPerm };
  }
}

// ---------------- Public Academy Logo Sync (Visible Before & After Login) ----------------
export function subscribePublicAcademyLogo(
  onData: (logoDataUrl: string, exists: boolean) => void
): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      doc(db, 'publicConfig', 'academyLogo'),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData(typeof data.logoDataUrl === 'string' ? data.logoDataUrl : '', true);
        } else {
          onData('', false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'publicConfig/academyLogo');
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'publicConfig/academyLogo');
    return () => {};
  }
}

export async function savePublicAcademyLogo(
  uid: string,
  logoDataUrl: string
): Promise<{ publicSaved: boolean; permissionDenied: boolean }> {
  assertAuthenticatedUid(uid);
  const path = 'publicConfig/academyLogo';
  try {
    await setDoc(
      doc(db!, 'publicConfig', 'academyLogo'),
      {
        logoDataUrl,
        updatedAt: Date.now(),
        updatedBy: uid,
      },
      { merge: true }
    );
    return { publicSaved: true, permissionDenied: false };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
    const msg = error?.message || '';
    const isPerm = error?.code === 'permission-denied' || msg.includes('permission-denied');
    return { publicSaved: false, permissionDenied: isPerm };
  }
}

export interface PublicLinkPreviewData {
  academyName: string;
  description: string;
  logoDataUrl: string;
  updatedAt: number;
}

export function subscribePublicLinkPreview(
  onData: (data: PublicLinkPreviewData, exists: boolean) => void
): Unsubscribe {
  if (!db) return () => {};
  try {
    return onSnapshot(
      doc(db, 'publicConfig', 'linkPreview'),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData(
            {
              academyName: typeof data.academyName === 'string' ? data.academyName : '',
              description: typeof data.description === 'string' ? data.description : '',
              logoDataUrl: typeof data.logoDataUrl === 'string' ? data.logoDataUrl : '',
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
            },
            true
          );
        } else {
          onData({ academyName: '', description: '', logoDataUrl: '', updatedAt: 0 }, false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'publicConfig/linkPreview');
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'publicConfig/linkPreview');
    return () => {};
  }
}

export async function savePublicLinkPreview(
  uid: string,
  preview: PublicLinkPreviewData
): Promise<{ publicSaved: boolean; permissionDenied: boolean }> {
  assertAuthenticatedUid(uid);
  const path = 'publicConfig/linkPreview';
  try {
    await setDoc(
      doc(db!, 'publicConfig', 'linkPreview'),
      {
        academyName: preview.academyName,
        description: preview.description,
        logoDataUrl: preview.logoDataUrl,
        updatedAt: preview.updatedAt || Date.now(),
        updatedBy: uid,
      },
      { merge: true }
    );
    return { publicSaved: true, permissionDenied: false };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
    const msg = error?.message || '';
    const isPerm = error?.code === 'permission-denied' || msg.includes('permission-denied');
    return { publicSaved: false, permissionDenied: isPerm };
  }
}

// ---------------- Trial Lessons Realtime Sync (`trialLessons`) ----------------
export function subscribeTrialLessons(
  uid: string,
  onData: (lessons: TrialLesson[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `trialLessons`;
  try {
    const q = query(collection(db, 'trialLessons'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const list: TrialLesson[] = [];
        snapshot.forEach((docSnap) => {
          list.push(normalizeTrialLessonDoc(docSnap.id, docSnap.data()));
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTrialLessonToFirestore(uid: string, lesson: TrialLesson): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `trialLessons/${lesson.id}`;
  try {
    await setDoc(
      doc(db!, 'trialLessons', lesson.id),
      {
        ownerUid: uid,
        studentName: lesson.studentName,
        parentPhone: lesson.parentPhone,
        stageOrAge: lesson.stageOrAge,
        notes: lesson.notes || '',
        preferredTime: lesson.preferredTime || '',
        status: lesson.status || 'new',
        createdAt: lesson.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateTrialLessonStatusInFirestore(
  uid: string,
  lessonId: string,
  status: TrialLessonStatus
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `trialLessons/${lessonId}`;
  try {
    await setDoc(
      doc(db!, 'trialLessons', lessonId),
      {
        ownerUid: uid,
        status,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteTrialLessonFromFirestore(uid: string, lessonId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `trialLessons/${lessonId}`;
  try {
    await deleteDoc(doc(db!, 'trialLessons', lessonId));
    await deleteDoc(doc(db!, 'users', uid, 'trialLessons', lessonId)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- 30-Day Trash Bin Sync (`trash`) ----------------
export function subscribeTrash(
  uid: string,
  onData: (items: TrashItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `trash`;
  try {
    const q = query(collection(db, 'trash'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const now = Date.now();
        const active: TrashItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const deletedAt = typeof d.deletedAt === 'number' ? d.deletedAt : now;
          const purgeAt = typeof d.purgeAt === 'number' ? d.purgeAt : deletedAt + TRASH_RETENTION_MS;
          if (purgeAt <= now) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          const entityType: TrashEntityType = ['student', 'teacher', 'schedule', 'halaqa', 'trialLesson'].includes(
            d.entityType
          )
            ? d.entityType
            : 'student';
          active.push({
            id: docSnap.id,
            entityId: d.entityId || docSnap.id,
            entityType,
            title: d.title || 'سجل محذوف',
            subtitle: d.subtitle || '',
            data: d.data || {},
            deletedAt,
            purgeAt,
          });
        });
        active.sort((a, b) => b.deletedAt - a.deletedAt);
        onData(active);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTrashItemToFirestore(uid: string, item: TrashItem): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `trash/${item.id}`;
  try {
    await setDoc(
      doc(db!, 'trash', item.id),
      {
        ownerUid: uid,
        entityId: item.entityId,
        entityType: item.entityType,
        title: item.title,
        subtitle: item.subtitle || '',
        data: item.data,
        deletedAt: item.deletedAt,
        purgeAt: item.purgeAt,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTrashItemFromFirestore(uid: string, trashId: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `trash/${trashId}`;
  try {
    await deleteDoc(doc(db!, 'trash', trashId));
    await deleteDoc(doc(db!, 'users', uid, 'trash', trashId)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ---------------- Live Server Read & Collection Counts ----------------
export async function getFirestoreCollectionCounts(uid: string): Promise<{
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
  certificatesCount: number;
  fromServer: boolean;
}> {
  if (!isFirebaseConfigured() || !db || !auth?.currentUser || auth.currentUser.uid !== uid) {
    return {
      studentsCount: 0,
      teachersCount: 0,
      parentsCount: 0,
      certificatesCount: 0,
      fromServer: false,
    };
  }

  try {
    const [studentsSnap, teachersSnap, parentsSnap, certsSnap] = await Promise.all([
      getDocsFromServer(query(collection(db, 'students'), where('ownerUid', '==', uid))),
      getDocsFromServer(collection(db, 'teachers')),
      getDocsFromServer(query(collection(db, 'parents'), where('ownerUid', '==', uid))),
      getDocsFromServer(query(collection(db, 'certificates'), where('ownerUid', '==', uid))),
    ]);
    return {
      studentsCount: studentsSnap.size,
      teachersCount: teachersSnap.size,
      parentsCount: parentsSnap.size,
      certificatesCount: certsSnap.size,
      fromServer: true,
    };
  } catch {
    try {
      const [studentsSnap, teachersSnap, parentsSnap, certsSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('ownerUid', '==', uid))),
        getDocs(collection(db, 'teachers')),
        getDocs(query(collection(db, 'parents'), where('ownerUid', '==', uid))),
        getDocs(query(collection(db, 'certificates'), where('ownerUid', '==', uid))),
      ]);
      return {
        studentsCount: studentsSnap.size,
        teachersCount: teachersSnap.size,
        parentsCount: parentsSnap.size,
        certificatesCount: certsSnap.size,
        fromServer: false,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'students');
      return {
        studentsCount: 0,
        teachersCount: 0,
        parentsCount: 0,
        certificatesCount: 0,
        fromServer: false,
      };
    }
  }
}

/**
 * Server-first Firestore read on app launch + Non-Destructive Migration
 * (also imports any legacy /users/{uid}/... docs and local offline additions cleanly).
 */
export async function migrateLocalBundleToFirestore(
  uid: string,
  bundle: DurableAcademyBundle
): Promise<{
  migratedCount: number;
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
  certificatesCount: number;
}> {
  assertAuthenticatedUid(uid);
  const database = db!;

  const settingsDocId = sanitizeTrashId(`academy_${uid}`);

  const [
    remoteStudentsSnap,
    remoteTeachersSnap,
    remoteSchedulesSnap,
    remoteAttendanceSnap,
    remotePaymentsSnap,
    remoteRatingsSnap,
    remoteTrialSnap,
    remoteTrashSnap,
    remoteParentsSnap,
    remoteCertificatesSnap,
    remoteSettingsSnap,
  ] = await Promise.all([
    getDocsFromServer(query(collection(database, 'students'), where('ownerUid', '==', uid))).catch(() =>
      getDocs(query(collection(database, 'students'), where('ownerUid', '==', uid)))
    ),
    getDocsFromServer(collection(database, 'teachers')).catch(() =>
      getDocs(collection(database, 'teachers'))
    ),
    getDocs(query(collection(database, 'schedules'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'attendance'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'payments'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'teacherRatings'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'trialLessons'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'trash'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'parents'), where('ownerUid', '==', uid))),
    getDocs(query(collection(database, 'certificates'), where('ownerUid', '==', uid))),
    getDoc(doc(database, 'settings', settingsDocId)),
  ]);

  const remoteStudentIds = new Set(remoteStudentsSnap.docs.map((d) => d.id));
  const remoteTeacherIds = new Set(remoteTeachersSnap.docs.map((d) => d.id));
  const remoteScheduleIds = new Set(remoteSchedulesSnap.docs.map((d) => d.id));
  const remoteAttendanceIds = new Set(remoteAttendanceSnap.docs.map((d) => d.id));
  const remotePaymentIds = new Set(remotePaymentsSnap.docs.map((d) => d.id));
  const remoteRatingIds = new Set(remoteRatingsSnap.docs.map((d) => d.id));
  const remoteTrialIds = new Set(remoteTrialSnap.docs.map((d) => d.id));
  const remoteTrashIds = new Set(remoteTrashSnap.docs.map((d) => d.id));
  const remoteParentIds = new Set(remoteParentsSnap.docs.map((d) => d.id));
  const remoteCertIds = new Set(remoteCertificatesSnap.docs.map((d) => d.id));

  const remoteTrashEntityIds = new Set<string>();
  remoteTrashSnap.docs.forEach((d) => {
    const eid = d.data()?.entityId;
    if (eid) remoteTrashEntityIds.add(String(eid));
  });

  const localTrashEntityIds = new Set(bundle.trash.map((t) => t.entityId));
  let migratedCount = 0;

  // 1. Migrate any legacy /users/{uid}/... records seamlessly into top-level collections
  try {
    const [legacyStudents, legacyTeachers, legacySchedules, legacyAtt, legacyPay, legacyRates, legacyTrials, legacyTrash, legacySettings] =
      await Promise.all([
        getDocs(collection(database, 'users', uid, 'students')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'teachers')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'schedules')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'attendance')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'payments')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'teacherRatings')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'trialLessons')).catch(() => null),
        getDocs(collection(database, 'users', uid, 'trash')).catch(() => null),
        getDoc(doc(database, 'users', uid, 'settings', 'academy')).catch(() => null),
      ]);

    if (legacyStudents) {
      for (const d of legacyStudents.docs) {
        if (!remoteStudentIds.has(d.id) && !remoteTrashEntityIds.has(d.id) && !localTrashEntityIds.has(d.id)) {
          await saveStudentToFirestore(uid, normalizeStudentDoc(d.id, d.data()));
          remoteStudentIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyTeachers) {
      for (const d of legacyTeachers.docs) {
        if (!remoteTeacherIds.has(d.id) && !remoteTrashEntityIds.has(d.id) && !localTrashEntityIds.has(d.id)) {
          await saveTeacherToFirestore(uid, normalizeTeacherDoc(d.id, d.data()));
          remoteTeacherIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacySchedules) {
      for (const d of legacySchedules.docs) {
        if (!remoteScheduleIds.has(d.id) && !remoteTrashEntityIds.has(d.id) && !localTrashEntityIds.has(d.id)) {
          await saveScheduleToFirestore(uid, normalizeScheduleDoc(d.id, d.data()));
          remoteScheduleIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyAtt) {
      for (const d of legacyAtt.docs) {
        if (!remoteAttendanceIds.has(d.id)) {
          const data = d.data();
          await saveAttendanceToFirestore(uid, {
            id: d.id,
            scheduleId: data.scheduleId || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            date: data.date || new Date().toISOString().split('T')[0],
            status: data.status === 'absent' ? 'absent' : 'present',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
          remoteAttendanceIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyPay) {
      for (const d of legacyPay.docs) {
        if (!remotePaymentIds.has(d.id)) {
          const data = d.data();
          await savePaymentToFirestore(uid, {
            id: d.id,
            receiptNumber: data.receiptNumber || d.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            amount: Number(data.amount || 0),
            currency: data.currency || 'ر.س',
            date: data.date || new Date().toISOString().split('T')[0],
            monthKey: data.monthKey || new Date().toISOString().slice(0, 7),
            notes: data.notes || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
          remotePaymentIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyRates) {
      for (const d of legacyRates.docs) {
        if (!remoteRatingIds.has(d.id)) {
          const data = d.data();
          await saveTeacherRatingToFirestore(uid, {
            id: d.id,
            teacherId: data.teacherId || '',
            teacherName: data.teacherName || '',
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            parentPhone: data.parentPhone || '',
            rating: Number(data.rating || 5),
            comment: data.comment || '',
            date: data.date || new Date().toISOString().split('T')[0],
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
          remoteRatingIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyTrials) {
      for (const d of legacyTrials.docs) {
        if (!remoteTrialIds.has(d.id) && !remoteTrashEntityIds.has(d.id) && !localTrashEntityIds.has(d.id)) {
          await saveTrialLessonToFirestore(uid, normalizeTrialLessonDoc(d.id, d.data()));
          remoteTrialIds.add(d.id);
          migratedCount += 1;
        }
      }
    }
    if (legacyTrash) {
      for (const d of legacyTrash.docs) {
        if (!remoteTrashIds.has(d.id)) {
          const data = d.data();
          const deletedAt = typeof data.deletedAt === 'number' ? data.deletedAt : Date.now();
          const purgeAt = typeof data.purgeAt === 'number' ? data.purgeAt : deletedAt + TRASH_RETENTION_MS;
          if (purgeAt > Date.now()) {
            await saveTrashItemToFirestore(uid, {
              id: d.id,
              entityId: data.entityId || d.id,
              entityType: data.entityType || 'student',
              title: data.title || 'سجل محذوف',
              subtitle: data.subtitle || '',
              data: data.data || {},
              deletedAt,
              purgeAt,
            });
            remoteTrashIds.add(d.id);
            migratedCount += 1;
          }
        }
      }
    }
    if (legacySettings?.exists() && !remoteSettingsSnap.exists()) {
      await saveSettingsToFirestore(uid, { ...DEFAULT_SETTINGS, ...legacySettings.data() } as AcademySettings);
      migratedCount += 1;
    }
  } catch {
    // ignore legacy read issues if never used
  }

  // 2. Migrate local offline/queued records into top-level collections without deleting cloud data
  const pendingStudentIds = new Set(bundle.pendingSync.students);
  for (const st of bundle.students) {
    if (remoteTrashEntityIds.has(st.id) || localTrashEntityIds.has(st.id)) continue;
    if (!remoteStudentIds.has(st.id) || pendingStudentIds.has(st.id)) {
      await saveStudentToFirestore(uid, st);
      migratedCount += 1;
    }
  }

  // Ensure every existing remote student also has its parent & certificates synced in `parents` and `certificates`
  const allStudentsForDerived = [
    ...remoteStudentsSnap.docs.map((d) => normalizeStudentDoc(d.id, d.data())),
    ...bundle.students.filter((s) => !remoteStudentIds.has(s.id) && !localTrashEntityIds.has(s.id)),
  ];
  for (const parent of deriveParentsFromStudents(allStudentsForDerived)) {
    if (!remoteParentIds.has(parent.id)) {
      await saveParentToFirestore(uid, parent);
    }
  }
  for (const cert of deriveCertificatesFromStudents(allStudentsForDerived)) {
    if (!remoteCertIds.has(sanitizeTrashId(cert.id))) {
      await saveCertificateToFirestore(uid, cert);
    }
  }

  const pendingTeacherIds = new Set(bundle.pendingSync.teachers);
  for (const tch of bundle.teachers) {
    if (remoteTrashEntityIds.has(tch.id) || localTrashEntityIds.has(tch.id)) continue;
    if (!remoteTeacherIds.has(tch.id) || pendingTeacherIds.has(tch.id)) {
      await saveTeacherToFirestore(uid, tch);
      migratedCount += 1;
    }
  }

  const pendingScheduleIds = new Set(bundle.pendingSync.schedules);
  for (const sch of bundle.schedules) {
    if (remoteTrashEntityIds.has(sch.id) || localTrashEntityIds.has(sch.id)) continue;
    if (!remoteScheduleIds.has(sch.id) || pendingScheduleIds.has(sch.id)) {
      await saveScheduleToFirestore(uid, sch);
      migratedCount += 1;
    }
  }

  try {
    const remoteHalaqatSnap = await getDocs(query(collection(database, 'halaqat'), where('ownerUid', '==', uid)));
    const remoteHalaqaIds = new Set(remoteHalaqatSnap.docs.map((d) => d.id));
    const pendingHalaqaIds = new Set(bundle.pendingSync.halaqat || []);
    for (const h of bundle.halaqat || []) {
      if (remoteTrashEntityIds.has(h.id) || localTrashEntityIds.has(h.id)) continue;
      if (!remoteHalaqaIds.has(h.id) || pendingHalaqaIds.has(h.id)) {
        await saveHalaqaToFirestore(uid, h);
        migratedCount += 1;
      }
    }
  } catch {
    // ignore if rules pending update
  }

  try {
    const remoteExamsSnap = await getDocs(collection(database, 'exams'));
    const remoteExamIds = new Set(remoteExamsSnap.docs.map((d) => d.id));
    const pendingExamIds = new Set(bundle.pendingSync.exams || []);
    for (const ex of bundle.exams || []) {
      if (!remoteExamIds.has(ex.id) || pendingExamIds.has(ex.id)) {
        await saveExamToFirestore(uid, ex);
        migratedCount += 1;
      }
    }
  } catch {
    // ignore if rules pending update
  }

  try {
    const remoteHwSnap = await getDocs(collection(database, 'homeworks'));
    const remoteHwIds = new Set(remoteHwSnap.docs.map((d) => d.id));
    const pendingHwIds = new Set(bundle.pendingSync.homeworks || []);
    for (const hw of bundle.homeworks || []) {
      if (!remoteHwIds.has(hw.id) || pendingHwIds.has(hw.id)) {
        await saveHomeworkToFirestore(uid, hw);
        migratedCount += 1;
      }
    }
  } catch {
    // ignore if rules pending update
  }

  const pendingAttendanceIds = new Set(bundle.pendingSync.attendance);
  for (const att of bundle.attendance) {
    if (!remoteAttendanceIds.has(att.id) || pendingAttendanceIds.has(att.id)) {
      await saveAttendanceToFirestore(uid, att);
      migratedCount += 1;
    }
  }

  const pendingPaymentIds = new Set(bundle.pendingSync.payments);
  for (const pay of bundle.payments) {
    if (!remotePaymentIds.has(pay.id) || pendingPaymentIds.has(pay.id)) {
      await savePaymentToFirestore(uid, pay);
      migratedCount += 1;
    }
  }

  const pendingRatingIds = new Set(bundle.pendingSync.teacherRatings);
  for (const rate of bundle.teacherRatings) {
    if (!remoteRatingIds.has(rate.id) || pendingRatingIds.has(rate.id)) {
      await saveTeacherRatingToFirestore(uid, rate);
      migratedCount += 1;
    }
  }

  const pendingTrialIds = new Set(bundle.pendingSync.trialLessons);
  for (const lesson of bundle.trialLessons) {
    if (remoteTrashEntityIds.has(lesson.id) || localTrashEntityIds.has(lesson.id)) continue;
    if (!remoteTrialIds.has(lesson.id) || pendingTrialIds.has(lesson.id)) {
      await saveTrialLessonToFirestore(uid, lesson);
      migratedCount += 1;
    }
  }

  const pendingTrashIds = new Set(bundle.pendingSync.trash);
  const now = Date.now();
  for (const tItem of bundle.trash) {
    if (tItem.purgeAt <= now) continue;
    if (!remoteTrashIds.has(tItem.id) || pendingTrashIds.has(tItem.id)) {
      await saveTrashItemToFirestore(uid, tItem);
      migratedCount += 1;
    }
  }

  if (!remoteSettingsSnap.exists() || bundle.pendingSync.settingsPending) {
    await saveSettingsToFirestore(uid, bundle.settings);
    migratedCount += 1;
  }

  const finalCounts = await getFirestoreCollectionCounts(uid);
  return {
    migratedCount,
    studentsCount: finalCounts.studentsCount,
    teachersCount: finalCounts.teachersCount,
    parentsCount: finalCounts.parentsCount,
    certificatesCount: finalCounts.certificatesCount,
  };
}

// ---------------- Clear All Data for Authenticated User ----------------
export async function clearAllUserDataFromFirestore(uid: string): Promise<void> {
  assertAuthenticatedUid(uid);
  const topLevelCollections = [
    'students',
    'parents',
    'teachers',
    'schedules',
    'halaqat',
    'exams',
    'homeworks',
    'attendance',
    'payments',
    'certificates',
    'teacherRatings',
    'trialLessons',
    'trash',
  ];

  for (const colName of topLevelCollections) {
    const snap = await getDocs(query(collection(db!, colName), where('ownerUid', '==', uid)));
    if (!snap.empty) {
      const batch = writeBatch(db!);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  for (const colName of ['students', 'teachers', 'schedules', 'attendance', 'payments', 'teacherRatings', 'trialLessons', 'trash']) {
    const snap = await getDocs(collection(db!, 'users', uid, colName)).catch(() => null);
    if (snap && !snap.empty) {
      const batch = writeBatch(db!);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

// ---------------- Linked Google & App Account (Phone + Password) ----------------
export async function fetchUserAccountBundle(uid: string): Promise<{
  linkedGoogle?: LinkedGoogleAccount;
  appAccount?: AppLocalAccount;
} | null> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db!, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      linkedGoogle: data.linkedGoogle || undefined,
      appAccount: data.appAccount || undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveLinkedGoogleAccount(
  uid: string,
  linkedGoogle: LinkedGoogleAccount
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}`;
  try {
    await setDoc(
      doc(db!, 'users', uid),
      {
        linkedGoogle,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function saveAppUserAccount(
  uid: string,
  appAccount: AppLocalAccount
): Promise<void> {
  assertAuthenticatedUid(uid);
  const path = `users/${uid}`;
  try {
    await setDoc(
      doc(db!, 'users', uid),
      {
        appAccount,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ---------------- Public Read-Only Parent Link Snapshots ----------------
export interface PublicParentSnapshot {
  student: Student;
  teacherName: string;
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  exams?: StudentExamResult[];
  currency: string;
  academyName: string;
  updatedAt: number;
}

export async function savePublicParentSnapshot(
  uid: string,
  linkKey: string,
  snapshot: PublicParentSnapshot
): Promise<void> {
  if (!uid || !linkKey || !db) return;
  const path = `publicParentLinks/${linkKey}`;
  try {
    await setDoc(
      doc(db, 'publicParentLinks', linkKey),
      {
        ...snapshot,
        ownerUid: uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchPublicParentSnapshot(
  linkKey: string
): Promise<PublicParentSnapshot | null> {
  if (!linkKey || !db) return null;
  const path = `publicParentLinks/${linkKey}`;
  try {
    const snap = await getDoc(doc(db, 'publicParentLinks', linkKey));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data?.student) return null;
    return {
      student: normalizeStudentDoc(data.student.id || linkKey, data.student),
      teacherName: data.teacherName || '',
      attendance: Array.isArray(data.attendance) ? data.attendance : [],
      payments: Array.isArray(data.payments) ? data.payments : [],
      exams: Array.isArray(data.exams) ? data.exams : [],
      currency: data.currency || 'ر.س',
      academyName: data.academyName || 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
      updatedAt: data.updatedAt || Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
