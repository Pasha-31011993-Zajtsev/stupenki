// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Английский язык: слова с картинками, грамматика
import { register } from '../engine.js';
import { pick, shuffle, opts, sample } from '../ui.js';
import { pic, big } from './common.js';

// [english, русский, эмодзи, уровень]
const W = [
  ['cat', 'кошка', '🐱', 1], ['dog', 'собака', '🐶', 1], ['apple', 'яблоко', '🍎', 1], ['ball', 'мяч', '⚽', 1], ['sun', 'солнце', '☀️', 1], ['house', 'дом', '🏠', 1], ['car', 'машина', '🚗', 1], ['fish', 'рыба', '🐟', 1], ['bird', 'птица', '🐦', 1], ['milk', 'молоко', '🥛', 1],
  ['red', 'красный', '🟥', 1], ['blue', 'синий', '🟦', 1], ['green', 'зелёный', '🟩', 1], ['yellow', 'жёлтый', '🟨', 1], ['one', 'один', '1️⃣', 1], ['two', 'два', '2️⃣', 1], ['three', 'три', '3️⃣', 1],
  ['mother', 'мама', '👩', 2], ['father', 'папа', '👨', 2], ['sister', 'сестра', '👧', 2], ['brother', 'брат', '👦', 2], ['baby', 'малыш', '👶', 2], ['grandmother', 'бабушка', '👵', 2],
  ['hand', 'рука', '✋', 2], ['eye', 'глаз', '👁️', 2], ['nose', 'нос', '👃', 2], ['ear', 'ухо', '👂', 2], ['mouth', 'рот', '👄', 2], ['foot', 'нога (стопа)', '🦶', 2],
  ['bear', 'медведь', '🐻', 2], ['fox', 'лиса', '🦊', 2], ['frog', 'лягушка', '🐸', 2], ['horse', 'лошадь', '🐴', 2], ['cow', 'корова', '🐮', 2], ['pig', 'свинья', '🐷', 2], ['mouse', 'мышь', '🐭', 2], ['rabbit', 'кролик', '🐰', 2],
  ['banana', 'банан', '🍌', 2], ['bread', 'хлеб', '🍞', 2], ['cake', 'торт', '🎂', 2], ['egg', 'яйцо', '🥚', 2], ['tea', 'чай', '🍵', 2], ['juice', 'сок', '🧃', 2],
  ['book', 'книга', '📕', 3], ['pen', 'ручка', '🖊️', 3], ['pencil', 'карандаш', '✏️', 3], ['bag', 'сумка', '👜', 3], ['desk', 'парта', '🪑', 3], ['school', 'школа', '🏫', 3], ['teacher', 'учитель', '👩‍🏫', 3],
  ['shirt', 'рубашка', '👕', 3], ['dress', 'платье', '👗', 3], ['hat', 'шляпа', '👒', 3], ['shoes', 'ботинки', '👞', 3], ['socks', 'носки', '🧦', 3], ['coat', 'пальто', '🧥', 3],
  ['tree', 'дерево', '🌳', 3], ['flower', 'цветок', '🌸', 3], ['rain', 'дождь', '🌧️', 3], ['snow', 'снег', '❄️', 3], ['star', 'звезда', '⭐', 3], ['moon', 'луна', '🌙', 3],
  ['winter', 'зима', '☃️', 4], ['spring', 'весна', '🌷', 4], ['summer', 'лето', '🏖️', 4], ['autumn', 'осень', '🍂', 4], ['morning', 'утро', '🌅', 4], ['night', 'ночь', '🌃', 4],
  ['happy', 'весёлый', '😀', 4], ['sad', 'грустный', '😢', 4], ['big', 'большой', '🐘', 4], ['small', 'маленький', '🐜', 4], ['hot', 'горячий', '🔥', 4], ['cold', 'холодный', '🧊', 4],
  ['run', 'бежать', '🏃', 4], ['swim', 'плавать', '🏊', 4], ['read', 'читать', '📖', 4], ['sing', 'петь', '🎤', 4], ['sleep', 'спать', '😴', 4], ['eat', 'есть', '🍽️', 4], ['write', 'писать', '✍️', 4], ['jump', 'прыгать', '🤸', 4],
  ['kitchen', 'кухня', '🍳', 5], ['bedroom', 'спальня', '🛏️', 5], ['window', 'окно', '🪟', 5], ['door', 'дверь', '🚪', 5], ['city', 'город', '🏙️', 5], ['river', 'река', '🏞️', 5], ['mountain', 'гора', '⛰️', 5], ['island', 'остров', '🏝️', 5],
  ['doctor', 'врач', '👩‍⚕️', 5], ['farmer', 'фермер', '🧑‍🌾', 5], ['cook', 'повар', '🧑‍🍳', 5], ['pilot', 'лётчик', '🧑‍✈️', 5], ['friend', 'друг', '🤝', 5], ['church', 'церковь', '⛪', 5],
];
function words(l, child) {
  const reader = !child || child.grade > 0 || child.age >= 7;
  const pool = W.filter(w => w[3] <= l); const fresh = W.filter(w => w[3] === l);
  const w = pick(Math.random() < 0.6 && fresh.length ? fresh : pool);
  const others = sample(pool.filter(x => x[0] !== w[0]), 3);
  const t = !reader ? 0 : l === 1 ? pick([0, 1]) : pick([0, 1, 2, 3]);
  if (t === 0) return { q: 'Послушай слово и найди картинку', say: ['Послушай слово и найди картинку', { en: w[0] }], choices: shuffle([w, ...others]).map(x => ({ v: x[0], label: x[2] })), answer: w[0], explain: `${w[0]} — ${w[1]}`, speakEn: w[0] };
  if (t === 1) return { q: 'Как это по-английски?', stage: pic(w[2]), choices: shuffle([w, ...others]).map(x => ({ v: x[0], label: x[0], sayEn: x[0] })), answer: w[0], cols: 2, explain: `${w[1]} — ${w[0]}`, speakEn: w[0] };
  if (t === 2) return { q: `Как переводится слово «${w[0]}»?`, say: ['Как переводится слово', { en: w[0] }], stage: big(w[0]), choices: shuffle([w, ...others]).map(x => ({ v: x[0], label: x[1] })), answer: w[0], cols: 2, explain: `${w[0]} — ${w[1]}` };
  // пропущенная буква
  const i = Math.floor(Math.random() * w[0].length); const L = w[0][i];
  const wrong = sample('aeiouybcdglmnprst'.split('').filter(c => c !== L), 3);
  return { q: 'Какой буквы не хватает?', stage: `${pic(w[2])}${big(w[0].slice(0, i) + '<span class="gap">_</span>' + w[0].slice(i + 1))}`, choices: shuffle([L, ...wrong]).map(v => ({ v, label: v })), answer: L, big: true, explain: `${w[0]} — ${w[1]}`, speakEn: w[0] };
}

