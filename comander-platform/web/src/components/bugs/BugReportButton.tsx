'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Bug, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { reportBug, ticketsConfigured, type BugType } from '@/lib/tickets';
import { cn } from '@/lib/utils';

/**
 * Botón flotante (FAB) "Reportar Bug" → panel central de Tickets
 * (POST /api/public/report). Tipo (Error/Optimización) + título + descripción +
 * captura opcional, en una sola petición.
 */
export function BugReportButton() {
  const pathname = usePathname();
  const email = useAuth((s) => s.user?.email);

  const [open, setOpen] = React.useState(false);
  const [tipo, setTipo] = React.useState<BugType>('error');
  const [titulo, setTitulo] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [sending, setSending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      toast.error('Completa título y descripción');
      return;
    }
    setSending(true);
    try {
      const num = await reportBug({ tipo, titulo, descripcion, file, email: email ?? undefined, url: pathname });
      toast.success(`Reporte enviado · ${num}`);
      setTitulo('');
      setDescripcion('');
      setFile(null);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el reporte');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reportar un problema"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-purple text-white shadow-xl ring-1 ring-white/10 transition-transform hover:scale-105 active:scale-95"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(45,126,255,0.45))' }}
      >
        <Bug className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" /> Reportar a soporte
            </DialogTitle>
          </DialogHeader>

          {!ticketsConfigured() && (
            <p className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
              El envío aún no está configurado (falta <code>NEXT_PUBLIC_TICKETS_API_KEY</code>). La interfaz
              funciona; al poner la API key del bot quedará operativo.
            </p>
          )}

          <form onSubmit={submit} className="space-y-3.5">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              {([['error', 'Error'], ['optimizacion', 'Optimización']] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTipo(val)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    tipo === val
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bug-titulo">Título</Label>
              <Input
                id="bug-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Resumen corto del problema"
                maxLength={160}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bug-desc">Descripción</Label>
              <textarea
                id="bug-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="¿Qué pasó? ¿Cómo reproducirlo?"
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus-visible:border-primary"
              />
            </div>

            {/* Captura */}
            <div className="space-y-1.5">
              <Label>Captura (opcional)</Label>
              {file ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Quitar" className="text-muted-foreground hover:text-danger">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  <ImagePlus className="h-4 w-4" /> Adjuntar imagen
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar reporte'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
