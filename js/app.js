// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Ступеньки — главный модуль
import { DB, save, getChild, dayRec, blobPut, blobGet } from './store.js';
import { h, $, toast, confetti, pick, modal, avatarEl, ageText, wait, resizeImage, dataURLtoBlob } from './ui.js';
import { app, go, reset, back, header, onLeave, refresh } from './nav.js';
import { say, chime, loadRecKeys, stop } from './voice.js';
import { THEMES, themeOf, applyTheme, praiseFor, TRY_AGAIN } from './themes.js';
import { SECTIONS, SKILL, sectionsFor, secTitle, planMixed, planSection, genTask, record, effG, available, isPre } from './engine.js';
import { speechHome } from './logoped.js';
import { walksFor } from './walks.js';
import { parentGate, parentHome, childForm, setupScreen, setFamily, stairs } from './parent.js';
import './skills/math.js';
import './skills/russian.js';
import './skills/logic.js';
import './skills/world.js';
import './skills/english.js';
import './skills/faith.js';

/* ================= СЕМЬЯ ================= */
export function familyScreen() {
  app.child = null; applyTheme(null);
  const grid = h('div.family-grid');
  DB.children.forEach(c => grid.append(h('button.kid-card', { style: { '--kc': themeOf(c).accent }, onclick: () => openChild(c.id) },
    avatarEl(c, 96), h('div.kid-name', c.name), h('div.kid-sub', c.grade > 0 ? `${c.grade} класс` : ageText(c.age)), h('div.kid-stars', '⭐ ' + c.stars))));
  return [
    h('div.family-head', h('div.logo', stairs()), h('h1', 'Ступеньки'), h('p.muted', 'Кто сегодня занимается?')),
    grid,
    h('button.parent-link', { onclick: () => parentGate(parentHome) }, '🔒 Для родителей'),
    h('p.copyright', '© 2026 Павел Зайцев и Claude. Бесплатно, не для продажи'),
  ];
}
function openChild(id) {
  app.child = getChild(id); applyTheme(app.child);
  go(childHome);
}

/* ================= ДОМ РЕБЁНКА ================= */
export function childHome() {
  const c = app.child; const t = themeOf(c);
  const secs = sectionsFor(c).filter(s => s !== 'walk' && s !== 'speech');
  const grid = h('div.sections');
  const pre = isPre(c);
  const order = pre ? ['speech', ...secs] : [...secs, 'speech'];
  order.forEach(s => {
    const S = SECTIONS[s]; const focus = c.focus.includes(s);
    grid.append(h('button.section', { style: { '--sc': S.color }, onclick: () => s === 'speech' ? go(speechHome) : go(lessonScreen, s) },
      h('div.ico', S.icon), h('div.name', secTitle(s, c)), focus ? h('div.focus-badge', '★ упор') : null));
  });
  const walks = walksFor(effG(c)); const doneW = walks.filter(w => c.walks[w[0]]).length;
  setTimeout(() => say(`Привет, ${c.name}!`), 250);
  return [
    h('div.topbar', h('button.round-btn', { onclick: () => reset(familyScreen), 'aria-label': 'Сменить' }, '👪'),
      h('div.hello', avatarEl(c, 46), h('span', 'Привет, ' + c.name + '!')),
      h('button.stars-pill', { onclick: () => go(albumScreen) }, '⭐ ' + c.stars)),
    h('button.today', { onclick: () => go(lessonScreen, null) },
      h('div.today-ico', t.hero), h('div', h('div.today-title', 'Занятие на сегодня'), h('div.today-sub', `${DB.settings.lessonLen} заданий из разных разделов`)), h('div.today-go', '▶')),
    grid,
    h('div.row2',
      h('button.wide-card.walk', { onclick: () => go(walkScreen) }, h('div.ico', '🧭'), h('div', h('div.name', 'Прогулка ★'), h('div.small', `Задания на улице · ${doneW} из ${walks.length}`))),
      h('button.wide-card.album', { onclick: () => go(albumScreen) }, h('div.ico', t.hero), h('div', h('div.name', 'Мои ' + (t.rewardWord === 'друг' ? 'друзья' : 'награды')), h('div.small', `${c.items.length} из ${t.items.length}`)))),
  ];
}

