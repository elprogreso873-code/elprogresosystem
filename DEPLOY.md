# Despliegue — El Progreso (producción)

Guía desde cero: **GitHub** (código) → **Railway** (API + MySQL) → **Vercel** (PWA).

```
Navegador  →  Vercel (React PWA)  →  Railway (Node API)  →  Railway MySQL
```

Usá **proyectos nuevos**. No reutilices los de Tran-Pack.

---

## 0. Qué vas a necesitar

- Cuenta en [GitHub](https://github.com), [Railway](https://railway.app) y [Vercel](https://vercel.com)
- Node.js 18+ en tu PC (solo para generar el `JWT_SECRET`)
- El código de este repo listo para subir (sin `.env` — nunca se suben secretos)

---

## 1. Generar secretos (en tu PC)

En una terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Anotá el resultado: es el **JWT_SECRET**.

Elegí también un **ADMIN_PASSWORD** de al menos 12 caracteres (no uses `Admin123!`).

---

## 2. Subir el código a GitHub (repo privado y nuevo)

1. En GitHub: **New repository** → nombre `el-progreso` (o similar) → **Private**.
2. No marques README, .gitignore ni licencia (el proyecto ya los tiene).
3. En la carpeta del proyecto:

```bash
git add .
git status
git commit -m "Listo para producción — El Progreso"
git remote add origin https://github.com/TU_USUARIO/el-progreso.git
git branch -M main
git push -u origin main
```

Si `git add` muestra `backend/.env` o `frontend/.env`, **no subas esos archivos**. Están en `.gitignore`.

---

## 3. Railway — base de datos + API

### 3.1 Proyecto y MySQL

1. Entrá a [railway.app](https://railway.app) → **New Project**.
2. **Add MySQL** (Database → MySQL).
3. Esperá a que el MySQL quede **Online**.

### 3.2 Servicio Node (backend)

1. En el mismo proyecto: **New** → **GitHub Repo** → elegí `el-progreso`.
2. Settings del servicio Node:
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**` (si aparece la opción)
3. **Settings → Deploy:**
   - Start Command: `npm run start:prod`  
     *(ya está en `backend/railway.toml`; confirmalo)*
   - Healthcheck Path: `/health`
4. **Settings → Networking → Generate Domain**  
   Copiá la URL, por ejemplo: `https://el-progreso-api.up.railway.app`

### 3.3 Variables del servicio Node

En el servicio **Node** (no en el MySQL) → **Variables**.

Conectá el MySQL con **Variable References** (el nombre del servicio MySQL suele ser `MySQL`):

```env
NODE_ENV=production
DB_TIMEZONE=-03:00

DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

JWT_SECRET=pegá_acá_el_secreto_de_64+_caracteres
JWT_EXPIRES_IN=8h

ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_fuerte_minimo_12_caracteres

CORS_ORIGIN=https://PENDIENTE.vercel.app
```

**No definas `PORT`.** Railway lo asigna solo. Si lo ponés en `3000`, el health check puede fallar.

`CORS_ORIGIN` se completa en el paso 4 (URL de Vercel, **sin** barra final).

Guardá. Railway redespliega. El primer arranque corre `db:setup` (tablas + admin) y después el API.

### 3.4 Verificar la API

Abrí en el navegador:

```
https://TU-API.up.railway.app/health
```

Tenés que ver `"status":"healthy"` y `"service":"el-progreso-api"`.  
Si falla, mirá **Deployments → View Logs**.

---

## 4. Vercel — frontend (PWA)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importá el mismo repo de GitHub.
2. **Root Directory:** dejar `.` (raíz). Vercel usa el `vercel.json` de la raíz.
3. **Environment Variables** (Production):

```env
VITE_API_URL=https://TU-API.up.railway.app/api/v1
VITE_APP_NAME=El Progreso
```

`VITE_API_URL` debe ser HTTPS y terminar en `/api/v1` (sin barra extra al final).

4. Deploy. Copiá la URL: `https://el-progreso.vercel.app` (o la que asigne Vercel).

5. Volvé a Railway → variable **CORS_ORIGIN**:

```env
CORS_ORIGIN=https://el-progreso.vercel.app
```

Sin `/` al final. Railway redespliega solo.

6. En Vercel, **Redeploy** el frontend (por si el primer build falló o para asegurar que usa la API correcta).

---

## 5. Probar producción

- [ ] `https://TU-API.up.railway.app/health` → `healthy`
- [ ] Abre la URL de Vercel → login
- [ ] Usuario `admin` y la **ADMIN_PASSWORD** de Railway (no la de desarrollo)
- [ ] Dashboard, una venta, un ticket, un presupuesto
- [ ] Entrar a `/dashboard` pegando la URL (rewrite SPA)
- [ ] Consola del navegador sin errores CORS
- [ ] En el celular: instalar PWA (menú → Agregar a inicio)

Si el login falla con CORS, el `CORS_ORIGIN` no coincide **exactamente** con la URL de la barra del navegador (incluye `https://`, sin `www` de más, sin `/` final).

---

## 6. Dominio propio (opcional)

1. Vercel → **Settings → Domains** → `app.tudominio.com`
2. En el DNS (Hostinger u otro): `CNAME` → `cname.vercel-dns.com`
3. Railway → `CORS_ORIGIN=https://app.tudominio.com`
4. No hace falta cambiar `VITE_API_URL` si la API sigue en Railway

---

## 7. Qué hace cada deploy

| Lugar | Qué corre |
|-------|-----------|
| Railway | `npm run db:setup && npm start` — crea/actualiza tablas y **restablece la contraseña del admin** a `ADMIN_PASSWORD` |
| Vercel | Genera iconos PWA + `vite build` con `VITE_API_URL` |

Cambiar `ADMIN_PASSWORD` en Railway y redesplegar **cambia el login del admin**. Las contraseñas de empleados no se tocan.

---

## 8. Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---------|--------|-----------|
| Healthcheck failed / timeout | `PORT` fijo o Root Directory mal | No definas `PORT`. Root Directory = `backend` |
| `JWT_SECRET es obligatorio` | Falta la variable | Cargala en el servicio Node, ≥ 32 caracteres |
| `ADMIN_PASSWORD debe tener al menos 12` | Contraseña corta o de demo | Usá una distinta a `Admin123!` |
| CORS en el navegador | Origin distinto a Vercel | `CORS_ORIGIN` = URL exacta de la app |
| Build Vercel: `VITE_API_URL no definida` | Falta env en Vercel | Production → `VITE_API_URL` con `/api/v1` |
| Login 401 | Password de desarrollo | Usá la de Railway, no la local |
| MySQL SSL / ECONNREFUSED | Variables del plugin no referenciadas | `DB_*` con `${{MySQL.MYSQL…}}` |

---

## 9. Checklist final

- [ ] Repo **privado** y nuevo (no el de Tran-Pack)
- [ ] Railway MySQL + Node en el mismo proyecto
- [ ] Root Directory del API: `backend`
- [ ] `NODE_ENV=production`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CORS_ORIGIN`
- [ ] **Sin** variable `PORT`
- [ ] `/health` en `200`
- [ ] Vercel: `VITE_API_URL` HTTPS + `/api/v1`
- [ ] Login en producción OK
- [ ] PWA instalable
