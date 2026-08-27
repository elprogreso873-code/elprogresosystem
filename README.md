# El Progreso — Gestión de Ventas (PWA)

Base profesional Full Stack para un sistema de ventas escalable. **Fase 1:** autenticación JWT, gestión de usuarios y PWA.

## Requisitos

- Node.js 18+
- MySQL 8+

## Inicio rápido

### 1. Base de datos

```bash
mysql -u root -p < backend/src/database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con credenciales MySQL y JWT_SECRET
npm install
npm run db:setup
npm run dev
```

API: `http://localhost:3000/api/v1`  
Usuario demo: **admin** / **Admin123!**

Si ya tenías la BD anterior:
```bash
mysql -u root -p el_progreso < backend/src/database/migration-empleado-permisos.sql
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
node scripts/generate-pwa-icons.mjs
npm run dev
```

App: `http://localhost:5173`

## Producción

Guía paso a paso (GitHub + Railway + Vercel): **[DEPLOY.md](DEPLOY.md)**


## Estructura del proyecto

### Frontend (`frontend/src/`)

| Carpeta | Propósito |
|---------|-----------|
| `api/` | Cliente HTTP (Axios) e interceptores |
| `assets/` | Imágenes, fuentes y recursos estáticos |
| `components/common/` | Componentes reutilizables (Logo, paginación) |
| `components/forms/` | Formularios con React Hook Form |
| `components/ui/` | UI base (Button, Input, Modal, Card) |
| `hooks/` | Lógica reutilizable (debounce, PWA install) |
| `layouts/` | Layouts de autenticación y dashboard |
| `pages/` | Vistas por ruta |
| `routes/` | Router y rutas protegidas |
| `services/` | Llamadas a la API por dominio |
| `store/` | Estado global (Zustand — autenticación) |
| `utils/` | Helpers (fechas, errores) |
| `validations/` | Esquemas Zod del cliente |

### Backend (`backend/src/`)

| Carpeta | Propósito |
|---------|-----------|
| `config/` | Variables de entorno y pool MySQL |
| `controllers/` | Capa HTTP — recibe req/res |
| `services/` | Lógica de negocio |
| `middlewares/` | Auth, validación, rate limit, errores |
| `routes/` | Definición de endpoints |
| `validations/` | Esquemas Zod del servidor |
| `utils/` | JWT, errores, sanitización |
| `database/` | SQL schema y seeds |

## Fase 2 — Catálogo (Categorías y Productos)

Si ya tenías la BD de la fase 1:

```bash
mysql -u root -p el_progreso < backend/src/database/migration-fase2-catalogo.sql
```

### Módulos incluidos
- **Categorías**: CRUD, búsqueda, filtros, baja lógica (no desactiva si tiene productos activos)
- **Productos**: código/SKU, precios, stock inicial, stock mínimo, unidad de medida, categoría

### Permisos nuevos (asignables a empleados)
- `categorias.ver` / `.crear` / `.editar` / `.desactivar`
- `productos.ver` / `.crear` / `.editar` / `.desactivar`

### API Fase 2
| Método | Ruta |
|--------|------|
| GET/POST | `/api/v1/categories` |
| GET | `/api/v1/categories/activas` |
| PUT/PATCH | `/api/v1/categories/:id` |
| GET/POST | `/api/v1/products` |
| PUT/PATCH | `/api/v1/products/:id/deactivate` |

Rutas frontend: `/catalogo/categorias`, `/catalogo/productos`

---

## Fase 3 — Comercial (Clientes, Inventario, Ventas)

```bash
mysql -u root -p el_progreso < backend/src/database/migration-fase3-comercial.sql
```

### Módulos
- **Clientes**: documento, contacto, baja lógica
- **Inventario**: movimientos entrada/salida/ajuste con trazabilidad y resumen de stock
- **Ventas**: carrito, descuentos, número automático `VTA-YYYY-XXXXXX`, descuenta stock, anulación restaura stock

### Permisos Fase 3
`clientes.*`, `inventario.ver`, `inventario.movimiento`, `ventas.ver`, `ventas.crear`, `ventas.anular`

### Rutas frontend
`/ventas`, `/ventas/nueva`, `/caja`  
`/catalogo/categorias`, `/catalogo/productos`, `/catalogo/inventario`  
`/clientes/listado`, `/clientes/cuenta-corriente`  
(Redirecciones: `/comercial/clientes` → listado)

---

## Fase 5 — Cuenta corriente

```bash
mysql -u root -p el_progreso < backend/src/database/migration-fase5-cuenta-corriente.sql
```

### Funcionalidad
- Método de pago **Cuenta corriente** (solo con cliente seleccionado, no consumidor final)
- Libro de movimientos: cargo (venta), cobro, ajuste, anulación
- Saldo y límite de crédito por cliente
- Cobros parciales o totales desde la ficha del cliente

### Permisos Fase 5
`cuenta_corriente.ver`, `cuenta_corriente.cobrar`, `cuenta_corriente.ajustar`

---

## Fase 4 — Finanzas (Caja, Comprobantes, Reportes, Auditoría)

```bash
mysql -u root -p el_progreso < backend/src/database/migration-fase4-finanzas.sql
```

### Módulos
- **Caja**: apertura/cierre de turno, ingresos/egresos, arqueo, ventas en efectivo vinculadas
- **Comprobantes**: ticket/boleta/factura al vender, impresión
- **Ventas**: método de pago, monto recibido y vuelto
- **Reportes**: ingresos, ventas por día, top productos, stock bajo, por vendedor
- **Auditoría**: registro de acciones críticas

### Permisos Fase 4
`caja.*`, `comprobantes.ver`, `reportes.ver`, `auditoria.ver`

### Rutas frontend
`/finanzas/comprobantes`, `/finanzas/reportes`, `/finanzas/auditoria`

Tras la migración, cierra sesión y vuelve a entrar para cargar permisos nuevos.

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| **admin** | Todo el sistema (sin restricciones) |
| **empleado** | Solo lo asignado en Configuración → Permisos |

Por defecto un empleado nuevo solo tiene `dashboard.ver`. La sección **Configuración** del menú (Usuarios + Permisos) solo aparece si tiene algún permiso de esos módulos.

## API (Fase 1)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión (devuelve `permisos`) |
| POST | `/api/v1/auth/register` | Registrar (solo admin) |
| GET | `/api/v1/auth/me` | Perfil + permisos |
| GET | `/api/v1/users` | Listado (`usuarios.ver`) |
| POST | `/api/v1/users` | Crear (`usuarios.crear`) |
| PUT | `/api/v1/users/:id` | Editar (`usuarios.editar`) |
| PATCH | `/api/v1/users/:id/deactivate` | Baja lógica |
| GET | `/api/v1/permissions/empleados` | Empleados para asignar |
| GET | `/api/v1/permissions/usuarios/:id` | Permisos de un empleado |
| PUT | `/api/v1/permissions/usuarios/:id` | Guardar permisos |

## PWA

- Manifest, service worker y caché offline vía `vite-plugin-pwa`
- Instalable en Android, Windows e iOS (Safari → Compartir → Añadir a inicio)
- Iconos: `node scripts/generate-pwa-icons.mjs`

## Próximas ampliaciones

Integración fiscal (SRI/AFIP según país), múltiples cajas, exportación PDF/Excel de reportes, notificaciones de stock bajo y app móvil dedicada.

## Licencia

Proyecto privado — El Progreso.
