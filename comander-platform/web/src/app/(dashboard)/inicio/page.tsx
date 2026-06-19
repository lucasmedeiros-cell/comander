'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Eye,
  FileDown,
  GitCompare,
  LineChart,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  Truck,
  Trophy,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { RangeChips } from '@/components/dashboard/RangeChips';
import { HideBalancesToggle } from '@/components/dashboard/HideBalancesToggle';
import { Money } from '@/components/ui/money';
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard/KpiCard';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/MetricCard';
import { CompanyCarousel } from '@/components/dashboard/CompanyCarousel';
import { TrendArea, DonutShare } from '@/components/charts/lazy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { InfoHint } from '@/components/ui/info-hint';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataset } from '@/lib/data-provider';
import { useMounted } from '@/lib/use-mounted';
import { useVisibleBusinesses } from '@/lib/business-store';
import { aggregateSeries, computeOverview, computePerformance } from '@/lib/metrics';
import { buildInsights } from '@/lib/insights';
import { downloadCsv } from '@/lib/export';
import { money, number } from '@/lib/format';
import type { RangeKey, SeriesPoint } from '@/types';
import { cn } from '@/lib/utils';

const moneyCompact = (n: number) => money(n, { compact: true });
const numberPlain = (n: number) => number(n);

