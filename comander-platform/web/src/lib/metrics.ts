import type {
  Business,
  BusinessPerformance,
  Overview,
  RangeKey,
  RangeOption,
  SeriesPoint,
  Transaction,
} from '@/types';

export const RANGES: RangeOption[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
];

export type Granularity = 'day' | 'week' | 'month' | 'year';

interface Window {
  start: number;
  end: number;
  prevStart: number;
  prevEnd: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function rangeWindow(range: RangeKey, now = new Date()): Window {
  const today = startOfDay(now);
  const day = 86400000;
  switch (range) {
    case 'hoy': {
      const start = today.getTime();
      const end = start + day;
      return { start, end, prevStart: start - day, prevEnd: start };
    }
    case 'ayer': {
      const end = today.getTime();
      const start = end - day;
      return { start, end, prevStart: start - day, prevEnd: start };
    }
    case 'semana': {
      const end = today.getTime() + day;
      const start = end - 7 * day;
      return { start, end, prevStart: start - 7 * day, prevEnd: start };
    }
    case 'mes': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
      const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
      return { start, end, prevStart, prevEnd: start };
    }
    case 'anio': {
      const start = new Date(today.getFullYear(), 0, 1).getTime();
      const end = new Date(today.getFullYear() + 1, 0, 1).getTime();
      const prevStart = new Date(today.getFullYear() - 1, 0, 1).getTime();
      return { start, end, prevStart, prevEnd: start };
    }
  }
}

function sumWindow(transactions: Transaction[], start: number, end: number) {
  let ingresos = 0;
  let egresos = 0;
  let nIngresos = 0;
  let nEgresos = 0;
  for (const t of transactions) {
    const ts = new Date(t.date).getTime();
    if (ts < start || ts >= end) continue;
    if (t.type === 'INCOME') {
      ingresos += t.amount;
      nIngresos++;
    } else {
      egresos += t.amount;
      nEgresos++;
    }
  }
  return { ingresos, egresos, nIngresos, nEgresos };
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

export function computeOverview(
  businesses: Business[],
  transactions: Transaction[],
  range: RangeKey
): Overview {
  const w = rangeWindow(range);
  const curr = sumWindow(transactions, w.start, w.end);
  const prev = sumWindow(transactions, w.prevStart, w.prevEnd);

  // Rentabilidad por empresa en el rango.
  const perf = computePerformance(businesses, transactions, range);
  const ranked = [...perf].sort((a, b) => b.rentabilidad - a.rentabilidad);
  const mejor = ranked[0];
  const peor = ranked[ranked.length - 1];

  const utilidad = curr.ingresos - curr.egresos;
  const prevUtilidad = prev.ingresos - prev.egresos;

  return {
    range,
    ingresosTotales: curr.ingresos,
    egresosTotales: curr.egresos,
    utilidad,
    cantidadIngresos: curr.nIngresos,
    cantidadEgresos: curr.nEgresos,
    empresasActivas: businesses.filter((b) => b.status === 'ACTIVE').length,
    apisConectadas: businesses.filter((b) => b.apiStatus === 'CONNECTED').length,
    mejorEmpresa: mejor ? { nombre: mejor.business.nombre, rentabilidad: mejor.rentabilidad } : null,
    peorEmpresa: peor ? { nombre: peor.business.nombre, rentabilidad: peor.rentabilidad } : null,
    deltas: {
      ingresosPct: pct(curr.ingresos, prev.ingresos),
      egresosPct: pct(curr.egresos, prev.egresos),
      utilidadPct: pct(utilidad, prevUtilidad),
    },
  };
}

export function computePerformance(
  businesses: Business[],
  transactions: Transaction[],
  range: RangeKey
): BusinessPerformance[] {
  const w = rangeWindow(range);
  return businesses.map((b) => {
    const tx = transactions.filter((t) => t.businessId === b.id);
    const { ingresos, egresos } = sumWindow(tx, w.start, w.end);
    const rentabilidad = ingresos - egresos;
    const margen = ingresos > 0 ? (rentabilidad / ingresos) * 100 : 0;
    const cumplimientoMeta = b.metaMensual > 0 ? (ingresos / b.metaMensual) * 100 : 0;
    return { business: b, ingresos, egresos, rentabilidad, margen, cumplimientoMeta };
  });
}

// ───────── Series temporales para gráficos ─────────

function bucketKey(d: Date, g: Granularity): string {
  switch (g) {
    case 'day':
      return d.toISOString().slice(0, 10);
    case 'week': {
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
      return `${d.getFullYear()}-S${week}`;
    }
    case 'month':
      return d.toISOString().slice(0, 7);
    case 'year':
      return String(d.getFullYear());
  }
}

function bucketLabel(d: Date, g: Granularity): string {
  switch (g) {
    case 'day':
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    case 'week':
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    case 'month':
      return d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    case 'year':
      return String(d.getFullYear());
  }
}

/** Agrega ingresos/egresos por bucket, limitando a los últimos `count` periodos. */
export function aggregateSeries(
  transactions: Transaction[],
  g: Granularity,
  count: number
): SeriesPoint[] {
  const map = new Map<string, { date: Date; ingresos: number; egresos: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = bucketKey(d, g);
    let entry = map.get(key);
    if (!entry) {
      // normaliza fecha al inicio del bucket para ordenar
      entry = { date: d, ingresos: 0, egresos: 0 };
      map.set(key, entry);
    }
    if (t.type === 'INCOME') entry.ingresos += t.amount;
    else entry.egresos += t.amount;
  }
  const points = [...map.entries()]
    .map(([, v]) => ({
      date: v.date.toISOString(),
      label: bucketLabel(v.date, g),
      ingresos: Math.round(v.ingresos),
      egresos: Math.round(v.egresos),
      rentabilidad: Math.round(v.ingresos - v.egresos),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return points.slice(-count);
}
