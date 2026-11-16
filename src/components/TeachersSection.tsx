import React, { useRef, useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Phone,
  MessageSquare,
  BookOpen,
  Trash2,
  Edit3,
  X,
  Wallet,
  Star,
  Lock,
  LogIn,
  ArrowRight,
  Users,
  Calendar,
  Award,
  Upload,
  Eye,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  AcademySettings,
  AttendanceRecord,
  HalaqaGroup,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
  TeacherStudyMode,
  TeacherSystemChoice,
} from '../types';
import { cleanWhatsAppNumber, getTodayDateStr } from '../utils/storage';
import { hashPassword, normalizePhoneAuth } from '../utils/authStorage';
import { compressImageToDataUrl } from '../firebase/storageService';
import {
  getTeacherAvailableSubjects,
  TEACHER_SYSTEM_LABELS,
} from '../data/curricula';

interface TeachersSectionProps {
  teachers: Teacher[];
  students: Student[];
  attendance: AttendanceRecord[];
  teacherRatings: TeacherRating[];
  halaqat?: HalaqaGroup[];
  schedules?: ScheduleAppointment[];
  settings: AcademySettings;
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onApproveTeacher?: (teacherId: string) => void;
  onRejectTeacher?: (teacherId: string) => void;
  onLoginAsTeacher?: (teacher: Teacher) => void;
}

const COMMON_SUBJECTS = [
  'شرعية',
  'عربية',
  'انجليزية',
  'قرآن كريم وتجويد',
  'نور البيان والقاعدة النورانية',
];

