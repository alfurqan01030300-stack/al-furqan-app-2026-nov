import React, { useMemo, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  UserX,
  AlertTriangle,
  MessageSquare,
  Clock,
  Sparkles,
  UserPlus,
  CalendarCheck,
  FileCheck2,
  ArrowLeft,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  EducationStage,
  EducationSystem,
  HalaqaGroup,
  ScheduleAppointment,
  SecondaryTrack,
  Student,
  StudyScope,
  Teacher,
  TrialLesson,
} from '../types';
import {
  cleanWhatsAppNumber,
  getDaysUntilDate,
  getTodayArabicDay,
  getTodayDateStr,
} from '../utils/storage';
import {
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  formatStudentCurriculumBadge,
  getGradesForStage,
  normalizeStageLabel,
  SECONDARY_TRACKS,
} from '../data/curricula';
import { AdminTab } from './Header';

interface AdminDashboardSectionProps {
  students: Student[];
  teachers: Teacher[];
  halaqat: HalaqaGroup[];
  schedules: ScheduleAppointment[];
  attendance: AttendanceRecord[];
  trialLessons: TrialLesson[];
  settings: AcademySettings;
  pendingTeachersCount: number;
  onNavigateTab: (tab: AdminTab) => void;
  onAddNewStudent: () => void;
}

