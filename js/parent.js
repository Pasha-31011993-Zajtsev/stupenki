// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Родительский раздел: настройка семьи, профили, статистика, голос, настройки
import { DB, save, newChild, getChild, blobGet, blobDel, today } from './store.js';
import { h, toast, modal, confirmBox, avatarEl, ageText, resizeImage, rnd, plural } from './ui.js';
import { go, back, header, reset, app, onLeave, refresh } from './nav.js';
import { say, ruVoices, enVoices, refreshVoices, currentVoice, Recorder, saveRec, delRec, hasRec, playRecording, recCount, stop } from './voice.js';
import { THEMES, AVATARS, themeOf, applyTheme, praiseFor, TRY_AGAIN } from './themes.js';
import { SECTIONS, FOCUSABLE, SKILLS, SKILL, weakList, accuracy, effG, available, dueCount } from './engine.js';
import { EXERCISES, SOUNDS } from './logoped.js';
import { WALKS } from './walks.js';
import { placesScreen, places } from './places.js';
import { ensurePermission, showHelp } from './perm.js';

let familyFn = null;
export function setFamily(fn) { familyFn = fn; }
const toFamily = () => familyFn && reset(familyFn);

/* ================= ПЕРВЫЙ ЗАПУСК ================= */
export function setupScreen(onDone) {
  if (onDone) familyFn = familyFn || null;
  return h('div.setup',
    h('div.logo-big', stairs()),
    h('h1', 'Ступеньки'),
    h('p.lead', 'Занятия для всех детей в семье — на одном устройстве. У каждого ребёнка свои задания по возрасту и свой прогресс.'),
    h('ul.setup-list',
      h('li', h('b', 'Подстраивается сам. '), 'Чаще даёт то, что пока получается хуже, и повышает уровень, когда всё хорошо.'),
      h('li', h('b', 'Всё озвучено. '), 'Можно записать свой голос — для похвалы и заданий.'),
      h('li', h('b', 'Работает без интернета. '), 'Всё хранится только на этом устройстве.')),
    h('button.btn.big.good', { onclick: () => go(childForm, null, () => go(setupMore, onDone)) }, 'Добавить первого ребёнка'));
}
function setupMore(onDone) {
  const list = h('div.mini-kids'); DB.children.forEach(c => list.append(h('div.mini-kid', avatarEl(c, 44), h('b', c.name))));
  return h('div.setup',
    h('h1', 'Отлично!'), list,
    h('p.lead', 'Добавьте остальных детей — у каждого будут свои занятия.'),
    h('div.col',
      h('button.btn.big', { onclick: () => go(childForm, null, () => go(setupMore, onDone)) }, '+ Добавить ещё ребёнка'),
      h('button.btn.big.ghost', { onclick: () => go(pinScreen, () => go(setupMore, onDone)) }, DB.pin ? '🔒 Код родителя задан' : '🔒 Придумать код для родительского раздела'),
      h('button.btn.big.good', { onclick: () => { DB.setupDone = true; save(true); onDone(); } }, 'Готово, начинаем!')));
}

/* ================= ВХОД ДЛЯ РОДИТЕЛЕЙ ================= */
export function parentGate(next) {
  if (DB.pin) {
    let v = '';
    const dots = h('div.pin-dots');
    const draw = () => { dots.innerHTML = ''; for (let i = 0; i < 4; i++) dots.append(h('span' + (i < v.length ? '.on' : ''))); };
    const pad = h('div.pinpad');
    const m = modal([h('h2', 'Код родителя'), dots, pad]);
    [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].forEach(k => pad.append(k === '' ? h('span') : h('button.pin-key', { onclick: () => {
      if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k;
      draw();
      if (v.length === 4) { if (v === DB.pin) { m.close(); go(next); } else { dots.classList.add('shake'); setTimeout(() => { v = ''; draw(); dots.classList.remove('shake'); }, 500); } }
    } }, String(k))));
    draw(); return;
  }
  const a = rnd(13, 19), b = rnd(6, 9), c = rnd(11, 49); const ans = a * b + c;
  const inp = h('input.num-input', { type: 'number', inputmode: 'numeric', placeholder: '?' });
  const m = modal([h('h2', 'Только для взрослых'), h('p.big-text', `${a} × ${b} + ${c} = ?`), inp,
    h('div.row.end', h('button.btn.ghost', { onclick: () => m.close() }, 'Отмена'), h('button.btn', { onclick: () => { if (+inp.value === ans) { m.close(); go(next); } else { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 500); } } }, 'Войти')),
    h('p.muted.small', 'Можно задать свой код в настройках родительского раздела.')]);
  setTimeout(() => inp.focus(), 50);
}

