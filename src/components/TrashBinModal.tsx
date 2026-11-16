import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  X,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { TrashEntityType, TrashItem } from '../types';
import { getDaysRemainingInTrash } from '../utils/localDataStore';

interface TrashBinModalProps {
  isOpen: boolean;
  items: TrashItem[];
  onClose: () => void;
  onRestore: (item: TrashItem) => void;
  onRequestPermanentDelete: (item: TrashItem) => void;
}

const TYPE_LABELS: Record<TrashEntityType, string> = {
  student: 'طالب',
  teacher: 'معلم',
  schedule: 'موعد حلقة',
  trialLesson: 'طلب حصة تجريبية',
  halaqa: 'حلقة',
};

function EntityIcon({ type }: { type: TrashEntityType }) {
  if (type === 'student') return <Users className="w-4 h-4 text-[#D4AF37]" />;
  if (type === 'teacher') return <GraduationCap className="w-4 h-4 text-[#D4AF37]" />;
  if (type === 'schedule' || type === 'halaqa') return <Calendar className="w-4 h-4 text-[#D4AF37]" />;
  return <Sparkles className="w-4 h-4 text-[#D4AF37]" />;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  items,
  onClose,
  onRestore,
  onRequestPermanentDelete,
}) => {
  const [filterType, setFilterType] = useState<'all' | TrashEntityType>('all');

  if (!isOpen) return null;

  const filtered =
    filterType === 'all' ? items : items.filter((item) => item.entityType === filterType);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-[#D4AF37]/25 bg-[#07241B]/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-amiri">
                سلة المحذوفات (الاحتفاظ لمدة 30 يوماً)
              </h3>
              <p className="text-xs text-slate-300">
                أي سجل تحذفه يُحفظ هنا 30 يوماً كاملة مع إمكانية الاستعادة قبل المسح النهائي.
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

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-white/10 bg-[#07241B]/40">
          {(
            [
              { id: 'all', label: `الكل (${items.length})` },
              { id: 'student', label: 'الطلاب' },
              { id: 'teacher', label: 'المعلمون' },
              { id: 'halaqa', label: 'الحلقات' },
              { id: 'schedule', label: 'المواعيد' },
              { id: 'trialLesson', label: 'الحصص التجريبية' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                filterType === tab.id
                  ? 'bg-[#D4AF37] text-[#07241B]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Trash2 className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">سلة المحذوفات فارغة حالياً</p>
              <p className="text-xs text-slate-400">
                لا توجد سجلات محذوفة في هذا القسم خلال الـ 30 يوماً الماضية.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const daysLeft = getDaysRemainingInTrash(item.purgeAt);
              const deletedDateStr = new Date(item.deletedAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className="bg-[#07241B]/80 border border-[#D4AF37]/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityIcon type={item.entityType} />
                      <span className="px-2 py-0.5 rounded-lg bg-[#145A43] text-[#F3E5AB] text-[11px] font-bold">
                        {TYPE_LABELS[item.entityType]}
                      </span>
                      <span className="font-extrabold text-sm text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-slate-300 truncate">{item.subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>تاريخ الحذف: {deletedDateStr}</span>
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                        <Clock className="w-3 h-3" />
                        متبقي {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'} قبل المسح النهائي
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestPermanentDelete(item)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-500/40 text-xs font-bold cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نهائي</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
