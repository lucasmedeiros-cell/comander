'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { StatBlock } from '@/components/dashboard/StatBlock';
import { CompanyRanking } from '@/components/dashboard/CompanyRanking';
import { OperationalIndicators } from '@/components/dashboard/OperationalIndicators';
import { CompanyCarousel } from '@/components/dashboard/CompanyCarousel';
import { useDataset } from '@/lib/data-provider';
import { useMounted } from '@/lib/use-mounted';
import { useVisibleBusinesses, useSelectedBusiness } from '@/lib/business-store';
import { computeOverview, computePerformance } from '@/lib/metrics';
import type { RangeKey } from '@/types';
import { cn } from '@/lib/utils';

// Periodos disponibles para la tarjeta principal (cambio anima los montos).
const PERIODS: Array<{ key: RangeKey; label: string }> = [
  { key: 'ayer', label: 'Ayer' },
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
];

export default function InicioPage() {
  const [range, setRange] = React.useState<RangeKey>('hoy');
  const { businesses: base, transactions } = useDataset();
  const businesses = useVisibleBusinesses(base);
  const { selected, selectedId, setSelectedBusiness } = useSelectedBusiness(businesses);
  const loading = !useMounted();

  // Tarjeta principal (FIJA): consolidado de TODAS las empresas. No cambia al
  // seleccionar una empresa; solo depende del periodo.
  const overviewAll = React.useMemo(
    () => computeOverview(businesses, transactions, range),
    [businesses, transactions, range]
  );

  // Tarjetas centrales + indicadores: SOLO la empresa seleccionada.
  const perf = React.useMemo(
    () => (selected ? computePerformance([selected], transactions, range)[0] : null),
    [selected, transactions, range]
  );

  const periodLabel = PERIODS.find((p) => p.key === range)?.label ?? 'Hoy';

  // Consolidado (tarjeta principal fija)
  const ventasTotal = overviewAll.ingresosTotales;
  const comprasTotal = overviewAll.egresosTotales;
  const gananciaTotal = overviewAll.utilidad;
  const gananciaPositiva = gananciaTotal >= 0;

  // Empresa seleccionada (tarjetas centrales)
  const ventasSel = perf?.ingresos ?? 0;
  const comprasSel = perf?.egresos ?? 0;

  // Sin empresas → invitación a crear la primera.
  if (!loading && businesses.length === 0) {
    return (
      <Card className="grid place-items-center gap-3 p-12 text-center">
        <Building2 className="icon-glow h-12 w-12 text-primary" />
        <p className="text-sm text-muted-foreground">Aún no tienes empresas. Crea la primera para empezar.</p>
        <Button asChild className="mt-1">
          <Link href="/empresas">Crear empresa</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ───────── 1 · TARJETA PRINCIPAL (resumen premium consolidado) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1224] via-[#0a0f1e] to-[#070b16] p-5 text-white shadow-2xl sm:p-7">
          {/* Glow sutil */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-[90px]"
            animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <div className="relative">
            {/* Encabezado: etiqueta + empresa + selector de periodo */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
                  Ganancia · {periodLabel}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-white/70">
                  Todas las empresas · {businesses.length}
                </p>
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10 sm:w-auto sm:justify-start">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setRange(p.key)}
                    className={cn(
                      'rounded-full px-2.5 py-2 text-xs font-medium transition-colors sm:px-3',
                      range === p.key ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ganancia (protagonista, CountUp, tipografía fluida) */}
            <p
              className={cn(
                'fluid-hero mt-4 max-w-full whitespace-nowrap font-extrabold tracking-tight tabular-nums',
                gananciaPositiva ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              <Money value={gananciaTotal} count />
            </p>

            {/* Ingresos + Costos consolidadas (apoyo) */}
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="min-w-0 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 sm:p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Ingresos</p>
                <p className="fluid-amount-sm mt-1 truncate font-bold tabular-nums text-white">
                  <Money value={ventasTotal} count />
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10 sm:p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Costos</p>
                <p className="fluid-amount-sm mt-1 truncate font-bold tabular-nums text-white">
                  <Money value={comprasTotal} count />
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ───────── 2 · RANKING DE EMPRESAS (mayor ingreso, barras horizontales) ───────── */}
      <CompanyRanking businesses={businesses} transactions={transactions} range={range} />

      {/* ───────── 3 · CARRUSEL DE EMPRESAS (selector, debajo del resumen) ───────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Tus empresas</h2>
            <p className="text-xs text-muted-foreground">Toca una para ver su detalle abajo</p>
          </div>
          <Link href="/empresas" className="text-xs font-medium text-primary hover:underline">
            Administrar →
          </Link>
        </div>
        {!loading && (
          <CompanyCarousel businesses={businesses} selectedId={selectedId} onSelect={setSelectedBusiness} />
        )}
      </div>

      {/* ───────── 3 · TARJETAS CENTRALES (Ingresos · Costos de la empresa elegida) ───────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full" style={{ background: selected?.color ?? '#2D7EFF' }} />
          <h2 className="truncate text-sm font-bold tracking-tight">{selected?.nombre ?? 'Empresa'}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
          <Card className="p-4 sm:p-6">
            <StatBlock orientation="col" size="xl" icon={ShoppingCart} label="Ingresos" value={ventasSel} accent="#2D7EFF" />
          </Card>
          <Card className="p-4 sm:p-6">
            <StatBlock orientation="col" size="xl" icon={ShoppingBag} label="Costos" value={comprasSel} accent="#F59E0B" />
          </Card>
        </div>
      </div>

      {/* ───────── 4 · INDICADORES DEL NEGOCIO + GRÁFICA (según tipo de empresa) ───────── */}
      <OperationalIndicators business={selected} transactions={transactions} range={range} />
    </div>
  );
}