function pinScreen(after) {
  const inp = h('input.num-input', { type: 'password', inputmode: 'numeric', maxlength: 4, placeholder: '4 цифры', value: '' });
  return [header('🔒 Код для родителей'),
    h('div.panel', h('p', 'Код закрывает родительский раздел: статистику, настройки и профили. Дети его не увидят.'), inp,
      h('div.row.wrap',
        h('button.btn.good', { onclick: () => { if (/^\d{4}$/.test(inp.value)) { DB.pin = inp.value; save(true); toast('Код сохранён'); after ? after() : back(); } else toast('Нужно ровно 4 цифры'); } }, 'Сохранить код'),
        DB.pin ? h('button.btn.ghost', { onclick: () => { DB.pin = null; save(true); toast('Код убран — вход по примеру'); after ? after() : back(); } }, 'Убрать код') : null))];
}

/* ================= ПРОФИЛЬ РЕБЁНКА ================= */
export function childForm(child, onSave) {
  const isNew = !child;
  const c = child ? JSON.parse(JSON.stringify(child)) : newChild({});
  if (isNew) c.theme = null;
  const nameI = h('input.text-input', { value: c.name, placeholder: 'Имя ребёнка', maxlength: 20 });
  const rerender = () => { const box = document.querySelector('.child-form'); if (box) box.replaceWith(formBody()); };
  const choice = (opts, cur, set) => { const r = h('div.choice-row'); opts.forEach(([v, label]) => r.append(h('button.choice' + (cur === v ? '.on' : ''), { onclick: () => { set(v); rerender(); } }, label))); return r; };
  const photoInp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: async () => { const f = photoInp.files[0]; if (f) { c.photo = await resizeImage(f, 320); rerender(); } } });
  const camInp = h('input', { type: 'file', accept: 'image/*', capture: 'user', style: { display: 'none' }, onchange: async () => { const f = camInp.files[0]; if (f) { c.photo = await resizeImage(f, 320); rerender(); } } });

  function formBody() {
    c.name = nameI.value;
    const themes = Object.entries(THEMES).sort((a, b) => (a[1].g === c.gender ? 0 : 1) - (b[1].g === c.gender ? 0 : 1));
    if (!c.theme || !THEMES[c.theme]) c.theme = themes[0][0];
    const avatars = h('div.avatar-grid');
    AVATARS.forEach(a => avatars.append(h('button.av' + (!c.photo && c.avatar === a ? '.on' : ''), { onclick: () => { c.avatar = a; c.photo = null; rerender(); } }, a)));
    const themeGrid = h('div.theme-grid');
    themes.forEach(([id, t]) => themeGrid.append(h('button.theme-card' + (c.theme === id ? '.on' : ''), { style: { '--tc': t.accent, '--ts': t.soft }, onclick: () => { c.theme = id; rerender(); } }, h('div.ico', t.hero), h('div.name', t.name), h('div.prev', t.items.slice(0, 5).map(x => x[0]).join('')))));
    const focus = h('div.choice-row');
    FOCUSABLE.forEach(s => { const on = c.focus.includes(s); focus.append(h('button.choice' + (on ? '.on' : ''), { onclick: () => { c.focus = on ? c.focus.filter(x => x !== s) : [...c.focus, s]; rerender(); } }, SECTIONS[s].icon + ' ' + SECTIONS[s].title)); });
    const ages = []; for (let i = 3; i <= 13; i++) ages.push([i, String(i)]);
    const grades = [[0, 'Не ходит в школу'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']];
    return h('div.child-form',
      h('div.panel', h('label.lbl', 'Имя'), nameI,
        h('label.lbl', 'Кто это'), choice([['m', '👦 Мальчик'], ['f', '👧 Девочка']], c.gender, v => { if (c.gender !== v) { c.gender = v; if (THEMES[c.theme] && THEMES[c.theme].g !== v) c.theme = null; } }),
        h('label.lbl', 'Возраст'), choice(ages, c.age, v => { c.age = v; if (v <= 6) c.grade = 0; }),
        h('label.lbl', 'Класс'), choice(grades, c.grade, v => { c.grade = v; }),
        h('p.muted.small', 'По возрасту и классу подбираются задания и стартовые уровни. Дальше приложение подстроится само.')),
      h('div.panel', h('label.lbl', 'Картинка или фото'),
        h('div.row.wrap.center', avatarEl(c, 84), h('div.col', h('button.btn.ghost', { onclick: () => camInp.click() }, '📷 Сфотографировать'), h('button.btn.ghost', { onclick: () => photoInp.click() }, '🖼 Выбрать фото'))), photoInp, camInp, avatars),
      h('div.panel', h('label.lbl', 'Тема оформления'), h('p.muted.small', 'Свои цвета, герой и коллекция наград.'), themeGrid),
      h('div.panel', h('label.lbl', 'На что сделать упор'), h('p.muted.small', 'Задания из отмеченных разделов будут встречаться чаще. Можно ничего не отмечать.'), focus),
      h('div.center', h('button.btn.big.good', { onclick: () => {
        c.name = nameI.value.trim();
        if (!c.name) { toast('Напишите имя'); nameI.focus(); return; }
        if (isNew) DB.children.push(c); else Object.assign(child, c);
        save(true); toast(isNew ? `${c.name} — добавлен${c.gender === 'f' ? 'а' : ''}!` : 'Сохранено');
        onSave ? onSave(isNew ? c : child) : back();
      } }, isNew ? 'Добавить' : 'Сохранить')));
  }
  return [header(isNew ? 'Новый ребёнок' : 'Профиль: ' + c.name), formBody()];
}

/* ================= ГЛАВНАЯ ДЛЯ РОДИТЕЛЕЙ ================= */
export function parentHome() {
  applyTheme(null);
  const kids = h('div.parent-kids');
  DB.children.forEach(c => {
    const w = weakList(c)[0]; const wk = days7(c);
    kids.append(h('button.pk-card', { onclick: () => go(childStats, c.id) }, avatarEl(c, 56),
      h('div.pk-body', h('div.name', c.name), h('div.small', `${c.grade > 0 ? c.grade + ' класс' : ageText(c.age)} · за неделю ${wk.min} мин, ${wk.n} ${plural(wk.n, 'задание', 'задания', 'заданий')}`),
        w ? h('div.small.warn', 'Трудно: ' + SKILL[w.id].title) : null), h('div.chev', '›')));
  });
  return [
    header('Для родителей', { onBack: toFamily }),
    h('div.panel', h('h2', 'Дети'), kids, h('button.btn', { onclick: () => go(childForm, null, () => back()) }, '+ Добавить ребёнка')),
    h('div.menu',
      menuItem('🎙', 'Мой голос', 'Запишите похвалу, имя и задания своим голосом', () => go(recordingsScreen)),
      menuItem('🔊', 'Голос и скорость речи', 'Какой голос читает задания', () => go(voiceScreen)),
      menuItem('📍', 'Мои места', 'Дом, школа, храм — для личных заданий на прогулке', () => go(placesScreen)),
      menuItem('🧭', 'Дневник прогулок', 'Ответы и фото детей с прогулок', () => go(walkDiary)),
      menuItem('⚙️', 'Настройки', 'Длина занятия, код родителя', () => go(settingsScreen)),
      menuItem('❓', 'Как пользоваться', 'Коротко о приложении', () => go(helpScreen)),
      menuItem('©', 'О приложении', 'Авторы и условия использования', () => go(aboutScreen))),
  ];
}
const menuItem = (ico, t, sub, fn) => h('button.menu-item', { onclick: fn }, h('div.ico', ico), h('div', h('div.name', t), h('div.small', sub)), h('div.chev', '›'));

function days7(c) {
  const out = { min: 0, n: 0, ok: 0, days: [] };
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const r = c.days[k] || { sec: 0, n: 0, ok: 0 };
    out.min += Math.round(r.sec / 60); out.n += r.n; out.ok += r.ok;
    out.days.push({ label: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()], min: Math.round(r.sec / 60), n: r.n, ok: r.ok, today: k === today() });
  }
  return out;
}

