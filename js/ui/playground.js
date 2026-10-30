import {
  escapeHTML,
  extractPlaceholders,
  replacePlaceholders,
} from '../utils.js';
import { copyToClipboard } from './clipboard.js';
import { dom } from './dom.js';

/** Prompt actualmente cargado en el playground. */
let activePrompt = null;

/**
 * Registra los listeners fijos del playground.
 * Se llama una sola vez al iniciar la app.
 */
export function initPlayground() {
  dom.pgVarsContainer.addEventListener('input', (event) => {
    if (event.target.classList.contains('pg-var-input')) {
      updateOutput();
    }
  });

  dom.pgCopyBtn.addEventListener('click', () => {
    copyToClipboard(dom.pgOutput.value, dom.pgCopyBtn);
  });

  dom.pgResetBtn.addEventListener('click', () => {
    if (activePrompt) loadPrompt(activePrompt);
  });
}

/**
 * Carga un prompt en el probador de variables.
 * @param {{id: number, act: string, prompt: string}} prompt
 */
export function loadPrompt(prompt) {
  activePrompt = prompt;

  dom.playgroundEmpty.classList.add('hidden');
  dom.playgroundActive.classList.remove('hidden');

  dom.pgTitle.textContent = prompt.act;
  dom.pgVarsContainer.innerHTML = '';

  const placeholders = extractPlaceholders(prompt.prompt);

  if (placeholders.length > 0) {
    placeholders.forEach((name) => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'flex flex-col gap-1';
      fieldWrapper.innerHTML = `
        <label class="text-[11px] font-mono font-bold uppercase text-black">Variable: [${escapeHTML(name)}]</label>
        <input
          type="text"
          data-var="${escapeHTML(name)}"
          placeholder="Escribe el valor para ${escapeHTML(name)}..."
          class="pg-var-input bg-white border-2 border-black p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brutal-pink shadow-brutal-sm"
        >
      `;
      dom.pgVarsContainer.appendChild(fieldWrapper);
    });
  } else {
    dom.pgVarsContainer.innerHTML = `<p class="text-xs font-mono italic text-black bg-white p-2 border border-black">Este prompt no contiene placeholders estructurados, puedes editar el texto directamente en el panel inferior.</p>`;
  }

  updateOutput();

  // Scroll suave al playground en pantallas móviles
  if (window.innerWidth < 1024) {
    dom.playgroundActive.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Reemplaza los placeholders con los valores introducidos por el usuario.
 */
function updateOutput() {
  if (!activePrompt) return;

  const values = {};
  dom.pgVarsContainer.querySelectorAll('.pg-var-input').forEach((input) => {
    values[input.dataset.var] = input.value;
  });

  dom.pgOutput.value = replacePlaceholders(activePrompt.prompt, values);
}
