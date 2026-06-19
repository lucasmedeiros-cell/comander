'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import * as React from 'react';
import { Logo } from '@/components/brand/Logo';
import { NAV } from './nav-config';
import { useUi, useSettings } from '@/lib/store';
import { useMounted } from '@/lib/use-mounted';
import { cn } from '@/lib/utils';
import { DEMO_ALERTS } from '@/lib/mock-data';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUi();
  const reportsEnabled = useSettings((s) => s.reportsEnabled);
  const mounted = useMounted();
  const unread = DEMO_ALERTS.filter((a) => !a.read).length;

  // Oculta Reportes cuando están desactivados (tras montar, para evitar mismatch).
  const sections = React.useMemo(
    () =>
      NAV.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !(item.href === '/reportes' && mounted && !reportsEnabled)
        ),
      })).filter((section) => section.items.length > 0),
    [mounted, reportsEnabled]
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 74 : 248 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="relative z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-card/40 md:flex"
    >
      <div className="flex h-16 items-center px-4">
        <Logo showText={!collapsed} size={collapsed ? 32 : 34} />
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[68px] z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary"
        aria-label="Colapsar menú"
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
      </button>

      <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p
              className={cn(
                'px-3 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 transition-opacity',
                collapsed && 'opacity-0'
              )}
            >
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, badgeKey }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    )}
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && badgeKey === 'alertas' && unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                    {collapsed && badgeKey === 'alertas' && unread > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand/10 to-purple/10 p-3',
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
