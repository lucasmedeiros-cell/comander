import type { BusinessType } from '@/types';

// ───────────────────────────────────────────────────────────────────────────
// Indicadores Operativos por TIPO de negocio.
//
// Commander no tiene un backend operativo (platos, recetas, entregas…), así que
// estos indicadores se DERIVAN de forma determinista de las ventas del periodo
// (monto de ingresos) usando un precio unitario promedio por tipo de negocio.
// Así cada empresa muestra cifras coherentes que cambian con la empresa y el
// periodo seleccionados, manteniendo la arquitectura lista para conectar datos
// reales más adelante (basta reemplazar `getOperational`).
// ───────────────────────────────────────────────────────────────────────────

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'tienda', label: 'Tienda' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'ferreteria', label: 'Ferretería' },
  { value: 'logistica', label: 'Logística' },
  { value: 'servicios', label: 'Servicios' },
];

export interface OperationalIndicator {
  emoji: string;
  label: string;
  value: number;
  accent: string;
}

interface Derived {
  units: number;
  tickets: number;
  clientes: number;
}

interface TypeConf {
  unit: number; // precio promedio por unidad vendida
  itemsPerTicket: number;
  mainEmoji: string;
  mainLabel: string; // métrica de la gráfica diaria
  build: (d: Derived) => OperationalIndicator[];
}

const ACCENTS = ['#2D7EFF', '#F59E0B', '#10B981', '#8B5CF6'];
const r = (n: number) => Math.max(0, Math.round(n));
function ind(emoji: string, label: string, value: number, i: number): OperationalIndicator {
  return { emoji, label, value: r(value), accent: ACCENTS[i % ACCENTS.length] };
}

const TYPE_CONF: Record<BusinessType, TypeConf> = {
  restaurante: {
    unit: 45,
    itemsPerTicket: 3,
    mainEmoji: '🍽️',
    mainLabel: 'Platos vendidos',
    build: ({ units, tickets, clientes }) => [
      ind('🍽️', 'Platos vendidos', units, 0),
      ind('🥤', 'Bebidas vendidas', units * 0.6, 1),
      ind('🧾', 'Tickets emitidos', tickets, 2),
      ind('👥', 'Clientes atendidos', clientes, 3),
    ],
  },
  tienda: {
    unit: 80,
    itemsPerTicket: 2,
    mainEmoji: '🛒',
    mainLabel: 'Productos vendidos',
    build: ({ units, tickets, clientes }) => [
      ind('🛒', 'Productos vendidos', units, 0),
      ind('👥', 'Clientes atendidos', clientes, 1),
      ind('🧾', 'Tickets emitidos', tickets, 2),
      ind('📦', 'Reposiciones', units * 0.15, 3),
    ],
  },
  supermercado: {
    unit: 35,
    itemsPerTicket: 6,
    mainEmoji: '🛒',
    mainLabel: 'Productos vendidos',
    build: ({ units, tickets, clientes }) => [
      ind('🛒', 'Productos vendidos', units, 0),
      ind('👥', 'Clientes atendidos', clientes, 1),
      ind('🧾', 'Tickets emitidos', tickets, 2),
      ind('📦', 'Reposiciones', units * 0.2, 3),
    ],
  },
  farmacia: {
    unit: 60,
    itemsPerTicket: 2,
    mainEmoji: '💊',
    mainLabel: 'Medicamentos vendidos',
    build: ({ units, tickets, clientes }) => [
      ind('💊', 'Medicamentos vendidos', units, 0),
      ind('🧾', 'Recetas procesadas', tickets * 0.7, 1),
      ind('👥', 'Clientes atendidos', clientes, 2),
      ind('⚠️', 'Stock crítico', Math.min(12, units * 0.03), 3),
    ],
  },
  ferreteria: {
    unit: 120,
    itemsPerTicket: 2,
    mainEmoji: '🔩',
    mainLabel: 'Productos vendidos',
    build: ({ units, tickets, clientes }) => [
      ind('🔩', 'Productos vendidos', units, 0),
      ind('📦', 'Mov. inventario', units * 1.2, 1),
      ind('🧾', 'Facturas emitidas', tickets, 2),
      ind('👥', 'Clientes atendidos', clientes, 3),
    ],
  },
  logistica: {
    unit: 90,
    itemsPerTicket: 1,
    mainEmoji: '🚚',
    mainLabel: 'Entregas realizadas',
    build: ({ units, tickets }) => [
      ind('🚚', 'Entregas realizadas', units, 0),
      ind('📦', 'Paquetes entregados', units * 1.4, 1),
      ind('📍', 'Rutas completadas', tickets * 0.4 + 1, 2),
      ind('⏱️', 'Tiempo prom. (min)', 28 + (units % 15), 3),
    ],
  },
  servicios: {
    unit: 200,
    itemsPerTicket: 1,
    mainEmoji: '🧰',
    mainLabel: 'Servicios realizados',
    build: ({ units, tickets, clientes }) => [
      ind('🧰', 'Servicios realizados', units, 0),
      ind('👥', 'Clientes atendidos', clientes, 1),
      ind('🧾', 'Órdenes emitidas', tickets, 2),
      ind('⭐', 'Satisfacción %', Math.min(99, 90 + (units % 9)), 3),
    ],
  },
};

const DEFAULT_TYPE: BusinessType = 'tienda';

/** Indicadores + metadatos de la métrica principal para una empresa y sus ventas. */
export function getOperational(tipo: BusinessType | undefined, ventas: number) {
  const conf = TYPE_CONF[tipo ?? DEFAULT_TYPE] ?? TYPE_CONF[DEFAULT_TYPE];
  const units = ventas > 0 ? Math.round(ventas / conf.unit) : 0;
  const tickets = Math.round(units / conf.itemsPerTicket);
  const clientes = Math.round(tickets * 1.15);
  return {
    indicators: conf.build({ units, tickets, clientes }),
    main: { emoji: conf.mainEmoji, label: conf.mainLabel, unit: conf.unit },
  };
}

/** Convierte ingresos diarios (Bs) a unidades de la métrica principal. */
export function toUnits(dailyIncome: number, unit: number): number {
  return dailyIncome > 0 ? Math.round(dailyIncome / unit) : 0;
}
