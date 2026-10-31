// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Логопед: артикуляционная гимнастика, постановка звуков, слоги и слова, запись голоса
import { h, toast, confetti, pick, shuffle, sample } from './ui.js';
import { go, header, onLeave, app } from './nav.js';
import { say, stop, chime, Recorder, playBlobPublic } from './voice.js';
import { frontSVG, sideSVG, animate, P0, SIDE0 } from './mouth.js';
import { save } from './store.js';
import { register } from './engine.js';
import { themeOf } from './themes.js';

/* ================= АРТИКУЛЯЦИОННАЯ ГИМНАСТИКА ================= */
// frames: [время (сек), параметры ротика]
export const EXERCISES = [
  { id: 'smile', name: 'Улыбочка', icon: '😁', for: 'С, З, Ц, Л, И',
    how: 'Широко улыбнись, чтобы были видны верхние и нижние зубки. Держи улыбку, пока я считаю до пяти.',
    frames: [[0, {}], [0.7, { wide: 1 }], [4.5, { wide: 1 }], [5.2, { wide: 0 }], [6, {}]], count: 5 },
  { id: 'tube', name: 'Трубочка', icon: '😗', for: 'Ш, Ж, Ч, Щ, У',
    how: 'Сомкни зубки и вытяни губы вперёд трубочкой, как будто хочешь подуть или поцеловать. Держи до пяти.',
    frames: [[0, {}], [0.7, { wide: -1, open: 0.12 }], [4.5, { wide: -1, open: 0.12 }], [5.2, {}], [6, {}]], count: 5 },
  { id: 'smiletube', name: 'Улыбочка — трубочка', icon: '😁😗', for: 'губы для всех звуков',
    how: 'По очереди: улыбнись — вытяни губы трубочкой. Улыбочка — трубочка. Сделай так пять раз.',
    frames: [[0, { wide: 1 }], [1, { wide: 1 }], [1.6, { wide: -1, open: 0.12 }], [2.6, { wide: -1, open: 0.12 }], [3.2, { wide: 1 }]], count: 5 },
  { id: 'spade', name: 'Лопатка', icon: '👅', for: 'Ш, Ж, Л, Р',
    how: 'Улыбнись, приоткрой рот и положи широкий спокойный язык на нижнюю губу. Он лежит как лопатка — не дрожит. Держи до пяти.',
    frames: [[0, { open: 0.5, wide: 0.4 }], [0.8, { open: 0.5, wide: 0.4, tout: 0.6, ty: 0.1, tw: 1 }], [5, { open: 0.5, wide: 0.4, tout: 0.6, ty: 0.1, tw: 1 }], [5.8, { open: 0.5, wide: 0.4 }], [6.4, { open: 0.5, wide: 0.4 }]], count: 5 },
  { id: 'needle', name: 'Иголочка', icon: '📍', for: 'Л, Р, Ч',
    how: 'Открой рот и высунь узкий острый язычок вперёд, как иголочку. Не касайся губ. Держи до пяти.',
    frames: [[0, { open: 0.45, wide: 0.1 }], [0.8, { open: 0.45, wide: 0.1, tout: 0.85, ty: 0, tw: 0.32 }], [5, { open: 0.45, wide: 0.1, tout: 0.85, ty: 0, tw: 0.32 }], [5.8, { open: 0.45, wide: 0.1 }], [6.3, { open: 0.45, wide: 0.1 }]], count: 5 },
  { id: 'clock', name: 'Часики', icon: '🕰️', for: 'Л, Р',
    how: 'Улыбнись, приоткрой рот. Узким язычком води из одного уголка рта в другой: тик-так, тик-так. Нижняя челюсть не двигается!',
    frames: [[0, { open: 0.55, wide: 0.6, tout: 0.55, tw: 0.35, tx: -1, ty: -0.2 }], [1, { tx: 1 }], [2, { tx: -1 }]], count: 10 },
  { id: 'swing', name: 'Качели', icon: '🎢', for: 'Р, Л, Ш, Ж',
    how: 'Открой рот пошире. Подними язычок вверх к верхней губе, потом опусти вниз к подбородку. Вверх — вниз, как качели.',
    frames: [[0, { open: 0.8, wide: 0.3, tout: 0.45, tw: 0.5, ty: -1 }], [1.1, { ty: 1 }], [2.2, { ty: -1 }]], count: 8 },
  { id: 'cup', name: 'Чашечка', icon: '🍵', for: 'Ш, Ж, Ч, Щ',
    how: 'Открой рот, высунь широкий язык и подними его боковые края и кончик — получится чашечка. Держи до пяти.',
    frames: [[0, { open: 0.6, wide: 0.4 }], [0.8, { open: 0.6, wide: 0.4, tout: 0.55, tw: 1, ty: -0.1 }], [1.6, { cup: 1 }], [5, { cup: 1 }], [5.8, { cup: 0, tout: 0.55 }], [6.5, { tout: 0 }]], count: 5 },
  { id: 'jam', name: 'Вкусное варенье', icon: '🍯', for: 'Ш, Ж, Р',
    how: 'Представь, что на верхней губе варенье. Широким языком облизни верхнюю губу сверху вниз, а потом от одного уголка к другому. Губы не помогают!',
    frames: [[0, { open: 0.5, wide: 0.4, tout: 0.5, tw: 0.9, ty: -0.85, tx: -0.6 }], [1.3, { tx: 0.6 }], [2.6, { tx: -0.6 }]], count: 6 },
  { id: 'horse', name: 'Лошадка', icon: '🐴', for: 'Р, Л, Ш',
    how: 'Улыбнись, приоткрой рот и пощёлкай кончиком языка, как цокает лошадка: цок-цок. Язык присасывается к нёбу и отрывается.',
    frames: [[0, { open: 0.55, wide: -0.2, ty: -1, tw: 0.8 }], [0.45, { ty: -1 }], [0.55, { ty: 0.6 }], [0.9, { ty: 0.6 }], [1.2, { ty: -1 }]], count: 10, click: [0.5] },
  { id: 'mushroom', name: 'Грибок', icon: '🍄', for: 'Р, Ш, Ж',
    how: 'Улыбнись, открой рот и присоси широкий язык к нёбу. Под языком натянется уздечка — это ножка грибка, а язык — шляпка. Держи до пяти, потом открывай рот шире.',
    frames: [[0, { open: 0.5, wide: 0.5 }], [0.8, { open: 0.75, wide: 0.5, ty: -1, tw: 1 }], [5, { open: 0.85, wide: 0.5, ty: -1, tw: 1 }], [5.8, { open: 0.5, wide: 0.5, ty: 0.4 }], [6.3, {}]], count: 5 },
  { id: 'painter', name: 'Маляр', icon: '🖌️', for: 'Р, Л',
    how: 'Улыбнись, открой рот. Кончиком языка, как кисточкой, «покрась» нёбо — веди от верхних зубов назад и обратно. Нижняя челюсть не двигается.',
    frames: [[0, { open: 0.7, wide: 0.5, ty: -1, tw: 0.7 }], [1.2, { ty: -0.45 }], [2.4, { ty: -1 }]], count: 8 },
  { id: 'drum', name: 'Барабанщик', icon: '🥁', for: 'Р',
    how: 'Улыбнись, открой рот и постучи кончиком языка по бугоркам за верхними зубами: д-д-д-д. Быстро-быстро, как барабанщик!',
    frames: [[0, { open: 0.65, wide: 0.5, ty: -1, tw: 0.7 }], [0.15, { ty: -0.65 }], [0.3, { ty: -1 }]], count: 15 },
  { id: 'boat', name: 'Пароходик', icon: '🚢', for: 'Л',
    how: 'Приоткрой рот, слегка прикуси широкий кончик языка зубами и тяни звук «ы-ы-ы». Получится, как гудит пароход: л-л-л.',
    frames: [[0, { open: 0.3, wide: 0.3, tout: 0.18, ty: 0, tw: 0.9 }], [4, { open: 0.3, wide: 0.3, tout: 0.18, ty: 0, tw: 0.9 }]], count: 5 },
];

