import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  Calendar,
  BookOpen,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  HalaqaGroup,
  ScheduleAppointment,
  Student,
  Teacher,
} from '../types';
import { cleanWhatsAppNumber, getTodayDateStr } from '../utils/storage';

interface AttendanceSectionProps {
  students: Student[];
  teachers: Teacher[];
  halaqat: HalaqaGroup[];
  attendance: AttendanceRecord[];
  academyName: string;
  onMarkAttendance: (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment,
    customDate?: string,
    halaqaId?: string
  ) => void;
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  students,
  teachers,
  halaqat,
  attendance,
  academyName,
  onMarkAttendance,
}) => {
  const [selectedHalaqaId, setSelectedHalaqaId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastSavedFeedback, setLastSavedFeedback] = useState<{
    studentName: string;
    status: AttendanceStatus;
    waLink: string;
  } | null>(null);

  const filteredStudents = students.filter((st) => {
    const matchesHalaqa =
      selectedHalaqaId === 'all' ||
      st.halaqaId === selectedHalaqaId ||
      (selectedHalaqaId === 'unassigned' && !st.halaqaId);
    if (!matchesHalaqa) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      st.name.toLowerCase().includes(q) ||
      (st.parentPhone && st.parentPhone.includes(searchQuery.trim())) ||
      (st.phone && st.phone.includes(searchQuery.trim()))
    );
  });

  const getRecordForStudent = (studentId: string) =>
    attendance.find((a) => a.studentId === studentId && a.date === selectedDate);

  const presentCount = filteredStudents.filter(
    (s) => getRecordForStudent(s.id)?.status === 'present'
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => getRecordForStudent(s.id)?.status === 'absent'
  ).length;

  const handleQuickMark = (student: Student, status: AttendanceStatus) => {
    onMarkAttendance(
      student,
      status,
      undefined,
      selectedDate,
      selectedHalaqaId === 'all' ? student.halaqaId : selectedHalaqaId
    );
    const parentPhone = cleanWhatsAppNumber(student.parentPhone || student.phone || '');
    const waMsg = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${student.name})،\nنحيطكم علماً بأن الطالب تغيّب بتاريخ (${selectedDate}) عن حلقة القرآن الكريم.\nنرجو التواصل للاطمئنان عليه.\n${academyName}`
    );
    setLastSavedFeedback({
      studentName: student.name,
      status,
      waLink: parentPhone ? `https://wa.me/${parentPhone}?text=${waMsg}` : '',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e]">صفحة الحضور والغياب اليومي</h2>
            <p className="text-xs text-slate-600">
              اختر الحلقة والتاريخ، واضغط «حاضر» أو «غائب» ليتم الحفظ تلقائياً مع تجهيز إشعار واتساب لولي الأمر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-extrabold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-400 tabular-nums">
            حاضر: {presentCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-400 tabular-nums">
            غائب: {absentCount}
          </span>
        </div>
      </div>

      {/* Instant Auto-Save & WhatsApp Alert Banner */}
      {lastSavedFeedback && (
        <div
          className={`rounded-2xl p-3.5 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold border ${
            lastSavedFeedback.status === 'absent'
              ? 'bg-red-50 border-red-400 text-red-900'
              : 'bg-emerald-50 border-emerald-400 text-emerald-900'
          }`}
        >
          <span>
            ✓ تم حفظ حالة ({lastSavedFeedback.status === 'absent' ? 'غائب' : 'حاضر'}) للطالب{' '}
            <strong>{lastSavedFeedback.studentName}</strong> تلقائياً.
          </span>
          {lastSavedFeedback.status === 'absent' && lastSavedFeedback.waLink && (
            <a
              href={lastSavedFeedback.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-[#07241B] font-extrabold shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>إرسال رسالة واتساب لولي الأمر الآن</span>
            </a>
          )}
        </div>
      )}

      {/* Filters Bar: Halaqa, Date, Search */}
      <div className="furqan-card rounded-2xl p-4 shadow grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#9a7510]" />
            <span>اختر الحلقة</span>
          </label>
          <select
            value={selectedHalaqaId}
            onChange={(e) => setSelectedHalaqaId(e.target.value)}
            className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900"
          >
            <option value="all">جميع الطلاب والحلقات ({students.length})</option>
            {halaqat.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.teacherName})
              </option>
            ))}
            <option value="unassigned">طلاب غير مسكنين في حلقة</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#9a7510]" />
            <span>التاريخ</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 tabular-nums"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1 flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-[#9a7510]" />
            <span>بحث بالاسم أو الهاتف</span>
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="اكتب اسم الطالب أو رقم الهاتف..."
            className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900"
          />
        </div>
      </div>

      {/* Students Attendance Table */}
      <div className="furqan-card rounded-2xl shadow-lg overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-sm font-bold text-slate-600">
            لا يوجد طلاب مطابقون للتصفية المختارة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-[#0a4d2e] text-[#fffdf5]">
                <tr>
                  <th className="py-3 px-4 font-extrabold">الطالب</th>
                  <th className="py-3 px-4 font-extrabold">الحلقة / المعلم</th>
                  <th className="py-3 px-4 font-extrabold">تسجيل الحالة ({selectedDate})</th>
                  <th className="py-3 px-4 font-extrabold">إشعار الغياب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a227]/30">
                {filteredStudents.map((st) => {
                  const rec = getRecordForStudent(st.id);
                  const teacherObj = teachers.find((t) => t.id === st.assignedTeacherId);
                  const parentPhone = cleanWhatsAppNumber(st.parentPhone || st.phone || '');
                  const waMsg = encodeURIComponent(
                    `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${st.name})،\nنحيطكم علماً بأن الطالب تغيّب بتاريخ (${selectedDate}) عن حلقة القرآن الكريم.\nنرجو التواصل للاطمئنان عليه.\n${academyName}`
                  );

                  return (
                    <tr key={st.id} className="hover:bg-[#fff9e6] transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#0a4d2e]">{st.name}</div>
                        <div className="text-[11px] text-slate-600">
                          ولي الأمر: {st.parentName || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div className="font-bold text-[#0a4d2e]">
                          {st.halaqaName || st.course || 'حلقة عامة'}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {teacherObj?.name || 'غير محدد'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickMark(st, 'present')}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                              rec?.status === 'present'
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                                : 'bg-white text-emerald-800 border-emerald-400 hover:bg-emerald-50'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>حاضر</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMark(st, 'absent')}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                              rec?.status === 'absent'
                                ? 'bg-red-700 text-white border-red-700 shadow'
                                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>غائب</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {rec?.status === 'absent' ? (
                          <a
                            href={`https://wa.me/${parentPhone}?text=${waMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-[#07241B] text-xs font-extrabold shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>إرسال تنبيه غياب</span>
                          </a>
                        ) : rec?.status === 'present' ? (
                          <span className="text-xs font-bold text-emerald-700">✓ تم التحضير</span>
                        ) : (
                          <span className="text-xs text-slate-400">لم يُسجّل بعد</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
