import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Check,
  MessageSquare,
  Building,
  Phone,
  Sparkles,
  Download,
  UploadCloud,
  RefreshCw,
  Smartphone,
  Database,
  Wallet,
  LogOut,
  Trash2,
  KeyRound,
  Share2,
} from 'lucide-react';
import { AcademySettings, LinkedGoogleAccount } from '../types';
import { AcademyLogo } from './AcademyLogo';
import { cleanWhatsAppNumber } from '../utils/storage';
import { syncAppIcon } from '../utils/pwa';
import { DownloadState } from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';
import { UpdateStatus } from '../hooks/useAppUpdater';

interface SettingsSectionProps {
  settings: AcademySettings;
  onSaveSettings: (settings: AcademySettings) => void;
  loginBannerUrl?: string;
  onSaveLoginBanner?: (
    url: string
  ) => Promise<{ publicSaved: boolean; permissionDenied: boolean } | void>;
  onResetData: () => void;
  onExportData: () => void;
  exportDownloadState?: DownloadState;
  onImportData: (jsonStr: string) => void;
  onOpenInstallModal: () => void;
  firestoreStatus?: 'connected' | 'connecting' | 'offline';
  firebaseConnected?: boolean;
  onSyncFirestore?: () => void;
  onOpenFirebaseStatus?: () => void;
  onOpenTrashBin?: () => void;
  trashCount?: number;
  onCheckUpdate?: () => void;
  hasUpdateAvailable?: boolean;
  updateStatus?: UpdateStatus;
  updateMessage?: string;
  currentVersion?: string;
  userEmail?: string | null;
  linkedGoogle?: LinkedGoogleAccount | null;
  onSignOut?: () => void;
  onOpenPreviewSettings?: () => void;
}

function compressBannerImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxWidth = 1000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
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
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  onSaveSettings,
  loginBannerUrl = '',
  onSaveLoginBanner,
  onResetData,
  onExportData,
  exportDownloadState,
  onImportData,
  onOpenInstallModal,
  firestoreStatus = 'connected',
  firebaseConnected = false,
  onSyncFirestore,
  onOpenFirebaseStatus,
  onOpenTrashBin,
  trashCount = 0,
  onCheckUpdate,
  hasUpdateAvailable = false,
  updateStatus = 'idle',
  updateMessage = '',
  currentVersion = '1.0.0',
  userEmail,
  linkedGoogle,
  onSignOut,
  onOpenPreviewSettings,
}) => {
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [logoDataUrl, setLogoDataUrl] = useState(settings.logoDataUrl || '');
  const [managerWhatsApp, setManagerWhatsApp] = useState(settings.managerWhatsApp);
  const [slogan, setSlogan] = useState(settings.slogan || '');
  const [previewDescription, setPreviewDescription] = useState(
    settings.previewDescription || settings.slogan || ''
  );
  const [currency, setCurrency] = useState(settings.currency || 'ر.س');
  const [defaultSessionRate, setDefaultSessionRate] = useState<number>(
    settings.defaultSessionRate ?? 40
  );
  const [defaultSubscriptionAmount, setDefaultSubscriptionAmount] = useState<number>(
    settings.defaultSubscriptionAmount ?? 250
  );
  const [managerPin, setManagerPin] = useState<string>(settings.managerPin || '1234');
  const [pinSavedSuccess, setPinSavedSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [iconSyncSuccess, setIconSyncSuccess] = useState(false);

  // Login Banner Image state
  const currentSavedBanner = loginBannerUrl || settings.loginBannerUrl || '';
  const [draftLoginBanner, setDraftLoginBanner] = useState<string>(currentSavedBanner);
  const [bannerDirty, setBannerDirty] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSavedSuccess, setBannerSavedSuccess] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!bannerDirty) {
      setDraftLoginBanner(loginBannerUrl || settings.loginBannerUrl || '');
    }
  }, [loginBannerUrl, settings.loginBannerUrl, bannerDirty]);

  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBannerNotice('يرجى اختيار ملف صورة صالح.');
      return;
    }
    try {
      const compressed = await compressBannerImage(file);
      setDraftLoginBanner(compressed);
      setBannerDirty(true);
      setBannerSavedSuccess(false);
      setBannerNotice(null);
    } catch {
      setBannerNotice('تعذر قراءة الصورة المختارة.');
    } finally {
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  const handleBannerRemove = () => {
    setDraftLoginBanner('');
    setBannerDirty(true);
    setBannerSavedSuccess(false);
    setBannerNotice(null);
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
  };

  const handleBannerSave = async () => {
    if (!onSaveLoginBanner) return;
    setBannerSaving(true);
    setBannerNotice(null);
    try {
      const result = await onSaveLoginBanner(draftLoginBanner);
      setBannerDirty(false);
      setBannerSavedSuccess(true);
      if (result && result.permissionDenied) {
        setBannerNotice(
          'تم حفظ الصورة في حسابك، ولإظهارها لجميع الزوار قبل الدخول تأكد من السماح بالقراءة لمسار publicConfig في قواعد Firestore.'
        );
      }
      setTimeout(() => setBannerSavedSuccess(false), 3000);
    } catch {
      setBannerNotice('حدث خطأ أثناء حفظ الصورة، حاول مرة أخرى.');
    } finally {
      setBannerSaving(false);
    }
  };

  useEffect(() => {
    setAcademyName(settings.academyName);
    setSlogan(settings.slogan || '');
    setPreviewDescription(settings.previewDescription || settings.slogan || '');
    setLogoDataUrl(settings.logoDataUrl || '');
  }, [settings.academyName, settings.slogan, settings.previewDescription, settings.logoDataUrl]);

  useEffect(() => {
    if (settings.managerPin) {
      setManagerPin(settings.managerPin);
    }
  }, [settings.managerPin]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    try {
      const compressed = await compressLogoImage(file);
      setLogoDataUrl(compressed);
      syncAppIcon(compressed);
      onSaveSettings({
        ...settings,
        logoDataUrl: compressed,
        previewUpdatedAt: Date.now(),
      });
    } catch {
      // ignore read failure
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetLogo = () => {
    setLogoDataUrl('');
    syncAppIcon('');
    onSaveSettings({
      ...settings,
      logoDataUrl: '',
      previewUpdatedAt: Date.now(),
    });
  };

  const handleSavePinOnly = () => {
    setPinError(null);
    const cleaned = managerPin.trim();
    if (cleaned.length < 4) {
      setPinError('الرقم السري يجب أن يكون 4 أرقام أو أحرف على الأقل.');
      return;
    }
    onSaveSettings({
      ...settings,
      managerPin: cleaned,
      managerPinConfigured: true,
    });
    setPinSavedSuccess(true);
    setTimeout(() => setPinSavedSuccess(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPin = managerPin.trim().length >= 4 ? managerPin.trim() : settings.managerPin || '1234';
    const cleanedDesc = previewDescription.trim() || slogan.trim();
    const updated: AcademySettings = {
      ...settings,
      academyName: academyName.trim() || 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
      logoDataUrl,
      managerWhatsApp: managerWhatsApp.trim(),
      slogan: slogan.trim(),
      previewDescription: cleanedDesc,
      previewUpdatedAt: Date.now(),
      currency: currency.trim() || 'ر.س',
      defaultSessionRate: Number(defaultSessionRate) || 40,
      defaultSubscriptionAmount: Number(defaultSubscriptionAmount) || 250,
      managerPin: cleanedPin,
      managerPinConfigured: managerPin.trim().length >= 4 ? true : settings.managerPinConfigured,
    };

    onSaveSettings(updated);
    syncAppIcon(logoDataUrl);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSyncIconNow = () => {
    syncAppIcon(logoDataUrl);
    setIconSyncSuccess(true);
    setTimeout(() => setIconSyncSuccess(false), 2500);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        onImportData(text);
      } catch {
        // handled silently
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#145A43] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-amiri text-white">إعدادات الأكاديمية والمالية والهوية</h2>
            <p className="text-xs text-[#D4AF37]/80">
              تخصيص الشعار، اسم الأكاديمية، العملة، أسعار الحصص، رقم واتساب الإدارة، والنسخ الاحتياطي
            </p>
          </div>
        </div>

        {onOpenPreviewSettings && (
          <button
            type="button"
            onClick={onOpenPreviewSettings}
            className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow cursor-pointer transition shrink-0"
          >
            <Share2 className="w-4 h-4 text-[#07241B]" />
            <span>إعدادات المعاينة (واتساب وفيسبوك)</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academy Logo Section */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">
              شعار الأكاديمية وأيقونة التطبيق
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#07241B]/80 p-5 rounded-2xl border border-[#D4AF37]/20">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <AcademyLogo logoUrl={logoDataUrl} size="xl" />
              <span className="text-[11px] text-[#D4AF37] font-semibold">
                {logoDataUrl ? 'شعارك المخصص' : 'الشعار الافتراضي للأكاديمية'}
              </span>
            </div>

            <div className="space-y-3 flex-1 w-full text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow transition"
                >
                  <Upload className="w-4 h-4 text-[#07241B]" />
                  <span>رفع صورة شعار الأكاديمية</span>
                </button>

                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>العودة للشعار الافتراضي</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSyncIconNow}
                className="text-xs text-[#D4AF37] hover:text-[#F3E5AB] flex items-center gap-1.5 underline decoration-[#D4AF37]/40 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {iconSyncSuccess
                    ? '✓ تم تطبيق الشعار على أيقونة التطبيق بنجاح!'
                    : 'تحديث أيقونة التطبيق الآن'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Login Page Image Section (صورة صفحة الدخول) */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <ImageIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold font-amiri text-white">صورة صفحة الدخول</h3>
            </div>
            {bannerDirty && (
              <span className="text-[11px] font-bold text-amber-300">
                تغييرات غير محفوظة
              </span>
            )}
          </div>

          <div className="bg-[#07241B]/80 p-5 rounded-2xl border border-[#D4AF37]/20 space-y-4">
            {draftLoginBanner ? (
              <div className="w-full max-w-md mx-auto">
                <img
                  src={draftLoginBanner}
                  alt="معاينة صورة صفحة الدخول"
                  className="w-full rounded-2xl object-cover max-h-64 block shadow-lg"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                لا توجد صورة حالياً — ستظهر صفحة الدخول فارغة ونظيفة بدون أي مربع فوق زر الدخول.
              </p>
            )}

            <input
              type="file"
              ref={bannerFileInputRef}
              onChange={handleBannerPick}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                <span>اختر صورة</span>
              </button>

              <button
                type="button"
                onClick={handleBannerRemove}
                disabled={!draftLoginBanner}
                className="px-4 py-2.5 rounded-xl bg-red-900/25 hover:bg-red-800/40 text-red-200 border border-red-400/30 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الصورة</span>
              </button>

              <button
                type="button"
                onClick={handleBannerSave}
                disabled={bannerSaving}
                className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow cursor-pointer transition disabled:opacity-60"
              >
                {bannerSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-[#07241B]" />
                    <span>تم الحفظ</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#07241B]" />
                    <span>{bannerSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
                  </>
                )}
              </button>
            </div>

            {bannerNotice && (
              <p className="text-xs text-amber-200 bg-amber-950/50 border border-amber-400/40 rounded-xl p-3 leading-relaxed">
                {bannerNotice}
              </p>
            )}
          </div>
        </div>

        {/* Basic & Financial Settings */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <Building className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">البيانات الأساسية والمالية</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                اسم الأكاديمية <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                رقم واتساب مدير الأكاديمية <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={managerWhatsApp}
                  onChange={(e) => setManagerWhatsApp(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white text-right focus:outline-none focus:border-[#D4AF37]"
                />
                <Phone className="w-4 h-4 text-[#25D366] absolute left-3 top-3 pointer-events-none" />
              </div>
              {managerWhatsApp && (
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(managerWhatsApp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#25D366] hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>تجربة فتح رابط الواتساب الآن</span>
                </a>
              )}
            </div>

            {/* Financial Defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#07241B]/70 p-4 rounded-2xl border border-[#D4AF37]/20">
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>العملة الافتراضية</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="$">دولار أمريكي ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  سعر الحصة الافتراضي للمعلم
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultSessionRate}
                  onChange={(e) => setDefaultSessionRate(Number(e.target.value))}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1">
                  الاشتراك الشهري الافتراضي
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultSubscriptionAmount}
                  onChange={(e) => setDefaultSubscriptionAmount(Number(e.target.value))}
                  className="w-full bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                الشعار اللفظي أو الرؤية
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                وصف معاينة الرابط (يظهر في واتساب وفيسبوك)
              </label>
              <textarea
                rows={2}
                value={previewDescription}
                onChange={(e) => setPreviewDescription(e.target.value)}
                className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              يتم الحفظ تلقائياً في Firestore السحابي والجهاز.
            </span>
            <button
              type="submit"
              className="gold-gradient-btn px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow cursor-pointer transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#07241B]" />
                  <span>تم حفظ الإعدادات بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#07241B]" />
                  <span>حفظ إعدادات الأكاديمية</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manager Secret PIN Settings */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-[#D4AF37] pb-3 border-b border-[#D4AF37]/20">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-lg font-bold font-amiri text-white">
              الرقم السري لدخول مدير الأكاديمية (الشيخ عبد المجيد مسعد)
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            يدخل مدير الأكاديمية مباشرة باستخدام هذا الرقم السري بدون تعبئة أي نموذج بيانات. الرقم الافتراضي هو <strong className="font-mono text-[#F3E5AB]">1234</strong> ويمكن تغييره هنا في أي وقت.
          </p>

          {pinError && (
            <div className="bg-red-950/60 border border-red-400/50 text-red-200 rounded-xl px-3.5 py-2 text-xs font-bold">
              {pinError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/25">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                الرقم السري الحالي / الجديد
              </label>
              <input
                type="text"
                dir="ltr"
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value);
                  setPinError(null);
                  setPinSavedSuccess(false);
                }}
                placeholder="1234"
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-base font-mono font-extrabold text-white tracking-widest focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="button"
              onClick={handleSavePinOnly}
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow cursor-pointer transition shrink-0"
            >
              {pinSavedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#07241B]" />
                  <span>تم حفظ الرقم السري!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#07241B]" />
                  <span>حفظ الرقم السري الجديد</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Linked Google Account Section (الحساب المرتبط) */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
            <h3 className="text-lg font-bold font-amiri text-white">الحساب المرتبط</h3>
            {(linkedGoogle?.email || userEmail) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>تم الربط بنجاح</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/20">
            <div className="flex items-center gap-3 min-w-0">
              {linkedGoogle?.photoURL && (
                <img
                  src={linkedGoogle.photoURL}
                  alt={linkedGoogle.name || 'صورة حساب جوجل'}
                  className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0">
                {linkedGoogle?.name && (
                  <p className="text-xs font-bold text-white truncate">{linkedGoogle.name}</p>
                )}
                <code className="text-xs text-[#F3E5AB] font-mono break-all" dir="ltr">
                  {linkedGoogle?.email || userEmail || 'غير مربوط'}
                </code>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl bg-red-900/25 hover:bg-red-800/40 text-red-200 border border-red-400/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Cloud Database (Firebase Firestore) Card */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Database className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold font-amiri text-white">
                قاعدة بيانات السحابة (Firebase Firestore)
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                firebaseConnected && firestoreStatus === 'connected'
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-900/50 text-amber-300 border-amber-500/40'
              }`}
            >
              {firebaseConnected && firestoreStatus === 'connected'
                ? 'متصل بـ Firebase (مباشر) 🟢'
                : 'وضع حفظ محلي مؤقت 🟠'}
            </span>
          </div>

          <div className="text-xs text-slate-300 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/20 space-y-2">
            {userEmail && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#F3E5AB] font-semibold">حساب الجيميل المتزامن:</span>
                <code className="text-emerald-300 font-mono" dir="ltr">
                  {userEmail}
                </code>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#F3E5AB] font-semibold">ملف إعدادات Firebase:</span>
              <code className="text-[#F3E5AB] font-mono" dir="ltr">
                src/firebase.js
              </code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#F3E5AB] font-semibold">حفظ التعديلات عند انقطاع النت:</span>
              <span className="text-emerald-300 font-semibold">مفعّل تلقائياً ويُنقل عند الاتصال ✓</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenFirebaseStatus && (
              <button
                type="button"
                onClick={onOpenFirebaseStatus}
                className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#07241B]" />
                <span>حالة الاتصال بـ Firebase</span>
              </button>
            )}

            {onSyncFirestore && (
              <button
                type="button"
                onClick={onSyncFirestore}
                className="px-4 py-2 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>فحص اتصال السحابة الآن</span>
              </button>
            )}

            {onOpenTrashBin && (
              <button
                type="button"
                onClick={onOpenTrashBin}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-300" />
                <span>سلة المحذوفات ({trashCount})</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl bg-red-900/25 hover:bg-red-800/40 text-red-200 border border-red-400/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج / تبديل حساب جوجل</span>
              </button>
            )}
          </div>
        </div>

        {/* App Update & Version Check Card */}
        <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <RefreshCw
                className={`w-5 h-5 text-[#D4AF37] ${
                  updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
                }`}
              />
              <h3 className="text-lg font-bold font-amiri text-white">
                تحديث التطبيق والتحقق من النسخة
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#F3E5AB] bg-[#07241B] px-3 py-1 rounded-lg border border-[#D4AF37]/30">
              الإصدار {currentVersion}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            يمكنك مسح الكاش القديم وجلب أحدث نسخة من التطبيق فوراً دون فقدان أي بيانات أو الحاجة لحذف التطبيق وإعادة تثبيته.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCheckUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'updating'}
              className="gold-gradient-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow cursor-pointer transition active:scale-95 disabled:opacity-70"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#07241B] ${
                  updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
                }`}
              />
              <span>تحديث التطبيق</span>
            </button>

            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-4 py-2.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span>تحميل التطبيق</span>
            </button>
          </div>

          {(updateMessage || hasUpdateAvailable) && (
            <div
              role="status"
              onClick={hasUpdateAvailable && onCheckUpdate ? onCheckUpdate : undefined}
              className={`rounded-2xl p-3.5 text-xs font-bold border flex items-center gap-2 ${
                updateStatus === 'updating' || hasUpdateAvailable
                  ? 'bg-amber-900/35 border-amber-400/60 text-amber-200 cursor-pointer'
                  : updateStatus === 'up-to-date'
                  ? 'bg-emerald-900/40 border-emerald-400/50 text-emerald-200'
                  : 'bg-[#07241B] border-[#D4AF37]/40 text-[#F3E5AB]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37]" />
              <span>
                {updateMessage || 'يوجد تحديث جديد، دوس هنا للتحديث'}
              </span>
            </div>
          )}
        </div>

        {/* Data Backup & Restore with Universal Download Feedback */}
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/25 rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-base font-bold font-amiri text-[#F3E5AB]">
              النسخ الاحتياطي واستعادة البيانات (Backup & Restore)
            </h3>
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="text-xs text-[#D4AF37] underline cursor-pointer font-bold"
            >
              تحميل التطبيق
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportData}
              className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#07241B]" />
              <span>تصدير وتحميل نسخة احتياطية (JSON)</span>
            </button>

            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
              <span>استيراد نسخة احتياطية</span>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="px-4 py-2.5 rounded-xl bg-red-900/20 hover:bg-red-800/30 text-red-300 border border-red-500/20 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تصفير ومسح جميع البيانات (0)</span>
            </button>
          </div>

          {exportDownloadState && (
            <DownloadFeedbackBox
              state={exportDownloadState}
              title="النسخة الاحتياطية - أكاديمية الفرقان"
            />
          )}
        </div>
      </form>
    </div>
  );
};
