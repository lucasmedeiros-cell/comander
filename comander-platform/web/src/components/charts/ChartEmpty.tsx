'use client';

import { LineChart } from 'lucide-react';

/** Estado vacío elegante para gráficas sin datos (evita NaN/undefined/blancos). */
export function ChartEmpty({ height = 240, message = 'No existen datos para este periodo' }: { height?: number; message?: string }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-center"
      style={{ height }}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <LineChart className="h-5 w-5" />
      </span>
      <p className="px-6 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
