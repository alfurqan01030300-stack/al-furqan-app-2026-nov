import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Monitor,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { PlatformType } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  academyName: string;
  isInstalled: boolean;
  isInstallable: boolean;
  platform: PlatformType;
  isInAppBrowser: boolean;
  onTriggerNativeInstall: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  academyName,
  isInstalled,
  isInstallable,
  platform,
  isInAppBrowser,
  onTriggerNativeInstall,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isEmbeddedFrame =
    typeof window !== 'undefined' && (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  const handleCopyUrl = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto font-cairo"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0B3D2E] border-2 border-[#c9a227] text-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#07241B] border-b border-[#c9a227]/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#c9a227]/20 border border-[#c9a227]/60 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-[#F3E5AB]" />
            </div>
            <div className="min-w-0">
              <h2
                id="pwa-install-modal-title"
                className="text-base sm:text-lg font-extrabold text-[#fffdf5] truncate"
              >
                تثبيت تطبيق {academyName}
              </h2>
              <p className="text-xs text-[#e5c76b]">
                تثبيت كتطبيق مستقل على الشاشة الرئيسية (PWA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isInstalled ? (
            <div className="rounded-2xl bg-emerald-950/80 border border-emerald-400/50 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-extrabold text-emerald-200">التطبيق مثبّت بالفعل على جهازك</p>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  يمكنك تشغيله مباشرة من أيقونة الشاشة الرئيسية بوضع ملء الشاشة.
                </p>
              </div>
            </div>
          ) : (
            <>
              {isInstallable && (
                <button
                  type="button"
                  onClick={onTriggerNativeInstall}
                  className="w-full py-3.5 px-5 rounded-2xl gold-gradient-btn text-[#07241B] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" />
                  <span>اضغط هنا لفتح نافذة التثبيت التلقائي</span>
                </button>
              )}

              {isInAppBrowser && (
                <div className="rounded-2xl bg-amber-950/75 border border-amber-400/60 p-3.5 text-xs text-amber-100 leading-relaxed space-y-1.5">
                  <p className="font-extrabold text-amber-200 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>المتصفح الداخلي (مثل واتساب) لا يدعم التثبيت مباشرة</span>
                  </p>
                  <p>
                    اضغط على النقاط الثلاث بالأعلى (<strong>⋮</strong>) واختر{' '}
                    <strong>«فتح في Chrome»</strong> أو <strong>«فتح في Safari»</strong> ثم نفّذ خطوات التثبيت أدناه.
                  </p>
                </div>
              )}

              {isEmbeddedFrame && (
                <div className="rounded-2xl bg-[#07241B]/90 border border-[#c9a227]/45 p-3.5 text-xs text-[#F3E5AB] leading-relaxed space-y-2">
                  <p className="font-bold">
                    ملاحظة: إذا كنت تتصفح من داخل نافذة المعاينة، قد يمنع المتصفح نافذة التثبيت التلقائية. افتح الرابط في تبويب متصفح مستقل للتثبيت بضغطة واحدة.
                  </p>
                  {currentUrl && (
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a4d2e] hover:bg-[#145A43] border border-[#c9a227]/60 text-[#fffdf5] font-bold cursor-pointer transition"
                    >
                      {copiedUrl ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم نسخ رابط التطبيق</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#c9a227]" />
                          <span>نسخ رابط التطبيق لفتحه في المتصفح</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Instructions */}
              <div
                className={`rounded-2xl p-4 border space-y-3 ${
                  platform === 'android' || platform === 'ios'
                    ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227]'
                    : 'bg-[#07241B]/70 text-slate-100 border-[#c9a227]/35'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <Smartphone
                    className={`w-5 h-5 shrink-0 ${
                      platform === 'android' || platform === 'ios'
                        ? 'text-[#0a4d2e]'
                        : 'text-[#c9a227]'
                    }`}
                  />
                  <span>التثبيت على الموبايل (أندرويد وآيفون)</span>
                </div>

                {/* Android Steps */}
                <div className="space-y-1.5 text-xs leading-relaxed">
                  <p className="font-extrabold">
                    • هواتف أندرويد (متصفح Chrome أو Edge):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pr-1 font-semibold">
                    <li>
                      اضغط على قائمة النقاط الثلاث (<strong>⋮</strong>) في أعلى يمين أو يسار المتصفح.
                    </li>
                    <li>
                      اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو{' '}
                      <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.
                    </li>
                    <li>
                      اضغط <strong>«تثبيت»</strong> ليظهر التطبيق ضمن تطبيقات الموبايل.
                    </li>
                  </ol>
                </div>

                {/* iOS Steps */}
                <div
                  className={`pt-2.5 border-t space-y-1.5 text-xs leading-relaxed ${
                    platform === 'android' || platform === 'ios'
                      ? 'border-[#c9a227]/35'
                      : 'border-white/10'
                  }`}
                >
                  <p className="font-extrabold flex items-center gap-1.5">
                    <span>• أجهزة آيفون وآيباد (متصفح Safari):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pr-1 font-semibold">
                    <li className="flex items-center gap-1 flex-wrap">
                      <span>1. اضغط على زر</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#c9a227]/20 font-bold">
                        <Share className="w-3.5 h-3.5" />
                        المشاركة (Share)
                      </span>
                      <span>في شريط Safari بالأسفل.</span>
                    </li>
                    <li>
                      2. مرّر للأسفل واختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.
                    </li>
                    <li>
                      3. اضغط <strong>«إضافة» (Add)</strong> من الأعلى.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Desktop Instructions */}
              <div
                className={`rounded-2xl p-4 border space-y-2.5 ${
                  platform === 'desktop'
                    ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227]'
                    : 'bg-[#07241B]/70 text-slate-100 border-[#c9a227]/35'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  <Monitor
                    className={`w-5 h-5 shrink-0 ${
                      platform === 'desktop' ? 'text-[#0a4d2e]' : 'text-[#c9a227]'
                    }`}
                  />
                  <span>التثبيت على الكمبيوتر (Chrome / Edge)</span>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-xs leading-relaxed font-semibold pr-1">
                  <li>
                    اضغط على أيقونة التثبيت (<strong>⊕</strong> أو شاشة بسهم لأسفل) داخل شريط عنوان الموقع بالأعلى.
                  </li>
                  <li>
                    أو افتح قائمة المتصفح (<strong>⋮</strong> أو <strong>⋯</strong>) ثم اختر{' '}
                    <strong>«التطبيقات» / «حفظ ومشاركة» ← «تثبيت التطبيق»</strong>.
                  </li>
                  <li>
                    اضغط <strong>«تثبيت» (Install)</strong> ليفتح التطبيق في نافذة مستقلة وعلى سطح المكتب.
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#07241B] border-t border-[#c9a227]/35 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] text-xs sm:text-sm font-extrabold cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
