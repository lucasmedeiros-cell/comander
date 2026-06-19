'use client';

import * as React from 'react';
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { LOGO_ACCEPT, LOGO_FORMATS, LOGO_MAX_BYTES } from '@/lib/empresas';
import { iniciales } from '@/lib/format';

/**
 * Subir / reemplazar / eliminar logotipo con vista previa instantánea.
 * Acepta PNG, JPG, SVG y WEBP. Devuelve un dataURL (o null al eliminar).
 */
export function LogoUploader({
  value,
  onChange,
  nombre,
  color,
}: {
  value: string | null;
  onChange: (logo: string | null) => void;
  nombre: string;
  color: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('El logotipo no debe superar los 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => toast.error('No se pudo leer la imagen');
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-1.5">
      <Label>Logotipo</Label>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={nombre || 'Logo'}
            className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
          />
        ) : (
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-lg font-bold text-white"
            style={{ background: color }}
          >
            {nombre ? iniciales(nombre) : <Upload className="h-5 w-5" />}
          </span>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? 'Reemplazar' : 'Subir logo'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{LOGO_FORMATS} · máx. 2 MB</p>
        </div>

        <input ref={inputRef} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={onPick} />
      </div>
    </div>
  );
}
