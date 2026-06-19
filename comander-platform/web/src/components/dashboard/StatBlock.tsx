'use client';

import type { LucideIcon } from 'lucide-react';
import { number } from '@/lib/format';
import { Money } from '@/components/ui/money';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

/**
 * Bloque de métrica con JERARQUÍA VISUAL invertida (spec):
 *   1) ÍCONO grande  →  2) MONTO grande (CountUp)  →  3) TÍTULO pequeño
 *
 * Layout en fila (ícono a la izquierda, monto+título a la derecha) para que el
 * número pueda mostrarse completo y grande, dirigiendo la mirada primero al
 * ícono y luego al monto. Es la pieza compartida de TODAS las tarjetas de
 * empresa y resúmenes; no duplica lógica: el conteo reutiliza `Money`/`AnimatedNumber`.
 */
interface StatBlockProps {
  icon: LucideIcon;
  /** Título corto y pequeño (Ventas, Compras, Ganancia…). */
  label: string;
  value: number;
  /** Color de acento (hex) del ícono. */
  accent?: string;
  /** Clase de color para el monto (p. ej. text-success / text-danger). */
  valueClassName?: string;
  /** Trata el valor como dinero (se oculta en modo privacidad). */
  money?: boolean;
  /** Notación compacta (US$1,2 mil). Por defecto muestra el monto completo. */
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { tile: 'h-11 w-11', icon: 'h-6 w-6', value: 'text-xl', label: 'text-[10px]' },
  md: { tile: 'h-12 w-12', icon: 'h-6 w-6', value: 'text-2xl', label: 'text-[11px]' },
  lg: { tile: 'h-14 w-14', icon: 'h-7 w-7', value: 'text-3xl', label: 'text-xs' },
} as const;

export function StatBlock({
  icon: Icon,
  label,
  value,
  accent = '#2D7EFF',
  valueClassName,
  money = true,
  compact = false,
  size = 'sm',
  className,
}: StatBlockProps) {
  const s = SIZES[size];
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* 1 · Ícono grande (protagonista) */}
      <span
        className={cn('grid shrink-0 place-items-center rounded-2xl', s.tile)}
        style={{ background: `${accent}1f`, color: accent }}
      >
        <Icon className={s.icon} />
      </span>

      <div className="min-w-0 flex-1">
        {/* 2 · Monto grande con CountUp al entrar al viewport */}
        <span
          className={cn(
            'block truncate font-extrabold leading-none tracking-tight tabular-nums',
            s.value,
            valueClassName ?? 'text-foreground'
          )}
        >
          {money ? (
            <Money value={value} compact={compact} count />
          ) : (
            <AnimatedNumber value={value} format={(n) => number(n)} />
          )}
        </span>

        {/* 3 · Título pequeño (último en la jerarquía) */}
        <span className={cn('mt-1 block font-medium uppercase tracking-[0.14em] text-muted-foreground', s.label)}>
          {label}
        </span>
      </div>
    </div>
  );
}
