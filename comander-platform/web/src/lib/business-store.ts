'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business, BusinessApiConfig, BusinessEvent, BusinessEventType } from '@/types';
import { useUi } from '@/lib/store';

// ───────────────────────────────────────────────────────────────────────────
// Store central de gestión de empresas.
//
// Commander no tiene backend propio para CRUD de empresas, así que toda la
// administración (crear, editar, configurar API, ocultar, reordenar, eliminar)
// se persiste en este store y se *fusiona* sobre el dataset base (demo o API).
// De esta forma los cambios se reflejan al instante en el Inicio, el carrusel,
// las tarjetas y el panel de detalle, sin intervención técnica.
//
//   added     → empresas creadas localmente
//   overrides → ediciones aplicadas sobre cualquier empresa (demo incluida)
//   deleted   → empresas eliminadas (se ocultan de forma permanente)
//   hidden    → empresas ocultas del Inicio (siguen "sincronizando")
//   order     → orden visual personalizado (drag & drop)
//   apiConfig → credenciales y parámetros de conexión por empresa
//   events    → historial de actividad por empresa
// ───────────────────────────────────────────────────────────────────────────

// Contador monotónico para ids únicos aunque se creen varias en el mismo ms.
let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

interface BusinessStore {
  added: Business[];
  overrides: Record<string, Partial<Business>>;
  deleted: string[];
  hidden: string[];
  order: string[];
  apiConfig: Record<string, BusinessApiConfig>;
  events: Record<string, BusinessEvent[]>;

  /** Registra una empresa nueva (creada desde el formulario). */
  addBusiness: (b: Business, cfg?: BusinessApiConfig) => void;
  /** Aplica una edición parcial a cualquier empresa (demo o local). */
  updateBusiness: (id: string, patch: Partial<Business>, detail?: string) => void;
  /** Elimina una empresa de forma permanente. */
  deleteBusiness: (id: string) => void;
  /** Alias histórico de deleteBusiness. */
  removeBusiness: (id: string) => void;
  /** Duplica la configuración de una empresa en una nueva. */
  duplicateBusiness: (source: Business, cfg?: BusinessApiConfig) => Business;
  /** Oculta/muestra una empresa en el Inicio (sigue sincronizando). */
  setHidden: (id: string, hidden: boolean) => void;
  /** Guarda el orden visual personalizado. */
  setOrder: (ids: string[]) => void;
  /** Guarda credenciales/parámetros de API de una empresa. */
  setApiConfig: (id: string, cfg: BusinessApiConfig) => void;
  /** Añade un evento al historial. */
  logEvent: (id: string, type: BusinessEventType, detail: string) => void;
}

const EVENT_DETAIL: Record<BusinessEventType, string> = {
  CREADA: 'Empresa creada',
  EDITADA: 'Datos actualizados',
  API_ACTUALIZADA: 'Conexión API actualizada',
  SINCRONIZADA: 'Sincronización ejecutada',
  OCULTADA: 'Ocultada del Inicio',
  VISIBLE: 'Visible en el Inicio',
  DESACTIVADA: 'Empresa desactivada',
  ACTIVADA: 'Empresa activada',
  DUPLICADA: 'Configuración duplicada',
  LOGO: 'Logotipo actualizado',
};

