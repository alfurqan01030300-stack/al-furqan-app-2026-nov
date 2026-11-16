import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker /sw.js so the app installs as a real PWA and works offline
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerAppServiceWorker = async () => {
    try {
      // Remove any legacy broken /dev-sw.js registration if present
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        existingRegs
          .filter((r) => r.active?.scriptURL.includes('dev-sw.js') || r.installing?.scriptURL.includes('dev-sw.js'))
          .map((r) => r.unregister().catch(() => false))
      );

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      registration.update().catch(() => {});
    } catch (err) {
      console.warn('Service Worker registration warning:', err);
    }
  };

  if (document.readyState === 'complete') {
    registerAppServiceWorker();
  } else {
    window.addEventListener('load', registerAppServiceWorker, { once: true });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
