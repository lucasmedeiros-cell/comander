'use client';

// ───────────────────────────────────────────────────────────────────────────
// Integración con el panel central de Tickets (tickets.petroboxinc.com).
// Implementa el botón "Reportar Bug" según INTEGRACION_BUGS.md.
//
// CONFIGURACIÓN (para dejarlo 100% funcional):
//   1) Crear el bot en la BD `tickets` (Bilbo):  comander-bot  → obtener su id.
//   2) Firmar un JWT 90d con ese id, rol `tecnico` (JWT_SECRET del backend).
//   3) Definir las variables de entorno (Netlify / .env.local):
//        NEXT_PUBLIC_TICKETS_BOT_TOKEN = <JWT del comander-bot>
//        NEXT_PUBLIC_TICKETS_BOT_ID    = <id del bot en BD>
//   4) Agregar el dominio de COMANDER a CORS_ORIGINS del backend de tickets.
// ───────────────────────────────────────────────────────────────────────────

const TICKETS_API = 'https://tickets.petroboxinc.com/api';
const BOT_TOKEN = process.env.NEXT_PUBLIC_TICKETS_BOT_TOKEN ?? '';
const USUARIO_ID = Number(process.env.NEXT_PUBLIC_TICKETS_BOT_ID ?? 0);

const APP_NAME = 'COMANDER';
const APP_VERSION = 'v1.0.0';
const ESTACION = 'COMANDER';

export type BugType = 'error' | 'optimizacion';

export interface TicketSummary {
  id: number;
  numero_ticket?: string;
  titulo?: string;
  estado?: string;
  prioridad?: string;
  fecha_creacion?: string;
  created_at?: string;
}

/** ¿Está configurado el token del bot? (si no, el reporte no puede enviarse). */
export function ticketsConfigured(): boolean {
  return Boolean(BOT_TOKEN) && USUARIO_ID > 0;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${BOT_TOKEN}`, ...(extra ?? {}) };
}

async function jsonPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${TICKETS_API}${path}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<T>;
}

async function addComment(ticketId: number, comentario: string): Promise<void> {
  await jsonPost(`/tickets/${ticketId}/comentarios`, {
    ticket_id: ticketId,
    usuario_id: USUARIO_ID,
    comentario,
  });
}

async function addImage(ticketId: number, file: File): Promise<void> {
  const fd = new FormData();
  fd.append('imagenes', file);
  fd.append('comentario', 'Captura adjunta');
  fd.append('usuario_id', String(USUARIO_ID));
  // No setear Content-Type: el navegador arma el boundary del multipart.
  const res = await fetch(`${TICKETS_API}/tickets/${ticketId}/comentarios-imagen`, {
    method: 'POST',
    headers: authHeaders(),
    body: fd,
  });
  if (!res.ok) throw new Error(`Error ${res.status} al adjuntar imagen`);
}

function buildLogs(opts: { email?: string; url: string; platform: string }): string {
  const fecha = new Date().toLocaleString('es-CO');
  return [
    '--- Logs del sistema ---',
    `App: ${APP_NAME} ${APP_VERSION}`,
    `Plataforma: ${opts.platform}`,
    `Usuario: ${opts.email ?? 'demo'}`,
    `URL actual: ${opts.url}`,
    `Fecha reporte: ${fecha}`,
  ].join('\n');
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
 * Flujo canónico (4 pasos): crear ticket → comentario descripción →
 * imagen (si hay) → comentario con logs de contexto.
 */
export async function reportBug(input: ReportBugInput): Promise<string> {
  if (!ticketsConfigured()) {
    throw new Error('Reporte de bugs no configurado (falta el token del bot).');
  }
  const etiqueta = input.tipo === 'error' ? 'ERROR' : 'OPTIMIZACIÓN';
  const titulo = `[${APP_NAME}][${etiqueta}] ${input.titulo.trim()}`;

  // 1) Crear ticket
  const ticket = await jsonPost<{ id: number; numero_ticket?: string }>('/tickets', {
    titulo,
    problema: titulo,
    estacion_servicio: ESTACION,
    prioridad: input.tipo === 'error' ? 'alta' : 'media',
    tecnico_asignado_id: USUARIO_ID,
    creado_por_id: USUARIO_ID,
  });

  // 2) Descripción del usuario
  if (input.descripcion.trim()) {
    await addComment(ticket.id, input.descripcion.trim());
  }

  // 3) Captura (opcional)
  if (input.file) {
    try {
      await addImage(ticket.id, input.file);
    } catch {
      /* la imagen es opcional: no abortar el reporte si falla */
    }
  }

  // 4) Logs de contexto
  const platform =
    typeof navigator !== 'undefined' ? `web · ${navigator.userAgent.slice(0, 80)}` : 'web';
  await addComment(ticket.id, buildLogs({ email: input.email, url: input.url, platform }));

  return ticket.numero_ticket ?? `#${ticket.id}`;
}

/** Lista los tickets reportados desde COMANDER (más recientes primero). */
export async function listMyTickets(): Promise<TicketSummary[]> {
  if (!ticketsConfigured()) throw new Error('No configurado');
  const res = await fetch(`${TICKETS_API}/tickets?estacion_servicio=${ESTACION}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = (await res.json()) as TicketSummary[];
  const list = Array.isArray(data) ? data : [];
  return list.sort((a, b) => {
    const fa = new Date(a.fecha_creacion ?? a.created_at ?? 0).getTime();
    const fb = new Date(b.fecha_creacion ?? b.created_at ?? 0).getTime();
    return fb - fa;
  });
}
