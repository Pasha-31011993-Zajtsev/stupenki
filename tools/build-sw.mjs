// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Собирает sw.js со списком всех файлов приложения (запускать перед публикацией: node tools/build-sw.mjs)
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const list = ['./', 'index.html', 'manifest.json', 'LICENSE'];
const walk = d => fs.readdirSync(path.join(root, d)).forEach(f => { const p = path.join(d, f); if (fs.statSync(path.join(root, p)).isDirectory()) walk(p); else list.push(p.split(path.sep).join('/')); });
['css', 'js', 'fonts', 'icons'].forEach(walk);
const hash = crypto.createHash('sha1'); list.slice(1).forEach(f => hash.update(fs.readFileSync(path.join(root, f))));
const ver = hash.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(root, 'sw.js'), `// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0
// Офлайн-режим: после первого открытия всё приложение хранится на устройстве.
const CACHE = 'stupenki-${ver}';
const FILES = ${JSON.stringify(list, null, 0)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Сначала сохранённая копия (быстро и без интернета), а обновления подтягиваются при следующей версии.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(m => m || fetch(e.request).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match('./index.html'))));
});
`);
console.log('sw.js', ver, list.length, 'files');
