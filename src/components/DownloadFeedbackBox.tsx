import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Share2, AlertTriangle, Download } from 'lucide-react';
import { DownloadState, shareDownloadedFile } from '../utils/downloadHelper';

interface DownloadFeedbackBoxProps {
  state: DownloadState;
  title?: string;
}

export const DownloadFeedbackBox: React.FC<DownloadFeedbackBoxProps> = ({ state, title }) => {
  const [shareDone, setShareDone] = useState(false);

  if (state.status === 'idle') return null;

  const handleNativeShare = async () => {
    if (!state.blob) return;
    const ok = await shareDownloadedFile(state.blob, state.filename, state.mimeType, title);
    if (ok) {
      setShareDone(true);
      setTimeout(() => setShareDone(false), 3000);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print rounded-2xl p-3.5 sm:p-4 border text-xs sm:text-sm space-y-2.5 transition ${
        state.status === 'downloading'
          ? 'bg-amber-500/15 border-amber-400/50 text-amber-100'
          : state.status === 'success'
          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-100'
          : state.status === 'mobile-fallback'
          ? 'bg-[#07241B] border-[#D4AF37]/60 text-[#F3E5AB]'
          : 'bg-red-500/15 border-red-400/50 text-red-100'
      }`}
    >
      <div className="flex items-center gap-2 font-bold">
        {state.status === 'downloading' && <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />}
        {state.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {state.status === 'mobile-fallback' && <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />}
        {state.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
        <span>{state.message}</span>
      </div>

      {state.filename && state.status !== 'downloading' && (
        <div className="text-[11px] text-slate-300 font-mono truncate" dir="ltr">
          {state.filename}
        </div>
      )}

      {(state.status === 'mobile-fallback' || state.status === 'error' || state.status === 'success') && state.blobUrl && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {state.canShare && state.blob && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#07241B] font-extrabold text-xs shadow cursor-pointer transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{shareDone ? 'تمت المشاركة بنجاح ✓' : 'مشاركة / حفظ في الموبايل'}</span>
            </button>
          )}

          <a
            href={state.blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-white border border-[#D4AF37]/40 font-bold text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>اضغط هنا لفتح الملف وحفظه يدوياً</span>
          </a>

          <a
            href={state.blobUrl}
            download={state.filename}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>إعادة التنزيل</span>
          </a>
        </div>
      )}
    </div>
  );
};
