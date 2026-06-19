'use client';

import { memo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesPoint } from '@/types';
import { number } from '@/lib/format';
import { useMounted } from '@/lib/use-mounted';
import { useInViewOnce, useMotionEnabled } from '@/lib/use-in-view';
import { useBalancesHidden } from '@/components/ui/money';
import { ChartTooltip } from './ChartTooltip';
import { ChartEmpty } from './ChartEmpty';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendAreaProps {
  data: SeriesPoint[];
  height?: number;
  series?: Array<'ingresos' | 'egresos' | 'rentabilidad'>;
}

const COLORS: Record<string, string> = {
  ingresos: '#2D7EFF',
  egresos: '#F59E0B',
  rentabilidad: '#10B981',
};

const LABELS: Record<string, string> = {
  ingresos: 'Ventas',
  egresos: 'Compras',
  rentabilidad: 'Rentabilidad',
};

function TrendAreaImpl({ data, height = 300, series = ['ingresos', 'egresos'] }: TrendAreaProps) {
  const mounted = useMounted();
  const animationsEnabled = useMotionEnabled();
  const balancesHidden = useBalancesHidden();
  const [ref, inView] = useInViewOnce<HTMLDivElement>();

  // Validación de datos: la gráfica SIEMPRE muestra datos si existen; si no,
  // un estado vacío elegante (nunca un componente en blanco, NaN o undefined).
  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((d) => series.some((s) => Number.isFinite(d[s]) && d[s] !== 0));

  // La animación de "dibujado" se dispara al entrar al viewport, pero los datos
  // se renderizan SIEMPRE (no se difiere el montaje → nunca se queda vacía).
  const animate = animationsEnabled && inView;

  if (!mounted) return <Skeleton style={{ height }} className="w-full" />;
  if (!hasData) return <div ref={ref}><ChartEmpty height={height} /></div>;

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
      <AreaChart key={animate ? 'anim' : 'static'} data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[s]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS[s]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => (balancesHidden ? '' : number(Number(v), true))}
        />
        <Tooltip content={<ChartTooltip />} />
        {series.map((s) =>
          s === 'rentabilidad' ? (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={LABELS[s]}
              stroke={COLORS[s]}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={animate}
              animationDuration={1400}
            />
          ) : (
            <Area
              key={s}
              type="monotone"
              dataKey={s}
              name={LABELS[s]}
              stroke={COLORS[s]}
              strokeWidth={2.5}
              fill={`url(#grad-${s})`}
              isAnimationActive={animate}
              animationDuration={1400}
            />
          )
        )}
      </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const TrendArea = memo(TrendAreaImpl);
