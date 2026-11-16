import React, { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  EducationStage,
  EducationSystem,
  SecondaryTrack,
  Student,
  StudyScope,
} from '../types';
import { StudentCard } from './StudentCard';
import {
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  getGradesForStage,
  normalizeStageLabel,
  SECONDARY_TRACKS,
} from '../data/curricula';

interface StudentsListSectionProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onAddNewStudent: () => void;
  onOpenTrialModal?: () => void;
}

export const StudentsListSection: React.FC<StudentsListSectionProps> = ({
  students,
  onSelectStudent,
  onAddNewStudent,
  onOpenTrialModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [sysFilter, setSysFilter] = useState<'all' | EducationSystem>('all');
  const [stageFilter, setStageFilter] = useState<'all' | EducationStage>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | SecondaryTrack>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | StudyScope>('all');

  const gradeOptions = useMemo(() => {
    if (stageFilter !== 'all') return getGradesForStage(stageFilter);
    return ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  }, [stageFilter]);

  const hasCurriculumFilter =
    sysFilter !== 'all' ||
    stageFilter !== 'all' ||
    gradeFilter !== 'all' ||
    trackFilter !== 'all' ||
    scopeFilter !== 'all';

  const resetCurriculumFilters = () => {
    setSysFilter('all');
    setStageFilter('all');
    setGradeFilter('all');
    setTrackFilter('all');
    setScopeFilter('all');
  };

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.halaqaName && s.halaqaName.toLowerCase().includes(q)) ||
      (s.parentName && s.parentName.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'paid' && s.feeStatus !== 'paid') return false;
    if (statusFilter === 'unpaid' && s.feeStatus !== 'unpaid') return false;

    if (sysFilter !== 'all' && s.educationSystem !== sysFilter) return false;
    const normStage = normalizeStageLabel(s.stage);
    if (stageFilter !== 'all' && normStage !== stageFilter) return false;
    if (gradeFilter !== 'all' && s.gradeLevel !== gradeFilter) return false;
    if (trackFilter !== 'all' && s.track !== trackFilter) return false;
    if (scopeFilter !== 'all' && s.studyScope !== scopeFilter) return false;

    return true;
  });

  const paidCount = filteredStudents.filter((s) => s.feeStatus === 'paid').length;
  const unpaidCount = filteredStudents.filter((s) => s.feeStatus === 'unpaid').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner & Add Student Button */}
      <div className="furqan-card rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0a4d2e]">
              قائمة الطلاب (<span className="tabular-nums">{filteredStudents.length}</span> /{' '}
              <span className="tabular-nums">{students.length}</span>)
            </h2>
            <p className="text-xs text-slate-600">
              تصفية حسب النظام، المرحلة، الصف، الشعبة، ونطاق الدراسة (مادة واحدة / كل المواد)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenTrialModal && (
            <button
              type="button"
              onClick={onOpenTrialModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-[#fff9e6] hover:bg-[#f9eec7] text-[#0a4d2e] border border-[#c9a227] shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9a7510]" />
              <span>حصة تجريبية</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddNewStudent}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] font-extrabold text-xs sm:text-sm shadow cursor-pointer transition"
          >
            <UserPlus className="w-4 h-4 text-[#c9a227]" />
            <span>+ إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Curriculum Filter Bar */}
      <div className="furqan-card rounded-2xl p-4 shadow space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#0a4d2e] flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#9a7510]" />
            <span>تصفية حسب المنهج والتقديم:</span>
          </span>
          {hasCurriculumFilter && (
            <button
              type="button"
              onClick={resetCurriculumFilters}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0a4d2e] text-white text-[11px] font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <select
            value={sysFilter}
            onChange={(e) => setSysFilter(e.target.value as 'all' | EducationSystem)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">النظام: الكل</option>
            <option value="general">{EDUCATION_SYSTEM_LABELS.general}</option>
            <option value="azhar">{EDUCATION_SYSTEM_LABELS.azhar}</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              const val = e.target.value as 'all' | EducationStage;
              setStageFilter(val);
              setGradeFilter('all');
              if (val !== 'ثانوي') setTrackFilter('all');
            }}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">المرحلة: الكل</option>
            {EDUCATION_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">الصف: الكل</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                الصف {g}
              </option>
            ))}
          </select>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as 'all' | SecondaryTrack)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">الشعبة: الكل</option>
            {SECONDARY_TRACKS.map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as 'all' | StudyScope)}
            className="h-10 bg-white border border-[#c9a227] rounded-xl px-3 font-bold text-[#0a4d2e]"
          >
            <option value="all">نطاق الدراسة: الكل</option>
            <option value="single">مادة واحدة فقط</option>
            <option value="all">كل المواد</option>
          </select>
        </div>

        {/* Search + Fee Status Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-[#c9a227]/30">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم الطالب، رقم الهاتف، ولي الأمر، أو الحلقة..."
              className="w-full bg-white border border-[#c9a227] rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
            />
            <Search className="w-4 h-4 text-[#9a7510] absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#0a4d2e] text-white'
                  : 'bg-white text-slate-700 border border-[#c9a227]/60'
              }`}
            >
              الكل ({filteredStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-emerald-800 border border-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>دَفَعَ ({paidCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === 'unpaid'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800 border border-amber-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>لم يدفع ({unpaidCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="furqan-card rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-[#c9a227] mx-auto mb-3" />
          <p className="text-base font-extrabold text-[#0a4d2e]">
            {students.length === 0 ? 'لا يوجد طلاب مسجلون حالياً' : 'لا يوجد طلاب مطابقون للبحث أو التصفية'}
          </p>
          <button
            type="button"
            onClick={onAddNewStudent}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#0a4d2e] text-white border border-[#c9a227] text-xs font-extrabold cursor-pointer"
          >
            + إضافة طالب جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onClick={() => onSelectStudent(student)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
