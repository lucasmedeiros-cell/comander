// ───────── Modelo de dominio COMANDER (compartido con el backend) ─────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  nombre: string;
  avatar?: string;
  role: Role;
  activo?: boolean;
}

export type BusinessStatus = 'ACTIVE' | 'INACTIVE';
export type ApiStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

/** Tipo de negocio: determina los Indicadores Operativos que se muestran. */
export type BusinessType =
  | 'restaurante'
  | 'tienda'
  | 'farmacia'
  | 'logistica'
  | 'ferreteria'
  | 'servicios'
  | 'supermercado';

export interface Business {
  id: string;
  nombre: string;
  sector: string;
  color: string;
  status: BusinessStatus;
  apiStatus: ApiStatus;
  lastSync: string; // ISO
  metaMensual: number;
  /** Tipo de negocio (restaurante, tienda, farmacia…). Controla los indicadores. */
  tipo?: BusinessType;
  /** Logo opcional (dataURL u object URL) para mostrar en la tarjeta. */
  logo?: string;
  /** Descripción opcional. */
  descripcion?: string;
  /** Moneda y zona horaria opcionales (para empresas creadas localmente). */
  moneda?: string;
  zonaHoraria?: string;
  /** Categoría de negocio (Retail, Tecnología, …). */
  categoria?: string;
}

/** Frecuencia de sincronización configurable por empresa. */
export type SyncFrequency = 'MANUAL' | 'MIN_15' | 'HORA_1' | 'HORAS_6' | 'DIARIA';

/** Credenciales y parámetros de conexión por empresa (se persisten localmente). */
export interface BusinessApiConfig {
  apiUrl?: string;
  apiKey?: string;
  token?: string;
  usuario?: string;
  password?: string;
  webhooks?: string;
  syncFrequency?: SyncFrequency;
}

/** Tipos de evento del historial de una empresa. */
export type BusinessEventType =
  | 'CREADA'
  | 'EDITADA'
  | 'API_ACTUALIZADA'
  | 'SINCRONIZADA'
  | 'OCULTADA'
  | 'VISIBLE'
  | 'DESACTIVADA'
  | 'ACTIVADA'
  | 'DUPLICADA'
  | 'LOGO';

export interface BusinessEvent {
  id: string;
  type: BusinessEventType;
  detail: string;
  at: string; // ISO
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO
}

export type IntegrationType =
  | 'STRIPE'
  | 'SHOPIFY'
  | 'QUICKBOOKS'
  | 'GOOGLE_ANALYTICS'
  | 'CUSTOM_WEBHOOK';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface Integration {
  id: string;
  businessId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  token: string;
  lastSync?: string;
}

export type AlertType =
  | 'INGRESOS_CAEN'
  | 'EGRESOS_SUBEN'
  | 'EMPRESA_DESCONECTADA'
  | 'API_ERROR'
  | 'COMPORTAMIENTO_INUSUAL';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  businessId?: string;
  read: boolean;
  createdAt: string;
}

// Rangos rápidos del dashboard (chips modernos): Hoy · Ayer · Semana · Mes · Año
export type RangeKey = 'hoy' | 'ayer' | 'semana' | 'mes' | 'anio';

export interface RangeOption {
  key: RangeKey;
  label: string;
}

export interface Overview {
  range: RangeKey;
  ingresosTotales: number;
  egresosTotales: number;
  utilidad: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  empresasActivas: number;
  apisConectadas: number;
  mejorEmpresa: { nombre: string; rentabilidad: number } | null;
  peorEmpresa: { nombre: string; rentabilidad: number } | null;
  deltas: { ingresosPct: number; egresosPct: number; utilidadPct: number };
}

export interface SeriesPoint {
  date: string;
  label: string;
  ingresos: number;
  egresos: number;
  rentabilidad: number;
}

export interface BusinessPerformance {
  business: Business;
  ingresos: number;
  egresos: number;
  rentabilidad: number;
  margen: number;
  cumplimientoMeta: number;
}
