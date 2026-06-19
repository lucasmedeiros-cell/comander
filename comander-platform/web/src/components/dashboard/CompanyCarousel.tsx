'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApiStatus, Business } from '@/types';
import { iniciales } from '@/lib/format';
import { cn } from '@/lib/utils';

// Semáforo de estado por empresa: 🟢 Conectada · 🟡 Atención · 🔴 Error.
const STATUS: Record<ApiStatus, { label: string; dot: string; text: string }> = {
  CONNECTED: { label: 'Conectada', dot: '#10B981', text: 'text-success' },
  DISCONNECTED: { label: 'Atención', dot: '#F59E0B', text: 'text-warning' },
  ERROR: { label: 'Error', dot: '#EF4444', text: 'text-danger' },
};

interface CompanyCarouselProps {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Carrusel SELECTOR de empresas (parte inferior del Home). Su única función es
 * elegir la empresa activa: al tocar una tarjeta se actualiza todo el Home.
 * Muestra solo lo esencial — logo, nombre y estado — sin datos numéricos.
 *  • Móvil: swipe/drag con scroll-snap.
 *  • Desktop: flechas. Si hay muchas empresas, se desliza automáticamente.
 */
export function CompanyCarousel({ businesses, selectedId, onSelect }: CompanyCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrollByCards = React.useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const amount = card ? card.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }, []);

  // Auto-desplazamiento suave cuando hay muchas empresas (se pausa al interactuar).
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el || businesses.length <= 4) return;
    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerdown', pause);
    el.addEventListener('pointerleave', resume);
    const t = setInterval(() => {
      if (paused) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
      else scrollByCards(1);
    }, 3200);
    return () => {
      clearInterval(t);
      el.removeEventListener('pointerenter', pause);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('pointerleave', resume);
    };
  }, [businesses.length, scrollByCards]);

  if (businesses.length === 0) return null;

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
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {businesses.map((b, i) => {
          const st = STATUS[b.apiStatus];
          const active = b.id === selectedId;
          return (
            <motion.button
              key={b.id}
              data-card
              type="button"
              onClick={() => onSelect(b.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'group relative w-[46%] shrink-0 snap-start rounded-2xl border bg-card p-4 text-left transition-all sm:w-[210px]',
                active
                  ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              )}
            >
              {active && (
                <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              {/* Logo */}
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.nombre} className="h-14 w-14 rounded-xl border border-border object-cover" />
              ) : (
                <span
                  className="grid h-14 w-14 place-items-center rounded-xl text-lg font-extrabold text-white"
                  style={{ background: b.color }}
                >
                  {iniciales(b.nombre)}
                </span>
              )}

              {/* Nombre */}
              <p className="mt-3 truncate text-sm font-semibold text-foreground">{b.nombre}</p>

              {/* Estado */}
              <span className={cn('mt-1 inline-flex items-center gap-1.5 text-xs font-medium', st.text)}>
                <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                {st.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
