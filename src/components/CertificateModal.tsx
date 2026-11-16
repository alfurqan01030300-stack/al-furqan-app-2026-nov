import React, { useState, useEffect } from 'react';
import { X, Award, Printer, Download, Image as ImageIcon, Calendar, Sparkles } from 'lucide-react';
import { CertificateRecord, Student } from '../types';
import { AcademyLogo } from './AcademyLogo';
import { getTodayDateStr } from '../utils/storage';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  canvasToPdfBlob,
  executeUniversalDownload,
  generateCertificateCanvas,
} from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';

interface CertificateModalProps {
  student: Student | null;
  initialCertificate?: CertificateRecord | null;
  academyName: string;
  logoUrl?: string;
  onClose: () => void;
  onSaveCertificate?: (cert: CertificateRecord) => void;
}

const JUZ_OPTIONS = [
  'الجزء الثلاثون (جزء عم)',
  'الجزء التاسع والعشرون (جزء تبارك)',
  'الجزء الثامن والعشرون (قد سمع)',
  'الأجزاء الخمسة الأولى من القرآن الكريم',
  'الربع الأول من القرآن الكريم',
  'نصف القرآن الكريم كاملاً (15 جزءاً)',
  'القرآن الكريم كاملاً (30 جزءاً)',
  'وسام التميز والتفوق (إتمام 10 نجوم)',
  'الجزء الأول (ألم)',
  'الجزء الثاني (سيقول)',
  'الجزء الثالث (تلك الرسل)',
  'الجزء الخامس عشر (سبحان)',
];

