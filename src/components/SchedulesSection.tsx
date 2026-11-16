import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  User,
  GraduationCap,
  Video,
  Trash2,
  X,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek,
  ScheduleAppointment,
  Student,
  Teacher,
} from '../types';
import { cleanWhatsAppNumber, getTodayDateStr } from '../utils/storage';

interface SchedulesSectionProps {
  schedules: ScheduleAppointment[];
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  academyName: string;
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

const COMMON_TIMES = [
  '03:00 مساءً',
  '03:30 مساءً',
  '04:00 مساءً',
  '04:30 مساءً',
  '05:00 مساءً',
  '05:30 مساءً',
  '06:00 مساءً',
  '06:30 مساءً',
  '07:00 مساءً',
  '07:30 مساءً',
  '08:00 مساءً',
  '08:30 مساءً',
  '09:00 مساءً',
  '10:00 صباحاً',
  '11:00 صباحاً',
];

export const SchedulesSection: React.FC<SchedulesSectionProps> = ({
  schedules,
  students,
  teachers,
  attendance,
  academyName,
  onAddSchedule,
  onDeleteSchedule,
  onMarkAttendance,
  onAddStar,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [starBanner, setStarBanner] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  // Form states
  const [studentId, setStudentId] = useState(students[0]?.id || 'manual');
  const [customStudentName, setCustomStudentName] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || 'manual');
  const [customTeacherName, setCustomTeacherName] = useState('');
  const [day, setDay] = useState<DayOfWeek>('السبت');
  const [time, setTime] = useState('04:30 مساءً');
  const [courseType, setCourseType] = useState('حلقة فردية خاصة');
  const [sessionUrl, setSessionUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setStudentId(students.length > 0 ? students[0].id : 'manual');
    setTeacherId(teachers.length > 0 ? teachers[0].id : 'manual');
    setCustomStudentName('');
    setCustomTeacherName('');
    setDay('السبت');
    setTime('04:30 مساءً');
    setCourseType('حلقة فردية خاصة');
    setSessionUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let studentName = customStudentName.trim();
    if (studentId !== 'manual') {
      const found = students.find((s) => s.id === studentId);
      if (found) studentName = found.name;
    }

    let teacherName = customTeacherName.trim();
    if (teacherId !== 'manual') {
      const found = teachers.find((t) => t.id === teacherId);
      if (found) teacherName = found.name;
    }

    if (!studentName || !teacherName) {
      return;
    }

    onAddSchedule({
      studentId: studentId === 'manual' ? '' : studentId,
      studentName,
      teacherId: teacherId === 'manual' ? '' : teacherId,
      teacherName,
      day,
      time,
      courseType,
      sessionUrl: sessionUrl.trim(),
      notes: notes.trim(),
    });

    setIsModalOpen(false);
  };

  const filteredSchedules =
    selectedDayFilter === 'all'
      ? schedules
      : schedules.filter((s) => s.day === selectedDayFilter);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Add Appointment Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-amiri text-white">
              جدول المواعيد والحلقات والحضور ({schedules.length})
            </h2>
            <p className="text-xs text-[#D4AF37]/80">
              تسجيل الحضور والغياب في كل حصة (حضر / غاب)، مكافآت النجوم، وتنبيهات غياب أولياء الأمور عبر واتساب
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="gold-gradient-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#07241B]" />
          <span>+ إضافة موعد حلقة جديد</span>
        </button>
      </div>

      {/* 10-Star Celebration Banner */}
      {starBanner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-[#D4AF37]/25 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-[#D4AF37] shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold text-[#F3E5AB]">🎉 مبروك! الطالب وصل 10 نجوم ويستحق شهادة</h4>
              <p className="text-xs text-white">{starBanner}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStarBanner(null)}
            className="px-3 py-1 rounded-lg bg-[#07241B] text-xs text-[#F3E5AB] cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Filter by Day */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] ml-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>تصفية باليوم:</span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedDayFilter === 'all'
              ? 'bg-[#D4AF37] text-[#07241B] font-bold shadow'
              : 'bg-[#0B3D2E] text-slate-300 hover:text-white border border-[#D4AF37]/20'
          }`}
        >
          كل الأيام ({schedules.length})
        </button>
        {DAYS.map((d) => {
          const count = schedules.filter((s) => s.day === d).length;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDayFilter === d
                  ? 'bg-[#D4AF37] text-[#07241B] font-bold shadow'
                  : 'bg-[#0B3D2E] text-slate-300 hover:text-white border border-[#D4AF37]/20'
              }`}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      {/* Schedules Cards List */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-[#0B3D2E]/50 border border-dashed border-[#D4AF37]/30 rounded-2xl p-12 text-center text-slate-300">
          <Calendar className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <p className="text-base font-bold font-amiri text-white">لا توجد مواعيد مسجلة في هذا اليوم</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            أضف موعد حلقة للربط بين الطالب والشيخ وتحديد يوم ووقت التسميع
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
          >
            + إضافة موعد جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule) => {
            const student = students.find((s) => s.id === schedule.studentId);
            const todayRecord = attendance.find(
              (a) =>
                a.studentId === schedule.studentId &&
                a.date === todayStr &&
                (!a.scheduleId || a.scheduleId === schedule.id)
            );
            const parentPhoneClean = cleanWhatsAppNumber(
              student?.parentPhone || student?.phone || ''
            );
            const absenceWhatsAppText = encodeURIComponent(
              `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${schedule.studentName})،\nنحيطكم علماً بأن الطالب غاب النهاردة عن حلقة القرآن الكريم (${schedule.day} - ${schedule.time}).\nنرجو التواصل للاطمئنان والمتابعة.\n${academyName}`
            );

            return (
              <div
                key={schedule.id}
                className="bg-gradient-to-b from-[#104A39]/90 to-[#0B3D2E] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  {/* Header: Day & Time */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D4AF37]/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold font-mono">
                        {schedule.day}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {schedule.time}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(schedule.id)}
                      className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                      title="حذف الموعد (نقل لسلة المحذوفات 30 يوماً)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Student & Teacher Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <User className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span>الطالب: {schedule.studentName}</span>
                      </div>
                      {student && (
                        <span className="text-[11px] font-bold text-[#F3E5AB] bg-[#07241B] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                          {student.stars || 0}/10 ⭐
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#F3E5AB]">
                      <GraduationCap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>المعلم: {schedule.teacherName}</span>
                    </div>
                  </div>

                  {schedule.courseType && (
                    <div className="text-xs text-slate-300 bg-[#07241B]/60 px-3 py-1.5 rounded-lg border border-[#D4AF37]/10 mb-3">
                      {schedule.courseType}
                    </div>
                  )}

                  {/* Attendance Buttons in Every Session Card */}
                  {student && (
                    <div className="space-y-2 pt-2 border-t border-[#D4AF37]/15 mb-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>تسجيل حضور اليوم ({todayStr}):</span>
                        {todayRecord && (
                          <span
                            className={`font-bold ${
                              todayRecord.status === 'present' ? 'text-emerald-300' : 'text-red-300'
                            }`}
                          >
                            {todayRecord.status === 'present' ? '✓ حضر' : '✕ غاب'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onMarkAttendance(student, 'present', schedule)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            todayRecord?.status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                              : 'bg-[#07241B] text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>حضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onMarkAttendance(student, 'absent', schedule)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            todayRecord?.status === 'absent'
                              ? 'bg-red-600 text-white border-red-400 shadow'
                              : 'bg-[#07241B] text-red-300 border-red-500/30 hover:bg-red-600/20'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غاب</span>
                        </button>
                      </div>

                      {/* Absence WhatsApp Alert if Absent */}
                      {todayRecord?.status === 'absent' && (
                        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-2.5 space-y-1.5">
                          <p className="text-[11px] font-bold text-red-200">
                            ⚠️ تنبيه غياب: تم تجهيز رسالة لولي الأمر
                          </p>
                          <a
                            href={`https://wa.me/${parentPhoneClean}?text=${absenceWhatsAppText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-[11px] font-extrabold transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>إرسال رسالة غياب عبر واتساب</span>
                          </a>
                        </div>
                      )}

                      {/* +1 Star Reward Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const res = onAddStar(student);
                          if (res.reachedTen) {
                            setStarBanner(
                              `الطالب (${student.name}) وصل إلى 10 نجوم ويستحق شهادة! تم تصفير النجوم لتبدأ دورة جديدة.`
                            );
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold cursor-pointer transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>+1 نجمة مكافأة ⭐</span>
                      </button>
                    </div>
                  )}
                </div>

                {schedule.sessionUrl && (
                  <div className="pt-2 border-t border-[#D4AF37]/15">
                    <a
                      href={schedule.sessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-400/30 text-xs font-bold transition"
                    >
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      <span>دخول رابط الغرفة / الحلقة</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0B3D2E] border border-[#D4AF37]/50 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-lg font-bold font-amiri">إضافة موعد حلقة جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  الطالب <span className="text-red-400">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0B3D2E] text-white">
                      {s.name} ({s.course})
                    </option>
                  ))}
                  <option value="manual" className="bg-[#0B3D2E] text-white">
                    + كتابة اسم طالب يدوي...
                  </option>
                </select>

                {studentId === 'manual' && (
                  <input
                    type="text"
                    required
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    placeholder="اكتب اسم الطالب..."
                    className="mt-2 w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  المعلم المشرف <span className="text-red-400">*</span>
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0B3D2E] text-white">
                      {t.name}
                    </option>
                  ))}
                  <option value="manual" className="bg-[#0B3D2E] text-white">
                    + كتابة اسم معلم يدوي...
                  </option>
                </select>

                {teacherId === 'manual' && (
                  <input
                    type="text"
                    required
                    value={customTeacherName}
                    onChange={(e) => setCustomTeacherName(e.target.value)}
                    placeholder="اكتب اسم الشيخ / المعلم..."
                    className="mt-2 w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                    اليوم <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d} className="bg-[#0B3D2E] text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                    الوقت <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {COMMON_TIMES.map((t) => (
                      <option key={t} value={t} className="bg-[#0B3D2E] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">نوع الحلقة</label>
                <input
                  type="text"
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value)}
                  placeholder="مثال: حلقة فردية خاصة / حلقة جماعية / تجويد"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  رابط زووم أو تيمز (اختياري)
                </label>
                <input
                  type="url"
                  value={sessionUrl}
                  onChange={(e) => setSessionUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  dir="ltr"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 text-right focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl gold-gradient-btn font-bold text-xs shadow-md transition"
                >
                  حفظ الموعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
