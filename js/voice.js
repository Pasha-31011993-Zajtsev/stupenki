// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Озвучка: записи голоса родителей (если есть) → иначе голос устройства.
import { DB, blobGet, blobPut, blobDel, blobKeys } from './store.js';

export const norm = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]+/gi, ' ').replace(/\s+/g, ' ').trim();

let recKeys = new Set();
export async function loadRecKeys() {
  const keys = await blobKeys('rec:');
  recKeys = new Set(keys.map(k => k.slice(4)));
}
export const hasRec = phrase => recKeys.has(norm(phrase));
export async function saveRec(phrase, blob) { const k = norm(phrase); await blobPut('rec:' + k, blob); recKeys.add(k); }
export async function delRec(phrase) { const k = norm(phrase); await blobDel('rec:' + k); recKeys.delete(k); }
export async function getRec(phrase) { return blobGet('rec:' + norm(phrase)); }
export const recCount = () => recKeys.size;

/* ---------- звуковые эффекты ---------- */
let actx = null;
export function ctx() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state !== 'running') { try { actx.resume(); } catch (e) {} }
  return actx;
}
['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, () => { if (actx && actx.state !== 'running') { try { actx.resume(); } catch (e) {} } }, { passive: true }));

export function chime(kind) {
  const c = ctx(); if (!c) return;
  try {
    const now = c.currentTime;
    const note = (f, t0, dur, vol, type = 'triangle') => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t0); g.gain.exponentialRampToValueAtTime(vol, now + t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g); g.connect(c.destination); o.start(now + t0); o.stop(now + t0 + dur + 0.05);
    };
    if (kind === 'good') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.08, i === 3 ? 0.5 : 0.22, i === 3 ? 0.28 : 0.2));
    else if (kind === 'bad') { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(260, now); o.frequency.exponentialRampToValueAtTime(150, now + 0.35); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.16, now + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45); o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + 0.5); }
    else if (kind === 'win') [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => note(f, i * 0.11, 0.35, 0.2));
    else if (kind === 'tap') note(880, 0, 0.08, 0.08, 'sine');
    else if (kind === 'click') { // цоканье «лошадки»
      const b = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.006));
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = 0.9;
      s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    }
  } catch (e) {}
}

/* ---------- голос устройства ---------- */
let voices = [], ruVoice = null, enVoice = null;
const score = v => {
  const n = v.name.toLowerCase(); let s = 0;
  if (/natural|neural|online/.test(n)) s += 50;
  if (/premium|улучш/.test(n)) s += 40;
  if (/enhanced|расшир/.test(n)) s += 30;
  if (/milena|милена|svetlana|dariya|светлана|дария|алёна|alena|yandex/.test(n)) s += 10;
  if (/google/.test(n)) s += 5;
  if (v.localService) s += 2;
  return s;
};
export function ruVoices() { return voices.filter(v => /^ru/i.test(v.lang)).sort((a, b) => score(b) - score(a)); }
export function enVoices() { return voices.filter(v => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a) || (/en-(us|gb)/i.test(b.lang) - /en-(us|gb)/i.test(a.lang))); }
function pick() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
  const rv = ruVoices(), ev = enVoices();
  ruVoice = rv.find(v => v.name === DB.settings.voiceName) || rv[0] || null;
  enVoice = ev.find(v => v.name === DB.settings.enVoiceName) || ev[0] || null;
}
export function refreshVoices() { pick(); }
export const currentVoice = () => ruVoice;
if ('speechSynthesis' in window) { pick(); speechSynthesis.onvoiceschanged = pick; }

let token = 0, curAudio = null;
export function stop() {
  token++;
  if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; }
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

