/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Award,
  Bell,
  Clock,
  MessageSquare,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { AdminTab, Header } from './components/Header';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboardSection } from './components/AdminDashboardSection';
import { TeacherApplicationsSection } from './components/TeacherApplicationsSection';
import {
  TeacherRegistrationScreen,
  TeacherSelfRegistrationPayload,
} from './components/TeacherRegistrationScreen';
import {
  StudentRegistrationScreen,
  StudentSelfRegistrationPayload,
} from './components/StudentRegistrationScreen';
import { EDUCATION_SYSTEM_LABELS, getFullGradeTitle } from './data/curricula';
import { AdminCurriculaSection } from './components/AdminCurriculaSection';
import { HalaqatSection } from './components/HalaqatSection';
import { AttendanceSection } from './components/AttendanceSection';
import { GradesReportsSection } from './components/GradesReportsSection';
import { FooterWhatsApp } from './components/FooterWhatsApp';
import { WelcomeChoiceScreen } from './components/WelcomeChoiceScreen';
import { AdminPinLoginScreen } from './components/AdminPinLoginScreen';
import { TeacherAccessScreen } from './components/TeacherAccessScreen';
import { StudentsListSection } from './components/StudentsListSection';
import { StudentProfile } from './components/StudentProfile';
import { StudentModal } from './components/StudentModal';
import { TeachersSection } from './components/TeachersSection';
import { SettingsSection } from './components/SettingsSection';
import { TrialLessonModal } from './components/TrialLessonModal';
import { TrialLessonsSection } from './components/TrialLessonsSection';
import { ReportsSection } from './components/ReportsSection';
import { TeacherPortalView } from './components/TeacherPortalView';
import { ParentPortalView } from './components/ParentPortalView';
import { StudentPortalView } from './components/StudentPortalView';
import { ReceiptModal } from './components/ReceiptModal';
import { CertificateModal } from './components/CertificateModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { TrashBinModal } from './components/TrashBinModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { PWAInstallModal } from './components/PWAInstallModal';

import {
  AcademySettings,
  AppRole,
  AttendanceRecord,
  AttendanceStatus,
  CertificateRecord,
  Exam,
  FirebaseConnectionStats,
  HalaqaGroup,
  HomeworkAssignment,
  LinkedGoogleAccount,
  PaymentRecord,
  ScheduleAppointment,
  Student,
  StudentExamResult,
  Teacher,
  TeacherRating,
  TrashItem,
  TrialLesson,
  TrialLessonStatus,
} from './types';
import {
  hasCompletedGoogleLink,
  setCompletedGoogleLink,
  getStoredLinkedGoogle,
  setStoredLinkedGoogle,
  clearAppSession,
  normalizePhoneAuth,
  getStoredManagerPinConfig,
  setStoredManagerPinConfig,
  getStoredLastTeacherPhone,
  setStoredLastTeacherPhone,
} from './utils/authStorage';
import {
  DEFAULT_SETTINGS,
  purgeLegacyLocalStorage,
  getTodayDateStr,
  addDaysToDateStr,
  getDaysUntilDate,
  cleanWhatsAppNumber,
  normalizePhoneForMatch,
  getCachedLoginBanner,
  setCachedLoginBanner,
  getCachedAcademyLogo,
  setCachedAcademyLogo,
  saveParentDirectorySnapshot,
  getParentDirectorySnapshot,
} from './utils/storage';
import {
  PendingSyncMap,
  EMPTY_PENDING_SYNC,
  addPendingId,
  buildTrashItem,
  clearDurableAcademyDataOnlyOnManualReset,
  countPendingSyncItems,
  filterActiveTrashItems,
  loadDurableAcademyData,
  removePendingId,
  saveDurableAcademyData,
} from './utils/localDataStore';
import { syncAppIcon } from './utils/pwa';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { useAppUpdater } from './hooks/useAppUpdater';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  executeUniversalDownload,
} from './utils/downloadHelper';
import {
  auth,
  firebaseConfig,
  hasCustomUserApiKey,
  isFirebaseConfigured,
  isTemporaryPreviewHost,
  signInWithGoogle,
  testConnection,
} from './firebase/config';
import {
  subscribeStudents,
  subscribePublicStudents,
  findStudentInFirestoreByPhone,
  registerStudentAccountInFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  subscribeTeachers,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  fetchAllTeachersFromFirestore,
  findTeacherInFirestoreByPhone,
  findParentInFirestoreByPhone,
  registerTeacherAccountInFirestore,
  fetchTeacherPortalDataFromFirestore,
  updateTeacherStatusInFirestore,
  subscribeHalaqat,
  saveHalaqaToFirestore,
  deleteHalaqaFromFirestore,
  subscribeExams,
  saveExamToFirestore,
  deleteExamFromFirestore,
  subscribeHomeworks,
  saveHomeworkToFirestore,
  deleteHomeworkFromFirestore,
  subscribeSchedules,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  subscribeSettings,
  saveSettingsToFirestore,
  subscribePublicLoginBanner,
  savePublicLoginBanner,
  subscribePublicAcademyLogo,
  savePublicAcademyLogo,
  subscribeTrialLessons,
  saveTrialLessonToFirestore,
  deleteTrialLessonFromFirestore,
  updateTrialLessonStatusInFirestore,
  subscribeAttendance,
  saveAttendanceToFirestore,
  subscribePayments,
  savePaymentToFirestore,
  subscribeTeacherRatings,
  saveTeacherRatingToFirestore,
  subscribeTrash,
  saveTrashItemToFirestore,
  deleteTrashItemFromFirestore,
  getFirestoreCollectionCounts,
  migrateLocalBundleToFirestore,
  clearAllUserDataFromFirestore,
  fetchUserAccountBundle,
  saveLinkedGoogleAccount,
  PublicParentSnapshot,
  savePublicParentSnapshot,
  fetchPublicParentSnapshot,
} from './firebase/firestoreService';

function buildStudentExamResults(studentId: string, examsList: Exam[]): StudentExamResult[] {
  const results: StudentExamResult[] = [];
  for (const ex of examsList) {
    const grade = ex.grades.find((g) => g.studentId === studentId);
    if (!grade) continue;
    results.push({
      examId: ex.id,
      examTitle: ex.title,
      subject: ex.subject,
      examDate: ex.examDate,
      teacherName: ex.teacherName,
      maxScore: grade.maxScore || ex.maxScore,
      score: grade.score,
      gradeLabel: grade.gradeLabel,
      notes: grade.notes,
      gradedAt: grade.gradedAt,
    });
  }
  return results.sort((a, b) => (b.gradedAt || 0) - (a.gradedAt || 0));
}

// Remove only obsolete demo cache keys; NEVER wipe durable real academy data
purgeLegacyLocalStorage();

