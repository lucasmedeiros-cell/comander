'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/store';
import { apiLogin } from '@/lib/api';
import type { Role, User } from '@/types';

// El backend puede devolver el rol OWNER (dueño) → lo tratamos como Super Administrador.
function normalizeRole(role: string): Role {
  const allowed: Role[] = ['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'VIEWER'];
  if (role === 'OWNER') return 'SUPER_ADMIN';
  return allowed.includes(role as Role) ? (role as Role) : 'ADMIN';
}

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type FormData = z.infer<typeof schema>;

const HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Ventas, compras y rentabilidad en un solo panel' },
  { icon: Sparkles, text: 'Alertas inteligentes en tiempo real' },
  { icon: ShieldCheck, text: 'Multiempresa, seguro y fácil de usar' },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const setSession = useAuth((s) => s.setSession);
  // Nuevo flujo: el video de intro ya se mostró ANTES del login, así que tras
  // autenticarse vamos directo al panel.
  const [showPass, setShowPass] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'demo@comander.com', password: 'Demo1234!' },
  });

  async function onSubmit(data: FormData) {
    try {
      // 1) Intentamos sesión real contra el backend NestJS.
      const res = await apiLogin(data.email, data.password);
      const user: User = {
        id: res.user.id,
        email: res.user.email,
        nombre: res.user.nombre,
        avatar: res.user.avatar ?? undefined,
        role: normalizeRole(res.user.role),
      };
      setSession(user, res.accessToken);
      // Sin mensaje emergente: entramos directo al panel, sin interrupciones.
      router.replace('/inicio');
    } catch {
      // 2) Si el backend no está disponible, entramos en modo demo (sin toast).
      login(data.email);
      router.replace('/inicio');
    }
  }

  function social(provider: string) {
    // Stub de OAuth — en producción redirige al backend NestJS (/api/auth/oauth/...).
    login(`${provider.toLowerCase()}@comander.com`);
    router.replace('/inicio');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-[#010512] lg:block">
        <motion.div
          className="absolute -left-20 top-10 h-[36rem] w-[36rem] rounded-full bg-brand/25 blur-[130px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-purple/20 blur-[120px]"
          animate={{ scale: [1.1, 0.9, 1.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src="/logo.png" alt="COMANDER" fill sizes="44px" className="object-cover" priority />
            </div>
            <div className="leading-none">
              <p className="text-lg font-bold tracking-[0.14em] text-white">COMANDER</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Control Empresarial</p>
            </div>
          </div>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold leading-tight text-white"
            >
              Controla todos tus negocios desde un solo lugar.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-base text-white/60"
            >
              El centro de control ejecutivo para dueños y gerentes que manejan múltiples empresas.
            </motion.p>
            <div className="mt-10 space-y-4">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.12 }}
                  className="flex items-center gap-3 text-white/80"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-brand-light ring-1 ring-white/10">
                    <h.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30">© {new Date().getFullYear()} COMANDER · Todos los derechos reservados</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo protagonista (completo, sin recortes) con glow corporativo. */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative grid place-items-center">
              <motion.div
                aria-hidden
                className="absolute h-44 w-56 rounded-[2rem] bg-brand/30 blur-[70px]"
                animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3.2, repeat: Infinity }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-28 w-44 overflow-hidden rounded-2xl bg-[#070b18] ring-1 ring-white/10 shadow-2xl"
              >
                <Image src="/logo.png" alt="COMANDER" fill sizes="176px" className="object-contain" priority />
              </motion.div>
            </div>
            <span className="mt-4 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Centro de Mando Empresarial
            </span>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight">Inicia sesión</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Bienvenido de nuevo. Accede a tu panel ejecutivo.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tucorreo@empresa.com" {...register('email')} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <RecoverDialog onSent={(email) => setValue('email', email)} />
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Mostrar contraseña"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch id="remember" checked={remember} onCheckedChange={setRemember} />
              <Label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
                Recordarme en este dispositivo
              </Label>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> o continúa con <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => social('Google')}>
              <GoogleIcon /> Google
            </Button>
            <Button variant="outline" onClick={() => social('Microsoft')}>
              <MicrosoftIcon /> Microsoft
            </Button>
          </div>

          <p className="mt-8 rounded-lg border border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            Demo: <span className="font-medium text-foreground">demo@comander.com</span> ·{' '}
            <span className="font-medium text-foreground">Demo1234!</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function RecoverDialog({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = React.useState('');
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs font-medium text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar contraseña</DialogTitle>
          <DialogDescription>
            Te enviaremos un enlace para restablecer tu contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="recover-email">Correo electrónico</Label>
          <Input
            id="recover-email"
            type="email"
            placeholder="tucorreo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            toast.success('Enlace de recuperación enviado (demo)');
            if (email) onSent(email);
            setOpen(false);
          }}
        >
          Enviar enlace
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" className="h-4 w-4">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}
