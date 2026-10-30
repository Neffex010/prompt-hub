/**
 * Constantes y configuración de la aplicación.
 */

/** Origen de datos: repositorio open source prompts.chat (catálogo en CSV). */
export const PROMPTS_CSV_URL =
  'https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv';

/** Tiempo de espera antes de ejecutar la búsqueda mientras el usuario escribe. */
export const SEARCH_DEBOUNCE_MS = 200;

/** Duración visible de los toasts. */
export const TOAST_DURATION_MS = 2500;

/** Duración del feedback visual del botón de copiar. */
export const COPY_FEEDBACK_MS = 1500;

/**
 * Palabras clave usadas para categorizar heurísticamente cada prompt.
 * El orden importa: la primera categoría que coincida gana.
 */
export const CATEGORY_KEYWORDS = {
  code: [
    'code',
    'python',
    'javascript',
    'developer',
    'terminal',
    'sql',
  ],
  write: ['write', 'essay', 'novel', 'poet', 'editor'],
  teach: ['teacher', 'tutor', 'explain', 'math'],
};

/** Categoría aplicada cuando ninguna palabra clave coincide. */
export const DEFAULT_CATEGORY = 'general';
