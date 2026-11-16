import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  GraduationCap,
  Layers,
  MessageSquare,
  Phone,
  Users,
  X,
} from 'lucide-react';
import {
  ALL_GRADES_LIST,
  AZHAR_PREP_SUBJECTS,
  AZHAR_PRIMARY_SUBJECTS,
  AZHAR_SEC_SHARED_SUBJECTS,
  AZHAR_SEC_SPECIALIZATION_BY_TRACK,
  doesStudentBelongToGrade,
  doesStudentBelongToGradeSubject,
  doesTeacherCoverGrade,
  doesTeacherCoverGradeSubject,
  EDUCATION_SYSTEM_LABELS,
  formatStudentCurriculumBadge,
  GENERAL_PREP_SUBJECTS,
  GENERAL_PRIMARY_SUBJECTS,
  GENERAL_SEC_ALL_SUBJECTS,
  GENERAL_SEC_BY_TRACK,
  GradeEntry,
  SECONDARY_TRACKS,
  TEACHER_SYSTEM_LABELS,
} from '../data/curricula';
import { EducationSystem, SecondaryTrack, Student, Teacher } from '../types';
import { cleanWhatsAppNumber } from '../utils/storage';

interface AdminCurriculaSectionProps {
  students: Student[];
  teachers: Teacher[];
  onSelectStudent: (student: Student) => void;
  selectedGradeId?: string | null;
  onChangeGradeId?: (gradeId: string | null) => void;
}

