import React from 'react';
import {
  User,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Star,
  Clock,
} from 'lucide-react';
import { Student } from '../types';
import { getDaysUntilDate } from '../utils/storage';
import {
  formatStudentCurriculumBadge,
  getStudentEnrolledSubjects,
} from '../data/curricula';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
  const isPaid = student.feeStatus === 'paid';
  const stars = student.stars ?? 0;
  const completedJuz = student.completedJuz ?? 0;
  const progressPercent = Math.min(100, Math.round((completedJuz / 30) * 100));
  const daysUntilDue = getDaysUntilDate(student.nextPaymentDate);
  const paymentDueSoon = daysUntilDue !== null && daysUntilDue <= 3;
  const curriculumBadge = formatStudentCurriculumBadge(student);
  const enrolledSubjects = getStudentEnrolledSubjects(student);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group furqan-card rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-[#0a4d2e] truncate">
                {student.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                {student.stage && (
                  <span className="font-bold text-[#9a7510]">{student.stage}</span>
                )}
                {student.age && <span className="tabular-nums">السن: {student.age}</span>}
                <span className="inline-flex items-center gap-0.5 text-[#9a7510] font-extrabold tabular-nums">
                  <Star className="w-3 h-3 fill-[#c9a227] text-[#c9a227]" />
                  {stars}/10
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>دَفَعَ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span>لم يدفع</span>
              </span>
            )}
          </div>
        </div>

        {/* Halaqa / Curriculum & Subjects */}
        <div className="furqan-card-subtle rounded-xl p-2.5 my-2.5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#0a4d2e] font-bold">
            <BookOpen className="w-3.5 h-3.5 text-[#9a7510] shrink-0" />
            <span className="truncate">
              {curriculumBadge || (student.halaqaName ? `${student.halaqaName} • ` : '') + student.course}
            </span>
          </div>

          {enrolledSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {enrolledSubjects.slice(0, 4).map((subj) => (
                <span
                  key={subj}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#c9a227]/60 text-[10px] font-bold text-[#0a4d2e]"
                >
                  {subj}
                </span>
              ))}
              {enrolledSubjects.length > 4 && (
                <span className="px-2 py-0.5 rounded-md bg-[#0a4d2e] text-[#fffdf5] text-[10px] font-bold">
                  +{enrolledSubjects.length - 4}
                </span>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
              <span className="tabular-nums font-semibold">الحفظ: {completedJuz} / 30 جزء</span>
              <span className="text-[#9a7510] font-bold truncate max-w-[130px]">
                {student.currentSurah || 'سورة الفاتحة'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#0a4d2e]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0a4d2e]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {paymentDueSoon && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-400 rounded-lg px-2.5 py-1 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              {daysUntilDue! < 0
                ? `تأخر التجديد (${student.nextPaymentDate})`
                : daysUntilDue === 0
                ? 'موعد التجديد اليوم'
                : `متبقي ${daysUntilDue} أيام على التجديد`}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#c9a227]/35 text-xs">
        <span className="text-slate-600 truncate">
          ولي الأمر: <strong className="text-[#0a4d2e]">{student.parentName || '-'}</strong>
        </span>

        <div className="flex items-center gap-1 text-[#0a4d2e] font-extrabold transition shrink-0">
          <span>فتح الملف</span>
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
