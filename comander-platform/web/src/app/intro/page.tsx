'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IntroSplash } from '@/components/splash/IntroSplash';
import { useAuth, useSettings } from '@/lib/store';
import { useMounted } from '@/lib/use-mounted';

/**
 * Ruta dedicada de la intro.
 *
 * FLUJO OBLIGATORIO:  Abrir App → /intro (video) → /login → Dashboard.
 * La intro NUNCA navega al Dashboard ni autentica: su única salida es el Login.
 * La transición ocurre SOLO al terminar el video (evento `ended`, vía onComplete).
 * La autenticación y el acceso al panel son responsabilidad EXCLUSIVA del Login.
 */
export default function IntroPage() {
  const router = useRouter();
  const mounted = useMounted();
  const setIntroSeen = useAuth((s) => s.setIntroSeen);
  const introEnabled = useSettings((s) => s.introEnabled);
  const navigated = useRef(false);
  const [ready, setReady] = useState(false);

  // Memoizado: identidad estable para que IntroSplash no reinicie el video.
  const next = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    setIntroSeen(true);
    // La intro SIEMPRE termina en el Login. Nunca salta al Dashboard.
    router.replace('/login');
  }, [router, setIntroSeen]);

  // Si la intro está desactivada en preferencias, saltamos directamente.
  useEffect(() => {
    if (!mounted) return;
    if (!introEnabled) {
      next();
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, introEnabled]);

  if (!ready) return <div className="fixed inset-0 z-[100] bg-black" />;

  return <IntroSplash onComplete={next} />;
}
