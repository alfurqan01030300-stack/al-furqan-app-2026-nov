import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, FileText, GraduationCap, Search, Users } from 'lucide-react';
import {
  buildAllCurriculumGroups,
  EDUCATION_STAGES,
  EDUCATION_SYSTEM_LABELS,
  getStudentEnrolledSubjects,
  subjectsMatch,
} from '../data/curricula';
import { EducationStage, EducationSystem, Student, Teacher } from '../types';
import { CurriculumLibraryBadgeSvg } from './CurriculumLibraryIcon';

interface CurriculumLibraryViewProps {
  mode: 'teacher' | 'student' | 'parent';
  teacher?: Teacher | null;
  student?: Student | null;
  studentsCountBySubject?: Record<string, number>;
  onJumpToSubject?: (subject: string, targetTab: 'students' | 'exams' | 'homework') => void;
}

export const CurriculumLibraryView: React.FC<CurriculumLibraryViewProps> = ({
  mode,
  teacher,
  student,
  studentsCountBySubject = {},
  onJumpToSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | EducationSystem>('all');
  const [stageFilter, setStageFilter] = useState<'all' | EducationStage>('all');

  const allGroups = useMemo(() => buildAllCurriculumGroups(), []);

  // Subjects taught by the teacher (for quick-jump highlights)
  const teacherSubjects = useMemo(() => {
    if (!teacher) return [];
    return Array.isArray(teacher.subjects) ? teacher.subjects : [];
  }, [teacher]);

  const isTeacherTeachingSubject = (subj: string) =>
    teacherSubjects.some((ts) => subjectsMatch(ts, subj));

  // For Student & Parent modes, strictly scope view to enrolled subjects ONLY
  const studentEnrolledSubjects = useMemo(() => {
    if (!student) return [];
    return getStudentEnrolledSubjects(student);
  }, [student]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allGroups
      .filter((grp) => {
        if (mode === 'student' || mode === 'parent') {
          if (student?.educationSystem && grp.system !== student.educationSystem) return false;
          if (student?.stage && !grp.stage.includes(student.stage.trim()) && !student.stage.includes(grp.stage)) {
            return false;
          }
          if (student?.stage === 'ثانوي' && student?.track && grp.track && grp.track !== student.track) {
            return false;
          }
        } else {
          if (systemFilter !== 'all' && grp.system !== systemFilter) return false;
          if (stageFilter !== 'all' && grp.stage !== stageFilter) return false;
        }
        return true;
      })
      .map((grp) => {
        const scopedSubjects =
          mode === 'student' || mode === 'parent'
            ? grp.subjects.filter((s) =>
                studentEnrolledSubjects.some((es) => subjectsMatch(es, s))
              )
            : grp.subjects;

        const searchedSubjects = q
          ? scopedSubjects.filter((s) => s.toLowerCase().includes(q))
          : scopedSubjects;

        return {
          ...grp,
          subjects: searchedSubjects,
        };
      })
      .filter((grp) => grp.subjects.length > 0);
  }, [allGroups, mode, student, studentEnrolledSubjects, systemFilter, stageFilter, searchQuery]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#0B3D2E] border-2 border-[#D4AF37]/45 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#07241B] border-2 border-[#D4AF37]/70 flex items-center justify-center shrink-0">
              <CurriculumLibraryBadgeSvg className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white">
                {mode === 'teacher' ? 'المقررات كلها — كل المناهج (عام + أزهري)' : 'مقرراتي ومناهجي الدراسية'}
              </h2>
              <p className="text-xs text-[#F3E5AB] mt-0.5">
                {mode === 'teacher'
                  ? 'تصفّح جميع مناهج النظام العام والأزهري مع بحث سريع وانتقال فوري لطلاب ودرجات وواجبات المواد التي تدرّسها'
                  : `تظهر هنا فقط المواد المسجل بها الطالب (${student?.name || ''}) حسب نظامه وصفه`}
              </p>
            </div>
          </div>

          {mode === 'teacher' && teacherSubjects.length > 0 && (
            <div className="bg-[#07241B]/90 border border-[#D4AF37]/40 rounded-2xl px-4 py-2.5 text-xs space-y-1">
              <span className="text-[#D4AF37] font-bold block">انتقال سريع لموادك:</span>
              <div className="flex flex-wrap gap-1.5">
                {teacherSubjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => onJumpToSubject?.(subj, 'students')}
                    className="px-2.5 py-1 rounded-lg bg-[#c9a227] hover:bg-[#d8b43c] text-[#07241B] font-extrabold text-[11px] cursor-pointer whitespace-nowrap transition"
                  >
                    {subj} ←
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search + Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المادة (مثال: فيزياء، فقه، قرآن كريم، رياضيات...)"
              className="w-full h-11 bg-white border border-[#D4AF37]/50 rounded-xl pr-10 pl-4 text-xs sm:text-sm text-slate-900 focus:outline-none"
            />
          </div>

          {mode === 'teacher' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(['all', 'general', 'azhar'] as const).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSystemFilter(sys)}
                  className={`px-3.5 py-2 rounded-xl font-extrabold border transition cursor-pointer whitespace-nowrap ${
                    systemFilter === sys
                      ? 'bg-[#c9a227] text-[#07241B] border-[#fffdf5]'
                      : 'bg-[#07241B] text-[#F3E5AB] border-[#D4AF37]/40 hover:bg-[#145A43]'
                  }`}
                >
                  {sys === 'all' ? 'كل الأنظمة' : EDUCATION_SYSTEM_LABELS[sys]}
                </button>
              ))}

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as 'all' | EducationStage)}
                className="h-9 px-3 rounded-xl bg-white text-slate-900 font-bold border border-[#D4AF37]/50 text-xs"
              >
                <option value="all">كل المراحل</option>
                {EDUCATION_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Student/Parent quick summary of enrolled subjects when no full stage metadata */}
      {(mode === 'student' || mode === 'parent') && student && (
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F3E5AB]">
            <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
            <span>
              المواد المقررة للطالب:{' '}
              <strong className="text-white">{studentEnrolledSubjects.join(' • ')}</strong>
            </span>
          </div>
          {student.educationSystem && (
            <span className="text-xs font-bold text-emerald-300">
              {EDUCATION_SYSTEM_LABELS[student.educationSystem]}
              {student.stage ? ` • ${student.stage}` : ''}
              {student.gradeLevel ? ` • الصف ${student.gradeLevel}` : ''}
              {student.stage === 'ثانوي' && student.track ? ` • ${student.track}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-[#0B3D2E]/80 border border-dashed border-[#D4AF37]/40 rounded-3xl p-10 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-[#D4AF37]/50 mx-auto" />
          <p className="text-base font-bold text-white">لا توجد مقررات مطابقة لبحثك</p>
          <p className="text-xs text-slate-300">
            جرّب مسح كلمة البحث أو تغيير التصفية لعرض المواد المتاحة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGroups.map((grp, idx) => (
            <div
              key={`${grp.system}-${grp.stage}-${grp.track || 'core'}-${idx}`}
              className="bg-[#0B3D2E] border border-[#D4AF37]/35 rounded-3xl p-5 shadow-lg space-y-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                <div>
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
                      grp.system === 'azhar'
                        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-400/50'
                        : 'bg-sky-900/70 text-sky-200 border-sky-400/50'
                    }`}
                  >
                    {grp.systemLabel}
                  </span>
                  <h3 className="text-lg font-bold font-amiri text-white mt-1">
                    المرحلة {grp.stage}
                    {grp.track ? ` — شعبة ${grp.track}` : ''}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#D4AF37] tabular-nums">
                  الصفوف: {grp.grades[0]} — {grp.grades[grp.grades.length - 1]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {grp.subjects.map((subj) => {
                  const taughtByMe = mode === 'teacher' && isTeacherTeachingSubject(subj);
                  const countForSubj = studentsCountBySubject[subj] ?? 0;

                  return (
                    <div
                      key={subj}
                      className={`rounded-2xl p-3 border transition space-y-2 ${
                        taughtByMe
                          ? 'bg-[#07241B] border-[#c9a227] shadow'
                          : 'bg-[#07241B]/70 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-white">{subj}</span>
                        {taughtByMe && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-[#c9a227] text-[#07241B] whitespace-nowrap">
                            تدرّسها ({countForSubj} طالب)
                          </span>
                        )}
                      </div>

                      {mode === 'teacher' && taughtByMe && onJumpToSubject && (
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => onJumpToSubject(subj, 'students')}
                            className="py-1.5 px-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Users className="w-3 h-3" />
                            <span>طلابي</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onJumpToSubject(subj, 'exams')}
                            className="py-1.5 px-2 rounded-lg bg-[#c9a227]/90 hover:bg-[#d8b43c] text-[#07241B] text-[11px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <ClipboardCheck className="w-3 h-3" />
                            <span>درجاتها</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onJumpToSubject(subj, 'homework')}
                            className="py-1.5 px-2 rounded-lg bg-sky-700/80 hover:bg-sky-600 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <FileText className="w-3 h-3" />
                            <span>واجباتها</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
