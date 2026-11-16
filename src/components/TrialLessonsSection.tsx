import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  UserCheck,
  Search,
  Filter,
  Plus,
  BookOpen,
} from 'lucide-react';
import { TrialLesson, TrialLessonStatus } from '../types';
import { cleanWhatsAppNumber } from '../utils/storage';

interface TrialLessonsSectionProps {
  trialLessons: TrialLesson[];
  onUpdateStatus: (id: string, status: TrialLessonStatus) => void;
  onDeleteLesson: (id: string) => void;
  onConvertToStudent: (lesson: TrialLesson) => void;
  onOpenNewTrialModal: () => void;
  academyName: string;
  managerWhatsApp?: string;
}

export const TrialLessonsSection: React.FC<TrialLessonsSectionProps> = ({
  trialLessons,
  onUpdateStatus,
  onDeleteLesson,
  onConvertToStudent,
  onOpenNewTrialModal,
  academyName,
  managerWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TrialLessonStatus>('all');
  const [convertedStudentNotice, setConvertedStudentNotice] = useState<string | null>(null);

  const handleConvertClick = (lesson: TrialLesson) => {
    onConvertToStudent(lesson);
    setConvertedStudentNotice(lesson.studentName);
    setTimeout(() => {
      setConvertedStudentNotice((prev) => (prev === lesson.studentName ? null : prev));
    }, 4500);
  };

  const totalCount = trialLessons.length;
  const newCount = trialLessons.filter((l) => l.status === 'new').length;
  const contactedCount = trialLessons.filter(
    (l) => l.status === 'contacted' || l.status === 'scheduled'
  ).length;
  const enrolledCount = trialLessons.filter((l) => l.status === 'enrolled').length;

  const filtered = trialLessons.filter((lesson) => {
    const matchesSearch =
      lesson.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.parentPhone.includes(searchTerm) ||
      lesson.stageOrAge.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TrialLessonStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-400">
            طلب جديد
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-400">
            تم التواصل
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-400">
            <Calendar className="w-3 h-3" />
            موعد محدد
          </span>
        );
      case 'enrolled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            مشترك رسمياً
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-900 border border-red-300">
            ملغي
          </span>
        );
    }
  };

  const getWhatsAppMessage = (lesson: TrialLesson) => {
    return encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\nمعكم إدارة ${academyName}.\nبخصوص طلب الحصة التجريبية المجانية للطالب (${lesson.studentName}) - ${lesson.stageOrAge}.\nيسعدنا تحديد موعد الحصة التجريبية في الوقت المناسب لكم.`
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] text-[#c9a227] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e] flex items-center gap-2">
              طلبات الحصص التجريبية
              {newCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-[#07241B] font-extrabold tabular-nums">
                  {newCount} جديد
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">
              متابعة الطلبات الواردة وقبولها وتحويلها مباشرة إلى طالب رسمي بضغطة واحدة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewTrialModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] text-xs sm:text-sm font-extrabold shadow cursor-pointer transition"
        >
          <Plus className="w-4 h-4 text-[#c9a227]" />
          <span>حصة تجريبية جديدة</span>
        </button>
      </div>

      {convertedStudentNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-3.5 text-xs sm:text-sm font-extrabold text-emerald-900 flex items-center gap-2 shadow">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>
            ✓ تم قبول الطلب وتحويل الطالب «{convertedStudentNotice}» إلى طالب رسمي في قائمة الطلاب بنجاح!
          </span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="furqan-card rounded-2xl p-4 shadow">
          <span className="text-xs font-bold text-slate-600 block mb-1">إجمالي الطلبات</span>
          <div className="text-2xl font-black text-[#0a4d2e] tabular-nums">{totalCount}</div>
        </div>
        <div className="furqan-card rounded-2xl p-4 shadow">
          <span className="text-xs font-bold text-amber-800 block mb-1">طلبات جديدة</span>
          <div className="text-2xl font-black text-amber-700 tabular-nums">{newCount}</div>
        </div>
        <div className="furqan-card rounded-2xl p-4 shadow">
          <span className="text-xs font-bold text-blue-800 block mb-1">جاري المتابعة</span>
          <div className="text-2xl font-black text-blue-700 tabular-nums">{contactedCount}</div>
        </div>
        <div className="furqan-card rounded-2xl p-4 shadow">
          <span className="text-xs font-bold text-emerald-800 block mb-1">تم التحويل لطالب رسمي</span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums">{enrolledCount}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="furqan-card rounded-2xl p-4 shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب، رقم التليفون، أو المرحلة..."
            className="w-full bg-white border border-[#c9a227] rounded-xl pr-9 pl-3.5 py-2 text-slate-900 text-xs sm:text-sm"
          />
          <Search className="w-4 h-4 text-[#9a7510] absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#0a4d2e] font-bold hidden md:flex items-center gap-1 ml-1">
            <Filter className="w-3.5 h-3.5 text-[#9a7510]" />
            الحالة:
          </span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'new', label: 'جديد' },
            { id: 'contacted', label: 'تم التواصل' },
            { id: 'scheduled', label: 'موعد محدد' },
            { id: 'enrolled', label: 'مشترك' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                statusFilter === tab.id
                  ? 'bg-[#0a4d2e] text-white'
                  : 'bg-white text-slate-700 border border-[#c9a227]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      {filtered.length === 0 ? (
        <div className="furqan-card rounded-2xl p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-[#c9a227] mx-auto" />
          <h3 className="text-lg font-extrabold text-[#0a4d2e]">لا توجد طلبات حصص تجريبية</h3>
          <button
            type="button"
            onClick={onOpenNewTrialModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4d2e] text-white border border-[#c9a227] text-xs font-extrabold cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#c9a227]" />
            <span>تسجيل طلب حصة تجريبية</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <div
              key={lesson.id}
              className="furqan-card rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-extrabold text-[#0a4d2e]">
                      {lesson.studentName}
                    </h4>
                    <span className="text-xs text-[#9a7510] font-bold flex items-center gap-1 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {lesson.stageOrAge}
                    </span>
                  </div>
                  <div>{getStatusBadge(lesson.status)}</div>
                </div>

                <div className="furqan-card-subtle rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">هاتف ولي الأمر:</span>
                    <a
                      href={`tel:${cleanWhatsAppNumber(lesson.parentPhone)}`}
                      className="text-[#0a4d2e] hover:underline font-mono font-extrabold tabular-nums"
                      dir="ltr"
                    >
                      {lesson.parentPhone}
                    </a>
                  </div>

                  {lesson.preferredTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-bold">الموعد المفضل:</span>
                      <span className="text-[#0a4d2e] font-bold">{lesson.preferredTime}</span>
                    </div>
                  )}

                  {lesson.notes && (
                    <div className="pt-1 border-t border-[#c9a227]/30 text-slate-700">
                      <span className="text-slate-600 font-bold block text-[11px] mb-0.5">
                        ملاحظات:
                      </span>
                      <p className="text-[11px] leading-relaxed bg-white p-2 rounded-lg border border-[#c9a227]/30">
                        {lesson.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-1 text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#9a7510]" />
                      تاريخ الطلب:
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      {new Date(lesson.createdAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#0a4d2e] font-extrabold mb-1">
                    تحديث حالة المتابعة:
                  </label>
                  <select
                    value={lesson.status}
                    onChange={(e) => onUpdateStatus(lesson.id, e.target.value as TrialLessonStatus)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    <option value="new">جديد (لم يتم التواصل)</option>
                    <option value="contacted">تم التواصل مع ولي الأمر</option>
                    <option value="scheduled">تم تحديد موعد الحصة</option>
                    <option value="enrolled">تم الاشتراك بالأكاديمية</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#c9a227]/35 space-y-2">
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(lesson.parentPhone)}?text=${getWhatsAppMessage(lesson)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold shadow-xs transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>مراسلة ولي الأمر على واتساب</span>
                </a>

                {managerWhatsApp && (
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(managerWhatsApp)}?text=${encodeURIComponent(
                      `طلب حصة تجريبية - ${academyName}\n• الطالب: ${lesson.studentName}\n• الهاتف: ${lesson.parentPhone}\n• المرحلة: ${lesson.stageOrAge}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] text-[11px] font-bold transition"
                  >
                    <span>إرسال ملخص للإدارة</span>
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={lesson.status === 'enrolled'}
                    onClick={() => handleConvertClick(lesson)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition ${
                      lesson.status === 'enrolled'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-400 cursor-default'
                        : 'bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] cursor-pointer'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#c9a227]" />
                    <span>
                      {lesson.status === 'enrolled'
                        ? 'تم التحويل لطالب رسمي ✓'
                        : 'قبول وتحويل لطالب رسمي'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 transition cursor-pointer"
                    title="حذف (نقل لسلة المحذوفات 30 يوم)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
