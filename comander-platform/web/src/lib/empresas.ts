import type { BusinessEventType, SyncFrequency } from '@/types';

export const MONEDAS = ['USD', 'COP', 'MXN', 'EUR', 'ARS', 'CLP', 'PEN', 'BRL'];

export const ZONAS = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Sao_Paulo',
  'Europe/Madrid',
  'UTC',
];

export const CATEGORIAS = [
  'General',
  'Retail',
  'Tecnología',
  'Servicios',
  'Manufactura',
  'Alimentos',
  'Salud',
  'Finanzas',
  'Logística',
  'Construcción',
];

/** Paleta de colores identificadores. */
export const PALETTE = [
  '#2D7EFF',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#14B8A6',
  '#0EA5E9',
  '#EC4899',
  '#6366F1',
];

export const SYNC_FREQUENCIES: { value: SyncFrequency; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'MIN_15', label: 'Cada 15 minutos' },
  { value: 'HORA_1', label: 'Cada hora' },
  { value: 'HORAS_6', label: 'Cada 6 horas' },
  { value: 'DIARIA', label: 'Diaria' },
];

export const SYNC_FREQUENCY_LABEL: Record<SyncFrequency, string> = {
  MANUAL: 'Manual',
  MIN_15: 'Cada 15 minutos',
  HORA_1: 'Cada hora',
  HORAS_6: 'Cada 6 horas',
  DIARIA: 'Diaria',
};

export const EVENT_META: Record<BusinessEventType, { label: string; tone: 'good' | 'bad' | 'neutral' }> = {
  CREADA: { label: 'Creada', tone: 'good' },
  EDITADA: { label: 'Editada', tone: 'neutral' },
  API_ACTUALIZADA: { label: 'API actualizada', tone: 'neutral' },
  SINCRONIZADA: { label: 'Sincronizada', tone: 'good' },
  OCULTADA: { label: 'Ocultada', tone: 'neutral' },
  VISIBLE: { label: 'Visible', tone: 'good' },
  DESACTIVADA: { label: 'Desactivada', tone: 'bad' },
  ACTIVADA: { label: 'Activada', tone: 'good' },
  DUPLICADA: { label: 'Duplicada', tone: 'good' },
  LOGO: { label: 'Logotipo', tone: 'neutral' },
};

/** Formatos de logo aceptados. */
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp';
export const LOGO_FORMATS = 'PNG · JPG · SVG · WEBP';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
