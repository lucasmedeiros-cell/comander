'use client';

import * as React from 'react';
import { Check, Plug, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LogoUploader } from './LogoUploader';
import { ApiConfigFields, TestConnectionRow, useConnectionTest } from './connection';
import { useBusinessStore } from '@/lib/business-store';
import { CATEGORIAS, MONEDAS, PALETTE, ZONAS } from '@/lib/empresas';
import { BUSINESS_TYPE_OPTIONS } from '@/lib/operational';
import type { Business, BusinessApiConfig, BusinessType } from '@/types';
import { cn } from '@/lib/utils';

const selectClass =
  'h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none';

interface BaseProps {
  /** Cantidad de empresas (para asignar color por defecto al crear). */
  existingCount?: number;
}

interface CreateProps extends BaseProps {
  mode: 'create';
  trigger: React.ReactNode;
}

interface EditProps extends BaseProps {
  mode: 'edit';
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Props = CreateProps | EditProps;

export function EmpresaFormDialog(props: Props) {
  const isEdit = props.mode === 'edit';
  const addBusiness = useBusinessStore((s) => s.addBusiness);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const storedCfg = useBusinessStore((s) => (isEdit ? s.apiConfig[(props as EditProps).business.id] : undefined));

  // Estado controlado externamente (edit) o interno (create).
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isEdit ? (props as EditProps).open : internalOpen;
  const setOpen = isEdit ? (props as EditProps).onOpenChange : setInternalOpen;

  const base = isEdit ? (props as EditProps).business : undefined;
  const defaultColor = PALETTE[(props.existingCount ?? 0) % PALETTE.length];

  const [logo, setLogo] = React.useState<string | null>(base?.logo ?? null);
  const [nombre, setNombre] = React.useState(base?.nombre ?? '');
  const [descripcion, setDescripcion] = React.useState(base?.descripcion ?? '');
  const [categoria, setCategoria] = React.useState(base?.categoria ?? base?.sector ?? 'General');
  const [tipo, setTipo] = React.useState<BusinessType>(base?.tipo ?? 'tienda');
  const [moneda, setMoneda] = React.useState(base?.moneda ?? 'USD');
  const [zona, setZona] = React.useState(base?.zonaHoraria ?? 'America/Bogota');
  const [activa, setActiva] = React.useState((base?.status ?? 'ACTIVE') === 'ACTIVE');
  const [color, setColor] = React.useState(base?.color ?? defaultColor);
  const [cfg, setCfg] = React.useState<BusinessApiConfig>({ syncFrequency: 'HORA_1' });
  const { status, setStatus, test } = useConnectionTest();

  // Re-sincroniza el formulario cuando se abre (toma los valores actuales).
  React.useEffect(() => {
    if (!open) return;
    setLogo(base?.logo ?? null);
    setNombre(base?.nombre ?? '');
    setDescripcion(base?.descripcion ?? '');
    setCategoria(base?.categoria ?? base?.sector ?? 'General');
    setTipo(base?.tipo ?? 'tienda');
    setMoneda(base?.moneda ?? 'USD');
    setZona(base?.zonaHoraria ?? 'America/Bogota');
    setActiva((base?.status ?? 'ACTIVE') === 'ACTIVE');
    setColor(base?.color ?? defaultColor);
    setCfg(storedCfg ?? { syncFrequency: 'HORA_1' });
    setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Ingresa el nombre de la empresa');
      return;
    }
    const status_: Business['status'] = activa ? 'ACTIVE' : 'INACTIVE';

    if (isEdit && base) {
      updateBusiness(
        base.id,
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          sector: categoria,
          categoria,
          tipo,
          moneda,
          zonaHoraria: zona,
          status: status_,
          color,
          logo: logo ?? undefined,
        },
        `“${nombre.trim()}” actualizada`
      );
      toast.success('Empresa actualizada');
    } else {
      const nueva: Business = {
        id: `b_local_${Date.now()}`,
        nombre: nombre.trim(),
        sector: categoria,
        categoria,
        tipo,
        color,
        status: status_,
        apiStatus: status === 'ok' ? 'CONNECTED' : 'DISCONNECTED',
        lastSync: new Date().toISOString(),
        metaMensual: 0,
        logo: logo ?? undefined,
        descripcion: descripcion.trim() || undefined,
        moneda,
        zonaHoraria: zona,
      };
      const hasCfg = cfg.apiUrl || cfg.apiKey || cfg.token || cfg.usuario || cfg.webhooks;
      addBusiness(nueva, hasCfg ? cfg : undefined);
      toast.success(`${nueva.nombre} conectada correctamente`);
    }
    setOpen(false);
  }

  const body = (
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar empresa' : 'Nueva Empresa'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Modifica los datos de tu empresa. Los cambios se reflejan al instante.' : 'Registra un negocio y conéctalo por API.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <LogoUploader value={logo} onChange={setLogo} nombre={nombre} color={color} />

        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Mi empresa S.A." />
        </div>

        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle breve del negocio" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tipo de negocio</Label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as BusinessType)} className={selectClass}>
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">Define los Indicadores Operativos del Inicio.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={selectClass}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={selectClass}>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Zona horaria</Label>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className={selectClass}>
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Color identificador */}
        <div className="space-y-1.5">
          <Label>Color identificador</Label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg ring-offset-2 ring-offset-background transition-all',
                  color === c && 'ring-2 ring-foreground'
                )}
                style={{ background: c }}
              >
                {color === c && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-medium">Estado</p>
            <p className="text-xs text-muted-foreground">{activa ? 'Activa' : 'Inactiva'}</p>
          </div>
          <Switch checked={activa} onCheckedChange={setActiva} />
        </div>

        {/* Conexión API solo al crear (en edición se usa "Configurar API"). */}
        {!isEdit && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">Conexión API</p>
            <ApiConfigFields value={cfg} onChange={(patch) => setCfg((c) => ({ ...c, ...patch }))} />
            <TestConnectionRow status={status} onTest={() => test(!!cfg.apiUrl)} />
          </div>
        )}

        <Button type="submit" className="w-full">
          {isEdit ? (
            <>
              <Save className="h-4 w-4" /> Guardar cambios
            </>
          ) : (
            <>
              <Plug className="h-4 w-4" /> Crear empresa
            </>
          )}
        </Button>
      </form>
    </DialogContent>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {body}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{(props as CreateProps).trigger}</DialogTrigger>
      {body}
    </Dialog>
  );
}
