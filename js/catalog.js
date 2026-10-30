import { createPromptId, detectCategory } from './utils.js';

/**
 * Normalización del catálogo de prompts.
 * Funciones puras, compartidas por el runtime (navegador) y por
 * `scripts/build-catalog.mjs` (Node), para que el snapshot y la app
 * produzcan exactamente los mismos IDs.
 */

/**
 * Convierte filas crudas (`{act, prompt}`) en prompts normalizados.
 * Deduplica por ID y descarta entradas sin contenido.
 * @param {Array<Record<string, unknown>>} entries
 * @returns {Array<{id: string, act: string, prompt: string, category: string}>}
 */
export function normalizeCatalogEntries(entries = []) {
  const prompts = [];
  const seen = new Set();

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;

    const act = typeof entry.act === 'string' ? entry.act.trim() : '';
    const prompt = typeof entry.prompt === 'string' ? entry.prompt : '';

    if (!prompt) continue;

    const title = act || 'Sin Título';
    const id = createPromptId(title, prompt);

    if (seen.has(id)) continue;

    seen.add(id);
    prompts.push({
      id,
      act: title,
      prompt,
      category: detectCategory(title, prompt),
    });
  }

  return prompts;
}

/**
 * Valida y normaliza el contenido de `data/prompts.json`.
 * Acepta tanto el objeto con metadatos como un array plano.
 * @param {unknown} payload
 * @returns {Array<{id: string, act: string, prompt: string, category: string}>}
 */
export function parseCatalogPayload(payload) {
  const entries = Array.isArray(payload) ? payload : payload?.prompts;

  if (!Array.isArray(entries)) {
    throw new Error('El snapshot del catálogo no tiene el formato esperado.');
  }

  return normalizeCatalogEntries(entries);
}
