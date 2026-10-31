// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
import { READING as A } from './reading_s.js';
import { READING as B } from './reading_b.js';
const s = new Set();
export const READING = [...A, ...B].filter(t => { if (s.has(t.title)) return false; s.add(t.title); return true; });