/* ================= ЗВУКИ ================= */
const AIR_S = 'M140 120 Q198 104 226 124 Q240 136 272 143';
const AIR_SH = 'M140 128 Q190 124 220 116 Q242 126 276 140';
const AIR_R = 'M150 132 Q200 120 230 112 Q250 122 276 136';
const AIR_L = 'M150 150 Q190 168 228 150 Q246 150 274 156';
export const SOUNDS = [
  { id: 'С', game: 'Насос: с-с-с', icon: '💨', voiced: false, warm: false, air: AIR_S, sayLong: 'сссс',
    side: { B: [112, 158], M: [165, 128], L: [218, 112], T: [233, 152], U: [226, 165], F: [205, 182], sp: 1 },
    front: { wide: 0.9, open: 0.08, ty: 0.6 },
    steps: ['Улыбнись так, чтобы были видны зубки', 'Зубки сблизь — между ними маленькая щёлочка', 'Кончик языка спрячь за нижние зубки и упри в них', 'Подуй: по серединке языка бежит холодный ветерок — с-с-с', 'Поднеси ладошку ко рту — струя холодная и узкая'],
    prep: ['smile', 'spade', 'smiletube'],
    syl: ['са', 'со', 'су', 'сы', 'сэ', 'ас', 'ос', 'ус', 'ыс', 'аса', 'осо', 'усу', 'сна', 'ска', 'сто'],
    words: [['🦉', 'сова'], ['🧀', 'сыр'], ['🐕', 'собака'], ['🛷', 'санки'], ['✈️', 'самолёт'], ['🐘', 'слон'], ['🦊', 'лиса'], ['🚌', 'автобус'], ['👃', 'нос'], ['🍍', 'ананас'], ['👜', 'сумка'], ['🎭', 'маска'], ['🥬', 'капуста'], ['🧃', 'сок']],
    phrases: ['Сова сидит на суку', 'У Сони сумка', 'Самолёт летит высоко'] },
  { id: 'З', game: 'Комарик: з-з-з', icon: '🦟', voiced: true, warm: false, air: AIR_S, sayLong: 'зззз',
    side: { B: [112, 158], M: [165, 128], L: [218, 112], T: [233, 152], U: [226, 165], F: [205, 182], sp: 1 },
    front: { wide: 0.9, open: 0.08, ty: 0.6 },
    steps: ['Всё как для звука С: улыбка, зубки сближены', 'Кончик языка упирается в нижние зубки', 'Добавь голос — горлышко «звенит»', 'Положи ладошку на горло: оно дрожит — значит, получился З, а не С'],
    prep: ['smile', 'spade'],
    syl: ['за', 'зо', 'зу', 'зы', 'аза', 'озо', 'узу', 'зна', 'зва'],
    words: [['☂️', 'зонт'], ['🐰', 'заяц'], ['🏰', 'замок'], ['🦷', 'зуб'], ['⭐', 'звезда'], ['🐐', 'коза'], ['🌹', 'роза'], ['🏺', 'ваза'], ['👀', 'глаза'], ['🔔', 'звонок']],
    phrases: ['У Зои зонт', 'Коза ест розу', 'Заяц идёт в замок'] },
  { id: 'Ц', game: 'Цыц! ц-ц-ц', icon: '🤫', voiced: false, warm: false, air: AIR_S, sayLong: 'ц ц ц',
    side: { B: [112, 158], M: [165, 128], L: [220, 108], T: [233, 152], U: [226, 165], F: [205, 182], sp: 1 },
    sideFrames: true,
    front: { wide: 0.9, open: 0.08, ty: 0.6 },
    steps: ['Улыбнись, зубки сблизь', 'Кончик языка за нижними зубками', 'Спинка языка на миг прижимается к бугоркам за верхними зубами — «т»', 'И сразу отскакивает со свистом «с». Т + С = Ц: ц-ц-ц, будто просишь тишины'],
    prep: ['smile', 'spade'],
    syl: ['ца', 'цо', 'цу', 'цы', 'ац', 'оц', 'уц', 'аца', 'оцо'],
    words: [['🐥', 'цыплёнок'], ['🌸', 'цветок'], ['🎪', 'цирк'], ['🥒', 'огурец'], ['🥚', 'яйцо'], ['🐔', 'курица'], ['🐦', 'птица'], ['💍', 'кольцо'], ['☀️', 'солнце'], ['🐑', 'овца']],
    phrases: ['Цыплёнок пьёт водицу', 'На окне цветок', 'Курица снесла яйцо'] },
  { id: 'Ш', game: 'Змейка: ш-ш-ш', icon: '🐍', voiced: false, warm: true, air: AIR_SH, sayLong: 'шшшш',
    side: { B: [118, 135], M: [165, 140], L: [205, 134], T: [226, 121], U: [222, 134], F: [205, 180], lp: 1, sp: 0 },
    front: { wide: -0.55, open: 0.25, ty: -0.8, tw: 0.9, cup: 0.6 },
    steps: ['Вытяни губы вперёд «рупором», но так, чтобы зубки было видно', 'Зубки сблизь', 'Подними широкий язык вверх «чашечкой» — к бугоркам за верхними зубами, но не касайся их', 'Подуй тёплым воздухом: ш-ш-ш, как змейка', 'Ладошка у рта: струя тёплая и широкая'],
    prep: ['cup', 'jam', 'mushroom', 'tube'],
    syl: ['ша', 'шо', 'шу', 'ши', 'аш', 'ош', 'уш', 'ыш', 'аша', 'ошо', 'шка', 'шла'],
    words: [['🎈', 'шар'], ['🎩', 'шляпа'], ['🍫', 'шоколад'], ['🚗', 'машина'], ['🐭', 'мышка'], ['🐱', 'кошка'], ['🧸', 'мишка'], ['🍐', 'груша'], ['✏️', 'карандаш'], ['👶', 'малыш'], ['🐸', 'лягушка'], ['🧣', 'шарф']],
    phrases: ['Наша кошка ловит мышку', 'У Миши шапка', 'Шла Саша по шоссе'] },
  { id: 'Ж', game: 'Жук: ж-ж-ж', icon: '🪲', voiced: true, warm: true, air: AIR_SH, sayLong: 'жжжж',
    side: { B: [118, 135], M: [165, 140], L: [205, 134], T: [226, 121], U: [222, 134], F: [205, 180], lp: 1, sp: 0 },
    front: { wide: -0.55, open: 0.25, ty: -0.8, tw: 0.9, cup: 0.6 },
    steps: ['Всё как для звука Ш: губы рупором, язык чашечкой вверху', 'Добавь голос — получится, как жужжит жук', 'Ладошка на горле: оно дрожит'],
    prep: ['cup', 'jam', 'mushroom'],
    syl: ['жа', 'жо', 'жу', 'жи', 'ажа', 'ожо', 'ужу', 'жда'],
    words: [['🪲', 'жук'], ['🦒', 'жираф'], ['🦔', 'ёжик'], ['✂️', 'ножницы'], ['🎿', 'лыжи'], ['❄️', 'снежинка'], ['🥐', 'пирожок']],
    phrases: ['Жук жужжит', 'У ежа ежата', 'Жираф жуёт листья'] },
  { id: 'Ч', game: 'Паровозик: ч-ч-ч', icon: '🚂', voiced: false, warm: true, air: AIR_SH, sayLong: 'ч ч ч',
    side: { B: [118, 130], M: [160, 118], L: [206, 116], T: [231, 115], U: [224, 128], F: [205, 180], lp: 0.6, sp: 0 },
    sideFrames: true,
    front: { wide: -0.4, open: 0.15, ty: -0.9, tw: 0.6 },
    steps: ['Губы чуть вытяни вперёд', 'Кончик языка прижми к бугоркам за верхними зубами', 'Резко оторви его и выдохни: ч! Как паровозик: ч-ч-ч', 'Звук короткий и мягкий, будто «ть-щ»'],
    prep: ['cup', 'horse', 'drum'],
    syl: ['ча', 'чо', 'чу', 'чи', 'ач', 'оч', 'уч', 'ачи'],
    words: [['🫖', 'чайник'], ['☕', 'чашка'], ['🐢', 'черепаха'], ['⌚', 'часы'], ['🧳', 'чемодан'], ['⚽', 'мяч'], ['🔑', 'ключ'], ['🦋', 'бабочка'], ['👓', 'очки'], ['🐝', 'пчела'], ['👧', 'девочка'], ['🌧️', 'тучка']],
    phrases: ['Чайник на печи', 'Пчела жужжит', 'У девочки мяч'] },
  { id: 'Щ', game: 'Щёточка: щ-щ-щ', icon: '🪥', voiced: false, warm: true, air: AIR_SH, sayLong: 'щщщщ',
    side: { B: [118, 126], M: [162, 113], L: [205, 117], T: [227, 121], U: [222, 133], F: [205, 180], lp: 0.8, sp: 0 },
    front: { wide: -0.45, open: 0.2, ty: -0.6, tw: 0.9, cup: 0.3 },
    steps: ['Губы вперёд, как для Ш', 'Язык подними вверх, а серединку языка — ещё выше, ближе к нёбу', 'Тяни долгий мягкий звук: щ-щ-щ, как шуршит щётка', 'Звук мягче и длиннее, чем Ш'],
    prep: ['cup', 'jam', 'tube'],
    syl: ['ща', 'що', 'щу', 'щи', 'ащ', 'ощ', 'ущ', 'аща'],
    words: [['🐶', 'щенок'], ['🪥', 'щётка'], ['🛡️', 'щит'], ['📦', 'ящик'], ['🦎', 'ящерица'], ['🥕', 'овощи'], ['🍲', 'борщ'], ['🌳', 'роща']],
    phrases: ['Щенок пищит', 'Мама варит борщ', 'Щёткой чищу зубы'] },
  { id: 'Л', game: 'Пароход гудит: л-л-л', icon: '🚢', voiced: true, warm: true, air: AIR_L, sayLong: 'лллл',
    side: { B: [115, 128], M: [166, 152], L: [211, 128], T: [241, 124], U: [230, 137], F: [205, 182], sp: 0.4 },
    front: { wide: 0.4, open: 0.4, ty: -1, tw: 0.6 },
    steps: ['Приоткрой рот и чуть улыбнись', 'Кончик языка упри в верхние зубки (или в бугорки за ними)', 'Включи голос — горло гудит', 'Воздух проходит по бокам языка: л-л-л, как гудит пароход', 'Подсказка: прикуси широкий кончик языка и скажи «ы-ы-ы» — получится Л'],
    prep: ['spade', 'swing', 'boat', 'painter'],
    syl: ['ла', 'ло', 'лу', 'лы', 'ал', 'ол', 'ул', 'ыл', 'ала', 'оло', 'улу', 'пла', 'кла'],
    words: [['🧅', 'лук'], ['🛶', 'лодка'], ['💡', 'лампа'], ['🪑', 'стул'], ['🐴', 'лошадь'], ['🐾', 'лапа'], ['🌙', 'луна'], ['🥛', 'молоко'], ['🐿️', 'белка'], ['🐺', 'волк'], ['🪚', 'пила'], ['🐘', 'слон']],
    phrases: ['Луна светит ночью', 'Белка грызёт орехи', 'Мы пили молоко'] },
  { id: 'Р', game: 'Моторчик: р-р-р', icon: '🏍️', voiced: true, warm: true, air: AIR_R, sayLong: 'рррр',
    side: { B: [115, 150], M: [165, 135], L: [210, 122], T: [232, 113], U: [226, 128], F: [205, 182], sp: 0.4 },
    sideFrames: true,
    front: { wide: 0.5, open: 0.55, ty: -1, tw: 0.8 },
    steps: ['Улыбнись и приоткрой рот', 'Подними широкий кончик языка к бугоркам за верхними зубами', 'Бока языка прижми к верхним боковым зубам', 'Сильно подуй на кончик языка — он задрожит: р-р-р, как моторчик', 'Сначала можно быстро говорить «д-д-д» — это подготовка'],
    prep: ['horse', 'mushroom', 'drum', 'painter', 'swing'],
    syl: ['ра', 'ро', 'ру', 'ры', 'ар', 'ор', 'ур', 'ыр', 'ара', 'оро', 'дра', 'тра'],
    words: [['🐟', 'рыба'], ['🦞', 'рак'], ['🚀', 'ракета'], ['✋', 'рука'], ['🌹', 'роза'], ['🌈', 'радуга'], ['🐄', 'корова'], ['⛰️', 'гора'], ['🥁', 'барабан'], ['🧀', 'сыр'], ['🍅', 'помидор'], ['🪓', 'топор'], ['🦟', 'комар']],
    phrases: ['Рыба плавает', 'Ракета летит к звёздам', 'Корова даёт молоко'],
    note: 'Звук Р — самый трудный. Если долго не получается или появляется «горловой» (картавый) Р — лучше показать ребёнка логопеду, чтобы не закрепился неправильный звук.' },
];
SOUNDS.forEach(s => { if (!s.note) s.note = ''; });

