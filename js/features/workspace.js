import { getFavoriteIds, replaceFavorites } from './favorites.js';
import { getRecentIds, replaceRecentIds } from './history.js';

/** Versión del formato de exportación. */
export const WORKSPACE_VERSION = 1;

/**
 * Construye el objeto exportable con el estado local del usuario.
 * @returns {{app: string, version: number, exportedAt: string, favorites: string[], recent: string[]}}
 */
export function buildWorkspace() {
  return {
    app: 'prompt-hub',
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    favorites: getFavoriteIds(),
    recent: getRecentIds(),
  };
}

/**
 * Filtra una lista de IDs válidos (strings no vacíos y únicos).
 * @param {unknown} value
 * @returns {string[]}
 */
function sanitizeIds(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter((id) => typeof id === 'string' && id.trim() !== ''))];
}

/**
 * Importa un workspace validando su forma mínima.
 * @param {unknown} data
 * @returns {{favorites: number, recent: number}}
 */
export function importWorkspace(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('El archivo no tiene un formato de workspace válido.');
  }

  const favorites = sanitizeIds(data.favorites);
  const recent = sanitizeIds(data.recent);

  replaceFavorites(favorites);
  replaceRecentIds(recent);

  return { favorites: favorites.length, recent: recent.length };
}

/**
 * Descarga el workspace como archivo JSON.
 * @param {string} [filename]
 */
export function downloadWorkspace(filename) {
  const payload = JSON.stringify(buildWorkspace(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = filename ?? `prompt-hub-workspace-${date}.json`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