export const AdminDashboardSection: React.FC<AdminDashboardSectionProps> = ({
  students,
  teachers,
  halaqat,
  schedules,
  attendance,
  trialLessons,
  settings,
  pendingTeachersCount,
  onNavigateTab,
  onAddNewStudent,
}) => {
  const todayStr = getTodayDateStr();
  const todayArabic = getTodayArabicDay();
  const currency = settings.currency || 'ر.س';

  // Curriculum filters on Admin Dashboard
  const [sysFilter, setSysFilter] = useState<'all' | EducationSystem>('all');
  const [stageFilter, setStageFilter] = useState<'all' | EducationStage>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | SecondaryTrack>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | StudyScope>('all');

  const gradeOptions = useMemo(() => {
    if (stageFilter !== 'all') return getGradesForStage(stageFilter);
    return ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  }, [stageFilter]);

  const hasCurriculumFilter =
    sysFilter !== 'all' ||
    stageFilter !== 'all' ||
    gradeFilter !== 'all' ||
    trackFilter !== 'all' ||
    scopeFilter !== 'all';

  const resetCurriculumFilters = () => {
    setSysFilter('all');
    setStageFilter('all');
    setGradeFilter('all');
    setTrackFilter('all');
    setScopeFilter('all');
  };

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (sysFilter !== 'all' && st.educationSystem !== sysFilter) return false;
      const normStage = normalizeStageLabel(st.stage);
      if (stageFilter !== 'all' && normStage !== stageFilter) return false;
      if (gradeFilter !== 'all' && st.gradeLevel !== gradeFilter) return false;
      if (trackFilter !== 'all' && st.track !== trackFilter) return false;
      if (scopeFilter !== 'all' && st.studyScope !== scopeFilter) return false;
      return true;
    });
  }, [students, sysFilter, stageFilter, gradeFilter, trackFilter, scopeFilter]);

  const activeTeachersCount = teachers.filter((t) => t.status !== 'rejected').length;
  const todaySchedules = schedules.filter((s) => s.day === todayArabic);
  const todaySessionsCount = todaySchedules.length + halaqat.length;
  const todayAbsentRecords = attendance.filter(
    (a) => a.date === todayStr && a.status === 'absent'
  );
  const newTrialsCount = trialLessons.filter((l) => l.status === 'new').length;
  const paymentDueStudents = filteredStudents.filter((s) => {
    const days = getDaysUntilDate(s.nextPaymentDate);
    return days !== null && days <= 3;
  });

  const kpis = [
    {
      label: hasCurriculumFilter ? 'الطلاب المطابقون' : 'عدد الطلاب',
      value: filteredStudents.length,
      sub: `${filteredStudents.filter((s) => s.feeStatus === 'paid').length} مسدد الرسوم`,
      icon: Users,
      tab: 'students' as AdminTab,
      accent: 'text-[#0a4d2e]',
    },
    {
      label: 'عدد المدرسين',
      value: activeTeachersCount,
      sub:
        pendingTeachersCount > 0
          ? `${pendingTeachersCount} طلب بانتظار المراجعة`
          : 'الطاقم التعليمي النشط',
      icon: GraduationCap,
      tab: 'teachers' as AdminTab,
      accent: 'text-[#0a4d2e]',
    },
    {
      label: 'عدد الحلقات',
      value: halaqat.length,
      sub: `${schedules.length} موعد فردي مسجل`,
      icon: BookOpen,
      tab: 'halaqat' as AdminTab,
      accent: 'text-[#0a4d2e]',
    },
    {
      label: 'الحصص النهاردة',
      value: todaySessionsCount,
      sub: `${todayArabic} • ${todayStr}`,
      icon: Calendar,
      tab: 'halaqat' as AdminTab,
      accent: 'text-[#0a4d2e]',
    },
    {
      label: 'الطلاب الغايبين',
      value: todayAbsentRecords.length,
      sub: 'سجل غياب اليوم',
      icon: UserX,
      tab: 'attendance' as AdminTab,
      accent: todayAbsentRecords.length > 0 ? 'text-red-700' : 'text-[#0a4d2e]',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Manager Header Card */}
      <div className="furqan-card rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-extrabold text-[#9a7510] mb-1">
            {todayArabic} • <span className="tabular-nums">{todayStr}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
            لوحة تحكم المدير — فضيلة الشيخ عبد المجيد مسعد
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {settings.academyName} — متابعة الحلقات، الطلاب، الحضور، والتقارير اليومية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAddNewStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
          >
            <UserPlus className="w-4 h-4 text-[#c9a227]" />
            <span>+ إضافة طالب</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
          >
            <CalendarCheck className="w-4 h-4 text-[#9a7510]" />
            <span>تسجيل الحضور</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('curricula')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
          >
            <BookOpen className="w-4 h-4 text-[#9a7510]" />
            <span>المناهج (الصفوف)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('studentReports')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
          >
            <FileCheck2 className="w-4 h-4 text-[#9a7510]" />
            <span>شهادة تقرير طالب</span>
          </button>
        </div>
      </div>

      {/* Prominent Red Alert Banner for Pending Teacher Applications */}
      {pendingTeachersCount > 0 && (
        <div
          role="alert"
          className="bg-red-700 border-2 border-[#c9a227] rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">
                عندك <span className="tabular-nums">{pendingTeachersCount}</span> طلبات جديدة مستنية الموافقة
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                معلمون جدد سجلوا بياناتهم وأرفقوا صور الشهادات وينتظرون مراجعة وتفعيل الإدارة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('teacherApps')}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#fffdf5] hover:bg-[#fff3cc] text-[#0a4d2e] font-extrabold text-xs sm:text-sm border border-[#c9a227] cursor-pointer transition"
          >
            <span>مراجعة الطلبات الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Curriculum Filter Bar (النظام / المرحلة / الصف / الشعبة / مادة واحدة / كل المواد) */}
      <div className="furqan-card rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#9a7510]" />
            <h3 className="text-sm font-extrabold text-[#0a4d2e]">
              تصفية الطلاب حسب المنهج والتقديم
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0a4d2e] text-[#fffdf5] text-[11px] font-bold tabular-nums">
              {filteredStudents.length} من {students.length} طالب
            </span>
          </div>
          {hasCurriculumFilter && (
            <button
              type="button"
              onClick={resetCurriculumFilters}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0a4d2e] text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <select
            value={sysFilter}
            onChange={(e) => setSysFilter(e.target.value as 'all' | EducationSystem)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">النظام: الكل</option>
            <option value="general">{EDUCATION_SYSTEM_LABELS.general}</option>
            <option value="azhar">{EDUCATION_SYSTEM_LABELS.azhar}</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              const val = e.target.value as 'all' | EducationStage;
              setStageFilter(val);
              setGradeFilter('all');
              if (val !== 'ثانوي') setTrackFilter('all');
            }}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">المرحلة: الكل</option>
            {EDUCATION_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">الصف: الكل</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                الصف {g}
              </option>
            ))}
          </select>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as 'all' | SecondaryTrack)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">الشعبة: الكل</option>
            {SECONDARY_TRACKS.map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as 'all' | StudyScope)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">نطاق الدراسة: الكل</option>
            <option value="single">مادة واحدة فقط</option>
            <option value="all">كل المواد</option>
          </select>
        </div>

        {hasCurriculumFilter && filteredStudents.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#c9a227]/30">
            {filteredStudents.slice(0, 6).map((st) => (
              <span
                key={st.id}
                className="px-2.5 py-1 rounded-lg bg-[#fff9e6] border border-[#c9a227]/60 text-[11px] font-bold text-[#0a4d2e]"
              >
                {st.name} ({formatStudentCurriculumBadge(st) || st.course})
              </span>
            ))}
            {filteredStudents.length > 6 && (
              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="px-2.5 py-1 rounded-lg bg-[#0a4d2e] text-white text-[11px] font-bold cursor-pointer"
              >
                +{filteredStudents.length - 6} طالب (عرض الكل)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigateTab(kpi.tab)}
              className="furqan-card rounded-2xl p-4 sm:p-5 text-right shadow-md hover:shadow-xl hover:-translate-y-0.5 transition cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-extrabold text-[#785908]">{kpi.label}</span>
                <div className="w-9 h-9 rounded-xl bg-[#0a4d2e] text-[#c9a227] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className={`text-3xl font-black tabular-nums ${kpi.accent}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-600 font-semibold mt-1 truncate">
                  {kpi.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Operational Grid: Today's Absences + Payment Due / Trial Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Absences Panel */}
        <div className="furqan-card rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c9a227]/40">
            <h3 className="text-base font-extrabold text-[#0a4d2e] flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-700" />
              <span>الطلاب الغايبين اليوم ({todayAbsentRecords.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-extrabold text-[#0a4d2e] hover:underline cursor-pointer"
            >
              فتح سجل الحضور ←
            </button>
          </div>

          {todayAbsentRecords.length === 0 ? (
            <div className="furqan-card-subtle rounded-xl p-6 text-center text-xs font-semibold text-slate-600">
              لا توجد حالات غياب مسجلة بتاريخ اليوم ({todayStr}).
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {todayAbsentRecords.map((abs) => {
                const st = students.find((s) => s.id === abs.studentId);
                const phone = cleanWhatsAppNumber(st?.parentPhone || st?.phone || '');
                const msg = encodeURIComponent(
                  `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${abs.studentName})،\nنحيطكم علماً بأن الطالب تغيّب اليوم (${abs.date}) عن الحلقة.\nنرجو التواصل للاطمئنان عليه.\n${settings.academyName}`
                );
                return (
                  <div
                    key={abs.id}
                    className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-red-900 truncate">
                        {abs.studentName}
                      </p>
                      <p className="text-xs text-red-700">المعلم: {abs.teacherName}</p>
                    </div>
                    <a
                      href={`https://wa.me/${phone}?text=${msg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] text-xs font-extrabold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>واتساب لولي الأمر</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription Renewals & Trial Lesson Requests */}
        <div className="furqan-card rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c9a227]/40">
            <h3 className="text-base font-extrabold text-[#0a4d2e] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#9a7510]" />
              <span>تنبيهات الاشتراكات والحصص التجريبية</span>
            </h3>
            {newTrialsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('trialLessons')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a4d2e] text-[#fffdf5] text-xs font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c9a227]" />
                <span>{newTrialsCount} طلبات تجريبية</span>
              </button>
            )}
          </div>

          {paymentDueStudents.length === 0 && newTrialsCount === 0 ? (
            <div className="furqan-card-subtle rounded-xl p-6 text-center text-xs font-semibold text-slate-600">
              جميع الاشتراكات محدثة ولا توجد طلبات حصص تجريبية معلقة.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {paymentDueStudents.slice(0, 6).map((st) => {
                const days = getDaysUntilDate(st.nextPaymentDate) ?? 0;
                const phone = cleanWhatsAppNumber(st.parentPhone || st.phone || '');
                const amount =
                  st.subscriptionAmount || settings.defaultSubscriptionAmount || 250;
                const msg = encodeURIComponent(
                  `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${st.name})،\nنذكركم بلطف بموعد تجديد الاشتراك الشهري (${st.nextPaymentDate}) بمبلغ (${amount} ${currency}).\n${settings.academyName}`
                );
                return (
                  <div
                    key={st.id}
                    className="furqan-card-subtle rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0a4d2e] truncate">{st.name}</p>
                      <p className="text-xs text-slate-700">
                        {days < 0
                          ? `متأخر ${Math.abs(days)} يوم`
                          : days === 0
                          ? 'التجديد اليوم'
                          : `باقي ${days} أيام`}{' '}
                        • {amount} {currency}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${phone}?text=${msg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] text-xs font-extrabold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>تذكير</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
