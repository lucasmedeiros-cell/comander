'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { MaskFade, useBalancesHidden } from '@/components/ui/money';
import { DeltaBadge } from './DeltaBadge';
import { useMotionEnabled } from '@/lib/use-in-view';
import { cn } from '@/lib/utils';

export interface MetricAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface MetricCardProps {
  /** Nombre de la métrica (se muestra PEQUEÑO, según jerarquía visual). */
  name: string;
  /** Valor numérico crudo — se anima de 0 al valor (CountUp). */
  value: number;
  /** Formatea cada fotograma del conteo (money/number). */
  format: (n: number) => string;
  icon: LucideIcon;
  /** Variación porcentual respecto al periodo anterior. */
  delta?: number;
  /** Si false (p. ej. Compras), una subida se pinta en rojo. */
  positiveIsGood?: boolean;
  accent?: string;
  index?: number;
  /** Acciones de la tarjeta (ninguna tarjeta es decorativa). */
  actions?: MetricAction[];
  /** Si es un valor monetario, se oculta en modo "Ocultar Saldos". Por defecto sí. */
  secret?: boolean;
}

/**
 * Tarjeta principal con JERARQUÍA VISUAL explícita:
 *   1) Ícono  2) Monto (domina)  3) Tendencia  4) Nombre (pequeño)
 * Más una fila de acciones siempre presente.
 */
export function MetricCard({
  name,
  value,
  format,
  icon: Icon,
  delta,
  positiveIsGood = true,
  accent = '#2D7EFF',
  index = 0,
  actions = [],
  secret = true,
}: MetricCardProps) {
  const enabled = useMotionEnabled();
  const balancesHidden = useBalancesHidden();

  return (
    <motion.div
      initial={enabled ? { opacity: 0, y: 18, scale: 0.96 } : false}
      whileInView={enabled ? { opacity: 1, y: 0, scale: 1 } : undefined}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: enabled ? 0.5 : 0, delay: enabled ? index * 0.1 : 0, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Card className="relative h-full overflow-hidden p-5">
        {/* Halo de acento */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.1] blur-2xl"
          style={{ background: accent }}
        />

        {/* 1) ÍCONO — integrado a la tarjeta (sin caja), acento + halo sutil */}
        <Icon
          className="h-7 w-7 shrink-0 transition-all duration-200"
          style={{ color: accent, filter: `drop-shadow(0 0 12px ${accent}55)` }}
        />

        {/* 2) MONTO (domina visualmente) */}
        <p className="mt-4 text-4xl font-extrabold leading-none tracking-tight text-foreground">
          <MaskFade hidden={secret && balancesHidden}>
            <AnimatedNumber value={value} format={format} />
          </MaskFade>
        </p>

        {/* 3) TENDENCIA + 4) NOMBRE (pequeño) */}
        <div className="mt-2 flex items-center gap-2">
          {delta !== undefined && <DeltaBadge value={delta} positiveIsGood={positiveIsGood} />}
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {name}
          </span>
        </div>

        {/* Acciones — siempre presentes */}
        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {actions.map((a) => {
              const cls =
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';
              return a.href ? (
                <Link key={a.label} href={a.href} className={cls}>
                  <a.icon className="h-3.5 w-3.5" /> {a.label}
                </Link>
              ) : (
                <button key={a.label} type="button" onClick={a.onClick} className={cls}>
                  <a.icon className="h-3.5 w-3.5" /> {a.label}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="h-full p-5">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <Skeleton className="mt-4 h-9 w-32" />
      <Skeleton className="mt-3 h-4 w-24" />
      <Skeleton className="mt-4 h-7 w-full" />
    </Card>
  );
}
