// GLUP — el mapa del pantano (selector de niveles y centro del viaje). Un panorama pintado que se
// desliza de lado siguiendo a Nila: el cielo pasa del atardecer del embarcadero a la noche de
// tormenta del nido, con cipreses lejanos, bruma y el río que serpentea con brillos, se mete en la
// colina por una boca de roca y vuelve a salir por el túnel del río subterráneo. Cada nivel es una
// maqueta viva (el embarcadero con su barca, los juncos con farolillos, las raíces en arco, el molino
// bajo la lluvia, la choza humeante del pescador, la turbera que burbujea, la cueva que brilla, el
// túnel que se traga el agua y el ciprés muerto de la Garza, que vuela en círculos entre relámpagos).
// Las pasarelas se encienden farol a farol al abrirse; lo que aún no se ha alcanzado duerme en la
// niebla. Cada sitio lleva su cartel de crías y, abajo, una placa de madera y pergamino cuenta el
// elegido: su vista, las crías en casa, el mejor tiempo y la medalla, el maestro y su truco, y los
// trucos que piden las crías escondidas. El nido está rodeado por un muro de zarzas que sólo abren
// las crías (requiere: { crias }). Al entrar, la cámara se acerca y un iris se cierra sobre Nila.
'use strict';
const Mapa = (() => {
  const M = MUNDO, OUT = '#140e18';
  const WW = 700, HOR = 70;                        // the world's width and its horizon (the screen is 320×180)
  const PANEL = { x: 4, y: 135, w: 312, h: 43 };
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, sm = v => { v = cl(v, 0, 1); return v * v * (3 - 2 * v); };
  const D = (x, y) => M.dith(x & 1023, y & 1023);
  // One place per level, in river order: where it stands (its ground), how tall it is, where Nila waits and where its sign goes.
  const NODES = [
    { x: 50, y: 124, icon: 'embarcadero', top: 32, stand: -25, sign: 41 }, { x: 118, y: 93, icon: 'juncos', top: 40, stand: 26, sign: -28 },
    { x: 186, y: 124, icon: 'raices', top: 52, stand: -27, sign: 29 }, { x: 256, y: 92, icon: 'molino', top: 52, stand: 29, sign: -30 },
    { x: 326, y: 124, icon: 'muelle', top: 34, stand: -31, sign: 35 }, { x: 396, y: 94, icon: 'turbera', top: 26, stand: 27, sign: -33 },
    { x: 476, y: 122, icon: 'cueva', top: 30, stand: 25, sign: -22, sy: 10 }, { x: 552, y: 101, icon: 'rio', top: 28, stand: 23, sign: -25 },
    { x: 640, y: 112, icon: 'nido', top: 98, stand: -32, sign: 38 }];
  const standOf = i => ({ x: NODES[i].x + NODES[i].stand, y: NODES[i].y + 5 });

  // ---------------------------------------------------------------- Geografía
  // The river's centre line by x (Catmull-Rom); between UNDER it runs inside the hill.
  const RIVER = [[-20, 110], [30, 107], [80, 110], [125, 106], [170, 110], [215, 107], [258, 111], [300, 107], [345, 110], [388, 107], [424, 111], [448, 112], [486, 110], [522, 105], [552, 106], [580, 110], [606, 114], [640, 117], [676, 113], [720, 110]];
  const UNDER = [436, 546], LAGOON = { x: 640, y: 116, rx: 52, ry: 11 }, ISLE = { x: 640, y: 113, rx: 25, ry: 6 };
  function riverY(x) {
    let i = 0; while (i < RIVER.length - 2 && RIVER[i + 1][0] < x) i++;
    const p = k => RIVER[cl(k, 0, RIVER.length - 1)], a = p(i - 1), b = p(i), c = p(i + 1), d = p(i + 2), t = cl((x - b[0]) / (c[0] - b[0]), 0, 1);
    return .5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t * t + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t * t * t);
  }
  const halfW = y => 3.5 + (y - HOR) * .1, under = x => x > UNDER[0] && x < UNDER[1];
  const inEll = (E, x, y) => ((x - E.x) / E.rx) ** 2 + ((y - E.y) / E.ry) ** 2 < 1;
  // Water at a point: 1 river, 2 the heron's lagoon (not its island).
  function wet(x, y) { if (inEll(LAGOON, x, y) && !inEll(ISLE, x, y)) return 2; if (under(x)) return 0; const r = riverY(x); return Math.abs(y - r) < halfW(r) ? 1 : 0; }
  // The hill the river runs under: its crest by x (999 = no hill), and where its foot meets the marsh.
  const HILL = [418, 582];
  function hillTop(x) { if (x <= HILL[0] || x >= HILL[1]) return 999; const u = (x - HILL[0]) / (HILL[1] - HILL[0]); return 126 - 76 * Math.pow(Math.sin(u * Math.PI), .75) + (M.noise(x / 7, 3, 9) - .5) * 7 + (M.noise(x / 2.5, 5, 9) - .5) * 2; }
  const hillFoot = x => 124 + Math.sin((x - HILL[0]) / 11) * 1.5;
  // The mood of the sky and the land along the river: 0 dusk at the jetty, 1 storm night at the nest.
  const tone = x => sm((x - 120) / 470);
  const PEAT = { x: 396, y: 94 };

  // ---------------------------------------------------------------- Paletas
  const WD = ['#24160f', '#3e2718', '#5c3c24', '#7e5634', '#a47444', '#c8965a'];   // wood, dark to light
  const ST = ['#1e1a26', '#2e2838', '#433b50', '#5a5068', '#766c84', '#9a90a8'];   // stone
  const LF = ['#12201a', '#1a2e22', '#243e2a', '#315234', '#44683c', '#5f8446'];   // leaves and grass
  const PT = ['#1a120e', '#271b14', '#36261a', '#473222', '#5a402a', '#6e5234'];   // peat and mud
  const BK = ['#1e1614', '#33261f', '#4a382c', '#624c3a', '#7e6448', '#9a7e5a'];   // cypress bark
  const RF = ['#2a1418', '#44201e', '#6a3024', '#8a4630', '#a8603c'];              // roof tiles
  const WA = ['#0e1a26', '#16283a', '#1f3a4c', '#2e5264', '#4a7a88', '#8cc0c0'];   // water
  const SKY_W = ['#1a1838', '#2c2650', '#4a2e5c', '#74406a', '#a4506a', '#d06a5c', '#ec945e', '#f6c070'];
  const SKY_S = ['#06070e', '#0b0e19', '#121626', '#1a1d31', '#23253c', '#2e2b44', '#3a3049', '#46364e'];
  const GR_W = ['#141e18', '#1b2a1f', '#243826', '#30482c', '#3e5a32', '#527038'], GR_C = ['#101816', '#16221f', '#1d2c28', '#263830', '#304638', '#3e5640'], GR_N = ['#15111b', '#1c1724', '#241d2c', '#2e2536', '#382e40', '#44384c'];
  const ramp = (a, b, k) => a.map((c, i) => M.mix(c, b[i], k));
  const landRamp = x => { const k = tone(x); return k < .5 ? ramp(GR_W, GR_C, k * 2) : ramp(GR_C, GR_N, (k - .5) * 2); };
  const INK = '#3a2418', INK2 = '#7a5a3a', INKR = '#a8342a', INKG = '#3e6a2a', INKY = '#9a6410', INKF = '#b09a74';
  const MEDAL = { bronce: ['#7a4424', '#c07a44', '#f0b27a'], plata: ['#5a6474', '#b8c4d0', '#f2f6fa'], oro: ['#7a5a14', '#f2c43a', '#fff4a8'], perfecto: ['#6a2a6a', '#f2c43a', '#ffffff'] };

  // ---------------------------------------------------------------- Capas pintadas una vez
  let L = null;
  function build() {
    if (L) return L;
    L = { sky: skyLayer(), far: farLayer(), ground: groundLayer(), tree: nestTree(), mist: mistStrip(24, .5, 3), low: mistStrip(18, .35, 8), panel: panelBack(), dio: {} };
    for (const n of NODES) if (n.icon !== 'nido') L.dio[n.icon] = diorama(n.icon);
    return L;
  }
  const SKY_K = .3, FAR_K = .55;
  // The sky: dusk ramp on the left, storm night on the right, dithered in both directions; a low sun, clouds and stars.
  function skyLayer() {
    const w = W + Math.ceil((WW - W) * SKY_K), h = HOR + 14, b = M.Buf(w, h), R = [0, .2, .4, .6, .8, 1].map(k => M.ramp(ramp(SKY_W, SKY_S, k), 26)), stars = [];
    const kOf = x => sm((x / w - .22) / .62), sun = { x: 64, y: HOR - 4, r: 12 };
    const cloud = (x, y) => { const k = kOf(x), n = M.noise(x / 24, y / 6, 3) * .62 + M.noise(x / 8, y / 3, 4) * .38, bandW = 1 - Math.abs(y - 34) / 11, bandS = 1 - y / 36; return n * .9 + (bandW * (1 - k) + bandS * k) * .55 - .62; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = kOf(x), ri = cl(Math.floor(k * 5 + D(x, y)), 0, 5), t = Math.min(1, y / (HOR + 4));
      let c = M.pick(R[ri], t, x, y);
      if (cloud(x, y) > 0) {
        const lit = cloud(x, y + 2) <= 0, top = cloud(x, y - 1) <= 0;
        c = lit ? M.mix('#ec9e7a', '#3c4260', k) : top ? M.mix('#6a4468', '#2a2c40', k) : M.mix('#4a3462', '#161a28', k);
      }
      M.put(b, x, y, c);
    }
    // The setting sun behind the far hills, with a dithered halo and a couple of purple streaks over it.
    for (let y = sun.y - 40; y < h; y++) for (let x = sun.x - 50; x < sun.x + 50; x++) {
      const d = Math.hypot(x - sun.x, (y - sun.y) * 1.2); if (y < 0 || x < 0) continue;
      if (d <= sun.r) M.put(b, x, y, M.pick([M.rgb('#f8b060'), M.rgb('#ffd88a'), M.rgb('#fff4d0')], cl(.9 - (x - sun.x + y - sun.y) / (sun.r * 3), 0, 1), x, y));
      else if (d < sun.r * 3.6) { const s = Math.pow(1 - (d - sun.r) / (sun.r * 2.6), 1.6), lv = Math.floor(s * 5 + D(x, y) * .999) / 5; if (lv > 0) M.put(b, x, y, '#ffc070', lv * .5); }
    }
    for (const [yy, x0, x1] of [[sun.y - 3, sun.x - 30, sun.x + 26], [sun.y + 2, sun.x - 18, sun.x + 38], [sun.y - 9, sun.x - 8, sun.x + 18]]) for (let x = x0; x < x1; x++) if (M.hash(x, yy, 3) < .85) M.put(b, x, yy, '#8a4a62');
    // Stars come out toward the night side.
    const r = ART.rng(71);
    for (let i = 0; i < 150; i++) { const x = r() * w | 0, y = (r() * r()) * 52 | 0, k = kOf(x); if (r() > k * 1.2 || cloud(x, y) > -.05) continue; const big = r() < .1; M.put(b, x, y, big ? '#ffffff' : M.mix(R[5][Math.round(y / (HOR + 4) * 25)], '#e8ecff', .5)); if (big || r() < .25) stars.push({ x, y, ph: r() * 6, sp: .03 + r() * .05 }); }
    const c = M.toCanvas(b); c.stars = stars; return c;
  }
  // A cypress silhouette into a pixel mask (1 wood, 3 leaves, 2 moss); used for the far trees and the marsh trees.
  function cypressMask(m, w, h, x0, gy, th, r) {
    const set = (x, y, v) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h && (v !== 2 || !m[y * w + x])) m[y * w + x] = v; };
    const tw = Math.max(1, th / 16), flare = tw * 1.4;
    for (let y = gy + 1; y >= gy - th * .85; y--) { const t = (gy - y) / th, half = tw / 2 + flare * Math.pow(Math.max(0, 1 - t * 3.5), 2); for (let x = Math.floor(x0 - half); x <= x0 + half; x++) set(x, y, 1); }
    const n = 3 + (th / 8 | 0);
    for (let k = 0; k < n; k++) {
      const t = .45 + k / n * .55, cy = gy - th * t, cx = x0 + (r() - .5) * th * .5 * (1.1 - t), rw = (2.5 + r() * 4) * Math.max(.8, th / 34), rh = 1.2 + r() * 1.6;
      for (let y = Math.floor(cy - rh); y <= cy + rh; y++) for (let x = Math.floor(cx - rw); x <= cx + rw; x++) { const e = ((x - cx) / rw) ** 2 + ((y - cy) / rh) ** 2; if (e < 1 && !(e > .6 && M.hash(x & 1023, y & 1023, 4) < .4)) set(x, y, 3); }
      for (let x = Math.floor(cx - rw * .7); x < cx + rw * .7; x++) if (r() < .35) { const len = 1 + r() * th / 8 | 0; for (let q = 1; q <= len; q++) set(x, cy + rh + q, 2); }
    }
  }
  // Colour a mask: rim light on top and left edges, a haze toward the fog colour below fogFrom; pal(x) = [body, rim, moss, fog].
  function colourMask(b, m, w, h, pal, fogFrom, fogK) {
    const cache = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = m[y * w + x]; if (!v) continue;
      const [body, rim, moss, fog] = cache[x >> 4] || (cache[x >> 4] = pal((x >> 4) * 16 + 8));
      const up = y > 0 ? m[(y - 1) * w + x] : 0, lf = x > 0 ? m[y * w + x - 1] : 0;
      let c = v === 2 ? moss : (!up || up === 2 || (!lf && (y & 1))) ? rim : v === 3 && D(x, y) < .3 ? M.mix(body, rim, .3) : body;
      if (fogK && y > fogFrom) c = M.mix(c, fog, Math.floor((y - fogFrom) / (h - fogFrom) * 4 + D(x, y) * .5) / 4 * fogK);
      M.put(b, x, y, c);
    }
  }
  // Far hills and a line of cypress silhouettes along the horizon, misty at their feet.
  function farLayer() {
    const w = W + Math.ceil((WW - W) * FAR_K), h = HOR + 8, b = M.Buf(w, h), m = new Uint8Array(w * h), r = ART.rng(19);
    const kOf = x => sm((x / w - .2) / .66);
    for (let x = 0; x < w; x++) {
      const k = kOf(x), y1 = HOR - 16 + Math.sin(x / 37) * 5 + Math.sin(x / 13 + 2) * 2 + (M.noise(x / 9, 1, 5) - .5) * 3, y2 = HOR - 8 + Math.sin(x / 23 + 1) * 3 + (M.noise(x / 6, 2, 5) - .5) * 2;
      for (let y = Math.max(0, Math.round(y1)); y < h; y++) M.put(b, x, y, M.mix(M.mix('#8a5270', '#262c3c', k), M.mix('#c88480', '#3e4a58', k), Math.floor((y - y1) / 20 * 4 + D(x, y) * .6) / 4 * .5));
      for (let y = Math.max(0, Math.round(y2)); y < h; y++) M.put(b, x, y, M.mix(M.mix('#6a4262', '#1c2230', k), M.mix('#c88480', '#3e4a58', k), Math.floor((y - y2) / 14 * 4 + D(x, y) * .6) / 4 * .45));
    }
    for (let x = 4; x < w; x += 9 + r() * 20) cypressMask(m, w, h, x, HOR + 2 + r() * 3, 12 + r() * 22, r);
    colourMask(b, m, w, h, x => { const k = kOf(x); return [M.mix('#4a3058', '#141a26', k), M.mix('#a06474', '#34404e', k), M.mix('#6a4a6a', '#24303a', k), M.mix('#c88480', '#3e4a58', k)]; }, HOR - 20, .55);
    return M.toCanvas(b);
  }
  // The marsh itself, the river, the pools, the hill over the underground river, the heron's lagoon and the marsh trees.
  function groundLayer() {
    const b = M.Buf(WW, H), rows = [];
    for (let x = 0; x < WW; x++) rows.push({ hy: Math.round(HOR + (M.noise(x / 30, 7, 2) - .5) * 4), gr: landRamp(x), k: tone(x), ry: riverY(x) });
    const water = (x, y, top, bot, k) => {
      const rel = (y - top) / Math.max(1, bot - top), band = 1 - Math.abs(rel - .5) * 2, hi = M.mix('#d88068', '#4a5a78', k);
      let c = M.pick(ramp(WA, ['#0a1016', '#0e1822', '#16222e', '#20303e', '#324452', '#56687a'], k), .15 + band * .45 + (rel < .25 ? -.15 : 0), x, y);
      if (band > .55 && M.hash(x >> 2, y, 6) < .5 && D(x, y) < (band - .55) * 1.6) c = M.mix(c, hi, .45);
      return c;
    };
    const pools = []; for (let i = 0; i < 26; i++) { const x = hash(i * 3 + 1) * WW, y = HOR + 8 + hash(i * 3 + 2) * 52, rx = 3 + hash(i * 3 + 3) * 7; pools.push({ x, y, rx, ry: rx * (.2 + (y - HOR) / 180) }); }
    const nearNode = (x, y, r) => NODES.some(n => Math.abs(x - n.x) < r && y > n.y - 30 && y < n.y + 10);
    for (let x = 0; x < WW; x++) {
      const R = rows[x], hw = halfW(R.ry);
      for (let y = R.hy; y < H; y++) {
        const d = (y - HOR) / (H - HOR), n = M.noise(x / 13, y / 3.5, 1) * .6 + M.noise(x / 4, y / 1.5, 2) * .4;
        let c = M.pick(R.gr, cl(.6 - d * .75 + (n - .5) * .9, 0, 1), x, y);
        const pd = Math.hypot(x - PEAT.x, (y - PEAT.y) * 2.2); if (pd < 30 + M.noise(x / 6, y / 3, 3) * 10) c = M.pick(PT.map(M.rgb), cl(.55 - d * .3 + (n - .5) * .8 - pd / 200, 0, 1), x, y);
        if (y < R.hy + 10) c = M.mix(c, M.mix('#b87478', '#3a4454', R.k), (1 - (y - R.hy) / 10) * .35);
        // Tufts: little bright blades in the grass.
        if (M.hash(x, y, 5) < .025 && d > .15) c = M.mix(R.gr[5], '#8aa050', .3 * (1 - R.k));
        M.put(b, x, y, c);
      }
      // Pools of standing water, away from the places and the river.
      for (const p of pools) { if (Math.abs(x - p.x) > p.rx || nearNode(p.x, p.y, 30) || Math.abs(p.y - R.ry) < hw + 6 || (p.x > HILL[0] - 8 && p.x < HILL[1] + 8)) continue; const hh = p.ry * Math.sqrt(1 - ((x - p.x) / p.rx) ** 2); for (let y = Math.round(p.y - hh); y <= p.y + hh; y++) M.put(b, x, y, y < p.y - hh + 1 ? M.mix(PT[4], '#000', .3) : water(x, y, p.y - hh, p.y + hh, R.k)); }
      // The river, with the mud face of the far bank above it and a grassy lip on the near side.
      if (!under(x)) {
        const top = Math.round(R.ry - hw), bot = Math.round(R.ry + hw);
        M.put(b, x, top - 2, M.mix(PT[3], '#000', .15 + R.k * .2)); M.put(b, x, top - 1, M.mix(PT[5], '#403040', R.k * .5));
        for (let y = top; y <= bot; y++) M.put(b, x, y, water(x, y, top, bot, R.k));
        M.put(b, x, top, M.mix(PT[1], WA[2], .5)); M.put(b, x, bot + 1, M.mix(R.gr[5], '#9ab060', .35 * (1 - R.k))); M.put(b, x, bot + 2, R.gr[2]);
      }
      // The lagoon round the heron's island.
      for (let y = LAGOON.y - LAGOON.ry; y <= LAGOON.y + LAGOON.ry; y++) if (inEll(LAGOON, x, y)) {
        if (inEll(ISLE, x, y)) { const e = ((x - ISLE.x) / ISLE.rx) ** 2 + ((y - ISLE.y) / ISLE.ry) ** 2; M.put(b, x, y, e > .75 && y > ISLE.y ? PT[2] : M.pick(GR_N.map(M.rgb), .7 - e * .5 - (y - ISLE.y) / 20, x, y)); }
        else M.put(b, x, y, water(x, y, LAGOON.y - LAGOON.ry, LAGOON.y + LAGOON.ry, 1));
      }
    }
    // Reeds and cattails along the banks.
    const r = ART.rng(33);
    for (let i = 0; i < 260; i++) {
      const x = r() * WW | 0; if (under(x) || nearNode(x, rows[x].ry, 20)) continue;
      const hw = halfW(rows[x].ry), side = r() < .5 ? -1 : 1, y = Math.round(rows[x].ry + side * (hw + 1 + r() * 3)), h = 2 + r() * (3 + (y - HOR) / 14) | 0, k = rows[x].k;
      for (let q = 0; q < h; q++) M.put(b, x, y - q, M.mix(q > h * .6 ? '#5a7a3a' : '#2e4a26', '#26303a', k * .8));
      if (r() < .4) { M.put(b, x, y - h, M.mix('#6a4428', '#2e2830', k)); M.put(b, x, y - h - 1, M.mix('#6a4428', '#2e2830', k)); }
    }
    // Marsh trees: small cypresses on the far ground, bigger nearer, never in front of a place.
    const tm = new Uint8Array(WW * H);
    for (let i = 0; i < 46; i++) {
      const x = 6 + r() * (WW - 12), y = HOR + 2 + Math.pow(r(), 1.6) * 34, th = 10 + (y - HOR) * .9 + r() * 10;
      if (NODES.some(n => Math.abs(x - n.x) < 28 && y > n.y - n.top - 10) || (x > HILL[0] - 6 && x < HILL[1] + 6) || inEll({ x: LAGOON.x, y: LAGOON.y, rx: LAGOON.rx + 8, ry: LAGOON.ry + 30 }, x, y) || Math.abs(y - riverY(x)) < halfW(riverY(x)) + 3) continue;
      cypressMask(tm, WW, H, x, y, th, r);
    }
    colourMask(b, tm, WW, H, x => { const k = tone(x); return [M.mix('#1c2a22', '#161420', k), M.mix('#7a7a52', '#4a4a66', k), M.mix('#5a6a58', '#3a3c4a', k), null]; }, 0, 0);
    // The hill: rock lit from the left, a mossy crest, strata and boulders; the river's way out on its left.
    for (let x = HILL[0]; x < HILL[1]; x++) {
      const top = hillTop(x), foot = hillFoot(x), slope = hillTop(x - 2) - hillTop(x + 2), k = tone(x);
      for (let y = Math.max(0, Math.round(top)); y < foot; y++) {
        const dd = y - top, N = (a, b) => M.noise(a / 6, b / 3.5, 7), n = N(x, y), gx = N(x - 1, y) - N(x + 1, y), gy = N(x, y - 1) - N(x, y + 1);
        const strata = Math.sin(y * .8 + M.noise(x / 12, y / 8, 13) * 6) > .75;
        let t = .36 + slope * .025 + (gx * 3 + gy * 2) * .45 + (n - .5) * .15 - dd / 150 + (strata ? -.14 : 0) + (n < .26 ? -.16 : 0);
        let c = M.pick(ST.slice(0, 5).map(M.rgb), cl(t, 0, 1), x, y);
        if (dd < 3 + M.noise(x / 3, 1, 8) * 3) c = dd < 1 ? M.mix(LF[5], '#6a6a8a', k * .6) : M.pick(ramp(LF, GR_N, k * .7), .6 - dd / 8, x, y);
        else if (dd < 34 && M.noise(x / 5, y / 3, 12) > .68) c = M.pick(ramp(LF, GR_N, k * .6), .4 + gx * 2, x, y);
        if (y > foot - 3) c = M.mix(c, '#0e0c14', .4);
        M.put(b, x, y, c);
      }
      if (M.hash(x, 0, 11) < .05) for (let q = 1; q < 3 + M.hash(x, 1, 11) * 4; q++) M.put(b, x, Math.round(top) - q, M.mix(LF[4], '#4a4a60', k * .6));
    }
    const ax = UNDER[0] + 2, ay = riverY(UNDER[0]) + 4;
    for (let y = ay - 12; y <= ay; y++) for (let x = ax - 9; x <= ax + 9; x++) { const e = ((x - ax) / 9) ** 2 + ((y - ay) / 12) ** 2; if (e > 1) continue; M.put(b, x, y, e > .62 ? (Math.floor(Math.atan2(y - ay, x - ax) * 4) % 2 ? ST[4] : ST[3]) : y > ay - 3 ? WA[1] : '#07060c'); }
    return M.toCanvas(b);
  }
  // The heron's dead cypress: a flared, twisted trunk, gnarled limbs, moss rags and the big nest on top.
  function nestTree() {
    const p = painter(150, 120, 75, 112), dk = '#1c1622', md = '#342a3e', lt = '#5a4a68', hi = '#8a7898';
    for (let y = 2; y > -88; y--) {
      const t = -y / 88, half = 3 + 3 * (1 - t) + 12 * Math.pow(Math.max(0, 1 - t * 3.2), 2.2), cx = Math.sin(t * 4) * 3;
      for (let x = Math.floor(cx - half); x <= cx + half; x++) { const s = (x - cx) / half; p.P(x, y, s < -.6 ? (D(x, y) < .5 ? hi : lt) : s < .1 ? (M.noise(x / 2, y / 5, 3) > .6 ? lt : md) : s < .7 ? md : dk); }
    }
    const r = ART.rng(404);
    for (const [t, side, len, up] of [[.3, -1, 30, .45], [.42, 1, 34, .3], [.55, -1, 26, .7], [.66, 1, 22, .85], [.78, -1, 16, .4], [.86, 1, 14, .6]]) {
      let x = Math.sin(t * 4) * 3, y = -88 * t, w = 4 * (1.1 - t * .6);
      for (let s = 0; s < len / 2; s++) { const nx = x + side * 2, ny = y - 2 * up + (r() - .5) * 2.2; p.Ln(x, y, nx, ny, md, Math.max(1, Math.round(w))); p.Ln(x, y - w / 2, nx, ny - w / 2, lt, 1); x = nx; y = ny; w *= .92; if (r() < .18) { let bx = x, by = y; for (let q = 0; q < 5; q++) { bx += side * (r() < .5 ? 1 : 0); by--; p.P(bx, by, md); } } }
      for (let q = 1; q < 4; q++) p.P(x + side * q, y - q, md);
      for (let q = 0; q < 5; q++) { const mx = x - side * (q * 3 + 2), l = 2 + r() * 7 | 0; for (let k = 1; k <= l; k++) p.P(mx, y + k + 1, k > l - 2 ? '#2a2a3a' : '#3e4052'); }
    }
    // Roots flaring into the island.
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.Ln(s * (6 + k * 3), -4 + k, s * (14 + k * 5), 2, k ? md : lt, 2);
    // The nest: a bowl of sticks sitting in the crown.
    const ny = -90;
    for (let y = ny - 5; y < ny + 7; y++) for (let x = -24; x <= 24; x++) { const e = (x / 23) ** 2 + ((y - ny) / 6) ** 2; if (e > 1 || y < ny - 2 + Math.abs(x) / 10) continue; p.P(x, y, (x * 3 + y * 5) % 7 === 0 ? '#8a6a4a' : (x - y) % 5 === 0 ? '#2a1a14' : y < ny ? '#6a4a34' : '#4a3226'); }
    for (let k = 0; k < 30; k++) { const a = r() * Math.PI, len = 6 + r() * 10, x0 = (r() - .5) * 40, y0 = ny - 2 + r() * 6, sx = r() < .5 ? 1 : -1; for (let s = 0; s < len; s++) p.P(x0 + Math.cos(a) * s * sx, y0 - Math.sin(a) * s * .3, s < 2 ? '#a07a52' : '#5a3e2a'); }
    return p.done();
  }
  // A band of mist, soft at the top and bottom, that tiles sideways.
  function mistStrip(h, alpha, seed) {
    const b = M.Buf(W, h), tau = Math.PI * 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
      const bell = Math.sin(y / h * Math.PI), wave = .6 + .4 * Math.sin(x / W * tau * 3 + seed + y * .15) * Math.sin(x / W * tau * 2 + seed), lv = Math.floor(bell * bell * wave * 4 + D(x, y) * .6) / 4;
      if (lv > 0) M.put(b, x, y, '#c8b8d0', alpha * lv);
    }
    return M.toCanvas(b);
  }

  // ---------------------------------------------------------------- Las maquetas de cada lugar
  // A small pixel painter over a buffer, with (0,0) at the anchor; done() draws the dark outline.
  function painter(w, h, ax, ay) {
    const b = M.Buf(w, h);
    const P = (x, y, c) => M.put(b, Math.round(ax + x), Math.round(ay + y), c);
    const R = (x, y, ww, hh, c) => { x = Math.round(x); y = Math.round(y); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) P(x + i, y + j, typeof c === 'function' ? c(x + i, y + j) : c); };
    const E = (cx, cy, rx, ry, f) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry, e = dx * dx + dy * dy; if (e <= 1) { const c = typeof f === 'function' ? f(dx, dy, e, x, y) : f; if (c) P(x, y, c); } } };
    const Ln = (x0, y0, x1, y1, c, wd = 1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5)); for (let i = 0; i <= n; i++) R(x0 + (x1 - x0) * i / n - (wd - 1) / 2, y0 + (y1 - y0) * i / n - (wd - 1) / 2, wd, wd, c); };
    return { b, P, R, E, Ln, done() { M.outline(b, OUT); const c = M.toCanvas(b); c.ax = ax; c.ay = ay; return c; } };
  }
  // Shading for a round thing lit from the top left: steps along a ramp, dithered.
  const lit = (rp, i0, k = 1.6) => (dx, dy, e, x, y) => rp[cl(Math.round(i0 + (-dx * .7 - dy * .9) * k + (D(x + 40, y + 40) - .5)), 0, rp.length - 1)];
  // A patch of ground: the top in `top`, a lip of earth showing at the front.
  function mound(p, cx, cy, rx, ry, top, lip) { p.E(cx, cy + 2, rx, ry, (dx, dy) => dy > .5 ? lip[1] : lip[2]); p.E(cx, cy, rx, ry, lit(top, 3)); }
  function diorama(id) {
    const p = painter(88, 80, 44, 66);
    switch (id) {
      case 'embarcadero': {
        mound(p, -6, 0, 19, 5, LF, PT);
        for (let k = 7; k >= 0; k--) { const y = -3 - k * 2, x0 = -1 + Math.round(k * .8); p.R(x0, y, 16, 1, k % 2 ? WD[4] : WD[3]); p.R(x0, y + 1, 16, 1, WD[2]); for (let q = 3; q < 16; q += 5) p.P(x0 + q, y, WD[2]); }
        p.R(-1, -1, 16, 2, WD[1]);
        for (const [x, y] of [[-1, -5], [14, -5], [4, -17], [19, -17]]) { p.R(x, y - 3, 2, 4, WD[2]); p.P(x, y - 3, WD[4]); }
        p.R(19, -32, 2, 15, WD[2]); p.R(19, -32, 1, 15, WD[3]); p.R(14, -32, 6, 1, WD[3]); p.R(14, -31, 1, 2, WD[1]); p.R(13, -29, 3, 4, '#2a2230'); p.R(13, -30, 3, 1, WD[1]);
        p.R(-21, -8, 6, 5, WD[3]); p.R(-21, -8, 6, 1, WD[5]); p.Ln(-21, -4, -16, -8, WD[2]); p.R(-15, -5, 4, 3, WD[2]);
        p.E(-10, -2, 3, 1.4, (dx, dy, e) => e > .4 ? '#b89868' : '#6a5030');
        break; }
      case 'juncos':
        mound(p, 0, 0, 18, 5, LF, PT);
        p.E(6, -1, 8, 2.2, (dx, dy) => dy < -.4 ? WA[1] : dy < .3 && dx < .2 ? WA[4] : WA[2]);
        p.E(3, -1, 2, 1, LF[5]); p.P(4, -1, WA[2]); p.E(9, -.5, 2, 1, LF[4]);
        p.E(-13, -1, 3, 2, lit(ST, 3)); p.E(-9, 0, 2, 1.2, lit(ST, 2));
        break;
      case 'raices': {
        mound(p, 0, 0, 23, 5, LF, PT);
        for (const s of [-1, 1]) { p.E(s * 9, 0, 5, 3, PT[0]); p.E(s * 16, 0, 2.5, 2, PT[0]); }
        for (let y = 0; y > -36; y--) { const half = 2.5 + 7 * Math.pow(Math.max(0, 1 - -y / 12), 2), cx = Math.sin(-y / 9) * .8; for (let x = Math.floor(cx - half); x <= cx + half; x++) { const s = (x - cx) / half; p.P(x, y, s < -.5 ? BK[5] : s < 0 ? BK[4] : s < .5 ? BK[3] : BK[2]); } }
        for (const s of [-1, 1]) for (const [cx, rx, ry, w] of [[9, 5.5, 8, 2], [16, 3, 4.5, 1.5]]) for (let a = 0; a <= Math.PI; a += .05) { const x = s * cx + Math.cos(a) * rx, y = -Math.sin(a) * ry; p.R(x - w / 2, y - w / 2, w, w, a < Math.PI / 2 === s > 0 ? BK[3] : BK[4]); p.P(x, y - 1, BK[5]); }
        for (const [x, h] of [[-22, 4], [21, 3], [-4, 2], [26, 2]]) for (let q = 0; q < h; q++) p.R(x - (h - q) / 3, -q, 1 + (h - q) / 1.5, 1, q === h - 1 ? BK[5] : BK[3]);
        const pads = [[-10, -35, 9, 4], [10, -36, 9, 4], [0, -40, 16, 6], [-4, -46, 9, 4], [5, -50, 6, 3]];
        for (const [cx, cy, rx, ry] of pads) p.E(cx, cy, rx, ry, (dx, dy, e, x, y) => e > .7 && M.hash(x & 1023, y & 1023, 3) < .35 ? null : lit(LF, 2.5, 2)(dx, dy, e, x, y));
        for (let x = -15; x <= 15; x += 2) { const l = 2 + Math.round(hash(x + 7) * 7), y0 = -35 + Math.round(Math.abs(x) / 5); for (let q = 0; q < l; q++) p.P(x, y0 + q, q > l - 2 ? '#5a6a50' : '#8a9a78'); }
        break; }
      case 'molino': {
        p.E(0, 0, 23, 5, (dx, dy, e, x, y) => e > .8 ? WA[1] : dy < -.2 && D(x, y) < .3 ? WA[4] : WA[2]);
        for (let y = -1; y > -31; y--) { const half = Math.round(8 - (-y / 30) * 2.5); for (let x = -half; x <= half; x++) { const row = Math.floor(-y / 3), mortar = (-y) % 3 === 0 || (x + row * 2 + 40) % 5 === 0; p.P(x, y, mortar ? ST[1] : x <= -half + 1 ? ST[5] : x < 0 ? ST[4] : x < half - 1 ? ST[3] : ST[2]); } }
        p.R(-7, -3, 15, 3, '#2a3a30'); p.R(-2, -9, 4, 7, '#0c0a10'); p.R(-2, -9, 4, 1, ST[5]); p.R(-1, -22, 2, 3, '#0c0a10'); p.R(-5, -15, 2, 2, '#0c0a10');
        for (let y = -31; y > -44; y--) { const half = Math.round(10 * (1 - (-y - 31) / 13)); for (let x = -half; x <= half; x++) p.P(x, y, x < -half * .4 ? RF[4] : x < half * .3 ? RF[3] : RF[1]); if (-y % 3 === 1) p.R(-half, y, half * 2 + 1, 1, RF[2]); }
        p.R(8, -9, 3, 7, WD[2]); p.R(8, -9, 3, 1, WD[4]);
        break; }
      case 'muelle': {
        mound(p, -8, 0, 18, 5, LF, PT);
        for (let k = 6; k >= 0; k--) { const y = -3 - k * 2, x0 = 2 + k; p.R(x0, y, 11, 1, k % 2 ? WD[4] : WD[3]); p.R(x0, y + 1, 11, 1, WD[2]); }
        p.R(2, -1, 11, 2, WD[1]); for (const [x, y] of [[2, -5], [12, -5], [8, -17], [18, -17]]) p.R(x, y - 3, 2, 4, WD[2]);
        for (let y = -12; y < -1; y++) for (let x = -23; x < -10; x++) p.P(x, y, x === -23 ? WD[5] : (x + 23) % 3 === 0 ? WD[2] : x > -13 ? WD[2] : WD[3]);
        p.R(-15, -8, 3, 6, WD[0]); p.R(-21, -9, 3, 3, '#1a1014');
        for (let y = -13; y > -21; y--) { const half = 9 - (-13 - y); p.R(-17 - half, y, half * 2 + 1, 1, y === -13 ? RF[1] : (y & 1) ? RF[3] : RF[2]); p.P(-17 - half, y, RF[4]); }
        p.R(-13, -22, 3, 5, ST[3]); p.R(-13, -22, 1, 5, ST[4]);
        p.Ln(12, -16, 21, -32, WD[3]); p.P(21, -33, WD[4]);
        p.R(-7, -7, 5, 6, WD[3]); p.R(-7, -6, 5, 1, ST[2]); p.R(-7, -3, 5, 1, ST[2]); p.R(-7, -7, 1, 6, WD[4]);
        for (let x = -24; x < -10; x += 2) for (let y = -3; y < 0; y++) if ((x + y) & 1) p.P(x, y, '#8a8a70');
        break; }
      case 'turbera': {
        mound(p, 0, 0, 21, 5, ['#1e140e', '#2e2016', '#3e2c1e', '#503a26', '#644a30', '#7a5a38'], PT);
        p.E(5, -1, 10, 2.6, (dx, dy, e, x, y) => e > .7 ? '#3a3a24' : dy < -.3 && D(x, y) < .4 ? '#4e5034' : e < .3 ? '#1a1c12' : '#262818');
        for (const [bx, by] of [[-19, -4], [-14, -4], [-9, -4], [-16.5, -7], [-11.5, -7], [-14, -10]]) { p.R(bx, by, 5, 3, '#3e2a1c'); p.R(bx, by, 5, 1, '#6a4c30'); p.R(bx + 4, by, 1, 3, '#2a1a12'); }
        p.Ln(-4, -17, -2, -4, WD[3]); p.R(-3, -5, 3, 3, ST[4]); p.P(-3, -5, ST[5]);
        p.R(15, -7, 3, 7, BK[3]); p.R(15, -7, 1, 7, BK[5]); p.P(18, -5, BK[3]); p.P(14, -8, BK[4]);
        break; }
      case 'cueva': {
        p.E(0, 1, 18, 4, lit(PT, 3));
        p.E(0, -10, 16, 15, (dx, dy, e, x, y) => y > 0 ? null : lit(ST, 2.6, 2)(dx, dy, e, x, y));
        for (const [cx, cy, rx, ry] of [[-13, -4, 5, 4], [13, -6, 5, 5], [-7, -22, 6, 3], [7, -21, 6, 3], [0, -25, 5, 2]]) p.E(cx, cy, rx, ry, lit(ST, 3, 2));
        p.E(0, -7, 9.5, 11, (dx, dy, e, x, y) => y > 0 ? null : e > .75 ? '#1a1224' : '#07050a');
        for (const [x, l] of [[-5, 3], [-2, 4], [2, 2], [5, 3]]) for (let q = 0; q < l; q++) p.P(x, -17 + q + Math.round(Math.abs(x) * .35), q === l - 1 ? '#8a7a64' : '#b8a88a');
        for (const [x, l] of [[-9, 3], [8, 4]]) for (let q = 0; q < l; q++) p.P(x, -12 + q, PT[3]);
        for (const [x, y] of [[-13, -2], [11, -1], [-9, -13]]) p.R(x, y, 1, 2, '#c8d8d0');
        break; }
      case 'rio': {
        p.E(0, 2, 16, 3.5, (dx, dy, e, x, y) => dy < -.3 && D(x, y) < .4 ? WA[4] : WA[2]);
        p.E(0, -9, 15, 14, (dx, dy, e, x, y) => {
          if (y > 0) return null; const a = Math.atan2(-dy, dx), seg = a / (Math.PI / 7), f = seg - Math.floor(seg);
          if (e < .5) return null; if (f < .12) return ST[1]; return Math.floor(seg) === 3 ? ST[5] : Math.floor(seg) % 2 ? ST[3] : ST[4]; });
        p.E(0, -7, 9, 10.5, (dx, dy, e, x, y) => y > 0 ? null : y > -3 ? WA[1] : e > .7 ? '#140e22' : '#06050c');
        p.R(-12, -19, 1, 4, WD[2]); p.R(-15, -19, 4, 1, WD[3]);
        for (let x = -12; x <= 12; x += 3) { const l = 1 + Math.round(hash(x + 3) * 3); for (let q = 0; q < l; q++) p.P(x, -22 + Math.round(Math.abs(x) * .45) + q, LF[q ? 3 : 5]); }
        break; }
    }
    const c = p.done(); c.shade = ART.tint(c, '#151322'); return c;
  }
  // Tiny helpers for the living bits, in the diorama's own coordinates.
  const RR = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function glow(g, x, y, r, c, a) { g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(.5, r), 0, 7); g.fill(); g.globalAlpha = a * 1.3; g.beginPath(); g.arc(x, y, Math.max(.5, r * .5), 0, 7); g.fill(); g.globalAlpha = 1; }
  function firefly(g, x, y, on) { if (!on) return; g.globalAlpha = .35; RR(g, x - 1, y - 1, 3, 3, '#ffe36a'); g.globalAlpha = 1; RR(g, x, y, 1, 1, '#fffbd0'); }
  function live(g, id, t, st) {
    const L0 = st.lit;
    switch (id) {
      case 'embarcadero': {
        const bob = Math.round(Math.sin(t / 22)); g.drawImage(Barca.sprite(), -46, -31 + bob);
        g.fillStyle = '#8cc0c0'; g.globalAlpha = .5; g.fillRect(-44 + ((t >> 3) % 4), -19, 5, 1); g.fillRect(-20 - ((t >> 3) % 3), -18, 4, 1); g.globalAlpha = 1;
        if (L0) { const f = .22 + Math.sin(t / 7) * .04 + (hash(t >> 2) - .5) * .05; glow(g, 14.5, -27, 10, '#ffc860', f); RR(g, 14, -28, 1, 2, '#fff2b0'); RR(g, 15, -28, 1, 2, '#ffcf5a'); glow(g, -45 + 4, -30 + bob, 5, '#ffc860', f * .8); }
        else RR(g, 14, -28, 2, 2, '#4a3a2a');
        break; }
      case 'juncos': {
        const tip = [];
        for (let k = 0; k < 11; k++) {
          const bx = -16 + k * 3.1 + (hash(k) - .5) * 2, h = k === 2 || k === 8 ? 38 : 17 + hash(k + 20) * 15, sw = Math.sin(t / 34 + k * .7) * 1.6 * h / 28, by = k % 3 === 1 ? 1 : 0;
          for (let s = 0; s < 3; s++) RR(g, bx + sw * (s / 3) ** 2, by - h * (s + 1) / 3, 1, Math.ceil(h / 3) + 1, s === 2 ? '#5a8a3a' : '#3a6a2a');
          if (k % 2 === 0) { RR(g, bx + sw - 1, by - h - 1, 3, 6, OUT); RR(g, bx + sw, by - h, 1, 4, '#7a4a28'); RR(g, bx + sw, by - h, 1, 1, '#a86a38'); }
          else { RR(g, bx + sw + 1, by - h * .6, 1, 3, '#4a7a30'); RR(g, bx + sw + 2, by - h * .6 - 2, 1, 2, '#4a7a30'); }
          if (k === 2 || k === 8) tip.push({ x: bx + sw * .8, y: by - h + 5 });
        }
        if (tip.length === 2) {
          const [a, b] = tip; g.fillStyle = '#2a1e1a';
          for (let s = 0; s <= 16; s++) { const u = s / 16; g.fillRect(Math.round(a.x + (b.x - a.x) * u), Math.round(a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * 5), 1, 1); }
          [.25, .5, .75].forEach((u, i) => {
            const x = Math.round(a.x + (b.x - a.x) * u + Math.sin(t / 20 + i) * .6), y = Math.round(a.y + (b.y - a.y) * u + Math.sin(u * Math.PI) * 5) + 1, col = ['#e8603a', '#f2c040', '#e87a9a'][i];
            if (L0) glow(g, x + 1, y + 3, 6, col, .18 + Math.sin(t / 9 + i) * .04);
            RR(g, x - 1, y, 6, 8, OUT); RR(g, x, y + 1, 4, 6, L0 ? col : '#4a3a3a'); RR(g, x, y + 1, 1, 6, L0 ? '#fff0c0' : '#5a4a4a'); RR(g, x, y + 3, 4, 1, 'rgba(40,20,20,.35)'); RR(g, x + 1, y - 1, 2, 1, '#2a1e1a');
          });
        }
        if (L0) for (let i = 0; i < 5; i++) firefly(g, Math.round(Math.sin(t / 40 + i * 2.1) * 16), Math.round(-12 - i * 4 + Math.cos(t / 31 + i) * 4), (t + i * 37) % 90 < 55);
        break; }
      case 'raices':
        if (L0) for (let i = 0; i < 3; i++) firefly(g, Math.round(Math.sin(t / 50 + i * 2) * 20), Math.round(-8 - i * 7 + Math.cos(t / 37 + i) * 3), (t + i * 41) % 100 < 60);
        { const k = (t % 240) / 240; if (k < .6) { const x = Math.round(-6 + Math.sin(k * 20) * 3 + k * 10), y = Math.round(-34 + k * 55); RR(g, x, y, 2, 1, '#6a8a40'); } }
        break;
      case 'molino': {
        const a0 = t * (L0 ? .03 : .008), hx = 0, hy = -31;
        for (let s = 0; s < 4; s++) {
          const a = a0 + s * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
          for (let d = 2; d < 21; d++) { RR(g, hx + ca * d, hy + sa * d, 1, 1, '#3a2418'); if (d > 5) for (let w = 1; w < 6; w++) RR(g, hx + ca * d - sa * w, hy + sa * d + ca * w, 1, 1, w === 5 || d === 20 ? '#6a5a48' : (d + w) % 4 === 0 ? '#8a7a64' : w === 1 ? '#f0e4c8' : '#c8b898'); }
        }
        RR(g, hx - 2, hy - 2, 4, 4, OUT); RR(g, hx - 1, hy - 1, 2, 2, WD[4]);
        const wa = -t * (L0 ? .05 : .012), wx = 13, wy = -3;
        g.fillStyle = OUT; for (let q = 0; q < 20; q++) { const a = q / 20 * Math.PI * 2; g.fillRect(Math.round(wx + Math.cos(a) * 6), Math.round(wy + Math.sin(a) * 6), 1, 1); }
        for (let q = 0; q < 6; q++) { const a = wa + q * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a); for (let d = 1; d < 7; d++) RR(g, wx + ca * d, wy + sa * d, 1, 1, d === 6 ? WD[4] : WD[2]); RR(g, wx + ca * 7 - 1, wy + sa * 7 - 1, 2, 2, WD[3]); }
        RR(g, wx - 1, wy - 1, 2, 2, ST[4]);
        g.globalAlpha = .9; RR(g, 4, 0, 18, 2, WA[2]); RR(g, 5, 0, 16, 1, WA[3]); g.globalAlpha = 1;
        if (L0 && (t >> 2) % 3) { RR(g, wx - 7, -1 - ((t >> 1) % 4), 1, 1, '#c8f2ea'); RR(g, wx + 6, -2 - ((t >> 2) % 3), 1, 1, '#c8f2ea'); }
        if (L0) { glow(g, 0, -21, 7, '#f2c46a', .2 + Math.sin(t / 5) * .05); RR(g, -1, -22, 2, 3, '#ffdc80'); RR(g, -5, -15, 2, 2, '#e8b050'); }
        for (let i = 0; i < 4; i++) { const k = (t + i * 23) % 40; if (k < 8) { g.fillStyle = '#9ab8c8'; g.globalAlpha = 1 - k / 8; const x = Math.round((hash(i + (t / 40 | 0)) - .5) * 36), y = Math.round(-1 + (hash(i + 9) - .5) * 6); g.fillRect(x - (k >> 1), y, 1 + (k >> 1) * 2, 1); g.globalAlpha = 1; } }
        break; }
      case 'muelle': {
        for (let i = 0; i < 6; i++) { const age = (t * .5 + i * 17) % 100, x = -12 + age * .14 + Math.sin(age / 9 + i) * 1.5, y = -24 - age * .3, r = 1 + age / 26; g.globalAlpha = .45 * (1 - age / 100); RR(g, x - r, y - r, r * 2 + 1, r * 2, '#a8a8b8'); g.globalAlpha = 1; }
        const bob = Math.sin(t / 16) * 1.2, fx = 27, fy = -15 + bob;
        g.globalAlpha = .7; g.fillStyle = '#d8d8e0'; for (let s = 0; s < 12; s++) { const u = s / 12; g.fillRect(Math.round(21 + (fx - 21) * u), Math.round(-33 + (fy - 33 + 33) * u + Math.sin(u * Math.PI) * 3), 1, 1); } g.globalAlpha = 1;
        RR(g, fx - 1, fy - 1, 3, 4, OUT); RR(g, fx, fy, 1, 1, '#ffffff'); RR(g, fx, fy + 1, 1, 1, '#e8503a');
        if ((t >> 4) % 3 === 0) { g.globalAlpha = .6; RR(g, fx - 3, Math.round(-12 + bob * .3), 7, 1, '#8cc0c0'); g.globalAlpha = 1; }
        if (L0) { glow(g, -20, -8, 7, '#ffcf5a', .2 + Math.sin(t / 8) * .04); RR(g, -21, -9, 3, 3, '#ffdc80'); RR(g, -20, -9, 1, 3, '#b8863a'); }
        break; }
      case 'turbera': {
        for (let i = 0; i < 3; i++) { const k = (t + i * 29) % 70, bx = 1 + i * 4, by = -1 - (i & 1); if (k < 36) { const r = Math.round(k / 14); RR(g, bx - r, by - r, r * 2 + 1, r + 1, '#5a5c3a'); RR(g, bx - r + 1, by - r, 1, 1, '#9a9c6a'); } else if (k < 44) { g.fillStyle = '#9a9c6a'; const d = k - 36; g.fillRect(bx - d, by - 1, 1, 1); g.fillRect(bx + d, by - 1, 1, 1); g.fillRect(bx, by - 1 - (d >> 1), 1, 1); } }
        for (let i = 0; i < 4; i++) { const age = (t * .4 + i * 25) % 100, x = -2 + i * 4 + Math.sin(age / 12 + i) * 2, y = -3 - age * .22; g.globalAlpha = .28 * Math.sin(age / 100 * Math.PI); RR(g, x, y, 2, 2, '#d8d8d0'); RR(g, x + 1, y - 2, 1, 2, '#d8d8d0'); g.globalAlpha = 1; }
        for (const [px, h] of [[10, 8], [13, 11], [-6, 7], [17, 6]]) { const sw = Math.round(Math.sin(t / 26 + px) * 1.3); RR(g, px, -h, 1, h - 1, '#6a7a3a'); RR(g, px - 1 + sw, -h - 2, 3, 3, OUT); RR(g, px + sw, -h - 1, 1, 1, '#f4f4ec'); RR(g, px - 1 + sw, -h - 1, 1, 1, '#d8d8cc'); }
        break; }
      case 'cueva': {
        const pulse = .5 + Math.sin(t / 18) * .5;
        if (L0) { g.globalAlpha = .3 + pulse * .15; g.fillStyle = '#2fa89a'; g.beginPath(); g.ellipse(0, -4, 8, 7, 0, 0, 7); g.fill(); g.globalAlpha = .35 + pulse * .2; g.fillStyle = '#8ff4e2'; g.beginPath(); g.ellipse(0, -3, 4, 3, 0, 0, 7); g.fill(); g.globalAlpha = .18; g.fillStyle = '#5fe8d6'; g.beginPath(); g.ellipse(0, 2, 14, 3, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
        for (const [x, y] of [[-13, -3], [11, -2], [-9, -14]]) { if (L0) glow(g, x + 1, y, 4, '#5fe8d6', .15 + pulse * .1); RR(g, x - 1, y - 1, 3, 2, L0 ? '#5fe8d6' : '#2a4a44'); RR(g, x - 1, y - 1, 1, 1, L0 ? '#e0fff8' : '#3a5a54'); }
        { const k = t % 70; if (k < 20) RR(g, 1, -17 + k * .75, 1, 2, '#9ad8d0'); else if (k < 26) { RR(g, 0, -2, 1, 1, '#9ad8d0'); RR(g, 2, -2, 1, 1, '#9ad8d0'); } }
        if (!L0 && (t % 200) < 180) { RR(g, -3, -8, 1, 1, '#e84a3a'); RR(g, 2, -8, 1, 1, '#e84a3a'); }
        break; }
      case 'rio': {
        g.fillStyle = '#b8e8f0';
        for (let i = 0; i < 6; i++) { const k = ((t * .02 + i / 6) % 1), s = i % 2 ? 1 : -1, x = Math.round(s * (14 - k * 12)), y = Math.round(3 - k * 5); g.globalAlpha = Math.sin(k * Math.PI) * .8; g.fillRect(x - 1, y, 2, 1); }
        g.globalAlpha = 1;
        if (L0) { glow(g, 0, -5, 6, '#62e4c8', .12 + Math.sin(t / 14) * .04); glow(g, -13, -13, 6, '#ffd070', .22 + Math.sin(t / 6) * .04); RR(g, -14, -15, 3, 3, OUT); RR(g, -13, -14, 1, 2, '#ffe890'); }
        else RR(g, -14, -15, 3, 3, '#3a2e2a');
        break; }
    }
  }
  // The wall of thorns round the heron's tree: twisted brambles with red thorns and a violet shimmer while it is enchanted;
  // open, it withers brown and parts where the path comes in. half: -1 the back of the ring, 1 the front.
  function thorns(g, t, open, half) {
    const n = 46, gap = 2.6;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, s = Math.sin(a); if ((s < 0) !== (half < 0)) continue;
      if (open && Math.abs(((a - gap + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) < .55) continue;
      const rx = 35 + Math.sin(k * 1.7) * 2, ry = 10 + Math.cos(k * 2.3), px = Math.round(Math.cos(a) * rx), py = Math.round(s * ry) + 2, h = 6 + Math.round(Math.abs(Math.sin(k * 1.3)) * 7) + (open ? -4 : 0);
      const stem = open ? '#4a3a2a' : k % 3 ? '#2a3a22' : '#20301c', hi = open ? '#6a5a40' : '#4a5e30';
      const lean = k % 2 ? 1 : -1; RR(g, px - 1, py - h - 1, 4, h + 2, OUT); RR(g, px + lean, py - h - 2, 3, 3, OUT); RR(g, px, py - h, 2, h, stem); RR(g, px, py - h, 1, h - 1, hi); RR(g, px + lean + 1, py - h - 1, 1, 1, stem);
      const cx = px + lean * 2; RR(g, cx - 1, py - h + 3, 3, 3, OUT); RR(g, cx, py - h + 4, 1, 1, stem); RR(g, px - lean * 2, py - (h >> 1), 2, 1, OUT);
      RR(g, px + (k % 2 ? 2 : -1), py - h + 2, 1, 1, open ? '#6a5040' : '#e0404e'); RR(g, px + (k % 2 ? -1 : 2), py - h + 6, 1, 1, open ? '#6a5040' : '#c8384a');
      if (k % 3 === 0) RR(g, px + 2, py - 2, 1, 1, open ? '#5a4a36' : '#c8384a');
      if (!open && (t + k * 13) % 90 < 4) { RR(g, px, py - h - 3, 1, 1, '#e8b8ff'); g.globalAlpha = .4; RR(g, px - 1, py - h - 4, 3, 3, '#b070e0'); g.globalAlpha = 1; }
    }
  }

  // ---------------------------------------------------------------- Movimiento, cámara y partículas
  const walk = { from: 0, to: 0, k: 1, hop: -1, dir: 1 }, shakeOf = {}, popOf = {}, cam = { x: 0 }, parts = [];
  let T = 0, lastSel = 0, entering = null, segLit = [];
  const lanternsOf = () => [.3, .72];   // where the lanterns stand along each path
  function openSegs(reached) { return NODES.map((n, j) => j < NODES.length - 1 && j + 1 <= reached); }
  function select(i) { walk.from = walk.to; walk.to = i; walk.k = 0; walk.hop = -1; popOf[i] = 14; entering = null; }
  function place(i) {
    walk.from = walk.to = i; walk.k = 1; entering = null; cam.x = camTarget(); parts.length = 0;
    const open = openSegs(Save.reached()); segLit = NODES.map((n, j) => open[j] && j < i ? 1 : 0);
  }
  function enter(i) { entering = { i }; Sound.play('glup', 1.1); }
  // The path between place j and j+1: a curve from stand to stand, over the hill for the underground river.
  function segCtrl(j) { const a = standOf(j), b = standOf(j + 1); return j === 6 ? { x: (a.x + b.x) / 2 - 4, y: 56 } : { x: (a.x + b.x) / 2 + (j % 2 ? 10 : -10), y: (a.y + b.y) / 2 + (j === 7 ? 8 : 0) }; }
  function segPt(j, u) { const a = standOf(j), b = standOf(j + 1), c = segCtrl(j), v = 1 - u; return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y }; }
  function nilaPos() {
    const a = walk.from, b = walk.to, k = walk.k;
    if (a === b || k >= 1) { const s = standOf(b); return { x: s.x, y: s.y, lift: 0, ph: 1, moving: false, dir: NODES[b].stand > 0 ? 1 : -1 }; }
    const e = k * k * (3 - 2 * k), n = Math.abs(b - a), s = e * n, j = Math.min(n - 1, Math.floor(s)), u = s - j, fw = b > a;
    const seg = fw ? a + j : a - j - 1, uu = fw ? u : 1 - u, p = segPt(seg, uu), q = segPt(seg, cl(uu + (fw ? .02 : -.02), 0, 1));
    const hops = s * 4, ph = hops - Math.floor(hops);
    if (Math.abs(q.x - p.x) > .05) walk.dir = q.x > p.x ? 1 : -1;
    return { x: p.x, y: p.y, lift: Math.sin(ph * Math.PI) * 5, ph, hop: Math.floor(hops), moving: true, dir: walk.dir };
  }
  const camTarget = () => { const np = nilaPos(), n = NODES[walk.to]; return cl(np.x + (n.x - np.x) * .35 - W / 2, 0, WW - W); };
  function update() {
    T++;
    if (walk.k < 1) { const n = Math.max(1, Math.abs(walk.to - walk.from)); walk.k = Math.min(1, walk.k + .035 / Math.sqrt(n)); }
    for (const k in shakeOf) if (--shakeOf[k] <= 0) delete shakeOf[k];
    for (const k in popOf) if (--popOf[k] <= 0) delete popOf[k];
    const np = nilaPos();
    // Every landing of a hop kicks up a puff of dust (a splash on a bridge).
    if (np.moving && np.hop !== walk.hop) { if (walk.hop >= 0) { const w = wet(np.x, np.y + 1); for (let i = 0; i < 4; i++) parts.push({ x: np.x + (i - 1.5) * 2, y: np.y, vx: (i - 1.5) * .35, vy: -.3 - hash(T + i) * .5, life: 14, max: 14, c: w ? '#b8e8f0' : '#c8b090' }); Sound.play('step'); } walk.hop = np.hop; }
    if (!np.moving && walk.hop >= 0 && walk.k >= 1) { walk.hop = -1; for (let i = 0; i < 6; i++) parts.push({ x: np.x + (i - 2.5) * 2, y: np.y, vx: (i - 2.5) * .4, vy: -.4, life: 16, max: 16, c: '#c8b090' }); }
    cam.x += (camTarget() - cam.x) * .1;
    // Lanterns light up one by one along a newly open path (as Nila passes them, if she walks it).
    const open = openSegs(Save.reached());
    for (let j = 0; j < segLit.length; j++) {
      if (!open[j]) { segLit[j] = 0; continue; } if (segLit[j] >= 1) continue;
      const before = segLit[j], along = walk.k < 1 && walk.from === j && walk.to === j + 1;
      segLit[j] = Math.min(1, along ? Math.max(before, walk.k * 1.05) : before + .025);
      for (const u of lanternsOf(j)) if (before < u && segLit[j] >= u) { const p = segPt(j, u); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; parts.push({ x: p.x + 3, y: p.y - 9, vx: Math.cos(a) * .8, vy: Math.sin(a) * .8 - .3, life: 18, max: 18, c: i % 2 ? '#ffe36a' : '#fff6d6' }); } Sound.play('text'); }
    }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += .03; p.vx *= .94; if (--p.life <= 0) parts.splice(i, 1); }
  }
  const walking = () => walk.k < 1;
  function shake(i) { shakeOf[i] = 16; }
  // Secrets still waiting in a place: for each trick, how many crías it hides (only while some crías are missing).
  function secretsOf(i) { const lv = LEVELS[i]; if (Save.criasGot(i) >= Save.criasTotal(i)) return []; return (lv.secretos || []).filter(s => s.crias > 0); }
  const callBack = i => i <= Save.reached() && !(LEVELS[i].requiere) && secretsOf(i).some(s => Game.has(s.poder));
  // The medal the place has earned so far (the same rule as the tally), from the best time and the crías at home.
  function medalOf(i) {
    const lv = LEVELS[i], best = Save.data.best[lv.id]; if (best === undefined) return null;
    const all = Save.criasTotal(i), ratio = all ? Save.criasGot(i) / all : 1, fast = best <= (lv.par || 200);
    return ratio >= 1 && fast ? 'perfecto' : ratio >= 1 || (ratio >= .75 && fast) ? 'oro' : ratio >= .5 ? 'plata' : 'bronce';
  }

  // ---------------------------------------------------------------- Dibujo del mundo
  let wbuf = null;
  const still = () => typeof Game !== 'undefined' && Game.still;
  // Lightning over the nest: a flash every few seconds, now and then a double one.
  function bolt(t) { const n = Math.floor(t / 250), ph = t % 250; if (still()) return null; const on = ph < 3 || (hash(n) < .5 && ph > 6 && ph < 9); return on || ph < 14 ? { on, k: ph < 14 ? 1 - ph / 14 : 0, x: 600 + hash(n + 3) * 90, seed: n } : null; }
  function drawWorld(g, t, sel, reached) {
    const cx = Math.round(cam.x), Lr = L, lb = bolt(t);
    g.drawImage(Lr.sky, -Math.round(cx * SKY_K), 0);
    for (const s of Lr.sky.stars) { const a = Math.sin(t * s.sp + s.ph); if (a > .6) { const x = s.x - Math.round(cx * SKY_K); g.globalAlpha = (a - .6) * 2.4; RR(g, x - 1, s.y, 3, 1, '#ffffff'); RR(g, x, s.y - 1, 1, 3, '#ffffff'); g.globalAlpha = 1; } }
    // Birds crossing the warm side of the sky.
    for (let i = 0; i < 3; i++) { const x = ((t * .35 + i * 150) % 520) - 60 - cx * .2, y = 24 + i * 9 + Math.sin(t / 30 + i) * 3, f = ((t >> 3) + i) % 2; if (x < -8 || x > W) continue; g.fillStyle = '#2a1a2e'; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillRect(Math.round(x) - 2, Math.round(y) - 1 + f, 2, 1); g.fillRect(Math.round(x) + 1, Math.round(y) - 1 + f, 2, 1); }
    // Lightning behind the far trees, over the nest.
    if (lb) {
      const sx = Math.round(lb.x - cx * .9);
      g.globalAlpha = lb.k * .35; g.fillStyle = '#b8b0e8'; g.fillRect(Math.max(0, sx - 160), 0, 320, HOR + 8); g.globalAlpha = 1;
      if (lb.on) { const r = ART.rng(lb.seed * 7 + 1); let x = sx, y = 0; g.fillStyle = '#f4f0ff'; while (y < HOR - 6) { const ny = y + 3 + (r() * 6 | 0), nx = x + (r() * 7 | 0) - 3; for (let k = 0; k <= ny - y; k++) g.fillRect(Math.round(x + (nx - x) * k / (ny - y)), y + k, 1, 1); x = nx; y = ny; if (r() < .2) { let bx = x, by = y; for (let q = 0; q < 7; q++) { bx += r() < .5 ? -1 : 1; by++; g.fillRect(bx, by, 1, 1); } } } }
    }
    g.drawImage(Lr.far, -Math.round(cx * FAR_K), 0);
    const mist = (c, y, k, drift, a) => { const w = c.width, ox = -Math.floor(((cx * k + drift) % w + w) % w); g.globalAlpha = a; for (let x = ox; x < W; x += w) g.drawImage(c, x, y); g.globalAlpha = 1; };
    mist(Lr.mist, HOR - 12, .6, t * .08, .6);
    g.drawImage(Lr.ground, -cx, 0);
    // The river shimmers, drifting down toward the jetty; the lagoon ripples.
    for (let i = 0; i < 70; i++) {
      const x = ((hash(i) * WW - t * (.12 + hash(i + 1) * .12)) % WW + WW) % WW; if (under(x) || x < cx - 4 || x > cx + W + 4) continue;
      const ry = riverY(x), hw = halfW(ry), y = Math.round(ry + (hash(i + 4) - .45) * hw * 1.4), len = 1 + (hash(i + 5) * 3 | 0), k = tone(x);
      g.globalAlpha = .5 + Math.sin(t / 12 + i) * .3; RR(g, x - cx, y, len, 1, hash(i + 2) < .5 ? M.css(M.mix('#f0c090', '#8aa0c0', k)) : M.css(M.mix('#ffe8c0', '#c8d8f0', k)));
    }
    for (let i = 0; i < 14; i++) { const a = hash(i + 50) * Math.PI * 2, rr = .55 + hash(i + 51) * .4, x = LAGOON.x + Math.cos(a) * LAGOON.rx * rr + Math.sin(t / 40 + i) * 3, y = LAGOON.y + Math.sin(a) * LAGOON.ry * rr; if (inEll(ISLE, x, y)) continue; g.globalAlpha = .3 + Math.sin(t / 15 + i * 2) * .25; RR(g, x - cx, y, 3, 1, '#a8b8e0'); }
    g.globalAlpha = 1;
    drawPaths(g, t, cx, reached);
    // The places and Nila, back to front.
    const np = nilaPos(), items = NODES.map((n, i) => ({ y: n.y, i }));
    items.push({ y: np.y + .5, nila: true }); items.sort((a, b) => a.y - b.y);
    for (const it of items) if (it.nila) drawNila(g, np, t, cx); else drawPlace(g, it.i, t, cx, sel, reached, lb);
    // Rain over the mill and the bog; fireflies; the dust of Nila's hops; low mist on the water.
    g.fillStyle = '#9ab0c8'; g.globalAlpha = .3;
    for (let i = 0; i < 60; i++) { const x = 206 + hash(i + 70) * 230 + ((t * .8) % 12), y = (hash(i + 71) * 150 + t * 3.2 * (.8 + hash(i + 72) * .4)) % 150 - 10, sx = Math.round(x - cx - y * .15); if (sx < -2 || sx > W + 2 || y > 132 || y < 24) continue; g.fillRect(sx, Math.round(y), 1, 3); }
    g.globalAlpha = 1;
    for (let i = 0; i < 28; i++) { const hx = hash(i + 90) * WW, hy = HOR + 18 + hash(i + 91) * 44, x = hx + Math.sin(t / 60 + i * 3) * 10 - cx, y = hy + Math.sin(t / 43 + i) * 5; if (x < -2 || x > W + 2 || tone(hx) > .85) continue; firefly(g, Math.round(x), Math.round(y), (t + i * 53) % 120 < 70); }
    for (const p of parts) { g.globalAlpha = p.life / p.max; RR(g, p.x - cx, p.y, 1, 1, p.c); } g.globalAlpha = 1;
    mist(Lr.low, 97, 1, t * .15, .35);
    // Arrows at the edges when there are places out of sight.
    const bob = Math.round(Math.sin(t / 8) * 1.5);
    if (cx > 6) arrow(g, 4 - bob, 100, -1); if (cx < WW - W - 6) arrow(g, W - 5 + bob, 100, 1);
  }
  function arrow(g, x, y, s) { for (let k = 0; k < 4; k++) { RR(g, x + s * k, y - 4 + k, 1, 9 - k * 2, OUT); } for (let k = 0; k < 3; k++) RR(g, x + s * k, y - 2 + k, 1, 5 - k * 2, '#f2c46a'); }
  function drawPaths(g, t, cx, reached) {
    const open = openSegs(reached);
    for (let j = 0; j < NODES.length - 1; j++) {
      const a = standOf(j), b = standOf(j + 1); if (Math.max(a.x, b.x) < cx - 10 || Math.min(a.x, b.x) > cx + W + 10) continue;
      let len = 0, prev = segPt(j, 0); for (let s = 1; s <= 20; s++) { const q = segPt(j, s / 20); len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
      const n = Math.max(4, Math.round(len / 3.2));
      if (!open[j]) { g.fillStyle = '#2a2632'; for (let s = 2; s < n - 1; s += 2) { const p = segPt(j, s / n); g.fillRect(Math.round(p.x - cx), Math.round(p.y), 2, 1); } continue; }
      let rope = null;
      for (let s = 1; s < n; s++) {
        const p = segPt(j, s / n), x = Math.round(p.x - cx), y = Math.round(p.y), wt = wet(p.x, p.y + 1), hill = p.x > HILL[0] && p.x < HILL[1] && p.y < hillFoot(p.x) - 1;
        if (hill) { RR(g, x - 1, y - 1, 4, 3, OUT); RR(g, x, y, 2, 1, s % 2 ? ST[4] : ST[3]); RR(g, x, y - 0, 1, 1, ST[5]); continue; }
        if (wt) { RR(g, x - 1, y, 1, 4, WD[0]); if (s % 3 === 0) { RR(g, x, y - 5, 1, 5, WD[1]); } if (rope) { g.fillStyle = '#a08060'; const d = Math.max(1, Math.abs(x - rope.x)); for (let q = 0; q <= d; q++) g.fillRect(Math.round(rope.x + (x - rope.x) * q / d), Math.round(rope.y + (y - 5 - rope.y) * q / d), 1, 1); } rope = { x, y: y - 5 }; }
        else rope = null;
        RR(g, x - 2, y - 1, 5, 3, OUT); RR(g, x - 1, y, 3, 1, s % 2 ? WD[4] : WD[3]); RR(g, x - 1, y - 1 + 1, 1, 1, WD[5]);
      }
      for (const u of lanternsOf(j)) {
        const p = segPt(j, u), x = Math.round(p.x - cx) + 3, y = Math.round(p.y), on = segLit[j] >= u;
        if (on) glow(g, x, y - 9, 7, '#ffc860', .2 + Math.sin(t / 7 + j) * .04);
        RR(g, x - 1, y - 11, 3, 12, OUT); RR(g, x, y - 8, 1, 8, WD[3]); RR(g, x - 1, y - 11, 3, 3, on ? '#ffdc80' : '#3a3040'); RR(g, x, y - 10, 1, 1, on ? '#fff6d6' : '#4a4050');
      }
    }
  }
  function drawNila(g, np, t, cx) {
    const air = np.moving && np.ph > .12 && np.ph < .9, spr = !np.moving ? ART.nila.idle[(t % 180) < 6 ? 1 : 0] : !air ? ART.nila.idle[2] : np.ph < .5 ? ART.nila.jump : ART.nila.fall;
    const land = np.moving && !air, sx = land ? 1.14 : air ? .94 : 1, sy = land ? .86 : air ? 1.06 : 1 + Math.sin(t / 30) * .012;
    const x = Math.round(np.x - cx), y = Math.round(np.y);
    g.globalAlpha = .35; g.fillStyle = '#05040a'; g.beginPath(); g.ellipse(x + 2, y + 1, Math.max(1, 7 - np.lift * .6), 1.6, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    g.save(); g.translate(x, Math.round(y - np.lift)); g.scale(np.dir * sx, sy); Player.drawCarry(g, -5, -18, spr, ART.fish.closed, np.moving ? 0 : (t >> 5) % 2); g.restore();
  }
  function drawPlace(g, i, t, cx, sel, reached, lb) {
    const n = NODES[i], lv = LEVELS[i]; if (!lv) return;
    const far = i > reached, cur = i === sel, wall = !!(lv.requiere && lv.requiere.crias), shut = wall && Save.locked(i), done = Save.data.best[lv.id] !== undefined;
    const sh = shakeOf[i] ? Math.round(Math.sin(shakeOf[i] * 1.7) * 2) : 0, x = Math.round(n.x - cx + sh), y = n.y;
    if (x < -90 || x > W + 90) return;
    const pk = popOf[i] ? popOf[i] / 14 : 0, s = 1 + Math.sin(pk * Math.PI) * .12;
    // The selected place: a warm glow on the ground and a ring of fireflies.
    if (cur) { g.globalAlpha = .16 + Math.sin(t / 10) * .05; g.fillStyle = '#ffd070'; g.beginPath(); g.ellipse(x, y, i === 8 ? 40 : 24, i === 8 ? 12 : 7, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.save(); g.translate(x, y); if (s !== 1) g.scale(s, s);
    if (i === 8) drawNest(g, t, far, shut, lb, cx);
    else {
      const c = L.dio[n.icon];
      g.drawImage(c, -c.ax, -c.ay); if (far) { g.globalAlpha = .82; g.drawImage(c.shade, -c.ax, -c.ay); g.globalAlpha = 1; }
      if (!far) live(g, n.icon, t, { lit: true, done });
      else for (let k = 0; k < 3; k++) { g.globalAlpha = .16; g.fillStyle = '#8a86a8'; g.beginPath(); g.ellipse(Math.sin(t / 70 + k * 2) * 8 + (k - 1) * 10, -8 - k * 7, 16 - k * 3, 5, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    g.restore();
    if (cur) {
      for (let k = 0; k < 7; k++) { const a = t / 26 + k / 7 * Math.PI * 2, rx = i === 8 ? 40 : 24, fx = x + Math.cos(a) * rx, fy = y - 6 + Math.sin(a) * (i === 8 ? 10 : 7) - Math.sin(t / 9 + k) * 2; firefly(g, Math.round(fx), Math.round(fy), (t + k * 9) % 40 < 34); }
      const ay = y - n.top - 8 + Math.round(Math.sin(t / 7) * 2);
      RR(g, x - 4, ay - 1, 9, 3, OUT); RR(g, x - 3, ay + 2, 7, 2, OUT); RR(g, x - 2, ay + 4, 5, 1, OUT); RR(g, x - 1, ay + 5, 3, 1, OUT);
      RR(g, x - 3, ay, 7, 1, '#fff2b0'); RR(g, x - 2, ay + 1, 5, 2, '#f2c46a'); RR(g, x - 1, ay + 3, 3, 1, '#d8962a'); RR(g, x, ay + 4, 1, 1, '#d8962a');
    }
    if (!far || wall) signpost(g, i, x + n.sign, y + (n.sy || 4), t, far);
  }
  function drawNest(g, t, far, shut, lb, cx) {
    thorns(g, t, !shut, -1);
    const tr = L.tree; g.drawImage(tr, -tr.ax, -tr.ay);
    if (lb && lb.k > .4) { g.globalAlpha = (lb.k - .4) * .7; g.drawImage(ART.tint(tr, '#d8d0ff'), -tr.ax, -tr.ay); g.globalAlpha = 1; }
    // The crías caught in the nest peek over its rim.
    for (let k = 0; k < 3; k++) { const bx = -8 + k * 7, by = -96 + Math.round(Math.sin(t / 12 + k * 2)); RR(g, bx - 1, by - 1, 4, 4, OUT); RR(g, bx, by, 2, 2, '#e0c86a'); RR(g, bx, by, 1, 1, '#fff6d6'); }
    thorns(g, t, !shut, 1);
    // La Garza circles over her tree.
    const a = t * .018, hx = Math.cos(a) * 48, hy = -74 + Math.sin(a) * 10;
    Boss.figura(g, { x: hx, y: hy, t, dir: Math.sin(a) > 0 ? -1 : 1, scale: .55, tint: lb && lb.on ? '#120c1a' : undefined, state: 'return' });
    if (far) { g.globalAlpha = .2; g.fillStyle = '#6a6a88'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(Math.sin(t / 80 + k) * 10 + (k - 1) * 20, -10 - k * 10, 24, 6, 0, 0, 7); g.fill(); } g.globalAlpha = 1; }
  }
  // The wooden sign of a place: its number on a wax seal and the crías at home; a pennant once beaten,
  // a star with every cría home, and a bouncing "!" when Bigotes now knows a trick for the ones still hidden.
  function signpost(g, i, x, y, t, far) {
    const lv = LEVELS[i], wall = !!(lv.requiere && lv.requiere.crias), got = Save.criasGot(i), all = Save.criasTotal(i), done = Save.data.best[lv.id] !== undefined;
    const shut = wall && Save.locked(i), txt = wall ? Save.gateCount(i) + '/' + lv.requiere.crias : got + '/' + all, tw = ART.textWidth(txt), w = tw + 14, bx = Math.round(x - w / 2), by = y - 14;
    RR(g, x - 1, by + 2, 3, 13, OUT); RR(g, x, by + 3, 1, 11, WD[2]);
    if (done) { const f = Math.round(Math.sin(t / 6)); RR(g, x - 1, by - 8, 2, 10, OUT); RR(g, x, by - 8, 1, 9, WD[3]); RR(g, x + 1, by - 8, 5, 3, OUT); RR(g, x + 1, by - 7, 4, 1, got >= all ? '#f2c46a' : '#e8503a'); RR(g, x + 1, by - 6, 3 + f, 1, got >= all ? '#d8962a' : '#b8302a'); }
    RR(g, bx - 1, by - 1, w + 2, 11, OUT); RR(g, bx, by, w, 9, WD[3]); RR(g, bx, by, w, 1, WD[4]); RR(g, bx, by + 8, w, 1, WD[1]); RR(g, bx + 2, by + 4, w - 4, 1, WD[2]);
    if (wall) thornIcon(g, bx + 4, by + 4, shut);
    else { RR(g, bx + 1, by + 1, 7, 7, '#6a1a18'); RR(g, bx + 2, by + 1, 5, 7, '#b8342a'); RR(g, bx + 1, by + 2, 7, 5, '#b8342a'); RR(g, bx + 2, by + 2, 2, 1, '#e8685a'); ART.text(g, String(i + 1), bx + 5, by + 1, '#fff0d0', 'center'); }
    ART.text(g, txt, bx + 10, by + 1, wall ? (shut ? '#ffb0b0' : '#ffe36a') : got >= all ? '#ffe36a' : '#fff0d0', 'left', '#2a1a10');
    if (!wall && got >= all && all > 0) { const sx = bx + w - 1, sy = by - 2, tw2 = (t >> 3) % 2; RR(g, sx - 1, sy, 3, 3, '#fff2b0'); RR(g, sx, sy - 1 - tw2, 1, 5 + tw2 * 2, '#f2c46a'); RR(g, sx - 1 - tw2, sy + 1, 3 + tw2 * 2, 1, '#f2c46a'); }
    if (!far && callBack(i)) { const hx = bx + w - 1, hy = by - 10 - Math.round(Math.abs(Math.sin(t / 9)) * 3); RR(g, hx - 2, hy - 1, 5, 9, OUT); RR(g, hx - 1, hy, 3, 7, '#ffe36a'); RR(g, hx, hy + 1, 1, 3, '#8a4a10'); RR(g, hx, hy + 5, 1, 1, '#8a4a10'); RR(g, hx - 1, hy, 1, 1, '#fff6d6'); }
  }
  function thornIcon(g, x, y, shut) {
    for (let k = 0; k < 7; k++) { const px = x - 3 + k + Math.round(Math.sin(k * 2) * .6), py = y - 2 + Math.round(Math.sin(k * 1.3) * 2); RR(g, px - 1, py - 1, 3, 3, OUT); RR(g, px, py, 2, 2, shut ? '#3a4a2a' : '#4a4030'); if (k % 2) RR(g, px + 1, py - 1, 1, 1, shut ? '#e0404e' : '#6a5040'); }
  }

  // ---------------------------------------------------------------- La placa
  // The plaque behind the card: a wooden frame with nails round a sheet of parchment (painted once).
  function panelBack() {
    const P = PANEL, b = M.Buf(P.w, P.h), r = ART.rng(5);
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      const e = Math.min(x, y, P.w - 1 - x, P.h - 1 - y);
      if (e === 0) { if ((x === 0 || x === P.w - 1) && (y === 0 || y === P.h - 1)) continue; M.put(b, x, y, OUT); continue; }
      if (e < 4) { const g = M.noise(x / 9, y * 2, 4); M.put(b, x, y, e === 1 ? WD[4] : e === 3 ? WD[1] : g > .62 ? WD[2] : (x + (y >> 2) * 7) % 23 === 0 ? WD[2] : WD[3]); continue; }
      if (e === 4) { M.put(b, x, y, '#6a5030'); continue; }
      const n = M.noise(x / 14, y / 6, 6) * .6 + M.noise(x / 3, y / 2, 7) * .4, edge = Math.max(0, 1 - (e - 5) / 5);
      M.put(b, x, y, M.pick([M.rgb('#c8a870'), M.rgb('#d8bf8c'), M.rgb('#e6d2a4'), M.rgb('#efdfb6')], cl(.85 - edge * .6 + (n - .5) * .5, 0, 1), x, y));
    }
    for (let i = 0; i < 5; i++) { const sx = 70 + r() * 200, sy = 8 + r() * 26, rr = 3 + r() * 5; for (let y = -rr; y <= rr; y++) for (let x = -rr * 1.6; x <= rr * 1.6; x++) if ((x / 1.6) ** 2 + y * y < rr * rr && D(x | 0, y | 0) < .3) M.put(b, sx + x, sy + y, '#c8a878', .5); }
    for (const [x, y] of [[2, 2], [P.w - 3, 2], [2, P.h - 3], [P.w - 3, P.h - 3], [P.w >> 1, 1], [P.w >> 1, P.h - 2]]) { M.put(b, x, y, '#d8d0c0'); M.put(b, x + 1, y + 1, '#3a2a20'); }
    return M.toCanvas(b);
  }
  let previews = {};
  function preview(i) {
    if (previews[i]) return previews[i];
    const big = document.createElement('canvas'); big.width = W; big.height = H; const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false;
    MUNDO.drawBackground(bg, 200 + i * 300, 40, ART.background(LEVELS[i].theme), 0, W, H, null);
    const c = document.createElement('canvas'); c.width = 56; c.height = 30; const g = c.getContext('2d'); g.imageSmoothingEnabled = true;
    g.drawImage(big, 40, 58, 224, 120, 0, 0, 56, 30);
    return previews[i] = c;
  }
  function frameRect(g, x, y, w, h) { RR(g, x - 2, y - 2, w + 4, h + 4, OUT); RR(g, x - 1, y - 1, w + 2, h + 2, WD[3]); RR(g, x - 1, y - 1, w + 2, 1, WD[5]); RR(g, x - 1, y + h, w + 2, 1, WD[1]); }
  function bubbleIcon(g, x, y, full) {
    g.fillStyle = full ? '#4a2a10' : '#b8a078'; g.fillRect(x + 1, y, 3, 1); g.fillRect(x + 1, y + 4, 3, 1); g.fillRect(x, y + 1, 1, 3); g.fillRect(x + 4, y + 1, 1, 3);
    if (full) { RR(g, x + 1, y + 1, 3, 3, '#f2c43a'); RR(g, x + 1, y + 1, 1, 1, '#fff6d6'); RR(g, x + 3, y + 3, 1, 1, '#c08a1c'); }
  }
  function medalIcon(g, x, y, rank) {
    const [rim, face, hi] = MEDAL[rank];
    RR(g, x + 1, y + 6, 2, 3, '#b8342a'); RR(g, x + 4, y + 6, 2, 3, '#3a5aa8');
    RR(g, x + 1, y - 1, 5, 1, OUT); RR(g, x, y, 7, 6, OUT); RR(g, x + 1, y + 6, 5, 1, OUT);
    RR(g, x + 1, y, 5, 6, rim); RR(g, x + 2, y + 1, 3, 4, face); RR(g, x + 2, y + 1, 1, 1, hi);
    if (rank === 'perfecto') { RR(g, x + 4, y + 1, 1, 1, '#f07080'); RR(g, x + 3, y + 3, 1, 1, '#8fd9d0'); }
  }
  function clockIcon(g, x, y) { RR(g, x + 1, y, 5, 7, INK); RR(g, x, y + 1, 7, 5, INK); RR(g, x + 1, y + 1, 5, 5, '#f4e8c8'); RR(g, x + 3, y + 2, 1, 2, INK); RR(g, x + 4, y + 3, 1, 1, INK); }
  // A trick's morsel as a small icon, in colour once learned, a faded one before.
  function morsel(g, pw, x, y, have) { const spr = ART.morsels[pw]; if (!spr) return; if (have) g.drawImage(spr, x, y); else { g.globalAlpha = .7; g.drawImage(ART.tint(spr, '#a89070'), x, y); g.globalAlpha = 1; } }
  // The round portrait frame on the right of the plaque.
  function portraitFrame(g, cx, cy, fill, inner) {
    const R = 13;
    g.save(); g.beginPath(); g.arc(cx, cy, R - 1, 0, 7); g.clip(); RR(g, cx - R, cy - R, R * 2, R * 2, fill); inner(); g.restore();
    for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) { const d = Math.hypot(x + .5, y + .5); if (d > R + 1.3 || d < R - 1.2) continue; RR(g, cx + x, cy + y, 1, 1, d > R + .4 ? OUT : x + y < -2 ? WD[5] : x + y < 4 ? WD[4] : WD[2]); }
  }
  function drawPanel(g, t, sel, reached, dy) {
    const lv = LEVELS[sel], far = sel > reached, P = { x: PANEL.x, y: PANEL.y + dy, w: PANEL.w, h: PANEL.h }, id = lv.id, wall = !!(lv.requiere && lv.requiere.crias);
    const shut = wall && Save.locked(sel), playable = !far && !shut;
    // The tab on top that says how to go in.
    if (playable) {
      const lab = Input.mode === 'puretv' ? 'A: jugar' : Touch.enabled ? 'Toca: jugar' : 'Z: jugar', w = ART.textWidth(lab) + 16, x = P.x + P.w - w - 8, y = P.y - 10, k = (t >> 4) % 2;
      RR(g, x - 1, y - 1, w + 2, 12, OUT); RR(g, x, y, w, 11, '#4a6a2a'); RR(g, x, y, w, 1, '#7a9a4a'); RR(g, x, y + 1, 1, 10, '#6a8a3a');
      ART.text(g, lab, x + 5, y + 2, '#f4ffe0', 'left', '#1a2a10'); RR(g, x + w - 7 + k, y + 3, 1, 5, '#fff6d6'); RR(g, x + w - 6 + k, y + 4, 1, 3, '#fff6d6'); RR(g, x + w - 5 + k, y + 5, 1, 1, '#fff6d6');
    }
    g.drawImage(L.panel, P.x, P.y);
    // The view of the place, framed, with its number on a wax seal.
    const pv = { x: P.x + 8, y: P.y + 7, w: 56, h: 30 };
    frameRect(g, pv.x, pv.y, pv.w, pv.h); g.drawImage(preview(sel), pv.x, pv.y);
    if (far) { g.globalAlpha = .75; RR(g, pv.x, pv.y, pv.w, pv.h, '#1a1824'); g.globalAlpha = 1; padlock(g, pv.x + pv.w / 2 - 3, pv.y + 10); }
    else if (shut) { g.globalAlpha = .45; RR(g, pv.x, pv.y, pv.w, pv.h, '#1a0c14'); g.globalAlpha = 1; for (let k = 0; k < 7; k++) thornIcon(g, pv.x + 4 + k * 8, pv.y + pv.h - 3 - (k % 2) * 3, true); }
    const sx = pv.x - 1, sy = pv.y - 1;
    RR(g, sx - 4, sy - 3, 9, 7, OUT); RR(g, sx - 3, sy - 4, 7, 9, OUT); RR(g, sx - 3, sy - 3, 7, 7, '#b8342a'); RR(g, sx - 2, sy - 3, 2, 1, '#e8685a'); RR(g, sx - 3, sy - 2, 1, 2, '#e8685a');
    ART.text(g, String(sel + 1), sx + 1, sy - 3, '#fff0d0', 'center');
    const tx = pv.x + pv.w + 8, r1 = P.y + 6, r2 = P.y + 19, r3 = P.y + 29, right = P.x + P.w - 38;
    ART.title(g, lv.name, tx, r1, far ? '#b8b0a0' : '#f2c46a');
    const pcx = P.x + P.w - 21, pcy = P.y + 21;
    if (wall) {
      const have = Save.gateCount(sel), need = lv.requiere.crias, bw = 104, k = Math.min(1, have / need);
      // The song of the crías as a vine bar filling with golden bubbles.
      RR(g, tx - 1, r2, bw + 2, 7, OUT); RR(g, tx, r2 + 1, bw, 5, '#5a3a2a'); RR(g, tx, r2 + 1, Math.round(bw * k), 5, shut ? '#d8a030' : '#f2c43a'); RR(g, tx, r2 + 1, Math.round(bw * k), 1, '#fff2b0');
      for (let q = 6; q < bw; q += 9) RR(g, tx + q, r2 + 1, 1, 5, 'rgba(60,30,10,.35)');
      thornIcon(g, tx + bw + 7, r2 + 3, shut);
      ART.text(g, have + '/' + need, tx + bw + 14, r2, shut ? INKR : INKG, 'left');
      ART.text(g, far ? 'Aún no has llegado hasta aquí' : shut ? 'Faltan ' + (need - have) + ' crías: vuelve a por las escondidas' : Save.data.best[id] !== undefined ? 'Mejor tiempo: ' + Game.fmtTime(Save.data.best[id]) : 'Las crías han abierto el muro. La Garza espera', tx, r3, shut ? INKR : INK, 'left');
      portraitFrame(g, pcx, pcy, '#3a1a2e', () => { RR(g, pcx - 13, pcy + 4, 26, 10, '#6a2a3a'); Boss.figura(g, { x: pcx, y: pcy - 1, t, dir: -1, scale: .34, tint: shut ? '#120c1a' : undefined, state: 'return' }); });
      return;
    }
    if (far) {
      ART.text(g, 'Aún no has llegado hasta aquí.', tx, r2, INK2, 'left'); ART.text(g, 'Sigue el río para descubrirlo.', tx, r3, INKF, 'left');
      portraitFrame(g, pcx, pcy, '#2a2838', () => { g.globalAlpha = .5; RR(g, pcx - 13, pcy - 2, 26, 6, '#6a6a88'); g.globalAlpha = 1; ART.title(g, '?', pcx + 1, pcy - 5, '#8a86a8', 'center'); });
      return;
    }
    // Row 2: the crías of the place as bubbles (golden when home), the best time and the medal.
    const got = Save.criasGot(sel), all = Save.criasTotal(sel); let x = tx;
    if (all <= 18) { for (let q = 0; q < all; q++) bubbleIcon(g, x + q * 6, r2 + 1, q < got); x += all * 6 + 2; }
    else { g.drawImage(ART.cria[(t >> 4) % 3], x, r2 - 1); x += 11; }
    x += ART.text(g, got + '/' + all, x, r2, got >= all ? INKY : INK, 'left') + 8;
    if (Save.data.best[id] !== undefined) { clockIcon(g, x, r2); x += 9; x += ART.text(g, Game.fmtTime(Save.data.best[id]), x, r2, INK, 'left') + 4; const m = medalOf(sel); if (m) medalIcon(g, x, r2, m); }
    // Row 3: the teacher and the trick, and the tricks the hidden crías need (faded until Bigotes has them).
    const m = lv.maestro, sec = secretsOf(sel);
    if (m && POWERS[m.poder]) { const have = Game.has(m.poder), q = Maestros.QUIEN[m.quien]; morsel(g, m.poder, tx, r3, true); ART.text(g, (q ? q.name + ': ' : '') + POWERS[m.poder].name, tx + 11, r3, have ? INK : INKY, 'left'); }
    if (sec.length) {
      let hx = right - 4; for (let q = sec.length - 1; q >= 0; q--) { const s = sec[q], lab = '×' + s.crias, has = Game.has(s.poder); hx -= ART.textWidth(lab); ART.text(g, lab, hx, r3, has ? INKR : INKF, 'left'); hx -= 10; morsel(g, s.poder, hx, r3, has); hx -= 5; }
      RR(g, hx - 6, r3 + 1, 5, 5, INK2); RR(g, hx - 5, r3 + 2, 3, 3, '#e6d2a4'); RR(g, hx - 2, r3 + 5, 2, 2, INK2);
    } else if (got >= all) ART.text(g, '¡Todas en casa!', right - 4, r3, INKG, 'right');
    const who = m && Maestros.QUIEN[m.quien] ? m.quien : null;
    if (who) {
      portraitFrame(g, pcx, pcy, Maestros.QUIEN[who].fondo, () => Maestros.portrait(g, who, pcx - 12, pcy - 12, 24, 24, false, t));
    }
  }
  function padlock(g, x, y) { RR(g, x, y, 7, 8, OUT); RR(g, x + 1, y + 3, 5, 4, '#9fa8b0'); RR(g, x + 1, y - 2, 1, 5, OUT); RR(g, x + 5, y - 2, 1, 5, OUT); RR(g, x + 2, y - 3, 3, 1, OUT); RR(g, x + 3, y + 4, 1, 2, OUT); }
  // Header: a sign hanging from the top with the name of the swamp, and two tags with the totals.
  function drawHeader(g, t) {
    const s = 'El pantano', w = Letra.boldWidth(s.toUpperCase()) + 14, x = 6, y = 4, sw = Math.round(Math.sin(t / 50) * .6);
    g.fillStyle = '#8a6a44'; g.fillRect(x + 6, 0, 1, y); g.fillRect(x + w - 7, 0, 1, y);
    RR(g, x - 1, y - 1 + sw, w + 2, 15, OUT); RR(g, x, y + sw, w, 13, WD[3]); RR(g, x, y + sw, w, 1, WD[5]); RR(g, x, y + 12 + sw, w, 1, WD[1]); RR(g, x + 2, y + 6 + sw, w - 4, 1, WD[2]);
    RR(g, x + 2, y + 2 + sw, 1, 1, '#d8d0c0'); RR(g, x + w - 3, y + 2 + sw, 1, 1, '#d8d0c0');
    ART.title(g, s, x + 7, y + 3 + sw, '#f2c46a');
    const known = POWER_ORDER.filter(Game.has), tot = Save.criasAll(), tag = (tx, txt, icon) => { const tw = ART.textWidth(txt) + 16; RR(g, tx - tw - 1, 3, tw + 2, 13, OUT); RR(g, tx - tw, 4, tw, 11, 'rgba(26,18,30,.85)'); RR(g, tx - tw, 4, tw, 1, '#e79b3f'); icon(tx - tw + 2, 5); ART.text(g, txt, tx - 4, 6, '#fff0d0', 'right'); return tx - tw - 4; };
    let rx = W - 5;
    rx = tag(rx, tot.got + '/' + tot.all, (ix, iy) => g.drawImage(ART.cria[(t >> 4) % 3], ix, iy));
    tag(rx, known.length + '/' + POWER_ORDER.length, (ix, iy) => { const last = known[known.length - 1]; if (last) g.drawImage(ART.morsels[last], ix + 1, iy + 1); else morsel(g, 'soplido', ix + 1, iy + 1, false); });
  }

  // ---------------------------------------------------------------- Todo junto
  function draw(g, t, sel) {
    build(); const reached = Save.reached(); lastSel = sel;
    if (!wbuf) { wbuf = document.createElement('canvas'); wbuf.width = W; wbuf.height = H; }
    const w = wbuf.getContext('2d'); w.imageSmoothingEnabled = false; drawWorld(w, t, sel, reached);
    // Going into a place: the camera leans in on Nila while the iris closes and the plaque drops away.
    const k = entering && Game.fadeTo ? sm(Game.fade) : 0, z = 1 + k * .6, f = focus();
    if (z > 1) g.drawImage(wbuf, f.x - f.x / z, f.y - f.y / z, W / z, H / z, 0, 0, W, H); else g.drawImage(wbuf, 0, 0);
    const pop = popOf[sel] ? Math.round(Math.sin(popOf[sel] / 14 * Math.PI) * 2) : 0;
    drawHeader(g, t); drawPanel(g, t, sel, reached, Math.round(k * 50) - pop);
  }
  function focus() { const np = nilaPos(); return { x: Math.round(np.x - cam.x), y: Math.round(np.y - np.lift - 10) }; }
  // The fade on the map is an iris round Nila, closing to go somewhere and opening on arrival.
  function iris(g, k) {
    const f = focus(), r = Math.pow(cl(1 - k, 0, 1), 1.3) * 380; g.fillStyle = '#080a10';
    if (r < 1) { g.fillRect(0, 0, W, H); return; }
    for (let y = 0; y < H; y++) { const dy = y - f.y; if (Math.abs(dy) >= r) { g.fillRect(0, y, W, 1); continue; } const hw = Math.round(Math.sqrt(r * r - dy * dy)); if (f.x - hw > 0) g.fillRect(0, y, f.x - hw, 1); if (f.x + hw < W) g.fillRect(f.x + hw, y, W - f.x - hw, 1); }
  }
  // Taps: a place (on screen; the edge arrows step to the next one), or the plaque to go in.
  function hit(pt) {
    const lb = Input.mode === 'puretv' ? 'A: jugar' : Touch.enabled ? 'Toca: jugar' : 'Z: jugar', tw = ART.textWidth(lb) + 16;
    if (pt.y >= PANEL.y || (pt.y >= PANEL.y - 11 && pt.x >= PANEL.x + PANEL.w - tw - 9)) return 'panel';
    const wx = pt.x + cam.x; let best = -1, bd = 1e9;
    NODES.forEach((n, i) => { const nest = i === 8, dx = wx - n.x, dy = pt.y - (n.y - (nest ? 40 : 12)), d = Math.hypot(dx, dy * (nest ? .35 : 1)); if (d < (nest ? 34 : 22) && d < bd) { bd = d; best = i; } });
    if (best >= 0) return best;
    if (pt.x < 16 && pt.y > 80 && pt.y < 120 && cam.x > 6 && lastSel > 0) return lastSel - 1;
    if (pt.x > W - 16 && pt.y > 80 && pt.y < 120 && cam.x < WW - W - 6 && lastSel < NODES.length - 1) return lastSel + 1;
    return -1;
  }
  return { draw, update, select, place, enter, iris, hit, walking, shake, NODES };
})();
