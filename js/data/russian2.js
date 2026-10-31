// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
import * as A from './russian2_s.js';
import * as B from './russian2_b.js';
const u = (arr, k) => { const s = new Set(); return arr.filter(x => { const v = k(x); if (s.has(v)) return false; s.add(v); return true; }); };
const lv = (a, b, n, k) => Array.from({ length: n }, (_, i) => u([...(a[i] || []), ...(b[i] || [])], k));
export const STRESS2 = lv(A.STRESS2, B.STRESS2, 3, x => x.replace('+', ''));
export const VOWELS2 = lv(A.VOWELS2, B.VOWELS2, 4, x => x[0]);
export const COMMAS2 = lv(A.COMMAS2, B.COMMAS2, 3, x => x[0]);
export const DICT = lv(A.DICT, B.DICT, 3, x => x[0]);
