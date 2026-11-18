import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import sharp, { type OverlayOptions } from 'sharp';

interface PreviewSettingsRecord {
  academyName: string;
  description: string;
  logoDataUrl: string;
  updatedAt: number;
}

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, '.data');
const PREVIEW_FILE = path.join(DATA_DIR, 'preview-settings.json');
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

function readDefaultMetadata(): { name: string; description: string } {
  try {
    const metaPath = path.join(ROOT_DIR, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return {
        name:
          typeof parsed.name === 'string' && parsed.name.trim()
            ? parsed.name.trim()
            : 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
        description:
          typeof parsed.description === 'string' && parsed.description.trim()
            ? parsed.description.trim()
            : 'نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم',
      };
    }
  } catch {
    // fallback below
  }
  return {
    name: 'أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم',
    description: 'نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم',
  };
}

function readFirebaseProjectId(): string {
  try {
    const cfgPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      if (typeof parsed.projectId === 'string') return parsed.projectId.trim();
    }
  } catch {
    // ignore
  }
  return '';
}

const DEFAULT_META = readDefaultMetadata();
const FIREBASE_PROJECT_ID = readFirebaseProjectId();

let memoryPreviewSettings: PreviewSettingsRecord | null = null;
let firestoreHydratedOnce = false;

