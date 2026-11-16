import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export type PlatformType = 'android' | 'ios' | 'desktop';
export type InstallOutcome =
  | 'accepted'
  | 'dismissed'
  | 'already-installed'
  | 'manual-instructions';

export function detectPWAPlatform() {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'desktop' as PlatformType,
      isIOS: false,
      isAndroid: false,
      isInAppBrowser: false,
    };
  }
  const ua = navigator.userAgent || '';
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Messenger|Line|MicroMessenger|wv\)/i.test(
    ua
  );
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIPadOS;
  const isAndroid = /Android/i.test(ua);
  const platform: PlatformType = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  return { platform, isIOS, isAndroid, isInAppBrowser };
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.deferredPrompt) {
      return window.deferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>(() => detectPWAPlatform().platform);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(
    () => detectPWAPlatform().isInAppBrowser
  );

  useEffect(() => {
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () =>
      standaloneMedia.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(checkStandalone());

    const detected = detectPWAPlatform();
    setPlatform(detected.platform);
    setIsInAppBrowser(detected.isInAppBrowser);

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    const handlePromptReady = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    };

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);
    standaloneMedia.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
      standaloneMedia.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const install = async (): Promise<InstallOutcome> => {
    if (isInstalled) {
      return 'already-installed';
    }

    const promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? window.deferredPrompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          window.deferredPrompt = null;
        }
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    // No native prompt available -> show manual PWA install instructions for mobile & desktop
    return 'manual-instructions';
  };

  return {
    isInstallable: Boolean(
      deferredPrompt || (typeof window !== 'undefined' && window.deferredPrompt)
    ),
    isInstalled,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isInAppBrowser,
    platform,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
