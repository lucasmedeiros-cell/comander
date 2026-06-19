'use client';

import * as React from 'react';
import { animate, useInView } from 'framer-motion';
import { useSettings } from '@/lib/store';

interface AnimatedNumberProps {
  /** Valor final al que contar. */
  value: number;
  /** Duración de la animación en ms. */
  duration?: number;
  /** Formatea cada fotograma (por ejemplo money o number). */
  format: (n: number) => string;
}

/**
 * Cuenta de 0 al valor indicado formateando cada fotograma (CountUp). El conteo
 * arranca cuando el número entra al viewport (Intersection Observer, una sola
 * vez). Si las animaciones están desactivadas en preferencias, muestra el valor
 * final de inmediato.
 */
export function AnimatedNumber({ value, duration = 1500, format }: AnimatedNumberProps) {
  const animationsEnabled = useSettings((s) => s.animationsEnabled);
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const [display, setDisplay] = React.useState(() => format(animationsEnabled ? 0 : value));

  React.useEffect(() => {
    if (!animationsEnabled) {
      setDisplay(format(value));
      return;
    }
    if (!inView) return; // espera a estar visible para contar
    const controls = animate(0, value, {
      duration: duration / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, animationsEnabled, inView]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
