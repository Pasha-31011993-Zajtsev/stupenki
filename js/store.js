// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Хранилище: всё лежит только на этом устройстве.
// localStorage — профили, прогресс, настройки; IndexedDB — записи голоса и фото прогулок.

const KEY = 'stupenki-v1';

const DEFAULT = {
  pin: null,              // код родителя (строка из 4 цифр) или null
  setupDone: false,
  children: [],           // профили
  settings: { voiceName: '', rate: 0.95, lessonLen: 10, enVoiceName: '' },
};

export let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch (e) {}
  return structuredClone(DEFAULT);
}

let saveTimer = null;
export function save(now) {
  clearTimeout(saveTimer);
  const doSave = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { console.warn('save failed', e); } };
  if (now) doSave(); else saveTimer = setTimeout(doSave, 150);
}
window.addEventListener('pagehide', () => save(true));

export function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }

export function newChild(data) {
  return Object.assign({
    id: uid(), name: '', gender: 'm', age: 5, grade: 0,
    avatar: '🦊', photo: null, theme: null,
    focus: [],              // id разделов, на которые сделать упор
    skills: {},             // id навыка -> {lvl, hist:[], n, ok, last}
    stars: 0, items: [],    // награды
    days: {},               // 'YYYY-MM-DD' -> {sec, n, ok}
    walks: {},              // id задания прогулки -> {date, answer, photo:bool}
    speech: {},             // логопед: упражнения/звуки -> счётчик
    created: Date.now(),
  }, data);
}

export function getChild(id) { return DB.children.find(c => c.id === id); }

export function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function dayRec(child) {
  const k = today();
  if (!child.days[k]) child.days[k] = { sec: 0, n: 0, ok: 0 };
  return child.days[k];
}

/* ---------- IndexedDB для бинарных данных ---------- */
let idbP = null;
function idb() {
  if (idbP) return idbP;
  idbP = new Promise((res, rej) => {
    const r = indexedDB.open('stupenki-media', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('blobs'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return idbP;
}
export async function blobPut(key, blob) {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(blob, key); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
export async function blobGet(key) {
  try {
    const db = await idb();
    return await new Promise((res) => { const t = db.transaction('blobs'); const q = t.objectStore('blobs').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); });
  } catch (e) { return null; }
}
export async function blobDel(key) {
  const db = await idb();
  return new Promise((res) => { const t = db.transaction('blobs', 'readwrite'); t.objectStore('blobs').delete(key); t.oncomplete = () => res(); t.onerror = () => res(); });
}
export async function blobKeys(prefix) {
  try {
    const db = await idb();
    return await new Promise((res) => { const t = db.transaction('blobs'); const q = t.objectStore('blobs').getAllKeys(); q.onsuccess = () => res((q.result || []).filter(k => String(k).startsWith(prefix))); q.onerror = () => res([]); });
  } catch (e) { return []; }
}

// Просим браузер не удалять данные при нехватке места
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
