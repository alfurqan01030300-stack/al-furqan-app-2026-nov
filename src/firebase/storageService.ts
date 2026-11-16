import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isFirebaseConfigured, isTemporaryPreviewHost, storage } from './config';
import { normalizePhoneAuth } from '../utils/authStorage';

function sanitizeFileSegment(input: string): string {
  const cleaned = (input || 'certificate')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '')
    .slice(0, 60);
  return cleaned || `cert_${Date.now()}`;
}

export function compressImageToDataUrl(
  file: File,
  maxWidth = 1100,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1] || '');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Uploads a teacher certificate image to Firebase Storage under:
 * `certificates/<teacherPhone>/<certificateName>`
 * Falls back gracefully to a compressed JPEG DataURL if offline or Storage rules reject access.
 */
export async function uploadTeacherCertificateImage(
  teacherPhone: string,
  certificateName: string,
  file: File
): Promise<{ imageUrl: string; storedInFirebaseStorage: boolean }> {
  const compressedDataUrl = await compressImageToDataUrl(file, 1100, 0.8);
  const normalizedPhone = normalizePhoneAuth(teacherPhone) || 'unknown_phone';
  const safeCertName = sanitizeFileSegment(certificateName);
  const ext = file.type === 'image/png' ? 'png' : 'jpg';

  if (
    !isFirebaseConfigured() ||
    !storage ||
    isTemporaryPreviewHost() ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return { imageUrl: compressedDataUrl, storedInFirebaseStorage: false };
  }

  try {
    const storagePath = `certificates/${normalizedPhone}/${safeCertName}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, storagePath);
    const uploadBlob = dataUrlToBlob(compressedDataUrl);

    const uploadPromise = uploadBytes(storageRef, uploadBlob, {
      contentType: uploadBlob.type || 'image/jpeg',
    }).then((snap) => getDownloadURL(snap.ref));

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 9000)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return { imageUrl: downloadUrl, storedInFirebaseStorage: true };
  } catch (err) {
    console.warn('Firebase Storage fallback to compressed DataURL:', err);
    return { imageUrl: compressedDataUrl, storedInFirebaseStorage: false };
  }
}
