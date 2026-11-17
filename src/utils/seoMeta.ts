import { AcademySettings } from '../types';
import { DEFAULT_SETTINGS } from './storage';
import { syncAppIcon } from './pwa';

export interface PreviewSettingsDTO {
  academyName: string;
  description: string;
  logoDataUrl: string;
  updatedAt: number;
}

export function resolvePreviewTitle(settings: Partial<AcademySettings>): string {
  const raw = settings.academyName?.trim();
  return raw || DEFAULT_SETTINGS.academyName;
}

export function resolvePreviewDescription(settings: Partial<AcademySettings>): string {
  const custom = settings.previewDescription?.trim();
  if (custom) return custom;
  const slogan = settings.slogan?.trim();
  if (slogan) return slogan;
  return DEFAULT_SETTINGS.previewDescription || DEFAULT_SETTINGS.slogan || '';
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Updates browser <head> Title, Description, Open Graph, Twitter Card & JSON-LD
 * directly from Academy Settings in real time.
 */
export function syncDocumentPreviewMeta(settings: Partial<AcademySettings>): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const title = resolvePreviewTitle(settings);
  const description = resolvePreviewDescription(settings);
  const versionTs = settings.previewUpdatedAt || Date.now();
  const origin = window.location.origin;
  const ogImageUrl = `${origin}/api/og-image.png?v=${versionTs}`;
  const currentUrl = `${origin}${window.location.pathname || '/'}`;

  document.title = title;
  upsertMetaTag('name', 'description', description);

  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', title);
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', currentUrl);
  upsertMetaTag('property', 'og:image', ogImageUrl);
  upsertMetaTag('property', 'og:image:secure_url', ogImageUrl);
  upsertMetaTag('property', 'og:image:type', 'image/png');
  upsertMetaTag('property', 'og:image:width', '1200');
  upsertMetaTag('property', 'og:image:height', '630');
  upsertMetaTag('property', 'og:image:alt', title);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', ogImageUrl);

  const jsonLdEl = document.getElementById('academy-jsonld');
  if (jsonLdEl) {
    jsonLdEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: title,
      description,
      url: origin,
      image: ogImageUrl,
      logo: ogImageUrl,
    });
  }

  syncAppIcon(settings.logoDataUrl || '');
}

export async function pushPreviewSettingsToServer(
  payload: PreviewSettingsDTO
): Promise<PreviewSettingsDTO | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/api/preview-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.settings || payload;
  } catch {
    return null;
  }
}

export async function fetchPreviewSettingsFromServer(): Promise<PreviewSettingsDTO | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/api/preview-settings', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    return {
      academyName: typeof data.academyName === 'string' ? data.academyName : '',
      description: typeof data.description === 'string' ? data.description : '',
      logoDataUrl: typeof data.logoDataUrl === 'string' ? data.logoDataUrl : '',
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    };
  } catch {
    return null;
  }
}
