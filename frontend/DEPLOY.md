# Frontend — Vercel

La guía completa desde cero está en **[DEPLOY.md](../DEPLOY.md)** (raíz del repo).

## Resumen

### Opción A — Monorepo (recomendada)

Vercel usa el `vercel.json` de la raíz:

| Campo | Valor |
|-------|-------|
| Root Directory | `.` (raíz) |
| Build | automático (`generate:icons` + `build`) |
| Output | `frontend/dist` |

### Opción B — Solo carpeta `frontend`

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run generate:icons && npm run build` |
| Output | `dist` |

## Variables (Production)

```env
VITE_API_URL=https://tu-api.up.railway.app/api/v1
VITE_APP_NAME=El Progreso
```

HTTPS obligatorio y debe incluir `/api/v1`. El `prebuild` falla el deploy si falta o es inválida.
