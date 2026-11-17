import { useCallback, useEffect, useRef, useState } from 'react';
import { PUBLISHED_APP_URL } from '../utils/pwa';

declare const __APP_VERSION__: string;
declare const __APP_BUILD_ID__: string;

export type UpdateStatus = 'idle' | 'checking' | 'updating' | 'up-to-date';

const UPDATE_SUCCESS_SESSION_KEY = 'furqan_update_completed_v1';
const AUTO_UPDATE_GUARD_KEY = 'furqan_auto_update_guard_v1';
const VERSION_CHECK_INTERVAL_MS = 20 * 1000; // كل 20 ثانية
const AUTO_RELOAD_DELAY_MS = 2000; // إظهار رسالة "جارى تحديث التطبيق..." ثانيتين ثم إعادة التحميل

function isLocalOrAiStudioPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = (window.location.hostname || '').toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('ais-dev-') ||
    host.startsWith('ais-pre-') ||
    host.endsWith('.run.app') ||
    host.includes('aistudio.google.com')
  );
}

function resolveHardReloadOrigin(): string {
  if (typeof window === 'undefined') return PUBLISHED_APP_URL;
  return isLocalOrAiStudioPreviewHost() ? window.location.origin : PUBLISHED_APP_URL;
}

function hasRecentlyAutoReloadedFor(versionSignature: string): boolean {
  if (typeof window === 'undefined' || !versionSignature) return false;
  try {
    const raw = window.sessionStorage.getItem(AUTO_UPDATE_GUARD_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { sig?: string; at?: number };
    if (
      parsed?.sig === versionSignature &&
      typeof parsed.at === 'number' &&
      Date.now() - parsed.at < 30 * 1000
    ) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function markAutoReloadAttempt(versionSignature: string): void {
  if (typeof window === 'undefined' || !versionSignature) return;
  try {
    window.sessionStorage.setItem(
      AUTO_UPDATE_GUARD_KEY,
      JSON.stringify({ sig: versionSignature, at: Date.now() })
    );
  } catch {
    // ignore
  }
}

async function clearBrowserCachesAndResetServiceWorker(): Promise<void> {
  // IMPORTANT: Clear ONLY CacheStorage & Service Worker caches/registrations.
  // NEVER delete localStorage or IndexedDB so all saved students, teachers, grades, and settings stay safe.
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    // ignore cache deletion warnings
  }

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          try {
            reg.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
            reg.waiting?.postMessage({ type: 'CLEAR_ALL_CACHES' });
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
            reg.installing?.postMessage({ type: 'SKIP_WAITING' });
            await reg.update().catch(() => {});
            await reg.unregister().catch(() => false);
          } catch {
            // ignore
          }
        })
      );
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const remaining = await caches.keys();
      await Promise.all(remaining.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    // ignore
  }
}

