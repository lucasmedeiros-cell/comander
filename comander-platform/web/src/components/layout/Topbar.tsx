'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { HideBalancesToggle } from '@/components/dashboard/HideBalancesToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { NAV, titleForPath } from './nav-config';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/lib/store';
import { useDataset } from '@/lib/data-provider';
import { iniciales } from '@/lib/format';
import { DEMO_ALERTS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

function Clock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  return (
    <span className="hidden text-xs text-muted-foreground lg:inline">
      {now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
    </span>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { source } = useDataset();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const title = titleForPath(pathname);
  const unread = DEMO_ALERTS.filter((a) => !a.read).length;
  const live = source === 'api';

  function handleLogout() {
    logout();
    toast.success('Sesión cerrada');
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      {/* Menú móvil */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon-sm" className="md:hidden" aria-label="Abrir menú">
            <Menu className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-full max-w-[260px] translate-x-0 translate-y-0 rounded-none rounded-r-2xl">
          <div className="mb-2"><Logo /></div>
          <nav className="space-y-4">
            {NAV.map((s) => (
              <div key={s.title}>
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {s.title}
                </p>
                {s.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </DialogContent>
      </Dialog>

      {/* Título + reloj */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex',
              live ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            )}
            title={live ? 'Conectado al backend NestJS' : 'Mostrando datos de demostración'}
          >
            <span className={cn('h-1.5 w-1.5 animate-pulse rounded-full', live ? 'bg-success' : 'bg-warning')} />
            {live ? 'BACKEND EN VIVO' : 'DEMO'}
          </span>
        </div>
        <Clock />
      </div>

      <div className="flex-1" />

      {/* Buscador */}
      <div className="relative hidden w-56 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar empresa, reporte…" className="h-9 pl-9 text-xs" />
      </div>

      {/* Ocultar Saldos — disponible globalmente (modo privacidad) */}
      <HideBalancesToggle compact />

      <ThemeToggle />

      {/* Notificaciones */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" className="relative" aria-label="Alertas">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
            Alertas inteligentes
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DEMO_ALERTS.slice(0, 4).map((a) => (
            <DropdownMenuItem key={a.id} asChild>
              <Link href="/alertas" className="flex flex-col items-start gap-0.5">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      a.severity === 'CRITICAL' && 'bg-danger',
                      a.severity === 'WARNING' && 'bg-warning',
                      a.severity === 'INFO' && 'bg-brand'
                    )}
                  />
                  {a.title}
                </span>
                <span className="line-clamp-1 pl-3.5 text-[11px] text-muted-foreground">{a.message}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/alertas" className="justify-center text-xs font-medium text-primary">
              Ver todas las alertas
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Usuario */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full p-0.5 pr-1 outline-none ring-offset-background transition-colors hover:bg-accent">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-purple text-xs font-bold text-white">
              {user ? iniciales(user.nombre) : 'CM'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <div className="px-2 py-2">
            <p className="text-sm font-semibold">{user?.nombre ?? 'Usuario'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/usuarios"><UserIcon className="h-4 w-4" /> Mi perfil y roles</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/integraciones"><Settings className="h-4 w-4" /> Integraciones</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
