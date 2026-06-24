'use client';

import { Capacitor } from '@capacitor/core';

// ───────────────────────────────────────────────────────────────────────────
// Ingreso biométrico (huella / Face ID / Touch ID).
//
//  • APK nativo (Capacitor): usa el plugin nativo @aparajita/capacitor-biometric-auth
//    (BiometricPrompt en Android, Face ID/Touch ID en iOS).
//  • Web / PWA: usa WebAuthn (autenticador de plataforma del navegador).
//
// En ambos casos NO hay backend: la biometría actúa como una "llave local del
// dispositivo" — al activarla se guarda el correo y, al verificar la biometría,
// se restaura la sesión sin escribir el teléfono.
// ───────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'comander-biometric';

interface BiometricRecord {
  email: string;
  credentialId?: string; // solo WebAuthn (web)
}

export type BiometryKind = 'face' | 'fingerprint' | 'generic';

const isNative = () => Capacitor.isNativePlatform();

async function plugin() {
  return import('@aparajita/capacitor-biometric-auth');
}

// ─── persistencia ───
export function getBiometric(): BiometricRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BiometricRecord) : null;
  } catch {
    return null;
  }
}
export function isBiometricEnabled(): boolean {
  return getBiometric() !== null;
}
export function disableBiometric(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ─── disponibilidad ───
export async function biometricAvailable(): Promise<boolean> {
  if (isNative()) {
    try {
      const { BiometricAuth } = await plugin();
      const res = await BiometricAuth.checkBiometry();
      return !!res.isAvailable;
    } catch {
      return false;
    }
  }
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Tipo de biometría (para mostrar "Face ID" o "Huella"). */
export async function biometryKind(): Promise<BiometryKind> {
  if (isNative()) {
    try {
      const { BiometricAuth, BiometryType } = await plugin();
      const t = (await BiometricAuth.checkBiometry()).biometryType;
      if (t === BiometryType.faceId || t === BiometryType.faceAuthentication) return 'face';
      if (t === BiometryType.touchId || t === BiometryType.fingerprintAuthentication) return 'fingerprint';
      return 'generic';
    } catch {
      return 'generic';
    }
  }
  if (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) return 'face';
  return 'fingerprint';
}

// ─── helpers WebAuthn (solo web) ───
function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBuf(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}
function randomBytes(n: number): ArrayBuffer {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a.buffer as ArrayBuffer;
}

// ─── registro ───
export async function registerBiometric(email: string): Promise<boolean> {
  if (!(await biometricAvailable())) return false;

  if (isNative()) {
    try {
      const { BiometricAuth } = await plugin();
      await BiometricAuth.authenticate({
        reason: 'Activa el ingreso biométrico en COMANDER',
        androidTitle: 'COMANDER',
        androidSubtitle: 'Verifica tu identidad',
        allowDeviceCredential: true,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email } satisfies BiometricRecord));
      return true;
    } catch {
      return false;
    }
  }

  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'COMANDER', id: location.hostname },
        user: { id: randomBytes(16), name: email, displayName: email },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, credentialId: bufToB64url(cred.rawId) }));
    return true;
  } catch {
    return false;
  }
}

// ─── verificación ───
export async function authenticateBiometric(): Promise<string | null> {
  const record = getBiometric();
  if (!record) return null;

  if (isNative()) {
    try {
      const { BiometricAuth } = await plugin();
      await BiometricAuth.authenticate({
        reason: 'Ingresa a COMANDER',
        androidTitle: 'COMANDER',
        androidSubtitle: 'Ingresar con biometría',
        allowDeviceCredential: true,
      });
      return record.email;
    } catch {
      return null;
    }
  }

  if (!record.credentialId || !(await biometricAvailable())) return null;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: b64urlToBuf(record.credentialId), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return assertion ? record.email : null;
  } catch {
    return null;
  }
}
