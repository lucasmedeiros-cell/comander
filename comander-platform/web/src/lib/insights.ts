import type { Overview, RangeKey } from '@/types';

const COMPARATIVO: Record<RangeKey, string> = {
  hoy: 'respecto a ayer',
  ayer: 'respecto al día anterior',
  semana: 'respecto a la semana anterior',
  mes: 'respecto al mes anterior',
  anio: 'respecto al año anterior',
};

export interface Insight {
  tone: 'good' | 'bad' | 'neutral';
  text: string;
}

/** Genera frases simples para usuarios no técnicos (Resumen rápido). */
export function buildInsights(o: Overview): Insight[] {
  const comp = COMPARATIVO[o.range];
  const out: Insight[] = [];

  const ing = o.deltas.ingresosPct;
  out.push({
    tone: ing >= 0 ? 'good' : 'bad',
    text:
      Math.abs(ing) < 0.5
        ? `Las ventas se mantienen estables ${comp}.`
        : `Las ventas ${ing >= 0 ? 'aumentaron' : 'disminuyeron'} un ${Math.abs(ing).toFixed(0)}% ${comp}.`,
  });

  const egr = o.deltas.egresosPct;
  out.push({
    tone: egr <= 0 ? 'good' : 'bad',
    text:
      Math.abs(egr) < 0.5
        ? `Las compras se mantienen estables ${comp}.`
        : `Las compras ${egr >= 0 ? 'aumentaron' : 'disminuyeron'} un ${Math.abs(egr).toFixed(0)}% ${comp}.`,
  });

  if (o.mejorEmpresa) {
    out.push({
      tone: 'good',
      text: `${o.mejorEmpresa.nombre} es tu empresa con mejor rendimiento en este periodo.`,
    });
  }

  const util = o.deltas.utilidadPct;
  out.push({
    tone: util >= 0 ? 'good' : 'bad',
    text:
      o.utilidad >= 0
        ? `Tu utilidad estimada es positiva y ${util >= 0 ? 'creció' : 'bajó'} un ${Math.abs(util).toFixed(0)}% ${comp}.`
        : `Atención: la utilidad es negativa en este periodo. Revisa tus compras.`,
  });

  return out;
}
