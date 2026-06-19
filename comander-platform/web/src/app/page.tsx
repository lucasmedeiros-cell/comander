'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSettings } from '@/lib/store';
import { useMounted } from '@/lib/use-mounted';

/**
 * Punto de entrada (raíz).
 *
 * NUEVO FLUJO:  Abrir App → Video Intro → Fade Out → Login → Dashboard.
 * El video de introducción ahora se muestra ANTES del login, una vez por sesión
 * de navegador (mientras `introSeen` sea falso y la intro esté habilitada).
 * Tras verla, enrutamos al login (sin sesión) o al panel (sesión activa).
 */
export default function EntryPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const introSeen = useAuth((s) => s.introSeen);
  const introEnabled = useSettings((s) => s.introEnabled);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    // 1) Intro primero (impacto visual desde el primer segundo).
    if (introEnabled && !introSeen) {
      router.replace('/intro');
      return;
    }
    // 2) Ya vista (o desactivada) → login o dashboard según la sesión.
    router.replace(user ? '/inicio' : '/login');
  }, [mounted, user, introSeen, introEnabled, router]);

  return <div className="min-h-screen bg-black" />;
}
