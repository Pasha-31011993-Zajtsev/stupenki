// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Мелкие помощники для интерфейса
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** h('div.cls#id', {onclick}, child, 'text', ...) */
export function h(sel, attrs, ...kids) {
  const m = sel.match(/^([a-z0-9]+)?([^]*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(p => p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1)));
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(k => { if (k == null || k === false) return; el.append(k instanceof Node ? k : document.createTextNode(String(k))); });
  return el;
}

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function sample(arr, n) { return shuffle(arr).slice(0, n); }
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const wait = ms => new Promise(r => setTimeout(r, ms));

/** варианты ответа: правильный + отвлекающие, уникальные, перемешанные */
export function opts(correct, distractors, n = 4) {
  const seen = new Set([String(correct)]); const out = [correct];
  for (const d of shuffle(distractors)) { if (out.length >= n) break; if (!seen.has(String(d))) { seen.add(String(d)); out.push(d); } }
  return shuffle(out);
}
/** числовые отвлекающие рядом с ответом */
export function numOpts(ans, n = 4, spread = 3, min = 0, max = Infinity) {
  const d = [];
  for (let k = 1; d.length < 30 && k < 60; k++) { d.push(ans + k, ans - k); if (spread > 3) d.push(ans + k * 10, ans - k * 10); }
  return opts(ans, d.filter(x => x >= min && x <= max && x !== ans).slice(0, spread * 2 + 4), n);
}

/** склонение: plural(5, 'яблоко','яблока','яблок') */
export function plural(n, one, few, many) {
  n = Math.abs(n) % 100; const n1 = n % 10;
  if (n > 10 && n < 20) return many; if (n1 > 1 && n1 < 5) return few; if (n1 === 1) return one; return many;
}

export function toast(text, ms = 2200) {
  let t = $('#toast'); if (!t) { t = h('div#toast'); document.body.append(t); }
  t.textContent = text; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
}

export function confetti(emojis = ['🎉', '⭐', '✨', '🎈']) {
  const box = h('div.confetti'); document.body.append(box);
  for (let i = 0; i < 26; i++) {
    const s = h('span', pick(emojis)); s.style.left = Math.random() * 100 + 'vw'; s.style.animationDelay = (Math.random() * 0.6) + 's'; s.style.fontSize = (22 + Math.random() * 22) + 'px';
    box.append(s);
  }
  setTimeout(() => box.remove(), 3200);
}

export function modal(content, { onClose, wide } = {}) {
  const bg = h('div.modal-bg'); const card = h('div.modal' + (wide ? '.wide' : ''), content);
  const close = () => { bg.remove(); onClose && onClose(); };
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  bg.append(card); document.body.append(bg);
  return { close, card };
}

export function confirmBox(text, yes = 'Да', no = 'Отмена') {
  return new Promise(res => {
    const m = modal([h('p.modal-text', text), h('div.row.end', h('button.btn.ghost', { onclick: () => { m.close(); res(false); } }, no), h('button.btn.danger', { onclick: () => { m.close(); res(true); } }, yes))], { onClose: () => res(false) });
  });
}

/** уменьшить картинку и вернуть dataURL */
export function resizeImage(file, max = 320, q = 0.82) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej; img.src = url;
  });
}
export function dataURLtoBlob(d) { const [a, b] = d.split(','); const mime = a.match(/:(.*?);/)[1]; const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); }

export function avatarEl(child, size = 72) {
  const el = h('div.avatar', { style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.6) + 'px' } });
  if (child.photo) el.append(h('img', { src: child.photo, alt: '' })); else el.textContent = child.avatar || '🙂';
  return el;
}

export function ageText(n) { return n + ' ' + plural(n, 'год', 'года', 'лет'); }
