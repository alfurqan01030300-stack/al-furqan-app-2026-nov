/**
 * PWA Icon & Manifest Integrity Synchronizer
 * Keeps <link rel="manifest" href="/manifest.json"> static and HTTPS-fetchable
 * so Android Chrome WebAPK minting always builds a full standalone app (no Chrome shortcut badge or letter fallback).
 */

export const PUBLISHED_APP_URL = 'https://al-furqan-app-2026-nov.vercel.app';

export function syncAppIcon(logoDataUrl?: string) {
  try {
    const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    const appleIconLink = document.getElementById('dynamic-apple-icon') as HTMLLinkElement | null;

    // Never replace the manifest href with a blob: URL — WebAPK requires a real HTTP/HTTPS /manifest.json
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (manifestLink && manifestLink.getAttribute('href') !== '/manifest.json') {
      manifestLink.href = '/manifest.json';
    }

    // Keep iOS Safari home screen icon pointing to /apple-touch-icon.png
    if (appleIconLink && appleIconLink.getAttribute('href') !== '/apple-touch-icon.png') {
      appleIconLink.href = '/apple-touch-icon.png';
    }

    // Only update browser tab favicon when admin explicitly sets a custom image; default to /icon-192.png
    if (faviconLink) {
      faviconLink.href =
        logoDataUrl && logoDataUrl.startsWith('data:image') ? logoDataUrl : '/icon-192.png';
    }
  } catch (err) {
    console.warn('Error synchronizing app icon:', err);
  }
}
