import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  Users,
  Video,
  Edit3,
  Trash2,
  X,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  HalaqaGroup,
  ScheduleAppointment,
  Student,
  Teacher,
} from '../types';
import { SchedulesSection } from './SchedulesSection';

interface HalaqatSectionProps {
  halaqat: HalaqaGroup[];
  teachers: Teacher[];
  students: Student[];
  schedules: ScheduleAppointment[];
  attendance: AttendanceRecord[];
  academyName: string;
  onAddHalaqa: (data: Omit<HalaqaGroup, 'id' | 'createdAt'>) => void;
  onUpdateHalaqa: (halaqa: HalaqaGroup) => void;
  onDeleteHalaqa: (id: string) => void;
  onAddSchedule: (schedule: Omit<ScheduleAppointment, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onMarkAttendance: (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment
  ) => void;
  onAddStar: (student: Student) => { reachedTen: boolean; newStars: number };
}

const DAYS: DayOfWeek[] = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export const HalaqatSection: React.FC<HalaqatSectionProps> = ({
  halaqat,
  teachers,
  students,
  schedules,
  attendance,
  academyName,
  onAddHalaqa,
  onUpdateHalaqa,
  onDeleteHalaqa,
  onAddSchedule,
  onDeleteSchedule,
  onMarkAttendance,
  onAddStar,
}) => {
  const [subView, setSubView] = useState<'groups' | 'appointments'>('groups');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState<HalaqaGroup | null>(null);

  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [subject, setSubject] = useState('قرآن كريم وتجويد');
  const [scheduleTime, setScheduleTime] = useState('السبت والثلاثاء 5:00 مساءً');
  const [day, setDay] = useState<DayOfWeek>('السبت');
  const [zoomUrl, setZoomUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingHalaqa(null);
    setName('');
    setTeacherId(teachers[0]?.id || '');
    setSubject('قرآن كريم وتجويد');
    setScheduleTime('السبت والثلاثاء 5:00 مساءً');
    setDay('السبت');
    setZoomUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: HalaqaGroup) => {
    setEditingHalaqa(h);
    setName(h.name);
    setTeacherId(h.teacherId || '');
    setSubject(h.subject || 'قرآن كريم');
    setScheduleTime(h.scheduleTime || '');
    setDay(h.day || 'السبت');
    setZoomUrl(h.zoomUrl || '');
    setNotes(h.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const teacherObj = teachers.find((t) => t.id === teacherId);
    const teacherName = teacherObj?.name || 'معلم الأكاديمية';

    if (editingHalaqa) {
      onUpdateHalaqa({
        ...editingHalaqa,
        name: name.trim(),
        teacherId,
        teacherName,
        subject: subject.trim() || 'قرآن كريم',
        scheduleTime: scheduleTime.trim(),
        day,
        zoomUrl: zoomUrl.trim(),
        notes: notes.trim(),
      });
    } else {
      onAddHalaqa({
        name: name.trim(),
        teacherId,
        teacherName,
        subject: subject.trim() || 'قرآن كريم',
        scheduleTime: scheduleTime.trim(),
        day,
        zoomUrl: zoomUrl.trim(),
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubView('groups')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
            subView === 'groups'
              ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227] shadow'
              : 'bg-[#073923] text-slate-200 border border-[#c9a227]/40 hover:bg-[#0d5936]'
          }`}
        >
          الحلقات والمجموعات ({halaqat.length})
        </button>
        <button
          type="button"
          onClick={() => setSubView('appointments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
            subView === 'appointments'
              ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227] shadow'
              : 'bg-[#073923] text-slate-200 border border-[#c9a227]/40 hover:bg-[#0d5936]'
          }`}
        >
          مواعيد الحصص الفردية ({schedules.length})
        </button>
      </div>

      {subView === 'appointments' ? (
        <SchedulesSection
          schedules={schedules}
          students={students}
          teachers={teachers}
          attendance={attendance}
          academyName={academyName}
          onAddSchedule={onAddSchedule}
          onDeleteSchedule={onDeleteSchedule}
          onMarkAttendance={onMarkAttendance}
          onAddStar={onAddStar}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0a4d2e]">
                  الحلقات والمجموعات (<span className="tabular-nums">{halaqat.length}</span>)
                </h2>
                <p className="text-xs text-slate-600">
                  إنشاء وإدارة حلقات القرآن الكريم والمواد وربطها بالمدرسين والطلاب وروابط الزوم
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] font-extrabold text-xs sm:text-sm shadow cursor-pointer transition"
            >
              <Plus className="w-4 h-4 text-[#c9a227]" />
              <span>+ إنشاء حلقة جديدة</span>
            </button>
          </div>

          {halaqat.length === 0 ? (
            <div className="furqan-card rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-[#c9a227] mx-auto mb-3" />
              <p className="text-base font-extrabold text-[#0a4d2e]">
                لا توجد حلقات مسجلة حالياً
              </p>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                أنشئ أول حلقة (اسم الحلقة، المعلم، المادة، المواعيد، رابط زوم) وسكّن الطلاب عليها.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-5 py-2.5 rounded-xl bg-[#0a4d2e] text-white border border-[#c9a227] text-xs font-extrabold cursor-pointer"
              >
                + إنشاء حلقة جديدة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {halaqat.map((h) => {
                const enrolledCount = students.filter(
                  (s) => s.halaqaId === h.id || (h.name && s.halaqaName === h.name)
                ).length;

                return (
                  <div
                    key={h.id}
                    className="furqan-card rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#c9a227]/35">
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold text-[#0a4d2e] truncate">
                            {h.name}
                          </h3>
                          <span className="text-xs font-bold text-[#9a7510]">{h.subject}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(h)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-[#fff3cc] cursor-pointer"
                            title="تعديل الحلقة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteHalaqa(h.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 cursor-pointer"
                            title="حذف الحلقة (نقل لسلة المحذوفات)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="furqan-card-subtle rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-[#0a4d2e]">
                          <GraduationCap className="w-4 h-4 text-[#9a7510] shrink-0" />
                          <span>المعلم: {h.teacherName || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Clock className="w-4 h-4 text-[#9a7510] shrink-0" />
                          <span>{h.scheduleTime || h.day || 'مواعيد مرنة'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Users className="w-4 h-4 text-[#9a7510] shrink-0" />
                          <span className="tabular-nums">عدد الطلاب: {enrolledCount}</span>
                        </div>
                      </div>

                      {h.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-[#c9a227]/40">
                          {h.notes}
                        </p>
                      )}
                    </div>

                    {h.zoomUrl ? (
                      <a
                        href={h.zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] text-xs font-extrabold transition"
                      >
                        <Video className="w-4 h-4 text-[#c9a227]" />
                        <span>فتح رابط زوم الحلقة</span>
                      </a>
                    ) : (
                      <div className="text-center text-[11px] font-semibold text-slate-500 py-1.5 border border-dashed border-[#c9a227]/50 rounded-xl">
                        لا يوجد رابط زوم مضاف
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Halaqa Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md furqan-card rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9a227]/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0a4d2e]" />
                <h3 className="text-lg font-extrabold text-[#0a4d2e]">
                  {editingHalaqa ? 'تعديل الحلقة' : 'إنشاء حلقة جديدة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                  اسم الحلقة <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: حلقة النور - مستوى أول"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">المعلم</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">المادة</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="شرعية / عربية / قرآن كريم"
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    اليوم الرئيسي
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    المواعيد
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="السبت والثلاثاء 5 مساءً"
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                  رابط زوم (Zoom Link)
                </label>
                <input
                  type="url"
                  value={zoomUrl}
                  onChange={(e) => setZoomUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  dir="ltr"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2 text-slate-900 text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c9a227]/35">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0a4d2e] text-white border border-[#c9a227] font-extrabold text-xs cursor-pointer"
                >
                  {editingHalaqa ? 'حفظ التعديل' : 'حفظ الحلقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
