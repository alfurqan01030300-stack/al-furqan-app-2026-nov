import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Image as ImageIcon, CheckCircle2, Receipt } from 'lucide-react';
import { PaymentRecord } from '../types';
import { AcademyLogo } from './AcademyLogo';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  canvasToPdfBlob,
  executeUniversalDownload,
  generateReceiptCanvas,
} from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  academyName: string;
  logoUrl?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  academyName,
  logoUrl,
  onClose,
}) => {
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_DOWNLOAD_STATE);

  useEffect(() => {
    setDownloadState(INITIAL_DOWNLOAD_STATE);
  }, [payment?.id]);

  if (!payment) return null;

  const handleDownloadPdf = async () => {
    const canvas = await generateReceiptCanvas(payment, academyName);
    const pdfBlob = canvasToPdfBlob(canvas, false);
    const safeStudent = payment.studentName.trim().replace(/\s+/g, '-');
    const filename = `ايصال-دفع-${safeStudent}-${payment.receiptNumber}.pdf`;
    await executeUniversalDownload(pdfBlob, filename, 'application/pdf', setDownloadState);
  };

  const handleDownloadPng = async () => {
    const canvas = await generateReceiptCanvas(payment, academyName);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const safeStudent = payment.studentName.trim().replace(/\s+/g, '-');
    const filename = `ايصال-دفع-${safeStudent}-${payment.receiptNumber}.png`;
    await executeUniversalDownload(blob, filename, 'image/png', setDownloadState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto print-only-container">
      <div className="relative w-full max-w-lg bg-[#0B3D2E] border-2 border-[#D4AF37]/60 rounded-3xl shadow-2xl overflow-hidden my-4 print-only-container">
        {/* Top Modal Controls (hidden on print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 bg-[#07241B] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2 text-[#F3E5AB]">
            <Receipt className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base sm:text-lg font-bold font-amiri text-white">
              إيصال دفع رسوم الاشتراك
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Sleek Receipt Body */}
        <div className="p-5 sm:p-6">
          <div className="bg-white text-slate-900 rounded-2xl border-4 border-[#D4AF37] overflow-hidden shadow-xl">
            {/* Academy Header */}
            <div className="bg-gradient-to-l from-[#07241B] via-[#0B3D2E] to-[#145A43] text-white p-5 text-center border-b-2 border-[#D4AF37]">
              <div className="flex justify-center mb-2">
                <AcademyLogo logoUrl={logoUrl} size="md" />
              </div>
              <h4 className="text-lg font-extrabold font-amiri text-[#F3E5AB]">{academyName}</h4>
              <p className="text-xs text-slate-200 mt-0.5">إيصال سداد رسوم اشتراك شهري معتمد</p>
            </div>

            {/* Meta Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-500 block">رقم الإيصال:</span>
                  <span className="font-mono font-bold text-[#0B3D2E]" dir="ltr">
                    {payment.receiptNumber}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 block">تاريخ الدفع:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">
                    {payment.date}
                  </span>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-emerald-800 block mb-1">
                  المبلغ المدفوع
                </span>
                <div className="text-3xl font-black text-[#07241B]">
                  {payment.amount} <span className="text-lg font-bold text-emerald-700">{payment.currency}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم السداد بنجاح</span>
                </span>
              </div>

              {/* Details Table */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                  <span className="text-slate-500 font-semibold">اسم الطالب:</span>
                  <span className="font-bold text-slate-900">{payment.studentName}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg">
                  <span className="text-slate-500 font-semibold">اشتراك شهر:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">
                    {payment.monthKey}
                  </span>
                </div>
                {payment.notes && (
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                    <span className="text-slate-500 font-semibold">البيان:</span>
                    <span className="font-medium text-slate-800">{payment.notes}</span>
                  </div>
                )}
              </div>

              {/* Seal Footer */}
              <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
                <span>ختم واعتماد الإدارة</span>
                <span className="px-2.5 py-1 rounded-full border border-[#D4AF37] text-[#92400E] font-bold">
                  سند رسمي إلكتروني
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="no-print mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="gold-gradient-btn flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition active:scale-95"
              >
                <Download className="w-4 h-4 text-[#07241B]" />
                <span>تحميل PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/50 text-xs font-bold cursor-pointer transition active:scale-95"
              >
                <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                <span>تحميل صورة PNG</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold cursor-pointer transition active:scale-95"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>طباعة الإيصال</span>
              </button>
            </div>

            <DownloadFeedbackBox state={downloadState} title={`إيصال دفع - ${payment.studentName}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
