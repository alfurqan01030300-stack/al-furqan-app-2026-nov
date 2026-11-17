import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Share2,
  Upload,
} from 'lucide-react';
import { AcademySettings } from '../types';
import { AcademyLogo } from './AcademyLogo';
import { resolvePreviewDescription, resolvePreviewTitle } from '../utils/seoMeta';

interface PreviewSettingsSectionProps {
  settings: AcademySettings;
  onSavePreviewSettings: (payload: {
    academyName: string;
    description: string;
    logoDataUrl: string;
  }) => Promise<void> | void;
}

function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف اللوجو.'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxSide = 512;
        const largest = Math.max(img.width, img.height);
        const scale = largest > maxSide ? maxSide / largest : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const pngUrl = canvas.toDataURL('image/png');
        resolve(pngUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const PreviewSettingsSection: React.FC<PreviewSettingsSectionProps> = ({
  settings,
  onSavePreviewSettings,
}) => {
  const [academyName, setAcademyName] = useState<string>(() => resolvePreviewTitle(settings));
  const [description, setDescription] = useState<string>(() => resolvePreviewDescription(settings));
  const [logoDataUrl, setLogoDataUrl] = useState<string>(settings.logoDataUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAcademyName(resolvePreviewTitle(settings));
    setDescription(resolvePreviewDescription(settings));
    setLogoDataUrl(settings.logoDataUrl || '');
  }, [settings.academyName, settings.previewDescription, settings.slogan, settings.logoDataUrl]);

  const handlePickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG أو JPG أو WebP).');
      return;
    }
    setErrorMsg(null);
    setSavedSuccess(false);
    try {
      const processed = await compressLogoImage(file);
      setLogoDataUrl(processed);
    } catch {
      setErrorMsg('تعذر قراءة الصورة المختارة، حاول صورة أخرى.');
    } finally {
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleResetLogo = () => {
    setLogoDataUrl('');
    setSavedSuccess(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = academyName.trim();
    const cleanDesc = description.trim();
    if (!cleanName) {
      setErrorMsg('يرجى إدخال اسم الأكاديمية.');
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await onSavePreviewSettings({
        academyName: cleanName,
        description: cleanDesc || resolvePreviewDescription({}),
        logoDataUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      setErrorMsg('حدث خطأ أثناء حفظ إعدادات المعاينة.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewHost =
    typeof window !== 'undefined' ? window.location.host : 'al-furqan-academy';
  const liveOgImageHref = `/api/og-image.png?v=${settings.previewUpdatedAt || 1}`;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex items-center gap-3 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0">
          <Share2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold font-amiri text-white">إعدادات المعاينة</h2>
          <p className="text-xs text-[#D4AF37]/85 leading-relaxed">
            التحكم المباشر في صورة اللوجو والعنوان والوصف الذي يظهر عند إرسال رابط الأكاديمية على واتساب وفيسبوك
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">
              تعديل بيانات المعاينة (Open Graph & Twitter Card)
            </h3>
          </div>

          {errorMsg && (
            <div className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-xl px-4 py-2.5 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* 1. رفع اللوجو */}
          <div className="bg-[#07241B]/80 p-5 rounded-2xl border border-[#D4AF37]/25 space-y-4">
            <label className="block text-sm font-bold text-[#F3E5AB]">
              صورة اللوجو (تظهر في معاينة الرابط 1200×630)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <AcademyLogo logoUrl={logoDataUrl} size="xl" />
                <span className="text-[11px] font-semibold text-[#D4AF37]">
                  {logoDataUrl ? 'اللوجو المرفوع حالياً' : 'الشعار الافتراضي الحالي'}
                </span>
              </div>

              <div className="flex-1 w-full space-y-3 text-center sm:text-right">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePickLogo}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow transition"
                  >
                    <Upload className="w-4 h-4 text-[#07241B]" />
                    <span>رفع اللوجو</span>
                  </button>

                  {logoDataUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>استخدام أيقونة التطبيق الافتراضية</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  أي لوجو ترفعه هنا يصبح هو الصورة الرسمية للأكاديمية وللمعاينة على واتساب وفيسبوك بمقاس 1200×630 تلقائياً.
                </p>
              </div>
            </div>
          </div>

          {/* 2. تعديل اسم الأكاديمية */}
          <div>
            <label className="block text-xs font-bold text-[#F3E5AB] mb-1.5">
              اسم الأكاديمية (og:title / twitter:title) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={academyName}
              onChange={(e) => {
                setAcademyName(e.target.value);
                setSavedSuccess(false);
              }}
              placeholder="مثال: أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم"
              className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* 3. تعديل الوصف */}
          <div>
            <label className="block text-xs font-bold text-[#F3E5AB] mb-1.5">
              وصف الأكاديمية (og:description / twitter:description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSavedSuccess(false);
              }}
              placeholder="اكتب الوصف الذي سيظهر تحت الاسم عند مشاركة الرابط..."
              className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-y"
            />
          </div>

          {/* 4. زرار حفظ */}
          <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-300">
              يتم تحديث المعاينة في الموقع فوراً بدون المساس بأي بيانات قديمة.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="gold-gradient-btn px-6 py-3 rounded-xl text-sm font-extrabold flex items-center gap-2 shadow-lg cursor-pointer transition disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#07241B]" />
                  <span>تم حفظ إعدادات المعاينة بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#07241B]" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات المعاينة'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live WhatsApp & Facebook Card Preview */}
        <div className="lg:col-span-5 bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Globe className="w-5 h-5" />
              <h3 className="text-base font-bold font-amiri text-white">
                معاينة شكل الرابط على واتساب وفيسبوك
              </h3>
            </div>
            <a
              href={liveOgImageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#F3E5AB] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>الصورة الحية</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Simulated Share Card matching current settings (1200x630 aspect ~ 1.91:1) */}
          <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/40 bg-[#07241B] shadow-2xl">
            <div
              className="w-full aspect-[1200/630] flex items-center justify-center p-4 relative"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #145A43 0%, #0B3D2E 60%, #062219 100%)',
              }}
            >
              <div className="absolute inset-3 rounded-xl border border-[#D4AF37]/60 pointer-events-none" />
              <AcademyLogo logoUrl={logoDataUrl} size="2xl" />
            </div>

            <div className="p-4 space-y-1.5 bg-[#062219] border-t border-[#D4AF37]/25">
              <p className="text-[11px] text-[#D4AF37] font-mono truncate" dir="ltr">
                {previewHost}
              </p>
              <h4 className="text-sm sm:text-base font-extrabold text-white line-clamp-2">
                {academyName.trim() || resolvePreviewTitle({})}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {description.trim() || resolvePreviewDescription({})}
              </p>
            </div>
          </div>

          <div className="bg-[#07241B]/80 border border-[#D4AF37]/20 rounded-2xl p-3.5 text-[11px] text-slate-300 space-y-1 leading-relaxed">
            <p className="font-bold text-[#F3E5AB]">وسوم المعاينة المفعلة تلقائياً:</p>
            <p dir="ltr" className="font-mono text-[10px] text-emerald-300 break-all">
              og:type="website" • og:image:width="1200" • og:image:height="630" • twitter:card="summary_large_image"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
