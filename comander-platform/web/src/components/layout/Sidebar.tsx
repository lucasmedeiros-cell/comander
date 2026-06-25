'use client';

import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { NavLinks } from './NavLinks';
import { useUi } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUi();

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="group relative z-30 hidden h-screen shrink-0 flex-col border-r border-white/[0.06] md:flex"
      style={{ background: 'linear-gradient(180deg, #04101e 0%, #020814 55%, #010610 100%)' }}
    >
      {/* Glow azul corporativo muy sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-52 w-52 -translate-x-1/2 rounded-full bg-brand/10 blur-[90px]"
      />

      {/* ── Logo protagonista (completo, sin recuadro), centrado ── */}
      <div className={cn('relative flex items-center justify-center', collapsed ? 'px-2 pb-3 pt-5' : 'px-3 pb-4 pt-6')}>
        <Logo height={collapsed ? 50 : 148} />
      </div>

      {/* Botón de colapso integrado (aparece al pasar el cursor) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-7 z-10 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#040f1e] text-muted-foreground opacity-0 shadow-md transition-all duration-200 hover:border-primary/40 hover:text-primary group-hover:opacity-100"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
      </button>

      {/* ── Navegación (pegada al logo) ── */}
      <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 pt-1">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55">
            Navegación
          </p>
        )}
        <NavLinks collapsed={collapsed} layoutId="sidebar-active" stagger />
      </nav>
    </motion.aside>
  );
}
