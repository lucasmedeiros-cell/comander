/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Export 100% estático: el sitio funciona solo con datos demo (sin backend),
  // así Netlify sirve archivos estáticos y SIEMPRE carga (sin runtime SSR que
  // pueda fallar). El detalle de empresa usa query param (/empresas/detalle?id=…),
  // por eso no hay rutas dinámicas que requieran servidor.
  output: 'export',
  // next/image necesita un servidor para optimizar; en export se desactiva.
  images: { unoptimized: true },
};

export default nextConfig;