/* ================= СТАТИСТИКА РЕБЁНКА ================= */
function childStats(id) {
  const c = getChild(id); if (!c) { back(); return h('div'); }
  const wk = days7(c);
  const maxN = Math.max(5, ...wk.days.map(d => d.n));
  const chart = h('div.week-chart');
  wk.days.forEach(d => chart.append(h('div.wc-col' + (d.today ? '.is-today' : ''),
    h('div.wc-val', d.n ? String(d.n) : ''),
    h('div.wc-bar', { style: { height: (d.n / maxN * 100) + '%' } }, h('div.wc-ok', { style: { height: (d.n ? d.ok / d.n * 100 : 0) + '%' } })),
    h('div.wc-lab', d.label))));
  const totalN = Object.values(c.skills).reduce((a, s) => a + s.n, 0), totalOk = Object.values(c.skills).reduce((a, s) => a + s.ok, 0);

  const weak = weakList(c).slice(0, 4);
  const weakBox = weak.length ? h('div.weak-list', weak.map(w => h('div.weak', h('div.ico', SKILL[w.id].icon), h('div', h('div.name', SKILL[w.id].title + ' · ' + SECTIONS[SKILL[w.id].sec].title), h('div.small', `верно ${Math.round(w.acc * 100)}% из ${w.n} · уровень ${w.lvl} из ${SKILL[w.id].levels}`)))))
    : h('p.muted', totalN < 15 ? 'Пока мало ответов, чтобы делать выводы. Нужно хотя бы несколько занятий.' : 'Явных трудностей нет — всё идёт хорошо! 👍');

  // по разделам
  const secRows = h('div.sec-table');
  Object.keys(SECTIONS).filter(s => s !== 'walk').forEach(s => {
    const list = available(c, s); let n = 0, ok = 0; list.forEach(k => { const st = c.skills[k.id]; if (st) { n += st.n; ok += st.ok; } });
    if (!list.length) return;
    const acc = n ? ok / n : null;
    secRows.append(h('div.sec-row', h('div.ico', SECTIONS[s].icon), h('div.name', SECTIONS[s].title), h('div.bar', h('i', { style: { width: (acc == null ? 0 : acc * 100) + '%', background: acc == null ? '' : acc > 0.8 ? '#3FA66B' : acc > 0.6 ? '#F2B53C' : '#E05A4E' } })), h('div.pct', acc == null ? '—' : Math.round(acc * 100) + '%'), h('div.small', n ? `${n}` : '')));
  });
  // уровни
  const lv = h('div.levels');
  available(c).forEach(s => { const st = c.skills[s.id]; lv.append(h('div.lv', h('span', s.icon + ' ' + s.title), h('span.lvdots', Array.from({ length: s.levels }, (_, i) => h('i' + (st && i < st.lvl ? '.on' : ''))) ), h('span.small', st ? `${Math.round(st.ok / Math.max(1, st.n) * 100)}% · ${st.n}` : 'ещё не было'))); });
  // логопед
  const exDone = EXERCISES.filter(e => c.speech['ex:' + e.id]).map(e => `${e.name} — ${c.speech['ex:' + e.id]}`);
  const sndDone = SOUNDS.filter(s => c.speech['snd:' + s.id]).map(s => `${s.id} — ${c.speech['snd:' + s.id]}`);
  const walksDone = Object.keys(c.walks).length;

  return [
    header(c.name, { right: h('button.btn.ghost.sm', { onclick: () => go(childForm, c, () => back()) }, '✏️ Профиль') }),
    h('div.kpis', kpi(wk.min + ' мин', 'занимался за неделю'.replace('занимался', c.gender === 'f' ? 'занималась' : 'занимался')), kpi(String(wk.n), 'заданий за неделю'), kpi(totalN ? Math.round(totalOk / totalN * 100) + '%' : '—', 'верно с первого раза'), kpi('⭐ ' + c.stars, 'звёздочек всего')),
    h('div.panel', h('h2', 'Неделя'), chart, h('p.muted.small', 'Высота — сколько заданий, зелёная часть — сколько верно с первого раза.')),
    h('div.panel', h('h2', 'На что обратить внимание'), weakBox, weak.length ? h('p.muted.small', 'Приложение уже даёт эти задания чаще. Можно ещё отметить раздел в профиле как «упор» или позаниматься вместе.') : null),
    h('div.panel', h('h2', '🔁 Повторение'), (() => { const now = Date.now(); const due = dueCount(c); const items = Object.values(c.redo || {}).reduce((a, l) => a + l.length, 0); const soon = Object.values(c.redo || {}).reduce((a, l) => a + l.filter(r => now >= r.t).length, 0); return h('p', items ? `Вопросов, в которых были ошибки и которые вернутся для повторения: ${items}. Из них пора повторить сегодня: ${soon}. Тем на повторении: ${due}.` : 'Ошибочных вопросов на повторении пока нет.'); })(), h('p.muted.small', 'Вопрос, в котором ребёнок ошибся, возвращается через 1 день, потом через 3 и через 7 дней. Если на повторении отвечает верно — вопрос уходит.')),
    h('div.panel', h('h2', 'По разделам'), secRows),
    h('div.panel', h('h2', 'Логопед'), h('p', exDone.length ? 'Упражнения: ' + exDone.join(', ') : 'Упражнения ещё не делали'), h('p', sndDone.length ? 'Звуки (повторений): ' + sndDone.join(', ') : 'Звуки ещё не тренировали'), h('p', 'Записей своего голоса: ' + (c.speech.rec || 0))),
    h('div.panel', h('h2', 'Прогулки'), h('p', walksDone ? `Выполнено заданий: ${walksDone}` : 'Заданий на прогулке ещё не было'), walksDone ? h('button.btn.ghost', { onclick: () => go(walkDiary, c.id) }, 'Открыть дневник') : null),
    h('details.panel', h('summary', h('b', 'Уровни по каждой теме')), lv),
    h('div.panel.danger-zone',
      h('button.btn.ghost', { onclick: async () => { if (await confirmBox(`Сбросить прогресс ${c.name}? Звёзды, уровни и статистика обнулятся. Профиль останется.`, 'Сбросить')) { c.skills = {}; c.days = {}; c.stars = 0; c.items = []; c.speech = {}; c.walks = {}; save(true); refresh(); } } }, 'Сбросить прогресс'),
      h('button.btn.danger', { onclick: async () => { if (await confirmBox(`Удалить профиль «${c.name}» насовсем?`, 'Удалить')) { DB.children = DB.children.filter(x => x.id !== c.id); save(true); back(); } } }, 'Удалить профиль')),
  ];
}
const kpi = (v, l) => h('div.kpi', h('div.v', v), h('div.l', l));