// убрать эмодзи и служебные символы — голосовой движок читает их названия
const clean = t => String(t).replace(/[\p{Extended_Pictographic}\u{FE0F}\u{FE0E}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]/gu, ' ').replace(/[«»"_…]/g, ' ').replace(/\s+/g, ' ').trim();
// математические знаки — словами, чтобы голос читал понятно
const sayMath = t => String(t)
  .replace(/(\d)\s*см²/g, '$1 квадратных сантиметров').replace(/см²/g, 'квадратных сантиметров')
  .replace(/(\d)\s*°/g, '$1 градусов')
  .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 минус $2').replace(/\s−\s/g, ' минус ')
  .replace(/\s*×\s*/g, ' умножить на ').replace(/(\d)\s*·\s*(\d|x)/g, '$1 умножить на $2')
  .replace(/(\d)\s*:\s*(\d)/g, '$1 разделить на $2')
  .replace(/\s*=\s*\?/g, ' равно сколько').replace(/\s=\s/g, ' равно ')
  .replace(/(\d)\s*\+\s*(\d)/g, '$1 плюс $2').replace(/(\d)\s*–\s*(\d)/g, '$1 или $2').replace(/≈/g, ' примерно ').replace(/π/g, ' пи ').replace(/\s*→\s*/g, ', ').replace(/\s+–\s+/g, ' до ');
function tts(text, lang, rate, tok) {
  text = lang === 'en' ? clean(text) : clean(sayMath(text));
  return new Promise(resolve => {
    if (!('speechSynthesis' in window) || !text) { resolve(); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (lang === 'en') { u.lang = enVoice ? enVoice.lang : 'en-US'; if (enVoice) u.voice = enVoice; }
      else { u.lang = 'ru-RU'; if (ruVoice) u.voice = ruVoice; }
      u.rate = rate; u.pitch = 1.05;
      let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1200 + text.length * 150 / rate);
      if (tok !== token) { resolve(); return; }
      speechSynthesis.speak(u);
    } catch (e) { resolve(); }
  });
}

function playBlob(blob, tok) {
  return new Promise(resolve => {
    if (tok !== token) { resolve(); return; }
    const url = URL.createObjectURL(blob);
    const a = new Audio(url); curAudio = a;
    let done = false; const fin = () => { if (!done) { done = true; URL.revokeObjectURL(url); if (curAudio === a) curAudio = null; resolve(); } };
    a.onended = fin; a.onerror = fin; a.play().catch(fin);
    setTimeout(fin, 20000);
  });
}

/**
 * say('Текст') или say(['Сколько здесь', 'яблок']) — фразы-куски.
 * Для каждого куска сначала ищется запись родителя; остальное читает голос устройства.
 * opts: {lang:'en', slow:true}
 */
export async function say(segs, opts = {}) {
  if (segs == null) return;
  if (!Array.isArray(segs)) segs = [segs];
  segs = segs.filter(s => s !== null && s !== undefined && s !== '').map(s => (typeof s === 'object' ? s : String(s)));
  stop();
  const tok = token;
  const rate = opts.slow ? Math.max(0.55, DB.settings.rate - 0.2) : DB.settings.rate;
  let buf = [];
  const flush = async () => { if (buf.length) { const t = buf.join(' '); buf = []; await tts(t, opts.lang, rate, tok); } };
  for (const s of segs) {
    if (tok !== token) return;
    if (typeof s === 'object') { await flush(); if (s.en) await tts(s.en, 'en', Math.max(0.6, rate - 0.1), tok); continue; }
    if (opts.lang !== 'en' && hasRec(s)) {
      await flush();
      const b = await getRec(s);
      if (b) { await playBlob(b, tok); continue; }
    }
    buf.push(s);
  }
  if (tok === token) await flush();
}

export async function playRecording(phrase) { stop(); const b = await getRec(phrase); if (b) await playBlob(b, token); }
export async function playBlobPublic(blob) { stop(); await playBlob(blob, token); }

/* ---------- микрофон ---------- */
export class Recorder {
  constructor() { this.rec = null; this.chunks = []; this.stream = null; }
  static supported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
  async start() {
    stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    this.rec = type ? new MediaRecorder(this.stream, { mimeType: type }) : new MediaRecorder(this.stream);
    this.chunks = [];
    this.rec.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.rec.start();
  }
  stop() {
    return new Promise(resolve => {
      if (!this.rec) { resolve(null); return; }
      this.rec.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' });
        this.stream.getTracks().forEach(t => t.stop());
        this.rec = null; resolve(blob.size > 500 ? blob : null);
      };
      try { this.rec.stop(); } catch (e) { resolve(null); }
    });
  }
  cancel() { try { this.rec && this.rec.stop(); } catch (e) {} try { this.stream && this.stream.getTracks().forEach(t => t.stop()); } catch (e) {} this.rec = null; }
}
