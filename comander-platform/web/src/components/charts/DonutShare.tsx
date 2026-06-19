'use client';

import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useMounted } from '@/lib/use-mounted';
import { useInViewOnce, useMotionEnabled } from '@/lib/use-in-view';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Money, useMaskedMoney } from '@/components/ui/money';
import { ChartEmpty } from './ChartEmpty';
import { Skeleton } from '@/components/ui/skeleton';

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

function DonutShareImpl({ data, height = 240 }: { data: DonutDatum[]; height?: number }) {
  const mounted = useMounted();
  const animationsEnabled = useMotionEnabled();
  const maskedMoney = useMaskedMoney();
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
  const total = data.reduce((a, b) => a + b.value, 0);
  // El círculo se "dibuja" al entrar al viewport, pero los datos se renderizan
  // SIEMPRE (no se difiere el montaje → nunca queda en blanco).
  const animate = animationsEnabled && inView;
  const hasData = Array.isArray(data) && data.length > 0 && total > 0;

  if (!mounted) return <Skeleton style={{ height }} className="w-full" />;
  if (!hasData) return <div ref={ref}><ChartEmpty height={height} /></div>;

  return (
    <div ref={ref} className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
            <PieChart key={animate ? 'anim' : 'static'}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={animate}
                animationDuration={1200}
                animationBegin={150}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n) => [maskedMoney(Number(v)), n as string]}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-lg font-bold">
              <Money value={total} compact count duration={1200} />
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                {d.label}
              </span>
              <span className="font-medium tabular-nums">
                <AnimatedNumber value={pct} duration={1200} format={(n) => `${Math.round(n)}%`} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const DonutShare = memo(DonutShareImpl);
