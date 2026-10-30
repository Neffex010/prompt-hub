/**
 * Registro del service worker (PWA).
 * Solo se registra en contextos seguros (HTTPS o localhost): en otros casos
 * el navegador rechazaría el registro y la app debe seguir funcionando igual.
 */

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Indica si el navegador está en un contexto donde el SW puede registrarse.
 * @returns {boolean}
 */
function canRegister() {
  if (!('serviceWorker' in navigator)) return false;

  const { protocol, hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

  return protocol === 'https:' || (protocol === 'http:' && isLocal);
}

/**
 * Registra `sw.js` y aplica actualizaciones sin dejar la app con código viejo.
 */
export function registerServiceWorker() {
  if (!canRegister()) return;

  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // En la primera instalación no hay recarga; en una actualización sí.
    if (hadController) window.location.reload();
  });

  window.addEventListener(
    'load',
    async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          new URL('../../sw.js', import.meta.url),
          { scope: './', updateViaCache: 'none' },
        );

        setInterval(() => {
          registration.update().catch(() => {});
        }, UPDATE_INTERVAL_MS);
      } catch (error) {
        console.warn('No se pudo registrar el service worker.', error);
      }
    },
    { once: true },
  );
}
