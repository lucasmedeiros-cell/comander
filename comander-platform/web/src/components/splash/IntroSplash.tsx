'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// INTRO — se reproduce ANTES del Login (Abrir App → Intro → Login → Inicio).
//
// Reglas:
//   1. UN SOLO video (/assets/video/intro.mp4) y UNA SOLA reproducción por acceso.
//      Las guardas a nivel de módulo sobreviven a remontajes (React Strict Mode).
//   2. Navegación SOLO al terminar el video (evento `ended`), con fade-out.
//   3. Reproducción automática CON SONIDO. Por política de autoplay de los
//      navegadores (Chrome/Safari/Firefox), un video que arranca solo sin gesto
//      previo suele quedar SILENCIADO en dominios sin "media engagement" (p. ej.
//      producción). En ese caso el video NO se interrumpe: sigue reproduciéndose
//      en silencio y se ofrece un botón "Activar sonido" que lo activa al
//      instante (gesto del usuario) sin reiniciar ni recargar.
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_SRC = '/assets/video/intro.mp4';
const FADE_OUT_MS = 500;

let introStarted = false;
let introCompleted = false;

interface IntroSplashProps {
  /** Se invoca SOLO al terminar el video (o ante un error irrecuperable). */
  onComplete: () => void;
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const startedRef = React.useRef(false);

  const [phase, setPhase] = React.useState<'loading' | 'playing'>('loading');
  const [fadeOut, setFadeOut] = React.useState(false);
  // true → el video se está reproduciendo en SILENCIO porque el navegador bloqueó
  // el autoplay con audio; se muestra el botón para activarlo.
  const [needsSound, setNeedsSound] = React.useState(false);

  const finish = React.useCallback(() => {
    if (introCompleted) return;
    introCompleted = true;
    onComplete();
  }, [onComplete]);
  const finishRef = React.useRef(finish);
  finishRef.current = finish;

  // Si la intro ya se reprodujo en este acceso, no la repitas.
  React.useEffect(() => {
    if (introCompleted) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reproducción automática: intenta CON sonido; si el navegador lo bloquea,
  // reproduce en silencio (sin interrumpir) y marca que se necesita activar audio.
  const play = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video || startedRef.current) return;
    startedRef.current = true;
    introStarted = true;
    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      setNeedsSound(false);
      setPhase('playing');
    } catch {
      try {
        video.muted = true;
        await video.play();
        setNeedsSound(true); // reproduce, pero en silencio → ofrecer "Activar sonido"
        setPhase('playing');
      } catch {
        finishRef.current();
      }
    }
  }, []);

  // Activa el audio con el gesto del usuario, SIN reiniciar ni recargar.
  const enableSound = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {});
    setNeedsSound(false);
  }, []);

  // Configuración del <video> (solo al montar → nunca se reinicia).
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || introCompleted) return;

    const onReady = () => void play();
    const onError = () => finishRef.current();
    const onEnded = () => {
      setFadeOut(true);
      window.setTimeout(() => finishRef.current(), FADE_OUT_MS);
    };

    video.addEventListener('canplay', onReady, { once: true });
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded, { once: true });
    video.load();

    return () => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Video — centrado, proporción intacta, con sonido. */}
      <motion.video
        ref={videoRef}
        playsInline
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut ? 0 : phase === 'playing' ? 1 : 0 }}
        transition={{ duration: fadeOut ? FADE_OUT_MS / 1000 : 0.5, ease: 'easeOut' }}
        className="max-h-full max-w-full object-contain"
        style={{ width: '100%', height: '100%' }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </motion.video>

      {/* Botón elegante para activar sonido si el navegador bloqueó el autoplay con audio. */}
      <AnimatePresence>
        {phase === 'playing' && needsSound && !fadeOut && (
          <motion.button
            type="button"
            onClick={enableSound}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-6 py-3 text-sm font-semibold text-black shadow-2xl backdrop-blur transition-transform hover:scale-[1.03] active:scale-95 sm:bottom-12"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            <Volume2 className="h-4 w-4" /> Activar sonido
          </motion.button>
        )}
      </AnimatePresence>

      {/* Carga mínima: solo un spinner discreto sobre negro (sin mensajes). */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 z-10 grid place-items-center bg-black"
          >
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
