/**
 * Pure utility functions extracted from renderer.js.
 * @module utils
 */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} s
 * @returns {string}
 */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Truncate a string to n characters and append an ellipsis if needed.
 * @param {string} s
 * @param {number} n
 * @returns {string}
 */
export function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '\u2026' : s;
}

/**
 * Generate a deterministic color from a string id.
 * @param {string} id
 * @returns {string}
 */
export function catColor(id) {
  const CAT_COLORS = ['#5c5ce0', '#2dd4bf', '#f59e0b', '#f43f5e', '#38bdf8', '#a855f7', '#4ade80', '#fb7185'];
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CAT_COLORS[h % CAT_COLORS.length];
}

/**
 * Clamp an integer value between min and max.
 * @param {string|number} v
 * @param {number} min
 * @param {number} max
 * @param {number} dflt
 * @returns {number}
 */
export function clampInt(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

/**
 * Generate a random GUID-like string.
 * @returns {string}
 */
export function randomGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Backwards-compatible global aliases so existing inline handlers keep working.
window.utils = { esc, truncate, catColor, clampInt, randomGuid, debounce };