/* ================= ЭКРАНЫ ================= */
const mark = (child, key) => { child.speech[key] = (child.speech[key] || 0) + 1; child.stars++; save(); };

export function speechHome() {
  const child = app.child;
  const ex = h('div.grid.cards3');
  EXERCISES.forEach(e => ex.append(h('button.card.ex-card', { onclick: () => go(exerciseScreen, e.id) },
    h('div.ico', e.icon), h('div.name', e.name), child.speech['ex:' + e.id] ? h('div.small', '✓ ' + child.speech['ex:' + e.id]) : null)));
  const sn = h('div.grid.cards4');
  SOUNDS.forEach(s => sn.append(h('button.card.sound-card', { onclick: () => go(soundScreen, s.id) },
    h('div.letter-big', s.id), h('div.small', s.game.split(':')[0]), child.speech['snd:' + s.id] ? h('div.small', '✓ ' + child.speech['snd:' + s.id]) : null)));
  return [
    header('👅 Логопед'),
    h('div.panel', h('h2', 'Зарядка для язычка'), h('p.muted', 'Делай каждый день 3–4 упражнения перед зеркалом. Смотри на ротик и повторяй.'), ex),
    h('div.panel', h('h2', 'Звуки'), h('p.muted', 'Как поставить язычок, чтобы получился звук. Потом слоги и слова — с записью твоего голоса.'), sn),
    h('div.panel', h('button.btn.big.wide', { onclick: () => { go(window.__lessonFn, 'speech'); } }, '🎧 Слышу звук — игра'), h('p.muted.center', 'Различаем звуки на слух: есть звук или нет, где он стоит')),
    h('p.disclaimer', 'Занятия помогают подготовить язычок и закрепить звуки, но не заменяют логопеда. Если звук долго не получается — покажите ребёнка специалисту.'),
  ];
}