/* ================= ЗАНЯТИЕ ================= */
export function lessonScreen(sec) {
  const c = app.child; const t = themeOf(c); const N = DB.settings.lessonLen;
  let plan = sec ? planSection(c, sec, N) : planMixed(c, N);
  if (window.__forceSkill) plan = Array(N).fill(window.__forceSkill); // для автоматических проверок
  if (!plan.length) { toast('Здесь пока нет заданий для этого возраста'); setTimeout(back, 50); return h('div'); }
  let idx = 0, good = 0; const starsBefore = c.stars; let taskStart = Date.now();
  const reader = c.grade > 0 || c.age >= 7;
  const steps = h('div.steps-bar');
  const area = h('div.task-area');
  const addTime = () => { const s = Math.min(120, (Date.now() - taskStart) / 1000); dayRec(c).sec += s; taskStart = Date.now(); save(); };
  onLeave(addTime);
  const drawSteps = () => { steps.innerHTML = ''; const n = plan.length; plan.forEach((_, i) => steps.append(h('span' + (i < idx ? '.on' : i === idx ? '.cur' : ''), { style: { height: (22 + (n > 1 ? i / (n - 1) : 1) * 52) + '%' }, 'data-h': t.step }))); if (idx >= n) steps.append(h('span.cur', { style: { height: '78%' }, 'data-h': '🏁' })); };

  function next() {
    addTime();
    if (idx >= plan.length) { finish(); return; }
    drawSteps();
    const task = genTask(c, plan[idx]);
    if (!task) { idx++; next(); return; }
    showTask(task);
  }

  function showTask(task) {
    area.innerHTML = '';
    let attempts = 0, recorded = false, finished = false;
    const qEl = h('div.prompt', task.q);
    const speakTask = () => say(task.say || task.q);
    const card = h('div.task' + (task.long ? '.long' : ''));
    card.append(h('div.prompt-row', h('button.speak-btn', { onclick: speakTask, 'aria-label': 'Послушать' }, '🔊'), qEl));
    if (task.stage) card.append(h('div.stage', { html: task.stage }));
    const fb = h('div.feedback');
    const rec = ok => { if (!recorded) { recorded = true; if (ok) good++; const ch = record(c, task.skill, ok); if (ch === 'up') setTimeout(() => toast('🎉 Новый уровень: ' + SKILL[task.skill].title), 900); } };
    const success = async () => {
      if (finished) return; finished = true; rec(true); chime('good');
      const sEl = document.getElementById('starsNow'); if (sEl) { sEl.textContent = String(c.stars); sEl.parentElement.classList.remove('bump'); void sEl.offsetWidth; sEl.parentElement.classList.add('bump'); }
      const pr = pick(praiseFor(c));
      fb.className = 'feedback good'; fb.textContent = pr;
      const segs = []; if (task.sayAfter) segs.push(task.sayAfter); segs.push(pr);
      if (task.speakEn) await say([{ en: task.speakEn }]);
      await Promise.race([say(segs), wait(2600)]);
      await wait(300); idx++; next();
    };
    const showAnswer = (explain, reveal) => {
      finished = true; reveal && reveal();
      fb.className = 'feedback info'; fb.innerHTML = '';
      fb.append(h('div', '💡 ' + (explain || 'Посмотри правильный ответ')), h('button.btn.big', { onclick: () => { idx++; next(); } }, 'Дальше →'));
      say(explain || '');
    };
    const wrong = (explain, reveal) => {
      attempts++; rec(false); chime('bad');
      if (attempts >= 2) showAnswer(explain, reveal);
      else { const m = pick(TRY_AGAIN); fb.className = 'feedback bad'; fb.textContent = m + ' 🙂'; say(m); }
    };
    if (task.custom) {
      const box = h('div.custom');
      card.append(box);
      task.custom(box, {
        done: (ok, explain) => ok ? success() : wrong(explain),
        miss: (explain, reveal) => wrong(explain, reveal),
        setQ: (text, s) => { qEl.textContent = text; task.say = s || text; task.q = text; speakTask(); },
        child: c,
      });
    } else {
      const n = task.cols || (task.choices.length === 3 ? 3 : 2);
      const box = h('div.options' + (task.big ? '.big' : '') + (task.mid ? '.mid' : '') + (task.tall ? '.tall' : ''), { style: { gridTemplateColumns: `repeat(${n}, 1fr)` } });
      task.choices.forEach(o => {
        const b = h('button.opt', { html: o.label, onclick: () => {
          if (finished || b.classList.contains('bad')) return;
          if (String(o.v) === String(task.answer)) { b.classList.add('ok'); success(); }
          else { b.classList.add('bad'); wrong(task.explain, () => { [...box.children].forEach((x, i) => { if (String(task.choices[i].v) === String(task.answer)) x.classList.add('ok'); }); }); }
        } });
        const plain = String(o.label).replace(/<[^>]+>/g, '').trim();
        const hasHtml = /<(svg|span|div)/.test(String(o.label));
        if (!hasHtml && plain.length > 9) b.classList.add('textopt');
        else if (!hasHtml && plain.length > 4 && /[а-яёa-z]/i.test(plain)) b.classList.add('midopt');
        if (!reader && !hasHtml && /[а-яё]{2,}/i.test(plain)) {
          b.append(h('span.opt-say', { role: 'button', 'aria-label': 'Послушать вариант', onclick: e => { e.stopPropagation(); say(plain.replace(/[👍👎]/g, '')); } }, '🔊'));
          b.classList.add('has-say');
        }
        box.append(b);
      });
      card.append(box);
    }
    card.append(fb);
    area.append(card);
    taskStart = Date.now();
    setTimeout(speakTask, 250);
  }

  function finish() {
    const c2 = app.child; const earned = c2.stars - starsBefore;
    const left = t.items.filter(([e]) => !c2.items.includes(e));
    let prize = null;
    if (good >= Math.ceil(plan.length / 2) && left.length) { prize = left[0]; c2.items.push(prize[0]); }
    save(true); chime('win'); confetti([t.step, '⭐', '✨']);
    area.innerHTML = ''; steps.innerHTML = '';
    const f = c2.gender === 'f';
    area.append(h('div.finish',
      h('div.finish-ico', prize ? prize[0] : t.hero),
      h('h2', t.finish),
      h('p.big-text', `Правильно с первого раза: ${good} из ${plan.length}. Звёздочек: +${earned} ⭐`),
      prize ? h('p.big-text', `Новый ${t.rewardWord === 'награда' || t.rewardWord === 'сокровище' || t.rewardWord === 'чудо' ? 'подарок' : t.rewardWord}: ${prize[1]}!`) : (left.length ? h('p.muted', 'Чтобы получить награду, нужно ответить правильно хотя бы на половину') : h('p.muted', (f ? 'Ты собрала' : 'Ты собрал') + ' всю коллекцию! 🏆')),
      h('div.row.center.wrap', h('button.btn.big', { onclick: () => { reset(familyScreen); openChild(c2.id); } }, '🏠 Домой'), h('button.btn.big.good', { onclick: () => go(lessonScreen, sec) }, '▶ Ещё'))));
    say([t.finish, prize ? `Твоя награда: ${prize[1]}` : '', pick(t.praise)]);
  }

  setTimeout(next, 0);
  return [
    h('div.topbar', h('button.round-btn', { onclick: back, 'aria-label': 'Назад' }, '←'), steps, h('div.stars-pill', '⭐ ', h('span#starsNow', String(c.stars)))),
    area,
  ];
}