export const CertificateModal: React.FC<CertificateModalProps> = ({
  student,
  initialCertificate,
  academyName,
  logoUrl,
  onClose,
  onSaveCertificate,
}) => {
  const [juzName, setJuzName] = useState(JUZ_OPTIONS[0]);
  const [customJuz, setCustomJuz] = useState('');
  const [completionDate, setCompletionDate] = useState(getTodayDateStr());
  const [certType, setCertType] = useState<'juz' | 'stars'>('juz');
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_DOWNLOAD_STATE);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDownloadState(INITIAL_DOWNLOAD_STATE);
    setSavedNotice(false);
    if (initialCertificate) {
      if (JUZ_OPTIONS.includes(initialCertificate.juzName)) {
        setJuzName(initialCertificate.juzName);
        setCustomJuz('');
      } else {
        setJuzName('custom');
        setCustomJuz(initialCertificate.juzName);
      }
      setCompletionDate(initialCertificate.completionDate);
      setCertType(initialCertificate.type);
    } else if (student) {
      const completed = student.completedJuz || 0;
      const defaultJuz =
        completed >= 30
          ? 'القرآن الكريم كاملاً (30 جزءاً)'
          : completed > 0
          ? `الجزء رقم (${completed}) من القرآن الكريم`
          : JUZ_OPTIONS[0];
      if (JUZ_OPTIONS.includes(defaultJuz)) {
        setJuzName(defaultJuz);
        setCustomJuz('');
      } else {
        setJuzName('custom');
        setCustomJuz(defaultJuz);
      }
      setCompletionDate(getTodayDateStr());
      setCertType('juz');
    }
  }, [student, initialCertificate]);

  if (!student) return null;

  const finalJuzTitle = juzName === 'custom' ? customJuz.trim() || 'حفظ مقرر قرآني' : juzName;

  const currentCertRecord: CertificateRecord = {
    id: initialCertificate?.id || `cert-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    juzName: finalJuzTitle,
    completionDate,
    type: certType,
    createdAt: initialCertificate?.createdAt || Date.now(),
  };

  const ensureSavedIfNew = () => {
    if (!initialCertificate && onSaveCertificate && !savedNotice) {
      onSaveCertificate(currentCertRecord);
      setSavedNotice(true);
    }
  };

  const handleDownloadPdf = async () => {
    ensureSavedIfNew();
    const canvas = await generateCertificateCanvas(currentCertRecord, academyName);
    const pdfBlob = canvasToPdfBlob(canvas, true);
    const safeStudent = student.name.trim().replace(/\s+/g, '-');
    const filename = `شهادة-${safeStudent}-${completionDate}.pdf`;
    await executeUniversalDownload(pdfBlob, filename, 'application/pdf', setDownloadState);
  };

  const handleDownloadPng = async () => {
    ensureSavedIfNew();
    const canvas = await generateCertificateCanvas(currentCertRecord, academyName);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const safeStudent = student.name.trim().replace(/\s+/g, '-');
    const filename = `شهادة-${safeStudent}-${completionDate}.png`;
    await executeUniversalDownload(blob, filename, 'image/png', setDownloadState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto print-only-container">
      <div className="relative w-full max-w-3xl bg-[#0B3D2E] border-2 border-[#D4AF37]/60 rounded-3xl shadow-2xl overflow-hidden my-4 print-only-container">
        {/* Top Modal Controls */}
        <div className="no-print flex items-center justify-between px-5 py-4 bg-[#07241B] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2 text-[#F3E5AB]">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base sm:text-lg font-bold font-amiri text-white">
              شهادة إتمام وتقدير قرآنية (جاهزة للطباعة PDF)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Certificate Configuration Form (hidden on print) */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#07241B]/80 p-4 rounded-2xl border border-[#D4AF37]/25 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[#F3E5AB] font-semibold mb-1">
                الجزء أو الإنجاز المراد طباعته في الشهادة:
              </label>
              <select
                value={juzName}
                onChange={(e) => {
                  const v = e.target.value;
                  setJuzName(v);
                  setCertType(v.includes('نجوم') ? 'stars' : 'juz');
                }}
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {JUZ_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="custom">+ كتابة اسم الجزء يدوياً...</option>
              </select>

              {juzName === 'custom' && (
                <input
                  type="text"
                  value={customJuz}
                  onChange={(e) => setCustomJuz(e.target.value)}
                  placeholder="مثال: الجزء السادس والعشرون (الأحقاف)"
                  className="mt-2 w-full bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
                />
              )}
            </div>

            <div>
              <label className="block text-[#F3E5AB] font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>تاريخ الإتمام:</span>
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Ornate Live Certificate Preview */}
          <div className="bg-gradient-to-br from-[#FFFDF7] to-[#F7EED3] text-slate-900 rounded-2xl border-[10px] border-[#0B3D2E] p-1 shadow-2xl">
            <div className="border-4 border-[#D4AF37] rounded-xl p-5 sm:p-8 text-center space-y-4 relative overflow-hidden">
              <div className="flex flex-col items-center gap-2">
                <AcademyLogo logoUrl={logoUrl} size="lg" />
                <p className="text-sm font-bold font-amiri text-[#0B3D2E]">بسم الله الرحمن الرحيم</p>
                <p className="text-xs sm:text-sm font-extrabold text-[#92400E]">{academyName}</p>
              </div>

              <div className="inline-block bg-[#0B3D2E] text-[#F3E5AB] px-6 py-2 rounded-xl border-2 border-[#D4AF37] shadow">
                <h2 className="text-lg sm:text-2xl font-bold font-amiri">
                  {certType === 'stars'
                    ? 'شهادة تكريم وتفوق (وسام العشر نجوم)'
                    : 'شهادة تقدير وإتمام حفظ قرآني'}
                </h2>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                تشهد إدارة وهيئة تدريس الأكاديمية بأن الطالب / الطالبة:
              </p>

              <div className="py-1 border-b-2 border-[#D4AF37]/60 max-w-md mx-auto">
                <h3 className="text-2xl sm:text-3xl font-extrabold font-amiri text-[#0B3D2E]">
                  {student.name}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                {certType === 'stars'
                  ? 'قد أتم بفضل الله جمع عشر نجوم متتالية للالتزام والتفوق في الحفظ:'
                  : 'قد أتم بحمد الله وتوفيقه حفظ وإتقان:'}
              </p>

              <div className="bg-[#FFF9E6] border-2 border-[#D4AF37] rounded-xl px-5 py-3 max-w-md mx-auto shadow-inner">
                <span className="text-lg sm:text-xl font-bold font-amiri text-[#92400E]">
                  {finalJuzTitle}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-amiri italic text-[#0B3D2E]">
                قال رسول الله ﷺ: «خَيرُكُم مَن تَعلَّمَ القُرآنَ وعَلَّمَهُ»
              </p>

              <div className="pt-4 border-t border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700 font-bold">
                <span>تاريخ الإتمام: {completionDate}</span>
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#0B3D2E] font-amiri">
                  ختم وشعار {academyName}
                </span>
                <span>اعتماد إدارة الأكاديمية</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="gold-gradient-btn flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition active:scale-95"
              >
                <Download className="w-4 h-4 text-[#07241B]" />
                <span>تحميل الشهادة PDF</span>
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
                onClick={() => {
                  ensureSavedIfNew();
                  window.print();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold cursor-pointer transition active:scale-95"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>طباعة / حفظ PDF</span>
              </button>

              {!initialCertificate && onSaveCertificate && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveCertificate(currentCertRecord);
                    setSavedNotice(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-400/50 text-xs font-bold cursor-pointer transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{savedNotice ? 'تم الحفظ بسجل الطالب ✓' : 'حفظ بسجل الطالب'}</span>
                </button>
              )}
            </div>

            <DownloadFeedbackBox state={downloadState} title={`شهادة - ${student.name}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
