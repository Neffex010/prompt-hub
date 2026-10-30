/**
 * Utilidades de enlaces compartibles y deep links.
 * Todas las funciones son puras (excepto el fallback a `window.location`)
 * para poder probarlas sin DOM.
 */

/**
 * Codifica un objeto de valores como base64url (UTF-8 safe).
 * @param {Record<string, string>} values
 * @returns {string} Cadena vacía si no hay valores útiles.
 */
export function encodeShareValues(values = {}) {
  const clean = {};

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string' && value.trim() !== '') {
      clean[key] = value;
    }
  }

  if (Object.keys(clean).length === 0) return '';

  const bytes = new TextEncoder().encode(JSON.stringify(clean));
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodifica valores base64url. Devuelve `{}` ante cualquier error.
 * @param {string} encoded
 * @returns {Record<string, string>}
 */
export function decodeShareValues(encoded = '') {
  if (!encoded) return {};

  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const values = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

/**
 * Construye la URL compartible de un prompt configurado.
 * Formato: `https://host/path/#p=<id>&v=<base64url>`.
 * @param {string} promptId
 * @param {Record<string, string>} values
 * @param {string} [baseUrl]
 * @returns {string}
 */
export function buildShareUrl(promptId, values = {}, baseUrl = '') {
  const params = new URLSearchParams();
  const encoded = encodeShareValues(values);

  params.set('p', promptId);
  if (encoded) params.set('v', encoded);

  const fallback =
    typeof window !== 'undefined' ? window.location.href : 'https://example.com/';
  const base = (baseUrl || fallback).split('#')[0];

  return `${base}#${params.toString()}`;
}

/**
 * Lee el hash de la URL y extrae el prompt y sus valores.
 * @param {string} [hash]
 * @returns {{promptId: string, values: Record<string, string>}|null}
 */
export function parseShareHash(hash = '') {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const promptId = params.get('p');
  if (!promptId) return null;

  return {
    promptId,
    values: decodeShareValues(params.get('v') ?? ''),
  };
}

/**
 * Deep link a ChatGPT con el texto precargado.
 * @param {string} text
 * @returns {string}
 */
export function buildChatGptUrl(text = '') {
  return `https://chatgpt.com/?q=${encodeURIComponent(text)}`;
}

/**
 * Deep link a Claude con el texto precargado.
 * @param {string} text
 * @returns {string}
 */
export function buildClaudeUrl(text = '') {
  return `https://claude.ai/new?q=${encodeURIComponent(text)}`;
}
