/**
 * Referencias a los nodos del DOM usados por la aplicación.
 * Los módulos se ejecutan después de parsear el HTML, por lo que
 * estos elementos ya existen.
 */
export const dom = {
  // Barra superior y estado
  promptCountBadge: document.getElementById('prompt-count-badge'),
  toastContainer: document.getElementById('toast-container'),

  // Controles de búsqueda
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search'),
  categoryTags: document.getElementById('category-tags'),

  // Feed principal
  statusText: document.getElementById('status-text'),
  sortOrderSelect: document.getElementById('sort-order'),
  promptsGrid: document.getElementById('prompts-grid'),
  noResults: document.getElementById('no-results'),
  resetSearchBtn: document.getElementById('reset-search-btn'),

  // Playground
  playgroundEmpty: document.getElementById('playground-empty'),
  playgroundActive: document.getElementById('playground-active'),
  pgTitle: document.getElementById('pg-title'),
  pgVarsContainer: document.getElementById('pg-variables-container'),
  pgOutput: document.getElementById('pg-output'),
  pgCopyBtn: document.getElementById('pg-copy-btn'),
  pgResetBtn: document.getElementById('pg-reset-btn'),
};
