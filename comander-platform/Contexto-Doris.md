# Doris — Contexto técnico: cómo configurar, activar e integrar en cualquier app

Doris transcribe y resume reuniones: graba audio → lo transcribe (Groq Whisper) → genera resumen ejecutivo, puntos clave, tareas (responsable/fecha) y decisiones (Claude), todo buscable. Existe como **app web** y **APK Android**, pero por dentro es un **servicio con API REST**, por lo que se puede usar desde cualquier aplicación.

---

## 1. Arquitectura (en una línea)

```
[ App cliente ]  →  HTTPS  →  [ Backend Doris (API REST) ]  →  Postgres
   web / APK /                  Node + Express                Groq Whisper (transcribe)
   otra app                                                   Claude (resume/categoriza)
```

- **Frontend:** React + Vite (web) empaquetado con Capacitor (APK). No es obligatorio: es solo *un* cliente de la API.
- **Backend:** Node.js + Express + PostgreSQL. Es el "cerebro" y lo que se integra en otras apps.
- **IA:** Groq Whisper (transcripción) + Claude (resumen/tareas/decisiones).

---

## 2. ¿Cómo se "activa" Doris en cualquier app? — 3 opciones

| Opción | Qué es | Esfuerzo | Cuándo conviene |
|---|---|---|---|
| **A. Vía API REST** *(recomendado)* | La otra app llama a la API de Doris por HTTP (login → subir audio → recibir resumen). | Medio | Integrar Doris dentro de otro sistema (ej. otra app de PetroBox) manteniendo su propia UI. |
| **B. Embebido (WebView / iframe)** | Se incrusta la web de Doris dentro de la otra app. | Bajo | Sumar Doris rápido como "módulo" sin programar contra la API. |
| **C. App standalone** | Se distribuye el APK o el link web tal cual. | Mínimo | Que la gente use Doris directamente. |

> **Clave:** como el backend ya es una API, **cualquier app que pueda hacer peticiones HTTP puede activar Doris**. No hace falta reescribir nada por app; se reusa el mismo backend.

---

## 3. Contrato de la API (lo que necesita la app que integra)

**Base URL (actual, provisional):** `https://<URL-del-backend>`
**Base URL (definitiva, pendiente DNS):** `https://doris.petroboxinc.com`

**Autenticación:** login por teléfono con código (OTP) → devuelve un **token JWT** (válido 90 días). Ese token se manda en cada llamada como `Authorization: Bearer <token>` (o `?token=<token>` para audio en etiquetas `<audio>/<video>`).

### Flujo mínimo de integración

```bash
# 1) Pedir código (en modo prueba el código vuelve en la respuesta)
curl -X POST https://<URL-del-backend>/auth/otp \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"70000000"}'

# 2) Verificar código → obtener token
curl -X POST https://<URL-del-backend>/auth/verificar \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"70000000","codigo":"123456"}'
# → { "token": "eyJ..." }

# 3) Crear reunión
curl -X POST https://<URL-del-backend>/reuniones \
  -H 'Authorization: Bearer eyJ...' -H 'Content-Type: application/json' \
  -d '{"titulo":"Reunión de obra"}'
# → { "id": 12 }

# 4) Subir el audio (queda procesando: transcribe + resume)
curl -X POST https://<URL-del-backend>/reuniones/12/audio \
  -H 'Authorization: Bearer eyJ...' \
  -F 'audio=@grabacion.m4a'

# 5) Leer el resultado (resumen, puntos, tareas, decisiones, transcripción)
curl https://<URL-del-backend>/reuniones/12 -H 'Authorization: Bearer eyJ...'
```

### Endpoints

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/auth/otp` | Pedir código (body `{identifier}` = teléfono 8 dígitos) |
| POST | `/auth/verificar` | Verificar código → `{token}` |
| GET | `/auth/me` | Datos del usuario logueado |
| POST | `/reuniones` | Crear reunión → `{id}` |
| POST | `/reuniones/:id/audio` | Subir audio (multipart, campo `audio`) y procesar |
| POST | `/reuniones/:id/procesar` | Reprocesar |
| GET | `/reuniones` | Listar reuniones del usuario |
| GET | `/reuniones/:id` | Detalle: transcripción + resumen + puntos + tareas + decisiones + estado |
| GET | `/reuniones/:id/audio` | Reproducir el audio (soporta streaming) |
| PATCH | `/reuniones/:id` | Editar título |
| PATCH | `/reuniones/:id/tareas/:tid` | Marcar tarea hecha/pendiente |
| DELETE | `/reuniones/:id` | Borrar reunión (y su audio) |
| GET | `/buscar?q=texto` | Búsqueda full-text en las transcripciones |
| GET | `/tareas` | Todas las tareas del usuario (pendientes primero) |

---

## 4. Configuración del backend (para desplegar/activar el servicio)

Requisitos: **Node.js 20+** y **PostgreSQL**.

### Variables de entorno (archivo `.env`)

```env
PORT=3137                         # puerto del servicio
DATABASE_URL=postgres://usuario:clave@localhost:5432/doris
JWT_SECRET=<secreto-largo-aleatorio>
GROQ_API_KEY=<clave-groq>         # transcripción (Whisper)
ANTHROPIC_API_KEY=<clave-claude>  # resúmenes (Claude)
CLAUDE_MODEL=claude-sonnet-4-6
AUDIO_DIR=./uploads               # dónde se guardan los audios
OTP_DEV_MODE=true                 # true = el código sale en pantalla (pruebas); false = SMS real (Twilio)

# Solo si OTP_DEV_MODE=false (SMS real por Twilio):
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
SMS_COUNTRY_CODE=+591
```

### Pasos para activarlo

```bash
npm install
node src/migrate.js     # crea las tablas en Postgres
node src/server.js      # levanta la API (en producción: con pm2)
```

Después se expone por HTTPS (nginx + certificado, o túnel) y listo.

### Frontend (si se usa la app web/APK)

- `VITE_API_URL` debe apuntar a la URL del backend.
- Web: `npm run build` → deploy (Netlify). APK: build con Capacitor.

---

## 5. Estado actual del despliegue

- **Backend:** corriendo de forma permanente en el servidor **Bilbo** (PostgreSQL propio, base `doris`, gestionado con pm2 → sobrevive reinicios).
- **Web:** publicada en `https://doris-app.netlify.app`.
- **APK:** generado y listo para instalar/probar.
- **Login:** en modo prueba (el código aparece en pantalla). Para producción se activa el SMS real (Twilio, ya cableado).

### Pendientes recomendados
1. **URL fija con HTTPS** para el backend: registro DNS `doris.petroboxinc.com → 173.212.251.72` (Bilbo) + nginx/cert. Mientras tanto va por un túnel cuya URL puede cambiar.
2. **Activar SMS** real (Twilio) y poner `OTP_DEV_MODE=false` cuando se libere a usuarios reales.
3. **Rotar las claves** de Groq/Anthropic antes de producción.

---

## 6. Resumen para decidir

- Para meter Doris **dentro de otra app de PetroBox** → **Opción A (API REST)**: esa app hace login, sube el audio y muestra el resumen con su propia interfaz. Reusa el mismo backend; no se duplica nada.
- Para sumarlo **rápido** sin programar → **Opción B (WebView/iframe)** de la web de Doris.
- Para usarlo **directo** → **Opción C**: el APK / el link.

> Si "activar Doris en cualquier app" se refiere a algo más específico (por ejemplo un botón/widget embebible, o login compartido con otra app del ecosistema), se puede afinar: avisame el caso concreto y lo detallo.
