// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// «Мои места»: родитель отмечает дом, школу, храм… Дети получают личные задания на прогулке.
import { DB, save, uid } from './store.js';
import { h, toast, modal, confirmBox, pick, shuffle, opts, confetti } from './ui.js';
import { go, back, header, refresh, app } from './nav.js';
import { say, chime } from './voice.js';
import { ensurePermission, showHelp } from './perm.js';
import { register, effG } from './engine.js';

export const PLACE_TYPES = [
  ['home', '🏠', 'Дом'], ['school', '🏫', 'Школа'], ['kinder', '🧸', 'Детский сад'], ['church', '⛪', 'Храм'], ['park', '🌳', 'Парк'],
  ['shop', '🛒', 'Магазин'], ['library', '📚', 'Библиотека'], ['sport', '⚽', 'Спортплощадка'], ['granny', '👵', 'Бабушка и дедушка'],
  ['doctor', '🏥', 'Поликлиника'], ['post', '✉️', 'Почта'], ['monument', '🗿', 'Памятник'], ['other', '📍', 'Другое'],
];
const typeOf = id => PLACE_TYPES.find(t => t[0] === id) || PLACE_TYPES[PLACE_TYPES.length - 1];
export const places = () => (DB.places || (DB.places = []));

/* ---------- геолокация ---------- */
export function locate() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) { rej(new Error('nogeo')); return; }
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }), e => rej(e), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}
export function dist(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export function bearing(a, b) {
  const r = x => x * Math.PI / 180;
  const y = Math.sin(r(b.lon - a.lon)) * Math.cos(r(b.lat));
  const x = Math.cos(r(a.lat)) * Math.sin(r(b.lat)) - Math.sin(r(a.lat)) * Math.cos(r(b.lat)) * Math.cos(r(b.lon - a.lon));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
const DIRS = ['на севере', 'на северо-востоке', 'на востоке', 'на юго-востоке', 'на юге', 'на юго-западе', 'на западе', 'на северо-западе'];
const DIRS4 = ['север', 'восток', 'юг', 'запад'];
export const dirText = deg => DIRS[Math.round(deg / 45) % 8];
const dir4 = deg => DIRS4[Math.round(deg / 90) % 4];
const meters = m => (m < 1000 ? `${Math.round(m / 10) * 10} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`);
const geoErr = e => { if (e && e.code === 1) showHelp('geo'); else toast(e && e.code === 3 ? 'GPS долго не отвечает — выйдите на открытое место и попробуйте ещё раз' : 'Не удалось определить местоположение'); };

/* ================= РОДИТЕЛЮ: МОИ МЕСТА ================= */
export function placesScreen() {
  const list = h('div.walk-list');
  places().forEach(p => { const t = typeOf(p.type); list.append(h('button.walk-item', { onclick: () => go(placeForm, p.id) }, h('div.ico', t[1]), h('div.wbody', h('div.name', p.name || t[2]), h('div.small.muted', [p.street ? `${p.street}${p.house ? ', ' + p.house : ''}` : 'адрес не указан', p.lat ? ' · 📍 точка сохранена' : ''].join(''))), h('div.check', '›'))); });
  return [header('📍 Мои места'),
    h('div.panel', h('p', 'Отметьте места, где вы бываете с детьми: дом, школу, храм, парк, бабушку. Из них получатся личные задания на прогулке: «Дойди до…», «На какой улице…», «В какой стороне…».'),
      h('p.perm-small', '🔒 Адреса и координаты хранятся только на этом устройстве и никуда не отправляются.')),
    places().length ? list : h('p.muted.center', 'Пока нет ни одного места'),
    h('div.center', h('button.btn.big.good', { onclick: () => go(placeForm, null) }, '+ Добавить место'))];
}

function placeForm(id) {
  const ex = places().find(p => p.id === id);
  const p = ex ? { ...ex } : { id: uid(), type: 'home', name: '', street: '', house: '', lat: null, lon: null, acc: null };
  const name = h('input.text-input', { value: p.name, placeholder: 'Название (например: Школа № 5)', maxlength: 40 });
  const street = h('input.text-input', { value: p.street, placeholder: 'Улица (например: улица Ленина)', maxlength: 50 });
  const house = h('input.text-input', { value: p.house, placeholder: 'Номер дома', maxlength: 10, inputmode: 'text' });
  const types = h('div.choice-row');
  const drawTypes = () => { types.innerHTML = ''; PLACE_TYPES.forEach(t => types.append(h('button.choice' + (p.type === t[0] ? '.on' : ''), { onclick: () => { p.type = t[0]; drawTypes(); } }, t[1] + ' ' + t[2]))); };
  drawTypes();
  const geoState = h('p.small');
  const drawGeo = () => { geoState.textContent = p.lat ? `📍 Точка сохранена (точность около ${Math.round(p.acc || 0)} м)` : 'Точка не сохранена — задание «Дойди до…» будет без проверки по GPS'; };
  drawGeo();
  const geoBtn = h('button.btn', { onclick: async () => {
    if (!(await ensurePermission('geo'))) return;
    geoBtn.disabled = true; geoBtn.textContent = '⏳ Определяю…';
    try { const pos = await locate(); Object.assign(p, pos); drawGeo(); toast(pos.acc > 60 ? 'Сохранено. Точность невысокая — лучше выйти на открытое место' : 'Точка сохранена'); }
    catch (e) { geoErr(e); }
    geoBtn.disabled = false; geoBtn.textContent = '📍 Я сейчас здесь — запомнить точку';
  } }, '📍 Я сейчас здесь — запомнить точку');
  return [header(ex ? 'Место' : 'Новое место'),
    h('div.panel', h('label.lbl', 'Что это за место'), types, h('label.lbl', 'Название'), name, h('label.lbl', 'Адрес'), street, house,
      h('p.muted.small', 'Адрес нужен для вопросов «На какой улице…» и «Какой номер дома…». Пишите так, как на табличке.')),
    h('div.panel', h('label.lbl', 'Точка на карте'), h('p.small', 'Встаньте у этого места и нажмите кнопку — приложение запомнит координаты, чтобы потом проверять, дошёл ли ребёнок.'), geoBtn, geoState),
    h('div.row.wrap.center',
      ex ? h('button.btn.danger', { onclick: async () => { if (await confirmBox('Удалить это место?', 'Удалить')) { DB.places = places().filter(x => x.id !== p.id); save(true); back(); } } }, 'Удалить') : null,
      h('button.btn.big.good', { onclick: () => {
        p.name = name.value.trim(); p.street = street.value.trim(); p.house = house.value.trim();
        if (!p.name) p.name = typeOf(p.type)[2];
        if (ex) Object.assign(ex, p); else places().push(p);
        save(true); toast('Сохранено'); back();
      } }, 'Сохранить'))];
}

/* ================= РЕБЁНКУ: ЗАДАНИЯ ПО МЕСТАМ ================= */
export function myPlacesBlock(child) {
  const ps = places(); if (!ps.length) return null;
  const box = h('div.panel', h('h2', '⭐ Мои места'), h('p.muted.small', 'Задания про места, где ты бываешь'));
  ps.forEach(p => { const t = typeOf(p.type); const k = 'place:' + p.id; const d = child.walks[k];
    box.append(h('button.walk-item' + (d ? '.done' : ''), { onclick: () => go(goToPlace, p.id) }, h('div.ico', t[1]), h('div.wbody', h('div.name', 'Дойди: ' + p.name), h('div.small', '★★' + (d ? ' · выполнено' : ''))), h('div.check', d ? '✅' : '›'))); });
  return box;
}

function goToPlace(id) {
  const c = app.child; const p = places().find(x => x.id === id); const t = typeOf(p.type); const k = 'place:' + p.id;
  const f = c.gender === 'f';
  const status = h('div.geo-status');
  const finish = (how) => {
    const first = !c.walks[k];
    c.walks[k] = { date: new Date().toISOString().slice(0, 10), answer: how, photo: false };
    if (first) c.stars += 6;
    save(true); chime('win'); confetti(['⭐', t[1], '👣']);
    status.className = 'geo-status ok'; status.textContent = `Ура! Ты ${f ? 'дошла' : 'дошёл'}: ${p.name}! ${first ? '+6 ⭐' : ''}`;
    say(`Ура! Ты ${f ? 'дошла' : 'дошёл'}! ${p.name}`);
  };
  const check = h('button.btn.big.good', { onclick: async () => {
    if (!p.lat) { adultConfirm(); return; }
    if (!(await ensurePermission('geo'))) { adultConfirm(); return; }
    check.disabled = true; status.className = 'geo-status'; status.textContent = '⏳ Смотрю, где мы…';
    try {
      const me = await locate(); const d = dist(me, p); const near = Math.max(60, (me.acc || 0) + (p.acc || 0) * 0.5 + 20);
      if (d <= near) finish('GPS');
      else { const br = bearing(me, p); status.className = 'geo-status'; status.innerHTML = ''; status.append(h('div.big-text', `Ещё идти примерно ${meters(d)}`), h('div', `${p.name} — ${dirText(br)} от тебя.`), h('div.compass', { html: compassSVG(br) })); say(`Ещё идти примерно ${meters(d).replace('м', 'метров').replace('км', 'километра')}. ${p.name} ${dirText(br)} от тебя`); }
    } catch (e) { status.textContent = ''; geoErr(e); }
    check.disabled = false;
  } }, f ? '📍 Я дошла — проверить' : '📍 Я дошёл — проверить');
  const adultConfirm = () => {
    const a = 3 + Math.floor(Math.random() * 6), b = 6 + Math.floor(Math.random() * 4);
    const inp = h('input.num-input', { type: 'number', inputmode: 'numeric' });
    const m = modal([h('h2', 'Подтверждает взрослый'), h('p', `Ребёнок пришёл: ${p.name}? Для подтверждения решите пример:`), h('p.big-text', `${a * 10 + b} − ${b} = ?`), inp,
      h('div.row.end', h('button.btn.ghost', { onclick: () => m.close() }, 'Отмена'), h('button.btn.good', { onclick: () => { if (+inp.value === a * 10) { m.close(); finish('взрослый'); } else inp.classList.add('shake'); } }, 'Подтвердить'))]);
  };
  // где это? — сторона света (для школьников)
  const whereBtn = p.lat && effG(c) >= 2 ? h('button.btn.ghost', { onclick: async () => {
    if (!(await ensurePermission('geo'))) return;
    try {
      const me = await locate(); const br = bearing(me, p); const ans = dir4(br);
      const m = modal([h('h2', `Как думаешь, в какой стороне ${p.name}?`), h('p.muted', 'Подсказка: утром солнце на востоке, днём — на юге, вечером — на западе.'),
        h('div.options', { style: { gridTemplateColumns: '1fr 1fr' } }, ...DIRS4.map(v => h('button.opt.textopt', { onclick: () => { m.close(); const ok = v === ans; chime(ok ? 'good' : 'bad'); status.className = 'geo-status' + (ok ? ' ok' : ''); status.innerHTML = ''; status.append(h('div.big-text', ok ? 'Верно! 🧭' : `Почти! ${p.name} — ${dirText(br)}`), h('div', `Расстояние примерно ${meters(dist(me, p))}`), h('div.compass', { html: compassSVG(br) })); if (ok) { c.stars += 1; save(); } } }, v)))]);
    } catch (e) { geoErr(e); }
  } }, '🧭 В какой стороне?') : null;
  setTimeout(() => say(`Дойди вместе со взрослым: ${p.name}`), 250);
  return [header(t[1] + ' ' + p.name),
    h('div.panel', h('p.big-text', `Дойди вместе со взрослым: ${p.name}.`), p.street ? h('p', `Адрес: ${p.street}${p.house ? ', дом ' + p.house : ''}. Найди табличку с адресом и проверь!`) : null,
      h('p.muted.small', p.lat ? 'Когда придёшь, нажми кнопку — телефон проверит, что ты на месте.' : 'Когда придёшь, взрослый подтвердит.')),
    h('div.center.col', check, whereBtn), status];
}

function compassSVG(deg) {
  return `<svg viewBox="0 0 120 120" width="130"><circle cx="60" cy="60" r="54" fill="#fff" stroke="var(--accent)" stroke-width="5"/>
  <text x="60" y="20" text-anchor="middle" font-size="14" font-weight="900" fill="#D9534F">С</text><text x="60" y="110" text-anchor="middle" font-size="14" font-weight="900">Ю</text>
  <text x="104" y="65" text-anchor="middle" font-size="14" font-weight="900">В</text><text x="16" y="65" text-anchor="middle" font-size="14" font-weight="900">З</text>
  <g transform="rotate(${deg} 60 60)"><polygon points="60,24 68,62 60,56 52,62" fill="var(--accent)"/><circle cx="60" cy="60" r="5" fill="#2B2D42"/></g></svg>`;
}

/* ================= ВОПРОСЫ ПРО АДРЕСА В ЗАНЯТИЯХ ================= */
const FAKE_STREETS = ['улица Садовая', 'улица Школьная', 'улица Лесная', 'улица Центральная', 'улица Молодёжная', 'улица Набережная', 'улица Полевая', 'улица Мира', 'улица Советская', 'переулок Зелёный'];
function addrQuiz(l, child) {
  const ps = places().filter(p => p.street); if (!ps.length) return null;
  const p = pick(ps); const t = typeOf(p.type);
  if (p.house && Math.random() < 0.45) {
    const nums = new Set([p.house]); const n = parseInt(p.house, 10) || 5;
    [n + 1, n + 2, n - 1, n + 10, n * 2].forEach(x => { if (x > 0 && nums.size < 4) nums.add(String(x)); });
    return { key: 'house:' + p.id, q: `Какой номер дома у места «${p.name}»?`, stage: `<div class="pic">${t[1]}</div>`, choices: shuffle([...nums]).map(v => ({ v, label: v })), answer: p.house, big: true, explain: `${p.name}: ${p.street}, дом ${p.house}. Посмотри на табличку, когда будешь рядом!` };
  }
  const others = [...new Set(places().filter(x => x.street && x.street !== p.street).map(x => x.street).concat(FAKE_STREETS))].filter(s => s.toLowerCase() !== p.street.toLowerCase());
  return { key: 'street:' + p.id, q: `На какой улице находится «${p.name}»?`, stage: `<div class="pic">${t[1]}</div>`, choices: opts(p.street, others).map(v => ({ v, label: v })), answer: p.street, cols: 1, explain: `${p.name} — ${p.street}${p.house ? ', дом ' + p.house : ''}` };
}
register([{ id: 'w-myplaces', sec: 'world', title: 'Мои места и адреса', icon: '🏠', g: [-1, 6], levels: 1, gen: addrQuiz, when: () => places().some(p => p.street), weight: 0.8 }]);
void refresh;
