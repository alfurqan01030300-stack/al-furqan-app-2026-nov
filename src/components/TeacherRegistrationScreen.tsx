import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Phone,
  RefreshCw,
  Upload,
  User,
} from 'lucide-react';
import { CurriculumEmblemIcon } from './CurriculumEmblemIcon';
import {
  EDUCATION_STAGES,
  getFullGradeTitle,
  getGradesForStage,
  getTeacherAvailableSubjects,
  SECONDARY_TRACKS,
  TEACHER_SYSTEM_LABELS,
} from '../data/curricula';
import {
  EducationStage,
  SecondaryTrack,
  TeacherStudyMode,
  TeacherSystemChoice,
} from '../types';
import { normalizePhoneAuth } from '../utils/authStorage';
import { compressImageToDataUrl } from '../firebase/storageService';

export interface TeacherSelfRegistrationPayload {
  name: string;
  age: number;
  phone: string;
  location: string;
  teachingSystems: TeacherSystemChoice;
  teachingMode: TeacherStudyMode;
  teachingStages: EducationStage[];
  teachingGrades: string[];
  teachingTrack?: SecondaryTrack | '';
  subjects: string[];
  dailyHours: number;
  availablePeriod: 'صباحي' | 'مسائي' | 'الاتنين';
  experienceYears: number;
  avatarUrl?: string;
}

interface TeacherRegistrationScreenProps {
  logoUrl?: string;
  prefillPhone?: string;
  onSubmitRegistration: (
    payload: TeacherSelfRegistrationPayload
  ) => Promise<{ ok: boolean; alreadyExists?: boolean; pendingApproval?: boolean; error?: string }>;
  onCheckPhoneExists: (normalizedPhone: string) => Promise<boolean>;
  onRedirectToLoginWithNotice: (phone: string, notice: string) => void;
  onBackToLogin: () => void;
}

const AVAILABLE_PERIODS: Array<'صباحي' | 'مسائي' | 'الاتنين'> = ['صباحي', 'مسائي', 'الاتنين'];

