# Task Manager Frontend

Frontend del proyecto Task Manager construido con Next.js 14 (App Router).

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- pnpm 10+

## Variables de entorno

1. Copia `.env.example` a `.env.local`.
2. Ajusta los valores para tu entorno:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_COLLABORATION_URL=ws://localhost:4001/collaboration
COOKIE_NAME=access_token
```

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Validaciones antes de push

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Deploy en Vercel (monorepo)

Configura el proyecto en Vercel con estos valores:

- **Framework Preset:** Next.js
- **Root Directory:** `task_manager_front`
- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install`
- **Output Directory:** `.next` (por defecto)

### Environment Variables en Vercel

Configura en el dashboard de Vercel:

- `NEXT_PUBLIC_API_URL` = URL pública de tu backend (por ejemplo `https://api.tu-dominio.com/api/v1`)
- `NEXT_PUBLIC_COLLABORATION_URL` = URL websocket del servidor colaborativo (por ejemplo `wss://api.tu-dominio.com/collaboration`)
- `COOKIE_NAME` = mismo nombre de cookie usado en backend (por defecto `access_token`)

## Notas de producción

- El backend debe permitir CORS con `credentials: true` para el dominio del frontend en Vercel.
- El backend debe emitir cookie con `Secure=true` y `SameSite=None` si frontend y backend corren en dominios distintos.
