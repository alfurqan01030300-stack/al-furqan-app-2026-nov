import { CertificateRecord, PaymentRecord } from '../types';

export type DownloadStatus = 'idle' | 'downloading' | 'success' | 'mobile-fallback' | 'error';

export interface DownloadState {
  status: DownloadStatus;
  message: string;
  blobUrl: string | null;
  filename: string;
  mimeType: string;
  blob: Blob | null;
  canShare: boolean;
}

export const INITIAL_DOWNLOAD_STATE: DownloadState = {
  status: 'idle',
  message: '',
  blobUrl: null,
  filename: '',
  mimeType: '',
  blob: null,
  canShare: false,
};

/**
 * Detects mobile devices & in-app browsers (Safari iOS, WhatsApp Browser, Chrome Android)
 */
export function detectBrowserEnvironment() {
  if (typeof navigator === 'undefined') {
    return { isMobile: false, isIOS: false, isSafari: false, isInAppBrowser: false };
  }
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile|Tablet/i.test(ua);
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|Instagram|Line|MicroMessenger|wv\)/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  return { isMobile, isIOS, isSafari, isInAppBrowser };
}

/**
 * Checks whether navigator.share supports sharing this File
 */
export function canShareFile(blob: Blob, filename: string, mimeType: string): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof File === 'undefined') {
      return false;
    }
    const file = new File([blob], filename, { type: mimeType });
    if (typeof navigator.canShare === 'function') {
      return navigator.canShare({ files: [file] });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers native mobile Share / Save sheet using navigator.share & navigator.canShare
 */
export async function shareDownloadedFile(
  blob: Blob,
  filename: string,
  mimeType: string,
  title?: string
): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false;
    }
    const file = new File([blob], filename, { type: mimeType });
    if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
      return false;
    }
    await navigator.share({
      title: title || filename,
      text: filename,
      files: [file],
    });
    return true;
  } catch (err) {
    // AbortError means user closed share sheet — not a failure
    if (err instanceof Error && err.name === 'AbortError') {
      return true;
    }
    console.warn('navigator.share fallback notice:', err);
    return false;
  }
}

/**
 * Universal Download Executor using Blob + URL.createObjectURL + a[download]
 * Handles Desktop Chrome/Edge/Safari, Mobile Chrome/Safari, and WhatsApp In-App Browser
 */
export async function executeUniversalDownload(
  blob: Blob,
  filename: string,
  mimeType: string,
  onStateChange: (state: DownloadState) => void
): Promise<void> {
  const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '-');
  const typedBlob = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
  const shareable = canShareFile(typedBlob, safeFilename, mimeType);

  onStateChange({
    status: 'downloading',
    message: 'جارٍ التحميل...',
    blobUrl: null,
    filename: safeFilename,
    mimeType,
    blob: typedBlob,
    canShare: shareable,
  });

  // Short micro-yield so "جارٍ التحميل..." renders visibly before heavy sync work
  await new Promise((r) => setTimeout(r, 120));

  let objectUrl = '';
  try {
    objectUrl = URL.createObjectURL(typedBlob);
    const env = detectBrowserEnvironment();

    // 1. Trigger standard Blob download via <a download="filename.ext">
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = safeFilename;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. On Mobile / iOS Safari / WhatsApp Browser: direct <a download> is often blocked or opened without prompt.
    // Open in a new tab if in-app or iOS Safari, and provide Share + Manual Open fallback controls.
    if (env.isMobile || env.isInAppBrowser || (env.isIOS && env.isSafari)) {
      if (env.isInAppBrowser || env.isIOS) {
        // Attempt to open in new tab so user can view & save immediately
        try {
          window.open(objectUrl, '_blank', 'noopener');
        } catch {
          // Popup blocked — user still has manual link button below
        }
      }

      onStateChange({
        status: 'mobile-fallback',
        message: 'تم تجهيز الملف بنجاح! إذا لم يبدأ التنزيل تلقائياً على هاتفك، استخدم زر المشاركة أو الفتح اليدوي أدناه:',
        blobUrl: objectUrl,
        filename: safeFilename,
        mimeType,
        blob: typedBlob,
        canShare: shareable,
      });
    } else {
      onStateChange({
        status: 'success',
        message: 'تم التحميل بنجاح',
        blobUrl: objectUrl,
        filename: safeFilename,
        mimeType,
        blob: typedBlob,
        canShare: shareable,
      });
    }
  } catch (err) {
    console.error('Download failed:', err);
    onStateChange({
      status: 'error',
      message: 'تعذر التحميل التلقائي — اضغط هنا لفتح الملف وحفظه يدوياً',
      blobUrl: objectUrl || null,
      filename: safeFilename,
      mimeType,
      blob: typedBlob,
      canShare: shareable,
    });
  }
}

