import React, { useState } from 'react';
import { ArrowRight, GraduationCap, Phone, UserPlus } from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';

interface TeacherAccessScreenProps {
  logoUrl?: string;
  initialPhone?: string;
  initialNotice?: string | null;
  onPhoneOnlyLogin: (
    phone: string
  ) => Promise<{ ok: boolean; notRegistered?: boolean; error?: string }>;
  onOpenFirstTimeRegister: (prefillPhone?: string) => void;
  onBack: () => void;
}

export const TeacherAccessScreen: React.FC<TeacherAccessScreenProps> = ({
  logoUrl = '',
  initialPhone = '',
  initialNotice = null,
  onPhoneOnlyLogin,
  onOpenFirstTimeRegister,
  onBack,
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRegisterShortcut, setShowRegisterShortcut] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowRegisterShortcut(false);

    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم التليفون / الواتساب المسجل.');
      return;
    }

    setSubmitting(true);
    const res = await onPhoneOnlyLogin(phone.trim());
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'تعذر الدخول بهذا الرقم.');
      if (res.notRegistered) {
        setShowRegisterShortcut(true);
      }
    }
  };

  return (
    <div
      dir="rtl"
      className="flex-1 w-full furqan-shell-bg flex flex-col items-center justify-center px-4 py-8 font-cairo"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#073923] hover:bg-[#062E1C] border border-[#c9a227] text-[#fffdf5] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4 text-[#c9a227]" />
            <span>رجوع لاختيار الحساب</span>
          </button>
        </div>

        <div className="furqan-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2.5 pb-4 border-b border-[#c9a227]/45">
            <div className="relative">
              <AcademyLogo logoUrl={logoUrl} size="xl" />
              <span className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-[#c9a227] border-2 border-[#fffdf5] text-[#0a4d2e] flex items-center justify-center shadow">
                <GraduationCap className="w-4 h-4" />
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
                بوابة المعلمين — أكاديمية الفرقان
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                إذا سجّلت بياناتك من قبل ادخل برقم تليفونك مباشرة، أو سجّل بياناتك لأول مرة
              </p>
            </div>
          </div>

          {initialNotice && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-500 text-emerald-900 rounded-2xl p-3 text-xs font-bold text-center"
            >
              {initialNotice}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="bg-red-50 border-2 border-red-400 text-red-900 rounded-2xl p-3.5 text-xs font-bold text-center space-y-2.5"
            >
              <p>{errorMsg}</p>
              {showRegisterShortcut && (
                <button
                  type="button"
                  onClick={() => onOpenFirstTimeRegister(phone.trim())}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <UserPlus className="w-4 h-4 text-[#c9a227]" />
                  <span>تسجيل بيانات المعلم الآن (أول مرة)</span>
                </button>
              )}
            </div>
          )}

          {/* Returning Teacher Phone-Only Login Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label
                htmlFor="teacher-phone-only"
                className="block text-xs sm:text-sm font-extrabold text-[#0a4d2e] mb-2 text-center"
              >
                دخول معلم مسجل — برقم التليفون / الواتساب فقط
              </label>
              <div
                dir="ltr"
                className="w-full h-14 bg-white border-2 border-[#c9a227] focus-within:border-[#0a4d2e] rounded-2xl px-4 flex items-center gap-3 shadow-xs transition"
              >
                <Phone className="w-5 h-5 text-[#9a7510] shrink-0" />
                <input
                  id="teacher-phone-only"
                  type="tel"
                  dir="ltr"
                  autoComplete="off"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMsg(null);
                    setShowRegisterShortcut(false);
                  }}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-transparent text-base sm:text-lg font-mono font-bold text-[#0a4d2e] placeholder:text-slate-400 text-left focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border-2 border-[#c9a227] font-extrabold text-base shadow-lg cursor-pointer transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? 'جاري التحقق والدخول...' : 'دخول لوحة تحكم المدرس'}
            </button>
          </form>

          {/* First-Time Registration Button */}
          <div className="pt-4 border-t border-[#c9a227]/40 text-center space-y-2">
            <p className="text-xs font-bold text-slate-600">أول مرة تدخل كمدرس في الأكاديمية؟</p>
            <button
              type="button"
              onClick={() => onOpenFirstTimeRegister(phone.trim())}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>تسجيل بيانات المدرس (لأول مرة فقط)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
