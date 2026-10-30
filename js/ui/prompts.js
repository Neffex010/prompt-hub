import { isFavorite } from '../features/favorites.js';
import { escapeHTML, hasPlaceholders } from '../utils.js';
import { dom } from './dom.js';

/**
 * Render incremental del feed: pinta un lote y amplía el siguiente
 * cuando el usuario llega al final (IntersectionObserver o botón).
 * Evita crear 2.700 tarjetas de golpe.
 */

const BATCH_SIZE = 60;

/** Etiquetas visibles para las categorías inferidas. */
const CATEGORY_LABELS = {
  all: 'TODOS',
  code: 'DEV',
  write: 'ESCRITURA',
  teach: 'TUTOR',
  general: 'GENERAL',
};

/** @type {Array<{id: string, act: string, prompt: string, category: string}>} */
let visible = [];
let rendered = 0;

/** @type {IntersectionObserver|null} */
let observer = null;

/**
 * Construye el HTML interno de una tarjeta.
 * @param {{id: string, act: string, prompt: string, category: string}} item
 * @returns {string}
 */
function buildCardTemplate(item) {
  const favorite = isFavorite(item.id);
  const category = CATEGORY_LABELS[item.category] ?? item.category.toUpperCase();

  return `
    <div>
      <div class="flex items-start justify-between gap-2 mb-2">
        <h3 class="font-black text-lg uppercase leading-tight tracking-tight border-b-2 border-black pb-1 w-full">
          ${escapeHTML(item.act)}
        </h3>
        <button
          type="button"
          data-action="favorite"
          data-id="${escapeHTML(item.id)}"
          aria-pressed="${favorite}"
          aria-label="${favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
          class="favorite-btn ${favorite ? 'is-favorite' : ''} shrink-0 border-2 border-black bg-white p-1.5 shadow-brutal-sm transition-colors hover:bg-brutal-pink hover:text-white"
          title="${favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
        >
          <i data-lucide="heart" class="w-4 h-4"></i>
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-1 mb-2">
        <span class="bg-black text-white border border-black text-[10px] font-mono font-black px-1.5 py-0.5">${escapeHTML(category)}</span>
        ${hasPlaceholders(item.prompt) ? '<span class="bg-brutal-yellow text-black border border-black text-[10px] font-mono font-black px-1.5 py-0.5">VARIABLES</span>' : ''}
      </div>

      <div class="bg-brutal-bg border-2 border-black p-3 font-mono text-xs mb-4 max-h-48 overflow-y-auto font-medium text-gray-900 leading-relaxed">
        ${escapeHTML(item.prompt)}
      </div>
    </div>

    <div class="pt-2 border-t-2 border-black flex flex-wrap items-center justify-between gap-2">
      <span class="text-[10px] font-mono font-bold uppercase text-gray-500">${item.prompt.length} CHARS</span>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-action="play"
          data-id="${escapeHTML(item.id)}"
          class="btn-brutal bg-brutal-cyan hover:bg-black hover:text-white text-xs px-2.5 py-1 flex items-center gap-1 uppercase"
          title="Probar en el Playground"
        >
          <i data-lucide="play" class="w-3.5 h-3.5"></i> Probar
        </button>

        <button
          type="button"
          data-action="copy"
          data-id="${escapeHTML(item.id)}"
          class="btn-brutal bg-brutal-yellow hover:bg-black hover:text-white text-xs px-2.5 py-1 flex items-center gap-1 uppercase"
          title="Copiar prompt directo"
        >
          <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar
        </button>
      </div>
    </div>
  `;
}

/**
 * Crea la tarjeta `<article>` de un prompt.
 * @param {{id: string, act: string, prompt: string, category: string}} item
 * @returns {HTMLElement}
 */
function createCard(item) {
  const card = document.createElement('article');
  card.className =
    'card-brutal bg-brutal-card p-5 flex flex-col justify-between h-full relative group';
  card.dataset.promptId = item.id;
  card.innerHTML = buildCardTemplate(item);

  return card;
}

/**
 * Añade el botón/sentinel de "cargar más" si quedan resultados.
 */
function ensureSentinel() {
  dom.promptsGrid.querySelector('[data-role="sentinel"]')?.remove();

  if (rendered >= visible.length) {
    observer?.disconnect();
    return;
  }

  const sentinel = document.createElement('div');
  sentinel.dataset.role = 'sentinel';
  sentinel.className = 'col-span-full flex flex-col items-center gap-2 py-4';
  sentinel.innerHTML = `
    <button
      type="button"
      data-action="load-more"
      class="btn-brutal bg-white px-4 py-2 text-xs uppercase font-mono font-black"
    >
      Cargar más (${visible.length - rendered} restantes)
    </button>
  `;
  dom.promptsGrid.appendChild(sentinel);

  observer ??= new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) appendBatch();
    },
    { rootMargin: '600px 0px' },
  );

  observer.disconnect();
  observer.observe(sentinel);
}

/**
 * Pinta el siguiente lote de prompts.
 */
function appendBatch() {
  const next = visible.slice(rendered, rendered + BATCH_SIZE);
  if (next.length === 0) return;

  const fragment = document.createDocumentFragment();
  next.forEach((item) => fragment.appendChild(createCard(item)));

  dom.promptsGrid.appendChild(fragment);
  rendered += next.length;

  ensureSentinel();
  window.lucide?.createIcons();
}

/**
 * Registra los listeners propios del feed (cargar más).
 * Se llama una sola vez al iniciar la app.
 */
export function initPrompts() {
  dom.promptsGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="load-more"]');
    if (!button) return;

    appendBatch();
  });
}

/**
 * Renderiza el grid desde cero con el primer lote y alterna "sin resultados".
 * @param {Array<{id: string, act: string, prompt: string, category: string}>} prompts
 */
export function renderPrompts(prompts) {
  visible = prompts;
  rendered = 0;
  dom.promptsGrid.innerHTML = '';

  if (prompts.length === 0) {
    observer?.disconnect();
    dom.promptsGrid.classList.add('hidden');
    dom.noResults.classList.remove('hidden');
    return;
  }

  dom.promptsGrid.classList.remove('hidden');
  dom.noResults.classList.add('hidden');

  appendBatch();
}
