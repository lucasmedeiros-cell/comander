'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ApiConfigFields, ConnectionStatusPill, useConnectionTest } from './connection';
import { useBusinessStore } from '@/lib/business-store';
import type { Business, BusinessApiConfig } from '@/types';

/** Configuración de API de una empresa: editar credenciales, probar y actualizar. */
export function ApiConfigDialog({
  business,
  open,
  onOpenChange,
}: {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const storedCfg = useBusinessStore((s) => s.apiConfig[business.id]);
  const setApiConfig = useBusinessStore((s) => s.setApiConfig);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const { status, setStatus, test } = useConnectionTest();

  const [cfg, setCfg] = React.useState<BusinessApiConfig>({ syncFrequency: 'HORA_1' });

  React.useEffect(() => {
    if (!open) return;
    setCfg(storedCfg ?? { syncFrequency: 'HORA_1' });
    setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function actualizar() {
    setApiConfig(business.id, cfg);
    // El estado del semáforo de la prueba define el estado de API persistido.
    const apiStatus = status === 'ok' ? 'CONNECTED' : status === 'error' || status === 'timeout' ? 'ERROR' : business.apiStatus;
    updateBusiness(business.id, { apiStatus, lastSync: new Date().toISOString() }, 'Conexión API actualizada');
    toast.success('Conexión actualizada');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar API · {business.nombre}</DialogTitle>
          <DialogDescription>Edita las credenciales existentes y prueba la conexión.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ApiConfigFields value={cfg} onChange={(patch) => setCfg((c) => ({ ...c, ...patch }))} />

          <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <span className="text-sm font-medium">Estado de la conexión</span>
            {status === 'idle' ? (
              <span className="text-xs text-muted-foreground">Sin probar</span>
            ) : (
              <ConnectionStatusPill status={status} />
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={() => test(!!cfg.apiUrl)} disabled={status === 'testing'}>
              Probar Conexión
            </Button>
            <Button type="button" className="flex-1" onClick={actualizar}>
              <RefreshCw className="h-4 w-4" /> Actualizar Conexión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
