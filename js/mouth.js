// «Ступеньки» © 2026 Павел Зайцев. Авторы: Павел Зайцев и Claude. Лицензия CC BY-NC-ND 4.0 — см. LICENSE
// Рисованный ротик: вид спереди и вид сбоку (в разрезе). Всё — векторами, без картинок.

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const f1 = n => Math.round(n * 10) / 10;

/* ================= ВИД СПЕРЕДИ =================
 p = { open 0..1, wide -1(трубочка)..1(улыбка), tout 0..1 (насколько высунут язык),
       tx -1..1 (влево-вправо), ty -1 (вверх)..1 (вниз), tw 0.3 (узкий)..1 (широкий), cup 0..1 (чашечка) } */
export const P0 = { open: 0.05, wide: 0, tout: 0, tx: 0, ty: 0.4, tw: 0.9, cup: 0 };

export function frontSVG(p, uid = 'm') {
  const cx = 160, cy = 172;
  const W = 150 + (p.wide > 0 ? 40 * p.wide : 85 * p.wide);
  let H = 8 + 95 * p.open; if (p.wide < 0) H = Math.max(H, -p.wide * 38);
  const lift = 12 * Math.max(0, p.wide);
  const Lx = cx - W / 2, Rx = cx + W / 2, Y = cy - lift;
  const round = p.wide < 0 ? -p.wide : 0;
  const k1 = 0.35 + round * 0.18, kTop = 0.55 + round * 0.25, kBot = 0.75 + round * 0.1;
  const mouth = `M${f1(Lx)} ${f1(Y)} C${f1(cx - W * k1)} ${f1(Y - H * kTop)} ${f1(cx + W * k1)} ${f1(Y - H * kTop)} ${f1(Rx)} ${f1(Y)} C${f1(cx + W * (k1 + 0.03))} ${f1(cy + H * kBot)} ${f1(cx - W * (k1 + 0.03))} ${f1(cy + H * kBot)} ${f1(Lx)} ${f1(Y)} Z`;
  const topIn = Y - H * kTop * 0.75, botIn = cy + H * kBot * 0.72;
  const tw = W * (0.62 - round * 0.15);
  // зубы
  let teeth = '';
  const teethRow = (y, hgt, up) => {
    let s = `<rect x="${f1(cx - tw / 2)}" y="${f1(y)}" width="${f1(tw)}" height="${f1(hgt)}" rx="5" fill="#FFFFFF"/>`;
    for (let i = 1; i < 6; i++) { const x = cx - tw / 2 + tw * i / 6; s += `<line x1="${f1(x)}" y1="${f1(up ? y + 2 : y + hgt * 0.25)}" x2="${f1(x)}" y2="${f1(up ? y + hgt * 0.8 : y + hgt - 2)}" stroke="#D9DCE6" stroke-width="1.5"/>`; }
    return s;
  };
  teeth += teethRow(topIn - 8, 20, true);
  teeth += teethRow(botIn - 13, 16, false);
  // язык: точка основания и кончик — плавный переход «во рту» → «снаружи»
  const s = Math.min(1, p.tout / 0.3);
  const inBase = [cx, cy + H * 0.6 + 14], inTip = [cx + p.tx * W * 0.25, lerp(cy + H * 0.25, topIn + 12, Math.max(0, -p.ty))];
  let outTipY;
  const fwdY = cy + H * 0.35 + p.tout * 42;
  if (p.ty >= 0) outTipY = fwdY + p.tout * 38 * p.ty; else outTipY = lerp(fwdY, Y - H * 0.5 - 18 - 40 * p.tout, -p.ty);
  const side = Math.abs(p.tx);
  let outTipX = cx + p.tx * (W / 2 + 28) * Math.max(0.35, p.tout);
  if (side > 0.4) outTipY = lerp(outTipY, Y + 2, (side - 0.4) / 0.6);
  const outBase = [cx + p.tx * W * 0.08, cy + H * 0.12];
  const B = [lerp(inBase[0], outBase[0], s), lerp(inBase[1], outBase[1], s)];
  const T = [lerp(inTip[0], outTipX, s), lerp(inTip[1], outTipY, s)];
  const bw = p.tw * W * 0.27 + 7, tr = Math.max(6, p.tw * W * 0.2 + 3);
  let dx = T[0] - B[0], dy = T[1] - B[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  const nx = -dy, ny = dx;
  const pa = [B[0] + nx * bw, B[1] + ny * bw], pb = [T[0] + nx * tr, T[1] + ny * tr], pc = [T[0] - nx * tr, T[1] - ny * tr], pd = [B[0] - nx * bw, B[1] - ny * bw];
  const tip = [T[0] + dx * tr * 1.05, T[1] + dy * tr * 1.05];
  const tongue = `M${f1(pa[0])} ${f1(pa[1])} L${f1(pb[0])} ${f1(pb[1])} Q${f1(tip[0] + nx * tr)} ${f1(tip[1] + ny * tr)} ${f1(tip[0])} ${f1(tip[1])} Q${f1(tip[0] - nx * tr)} ${f1(tip[1] - ny * tr)} ${f1(pc[0])} ${f1(pc[1])} L${f1(pd[0])} ${f1(pd[1])} Z`;
  const mid = [lerp(B[0], T[0], 0.25), lerp(B[1], T[1], 0.25)];
  let groove = `<path d="M${f1(mid[0])} ${f1(mid[1])} L${f1(T[0] - dx * tr * 0.3)} ${f1(T[1] - dy * tr * 0.3)}" stroke="#C9506A" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`;
  if (p.cup > 0.05) {
    const c = p.cup;
    groove = `<path d="M${f1(pa[0] * 0.5 + pb[0] * 0.5)} ${f1(pa[1] * 0.5 + pb[1] * 0.5)} Q${f1(tip[0])} ${f1(tip[1] + dy * 6)} ${f1(pd[0] * 0.5 + pc[0] * 0.5)} ${f1(pd[1] * 0.5 + pc[1] * 0.5)}" fill="none" stroke="#FFB3C2" stroke-width="${f1(4 + 4 * c)}" stroke-linecap="round" opacity="${f1(0.4 + 0.6 * c)}"/>
      <ellipse cx="${f1(lerp(B[0], T[0], 0.62))}" cy="${f1(lerp(B[1], T[1], 0.62))}" rx="${f1(tr * 0.75)}" ry="${f1(tr * 0.45)}" fill="#C24A63" opacity="${f1(0.45 * c)}"/>`;
  }
  // подъязычная уздечка, когда кончик поднят во рту
  const frenulum = (p.ty < -0.5 && p.tout < 0.15) ? `<path d="M${cx} ${f1(botIn - 6)} L${cx} ${f1(lerp(botIn, T[1], 0.55))}" stroke="#B83A55" stroke-width="3" stroke-linecap="round"/>` : '';
  const clipT = p.tout < 0.12;
  return `<svg viewBox="0 0 320 300" class="mouth-svg" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="cav-${uid}"><path d="${mouth}"/></clipPath>
  <radialGradient id="face-${uid}" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#FFE3C9"/><stop offset="100%" stop-color="#F9CBA4"/></radialGradient></defs>
  <ellipse cx="160" cy="150" rx="150" ry="148" fill="url(#face-${uid})"/>
  <ellipse cx="72" cy="150" rx="26" ry="17" fill="#FF9E9E" opacity=".45"/><ellipse cx="248" cy="150" rx="26" ry="17" fill="#FF9E9E" opacity=".45"/>
  <ellipse cx="108" cy="58" rx="12" ry="15" fill="#2B2D42"/><ellipse cx="212" cy="58" rx="12" ry="15" fill="#2B2D42"/>
  <circle cx="112" cy="53" r="4" fill="#fff"/><circle cx="216" cy="53" r="4" fill="#fff"/>
  <path d="M150 100 Q160 116 170 100" fill="none" stroke="#D99772" stroke-width="5" stroke-linecap="round"/>
  <path d="${mouth}" fill="#6B1A2A" stroke="#E0697A" stroke-width="15" stroke-linejoin="round"/>
  <g clip-path="url(#cav-${uid})"><ellipse cx="${cx}" cy="${f1(botIn + 4)}" rx="${f1(W * 0.32)}" ry="${f1(H * 0.25 + 4)}" fill="#8F2B40"/>
  ${clipT ? `<path d="${tongue}" fill="#EF7D95" stroke="#C9506A" stroke-width="2"/>${groove}` : ''}${frenulum}${teeth}</g>
  ${clipT ? '' : `<path d="${tongue}" fill="#EF7D95" stroke="#C9506A" stroke-width="2.5"/>${groove}`}
  </svg>`;
}

/* ================= ВИД СБОКУ (в разрезе) =================
 язык задаётся точками: B (корень/спинка), M (середина), L (передняя часть), T (кончик), U (под кончиком), F (дно)
 губы: lp — вытянуты вперёд (0..1), sp — растянуты в улыбку (0..1) */
export const SIDE0 = { B: [112, 165], M: [160, 142], L: [205, 146], T: [232, 158], U: [226, 170], F: [205, 182], lp: 0, sp: 0.2 };

function smooth(pts) {
  // замкнутая кривая Катмулла-Рома через точки
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}

export function sideSVG(p, opt = {}) {
  const lp = p.lp || 0, sp = p.sp || 0;
  const tongue = smooth([[118, 232], [100, 200], p.B, p.M, p.L, p.T, p.U, p.F, [175, 205], [150, 232]]) + ' Z';
  const ux = 8 * lp - 5 * sp, lx = 8 * lp - 4 * sp;
  const upperLip = `M246 116 C${f1(258 + ux)} 118 ${f1(266 + ux * 1.3)} 128 ${f1(262 + ux * 1.3)} ${f1(136 + lp * 2)} C${f1(258 + ux)} ${f1(140 + lp * 2)} ${f1(252 + ux * 0.6)} 141 248 140 L244 124 Z`;
  const lowerLip = `M247 147 C${f1(253 + lx * 0.6)} 146 ${f1(260 + lx)} ${f1(146 - lp)} ${f1(262 + lx * 1.3)} ${f1(152 - lp)} C${f1(263 + lx * 1.3)} 160 ${f1(256 + lx)} 168 248 172 L243 160 Z`;
  const air = opt.air ? `<path d="${opt.air}" fill="none" stroke="${opt.warm ? '#F08A3C' : '#3E9BE0'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 9" class="airflow"/><path d="${opt.air}" fill="none" stroke="${opt.warm ? '#F08A3C' : '#3E9BE0'}" stroke-width="12" opacity=".15" stroke-linecap="round"/>` : '';
  const voice = opt.voiced ? `<g class="voicebuzz"><path d="M128 252 q6 -8 12 0 t12 0 t12 0" fill="none" stroke="#8A57D6" stroke-width="3.5" stroke-linecap="round"/></g><text x="176" y="257" font-size="12" fill="#8A57D6" font-weight="700">голос</text>` : '';
  const lab = opt.labels === false ? '' : `
    <text x="150" y="78" font-size="12" fill="#8C6A6A" font-weight="700">нёбо</text>
    <text x="214" y="96" font-size="11" fill="#8C6A6A" font-weight="700">бугорки</text><path d="M228 98 L232 110" stroke="#8C6A6A" stroke-width="1.5"/>
    <text x="268" y="200" font-size="11" fill="#8C6A6A" font-weight="700">зубы</text><path d="M268 196 L250 158" stroke="#8C6A6A" stroke-width="1.2" stroke-dasharray="2 2"/>
    <text x="130" y="196" font-size="13" fill="#fff" font-weight="800">язык</text>`;
  return `<svg viewBox="0 0 320 262" class="side-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="M64 0 L222 0 C238 20 244 44 241 60 L257 94 C265 103 262 111 250 112 L246 116 L244 124 L243 160 L248 172 C246 180 243 186 246 192 C252 208 240 224 214 228 L172 232 L162 262 L46 262 C8 200 8 70 64 0 Z" fill="#FBD5B5"/>
    <ellipse cx="200" cy="44" rx="7" ry="9" fill="#2B2D42"/><circle cx="202" cy="41" r="2.4" fill="#fff"/>
    <path d="M186 26 Q200 18 214 24" fill="none" stroke="#C9926C" stroke-width="4" stroke-linecap="round"/>
    <path d="M92 40 C70 38 64 70 74 88 C80 98 92 96 96 86" fill="#F6C29C" stroke="#E2A57E" stroke-width="3"/>
    <ellipse cx="236" cy="128" rx="12" ry="7" fill="#FF9E9E" opacity=".0"/>
    <path d="M241 124 C228 110 205 100 180 98 C150 96 125 101 104 113 C94 122 91 140 94 165 L100 232 L150 232 L232 178 L245 150 Z" fill="#7A2233"/>
    <path d="M244 122 C230 104 206 92 178 90 C150 88 124 94 100 108 L97 97 C124 82 150 78 178 80 C212 82 236 96 252 118 Z" fill="#F2A5A5"/>
    <path d="M244 122 C238 112 232 108 228 107" fill="none" stroke="#E07F86" stroke-width="5" stroke-linecap="round"/>
    <path d="M102 112 C96 118 94 124 96 132" fill="none" stroke="#E07F86" stroke-width="7" stroke-linecap="round"/>
    <path d="${tongue}" fill="#EC7690" stroke="#C24E68" stroke-width="2.5"/>
    <path d="M238 116 L250 119 L252 141 C250 144 245 144 243 141 L234 124 Z" fill="#fff" stroke="#C9CEDA" stroke-width="1.5"/>
    <path d="M236 172 L248 163 L250 147 C248 144 244 144 242 147 L232 162 Z" fill="#fff" stroke="#C9CEDA" stroke-width="1.5"/>
    <path d="${upperLip}" fill="#E36F7E"/><path d="${lowerLip}" fill="#E36F7E"/>
    ${air}${voice}${lab}
  </svg>`;
}

/* ================= АНИМАЦИЯ ================= */
export function interp(a, b, t) {
  const o = {};
  for (const k in a) {
    const x = a[k], y = b[k] === undefined ? x : b[k];
    o[k] = Array.isArray(x) ? [lerp(x[0], y[0], t), lerp(x[1], y[1], t)] : (typeof x === 'number' ? lerp(x, y, t) : x);
  }
  return o;
}
/** frames: [[время, параметры], ...]; возвращает функцию остановки */
export function animate(el, frames, base, draw, onTick) {
  const full = frames.map(([t, p]) => [t, Object.assign({}, base, p)]);
  for (let i = 1; i < full.length; i++) full[i][1] = Object.assign({}, full[i - 1][1], frames[i][1]);
  const dur = full[full.length - 1][0];
  let raf = 0, start = performance.now(), last = -1;
  const step = now => {
    const t = ((now - start) / 1000) % dur;
    let i = 0; while (i < full.length - 2 && t > full[i + 1][0]) i++;
    const [t0, a] = full[i], [t1, b] = full[i + 1];
    const k = t1 > t0 ? ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))) : 1;
    el.innerHTML = draw(interp(a, b, k));
    if (onTick) { const sec = Math.floor(t); if (sec !== last) { last = sec; onTick(t, i); } }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
