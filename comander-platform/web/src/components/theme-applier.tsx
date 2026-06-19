'use client';

import * as React from 'react';
import { useSettings } from '@/lib/store';
import { getTheme } from '@/lib/themes';

/**
 * Aplica el tema de marca activo (color primario + variables de marca) sobre
 * document.documentElement. Se combina con next-themes (claro/oscuro), que
 * sigue controlando los fondos y superficies.
 */
export function ThemeApplier() {
  const themeId = useSettings((s) => s.themeId);

  React.useEffect(() => {
    const theme = getTheme(themeId);
    const root = document.documentElement.style;
    root.setProperty('--primary', theme.primary);
    root.setProperty('--ring', theme.primary);
    root.setProperty('--brand', theme.brand);
    root.setProperty('--brand-light', theme.brandLight);
    root.setProperty('--brand-accent', theme.accent);
  }, [themeId]);

  return null;
}
