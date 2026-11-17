import React from 'react';
import {
  Download,
  GraduationCap,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  BookOpen,
  Menu,
} from 'lucide-react';
import { AcademyLogo } from './AcademyLogo';
import { AcademySettings, AppRole } from '../types';
import { UpdateStatus } from '../hooks/useAppUpdater';

export type AdminTab =
  | 'dashboard'
  | 'teacherApps'
  | 'teachers'
  | 'students'
  | 'curricula'
  | 'mushaf'
  | 'halaqat'
  | 'attendance'
  | 'studentReports'
  | 'trialLessons'
  | 'reports'
  | 'previewSettings'
  | 'settings';

const TAB_TITLES: Record<AdminTab, string> = {
  dashboard: 'لوحة تحكم المدير',
  teacherApps: 'طلبات وتسجيلات المعلمين',
  teachers: 'هيئة التدريس والرواتب',
  students: 'إدارة الطلاب',
  curricula: 'المناهج الدراسية',
  mushaf: 'المصحف المجود',
  halaqat: 'الحلقات والمجموعات',
  attendance: 'سجل الحضور والغياب',
  studentReports: 'الدرجات وتقرير الطالب',
  trialLessons: 'طلبات الحصص التجريبية',
  reports: 'التقارير المالية',
  previewSettings: 'إعدادات المعاينة',
  settings: 'إعدادات الأكاديمية',
};

interface HeaderProps {
  appRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  settings: AcademySettings;
  onOpenInstallModal: () => void;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
  onOpenTrialModal?: () => void;
  isOnline?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  isInAppBrowser?: boolean;
  isInstallable?: boolean;
  firestoreStatus?: 'connected' | 'connecting' | 'offline';
  firebaseConnected?: boolean;
  onOpenFirebaseStatus?: () => void;
  trashCount?: number;
  onOpenTrashBin?: () => void;
  newTrialLessonsCount?: number;
  onCheckUpdate?: () => void;
  hasUpdateAvailable?: boolean;
  updateStatus?: UpdateStatus;
  userEmail?: string | null;
  userPhotoUrl?: string | null;
  hasPendingWrites?: boolean;
  onSignOut?: () => void;
  isTeacherSessionLocked?: boolean;
  adminPreviewingTeacher?: boolean;
  onExitAdminPreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appRole,
  onRoleChange,
  currentTab,
  onTabChange,
  settings,
  onOpenInstallModal,
  showSidebarToggle = false,
  onToggleSidebar,
  onSignOut,
  isTeacherSessionLocked = false,
  adminPreviewingTeacher = false,
  onExitAdminPreview,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-[#083c24]/95 backdrop-blur-md border-b border-[#c9a227]/45 shadow-lg">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2.5">
        <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
          {/* 1. Right side (RTL start): Sidebar Toggle Button (dedicated non-overlapping slot) + Al-Furqan Logo */}
          <div className="order-1 flex items-center gap-2 min-w-0 flex-1 lg:flex-initial">
            {showSidebarToggle && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="فتح القائمة الجانبية"
                title="القائمة الجانبية"
                className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#07241B] hover:bg-[#0d5936] text-[#F3E5AB] border border-[#c9a227]/70 shadow cursor-pointer transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div
              onClick={() => {
                if (isTeacherSessionLocked) return;
                if (adminPreviewingTeacher && onExitAdminPreview) {
                  onExitAdminPreview();
                  return;
                }
                onRoleChange('admin');
                onTabChange('dashboard');
              }}
              className={`flex items-center gap-2.5 group select-none min-w-0 max-w-full ${
                isTeacherSessionLocked ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <AcademyLogo logoUrl={settings.logoDataUrl} size="sm" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-wide group-hover:text-[#F3E5AB] transition truncate max-w-[155px] sm:max-w-[230px]">
                  {appRole === 'admin' ? TAB_TITLES[currentTab] : settings.academyName}
                </h1>
                <p className="text-[11px] text-[#e5c76b] font-semibold hidden sm:block truncate max-w-[230px]">
                  {appRole === 'admin'
                    ? `${settings.academyName} • الشيخ عبد المجيد مسعد`
                    : 'نظام الإدارة والمتابعة لتحفيظ القرآن الكريم'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Left side (RTL end): Install App Button ONLY */}
          <div className="order-2 lg:order-3 shrink-0">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-extrabold gold-gradient-btn shadow cursor-pointer transition border border-[#c9a227]/60 whitespace-nowrap"
              title="تحميل التطبيق"
            >
              <Download className="w-3.5 h-3.5 text-[#07241B] shrink-0" />
              <span>تحميل التطبيق</span>
            </button>
          </div>

          {/* 3. Center: Portals Switcher (wraps cleanly below on narrow screens without any overlap) */}
          <nav
            aria-label="التنقل بين البوابات"
            className="order-3 lg:order-2 w-full lg:w-auto pt-2 lg:pt-0 border-t border-[#c9a227]/20 lg:border-t-0 flex flex-wrap items-center justify-center gap-1.5"
          >
            {!isTeacherSessionLocked ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (adminPreviewingTeacher && onExitAdminPreview) {
                      onExitAdminPreview();
                    } else {
                      onRoleChange('admin');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    appRole === 'admin'
                      ? 'bg-[#c9a227] text-[#07241B] shadow'
                      : 'bg-[#07241B]/75 text-slate-200 hover:text-white border border-[#c9a227]/25'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminPreviewingTeacher ? 'العودة للإدارة' : 'لوحة الإدارة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRoleChange('student')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    appRole === 'student'
                      ? 'bg-[#c9a227] text-[#07241B] shadow'
                      : 'bg-[#07241B]/75 text-slate-200 hover:text-white border border-[#c9a227]/25'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>بوابة الطالب</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRoleChange('teacher')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    appRole === 'teacher'
                      ? 'bg-[#c9a227] text-[#07241B] shadow'
                      : 'bg-[#07241B]/75 text-slate-200 hover:text-white border border-[#c9a227]/25'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>بوابة المعلم</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRoleChange('parent')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    appRole === 'parent'
                      ? 'bg-[#c9a227] text-[#07241B] shadow'
                      : 'bg-[#07241B]/75 text-slate-200 hover:text-white border border-[#c9a227]/25'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>دخول ولي الأمر</span>
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#c9a227] text-[#07241B]">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>بوابة المعلم</span>
                </span>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-red-900/50 text-white border border-white/20 cursor-pointer transition"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#F3E5AB]" />
                    <span>خروج</span>
                  </button>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
