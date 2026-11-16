import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Phone,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { OFFICIAL_LIVE_URL } from '../firebase/config';

interface GoogleLoginScreenProps {
  requiresGoogleLink: boolean;
  onGoogleLink: () => void;
  onPhoneLogin: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onCreateAccount: (
    fullName: string,
    phone: string,
    password: string,
    role: 'teacher' | 'admin'
  ) => Promise<{ ok: boolean; error?: string }>;
  onResetPassword: (
    phone: string,
    googleEmail: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onOpenTeacherRegister?: () => void;
  initialNotice?: string | null;
  initialPhone?: string;
  linkedGoogleEmail?: string;
  isLoading: boolean;
  errorMessage: string | null;
  isTemporaryHost?: boolean;
  logoUrl?: string;
  onBack?: () => void;
}

type AuthSubView = 'login' | 'register' | 'forgot';

const IslamicCornerPattern: React.FC<{
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ position }) => {
  const posClasses: Record<typeof position, string> = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0 -scale-x-100',
    'bottom-right': 'bottom-0 right-0 -scale-y-100',
    'bottom-left': 'bottom-0 left-0 -scale-x-100 -scale-y-100',
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 220"
      className={`pointer-events-none select-none absolute w-40 h-40 sm:w-44 sm:h-44 opacity-[0.12] text-[#D4AF37] ${posClasses[position]}`}
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        {/* Main octagonal corner star */}
        <path
          d="M172 16 L186 48 L218 62 L186 76 L172 108 L158 76 L126 62 L158 48 Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <rect x="148" y="38" width="48" height="48" transform="rotate(45 172 62)" />
        {/* Secondary interlaced corner arabesques */}
        <path d="M98 14 L110 38 L134 50 L110 62 L98 86 L86 62 L62 50 L86 38 Z" />
        <path d="M180 112 L192 136 L216 148 L192 160 L180 184 L168 160 L144 148 L168 136 Z" />
        <path d="M220 0 Q140 20 110 110 Q190 140 220 210" strokeWidth="2" opacity="0.65" />
      </g>
    </svg>
  );
};

const GoogleColorIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  requiresGoogleLink,
  onGoogleLink,
  onPhoneLogin,
  onCreateAccount,
  onResetPassword,
  onOpenTeacherRegister,
  initialNotice = null,
  initialPhone = '',
  linkedGoogleEmail,
  isLoading,
  errorMessage,
  isTemporaryHost = false,
  logoUrl = '',
  onBack,
}) => {
  const [subView, setSubView] = useState<AuthSubView>('login');

  // Login Form State (always empty when screen opens unless redirected with existing phone)
  const [phone, setPhone] = useState(initialPhone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form State (fallback/admin account registration)
  const [regRole, setRegRole] = useState<'teacher' | 'admin'>('admin');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password Form State
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(initialNotice);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPhone(initialPhone || '');
    setPassword('');
    setShowPassword(false);
    setFormSuccess(initialNotice || null);
  }, [initialPhone, initialNotice]);

  const switchView = (next: AuthSubView) => {
    setFormError(null);
    setFormSuccess(null);
    setSubView(next);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!phone.trim() || !password) {
      setFormError('يرجى إدخال رقم الهاتف وكلمة المرور.');
      return;
    }
    setSubmitting(true);
    const res = await onPhoneLogin(phone, password);
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'بيانات الدخول غير صحيحة.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!regName.trim() || !regPhone.trim() || !regPassword) {
      setFormError('يرجى إكمال جميع البيانات المطلوبة.');
      return;
    }
    if (regPassword.length < 6) {
      setFormError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setFormError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setSubmitting(true);
    const res = await onCreateAccount(regName.trim(), regPhone.trim(), regPassword, regRole);
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'تعذر إنشاء الحساب.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!forgotPhone.trim() || !forgotEmail.trim() || !forgotNewPassword) {
      setFormError('يرجى إدخال رقم الهاتف والبريد الإلكتروني المرتبط وكلمة المرور الجديدة.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setFormError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    setSubmitting(true);
    const res = await onResetPassword(
      forgotPhone.trim(),
      forgotEmail.trim(),
      forgotNewPassword
    );
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'تعذر تحديث كلمة المرور.');
      return;
    }
    setFormSuccess('تم تحديث كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.');
    setPhone(forgotPhone.trim());
    setPassword('');
    setTimeout(() => switchView('login'), 1200);
  };

  return (
    <div
      dir="rtl"
      className="flex-1 w-full bg-[#06241B] flex items-center justify-center p-0 min-[440px]:p-3 overflow-x-hidden"
    >
      {/* Full-height vertical 9:16 mobile screen container with luxury emerald gradient */}
      <main
        style={{ background: 'linear-gradient(180deg, #0B3D2E 0%, #0E5A41 100%)' }}
        className="relative w-full min-h-[calc(100dvh-65px)] min-[440px]:w-auto min-[440px]:max-w-[94vw] min-[440px]:h-[min(88dvh,840px)] min-[440px]:min-h-[580px] min-[440px]:aspect-[9/16] text-white min-[440px]:rounded-[30px] min-[440px]:border min-[440px]:border-[#D4AF37]/30 min-[440px]:shadow-[0_26px_70px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col justify-between px-6 py-5 sm:px-8 sm:py-7"
      >
        {/* Subtle Transparent Gold Geometric Arabesque Corners */}
        <IslamicCornerPattern position="top-right" />
        <IslamicCornerPattern position="top-left" />
        <IslamicCornerPattern position="bottom-right" />
        <IslamicCornerPattern position="bottom-left" />

        {/* Back Button to Role Selection Screen */}
        {onBack && (
          <div className="relative z-20 flex justify-start -mb-4">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#07241B]/65 hover:bg-[#07241B] border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              <span>رجوع</span>
            </button>
          </div>
        )}

        {/* TOP: Dynamic Academy Logo with soft Golden Halo + White Title + Gold Subtitle */}
        <header className="relative z-10 flex flex-col items-center justify-center text-center pt-1">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 rounded-full bg-[#D4AF37]/30 blur-2xl pointer-events-none"
            />
            <div className="relative rounded-full shadow-[0_0_28px_rgba(212,175,55,0.42)]">
              <AcademyLogo logoUrl={logoUrl} size="2xl" showBorder={false} />
            </div>
          </div>

          <div className="mt-3.5 space-y-0.5">
            <h1 className="text-[30px] sm:text-[34px] leading-tight font-extrabold font-cairo text-white drop-shadow-sm">
              أكاديمية الفرقان
            </h1>
            <p className="text-[17px] sm:text-[19px] font-bold text-[#D4AF37]">
              الشيخ عبد المجيد مسعد
            </p>
          </div>
        </header>

        {/* SCREEN 1: FIRST LAUNCH ONLY — Google Account Linking */}
        {requiresGoogleLink ? (
          <div className="relative z-10 flex-1 flex flex-col justify-center space-y-5 py-6">
            {!isTemporaryHost && errorMessage && (
              <div
                role="alert"
                className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-2xl p-3.5 text-xs font-semibold text-right leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            {isTemporaryHost ? (
              <a
                href={OFFICIAL_LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 flex items-center justify-center gap-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-[#D4AF37]/60 font-extrabold text-base shadow-[0_8px_22px_rgba(0,0,0,0.25)] cursor-pointer transition active:scale-[0.99]"
              >
                <GoogleColorIcon />
                <span>المتابعة باستخدام جوجل</span>
                <ExternalLink className="w-4 h-4 text-[#0B3D2E] shrink-0" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onGoogleLink}
                disabled={isLoading}
                className="w-full h-14 flex items-center justify-center gap-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-[#D4AF37]/60 font-extrabold text-base shadow-[0_8px_22px_rgba(0,0,0,0.25)] cursor-pointer transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-[#0B3D2E]" />
                    <span>جاري المتابعة بحساب جوجل...</span>
                  </>
                ) : (
                  <>
                    <GoogleColorIcon />
                    <span>المتابعة باستخدام جوجل</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* SCREEN 2: PHONE + PASSWORD LOGIN / REGISTER / FORGOT PASSWORD */
          <div className="relative z-10 flex-1 flex flex-col justify-between pt-4">
            {subView === 'login' && (
              <form
                onSubmit={handleLoginSubmit}
                autoComplete="off"
                className="flex-1 flex flex-col justify-between gap-4"
              >
                {/* Middle Section: Light Gold Labels, Crisp White Inputs, Light Gold Forgot Link */}
                <div className="space-y-4 my-auto">
                  {formError && (
                    <div
                      role="alert"
                      className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-2xl p-3 text-xs font-bold text-right leading-relaxed"
                    >
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div
                      role="status"
                      className="bg-emerald-950/80 border border-[#D4AF37]/60 text-[#F3E5AB] rounded-2xl p-3 text-xs font-bold text-right leading-relaxed"
                    >
                      {formSuccess}
                    </div>
                  )}

                  {/* Phone Input */}
                  <div>
                    <label
                      htmlFor="login-phone"
                      className="block text-[15px] font-bold text-[#F3E5AB] mb-2 text-center"
                    >
                      رقم الهاتف
                    </label>
                    <div
                      dir="ltr"
                      className="w-full h-14 bg-white border border-white/80 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/40 rounded-[16px] px-4 flex items-center gap-3 shadow-md transition"
                    >
                      <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                      <input
                        id="login-phone"
                        name="furqan_phone_entry"
                        type="tel"
                        dir="ltr"
                        autoComplete="off"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 1xxxxxxxx"
                        className="w-full bg-transparent text-base sm:text-[17px] text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-[15px] font-bold text-[#F3E5AB] mb-2 text-center"
                    >
                      كلمة المرور
                    </label>
                    <div
                      dir="ltr"
                      className="w-full h-14 bg-white border border-white/80 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/40 rounded-[16px] pl-4 pr-1.5 flex items-center gap-3 shadow-md transition"
                    >
                      <Lock className="w-5 h-5 text-slate-500 shrink-0" />
                      <input
                        id="login-password"
                        name="furqan_pass_entry"
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-base sm:text-[17px] text-slate-900 placeholder:text-slate-400 text-left focus:outline-none tracking-wider"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-[#0B3D2E] cursor-pointer transition shrink-0"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Forgot Password in light gold */}
                    <div className="mt-1 flex justify-start">
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="min-h-[44px] px-1 inline-flex items-center text-[15px] font-bold text-[#F3E5AB] hover:text-[#D4AF37] transition cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA (#C9A227 Gold Button + Dark Green Text) & Create Account Link */}
                <div className="space-y-3 pb-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 rounded-[18px] bg-[#C9A227] hover:bg-[#D4AF37] text-[#0B3D2E] font-extrabold text-xl shadow-[0_8px_22px_rgba(0,0,0,0.28)] active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </button>

                  <div className="text-center pt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTeacherRegister ? onOpenTeacherRegister() : switchView('register')
                      }
                      className="min-h-[40px] px-3 inline-flex items-center justify-center text-[15px] font-extrabold text-[#F3E5AB] hover:text-[#D4AF37] underline underline-offset-4 cursor-pointer transition"
                    >
                      ليس لديك حساب؟ سجل كمدرس
                    </button>

                    <div className="flex items-center justify-center gap-3 text-[11px] text-[#F3E5AB]/80">
                      <button
                        type="button"
                        onClick={() => {
                          setPhone('');
                          setPassword('');
                          setFormError(null);
                          setFormSuccess(null);
                        }}
                        className="hover:text-[#D4AF37] cursor-pointer"
                      >
                        دخول بحساب تاني
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegRole('admin');
                          switchView('register');
                        }}
                        className="hover:text-[#D4AF37] cursor-pointer"
                      >
                        تسجيل حساب إدارة
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {subView === 'register' && (
              <form
                onSubmit={handleRegisterSubmit}
                autoComplete="off"
                className="flex-1 flex flex-col justify-between gap-3 overflow-y-auto pr-0.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-white">إنشاء حساب جديد</h2>
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="min-h-[44px] px-2 inline-flex items-center gap-1 text-xs font-bold text-[#F3E5AB] hover:underline cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>العودة للدخول</span>
                    </button>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-2xl p-3 text-xs font-bold text-right"
                    >
                      {formError}
                    </div>
                  )}

                  {/* Account Type Toggle: Teacher (default) vs Admin */}
                  <div>
                    <span className="block text-xs font-bold text-[#F3E5AB] mb-1.5 text-right">
                      نوع الحساب
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('teacher')}
                        className={`h-10 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          regRole === 'teacher'
                            ? 'bg-[#C9A227] text-[#0B3D2E] border-[#F3E5AB] shadow'
                            : 'bg-[#07241B]/70 text-[#F3E5AB] border-[#D4AF37]/30 hover:bg-[#07241B]'
                        }`}
                      >
                        👨‍🏫 معلم جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('admin')}
                        className={`h-10 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          regRole === 'admin'
                            ? 'bg-[#C9A227] text-[#0B3D2E] border-[#F3E5AB] shadow'
                            : 'bg-[#07241B]/70 text-[#F3E5AB] border-[#D4AF37]/30 hover:bg-[#07241B]'
                        }`}
                      >
                        🛡️ مدير الأكاديمية
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1 text-right">
                      الاسم الكامل
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl pr-10 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1 text-right">
                      رقم الهاتف
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        dir="ltr"
                        autoComplete="off"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+20 1xxxxxxxx"
                        className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1 text-right">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        dir="ltr"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((p) => !p)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-[#0B3D2E] cursor-pointer"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1 text-right">
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        dir="ltr"
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-[18px] bg-[#C9A227] hover:bg-[#D4AF37] text-[#0B3D2E] font-extrabold text-base shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                </button>
              </form>
            )}

            {subView === 'forgot' && (
              <form
                onSubmit={handleResetSubmit}
                autoComplete="off"
                className="flex-1 flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-white">استعادة كلمة المرور</h2>
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="min-h-[44px] px-2 inline-flex items-center gap-1 text-xs font-bold text-[#F3E5AB] hover:underline cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>العودة للدخول</span>
                    </button>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-2xl p-3 text-xs font-bold text-right"
                    >
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div
                      role="status"
                      className="bg-emerald-950/80 border border-[#D4AF37]/60 text-[#F3E5AB] rounded-2xl p-3 text-xs font-bold text-right"
                    >
                      {formSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1.5 text-right">
                      رقم الهاتف المسجل
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      autoComplete="off"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="+20 1xxxxxxxx"
                      className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl px-4 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1.5 text-right">
                      بريد جوجل المرتبط بالحساب
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      autoComplete="off"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder={linkedGoogleEmail || 'example@gmail.com'}
                      className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl px-4 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#F3E5AB] mb-1.5 text-right">
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotPassword ? 'text' : 'password'}
                        dir="ltr"
                        autoComplete="new-password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="w-full h-12 bg-white border border-white/80 focus:border-[#D4AF37] rounded-2xl pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword((p) => !p)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-[#0B3D2E] cursor-pointer"
                      >
                        {showForgotPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-[18px] bg-[#C9A227] hover:bg-[#D4AF37] text-[#0B3D2E] font-extrabold text-base shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'جاري التحديث...' : 'حفظ كلمة المرور الجديدة'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
