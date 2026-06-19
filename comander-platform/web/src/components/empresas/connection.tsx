'use client';

import * as React from 'react';
import { Loader2, Plug } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SYNC_FREQUENCIES } from '@/lib/empresas';
import type { BusinessApiConfig } from '@/types';
import { cn } from '@/lib/utils';

export type TestStatus = 'idle' | 'testing' | 'ok' | 'error' | 'timeout';

/** Hook que simula una prueba de conexión (sin backend real, con sesgo a éxito). */
export function useConnectionTest() {
  const [status, setStatus] = React.useState<TestStatus>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  const test = React.useCallback((hasUrl: boolean) => {
    setStatus('testing');
    timer.current = setTimeout(() => {
      if (!hasUrl) {
        setStatus('error');
        return;
      }
      const r = Math.random();
      setStatus(r > 0.25 ? 'ok' : r > 0.1 ? 'error' : 'timeout');
    }, 1200);
  }, []);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  return { status, setStatus, test };
}

/** Semáforo de estado de conexión: 🟢 Conectado · 🟡 Advertencia · 🔴 Error. */
export function ConnectionStatusPill({ status }: { status: TestStatus }) {
  if (status === 'idle') return null;
  if (status === 'testing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Probando…
      </span>
    );
  }
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <span className="h-2 w-2 rounded-full bg-success" /> 🟢 Conectado
      </span>
    );
  }
  if (status === 'timeout') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning">
        <span className="h-2 w-2 rounded-full bg-warning" /> 🟡 Advertencia · sin respuesta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
      <span className="h-2 w-2 rounded-full bg-danger" /> 🔴 Error de conexión
    </span>
  );
}

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none';

/** Campos editables de la conexión API (controlados). */
export function ApiConfigFields({
  value,
  onChange,
}: {
  value: BusinessApiConfig;
  onChange: (patch: Partial<BusinessApiConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>URL API</Label>
        <Input
          value={value.apiUrl ?? ''}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          placeholder="https://api.empresa.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>API Key</Label>
          <Input value={value.apiKey ?? ''} onChange={(e) => onChange({ apiKey: e.target.value })} placeholder="pk_..." />
        </div>
        <div className="space-y-1.5">
          <Label>Token</Label>
          <Input value={value.token ?? ''} onChange={(e) => onChange({ token: e.target.value })} placeholder="Bearer ..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Usuario</Label>
          <Input value={value.usuario ?? ''} onChange={(e) => onChange({ usuario: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Contraseña</Label>
          <Input type="password" value={value.password ?? ''} onChange={(e) => onChange({ password: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Webhooks</Label>
        <Input
          value={value.webhooks ?? ''}
          onChange={(e) => onChange({ webhooks: e.target.value })}
          placeholder="https://hooks.empresa.com/comander"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Frecuencia de sincronización</Label>
        <select
          value={value.syncFrequency ?? 'HORA_1'}
          onChange={(e) => onChange({ syncFrequency: e.target.value as BusinessApiConfig['syncFrequency'] })}
          className={selectClass}
        >
          {SYNC_FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Botón "Probar Conexión" + semáforo, reutilizable. */
export function TestConnectionRow({
  status,
  onTest,
  className,
}: {
  status: TestStatus;
  onTest: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Button type="button" size="sm" variant="outline" onClick={onTest} disabled={status === 'testing'}>
        {status === 'testing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
        Probar Conexión
      </Button>
      <ConnectionStatusPill status={status} />
    </div>
  );
}
