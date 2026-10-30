import { PROMPTS_CSV_URL } from './config.js';
import { parseCSV } from './csv.js';
import { detectCategory } from './utils.js';

/**
 * Carga los prompts desde el repositorio remoto y los normaliza
 * al modelo que consume la UI.
 * @returns {Promise<Array<{id: number, act: string, prompt: string, category: string}>>}
 */
export async function fetchPrompts() {
  const response = await fetch(PROMPTS_CSV_URL);

  if (!response.ok) {
    throw new Error(`No se pudo cargar prompts.csv (HTTP ${response.status})`);
  }

  const rows = parseCSV(await response.text());

  return rows
    .map((row, index) => ({
      id: index,
      act: row.act?.trim() || 'Sin Título',
      prompt: row.prompt || '',
      category: detectCategory(row.act, row.prompt),
    }))
    .filter((item) => item.prompt !== '');
}
