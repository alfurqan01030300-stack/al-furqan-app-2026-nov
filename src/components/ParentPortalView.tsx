import React, { useState } from 'react';
import {
  Phone,
  LogIn,
  LogOut,
  BookOpen,
  Calendar,
  CreditCard,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  ClipboardCheck,
  FileText,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  CertificateRecord,
  Exam,
  HomeworkAssignment,
  PaymentRecord,
  Student,
  StudentExamResult,
  Teacher,
  TeacherRating,
} from '../types';
import {
  formatWhatsAppDirectNumber,
  getDaysUntilDate,
  getParentDirectorySnapshot,
  normalizePhoneForMatch,
} from '../utils/storage';
import { PUBLISHED_APP_URL } from '../utils/pwa';
import { isTemporaryPreviewHost } from '../firebase/config';
import { PublicParentSnapshot } from '../firebase/firestoreService';
import {
  formatStudentCurriculumBadge,
  getStudentEnrolledSubjects,
  subjectsMatch,
} from '../data/curricula';
import { CurriculumLibraryIcon } from './CurriculumLibraryIcon';
import { CurriculumLibraryView } from './CurriculumLibraryView';

interface ParentPortalViewProps {
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  exams?: Exam[];
  homeworks?: HomeworkAssignment[];
  directExamResults?: StudentExamResult[];
  teacherRatings: TeacherRating[];
  settings: AcademySettings;
  loggedParentPhone: string;
  onLoginParent: (phone: string, remoteMatch?: PublicParentSnapshot) => void;
  onLogoutParent: () => void;
  onSubmitTeacherRating?: (rating: Omit<TeacherRating, 'id' | 'createdAt'>) => void;
  onOpenCertificate: (student: Student, cert?: CertificateRecord) => void;
  onViewReceipt: (payment: PaymentRecord) => void;
  onBack?: () => void;
  onLookupRemoteByPhone?: (phone: string) => Promise<PublicParentSnapshot | null>;
  isDirectLink?: boolean;
  directChildId?: string;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  students,
  teachers,
  attendance,
  payments,
  exams = [],
  homeworks = [],
  directExamResults = [],
  settings,
  loggedParentPhone,
  onLoginParent,
  onLogoutParent,
  onOpenCertificate,
  onViewReceipt,
  onBack,
  onLookupRemoteByPhone,
  isDirectLink = false,
  directChildId = '',
}) => {
  const [phoneInput, setPhoneInput] = useState(loggedParentPhone || '');
  const [loginError, setLoginError] = useState('');
  const [searching, setSearching] = useState(false);
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [showChildCurricula, setShowChildCurricula] = useState(false);

  const currency = settings.currency || 'ر.س';

  const buildChildFollowUpLink = (childId: string): string => {
    const origin =
      typeof window !== 'undefined' && isTemporaryPreviewHost()
        ? window.location.origin
        : PUBLISHED_APP_URL;
    return `${origin}/?parent=${encodeURIComponent(childId)}`;
  };

  const buildWhatsAppShareUrl = (targetPhone: string, childName: string, link: string): string => {
    const msg = `أهلا بيك في أكاديمية الفرقان، اضغط هنا لتحميل التطبيق ومتابعة ابنك ${childName}: ${link}`;
    const cleanTarget = formatWhatsAppDirectNumber(targetPhone);
    return cleanTarget
      ? `https://wa.me/${cleanTarget}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const normalizedLogged = normalizePhoneForMatch(loggedParentPhone);
  const matchedChildren: Student[] = directChildId
    ? students.filter((s) => s.id === directChildId)
    : normalizedLogged
    ? students.filter(
        (s) =>
          normalizePhoneForMatch(s.parentPhone) === normalizedLogged ||
          normalizePhoneForMatch(s.phone) === normalizedLogged
      )
    : [];

  const handleCopyFollowLink = async (childId: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedChildId(childId);
      setTimeout(() => setCopiedChildId(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopiedChildId(childId);
        setTimeout(() => setCopiedChildId(null), 2500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizePhoneForMatch(phoneInput);
    if (norm.length < 6) {
      setLoginError('الرقم مش مسجل، تواصل مع الإدارة');
      return;
    }

    setSearching(true);
    setLoginError('');

    let foundChildren = students.filter(
      (s) =>
        normalizePhoneForMatch(s.parentPhone) === norm ||
        normalizePhoneForMatch(s.phone) === norm
    );

    let remoteSnapshot: PublicParentSnapshot | undefined;

    if (foundChildren.length === 0) {
      const localDir = getParentDirectorySnapshot();
      if (localDir?.students?.length) {
        const localMatches = (localDir.students as Student[]).filter(
          (s) =>
            normalizePhoneForMatch(s.parentPhone) === norm ||
            normalizePhoneForMatch(s.phone) === norm
        );
        if (localMatches.length > 0) {
          foundChildren = localMatches;
          const first = localMatches[0];
          const tObj = (localDir.teachers as Teacher[]).find(
            (t) => t.id === first.assignedTeacherId
          );
          remoteSnapshot = {
            student: first,
            teacherName: tObj?.name || '',
            attendance: (localDir.attendance as AttendanceRecord[]).filter(
              (a) => a.studentId === first.id
            ),
            payments: (localDir.payments as PaymentRecord[]).filter(
              (p) => p.studentId === first.id
            ),
            currency: settings.currency || 'ر.س',
            academyName: settings.academyName,
            updatedAt: Date.now(),
          };
        }
      }
    }

    if (foundChildren.length === 0 && onLookupRemoteByPhone) {
      const fetched = await onLookupRemoteByPhone(norm).catch(() => null);
      if (fetched?.student) {
        foundChildren = [fetched.student];
        remoteSnapshot = fetched;
      }
    }

    setSearching(false);

    if (foundChildren.length === 0) {
      setLoginError('الرقم مش مسجل، تواصل مع الإدارة');
      return;
    }

    onLoginParent(phoneInput.trim(), remoteSnapshot);
  };

  // VIEW 1: Parent Phone Lookup Gate
  if (matchedChildren.length === 0) {
    return (
      <div className="max-w-lg mx-auto w-full px-4 py-6 sm:py-10 animate-fadeIn">
        {onBack && !isDirectLink && (
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
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold font-amiri text-white">بوابة ولي الأمر</h2>
            <p className="text-xs text-[#D4AF37] leading-relaxed">
              أدخل رقم هاتف ولي الأمر المسجل لمتابعة مواد ابنك، الحضور، الواجبات، ونتائج الاختبارات
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم هاتف ولي الأمر
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
                  placeholder="+20 1xxxxxxxx"
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
              <span>{searching ? 'جاري البحث عن ملف الطالب...' : 'دخول ومتابعة ملف الابن'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VIEW 2: Strictly Read-Only Child Profile View (Scoped to child's chosen subjects)
  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-5 space-y-6 animate-fadeIn pb-14">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
              بوابة ولي الأمر • عرض للقراءة فقط
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white">
            ملف متابعة الطالب: {matchedChildren[0].name}
          </h2>
          {matchedChildren[0].parentPhone && (
            <p className="text-xs text-[#D4AF37] font-mono" dir="ltr">
              {matchedChildren[0].parentPhone}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Colorful Library Icon scoped to child's enrolled subjects ONLY */}
          <CurriculumLibraryIcon
            compact
            label="مقررات الابن"
            active={showChildCurricula}
            onClick={() => setShowChildCurricula((v) => !v)}
          />

          {!isDirectLink && (
            <button
              type="button"
              onClick={onLogoutParent}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer transition"
            >
              <LogOut className="w-4 h-4 text-[#D4AF37]" />
              <span>تغيير الرقم</span>
            </button>
          )}
          {onBack && !isDirectLink && (
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

      {/* Expandable Child Curricula Library (Strictly Child's Enrolled Subjects Only) */}
      {showChildCurricula && (
        <CurriculumLibraryView mode="parent" student={matchedChildren[0]} />
      )}

      {/* Matched Child Cards */}
      {matchedChildren.map((child) => {
        const completedJuz = child.completedJuz ?? 0;
        const remainingJuz = Math.max(0, 30 - completedJuz);
        const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
        const stars = child.stars ?? 0;
        const childAttendance = attendance.filter((a) => a.studentId === child.id).slice(0, 20);
        const childPayments = payments.filter((p) => p.studentId === child.id);
        const daysUntilDue = getDaysUntilDate(child.nextPaymentDate);
        const assignedTeacher = teachers.find((t) => t.id === child.assignedTeacherId);
        const followLink = buildChildFollowUpLink(child.id);
        const targetPhone = child.parentPhone || loggedParentPhone || child.phone;
        const waShareUrl = buildWhatsAppShareUrl(targetPhone, child.name, followLink);

        const childEnrolledSubjects = getStudentEnrolledSubjects(child);
        const childCurriculumBadge = formatStudentCurriculumBadge(child);

        const subjectIsEnrolledForChild = (subj: string) => {
          if (!child.selectedSubjects || child.selectedSubjects.length === 0) {
            return childEnrolledSubjects.some((s) => subjectsMatch(s, subj));
          }
          return child.selectedSubjects.some((s) => subjectsMatch(s, subj));
        };

        const childHomeworks = homeworks.filter((hw) => {
          if (!subjectIsEnrolledForChild(hw.subject)) return false;
          if (
            hw.educationSystem &&
            hw.educationSystem !== 'both' &&
            child.educationSystem &&
            hw.educationSystem !== child.educationSystem
          ) {
            return false;
          }
          if (hw.stage && child.stage && !child.stage.includes(hw.stage)) return false;
          if (hw.gradeLevel && child.gradeLevel && hw.gradeLevel !== child.gradeLevel) return false;
          return true;
        });

        return (
          <div
            key={child.id}
            className="bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
          >
            {/* Child Identity + Curriculum Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold font-amiri text-white">{child.name}</h3>
                <p className="text-xs text-[#F3E5AB]">
                  {childCurriculumBadge || child.course}
                  {assignedTeacher ? ` • المعلم: ${assignedTeacher.name}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-[#D4AF37]">مواد الطالب المسجلة:</span>
                  {childEnrolledSubjects.map((subj) => (
                    <span
                      key={subj}
                      className="px-2.5 py-0.5 rounded-lg bg-[#07241B] text-white border border-[#D4AF37]/40 text-[11px] font-bold"
                    >
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-[#07241B] border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37]">
                  النجوم الحالية: {stars} / 10 ⭐
                </span>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    child.feeStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {child.feeStatus === 'paid' ? 'الاشتراك: مسدد ✓' : 'الاشتراك: مستحق السداد'}
                </span>
              </div>
            </div>

            {/* Private Direct Follow-Up Link Card */}
            {!isDirectLink && (
              <div className="bg-[#07241B]/90 border border-[#D4AF37]/45 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#F3E5AB]">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>رابط المتابعة الخاص بالطالب ({child.name})</span>
                </div>
                <p
                  dir="ltr"
                  className="bg-[#0B3D2E] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-emerald-200 font-mono truncate select-all"
                >
                  {followLink}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={waShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>إرسال اللينك على الواتساب</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyFollowLink(child.id, followLink)}
                    className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    {copiedChildId === child.id ? (
                      <>
                        <Check className="w-4 h-4 text-[#07241B] shrink-0" />
                        <span>تم نسخ لينك المتابعة ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#07241B] shrink-0" />
                        <span>نسخ لينك المتابعة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Notice */}
            {daysUntilDue !== null && daysUntilDue <= 3 && (
              <div className="bg-amber-500/15 border border-amber-400/50 rounded-2xl p-3.5 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {daysUntilDue < 0
                    ? `تنبيه: موعد تجديد اشتراك (${child.name}) فات منذ ${Math.abs(daysUntilDue)} يوم (${child.nextPaymentDate}).`
                    : daysUntilDue === 0
                    ? `تنبيه: موعد تجديد اشتراك (${child.name}) اليوم (${child.nextPaymentDate}).`
                    : `تنبيه: متبقي ${daysUntilDue} أيام على موعد تجديد الاشتراك (${child.nextPaymentDate}).`}
                </span>
              </div>
            )}

            {/* Child Homeworks Section */}
            <div className="bg-[#07241B]/75 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <span>الواجبات الدراسية لابنك ({childHomeworks.length})</span>
              </h4>
              {childHomeworks.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد واجبات مطلوبة في مواد ابنك حالياً.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {childHomeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl p-3 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#c9a227] text-[#07241B] font-extrabold text-[10px]">
                          {hw.subject}
                        </span>
                        <span className="font-mono text-emerald-300" dir="ltr">
                          {hw.dueDate}
                        </span>
                      </div>
                      <p className="font-bold text-white">{hw.title}</p>
                      {hw.description && <p className="text-slate-300">{hw.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Memorization Progress Bar */}
            {(child.completedJuz !== undefined ||
              childEnrolledSubjects.some((s) => s.includes('قرآن'))) && (
              <div className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                    <span>مستوى الحفظ في القرآن الكريم</span>
                  </div>
                  <span className="text-xs font-bold text-[#F3E5AB]">
                    السورة الحالية: {child.currentSurah || 'سورة الفاتحة'}
                  </span>
                </div>

                <div className="w-full h-4 bg-[#0B3D2E] rounded-full overflow-hidden border border-[#D4AF37]/30">
                  <div
                    className="h-full bg-gradient-to-l from-[#F3E5AB] via-[#D4AF37] to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    أتم حفظ: <strong className="text-emerald-300">{completedJuz} جزء</strong> ({progressPercent}%)
                  </span>
                  <span>
                    المتبقي: <strong className="text-[#F3E5AB]">{remainingJuz} جزء</strong> من 30 جزءاً
                  </span>
                </div>
              </div>
            )}

            {/* Latest Daily Memorization Reports */}
            <div className="bg-[#07241B]/70 border border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <span>تقارير الحفظ والمراجعة (قراءة فقط)</span>
              </h4>
              {!child.reports || child.reports.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد تقارير مسجلة حتى الآن.</p>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {child.reports.slice(0, 8).map((rep) => {
                    const levelLabel =
                      rep.level === 'excellent'
                        ? 'ممتاز'
                        : rep.level === 'medium'
                        ? 'متوسط'
                        : 'يحتاج متابعة';
                    return (
                      <div
                        key={rep.id}
                        className="bg-[#0B3D2E]/90 border border-white/10 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[#D4AF37] font-bold">
                          <span>المستوى: {levelLabel}</span>
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
                            <strong>ملاحظات المعلم:</strong> {rep.teacherNote || rep.reportNotes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Child Exam Results (Strictly filtered to child's enrolled subjects) */}
            {(() => {
              const liveResults: StudentExamResult[] = exams
                .map((ex): StudentExamResult | null => {
                  const g = ex.grades.find((item) => item.studentId === child.id);
                  if (!g) return null;
                  if (child.selectedSubjects?.length && !subjectIsEnrolledForChild(ex.subject)) {
                    return null;
                  }
                  return {
                    examId: ex.id,
                    examTitle: ex.title,
                    subject: ex.subject,
                    examDate: ex.examDate,
                    teacherName: ex.teacherName,
                    maxScore: g.maxScore,
                    score: g.score,
                    gradeLabel: g.gradeLabel,
                    notes: g.notes,
                    gradedAt: g.gradedAt,
                  };
                })
                .filter((x): x is StudentExamResult => x !== null);

              const childExamResults =
                liveResults.length > 0
                  ? liveResults
                  : directExamResults.length > 0
                  ? directExamResults.filter((r) =>
                      !child.selectedSubjects?.length || subjectIsEnrolledForChild(r.subject)
                    )
                  : [];

              const upcomingChildExams = exams.filter((ex) => {
                if (ex.grades.some((g) => g.studentId === child.id)) return false;
                if (!subjectIsEnrolledForChild(ex.subject)) return false;
                return (
                  (child.assignedTeacherId && ex.teacherId === child.assignedTeacherId) ||
                  (child.halaqaId && ex.halaqaId === child.halaqaId) ||
                  Boolean(child.selectedSubjects?.length)
                );
              });

              return (
                <div className="bg-[#07241B]/75 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span>نتائج اختبارات الطالب (في مواده)</span>
                    </h4>
                    {childExamResults.length > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0B3D2E] border border-[#D4AF37]/40 text-[#D4AF37] tabular-nums">
                        {childExamResults.length} اختبار مرصود
                      </span>
                    )}
                  </div>

                  {childExamResults.length === 0 && upcomingChildExams.length === 0 ? (
                    <p className="text-xs text-slate-400">لم تُرصد درجات اختبارات في مواد ابنك بعد.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {childExamResults.map((res) => {
                        const pct = Math.round((res.score / Math.max(1, res.maxScore)) * 100);
                        return (
                          <div
                            key={res.examId}
                            className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl p-3.5 space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-extrabold text-white text-sm">{res.examTitle}</p>
                                <p className="text-[11px] text-[#D4AF37]">
                                  {res.subject} • المعلم: {res.teacherName} • {res.examDate}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-[#07241B] border border-[#D4AF37]/40 font-black text-white tabular-nums">
                                  {res.score} / {res.maxScore} ({pct}%)
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-extrabold">
                                  {res.gradeLabel}
                                </span>
                              </div>
                            </div>
                            {res.notes && (
                              <p className="text-emerald-200/90">
                                <strong>ملاحظات المعلم:</strong> {res.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {upcomingChildExams.map((ex) => (
                        <div
                          key={ex.id}
                          className="bg-[#0B3D2E]/60 border border-dashed border-[#D4AF37]/25 rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200 font-bold">
                            {ex.title} ({ex.subject} • {ex.examDate})
                          </span>
                          <span className="text-amber-300 font-bold">بانتظار رصد الدرجة</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Attendance Log & Certificates + Receipts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#07241B]/70 border border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>سجل الحضور والغياب</span>
                </h4>

                {childAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400">لم تُسجل حصص حضور أو غياب بعد.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {childAttendance.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between text-xs bg-[#0B3D2E]/80 px-3 py-2 rounded-xl border border-white/5"
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

              <div className="bg-[#07241B]/70 border border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  <span>الشهادات وإيصالات الدفع</span>
                </h4>

                {child.certificates && child.certificates.length > 0 ? (
                  <div className="space-y-2">
                    {child.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between gap-2 bg-[#0B3D2E] px-3 py-2 rounded-xl border border-[#D4AF37]/30 text-xs"
                      >
                        <span className="font-bold text-white truncate">{cert.juzName}</span>
                        <button
                          type="button"
                          onClick={() => onOpenCertificate(child, cert)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#07241B] font-extrabold cursor-pointer"
                        >
                          عرض الشهادة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">لم تصدر شهادات إتمام لهذا الطالب بعد.</p>
                )}

                {childPayments.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    {childPayments.slice(0, 5).map((pay) => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between gap-2 bg-[#0B3D2E] px-3 py-2 rounded-xl border border-emerald-500/30 text-xs"
                      >
                        <span className="text-emerald-300 font-bold">
                          إيصال {pay.amount} {currency} ({pay.date})
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewReceipt(pay)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-200 font-bold cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>
                    قيمة الاشتراك: <strong className="text-white">{child.subscriptionAmount ?? settings.defaultSubscriptionAmount ?? 250} {currency}</strong> • موعد التجديد:{' '}
                    <strong className="text-white">{child.nextPaymentDate || 'غير محدد'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
