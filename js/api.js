import { PROMPTS_CSV_URL } from './config.js';
import { parseCSV } from './csv.js';
import { createPromptId, detectCategory } from './utils.js';

/**
 * Carga los prompts desde el repositorio remoto y los normaliza
 * al modelo que consume la UI.
 * @returns {Promise<Array<{id: string, act: string, prompt: string, category: string}>>}
 */
export async function fetchPrompts() {
  const response = await fetch(PROMPTS_CSV_URL);

  if (!response.ok) {
    throw new Error(`No se pudo cargar prompts.csv (HTTP ${response.status})`);
  }

  const rows = parseCSV(await response.text());
  const prompts = [];
  const seen = new Set();

  for (const row of rows) {
    const act = row.act?.trim() || 'Sin Título';
    const prompt = row.prompt || '';

    if (!prompt) continue;

    const id = createPromptId(act, prompt);
    if (seen.has(id)) continue;

    seen.add(id);
    prompts.push({
      id,
      act,
      prompt,
      category: detectCategory(act, prompt),
    });
  }

  return prompts;
}
