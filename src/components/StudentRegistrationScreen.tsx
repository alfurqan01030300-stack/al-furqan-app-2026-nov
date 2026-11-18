import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Phone,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { CurriculumEmblemIcon } from './CurriculumEmblemIcon';
import {
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  getFullGradeTitle,
  getGradesForStage,
  getSubjectsForCurriculum,
  SECONDARY_TRACKS,
} from '../data/curricula';
import { EducationStage, EducationSystem, SecondaryTrack, StudyScope } from '../types';
import { normalizePhoneForMatch } from '../utils/storage';

import { sanitizeUserFacingError } from '../supabase/registrationService';

export interface StudentSelfRegistrationPayload {
  name: string;
  age: number;
  phone: string;
  parentName: string;
  parentPhone: string;
  educationSystem: EducationSystem;
  stage: EducationStage;
  gradeLevel: string;
  track?: SecondaryTrack | '';
  studyScope: StudyScope;
  selectedSubjects: string[];
}

interface StudentRegistrationScreenProps {
  prefillPhone?: string;
  onSubmitRegistration: (
    payload: StudentSelfRegistrationPayload
  ) => Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }>;
  onCheckPhoneExists: (normalizedPhone: string) => Promise<boolean>;
  onBackToLogin: () => void;
}

export const StudentRegistrationScreen: React.FC<StudentRegistrationScreenProps> = ({
  prefillPhone = '',
  onSubmitRegistration,
  onCheckPhoneExists,
  onBackToLogin,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [phone, setPhone] = useState(prefillPhone);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const [educationSystem, setEducationSystem] = useState<EducationSystem>('general');
  const [stage, setStage] = useState<EducationStage>('ابتدائي');
  const [gradeLevel, setGradeLevel] = useState<string>('الأول');
  const [track, setTrack] = useState<SecondaryTrack | ''>('');
  const [studyScope, setStudyScope] = useState<StudyScope>('all');
  const [chosenSingleSubject, setChosenSingleSubject] = useState<string>('عربي');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Reset gradeLevel if stage switches from ابتدائي (6 grades) to إعدادي/ثانوي (3 grades)
  useEffect(() => {
    if (!availableGrades.includes(gradeLevel)) {
      setGradeLevel(availableGrades[0]);
    }
  }, [availableGrades, gradeLevel]);

  // Exact filtered curriculum subjects for this student's system, stage, grade, and track
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

  // Keep chosenSingleSubject valid when filters change
  useEffect(() => {
    if (!availableSubjects.includes(chosenSingleSubject)) {
      setChosenSingleSubject(availableSubjects[0] || '');
    }
  }, [availableSubjects, chosenSingleSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الطالب بالكامل.');
      return;
    }

    const numericAge = Number(age);
    if (!numericAge || numericAge < 4 || numericAge > 40) {
      setErrorMsg('يرجى إدخال السن الصحيح.');
      return;
    }

    const cleanPhone = normalizePhoneForMatch(phone);
    if (cleanPhone.length < 7) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح للتواصل والدخول.');
      return;
    }

    const finalSubjects =
      studyScope === 'single'
        ? chosenSingleSubject
          ? [chosenSingleSubject]
          : []
        : availableSubjects;

    if (finalSubjects.length === 0) {
      setErrorMsg('يرجى اختيار المادة الدراسية.');
      return;
    }

    const exists = await onCheckPhoneExists(cleanPhone).catch(() => false);
    if (exists) {
      setErrorMsg('رقم الهاتف مسجل بالفعل في الأكاديمية — يمكنك الدخول برقمك مباشرة من شاشة الدخول.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmitRegistration({
        name: name.trim(),
        age: numericAge,
        phone: phone.trim(),
        parentName: parentName.trim() || `ولي أمر ${name.trim()}`,
        parentPhone: parentPhone.trim() || phone.trim(),
        educationSystem,
        stage,
        gradeLevel,
        track: stage === 'ثانوي' ? track : '',
        studyScope,
        selectedSubjects: finalSubjects,
      });

      if (!res.ok) {
        setErrorMsg(
          sanitizeUserFacingError(res.error, 'تعذر حفظ بيانات الطالب. يرجى المحاولة مرة أخرى.')
        );
      }
    } catch (err) {
      setErrorMsg(sanitizeUserFacingError(err, 'حدث خطأ في الاتصال بالسيرفر، حاول مرة أخرى'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full max-w-full overflow-x-hidden px-3 sm:px-6 py-5 animate-fadeIn">
      <div className="furqan-card rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 w-full max-w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[#c9a227]/45 pb-4">
          <button
            type="button"
            onClick={onBackToLogin}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4 text-[#c9a227]" />
            <span>رجوع للدخول</span>
          </button>

          <div className="text-left sm:text-right">
            <h1 className="text-base sm:text-xl font-extrabold text-[#0a4d2e]">
              تقديم طالب جديد
            </h1>
            <p className="text-[11px] font-bold text-[#9a7510]">
              اختر نظامك التعليمي والصف والمواد لتظهر لك مناهجك فقط
            </p>
          </div>
        </div>

        {/* Icon #1: Dynamic Curriculum Emblem */}
        <div className="furqan-card-subtle rounded-2xl p-4 flex flex-col items-center justify-center border border-[#c9a227]/60">
          <CurriculumEmblemIcon mode={educationSystem} size="md" showCaption />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="bg-red-50 border-2 border-red-400 text-red-900 rounded-2xl p-3.5 text-xs sm:text-sm font-bold"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-sm">
          {/* 1. Education System: مصري عام / أزهري */}
          <div>
            <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
              1. النظام التعليمي <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['general', 'azhar'] as EducationSystem[]).map((sys) => {
                const active = educationSystem === sys;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setEducationSystem(sys)}
                    className={`min-h-[48px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                      active
                        ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227] shadow-md'
                        : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {EDUCATION_SYSTEM_LABELS[sys]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Stage & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
                2. المرحلة الدراسية <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EDUCATION_STAGES.map((st) => {
                  const active = stage === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStage(st)}
                      className={`min-h-[44px] rounded-xl font-extrabold text-xs border-2 transition cursor-pointer ${
                        active
                          ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                          : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
                3. الصف الدراسي <span className="text-red-600">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-11 bg-white border-2 border-[#c9a227] rounded-xl px-3.5 text-sm font-bold text-[#0a4d2e]"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {getFullGradeTitle(stage, g)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3B. Secondary Track if ثانوي */}
          {stage === 'ثانوي' && (
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-2">
                الشعبة ({getFullGradeTitle(stage, gradeLevel)}) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTrack('')}
                  className={`min-h-[44px] px-2 rounded-xl font-extrabold text-xs border-2 transition cursor-pointer ${
                    track === ''
                      ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                      : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                  }`}
                >
                  عام / كل المواد
                </button>
                {SECONDARY_TRACKS.map((tr) => {
                  const active = track === tr;
                  return (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => setTrack(tr)}
                      className={`min-h-[44px] px-2 rounded-xl font-extrabold text-xs border-2 transition cursor-pointer ${
                        active
                          ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                          : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
                      }`}
                    >
                      {tr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. هتدرس ايه؟: مادة واحدة فقط / كل المواد */}
          <div className="furqan-card-subtle rounded-2xl p-4 space-y-3 border border-[#c9a227]/60">
            <label className="block text-xs font-extrabold text-[#0a4d2e]">
              4. هتدرس إيه؟ <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStudyScope('single')}
                className={`min-h-[44px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                  studyScope === 'single'
                    ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                    : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                }`}
              >
                مادة واحدة فقط
              </button>
              <button
                type="button"
                onClick={() => setStudyScope('all')}
                className={`min-h-[44px] rounded-xl font-extrabold text-xs sm:text-sm border-2 transition cursor-pointer ${
                  studyScope === 'all'
                    ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                    : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                }`}
              >
                كل المواد ({availableSubjects.length})
              </button>
            </div>

            {studyScope === 'single' ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-[#9a7510]">
                  اختر مادة واحدة من مقررات {getFullGradeTitle(stage, gradeLevel)} ({EDUCATION_SYSTEM_LABELS[educationSystem]}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subj) => {
                    const active = chosenSingleSubject === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setChosenSingleSubject(subj)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition cursor-pointer ${
                          active
                            ? 'bg-[#c9a227] text-[#07241B] border-[#0a4d2e] shadow'
                            : 'bg-white text-[#0a4d2e] border-[#c9a227]/50 hover:bg-[#fff9e6]'
                        }`}
                      >
                        {active ? '✓ ' : ''}
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    سيتم تسجيلك في كل مواد {getFullGradeTitle(stage, gradeLevel)} ({EDUCATION_SYSTEM_LABELS[educationSystem]}
                    {stage === 'ثانوي' && track ? ` - ${track}` : ''}):
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSubjects.map((subj) => (
                    <span
                      key={subj}
                      className="px-2.5 py-1 rounded-lg bg-[#0a4d2e] text-[#fffdf5] text-[11px] font-bold"
                    >
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Basic Student Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                اسم الطالب بالكامل <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9a7510] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: يوسف أحمد محمود"
                  className="w-full h-11 bg-white border border-[#c9a227] rounded-xl pr-10 pl-3.5 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                السن <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                required
                min={4}
                max={40}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="مثال: 11"
                className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3.5 text-sm font-bold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                رقم هاتف الطالب (للدخول) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#9a7510] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full h-11 bg-white border border-[#c9a227] rounded-xl pl-9 pr-3 text-sm font-mono text-left text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                اسم ولي الأمر
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#9a7510] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="أ. أحمد محمود"
                  className="w-full h-11 bg-white border border-[#c9a227] rounded-xl pr-9 pl-3 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0a4d2e] mb-1">
                واتساب ولي الأمر
              </label>
              <input
                type="tel"
                dir="ltr"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="نفس الرقم أو رقم آخر"
                className="w-full h-11 bg-white border border-[#c9a227] rounded-xl px-3 text-sm font-mono text-left text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-base shadow-lg cursor-pointer transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>جاري التسجيل والدخول...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>إتمام التقديم والدخول لحساب الطالب</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
