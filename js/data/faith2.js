// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
import { FAITH2 as A } from './faith2_s.js';
import { FAITH2 as B } from './faith2_b.js';
const u = (arr, k) => { const s = new Set(); return arr.filter(x => { const v = k(x); if (s.has(v)) return false; s.add(v); return true; }); };
export const FAITH2 = u([...A, ...B], x => x[2]);
