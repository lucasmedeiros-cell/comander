'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Lado en px (el logo es cuadrado: símbolo + COMANDER + DASHBOARD RESULTS). */
  height?: number;
  className?: string;
}

/**
 * Logo COMANDER completo y transparente (/logo-mark.png): símbolo + texto
 * COMANDER + DASHBOARD RESULTS. Sin recuadro ni fondo → se integra con el menú.
 * `object-contain` conserva proporciones (sin recortes ni distorsión).
 */
export function Logo({ height = 120, className }: LogoProps) {
  return (
    <div className={cn('relative', className)} style={{ width: height, height }}>
      <Image src="/logo-mark.png" alt="COMANDER" fill sizes={`${height}px`} className="object-contain" priority />
    </div>
  );
}
