import { useCallback, useEffect, useRef, useState } from 'react';

declare const __APP_VERSION__: string;
declare const __APP_BUILD_ID__: string;

export type UpdateStatus = 'idle' | 'checking' | 'updating' | 'up-to-date';

async function clearBrowserAssetCachesOnly(): Promise<void> {
  // IMPORTANT: Clear ONLY CacheStorage / SW caches.
  // NEVER clear localStorage or IndexedDB so user/Firebase/PIN data stays 100% safe.
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore cache deletion warnings
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          try {
            reg.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
            await reg.unregister();
          } catch {
            // ignore
          }
        })
      );
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

  const currentVersion =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0';
  const currentBuildId =
    typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : '2.0';

  // Clean up temporary cache-bust query param (?v=...) silently after reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('v')) {
      url.searchParams.delete('v');
      const cleaned =
        url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
      window.history.replaceState(null, '', cleaned || '/');
    }
  }, []);

  const checkRemoteVersion = useCallback(async (): Promise<{
    hasUpdate: boolean;
    nextVersion: string | null;
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
          return { hasUpdate: true, nextVersion: remoteVer };
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
            return { hasUpdate: true, nextVersion: null };
          }
        }
      }
    } catch {
      // ignore
    }

    return { hasUpdate: false, nextVersion: null };
  }, [currentVersion, currentBuildId]);

  const applyUpdateReload = useCallback(async () => {
    setUpdateStatus('updating');
    setUpdateMessage('جاري مسح النسخة القديمة وتحديث التطبيق لآخر إصدار...');

    await clearBrowserAssetCachesOnly();

    try {
      // Warm network fetch of root HTML with no-store before navigating
      await fetch(`/?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }).catch(() => {});
    } catch {
      // ignore
    }

    setTimeout(() => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('v', String(Date.now()));
      window.location.replace(nextUrl.toString());
    }, 550);
  }, []);

  // Force full cache deletion and fetch newest version on button click
  const forceUpdateNow = useCallback(async () => {
    await applyUpdateReload();
  }, [applyUpdateReload]);

  // Background check on mount, focus, visibilitychange, and every 20s
  useEffect(() => {
    let isMounted = true;

    const handleDetectedUpdate = async (nextVer: string | null) => {
      // Auto-purge old caches in the background so old assets don't linger
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // ignore
      }

      if (isMounted) {
        if (nextVer) setRemoteVersion(nextVer);
        setHasUpdateAvailable(true);
      }
    };

    const runBackgroundCheck = async () => {
      const result = await checkRemoteVersion();
      if (result.hasUpdate && isMounted) {
        await handleDetectedUpdate(result.nextVersion);
      }
    };

    const onSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_ACTIVATED' && initialControllerRef.current) {
        handleDetectedUpdate(null);
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
            handleDetectedUpdate(null);
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
                handleDetectedUpdate(null);
              }
            });
          });
        })
        .catch(() => {});
    }

    const initTimer = setTimeout(runBackgroundCheck, 1200);
    const intervalId = setInterval(runBackgroundCheck, 20 * 1000);

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
  }, [checkRemoteVersion]);

  const checkAndUpdateNow = useCallback(async () => {
    setUpdateStatus('checking');
    setUpdateMessage('جاري فحص التحديثات ومسح الكاش القديم...');

    const result = await checkRemoteVersion();
    if (result.hasUpdate || hasUpdateAvailable) {
      await applyUpdateReload();
    } else {
      // Clear stale caches anyway and force-reload cleanly when user asks to update
      await applyUpdateReload();
    }
  }, [checkRemoteVersion, hasUpdateAvailable, applyUpdateReload]);

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
