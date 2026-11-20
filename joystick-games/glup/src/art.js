// GLUP — arte. Todo el pixel art está dibujado a mano como matrices de caracteres
// con una paleta por sprite; los fondos y la tierra se generan por procedimiento
// con la misma paleta. Nada se carga de fuera.
'use strict';
const ART = (() => {
  const canvases = [];
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; canvases.push(c); return c; }
  function hex(h) { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function sprite(rows, pal, name = '?') {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const c = canvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || '.'; if (ch === '.') continue;
      const col = pal[ch]; if (!col) { console.warn('GLUP: color desconocido', ch, 'en', name); continue; }
      const [r, gg, b] = hex(col), i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
    }
    if (rows.some(r => r.length !== w)) console.warn('GLUP: filas desiguales en', name, rows.map(r => r.length).join(','));
    g.putImageData(img, 0, 0); c.w = w; c.h = h; return c;
  }
  const flipCache = new WeakMap();
  function flip(c) {
    let f = flipCache.get(c); if (f) return f;
    f = canvas(c.width, c.height); const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    f.w = c.width; f.h = c.height; flipCache.set(c, f); return f;
  }
  const tintCache = new WeakMap();
  function tint(c, color) {
    let m = tintCache.get(c); if (!m) tintCache.set(c, m = new Map());
    if (m.has(color)) return m.get(color);
    const f = canvas(c.width, c.height), g = f.getContext('2d');
    g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    f.w = c.width; f.h = c.height; m.set(color, f); return f;
  }
  function replaceRows(rows, from, to) { return rows.map(r => r.split(from).join(to)); }

  // ---------------------------------------------------------------- Nila
  // Nila mira a la derecha. Cada pose es un lienzo de 16×22 con las botas en la última fila: la caja
  // de choque (10×18) cae en las columnas 3–12 y la capucha asoma por encima. Las poses no se pintan
  // una a una: un muñeco (cabeza a mano con su gesto, abrigo, trenza, brazo libre y piernas con rodilla
  // y bota) se monta con unos pocos números, así todas comparten proporciones y la carrera puede tener
  // tantos fotogramas como haga falta. Cada pieza lleva su contorno, para que el brazo y las piernas se
  // lean encima del abrigo. Bigotes va en el brazo de atrás (su mano se dibuja aparte, hacia la columna
  // 12, fila 13); el de delante queda libre y bracea. Luz desde arriba a la izquierda; sombras hacia el
  // rojo y el violeta, nunca negro puro.
  const NILA = { q: '#2c2a4e', o: '#3b2335', W: '#fff4a8', Y: '#f7c843', y: '#dc8a2c', z: '#9c4f33', s: '#fcdcbc', k: '#e8a37f', p: '#f2847e', e: '#2b1d3e',
    h: '#6e3a36', n: '#a45e3e', r: '#e4473b', R: '#992c42', d: '#6a2440', l: '#ff9e7a', L: '#4a4878', N: '#6a6aa0', m: '#a8373f', w: '#ffffff' };
  // Capucha de chubasquero: cúpula con brillo arriba a la izquierda, el borde en sombra sobre el
  // flequillo y la cara abierta hacia delante. Las filas 8–10, columnas 7–14, son el gesto.
  const HOOD = [
    '.....oooooo.....',
    '...ooWWWYYYoo...',
    '..oWWYYYYYYYYoo.',
    '.oWYYYYYYYYYYYYo',
    '.oWYYYYYyyyyyyyo',
    'oWYYYYyhhhhhhhho',
    'oYYYYyhhnnhhhnho',
    'oYYYYyhhhshhshso',
    'oYYYYyhssessesso',
    'oYYYyyhssessesso',
    'oyYYyyhkpssmspko',
    '.oyyyyyokkkkkoo.'];
  // Gestos (filas 8–10, columnas 7–14): dos ojos que miran de frente, mejillas y boca — la cara de siempre.
  const FACES = {
    calm: ['ssessess', 'ssessess', 'kpssmspk'], blink: ['ssssssss', 'seessees', 'kpssmspk'],
    happy: ['ssessess', 'seseeses', 'kpsmmspk'], hurt: ['sesssses', 'ssessess', 'kesmmsek'],
    oh: ['ssessess', 'ssessess', 'kpsmmspk'], strain: ['ssssssss', 'seessees', 'kpmwwmpk'], shut: ['ssssssss', 'seessees', 'kpsmmspk'],
    look: ['sessesss', 'sessesss', 'kpssmspk'], up: ['ssessess', 'ssssssss', 'kpssmspk'] };
  const head = face => HOOD.map((r, i) => i >= 8 && i <= 10 ? r.slice(0, 7) + FACES[face][i - 8] + r.slice(15) : r);
  // Botas de agua, ancladas arriba a la izquierda de la caña (donde acaba la pierna): plana, con la
  // punta levantada (el talón llega primero), de puntillas (despegando) y colgando.
  const BOOTS = { flat: ['lr..', 'rrr.', 'RRRR'], heel: ['lr..', 'rrrr', 'RRR.'], tip: ['lr..', 'rrr.', '.RRR'], point: ['lr.', 'rrr', '.rR', '..R'] };
  const FAR = { l: 'r', r: 'R', R: 'd', L: 'q', N: 'q', Y: 'y', W: 'Y', s: 'k' };
  function paint(w, h, layers) {
    const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('.'));
    for (const [rows, dx, dy] of layers) rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x], X = x + dx, Y = y + dy; if (ch !== '.' && X >= 0 && X < w && Y >= 0 && Y < h) g[Y][X] = ch === '_' ? '.' : ch; } });
    return g.map(r => r.join(''));
  }
  const blank = h => Array.from({ length: h }, () => new Array(16).fill('.'));
  const put = (g, x, y, ch) => { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < 16) g[y][x] = ch; };
  const stamp = (g, rows, dx, dy, map) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') put(g, x + dx, y + dy, map && map[r[x]] || r[x]); });
  // A stroke of 1 or 2 pixels wide from (x0, y0) to (x1, y1).
  function stroke(g, x0, y0, x1, y1, ch, w = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; put(g, x, y, ch); if (w > 1) put(g, x + 1, y, ch); }
  }
  // Lays a part over the figure: first its contour (with rim 'soft', a warm line where it crosses the
  // figure and the dark one only outside), then its colours.
  function lay(dst, src, rim = true) {
    const h = dst.length, at = (x, y) => y >= 0 && y < h && x >= 0 && x < 16 && src[y][x] !== '.';
    if (rim) for (let y = 0; y < h; y++) for (let x = 0; x < 16; x++) if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) dst[y][x] = rim === 'soft' && dst[y][x] !== '.' && dst[y][x] !== 'o' ? 'y' : 'o';
    for (let y = 0; y < h; y++) for (let x = 0; x < 16; x++) if (src[y][x] !== '.') dst[y][x] = src[y][x];
  }
  // A leg from the hip to the ankle with the knee bending forward, and its boot.
  function leg(h, hx, hy, [ax, ay, boot = 'flat'], far) {
    const g = blank(h), S = 3.3, dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy) || 1, k = Math.sqrt(Math.max(0, S * S - Math.min(d, 2 * S) ** 2 / 4));
    let px = -dy / d, py = dx / d; if (px < 0) { px = -px; py = -py; }
    const kx = hx + dx / 2 + px * k, ky = hy + dy / 2 + py * k, c = far ? 'q' : 'L';
    stroke(g, hx, hy, kx, ky, c, 2); stroke(g, kx, ky, ax, ay, c, 2); if (!far) put(g, kx, ky, 'N');
    stamp(g, BOOTS[boot], Math.round(ax), Math.round(ay), far ? FAR : null);
    return g;
  }
  // The raincoat: an A-line from the collar (row 11) to the hem (row 17), lit on its back edge, a
  // darker band along the hem and two toggles. fb/ff flare the hem back/forward, lift shortens it.
  function coat(h, x, y, fb = 0, ff = 0, lift = 0) {
    // Square shoulders and an A-line: the body stands straight under the hood instead of hiding in it.
    const g = blank(h), L0 = [4, 3, 3, 2, 2, 1], R0 = [11, 12, 12, 13, 13, 14], n = 5 - lift;
    for (let r = 0; r <= n; r++) {
      let l = L0[r] + x, rr = R0[r] + x; if (r >= 4 || r === n) { const f = Math.max(1, r - 3) / 2; l -= Math.round(fb * f); rr += Math.round(ff * f); }
      for (let c = l; c <= rr; c++) put(g, c, 11 + y + r, r === 0 ? 'y' : r === n ? (c >= rr - 1 ? 'z' : c === l ? 'Y' : 'y') : c === l ? 'W' : c >= rr - 1 ? 'y' : c === l + 1 && r < 3 ? 'W' : 'Y');
    }
    put(g, 9 + x, 13 + y, 'z');
    return g;
  }
  // The free arm: shoulder angle a (0 hangs, + swings forward), elbow e (+ bends forward), a mitten hand.
  function arm(h, sx, sy, a, e = .4, len = 2.6) {
    const g = blank(h), ex = sx + Math.sin(a) * len, ey = sy + Math.cos(a) * len, hx = ex + Math.sin(a + e) * len, hy = ey + Math.cos(a + e) * len;
    stroke(g, sx, sy, ex, ey, 'Y', 2); stroke(g, ex, ey, hx, hy, 'Y', 2); stroke(g, sx, sy, ex, ey, 'W'); put(g, hx, hy, 's'); put(g, hx + 1, hy, 'k');
    return g;
  }
  // The pose itself. o: face; cx/cy move the body (lean, bob), hx/hy the head on top of that; near/far
  // are [ankle x, ankle y, boot] (planted: y 19); a/e the free arm; fb/ff/lift the hem; bx/by the braid;
  // fa where the sleeve holding Bigotes goes (null: hidden); low puts the legs in front of the coat.
  function rig(o) {
    const H = o.h || 22, g = blank(H), cx = o.cx || 0, cy = o.cy || 0, top = H - 22;
    const legs = () => { lay(g, leg(H, 6 + cx, 14 + cy + top, shift(o.far, top), true)); lay(g, leg(H, 8 + cx, 14 + cy + top, shift(o.near, top), false)); };
    if (!o.low) legs();
    const braid = blank(H); stamp(braid, ['hn', 'nh', 'hn', 'rr', 'h.'], Math.max(0, (o.bx || 0) + 1) + cx, 10 + cy + top + (o.by || 0)); lay(g, braid);
    lay(g, coat(H, cx, cy + top, o.fb, o.ff, o.lift));
    if (o.low) legs();
        const hd = blank(H); stamp(hd, head(o.face || 'calm'), cx + (o.hx || 0), cy + top + (o.hy || 0)); lay(g, hd, false);
    if (o.fa) { const f = blank(H), [fx, fy] = o.fa; stroke(f, 9 + cx, 12 + cy + top, fx, fy + top, 'y'); lay(g, f, 'soft'); }
    if (o.a !== undefined) lay(g, arm(H, 7 + cx, 12 + cy + top, o.a, o.e === undefined ? .4 : o.e, o.len));
    if (o.palm) stamp(g, ['.oo', 'osk', 'oso', '.o.'], 0, 7 + cy + top);
    const c = sprite(g.map(r => r.join('')), NILA, 'nila-' + (o.face || 'calm')); c.bob = o.low ? 0 : cy; return c;
  }
  const shift = ([x, y, b], d) => [x, y + d, b];
  // Gaits: keyframes over one stride (two steps), sampled at any number of frames. Frame 0 is the near
  // boot landing heel first; the far one lands halfway. A planted boot slides back the same distance
  // each frame, so tying the frame to the distance travelled keeps it still on the ground.
  const lerp = (a, b, t) => a + (b - a) * t;
  function gait(keys, n, extra = {}) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = i / n * keys.length, k0 = Math.floor(u), k1 = (k0 + 1) % keys.length, t = u - k0, A = keys[k0], B = keys[k1], o = Object.assign({}, A);
      for (const key of ['cy', 'hx', 'hy', 'a', 'e', 'fb', 'ff', 'bx', 'by', 'cx']) if (typeof A[key] === 'number') o[key] = Math.round(lerp(A[key], B[key] !== undefined ? B[key] : A[key], t) * (key === 'a' || key === 'e' ? 100 : 1)) / (key === 'a' || key === 'e' ? 100 : 1);
      for (const key of ['near', 'far']) o[key] = [Math.round(lerp(A[key][0], B[key][0], t)), Math.round(lerp(A[key][1], B[key][1], t)), t < .5 ? A[key][2] : B[key][2]];
      out.push(rig(Object.assign(o, extra)));
    }
    return out;
  }
  const mirror = keys => keys.concat(keys.map(k => Object.assign({}, k, { near: k.far, far: k.near, a: -k.a * .9 })));
  // Run: contact, down, passing, up (both boots off the ground), then the other leg. The arm swings
  // against the near leg; the head, the braid and the hem answer a frame late.
  const RUN = mirror([
    { near: [11, 19, 'heel'], far: [2, 18, 'tip'], cy: 0, hx: 1, hy: -1, a: -1.0, e: .5, fb: 2, bx: -1, by: -1 },
    { near: [9, 19, 'flat'], far: [3, 17, 'tip'], cy: 1, hx: 1, hy: -1, a: -.7, e: .6, fb: 1, bx: -1, by: 0 },
    { near: [6, 19, 'flat'], far: [5, 16, 'tip'], cy: 0, hx: 1, hy: 1, a: -.1, e: .9, fb: 1, bx: -1, by: 1 },
    { near: [4, 18, 'tip'], far: [9, 17, 'flat'], cy: -1, hx: 1, hy: 1, a: .6, e: 1.2, fb: 2, bx: -1, by: 0 }]);
  // Walk: never both boots in the air, a small bob, a gentle swing.
  const WALK = mirror([
    { near: [10, 19, 'heel'], far: [4, 19, 'tip'], cy: 0, hy: 0, a: -.5, e: .3, fb: 1, by: 0 },
    { near: [9, 19, 'flat'], far: [5, 18, 'tip'], cy: 1, hy: 0, a: -.35, e: .3, fb: 0, by: 0 },
    { near: [7, 19, 'flat'], far: [7, 18, 'flat'], cy: 0, hy: 1, a: 0, e: .4, fb: 0, by: 1 },
    { near: [6, 19, 'flat'], far: [9, 18, 'flat'], cy: 0, hy: 0, a: .3, e: .5, fb: 1, by: 0 }]);
  // Crouched shuffle: short steps under the bunched-up coat.
  const SNEAK = [
    { near: [10, 19, 'flat'], far: [6, 18, 'tip'], cy: 5, hy: 0, a: .6, e: .8 },
    { near: [8, 19, 'flat'], far: [8, 18, 'flat'], cy: 5, hy: 1, a: .5, e: .8 },
    { near: [6, 18, 'tip'], far: [10, 19, 'flat'], cy: 5, hy: 0, a: .6, e: .8 },
    { near: [8, 18, 'flat'], far: [8, 19, 'flat'], cy: 5, hy: 1, a: .5, e: .8 }];
  const STAND = { near: [8, 19], far: [4, 19], a: .15, e: .3 };
  const st = o => rig(Object.assign({}, STAND, o));
  // Hanging from a hook: the arms go up behind the hood to Bigotes, who bites the hook; the legs trail
  // the swing (0 far behind … 4 far ahead). 24 rows: the boots dangle two pixels under the hitbox.
  const HANG = [-2, -1, 0, 1, 2].map(k => { const up = Math.abs(k) > 1 ? 1 : 0; return rig({ h: 24, hy: 1, face: k ? 'strain' : 'calm', near: [8 + 2 * k, 19 - up, 'point'], far: [6 + 2 * k - (k > 0 ? 1 : 0), 18 - up, 'point'], fb: k > 0 ? 1 : 0, ff: k < 0 ? 1 : 0, bx: k < 0 ? 1 : -1, by: -Math.abs(k) >> 1 }); });
  const nila = {
    // Standing: breathing (the head sinks a pixel on the out-breath) and blinking over both.
    idle: [st({}), st({ face: 'blink' }), st({ hy: 1, a: .1 }), st({ face: 'blink', hy: 1, a: .1 })],
    run: gait(RUN, 6), run8: gait(RUN, 8), walk: gait(WALK, 8),
    // Sucking and still moving: the walk leaning back, straining.
    heave: gait(WALK, 8, { face: 'strain', hx: -1, a: -1.2, e: .3, fb: 0, ff: 1 }),
    start: rig({ near: [5, 19, 'tip'], far: [9, 19, 'flat'], cy: 1, hx: 1, a: -.9, e: .4, fb: 2, bx: -1 }),
    stop: [rig({ near: [10, 19, 'flat'], far: [5, 19, 'flat'], cy: 1, hy: 1, a: .8, e: .5, ff: 2, bx: 1 }), rig({ near: [9, 19, 'flat'], far: [4, 19, 'flat'], cy: 0, a: .4, e: .4, ff: 1, bx: 1 })],
    skid: rig({ face: 'strain', near: [12, 19, 'heel'], far: [5, 19, 'flat'], cy: 1, hx: -1, a: 1.6, e: -.3, ff: 2, bx: 1, by: -1 }),
    // Turning round: already facing the new way, the boots still skid the old one behind her.
    turn: rig({ face: 'strain', near: [7, 19, 'flat'], far: [1, 19, 'heel'], cy: 1, hx: 1, a: -1.5, e: -.2, fb: 2, bx: -1, by: -1 }),
    land: rig({ face: 'shut', near: [10, 19, 'flat'], far: [3, 19, 'flat'], cy: 2, hy: 0, a: 1.2, e: .3, fb: 1, ff: 1, by: -1 }),
    launch: rig({ face: 'oh', near: [8, 18, 'point'], far: [5, 19, 'point'], cy: -1, hy: 0, a: -1.3, e: -.5, by: 1 }),
    jump: rig({ face: 'oh', near: [10, 16, 'flat'], far: [5, 18, 'point'], cy: -1, hy: -1, a: -1.5, e: -.4, fb: 1, by: 1 }),
    apex: rig({ face: 'oh', near: [10, 16, 'flat'], far: [5, 16, 'tip'], cy: 0, a: -1.6, e: -.2, fb: 1, ff: 1 }),
    fall: rig({ face: 'oh', near: [9, 18, 'point'], far: [4, 17, 'point'], cy: 0, hy: 1, a: -1.3, e: -.9, fb: 2, ff: 1, lift: 1, by: -2 }),
    tuck: rig({ face: 'shut', near: [9, 16, 'flat'], far: [6, 17, 'flat'], cy: 3, hy: 1, a: 1.4, e: 1.4, low: true, lift: 1 }),
    hurt: rig({ face: 'hurt', near: [11, 16, 'point'], far: [3, 17, 'point'], cy: -1, hx: -1, hy: -1, a: -1.4, e: -.8, fb: 1, ff: 1, lift: 1, by: -1 }),
    win: st({ face: 'happy', hy: 1, a: .3 }),
    cheer: [st({ face: 'happy', a: 1.8, e: .9 }), rig({ face: 'happy', near: [8, 18, 'tip'], far: [4, 18, 'tip'], cy: -1, a: 2.0, e: .7, by: 1 })],
    brace: rig({ face: 'strain', near: [11, 19, 'heel'], far: [3, 19, 'flat'], cy: 1, hx: -1, a: -1.2, e: .3, ff: 1 }),
    spit: rig({ face: 'shut', near: [10, 19, 'flat'], far: [2, 19, 'flat'], cy: 0, hx: -1, a: -1.5, e: .2, ff: 1, bx: 1 }),
    wall: rig({ face: 'strain', near: [7, 18, 'point'], far: [2, 17, 'tip'], cy: 0, a: -1.7, e: 0, palm: true, fb: 0, ff: 1 }),
    // Hovering on the jet: both hands on Bigotes out in front, the boots treading air.
    dangle: gait([
      { near: [9, 18, 'point'], far: [5, 19, 'point'], cy: 0, a: 1.5, e: .3, fb: 1, by: 0 },
      { near: [8, 19, 'point'], far: [6, 18, 'point'], cy: 0, a: 1.5, e: .3, fb: 1, by: 1 },
      { near: [7, 18, 'point'], far: [7, 19, 'point'], cy: 0, a: 1.5, e: .3, fb: 1, by: 0 },
      { near: [8, 19, 'point'], far: [6, 18, 'point'], cy: 0, a: 1.5, e: .3, fb: 1, by: 1 }], 4),
    hang: HANG,
    crouch: rig({ near: [10, 19, 'flat'], far: [6, 19, 'flat'], cy: 5, hy: 0, a: .6, e: .8, lift: 2, low: true }),
    slide: rig({ face: 'happy', near: [12, 17, 'heel'], far: [11, 18, 'heel'], cy: 3, hy: 0, a: -1.1, e: .3, lift: 2, low: true, bx: -1, by: -1 }),
    aim: st({ face: 'up', fa: [11, 11], a: .2 }),
    // Fidgets when she is left alone: a look around, a tug at the hood, a pat for Bigotes.
    look: [st({ face: 'look' }), st({ face: 'up', hy: 0 })],
    hood: [st({ face: 'shut', a: 2.8, e: .5 }), st({ face: 'calm', hy: 1, a: 2.7, e: .6 })],
    pet: [st({ face: 'happy', a: .9, e: .6 }), st({ face: 'happy', a: 1.0, e: .9, hy: 1 })] };
  nila.sneak = gait(SNEAK.map(k => Object.assign({ lift: 2, low: true }, k)), 4);
  // ---------------------------------------------------------------- Bigotes, el pez gato
  // Un bagre joven: lomo oliva moteado, panza crema, cabeza ancha y chata con bocaza, ojos
  // pequeños y separados en lo alto, aleta dorsal corta y cola redonda. Mira a la derecha: la
  // columna 0 es la punta de la cola y la última, la boca. La fila 6 es la espina (drawFish).
  // Los bigotes largos no están aquí: se dibujan aparte para que ondeen con inercia.
  const FISH = { o: '#2b2233', D: '#4a4a2c', B: '#88863a', L: '#b6b04e', T: '#e4d86c', S: '#565430', C: '#fff0b4', c: '#eab66a', F: '#7a5630', f: '#c8944a',
    E: '#1d1826', H: '#ffffff', w: '#e9e2c0', l: '#e4b98a', m: '#5a1f35', t: '#e0707f', k: '#8a3a44' };
  const fishClosed = [
    '......................',
    '..........ooo.........',
    '.........oTfo.........',
    '........oTfFoooooo....',
    '.oo...ooLLLLLLLLLTLoo.',
    'oFfoooLLBBSBBBLLLwHELo',
    'oFfFFoBBBBBSBBBBBwEEBo',
    'oFfFFBBSBBBBBBSBBBBBBo',
    'oFfFFoDBBBBBBBBBBBommo',
    'oFfoooccCCCCCCooCClllo',
    '.oo...oocCCCCoFfocco..',
    '........oFoFo.oo.oo...'];
  const fishRows = (base, map) => base.map((r, i) => map[i] !== undefined ? r.slice(0, 22 - map[i].length) + map[i] : r);
  // Boca abierta de par en par para sorber: un agujero redondo con labios claros.
  const fishOpen = fishRows(fishClosed, { 4: 'LLLLTLooo', 5: 'LLwHEloo.', 6: 'BBwEElmmo', 7: 'BBBBlmmmo', 8: 'BBBBlmmmo', 9: 'CClllmmo.', 10: 'occlooo..' });
  // Llena: carrillos hinchados y panza redonda, los ojos un poco apretados de satisfacción.
  const fishFull = [
    '..........ooo.........',
    '.........oTfooooo.....',
    '........oTfFLLLLLoo...',
    '......ooLLLLLLLLLTLoo.',
    '.oo..oLLBBSBBBLLLwHELo',
    'oFfooBBBBBBSBBBBBwEEBo',
    'oFfFFBBSBBBBBBSBBBBBBo',
    'oFfFFoDBBBBBBBBBBBBmmo',
    'oFfFoocCCCCCCCCCCCClko',
    'oFfo.occCCCCCooCCCCco.',
    '.oo...oocCCCoFfocccoo.',
    '........oooo.oo.ooo...'];
  const fishSpit = fishRows(fishClosed, { 4: 'LLLLTLooo', 5: 'LLwwwloo.', 6: 'BBEEElttmo', 7: 'BBBBltttmo', 8: 'BBBBlmtmo', 9: 'CClllmmo.', 10: 'occlooo..' });
  const fishFullOpen = fishRows(fishFull, { 3: 'LLLTLLooo', 4: 'LLwHEloo.', 5: 'BBwEElmmo', 6: 'BBBBlmmmo', 7: 'BBBBlmmmo', 8: 'CCCClmmo.', 9: 'CCCClooo.', 10: 'cccoo....' });
  const fishTail = fishClosed;
  const fishSquint = fishFull.map((r, i) => i === 4 ? r.replace('wHE', 'www') : i === 5 ? r.replace('wEE', 'EEE') : r);
  const fish = { blink: sprite(fishClosed.map((r, i) => i === 5 ? r.replace('wHE', 'www') : i === 6 ? r.replace('wEE', 'EEE') : r), FISH, 'fish-blink'), tail: sprite(fishTail, FISH, 'fish-tail'), squint: sprite(fishSquint, FISH, 'fish-squint'), closed: sprite(fishClosed, FISH, 'fish'), open: sprite(fishOpen, FISH, 'fish-open'), full: sprite(fishFull, FISH, 'fish-full'), spit: sprite(fishSpit, FISH, 'fish-spit'), swallow: sprite(fishFullOpen, FISH, 'fish-swallow') };
  // La mano de Nila por encima del lomo de Bigotes: puño de manga amarilla y dedos que lo agarran.
  const hand = sprite(['.ooo..', 'oWYYo.', 'oYyyso', '.oksko', '..ooo.'], NILA, 'hand');

  // ---------------------------------------------------------------- Enemigos
  // Caracol: mira a la izquierda (walkerDraw lo voltea al ir a la derecha). Concha en espiral
  // con el surco más oscuro, pie baboso y ojos en antenas.
  const SNAIL = { o: '#3a2230', S: '#d98a48', s: '#a4563a', d: '#6e3440', L: '#f7c47a', B: '#a6cf6e', b: '#6a9a52', k: '#3f6a4a', E: '#231a2a', W: '#ffffff', p: '#e89a8a', m: '#6a2a3a' };
  const snailShell = [
    '...oooo...',
    '.ooLLSSoo.',
    'oLLSSSSSso',
    'oLSddddSso',
    'oSdSLLdSso',
    'oSdSdsdSso',
    'oSdSSSdsso',
    '.osddddso.',
    '..oooooo..'];
  const SNAIL_BODY = [
    '.oo..oo.........',
    'oEWooEWo........',
    'oWWooWWo........',
    '.oo..oo.........',
    '..ob..ob........',
    '..ob.ob.........',
    '.oBBBBBo........',
    'oBBBBBBBo.......',
    'oBBBBBBBBo......',
    'oBpmBBBBBBoooooo',
    'obBBBBBBBBBBBBBo',
    '.oooooooooooooo.'];
  function snailBody(lower, foot) {
    const rows = SNAIL_BODY.slice(); if (lower) rows.splice(0, 5, '................', SNAIL_BODY[0], SNAIL_BODY[1], SNAIL_BODY[2], '..obob..........');
    if (foot) rows[11] = foot; return paint(16, 12, [[rows, 0, 0], [snailShell, 6, 1]]);
  }
  const snail = [sprite(snailBody(0), SNAIL, 'snail'), sprite(snailBody(1, 'ookoookooookooo.'), SNAIL, 'snail2')];
  // Rana: ojos saltones arriba, papada crema, mofletes. Mira a la derecha.
  const FROG = { o: '#1f3328', G: '#6cc24a', g: '#3c8a4a', d: '#2a5e44', L: '#b8ea7a', W: '#f2f2c4', w: '#c9d49a', E: '#1d1a26', H: '#ffffff', m: '#6a2a3a', p: '#f09a8a' };
  const frogTop = [
    '..ooo...ooo...',
    '.oHHEo.oHHEo..',
    '.oHEEoooHEEoo.',
    'oLLGoGGGGoGGGo',
    'oLGGGGGGGGGGGo',
    'oGGGGGGGGGpGmo',
    'ogGGGGGGmmmmGo',
    'ogGWWWWWWWWGgo'];
  const frogSit = sprite(frogTop.concat([
    'oggwWWWWWWwgGo',
    'oGGgoddddoGgGo',
    '.ooo.oooo.ooo.']), FROG, 'frog');
  const frogJump = sprite(frogTop.concat([
    '.oGwwWWWWwwGo.',
    '.oGodddddoGgo.',
    '.oGo.oooo.oGo.',
    '.ogo......ogo.',
    'oggo......oggo',
    'oooo......oooo']), FROG, 'frog-jump');
  // Mosquito: alas translúcidas, abdomen a rayas, ojo rojo y trompa afilada. Mira a la derecha.
  const MOSQ = { o: '#2a2438', B: '#9a8ab8', b: '#5c4e7a', W: '#e4f2fa', w: '#9fc0d8', E: '#ff5a4a', e: '#ffd0a0', P: '#4a3a5a' };
  const mosquito = [sprite([
    '...ww.......',
    '..wWWw......',
    '..wWWWw.....',
    '...wWWw.....',
    'oo..wwoooo..',
    'obBbBoBBBEo.',
    '.oobbobBBoPP',
    '..oo.oooo..P',
    '.o..o..o.o..'], MOSQ, 'mosq'), sprite([
    '............',
    '............',
    '............',
    '.wwww.......',
    'owWWWwoooo..',
    'obWWWwBBBEo.',
    '.oowwobBBoPP',
    '..oo.oooo..P',
    '..o.o..o..o.'], MOSQ, 'mosq2')];
  // Cangrejo: pinzas en alto, ojos en pedúnculo, caparazón con brillo arriba a la izquierda.
  const CRAB = { o: '#4a1a2a', R: '#e0583e', r: '#a8303a', d: '#6e2238', L: '#ffa070', E: '#1d1a26', H: '#ffffff' };
  const crabRows = [
    '......oo..oo......',
    '.....oHEooHEo.....',
    '.ooo..oo..oo..ooo.',
    'oLRRo.oo..oo.oLRRo',
    'oRooRooooooooRooRo',
    'oRRRRoLLRRRRoRRRro',
    '.oorRLLRRRRRRRroo.',
    '..orRRRRRRRRRRrro.',
    '..oo.orrddrro.oo..',
    '.o..o.o....o.o..o.'];
  const crab = [sprite(crabRows, CRAB, 'crab'), sprite(crabRows.map((r, i) => i === 4 ? 'oRRRRooooooooRRRRo' : i === 8 ? '..o.oorrddrroo.o..' : i === 9 ? '..o..o.o..o.o..o..' : r), CRAB, 'crab2')];

  // ---------------------------------------------------------------- La Garza (jefa)
  // Garza real: gris azulado con sombras hacia el violeta, cuello blanco con rayas oscuras, penacho
  // negro, ojo amarillo que no parpadea y pico largo. Mira a la izquierda.
  const HERON = { o: '#23202e', G: '#8196b0', g: '#5a6488', L: '#b9c9da', W: '#f2efe8', w: '#c9c3cc', k: '#3a3d56', K: '#2a2638', Y: '#f0c444', y: '#b8782a', E: '#ffd23a', e: '#1d1a26' };
  // Plumas: puntas oscuras (primarias) y vetas que siguen la forma del ala.
  const feather = tip => (r, y) => r.replace(/G/g, (ch, x) => tip(x, y) ? 'k' : y % 3 === 2 && x % 3 !== 0 ? 'g' : 'G');
  const heronHead = [
    '...........ooooo................',
    '..........oLLGGGoKKo............',
    '.........oLLGKKGGoKKKo..........',
    'oooooooooLGeEGGGGGooKKKo........',
    'YYYYYYYYYoGGGGGGGGGo.oKKo.......',
    'yyyyyyyyyoGGWWWGGGo...ooo.......',
    'ooooooooooGWWWWGGo..............'];
  const heronBody = sprite(heronHead.concat([
    '..........oWkWWGGo..............',
    '..........oWWkWGo...............',
    '...........oWkWGo...............',
    '...........oWWkGo...............',
    '..........oWkWWGGo..............',
    '..........oWWkWGGGoooo..........',
    '...........oWWWGLLLGGGoooo......',
    '...........oWWWGLGGLLGGGGGooo...',
    '............oWWGLGgGGgGGGGGGGoo.',
    '............oWWGGgGGgGGgGGGGGGGo',
    '............oWWWGGgGGgGGgGgggGo.',
    '.............oWWWGGgGGgGgggkko..',
    '.............oWWWWGGgGgggkkko...',
    '..............oWWWWGGgggkkoo....',
    '...............owWWWGGGgoo......',
    '................oowwWooo........',
    '..................oooo..........',
    '..................yy.y..........',
    '..................yy.y..........',
    '..................yy.y..........',
    '..................yy.y..........',
    '.................oyyoyy.........',
    '................oyyyoyyy........']), HERON, 'heron');
  const heronFly = sprite(heronHead.concat([
    '..........oWkWGGGo..............',
    '..........oWWkGGGGoooo..........',
    '..........oWWWGLLLGGGGoooo......',
    '..........oWWWWGLGGLLGGGGGooo...',
    '...........oWWWGLGgGGgGGGGGGGoo.',
    '...........oWWWGGgGGgGGgGGGGGGGo',
    '...........oWWWWGGgGGgGGgGgggGo.',
    '............oWWWWGGgGGgGgggkko..',
    '............oWWWWWGGgGgggkkko...',
    '.............owWWWWGGgggkkoo....',
    '..............owwWWWGGGgoo......',
    '...............oowwWWooo........',
    '.................ooooo..........',
    '..................yyy...........',
    '...................yyy..........',
    '....................yyy.........',
    '.....................yyy........']), HERON, 'heron-fly');
  const wingUp = sprite([
    '......................oo....',
    '....................ooGGo...',
    '..................ooGGGGo...',
    '................ooGGGGGGo...',
    '..............ooGGGGGGGGo...',
    '............ooGGGGGGGGGgo...',
    '..........ooGGGGGGGGGGggo...',
    '........ooGGGGGGGGGGGGggo...',
    '......ooGGGGGGGGGGGGGgggo...',
    '....ooGGGGGGGGGGGGGGggggo...',
    '..ooGGGGGGGGGGGGGGGGggggo...',
    'ooGGGGGGGGGGGGGGGGGGggggo...',
    'oggggggggggggggggggggggo....',
    '.ooooooooooooooooooooooo....'].map(feather((x, y) => y < 5)), HERON, 'wing-up');
  const wingDown = sprite([
    'ooooooooooooooooooooooo.....',
    'oGGGGGGGGGGGGGGGGGGGGGGo....',
    '.oggGGGGGGGGGGGGGGGGGGGGo...',
    '...ooggGGGGGGGGGGGGGGGGGo...',
    '.....ooggGGGGGGGGGGGGGGGo...',
    '.......ooggGGGGGGGGGGGGGo...',
    '.........ooggGGGGGGGGGGgo...',
    '...........ooggGGGGGGGGgo...',
    '.............ooggGGGGGGgo...',
    '...............ooggGGGGgo...',
    '.................ooggGGgo...',
    '...................ooggo....',
    '.....................oo.....'].map(feather((x, y) => y > 8)), HERON, 'wing-down');
  const wingMid = sprite([
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    'ooooooooooooooooooooooooo.....',
    'oGGGGGGGGGGGGGGGGGGGGGGGGo....',
    'oLGGGGGGGGGGGGGGGGGGGGGGGGo...',
    '.oggGGGGGGGGGGGGGGGGGGGGggo...',
    '..ooooggggggggggggggggggggo...',
    '......oooooooooooooooooooo....',
    '..............................',
    '..............................',
    '..............................'].map(feather((x, y) => x < 7)), HERON, 'wing-mid');
  // Huevo de garza: azul verdoso pálido con motas.
  const egg = sprite(['..oo..', '.oWLo.', 'oWWLLo', 'oWLsLo', 'oLLllo', '.olso.', '..oo..'], { o: '#34425a', W: '#eefaf4', L: '#b8dcd4', l: '#80aab0', s: '#5e8088' }, 'egg');

  // ---------------------------------------------------------------- Objetos
  const WOOD = { o: '#4a2e1a', W: '#c78d4e', w: '#a56f38', L: '#e0a862', P: '#6b4a30', T: '#5a3a24' };
  const crate = sprite([
    'oooooooooooooo',
    'oWWWWWWWWWWWWo',
    'oWwwwwwwwwwwWo',
    'oWwLwwwwwwLwWo',
    'oWwwLwwwwLwwWo',
    'oWwwwLwwLwwwWo',
    'oWwwwwLLwwwwWo',
    'oWwwwwLLwwwwWo',
    'oWwwwLwwLwwwWo',
    'oWwwLwwwwLwwWo',
    'oWwLwwwwwwLwWo',
    'oWwwwwwwwwwwWo',
    'oWWWWWWWWWWWWo',
    'oooooooooooooo'], WOOD, 'crate');
  const rock = sprite([
    '....oooo....',
    '..ooLLSSoo..',
    '.oLLLSSSSSo.',
    'oLLSSSSSSsso',
    'oLSSSSSSSsso',
    'oSSSSSSssSso',
    'oSSSSsssssso',
    '.osssssssso.',
    '..oossssoo..',
    '....oooo....'], { o: '#2e2f3a', S: '#7d8290', s: '#565a68', L: '#a6abb8' }, 'rock');
  // Las crías de pez gato que la Garza escupió por el pantano, cada una en su burbuja: un Bigotes
  // en miniatura (lomo oliva, panza crema, ojito y bigotes) dentro de una pompa con brillo.
  const CRIA = { c: '#a8dcea', d: '#5f9ab8', W: '#ffffff', B: '#8a7d45', b: '#665a36', C: '#f4e1a4', E: '#1d1826', F: '#e0a45a' };
  const criaRows = [
    ['..ccccc..', '.cW....c.', 'cW......c', 'c..BBB..c', 'cbBBBBEBc', 'c.bCCCCFd', 'c.....F.d', '.c.....d.', '..cccdd..'],
    ['..ccccc..', '.c.W...c.', 'c.W.....c', 'c..BBB..c', 'c.bBBBEBc', 'cb.CCCCFd', 'c......Fd', '.c.....d.', '..cccdd..'],
    ['..ccccc..', '.c.....c.', 'c.W.BBB.c', 'cW.BBBEBc', 'c.bBCCCFd', 'c..bCC.Fd', 'c.......d', '.c.....d.', '..cccdd..']];
  const cria = criaRows.map((r, i) => sprite(r, CRIA, 'cria' + i));
  const criaFree = [sprite(['...BB...', 'bBBBBBE.', '.bCCCCCF', '......F.'], CRIA, 'cria-free'), sprite(['...BB...', '.bBBBBE.', 'b.CCCCCF', '.....F..'], CRIA, 'cria-free2')];
  // Ruca, la tortuga vieja del pantano, es una marioneta por piezas como los demás maestros: vive en
  // maestros.js. ART.ruca da sus poses de siempre (quieta, parpadeo, hablando) ya montadas.
  const bubble = sprite(['.ooooooo.', 'oWWWWWWWo', 'oWkWkWkWo', 'oWWWWWWWo', '.oooWWoo.', '....oWo..', '.....o...'], { o: '#1b2430', W: '#fff6d6', k: '#1b2430' }, 'bubble');
  const heart = sprite(['.oo...oo.', 'oRRo.oRRo', 'oRHRoRRRo', 'oRRRRRRRo', '.oRRRRRo.', '..oRRRo..', '...oRo...', '....o....'], { o: '#4a1a2a', R: '#e2445a', H: '#ffb0bd' }, 'heart');
  const heartEmpty = sprite(['.oo...oo.', 'oddo.oddo', 'oddodrddo', 'odddddddo', '.oddddDo.', '..odddo..', '...odo...', '....o....'], { o: '#2a1a24', d: '#3f2f3a', r: '#4a3644', D: '#4a3644' }, 'heart-empty');
  const lanternRows = [
    '....oo....',
    '...oYYo...',
    '..oyyyyo..',
    '..oGGGGo..',
    '..oGLLGo..',
    '..oGLLGo..',
    '..oGGGGo..',
    '..oyyyyo..',
    '....oo....',
    '....oo....',
    '...oPPo...',
    '...oPPo...',
    '...oPPo...',
    '...oPPo...',
    '...oPPo...',
    '...oPPo...',
    '..ooPPoo..',
    '..oooooo..'];
  const lantern = { off: sprite(lanternRows, { o: '#2f2320', Y: '#b98a3a', y: '#8a6428', G: '#3c4652', L: '#55606e', P: '#6b4a30' }, 'lantern'),
    on: sprite(lanternRows, { o: '#2f2320', Y: '#b98a3a', y: '#8a6428', G: '#ffcf5a', L: '#fff2b8', P: '#6b4a30' }, 'lantern-on') };
  const sign = sprite([
    'oooooooooooooo',
    'oWWWWWWWWWWWWo',
    'oWwwwwwwwwwwWo',
    'oWwTTTTTTTTwWo',
    'oWwwwwwwwwwwWo',
    'oWwTTTTTTwwwWo',
    'oWwwwwwwwwwwWo',
    'oWWWWWWWWWWWWo',
    'oooooooooooooo',
    '.....oPPo.....',
    '.....oPPo.....',
    '.....oPPo.....'], WOOD, 'sign');
  const boat = sprite([
    '.............oo.................',
    '............oYYo................',
    '............oyyo................',
    '.............oo.................',
    '.............oo.................',
    'oo...........oo...............oo',
    'oWWooooooooooooooooooooooooooWWo',
    '.oWWWWWWWWWWWWWWWWWWWWWWWWWWWWo.',
    '..oWwwwwwwwwwwwwwwwwwwwwwwwwWo..',
    '...oWwwwwwwwwwwwwwwwwwwwwwwWo...',
    '....oowwwwwwwwwwwwwwwwwwwwoo....',
    '......oooooooooooooooooooo......'], { o: '#3a2416', W: '#c78d4e', w: '#a56f38', Y: '#ffcf5a', y: '#e2a63c' }, 'boat');
  const mushroom = sprite([
    '....oooooooo....',
    '..ooRRRRWRRRoo..',
    '.oRRWRRRRRRRRRo.',
    'oRRRRRRRRWRRRRRo',
    'oRWRRRRRRRRRRWRo',
    'oooooooooooooooo',
    '....oWWWWWWo....',
    '....oWwwwwWo....',
    '....oWwwwwWo....',
    '....oooooooo....'], { o: '#3a1f2a', R: '#d95a4a', W: '#f6e6c8', w: '#cfb99a' }, 'mushroom');
  const mushroomSquash = sprite([
    '..oooooooooooo..',
    '.oRRWRRRRRWRRRo.',
    'oRWRRRRRWRRRRRRo',
    'oooooooooooooooo',
    '...oWWWWWWWWo...',
    '...oooooooooo...'], { o: '#3a1f2a', R: '#d95a4a', W: '#f6e6c8', w: '#cfb99a' }, 'mushroom-squash');
  const thorns = sprite([
    '..o.....o....o..',
    '.oTo...oTo..oTo.',
    '.oTo.o.oTo.ooTo.',
    'oTTToTToTTToTTTo',
    'oTTtTTtTTTtTTTto',
    'oTtTTtTTtTtTTTto',
    '.oTTTTTTTTTTTTo.',
    '..oooooooooooo..'], { o: '#1e2a1a', T: '#4c7a3a', t: '#2f5226' }, 'thorns');
  const gateRows = ['oooooooooooooooo'];
  for (let i = 1; i < 15; i++) gateRows.push(i === 3 || i === 12 ? 'oWWWWWWWWWWWWWWo' : 'oWwoWwoWwoWwoWwo');
  gateRows.push('oooooooooooooooo');
  const gate = sprite(gateRows, WOOD, 'gate');
  const targetRows = [
    'oooooooooooooooo',
    'oWwwwwwwwwwwwwWo',
    'oWwwwwooooowwwWo',
    'oWwwooRRRRRoowWo',
    'oWwoRRRWWWRRRowo',
    'oWwoRRWWWWWRRowo',
    'oWwoRRWWRWWRRowo',
    'oWwoRRWWWWWRRowo',
    'oWwoRRRWWWRRRowo',
    'oWwwooRRRRRoowWo',
    'oWwwwwooooowwwWo',
    'oWwwwwwwwwwwwwWo',
    'oWWWWWWWWWWWWWWo',
    'oooooooooooooooo',
    '.....oPPPPo.....',
    '.....oPPPPo.....'];
  const target = { off: sprite(targetRows, Object.assign({ R: '#d9503a' }, WOOD, { W: '#f6e6c8' }), 'target'),
    on: sprite(targetRows.map(r => r.replace(/[RW]/g, ch => ch === 'R' ? 'G' : 'L')), Object.assign({ G: '#6cbf4e', L: '#d8f0b8' }, WOOD), 'target-on') };
  const lily = sprite([
    '....oooooooo....',
    '..ooGGGGGGGGoo..',
    '.oGGgGGGGGGGgGGo',
    'oGGGGGGGgGGGGGGo',
    '.oggggggggggggo.',
    '..oooooooooooo..'], { o: '#1f3a2a', G: '#5fae5a', g: '#3f8a44' }, 'lily');
  const plank = sprite([
    'oooooooooooooooo',
    'oWWWWWWWWWWWWWWo',
    'oWwwwwwwwwwwwwWo',
    'oowwowwwwowwwwoo',
    'oooooooooooooooo',
    '.o.o........o.o.'], WOOD, 'plank');
  const puff = [sprite(['.ww.', 'wWWw', 'wWWw', '.ww.'], { w: '#b9c8d4', W: '#eef3f6' }, 'puff'), sprite(['..ww..', '.wWWw.', 'wWWWWw', 'wWWWWw', '.wWWw.', '..ww..'], { w: '#b9c8d4', W: '#eef3f6' }, 'puff2')];
  const star = sprite(['.o.', 'ooo', '.o.'], { o: '#fff2b8' }, 'star');
  const drop = sprite(['..oo..', '.oWLo.', 'oWWLLo', 'oLLLlo', '.oLlo.', '..oo..'], { o: '#1d4a55', W: '#e8fbff', L: '#8fd9d0', l: '#2f7f88' }, 'drop');
  const FIRE = { o: '#5a1a0a', R: '#d9503a', O: '#f28b2a', Y: '#ffd34a', W: '#fff3b0', k: '#2a1a14', g: '#4a3a2a' };
  const fire = [sprite([
    '.......Y........',
    '......YY....Y...',
    '.....OYY...Y....',
    '....OOYY..OY....',
    '...ROOYYY.OOY...',
    '..RROOYYYROOYY..',
    '..RROOYYYROOYYR.',
    '.RRROOYYYROOYYR.',
    '.RRROOOYYYOOOYRR',
    'RRRROOOYYYOOORRR',
    'RRRRROOOOOOORRRR',
    '.RRRRROOOOORRRR.',
    '..RRRRRRRRRRRR..',
    '.ggkkgkkgkkgkkgg',
    'gkkggkkgkkgkkgkk',
    '.ggggggggggggg..'], FIRE, 'fire'), sprite([
    '....Y...........',
    '....YY.....Y....',
    '...OYY....YY....',
    '...OOYY..OYY....',
    '..ROOYY.ROOY....',
    '..ROOYYYROOYY...',
    '.RROOYYYROOYYR..',
    '.RROOOYYYOOYYRR.',
    'RRROOOYYYOOOYRRR',
    'RRRROOOYYYOOORRR',
    'RRRRROOOOOOORRRR',
    '.RRRRROOOOORRRR.',
    '..RRRRRRRRRRRR..',
    '.ggkkgkkgkkgkkgg',
    'gkkggkkgkkgkkgkk',
    '.ggggggggggggg..'], FIRE, 'fire2')];
  const ash = sprite(['.kk.', 'kggk', 'kggk', '.kk.'], { k: '#2a1a14', g: '#4a3a2a' }, 'ash');
  const ring = sprite([
    '....oo....',
    '....oo....',
    '...oMMo...',
    '..oMLLMo..',
    '.oMLooLMo.',
    '.oMo..oMo.',
    '.oMLooLMo.',
    '..oMmmMo..',
    '...oMMo...',
    '....oo....'], { o: '#2a2418', M: '#b98a3a', L: '#e6c46a', m: '#8a6428' }, 'ring');
  const PLATE = { o: '#2e2f3a', S: '#7d8290', s: '#565a68', L: '#a6abb8', R: '#d9503a', G: '#6cbf4e' };
  const plate = { off: sprite(['..oooooooooooo..', '.oLLLLLLLLLLLLo.', '.oSSSRRRRRRSSSo.', 'oosssssssssssso.', 'oooooooooooooooo'], PLATE, 'plate'),
    on: sprite(['................', '................', '..oooooooooooo..', 'ooLLGGGGGGGGLLoo', 'oooooooooooooooo'], PLATE, 'plate-on') };
  const PIN = { o: '#3a2416', P: '#6b4a30', p: '#4a3020', W: '#e8f0c8', w: '#c8d0a8', R: '#d95a4a', Y: '#f2c53d', B: '#5fae5a' };
  const pinwheel = [sprite([
    '.......oo.......',
    '..oo..oWWo..oo..',
    '.oRRo.oWWo.oYYo.',
    '.oRRRooWWooYYYo.',
    '..oRRRoWWoYYYo..',
    '...ooRRWWYYoo...',
    'ooooooWWWWoooooo',
    'oBBBBBWWWWRRRRRo',
    'oBBBBBWWWWRRRRRo',
    'ooooooWWWWoooooo',
    '...ooYYWWBBoo...',
    '..oYYYoWWoBBBo..',
    '.oYYYooWWooBBBo.',
    '.oYYo.oWWo.oBBo.',
    '..oo..oPpo..oo..',
    '......oPpo......'], PIN, 'pinwheel'), sprite([
    'oo.....oo.....oo',
    'oRRo..oWWo..oYYo',
    'oRRRo.oWWo.oYYYo',
    '.oRRRooWWooYYYo.',
    '..oRRRoWWoYYYo..',
    '...ooRRWWYYoo...',
    '....ooWWWWoo....',
    '...oBBWWWWRRo...',
    '...oBBWWWWRRo...',
    '....ooWWWWoo....',
    '...ooYYWWBBoo...',
    '..oYYYoWWoBBBo..',
    '.oYYYooWWooBBBo.',
    'oYYYo.oWWo.oBBBo',
    'oYYo..oPpo..oBBo',
    'oo....oPpo....oo'], PIN, 'pinwheel2')];
  const hard = sprite([
    'oooooooooooooooo',
    'oLLLLLsLLLLLLLLo',
    'oLSSSsSSSSSsSSSo',
    'oMMMMMMMMMMMMMMo',
    'oLSsSSSSSSsSSSSo',
    'oSsSSSSSSSsSSSSo',
    'oSSsSSSSSsSSSSSo',
    'oSSSsSSSsSSSSSSo',
    'oSSSSsSsSSSSSSSo',
    'oSSSSSsSSSSSSSSo',
    'oSSSSSSsSSSSSSSo',
    'oSSSSSSSsSSSSSSo',
    'oMMMMMMMMMMMMMMo',
    'oSSSSSSSSSsSSSSo',
    'osssssssssssssso',
    'oooooooooooooooo'], { o: '#2b2f38', S: '#6f747c', s: '#3f444c', L: '#8d9299', M: '#b98a3a' }, 'hard');
  const raft = sprite([
    '.oooooooooooooooooooooo.',
    'oWwWwWwWwWwWwWwWwWwWwWwo',
    'oWWWWWWWWWWWWWWWWWWWWWWo',
    'oPwwwwwwwwwwwwwwwwwwwwPo',
    'oPPPPPPPPPPPPPPPPPPPPPPo',
    '.oooooooooooooooooooooo.',
    '..oPPo..........oPPo....',
    '..oooo..........oooo....'], { o: '#3a2416', W: '#c78d4e', w: '#a56f38', P: '#6b4a30' }, 'raft');
  function cloudLayer(color, seed) {
    const c = canvas(480, 50), g = c.getContext('2d'), r = rng(seed); g.fillStyle = color;
    for (let i = 0; i < 6; i++) { const x = (r() * 480) | 0, y = 6 + (r() * 30) | 0, w = 30 + (r() * 50) | 0; for (let k = 0; k < 5; k++) { const bw = (w * (0.4 + r() * 0.6)) | 0, bh = 3 + (r() * 5) | 0; g.fillRect(x + ((r() * w) | 0) - bw / 2, y + k * 2 - bh / 2, bw, bh); } }
    return c;
  }
  // Storm clouds: a low, heavy bank with lighter bellies, tiled sideways.
  function stormLayer(seed) {
    const c = canvas(480, 64), g = c.getContext('2d'), r = rng(seed);
    const blob = (x, y, rad, col) => { g.fillStyle = col; for (let dy = -rad; dy <= rad; dy++) { const hw = Math.round(Math.sqrt(rad * rad - dy * dy)); for (const dx of [-480, 0, 480]) g.fillRect(x - hw + dx, y + dy, hw * 2, 1); } };
    const clouds = []; for (let i = 0; i < 14; i++) clouds.push({ x: (r() * 480) | 0, y: 8 + (r() * 22) | 0, n: 3 + (r() * 4) | 0, rad: 7 + (r() * 7) | 0 });
    for (const pass of [['#1c2430', 2], ['#10151d', 0]]) for (const cl of clouds) for (let k = 0; k < cl.n; k++) { const rr = r(); blob(cl.x + k * cl.rad, cl.y + pass[1] + ((rr * 4) | 0), Math.round(cl.rad * (.7 + rr * .5)), pass[0]); }
    g.fillStyle = '#10151d'; g.fillRect(0, 0, 480, 12);
    return c;
  }
  // The old flooded mill on the horizon; its sails are drawn live so they turn in the wind.
  function millLayer() {
    const c = canvas(40, 70), g = c.getContext('2d');
    g.fillStyle = '#0d1219'; for (let y = 0; y < 52; y++) { const hw = 6 + (y * 7 / 52) | 0; g.fillRect(20 - hw, 18 + y, hw * 2, 1); }
    g.fillRect(12, 14, 16, 5); g.fillRect(14, 11, 12, 3); g.fillRect(17, 9, 6, 2);
    g.fillStyle = '#f2c46a'; g.fillRect(18, 40, 3, 4); g.fillStyle = '#8a6a3a'; g.fillRect(18, 44, 3, 1);
    return c;
  }
  const mossWall = sprite([
    'dDdgDdDDdgDdDDdd',
    'DdgDDdgDDdgDDdgD',
    'dDgdDvDdgDdDvDdD',
    'DDdDvdDdDdDvdDdD',
    'dgDdvDdgDgDvDdgd',
    'DdDdvDDdDdDvDDdD',
    'DDgdvdgDdgdvdDDd',
    'dDdDvDDdDDDvDgDd',
    'DgDdvdDgDdDvdDdD',
    'dDdDvDdDdgDvDdDd',
    'DDdgvDDdDDdvDDgD',
    'dgDdvdDgdDDvdDdD',
    'DdDDvDdDDgDvDDdD',
    'dDgdvDgdDdDvDdgd',
    'DDdDvdDDdDdvdDdD',
    'dgDdDdgDdgDDDdgd'], { d: '#4a3222', D: '#5a3d28', g: '#5e8a2e', v: '#3f7a2a' }, 'mosswall');
  // Bocados: what Bigotes eats to learn each trick.
  const morsels = {
    soplido: sprite(['...W....', '.W.W.W..', '..WWW...', 'WWWgWWW.', '..WWW...', '.W.g.W..', '...g....', '...g....'], { W: '#f4f6f8', g: '#9ab06a' }, 'vilano'),
    aleteo: sprite(['..oo....', '.oYYo...', 'oYWWYo..', 'oYWYYo..', '.oYYo.o.', '..oo.o..', '..k.k...', '...k....'], { o: '#6a5a1a', Y: '#ffe36a', W: '#fffbd0', k: '#3a2a14' }, 'luciernaga'),
    ventosa: sprite(['...oo...', '..oSLo..', '.oSSSLo.', 'oSsSSSLo', 'oSsssSSo', 'oPPPPPPo', '.oPpPpo.', '..oooo..'], { o: '#3a2a22', S: '#c8a06a', s: '#94714a', L: '#f0d8a0', P: '#d98a8a', p: '#b06060' }, 'lapa'),
    chorro: sprite(['...oo...', '..oBBo..', '.oBLLBo.', 'oBLWWLBo', 'oBBLLBBo', '.oGGGGo.', '..oGGo..', '...oo...'], { o: '#1f3a5a', B: '#4a7fd0', L: '#8ab8ff', W: '#e8f4ff', G: '#5fae5a' }, 'nenufar'),
    mordisco: sprite(['...oo...', '..oMo...', '..oMo...', '..oMo...', '..oMo.o.', '..oMooMo', '...oMMo.', '....oo..'], { o: '#2a2418', M: '#b8b0a0' }, 'anzuelo'),
    panzazo: sprite(['..oooo..', '.oLLSSo.', 'oLLSSSSo', 'oLSSSSso', 'oSSSSsso', 'oSSsssso', '.osssso.', '..oooo..'], { o: '#2e2f3a', S: '#7d8290', s: '#565a68', L: '#a6abb8' }, 'canto'),
    guindilla: sprite(['.....gg.', '....og..', '...oRo..', '..oRRo..', '..oRRo..', '.oRRo...', '.oRo....', '.oo.....'], { o: '#4a1a1a', R: '#e0402a', g: '#5fae5a' }, 'guindilla'),
    resbalon: sprite(['.G......', 'G.G..G..', '.GG.G.G.', '..GGG...', '.GgGgG..', 'GgGGGgG.', '.GGgGG..', '..GGG...'], { G: '#5fae5a', g: '#2f7f88' }, 'alga') };
  const cracked = sprite([
    'oooooooooooooooo',
    'oLLLLLsLLLLLLLLo',
    'oLSSSsSSSSSsSSSo',
    'oLSSsSSSSSSsSSSo',
    'oLSsSSSSSSsSSSSo',
    'oSsSSSSSSSsSSSSo',
    'oSSsSSSSSsSSSSSo',
    'oSSSsSSSsSSSSSSo',
    'oSSSSsSsSSSSSSSo',
    'oSSSSSsSSSSSSSSo',
    'oSSSSSSsSSSSSSSo',
    'oSSSSSSSsSSSSSSo',
    'oSSSSSSSSsSSSSSo',
    'oSSSSSSSSSsSSSSo',
    'osssssssssssssso',
    'oooooooooooooooo'], { o: '#3b3f45', S: '#8a8f94', s: '#4f545a', L: '#a9aeb3' }, 'cracked');

  // ---------------------------------------------------------------- Tierra, hierba y agua
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const GROUND = { dirt: '#5a3d28', dark: '#4a3222', light: '#6b4a30', root: '#3e2a1c', stone: '#7a6a58', grass: '#7fb040', grassDark: '#5e8a2e', grassLight: '#a3cf52' };
  function dirtTile(seed) {
    const c = canvas(16, 16), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = GROUND.dirt; g.fillRect(0, 0, 16, 16);
    for (let i = 0; i < 22; i++) { g.fillStyle = r() < .55 ? GROUND.dark : GROUND.light; g.fillRect((r() * 16) | 0, (r() * 16) | 0, 1 + (r() < .3 ? 1 : 0), 1); }
    if (r() < .5) { g.fillStyle = GROUND.stone; const x = 2 + (r() * 10) | 0, y = 3 + (r() * 9) | 0; g.fillRect(x, y, 3, 2); g.fillStyle = GROUND.dark; g.fillRect(x, y + 2, 3, 1); }
    if (r() < .5) { g.fillStyle = GROUND.root; const x = 1 + (r() * 12) | 0, y = 1 + (r() * 10) | 0; g.fillRect(x, y, 1, 4); g.fillRect(x + 1, y + 3, 1, 2); g.fillRect(x - 1, y + 1, 1, 1); }
    return c;
  }
  const dirt = [1, 2, 3, 4].map(dirtTile);
  const grassCap = [sprite([
    '.g..gG.g...gG...',
    'gGGgGGGgGgGGGGgG',
    'GGGGGGGGGGGGGGGG',
    'gGgGGgGGGgGGgGGg',
    'dgdgdgdgdgdgdgdg'], { G: GROUND.grass, g: GROUND.grassDark, d: GROUND.dirt, L: GROUND.grassLight }, 'grass'), sprite([
    '...gG..g..G.g...',
    'GgGGGGgGGGGGGGgG',
    'GGGLGGGGGGLGGGGG',
    'gGGgGGgGgGGGGgGg',
    'gdgdgdgdgdgdgdgd'], { G: GROUND.grass, g: GROUND.grassDark, d: GROUND.dirt, L: GROUND.grassLight }, 'grass2')];
  const roots = sprite(['dgdgdgdgdgdgdgdg', 'd.d.d.d.d...d.d.', '..r...r..r....r.', '..r......r......', '..........r.....'], { d: GROUND.dark, g: GROUND.dirt, r: GROUND.root }, 'roots');
  const edgeL = sprite(['l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l'], { l: GROUND.light }, 'edgeL');
  const edgeR = sprite(['d', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd'], { d: GROUND.dark }, 'edgeR');
  const WATER = { deep: '#1d4a55', mid: '#246270', top: '#2f7f88', foam: '#8fd9d0', glint: '#c8f2ea' };
  const water = [];
  for (let f = 0; f < 4; f++) {
    const c = canvas(16, 16), g = c.getContext('2d');
    g.fillStyle = WATER.top; g.fillRect(0, 0, 16, 16);
    g.fillStyle = WATER.mid; g.fillRect(0, 6, 16, 10); g.fillStyle = WATER.deep; g.fillRect(0, 12, 16, 4);
    g.fillStyle = WATER.foam; for (let x = 0; x < 16; x++) { const y = Math.round(1 + Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1); g.fillRect(x, y, 1, 1); }
    g.fillStyle = WATER.glint; g.fillRect((f * 5 + 3) % 16, 3, 2, 1); g.fillRect((f * 5 + 11) % 16, 8, 3, 1);
    water.push(c);
  }
  const waterDeep = (() => { const c = canvas(16, 16), g = c.getContext('2d'); g.fillStyle = WATER.deep; g.fillRect(0, 0, 16, 16); g.fillStyle = WATER.mid; g.fillRect(3, 5, 4, 1); g.fillRect(10, 12, 3, 1); return c; })();
  const reed = sprite(['..o..', '.oGo.', '.oGo.', '.ogo.', '..g..', '..g..', '..g..', 'g.g..', '.gg.g', '..gg.', '..g..', '..g..'], { o: '#4a3a24', G: '#6b4a30', g: '#5e8a2e' }, 'reed');
  const tuft = sprite(['g.G.g', 'gGgGg', '.ggg.'], { g: '#5e8a2e', G: '#7fb040' }, 'tuft');
  const shroomDeco = sprite(['.RRR.', 'RWRRR', 'ooooo', '.oWo.', '.oWo.'], { R: '#c26a8a', W: '#f0e0d0', o: '#3a1f2a' }, 'shroom');

  // ---------------------------------------------------------------- Fuente 5×7
  const GLYPHS = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '#....', '####.', '....#', '....#', '####.'],
    6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    'Á': ['...#.', '.###.', '#...#', '#...#', '#####', '#...#', '#...#'], 'É': ['...#.', '#####', '#....', '####.', '#....', '#....', '#####'],
    'Í': ['...#.', '#####', '..#..', '..#..', '..#..', '..#..', '#####'], 'Ó': ['...#.', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'Ú': ['...#.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], 'Ñ': ['.#..#', '#.##.', '#...#', '##..#', '#.#.#', '#..##', '#...#'],
    'Ü': ['.#.#.', '.....', '#...#', '#...#', '#...#', '#...#', '.###.'],
    '!': ['#', '#', '#', '#', '#', '.', '#'], '¡': ['#', '.', '#', '#', '#', '#', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'], '¿': ['..#..', '.....', '..#..', '.#...', '#....', '#...#', '.###.'],
    '.': ['..', '..', '..', '..', '..', '##', '##'], ',': ['..', '..', '..', '..', '.#', '.#', '#.'], ':': ['..', '##', '##', '..', '##', '##', '..'],
    "'": ['#', '#', '.', '.', '.', '.', '.'], '-': ['....', '....', '....', '####', '....', '....', '....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'], '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'], ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
    '·': ['..', '..', '..', '##', '##', '..', '..'], '♥': ['.#.#.', '#####', '#####', '#####', '.###.', '..#..', '.....'],
    '→': ['.....', '..#..', '...#.', '#####', '...#.', '..#..', '.....'], '←': ['.....', '..#..', '.#...', '#####', '.#...', '..#..', '.....'],
    '↑': ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '..#..'], '↓': ['..#..', '..#..', '..#..', '..#..', '#.#.#', '.###.', '..#..'],
    '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'], '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
    '~': ['.....', '.....', '.#..#', '#.#.#', '#..#.', '.....', '.....'], '★': ['..#..', '.###.', '#####', '.###.', '#.#.#', '.....', '.....'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'], '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'], ']': ['##', '.#', '.#', '.#', '.#', '.#', '##']
  };
  const glyphCache = new Map();
  function glyph(ch, color) {
    const key = ch + color; let c = glyphCache.get(key); if (c) return c;
    const rows = GLYPHS[ch]; if (!rows) return null;
    c = sprite(rows, { '#': color }, 'glyph'); glyphCache.set(key, c); return c;
  }
  function textWidth(str) {
    let w = 0; for (const ch of str.toUpperCase()) { if (ch === ' ') { w += 3; continue; } const rows = GLYPHS[ch]; w += (rows ? rows[0].length : 3) + 1; }
    return Math.max(0, w - 1);
  }
  // Dibuja texto en mayúsculas; align: 'left' | 'center' | 'right'. shadow pinta una sombra 1px abajo.
  function text(g, str, x, y, color = '#ffffff', align = 'left', shadow = null) {
    str = String(str).toUpperCase();
    const w = textWidth(str); if (align === 'center') x -= w >> 1; else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    if (shadow) { let cx = x; for (const ch of str) { if (ch === ' ') { cx += 3; continue; } const s = glyph(ch, shadow); if (s) g.drawImage(s, cx, y + 1); cx += (s ? s.width : 3) + 1; } }
    let cx = x; for (const ch of str) { if (ch === ' ') { cx += 3; continue; } const s = glyph(ch, color); if (s) g.drawImage(s, cx, y); cx += (s ? s.width : 3) + 1; }
    return w;
  }
  // Word wrap to a pixel width; returns lines.
  function wrap(str, maxW) {
    const words = String(str).split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (textWidth(t) > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }

  // ---------------------------------------------------------------- Logotipo
  function logo() {
    const word = 'GLUP', S = 4, pad = 6;
    const w = textWidth(word) * S + pad * 2, h = 7 * S + pad * 2 + 6;
    const c = canvas(w, h), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const mask = canvas(textWidth(word), 7); text(mask.getContext('2d'), word, 0, 0, '#000');
    const big = canvas(mask.width * S, 7 * S); const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(mask, 0, 0, big.width, big.height);
    // Outline: the mask stamped around in the outline colour, then the fill in three bands of blue like the fish.
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 3; dy++) if (dx * dx + dy * dy <= 5) g.drawImage(tint(big, '#1b2430'), pad + dx, pad + dy);
    g.drawImage(tint(big, '#26303f'), pad, pad + 3); g.drawImage(tint(big, '#26303f'), pad, pad + 4);
    const bands = [['#a9c4dd', 0, 7], ['#8aa3c0', 7, 13], ['#5f7899', 13, 21], ['#43597a', 21, 28]];
    for (const [col, y0, y1] of bands) { const t = tint(big, col); g.drawImage(t, 0, y0, big.width, y1 - y0, pad, pad + y0, big.width, y1 - y0); }
    // Highlight glints on the top-left of each letter and three whisker-orange dots at the end.
    g.fillStyle = '#e5eef6'; g.fillRect(pad + 3, pad + 2, 6, 2); g.fillRect(pad + 3, pad + 4, 2, 2);
    g.fillStyle = '#e79b3f'; g.fillRect(w - 10, pad + 22, 3, 3); g.fillRect(w - 6, pad + 18, 2, 2); g.fillRect(w - 5, pad + 13, 2, 2);
    c.w = w; c.h = h; return c;
  }

  // ---------------------------------------------------------------- Fondos
  function skyLayer(pal) {
    const c = canvas(320, 180), g = c.getContext('2d');
    const bands = pal.sky; const n = bands.length;
    for (let y = 0; y < 180; y++) {
      const t = y / 180 * (n - 1), i = Math.min(n - 2, t | 0), f = t - i;
      for (let x = 0; x < 320; x++) { g.fillStyle = ((x + y) & 1) === 0 && f > .5 || f > .85 ? bands[i + 1] : bands[i]; g.fillRect(x, y, 1, 1); }
    }
    // Moon with a dark limb and a few stars with different blink phases stored as pixels.
    const mx = pal.moon[0], my = pal.moon[1], r = 12;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y; if (d > r * r) continue;
      const inner = (x + 4) * (x + 4) + (y - 2) * (y - 2) < (r - 3) * (r - 3);
      g.fillStyle = d > (r - 1) * (r - 1) ? pal.moonEdge : inner ? pal.moonLight : pal.moonBase; g.fillRect(mx + x, my + y, 1, 1);
    }
    g.fillStyle = pal.moonEdge; g.fillRect(mx - 3, my + 5, 2, 1); g.fillRect(mx + 6, my - 4, 1, 1); g.fillRect(mx + 2, my + 8, 2, 1);
    const rr = rng(77); g.fillStyle = pal.star;
    for (let i = 0; i < 40; i++) { const x = (rr() * 320) | 0, y = (rr() * 90) | 0; if (Math.hypot(x - mx, y - my) > 20) g.fillRect(x, y, 1, 1); }
    return c;
  }
  function treeLayer(w, h, pal, seed, density, tall) {
    const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
    // Ground band with a ragged horizon, then trunks with drooping canopies and hanging moss.
    g.fillStyle = pal.fill;
    const base = h - 20;
    for (let x = 0; x < w; x++) { const y = base + Math.round(Math.sin(x / 13 + seed) * 2 + Math.sin(x / 5) * 1); g.fillRect(x, y, 1, h - y); }
    let x = (r() * 10) | 0;
    while (x < w) {
      const th = tall * (0.6 + r() * 0.5), tw = 3 + (r() * 3) | 0, top = base - th;
      g.fillStyle = pal.fill; g.fillRect(x, top + 6, tw, th);
      const cw = 14 + (r() * 16) | 0;
      for (let i = 0; i < 4; i++) { const cy = top + i * 5, half = (cw * (0.5 + i * 0.18)) >> 1; g.fillRect(x + (tw >> 1) - half, cy, half * 2, 5); }
      if (pal.moss) { g.fillStyle = pal.moss; for (let m = 0; m < 4; m++) { const mx = x + (tw >> 1) - (cw >> 1) + ((r() * cw) | 0), len = 4 + (r() * 10) | 0; g.fillRect(mx, top + 18, 1, len); } }
      x += cw * density + (r() * 20) | 0;
    }
    return c;
  }
  function reedLayer(w, pal, seed) {
    const c = canvas(w, 40), g = c.getContext('2d'), r = rng(seed);
    for (let i = 0; i < w / 6; i++) {
      const x = (r() * w) | 0, h = 12 + (r() * 24) | 0, y = 40 - h;
      g.fillStyle = pal.stem; g.fillRect(x, y, 1, h);
      if (r() < .5) { g.fillStyle = pal.head; g.fillRect(x - 1, y - 4, 3, 6); }
      else { g.fillStyle = pal.leaf; g.fillRect(x + 1, y + 4, 1, 3); g.fillRect(x + 2, y + 2, 1, 3); }
    }
    return c;
  }
  const THEMES = {
    dusk: { sky: ['#1c2140', '#2b2f5c', '#5a3e6b', '#a55a52', '#d8874a', '#e9b25e'], moon: [246, 30], moonBase: '#f4e6b8', moonLight: '#fff8e0', moonEdge: '#d9c48f', star: '#f0e6c8',
      far: { fill: '#3a2f52' }, mid: { fill: '#26283f', moss: '#334a3a' }, reeds: { stem: '#1e2a24', head: '#3b2a1c', leaf: '#2d4a2a' }, fog: '#6e4f6a', ground: '#10141c' },
    night: { sky: ['#0b0f1e', '#121a33', '#1a2a4a', '#1f3a52', '#265266', '#2f6a70'], moon: [252, 34], moonBase: '#e6f0f4', moonLight: '#ffffff', moonEdge: '#b6c8d4', star: '#dbe8ff',
      far: { fill: '#16243a' }, mid: { fill: '#0f1a2a', moss: '#1f3d3a' }, reeds: { stem: '#0d1a1a', head: '#2a1e14', leaf: '#1e3a26' }, fog: '#2f5566', ground: '#0a0d14' },
    cave: { sky: ['#0d0a12', '#160f1c', '#1f1526', '#2a1b30', '#33223a', '#3a2a40'], moon: [-100, -100], moonBase: '#000', moonLight: '#000', moonEdge: '#000', star: '#5d4a6e',
      far: { fill: '#241a2c' }, mid: { fill: '#1a1220', moss: '#4a3358' }, reeds: { stem: '#2a1e30', head: '#3a2a44', leaf: '#3c2a48' }, fog: '#4a3358', ground: '#0a070d' },
    storm: { sky: ['#0e1016', '#151a24', '#1c2330', '#232c3a', '#2a3442', '#33404c'], moon: [-100, -100], moonBase: '#000', moonLight: '#000', moonEdge: '#000', star: '#2a3442', cloud: 'rgba(120,140,160,.18)',
      far: { fill: '#1c2430' }, mid: { fill: '#121820', moss: '#24323a' }, reeds: { stem: '#0c1216', head: '#1e1a16', leaf: '#16241e' }, fog: '#3a4a58', ground: '#0a0d12' },
    nest: { sky: ['#3a1f3a', '#6b2f4a', '#a4444e', '#d0684a', '#e89a52', '#f2c46a'], moon: [60, 40], moonBase: '#fff1c4', moonLight: '#fffbe8', moonEdge: '#e8c98a', star: '#f6dfb0',
      far: { fill: '#5c2f4a' }, mid: { fill: '#3a2038', moss: '#6a4a3a' }, reeds: { stem: '#2a1a24', head: '#4a2a1c', leaf: '#4a3a2a' }, fog: '#b86a5a', ground: '#1a0d14' } };
  const bgCache = {};
  function background(theme) {
    if (bgCache[theme]) return bgCache[theme];
    const p = THEMES[theme];
    return bgCache[theme] = { clouds: theme === 'cave' ? null : cloudLayer(p.cloud || 'rgba(255,240,220,.10)', 41), sky: skyLayer(p), far: treeLayer(480, 120, p.far, 11, 1.2, 40), mid: treeLayer(640, 150, p.mid, 23, 1.4, 70), reeds: reedLayer(320, p.reeds, 31), fog: p.fog, ground: p.ground, theme: p, storm: theme === 'storm' ? stormLayer(57) : null, mill: theme === 'storm' ? millLayer() : null };
  }

  return { sprite, flip, tint, canvas, rng, text, textWidth, wrap, glyph, logo, background, THEMES, GROUND, WATER,
    nila, fish, hand, snail, frogSit, frogJump, mosquito, crab, heronBody, heronFly, wingUp, wingDown, wingMid, egg,
    crate, rock, pearl: cria, cria, criaFree, get ruca() { return Maestros.rucaFrames(); }, bubble, heart, drop, fire, ash, ring, plate, pinwheel, hard, raft, mossWall, morsels, heartEmpty, lantern, sign, boat, mushroom, mushroomSquash, thorns, gate, target, lily, plank, puff, star, cracked,
    dirt, grassCap, roots, edgeL, edgeR, water, waterDeep, reed, tuft, shroomDeco };
})();
