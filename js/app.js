import { SEARCH_DEBOUNCE_MS } from './config.js';
import { fetchPrompts } from './api.js';
import {
  filterPrompts,
  getPromptById,
  setPrompts,
  state,
} from './store.js';
import {
  getFavoriteIds,
  getFavoritesCount,
  initFavorites,
  toggleFavorite,
} from './features/favorites.js';
import {
  clearHistory,
  getRecentCount,
  getRecentIds,
  initHistory,
  recordVisit,
} from './features/history.js';
import { parseShareHash } from './features/share.js';
import { registerServiceWorker } from './features/pwa.js';
import {
  downloadWorkspace,
  importWorkspace,
} from './features/workspace.js';
import { copyToClipboard } from './ui/clipboard.js';
import { dom } from './ui/dom.js';
import { initPlayground, loadPrompt } from './ui/playground.js';
import { initPrompts, renderPrompts } from './ui/prompts.js';
import { showToast } from './ui/toast.js';
import { debounce } from './utils.js';

/* --------------------------------------------------------------------------
   Estilos de botones (deben coincidir con las clases de Tailwind en el HTML)
   -------------------------------------------------------------------------- */

const TAG_ACTIVE =
  'tag-btn bg-black text-white border-2 border-black text-xs font-mono px-2.5 py-1 font-bold shadow-brutal-sm';
const TAG_IDLE =
  'tag-btn bg-white text-black border-2 border-black text-xs font-mono px-2.5 py-1 font-bold shadow-brutal-sm hover:bg-brutal-yellow';

const FLAG_ACTIVE =
  'flag-btn bg-black text-white border-2 border-black text-[11px] font-mono px-2 py-1 font-bold shadow-brutal-sm';
const FLAG_IDLE =
  'flag-btn bg-white text-black border-2 border-black text-[11px] font-mono px-2 py-1 font-bold shadow-brutal-sm hover:bg-brutal-cyan';

/* --------------------------------------------------------------------------
   Render / sincronización de la UI
   -------------------------------------------------------------------------- */

/**
 * Recalcula los prompts visibles y actualiza el feed.
 */
function refresh() {
  const visible = filterPrompts({
    query: dom.searchInput.value,
    category: state.currentFilter,
    sort: dom.sortOrderSelect.value,
    onlyFavorites: state.onlyFavorites,
    onlyVariables: state.onlyVariables,
    onlyRecent: state.onlyRecent,
    favoriteIds: new Set(getFavoriteIds()),
    recentIds: getRecentIds(),
  });

  renderPrompts(visible);
  dom.statusText.textContent = `MOSTRANDO ${visible.length} DE ${state.prompts.length} PROMPTS`;
  updateWorkspaceCounts();
}

/**
 * Marca visualmente el filtro de categoría activo.
 */
function updateTagButtons() {
  dom.categoryTags.querySelectorAll('.tag-btn').forEach((btn) => {
    btn.className = btn.dataset.filter === state.currentFilter ? TAG_ACTIVE : TAG_IDLE;
  });
}

/**
 * Marca visualmente los filtros por flags activos.
 */
function updateFlagButtons() {
  const flags = {
    favorites: state.onlyFavorites,
    variables: state.onlyVariables,
    recent: state.onlyRecent,
  };

  dom.flagsContainer.querySelectorAll('.flag-btn').forEach((btn) => {
    btn.className = flags[btn.dataset.flag] ? FLAG_ACTIVE : FLAG_IDLE;
    btn.setAttribute('aria-pressed', String(Boolean(flags[btn.dataset.flag])));
  });
}

/**
 * Actualiza los contadores del workspace.
 */
function updateWorkspaceCounts() {
  dom.workspaceFavorites.textContent = getFavoritesCount();
  dom.workspaceHistory.textContent = getRecentCount();
}

/**
 * Limpia la búsqueda y restablece todos los filtros.
 */
function resetFilters() {
  dom.searchInput.value = '';
  dom.clearSearchBtn.classList.add('hidden');
  dom.sortOrderSelect.value = 'default';
  state.currentFilter = 'all';
  state.onlyFavorites = false;
  state.onlyVariables = false;
  state.onlyRecent = false;

  updateTagButtons();
  updateFlagButtons();
  refresh();
}

/**
 * Sincroniza el corazón de todas las tarjetas de un prompt.
 * @param {string} id
 * @param {boolean} favorite
 */
function syncFavoriteButtons(id, favorite) {
  dom.promptsGrid
    .querySelectorAll(`[data-action="favorite"][data-id="${id}"]`)
    .forEach((button) => {
      button.classList.toggle('is-favorite', favorite);
      button.setAttribute('aria-pressed', String(favorite));
      button.title = favorite ? 'Quitar de favoritos' : 'Guardar en favoritos';
    });
}

/**
 * Abre un prompt en el playground y lo registra en el historial.
 * @param {{id: string, act: string, prompt: string}} prompt
 * @param {Record<string, string>} [values]
 */
function activatePrompt(prompt, values) {
  loadPrompt(prompt, values);
  recordVisit(prompt.id);
  updateWorkspaceCounts();

  if (state.onlyRecent) refresh();
}

/* --------------------------------------------------------------------------
   Carga de datos
   -------------------------------------------------------------------------- */

