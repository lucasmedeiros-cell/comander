'use client';

import * as React from 'react';
import Link from 'next/link';
import { Reorder, useDragControls } from 'framer-motion';
import { Eye, EyeOff, GripVertical, Plug, RefreshCw, ShoppingBag, ShoppingCart, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmpresaFormDialog } from '@/components/empresas/EmpresaFormDialog';
import { EmpresaActionsMenu } from '@/components/empresas/EmpresaActionsMenu';
import { StatBlock } from '@/components/dashboard/StatBlock';
import { useDataset } from '@/lib/data-provider';
import { useBusinessStore, useResolvedBusinesses } from '@/lib/business-store';
import { computePerformance } from '@/lib/metrics';
import { API_STATUS } from '@/lib/labels';
import { haceCuanto, iniciales } from '@/lib/format';
import type { Business, BusinessPerformance } from '@/types';
import { cn } from '@/lib/utils';

export default function EmpresasPage() {
  const { businesses: base, transactions } = useDataset();
  const all = useResolvedBusinesses(base);
  const hiddenIds = useBusinessStore((s) => s.hidden);
  const setOrder = useBusinessStore((s) => s.setOrder);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const logEvent = useBusinessStore((s) => s.logEvent);

  // Lista local para drag & drop fluido; se re-sincroniza si cambia el conjunto.
  const [items, setItems] = React.useState<Business[]>(all);
  React.useEffect(() => {
    const sameSet =
      items.length === all.length && items.every((b) => all.some((x) => x.id === b.id));
    if (!sameSet) {
      setItems(all);
    } else {
      // refleja ediciones (nombre, color, logo…) preservando el orden local
      setItems((cur) => cur.map((b) => all.find((x) => x.id === b.id) ?? b));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  const perfById = React.useMemo(() => {
    const map = new Map<string, BusinessPerformance>();
    for (const p of computePerformance(items, transactions, 'mes')) map.set(p.business.id, p);
    return map;
  }, [items, transactions]);

  function onReorder(next: Business[]) {
    setItems(next);
    setOrder(next.map((b) => b.id));
  }

  function resync(b: Business) {
    updateBusiness(b.id, { lastSync: new Date().toISOString() });
    logEvent(b.id, 'SINCRONIZADA', 'Sincronización manual');
    toast.success(`${b.nombre} sincronizada correctamente`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Empresas" subtitle="Crea, edita, configura, reordena y administra todos tus negocios.">
        <EmpresaFormDialog
          mode="create"
          existingCount={all.length}
          trigger={
            <Button variant="default" size="sm">
              <Plug className="h-4 w-4" /> Nueva empresa
            </Button>
          }
        />
      </PageHeader>

      {items.length === 0 ? (
        <Card className="grid place-items-center gap-2 p-12 text-center text-muted-foreground">
          <p className="text-sm">Aún no tienes empresas. Crea la primera para empezar.</p>
        </Card>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GripVertical className="h-3.5 w-3.5" /> Arrastra para reordenar. El orden se guarda automáticamente.
          </p>
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={onReorder}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {items.map((b) => (
              <EmpresaCard
                key={b.id}
                business={b}
                perf={perfById.get(b.id)}
                hidden={hiddenIds.includes(b.id)}
                total={all.length}
                onResync={() => resync(b)}
              />
            ))}
          </Reorder.Group>
        </>
      )}
    </div>
  );
}

function EmpresaCard({
  business: b,
  perf,
  hidden,
  total,
  onResync,
}: {
  business: Business;
  perf?: BusinessPerformance;
  hidden: boolean;
  total: number;
  onResync: () => void;
}) {
  const controls = useDragControls();
  const st = API_STATUS[b.apiStatus];
  const inactiva = b.status === 'INACTIVE';

  return (
    <Reorder.Item value={b} dragListener={false} dragControls={controls} className="list-none">
      <Card className={cn('card-hover flex h-full flex-col overflow-hidden', (hidden || inactiva) && 'opacity-70')}>
        <div className="h-1" style={{ background: b.color }} />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {/* Manija de arrastre */}
              <button
                type="button"
                aria-label="Reordenar"
                onPointerDown={(e) => controls.start(e)}
                className="shrink-0 cursor-grab touch-none text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <Link href={`/empresas/${b.id}`} className="flex min-w-0 items-center gap-3">
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo} alt={b.nombre} className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover" />
                ) : (
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{ background: b.color }}
                  >
                    {iniciales(b.nombre)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">{b.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.categoria ?? b.sector}</p>
                </div>
              </Link>
            </div>
            <EmpresaActionsMenu business={b} existingCount={total} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant={st.variant} className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </Badge>
            {inactiva && <Badge variant="muted">Inactiva</Badge>}
            {hidden && (
              <Badge variant="warning" className="gap-1">
                <EyeOff className="h-3 w-3" /> Oculta del Inicio
              </Badge>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">Última sincronización: {haceCuanto(b.lastSync)}</p>

          <div className="mt-4 space-y-4">
            <StatBlock icon={ShoppingCart} label="Ventas" value={perf?.ingresos ?? 0} accent="#2D7EFF" />
            <StatBlock icon={ShoppingBag} label="Compras" value={perf?.egresos ?? 0} accent="#F59E0B" />
            <StatBlock
              icon={Wallet}
              label={(perf?.rentabilidad ?? 0) >= 0 ? 'Ganancia' : 'Pérdida'}
              value={perf?.rentabilidad ?? 0}
              accent={(perf?.rentabilidad ?? 0) >= 0 ? '#10B981' : '#EF4444'}
              valueClassName={(perf?.rentabilidad ?? 0) >= 0 ? 'text-success' : 'text-danger'}
            />
          </div>

          <div className="mt-auto flex items-center gap-2 pt-5">
            <Button asChild size="sm" variant="secondary" className="flex-1">
              <Link href={`/empresas/${b.id}`}>
                <Eye className="h-3.5 w-3.5" /> Ver detalle
              </Link>
            </Button>
            <Button size="icon-sm" variant="outline" aria-label="Re-sincronizar" onClick={onResync}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
}
