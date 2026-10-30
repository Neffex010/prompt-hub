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
  flagsContainer: document.getElementById('flags-container'),

  // Workspace local
  workspaceFavorites: document.getElementById('workspace-favorites'),
  workspaceHistory: document.getElementById('workspace-history'),
  exportWorkspaceBtn: document.getElementById('export-workspace'),
  importWorkspaceBtn: document.getElementById('import-workspace'),
  importFileInput: document.getElementById('import-file'),
  clearHistoryBtn: document.getElementById('clear-history'),

  // Feed principal
  statusText: document.getElementById('status-text'),
  sortOrderSelect: document.getElementById('sort-order'),
  promptsGrid: document.getElementById('prompts-grid'),
  noResults: document.getElementById('no-results'),
  resetSearchBtn: document.getElementById('reset-search-btn'),

  // Playground
  playgroundEmpty: document.getElementById('playground-empty'),
  playgroundActive: document.getElementById('playground-active'),
  pgActiveBadge: document.getElementById('active-prompt-badge'),
  pgTitle: document.getElementById('pg-title'),
  pgVarsContainer: document.getElementById('pg-variables-container'),
  pgOutput: document.getElementById('pg-output'),
  pgStats: document.getElementById('pg-stats'),
  pgCopyBtn: document.getElementById('pg-copy-btn'),
  pgShareBtn: document.getElementById('pg-share-btn'),
  pgResetBtn: document.getElementById('pg-reset-btn'),
  pgChatgptLink: document.getElementById('pg-chatgpt-link'),
  pgClaudeLink: document.getElementById('pg-claude-link'),
};