function appendEvent(
  events: Record<string, BusinessEvent[]>,
  id: string,
  type: BusinessEventType,
  detail: string
): Record<string, BusinessEvent[]> {
  const ev: BusinessEvent = { id: uid('ev'), type, detail: detail || EVENT_DETAIL[type], at: new Date().toISOString() };
  return { ...events, [id]: [ev, ...(events[id] ?? [])].slice(0, 50) };
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      added: [],
      overrides: {},
      deleted: [],
      hidden: [],
      order: [],
      apiConfig: {},
      events: {},

      addBusiness: (b, cfg) =>
        set((s) => ({
          added: [b, ...s.added],
          order: [b.id, ...s.order],
          apiConfig: cfg ? { ...s.apiConfig, [b.id]: cfg } : s.apiConfig,
          events: appendEvent(s.events, b.id, 'CREADA', `“${b.nombre}” creada`),
        })),

      updateBusiness: (id, patch, detail) =>
        set((s) => {
          // Las empresas locales se editan en su lugar; el resto vía overrides.
          const isLocal = s.added.some((b) => b.id === id);
          return {
            added: isLocal ? s.added.map((b) => (b.id === id ? { ...b, ...patch } : b)) : s.added,
            overrides: isLocal ? s.overrides : { ...s.overrides, [id]: { ...s.overrides[id], ...patch } },
            events: appendEvent(s.events, id, patch.logo !== undefined ? 'LOGO' : 'EDITADA', detail ?? ''),
          };
        }),

      deleteBusiness: (id) =>
        set((s) => {
          const { [id]: _o, ...overrides } = s.overrides;
          const { [id]: _c, ...apiConfig } = s.apiConfig;
          const { [id]: _e, ...events } = s.events;
          return {
            added: s.added.filter((b) => b.id !== id),
            deleted: s.deleted.includes(id) ? s.deleted : [...s.deleted, id],
            hidden: s.hidden.filter((x) => x !== id),
            order: s.order.filter((x) => x !== id),
            overrides,
            apiConfig,
            events,
          };
        }),

      removeBusiness: (id) => get().deleteBusiness(id),

      duplicateBusiness: (source, cfg) => {
        const copy: Business = {
          ...source,
          id: uid('b_local'),
          nombre: `${source.nombre} (copia)`,
          lastSync: new Date().toISOString(),
        };
        const config = cfg ?? get().apiConfig[source.id];
        set((s) => ({
          added: [copy, ...s.added],
          order: [copy.id, ...s.order],
          apiConfig: config ? { ...s.apiConfig, [copy.id]: config } : s.apiConfig,
          events: appendEvent(s.events, copy.id, 'DUPLICADA', `Duplicada desde “${source.nombre}”`),
        }));
        return copy;
      },

      setHidden: (id, hidden) =>
        set((s) => ({
          hidden: hidden ? (s.hidden.includes(id) ? s.hidden : [...s.hidden, id]) : s.hidden.filter((x) => x !== id),
          events: appendEvent(s.events, id, hidden ? 'OCULTADA' : 'VISIBLE', ''),
        })),

      setOrder: (ids) => set({ order: ids }),

      setApiConfig: (id, cfg) =>
        set((s) => ({
          apiConfig: { ...s.apiConfig, [id]: cfg },
          events: appendEvent(s.events, id, 'API_ACTUALIZADA', ''),
        })),

      logEvent: (id, type, detail) => set((s) => ({ events: appendEvent(s.events, id, type, detail) })),
    }),
    {
      name: 'comander-businesses',
      version: 2,
      // Conserva las empresas creadas con la versión anterior (solo tenía `added`);
      // el merge superficial completa los campos nuevos con sus valores por defecto.
      migrate: (persisted) => (persisted ?? {}) as Partial<BusinessStore>,
    }
  )
);

// Alias de compatibilidad para el código existente.
export const useAddedBusinesses = useBusinessStore;

// ───────────────────────────────────────────────────────────────────────────
// Resolución: fusiona el dataset base con los cambios del store.
// ───────────────────────────────────────────────────────────────────────────

function orderComparator(order: string[]) {
  const index = new Map(order.map((id, i) => [id, i] as const));
  return (a: Business, b: Business) => {
    const ia = index.has(a.id) ? (index.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const ib = index.has(b.id) ? (index.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    return ia - ib;
  };
}

/**
 * Lista resuelta de empresas: base + locales − eliminadas, con ediciones
 * aplicadas y ordenadas según el orden personalizado. Incluye las ocultas.
 */
export function useResolvedBusinesses(base: Business[]): Business[] {
  const added = useBusinessStore((s) => s.added);
  const overrides = useBusinessStore((s) => s.overrides);
  const deleted = useBusinessStore((s) => s.deleted);
  const order = useBusinessStore((s) => s.order);

  return React.useMemo(() => {
    const merged = [...base, ...added].filter((b) => !deleted.includes(b.id));
    const resolved = merged.map((b) => (overrides[b.id] ? { ...b, ...overrides[b.id] } : b));
    return resolved.sort(orderComparator(order));
  }, [base, added, overrides, deleted, order]);
}

/** Igual que useResolvedBusinesses pero excluye las empresas ocultas del Inicio. */
export function useVisibleBusinesses(base: Business[]): Business[] {
  const all = useResolvedBusinesses(base);
  const hidden = useBusinessStore((s) => s.hidden);
  return React.useMemo(() => all.filter((b) => !hidden.includes(b.id)), [all, hidden]);
}

/**
 * Empresa seleccionada que controla todo el Home. Resuelve el id guardado en
 * `useUi` contra la lista visible; si no hay selección válida, usa la primera.
 * Devuelve también el setter para cambiarla desde el carrusel/selector.
 */
export function useSelectedBusiness(visible: Business[]) {
  const selectedId = useUi((s) => s.selectedBusinessId);
  const setSelectedBusiness = useUi((s) => s.setSelectedBusiness);
  const selected = React.useMemo(
    () => visible.find((b) => b.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId]
  );
  return { selected, selectedId: selected?.id ?? null, setSelectedBusiness };
}