function mirrorBtn(box) {
  let stream = null, video = null;
  const btn = h('button.btn.ghost', { onclick: async () => {
    if (stream) { stopCam(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video = h('video.mirror', { autoplay: true, playsinline: true, muted: true }); video.srcObject = stream; box.append(video); btn.textContent = '✖ Убрать зеркало';
    } catch (e) { toast('Не получилось включить камеру'); }
  } }, '🪞 Зеркало');
  const stopCam = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; if (video) video.remove(); btn.textContent = '🪞 Зеркало'; };
  onLeave(stopCam);
  return btn;
}

export function exerciseScreen(id) {
  const child = app.child; const e = EXERCISES.find(x => x.id === id);
  const pic = h('div.mouth-box'); const counter = h('div.counter', ''); const mirrorBox = h('div.mirror-box');
  let n = 0;
  const stopAnim = animate(pic, e.frames, P0, p => frontSVG(p, 'ex'), (t, i) => {
    if (e.click && e.click.some(c => Math.abs(t - c) < 0.5) && i >= 1) chime('click');
  });
  onLeave(stopAnim);
  const done = h('button.btn.big.good', { onclick: () => {
    n++; mark(child, 'ex:' + e.id); chime('good');
    counter.textContent = `Сделано: ${n} ${n === 1 ? 'раз' : 'раза'}`;
    if (n === 1) { confetti(['⭐', '👅', '✨']); say(pick(['Молодец!', 'Отлично!', 'Здорово!'])); }
  } }, '✓ Я сделал' + (child.gender === 'f' ? 'а' : '') + '!');
  setTimeout(() => say([e.name, e.how]), 300);
  return [
    header(e.icon + ' ' + e.name),
    h('div.ex-wrap', pic, mirrorBox),
    h('div.panel',
      h('p.big-text', e.how),
      h('div.row.wrap', h('button.btn.ghost', { onclick: () => say(e.how) }, '🔊 Послушать'), mirrorBtn(mirrorBox)),
      h('p.muted', `Нужно для звуков: ${e.for}. Повтори ${e.count} раз.`)),
    h('div.center', done, counter),
  ];
}

