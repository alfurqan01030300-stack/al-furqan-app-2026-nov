import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * إعدادات الاتصال بمشروع Firebase Firestore (al-furqan-e11b7)
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBKkUF7ClpbZSGbC-yclHcoKGAWLrohjRY',
  authDomain: 'al-furqan-e11b7.firebaseapp.com',
  projectId: 'al-furqan-e11b7',
  storageBucket: 'al-furqan-e11b7.firebasestorage.app',
  messagingSenderId: '729650914369',
  appId: '1:729650914369:web:5a0019a9c6c0fa16a752c0',
  measurementId: 'G-NQ9WTB4CH8',
};

export function hasCustomUserApiKey() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 10);
}

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig &&
      typeof firebaseConfig.apiKey === 'string' &&
      firebaseConfig.apiKey.trim().length > 10 &&
      typeof firebaseConfig.projectId === 'string' &&
      firebaseConfig.projectId.trim().length > 0
  );
}

// تهيئة تطبيق Firebase
export const app = isFirebaseConfigured()
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

// تهيئة Firestore مع تفعيل الكاش المحلي (IndexedDB) للاستمرارية عند انقطاع الإنترنت
let firestoreDb = null;
if (app) {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    firestoreDb = getFirestore(app);
  }
}
export const db = firestoreDb;

// تهيئة Firebase Storage لرفع صور شهادات المعلمين
export const storage = app ? getStorage(app) : null;

// تهيئة المصادقة Auth
export const auth = app ? getAuth(app) : null;
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence notice:', err);
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// فحص الاتصال الفعلي بخادم Firestore
export async function testFirebaseConnection() {
  if (!isFirebaseConfigured() || !db) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const code = error && typeof error === 'object' ? String(error.code || '').toLowerCase() : '';
    if (
      msg.includes('client is offline') ||
      msg.includes('network') ||
      code === 'unavailable' ||
      code === 'failed-precondition'
    ) {
      return false;
    }
    return true;
  }
}
