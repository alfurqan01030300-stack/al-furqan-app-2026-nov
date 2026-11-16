import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Video,
  MessageSquare,
  Wallet,
  LogOut,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Eye,
  X,
  ClipboardCheck,
  PlusCircle,
  Save,
  Trash2,
  Check,
  Search,
  Users,
  FileText,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  AttendanceStatus,
  EducationStage,
  EducationSystem,
  Exam,
  ExamGradeRecord,
  HalaqaGroup,
  HomeworkAssignment,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
} from '../types';
import { cleanWhatsAppNumber, getTodayArabicDay, getTodayDateStr } from '../utils/storage';
import {
  doesStudentMatchTeacher,
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  formatStudentCurriculumBadge,
  getGradesForStage,
  getStudentEnrolledSubjects,
  getTeacherAvailableSubjects,
  subjectsMatch,
  TEACHER_SYSTEM_LABELS,
} from '../data/curricula';
import { CurriculumLibraryIcon } from './CurriculumLibraryIcon';
import { CurriculumLibraryView } from './CurriculumLibraryView';

interface TeacherPortalViewProps {
  teachers: Teacher[];
  students: Student[];
  schedules: ScheduleAppointment[];
  halaqat?: HalaqaGroup[];
  attendance: AttendanceRecord[];
  teacherRatings: TeacherRating[];
  exams: Exam[];
  homeworks?: HomeworkAssignment[];
  settings: AcademySettings;
  selectedTeacherId: string;
  onSelectTeacher: (teacherId: string) => void;
  onMarkAttendance: (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment
  ) => void;
  onAddStar: (student: Student) => { reachedTen: boolean; newStars: number };
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onSaveHomework?: (hw: HomeworkAssignment) => void;
  onDeleteHomework?: (hwId: string) => void;
  lockedToTeacher?: boolean;
  adminPreviewingTeacher?: boolean;
  onExitAdminPreview?: () => void;
}

type TeacherPortalTab = 'library' | 'students' | 'sessions' | 'exams' | 'homework';