export function soundScreen(id) {
  const child = app.child; const s = SOUNDS.find(x => x.id === id);
  const side = h('div.side-box'), front = h('div.mouth-box.small');
  // вид сбоку: покой → положение звука → держим
  let sideFrames = [[0, SIDE0], [1, SIDE0], [2.2, s.side], [5.5, s.side], [6.3, SIDE0]];
  if (s.id === 'Ц') sideFrames = [[0, SIDE0], [0.8, SIDE0], [1.6, { ...s.side, L: [222, 104] }], [2.3, { ...s.side, L: [222, 104] }], [2.6, { ...s.side, L: [218, 113] }], [5.5, { ...s.side, L: [218, 113] }], [6.3, SIDE0]];
  if (s.id === 'Ч') sideFrames = [[0, SIDE0], [0.8, SIDE0], [1.6, s.side], [2.3, s.side], [2.6, { ...s.side, T: [228, 121] }], [3.2, s.side], [3.5, { ...s.side, T: [228, 121] }], [5.5, { ...s.side, T: [228, 121] }], [6.3, SIDE0]];
  if (s.id === 'Р') { sideFrames = [[0, SIDE0], [0.8, SIDE0], [1.8, s.side]]; for (let i = 0; i < 16; i++) sideFrames.push([1.9 + i * 0.12, { ...s.side, T: [232 + (i % 2 ? -3 : 3), 113 + (i % 2 ? 5 : 0)] }]); sideFrames.push([4.3, s.side], [5.2, SIDE0]); }
  const airFrom = s.id === 'Ц' || s.id === 'Ч' ? 2.4 : 2.0;
  let showAir = false;
  const stopSide = animate(side, sideFrames, SIDE0, p => sideSVG(p, { air: showAir ? s.air : null, warm: s.warm, voiced: showAir && s.voiced }), t => { showAir = t > airFrom && t < 5.6; });
  const stopFront = animate(front, [[0, P0], [1, P0], [2.2, s.front], [5.5, s.front], [6.3, P0]], P0, p => frontSVG(p, 'snd'));
  onLeave(() => { stopSide(); stopFront(); });

  const steps = h('ol.steps'); s.steps.forEach(t => steps.append(h('li', { onclick: () => say(t) }, t)));
  const prep = h('div.row.wrap'); s.prep.forEach(pid => { const e = EXERCISES.find(x => x.id === pid); prep.append(h('button.chip', { onclick: () => go(exerciseScreen, pid) }, e.icon + ' ' + e.name)); });
  const rec = recordPanel(child);
  const tiles = (arr, cls, getText, getPic) => { const g = h('div.grid.' + cls); arr.forEach(x => g.append(h('button.card.say-card', { onclick: () => { say(getText(x)); mark(child, 'snd:' + s.id); rec.setTarget(getText(x)); } }, getPic ? h('div.ico', getPic(x)) : null, h('div.name', cls === 'syl' ? getText(x).toUpperCase() : getText(x))))); return g; };

  setTimeout(() => say(['Звук', s.id, s.game.split(':')[0]]), 300);
  return [
    header(`Звук ${s.id} — ${s.game.split(':')[0]}`),
    h('div.sound-views', h('div.view', h('div.view-label', 'Вид сбоку, в разрезе'), side), h('div.view', h('div.view-label', 'Вид спереди'), front)),
    h('div.legend', h('span', h('i.air-cold'), ' холодный воздух'), h('span', h('i.air-warm'), ' тёплый воздух'), s.voiced ? h('span', '〰 голос включён') : h('span', '🤫 без голоса')),
    h('div.panel', h('h2', 'Как сказать звук ' + s.id), steps, h('div.row.wrap', h('button.btn.ghost', { onclick: () => say(s.steps) }, '🔊 Прочитать всё'))),
    h('div.panel', h('h2', 'Сначала зарядка'), prep),
    s.note ? h('p.disclaimer', s.note) : null,
    h('div.panel', h('h2', 'Слоги'), h('p.muted', 'Нажми — послушай — повтори. Потом запиши себя.'), tiles(s.syl, 'syl', x => x)),
    h('div.panel', h('h2', 'Слова'), tiles(s.words, 'cards3', x => x[1], x => x[0])),
    h('div.panel', h('h2', 'Фразы'), tiles(s.phrases, 'phr', x => x)),
    rec.el,
  ];
}