export const TeacherRegistrationScreen: React.FC<TeacherRegistrationScreenProps> = ({
  prefillPhone = '',
  onSubmitRegistration,
  onCheckPhoneExists,
  onRedirectToLoginWithNotice,
  onBackToLogin,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [phone, setPhone] = useState(prefillPhone);
  const [location, setLocation] = useState('');

  // Curriculum system & teaching mode
  const [teachingSystems, setTeachingSystems] = useState<TeacherSystemChoice>('general');
  const [teachingMode, setTeachingMode] = useState<TeacherStudyMode>('single');

  // Single-subject mode selectors
  const [singleStage, setSingleStage] = useState<EducationStage>('ابتدائي');
  const [singleGrade, setSingleGrade] = useState<string>('الأول');
  const [singleTrack, setSingleTrack] = useState<SecondaryTrack | ''>('');
  const [singleSubject, setSingleSubject] = useState<string>('عربي');

  // Multiple-subjects mode selectors
  const [selectedStages, setSelectedStages] = useState<EducationStage[]>(['ابتدائي']);
  const [selectedGrades, setSelectedGrades] = useState<string[]>(['الأول']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['عربي']);

  const [dailyHours, setDailyHours] = useState<string>('4');
  const [availablePeriod, setAvailablePeriod] = useState<'صباحي' | 'مسائي' | 'الاتنين'>('الاتنين');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedPending, setSubmittedPending] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const singleStageGrades = useMemo(() => getGradesForStage(singleStage), [singleStage]);

  useEffect(() => {
    if (!singleStageGrades.includes(singleGrade)) {
      setSingleGrade(singleStageGrades[0]);
    }
  }, [singleStageGrades, singleGrade]);

  const multiGradesUnion = useMemo(() => {
    const hasPrimary = selectedStages.includes('ابتدائي');
    return hasPrimary ? getGradesForStage('ابتدائي') : getGradesForStage('إعدادي');
  }, [selectedStages]);

  useEffect(() => {
    setSelectedGrades((prev) => {
      const valid = prev.filter((g) => multiGradesUnion.includes(g));
      return valid.length > 0 ? valid : [multiGradesUnion[0]];
    });
  }, [multiGradesUnion]);

  // Strict system-filtered available subjects
  const availableSubjectsForChoice = useMemo(() => {
    const stages = teachingMode === 'single' ? [singleStage] : selectedStages;
    const track = teachingMode === 'single' && singleStage === 'ثانوي' ? singleTrack : undefined;
    return getTeacherAvailableSubjects(teachingSystems, stages, track);
  }, [teachingSystems, teachingMode, singleStage, singleTrack, selectedStages]);

  useEffect(() => {
    if (!availableSubjectsForChoice.includes(singleSubject)) {
      setSingleSubject(availableSubjectsForChoice[0] || '');
    }
    setSelectedSubjects((prev) => {
      const valid = prev.filter((s) => availableSubjectsForChoice.includes(s));
      return valid.length > 0
        ? valid
        : availableSubjectsForChoice[0]
        ? [availableSubjectsForChoice[0]]
        : [];
    });
  }, [availableSubjectsForChoice, singleSubject]);

  const toggleStage = (st: EducationStage) => {
    setSelectedStages((prev) => {
      if (prev.includes(st)) {
        return prev.length > 1 ? prev.filter((x) => x !== st) : prev;
      }
      return [...prev, st];
    });
  };

  const toggleGrade = (gr: string) => {
    setSelectedGrades((prev) => {
      if (prev.includes(gr)) {
        return prev.length > 1 ? prev.filter((x) => x !== gr) : prev;
      }
      return [...prev, gr];
    });
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageToDataUrl(file, 480, 0.8);
      setAvatarUrl(compressed);
    } catch {
      // ignore optional image failure
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handlePhoneBlur = async () => {
    const norm = normalizePhoneAuth(phone);
    if (norm.length >= 9) {
      const exists = await onCheckPhoneExists(norm).catch(() => false);
      if (exists) {
        setDuplicateNotice(true);
        setErrorMsg('رقم التليفون ده متسجل قبل كده — تقدر تدخل برقمك مباشرة.');
      } else {
        setDuplicateNotice(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateNotice(false);

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال الاسم بالكامل.');
      return;
    }

    const numericAge = Number(age);
    if (!numericAge || numericAge < 18 || numericAge > 80) {
      setErrorMsg('يرجى إدخال السن الصحيح (من 18 إلى 80 سنة).');
      return;
    }

    const normalizedPhone = normalizePhoneAuth(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      setErrorMsg('يرجى إدخال رقم تليفون / واتساب صحيح.');
      return;
    }

    if (!location.trim()) {
      setErrorMsg('يرجى إدخال المحافظة / البلد.');
      return;
    }

    const finalStages: EducationStage[] =
      teachingMode === 'single' ? [singleStage] : selectedStages;
    const finalGrades: string[] =
      teachingMode === 'single' ? [singleGrade] : selectedGrades;
    const finalSubjects: string[] =
      teachingMode === 'single'
        ? singleSubject
          ? [singleSubject]
          : []
        : selectedSubjects;

    if (finalStages.length === 0 || finalGrades.length === 0 || finalSubjects.length === 0) {
      setErrorMsg('يرجى اختيار المرحلة والصف والمادة أو المواد من قائمة نظامك.');
      return;
    }

    const numericHours = Number(dailyHours);
    if (!numericHours || numericHours < 1 || numericHours > 16) {
      setErrorMsg('يرجى إدخال عدد الساعات المتاحة في اليوم (من 1 إلى 16 ساعة).');
      return;
    }

    if (experienceYears === '' || Number(experienceYears) < 0 || Number(experienceYears) > 60) {
      setErrorMsg('يرجى إدخال عدد سنوات الخبرة.');
      return;
    }

    const alreadyExists = await onCheckPhoneExists(normalizedPhone).catch(() => false);
    if (alreadyExists) {
      onRedirectToLoginWithNotice(
        normalizedPhone,
        'رقمك مسجل بالفعل — ادخل برقم تليفونك مباشرة دون إعادة التسجيل.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmitRegistration({
        name: name.trim(),
        age: numericAge,
        phone: normalizedPhone,
        location: location.trim(),
        teachingSystems,
        teachingMode,
        teachingStages: finalStages,
        teachingGrades: finalGrades,
        teachingTrack: teachingMode === 'single' && singleStage === 'ثانوي' ? singleTrack : '',
        subjects: finalSubjects,
        dailyHours: numericHours,
        availablePeriod,
        experienceYears: Number(experienceYears),
        avatarUrl: avatarUrl || undefined,
      });

      if (!res.ok) {
        if (res.alreadyExists) {
          onRedirectToLoginWithNotice(
            normalizedPhone,
            'رقمك مسجل بالفعل — ادخل برقم تليفونك مباشرة دون إعادة التسجيل.'
          );
          return;
        }
        setErrorMsg(res.error || 'تعذر حفظ البيانات، يرجى المحاولة مرة أخرى.');
        return;
      }

      if (res.pendingApproval !== false) {
        setSubmittedPending(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedPending) {
    return (
      <div
        dir="rtl"
        className="flex-1 w-full max-w-full overflow-x-hidden furqan-shell-bg py-8 px-4 flex items-center justify-center font-cairo"
      >
        <div className="w-full max-w-md furqan-card rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-[#0a4d2e] text-[#0a4d2e] flex items-center justify-center mx-auto shadow">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
              تم ارسال طلبك للمدير، استنى الموافقة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              تم إرسال بياناتك إلى إدارة الأكاديمية للمراجعة. فور موافقة المدير يمكنك الدخول مباشرة برقم هاتفك ({phone}).
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border-2 border-[#c9a227] font-extrabold text-sm cursor-pointer transition shadow-md"
          >
            العودة لشاشة الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="flex-1 w-full max-w-full overflow-x-hidden furqan-shell-bg py-6 px-3 sm:px-6 flex justify-center overflow-y-auto font-cairo"
    >
      <div className="w-full max-w-2xl furqan-card rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[#c9a227]/50 pb-4">
          <button
            type="button"
            onClick={onBackToLogin}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4 text-[#c9a227]" />
            <span>رجوع</span>
          </button>

          <div className="text-left sm:text-right">
            <h1 className="text-base sm:text-xl font-extrabold text-[#0a4d2e]">
              تقديم وتسجيل بيانات المدرس
            </h1>
            <p className="text-[11px] font-bold text-[#9a7510]">
              اختر النظام التعليمي والمواد التي تدرسها — مرة واحدة فقط
            </p>
          </div>
        </div>

        {/* Icon #1: Dynamic Registration Curriculum Emblem */}
        <div className="furqan-card-subtle rounded-2xl p-4 flex flex-col items-center justify-center border border-[#c9a227]/60">
          <CurriculumEmblemIcon mode={teachingSystems} size="md" showCaption />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="bg-red-50 border-2 border-red-400 text-red-900 rounded-2xl p-3.5 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <span>{errorMsg}</span>
            {duplicateNotice && (
              <button
                type="button"
                onClick={() =>
                  onRedirectToLoginWithNotice(
                    normalizePhoneAuth(phone),
                    'رقمك مسجل بالفعل — ادخل برقم تليفونك مباشرة.'
                  )
                }
                className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0a4d2e] text-white text-xs font-extrabold cursor-pointer"
              >
                الدخول برقم التليفون الآن
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-sm">
          {/* Optional Avatar Upload */}
          <div className="furqan-card-subtle rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="صورة المدرس"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#c9a227]"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] text-[#c9a227] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-7 h-7" />
                </div>
              )}
              <div>
                <p className="text-xs font-extrabold text-[#0a4d2e]">صورة شخصية (اختياري)</p>
                <p className="text-[11px] text-slate-600">تظهر في ملفك لدى إدارة الأكاديمية</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0a4d2e] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#c9a227]" />
                <span>{avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="min-h-[40px] px-2.5 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-bold cursor-pointer"
                >
                  حذف
                </button>
              )}
            </div>
          </div>

          {/* Teaching System Selection */}
          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
              النظام اللي هتدرّسه <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['general', 'azhar', 'both'] as TeacherSystemChoice[]).map((sys) => {
                const active = teachingSystems === sys;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setTeachingSystems(sys)}
                    className={`min-h-[46px] px-3 py-2 rounded-xl font-extrabold text-xs border-2 transition cursor-pointer ${
                      active
                        ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227] shadow-md'
                        : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {TEACHER_SYSTEM_LABELS[sys]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teaching Mode: مادة واحدة فقط / مواد متعددة */}
          <div className="furqan-card-subtle rounded-2xl p-4 space-y-3.5 border border-[#c9a227]/60">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
                هتدرس إيه؟ <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTeachingMode('single')}
                  className={`min-h-[44px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                    teachingMode === 'single'
                      ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                      : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                  }`}
                >
                  مادة واحدة فقط
                </button>
                <button
                  type="button"
                  onClick={() => setTeachingMode('multiple')}
                  className={`min-h-[44px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                    teachingMode === 'multiple'
                      ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                      : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                  }`}
                >
                  مواد متعددة
                </button>
              </div>
            </div>

            {teachingMode === 'single' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                      المرحلة <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={singleStage}
                      onChange={(e) => {
                        const st = e.target.value as EducationStage;
                        setSingleStage(st);
                        if (st !== 'ثانوي') setSingleTrack('');
                      }}
                      className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3 text-xs sm:text-sm font-bold text-slate-900"
                    >
                      {EDUCATION_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                      الصف الدراسي <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={singleGrade}
                      onChange={(e) => setSingleGrade(e.target.value)}
                      className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3 text-xs sm:text-sm font-bold text-slate-900"
                    >
                      {singleStageGrades.map((gr) => (
                        <option key={gr} value={gr}>
                          {getFullGradeTitle(singleStage, gr)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {singleStage === 'ثانوي' && (
                  <div>
                    <label className="block text-xs font-bold text-[#0a4d2e] mb-1">
                      الشعبة (اختياري للثانوي)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSingleTrack('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          singleTrack === ''
                            ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                            : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                        }`}
                      >
                        كل الشعب
                      </button>
                      {SECONDARY_TRACKS.map((tr) => (
                        <button
                          key={tr}
                          type="button"
                          onClick={() => setSingleTrack(tr)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            singleTrack === tr
                              ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                              : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                          }`}
                        >
                          {tr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#0a4d2e] mb-1.5">
                    اختر المادة الواحدة من مناهج {getFullGradeTitle(singleStage, singleGrade)} ({TEACHER_SYSTEM_LABELS[teachingSystems]}) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjectsForChoice.map((subj) => {
                      const active = singleSubject === subj;
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => setSingleSubject(subj)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border-2 transition cursor-pointer ${
                            active
                              ? 'bg-[#c9a227] text-[#07241B] border-[#0a4d2e] shadow'
                              : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {subj}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Multiple Stages */}
                <div>
                  <label className="block text-xs font-bold text-[#0a4d2e] mb-1.5">
                    المراحل الدراسية (يمكن اختيار أكثر من مرحلة) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EDUCATION_STAGES.map((st) => {
                      const active = selectedStages.includes(st);
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStage(st)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold border-2 transition cursor-pointer ${
                            active
                              ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                              : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multiple Grades */}
                <div>
                  <label className="block text-xs font-bold text-[#0a4d2e] mb-1.5">
                    الصفوف الدراسية <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {multiGradesUnion.map((gr) => {
                      const active = selectedGrades.includes(gr);
                      return (
                        <button
                          key={gr}
                          type="button"
                          onClick={() => toggleGrade(gr)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 transition cursor-pointer ${
                            active
                              ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                              : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                          }`}
                        >
                          {active ? '✓ ' : ''}الصف {gr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtered Subjects Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-[#0a4d2e] mb-1.5">
                    المواد التي تدرّسها (تظهر فقط مواد {TEACHER_SYSTEM_LABELS[teachingSystems]}) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjectsForChoice.map((subj) => {
                      const active = selectedSubjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleSubject(subj)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border-2 transition cursor-pointer ${
                            active
                              ? 'bg-[#c9a227] text-[#07241B] border-[#0a4d2e] shadow-sm'
                              : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {subj}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                الاسم بالكامل <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9a7510] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الشيخ أحمد محمد علي"
                  className="w-full h-12 bg-white border border-[#c9a227] rounded-xl pr-10 pl-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                السن <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                required
                min={18}
                max={80}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="مثال: 30"
                className="w-full h-12 bg-white border border-[#c9a227] rounded-xl px-3.5 text-sm text-slate-900 font-bold tabular-nums focus:outline-none"
              />
            </div>
          </div>

          {/* Phone/WhatsApp & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                رقم التليفون / واتساب <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#9a7510] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setDuplicateNotice(false);
                  }}
                  onBlur={handlePhoneBlur}
                  placeholder="01xxxxxxxxx"
                  className="w-full h-12 bg-white border border-[#c9a227] rounded-xl pl-10 pr-4 text-sm text-slate-900 font-mono text-left focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                المحافظة / البلد <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#9a7510] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: القاهرة - مصر"
                  className="w-full h-12 bg-white border border-[#c9a227] rounded-xl pr-10 pl-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
                />
              </div>
            </div>
          </div>

          {/* Daily Hours & Experience Years */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 furqan-card-subtle p-4 rounded-2xl">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9a7510]" />
                <span>عدد الساعات المتاحة في اليوم <span className="text-red-600">*</span></span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={16}
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                placeholder="مثال: 4"
                className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3.5 text-sm text-slate-900 font-bold tabular-nums focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1.5">
                سنوات الخبرة <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="مثال: 5"
                className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3.5 text-sm text-slate-900 font-bold tabular-nums focus:outline-none"
              />
            </div>
          </div>

          {/* Available Period */}
          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
              المواعيد المتاحة <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {AVAILABLE_PERIODS.map((period) => {
                const active = availablePeriod === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setAvailablePeriod(period)}
                    className={`min-h-[46px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                      active
                        ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227] shadow-md'
                        : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                    }`}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-base sm:text-lg shadow-lg cursor-pointer transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري الحفظ والدخول...</span>
                </>
              ) : (
                <span>حفظ البيانات والدخول</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() =>
                  onRedirectToLoginWithNotice(
                    normalizePhoneAuth(phone),
                    'أدخل رقم تليفونك المسجل للدخول مباشرة.'
                  )
                }
                className="text-xs font-extrabold text-[#0a4d2e] hover:text-[#9a7510] underline cursor-pointer py-1"
              >
                مسجّل بياناتك من قبل؟ دخول برقم التليفون فقط
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
