# COMANDER — Web

Dashboard ejecutivo (Next.js 14 · TypeScript · Tailwind · shadcn UI · Framer Motion · Recharts).

```bash
npm install
npm run dev      # http://localhost:3001
npm run build    # build de producción
```

- Funciona con **datos demo** sin backend. Login: `demo@comander.com` / `Demo1234!`.
- Para usar el backend NestJS, crea `.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3000
  NEXT_PUBLIC_DATA_SOURCE=api
  ```
- Coloca tu video de introducción en `public/intro.mp4` (si falta, se muestra una animación de marca).

## Estructura
```
src/
├── app/
│   ├── layout.tsx, page.tsx (splash), globals.css
│   ├── login/
│   └── (dashboard)/  inicio, empresas, ingresos, egresos, rentabilidad,
│                     reportes, analitica, alertas, integraciones, usuarios
├── components/  ui (shadcn) · layout · charts · dashboard · splash · brand · onboarding
├── lib/         mock-data · metrics · insights · reports · format · store · labels
└── types/
```
