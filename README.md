# Task Manager Frontend

Frontend del proyecto Task Manager construido con Next.js 14 (App Router).

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- npm 9+

## Variables de entorno

1. Copia `.env.example` a `.env.local`.
2. Ajusta los valores para tu entorno:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
COOKIE_NAME=access_token
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Validaciones antes de push

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy en Vercel (monorepo)

Configura el proyecto en Vercel con estos valores:

- **Framework Preset:** Next.js
- **Root Directory:** `task_manager_front`
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Output Directory:** `.next` (por defecto)

### Environment Variables en Vercel

Configura en el dashboard de Vercel:

- `NEXT_PUBLIC_API_URL` = URL pública de tu backend (por ejemplo `https://api.tu-dominio.com/api/v1`)
- `COOKIE_NAME` = mismo nombre de cookie usado en backend (por defecto `access_token`)

## Notas de producción

- El backend debe permitir CORS con `credentials: true` para el dominio del frontend en Vercel.
- El backend debe emitir cookie con `Secure=true` y `SameSite=None` si frontend y backend corren en dominios distintos.
