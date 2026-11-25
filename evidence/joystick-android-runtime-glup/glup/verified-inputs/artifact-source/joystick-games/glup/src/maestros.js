// GLUP — los maestros del pantano. Cada nivel tiene uno (la Q del mapa): un personaje que habla
// letra a letra en un cuadro con su retrato y, al acabar, le ofrece a Bigotes un bocado. El bocado
// vuela en arco hasta la boca del pez, Bigotes lo traga y aprende el truco (aprende.js). Algunos
// piden antes un pequeño encargo (llevarles algo, encender los faroles, apagar un fuego…).
// Cada maestro es una marioneta por piezas: respira, parpadea, tiene su gesto (Ruca da cabezadas, Lumi
// aletea con la tripa encendida, Canto olfatea…), mira a Nila cuando se acerca, habla, se alegra y coge
// impulso antes de lanzar el bocado desde la mano (o la pinza, o la boca).
//
// En el nivel:  maestro: { quien, poder, bocado?, dialogo: [...], despedida, charla?, encargo? }
//   quien       'ruca' 'lumi' 'lapa' 'olga' 'anselmo' 'canto' 'pinzas' 'alga'
//   poder       el truco que enseña (ver POWERS en game.js)
//   bocado      opcional: cómo se nombra lo que da ('una luciérnaga dorada'); si no, el de POWERS
//   dialogo     frases de la primera charla (la última suele ofrecer el bocado)
//   despedida   lo que dice en cuanto ya ha dado el bocado y en las visitas siguientes
//   encargo     opcional: { tipo, pide, hecho, ... } — mientras no se cumpla, dice `pide` y no da nada;
//               cumplido, dice `hecho` y da el bocado. Tipos:
//                 entregar  { cosa: 'crate'|'rock'|…, radio: px }   algo de esa clase quieto a menos de radio px
//                 faroles   { n }                                    n faroles encendidos (sin n: todos los del nivel)
//                 apagar    { radio: celdas }                        ninguna hoguera (F) a menos de radio celdas
//                 dianas    { n }                                    n dianas acertadas
// Se habla con {up} al lado del maestro (o tocando ▲); las frases avanzan con salto, Bigotes o tocando.
'use strict';

// ---------------------------------------------------------------- El cuadro de diálogo
// Shared by the teachers in the level and by Ruca on the map. Lines are typed a few letters a frame.
const Charla = (() => {
  let S = null;
  const SPEED = 1.2;
  function start(o) {
    const who = typeof o.quien === 'string' ? Maestros.QUIEN[o.quien] : o.quien;
    // Long speeches are cut into pages of three lines, so the bubble stays small and never swallows the scene.
    const pages = [];
    for (const raw of o.lines.filter(Boolean)) { const ls = Letra.wrap(Game.signText(null, raw), 190); for (let i = 0; i < ls.length; i += 3) pages.push(ls.slice(i, i + 3).join(' ')); }
    S = { who, ent: o.ent || null, lines: pages, i: 0, t: 0, alFinal: o.alFinal || null, wait: 8, shown: 0 };
    Input.release();
  }
  function stop() { S = null; }
  const active = () => !!S;
  const text = () => Game.signText(null, S.lines[S.i]);
  function update() {
    if (!S) return;
    S.t++; S.lineT = (S.lineT || 0) + 1; if (S.wait > 0) S.wait--;
    const full = text().length, before = Math.floor(S.shown);
    S.shown = Math.min(full, S.shown + SPEED);
    if (Math.floor(S.shown) > before && Math.floor(S.shown) % 3 === 0 && S.shown < full) Sound.play('talk', S.who.voz);
    if (S.ent) S.ent.talking = S.shown < full;
    const go = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Input.pressed.up || Game.tapped; Game.tapped = false;
    if (!go || S.wait > 0) return;
    if (S.shown < full) { S.shown = full; return; }
    Sound.play('select');
    if (++S.i < S.lines.length) { S.shown = 0; S.wait = 4; S.lineT = 0; return; }
    const f = S.alFinal, ent = S.ent; S = null; if (ent) ent.talking = false; Input.release();
    if (f) f();
  }
  // The speech bubble: it comes out of whoever speaks, with its tail pointing at them, above them if
  // there's room (below if not). Cream paper, a little portrait, the name on a wooden tag, the Glup
  // letters typed one by one with a pop, and a small fish bobbing when there's more to read.
  function draw(g) {
    if (!S) return;
    const who = S.who, str = text(), maxW = 190, lines = Letra.wrap(str, maxW), tw = Math.max(60, ...lines.map(Letra.width));
    const w = tw + 44, h = Math.max(34, lines.length * Letra.LINE + 16);
    // Where the speaker is on screen (or a spot at the bottom when nobody is in the scene).
    const e = S.ent, ax = e ? Math.round(e.x + e.w / 2 - Cam.x) : W / 2, ay = e ? Math.round(e.y - Cam.y + (e.fy || 0)) : H;
    let bx = Math.max(6, Math.min(W - w - 6, ax - Math.round(w * .35))), by = ay - h - 16, below = false;
    // Above the speaker whenever it fits (below only as a last resort), and never on top of Nila.
    const ny0 = Math.round(Player.y - Cam.y) - 6, nx0 = Math.round(Player.x - Cam.x) - 4;
    if (e && e !== Player && by + h + 10 > ny0 && bx < nx0 + 18 && bx + w > nx0) by = Math.min(by, ny0 - h - 10);
    if (!e) by = H - h - 8; else if (by < 4) { by = ay + (e.h || 16) + 16; below = true; }
    by = Math.max(4, Math.min(H - h - 4, by));
    // Pop in from the speaker's mouth, with a little overshoot; a squash on each new line.
    const k = Math.min(1, S.t / 9), sc = k < 1 ? .3 + .7 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * .12 : 1 + (S.lineT < 6 ? Math.sin(S.lineT / 6 * Math.PI) * .03 : 0);
    const ox = e ? Math.max(bx + 10, Math.min(bx + w - 10, ax)) : bx + w / 2, oy = below ? by : by + h;
    g.save(); g.translate(ox, oy); g.scale(sc, sc); g.translate(-ox, -oy);
    const O = '#2a1e2e', P = '#fff4dc', Pd = '#ecd6ae';
    // Tail toward the speaker.
    if (e) { const tx = Math.max(bx + 12, Math.min(bx + w - 12, ax)), ty0 = below ? by : by + h - 1, ty1 = below ? by - 10 : by + h + 9, tip = Math.max(-6, Math.min(6, ax - tx));
      for (let r = 0; r <= 10; r++) { const yy = below ? ty0 - r : ty0 + r, half = Math.round((10 - r) * .45), cx = Math.round(tx + tip * r / 10); g.fillStyle = O; g.fillRect(cx - half - 1, yy, half * 2 + 3, 1); if (half > 0 && r < 10) { g.fillStyle = P; g.fillRect(cx - half, yy, half * 2 + 1, 1); } } }
    // Rounded paper with a dark rim, a lit top and a soft shadow at the bottom.
    g.fillStyle = 'rgba(8,6,14,.35)'; g.fillRect(bx + 3, by + 3, w, h);
    g.fillStyle = O; g.fillRect(bx + 2, by, w - 4, h); g.fillRect(bx, by + 2, w, h - 4); g.fillRect(bx + 1, by + 1, w - 2, h - 2);
    g.fillStyle = P; g.fillRect(bx + 2, by + 1, w - 4, h - 2); g.fillRect(bx + 1, by + 2, w - 2, h - 4);
    g.fillStyle = Pd; g.fillRect(bx + 2, by + h - 4, w - 4, 2); g.fillStyle = '#ffffff'; g.fillRect(bx + 3, by + 2, w - 10, 1);
    // The little portrait in its round frame.
    const pw = 26, px = bx + 6, py = by + Math.round((h - pw) / 2);
    g.fillStyle = O; g.fillRect(px, py - 1, pw, pw + 2); g.fillRect(px - 1, py, pw + 2, pw);
    g.fillStyle = who.fondo || '#2e4a3a'; g.fillRect(px, py, pw, pw);
    g.save(); g.beginPath(); g.rect(px, py, pw, pw); g.clip(); Maestros.portrait(g, who, px, py, pw, pw, S.shown < str.length, S.t); g.restore();
    g.fillStyle = who.edge; g.fillRect(px, py + pw - 2, pw, 2);
    // The name on a wooden tag with two nails.
    const nw = Letra.width(who.name) + 12, nx = bx + 8, ny = by - 9;
    g.fillStyle = O; g.fillRect(nx - 1, ny - 1, nw + 2, 13); g.fillStyle = '#8a5a34'; g.fillRect(nx, ny, nw, 11); g.fillStyle = '#b07848'; g.fillRect(nx, ny, nw, 2); g.fillStyle = '#5a3a24'; g.fillRect(nx, ny + 9, nw, 2);
    g.fillStyle = '#e8d8b0'; g.fillRect(nx + 2, ny + 4, 1, 1); g.fillRect(nx + nw - 3, ny + 4, 1, 1);
    Letra.text(g, who.name, nx + 6, ny + 1, { color: '#fff4dc', light: '#ffffff', shadow: '#3a2418' });
    // The words, typed with a pop.
    let left = Math.floor(S.shown);
    lines.forEach((l, i) => { if (left > 0) Letra.text(g, l, bx + 38, by + 7 + i * Letra.LINE, { color: O, shadow: '#e2c9a0', shown: left, t: S.t }); left -= l.length + 1; });
    // More to read: a little fish nodding; the end: a small shell.
    if (S.shown >= str.length) {
      const ix = bx + w - 14, iy = by + h - 9 + ((S.t >> 3) % 2);
      if (S.i < S.lines.length - 1) { const f = ART.criaFree[(S.t >> 3) % 2]; g.drawImage(f, ix - 2, iy); }
      else { g.fillStyle = O; g.fillRect(ix, iy, 5, 4); g.fillStyle = '#f2c46a'; g.fillRect(ix + 1, iy + 1, 3, 2); }
    }
    g.restore();
  }
  return { start, stop, active, update, draw };
})();

