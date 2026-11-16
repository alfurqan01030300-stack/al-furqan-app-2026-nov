import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  LogOut,
  Phone,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Video,
  XCircle,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  CertificateRecord,
  Exam,
  HalaqaGroup,
  HomeworkAssignment,
  ScheduleAppointment,
  Student,
  Teacher,
} from '../types';
import { getParentDirectorySnapshot, normalizePhoneForMatch } from '../utils/storage';
import { PublicParentSnapshot } from '../firebase/firestoreService';
import {
  EDUCATION_SYSTEM_LABELS,
  formatStudentCurriculumBadge,
  getStudentEnrolledSubjects,
  subjectsMatch,
} from '../data/curricula';
import { CurriculumLibraryIcon } from './CurriculumLibraryIcon';
import { CurriculumLibraryView } from './CurriculumLibraryView';
import {
  StudentRegistrationScreen,
  StudentSelfRegistrationPayload,
} from './StudentRegistrationScreen';
import { CurriculumEmblemIcon } from './CurriculumEmblemIcon';

interface StudentPortalViewProps {
  students: Student[];
  teachers: Teacher[];
  halaqat: HalaqaGroup[];
  schedules: ScheduleAppointment[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  homeworks?: HomeworkAssignment[];
  settings: AcademySettings;
  loggedStudentId: string;
  onLoginStudent: (studentId: string) => void;
  onLogoutStudent: () => void;
  onOpenCertificate: (student: Student, cert?: CertificateRecord) => void;
  onLookupRemoteByPhone?: (phone: string) => Promise<PublicParentSnapshot | null>;
  onBack?: () => void;
  showRegisterView?: boolean;
  onOpenStudentRegister?: () => void;
  onCloseRegisterView?: () => void;
  onSubmitStudentRegistration?: (
    payload: StudentSelfRegistrationPayload
  ) => Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }>;
  onCheckStudentPhoneExists?: (normalizedPhone: string) => Promise<boolean>;
}

