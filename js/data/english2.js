// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
import * as A from './english2_s.js';
import * as B from './english2_b.js';
const u = (arr, k) => { const s = new Set(); return arr.filter(x => { const v = k(x); if (s.has(v)) return false; s.add(v); return true; }); };
export const W2 = u([...A.W2, ...B.W2], x => x[0]);
export const G2 = u([...A.G2, ...B.G2], x => x[1]);
export const PHRASES = u([...A.PHRASES, ...B.PHRASES], x => x[1]);
