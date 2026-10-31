// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Объяснение перед запросом доступа к местоположению, микрофону и камере.
import { h, modal } from './ui.js';
import { DB, save } from './store.js';

const INFO = {
  geo: {
    icon: '📍', title: 'Доступ к местоположению',
    why: 'Нужен для заданий на прогулке: чтобы проверить, что вы дошли до выбранного места (школы, храма, парка), и подсказать, в какой оно стороне.',
    privacy: 'Местоположение определяется только в момент проверки, хранится только на этом устройстве и никуда не отправляется.',
    without: 'Можно не разрешать — тогда то, что ребёнок дошёл, подтверждает взрослый.',
    help: 'Доступ к местоположению сейчас запрещён в настройках браузера. Чтобы включить: нажмите на значок замка или «ⓘ» рядом с адресом сайта → «Разрешения» или «Настройки сайта» → «Местоположение» → «Разрешить». На iPhone: Настройки → Конфиденциальность → Службы геолокации → Safari (или ваш браузер) → «При использовании».',
    query: 'geolocation',
  },
  mic: {
    icon: '🎙', title: 'Доступ к микрофону',
    why: 'Нужен, чтобы записать голос: ребёнок слушает себя и сравнивает с образцом, а родитель может озвучить похвалу и задания своим голосом.',
    privacy: 'Записи хранятся только на этом устройстве и никуда не отправляются. Микрофон работает, только пока идёт запись.',
    without: 'Можно не разрешать — всё остальное работает, просто без записи голоса.',
    help: 'Доступ к микрофону сейчас запрещён в настройках браузера. Чтобы включить: нажмите на значок замка или «ⓘ» рядом с адресом сайта → «Разрешения» → «Микрофон» → «Разрешить». На iPhone: Настройки → Safari (или ваш браузер) → Микрофон → «Разрешить».',
    query: 'microphone',
  },
  cam: {
    icon: '🪞', title: 'Доступ к камере',
    why: 'Нужен для «Зеркала» у логопеда: ребёнок видит свой ротик рядом с рисунком и повторяет упражнение.',
    privacy: 'Изображение с камеры только показывается на экране — оно не записывается, не сохраняется и никуда не отправляется.',
    without: 'Можно не разрешать — тогда используйте обычное зеркало.',
    help: 'Доступ к камере сейчас запрещён в настройках браузера. Чтобы включить: нажмите на значок замка или «ⓘ» рядом с адресом сайта → «Разрешения» → «Камера» → «Разрешить». На iPhone: Настройки → Safari (или ваш браузер) → Камера → «Разрешить».',
    query: 'camera',
  },
};

async function state(kind) {
  try { if (navigator.permissions && navigator.permissions.query) return (await navigator.permissions.query({ name: INFO[kind].query })).state; } catch (e) {}
  return 'prompt';
}

/** Показывает объяснение и возвращает true, если можно запрашивать доступ у браузера */
export async function ensurePermission(kind) {
  const i = INFO[kind]; const st = await state(kind);
  if (st === 'granted') return true;
  if (st === 'denied') { showHelp(kind); return false; }
  const asked = DB.settings.permOk || (DB.settings.permOk = {});
  if (asked[kind]) return true; // уже объясняли и родитель согласился — сразу системный запрос
  return new Promise(resolve => {
    const m = modal([
      h('div.perm-ico', i.icon), h('h2', i.title),
      h('p.perm-why', i.why), h('p.perm-small', '🔒 ' + i.privacy), h('p.perm-small', i.without),
      h('div.col',
        h('button.btn.big.good', { onclick: () => { asked[kind] = true; save(); m.close(); resolve(true); } }, 'Разрешить'),
        h('button.btn.ghost', { onclick: () => { m.close(); resolve(false); } }, 'Не сейчас')),
      h('p.perm-small.muted', 'После нажатия «Разрешить» браузер спросит ещё раз — подтвердите там.'),
    ], { onClose: () => resolve(false) });
  });
}

export function showHelp(kind) {
  const i = INFO[kind];
  const m = modal([h('div.perm-ico', i.icon), h('h2', i.title), h('p', i.help), h('p.perm-small', i.without), h('button.btn', { onclick: () => m.close() }, 'Понятно')]);
}
