import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  Users,
  BookOpen,
  BookMarked,
  CalendarCheck,
  FileCheck2,
  Sparkles,
  BarChart3,
  Settings,
  Trash2,
  Database,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { AcademySettings } from '../types';
import { AdminTab } from './Header';
import { ALL_GRADES_LIST } from '../data/curricula';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  selectedGradeId: string | null;
  onSelectGradeId: (gradeId: string | null) => void;
  settings: AcademySettings;
  pendingTeachersCount: number;
  newTrialLessonsCount: number;
  trashCount: number;
  onOpenTrashBin: () => void;
  onOpenFirebaseStatus: () => void;
  firebaseConnected: boolean;
  onOpenTrialModal?: () => void;
  onCheckUpdate?: () => void;
  hasUpdateAvailable?: boolean;
  onSignOut?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  selectedGradeId,
  onSelectGradeId,
  settings,
  pendingTeachersCount,
  newTrialLessonsCount,
  trashCount,
  onOpenTrashBin,
  onOpenFirebaseStatus,
  firebaseConnected,
  onOpenTrialModal,
  onCheckUpdate,
  hasUpdateAvailable = false,
  onSignOut,
}) => {
  const [isCurriculaExpanded, setIsCurriculaExpanded] = useState<boolean>(
    currentTab === 'curricula'
  );

  useEffect(() => {
    if (currentTab === 'curricula') {
      setIsCurriculaExpanded(true);
    }
  }, [currentTab]);

  const topItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'red' | 'amber';
  }> = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    {
      id: 'teacherApps',
      label: 'طلبات المعلمين',
      icon: ClipboardCheck,
      badge: pendingTeachersCount,
      badgeTone: 'red',
    },
    { id: 'teachers', label: 'المدرسين', icon: GraduationCap },
    { id: 'students', label: 'الطلاب', icon: Users },
  ];

  const bottomNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'red' | 'amber';
  }> = [
    { id: 'halaqat', label: 'الحلقات والمجموعات', icon: BookOpen },
    { id: 'attendance', label: 'الحضور والغياب', icon: CalendarCheck },
    { id: 'studentReports', label: 'الدرجات وتقرير الطالب', icon: FileCheck2 },
    {
      id: 'trialLessons',
      label: 'طلبات الحصص التجريبية',
      icon: Sparkles,
      badge: newTrialLessonsCount,
      badgeTone: 'amber',
    },
    { id: 'reports', label: 'التقارير المالية', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const renderNavItem = (item: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'red' | 'amber';
  }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onTabChange(item.id);
          onClose();
        }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
          isActive
            ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227] shadow-md'
            : 'text-slate-100 hover:bg-[#0d5936] hover:text-[#fffdf5] border border-transparent'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-[#c9a227]' : 'text-[#e5c76b]'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </span>

        {item.badge && item.badge > 0 ? (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums shrink-0 ${
              item.badgeTone === 'red'
                ? 'bg-red-600 text-white'
                : 'bg-[#c9a227] text-[#07241B]'
            }`}
          >
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop Overlay on Mobile/Tablet when Slide-Over Sidebar is Open */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="no-print fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Slide-Over Sidebar (Mobile/Tablet) & Persistent Sidebar (Desktop lg+) */}
      <aside
        aria-label="القائمة الجانبية"
        className={`no-print fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] lg:static lg:w-64 lg:max-w-none shrink-0 lg:sticky lg:top-18 lg:h-[calc(100vh-4.5rem)] transform transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0 visible pointer-events-auto shadow-2xl'
            : 'translate-x-full invisible pointer-events-none lg:translate-x-0 lg:visible lg:pointer-events-auto'
        }`}
      >
        <div className="flex flex-col h-full bg-[#073923] border-l border-[#c9a227]/45 text-white select-none">
          {/* Academy Branding Header + Mobile Close Button */}
          <div className="p-4 border-b border-[#c9a227]/30 flex items-center justify-between gap-2 bg-[#062E1C]">
            <div className="flex items-center gap-2.5 min-w-0">
              <AcademyLogo logoUrl={settings.logoDataUrl} size="md" />
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-[#fffdf5] leading-snug truncate">
                  أكاديمية الفرقان العالمية
                </h2>
                <p className="text-[11px] font-bold text-[#e5c76b] truncate">
                  الشيخ عبد المجيد مسعد
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة الجانبية"
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F3E5AB] border border-[#c9a227]/40 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {topItems.map(renderNavItem)}

            {/* المناهج — Directly after الطلاب inside the same Sidebar */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsCurriculaExpanded((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  currentTab === 'curricula'
                    ? 'bg-[#fffdf5] text-[#0a4d2e] border-2 border-[#c9a227] shadow-md'
                    : 'text-slate-100 hover:bg-[#0d5936] hover:text-[#fffdf5] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <BookMarked
                    className={`w-4 h-4 shrink-0 ${
                      currentTab === 'curricula' ? 'text-[#c9a227]' : 'text-[#e5c76b]'
                    }`}
                  />
                  <span className="truncate">المناهج</span>
                </span>
                {isCurriculaExpanded ? (
                  <ChevronUp
                    className={`w-4 h-4 shrink-0 ${
                      currentTab === 'curricula' ? 'text-[#0a4d2e]' : 'text-[#e5c76b]'
                    }`}
                  />
                ) : (
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 ${
                      currentTab === 'curricula' ? 'text-[#0a4d2e]' : 'text-[#e5c76b]'
                    }`}
                  />
                )}
              </button>

              {isCurriculaExpanded && (
                <div className="mr-3 pr-2.5 border-r-2 border-[#c9a227]/45 space-y-1 py-1">
                  {ALL_GRADES_LIST.map((grade) => {
                    const isGradeActive =
                      currentTab === 'curricula' && selectedGradeId === grade.id;
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => {
                          onSelectGradeId(grade.id);
                          onTabChange('curricula');
                          onClose();
                        }}
                        className={`w-full text-right flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isGradeActive
                            ? 'bg-[#c9a227] text-[#07241B] shadow-sm font-extrabold'
                            : 'text-slate-200 hover:bg-[#0d5936] hover:text-[#fffdf5]'
                        }`}
                      >
                        <span className="truncate">{grade.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {bottomNavItems.map(renderNavItem)}
          </nav>

          {/* Bottom Utilities (Includes سلة المحذوفات) */}
          <div className="p-3 border-t border-[#c9a227]/30 space-y-1.5 bg-[#062E1C]">
            {onOpenTrialModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenTrialModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#c9a227]/15 hover:bg-[#c9a227]/25 border border-[#c9a227]/40 text-[#F3E5AB] text-xs font-extrabold transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c9a227]" />
                  <span>حجز حصة تجريبية</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenTrashBin();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-300" />
                <span>سلة المحذوفات (30 يوم)</span>
              </span>
              {trashCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#07241B] text-[11px] font-extrabold tabular-nums">
                  {trashCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenFirebaseStatus();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#c9a227]" />
                <span>حالة Firebase</span>
              </span>
              <span
                className={`text-[11px] font-bold ${
                  firebaseConnected ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {firebaseConnected ? 'متصل' : 'محلي / جاهز'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {onCheckUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    onCheckUpdate();
                    onClose();
                  }}
                  className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition border ${
                    hasUpdateAvailable
                      ? 'bg-amber-500/25 text-amber-200 border-amber-400/60'
                      : 'bg-white/5 hover:bg-white/10 text-[#F3E5AB] border-white/10'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#c9a227]" />
                  <span>تحديث</span>
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white/5 hover:bg-red-900/40 text-red-200 border border-white/10 text-[11px] font-bold cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