/* ================= МОЙ ГОЛОС ================= */
function recordingsScreen() {
  const names = DB.children.flatMap(c => [`Привет, ${c.name}!`, `Молодец, ${c.name}!`, c.gender === 'f' ? `Умница, ${c.name}!` : `Так держать, ${c.name}!`]);
  const praise = [...new Set(DB.children.length ? DB.children.flatMap(c => praiseFor(c)) : praiseFor({ gender: 'm' }))];
  const prompts = [...new Set(SKILLS.flatMap(s => s.prompts || []))];
  const groups = [
    ['Приветствие и имя', names],
    ['Похвала', praise],
    ['Подсказки', [...TRY_AGAIN, 'Посмотри правильный ответ']],
    ['Задания', prompts],
  ];
  const R = new Recorder(); let active = null;
  onLeave(() => R.cancel());
  const row = phrase => {
    const st = h('span.rec-state', hasRec(phrase) ? '● записано' : '');
    const recB = h('button.icon-btn.rec', { 'aria-label': 'Записать' }, '🎙');
    recB.onclick = async () => {
      if (active && active !== recB) return toast('Сначала остановите другую запись');
      if (!active) { if (!(await ensurePermission('mic'))) return; try { await R.start(); active = recB; recB.classList.add('on'); recB.textContent = '■'; st.textContent = 'говорите…'; } catch (e) { if (e && e.name === 'NotAllowedError') showHelp('mic'); else toast('Микрофон недоступен'); } }
      else { const b = await R.stop(); active = null; recB.classList.remove('on'); recB.textContent = '🎙'; if (b) { await saveRec(phrase, b); st.textContent = '● записано'; toast('Записано'); playRecording(phrase); } else st.textContent = hasRec(phrase) ? '● записано' : 'не записалось'; }
    };
    return h('div.rec-row', h('div.phrase', phrase, st),
      h('button.icon-btn', { onclick: () => hasRec(phrase) ? playRecording(phrase) : say(phrase), 'aria-label': 'Послушать' }, '▶'), recB,
      h('button.icon-btn', { onclick: async () => { if (hasRec(phrase)) { await delRec(phrase); st.textContent = ''; toast('Удалено — будет голос устройства'); } }, 'aria-label': 'Удалить' }, '🗑'));
  };
  return [header('🎙 Мой голос'),
    h('div.panel', h('p', 'Нажмите 🎙, скажите фразу и нажмите ■. Дальше приложение будет говорить эту фразу вашим голосом. Записи хранятся только на этом устройстве.'), h('p.muted.small', `Записано фраз: ${recCount()}. Говорите в тихой комнате, держите телефон на расстоянии ладони.`)),
    ...groups.map(([t, list]) => h('details.panel', { open: t === 'Приветствие и имя' ? true : null }, h('summary', h('b', t), h('span.muted', ` · ${list.length}`)), h('div.rec-list', list.map(row))))];
}

