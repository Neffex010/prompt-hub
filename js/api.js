import { PROMPTS_CSV_URL } from './config.js';
import { normalizeCatalogEntries, parseCatalogPayload } from './catalog.js';
import { parseCSV } from './csv.js';

/**
 * Capa de datos del catálogo.
 *
 * Orden de preferencia:
 *  1. Snapshot local `data/prompts.json` (rápido, IDs estables, sirve offline).
 *  2. CSV remoto de prompts.chat (resiliencia si el snapshot no está publicado).
 */

const SNAPSHOT_URL = new URL('../data/prompts.json', import.meta.url);

/**
 * Descarga el snapshot local del catálogo.
 * @returns {Promise<Array<{id: string, act: string, prompt: string, category: string}>>}
 */
async function fetchSnapshot() {
  const response = await fetch(SNAPSHOT_URL, { cache: 'no-cache' });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el snapshot (HTTP ${response.status})`);
  }

  return parseCatalogPayload(await response.json());
}

/**
 * Descarga y normaliza el CSV remoto (fallback).
 * @returns {Promise<Array<{id: string, act: string, prompt: string, category: string}>>}
 */
async function fetchRemoteCatalog() {
  const response = await fetch(PROMPTS_CSV_URL);

  if (!response.ok) {
    throw new Error(`No se pudo cargar prompts.csv (HTTP ${response.status})`);
  }

  return normalizeCatalogEntries(parseCSV(await response.text()));
}

/**
 * Carga los prompts desde el snapshot local o, si falla, desde el origen remoto.
 * @returns {Promise<Array<{id: string, act: string, prompt: string, category: string}>>}
 */
export async function fetchPrompts() {
  try {
    const prompts = await fetchSnapshot();

    if (prompts.length > 0) return prompts;

    console.warn('El snapshot está vacío; se usará el catálogo remoto.');
  } catch (error) {
    console.warn('Snapshot no disponible; se usará el catálogo remoto.', error);
  }

  return fetchRemoteCatalog();
}
