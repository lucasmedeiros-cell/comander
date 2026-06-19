'use client';

import * as React from 'react';
import { History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBusinessStore } from '@/lib/business-store';
import { EVENT_META } from '@/lib/empresas';
import { fechaHora } from '@/lib/format';
import type { Business } from '@/types';
import { cn } from '@/lib/utils';

/** Historial de actividad de una empresa (creación, ediciones, sincronizaciones…). */
export function HistorialDialog({
  business,
  open,
  onOpenChange,
}: {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const events = useBusinessStore((s) => s.events[business.id] ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial · {business.nombre}</DialogTitle>
          <DialogDescription>Registro de actividad de la empresa.</DialogDescription>
        </DialogHeader>

        {events.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center text-muted-foreground">
            <History className="h-8 w-8 opacity-40" />
            <p className="text-sm">Aún no hay actividad registrada.</p>
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {events.map((ev) => {
              const meta = EVENT_META[ev.type];
              return (
                <li key={ev.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background',
                      meta.tone === 'good' && 'bg-success',
                      meta.tone === 'bad' && 'bg-danger',
                      meta.tone === 'neutral' && 'bg-muted-foreground'
                    )}
                  />
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{ev.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{fechaHora(ev.at)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
