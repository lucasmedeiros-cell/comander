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
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="group relative z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-card/40 md:flex"
    >
      {/* ── Header: logo grande + subtítulo, todo centrado ── */}
      <div className={cn('flex flex-col items-center text-center', collapsed ? 'px-2 pb-4 pt-5' : 'px-5 pb-5 pt-7')}>
        <motion.div layout transition={{ type: 'spring', stiffness: 280, damping: 30 }}>
          <Logo height={collapsed ? 34 : 116} />
        </motion.div>
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-4 text-[10px] font-medium uppercase leading-relaxed tracking-[0.22em] text-muted-foreground"
          >
            Centro de Inteligencia
            <br />
            Empresarial
          </motion.p>
        )}
      </div>

      {/* Botón de colapso: integrado al borde, aparece al pasar el cursor */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-all duration-200 hover:text-primary group-hover:opacity-100"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
      </button>

      {/* ── Navegación (inmediatamente debajo del logo) ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3">
        {!collapsed && (
          <p className="px-3 pb-2.5 text-center text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegación
          </p>
        )}
        <NavLinks collapsed={collapsed} layoutId="sidebar-active" stagger />
      </nav>

      {/* ── Footer: estado en tiempo real (ancla la base) ── */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand/10 to-purple/10 p-3',
            collapsed && 'justify-center'
          )}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Tiempo real activo</p>
              <p className="truncate text-[10px] text-muted-foreground">Datos sincronizados</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
