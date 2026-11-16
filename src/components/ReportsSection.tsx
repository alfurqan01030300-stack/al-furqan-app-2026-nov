import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Receipt,
  Download,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { AcademySettings, PaymentRecord, Student } from '../types';
import { getTodayDateStr } from '../utils/storage';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  executeUniversalDownload,
} from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';

interface ReportsSectionProps {
  students: Student[];
  payments: PaymentRecord[];
  settings: AcademySettings;
  onViewReceipt: (payment: PaymentRecord) => void;
  onRecordPayment: (student: Student, amount?: number) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  students,
  payments,
  settings,
  onViewReceipt,
  onRecordPayment,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateStr().slice(0, 7));
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_DOWNLOAD_STATE);

  const currency = settings.currency || 'ر.س';
  const monthPayments = payments.filter((p) => p.monthKey === selectedMonth);

  const currentMonthKey = getTodayDateStr().slice(0, 7);
  const paidStudentIdsThisMonth = new Set(monthPayments.map((p) => p.studentId));
  if (selectedMonth === currentMonthKey) {
    students.forEach((s) => {
      if (s.feeStatus === 'paid') paidStudentIdsThisMonth.add(s.id);
    });
  }

  const paidStudents = students.filter((s) => paidStudentIdsThisMonth.has(s.id));
  const unpaidStudents = students.filter((s) => !paidStudentIdsThisMonth.has(s.id));
  const totalCollected = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleDownloadCsv = async () => {
    const header = ['رقم الإيصال', 'اسم الطالب', 'المبلغ', 'العملة', 'التاريخ', 'الشهر', 'ملاحظات'];
    const rows = monthPayments.map((p) => [
      p.receiptNumber,
      p.studentName,
      String(p.amount),
      p.currency,
      p.date,
      p.monthKey,
      p.notes || '',
    ]);

    const summaryRows = [
      [],
      ['ملخص الشهر', selectedMonth],
      ['عدد الطلاب الذين دفعوا', String(paidStudents.length)],
      ['عدد الطلاب لم يدفعوا بعد', String(unpaidStudents.length)],
      ['إجمالي الفلوس المحصلة', `${totalCollected} ${currency}`],
    ];

    const csvContent =
      '\uFEFF' +
      [header, ...rows, ...summaryRows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    await executeUniversalDownload(
      blob,
      `تقرير-الأكاديمية-الشهري-${selectedMonth}.csv`,
      'text/csv;charset=utf-8',
      setDownloadState
    );
  };

  const handleDownloadHtmlReport = async () => {
    const rowsHtml = monthPayments
      .map(
        (p) => `
      <tr>
        <td>${p.receiptNumber}</td>
        <td>${p.studentName}</td>
        <td><strong>${p.amount} ${p.currency}</strong></td>
        <td>${p.date}</td>
        <td>${p.notes || '-'}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>التقرير المالي الشهري - ${selectedMonth} | ${settings.academyName}</title>
<style>
  body { font-family: Cairo, Tahoma, Arial, sans-serif; background: #fffdf5; color: #0a4d2e; padding: 24px; }
  .box { max-width: 900px; margin: 0 auto; background: #fff; border: 2px solid #c9a227; border-radius: 16px; padding: 24px; }
  h1 { color: #0a4d2e; margin: 0 0 6px; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
  .kpi { background: #f0fdf4; border: 1px solid #c9a227; border-radius: 12px; padding: 14px; text-align: center; }
  .kpi strong { display: block; font-size: 24px; color: #0a4d2e; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
  th { background: #0a4d2e; color: #fffdf5; }
</style>
</head>
<body>
  <div class="box">
    <h1>${settings.academyName}</h1>
    <p>التقرير المالي الشهري عن شهر: <strong>${selectedMonth}</strong></p>
    <div class="kpis">
      <div class="kpi"><span>طلاب دفعوا هذا الشهر</span><strong>${paidStudents.length}</strong></div>
      <div class="kpi"><span>طلاب لم يدفعوا بعد</span><strong>${unpaidStudents.length}</strong></div>
      <div class="kpi"><span>إجمالي المبالغ المحصلة</span><strong>${totalCollected} ${currency}</strong></div>
    </div>
    <table>
      <thead>
        <tr><th>رقم الإيصال</th><th>اسم الطالب</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظات</th></tr>
      </thead>
      <tbody>${rowsHtml || '<tr><td colspan="5" style="text-align:center">لا توجد إيصالات مسجلة لهذا الشهر</td></tr>'}</tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    await executeUniversalDownload(
      blob,
      `تقرير-مالي-${selectedMonth}.html`,
      'text/html;charset=utf-8',
      setDownloadState
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header Banner */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] text-[#c9a227] flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e]">
              التقرير المالي الشهري وإيرادات الأكاديمية
            </h2>
            <p className="text-xs text-slate-600">
              متابعة الطلاب المسددين، غير المسددين، وإجمالي المبالغ المحصلة شهرياً مع تصدير التقارير
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#c9a227]">
          <Calendar className="w-4 h-4 text-[#9a7510]" />
          <label className="text-xs text-[#0a4d2e] font-bold">الشهر:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-slate-900 text-xs sm:text-sm font-mono focus:outline-none tabular-nums"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="furqan-card rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-bold block mb-1">
              طلاب دفعوا هذا الشهر
            </span>
            <div className="text-3xl font-black text-[#0a4d2e] tabular-nums">
              {paidStudents.length}{' '}
              <span className="text-xs font-semibold text-slate-600">من {students.length}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="furqan-card rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-800 font-bold block mb-1">
              طلاب لم يدفعوا بعد
            </span>
            <div className="text-3xl font-black text-amber-700 tabular-nums">
              {unpaidStudents.length}{' '}
              <span className="text-xs font-semibold text-slate-600">طالب</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="furqan-card rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-[#9a7510] font-bold block mb-1">
              إجمالي الفلوس المحصلة ({selectedMonth})
            </span>
            <div className="text-3xl font-black text-[#0a4d2e] tabular-nums">
              {totalCollected.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-[#9a7510]">{currency}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] text-[#c9a227] flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="furqan-card rounded-2xl p-4 sm:p-5 space-y-3 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#0a4d2e] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#9a7510]" />
              <span>تحميل التقرير الشهري ({selectedMonth})</span>
            </h3>
            <p className="text-[11px] text-slate-600">
              تصدير مباشر بصيغة Excel (CSV) أو صفحة طباعة (HTML)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-white border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
            >
              <Download className="w-4 h-4 text-[#c9a227]" />
              <span>تحميل CSV (إكسل)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtmlReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] text-xs font-extrabold cursor-pointer transition"
            >
              <FileText className="w-4 h-4 text-[#9a7510]" />
              <span>تحميل تقرير للطباعة HTML</span>
            </button>
          </div>
        </div>
        <DownloadFeedbackBox state={downloadState} title={`تقرير شهر ${selectedMonth}`} />
      </div>

      {/* Unpaid Students Quick Collect */}
      {unpaidStudents.length > 0 && (
        <div className="furqan-card rounded-2xl p-5 shadow space-y-3">
          <h3 className="text-base font-extrabold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <span>الطلاب غير المسددين عن شهر {selectedMonth} ({unpaidStudents.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpaidStudents.map((st) => {
              const amount = st.subscriptionAmount || settings.defaultSubscriptionAmount || 250;
              return (
                <div
                  key={st.id}
                  className="furqan-card-subtle rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-[#0a4d2e] truncate">{st.name}</h4>
                    <p className="text-xs text-slate-600 tabular-nums">
                      الاشتراك: <strong className="text-[#9a7510]">{amount} {currency}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRecordPayment(st, amount)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تحصيل وإيصال</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded Payments Table */}
      <div className="furqan-card rounded-2xl p-5 sm:p-6 shadow space-y-4">
        <h3 className="text-lg font-extrabold text-[#0a4d2e] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#9a7510]" />
          <span>سجل الإيصالات والمدفوعات ({monthPayments.length})</span>
        </h3>

        {monthPayments.length === 0 ? (
          <div className="furqan-card-subtle rounded-xl p-8 text-center text-xs text-slate-600">
            لا توجد إيصالات دفع مسجلة في شهر {selectedMonth} حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-[#0a4d2e] text-white">
                <tr>
                  <th className="py-3 px-3">رقم الإيصال</th>
                  <th className="py-3 px-3">اسم الطالب</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">تاريخ الدفع</th>
                  <th className="py-3 px-3">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a227]/30">
                {monthPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fff9e6] transition">
                    <td className="py-3 px-3 font-mono text-xs text-[#9a7510] font-bold" dir="ltr">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-[#0a4d2e]">{p.studentName}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700 tabular-nums">
                      {p.amount} {p.currency}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 tabular-nums" dir="ltr">
                      {p.date}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a4d2e] text-white text-xs font-bold cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#c9a227]" />
                        <span>عرض / تحميل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