/**
 * Converts an HTML5 Canvas into a genuine, valid 1-page PDF Blob (embedding crisp JPEG raster)
 * Preserves 100% of Arabic ligatures, RTL typography, and Islamic borders without font-embedding errors.
 */
export function canvasToPdfBlob(canvas: HTMLCanvasElement, landscape = true): Blob {
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = jpegDataUrl.split(',')[1];
  const binaryStr = atob(base64);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  // Standard A4 points: 842 x 595 (landscape) or 595 x 842 (portrait)
  const pageWidth = landscape ? 842 : Math.round((canvas.width / canvas.height) * 842);
  const pageHeight = landscape ? Math.round((canvas.height / canvas.width) * 842) : 842;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let totalLength = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    totalLength += bytes.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    totalLength += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Obj 1: Catalog
  offsets[1] = totalLength;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = totalLength;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page
  offsets[3] = totalLength;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Obj 4: Image XObject (JPEG DCTDecode)
  offsets[4] = totalLength;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // Obj 5: Content stream
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = totalLength;
  pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // Cross-reference table
  const xrefStart = totalLength;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const merged = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    merged.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([merged], { type: 'application/pdf' });
}

/**
 * Generates an ornate Payment Receipt Canvas -> PNG or PDF Blob
 */
export async function generateReceiptCanvas(
  payment: PaymentRecord,
  academyName: string
): Promise<HTMLCanvasElement> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Emerald Banner
  const grad = ctx.createLinearGradient(0, 0, 1000, 260);
  grad.addColorStop(0, '#07241B');
  grad.addColorStop(0.5, '#0B3D2E');
  grad.addColorStop(1, '#145A43');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 260);

  // Gold Outer Frame
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, 952, 1232);
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, 924, 1204);

  // Emblem circle
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(500, 100, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#07241B';
  ctx.font = 'bold 42px Cairo, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 500, 102);

  // Academy Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px Cairo, Amiri, sans-serif';
  ctx.fillText(academyName, 500, 182);

  ctx.fillStyle = '#F3E5AB';
  ctx.font = '600 22px Cairo, sans-serif';
  ctx.fillText('إيصال سداد رسوم اشتراك شهري', 500, 224);

  // Receipt Meta Row
  ctx.direction = 'rtl';
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`رقم الإيصال: ${payment.receiptNumber}`, 910, 325);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillText(`التاريخ: ${payment.date}`, 90, 325);

  // Divider
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 360);
  ctx.lineTo(910, 360);
  ctx.stroke();

  // Amount Highlight Card
  ctx.fillStyle = '#F0FDF4';
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(120, 400, 760, 170, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#166534';
  ctx.font = 'bold 26px Cairo, sans-serif';
  ctx.fillText('المبلغ المدفوع (تم السداد بالكامل)', 500, 450);

  ctx.fillStyle = '#07241B';
  ctx.font = '900 58px Cairo, sans-serif';
  ctx.fillText(`${payment.amount} ${payment.currency}`, 500, 520);

  // Details Table
  const rows = [
    { label: 'اسم الطالب الكريم:', value: payment.studentName },
    { label: 'عن شهر:', value: payment.monthKey },
    { label: 'تاريخ الاستحقاق المسجل:', value: payment.date },
    { label: 'حالة الدفع:', value: 'مسدد ومعتمد ✓' },
    { label: 'ملاحظات:', value: payment.notes || 'اشتراك الحلقات القرآنية الشهرية' },
  ];

  let y = 650;
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(90, y - 34, 820, 68);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.fillText(row.label, 890, y + 6);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 25px Cairo, sans-serif';
    ctx.fillText(row.value, 110, y + 6);
    y += 82;
  });

  // Stamp & Signature
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(240, 1130, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#B38728';
  ctx.font = 'bold 20px Amiri, Cairo, serif';
  ctx.fillText('ختم الأكاديمية', 240, 1120);
  ctx.font = '600 16px Cairo, sans-serif';
  ctx.fillText('معتمد إلكترونياً', 240, 1150);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText('توقيع إدارة الأكاديمية:', 880, 1110);
  ctx.fillStyle = '#475569';
  ctx.font = '20px Amiri, serif';
  ctx.fillText(academyName, 880, 1150);

  return canvas;
}

