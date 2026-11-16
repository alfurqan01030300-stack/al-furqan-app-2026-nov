import {
  AcademySettings,
  AttendanceRecord,
  CertificateRecord,
  Exam,
  HalaqaGroup,
  HomeworkAssignment,
  ParentRecord,
  PaymentRecord,
  ScheduleAppointment,
  Student,
  Teacher,
  TeacherRating,
  TrashItem,
  TrialLesson,
} from '../types';
import { DEFAULT_SETTINGS, normalizePhoneForMatch } from './storage';

const DURABLE_STORE_KEY = 'furqan_durable_cloud_mirror_v1';
export const TRASH_RETENTION_DAYS = 30;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface PendingSyncMap {
  students: string[];
  teachers: string[];
  schedules: string[];
  halaqat: string[];
  exams: string[];
  homeworks: string[];
  attendance: string[];
  payments: string[];
  teacherRatings: string[];
  trialLessons: string[];
  trash: string[];
  settingsPending: boolean;
}

export interface DurableAcademyBundle {
  students: Student[];
  teachers: Teacher[];
  schedules: ScheduleAppointment[];
  halaqat: HalaqaGroup[];
  exams: Exam[];
  homeworks: HomeworkAssignment[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  teacherRatings: TeacherRating[];
  trialLessons: TrialLesson[];
  trash: TrashItem[];
  settings: AcademySettings;
  pendingSync: PendingSyncMap;
  updatedAt: number;
}

export const EMPTY_PENDING_SYNC: PendingSyncMap = {
  students: [],
  teachers: [],
  schedules: [],
  halaqat: [],
  exams: [],
  homeworks: [],
  attendance: [],
  payments: [],
  teacherRatings: [],
  trialLessons: [],
  trash: [],
  settingsPending: false,
};

export function createEmptyDurableBundle(): DurableAcademyBundle {
  return {
    students: [],
    teachers: [],
    schedules: [],
    halaqat: [],
    exams: [],
    homeworks: [],
    attendance: [],
    payments: [],
    teacherRatings: [],
    trialLessons: [],
    trash: [],
    settings: { ...DEFAULT_SETTINGS },
    pendingSync: { ...EMPTY_PENDING_SYNC },
    updatedAt: 0,
  };
}

export function sanitizeTrashId(rawId: string): string {
  const cleaned = String(rawId || 'item').replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.slice(0, 120) || `item_${Date.now()}`;
}

export function buildTrashItem(
  entityType: TrashItem['entityType'],
  entityId: string,
  title: string,
  subtitle: string | undefined,
  data: TrashItem['data'],
  now = Date.now()
): TrashItem {
  return {
    id: sanitizeTrashId(`trash-${entityType}-${entityId}`),
    entityId,
    entityType,
    title,
    subtitle,
    data,
    deletedAt: now,
    purgeAt: now + TRASH_RETENTION_MS,
  };
}

export function filterActiveTrashItems(items: TrashItem[], now = Date.now()): TrashItem[] {
  return items.filter((item) => typeof item.purgeAt === 'number' && item.purgeAt > now);
}

export function getDaysRemainingInTrash(purgeAt: number, now = Date.now()): number {
  const diff = Math.max(0, purgeAt - now);
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function countPendingSyncItems(pending: PendingSyncMap): number {
  return (
    pending.students.length +
    pending.teachers.length +
    pending.schedules.length +
    (pending.halaqat?.length || 0) +
    (pending.exams?.length || 0) +
    (pending.homeworks?.length || 0) +
    pending.attendance.length +
    pending.payments.length +
    pending.teacherRatings.length +
    pending.trialLessons.length +
    pending.trash.length +
    (pending.settingsPending ? 1 : 0)
  );
}

export function addPendingId(
  current: PendingSyncMap,
  key: Exclude<keyof PendingSyncMap, 'settingsPending'>,
  id: string
): PendingSyncMap {
  if (!id) return current;
  const list = current[key] || [];
  if (list.includes(id)) return current;
  return {
    ...current,
    [key]: [...list, id],
  };
}

export function removePendingId(
  current: PendingSyncMap,
  key: Exclude<keyof PendingSyncMap, 'settingsPending'>,
  id: string
): PendingSyncMap {
  if (!id) return current;
  const list = current[key] || [];
  if (!list.includes(id)) return current;
  return {
    ...current,
    [key]: list.filter((x) => x !== id),
  };
}

export function loadDurableAcademyData(): DurableAcademyBundle {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createEmptyDurableBundle();
  }
  try {
    const raw = window.localStorage.getItem(DURABLE_STORE_KEY);
    if (!raw) return createEmptyDurableBundle();
    const parsed = JSON.parse(raw) as Partial<DurableAcademyBundle>;
    const rawTrash = Array.isArray(parsed.trash) ? parsed.trash : [];
    const activeTrash = filterActiveTrashItems(rawTrash);

    const pending: PendingSyncMap = {
      students: Array.isArray(parsed.pendingSync?.students) ? parsed.pendingSync.students : [],
      teachers: Array.isArray(parsed.pendingSync?.teachers) ? parsed.pendingSync.teachers : [],
      schedules: Array.isArray(parsed.pendingSync?.schedules) ? parsed.pendingSync.schedules : [],
      halaqat: Array.isArray(parsed.pendingSync?.halaqat) ? parsed.pendingSync.halaqat : [],
      exams: Array.isArray(parsed.pendingSync?.exams) ? parsed.pendingSync.exams : [],
      homeworks: Array.isArray(parsed.pendingSync?.homeworks) ? parsed.pendingSync.homeworks : [],
      attendance: Array.isArray(parsed.pendingSync?.attendance) ? parsed.pendingSync.attendance : [],
      payments: Array.isArray(parsed.pendingSync?.payments) ? parsed.pendingSync.payments : [],
      teacherRatings: Array.isArray(parsed.pendingSync?.teacherRatings)
        ? parsed.pendingSync.teacherRatings
        : [],
      trialLessons: Array.isArray(parsed.pendingSync?.trialLessons)
        ? parsed.pendingSync.trialLessons
        : [],
      trash: Array.isArray(parsed.pendingSync?.trash) ? parsed.pendingSync.trash : [],
      settingsPending: Boolean(parsed.pendingSync?.settingsPending),
    };

    const bundle: DurableAcademyBundle = {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      halaqat: Array.isArray(parsed.halaqat) ? parsed.halaqat : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
      homeworks: Array.isArray(parsed.homeworks) ? parsed.homeworks : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      teacherRatings: Array.isArray(parsed.teacherRatings) ? parsed.teacherRatings : [],
      trialLessons: Array.isArray(parsed.trialLessons) ? parsed.trialLessons : [],
      trash: activeTrash,
      settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : { ...DEFAULT_SETTINGS },
      pendingSync: pending,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };

    // Persist auto-pruned trash cleanly if any expired > 30 days
    if (activeTrash.length !== rawTrash.length) {
      saveDurableAcademyData(bundle);
    }

    return bundle;
  } catch {
    return createEmptyDurableBundle();
  }
}

export function saveDurableAcademyData(bundle: DurableAcademyBundle): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      DURABLE_STORE_KEY,
      JSON.stringify({
        ...bundle,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Durable local backup notice:', err);
  }
}


export function deriveParentsFromStudents(students: Student[]): ParentRecord[] {
  const map = new Map<string, ParentRecord>();
  const now = Date.now();
  for (const st of students) {
    const rawPhone = st.parentPhone || st.phone || '';
    const norm = normalizePhoneForMatch(rawPhone);
    const parentId = norm ? `par_${norm}` : sanitizeTrashId(`par_${st.id}`);
    const existing = map.get(parentId);
    if (existing) {
      if (!existing.studentIds.includes(st.id)) {
        existing.studentIds.push(st.id);
        existing.studentNames.push(st.name);
      }
      if (!existing.name && st.parentName) {
        existing.name = st.parentName;
      }
    } else {
      map.set(parentId, {
        id: parentId,
        name: st.parentName || `ولي أمر ${st.name}`,
        phone: rawPhone,
        normalizedPhone: norm,
        studentIds: [st.id],
        studentNames: [st.name],
        updatedAt: now,
      });
    }
  }
  return Array.from(map.values());
}

export function deriveCertificatesFromStudents(students: Student[]): CertificateRecord[] {
  const map = new Map<string, CertificateRecord>();
  for (const st of students) {
    for (const cert of st.certificates || []) {
      map.set(cert.id, {
        ...cert,
        studentId: cert.studentId || st.id,
        studentName: cert.studentName || st.name,
      });
    }
  }
  return Array.from(map.values());
}

export function clearDurableAcademyDataOnlyOnManualReset(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(DURABLE_STORE_KEY);
  } catch {
    // ignore storage errors
  }
}
