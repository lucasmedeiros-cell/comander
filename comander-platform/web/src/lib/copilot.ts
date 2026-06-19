// ───────────────────────── Copiloto IA — motor local ─────────────────────────
// Motor conversacional 100% local (sin LLM ni red). Interpreta preguntas en
// lenguaje natural sobre Ventas, Compras, Ganancia, Empresas, Alertas y
// Tendencias, y responde con datos reales calculados sobre el dataset activo
// (demo o API). También produce el "Modo Consejero": recomendaciones
// automáticas accionables a partir de las métricas.

import type { Alert, Business, RangeKey, Transaction } from '@/types';
import { computeOverview, computePerformance, aggregateSeries } from '@/lib/metrics';
import { money, number as fmtNumber, percent } from '@/lib/format';

export type Sender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  /** Viñetas opcionales para enumerar datos. */
  bullets?: string[];
  /** Tono para colorear el acento de la burbuja. */
  tone?: 'good' | 'bad' | 'neutral';
}

export interface CopilotContext {
  businesses: Business[];
  transactions: Transaction[];
  alerts: Alert[];
}

export interface CopilotAnswer {
  text: string;
  bullets?: string[];
  tone?: 'good' | 'bad' | 'neutral';
}

// Preguntas sugeridas (chips) que el usuario puede tocar para empezar.
export const SUGGESTED_QUESTIONS: string[] = [
  '¿Cómo van las ventas este mes?',
  '¿Cuánto gasté en compras?',
  '¿Cuál es mi empresa más rentable?',
  '¿Tengo ganancia o pérdida?',
  '¿Qué empresas están desconectadas?',
  '¿Hay alertas importantes?',
  '¿Cómo va la tendencia?',
];

// ───────────────────────── utilidades de lenguaje ─────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .trim();
}

const RANGE_WORDS: { keys: RangeKey; words: string[] }[] = [
  { keys: 'hoy', words: ['hoy', 'el dia de hoy'] },
  { keys: 'ayer', words: ['ayer'] },
  { keys: 'semana', words: ['semana', 'esta semana', 'ultimos 7', 'ultima semana'] },
  { keys: 'mes', words: ['mes', 'este mes', 'mensual'] },
  { keys: 'anio', words: ['ano', 'anio', 'este ano', 'anual', 'el ano'] },
];

const RANGE_LABEL: Record<RangeKey, string> = {
  hoy: 'hoy',
  ayer: 'ayer',
  semana: 'esta semana',
  mes: 'este mes',
  anio: 'este año',
};

/** Detecta el periodo mencionado en la pregunta (por defecto, el mes). */
function detectRange(q: string): RangeKey {
  for (const { keys, words } of RANGE_WORDS) {
    if (words.some((w) => q.includes(w))) return keys;
  }
  return 'mes';
}

