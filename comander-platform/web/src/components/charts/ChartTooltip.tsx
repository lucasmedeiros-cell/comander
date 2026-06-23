'use client';

import type { TooltipProps } from 'recharts';
import { money } from '@/lib/format';
import { useSettings } from '@/lib/store';
import { MONEY_MASK } from '@/components/ui/money';

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const hidden = useSettings((s) => s.balancesHidden);
  const fmt = (n: number) => (hidden ? MONEY_MASK : money(n));
  if (!active || !payload?.length) return null;

  // Fila de datos subyacente (compartida por todas las entradas del punto).
  const row = (payload[0]?.payload ?? {}) as Record<string, unknown>;

  const ventas = num(row.ventas) ?? num(row.ingresos);
  const compras = num(row.compras) ?? num(row.egresos);
  const empresa = (row.empresa ?? row.business ?? row.label) as string | undefined;
  const delta = num(row.delta);

  const rich = ventas !== undefined || compras !== undefined;

  if (rich) {
    const diferencia =
      ventas !== undefined && compras !== undefined ? ventas - compras : undefined;
    return (
      <div className="min-w-[180px] rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
        {label !== undefined && <Row name="Fecha" value={String(label)} muted />}
        {empresa && typeof empresa === 'string' && <Row name="Empresa" value={empresa} muted />}
        {ventas !== undefined && <Row name="Ingresos" value={fmt(ventas)} dot="#2D7EFF" />}
        {compras !== undefined && <Row name="Costos" value={fmt(compras)} dot="#F59E0B" />}
        {diferencia !== undefined && (
          <Row
            name="Diferencia"
            value={fmt(diferencia)}
            valueClass={diferencia >= 0 ? 'text-success' : 'text-danger'}
          />
        )}
        {delta !== undefined && (
          <Row
            name="Variación"
            value={`${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
            valueClass={delta >= 0 ? 'text-success' : 'text-danger'}
          />
        )}
      </div>
    );
  }

  // Fallback genérico (compatibilidad con el comportamiento anterior).
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-medium text-foreground">{fmt(Number(p.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  name,
  value,
  dot,
  muted,
  valueClass,
}: {
  name: string;
  value: string;
  dot?: string;
  muted?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {name}
      </span>
      <span className={muted ? 'font-medium text-foreground' : valueClass ?? 'font-medium text-foreground'}>
        {value}
      </span>
    </div>
  );
}
