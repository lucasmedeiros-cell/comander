import type { ThemeId } from '@/lib/store';

export interface Theme {
  id: ThemeId;
  label: string;
  /** Triplete HSL "H S% L%" usado en las variables CSS. */
  primary: string;
  brand: string;
  brandLight: string;
  accent: string;
  /** Hex equivalentes para las muestras de color del selector. */
  swatch: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/** Convierte un triplete HSL "H S% L%" a hex (#RRGGBB). */
function hslToHex(triplet: string): string {
  const [h, s, l] = triplet
    .replace(/%/g, '')
    .split(/\s+/)
    .map(Number);
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => {
    const color = lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function makeTheme(
  id: ThemeId,
  label: string,
  primary: string,
  brand: string,
  brandLight: string,
  accent: string
): Theme {
  return {
    id,
    label,
    primary,
    brand,
    brandLight,
    accent,
    swatch: {
      primary: hslToHex(primary),
      secondary: hslToHex(brandLight),
      accent: hslToHex(accent),
    },
  };
}

export const THEMES: Theme[] = [
  makeTheme('commander', 'Commander', '217 100% 59%', '217 100% 59%', '213 94% 68%', '195 100% 50%'),
  makeTheme('azul', 'Azul Corporativo', '221 83% 53%', '221 83% 53%', '217 91% 60%', '199 92% 60%'),
  makeTheme('oscuro', 'Oscuro Premium', '239 84% 67%', '239 84% 67%', '234 89% 74%', '234 89% 74%'),
  makeTheme('verde', 'Verde Ejecutivo', '160 84% 39%', '160 84% 39%', '152 76% 52%', '152 76% 52%'),
  makeTheme('naranja', 'Naranja Empresarial', '25 95% 53%', '25 95% 53%', '27 96% 61%', '27 96% 61%'),
  makeTheme('morado', 'Morado Tecnológico', '258 90% 66%', '258 90% 66%', '255 92% 76%', '255 92% 76%'),
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
