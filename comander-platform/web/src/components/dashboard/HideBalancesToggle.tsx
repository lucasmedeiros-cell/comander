'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * Botón "Ocultar Saldos" — modo privacidad para reuniones u oficinas abiertas.
 * Oculta globalmente todos los valores monetarios (la preferencia se persiste).
 * `compact` muestra solo el ícono (ideal para la barra superior en móvil).
 */
export function HideBalancesToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const hidden = useSettings((s) => s.balancesHidden);
  const toggle = useSettings((s) => s.toggleBalances);

  const label = hidden ? 'Mostrar Saldos' : 'Ocultar Saldos';
  const Icon = hidden ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      title={label}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all active:scale-[0.98]',
        hidden
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30',
        compact && 'px-0 w-9 justify-center',
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!compact && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