export const AdminCurriculaSection: React.FC<AdminCurriculaSectionProps> = ({
  students,
  teachers,
  onSelectStudent,
  selectedGradeId,
  onChangeGradeId,
}) => {
  // Independent per-grade page selection (controlled when passed from sidebar, or local fallback)
  const [internalGradeId, setInternalGradeId] = useState<string | null>(null);
  const activeGradeId =
    selectedGradeId !== undefined ? selectedGradeId : internalGradeId;

  const setActiveGrade = (grade: GradeEntry | null) => {
    const nextId = grade ? grade.id : null;
    if (onChangeGradeId) {
      onChangeGradeId(nextId);
    } else {
      setInternalGradeId(nextId);
    }
  };

  const selectedGrade = useMemo(
    () => (activeGradeId ? ALL_GRADES_LIST.find((g) => g.id === activeGradeId) || null : null),
    [activeGradeId]
  );

  const [secTrackFilter, setSecTrackFilter] = useState<'all' | SecondaryTrack>('all');
  const [selectedSubjectContext, setSelectedSubjectContext] = useState<{
    system: EducationSystem;
    subject: string;
  } | null>(null);

  useEffect(() => {
    setSelectedSubjectContext(null);
    setSecTrackFilter('all');
  }, [activeGradeId]);

  const stageGroups = useMemo(
    () => [
      {
        stage: 'ابتدائي' as const,
        title: 'المرحلة الابتدائية',
        accent: 'border-emerald-400/50 bg-[#0d5936]/30',
        grades: ALL_GRADES_LIST.filter((g) => g.stage === 'ابتدائي'),
      },
      {
        stage: 'إعدادي' as const,
        title: 'المرحلة الإعدادية',
        accent: 'border-[#c9a227]/60 bg-[#0d5936]/30',
        grades: ALL_GRADES_LIST.filter((g) => g.stage === 'إعدادي'),
      },
      {
        stage: 'ثانوي' as const,
        title: 'المرحلة الثانوية',
        accent: 'border-amber-400/60 bg-[#0d5936]/30',
        grades: ALL_GRADES_LIST.filter((g) => g.stage === 'ثانوي'),
      },
    ],
    []
  );

  // Curricula strictly for the currently opened single grade
  const currentGradeCurricula = useMemo(() => {
    if (!selectedGrade) return null;

    if (selectedGrade.stage === 'ابتدائي') {
      return {
        generalSubjects: [...GENERAL_PRIMARY_SUBJECTS],
        azharShared: [...AZHAR_PRIMARY_SUBJECTS],
        azharTrackSubjects: [] as string[],
      };
    }

    if (selectedGrade.stage === 'إعدادي') {
      return {
        generalSubjects: [...GENERAL_PREP_SUBJECTS],
        azharShared: [...AZHAR_PREP_SUBJECTS],
        azharTrackSubjects: [] as string[],
      };
    }

    // ثانوي
    const generalSubjects =
      secTrackFilter === 'all'
        ? [...GENERAL_SEC_ALL_SUBJECTS]
        : [...GENERAL_SEC_BY_TRACK[secTrackFilter]];

    const azharTrackSubjects =
      secTrackFilter === 'all'
        ? Array.from(
            new Set([
              ...AZHAR_SEC_SPECIALIZATION_BY_TRACK['علمي علوم'],
              ...AZHAR_SEC_SPECIALIZATION_BY_TRACK['أدبي'],
            ])
          )
        : [...AZHAR_SEC_SPECIALIZATION_BY_TRACK[secTrackFilter]];

    return {
      generalSubjects,
      azharShared: [...AZHAR_SEC_SHARED_SUBJECTS],
      azharTrackSubjects,
    };
  }, [selectedGrade, secTrackFilter]);

  const subjectDetailStudents = useMemo(() => {
    if (!selectedGrade || !selectedSubjectContext) return [];
    return students.filter((st) => {
      const ok = doesStudentBelongToGradeSubject(
        st,
        selectedGrade.stage,
        selectedGrade.gradeLevel,
        selectedSubjectContext.system,
        selectedSubjectContext.subject
      );
      if (!ok) return false;
      if (selectedGrade.stage === 'ثانوي' && secTrackFilter !== 'all' && st.track) {
        return st.track === secTrackFilter;
      }
      return true;
    });
  }, [students, selectedGrade, selectedSubjectContext, secTrackFilter]);

  const subjectDetailTeachers = useMemo(() => {
    if (!selectedGrade || !selectedSubjectContext) return [];
    return teachers.filter((t) =>
      doesTeacherCoverGradeSubject(
        t,
        selectedGrade.stage,
        selectedGrade.gradeLevel,
        selectedSubjectContext.system,
        selectedSubjectContext.subject
      )
    );
  }, [teachers, selectedGrade, selectedSubjectContext]);

  // -------------------------------------------------------------------------
  // LEVEL 1: GRADES CARDS INDEX ONLY (Each grade in its own standalone card)
  // -------------------------------------------------------------------------
  if (!selectedGrade || !currentGradeCurricula) {
    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-12">
        <div className="furqan-card rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0a4d2e] border border-[#c9a227] flex items-center justify-center text-[#c9a227] shrink-0">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#0a4d2e]">
                المناهج الدراسية — قائمة الصفوف
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                اختر أي صف للدخول إلى صفحته المستقلة وعرض مناهجه (مصري عام / أزهري) وطلابه ومدرسيه فقط
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a4d2e] text-[#fffdf5] text-xs font-extrabold self-start sm:self-auto shrink-0">
            <Layers className="w-4 h-4 text-[#c9a227]" />
            <span>{ALL_GRADES_LIST.length} صفوف دراسية مستقلة</span>
          </span>
        </div>

        <div className="space-y-6">
          {stageGroups.map((group) => (
            <section
              key={group.stage}
              className="bg-[#073923]/90 border border-[#c9a227]/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 w-full max-w-full"
            >
              <div className="flex items-center justify-between border-b border-[#c9a227]/25 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-[#F3E5AB] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#c9a227]" />
                  <span>{group.title}</span>
                </h3>
                <span className="text-xs font-bold text-slate-300 tabular-nums">
                  {group.grades.length} صفوف
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.grades.map((grade) => {
                  const gradeStudentsCount = students.filter((st) =>
                    doesStudentBelongToGrade(st, grade.stage, grade.gradeLevel)
                  ).length;
                  const gradeTeachersCount = teachers.filter((t) =>
                    doesTeacherCoverGrade(t, grade.stage, grade.gradeLevel)
                  ).length;

                  return (
                    <button
                      key={grade.id}
                      type="button"
                      onClick={() => {
                        setActiveGrade(grade);
                        setSelectedSubjectContext(null);
                        setSecTrackFilter('all');
                      }}
                      className="text-right furqan-card hover:bg-[#fff9e0] rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-xl border-2 border-[#c9a227] transition cursor-pointer flex flex-col justify-between gap-3 w-full"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[11px] font-bold text-[#9a7510] mb-1">
                            {grade.stageTitle}
                          </span>
                          <h4 className="text-base sm:text-lg font-extrabold text-[#0a4d2e]">
                            {grade.title}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-[#0a4d2e] text-[#F3E5AB] text-[11px] font-extrabold shrink-0">
                          فتح الصفحة ←
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#c9a227]/35 text-xs font-bold">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-[#0a4d2e] tabular-nums">
                          <Users className="w-3.5 h-3.5 text-[#0a4d2e]" />
                          <span>{gradeStudentsCount} طالب</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 tabular-nums">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-800" />
                          <span>{gradeTeachersCount} مدرس</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // LEVEL 2: DEDICATED SINGLE-GRADE PAGE (Shows ONLY selectedGrade curricula)
  // -------------------------------------------------------------------------
  const gradeStudentsTotal = students.filter((st) =>
    doesStudentBelongToGrade(st, selectedGrade.stage, selectedGrade.gradeLevel)
  ).length;

  const renderSubjectButton = (system: EducationSystem, subject: string) => {
    const isActive =
      selectedSubjectContext?.system === system && selectedSubjectContext?.subject === subject;
    const enrolledCount = students.filter((st) =>
      doesStudentBelongToGradeSubject(st, selectedGrade.stage, selectedGrade.gradeLevel, system, subject)
    ).length;
    const teachersCount = teachers.filter((t) =>
      doesTeacherCoverGradeSubject(t, selectedGrade.stage, selectedGrade.gradeLevel, system, subject)
    ).length;

    return (
      <button
        key={`${system}-${subject}`}
        type="button"
        onClick={() => setSelectedSubjectContext({ system, subject })}
        className={`w-full text-right rounded-2xl p-3.5 border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
          isActive
            ? 'bg-[#c9a227] text-[#07241B] border-[#0a4d2e] shadow-lg'
            : 'bg-white hover:bg-[#fff9e6] text-[#0a4d2e] border-[#c9a227]/65'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold">{subject}</span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
              isActive ? 'bg-[#07241B] text-[#F3E5AB]' : 'bg-[#0a4d2e]/10 text-[#0a4d2e]'
            }`}
          >
            عرض التفاصيل
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <span
            className={`px-2 py-0.5 rounded-lg tabular-nums ${
              isActive ? 'bg-[#07241B]/15 text-[#07241B]' : 'bg-emerald-50 text-emerald-900'
            }`}
          >
            {enrolledCount} طالب
          </span>
          <span
            className={`px-2 py-0.5 rounded-lg tabular-nums ${
              isActive ? 'bg-[#07241B]/15 text-[#07241B]' : 'bg-amber-50 text-amber-900'
            }`}
          >
            {teachersCount} مدرس
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 pb-12">
      {/* Top Independent Grade Page Header + Back to Grades List */}
      <div className="furqan-card rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveGrade(null);
              setSelectedSubjectContext(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-[#c9a227]" />
            <span>العودة لقائمة الصفوف</span>
          </button>

          <div>
            <span className="text-[11px] font-extrabold text-[#9a7510] block">
              {selectedGrade.stageTitle} — صفحة منفصلة
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#0a4d2e]">
              مناهج {selectedGrade.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-[#0a4d2e] border border-[#c9a227]/40 tabular-nums">
            إجمالي طلاب الصف: {gradeStudentsTotal}
          </span>
        </div>
      </div>

      {/* Secondary Track Selector (Only shown when selectedGrade is ثانوي) */}
      {selectedGrade.stage === 'ثانوي' && (
        <div className="furqan-card-subtle rounded-2xl p-4 border border-[#c9a227] space-y-2">
          <span className="block text-xs font-extrabold text-[#0a4d2e]">
            تصفية مناهج {selectedGrade.title} حسب الشعبة:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSecTrackFilter('all');
                setSelectedSubjectContext(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                secTrackFilter === 'all'
                  ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                  : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
              }`}
            >
              كل مواد {selectedGrade.title}
            </button>
            {SECONDARY_TRACKS.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => {
                  setSecTrackFilter(tr);
                  setSelectedSubjectContext(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                  secTrackFilter === tr
                    ? 'bg-[#0a4d2e] text-white border-[#c9a227]'
                    : 'bg-white text-[#0a4d2e] border-[#c9a227]/60'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Subject Students & Teacher Panel (Strictly for THIS Grade & System & Subject) */}
      {selectedSubjectContext && (
        <section className="bg-[#073923] border-2 border-[#c9a227] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c9a227]/30 pb-3">
            <div>
              <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#c9a227] text-[#07241B] mb-1">
                {EDUCATION_SYSTEM_LABELS[selectedSubjectContext.system]} • {selectedGrade.title}
              </span>
              <h3 className="text-base sm:text-xl font-extrabold text-[#F3E5AB]">
                مادة: {selectedSubjectContext.subject}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSubjectContext(null)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إغلاق التفاصيل</span>
            </button>
          </div>

          {/* Teachers for this subject & grade */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-extrabold text-[#F3E5AB] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#c9a227]" />
              <span>
                المدرس المسؤول عن مادة {selectedSubjectContext.subject} ({selectedGrade.title}) — ({subjectDetailTeachers.length})
              </span>
            </h4>

            {subjectDetailTeachers.length === 0 ? (
              <div className="rounded-2xl bg-[#062E1C] border border-white/10 p-4 text-xs text-slate-300">
                لا يوجد مدرس مسجل حالياً لمادة «{selectedSubjectContext.subject}» في {selectedGrade.title} ({EDUCATION_SYSTEM_LABELS[selectedSubjectContext.system]}).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjectDetailTeachers.map((t) => {
                  const waPhone = cleanWhatsAppNumber(t.phone);
                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl bg-[#062E1C] border border-[#c9a227]/45 p-3.5 flex flex-wrap items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <h5 className="text-sm font-extrabold text-white truncate">أ. {t.name}</h5>
                        <p className="text-[11px] text-[#e5c76b]">
                          {TEACHER_SYSTEM_LABELS[t.teachingSystems || 'both']}
                        </p>
                        <p className="text-[11px] text-slate-300 font-mono mt-0.5">{t.phone}</p>
                      </div>
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-[#07241B] text-xs font-extrabold shrink-0"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Students enrolled in this subject & grade */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <h4 className="text-sm font-extrabold text-[#F3E5AB] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c9a227]" />
              <span>
                الطلبة المقدمين في مادة {selectedSubjectContext.subject} بـ {selectedGrade.title} — ({subjectDetailStudents.length})
              </span>
            </h4>

            {subjectDetailStudents.length === 0 ? (
              <div className="rounded-2xl bg-[#062E1C] border border-white/10 p-4 text-xs text-slate-300">
                لا يوجد طلبة مسجلون في مادة «{selectedSubjectContext.subject}» بـ {selectedGrade.title} ({EDUCATION_SYSTEM_LABELS[selectedSubjectContext.system]}) حتى الآن.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjectDetailStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStudent(st)}
                    className="text-right rounded-2xl bg-[#fffdf5] hover:bg-[#fff7db] text-[#0a4d2e] border-2 border-[#c9a227] p-3.5 flex items-center justify-between gap-2.5 cursor-pointer transition w-full"
                  >
                    <div className="min-w-0">
                      <h5 className="text-sm font-extrabold truncate">{st.name}</h5>
                      <p className="text-[11px] font-bold text-[#9a7510] truncate mt-0.5">
                        {formatStudentCurriculumBadge(st) || st.course}
                      </p>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-[#0a4d2e]" />
                        <span>{st.phone}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#0a4d2e] text-[#fffdf5] text-[11px] font-extrabold shrink-0">
                      فتح الملف
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* System Columns for THIS Grade ONLY (مصري عام vs أزهري) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-full">
        {/* General System (مصري عام) */}
        <section className="furqan-card rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#c9a227]/40 pb-3">
            <div>
              <span className="text-[11px] font-bold text-[#9a7510] block">النظام الأول</span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0a4d2e]">
                مصري عام — {selectedGrade.title}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#0a4d2e] text-[#F3E5AB] text-xs font-extrabold tabular-nums">
              {currentGradeCurricula.generalSubjects.length} مادة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentGradeCurricula.generalSubjects.map((subj) =>
              renderSubjectButton('general', subj)
            )}
          </div>
        </section>

        {/* Azhar System (أزهري) */}
        <section className="furqan-card rounded-3xl p-4 sm:p-5 shadow-lg space-y-4 border-2 border-[#0a4d2e]">
          <div className="flex items-center justify-between gap-2 border-b border-[#c9a227]/40 pb-3">
            <div>
              <span className="text-[11px] font-bold text-[#9a7510] block">النظام الثاني</span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0a4d2e]">
                أزهري — {selectedGrade.title}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#0a4d2e] text-[#F3E5AB] text-xs font-extrabold tabular-nums">
              {currentGradeCurricula.azharShared.length +
                currentGradeCurricula.azharTrackSubjects.length}{' '}
              مادة
            </span>
          </div>

          {selectedGrade.stage === 'ثانوي' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-[#9a7510]">
                  المواد الأساسية والشرعية المشتركة:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentGradeCurricula.azharShared.map((subj) =>
                    renderSubjectButton('azhar', subj)
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#c9a227]/35">
                <h4 className="text-xs font-extrabold text-[#9a7510]">
                  مواد التخصص ({secTrackFilter === 'all' ? 'علمي / أدبي' : secTrackFilter}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentGradeCurricula.azharTrackSubjects.map((subj) =>
                    renderSubjectButton('azhar', subj)
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentGradeCurricula.azharShared.map((subj) =>
                renderSubjectButton('azhar', subj)
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
