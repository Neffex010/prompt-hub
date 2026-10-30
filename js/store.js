import { fuzzyScore, hasPlaceholders } from './utils.js';

/**
 * Estado central de la aplicación y lógica de filtrado/orden.
 */

export const state = {
  /** Todos los prompts normalizados. */
  prompts: [],
  /** Prompts que cumplen los filtros activos. */
  visiblePrompts: [],
  /** Filtro de categoría activo ('all' | 'code' | 'write' | 'teach' | ...). */
  currentFilter: 'all',
  /** Filtros por flags (favoritos, variables, recientes). */
  onlyFavorites: false,
  onlyVariables: false,
  onlyRecent: false,
};

/**
 * Reemplaza el catálogo completo de prompts.
 * @param {Array<{id: string, act: string, prompt: string, category: string}>} prompts
 */
export function setPrompts(prompts) {
  state.prompts = prompts;
  state.visiblePrompts = [...prompts];
}

/**
 * Busca un prompt por id.
 * @param {string} id
 * @returns {{id: string, act: string, prompt: string, category: string} | null}
 */
export function getPromptById(id) {
  return state.prompts.find((prompt) => prompt.id === id) ?? null;
}

/**
 * Aplica búsqueda difusa, categoría, flags y orden sobre el catálogo.
 * Actualiza `state.visiblePrompts` y devuelve el resultado.
 * @param {{
 *   query?: string,
 *   category?: string,
 *   sort?: 'default'|'az'|'length',
 *   onlyFavorites?: boolean,
 *   onlyVariables?: boolean,
 *   onlyRecent?: boolean,
 *   favoriteIds?: Iterable<string>,
 *   recentIds?: string[],
 * }} options
 * @returns {Array<{id: string, act: string, prompt: string, category: string}>}
 */
export function filterPrompts({
  query = '',
  category = state.currentFilter,
  sort = 'default',
  onlyFavorites = state.onlyFavorites,
  onlyVariables = state.onlyVariables,
  onlyRecent = state.onlyRecent,
  favoriteIds = new Set(),
  recentIds = [],
} = {}) {
  const term = query.trim();
  const favorites = favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds);
  const recentOrder = new Map(recentIds.map((id, index) => [id, index]));

  const scored = [];

  for (const prompt of state.prompts) {
    if (category !== 'all' && prompt.category !== category) continue;
    if (onlyFavorites && !favorites.has(prompt.id)) continue;
    if (onlyVariables && !hasPlaceholders(prompt.prompt)) continue;
    if (onlyRecent && !recentOrder.has(prompt.id)) continue;

    const titleScore = term ? fuzzyScore(prompt.act, term) : 1;
    const bodyScore = term ? fuzzyScore(prompt.prompt, term) : 1;

    if (term && titleScore === 0 && bodyScore === 0) continue;

    scored.push({
      prompt,
      score: titleScore * 1.2 + bodyScore,
    });
  }

  if (sort === 'az') {
    scored.sort((a, b) => a.prompt.act.localeCompare(b.prompt.act));
  } else if (sort === 'length') {
    scored.sort((a, b) => b.prompt.prompt.length - a.prompt.prompt.length);
  } else if (term) {
    scored.sort(
      (a, b) => b.score - a.score || a.prompt.act.localeCompare(b.prompt.act),
    );
  } else if (onlyRecent) {
    scored.sort(
      (a, b) => recentOrder.get(a.prompt.id) - recentOrder.get(b.prompt.id),
    );
  }

  const visible = scored.map((item) => item.prompt);

  state.currentFilter = category;
  state.onlyFavorites = onlyFavorites;
  state.onlyVariables = onlyVariables;
  state.onlyRecent = onlyRecent;
  state.visiblePrompts = visible;

  return visible;
}
