// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0
// Офлайн-режим: после первого открытия всё приложение хранится на устройстве.
const CACHE = 'stupenki-20c0dea5aa';
const FILES = ["./","index.html","manifest.json","LICENSE","css/app.css","js/app.js","js/data/english2.js","js/data/english2_b.js","js/data/english2_s.js","js/data/faith2.js","js/data/faith2_b.js","js/data/faith2_s.js","js/data/reading.js","js/data/reading_b.js","js/data/reading_s.js","js/data/russian2.js","js/data/russian2_b.js","js/data/russian2_s.js","js/data/world2.js","js/data/world2_b.js","js/data/world2_s.js","js/engine.js","js/logoped.js","js/mouth.js","js/nav.js","js/parent.js","js/perm.js","js/places.js","js/skills/common.js","js/skills/english.js","js/skills/extra.js","js/skills/faith.js","js/skills/logic.js","js/skills/math.js","js/skills/russian.js","js/skills/world.js","js/store.js","js/themes.js","js/ui.js","js/voice.js","js/walks.js","fonts/nunito-cyrillic-400-normal.woff2","fonts/nunito-cyrillic-600-normal.woff2","fonts/nunito-cyrillic-800-normal.woff2","fonts/nunito-cyrillic-900-normal.woff2","fonts/nunito-latin-400-normal.woff2","fonts/nunito-latin-600-normal.woff2","fonts/nunito-latin-800-normal.woff2","fonts/nunito-latin-900-normal.woff2","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Сначала сохранённая копия (быстро и без интернета), а обновления подтягиваются при следующей версии.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(m => m || fetch(e.request).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match('./index.html'))));
});