/** панель записи голоса ребёнка: запиши — послушай — сравни с образцом */
function recordPanel(child) {
  let target = null, last = null; const R = new Recorder();
  const tgt = h('div.rec-target', 'Выбери слог или слово выше');
  const status = h('div.muted', Recorder.supported() ? '' : 'Запись голоса не поддерживается этим браузером');
  const play = h('button.btn.ghost', { disabled: true, onclick: () => last && playBlobPublic(last) }, '▶ Послушать себя');
  const sample = h('button.btn.ghost', { onclick: () => target && say(target) }, '🔊 Образец');
  let on = false;
  const btn = h('button.rec-btn', { onclick: async () => {
    if (!on) { try { await R.start(); on = true; btn.classList.add('on'); btn.textContent = 'Стоп'; status.textContent = 'Говори!'; } catch (e) { status.textContent = 'Нужно разрешить микрофон'; } }
    else { on = false; btn.classList.remove('on'); btn.textContent = 'Запись'; last = await R.stop(); status.textContent = last ? 'Готово! Послушай себя' : 'Ничего не записалось'; play.disabled = !last; if (last) { playBlobPublic(last); mark(child, 'rec'); } }
  } }, 'Запись');
  onLeave(() => R.cancel());
  return {
    el: h('div.panel.rec-panel', h('h2', '🎙 Запиши себя'), tgt, h('div.row.center', btn), status, h('div.row.wrap.center', sample, play)),
    setTarget: t => { target = t; tgt.textContent = '«' + t + '»'; },
  };
}

