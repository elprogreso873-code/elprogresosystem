import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const buildApiNetworkOnlyRules = () => {
  const rules = [
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1'),
      handler: 'NetworkOnly',
      method: 'GET',
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1'),
      handler: 'NetworkOnly',
      method: 'POST',
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1'),
      handler: 'NetworkOnly',
      method: 'PUT',
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1'),
      handler: 'NetworkOnly',
      method: 'PATCH',
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/v1'),
      handler: 'NetworkOnly',
      method: 'DELETE',
    },
  ];

  const apiUrl = process.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      const remoteMatcher = ({ url }) =>
        url.origin === parsed.origin && url.pathname.startsWith('/api/v1');

      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        rules.push({
          urlPattern: remoteMatcher,
          handler: 'NetworkOnly',
          method,
        });
      }
    } catch {
      /* URL inválida en build — se ignora */
    }
  }

  return rules;
};

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, process.cwd(), 'VITE_');
  const isDev = mode === 'development';
  const appName = loaded.VITE_APP_NAME || process.env.VITE_APP_NAME || 'El Progreso';

  const pwaIcons = [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: 'pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
    { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    { src: 'apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png', purpose: 'any' },
    { src: 'apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
    { src: 'apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png', purpose: 'any' },
  ];

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'apple-touch-icon-167x167.png',
          'apple-touch-icon-152x152.png',
          'apple-touch-icon-120x120.png',
          'mask-icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
        ],
        manifest: {
          id: '/',
          name: `${appName} - Gestión de Ventas`,
          short_name: appName,
          description: 'Sistema profesional de gestión de ventas',
          theme_color: '#1B4332',
          background_color: '#1F2937',
          display: 'standalone',
          display_override: ['standalone', 'browser'],
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['business', 'productivity'],
          lang: 'es-AR',
          icons: pwaIcons,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/api\/v1\//],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            ...buildApiNetworkOnlyRules(),
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-static',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: isDev
          ? {
              enabled: true,
              type: 'module',
            }
          : undefined,
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) {
              return 'vendor-form';
            }
            if (id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('axios')) return 'vendor-http';
            if (id.includes('zustand')) return 'vendor-state';
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
  };
});
