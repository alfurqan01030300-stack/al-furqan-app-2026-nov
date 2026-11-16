import React from 'react';
import { RefreshCw } from 'lucide-react';

interface FooterWhatsAppProps {
  managerWhatsApp: string;
  academyName: string;
  onOpenInstallModal: () => void;
  isInstalled?: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
  currentVersion?: string;
  onUpdateApp?: () => void;
  isUpdating?: boolean;
  hasUpdateAvailable?: boolean;
}

const ACADEMY_DIRECT_WHATSAPP_NUMBER = '201030300862';
const ACADEMY_DIRECT_WHATSAPP_MESSAGE =
  'السلام عليكم ورحمة الله وبركاته، أتواصل مع إدارة أكاديمية الفرقان العالمية لتحفيظ القرآن الكريم';

export const FooterWhatsApp: React.FC<FooterWhatsAppProps> = ({
  currentVersion = '2.0',
  onUpdateApp,
  isUpdating = false,
  hasUpdateAvailable = false,
}) => {
  const defaultMessage = encodeURIComponent(ACADEMY_DIRECT_WHATSAPP_MESSAGE);
  const whatsappUrl = `https://wa.me/${ACADEMY_DIRECT_WHATSAPP_NUMBER}?text=${defaultMessage}`;

  return (
    <footer className="no-print sticky bottom-0 z-30 w-full bg-[#07241B]/95 backdrop-blur-md border-t border-[#D4AF37]/35 py-2 px-3 sm:px-5 shadow-[0_-4px_20px_rgba(0,0,0,0.55)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Version Badge & "تحديث التطبيق" Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <span
            dir="rtl"
            className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#0B3D2E] border border-[#c9a227]/45 text-xs font-extrabold text-[#F3E5AB] shadow-sm"
          >
            الإصدار {currentVersion}
          </span>

          {onUpdateApp && (
            <button
              type="button"
              onClick={onUpdateApp}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 disabled:opacity-70 shadow-sm ${
                hasUpdateAvailable
                  ? 'gold-gradient-btn text-[#07241B] border border-white/60 animate-pulse'
                  : 'bg-[#0a4d2e] hover:bg-[#145A43] text-[#fffdf5] border border-[#c9a227]/60'
              }`}
              title="مسح النسخة القديمة وتحديث التطبيق لآخر إصدار"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  hasUpdateAvailable ? 'text-[#07241B]' : 'text-[#c9a227]'
                } ${isUpdating ? 'animate-spin' : ''}`}
              />
              <span>{isUpdating ? 'جاري التحديث...' : 'تحديث التطبيق'}</span>
            </button>
          )}
        </div>

        {/* Circular Green WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل واتساب مع مدير الأكاديمية"
          title="تواصل واتساب"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(37,211,102,0.45)] transition transform active:scale-95"
        >
          <svg
            viewBox="0 0 32 32"
            className="w-6 h-6 fill-white"
            aria-hidden="true"
          >
            <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16.004c0 2.353.615 4.651 1.784 6.678L2.667 29.333l6.817-1.788a13.28 13.28 0 0 0 6.52 1.712h.005c7.362 0 13.336-5.973 13.336-13.336 0-3.562-1.387-6.91-3.905-9.429a13.248 13.248 0 0 0-9.436-3.825Zm0 24.342h-.004a11.06 11.06 0 0 1-5.636-1.544l-.404-.24-4.045 1.061 1.08-3.944-.264-.42a11.04 11.04 0 0 1-1.693-5.918c0-6.103 4.966-11.069 11.07-11.069 2.956 0 5.735 1.153 7.826 3.245a10.999 10.999 0 0 1 3.237 7.828c0 6.104-4.966 11.001-11.167 11.001Zm6.073-8.293c-.333-.167-1.97-.972-2.275-1.083-.305-.111-.527-.167-.749.167-.222.333-.86 1.083-1.054 1.305-.194.222-.389.25-.722.083-.333-.167-1.406-.518-2.678-1.652-.99-.883-1.659-1.973-1.853-2.306-.194-.333-.02-.513.146-.679.15-.15.333-.389.5-.583.166-.194.222-.333.333-.555.111-.222.055-.417-.028-.583-.083-.167-.749-1.805-1.027-2.471-.27-.649-.545-.561-.749-.571l-.638-.011c-.222 0-.583.083-.888.417-.305.333-1.166 1.138-1.166 2.776s1.193 3.22 1.36 3.442c.166.222 2.349 3.588 5.691 5.031.795.343 1.416.548 1.9.701.798.254 1.525.218 2.099.132.64-.096 1.97-.805 2.248-1.582.278-.777.278-1.443.194-1.582-.083-.139-.305-.222-.638-.389Z" />
          </svg>
        </a>
      </div>
    </footer>
  );
};
