// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Математика: от счёта до 3 лет до дробей и задач 6 класса
import { register } from '../engine.js';
import { rnd, pick, shuffle, opts, numOpts, plural, h } from '../ui.js';
import { OBJ, objWord, emojiGrid, plateSVG, big, pic, anyName, pieSVG, frac, BOYS, GIRLS } from './common.js';
import { say, chime } from '../voice.js';

const ch = arr => arr.map(v => ({ v, label: String(v) }));

/* ---------- Счёт ---------- */
function count(l) {
  const max = [3, 5, 10, 20][l - 1]; const o = pick(OBJ); const n = rnd(1, max);
  if (l >= 2 && Math.random() < 0.3) {
    const t = rnd(1, Math.min(max, 20));
    return { q: `Найди число ${t}`, say: ['Найди число', String(t)], choices: ch(numOpts(t, l === 1 ? 3 : 4, 3, 1, Math.max(max, 5))), answer: t, big: true, explain: `Это число ${t}` };
  }
  return {
    q: `Сколько здесь ${o[3]}?`, say: ['Сколько здесь', o[3]], stage: emojiGrid(o[0], n, n > 10 ? 34 : 44),
    choices: ch(numOpts(n, l === 1 ? 3 : 4, 2, 1, max + 2)), answer: n, big: true,
    explain: `Здесь ${n} ${objWord(o, n)}`,
  };
}

/* ---------- Сравнение: больше/меньше, выше/ниже, длиннее ---------- */
function compare(l) {
  const kind = l >= 4 && Math.random() < 0.5 ? 'num' : pick(['plates', 'plates', 'size']);
  if (kind === 'num') {
    const a = rnd(1, 20), b = Math.random() < 0.2 ? a : rnd(1, 20);
    const ans = a > b ? '>' : a < b ? '<' : '=';
    return { q: `Какой знак поставить: ${a} … ${b}?`, say: ['Какой знак поставить между числами', String(a), 'и', String(b)], stage: big(`${a} <span class="gap">?</span> ${b}`), choices: [{ v: '>', label: '>' }, { v: '<', label: '<' }, { v: '=', label: '=' }], answer: ans, big: true, cols: 3, explain: a === b ? 'Числа равны — ставим знак «равно»' : `${Math.max(a, b)} больше, чем ${Math.min(a, b)}. Клювик знака смотрит на меньшее число` };
  }
  if (kind === 'size') {
    const items = [
      ['🌲', 'Какое дерево выше?', 'Какое дерево ниже?', 'Выше то дерево, которое дальше тянется к небу', 'Ниже то дерево, которое меньше ростом'],
      ['🏠', 'Какой дом больше?', 'Какой дом меньше?', 'Больше тот дом, который крупнее', 'Меньше тот дом, который мельче'],
      ['🦒', 'Какой жираф выше?', 'Какой жираф ниже?', 'Выше тот жираф, у которого голова дальше от земли', 'Ниже тот жираф, который меньше ростом'],
      ['🎈', 'Какой шарик больше?', 'Какой шарик меньше?', 'Больше тот шарик, который сильнее надут', 'Меньше тот шарик, который мельче'],
    ];
    const it = pick(items); const more = Math.random() < 0.5;
    if (Math.random() < 0.35) {
      // ленты
      const a = rnd(2, 9), b = a + pick([-3, -2, 2, 3]); if (b < 1) return compare(l);
      const longer = Math.random() < 0.5;
      const bar = (n, c) => `<div class="ribbon" style="width:${n * 26}px;background:${c}"></div>`;
      return { q: longer ? 'Какая лента длиннее?' : 'Какая лента короче?', stage: '', choices: [{ v: 'a', label: bar(a, '#E0567A') }, { v: 'b', label: bar(b, '#3D7DD8') }], cols: 1, answer: (longer ? a > b : a < b) ? 'a' : 'b', explain: longer ? 'Длиннее та лента, которая дальше тянется' : 'Короче та лента, которая быстрее заканчивается' };
    }
    const s1 = rnd(40, 60), s2 = s1 + pick([30, 40, 50]);
    const order = shuffle([['a', s1], ['b', s2]]);
    const ans = more ? 'b' : 'a';
    return { q: more ? it[1] : it[2], choices: order.map(([v, s]) => ({ v, label: `<span style="font-size:${s}px;line-height:1">${it[0]}</span>` })), answer: ans, tall: true, explain: more ? it[3] : it[4] };
  }
  const o = pick(OBJ.slice(0, 12)); const max = [5, 7, 10, 10][l - 1];
  let a = rnd(1, max), b = rnd(1, max);
  const allowEq = l >= 3;
  if (!allowEq) while (Math.abs(a - b) < (l === 1 ? 2 : 1)) { a = rnd(1, max); b = rnd(1, max); }
  if (allowEq && Math.random() < 0.2) b = a;
  const more = Math.random() < 0.6;
  const c = [{ v: 'a', label: plateSVG('#3D7DD8', a, o[0], 140) }, { v: 'b', label: plateSVG('#E0567A', b, o[0], 140) }];
  if (allowEq) c.push({ v: 'eq', label: '<b style="font-size:24px">Поровну</b>' });
  const ans = a === b ? 'eq' : (more ? (a > b ? 'a' : 'b') : (a < b ? 'a' : 'b'));
  return { q: `На какой тарелке ${more ? 'больше' : 'меньше'} ${o[3]}?`, say: ['На какой тарелке', more ? 'больше' : 'меньше', o[3]], choices: c, cols: allowEq ? 3 : 2, answer: ans, explain: a === b ? `Поровну: и там, и там по ${a}` : `На синей ${a}, на красной ${b}. ${Math.max(a, b)} больше, чем ${Math.min(a, b)}` };
}

