'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (isStandalone) return null;

  // iOS Instructions
  if (isIOS && !isStandalone && showPrompt) {
     // For now, simpler iOS handling or just ignore as it's harder to detect "not installed" reliably on iOS without some tricks
     // But user asked for it.
     return (
        <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-slate-200 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Install UdryveFood</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Tap <span className="inline-block px-1 bg-slate-100 rounded">Share</span> and then <span className="inline-block px-1 bg-slate-100 rounded">Add to Home Screen</span> to install.
                    </p>
                </div>
                <button onClick={() => setShowPrompt(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>
        </div>
     );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white p-4 rounded-lg shadow-lg border border-slate-200 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Download size={18} className="text-blue-600" />
            Install UdryveFood
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Install our app for a better experience, offline access, and faster ordering.
          </p>
          <button 
            onClick={handleInstallClick}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            Install App
          </button>
        </div>
        <button onClick={() => setShowPrompt(false)} className="p-1 hover:bg-slate-100 rounded-full">
          <X size={20} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
}
