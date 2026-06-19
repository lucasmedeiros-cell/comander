import {
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  Home,
  Plug,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

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

export const NAV: NavSection[] = [
  {
    title: 'Navegación',
    items: [
      { href: '/inicio', label: 'Inicio', icon: Home },
      { href: '/empresas', label: 'Empresas', icon: Building2 },
      { href: '/ingresos', label: 'Ventas', icon: TrendingUp },
      { href: '/egresos', label: 'Compras', icon: TrendingDown },
      { href: '/rentabilidad', label: 'Rentabilidad', icon: Trophy },
    ],
  },
  {
    title: 'Análisis',
    items: [
      { href: '/copiloto', label: 'Copiloto IA', icon: Sparkles },
      { href: '/reportes', label: 'Reportes', icon: FileText },
      { href: '/analitica', label: 'Analítica', icon: BarChart3 },
      { href: '/alertas', label: 'Alertas', icon: AlertTriangle, badgeKey: 'alertas' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/integraciones', label: 'Integraciones', icon: Plug },
      { href: '/usuarios', label: 'Usuarios y Roles', icon: Users },
      { href: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((s) => s.items);

export function titleForPath(pathname: string): string {
  const match = ALL_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  return match?.label ?? 'COMANDER';
}