export default function InicioPage() {
  const [range, setRange] = React.useState<RangeKey>('mes');
  const { businesses: baseBusinesses, transactions: allTransactions } = useDataset();
  // El Inicio refleja solo las empresas visibles (las ocultas siguen
  // sincronizando, pero no aparecen aquí), en el orden personalizado.
  const businesses = useVisibleBusinesses(baseBusinesses);
  const visibleIds = React.useMemo(() => new Set(businesses.map((b) => b.id)), [businesses]);
  const transactions = React.useMemo(
    () => allTransactions.filter((t) => visibleIds.has(t.businessId)),
    [allTransactions, visibleIds]
  );

  // Esqueletos solo hasta montar en cliente (evita pantalla en blanco e
  // hidratación inconsistente). NO usa un temporizador artificial que pudiera
  // dejar el Inicio "cargando" indefinidamente.
  const loading = !useMounted();

  const overview = React.useMemo(
    () => computeOverview(businesses, transactions, range),
    [businesses, transactions, range]
  );
  const series = React.useMemo(() => aggregateSeries(transactions, 'day', 30), [transactions]);
  const perf = React.useMemo(
    () => computePerformance(businesses, transactions, range),
    [businesses, transactions, range]
  );
  const insights = React.useMemo(() => buildInsights(overview), [overview]);

  const donut = React.useMemo(
    () =>
      perf
        .filter((p) => p.ingresos > 0)
        .map((p) => ({ label: p.business.nombre, value: p.ingresos, color: p.business.color })),
    [perf]
  );

  // Exporta a CSV la evolución de la métrica seleccionada (acción de tarjeta).
  const exportSeries = React.useCallback(
    (key: 'ingresos' | 'egresos' | 'rentabilidad', name: string) => {
      downloadCsv(
        `comander-${name.toLowerCase()}`,
        ['Fecha', name],
        series.map((s: SeriesPoint) => [s.label, s[key]])
      );
    },
    [series]
  );

  const gananciaPositiva = overview.utilidad >= 0;

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title="Resumen ejecutivo"
        subtitle="Estado general consolidado de todas las empresas conectadas."
      >
        <RangeChips value={range} onChange={setRange} />
        <HideBalancesToggle />
      </PageHeader>

      {/* ── TARJETAS PRINCIPALES: Ventas · Compras · Ganancia/Pérdida ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              index={0}
              name="Ventas"
              value={overview.ingresosTotales}
              format={moneyCompact}
              icon={ShoppingCart}
              delta={overview.deltas.ingresosPct}
              accent="#2D7EFF"
              actions={[
                { label: 'Ver detalle', icon: Eye, href: '/ingresos' },
                { label: 'Ver evolución', icon: LineChart, href: '/analitica' },
                { label: 'Exportar', icon: FileDown, onClick: () => exportSeries('ingresos', 'Ventas') },
              ]}
            />
            <MetricCard
              index={1}
              name="Compras"
              value={overview.egresosTotales}
              format={moneyCompact}
              icon={ShoppingBag}
              delta={overview.deltas.egresosPct}
              positiveIsGood={false}
              accent="#F59E0B"
              actions={[
                { label: 'Ver detalle', icon: Eye, href: '/egresos' },
                { label: 'Proveedores', icon: Truck, href: '/integraciones' },
                { label: 'Exportar', icon: FileDown, onClick: () => exportSeries('egresos', 'Compras') },
              ]}
            />
            <MetricCard
              index={2}
              name={gananciaPositiva ? 'Ganancia' : 'Pérdida'}
              value={overview.utilidad}
              format={moneyCompact}
              icon={Wallet}
              delta={overview.deltas.utilidadPct}
              accent="#10B981"
              actions={[
                { label: 'Ver análisis', icon: BarChart3, href: '/rentabilidad' },
                { label: 'Comparar periodos', icon: GitCompare, href: '/analitica' },
                { label: 'Exportar', icon: FileDown, onClick: () => exportSeries('rentabilidad', 'Ganancia') },
              ]}
            />
          </>
        )}
      </div>

      {/* Secundarios: conteos + estado de empresas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard index={0} href="/ingresos" label="Ventas registradas" value={number(overview.cantidadIngresos)} rawValue={overview.cantidadIngresos} format={numberPlain} icon={ShoppingCart} accent="#2D7EFF" />
            <KpiCard index={1} href="/egresos" label="Compras registradas" value={number(overview.cantidadEgresos)} rawValue={overview.cantidadEgresos} format={numberPlain} icon={ShoppingBag} accent="#F97316" />
            <KpiCard index={2} href="/empresas" label="Empresas activas" value={`${overview.empresasActivas} / ${businesses.length}`} icon={Building2} hint={`${overview.apisConectadas} APIs conectadas`} accent="#8B5CF6" />
          </>
        )}
      </div>

      {/* ── CARRUSEL DE EMPRESAS ── */}
      {!loading && (
        <Reveal className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight">Empresas conectadas</h3>
              <p className="text-xs text-muted-foreground">Desliza para ver el estado de cada negocio</p>
            </div>
            <Link href="/empresas" className="text-xs font-medium text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <CompanyCarousel
            items={perf.map((p) => ({ business: p.business, ventas: p.ingresos, ganancia: p.rentabilidad }))}
          />
        </Reveal>
      )}

      {/* Mejor / menor rendimiento */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Reveal delay={0}>
            <BestWorstCard tone="best" overview={overview} />
          </Reveal>
          <Reveal delay={0.08}>
            <BestWorstCard tone="worst" overview={overview} />
          </Reveal>
        </div>
      )}

      {/* Gráfico principal + resumen rápido (Recomendaciones IA) */}
      <Reveal className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                Ventas vs Compras
                <InfoHint text="Evolución diaria consolidada de todas tus empresas en los últimos 30 días." />
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Últimos 30 días · consolidado</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" /> Ventas</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Compras</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : <TrendArea data={series} height={300} />}
          </CardContent>
        </Card>

        {/* Resumen rápido en lenguaje simple */}
        <Card className="bg-gradient-to-br from-card to-brand/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Resumen rápido
              <InfoHint text="Interpretación automática de tus métricas, en lenguaje simple." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3"
              >
                <span
                  className={cn(
                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                    ins.tone === 'good' && 'bg-success/15 text-success',
                    ins.tone === 'bad' && 'bg-danger/15 text-danger',
                    ins.tone === 'neutral' && 'bg-muted text-muted-foreground'
                  )}
                >
                  <ArrowUpRight className={cn('h-3.5 w-3.5', ins.tone === 'bad' && 'rotate-90')} />
                </span>
                <p className="text-sm leading-snug text-foreground/90">{ins.text}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </Reveal>

      {/* Distribución + ranking rápido */}
      <Reveal className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de ventas</CardTitle>
            <p className="text-xs text-muted-foreground">Participación de cada empresa</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[240px] w-full" /> : <DonutShare data={donut} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Rendimiento por empresa</CardTitle>
            <Link href="/rentabilidad" className="text-xs font-medium text-primary hover:underline">
              Ver ranking completo →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...perf]
              .sort((a, b) => b.rentabilidad - a.rentabilidad)
              .map((p) => {
                const max = Math.max(...perf.map((x) => Math.abs(x.rentabilidad)), 1);
                return (
                  <Link
                    key={p.business.id}
                    href={`/empresas/${p.business.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent"
                  >
                    <span className="h-8 w-1 rounded-full" style={{ background: p.business.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium">{p.business.nombre}</p>
                        <span className={cn('text-sm font-semibold', p.rentabilidad >= 0 ? 'text-success' : 'text-danger')}>
                          <Money value={p.rentabilidad} compact />
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(Math.abs(p.rentabilidad) / max) * 100}%`, background: p.business.color }}
                        />
                      </div>
                    </div>
                    <Badge variant="muted" className="hidden sm:flex">{p.margen.toFixed(0)}% margen</Badge>
                  </Link>
                );
              })}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

function BestWorstCard({ tone, overview }: { tone: 'best' | 'worst'; overview: ReturnType<typeof computeOverview> }) {
  const data = tone === 'best' ? overview.mejorEmpresa : overview.peorEmpresa;
  const isBest = tone === 'best';
  return (
    <div className="group h-full">
      <Link href="/rentabilidad" className="block h-full">
        <Card className={cn('relative h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg', isBest ? 'border-success/30 bg-success/5 hover:border-success/50' : 'border-danger/20 bg-danger/5 hover:border-danger/40')}>
          <div className="flex items-center gap-2">
            <span className={cn('grid h-8 w-8 place-items-center rounded-lg', isBest ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}>
              {isBest ? <Trophy className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </span>
            <p className="text-xs font-medium text-muted-foreground">
              {isBest ? 'Mejor rendimiento' : 'Menor rendimiento'}
            </p>
          </div>
          <p className="mt-3 truncate text-lg font-bold">{data?.nombre ?? '—'}</p>
          <p className={cn('text-sm font-medium', isBest ? 'text-success' : 'text-danger')}>
            {data ? <Money value={data.rentabilidad} compact /> : '—'} de rentabilidad
          </p>
          <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        </Card>
      </Link>
    </div>
  );
}
