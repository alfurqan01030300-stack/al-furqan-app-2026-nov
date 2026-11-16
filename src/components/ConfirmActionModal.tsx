import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'تأكيد ونقل لسلة المحذوفات',
  cancelLabel = 'إلغاء',
  tone = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = tone === 'danger';

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                isDanger
                  ? 'bg-red-900/40 border-red-500/50 text-red-300'
                  : 'bg-amber-900/40 border-amber-400/50 text-amber-300'
              }`}
            >
              {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#07241B]/70 border border-white/10 rounded-2xl p-4">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs sm:text-sm font-bold cursor-pointer transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                : 'bg-amber-500 hover:bg-amber-400 text-[#07241B] shadow-lg'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
