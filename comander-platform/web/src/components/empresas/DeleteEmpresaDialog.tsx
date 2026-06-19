'use client';

import * as React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBusinessStore } from '@/lib/business-store';
import type { Business } from '@/types';

/** Modal de eliminación segura: requiere confirmación explícita. */
export function DeleteEmpresaDialog({
  business,
  open,
  onOpenChange,
  onDeleted,
}: {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const deleteBusiness = useBusinessStore((s) => s.deleteBusiness);

  function confirmar() {
    deleteBusiness(business.id);
    toast.success(`“${business.nombre}” eliminada`);
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-danger/12 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>¿Está seguro que desea eliminar esta empresa?</DialogTitle>
          <DialogDescription>
            Se eliminará <span className="font-semibold text-foreground">{business.nombre}</span> de Commander. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="destructive" className="flex-1" onClick={confirmar}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
