import { readJSON, writeJSON } from './storage.js';

const STORAGE_KEY = 'history';

/** Máximo de prompts recordados (los más recientes primero). */
export const MAX_HISTORY = 50;

/** @type {string[]} */
let recent = [];

/**
 * Carga el historial persistido. Se llama una vez al iniciar la app.
 * @returns {string[]}
 */
export function initHistory() {
  const stored = readJSON(STORAGE_KEY, []);
  const ids = Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [];

  recent = ids.slice(0, MAX_HISTORY);
  return recent;
}

/**
 * @returns {string[]} IDs ordenados de más reciente a más antiguo.
 */
export function getRecentIds() {
  return [...recent];
}

/**
 * @returns {number}
 */
export function getRecentCount() {
  return recent.length;
}

/**
 * Registra la visita a un prompt, moviéndolo al inicio del historial.
 * @param {string} id
 */
export function recordVisit(id) {
  recent = [id, ...recent.filter((item) => item !== id)].slice(0, MAX_HISTORY);
  writeJSON(STORAGE_KEY, recent);
}

/**
 * Vacía el historial.
 */
export function clearHistory() {
  recent = [];
  writeJSON(STORAGE_KEY, recent);
}

/**
 * Reemplaza el historial completo (importación de workspace).
 * @param {string[]} ids
 * @returns {number}
 */
export function replaceRecentIds(ids = []) {
  recent = ids.filter((id) => typeof id === 'string').slice(0, MAX_HISTORY);
  writeJSON(STORAGE_KEY, recent);

  return recent.length;
}
