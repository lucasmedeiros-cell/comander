'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Bug, ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { listMyTickets, reportBug, ticketsConfigured, type BugType, type TicketSummary } from '@/lib/tickets';
import { haceCuanto } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Botón flotante (FAB) "Reportar Bug" → panel central de Tickets.
 * Modal con dos pestañas: Nuevo / Mis Tickets. Sigue el flujo de INTEGRACION_BUGS.md.
 */
export function BugReportButton() {
  const pathname = usePathname();
  const email = useAuth((s) => s.user?.email);

  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<'nuevo' | 'mis'>('nuevo');

  const [tipo, setTipo] = React.useState<BugType>('error');
  const [titulo, setTitulo] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [sending, setSending] = React.useState(false);

  const [tickets, setTickets] = React.useState<TicketSummary[] | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);

  const loadTickets = React.useCallback(async () => {
    setLoadingList(true);
    try {
      setTickets(await listMyTickets());
    } catch {
      setTickets([]);
      toast.error('No se pudieron cargar los tickets');
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && tab === 'mis' && tickets === null) void loadTickets();
  }, [open, tab, tickets, loadTickets]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('Escribe un título para el reporte');
      return;
    }
    setSending(true);
    try {
      const num = await reportBug({ tipo, titulo, descripcion, file, email: email ?? undefined, url: pathname });
      toast.success(`Reporte enviado · ${num}`);
      setTitulo('');
      setDescripcion('');
      setFile(null);
      setTickets(null);
      setTab('mis');
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
              El envío aún no está configurado (falta el token del bot de Tickets). La interfaz funciona; al
              configurar <code>NEXT_PUBLIC_TICKETS_BOT_TOKEN</code> quedará operativo.
            </p>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'nuevo' | 'mis')}>
            <TabsList className="w-full">
              <TabsTrigger value="nuevo" className="flex-1">Nuevo</TabsTrigger>
              <TabsTrigger value="mis" className="flex-1">Mis Tickets</TabsTrigger>
            </TabsList>

            {/* ── Nuevo ── */}
            <TabsContent value="nuevo">
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
                    maxLength={120}
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
            </TabsContent>

            {/* ── Mis Tickets ── */}
            <TabsContent value="mis">
              {loadingList ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{t.titulo ?? `Ticket ${t.id}`}</p>
                        {t.estado && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                            {t.estado}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {t.numero_ticket ?? `#${t.id}`}
                        {(t.fecha_creacion ?? t.created_at) ? ` · ${haceCuanto((t.fecha_creacion ?? t.created_at)!)}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Aún no has enviado reportes.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