/* ---------- Разложи яблоки по тарелкам (интерактив) ---------- */
function plates(l) {
  const max = l === 1 ? 3 : 5;
  let a = rnd(1, max), b = rnd(1, max); while (a === b) b = rnd(1, max);
  const o = pick([OBJ[0], OBJ[1], OBJ[2], OBJ[13]]);
  const ACC1 = { 'яблоко': 'яблоко', 'груша': 'грушу', 'клубничка': 'клубничку', 'вишенка': 'вишенку' };
  const acc = n => (n === 1 ? ACC1[o[1]] : objWord(o, n));
  return {
    q: `Положи на синюю тарелку ${a} ${acc(a)}, а на красную — ${b}`,
    say: ['Положи на синюю тарелку', String(a), acc(a), 'а на красную', String(b)],
    custom(box, api) {
      let pa = 0, pb = 0, phase = 1; const total = a + b + 2;
      const basket = h('div.basket'); const pl = h('div.plates');
      const draw = () => {
        basket.innerHTML = ''; const left = total - pa - pb;
        basket.append(h('div.basket-label', 'Корзинка: нажми на тарелку, чтобы положить'));
        const row = h('div.egrid', { style: { fontSize: '34px' } }); for (let i = 0; i < left; i++) row.append(h('span', o[0])); basket.append(row);
        pl.innerHTML = '';
        [['a', '#3D7DD8', pa], ['b', '#E0567A', pb]].forEach(([k, c, n]) => {
          const p = h('button.plate-btn', { html: plateSVG(c, n, o[0], 150), onclick: () => {
            if (phase === 1) { if (pa + pb >= total) return; k === 'a' ? pa++ : pb++; chime('tap'); draw(); }
            else { const ok = (a > b ? 'a' : 'b') === k; api.done(ok, ok ? '' : `На синей ${a}, на красной ${b}. Больше там, где ${Math.max(a, b)}`); }
          } });
          p.append(h('div.plate-n', String(n)));
          if (phase === 1 && n > 0) p.append(h('span.plate-minus', { onclick: e => { e.stopPropagation(); k === 'a' ? pa-- : pb--; draw(); } }, '−'));
          pl.append(p);
        });
      };
      const done = h('button.btn.big', { onclick: () => {
        if (pa === a && pb === b) {
          phase = 2; chime('good'); done.remove(); basket.remove();
          api.setQ('Молодец! А на какой тарелке больше?', ['Молодец', 'А на какой тарелке больше']); draw();
        } else {
          chime('bad'); api.miss(`Нужно: на синей ${a}, на красной ${b}. Сейчас на синей ${pa}, на красной ${pb}`);
        }
      } }, 'Готово');
      draw(); box.append(basket, pl, done);
    },
  };
}

