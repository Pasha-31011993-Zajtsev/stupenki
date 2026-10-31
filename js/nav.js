// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Навигация между экранами
import { h } from './ui.js';
import { stop } from './voice.js';

export const app = { child: null };
const stack = [];
let leaveHooks = [];
export function onLeave(fn) { leaveHooks.push(fn); }

function render(fn, args) {
  leaveHooks.forEach(f => { try { f(); } catch (e) {} }); leaveHooks = [];
  stop();
  const root = document.getElementById('app');
  root.innerHTML = '';
  const out = fn(...args);
  (Array.isArray(out) ? out : [out]).forEach(n => n && root.append(n));
  window.scrollTo(0, 0);
}
export function go(fn, ...args) { stack.push([fn, args]); render(fn, args); }
export function replace(fn, ...args) { stack.pop(); go(fn, ...args); }
export function back() { if (stack.length > 1) { stack.pop(); const [fn, args] = stack[stack.length - 1]; render(fn, args); } }
export function reset(fn, ...args) { stack.length = 0; go(fn, ...args); }
export function refresh() { const top = stack[stack.length - 1]; if (top) render(top[0], top[1]); }

export function header(title, { right, onBack, noBack } = {}) {
  return h('div.topbar',
    noBack ? null : h('button.round-btn', { 'aria-label': 'Назад', onclick: onBack || back }, '←'),
    h('div.title', title),
    right || null);
}
