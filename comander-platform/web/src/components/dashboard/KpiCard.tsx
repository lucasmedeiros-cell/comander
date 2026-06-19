'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { MaskFade, useBalancesHidden } from '@/components/ui/money';
import { DeltaBadge } from './DeltaBadge';
import { useMotionEnabled } from '@/lib/use-in-view';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  positiveIsGood?: boolean;
  hint?: string;
  accent?: string; // color hex del icono
  index?: number;
  /** Si se define, la tarjeta navega a esta ruta al hacer clic. */
  href?: string;
  /** Acción alternativa al clic (si no hay href). */
  onClick?: () => void;
  /** Valor numérico crudo: si se define junto a `format`, anima un conteo. */
  rawValue?: number;
  /** Formateador para `rawValue` (p.ej. money/number). */
  format?: (n: number) => string;
  /** Marca el valor como monetario: se oculta en modo "Ocultar Saldos". */
  secret?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  positiveIsGood = true,
  hint,
  accent = '#2D7EFF',
  index = 0,
  href,
  onClick,
  rawValue,
  format,
  secret = false,
}: KpiCardProps) {
  const enabled = useMotionEnabled();
  const balancesHidden = useBalancesHidden();
  const interactive = Boolean(href || onClick);
  const animated = rawValue !== undefined && format !== undefined;

  const card = (
    <Card
      className={cn(
        'relative h-full overflow-hidden p-5 transition-all',
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-brand/5'
      )}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {delta !== undefined && <DeltaBadge value={delta} positiveIsGood={positiveIsGood} />}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        <MaskFade hidden={secret && balancesHidden}>
          {animated ? <AnimatedNumber value={rawValue!} format={format!} /> : value}
        </MaskFade>
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>}
      {interactive && (
        <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary" />
      )}
    </Card>
  );

  return (
    <motion.div
      initial={enabled ? { opacity: 0, y: 16, scale: 0.96 } : false}
      whileInView={enabled ? { opacity: 1, y: 0, scale: 1 } : undefined}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: enabled ? 0.45 : 0, delay: enabled ? index * 0.08 : 0, ease: [0.16, 1, 0.3, 1] }}
      whileHover={interactive ? { y: -3 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className="group"
    >
      {href ? (
        <Link href={href} className="block h-full">
          {card}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className="block h-full w-full text-left">
          {card}
        </button>
      ) : (
        card
      )}
    </motion.div>
  );
}

/** Esqueleto de carga con la misma silueta que una KpiCard. */
export function KpiCardSkeleton() {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-2 h-4 w-32" />
    </Card>
  );
}
