COMANDER — Videos de introducción (Web)

Coloca aquí los dos videos verticales/horizontales de intro:

  intro-mobile.mp4   → se usa cuando el ancho de pantalla es  < 1024px
  intro-web.mp4      → se usa cuando el ancho de pantalla es >= 1024px

El sistema selecciona automáticamente cuál cargar (window.matchMedia) y
SOLO descarga el que corresponde. Si alguno falta, se usa /intro.mp4 como
respaldo para no romper el flujo.

Recomendado: MP4 H.264, 30 fps. No comprimir de más (object-fit: contain
mantiene la calidad y evita recortes).
