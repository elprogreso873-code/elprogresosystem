const LEGACY_API_CACHE_NAMES = ['api-cache', 'api-network-only', 'api-remote-network-only'];

/** Elimina caches antiguos que podían guardar respuestas de ventas/API. */
export const purgeLegacyApiCaches = async () => {
  if (!('caches' in window)) return;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => LEGACY_API_CACHE_NAMES.some((legacy) => key.includes(legacy)))
      .map((key) => caches.delete(key))
  );
};
