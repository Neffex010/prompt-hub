/**
 * Service worker de PROMPT.HUB.
 *
 * Objetivos:
 *  - que el shell y el catálogo funcionen sin conexión,
 *  - que las actualizaciones lleguen sin quedar atrapadas en caché,
 *  - no romper la app si un recurso opcional (CDN) falla.
 *
 * Estrategias:
 *  - Navegación: network-first con timeout y fallback al index cacheado.
 *  - Mismo origen: stale-while-revalidate.
 *  - CDNs (Tailwind, Lucide, fuentes): stale-while-revalidate en runtime.
 *
 * Al añadir un módulo JS nuevo, añádelo a CORE: `tests/pwa.test.js`
 * falla si algún archivo de `js/` queda fuera.
 */

const VERSION = 'v1.0.1';
const CACHE_PREFIX = 'prompthub-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;
const NAV_TIMEOUT_MS = 4000;

/** Archivos propios que deben estar disponibles sin red. */
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './data/prompts.json',
  './css/styles.css',
  './js/tailwind.config.js',
  './js/config.js',
  './js/utils.js',
  './js/csv.js',
  './js/catalog.js',
  './js/api.js',
  './js/store.js',
  './js/app.js',
  './js/features/storage.js',
  './js/features/favorites.js',
  './js/features/history.js',
  './js/features/workspace.js',
  './js/features/share.js',
  './js/features/tokens.js',
  './js/features/pwa.js',
  './js/ui/dom.js',
  './js/ui/clipboard.js',
  './js/ui/toast.js',
  './js/ui/prompts.js',
  './js/ui/playground.js',
];

/** Hojas de estilo y scripts de CDN necesarios para el aspecto visual. */
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@600;700;800;900&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      await Promise.allSettled(CORE.map((url) => cacheUrl(cache, url)));
      await Promise.allSettled(CDN_ASSETS.map((url) => cacheUrl(cache, url)));
      await cacheFontFiles(cache);

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const obsolete = keys.filter(
        (key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE,
      );

      await Promise.all(obsolete.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  const cacheName = url.origin === self.location.origin ? SHELL_CACHE : RUNTIME_CACHE;
  event.respondWith(staleWhileRevalidate(request, cacheName));
});

/**
 * Guarda una URL en caché tolerando respuestas opacas (CDN sin CORS).
 * @param {Cache} cache
 * @param {string} url
 * @param {{ noCors?: boolean }} [options]
 */
async function cacheUrl(cache, url, { noCors = false } = {}) {
  try {
    const response = await fetch(url, {
      cache: 'reload',
      mode: noCors ? 'no-cors' : 'cors',
    });

    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(url, response);
    }
  } catch {
    // Un recurso opcional que no se puede cachear no debe romper el install.
  }
}

/**
 * Intenta cachear los .woff2 que referencia el CSS de Google Fonts,
 * para que la tipografía se mantenga sin red.
 * @param {Cache} cache
 */
async function cacheFontFiles(cache) {
  const cssUrl = CDN_ASSETS[2];

  try {
    const response = await fetch(cssUrl, { mode: 'cors' });
    if (!response.ok) return;

    const css = await response.text();
    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(
      (match) => match[1],
    );

    await Promise.allSettled([...new Set(urls)].map((url) => cacheUrl(cache, url, { noCors: true })));
  } catch {
    // Sin fuentes offline se usa el fallback del sistema.
  }
}

/**
 * Navegación: intenta red primero (para recibir despliegues nuevos) con
 * timeout; si falla, sirve el index cacheado.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);

  const network = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      cache.put('./index.html', response.clone()).catch(() => {});
    }
    return response;
  });

  try {
    return await withTimeout(network, NAV_TIMEOUT_MS);
  } catch {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match('./index.html')) ||
      (await cache.match('./'));

    return cached || offlineFallback();
  }
}

/**
 * Devuelve la copia cacheada al instante y actualiza en segundo plano.
 * @param {Request} request
 * @param {string} cacheName
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await network;
  return fresh || new Response('', { status: 504, statusText: 'Sin conexión' });
}

/**
 * Rechaza si la promesa no resuelve a tiempo.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Página mínima cuando no hay red ni copia cacheada.
 * @returns {Response}
 */
function offlineFallback() {
  return new Response(
    '<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>Sin conexión</title>' +
      '<body style="font-family:system-ui;padding:2rem"><h1>Sin conexión</h1>' +
      '<p>PROMPT.HUB necesita una primera visita con red para guardar el catálogo.</p></body></html>',
    { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
