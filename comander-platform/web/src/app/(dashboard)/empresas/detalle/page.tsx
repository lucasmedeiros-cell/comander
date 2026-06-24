'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  EyeOff,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TrendArea } from '@/components/charts/lazy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmpresaActionsMenu } from '@/components/empresas/EmpresaActionsMenu';
import { Money } from '@/components/ui/money';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DEMO_ALERTS, DEMO_INTEGRATIONS } from '@/lib/mock-data';
import { useDataset } from '@/lib/data-provider';
import { useBusinessStore, useResolvedBusinesses } from '@/lib/business-store';
import { aggregateSeries, computePerformance } from '@/lib/metrics';
import { API_STATUS, INTEGRATION_LABEL } from '@/lib/labels';
import { SYNC_FREQUENCY_LABEL } from '@/lib/empresas';
import { fechaHora, haceCuanto, iniciales, number } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Detalle de empresa por QUERY PARAM (`/empresas/detalle?id=…`).
 *
 * Se usa query param en vez de ruta dinámica para que el sitio sea 100% estático
 * (export en Netlify) y funcione con CUALQUIER id, incluidas las empresas creadas
 * en runtime (que viven en localStorage). `useSearchParams` exige un límite de
 * Suspense para el prerender estático.
 */
export default function EmpresaDetallePage() {
  return (
    <React.Suspense fallback={<div className="min-h-[60vh]" />}>
      <EmpresaDetalleContent />
    </React.Suspense>
  );
}

function EmpresaDetalleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const router = useRouter();
  const { businesses: base, transactions } = useDataset();
  const all = useResolvedBusinesses(base);
  const business = all.find((b) => b.id === id);

  const hidden = useBusinessStore((s) => s.hidden.includes(id));
  const apiCfg = useBusinessStore((s) => s.apiConfig[id]);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const logEvent = useBusinessStore((s) => s.logEvent);

  const tx = React.useMemo(() => transactions.filter((t) => t.businessId === id), [transactions, id]);
  const perf = React.useMemo(
    () => (business ? computePerformance([business], transactions, 'mes')[0] : null),
    [business, transactions]
  );
  const series = React.useMemo(() => aggregateSeries(tx, 'day', 30), [tx]);
  const integraciones = DEMO_INTEGRATIONS.filter((i) => i.businessId === id);
  const recientes = [...tx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const alertasActivas = DEMO_ALERTS.filter((a) => a.businessId === id && !a.read);

  if (!business || !perf) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <p className="text-muted-foreground">No encontramos esa empresa.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/empresas')}>
          <ArrowLeft className="h-4 w-4" /> Volver a Empresas
        </Button>
      </div>
    );
  }

  const st = API_STATUS[business.apiStatus];
  const gananciaPositiva = perf.rentabilidad >= 0;

  function resync() {
    updateBusiness(business!.id, { lastSync: new Date().toISOString() });
    logEvent(business!.id, 'SINCRONIZADA', 'Sincronización manual');
    toast.success('Sincronización iniciada');
  }

  return (
    <div className="space-y-6">
      <Link href="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresas
      </Link>

      {/* ── PANEL EJECUTIVO ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
        <Card className="overflow-hidden">
          <div className="h-1.5" style={{ background: business.color }} />
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            {/* Logo grande */}
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo}
                alt={business.nombre}
                className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover sm:h-24 sm:w-24"
              />
            ) : (
              <span
                className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-3xl font-extrabold text-white sm:h-24 sm:w-24"
                style={{ background: business.color }}
              >
                {iniciales(business.nombre)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight">{business.nombre}</h1>
                <Badge variant={business.status === 'ACTIVE' ? 'success' : 'muted'}>
                  {business.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                </Badge>
                {hidden && (
                  <Badge variant="warning" className="gap-1">
                    <EyeOff className="h-3 w-3" /> Oculta
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {business.categoria ?? business.sector}
                {business.moneda ? ` · ${business.moneda}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  Estado API:
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} /> {st.label}
                  </span>
                </span>
                <span>Última sincronización: {haceCuanto(business.lastSync)}</span>
                {apiCfg?.syncFrequency && <span>Frecuencia: {SYNC_FREQUENCY_LABEL[apiCfg.syncFrequency]}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <Button size="sm" variant="outline" onClick={resync}>
                <RefreshCw className="h-4 w-4" /> Re-sincronizar
              </Button>
              <EmpresaActionsMenu business={business} existingCount={all.length} onDeleted={() => router.push('/empresas')} />
            </div>
          </div>

          {/* KPIs ejecutivos con números protagonistas */}
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4">
            <BigStat label="Ingresos" value={perf.ingresos} icon={ShoppingCart} tone="text-brand" money />
            <BigStat label="Costos" value={perf.egresos} icon={ShoppingBag} tone="text-warning" money />
            <BigStat
              label={gananciaPositiva ? 'Ganancia' : 'Pérdida'}
              value={perf.rentabilidad}
              icon={Wallet}
              tone={gananciaPositiva ? 'text-success' : 'text-danger'}
              money
            />
            <BigStat
              label="Alertas activas"
              value={alertasActivas.length}
              icon={Bell}
              tone={alertasActivas.length > 0 ? 'text-danger' : 'text-muted-foreground'}
              href="/alertas"
            />
          </div>
        </Card>
      </motion.div>

      <PageHeader title="Análisis" subtitle={`Margen ${perf.margen.toFixed(1)}% · ${recientes.length} movimientos recientes`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolución (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendArea data={series} height={280} series={['ingresos', 'egresos', 'rentabilidad']} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta mensual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{perf.cumplimientoMeta.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">de <Money value={business.metaMensual} compact /></span>
              </div>
              <Progress
                value={Math.min(100, perf.cumplimientoMeta)}
                className="mt-2"
                indicatorClassName={perf.cumplimientoMeta >= 100 ? 'bg-success' : 'bg-primary'}
              />
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">Integraciones de esta empresa</p>
              {integraciones.length === 0 && <p className="text-xs text-muted-foreground">Sin integraciones.</p>}
              {integraciones.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <span>{INTEGRATION_LABEL[i.type]}</span>
                  <Badge variant={API_STATUS[i.status].variant} className="text-[10px]">
                    {API_STATUS[i.status].label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {alertasActivas.length > 0 && (
        <Card className="border-danger/20 bg-danger/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-danger" /> Alertas activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertasActivas.map((a) => (
              <Link
                key={a.id}
                href="/alertas"
                className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-accent"
              >
                <span className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', a.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning')} />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recientes.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">Sin movimientos registrados.</p>}
            {recientes.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-lg',
                      t.type === 'INCOME' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning'
                    )}
                  >
                    {t.type === 'INCOME' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-muted-foreground">{fechaHora(t.date)}</p>
                  </div>
                </div>
                <span className={cn('text-sm font-semibold', t.type === 'INCOME' ? 'text-success' : 'text-warning')}>
                  {t.type === 'INCOME' ? '+' : '−'}
                  <Money value={t.amount} count />
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BigStat({
  label,
  value,
  icon: Icon,
  tone,
  href,
  money: isMoney = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  href?: string;
  money?: boolean;
}) {
  const inner = (
    <div className="flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-accent/40 sm:p-5">
      {/* 1 · Ícono integrado (sin caja): color de categoría + halo sutil */}
      <Icon className={cn('icon-glow h-7 w-7 shrink-0', tone)} />
      {/* 2 · Monto grande con CountUp (tipografía fluida) */}
      <span className={cn('fluid-amount block truncate font-extrabold tracking-tight tabular-nums', tone)}>
        {isMoney ? <Money value={value} compact count /> : <AnimatedNumber value={value} format={(n) => number(n)} />}
      </span>
      {/* 3 · Título pequeño */}
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
