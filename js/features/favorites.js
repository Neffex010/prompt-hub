import { readJSON, writeJSON } from './storage.js';

const STORAGE_KEY = 'favorites';

/** @type {Set<string>} */
let favorites = new Set();

/**
 * Carga los favoritos persistidos. Se llama una vez al iniciar la app.
 * @returns {Set<string>}
 */
export function initFavorites() {
  const stored = readJSON(STORAGE_KEY, []);
  const ids = Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];

  favorites = new Set(ids);
  return favorites;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  return favorites.has(id);
}

/**
 * @returns {string[]}
 */
export function getFavoriteIds() {
  return [...favorites];
}

/**
 * @returns {number}
 */
export function getFavoritesCount() {
  return favorites.size;
}

/**
 * Añade o quita un prompt de favoritos y persiste el resultado.
 * @param {string} id
 * @returns {boolean} Estado final (`true` = es favorito).
 */
export function toggleFavorite(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }

  writeJSON(STORAGE_KEY, [...favorites]);
  return favorites.has(id);
}

/**
 * Reemplaza la lista completa de favoritos (importación de workspace).
 * @param {string[]} ids
 * @returns {number} Cantidad final de favoritos.
 */
export function replaceFavorites(ids = []) {
  favorites = new Set(ids.filter((id) => typeof id === 'string'));
  writeJSON(STORAGE_KEY, [...favorites]);

  return favorites.size;
}
