import {
  EducationStage,
  EducationSystem,
  SecondaryTrack,
  Student,
  StudyScope,
  Teacher,
  TeacherSystemChoice,
} from '../types';

export const EDUCATION_SYSTEM_LABELS: Record<EducationSystem, string> = {
  general: 'مصري عام',
  azhar: 'أزهري',
};

export const TEACHER_SYSTEM_LABELS: Record<TeacherSystemChoice, string> = {
  general: 'مصري عام',
  azhar: 'أزهري',
  both: 'الاثنين مع بعض (عام + أزهري)',
};

export const EDUCATION_STAGES: EducationStage[] = ['ابتدائي', 'إعدادي', 'ثانوي'];

export const PRIMARY_GRADES = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'] as const;
export const PREP_SEC_GRADES = ['الأول', 'الثاني', 'الثالث'] as const;

export const SECONDARY_TRACKS: SecondaryTrack[] = ['علمي علوم', 'علمي رياضة', 'أدبي'];

export const GENERAL_PRIMARY_SUBJECTS = [
  'عربي',
  'رياضيات',
  'علوم',
  'دراسات',
  'إنجليزي',
  'دين',
];

export const GENERAL_PREP_SUBJECTS = [
  'عربي',
  'رياضيات',
  'علوم',
  'دراسات',
  'إنجليزي',
  'دين',
];

export const GENERAL_SEC_ALL_SUBJECTS = [
  'عربي',
  'إنجليزي',
  'رياضيات',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'تاريخ',
  'جغرافيا',
  'فلسفة',
  'علم نفس',
];

