'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendArea, BarsByBusiness } from '@/components/charts/lazy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { InfoHint } from '@/components/ui/info-hint';
import { useDataset } from '@/lib/data-provider';
import { aggregateSeries, type Granularity } from '@/lib/metrics';
import { money, number } from '@/lib/format';
import { Money, useMaskedMoney } from '@/components/ui/money';
import type { TransactionType } from '@/types';

const moneyCompact = (n: number) => money(n, { compact: true });
const numberPlain = (n: number) => number(n);

interface FlowSectionProps {
  type: TransactionType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
}

const GRANS: Array<{ key: string; label: string; g: Granularity; count: number }> = [
  { key: 'd', label: 'Diario', g: 'day', count: 30 },
  { key: 'w', label: 'Semanal', g: 'week', count: 16 },
  { key: 'm', label: 'Mensual', g: 'month', count: 12 },
  { key: 'y', label: 'Anual', g: 'year', count: 4 },
];

export function FlowSection({ type, title, subtitle, icon, accent }: FlowSectionProps) {
  const { businesses, transactions } = useDataset();
  const fmt = useMaskedMoney();
  const key = type === 'INCOME' ? 'ingresos' : 'egresos';

  const flowTx = React.useMemo(() => transactions.filter((t) => t.type === type), [transactions, type]);
  const total = flowTx.reduce((a, t) => a + t.amount, 0);
  const promedioDiario = total / 120;

  // Por empresa (acumulado total del periodo demo)
  const byBusiness = React.useMemo(
    () =>
      businesses
        .map((b) => ({
          label: b.nombre.length > 14 ? b.nombre.slice(0, 13) + '…' : b.nombre,
          value: flowTx.filter((t) => t.businessId === b.id).reduce((a, t) => a + t.amount, 0),
          color: b.color,
        }))
        .sort((a, b) => b.value - a.value),
    [businesses, flowTx]
  );

  const seriesByGran = React.useMemo(() => {
    const m: Record<string, ReturnType<typeof aggregateSeries>> = {};
    GRANS.forEach((gr) => (m[gr.key] = aggregateSeries(flowTx, gr.g, gr.count)));
    return m;
  }, [flowTx]);

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={0} href="/analitica" label={`${title} (acumulado)`} value={money(total, { compact: true })} rawValue={total} format={moneyCompact} icon={icon} accent={accent} secret />
        <KpiCard index={1} href="/analitica" label="Promedio diario" value={money(promedioDiario, { compact: true })} rawValue={promedioDiario} format={moneyCompact} icon={icon} accent={accent} secret />
        <KpiCard index={2} href="/empresas" label="Empresa líder" value={byBusiness[0]?.label ?? '—'} icon={icon} accent={accent} hint={fmt(byBusiness[0]?.value ?? 0, { compact: true })} />
        <KpiCard index={3} href="/empresas" label="Movimientos" value={String(flowTx.length)} rawValue={flowTx.length} format={numberPlain} icon={icon} accent={accent} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Evolución de {title.toLowerCase()}
              <InfoHint text="Cambia entre vista diaria, semanal, mensual o anual." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="d">
              <TabsList>
                {GRANS.map((gr) => (
                  <TabsTrigger key={gr.key} value={gr.key}>{gr.label}</TabsTrigger>
                ))}
              </TabsList>
              {GRANS.map((gr) => (
                <TabsContent key={gr.key} value={gr.key}>
                  <TrendArea data={seriesByGran[gr.key]} height={280} series={[key as 'ingresos' | 'egresos']} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{title} por empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <BarsByBusiness data={byBusiness} layout="vertical" height={280} name={title} color={accent} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo entre empresas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {byBusiness.map((b, i) => {
            const max = byBusiness[0]?.value || 1;
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="w-32 truncate text-sm">{b.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} />
                </div>
                <span className="w-20 text-right text-sm font-medium"><Money value={b.value} compact count /></span>
                <Badge variant="muted" className="hidden w-14 justify-center sm:flex">
                  {Math.round((b.value / byBusiness.reduce((a, x) => a + x.value, 0)) * 100)}%
                </Badge>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
