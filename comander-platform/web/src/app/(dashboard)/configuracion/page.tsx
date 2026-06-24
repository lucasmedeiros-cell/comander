'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Check, Coins, EyeOff, Fingerprint, Moon, Palette, PlayCircle, Sparkles, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettings, useAuth } from '@/lib/store';
import { THEMES, getTheme } from '@/lib/themes';
import { useMounted } from '@/lib/use-mounted';
import { biometricAvailable, disableBiometric, isBiometricEnabled, registerBiometric } from '@/lib/webauthn';
import { cn } from '@/lib/utils';

export default function ConfiguracionPage() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const user = useAuth((s) => s.user);
  const {
    themeId,
    animationsEnabled,
    introEnabled,
    reportsEnabled,
    currency,
    balancesHidden,
    setThemeId,
    setAnimationsEnabled,
    setIntroEnabled,
    setReportsEnabled,
    setCurrency,
    setBalancesHidden,
  } = useSettings();

  const active = getTheme(themeId);
  const isDark = theme !== 'light';

  // Ingreso con huella (WebAuthn) — gestión por dispositivo.
  const [bioSupported, setBioSupported] = React.useState(false);
  const [bioOn, setBioOn] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const supported = await biometricAvailable();
      if (!active) return;
      setBioSupported(supported);
      setBioOn(isBiometricEnabled());
    })();
    return () => {
      active = false;
    };
  }, []);

  async function toggleBiometric(v: boolean) {
    if (v) {
      const ok = await registerBiometric(user?.email ?? 'demo@comander.app');
      setBioOn(ok);
      toast[ok ? 'success' : 'error'](ok ? 'Ingreso con huella activado' : 'No se pudo activar la huella');
    } else {
      disableBiometric();
      setBioOn(false);
      toast.success('Ingreso con huella desactivado');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title="Configuración"
        subtitle="Personalización del panel: temas, colores, apariencia y módulos opcionales."
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Palette className="h-4 w-4 text-primary" /> Personalización
        </div>

        {/* Temas */}
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-primary" /> Temas
                </CardTitle>
                <p className="text-xs text-muted-foreground">Elige la paleta de marca del panel.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {THEMES.map((t) => {
                  const selected = mounted && themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeId(t.id)}
                      className={cn(
                        'group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        <span className="h-8 w-8 rounded-lg" style={{ background: t.swatch.primary }} />
                        <span className="h-8 w-8 rounded-lg" style={{ background: t.swatch.secondary }} />
                        <span className="h-8 w-8 rounded-lg" style={{ background: t.swatch.accent }} />
                      </div>
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Colores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colores</CardTitle>
                <p className="text-xs text-muted-foreground">Paleta activa: {active.label}.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ColorSwatch name="Primario" hex={active.swatch.primary} />
                <ColorSwatch name="Secundario" hex={active.swatch.secondary} />
                <ColorSwatch name="Acento" hex={active.swatch.accent} />
              </CardContent>
            </Card>

            {/* Apariencia + interruptores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> Apariencia y comportamiento
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <SettingRow
                  title="Modo oscuro"
                  desc="Alterna entre el tema claro y oscuro."
                  icon={mounted && isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  checked={mounted ? isDark : true}
                  onChange={(v) => setTheme(v ? 'dark' : 'light')}
                />
                <SettingRow
                  title="Animaciones"
                  desc="Activa las transiciones y conteos animados."
                  checked={mounted ? animationsEnabled : true}
                  onChange={setAnimationsEnabled}
                />
                <SettingRow
                  title="Habilitar Reportes"
                  desc="Muestra el módulo de reportes en la navegación."
                  checked={mounted ? reportsEnabled : false}
                  onChange={setReportsEnabled}
                />
                {/* Moneda: Bolivianos / Dólares */}
                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-muted-foreground"><Coins className="h-4 w-4" /></span>
                    <div>
                      <Label className="text-sm font-medium">Moneda</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">Cómo se muestran los montos en toda la app.</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
                    {([
                      ['BOB', 'Bs'],
                      ['USD', 'US$'],
                    ] as const).map(([cur, lbl]) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setCurrency(cur)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                          (mounted ? currency : 'BOB') === cur
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <SettingRow
                  title="Ocultar Saldos"
                  desc="Modo privacidad: oculta todos los valores monetarios para reuniones o espacios públicos."
                  icon={<EyeOff className="h-4 w-4" />}
                  checked={mounted ? balancesHidden : false}
                  onChange={setBalancesHidden}
                />
              </CardContent>
            </Card>

            {/* Experiencia de Inicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PlayCircle className="h-4 w-4 text-primary" /> Experiencia de Inicio
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Controla qué ocurre al abrir la aplicación, antes de iniciar sesión.
                </p>
              </CardHeader>
              <CardContent>
                <SettingRow
                  title="Mostrar Video de Introducción"
                  desc="ON: reproduce el video de introducción automáticamente. OFF: abre el Login directamente."
                  icon={<PlayCircle className="h-4 w-4" />}
                  checked={mounted ? introEnabled : true}
                  onChange={setIntroEnabled}
                />
              </CardContent>
            </Card>

            {/* Seguridad — Ingreso con huella (solo si el dispositivo lo soporta) */}
            {bioSupported && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Fingerprint className="h-4 w-4 text-primary" /> Seguridad
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Acceso biométrico de este dispositivo.</p>
                </CardHeader>
                <CardContent>
                  <SettingRow
                    title="Ingresar con huella"
                    desc="Permite entrar con tu huella (o rostro) sin escribir tu número en este dispositivo."
                    icon={<Fingerprint className="h-4 w-4" />}
                    checked={bioOn}
                    onChange={toggleBiometric}
                  />
                </CardContent>
              </Card>
            )}
      </motion.div>
    </div>
  );
}

function ColorSwatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <span className="h-10 w-10 rounded-lg" style={{ background: hex }} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs uppercase text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  desc,
  icon,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div>
          <Label className="text-sm font-medium">{title}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
