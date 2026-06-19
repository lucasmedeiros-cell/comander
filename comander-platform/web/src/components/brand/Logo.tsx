'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Logo de COMANDER. Usa el archivo de marca en /public/logo.png.
 * El fondo navy (#010512) se funde con el borde del logo.
 */
export function Logo({ size = 34, showText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-[10px] ring-1 ring-white/10"
        style={{ width: size, height: size }}
      >
        <Image src="/logo.png" alt="COMANDER" fill sizes="40px" className="object-cover" priority />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-[0.14em] text-foreground">COMANDER</span>
          <span className="text-[8.5px] uppercase tracking-[0.22em] text-muted-foreground">
            Control Empresarial
          </span>
        </div>
      )}
    </div>
  );
}
