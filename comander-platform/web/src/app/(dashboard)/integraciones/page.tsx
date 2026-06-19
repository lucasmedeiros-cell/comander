'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, EyeOff, Plus, Plug, RefreshCw, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEMO_INTEGRATIONS } from '@/lib/mock-data';
import { useDataset } from '@/lib/data-provider';
import { API_STATUS, INTEGRATION_LABEL } from '@/lib/labels';
import { haceCuanto } from '@/lib/format';
import type { Business, Integration, IntegrationType } from '@/types';
import { cn } from '@/lib/utils';

const TYPES: IntegrationType[] = ['STRIPE', 'SHOPIFY', 'QUICKBOOKS', 'GOOGLE_ANALYTICS', 'CUSTOM_WEBHOOK'];

export default function IntegracionesPage() {
  const { businesses } = useDataset();
  const [items, setItems] = React.useState<Integration[]>(DEMO_INTEGRATIONS);
  const [revealed, setRevealed] = React.useState<Record<string, boolean>>({});
  const [testing, setTesting] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED'>('all');

  const nombreEmpresa = (id: string) => businesses.find((b) => b.id === id)?.nombre ?? '—';
  const conectadas = items.filter((i) => i.status === 'CONNECTED').length;
  const visible = statusFilter === 'all' ? items : items.filter((i) => i.status === statusFilter);

  function test(id: string) {
    setTesting(id);
    setTimeout(() => {
      setTesting(null);
      const ok = Math.random() > 0.25;
      setItems((it) => it.map((x) => (x.id === id ? { ...x, status: ok ? 'CONNECTED' : 'ERROR', lastSync: new Date().toISOString() } : x)));
      ok ? toast.success('Conexión exitosa') : toast.error('No se pudo conectar. Revisa el token.');
    }, 1100);
  }
  function remove(id: string) {
    setItems((it) => it.filter((x) => x.id !== id));
    toast.success('Integración eliminada');
  }
  function add(type: IntegrationType, businessId: string, token: string) {
    const nuevo: Integration = {
      id: `i${Date.now()}`,
      type,
      businessId,
      token: token ? token.slice(0, 6) + '••••' : 'sk_••••0000',
      status: 'CONNECTED',
      lastSync: new Date().toISOString(),
    };
    setItems((it) => [nuevo, ...it]);
    toast.success(`${INTEGRATION_LABEL[type]} conectada`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Integraciones" subtitle="Conecta las APIs de tus negocios para datos en tiempo real.">
        <AddDialog businesses={businesses} onAdd={add} />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="APIs totales" value={String(items.length)} icon={Plug} color="#2D7EFF" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <StatCard label="Conectadas" value={String(conectadas)} icon={Zap} color="#10B981" active={statusFilter === 'CONNECTED'} onClick={() => setStatusFilter('CONNECTED')} />
        <StatCard label="Con errores" value={String(items.filter((i) => i.status === 'ERROR').length)} icon={Activity} color="#EF4444" active={statusFilter === 'ERROR'} onClick={() => setStatusFilter('ERROR')} />
        <StatCard label="Desconectadas" value={String(items.filter((i) => i.status === 'DISCONNECTED').length)} icon={Plug} color="#64748B" active={statusFilter === 'DISCONNECTED'} onClick={() => setStatusFilter('DISCONNECTED')} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">APIs conectadas</CardTitle>
          {statusFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>Ver todas</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay integraciones con ese estado.</p>
          )}
          {visible.map((it, i) => {
            const st = API_STATUS[it.status];
            return (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-sm font-bold">
                    {INTEGRATION_LABEL[it.type].slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{INTEGRATION_LABEL[it.type]}</p>
                    <p className="text-xs text-muted-foreground">{nombreEmpresa(it.businessId)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="rounded-md bg-muted px-2 py-1 text-xs">
                    {revealed[it.id] ? it.token.replace(/•/g, 'x') : it.token}
                  </code>
                  <button onClick={() => setRevealed((r) => ({ ...r, [it.id]: !r[it.id] }))} className="text-muted-foreground hover:text-foreground">
                    {revealed[it.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Badge variant={st.variant} className="gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} /> {st.label}
                </Badge>

                <span className="hidden text-xs text-muted-foreground lg:inline">
                  {it.lastSync ? haceCuanto(it.lastSync) : 'sin sincronizar'}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => test(it.id)} disabled={testing === it.id}>
                    <RefreshCw className={cn('h-3.5 w-3.5', testing === it.id && 'animate-spin')} /> Probar
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => remove(it.id)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, active, onClick }: { label: string; value: string; icon: typeof Plug; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card
        className={cn(
          'flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
          active ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30'
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </Card>
    </button>
  );
}

function AddDialog({ businesses, onAdd }: { businesses: Business[]; onAdd: (t: IntegrationType, b: string, token: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<IntegrationType>('STRIPE');
  const [businessId, setBusinessId] = React.useState(businesses[0]?.id ?? '');
  const [token, setToken] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Agregar integración</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva integración</DialogTitle>
          <DialogDescription>Conecta una API a una de tus empresas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de integración</Label>
            <select value={type} onChange={(e) => setType(e.target.value as IntegrationType)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none">
              {TYPES.map((t) => <option key={t} value={t}>{INTEGRATION_LABEL[t]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none">
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Token / API Key</Label>
            <Input placeholder="sk_live_..." value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => { onAdd(type, businessId, token); setOpen(false); setToken(''); }}>
          <Plug className="h-4 w-4" /> Conectar y probar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
