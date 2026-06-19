# COMANDER

Dashboard ejecutivo multiempresa. La aplicación web (Next.js 14) vive en
[`comander-platform/web`](comander-platform/web) y funciona con datos demo (mock),
por lo que **no necesita backend** para verse online.

## Despliegue en Netlify

El repo ya está listo para Netlify mediante [`netlify.toml`](netlify.toml).

### Opción A — Conectar el repositorio (recomendado)

1. Sube este repo a GitHub (ver más abajo).
2. En Netlify: **Add new site → Import an existing project** y elige el repo.
3. Netlify lee `netlify.toml` automáticamente:
   - Base directory: `comander-platform/web`
   - Build command: `npm run build`
   - Publish: `.next`
   - Plugin `@netlify/plugin-nextjs` (se instala solo).
4. **Deploy**. No hace falta configurar variables: por defecto usa datos demo.

### Opción B — Netlify CLI

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

## Variables de entorno (opcionales)

| Variable                 | Valor por defecto | Descripción                                            |
| ------------------------ | ----------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_DATA_SOURCE`| `mock`            | `mock` (demo) o `api` (usa backend NestJS).            |
| `NEXT_PUBLIC_API_URL`    | *(sin definir)*   | URL del backend. Si se define, `/api/*` se redirige ahí. |

En Netlify no definas `NEXT_PUBLIC_API_URL` salvo que tengas un backend público.

## Subir a GitHub

```bash
git init
git add .
git commit -m "COMANDER web — listo para Netlify"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

## Desarrollo local

```bash
cd comander-platform/web
npm install
npm run dev   # http://localhost:3001
```