export function useAppUpdater() {
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateMessage, setUpdateMessage] = useState('');
  const initialControllerRef = useRef<boolean>(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? Boolean(navigator.serviceWorker.controller)
      : false
  );
  const autoUpdateInProgressRef = useRef<boolean>(false);

  const currentVersion =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0';
  const currentBuildId =
    typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : '3.0';

  // Detect completed reload, register fresh Service Worker, and show "تم التحديث بنجاح"
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const hasUpdatedParam = url.searchParams.get('updated') === '1';
    let hasSessionFlag = false;
    try {
      hasSessionFlag = window.sessionStorage.getItem(UPDATE_SUCCESS_SESSION_KEY) === '1';
      if (hasSessionFlag) {
        window.sessionStorage.removeItem(UPDATE_SUCCESS_SESSION_KEY);
      }
    } catch {
      // ignore storage access issues
    }

    if (url.searchParams.has('v') || url.searchParams.has('updated')) {
      url.searchParams.delete('v');
      url.searchParams.delete('updated');
      const cleaned =
        url.pathname +
        (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') +
        url.hash;
      window.history.replaceState(null, '', cleaned || '/');
    }

    if (hasUpdatedParam || hasSessionFlag) {
      setHasUpdateAvailable(false);
      setUpdateStatus('up-to-date');
      setUpdateMessage('تم التحديث بنجاح');

      // Re-register fresh Service Worker from network with updateViaCache: 'none'
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/', updateViaCache: 'none' })
          .then((reg) => reg.update().catch(() => {}))
          .catch(() => {});
      }

      const dismissTimer = setTimeout(() => {
        setUpdateStatus((prev) => (prev === 'up-to-date' ? 'idle' : prev));
        setUpdateMessage((prev) => (prev === 'تم التحديث بنجاح' ? '' : prev));
      }, 6000);

      return () => clearTimeout(dismissTimer);
    }
  }, []);

  const checkRemoteVersion = useCallback(async (): Promise<{
    hasUpdate: boolean;
    nextVersion: string | null;
    signature: string;
  }> => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const remoteVer = typeof data?.version === 'string' ? data.version.trim() : null;
        const remoteBuild = typeof data?.buildId === 'string' ? data.buildId.trim() : null;

        const isDifferentVersion = Boolean(remoteVer && remoteVer !== currentVersion);
        const isDifferentBuild = Boolean(remoteBuild && remoteBuild !== currentBuildId);

        if (isDifferentVersion || isDifferentBuild) {
          const sig = `${remoteVer || ''}|${remoteBuild || ''}`;
          return { hasUpdate: true, nextVersion: remoteVer, signature: sig };
        }
      }
    } catch {
      // Offline or transient error — fall through to SW check
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting && navigator.serviceWorker.controller) {
            return {
              hasUpdate: true,
              nextVersion: null,
              signature: `sw-waiting-${reg.waiting.scriptURL || ''}`,
            };
          }
        }
      }
    } catch {
      // ignore
    }

    return { hasUpdate: false, nextVersion: null, signature: '' };
  }, [currentVersion, currentBuildId]);

  const executeHardReload = useCallback(
    async (options?: { delayMs?: number; statusMessage?: string; signature?: string }) => {
      if (autoUpdateInProgressRef.current) return;
      autoUpdateInProgressRef.current = true;

      const delayMs = options?.delayMs ?? 350;
      const statusMessage =
        options?.statusMessage ?? 'جاري مسح الكاش القديم وتحديث التطبيق لآخر إصدار...';

      if (options?.signature) {
        markAutoReloadAttempt(options.signature);
      }

      const startedAt = Date.now();
      setUpdateStatus('updating');
      setUpdateMessage(statusMessage);

      await clearBrowserCachesAndResetServiceWorker();

      const ts = Date.now();
      const targetOrigin = resolveHardReloadOrigin();
      const isSameOrigin =
        typeof window !== 'undefined' && window.location.origin === targetOrigin;

      try {
        if (isSameOrigin) {
          await Promise.all([
            fetch(`/?t=${ts}`, {
              cache: 'reload',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
              },
            }).catch(() => {}),
            fetch(`/version.json?t=${ts}`, {
              cache: 'reload',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
              },
            }).catch(() => {}),
          ]);
        }
      } catch {
        // ignore network pre-warm failure
      }

      try {
        window.sessionStorage.setItem(UPDATE_SUCCESS_SESSION_KEY, '1');
      } catch {
        // ignore
      }

      const elapsed = Date.now() - startedAt;
      const remainingDelay = Math.max(0, delayMs - elapsed);

      setTimeout(() => {
        const current = new URL(window.location.href);
        current.searchParams.set('v', String(Date.now()));
        current.searchParams.set('updated', '1');
        const pathAndQuery =
          current.pathname +
          (current.searchParams.toString() ? `?${current.searchParams.toString()}` : '') +
          current.hash;
        const finalTarget = `${targetOrigin}${pathAndQuery}`;
        window.location.replace(finalTarget);
      }, remainingDelay);
    },
    []
  );

  const applyUpdateReload = useCallback(async () => {
    await executeHardReload({
      delayMs: 350,
      statusMessage: 'جاري مسح الكاش القديم وتحديث التطبيق لآخر إصدار...',
    });
  }, [executeHardReload]);

  // Manual force refresh if user clicks existing update button
  const forceUpdateNow = useCallback(async () => {
    await applyUpdateReload();
  }, [applyUpdateReload]);

  // 100% Automatic background check of version.json every 20 seconds (zero user action required)
  useEffect(() => {
    let isMounted = true;

    const triggerAutomaticUpdate = async (nextVer: string | null, signature: string) => {
      if (!isMounted || autoUpdateInProgressRef.current) return;
      if (signature && hasRecentlyAutoReloadedFor(signature)) return;

      if (nextVer) setRemoteVersion(nextVer);
      setHasUpdateAvailable(true);

      await executeHardReload({
        delayMs: AUTO_RELOAD_DELAY_MS,
        statusMessage: 'جارى تحديث التطبيق...',
        signature,
      });
    };

    const runBackgroundCheck = async () => {
      if (autoUpdateInProgressRef.current) return;
      const result = await checkRemoteVersion();
      if (result.hasUpdate && isMounted) {
        await triggerAutomaticUpdate(result.nextVersion, result.signature);
      }
    };

    const onSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_ACTIVATED' && initialControllerRef.current) {
        triggerAutomaticUpdate(null, `sw-activated-${event.data.cacheName || ''}`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (!reg) return;
          if (reg.waiting && navigator.serviceWorker.controller) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            triggerAutomaticUpdate(null, 'sw-waiting-initial');
          }
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller &&
                isMounted
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                triggerAutomaticUpdate(null, 'sw-updatefound');
              }
            });
          });
        })
        .catch(() => {});
    }

    const initTimer = setTimeout(runBackgroundCheck, 1500);
    const intervalId = setInterval(runBackgroundCheck, VERSION_CHECK_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runBackgroundCheck();
      }
    };
    const onFocus = () => runBackgroundCheck();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, [checkRemoteVersion, executeHardReload]);

  const checkAndUpdateNow = useCallback(async () => {
    setUpdateStatus('checking');
    setUpdateMessage('جاري فحص التحديثات ومسح الكاش القديم...');
    await applyUpdateReload();
  }, [applyUpdateReload]);

  const dismissUpdateMessage = useCallback(() => {
    setUpdateStatus('idle');
    setUpdateMessage('');
  }, []);

  return {
    hasUpdateAvailable,
    remoteVersion,
    updateStatus,
    updateMessage,
    checkAndUpdateNow,
    forceUpdateNow,
    applyUpdateReload,
    dismissUpdateMessage,
    currentVersion,
    currentBuildId,
  };
}
