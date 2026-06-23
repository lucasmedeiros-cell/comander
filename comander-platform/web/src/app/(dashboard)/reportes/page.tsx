'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Download, FileSpreadsheet, FileText, Filter, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDataset } from '@/lib/data-provider';
import { useSettings } from '@/lib/store';
import { useMounted } from '@/lib/use-mounted';
import { generateExcel, generatePdf, type ReportFilters, type ReportKind } from '@/lib/reports';
import { cn } from '@/lib/utils';

const PDF_KINDS: Array<{ kind: ReportKind; label: string; desc: string }> = [
  { kind: 'resumen', label: 'Resumen ejecutivo', desc: 'Visión global con KPIs y ranking de empresas.' },
  { kind: 'ingresos', label: 'Ingresos', desc: 'Detalle de ingresos por empresa y categoría.' },
  { kind: 'egresos', label: 'Costos', desc: 'Detalle de costos por empresa y categoría.' },
  { kind: 'rentabilidad', label: 'Rentabilidad', desc: 'Rentabilidad y márgenes por empresa.' },
  { kind: 'comparativo', label: 'Comparativo de empresas', desc: 'Tabla comparativa entre todos los negocios.' },
];

export default function ReportesPage() {
  const { businesses, transactions } = useDataset();
  const reportsEnabled = useSettings((s) => s.reportsEnabled);
  const mounted = useMounted();
  const categories = React.useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort(),
    [transactions]
  );

  const [filters, setFilters] = React.useState<ReportFilters>({ businessId: 'all', category: 'all' });

  async function pdf(kind: ReportKind) {
    try {
      await generatePdf(kind, businesses, transactions, filters);
      toast.success('PDF generado y descargado');
    } catch {
      toast.error('No se pudo generar el PDF');
    }
  }
  async function excel(scope: 'completo' | 'filtrado') {
    try {
      await generateExcel(scope, businesses, transactions, filters);
      toast.success('Excel generado y descargado');
    } catch {
      toast.error('No se pudo generar el Excel');
    }
  }

  const set = (patch: Partial<ReportFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Mientras no esté montado, evitamos parpadeos por hidratación.
  if (mounted && !reportsEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reportes" subtitle="Genera reportes en PDF y Excel, filtrados a tu medida." />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="mx-auto max-w-lg p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">Los reportes están desactivados</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Activa el módulo de reportes desde Configuración para generar documentos en PDF y Excel.
            </p>
            <Button asChild className="mt-5">
              <Link href="/configuracion">
                <Settings className="h-4 w-4" /> Ir a Configuración
              </Link>
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" subtitle="Genera reportes en PDF y Excel, filtrados a tu medida." />

      {/* Filtros */}
      <Reveal>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <select
              value={filters.businessId}
              onChange={(e) => set({ businessId: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none"
            >
              <option value="all">Todas las empresas</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <select
              value={filters.category}
              onChange={(e) => set({ category: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm focus-visible:border-primary focus-visible:outline-none"
            >
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Desde</Label>
            <Input type="date" value={filters.from ?? ''} onChange={(e) => set({ from: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Hasta</Label>
            <Input type="date" value={filters.to ?? ''} onChange={(e) => set({ to: e.target.value })} />
          </div>
        </CardContent>
        </Card>
      </Reveal>

      <Reveal className="grid gap-4 lg:grid-cols-3">
        {/* PDF */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-danger" /> Reportes PDF
            </CardTitle>
            <p className="text-xs text-muted-foreground">Documentos listos para presentar o imprimir.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {PDF_KINDS.map((r, i) => (
              <motion.button
                key={r.kind}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ delay: i * 0.05 }}
                onClick={() => pdf(r.kind)}
                className="group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </motion.button>
            ))}
          </CardContent>
        </Card>

        {/* Excel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-success" /> Exportar a Excel
            </CardTitle>
            <p className="text-xs text-muted-foreground">Datos completos o según tus filtros.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExcelOption
              title="Datos completos"
              desc="Todos los movimientos + resumen por empresa."
              onClick={() => excel('completo')}
            />
            <ExcelOption
              title="Datos filtrados"
              desc="Solo lo que coincide con los filtros de arriba."
              onClick={() => excel('filtrado')}
              accent
            />
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <Building2 className="mb-1 h-4 w-4" />
              Tip: combina empresa + rango de fechas para una exportación personalizada.
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

function ExcelOption({ title, desc, onClick, accent }: { title: string; desc: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        accent ? 'border-success/40 bg-success/5' : 'border-border'
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
        <FileSpreadsheet className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
