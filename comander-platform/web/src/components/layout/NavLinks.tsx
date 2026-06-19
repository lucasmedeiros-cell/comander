'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ALL_ITEMS } from './nav-config';
import { cn } from '@/lib/utils';

interface NavLinksProps {
  /** Modo icono-solo (sidebar colapsado). */
  collapsed?: boolean;
  /** Se llama al navegar (cerrar el drawer móvil). */
  onNavigate?: () => void;
  /** Id único del indicador activo (evita choques entre sidebar y drawer). */
  layoutId?: string;
  /** Entrada escalonada de los ítems (sensación premium al abrir). */
  stagger?: boolean;
}

/**
 * Lista de navegación premium compartida por el sidebar (desktop) y el menú móvil.
 * Cada ítem tiene hover con glow sutil, microanimación del ícono y, en el activo,
 * un fondo elegante que se desliza entre opciones (layoutId) + barra lateral.
 */
export function NavLinks({ collapsed = false, onNavigate, layoutId = 'nav-active', stagger = false }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-1.5">
      {ALL_ITEMS.map(({ href, label, icon: Icon }, i) => {
        const active = pathname === href || pathname.startsWith(href + '/');

        const inner = (
          <Link
            href={href}
            title={label}
            onClick={onNavigate}
            className={cn(
              'group/item relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-3',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            {/* Fondo del activo: se DESLIZA entre opciones (slide lateral suave) */}
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/25 shadow-[0_8px_24px_-10px] shadow-primary/50"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              />
            )}
            {/* Barra lateral del activo */}
            {active && !collapsed && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            {/* Glow sutil al hover */}
            <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-primary/20 transition-opacity duration-200 group-hover/item:opacity-100" />

            <Icon
              className={cn(
                'relative z-10 h-[19px] w-[19px] shrink-0 transition-transform duration-200 group-hover/item:scale-110',
                active && 'text-primary'
              )}
            />
            {!collapsed && <span className="relative z-10 truncate">{label}</span>}
          </Link>
        );

        if (!stagger) return <React.Fragment key={href}>{inner}</React.Fragment>;
        return (
          <motion.div
            key={href}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {inner}
          </motion.div>
        );
      })}
    </div>
  );
}
