// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Общие данные для заданий
import { pick, rnd, plural } from '../ui.js';

// [эмодзи, один, два, пять]
export const OBJ = [
  ['🍎', 'яблоко', 'яблока', 'яблок'], ['🍐', 'груша', 'груши', 'груш'], ['🍓', 'клубничка', 'клубнички', 'клубничек'],
  ['🐟', 'рыбка', 'рыбки', 'рыбок'], ['🎈', 'шарик', 'шарика', 'шариков'], ['🚗', 'машинка', 'машинки', 'машинок'],
  ['⭐', 'звёздочка', 'звёздочки', 'звёздочек'], ['🐥', 'цыплёнок', 'цыплёнка', 'цыплят'], ['🌸', 'цветок', 'цветка', 'цветов'],
  ['🍄', 'гриб', 'гриба', 'грибов'], ['🦆', 'утка', 'утки', 'уток'], ['⚽', 'мяч', 'мяча', 'мячей'], ['🐞', 'жук', 'жука', 'жуков'],
  ['🍒', 'вишенка', 'вишенки', 'вишенок'], ['🧸', 'мишка', 'мишки', 'мишек'], ['🐠', 'рыбка', 'рыбки', 'рыбок'],
];
export const objWord = (o, n) => plural(n, o[1], o[2], o[3]);

export const BOYS = ['Петя', 'Ваня', 'Миша', 'Коля', 'Саша', 'Дима', 'Серёжа', 'Андрей', 'Илья', 'Федя', 'Гриша', 'Алёша'];
export const GIRLS = ['Маша', 'Катя', 'Аня', 'Оля', 'Даша', 'Таня', 'Лена', 'Света', 'Соня', 'Вера', 'Надя', 'Люба'];
export const anyName = () => (Math.random() < 0.5 ? [pick(BOYS), 'm'] : [pick(GIRLS), 'f']);

export const big = s => `<div class="bigtext">${s}</div>`;
export const pic = s => `<div class="pic">${s}</div>`;
export const note = s => `<div class="note">${s}</div>`;

export function emojiGrid(e, n, size = 44) {
  let out = '<div class="egrid" style="font-size:' + size + 'px">';
  for (let i = 0; i < n; i++) out += `<span>${e}</span>` + ((i + 1) % 5 === 0 && i < n - 1 ? '<i class="br"></i>' : '');
  return out + '</div>';
}

export function plateSVG(color, n, e, w = 150) {
  let items = '';
  const pos = platePositions(n);
  pos.forEach(([x, y]) => { items += `<text x="${x}" y="${y}" font-size="26" text-anchor="middle" dominant-baseline="central">${e}</text>`; });
  return `<svg viewBox="0 0 150 110" width="${w}" class="plate"><ellipse cx="75" cy="62" rx="70" ry="42" fill="#fff" stroke="${color}" stroke-width="6"/><ellipse cx="75" cy="62" rx="50" ry="27" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="3"/>${items}</svg>`;
}
export function platePositions(n) {
  const out = []; const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : 5; const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c = i % cols; const inRow = Math.min(cols, n - r * cols); out.push([75 + (c - (inRow - 1) / 2) * 26, 62 + (r - (rows - 1) / 2) * 26]); }
  return out;
}

export function clockSVG(h, m, size = 170) {
  let ticks = '';
  for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 82 : 76; ticks += `<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * 88}" y2="${100 - Math.cos(a) * 88}" stroke="#2B2D42" stroke-width="${i % 5 ? 1.5 : 3.5}"/>`; }
  let nums = ''; for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; nums += `<text x="${100 + Math.sin(a) * 63}" y="${100 - Math.cos(a) * 63}" font-size="17" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#2B2D42">${i}</text>`; }
  const ha = ((h % 12) + m / 60) * 30 * Math.PI / 180, ma = m * 6 * Math.PI / 180;
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}"><circle cx="100" cy="100" r="94" fill="#fff" stroke="var(--accent)" stroke-width="8"/>${ticks}${nums}
  <line x1="100" y1="100" x2="${100 + Math.sin(ha) * 45}" y2="${100 - Math.cos(ha) * 45}" stroke="#2B2D42" stroke-width="8" stroke-linecap="round"/>
  <line x1="100" y1="100" x2="${100 + Math.sin(ma) * 72}" y2="${100 - Math.cos(ma) * 72}" stroke="#D9534F" stroke-width="5" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="6" fill="#2B2D42"/></svg>`;
}

export function pieSVG(num, den, size = 120, color = 'var(--accent)') {
  let s = '';
  for (let i = 0; i < den; i++) {
    const a0 = (i / den) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
    const x0 = 60 + 54 * Math.cos(a0), y0 = 60 + 54 * Math.sin(a0), x1 = 60 + 54 * Math.cos(a1), y1 = 60 + 54 * Math.sin(a1);
    const large = 1 / den > 0.5 ? 1 : 0;
    s += den === 1 ? `<circle cx="60" cy="60" r="54" fill="${i < num ? color : '#fff'}" stroke="#2B2D42" stroke-width="2.5"/>`
      : `<path d="M60 60 L${x0} ${y0} A54 54 0 ${large} 1 ${x1} ${y1} Z" fill="${i < num ? color : '#fff'}" stroke="#2B2D42" stroke-width="2.5"/>`;
  }
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}">${s}</svg>`;
}

export const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
export const R = (a, b) => rnd(a, b);
