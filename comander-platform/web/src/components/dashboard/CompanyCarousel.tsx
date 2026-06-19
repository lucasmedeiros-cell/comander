'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, Wallet } from 'lucide-react';
import type { ApiStatus, Business } from '@/types';
import { iniciales } from '@/lib/format';
import { StatBlock } from '@/components/dashboard/StatBlock';
import { cn } from '@/lib/utils';

export interface CarouselItem {
  business: Business;
  ventas: number;
  compras: number;
  ganancia: number;
}

// Semáforo de estado por empresa (spec): 🟢 Conectada · 🟡 Atención · 🔴 Error.
const STATUS: Record<ApiStatus, { label: string; dot: string; text: string; emoji: string }> = {
  CONNECTED: { label: 'Conectada', dot: '#10B981', text: 'text-success', emoji: '🟢' },
  DISCONNECTED: { label: 'Atención', dot: '#F59E0B', text: 'text-warning', emoji: '🟡' },
  ERROR: { label: 'Error', dot: '#EF4444', text: 'text-danger', emoji: '🔴' },
};

/**
 * Carrusel horizontal de empresas para el Inicio.
 *  • Móvil: swipe nativo con scroll-snap suave.
 *  • Desktop: flechas para desplazar; el logo es protagonista.
 */
export function CompanyCarousel({ items }: { items: CarouselItem[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      {/* Flechas (desktop) */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByCards(-1)}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-colors hover:bg-accent lg:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scrollByCards(1)}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-colors hover:bg-accent lg:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ business: b, ventas, compras, ganancia }, i) => {
          const st = STATUS[b.apiStatus];
          const gananciaPositiva = ganancia >= 0;
          return (
            <motion.div
              key={b.id}
              data-card
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.35 } }}
              className="w-[78%] shrink-0 snap-start sm:w-[300px]"
            >
              <Link
                href={`/empresas/${b.id}`}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="h-1.5" style={{ background: b.color }} />
                <div className="p-5">
                  {/* Logo de marca + semáforo de estado (encabezado compacto) */}
                  <div className="flex items-center justify-between">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt={b.nombre}
                        className="h-12 w-12 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-12 w-12 place-items-center rounded-xl text-base font-extrabold text-white"
                        style={{ background: b.color }}
                      >
                        {iniciales(b.nombre)}
                      </span>
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold',
                        st.text
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                  </div>

                  {/* Jerarquía invertida: ÍCONO → MONTO → TÍTULO (Ventas · Compras · Ganancia) */}
                  <div className="mt-5 space-y-4">
                    <StatBlock icon={ShoppingCart} label="Ventas" value={ventas} accent="#2D7EFF" />
                    <StatBlock icon={ShoppingBag} label="Compras" value={compras} accent="#F59E0B" />
                    <StatBlock
                      icon={Wallet}
                      label={gananciaPositiva ? 'Ganancia' : 'Pérdida'}
                      value={ganancia}
                      accent={gananciaPositiva ? '#10B981' : '#EF4444'}
                      valueClassName={gananciaPositiva ? 'text-success' : 'text-danger'}
                    />
                  </div>

                  {/* Nombre — último en la jerarquía visual */}
                  <p className="mt-4 truncate border-t border-border pt-3 text-sm font-medium text-muted-foreground">
                    {b.nombre}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