function computeGradeLabel(score: number, maxScore: number): string {
  const pct = (score / Math.max(1, maxScore)) * 100;
  if (pct >= 90) return 'ممتاز';
  if (pct >= 80) return 'جيد جداً';
  if (pct >= 70) return 'جيد';
  if (pct >= 60) return 'مقبول';
  return 'يحتاج مراجعة';
}

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({
  teachers,
  students,
  schedules,
  halaqat = [],
  attendance,
  teacherRatings,
  exams,
  homeworks = [],
  settings,
  selectedTeacherId,
  onSelectTeacher,
  onMarkAttendance,
  onAddStar,
  onSaveExam,
  onDeleteExam,
  onSaveHomework,
  onDeleteHomework,
  lockedToTeacher = false,
  adminPreviewingTeacher = false,
  onExitAdminPreview,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<TeacherPortalTab>('sessions');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [myStudentsSearch, setMyStudentsSearch] = useState('');

  const [starAlert, setStarAlert] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string } | null>(null);

  const todayStr = getTodayDateStr();
  const todayArabic = getTodayArabicDay();
  const currentMonth = todayStr.slice(0, 7);
  const currency = settings.currency || 'ر.س';

  // Exam creation form states
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState(todayStr);
  const [examMaxScore, setExamMaxScore] = useState<number>(100);
  const [examHalaqaId, setExamHalaqaId] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [showAllAcademyStudents, setShowAllAcademyStudents] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<string, { score: string; notes: string }>
  >({});
  const [examSavedToast, setExamSavedToast] = useState<string | null>(null);

  // Homework creation form states
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('');
  const [hwSystem, setHwSystem] = useState<EducationSystem | 'both'>('both');
  const [hwStage, setHwStage] = useState<EducationStage | ''>('');
  const [hwGrade, setHwGrade] = useState('');
  const [hwDueDate, setHwDueDate] = useState(todayStr);
  const [hwDescription, setHwDescription] = useState('');
  const [hwToast, setHwToast] = useState<string | null>(null);

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  // Subjects belonging strictly to this teacher's chosen system(s) & specialization
  const teacherSubjectOptions = useMemo(() => {
    if (!activeTeacher) return ['قرآن كريم'];
    if (Array.isArray(activeTeacher.subjects) && activeTeacher.subjects.length > 0) {
      return activeTeacher.subjects;
    }
    return getTeacherAvailableSubjects(
      activeTeacher.teachingSystems || 'both',
      activeTeacher.teachingStages,
      activeTeacher.teachingTrack
    );
  }, [activeTeacher]);

  const effectiveExamSubject = examSubject || teacherSubjectOptions[0] || 'قرآن كريم';
  const effectiveHwSubject = hwSubject || teacherSubjectOptions[0] || 'قرآن كريم';

  const teacherExams = useMemo(() => {
    if (!activeTeacher) return [];
    const base = exams.filter((e) => e.teacherId === activeTeacher.id);
    if (selectedSubjectFilter === 'all') return base;
    return base.filter((e) => subjectsMatch(e.subject, selectedSubjectFilter));
  }, [exams, activeTeacher, selectedSubjectFilter]);

  const teacherHomeworks = useMemo(() => {
    if (!activeTeacher) return [];
    const base = homeworks.filter((h) => h.teacherId === activeTeacher.id);
    if (selectedSubjectFilter === 'all') return base;
    return base.filter((h) => subjectsMatch(h.subject, selectedSubjectFilter));
  }, [homeworks, activeTeacher, selectedSubjectFilter]);

  const activeExam =
    teacherExams.find((e) => e.id === selectedExamId) || teacherExams[0] || null;

  // Curriculum-matched students: strictly same system AND overlapping subjects/stages (+ explicit teacher/halaqa assignments)
  const matchedStudents = useMemo(() => {
    if (!activeTeacher) return [];
    const myHalaqaIds = new Set(
      halaqat
        .filter((h) => h.teacherId === activeTeacher.id || h.teacherName === activeTeacher.name)
        .map((h) => h.id)
    );
    const scheduledIds = new Set(
      schedules
        .filter((sch) => sch.teacherId === activeTeacher.id || sch.teacherName === activeTeacher.name)
        .map((sch) => sch.studentId)
    );

    return students.filter((st) => {
      const explicitMatch =
        st.assignedTeacherId === activeTeacher.id ||
        (st.halaqaId && myHalaqaIds.has(st.halaqaId)) ||
        scheduledIds.has(st.id);

      const curriculumMatch = doesStudentMatchTeacher(st, activeTeacher);

      // If teacher has subjects configured, prioritize strict system & subject matching
      if (activeTeacher.teachingSystems || (activeTeacher.subjects && activeTeacher.subjects.length > 0)) {
        if (selectedSubjectFilter !== 'all') {
          const enrolled = getStudentEnrolledSubjects(st);
          const hasSubj = enrolled.some((s) => subjectsMatch(s, selectedSubjectFilter));
          if (!hasSubj) return false;
        }
        return curriculumMatch || explicitMatch;
      }

      return explicitMatch || curriculumMatch;
    });
  }, [activeTeacher, students, halaqat, schedules, selectedSubjectFilter]);

  const studentsCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    teacherSubjectOptions.forEach((subj) => {
      counts[subj] = students.filter((st) => {
        if (!activeTeacher) return false;
        const sysOk =
          !activeTeacher.teachingSystems ||
          activeTeacher.teachingSystems === 'both' ||
          !st.educationSystem ||
          st.educationSystem === activeTeacher.teachingSystems;
        if (!sysOk) return false;
        return getStudentEnrolledSubjects(st).some((s) => subjectsMatch(s, subj));
      }).length;
    });
    return counts;
  }, [students, teacherSubjectOptions, activeTeacher]);

  const filteredMyStudentsList = useMemo(() => {
    const q = myStudentsSearch.trim().toLowerCase();
    if (!q) return matchedStudents;
    return matchedStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.stage && s.stage.toLowerCase().includes(q))
    );
  }, [matchedStudents, myStudentsSearch]);

  // Students eligible for exam grade entry
  const gradableStudents = useMemo(() => {
    let base = showAllAcademyStudents ? students : matchedStudents;
    if (!showAllAcademyStudents && base.length === 0) {
      base = students;
    }

    if (activeExam?.subject && !showAllAcademyStudents) {
      const subjectMatched = base.filter((st) =>
        getStudentEnrolledSubjects(st).some((s) => subjectsMatch(s, activeExam.subject))
      );
      if (subjectMatched.length > 0) base = subjectMatched;
    }

    if (activeExam?.halaqaId && !showAllAcademyStudents) {
      const inHalaqa = base.filter((s) => s.halaqaId === activeExam.halaqaId);
      if (inHalaqa.length > 0) base = inHalaqa;
    }

    const q = studentFilter.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.halaqaName && s.halaqaName.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q))
    );
  }, [students, matchedStudents, showAllAcademyStudents, activeExam, studentFilter]);

  if (!activeTeacher) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#D4AF37]/25">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-amiri text-white">بوابة المعلم (جدول اليوم والاختبارات)</h2>
              <p className="text-xs text-[#D4AF37]">
                اختر حسابك لعرض طلابك ومقرراتك وحصصك اليوم ({todayArabic})
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {teachers.map((t) => {
              const todayCount = schedules.filter(
                (s) => s.teacherId === t.id && s.day === todayArabic
              ).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeacher(t.id)}
                  className="w-full text-right bg-[#07241B]/90 hover:bg-[#145A43] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl p-4 flex items-center justify-between gap-3 transition cursor-pointer group"
                >
                  <div>
                    <h3 className="text-base font-bold font-amiri text-white group-hover:text-[#F3E5AB]">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.specialization}
                      {t.teachingSystems ? ` • ${TEACHER_SYSTEM_LABELS[t.teachingSystems]}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40 tabular-nums">
                      {todayCount} حصص اليوم
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const myTodaySchedules = schedules.filter(
    (s) =>
      (s.teacherId === activeTeacher.id || s.teacherName === activeTeacher.name) &&
      s.day === todayArabic
  );
  const myHalaqat = halaqat.filter(
    (h) => h.teacherId === activeTeacher.id || h.teacherName === activeTeacher.name
  );
  const myCerts = activeTeacher.certificates || [];

  const sessionRate = activeTeacher.sessionRate ?? settings.defaultSessionRate ?? 40;
  const monthlyTaughtRecords = attendance.filter(
    (a) =>
      a.teacherId === activeTeacher.id &&
      a.date.startsWith(currentMonth) &&
      a.status === 'present'
  );
  const calculatedSalary = monthlyTaughtRecords.length * sessionRate;

  const myRatings = teacherRatings.filter((r) => r.teacherId === activeTeacher.id);
  const avgRating =
    myRatings.length > 0
      ? (myRatings.reduce((acc, r) => acc + r.rating, 0) / myRatings.length).toFixed(1)
      : null;

  const isRejected = activeTeacher.status === 'rejected';
  const isPending = activeTeacher.status === 'pending';

  const handleJumpFromLibrary = (subj: string, targetTab: 'students' | 'exams' | 'homework') => {
    setSelectedSubjectFilter(subj);
    setExamSubject(subj);
    setHwSubject(subj);
    setActivePortalTab(targetTab);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTitle = examTitle.trim();
    if (!cleanedTitle) return;

    const chosenHalaqa = myHalaqat.find((h) => h.id === examHalaqaId);
    const maxScoreNum = Math.max(1, Math.min(1000, Number(examMaxScore) || 100));
    const now = Date.now();

    const newExam: Exam = {
      id: `exm-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanedTitle,
      subject: effectiveExamSubject,
      examDate: examDate || todayStr,
      maxScore: maxScoreNum,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      halaqaId: chosenHalaqa?.id || '',
      halaqaName: chosenHalaqa?.name || '',
      description: examDescription.trim(),
      grades: [],
      createdAt: now,
      updatedAt: now,
    };

    onSaveExam(newExam);
    setSelectedExamId(newExam.id);
    setExamTitle('');
    setExamDescription('');
    setExamHalaqaId('');
    setExamSavedToast(`تم إنشاء اختبار «${newExam.title}» (${effectiveExamSubject}) بنجاح`);
    setTimeout(() => setExamSavedToast(null), 4000);
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveHomework || !hwTitle.trim()) return;
    const now = Date.now();
    const hw: HomeworkAssignment = {
      id: `hw-${now}-${Math.random().toString(36).slice(2, 7)}`,
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      subject: effectiveHwSubject,
      educationSystem: hwSystem,
      stage: hwStage || undefined,
      gradeLevel: hwGrade || undefined,
      title: hwTitle.trim(),
      description: hwDescription.trim(),
      dueDate: hwDueDate || todayStr,
      createdAt: now,
      updatedAt: now,
    };
    onSaveHomework(hw);
    setHwTitle('');
    setHwDescription('');
    setHwToast(`تم نشر الواجب «${hw.title}» لمادة ${hw.subject} للطلاب وأولياء الأمور`);
    setTimeout(() => setHwToast(null), 4000);
  };

  const getDraftForStudent = (exam: Exam, studentId: string) => {
    const draftKey = `${exam.id}::${studentId}`;
    if (gradeDrafts[draftKey]) return gradeDrafts[draftKey];
    const existing = exam.grades.find((g) => g.studentId === studentId);
    return {
      score: existing !== undefined ? String(existing.score) : '',
      notes: existing?.notes || '',
    };
  };

  const updateDraftForStudent = (
    exam: Exam,
    studentId: string,
    field: 'score' | 'notes',
    value: string
  ) => {
    const draftKey = `${exam.id}::${studentId}`;
    const prev = getDraftForStudent(exam, studentId);
    setGradeDrafts((curr) => ({
      ...curr,
      [draftKey]: { ...prev, [field]: value },
    }));
  };

  const handleSaveSingleStudentGrade = (exam: Exam, student: Student) => {
    const draft = getDraftForStudent(exam, student.id);
    const rawScore = Number(draft.score);
    if (draft.score.trim() === '' || isNaN(rawScore)) return;

    const clampedScore = Math.max(0, Math.min(exam.maxScore, rawScore));
    const gradeLabel = computeGradeLabel(clampedScore, exam.maxScore);
    const existingIdx = exam.grades.findIndex((g) => g.studentId === student.id);
    const nextRecord: ExamGradeRecord = {
      id: existingIdx >= 0 ? exam.grades[existingIdx].id : `grd-${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      score: clampedScore,
      maxScore: exam.maxScore,
      gradeLabel,
      notes: draft.notes.trim(),
      gradedAt: Date.now(),
    };

    const nextGrades =
      existingIdx >= 0
        ? exam.grades.map((g, idx) => (idx === existingIdx ? nextRecord : g))
        : [...exam.grades, nextRecord];

    onSaveExam({ ...exam, grades: nextGrades, updatedAt: Date.now() });
    setExamSavedToast(`تم حفظ درجة (${student.name}): ${clampedScore}/${exam.maxScore} (${gradeLabel})`);
    setTimeout(() => setExamSavedToast(null), 3500);
  };

  const handleSaveAllEnteredGrades = (exam: Exam) => {
    const nextGradesMap = new Map<string, ExamGradeRecord>(
      exam.grades.map((g) => [g.studentId, g])
    );

    let savedCount = 0;
    gradableStudents.forEach((student) => {
      const draft = getDraftForStudent(exam, student.id);
      if (draft.score.trim() === '') return;
      const num = Number(draft.score);
      if (isNaN(num)) return;
      const clampedScore = Math.max(0, Math.min(exam.maxScore, num));
      const existing = nextGradesMap.get(student.id);
      nextGradesMap.set(student.id, {
        id: existing?.id || `grd-${student.id}-${Date.now()}-${savedCount}`,
        studentId: student.id,
        studentName: student.name,
        score: clampedScore,
        maxScore: exam.maxScore,
        gradeLabel: computeGradeLabel(clampedScore, exam.maxScore),
        notes: draft.notes.trim(),
        gradedAt: Date.now(),
      });
      savedCount += 1;
    });

    onSaveExam({
      ...exam,
      grades: Array.from(nextGradesMap.values()),
      updatedAt: Date.now(),
    });
    setExamSavedToast(`تم حفظ درجات ${savedCount} طالب في «${exam.title}»`);
    setTimeout(() => setExamSavedToast(null), 4000);
  };

  const navItems: {
    id: TeacherPortalTab;
    label: string;
    badge?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'students',
      label: 'طلابي حسب المنهج',
      badge: matchedStudents.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'sessions',
      label: 'حصص اليوم والحضور',
      badge: myTodaySchedules.length,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'exams',
      label: 'الاختبارات والدرجات',
      badge: teacherExams.length,
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'homework',
      label: 'الواجبات المدرسية',
      badge: teacherHomeworks.length,
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-5 pb-14">
      {adminPreviewingTeacher && onExitAdminPreview && (
        <div className="bg-gradient-to-r from-[#D4AF37]/25 via-[#C9A227]/20 to-emerald-900/40 border-2 border-[#D4AF37] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#F3E5AB]">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span>وضع التجربة من الإدارة: تتصفح الآن لوحة المعلم ({activeTeacher.name})</span>
          </div>
          <button
            type="button"
            onClick={onExitAdminPreview}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-[#07241B]" />
            <span>العودة للوحة المدير</span>
          </button>
        </div>
      )}

      {isPending && (
        <div className="bg-amber-950/75 border-2 border-amber-400/70 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-amber-100 shadow-lg">
          <Clock className="w-5 h-5 text-amber-300 shrink-0" />
          <span>
            تم حفظ بياناتك بنجاح! حسابك الآن بانتظار قبول وموافقة مدير الأكاديمية لتسكين الحلقات والطلاب لك.
          </span>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-950/80 border-2 border-red-400/75 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-red-100 shadow-lg">
          <XCircle className="w-5 h-5 text-red-300 shrink-0" />
          <span>نعتذر، لم يتم قبول الطلب من إدارة الأكاديمية. يرجى التواصل مع الإدارة عبر الواتساب.</span>
        </div>
      )}

      {/* Top Teacher Summary Bar (Static & Non-Overlapping) */}
      <div className="w-full max-w-full bg-[#0B3D2E]/95 border-2 border-[#D4AF37]/50 rounded-3xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeTeacher.avatarUrl ? (
              <img
                src={activeTeacher.avatarUrl}
                alt={activeTeacher.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-[#D4AF37] shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
                  {TEACHER_SYSTEM_LABELS[activeTeacher.teachingSystems || 'both']}
                </span>
                <span className="text-[11px] text-emerald-300 font-bold">
                  • {todayArabic} {todayStr}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-amiri text-white mt-0.5">
                مرحباً أ. {activeTeacher.name}
              </h2>
              <p className="text-[11px] text-[#F3E5AB]">
                موادك: {teacherSubjectOptions.join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Icon #2 pinned in Top Bar across ALL teacher pages */}
            <CurriculumLibraryIcon
              label="المقررات كلها"
              active={activePortalTab === 'library'}
              onClick={() => setActivePortalTab('library')}
            />

            {!lockedToTeacher && !adminPreviewingTeacher && (
              <button
                type="button"
                onClick={() => onSelectTeacher('')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer transition whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 text-[#D4AF37]" />
                <span>تبديل المعلم</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Layout: Inline Navigation on Mobile + RTL Sidebar on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full max-w-full">
        {/* Inline Navigation Panel (Always Visible on Mobile & Desktop, no drawer/hamburger) */}
        <aside className="lg:col-span-3 space-y-3 lg:sticky lg:top-24 w-full max-w-full">
          <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/45 rounded-3xl p-4 shadow-xl space-y-3">
            {/* Pinned All Curricula Library Button in Sidebar */}
            <div className="pb-2 border-b border-white/10">
              <CurriculumLibraryIcon
                label="المقررات كلها (كل المناهج)"
                active={activePortalTab === 'library'}
                onClick={() => setActivePortalTab('library')}
              />
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
              {navItems.map((item) => {
                const isActive = activePortalTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePortalTab(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${
                      isActive
                        ? 'bg-[#c9a227] text-[#07241B] border-[#fffdf5] shadow'
                        : 'bg-[#07241B]/75 text-[#F3E5AB] border-[#D4AF37]/25 hover:bg-[#145A43]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums ${
                          isActive
                            ? 'bg-[#07241B] text-[#F9E79F]'
                            : 'bg-[#0B3D2E] text-[#D4AF37]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Subject Jump List in Sidebar */}
            {teacherSubjectOptions.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-[#D4AF37] block">
                  تصفية سريعة بمادتك:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#07241B] text-slate-300 border border-white/10'
                    }`}
                  >
                    كل موادي
                  </button>
                  {teacherSubjectOptions.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectFilter(subj);
                        setExamSubject(subj);
                        setHwSubject(subj);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        selectedSubjectFilter === subj
                          ? 'bg-[#c9a227] text-[#07241B]'
                          : 'bg-[#07241B] text-[#F3E5AB] border border-[#D4AF37]/30'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mini Teacher Wallet & Rating Card */}
          <div className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-3xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>مرتب الشهر:</span>
              </span>
              <strong className="text-white tabular-nums">
                {calculatedSalary} {currency}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>تقييم أولياء الأمور:</span>
              </span>
              <strong className="text-white tabular-nums">
                {avgRating ? `${avgRating} / 5 ⭐` : 'جديد'}
              </strong>
            </div>
          </div>
        </aside>

        {/* Main Active Section */}
        <main className="lg:col-span-9 space-y-5">
          {/* Active Subject Filter Banner if set */}
          {selectedSubjectFilter !== 'all' && activePortalTab !== 'library' && (
            <div className="bg-[#07241B] border border-[#D4AF37]/45 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-[#F3E5AB] font-bold">
                التصفية النشطة: مادة <strong className="text-white">«{selectedSubjectFilter}»</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubjectFilter('all')}
                className="px-3 py-1 rounded-lg bg-[#0B3D2E] text-[#D4AF37] font-bold cursor-pointer"
              >
                عرض كل المواد
              </button>
            </div>
          )}

          {/* VIEW 0: All Curricula Library Hub */}
          {activePortalTab === 'library' && (
            <CurriculumLibraryView
              mode="teacher"
              teacher={activeTeacher}
              studentsCountBySubject={studentsCountBySubject}
              onJumpToSubject={handleJumpFromLibrary}
            />
          )}

          {/* VIEW 1: Matched Students by Curriculum & Subject */}
          {activePortalTab === 'students' && (
            <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-amiri text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                    <span>طلابي حسب النظام والمادة ({filteredMyStudentsList.length})</span>
                  </h3>
                  <p className="text-xs text-[#F3E5AB] mt-0.5">
                    يظهر هنا فقط الطلاب المسجلون في نظامك ({TEACHER_SYSTEM_LABELS[activeTeacher.teachingSystems || 'both']}) وفي مادتك ({teacherSubjectOptions.join(' • ')})
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={myStudentsSearch}
                    onChange={(e) => setMyStudentsSearch(e.target.value)}
                    placeholder="ابحث باسم الطالب..."
                    className="w-full h-10 bg-white border border-[#D4AF37]/50 rounded-xl pr-9 pl-3 text-xs text-slate-900"
                  />
                </div>
              </div>

              {filteredMyStudentsList.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Users className="w-10 h-10 text-[#D4AF37]/45 mx-auto" />
                  <p className="text-sm font-bold text-white">
                    لا يوجد طلاب مطابقون لهذه المادة أو النظام حالياً
                  </p>
                  <p className="text-xs text-slate-300">
                    بمجرد تسجيل طلاب في نظامك ({TEACHER_SYSTEM_LABELS[activeTeacher.teachingSystems || 'both']}) وموادك سيظهرون هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredMyStudentsList.map((st) => {
                    const badge = formatStudentCurriculumBadge(st);
                    const enrolled = getStudentEnrolledSubjects(st);
                    return (
                      <div
                        key={st.id}
                        className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-bold font-amiri text-white">{st.name}</h4>
                            <p className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">
                              {badge || st.course}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-[#F3E5AB] bg-[#0B3D2E] px-2.5 py-1 rounded-xl border border-[#D4AF37]/30 tabular-nums">
                            {st.stars || 0}/10 ⭐
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {enrolled.map((subj) => (
                            <span
                              key={subj}
                              className="px-2 py-0.5 rounded-lg bg-[#0B3D2E] text-emerald-200 border border-emerald-500/30 text-[10px] font-bold"
                            >
                              {subj}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                          <span className="text-slate-300 font-mono" dir="ltr">
                            {st.phone || st.parentPhone}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActivePortalTab('exams')}
                              className="px-2.5 py-1 rounded-lg bg-[#c9a227] text-[#07241B] font-extrabold text-[11px] cursor-pointer"
                            >
                              رصد درجة
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const res = onAddStar(st);
                                if (res.reachedTen) {
                                  setStarAlert(
                                    `الطالب (${st.name}) أتم 10 نجوم ويستحق شهادة تقدير!`
                                  );
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700/80 text-white font-bold text-[11px] cursor-pointer"
                            >
                              +1 ⭐
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Today's Sessions & Attendance */}
          {activePortalTab === 'sessions' && (
            <div className="space-y-5">
              {starAlert && (
                <div className="bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/25 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Award className="w-7 h-7 text-[#D4AF37] shrink-0" />
                    <div>
                      <h4 className="text-sm font-extrabold text-[#F3E5AB]">🎉 إنجاز رائع — يستحق شهادة!</h4>
                      <p className="text-xs text-white">{starAlert}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStarAlert(null)}
                    className="px-3 py-1 rounded-lg bg-[#07241B] text-xs text-[#F3E5AB] cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              )}

              {myHalaqat.length > 0 && (
                <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-[#F3E5AB] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                    <span>حلقاتك المسندة ({myHalaqat.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myHalaqat.map((h) => (
                      <div
                        key={h.id}
                        className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-3.5 space-y-2"
                      >
                        <div className="font-bold text-white text-sm">{h.name}</div>
                        <div className="text-xs text-[#D4AF37]">
                          {h.subject} • {h.scheduleTime}
                        </div>
                        {h.zoomUrl && (
                          <a
                            href={h.zoomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/30 text-blue-200 text-xs font-bold"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>رابط الحلقة</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myCerts.length > 0 && (
                <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-[#F3E5AB] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#D4AF37]" />
                    <span>شهاداتك وإجازاتك المسجلة ({myCerts.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {myCerts.map((cert, i) => (
                      <div
                        key={cert.id || i}
                        className="bg-[#07241B]/80 border border-[#D4AF37]/30 rounded-2xl p-3 space-y-2"
                      >
                        <p className="text-xs font-bold text-white truncate">{cert.name}</p>
                        {cert.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ title: cert.name, url: cert.imageUrl })}
                            className="w-full relative group rounded-xl overflow-hidden border border-[#D4AF37]/30 cursor-pointer"
                          >
                            <img src={cert.imageUrl} alt={cert.name} className="w-full h-32 object-cover" />
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                              <Eye className="w-4 h-4" />
                              عرض الشهادة
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold font-amiri text-[#F3E5AB] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  <span>حصص النهاردة ({todayArabic})</span>
                </h3>

                {myTodaySchedules.length === 0 ? (
                  <div className="bg-[#0B3D2E]/60 border border-dashed border-[#D4AF37]/30 rounded-3xl p-10 text-center space-y-2">
                    <Calendar className="w-12 h-12 text-[#D4AF37]/50 mx-auto" />
                    <p className="text-base font-bold font-amiri text-white">
                      لا توجد لديك حصص مجدولة ليوم {todayArabic}
                    </p>
                    <p className="text-xs text-slate-400">
                      يمكنك عرض «طلابي حسب المنهج» أو إنشاء اختبارات وواجبات من القائمة الجانبية.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTodaySchedules.map((sch) => {
                      const student = students.find((s) => s.id === sch.studentId);
                      const todayAttendance = attendance.find(
                        (a) =>
                          a.studentId === sch.studentId &&
                          a.date === todayStr &&
                          (!a.scheduleId || a.scheduleId === sch.id)
                      );

                      const parentPhoneClean = cleanWhatsAppNumber(
                        student?.parentPhone || student?.phone || ''
                      );
                      const absenceWhatsAppText = encodeURIComponent(
                        `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${sch.studentName})،\nنحيطكم علماً بأن الطالب تغيّب اليوم عن الحصة (${sch.day} - ${sch.time}) مع ${activeTeacher.name}.\nنرجو التواصل للاطمئنان عليه.\n${settings.academyName}`
                      );

                      return (
                        <div
                          key={sch.id}
                          className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 shadow-xl space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                            <div>
                              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40">
                                {sch.time}
                              </span>
                              <h4 className="text-lg font-bold font-amiri text-white mt-2">
                                الطالب: {sch.studentName}
                              </h4>
                              <p className="text-xs text-slate-300">
                                {student?.currentSurah ? `السورة الحالية: ${student.currentSurah}` : sch.courseType}
                              </p>
                            </div>

                            {student && (
                              <div className="text-left bg-[#07241B] px-3 py-2 rounded-xl border border-[#D4AF37]/25">
                                <span className="text-[10px] text-slate-400 block">النجوم الحالية</span>
                                <span className="text-sm font-extrabold text-[#D4AF37] tabular-nums">
                                  {student.stars || 0} / 10 ⭐
                                </span>
                              </div>
                            )}
                          </div>

                          {student && !isRejected ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => onMarkAttendance(student, 'present', sch)}
                                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    todayAttendance?.status === 'present'
                                      ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                                      : 'bg-[#07241B] text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>حضر</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onMarkAttendance(student, 'absent', sch)}
                                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    todayAttendance?.status === 'absent'
                                      ? 'bg-red-600 text-white border-red-400 shadow'
                                      : 'bg-[#07241B] text-red-300 border-red-500/30 hover:bg-red-600/20'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>غاب</span>
                                </button>
                              </div>

                              {todayAttendance?.status === 'absent' && (
                                <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-3 space-y-2">
                                  <p className="text-xs font-bold text-red-200">
                                    ⚠️ تم تسجيل غياب الطالب اليوم ({todayStr})
                                  </p>
                                  <a
                                    href={`https://wa.me/${parentPhoneClean}?text=${absenceWhatsAppText}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold transition"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>إرسال رسالة غياب لولي الأمر (واتساب)</span>
                                  </a>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const res = onAddStar(student);
                                  if (res.reachedTen) {
                                    setStarAlert(
                                      `الطالب (${student.name}) أتم 10 نجوم ويستحق شهادة تقدير!`
                                    );
                                  }
                                }}
                                className="w-full gold-gradient-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition active:scale-95"
                              >
                                <Sparkles className="w-4 h-4 text-[#07241B]" />
                                <span>إعطاء نجمة تفوق للطالب (+1 ⭐)</span>
                              </button>
                            </div>
                          ) : null}

                          {sch.sessionUrl && (
                            <a
                              href={sch.sessionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-400/30 text-xs font-bold transition"
                            >
                              <Video className="w-4 h-4" />
                              <span>فتح رابط الحلقة المباشرة</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: Create Exams & Add Grades */}
          {activePortalTab === 'exams' && (
            <div className="space-y-6">
              {examSavedToast && (
                <div
                  role="status"
                  className="bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-emerald-100 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{examSavedToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExamSavedToast(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleCreateExam}
                className="bg-[#0B3D2E] border-2 border-[#D4AF37]/45 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/25">
                  <PlusCircle className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-bold font-amiri text-white">إنشاء اختبار جديد لطلابك</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">عنوان الاختبار *</label>
                    <input
                      type="text"
                      required
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="مثال: اختبار تقييم الشهر الأول"
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">المادة (حسب موادك)</label>
                    <select
                      value={effectiveExamSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
                    >
                      {teacherSubjectOptions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">تاريخ الاختبار</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">الدرجة النهائية</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      required
                      value={examMaxScore}
                      onChange={(e) => setExamMaxScore(Number(e.target.value))}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">الحلقة (اختياري)</label>
                    <select
                      value={examHalaqaId}
                      onChange={(e) => setExamHalaqaId(e.target.value)}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900"
                    >
                      <option value="">كل طلاب المعلم في المادة</option>
                      {myHalaqat.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">وصف الاختبار (اختياري)</label>
                    <input
                      type="text"
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="مثال: الوحدة الأولى والثانية"
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRejected}
                  className="gold-gradient-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-lg cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4 text-[#07241B]" />
                  <span>إنشاء الاختبار وبدء رصد الدرجات</span>
                </button>
              </form>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-4 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg">
                  <h4 className="text-base font-bold font-amiri text-[#F3E5AB]">
                    اختباراتك ({teacherExams.length})
                  </h4>

                  {teacherExams.length === 0 ? (
                    <p className="text-xs text-slate-300 py-6 text-center">
                      لم تقم بإنشاء أي اختبارات لهذه المادة بعد.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
                      {teacherExams.map((ex) => {
                        const isSelected = activeExam?.id === ex.id;
                        return (
                          <div
                            key={ex.id}
                            onClick={() => setSelectedExamId(ex.id)}
                            className={`rounded-2xl p-3.5 border transition cursor-pointer space-y-1.5 ${
                              isSelected
                                ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227] shadow-md'
                                : 'bg-[#07241B]/85 text-white border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-extrabold">{ex.title}</h5>
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  onDeleteExam(ex.id);
                                }}
                                title="حذف الاختبار"
                                className={`p-1 rounded-lg transition cursor-pointer ${
                                  isSelected
                                    ? 'text-red-700 hover:bg-red-100'
                                    : 'text-red-300 hover:bg-red-900/40'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p
                              className={`text-[11px] font-semibold ${
                                isSelected ? 'text-[#0a4d2e]/80' : 'text-[#D4AF37]'
                              }`}
                            >
                              {ex.subject} • {ex.examDate} • النهاية: {ex.maxScore}
                            </p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-[#0a4d2e] text-[#fffdf5]'
                                  : 'bg-[#0B3D2E] text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              تم رصد {ex.grades.length} طالب
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-8 bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 shadow-xl space-y-4">
                  {!activeExam ? (
                    <div className="py-12 text-center space-y-2">
                      <ClipboardCheck className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
                      <p className="text-sm font-bold text-white">اختر اختباراً أو أنشئ اختباراً جديداً لرصد الدرجات</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
                        <div>
                          <span className="text-[11px] font-bold text-[#D4AF37]">
                            {activeExam.subject} • {activeExam.examDate}
                            {activeExam.halaqaName ? ` • ${activeExam.halaqaName}` : ''}
                          </span>
                          <h4 className="text-lg font-bold font-amiri text-white">
                            رصد درجات: {activeExam.title} (من {activeExam.maxScore})
                          </h4>
                          {activeExam.description && (
                            <p className="text-xs text-slate-300 mt-0.5">{activeExam.description}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveAllEnteredGrades(activeExam)}
                          className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow cursor-pointer shrink-0"
                        >
                          <Save className="w-4 h-4 text-[#07241B]" />
                          <span>حفظ كل الدرجات</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            placeholder="ابحث عن اسم الطالب..."
                            className="w-full bg-white border border-[#D4AF37]/50 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900"
                          />
                          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-[#F3E5AB] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showAllAcademyStudents}
                            onChange={(e) => setShowAllAcademyStudents(e.target.checked)}
                            className="rounded accent-[#c9a227]"
                          />
                          <span>عرض كل طلاب الأكاديمية ({students.length})</span>
                        </label>
                      </div>

                      {gradableStudents.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-300">
                          لا يوجد طلاب مسجلين لعرضهم حالياً.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                          {gradableStudents.map((st) => {
                            const draft = getDraftForStudent(activeExam, st.id);
                            const savedGrade = activeExam.grades.find((g) => g.studentId === st.id);
                            const liveNum = Number(draft.score);
                            const previewLabel =
                              draft.score.trim() !== '' && !isNaN(liveNum)
                                ? computeGradeLabel(
                                    Math.max(0, Math.min(activeExam.maxScore, liveNum)),
                                    activeExam.maxScore
                                  )
                                : savedGrade?.gradeLabel || '';

                            return (
                              <div
                                key={st.id}
                                className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-3.5 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <h5 className="text-sm font-bold text-white">{st.name}</h5>
                                    <p className="text-[11px] text-slate-400">
                                      {formatStudentCurriculumBadge(st) || st.halaqaName || st.course}
                                    </p>
                                  </div>
                                  {previewLabel && (
                                    <span className="px-2.5 py-1 rounded-lg bg-[#0B3D2E] border border-[#D4AF37]/40 text-[11px] font-extrabold text-[#F3E5AB]">
                                      التقدير: {previewLabel}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs">
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] text-[#D4AF37] mb-1">
                                      الدرجة (من {activeExam.maxScore})
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={activeExam.maxScore}
                                      value={draft.score}
                                      onChange={(e) =>
                                        updateDraftForStudent(activeExam, st.id, 'score', e.target.value)
                                      }
                                      placeholder={`0 - ${activeExam.maxScore}`}
                                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-slate-900 font-bold tabular-nums"
                                    />
                                  </div>

                                  <div className="sm:col-span-6">
                                    <label className="block text-[10px] text-[#D4AF37] mb-1">ملاحظات المعلم</label>
                                    <input
                                      type="text"
                                      value={draft.notes}
                                      onChange={(e) =>
                                        updateDraftForStudent(activeExam, st.id, 'notes', e.target.value)
                                      }
                                      placeholder="ملاحظات على الأداء..."
                                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3 py-2 text-slate-900"
                                    />
                                  </div>

                                  <div className="sm:col-span-3 sm:pt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSingleStudentGrade(activeExam, st)}
                                      className="w-full py-2 px-3 rounded-xl bg-[#0a4d2e] hover:bg-[#145A43] border border-[#c9a227] text-[#fffdf5] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
                                    >
                                      <Save className="w-3.5 h-3.5 text-[#c9a227]" />
                                      <span>{savedGrade ? 'تحديث الدرجة' : 'حفظ الدرجة'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: Homework Assignments */}
          {activePortalTab === 'homework' && (
            <div className="space-y-6">
              {hwToast && (
                <div
                  role="status"
                  className="bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-emerald-100 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{hwToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHwToast(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleCreateHomework}
                className="bg-[#0B3D2E] border-2 border-[#D4AF37]/45 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#D4AF37]/25">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-bold font-amiri text-white">إضافة واجب دراسي جديد</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">عنوان الواجب *</label>
                    <input
                      type="text"
                      required
                      value={hwTitle}
                      onChange={(e) => setHwTitle(e.target.value)}
                      placeholder="مثال: حل تمارين الدرس الثالث"
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">المادة</label>
                    <select
                      value={effectiveHwSubject}
                      onChange={(e) => setHwSubject(e.target.value)}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
                    >
                      {teacherSubjectOptions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">تاريخ التسليم</label>
                    <input
                      type="date"
                      required
                      value={hwDueDate}
                      onChange={(e) => setHwDueDate(e.target.value)}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">النظام المستهدف</label>
                    <select
                      value={hwSystem}
                      onChange={(e) => setHwSystem(e.target.value as EducationSystem | 'both')}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
                    >
                      <option value="both">عام + أزهري</option>
                      <option value="general">مصري عام</option>
                      <option value="azhar">أزهري</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">المرحلة (اختياري)</label>
                    <select
                      value={hwStage}
                      onChange={(e) => {
                        setHwStage(e.target.value as EducationStage | '');
                        setHwGrade('');
                      }}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900"
                    >
                      <option value="">كل المراحل</option>
                      {EDUCATION_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#F3E5AB] mb-1">الصف الدراسي (اختياري)</label>
                    <select
                      value={hwGrade}
                      onChange={(e) => setHwGrade(e.target.value)}
                      disabled={!hwStage}
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2.5 text-slate-900 disabled:opacity-60"
                    >
                      <option value="">كل الصفوف</option>
                      {hwStage &&
                        getGradesForStage(hwStage).map((g) => (
                          <option key={g} value={g}>
                            الصف {g}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-bold text-[#F3E5AB] mb-1">تفاصيل الواجب (اختياري)</label>
                    <textarea
                      rows={2}
                      value={hwDescription}
                      onChange={(e) => setHwDescription(e.target.value)}
                      placeholder="اكتب أرقام الصفحات أو الأسئلة المطلوبة..."
                      className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-3.5 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!onSaveHomework || isRejected}
                  className="gold-gradient-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#07241B]" />
                  <span>نشر الواجب للطلاب</span>
                </button>
              </form>

              <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-5 space-y-3 shadow-lg">
                <h4 className="text-base font-bold font-amiri text-[#F3E5AB]">
                  الواجبات المنشورة ({teacherHomeworks.length})
                </h4>
                {teacherHomeworks.length === 0 ? (
                  <p className="text-xs text-slate-300 py-6 text-center">
                    لا توجد واجبات منشورة لهذه المادة بعد.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {teacherHomeworks.map((hw) => (
                      <div
                        key={hw.id}
                        className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-sm font-bold text-white">{hw.title}</h5>
                            <p className="text-[11px] text-[#D4AF37] font-semibold">
                              {hw.subject}
                              {hw.educationSystem && hw.educationSystem !== 'both'
                                ? ` • ${EDUCATION_SYSTEM_LABELS[hw.educationSystem]}`
                                : ''}
                              {hw.stage ? ` • ${hw.stage}` : ''}
                              {hw.gradeLevel ? ` (${hw.gradeLevel})` : ''}
                            </p>
                          </div>
                          {onDeleteHomework && (
                            <button
                              type="button"
                              onClick={() => onDeleteHomework(hw.id)}
                              className="p-1.5 rounded-lg text-red-300 hover:bg-red-900/40 cursor-pointer"
                              title="حذف الواجب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {hw.description && (
                          <p className="text-xs text-slate-300 leading-relaxed">{hw.description}</p>
                        )}
                        <div className="text-[11px] text-emerald-300 font-bold">
                          موعد التسليم: <span dir="ltr" className="font-mono">{hw.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-[#fffdf5] border-2 border-[#c9a227] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#0a4d2e]">{lightboxImage.title}</h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-[#0a4d2e] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