// ---------------------------------------------------------------- Los maestros
const Maestros = (() => {
  // Overwrite `str` into a copy of `rows` at column x of row y ('_' leaves a pixel as it was).
  function put(rows, x, y, str) { const r = rows.slice(); const row = r[y].split(''); for (let i = 0; i < str.length; i++) if (str[i] !== '_') row[x + i] = str[i]; r[y] = row.join(''); return r; }
  function edit(rows, list) { for (const [x, y, s] of list || []) rows = put(rows, x, y, s); return rows; }
  // A face with its expressions: the base drawing plus edits for the eyes (rest, look, blink, happy…)
  // and for the mouth (shut, open, smile…), each combination baked the first time it's asked for.
  function faces(rows, pal, name, eyes, mouths) {
    const cache = {};
    return (eye, mouth) => { const k = eye + '|' + mouth; return cache[k] || (cache[k] = ART.sprite(edit(edit(rows, eyes[eye] || eyes.rest), mouths[mouth] || mouths.shut), pal, name + '-' + k)); };
  }
  const WIND = 18;   // frames of wind-up before the morsel leaves the teacher's hand

  // ---- Each teacher is a little puppet: parts (body, head, arms, props) drawn at offsets that move
  // with the moment — breathing, blinking, a gesture of their own, looking at Nila, talking, the
  // wind-up of the gift and a happy face after. pose(s) returns { L: [[img, x, y, alpha?]…], hand: [x, y],
  // glow?, fx? } in coordinates of the footprint (0,0 its top left, facing right; y < 0 is above it).
  let built = null;
  function build() {
    if (built) return built;
    const S = ART.sprite, B = {};


    // ---- Ruca, the old turtle: a big mossy shell with a flower on top, a knitted shawl, bushy white brows
    // over heavy lids, both hands on a knobbly cane. She dozes off now and then, taps the cane, and gives
    // her morsel with a big puff (the trick she teaches is the blow).
    const RUCA = { o: '#1e2418', M: '#9ac25a', m: '#5e8a3a', F: '#f27aa0', f: '#ffe36a', L: '#b8945a', S: '#8a6a3a', s: '#664a2a', d: '#40301e', H: '#d8c078', h: '#a88a50',
      J: '#cfe0a4', K: '#98b47a', k: '#6a8656', x: '#4a5e3e', W: '#fffbe8', w: '#c8c4b0', E: '#1d1a26', e: '#ffffff', q: '#4a2226', r: '#c9463a', R: '#f08a8a',
      P: '#9a5aa0', p: '#6a3a74', Q: '#c890c8', C: '#b07848', c: '#6b4a30', n: '#e8b878' };
    const rucaShell = S([
      '.....oooooo.....',
      '...ooMMMMMMoo...',
      '..oMMmFMMMmMMo..',
      '.oMmFfFmMMLLMSo.',
      '.oLLmLSdSSSdSSo.',
      'oLLSSSdSSSSdSSso',
      'oLSSSSdSSSSdSsso',
      'oSSdddddddddddso',
      'oSdSSSSSdSSSSdso',
      'ohHhHhHhHhHhHhho',
      '.oooooooooooooo.'], RUCA, 'ruca-shell');
    const rucaLegs = S([
      '..okKo...oKKo',
      '..oKKo...oKKo',
      '.oJKKo..oJKKo',
      '.ooooo..ooooo'], RUCA, 'ruca-legs');
    const rucaHead = faces([
      '...ooooo....',
      '..oJJJJKo...',
      '.oJJKKKKWWo.',
      'oJJKKWWWWwWo',
      'oJKKKwkkkKKo',
      'oKKKKKeEKkKo',
      'okKKqKKKKKqo',
      '.okKKqqqqqKo',
      '..ooooooooo.'], RUCA, 'ruca-head',
      { rest: [], look: [[6, 1, 'WWW'], [5, 2, 'WWWWW'], [5, 3, 'KKKKKK'], [5, 4, 'KKeE'], [6, 5, 'EE']], blink: [[5, 4, 'KKKK'], [5, 5, 'kkkK']], happy: [[5, 4, 'KkKK'], [5, 5, 'kKkK'], [2, 5, 'R']] },
      { shut: [], open: [[5, 7, 'qrrrq'], [5, 8, 'ooooo']], smile: [[4, 6, 'q'], [4, 7, 'Kq']], blow: [[1, 5, 'JJ'], [1, 6, 'kJJ'], [4, 6, 'K'], [5, 7, 'KKKKK'], [10, 6, 'q'], [11, 6, 'q']] });
    const rucaShawl = S([
      '.oooooo',
      'oQPQPQo',
      'oPpPpPo',
      'opoooo.',
      'oo.....'], RUCA, 'ruca-shawl');
    const rucaArm = S([
      '....ooo',
      '...oJKo',
      '.ooKKo.',
      'oKKko..',
      '.ooo...'], RUCA, 'ruca-arm');
    const rucaCane = S([
      '.oo.', 'onCo', 'oCco', '.oCo', '.oCo', '.oco', '.oCo', '.oCo', '.oco', '.oCo', '.oCo', '.oco', '.oCo', '.oo.'], RUCA, 'ruca-cane');
    B.ruca = { size: [24, 11], top: -6, face: [18, -2], shadow: [4, 14], gestureT: 230, pose(s) {
      const g = s.give, u = s.t % 300, doze = !s.talking && !s.near && g < 0 && u > 200 && u < 262, tap = !s.talking && g < 0 && (s.t % 150) > 140;
      let up = s.breath, hx = 12, hy = -6, eye = doze ? 'blink' : s.eye, mouth = s.mouth, cy = -3;
      if (doze) hy += 1; if ((s.near || s.happy) && !s.talking && !doze) hy -= 1; if (tap) cy -= 1;
      if (g >= 0 && g < WIND) { hx -= g > 5 ? 1 : 0; hy -= 1; mouth = 'blow'; eye = 'blink'; up = 1; }
      else if (g >= WIND && g < WIND + 14) { hx += 1; mouth = 'blow'; }
      return { L: [[rucaCane, 20, cy], [rucaLegs, 4, 7], [rucaShell, 3, -4 - up], [rucaHead(eye, mouth), hx, hy - up], [rucaShawl, 12, 2 - up], [rucaArm, 15, 2 - up + (tap ? -1 : 0)]], hand: [hx + 12, hy - up + 6] };
    }, life(e, s, at) {
      // A slow "z" while she dozes; little puffs as she blows.
      const u = s.t % 300; if (!s.talking && !s.near && u === 230) { const [x, y] = at(20, -9); Game.word('z', x, y, '#cfe8f0', false); }
      if (s.give >= WIND && s.give < WIND + 10) { const [x, y] = at(25, 0); spawnParts(1, x, y, { color: ['#e8fbff', '#cfe8f0'], angle: e.dir > 0 ? 0 : Math.PI, spread: .5, speed: [.8, 1.6], life: [8, 14], g: 0 }); }
    } };

    // ---- Lumi, the old firefly who lights the reeds: an orange cap of a head, white brows and a drooping
    // moustache, antennae with glowing tips, wings that never stop, a belly that glows and fades like a
    // breath, and a paper lantern hanging from a stick. The golden firefly she gives comes out of the lantern.
    const LUMI = { o: '#1e1628', n: '#f0a0a0', B: '#3e3458', b: '#2a2240', P: '#5a4e80', R: '#e8683a', r: '#b0402e', Z: '#ffa060', W: '#f6f0dc', w: '#b8b0c8', E: '#1d1826', e: '#ffffff',
      Y: '#ffe36a', y: '#e0a830', g: '#9a6a28', U: '#fff8c8', D: '#7a6a48', d: '#5a4a38', A: '#dff2fb', a: '#8fbcd4', L: '#ffb04a', l: '#e0702e', T: '#8a5a34', K: '#ffe0a0' };
    const lumiHead = faces([
      '...Y.....Y.',
      '....o...o..',
      '.....o.o...',
      '..ooooooo..',
      '.oPPBBBBBo.',
      'oPBWWBBWWBo',
      'oBBeEBBeEBo',
      'oBBeEBBeEBo',
      'oWBBBnnBBWo',
      'oWWWWWWWWWo',
      '.oWWoooWWo.',
      '..oo...oo..'], LUMI, 'lumi-head',
      { rest: [[3, 6, 'ww'], [7, 6, 'ww']], look: [[3, 4, 'WW'], [7, 4, 'WW'], [3, 5, 'BB'], [7, 5, 'BB']], blink: [[3, 6, 'BB'], [7, 6, 'BB'], [3, 7, 'ww'], [7, 7, 'ww']],
        happy: [[3, 6, 'ee'], [7, 6, 'ee'], [3, 7, 'BB'], [7, 7, 'BB'], [2, 8, 'n'], [8, 8, 'n']] },
      { shut: [], open: [[4, 10, 'oEEEo'], [4, 11, '.ooo.']], smile: [[4, 10, 'oWWWo']], blow: [] });
    // The belly: lit and dim, for the slow pulse.
    const belly = [
      '...oooo...',
      '.ooBbBboo.',
      'oBbBbBbBBo',
      'oYYYYYYYBo',
      'oYUUYYYYyo',
      'oYUYYYYyyo',
      'oyYYYYyyo.',
      '.oyyyyyo..',
      '..ooooo...'];
    const lumiBelly = [S(belly, LUMI, 'lumi-belly'), S(belly.map(r => r.replace(/[YUy]/g, c => ({ Y: 'y', U: 'Y', y: 'g' })[c])), LUMI, 'lumi-belly-dim')];
    const lumiThorax = S([
      '.ooooo.',
      'oZRRRRo',
      'orRRrro',
      '.oBBBo.',
      '.oo.oo.'], LUMI, 'lumi-collar');
    const lumiWing = [S([
      '..oo..',
      '.oAAo.',
      'oAaAAo',
      'oAAaAo',
      'oAAAao',
      '.oAAAo',
      '..oAo.',
      '...o..'], LUMI, 'lumi-wing-up'), S([
      '...ooo..',
      '.ooAAAo.',
      'oAAaAAAo',
      'oAaAAAo.',
      '.oAAoo..',
      '..oo....'], LUMI, 'lumi-wing-mid'), S([
      '.oooo...',
      'oAAAAoo.',
      'oAaAAAAo',
      '.ooAAaAo',
      '...oooo.'], LUMI, 'lumi-wing-flat')];
    const lumiLantern = S([
      '..o..',
      '.ooo.',
      'oLKLo',
      'oLLlo',
      'oLKLo',
      'olllo',
      '.ooo.',
      '..r..'], LUMI, 'lumi-lantern');
    const lumiArm = S(['oo..', 'oBo.', '.oBo', '..oo'], LUMI, 'lumi-arm'), lumiArmUp = S(['..oo', '.oBo', 'oBo.', 'oo..'], LUMI, 'lumi-arm-up');
    B.lumi = { size: [18, 18], top: -4, float: true, face: [12, 2], gestureT: 100, pose(s) {
      const g = s.give, lit = Math.sin(s.t / 14) > -.2, flap = (s.t >> 1) % 4, wing = lumiWing[[0, 1, 2, 1][flap]];
      const wx = [4, 1, 0, 1][flap], wy = [-4, -2, 1, -2][flap], hop = s.happy ? -((s.t >> 3) % 2) : 0;
      let hx = 7, hy = -5 + hop + (s.near && !s.talking ? -1 : 0), ax = 13, ay = 9, arm = lumiArm, swing = Math.round(Math.sin(s.t / 16) * .8);
      if (g >= 0 && g < WIND) { arm = lumiArmUp; ay = 5; swing = 0; hy -= 1; } else if (g >= WIND && g < WIND + 12) { ax += 2; swing = 1; }
      const lx = ax + 1 + swing, ly = arm === lumiArmUp ? ay - 5 : ay + 3, pulse = lit ? 1 : 0;
      return { L: [[wing, wx - 2, wy + 1, .5], [lumiBelly[lit ? 0 : 1], 0, 7 + hop], [lumiThorax, 7, 7 + hop], [wing, wx, wy, .8], [lumiHead(s.eye, s.mouth), hx, hy], [arm, ax, ay + hop], [lumiLantern, lx, ly + hop]],
        hand: [lx + 2, ly + 4], glow: [[5, 13, 6 + 2 * pulse, '#ffe36a', .12 + .08 * pulse], [lx + 2, ly + 4, 4 + (g >= 0 && g < WIND ? g / 5 : 0), '#ffb04a', .2]] };
    }, life(e, s, at) {
      // A trail of sparks drifting off the glowing belly, and a twinkle from the antennae.
      if (s.t % 6 === 0) { const [x, y] = at(rnd(1, 7), rnd(10, 15)); spawnParts(1, x, y, { color: ['#ffe36a', '#fff6d6'], speed: [0, .25], life: [16, 30], g: -.015 }); }
      if (s.give >= 0 && s.give < WIND && s.t % 2 === 0) { const h = art('lumi').pose(s).hand, [x, y] = at(h[0], h[1]); spawnParts(1, x + rnd(-3, 3), y + rnd(-3, 3), { color: ['#ffe36a', '#ffffff'], speed: [0, .4], life: [8, 14], g: 0 }); }
    } };

    // ---- Tía Lapa, a grumpy limpet stuck to her rock since forever: a ribbed shell with a flower on top,
    // frowning brows and a pout under the rim, hands on her hips. Now and then she lifts the shell for a
    // suspicious look around and drops it again with a thump.
    const LAPA = { o: '#241c22', L: '#f4e2b8', S: '#cdb48e', s: '#9a8062', T: '#6e5a48', F: '#f0a078', f: '#c86a52', K: '#6a3a2e', E: '#1d1826', e: '#ffffff', k: '#b85a48',
      G: '#e8c8a8', g: '#b8927a', R: '#7a7470', r: '#5a5452', q: '#9a948e', v: '#5e8a2e', V: '#8ab84a', p: '#f27aa0', y: '#ffe36a', P: '#ff9aa0' };
    const lapaShell = S([
      '........oooooo........',
      '......ooLLLSSSoo......',
      '.....oLLSSTSSTSso.....',
      '....oLLSTSSTSSTSso....',
      '...oLSSTSSSTSSSTsso...',
      '..oLSSTSSSSTSSSSTsso..',
      '.oLSSTSSSSSTSSSSSTsso.',
      'oLSSTSSSSSSTSSSSSSTsso',
      'osSSsSSsSSsSSsSSsSSsso',
      '.oooooooooooooooooooo.'], LAPA, 'lapa-shell');
    const lapaFlower = S(['.p.', 'pyp', '.pv', '..v'], LAPA, 'lapa-flower');
    const lapaBody = faces([
      '.oFFFFFFFFFFFFFFo.',
      '.oFFFFFFFFFFFFFFo.',
      'oKKKFFFFFFFFFFKKKo',
      'oFFKKKFFFFFFKKKFfo',
      'oFFFEEFFooFFEEFFfo',
      'oFFFFFFoFFoFFFFffo',
      'gGGGGGGGGGGGGGGGGg'], LAPA, 'lapa-body',
      { rest: [], look: [[1, 2, 'FKK'], [14, 2, 'KKF'], [3, 3, 'FKKF'], [11, 3, 'FKKF'], [4, 4, 'eE'], [12, 4, 'Ee']], blink: [[4, 4, 'KK'], [12, 4, 'KK']],
        happy: [[1, 2, 'FFF'], [14, 2, 'FFF'], [3, 3, 'FKKF'], [11, 3, 'FKKF'], [3, 4, 'KFFK'], [11, 4, 'KFFK'], [2, 5, 'P'], [15, 5, 'P']] },
      { shut: [], open: [[8, 4, 'FF'], [7, 5, 'oEEo'], [8, 6, 'oo']], smile: [[8, 4, 'FF'], [7, 5, 'oFFo'], [8, 6, 'oo']], blow: [] });
    // Hands on her hips: a grumpy aunt.
    const lapaHip = S(['oo.', 'oFo', 'oFo', 'oo.'], LAPA, 'lapa-hip');
    const lapaArmOut = S(['...oo', '..oFo', 'ooFo.', 'Ffo..', 'oo...'], LAPA, 'lapa-arm-out'), lapaArmBack = S(['oo...', 'oFo..', '.oFoo', '..oFF', '...oo'], LAPA, 'lapa-arm-back');
    const lapaRock = S([
      '.oooooooooooooooooooo.',
      'oqqRVRRRRRRRRRRRRVvRRo',
      'oqRRRvRrrRRRRRRrRRRrro',
      'oRRRRrRRRRRqRRRRRrrrro',
      '.ooooooooooooooooooooo'], LAPA, 'lapa-rock');
    B.lapa = { size: [22, 16], top: -6, face: [11, 7], shadow: [1, 20], gestureT: 250, pose(s) {
      const g = s.give, u = s.t % 320, peek = !s.talking && g < 0 && u > 230 && u < 290;
      let lift = peek ? (u < 236 ? u - 230 : u > 284 ? 290 - u : 6) / 3 | 0 : 0, eye = s.eye, arms = [[lapaHip, 0, 7], [ART.flip(lapaHip), 19, 7]];
      if (s.talking) lift = (s.t >> 3) % 2; if (s.happy) lift = 1 + (s.t >> 3) % 2;
      if (peek && eye === 'rest') eye = 'look';
      if (g >= 0 && g < WIND) { lift = Math.min(3, g >> 1); arms = [[lapaHip, 0, 7], [lapaArmBack, 17, 3 - lift]]; eye = 'look'; } else if (g >= WIND && g < WIND + 14) { lift = 2; arms = [[lapaHip, 0, 7], [lapaArmOut, 18, 4]]; }
      // Peeking: her eyes glance one way, then the other.
      const gl = peek && u > 240 && u < 280 ? (u < 260 ? -1 : 1) : 0;
      return { L: [[lapaRock, 0, 11], [lapaBody(eye, s.mouth), 2, 4], [lapaShell, 0, -4 - lift], [lapaFlower, 12, -6 - lift], ...arms], hand: arms[1][0] === lapaArmBack ? [21, 8] : arms[1][0] === lapaArmOut ? [22, 4] : [21, 8],
        fx: gl ? (g2, at) => { g2.fillStyle = '#f0a078'; for (const cx of [6, 14]) { const [x, y] = at(cx + (gl < 0 ? 1 : 0), 8); g2.fillRect(x, y, 1, 1); } } : null };
    }, life(e, s, at) {
      // The shell drops back with a puff of grit.
      if (!s.talking && s.give < 0 && s.t % 320 === 290) { const [x, y] = at(11, 4); spawnParts(5, x, y, { color: ['#cdb48e', '#9a8062'], speed: [.3, .9], life: [8, 16], g: .05 }); }
    } };

    // ---- Olga, the otter who runs the mill: a frilly white bonnet dusted with flour, whiskers, a cream
    // muzzle, a floury apron with a blue band and a thick tail that swishes. She pats the flour off her
    // apron in little clouds.
    const OLGA = { o: '#2a1a14', W: '#ffffff', w: '#d8d4dc', v: '#a8a4b4', F: '#8a5a3a', f: '#6a4028', U: '#b0804e', C: '#f0dcb8', c: '#c8ae8a', N: '#2a1a14', E: '#1d1826', e: '#ffffff',
      m: '#7a3a2a', r: '#e27a7a', A: '#eef2f6', a: '#b8c4d0', B: '#4a7fc0', b: '#2e5a94', K: '#f4c8c8' };
    const olgaHead = faces([
      '...oooooo....',
      '..oWWWWWWo...',
      '.oWWwWWWWWo..',
      'oWWwWWvWWwWo.',
      'owWvwowowowo.',
      'oFFoUUUUFFo..',
      'oFFFUUeEFCCo.',
      'oFFFFFEEFCCNo',
      'ofFFFFFFCCCco',
      '.ofFFFFCCmCo.',
      '..ooFFCCCCo..',
      '....oooooo...'], OLGA, 'olga-head',
      { rest: [], look: [[6, 5, 'Uo'], [6, 6, 'eE']], blink: [[6, 6, 'UU'], [6, 7, 'ff']], happy: [[6, 6, 'fU'], [6, 7, 'Ff'], [4, 8, 'K']] },
      { shut: [], open: [[8, 9, 'CoC'], [8, 10, 'Cmo']], smile: [[8, 9, 'mCmC']], blow: [] });
    const olgaBody = S([
      '...oFFFFo...',
      '..oFFCCFFo..',
      '.oFFAAAAFFo.',
      '.oFAAAAAAFo.',
      '.oFBBBBBBFo.',
      '.oAAAAAAAAo.',
      'oAAAaAAAAAAo',
      'oAAAAAAAaAAo',
      'oaAAAAAAAAao',
      '.ooFFoooFFo.',
      '.oCCCo.oCCCo',
      '.ooooo.ooooo'], OLGA, 'olga-body');
    const olgaTail = [S([
      '......o',
      '.....oF',
      '....oFo',
      'o..oFFo',
      'FooFFo.',
      'oFFFo..',
      '.ooo...'], OLGA, 'olga-tail'), S([
      '.......',
      '......o',
      '.....oF',
      '....oFo',
      '.ooFFFo',
      'oFFFFo.',
      '.oooo..'], OLGA, 'olga-tail2')];
    const olgaArm = { rest: S(['oo.', 'oFo', 'oFo', 'oFo', 'oCo', 'oo.'], OLGA, 'olga-arm'), pat: S(['oo...', 'oFo..', '.oFo.', '.oFo.', '..oCo', '..oo.'], OLGA, 'olga-arm-pat'),
      back: S(['..oo', '.oCo', 'oFo.', 'oFo.', 'oo..'], OLGA, 'olga-arm-back'), out: S(['......', 'oooo..', 'oFFFo.', '.oooCo', '....o.'], OLGA, 'olga-arm-out') };
    B.olga = { size: [16, 22], top: 0, face: [9, 6], shadow: [2, 12], gestureT: 150, pose(s) {
      const g = s.give, u = s.t % 260, pat = !s.talking && g < 0 && u > 130 && u < 190, up = s.breath;
      let arm = olgaArm.rest, ax = 9, ay = 13, hx = 2, hy = 0, tail = olgaTail[(s.t >> 5) % 2];
      if (pat) { arm = (u >> 3) % 2 ? olgaArm.pat : olgaArm.rest; }
      if (s.near && !s.talking) hy = -up;
      if (g >= 0 && g < WIND) { arm = olgaArm.back; ax = 5; ay = 10; hx = 1; } else if (g >= WIND && g < WIND + 14) { arm = olgaArm.out; ax = 10; ay = 12; hx = 3; }
      const hand = arm === olgaArm.back ? [ax + 3, ay + 1] : arm === olgaArm.out ? [ax + 5, ay + 3] : [ax + 2, ay + 5];
      return { L: [[tail, 0, 12], [olgaBody, 2, 10], [olgaHead(s.eye, s.mouth), hx, hy + (s.talking ? (s.t >> 3) % 2 : 0)], [arm, ax, ay]], hand };
    }, life(e, s, at) {
      // Flour clouds while she pats the apron; a pinch of flour falling off the bonnet now and then.
      const u = s.t % 260; if (!s.talking && s.give < 0 && u > 130 && u < 190 && u % 16 === 8) { const [x, y] = at(10, 17); spawnParts(3, x, y, { color: ['#ffffff', '#ece6dc'], speed: [.2, .6], life: [14, 26], g: -.01 }); }
      if (s.t % 90 === 0) { const [x, y] = at(rnd(4, 11), 4); spawnParts(1, x, y, { color: '#ffffff', speed: [0, .1], life: [20, 30], g: .02 }); }
    } };

    // ---- Don Anselmo, the old fisherman: a green oilskin hat, a big white beard, a red nose and his pipe,
    // a navy jumper and waders. His rod points out over the water and the float bobs on its line; now and
    // then he gives it a little tug.
    const ANS = { o: '#1e1a24', H: '#4a6a3a', h: '#2e4a2a', J: '#6e8e4a', S: '#f0c8a0', s: '#c8906a', R: '#e0705a', W: '#f8f4ec', w: '#c8c0b8', x: '#948c88', N: '#34406a', n: '#262e50', I: '#4a5a8a',
      P: '#6a5a44', p: '#4a3e30', B: '#3a3a44', b: '#26262e', T: '#7a4a24', t: '#f28a3a', E: '#1d1826', e: '#ffffff', q: '#6a2a2a' };
    const ansHead = faces([
      '.....oooooo.....',
      '....oJJJJHHo....',
      '...oJJHHHHHho...',
      '.oooooooooooooo.',
      'ohhhhhhhhhhhhhho',
      '.ooosSSSSSSSoo..',
      '...osSSwwSSSo...',
      '...osSSSeESSSo..',
      '...owSSSSSRRSo..',
      '..owWWWWWWRRWo..',
      '..owWWWWWWWWWo..',
      '..owwWWWWWWWWo..',
      '...owwWWWWWWo...',
      '....owwWWWwo....',
      '.....oowwoo.....'], ANS, 'anselmo-head',
      { rest: [[8, 7, 'ss'], [8, 6, 'WW']], look: [[8, 6, 'ww'], [8, 7, 'eE']], blink: [[8, 7, 'ss'], [8, 6, 'ww']], happy: [[8, 6, 'ww'], [8, 7, 'Ss'], [6, 8, 'R']] },
      { shut: [], open: [[7, 10, 'WqqW'], [7, 11, 'WqqW']], smile: [[8, 10, 'ww']], blow: [] });
    const ansBody = S([
      '...oNNNNNNNo...',
      '..oNNNNNNNNNo..',
      '.oNINNNNNNNNNo.',
      '.oNINNnNNNNNNo.',
      '.oNNNNnNNNNNNo.',
      '.oNNNNnNNNNnNo.',
      '.onnnnnnnnnnno.',
      '..oPPPPoPPPPo..',
      '..oPPPpoPPPpo..',
      '..oBBBBoBBBBo..',
      '..oBBBBoBBBBo..',
      '.oBBBBBoBBBBBo.',
      '.ooooooooooooo.'], ANS, 'anselmo-body');
    const ansArm = { rod: S(['oo...', 'oNo..', 'oNNo.', '.oNSo', '..oo.'], ANS, 'anselmo-arm'), tug: S(['..oo', '.oSo', 'oNo.', 'oNo.', 'oo..'], ANS, 'anselmo-arm-tug'),
      back: S(['oo..', 'oNo.', 'oNo.', 'oSo.', 'oo..'], ANS, 'anselmo-arm-back'), out: S(['.....', 'ooo..', 'oNNoo', '.ooSo', '...o.'], ANS, 'anselmo-arm-out') };
    const ansPipe = S(['..ooo', 'oooTo', 'tTTTo', 'ooooo'].map(r => r), ANS, 'anselmo-pipe');
    const ansFloat = S(['.o.', 'oWo', 'oRo', '.o.'], ANS, 'anselmo-float');
    B.anselmo = { size: [18, 25], top: 0, face: [9, 8], shadow: [2, 14], gestureT: 160, pose(s) {
      const g = s.give, u = s.t % 240, tug = !s.talking && g < 0 && u > 150 && u < 170, up = s.breath;
      let arm = ansArm.rod, ax = 11, ay = 14, hx = 1, hy = up;
      if (tug) arm = ansArm.tug;
      if (s.near && !s.talking) hy = 0;
      const rod = tug ? [14, 14, 22, 3] : [14, 17, 24, 8];
      if (g >= 0 && g < WIND) { arm = ansArm.back; ax = 3; ay = 14; hx = 0; } else if (g >= WIND && g < WIND + 14) { arm = ansArm.out; ax = 12; ay = 13; hx = 2; }
      const hand = arm === ansArm.back ? [ax + 1, ay + 3] : arm === ansArm.out ? [ax + 4, ay + 3] : [ax + 3, ay + 3];
      // The float bobs on the line under the rod's tip.
      const bob = Math.round(Math.sin(s.t / 18) * 1.5) + (tug ? -3 : 0);
      return { L: [[ansBody, 1, 12], [ansHead(s.eye, s.mouth), hx, hy], [ansPipe, hx + 12, hy + 10], [arm, ax, ay]], hand,
        fx: rod ? (g2, at) => {
          const [x0, y0, x1, y1] = rod; g2.fillStyle = '#6b4a30';
          for (let k = 0; k <= 12; k++) { const [x, y] = at(Math.round(x0 + (x1 - x0) * k / 12), Math.round(y0 + (y1 - y0) * k / 12)); g2.fillRect(x, y, 1, 1); }
          const [tx, ty] = at(x1, y1); g2.fillStyle = '#e8e0cc'; g2.fillRect(tx, ty, 1, 1);
          g2.fillStyle = 'rgba(220,230,240,.55)'; const len = 14 + bob; for (let k = 1; k < len; k++) { const [x, y] = at(x1 + Math.round(Math.sin(s.t / 30 + k / 4) * .6), y1 + k); g2.fillRect(x, y, 1, 1); }
          const [fx, fy] = at(x1 + 1, y1 + len); g2.drawImage(ansFloat, fx - 1 - (at(1, 0)[0] < at(0, 0)[0] ? 1 : 0), fy);
        } : null };
    }, life(e, s, at) {
      // Pipe smoke, slow and blue.
      if (s.t % 18 === 0) { const [x, y] = at(17, 10); spawnParts(1, x, y, { color: ['#c8d0d6', '#9fa8b0'], angle: -Math.PI / 2, spread: .3, speed: [.2, .4], life: [30, 50], g: -.01, kind: 'smoke' }); }
    } };

    // ---- Canto, the mole: pops out of his mound in velvet fur, with round spectacles on a pink star of a
    // nose that never stops sniffing, and two big pink digging hands. He pushes his glasses up, scratches
    // at the dirt, and peers hard at whoever comes near.
    const CANTO = { o: '#1a1420', W: '#fff8ec', F: '#4a3e5a', f: '#32283e', U: '#6e6284', u: '#8a7ea0', N: '#f28aa0', n: '#c85a78', M: '#ffc0cc', H: '#f0a8a0', h: '#c87a78', G: '#dbe8f4', g: '#9ab0c8', Z: '#ffffff',
      E: '#1d1826', e: '#ffffff', D: '#6b4a30', d: '#4a3222', L: '#8a6a44', l: '#a8845a', q: '#5a2a3a', r: '#e27a8a' };
    const cantoHead = faces([
      '....oooooooo....',
      '..ooUUuuUUFFoo..',
      '.oUUuUUUUFFFFFo.',
      '.oUUUFFFFFFFFFo.',
      'oUUFFFFFFFFFFFFo',
      'oFFoooFFFFoooFFo',
      'oFoGZGooooGZGoFo',
      'oFoGEGoFfoGEGofo',
      'oFoGGGoFFoGGgofo',
      'oFFoooNNNNoooffo',
      'oFFFFNMNNnNFFffo',
      '.oFFFFNnnNFFFfo.',
      '.oFFFFoWWoFFffo.',
      '..offFFFFFFffo..',
      '...oooooooooo...'], CANTO, 'canto-head',
      { rest: [], look: [[4, 8, 'E'], [11, 8, 'E'], [4, 6, 'G'], [11, 6, 'G'], [3, 6, 'Z'], [10, 6, 'Z']], blink: [[3, 7, 'ggg'], [10, 7, 'ggg']],
        happy: [[3, 7, 'GEG'], [10, 7, 'GEG'], [3, 8, 'EGE'], [10, 8, 'EGE'], [1, 10, 'r'], [14, 10, 'r']] },
      { shut: [], open: [[6, 12, 'oqqo'], [7, 13, 'WW']], smile: [[5, 12, 'ooWWoo']], blow: [] });
    // The star nose: its fingers spread and gather as he sniffs.
    const cantoSniff = S(['N.NN.N', '.NMMN.', 'N.nn.N'], CANTO, 'canto-sniff');
    const cantoHand = { rest: S(['.oooo.', 'oHHHHo', 'oHhHho', 'ZoZoZo'], CANTO, 'canto-hand'), dig: S(['.oooo.', 'oHHHHo', 'oHhHho', '.ZoZoZ'], CANTO, 'canto-hand-dig'),
      up: S(['Z.Z.Z', 'oHoHo', 'oHHHo', 'oHhHo', '.ooo.'], CANTO, 'canto-hand-up') };
    const cantoMound = S([
      '..oooooooooooooo..',
      '.oDlDDLDDDlDDLDDo.',
      'oDDDdDDDlDDDdDDlDo',
      'oDlDDDdDDDDDDDdDdo',
      'odDDdDDdDDdDDdDDdo',
      '.oooooooooooooooo.'], CANTO, 'canto-mound');
    B.canto = { size: [18, 15], top: -4, face: [9, 3], shadow: [1, 16], gestureT: 60, pose(s) {
      const g = s.give, u = s.t % 280, push = !s.talking && g < 0 && u > 40 && u < 80, dig = !s.talking && g < 0 && u > 180 && u < 230, sniff = (s.t >> 2) % 6 < 2;
      let hy = -4 + s.breath, eye = s.eye, lh = [cantoHand.rest, -1, 8], rh = [cantoHand.rest, 13, 8];
      if (s.near && !s.talking) hy -= 1;
      // He pushes his glasses up his nose with one claw.
      if (push) { rh = [cantoHand.up, 11, (u > 50 && u < 70) ? hy + 8 : 6]; }
      if (dig) { const k = (u >> 2) % 2; lh = [k ? cantoHand.dig : cantoHand.rest, -1, 8 + k]; rh = [k ? cantoHand.rest : cantoHand.dig, 13, 9 - k]; }
      if (g >= 0 && g < WIND) { rh = [cantoHand.up, 14, -2 + (g >> 3)]; hy -= 1; } else if (g >= WIND && g < WIND + 14) { rh = [cantoHand.dig, 15, 5]; }
      const hand = rh[0] === cantoHand.up ? [rh[1] + 2, rh[2]] : [rh[1] + 5, rh[2] + 1];
      return { L: [[cantoHead(eye, s.mouth), 1, hy], [sniff ? cantoSniff : null, 6, hy + 9], [cantoMound, 0, 10], lh, rh], hand,
        // The spectacles catch the light when he peers at Nila.
        fx: s.near && (s.t % 90) < 8 ? (g2, at) => { g2.fillStyle = '#ffffff'; const [x, y] = at(4 + (s.t % 90 >> 2) + ((s.t % 90) > 3 ? 7 : 0), hy + 6); g2.fillRect(x, y, 1, 1); } : null };
    }, life(e, s, at) {
      const u = s.t % 280; if (!s.talking && s.give < 0 && u > 180 && u < 230 && u % 8 === 0) { const [x, y] = at(u % 16 ? 3 : 15, 10); spawnParts(2, x, y, { color: ['#6b4a30', '#8a6a44'], speed: [.4, 1.1], life: [10, 18], g: .12, angle: -Math.PI / 2, spread: 1.2 }); }
    } };

    // ---- Don Pinzas, the crab cook: a puffed chef's hat between his eye stalks, a curly moustache,
    // an apron over the red shell, a ladle in one claw and a big snapper of a claw that clacks while he
    // thinks. The eyes on stalks sway each on its own.
    const PIN = { o: '#34121a', R: '#e0563e', r: '#a8302a', L: '#ff9a72', D: '#7a2020', W: '#ffffff', w: '#d0d8e4', v: '#9aa4b8', E: '#1d1826', e: '#ffffff', K: '#2a1a14', k: '#5a3a2a',
      A: '#f4ecdc', a: '#c8bca8', S: '#c8c8d0', s: '#7a7a88', M: '#5a1a1a', q: '#ffc0a8' };
    const pinHat = S([
      '.oooooo.',
      'oWWWwWWo',
      'oWWWWWwo',
      'oWwWWWvo',
      '.oWWWWo.',
      '.ovwvwo.',
      '.owvwvo.',
      '.oooooo.'], PIN, 'pinzas-hat');
    const pinEye = faces([
      '.oooo.',
      'oWWWWo',
      'oWEEWo',
      'oWEEWo',
      '.oooo.',
      '..oRo.',
      '..oRo.',
      '..oro.'], PIN, 'pinzas-eye',
      { rest: [], look: [[1, 2, 'WWEE'], [1, 3, 'WWEE']], blink: [[1, 1, 'RRRR'], [1, 2, 'rrrr'], [1, 3, 'RRRR']], happy: [[1, 1, 'WEEW'], [1, 2, 'EWWE'], [1, 3, 'WWWW']] }, { shut: [] });
    const pinBody = faces([
      '....oooooooooo....',
      '..ooLLLRRRRRRRoo..',
      '.oLLRRRRRRRRRRRRo.',
      'oLRRRRRRRRRRRRRRro',
      'oRRRRMRRRRRRMRRRro',
      'oRRRRRMMMMMMRRRRro',
      'oRRRRRRRRRRRRRRrro',
      'orRAAAAAAAAAAAARro',
      '.orAAAaAAAAAAaAro.',
      '..oooooooooooooo..'], PIN, 'pinzas-body',
      { rest: [] }, { shut: [], open: [[7, 6, 'oMMo'], [7, 7, 'AooA']], smile: [[7, 6, 'MRRM'], [8, 7, 'MM']] });
    const pinLegs = S([
      '.oRo.oRo..oRo.oRo.',
      'oRo..oRo..oRo..oRo',
      'oo...oo....oo...oo'], PIN, 'pinzas-legs');
    const pinClaw = { shut: S(['..ooo..', '.oLRRo.', 'oLRRoRo', 'oRRRoRo', 'oRRRRRo', '.orrro.', '..ooo..'], PIN, 'pinzas-claw'),
      open: S(['oo...oo', 'oLo.oRo', 'oRRooRo', 'oRRRRRo', 'oRRRRRo', '.orrro.', '..ooo..'], PIN, 'pinzas-claw-open') };
    const pinArm = S(['.oo', 'oRo', 'oo.'], PIN, 'pinzas-arm'), pinHold = S(['.oo.', 'oLRo', 'oRRo', '.oo.'], PIN, 'pinzas-hold');
    const pinLadle = S(['oooo.', 'oSSSo', 'osSso', '.oso.', '..os.', '..os.', '..os.', '..os.', '..oo.'].map(r => r.padEnd(5, '.')), PIN, 'pinzas-ladle');
    B.pinzas = { size: [22, 18], top: -4, face: [11, 4], shadow: [2, 18], gestureT: 90, pose(s) {
      const g = s.give, u = s.t % 200, clack = !s.talking && g < 0 && u > 80 && u < 120, stir = Math.round(Math.sin(s.t / 20));
      let claw = clack && (u >> 2) % 2 ? pinClaw.open : pinClaw.shut, cx = 18, cy = 3 + s.breath, bob = s.talking ? (s.t >> 3) % 2 : 0;
      if (s.talking && (s.t >> 4) % 3 === 0) claw = pinClaw.open;
      if (s.happy) { claw = (s.t >> 3) % 2 ? pinClaw.open : pinClaw.shut; cy = 1; }
      if (g >= 0 && g < WIND) { claw = pinClaw.shut; cx = 17; cy = -1; } else if (g >= WIND && g < WIND + 14) { claw = pinClaw.open; cx = 19; cy = 2; }
      const e1 = Math.round(Math.sin(s.t / 23)), e2 = Math.round(Math.sin(s.t / 17 + 1)), ex = s.portrait ? 4 : 1, ey = s.portrait ? -2 : -4;   // in the close-up the eyes lean in
      return { L: [[pinLegs, 2, 15], [pinBody(s.eye, s.mouth), 2, 5 + bob], [pinHat, 7, -3 + bob], [pinEye(s.eye, 'shut'), ex + e1, ey + bob], [pinEye(s.eye, 'shut'), 22 - ex - 6 + e2, ey + bob],
        [pinLadle, -1 + stir, 1], [pinHold, -1, 8], [pinArm, 19, 9], [claw, cx, cy]], hand: [cx + 3, cy + 1] };
    }, life(e, s, at) {
      // Clack! A spark of a sound when the claw snaps shut.
      const u = s.t % 200; if (!s.talking && s.give < 0 && u > 80 && u < 120 && u % 8 === 4) { const [x, y] = at(22, 4); spawnParts(2, x, y, { color: ['#ffffff', '#ffd0c0'], speed: [.4, 1], life: [5, 9], g: 0 }); }
    } };

    // ---- Alga, the eel: rises in a lazy S from her puddle, a frond of weed for hair, a pale belly, a fin
    // along her back, eyes that never quite open. Her whole body sways like a ribbon in the current.
    const ALGA = { o: '#10261c', G: '#3e8048', g: '#2a6038', L: '#6ab45a', l: '#9ad06a', Y: '#e0dc98', y: '#b0ac70', F: '#7cc85a', f: '#4a9a3a', E: '#1d1826', e: '#ffffff', k: '#2a6038',
      q: '#6a2a3a', r: '#e27a8a', P: '#f29ab0', w: '#5cc4bc', W: '#bdf0e4', d: '#2a8a90' };
    const algaHead = faces([
      '..fFFf.........',
      '.fFlFFf........',
      'fFoooooooo.....',
      'Ffo.LLGGGGoo...',
      'f.oLlGGGGGGGo..',
      'F.oLGGkkkkGGGo.',
      'f.oGGGGkeEGGGo.',
      '..oGGGGGGGGYYYo',
      '...oGGGYqYYYYo.',
      '....oGYYYqqqo..',
      '.....ooooooo...'], ALGA, 'alga-head',
      { rest: [], look: [[6, 5, 'GGGG'], [7, 5, 'eE'], [7, 6, 'EE']], blink: [[6, 5, 'GGGG'], [7, 6, 'kkk']], happy: [[6, 5, 'GGGG'], [7, 5, 'kGk'], [7, 6, 'GGG'], [5, 7, 'P']] },
      { shut: [], open: [[9, 8, 'qrrq'], [9, 9, 'oqqo']], smile: [[8, 8, 'qYYYq'], [9, 9, 'qqq']], blow: [] });
    // Her body as horizontal strips that each sway on their own phase (drawn from the bottom up).
    const algaBody = S([
      '.....oGGGYYo...',
      '....oGGGYYyo...',
      '...ogGGGYYo....',
      '..ogGGGYYyo....',
      '..oGGGGYYo.....',
      '.oGGGGYYyo.....',
      '.oGGGYYYo......',
      '.oGGGGYYYo.....',
      '..oGGGGYYYo....',
      '..oGGGGGYYYo...',
      '...oGGGGGYYYo..',
      '...ooooooooooo.'], ALGA, 'alga-body');
    const algaFin = S(['.o', 'oF', 'oF', 'Fo', 'Fo', 'oF'], ALGA, 'alga-fin');
    const algaPuddle = [S([
      '..wwwwwwwwwwwwwwwwww..',
      '.wWWwwwwwwwwwwwwWWwww.',
      'wwwwddwwwwwwwwdwwwwwww'], ALGA, 'alga-puddle'), S([
      '...wwwwwwwwwwwwwwwwww.',
      '.wwWWwwwwwwwwwwwwwWWw.',
      'wwwwwdwwwwwwwwwdwwwwww'], ALGA, 'alga-puddle2')];
    B.alga = { size: [24, 18], top: -5, face: [15, -1], shadow: [2, 20], gestureT: 40, pose(s) {
      const g = s.give, sway = k => Math.round(Math.sin(s.t / 22 - k * .5) * (1 + k * .25));
      let lean = 0, hy = -5 + s.breath;
      if (s.near && !s.talking) hy -= 1;
      if (g >= 0 && g < WIND) lean = -2; else if (g >= WIND && g < WIND + 14) lean = 2;
      const L = [[algaPuddle[(s.t >> 4) % 2], 1, 15]], bx = 5, by = 3;
      // Strips of the body, top ones sway the most.
      for (let i = 0; i < 4; i++) L.push([algaStrip[i], bx + sway(3 - i) + (i === 0 ? lean : 0), by + i * 3]);
      L.push([algaFin, bx + 1 + sway(2), by + 2]);
      const hx = 9 + sway(4) + lean, eye = s.eye;
      L.push([algaHead(eye, s.mouth), hx, hy]);
      return { L, hand: [hx + 13, hy + 8] };
    }, life(e, s, at) {
      // Sleepy bubbles rising from the puddle.
      if (s.t % 40 === 0) { const [x, y] = at(rnd(4, 18), 16); spawnParts(1, x, y, { color: ['#bdf0e4', '#e8fbff'], speed: [.1, .3], life: [20, 34], g: -.02, angle: -Math.PI / 2, spread: .2 }); }
    } };
    const algaStrip = [0, 1, 2, 3].map(i => { const c = ART.canvas(algaBody.width, 3); c.getContext('2d').drawImage(algaBody, 0, i * 3, algaBody.width, 3, 0, 0, algaBody.width, 3); c.w = c.width; c.h = 3; return c; });
    built = B; return B;
  }

  // ---- Who they are: name, colours of the dialogue box, pitch of the voice.
  const QUIEN = {
    ruca: { name: 'Ruca', edge: '#8aa84a', tag: '#d8f0b8', fondo: '#2e4a3a', voz: 150 },
    lumi: { name: 'Lumi', edge: '#e0b84a', tag: '#fff3b8', fondo: '#2a2a4e', voz: 520 },
    lapa: { name: 'Tía Lapa', edge: '#c8a06a', tag: '#f4dca8', fondo: '#3a3440', voz: 260 },
    olga: { name: 'Olga', edge: '#6a9ad0', tag: '#d8e8ff', fondo: '#3a3048', voz: 330 },
    anselmo: { name: 'Don Anselmo', edge: '#7a9a6a', tag: '#e8f0d8', fondo: '#2a3444', voz: 120 },
    canto: { name: 'Canto', edge: '#b08a5a', tag: '#f0d8b8', fondo: '#3a2c30', voz: 210 },
    pinzas: { name: 'Don Pinzas', edge: '#e0604a', tag: '#ffd0c0', fondo: '#3a2430', voz: 280 },
    alga: { name: 'Alga', edge: '#5aa86a', tag: '#d0f4d0', fondo: '#1e3a3c', voz: 170 } };
  for (const k in QUIEN) QUIEN[k].id = k;
  const art = who => build()[typeof who === 'string' ? who : who.id];
  // The mood of the moment, shared by every puppet: which eyes and mouth, a slow breath, the gift's frame.
  function mood(t, talking, near, happy, give) {
    const b = t % 197, blink = b < 5 || ((t / 197 | 0) % 3 === 1 && b > 10 && b < 14);
    const eye = give >= 0 && give < WIND ? 'look' : happy ? 'happy' : blink ? 'blink' : near || talking ? 'look' : 'rest';
    const mouth = talking ? [ 'open', 'shut', 'open', 'wide', 'shut'][(t >> 2) % 5] : happy ? 'smile' : 'shut';
    return { t, talking, near, happy, give, eye, mouth: mouth === 'wide' ? 'open' : mouth, breath: Math.sin(t / 24) > .35 ? 1 : 0 };
  }
  // Draw a pose at (x, y) = the footprint's top left on screen, facing dir (the art faces right).
  function drawPose(g, a, P, x, y, dir) {
    const W0 = a.size[0];
    if (P.glow) for (const [lx, ly, r, c, al] of P.glow) { g.globalAlpha = al; g.fillStyle = c; g.beginPath(); g.arc(dir > 0 ? x + lx : x + W0 - lx, y + ly, Math.max(0, r), 0, 7); g.fill(); }
    g.globalAlpha = 1;
    for (const [img, px, py, al] of P.L) if (img) { if (al) g.globalAlpha = al; if (dir > 0) g.drawImage(img, x + px, y + py); else g.drawImage(ART.flip(img), x + W0 - px - img.width, y + py); if (al) g.globalAlpha = 1; }
    if (P.fx) P.fx(g, (lx, ly) => [dir > 0 ? x + lx : x + W0 - 1 - lx, y + ly], dir);
  }
  function stateOf(e) {
    const give = regalo && regalo.e === e ? regalo.t + WIND : -1;
    return mood(e.t + (e.seed || 0), e.talking, e.near, e.happyT > 0 || e.flag > 0 || give >= WIND, give);
  }
  // The portrait in the speech bubble: the same puppet at twice the size, framed on the face.
  let pc = null;
  function portrait(g, who, x, y, w, h, talking, t) {
    const a = art(who), P = a.pose(Object.assign(mood(t, talking, true, false, -1), { portrait: true })), [fx, fy] = a.face;
    if (!pc) { pc = document.createElement('canvas'); pc.width = 64; pc.height = 64; }
    const pg = pc.getContext('2d'); pg.clearRect(0, 0, 64, 64);
    drawPose(pg, a, P, 32 - fx, 32 - fy, 1);
    const sw = Math.ceil(w / 2), sh = Math.ceil(h / 2), bob = talking && (t >> 3) % 2 ? 1 : 0;
    g.drawImage(pc, 32 - (sw >> 1), 32 - (sh >> 1) + bob, sw, sh, x, y, sw * 2, sh * 2);
  }

  // ---------------------------------------------------------------- En el nivel
  const TALK_R = 34;
  function spawn(px, py, def, prev) {
    const who = QUIEN[def && def.quien] || QUIEN.ruca, a = art(who), [w, h] = a.size;
    const e = { kind: 'maestro', who, def: def || { quien: 'ruca', dialogo: ['…'] }, x: px + 8 - Math.round(w / 2), y: py + 16 - h, w, h, t: (px * 7) % 200, dir: -1,
      met: false, done: false, talking: false, near: false, flag: 0, happyT: 0, fy: a.top || 0, update, draw };
    if (prev) { e.met = prev.met; e.done = prev.done; }
    return e;
  }
  function given(e) { return !!(e.def.poder && Save.has(e.def.poder)); }
  // For captures and tests: every quest counts as done.
  let forced = false; const force = v => { forced = !!v; };
  // The quest's condition, checked every frame.
  function quest(e) {
    const q = e.def.encargo; if (!q || forced) return true;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    switch (q.tipo) {
      case 'entregar': return !!delivered(e);
      case 'faroles': { const n = q.n || L.ents.filter(o => o.kind === 'lantern').length; return L.lit.size >= n; }
      case 'apagar': { const r = q.radio || 5, tx = Math.floor(cx / TS), ty = Math.floor(cy / TS); for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (tileAt(x, y) === 'F') return false; return true; }
      case 'dianas': return L.hitTargets.size >= (q.n || 1);
    }
    return true;
  }
  function delivered(e) {
    const q = e.def.encargo, cx = e.x + e.w / 2, cy = e.y + e.h / 2, r = q.radio || 40;
    return L.ents.find(o => !o.dead && o.kind === q.cosa && !o.held && Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < r);
  }
  // Where the hand (claw, mouth…) is right now, in the world.
  function handPos(e) { const a = art(e.who), P = a.pose(stateOf(e)), [hx, hy] = P.hand; return { x: e.dir > 0 ? e.x + hx : e.x + e.w - hx, y: e.y + hy + fly(e) }; }
  function update(e) {
    e.t++; const p = Player;
    if (e.happyT > 0) e.happyT--;
    if (!e.talking && !regalo) e.dir = p.x + 5 < e.x + e.w / 2 ? -1 : 1;
    e.near = !p.dead && !p.win && Math.abs(p.x + 5 - (e.x + e.w / 2)) < TALK_R + e.w / 2 && Math.abs(p.y + p.h - (e.y + e.h)) < 30;
    e.fy = (art(e.who).top || 0) + fly(e);
    const ok = quest(e);
    if (ok && !e.done && e.def.encargo && !given(e)) { e.done = true; e.flag = 40; Sound.play('switch'); Game.word('¡!', e.x + e.w / 2, e.y - 10, '#ffe36a', true); spawnParts(10, e.x + e.w / 2, e.y, { color: ['#ffe36a', '#fff6d6'], speed: [.5, 1.8], life: [14, 26], g: -.02 }); }
    if (e.flag > 0) e.flag--;
    // Each teacher has a little life of their own (fireflies, pipe smoke, flour, bubbles…).
    live(e);
    if (e.near && !Charla.active() && !Game.learning && !regalo && p.onGround && !p.sucking && p.charge < 8 && !p.grapple && Input.pressed.up) talk(e);
  }
  function live(e) { const a = art(e.who); if (a.life) a.life(e, stateOf(e), (lx, ly) => [e.dir > 0 ? e.x + lx : e.x + e.w - lx, e.y + ly + fly(e)]); }
  function live(e) { const a = art(e.who); if (a.life) a.life(e, stateOf(e), (lx, ly) => [e.dir > 0 ? e.x + lx : e.x + e.w - lx, e.y + ly + fly(e)]); }
  const fly = e => art(e.who).float ? Math.round(Math.sin(e.t / 20) * 2) - 3 : 0;
  function draw(e, g) {
    const a = art(e.who), st = stateOf(e), P = a.pose(st);
    const x = Math.round(e.x - Cam.x), y = Math.round(e.y - Cam.y) + fly(e);
    if (!a.float) { g.fillStyle = 'rgba(8,6,14,.35)'; g.fillRect(x + (a.shadow ? a.shadow[0] : 2), Math.round(e.y - Cam.y) + e.h - 1, a.shadow ? a.shadow[1] : e.w - 4, 2); }
    drawPose(g, a, P, x, y, e.dir);
    // A bubble saying there is something to say (or, quest done, something to give).
    if (!e.near && !e.talking && !given(e)) {
      const bx = x + Math.round(e.w / 2) - 4, by = y + (a.top || 0) - 12 + Math.round(Math.sin(e.t / 8));
      if (e.done || (e.met && e.def.encargo && quest(e))) { g.fillStyle = '#120c18'; g.fillRect(bx + 2, by - 1, 5, 11); g.fillStyle = '#ffe36a'; g.fillRect(bx + 3, by, 3, 6); g.fillRect(bx + 3, by + 7, 3, 2); }
      else if ((e.t >> 5) % 2 || !e.met) g.drawImage(ART.bubble, bx, by);
    }
  }
  // Ruca as the guide of every level (game.js): the same puppet, standing in her smaller spot.
  function drawGuide(g, e, x, y) {
    const a = art('ruca'), st = mood(e.t | 0, e.talking, e.near, false, -1);
    drawPose(g, a, a.pose(st), x + Math.round((e.w - a.size[0]) / 2), y + e.h - a.size[1], e.dir);
  }
  // The prompt over the teacher when Nila is close: "↑ hablar", with the right key for the device.
  function drawOverlay(g) {
    if (regalo) drawGift(g);
    const e = L.maestro; if (!e || e.dead || !e.near || e.talking || Charla.active() || Game.learning || regalo || Game.paused || Player.dead) return;
    const cap = Input.mode === 'touch' ? '▲' : '↑', label = 'hablar', cw = ART.textWidth(cap) + 6, w = cw + ART.textWidth(label) + 8;
    const cx = Math.round(e.x - Cam.x + e.w / 2), y = Math.round(e.y - Cam.y) + e.fy - 18 + ((e.t >> 4) % 2);
    const x = clamp(cx - Math.round(w / 2), 2, W - w - 2);
    g.fillStyle = '#120c18'; g.fillRect(x - 1, y - 1, w + 2, 13); g.fillStyle = 'rgba(27,36,48,.95)'; g.fillRect(x, y, w, 11); g.fillStyle = e.who.edge; g.fillRect(x, y, w, 1);
    g.fillStyle = '#120c18'; g.fillRect(cx - 2, y + 11, 5, 2); g.fillRect(cx - 1, y + 13, 3, 1); g.fillStyle = 'rgba(27,36,48,.95)'; g.fillRect(cx - 1, y + 11, 3, 1); g.fillRect(cx, y + 12, 1, 1);
    g.fillStyle = '#e8e0cc'; g.fillRect(x + 2, y + 2, cw, 8); g.fillStyle = '#a89a80'; g.fillRect(x + 2, y + 9, cw, 1);
    ART.text(g, cap, x + 2 + cw / 2, y + 2, '#1b2430', 'center');
    Letra.text(g, label, x + cw + 5, y + 1, { color: '#fff6d6', shadow: '#120c18' });
  }

  // ---- The talk: what they say depends on whether the trick is given and the quest done.
  function talk(e) {
    const d = e.def, q = d.encargo, first = !e.met; e.met = true; e.talking = true;
    let lines, give = false;
    if (given(e) || !d.poder) lines = [d.despedida || d.charla || '…'];
    else if (q && !quest(e)) lines = first ? [...(d.dialogo || []), q.pide] : [q.pide];
    else { lines = first ? [...(d.dialogo || [])] : []; if (q) lines.push(q.hecho || '¡Gracias! Toma.'); if (!lines.length) lines = ['Toma, Bigotes.']; give = true; }
    Player.vx = 0; Player.sucking = false; Sound.suck(false); Player.dir = e.x + e.w / 2 > Player.x + 5 ? 1 : -1;
    Charla.start({ quien: e.who, ent: e, lines, alFinal: give ? () => offer(e) : null });
  }
  // ---- The gift: a wind-up with the morsel in the teacher's hand, then it leaves, arcs over and drops
  // into Bigotes' mouth. r.t runs from -WIND (the wind-up) to GIFT_T.
  let regalo = null;
  const GIFT_T = 42;
  function offer(e) {
    // A delivered thing is taken by the teacher.
    if (e.def.encargo && e.def.encargo.tipo === 'entregar') { const o = delivered(e); if (o) { o.dead = true; spawnParts(8, o.x + o.w / 2, o.y + o.h / 2, { color: ['#fff6d6', '#c9b08a'], speed: [.4, 1.4], life: [12, 22], g: .02 }); } }
    regalo = { e, t: -WIND, x0: 0, y0: 0, power: e.def.poder };
    const h = handPos(e); regalo.x0 = h.x; regalo.y0 = h.y;
    Sound.play('select'); Player.dir = h.x > Player.x + 5 ? 1 : -1;
  }
  function giftPos() {
    const r = regalo; if (r.t <= 0) return { x: r.x0, y: r.y0, k: 0 };
    const m = Player.mouth(), k = Math.min(1, r.t / GIFT_T), e = k * k * (3 - 2 * k); return { x: r.x0 + (m.x - r.x0) * e, y: r.y0 + (m.y - r.y0) * e - Math.sin(k * Math.PI) * 28, k };
  }
  function updateGift() {
    const r = regalo; r.t++;
    Player.animT++; updateParts(); r.e.t++; live(r.e); live(r.e);
    for (let i = L.words.length - 1; i >= 0; i--) { const w = L.words[i]; w.t++; if (w.t > w.life) L.words.splice(i, 1); }
    if (r.t <= 0) { const h = handPos(r.e); r.x0 = h.x; r.y0 = h.y; if (r.t === 0) { Sound.play('whoosh'); r.e.happyT = 150; spawnParts(6, h.x, h.y, { color: ['#ffe36a', '#fff6d6'], speed: [.4, 1.4], life: [8, 16], g: 0 }); } return; }
    const p = giftPos();
    if (r.t % 2 === 0) spawnParts(1, p.x, p.y, { color: ['#ffe36a', '#fff6d6', '#e8fbff'], speed: [0, .3], life: [10, 20], g: -.01 });
    if (r.t === GIFT_T - 8) { Player.swallowT = 12; Sound.play('pop'); }
    if (r.t >= GIFT_T) {
      regalo = null;
      Game.learn(r.power, r.e.who.name); if (Game.learning && r.e.def.bocado) Game.learning.food = r.e.def.bocado;
    }
  }
  function drawGift(g) {
    const p = giftPos(), spr = ART.morsels[regalo.power]; if (!spr) return;
    const x = Math.round(p.x - Cam.x), y = Math.round(p.y - Cam.y), s = 1 + Math.sin(p.k * Math.PI) * .6;
    // Held in the hand, it glints and grows a little as the teacher winds up.
    const hold = regalo.t < 0 ? 1 + regalo.t / WIND : 1;
    g.globalAlpha = .3 * hold; g.fillStyle = '#ffe36a'; g.beginPath(); g.arc(x, y, Math.max(0, (regalo.t < 0 ? 3 + 4 * hold : 7 * s)), 0, 7); g.fill(); g.globalAlpha = 1;
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(p.k * 6); g.drawImage(spr, -4, -4); g.restore();
  }
  const busy = () => Charla.active() || !!regalo;
  function updateModal() {
    if (regalo) { updateGift(); return; }
    Charla.update();
    // The world holds still, but it still breathes: teachers blink, particles drift.
    if (L.maestro) { L.maestro.t++; live(L.maestro); }
    updateParts(); Cam.shakeOnly();
  }
  function reset() { regalo = null; Charla.stop(); }

  // ---- Capture: ?escena=maestro&n=<0..7>&t=frames — the teacher of that trick, with Nila next to him,
  // t frames into the talk (t=0: just the prompt; large t: the gift and the learning card).
  function capture(c) {
    const pw = POWER_ORDER[c.n] || 'soplido', i = LEVELS.findIndex(d => d.maestro && d.maestro.poder === pw);
    Save.data.powers = {}; NIVEL.poderesAntes(i).forEach(k => { Save.data.powers[k] = true; });
    Game.startLevel(i); Game.banner = 0;
    const e = L.maestro; if (!e) { Game.frozen = true; return; }
    force(true);
    Player.x = e.x - 26; Player.y = e.y + e.h - 18; Player.dir = 1; Player.onGround = true; Cam.snap();
    for (let n = 0; n < 30; n++) Game.updatePlay();
    if (c.t > 0) {
      talk(e);
      for (let n = 0; n < c.t; n++) {
        Input.pressed = {}; if (c.x > 0 && n % c.x === c.x - 1 && Charla.active()) Input.pressed.confirm = true;
        Game.updatePlay(); Game.t++;
      }
    }
    Input.pressed = {}; Game.frozen = true;
  }
  // The sheet for checking the art: ?escena=maestros&n=<0..7> — one teacher at 3× in every mood
  // (idle, its gesture, blink, look, talk, happy, wind-up, throw), and the bubble portrait.
  function sheet(g, t) {
    g.fillStyle = '#3a4656'; g.fillRect(0, 0, W, H);
    const n = (Game.capture && Game.capture.n) || 0, k = Object.keys(QUIEN)[n % 8], a = art(k), [w0, h0] = a.size, top = a.top || 0;
    const moods = [['reposo', mood(20, false, false, false, -1)], ['gesto', mood(a.gestureT || 130, false, false, false, -1)], ['parpadeo', mood(0, false, false, false, -1)], ['mira', mood(20, false, true, false, -1)],
      ['habla', mood(0, true, true, false, -1)], ['feliz', mood(20, false, true, true, -1)], ['carga', mood(20, false, true, false, 10)], ['lanza', mood(20, false, true, true, WIND + 3)]];
    ART.text(g, QUIEN[k].name, 4, 3, '#fff6d6');
    const c = document.createElement('canvas'); c.width = w0 + 16; c.height = h0 - top + 8; const cg = c.getContext('2d');
    let x = 4, y = 20;
    for (const [label, s] of moods) {
      cg.clearRect(0, 0, c.width, c.height); cg.fillStyle = 'rgba(0,0,0,.3)'; cg.fillRect(8, 4 - top + h0, w0, 1);
      const P = a.pose(s); drawPose(cg, a, P, 8, 4 - top, 1); cg.fillStyle = '#ff3a3a'; cg.fillRect(8 + P.hand[0], 4 - top + P.hand[1], 1, 1);
      if (x + c.width * 2 > W) { x = 4; y += c.height * 2 + 10; }
      ART.text(g, label, x, y - 8, '#c8d0e0'); g.drawImage(c, x, y, c.width * 2, c.height * 2); x += c.width * 2 + 4;
    }
    // Live, in-world size, and the portrait talking.
    const px = W - 64, py = H - 34; g.fillStyle = QUIEN[k].fondo; g.fillRect(px, py, 26, 26); portrait(g, QUIEN[k], px, py, 26, 26, (t >> 6) % 2 === 1, t);
    g.fillStyle = QUIEN[k].fondo; g.fillRect(px + 30, py, 26, 26); portrait(g, QUIEN[k], px + 30, py, 26, 26, false, 0);
    const P = a.pose(mood(t, false, false, false, -1)); drawPose(g, a, P, px - w0 - 8, py + 26 - h0, 1);
  }
  // Ruca's three classic poses baked into canvases, for ART.ruca (the sprite sheets use them).
  let rf = null;
  // One pose of a teacher baked into a canvas, for scenes outside a level (the ending): talking, asleep, or at rest.
  const fcache = new Map();
  function frame(who, t, talking, seed = 0, sleep = false) {
    const id = typeof who === 'string' ? who : who.id, a = art(id), [w, h] = a.size, top = a.top || 0, T = (t + seed * 37) | 0, m = mood(T, !!talking, false, false, -1);
    if (sleep) { m.eye = 'blink'; m.mouth = 'shut'; }
    const key = id + '|' + (T >> 2) + '|' + m.eye + m.mouth + m.breath + (sleep ? 'z' : '');
    let c = fcache.get(key); if (c) return c;
    if (fcache.size > 240) fcache.clear();
    c = ART.canvas(w + 2, h - top); drawPose(c.getContext('2d'), a, a.pose(m), 0, -top, 1); fcache.set(key, c); return c;
  }
  function rucaFrames() {
    if (rf) return rf; const a = art('ruca'), [w, h] = a.size, top = a.top || 0;
    const bake = s => { const c = ART.canvas(w + 2, h - top), g = c.getContext('2d'); drawPose(g, a, a.pose(s), 0, -top, 1); c.w = c.width; c.h = c.height; return c; };
    return rf = { idle: bake(mood(20, false, false, false, -1)), blink: bake(mood(0, false, false, false, -1)), talk: bake(mood(0, true, true, false, -1)) };
  }
  return { QUIEN, spawn, busy, updateModal, drawOverlay, drawGuide, portrait, capture, sheet, reset, quest, force, build, rucaFrames, frame };
})();
