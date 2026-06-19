'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCheck,
  Info,
  Plug,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_ALERTS } from '@/lib/mock-data';
import { useDataset } from '@/lib/data-provider';
import { ALERT_LABEL } from '@/lib/labels';
import { haceCuanto } from '@/lib/format';
import type { Alert, AlertType } from '@/types';
import { cn } from '@/lib/utils';

const ICONS: Record<AlertType, typeof Bell> = {
  INGRESOS_CAEN: TrendingDown,
  EGRESOS_SUBEN: TrendingUp,
  EMPRESA_DESCONECTADA: Plug,
  API_ERROR: AlertOctagon,
  COMPORTAMIENTO_INUSUAL: Info,
};

const SEV_STYLE = {
  CRITICAL: { dot: 'bg-danger', chip: 'danger' as const, ring: 'border-danger/30' },
  WARNING: { dot: 'bg-warning', chip: 'warning' as const, ring: 'border-warning/30' },
  INFO: { dot: 'bg-brand', chip: 'default' as const, ring: 'border-border' },
};

export default function AlertasPage() {
  const { businesses } = useDataset();
  const [alerts, setAlerts] = React.useState<Alert[]>(DEMO_ALERTS);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = React.useState<AlertType | 'all'>('all');

  const visible = alerts
    .filter((a) => (filter === 'unread' ? !a.read : true))
    .filter((a) => (typeFilter === 'all' ? true : a.type === typeFilter));
  const unread = alerts.filter((a) => !a.read).length;

  function markAll() {
    setAlerts((as) => as.map((a) => ({ ...a, read: true })));
    toast.success('Todas las alertas marcadas como leídas');
  }
  function toggle(id: string) {
    setAlerts((as) => as.map((a) => (a.id === id ? { ...a, read: !a.read } : a)));
  }

  const nombreEmpresa = (id?: string) => businesses.find((b) => b.id === id)?.nombre;

  return (
    <div className="space-y-6">
      <PageHeader title="Alertas inteligentes" subtitle="Te avisamos automáticamente cuando algo necesita tu atención.">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setFilter('all')}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-medium', filter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-medium', filter === 'unread' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            Sin leer {unread > 0 && `(${unread})`}
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={markAll} disabled={unread === 0}>
          <CheckCheck className="h-4 w-4" /> Marcar todo
        </Button>
      </PageHeader>

      {/* Reglas activas — clic para filtrar por tipo */}
      <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {([
          ['Caída de ingresos', TrendingDown, '#EF4444', 'INGRESOS_CAEN'],
          ['Aumento de egresos', TrendingUp, '#F59E0B', 'EGRESOS_SUBEN'],
          ['Empresa desconectada', Plug, '#64748B', 'EMPRESA_DESCONECTADA'],
          ['Error de API', AlertOctagon, '#EF4444', 'API_ERROR'],
          ['Comportamiento inusual', AlertTriangle, '#8B5CF6', 'COMPORTAMIENTO_INUSUAL'],
        ] as const).map(([label, Icon, color, tipo]) => {
          const count = alerts.filter((a) => a.type === tipo).length;
          const active = typeFilter === tipo;
          return (
            <button key={label} type="button" onClick={() => setTypeFilter((cur) => (cur === tipo ? 'all' : tipo))} className="text-left">
              <Card
                className={cn(
                  'flex items-center gap-2.5 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md',
                  active ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30'
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${color}1f`, color }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} alerta(s)</p>
                </div>
              </Card>
            </button>
          );
        })}
      </Reveal>

      <div className="space-y-3">
        {visible.length === 0 && (
          <Card><CardContent className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
            <Bell className="mb-2 h-6 w-6" /> No hay alertas {filter === 'unread' ? 'sin leer' : ''}.
          </CardContent></Card>
        )}
        {visible.map((a, i) => {
          const Icon = ICONS[a.type];
          const sev = SEV_STYLE[a.severity];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
              <Card className={cn('flex items-start gap-4 p-4 transition-colors', sev.ring, !a.read && 'bg-card', a.read && 'opacity-70')}>
                <span className={cn('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', a.severity === 'CRITICAL' ? 'bg-danger/12 text-danger' : a.severity === 'WARNING' ? 'bg-warning/12 text-warning' : 'bg-brand/12 text-brand')}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <Badge variant={sev.chip} className="text-[10px]">{ALERT_LABEL[a.type]}</Badge>
                    {!a.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    {nombreEmpresa(a.businessId) ? `${nombreEmpresa(a.businessId)} · ` : ''}{haceCuanto(a.createdAt)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggle(a.id)} className="shrink-0 text-xs">
                  {a.read ? 'Marcar no leída' : 'Marcar leída'}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
