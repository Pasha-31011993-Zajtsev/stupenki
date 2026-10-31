// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
import * as A from './world2_s.js';
import * as B from './world2_b.js';
const u = (arr, k) => { const s = new Set(); return arr.filter(x => { const v = k(x); if (s.has(v)) return false; s.add(v); return true; }); };
export const NATURE2 = u([...A.NATURE2, ...B.NATURE2], x => x[2]);
export const HISTORY = u([...A.HISTORY, ...B.HISTORY], x => x[2]);
export const LITERATURE = u([...A.LITERATURE, ...B.LITERATURE], x => x[2]);
