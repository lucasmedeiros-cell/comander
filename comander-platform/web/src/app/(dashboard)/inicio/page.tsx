'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
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

  // Tarjeta principal: consolidado de TODAS las empresas (solo depende del periodo).
  const overviewAll = React.useMemo(
    () => computeOverview(businesses, transactions, range),
    [businesses, transactions, range]
  );

  // Resumen de la empresa SELECCIONADA (card debajo del carrusel) — cambia al
  // tocar una empresa; usa el mismo periodo.
  const selectedPerf = React.useMemo(
    () => (selected ? computePerformance([selected], transactions, range)[0] : null),
    [selected, transactions, range]
  );

  const periodLabel = PERIODS.find((p) => p.key === range)?.label ?? 'Hoy';

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

  // Selector de periodo (va dentro del encabezado de la tarjeta principal).
  const periodSelector = (
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
  );

  return (
    <div className="space-y-6">
      {/* ───────── 1 · TARJETA PRINCIPAL (consolidado, con selector de periodo) ───────── */}
      <SummaryCard
        eyebrow={`Ganancia · ${periodLabel}`}
        title={`Todas las empresas · ${businesses.length}`}
        ganancia={overviewAll.utilidad}
        ingresos={overviewAll.ingresosTotales}
        costos={overviewAll.egresosTotales}
        headerRight={periodSelector}
      />

      {/* ───────── 2 · RANKING DE EMPRESAS (mayor ingreso, barras horizontales) ───────── */}
      <CompanyRanking businesses={businesses} transactions={transactions} range={range} />

      {/* ───────── 3 · CARRUSEL DE EMPRESAS (selector) ───────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Tus empresas</h2>
            <p className="text-xs text-muted-foreground">Toca una para ver sus indicadores</p>
          </div>
          <Link href="/empresas" className="text-xs font-medium text-primary hover:underline">
            Administrar →
          </Link>
        </div>
        {!loading && (
          <CompanyCarousel businesses={businesses} selectedId={selectedId} onSelect={setSelectedBusiness} />
        )}
      </div>

      {/* ───────── 4 · RESUMEN DE LA EMPRESA SELECCIONADA (réplica de la principal) ───────── */}
      {selected && (
        <SummaryCard
          key={selected.id}
          eyebrow="Ganancia"
          title={selected.nombre}
          logo={selected.logo ?? null}
          color={selected.color}
          ganancia={selectedPerf?.rentabilidad ?? 0}
          ingresos={selectedPerf?.ingresos ?? 0}
          costos={selectedPerf?.egresos ?? 0}
        />
      )}

      {/* ───────── 5 · INDICADORES DEL NEGOCIO + GRÁFICA (empresa seleccionada) ───────── */}
      <OperationalIndicators business={selected} transactions={transactions} range={range} />
    </div>
  );
}