/* ---------- Сложение и вычитание ---------- */
function addsub(l, op) {
  let a, b;
  const L = [[5, false], [10, false], [20, true], [100, false], [100, true]][l - 1];
  const max = L[0];
  if (op === '+') {
    if (max === 20) { a = rnd(2, 9); b = rnd(11 - a, 9); }
    else if (max === 100 && !L[1]) { a = rnd(1, 8) * 10 + rnd(0, 5); b = rnd(1, 9 - Math.floor(a / 10)) * 10 + rnd(0, 9 - (a % 10)); if (a + b > 99) return addsub(l, op); }
    else if (max === 100) { a = rnd(11, 79); b = rnd(11, 99 - a); if ((a % 10) + (b % 10) < 10) return addsub(l, op); }
    else { a = rnd(0, max - 1); b = rnd(1, max - a); }
  } else {
    if (max === 20) { a = rnd(11, 18); b = rnd(a - 9, 9); }
    else if (max === 100 && !L[1]) { a = rnd(21, 99); b = rnd(1, Math.floor(a / 10)) * 10 - 10 + rnd(0, a % 10); if (b < 1) b = rnd(1, a % 10 || 1); }
    else if (max === 100) { a = rnd(31, 99); b = rnd(11, a - 5); if ((a % 10) >= (b % 10)) return addsub(l, op); }
    else { a = rnd(1, max); b = rnd(0, a); }
  }
  const r = op === '+' ? a + b : a - b;
  let stage = big(`${a} ${op === '+' ? '+' : '−'} ${b} = <span class="gap">?</span>`);
  if (l === 1) { const o = pick(OBJ.slice(0, 8)); let pics = ''; for (let i = 0; i < a; i++) pics += `<span${op !== '+' && i >= a - b ? ' class="crossed"' : ''}>${o[0]}</span>`;
    stage = (op === '+' ? `<div class="sum-pic">${emojiGrid(o[0], a, 34)}<b>+</b>${emojiGrid(o[0], b, 34)}</div>` : `<div class="sum-pic"><div class="egrid" style="font-size:34px">${pics}</div></div>`) + stage; }
  if (l > 1 && Math.random() < 0.25) {
    // пропущенное число
    const miss = op === '+' ? b : b;
    return { q: 'Какое число пропущено?', stage: big(`${a} ${op === '+' ? '+' : '−'} <span class="gap">?</span> = ${r}`), choices: ch(numOpts(miss, 4, 3)), answer: miss, big: true, explain: op === '+' ? `${r} − ${a} = ${b}` : `${a} − ${r} = ${b}` };
  }
  return { q: `Сколько будет ${a} ${op === '+' ? 'плюс' : 'минус'} ${b}?`, say: ['Сколько будет', String(a), op === '+' ? 'плюс' : 'минус', String(b)], stage, choices: ch(numOpts(r, 4, max > 20 ? 4 : 3)), answer: r, big: true, explain: `${a} ${op === '+' ? '+' : '−'} ${b} = ${r}` + (max === 20 ? (op === '+' ? `. Дополни до десяти: ${a} + ${10 - a} = 10, и ещё ${b - (10 - a)}` : `. Сначала до десяти: ${a} − ${a - 10} = 10, потом ещё − ${b - (a - 10)}`) : '') };
}

/* ---------- Таблица умножения ---------- */
function mul(l) {
  const sets = [[2, 3], [4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9]];
  const a = pick(sets[l - 1]), b = rnd(2, 10);
  const r = a * b;
  const t = l === 5 ? pick(['mul', 'div', 'miss']) : (Math.random() < 0.25 ? 'div' : 'mul');
  if (t === 'div') return { q: `Сколько будет ${r} разделить на ${a}?`, say: ['Сколько будет', String(r), 'разделить на', String(a)], stage: big(`${r} : ${a} = <span class="gap">?</span>`), choices: ch(numOpts(b, 4, 3, 1)), answer: b, big: true, explain: `${a} × ${b} = ${r}, значит ${r} : ${a} = ${b}` };
  if (t === 'miss') return { q: 'Какое число пропущено?', stage: big(`<span class="gap">?</span> × ${a} = ${r}`), choices: ch(numOpts(b, 4, 3, 1)), answer: b, big: true, explain: `${b} × ${a} = ${r}` };
  const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return { q: `Сколько будет ${x} умножить на ${y}?`, say: ['Сколько будет', String(x), 'умножить на', String(y)], stage: big(`${x} × ${y} = <span class="gap">?</span>`), choices: ch(opts(r, [r + a, r - a, r + 1, r - 1, r + 10, x * (y + 1), (x + 1) * y].filter(v => v > 0 && v !== r))), answer: r, big: true, explain: `${x} × ${y} = ${r}` + (y > 1 ? ` — это ${x} взять ${y} ${plural(y, 'раз', 'раза', 'раз')}` : '') };
}