function readPreviewSettingsFromDisk(): PreviewSettingsRecord | null {
  try {
    if (!fs.existsSync(PREVIEW_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(PREVIEW_FILE, 'utf-8'));
    if (!raw || typeof raw !== 'object') return null;
    return {
      academyName:
        typeof raw.academyName === 'string' && raw.academyName.trim()
          ? raw.academyName.trim()
          : DEFAULT_META.name,
      description:
        typeof raw.description === 'string' && raw.description.trim()
          ? raw.description.trim()
          : DEFAULT_META.description,
      logoDataUrl: typeof raw.logoDataUrl === 'string' ? raw.logoDataUrl : '',
      updatedAt: typeof raw.updatedAt === 'number' && raw.updatedAt > 0 ? raw.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function writePreviewSettingsToDisk(record: PreviewSettingsRecord): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${PREVIEW_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(record, null, 2), 'utf-8');
    fs.renameSync(tmpPath, PREVIEW_FILE);
  } catch (err) {
    console.warn('Preview settings write warning:', err);
  }
}

async function fetchFirestorePublicDoc(docName: string): Promise<Record<string, any> | null> {
  if (!FIREBASE_PROJECT_ID) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1600);
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      FIREBASE_PROJECT_ID
    )}/databases/(default)/documents/publicConfig/${encodeURIComponent(docName)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { fields?: Record<string, any> };
    return json?.fields || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getPreviewSettings(): Promise<PreviewSettingsRecord> {
  const disk = readPreviewSettingsFromDisk();
  if (disk) {
    memoryPreviewSettings = disk;
    return disk;
  }
  if (memoryPreviewSettings) {
    return memoryPreviewSettings;
  }

  if (!firestoreHydratedOnce && FIREBASE_PROJECT_ID) {
    firestoreHydratedOnce = true;
    const linkPreviewFields = await fetchFirestorePublicDoc('linkPreview');
    if (linkPreviewFields) {
      const academyName =
        linkPreviewFields.academyName?.stringValue?.trim() || DEFAULT_META.name;
      const description =
        linkPreviewFields.description?.stringValue?.trim() || DEFAULT_META.description;
      const logoDataUrl = linkPreviewFields.logoDataUrl?.stringValue || '';
      const updatedAt = Number(linkPreviewFields.updatedAt?.integerValue || Date.now());
      const hydrated: PreviewSettingsRecord = {
        academyName,
        description,
        logoDataUrl,
        updatedAt,
      };
      memoryPreviewSettings = hydrated;
      writePreviewSettingsToDisk(hydrated);
      return hydrated;
    }

    const logoFields = await fetchFirestorePublicDoc('academyLogo');
    if (logoFields?.logoDataUrl?.stringValue) {
      const hydrated: PreviewSettingsRecord = {
        academyName: DEFAULT_META.name,
        description: DEFAULT_META.description,
        logoDataUrl: logoFields.logoDataUrl.stringValue,
        updatedAt: Number(logoFields.updatedAt?.integerValue || Date.now()),
      };
      memoryPreviewSettings = hydrated;
      writePreviewSettingsToDisk(hydrated);
      return hydrated;
    }
  }

  return {
    academyName: DEFAULT_META.name,
    description: DEFAULT_META.description,
    logoDataUrl: '',
    updatedAt: 0,
  };
}

function decodeLogoDataUrl(logoDataUrl: string): Buffer | null {
  if (!logoDataUrl || typeof logoDataUrl !== 'string') return null;
  const trimmed = logoDataUrl.trim();
  const base64Match = /^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/s.exec(trimmed);
  if (base64Match?.[1]) {
    try {
      return Buffer.from(base64Match[1], 'base64');
    } catch {
      return null;
    }
  }
  const utf8SvgMatch = /^data:image\/svg\+xml(?:;charset=[^;,]+)?,(.+)$/s.exec(trimmed);
  if (utf8SvgMatch?.[1]) {
    try {
      return Buffer.from(decodeURIComponent(utf8SvgMatch[1]), 'utf-8');
    } catch {
      return null;
    }
  }
  return null;
}

function resolveDefaultAppIconPath(): string | null {
  const candidates = [
    path.join(ROOT_DIR, 'dist', 'icon-512.png'),
    path.join(ROOT_DIR, 'public', 'icon-512.png'),
    path.join(ROOT_DIR, 'dist', 'icon-192.png'),
    path.join(ROOT_DIR, 'public', 'icon-192.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function generateDynamicOgImagePng(record: PreviewSettingsRecord): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  const logoSize = 420;

  const backdropSvg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="emeraldBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#145A43" />
      <stop offset="60%" stop-color="#0B3D2E" />
      <stop offset="100%" stop-color="#062219" />
    </radialGradient>
    <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3B0" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#9A7611" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#emeraldBg)" />
  <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="28" fill="none" stroke="url(#goldFrame)" stroke-width="4" opacity="0.85" />
  <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="20" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="12 8" opacity="0.4" />
  <circle cx="${width / 2}" cy="${height / 2}" r="228" fill="#082D22" stroke="url(#goldFrame)" stroke-width="6" />
</svg>`.trim();

  let logoBuffer: Buffer | null = decodeLogoDataUrl(record.logoDataUrl);
  if (!logoBuffer) {
    const iconPath = resolveDefaultAppIconPath();
    if (iconPath) {
      logoBuffer = fs.readFileSync(iconPath);
    }
  }

  const composites: OverlayOptions[] = [];

  if (logoBuffer) {
    try {
      const circleMask = Buffer.from(
        `<svg width="${logoSize}" height="${logoSize}" viewBox="0 0 ${logoSize} ${logoSize}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2 - 4}" fill="#fff" />
        </svg>`
      );

      const resizedLogo = await sharp(logoBuffer)
        .rotate()
        .resize(logoSize, logoSize, {
          fit: 'cover',
          position: 'centre',
        })
        .ensureAlpha()
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toBuffer();

      composites.push({
        input: resizedLogo,
        left: Math.round((width - logoSize) / 2),
        top: Math.round((height - logoSize) / 2),
      });
    } catch (err) {
      console.warn('OG logo composite fallback warning:', err);
    }
  }

  return await sharp(Buffer.from(backdropSvg))
    .resize(width, height)
    .composite(composites)
    .png({ quality: 92 })
    .toBuffer();
}

function getRequestOrigin(req: Request): string {
  const fwdProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const fwdHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const proto = fwdProto || req.protocol || 'http';
  const host = fwdHost || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function injectPreviewMetaIntoHtml(
  html: string,
  req: Request,
  settings: PreviewSettingsRecord
): string {
  const origin = getRequestOrigin(req);
  const title = settings.academyName || DEFAULT_META.name;
  const description = settings.description || DEFAULT_META.description;
  const versionParam = settings.updatedAt > 0 ? `?v=${settings.updatedAt}` : '';
  const ogImageUrl = `${origin}/api/og-image.png${versionParam}`;
  const pageUrl = `${origin}${req.originalUrl || '/'}`;

  const safeTitleAttr = escapeHtmlAttr(title);
  const safeDescAttr = escapeHtmlAttr(description);
  const safeImageAttr = escapeHtmlAttr(ogImageUrl);
  const safePageUrlAttr = escapeHtmlAttr(pageUrl);

  const jsonLdObj = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: title,
    description,
    url: origin,
    image: ogImageUrl,
    logo: ogImageUrl,
  };
  const safeJsonLd = JSON.stringify(jsonLdObj).replace(/<\/script/gi, '<\\/script');

  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDescAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitleAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDescAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="website" />`
  );
  out = out.replace(
    /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:site_name" content="${safeTitleAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safePageUrlAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImageAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${safeImageAttr}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${safeTitleAttr}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:card" content="summary_large_image" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitleAttr}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDescAttr}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImageAttr}" />`
  );
  out = out.replace(
    /<script\s+type="application\/ld\+json"\s+id="academy-jsonld">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="academy-jsonld">${safeJsonLd}</script>`
  );

  return out;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use('/api', (req: Request, res: Response, next) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/preview-settings', async (_req: Request, res: Response) => {
    const current = await getPreviewSettings();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(current);
  });

  app.post('/api/preview-settings', async (req: Request, res: Response) => {
    const body = req.body || {};
    const existing = await getPreviewSettings();

    const nextAcademyName =
      typeof body.academyName === 'string' && body.academyName.trim()
        ? body.academyName.trim().slice(0, 180)
        : existing.academyName || DEFAULT_META.name;

    const nextDescription =
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim().slice(0, 400)
        : typeof body.description === 'string'
        ? DEFAULT_META.description
        : existing.description || DEFAULT_META.description;

    const nextLogoDataUrl =
      typeof body.logoDataUrl === 'string'
        ? body.logoDataUrl.trim()
        : existing.logoDataUrl || '';

    const updatedRecord: PreviewSettingsRecord = {
      academyName: nextAcademyName,
      description: nextDescription,
      logoDataUrl: nextLogoDataUrl,
      updatedAt:
        typeof body.updatedAt === 'number' && body.updatedAt > 0
          ? body.updatedAt
          : Date.now(),
    };

    memoryPreviewSettings = updatedRecord;
    writePreviewSettingsToDisk(updatedRecord);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, settings: updatedRecord });
  });

  app.get('/api/og-image.png', async (_req: Request, res: Response) => {
    try {
      const current = await getPreviewSettings();
      const pngBuffer = await generateDynamicOgImagePng(current);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
      res.send(pngBuffer);
    } catch (err) {
      console.error('Dynamic OG image generation failed:', err);
      res.status(500).send('Failed to generate OG image');
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.get('*', async (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      try {
        const indexPath = path.join(ROOT_DIR, 'index.html');
        const template = fs.readFileSync(indexPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const current = await getPreviewSettings();
        const finalHtml = injectPreviewMetaIntoHtml(transformed, req, current);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.send(finalHtml);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        res.status(500).end((err as Error).message);
      }
    });
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          if (base === 'sw.js' || base === 'version.json') {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            if (base === 'sw.js') {
              res.setHeader('Service-Worker-Allowed', '/');
            }
          } else if (base === 'manifest.json' || base === 'manifest.webmanifest') {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        },
      })
    );

    app.get('*', async (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      try {
        const distIndexPath = path.join(distDir, 'index.html');
        const html = fs.readFileSync(distIndexPath, 'utf-8');
        const current = await getPreviewSettings();
        const finalHtml = injectPreviewMetaIntoHtml(html, req, current);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(finalHtml);
      } catch {
        res.status(500).send('Application index not built yet.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Furqan server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
