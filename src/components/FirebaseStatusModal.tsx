import React from 'react';
import {
  CheckCircle2,
  CloudOff,
  Database,
  GraduationCap,
  RefreshCw,
  Trash2,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import { FirebaseConnectionStats } from '../types';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  stats: FirebaseConnectionStats;
  localStudentsCount: number;
  localTeachersCount: number;
  trashCount: number;
  isSyncing: boolean;
  syncFeedback?: string | null;
  onClose: () => void;
  onSyncAndMigrateNow: () => void;
  onOpenTrashBin: () => void;
  showGoogleSignInButton?: boolean;
  onGoogleSignIn?: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  stats,
  localStudentsCount,
  localTeachersCount,
  trashCount,
  isSyncing,
  syncFeedback,
  onClose,
  onSyncAndMigrateNow,
  onOpenTrashBin,
  showGoogleSignInButton = false,
  onGoogleSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#07241B] border border-[#D4AF37]/50 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-amiri">
                حالة الاتصال بـ Firebase Firestore
              </h3>
              <p className="text-[11px] text-slate-300" dir="ltr">
                Project ID: {stats.projectId || 'غير محدد'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connection Banner */}
        <div
          className={`rounded-2xl p-4 border-2 flex items-start gap-3 ${
            stats.connected
              ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-100'
              : 'bg-amber-950/60 border-amber-400/60 text-amber-100'
          }`}
        >
          {stats.connected ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <CloudOff className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-extrabold">
              {stats.connected
                ? 'متصل بـ Firebase Firestore السحابي بنجاح 🟢'
                : 'غير متصل بـ Firebase حالياً (يعمل بوضع الحفظ المؤقت الآمن) 🟠'}
            </p>
            <p className="text-xs opacity-90 leading-relaxed">
              {stats.connected
                ? 'جميع الطلاب والمعلمين والحضور والمدفوعات والشهادات تُحفظ لحظياً في Firestore ولا تُمسح أبداً عند التحديث أو تسجيل الخروج.'
                : stats.reason ||
                  'بياناتك محفوظة محلياً بأمان ولن تُمسح. بمجرد توصيل Firebase، سيتم نقل كل البيانات القديمة تلقائياً بدون أي حذف.'}
            </p>
          </div>
        </div>

        {/* Counts in Firebase vs Local */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>الطلاب في Firebase</span>
              <Users className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-2xl font-black text-white">
              {stats.connected ? stats.studentsCount : 0}
            </p>
            <p className="text-[11px] text-emerald-300">
              المحفوظ حالياً على التطبيق: {localStudentsCount}
            </p>
          </div>

          <div className="bg-[#07241B]/90 border border-[#D4AF37]/30 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>المعلمون في Firebase</span>
              <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-2xl font-black text-white">
              {stats.connected ? stats.teachersCount : 0}
            </p>
            <p className="text-[11px] text-emerald-300">
              المحفوظ حالياً على التطبيق: {localTeachersCount}
            </p>
          </div>

          <div className="bg-[#07241B]/90 border border-[#D4AF37]/20 rounded-2xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-300">أولياء الأمور (parents)</span>
            <span className="font-extrabold text-[#F3E5AB]">
              {stats.connected ? stats.parentsCount : 0}
            </span>
          </div>

          <div className="bg-[#07241B]/90 border border-[#D4AF37]/20 rounded-2xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-300">الشهادات (certificates)</span>
            <span className="font-extrabold text-[#F3E5AB]">
              {stats.connected ? stats.certificatesCount : 0}
            </span>
          </div>
        </div>

        {/* Pending Sync Notice */}
        {stats.pendingSyncCount > 0 && (
          <div className="bg-amber-900/30 border border-amber-400/50 rounded-2xl p-3.5 text-xs text-amber-100 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              يوجد <strong>{stats.pendingSyncCount}</strong> سجل محفوظ محلياً بانتظار النقل لـ
              Firebase بمجرد توفر الاتصال (بدون مسح أي بيانات سابقة).
            </span>
          </div>
        )}

        {syncFeedback && (
          <div className="bg-emerald-900/40 border border-emerald-400/50 rounded-2xl p-3 text-xs font-bold text-emerald-100">
            {syncFeedback}
          </div>
        )}

        {/* Info on API Key file */}
        {!stats.hasCustomApiKey && (
          <p className="text-[11px] text-slate-300 leading-relaxed bg-[#07241B]/60 rounded-xl p-3 border border-white/10">
            لربط مشروعك الخاص أو تغيير المفتاح: افتح ملف{' '}
            <code className="text-[#F3E5AB] font-mono">src/firebase.js</code> وضع الـ API Key داخل{' '}
            <code className="text-[#F3E5AB] font-mono">userFirebaseConfig.apiKey</code>.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {showGoogleSignInButton && onGoogleSignIn && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <span>ربط / تسجيل الدخول بحساب جوجل للمزامنة</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSyncAndMigrateNow}
            disabled={isSyncing}
            className="flex-1 gold-gradient-btn px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-[#07241B] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing ? 'جاري الفحص والمزامنة...' : 'فحص الاتصال ومزامنة البيانات الآن'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTrashBin();
            }}
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F3E5AB] border border-[#D4AF37]/30 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <Trash2 className="w-4 h-4 text-[#D4AF37]" />
            <span>سلة المحذوفات ({trashCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
