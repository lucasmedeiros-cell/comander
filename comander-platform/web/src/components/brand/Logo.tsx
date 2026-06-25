'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Alto en px del logo; el ancho se calcula con su proporción real. */
  height?: number;
  className?: string;
}

// Proporción real del logo recortado (sin márgenes transparentes) → más grande
// y con las letras (incluido DASHBOARD RESULTS) perfectamente legibles.
const RATIO = 1.147;

/**
 * Logo COMANDER completo y transparente, ajustado (sin recuadro): símbolo +
 * COMANDER + DASHBOARD RESULTS. `object-contain` conserva proporciones.
 */
export function Logo({ height = 150, className }: LogoProps) {
  const width = Math.round(height * RATIO);
  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <Image src="/logo-tight.png" alt="COMANDER" fill sizes={`${width}px`} className="object-contain" priority />
    </div>
  );
}
