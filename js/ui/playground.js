import {
  buildChatGptUrl,
  buildClaudeUrl,
  buildShareUrl,
} from '../features/share.js';
import { countPromptTokens } from '../features/tokens.js';
import {
  escapeHTML,
  extractPlaceholders,
  formatCount,
  replacePlaceholders,
} from '../utils.js';
import { copyToClipboard } from './clipboard.js';
import { dom } from './dom.js';

/** Prompt actualmente cargado en el playground. */
let activePrompt = null;

/** Texto editado a mano por el usuario (null = derivado de las variables). */
let manualText = null;

let statsTimer = null;
let statsRequest = 0;

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

  dom.pgOutput.addEventListener('input', () => {
    manualText = dom.pgOutput.value;
    syncDerived();
  });

  dom.pgCopyBtn.addEventListener('click', () => {
    copyToClipboard(dom.pgOutput.value, dom.pgCopyBtn);
  });

  dom.pgShareBtn.addEventListener('click', () => {
    if (!activePrompt) return;

    const url = buildShareUrl(activePrompt.id, getValues(), window.location.href);
    copyToClipboard(url, dom.pgShareBtn);
  });

  dom.pgResetBtn.addEventListener('click', () => {
    if (activePrompt) loadPrompt(activePrompt);
  });
}

/**
 * Carga un prompt en el probador de variables.
 * @param {{id: string, act: string, prompt: string}} prompt
 * @param {Record<string, string>} [initialValues] Valores restaurados desde una URL compartida.
 */
export function loadPrompt(prompt, initialValues = {}) {
  activePrompt = prompt;
  manualText = null;

  dom.playgroundEmpty.classList.add('hidden');
  dom.playgroundActive.classList.remove('hidden');
  dom.pgActiveBadge.classList.remove('hidden');

  dom.pgTitle.textContent = prompt.act;
  dom.pgVarsContainer.innerHTML = '';

  const placeholders = extractPlaceholders(prompt.prompt);

  if (placeholders.length > 0) {
    placeholders.forEach((name) => {
      const value = initialValues[name] ?? '';
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'flex flex-col gap-1';
      fieldWrapper.innerHTML = `
        <label class="text-[11px] font-mono font-bold uppercase text-black">Variable: [${escapeHTML(name)}]</label>
        <input
          type="text"
          data-var="${escapeHTML(name)}"
          value="${escapeHTML(value)}"
          placeholder="Escribe el valor para ${escapeHTML(name)}..."
          class="pg-var-input bg-white border-2 border-black p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brutal-pink shadow-brutal-sm"
        >
      `;
      dom.pgVarsContainer.appendChild(fieldWrapper);
    });
  } else {
    dom.pgVarsContainer.innerHTML = `<p class="text-xs font-mono italic text-black bg-white p-2 border border-black">Este prompt no contiene placeholders estructurados. Puedes editar el resultado directamente abajo.</p>`;
  }

  updateOutput();

  // Scroll suave al playground en pantallas móviles
  if (window.innerWidth < 1024) {
    dom.playgroundActive.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Reúne los valores actuales de las variables.
 * @returns {Record<string, string>}
 */
function getValues() {
  const values = {};

  dom.pgVarsContainer.querySelectorAll('.pg-var-input').forEach((input) => {
    values[input.dataset.var] = input.value;
  });

  return values;
}

/**
 * Regenera el resultado a partir de las variables y sincroniza derivados.
 */
function updateOutput() {
  if (!activePrompt) return;

  manualText = null;
  dom.pgOutput.value = replacePlaceholders(activePrompt.prompt, getValues());
  syncDerived();
}

/**
 * Actualiza enlaces y estadísticas tras un cambio en el resultado.
 */
function syncDerived() {
  updateLinks(dom.pgOutput.value);
  scheduleStats();
}

/**
 * Habilita/deshabilita y actualiza los deep links a ChatGPT y Claude.
 * @param {string} text
 */
function updateLinks(text) {
  const enabled = text.trim().length > 0;
  const links = [dom.pgChatgptLink, dom.pgClaudeLink];

  links.forEach((link) => {
    link.classList.toggle('opacity-50', !enabled);
    link.classList.toggle('pointer-events-none', !enabled);
  });

  dom.pgChatgptLink.href = enabled ? buildChatGptUrl(text) : '#';
  dom.pgClaudeLink.href = enabled ? buildClaudeUrl(text) : '#';
  dom.pgChatgptLink.title = 'Abrir en ChatGPT (puede truncarse si el prompt es muy largo)';
  dom.pgClaudeLink.title = 'Abrir en Claude (puede truncarse si el prompt es muy largo)';
}

/**
 * Programa el recálculo de estadísticas (evita contar en cada tecla).
 */
function scheduleStats() {
  clearTimeout(statsTimer);
  statsTimer = setTimeout(renderStats, 150);
}

/**
 * Pinta chars, palabras, variables y tokens del resultado actual.
 */
async function renderStats() {
  const requestId = ++statsRequest;
  const text = dom.pgOutput.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const vars = activePrompt ? extractPlaceholders(activePrompt.prompt).length : 0;

  dom.pgStats.innerHTML = `
    <span class="bg-white border border-black px-2 py-0.5">${formatCount(chars)} CHARS</span>
    <span class="bg-white border border-black px-2 py-0.5">${formatCount(words)} PALABRAS</span>
    <span class="bg-brutal-yellow border border-black px-2 py-0.5">${vars} VARS</span>
    <span class="bg-black text-white border border-black px-2 py-0.5">TOKENS …</span>
  `;

  const { tokens, exact } = await countPromptTokens(text);
  if (requestId !== statsRequest) return;

  const tokenLabel = `${exact ? '' : '~'}${formatCount(tokens)}`;

  dom.pgStats.innerHTML = `
    <span class="bg-white border border-black px-2 py-0.5">${formatCount(chars)} CHARS</span>
    <span class="bg-white border border-black px-2 py-0.5">${formatCount(words)} PALABRAS</span>
    <span class="bg-brutal-yellow border border-black px-2 py-0.5">${vars} VARS</span>
    <span class="bg-black text-white border border-black px-2 py-0.5" title="${exact ? 'Conteo exacto (gpt-tokenizer)' : 'Estimación: caracteres / 4'}">TOKENS ${tokenLabel}</span>
  `;
}
