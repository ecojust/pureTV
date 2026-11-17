// GLUP — aprender un truco. Primero una escena de cine con bandas negras y cámara que se mueve sola: el
// bocado llega girando con su nombre en letra GLUP y todo va a cámara lenta hasta la boca; ¡ÑAM! congela
// la imagen un instante; el trago baja por Bigotes como un bulto de luz mientras Nila se asusta en una
// viñeta y el corazón late; un primerísimo plano del ojo se llena del color del truco; y el poder sube:
// luz de contorno, rayos, un círculo mágico y el efecto propio de cada truco (alas de luz, ventosas,
// espiral de agua, un anzuelo de luz, el suelo que se agrieta, llamas, un rastro resbaladizo, un remolino
// de aire) hasta un fogonazo con imágenes de impacto. Si además el sorbo sube de nivel, el cono de aire
// crece y se encienden las marcas. Después, como coger un objeto en Zelda: Nila alza a Bigotes con rayos
// y fanfarria, y entra girando una carta del truco (madera y pergamino): el nombre en letra GLUP, el
// bocado y el maestro en sus medallones, un diorama con el pantano de verdad que enseña el truco paso a
// paso, los botones que tiene el jugador (burbujas en el móvil, teclas, o A/X/B en el mando), qué hacer y
// para qué sirve. Con el sorbo nuevo, la carta se da la vuelta y enseña el sorbo más fuerte. Un toque salta.
'use strict';
const Aprende = (() => {
  // ---- The cinematic (frames): the morsel comes, the bite, the gulp, the eye close-up, the rise, the burst.
  const BITE = 50, GULPED = 94, EYE_END = 122, CINE = 172, STOP_BITE = 6, STOP_BURST = 9;
  // ---- After the burst (frames since it): the flash, the pose, the card flips in, everything is shown, the exit.
  const FLASH = 24, CARD = 42, FLIP = 18, READY = CARD + 54, EXIT = 22, FLIP2 = 16;
  // Each trick has its colour, its GLUP palette and the thing it does, shown big as it rises.
  const FEEL = {
    soplido: { col: '#cfe0ff', deep: '#3a4a8a', pal: 'lila', kind: 'wind' }, aleteo: { col: '#ffe36a', deep: '#8a6a1a', pal: 'oro', kind: 'wing' },
    ventosa: { col: '#9fdc6a', deep: '#2f6a3a', pal: 'musgo', kind: 'cups' }, chorro: { col: '#6fc8f8', deep: '#1d4a7a', pal: 'azul', kind: 'spiral' },
    mordisco: { col: '#dce8f4', deep: '#3a4a60', pal: 'gris', kind: 'hook' }, panzazo: { col: '#f0a050', deep: '#6a3a1a', pal: 'cobre', kind: 'crack' },
    guindilla: { col: '#ff6a3a', deep: '#7a1a10', pal: 'fresa', kind: 'fire' }, resbalon: { col: '#7fe8c8', deep: '#1d6a5a', pal: 'agua', kind: 'slide' },
    sorbo: { col: '#e8fbff', deep: '#2a5a6a', pal: 'agua', kind: 'wind' } };
  const feel = p => FEEL[p] || FEEL.aleteo;
  // ---- On the card: the buttons (b: jump/fish/puff/stick; lab: what the touch bubble says; verb: under it), what to do and what for.
  // {jump} {fish} {puff} {down} {up} become the player's own buttons: Z/X/C, A/X/B or the bubbles' words.
  const J = { b: 'jump', lab: 'salta', verb: 'pulsa' }, SORBE = { b: 'fish', lab: 'sorbe', verb: 'mantén' };
  const HOW = {
    aleteo: { chips: [J, '>', { b: 'jump', lab: 'aletea', verb: 'en el aire' }], text: 'Salta y, ya en el aire, pulsa {jump} otra vez: Bigotes aletea.', use: 'Llegas a salientes altos y cruzas huecos largos.' },
    soplido: { chips: [{ b: 'puff', lab: 'soplo', verb: 'pulsa' }], text: 'Pulsa {puff}: una ráfaga que aparta y aturde a los bichos.', use: 'También hace girar molinillos y mueve las balsas.' },
    ventosa: { chips: [{ b: 'stick', dir: 'left', verb: 'al muro' }, '+', J], text: 'Salta a un muro de raíces: Bigotes se pega. {jump} y al de enfrente.', use: 'Subes por chimeneas de raíces, de muro en muro.' },
    chorro: { chips: [{ b: 'fish', lab: 'sorbe', verb: 'agua' }, '>', { b: 'fish', lab: 'flota', verb: 'mantén', face: 'full', water: true }], text: 'Sorbe agua. En el aire, mantén {fish}: el chorro os sostiene.', use: 'Cruzas huecos flotando, y el agua escupida apaga el fuego.' },
    mordisco: { chips: [J, '>', { b: 'fish', lab: 'pica', verb: 'diana' }, '>', { b: 'fish', lab: 'suelta', verb: 'suelta' }], text: 'Salta y pulsa {fish} cuando la diana marque un anzuelo: ¡a columpiarse!', use: 'Suelta {fish} y salís lanzados; en el aire, {fish} al siguiente.' },
    panzazo: { chips: [{ b: 'stick', dir: 'down', verb: 'en el aire' }, '+', { b: 'jump', lab: 'panzazo', verb: 'pulsa' }], text: 'En el aire, {down} y {jump}: Bigotes cae de panza con todo su peso.', use: 'Rompe el suelo agrietado, aturde bichos y rebota en las setas.' },
    guindilla: { chips: [{ b: 'fish', lab: 'sorbe', verb: 'algo' }, '>', { b: 'fish', lab: '¡zas!', verb: 'mantén', hot: true }], text: 'Con algo en la boca, mantén {fish} hasta que arda, y suelta.', use: 'Atraviesa bichos y rompe la piedra reforzada.' },
    resbalon: { chips: [{ b: 'stick', dir: 'down', verb: 'agáchate' }, '+', { b: 'puff', lab: 'soplo', verb: 'pulsa' }], text: 'Agachada con {down}, pulsa {puff}: Bigotes se hace trineo.', use: 'Pasas huecos bajos a toda velocidad. Corriendo, basta {down}.' },
    sorbo2: { chips: [Object.assign({ pips: 2 }, SORBE)], text: 'Mantén {fish} más rato: el sorbo sube de nivel y llega más lejos.', use: 'Alcanzas cosas que antes estaban demasiado lejos.' },
    sorbo3: { chips: [Object.assign({ pips: 3 }, SORBE)], text: 'Mantén {fish} aún más: tercer nivel, ¡SÚPER! Llega lejísimos.', use: 'Hasta las cajas vienen volando desde lejos.' } };
  const TOK = { puretv: { jump: 'A', fish: 'B', puff: 'X', down: '↓', up: '↑' }, keys: { jump: 'Z', fish: 'X', puff: 'C', down: '↓', up: '↑' }, pad: { jump: 'A', fish: 'X', puff: 'B', down: '↓', up: '↑' }, touch: { jump: 'salta', fish: 'sorbe', puff: 'soplo', down: '↓', up: '↑' } };
  const mode = () => Input.mode === 'puretv' ? 'puretv' : Input.mode === 'touch' || (Touch.enabled && Input.mode !== 'pad') ? 'touch' : Input.mode === 'pad' ? 'pad' : 'keys';
  // The parchment's inks and the wood (as on the pause board).
  const OUT = '#140e18', WD = ['#24160f', '#3e2718', '#5c3c24', '#7e5634', '#a47444', '#c8965a'];
  const INK = '#3a2418', INK2 = '#7a5a3a', INKR = '#a8342a', INKG = '#3e6a2a', INKF = '#b09a74';
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp01 = k => k < 0 ? 0 : k > 1 ? 1 : k, lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp01(k); return 1 - (1 - k) * (1 - k); }, smooth = k => { k = clamp01(k); return k * k * (3 - 2 * k); };
  const back = k => { k = clamp01(k) - 1; return 1 + 2.7 * k * k * k + 1.7 * k * k; };   // ease out with an overshoot
  const RR = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const disc = (g, x, y, r, c) => { if (!(r > 0)) return; g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const oval = (g, x, y, rx, ry, c, stroke) => { if (!(rx > 0) || !(ry > 0)) return; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); if (stroke) { g.strokeStyle = c; g.lineWidth = stroke; g.stroke(); } else { g.fillStyle = c; g.fill(); } };
  // Light: everything drawn inside adds up (a bloom-like glow).
  const light = (g, fn) => { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); };
  function pals() {
    // A clear blue goo for the water trick (the Glup letters have no blue of their own).
    if (typeof Glup === 'undefined' || Glup.PAL.azul) return;
    Glup.PAL.azul = { fill: ['#f0f8ff', '#cce6ff', '#a0ccf8', '#78b0ec', '#5890d8', '#4070b8', '#305494'], rim: '#ffffff', lite: '#e0f0ff', dark: '#223a6a', spot: '#4a78b0', ext: ['#1c3058', '#101c38'], drip: ['#5890d8', '#305494', '#cce6ff'] };
  }

  function start(power, giver) {
    pals();
    Game.learning = { power, giver, t: 0, rt: 0, stop: 0, exit: 0, page: 0, pageT: 0, motes: [], trail: [] };
    // Capture: ?escena=aprende&n=<power>&x=<2|3> shows the stronger inhale too.
    if (Game.capture && Game.capture.scene === 'aprende' && Game.capture.x >= 2) Game.learning.sorbo = Math.min(3, Game.capture.x);
    Sound.play('whoosh');
  }
  // The moment the power bursts out: the fanfare, rings and a shower of its colour around Nila.
  function burst(l) {
    const f = feel(l.power), P = Player;
    Sound.play('powerBurst'); Sound.play('learn'); Cam.shake(5, 18); Cam.punch(1.1); Input.rumble(420, 1, .8);
    spawnParts(40, P.x + 5, P.y + 2, { color: [f.col, '#ffffff', '#fff6d6', f.deep], speed: [1, 4.5], life: [20, 50], g: .02 });
    for (let i = 0; i < 3; i++) L.parts.push({ x: P.x + 5, y: P.y + 2, vx: 0, vy: 0, life: 16 + i * 6, color: i ? f.col : '#ffffff', size: 1, g: 0, kind: 'ring' });
  }
  const SIG_SOUND = { wind: 'gust', wing: 'flap', cups: 'squelch', spiral: 'splash', hook: 'shing', crack: 'crack', fire: 'fire', slide: 'whoosh' };
  function cineUpdate(l) {
    const t = l.t, f = feel(l.power);
    if (t === 16) Sound.play('shing');
    if (t === BITE) { Sound.play('chomp'); Sound.play('glup', 2); Input.rumble(160, .9, .4); l.stop = STOP_BITE; l.biteRt = l.rt; }
    if (t === BITE + 10) Sound.play('gulpBig');
    if (t === GULPED - 22 || t === GULPED - 8) { Sound.play('heartbeat'); Input.rumble(60, .5, .2); }
    if (t === GULPED + 6) { Sound.play('shing'); Input.rumble(80, .5, .2); }
    if (t === EYE_END) Sound.play('powerRise');
    if (t === EYE_END + 8) Sound.play(SIG_SOUND[f.kind] || 'whoosh');
    if (f.kind === 'crack' && t === EYE_END + 12) { Cam.shake(3, 8); Sound.play('thud'); }
    if (l.sorbo >= 2 && t === EYE_END + 30) { Sound.play('suckup', l.sorbo); Input.rumble(90, .4, .4); }
    if (t > EYE_END && t % 14 === 0) Input.rumble(40, .1 + (t - EYE_END) / (CINE - EYE_END) * .6, .3);
    // Energy motes: during the rise they stream in from the edges to the fish.
    if (t > EYE_END - 6 && t < CINE) for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, r = 120 + Math.random() * 60; l.motes.push({ a, r, v: 1.5 + Math.random() * 2.5, c: Math.random() < .3 ? '#ffffff' : f.col }); }
    for (let i = l.motes.length - 1; i >= 0; i--) { const m = l.motes[i]; m.r -= m.v; m.v *= 1.05; m.a += .03; if (m.r < 8) l.motes.splice(i, 1); }
    for (let i = l.trail.length - 1; i >= 0; i--) { const q = l.trail[i]; q.x += q.vx; q.y += q.vy; q.vy += .08; if (--q.life <= 0) l.trail.splice(i, 1); }
    if (t === BITE) for (let i = 0; i < 22; i++) l.trail.push({ x: FX + 58, y: FY - 2, vx: 1 + Math.random() * 3.5, vy: -2.5 + Math.random() * 3.5, life: 20 + Math.random() * 22, c: i % 3 ? f.col : '#ffffff' });
  }
  function update() {
    const l = Game.learning; l.rt++;
    Player.animT++; Player.sx += (1 - Player.sx) * .18; Player.sy += (1 - Player.sy) * .18; if (Player.swallowT > 0) Player.swallowT--;
    updateParts(); for (let i = L.words.length - 1; i >= 0; i--) { const w = L.words[i]; w.t++; if (w.t > w.life) L.words.splice(i, 1); }
    const go = Input.pressed.jump || Input.pressed.fish || Input.pressed.confirm || Game.tapped; Game.tapped = false;
    // A hit-stop holds the picture still (a press during the film still skips it).
    if (l.stop > 0) { if (go && l.t < CINE && l.t > 14) l.stop = 0; else { l.stop--; return; } }
    l.t++;
    if (l.t < CINE) { cineUpdate(l); if (go && l.t > 14) { l.t = CINE - 1; l.stop = 0; } return; }
    if (l.t === CINE) { burst(l); l.stop = STOP_BURST; l.burstRt = l.rt; return; }
    const s = l.t - CINE;
    if (s === 10) Sound.play('win');
    if (s === CARD) Sound.play('whoosh');
    if (s === CARD + (FLIP >> 1)) Sound.play('flap');
    if (s === CARD + FLIP) { Sound.play('stamp'); Input.rumble(60, .4, .2); }
    const u = s - CARD, n = Math.min(10, ((POWERS[l.power] || {}).name || '').replace(/ /g, '').length);
    if (u >= 12 && u < 12 + n * 3 && (u - 12) % 3 === 0) Sound.play('bloop', (u - 12) / 3);
    if (l.page === 1) { l.pageT++; if (l.pageT === FLIP2 >> 1) Sound.play('suckup', l.sorbo); if (l.pageT === FLIP2 + 14) Sound.play('stamp'); }
    if (l.exit) { if (++l.exit > EXIT) { Game.learning = null; Sound.duck(false); Input.release(); } return; }
    // The capture shows the stronger inhale's side of the card on its own.
    if (Game.capture && l.sorbo >= 2 && l.page === 0 && s === READY + 30) { l.page = 1; l.pageT = 0; }
    if (go && s > 20 && s < READY) { l.t = CINE + READY; return; }
    if (go && s >= READY) {
      if (l.sorbo >= 2 && l.page === 0) { l.page = 1; l.pageT = 0; Sound.play('whoosh'); }
      else if (l.page === 1 && l.pageT < FLIP2 + 40) l.pageT = FLIP2 + 40;
      else { l.exit = 1; Sound.play('confirm'); }
    }
  }
  // Player.draw steps aside while the pose is on.
  function posing() { const l = Game.learning; return !!(l && !l.exit); }

  // ================================================================ La escena de cine
  // The scene has its own coordinates (Bigotes' middle at FX, FY) and a camera that frames it.
  const FX = 160, FY = 94, S = 5;
  const REACH = [64, 82, 104], CONE = [.45, .55, .7];   // the inhale's steps, as in the game (SUCK_STAGES)
  const CAM = [[0, 252, 78, 1.06], [24, 226, 86, 1.18], [BITE - 1, 208, 92, 1.44], [BITE + 16, 184, 95, 1.14], [BITE + 32, 160, 96, 1], [GULPED, 160, 96, 1.05],
    [EYE_END, 160, 90, .94], [CINE - 18, 160, 88, 1.08], [CINE, 160, 86, 1.32]];
  const BEATS = [GULPED - 22, GULPED - 8];
  const beat = t => { let p = 0; for (const b of BEATS) if (t >= b) p = Math.max(p, Math.exp(-(t - b) / 4)); return p; };
  function camAt(t) {
    let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
    const a = CAM[i], b = CAM[i + 1], k = smooth((t - a[0]) / (b[0] - a[0]));
    const bite = t >= BITE ? Math.max(0, 1 - (t - BITE) / 12) : 0;
    return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: lerp(a[3], b[3], k) + bite * bite * .24 + beat(t) * .05 };
  }
  // Where the morsel is: it comes in fast and slows right down at the mouth (a speed ramp), on a little arc.
  function morselAt(t) {
    const e = clamp01(t / BITE), k = 1 - Math.pow(1 - e, 3), x0 = 350, y0 = 34, x1 = FX + 58, y1 = FY - 1;
    return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) - Math.sin(k * Math.PI) * 22, s: 3.4 - k * 1.1, k };
  }
  // Bigotes, big: drawn column by column so a gulp can travel down him as a bulge (lump: 0 = tail, 1 = mouth).
  function bigFish(g, spr, x, y, lump, lumpAmt, mood, t, tint) {
    const w = spr.width, h = spr.height;
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1), d = (u - lump) * 5, bump = 1 + lumpAmt * Math.exp(-d * d), sh = h * S * bump;
      g.drawImage(spr, i, 0, 1, h, x + i * S, y - sh / 2, S, sh);
    }
    g.save(); g.translate(x, y - h * S / 2); g.scale(S, S); Player.fishOverlay(g, spr, 0, 0, t, { mood, lx: 1, noWhiskers: true }); g.restore();
    // His barbels, drawn big: two soft curves hanging from the corner of the mouth, swaying.
    const mx = x + (w - 2) * S, my = y + S * 1.5;
    for (const [len, ph, off] of [[34, 0, 0], [26, 1.9, 5]]) for (let i = 0; i < len; i++) {
      const u = i / len, bx = mx + 3 - off * .4 + i * .4 + Math.sin(u * 3.5 + t / 7 + ph) * 5 * u, by = my + 2 + off * .3 + i * .85;
      RR(g, bx, by + 1, 2, 2, '#1b1420'); RR(g, bx, by, 2, 2, u < .2 ? '#e8c890' : '#c9a060');
    }
    if (tint && tint.a > 0) { g.globalAlpha = tint.a; g.drawImage(ART.tint(spr, tint.c), x, y - h * S / 2, w * S, h * S); g.globalAlpha = 1; }
  }
  // The backdrop: night closing in over the world, soft out-of-focus lights drifting, the glow of the trick behind him.
  function backdrop(g, l, f, c, rise, inK) {
    const t = l.t, rt = l.rt;
    g.globalAlpha = inK; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05040b'); gr.addColorStop(.7, '#0b0a17'); gr.addColorStop(1, '#141024'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sx = W / 2 + (FX - c.x) * c.z, sy = H / 2 + (FY - c.y) * c.z, glow = (.14 + rise * .6 + beat(t) * .35 + (t >= BITE && t < BITE + 6 ? .3 : 0)) * inK;
    const rg = g.createRadialGradient(sx, sy, 4, sx, sy, 150 + rise * 40); rg.addColorStop(0, f.col); rg.addColorStop(.3, f.deep); rg.addColorStop(1, 'rgba(7,6,13,0)');
    g.globalAlpha = Math.min(1, glow); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    // Bokeh: blurry discs of light, drifting up; more of them, and brighter, as the power rises.
    light(g, () => {
      const n = 12 + Math.round(rise * 12);
      for (let i = 0; i < n; i++) {
        const r = 3 + hash(i) * 8, x = ((hash(i + 40) * (W + 60) - (c.x - FX) * .5 * c.z + rt * (hash(i + 7) - .5) * .3) % (W + 60) + W + 60) % (W + 60) - 30, y = ((hash(i + 80) * (H + 40) - rt * (.15 + hash(i + 9) * .3)) % (H + 40) + H + 40) % (H + 40) - 20;
        g.globalAlpha = inK * (.05 + hash(i + 3) * .08 + rise * .08) * (.7 + .3 * Math.sin(rt / 20 + i));
        disc(g, x, y, r, i % 3 ? f.col : '#ffffff'); disc(g, x, y, r * .6, i % 3 ? f.col : '#ffffff');
      }
    });
    g.globalAlpha = 1;
  }
  let cineCv = null;
  function cineDraw(g0, l) {
    const t = l.t, f = feel(l.power);
    if (t >= GULPED && t < EYE_END) { eyeCut(g0, l, t - GULPED, f); bars(g0, 20); skipHint(g0, l); return; }
    // The first frames fade in over the world: painted apart, then laid over it.
    const inK = smooth(t / 12), fading = inK < 1, g = fading ? (cineCv || (cineCv = canvas(W, H))).getContext('2d') : g0;
    if (fading) { g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false; }
    const rise = t > EYE_END ? clamp01((t - EYE_END) / (CINE - EYE_END)) : 0, c = camAt(t);
    const shake = t > EYE_END ? rise * rise * 3 : l.stop > 0 && t === BITE ? 2.5 : t >= BITE && t < BITE + 8 ? (BITE + 8 - t) * .7 : 0;
    const jx = (Math.random() - .5) * shake * 2, jy = (Math.random() - .5) * shake * 2;
    backdrop(g, l, f, c, rise, 1);
    g.save(); g.translate(W / 2 + jx, H / 2 + jy); g.scale(c.z, c.z); g.translate(-c.x, -c.y);
    scene(g, l, f, rise);
    g.restore();
    if (l.sorbo >= 2 && t > EYE_END + 8) inhalePips(g, l, rise, l.rt);
    // The morsel's name while it comes, in GLUP letters, and who gives it.
    if (t < BITE) {
      const food = foodOf(l), fade = clamp01((BITE - t) / 5), name = food.replace(/^(un|una|el|la) /i, '').toUpperCase();
            ART.glup(g, name, W / 2, 134, { size: 'small', pal: f.pal, align: 'center', shadow: true, each: i => {
        const a = t - 10 - i * 1.4; if (a < 0) return false;
        const k = clamp01(a / 7), sq = a < 10 ? Math.sin(clamp01(a / 10) * Math.PI) * .25 : 0;
        return { y: Math.round((1 - k) * -10 + Math.sin(l.rt / 9 + i * .8) * 1), sx: 1 + sq, sy: 1 - sq, alpha: fade, drips: Math.max(0, Math.round(1 + Math.sin(l.rt / 12 + i * 2) * 2)) };
      } });
    }
    // Nila's reaction, in a comic panel that slides in after the bite.
    if (t > BITE + 10 && t < GULPED) inset(g, t - BITE - 10, GULPED - BITE - 10, f);
    // ¡ÑAM! (screen space so it stays crisp), popping letter by letter while the picture is frozen.
    if (t >= BITE && t < BITE + 34) {
      const a = l.rt - (l.biteRt || l.rt), out = clamp01((BITE + 34 - t) / 8), mx = Math.min(W - 44, W / 2 + (FX + 64 - c.x) * c.z), my = Math.max(46, H / 2 + (FY - 40 - c.y) * c.z);
      ART.glup(g, '¡ÑAM!', Math.round(mx), Math.round(my), { size: 'mid', pal: f.pal, align: 'center', shadow: true, each: i => {
        const q = a - i * 1.2; if (q < 0) return false; const pop = q < 6 ? (6 - q) / 6 : 0;
        return { y: Math.round(-pop * 8 + Math.sin(l.rt / 5 + i) * 1), sx: 1 + pop * .6, sy: 1 + pop * .4, rot: (i - 2) * .06, alpha: out, drips: Math.min(6, Math.round(q / 3)) };
      } });
    }
    // The bite's flash (strongest while the picture is held), the heartbeat's throb, the whiteout into the burst.
    if (t === BITE && l.stop > 0) { g.globalAlpha = .25 + l.stop / STOP_BITE * .45; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    else if (t > BITE && t < BITE + 6) { g.globalAlpha = (BITE + 6 - t) / 6 * .35; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    const hb = beat(t); if (hb > .05) { g.globalAlpha = hb * .22; g.fillStyle = f.deep; g.fillRect(0, 0, W, 26); g.fillRect(0, H - 26, W, 26); g.globalAlpha = 1; }
    if (rise > .78) { g.globalAlpha = Math.pow((rise - .78) / .22, 1.6) * .92; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (fading) { g0.globalAlpha = inK; g0.drawImage(cineCv, 0, 0); g0.globalAlpha = 1; }
    bars(g0, Math.round(20 * inK));
    skipHint(g0, l);
    // Who gives it, small in the bottom bar while it comes.
    const who = teacherOf(l); if (who && t < BITE) { g0.globalAlpha = clamp01((t - 6) / 8) * clamp01((BITE - t) / 5); ART.text(g0, 'un regalo de ' + who.name, 6, H - 14, '#cfc0a0', 'left'); g0.globalAlpha = 1; }
  }
  const foodOf = l => l.food || (POWERS[l.power] || {}).food || '';
  // Everything on the scene's own coordinates.
  function scene(g, l, f, rise) {
    const t = l.t, spr0 = ART.fish.closed, fw = spr0.width * S, fh = spr0.height * S, rt = l.rt;
    // A still pool under him: a faint mirror line with ripples.
    const floorY = FY + 46; g.fillStyle = f.deep; g.globalAlpha *= .5; g.fillRect(FX - 160, floorY, 320, 1); g.globalAlpha *= 2;
    for (let i = 0; i < 7; i++) { const w = 20 + hash(i) * 60, x = FX - 150 + hash(i + 5) * 300 + Math.sin(rt / 30 + i) * 6, y = floorY + 3 + i * 3; g.globalAlpha *= .25; RR(g, x, y, w, 1, i % 2 ? f.col : '#2a2a44'); g.globalAlpha *= 4; }
    // The camera's light from above (god rays), stronger as the power rises.
    if (rise > 0 || t < BITE) light(g, () => {
      const a0 = t < BITE ? .06 : .05 + rise * .14;
      for (let i = 0; i < 5; i++) { const x = FX - 90 + i * 45 + Math.sin(rt / 40 + i) * 10, w = 10 + hash(i) * 14; g.globalAlpha = a0 * (.6 + .4 * Math.sin(rt / 17 + i * 2)); g.fillStyle = i % 2 ? f.col : '#fff6d6'; g.beginPath(); g.moveTo(x, -60); g.lineTo(x + w, -60); g.lineTo(x + w * 2.4 + 30, floorY); g.lineTo(x + 30, floorY); g.fill(); }
    });
    g.globalAlpha = 1;
    // The rise: rays behind him, turning faster and longer; a magic circle on the floor closing as the power fills him.
    let dy = 0, sxK = 1, syK = 1, wob = 0;
    if (t > EYE_END) {
      light(g, () => { g.translate(FX, FY); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28 + rt * (.01 + rise * .05), len = 60 + rise * 150; g.globalAlpha = (.05 + rise * .16) * (i % 2 ? 1 : .5); g.fillStyle = i % 3 ? f.col : '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - .06) * len, Math.sin(a - .06) * len); g.lineTo(Math.cos(a + .06) * len, Math.sin(a + .06) * len); g.fill(); } });
      circle(g, rise, rt, f, floorY);
      if (f.kind === 'wind') syK = 1 + Math.max(0, Math.sin(t / 5)) * .12 * rise;                  // cheeks puffing
      if (f.kind === 'wing') dy = Math.sin(t / 4) * 3 * rise;                                     // flapping up and down
      if (f.kind === 'crack') dy = t < EYE_END + 12 ? (t - EYE_END) * 1.2 : 14 - smooth((t - EYE_END - 12) / 30) * 22;   // heavy: a drop and a thud, then up
      if (f.kind === 'slide') wob = Math.sin(t / 7) * 10 * rise;                                   // sliding from side to side
      if (f.kind === 'cups') sxK = 1 + Math.sin(t / 6) * .05 * rise;
      if (f.kind !== 'crack') dy -= smooth(rise) * 10;
    }
    const cx = FX + wob, cy = FY + dy;
    if (t > EYE_END) signature(g, f, rise, rt, cx, cy, floorY, false);
    // Energy motes streaming in (pulled into his mouth instead when the inhale is growing).
    for (const m of l.motes) { g.globalAlpha *= Math.min(1, m.r / 40); RR(g, cx + Math.cos(m.a) * m.r, cy + Math.sin(m.a) * m.r * .7, 2, 2, m.c); g.globalAlpha = 1; }
    // Bigotes. The mouth opens as the morsel comes, snaps shut on it, the lump rides down him.
    const lunge = t > BITE - 5 && t < BITE + 3 ? Math.sin(clamp01((t - BITE + 5) / 8) * Math.PI) * 6 : 0;
    const fx = Math.round(cx - fw / 2 + lunge), open = t > 20 && t < BITE, gulpK = clamp01((t - BITE - 4) / (GULPED - BITE - 14));
    let spr = open ? ART.fish.open : t < BITE + 6 ? ART.fish.swallow : t < GULPED ? ART.fish.full : rise > .85 ? ART.fish.squint : ART.fish.closed;
    if (t > 0 && t <= 18 && (t % 90) < 5) spr = ART.fish.blink;
    let lump = 0, lumpAmt = 0; if (t >= BITE && t < GULPED + 4) { lump = 1 - smooth(gulpK) * .7; lumpAmt = .35 * (1 - clamp01((t - GULPED + 8) / 12)); }
    const mood = t < BITE ? null : t < GULPED ? 'shock' : rise > .6 ? 'mad' : 'shock', hb = beat(t);
    // His aura, the rim of coloured light round his edge (lit from the top left), then him.
    if (t > EYE_END) {
      light(g, () => { for (const [sc, a] of [[1.1, .35], [1.22, .18]]) { const s2 = sc + Math.sin(rt / 4) * .03 + rise * .08; g.globalAlpha = a * (.4 + rise * .8); g.drawImage(ART.tint(spr, f.col), Math.round(cx - fw * s2 / 2), Math.round(cy - fh * s2 / 2), Math.round(fw * s2), Math.round(fh * s2)); } });
      g.globalAlpha = .5 + rise * .5; for (const [ox, oy] of [[-2, -2], [0, -3], [-3, 0]]) g.drawImage(ART.tint(spr, rise > .5 ? '#ffffff' : f.col), fx + ox, Math.round(cy - fh / 2) + oy, fw, fh); g.globalAlpha = 1;
    }
    g.save(); g.translate(cx, cy); g.scale(sxK * (1 + hb * .05), syK * (1 + hb * .05)); g.translate(-cx, -cy);
    bigFish(g, spr, fx, Math.round(cy), lump, lumpAmt, mood, rt, { c: t > EYE_END ? (f.kind === 'fire' ? '#ff3a1a' : f.col) : '#ffffff', a: t > EYE_END ? rise * rise * .7 : 0 });
    g.restore();
    // The glowing lump itself, seen through him, and his belly lit on each heartbeat.
    if (lumpAmt > .02 || hb > .05) light(g, () => {
      const lx = fx + (lumpAmt > .02 ? lump : .35) * fw, a = lumpAmt > .02 ? .35 + Math.sin(rt / 3) * .1 : 0;
      g.globalAlpha = Math.min(1, a + hb * .5); disc(g, lx, cy + 2, 10 + hb * 6, f.col); g.globalAlpha = Math.min(1, a * .6 + hb * .3); disc(g, lx, cy + 2, 18 + hb * 8, f.deep);
    });
    g.globalAlpha = 1;
    if (t > EYE_END) signature(g, f, rise, rt, cx, cy, floorY, true);
    if (l.sorbo >= 2 && t > EYE_END + 8) inhale(g, l, rise, rt, fx + fw, cy);
    // The morsel: it drifts in from the right, turning, glowing, with a comet's tail, straight into the open mouth.
    if (t < BITE) {
      const m = morselAt(t), ic = ART.morsels[l.power];
      light(g, () => { for (let i = 6; i >= 1; i--) { const q = morselAt(Math.max(0, t - i * 1.6)); g.globalAlpha = .1 * (7 - i) / 6; disc(g, q.x, q.y, 3 + (6 - i) * .8, f.col); } g.globalAlpha = .35 + Math.sin(rt / 3) * .08; disc(g, m.x, m.y, 12 * m.s / 3, f.col); g.globalAlpha = .5; disc(g, m.x, m.y, 5 * m.s / 3, '#ffffff'); });
      g.globalAlpha = 1;
      if (ic) { g.save(); g.translate(Math.round(m.x), Math.round(m.y)); g.rotate(rt * .08 * (1 - m.k * .7)); g.scale(m.s, m.s); g.drawImage(ic, -4, -4); g.restore(); }
      if ((rt >> 2) % 4 === 0) { RR(g, m.x + 8, m.y - 10, 1, 5, '#ffffff'); RR(g, m.x + 6, m.y - 8, 5, 1, '#ffffff'); }
    }
    // Crumbs of the bite.
    for (const q of l.trail) { g.globalAlpha = Math.min(1, q.life / 10); RR(g, q.x, q.y, 2, 2, q.c); } g.globalAlpha = 1;
    // Speed lines on the bite.
    if (t >= BITE && t < BITE + 10) { g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.28 + i, r0 = 50 + (i * 37) % 40, r1 = r0 + 30 + (i * 13) % 50; g.globalAlpha = (BITE + 10 - t) / 10 * .8; for (let r = r0; r < r1; r += 2) g.fillRect(Math.round(FX + 58 + Math.cos(a) * r), Math.round(FY + Math.sin(a) * r * .6), 1, 1); } g.globalAlpha = 1; }
    // Bloom over him as the power peaks.
    if (rise > .3) light(g, () => { const gr = g.createRadialGradient(cx, cy, 2, cx, cy, 70 + rise * 40); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, f.col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = (rise - .3) * .55; g.fillStyle = gr; g.fillRect(cx - 120, cy - 120, 240, 240); });
    g.globalAlpha = 1;
  }
  // The magic circle: rings of runes drawing themselves round, columns of light rising off it.
  function circle(g, rise, rt, f, fy) {
    const R = 62, k = smooth(rise * 1.2), rot = rt * .012;
    g.save(); g.translate(FX, fy);
    light(g, () => { g.globalAlpha = .12 + k * .25; oval(g, 0, 0, R * k + 4, (R * k + 4) * .28, f.col); g.globalAlpha = .1 + k * .12; oval(g, 0, 0, R * k * .6 + 2, (R * k * .6 + 2) * .28, '#ffffff'); });
    for (let i = 0; i < 110; i++) { const a = rot + i / 110 * 6.28; if (i / 110 > k) break; g.globalAlpha = .9; RR(g, Math.cos(a) * R, Math.sin(a) * R * .28, 2, 1, i % 3 ? f.col : '#ffffff'); }
    for (let i = 0; i < 70; i++) { const a = -rot * 2 + i / 70 * 6.28; if (i / 70 > k) break; g.globalAlpha = .6; RR(g, Math.cos(a) * R * .72, Math.sin(a) * R * .72 * .28, 1, 1, f.col); }
    // Runes on the ring between the two circles: little marks that light up in turn.
    for (let i = 0; i < 12; i++) { const a = rot * 1.5 + i / 12 * 6.28; if (i / 12 > k) break; const x = Math.cos(a) * R * .86, y = Math.sin(a) * R * .86 * .28, on = ((rt >> 3) + i) % 6 === 0; g.globalAlpha = on ? 1 : .6; RR(g, x - 1, y - 1, 3, 1, on ? '#ffffff' : f.col); RR(g, x, y - 2, 1, 3, on ? '#ffffff' : f.col); }
    light(g, () => { for (let i = 0; i < 10; i++) { const a = rot * 3 + i / 10 * 6.28, x = Math.cos(a) * R * .9, y = Math.sin(a) * R * .27, hgt = 20 + k * 70 * (.6 + .4 * Math.sin(rt / 5 + i)); if (Math.sin(a) < 0) continue; g.globalAlpha = .16 * k; RR(g, x - 1, y - hgt, 3, Math.round(hgt), f.col); } });
    g.restore(); g.globalAlpha = 1;
  }
  // What the trick does, shown big around him while the power rises (front: drawn over him).
  function signature(g, f, k, rt, cx, cy, fy, front) {
    const K = smooth(k * 1.3);
    if (K <= 0) return;
    const C = f.col;
    switch (f.kind) {
      case 'wind': {
        // A whirlwind round him: rings of dashed air spinning (the back halves behind him, the front halves over him),
        // and gusts with curled tips racing past.
        for (let r = 0; r < 5; r++) {
          const rx = (64 + r * 18) * (.7 + K * .3), ry = 12 + r * 5, y0 = cy - 30 + r * 14, sp = (.05 + r * .012) * (r % 2 ? 1 : -1);
          for (let a = 0; a < 6.283; a += .03) { const z = Math.sin(a); if ((z > 0) !== front) continue; if (((a * 7 + rt * sp * 7) % 2.4) > 1.5) continue; const x = cx + Math.cos(a + rt * sp) * rx, y = y0 + Math.sin(a + rt * sp) * ry; g.globalAlpha = K * (front ? .95 : .55); RR(g, x, y, 2, 2, (r + Math.round(a * 3)) % 4 ? C : '#ffffff'); }
        }
        if (front) for (let i = 0; i < 5; i++) { const q = ((rt * .022 + hash(i + 5)) % 1), x = cx - 170 + q * 340, y = cy - 50 + i * 24 + Math.sin(rt / 9 + i) * 3, len = 22 + (i % 3) * 10; g.globalAlpha = K * Math.sin(q * Math.PI); RR(g, x, y + 1, len, 1, f.deep); RR(g, x, y, len, 1, '#ffffff'); RR(g, x + len, y - 1, 2, 1, '#ffffff'); RR(g, x + len + 2, y, 1, 2, '#ffffff'); RR(g, x + len + 1, y + 2, 1, 1, '#ffffff'); RR(g, x + len - 1, y + 1, 1, 1, '#ffffff'); }
        break; }
      case 'wing': {
        // Wings of light unfolding from his back: a curved leading edge, feathers fanning under it, flapping.
        if (front) { for (let i = 0; i < 8; i++) { const q = (rt * .012 + hash(i)) % 1, x = cx - 70 + hash(i + 2) * 140 + Math.sin(rt / 6 + i) * 4, y = cy - 50 + q * 110; g.globalAlpha = K * (1 - q); RR(g, x, y, 4, 1, C); RR(g, x + 1, y - 1, 2, 1, '#ffffff'); } break; }
        const flap = Math.sin(rt / 5) * .22 * K;
        for (const side of [-1, 1]) {
          g.save(); g.translate(cx - 4 + side * 6, cy - 18); g.rotate(side * flap); g.scale(side, 1);
          light(g, () => { g.globalAlpha = .22 * K; disc(g, 36 * K, -24 * K, 30 * K, C); });
          for (const pass of [0, 1, 2]) for (let i = 0; i < 9; i++) {
            const u = i / 8, ex = 72 * K * u, ey = -46 * K * Math.sin(u * 2.2) + 6 * u, a = .9 + u * .9, len = (12 + 14 * Math.sin(u * 2.6)) * K, fx = ex + Math.cos(a) * len * .5, fy = ey + Math.sin(a) * len * .5;
            if (len < 1) continue; g.globalAlpha = K; g.beginPath(); g.ellipse(fx, fy, Math.max(.5, len * .5 + (pass ? 0 : 1.2)), Math.max(.5, (pass === 2 ? 1.2 : 3) + (pass ? 0 : 1)), a, 0, 7); g.fillStyle = pass === 0 ? f.deep : pass === 1 ? (i % 2 ? C : '#fff3b8') : '#ffffff'; if (pass < 2 || i % 3 === 0) g.fill();
          }
          for (let q = 0; q < 1; q += .02) { const ex = 72 * K * q, ey = -46 * K * Math.sin(q * 2.2) + 6 * q; RR(g, ex, ey - 1, 2, 2, '#ffffff'); }
          g.restore();
        }
        break; }
      case 'cups': {
        // Suction cups popping up along his belly, each with a ripple.
        if (!front) { for (let i = 0; i < 4; i++) { const q = ((rt * .018 + i / 4) % 1); g.globalAlpha = K * (1 - q) * .7; oval(g, cx, fy, 10 + q * 90, 2 + q * 20, C, 1); } break; }
        for (let i = 0; i < 7; i++) {
          const on = clamp01(K * 8 - i), x = cx - 42 + i * 14, y = cy + 26, r = 4 * back(on), pulse = Math.sin(rt / 4 + i) * .5;
          if (on <= 0) continue; oval(g, x, y, r + 1 + pulse, (r + 1) * .6, OUT); oval(g, x, y, r + pulse, r * .6, i % 2 ? '#d98a8a' : C); oval(g, x, y - 1, r * .45, r * .25, '#ffffff');
          const q = ((rt * .05 + i * .3) % 1); g.globalAlpha = on * (1 - q) * .8; oval(g, x, y, r + q * 10, (r + q * 10) * .5, C, 1); g.globalAlpha = 1;
        }
        break; }
      case 'spiral': {
        // A helix of water drops winding up round him (the drops behind him first, the ones in front after).
        for (let s2 = 0; s2 < 2; s2++) for (let i = 0; i < 34; i++) {
          const ph = i * .34 + rt * .16 + s2 * Math.PI, z = Math.sin(ph); if ((z > 0) !== front) continue;
          const y = cy + 58 - i * 4 * K, x = cx + Math.cos(ph) * (50 + i * .6), r = 1.5 + (z + 1) * 1.2;
          g.globalAlpha = K * (.5 + z * .3 + .2) * (i < 30 ? 1 : (34 - i) / 4); disc(g, x, y, r + .8, '#1d4a7a'); disc(g, x, y, r, C); RR(g, x - 1, y - 1, 1, 1, '#ffffff');
        }
        g.globalAlpha = 1; break; }
      case 'hook': {
        // A great hook of light swinging on its line in front of his mouth, a glint running down it.
        if (front) break;
        const sw = Math.sin(rt / 16) * .28, px = cx + 84, py = cy - 160, R = 124 + K * 26, hx = px + Math.sin(sw) * R, hy = py + Math.cos(sw) * R;
        light(g, () => { g.globalAlpha = K * .22; disc(g, hx + 8, hy + 6, 24, C); });
        g.globalAlpha = K; for (let q = 0; q < R - 34; q += 1) { RR(g, px + Math.sin(sw) * q, py + Math.cos(sw) * q, 2, 1, q > R - 60 ? '#ffffff' : '#c8d4e0'); }
        g.save(); g.translate(hx, hy - 10); g.rotate(-sw); Item.hookShape(g, 0, 0, false, rt, 1, 5); g.restore();
        const gq = (rt % 50) / 50; if (gq < .5) { const r = Math.sin(gq * 2 * Math.PI) * 9, gx = hx + 10 + gq * 30, gyy = hy + 20 - gq * 14; light(g, () => { g.globalAlpha = K; RR(g, gx - r, gyy, r * 2 + 1, 1, '#ffffff'); RR(g, gx, gyy - r, 1, r * 2 + 1, '#ffffff'); }); }
        g.globalAlpha = 1; break; }
      case 'crack': {
        // The floor cracks under him, glowing seams running out, stones lifting off it.
        if (!front) {
          for (let i = 0; i < 9; i++) {
            let x = cx, y = fy, a = i / 9 * Math.PI * 2 + hash(i); const len = 26 + hash(i + 4) * 40;
            for (let q = 0; q < len * K; q++) { a += (hash(i * 31 + q) - .5) * .5; x += Math.cos(a) * 1.6; y += Math.sin(a) * .45; RR(g, x - 1, y + 1, 3, 1, OUT); RR(g, x, y, 2, 1, q < 8 ? '#fff6d6' : C); if (q % 9 === 4) light(g, () => { g.globalAlpha = .35 * (1 - q / len); disc(g, x, y, 4, C); }); }
          }
          break;
        }
        for (let i = 0; i < 10; i++) { const x = cx - 80 + hash(i) * 160, up = K * (20 + hash(i + 2) * 50) + Math.sin(rt / 9 + i) * 2, s2 = 2 + Math.round(hash(i + 5) * 3); g.globalAlpha = K; RR(g, x - 1, fy - up - 1, s2 + 2, s2 + 2, OUT); RR(g, x, fy - up, s2, s2, i % 2 ? '#8a8f94' : '#b0a090'); RR(g, x, fy - up, 1, 1, '#e0d8c8'); }
        g.globalAlpha = 1; break; }
      case 'fire': {
        // Flames licking up round him (tall behind, low in front), embers rising.
        if (!front) { for (let i = 0; i < 16; i++) { const x = cx - 104 + i * 13 + hash(i) * 8, mid = 1.45 - Math.abs(x - cx) / 120, h = K * (22 + hash(i) * 40) * mid * (.75 + .25 * Math.sin(rt / 2.5 + i * 1.7)); flame(g, x, fy - 2 - hash(i + 9) * 5, 5 + hash(i + 1) * 6, h, Math.sin(rt / 4 + i) * 4); } break; }
        for (let i = 0; i < 11; i++) { const x = cx - 92 + i * 18 + hash(i + 20) * 6, h = K * (8 + hash(i + 4) * 14) * (.7 + .3 * Math.sin(rt / 2 + i * 2.3)); flame(g, x, fy + 6, 4 + hash(i + 6) * 3, h, Math.sin(rt / 3 + i) * 3); }
        for (let i = 0; i < 16; i++) { const q = (rt * .02 + hash(i)) % 1, x = cx - 70 + hash(i + 3) * 140 + Math.sin(rt / 7 + i) * 4, y = fy - q * 140; g.globalAlpha = K * (1 - q); RR(g, x, y, 2, 2, q < .3 ? '#fff6d6' : q < .6 ? '#ff9a3a' : '#c84a2a'); }
        g.globalAlpha = 1; break; }
      case 'slide': {
        // A glossy trail streaking under him, sheen lines racing along it, sparkles.
        if (!front) {
          g.globalAlpha = K * .8; oval(g, cx, fy - 2, 150 * K, 7, '#1d6a5a'); oval(g, cx, fy - 3, 146 * K, 5, C); g.globalAlpha = K;
          for (let i = 0; i < 8; i++) { const x = cx - 140 + ((rt * 4 + i * 40) % 280); RR(g, x, fy - 5, 12, 1, '#ffffff'); }
          break;
        }
        for (let i = 0; i < 12; i++) { const x = cx - 100 + ((rt * 3 + i * 23) % 200), y = cy - 30 + (i * 11) % 60; g.globalAlpha = K * .7; RR(g, x, y, 10 + (i % 3) * 6, 1, i % 2 ? '#ffffff' : C); }
        g.globalAlpha = 1; break; }
    }
    g.globalAlpha = 1;
  }
  // A tongue of pixel fire: white core, yellow, orange, a red edge.
  function flame(g, x, by, w, h, sway = 0) {
    if (h < 2) return;
    // A teardrop: round at the base, widest a quarter up, a swaying tip; a dark rim, orange, and a yellow-white core.
    for (let y = 0; y < h; y++) {
      const k = y / h, hw = w * (k < .25 ? .75 + k : (1 - k) / .75 * 1), xs = x + Math.sin(k * 3.2) * sway * k * k, cw = hw * .55;
      RR(g, xs - hw - 1, by - y, Math.max(1, hw * 2) + 2, 1, '#7a1a10'); RR(g, xs - hw, by - y, Math.max(1, hw * 2), 1, k > .6 ? '#c83a1a' : '#ff7a2a');
      if (k < .7 && cw >= .5) RR(g, xs - cw, by - y, Math.max(1, cw * 2), 1, k < .3 ? '#fff6d6' : '#ffd04a');
    }
  }
  // The inhale growing stronger: a cone of air pulled into his mouth, and the pips that count its steps.
  function inhale(g, l, k, rt, mx, my) {
    const lv = l.sorbo, K = smooth((k - .05) * 2), up = clamp01((k - .45) * 5), cur = up >= 1 ? lv : lv - 1, st = [.45, .55, .7], reach = (60 + cur * 26) * K, half = st[cur - 1] || .45;
    // The cone: two dotted edges and streaks rushing in.
    g.globalAlpha = .5 * K; for (let q = 6; q < reach; q += 3) for (const s2 of [-1, 1]) RR(g, mx + q, my + s2 * q * half, 1, 1, '#e8fbff');
    for (let i = 0; i < 10 + cur * 4; i++) { const u = 1 - ((rt * (.03 + cur * .012) + hash(i)) % 1), a = (hash(i + 3) - .5) * 2 * half, q = 6 + u * reach; g.globalAlpha = K * (1 - u) * .9; RR(g, mx + q, my + a * q, 3 + cur, 1, cur === 3 ? '#fff6d6' : '#cfe8f0'); }
    g.globalAlpha = 1;
  }
  // The steps: three pips under the top bar, the new one lighting with a pop (and its name).
  function inhalePips(g, l, k, rt) {
    const lv = l.sorbo, K = smooth((k - .05) * 2), up = clamp01((k - .45) * 5), cur = up >= 1 ? lv : lv - 1, px = W / 2 - 16, py = 30;
    for (let i = 0; i < 3; i++) {
      const on = i < cur, isNew = i === lv - 1, r = isNew && up > 0 ? 4 * back(up) : 4;
      g.globalAlpha = K; oval(g, px + i * 16, py, r + 1.5, r + 1.5, OUT); oval(g, px + i * 16, py, r, r, on ? (lv === 3 && i === 2 ? '#ffe36a' : '#8fe0f0') : '#3a3a4a'); if (on) RR(g, px + i * 16 - 2, py - 2, 2, 2, '#ffffff');
    }
    if (up > 0) { g.globalAlpha = up; ART.glup(g, lv === 3 ? '¡SÚPER!' : 'NIVEL 2', W / 2, py + 9, { size: 'small', pal: lv === 3 ? 'oro' : 'agua', align: 'center', shadow: true, each: i => ({ y: Math.round(Math.sin(rt / 6 + i) * 1.5 - (1 - back(up)) * 6) }) }); }
    g.globalAlpha = 1;
  }
  function bars(g, bar) { RR(g, 0, 0, W, bar, '#000000'); RR(g, 0, H - bar, W, bar, '#000000'); }
  // How to skip, small in the bottom bar.
  function skipHint(g, l) {
    if (l.t < 24 || l.t > CINE - 8) return; const m = mode();
    g.globalAlpha = .6; if (m === 'touch') ART.text(g, 'toca para saltar', W - 6, H - 14, '#8a86a8', 'right'); else { const w = ART.text(g, 'saltar', W - 6, H - 14, '#8a86a8', 'right'); cap(g, (m === 'pad' || m === 'puretv') ? 'A' : 'Z', W - 10 - w - 10, H - 15, 9, 10, (m === 'pad' || m === 'puretv')); }
    g.globalAlpha = 1;
  }
  // The extreme close-up: Bigotes' eye, huge. The pupil snaps small with a glint, the iris floods with the
  // trick's colour, the morsel's light reflected in it; the camera keeps pushing in.
  function eyeCut(g, l, k, f) {
    const cx = W / 2, cy = H / 2, n = EYE_END - GULPED, open = smooth(k / 5), snap = k > 6, r = 44, z = 1 + k / n * .14;
    g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
    RR(g, -40, -40, W + 80, H + 80, '#2f4a1e');                                                        // his skin, very close
    g.fillStyle = '#3f6a28'; for (let i = 0; i < 40; i++) g.fillRect((i * 53) % W, (i * 29) % H, 6, 3);
    g.fillStyle = '#26401a'; for (let i = 0; i < 30; i++) g.fillRect((i * 71 + 13) % W, (i * 41 + 7) % H, 4, 2);
    // The socket and the white of the eye, opening.
    oval(g, cx, cy, r + 6, (r + 6) * open, '#1b1420'); oval(g, cx, cy, r, r * open, '#f2ecdc');
    if (open > 0) { g.save(); g.beginPath(); g.ellipse(cx, cy, r, Math.max(.1, r * open), 0, 0, 7); g.clip();
      // Iris: dark at first, flooding with the colour from the rim inward.
      const fill = smooth((k - 6) / 12), ir = 30, pr = snap ? 7 + Math.max(0, 12 - (k - 6) * 3) : 19;
      disc(g, cx, cy, ir, '#3a2a1a');
      if (fill > 0) { const TAU = Math.PI * 2, rin = Math.min(ir, ir * (1 - fill) + pr); g.fillStyle = f.col; g.beginPath(); g.arc(cx, cy, ir, 0, TAU); g.moveTo(cx + rin, cy); g.arc(cx, cy, rin, TAU, 0, true); g.fill('evenodd'); }
      g.fillStyle = f.deep; g.globalAlpha = .55;
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2 + k * .02; for (let q = pr + 2; q < ir - 2; q += 1.5) g.fillRect(Math.round(cx + Math.cos(a) * q), Math.round(cy + Math.sin(a) * q), 1, 1); }
      g.globalAlpha = 1; disc(g, cx, cy, pr, '#0a0610');
      // Highlights, the morsel reflected small, and the power as a star.
      disc(g, cx - 11, cy - 12, 6, '#ffffff'); RR(g, cx + 9, cy + 8, 3, 3, '#ffffff');
      const ic = ART.morsels[l.power]; if (ic && k > 8) { g.globalAlpha = .55; g.drawImage(ART.tint(ic, '#ffffff'), cx + 8, cy - 16); g.globalAlpha = 1; }
      if (snap) { const s = Math.max(0, 10 - (k - 6)) * 2 + 4; RR(g, cx - s, cy - 1, s * 2 + 1, 2, '#ffffff'); RR(g, cx - 1, cy - s, 2, s * 2 + 1, '#ffffff'); }
      g.restore(); }
    g.restore();
    // The glint on the snap; radial lines closing in, like in an anime close-up.
    if (k >= 6 && k < 10) { g.globalAlpha = (10 - k) / 4 * .6; RR(g, 0, 0, W, H, '#ffffff'); g.globalAlpha = 1; }
    if (snap) { g.fillStyle = f.col; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28 + i * .3, r0 = 70 + ((i * 37) % 30) - (k - 6) * 1.5, len = 20 + ((i * 17) % 40); g.globalAlpha = .5; for (let q = 0; q < len; q += 2) g.fillRect(Math.round(cx + Math.cos(a) * (r0 + q)), Math.round(cy + Math.sin(a) * (r0 + q) * .7), 1, 1); } g.globalAlpha = 1; }
    // Out through a flash of its colour into the rise.
    if (k > n - 5) light(g, () => { g.globalAlpha = (k - (n - 5)) / 5 * .8; RR(g, 0, 0, W, H, f.col); });
  }
  // A comic panel with Nila's face, startled, over halftone and speed lines: slides in, holds, slides out.
  function inset(g, k, n, f) {
    const inK = back(k / 9), outK = smooth((k - (n - 8)) / 8), x = Math.round(-92 + (inK - outK) * 104), y = 24, w = 78, h = 52;
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-.06); g.translate(-w / 2, -h / 2);
    RR(g, -3, -3, w + 6, h + 6, '#1b1420'); RR(g, -1, -1, w + 2, h + 2, '#fff6d6');
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, f.deep); gr.addColorStop(1, '#e2905c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let yy = 1; yy < h; yy += 4) for (let xx = (yy >> 2) % 2 * 2; xx < w; xx += 4) g.fillRect(xx, yy, 1, 1);
    g.globalAlpha = .45; g.fillStyle = '#ffffff'; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; for (let r = 18; r < 60; r += 3) g.fillRect(Math.round(w / 2 + Math.cos(a) * r), Math.round(h / 2 + 8 + Math.sin(a) * r), 1, 1); } g.globalAlpha = 1;
    const N = ART.nila.idle[0], jolt = k < 4 ? (4 - k) : 0; g.imageSmoothingEnabled = false; g.drawImage(N, 0, 0, 16, 13, w / 2 - 32, 3 - jolt + Math.round(Math.sin(k / 3)), 64, 52);
    // A drop of sweat sliding down her hood.
    const sd = (k * .6) % 14; RR(g, w / 2 + 22, 8 + sd, 3, 4, '#1b1420'); RR(g, w / 2 + 23, 8 + sd, 2, 3, '#bfe6f5'); RR(g, w / 2 + 23, 8 + sd, 1, 1, '#ffffff');
    g.restore();
    ART.glup(g, '!', w - 12, -4 - (k % 12 < 6 ? 1 : 0), { size: 'small', pal: 'oro', align: 'center', each: () => ({ rot: .15, sy: 1 + (k < 5 ? (5 - k) * .1 : 0) }) });
    g.restore();
  }
  // The impact frames of the burst: a silhouette on white, then white on the trick's colour, speed lines.
  function impact(g, l) {
    const f = feel(l.power), i = STOP_BURST - l.stop, inv = i >= 4, spr = ART.fish.squint, z = 1.3 + i * .015, w = spr.width * S * z, h = spr.height * S * z;
    RR(g, 0, 0, W, H, inv ? f.col : '#ffffff');
    g.fillStyle = inv ? '#ffffff' : f.deep; for (let q = 0; q < 48; q++) { const a = q / 48 * 6.28 + hash(q), r0 = 40 + hash(q + 3) * 30; g.globalAlpha = .7; for (let r = r0; r < r0 + 60 + hash(q + 9) * 80; r += 2) g.fillRect(Math.round(W / 2 + Math.cos(a) * r), Math.round(H / 2 + Math.sin(a) * r * .65), 1, 1); } g.globalAlpha = 1;
    g.drawImage(ART.tint(spr, inv ? '#ffffff' : '#140e18'), Math.round(W / 2 - w / 2), Math.round(H / 2 - h / 2 - 6), Math.round(w), Math.round(h));
    bars(g, 20);
  }

  // ================================================================ La carta
  const CW = 296, CH = 154, CV = { w: 300, h: 180, ox: 2, oy: 12 };   // the card, and the canvas it is painted on (room for the tags)
  const DI = { x: 9, y: 53, w: 160, h: 80 };                          // the diorama's window on the card
  const RC = { x: 178, w: 110 };                                       // the right column
  let cardCv = null, parch = null, woodBack = null;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // The card itself: a wooden frame with a brass inlay round the parchment (painted once).
  function paintCard(woodOnly) {
    const M = MUNDO, b = M.Buf(CW, CH), cl = (v, a, c) => v < a ? a : v > c ? c : v;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const e = Math.min(x, y, CW - 1 - x, CH - 1 - y), cr = Math.min(x, CW - 1 - x) + Math.min(y, CH - 1 - y);
      if (cr < 2) continue;
      if (e === 0 || cr === 2) { M.put(b, x, y, OUT); continue; }
      if (e < 5 || woodOnly) {
        if (woodOnly && e >= 5) { const n = M.noise(x / 13, y / 3, 4), seam = y % 13 === 0; M.put(b, x, y, seam ? WD[0] : n > .62 ? WD[1] : n < .25 ? WD[3] : WD[2]); continue; }
        const n = M.noise(x / 11, y * 1.7, 4); M.put(b, x, y, e === 1 ? WD[4] : e === 4 ? WD[1] : n > .64 ? WD[2] : n < .2 ? WD[4] : WD[3]); continue;
      }
      if (e === 5) { M.put(b, x, y, (x + y) % 5 === 0 ? '#f2d27a' : '#c8963a'); continue; }
      if (e === 6) { M.put(b, x, y, '#6a5030'); continue; }
      const n = M.noise(x / 15, y / 7, 6) * .6 + M.noise(x / 3, y / 2, 7) * .4, edge = Math.max(0, 1 - (e - 7) / 7);
      M.put(b, x, y, M.pick([M.rgb('#b89660'), M.rgb('#c8a870'), M.rgb('#d8bf8c'), M.rgb('#e6d2a4'), M.rgb('#efdfb6')], cl(.9 - edge * .75 + (n - .5) * .45, 0, 1), x, y));
    }
    if (!woodOnly) { const r = ART.rng(23); for (let i = 0; i < 5; i++) { const sx = 20 + r() * (CW - 40), sy = 14 + r() * (CH - 28), rr = 3 + r() * 5; for (let y = -rr; y <= rr; y++) for (let x = -rr * 1.5; x <= rr * 1.5; x++) if ((x / 1.5) ** 2 + y * y < rr * rr && M.dith(x | 0, y | 0) < .25) M.put(b, sx + x, sy + y, '#c0a070', .4); } }
    for (const [x, y] of [[2, 2], [CW - 4, 2], [2, CH - 4], [CW - 4, CH - 4], [CW >> 1, 1], [CW >> 1, CH - 3]]) { M.put(b, x, y, '#d8d0c0'); M.put(b, x + 1, y, '#a8a090'); M.put(b, x + 1, y + 1, '#3a2a20'); }
    return M.toCanvas(b);
  }
  // A round medallion on the card: a wooden ring with a brass edge round a disc of colour.
  function medallion(g, x, y, r, fill) {
    disc(g, x, y + 1, r + 1, OUT); disc(g, x, y, r + 1, OUT); disc(g, x, y, r, WD[3]); disc(g, x - .5, y - .5, r - 1, WD[4]); disc(g, x, y, r - 2, '#c8963a'); disc(g, x, y, r - 3, OUT); disc(g, x, y, r - 4, fill);
  }
  // A step's number on a wax seal.
  function seal(g, x, y, n) { disc(g, x, y + 1, 5, OUT); disc(g, x, y, 5, '#a8342a'); disc(g, x - .5, y - .5, 4, '#c8483a'); RR(g, x - 2, y - 3, 1, 1, '#ff9a8a'); Letra.text(g, String(n), x - 1, y - 3, { color: '#fff0d8' }); }
  // Text with the player's buttons in it (as small pills): wrapped to a width; returns the number of lines.
  function words(text) { const map = TOK[mode()]; return text.split(' ').map(w => { const k = /\{(\w+)\}/.exec(w); return k ? { s: w.replace(k[0], map[k[1]] || k[1]), key: map[k[1]] || k[1], pre: w.slice(0, k.index), post: w.slice(k.index + k[0].length) } : { s: w }; }); }
  function para(g, text, x, y, maxW, col, o = {}) {
    const ws = words(text), lh = o.lh || 10, sp = 3, tw = ART.textWidth, wOf = w => w.key ? tw(w.pre) + (w.pre ? 1 : 0) + tw(w.key) + 4 + (w.post ? 1 : 0) + tw(w.post) : tw(w.s);
    const lines = [[]]; let lw = 0;
    for (const w of ws) { const ww = wOf(w), cur = lines[lines.length - 1]; if (cur.length && lw + sp + ww > maxW) { lines.push([w]); lw = ww; } else { lw += (cur.length ? sp : 0) + ww; cur.push(w); } }
    let shown = o.shown === undefined ? Infinity : o.shown;
    lines.slice(0, o.max || 9).forEach((ln, i) => {
      let cx = o.center ? Math.round(x - ln.reduce((a, w, j) => a + wOf(w) + (j ? sp : 0), 0) / 2) : x;
      for (const w of ln) {
        if (shown <= 0) return;
        if (w.key) {
          if (w.pre) { Letra.text(g, w.pre, cx, y + i * lh, { color: col, shown }); cx += tw(w.pre) + 1; }
          const kw = tw(w.key) + 4; RR(g, cx, y + i * lh - 2, kw, 11, o.pill || '#7a4a2a'); RR(g, cx, y + i * lh - 2, kw, 1, '#a8704a'); RR(g, cx, y + i * lh + 8, kw, 1, '#4a2a18');
          Letra.text(g, w.key, cx + 2, y + i * lh, { color: '#fff4dc' }); cx += kw;
          if (w.post) { Letra.text(g, w.post, cx + 1, y + i * lh, { color: col }); cx += tw(w.post) + 1; }
        } else { Letra.text(g, w.s, cx, y + i * lh, { color: col, shown }); cx += tw(w.s); }
        cx += sp; shown -= w.s.length + 1;
      }
    });
    return lines.length;
  }
  // ---- The buttons, as the player has them.
  // A keycap (keyboard): a raised key with its letter; pad: a round face button in its colour.
  function cap(g, label, x, y, w, h, round) {
    if (round) { const c = label === 'A' ? '#4aa84a' : label === 'B' ? '#d0503a' : label === 'X' ? '#3a78d0' : '#8a8f9a', r = Math.round(h / 2); disc(g, x + r, y + r + 1, r + 1, OUT); disc(g, x + r, y + r, r + 1, OUT); disc(g, x + r, y + r, r, c); disc(g, x + r - 1, y + r - 1, r - 2, c); RR(g, x + r - 3, y + 2, 3, 1, 'rgba(255,255,255,.6)'); Letra.text(g, label, x + r - (ART.textWidth(label) >> 1), y + r - 3, { color: '#ffffff', shadow: OUT }); return; }
    RR(g, x - 1, y - 1, w + 2, h + 3, OUT); RR(g, x, y, w, h + 1, '#a89a80'); RR(g, x, y, w, h - 1, '#e8e0cc'); RR(g, x, y, w, 1, '#fffbe8'); RR(g, x + 1, y + 1, w - 2, 1, '#f6f0e0');
    Letra.text(g, label, x + (w >> 1) - (ART.textWidth(label) >> 1), y + (h >> 1) - 4, { color: '#1b2430' });
  }
  // One chip: the button (bubble / key / pad button, or the stick) and a word under it.
  function chip(g, c, x, y, t, m) {
    const S0 = 30;
    if (c.b === 'stick') {
      if (m === 'touch') {
        const cx = x + 15, cy = y + 15; Touch.disc(g, cx, cy + 1, 14, '#1b1420'); Touch.disc(g, cx, cy, 13, '#2f6a3a'); Touch.disc(g, cx, cy - 1, 12, '#3f8a44'); Touch.disc(g, cx - 2, cy - 3, 8, '#4fa24c');
        const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[c.dir], push = 4 + Math.round(Math.abs(Math.sin(t / 10)) * 3);
        Touch.disc(g, cx + d[0] * push, cy + d[1] * push + 1, 7, '#1b1420'); Touch.disc(g, cx + d[0] * push, cy + d[1] * push, 6, '#6fb8c8'); Touch.disc(g, cx + d[0] * push - 1, cy + d[1] * push - 1, 4, '#a8e0e8'); RR(g, cx + d[0] * push - 3, cy + d[1] * push - 3, 2, 1, '#ffffff');
        arrowMark(g, cx + d[0] * 13, cy + d[1] * 13, c.dir, '#f2c43d');
      } else if ((m === 'pad' || m === 'puretv')) {
        const cx = x + 15, cy = y + 15; for (const [dx, dy] of [[0, 0], [-8, 0], [8, 0], [0, -8], [0, 8]]) RR(g, cx + dx - 5, cy + dy - 5, 10, 10, OUT);
        for (const [dx, dy, k] of [[0, 0, ''], [-8, 0, 'left'], [8, 0, 'right'], [0, -8, 'up'], [0, 8, 'down']]) { RR(g, cx + dx - 4, cy + dy - 4, 8, 8, k === c.dir ? '#f2c43d' : '#5a5e6a'); RR(g, cx + dx - 4, cy + dy - 4, 8, 1, k === c.dir ? '#fff3b8' : '#7a7e8a'); }
      } else cap(g, { left: '←', right: '→', up: '↑', down: '↓' }[c.dir], x + 5, y + 6, 20, 17);
    } else if (m === 'touch') {
      const key = c.hot ? 'hot' : c.b; g.drawImage(Touch.bubble(key, S0), x, y);
      if (c.b === 'fish') {
        const face = c.hot ? ART.fish.squint : c.face === 'full' || c.water ? ART.fish.full : c.lab === 'pica' || c.pips ? ART.fish.open : ART.fish.closed;
        if (c.water) { g.fillStyle = 'rgba(80,190,200,.55)'; for (let q = 0; q < 20; q++) g.fillRect(x + 5 + q, y + 17 + Math.round(Math.sin(q / 3 + t / 6)), 1, 7); }
        g.drawImage(face, x + 4, y + 4); Player.fishOverlay(g, face, x + 4, y + 4, t, { noWhiskers: true, mood: c.hot ? 'mad' : 'happy', lx: 1 });
        if (c.hot) ringArc(g, x, y, S0, (t % 60) / 60, (t >> 2) & 1 ? '#ffffff' : '#ffe36a');
        if (c.pips) for (let i = 0; i < 3; i++) { RR(g, x + 9 + i * 5, y + 2, 3, 3, OUT); RR(g, x + 10 + i * 5, y + 3, 2, 2, i < c.pips ? (c.pips === 3 && i === 2 ? '#ffe36a' : '#8fe0f0') : 'rgba(255,255,255,.25)'); }
      } else if (c.b === 'jump') {
        const N = ART.nila, spr = c.lab === 'panzazo' ? N.tuck : N.jump; g.drawImage(spr, 0, 0, 16, 14, x + 7, y + 3 + Math.round(Math.sin(t / 8)), 16, 14);
        if (c.lab === 'aletea') { const f2 = (t >> 3) & 1; RR(g, x + 4, y + 9 + f2, 3, 1, '#e8fbff'); RR(g, x + 23, y + 9 + f2, 3, 1, '#e8fbff'); }
        if (c.lab === 'panzazo') for (let i = 0; i < 3; i++) RR(g, x + 9 + i * 5, y + 2 + ((t + i * 3) % 6), 1, 3, '#f2c46a');
      } else if (c.b === 'puff') {
        const k = t * .12; for (let i = 0; i < 3; i++) { const yy = y + 5 + i * 4, len = 12 - i * 2, off = Math.round(((k + i * .7) % 1) * 3); RR(g, x + 6 + off, yy + 1, len, 1, '#1a1420'); RR(g, x + 6 + off, yy, len, 1, i === 1 ? '#ffffff' : '#d8f0fb'); RR(g, x + 6 + off + len, yy - 1, 2, 1, '#ffffff'); }
      }
      Letra.text(g, c.lab, x + 15 - (ART.textWidth(c.lab) >> 1), y + 18, { color: c.hot ? '#ffe36a' : '#fff6d6', outline: '#120c18' });
    } else {
      const L0 = TOK[m][c.b], w = Math.max(18, ART.textWidth(L0) + 10);
      cap(g, L0, x + 15 - (w >> 1), y + 6, (m === 'pad' || m === 'puretv') ? 18 : w, (m === 'pad' || m === 'puretv') ? 18 : 17, (m === 'pad' || m === 'puretv'));
      if (c.pips) for (let i = 0; i < 3; i++) { RR(g, x + 8 + i * 5, y, 3, 3, OUT); RR(g, x + 9 + i * 5, y + 1, 2, 2, i < c.pips ? (c.pips === 3 && i === 2 ? '#e0a020' : '#3a9ab0') : '#d8c498'); }
      if (c.hot) { g.globalAlpha = .5 + .5 * Math.sin(t / 4); RR(g, x + 4, y + 26, 22, 1, '#e0602a'); g.globalAlpha = 1; }
    }
    // Under it: when (the bubbles say what they do inside them), or what the key does.
    ART.text(g, chipWord(c, m), x + 15, y + 33, INK2, 'center');
  }
  const chipWord = (c, m) => m === 'touch' || c.b === 'stick' ? c.verb : c.lab;
  function ringArc(g, x, y, S0, k, col) { const m = (S0 - 1) / 2, R = S0 / 2 - 1.7; for (let a = 0; a < k * 6.283; a += .12) RR(g, x + m + Math.cos(a - Math.PI / 2) * R, y + m + Math.sin(a - Math.PI / 2) * R, 1, 1, col); }
  function arrowMark(g, x, y, dir, col) {
    const sh = { up: [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]], down: [[0, 2], [-1, 1], [0, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]], left: [[-2, 0], [-1, -1], [-1, 0], [-1, 1], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2]], right: [[2, 0], [1, -1], [1, 0], [1, 1], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2]] }[dir];
    for (const [a, b] of sh) RR(g, x + a, y + b + 1, 1, 1, OUT); for (const [a, b] of sh) RR(g, x + a, y + b, 1, 1, col);
  }
  function chips(g, list, cx, y, t, m) {
    const wOf = c => typeof c === 'string' ? 8 : Math.max(30, ART.textWidth(chipWord(c, m)) + 3), total = list.reduce((a, c) => a + wOf(c), 0); let x = Math.round(cx - total / 2);
    for (const c of list) {
      const w = wOf(c);
      if (typeof c === 'string') { if (c === '+') { RR(g, x + 1, y + 14, 5, 1, INK2); RR(g, x + 3, y + 12, 1, 5, INK2); } else arrowMark(g, x + 3, y + 14, 'right', INK2); x += w; continue; }
      chip(g, c, x + ((w - 30) >> 1), y, t, m); x += w;
    }
  }

  // ---- The diorama: the real swamp in miniature (its sky, its earth, its tiles), and Nila doing the trick in a loop.
  // Each one: the terrain rows (10×5 tiles: the ground's top is at 64, the rows above at 48, 32, 16), how long the
  // loop is (in its own frames, a little slower than the game's) and its steps; demoDraw draws a frame of it.
  const E = '..........', G = '##########', DEMO_SPEED = .7, G4 = 64, G3 = 48, G2 = 32;
  const DEMOS = {
    aleteo: { rows: [E, E, '.......###', '.......###', G], loop: 150, steps: [[0, 'Salta'], [44, 'En el aire, {jump} otra vez'], [84, '¡Hasta arriba!']] },
    soplido: { rows: [E, E, E, E, G], loop: 150, steps: [[0, 'Un bicho se acerca'], [48, 'Pulsa {puff}'], [76, '¡Fuera, y aturdido!']] },
    ventosa: { rows: [E, E, E, E, G], loop: 150, steps: [[0, 'Salta contra el muro'], [26, 'Bigotes se pega'], [50, '{jump}: al muro de enfrente'], [112, '¡Hasta arriba!']] },
    chorro: { rows: [E, E, E, '~~##....##', '~~##....##'], loop: 190, steps: [[0, 'Sorbe agua de la charca'], [44, 'Salta y mantén {fish}'], [74, '¡El chorro os sostiene!']] },
    mordisco: { rows: [E, E, E, '##......##', '##~~~~~~##'], loop: 170, steps: [[0, 'Salta hacia el anzuelo'], [22, '{fish} en la diana: ¡pica!'], [56, 'Suelta: ¡salís lanzados!'], [70, 'En el aire, {fish} al siguiente'], [116, '¡Al otro lado!']] },
    panzazo: { rows: [E, E, E, '####XX####', '####..####'], loop: 120, steps: [[0, 'Salta'], [40, 'En el aire, {down} y {jump}'], [60, '¡CRAC! Rompe el suelo']] },
    guindilla: { rows: [E, E, E, E, G], loop: 150, steps: [[0, 'Sorbe una piedra'], [42, 'Mantén {fish}: ¡que arda!'], [92, 'Suelta: ¡escupitajo picante!']] },
    resbalon: { rows: [G, '....###...', '....###...', E, G], loop: 110, steps: [[0, 'Agáchate con {down}'], [30, 'Pulsa {puff}'], [40, '¡Por debajo, en trineo!']] },
    sorbo2: { rows: [E, E, E, E, G], loop: 130, steps: [[0, 'Mantén {fish}'], [48, 'Más rato: ¡nivel 2!'], [66, '¡Ahora llega más lejos!']] },
    sorbo3: { rows: [E, E, E, E, G], loop: 200, steps: [[0, 'Mantén {fish}'], [48, 'Más rato: ¡nivel 2!'], [104, '¡SÚPER! Lo arrastra todo']] } };
  // Nila with Bigotes at the hitbox corner x and the boots at by, facing dir.
  function carry(g, x, by, spr, fish, dir = 1) {
    g.save(); if (dir < 0) { g.translate(Math.round(x) * 2 + 10, 0); g.scale(-1, 1); }
    Player.drawCarry(g, Math.round(x), Math.round(by) - 18, spr, fish || ART.fish.closed, 0); g.restore();
  }
  // A jump: from (x0, y0) along a parabola of height h to (x1, y1), k from 0 to 1.
  function arc(k, x0, y0, x1, y1, h) { k = clamp01(k); return { x: lerp(x0, x1, k), y: lerp(y0, y1, k) - Math.sin(k * Math.PI) * h }; }
  // The path ahead, as faint dots (so the move reads at a glance).
  function path(g, fn, k0, k1) { g.globalAlpha = .55; for (let k = k0; k <= k1; k += .06) { const p = fn(k); RR(g, p.x + 5, p.y - 9, 1, 1, '#fff6d6'); } g.globalAlpha = 1; }
  // The golden sight on a hook, as in the game.
  function sight(g, x, y, t) {
    const R = Math.round(10 - Math.sin((t % 30) / 30 * Math.PI) * 2), c = (t >> 3) % 2 ? '#fff6d6' : '#f2c46a';
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = x + sx * R, py = y + sy * R; RR(g, px - (sx > 0 ? 3 : 0), py - 1, 4, 3, OUT); RR(g, px - 1, py - (sy > 0 ? 3 : 0), 3, 4, OUT); RR(g, px - (sx > 0 ? 2 : 0), py, 3, 1, c); RR(g, px, py - (sy > 0 ? 2 : 0), 1, 3, c); }
  }
  // The lunge: a bright dotted line racing from the mouth to the hook.
  function lunge(g, x0, y0, x1, y1, e) { for (let i = 0; i <= 24; i++) { const q = i / 24 * clamp01(e); RR(g, lerp(x0, x1, q), lerp(y0, y1, q), 1, 1, i % 2 ? '#e6c46a' : '#fff6d6'); } }
  function word(g, s, x, y, col) { Letra.text(g, s, Math.round(x - ART.textWidth(s) / 2), Math.max(1, Math.round(y)), { color: col, outline: '#140e18' }); }
  function stars(g, x, y, t) { for (let i = 0; i < 3; i++) { const a = t * .15 + i * 2.1; g.drawImage(ART.star, Math.round(x + Math.cos(a) * 7 - 1), Math.round(y + Math.sin(a) * 2 - 1)); } }
  function debris(g, x, y, f, n, cols, seed) { for (let i = 0; i < n; i++) { const a = -Math.PI * hash(i + seed), v = 1 + hash(i + seed + 3) * 2; RR(g, x + Math.cos(a) * v * f * (i % 2 ? 1 : -1), y + Math.sin(a) * v * f + f * f * .09, 2, 2, cols[i % cols.length]); } }
  // A hook on its line from the top, with its float (and the worm until Bigotes has bitten it).
  function hook(g, x, y, t, bait) { RR(g, x, 0, 1, y - 11, '#d8e0e8'); RR(g, x - 2, y - 22, 5, 7, OUT); RR(g, x - 1, y - 21, 3, 3, '#e8403a'); RR(g, x - 1, y - 18, 3, 2, '#ffffff'); Item.hookShape(g, x, y, bait, t); }
  // Bigotes biting the hook with Nila hanging under him, the whole thing swung by th round the tie (px, py).
  const ROPE = 18;
  function hang(g, px, py, th, t) {
    g.save(); g.translate(px, py); g.rotate(-th);
    RR(g, 0, 0, 1, ROPE, '#e8f0f8');
    g.save(); g.translate(0, ROPE + 11); g.rotate(-Math.PI / 2); const fs = ART.fish.full; g.drawImage(fs, -11, -6); Player.fishOverlay(g, fs, -11, -6, t, { mood: 'mad', lx: 1, noWhiskers: true }); g.restore();
    g.save(); g.translate(0, ROPE - 10); Item.hookShape(g, 0, 0, false, t); g.restore();
    const N = ART.nila.hang[Math.max(0, Math.min(4, Math.round(2 + th * 3)))]; g.drawImage(N, -8, ROPE + 19); g.drawImage(ART.hand, -3, ROPE + 19); g.restore();
  }
  // Where Nila is (hitbox corner, boots) when she lets go of a line swung by th.
  const letGo = (px, py, th) => ({ x: px + Math.sin(th) * (ROPE + 32) - 5, y: py + Math.cos(th) * (ROPE + 43) });
  function demoDraw(g, power, T, l) {
    const D = DEMOS[power], th = L.def ? L.def.theme : 'dusk', TL = MUNDO.tiles(th), A = MUNDO.water(th), N = ART.nila, F = ART.fish, f = feel(power);
    const k = Math.floor(T * DEMO_SPEED) % D.loop, t = T, gy = G4;
    // The sky and the far swamp of this very place, then its water and its earth.
    const bg = MUNDO.background(th); g.save(); g.translate(0, -96); MUNDO.drawBackground(g, 240 + t * .2, 44, bg, t, DI.w, H); g.restore();
    const ter = MUNDO.sceneTerrain('aprende-' + power, D.rows, th), wet = (fn) => D.rows.forEach((r, ty) => { for (let tx = 0; tx < 10; tx++) if (r[tx] === '~') fn(tx, ty, ty === 0 || D.rows[ty - 1][tx] !== '~'); });
    wet((tx, ty, top) => g.drawImage(A.back[top ? 0 : 1][tx & 1], tx * 16, ty * 16));
    g.drawImage(ter.chunks[0], 0, 0);
    wet((tx, ty, top) => g.drawImage(top ? A.front[((t >> 3) + tx) % 8] : A.deepFront, tx * 16, ty * 16));
    switch (power) {
      case 'aleteo': {
        const j1 = q => arc(q, 12, gy, 54, 50, 16), j2 = q => arc(q, 54, 50, 124, G2, 18);
        if (k < 18) { path(g, j1, 0, 1); carry(g, 12, gy, N.idle[(k >> 3) % 2 ? 0 : 2], F.closed); break; }
        if (k < 44) { const q = (k - 18) / 26, p = j1(q); path(g, j1, q, 1); carry(g, p.x, p.y, k < 30 ? N.jump : N.apex, F.closed); break; }
        if (k < 84) {
          const q = (k - 44) / 40, p = j2(q), flap = k < 56; path(g, j2, q, 1);
          carry(g, p.x, p.y, flap ? N.tuck : q < .5 ? N.jump : N.fall, flap ? F.full : F.closed);
          if (flap) { const r = (k - 44) * 1.5, fy = p.y - 10; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) RR(g, p.x + 5 + s * (8 + r * .6 + i * 2), fy + i * 2 + ((k >> 1) & 1), 3, 1, '#e8fbff'); RR(g, p.x + 5 - r, p.y + 2, r * 2 + 1, 1, '#dff2fb'); word(g, '¡FLAP!', p.x + 6, p.y - 32, '#fff6d6'); }
          for (let i = 0; i < 4; i++) { const a = k - 48 - i * 3; if (a > 0 && a < 30) { g.globalAlpha = 1 - a / 30; RR(g, 60 + i * 5 + Math.sin(a / 3 + i) * 3, 40 + a * .8, 2, 1, '#fff6d6'); g.globalAlpha = 1; } }
          break;
        }
        carry(g, 124, G2, k < 90 ? N.land : N.cheer[(k >> 3) % 2], F.closed); break; }
      case 'soplido': {
        const sx = k < 48 ? 150 - k * .9 : k < 74 ? 107 : Math.min(140, 107 + (k - 74) * 2.2 * (1 - (k - 74) / 60)), stun = k >= 74, sn = ART.snail[(k >> 3) % 2];
        g.drawImage(ART.pinwheel[k > 80 && k < 130 ? (k >> 1) % 2 : (k >> 4) % 2], 142, gy - 16);
        if (!stun) g.drawImage(ART.flip(sn), Math.round(sx), gy - sn.height); else { g.save(); g.translate(Math.round(sx) + sn.width / 2, gy - sn.height / 2); g.scale(1, -1); g.drawImage(ART.flip(sn), -sn.width / 2, -sn.height / 2); g.restore(); stars(g, sx + 8, gy - 16, t); }
        const blowing = k >= 48 && k < 70; carry(g, 14, gy, blowing ? N.brace : N.idle[(k >> 3) % 2 ? 0 : 2], k >= 42 && k < 50 ? F.full : blowing ? F.spit : F.closed);
        if (k >= 48 && k < 96) { const r = (k - 48) * 3.2; for (let s = 0; s < 5; s++) for (let u = Math.max(0, r - 18); u < r; u++) { if (41 + u > 158) break; g.globalAlpha = 1 - u / 130; RR(g, 41 + u, gy - 7 + (s - 2) * (2 + u * .1) + Math.sin(u * .3 + s) * 1.2, 1, 1, s % 2 ? '#dff2fb' : '#ffffff'); } g.globalAlpha = 1; }
        if (k >= 74 && k < 96) word(g, '¡FUUU!', 110, 30, '#e8fbff');
        break; }
      case 'ventosa': {
        for (let y = 0; y < gy; y += 16) { g.drawImage(TL.rootWall.mid[(y >> 4) & 1], 32, y); g.drawImage(TL.rootWall.mid[(y >> 4) & 1], 112, y); }
        // x is her hitbox corner; stuck, Bigotes' mouth touches the wall (she hangs from him).
        const LW = 64, RW = 86, seg = [[0, 12, 'idle', 84, gy], [12, 26, 'jump', LW, 52, 84, gy, 14], [26, 50, 'wall', LW, 52, -1], [50, 66, 'jump', RW, 38, LW, 52, 16], [66, 86, 'wall', RW, 38, 1], [86, 100, 'jump', LW, 24, RW, 38, 14], [100, 112, 'wall', LW, 24, -1], [112, 999, 'up', LW, 24]];
        const sg = seg.find(s => k >= s[0] && k < s[1]), q = (k - sg[0]) / (sg[1] - sg[0]);
        if (sg[2] === 'idle') carry(g, 84, gy, N.idle[0], F.closed, -1);
        else if (sg[2] === 'jump') { const p = arc(q, sg[5], sg[6], sg[3], sg[4], sg[7]); carry(g, p.x, p.y, N.jump, F.open, sg[3] < sg[5] ? -1 : 1); }
        else if (sg[2] === 'wall') {
          const side = sg[5], x = sg[3], y = sg[4] + (k - sg[0]) * .15; carry(g, x, y, N.wall, F.open, side);
          const cx = side < 0 ? 48 : 112, cy = y - 6, a = (k - sg[0]) % 16; g.globalAlpha = 1 - a / 16; oval(g, cx, cy, 2 + a * .5, 3 + a * .9, f.col, 1); g.globalAlpha = 1;
          if (k - sg[0] < 10) word(g, '¡CHUP!', cx - side * 18, cy - 24, '#d0f09a');
        } else { const up = (k - 112) * 2.6; if (up < 60) carry(g, LW + (k - 112) * .5, 24 - up, N.jump, F.closed, 1); }
        break; }
      case 'chorro': {
        for (let x = 64; x < 128; x += 16) g.drawImage(TL.thorns[(x >> 4) & 1], x, gy);
        if (k < 40) { carry(g, 38, G3, k < 8 ? N.idle[0] : N.brace, k < 8 ? F.closed : F.open, -1); if (k >= 8) Game.drawStream(g, 14, G3 + 2, 21, G3 - 6, -t, 1, 2 + (k - 8) / 16); }
        else if (k < 46) carry(g, 38, G3, N.idle[0], F.full, 1);
        else if (k < 70) { const p = arc((k - 46) / 24, 38, G3, 62, 30, 14); carry(g, p.x, p.y, N.jump, F.full); }
        else if (k < 140) {
          const x = 62 + (k - 70) * .95, by = 30 + (k - 70) * .06, spr = N.dangle[(k >> 3) % 4];
          g.drawImage(spr, Math.round(x - 3), Math.round(by - spr.height));
          g.save(); g.translate(Math.round(x + 12), Math.round(by - 6)); g.rotate(Math.PI / 2); g.drawImage(F.full, -11, -6); Player.fishOverlay(g, F.full, -11, -6, t, { mood: 'mad', lx: 1, noWhiskers: true }); g.restore();
          Game.drawStream(g, x + 12, by + 5, x + 12, gy + 6, t, 1, 3); for (let i = 0; i < 3; i++) RR(g, x + 8 + ((t * 3 + i * 5) % 9), gy + 3 - ((t + i * 4) % 5), 1, 1, '#c8f2ea');
          g.drawImage(ART.hand, Math.round(x + 7), Math.round(by - 14));
        } else if (k < 150) { const p = arc((k - 140) / 10, 128.5, 34.2, 132, G3, 2); carry(g, p.x, p.y, N.fall, F.closed); }
        else carry(g, 132, G3, k < 158 ? N.land : N.cheer[(k >> 3) % 2], F.closed);
        break; }
      case 'mordisco': {
        const H1 = { x: 58, y: 22 }, H2 = { x: 104, y: 22 }, PY = H1.y - ROPE;
        // Idle, the jump, the lunge, swinging on the first, the fling, the lunge, swinging on the second, the fling, landing.
        const on1 = k >= 30 && k < 58, on2 = k >= 84 && k < 110, sw = (k0, a0) => a0 * Math.cos((k - k0) * .12);
        if (!on2) hook(g, H2.x, H2.y, t, k < 84); if (!on1) hook(g, H1.x, H1.y, t, k < 30);
        if (k < 14) carry(g, 10, G3, N.idle[0], F.closed);
        else if (k < 30) { const p = arc((k - 14) / 22, 10, G3, 40, 38, 20); carry(g, p.x, p.y, N.jump, k > 24 ? F.open : F.closed); if (k >= 20) sight(g, H1.x + 3, H1.y + 4, t); if (k >= 25) lunge(g, p.x + 27, p.y - 6, H1.x + 3, H1.y + 4, (k - 25) / 5); }
        else if (on1) { hang(g, H1.x, PY, sw(30, -.8), t); if (k < 40) word(g, '¡PICA!', H1.x + 16, 4, '#e6c46a'); }
        else if (k < 84) {
          const r = letGo(H1.x, PY, -.8 * Math.cos(28 * .12)), p = arc((k - 58) / 26, r.x, r.y, 80, 40, 14);
          carry(g, p.x, p.y, k < 66 ? N.launch : N.jump, k > 76 ? F.open : F.closed); if (k < 68) word(g, '¡FIUU!', p.x + 4, p.y - 34, '#fff6d6');
          if (k >= 70) sight(g, H2.x + 3, H2.y + 4, t); if (k >= 78) lunge(g, p.x + 27, p.y - 6, H2.x + 3, H2.y + 4, (k - 78) / 6);
        } else if (on2) { hang(g, H2.x, PY, sw(84, -.7), t); if (k < 94) word(g, '¡OTRO!', H2.x + 16, 4, '#e6c46a'); }
        else if (k < 128) { const r = letGo(H2.x, PY, -.7 * Math.cos(26 * .12)), p = arc((k - 110) / 18, r.x, r.y, 136, G3, 16); carry(g, p.x, p.y, N.jump, F.closed); }
        else carry(g, 136, G3, k < 134 ? N.land : N.cheer[(k >> 3) % 2], F.closed);
        break; }
      case 'panzazo': {
        const broken = k >= 60;
        if (!broken) { g.drawImage(TL.cracked[0], 64, G3); g.drawImage(TL.cracked[1], 80, G3); }
        if (k < 16) carry(g, 22, G3, N.idle[0], F.closed);
        else if (k < 40) { const p = arc((k - 16) / 24, 22, G3, 70, 26, 10); carry(g, p.x, p.y, N.jump, F.closed); }
        else if (k < 52) { const y = 26 - Math.sin((k - 40) / 12 * Math.PI) * 3; carry(g, 70, y, N.tuck, F.closed); if (k > 44) word(g, '¡PANZAZO!', 76, y - 30, '#f2c46a'); }
        else if (k < 76) { const y = Math.min(26 + (k - 52) * 6, broken ? 999 : G3); if (y < 110) { carry(g, 70, y, N.tuck, F.full); for (let i = 0; i < 4; i++) RR(g, 72 + i * 4, y - 32 - i * 3, 1, 10, '#fff6d6'); } }
        if (k >= 60 && k < 100) { debris(g, 80, G3, k - 60, 14, ['#8a8f94', '#4f545a', '#c9b08a'], 3); if (k < 84) word(g, '¡CRAC!', 80, 18, '#fff6d6'); if (k < 64) { g.globalAlpha = .6; RR(g, 0, 0, DI.w, DI.h, '#ffffff'); g.globalAlpha = 1; } }
        break; }
      case 'guindilla': {
        if (k < 112) { g.drawImage(TL.hard[0], 128, G2); g.drawImage(TL.hard[1], 128, G3); }
        const rk = ART.rock, rx = k < 14 ? 70 : k < 40 ? 70 - Math.pow((k - 14) / 26, 2) * 34 : -99;
        if (rx > 0) g.drawImage(rk, Math.round(rx), gy - rk.height);
        const suck = k >= 14 && k < 40, hold = k >= 40 && k < 92, heat = hold ? clamp01((k - 44) / 40) : 0, spit = k >= 92 && k < 100;
        const fs = suck ? F.open : hold ? (heat >= 1 ? F.squint : F.full) : spit ? F.spit : F.closed, jit = heat >= 1 ? ((k >> 1) & 1) : 0;
        carry(g, 12 + jit, gy, suck || hold ? N.brace : spit ? N.spit : N.idle[0], fs);
        if (suck) for (let i = 0; i < 6; i++) { const q = 1 - ((k * .08 + i / 6) % 1); RR(g, 40 + q * 36, gy - 8 + (hash(i) - .5) * q * 16, 3, 1, '#cfe8f0'); }
        if (heat > 0) { light(g, () => { g.globalAlpha = heat * (.5 + .3 * Math.sin(t / 3)); disc(g, 28, gy - 6, 8 + heat * 4, '#ff6a3a'); }); g.globalAlpha = 1; for (let i = 0; i < 3; i++) { const q = (t * .05 + i / 3) % 1; g.globalAlpha = heat * (1 - q); RR(g, 24 + i * 5, gy - 14 - q * 14, 1, 2, '#9aa0a8'); } g.globalAlpha = 1; if (heat >= 1) word(g, '¡ARDE!', 30, gy - 40, '#ffb03a'); }
        if (k >= 92 && k < 112) { const px = 40 + (k - 92) * 5; if (px < 128) { flame(g, px - 4, gy - 3, 4, 6); for (let i = 1; i < 5; i++) { g.globalAlpha = 1 - i / 5; RR(g, px - i * 6, gy - 9 + (i % 2), 6, 2, i < 2 ? '#fff6d6' : '#ff8a3a'); } g.globalAlpha = 1; g.drawImage(ART.tint(rk, '#ff9a3a'), Math.round(px), gy - rk.height - 4); } }
        if (k >= 108 && k < 140) { debris(g, 136, G3, k - 108, 16, ['#6f747c', '#b98a3a', '#ff8a3a'], 7); if (k < 130) word(g, '¡ZAS!', 128, 16, '#ffb03a'); if (k < 112) { g.globalAlpha = .5; RR(g, 0, 0, DI.w, DI.h, '#fff6d6'); g.globalAlpha = 1; } }
        break; }
      case 'resbalon': {
        if (k < 22) carry(g, -10 + k * 2, gy, N.run8[(k >> 1) % 8], F.closed);
        else if (k < 30) carry(g, 34, gy, N.crouch, F.closed);
        else if (k < 100) {
          const x = 34 + (k - 30) * 3.4 * (1 - (k - 30) / 200), by = gy, fs = (k >> 2) % 2 ? F.open : F.full;
          for (let i = 0; i < 6; i++) { const len = 10 + ((i * 7 + t * 3) % 14), y = by - 3 - i * 3 - (i % 2); g.globalAlpha = .6; RR(g, x - 10 - len - ((t * 5 + i * 11) % 9), y, len, 1, i % 2 ? '#fff6d6' : '#dff2fb'); } g.globalAlpha = 1;
          g.drawImage(fs, Math.round(x - 6), by - 11); Player.fishOverlay(g, fs, Math.round(x - 6), by - 11, t, { mood: 'happy', lx: 1 });
          g.save(); g.translate(Math.round(x + 5), by - 7); g.transform(1, 0, .22, 1, 0, 0); g.drawImage(N.slide, -8, -N.slide.height + 2); g.restore();
          if (k % 3 === 0) RR(g, x - 6, by - 2, 2, 1, '#c9b08a');
          if (k < 46) word(g, '¡ZUUM!', x + 10, by - 38, '#dff2fb');
        }
        break; }
      case 'sorbo2': case 'sorbo3': {
        const lv = power === 'sorbo3' ? 3 : 2, rkX = 113, crX = 135, m = { x: 37, y: gy - 6 };
        const cur = k < 10 ? 0 : k < 48 ? 1 : k < 104 || lv < 3 ? 2 : 3, got1 = k >= 66, got2 = lv === 3 && k >= 124;
        const rx = k < 50 ? rkX : got1 ? -99 : rkX - Math.pow((k - 50) / 16, 2) * (rkX - m.x);
        const cx2 = k < 106 ? crX : got2 ? -99 : crX - Math.pow((k - 106) / 18, 2) * (crX - m.x);
        if (rx > 0) g.drawImage(ART.rock, Math.round(rx), gy - ART.rock.height);
        if (lv === 3 && cx2 > 0) g.drawImage(ART.crate, Math.round(cx2), gy - ART.crate.height);
        const sucking = cur > 0 && k < (lv === 3 ? 124 : 66);
        carry(g, 10, gy, sucking ? N.brace : N.idle[0], sucking ? F.open : got1 ? F.full : F.closed);
        if (sucking) { const reach = REACH[cur - 1], half = CONE[cur - 1] * .5; g.globalAlpha = .45; for (let q = 4; q < reach; q += 3) for (const s2 of [-1, 1]) RR(g, m.x + q, m.y + s2 * q * half, 1, 1, '#e8fbff'); g.globalAlpha = 1;
          for (let i = 0; i < 6 + cur * 3; i++) { const u = 1 - ((t * (.03 + cur * .012) + hash(i)) % 1), a = (hash(i + 3) - .5) * 2 * half, q = 4 + u * reach; g.globalAlpha = (1 - u) * .9; RR(g, m.x + q, m.y + a * q, 2 + cur, 1, cur === 3 ? '#fff6d6' : '#cfe8f0'); } g.globalAlpha = 1; }
        for (let i = 0; i < 3; i++) { RR(g, 11 + i * 5, gy - 32, 4, 4, OUT); RR(g, 12 + i * 5, gy - 31, 2, 2, i < cur ? (i === 2 ? '#ffe36a' : '#8fe0f0') : 'rgba(255,255,255,.25)'); }
        if (k >= 48 && k < 64) word(g, '¡NIVEL 2!', 70, 14, '#cfe8f0');
        if (lv === 3 && k >= 104 && k < 124) word(g, '¡SÚPER!', 70, 14, '#ffe36a');
        break; }
    }
    const st = D.steps.reduce((a, s, i) => k >= s[0] ? i : a, 0);
    return { step: st, text: D.steps[st][1], since: k - D.steps[st][0] };
  }
  // The diorama in its wooden window, opening like a shutter, with the step's caption on a strip along the bottom.
  function diorama(g, power, T, l, open) {
    const x = DI.x, y = DI.y, w = DI.w, h = DI.h;
    RR(g, x - 4, y - 4, w + 8, h + 8, OUT); RR(g, x - 3, y - 3, w + 6, h + 6, WD[3]); RR(g, x - 3, y - 3, w + 6, 1, WD[5]); RR(g, x - 3, y + h + 2, w + 6, 1, WD[1]); RR(g, x - 1, y - 1, w + 2, h + 2, OUT);
    RR(g, x, y, w, h, '#10141c');
    if (open <= 0) return;
    const oh = Math.round(h * open);
    g.save(); g.beginPath(); g.rect(x, y + ((h - oh) >> 1), w, oh); g.clip(); g.translate(x, y);
    const c = demoDraw(g, power, T, l);
    // The caption: a dark strip, the step's number on a wax seal, the words sliding in.
    const cy = h - 11, slide = c.since < 6 ? (6 - c.since) * 3 : 0; g.globalAlpha = .78; RR(g, 0, cy - 2, w, 13, '#0c0a14'); g.globalAlpha = 1; RR(g, 0, cy - 3, w, 1, '#3a2a3a');
    seal(g, 7, cy + 4, c.step + 1); g.save(); g.beginPath(); g.rect(13, cy - 2, w - 13, 13); g.clip(); para(g, c.text, 15 + slide, cy + 1, w - 18, '#fff6d6', { pill: '#a8342a' }); g.restore();
    g.restore();
    // Glass: a shine across the corner.
    g.globalAlpha = .12; for (let i = 0; i < 12; i++) RR(g, x + w - 30 + i, y + i, 8, 1, '#ffffff'); g.globalAlpha = 1;
  }
  function teacherOf(l) {
    const Q = Maestros.QUIEN; for (const k in Q) if (Q[k].name === l.giver) return Q[k];
    const d = LEVELS.find(d => d.maestro && d.maestro.poder === l.power); return d ? Q[d.maestro.quien] : null;
  }
  // The front of the card, painted at (0, 0) = its top left. u: frames since it became visible.
  function front(g, l, page, u, t) {
    const sorb = page === 1, key = sorb ? 'sorbo' + (l.sorbo === 3 ? 3 : 2) : l.power, f = sorb ? (l.sorbo === 3 ? Object.assign({}, FEEL.sorbo, { pal: 'oro', col: '#ffe36a' }) : FEEL.sorbo) : feel(l.power), how = HOW[key] || HOW.aleteo, m = mode();
    g.drawImage(parch || (parch = paintCard(false)), 0, 0);
    // A wash of the trick's colour behind the title.
    g.globalAlpha = .16; const gr = g.createLinearGradient(0, 7, 0, 46); gr.addColorStop(0, f.col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(7, 7, CW - 14, 40); g.globalAlpha = 1;
    // The title in GLUP letters, dropping in one by one; the medallions (the morsel, the teacher) at the corners.
    const name = sorb ? (l.sorbo === 3 ? '¡SÚPER SORBO!' : 'SORBO FUERTE') : (POWERS[l.power] || {}).name || l.power;
    const size = ART.glupWidth(name, 'mid') <= 226 ? 'mid' : 'small', gap = size === 'small' && ART.glupWidth(name, 'mid', 0) <= 226 ? 0 : undefined;
    const sz = gap === 0 ? 'mid' : size;
    ART.glup(g, name, CW / 2, sz === 'mid' ? 10 : 15, { size: sz, gap, pal: f.pal, align: 'center', shadow: true, each: i => {
      const a = u - 10 - i * 3; if (a < 0) return false; const k = clamp01(a / 7), land = a >= 7 && a < 19 ? Math.sin((a - 7) / 12 * Math.PI) * Math.exp(-(a - 7) / 8) : 0, wob = Math.sin(t * .08 + i * 1.3);
      return { y: Math.round((1 - k * k) * -24 + wob), sx: 1 + land * .35 + wob * .03, sy: 1 - land * .3 - wob * .03, drips: Math.max(0, Math.round(Math.sin(t * .05 + i * 2.1) * 1.4)) };
    } });
    const mk = back((u - 4) / 10);
    if (mk > 0) {
      g.save(); g.translate(20, 20); g.scale(mk, mk); medallion(g, 0, 0, 14, '#f4e6c0');
      if (sorb) { for (let i = 0; i < 3; i++) { const on = i < l.sorbo; disc(g, -6 + i * 6, 0, 3, OUT); disc(g, -6 + i * 6, 0, 2.2, on ? (i === 2 ? '#ffe36a' : '#3a9ab0') : '#d8c498'); } }
      else { const ic = ART.morsels[l.power]; if (ic) { g.save(); g.scale(2, 2); g.drawImage(ic, -4, -4 + Math.round(Math.sin(t / 14) * .6)); g.restore(); } }
      g.restore();
      if (!sorb && (t % 80) < 24) { const q = (t % 80) / 24; g.globalAlpha = 1 - q; RR(g, 27, 9, 1, 5, '#ffffff'); RR(g, 25, 11, 5, 1, '#ffffff'); g.globalAlpha = 1; }
      const who = sorb ? null : teacherOf(l);
      g.save(); g.translate(CW - 20, 20); g.scale(mk, mk); medallion(g, 0, 0, 14, who ? who.fondo : '#2e4a3a');
      g.save(); g.beginPath(); g.arc(0, 0, 10, 0, 7); g.clip();
      if (who) Maestros.portrait(g, who, -11, -11, 22, 22, false, t);
      else { const fs = ART.fish.open; g.drawImage(fs, -11, -6); Player.fishOverlay(g, fs, -11, -6, t, { mood: 'happy', lx: 1, noWhiskers: true }); }
      g.restore(); g.restore();
    }
    // Under the title: who taught it (and with what), or what just happened to the inhale.
    if (u > 16) {
      g.globalAlpha = clamp01((u - 16) / 6);
      if (sorb) para(g, l.sorbo === 3 ? 'Su sorbo llega al tercer nivel: ¡SÚPER!' : 'Su sorbo ya tiene dos niveles', CW / 2, 38, 220, INK2, { center: true });
      else { const who = teacherOf(l), food = foodOf(l), a = who ? who.name : '', b = who ? ' te lo enseñó con ' + food : 'Bigotes se ha tragado ' + food, b2 = who ? ' te lo enseñó' : b;
        const bb = ART.textWidth(a + b) <= 226 ? b : b2, w2 = ART.textWidth(a + bb), x0 = Math.round(CW / 2 - w2 / 2); const wa = a ? Letra.text(g, a, x0, 38, { color: INKR }) : 0; Letra.text(g, bb, x0 + wa, 38, { color: INK2 }); }
      g.globalAlpha = 1;
    }
    for (let x = 12; x < CW - 12; x += 2) RR(g, x, 47, 1, 1, INKF); RR(g, CW / 2 - 3, 46, 7, 3, INKF); RR(g, CW / 2 - 1, 45, 3, 5, INKF); RR(g, CW / 2, 47, 1, 1, '#fff4dc');
    // The diorama, the buttons, what to do, what for.
    diorama(g, sorb ? key : l.power, Math.max(0, u - 18) + 1, l, smooth((u - 18) / 12));
    if (u > 28) { g.globalAlpha = clamp01((u - 28) / 6); chips(g, how.chips, RC.x + RC.w / 2, 53, t, m); g.globalAlpha = 1; }
    if (u > 34) para(g, how.text, RC.x, 100, RC.w, INK, { shown: Math.floor((u - 34) * 3), max: 3 });
    if (u > 40) { g.globalAlpha = clamp01((u - 40) / 6); const uy = CH - 15; g.drawImage(ART.star, 12, uy + 2); para(g, how.use, 19, uy, CW - 34, INKG, { pill: '#3e6a2a' }); g.globalAlpha = 1; }
  }
  // The back of the card (seen while it flips): wood with the morsel in a big medallion.
  function backSide(g, l, t) {
    g.drawImage(woodBack || (woodBack = paintCard(true)), 0, 0);
    medallion(g, CW / 2, CH / 2, 26, '#3a2a1e'); const ic = ART.morsels[l.power]; if (ic) { g.save(); g.translate(CW / 2, CH / 2); g.scale(4, 4); g.drawImage(ART.tint(ic, '#c8963a'), -4, -4); g.restore(); }
    for (const [x, y] of [[20, 20], [CW - 20, 20], [20, CH - 20], [CW - 20, CH - 20]]) { disc(g, x, y, 3, OUT); disc(g, x, y, 2, '#c8963a'); }
  }
  // "Sigue": a tag under the card's corner with the player's own button.
  function prompt(g, t, m, x, y) {
    const lab = 'sigue', pulse = Math.round(Math.sin(t / 6)), tw = ART.textWidth(lab), bw = m === 'touch' ? 22 : 16, w = tw + bw + 12;
    RR(g, x - w + 6, y - 3, 1, 3, '#8a6a44'); RR(g, x - 7, y - 3, 1, 3, '#8a6a44');
    RR(g, x - w - 1, y - 1, w + 2, 16, OUT); RR(g, x - w, y, w, 14, WD[2]); RR(g, x - w, y, w, 1, WD[4]); RR(g, x - w, y + 13, w, 1, WD[1]);
    ART.text(g, lab, x - 5, y + 3, '#fff4dc', 'right', OUT);
    const bx = x - w + 3;
    if (m === 'touch') { g.drawImage(Touch.bubble('ok', 20), bx, y - 3 + pulse); const ax = bx + 8 + ((t >> 3) & 1); for (let i = 0; i < 4; i++) RR(g, ax + i, y + 7 - 3 + i * 0 - (3 - i) + pulse, 1, (3 - i) * 2 + 1, i ? '#ffe36a' : '#ffffff'); }
    else cap(g, (m === 'pad' || m === 'puretv') ? 'A' : 'Z', bx + 1, y + 1 + (pulse > 0 ? 1 : 0), 12, 11, (m === 'pad' || m === 'puretv'));
  }
  function cardDraw(g, l) {
    const s = l.t - CINE, t = l.rt, f = feel(l.power), P = Player, px = Math.round(P.x - Cam.x) + 5, py = Math.round(P.y - Cam.y) + 8;
    const out = l.exit ? 1 - l.exit / EXIT : 1, cardK = clamp01((s - CARD) / 10);
    // Darkness with a spotlight on Nila; darker still once the card is up.
    const dark = Math.min(1, s / 16) * (.8 + cardK * .1) * out;
    const gr = g.createRadialGradient(px, py - 10, 14, px, py - 10, 60); gr.addColorStop(0, 'rgba(6,8,16,' + (dark * cardK * .8).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(6,8,16,' + dark.toFixed(3) + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // Straight out of the burst: rings opening round them.
    if (s < FLASH) for (let i = 0; i < 3; i++) { const r = s * (3 + i * 1.6); g.globalAlpha = (1 - s / FLASH) * .9; g.strokeStyle = i ? f.col : '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, Math.max(0, r), 0, 7); g.stroke(); }
    g.globalAlpha = 1;
    // The pose: Nila holds Bigotes up high, rays of the trick's colour behind, the morsel floating over them.
    if (!l.exit) {
      const lift = ease(s / 14) * 6;
      light(g, () => { g.translate(px, py - 30 - lift); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * .012, len = 74 + Math.sin(t / 10 + i) * 8; g.globalAlpha = (i % 2 ? .2 : .1) * Math.min(1, s / 10); g.fillStyle = i % 2 ? f.col : '#fff6d6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - .09) * len, Math.sin(a - .09) * len); g.lineTo(Math.cos(a + .09) * len, Math.sin(a + .09) * len); g.fill(); } });
      g.globalAlpha = 1;
      const spr = ART.nila.win, fs = (t % 60) < 5 ? ART.fish.blink : ART.fish.full; g.drawImage(spr, px - 8, py + 10 - spr.height);
      g.save(); g.translate(px, py - 14 - lift); g.rotate(-Math.PI / 2 + Math.sin(t / 9) * .08); g.drawImage(fs, -fs.width / 2, -fs.height / 2); Player.fishOverlay(g, fs, -fs.width / 2, -fs.height / 2, t, { mood: s > 30 ? 'happy' : 'shock' }); g.restore();
      g.drawImage(ART.hand, px - 4, py - 10); g.drawImage(ART.hand, px + 1, py - 10);
      const ic = ART.morsels[l.power], is = 3 * ease(s / 12); if (ic && is > 0) { light(g, () => { g.globalAlpha = .4; disc(g, px, py - 52, 6 * is, f.col); }); g.globalAlpha = 1; g.save(); g.translate(px, py - 52 + Math.round(Math.sin(t / 14) * 2)); g.scale(is, is); g.drawImage(ic, -4, -4); g.restore(); }
    }
    if (s < FLASH) { g.globalAlpha = Math.pow(1 - s / FLASH, 2); RR(g, 0, 0, W, H, '#ffffff'); g.globalAlpha = 1; }
    if (s < CARD) return;
    // The card: painted on its own canvas, then flipped in (back first), dropped with a bounce, and away on the exit.
    const cv = cardCv || (cardCv = canvas(CV.w, CV.h)), cg = cv.getContext('2d'); cg.clearRect(0, 0, CV.w, CV.h); cg.imageSmoothingEnabled = false;
    const k = clamp01((s - CARD) / FLIP), turn = (1 - smooth(k)) * Math.PI, pk = l.page === 1 ? clamp01(l.pageT / FLIP2) : 0;
    let sx = Math.cos(turn), page = 0, u = s - CARD;
    if (l.page === 1) { sx = Math.cos(pk * Math.PI); page = pk < .5 ? 0 : 1; if (page === 1) u = l.pageT - (FLIP2 >> 1); else u = 999; }
    cg.save(); cg.translate(CV.ox, CV.oy);
    if (sx < 0 && l.page === 0) backSide(cg, l, t); else front(cg, l, page, u, t);
    cg.restore();
    // The tag on top: what just happened, in the display letters, on a strip of wood.
    const tag = page === 1 ? (l.sorbo === 3 ? '¡Sorbo al máximo!' : '¡Bigotes sorbe más fuerte!') : '¡Bigotes ha aprendido!', tw = Letra.boldWidth(tag.toUpperCase()) + 16, tx = Math.round(CV.w / 2 - tw / 2);
    if (Math.abs(sx) > .2) { RR(cg, tx + 6, CV.oy - 3, 1, 4, '#8a6a44'); RR(cg, tx + tw - 7, CV.oy - 3, 1, 4, '#8a6a44'); RR(cg, tx - 1, 0, tw + 2, 15, OUT); RR(cg, tx, 1, tw, 13, WD[2]); RR(cg, tx, 1, tw, 1, WD[4]); RR(cg, tx, 13, tw, 1, WD[1]); RR(cg, tx + 2, 3, 1, 1, '#d8d0c0'); RR(cg, tx + tw - 3, 3, 1, 1, '#d8d0c0'); ART.title(cg, tag, CV.w / 2, 3, '#fff3b8', 'center'); }
    const ready = (l.page === 0 && s >= READY) || (l.page === 1 && l.pageT >= FLIP2 + 30);
    if (ready && !l.exit) prompt(cg, t, mode(), CV.ox + CW - 8, CV.oy + CH - 5);
    const drop = l.exit ? ease(l.exit / EXIT) * 200 : (1 - back(clamp01((s - CARD) / (FLIP * .9)))) * 120, rot = l.exit ? ease(l.exit / EXIT) * .25 : 0;
    const X = W / 2, Y = CV.h / 2 + drop, sc = l.exit ? 1 : .8 + .2 * ease(k);
    g.save(); g.translate(Math.round(X), Math.round(Y)); if (rot) g.rotate(rot); g.scale(Math.max(.02, Math.abs(sx)) * sc, sc);
    // A soft shadow under the card.
    g.globalAlpha = .35 * out; g.fillStyle = '#000000'; g.fillRect(-CV.w / 2 + CV.ox + 3, -CV.h / 2 + CV.oy + 4, CW, CH); g.globalAlpha = 1;
    g.drawImage(cv, -CV.w / 2, -CV.h / 2);
    g.restore();
  }
  function draw(g) {
    const l = Game.learning;
    if (l.t < CINE) cineDraw(g, l);
    else if (l.t === CINE && l.stop > 0) impact(g, l);
    else cardDraw(g, l);
  }
  return { start, update, draw, posing };
})();
