# COMANDER — Centro de control empresarial

Plataforma ejecutiva multiempresa para dueños, administradores y gerentes que
controlan varios negocios desde un único panel. Visualiza **ingresos, egresos,
rentabilidad** y métricas en tiempo real de todas las empresas conectadas por API,
con una interfaz moderna, intuitiva y fácil de usar — en **web y móvil**.

> Construido en una carpeta independiente (`comander-platform/`). No comparte código
> con el proyecto previo `comander/`.

## Arquitectura (monorepo de apps independientes)

| App | Carpeta | Stack | Puerto |
| --- | --- | --- | --- |
| **Web** | [`web/`](./web) | Next.js 14 (App Router) · TypeScript · Tailwind · shadcn UI · Framer Motion · Recharts | `3001` |
| **API** | [`api/`](./api) | NestJS 10 · Prisma · PostgreSQL · JWT · Socket.io · PDFKit · ExcelJS | `3000` |
| **Móvil** | [`mobile/`](./mobile) | React Native · Expo (SDK 51) · Expo Router · Reanimated/Moti · gifted-charts | Expo |
| `assets/` | logo de marca compartido | | |

Las tres apps comparten la misma **identidad visual** (navy ejecutivo `#010512`,
acento `#2D7EFF`, tipografía Inter) y el mismo **modelo de datos**.

## Inicio rápido

Cada app funciona de forma autónoma. La **web y el móvil traen datos demo**, así que
puedes verlas funcionando sin levantar la base de datos.

### 1) Web (recomendado para empezar)
```bash
cd web
npm install
npm run dev        # http://localhost:3001
```
Login demo: `demo@comander.com` / `Demo1234!` (cualquier credencial entra en modo demo).

### 2) API (NestJS + PostgreSQL)
```bash
cd api
npm install
cp .env.example .env          # apunta DATABASE_URL a tu PostgreSQL
npm run migrate               # crea las tablas
npm run seed                  # datos de demostración
npm run dev                   # http://localhost:3000
```
Para que la web consuma la API real: en `web/.env.local` define
`NEXT_PUBLIC_API_URL=http://localhost:3000` y `NEXT_PUBLIC_DATA_SOURCE=api`.

### 3) Móvil (Expo)
```bash
cd mobile
npm install
npx expo start                # abre en Expo Go (iOS/Android)
```

## Funcionalidades (menú principal)

1. **Inicio** — resumen ejecutivo: ingresos, egresos, utilidad, # movimientos,
   mejor y peor empresa, e indicadores rápidos (Hoy / Ayer / 7 días / 30 días / Este mes / Mes anterior).
2. **Empresas** — tarjetas con estado de API, última sincronización, ingresos,
   egresos y rentabilidad. Ver detalle, editar conexión y re-sincronizar.
3. **Ingresos** — por empresa y por periodo (diario, semanal, mensual, anual) con gráficos de línea/barra y comparativos.
4. **Egresos** — idéntico a ingresos, para las salidas de dinero.
5. **Rentabilidad** — ranking de empresas, evolución histórica, tendencias y alertas.
6. **Reportes** — generación real de **PDF** (resumen, ingresos, egresos, rentabilidad, comparativo) y **Excel** (datos completos o filtrados), con filtros por fecha, empresa y categoría.
7. **Analítica** — tendencias, crecimiento, variaciones y KPIs avanzados.
8. **Alertas inteligentes** — caída de ingresos, aumento de egresos, empresa desconectada, errores de API y comportamiento inusual.
9. **Integraciones** — gestión de APIs (estado, token, última sincronización): agregar, editar, eliminar y probar conexión.
10. **Usuarios y Roles** — Super Administrador, Administrador, Gerente y Solo lectura, con matriz de permisos configurable.

## Experiencia de usuario
- Flujo de apertura con **splash de video** + logo (coloca tu video — ver abajo).
- **Login** moderno: correo+contraseña, recordarme, recuperar contraseña, Google y Microsoft.
- **Modo claro / oscuro**, diseño responsive (desktop, tablet, móvil).
- Animaciones suaves (fade in, slide up, microinteracciones), tooltips de ayuda y **tutorial inicial opcional**.
- Frases en lenguaje simple: *"Los ingresos aumentaron un 12% respecto a ayer."*

## 🎬 Video de introducción
Coloca tu video en:
- Web: `web/public/intro.mp4`
- Móvil: `mobile/assets/intro.mp4`

Si el archivo no existe, ambas apps muestran automáticamente una **animación de marca**
de respaldo (logo + degradado) y continúan al login sin errores.

## Notas
- **Seguridad**: la web usa Next.js 14.2.5. Antes de producción ejecuta `npm i next@latest`
  en `web/` para aplicar los últimos parches de seguridad.
- **OAuth Google/Microsoft** y los conectores reales de integraciones están como stubs
  documentados; conéctalos con tus credenciales cuando lo necesites (ver `api/README.md`).
