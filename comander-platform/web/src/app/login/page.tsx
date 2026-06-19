'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/store';

/**
 * Login minimalista: únicamente número de teléfono + Continuar.
 * Se eliminó correo, contraseña, Google y Microsoft. El branding (logo + marca)
 * es el protagonista; el formulario es secundario.
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [phone, setPhone] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Solo 8 dígitos (Bolivia, prefijo fijo +591).
  const valid = phone.length === 8;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    // Modo demo: el teléfono identifica la sesión. Entra directo al panel.
    login(`591${phone}@comander.app`);
    router.replace('/inicio');
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#05070f] px-6 py-12">
      {/* Glows de marca de fondo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[130px]"
        animate={{ opacity: [0.4, 0.65, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-purple/20 blur-[120px]"
        animate={{ scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 9, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* ── Logo protagonista (completo, con sus letras) ── */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-56 w-[22rem] max-w-full overflow-hidden rounded-3xl bg-[#070b18] ring-1 ring-white/10 shadow-2xl"
          >
            <Image src="/logo.png" alt="COMANDER" fill sizes="352px" className="object-contain" priority />
          </motion.div>
        </div>

        {/* ── Formulario mínimo: teléfono (+591, 8 dígitos) ── */}
        <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-sm space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-white/70">Número de teléfono</Label>
            <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-white/5 transition-colors focus-within:border-brand/60 focus-within:bg-white/10">
              <span className="flex items-center gap-2 pl-4 pr-3 text-sm font-medium text-white/70">
                <Phone className="h-4 w-4 text-white/40" /> +591
              </span>
              <span className="h-6 w-px bg-white/10" />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                placeholder="7000 0000"
                className="h-full flex-1 bg-transparent px-4 text-base tracking-wide text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={!valid || submitting} className="h-14 w-full text-base">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                Continuar <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
