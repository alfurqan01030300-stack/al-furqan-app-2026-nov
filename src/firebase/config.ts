import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  app as jsApp,
  db as jsDb,
  storage as jsStorage,
  auth as jsAuth,
  googleProvider as jsGoogleProvider,
  firebaseConfig,
  isFirebaseConfigured,
  hasCustomUserApiKey,
  testFirebaseConnection,
} from '../firebase.js';

export const OFFICIAL_LIVE_URL = 'https://al-furqan-app-2026-nov.vercel.app';

export const app = jsApp as FirebaseApp | null;
export const db = jsDb as Firestore | null;
export const storage = jsStorage as FirebaseStorage | null;
export const auth = jsAuth as Auth | null;
export const googleProvider = jsGoogleProvider as GoogleAuthProvider;

export {
  firebaseConfig,
  isFirebaseConfigured,
  hasCustomUserApiKey,
};

/**
 * Returns true ONLY when opened from AI Studio temporary preview domains
 * (ais-dev-* / ais-pre-* / *.run.app / aistudio.google.com).
 * Live domains like https://al-furqan-app.vercel.app return false and run signInWithPopup directly.
 */
export function isTemporaryPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = (window.location.hostname || '').toLowerCase();
  return (
    host.startsWith('ais-dev-') ||
    host.startsWith('ais-pre-') ||
    host.endsWith('.run.app') ||
    host.includes('aistudio.google.com')
  );
}

export interface GoogleAuthResult {
  user: User | null;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Strict Popup-only Google Sign-In. Keeps login on the current live domain (https://al-furqan-app.vercel.app).
 * Never attempts Firebase Auth from AI Studio temporary preview domains.
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (isTemporaryPreviewHost()) {
    return { user: null };
  }

  if (!isFirebaseConfigured() || !auth) {
    return {
      user: null,
      errorCode: 'auth/not-configured',
      errorMessage: 'يرجى إدخال إعدادات Firebase والـ API Key في ملف src/firebase.js أولاً.',
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    const code = error?.code || 'unknown';
    if (code === 'auth/popup-blocked') {
      return {
        user: null,
        errorCode: code,
        errorMessage:
          'المتصفح منع نافذة الدخول المنبثقة (Popup). يرجى السماح بالنوافذ المنبثقة ثم الضغط على «الدخول بجوجل» مرة أخرى.',
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        user: null,
        errorCode: code,
        errorMessage: 'تم إغلاق نافذة تسجيل الدخول قبل إتمام الدخول.',
      };
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      return {
        user: null,
        errorCode: code,
        errorMessage: `يرجى إضافة الدومين (${host}) في Firebase Console > Authentication > Settings > Authorized domains.`,
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        user: null,
        errorCode: code,
        errorMessage:
          'يرجى التأكد من تفعيل مزود Google داخل Firebase Console > Authentication > Sign-in method.',
      };
    }
    return {
      user: null,
      errorCode: code,
      errorMessage: 'تعذر تسجيل الدخول بجوجل. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.',
    };
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// Error Handling Enums & Types adhering to Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

// Validate real connection to Firestore server
export async function testConnection(): Promise<boolean> {
  return testFirebaseConnection();
}
