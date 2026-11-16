import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  FileCheck2,
  Download,
  Share2,
  Save,
  Star,
  Loader2,
  Check,
  Search,
  MessageSquare,
} from 'lucide-react';
import {
  AcademySettings,
  FollowUpReport,
  HalaqaGroup,
  Student,
  StudentLevel,
  Teacher,
} from '../types';
import { StudentReportCard } from './StudentReportCard';
import { cleanWhatsAppNumber, getTodayDateStr } from '../utils/storage';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  executeUniversalDownload,
} from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';

interface GradesReportsSectionProps {
  students: Student[];
  teachers: Teacher[];
  halaqat: HalaqaGroup[];
  settings: AcademySettings;
  onUpdateStudent: (updated: Student) => void;
  onAddStar: (student: Student) => { reachedTen: boolean; newStars: number };
}

export const GradesReportsSection: React.FC<GradesReportsSectionProps> = ({
  students,
  teachers,
  halaqat,
  settings,
  onUpdateStudent,
  onAddStar,
}) => {
  const todayStr = getTodayDateStr();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  const filteredList = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.parentName && s.parentName.toLowerCase().includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(searchQuery.trim()))
    );
  });

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || filteredList[0] || students[0] || null;

  const assignedTeacher = teachers.find((t) => t.id === activeStudent?.assignedTeacherId);
  const assignedHalaqa = halaqat.find((h) => h.id === activeStudent?.halaqaId);

  const [reportDate, setReportDate] = useState(todayStr);
  const [teacherName, setTeacherName] = useState(
    assignedTeacher?.name || 'فضيلة الشيخ عبد المجيد مسعد'
  );
  const [halaqaName, setHalaqaName] = useState(
    assignedHalaqa?.name || activeStudent?.halaqaName || activeStudent?.course || 'حلقة التحفيظ'
  );
  const [level, setLevel] = useState<StudentLevel>('excellent');
  const [newMemorization, setNewMemorization] = useState('سورة البقرة من الآية 1 إلى الآية 15');
  const [nearRevision, setNearRevision] = useState('سورة آل عمران');
  const [farRevision, setFarRevision] = useState('جزء عم كاملاً');
  const [teacherNote, setTeacherNote] = useState(
    'مستوى متميز ومثابرة طيبة، نرجو الاستمرار في المراجعة اليومية.'
  );
  const [completedJuz, setCompletedJuz] = useState<number>(activeStudent?.completedJuz ?? 0);
  const [currentSurah, setCurrentSurah] = useState<string>(
    activeStudent?.currentSurah || 'سورة الفاتحة'
  );

  const [savedNotice, setSavedNotice] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_DOWNLOAD_STATE);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeStudent) return;
    const tObj = teachers.find((t) => t.id === activeStudent.assignedTeacherId);
    const hObj = halaqat.find((h) => h.id === activeStudent.halaqaId);
    const latestReport = activeStudent.reports?.[0];

    setTeacherName(tObj?.name || latestReport?.teacherName || 'فضيلة الشيخ عبد المجيد مسعد');
    setHalaqaName(
      hObj?.name || activeStudent.halaqaName || activeStudent.course || 'حلقة تحفيظ القرآن'
    );
    setCompletedJuz(activeStudent.completedJuz ?? 0);
    setCurrentSurah(activeStudent.currentSurah || 'سورة الفاتحة');
    if (latestReport) {
      setLevel(latestReport.level);
      setNewMemorization(latestReport.newMemorization || '');
      setNearRevision(latestReport.nearRevision || '');
      setFarRevision(latestReport.farRevision || '');
      setTeacherNote(latestReport.teacherNote || latestReport.reportNotes || '');
    }
  }, [activeStudent?.id, teachers, halaqat]);

  const getLevelArabic = (lvl: StudentLevel) => {
    switch (lvl) {
      case 'excellent':
        return 'ممتاز (متقن للأحكام والتلاوة) ⭐⭐⭐⭐⭐';
      case 'medium':
        return 'متوسط (يحتاج مزيداً من التكرار) ⭐⭐⭐';
      case 'weak':
        return 'يحتاج إلى متابعة واهتمام أكثر ⭐';
    }
  };

  const handleSaveToStudent = () => {
    if (!activeStudent) return;
    const newReport: FollowUpReport = {
      id: `rep-${Date.now()}`,
      date: reportDate,
      newMemorization: newMemorization.trim(),
      nearRevision: nearRevision.trim(),
      farRevision: farRevision.trim(),
      halaqaName: halaqaName.trim(),
      teacherName: teacherName.trim(),
      level,
      teacherNote: teacherNote.trim(),
      reportNotes: teacherNote.trim(),
      createdAt: Date.now(),
    };
    onUpdateStudent({
      ...activeStudent,
      completedJuz: Math.max(0, Math.min(30, Number(completedJuz) || 0)),
      currentSurah: currentSurah.trim() || 'سورة الفاتحة',
      reports: [newReport, ...(activeStudent.reports || [])],
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const captureReportBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    if (!reportRef.current || !activeStudent) {
      throw new Error('لم يتم العثور على بطاقة التقرير');
    }
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFF8E7',
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('فشل تحويل التقرير إلى صورة'));
      }, 'image/png');
    });
    return { blob, filename: `تقرير-${activeStudent.name}.png` };
  };

  const handleDownloadImage = async () => {
    if (!activeStudent) return;
    setIsCapturingImage(true);
    setWhatsAppUrl(null);
    try {
      const { blob, filename } = await captureReportBlob();
      await executeUniversalDownload(blob, filename, 'image/png', setDownloadState);
    } catch {
      setDownloadState({
        status: 'error',
        message: 'تعذر إنشاء صورة التقرير. يرجى المحاولة مرة أخرى.',
        blobUrl: null,
        filename: `تقرير-${activeStudent.name}.png`,
        mimeType: 'image/png',
        blob: null,
        canShare: false,
      });
    } finally {
      setIsCapturingImage(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!activeStudent) return;
    setIsSharingImage(true);
    const parentPhone = cleanWhatsAppNumber(
      activeStudent.parentPhone || activeStudent.phone || ''
    );
    try {
      const { blob, filename } = await captureReportBlob();
      const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '-');
      const file = new File([blob], safeFilename, { type: 'image/png' });
      const canWebShare =
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }));

      if (canWebShare) {
        try {
          await navigator.share({
            title: `تقرير-${activeStudent.name}`,
            files: [file],
          });
          setIsSharingImage(false);
          return;
        } catch {
          // fallback below
        }
      }

      await executeUniversalDownload(blob, safeFilename, 'image/png', setDownloadState);
      const text = encodeURIComponent(
        `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${activeStudent.name})\nمرفق لحضرتكم تقرير المتابعة والدرجات من ${settings.academyName}.\n• المستوى: ${getLevelArabic(
          level
        )}\n• الحفظ الجديد: ${newMemorization}\n• الماضي القريب: ${nearRevision}\n• رصيد النجوم: ${
          activeStudent.stars || 0
        }/10 ⭐`
      );
      setWhatsAppUrl(
        parentPhone ? `https://wa.me/${parentPhone}?text=${text}` : `https://wa.me/?text=${text}`
      );
    } finally {
      setIsSharingImage(false);
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header Banner */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e]">
              الدرجات وتقرير الطالب (الشهادة المعتمدة)
            </h2>
            <p className="text-xs text-slate-600">
              اختر الطالب وسجّل تقييمه وحفظه لتجهيز الشهادة الرسمية بالبرواز الذهبي وتحميلها أو مشاركتها على واتساب
            </p>
          </div>
        </div>

        {/* Student Selector + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0 lg:min-w-[380px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن طالب..."
              className="w-full bg-white border border-[#c9a227] rounded-xl pr-8 pl-3 py-2 text-xs text-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-[#9a7510] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          <select
            value={activeStudent?.id || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="flex-1 bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0a4d2e]"
          >
            {filteredList.length === 0 ? (
              <option value="">لا يوجد طلاب</option>
            ) : (
              filteredList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {!activeStudent ? (
        <div className="furqan-card rounded-2xl p-12 text-center text-sm font-bold text-slate-600">
          أضف طلاباً أولاً لتتمكن من إصدار تقارير الدرجات والشهادات.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Form Column */}
          <div className="xl:col-span-5 furqan-card rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9a227]/40">
              <h3 className="text-base font-extrabold text-[#0a4d2e]">
                بيانات تقرير: {activeStudent.name}
              </h3>
              <button
                type="button"
                onClick={() => onAddStar(activeStudent)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] border border-[#c9a227] text-[#0a4d2e] text-xs font-extrabold cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-[#c9a227] fill-[#c9a227]" />
                <span>+1 نجمة ({activeStudent.stars || 0}/10)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">اسم المعلم</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">الحلقة / الكورس</label>
                <input
                  type="text"
                  value={halaqaName}
                  onChange={(e) => setHalaqaName(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">الأجزاء المحفوظة</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={completedJuz}
                  onChange={(e) => setCompletedJuz(Number(e.target.value))}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">السورة الحالية</label>
                <input
                  type="text"
                  value={currentSurah}
                  onChange={(e) => setCurrentSurah(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">تقييم المعلم (المستوى)</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as StudentLevel)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="excellent">ممتاز ⭐⭐⭐⭐⭐</option>
                  <option value="medium">متوسط ⭐⭐⭐</option>
                  <option value="weak">يحتاج متابعة ⭐</option>
                </select>
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">تاريخ التقرير</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">الحفظ الجديد</label>
                <input
                  type="text"
                  value={newMemorization}
                  onChange={(e) => setNewMemorization(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#0a4d2e] mb-1">الماضي القريب</label>
                  <input
                    type="text"
                    value={nearRevision}
                    onChange={(e) => setNearRevision(e.target.value)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-[#0a4d2e] mb-1">الماضي البعيد</label>
                  <input
                    type="text"
                    value={farRevision}
                    onChange={(e) => setFarRevision(e.target.value)}
                    className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-extrabold text-[#0a4d2e] mb-1">الملاحظات وتوجيه المعلم</label>
                <textarea
                  rows={2}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="w-full bg-white border border-[#c9a227] rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleSaveToStudent}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] text-xs sm:text-sm font-extrabold cursor-pointer transition"
              >
                {savedNotice ? <Check className="w-4 h-4 text-[#c9a227]" /> : <Save className="w-4 h-4 text-[#c9a227]" />}
                <span>{savedNotice ? 'تم الحفظ في سجل الطالب ✓' : 'حفظ التقرير والدرجات في سجل الطالب'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isCapturingImage}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] text-xs font-extrabold cursor-pointer transition disabled:opacity-60"
                >
                  {isCapturingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>تحميل كصورة</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  disabled={isSharingImage}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold cursor-pointer transition disabled:opacity-60"
                >
                  {isSharingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  <span>مشاركة على واتساب</span>
                </button>
              </div>

              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-500 text-emerald-900 text-xs font-extrabold"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>فتح محادثة واتساب ولي الأمر الآن ↗</span>
                </a>
              )}

              <DownloadFeedbackBox state={downloadState} title={`تقرير-${activeStudent.name}`} />
            </div>
          </div>

          {/* Live Certificate Preview Column (Exact Preserved Old Report Card Design) */}
          <div className="xl:col-span-7 overflow-x-auto">
            <StudentReportCard
              reportRef={reportRef}
              data={{
                studentName: activeStudent.name,
                parentName: activeStudent.parentName || '—',
                courseName: activeStudent.course,
                teacherName,
                halaqaName,
                statusLabel: activeStudent.feeStatus === 'paid' ? 'منتظم (دَفَعَ الرسوم)' : 'تحت المتابعة',
                levelLabel: getLevelArabic(level),
                completedJuz,
                currentSurah,
                stars: activeStudent.stars ?? 0,
                reportDate,
                newMemorization,
                nearRevision,
                farRevision,
                reportNotes: teacherNote,
                teacherNote,
                completionDate: reportDate,
                logoUrl: settings.logoDataUrl,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
