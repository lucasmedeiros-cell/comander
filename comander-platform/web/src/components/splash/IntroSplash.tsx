'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// INTRO — se reproduce ANTES del Login (Abrir App → Intro → Login → Dashboard).
//
// Reglas críticas (corregidas):
//   1. UNA SOLA reproducción por acceso. Guardas `introStarted` / `introCompleted`
//      a nivel de módulo sobreviven a remontajes de React Strict Mode y a vueltas
//      accidentales a la ruta, evitando que el video se reproduzca dos veces.
//   2. La navegación ocurre ÚNICAMENTE al terminar el video de verdad (`ended`),
//      con un fade-out de 500 ms. NO se recorta el final ni se navega antes.
//   3. El efecto de configuración del <video> depende SOLO de `src` (nunca de
//      estados como `fadeOut`), para no volver a llamar `video.load()` ni reiniciar
//      la reproducción a mitad de camino.
//   4. Selección de video robusta: window.innerWidth + matchMedia. < 1024px →
//      intro-mobile.mp4, ≥ 1024px → intro-web.mp4. Se carga UN SOLO video.
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_MOBILE = '/assets/video/intro-mobile.mp4';
const VIDEO_WEB = '/assets/video/intro-web.mp4';
const VIDEO_FALLBACK = '/intro.mp4';
const DESKTOP_MIN_WIDTH = 1024;
const FADE_OUT_MS = 500;

// Logs de diagnóstico (resolución · dispositivo · video elegido). Desactivados.
const INTRO_DEBUG = false;
const dlog = (...args: unknown[]) => {
  if (INTRO_DEBUG) console.log('%c[intro]', 'color:#2D7EFF;font-weight:bold', ...args);
};

// Guardas a nivel de MÓDULO: persisten durante todo el acceso (una sola carga del
// bundle) y sobreviven a los remontajes de React Strict Mode. Garantizan que la
// intro se inicie y se complete exactamente una vez.
let introStarted = false;
let introCompleted = false;

/** Detección robusta del dispositivo para elegir un único video. */
function pickVideo(): string {
  const width = window.innerWidth;
  const matchesDesktop = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
  const isDesktop = width >= DESKTOP_MIN_WIDTH || matchesDesktop;
  const chosen = isDesktop ? VIDEO_WEB : VIDEO_MOBILE;
  dlog('resolución:', `${width}px`, '· dispositivo:', isDesktop ? 'desktop (≥1024px)' : 'mobile (<1024px)', '· video:', chosen);
  return chosen;
}

interface IntroSplashProps {
  /** Se invoca SOLO al terminar el video (o ante un error irrecuperable). */
  onComplete: () => void;
}

type Phase = 'loading' | 'playing';

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const startedRef = React.useRef(false);
  const triedFallback = React.useRef(false);

  const [src, setSrc] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<Phase>('loading');
  const [progress, setProgress] = React.useState(8);
  const [fadeOut, setFadeOut] = React.useState(false);

  // Finaliza UNA sola vez: fija las guardas y navega. Se usa tras `ended`/error.
  const finish = React.useCallback(() => {
    if (introCompleted) return;
    introCompleted = true;
    dlog('intro completada (started=' + introStarted + ') → navegando a Login');
    onComplete();
  }, [onComplete]);

  // 0) Si la intro ya se reprodujo en este acceso, no la repitas: avanza directo.
  React.useEffect(() => {
    if (introCompleted) {
      dlog('intro ya reproducida en este acceso → avanzando sin repetir');
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1) Elegir el video correcto ANTES de montar el <video> (carga única).
  React.useEffect(() => {
    if (introCompleted) return;
    setSrc(pickVideo());
  }, []);

  // Refs a los callbacks: el efecto de configuración del <video> NO debe
  // re-ejecutarse cuando cambie la identidad de estas funciones (lo que provocaría
  // un `video.load()` y una reproducción doble). Se leen siempre los más recientes.
  const finishRef = React.useRef(finish);
  finishRef.current = finish;

  // Reproducción 100% automática (sin botones). Se intenta con sonido; si el
  // navegador bloquea el autoplay con audio, se reintenta EN SILENCIO sin
  // interrumpir la experiencia. Si tampoco fuera posible, se avanza al Login.
  const playWithSound = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video || startedRef.current) return;
    startedRef.current = true;
    introStarted = true;
    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      dlog('reproducción iniciada (con sonido)');
      setPhase('playing');
    } catch {
      // Autoplay con sonido bloqueado → reproducir en silencio automáticamente.
      try {
        video.muted = true;
        await video.play();
        dlog('autoplay con sonido bloqueado → reproduciendo en silencio (sin interrumpir)');
        setPhase('playing');
      } catch {
        dlog('reproducción no disponible → avanzando a Login sin interrumpir');
        finishRef.current();
      }
    }
  }, []);

  // 2) Configuración del <video>. DEPENDE SOLO DE `src` para no reiniciar nunca.
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let simTimer: ReturnType<typeof setInterval> | null = null;

    // Barra de progreso: mezcla buffer real con avance simulado suave.
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
      dlog('canplaythrough — video listo');
      setProgress(100);
      if (simTimer) clearInterval(simTimer);
      window.setTimeout(() => void playWithSound(), 280);
    };

    const onError = () => {
      if (!triedFallback.current && video.currentSrc !== location.origin + VIDEO_FALLBACK) {
        triedFallback.current = true;
        dlog('error al cargar el video → usando respaldo /intro.mp4');
        setSrc(VIDEO_FALLBACK);
        return;
      }
      dlog('error irrecuperable de video → avanzando a Login');
      if (simTimer) clearInterval(simTimer);
      finishRef.current();
    };

    // Único punto de salida: el FIN REAL del video. Fade-out de 500 ms y navega.
    // No se recorta el final ni se navega antes de tiempo.
    const onEnded = () => {
      dlog('evento `ended` → fade-out de', FADE_OUT_MS, 'ms');
      setFadeOut(true);
      window.setTimeout(() => finishRef.current(), FADE_OUT_MS);
    };

    video.addEventListener('canplaythrough', onReady, { once: true });
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded, { once: true });

    video.load(); // precarga el recurso elegido (una sola vez por `src`)

    return () => {
      if (simTimer) clearInterval(simTimer);
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
    };
    // Depende SOLO de `src`: la configuración del video no se reinicia por cambios
    // de identidad de callbacks (playWithSound es estable; finish vía finishRef).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const showLoader = phase === 'loading';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Video — centrado, proporción intacta, sin recortes. Oculto hasta listo. */}
      {src && (
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
          <source src={src} type="video/mp4" />
        </motion.video>
      )}

      {/* Loader elegante mientras precarga el video. */}
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              {/* Halo */}
              <motion.div
                aria-hidden
                className="absolute h-64 w-64 rounded-full bg-brand/20 blur-[90px]"
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Image src="/logo.png" alt="COMANDER" fill sizes="96px" className="object-cover" priority />
              </div>
              <p className="relative mt-6 text-base font-semibold tracking-[0.18em] text-white">
                Preparando Centro de Mando…
              </p>
              <p className="relative mt-1 text-xs uppercase tracking-[0.28em] text-white/40">COMANDER</p>

              {/* Barra de progreso animada. */}
              <div className="relative mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                  initial={{ width: '8%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
