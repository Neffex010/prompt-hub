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
 * Normaliza texto para búsquedas: minúsculas y sin acentos.
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Comprueba si `needle` aparece como subsecuencia dentro de `haystack`.
 * @param {string} haystack
 * @param {string} needle
 * @returns {boolean}
 */
function isSubsequence(haystack, needle) {
  let index = 0;

  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }

  return false;
}

/**
 * Puntúa la coincidencia entre un texto y una búsqueda.
 * 0 significa que no coincide. Valores mayores = mejor coincidencia.
 * @param {string} text
 * @param {string} query
 * @returns {number}
 */
export function fuzzyScore(text, query) {
  const haystack = normalizeText(text);
  const needle = normalizeText(query).trim();

  if (!needle) return 1;

  const terms = needle.split(/\s+/);
  let score = 0;

  for (const term of terms) {
    const index = haystack.indexOf(term);

    if (index === -1) {
      // La subsecuencia solo tiene sentido para acrónimos/abreviaturas cortas.
      // Con términos largos casi cualquier texto acabaría coincidiendo.
      if (term.length > 4 || !isSubsequence(haystack, term)) return 0;
      score += 5;
      continue;
    }

    score += 100;
    score += Math.max(0, 40 - index * 0.05);

    const previous = haystack[index - 1];
    if (index === 0 || /[\s\-_/(.]/.test(previous)) score += 50;
  }

  return score;
}

/**
 * Hash FNV-1a de 32 bits, determinista entre ejecuciones.
 * @param {string} value
 * @returns {string} Hash en base 36.
 */
export function hashString(value = '') {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}

/**
 * Genera un id estable para un prompt, independiente del orden del catálogo.
 * @param {string} act
 * @param {string} prompt
 * @returns {string}
 */
export function createPromptId(act = '', prompt = '') {
  return `p_${hashString(`${act}\u0000${prompt}`)}`;
}

/**
 * Formatea números con separadores de miles.
 * @param {number} value
 * @returns {string}
 */
export function formatCount(value = 0) {
  return new Intl.NumberFormat('es').format(value);
}

/**
 * Estimación rápida de tokens (fallback cuando el tokenizador no carga).
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text = '') {
  return Math.ceil(text.length / 4);
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
