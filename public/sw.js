const CACHE_NAME = 'furqan-app-__SW_VERSION__';
const BASE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];
const EXTRA_BUILD_ASSETS = __EXTRA_BUILD_ASSETS__;
const SHELL_ASSETS = Array.from(new Set([...BASE_SHELL_ASSETS, ...EXTRA_BUILD_ASSETS]));

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        SHELL_ASSETS.map(async (assetUrl) => {
          try {
            const response = await fetch(assetUrl, { cache: 'reload' });
            if (response && response.ok) {
              await cache.put(assetUrl, response.clone());
              if (assetUrl === '/index.html') {
                await cache.put('/', response);
              }
            }
          } catch {
            // Best-effort per-asset precache so a single missing file never breaks SW install
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .then(async () => {
        const allClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        allClients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME });
        });
      })
  );
});

async function matchCachedNavigation(request) {
  const exact = await caches.match(request, { ignoreSearch: true });
  if (exact) return exact;
  const rootCached = await caches.match('/');
  if (rootCached) return rootCached;
  const indexCached = await caches.match('/index.html');
  if (indexCached) return indexCached;
  return new Response(
    '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>أكاديمية الفرقان العالمية</title><body style="background:#0B3D2E;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h1>أكاديمية الفرقان العالمية</h1><p>التطبيق يعمل في وضع عدم الاتصال</p></div></body></html>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept or cache API endpoints, version manifest, or SW script
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname === '/version.json' || url.pathname === '/sw.js') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(
        () => caches.match(event.request) || new Response('{}', { status: 200 })
      )
    );
    return;
  }

  // Navigation requests (home page & SPA routes): Network-first bypassing browser HTTP cache
  const isNavigation =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.ok) {
            const copyForReq = response.clone();
            const copyForRoot = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => Promise.all([cache.put(event.request, copyForReq), cache.put('/', copyForRoot)]))
              .catch(() => {});
            return response;
          }
          return matchCachedNavigation(event.request);
        })
        .catch(() => matchCachedNavigation(event.request))
    );
    return;
  }

  // Code bundles & Vite modules: Network-first with cache: 'no-cache' so mobile browsers always get fresh builds
  const isCodeOrModule =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css');

  if (isCodeOrModule) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || Response.error();
        })
    );
    return;
  }

  // Static assets (manifest, icons, fonts, images): Network-fresh background update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});
