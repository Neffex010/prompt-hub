import { CATEGORY_KEYWORDS, DEFAULT_CATEGORY } from './config.js';

/**
 * Escapa caracteres peligrosos antes de inyectar texto en HTML.
 * @param {string} value
 * @returns {string}
 */
export function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (tag) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[tag] ?? tag;
  });
}

/**
 * Detecta la categoría de un prompt a partir de sus palabras clave.
 * @param {string} act Título del prompt.
 * @param {string} prompt Contenido del prompt.
 * @returns {string} Categoría detectada.
 */
export function detectCategory(act = '', prompt = '') {
  const text = `${act} ${prompt}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return DEFAULT_CATEGORY;
}

/**
 * Patrón de placeholders soportados:
 *  - `${variable:descripcion}` (formato actual del catálogo)
 *  - `[variable]`
 *  - `{variable}`
 * @returns {RegExp}
 */
function createPlaceholderRegex() {
  return /\$\{([^}:]+)(?::[^}]*)?\}|\[([^\]]+)\]|\{([^{}]+)\}/g;
}

/**
 * Obtiene el nombre de la variable a partir del grupo que coincidió.
 * @param {string} dollar
 * @param {string} bracket
 * @param {string} brace
 * @returns {string}
 */
function resolveName(dollar, bracket, brace) {
  return dollar ?? bracket ?? brace;
}

/**
 * Extrae los placeholders únicos de un prompt.
 * @param {string} prompt
 * @returns {string[]}
 */
export function extractPlaceholders(prompt = '') {
  const regex = createPlaceholderRegex();
  const placeholders = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    const name = resolveName(match[1], match[2], match[3]);
    if (name && !placeholders.includes(name)) {
      placeholders.push(name);
    }
  }

  return placeholders;
}

/**
 * Indica si un prompt contiene placeholders editables.
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasPlaceholders(prompt = '') {
  return /\$\{[^}:]+(?::[^}]*)?\}|\[[^\]]+\]|\{[^{}]+\}/.test(prompt);
}

/**
 * Sustituye los placeholders por los valores indicados.
 * Si un valor está vacío, conserva el placeholder en formato `[nombre]`.
 * @param {string} prompt
 * @param {Record<string, string>} values
 * @returns {string}
 */
export function replacePlaceholders(prompt = '', values = {}) {
  const regex = createPlaceholderRegex();

  return prompt.replace(regex, (match, dollar, bracket, brace) => {
    const name = resolveName(dollar, bracket, brace);
    const value = values[name];

    return value && value.trim() !== '' ? value : `[${name}]`;
  });
}

/**
 * Retrasa la ejecución de `fn` hasta que dejen de llegar llamadas.
 * @template {(...args: unknown[]) => void} T
 * @param {T} fn
 * @param {number} delay
 * @returns {(...args: Parameters<T>) => void}
 */
export function debounce(fn, delay) {
  let timerId;

  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}
