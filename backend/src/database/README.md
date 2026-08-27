# Base de datos El Progreso

## Un solo comando para todo

```bash
npm run db:setup
```

Eso es todo lo que necesitás al deployar o instalar desde cero.

### Qué hace `db:setup`

1. Crea la base de datos `el_progreso` (si no existe)
2. Ejecuta `schema.sql` — 17 tablas + datos iniciales:
   - Roles (admin, empleado)
   - Permisos del sistema
   - Categorías de ejemplo
   - Métodos de pago (efectivo, transferencia, tarjeta, cuenta corriente)
3. Crea el usuario administrador con `ADMIN_PASSWORD`

### Variables requeridas

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=el_progreso

ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña_segura
```

### Deploy (Railway)

En el start command del servicio:

```bash
npm run start:prod
```

Es **idempotente**: podés ejecutarlo en cada deploy sin romper datos existentes.

### Archivos en esta carpeta

| Archivo | Descripción |
|---------|-------------|
| `setup.js` | Script único de instalación |
| `schema.sql` | Esquema completo + seeds |

Guía de deploy: [DEPLOY.md](../../DEPLOY.md)
