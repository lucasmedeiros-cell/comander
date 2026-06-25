'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH — El LOGO REAL de COMANDER se CONSTRUYE por piezas (no se rediseña).
//
// El logo se separó en capas (3 chevrones + COMANDER + DASHBOARD RESULTS) que se
// ensamblan en secuencia hasta formar el logo exacto:
//  1) Pantalla negra + fade-in
//  2) Chevron superior → medio → inferior entran y encajan en su lugar
//  3) Aparece COMANDER, luego DASHBOARD RESULTS
//  4) GLOW azul corporativo con pulso lento + flotación sutil + partículas
//  → Fade-out directo al Login. Solo transform/opacity/filter (GPU), 60 FPS.
// ─────────────────────────────────────────────────────────────────────────────

const EXPO = [0.16, 1, 0.3, 1] as const;
const TOTAL_MS = 4600; // sincronizado con el audio (~4.6s)
const FADE_OUT_MS = 500;
const AUDIO_SRC = '/splash/intro-audio.mp3';

// Capas del logo (cada PNG es el lienzo completo con solo su pieza).
const LAYERS = [
  { src: '/splash/ch1.png', from: -22, delay: 0.25 }, // chevron superior (baja)
  { src: '/splash/ch2.png', from: -22, delay: 0.45 }, // chevron medio
  { src: '/splash/ch3.png', from: -22, delay: 0.65 }, // chevron inferior
  { src: '/splash/word.png', from: 20, delay: 0.95 }, // COMANDER (sube)
  { src: '/splash/sub.png', from: 16, delay: 1.2 }, // DASHBOARD RESULTS (sube)
];

const PARTICLES = [
  { left: '20%', top: '32%', size: 3, delay: 0.3, dur: 6.5 },
  { left: '80%', top: '28%', size: 3, delay: 1.2, dur: 7 },
  { left: '32%', top: '72%', size: 2, delay: 0.7, dur: 6 },
  { left: '70%', top: '74%', size: 3, delay: 1.7, dur: 7.5 },
  { left: '86%', top: '52%', size: 2, delay: 0.5, dur: 8 },
];

let introCompleted = false;

interface IntroSplashProps {
  onComplete: () => void;
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const [fadeOut, setFadeOut] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const finish = React.useCallback(() => {
    if (introCompleted) return;
    introCompleted = true;
    onComplete();
  }, [onComplete]);
  const finishRef = React.useRef(finish);
  finishRef.current = finish;

  React.useEffect(() => {
    if (introCompleted) {
      onComplete();
      return;
    }
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = reduce ? 1000 : TOTAL_MS;

    // Reproduce el audio de la intro. Se intenta de inmediato; en el APK suena
    // automáticamente. En navegadores que bloquean el autoplay con sonido, se
    // reintenta al primer toque/tecla (fallback) sin interrumpir la animación.
    const a = audioRef.current;
    const tryPlay = () => {
      if (a && !reduce) {
        a.muted = false;
        a.volume = 1;
        void a.play().catch(() => {});
      }
    };
    tryPlay();
    const unlock = () => tryPlay();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    const t1 = window.setTimeout(() => setFadeOut(true), total - FADE_OUT_MS);
    const t2 = window.setTimeout(() => finishRef.current(), total);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      if (a) a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeOut ? FADE_OUT_MS / 1000 : 0.3, ease: 'easeOut' }}
    >
      {/* Audio de la intro */}
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />

      {/* Glow ambiental azul detrás del logo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute h-[28rem] w-[28rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,168,255,0.16), transparent 65%)' }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Partículas tenues */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: '#3DB4FF' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0], y: [-6, -22, -6] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Flotación del bloque + glow del logo ensamblado */}
      <motion.div
        className="splash-glow relative w-[min(20rem,74vw)]"
        style={{ aspectRatio: '1 / 1' }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        {LAYERS.map((l) => (
          <motion.div
            key={l.src}
            className="absolute inset-0"
            initial={{ opacity: 0, y: l.from }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: l.delay, ease: EXPO }}
          >
            <Image src={l.src} alt="" fill sizes="320px" priority className="object-contain" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
