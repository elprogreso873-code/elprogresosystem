import dotenv from 'dotenv';
import app from './src/app.js';
import { env, validateEnv } from './src/config/env.js';
import { pool, testConnection } from './src/config/database.js';
import { applySchemaPatches } from './src/database/setup.js';

dotenv.config();

/**
 * Red de seguridad: un rechazo no atrapado NO debe tumbar el API.
 * En Node 15+ el default es terminar el proceso; aquí lo logueamos y seguimos.
 * Los controladores deben usar asyncHandler para que Express maneje el error.
 */
process.on('unhandledRejection', (reason) => {
  const message = reason?.message || String(reason);
  console.error(
    '[El Progreso API] UnhandledRejection (servidor sigue activo):',
    message
  );
  if (reason?.stack) {
    console.error(reason.stack);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[El Progreso API] UncaughtException:', err?.message || err);
  if (err?.stack) console.error(err.stack);

  // Errores operativos conocidos: no matar el proceso
  if (err?.isOperational) {
    return;
  }

  // Estado desconocido: salir para que el orquestador (Railway) reinicie limpio
  console.error('[El Progreso API] Saliendo por excepción no operativa…');
  process.exit(1);
});

const startServer = async () => {
  try {
    validateEnv();
    await testConnection();
    await applySchemaPatches(pool);
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`[El Progreso API] Servidor en 0.0.0.0:${env.PORT}`);
      console.log(`[El Progreso API] Entorno: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[El Progreso API] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
