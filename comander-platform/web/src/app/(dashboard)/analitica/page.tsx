'use client';

import * as React from 'react';
import { Activity, Gauge, Percent, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DeltaBadge } from '@/components/dashboard/DeltaBadge';
import { TrendArea, BarsByBusiness, DonutShare } from '@/components/charts/lazy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { Money } from '@/components/ui/money';
import { InfoHint } from '@/components/ui/info-hint';
import { useDataset } from '@/lib/data-provider';
import { aggregateSeries, computeOverview, computePerformance } from '@/lib/metrics';
import { money, percent } from '@/lib/format';
import { cn } from '@/lib/utils';

const CAT_COLORS = ['#2D7EFF', '#10B981', '#8B5CF6', '#F59E0B', '#F97316', '#EF4444', '#60A5FA'];

export default function AnaliticaPage() {
  const { businesses, transactions } = useDataset();

  const mes = React.useMemo(() => computeOverview(businesses, transactions, 'mes'), [businesses, transactions]);
  const monthly = React.useMemo(() => aggregateSeries(transactions, 'month', 6), [transactions]);
  const perf = React.useMemo(() => computePerformance(businesses, transactions, 'mes'), [businesses, transactions]);

  // Crecimiento intermensual de ingresos
  const growth = React.useMemo(() => {
    if (monthly.length < 2) return 0;
    const last = monthly[monthly.length - 1].ingresos;
    const prev = monthly[monthly.length - 2].ingresos;
    return prev === 0 ? 0 : ((last - prev) / prev) * 100;
  }, [monthly]);

  // Egresos por categoría (donut)
  const egresosByCat = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'EXPENSE').forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [transactions]);

  const margenPromedio = perf.reduce((a, p) => a + p.margen, 0) / (perf.length || 1);

  // Comparativo crecimiento por empresa (mes vs mes anterior)
  const variaciones = React.useMemo(
    () =>
      businesses.map((b) => {
        const tx = transactions.filter((t) => t.businessId === b.id);
        const curr = computeOverview([b], tx, 'mes');
        return { business: b, valor: curr.ingresosTotales, variacion: curr.deltas.ingresosPct };
      }),
    [businesses, transactions]
  );

  const ingresosBars = perf
    .map((p) => ({ label: p.business.nombre.split(' ')[0], value: p.ingresos, color: p.business.color }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <PageHeader title="Analítica avanzada" subtitle="Tendencias, crecimiento y variaciones para decidir con datos." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} href="/ingresos" label="Crecimiento mensual" value={percent(growth)} icon={TrendingUp} delta={growth} accent="#2D7EFF" hint="Ventas vs mes anterior" />
        <KpiCard index={1} href="/rentabilidad" label="Margen promedio" value={`${margenPromedio.toFixed(1)}%`} icon={Percent} accent="#10B981" />
        <KpiCard index={2} href="/rentabilidad" label="Utilidad del mes" value={money(mes.utilidad, { compact: true })} icon={Gauge} delta={mes.deltas.utilidadPct} accent="#8B5CF6" secret />
        <KpiCard index={3} href="/empresas" label="Actividad" value={String(mes.cantidadIngresos + mes.cantidadEgresos)} icon={Activity} accent="#F97316" hint="Movimientos este mes" />
      </div>

      <Reveal className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Tendencia de los últimos 6 meses
              <InfoHint text="Consolidado mensual de ingresos, egresos y rentabilidad." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendArea data={monthly} height={300} series={['ingresos', 'egresos', 'rentabilidad']} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compras por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutShare data={egresosByCat} height={220} />
          </CardContent>
        </Card>
      </Reveal>

      <Reveal className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Variación de ventas por empresa</CardTitle>
            <p className="text-xs text-muted-foreground">Comparado con el mes anterior</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {variaciones
              .sort((a, b) => b.variacion - a.variacion)
              .map((v) => (
                <div key={v.business.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="h-8 w-1 rounded-full" style={{ background: v.business.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.business.nombre}</p>
                    <p className="text-xs text-muted-foreground"><Money value={v.valor} compact /> este mes</p>
                  </div>
                  <DeltaBadge value={v.variacion} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsByBusiness data={ingresosBars} height={260} name="Ventas" />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