export const TeachersSection: React.FC<TeachersSectionProps> = ({
  teachers,
  students,
  attendance,
  teacherRatings,
  halaqat = [],
  schedules = [],
  settings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onApproveTeacher,
  onRejectTeacher,
  onLoginAsTeacher,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string } | null>(null);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [specialization, setSpecialization] = useState(COMMON_SUBJECTS[0]);
  const [customSpec, setCustomSpec] = useState('');
  const [teachingSystems, setTeachingSystems] = useState<TeacherSystemChoice>('both');
  const [teachingMode, setTeachingMode] = useState<TeacherStudyMode>('multiple');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [sessionRate, setSessionRate] = useState<number>(settings.defaultSessionRate || 40);
  const [notes, setNotes] = useState('');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const currentMonth = getTodayDateStr().slice(0, 7);
  const currency = settings.currency || 'ر.س';

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  const availableSubjectsForForm = getTeacherAvailableSubjects(teachingSystems);

  const toggleFormSubject = (subj: string) => {
    if (teachingMode === 'single') {
      setSelectedSubjects([subj]);
      return;
    }
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((x) => x !== subj) : [...prev, subj]
    );
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setAvatarUrl('');
    setPhone('');
    setTeacherPassword('');
    setSpecialization(COMMON_SUBJECTS[0]);
    setCustomSpec('');
    setTeachingSystems('both');
    setTeachingMode('multiple');
    setSelectedSubjects(['عربي']);
    setSessionRate(settings.defaultSessionRate || 40);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setName(t.name);
    setAvatarUrl(t.avatarUrl || '');
    setPhone(t.phone);
    setTeacherPassword(t.password || '');
    if (COMMON_SUBJECTS.includes(t.specialization)) {
      setSpecialization(t.specialization);
      setCustomSpec('');
    } else {
      setSpecialization('other');
      setCustomSpec(t.specialization);
    }
    setTeachingSystems(t.teachingSystems || 'both');
    setTeachingMode(t.teachingMode || 'multiple');
    setSelectedSubjects(Array.isArray(t.subjects) ? t.subjects : []);
    setSessionRate(t.sessionRate ?? settings.defaultSessionRate ?? 40);
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageToDataUrl(file, 480, 0.8);
      setAvatarUrl(compressed);
    } catch {
      // ignore read failure
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSubjects =
      selectedSubjects.length > 0
        ? selectedSubjects
        : [specialization === 'other' ? customSpec.trim() || 'شرعية' : specialization];
    const finalSpec =
      finalSubjects.join(' • ') ||
      (specialization === 'other' ? customSpec.trim() || 'شرعية' : specialization);
    const normalized = normalizePhoneAuth(phone.trim());
    const cleanPass = teacherPassword.trim();
    const passHash = cleanPass ? await hashPassword(cleanPass) : '';

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        name: name.trim(),
        avatarUrl: avatarUrl || editingTeacher.avatarUrl || '',
        phone: normalized || phone.trim(),
        normalizedPhone: normalized,
        password: cleanPass || editingTeacher.password || '',
        passwordHash: passHash || editingTeacher.passwordHash || '',
        role: 'teacher',
        specialization: finalSpec,
        teachingSystems,
        teachingMode,
        subjects: finalSubjects,
        sessionRate: Number(sessionRate) || 0,
        notes: notes.trim(),
      });
    } else {
      onAddTeacher({
        name: name.trim(),
        avatarUrl,
        phone: normalized || phone.trim(),
        normalizedPhone: normalized,
        password: cleanPass,
        passwordHash: passHash,
        role: 'teacher',
        status: 'active',
        specialization: finalSpec,
        teachingSystems,
        teachingMode,
        subjects: finalSubjects,
        sessionRate: Number(sessionRate) || 0,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Dedicated Teacher Detail View when clicking any teacher card
  if (selectedTeacher) {
    const assignedStudents = students.filter((s) => s.assignedTeacherId === selectedTeacher.id);
    const teacherHalaqat = halaqat.filter(
      (h) => h.teacherId === selectedTeacher.id || h.teacherName === selectedTeacher.name
    );
    const teacherSchedules = schedules.filter(
      (s) => s.teacherId === selectedTeacher.id || s.teacherName === selectedTeacher.name
    );
    const cleanPhone = cleanWhatsAppNumber(selectedTeacher.phone);
    const rate = selectedTeacher.sessionRate ?? settings.defaultSessionRate ?? 40;
    const monthSessions = attendance.filter(
      (a) =>
        a.teacherId === selectedTeacher.id &&
        a.date.startsWith(currentMonth) &&
        a.status === 'present'
    );
    const salary = monthSessions.length * rate;
    const certs = selectedTeacher.certificates || [];

    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedTeacherId(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fffdf5] hover:bg-[#fff3cc] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة المدرسين</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onApproveTeacher && (selectedTeacher.status || 'active') !== 'active' && (
              <button
                type="button"
                onClick={() => onApproveTeacher(selectedTeacher.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>قبول وتفعيل</span>
              </button>
            )}
            {onRejectTeacher && (selectedTeacher.status || 'active') !== 'rejected' && (
              <button
                type="button"
                onClick={() => onRejectTeacher(selectedTeacher.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer transition"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض</span>
              </button>
            )}
            {onLoginAsTeacher && (
              <button
                type="button"
                onClick={() => onLoginAsTeacher(selectedTeacher)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] text-xs font-extrabold cursor-pointer transition"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول كمدرس (للتجربة)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOpenEdit(selectedTeacher)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fffdf5] hover:bg-[#fff3cc] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل البيانات</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteTeacher(selectedTeacher.id);
                setSelectedTeacherId(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold cursor-pointer transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="furqan-card rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {selectedTeacher.avatarUrl ? (
              <img
                src={selectedTeacher.avatarUrl}
                alt={selectedTeacher.name}
                className="w-18 h-18 rounded-2xl object-cover border-2 border-[#c9a227] shrink-0"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-[#0a4d2e] text-[#c9a227] border-2 border-[#c9a227] flex items-center justify-center shrink-0">
                <GraduationCap className="w-9 h-9" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
                {selectedTeacher.name}
              </h2>
              <p className="text-sm font-bold text-[#9a7510] mt-0.5">
                {selectedTeacher.teachingSystems
                  ? `${TEACHER_SYSTEM_LABELS[selectedTeacher.teachingSystems]} • `
                  : ''}
                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0
                  ? selectedTeacher.subjects.join(' • ')
                  : selectedTeacher.specialization}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-700 mt-2">
                {selectedTeacher.teachingMode && (
                  <span className="bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold px-2 py-0.5 rounded-lg">
                    {selectedTeacher.teachingMode === 'single' ? 'مادة واحدة' : 'مواد متعددة'}
                  </span>
                )}
                {selectedTeacher.teachingStages && selectedTeacher.teachingStages.length > 0 && (
                  <span className="bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg font-bold">
                    المراحل: {selectedTeacher.teachingStages.join('، ')}
                  </span>
                )}
                {selectedTeacher.teachingGrades && selectedTeacher.teachingGrades.length > 0 && (
                  <span className="bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg font-bold">
                    الصفوف: {selectedTeacher.teachingGrades.join('، ')}
                  </span>
                )}
                <span dir="ltr" className="font-mono font-bold tabular-nums">
                  {selectedTeacher.normalizedPhone || selectedTeacher.phone}
                </span>
                {selectedTeacher.age && (
                  <span className="tabular-nums bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg">
                    السن: {selectedTeacher.age} سنة
                  </span>
                )}
                {selectedTeacher.location && (
                  <span className="inline-flex items-center gap-1 bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg">
                    <MapPin className="w-3 h-3 text-[#9a7510]" />
                    {selectedTeacher.location}
                  </span>
                )}
                {selectedTeacher.dailyHours && (
                  <span className="tabular-nums bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg">
                    {selectedTeacher.dailyHours} ساعات/يوم ({selectedTeacher.availablePeriod || 'مرن'})
                  </span>
                )}
                {typeof selectedTeacher.experienceYears === 'number' && (
                  <span className="tabular-nums bg-[#fff9e6] border border-[#c9a227]/60 px-2 py-0.5 rounded-lg">
                    خبرة: {selectedTeacher.experienceYears} سنوات
                  </span>
                )}
                {selectedTeacher.gender && <span>النوع: {selectedTeacher.gender}</span>}
                {selectedTeacher.password && (
                  <span className="font-mono bg-[#fff9e6] border border-[#c9a227] px-2 py-0.5 rounded-lg">
                    كلمة السر: <span dir="ltr">{selectedTeacher.password}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="furqan-card-subtle rounded-xl px-4 py-2.5 text-center">
              <span className="text-[11px] font-bold text-slate-600 block">راتب الشهر ({currentMonth})</span>
              <strong className="text-lg font-black text-[#0a4d2e] tabular-nums">
                {salary} {currency}
              </strong>
            </div>
            {selectedTeacher.phone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-[#07241B] text-xs font-extrabold"
              >
                <MessageSquare className="w-4 h-4" />
                <span>تواصل واتساب</span>
              </a>
            )}
          </div>
        </div>

        {/* Assigned Students & Schedules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Assigned Students */}
          <div className="furqan-card rounded-2xl p-5 shadow-md space-y-3">
            <h3 className="text-base font-extrabold text-[#0a4d2e] flex items-center gap-2 pb-2.5 border-b border-[#c9a227]/40">
              <Users className="w-5 h-5 text-[#9a7510]" />
              <span>طلاب المدرس ({assignedStudents.length})</span>
            </h3>
            {assignedStudents.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">
                لا يوجد طلاب مسكنون على هذا المدرس حالياً.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {assignedStudents.map((st) => (
                  <div
                    key={st.id}
                    className="furqan-card-subtle rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0a4d2e] truncate">{st.name}</p>
                      <p className="text-xs text-slate-600">
                        {st.stage ? `${st.stage} • ` : ''}
                        {st.halaqaName || st.course}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#9a7510] tabular-nums shrink-0">
                      {st.stars || 0}/10 ⭐
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Halaqat & Schedules */}
          <div className="furqan-card rounded-2xl p-5 shadow-md space-y-3">
            <h3 className="text-base font-extrabold text-[#0a4d2e] flex items-center gap-2 pb-2.5 border-b border-[#c9a227]/40">
              <Calendar className="w-5 h-5 text-[#9a7510]" />
              <span>الحلقات والمواعيد ({teacherHalaqat.length + teacherSchedules.length})</span>
            </h3>
            {teacherHalaqat.length === 0 && teacherSchedules.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">
                لا توجد حلقات أو مواعيد مخصصة لهذا المدرس حتى الآن.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {teacherHalaqat.map((h) => (
                  <div
                    key={h.id}
                    className="furqan-card-subtle rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0a4d2e] truncate">
                        حلقة: {h.name}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#9a7510]" />
                        <span>
                          {h.subject} • {h.scheduleTime}
                        </span>
                      </p>
                    </div>
                    {h.zoomUrl && (
                      <a
                        href={h.zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a4d2e] text-white text-xs font-bold"
                      >
                        <Video className="w-3.5 h-3.5 text-[#c9a227]" />
                        <span>زوم</span>
                      </a>
                    )}
                  </div>
                ))}

                {teacherSchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="furqan-card-subtle rounded-xl p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#0a4d2e]">
                        طالب: {sch.studentName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {sch.day} • {sch.time}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#9a7510]">{sch.courseType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Certificates (if any) */}
        {certs.length > 0 && (
          <div className="furqan-card rounded-2xl p-5 shadow-md space-y-3">
            <h3 className="text-base font-extrabold text-[#0a4d2e] flex items-center gap-2 pb-2.5 border-b border-[#c9a227]/40">
              <Award className="w-5 h-5 text-[#9a7510]" />
              <span>الشهادات والإجازات المرفقة ({certs.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs.map((cert, i) => (
                <div key={cert.id || i} className="furqan-card-subtle rounded-xl p-3 space-y-2">
                  <p className="text-xs font-extrabold text-[#0a4d2e] truncate">{cert.name}</p>
                  {cert.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage({ title: cert.name, url: cert.imageUrl })}
                      className="w-full relative group rounded-lg overflow-hidden border border-[#c9a227] cursor-pointer"
                    >
                      <img
                        src={cert.imageUrl}
                        alt={cert.name}
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition">
                        <Eye className="w-4 h-4" />
                        تكبير الصورة
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Add Button */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e]">
              المدرسون وهيئة التدريس (<span className="tabular-nums">{teachers.length}</span>)
            </h2>
            <p className="text-xs text-slate-600">
              اضغط على كارت أي مدرس لفتح صفحته (طلابه، مواعيده، شهاداته) أو إضافة مدرس جديد
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] font-extrabold text-xs sm:text-sm shadow cursor-pointer transition"
        >
          <UserPlus className="w-4 h-4 text-[#c9a227]" />
          <span>+ إضافة مدرس جديد</span>
        </button>
      </div>

      {/* Teachers Cards List */}
      {teachers.length === 0 ? (
        <div className="furqan-card rounded-2xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-[#c9a227] mx-auto mb-3" />
          <p className="text-base font-extrabold text-[#0a4d2e]">لا يوجد معلمون مسجلون حالياً</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#0a4d2e] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold cursor-pointer"
          >
            + إضافة مدرس جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.map((teacher) => {
            const cleanPhone = cleanWhatsAppNumber(teacher.phone);
            const assignedStudents = students.filter((s) => s.assignedTeacherId === teacher.id);

            const rate = teacher.sessionRate ?? settings.defaultSessionRate ?? 40;
            const monthSessions = attendance.filter(
              (a) =>
                a.teacherId === teacher.id &&
                a.date.startsWith(currentMonth) &&
                a.status === 'present'
            );
            const salary = monthSessions.length * rate;

            const ratings = teacherRatings.filter((r) => r.teacherId === teacher.id);
            const avgRating =
              ratings.length > 0
                ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                : null;

            return (
              <div
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTeacherId(teacher.id);
                  }
                }}
                className="furqan-card rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {teacher.avatarUrl ? (
                        <img
                          src={teacher.avatarUrl}
                          alt={teacher.name}
                          className="w-12 h-12 shrink-0 rounded-2xl object-cover border border-[#c9a227]"
                        />
                      ) : (
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-[#0a4d2e] truncate">
                          {teacher.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#9a7510] mt-0.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{teacher.specialization}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a4d2e] hover:bg-[#fff3cc] transition cursor-pointer"
                        title="تعديل بيانات المعلم"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTeacher(teacher.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition cursor-pointer"
                        title="حذف المعلم (نقل لسلة المحذوفات 30 يوماً)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Pill & Onboarding Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
                    {teacher.status && teacher.status !== 'active' && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold ${
                          teacher.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-400'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {teacher.status === 'pending' ? 'بانتظار القبول' : 'مرفوض'}
                      </span>
                    )}
                    {teacher.teachingSystems && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#0a4d2e] text-[#fffdf5] font-bold">
                        {TEACHER_SYSTEM_LABELS[teacher.teachingSystems]}
                      </span>
                    )}
                    {teacher.teachingMode && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 font-bold">
                        {teacher.teachingMode === 'single' ? 'مادة واحدة' : 'مواد متعددة'}
                      </span>
                    )}
                    {teacher.location && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#fff9e6] border border-[#c9a227]/50 text-[#0a4d2e] font-bold">
                        <MapPin className="w-3 h-3 text-[#9a7510]" />
                        {teacher.location}
                      </span>
                    )}
                    {teacher.dailyHours && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#fff9e6] border border-[#c9a227]/50 text-[#0a4d2e] font-bold tabular-nums">
                        {teacher.dailyHours} س/يوم • {teacher.availablePeriod || 'متاح'}
                      </span>
                    )}
                    {typeof teacher.experienceYears === 'number' && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold tabular-nums">
                        خبرة {teacher.experienceYears} سنة
                      </span>
                    )}
                  </div>

                  {/* Salary & Session Rate Box */}
                  <div className="furqan-card-subtle rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#0a4d2e] font-bold flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-[#9a7510]" />
                        مرتب الشهر ({currentMonth}):
                      </span>
                      <span className="text-sm font-black text-[#0a4d2e] tabular-nums">
                        {salary} {currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="tabular-nums">عدد الحصص: {monthSessions.length} حصة</span>
                      <span className="tabular-nums">سعر الحصة: {rate} {currency}</span>
                    </div>
                  </div>

                  {/* Parent Rating Summary */}
                  <div className="bg-white rounded-xl p-2.5 border border-[#c9a227]/50 mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                      تقييم أولياء الأمور:
                    </span>
                    <span className="font-extrabold text-[#0a4d2e] tabular-nums">
                      {avgRating ? `${avgRating} / 5 ⭐ (${ratings.length})` : 'جديد'}
                    </span>
                  </div>

                  {/* Credentials Row */}
                  <div
                    className="bg-white rounded-xl p-2.5 border border-[#c9a227]/50 mt-2.5 space-y-1.5 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 font-bold">رقم الواتساب:</span>
                      <div className="flex items-center gap-1.5">
                        <span dir="ltr" className="font-mono text-[#0a4d2e] font-extrabold tabular-nums">
                          {teacher.normalizedPhone || teacher.phone || '—'}
                        </span>
                        {teacher.phone && (
                          <>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-[#25D366] text-[#07241B]"
                              title="مراسلة عبر واتساب"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1 rounded-lg bg-[#0a4d2e] text-[#c9a227]"
                              title="اتصال"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-700 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#9a7510]" />
                        <span>طريقة الدخول:</span>
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono font-bold px-2 py-0.5 rounded bg-[#fff9e6] border border-[#c9a227]/60 text-[#0a4d2e] select-all"
                      >
                        {teacher.password ? teacher.password : 'برقم الهاتف مباشرة'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="pt-3 border-t border-[#c9a227]/35 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">الطلاب المسكنون:</span>
                    <span className="font-extrabold text-[#0a4d2e] bg-[#fff9e6] px-2.5 py-0.5 rounded-full border border-[#c9a227] tabular-nums">
                      {assignedStudents.length} طلاب
                    </span>
                  </div>

                  {(onApproveTeacher || onRejectTeacher) && (teacher.status || 'active') !== 'active' && (
                    <div className="grid grid-cols-2 gap-2">
                      {onApproveTeacher && (
                        <button
                          type="button"
                          onClick={() => onApproveTeacher(teacher.id)}
                          className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول المعلم</span>
                        </button>
                      )}
                      {onRejectTeacher && (teacher.status || 'active') !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onRejectTeacher(teacher.id)}
                          className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className="py-2 px-3 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] font-extrabold text-xs cursor-pointer transition"
                    >
                      صفحة المدرس
                    </button>
                    {onLoginAsTeacher && (
                      <button
                        type="button"
                        onClick={() => onLoginAsTeacher(teacher)}
                        className="py-2 px-3 rounded-xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>تجربة الحساب</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md furqan-card rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9a227]/40">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0a4d2e]" />
                <h3 className="text-lg font-extrabold text-[#0a4d2e]">
                  {editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Avatar Upload */}
              <div className="flex items-center gap-3 furqan-card-subtle p-3 rounded-xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="صورة المدرس"
                    className="w-12 h-12 rounded-xl object-cover border border-[#c9a227]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#0a4d2e] text-[#c9a227] flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0a4d2e]">صورة المدرس (اختياري)</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0a4d2e] text-white text-xs font-bold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#c9a227]" />
                    <span>{avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                  الاسم الكامل <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الشيخ / محمد بن علي"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    رقم الواتساب للدخول <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900 text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    كلمة سر الدخول
                  </label>
                  <input
                    type="text"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="مثال: 123456"
                    dir="ltr"
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900 text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    النظام التعليمي الذي يدرّسه
                  </label>
                  <select
                    value={teachingSystems}
                    onChange={(e) => setTeachingSystems(e.target.value as TeacherSystemChoice)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                  >
                    <option value="general">{TEACHER_SYSTEM_LABELS.general}</option>
                    <option value="azhar">{TEACHER_SYSTEM_LABELS.azhar}</option>
                    <option value="both">{TEACHER_SYSTEM_LABELS.both}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    نطاق التدريس
                  </label>
                  <select
                    value={teachingMode}
                    onChange={(e) => {
                      const mode = e.target.value as TeacherStudyMode;
                      setTeachingMode(mode);
                      if (mode === 'single' && selectedSubjects.length > 1) {
                        setSelectedSubjects([selectedSubjects[0]]);
                      }
                    }}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                  >
                    <option value="single">مادة واحدة فقط</option>
                    <option value="multiple">مواد متعددة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                  المواد المسموح للمدرس بتدريسها ({TEACHER_SYSTEM_LABELS[teachingSystems]}):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto bg-white/70 p-2.5 rounded-xl border border-[#c9a227]/50">
                  {availableSubjectsForForm.map((subj) => {
                    const active = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleFormSubject(subj)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          active
                            ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                            : 'bg-white text-[#0a4d2e] border-[#c9a227]/50'
                        }`}
                      >
                        {active ? '✓ ' : ''}
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    سعر الحصة ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sessionRate}
                    onChange={(e) => setSessionRate(Number(e.target.value))}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                    تخصص إضافي (اختياري)
                  </label>
                  <input
                    type="text"
                    value={customSpec}
                    onChange={(e) => setCustomSpec(e.target.value)}
                    placeholder="إن وجد..."
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                  ملاحظات أو مؤهلات
                </label>
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
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] font-extrabold text-xs shadow cursor-pointer"
                >
                  {editingTeacher ? 'حفظ التعديل' : 'إضافة المدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
