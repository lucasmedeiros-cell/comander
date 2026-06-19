// Exportación ligera a CSV en el cliente — sin dependencias. Genera un archivo
// descargable con BOM UTF-8 para que Excel respete los acentos.

function escapeCell(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const lines = [headers, ...rows].map((r) => r.map(escapeCell).join(','));
  const csv = '﻿' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
