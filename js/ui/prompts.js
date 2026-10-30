import { escapeHTML, hasPlaceholders } from '../utils.js';
import { dom } from './dom.js';

/**
 * Construye el HTML de una tarjeta de prompt.
 * Las acciones se resuelven por delegación mediante `data-action`.
 * @param {{id: number, act: string, prompt: string}} item
 * @returns {string}
 */
function buildCardTemplate(item) {
  return `
    <div>
      <div class="flex items-start justify-between gap-2 mb-3">
        <h3 class="font-black text-lg uppercase leading-tight tracking-tight border-b-2 border-black pb-1 w-full">
          ${escapeHTML(item.act)}
        </h3>
      </div>

      <div class="bg-brutal-bg border-2 border-black p-3 font-mono text-xs mb-4 max-h-48 overflow-y-auto font-medium text-gray-900 leading-relaxed">
        ${escapeHTML(item.prompt)}
      </div>
    </div>

    <div class="pt-2 border-t-2 border-black flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-1">
        ${hasPlaceholders(item.prompt) ? '<span class="bg-brutal-yellow text-black border border-black text-[10px] font-mono font-black px-1.5 py-0.5">VARIABLES</span>' : ''}
        <span class="text-[10px] font-mono font-bold uppercase text-gray-500">${item.prompt.length} CHARS</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          data-action="play"
          data-id="${item.id}"
          class="btn-brutal bg-brutal-cyan hover:bg-black hover:text-white text-xs px-2.5 py-1 flex items-center gap-1 uppercase"
          title="Probar en el Playground"
        >
          <i data-lucide="play" class="w-3.5 h-3.5"></i> Probar
        </button>

        <button
          data-action="copy"
          data-id="${item.id}"
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
 * Renderiza el grid de prompts y alterna el estado "sin resultados".
 * @param {Array<{id: number, act: string, prompt: string}>} prompts
 */
export function renderPrompts(prompts) {
  if (prompts.length === 0) {
    dom.promptsGrid.classList.add('hidden');
    dom.noResults.classList.remove('hidden');
    return;
  }

  dom.promptsGrid.classList.remove('hidden');
  dom.noResults.classList.add('hidden');
  dom.promptsGrid.innerHTML = '';

  prompts.forEach((item) => {
    const card = document.createElement('div');
    card.className =
      'card-brutal bg-brutal-card p-5 flex flex-col justify-between h-full relative group';
    card.innerHTML = buildCardTemplate(item);
    dom.promptsGrid.appendChild(card);
  });

  window.lucide?.createIcons();
}
