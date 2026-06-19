'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApiStatus, Business } from '@/types';
import { iniciales } from '@/lib/format';
import { Money } from '@/components/ui/money';
import { cn } from '@/lib/utils';

export interface CarouselItem {
  business: Business;
  ventas: number;
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
        {items.map(({ business: b, ventas, ganancia }, i) => {
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
                  {/* 1 · Logo protagonista */}
                  <div className="flex items-start justify-between">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt={b.nombre}
                        className="h-20 w-20 rounded-2xl border border-border object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-20 w-20 place-items-center rounded-2xl text-2xl font-extrabold text-white"
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

                  {/* 2 · Ventas (número protagonista) */}
                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ventas</p>
                    <p className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                      <Money value={ventas} compact />
                    </p>
                  </div>

                  {/* 3 · Ganancia */}
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {gananciaPositiva ? 'Ganancia' : 'Pérdida'}
                    </p>
                    <p className={cn('text-lg font-bold tracking-tight', gananciaPositiva ? 'text-success' : 'text-danger')}>
                      <Money value={ganancia} compact />
                    </p>
                  </div>

                  {/* 4 · Nombre (texto secundario) */}
                  <p className="mt-3 truncate border-t border-border pt-3 text-sm font-medium text-muted-foreground">
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
