'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { useInViewOnce, useMotionEnabled } from '@/lib/use-in-view';
import { computePerformance } from '@/lib/metrics';
import type { Business, RangeKey, Transaction } from '@/types';

/**
 * Ranking de Empresas: qué empresas generan más ingresos en el periodo.
 * Barras horizontales (máx 5), ordenadas de mayor a menor. Las barras crecen
 * desde 0 al entrar al viewport. Diseño simple, legible en segundos.
 */
export function CompanyRanking({
  businesses,
  transactions,
  range,
}: {
  businesses: Business[];
  transactions: Transaction[];
  range: RangeKey;
}) {
  const motionOn = useMotionEnabled();
  const [ref, inView] = useInViewOnce<HTMLDivElement>(undefined, 0.12);

  const rows = React.useMemo(
    () =>
      computePerformance(businesses, transactions, range)
        .map((p) => ({ id: p.business.id, name: p.business.nombre, color: p.business.color, value: p.ingresos }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    [businesses, transactions, range]
  );

  const max = Math.max(...rows.map((r) => r.value), 1);
  const ready = !motionOn || inView;

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-sm font-bold tracking-tight">Ranking de Empresas</h2>
      </div>
      <Card className="p-5">
        <div ref={ref} className="space-y-4">
          {rows.map((r, i) => (
            <div key={r.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{r.name}</span>
                <span className="shrink-0 font-bold tabular-nums">
                  <Money value={r.value} compact />
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: ready ? `${(r.value / max) * 100}%` : 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: motionOn ? i * 0.06 : 0 }}
                  className="h-full rounded-full"
                  style={{ background: r.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
