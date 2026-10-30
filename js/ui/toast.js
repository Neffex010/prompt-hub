import { TOAST_DURATION_MS } from '../config.js';
import { dom } from './dom.js';

/**
 * Muestra una notificación flotante con feedback visual.
 * @param {string} message
 * @param {'success'|'error'} [type]
 */
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const bgColor =
    type === 'success' ? 'bg-brutal-green' : 'bg-brutal-pink text-white';

  toast.className = `${bgColor} text-black border-brutal p-3 shadow-brutal font-mono text-xs font-black uppercase flex items-center gap-2 transform translate-y-4 transition-all duration-200 pointer-events-auto`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
    <span>${message}</span>
  `;

  dom.toastContainer.appendChild(toast);
  window.lucide?.createIcons();

  // Animación de entrada
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4');
  });

  // Auto-cierre
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 200);
  }, TOAST_DURATION_MS);
}
