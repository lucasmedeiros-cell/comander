'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, Medal, TrendingDown, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RangeChips } from '@/components/dashboard/RangeChips';
import { HideBalancesToggle } from '@/components/dashboard/HideBalancesToggle';
import { DeltaBadge } from '@/components/dashboard/DeltaBadge';
import { TrendArea } from '@/components/charts/lazy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { Money } from '@/components/ui/money';
import { Badge } from '@/components/ui/badge';
import { DEMO_ALERTS } from '@/lib/mock-data';
import { useDataset } from '@/lib/data-provider';
import { aggregateSeries, computePerformance, rangeWindow } from '@/lib/metrics';
import type { RangeKey } from '@/types';
import { cn } from '@/lib/utils';

export default function RentabilidadPage() {
  const [range, setRange] = React.useState<RangeKey>('mes');
  const { businesses, transactions } = useDataset();

  const ranking = React.useMemo(() => {
    const curr = computePerformance(businesses, transactions, range);
    // Tendencia: comparar rentabilidad de la ventana actual vs la anterior.
    const w = rangeWindow(range);
    const span = w.end - w.start;
    return curr
      .map((p) => {
        const prevTx = transactions.filter(
          (t) => t.businessId === p.business.id
        );
        let prevIng = 0;
        let prevEgr = 0;
        for (const t of prevTx) {
          const ts = new Date(t.date).getTime();
          if (ts >= w.start - span && ts < w.start) {
            if (t.type === 'INCOME') prevIng += t.amount;
            else prevEgr += t.amount;
          }
        }
        const prevRent = prevIng - prevEgr;
        const trend = prevRent === 0 ? 0 : ((p.rentabilidad - prevRent) / Math.abs(prevRent)) * 100;
        return { ...p, trend };
      })
      .sort((a, b) => b.rentabilidad - a.rentabilidad);
  }, [businesses, transactions, range]);

  const evol = React.useMemo(() => aggregateSeries(transactions, 'month', 12), [transactions]);
  const totalRent = ranking.reduce((a, p) => a + p.rentabilidad, 0);
  const alertasRent = DEMO_ALERTS.filter((a) => a.type === 'INGRESOS_CAEN' || a.type === 'EGRESOS_SUBEN' || a.type === 'COMPORTAMIENTO_INUSUAL');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rentabilidad"
        subtitle="Rentabilidad = Ingresos − Costos. Ranking, evolución y tendencias por empresa."
      >
        <RangeChips value={range} onChange={setRange} />
        <HideBalancesToggle />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ranking */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ranking de empresas</CardTitle>
            <p className="text-xs text-muted-foreground">Rentabilidad total del periodo: <span className="font-semibold text-foreground"><Money value={totalRent} count /></span></p>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranking.map((p, i) => (
              <motion.div
                key={p.business.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ delay: Math.min(i, 8) * 0.05 }}
              >
                <Link
                  href={`/empresas/detalle?id=${p.business.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold',
                      i === 0 && 'bg-warning/15 text-warning',
                      i === 1 && 'bg-muted text-foreground',
                      i > 1 && 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    {i === 0 ? <Crown className="h-4 w-4" /> : i === 1 ? <Medal className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="h-9 w-1 rounded-full" style={{ background: p.business.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.business.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.business.sector} · margen {p.margen.toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', p.rentabilidad >= 0 ? 'text-success' : 'text-danger')}>
                      <Money value={p.rentabilidad} compact count />
                    </p>
                    <DeltaBadge value={p.trend} className="mt-0.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Alertas de rentabilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> Alertas de rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasRent.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      a.severity === 'CRITICAL' && 'bg-danger',
                      a.severity === 'WARNING' && 'bg-warning',
                      a.severity === 'INFO' && 'bg-brand'
                    )}
                  />
                  <p className="text-sm font-medium">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
              </div>
            ))}
            <Link href="/alertas" className="block pt-1 text-xs font-medium text-primary hover:underline">
              Ver todas las alertas →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Evolución histórica */}
      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolución histórica de la rentabilidad</CardTitle>
            <p className="text-xs text-muted-foreground">Consolidado mensual (últimos 12 meses)</p>
          </CardHeader>
          <CardContent>
            <TrendArea data={evol} height={300} series={['ingresos', 'egresos', 'rentabilidad']} />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
