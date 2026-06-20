'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { MiniBars } from './MiniBars';
import { aggregateSeries, computePerformance } from '@/lib/metrics';
import { getOperational, toUnits } from '@/lib/operational';
import { number } from '@/lib/format';
import type { Business, RangeKey, Transaction } from '@/types';

/**
 * Indicadores Operativos de la empresa seleccionada. Los widgets cambian
 * automáticamente según el tipo de negocio (restaurante, tienda, farmacia…),
 * con jerarquía Ícono → Número → Descripción y una gráfica diaria simple.
 */
export function OperationalIndicators({
  business,
  transactions,
  range,
}: {
  business: Business | null;
  transactions: Transaction[];
  range: RangeKey;
}) {
  const { indicators, main, daily } = React.useMemo(() => {
    if (!business) return { indicators: [], main: null, daily: [] as { label: string; value: number }[] };
    const perf = computePerformance([business], transactions, range)[0];
    const ventas = perf?.ingresos ?? 0;
    const op = getOperational(business.tipo, ventas);
    const tx = transactions.filter((t) => t.businessId === business.id && t.type === 'INCOME');
    const series = aggregateSeries(tx, 'day', 7);
    const daily = series.map((s) => ({ label: s.label, value: toUnits(s.ingresos, op.main.unit) }));
    return { indicators: op.indicators, main: op.main, daily };
  }, [business, transactions, range]);

  if (!business || !main) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full" style={{ background: business.color }} />
        <h2 className="text-sm font-bold tracking-tight">Indicadores del Negocio</h2>
      </div>

      {/* Indicadores (Ícono → Número → Descripción) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {indicators.map((ind, i) => (
          <motion.div
            key={`${business.id}-${ind.label}`}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="h-full p-4 sm:p-5">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                style={{ background: `${ind.accent}1f` }}
              >
                {ind.emoji}
              </span>
              <p className="fluid-amount-sm mt-3 truncate font-extrabold tracking-tight tabular-nums text-foreground">
                <AnimatedNumber value={ind.value} format={(n) => number(n)} />
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {ind.label}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfica diaria simple */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg">{main.emoji}</span>
          <div>
            <p className="text-sm font-semibold tracking-tight">{main.label}</p>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </div>
        </div>
        <MiniBars data={daily} accent={business.color} />
      </Card>
    </div>
  );
}
