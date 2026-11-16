import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  Phone,
  Search,
  Trash2,
  UserCheck,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { Teacher, TeacherCertificate, TeacherStatus } from '../types';
import { executeUniversalDownload, INITIAL_DOWNLOAD_STATE } from '../utils/downloadHelper';
import { TEACHER_SYSTEM_LABELS } from '../data/curricula';

interface TeacherApplicationsSectionProps {
  teachers: Teacher[];
  onApproveTeacher: (teacherId: string) => void;
  onRejectTeacher: (teacherId: string) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export const TeacherApplicationsSection: React.FC<TeacherApplicationsSectionProps> = ({
  teachers,
  onApproveTeacher,
  onRejectTeacher,
  onDeleteTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TeacherStatus>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [lightboxCert, setLightboxCert] = useState<TeacherCertificate | null>(null);
  const [, setDownloadState] = useState(INITIAL_DOWNLOAD_STATE);

  const pendingCount = teachers.filter((t) => (t.status || 'active') === 'pending').length;

  const filtered = teachers
    .filter((t) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.phone && t.phone.includes(q)) ||
        (t.normalizedPhone && t.normalizedPhone.includes(q));
      const effStatus: TeacherStatus = t.status || 'active';
      const matchesStatus = statusFilter === 'all' || effStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Pending requests pinned first, then newest
      const sa = (a.status || 'active') === 'pending' ? 0 : 1;
      const sb = (b.status || 'active') === 'pending' ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const getStatusText = (status?: TeacherStatus) => {
    const s = status || 'active';
    if (s === 'pending') return { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-900 border-amber-400' };
    if (s === 'rejected') return { label: 'مرفوض', cls: 'bg-red-100 text-red-900 border-red-400' };
    return { label: 'مقبول ومفعّل', cls: 'bg-emerald-100 text-emerald-900 border-emerald-400' };
  };

  const handleDownloadCertImage = async (cert: TeacherCertificate) => {
    if (!cert.imageUrl) return;
    try {
      const res = await fetch(cert.imageUrl);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      await executeUniversalDownload(
        blob,
        `شهادة-${cert.name || 'معلم'}.${ext}`,
        blob.type || 'image/jpeg',
        setDownloadState
      );
    } catch {
      const a = document.createElement('a');
      a.href = cert.imageUrl;
      a.download = `شهادة-${cert.name || 'معلم'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const activeDetail = selectedTeacher
    ? teachers.find((t) => t.id === selectedTeacher.id) || selectedTeacher
    : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header & Pending Counter Banner */}
      <div className="furqan-card rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] text-[#c9a227] flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a4d2e]">
              طلبات وتسجيلات المعلمين ({teachers.length})
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              مراجعة بيانات المعلمين الجدد، فحص صور الشهادات، وتفعيل أو رفض الحسابات
            </p>
          </div>
        </div>

        <div
          className={`px-4 py-2.5 rounded-2xl border font-extrabold text-xs sm:text-sm tabular-nums ${
            pendingCount > 0
              ? 'bg-red-50 border-red-400 text-red-900'
              : 'bg-emerald-50 border-emerald-400 text-emerald-900'
          }`}
        >
          {pendingCount > 0
            ? `عندك ${pendingCount} طلبات جديدة مستنية الموافقة`
            : 'لا توجد طلبات جديدة منتظرة حالياً'}
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="furqan-card rounded-2xl p-4 shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#0a4d2e]/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المعلم أو رقم الهاتف..."
            className="w-full h-11 bg-white border border-[#c9a227] rounded-xl pr-10 pl-4 text-xs sm:text-sm text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: `الكل (${teachers.length})` },
            { id: 'pending', label: `قيد المراجعة (${pendingCount})` },
            {
              id: 'active',
              label: `مقبول (${teachers.filter((t) => (t.status || 'active') === 'active').length})`,
            },
            {
              id: 'rejected',
              label: `مرفوض (${teachers.filter((t) => t.status === 'rejected').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold border transition cursor-pointer tabular-nums ${
                statusFilter === tab.id
                  ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                  : 'bg-white text-[#0a4d2e] border-[#c9a227]/60 hover:bg-[#fff9e6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of All Teachers & Registrations */}
      <div className="furqan-card rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-[#0a4d2e]">
            <UserCheck className="w-10 h-10 text-[#c9a227] mx-auto" />
            <p className="text-base font-extrabold">لا توجد طلبات أو تسجيلات تطابق البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a4d2e] text-[#fffdf5]">
                  <th className="py-3 px-3 rounded-tr-xl">الاسم</th>
                  <th className="py-3 px-3">رقم الهاتف</th>
                  <th className="py-3 px-3">السن</th>
                  <th className="py-3 px-3">المحافظة / البلد</th>
                  <th className="py-3 px-3">المواد</th>
                  <th className="py-3 px-3">الساعات والمواعيد</th>
                  <th className="py-3 px-3">الخبرة</th>
                  <th className="py-3 px-3">تاريخ التسجيل</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3 rounded-tl-xl text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a227]/40">
                {filtered.map((t) => {
                  const stInfo = getStatusText(t.status);
                  const effStatus: TeacherStatus = t.status || 'active';
                  const certsCount = t.certificates?.length || 0;
                  const subjectsText =
                    t.subjects && t.subjects.length > 0 ? t.subjects.join('، ') : t.specialization;

                  return (
                    <tr key={t.id} className="hover:bg-[#fff9e6] transition">
                      <td className="py-3 px-3 font-extrabold text-[#0a4d2e]">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacher(t)}
                          className="text-right hover:underline text-[#0a4d2e] cursor-pointer flex items-center gap-2"
                        >
                          {t.avatarUrl && (
                            <img
                              src={t.avatarUrl}
                              alt={t.name}
                              className="w-8 h-8 rounded-lg object-cover border border-[#c9a227] shrink-0"
                            />
                          )}
                          <span>{t.name}</span>
                          <Eye className="w-3.5 h-3.5 text-[#c9a227] shrink-0" />
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-800" dir="ltr">
                        {t.normalizedPhone || t.phone || '—'}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-semibold">
                        {t.age ? `${t.age} سنة` : '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold">{t.location || t.gender || '—'}</td>
                      <td className="py-3 px-3 max-w-[210px]">
                        <div className="space-y-0.5">
                          {t.teachingSystems && (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#0a4d2e] text-white text-[10px] font-bold">
                              {TEACHER_SYSTEM_LABELS[t.teachingSystems]}
                            </span>
                          )}
                          <span className="block line-clamp-2 text-xs text-slate-700 font-bold">
                            {subjectsText}
                          </span>
                          {t.teachingStages && t.teachingStages.length > 0 && (
                            <span className="block text-[10px] text-[#9a7510] font-semibold">
                              {t.teachingStages.join('، ')}
                              {t.teachingGrades?.length ? ` (${t.teachingGrades.join('، ')})` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold tabular-nums">
                        {t.dailyHours
                          ? `${t.dailyHours} ساعات (${t.availablePeriod || 'متاح'})`
                          : certsCount > 0
                          ? `${certsCount} شهادة`
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-xs font-bold tabular-nums text-[#0a4d2e]">
                        {typeof t.experienceYears === 'number' ? `${t.experienceYears} سنوات` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs tabular-nums text-slate-700" dir="ltr">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString('ar-EG')
                          : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-extrabold whitespace-nowrap ${stInfo.cls}`}
                        >
                          {stInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {effStatus !== 'active' && (
                            <button
                              type="button"
                              onClick={() => onApproveTeacher(t.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>قبول وتفعيل</span>
                            </button>
                          )}
                          {effStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => onRejectTeacher(t.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteTeacher(t.id)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer"
                            title="حذف التسجيل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Teacher Detail & Certificates Modal */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl furqan-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0a4d2e] text-white border-b border-[#c9a227]">
              <div>
                <h3 className="text-lg font-extrabold">{activeDetail.name}</h3>
                <p className="text-xs text-[#fff9e6]/80">ملف التسجيل الكامل والشهادات المرفقة</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 text-sm">
              {/* Profile Avatar & Info Grid */}
              {activeDetail.avatarUrl && (
                <div className="flex items-center gap-3 bg-white border border-[#c9a227]/60 rounded-2xl p-3">
                  <img
                    src={activeDetail.avatarUrl}
                    alt={activeDetail.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#c9a227]"
                  />
                  <div>
                    <p className="text-sm font-extrabold text-[#0a4d2e]">{activeDetail.name}</p>
                    <p className="text-xs text-slate-600">{activeDetail.location || 'معلم بأكاديمية الفرقان'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">رقم الهاتف / واتساب</span>
                  <span className="font-mono font-bold text-[#0a4d2e] flex items-center gap-1" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-[#c9a227]" />
                    {activeDetail.normalizedPhone || activeDetail.phone}
                  </span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">السن</span>
                  <span className="font-bold text-[#0a4d2e] tabular-nums">
                    {activeDetail.age ? `${activeDetail.age} سنة` : '—'}{' '}
                    {activeDetail.birthDate ? `(${activeDetail.birthDate})` : ''}
                  </span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">المحافظة / البلد</span>
                  <span className="font-bold text-[#0a4d2e]">{activeDetail.location || activeDetail.gender || '—'}</span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">الساعات اليومية والمواعيد</span>
                  <span className="font-bold text-[#0a4d2e] tabular-nums">
                    {activeDetail.dailyHours ? `${activeDetail.dailyHours} ساعة` : '—'}{' '}
                    {activeDetail.availablePeriod ? `(${activeDetail.availablePeriod})` : ''}
                  </span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">سنوات الخبرة</span>
                  <span className="font-bold text-[#0a4d2e] tabular-nums">
                    {typeof activeDetail.experienceYears === 'number'
                      ? `${activeDetail.experienceYears} سنوات`
                      : '—'}
                  </span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">حالة الحساب</span>
                  <span className="font-extrabold text-[#0a4d2e]">
                    {getStatusText(activeDetail.status).label}
                  </span>
                </div>
                <div className="bg-white border border-[#c9a227]/60 rounded-xl p-3 col-span-2 sm:col-span-3 space-y-1">
                  <span className="text-slate-500 block mb-0.5">النظام والمراحل والمواد</span>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {activeDetail.teachingSystems && (
                      <span className="px-2 py-0.5 rounded bg-[#0a4d2e] text-white text-[11px] font-bold">
                        {TEACHER_SYSTEM_LABELS[activeDetail.teachingSystems]}
                      </span>
                    )}
                    {activeDetail.teachingMode && (
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 text-[11px] font-bold">
                        {activeDetail.teachingMode === 'single' ? 'مادة واحدة فقط' : 'مواد متعددة'}
                      </span>
                    )}
                    {activeDetail.teachingStages && activeDetail.teachingStages.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold">
                        المراحل: {activeDetail.teachingStages.join('، ')}
                      </span>
                    )}
                    {activeDetail.teachingGrades && activeDetail.teachingGrades.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                        الصفوف: {activeDetail.teachingGrades.join('، ')}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-[#0a4d2e] block">
                    {activeDetail.subjects && activeDetail.subjects.length > 0
                      ? activeDetail.subjects.join(' • ')
                      : activeDetail.specialization}
                  </span>
                </div>
              </div>

              {/* Certificates List */}
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-[#0a4d2e] flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#c9a227]" />
                  <span>الشهادات المرفقة ({activeDetail.certificates?.length || 0})</span>
                </h4>

                {!activeDetail.certificates || activeDetail.certificates.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#c9a227] rounded-2xl p-6 text-center text-xs text-slate-600">
                    لم يتم إرفاق شهادات مع هذا الحساب.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDetail.certificates.map((cert, i) => (
                      <div
                        key={cert.id || i}
                        className="bg-white border border-[#c9a227] rounded-2xl p-3 space-y-2.5"
                      >
                        <p className="text-xs font-extrabold text-[#0a4d2e] truncate">
                          {cert.name}
                        </p>
                        {cert.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setLightboxCert(cert)}
                            className="relative group w-full h-36 rounded-xl overflow-hidden border border-[#c9a227]/60 block cursor-pointer"
                          >
                            <img
                              src={cert.imageUrl}
                              alt={cert.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5">
                              <ZoomIn className="w-4 h-4" />
                              <span>تكبير الصورة</span>
                            </div>
                          </button>
                        ) : (
                          <div className="h-24 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                            بدون صورة
                          </div>
                        )}
                        {cert.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadCertImage(cert)}
                            className="w-full py-1.5 rounded-lg bg-[#fff9e6] hover:bg-[#c9a227]/20 border border-[#c9a227] text-[#0a4d2e] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل الصورة</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-[#c9a227]/40">
                <button
                  type="button"
                  onClick={() => {
                    onApproveTeacher(activeDetail.id);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>قبول وتفعيل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRejectTeacher(activeDetail.id);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>رفض</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTeacher(activeDetail.id);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف التسجيل</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Image Lightbox Modal */}
      {lightboxCert && (
        <div
          onClick={() => setLightboxCert(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#fffdf5] border-2 border-[#c9a227] rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-extrabold text-[#0a4d2e]">{lightboxCert.name}</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCertImage(lightboxCert)}
                  className="px-3.5 py-2 rounded-xl bg-[#0a4d2e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#c9a227]" />
                  <span>تحميل الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxCert(null)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-2xl border border-[#c9a227] bg-black/5 flex items-center justify-center">
              <img
                src={lightboxCert.imageUrl}
                alt={lightboxCert.name}
                className="max-w-full max-h-[72vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
