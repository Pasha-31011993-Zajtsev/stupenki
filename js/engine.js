// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Движок: реестр навыков, уровни, подстройка под ребёнка, выбор заданий.
import { clamp } from './ui.js';
import { save, dayRec } from './store.js';

export const SECTIONS = {
  math:    { title: 'Математика', pre: 'Счёт и сравнение', icon: '🔢', color: '#3FA66B' },
  russian: { title: 'Русский язык', pre: 'Буквы и речь', icon: '🔤', color: '#3D7DD8' },
  logic:   { title: 'Логика и время', pre: 'Логика и время', icon: '🧩', color: '#F08A3C' },
  world:   { title: 'Окружающий мир', pre: 'Мир вокруг', icon: '🌳', color: '#2E9E8F' },
  english: { title: 'Английский', pre: 'Английский', icon: '💂', color: '#C2457F' },
  faith:   { title: 'Закон Божий', pre: 'Закон Божий', icon: '⛪', color: '#B8892E' },
  speech:  { title: 'Логопед', pre: 'Логопед', icon: '👅', color: '#E0567A' },
  walk:    { title: 'Прогулка', pre: 'Прогулка', icon: '🧭', color: '#5B8C2A' },
};
// разделы, на которые родитель может «сделать упор»
export const FOCUSABLE = ['speech', 'math', 'russian', 'logic', 'world', 'english', 'faith', 'walk'];

export const SKILLS = [];
export const SKILL = {};
export function register(list) { list.forEach(s => { SKILLS.push(s); SKILL[s.id] = s; }); }

/** «эффективный класс»: 3 года = -3, 4 = -2, 5 = -1, 6 лет = 0, дальше — класс */
export function effG(child) {
  if (child.grade > 0) return child.grade;
  return clamp(child.age - 6, -3, 0);
}
export const isPre = child => effG(child) <= 0;
export const secTitle = (sec, child) => (isPre(child) ? SECTIONS[sec].pre : SECTIONS[sec].title);

export function available(child, sec) {
  const g = effG(child);
  return SKILLS.filter(s => (!sec || s.sec === sec) && g >= s.g[0] && g <= s.g[1]);
}
export function sectionsFor(child) {
  const set = new Set(available(child).map(s => s.sec));
  return Object.keys(SECTIONS).filter(k => set.has(k) || k === 'walk' || k === 'speech');
}

function startLevel(skill, g) {
  if (skill.start) return clamp(skill.start(g), 1, skill.levels);
  const [a, b] = skill.g; const L = skill.levels;
  if (L <= 1 || b === a) return 1;
  return clamp(1 + Math.round((g - a) * (L - 1) / (b - a)), 1, L);
}

export function st(child, id) {
  let s = child.skills[id];
  if (!s) { s = child.skills[id] = { lvl: startLevel(SKILL[id], effG(child)), hist: [], n: 0, ok: 0, last: 0 }; }
  return s;
}

/** доля ошибок по последним ответам (0 — всё хорошо, 1 — всё плохо) */
export function weakness(child, id) {
  const s = child.skills[id]; if (!s || !s.hist.length) return 0.35;
  const h = s.hist.slice(-10); const acc = (h.reduce((a, b) => a + b, 0) + 0.7 * 2) / (h.length + 2);
  return 1 - acc;
}
export function accuracy(child, id) { const s = child.skills[id]; return s && s.n ? s.ok / s.n : null; }

/** записать ответ и при необходимости сменить уровень. Возвращает 'up' | 'down' | null */
export function record(child, id, ok) {
  const s = st(child, id); const L = SKILL[id].levels;
  s.hist.push(ok ? 1 : 0); if (s.hist.length > 20) s.hist.shift();
  s.n++; if (ok) s.ok++; s.last = Date.now();
  const d = dayRec(child); d.n++; if (ok) d.ok++;
  if (ok) child.stars++;
  let change = null;
  const recent = s.hist.slice(-5);
  if (ok && s.lvl < L && recent.length >= 5 && recent.every(x => x) && (s.since == null || s.since >= 5)) { s.lvl++; s.since = 0; change = 'up'; }
  else if (!ok && s.lvl > 1) { const r4 = s.hist.slice(-4); if (r4.length >= 4 && r4.filter(x => !x).length >= 3 && (s.since == null || s.since >= 4)) { s.lvl--; s.since = 0; change = 'down'; } }
  if (!change) s.since = (s.since || 0) + 1;
  save();
  return change;
}

/** выбрать навык для следующего задания: чаще слабые места и «упор» родителя, реже — давно повторённое */
export function pickSkill(child, sec, exclude) {
  let list = available(child, sec).filter(s => !s.custom || s.inPlan !== false);
  if (exclude && list.length > 1) list = list.filter(s => s.id !== exclude) || list;
  if (!list.length) return null;
  const now = Date.now();
  const w = list.map(s => {
    let x = 1 + 2.5 * weakness(child, s.id);
    if (child.focus.includes(s.sec)) x *= 2.2;
    const stt = child.skills[s.id];
    if (!stt || !stt.n) x += 0.8;                              // ещё не пробовали
    else if (now - stt.last > 3 * 864e5) x += 0.6;             // давно не повторяли
    if (s.weight) x *= s.weight;
    return x;
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}

/** план смешанного занятия: разделы по очереди, без повторов подряд */
export function planMixed(child, n) {
  const out = []; let prev = null; let prevSec = null;
  for (let i = 0; i < n; i++) {
    let s = null;
    for (let t = 0; t < 6; t++) { s = pickSkill(child, null, prev); if (s && s.sec !== prevSec) break; }
    if (!s) break; out.push(s.id); prev = s.id; prevSec = s.sec;
  }
  return out;
}
export function planSection(child, sec, n) {
  const out = []; let prev = null;
  for (let i = 0; i < n; i++) { const s = pickSkill(child, sec, prev); if (!s) break; out.push(s.id); prev = s.id; }
  return out;
}

export function genTask(child, id) {
  const sk = SKILL[id]; const s = st(child, id);
  for (let i = 0; i < 5; i++) {
    try { const t = sk.gen(s.lvl, child); if (t) { t.skill = id; t.level = s.lvl; return t; } } catch (e) { console.error('gen error', id, e); }
  }
  return null;
}

/** слабые места для родителей */
export function weakList(child) {
  return Object.entries(child.skills).filter(([id, s]) => SKILL[id] && s.n >= 4)
    .map(([id, s]) => ({ id, w: weakness(child, id), acc: s.ok / s.n, n: s.n, lvl: s.lvl }))
    .filter(x => x.w > 0.3).sort((a, b) => b.w - a.w);
}