function getGradeBadgeStyle(gradeLabel: string): string {
  switch (gradeLabel) {
    case 'ممتاز':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50';
    case 'جيد جداً':
      return 'bg-teal-500/20 text-teal-200 border-teal-400/50';
    case 'جيد':
      return 'bg-[#D4AF37]/20 text-[#F3E5AB] border-[#D4AF37]/50';
    case 'مقبول':
      return 'bg-amber-500/20 text-amber-200 border-amber-400/50';
    default:
      return 'bg-red-500/20 text-red-200 border-red-400/50';
  }
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  students,
  teachers,
  halaqat,
  schedules,
  attendance,
  exams,
  homeworks = [],
  settings,
  loggedStudentId,
  onLoginStudent,
  onLogoutStudent,
  onOpenCertificate,
  onLookupRemoteByPhone,
  onBack,
  showRegisterView = false,
  onOpenStudentRegister,
  onCloseRegisterView,
  onSubmitStudentRegistration,
  onCheckStudentPhoneExists,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidateStudents, setCandidateStudents] = useState<Student[]>([]);
  const [remoteFallbackData, setRemoteFallbackData] = useState<PublicParentSnapshot | null>(null);
  const [showMyCurriculaPanel, setShowMyCurriculaPanel] = useState(false);

  const activeStudent: Student | null =
    students.find((s) => s.id === loggedStudentId) ||
    (remoteFallbackData && remoteFallbackData.student.id === loggedStudentId
      ? remoteFallbackData.student
      : null);

  const enrolledSubjects = useMemo(() => {
    if (!activeStudent) return [];
    return getStudentEnrolledSubjects(activeStudent);
  }, [activeStudent]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizePhoneForMatch(phoneInput);
    if (norm.length < 6) {
      setLoginError('أدخل رقم الهاتف المسجل بشكل صحيح، أو قدّم كطالب جديد');
      return;
    }

    setSearching(true);
    setLoginError('');
    setCandidateStudents([]);

    let found = students.filter(
      (s) =>
        normalizePhoneForMatch(s.phone) === norm ||
        normalizePhoneForMatch(s.parentPhone) === norm
    );

    if (found.length === 0) {
      const localDir = getParentDirectorySnapshot();
      if (localDir?.students?.length) {
        found = (localDir.students as Student[]).filter(
          (s) =>
            normalizePhoneForMatch(s.phone) === norm ||
            normalizePhoneForMatch(s.parentPhone) === norm
        );
      }
    }

    if (found.length === 0 && onLookupRemoteByPhone) {
      const remoteSnap = await onLookupRemoteByPhone(norm).catch(() => null);
      if (remoteSnap?.student) {
        setRemoteFallbackData(remoteSnap);
        found = [remoteSnap.student];
      }
    }

    setSearching(false);

    if (found.length === 0) {
      setLoginError('هذا الرقم غير مسجل في بيانات الطلاب، يمكنك التقديم الآن كطالب جديد.');
      return;
    }

    if (found.length === 1) {
      onLoginStudent(found[0].id);
      return;
    }

    setCandidateStudents(found);
  };

  // Registration View inside Student Portal when clicked "تقديم طالب جديد"
  if (
    !activeStudent &&
    showRegisterView &&
    onSubmitStudentRegistration &&
    onCheckStudentPhoneExists &&
    onCloseRegisterView
  ) {
    return (
      <StudentRegistrationScreen
        prefillPhone={phoneInput}
        onSubmitRegistration={onSubmitStudentRegistration}
        onCheckPhoneExists={onCheckStudentPhoneExists}
        onBackToLogin={onCloseRegisterView}
      />
    );
  }

  // VIEW 1: Student Login Gate
  if (!activeStudent) {
    return (
      <div className="max-w-lg mx-auto w-full px-4 py-6 sm:py-10 animate-fadeIn">
        {onBack && (
          <div className="mb-4 flex justify-start">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#07241B]/80 hover:bg-[#07241B] border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              <span>رجوع</span>
            </button>
          </div>
        )}

        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <CurriculumEmblemIcon mode="all" size="sm" />
            </div>
            <h2 className="text-2xl font-bold font-amiri text-white">بوابة الطالب</h2>
            <p className="text-xs text-[#D4AF37] leading-relaxed">
              سجّل دخولك برقم الهاتف المسجل لمتابعة موادك، واجباتك، ونتائج اختباراتك
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم الهاتف المسجل
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  autoComplete="off"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-white border border-[#D4AF37]/50 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 text-left font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {loginError && (
              <div
                role="alert"
                className="bg-red-950/70 border border-red-400/50 rounded-xl p-3 text-xs font-bold text-red-100 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={searching}
              className="w-full gold-gradient-btn py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-95 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4 text-[#07241B]" />
              <span>{searching ? 'جاري البحث عن حسابك...' : 'دخول لحساب الطالب'}</span>
            </button>
          </form>

          {onOpenStudentRegister && (
            <div className="pt-4 border-t border-[#D4AF37]/25 space-y-2 text-center">
              <p className="text-xs text-slate-300">طالب جديد وتريد اختيار نظامك وموادك؟</p>
              <button
                type="button"
                onClick={onOpenStudentRegister}
                className="w-full py-3 rounded-xl bg-[#07241B] hover:bg-[#145A43] border-2 border-[#D4AF37]/60 text-[#F3E5AB] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span>تقديم طالب جديد (أول مرة)</span>
              </button>
            </div>
          )}

          {candidateStudents.length > 1 && (
            <div className="pt-4 border-t border-[#D4AF37]/30 space-y-2.5">
              <p className="text-xs font-bold text-[#F3E5AB]">
                تم العثور على أكثر من طالب بهذا الرقم — اختر اسمك للدخول:
              </p>
              <div className="space-y-2">
                {candidateStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onLoginStudent(st.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#07241B] hover:bg-[#145A43] border border-[#D4AF37]/40 text-right cursor-pointer transition"
                  >
                    <div>
                      <span className="block text-sm font-bold text-white">{st.name}</span>
                      <span className="block text-[11px] text-[#D4AF37]">
                        {formatStudentCurriculumBadge(st) || st.course}
                      </span>
                    </div>
                    <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: Student Portal Dashboard (Filtered strictly to student's enrolled subjects)
  const completedJuz = activeStudent.completedJuz ?? 0;
  const remainingJuz = Math.max(0, 30 - completedJuz);
  const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
  const stars = activeStudent.stars ?? 0;

  const assignedTeacher =
    teachers.find((t) => t.id === activeStudent.assignedTeacherId) || null;
  const teacherDisplayName =
    assignedTeacher?.name || remoteFallbackData?.teacherName || 'غير محدد';

  const studentHalaqa = halaqat.find((h) => h.id === activeStudent.halaqaId) || null;
  const studentSchedules = schedules.filter((sch) => sch.studentId === activeStudent.id);

  const effectiveAttendance =
    remoteFallbackData && remoteFallbackData.student.id === activeStudent.id && attendance.length === 0
      ? remoteFallbackData.attendance
      : attendance.filter((a) => a.studentId === activeStudent.id);

  const presentCount = effectiveAttendance.filter((a) => a.status === 'present').length;
  const absentCount = effectiveAttendance.filter((a) => a.status === 'absent').length;
  const totalSessions = presentCount + absentCount;
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  const subjectIsEnrolled = (subj: string) => {
    if (!activeStudent.selectedSubjects || activeStudent.selectedSubjects.length === 0) {
      return enrolledSubjects.some((s) => subjectsMatch(s, subj));
    }
    return activeStudent.selectedSubjects.some((s) => subjectsMatch(s, subj));
  };

  // Graded exams filtered strictly by student's chosen subjects
  const gradedExamEntries = exams
    .map((ex) => {
      const grade = ex.grades.find((g) => g.studentId === activeStudent.id);
      if (!grade) return null;
      if (activeStudent.selectedSubjects?.length && !subjectIsEnrolled(ex.subject)) {
        return null;
      }
      return { exam: ex, grade };
    })
    .filter((item): item is { exam: Exam; grade: Exam['grades'][number] } => Boolean(item));

  const remoteSnapshotExams =
    gradedExamEntries.length === 0 && remoteFallbackData?.exams?.length
      ? remoteFallbackData.exams
      : [];

  // Pending exams filtered by subject AND (assigned teacher OR curriculum teacher matching student's subjects)
  const pendingExams = exams.filter((ex) => {
    const alreadyGraded = ex.grades.some((g) => g.studentId === activeStudent.id);
    if (alreadyGraded) return false;
    if (!subjectIsEnrolled(ex.subject)) return false;
    const matchesTeacher =
      activeStudent.assignedTeacherId && ex.teacherId === activeStudent.assignedTeacherId;
    const matchesHalaqa = activeStudent.halaqaId && ex.halaqaId === activeStudent.halaqaId;
    return matchesTeacher || matchesHalaqa || Boolean(activeStudent.selectedSubjects?.length);
  });

  // Homeworks filtered strictly by student's enrolled subjects, system, and stage
  const studentHomeworks = homeworks.filter((hw) => {
    if (!subjectIsEnrolled(hw.subject)) return false;
    if (
      hw.educationSystem &&
      hw.educationSystem !== 'both' &&
      activeStudent.educationSystem &&
      hw.educationSystem !== activeStudent.educationSystem
    ) {
      return false;
    }
    if (hw.stage && activeStudent.stage && !activeStudent.stage.includes(hw.stage)) {
      return false;
    }
    if (hw.gradeLevel && activeStudent.gradeLevel && hw.gradeLevel !== activeStudent.gradeLevel) {
      return false;
    }
    return true;
  });

  const avgExamPercent =
    gradedExamEntries.length > 0
      ? Math.round(
          gradedExamEntries.reduce(
            (sum, item) =>
              sum + Math.round((item.grade.score / Math.max(1, item.grade.maxScore)) * 100),
            0
          ) / gradedExamEntries.length
        )
      : remoteSnapshotExams.length > 0
      ? Math.round(
          remoteSnapshotExams.reduce(
            (sum, r) => sum + Math.round((r.score / Math.max(1, r.maxScore)) * 100),
            0
          ) / remoteSnapshotExams.length
        )
      : null;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-5 space-y-6 animate-fadeIn pb-14">
      {/* Top Greeting Header with Colorful Curriculum Library Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/45 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40 font-bold">
              حساب الطالب • {settings.academyName}
            </span>
            {activeStudent.educationSystem && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-900/70 text-emerald-200 border border-emerald-400/40 font-bold">
                {formatStudentCurriculumBadge(activeStudent)}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white">
            مرحباً يا بطل: {activeStudent.name}
          </h2>
          <p className="text-xs text-[#F3E5AB] flex flex-wrap items-center gap-2">
            <span>{activeStudent.course}</span>
            {activeStudent.halaqaName || studentHalaqa?.name ? (
              <span>• الحلقة: {activeStudent.halaqaName || studentHalaqa?.name}</span>
            ) : null}
            <span>• المعلم: {teacherDisplayName}</span>
          </p>

          {/* Student's Enrolled Subjects Only */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#D4AF37]">موادك المسجلة:</span>
            {enrolledSubjects.map((subj) => (
              <span
                key={subj}
                className="px-2.5 py-0.5 rounded-lg bg-[#07241B] text-[#fffdf5] border border-[#D4AF37]/40 text-[11px] font-bold"
              >
                {subj}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Colorful Library Icon (Scoped STRICTLY to student's enrolled subjects) */}
          <CurriculumLibraryIcon
            compact
            label="مقرراتي كلها"
            active={showMyCurriculaPanel}
            onClick={() => setShowMyCurriculaPanel((v) => !v)}
          />

          <button
            type="button"
            onClick={onLogoutStudent}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer transition"
          >
            <LogOut className="w-4 h-4 text-[#D4AF37]" />
            <span>تبديل الطالب</span>
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#07241B] hover:bg-[#145A43] border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-bold cursor-pointer transition"
            >
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              <span>رجوع</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Scoped Curricula Panel for Student */}
      {showMyCurriculaPanel && (
        <CurriculumLibraryView mode="student" student={activeStudent} />
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-4 shadow space-y-1">
          <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>المواد والأجزاء</span>
          </span>
          <div className="text-xl sm:text-2xl font-black font-amiri text-white tabular-nums">
            {enrolledSubjects.length} مادة
          </div>
          <span className="text-[11px] text-emerald-300 font-bold block tabular-nums">
            حفظ القرآن: {completedJuz}/30 جزء
          </span>
        </div>

        <div className="bg-[#0B3D2E] border border-emerald-500/40 rounded-2xl p-4 shadow space-y-1">
          <span className="text-[11px] text-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>نسبة الحضور</span>
          </span>
          <div className="text-xl sm:text-2xl font-black font-amiri text-emerald-300 tabular-nums">
            {attendanceRate}%
          </div>
          <span className="text-[11px] text-slate-300 block tabular-nums">
            حضر {presentCount} • غاب {absentCount}
          </span>
        </div>

        <div className="bg-[#0B3D2E] border border-amber-400/40 rounded-2xl p-4 shadow space-y-1">
          <span className="text-[11px] text-amber-200 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>الاختبارات</span>
          </span>
          <div className="text-xl sm:text-2xl font-black font-amiri text-[#F3E5AB] tabular-nums">
            {avgExamPercent !== null ? `${avgExamPercent}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-300 block tabular-nums">
            {gradedExamEntries.length + remoteSnapshotExams.length} اختبار مرصود
          </span>
        </div>

        <div className="bg-[#0B3D2E] border border-[#D4AF37]/45 rounded-2xl p-4 shadow space-y-1">
          <span className="text-[11px] text-[#F3E5AB] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
            <span>النجوم والواجبات</span>
          </span>
          <div className="text-xl sm:text-2xl font-black font-amiri text-[#D4AF37] tabular-nums">
            {stars} / 10 ⭐
          </div>
          <span className="text-[11px] text-slate-300 block tabular-nums">
            {studentHomeworks.length} واجب مطلوب
          </span>
        </div>
      </div>

      {/* Homework Assignments for Student's Enrolled Subjects */}
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <h3 className="text-lg font-bold font-amiri text-[#F3E5AB] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            <span>الواجبات الدراسية ({studentHomeworks.length})</span>
          </h3>
        </div>
        {studentHomeworks.length === 0 ? (
          <p className="text-xs text-slate-300 py-3">
            لا توجد واجبات منشورة في موادك المسجلة حالياً.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studentHomeworks.map((hw) => (
              <div
                key={hw.id}
                className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#c9a227] text-[#07241B] text-[11px] font-extrabold">
                    {hw.subject}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-mono" dir="ltr">
                    {hw.dueDate}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{hw.title}</h4>
                {hw.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{hw.description}</p>
                )}
                <p className="text-[11px] text-[#D4AF37]">المعلم: {hw.teacherName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Memorization Progress Bar (if Quran or General Memorization is part of plan) */}
      {(activeStudent.completedJuz !== undefined ||
        enrolledSubjects.some((s) => s.includes('قرآن'))) && (
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>مسيرة الحفظ في القرآن الكريم</span>
            </div>
            <span className="text-xs font-bold text-[#F3E5AB]">
              السورة الحالية: {activeStudent.currentSurah || 'سورة الفاتحة'}
            </span>
          </div>
          <div className="w-full h-4 bg-[#07241B] rounded-full overflow-hidden border border-[#D4AF37]/30">
            <div
              className="h-full bg-gradient-to-l from-[#F3E5AB] via-[#D4AF37] to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              أتممت حفظ: <strong className="text-emerald-300">{completedJuz} جزء</strong>
            </span>
            <span>
              المتبقي للختمة: <strong className="text-[#F3E5AB]">{remainingJuz} جزء</strong>
            </span>
          </div>
        </div>
      )}

      {/* Exam Results Section (Filtered to Student's Enrolled Subjects) */}
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
          <h3 className="text-lg font-bold font-amiri text-[#F3E5AB] flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#D4AF37]" />
            <span>نتائج الاختبارات والدرجات (في موادك)</span>
          </h3>
          {avgExamPercent !== null && (
            <span className="px-3 py-1 rounded-full bg-[#07241B] border border-[#D4AF37]/40 text-xs font-extrabold text-[#D4AF37] tabular-nums">
              المتوسط العام: {avgExamPercent}%
            </span>
          )}
        </div>

        {gradedExamEntries.length === 0 &&
        remoteSnapshotExams.length === 0 &&
        pendingExams.length === 0 ? (
          <p className="text-xs text-slate-300 py-4 text-center">
            لم تُضف اختبارات في موادك المسجلة بعد.
          </p>
        ) : (
          <div className="space-y-3">
            {gradedExamEntries.map(({ exam, grade }) => {
              const pct = Math.round((grade.score / Math.max(1, grade.maxScore)) * 100);
              return (
                <div
                  key={exam.id}
                  className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{exam.title}</h4>
                      <p className="text-xs text-[#D4AF37] mt-0.5">
                        {exam.subject} • المعلم: {exam.teacherName} •{' '}
                        <span className="font-mono" dir="ltr">
                          {exam.examDate}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-[#0B3D2E] border border-[#D4AF37]/40 text-sm font-black text-white tabular-nums">
                        {grade.score} / {grade.maxScore} ({pct}%)
                      </span>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${getGradeBadgeStyle(
                          grade.gradeLabel
                        )}`}
                      >
                        {grade.gradeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#0B3D2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-[#F3E5AB] to-[#D4AF37]"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>

                  {grade.notes && (
                    <p className="text-xs text-emerald-200 bg-[#0B3D2E]/70 rounded-xl px-3 py-2">
                      <strong>ملاحظة المعلم:</strong> {grade.notes}
                    </p>
                  )}
                </div>
              );
            })}

            {remoteSnapshotExams.map((res) => {
              const pct = Math.round((res.score / Math.max(1, res.maxScore)) * 100);
              return (
                <div
                  key={res.examId}
                  className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{res.examTitle}</h4>
                      <p className="text-xs text-[#D4AF37] mt-0.5">
                        {res.subject} • {res.teacherName} • {res.examDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-[#0B3D2E] border border-[#D4AF37]/40 text-sm font-black text-white tabular-nums">
                        {res.score} / {res.maxScore} ({pct}%)
                      </span>
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${getGradeBadgeStyle(
                          res.gradeLabel
                        )}`}
                      >
                        {res.gradeLabel}
                      </span>
                    </div>
                  </div>
                  {res.notes && (
                    <p className="text-xs text-emerald-200">
                      <strong>ملاحظة المعلم:</strong> {res.notes}
                    </p>
                  )}
                </div>
              );
            })}

            {pendingExams.map((ex) => (
              <div
                key={ex.id}
                className="bg-[#07241B]/60 border border-dashed border-[#D4AF37]/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{ex.title}</h4>
                  <p className="text-xs text-slate-300">
                    {ex.subject} • {ex.examDate} • الدرجة النهائية: {ex.maxScore}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 text-[11px] font-bold">
                  بانتظار رصد الدرجة
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Sessions & Halaqa Link */}
      {(studentHalaqa || studentSchedules.length > 0) && (
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-5 space-y-3 shadow-lg">
          <h3 className="text-base font-bold font-amiri text-[#F3E5AB] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <span>حلقاتي ومواعيدي</span>
          </h3>

          {studentHalaqa && (
            <div className="bg-[#07241B]/85 border border-[#D4AF37]/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{studentHalaqa.name}</p>
                <p className="text-xs text-[#D4AF37]">
                  {studentHalaqa.subject} • {studentHalaqa.scheduleTime} • {studentHalaqa.teacherName}
                </p>
              </div>
              {studentHalaqa.zoomUrl && (
                <a
                  href={studentHalaqa.zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition"
                >
                  <Video className="w-4 h-4" />
                  <span>دخول الحلقة المباشرة</span>
                </a>
              )}
            </div>
          )}

          {studentSchedules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studentSchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-3.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {sch.day} — {sch.time}
                    </p>
                    <p className="text-xs text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 inline ml-1 text-[#D4AF37]" />
                      {sch.teacherName} ({sch.courseType || 'حصة تعليمية'})
                    </p>
                  </div>
                  {sch.sessionUrl && (
                    <a
                      href={sch.sessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600/30 text-blue-200 border border-blue-400/40 text-xs font-bold shrink-0"
                    >
                      رابط الحصة
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Reports + Attendance & Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-3xl p-5 space-y-3 shadow-lg">
          <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span>تقارير الحفظ والمراجعة اليومية</span>
          </h4>
          {!activeStudent.reports || activeStudent.reports.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد تقارير مسجلة حتى الآن.</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {activeStudent.reports.slice(0, 10).map((rep) => (
                <div
                  key={rep.id}
                  className="bg-[#07241B]/90 border border-white/10 rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[#D4AF37] font-bold">
                    <span>
                      المستوى:{' '}
                      {rep.level === 'excellent'
                        ? 'ممتاز'
                        : rep.level === 'medium'
                        ? 'متوسط'
                        : 'يحتاج متابعة'}
                    </span>
                    <span className="font-mono" dir="ltr">
                      {rep.date}
                    </span>
                  </div>
                  <p className="text-slate-200">
                    <strong className="text-white">الحفظ الجديد:</strong> {rep.newMemorization || '—'}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-slate-100">الماضي القريب:</strong> {rep.nearRevision || '—'} •{' '}
                    <strong className="text-slate-100">الماضي البعيد:</strong> {rep.farRevision || '—'}
                  </p>
                  {(rep.teacherNote || rep.reportNotes) && (
                    <p className="text-emerald-200/90">
                      <strong>توجيه المعلم:</strong> {rep.teacherNote || rep.reportNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-3xl p-5 space-y-4 shadow-lg">
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>سجل الحضور والغياب</span>
            </h4>
            {effectiveAttendance.length === 0 ? (
              <p className="text-xs text-slate-400">لم تُسجل حصص حضور أو غياب بعد.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {effectiveAttendance.slice(0, 20).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between text-xs bg-[#07241B]/80 px-3 py-2 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {rec.status === 'present' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={
                          rec.status === 'present'
                            ? 'text-emerald-300 font-bold'
                            : 'text-red-300 font-bold'
                        }
                      >
                        {rec.status === 'present' ? 'حضر الحصة' : 'غاب عن الحصة'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400" dir="ltr">
                      {rec.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>شهاداتي المعتمدة</span>
            </h4>
            {activeStudent.certificates && activeStudent.certificates.length > 0 ? (
              <div className="space-y-2">
                {activeStudent.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between gap-2 bg-[#07241B] px-3 py-2 rounded-xl border border-[#D4AF37]/35 text-xs"
                  >
                    <span className="font-bold text-white truncate">{cert.juzName}</span>
                    <button
                      type="button"
                      onClick={() => onOpenCertificate(activeStudent, cert)}
                      className="shrink-0 px-3 py-1 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold cursor-pointer"
                    >
                      عرض الشهادة
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">لم تصدر شهادات إتمام بعد.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
