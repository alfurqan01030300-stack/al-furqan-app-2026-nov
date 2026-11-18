import { AppLocalAccount, LinkedGoogleAccount } from '../types';

export const HAS_COMPLETED_GOOGLE_LINK_KEY = 'hasCompletedGoogleLink';
const LINKED_GOOGLE_ACCOUNT_KEY = 'furqan_linked_google_account_v1';
const APP_ACCOUNT_KEY = 'furqan_app_account_v1';
const APP_SESSION_KEY = 'furqan_app_session_v1';

export function hasCompletedGoogleLink(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(HAS_COMPLETED_GOOGLE_LINK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCompletedGoogleLink(completed: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (completed) {
      window.localStorage.setItem(HAS_COMPLETED_GOOGLE_LINK_KEY, 'true');
    } else {
      window.localStorage.removeItem(HAS_COMPLETED_GOOGLE_LINK_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getStoredLinkedGoogle(): LinkedGoogleAccount | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LINKED_GOOGLE_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as LinkedGoogleAccount) : null;
  } catch {
    return null;
  }
}

export function setStoredLinkedGoogle(account: LinkedGoogleAccount | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (account) {
      window.localStorage.setItem(LINKED_GOOGLE_ACCOUNT_KEY, JSON.stringify(account));
    } else {
      window.localStorage.removeItem(LINKED_GOOGLE_ACCOUNT_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getStoredAppAccount(): AppLocalAccount | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(APP_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as AppLocalAccount) : null;
  } catch {
    return null;
  }
}

export function setStoredAppAccount(account: AppLocalAccount | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (account) {
      window.localStorage.setItem(APP_ACCOUNT_KEY, JSON.stringify(account));
    } else {
      window.localStorage.removeItem(APP_ACCOUNT_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function isAppSessionActive(): boolean {
  return false;
}

export function clearAppSession(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(APP_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export function setAppSessionActive(_active: boolean): void {
  // Sessions are intentionally memory-only and never persisted across reloads/closes.
  clearAppSession();
}

const MANAGER_PIN_STORAGE_KEY = 'furqan_manager_pin_config_v1';
const LAST_TEACHER_PHONE_KEY = 'furqan_last_teacher_phone_v1';

export function getStoredManagerPinConfig(): { pin: string; configured: boolean } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { pin: '1234', configured: false };
  }
  try {
    const raw = window.localStorage.getItem(MANAGER_PIN_STORAGE_KEY);
    if (!raw) return { pin: '1234', configured: false };
    const parsed = JSON.parse(raw) as { pin?: string; configured?: boolean };
    return {
      pin: typeof parsed.pin === 'string' && parsed.pin.trim() ? parsed.pin.trim() : '1234',
      configured: Boolean(parsed.configured),
    };
  } catch {
    return { pin: '1234', configured: false };
  }
}

export function setStoredManagerPinConfig(pin: string, configured: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      MANAGER_PIN_STORAGE_KEY,
      JSON.stringify({ pin: pin.trim() || '1234', configured })
    );
  } catch {
    // ignore storage errors
  }
}

export function getStoredLastTeacherPhone(): string {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  try {
    return window.localStorage.getItem(LAST_TEACHER_PHONE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredLastTeacherPhone(phone: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (phone.trim()) {
      window.localStorage.setItem(LAST_TEACHER_PHONE_KEY, phone.trim());
    } else {
      window.localStorage.removeItem(LAST_TEACHER_PHONE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Unified phone normalization across Registration, Login, Teachers, Admin, and Parents:
 * 1. Converts Arabic/Persian digits to Latin digits.
 * 2. Strips spaces and punctuation.
 * 3. Strips +20, 0020, 02 (and leading 20 for 12-digit format) from the start.
 * 4. Ensures Egyptian numbers always start with "01" and are normalized to 11 digits (preserving 10-digit 01... if entered).
 * Example: "020138457530" and "0138457530" both normalize identically to "0138457530".
 * Example: "+20 1030300862", "00201030300862", "0201030300862", "01030300862" -> "01030300862".
 */
export function normalizePhoneAuth(phone: string): string {
  if (!phone) return '';
  const latinized = String(phone)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  let cleaned = latinized.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+20')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0020')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('020')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('20') && cleaned.length >= 11) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('00') && cleaned.length >= 11) {
    cleaned = cleaned.slice(2);
  }

  let digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';

  // Handle stacked prefix cases like 0201... if 00/20 was stripped partially
  if (digits.startsWith('0201')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('201') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Ensure leading 0 when starting with 1 (e.g. 1030300862 -> 01030300862)
  if (digits.startsWith('1') && digits.length >= 9 && digits.length <= 10) {
    digits = `0${digits}`;
  }

  // Keep 11 digits max for standard Egyptian 01xxxxxxxxx numbers
  if (digits.startsWith('01') && digits.length > 11) {
    digits = digits.slice(0, 11);
  }

  return digits;
}

export async function hashPassword(password: string): Promise<string> {
  const input = `alfurqan:${password}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash for non-secure contexts
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
