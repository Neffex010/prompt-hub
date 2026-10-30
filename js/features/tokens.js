import { estimateTokens } from '../utils.js';

/**
 * Contador de tokens con carga diferida de `gpt-tokenizer`.
 * El tokenizador pesa varios cientos de KB, así que solo se descarga
 * la primera vez que se necesita. Si falla (offline, CDN caído),
 * se usa una estimación por caracteres.
 */

const TOKENIZER_URL = 'https://cdn.jsdelivr.net/npm/gpt-tokenizer@4.1.0/+esm';

/** @type {Promise<{countTokens?: (text: string) => number}|null>|null} */
let tokenizerPromise = null;
/** @type {{countTokens?: (text: string) => number}|null} */
let tokenizerModule = null;

/**
 * Carga (una sola vez) el tokenizador desde el CDN.
 * @returns {Promise<{countTokens?: (text: string) => number}|null>}
 */
function loadTokenizer() {
  if (tokenizerModule) return Promise.resolve(tokenizerModule);
  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = import(TOKENIZER_URL)
    .then((module) => {
      tokenizerModule = module;
      return module;
    })
    .catch(() => null);

  return tokenizerPromise;
}

/**
 * Cuenta tokens de un texto. Devuelve `exact: false` cuando usa el fallback.
 * @param {string} text
 * @returns {Promise<{tokens: number, exact: boolean}>}
 */
export async function countPromptTokens(text = '') {
  const module = await loadTokenizer();

  if (typeof module?.countTokens === 'function') {
    try {
      return { tokens: module.countTokens(text), exact: true };
    } catch {
      // Cae al fallback si el tokenizador falla con este texto.
    }
  }

  return { tokens: estimateTokens(text), exact: false };
}
