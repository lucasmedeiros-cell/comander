'use client';

import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { number } from '@/lib/format';
import { useMounted } from '@/lib/use-mounted';
import { useInViewOnce, useMotionEnabled } from '@/lib/use-in-view';
import { useBalancesHidden } from '@/components/ui/money';
import { ChartTooltip } from './ChartTooltip';
import { ChartEmpty } from './ChartEmpty';
import { Skeleton } from '@/components/ui/skeleton';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarDatum[];
  height?: number;
  name?: string;
  color?: string;
  layout?: 'horizontal' | 'vertical';
}

function BarsByBusinessImpl({ data, height = 300, name = 'Valor', color = '#2D7EFF', layout = 'horizontal' }: Props) {
  const mounted = useMounted();
  const animationsEnabled = useMotionEnabled();
  const balancesHidden = useBalancesHidden();
  // Detecta la entrada al viewport para RE-formar las barras al hacer scroll.
  const [ref, inView] = useInViewOnce<HTMLDivElement>();

  // Datos siempre visibles si existen; estado vacío elegante en caso contrario.
  const hasData = Array.isArray(data) && data.some((d) => Number.isFinite(d.value) && d.value !== 0);
  // Las barras se renderizan SIEMPRE y CRECEN de 0 a su valor al montarse; al
  // entrar al viewport se remontan (key) para volver a crecer al hacer scroll.
  const animate = animationsEnabled;

  if (!mounted) return <Skeleton style={{ height }} className="w-full" />;
  if (!hasData) return <div ref={ref}><ChartEmpty height={height} /></div>;

  const vertical = layout === 'vertical';

  return (
    <div ref={ref} className="overflow-hidden" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
      <BarChart
        key={inView ? 'in' : 'pre'}
        data={data}
        layout={layout}
        margin={{ top: 8, right: 12, left: vertical ? 8 : -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={!vertical} vertical={vertical} />
        {vertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => (balancesHidden ? '' : number(Number(v), true))} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (balancesHidden ? '' : number(Number(v), true))} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
        <Bar dataKey="value" name={name} radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={48} isAnimationActive={animate} animationDuration={800} animationEasing="ease-out">
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
        </ResponsiveContainer>
    </div>
  );
}

export const BarsByBusiness = memo(BarsByBusinessImpl);
