'use client';

import { useAuth } from '@/lib/store';

// Todas las llamadas pasan por /api (Next reescribe a NEXT_PUBLIC_API_URL → NestJS :3000),
// así evitamos CORS al ir mismo-origen contra el dev server.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().token;
  const res = await fetch(`/api${path}`, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && token !== 'demo-token' ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message ?? body?.error?.message ?? msg;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return res.json() as Promise<T>;
}

// ───────── Respuestas del backend (NestJS) ─────────
export interface ApiLoginResponse {
  accessToken: string;
  user: { id: string; email: string; nombre: string; avatar: string | null; role: string };
}
export interface ApiBusiness {
  id: string;
  nombre: string;
  sector: string;
  logo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  metaMensual: number | null;
  updatedAt: string;
  _count?: { transactions: number; integrations: number };
}
export interface ApiTransaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  businessId: string;
}

export const apiLogin = (email: string, password: string) =>
  apiFetch<ApiLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const fetchBusinesses = () => apiFetch<ApiBusiness[]>('/businesses');
export const fetchTransactions = () => apiFetch<ApiTransaction[]>('/transactions');

/** Comprueba si el backend está vivo (sin requerir auth). */
export async function pingApi(): Promise<boolean> {
  try {
    // login con credenciales vacías → 400/401 igual confirma que el server responde
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return res.status > 0;
  } catch {
    return false;
  }
}
