'use client';

import { useEffect, useState } from 'react';

/** Evita desajustes de hidratación en componentes que dependen del cliente (gráficos, reloj). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
