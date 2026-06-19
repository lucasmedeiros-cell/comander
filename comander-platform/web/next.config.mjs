/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api → backend NestJS. Solo se activa si NEXT_PUBLIC_API_URL está definido
  // (en local apuntando a :3000). En Netlify/demo no se define, así que no se intenta
  // ningún proxy a localhost y el sitio funciona 100% con datos mock.
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return [];
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