/* ================= ИГРА «СЛЫШУ ЗВУК» (фонематический слух) ================= */
const SOFT_NEXT = 'еёиюяь';
function soundPos(word, letter) {
  const w = word.toLowerCase(), L = letter.toLowerCase(), any = 'шжцчщ'.includes(L);
  let i = -1;
  for (let k = 0; k < w.length; k++) if (w[k] === L && (any || !(w[k + 1] && SOFT_NEXT.includes(w[k + 1])))) { i = k; break; }
  if (i < 0) return null;
  if (i === 0) return 'в начале';
  if (!w.slice(i + 1).replace(/ь/g, '').length) return 'в конце';
  return 'в середине';
}
const SAY_SND = { 'С': 'сы', 'З': 'зы', 'Ц': 'цы', 'Ш': 'шы', 'Ж': 'жы', 'Ч': 'чи', 'Щ': 'щи', 'Л': 'лы', 'Р': 'ры' };
const PAIRS = [['С', 'Ш'], ['З', 'Ж'], ['Л', 'Р'], ['С', 'З'], ['Ш', 'Ж'], ['Ч', 'Щ'], ['С', 'Ц']];
function hear(l) {
  if (l === 1) {
    const s = pick(SOUNDS); const yes = Math.random() < 0.5;
    const pool = yes ? s.words : SOUNDS.filter(x => x.id !== s.id).flatMap(x => x.words).filter(w => !w[1].includes(s.id.toLowerCase()));
    const w = pick(pool);
    return { q: `Есть ли звук ${s.id} в слове «${w[1]}»?`, say: ['Есть ли звук', SAY_SND[s.id], 'в слове', w[1]], stage: `<div class="pic">${w[0]}</div>`, choices: [{ v: 'y', label: 'Да 👍' }, { v: 'n', label: 'Нет 👎' }], answer: yes ? 'y' : 'n', cols: 2, explain: yes ? `Да: ${w[1]} — есть звук ${s.id}` : `Нет, в слове «${w[1]}» звука ${s.id} нет`, sayAfter: w[1] };
  }
  if (l === 2) {
    const s = pick(SOUNDS); let w, pos;
    for (let t = 0; t < 10; t++) { w = pick(s.words); pos = soundPos(w[1], s.id); if (pos) break; }
    if (!pos) return null;
    return { q: `Где звук ${s.id} в слове «${w[1]}»: в начале, в середине или в конце?`, say: ['Где звук', SAY_SND[s.id], 'в слове', w[1]], stage: `<div class="pic">${w[0]}</div>`, choices: ['в начале', 'в середине', 'в конце'].map(v => ({ v, label: v })), answer: pos, cols: 3, explain: `${w[1].toUpperCase()}: звук ${s.id} ${pos}` };
  }
  const pr = pick(PAIRS); const sid = pick(pr); const s = SOUNDS.find(x => x.id === sid);
  const w = pick(s.words.filter(x => !x[1].includes(pr.find(y => y !== sid).toLowerCase())));
  if (!w) return null;
  return { q: `Какой звук в слове «${w[1]}»: ${pr[0]} или ${pr[1]}?`, say: ['Какой звук в слове', w[1]], stage: `<div class="pic">${w[0]}</div>`, choices: pr.map(v => ({ v, label: v })), answer: sid, big: true, cols: 2, explain: `В слове «${w[1]}» звук ${sid}`, sayAfter: w[1] };
}
register([{ id: 'sp-hear', sec: 'speech', title: 'Слышу звук', icon: '🎧', g: [-3, 3], levels: 3, gen: hear }]);
void shuffle; void sample; void stop; void themeOf;
