import { useState, useEffect, useCallback } from 'react';
import { Workbox } from 'workbox-window';

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface PWAActions {
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  skipWaiting: () => void;
  showInstallPrompt: () => void;
  dismissInstallPrompt: () => void;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    isUpdateAvailable: false,
    isUpdating: false,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [workbox, setWorkbox] = useState<Workbox | null>(null);

  // Initialize PWA
  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppMode = (window.navigator as any).standalone === true;
    
    setState(prev => ({
      ...prev,
      isInstalled: isStandalone || isInWebAppMode
    }));

    // Initialize service worker
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const wb = new Workbox('/sw.js');
      setWorkbox(wb);

      // Service worker is waiting to activate
      wb.addEventListener('waiting', () => {
        setState(prev => ({ ...prev, isUpdateAvailable: true }));
      });

      // Service worker is controlling the page
      wb.addEventListener('controlling', () => {
        setState(prev => ({ ...prev, isUpdating: false }));
        window.location.reload();
      });

      // Register service worker
      wb.register().then((registration) => {
        setState(prev => ({ ...prev, registration }));
        console.log('✅ Service Worker registered successfully');
      }).catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
      console.log('✅ PWA was installed');
    };

    // Listen for online/offline changes
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstallable: false }));
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing app:', error);
    }
  }, [deferredPrompt]);

  // Update app
  const updateApp = useCallback(async () => {
    if (!workbox) return;

    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      // Tell the waiting service worker to skip waiting and become active
      workbox.messageSkipWaiting();
    } catch (error) {
      console.error('Error updating app:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [workbox]);

  // Skip waiting for service worker
  const skipWaiting = useCallback(() => {
    if (workbox) {
      workbox.messageSkipWaiting();
    }
  }, [workbox]);

  // Show install prompt manually
  const showInstallPrompt = useCallback(() => {
    if (deferredPrompt) {
      installApp();
    }
  }, [deferredPrompt, installApp]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setState(prev => ({ ...prev, isInstallable: false }));
    setDeferredPrompt(null);
  }, []);

  const actions: PWAActions = {
    installApp,
    updateApp,
    skipWaiting,
    showInstallPrompt,
    dismissInstallPrompt,
  };

  return { ...state, actions };
};

// Hook for checking PWA capabilities
export const usePWACapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    canInstall: false,
    hasServiceWorker: false,
    hasNotifications: false,
    hasBackgroundSync: false,
    hasPushNotifications: false,
    hasWebShare: false,
    hasFileSystemAccess: false,
  });

  useEffect(() => {
    setCapabilities({
      canInstall: 'beforeinstallprompt' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      hasPushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
      hasWebShare: 'share' in navigator,
      hasFileSystemAccess: 'showOpenFilePicker' in window,
    });
  }, []);

  return capabilities;
};

// Hook for device detection
export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    touchSupport: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppMode = (window.navigator as any).standalone === true;

    setDevice({
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent),
      isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isStandalone: isStandalone || isInWebAppMode,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    });
  }, []);

  return device;
};
