'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// INTRO — se reproduce ANTES del Login (Abrir App → Intro → Login → Inicio).
//
// Reglas:
//   1. UN SOLO video (/assets/video/intro.mp4) y UNA SOLA reproducción por acceso.
//      Las guardas a nivel de módulo sobreviven a remontajes (React Strict Mode).
//   2. Navegación SOLO al terminar el video de verdad (evento `ended`), con un
//      fade-out de 500 ms. No se recorta el final ni se salta de pantalla antes.
//   3. Reproducción 100% automática: con sonido; si el navegador lo bloquea, en
//      silencio; si nada es posible, se avanza al Login sin interrumpir.
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_SRC = '/assets/video/intro.mp4';
const FADE_OUT_MS = 500;

// Guardas a nivel de MÓDULO: persisten durante todo el acceso y evitan que la
// intro se inicie o se complete dos veces.
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
  const [progress, setProgress] = React.useState(8);
  const [fadeOut, setFadeOut] = React.useState(false);

  // Finaliza UNA sola vez: fija la guarda y navega.
  const finish = React.useCallback(() => {
    if (introCompleted) return;
    introCompleted = true;
    onComplete();
  }, [onComplete]);
  const finishRef = React.useRef(finish);
  finishRef.current = finish;

  // Si la intro ya se reprodujo en este acceso, no la repitas: avanza directo.
  React.useEffect(() => {
    if (introCompleted) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reproducción automática: sonido → silencio → (si falla) avanzar.
  const play = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video || startedRef.current) return;
    startedRef.current = true;
    introStarted = true;
    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      setPhase('playing');
    } catch {
      try {
        video.muted = true;
        await video.play();
        setPhase('playing');
      } catch {
        finishRef.current();
      }
    }
  }, []);

  // Configuración del <video> (depende solo del montaje → nunca se reinicia).
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || introCompleted) return;

    let simTimer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      let buffered = 0;
      try {
        if (video.buffered.length && video.duration) {
          buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
        }
      } catch {
        /* buffered aún no disponible */
      }
      setProgress((p) => Math.min(92, Math.max(p + 2, buffered)));
    };
    simTimer = setInterval(tick, 120);

    const onReady = () => {
      setProgress(100);
      if (simTimer) clearInterval(simTimer);
      window.setTimeout(() => void play(), 250);
    };
    const onError = () => {
      if (simTimer) clearInterval(simTimer);
      finishRef.current();
    };
    // Único punto de salida: el FIN REAL del video → fade-out → navegar.
    const onEnded = () => {
      setFadeOut(true);
      window.setTimeout(() => finishRef.current(), FADE_OUT_MS);
    };

    video.addEventListener('canplaythrough', onReady, { once: true });
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded, { once: true });
    video.load();

    return () => {
      if (simTimer) clearInterval(simTimer);
      video.removeEventListener('canplaythrough', onReady);
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
      {/* Video — centrado, proporción intacta, sin recortes. */}
      <motion.video
        ref={videoRef}
        playsInline
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut ? 0 : phase === 'playing' ? 1 : 0 }}
        transition={{ duration: fadeOut ? FADE_OUT_MS / 1000 : 0.6, ease: 'easeOut' }}
        className="max-h-full max-w-full object-contain"
        style={{ width: '100%', height: '100%' }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </motion.video>

      {/* Loader mientras precarga el video. */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              aria-hidden
              className="absolute h-64 w-64 rounded-full bg-brand/20 blur-[90px]"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <div className="relative h-24 w-40 overflow-hidden rounded-2xl bg-[#070b18] ring-1 ring-white/10">
              <Image src="/logo.png" alt="COMANDER" fill sizes="160px" className="object-contain" priority />
            </div>
            <p className="relative mt-6 text-base font-semibold tracking-[0.18em] text-white">
              Preparando Centro de Mando…
            </p>
            <div className="relative mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                initial={{ width: '8%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