/* ================= ГОЛОС УСТРОЙСТВА ================= */
function voiceScreen() {
  refreshVoices();
  const rv = ruVoices(), ev = enVoices();
  const sel = h('select.text-input', { onchange: () => { DB.settings.voiceName = sel.value; save(); refreshVoices(); say('Привет! Я буду читать задания этим голосом.'); } },
    rv.length ? rv.map(v => h('option', { value: v.name, selected: currentVoice() && currentVoice().name === v.name ? true : null }, v.name)) : h('option', 'Русские голоса не найдены'));
  const esel = h('select.text-input', { onchange: () => { DB.settings.enVoiceName = esel.value; save(); refreshVoices(); say([{ en: 'Hello! I will read English words.' }]); } },
    ev.length ? ev.map(v => h('option', { value: v.name, selected: DB.settings.enVoiceName === v.name ? true : null }, v.name)) : h('option', 'Английские голоса не найдены'));
  const rate = h('input', { type: 'range', min: 0.6, max: 1.3, step: 0.05, value: DB.settings.rate, oninput: () => { DB.settings.rate = +rate.value; rl.textContent = rateLabel(); save(); }, onchange: () => say('Вот так я буду говорить') });
  const rateLabel = () => DB.settings.rate < 0.85 ? 'медленно' : DB.settings.rate > 1.1 ? 'быстро' : 'обычно';
  const rl = h('span.muted', rateLabel());
  return [header('🔊 Голос'),
    h('div.panel', h('label.lbl', 'Русский голос'), sel, h('label.lbl', 'Скорость: ', rl), rate, h('button.btn.ghost', { onclick: () => say('Сколько здесь яблок? Молодец, правильно!') }, '▶ Проверить')),
    h('div.panel', h('label.lbl', 'Английский голос'), esel),
    h('div.panel', h('h2', 'Как сделать голос живее'),
      h('p', h('b', 'Компьютер: '), 'откройте приложение в браузере Microsoft Edge — там есть естественные голоса «Microsoft Svetlana Online (Natural)» и «Dmitry Online (Natural)». Это лучший бесплатный вариант.'),
      h('p', h('b', 'iPhone и iPad: '), 'Настройки → Универсальный доступ → Устный контент → Голоса → Русский → скачайте «Милена (улучшенная)». Потом выберите её здесь.'),
      h('p', h('b', 'Android: '), 'Настройки → Специальные возможности → Синтез речи → Синтезатор Google → Установить голосовые данные → Русский. Можно поставить «Яндекс» или другой синтезатор речи.'),
      h('p', h('b', 'Лучше всего — ваш голос. '), 'В разделе «Мой голос» запишите похвалу и задания: детям роднее слышать маму или папу.'))];
}

