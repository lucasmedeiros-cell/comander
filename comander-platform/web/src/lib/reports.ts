import type { Business, Transaction } from '@/types';
import { computePerformance } from '@/lib/metrics';

// Las librerías de exportación (jspdf, xlsx) son pesadas (~250 kB) y solo se
// necesitan al generar un archivo. Se cargan de forma diferida (lazy / code-split)
// para no inflar el bundle inicial de la app.

export interface ReportFilters {
  businessId: string | 'all';
  category: string | 'all';
  from?: string;
  to?: string;
}

export type ReportKind = 'resumen' | 'ingresos' | 'egresos' | 'rentabilidad' | 'comparativo';

const KIND_TITLE: Record<ReportKind, string> = {
  resumen: 'Resumen ejecutivo',
  ingresos: 'Reporte de ventas',
  egresos: 'Reporte de compras',
  rentabilidad: 'Reporte de rentabilidad',
  comparativo: 'Comparativo de empresas',
};

function filterTx(transactions: Transaction[], f: ReportFilters): Transaction[] {
  return transactions.filter((t) => {
    if (f.businessId !== 'all' && t.businessId !== f.businessId) return false;
    if (f.category !== 'all' && t.category !== f.category) return false;
    if (f.from && t.date < f.from) return false;
    if (f.to && t.date > f.to + 'T23:59:59') return false;
    return true;
  });
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export async function generatePdf(
  kind: ReportKind,
  businesses: Business[],
  transactions: Transaction[],
  f: ReportFilters
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  const tx = filterTx(transactions, f);
  const ingresos = tx.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
  const egresos = tx.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);

  // Encabezado
  doc.setFillColor(1, 5, 18);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('COMANDER', 14, 13);
  doc.setFontSize(9);
  doc.setTextColor(150, 170, 200);
  doc.text('Centro de control empresarial', 14, 20);
  doc.setTextColor(45, 126, 255);
  doc.setFontSize(12);
  doc.text(KIND_TITLE[kind], 196, 16, { align: 'right' });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  const empresaNombre =
    f.businessId === 'all' ? 'Todas las empresas' : businesses.find((b) => b.id === f.businessId)?.nombre ?? '—';
  doc.text(`Empresa: ${empresaNombre}`, 14, 38);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 44);

  // Tarjetas resumen
  autoTable(doc, {
    startY: 50,
    head: [['Ventas', 'Compras', 'Rentabilidad', 'Movimientos']],
    body: [[fmt(ingresos), fmt(egresos), fmt(ingresos - egresos), String(tx.length)]],
    theme: 'grid',
    headStyles: { fillColor: [45, 126, 255] },
  });

  if (kind === 'comparativo' || kind === 'rentabilidad' || kind === 'resumen') {
    const perf = computePerformance(businesses, transactions, 'mes');
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Empresa', 'Sector', 'Ventas', 'Compras', 'Rentabilidad', 'Margen']],
      body: perf
        .sort((a, b) => b.rentabilidad - a.rentabilidad)
        .map((p) => [
          p.business.nombre,
          p.business.sector,
          fmt(p.ingresos),
          fmt(p.egresos),
          fmt(p.rentabilidad),
          `${p.margen.toFixed(0)}%`,
        ]),
      theme: 'striped',
      headStyles: { fillColor: [11, 22, 38] },
    });
  }

  if (kind === 'ingresos' || kind === 'egresos') {
    const filtered = tx.filter((t) => (kind === 'ingresos' ? t.type === 'INCOME' : t.type === 'EXPENSE'));
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Fecha', 'Empresa', 'Categoría', 'Descripción', 'Monto']],
      body: filtered
        .slice(0, 40)
        .map((t) => [
          new Date(t.date).toLocaleDateString('es-CO'),
          businesses.find((b) => b.id === t.businessId)?.nombre ?? '—',
          t.category,
          t.description,
          fmt(t.amount),
        ]),
      theme: 'striped',
      headStyles: { fillColor: [11, 22, 38] },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`comander-${kind}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateExcel(
  scope: 'completo' | 'filtrado',
  businesses: Business[],
  transactions: Transaction[],
  f: ReportFilters
) {
  const XLSX = await import('xlsx');
  const tx = scope === 'completo' ? transactions : filterTx(transactions, f);
  const wb = XLSX.utils.book_new();

  // Hoja 1: Movimientos
  const movimientos = tx.map((t) => ({
    Fecha: new Date(t.date).toLocaleString('es-CO'),
    Empresa: businesses.find((b) => b.id === t.businessId)?.nombre ?? '—',
    Tipo: t.type === 'INCOME' ? 'Venta' : 'Compra',
    Categoría: t.category,
    Descripción: t.description,
    Monto: t.amount,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(movimientos), 'Movimientos');

  // Hoja 2: Resumen por empresa
  const perf = computePerformance(businesses, transactions, 'mes').map((p) => ({
    Empresa: p.business.nombre,
    Sector: p.business.sector,
    Ventas: Math.round(p.ingresos),
    Compras: Math.round(p.egresos),
    Rentabilidad: Math.round(p.rentabilidad),
    'Margen %': Number(p.margen.toFixed(1)),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perf), 'Resumen empresas');

  XLSX.writeFile(wb, `comander-datos-${scope}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
