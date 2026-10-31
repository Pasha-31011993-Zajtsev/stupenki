// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Чтение текстов, диктант на слух, геометрия, народные загадки
import { register, bankPick } from '../engine.js';
import { h, pick, shuffle, sample, rnd, numOpts, opts, wait } from '../ui.js';
import { chime } from '../voice.js';
import { READING } from '../data/reading.js';
import { DICT } from '../data/russian2.js';

/* ================= ЧТЕНИЕ ТЕКСТА ================= */
function reading(l, child) {
  const t = bankPick(child, 'r-text', READING.filter(x => x.lvl === l), x => x.title);
  if (!t) return null;
  return {
    key: t.title, q: 'Прочитай текст и ответь на вопросы', say: ['Прочитай текст и ответь на вопросы'], long: true,
    custom(box, api) {
      const textEl = h('div.read-text', h('div.read-title', t.emoji + ' ' + t.title), ...t.text.split(/\n\n/).map(p => h('p', p)));
      const listen = h('button.btn.ghost.sm', { onclick: () => api.say(t.title + '. ' + t.text) }, '🔊 Прочитать вслух');
      const qBox = h('div.read-q');
      let i = 0, mistakes = 0;
      const startBtn = h('button.btn.big', { onclick: () => { startBtn.remove(); showQ(); } }, 'Я прочитал' + (child && child.gender === 'f' ? 'а' : '') + ' — к вопросам');
      const showQ = () => {
        qBox.innerHTML = '';
        if (i >= t.qs.length) {
          const ok = mistakes <= (t.qs.length >= 4 ? 1 : 0);
          api.result(ok, `Ошибок: ${mistakes} из ${t.qs.length}. Перечитай текст внимательно — все ответы в нём.`);
          return;
        }
        const [q, a, w] = t.qs[i];
        const grid = h('div.options', { style: { gridTemplateColumns: '1fr' } });
        let locked = false;
        shuffle([a, ...w]).forEach(v => {
          const b = h('button.opt.textopt', { onclick: async () => {
            if (locked) return; locked = true;
            if (v === a) { b.classList.add('ok'); chime('good'); }
            else { b.classList.add('bad'); chime('bad'); mistakes++; [...grid.children].forEach(x => { if (x.textContent === a) x.classList.add('ok'); }); await wait(900); }
            await wait(700); i++; showQ();
          } }, v);
          grid.append(b);
        });
        qBox.append(h('div.read-qn', `Вопрос ${i + 1} из ${t.qs.length}`), h('div.prompt.small-prompt', q), grid);
        api.say(q);
        qBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      box.append(textEl, h('div.row.center', listen), startBtn, qBox);
    },
  };
}

/* ================= ДИКТАНТ ================= */
const nrm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const EXTRA = 'аоуиыеэсзнтрлкгмпбвдшжчщ';
function dictation(l, child) {
  const it = bankPick(child, 'r-dict', DICT[l - 1] || [], x => x[0]);
  if (!it) return null;
  const [word, emoji, hint] = it;
  const tiles = l === 1 && word.length <= 9 && !word.includes(' ');
  return {
    key: word, q: 'Послушай и напиши слово', say: ['Послушай и напиши слово', word], stage: tiles && emoji ? `<div class="pic">${emoji}</div>` : null,
    custom(box, api) {
      let tries = 0; let resetTiles = null;
      const again = h('div.row.center.wrap', h('button.btn.ghost.sm', { onclick: () => api.say(word) }, '🔊 Ещё раз'), h('button.btn.ghost.sm', { onclick: () => api.say(word, { slow: true }) }, '🐢 Медленно'));
      const hintEl = h('div.dict-hint');
      const check = val => {
        if (!val.trim()) return;
        if (nrm(val) === nrm(word)) { api.done(true); return; }
        tries++; chime('bad');
        if (tries === 1 && hint) hintEl.textContent = '💡 Подсказка: ' + hint;
        if (tries === 1 && resetTiles) setTimeout(resetTiles, 700);
        api.miss(`Правильно: «${word}»` + (hint ? `. ${hint}` : ''), () => { out.classList.add('right'); if (inp) { inp.value = word; inp.disabled = true; } if (tilesBox) { slots = [...word]; draw(); } });
      };
      let out = null, inp = null, tilesBox = null, slots = [];
      let draw = () => {};
      if (tiles) {
        out = h('div.dict-slots'); tilesBox = h('div.dict-tiles');
        const extra = sample(EXTRA.split('').filter(c => !word.includes(c)), 2);
        const letters = shuffle([...word, ...extra]); const used = new Array(letters.length).fill(false);
        draw = () => {
          out.innerHTML = ''; for (let k = 0; k < word.length; k++) out.append(h('span.slot' + (slots[k] ? '.full' : ''), slots[k] || ''));
          tilesBox.innerHTML = '';
          letters.forEach((c, k) => tilesBox.append(h('button.tile' + (used[k] ? '.used' : ''), { disabled: used[k], onclick: () => { if (slots.length >= word.length) return; slots.push(c); used[k] = true; chime('tap'); draw(); if (slots.length === word.length) setTimeout(() => check(slots.join('')), 250); } }, c)));
        };
        const back = h('button.btn.ghost.sm', { onclick: () => { if (!slots.length) return; const c = slots.pop(); const k = letters.findIndex((x, j) => x === c && used[j]); if (k >= 0) used[k] = false; draw(); } }, '⌫ Стереть');
        resetTiles = () => { slots = []; used.fill(false); draw(); };
        const clear = h('button.btn.ghost.sm', { onclick: resetTiles }, 'Сначала');
        draw();
        box.append(again, out, tilesBox, h('div.row.center.wrap', back, clear), hintEl);
      } else {
        out = h('div');
        inp = h('input.text-input.dict-input', { type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', lang: 'ru', placeholder: 'Напиши здесь', onkeydown: e => { if (e.key === 'Enter') check(inp.value); } });
        const btn = h('button.btn.big', { onclick: () => check(inp.value) }, 'Проверить');
        box.append(again, inp, h('div.center', btn), hintEl);
        setTimeout(() => inp.focus({ preventScroll: true }), 400);
      }
    },
  };
}

/* ================= ГЕОМЕТРИЯ ================= */
function rectSVG(a, b, unit = 'см', grid = false) {
  const k = Math.min(200 / a, 120 / b, 26); const W = a * k, H = b * k, x0 = 30, y0 = 20;
  let g = '';
  if (grid) for (let i = 0; i <= a; i++) g += `<line x1="${x0 + i * k}" y1="${y0}" x2="${x0 + i * k}" y2="${y0 + H}" stroke="#fff" stroke-width="2"/>`;
  if (grid) for (let j = 0; j <= b; j++) g += `<line x1="${x0}" y1="${y0 + j * k}" x2="${x0 + W}" y2="${y0 + j * k}" stroke="#fff" stroke-width="2"/>`;
  return `<svg viewBox="0 0 ${W + 70} ${H + 60}" width="${Math.min(320, W + 70)}" class="geo"><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="color-mix(in srgb,var(--accent) 30%,#fff)" stroke="var(--accent2)" stroke-width="3"/>${g}
  ${grid ? '' : `<text x="${x0 + W / 2}" y="${y0 + H + 24}" text-anchor="middle" font-size="16" font-weight="800">${a} ${unit}</text><text x="${x0 + W + 8}" y="${y0 + H / 2 + 5}" font-size="16" font-weight="800">${b} ${unit}</text>`}</svg>`;
}
function angleSVG(deg) {
  const r = 90, cx = 40, cy = 120, a = deg * Math.PI / 180;
  const x2 = cx + r * Math.cos(a), y2 = cy - r * Math.sin(a);
  const arc = deg === 90 ? `<rect x="${cx}" y="${cy - 18}" width="18" height="18" fill="none" stroke="#E0567A" stroke-width="3"/>` : `<path d="M${cx + 26} ${cy} A26 26 0 0 0 ${cx + 26 * Math.cos(a)} ${cy - 26 * Math.sin(a)}" fill="none" stroke="#E0567A" stroke-width="3"/>`;
  return `<svg viewBox="-60 10 260 130" width="260" class="geo"><line x1="${cx}" y1="${cy}" x2="${cx + r + 20}" y2="${cy}" stroke="#2B2D42" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#2B2D42" stroke-width="4" stroke-linecap="round"/>${arc}<circle cx="${cx}" cy="${cy}" r="4" fill="#2B2D42"/></svg>`;
}
const ch = arr => arr.map(v => ({ v, label: String(v) }));
function geometry(l) {
  if (l === 1) {
    const sq = Math.random() < 0.3; const a = rnd(2, 9), b = sq ? a : rnd(2, 8);
    if (a === b && !sq) return geometry(l);
    const P = 2 * (a + b);
    return { q: sq ? 'Найди периметр квадрата' : 'Найди периметр прямоугольника', stage: rectSVG(a, b), choices: ch(opts(P, [a * b, a + b, P + 2, P - 2, P + 4].filter(x => x > 0 && x !== P))), answer: P, big: true, explain: `Периметр — сумма длин всех сторон: ${a} + ${b} + ${a} + ${b} = ${P} см` };
  }
  if (l === 2) {
    const a = rnd(2, 8), b = rnd(2, 6);
    if (Math.random() < 0.4) return { q: 'Сколько клеточек занимает прямоугольник? Это его площадь в квадратных сантиметрах', stage: rectSVG(a, b, 'см', true), choices: ch(opts(a * b, [2 * (a + b), a * b + a, a * b - b, a + b].filter(x => x > 0 && x !== a * b))), answer: a * b, big: true, explain: `${b} ${b < 5 ? 'ряда' : 'рядов'} по ${a} клеточек: ${a} × ${b} = ${a * b} см²` };
    return { q: 'Найди площадь прямоугольника', stage: rectSVG(a, b), choices: opts(a * b, [2 * (a + b), a + b, a * b + 2, a * b - 2].filter(x => x > 0 && x !== a * b)).map(v => ({ v, label: v + ' см²' })), answer: a * b, explain: `Площадь = длина × ширина: ${a} × ${b} = ${a * b} см²`, mid: true };
  }
  if (l === 3) {
    if (Math.random() < 0.5) {
      const kind = pick([['острый', rnd(25, 75)], ['прямой', 90], ['тупой', rnd(110, 160)], ['развёрнутый', 180]]);
      return { q: 'Какой это угол?', stage: angleSVG(kind[1]), choices: ['острый', 'прямой', 'тупой', 'развёрнутый'].map(v => ({ v, label: v })), answer: kind[0], cols: 2, explain: { 'острый': 'Острый угол меньше прямого (меньше 90°)', 'прямой': 'Прямой угол — 90°, как угол тетради', 'тупой': 'Тупой угол больше прямого, но меньше развёрнутого (между 90° и 180°)', 'развёрнутый': 'Развёрнутый угол — 180°, его стороны лежат на одной прямой' }[kind[0]] };
    }
    const c = pick([['дм', 'см', 10], ['м', 'см', 100], ['см', 'мм', 10], ['км', 'м', 1000], ['м', 'дм', 10], ['т', 'кг', 1000], ['кг', 'г', 1000], ['ч', 'мин', 60]]);
    const n = rnd(2, 9); const r = n * c[2];
    return { q: 'Переведи единицы измерения', stage: `<div class="bigtext">${n} ${c[0]} = ? ${c[1]}</div>`, choices: ch(opts(r, [n * 10, n * 100, n * 1000, n * 60, r + c[2]].filter(x => x !== r))), answer: r, big: true, explain: `1 ${c[0]} = ${c[2]} ${c[1]}, значит ${n} ${c[0]} = ${r} ${c[1]}` };
  }
  const t = rnd(0, 2);
  if (t === 0) { const a = rnd(30, 80), b = rnd(30, 150 - a); const r = 180 - a - b; return { q: 'В треугольнике два угла известны. Найди третий угол', stage: `<div class="bigtext">${a}° + ${b}° + ? = 180°</div>`, choices: opts(r, [r + 10, r - 10, 180 - a, 90].filter(x => x > 0 && x !== r)).map(v => ({ v, label: v + '°' })), answer: r, mid: true, explain: `Сумма углов треугольника — 180°: 180 − ${a} − ${b} = ${r}°` }; }
  if (t === 1) { const a = rnd(2, 10) * 2, b = rnd(2, 9); const r = a * b / 2; return { q: `Прямоугольный треугольник: катеты ${a} см и ${b} см. Найди его площадь`, stage: `<svg viewBox="0 0 220 150" width="220" class="geo"><polygon points="20,130 200,130 20,20" fill="color-mix(in srgb,var(--accent) 30%,#fff)" stroke="var(--accent2)" stroke-width="3"/><rect x="20" y="114" width="16" height="16" fill="none" stroke="#E0567A" stroke-width="2"/><text x="110" y="148" text-anchor="middle" font-size="15" font-weight="800">${a} см</text><text x="2" y="80" font-size="15" font-weight="800" transform="rotate(-90 12 80)">${b} см</text></svg>`, choices: opts(r, [a * b, r + a, a + b, r * 2 + 1].filter(x => x !== r)).map(v => ({ v, label: v + ' см²' })), answer: r, mid: true, explain: `Это половина прямоугольника ${a} × ${b}: ${a} × ${b} : 2 = ${r} см²` }; }
  const r = rnd(1, 10); const C = Math.round(2 * 3.14 * r * 100) / 100; const f = x => String(x).replace('.', ',');
  return { q: `Найди длину окружности радиусом ${r} см (π ≈ 3,14)`, stage: `<div class="bigtext">C = 2 · π · r</div>`, choices: opts(C, [Math.round(3.14 * r * 100) / 100, Math.round(3.14 * r * r * 100) / 100, Math.round((C + 3.14) * 100) / 100].filter(x => x !== C)).map(v => ({ v, label: f(v) + ' см' })), answer: C, mid: true, explain: `C = 2 · 3,14 · ${r} = ${f(C)} см` };
}

/* ================= НАРОДНЫЕ ЗАГАДКИ ================= */
const RIDDLES = [
  ['Зимой и летом одним цветом', '🎄', 'ёлка'], ['Сидит девица в темнице, а коса на улице', '🥕', 'морковка'], ['Висит груша — нельзя скушать', '💡', 'лампочка'],
  ['Без окон, без дверей полна горница людей', '🥒', 'огурец'], ['Сто одёжек, и все без застёжек', '🥬', 'капуста'], ['Не лает, не кусает, а в дом не пускает', '🔒', 'замок'],
  ['Два кольца, два конца, посередине гвоздик', '✂️', 'ножницы'], ['Летом серый, зимой белый', '🐰', 'заяц'], ['Хвост пушистый, мех золотистый, в лесу живёт, в деревне кур крадёт', '🦊', 'лиса'],
  ['Сам алый, сахарный, кафтан зелёный, бархатный', '🍉', 'арбуз'], ['Сидит дед, во сто шуб одет; кто его раздевает, тот слёзы проливает', '🧅', 'лук'], ['Течёт, течёт — не вытечет, бежит, бежит — не выбежит', '🏞️', 'река'],
  ['Без рук, без ног, а ворота открывает', '🌬️', 'ветер'], ['Не огонь, а жжётся', '🌿', 'крапива'], ['Шёл долговяз — в землю увяз', '🌧️', 'дождь'],
  ['Мягкие лапки, а в лапках царапки', '🐱', 'кошка'], ['С хозяином дружит, дом сторожит, живёт под крылечком, хвост колечком', '🐶', 'собака'], ['Растёт она вниз головою, не летом растёт, а зимою', '🧊', 'сосулька'],
  ['Весной веселит, летом холодит, осенью питает, зимой согревает', '🌳', 'дерево'], ['Голубой платок, алый колобок по платку катается, людям улыбается', '☀️', 'солнце'], ['Два брата через дорогу живут, а друг друга не видят', '👀', 'глаза'],
  ['Всю ночь летает — мышей добывает, а станет светло — спать летит в дупло', '🦉', 'сова'], ['Сама не ем, а людей кормлю', '🥄', 'ложка'], ['Кто утром рано встаёт, громко песни поёт, детям спать не даёт?', '🐓', 'петух'],
  ['Маленький, удаленький, сквозь землю прошёл, красну шапочку нашёл', '🍄', 'гриб'], ['Зимой спит, летом ульи ворошит', '🐻', 'медведь'],
];
function riddles(l, child) {
  const r = bankPick(child, 'l-riddles', RIDDLES, x => x[0]);
  const others = sample(RIDDLES.filter(x => x[2] !== r[2]), 3);
  return { key: r[0], q: 'Отгадай загадку: ' + r[0], say: ['Отгадай загадку', r[0]], choices: shuffle([r, ...others]).map(x => ({ v: x[2], label: x[1] })), answer: r[2], explain: `Это ${r[2]}!`, sayAfter: r[2], long: true };
}

register([
  { id: 'r-text', sec: 'russian', title: 'Читаем текст', icon: '📖', g: [1, 6], levels: 3, gen: reading, start: g => (g <= 1 ? 1 : g <= 3 ? 2 : 3), weight: 1.3, prompts: ['Прочитай текст и ответь на вопросы'] },
  { id: 'r-dict', sec: 'russian', title: 'Диктант на слух', icon: '✍️', g: [1, 6], levels: 3, gen: dictation, start: g => (g <= 1 ? 1 : g <= 3 ? 2 : 3), weight: 1.3, prompts: ['Послушай и напиши слово'] },
  { id: 'm-geom', sec: 'math', title: 'Геометрия', icon: '📐', g: [2, 6], levels: 4, gen: geometry, start: g => (g <= 2 ? 1 : g === 3 ? 2 : g === 4 ? 3 : 4) },
  { id: 'l-riddles', sec: 'logic', title: 'Загадки', icon: '❓', g: [-3, 1], levels: 1, gen: riddles, prompts: ['Отгадай загадку'] },
]);
void numOpts;
