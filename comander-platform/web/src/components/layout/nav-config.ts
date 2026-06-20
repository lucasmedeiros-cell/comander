import { Building2, Home, Settings, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'alertas';
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Menú minimalista (Centro de Mando): solo lo esencial para decidir rápido.
export const NAV: NavSection[] = [
  {
    title: 'Navegación',
    items: [
      { href: '/inicio', label: 'Inicio', icon: Home },
      { href: '/empresas', label: 'Empresas', icon: Building2 },
      { href: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((s) => s.items);

export function titleForPath(pathname: string): string {
  const match = ALL_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  return match?.label ?? 'COMANDER';
}
