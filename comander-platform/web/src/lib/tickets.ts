'use client';

// ───────────────────────────────────────────────────────────────────────────
// Reporte de bugs → panel central de Tickets (tickets.petroboxinc.com).
//
// Usa el CANAL PÚBLICO del backend: POST /api/public/report con una API key
// (header X-Api-Key). Una sola llamada crea el ticket + comentario + imágenes.
// (Confirmado en el código del backend: gitlab.com/petrobox/tickets · server.js)
//
// CONFIGURAR (la API key NO está en el repo — se genera en el servidor Bilbo):
//   En Bilbo, dentro del repo de tickets:
//     node tools/crear-app-client.js --nombre "COMANDER" --slug COMANDER --bot 27 --nivel interna
//   Eso imprime UNA sola vez una key  pbx_xxxxx . Pegarla en:
//     NEXT_PUBLIC_TICKETS_API_KEY = pbx_xxxxx     (Netlify / .env.local)
//   (--bot 27 reutiliza "tickets-bot"; --slug COMANDER define la estación.)
// ───────────────────────────────────────────────────────────────────────────

const PUBLIC_REPORT_URL = 'https://tickets.petroboxinc.com/api/public/report';
const API_KEY = process.env.NEXT_PUBLIC_TICKETS_API_KEY ?? '';

const APP_NAME = 'COMANDER';
const APP_VERSION = 'v1.0.0';

export type BugType = 'error' | 'optimizacion';

/** ¿Está configurada la API key? (si no, el reporte no puede enviarse). */
export function ticketsConfigured(): boolean {
  return Boolean(API_KEY);
}

export interface ReportBugInput {
  tipo: BugType;
  titulo: string;
  descripcion: string;
  file?: File | null;
  email?: string;
  url: string;
}

/**
 * Envía el reporte al canal público (1 sola petición multipart).
 * El backend exige: titulo, descripcion y un email válido.
 * Devuelve el número de ticket (p. ej. "TKT-2026-0042").
 */
export async function reportBug(input: ReportBugInput): Promise<string> {
  if (!ticketsConfigured()) {
    throw new Error('Reporte no configurado (falta NEXT_PUBLIC_TICKETS_API_KEY).');
  }

  const email = input.email && /\S+@\S+\.\S+/.test(input.email) ? input.email : 'soporte@comander.app';
  const plataforma = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 90) : 'web';
  const descripcion = [
    input.descripcion.trim(),
    '',
    `— ${APP_NAME} ${APP_VERSION} · ${plataforma} · ${input.url}`,
  ].join('\n');

  const fd = new FormData();
  fd.append('tipo', input.tipo);
  fd.append('titulo', input.titulo.trim().slice(0, 160));
  fd.append('descripcion', descripcion);
  fd.append('email', email);
  if (input.file) fd.append('imagenes', input.file);

  // No setear Content-Type: el navegador arma el boundary del multipart.
  const res = await fetch(PUBLIC_REPORT_URL, {
    method: 'POST',
    headers: { 'X-Api-Key': API_KEY },
    body: fd,
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { mensaje?: string; error?: string };
      msg = body.mensaje ?? body.error ?? msg;
    } catch {
      /* sin JSON */
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { numero_ticket?: string };
  return data.numero_ticket ?? 'enviado';
}
