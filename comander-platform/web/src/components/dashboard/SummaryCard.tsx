'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { Money } from '@/components/ui/money';
import { iniciales } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Tarjeta resumen premium (oscura) reutilizable:
 *   Ganancia (protagonista) + Ingresos y Costos con sus iconos.
 * Se usa para el consolidado (tarjeta principal, con selector de periodo en
 * `headerRight`) y para el resumen por empresa (con logo, sin selector).
 */
interface SummaryCardProps {
  eyebrow: string;
  title: string;
  /** undefined = sin slot de logo (consolidado); string|null = muestra logo/iniciales. */
  logo?: string | null;
  color?: string;
  ganancia: number;
  ingresos: number;
  costos: number;
  /** Contenido a la derecha del encabezado (p. ej. selector de periodo). */
  headerRight?: React.ReactNode;
  index?: number;
}

const ING_COLOR = '#2D7EFF';
const COST_COLOR = '#F59E0B';

export function SummaryCard({
  eyebrow,
  title,
  logo,
  color = ING_COLOR,
  ganancia,
  ingresos,
  costos,
  headerRight,
  index = 0,
}: SummaryCardProps) {
  const positive = ganancia >= 0;
  const hasLogoSlot = logo !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1224] via-[#0a0f1e] to-[#070b16] p-5 text-white shadow-2xl sm:p-7">
        {/* Glow sutil con el color de la empresa/marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full blur-[90px]"
          style={{ background: `${color}40` }}
        />

        <div className="relative">
          {/* Encabezado: (logo) + etiqueta/título + acción derecha */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {hasLogoSlot &&
                (logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={title} className="h-11 w-11 shrink-0 rounded-xl border border-white/10 object-cover" />
                ) : (
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                    style={{ background: color }}
                  >
                    {iniciales(title)}
                  </span>
                ))}
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">{eyebrow}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-white/70">{title}</p>
              </div>
            </div>
            {headerRight}
          </div>

          {/* Ganancia (protagonista, CountUp) */}
          <p
            className={cn(
              'fluid-hero mt-4 max-w-full whitespace-nowrap font-extrabold tracking-tight tabular-nums',
              positive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            <Money value={ganancia} count />
          </p>

          {/* Ingresos + Costos con sus iconos */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 shrink-0" style={{ color: ING_COLOR, filter: `drop-shadow(0 0 8px ${ING_COLOR}66)` }} />
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Ingresos</p>
              </div>
              <p className="fluid-amount-sm mt-1.5 truncate font-bold tabular-nums text-white">
                <Money value={ingresos} count />
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0" style={{ color: COST_COLOR, filter: `drop-shadow(0 0 8px ${COST_COLOR}66)` }} />
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Costos</p>
              </div>
              <p className="fluid-amount-sm mt-1.5 truncate font-bold tabular-nums text-white">
                <Money value={costos} count />
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