function has(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

// ───────────────────────── motor de intención ─────────────────────────

/**
 * Responde una pregunta del usuario consultando el dataset. Determinista: la
 * misma pregunta sobre los mismos datos da siempre la misma respuesta.
 */
export function answerQuestion(raw: string, ctx: CopilotContext): CopilotAnswer {
  const q = normalize(raw);
  const { businesses, transactions, alerts } = ctx;

  if (!q) {
    return { text: 'Escríbeme una pregunta sobre tus ventas, compras, ganancia, empresas o alertas.' };
  }

  // Saludo / ayuda.
  if (has(q, 'hola', 'buenas', 'que puedes hacer', 'ayuda', 'que sabes', 'quien eres')) {
    return {
      text: 'Soy tu Copiloto. Analizo los datos consolidados de tus empresas y te respondo en lenguaje simple. Puedes preguntarme cosas como:',
      bullets: SUGGESTED_QUESTIONS,
    };
  }

  const range = detectRange(q);
  const overview = computeOverview(businesses, transactions, range);
  const perf = computePerformance(businesses, transactions, range);
  const label = RANGE_LABEL[range];

  // ── Empresas desconectadas / con problemas ──
  if (has(q, 'desconect', 'desconex', 'caida', 'error', 'sin conexion', 'offline', 'conexion', 'conectada')) {
    const problem = businesses.filter((b) => b.apiStatus !== 'CONNECTED');
    if (problem.length === 0) {
      return {
        text: `Todas tus empresas (${businesses.length}) están conectadas y sincronizando correctamente. 🟢`,
        tone: 'good',
      };
    }
    return {
      text: `Hay ${problem.length} empresa(s) que requieren atención:`,
      bullets: problem.map(
        (b) => `${b.nombre} — ${b.apiStatus === 'ERROR' ? '🔴 Error de conexión' : '🟡 Desconectada'}`
      ),
      tone: 'bad',
    };
  }

  // ── Alertas ──
  if (has(q, 'alerta', 'aviso', 'notificacion', 'importante', 'urgente')) {
    const unread = alerts.filter((a) => !a.read);
    const critical = alerts.filter((a) => a.severity === 'CRITICAL');
    if (alerts.length === 0) {
      return { text: 'No tienes alertas registradas en este momento. Todo en orden. 🟢', tone: 'good' };
    }
    return {
      text: `Tienes ${alerts.length} alerta(s), ${unread.length} sin leer y ${critical.length} crítica(s):`,
      bullets: alerts.slice(0, 5).map((a) => `${sevEmoji(a.severity)} ${a.title}`),
      tone: critical.length > 0 ? 'bad' : 'neutral',
    };
  }

  // ── Empresa más / menos rentable ──
  if (has(q, 'mejor', 'mas rentable', 'top', 'lider') && has(q, 'empresa', 'negocio', 'rentable', 'mejor')) {
    const best = overview.mejorEmpresa;
    if (!best) return { text: 'Aún no tengo datos suficientes para rankear tus empresas en este periodo.' };
    return {
      text: `Tu empresa más rentable ${label} es ${best.nombre}, con ${money(best.rentabilidad, { compact: true })} de rentabilidad.`,
      tone: 'good',
    };
  }
  if (has(q, 'peor', 'menos rentable', 'mas baja', 'perdida') && has(q, 'empresa', 'negocio')) {
    const worst = overview.peorEmpresa;
    if (!worst) return { text: 'Aún no tengo datos suficientes para rankear tus empresas en este periodo.' };
    return {
      text: `La empresa con menor rendimiento ${label} es ${worst.nombre}, con ${money(worst.rentabilidad, { compact: true })} de rentabilidad.`,
      tone: worst.rentabilidad < 0 ? 'bad' : 'neutral',
    };
  }

  // ── Empresas (listado / cuántas) ──
  if (has(q, 'cuantas empresas', 'que empresas', 'mis empresas', 'lista de empresas', 'empresas tengo')) {
    return {
      text: `Gestionas ${businesses.length} empresa(s), ${overview.empresasActivas} activas y ${overview.apisConectadas} con API conectada:`,
      bullets: perf
        .slice()
        .sort((a, b) => b.ingresos - a.ingresos)
        .map((p) => `${p.business.nombre} — ${money(p.ingresos, { compact: true })} en ventas`),
    };
  }

  // ── Ganancia / Pérdida ──
  if (has(q, 'ganancia', 'perdida', 'utilidad', 'rentabilidad', 'gano', 'gane', 'beneficio', 'margen')) {
    const u = overview.utilidad;
    const positiva = u >= 0;
    const margen = overview.ingresosTotales > 0 ? (u / overview.ingresosTotales) * 100 : 0;
    return {
      text: `${label[0].toUpperCase() + label.slice(1)} tu resultado es ${positiva ? 'positivo' : 'negativo'}: ${money(u)} (${positiva ? 'ganancia' : 'pérdida'}), con un margen del ${margen.toFixed(0)}%.`,
      bullets: [
        `Ventas: ${money(overview.ingresosTotales)}`,
        `Compras: ${money(overview.egresosTotales)}`,
        `Resultado: ${money(u)} (${percent(overview.deltas.utilidadPct)} vs periodo anterior)`,
      ],
      tone: positiva ? 'good' : 'bad',
    };
  }

  // ── Compras / Egresos ──
  if (has(q, 'compra', 'gasto', 'egreso', 'gaste', 'proveedor')) {
    const d = overview.deltas.egresosPct;
    return {
      text: `${label[0].toUpperCase() + label.slice(1)} llevas ${money(overview.egresosTotales)} en compras (${overview.cantidadEgresos} registros), ${trendWord(d, true)} ${percent(d)} respecto al periodo anterior.`,
      tone: d <= 0 ? 'good' : 'neutral',
    };
  }

  // ── Ventas / Ingresos ──
  if (has(q, 'venta', 'ingreso', 'vendi', 'facturacion', 'factura', 'cuanto vend')) {
    const d = overview.deltas.ingresosPct;
    return {
      text: `${label[0].toUpperCase() + label.slice(1)} llevas ${money(overview.ingresosTotales)} en ventas (${overview.cantidadIngresos} registros), ${trendWord(d, false)} ${percent(d)} respecto al periodo anterior.`,
      bullets: overview.mejorEmpresa
        ? [`Tu mejor empresa es ${overview.mejorEmpresa.nombre}.`]
        : undefined,
      tone: d >= 0 ? 'good' : 'bad',
    };
  }

  // ── Tendencia / Evolución ──
  if (has(q, 'tendencia', 'evolucion', 'va creciendo', 'subiendo', 'bajando', 'proyeccion', 'como va')) {
    const series = aggregateSeries(transactions, 'day', 30);
    const dir = trendDirection(series.map((s) => s.rentabilidad));
    return {
      text: `En los últimos 30 días tu rentabilidad está ${dir.label}. ${dir.detail}`,
      bullets: [
        `Ventas ${label}: ${money(overview.ingresosTotales, { compact: true })} (${percent(overview.deltas.ingresosPct)})`,
        `Compras ${label}: ${money(overview.egresosTotales, { compact: true })} (${percent(overview.deltas.egresosPct)})`,
      ],
      tone: dir.tone,
    };
  }

  // ── Resumen general (fallback útil) ──
  return {
    text: `Esto es lo que veo ${label}:`,
    bullets: [
      `Ventas: ${money(overview.ingresosTotales)} (${percent(overview.deltas.ingresosPct)})`,
      `Compras: ${money(overview.egresosTotales)} (${percent(overview.deltas.egresosPct)})`,
      `${overview.utilidad >= 0 ? 'Ganancia' : 'Pérdida'}: ${money(overview.utilidad)}`,
      overview.mejorEmpresa ? `Mejor empresa: ${overview.mejorEmpresa.nombre}` : `Empresas activas: ${overview.empresasActivas}`,
    ],
    tone: overview.utilidad >= 0 ? 'good' : 'bad',
  };
}

function sevEmoji(s: Alert['severity']): string {
  return s === 'CRITICAL' ? '🔴' : s === 'WARNING' ? '🟡' : 'ℹ️';
}

function trendWord(deltaPct: number, isExpense: boolean): string {
  if (Math.abs(deltaPct) < 0.5) return 'estable';
  const up = deltaPct > 0;
  if (isExpense) return up ? 'subieron un' : 'bajaron un';
  return up ? 'subieron un' : 'bajaron un';
}

function trendDirection(values: number[]): { label: string; detail: string; tone: 'good' | 'bad' | 'neutral' } {
  if (values.length < 2) return { label: 'estable', detail: 'Aún no hay suficiente histórico.', tone: 'neutral' };
  const mid = Math.floor(values.length / 2);
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const before = avg(values.slice(0, mid));
  const after = avg(values.slice(mid));
  const change = before === 0 ? 0 : ((after - before) / Math.abs(before)) * 100;
  if (change > 4) return { label: 'al alza 📈', detail: `Mejoró cerca de ${fmtNumber(Math.abs(change))}% en la segunda mitad del periodo.`, tone: 'good' };
  if (change < -4) return { label: 'a la baja 📉', detail: `Cayó cerca de ${fmtNumber(Math.abs(change))}% en la segunda mitad del periodo.`, tone: 'bad' };
  return { label: 'estable ➡️', detail: 'Se mantiene sin cambios bruscos.', tone: 'neutral' };
}

// ───────────────────────── Modo Consejero ─────────────────────────

export type AdviceSeverity = 'alta' | 'media' | 'baja' | 'positiva';

export interface Advice {
  id: string;
  observation: string;
  suggestion: string;
  severity: AdviceSeverity;
  /** Ruta interna a la que enlaza la acción sugerida. */
  href: string;
  cta: string;
}

/**
 * Recomendaciones automáticas (Modo Consejero) derivadas de las métricas del
 * mes. Ordenadas por severidad (alta → positiva).
 */
export function buildAdvice(ctx: CopilotContext): Advice[] {
  const { businesses, transactions, alerts } = ctx;
  const overview = computeOverview(businesses, transactions, 'mes');
  const perf = computePerformance(businesses, transactions, 'mes');
  const out: Advice[] = [];

  if (overview.deltas.ingresosPct < -8) {
    out.push({
      id: 'adv-ventas-down',
      observation: `Las ventas bajaron ${percent(overview.deltas.ingresosPct)} respecto al periodo anterior.`,
      suggestion: 'Revisa tus campañas y reactiva las promociones de mayor impacto.',
      severity: 'alta',
      href: '/ingresos',
      cta: 'Ver ventas',
    });
  }

  if (overview.deltas.egresosPct > 15) {
    out.push({
      id: 'adv-compras-up',
      observation: `Las compras aumentaron ${percent(overview.deltas.egresosPct)}.`,
      suggestion: 'Verifica proveedores y renegocia condiciones de compra.',
      severity: 'media',
      href: '/egresos',
      cta: 'Ver compras',
    });
  }

  const losing = perf.find((p) => p.rentabilidad < 0);
  if (losing) {
    out.push({
      id: `adv-loss-${losing.business.id}`,
      observation: `${losing.business.nombre} está operando con pérdidas.`,
      suggestion: 'Revisa su estructura de costos y pausa gastos no esenciales.',
      severity: 'alta',
      href: `/empresas/${losing.business.id}`,
      cta: 'Ver empresa',
    });
  }

  const offline = businesses.find((b) => b.apiStatus !== 'CONNECTED');
  if (offline) {
    out.push({
      id: `adv-conn-${offline.id}`,
      observation: `${offline.nombre} perdió la conexión con su integración.`,
      suggestion: 'Revisa la integración y vuelve a sincronizar los datos.',
      severity: 'alta',
      href: '/integraciones',
      cta: 'Ver integraciones',
    });
  }

  const margin = overview.ingresosTotales > 0 ? overview.utilidad / overview.ingresosTotales : 0;
  if (overview.utilidad >= 0 && margin < 0.08) {
    out.push({
      id: 'adv-margin-thin',
      observation: `El margen general es bajo (${(margin * 100).toFixed(0)}%).`,
      suggestion: 'Prioriza las empresas más rentables y ajusta precios.',
      severity: 'media',
      href: '/rentabilidad',
      cta: 'Ver rentabilidad',
    });
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && !a.read);
  if (criticalAlerts.length > 0) {
    out.push({
      id: 'adv-alerts',
      observation: `Tienes ${criticalAlerts.length} alerta(s) crítica(s) sin atender.`,
      suggestion: 'Revísalas para evitar impactos en la operación.',
      severity: 'alta',
      href: '/alertas',
      cta: 'Ver alertas',
    });
  }

  const best = overview.mejorEmpresa;
  if (best && overview.ingresosTotales > 0) {
    out.push({
      id: 'adv-best',
      observation: `${best.nombre} es tu empresa con mejor rendimiento este mes.`,
      suggestion: 'Replica sus buenas prácticas comerciales en las demás.',
      severity: 'positiva',
      href: '/rentabilidad',
      cta: 'Ver ranking',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'adv-stable',
      observation: 'Tus métricas están estables y sin alertas críticas.',
      suggestion: 'Mantén el monitoreo y programa un reporte semanal.',
      severity: 'baja',
      href: '/analitica',
      cta: 'Ver analítica',
    });
  }

  const order: Record<AdviceSeverity, number> = { alta: 0, media: 1, baja: 2, positiva: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
