import { AcademySettings } from '../types';
import { normalizePhoneAuth } from './authStorage';

const LEGACY_STORAGE_KEYS = [
  'furqan_students_v1',
  'furqan_teachers_v1',
  'furqan_schedules_v1',
  'furqan_settings_v1',
  'furqan_trial_lessons_v1',
  'furqan_attendance_v1',
  'furqan_payments_v1',
  'furqan_teacher_ratings_v1',
];

/**
 * Permanently wipe all old demo/device localStorage keys so old demo data
 * never appears again. App data is stored strictly on the authenticated Gmail account in Firestore.
 */
export function purgeLegacyLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr || Date.now());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getTodayArabicDay():
  | 'السبت'
  | 'الأحد'
  | 'الإثنين'
  | 'الثلاثاء'
  | 'الأربعاء'
  | 'الخميس'
  | 'الجمعة' {
  const dayIdx = new Date().getDay();
  const map: Record<
    number,
    'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة'
  > = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
  };
  return map[dayIdx] || 'السبت';
}

export function getDaysUntilDate(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const DEFAULT_SETTINGS: AcademySettings = {
  academyName: 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
  logoDataUrl: '',
  loginBannerUrl: '',
  managerWhatsApp: '201030300862',
  managerPin: '1234',
  managerPinConfigured: false,
  slogan: 'تعليم القرآن الكريم وتجويده عن بعد بأعلى معايير الإتقان',
  email: '',
  address: '',
  currency: 'ر.س',
  defaultSessionRate: 40,
  defaultSubscriptionAmount: 250,
};

// Helper to sanitize phone numbers for WhatsApp link (https://wa.me/[cleanNumber])
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

// Unified phone number normalization across Registration, Login, Teachers, and Parents
export function normalizePhoneForMatch(phone: string): string {
  return normalizePhoneAuth(phone);
}

const LOGIN_BANNER_CACHE_KEY = 'furqan_login_banner_v1';

export function getCachedLoginBanner(): string {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  try {
    return window.localStorage.getItem(LOGIN_BANNER_CACHE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCachedLoginBanner(url: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (url) {
      window.localStorage.setItem(LOGIN_BANNER_CACHE_KEY, url);
    } else {
      window.localStorage.removeItem(LOGIN_BANNER_CACHE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const ACADEMY_LOGO_CACHE_KEY = 'furqan_academy_logo_v1';

export function getCachedAcademyLogo(): string {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  try {
    return window.localStorage.getItem(ACADEMY_LOGO_CACHE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCachedAcademyLogo(url: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (url) {
      window.localStorage.setItem(ACADEMY_LOGO_CACHE_KEY, url);
    } else {
      window.localStorage.removeItem(ACADEMY_LOGO_CACHE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Normalizes Egyptian/Saudi/international phone numbers for direct https://wa.me/<number> chats.
 */
export function formatWhatsAppDirectNumber(phone: string): string {
  const digits = cleanWhatsAppNumber(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('01')) {
    return `20${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('05')) {
    return `966${digits.slice(1)}`;
  }
  return digits;
}

const PARENT_DIRECTORY_KEY = 'furqan_parent_directory_v1';

export interface StoredParentDirectory {
  students: any[];
  teachers: any[];
  attendance: any[];
  payments: any[];
  exams?: any[];
}

export function saveParentDirectorySnapshot(snapshot: StoredParentDirectory): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (snapshot.students.length === 0) {
      window.localStorage.removeItem(PARENT_DIRECTORY_KEY);
      return;
    }
    window.localStorage.setItem(PARENT_DIRECTORY_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage errors
  }
}

export function getParentDirectorySnapshot(): StoredParentDirectory | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(PARENT_DIRECTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredParentDirectory;
    if (!parsed || !Array.isArray(parsed.students)) return null;
    return parsed;
  } catch {
    return null;
  }
}
