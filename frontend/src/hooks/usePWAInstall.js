import { useState, useEffect } from 'react';

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    console.log('PWA Install Hook: Checking PWA support...');
    console.log('Service Worker:', 'serviceWorker' in navigator);
    console.log('BeforeInstallPrompt:', 'onbeforeinstallprompt' in window);

    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA Install Hook: beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA Install Hook: Installable set to true');
    };

    const handleAppInstalled = () => {
      console.log('PWA Install Hook: App installed');
      // Hide the install button after installation
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Always show install button if service worker is supported (for development/testing)
    if ('serviceWorker' in navigator) {
      setIsInstallable(true);
      console.log('PWA Install Hook: Installable set to true (service worker supported)');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA Install Hook: App is already installed');
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    console.log('Install button clicked');

    if (deferredPrompt) {
      // Use the native install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      // Reset the deferred prompt variable
      setDeferredPrompt(null);
      setIsInstallable(false);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } else {
      // Fallback: Show manual install instructions
      alert('To install CareCircle:\n\n1. Click the browser menu (⋮)\n2. Select "Install CareCircle" or "Add to Home Screen"\n3. Follow the prompts to install');
    }
  };

  return { isInstallable, installPWA };
};

export default usePWAInstall;
