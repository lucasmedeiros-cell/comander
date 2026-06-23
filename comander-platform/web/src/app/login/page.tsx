'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint, Loader2, Phone, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/store';
import {
  authenticateBiometric,
  biometricAvailable,
  isBiometricEnabled,
  registerBiometric,
} from '@/lib/webauthn';

/**
 * Login minimalista: número de teléfono + Continuar, con INGRESO CON HUELLA.
 * Tras el primer ingreso se puede registrar la huella del dispositivo; en las
 * siguientes visitas el usuario entra con su huella sin escribir nada.
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [phone, setPhone] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [bioSupported, setBioSupported] = React.useState(false);
  const [bioRegistered, setBioRegistered] = React.useState(false);
  const [enableBio, setEnableBio] = React.useState(true);
  const [bioBusy, setBioBusy] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const autoTried = React.useRef(false);

  // Etiqueta/ícono biométrico según el dispositivo (iPhone/iPad → Face ID).
  const BioIcon = isIOS ? ScanFace : Fingerprint;
  const bioLabel = isIOS ? 'Ingresar con Face ID' : 'Ingresar con huella';

  // Mínimo 7 dígitos (sin prefijo; el usuario escribe solo su número).
  const valid = phone.length >= 7;

  const enterWithBiometric = React.useCallback(async () => {
    setBioBusy(true);
    const email = await authenticateBiometric();
    if (email) {
      login(email);
      router.replace('/inicio');
    } else {
      setBioBusy(false);
    }
  }, [login, router]);

  // Detecta soporte + credencial registrada; si hay huella, intenta entrar solo.
  React.useEffect(() => {
    let active = true;
    (async () => {
      const supported = await biometricAvailable();
      const registered = isBiometricEnabled();
      if (!active) return;
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setBioSupported(supported);
      setBioRegistered(supported && registered);
      // Intento automático una sola vez (mejor esfuerzo; si el navegador exige
      // un gesto, el usuario usa el botón "Ingresar con huella").
      if (supported && registered && !autoTried.current) {
        autoTried.current = true;
        void enterWithBiometric();
      }
    })();
    return () => {
      active = false;
    };
  }, [enterWithBiometric]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    const email = `${phone}@comander.app`;
    // Si se activó, registra la huella DENTRO del gesto (antes de navegar).
    if (enableBio && bioSupported && !bioRegistered) {
      await registerBiometric(email);
    }
    login(email);
    router.replace('/inicio');
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070b18] px-6 py-12">
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
        {/* ── Logo integrado al fondo (mismo navy que la pantalla, sin recuadro) ── */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[min(22rem,80vw)] max-w-full"
            style={{ aspectRatio: '1.6 / 1' }}
          >
            <Image src="/logo.png" alt="COMANDER" fill sizes="(max-width: 640px) 80vw, 352px" className="object-contain" priority />
          </motion.div>
        </div>

        <div className="mx-auto mt-10 max-w-sm">
          {/* ── Ingreso con huella (usuarios ya registrados en este dispositivo) ── */}
          {bioRegistered && (
            <div className="mb-5 space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={enterWithBiometric}
                disabled={bioBusy}
                className="h-14 w-full text-base"
              >
                {bioBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <BioIcon className="h-5 w-5" /> {bioLabel}
                  </>
                )}
              </Button>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="h-px flex-1 bg-white/10" /> o con tu número <span className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          {/* ── Formulario: teléfono (solo el número, sin prefijo) ── */}
          <form onSubmit={onSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-white/70">Número de teléfono</Label>
              <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-white/5 transition-colors focus-within:border-brand/60 focus-within:bg-white/10">
                <Phone className="ml-4 h-5 w-5 shrink-0 text-white/40" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  maxLength={15}
                  placeholder="71234567"
                  className="h-full flex-1 bg-transparent px-3 text-base tracking-wide text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Activar huella en este dispositivo (solo si hay soporte y aún no está) */}
            {bioSupported && !bioRegistered && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-center gap-3">
                  <BioIcon className="h-5 w-5 text-brand-light" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{bioLabel}</p>
                    <p className="text-xs text-white/45">Actívalo para entrar sin escribir tu número</p>
                  </div>
                </div>
                <Switch checked={enableBio} onCheckedChange={setEnableBio} />
              </div>
            )}

            <Button type="submit" size="lg" disabled={!valid || submitting} className="h-14 w-full text-base">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  Continuar <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
