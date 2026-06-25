'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { money } from '@/lib/format';
import { useSettings } from '@/lib/store';
import { useMotionEnabled } from '@/lib/use-in-view';
import { AnimatedNumber } from '@/components/ui/animated-number';

/** Máscara que reemplaza cualquier valor monetario en modo privacidad. */
export const MONEY_MASK = '****';

/** Indica si el modo "Ocultar Saldos" está activo. */
export function useBalancesHidden(): boolean {
  return useSettings((s) => s.balancesHidden);
}

/**
 * Devuelve un formateador de moneda que respeta el modo privacidad. Útil para
 * pasarlo a gráficas (tooltips, ejes) donde se necesita una función → string.
 */
export function useMaskedMoney() {
  const hidden = useBalancesHidden();
  const currency = useSettings((s) => s.currency);
  return React.useCallback(
    (value: number, opts?: { compact?: boolean; decimals?: number }) =>
      hidden ? MONEY_MASK : money(value, { ...opts, currency }),
    [hidden, currency]
  );
}

/**
 * Cruza con fundido (≈250 ms) entre el contenido real y la máscara cuando se
 * activa "Ocultar Saldos". Si el contenido es un número animado (CountUp), se
 * desmonta al ocultar para no contar en vano.
 */
export function MaskFade({
  hidden,
  children,
  className,
}: {
  hidden: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const motionOn = useMotionEnabled();

  if (!motionOn) {
    return <span className={className}>{hidden ? MONEY_MASK : children}</span>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={hidden ? 'masked' : 'value'}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {hidden ? <span className="align-middle tracking-[0.12em]">{MONEY_MASK}</span> : children}
      </motion.span>
    </AnimatePresence>
  );
}

interface MoneyProps {
  value: number;
  compact?: boolean;
  decimals?: number;
  /** Cuenta de 0 al valor (CountUp) al entrar al viewport. */
  count?: boolean;
  duration?: number;
  className?: string;
}

/**
 * Muestra un importe monetario. En modo "Ocultar Saldos" lo reemplaza por la
 * máscara con una transición de fundido. Mantiene CountUp cuando se solicita.
 */
export function Money({ value, compact, decimals, count = false, duration, className }: MoneyProps) {
  const hidden = useBalancesHidden();
  const currency = useSettings((s) => s.currency);
  const inner = count ? (
    <AnimatedNumber key={currency} value={value} duration={duration} format={(n) => money(n, { compact, decimals, currency })} />
  ) : (
    money(value, { compact, decimals, currency })
  );
  return (
    <MaskFade hidden={hidden} className={className}>
      {inner}
    </MaskFade>
  );
}
