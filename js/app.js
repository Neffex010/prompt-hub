import { SEARCH_DEBOUNCE_MS } from './config.js';
import { fetchPrompts } from './api.js';
import {
  filterPrompts,
  getPromptById,
  setPrompts,
  state,
} from './store.js';
import { copyToClipboard } from './ui/clipboard.js';
import { dom } from './ui/dom.js';
import { initPlayground, loadPrompt } from './ui/playground.js';
import { renderPrompts } from './ui/prompts.js';
import { debounce } from './utils.js';

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
  });

  renderPrompts(visible);
  dom.statusText.textContent = `MOSTRANDO ${visible.length} DE ${state.prompts.length} PROMPTS`;
}

/**
 * Marca visualmente el filtro de categoría activo.
 */
function updateTagButtons() {
  dom.categoryTags.querySelectorAll('.tag-btn').forEach((btn) => {
    const isActive = btn.dataset.filter === state.currentFilter;

    btn.className = isActive
      ? 'tag-btn bg-black text-white border-2 border-black text-xs font-mono px-2.5 py-1 font-bold shadow-brutal-sm'
      : 'tag-btn bg-white text-black border-2 border-black text-xs font-mono px-2.5 py-1 font-bold shadow-brutal-sm hover:bg-brutal-yellow';
  });
}

/**
 * Limpia la búsqueda y restablece los filtros.
 */
function resetFilters() {
  dom.searchInput.value = '';
  dom.clearSearchBtn.classList.add('hidden');
  state.currentFilter = 'all';
  updateTagButtons();
  refresh();
}

/* --------------------------------------------------------------------------
   Carga de datos
   -------------------------------------------------------------------------- */

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
  } catch (error) {
    console.error(error);

    dom.statusText.textContent = 'ERROR AL CARGAR PROMPTS DESDE LA API';
    dom.noResults.classList.add('hidden');
    dom.promptsGrid.classList.remove('hidden');
    dom.promptsGrid.innerHTML = `
      <div class="col-span-full bg-brutal-pink text-white p-6 border-brutal-thick shadow-brutal">
        <h3 class="font-black text-xl uppercase">Error de Conexión</h3>
        <p class="font-mono text-sm mt-2">No se pudo obtener el archivo prompts.json de GitHub. Verifica tu conexión.</p>
      </div>
    `;
    window.lucide?.createIcons();
  }
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */

function bindEvents() {
  const handleSearch = debounce(() => {
    refresh();
  }, SEARCH_DEBOUNCE_MS);

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

  // Ordenación
  dom.sortOrderSelect.addEventListener('change', refresh);

  // Acciones de las tarjetas (delegación de eventos)
  dom.promptsGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const prompt = getPromptById(Number(button.dataset.id));
    if (!prompt) return;

    if (button.dataset.action === 'play') {
      loadPrompt(prompt);
    } else if (button.dataset.action === 'copy') {
      copyToClipboard(prompt.prompt, button);
    }
  });
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

function init() {
  window.lucide?.createIcons();
  initPlayground();
  bindEvents();
  loadPrompts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
