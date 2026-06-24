'use client';

import { useEffect } from 'react';

/** Registra el service worker para habilitar la instalación como PWA/APK. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
