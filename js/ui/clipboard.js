import { COPY_FEEDBACK_MS } from '../config.js';
import { showToast } from './toast.js';

/**
 * Copia texto al portapapeles, intentando la API moderna y
 * cayendo al método clásico cuando no está disponible.
 * @param {string} text
 * @returns {Promise<boolean>} `true` si la copia fue exitosa.
 */
async function writeToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continúa con el fallback.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    return copied;
  } catch {
    return false;
  }
}

/**
 * Copia texto y muestra feedback (toast + estado del botón).
 * @param {string} text
 * @param {HTMLElement|null} [btnElement]
 */
export async function copyToClipboard(text, btnElement = null) {
  const copied = await writeToClipboard(text);

  if (!copied) {
    showToast('Error al copiar el texto', 'error');
    return;
  }

  showToast('¡COPIADO AL PORTAPAPELES!', 'success');

  if (!btnElement) return;

  const originalHTML = btnElement.innerHTML;
  btnElement.innerHTML =
    '<i data-lucide="check" class="w-3.5 h-3.5"></i> ¡LISTO!';
  btnElement.classList.add('bg-brutal-green');

  setTimeout(() => {
    btnElement.innerHTML = originalHTML;
    btnElement.classList.remove('bg-brutal-green');
    window.lucide?.createIcons();
  }, COPY_FEEDBACK_MS);
}