// [уровень, предложение с ___, ответ, неверные, пояснение]
const G = [
  [1, 'I ___ a boy.', 'am', ['is', 'are'], 'I am — я есть. С «I» всегда am'],
  [1, 'She ___ my sister.', 'is', ['am', 'are'], 'He / she / it — is'],
  [1, 'They ___ friends.', 'are', ['is', 'am'], 'We / you / they — are'],
  [1, 'I ___ a cat.', 'have', ['has', 'having'], 'I / you / we / they — have'],
  [1, 'He ___ a dog.', 'has', ['have', 'is'], 'He / she / it — has'],
  [1, 'This is ___ apple.', 'an', ['a', 'the'], 'Перед гласным звуком — an: an apple'],
  [1, 'This is ___ ball.', 'a', ['an', 'am'], 'Перед согласным — a: a ball'],
  [2, 'two cat___', 's', ['es', '—'], 'Много — добавляем -s: cats'],
  [2, 'three box___', 'es', ['s', '—'], 'После x, s, sh, ch добавляем -es: boxes'],
  [2, 'one man, two ___', 'men', ['mans', 'mens'], 'Особое слово: man — men'],
  [2, 'one child, two ___', 'children', ['childs', 'childes'], 'Особое слово: child — children'],
  [2, 'one tooth, many ___', 'teeth', ['tooths', 'toothes'], 'Особое слово: tooth — teeth'],
  [2, 'The book is ___ the table.', 'on', ['in', 'under'], 'on — на, in — в, under — под'],
  [3, 'He ___ football every day.', 'plays', ['play', 'playing'], 'Present Simple: he / she / it + s: he plays'],
  [3, 'I ___ to school every day.', 'go', ['goes', 'going'], 'I / you / we / they — без -s'],
  [3, 'She ___ not like milk.', 'does', ['do', 'is'], 'Отрицание с he / she / it: does not'],
  [3, '___ you like ice cream?', 'Do', ['Does', 'Are'], 'Вопрос с you: Do you…?'],
  [3, 'Look! The children ___ playing.', 'are', ['is', 'do'], 'Present Continuous: are + playing'],
  [3, 'I can ___ fast.', 'run', ['runs', 'running'], 'После can — глагол без изменений'],
  [4, 'Yesterday I ___ to the park.', 'went', ['go', 'goed'], 'Прошедшее время: go — went'],
  [4, 'Last summer we ___ in the sea.', 'swam', ['swim', 'swimmed'], 'swim — swam'],
  [4, 'She ___ a letter yesterday.', 'wrote', ['writed', 'write'], 'write — wrote'],
  [4, 'They ___ TV last night.', 'watched', ['watch', 'watches'], 'Правильный глагол: + ed: watched'],
  [4, 'I ___ my grandmother tomorrow.', 'will visit', ['visited', 'visits'], 'Будущее: will + глагол'],
  [4, 'An elephant is ___ than a dog.', 'bigger', ['big', 'biggest'], 'Сравнение: big — bigger — the biggest'],
  [4, 'This is the ___ day of my life!', 'happiest', ['happier', 'happy'], 'happy — happier — the happiest'],
  [4, 'I have ___ finished my homework.', 'already', ['yesterday', 'ago'], 'Present Perfect: have already finished'],
];
function grammar(l) {
  const it = pick(G.filter(x => x[0] === l || x[0] === l - 1));
  return { q: 'Выбери правильное слово', stage: big(it[1].replace('___', '<span class="gap">___</span>')), choices: shuffle([it[2], ...it[3]]).map(v => ({ v, label: v })), answer: it[2], cols: 3, explain: it[4], speakEn: it[1].replace(/___/, it[2] === '—' ? '' : it[2]).replace(/ (s|es)\b/, '$1') };
}

register([
  { id: 'e-words', sec: 'english', title: 'Слова', icon: '🔠', g: [-2, 6], levels: 5, gen: words, start: g => (g <= -1 ? 1 : g <= 1 ? 2 : g <= 3 ? 3 : g <= 4 ? 4 : 5), prompts: ['Послушай слово и найди картинку', 'Как это по-английски?', 'Как переводится слово'], weight: 1.4 },
  { id: 'e-grammar', sec: 'english', title: 'Грамматика', icon: '📘', g: [2, 6], levels: 4, gen: grammar },
]);
void opts;
