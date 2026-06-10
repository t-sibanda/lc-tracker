import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for appinstalled
    const installedHandler = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (isInstalled || !showPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  }

  function dismiss() {
    setShowPrompt(false);
    localStorage.setItem('install-dismissed', Date.now().toString());
  }

  return (
    <div className="install-prompt fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="card p-3 flex items-center gap-3" style={{ border: '1px solid var(--app-accent)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--app-accent-bg)' }}>
          <Smartphone size={16} style={{ color: 'var(--app-accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium" style={{ color: 'var(--app-text-primary)' }}>Install LC Tracker</p>
          <p className="text-[10px]" style={{ color: 'var(--app-text-dim)' }}>Add to home screen for offline access</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium shrink-0"
          style={{ background: 'var(--app-accent)', color: '#fff' }}
        >
          <Download size={10} /> Install
        </button>
        <button onClick={dismiss} className="p-1 rounded shrink-0" style={{ color: 'var(--app-text-dim)' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// Also show an Install button component that can be placed in settings/menu
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded" style={{ background: 'var(--app-success)', color: '#fff' }}>
        <Smartphone size={10} /> App Installed
      </div>
    );
  }

  if (!deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-md font-medium"
      style={{ background: 'var(--app-accent-bg)', color: 'var(--app-accent)' }}
    >
      <Download size={10} /> Install App
    </button>
  );
}