/* ================= КОЛЛЕКЦИЯ ================= */
function albumScreen() {
  const c = app.child; const t = themeOf(c);
  const grid = h('div.album');
  t.items.forEach(([e, n]) => { const has = c.items.includes(e); grid.append(h('div.album-item' + (has ? '' : '.locked'), { onclick: () => has && say(n) }, h('div.ico', has ? e : '❔'), h('div.small', has ? n : '…'))); });
  return [header(`${t.hero} Коллекция: ${t.name}`, { right: h('div.stars-pill', '⭐ ' + c.stars) }), h('p.muted.center', 'За каждое занятие, где больше половины ответов верные, — новая награда'), grid];
}

/* ================= ПРОГУЛКА ================= */
function walkScreen() {
  const c = app.child; const list = walksFor(effG(c));
  const grid = h('div.walk-list');
  list.forEach(w => { const d = c.walks[w[0]]; grid.append(h('button.walk-item' + (d ? '.done' : ''), { onclick: () => go(walkTask, w) }, h('div.ico', w[1]), h('div.wbody', h('div.name', w[2]), h('div.small', '★'.repeat(w[8]) + (d ? ' · выполнено ' + d.date.slice(5).split('-').reverse().join('.') : ''))), h('div.check', d ? '✅' : '›'))); });
  setTimeout(() => say('Задания для прогулки. Выбери, что найдёшь сегодня!'), 250);
  return [header('🧭 Прогулка ★'), h('p.muted.center', 'Задания со звёздочкой — выполняй вместе со взрослым на улице. Подходят к сегодняшнему времени года.'), grid];
}
function walkTask(w) {
  const c = app.child; const prev = c.walks[w[0]];
  let photo = null;
  const img = h('img.walk-photo', { style: { display: 'none' } });
  if (prev && prev.photo) blobGet(`walk:${c.id}:${w[0]}`).then(b => { if (b) { img.src = URL.createObjectURL(b); img.style.display = 'block'; } });
  const file = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: { display: 'none' }, onchange: async () => { const f = file.files[0]; if (!f) return; photo = await resizeImage(f, 900, 0.8); img.src = photo; img.style.display = 'block'; } });
  const ans = w[7] === 'answer' ? h('textarea.answer', { placeholder: 'Напиши, что нашёл (можно попросить взрослого)', rows: 3 }) : null;
  if (ans && prev && prev.answer) ans.value = prev.answer;
  const doneBtn = h('button.btn.big.good', { onclick: async () => {
    if (photo) await blobPut(`walk:${c.id}:${w[0]}`, dataURLtoBlob(photo));
    const first = !c.walks[w[0]];
    c.walks[w[0]] = { date: new Date().toISOString().slice(0, 10), answer: ans ? ans.value.trim() : '', photo: !!photo || !!(prev && prev.photo) };
    if (first) c.stars += w[8] * 3;
    save(true); chime('win'); confetti(['⭐', w[1], '🌿']);
    say(first ? `Отлично! Плюс ${w[8] * 3} звёздочек!` : 'Записал!');
    setTimeout(back, 1600);
  } }, prev ? '💾 Сохранить' : (c.gender === 'f' ? '✅ Я нашла!' : '✅ Я нашёл!'));
  setTimeout(() => say([w[2], w[3]]), 250);
  return [
    header(w[1] + ' ' + w[2]),
    h('div.panel', h('p.big-text', w[3]), h('button.btn.ghost', { onclick: () => say([w[2], w[3]]) }, '🔊 Послушать'), h('div.stars-line', 'Награда: ' + '⭐'.repeat(w[8] * 3))),
    h('div.panel', ans, h('div.row.wrap', h('button.btn', { onclick: () => file.click() }, '📷 Сфотографировать'), file), img),
    h('div.center', doneBtn),
  ];
}

/* ================= СТАРТ ================= */
window.__lessonFn = lessonScreen;
window.__app = { go, lessonScreen, app };
export function start() {
  setFamily(familyScreen);
  loadRecKeys();
  if (!DB.setupDone || !DB.children.length) reset(setupScreen, () => reset(familyScreen));
  else reset(familyScreen);
}
start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
void $; void modal; void available; void refresh; void stop; void THEMES; void childForm;