/**
 * Generates an ornate Islamic Completion Certificate Canvas -> PDF or PNG Blob
 */
export async function generateCertificateCanvas(
  cert: CertificateRecord,
  academyName: string
): Promise<HTMLCanvasElement> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1131;
  const ctx = canvas.getContext('2d')!;

  // Rich Ivory Parchment Background
  const bgGrad = ctx.createRadialGradient(800, 565, 100, 800, 565, 950);
  bgGrad.addColorStop(0, '#FFFDF7');
  bgGrad.addColorStop(1, '#F7EED3');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1600, 1131);

  // Outer Deep Emerald Border Frame
  ctx.strokeStyle = '#0B3D2E';
  ctx.lineWidth = 28;
  ctx.strokeRect(24, 24, 1552, 1083);

  // Inner Gold Borders
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 8;
  ctx.strokeRect(52, 52, 1496, 1027);
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 68, 1464, 995);

  // Corner Islamic Gold Accents
  const corners = [
    [68, 68],
    [1532, 68],
    [68, 1063],
    [1532, 1063],
  ];
  ctx.fillStyle = '#0B3D2E';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // Top Logo Badge
  ctx.fillStyle = '#0B3D2E';
  ctx.beginPath();
  ctx.arc(800, 145, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 50px Cairo, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 800, 148);

  // Bismillah & Academy Title
  ctx.direction = 'rtl';
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 34px Amiri, Cairo, serif';
  ctx.fillText('بسم الله الرحمن الرحيم', 800, 235);

  ctx.fillStyle = '#B38728';
  ctx.font = 'bold 30px Cairo, sans-serif';
  ctx.fillText(academyName, 800, 285);

  // Certificate Main Title Banner
  ctx.fillStyle = '#0B3D2E';
  ctx.beginPath();
  ctx.roundRect(380, 325, 840, 84, 18);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#F3E5AB';
  ctx.font = 'bold 46px Amiri, Cairo, serif';
  ctx.fillText(
    cert.type === 'stars'
      ? 'شهادة تكريم وتفوق (وسام العشر نجوم)'
      : 'شهادة تقدير وإتمام حفظ قرآني',
    800,
    368
  );

  // Intro Line
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 30px Cairo, sans-serif';
  ctx.fillText('تشهد إدارة وهيئة تدريس الأكاديمية بأن الطالب / الطالبة:', 800, 470);

  // Student Name in Gold Calligraphy Style
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 64px Amiri, Cairo, serif';
  ctx.fillText(cert.studentName, 800, 560);

  // Decorative Gold Underline
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(450, 610);
  ctx.lineTo(1150, 610);
  ctx.stroke();

  // Achievement Description
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 32px Cairo, sans-serif';
  ctx.fillText(
    cert.type === 'stars'
      ? 'قد أتم بفضل الله جمع عشر نجوم متتالية للتميز والالتزام في الحفظ والتلاوة'
      : 'قد أتم بحمد الله وتوفيقه حفظ وإتقان:',
    800,
    675
  );

  // Juz / Achievement Pill Box
  ctx.fillStyle = '#FFF9E6';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(420, 720, 760, 85, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 42px Amiri, Cairo, serif';
  ctx.fillText(cert.juzName, 800, 764);

  // Quranic Hadith Footer
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'italic 26px Amiri, serif';
  ctx.fillText('قال رسول الله ﷺ: «خَيرُكُم مَن تَعلَّمَ القُرآنَ وعَلَّمَهُ»', 800, 865);

  // Bottom Row: Date (Right), Gold Seal (Center), Signature (Left)
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 26px Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`تاريخ الإتمام: ${cert.completionDate}`, 1440, 965);
  ctx.fillText('سائلين المولى له دوام التوفيق والثبات', 1440, 1005);

  // Gold Seal in Center
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(800, 975, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0B3D2E';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#07241B';
  ctx.font = 'bold 22px Amiri, serif';
  ctx.fillText('شهادة معتمدة', 800, 966);
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.fillText('أكاديمية الفرقان', 800, 994);

  // Left Signature
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0B3D2E';
  ctx.font = 'bold 26px Cairo, sans-serif';
  ctx.fillText('اعتماد إدارة الأكاديمية', 160, 965);
  ctx.fillStyle = '#B38728';
  ctx.font = 'bold 24px Amiri, serif';
  ctx.fillText(academyName, 160, 1005);

  return canvas;
}