/**
 * Restaura un prompt compartido si el hash de la URL lo indica.
 * @returns {boolean} `true` si se cargó algo.
 */
function restoreSharedPrompt() {
  const shared = parseShareHash(window.location.hash);
  if (!shared) return false;

  const prompt = getPromptById(shared.promptId);
  if (!prompt) {
    showToast('El prompt compartido no existe en el catálogo', 'error');
    return false;
  }

  activatePrompt(prompt, shared.values);
  return true;
}

/**
 * Obtiene los prompts y arranca la vista, o muestra el estado de error.
 */
async function loadPrompts() {
  try {
    dom.statusText.textContent = 'Cargando repositorio desde GitHub...';

    const prompts = await fetchPrompts();
    setPrompts(prompts);

    dom.promptCountBadge.textContent = `${prompts.length} PROMPTS`;
    refresh();
    restoreSharedPrompt();
  } catch (error) {
    console.error(error);

    dom.statusText.textContent = 'ERROR AL CARGAR PROMPTS DESDE LA API';
    dom.noResults.classList.add('hidden');
    dom.promptsGrid.classList.remove('hidden');
    dom.promptsGrid.innerHTML = `
      <div class="col-span-full bg-brutal-pink text-white p-6 border-brutal-thick shadow-brutal">
        <h3 class="font-black text-xl uppercase">Error de Conexión</h3>
        <p class="font-mono text-sm mt-2">No se pudo obtener el catálogo CSV de GitHub. Verifica tu conexión y recarga la página.</p>
      </div>
    `;
    window.lucide?.createIcons();
  }
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */

function bindEvents() {
  const handleSearch = debounce(refresh, SEARCH_DEBOUNCE_MS);

  // Búsqueda en tiempo real
  dom.searchInput.addEventListener('input', () => {
    const hasQuery = dom.searchInput.value.trim().length > 0;
    dom.clearSearchBtn.classList.toggle('hidden', !hasQuery);
    handleSearch();
  });

  dom.clearSearchBtn.addEventListener('click', resetFilters);
  dom.resetSearchBtn.addEventListener('click', resetFilters);

  // Filtros de categoría
  dom.categoryTags.addEventListener('click', (event) => {
    const button = event.target.closest('.tag-btn');
    if (!button) return;

    state.currentFilter = button.dataset.filter;
    updateTagButtons();
    refresh();
  });

  // Filtros por flags (favoritos, variables, recientes)
  dom.flagsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.flag-btn');
    if (!button) return;

    if (button.dataset.flag === 'favorites') {
      state.onlyFavorites = !state.onlyFavorites;
    } else if (button.dataset.flag === 'variables') {
      state.onlyVariables = !state.onlyVariables;
    } else if (button.dataset.flag === 'recent') {
      state.onlyRecent = !state.onlyRecent;
    } else {
      return;
    }

    updateFlagButtons();
    refresh();
  });

  // Ordenación
  dom.sortOrderSelect.addEventListener('change', refresh);

  // Acciones de las tarjetas (delegación de eventos)
  dom.promptsGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'load-more') return; // Lo gestiona js/ui/prompts.js

    const prompt = getPromptById(button.dataset.id);
    if (!prompt) return;

    if (action === 'play') {
      activatePrompt(prompt);
    } else if (action === 'copy') {
      copyToClipboard(prompt.prompt, button);
    } else if (action === 'favorite') {
      const favorite = toggleFavorite(prompt.id);
      syncFavoriteButtons(prompt.id, favorite);
      showToast(favorite ? 'Añadido a favoritos' : 'Quitado de favoritos');

      if (state.onlyFavorites) {
        refresh();
      } else {
        updateWorkspaceCounts();
      }
    }
  });

  // Workspace: exportar / importar / borrar historial
  dom.exportWorkspaceBtn.addEventListener('click', () => {
    downloadWorkspace();
    showToast('Workspace exportado');
  });

  dom.importWorkspaceBtn.addEventListener('click', () => {
    dom.importFileInput.click();
  });

  dom.importFileInput.addEventListener('change', async () => {
    const file = dom.importFileInput.files?.[0];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      const result = importWorkspace(data);

      showToast(`Importados ${result.favorites} favoritos y ${result.recent} recientes`);
      refresh();
    } catch (error) {
      console.error(error);
      showToast('Archivo de workspace inválido', 'error');
    } finally {
      dom.importFileInput.value = '';
    }
  });

  dom.clearHistoryBtn.addEventListener('click', () => {
    clearHistory();
    updateWorkspaceCounts();
    showToast('Historial borrado');

    if (state.onlyRecent) refresh();
  });

  // Atajos de teclado
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable);

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
    }

    if (event.key === 'Escape' && target === dom.searchInput) {
      resetFilters();
      dom.searchInput.blur();
    }
  });

  // Restaurar share links al navegar con hash
  window.addEventListener('hashchange', () => {
    restoreSharedPrompt();
  });
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

function init() {
  initFavorites();
  initHistory();
  updateWorkspaceCounts();
  updateFlagButtons();

  window.lucide?.createIcons();
  initPlayground();
  initPrompts();
  bindEvents();
  loadPrompts();
  registerServiceWorker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
