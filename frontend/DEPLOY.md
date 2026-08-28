# Frontend — Vercel

La guía completa desde cero está en **[DEPLOY.md](../DEPLOY.md)** (raíz del repo).

## Resumen (recomendada)

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Framework / Preset | Vite |
| Install / Build | los define `frontend/vercel.json` |

No hace falta editar Build and Output Settings a mano: con Root Directory = `frontend` Vercel trabaja solo en esa carpeta.

## Variables (Production)

```env
VITE_API_URL=https://tu-api.up.railway.app/api/v1
VITE_APP_NAME=El Progreso
```

HTTPS obligatorio y debe incluir `/api/v1`. El `prebuild` falla el deploy si falta o es inválida.
