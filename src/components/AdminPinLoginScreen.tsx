import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Shield } from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';

interface AdminPinLoginScreenProps {
  logoUrl?: string;
  isPinConfigured: boolean;
  onVerifyPin: (pin: string) => { ok: boolean; error?: string };
  onSaveNewPinAndLogin: (newPin: string) => { ok: boolean; error?: string };
  onBack: () => void;
}

type AdminPinMode = 'create_first_time' | 'login' | 'reset';

export const AdminPinLoginScreen: React.FC<AdminPinLoginScreenProps> = ({
  logoUrl = '',
  isPinConfigured,
  onVerifyPin,
  onSaveNewPinAndLogin,
  onBack,
}) => {
  const [mode, setMode] = useState<AdminPinMode>(
    isPinConfigured ? 'login' : 'create_first_time'
  );
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!pin.trim()) {
      setErrorMsg('يرجى إدخال الرقم السري الخاص بمدير الأكاديمية.');
      return;
    }
    const res = onVerifyPin(pin.trim());
    if (!res.ok) {
      setErrorMsg(res.error || 'الرقم السري غير صحيح.');
    }
  };

  const handleSaveNewPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = pin.trim();
    if (cleaned.length < 4) {
      setErrorMsg('الرقم السري يجب أن يكون 4 أرقام أو أحرف على الأقل.');
      return;
    }
    const res = onSaveNewPinAndLogin(cleaned);
    if (!res.ok) {
      setErrorMsg(res.error || 'تعذر حفظ الرقم السري. حاول مرة أخرى.');
    }
  };

  const switchMode = (nextMode: AdminPinMode) => {
    setMode(nextMode);
    setPin('');
    setErrorMsg(null);
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

        <div className="furqan-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2.5 pb-4 border-b border-[#c9a227]/45">
            <div className="relative">
              <AcademyLogo logoUrl={logoUrl} size="xl" />
              <span className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-[#0a4d2e] border-2 border-[#c9a227] text-[#c9a227] flex items-center justify-center shadow">
                {mode === 'login' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
                {mode === 'create_first_time'
                  ? 'إنشاء رقم سري للمدير أول مرة'
                  : mode === 'reset'
                  ? 'تغيير الرقم السري للمدير'
                  : 'دخول مدير الأكاديمية'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {mode === 'create_first_time'
                  ? 'اكتب الرقم السري الذي تريده واحفظه للدخول مباشرة إلى لوحة التحكم'
                  : mode === 'reset'
                  ? 'اكتب رقماً سرياً جديداً للمدير وسيتم حفظه والدخول فوراً'
                  : 'أدخل الرقم السري للدخول إلى لوحة تحكم الأكاديمية'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="bg-red-50 border-2 border-red-400 text-red-900 rounded-2xl p-3 text-xs font-extrabold text-center"
            >
              {errorMsg}
            </div>
          )}

          {/* Mode 1 & Mode 3: Create First-Time PIN OR Reset Forgot PIN */}
          {(mode === 'create_first_time' || mode === 'reset') && (
            <form onSubmit={handleSaveNewPinSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label
                  htmlFor="admin-new-pin-input"
                  className="block text-xs sm:text-sm font-extrabold text-[#0a4d2e] mb-2 text-center"
                >
                  {mode === 'create_first_time'
                    ? 'اكتب الرقم السري الجديد (4 أرقام على الأقل)'
                    : 'الرقم السري الجديد للمدير'}
                </label>
                <div
                  dir="ltr"
                  className="w-full h-14 bg-white border-2 border-[#c9a227] focus-within:border-[#0a4d2e] rounded-2xl pl-4 pr-1.5 flex items-center gap-3 shadow-xs transition"
                >
                  <KeyRound className="w-5 h-5 text-[#9a7510] shrink-0" />
                  <input
                    id="admin-new-pin-input"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="مثال: 1234"
                    className="w-full bg-transparent text-xl font-black tracking-[0.25em] text-[#0a4d2e] placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm text-center focus:outline-none tabular-nums"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((p) => !p)}
                    aria-label={showPin ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-[#0a4d2e] cursor-pointer shrink-0"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-2xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-base sm:text-lg shadow-lg cursor-pointer transition active:scale-[0.98]"
              >
                حفظ ودخول لوحة التحكم
              </button>

              {mode === 'create_first_time' && (
                <div className="pt-2 space-y-2 text-center border-t border-[#c9a227]/35">
                  <button
                    type="button"
                    onClick={() => onVerifyPin('1234')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
                  >
                    الدخول مباشرة بالرقم الافتراضي (1234)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-bold text-[#0a4d2e] hover:text-[#9a7510] underline cursor-pointer"
                  >
                    لديك رقم سري مسبقاً؟ دخول برقمك
                  </button>
                </div>
              )}

              {mode === 'reset' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-bold text-[#0a4d2e] hover:text-[#9a7510] underline cursor-pointer"
                  >
                    العودة لشاشة الدخول
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Mode 2: Normal Returning Login */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label
                  htmlFor="admin-pin-input"
                  className="block text-xs sm:text-sm font-extrabold text-[#0a4d2e] mb-2 text-center"
                >
                  الرقم السري الخاص بالمدير
                </label>
                <div
                  dir="ltr"
                  className="w-full h-14 bg-white border-2 border-[#c9a227] focus-within:border-[#0a4d2e] rounded-2xl pl-4 pr-1.5 flex items-center gap-3 shadow-xs transition"
                >
                  <Lock className="w-5 h-5 text-[#9a7510] shrink-0" />
                  <input
                    id="admin-pin-input"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-transparent text-xl font-black tracking-[0.35em] text-[#0a4d2e] placeholder:text-slate-300 text-center focus:outline-none tabular-nums"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((p) => !p)}
                    aria-label={showPin ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-[#0a4d2e] cursor-pointer shrink-0"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!isPinConfigured && (
                  <p className="text-[11px] text-slate-600 text-center mt-2">
                    الرقم الافتراضي <strong className="font-mono text-[#0a4d2e]">1234</strong> يعمل تلقائياً
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-2xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border-2 border-[#c9a227] font-extrabold text-base sm:text-lg shadow-lg cursor-pointer transition active:scale-[0.98]"
              >
                دخول لوحة تحكم المدير
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-xs font-extrabold text-[#9a7510] hover:text-[#0a4d2e] underline cursor-pointer py-1 px-2"
                >
                  نسيت الرقم السري؟
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
