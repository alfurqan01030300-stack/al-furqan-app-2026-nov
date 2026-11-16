import React from 'react';
import { Shield, GraduationCap, Users, Download, BookOpen } from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { FooterWhatsApp } from './FooterWhatsApp';

interface WelcomeChoiceScreenProps {
  logoUrl?: string;
  academyName: string;
  managerWhatsApp: string;
  onSelectStudent: () => void;
  onSelectTeacher: () => void;
  onSelectParent: () => void;
  onSelectAdmin: () => void;
  onOpenInstallModal: () => void;
  isInstalled?: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
  currentVersion?: string;
  onUpdateApp?: () => void;
  isUpdating?: boolean;
  hasUpdateAvailable?: boolean;
}

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
      className={`pointer-events-none select-none absolute w-40 h-40 sm:w-48 sm:h-48 opacity-[0.12] text-[#c9a227] ${posClasses[position]}`}
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path
          d="M172 16 L186 48 L218 62 L186 76 L172 108 L158 76 L126 62 L158 48 Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <rect x="148" y="38" width="48" height="48" transform="rotate(45 172 62)" />
        <path d="M98 14 L110 38 L134 50 L110 62 L98 86 L86 62 L62 50 L86 38 Z" />
        <path d="M180 112 L192 136 L216 148 L192 160 L180 184 L168 160 L144 148 L168 136 Z" />
        <path d="M220 0 Q140 20 110 110 Q190 140 220 210" strokeWidth="2" opacity="0.65" />
      </g>
    </svg>
  );
};

export const WelcomeChoiceScreen: React.FC<WelcomeChoiceScreenProps> = ({
  logoUrl = '',
  academyName,
  managerWhatsApp,
  onSelectStudent,
  onSelectTeacher,
  onSelectParent,
  onSelectAdmin,
  onOpenInstallModal,
  isInstalled,
  isIOS,
  isInAppBrowser,
  currentVersion,
  onUpdateApp,
  isUpdating,
  hasUpdateAvailable,
}) => {
  return (
    <div
      dir="rtl"
      className="min-h-dvh w-full furqan-shell-bg flex flex-col justify-between text-white relative overflow-hidden font-cairo"
    >
      {/* Subtle transparent Islamic corner ornaments */}
      <IslamicCornerPattern position="top-right" />
      <IslamicCornerPattern position="top-left" />
      <IslamicCornerPattern position="bottom-right" />
      <IslamicCornerPattern position="bottom-left" />

      {/* Main Centered Gateway Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 sm:space-y-8">
          {/* Top Brand: Dynamic Logo with Soft Golden Aura + Titles */}
          <header className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 scale-115 rounded-full bg-[#c9a227]/30 blur-2xl pointer-events-none"
              />
              <div className="relative rounded-full shadow-[0_0_30px_rgba(201,162,39,0.45)]">
                <AcademyLogo logoUrl={logoUrl} size="2xl" showBorder={false} />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo text-[#fffdf5] drop-shadow-sm">
                أكاديمية الفرقان العالمية لتحفيظ القرآن الكريم
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#e5c76b]">
                فضيلة الشيخ عبد المجيد مسعد
              </p>
            </div>
          </header>

          {/* 3 Main Accounts: Student, Teacher, Parent + Academy Manager */}
          <div className="w-full space-y-3">
            {/* 1. Student Account */}
            <button
              type="button"
              onClick={onSelectStudent}
              className="w-full min-h-[70px] px-6 py-3.5 rounded-2xl bg-[#fffdf5] hover:bg-[#fff7db] border-2 border-[#c9a227] text-[#0a4d2e] shadow-xl flex items-center justify-center gap-3.5 cursor-pointer transition transform active:scale-[0.98]"
            >
              <BookOpen className="w-7 h-7 text-[#0a4d2e] shrink-0" />
              <span className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
                حساب الطالب
              </span>
            </button>

            {/* 2. Teacher Account */}
            <button
              type="button"
              onClick={onSelectTeacher}
              className="w-full min-h-[70px] px-6 py-3.5 rounded-2xl bg-[#c9a227] hover:bg-[#d8b43c] border-2 border-[#fffdf5]/80 text-[#07241B] shadow-xl flex items-center justify-center gap-3.5 cursor-pointer transition transform active:scale-[0.98]"
            >
              <GraduationCap className="w-7 h-7 text-[#07241B] shrink-0" />
              <span className="text-xl sm:text-2xl font-extrabold text-[#07241B]">
                حساب المعلم
              </span>
            </button>

            {/* 3. Parent Account */}
            <button
              type="button"
              onClick={onSelectParent}
              className="w-full min-h-[70px] px-6 py-3.5 rounded-2xl bg-[#073923]/95 hover:bg-[#062E1C] border-2 border-[#c9a227] text-[#fffdf5] shadow-xl flex items-center justify-center gap-3.5 cursor-pointer transition transform active:scale-[0.98]"
            >
              <Users className="w-7 h-7 text-[#c9a227] shrink-0" />
              <span className="text-xl sm:text-2xl font-extrabold text-[#fffdf5]">
                حساب ولي الأمر
              </span>
            </button>

            {/* Academy Manager Entry */}
            <button
              type="button"
              onClick={onSelectAdmin}
              className="w-full min-h-[54px] px-5 py-2.5 rounded-2xl bg-[#07241B]/75 hover:bg-[#07241B] border border-[#c9a227]/55 text-[#F3E5AB] shadow flex items-center justify-center gap-2.5 cursor-pointer transition"
            >
              <Shield className="w-5 h-5 text-[#c9a227] shrink-0" />
              <span className="text-base font-extrabold text-[#F3E5AB]">
                مدير الأكاديمية فقط
              </span>
            </button>
          </div>

          {/* Single 1-Tap App Install Button */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="w-full py-3.5 px-5 rounded-2xl gold-gradient-btn text-[#07241B] border border-white/60 shadow-lg flex items-center justify-center gap-2.5 text-base font-extrabold cursor-pointer transition transform active:scale-[0.98]"
            >
              <Download className="w-5 h-5 text-[#07241B] shrink-0" />
              <span>تحميل التطبيق</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Clean Footer Bar */}
      <FooterWhatsApp
        managerWhatsApp={managerWhatsApp}
        academyName={academyName}
        onOpenInstallModal={onOpenInstallModal}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
        currentVersion={currentVersion}
        onUpdateApp={onUpdateApp}
        isUpdating={isUpdating}
        hasUpdateAvailable={hasUpdateAvailable}
      />
    </div>
  );
};
