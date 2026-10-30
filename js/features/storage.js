/**
 * Wrapper de `localStorage` con namespace propio y manejo de errores.
 * Si el navegador bloquea el almacenamiento (modo privado, políticas),
 * todas las operaciones degradan a valores por defecto sin romper la app.
 */

const NAMESPACE = 'prompthub:v1:';

/**
 * Comprueba que `localStorage` esté disponible y sea escribible.
 * @returns {Storage|null}
 */
function resolveStorage() {
  try {
    const storage = window.localStorage;
    const probe = `${NAMESPACE}__probe__`;

    storage.setItem(probe, '1');
    storage.removeItem(probe);

    return storage;
  } catch {
    return null;
  }
}

const storage = resolveStorage();

/**
 * Indica si la persistencia está disponible.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  return storage !== null;
}

/**
 * Lee un valor JSON del namespace de la app.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function readJSON(key, fallback) {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(NAMESPACE + key);
    if (raw === null) return fallback;

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Guarda un valor JSON en el namespace de la app.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} `true` si se guardó.
 */
export function writeJSON(key, value) {
  if (!storage) return false;

  try {
    storage.setItem(NAMESPACE + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina una clave del namespace.
 * @param {string} key
 */
export function removeKey(key) {
  if (!storage) return;

  try {
    storage.removeItem(NAMESPACE + key);
  } catch {
    // Sin acción: la app sigue funcionando en memoria.
  }
}
