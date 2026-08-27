/**
 * Valida variables de entorno antes del build de producción.
 * Se ejecuta automáticamente con npm run build (prebuild).
 *
 * Falla en Vercel/CI si falta VITE_API_URL.
 * En build local solo advierte (usar VITE_STRICT_BUILD=true para forzar).
 */
const apiUrl = process.env.VITE_API_URL?.trim();
const mustEnforce =
  process.env.VERCEL === '1' ||
  process.env.CI === 'true' ||
  process.env.VITE_STRICT_BUILD === 'true';

const errors = [];
const warnings = [];

if (!apiUrl) {
  const msg =
    'VITE_API_URL no definida (ej. https://tu-api.up.railway.app/api/v1).';
  if (mustEnforce) errors.push(msg);
  else warnings.push(`${msg} Build local — configurá la variable antes de desplegar.`);
} else {
  if (!/^https:\/\//i.test(apiUrl)) {
    const msg = 'VITE_API_URL debe usar HTTPS en producción.';
    if (mustEnforce) errors.push(msg);
    else warnings.push(msg);
  }
  if (/localhost|127\.0\.0\.1/i.test(apiUrl)) {
    const msg = 'VITE_API_URL apunta a localhost.';
    if (mustEnforce) errors.push(msg);
    else warnings.push(msg);
  }
  if (!apiUrl.includes('/api/v1')) {
    const msg = 'VITE_API_URL debe incluir /api/v1 (ej. https://tu-api.up.railway.app/api/v1).';
    if (mustEnforce) errors.push(msg);
    else warnings.push(msg);
  }
}

for (const warning of warnings) {
  console.warn(`[build] ⚠ ${warning}`);
}

if (errors.length > 0) {
  console.error('[build] Variables de entorno inválidas:\n');
  for (const error of errors) {
    console.error(`  ✗ ${error}`);
  }
  console.error('\nConfigurá las variables en Vercel → Settings → Environment Variables.');
  console.error('Ver DEPLOY.md\n');
  process.exit(1);
}

if (apiUrl && mustEnforce) {
  console.log('[build] ✓ VITE_API_URL configurada');
}
