'use client';

// ───────────────────────────────────────────────────────────────────────────
// Ingreso con huella (WebAuthn / autenticador de plataforma: Touch ID, huella
// Android, Windows Hello, Face ID).
//
// Commander no tiene backend de auth, así que la huella se usa como una "llave
// local del dispositivo": al activarla se crea una credencial de plataforma y se
// guarda el correo asociado. En los siguientes ingresos, verificar la huella
// (userVerification: 'required') restaura la sesión sin escribir el teléfono.
//
// Requiere contexto seguro (HTTPS o localhost); en Netlify funciona out-of-the-box.
// ───────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'comander-biometric';

interface BiometricRecord {
  credentialId: string; // base64url del rawId
  email: string; // identidad para restaurar la sesión
}

// ─── helpers base64url ⇄ ArrayBuffer ───
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

/** ¿El dispositivo tiene un autenticador de plataforma (huella/rostro) disponible? */
export async function biometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Credencial de huella ya registrada en este dispositivo (o null). */
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

/**
 * Registra la huella para `email`. Debe llamarse dentro de un gesto del usuario.
 * Devuelve true si quedó activada.
 */
export async function registerBiometric(email: string): Promise<boolean> {
  if (!(await biometricAvailable())) return false;
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'COMANDER', id: location.hostname },
        user: { id: randomBytes(16), name: email, displayName: email },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
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
    const record: BiometricRecord = { credentialId: bufToB64url(cred.rawId), email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica la huella y devuelve el correo asociado para restaurar la sesión.
 * Devuelve null si no hay credencial, no se verifica, o el usuario cancela.
 */
export async function authenticateBiometric(): Promise<string | null> {
  const record = getBiometric();
  if (!record || !(await biometricAvailable())) return null;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: location.hostname,
        allowCredentials: [
          { type: 'public-key', id: b64urlToBuf(record.credentialId), transports: ['internal'] },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return assertion ? record.email : null;
  } catch {
    return null;
  }
}