/* ================= ДНЕВНИК ПРОГУЛОК ================= */
function walkDiary(onlyId) {
  const box = h('div');
  const kids = onlyId ? [getChild(onlyId)] : DB.children;
  kids.forEach(c => {
    const done = WALKS.filter(w => c.walks[w[0]]);
    const p = h('div.panel', h('h2', avatarEl(c, 34), ' ', c.name));
    places().forEach(pl => { const d = c.walks['place:' + pl.id]; if (d) p.append(h('div.diary', h('div.ico', '📍'), h('div', h('div.name', 'Дошёл до места: '.replace('Дошёл', c.gender === 'f' ? 'Дошла' : 'Дошёл') + pl.name + ' · ' + d.date.split('-').reverse().join('.')), h('div.small.muted', d.answer === 'GPS' ? 'проверено по GPS' : 'подтвердил взрослый')))); });
    if (!done.length && !places().some(pl => c.walks['place:' + pl.id])) p.append(h('p.muted', 'Пока нет выполненных заданий'));
    done.forEach(w => {
      const d = c.walks[w[0]]; const img = h('img.diary-photo', { style: { display: 'none' } });
      if (d.photo) blobGet(`walk:${c.id}:${w[0]}`).then(b => { if (b) { img.src = URL.createObjectURL(b); img.style.display = 'block'; } });
      p.append(h('div.diary', h('div.ico', w[1]), h('div', h('div.name', w[2] + ' · ' + d.date.split('-').reverse().join('.')), d.answer ? h('div', '«' + d.answer + '»') : null, img)));
    });
    box.append(p);
  });
  return [header('🧭 Дневник прогулок'), box];
}