/* ---------- Многозначные числа ---------- */
function bigNum(l) {
  let a, b, op, r;
  if (l === 1) { op = pick(['+', '−']); a = rnd(120, 899); b = rnd(35, 99) + rnd(0, 3) * 100; if (op === '−' && b > a) [a, b] = [b, a]; if (op === '+' && a + b > 999) b = 999 - a - rnd(0, 50); }
  else if (l === 2) { op = pick(['×', ':']); if (op === '×') { a = rnd(12, 98); b = rnd(3, 9); } else { b = rnd(2, 9); r = rnd(21, 199); a = b * r; } }
  else if (l === 3) { op = pick(['+', '−', '×']); if (op === '×') { a = rnd(102, 499); b = rnd(12, 39); } else { a = rnd(10000, 89999); b = rnd(1000, 9999); if (op === '−' && b > a) [a, b] = [b, a]; } }
  else { op = pick(['×', ':']); if (op === '×') { a = rnd(1001, 4999); b = rnd(12, 95); } else { b = rnd(12, 48); r = rnd(102, 980); a = b * r; } }
  if (op === '+') r = a + b; else if (op === '−') r = a - b; else if (op === '×') r = a * b;
  const d = [r + 10, r - 10, r + 1, r - 1, r + 100, r - 100];
  return { q: 'Вычисли. Можно посчитать в столбик на листочке', say: ['Вычисли', 'Можно посчитать в столбик на листочке'], stage: big(`${fmt(a)} ${op} ${fmt(b)} = <span class="gap">?</span>`), choices: opts(r, d.filter(x => x > 0)).map(v => ({ v, label: fmt(v) })), answer: r, explain: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}`, mid: true };
}
export const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ---------- Порядок действий ---------- */
function order(l) {
  let e, r, why;
  if (l === 1) {
    const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9);
    if (Math.random() < 0.5) { e = `${a} + ${b} × ${c}`; r = a + b * c; why = `Сначала умножение: ${b} × ${c} = ${b * c}, потом сложение: ${a} + ${b * c} = ${r}`; }
    else { e = `(${a} + ${b}) × ${c}`; r = (a + b) * c; why = `Сначала в скобках: ${a} + ${b} = ${a + b}, потом ${a + b} × ${c} = ${r}`; }
  } else if (l === 2) {
    const a = rnd(3, 9), b = rnd(3, 9), d = rnd(2, 9), c = d * rnd(2, 9);
    e = `${a} × ${b} − ${c} : ${d}`; r = a * b - c / d; why = `Умножение и деление раньше: ${a * b} и ${c / d}. Потом ${a * b} − ${c / d} = ${r}`;
    if (r < 0) return order(l);
  } else {
    const a = rnd(2, 9), b = rnd(2, 9), c = rnd(10, 40), d = rnd(2, 5);
    const inner = a * b + c; const k = inner * d;
    e = `(${a} × ${b} + ${c}) × ${d} − ${a * b}`; r = k - a * b; why = `В скобках: ${a} × ${b} = ${a * b}, + ${c} = ${inner}. Потом × ${d} = ${k}, и − ${a * b} = ${r}`;
  }
  return { q: 'Вычисли, соблюдая порядок действий', stage: big(`${e} = <span class="gap">?</span>`), choices: ch(numOpts(r, 4, 5)), answer: r, explain: why, mid: true };
}

/* ---------- Уравнения ---------- */
function eq(l) {
  let s, x, why;
  x = rnd(2, 15);
  if (l === 1) {
    const a = rnd(3, 30); const t = rnd(0, 2);
    if (t === 0) { s = `x + ${a} = ${x + a}`; why = `x = ${x + a} − ${a} = ${x}. Чтобы найти неизвестное слагаемое, из суммы вычитаем известное`; }
    else if (t === 1) { s = `x − ${a} = ${x}`; x = x + a; why = `x = ${x - a} + ${a} = ${x}. Неизвестное уменьшаемое: разность плюс вычитаемое`; s = `x − ${a} = ${x - a}`; }
    else { const big2 = x + a; s = `${big2} − x = ${a}`; why = `x = ${big2} − ${a} = ${x}. Неизвестное вычитаемое: из уменьшаемого вычитаем разность`; }
  } else if (l === 2) {
    const a = rnd(2, 9);
    if (Math.random() < 0.5) { s = `${a} · x = ${a * x}`; why = `x = ${a * x} : ${a} = ${x}`; }
    else { s = `x : ${a} = ${x}`; const xx = x * a; why = `x = ${x} · ${a} = ${xx}`; x = xx; }
  } else {
    const a = rnd(2, 9), b = rnd(2, 20);
    if (Math.random() < 0.5) { s = `${a} · x + ${b} = ${a * x + b}`; why = `${a} · x = ${a * x + b} − ${b} = ${a * x}, x = ${a * x} : ${a} = ${x}`; }
    else { const xx = x + b; s = `(x − ${b}) · ${a} = ${x * a}`; why = `x − ${b} = ${x * a} : ${a} = ${x}, x = ${x} + ${b} = ${xx}`; x = xx; }
  }
  return { q: 'Реши уравнение. Чему равен x?', stage: big(s), choices: ch(numOpts(x, 4, 3)), answer: x, big: true, explain: why };
}

/* ---------- Дроби ---------- */
function fractions(l) {
  if (l === 1) {
    const den = pick([2, 3, 4, 5, 6, 8]), num = rnd(1, den - 1);
    const c = opts(`${num}/${den}`, [`${den - num}/${den}`, `${num}/${den + 1}`, `${den}/${num}`, `${num + 1}/${den}`].filter(x => x !== `${num}/${den}`));
    return { q: 'Какая часть круга закрашена?', stage: pieSVG(num, den, 140), choices: c.map(v => ({ v, label: frac(...v.split('/')) })), answer: `${num}/${den}`, explain: `Круг разделён на ${den} равных частей, закрашено ${num}. Это ${num}/${den}` };
  }
  if (l === 2) {
    const den = pick([2, 3, 4, 5, 6, 10]), num = rnd(1, den - 1), k = rnd(2, 12), n = den * k, r = num * k;
    return { q: `Найди ${num}/${den} от числа ${n}`, say: ['Найди', `${num} ${['', '', 'вторую', 'третьих', 'четвёртых', 'пятых', 'шестых', '', '', '', 'десятых'][den] || ''}`, 'от числа', String(n)], stage: big(`${frac(num, den)} от ${n}`), choices: ch(numOpts(r, 4, 3, 1)), answer: r, big: true, explain: `${n} : ${den} = ${k} — это одна часть. ${k} × ${num} = ${r}` };
  }
  if (l === 3) {
    if (Math.random() < 0.5) {
      const den = pick([5, 6, 7, 8, 9, 10, 12]), a = rnd(1, den - 2), b = rnd(1, den - a - 1);
      const r = `${a + b}/${den}`;
      return { q: 'Сложи дроби', stage: big(`${frac(a, den)} + ${frac(b, den)} = ?`), choices: opts(r, [`${a + b}/${den * 2}`, `${a + b + 1}/${den}`, `${Math.abs(a - b) || 1}/${den}`, `${a * b}/${den}`]).map(v => ({ v, label: frac(...v.split('/')) })), answer: r, explain: `Знаменатели одинаковые — складываем числители: ${a} + ${b} = ${a + b}. Знаменатель остаётся ${den}` };
    }
    const den = pick([5, 7, 8, 9, 11]); let a = rnd(1, den - 1), b = rnd(1, den - 1); while (a === b) b = rnd(1, den - 1);
    const ans = a > b ? '>' : '<';
    return { q: 'Сравни дроби', stage: big(`${frac(a, den)} <span class="gap">?</span> ${frac(b, den)}`), choices: [{ v: '>', label: '>' }, { v: '<', label: '<' }, { v: '=', label: '=' }], cols: 3, big: true, answer: ans, explain: `Знаменатели одинаковые: больше та дробь, у которой больше числитель` };
  }
  const t = rnd(0, 2);
  if (t === 0) { const pairs = [['1/2', '0,5'], ['1/4', '0,25'], ['3/4', '0,75'], ['1/5', '0,2'], ['2/5', '0,4'], ['1/10', '0,1'], ['3/10', '0,3']]; const p = pick(pairs); return { q: `Как записать дробь ${p[0]} десятичной?`, stage: big(frac(...p[0].split('/'))), choices: opts(p[1], pairs.map(x => x[1]).concat(['0,12', '1,4'])).map(v => ({ v, label: v })), answer: p[1], big: true, explain: `${p[0]} = ${p[1]}` }; }
  if (t === 1) { const a = rnd(1, 9) / 10 + rnd(0, 9) / 100, b = rnd(1, 9) / 10; const r = Math.round((a + b) * 100) / 100; const f = x => String(x).replace('.', ','); return { q: 'Сложи десятичные дроби', stage: big(`${f(a)} + ${f(b)} = ?`), choices: opts(r, [r + 0.1, r - 0.1, r + 0.01, Math.round((a * 10 + b) * 100) / 100].map(x => Math.round(x * 100) / 100).filter(x => x > 0)).map(v => ({ v, label: f(v) })), answer: r, big: true, explain: `Запятая под запятой: ${f(a)} + ${f(b)} = ${f(r)}` }; }
  const pct = pick([10, 20, 25, 50, 75]), n = pick([40, 60, 80, 120, 200, 360, 400]); const r = n * pct / 100;
  return { q: `Найди ${pct}% от ${n}`, stage: big(`${pct}% от ${n}`), choices: ch(numOpts(r, 4, 5)), answer: r, big: true, explain: `1% — это сотая часть: ${n} : 100 × ${pct} = ${r}` };
}

/* ---------- Текстовые задачи ---------- */
function word(l) {
  const [nm, g] = anyName(); const f = g === 'f';
  const was = f ? 'было' : 'было';
  const T = {
    1: () => { const o = pick(OBJ.slice(0, 10)); const a = rnd(2, 6), b = rnd(1, 4); if (Math.random() < 0.5) return [`У ${gen(nm)} ${a} ${objWord(o, a)}. ${f ? 'Ей' : 'Ему'} дали ещё ${b}. Сколько стало?`, a + b, `${a} + ${b} = ${a + b}`]; const c = rnd(1, a - 1); return [`У ${gen(nm)} ${was} ${a} ${objWord(o, a)}. ${c} ${f ? 'она' : 'он'} отдал${f ? 'а' : ''} другу. Сколько осталось?`, a - c, `${a} − ${c} = ${a - c}`]; },
    2: () => { const t = rnd(0, 2); if (t === 0) { const a = rnd(5, 15), b = rnd(2, 9); return [`На одной полке ${a} книг, а на другой на ${b} больше. Сколько книг на второй полке?`, a + b, `«На ${b} больше» — значит прибавляем: ${a} + ${b} = ${a + b}`]; } if (t === 1) { const a = rnd(8, 18), b = rnd(2, a - 3); return [`У Пети ${a} марок, а у Коли ${b}. На сколько марок у Пети больше?`, a - b, `Чтобы узнать «на сколько больше», из большего вычитаем меньшее: ${a} − ${b} = ${a - b}`]; } const a = rnd(3, 9), b = rnd(3, 9); return [`${nm} съел${f ? 'а' : ''} ${a} ягод, и у ${f ? 'неё' : 'него'} осталось ${b}. Сколько ягод было сначала?`, a + b, `Было = съел${f ? 'а' : ''} + осталось: ${a} + ${b} = ${a + b}`]; },
    3: () => { const t = rnd(0, 2); const a = rnd(3, 9), b = rnd(2, 9); if (t === 0) return [`В ${a} коробках по ${b} карандашей. Сколько всего карандашей?`, a * b, `Поровну в каждой — умножаем: ${a} × ${b} = ${a * b}`]; if (t === 1) return [`${a * b} конфет разделили поровну между ${a} детьми. Сколько конфет у каждого?`, b, `${a * b} : ${a} = ${b}`]; return [`У Маши ${b} ${plural(b, 'лента', 'ленты', 'лент')}, а у Кати в ${a} раза больше. Сколько лент у Кати?`, a * b, `«В ${a} раза больше» — умножаем: ${b} × ${a} = ${a * b}`]; },
    4: () => { const t = rnd(0, 2); if (t === 0) { const p = rnd(3, 15) * 5, n = rnd(2, 6), m = rnd(2, 5), q = rnd(2, 12) * 5; return [`Тетрадь стоит ${p} рублей, а ручка — ${q} рублей. Сколько стоят ${n} тетрад${n < 5 ? 'и' : 'ей'} и ${m} ручк${m < 5 ? 'и' : 'ек'}?`, p * n + q * m, `${p} × ${n} = ${p * n}, ${q} × ${m} = ${q * m}, всего ${p * n} + ${q * m} = ${p * n + q * m}`]; } if (t === 1) { const hh = rnd(1, 2), mm = pick([15, 20, 25, 35, 40, 45, 50]); return [`Мультфильм длится ${hh} ${hh === 1 ? 'час' : 'часа'} ${mm} минут. Сколько это всего минут?`, hh * 60 + mm, `В одном часе 60 минут: ${hh} × 60 + ${mm} = ${hh * 60 + mm}`]; } const a = rnd(20, 60), b = rnd(10, 30), c = rnd(5, 20); return [`В автобусе ехали ${a} человек. На остановке ${b} вышли и ${c} вошли. Сколько стало людей?`, a - b + c, `${a} − ${b} + ${c} = ${a - b + c}`]; },
    5: () => { const t = rnd(0, 2); const v = rnd(4, 18) * 5, tm = rnd(2, 6); if (t === 0) return [`Машина ехала ${tm} часа со скоростью ${v} км/ч. Какое расстояние она проехала?`, v * tm, `Расстояние = скорость × время: ${v} × ${tm} = ${v * tm} км`]; if (t === 1) return [`Велосипедист проехал ${v * tm / 5} км за ${tm} часа. С какой скоростью он ехал?`, v / 5, `Скорость = расстояние : время: ${v * tm / 5} : ${tm} = ${v / 5} км/ч`]; const v1 = rnd(40, 70), v2 = rnd(40, 70), tt = rnd(2, 4); return [`Из двух городов одновременно навстречу друг другу выехали две машины: одна со скоростью ${v1} км/ч, другая ${v2} км/ч. Они встретились через ${tt} часа. Каково расстояние между городами?`, (v1 + v2) * tt, `Скорость сближения ${v1} + ${v2} = ${v1 + v2} км/ч. ${v1 + v2} × ${tt} = ${(v1 + v2) * tt} км`]; },
    6: () => { const t = rnd(0, 2); if (t === 0) { const n = pick([20, 30, 40, 60, 120]), pct = pick([10, 20, 25, 50]); return [`В библиотеке ${n} книг, ${pct}% из них — сказки. Сколько сказок?`, n * pct / 100, `${n} : 100 × ${pct} = ${n * pct / 100}`]; } if (t === 1) { const [a, b] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 30]]); const r = a * b / (a + b); return [`Мастер делает работу за ${a} часов, а ученик — за ${b} часов. За сколько часов они сделают эту работу вместе?`, r, `За 1 час мастер делает 1/${a} работы, ученик — 1/${b}. Вместе: 1/${a} + 1/${b} = 1/${r}. Значит, за ${r} ч`]; } const s = rnd(6, 12), k = rnd(3, 5), y = rnd(2, 6); return [`Сыну ${s} лет, а отец старше в ${k} раза. Сколько лет будет отцу через ${y} года?`, s * k + y, `Отцу сейчас ${s} × ${k} = ${s * k}, через ${y} — ${s * k + y}`]; },
  };
  const [text, ans, why] = T[l]();
  return { q: text, choices: ch(numOpts(ans, 4, ans > 50 ? 5 : 3)), answer: ans, explain: why, long: true, big: true };
}
function gen(n) { // родительный падеж имени
  const m = { 'Петя': 'Пети', 'Ваня': 'Вани', 'Миша': 'Миши', 'Коля': 'Коли', 'Саша': 'Саши', 'Дима': 'Димы', 'Серёжа': 'Серёжи', 'Андрей': 'Андрея', 'Илья': 'Ильи', 'Федя': 'Феди', 'Гриша': 'Гриши', 'Алёша': 'Алёши', 'Маша': 'Маши', 'Катя': 'Кати', 'Аня': 'Ани', 'Оля': 'Оли', 'Даша': 'Даши', 'Таня': 'Тани', 'Лена': 'Лены', 'Света': 'Светы', 'Соня': 'Сони', 'Вера': 'Веры', 'Надя': 'Нади', 'Люба': 'Любы' };
  return m[n] || n;
}

/* ---------- Фигуры и цвета ---------- */
const SHAPES = {
  'круг': c => `<circle cx="40" cy="40" r="32" fill="${c}"/>`,
  'квадрат': c => `<rect x="10" y="10" width="60" height="60" rx="4" fill="${c}"/>`,
  'треугольник': c => `<polygon points="40,6 76,72 4,72" fill="${c}"/>`,
  'прямоугольник': c => `<rect x="4" y="20" width="72" height="40" rx="4" fill="${c}"/>`,
  'овал': c => `<ellipse cx="40" cy="40" rx="36" ry="24" fill="${c}"/>`,
  'звезда': c => `<polygon points="40,4 49,30 77,30 54,47 63,74 40,57 17,74 26,47 3,30 31,30" fill="${c}"/>`,
};
const COLORS = { 'красный': '#E04848', 'синий': '#3D6FD8', 'жёлтый': '#F2C230', 'зелёный': '#3FA66B', 'оранжевый': '#F08A3C', 'фиолетовый': '#8A57D6' };
const COLOR_F = { 'красный': 'красную', 'синий': 'синюю', 'жёлтый': 'жёлтую', 'зелёный': 'зелёную', 'оранжевый': 'оранжевую', 'фиолетовый': 'фиолетовую' };
function shapes(l) {
  const svg = (s, c) => `<svg viewBox="0 0 80 80" width="74" height="74">${SHAPES[s](c)}</svg>`;
  if (l === 2 && Math.random() < 0.4) {
    const q = pick([['треугольник', 3], ['квадрат', 4], ['прямоугольник', 4], ['круг', 0]]);
    return { q: `Сколько углов у фигуры ${q[0]}?`, say: ['Сколько углов у фигуры', q[0]], stage: svg(q[0], '#3D6FD8'), choices: ch([0, 3, 4, 5]), answer: q[1], big: true, cols: 4, explain: q[1] ? `У фигуры ${q[0]} ${q[1]} угла` : 'У круга нет углов' };
  }
  if (Math.random() < 0.5) {
    const names = Object.keys(SHAPES).slice(0, l === 1 ? 4 : 6); const t = pick(names); const c = pick(Object.values(COLORS));
    const list = opts(t, names, l === 1 ? 3 : 4);
    return { q: `Найди фигуру: ${t}`, say: ['Найди фигуру', t], choices: list.map(s => ({ v: s, label: svg(s, c) })), answer: t, explain: `Вот ${t}` };
  }
  const cn = Object.keys(COLORS).slice(0, l === 1 ? 4 : 6); const t = pick(cn); const s = pick(Object.keys(SHAPES).slice(0, 4));
  return { q: `Найди ${COLOR_F[t]} фигуру`, say: ['Найди', COLOR_F[t], 'фигуру'], choices: opts(t, cn, l === 1 ? 3 : 4).map(c => ({ v: c, label: svg(s, COLORS[c]) })), answer: t, explain: `${t[0].toUpperCase() + t.slice(1)} цвет — вот он` };
}

register([
  { id: 'm-count', sec: 'math', title: 'Счёт', icon: '🔢', g: [-3, 0], levels: 4, gen: count, prompts: ['Сколько здесь', 'Найди число'] },
  { id: 'm-shapes', sec: 'math', title: 'Фигуры и цвета', icon: '🔺', g: [-3, -1], levels: 2, gen: shapes, prompts: ['Найди фигуру'] },
  { id: 'm-compare', sec: 'math', title: 'Больше, меньше, выше', icon: '⚖️', g: [-3, 1], levels: 4, gen: compare, prompts: ['На какой тарелке', 'Какое дерево выше?'] },
  { id: 'm-plates', sec: 'math', title: 'Разложи по тарелкам', icon: '🍽️', g: [-3, -1], levels: 2, gen: plates, prompts: ['Положи на синюю тарелку', 'а на красную'] },
  { id: 'm-add', sec: 'math', title: 'Сложение', icon: '➕', g: [-1, 2], levels: 5, gen: l => addsub(l, '+'), prompts: ['Сколько будет'] },
  { id: 'm-sub', sec: 'math', title: 'Вычитание', icon: '➖', g: [-1, 2], levels: 5, gen: l => addsub(l, '-') },
  { id: 'm-mul', sec: 'math', title: 'Таблица умножения', icon: '✖️', g: [2, 4], levels: 5, gen: mul },
  { id: 'm-big', sec: 'math', title: 'Многозначные числа', icon: '🧮', g: [3, 6], levels: 4, gen: bigNum },
  { id: 'm-order', sec: 'math', title: 'Порядок действий', icon: '🪜', g: [2, 6], levels: 3, gen: order },
  { id: 'm-eq', sec: 'math', title: 'Уравнения', icon: '🟰', g: [2, 6], levels: 3, gen: eq },
  { id: 'm-frac', sec: 'math', title: 'Дроби и проценты', icon: '🥧', g: [4, 6], levels: 4, gen: fractions },
  { id: 'm-word', sec: 'math', title: 'Задачи', icon: '📝', g: [0, 6], levels: 6, gen: word, weight: 1.3 },
]);
void BOYS; void GIRLS; void say;
