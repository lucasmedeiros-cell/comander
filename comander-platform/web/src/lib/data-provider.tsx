'use client';

import * as React from 'react';
import type { Business, Transaction } from '@/types';
import { getDataset } from '@/lib/mock-data';
import { fetchBusinesses, fetchTransactions, type ApiBusiness, type ApiTransaction } from '@/lib/api';
import { useAuth } from '@/lib/store';

type Source = 'mock' | 'api';

interface DataContextValue {
  businesses: Business[];
  transactions: Transaction[];
  source: Source;
  loading: boolean;
  refresh: () => void;
}

const DataContext = React.createContext<DataContextValue | null>(null);

const PALETTE = ['#2D7EFF', '#10B981', '#8B5CF6', '#F59E0B', '#F97316', '#EF4444', '#60A5FA', '#14B8A6'];

function mapBusiness(b: ApiBusiness, i: number): Business {
  return {
    id: b.id,
    nombre: b.nombre,
    sector: b.sector,
    color: PALETTE[i % PALETTE.length],
    status: b.status,
    // El backend no expone estado de API por empresa; lo derivamos del estado del negocio.
    apiStatus: b.status === 'ACTIVE' ? 'CONNECTED' : 'DISCONNECTED',
    lastSync: b.updatedAt ?? new Date().toISOString(),
    metaMensual: Number(b.metaMensual ?? 0),
  };
}

function mapTransaction(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    businessId: t.businessId,
    type: t.type,
    amount: Number(t.amount),
    category: t.category,
    description: t.description,
    date: t.date,
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  const mock = React.useMemo(() => getDataset(), []);
  const [data, setData] = React.useState<{ businesses: Business[]; transactions: Transaction[] }>(mock);
  const [source, setSource] = React.useState<Source>('mock');
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    // Solo intentamos la API real si hay sesión real (no demo).
    if (!token || token === 'demo-token') {
      setData(mock);
      setSource('mock');
      return;
    }
    setLoading(true);
    try {
      const [bs, ts] = await Promise.all([fetchBusinesses(), fetchTransactions()]);
      if (Array.isArray(bs) && bs.length > 0) {
        setData({ businesses: bs.map(mapBusiness), transactions: (ts ?? []).map(mapTransaction) });
        setSource('api');
      } else {
        setData(mock);
        setSource('mock');
      }
    } catch {
      // Backend no disponible → seguimos con datos demo, sin romper la UI.
      setData(mock);
      setSource('mock');
    } finally {
      setLoading(false);
    }
  }, [token, mock]);

  React.useEffect(() => {
    load();
  }, [load]);

  const value: DataContextValue = {
    businesses: data.businesses,
    transactions: data.transactions,
    source,
    loading,
    refresh: load,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataset(): DataContextValue {
  const ctx = React.useContext(DataContext);
  if (!ctx) {
    // Respaldo defensivo si se usa fuera del provider.
    const mock = getDataset();
    return { ...mock, source: 'mock', loading: false, refresh: () => {} };
  }
  return ctx;
}
