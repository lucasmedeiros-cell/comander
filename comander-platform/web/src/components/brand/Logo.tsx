'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Alto en px del logo; el ancho se calcula con la proporción de la imagen. */
  height?: number;
  className?: string;
}

// Proporción real del archivo de marca (≈ 1.6:1).
const RATIO = 1.6;

/**
 * Logo de COMANDER (/public/logo.png) mostrado COMPLETO (object-contain), de modo
 * que se vean sus letras internas. Sin texto adicional al lado: el propio logo es
 * la marca. El fondo navy se funde con el del logo.
 */
export function Logo({ height = 40, className }: LogoProps) {
  const width = Math.round(height * RATIO);
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-xl bg-[#070b18] ring-1 ring-white/10', className)}
      style={{ width, height }}
    >
      <Image src="/logo.png" alt="COMANDER" fill sizes={`${width}px`} className="object-contain" priority />
    </div>
  );
}
