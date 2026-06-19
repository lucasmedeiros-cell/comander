'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Eye,
  EyeOff,
  History,
  MoreVertical,
  Pencil,
  Plug,
  Power,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmpresaFormDialog } from './EmpresaFormDialog';
import { ApiConfigDialog } from './ApiConfigDialog';
import { HistorialDialog } from './HistorialDialog';
import { DeleteEmpresaDialog } from './DeleteEmpresaDialog';
import { useBusinessStore } from '@/lib/business-store';
import type { Business } from '@/types';

type Sheet = 'edit' | 'api' | 'history' | 'delete' | null;

/**
 * Menú de acciones (⋮) de una empresa: ver detalle, editar, configurar API,
 * ver historial, duplicar, ocultar/mostrar, desactivar/activar y eliminar.
 */
export function EmpresaActionsMenu({
  business,
  existingCount = 0,
  /** Si se elimina y estamos en la vista de detalle, navega de vuelta. */
  onDeleted,
  align = 'end',
}: {
  business: Business;
  existingCount?: number;
  onDeleted?: () => void;
  align?: 'start' | 'end';
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<Sheet>(null);

  const hidden = useBusinessStore((s) => s.hidden.includes(business.id));
  const setHidden = useBusinessStore((s) => s.setHidden);
  const duplicateBusiness = useBusinessStore((s) => s.duplicateBusiness);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);

  const activa = business.status === 'ACTIVE';

  function toggleVisibilidad() {
    setHidden(business.id, !hidden);
    toast.success(hidden ? 'Empresa visible en el Inicio' : 'Empresa oculta del Inicio');
  }

  function duplicar() {
    const copia = duplicateBusiness(business);
    toast.success(`Configuración duplicada en “${copia.nombre}”`);
  }

  function toggleEstado() {
    const next = activa ? 'INACTIVE' : 'ACTIVE';
    updateBusiness(business.id, { status: next }, activa ? 'Empresa desactivada' : 'Empresa activada');
    useBusinessStore.getState().logEvent(business.id, activa ? 'DESACTIVADA' : 'ACTIVADA', '');
    toast.success(activa ? 'Empresa desactivada' : 'Empresa activada');
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="outline" aria-label="Acciones de la empresa" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => router.push(`/empresas/detalle?id=${business.id}`)}>
            <Eye /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSheet('edit')}>
            <Pencil /> Editar empresa
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSheet('api')}>
            <Plug /> Configurar API
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSheet('history')}>
            <History /> Ver historial
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicar}>
            <Copy /> Duplicar configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleVisibilidad}>
            {hidden ? <Eye /> : <EyeOff />} {hidden ? 'Mostrar en Inicio' : 'Ocultar del Inicio'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleEstado}>
            <Power /> {activa ? 'Desactivar empresa' : 'Activar empresa'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger focus:bg-danger/10 focus:text-danger" onSelect={() => setSheet('delete')}>
            <Trash2 /> Eliminar empresa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs controlados por el menú. */}
      <EmpresaFormDialog
        mode="edit"
        business={business}
        existingCount={existingCount}
        open={sheet === 'edit'}
        onOpenChange={(o) => setSheet(o ? 'edit' : null)}
      />
      <ApiConfigDialog
        business={business}
        open={sheet === 'api'}
        onOpenChange={(o) => setSheet(o ? 'api' : null)}
      />
      <HistorialDialog
        business={business}
        open={sheet === 'history'}
        onOpenChange={(o) => setSheet(o ? 'history' : null)}
      />
      <DeleteEmpresaDialog
        business={business}
        open={sheet === 'delete'}
        onOpenChange={(o) => setSheet(o ? 'delete' : null)}
        onDeleted={onDeleted}
      />
    </>
  );
}
