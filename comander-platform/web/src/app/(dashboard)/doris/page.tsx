'use client';

import * as React from 'react';
import { Capacitor } from '@capacitor/core';
import { AudioLines, ExternalLink, FileText, ListChecks, Mic, ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// URL del servicio Doris. Cambiar a https://doris.petroboxinc.com cuando el DNS
// esté listo (ver Contexto-Doris.md).
const DORIS_URL = 'https://doris-app.netlify.app';

const FEATURES = [
  { icon: AudioLines, label: 'Graba la reunión', accent: '#2D7EFF' },
  { icon: FileText, label: 'Transcribe', accent: '#10B981' },
  { icon: ScrollText, label: 'Resumen ejecutivo', accent: '#8B5CF6' },
  { icon: ListChecks, label: 'Tareas y decisiones', accent: '#F59E0B' },
];

export default function DorisPage() {
  const [native, setNative] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setNative(Capacitor.isNativePlatform());
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doris"
        subtitle="Graba tus reuniones y obtén transcripción, resumen, tareas y decisiones automáticamente."
      >
        <Button asChild variant="outline" size="sm">
          <a href={DORIS_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Abrir aparte
          </a>
        </Button>
      </PageHeader>

      {/* Qué hace Doris */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.label} className="flex flex-col gap-2 p-4">
            <f.icon className="h-6 w-6 shrink-0" style={{ color: f.accent, filter: `drop-shadow(0 0 10px ${f.accent}55)` }} />
            <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
          </Card>
        ))}
      </div>

      {mounted && native ? (
        // En el APK: abrir en el navegador del sistema (micrófono nativo confiable).
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-purple text-white shadow-lg">
            <Mic className="h-8 w-8" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight">Asistente de reuniones</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Abre Doris para grabar tu reunión; al terminar tendrás la transcripción y el resumen con tareas y decisiones.
            </p>
          </div>
          <Button asChild size="lg">
            <a href={DORIS_URL} target="_blank" rel="noopener noreferrer">
              <Mic className="h-5 w-5" /> Abrir Doris
            </a>
          </Button>
        </Card>
      ) : (
        // En web: Doris embebido (con permiso de micrófono para grabar).
        <Card className="overflow-hidden p-0">
          <iframe
            src={DORIS_URL}
            title="Doris"
            className="h-[72vh] w-full border-0"
            allow="microphone; clipboard-write; fullscreen"
          />
        </Card>
      )}
    </div>
  );
}
