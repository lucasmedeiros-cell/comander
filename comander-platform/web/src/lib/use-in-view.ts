'use client';

import * as React from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { useSettings } from '@/lib/store';

/**
 * Observa un elemento y devuelve `true` la primera vez que entra al viewport
 * (Intersection Observer vía Framer Motion, con `once: true`). El margen
 * negativo inferior hace que la animación dispare un poco antes de que el
 * elemento esté completamente visible, para una sensación más fluida.
 */
export function useInViewOnce<T extends Element = HTMLDivElement>(
  margin: `${number}px ${number}px ${number}% ${number}px` = '0px 0px -12% 0px'
) {
  const ref = React.useRef<T>(null);
  const inView = useInView(ref, { once: true, margin });
  return [ref, inView] as const;
}

/**
 * Indica si deben ejecutarse animaciones: respeta la preferencia del usuario
 * (ajustes) y `prefers-reduced-motion` del sistema.
 */
export function useMotionEnabled(): boolean {
  const animationsEnabled = useSettings((s) => s.animationsEnabled);
  const reduce = useReducedMotion();
  return animationsEnabled && !reduce;
}
