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
};

/**
 * Reemplaza el catálogo completo de prompts.
 * @param {Array<{id: number, act: string, prompt: string, category: string}>} prompts
 */
export function setPrompts(prompts) {
  state.prompts = prompts;
  state.visiblePrompts = [...prompts];
}

/**
 * Busca un prompt por id.
 * @param {number} id
 * @returns {{id: number, act: string, prompt: string, category: string} | null}
 */
export function getPromptById(id) {
  return state.prompts.find((prompt) => prompt.id === id) ?? null;
}

/**
 * Aplica búsqueda, categoría y orden sobre el catálogo.
 * Actualiza `state.visiblePrompts` y devuelve el resultado.
 * @param {{query?: string, category?: string, sort?: 'default'|'az'|'length'}} options
 * @returns {Array<{id: number, act: string, prompt: string, category: string}>}
 */
export function filterPrompts({
  query = '',
  category = state.currentFilter,
  sort = 'default',
} = {}) {
  const term = query.trim().toLowerCase();

  const visible = state.prompts.filter((prompt) => {
    const matchesQuery =
      !term ||
      prompt.act.toLowerCase().includes(term) ||
      prompt.prompt.toLowerCase().includes(term);
    const matchesCategory =
      category === 'all' || prompt.category === category;

    return matchesQuery && matchesCategory;
  });

  if (sort === 'az') {
    visible.sort((a, b) => a.act.localeCompare(b.act));
  } else if (sort === 'length') {
    visible.sort((a, b) => b.prompt.length - a.prompt.length);
  }

  state.currentFilter = category;
  state.visiblePrompts = visible;

  return visible;
}
