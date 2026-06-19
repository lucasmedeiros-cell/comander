'use client';

// Carga diferida (code-splitting) de los gráficos. Recharts es pesado (~100 kB):
// al importarlo con next/dynamic se saca del bundle inicial de cada ruta y se
// descarga solo cuando el gráfico va a mostrarse, con un esqueleto entretanto.
// Los gráficos ya se renderizan en cliente (usan hooks/Recharts), por lo que
// `ssr: false` es coherente y no cambia el resultado visible.

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const Fallback = () => <Skeleton className="h-full min-h-[240px] w-full" />;

export const TrendArea = dynamic(
  () => import('./TrendArea').then((m) => m.TrendArea),
  { ssr: false, loading: Fallback }
);

export const DonutShare = dynamic(
  () => import('./DonutShare').then((m) => m.DonutShare),
  { ssr: false, loading: Fallback }
);

export const BarsByBusiness = dynamic(
  () => import('./BarsByBusiness').then((m) => m.BarsByBusiness),
  { ssr: false, loading: Fallback }
);
