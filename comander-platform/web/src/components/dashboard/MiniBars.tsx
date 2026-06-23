'use client';

import { motion } from 'framer-motion';
import { useInViewOnce, useMotionEnabled } from '@/lib/use-in-view';
import { cn } from '@/lib/utils';

export interface MiniBar {
  label: string;
  value: number;
}

/**
 * Gráfica de barras simple y grande: comportamiento diario, legible en < 3s.
 * Las barras crecen de altura 0 a su valor real al entrar al viewport
 * (Intersection Observer), con duración ≈ 1s. Sin ejes ni librerías complejas.
 */
export function MiniBars({
  data,
  accent = '#2D7EFF',
  height = 160,
}: {
  data: MiniBar[];
  accent?: string;
  height?: number;
}) {
  const motionOn = useMotionEnabled();
  const [ref, inView] = useInViewOnce<HTMLDivElement>(undefined, 0.12);
  const max = Math.max(...data.map((d) => d.value), 1);
  const ready = !motionOn || inView;

  return (
    <div ref={ref} className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => {
        const target = Math.round((d.value / max) * (height - 40));
        return (
          <div key={`${d.label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-bold tabular-nums text-foreground">{d.value}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: ready ? target : 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: motionOn ? i * 0.035 : 0 }}
              className={cn('w-full max-w-[44px] rounded-t-xl')}
              style={{ background: `linear-gradient(180deg, ${accent}, ${accent}aa)` }}
            />
            <span className="truncate text-[10px] font-medium text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
