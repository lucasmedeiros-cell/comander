'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMotionEnabled } from '@/lib/use-in-view';

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  children?: React.ReactNode;
  /** Retraso (s) para escalonar secciones contiguas. */
  delay?: number;
  /** Desplazamiento vertical inicial (px). */
  y?: number;
  /** Efecto premium: ligero desenfoque inicial. */
  blur?: boolean;
  /** Duración (s). */
  duration?: number;
}

/**
 * Envoltura de aparición al hacer scroll: fade-in + slide-up + scale (0.95 → 1),
 * con desenfoque opcional. Se ejecuta UNA sola vez al entrar al viewport
 * (`viewport.once`). Si las animaciones están desactivadas o el usuario prefiere
 * movimiento reducido, renderiza el contenido sin animación.
 */
export function Reveal({ delay = 0, y = 20, blur = false, duration = 0.6, className, children, ...rest }: RevealProps) {
  const enabled = useMotionEnabled();

  if (!enabled) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.95, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
