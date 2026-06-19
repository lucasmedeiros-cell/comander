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

  const digits = phone.replace(/\D/g, '');
  const valid = digits.length >= 7;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    // Modo demo: el teléfono identifica la sesión. Entra directo al panel.
    login(`${digits}@comander.app`);
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
        {/* ── Branding protagonista ── */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-40 w-64 overflow-hidden rounded-3xl bg-[#070b18] ring-1 ring-white/10 shadow-2xl"
          >
            <Image src="/logo.png" alt="COMANDER" fill sizes="256px" className="object-contain" priority />
          </motion.div>

          <h1 className="mt-8 text-4xl font-extrabold tracking-[0.18em] text-white sm:text-5xl">COMANDER</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.26em] text-white/45">
            Centro de Inteligencia Empresarial
          </p>
        </div>

        {/* ── Formulario mínimo: teléfono ── */}
        <form onSubmit={onSubmit} className="mx-auto mt-12 max-w-sm space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-white/70">Número de teléfono</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+58 412 000 0000"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-lg text-white outline-none transition-colors placeholder:text-white/30 focus:border-brand/60 focus:bg-white/10"
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
