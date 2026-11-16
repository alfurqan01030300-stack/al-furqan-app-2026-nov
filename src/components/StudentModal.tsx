import React, { useEffect, useMemo, useState } from 'react';
import { X, User, Phone, BookOpen, CreditCard, FileText, Check, UserCheck } from 'lucide-react';
import {
  EducationStage,
  EducationSystem,
  FeeStatus,
  HalaqaGroup,
  SecondaryTrack,
  Student,
  StudyScope,
  Teacher,
} from '../types';
import { addDaysToDateStr, getTodayDateStr } from '../utils/storage';
import {
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  getGradesForStage,
  getSubjectsForCurriculum,
  normalizeStageLabel,
  SECONDARY_TRACKS,
} from '../data/curricula';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => void;
  studentToEdit?: Student | null;
  teachers: Teacher[];
  halaqat?: HalaqaGroup[];
  defaultSubscriptionAmount?: number;
}

const COMMON_COURSES = [
  'حفظ القرآن كاملاً مع أحكام التجويد',
  'جزء عم وتبارك مع القاعدة النورانية',
  'إتقان التلاوة وتثبيت الأجزاء الخمسة الأولى',
  'القاعدة النورانية وتأسيس الأطفال',
  'أحكام التجويد ومخارج الحروف ومنظومة الجزرية',
  'حفظ وتفسير الجزء الثلاثين (عم)',
  'المراجعة الشاملة وتأهيل الإجازة بالسند',
];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  teachers,
  halaqat = [],
  defaultSubscriptionAmount = 250,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [educationSystem, setEducationSystem] = useState<EducationSystem>('general');
  const [stage, setStage] = useState<EducationStage>('ابتدائي');
  const [gradeLevel, setGradeLevel] = useState<string>('الأول');
  const [track, setTrack] = useState<SecondaryTrack>('علمي علوم');
  const [studyScope, setStudyScope] = useState<StudyScope>('all');
  const [singleSubject, setSingleSubject] = useState<string>('عربي');

  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(COMMON_COURSES[0]);
  const [customCourse, setCustomCourse] = useState('');
  const [feeStatus, setFeeStatus] = useState<FeeStatus>('unpaid');
  const [notes, setNotes] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [halaqaId, setHalaqaId] = useState('');
  const [completedJuz, setCompletedJuz] = useState<number>(0);
  const [currentSurah, setCurrentSurah] = useState('سورة الفاتحة');
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(defaultSubscriptionAmount);
  const [nextPaymentDate, setNextPaymentDate] = useState(addDaysToDateStr(getTodayDateStr(), 30));

  const isEditing = Boolean(studentToEdit);

  const availableGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const availableSubjects = useMemo(
    () =>
      getSubjectsForCurriculum(
        educationSystem,
        stage,
        gradeLevel,
        stage === 'ثانوي' ? track : undefined
      ),
    [educationSystem, stage, gradeLevel, track]
  );

  useEffect(() => {
    if (!availableGrades.includes(gradeLevel)) {
      setGradeLevel(availableGrades[0]);
    }
  }, [availableGrades, gradeLevel]);

  useEffect(() => {
    if (!availableSubjects.includes(singleSubject)) {
      setSingleSubject(availableSubjects[0] || '');
    }
  }, [availableSubjects, singleSubject]);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || '');
      setAge(studentToEdit.age || '');
      setEducationSystem(studentToEdit.educationSystem || 'general');
      const normalizedStage = normalizeStageLabel(studentToEdit.stage) || 'ابتدائي';
      setStage(normalizedStage);
      setGradeLevel(studentToEdit.gradeLevel || 'الأول');
      setTrack((studentToEdit.track as SecondaryTrack) || 'علمي علوم');
      setStudyScope(studentToEdit.studyScope || 'all');
      setSingleSubject(studentToEdit.selectedSubjects?.[0] || 'عربي');

      setPhone(studentToEdit.phone || '');
      if (COMMON_COURSES.includes(studentToEdit.course)) {
        setCourse(studentToEdit.course);
        setCustomCourse('');
      } else {
        setCourse('other');
        setCustomCourse(studentToEdit.course || '');
      }
      setFeeStatus(studentToEdit.feeStatus || 'unpaid');
      setNotes(studentToEdit.notes || '');
      setParentName(studentToEdit.parentName || '');
      setParentPhone(studentToEdit.parentPhone || studentToEdit.phone || '');
      setAssignedTeacherId(studentToEdit.assignedTeacherId || '');
      setHalaqaId(studentToEdit.halaqaId || '');
      setCompletedJuz(studentToEdit.completedJuz ?? 0);
      setCurrentSurah(studentToEdit.currentSurah || 'سورة الفاتحة');
      setSubscriptionAmount(studentToEdit.subscriptionAmount ?? defaultSubscriptionAmount);
      setNextPaymentDate(studentToEdit.nextPaymentDate || addDaysToDateStr(getTodayDateStr(), 30));
    } else {
      setName('');
      setAge('');
      setEducationSystem('general');
      setStage('ابتدائي');
      setGradeLevel('الأول');
      setTrack('علمي علوم');
      setStudyScope('all');
      setSingleSubject('عربي');
      setPhone('');
      setCourse(COMMON_COURSES[0]);
      setCustomCourse('');
      setFeeStatus('unpaid');
      setNotes('');
      setParentName('');
      setParentPhone('');
      setAssignedTeacherId(teachers.length > 0 ? teachers[0].id : '');
      setHalaqaId(halaqat.length > 0 ? halaqat[0].id : '');
      setCompletedJuz(0);
      setCurrentSurah('سورة النبأ');
      setSubscriptionAmount(defaultSubscriptionAmount);
      setNextPaymentDate(addDaysToDateStr(getTodayDateStr(), 30));
    }
  }, [studentToEdit, isOpen, teachers, halaqat, defaultSubscriptionAmount]);

  if (!isOpen) return null;

  const handleHalaqaChange = (newHalaqaId: string) => {
    setHalaqaId(newHalaqaId);
    const chosen = halaqat.find((h) => h.id === newHalaqaId);
    if (chosen?.teacherId && !assignedTeacherId) {
      setAssignedTeacherId(chosen.teacherId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCourse = course === 'other' ? customCourse.trim() || 'كورس تحفيظ القرآن' : course;
    const chosenHalaqa = halaqat.find((h) => h.id === halaqaId);
    const selectedSubjects =
      studyScope === 'single' ? (singleSubject ? [singleSubject] : []) : availableSubjects;

    onSave({
      name: name.trim(),
      age: age ? Number(age) : '',
      educationSystem,
      stage,
      gradeLevel,
      track: stage === 'ثانوي' ? track : '',
      studyScope,
      selectedSubjects,
      phone: phone.trim(),
      course: finalCourse,
      feeStatus,
      notes: notes.trim(),
      parentName: parentName.trim() || name.trim(),
      parentPhone: parentPhone.trim() || phone.trim(),
      assignedTeacherId,
      halaqaId,
      halaqaName: chosenHalaqa?.name || studentToEdit?.halaqaName || '',
      completedJuz: Math.max(0, Math.min(30, Number(completedJuz) || 0)),
      currentSurah: currentSurah.trim() || 'سورة الفاتحة',
      subscriptionAmount: Number(subscriptionAmount) || defaultSubscriptionAmount,
      nextPaymentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl furqan-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c9a227]/40 bg-[#0a4d2e] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#073923] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">
                {isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <p className="text-xs text-[#e5c76b]">
                {isEditing ? `تعديل ملف: ${studentToEdit?.name}` : 'تسجيل طالب جديد في الأكاديمية'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
              اسم الطالب <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: عبد الله بن خالد الشمري"
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
              />
              <User className="w-4 h-4 text-[#9a7510] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Curriculum Selection Box */}
          <div className="furqan-card-subtle p-3.5 rounded-xl space-y-3">
            <h4 className="text-xs font-extrabold text-[#0a4d2e]">النظام التعليمي والمواد</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">النظام</label>
                <select
                  value={educationSystem}
                  onChange={(e) => setEducationSystem(e.target.value as EducationSystem)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold"
                >
                  <option value="general">{EDUCATION_SYSTEM_LABELS.general}</option>
                  <option value="azhar">{EDUCATION_SYSTEM_LABELS.azhar}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المرحلة</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as EducationStage)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold"
                >
                  {EDUCATION_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الصف</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold"
                >
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">النطاق</label>
                <select
                  value={studyScope}
                  onChange={(e) => setStudyScope(e.target.value as StudyScope)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-2.5 py-2 text-xs text-slate-900 font-bold"
                >
                  <option value="all">كل المواد</option>
                  <option value="single">مادة واحدة</option>
                </select>
              </div>
            </div>

            {stage === 'ثانوي' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الشعبة</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as SecondaryTrack)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                >
                  {SECONDARY_TRACKS.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {studyScope === 'single' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">المادة المختارة</label>
                <select
                  value={singleSubject}
                  onChange={(e) => setSingleSubject(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">السن</label>
              <input
                type="number"
                min="3"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="12"
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">هاتف الطالب</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900 text-left font-mono"
                />
                <Phone className="w-3.5 h-3.5 text-[#9a7510] absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Parent Name & Parent WhatsApp */}
          <div className="furqan-card-subtle p-3.5 rounded-xl space-y-2">
            <h4 className="text-xs font-extrabold text-[#0a4d2e]">
              بيانات ولي الأمر (للدخول والمتابعة عبر الواتساب)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم ولي الأمر
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="مثال: أ. خالد العتيبي"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  رقم واتساب ولي الأمر
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900 text-left font-mono"
                />
              </div>
            </div>
          </div>

          {/* Halaqa & Assigned Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">الحلقة</label>
              <select
                value={halaqaId}
                onChange={(e) => handleHalaqaChange(e.target.value)}
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
              >
                <option value="">-- بدون حلقة محددة --</option>
                {halaqat.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">المعلم المشرف</label>
              <div className="relative">
                <select
                  value={assignedTeacherId}
                  onChange={(e) => setAssignedTeacherId(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2.5 text-slate-900"
                >
                  <option value="">-- اختر المعلم --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <UserCheck className="w-4 h-4 text-[#9a7510] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Memorization Tracking Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 furqan-card-subtle p-3.5 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                الأجزاء المحفوظة (من 30)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={completedJuz}
                onChange={(e) => setCompletedJuz(Number(e.target.value))}
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                السورة الحالية
              </label>
              <input
                type="text"
                value={currentSurah}
                onChange={(e) => setCurrentSurah(e.target.value)}
                placeholder="مثال: سورة الكهف"
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* Subscription & Next Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 furqan-card-subtle p-3.5 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                قيمة الاشتراك الشهري
              </label>
              <input
                type="number"
                min="0"
                value={subscriptionAmount}
                onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                ميعاد التجديد القادم
              </label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
              الكورس / المسار
            </label>
            <div className="relative">
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2.5 text-slate-900"
              >
                {COMMON_COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="other">+ مسار مخصص آخر...</option>
              </select>
              <BookOpen className="w-4 h-4 text-[#9a7510] absolute left-3 top-3 pointer-events-none" />
            </div>

            {course === 'other' && (
              <input
                type="text"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                placeholder="اكتب اسم المسار..."
                className="mt-2 w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2 text-slate-900"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
              حالة الرسوم الشهرية
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFeeStatus('paid')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold cursor-pointer transition border ${
                  feeStatus === 'paid'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-[#c9a227]'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>دَفَعَ (مسدد)</span>
              </button>

              <button
                type="button"
                onClick={() => setFeeStatus('unpaid')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold cursor-pointer transition border ${
                  feeStatus === 'unpaid'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white text-slate-700 border-[#c9a227]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>لم يدفع بعد</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
              ملاحظات إضافية
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يحفظ جزء عم..."
                className="w-full bg-white border border-[#c9a227] rounded-xl px-3.5 py-2 text-slate-900"
              />
              <FileText className="w-4 h-4 text-[#9a7510] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c9a227]/35">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] font-extrabold text-xs shadow cursor-pointer"
            >
              {isEditing ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