export const GENERAL_SEC_BY_TRACK: Record<SecondaryTrack, string[]> = {
  'علمي علوم': ['عربي', 'إنجليزي', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء'],
  'علمي رياضة': ['عربي', 'إنجليزي', 'رياضيات', 'فيزياء', 'كيمياء'],
  'أدبي': ['عربي', 'إنجليزي', 'تاريخ', 'جغرافيا', 'فلسفة', 'علم نفس'],
};

export const AZHAR_PRIMARY_SUBJECTS = [
  ...GENERAL_PRIMARY_SUBJECTS,
  'قرآن كريم',
];

export const AZHAR_PREP_SUBJECTS = [
  'عربي',
  'رياضيات',
  'علوم',
  'دراسات',
  'إنجليزي',
  'فقه',
  'تفسير',
  'حديث',
  'توحيد',
  'سيرة',
  'قرآن كريم',
];

export const AZHAR_SEC_SHARED_SUBJECTS = [
  'عربي',
  'إنجليزي',
  'رياضيات',
  'فقه',
  'تفسير',
  'حديث',
  'توحيد',
  'صرف',
  'نحو',
  'بلاغة',
  'قرآن كريم',
];

export const AZHAR_SEC_SPECIALIZATION_BY_TRACK: Record<SecondaryTrack, string[]> = {
  'علمي علوم': ['فيزياء', 'كيمياء', 'أحياء'],
  'علمي رياضة': ['فيزياء', 'كيمياء'],
  'أدبي': ['تاريخ', 'جغرافيا', 'فلسفة', 'علم نفس'],
};

export function getGradesForStage(stage?: string): string[] {
  if (stage === 'ابتدائي') {
    return [...PRIMARY_GRADES];
  }
  return [...PREP_SEC_GRADES];
}

export function normalizeStageLabel(stage?: string): EducationStage | undefined {
  if (!stage) return undefined;
  const s = stage.trim();
  if (s.includes('ابتدائي')) return 'ابتدائي';
  if (s.includes('إعدادي') || s.includes('اعدادي')) return 'إعدادي';
  if (s.includes('ثانوي')) return 'ثانوي';
  return undefined;
}

/**
 * Returns the exact list of curriculum subjects for a given system, stage, grade, and optional track.
 */
export function getSubjectsForCurriculum(
  system: EducationSystem,
  stage: EducationStage,
  _gradeLevel?: string,
  track?: SecondaryTrack | ''
): string[] {
  if (system === 'general') {
    if (stage === 'ابتدائي') return [...GENERAL_PRIMARY_SUBJECTS];
    if (stage === 'إعدادي') return [...GENERAL_PREP_SUBJECTS];
    // ثانوي عام
    if (track && GENERAL_SEC_BY_TRACK[track]) {
      return [...GENERAL_SEC_BY_TRACK[track]];
    }
    return [...GENERAL_SEC_ALL_SUBJECTS];
  }

  // أزهري
  if (stage === 'ابتدائي') return [...AZHAR_PRIMARY_SUBJECTS];
  if (stage === 'إعدادي') return [...AZHAR_PREP_SUBJECTS];

  // ثانوي أزهري
  if (track && AZHAR_SEC_SPECIALIZATION_BY_TRACK[track]) {
    return Array.from(
      new Set([...AZHAR_SEC_SHARED_SUBJECTS, ...AZHAR_SEC_SPECIALIZATION_BY_TRACK[track]])
    );
  }
  return Array.from(
    new Set([
      ...AZHAR_SEC_SHARED_SUBJECTS,
      ...AZHAR_SEC_SPECIALIZATION_BY_TRACK['علمي علوم'],
      ...AZHAR_SEC_SPECIALIZATION_BY_TRACK['أدبي'],
    ])
  );
}

/**
 * Returns all unique subjects available to a teacher based ONLY on their selected teaching system(s)
 * and optional selected stages / track.
 */
export function getTeacherAvailableSubjects(
  teachingSystems: TeacherSystemChoice,
  stages?: EducationStage[],
  track?: SecondaryTrack | ''
): string[] {
  const systemsToInclude: EducationSystem[] =
    teachingSystems === 'both' ? ['general', 'azhar'] : [teachingSystems];
  const stagesToInclude: EducationStage[] =
    stages && stages.length > 0 ? stages : [...EDUCATION_STAGES];

  const subjectSet = new Set<string>();
  for (const sys of systemsToInclude) {
    for (const st of stagesToInclude) {
      const subs = getSubjectsForCurriculum(
        sys,
        st,
        undefined,
        st === 'ثانوي' ? track : undefined
      );
      subs.forEach((s) => subjectSet.add(s));
    }
  }
  return Array.from(subjectSet);
}

/**
 * Resolves the effective list of subjects a student is enrolled in.
 */
export function getStudentEnrolledSubjects(student: Student): string[] {
  if (Array.isArray(student.selectedSubjects) && student.selectedSubjects.length > 0) {
    return student.selectedSubjects;
  }
  const sys: EducationSystem = student.educationSystem === 'azhar' ? 'azhar' : 'general';
  const stg = normalizeStageLabel(student.stage);
  if (student.educationSystem && stg) {
    if (student.studyScope === 'all') {
      return getSubjectsForCurriculum(sys, stg, student.gradeLevel, student.track);
    }
    return getSubjectsForCurriculum(sys, stg, student.gradeLevel, student.track);
  }
  if (student.course) {
    return [student.course];
  }
  return ['قرآن كريم'];
}

/**
 * Resolves whether two subject names match (handles common Arabic aliases like "عربي"/"لغة عربية" and "قرآن"/"قرآن كريم").
 */
export function subjectsMatch(a: string, b: string): boolean {
  const norm = (v: string) =>
    v
      .trim()
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const isArabicA = na === 'عربي' || na.includes('لغه عربيه');
  const isArabicB = nb === 'عربي' || nb.includes('لغه عربيه');
  if (isArabicA && isArabicB) return true;

  const isQuranA = na.includes('قران') || na.includes('تحفيظ');
  const isQuranB = nb.includes('قران') || nb.includes('تحفيظ');
  if (isQuranA && isQuranB) return true;

  const isEngA = na.includes('نجليز') || na.includes('english');
  const isEngB = nb.includes('نجليز') || nb.includes('english');
  if (isEngA && isEngB) return true;

  return false;
}

/**
 * Checks whether a student matches the teacher's education system AND chosen subject(s) / stages.
 */
export function doesStudentMatchTeacher(student: Student, teacher: Teacher): boolean {
  const teacherSys: TeacherSystemChoice = teacher.teachingSystems || 'both';
  const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : [];

  // 1. Check education system match
  if (teacherSys !== 'both') {
    if (student.educationSystem) {
      if (student.educationSystem !== teacherSys) return false;
    } else if (teacherSys === 'general' && student.course?.includes('أزهر')) {
      return false;
    }
  }

  // 2. Check subject overlap
  const studentSubjects = getStudentEnrolledSubjects(student);
  if (teacherSubjects.length > 0) {
    const hasSubjectOverlap = studentSubjects.some((ss) =>
      teacherSubjects.some((ts) => subjectsMatch(ss, ts))
    );
    if (!hasSubjectOverlap) return false;
  }

  // 3. Optional stage/grade match if teacher specifies teachingStages
  const stStage = normalizeStageLabel(student.stage);
  if (
    teacher.teachingStages &&
    teacher.teachingStages.length > 0 &&
    stStage &&
    !teacher.teachingStages.includes(stStage)
  ) {
    return false;
  }

  if (
    teacher.teachingGrades &&
    teacher.teachingGrades.length > 0 &&
    student.gradeLevel &&
    !teacher.teachingGrades.includes(student.gradeLevel)
  ) {
    return false;
  }

  return true;
}

export interface CurriculumEntryGroup {
  system: EducationSystem;
  systemLabel: string;
  stage: EducationStage;
  grades: readonly string[];
  track?: SecondaryTrack;
  subjects: string[];
}

export function buildAllCurriculumGroups(): CurriculumEntryGroup[] {
  const groups: CurriculumEntryGroup[] = [];

  // General Education (مصري عام)
  groups.push({
    system: 'general',
    systemLabel: EDUCATION_SYSTEM_LABELS.general,
    stage: 'ابتدائي',
    grades: PRIMARY_GRADES,
    subjects: [...GENERAL_PRIMARY_SUBJECTS],
  });
  groups.push({
    system: 'general',
    systemLabel: EDUCATION_SYSTEM_LABELS.general,
    stage: 'إعدادي',
    grades: PREP_SEC_GRADES,
    subjects: [...GENERAL_PREP_SUBJECTS],
  });
  for (const track of SECONDARY_TRACKS) {
    groups.push({
      system: 'general',
      systemLabel: EDUCATION_SYSTEM_LABELS.general,
      stage: 'ثانوي',
      grades: PREP_SEC_GRADES,
      track,
      subjects: getSubjectsForCurriculum('general', 'ثانوي', undefined, track),
    });
  }

  // Azhar Education (أزهري)
  groups.push({
    system: 'azhar',
    systemLabel: EDUCATION_SYSTEM_LABELS.azhar,
    stage: 'ابتدائي',
    grades: PRIMARY_GRADES,
    subjects: [...AZHAR_PRIMARY_SUBJECTS],
  });
  groups.push({
    system: 'azhar',
    systemLabel: EDUCATION_SYSTEM_LABELS.azhar,
    stage: 'إعدادي',
    grades: PREP_SEC_GRADES,
    subjects: [...AZHAR_PREP_SUBJECTS],
  });
  for (const track of SECONDARY_TRACKS) {
    groups.push({
      system: 'azhar',
      systemLabel: EDUCATION_SYSTEM_LABELS.azhar,
      stage: 'ثانوي',
      grades: PREP_SEC_GRADES,
      track,
      subjects: getSubjectsForCurriculum('azhar', 'ثانوي', undefined, track),
    });
  }

  return groups;
}

export function formatStudentCurriculumBadge(student: Student): string {
  const parts: string[] = [];
  if (student.educationSystem) {
    parts.push(EDUCATION_SYSTEM_LABELS[student.educationSystem]);
  }
  if (student.stage) parts.push(student.stage);
  if (student.gradeLevel) parts.push(`الصف ${student.gradeLevel}`);
  if (student.stage === 'ثانوي' && student.track) parts.push(student.track);
  if (student.studyScope) {
    parts.push(student.studyScope === 'single' ? 'مادة واحدة' : 'كل المواد');
  }
  return parts.join(' • ');
}

export function getStudyScopeLabel(scope?: StudyScope): string {
  if (scope === 'single') return 'مادة واحدة فقط';
  if (scope === 'all') return 'كل المواد';
  return 'غير محدد';
}

export interface GradeEntry {
  id: string;
  stage: EducationStage;
  gradeLevel: string;
  title: string;
  stageTitle: string;
}

export const ALL_GRADES_LIST: GradeEntry[] = [
  { id: 'primary-1', stage: 'ابتدائي', gradeLevel: 'الأول', title: 'الأول الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'primary-2', stage: 'ابتدائي', gradeLevel: 'الثاني', title: 'الثاني الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'primary-3', stage: 'ابتدائي', gradeLevel: 'الثالث', title: 'الثالث الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'primary-4', stage: 'ابتدائي', gradeLevel: 'الرابع', title: 'الرابع الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'primary-5', stage: 'ابتدائي', gradeLevel: 'الخامس', title: 'الخامس الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'primary-6', stage: 'ابتدائي', gradeLevel: 'السادس', title: 'السادس الابتدائي', stageTitle: 'المرحلة الابتدائية' },
  { id: 'prep-1', stage: 'إعدادي', gradeLevel: 'الأول', title: 'الأول الإعدادي', stageTitle: 'المرحلة الإعدادية' },
  { id: 'prep-2', stage: 'إعدادي', gradeLevel: 'الثاني', title: 'الثاني الإعدادي', stageTitle: 'المرحلة الإعدادية' },
  { id: 'prep-3', stage: 'إعدادي', gradeLevel: 'الثالث', title: 'الثالث الإعدادي', stageTitle: 'المرحلة الإعدادية' },
  { id: 'sec-1', stage: 'ثانوي', gradeLevel: 'الأول', title: 'الأول الثانوي', stageTitle: 'المرحلة الثانوية' },
  { id: 'sec-2', stage: 'ثانوي', gradeLevel: 'الثاني', title: 'الثاني الثانوي', stageTitle: 'المرحلة الثانوية' },
  { id: 'sec-3', stage: 'ثانوي', gradeLevel: 'الثالث', title: 'الثالث الثانوي', stageTitle: 'المرحلة الثانوية' },
];

export function getFullGradeTitle(stage: EducationStage, gradeLevel: string): string {
  const found = ALL_GRADES_LIST.find(
    (g) => g.stage === stage && g.gradeLevel === gradeLevel
  );
  if (found) return found.title;
  return `${gradeLevel} ${stage}`;
}

export function doesStudentBelongToGrade(
  student: Student,
  stage: EducationStage,
  gradeLevel: string,
  system?: EducationSystem
): boolean {
  const normStage = normalizeStageLabel(student.stage);
  if (normStage !== stage) return false;
  if (student.gradeLevel !== gradeLevel) return false;
  if (system) {
    const stSystem: EducationSystem =
      student.educationSystem ||
      (student.course && student.course.includes('أزهر') ? 'azhar' : 'general');
    if (stSystem !== system) return false;
  }
  return true;
}

export function doesStudentBelongToGradeSubject(
  student: Student,
  stage: EducationStage,
  gradeLevel: string,
  system: EducationSystem,
  subject: string
): boolean {
  if (!doesStudentBelongToGrade(student, stage, gradeLevel, system)) return false;
  const enrolled = getStudentEnrolledSubjects(student);
  return enrolled.some((s) => subjectsMatch(s, subject));
}

export function doesTeacherCoverGrade(
  teacher: Teacher,
  stage: EducationStage,
  gradeLevel: string,
  system?: EducationSystem
): boolean {
  if (teacher.status === 'rejected') return false;
  const tSys: TeacherSystemChoice = teacher.teachingSystems || 'both';
  if (system && tSys !== 'both' && tSys !== system) return false;
  if (teacher.teachingStages && teacher.teachingStages.length > 0) {
    if (!teacher.teachingStages.includes(stage)) return false;
  }
  if (teacher.teachingGrades && teacher.teachingGrades.length > 0) {
    if (!teacher.teachingGrades.includes(gradeLevel)) return false;
  }
  return true;
}

export function doesTeacherCoverGradeSubject(
  teacher: Teacher,
  stage: EducationStage,
  gradeLevel: string,
  system: EducationSystem,
  subject: string
): boolean {
  if (!doesTeacherCoverGrade(teacher, stage, gradeLevel, system)) return false;
  const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : [];
  if (teacherSubjects.length === 0) return false;
  return teacherSubjects.some((ts) => subjectsMatch(ts, subject));
}