/* ================= НАСТРОЙКИ ================= */
function settingsScreen() {
  const lens = h('div.choice-row');
  [6, 8, 10, 12, 15].forEach(n => lens.append(h('button.choice' + (DB.settings.lessonLen === n ? '.on' : ''), { onclick: () => { DB.settings.lessonLen = n; save(); refresh(); } }, String(n))));
  return [header('⚙️ Настройки'),
    h('div.panel', h('label.lbl', 'Заданий в одном занятии'), lens, h('p.muted.small', 'Для малышей 3–5 лет лучше 6–8 заданий, для школьников — 10–15.')),
    h('div.panel', h('label.lbl', 'Код родителя'), h('p', DB.pin ? 'Код задан.' : 'Сейчас вход по примеру на умножение.'), h('button.btn', { onclick: () => go(pinScreen) }, DB.pin ? 'Изменить код' : 'Задать код')),
    h('div.panel', h('label.lbl', 'Данные'), h('p.muted.small', 'Всё хранится только в этом браузере на этом устройстве. Если очистить данные браузера — прогресс пропадёт.'),
      h('button.btn.ghost', { onclick: () => { const blob = new Blob([JSON.stringify(DB)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'stupenki-' + today() + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '💾 Сохранить копию прогресса'),
      h('label.btn.ghost', '📂 Восстановить из копии', h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: async e => { try { const d = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(d.children)) throw 0; if (await confirmBox('Заменить текущие данные данными из копии?', 'Заменить')) { Object.keys(DB).forEach(k => delete DB[k]); Object.assign(DB, d); save(true); location.reload(); } } catch (err) { toast('Это не файл копии «Ступенек»'); } } })))];
}

function helpScreen() {
  const p = t => h('p', t);
  return [header('❓ Как пользоваться'),
    h('div.panel.help',
      h('h2', 'Каждый день'), p('Ребёнок нажимает на своё имя и выбирает «Занятие на сегодня» — это 10 заданий из разных разделов. Можно открыть и отдельный раздел.'),
      h('h2', 'Как подстраивается'), p('5 верных ответов подряд — уровень темы растёт. 3 ошибки из 4 — уровень снижается. Темы, где больше ошибок, и разделы с «упором» встречаются чаще.'),
      h('h2', 'Ошибки и повторение'), p('После первой ошибки ребёнок пробует ещё раз. После второй — видит правильный ответ и объяснение. В статистику идёт только первая попытка. Вопросы с ошибками возвращаются через 1, 3 и 7 дней, а новые вопросы показываются раньше уже знакомых.'),
      h('h2', 'Мои места'), p('В разделе «Мои места» отметьте дом, школу, храм, парк — встаньте у места и нажмите «Запомнить точку». У детей появятся задания «Дойди до…» с проверкой по GPS и вопросы про адреса. Координаты хранятся только на этом устройстве. Без GPS дошедшего подтверждает взрослый.'),
      h('h2', 'Логопед'), p('Зарядку для язычка лучше делать каждый день по 3–5 минут перед зеркалом (кнопка «Зеркало» включает камеру). Звуки ставим по порядку: сначала свистящие (С, З, Ц), потом шипящие (Ш, Ж, Ч, Щ), потом Л и Р. Приложение не заменяет логопеда.'),
      h('h2', 'Прогулка ★'), p('Задания на улицу меняются по временам года. Выполняйте их вместе. Фото и ответы сохраняются в дневнике прогулок.'),
      h('h2', 'Установить как приложение'), p('На телефоне: меню браузера → «Добавить на главный экран» (на iPhone: кнопка «Поделиться» → «На экран Домой»). После первого открытия всё работает без интернета.'))];
}
void stop; void effG; void accuracy; void themeOf; void blobDel; void app;

export function aboutScreen() {
  return [header('О приложении'),
    h('div.panel.about', h('div.logo-big', stairs()), h('h2.center', 'Ступеньки'),
      h('p.center', 'Семейное обучающее приложение для детей от 3 лет до 6 класса'),
      h('p.center.big-text', '© 2026 Павел Зайцев'),
      h('p.center', 'Авторы: Павел Зайцев и Claude (ИИ-ассистент Anthropic)')),
    h('div.panel', h('h2', 'Условия использования'),
      h('p', 'Приложение бесплатное и распространяется по лицензии Creative Commons CC BY-NC-ND 4.0.'),
      h('p', h('b', 'Можно: '), 'пользоваться дома, в школе, в садике, в воскресной школе; делиться ссылкой; распространять точную копию с указанием авторов.'),
      h('p', h('b', 'Нельзя: '), 'продавать приложение или его части, брать плату за доступ, встраивать в платные продукты, выдавать за свою разработку, убирать сведения об авторах, распространять переделанные версии.'),
      h('p.muted.small', 'Полный текст — в файле LICENSE в репозитории github.com/Pasha-31011993-Zajtsev/stupenki. Шрифт Nunito — SIL Open Font License 1.1.')),
    h('div.panel', h('h2', 'Ваши данные'), h('p', 'Приложение ничего не отправляет в интернет. Профили, прогресс, фото, записи голоса, адреса и координаты мест хранятся только на этом устройстве. Доступ к местоположению, микрофону и камере запрашивается только для конкретных заданий и только с вашего согласия.'))];
}

function stairs() {
  return h('div', { html: `<svg viewBox="0 0 120 100" width="120" height="100"><g fill="none" stroke-linejoin="round">
    <path d="M10 90 H40 V66 H64 V42 H88 V18 H112" stroke="#2D7DD2" stroke-width="9" stroke-linecap="round"/>
    </g><text x="96" y="12" font-size="20">⭐</text><text x="18" y="84" font-size="22">🧒</text></svg>` });
}
export { stairs };