export default function App() {
  // First-Launch Google Link + Phone/Password Auth States
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authActionLoading, setAuthActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setGoogleLinkDone] = useState<boolean>(() => hasCompletedGoogleLink());
  const [linkedGoogle, setLinkedGoogle] = useState<LinkedGoogleAccount | null>(() =>
    getStoredLinkedGoogle()
  );
  const [appSessionLoggedIn, setAppSessionLoggedIn] = useState<boolean>(() => {
    clearAppSession();
    return false;
  });

  const initialDirectParentId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('parent') ||
        new URLSearchParams(window.location.search).get('child') ||
        ''
      : '';

  const [entryGateMode, setEntryGateMode] = useState<
    'welcome' | 'student' | 'parent' | 'admin_login' | 'teacher_login'
  >(() => (initialDirectParentId ? 'parent' : 'welcome'));
  const [directParentChildId] = useState<string>(initialDirectParentId);
  const [directParentSnapshot, setDirectParentSnapshot] = useState<PublicParentSnapshot | null>(
    null
  );
  const [directLinkLoading, setDirectLinkLoading] = useState<boolean>(
    Boolean(initialDirectParentId)
  );

  // Navigation, Role & View States
  const [appRole, setAppRole] = useState<AppRole>('admin');
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedCurriculumGradeId, setSelectedCurriculumGradeId] = useState<string | null>(null);
  const [showTeacherRegisterScreen, setShowTeacherRegisterScreen] = useState<boolean>(false);
  const [showStudentRegisterScreen, setShowStudentRegisterScreen] = useState<boolean>(false);
  const [teacherPrefillPhone, setTeacherPrefillPhone] = useState<string>('');
  const [loginInitialNotice, setLoginInitialNotice] = useState<string | null>(null);
  const [loginInitialPhone, setLoginInitialPhone] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedPortalTeacherId, setSelectedPortalTeacherId] = useState<string>('');
  const [adminPreviewingTeacher, setAdminPreviewingTeacher] = useState<boolean>(false);
  const [loggedParentPhone, setLoggedParentPhone] = useState<string>('');
  const [loggedStudentId, setLoggedStudentId] = useState<string>('');

  // Modal States
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentRecord | null>(null);
  const [certModalState, setCertModalState] = useState<{
    student: Student;
    cert?: CertificateRecord;
  } | null>(null);

  // Toast / Celebration Alert Banner
  const [starCelebration, setStarCelebration] = useState<{
    student: Student;
    cert: CertificateRecord;
  } | null>(null);

  // Universal Download state for Settings JSON backup
  const [exportDownloadState, setExportDownloadState] = useState<DownloadState>(
    INITIAL_DOWNLOAD_STATE
  );

  // App Data States (Boot safely from durable real-data store + live sync from Firestore)
  const initialDurableRef = useRef<ReturnType<typeof loadDurableAcademyData> | null>(null);
  if (!initialDurableRef.current) {
    initialDurableRef.current = loadDurableAcademyData();
  }
  const initialDurable = initialDurableRef.current;

  const [students, setStudents] = useState<Student[]>(() => initialDurable.students);
  const [teachers, setTeachers] = useState<Teacher[]>(() => initialDurable.teachers);
  const [halaqat, setHalaqat] = useState<HalaqaGroup[]>(() => initialDurable.halaqat);
  const [schedules, setSchedules] = useState<ScheduleAppointment[]>(() => initialDurable.schedules);
  const [publicAcademyLogoUrl, setPublicAcademyLogoUrl] = useState<string>(() =>
    getCachedAcademyLogo()
  );
  const [settings, setSettings] = useState<AcademySettings>(() => {
    const storedPinCfg = getStoredManagerPinConfig();
    return {
      ...DEFAULT_SETTINGS,
      ...initialDurable.settings,
      logoDataUrl: initialDurable.settings.logoDataUrl || getCachedAcademyLogo(),
      managerPin: storedPinCfg.configured
        ? storedPinCfg.pin
        : initialDurable.settings.managerPin || DEFAULT_SETTINGS.managerPin,
      managerPinConfigured:
        storedPinCfg.configured || Boolean(initialDurable.settings.managerPinConfigured),
    };
  });
  const [loginBannerUrl, setLoginBannerUrl] = useState<string>(() => getCachedLoginBanner());
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>(
    () => initialDurable.trialLessons
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => initialDurable.attendance);
  const [payments, setPayments] = useState<PaymentRecord[]>(() => initialDurable.payments);
  const [teacherRatings, setTeacherRatings] = useState<TeacherRating[]>(
    () => initialDurable.teacherRatings
  );
  const [exams, setExams] = useState<Exam[]>(() => initialDurable.exams || []);
  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>(
    () => initialDurable.homeworks || []
  );
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() =>
    filterActiveTrashItems(initialDurable.trash)
  );
  const [pendingSync, setPendingSync] = useState<PendingSyncMap>(() => initialDurable.pendingSync);

  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'connecting' | 'offline'>(
    'offline'
  );
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [syncPermissionError, setSyncPermissionError] = useState<string | null>(null);

  // Firebase Status Modal, Trash Bin Modal & Explicit Confirmation Dialog States
  const [isFirebaseStatusOpen, setIsFirebaseStatusOpen] = useState(false);
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [manualSyncFeedback, setManualSyncFeedback] = useState<string | null>(null);
  const [firebaseCounts, setFirebaseCounts] = useState<{
    studentsCount: number;
    teachersCount: number;
    parentsCount: number;
    certificatesCount: number;
    lastCheckedAt: number | null;
  }>({
    studentsCount: 0,
    teachersCount: 0,
    parentsCount: 0,
    certificatesCount: 0,
    lastCheckedAt: null,
  });

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'warning' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'تأكيد',
    tone: 'warning',
    onConfirm: () => {},
  });

  const latestBundleRef = useRef(initialDurable);
  latestBundleRef.current = {
    students,
    teachers,
    halaqat,
    schedules,
    attendance,
    payments,
    teacherRatings,
    trialLessons,
    exams,
    homeworks,
    trash: trashItems,
    settings,
    pendingSync,
    updatedAt: Date.now(),
  };

  // Persist every real change into durable local mirror so zero data is ever lost on refresh or logout
  useEffect(() => {
    saveDurableAcademyData({
      students,
      teachers,
      halaqat,
      schedules,
      attendance,
      payments,
      teacherRatings,
      trialLessons,
      exams,
      homeworks,
      trash: trashItems,
      settings,
      pendingSync,
      updatedAt: Date.now(),
    });
  }, [
    students,
    teachers,
    halaqat,
    schedules,
    attendance,
    payments,
    teacherRatings,
    trialLessons,
    exams,
    homeworks,
    trashItems,
    settings,
    pendingSync,
  ]);

  // PWA, Connectivity & App Updater Hooks
  const { isInstallable, isInstalled, isIOS, isInAppBrowser, platform, install } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const {
    hasUpdateAvailable,
    updateStatus,
    updateMessage,
    forceUpdateNow,
    applyUpdateReload,
    dismissUpdateMessage,
    currentVersion,
  } = useAppUpdater();

  const isUpdatingApp = updateStatus === 'updating' || updateStatus === 'checking';

  const handleInstallTrigger = async () => {
    const outcome = await install();
    if (outcome === 'manual-instructions' || outcome === 'already-installed') {
      setIsInstallModalOpen(true);
    }
  };

  // Listen to Firebase Auth State (NEVER wipe user data on sign-out or offline!)
  useEffect(() => {
    purgeLegacyLocalStorage();

    if (isTemporaryPreviewHost() || !isFirebaseConfigured() || !auth) {
      setAuthUser(null);
      setAuthLoading(false);
      setAuthError(null);
      setFirestoreStatus('offline');
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthLoading(false);
      setAuthError(null);

      if (user) {
        const fallbackGoogle: LinkedGoogleAccount = {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          linkedAt: Date.now(),
        };

        try {
          const bundle = await fetchUserAccountBundle(user.uid);
          if (bundle?.linkedGoogle) {
            setLinkedGoogle(bundle.linkedGoogle);
            setStoredLinkedGoogle(bundle.linkedGoogle);
          } else {
            setLinkedGoogle((prev) => prev || fallbackGoogle);
            setStoredLinkedGoogle(fallbackGoogle);
          }
        } catch {
          setLinkedGoogle((prev) => prev || fallbackGoogle);
        }
      } else {
        // CRITICAL: Never clear durable student/teacher/academy data on sign-out!
        setSelectedStudentId(null);
        setHasPendingWrites(false);
        setSyncPermissionError(null);
        setFirestoreStatus('offline');
      }
    });

    return () => unsubAuth();
  }, []);

  // Enforce logout on app close / unload and wipe any stale persisted session key
  useEffect(() => {
    clearAppSession();
    const handleUnload = () => {
      clearAppSession();
      setAppSessionLoggedIn(false);
      setLoggedParentPhone('');
      setLoggedStudentId('');
      if (!initialDirectParentId) {
        setEntryGateMode('welcome');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [initialDirectParentId]);

  // Resolve Direct Parent Link (?parent=<studentId>) immediately without asking phone again
  useEffect(() => {
    if (!directParentChildId) {
      setDirectLinkLoading(false);
      return;
    }

    let cancelled = false;
    const localDir = getParentDirectorySnapshot();
    if (localDir?.students?.length) {
      const localChild = (localDir.students as Student[]).find(
        (s) => s.id === directParentChildId
      );
      if (localChild) {
        const tObj = (localDir.teachers as Teacher[]).find(
          (t) => t.id === localChild.assignedTeacherId
        );
        setDirectParentSnapshot({
          student: localChild,
          teacherName: tObj?.name || '',
          attendance: (localDir.attendance as AttendanceRecord[]).filter(
            (a) => a.studentId === localChild.id
          ),
          payments: (localDir.payments as PaymentRecord[]).filter(
            (p) => p.studentId === localChild.id
          ),
          exams: buildStudentExamResults(localChild.id, (localDir.exams || []) as Exam[]),
          currency: settings.currency || 'ر.س',
          academyName: settings.academyName,
          updatedAt: Date.now(),
        });
        setDirectLinkLoading(false);
      }
    }

    fetchPublicParentSnapshot(`student_${directParentChildId}`)
      .then((snap) => {
        if (!cancelled && snap) {
          setDirectParentSnapshot(snap);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDirectLinkLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [directParentChildId, settings.academyName, settings.currency]);

  // Sync real students/attendance/payments/exams to local directory & public parent links for follow-up links
  useEffect(() => {
    if (!appSessionLoggedIn) return;

    saveParentDirectorySnapshot({
      students,
      teachers,
      attendance,
      payments,
      exams,
    });

    if (!authUser) return;
    students.forEach((st) => {
      const tObj = teachers.find((t) => t.id === st.assignedTeacherId);
      const snapshot: PublicParentSnapshot = {
        student: st,
        teacherName: tObj?.name || '',
        attendance: attendance.filter((a) => a.studentId === st.id),
        payments: payments.filter((p) => p.studentId === st.id),
        exams: buildStudentExamResults(st.id, exams),
        currency: settings.currency || 'ر.س',
        academyName: settings.academyName,
        updatedAt: Date.now(),
      };
      savePublicParentSnapshot(authUser.uid, `student_${st.id}`, snapshot).catch(() => {});
      const normPhone = normalizePhoneForMatch(st.parentPhone || st.phone);
      if (normPhone.length >= 6) {
        savePublicParentSnapshot(authUser.uid, `phone_${normPhone}`, snapshot).catch(() => {});
      }
    });
  }, [
    appSessionLoggedIn,
    students,
    teachers,
    attendance,
    payments,
    exams,
    authUser,
    settings.currency,
    settings.academyName,
  ]);
  useEffect(() => {
    const unsubBanner = subscribePublicLoginBanner((remoteUrl, exists) => {
      if (exists) {
        setLoginBannerUrl(remoteUrl);
        setCachedLoginBanner(remoteUrl);
      }
    });
    const unsubAcademyLogo = subscribePublicAcademyLogo((remoteLogo, exists) => {
      if (exists) {
        setPublicAcademyLogoUrl(remoteLogo);
        setCachedAcademyLogo(remoteLogo);
        setSettings((prev) => ({ ...prev, logoDataUrl: remoteLogo }));
      }
    });
    return () => {
      unsubBanner();
      unsubAcademyLogo();
    };
  }, []);

  // First-Launch-Only Google Linking Handler
  const handleFirstLaunchGoogleLink = async () => {
    setAuthActionLoading(true);
    setAuthError(null);
    const result = await signInWithGoogle();
    if (result.errorMessage) {
      setAuthError(result.errorMessage);
      setAuthActionLoading(false);
      return;
    }

    if (result.user) {
      const googleAcc: LinkedGoogleAccount = {
        uid: result.user.uid,
        name: result.user.displayName || '',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
        linkedAt: Date.now(),
      };
      setLinkedGoogle(googleAcc);
      setStoredLinkedGoogle(googleAcc);
      setCompletedGoogleLink(true);
      setGoogleLinkDone(true);

      await saveLinkedGoogleAccount(result.user.uid, googleAcc).catch(() => {});
    }

    setAuthActionLoading(false);
  };

  // 1. Direct Academy Manager PIN Verification & First-Time Creation / Forgot Reset
  const handleAdminPinVerify = (pinInput: string): { ok: boolean; error?: string } => {
    const storedPinCfg = getStoredManagerPinConfig();
    const isConfigured = Boolean(settings.managerPinConfigured || storedPinCfg.configured);
    const expectedPin = (
      (storedPinCfg.configured ? storedPinCfg.pin : settings.managerPin) ||
      DEFAULT_SETTINGS.managerPin ||
      '1234'
    ).trim();
    const entered = pinInput.trim();

    if (entered !== expectedPin && !(!isConfigured && entered === '1234')) {
      return { ok: false, error: 'الرقم السري غير صحيح. يرجى التأكد والمحاولة مرة أخرى.' };
    }
    setAppRole('admin');
    setCurrentTab('dashboard');
    setAdminPreviewingTeacher(false);
    setSelectedPortalTeacherId('');
    setAppSessionLoggedIn(true);
    return { ok: true };
  };

  const handleSaveNewAdminPinAndLogin = (newPinInput: string): { ok: boolean; error?: string } => {
    const cleaned = newPinInput.trim();
    if (cleaned.length < 4) {
      return { ok: false, error: 'الرقم السري يجب أن يكون 4 أرقام أو أحرف على الأقل.' };
    }
    setStoredManagerPinConfig(cleaned, true);
    handleSaveSettings({
      ...settings,
      managerPin: cleaned,
      managerPinConfigured: true,
    });
    setAppRole('admin');
    setCurrentTab('dashboard');
    setAdminPreviewingTeacher(false);
    setSelectedPortalTeacherId('');
    setAppSessionLoggedIn(true);
    return { ok: true };
  };

  // 2. Returning Teacher Phone-Only Login (checks Firestore & local mirror)
  const handleTeacherPhoneOnlyLogin = async (
    phoneInput: string
  ): Promise<{ ok: boolean; notRegistered?: boolean; error?: string }> => {
    const normalized = normalizePhoneAuth(phoneInput);
    if (!normalized || normalized.length < 8) {
      return { ok: false, error: 'يرجى إدخال رقم تليفون صحيح.' };
    }

    let matchedTeacher: Teacher | null = null;
    if (isFirebaseConfigured()) {
      matchedTeacher = await findTeacherInFirestoreByPhone(normalized).catch(() => null);
    }
    if (!matchedTeacher) {
      matchedTeacher =
        teachers.find(
          (t) => normalizePhoneAuth(t.normalizedPhone || t.phone) === normalized
        ) || null;
    }

    if (!matchedTeacher) {
      return {
        ok: false,
        notRegistered: true,
        error: 'هذا الرقم غير مسجل بعد — لو دي أول مرة تدخل، سجل بياناتك الآن.',
      };
    }

    if (matchedTeacher.status === 'rejected') {
      return {
        ok: false,
        error: 'نعتذر، لم يتم قبول طلب تسجيلك من إدارة الأكاديمية. يرجى التواصل مع الإدارة.',
      };
    }

    setStoredLastTeacherPhone(normalized);
    setTeachers((prev) => [
      matchedTeacher!,
      ...prev.filter((t) => t.id !== matchedTeacher!.id),
    ]);
    setSelectedPortalTeacherId(matchedTeacher.id);
    setAdminPreviewingTeacher(false);
    setAppRole('teacher');
    setAppSessionLoggedIn(true);

    fetchTeacherPortalDataFromFirestore(matchedTeacher.id)
      .then((portalData) => {
        if (portalData.schedules.length > 0) {
          setSchedules((prev) => {
            const ids = new Set(prev.map((s) => s.id));
            return [...prev, ...portalData.schedules.filter((s) => !ids.has(s.id))];
          });
        }
        if (portalData.students.length > 0) {
          setStudents((prev) => {
            const ids = new Set(prev.map((s) => s.id));
            return [...prev, ...portalData.students.filter((s) => !ids.has(s.id))];
          });
        }
        if (portalData.attendance.length > 0) {
          setAttendance((prev) => {
            const ids = new Set(prev.map((a) => a.id));
            return [...prev, ...portalData.attendance.filter((a) => !ids.has(a.id))];
          });
        }
      })
      .catch(() => {});

    return { ok: true };
  };

  // 3. First-Time Teacher Self-Registration Handler (saves to localStorage + Firestore & auto-enters Teacher Dashboard)
  const handleCheckTeacherPhoneExists = async (normalizedPhone: string): Promise<boolean> => {
    const localHit = teachers.some(
      (t) => normalizePhoneAuth(t.normalizedPhone || t.phone) === normalizedPhone
    );
    if (localHit) return true;
    if (isFirebaseConfigured()) {
      const remoteHit = await findTeacherInFirestoreByPhone(normalizedPhone).catch(() => null);
      if (remoteHit) return true;
    }
    return false;
  };

  const handleSelfRegisterTeacher = async (
    payload: TeacherSelfRegistrationPayload
  ): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> => {
    const normalized = normalizePhoneAuth(payload.phone);
    if (!normalized || normalized.length < 9) {
      return { ok: false, error: 'يرجى إدخال رقم تليفون / واتساب صحيح.' };
    }

    const existsLocally = teachers.some(
      (t) => normalizePhoneAuth(t.normalizedPhone || t.phone) === normalized
    );
    if (existsLocally) {
      return {
        ok: false,
        alreadyExists: true,
        error: 'الرقم ده متسجل قبل كده',
      };
    }

    const ownerUid = authUser?.uid || linkedGoogle?.uid || 'academy_shared';
    const subjectsSpec = payload.subjects.join(' • ') || 'قرآن';

    let savedTeacher: Teacher = {
      id: `tch-${normalized}-${Date.now()}`,
      name: payload.name.trim(),
      phone: normalized,
      normalizedPhone: normalized,
      role: 'teacher',
      status: 'pending',
      registeredBySelf: true,
      ownerUid,
      age: payload.age,
      location: payload.location.trim(),
      teachingSystems: payload.teachingSystems,
      teachingMode: payload.teachingMode,
      teachingStages: payload.teachingStages,
      teachingGrades: payload.teachingGrades,
      teachingTrack: payload.teachingTrack || '',
      subjects: payload.subjects,
      dailyHours: payload.dailyHours,
      availablePeriod: payload.availablePeriod,
      experienceYears: payload.experienceYears,
      avatarUrl: payload.avatarUrl || '',
      specialization: subjectsSpec,
      notes: '',
      sessionRate: settings.defaultSessionRate ?? 40,
      createdAt: Date.now(),
    };

    let savedToCloud = false;
    if (isFirebaseConfigured()) {
      try {
        const res = await registerTeacherAccountInFirestore({
          name: payload.name.trim(),
          phone: normalized,
          age: payload.age,
          location: payload.location.trim(),
          teachingSystems: payload.teachingSystems,
          teachingMode: payload.teachingMode,
          teachingStages: payload.teachingStages,
          teachingGrades: payload.teachingGrades,
          teachingTrack: payload.teachingTrack || '',
          subjects: payload.subjects,
          dailyHours: payload.dailyHours,
          availablePeriod: payload.availablePeriod,
          experienceYears: payload.experienceYears,
          avatarUrl: payload.avatarUrl || '',
          specialization: subjectsSpec,
          sessionRate: settings.defaultSessionRate ?? 40,
          ownerUid,
        });
        if (res.alreadyExists) {
          return {
            ok: false,
            alreadyExists: true,
            error: 'الرقم ده متسجل قبل كده',
          };
        }
        savedTeacher = res.teacher;
        savedToCloud = true;
      } catch (err) {
        console.warn('Self-registration Firestore queued locally:', err);
      }
    }

    setTeachers((prev) => [
      savedTeacher,
      ...prev.filter((t) => t.id !== savedTeacher.id),
    ]);
    syncEntityPending('teachers', savedTeacher.id, !savedToCloud);

    // Log right into the Teacher Portal after saving once & remember device registered teacher
    setStoredLastTeacherPhone(normalized);
    setSelectedPortalTeacherId(savedTeacher.id);
    setAdminPreviewingTeacher(false);
    setAppRole('teacher');
    setShowTeacherRegisterScreen(false);
    setTeacherPrefillPhone('');
    setAppSessionLoggedIn(true);
    return { ok: true };
  };

  // 3B. Student Self-Registration Handler (saves curriculum system/stage/grade/subjects + enters Student Portal)
  const handleCheckStudentPhoneExists = async (normalizedPhone: string): Promise<boolean> => {
    const target = normalizePhoneForMatch(normalizedPhone);
    if (!target) return false;
    const localHit = students.some((s) => normalizePhoneForMatch(s.phone) === target);
    if (localHit) return true;
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      const remoteHit = await findStudentInFirestoreByPhone(target).catch(() => null);
      if (remoteHit) return true;
    }
    return false;
  };

  const handleSelfRegisterStudent = async (
    payload: StudentSelfRegistrationPayload
  ): Promise<{ ok: boolean; alreadyExists?: boolean; error?: string }> => {
    const normalizedPhone = normalizePhoneForMatch(payload.phone);
    if (!normalizedPhone || normalizedPhone.length < 7) {
      return { ok: false, error: 'يرجى إدخال رقم تليفون صحيح.' };
    }

    const existsLocally = students.some(
      (s) => normalizePhoneForMatch(s.phone) === normalizedPhone
    );
    if (existsLocally) {
      return {
        ok: false,
        alreadyExists: true,
        error: 'هذا الرقم مسجل لطالب بالفعل — يمكنك الدخول مباشرة برقم الهاتف.',
      };
    }

    const ownerUid = authUser?.uid || linkedGoogle?.uid || 'academy_shared';
    const sysLabel = EDUCATION_SYSTEM_LABELS[payload.educationSystem];
    const gradeTitle = getFullGradeTitle(payload.stage, payload.gradeLevel);
    const courseLabel =
      payload.studyScope === 'single' && payload.selectedSubjects[0]
        ? `${sysLabel} • ${gradeTitle} • ${payload.selectedSubjects[0]}`
        : `${sysLabel} • ${gradeTitle}`;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: payload.name.trim(),
      age: String(payload.age),
      stage: payload.stage,
      educationSystem: payload.educationSystem,
      gradeLevel: payload.gradeLevel,
      track: payload.stage === 'ثانوي' ? payload.track || '' : '',
      studyScope: payload.studyScope,
      selectedSubjects: payload.selectedSubjects,
      registeredBySelf: true,
      ownerUid,
      phone: payload.phone.trim(),
      course: courseLabel,
      feeStatus: 'unpaid',
      notes: '',
      parentName: payload.parentName.trim() || payload.name.trim(),
      parentPhone: payload.parentPhone.trim() || payload.phone.trim(),
      assignedTeacherId: '',
      halaqaId: '',
      halaqaName: '',
      registeredDate: todayStr,
      reports: [],
      stars: 0,
      totalStarsEarned: 0,
      starCyclesCompleted: 0,
      completedJuz: 0,
      currentSurah: 'سورة الفاتحة',
      subscriptionAmount: settings.defaultSubscriptionAmount ?? 250,
      nextPaymentDate: addDaysToDateStr(todayStr, 30),
      certificates: [],
    };

    let savedToCloud = false;
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      try {
        await registerStudentAccountInFirestore(newStudent);
        savedToCloud = true;
      } catch (err) {
        console.warn('Student self-registration Firestore queued locally:', err);
      }
    }

    setStudents((prev) => [newStudent, ...prev.filter((s) => s.id !== newStudent.id)]);
    syncEntityPending('students', newStudent.id, !savedToCloud);
    setLoggedStudentId(newStudent.id);
    setShowStudentRegisterScreen(false);
    setEntryGateMode('student');
    return { ok: true };
  };

  const handleApproveTeacher = (teacherId: string) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, status: 'active' } : t))
    );
    if (isFirebaseConfigured()) {
      updateTeacherStatusInFirestore(teacherId, 'active').catch((err) =>
        console.warn('Teacher approve Firestore warning:', err)
      );
    }
  };

  const handleRejectTeacher = (teacherId: string) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, status: 'rejected' } : t))
    );
    if (isFirebaseConfigured()) {
      updateTeacherStatusInFirestore(teacherId, 'rejected').catch((err) =>
        console.warn('Teacher reject Firestore warning:', err)
      );
    }
  };

  // App Session Sign Out (NEVER clears data and NEVER locks out choice screen)
  const handleSignOut = async () => {
    clearAppSession();
    setAppSessionLoggedIn(false);
    setIsSidebarOpen(false);
    setSelectedCurriculumGradeId(null);
    setShowTeacherRegisterScreen(false);
    setShowStudentRegisterScreen(false);
    setTeacherPrefillPhone('');
    setLoginInitialNotice(null);
    setLoginInitialPhone('');
    setAdminPreviewingTeacher(false);
    setAppRole('admin');
    setEntryGateMode('welcome');
    setSelectedStudentId(null);
    setSelectedPortalTeacherId('');
    setLoggedParentPhone('');
    setLoggedStudentId('');
  };

  // Realtime Public Exams, Homeworks & Self-Registered Students Sync
  useEffect(() => {
    if (!isFirebaseConfigured() || isTemporaryPreviewHost()) return;
    let cancelled = false;
    const unsubExams = subscribeExams(
      authUser?.uid,
      (remoteExams) => {
        if (cancelled) return;
        setExams((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.exams || []);
          const remoteMap = new Map(remoteExams.map((ex) => [ex.id, ex]));
          const preservedLocal = prevLocal.filter(
            (ex) => pendingIds.has(ex.id) && !remoteMap.has(ex.id)
          );
          return [...preservedLocal, ...remoteExams];
        });
      },
      () => {}
    );
    const unsubHomeworks = subscribeHomeworks(
      authUser?.uid,
      (remoteHomeworks) => {
        if (cancelled) return;
        setHomeworks((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.homeworks || []);
          const remoteMap = new Map(remoteHomeworks.map((hw) => [hw.id, hw]));
          const preservedLocal = prevLocal.filter(
            (hw) => pendingIds.has(hw.id) && !remoteMap.has(hw.id)
          );
          return [...preservedLocal, ...remoteHomeworks];
        });
      },
      () => {}
    );
    const unsubPublicStudents = subscribePublicStudents(
      (remoteStudents) => {
        if (cancelled) return;
        setStudents((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.students || []);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const mergedMap = new Map(prevLocal.map((s) => [s.id, s]));
          for (const rs of remoteStudents) {
            if (trashEntityIds.has(rs.id)) continue;
            if (pendingIds.has(rs.id) && mergedMap.has(rs.id)) continue;
            if (!authUser || rs.ownerUid === 'academy_shared' || rs.registeredBySelf || !mergedMap.has(rs.id)) {
              mergedMap.set(rs.id, rs);
            }
          }
          return Array.from(mergedMap.values());
        });
      },
      () => {}
    );
    return () => {
      cancelled = true;
      unsubExams();
      unsubHomeworks();
      unsubPublicStudents();
    };
  }, [authUser]);

  // Direct Firebase Teachers Sync even before Google Sign-In (so preview & teacher devices always see teachers)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (authUser && !isTemporaryPreviewHost()) return;

    let cancelled = false;
    fetchAllTeachersFromFirestore()
      .then((remoteTeachers) => {
        if (cancelled || remoteTeachers.length === 0) return;
        setTeachers((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.teachers);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteTeachers.map((t) => [t.id, t]));
          const preservedLocal = prevLocal.filter(
            (t) => pendingIds.has(t.id) && !remoteMap.has(t.id) && !trashEntityIds.has(t.id)
          );
          return [...preservedLocal, ...remoteTeachers.filter((t) => !trashEntityIds.has(t.id))];
        });
      })
      .catch(() => {});

    const unsubPublicTeachers = subscribeTeachers(
      undefined,
      (remoteTeachers) => {
        if (cancelled) return;
        setTeachers((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.teachers);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteTeachers.map((t) => [t.id, t]));
          const preservedLocal = prevLocal.filter(
            (t) => pendingIds.has(t.id) && !remoteMap.has(t.id) && !trashEntityIds.has(t.id)
          );
          return [...preservedLocal, ...remoteTeachers.filter((t) => !trashEntityIds.has(t.id))];
        });
      },
      () => {}
    );

    return () => {
      cancelled = true;
      unsubPublicTeachers();
    };
  }, [authUser]);

  // Real-time Firestore Sync & Non-Destructive Local-to-Cloud Auto-Migration
  useEffect(() => {
    if (!authUser || isTemporaryPreviewHost() || !isFirebaseConfigured()) {
      setFirestoreStatus('offline');
      return;
    }

    const uid = authUser.uid;
    let cancelled = false;
    setFirestoreStatus(isOnline ? 'connecting' : 'offline');
    setSyncPermissionError(null);

    const runAutoMigrationAndCount = async () => {
      if (!isOnline) return;
      const connectedOk = await testConnection();
      if (cancelled) return;
      if (!connectedOk) {
        setFirestoreStatus('offline');
        return;
      }
      setFirestoreStatus('connected');

      try {
        const result = await migrateLocalBundleToFirestore(uid, latestBundleRef.current);
        if (cancelled) return;
        setPendingSync({ ...EMPTY_PENDING_SYNC });
        setFirebaseCounts({
          studentsCount: result.studentsCount,
          teachersCount: result.teachersCount,
          parentsCount: result.parentsCount,
          certificatesCount: result.certificatesCount,
          lastCheckedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Auto-migration notice:', err);
      }
    };

    runAutoMigrationAndCount();

    const handleSyncError = (err: any) => {
      const msg = err?.message || '';
      if (msg.includes('permission-denied') || err?.code === 'permission-denied') {
        setSyncPermissionError(
          'صلاحيات Firestore تحتاج لتحديث قواعد الحماية (firestore.rules) في Firebase Console للسماح بالقراءة والكتابة للمجموعات: students, parents, teachers, attendance, payments, certificates, trash.'
        );
      }
      setFirestoreStatus('offline');
    };

    const unsubStudents = subscribeStudents(
      uid,
      (remoteStudents, meta) => {
        setFirestoreStatus(meta.fromCache && !navigator.onLine ? 'offline' : 'connected');
        setHasPendingWrites(meta.hasPendingWrites);
        setStudents((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.students);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteStudents.map((s) => [s.id, s]));
          const preservedLocal = prevLocal.filter(
            (st) => pendingIds.has(st.id) && !remoteMap.has(st.id) && !trashEntityIds.has(st.id)
          );
          return [...preservedLocal, ...remoteStudents.filter((s) => !trashEntityIds.has(s.id))];
        });
        setFirebaseCounts((prev) => ({
          ...prev,
          studentsCount: remoteStudents.length,
          lastCheckedAt: Date.now(),
        }));
      },
      handleSyncError
    );

    const unsubTeachers = subscribeTeachers(
      uid,
      (remoteTeachers) => {
        setTeachers((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.teachers);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteTeachers.map((t) => [t.id, t]));
          const preservedLocal = prevLocal.filter(
            (t) => pendingIds.has(t.id) && !remoteMap.has(t.id) && !trashEntityIds.has(t.id)
          );
          return [...preservedLocal, ...remoteTeachers.filter((t) => !trashEntityIds.has(t.id))];
        });
        setFirebaseCounts((prev) => ({
          ...prev,
          teachersCount: remoteTeachers.length,
          lastCheckedAt: Date.now(),
        }));
      },
      handleSyncError
    );

    const unsubSchedules = subscribeSchedules(
      uid,
      (remoteSchedules) => {
        setSchedules((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.schedules);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteSchedules.map((s) => [s.id, s]));
          const preservedLocal = prevLocal.filter(
            (s) => pendingIds.has(s.id) && !remoteMap.has(s.id) && !trashEntityIds.has(s.id)
          );
          return [...preservedLocal, ...remoteSchedules.filter((s) => !trashEntityIds.has(s.id))];
        });
      },
      handleSyncError
    );

    const unsubHalaqat = subscribeHalaqat(
      uid,
      (remoteHalaqat) => {
        setHalaqat((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.halaqat);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteHalaqat.map((h) => [h.id, h]));
          const preservedLocal = prevLocal.filter(
            (h) => pendingIds.has(h.id) && !remoteMap.has(h.id) && !trashEntityIds.has(h.id)
          );
          return [...preservedLocal, ...remoteHalaqat.filter((h) => !trashEntityIds.has(h.id))];
        });
      },
      handleSyncError
    );

    const unsubSettings = subscribeSettings(
      uid,
      (remoteSettings) => {
        setSettings((prev) => {
          const storedPinCfg = getStoredManagerPinConfig();
          const resolvedConfigured =
            typeof remoteSettings.managerPinConfigured === 'boolean'
              ? remoteSettings.managerPinConfigured || storedPinCfg.configured
              : prev.managerPinConfigured || storedPinCfg.configured;
          const resolvedPin =
            remoteSettings.managerPin ||
            (storedPinCfg.configured ? storedPinCfg.pin : prev.managerPin) ||
            DEFAULT_SETTINGS.managerPin ||
            '1234';
          return {
            ...remoteSettings,
            managerPin: resolvedPin,
            managerPinConfigured: resolvedConfigured,
          };
        });
        if (typeof remoteSettings.logoDataUrl === 'string') {
          setPublicAcademyLogoUrl(remoteSettings.logoDataUrl);
          setCachedAcademyLogo(remoteSettings.logoDataUrl);
        }
        if (remoteSettings.loginBannerUrl && !getCachedLoginBanner()) {
          setLoginBannerUrl(remoteSettings.loginBannerUrl);
          setCachedLoginBanner(remoteSettings.loginBannerUrl);
        }
      },
      handleSyncError
    );

    const unsubTrialLessons = subscribeTrialLessons(
      uid,
      (remoteLessons) => {
        setTrialLessons((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.trialLessons);
          const trashEntityIds = new Set(latestBundleRef.current.trash.map((t) => t.entityId));
          const remoteMap = new Map(remoteLessons.map((l) => [l.id, l]));
          const preservedLocal = prevLocal.filter(
            (l) => pendingIds.has(l.id) && !remoteMap.has(l.id) && !trashEntityIds.has(l.id)
          );
          return [...preservedLocal, ...remoteLessons.filter((l) => !trashEntityIds.has(l.id))];
        });
      },
      handleSyncError
    );

    const unsubAttendance = subscribeAttendance(
      uid,
      (remoteAttendance) => {
        setAttendance((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.attendance);
          const remoteMap = new Map(remoteAttendance.map((a) => [a.id, a]));
          const preservedLocal = prevLocal.filter(
            (a) => pendingIds.has(a.id) && !remoteMap.has(a.id)
          );
          return [...preservedLocal, ...remoteAttendance];
        });
      },
      handleSyncError
    );

    const unsubPayments = subscribePayments(
      uid,
      (remotePayments) => {
        setPayments((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.payments);
          const remoteMap = new Map(remotePayments.map((p) => [p.id, p]));
          const preservedLocal = prevLocal.filter(
            (p) => pendingIds.has(p.id) && !remoteMap.has(p.id)
          );
          return [...preservedLocal, ...remotePayments];
        });
      },
      handleSyncError
    );

    const unsubRatings = subscribeTeacherRatings(
      uid,
      (remoteRatings) => {
        setTeacherRatings((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.teacherRatings);
          const remoteMap = new Map(remoteRatings.map((r) => [r.id, r]));
          const preservedLocal = prevLocal.filter(
            (r) => pendingIds.has(r.id) && !remoteMap.has(r.id)
          );
          return [...preservedLocal, ...remoteRatings];
        });
      },
      handleSyncError
    );

    const unsubTrash = subscribeTrash(
      uid,
      (remoteTrash) => {
        setTrashItems((prevLocal) => {
          const pendingIds = new Set(latestBundleRef.current.pendingSync.trash);
          const remoteMap = new Map(remoteTrash.map((t) => [t.id, t]));
          const preservedLocal = filterActiveTrashItems(
            prevLocal.filter((t) => pendingIds.has(t.id) && !remoteMap.has(t.id))
          );
          return [...preservedLocal, ...remoteTrash];
        });
      },
      handleSyncError
    );

    return () => {
      cancelled = true;
      unsubStudents();
      unsubTeachers();
      unsubSchedules();
      unsubHalaqat();
      unsubSettings();
      unsubTrialLessons();
      unsubAttendance();
      unsubPayments();
      unsubRatings();
      unsubTrash();
    };
  }, [authUser, isOnline]);

  // Routing guard
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/' &&
      !window.location.pathname.includes('.')
    ) {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const effectiveLogoUrl = settings.logoDataUrl || publicAcademyLogoUrl || '';

  // Synchronize dynamic PWA icon
  useEffect(() => {
    syncAppIcon(effectiveLogoUrl);
  }, [effectiveLogoUrl]);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || null;
  const newTrialLessonsCount = trialLessons.filter((l) => l.status === 'new').length;

  // Smart Dashboard Alerts Calculations
  const todayStr = getTodayDateStr();
  const todayAbsences = attendance.filter(
    (a) => a.date === todayStr && a.status === 'absent'
  );
  const paymentDueAlerts = students.filter((s) => {
    const days = getDaysUntilDate(s.nextPaymentDate);
    return days !== null && days <= 3;
  });

  // Student Actions (Optimistic local state + Firestore queued offline/realtime write)
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
  };

  const handleBackToStudents = () => {
    setSelectedStudentId(null);
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const syncEntityPending = useCallback(
    (
      key: Exclude<keyof PendingSyncMap, 'settingsPending'>,
      id: string,
      isPending: boolean
    ) => {
      setPendingSync((prev) =>
        isPending ? addPendingId(prev, key, id) : removePendingId(prev, key, id)
      );
    },
    []
  );

  const handleSaveStudentData = (studentData: Partial<Student>) => {
    const uid = authUser?.uid;
    const exists = studentToEdit && students.some((s) => s.id === studentToEdit.id);

    if (exists && studentToEdit) {
      const updatedStudent: Student = { ...studentToEdit, ...studentData };
      setStudents((prev) => prev.map((s) => (s.id === studentToEdit.id ? updatedStudent : s)));
      syncEntityPending('students', updatedStudent.id, true);
      if (uid && isFirebaseConfigured()) {
        saveStudentToFirestore(uid, updatedStudent)
          .then(() => syncEntityPending('students', updatedStudent.id, false))
          .catch((err) => console.warn('Firestore write queued locally:', err));
      }
    } else {
      const newStudent: Student = {
        id: studentToEdit?.id || `std-${Date.now()}`,
        name: studentData.name || '',
        age: studentData.age || '',
        stage: studentData.stage || '',
        educationSystem: studentData.educationSystem,
        gradeLevel: studentData.gradeLevel || '',
        track: studentData.track || '',
        studyScope: studentData.studyScope,
        selectedSubjects: studentData.selectedSubjects || [],
        phone: studentData.phone || '',
        course: studentData.course || 'حفظ القرآن الكريم',
        feeStatus: studentData.feeStatus || 'unpaid',
        notes: studentData.notes || '',
        parentName: studentData.parentName || studentData.name || '',
        parentPhone: studentData.parentPhone || studentData.phone || '',
        assignedTeacherId: studentData.assignedTeacherId || '',
        halaqaId: studentData.halaqaId || '',
        halaqaName: studentData.halaqaName || '',
        registeredDate: todayStr,
        reports: [],
        stars: 0,
        totalStarsEarned: 0,
        starCyclesCompleted: 0,
        completedJuz: studentData.completedJuz ?? 0,
        currentSurah: studentData.currentSurah || 'سورة الفاتحة',
        subscriptionAmount:
          studentData.subscriptionAmount ?? settings.defaultSubscriptionAmount ?? 250,
        nextPaymentDate: studentData.nextPaymentDate || addDaysToDateStr(todayStr, 30),
        certificates: [],
      };
      setStudents((prev) => [newStudent, ...prev]);
      setSelectedStudentId(newStudent.id);
      syncEntityPending('students', newStudent.id, true);
      if (uid && isFirebaseConfigured()) {
        saveStudentToFirestore(uid, newStudent)
          .then(() => syncEntityPending('students', newStudent.id, false))
          .catch((err) => console.warn('Firestore write queued locally:', err));
      }
    }
    setIsStudentModalOpen(false);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    syncEntityPending('students', updatedStudent.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveStudentToFirestore(authUser.uid, updatedStudent)
        .then(() => syncEntityPending('students', updatedStudent.id, false))
        .catch((err) => console.warn('Firestore write queued locally:', err));
    }
  };

  // Explicit Confirmation + Move to 30-day Trash Bin (NEVER immediate permanent delete)
  const requestMoveToTrash = (item: TrashItem, onLocalRemove: () => void, onCloudRemove?: () => Promise<void>) => {
    setConfirmModalState({
      isOpen: true,
      title: 'تأكيد النقل إلى سلة المحذوفات',
      message: `هل أنت متأكد من حذف «${item.title}»؟ سيتم نقله إلى سلة المحذوفات ويمكنك استعادته في أي وقت خلال 30 يوماً قبل المسح النهائي.`,
      confirmLabel: 'نقل لسلة المحذوفات (30 يوم)',
      tone: 'warning',
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        onLocalRemove();
        setTrashItems((prev) => [item, ...prev.filter((t) => t.id !== item.id)]);
        syncEntityPending('trash', item.id, true);

        if (authUser && isFirebaseConfigured()) {
          saveTrashItemToFirestore(authUser.uid, item)
            .then(() => syncEntityPending('trash', item.id, false))
            .catch((err) => console.warn('Trash Firestore save queued:', err));
          if (onCloudRemove) {
            onCloudRemove().catch((err) => console.warn('Firestore delete warning:', err));
          }
        }
      },
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    const tItem = buildTrashItem(
      'student',
      target.id,
      target.name,
      `ولي الأمر: ${target.parentName || target.name} • ${target.course}`,
      target
    );
    requestMoveToTrash(
      tItem,
      () => {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        syncEntityPending('students', studentId, false);
        setSelectedStudentId(null);
      },
      authUser ? () => deleteStudentFromFirestore(authUser.uid, studentId) : undefined
    );
  };

  // Teacher Actions (Save immediately to Firebase `teachers` collection + local mirror)
  const handleAddTeacher = (teacherData: Omit<Teacher, 'id' | 'createdAt'>) => {
    const normalizedPhone = normalizePhoneAuth(teacherData.phone);
    const newTeacher: Teacher = {
      ...teacherData,
      id: `tch-${normalizedPhone || Date.now()}-${Date.now()}`,
      phone: normalizedPhone || teacherData.phone,
      normalizedPhone,
      role: 'teacher',
      ownerUid: authUser?.uid || linkedGoogle?.uid || 'academy_shared',
      createdAt: Date.now(),
    };
    setTeachers((prev) => [newTeacher, ...prev]);
    syncEntityPending('teachers', newTeacher.id, true);
    if (isFirebaseConfigured()) {
      saveTeacherToFirestore(authUser?.uid, newTeacher)
        .then(() => syncEntityPending('teachers', newTeacher.id, false))
        .catch((err) => console.warn('Firestore write queued locally:', err));
    }
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const normalizedPhone = normalizePhoneAuth(updatedTeacher.phone);
    const enrichedTeacher: Teacher = {
      ...updatedTeacher,
      phone: normalizedPhone || updatedTeacher.phone,
      normalizedPhone,
      role: 'teacher',
    };
    setTeachers((prev) => prev.map((t) => (t.id === enrichedTeacher.id ? enrichedTeacher : t)));
    syncEntityPending('teachers', enrichedTeacher.id, true);
    if (isFirebaseConfigured()) {
      saveTeacherToFirestore(authUser?.uid, enrichedTeacher)
        .then(() => syncEntityPending('teachers', enrichedTeacher.id, false))
        .catch((err) => console.warn('Firestore write queued locally:', err));
    }
  };

  const handleDeleteTeacher = (id: string) => {
    const target = teachers.find((t) => t.id === id);
    if (!target) return;
    const tItem = buildTrashItem(
      'teacher',
      target.id,
      target.name,
      `${target.specialization || 'معلم قرآن'} • ${target.phone}`,
      target
    );
    requestMoveToTrash(
      tItem,
      () => {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        syncEntityPending('teachers', id, false);
      },
      isFirebaseConfigured()
        ? () => deleteTeacherFromFirestore(authUser?.uid, id)
        : undefined
    );
  };

  const handleLoginAsTeacherPreview = (teacher: Teacher) => {
    setAdminPreviewingTeacher(true);
    setSelectedPortalTeacherId(teacher.id);
    setAppRole('teacher');
  };

  const handleExitAdminPreview = () => {
    setAdminPreviewingTeacher(false);
    setSelectedPortalTeacherId('');
    setAppRole('admin');
    setCurrentTab('teachers');
  };

  // Halaqa Group Actions
  const handleAddHalaqa = (halaqaData: Omit<HalaqaGroup, 'id' | 'createdAt'>) => {
    const newHalaqa: HalaqaGroup = {
      ...halaqaData,
      id: `hlq-${Date.now()}`,
      createdAt: Date.now(),
    };
    setHalaqat((prev) => [newHalaqa, ...prev]);
    syncEntityPending('halaqat', newHalaqa.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveHalaqaToFirestore(authUser.uid, newHalaqa)
        .then(() => syncEntityPending('halaqat', newHalaqa.id, false))
        .catch((err) => console.warn('Halaqa Firestore queued locally:', err));
    }
  };

  const handleUpdateHalaqa = (updatedHalaqa: HalaqaGroup) => {
    setHalaqat((prev) => prev.map((h) => (h.id === updatedHalaqa.id ? updatedHalaqa : h)));
    syncEntityPending('halaqat', updatedHalaqa.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveHalaqaToFirestore(authUser.uid, updatedHalaqa)
        .then(() => syncEntityPending('halaqat', updatedHalaqa.id, false))
        .catch((err) => console.warn('Halaqa Firestore queued locally:', err));
    }
  };

  const handleDeleteHalaqa = (id: string) => {
    const target = halaqat.find((h) => h.id === id);
    if (!target) return;
    const tItem = buildTrashItem(
      'halaqa',
      target.id,
      target.name,
      `${target.subject} • ${target.teacherName}`,
      target
    );
    requestMoveToTrash(
      tItem,
      () => {
        setHalaqat((prev) => prev.filter((h) => h.id !== id));
        syncEntityPending('halaqat', id, false);
      },
      authUser ? () => deleteHalaqaFromFirestore(authUser.uid, id) : undefined
    );
  };

  // Exam & Student Grades Actions
  const handleSaveExam = (exam: Exam) => {
    const enriched: Exam = {
      ...exam,
      ownerUid: exam.ownerUid || authUser?.uid || linkedGoogle?.uid || 'academy_shared',
      updatedAt: Date.now(),
    };
    setExams((prev) => [enriched, ...prev.filter((e) => e.id !== enriched.id)]);
    syncEntityPending('exams', enriched.id, true);
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      saveExamToFirestore(authUser?.uid, enriched)
        .then(() => syncEntityPending('exams', enriched.id, false))
        .catch((err) => console.warn('Exam Firestore queued locally:', err));
    }
  };

  const handleDeleteExam = (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    syncEntityPending('exams', examId, false);
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      deleteExamFromFirestore(authUser?.uid, examId).catch((err) =>
        console.warn('Exam Firestore delete warning:', err)
      );
    }
  };

  // Homework Assignments Actions
  const handleSaveHomework = (hw: HomeworkAssignment) => {
    const enriched: HomeworkAssignment = {
      ...hw,
      ownerUid: hw.ownerUid || authUser?.uid || linkedGoogle?.uid || 'academy_shared',
      updatedAt: Date.now(),
    };
    setHomeworks((prev) => [enriched, ...prev.filter((h) => h.id !== enriched.id)]);
    syncEntityPending('homeworks', enriched.id, true);
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      saveHomeworkToFirestore(authUser?.uid, enriched)
        .then(() => syncEntityPending('homeworks', enriched.id, false))
        .catch((err) => console.warn('Homework Firestore queued locally:', err));
    }
  };

  const handleDeleteHomework = (homeworkId: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== homeworkId));
    syncEntityPending('homeworks', homeworkId, false);
    if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      deleteHomeworkFromFirestore(authUser?.uid, homeworkId).catch((err) =>
        console.warn('Homework Firestore delete warning:', err)
      );
    }
  };

  // Schedule Actions
  const handleAddSchedule = (scheduleData: Omit<ScheduleAppointment, 'id'>) => {
    const newSchedule: ScheduleAppointment = {
      ...scheduleData,
      id: `sch-${Date.now()}`,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    syncEntityPending('schedules', newSchedule.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveScheduleToFirestore(authUser.uid, newSchedule)
        .then(() => syncEntityPending('schedules', newSchedule.id, false))
        .catch((err) => console.warn('Firestore write queued locally:', err));
    }
  };

  const handleDeleteSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;
    const tItem = buildTrashItem(
      'schedule',
      target.id,
      `حلقة ${target.studentName} (${target.day} - ${target.time})`,
      `المعلم: ${target.teacherName}`,
      target
    );
    requestMoveToTrash(
      tItem,
      () => {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        syncEntityPending('schedules', id, false);
      },
      authUser ? () => deleteScheduleFromFirestore(authUser.uid, id) : undefined
    );
  };

  // 1. Mark Attendance Handler (supports customDate & halaqaId)
  const handleMarkAttendance = (
    student: Student,
    status: AttendanceStatus,
    schedule?: ScheduleAppointment,
    customDate?: string,
    halaqaId?: string
  ) => {
    const targetDate = customDate || todayStr;
    const teacherId = schedule?.teacherId || student.assignedTeacherId || '';
    const teacherObj = teachers.find((t) => t.id === teacherId);
    const teacherName = schedule?.teacherName || teacherObj?.name || 'معلم الحلقة';
    const recordId = schedule
      ? `att-${student.id}-${targetDate}-${schedule.id}`
      : `att-${student.id}-${targetDate}`;

    const newRecord: AttendanceRecord = {
      id: recordId,
      scheduleId: schedule?.id || '',
      halaqaId: halaqaId || student.halaqaId || '',
      studentId: student.id,
      studentName: student.name,
      teacherId,
      teacherName,
      date: targetDate,
      status,
      createdAt: Date.now(),
    };

    setAttendance((prev) => [newRecord, ...prev.filter((a) => a.id !== recordId)]);
    syncEntityPending('attendance', newRecord.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveAttendanceToFirestore(authUser.uid, newRecord)
        .then(() => syncEntityPending('attendance', newRecord.id, false))
        .catch((err) => console.warn('Attendance Firestore notice:', err));
    }
  };

  // 2. Stars & 10-Star Reset Cycle Handler
  const handleAddStar = (student: Student): { reachedTen: boolean; newStars: number } => {
    const currentStars = student.stars ?? 0;
    const incremented = currentStars + 1;
    const totalEarned = (student.totalStarsEarned ?? currentStars) + 1;

    if (incremented >= 10) {
      const starCert: CertificateRecord = {
        id: `cert-stars-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        juzName: 'وسام التميز والتفوق (إتمام 10 نجوم)',
        completionDate: todayStr,
        type: 'stars',
        createdAt: Date.now(),
      };
      const updatedStudent: Student = {
        ...student,
        stars: 0,
        totalStarsEarned: totalEarned,
        starCyclesCompleted: (student.starCyclesCompleted ?? 0) + 1,
        certificates: [starCert, ...(student.certificates || [])],
      };
      handleUpdateStudent(updatedStudent);
      setStarCelebration({ student: updatedStudent, cert: starCert });
      return { reachedTen: true, newStars: 0 };
    } else {
      const updatedStudent: Student = {
        ...student,
        stars: incremented,
        totalStarsEarned: totalEarned,
      };
      handleUpdateStudent(updatedStudent);
      return { reachedTen: false, newStars: incremented };
    }
  };

  // 5. Record Payment & Open Sleek Receipt Modal
  const handleRecordPayment = (student: Student, amount?: number, notes?: string) => {
    const finalAmount =
      amount ?? student.subscriptionAmount ?? settings.defaultSubscriptionAmount ?? 250;
    const currency = settings.currency || 'ر.س';
    const paymentDate = getTodayDateStr();
    const receiptNumber = `FUR-${Date.now().toString().slice(-6)}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      studentId: student.id,
      studentName: student.name,
      amount: finalAmount,
      currency,
      date: paymentDate,
      monthKey: paymentDate.slice(0, 7),
      notes: notes || 'اشتراك الحلقات القرآنية الشهري',
      createdAt: Date.now(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    syncEntityPending('payments', newPayment.id, true);
    if (authUser && isFirebaseConfigured()) {
      savePaymentToFirestore(authUser.uid, newPayment)
        .then(() => syncEntityPending('payments', newPayment.id, false))
        .catch((err) => console.warn('Payment Firestore notice:', err));
    }

    const updatedStudent: Student = {
      ...student,
      feeStatus: 'paid',
      subscriptionAmount: finalAmount,
      lastPaymentDate: paymentDate,
      nextPaymentDate: addDaysToDateStr(paymentDate, 30),
    };
    handleUpdateStudent(updatedStudent);
    setActiveReceipt(newPayment);
  };

  // 11. Save Certificate Record to Student
  const handleSaveCertificate = (cert: CertificateRecord) => {
    const st = students.find((s) => s.id === cert.studentId);
    if (!st) return;
    const existing = st.certificates || [];
    if (existing.some((c) => c.id === cert.id)) return;
    handleUpdateStudent({
      ...st,
      certificates: [cert, ...existing],
    });
  };

  // 9. Submit Teacher Rating
  const handleSubmitTeacherRating = (ratingData: Omit<TeacherRating, 'id' | 'createdAt'>) => {
    const newRating: TeacherRating = {
      ...ratingData,
      id: `rate-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTeacherRatings((prev) => [newRating, ...prev]);
    syncEntityPending('teacherRatings', newRating.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveTeacherRatingToFirestore(authUser.uid, newRating)
        .then(() => syncEntityPending('teacherRatings', newRating.id, false))
        .catch((err) => console.warn('Rating Firestore notice:', err));
    }
  };

  // Settings Actions
  const handleSaveSettings = (newSettings: AcademySettings) => {
    const nextLogo = newSettings.logoDataUrl || '';
    const merged: AcademySettings = {
      ...newSettings,
      logoDataUrl: nextLogo,
      loginBannerUrl: loginBannerUrl || newSettings.loginBannerUrl || '',
    };
    if (merged.managerPin && merged.managerPinConfigured) {
      setStoredManagerPinConfig(merged.managerPin, true);
    }
    setSettings(merged);
    setPublicAcademyLogoUrl(nextLogo);
    setCachedAcademyLogo(nextLogo);
    setPendingSync((prev) => ({ ...prev, settingsPending: true }));
    if (authUser && isFirebaseConfigured()) {
      saveSettingsToFirestore(authUser.uid, merged)
        .then(() => setPendingSync((prev) => ({ ...prev, settingsPending: false })))
        .catch((err) => console.warn('Firestore write queued locally:', err));
      savePublicAcademyLogo(authUser.uid, nextLogo).catch((err) =>
        console.warn('Public logo sync warning:', err)
      );
    }
  };

  const handleSaveLoginBanner = async (newBannerUrl: string) => {
    setLoginBannerUrl(newBannerUrl);
    setCachedLoginBanner(newBannerUrl);

    if (!authUser || !isFirebaseConfigured()) {
      return { publicSaved: false, permissionDenied: false };
    }

    const updatedSettings: AcademySettings = {
      ...settings,
      loginBannerUrl: newBannerUrl,
    };
    setSettings(updatedSettings);
    saveSettingsToFirestore(authUser.uid, updatedSettings).catch((err) =>
      console.warn('Firestore write warning:', err)
    );

    return await savePublicLoginBanner(authUser.uid, newBannerUrl);
  };

  // Trial Lesson Actions
  const handleSaveTrialLesson = async (data: {
    studentName: string;
    parentPhone: string;
    stageOrAge: string;
    notes?: string;
    preferredTime?: string;
  }) => {
    const newLesson: TrialLesson = {
      id: `trial-${Date.now()}`,
      studentName: data.studentName,
      parentPhone: data.parentPhone,
      stageOrAge: data.stageOrAge,
      notes: data.notes || '',
      preferredTime: data.preferredTime || '',
      status: 'new',
      createdAt: Date.now(),
    };
    setTrialLessons((prev) => [newLesson, ...prev]);
    syncEntityPending('trialLessons', newLesson.id, true);
    if (authUser && isFirebaseConfigured()) {
      await saveTrialLessonToFirestore(authUser.uid, newLesson)
        .then(() => syncEntityPending('trialLessons', newLesson.id, false))
        .catch((err) => console.warn('Trial lesson queued locally:', err));
    }
  };

  const handleUpdateTrialLessonStatus = (id: string, status: TrialLessonStatus) => {
    setTrialLessons((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    syncEntityPending('trialLessons', id, true);
    if (authUser && isFirebaseConfigured()) {
      updateTrialLessonStatusInFirestore(authUser.uid, id, status)
        .then(() => syncEntityPending('trialLessons', id, false))
        .catch(console.warn);
    }
  };

  const handleDeleteTrialLesson = (id: string) => {
    const target = trialLessons.find((l) => l.id === id);
    if (!target) return;
    const tItem = buildTrashItem(
      'trialLesson',
      target.id,
      target.studentName,
      `هاتف: ${target.parentPhone} • ${target.stageOrAge}`,
      target
    );
    requestMoveToTrash(
      tItem,
      () => {
        setTrialLessons((prev) => prev.filter((l) => l.id !== id));
        syncEntityPending('trialLessons', id, false);
      },
      authUser ? () => deleteTrialLessonFromFirestore(authUser.uid, id) : undefined
    );
  };

  // Restore Item from 30-Day Trash Bin
  const handleRestoreTrashItem = (item: TrashItem) => {
    setTrashItems((prev) => prev.filter((t) => t.id !== item.id));
    syncEntityPending('trash', item.id, false);
    if (authUser && isFirebaseConfigured()) {
      deleteTrashItemFromFirestore(authUser.uid, item.id).catch(console.warn);
    }

    if (item.entityType === 'student') {
      const st = item.data as Student;
      setStudents((prev) => [st, ...prev.filter((s) => s.id !== st.id)]);
      syncEntityPending('students', st.id, true);
      if (authUser && isFirebaseConfigured()) {
        saveStudentToFirestore(authUser.uid, st)
          .then(() => syncEntityPending('students', st.id, false))
          .catch(console.warn);
      }
    } else if (item.entityType === 'teacher') {
      const tch = item.data as Teacher;
      setTeachers((prev) => [tch, ...prev.filter((t) => t.id !== tch.id)]);
      syncEntityPending('teachers', tch.id, true);
      if (authUser && isFirebaseConfigured()) {
        saveTeacherToFirestore(authUser.uid, tch)
          .then(() => syncEntityPending('teachers', tch.id, false))
          .catch(console.warn);
      }
    } else if (item.entityType === 'halaqa') {
      const hlq = item.data as HalaqaGroup;
      setHalaqat((prev) => [hlq, ...prev.filter((h) => h.id !== hlq.id)]);
      syncEntityPending('halaqat', hlq.id, true);
      if (authUser && isFirebaseConfigured()) {
        saveHalaqaToFirestore(authUser.uid, hlq)
          .then(() => syncEntityPending('halaqat', hlq.id, false))
          .catch(console.warn);
      }
    } else if (item.entityType === 'schedule') {
      const sch = item.data as ScheduleAppointment;
      setSchedules((prev) => [sch, ...prev.filter((s) => s.id !== sch.id)]);
      syncEntityPending('schedules', sch.id, true);
      if (authUser && isFirebaseConfigured()) {
        saveScheduleToFirestore(authUser.uid, sch)
          .then(() => syncEntityPending('schedules', sch.id, false))
          .catch(console.warn);
      }
    } else if (item.entityType === 'trialLesson') {
      const lesson = item.data as TrialLesson;
      setTrialLessons((prev) => [lesson, ...prev.filter((l) => l.id !== lesson.id)]);
      syncEntityPending('trialLessons', lesson.id, true);
      if (authUser && isFirebaseConfigured()) {
        saveTrialLessonToFirestore(authUser.uid, lesson)
          .then(() => syncEntityPending('trialLessons', lesson.id, false))
          .catch(console.warn);
      }
    }
  };

  const handleRequestPermanentDeleteTrashItem = (item: TrashItem) => {
    setConfirmModalState({
      isOpen: true,
      title: 'تأكيد الحذف النهائي الدائم',
      message: `هل تريد حذف «${item.title}» نهائياً من سلة المحذوفات؟ لن يمكن استعادة هذا السجل مرة أخرى بعد الحذف النهائي.`,
      confirmLabel: 'حذف نهائي الآن',
      tone: 'danger',
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        setTrashItems((prev) => prev.filter((t) => t.id !== item.id));
        syncEntityPending('trash', item.id, false);
        if (authUser && isFirebaseConfigured()) {
          deleteTrashItemFromFirestore(authUser.uid, item.id).catch(console.warn);
        }
      },
    });
  };

  const handleConvertTrialToStudent = (lesson: TrialLesson) => {
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: lesson.studentName,
      age: lesson.stageOrAge,
      stage: lesson.stageOrAge,
      phone: lesson.parentPhone,
      course: 'حفظ القرآن الكريم وتجويده',
      feeStatus: 'unpaid',
      notes: `تم القبول والتحويل من طلب حصة تجريبية.${lesson.notes ? ` ملاحظات: ${lesson.notes}` : ''}`,
      parentName: `ولي أمر ${lesson.studentName}`,
      parentPhone: lesson.parentPhone,
      assignedTeacherId: teachers[0]?.id || '',
      halaqaId: halaqat[0]?.id || '',
      halaqaName: halaqat[0]?.name || '',
      registeredDate: todayStr,
      reports: [],
      stars: 0,
      totalStarsEarned: 0,
      starCyclesCompleted: 0,
      completedJuz: 0,
      currentSurah: 'سورة الفاتحة',
      subscriptionAmount: settings.defaultSubscriptionAmount ?? 250,
      nextPaymentDate: addDaysToDateStr(todayStr, 30),
      certificates: [],
    };
    setStudents((prev) => [newStudent, ...prev]);
    syncEntityPending('students', newStudent.id, true);
    if (authUser && isFirebaseConfigured()) {
      saveStudentToFirestore(authUser.uid, newStudent)
        .then(() => syncEntityPending('students', newStudent.id, false))
        .catch((err) => console.warn('Firestore write queued locally:', err));
    }
    handleUpdateTrialLessonStatus(lesson.id, 'enrolled');
  };

  // Explicit confirmation required before resetting all data
  const handleResetData = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'تأكيد تصفير ومسح جميع البيانات',
      message:
        'هل أنت متأكد من تصفير ومسح جميع البيانات (الطلاب، المعلمين، المواعيد، الحضور، المدفوعات، سلة المحذوفات) نهائياً؟ لا يمكن التراجع عن هذه الخطوة.',
      confirmLabel: 'نعم، مسح جميع البيانات',
      tone: 'danger',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        purgeLegacyLocalStorage();
        clearDurableAcademyDataOnlyOnManualReset();
        setStudents([]);
        setTeachers([]);
        setHalaqat([]);
        setSchedules([]);
        setTrialLessons([]);
        setAttendance([]);
        setPayments([]);
        setTeacherRatings([]);
        setExams([]);
        setHomeworks([]);
        setTrashItems([]);
        setPendingSync({ ...EMPTY_PENDING_SYNC });
        setSelectedStudentId(null);
        const resetSettings: AcademySettings = {
          ...DEFAULT_SETTINGS,
          email: authUser?.email || '',
        };
        setSettings(resetSettings);
        syncAppIcon('');
        if (authUser && isFirebaseConfigured()) {
          await clearAllUserDataFromFirestore(authUser.uid).catch(console.warn);
          await saveSettingsToFirestore(authUser.uid, resetSettings).catch(console.warn);
        }
      },
    });
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setManualSyncFeedback(null);

    if (!isFirebaseConfigured()) {
      setFirestoreStatus('offline');
      setManualSyncFeedback('يرجى إدخال API Key الخاص بـ Firebase داخل ملف src/firebase.js أولاً.');
      setIsManualSyncing(false);
      return;
    }

    if (isTemporaryPreviewHost() || !authUser) {
      setFirestoreStatus('offline');
      setManualSyncFeedback(
        'النظام حالياً على وضع الحفظ المحلي المؤقت. عند فتح التطبيق على النطاق المنشور وتسجيل الدخول بجوجل سيتم نقل كافة السجلات تلقائياً لـ Firebase.'
      );
      setIsManualSyncing(false);
      return;
    }

    setFirestoreStatus('connecting');
    const ok = await testConnection();
    if (!ok) {
      setFirestoreStatus('offline');
      setManualSyncFeedback('تعذر الوصول لخادم Firebase حالياً. تأكد من الاتصال بالإنترنت.');
      setIsManualSyncing(false);
      return;
    }

    try {
      const res = await migrateLocalBundleToFirestore(authUser.uid, latestBundleRef.current);
      setPendingSync({ ...EMPTY_PENDING_SYNC });
      setFirebaseCounts({
        studentsCount: res.studentsCount,
        teachersCount: res.teachersCount,
        parentsCount: res.parentsCount,
        certificatesCount: res.certificatesCount,
        lastCheckedAt: Date.now(),
      });
      setFirestoreStatus('connected');
      setManualSyncFeedback(
        res.migratedCount > 0
          ? `تمت المزامنة بنجاح ونقل ${res.migratedCount} سجل إلى Firebase بدون مسح أي بيانات.`
          : 'متصل بنجاح! جميع البيانات متطابقة ومحفوظة في Firebase Firestore.'
      );
    } catch {
      const counts = await getFirestoreCollectionCounts(authUser.uid);
      setFirebaseCounts({
        studentsCount: counts.studentsCount,
        teachersCount: counts.teachersCount,
        parentsCount: counts.parentsCount,
        certificatesCount: counts.certificatesCount,
        lastCheckedAt: Date.now(),
      });
      setFirestoreStatus('offline');
      setManualSyncFeedback('حدث عائق مؤقت أثناء رفع بعض السجلات، والبيانات ما زالت محفوظة محلياً بأمان.');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleOpenFirebaseStatus = () => {
    setManualSyncFeedback(null);
    setIsFirebaseStatusOpen(true);
    if (authUser && isFirebaseConfigured() && !isTemporaryPreviewHost()) {
      getFirestoreCollectionCounts(authUser.uid)
        .then((counts) => {
          setFirebaseCounts({
            studentsCount: counts.studentsCount,
            teachersCount: counts.teachersCount,
            parentsCount: counts.parentsCount,
            certificatesCount: counts.certificatesCount,
            lastCheckedAt: Date.now(),
          });
        })
        .catch(() => {});
    }
  };

  // Universal Blob JSON Backup Download
  const handleExportData = async () => {
    const data = {
      students,
      teachers,
      halaqat,
      schedules,
      attendance,
      payments,
      teacherRatings,
      trialLessons,
      exams,
      homeworks,
      trash: trashItems,
      settings,
      exportedAt: new Date().toISOString(),
      academy: settings.academyName,
      accountEmail: authUser?.email || '',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const filename = `al-furqan-academy-backup-${todayStr}.json`;
    await executeUniversalDownload(blob, filename, 'application/json', setExportDownloadState);
  };

  const handleImportData = (jsonStr: string) => {
    const uid = authUser?.uid;
    const parsed = JSON.parse(jsonStr);
    if (parsed.students && Array.isArray(parsed.students)) {
      setStudents(parsed.students);
      parsed.students.forEach((st: Student) => {
        syncEntityPending('students', st.id, true);
        if (uid && isFirebaseConfigured()) {
          saveStudentToFirestore(uid, st)
            .then(() => syncEntityPending('students', st.id, false))
            .catch(() => {});
        }
      });
    }
    if (parsed.teachers && Array.isArray(parsed.teachers)) {
      setTeachers(parsed.teachers);
      parsed.teachers.forEach((tch: Teacher) => {
        syncEntityPending('teachers', tch.id, true);
        if (uid && isFirebaseConfigured()) {
          saveTeacherToFirestore(uid, tch)
            .then(() => syncEntityPending('teachers', tch.id, false))
            .catch(() => {});
        }
      });
    }
    if (parsed.schedules && Array.isArray(parsed.schedules)) {
      setSchedules(parsed.schedules);
      parsed.schedules.forEach((sch: ScheduleAppointment) => {
        syncEntityPending('schedules', sch.id, true);
        if (uid && isFirebaseConfigured()) {
          saveScheduleToFirestore(uid, sch)
            .then(() => syncEntityPending('schedules', sch.id, false))
            .catch(() => {});
        }
      });
    }
    if (parsed.exams && Array.isArray(parsed.exams)) {
      setExams(parsed.exams);
      parsed.exams.forEach((ex: Exam) => {
        syncEntityPending('exams', ex.id, true);
        if (uid && isFirebaseConfigured()) {
          saveExamToFirestore(uid, ex)
            .then(() => syncEntityPending('exams', ex.id, false))
            .catch(() => {});
        }
      });
    }
    if (parsed.homeworks && Array.isArray(parsed.homeworks)) {
      setHomeworks(parsed.homeworks);
      parsed.homeworks.forEach((hw: HomeworkAssignment) => {
        syncEntityPending('homeworks', hw.id, true);
        if (uid && isFirebaseConfigured()) {
          saveHomeworkToFirestore(uid, hw)
            .then(() => syncEntityPending('homeworks', hw.id, false))
            .catch(() => {});
        }
      });
    }
    if (parsed.settings) {
      setSettings(parsed.settings);
      syncAppIcon(parsed.settings.logoDataUrl);
      setPendingSync((prev) => ({ ...prev, settingsPending: true }));
      if (uid && isFirebaseConfigured()) {
        saveSettingsToFirestore(uid, parsed.settings)
          .then(() => setPendingSync((prev) => ({ ...prev, settingsPending: false })))
          .catch(() => {});
      }
    }
  };

  const isFirebaseActuallyConnected = Boolean(
    isFirebaseConfigured() &&
      !isTemporaryPreviewHost() &&
      authUser &&
      isOnline &&
      firestoreStatus === 'connected'
  );

  const firebaseStats: FirebaseConnectionStats = {
    configured: isFirebaseConfigured(),
    hasCustomApiKey: hasCustomUserApiKey(),
    connected: isFirebaseActuallyConnected,
    projectId: String((firebaseConfig as any)?.projectId || ''),
    studentsCount: firebaseCounts.studentsCount,
    teachersCount: firebaseCounts.teachersCount,
    parentsCount: firebaseCounts.parentsCount,
    certificatesCount: firebaseCounts.certificatesCount,
    pendingSyncCount: countPendingSyncItems(pendingSync),
    lastCheckedAt: firebaseCounts.lastCheckedAt,
    reason: !isFirebaseConfigured()
      ? 'لم يتم إدخال إعدادات Firebase / API Key في ملف src/firebase.js بعد.'
      : isTemporaryPreviewHost()
      ? 'نطاق المعاينة المؤقت يعمل بوضع الحفظ المحلي الآمن. عند الفتح على النطاق المنشور وتسجيل الدخول بجوجل يتصل مباشرة بـ Firebase.'
      : !isOnline
      ? 'الإنترنت منقطع حالياً — جميع التعديلات محفوظة محلياً وسيتم رفعها تلقائياً لـ Firebase عند عودة الاتصال.'
      : !authUser
      ? 'يرجى ربط حساب جوجل للاتصال والمزامنة مع قاعدة بيانات Firebase الخاصة بك.'
      : firestoreStatus !== 'connected'
      ? 'جاري التحقق من الاتصال بخادم Firebase Firestore أو توجد قيود في الصلاحيات.'
      : undefined,
  };

  const currency = settings.currency || 'ر.س';

  const updateAlertBanner =
    hasUpdateAvailable && updateStatus !== 'updating' ? (
      <div className="no-print sticky top-0 z-50 bg-gradient-to-r from-amber-500/25 via-[#D4AF37]/30 to-emerald-500/25 backdrop-blur-md border-b border-[#D4AF37]/60 px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={applyUpdateReload}
            className="flex items-center gap-2 font-extrabold text-[#F3E5AB] hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
            <span>يوجد تحديث جديد، دوس هنا للتحديث</span>
          </button>
        </div>
      </div>
    ) : null;

  const updateProgressToast =
    updateStatus !== 'idle' && updateMessage ? (
      <div
        role="status"
        aria-live="polite"
        className={`no-print fixed top-20 left-4 right-4 max-w-md mx-auto z-50 rounded-2xl p-3.5 border-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md ${
          updateStatus === 'updating'
            ? 'bg-amber-950/95 border-[#D4AF37] text-[#F3E5AB]'
            : updateStatus === 'up-to-date'
            ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
            : 'bg-[#0B3D2E]/95 border-[#D4AF37]/60 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
          <RefreshCw
            className={`w-4 h-4 text-[#D4AF37] shrink-0 ${
              updateStatus === 'checking' || updateStatus === 'updating' ? 'animate-spin' : ''
            }`}
          />
          <span>{updateMessage}</span>
        </div>
        {updateStatus === 'up-to-date' && (
          <button
            type="button"
            onClick={dismissUpdateMessage}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    ) : null;

  const installModalElement = (
    <PWAInstallModal
      isOpen={isInstallModalOpen}
      onClose={() => setIsInstallModalOpen(false)}
      academyName={settings.academyName}
      isInstalled={isInstalled}
      isInstallable={isInstallable}
      platform={platform}
      isInAppBrowser={isInAppBrowser}
      onTriggerNativeInstall={async () => {
        const outcome = await install();
        if (outcome === 'accepted' || outcome === 'dismissed') {
          setIsInstallModalOpen(false);
        }
      }}
    />
  );

  // Loading Splash while Firebase Auth checks active session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07241B] text-white bg-islamic-pattern gap-4">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-sm font-bold text-[#F3E5AB]">جاري التحقق من حساب جوجل والمزامنة...</p>
      </div>
    );
  }

  // Mandatory Pre-Login Entry Flow:
  // 1) Direct Parent Link (?parent=<id>): jumps directly to that single child's read-only profile.
  // 2) First Launch Welcome Choice Screen: must choose Parent (ولي أمر) OR Teacher/Management (مدرس / إدارة).
  // 3) Selected Portal: Parent Portal (read-only + WhatsApp direct link) OR Staff Login (phone + password).
  const isTemporaryHost = isTemporaryPreviewHost();

  if (directParentChildId || (!appSessionLoggedIn && entryGateMode === 'parent')) {
    const portalStudents = directParentSnapshot
      ? [
          directParentSnapshot.student,
          ...students.filter((s) => s.id !== directParentSnapshot.student.id),
        ]
      : students;
    const portalAttendance = directParentSnapshot
      ? [
          ...directParentSnapshot.attendance,
          ...attendance.filter(
            (a) => !directParentSnapshot.attendance.some((da) => da.id === a.id)
          ),
        ]
      : attendance;
    const portalPayments = directParentSnapshot
      ? [
          ...directParentSnapshot.payments,
          ...payments.filter((p) => !directParentSnapshot.payments.some((dp) => dp.id === p.id)),
        ]
      : payments;
    const portalTeachers =
      directParentSnapshot?.teacherName && directParentSnapshot.student.assignedTeacherId
        ? [
            {
              id: directParentSnapshot.student.assignedTeacherId,
              name: directParentSnapshot.teacherName,
              phone: '',
              specialization: '',
              createdAt: 0,
            },
            ...teachers.filter((t) => t.id !== directParentSnapshot.student.assignedTeacherId),
          ]
        : teachers;

    return (
      <div
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #0B3D2E 0%, #0E5A41 100%)' }}
        className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col justify-between text-slate-100"
      >
        {updateAlertBanner}
        {updateProgressToast}
        <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col justify-center py-4 px-2 sm:px-4">
          {directLinkLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
              <p className="text-sm font-bold text-[#F3E5AB]">جاري فتح ملف متابعة الطالب...</p>
            </div>
          ) : (
            <ParentPortalView
              students={portalStudents}
              teachers={portalTeachers}
              attendance={portalAttendance}
              payments={portalPayments}
              exams={exams}
              homeworks={homeworks}
              directExamResults={directParentSnapshot?.exams || []}
              teacherRatings={teacherRatings}
              settings={settings}
              loggedParentPhone={loggedParentPhone}
              onLoginParent={(phone, remoteMatch) => {
                if (remoteMatch) setDirectParentSnapshot(remoteMatch);
                setLoggedParentPhone(phone);
              }}
              onLogoutParent={() => {
                setDirectParentSnapshot(null);
                setLoggedParentPhone('');
              }}
              onOpenCertificate={(st, cert) => setCertModalState({ student: st, cert })}
              onViewReceipt={(pay) => setActiveReceipt(pay)}
              onLookupRemoteByPhone={async (norm) => {
                const direct = await fetchPublicParentSnapshot(`phone_${norm}`);
                if (direct) return direct;
                if (norm.length > 9) {
                  return await fetchPublicParentSnapshot(`phone_${norm.slice(-9)}`);
                }
                return null;
              }}
              onBack={
                directParentChildId
                  ? undefined
                  : () => {
                      setDirectParentSnapshot(null);
                      setLoggedParentPhone('');
                      setEntryGateMode('welcome');
                    }
              }
              isDirectLink={Boolean(directParentChildId)}
              directChildId={directParentChildId}
            />
          )}
        </main>

        {/* Read-only Receipt & Certificate Viewing Modals */}
        <ReceiptModal
          payment={activeReceipt}
          academyName={directParentSnapshot?.academyName || settings.academyName}
          logoUrl={effectiveLogoUrl}
          onClose={() => setActiveReceipt(null)}
        />
        <CertificateModal
          student={certModalState?.student || null}
          initialCertificate={certModalState?.cert}
          academyName={directParentSnapshot?.academyName || settings.academyName}
          logoUrl={effectiveLogoUrl}
          onClose={() => setCertModalState(null)}
        />

        <FooterWhatsApp
          managerWhatsApp={settings.managerWhatsApp}
          academyName={settings.academyName}
          onOpenInstallModal={handleInstallTrigger}
          isInstalled={isInstalled}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          currentVersion={currentVersion}
          onUpdateApp={forceUpdateNow}
          isUpdating={isUpdatingApp}
          hasUpdateAvailable={hasUpdateAvailable}
        />
        {installModalElement}
      </div>
    );
  }

  if (!appSessionLoggedIn && entryGateMode === 'student') {
    return (
      <div
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #0B3D2E 0%, #0E5A41 100%)' }}
        className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col justify-between text-slate-100"
      >
        {updateAlertBanner}
        {updateProgressToast}
        <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col justify-center py-4 px-2 sm:px-4">
          <StudentPortalView
            students={students}
            teachers={teachers}
            halaqat={halaqat}
            schedules={schedules}
            attendance={attendance}
            exams={exams}
            homeworks={homeworks}
            settings={settings}
            loggedStudentId={loggedStudentId}
            onLoginStudent={(studentId) => setLoggedStudentId(studentId)}
            onLogoutStudent={() => setLoggedStudentId('')}
            onOpenCertificate={(st, cert) => setCertModalState({ student: st, cert })}
            onLookupRemoteByPhone={async (norm) => {
              const direct = await fetchPublicParentSnapshot(`phone_${norm}`);
              if (direct) return direct;
              if (norm.length > 9) {
                const shortMatch = await fetchPublicParentSnapshot(`phone_${norm.slice(-9)}`);
                if (shortMatch) return shortMatch;
              }
              if (isFirebaseConfigured() && !isTemporaryPreviewHost()) {
                const studentMatch = await findStudentInFirestoreByPhone(norm).catch(() => null);
                if (studentMatch) {
                  const tObj = teachers.find((t) => t.id === studentMatch.assignedTeacherId);
                  return {
                    student: studentMatch,
                    teacherName: tObj?.name || '',
                    attendance: [],
                    payments: [],
                    exams: buildStudentExamResults(studentMatch.id, exams),
                    currency: settings.currency || 'ر.س',
                    academyName: settings.academyName,
                    updatedAt: Date.now(),
                  };
                }
              }
              return null;
            }}
            showRegisterView={showStudentRegisterScreen}
            onOpenStudentRegister={() => setShowStudentRegisterScreen(true)}
            onCloseRegisterView={() => setShowStudentRegisterScreen(false)}
            onSubmitStudentRegistration={handleSelfRegisterStudent}
            onCheckStudentPhoneExists={handleCheckStudentPhoneExists}
            onBack={() => {
              setLoggedStudentId('');
              setShowStudentRegisterScreen(false);
              setEntryGateMode('welcome');
            }}
          />
        </main>

        <CertificateModal
          student={certModalState?.student || null}
          initialCertificate={certModalState?.cert}
          academyName={settings.academyName}
          logoUrl={effectiveLogoUrl}
          onClose={() => setCertModalState(null)}
        />

        <FooterWhatsApp
          managerWhatsApp={settings.managerWhatsApp}
          academyName={settings.academyName}
          onOpenInstallModal={handleInstallTrigger}
          isInstalled={isInstalled}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          currentVersion={currentVersion}
          onUpdateApp={forceUpdateNow}
          isUpdating={isUpdatingApp}
          hasUpdateAvailable={hasUpdateAvailable}
        />
        {installModalElement}
      </div>
    );
  }

  if (!appSessionLoggedIn) {
    if (entryGateMode === 'welcome') {
      return (
        <>
          {updateAlertBanner}
          {updateProgressToast}
          <WelcomeChoiceScreen
            logoUrl={effectiveLogoUrl}
            academyName={settings.academyName}
            managerWhatsApp={settings.managerWhatsApp}
            onSelectStudent={() => setEntryGateMode('student')}
            onSelectAdmin={() => setEntryGateMode('admin_login')}
            onSelectTeacher={() => {
              const lastPhone = getStoredLastTeacherPhone();
              setLoginInitialNotice(null);
              setEntryGateMode('teacher_login');
              if (lastPhone) {
                setLoginInitialPhone(lastPhone);
                setShowTeacherRegisterScreen(false);
              } else {
                setTeacherPrefillPhone('');
                setShowTeacherRegisterScreen(true);
              }
            }}
            onSelectParent={() => setEntryGateMode('parent')}
            onOpenInstallModal={handleInstallTrigger}
            isInstalled={isInstalled}
            isIOS={isIOS}
            isInAppBrowser={isInAppBrowser}
            currentVersion={currentVersion}
            onUpdateApp={forceUpdateNow}
            isUpdating={isUpdatingApp}
            hasUpdateAvailable={hasUpdateAvailable}
          />
          {installModalElement}
        </>
      );
    }

    if (entryGateMode === 'admin_login') {
      const isPinConfigured = Boolean(
        settings.managerPinConfigured || getStoredManagerPinConfig().configured
      );
      return (
        <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col furqan-shell-bg">
          {updateAlertBanner}
          {updateProgressToast}
          <AdminPinLoginScreen
            logoUrl={effectiveLogoUrl}
            isPinConfigured={isPinConfigured}
            onVerifyPin={handleAdminPinVerify}
            onSaveNewPinAndLogin={handleSaveNewAdminPinAndLogin}
            onBack={() => setEntryGateMode('welcome')}
          />
          <FooterWhatsApp
            managerWhatsApp={settings.managerWhatsApp}
            academyName={settings.academyName}
            onOpenInstallModal={handleInstallTrigger}
            isInstalled={isInstalled}
            isIOS={isIOS}
            isInAppBrowser={isInAppBrowser}
            currentVersion={currentVersion}
            onUpdateApp={forceUpdateNow}
            isUpdating={isUpdatingApp}
            hasUpdateAvailable={hasUpdateAvailable}
          />
          {installModalElement}
        </div>
      );
    }

    if (showTeacherRegisterScreen) {
      return (
        <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col furqan-shell-bg">
          {updateAlertBanner}
          {updateProgressToast}
          <TeacherRegistrationScreen
            logoUrl={effectiveLogoUrl}
            prefillPhone={teacherPrefillPhone}
            onSubmitRegistration={handleSelfRegisterTeacher}
            onCheckPhoneExists={handleCheckTeacherPhoneExists}
            onRedirectToLoginWithNotice={(phoneStr, notice) => {
              setLoginInitialPhone(phoneStr);
              setLoginInitialNotice(notice);
              setShowTeacherRegisterScreen(false);
            }}
            onBackToLogin={() => {
              setLoginInitialNotice(null);
              setShowTeacherRegisterScreen(false);
              if (!getStoredLastTeacherPhone()) {
                setEntryGateMode('welcome');
              }
            }}
          />
          <FooterWhatsApp
            managerWhatsApp={settings.managerWhatsApp}
            academyName={settings.academyName}
            onOpenInstallModal={handleInstallTrigger}
            isInstalled={isInstalled}
            isIOS={isIOS}
            isInAppBrowser={isInAppBrowser}
            currentVersion={currentVersion}
            onUpdateApp={forceUpdateNow}
            isUpdating={isUpdatingApp}
            hasUpdateAvailable={hasUpdateAvailable}
          />
          {installModalElement}
        </div>
      );
    }

    return (
      <div className="min-h-dvh w-full max-w-full overflow-x-hidden flex flex-col furqan-shell-bg">
        {updateAlertBanner}
        {updateProgressToast}
        <TeacherAccessScreen
          logoUrl={effectiveLogoUrl}
          initialPhone={loginInitialPhone}
          initialNotice={loginInitialNotice}
          onPhoneOnlyLogin={handleTeacherPhoneOnlyLogin}
          onOpenFirstTimeRegister={(prefill) => {
            setTeacherPrefillPhone(prefill || '');
            setLoginInitialNotice(null);
            setShowTeacherRegisterScreen(true);
          }}
          onBack={() => {
            setLoginInitialNotice(null);
            setEntryGateMode('welcome');
          }}
        />
        <FooterWhatsApp
          managerWhatsApp={settings.managerWhatsApp}
          academyName={settings.academyName}
          onOpenInstallModal={handleInstallTrigger}
          isInstalled={isInstalled}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          currentVersion={currentVersion}
          onUpdateApp={forceUpdateNow}
          isUpdating={isUpdatingApp}
          hasUpdateAvailable={hasUpdateAvailable}
        />
        {installModalElement}
      </div>
    );
  }

  const isTeacherSessionLocked = appRole === 'teacher' && !adminPreviewingTeacher;
  const pendingTeachersCount = teachers.filter((t) => (t.status || 'active') === 'pending').length;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col furqan-shell-bg text-slate-100 selection:bg-[#c9a227]/30 selection:text-white font-cairo">
      {/* Top Header */}
      <Header
        appRole={appRole}
        onRoleChange={(role) => {
          if (isTeacherSessionLocked) return;
          setAdminPreviewingTeacher(false);
          setIsSidebarOpen(false);
          setAppRole(role);
        }}
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'students') {
            setSelectedStudentId(null);
          }
          if (tab !== 'curricula') {
            setSelectedCurriculumGradeId(null);
          }
        }}
        settings={{ ...settings, logoDataUrl: effectiveLogoUrl }}
        onOpenInstallModal={handleInstallTrigger}
        showSidebarToggle={appRole === 'admin' && !isTeacherSessionLocked}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenTrialModal={() => setIsTrialModalOpen(true)}
        isOnline={isOnline}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
        isInstallable={isInstallable}
        firestoreStatus={firestoreStatus}
        firebaseConnected={isFirebaseActuallyConnected}
        onOpenFirebaseStatus={handleOpenFirebaseStatus}
        trashCount={trashItems.length}
        onOpenTrashBin={() => setIsTrashBinOpen(true)}
        newTrialLessonsCount={newTrialLessonsCount}
        onCheckUpdate={forceUpdateNow}
        hasUpdateAvailable={hasUpdateAvailable}
        updateStatus={updateStatus}
        userEmail={linkedGoogle?.email || authUser?.email || ''}
        userPhotoUrl={linkedGoogle?.photoURL || authUser?.photoURL || ''}
        hasPendingWrites={hasPendingWrites}
        onSignOut={handleSignOut}
        isTeacherSessionLocked={isTeacherSessionLocked}
        adminPreviewingTeacher={adminPreviewingTeacher}
        onExitAdminPreview={handleExitAdminPreview}
      />

      {/* Auto-Update Notification Bar when new version is published */}
      {hasUpdateAvailable && updateStatus !== 'updating' && (
        <div className="no-print w-full max-w-full bg-gradient-to-r from-amber-500/25 via-[#D4AF37]/30 to-emerald-500/25 border-b border-[#D4AF37]/60 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm">
            <button
              type="button"
              onClick={applyUpdateReload}
              className="flex items-center gap-2 font-extrabold text-[#F3E5AB] hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span>يوجد تحديث جديد، دوس هنا للتحديث</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace with Slide-Over Sidebar (Mobile) & Persistent Sidebar (Desktop) */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">
        {appRole === 'admin' && (
          <AdminSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              if (tab !== 'students') setSelectedStudentId(null);
              if (tab !== 'curricula') setSelectedCurriculumGradeId(null);
            }}
            selectedGradeId={selectedCurriculumGradeId}
            onSelectGradeId={(gradeId) => {
              setSelectedCurriculumGradeId(gradeId);
              setCurrentTab('curricula');
            }}
            settings={{ ...settings, logoDataUrl: effectiveLogoUrl }}
            pendingTeachersCount={pendingTeachersCount}
            newTrialLessonsCount={newTrialLessonsCount}
            trashCount={trashItems.length}
            onOpenTrashBin={() => setIsTrashBinOpen(true)}
            onOpenFirebaseStatus={handleOpenFirebaseStatus}
            firebaseConnected={isFirebaseActuallyConnected}
            onOpenTrialModal={() => setIsTrialModalOpen(true)}
            onCheckUpdate={forceUpdateNow}
            hasUpdateAvailable={hasUpdateAvailable}
            onSignOut={handleSignOut}
          />
        )}

        <main className="no-print flex-1 w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 overflow-x-hidden">
          {syncPermissionError && (
            <div
              role="alert"
              className="bg-red-950/80 border border-red-400/50 rounded-2xl p-4 text-xs text-red-100 flex items-center justify-between gap-3"
            >
              <span>{syncPermissionError}</span>
              <button
                type="button"
                onClick={() => setSyncPermissionError(null)}
                className="p-1 rounded-lg bg-white/10 text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {updateProgressToast}

          {starCelebration && (
            <div className="bg-gradient-to-r from-amber-500/25 via-[#D4AF37]/25 to-emerald-500/20 border-2 border-[#D4AF37] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-[#D4AF37] shrink-0" />
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#F3E5AB]">
                    🎉 مبروك! الطالب ({starCelebration.student.name}) أتم 10 نجوم ويستحق شهادة!
                  </h4>
                  <p className="text-xs text-slate-200">
                    تم تصفير النجوم تلقائياً لتبدأ دورة مكافآت جديدة، وإصدار شهادة وسام التميز في سجله.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCertModalState({
                      student: starCelebration.student,
                      cert: starCelebration.cert,
                    });
                    setStarCelebration(null);
                  }}
                  className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  عرض / تحميل الشهادة PDF
                </button>
                <button
                  type="button"
                  onClick={() => setStarCelebration(null)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Smart Alerts Strip when on non-dashboard admin pages */}
          {appRole === 'admin' &&
            currentTab !== 'dashboard' &&
            (todayAbsences.length > 0 ||
              paymentDueAlerts.length > 0 ||
              newTrialLessonsCount > 0) && (
              <div className="bg-[#073923]/90 border border-[#c9a227]/45 rounded-2xl p-4 shadow-lg space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#F3E5AB]">
                  <Bell className="w-4 h-4 text-[#c9a227]" />
                  <span>تنبيهات الأكاديمية الفورية</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {todayAbsences.slice(0, 3).map((abs) => {
                    const st = students.find((s) => s.id === abs.studentId);
                    const phone = cleanWhatsAppNumber(st?.parentPhone || st?.phone || '');
                    const msg = encodeURIComponent(
                      `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${abs.studentName})،\nنحيطكم علماً بأن الطالب غاب اليوم (${abs.date}) عن حلقة القرآن الكريم.\n${settings.academyName}`
                    );
                    return (
                      <div
                        key={abs.id}
                        className="bg-red-900/35 border border-red-400/45 rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-red-100 block truncate">
                            غياب اليوم: {abs.studentName}
                          </span>
                          <span className="text-[11px] text-slate-200">{abs.teacherName}</span>
                        </div>
                        <a
                          href={`https://wa.me/${phone}?text=${msg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] font-extrabold text-[11px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      </div>
                    );
                  })}

                  {paymentDueAlerts.slice(0, 3).map((st) => {
                    const days = getDaysUntilDate(st.nextPaymentDate) ?? 0;
                    const phone = cleanWhatsAppNumber(st.parentPhone || st.phone || '');
                    const amount =
                      st.subscriptionAmount || settings.defaultSubscriptionAmount || 250;
                    const msg = encodeURIComponent(
                      `السلام عليكم ورحمة الله وبركاته ولي أمر الطالب (${st.name})،\nنذكركم بلطف باقتراب موعد تجديد الاشتراك (${st.nextPaymentDate}) بمبلغ (${amount} ${currency}).\n${settings.academyName}`
                    );
                    return (
                      <div
                        key={`pay-alert-${st.id}`}
                        className="bg-amber-900/35 border border-amber-400/45 rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-amber-100 flex items-center gap-1 truncate">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">تجديد: {st.name}</span>
                          </span>
                          <span className="text-[11px] text-slate-200">
                            {days < 0 ? `تأخر ${Math.abs(days)} يوم` : days === 0 ? 'اليوم' : `باقي ${days} أيام`}
                          </span>
                        </div>
                        <a
                          href={`https://wa.me/${phone}?text=${msg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-[#07241B] font-extrabold text-[11px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>تذكير</span>
                        </a>
                      </div>
                    );
                  })}

                  {newTrialLessonsCount > 0 && (
                    <div className="bg-emerald-900/40 border border-emerald-400/50 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-emerald-100 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#c9a227]" />
                          <span>{newTrialLessonsCount} طلبات حصة تجريبية</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentTab('trialLessons')}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#c9a227] text-[#07241B] font-extrabold text-[11px] cursor-pointer"
                      >
                        عرض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ROLE 1: ADMIN PLATFORM */}
          {appRole === 'admin' && (
            <>
              {currentTab === 'dashboard' && (
                <AdminDashboardSection
                  students={students}
                  teachers={teachers}
                  halaqat={halaqat}
                  schedules={schedules}
                  attendance={attendance}
                  trialLessons={trialLessons}
                  settings={settings}
                  pendingTeachersCount={pendingTeachersCount}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onAddNewStudent={handleOpenAddStudent}
                />
              )}

              {currentTab === 'teacherApps' && (
                <TeacherApplicationsSection
                  teachers={teachers}
                  onApproveTeacher={handleApproveTeacher}
                  onRejectTeacher={handleRejectTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                />
              )}

              {currentTab === 'teachers' && (
                <TeachersSection
                  teachers={teachers}
                  students={students}
                  attendance={attendance}
                  teacherRatings={teacherRatings}
                  halaqat={halaqat}
                  schedules={schedules}
                  settings={settings}
                  onAddTeacher={handleAddTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  onApproveTeacher={handleApproveTeacher}
                  onRejectTeacher={handleRejectTeacher}
                  onLoginAsTeacher={handleLoginAsTeacherPreview}
                />
              )}

              {currentTab === 'students' && (
                <>
                  {currentStudent ? (
                    <StudentProfile
                      student={currentStudent}
                      onBack={handleBackToStudents}
                      onEditStudent={() => handleOpenEditStudent(currentStudent)}
                      onAddNewStudent={handleOpenAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      teachers={teachers}
                      schedules={schedules}
                      academyName={settings.academyName}
                      settings={{ ...settings, logoDataUrl: effectiveLogoUrl }}
                      attendance={attendance}
                      payments={payments}
                      onMarkAttendance={handleMarkAttendance}
                      onAddStar={handleAddStar}
                      onRecordPayment={handleRecordPayment}
                      onViewReceipt={(pay) => setActiveReceipt(pay)}
                      onOpenCertificateModal={(st, cert) => setCertModalState({ student: st, cert })}
                    />
                  ) : (
                    <StudentsListSection
                      students={students}
                      onSelectStudent={handleSelectStudent}
                      onAddNewStudent={handleOpenAddStudent}
                      onOpenTrialModal={() => setIsTrialModalOpen(true)}
                    />
                  )}
                </>
              )}

              {currentTab === 'curricula' && (
                <AdminCurriculaSection
                  students={students}
                  teachers={teachers}
                  selectedGradeId={selectedCurriculumGradeId}
                  onChangeGradeId={setSelectedCurriculumGradeId}
                  onSelectStudent={(st) => {
                    setSelectedStudentId(st.id);
                    setCurrentTab('students');
                  }}
                />
              )}

              {currentTab === 'halaqat' && (
                <HalaqatSection
                  halaqat={halaqat}
                  teachers={teachers}
                  students={students}
                  schedules={schedules}
                  attendance={attendance}
                  academyName={settings.academyName}
                  onAddHalaqa={handleAddHalaqa}
                  onUpdateHalaqa={handleUpdateHalaqa}
                  onDeleteHalaqa={handleDeleteHalaqa}
                  onAddSchedule={handleAddSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onMarkAttendance={handleMarkAttendance}
                  onAddStar={handleAddStar}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceSection
                  students={students}
                  teachers={teachers}
                  halaqat={halaqat}
                  attendance={attendance}
                  academyName={settings.academyName}
                  onMarkAttendance={handleMarkAttendance}
                />
              )}

              {currentTab === 'studentReports' && (
                <GradesReportsSection
                  students={students}
                  teachers={teachers}
                  halaqat={halaqat}
                  settings={{ ...settings, logoDataUrl: effectiveLogoUrl }}
                  onUpdateStudent={handleUpdateStudent}
                  onAddStar={handleAddStar}
                />
              )}

              {currentTab === 'trialLessons' && (
                <TrialLessonsSection
                  trialLessons={trialLessons}
                  onUpdateStatus={handleUpdateTrialLessonStatus}
                  onDeleteLesson={handleDeleteTrialLesson}
                  onConvertToStudent={handleConvertTrialToStudent}
                  onOpenNewTrialModal={() => setIsTrialModalOpen(true)}
                  academyName={settings.academyName}
                  managerWhatsApp={settings.managerWhatsApp}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsSection
                  students={students}
                  payments={payments}
                  settings={settings}
                  onViewReceipt={(pay) => setActiveReceipt(pay)}
                  onRecordPayment={(st, amt) => handleRecordPayment(st, amt)}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsSection
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  loginBannerUrl={loginBannerUrl}
                  onSaveLoginBanner={handleSaveLoginBanner}
                  onResetData={handleResetData}
                  onExportData={handleExportData}
                  exportDownloadState={exportDownloadState}
                  onImportData={handleImportData}
                  onOpenInstallModal={handleInstallTrigger}
                  firestoreStatus={firestoreStatus}
                  firebaseConnected={isFirebaseActuallyConnected}
                  onSyncFirestore={handleManualSync}
                  onOpenFirebaseStatus={handleOpenFirebaseStatus}
                  onOpenTrashBin={() => setIsTrashBinOpen(true)}
                  trashCount={trashItems.length}
                  onCheckUpdate={forceUpdateNow}
                  hasUpdateAvailable={hasUpdateAvailable}
                  updateStatus={updateStatus}
                  updateMessage={updateMessage}
                  currentVersion={currentVersion}
                  userEmail={linkedGoogle?.email || authUser?.email || ''}
                  linkedGoogle={linkedGoogle}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          )}

          {/* ROLE 2: STUDENT PORTAL */}
          {appRole === 'student' && (
            <StudentPortalView
              students={students}
              teachers={teachers}
              halaqat={halaqat}
              schedules={schedules}
              attendance={attendance}
              exams={exams}
              homeworks={homeworks}
              settings={settings}
              loggedStudentId={loggedStudentId}
              onLoginStudent={(studentId) => setLoggedStudentId(studentId)}
              onLogoutStudent={() => setLoggedStudentId('')}
              onOpenCertificate={(st, cert) => setCertModalState({ student: st, cert })}
              showRegisterView={showStudentRegisterScreen}
              onOpenStudentRegister={() => setShowStudentRegisterScreen(true)}
              onCloseRegisterView={() => setShowStudentRegisterScreen(false)}
              onSubmitStudentRegistration={handleSelfRegisterStudent}
              onCheckStudentPhoneExists={handleCheckStudentPhoneExists}
            />
          )}

          {/* ROLE 3: TEACHER PORTAL (Today's Sessions + Exams & Grades + Homeworks + Curriculum Library) */}
          {appRole === 'teacher' && (
            <TeacherPortalView
              teachers={teachers}
              students={students}
              schedules={schedules}
              halaqat={halaqat}
              attendance={attendance}
              teacherRatings={teacherRatings}
              exams={exams}
              homeworks={homeworks}
              settings={settings}
              selectedTeacherId={selectedPortalTeacherId}
              onSelectTeacher={setSelectedPortalTeacherId}
              onMarkAttendance={handleMarkAttendance}
              onAddStar={handleAddStar}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onSaveHomework={handleSaveHomework}
              onDeleteHomework={handleDeleteHomework}
              lockedToTeacher={isTeacherSessionLocked}
              adminPreviewingTeacher={adminPreviewingTeacher}
              onExitAdminPreview={handleExitAdminPreview}
            />
          )}

          {/* ROLE 4: PARENT PORTAL (Phone Number Only) */}
          {appRole === 'parent' && (
            <ParentPortalView
              students={students}
              teachers={teachers}
              attendance={attendance}
              payments={payments}
              exams={exams}
              homeworks={homeworks}
              teacherRatings={teacherRatings}
              settings={settings}
              loggedParentPhone={loggedParentPhone}
              onLoginParent={(phone) => setLoggedParentPhone(phone)}
              onLogoutParent={() => setLoggedParentPhone('')}
              onSubmitTeacherRating={handleSubmitTeacherRating}
              onOpenCertificate={(st, cert) => setCertModalState({ student: st, cert })}
              onViewReceipt={(pay) => setActiveReceipt(pay)}
            />
          )}
        </main>
      </div>

      {/* Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudentData}
        studentToEdit={studentToEdit}
        teachers={teachers}
        halaqat={halaqat}
        defaultSubscriptionAmount={settings.defaultSubscriptionAmount}
      />

      {/* Trial Lesson Modal */}
      <TrialLessonModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onSubmit={handleSaveTrialLesson}
        managerWhatsApp={settings.managerWhatsApp}
      />

      {/* Receipt Modal (Print & PDF/PNG Blob Download) */}
      <ReceiptModal
        payment={activeReceipt}
        academyName={settings.academyName}
        logoUrl={effectiveLogoUrl}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Certificate Modal (Print & PDF/PNG Blob Download) */}
      <CertificateModal
        student={certModalState?.student || null}
        initialCertificate={certModalState?.cert}
        academyName={settings.academyName}
        logoUrl={effectiveLogoUrl}
        onClose={() => setCertModalState(null)}
        onSaveCertificate={handleSaveCertificate}
      />

      {/* Firebase Connection Status & Counts Modal */}
      <FirebaseStatusModal
        isOpen={isFirebaseStatusOpen}
        stats={firebaseStats}
        localStudentsCount={students.length}
        localTeachersCount={teachers.length}
        trashCount={trashItems.length}
        isSyncing={isManualSyncing}
        syncFeedback={manualSyncFeedback}
        onClose={() => setIsFirebaseStatusOpen(false)}
        onSyncAndMigrateNow={handleManualSync}
        onOpenTrashBin={() => setIsTrashBinOpen(true)}
        showGoogleSignInButton={!isTemporaryHost && !authUser}
        onGoogleSignIn={handleFirstLaunchGoogleLink}
      />

      {/* 30-Day Soft-Delete Trash Bin Modal */}
      <TrashBinModal
        isOpen={isTrashBinOpen}
        items={trashItems}
        onClose={() => setIsTrashBinOpen(false)}
        onRestore={handleRestoreTrashItem}
        onRequestPermanentDelete={handleRequestPermanentDeleteTrashItem}
      />

      {/* Explicit Confirmation Modal for Trash / Permanent Delete / Reset */}
      <ConfirmActionModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmLabel={confirmModalState.confirmLabel}
        tone={confirmModalState.tone}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Bottom Footer with Version, Update Button & WhatsApp */}
      <FooterWhatsApp
        managerWhatsApp={settings.managerWhatsApp}
        academyName={settings.academyName}
        onOpenInstallModal={handleInstallTrigger}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
        currentVersion={currentVersion}
        onUpdateApp={forceUpdateNow}
        isUpdating={isUpdatingApp}
        hasUpdateAvailable={hasUpdateAvailable}
      />
      {installModalElement}
    </div>
  );
}
