// GLUP — la Garza, jefa del nido. Una pelea en tres fases, cada una con su truco, su música y su
// punto de control; todo ataque avisa al menos medio segundo antes (sombra, grito, alas, líneas).
//   I   El vuelo — planea, suelta piedras (la munición) y se lanza en picado donde marca la sombra.
//       Se le devuelven las piedras hacia arriba; tras el picado se queda un momento en el suelo.
//   II  El barro — rompe el nido y baja al suelo. Para con el ala lo que le tires, salvo cuando:
//       · el picotazo falla y el pico se le clava en el barro (el escupitajo picante quita dos, el panzazo vale);
//       · bate las alas para echarte a las zarzas y le soplas en contra: pierde el equilibrio.
//       Y lanza plumas en abanico: unas cruces rojas marcan dónde caerán.
//   III La furia — ojos rojos y sube el agua por los lados. Lluvia de piedras con sombras, doble picado
//       (el segundo la deja clavada) y abanico desde el aire.
// Cada golpe le hace escupir una cría; el último, a cámara lenta y con destello, suelta todas las que quedan.
// No es un sprite fijo sino una marioneta articulada que se pinta píxel a píxel: cuello en S que se enrosca
// y se dispara, pico que se abre, ojo que parpadea y sigue a Nila, penacho que ondea, alas que baten con las
// primarias a la zaga, patas que andan y se doblan, plumas que se erizan. Cada ataque tiene su amago y su
// inercia; los golpes la encogen y le cierran el ojo; mareada le cuelga el cuello; furiosa echa humo.
'use strict';
const Boss = (() => {
  const MAX_HP = 8, CRIAS = 10, PHASE_HP = [8, 6, 3], HOVER_Y = 64, SONGS = ['heron', 'heron2', 'heron3'];
  // Phase II plan, in order: a stab, a fan of feathers, another stab, the wing gust.
  const P2 = ['stab', 'fan', 'stab', 'gust'], P3 = ['dive', 'rain', 'fan', 'dive', 'fan', 'rain'];
  // She can be hurt in these states; in these others she parries with a wing (¡TOC!).
  // Gliding about she sees a stone coming and sidesteps it (not before the first blow, so phase I can teach):
  // she has to be caught while committed — aiming a dive, on the ground, shaking the nest or throwing darts.
  const DODGE = { hover: 1, rise: 1 };
  const VULN = { hover: 1, aim: 1, lock: 1, plunge: 1, land: 1, rise: 1, stuck: 1, stagger: 1, rainUp: 1, fanAir: 1 };
  const PARRY = { walk: 1, windup: 1, stab: 1, pull: 1, yank: 1, gustWind: 1, gust: 1, fanWind: 1, fanPost: 1 };
  // Touching her hurts in these (never while she is stuck, dizzy, knocked about or in a cutscene).
  const HARM = { hover: 1, aim: 1, lock: 1, plunge: 1, land: 1, rise: 1, walk: 1, windup: 1, stab: 1, pull: 1, yank: 1, gustWind: 1, gust: 1, fanWind: 1, fanPost: 1, rainUp: 1, fanAir: 1 };
  const SPAWN = 'sfmKcr*HL?EBOR!N@PV';

  // ---------------------------------------------------------------- El ruedo
  // The arena is the last 24 columns: a gate of bars on its left, brambles at both ends, two branches,
  // and the nest up on the dead cypress.
  function arena(phase) {
    const c0 = L.w - 24, floor = (L.h - 3) * TS, wet = (phase || L.bossCk || 0) >= 3;
    return { c0, x0: c0 * TS, x1: L.w * TS, floor, lo: (c0 + (wet ? 3 : 1)) * TS + 6, hi: (L.w - (wet ? 4 : 2)) * TS - 6,
      perch: { x: (c0 + 12) * TS, y: 4 * TS }, entry: { x: (c0 + 3) * TS + 3, y: floor - 20 }, mid: (c0 + 12) * TS };
  }
  const WET_COLS = A => [A.c0, A.c0 + 1, A.c0 + 2, L.w - 4, L.w - 3, L.w - 2, L.w - 1];
  function arenaTiles(phase) {
    const A = arena(phase), out = [];
    for (let y = 4; y <= L.h - 4; y++) out.push([A.c0 - 1, y, 'G']);
    out.push([A.c0, L.h - 4, '^']);
    if (phase >= 2) { for (let x = A.c0 + 9; x <= A.c0 + 14; x++) out.push([x, 4, '.']); for (let x = A.c0 + 10; x <= A.c0 + 13; x++) out.push([x, 9, '=']); }
    if (phase >= 3) for (const x of WET_COLS(A)) out.push([x, L.h - 4, '.'], [x, L.h - 3, '~'], [x, L.h - 2, '~']);
    return out;
  }
  // Put the arena back as it was at the start of `phase` (a respawn at a phase checkpoint).
  function applyArena(phase) {
    const A = arena(phase);
    for (let y = 0; y < L.h; y++) for (let x = A.c0 - 1; x < L.w; x++) { const ch = L.def.rows[y][x]; L.t[y][x] = SPAWN.includes(ch) ? '.' : ch; }
    for (const [x, y, ch] of arenaTiles(phase)) setTile(x, y, ch);
  }
  function rocks() {
    let n = 0; for (const e of L.ents) if (!e.dead && e.kind === 'rock') n++;
    for (const p of L.projs) if (!p.dead && p.kind === 'rock') n++; if (Player.held && Player.held.kind === 'rock') n++; return n;
  }
  function dust(x, y, n = 10, spread = 1.5) { spawnParts(n, x, y, { color: ['#c9b08a', '#a08a6a', '#6a5a4a'], angle: -Math.PI / 2, spread, speed: [.5, 2.4], life: [12, 26] }); }
  function feathers(x, y, n = 8) { spawnParts(n, x, y, { color: ['#e9eef2', '#a9b8c9', '#7d8fa6'], speed: [.3, 1.8], life: [24, 50], g: .02, kind: 'feather' }); }
  function set(b, s) { b.state = s; b.st = 0; }
  function face(b, px) { b.dir = px < b.x + 15 ? -1 : 1; }
  function shriek(b, big) {
    Sound.play('shriek', big ? 1 : .6, { x: b.x + 15 }); b.shriek = big ? 50 : 30; Input.rumble(big ? 300 : 120, big ? .8 : .3, .5);
    Game.word(big ? '¡KRAAAAA!' : '¡KRAAA!', b.x + 15, b.y - 10 < Cam.y + 30 ? b.y + 50 : b.y - 10, big ? '#ff9a6a' : '#f2c46a', true); Cam.shake(big ? 4 : 1, big ? 30 : 8);
  }
  // The beak: where the tip is, standing (for mud and glints).
  function beak(b, A) { return { x: b.dir < 0 ? b.x - 10 : b.x + 40, y: A.floor - 2 }; }

  // ---------------------------------------------------------------- Crear y reaparecer
  function create() {
    // A capture scene can start at a phase checkpoint: FASE=2 (tools/captura.sh), FASE=2.3 with her plan at step 3,
    // FASE=1.trans1 straight into a state.
    const fase = typeof location !== 'undefined' && Game.capture && /[?&]fase=(\d)(?:\.(\d))?(?:\.(\w+))?/.exec(location.search || '');
    if (fase && !L.bossCk) { L.bossCk = +fase[1]; applyArena(L.bossCk); L.checkpoint = { x: arena().entry.x, y: arena().entry.y }; }
    const A = arena(), ck = L.bossCk || 0;
    const b = { kind: 'heron', boss: true, x: A.perch.x + 90, y: -80, w: 30, h: 28, vx: 0, vy: 0, dir: -1, t: 0, st: 0, state: 'wait', phase: 1, hp: MAX_HP, maxHp: MAX_HP,
      flash: 0, inv: 0, shriek: 0, lock: false, card: null, pat: 0, tx: 0, dive: 0, air: true, rage: 0, fight: false, aims: null, rain: null, whiteT: 0, redT: 0, riseTo: HOVER_Y, after: 'hover', gdir: 1, sdir: -1, hx: 0, dodge: 0, dodgeCd: 0,
      update, draw, dead: false };
    if (ck >= 4) { b.dead = true; return b; }
    if (ck) { b.fight = true; b.phase = ck; b.hp = PHASE_HP[ck - 1]; b.rage = ck >= 3 ? 1 : 0; b.x = A.x1 - 10; b.y = -50; set(b, 'return'); }
    if (fase) {
      b.pat = +(fase[2] || 0); const s = fase[3];
      if (s) { b.x = A.mid + 30; b.y = s === 'trans1' || s === 'final' ? HOVER_Y : A.floor - 30; b.air = b.y < A.floor - 30; b.hp = s === 'trans1' ? PHASE_HP[1] : s === 'trans2' ? PHASE_HP[2] : s === 'final' ? 1 : b.hp; set(b, s); if (s === 'final') { b.hp = 0; finale(b); } }
    }
    return b;
  }
  // Nila died after the fight began: back at the arena gate, the arena as it was when this phase began,
  // the crías already freed stay freed. Returns false before the fight (then the level reloads).
  function restart() {
    const ck = L.bossCk || 0; if (!ck) return false;
    if (ck < 4) applyArena(ck);
    spawnEntities();
    const A = arena(Math.min(ck, 3)); L.checkpoint = { x: A.entry.x, y: A.entry.y };
    if (ck >= 4) { L.ents.push(Item.boat((L.w - 4) * TS + 2, A.floor + 14)); L.boatSpawned = true; }
    Player.reset(L.checkpoint.x, L.checkpoint.y, true); Player.lastSafe = null;
    return true;
  }
  function song() { const ck = L.bossCk || 0; return ck >= 4 ? 'dock' : ck ? SONGS[ck - 1] : L.def.music; }
  // Slow motion after the last blow: two frames out of three stand still.
  function skip() { if (!(L.bossSlow > 0)) return false; L.bossSlow--; return L.bossSlow % 3 !== 0; }

  // ---------------------------------------------------------------- Estados
  const S = {
    // Out of sight until Nila walks into the arena.
    wait(b, A, px, P) { b.x = A.perch.x + 100; b.y = -80; if (px > A.x0 + 40 && P.onGround && !P.dead) set(b, 'intro'); },
    // The gate slams, the camera looks up at the nest, she lands on it and shrieks; her name card slides in.
    intro(b, A, px) {
      const pc = A.perch;
      if (b.st === 1) {
        b.fight = true; b.lock = true; L.bossCk = 1; L.checkpoint = { x: A.entry.x, y: A.entry.y }; Sound.stopMusic(); Sound.play('gate'); Sound.play('thud');
        for (const [x, y, ch] of arenaTiles(1)) { setTile(x, y, ch); if (ch === 'G') spawnParts(2, x * TS + 8, y * TS + 8, { color: ['#c78d4e', '#a56f38'], speed: [.3, 1.2], life: [10, 20], g: .1 }); }
        dust(A.x0 - 8, A.floor, 12); Cam.shake(3, 12);
      }
      if (b.st < 36) { b.x = pc.x + 100; b.y = -70; b.air = true; }
      else if (b.st < 100) { const k = (b.st - 36) / 64, e = 1 - (1 - k) * (1 - k); b.x = pc.x + 100 - 115 * e; b.y = -70 + (pc.y - 30 + 70) * e; b.air = true; if (b.st % 14 === 0) Sound.play('flap'); }
      else { b.air = false; b.x = pc.x - 15; b.y = pc.y - 30; }
      if (b.st === 100) { Sound.play('thud'); Cam.shake(2, 8); spawnParts(10, pc.x, pc.y, { color: ['#4a2e1a', '#6b4a30', '#c78d4e'], angle: -Math.PI / 2, spread: 1.4, speed: [.5, 1.8], life: [14, 26], g: .12 }); }
      if (b.st > 36) face(b, px);
      if (b.st === 118) { shriek(b, true); Game.stop(8); Sound.playMusic(SONGS[0]); b.card = { title: 'La Garza', sub: 'reina del ciprés muerto', t: 0, life: 220 }; }
      if (b.st >= 180) { b.lock = false; b.air = true; set(b, 'hover'); }
    },
    // After a respawn: she swoops back in, shrieks, and the phase goes on.
    return(b, A, px) {
      const ground = b.phase === 2, ty = ground ? A.floor - 30 : HOVER_Y;
      b.air = true; b.x = lerp(b.x, A.mid + 50 - 15, .05); b.y = lerp(b.y, ty, .06); face(b, px);
      if (b.st === 40) shriek(b, false);
      if (b.st >= 70) { if (ground) { b.y = A.floor - 30; b.air = false; set(b, 'walk'); } else set(b, 'hover'); }
    },
    // ---- I and III: in the air
    // Glides to a spot beside Nila (picked once, so she can be walked under) and bobs there.
    hover(b, A, px) {
      const p3 = b.phase === 3, dur = p3 ? 80 : 150, off = [70, -70, 40, -40][b.pat % 4] * (p3 ? .8 : 1);
      if (b.st === 1 || (!p3 && b.st === 80)) b.hx = clamp(px + off * (b.st === 1 ? 1 : -.6), A.x0 + 80, A.x1 - 80);
      b.air = true; b.x = lerp(b.x, b.hx - 15, p3 ? .05 : .03);
      b.y = lerp(b.y, HOVER_Y + Math.sin(b.t / (p3 ? 12 : 22)) * (p3 ? 6 : 4), .1); face(b, px);
      if (b.phase === 1 && (b.st === 30 || b.st === 100)) dropRock(b);
      if (b.st > dur) nextAir(b);
    },
    // Follows Nila from above, rising; then the mark is fixed.
    aim(b, A, px) {
      const n = b.dive === 2 ? 10 : 24, x = clamp(px, A.lo, A.hi);
      b.air = true; b.x = lerp(b.x, x - 15, .12); b.y = lerp(b.y, b.dive === 2 ? 80 : HOVER_Y - 6, .1); face(b, px);
      if (b.st >= n) { b.tx = x; set(b, 'lock'); }
    },
    // The shadow blinks where she will fall; she shrieks and trembles.
    lock(b) {
      const n = b.phase === 1 ? 34 : b.dive === 2 ? 26 : 28;
      if (b.st === 1) shriek(b, false);
      b.x = b.tx - 15 + Math.sin(b.st * 1.3) * 1.2;
      if (b.st >= n) { b.vy = 1; set(b, 'plunge'); Sound.play('swoop', null, { x: b.x + 15 }); }
    },
    plunge(b, A) {
      b.vy = Math.min(b.vy + .9, 9); b.y += b.vy; b.x = lerp(b.x, b.tx - 15, .3);
      if (b.y + 30 >= A.floor) {
        b.y = A.floor - 30; b.air = false; Cam.shake(b.phase === 3 ? 4 : 3, 10); Sound.play('stab', null, { x: b.x + 15 }); Sound.play('thud', null, { x: b.x + 15 }); Input.rumble(120, .5, .3);
        dust(b.x + 15, A.floor, 14, 1.7); L.parts.push({ x: b.x + 7, y: A.floor - 2, vx: 0, vy: 0, life: 8, color: '#c9b08a', size: 1, g: 0, kind: 'ring' });
        if (b.phase === 3 && b.dive === 2) set(b, 'stuck'); else set(b, 'land');
      }
    },
    // A beat on the ground after the dive (in phase I a window for a straight shot).
    land(b) {
      b.air = false;
      if (b.st >= (b.phase === 1 ? 30 : 10)) {
        if (b.phase === 3 && b.dive === 1) { b.dive = 2; b.riseTo = 80; b.after = 'aim'; } else { b.riseTo = HOVER_Y; b.after = 'hover'; }
        set(b, 'rise');
      }
    },
    rise(b, A, px) {
      b.air = true; b.y -= b.phase === 3 ? 3.2 : 2.4; face(b, px);
      if (b.y <= b.riseTo) { b.y = b.riseTo; set(b, b.after); }
    },
    // Hit in the air: knocked up and spinning, then back to it.
    reel(b, A) {
      b.air = true; if (b.st === 1) b.vy = -2.4; b.vy = Math.min(b.vy + .12, 1.5); b.y = clamp(b.y + b.vy, 24, A.floor - 40); b.x = clamp(b.x - b.dir * 1.2, A.x0, A.x1 - 30);
      if (b.st % 5 === 0) feathers(b.x + 15, b.y + 12, 2);
      if (b.st >= 40) { b.riseTo = HOVER_Y; b.after = 'hover'; set(b, b.y > HOVER_Y + 4 ? 'rise' : 'hover'); }
    },
    // ---- III: the rain of rocks
    rainUp(b, A, px) {
      b.air = true; b.x = lerp(b.x, A.mid - 15, .06); b.y = lerp(b.y, 48, .08); face(b, px);
      if (b.st === 26) { Sound.play('rumble'); Cam.shake(4, 30); Game.word('¡KRAK!', A.mid, 60, '#f2c46a', true); b.rain = [0, 72, -72, 144, -144].map(o => px + o).filter(x => x > A.lo && x < A.hi); }
      if (b.rain && b.st >= 30 && (b.st - 30) % 12 === 0 && b.rain.length) rainRock(b.rain.shift());
      if (b.st >= 30 + 12 * 5 + 40) set(b, 'hover');
    },
    // ---- III: a fan of feathers from the air
    fanAir(b, A, px) {
      b.air = true; b.y = lerp(b.y, HOVER_Y + 6, .08); if (b.st < 10) face(b, px);
      if (b.st === 1) Sound.play('ruffle');
      if (b.st === 10) b.aims = fanAims(b, A, true);
      if (b.st === 40) fire(b);
      if (b.st % 4 === 0 && b.st < 36) feathers(b.x + 15, b.y + 12, 1);
      if (b.st >= 60) set(b, 'hover');
    },
    // ---- II: on the ground
    walk(b, A, px) {
      b.air = false; b.y = A.floor - 30; face(b, px);
      const dx = px - (b.x + 15), want = P2[b.pat % P2.length];
      if (Math.abs(dx) > 44) b.x = clamp(b.x + Math.sign(dx) * .75, A.x0 + 18, A.x1 - 48);
      if (b.st < 26) return;
      if (want === 'stab' && Math.abs(dx) < 60) return set(b, 'windup');
      if (want === 'fan' && b.st > 40) return set(b, 'fanWind');
      if (want === 'gust' && b.st > 40) return set(b, Math.abs(dx) > 50 ? 'gustWind' : 'windup');
      if (b.st > 160) set(b, Math.abs(dx) > 80 ? 'gustWind' : 'windup');
    },
    // The stab: she rears back (a "!" and a glint on the beak) and strikes where Nila stands.
    windup(b) {
      if (b.st === 1) { b.sdir = b.dir; Sound.play('charge'); }
      if (b.st >= 30) { b.hurtNila = false; set(b, 'stab'); Sound.play('stab', null, { x: b.x + 15 }); }
    },
    stab(b, A) {
      b.dir = b.sdir;
      if (b.st <= 8) b.x = clamp(b.x + b.sdir * 2, A.x0 + 4, A.x1 - 34);
      const P = Player;
      if (b.st >= 2 && b.st <= 12 && P.inv === 0 && !P.dead && !P.win && overlap(stabZone(b, A), P.rect())) { P.hurt(-b.sdir); b.hurtNila = true; }
      if (b.st === 9) { const k = beak(b, A); Cam.shake(2, 6); Sound.play('squelch', null, { x: b.x + 15 }); spawnParts(10, k.x, k.y, { color: ['#6a5a4a', '#8a7058', '#c9b08a'], angle: -Math.PI / 2, spread: 1.2, speed: [.8, 2.4], life: [12, 22], g: .15 }); }
      if (b.st >= 12) set(b, b.hurtNila ? 'pull' : 'stuck');
    },
    pull(b) { if (b.st >= 24) { b.pat++; set(b, 'walk'); } },
    // The beak is in the mud: the window. Longer in phase II, shorter when she is furious.
    stuck(b, A) {
      b.air = false; const n = b.phase === 2 ? 110 : 80, k = beak(b, A);
      if (b.st === 1) { Game.word('¡ATASCADA!', b.x + 15, b.y - 10, '#fff6d6', true); Sound.play('squelch', null, { x: b.x + 15 }); }
      if (b.st % 7 === 0) spawnParts(2, k.x, k.y, { color: ['#6a5a4a', '#8a7058'], angle: -Math.PI / 2 - b.dir * .4, spread: .6, speed: [.6, 1.6], life: [10, 18], g: .15 });
      if (b.st >= n) set(b, 'yank');
    },
    // She pulls the beak free with a spray of mud; the stab loosens a stone (ammo for the next window).
    yank(b, A) {
      if (b.st === 1) {
        const k = beak(b, A); Sound.play('squelch', null, { x: b.x + 15 }); spawnParts(14, k.x, k.y, { color: ['#6a5a4a', '#8a7058', '#c9b08a'], angle: -Math.PI / 2, spread: 1.4, speed: [1, 3], life: [14, 26], g: .15 });
        if (rocks() < 2) { const r = Item.rock(clamp(k.x - 6, A.lo, A.hi - 12), A.floor - 14); r.vy = -3.2; r.vx = -b.dir * 1.4; L.ents.push(r); Game.word('¡CLOC!', k.x, k.y - 12, '#c9b08a', false); }
      }
      if (b.st >= 18) {
        if (b.phase === 2) { b.pat++; set(b, 'walk'); }
        else { b.riseTo = HOVER_Y; b.after = 'hover'; set(b, 'rise'); }
      }
    },
    // The wing gust: wings up and the leaves rush to her (the warning), then a gale that pushes Nila to the brambles.
    // A puff against it breaks it and she loses her balance.
    gustWind(b, A, px) {
      if (b.st === 1) { b.gdir = px >= b.x + 15 ? 1 : -1; Sound.play('inhale'); Game.word('¡FFF...!', b.x + 15, b.y - 10, '#dff2fb', false);
        if (!L.bossGustHint) { L.bossGustHint = true; Game.toast(Game.signText(null, '¡Sopla con {puff} contra su viento!'), 170); } }
      if (b.st % 2 === 0) { const d = rnd(30, 90); L.parts.push({ x: b.x + 15 + b.gdir * d, y: A.floor - rnd(2, 40), vx: -b.gdir * 2.2, vy: 0, life: Math.round(d / 2.2), color: ['#7fb040', '#a3cf52', '#c9b08a'][(Math.random() * 3) | 0], size: 1, g: 0, kind: 'leaf', ph: 0 }); }
      if (b.st > 12 && countered(b, px)) return clash(b);
      if (b.st >= 40) { set(b, 'gust'); Sound.play('gustWind'); }
    },
    gust(b, A, px) {
      const P = Player;
      if (countered(b, px)) return clash(b);
      if (b.st > 4 && !P.dead && !P.win) {
        let push = P.onGround ? 1.6 : 2; if (P.crouch) push *= .5; if (shelter(b, P)) push = 0;
        if (push) { moveX(P, b.gdir * push); if (Math.sign(P.vx) === -b.gdir) P.vx *= .9; }
      }
      for (let i = 0; i < 2; i++) L.parts.push({ x: b.x + 15 + b.gdir * rnd(10, 30), y: A.floor - rnd(2, 44), vx: b.gdir * rnd(3, 5.5), vy: rnd(-.3, .3), life: rnd(20, 40) | 0, max: 30, color: ['#f2fbff', '#dff2fb', '#a8d4ea'][i], size: 1, g: 0, kind: 'mist' });
      if (b.st % 3 === 0) spawnParts(1, b.x + 15 + b.gdir * rnd(20, 120), A.floor - 1, { color: ['#7fb040', '#c9b08a'], angle: b.gdir > 0 ? -.3 : Math.PI + .3, spread: .3, speed: [2, 4], life: [16, 30], g: .02, kind: 'leaf' });
      if (b.st % 24 === 1) Sound.play('gust');
      if (b.st >= 120) { b.pat++; set(b, 'walk'); }
    },
    // Countered: off balance, dizzy, open.
    stagger(b, A) {
      b.air = false; if (b.st < 14) b.x = clamp(b.x - b.gdir * 1.2, A.x0 + 4, A.x1 - 34);
      if (b.st % 9 === 0) feathers(b.x + 15, b.y + 10, 1);
      if (b.st >= 140) { b.pat++; set(b, 'walk'); }
    },
    // A volley of feather darts: she puffs up (bristling), red marks show where each will land, then she lobs them.
    fanWind(b, A) {
      if (b.st === 1) Sound.play('ruffle');
      if (b.st % 4 === 0) feathers(b.x + 15 + rnd(-8, 8), b.y + 12, 1);
      if (b.st === 10) b.aims = fanAims(b, A, false);
      if (b.st >= 40) { fire(b); set(b, 'fanPost'); }
    },
    fanPost(b) { if (b.st >= 40) { b.pat++; set(b, 'walk'); } },
    // Hit while stuck or dizzy: she stumbles back.
    reel2(b, A) { b.air = false; if (b.st < 16) b.x = clamp(b.x - b.dir * 1.6, A.x0 + 4, A.x1 - 34); if (b.st % 6 === 0) feathers(b.x + 15, b.y + 10, 1); if (b.st >= 34) { b.pat++; set(b, 'walk'); } },
    // ---- Transitions
    // I → II: a scream, back to the nest, two stamps and the nest gives way; branches, stones and a crate come down with her.
    trans1(b, A, px) {
      const pc = A.perch;
      if (b.st === 1) { L.bossCk = 2; b.air = true; shriek(b, true); Game.stop(12); b.card = null; }
      if (b.st < 60) { b.x = lerp(b.x, pc.x - 15, .08); b.y = lerp(b.y, pc.y - 30, .08); face(b, px); if (b.st > 50) b.air = false; }
      if (b.st === 60 || b.st === 78) { Cam.shake(5, 16); Sound.play('rumble'); Game.word('¡PUM!', pc.x, pc.y - 4, '#f2c46a', true); spawnParts(8, pc.x + rnd(-40, 40), pc.y, { color: ['#4a2e1a', '#6b4a30', '#c78d4e'], speed: [.4, 1.5], life: [20, 40], g: .12 }); }
      if (b.st === 92) {
        for (let x = A.c0 + 9; x <= A.c0 + 14; x++) { setTile(x, 4, '.'); spawnParts(5, x * TS + 8, pc.y + 4, { color: ['#4a2e1a', '#6b4a30', '#c78d4e', '#8a6a3a'], angle: Math.PI / 2, spread: 1.2, speed: [.5, 2], life: [30, 50], g: .15, bounce: .3 }); }
        Sound.play('crack'); Game.word('¡CRAC!', pc.x, pc.y - 6, '#d0d6da', true); Cam.shake(6, 24); Sound.playMusic(SONGS[1]);
        for (const [dx, kind] of [[-50, 'rock'], [40, 'rock'], [74, 'crate']]) { const e = kind === 'rock' ? Item.rock(pc.x + dx, pc.y + 4) : Item.crate(pc.x + dx, pc.y + 4); e.vx = Math.sign(dx) * .6; if (kind === 'crate') e.ghost = true; L.ents.push(e); }
        b.card = { title: 'II · El barro', sub: 'si se le clava el pico, ¡dale!', t: 0, life: 170 };
        b.air = true; b.vy = -2;
      }
      if (b.st > 92) {
        if (b.y + 30 < A.floor) { b.vy = Math.min(b.vy + .3, 6); b.y += b.vy; b.x = lerp(b.x, A.mid + 40 - 15, .05); if (b.y + 30 >= A.floor) { b.y = A.floor - 30; b.air = false; Cam.shake(4, 12); Sound.play('thud'); dust(b.x + 15, A.floor, 16, 1.8); } }
        face(b, px);
      }
      if (b.st === 110) for (let x = A.c0 + 10; x <= A.c0 + 13; x++) { setTile(x, 9, '='); spawnParts(4, x * TS + 8, 9 * TS, { color: ['#4a2e1a', '#c78d4e'], angle: -Math.PI / 2, spread: 1.2, speed: [.4, 1.2], life: [10, 20] }); }
      if (b.st >= 140 && !b.air) { b.phase = 2; b.pat = 0; set(b, 'walk'); }
    },
    // II → III: up to the middle, red eyes, and the water rises at both ends of the arena (bubbles warn first).
    trans2(b, A, px) {
      if (b.st === 1) { L.bossCk = 3; b.air = true; shriek(b, true); Game.stop(14); Cam.shake(5, 40); b.card = null; Game.toast('¡Sube el agua!', 110); }
      b.air = true; b.x = lerp(b.x, A.mid - 15, .05); b.y = lerp(b.y, 70, .05); face(b, px);
      if (b.st < 70 && b.st % 3 === 0) for (const x of WET_COLS(A)) if (Math.random() < .3) spawnParts(1, x * TS + rnd(2, 14), A.floor + 2, { color: ['#8fd9d0', '#c8f2ea'], angle: -Math.PI / 2, spread: .4, speed: [.4, 1.2], life: [10, 20], g: .05 });
      if (b.st === 40) { b.rage = 1; b.redT = 24; Game.word('¡FURIA!', b.x + 15, b.y - 12, '#ff5a3a', true); Sound.play('shriek', 1, { x: b.x + 15 }); Cam.punch(1.06); }
      if (b.st === 70) flood(A);
      if (b.st >= 120) { b.phase = 3; b.pat = 0; set(b, 'hover'); }
    },
    // The last blow: slow motion, white flash, every cría left comes out at once; she tumbles down.
    final(b, A) {
      b.air = true; b.vy = Math.min(b.vy + .12, 3); b.y += b.vy; b.x = clamp(b.x - b.dir * .5, A.x0, A.x1 - 30);
      if (b.st % 4 === 0) feathers(b.x + 15, b.y + 12, 2);
      if (b.y + 30 >= A.floor) { b.y = A.floor - 30; b.air = false; Cam.shake(4, 16); Sound.play('thud'); dust(b.x + 15, A.floor, 18, 1.8); set(b, 'dying'); }
    },
    dying(b) {
      b.air = false; if (b.st % 6 === 0) feathers(b.x + rnd(0, b.w), b.y + rnd(0, b.h), 3);
      if (b.st > 90) { set(b, 'leave'); Sound.play('heron'); }
    },
    leave(b) { b.air = true; b.y -= 1.6 + b.st * .04; b.x += -b.dir * 1.2; if (b.st > 120) { b.dead = true; won(); } }
  };

  function dodge(b, A) {
    if (b.dodge > 0) { b.dodge--; const nx = clamp(b.x + b.dodgeDir * 3.2, A.x0 + 10, A.x1 - 40); if (b.hx) b.hx += nx - b.x; b.x = nx; return; }
    if (b.dodgeCd > 0) { b.dodgeCd--; return; }
    for (const p of L.projs) {
      if (p.dead || p.kind === 'agua') continue;
      const dx = b.x + 15 - (p.x + p.w / 2), dy = b.y + 14 - (p.y + p.h / 2);
      if (Math.hypot(dx, dy) > 74 || dx * p.vx + dy * p.vy <= 0) continue;
      let d = Math.sign(dx) || 1; if ((d > 0 && b.x + 60 > A.x1) || (d < 0 && b.x - 30 < A.x0)) d = -d;
      b.dodge = 14; b.dodgeDir = d; b.dodgeCd = 40; Sound.play('flap', null, { x: b.x + 15 }); feathers(b.x + 15, b.y + 14, 4); Game.word('¡FUP!', b.x + 15, b.y - 8, '#dff2fb', false);
      if (!L.bossDodgeHint) { L.bossDodgeHint = true; Game.toast('¡Lo esquiva! Dale cuando se lance', 150); }
      return;
    }
  }
  function nextAir(b) {
    if (b.phase === 1) { b.pat++; b.dive = 1; set(b, 'aim'); return; }
    const s = P3[b.pat++ % P3.length];
    if (s === 'dive') { b.dive = 1; set(b, 'aim'); } else if (s === 'rain') set(b, 'rainUp'); else set(b, 'fanAir');
  }
  function stabZone(b, A) { return b.sdir < 0 ? { x: b.x - 30, y: A.floor - 24, w: 36, h: 24 } : { x: b.x + 24, y: A.floor - 24, w: 36, h: 24 }; }
  // A crate between her and Nila takes the wind.
  function shelter(b, P) { const cx = b.x + 15, px = P.x + 5; return L.ents.some(e => !e.dead && e.kind === 'crate' && e.resting && (e.x + 7 - cx) * (px - (e.x + 7)) > 0 && Math.abs(px - (e.x + 7)) < 30 && e.y < P.y + P.h && e.y + e.h > P.y + 4); }
  function countered(b, px) {
    const toward = b.x + 15 > px ? 1 : -1;
    for (const q of L.gusts || []) if (!q.vsHeron && q.dir === toward && q.t < 6) { q.vsHeron = true; return true; }
    return false;
  }
  function clash(b) {
    const mx = (b.x + 15 + Player.x + 5) / 2, my = Player.y + 10;
    Game.word('¡CONTRA!', b.x + 15, b.y - 12, '#dff2fb', true); Sound.play('pop'); Sound.play('heronHit', null, { x: b.x + 15 }); Cam.shake(3, 12); Cam.punch(1.04); Game.stop(4);
    for (let i = 0; i < 16; i++) L.parts.push({ x: mx, y: my + rnd(-8, 8), vx: rnd(-2.5, 2.5), vy: rnd(-1.5, 1), life: rnd(14, 26) | 0, max: 26, color: '#f2fbff', size: 1, g: 0, kind: 'mist' });
    feathers(b.x + 15, b.y + 10, 10); Game.word('¡LE FALLAN LAS PATAS!', b.x + 15, b.y - 22, '#f2c46a', false);
    set(b, 'stagger');
  }
  // Where the darts will land: on Nila and every 44 px around her, never on the heron herself or in the water.
  // Each dart is lobbed to land on its mark after T frames, so the marks are all the player needs to read.
  const PLUME_G = .12;
  function fanAims(b, A, air) {
    const P = Player, ox = b.dir < 0 ? b.x + 2 : b.x + 28, oy = b.y + 5, px = clamp(P.x + 5, A.lo, A.hi), T = air ? 46 : 58;
    return [-88, -44, 0, 44, 88].map(o => px + o).filter(x => x > A.lo - 4 && x < A.hi + 4 && (air || Math.abs(x - (b.x + 15)) > 26))
      .map(sx => ({ x: ox, y: oy, sx, T, vx: (sx - ox) / T, vy: (A.floor - 2 - oy - .5 * PLUME_G * T * T) / T }));
  }
  function fire(b) {
    for (const q of b.aims || []) L.ents.push(plume(q.x, q.y, q.vx, q.vy, q.sx));
    b.aims = null; Sound.play('feathers', null, { x: b.x + 15 }); feathers(b.x + 15, b.y + 10, 6); Cam.shake(1, 4);
  }
  function flood(A) {
    for (const x of WET_COLS(A)) { setTile(x, L.h - 4, '.'); setTile(x, L.h - 3, '~'); setTile(x, L.h - 2, '~'); spawnParts(6, x * TS + 8, A.floor, { color: ['#8fd9d0', '#c8f2ea', '#2f7f88'], angle: -Math.PI / 2, spread: .8, speed: [1, 3.2], life: [14, 30] }); }
    Sound.play('splash'); Sound.play('rumble'); Cam.shake(4, 20);
    // Nila is never left standing where the water comes up: the wave sets her on the dry middle.
    const P = Player, B = arena(3), safe = clamp(P.x, B.lo, B.hi - P.w);
    if (safe !== P.x && P.onGround) { P.x = safe; P.vx = 0; Game.word('¡UF!', P.x + 5, P.y - 8, '#8fd9d0', false); }
    P.lastSafe = { x: clamp(P.lastSafe ? P.lastSafe.x : P.x, B.lo, B.hi - P.w), y: A.floor - P.h };
  }
  function dropRock(b) {
    if (rocks() >= 3) return;
    const r = Item.rock(b.x + b.w / 2 - 6, b.y + b.h); r.vy = 1; L.ents.push(r); Sound.play('puff'); feathers(b.x + 15, b.y + b.h, 4);
  }
  // A rock falling from the nest: a shadow grows under it, it hurts on the way down and is ammo once it lands.
  function rainRock(x) {
    const r = Item.rock(x - 6, Math.min(Cam.y, 24) - 24); r.hazard = true; r.update = rainUpdate; L.ents.push(r); Sound.play('whistle');
  }
  function rainUpdate(e) {
    Item.fallUpdate(e); if (e.dead) return;
    if (e.resting) { e.hazard = false; e.update = Item.fallUpdate; Cam.shake(2, 6); if (rocks() > 5) { e.dead = true; spawnParts(8, e.x + 6, e.y + 5, { color: ['#a6abb8', '#7d8290', '#4f545a'], speed: [.8, 2.4], life: [14, 26], g: .15, bounce: .3 }); Sound.play('crack'); } return; }
    if (e.vy > 1.5 && Player.inv === 0 && !Player.dead && !Player.win && overlap(e, Player.rect())) Player.hurt(Player.x + 5 < e.x + 6 ? 1 : -1);
  }
  // A feather dart: arcs to its mark, hurts on the way, sticks in the mud and fades.
  function plume(x, y, vx, vy, sx) { return { kind: 'plume', x: x - 3, y: y - 2, w: 6, h: 4, vx, vy, sx, t: 0, stuck: 0, update: plumeUpdate, draw: plumeDraw }; }
  function plumeUpdate(e) {
    e.t++;
    if (e.stuck) { if (--e.stuck <= 0) e.dead = true; return; }
    e.vy += PLUME_G; e.x += e.vx; e.y += e.vy; const cx = e.x + 3, cy = e.y + 2;
    if (e.vy > 0 && (rectSolid(cx - 1, cy - 1, 2, 2) || waterAt(cx, cy))) { e.stuck = 60; Sound.play('step'); spawnParts(3, cx, cy, { color: ['#c9b08a', '#e9eef2'], speed: [.3, 1], life: [8, 14], g: .08 }); return; }
    if (e.t % 3 === 0) L.parts.push({ x: cx - e.vx, y: cy - e.vy, vx: 0, vy: 0, life: 8, max: 8, color: '#e9eef2', size: 1, g: 0, kind: 'mist' });
    const P = Player; if (P.inv === 0 && !P.dead && !P.win && overlap(e, P.rect())) { P.hurt(e.vx > 0 ? -1 : 1); e.dead = true; feathers(cx, cy, 4); }
    if (e.x < -20 || e.x > L.w * TS + 20 || e.y > L.h * TS + 20 || e.y < -80) e.dead = true;
  }
  function plumeDraw(e, g) {
    const sp = Math.hypot(e.vx, e.vy) || 1, ux = e.vx / sp, uy = e.vy / sp, x = e.x + 3 - Cam.x, y = e.y + 2 - Cam.y, a = e.stuck ? Math.min(1, e.stuck / 20) : 1;
    g.globalAlpha = a;
    for (let i = -3; i <= 4; i++) {
      const X = Math.round(x + ux * i), Y = Math.round(y + uy * i);
      g.fillStyle = i >= 3 ? '#3a3d56' : '#f2efe8'; g.fillRect(X, Y, 1, 1);
      if (i > -3 && i < 3) { g.fillStyle = i < 0 ? '#a9b8c9' : '#c9d4e0'; g.fillRect(Math.round(X - uy), Math.round(Y + ux), 1, 1); if (i < 1) g.fillRect(Math.round(X + uy), Math.round(Y - ux), 1, 1); }
    }
    g.globalAlpha = 1;
  }
  function free(b, n) {
    for (let k = 0; k < n && L.bossFreed < CRIAS; k++) {
      L.bossFreed++; L.pearls++; Game.pearlPop = 12;
      L.parts.push({ x: b.x + (b.dir < 0 ? 0 : b.w - 6), y: b.y + 8, vx: (b.dir < 0 ? -1 : 1) * rnd(.8, 1.6) + k * .3, vy: -rnd(2, 3), life: 70, color: '#fff', size: 1, g: .1, kind: 'cria' });
    }
  }
  function finale(b) {
    set(b, 'final'); b.vy = -1.5; b.whiteT = 22; b.card = null; L.bossSlow = 96; Game.stop(24); Cam.shake(7, 50); Cam.punch(1.14); Input.rumble(600, 1, 1);
    Sound.play('bossDown'); Sound.stopMusic(); Sound.duck(true);
    const rest = CRIAS - L.bossFreed;
    for (let k = 0; k < rest; k++) { L.bossFreed++; L.pearls++; L.parts.push({ x: b.x + 12, y: b.y + 8, vx: (k - (rest - 1) / 2) * .55, vy: -rnd(3, 4.6), life: 110, color: '#fff', size: 1, g: .1, kind: 'cria' }); }
    Game.pearlPop = 12; feathers(b.x + 15, b.y + 12, 30);
    Game.word('¡LAS CRÍAS!', b.x + 15, b.y - 16, '#e8fbff', true);
  }
  function hit(b, p, dmg = 1) {
    if (!b.fight || b.dead) return false;
    const cx = b.x + 15;
    if (PARRY[b.state] && b.inv === 0) {
      Sound.play('clang', null, { x: b.x + 15 }); Game.word('¡TOC!', cx, b.y - 6, '#cfd6e0', false); spawnParts(5, cx - b.dir * -10, b.y + 12, { color: ['#fff6d6', '#a9b8c9'], speed: [.5, 1.8], life: [6, 12], g: .1 });
      if (!b.parryHint) { b.parryHint = true; Game.toast('Lo para con el ala: espera a que falle', 140); }
      return true;
    }
    if (!VULN[b.state] || b.inv > 0) return false;
    b.rain = null; b.aims = null;
    const floorHp = PHASE_HP[b.phase] || 0, before = b.hp; b.hp = Math.max(floorHp, b.hp - dmg);
    b.flash = 14; b.inv = 40; Cam.punch(dmg > 1 ? 1.08 : 1.04); Input.rumble(220, 1, .5); Sound.play('heronHit', null, { x: b.x + 15 }); Cam.shake(5, 14); Game.stop(dmg > 1 ? 9 : 6);
    Game.word(dmg > 1 ? '¡ZAS!' : '¡PAF!', cx, b.y - 6, '#fff6d6', true); feathers(cx, b.y + 14, 14);
    free(b, before - b.hp); Game.word('¡PLOP!', cx, b.y + b.h + 4, '#e8fbff', false);
    if (b.hp <= 0) finale(b);
    else if (b.hp === floorHp) set(b, b.phase === 1 ? 'trans1' : 'trans2');
    else set(b, b.air ? 'reel' : 'reel2');
    return true;
  }
  function vulnerable(b) { return !!(b.fight && !b.dead && VULN[b.state] && b.inv === 0); }

  // ---------------------------------------------------------------- Actualizar
  function update(b) { tick(b); if (!b.dead && b.state !== 'wait') anim(b); }
  function tick(b) {
    b.t++; b.st++; if (b.flash > 0) b.flash--; if (b.inv > 0) b.inv--; if (b.shriek > 0) b.shriek--; if (b.whiteT > 0) b.whiteT--; if (b.redT > 0) b.redT--;
    if (b.card) { b.card.t++; if (b.card.t > b.card.life) b.card = null; }
    const A = arena(b.phase), P = Player, px = P.x + 5;
    if (DODGE[b.state] && b.inv === 0 && !(b.phase === 1 && b.hp === MAX_HP)) dodge(b, A);
    S[b.state](b, A, px, P);
    if (b.dead || b.state === 'wait') return;
    // A belly flop onto her while she is open counts as a blow.
    const body = { x: b.x + 3, y: b.y + 4, w: b.w - 6, h: b.h - 6 };
    if (P.pound && P.vy > 2 && vulnerable(b) && overlap(body, P.rect())) {
      hit(b, null, 1); P.pound = false; P.vy = -6.5; P.jumpCut = false; P.onGround = false; P.airJumps = 1; P.sx = 1.4; P.sy = .7;
      Game.word('¡PLAF!', P.x + 5, P.y - 8, '#fff6d6', true); Sound.play('crack'); return;
    }
    // Contact hurts, except in the first moments after she recovers (Nila may still be standing next to her).
    if (HARM[b.state] && !(b.state === 'walk' && b.st < 16) && P.inv === 0 && !P.dead && !P.win && overlap(body, P.rect())) P.hurt(px < b.x + 15 ? 1 : -1);
  }

  // ---------------------------------------------------------------- Dibujo
  // A shadow on every surface under x: planks and the floor (the water too).
  function shadow(g, x, rx, alpha, warn) {
    const tx = Math.floor(x) >> 4;
    for (let ty = 5; ty < L.h; ty++) {
      const ch = tileAt(tx, ty); if (ch !== '=' && ch !== '~' && !solidChar(ch)) continue;
      const sx = Math.round(x - Cam.x), sy = ty * TS - Cam.y + 1;
      g.globalAlpha = alpha; g.fillStyle = '#120a14'; g.beginPath(); g.ellipse(sx, sy, rx, Math.max(2, rx * .28), 0, 0, Math.PI * 2); g.fill();
      if (rx > 8) { g.globalAlpha = alpha * .8; g.beginPath(); g.ellipse(sx, sy, rx * .55, Math.max(1.5, rx * .16), 0, 0, Math.PI * 2); g.fill(); }
      if (warn) { g.globalAlpha = .95; g.strokeStyle = warn; g.beginPath(); g.ellipse(sx, sy, rx + 2, Math.max(2.5, rx * .32), 0, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1; if (ch !== '=') break;
    }
  }
  // Her nest on the perch: a bowl of sticks over the planks, until it breaks in phase II.
  let twigs = null;
  function drawNest(g, A) {
    if (tileAt(A.c0 + 9, 4) !== '=') return;
    if (!twigs) { twigs = []; let r = 7; const rn = () => (r = (r * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 70; i++) { const u = rn(), x = -48 + u * 96, d = Math.abs(x) / 48, y = -5 + d * d * 6 + rn() * 9, a = (rn() - .5) * .9, len = 6 + rn() * 12; twigs.push([x, y, a, len, rn() < .3]); } }
    const cx = A.perch.x - Cam.x, cy = A.perch.y - Cam.y;
    g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(cx, cy + 4, 50, 8, 0, 0, Math.PI); g.fill(); g.fillRect(cx - 50, cy - 1, 100, 5);
    for (const [x, y, a, len, light] of twigs) { g.fillStyle = light ? '#8a6a3a' : '#4a2e1a'; for (let k = 0; k < len; k++) g.fillRect(Math.round(cx + x + Math.cos(a) * (k - len / 2)), Math.round(cy + y + Math.sin(a) * (k - len / 2)), 1, 1); }
    g.fillStyle = '#c78d4e'; for (let x = -46; x < 46; x += 3) g.fillRect(Math.round(cx + x), Math.round(cy - 3 + (x * x) / 900), 2, 1);
  }
  function drawShadows(b, g, A) {
    if (b.state === 'lock' || b.state === 'plunge') {
      const n = b.phase === 1 ? 34 : 26, k = b.state === 'lock' ? Math.min(1, .45 + .55 * b.st / n) : 1, blink = (b.st >> 2) % 2 === 0;
      shadow(g, b.tx, 18 * k, .6, blink ? '#ff5a3a' : '#ffb070');
      // The line of the dive, dashes running down from her to the mark.
      if (b.state === 'lock') { const sx = Math.round(b.tx - Cam.x); for (let yy = b.y + 30; yy < A.floor - 4; yy += 6) { const ph = (yy - b.y + b.st * 2) % 12; if (ph < 6) continue; g.globalAlpha = .45; g.fillStyle = '#ff7a4a'; g.fillRect(sx, Math.round(yy - Cam.y), 1, 3); } g.globalAlpha = 1; }
    } else if (b.state === 'aim') shadow(g, b.x + 15, 10, .25, null);
    else if (b.air && !['wait', 'intro', 'leave'].includes(b.state) && b.y + 30 < A.floor - 8) shadow(g, b.x + 15, 8, .18, null);
    for (const e of L.ents) if (!e.dead && e.hazard) {
      const h = A.floor - (e.y + e.h), k = clamp(1 - h / 190, .25, 1);
      shadow(g, e.x + 6, 4 + 7 * k, .3 + .35 * k, (Game.t >> 2) % 2 ? '#ff5a3a' : null);
    }
  }
  // ---------------------------------------------------------------- La garza, articulada
  // She is a puppet, not a sprite: every frame pose() turns her state into joints (body tilt and squash,
  // where the head is, how the neck curls, the beak's gape, the eye, wing spread and beat, the feet) and
  // figure() paints them pixel by pixel into a small canvas facing right, then stamps an ink outline round it.
  // Her own frame: x forward, y down, origin in the middle of the body when she stands (b.x + 15, b.y + 13).
  const FL = 17, RW = 176, RH = 136, AX = 88, AY = 76;
  const HC = { G: '#8196b0', g: '#5a6488', L: '#b9c9da', W: '#f2efe8', w: '#c9c3cc', k: '#3a3d56', K: '#2a2638', Y: '#f0c444', y: '#b8782a', d: '#7a4e22',
    E: '#ffd23a', e: '#1d1a26', R: '#ff3a2a', r: '#ffe0b0', m: '#6a5a4a', M: '#8a7058', t: '#8a2a3a' };
  const INK = '#23202e', RAGE_INK = '#3e1426';
  const k01 = k => k < 0 ? 0 : k > 1 ? 1 : k, eo = k => 1 - Math.pow(1 - k01(k), 3), io = k => { k = k01(k); return k * k * (3 - 2 * k); };
  // A spring settling from 0 to 1, with an overshoot.
  const spr = k => k >= 1 ? 1 : 1 - Math.exp(-k * 5) * Math.cos(k * 9);
  const AN0 = { fl: 0, wk: 0, mv: 0, lt: 99, vx: 0, vy: 0, trail: [] };
  const facing = (b, P) => P.flip ? -b.dir : b.dir;

  // ---- Poses
  function pose(b) {
    const st = b.state, s = b.st, t = b.t, an = b.an || AN0, rg = b.rage ? 1 : 0, ph = b.phase;
    const br = Math.sin(t / 22);
    const P = { bx: 0, by: br * .6, ba: -.3, sx: 1, sy: 1 + br * .03, hx: 9, hy: -15, ha: 0, curl: .6, gape: 0, eye: 1, look: 1, pl: 0,
      wo: 0, wf: 0, wl: 0, sw: 0, fs: 0, f1x: 4, f1y: FL, f2x: 0, f2y: FL, tuck: 0, tail: 0, fan: 0, puff: rg * .35, crest: rg * .6, clip: 0, flip: 0, rot: 0, mud: 0, spd: 0, jx: 0 };
    const fly = (sp, bob = 1.2) => { P.ba = .06; P.hx = 12; P.hy = -8; P.curl = 1; P.wo = 1; P.wf = Math.sin(an.fl); P.wl = Math.cos(an.fl); P.fs = sp; P.by = -P.wf * bob; P.sy = 1 + P.wl * .03; P.f1x = -24; P.f1y = 4; P.f2x = -23; P.f2y = 6; P.tuck = 1; P.tail = .1; };
    const dangle = (k, sway = 1) => { P.f1x = lerp(P.f1x, -3 + Math.sin(t / 9) * sway, k); P.f1y = lerp(P.f1y, 15, k); P.f2x = lerp(P.f2x, -6 + Math.sin(t / 9 + 1) * sway, k); P.f2y = lerp(P.f2y, 14, k); P.tuck = 1 - k; };
    const stab = k => { P.hx = lerp(1, 15.5, k); P.hy = lerp(-14, 7, k); P.ha = lerp(.35, .72, k); P.curl = lerp(1.5, -.35, k); P.ba = lerp(-.6, .38, k); P.bx = lerp(-2, 3, k); P.f1x = 10; P.f2x = -8; P.tail = -.5 * k; P.clip = 1; P.look = 0; };
    switch (st) {
      case 'intro':
        if (s < 100) {
          fly(s < 36 ? .2 : .22);
          if (s > 80) { const k = io((s - 80) / 20); P.wf = lerp(P.wf, -.95, k); P.fs = .22 * (1 - k); P.ba = lerp(P.ba, -.45, k); P.hy -= 5 * k; P.f1x = lerp(P.f1x, 7, k); P.f1y = lerp(P.f1y, 14, k); P.f2x = lerp(P.f2x, 4, k); P.f2y = lerp(P.f2y, 15, k); P.tuck = 1 - k; }
        } else {
          const k = (s - 100) / 14;
          if (k < 1) { const q = Math.exp(-k * 3) * Math.cos(k * 7); P.by += 4 * Math.max(0, q); P.sy -= .2 * q; P.sx += .14 * q; P.wo = 1 - io(k); P.wf = .3; P.wl = -1; }
        }
        break;
      case 'return': fly(.24); break;
      case 'hover': {
        fly(ph === 3 ? .3 : .2);
        // Now and then a glide on still wings; the feet reach down as she lets go of a stone.
        if (ph !== 3 && s % 110 > 70) { P.fs = .06; }
        if (ph === 1) for (const d of [30, 100]) if (s > d - 10 && s < d + 6) { const k = Math.sin((s - d + 10) / 16 * Math.PI); P.f1x = lerp(P.f1x, 0, k); P.f1y = lerp(P.f1y, 15, k); P.f2x = lerp(P.f2x, -2, k); P.f2y = lerp(P.f2y, 15, k); P.tuck = 1 - k; P.hy += 3 * k; P.ha += .5 * k; }
        break;
      }
      case 'aim': fly(.32, 1.6); P.hx = 13; P.hy = -3; P.ha = .8; P.curl = .8; P.look = .5; P.crest = Math.max(P.crest, .6); break;
      case 'lock': {
        const k = eo(s / 12); fly(.02);
        P.wf = lerp(Math.sin(an.fl), -1, k) + Math.sin(s * 2.1) * .05; P.wl = 0; P.sw = .5 * k; P.ba = .2 * k; P.hx = 12 - 3 * k; P.hy = -8 - 4 * k; P.curl = 1 + .5 * k; P.ha = .7 + .5 * k; P.look = 0;
        P.crest = 1; P.puff = Math.max(P.puff, .5 * k); P.sy = 1 - .1 * k; P.sx = 1 + .07 * k; P.f1x = -15; P.f1y = 1; P.f2x = -14; P.f2y = 3; P.eye = s > 10 && (s >> 1) % 2 ? 3 : 1; P.jx = Math.sin(s * 1.9) * (s > 14 ? 1 : 0);
        break;
      }
      case 'plunge': {
        P.wo = .6; P.wf = -.95; P.sw = 1.2; P.ba = 1.3; P.sx = 1.2; P.sy = .82; P.hx = 5; P.hy = 11; P.ha = 1.5; P.curl = -.3; P.crest = 1; P.look = 0; P.spd = 1;
        P.f1x = -12; P.f1y = -8; P.f2x = -10; P.f2y = -10; P.tuck = 1; P.tail = -.4;
        break;
      }
      case 'land': {
        const n = ph === 1 ? 30 : 10, q = Math.exp(-s / 4) * Math.cos(s * .8), r = spr(s / 16);
        P.by += 5 * Math.max(0, q) + 2 * Math.exp(-s / 6); P.sy -= .22 * q; P.sx += .16 * q;
        P.wo = Math.max(0, 1 - s / 14); P.wf = .55; P.wl = -1; P.sw = -.2;
        P.hx = lerp(14, 9, r); P.hy = lerp(6, -15, r); P.ha = lerp(1.2, 0, r); P.curl = lerp(-.2, .6, r); P.look = r;
        P.f1x = 7; P.f2x = -4;
        // Phase I: a dazed shake of the head; then a crouch before taking off.
        if (ph === 1 && s > 12 && s < 26) { P.ha += Math.sin(s * 1.3) * .3; P.hx += Math.sin(s * 1.3) * 1.5; P.eye = 0; }
        if (s > n - 7) { const k = io((s - n + 7) / 7); P.by += 3 * k; P.sy -= .08 * k; P.wo = Math.max(P.wo, .8 * k); P.wf = lerp(P.wf, -.8, k); P.ba -= .1 * k; }
        break;
      }
      case 'rise': {
        fly(ph === 3 ? .42 : .36, 2); P.sy += .08; P.ba = -.12; const k = io(s / 26); dangle(1 - k, .5); P.hy -= 2;
        break;
      }
      case 'reel': {
        fly(.5, 1.5); const k = s / 40;
        P.rot = Math.sin(s * .32) * .9 * (1 - k); P.eye = s < 26 ? -1 : 1; P.gape = s < 22 ? .9 : 0; P.hx = 5 + 7 * io(k); P.hy = -14 + 6 * io(k); P.ha = -.4 + .4 * io(k); P.curl = .2 + .8 * k; P.crest = 1; P.look = k;
        P.wf = Math.sin(an.fl) * (1 - k * .3); dangle(1 - k, 3); P.puff = Math.max(P.puff, .8 * (1 - k));
        break;
      }
      case 'rainUp': {
        fly(.34, 1.5);
        if (s > 16 && s < 44) { const k = Math.sin((s - 16) / 28 * Math.PI); P.gape = Math.min(1, k * 1.5); P.ha = -.6 * k; P.hy -= 5 * k; P.hx += 2 * k; P.crest = 1; P.curl = 1 - .7 * k; P.look = 1 - k; }
        if (s >= 30 && s < 96) { const u = (s - 30) % 12; if (u < 5) { const k = Math.sin(u / 5 * Math.PI); P.ha += .45 * k; P.hy += 2 * k; } }
        break;
      }
      case 'fanAir': {
        fly(s < 40 ? .1 : .3); const k = eo(s / 12);
        if (s < 40) { P.wf = lerp(P.wf, -.75 + Math.sin(t * 1.7) * .08, k); P.puff = Math.max(P.puff, k); P.crest = 1; P.sx += .08 * k; P.sy += .08 * k; P.fan = k; P.hx = 13; P.hy = -6; P.ha = .3; P.jx = s > 20 ? Math.sin(t * 2.3) * .7 : 0; }
        else { const u = k01((s - 40) / 8); P.wf = lerp(1, P.wf, io(u)); P.wl = 0; P.by -= 2 * (1 - u); P.hx = 15 - 3 * u; P.hy = -6; P.gape = .7 * (1 - u); P.puff = Math.max(P.puff, 1 - (s - 40) / 20); P.fan = 1 - u; }
        break;
      }
      case 'walk': {
        if (an.mv) {
          const w = an.wk, sw = Math.sin(w), cw = Math.cos(w);
          P.f1x = 3 + sw * 5; P.f1y = FL - Math.max(0, cw) * 4; P.f2x = 1 - sw * 5; P.f2y = FL - Math.max(0, -cw) * 4;
          P.by = -Math.abs(cw) * 1.2 + .8; P.ba = -.3 + Math.sin(w * 2) * .04;
          // Birds walk with the head held still, then thrust forward.
          const f = (w / Math.PI) % 1; P.hx = f < .2 ? 7 + 15 * f : 10 - 3 * (f - .2) / .8; P.hy = -15 + (f < .2 ? -1 : 0); P.tail = Math.sin(w) * .12;
        } else {
          // Standing: breathing, a tilt of the head now and then, a shift of weight.
          const tl = Math.sin(t / 47) > .7 ? (Math.sin(t / 47) - .7) / .3 : 0; P.ha += Math.sin(t / 53) * .06 - tl * .25; P.hy += tl * 1.5; P.hx += Math.sin(t / 61) * .8;
          P.f1x = 4 + Math.sin(t / 90) * .7;
        }
        // Just back on her feet: she shakes her feathers out.
        if (s < 18) { const k = 1 - s / 18; P.puff = Math.max(P.puff, .9 * k); P.jx = Math.sin(s * 2.4) * k; P.wo = .25 * k; P.wf = .2; P.wl = Math.sin(s * 2.4); }
        break;
      }
      case 'windup': {
        const k = eo(s / 10);
        P.ba = -.3 - .32 * k; P.bx = -2 * k; P.hx = 9 - 6 * k; P.hy = -15 - 3 * k; P.curl = .6 + 1.1 * k; P.ha = .35 * k; P.look = 0; P.wo = .3 * k; P.wf = -.3; P.sw = .4;
        P.sy -= .06 * k; P.sx += .04 * k; P.f1x = 4 + 5 * k; P.f2x = -4 * k; P.crest = Math.max(P.crest, .3 + .7 * k); P.puff = Math.max(P.puff, .3 * k); P.tail = .3 * k;
        if (s > 18) { P.jx = Math.sin(s * 1.9); P.curl += .1 * Math.sin(s * 2.5); }
        break;
      }
      case 'stab': {
        const k = eo(s / 3); stab(k); P.sx += .16 * k * (1 - s / 12); P.wo = .45; P.wf = -.55; P.sw = .5; P.wl = 1;
        if (s >= 3 && s < 7) P.hy += 1; P.eye = s > 1 ? -1 : 1; P.mud = s >= 3 ? 1 : 0; P.crest = 1;
        break;
      }
      case 'pull': {
        const k = io(s / 20); stab(1); P.mud = 0;
        P.hx = lerp(15.5, 9, k); P.hy = lerp(7, -15, k); P.ha = lerp(.72, 0, k); P.curl = lerp(-.35, .6, k); P.ba = lerp(.38, -.3, k); P.bx = lerp(3, 0, k); P.tail = lerp(-.5, 0, k);
        P.f1x = lerp(10, 4, k); P.f2x = lerp(-8, 0, k); P.clip = 0; P.gape = s > 9 && s < 15 ? .6 : 0; P.crest = 1 - k * .5; P.look = k;
        break;
      }
      case 'stuck': {
        stab(1); P.mud = 1; const cyc = s % 38, burst = cyc < 16 && s > 4, w = burst ? Math.sin(cyc / 16 * Math.PI) : 0;
        // Tugging: the beak stays put, the body pulls back and the neck stretches; wings beat, feet scrabble.
        P.bx = 3 - 3 * w; P.ba = .38 + .12 * w; P.hx = 15.5 - .5 * w; P.hy = 7 - .4 * w;
        if (burst) { P.wo = .95; P.wf = Math.sin(t * .85); P.wl = Math.cos(t * .85); P.f1x = 8 + Math.sin(t * 1.2) * 3; P.f1y = FL - Math.max(0, Math.sin(t * 1.2)) * 3; P.f2x = -8 - Math.sin(t * 1.2) * 2; P.f2y = FL - Math.max(0, -Math.sin(t * 1.2)) * 3; P.eye = -1; P.tail = -.4 + Math.sin(t * .9) * .3; P.puff = Math.max(P.puff, .5); }
        else { P.wo = .45; P.wf = .65 + Math.sin(t / 7) * .05; P.wl = 0; P.eye = (t % 60) < 5 ? 0 : 1; P.sy += Math.sin(t / 5) * .05; P.tail = -.3; }
        P.crest = burst ? 1 : .2 + Math.sin(t / 6) * .2;
        break;
      }
      case 'yank': {
        stab(1); P.clip = 0; P.mud = 0; const k = eo(s / 5), wh = Math.sin(k01(s / 9) * Math.PI);
        P.hx = lerp(15.5, 9, k) - 3 * wh; P.hy = lerp(7, -15, k) - 5 * wh; P.ha = s < 5 ? lerp(.72, -.45, k) : lerp(-.45, 0, io((s - 5) / 13)); P.curl = lerp(-.35, .6, k);
        P.gape = s < 13 ? .85 : 0; P.eye = s < 4 ? -1 : 1; P.ba = -.3 - .35 * wh; P.bx = lerp(3, -1, k); P.wo = .7 * (1 - s / 18); P.wf = -.4; P.sw = .3;
        P.f1x = lerp(10, 4, io(s / 12)); P.f2x = lerp(-8, 0, io((s - 6) / 10)); P.f2y = FL - (s > 5 && s < 14 ? Math.sin((s - 5) / 9 * Math.PI) * 4 : 0); P.crest = 1; P.tail = .4 * wh; P.look = 0;
        break;
      }
      case 'gustWind': {
        const k = eo(s / 20);
        P.puff = Math.max(P.puff, .6 * k); P.sy += .1 * k; P.sx -= .03 * k; P.ba = -.3 - .25 * k; P.hx = 9 - 3 * k; P.hy = -15 - 3 * k; P.ha = -.5 * k; P.gape = s > 8 && s < 34 ? .35 : 0; P.look = 0;
        P.wo = k; P.wf = -.95 + (s > 26 ? Math.sin(t * 2) * .06 : 0); P.sw = .6 * k; P.wl = 0; P.crest = 1; P.f1x = 4 + 5 * k; P.f2x = -5 * k; P.fan = k;
        break;
      }
      case 'gust': {
        const e = s > 108 ? io((s - 108) / 12) : 0, a = s * .62;
        const sn = Math.sin(a); P.wo = 1 - e; P.wf = Math.sign(sn) * Math.pow(Math.abs(sn), .45); P.wl = Math.cos(a); P.sw = -.2 - 1.3 * Math.max(0, P.wf); P.ba = -.5 + e * .2; P.bx = -1; P.by = -P.wf * .8; P.hx = 11; P.hy = -11; P.ha = .15; P.curl = .9; P.gape = .25 * (1 - e);
        P.puff = Math.max(P.puff, .5); P.f1x = 10; P.f2x = -6; P.look = 0; P.fan = .6;
        break;
      }
      case 'stagger': {
        const k = k01(s / 14), sw = Math.sin(t / 9);
        if (s < 14) { P.wo = 1 - k * .5; P.wf = Math.sin(t * .7); P.wl = Math.cos(t * .7); P.hx = 3; P.hy = -17; P.ha = -.4; P.eye = -1; P.gape = .8; P.ba = -.55; P.f1x = 6 - 8 * Math.sin(s * .45); P.f2x = -3 + 6 * Math.sin(s * .45); P.crest = 1; }
        else {
          P.bx = sw * 1.5; P.ba = -.15 + Math.sin(t / 11) * .15; P.by += 1.5 + Math.abs(sw); P.hx = 7 + Math.cos(t / 8) * 4; P.hy = -8 + Math.sin(t / 8) * 2.5; P.curl = .1; P.ha = .7 + Math.sin(t / 10) * .35;
          P.eye = 2; P.gape = .35 + Math.sin(t / 13) * .15; P.wo = .45; P.wf = .75 + Math.sin(t / 9) * .1; P.wl = 0; P.tail = .4; P.crest = -.6; P.look = 0;
          P.f1x = 5 + sw * 3; P.f2x = -1 - sw * 3;
          if (s > 118) { const u = (s - 118) / 22; P.ha += Math.sin(s * 1.6) * .3 * (1 - u); P.hy = lerp(P.hy, -15, io(u)); P.hx = lerp(P.hx, 9, io(u)); P.eye = 1; P.gape *= 1 - u; P.wo *= 1 - u; }
        }
        break;
      }
      case 'reel2': {
        const k = s < 12 ? 0 : io((s - 12) / 22);
        P.hx = lerp(1, 9, k); P.hy = lerp(-18, -15, k); P.ha = lerp(-.5, 0, k); P.eye = s < 20 ? -1 : 1; P.gape = .9 * (1 - k); P.ba = lerp(-.62, -.3, k); P.curl = lerp(.2, .6, k);
        P.wo = .9 * (1 - k); P.wf = -.3 + Math.sin(t * .8) * .4; P.wl = Math.cos(t * .8); P.crest = 1; P.puff = Math.max(P.puff, .8 * (1 - k)); P.look = 0;
        P.f1x = s < 16 ? 4 - 6 * Math.sin(s * .4) : 4; P.f2x = s < 16 ? 6 * Math.sin(s * .4) - 2 : 0; P.f1y = FL - (s < 16 ? Math.max(0, Math.sin(s * .4)) * 3 : 0);
        break;
      }
      case 'fanWind': {
        const k = eo(s / 20);
        P.puff = Math.max(P.puff, k); P.sx = 1 + .1 * k; P.sy = 1 + .1 * k; P.wo = .55 * k; P.wf = -.55 + (s > 12 && (t & 1) ? .08 : 0); P.wl = 0; P.sw = .3; P.ha = .2; P.hx = 10; P.hy = -13; P.crest = 1; P.fan = k; P.tail = -.2;
        P.gape = s > 30 ? .4 : 0; P.jx = s > 12 && (t & 1) ? 1 : 0; P.look = .5;
        break;
      }
      case 'fanPost': {
        if (s < 10) { const u = s / 10; P.wo = 1 - .7 * u; P.wf = .9; P.wl = -1; P.sw = -.6; P.hx = 13; P.hy = -11; P.gape = .7 * (1 - u); P.ba = -.15; P.bx = 1; }
        P.puff = Math.max(P.puff, 1 - s / 22); P.fan = Math.max(0, 1 - s / 16);
        if (s > 20 && s < 36) { P.jx = Math.sin(s * 2.4) * .7; P.puff = Math.max(P.puff, .5); }
        break;
      }
      case 'trans1': {
        if (b.air && s < 92) { fly(.28); if (s > 40) { const k = io((s - 40) / 12); P.wf = lerp(P.wf, -.9, k); P.fs = .28 * (1 - k); P.ba = lerp(P.ba, -.4, k); P.f1x = lerp(P.f1x, 7, k); P.f1y = lerp(P.f1y, 14, k); P.f2x = lerp(P.f2x, 3, k); P.f2y = lerp(P.f2y, 15, k); P.tuck = 1 - k; } }
        else if (s < 92) {
          // Two stamps on the nest: the foot goes up, the neck up with it, and down it all comes.
          P.wo = .5; P.wf = -.45 + Math.sin(t * .5) * .05; P.gape = .3; P.crest = 1; P.puff = Math.max(P.puff, .4);
          for (const d of [60, 78]) {
            if (s >= d - 9 && s < d) { const u = (s - d + 9) / 9, l = u < .7 ? eo(u / .7) : 1 - (u - .7) / .3; P.f1x = 6; P.f1y = FL - 8 * l; P.hy -= 3 * l; P.ha -= .3 * l; P.ba -= .1 * l; }
            if (s >= d && s < d + 7) { const q = Math.exp(-(s - d) / 2.5); P.by += 3 * q; P.sy -= .18 * q; P.sx += .12 * q; P.gape = 1; }
          }
        } else if (b.air) { fly(.55, 2); P.gape = .7 + Math.sin(t * .9) * .3; P.eye = (t >> 3) % 2 ? -1 : 1; P.crest = 1; dangle(.8, 3); P.ba = -.2; P.hy -= 3; }
        break;
      }
      case 'trans2': {
        fly(.3); const k = k01(s / 40);
        if (s < 40) { P.jx = Math.sin(s * 2.7) * k * 1.3; P.puff = Math.max(P.puff, k); P.sx += .06 * k; P.sy += .06 * k; P.crest = k; P.hy += 2 * k; P.ha = .3 * k; P.eye = s > 30 ? 4 : 1; }
        else if (s < 72) { const u = Math.sin(k01((s - 40) / 32) * Math.PI); P.fs = .05; P.wf = lerp(P.wf, -1, u) + Math.sin(t * 1.8) * .04 * u; P.wl = 0; P.gape = u; P.ha = -.65 * u; P.hy -= 6 * u; P.hx += 2 * u; P.curl = 1 - .8 * u; P.crest = 1; P.puff = 1; P.look = 1 - u; P.jx = Math.sin(t * 2.2) * u; }
        break;
      }
      case 'final': {
        fly(.18, 1); P.rot = s * .15; P.wf = .2 + Math.sin(t * .3) * .6; P.eye = 2; P.gape = .7; P.hx = 8; P.hy = -8; P.ha = .4; P.curl = .2; P.crest = -.5; dangle(1, 3); P.look = 0; P.puff = .8;
        break;
      }
      case 'dying': {
        const up = io((s - 66) / 24), q = Math.exp(-s / 5) * Math.cos(s * .9), tw = s % 28 < 3 && s < 66;
        P.by = lerp(10, 0, up) + 2 * Math.max(0, q); P.ba = lerp(.12, -.3, up); P.sy = 1 + Math.sin(t / 7) * .05 - .15 * Math.max(0, q); P.sx = 1 + .1 * Math.max(0, q);
        P.hx = lerp(20, 9, up) + (tw ? 1 : 0); P.hy = lerp(12, -13, up); P.ha = lerp(.12, .25, up); P.curl = lerp(-.2, .3, up); P.eye = s > 60 && (t >> 3) % 3 ? .5 : 0; P.gape = lerp(.25, 0, up);
        P.wo = .7 * (1 - up); P.wf = tw ? .55 : .95; P.wl = 0; P.sw = .4; P.crest = -.7; P.tail = .5; P.look = 0;
        P.f1x = lerp(6, 4, up); P.f1y = FL; P.f2x = lerp(-3, 0, up); P.f2y = FL;
        break;
      }
      case 'leave': {
        fly(.14 + (Math.sin(t / 9) > 0 ? .08 : 0), 2); P.flip = 1; P.ba = -.18; P.hx = 11; P.hy = -5; P.ha = .3; P.eye = .5; P.crest = -.5; P.look = 0;
        P.f1x = -4 + Math.sin(t / 7) * 3; P.f1y = 15; P.tuck = .4; P.by += Math.sin(t / 13) * 1.5;
        break;
      }
    }
    // Sidestepping a stone: a sharp bank with the wings swept.
    if (b.dodge > 0) { const k = Math.sin(b.dodge / 14 * Math.PI), d = b.dodgeDir === b.dir ? 1 : -1; P.ba += .45 * d * k; P.wf = lerp(P.wf, -.9, k); P.sw += .6 * k; P.wl = 0; P.hx -= 2 * d * k; P.crest = 1; }
    // Turning round: a squeeze through the flip.
    if (an.turn > 0) { P.sx *= 1 - an.turn * .05; P.hx *= 1 - an.turn * .08; }
    // Screaming: the neck shoots up, the beak opens wide; on the ground she spreads her wings as well.
    if (b.shriek > 0 && !P.clip && st !== 'plunge' && st !== 'final' && st !== 'dying') {
      const w = Math.min(1, b.shriek / 8);
      P.gape = Math.max(P.gape, w * (.8 + Math.sin(t * 1.5) * .2)); P.ha = lerp(P.ha, -.45, w); P.hy -= 5 * w; P.hx += 3 * w; P.crest = Math.max(P.crest, w); P.curl = lerp(P.curl, .15, w); P.look = 1 - w;
      if (!b.air) { P.wo = Math.max(P.wo, .85 * w); P.wf = lerp(P.wf, -.65 + Math.sin(t * .6) * .08, w); P.wl = 0; P.puff = Math.max(P.puff, .6 * w); P.fan = Math.max(P.fan, w); }
    }
    // A blow: eye squeezed shut, beak open, head whipped back.
    if (b.flash > 0) {
      const w = b.flash / 14; P.eye = -1; P.gape = Math.max(P.gape, .8 * w); P.sx += .12 * w; P.sy -= .1 * w; P.hx -= 5 * w; P.hy -= 4 * w; P.ha -= .5 * w; P.bx -= 2 * w; P.crest = 1; P.puff = Math.max(P.puff, w); P.look = 0;
    }
    // Back down on the ground: squash.
    if (!b.air && an.lt < 12 && st !== 'land' && st !== 'dying' && st !== 'stuck' && st !== 'intro') { const q = Math.exp(-an.lt / 4) * Math.cos(an.lt * .7); P.sy -= .2 * q; P.sx += .15 * q; P.by += 3 * Math.max(0, q); }
    // The eye (and a little of the head) follows Nila.
    const dir = facing(b, P), hwx = b.x + 15 + dir * (P.bx + P.hx), hwy = b.y + 13 + P.by + P.hy, ldx = (Player.x + 5 - hwx) * dir, ldy = Player.y + 10 - hwy;
    P.pl = ldx > 3 ? 1 : ldx < -3 ? -1 : 0;
    if (P.look > 0 && ldx > -4) P.ha += clamp(Math.atan2(ldy, Math.max(4, ldx)), -.45, .8) * P.look * .6;
    // Blinking (never while furious).
    if (P.eye === 1 && ((t + 23) % 157 < 4 || (t + 23) % 471 === 12 || (t + 23) % 471 === 13)) P.eye = 0;
    return P;
  }

  // ---- Painting
  let RA = null, RO = null, ra = null, ro = null, OX = 0, OY = 0, OV = null, FC = null, CLIP = 999;
  // Where her beak tip, eye and head ended up (in her own frame), for the effects drawn around her.
  const TIP = [0, 0], EYE = [0, 0], HEAD = [0, 0];
  function R(x, y, w, h, c) { const col = OV || c; if (col !== FC) { ra.fillStyle = col; FC = col; } ra.fillRect(AX + x + OX, AY + y + OY, w, h); }
  function dot(x, y, c) { x = Math.round(x); y = Math.round(y); if (y <= CLIP) R(x, y, 1, 1, c); }
  function line(x0, y0, x1, y1, c, w = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (y <= CLIP) R(x, y, w, w, c); }
  }
  // A filled ellipse turned by a, row by row (crisp, no smoothing).
  function ell(cx, cy, rx, ry, a, c) {
    rx = Math.max(.5, rx); ry = Math.max(.5, ry);
    const ca = Math.cos(a), sa = Math.sin(a), A = ca * ca / (rx * rx) + sa * sa / (ry * ry), Bq = 2 * sa * ca * (1 / (rx * rx) - 1 / (ry * ry)), Cq = sa * sa / (rx * rx) + ca * ca / (ry * ry), r = Math.max(rx, ry);
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) {
      const Y = yy + .5 - cy, B = Bq * Y, D = B * B - 4 * A * (Cq * Y * Y - 1); if (D < 0) continue;
      const q = Math.sqrt(D), xa = Math.round(cx + (-B - q) / (2 * A)), xb = Math.round(cx + (-B + q) / (2 * A)); if (xb > xa) R(xa, yy, xb - xa, 1, c);
    }
  }
  function poly(p, c) {
    let y0 = 1e9, y1 = -1e9; for (const q of p) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
    const xs = [];
    for (let yy = Math.floor(y0); yy <= Math.ceil(y1); yy++) {
      const Y = yy + .5; xs.length = 0;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], q = p[j]; if ((a[1] > Y) !== (q[1] > Y)) xs.push(a[0] + (Y - a[1]) / (q[1] - a[1]) * (q[0] - a[0])); }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) { const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]); if (xb > xa) R(xa, yy, xb - xa, 1, c); }
    }
  }
  // Paints f with its own ink line around it (for parts that overlap the body: the near wing, the neck and head).
  function inked(f, ink) { OV = ink; OX = -1; OY = 0; f(); OX = 1; f(); OX = 0; OY = -1; f(); OY = 1; f(); OV = null; OY = 0; f(); }
  const lp = (a, q, k) => [a[0] + (q[0] - a[0]) * k, a[1] + (q[1] - a[1]) * k];

  // A wing: folded along the back (wo 0) or open, beating from up (wf -1) to down (wf 1); the long dark
  // primaries trail behind the beat (wl), sw sweeps it back.
  function wing(P, bf, far) {
    const o = P.wo, f = clamp(P.wf - (far ? .35 : 0), -1, 1), fd = f > 0 ? .75 : 1, m = 1 - Math.abs(f), sw = P.sw, lag = P.wl * o * 5 * (far ? .8 : 1), sc = far ? .92 : 1;
    const Wo = [-3 - 2 * m - sw * 4, f * 14 * fd - m * 3], To = [Wo[0] - 7 - 13 * m - sw * 7, Wo[1] + f * 12 * fd - m - lag];
    const S = lp([6, -2], [5, -4], o), W = lp([-1, -6], Wo, o), T = lp([-21, -1], To, o), Sb = lp([2, 1], [-8, -3], o);
    const Sm = lp([-11, 2], [(Wo[0] - 8) / 2 - 5, (Wo[1] - 3) / 2 + 4 * m + f * 2], o);
    const q = p => bf((p[0] + (far ? 1 : 0)) * sc, (p[1] - (far ? 2.5 : 0)) * sc);
    const s = q(S), w = q(W), t = q(T), sb = q(Sb), sm = q(Sm), tp = lp(w, t, .45);
    let ax = t[0] - w[0], ay = t[1] - w[1]; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
    let px = -ay, py = ax; if (px * (sm[0] - w[0]) + py * (sm[1] - w[1]) < 0) { px = -px; py = -py; }
    const tips = []; for (let i = 0; i < 5; i++) tips.push([t[0] + px * i * 1.9 - ax * i * 1.5, t[1] + py * i * 1.9 - ay * i * 1.5]);
    const c1 = far ? HC.g : HC.G, c2 = far ? HC.k : HC.g, c3 = far ? HC.K : HC.k;
    poly([s, w, t, tips[4], sm, sb], c1);
    // The flight feathers: a dark hand at the tip, a row of secondaries along the trailing edge.
    poly([tp, t, tips[4], lp(sm, tips[4], .5)], c3);
    for (let i = 1; i < 5; i++) { const a = lp(tp, w, i * .12); line(a[0], a[1], tips[i][0], tips[i][1], i % 2 ? c2 : c3); }
    line(tp[0], tp[1], t[0], t[1], c3);
    if (o > .3) for (let i = 1; i < 4; i++) { const a = lp(s, w, i / 4), e = lp(sb, sm, i / 3); line(lp(a, e, .55)[0], lp(a, e, .55)[1], e[0], e[1], c2); }
    // A pale leading edge (the shoulder coverts).
    if (!far) { line(s[0], s[1], w[0], w[1], HC.L); line(w[0], w[1], tp[0], tp[1], HC.L); const k = lp(s, w, .75); dot(k[0], k[1] + 1, HC.K); dot(w[0], w[1] + 1, HC.K); }
  }
  function leg(hx, hy, fx, fy, near, tuck) {
    const a = 7, c = 8; let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
    if (d > a + c - .3) { const k = (a + c - .3) / d; dx *= k; dy *= k; d = a + c - .3; fx = hx + dx; fy = hy + dy; }
    d = Math.max(d, 3);
    const an = Math.atan2(dy, dx) + Math.acos(clamp((a * a + d * d - c * c) / (2 * a * d), -1, 1)), jx = hx + Math.cos(an) * a, jy = hy + Math.sin(an) * a;
    const col = near ? HC.y : HC.d;
    line(hx, hy, jx, jy, near ? HC.g : HC.k); line(jx, jy, fx, fy, col);
    if (tuck > .5) { dot(fx - 1, fy + 1, col); dot(fx - 2, fy, col); }
    else { line(fx, fy, fx + 3, fy, col); dot(fx - 1, fy, col); if (near) dot(fx + 2, fy - 1, col); }
  }
  function figure(b, P, white, ink) {
    if (!RA) {
      RA = document.createElement('canvas'); RA.width = RW; RA.height = RH; ra = RA.getContext('2d');
      RO = document.createElement('canvas'); RO.width = RW; RO.height = RH; ro = RO.getContext('2d');
    }
    ra.clearRect(0, 0, RW, RH); FC = null; CLIP = 999;
    const t = b.t, ca = Math.cos(P.ba), sa = Math.sin(P.ba), bf = (x, y) => [P.bx + x * P.sx * ca - y * P.sy * sa, P.by + x * P.sx * sa + y * P.sy * ca];
    const flying = P.wo > .04;
    // Far wing, legs, tail, then the body over their roots.
    if (flying) wing(P, bf, true);
    const tk = P.tuck, h2 = bf(-1 - 5 * tk, 4.5 - 1.5 * tk), h1 = bf(2 - 5 * tk, 5 - 1.5 * tk);
    leg(h2[0], h2[1], P.f2x, P.f2y, false, P.tuck); leg(h1[0], h1[1], P.f1x, P.f1y, true, P.tuck);
    const tr = bf(-10, 0);
    for (let i = 0; i < 4; i++) { const a = Math.PI + P.ba - .15 + P.tail + (i - 1.5) * (.12 + P.fan * .22), l = 6 + (i % 2) + P.fan * 2, wv = Math.sin(t / 5 + i) * .06; line(tr[0], tr[1], tr[0] + Math.cos(a + wv) * l, tr[1] + Math.sin(a + wv) * l, i % 2 ? HC.k : HC.g); }
    const c = bf(0, 0), rx = 11 * P.sx, ry = 6 * P.sy;
    // Ruffled: tufts stand up along the back.
    if (P.puff > .05) for (let i = 0; i < 8; i++) {
      const th = -2.9 + i * .34, e = bf(11 * Math.cos(th), 6 * Math.sin(th)), nx = e[0] - c[0], ny = e[1] - c[1], nl = Math.hypot(nx, ny) || 1, l = P.puff * (2 + ((i + (t >> 2)) % 3));
      line(e[0], e[1], e[0] + nx / nl * l, e[1] + ny / nl * l, i % 2 ? HC.G : HC.L);
    }
    ell(c[0], c[1], rx, ry, P.ba, HC.G);
    const be = bf(2, 3); ell(be[0], be[1], 8 * P.sx, 2.8 * P.sy, P.ba, HC.L);
    const ch = bf(7, .5); ell(ch[0], ch[1], 4.5 * P.sx, 4.4 * P.sy, P.ba, HC.W);
    for (let x = -7; x <= 6; x++) { const p = bf(x, -6 * Math.sqrt(1 - (x / 11) * (x / 11)) + 1.2); dot(p[0], p[1], HC.L); }
    for (let i = 0; i < 3; i++) { const p = bf(8 + i * .5, -1 + i * 2); dot(p[0], p[1], HC.K); }
    inked(() => wing(P, bf, false), ink);
    // Neck, head and beak, as one inked piece.
    const n0 = bf(8, -3.5), H = [P.bx + P.hx, P.by + P.hy], dx = Math.cos(P.ha), dy = Math.sin(P.ha), cu = P.curl;
    const p1 = [n0[0] - 2 - 5 * cu, n0[1] - 5 - 2 * cu], p2 = [H[0] - dx * (3 + 5 * cu), H[1] - dy * (3 + 5 * cu) + 3 + 3 * cu];
    const N = 9, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, v = 1 - u; pts.push([v * v * v * n0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * H[0], v * v * v * n0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * H[1]]); }
    const rh = (x, y) => [H[0] + x * dx - y * dy, H[1] + x * dy + y * dx];
    HEAD[0] = H[0]; HEAD[1] = H[1];
    inked(() => {
      for (let i = 0; i <= N; i++) { const r = 3 - 1.2 * i / N; ell(pts[i][0], pts[i][1], r, r, 0, i < 3 ? HC.G : HC.L); }
      for (let i = 0; i <= N; i++) {
        const q = pts[Math.min(N, i + 1)], p = pts[Math.max(0, i - 1)], tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1, fx = -ty / tl, fy = tx / tl, r = 3 - 1.2 * i / N;
        ell(pts[i][0] + fx * .9, pts[i][1] + fy * .9, r - .9, r - .9, 0, HC.W);
        if (i > 1 && i < N - 1 && i % 2 === 0) dot(pts[i][0] + fx * (r - .6), pts[i][1] + fy * (r - .6), HC.k);
      }
      // Beak: a long yellow dagger; the lower half drops as she opens it.
      const bb = rh(2.6, .4), g2 = P.gape * .6, lx = Math.cos(P.ha + g2), ly = Math.sin(P.ha + g2);
      if (P.clip) CLIP = FL - 1;
      if (P.gape > .15) line(bb[0], bb[1] + .5, bb[0] + (dx + lx) * 3, bb[1] + (dy + ly) * 3 + .5, HC.t);
      line(bb[0], bb[1] + 1, bb[0] + lx * 10.5, bb[1] + 1 + ly * 10.5, HC.y);
      line(bb[0], bb[1], bb[0] + dx * 12, bb[1] + dy * 12, HC.Y); line(bb[0] + dy * .9, bb[1] - dx * .9, bb[0] + dx * 6 + dy * .9, bb[1] + dy * 6 - dx * .9, HC.Y);
      CLIP = 999; TIP[0] = bb[0] + dx * 12; TIP[1] = bb[1] + dy * 12;
      if (P.mud) { const mx = Math.min(TIP[0], bb[0] + dx * ((FL - 1 - bb[1]) / Math.max(.2, dy))); ell(mx, FL - .5, 3.2, 1.6, 0, HC.m); dot(mx - 2, FL - 2, HC.M); dot(mx + 2, FL - 2, HC.m); }
      ell(H[0], H[1], 3.6, 2.8, P.ha, HC.W);
      // The black crown stripe running back from the eye into the plumes.
      line(...rh(1.8, -1.6), ...rh(-3, -1.8), HC.K); dot(...rh(-3, -.8), HC.K);
      // Crest: two long black plumes that lag behind the head and flutter.
      const an = b.an || AN0, cr = P.crest;
      for (let j = 0; j < 2; j++) {
        const base = rh(-3, -1.5 + j), a0 = Math.PI + P.ha - cr * .9 + .15 * j + Math.sin(t / 6 + j * 2) * .12, l = 8 - j * 2;
        let ex = base[0] + Math.cos(a0) * l - clamp(an.vx, -3, 3) * 1.4, ey = base[1] + Math.sin(a0) * l - clamp(an.vy, -3, 3) * 1.4 + (cr < 0 ? -cr * 3 : 0);
        const mx = (base[0] + ex) / 2 + Math.sin(t / 4 + j) * .7, my = (base[1] + ey) / 2 + Math.cos(t / 5 + j) * .7;
        line(base[0], base[1], mx, my, HC.K); line(mx, my, ex, ey, j ? HC.k : HC.K);
      }
    }, ink);
    // The eye, over everything on the head.
    const ep = rh(1.3, -.6), ex = Math.round(ep[0]), ey = Math.round(ep[1]); EYE[0] = ex; EYE[1] = ey;
    const eye = P.eye, red = b.rage;
    if (eye === 1 || eye === 3 || eye === 4) {
      R(ex - 1, ey, 2, 1, eye === 3 ? '#ffffff' : red ? HC.R : HC.E); R(ex + (P.pl < 0 ? -1 : 0), ey, 1, 1, red ? HC.r : HC.e);
      R(ex - 1, ey - 1, 3, 1, HC.K);
    } else if (eye === .5) { R(ex - 1, ey, 2, 1, red ? HC.R : HC.E); R(ex - 1, ey - 1, 3, 1, HC.K); R(ex, ey, 1, 1, HC.e); }
    else if (eye === 0) R(ex - 1, ey, 3, 1, HC.K);
    else if (eye === -1) { R(ex - 1, ey - 1, 1, 1, HC.K); R(ex, ey, 1, 1, HC.K); R(ex - 1, ey + 1, 1, 1, HC.K); R(ex + 1, ey - 1, 1, 1, HC.K); R(ex + 1, ey + 1, 1, 1, HC.K); }
    else if (eye === 2) { const k = (t >> 2) % 4, o = [[-1, -1], [0, -1], [0, 0], [-1, 0]][k]; R(ex - 1, ey - 1, 2, 2, HC.w); R(ex + o[0], ey + o[1], 1, 1, HC.K); }
    if (white) { ra.globalCompositeOperation = 'source-atop'; ra.fillStyle = '#ffffff'; ra.fillRect(0, 0, RW, RH); ra.globalCompositeOperation = 'source-over'; FC = null; }
    // The outline of the whole silhouette.
    ro.clearRect(0, 0, RW, RH); ro.globalCompositeOperation = 'source-over';
    ro.drawImage(RA, -1, 0); ro.drawImage(RA, 1, 0); ro.drawImage(RA, 0, -1); ro.drawImage(RA, 0, 1);
    ro.globalCompositeOperation = 'source-in'; ro.fillStyle = ink; ro.fillRect(0, 0, RW, RH); ro.globalCompositeOperation = 'source-over';
  }
  // Stamps her figure at a point of the screen (the middle of her body), facing dir.
  function stamp(g, x, y, dir, rot) {
    g.save(); g.imageSmoothingEnabled = false; g.translate(x, y); if (dir < 0) g.scale(-1, 1); if (rot) g.rotate(rot);
    g.drawImage(RO, -AX, -AY); g.drawImage(RA, -AX, -AY); g.restore();
  }

  // ---- Cosmetic life: flap and walk phases, head velocity for the plumes, landings, the eye trail, breath.
  function anim(b) {
    const an = b.an || (b.an = { fl: 0, wk: 0, mv: 0, lt: 99, vx: 0, vy: 0, hx: null, hy: 0, px: b.x, air: b.air, trail: [] });
    const P = pose(b), dir = facing(b, P);
    an.fl += P.fs; const mv = b.x - an.px; an.mv = !b.air && Math.abs(mv) > .05 ? 1 : 0; if (an.mv) an.wk += Math.abs(mv) * .21; an.px = b.x;
    if (an.dir !== undefined && an.dir !== dir) an.turn = 5; else if (an.turn > 0) an.turn--; an.dir = dir;
    if (b.air !== an.air) { if (!b.air) an.lt = 0; an.air = b.air; } if (an.lt < 99) an.lt++;
    const hx = b.x + 15 + dir * (P.bx + P.hx), hy = b.y + 13 + P.by + P.hy;
    if (an.hx !== null) { an.vx = lerp(an.vx, clamp((hx - an.hx) * dir, -4, 4), .35); an.vy = lerp(an.vy, clamp(hy - an.hy, -4, 4), .35); }
    an.hx = hx; an.hy = hy;
    // A puff of dust under each foot as it comes down.
    if (an.mv) { const c = Math.cos(an.wk); if (an.cs !== undefined && Math.sign(c) !== Math.sign(an.cs)) spawnParts(2, b.x + 15 + dir * (Math.sin(an.wk) * 5 + 2), b.y + 30, { color: ['#c9b08a', '#a08a6a'], angle: -Math.PI / 2, spread: 1.2, speed: [.2, .7], life: [8, 14] }); an.cs = c; }
    // Furious: the red eye leaves a trail and she snorts steam.
    const ex = b.x + 15 + dir * (P.bx + P.hx + 1.3), ey = b.y + 13 + P.by + P.hy - .6;
    if (b.rage) {
      an.trail.unshift(ex, ey); if (an.trail.length > 12) an.trail.length = 12;
      if (b.t % 5 === 0) spawnParts(1, ex, ey, { color: ['#ff5a3a', '#ffb070'], speed: [.1, .4], life: [8, 16], g: -.03 });
      if (b.t % 16 === 0 && b.state !== 'stuck') { const nx = b.x + 15 + dir * (P.bx + P.hx + 3 + Math.cos(P.ha) * 2), ny = b.y + 13 + P.by + P.hy + 1; for (let i = 0; i < 2; i++) L.parts.push({ x: nx, y: ny, vx: dir * rnd(.3, .8), vy: -rnd(.2, .5), life: 18, max: 18, color: '#dfe6ee', size: 1, g: -.01, kind: 'mist' }); }
    } else an.trail.length = 0;
    // A loose feather now and then while she flaps hard or is knocked about.
    if ((b.state === 'leave' && b.t % 12 === 0) || (b.state === 'stuck' && b.st % 38 < 16 && b.t % 7 === 0)) feathers(b.x + 15 - dir * 4, b.y + 10, 1);
  }

  // Just her, at a point of the screen (for tests and scenes).
  // The same puppet outside the fight (intro, title, ending): flying, diving or gliding, at any size, facing
  // either way, and if asked as a flat silhouette (against the moon) or a pale ghost (the dive's after-images).
  // o = { x, y (the middle of her body on screen), t, dir, state: 'return'|'plunge'|'hover'|'leave'|..., st, scale, tint, wing (-1 up .. 1 down), beat }
  let FIG = null;
  function figura(g, o) {
    const t = o.t || 0, b = { state: o.state || 'return', st: o.st || 0, t, dir: o.dir || 1, rage: o.rage ? 1 : 0, phase: o.phase || 1, air: true, x: 0, y: 0,
      an: { fl: t * (o.beat || .22), wk: 0, mv: 0, lt: 99, vx: 0, vy: 0, trail: [] } };
    const P = pose(b); if (o.wing !== undefined) { P.wf = o.wing; P.wl = 0; P.by = -o.wing * 1.2; }
    figure(b, P, false, o.rage ? RAGE_INK : INK);
    const s = o.scale || 1, dir = facing(b, P);
    if (!o.tint && s === 1) { stamp(g, Math.round(o.x), Math.round(o.y), dir, P.rot); return; }
    if (!FIG) { FIG = document.createElement('canvas'); FIG.width = RW; FIG.height = RH; }
    const fg = FIG.getContext('2d'); fg.clearRect(0, 0, RW, RH); stamp(fg, AX, AY, dir, P.rot);
    if (o.tint) { fg.globalCompositeOperation = 'source-atop'; fg.fillStyle = o.tint; fg.fillRect(0, 0, RW, RH); fg.globalCompositeOperation = 'source-over'; }
    g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(o.x), Math.round(o.y)); g.scale(s, s); g.drawImage(FIG, -AX, -AY); g.restore();
  }
  function puppet(g, b, x, y) { const P = pose(b); figure(b, P, false, b.rage ? RAGE_INK : INK); stamp(g, x, y, facing(b, P), P.rot); }
  function draw(b, g) {
    const A = arena(b.phase);
    drawNest(g, A);
    if (b.state === 'wait') return;
    drawShadows(b, g, A);
    const P = pose(b), dir = facing(b, P), st = b.state, t = b.t;
    const cx = Math.round(b.x + 15 - Cam.x + P.jx), cy = Math.round(b.y + 13 - Cam.y);
    const white = b.flash > 0 && (b.flash >> 1) % 2, ink = b.rage ? RAGE_INK : INK;
    const W2 = (x, y) => [cx + dir * x, cy + y];
    // The eye's red trail, behind her.
    if (b.an && b.an.trail.length > 2) { const tr = b.an.trail; for (let i = 2; i < tr.length; i += 2) { g.globalAlpha = .5 * (1 - i / tr.length); g.fillStyle = '#ff5a3a'; g.fillRect(Math.round(tr[i] - Cam.x), Math.round(tr[i + 1] - Cam.y), 1, 1); } g.globalAlpha = 1; }
    // Diving: speed lines streaming up behind her.
    if (P.spd) { g.fillStyle = '#dff2fb'; for (let i = 0; i < 5; i++) { const ox = (i * 7) % 22 - 11, ln = 8 + (i * 5) % 9, oy = -18 - ((t * 5 + i * 13) % 20); g.globalAlpha = .45; g.fillRect(cx + ox, cy + oy, 1, ln); } g.globalAlpha = 1; }
    figure(b, P, white, ink);
    // Furious: a red glow round the eye.
    if (b.rage && !white) { const e = W2(EYE[0], EYE[1]); g.globalAlpha = .3 + Math.sin(t / 4) * .1; g.fillStyle = '#ff3a2a'; g.fillRect(e[0] - 2, e[1] - 1, 5, 3); g.globalAlpha = 1; }
    stamp(g, cx, cy, dir, P.rot);
    // The blow lands: a burst of white rays from her body.
    if (b.flash > 8) { const k = (14 - b.flash) / 6; g.fillStyle = '#fff6d6'; for (let i = 0; i < 8; i++) { const a = i * .785 + .3, r0 = 10 + k * 10, r1 = r0 + 5 - k * 3; for (let r = r0; r < r1; r++) g.fillRect(Math.round(cx + Math.cos(a) * r * 1.3), Math.round(cy + Math.sin(a) * r), 1, 1); } }
    // The glint on the beak just before the stab (and on the eye as she locks on for a dive).
    const tip = W2(TIP[0], TIP[1]);
    if (st === 'windup' && b.st > 16 && (b.st >> 1) % 2) { g.fillStyle = '#ffffff'; g.fillRect(tip[0] - 2, tip[1], 5, 1); g.fillRect(tip[0], tip[1] - 2, 1, 5); }
    if (st === 'lock' && b.st > 10 && (b.st >> 1) % 2) { const e = W2(EYE[0], EYE[1]); g.fillStyle = '#ffffff'; g.fillRect(e[0] - 3, e[1], 7, 1); g.fillRect(e[0], e[1] - 3, 1, 7); }
    const hd = W2(HEAD[0], HEAD[1]);
    // A big "!" over her head while she winds up a stab.
    if (st === 'windup' && (b.st >> 2) % 3) { const ex = hd[0], ey = Math.min(cy - 32, hd[1] - 16) - (b.st < 6 ? 6 - b.st : 0); g.fillStyle = '#1b1020'; g.fillRect(ex - 2, ey - 1, 5, 11); g.fillStyle = '#ffec8a'; g.fillRect(ex - 1, ey, 3, 6); g.fillRect(ex - 1, ey + 7, 3, 2); g.fillStyle = '#ffffff'; g.fillRect(ex - 1, ey, 1, 5); }
    // Dizzy: stars circling her head.
    if (st === 'stuck' || (st === 'stagger' && b.st > 10) || st === 'final') for (let i = 0; i < 3; i++) { const a = t / 9 + i * 2.09, sx = hd[0] + Math.round(Math.cos(a) * 9) - 3, sy = hd[1] - 7 + Math.round(Math.sin(a) * 3); if (Math.sin(a) > -.2 || (t >> 2) % 2) g.drawImage(ART.star, sx, sy); }
    // Screaming: lines coming out of the open beak.
    if (b.shriek > 0) { g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const r = 3 + (b.shriek % 10) * .6, a = -.7 + i * .5, px = tip[0] + dir * Math.cos(a) * r, py = tip[1] + Math.sin(a) * r; g.fillRect(Math.round(px + dir * 1), Math.round(py), 2, 1); g.fillRect(Math.round(px + dir * 3), Math.round(py + Math.sin(a) * 2), 2, 1); } }
  }
  // In front of everything: the letterbox of the intro, the wind lines, the aim lines of a fan, and the flashes.
  function drawFront(g) {
    const b = L.boss; if (!b || !b.fight) return;
    const A = arena(b.phase), t = Game.t;
    if (b.state === 'gust' || b.state === 'gustWind') {
      const cx = b.x + 15, n = b.state === 'gust' ? 18 : 6;
      for (let i = 0; i < n; i++) {
        const yy = A.floor - 3 - ((i * 37) % 46), ph = (t * (b.state === 'gust' ? 7 : 3) + i * 53) % 240, sx = b.state === 'gust' ? cx + b.gdir * (18 + ph) : cx + b.gdir * (120 - ph * .45);
        g.globalAlpha = b.state === 'gust' ? .55 : .3; g.fillStyle = i % 3 ? '#dff2fb' : '#ffffff'; g.fillRect(Math.round(Math.min(sx, sx - b.gdir * 18) - Cam.x), Math.round(yy - Cam.y + Math.sin(ph * .1 + i) * 1.5), 18, i % 4 ? 1 : 2);
      }
      g.globalAlpha = 1;
    }
    const marks = []; if (b.aims) for (const q of b.aims) marks.push(q.sx); for (const e of L.ents) if (!e.dead && e.kind === 'plume' && !e.stuck) marks.push(e.sx);
    for (const mx of marks) mark(g, mx, A.floor, t);
    // The arcs, faint, while she winds up.
    if (b.aims) for (const q of b.aims) { let x = q.x, y = q.y, vy = q.vy; for (let k = 0; k < q.T; k++) { vy += PLUME_G; x += q.vx; y += vy; if (k % 3) continue; g.globalAlpha = .12 + .3 * (k / q.T); g.fillStyle = '#fff6d6'; g.fillRect(Math.round(x - Cam.x), Math.round(y - Cam.y), 1, 1); } g.globalAlpha = 1; }
    if (b.lock) { const k = Math.min(1, b.st / 20), hb = Math.round(12 * k); g.fillStyle = '#07060c'; g.fillRect(0, 0, W, hb); g.fillRect(0, H - hb, W, hb); }
    if (b.rage && !Game.still) { const a = .06 + Math.sin(t / 14) * .03; g.fillStyle = 'rgba(200,30,20,' + a + ')'; g.fillRect(0, 0, W, 5); g.fillRect(0, H - 5, W, 5); g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H); }
    if (b.redT > 0) { g.fillStyle = 'rgba(255,60,30,' + (b.redT / 24 * .35) + ')'; g.fillRect(0, 0, W, H); }
    if (b.whiteT > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, b.whiteT / 20) + ')'; g.fillRect(0, 0, W, H); }
  }
  // A red cross on the ground where a dart will land.
  function mark(g, x, floor, t) {
    const sx = Math.round(x - Cam.x), sy = Math.round(floor - Cam.y - 3), on = (t >> 2) % 2;
    g.globalAlpha = .55; g.fillStyle = '#120a14'; g.beginPath(); g.ellipse(sx, sy + 3, 8, 2, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = .9; g.strokeStyle = on ? '#ff5a3a' : '#ffb070'; g.beginPath(); g.ellipse(sx, sy + 3, 9, 2.6, 0, 0, Math.PI * 2); g.stroke();
    // A faint column of light over it, so it reads from far away.
    for (let k = 4; k < 26; k += 3) { g.globalAlpha = .35 * (1 - k / 26); g.fillStyle = '#ffb070'; g.fillRect(sx, sy - k, 1, 2); }
    g.globalAlpha = 1; g.fillStyle = on ? '#ff5a3a' : '#fff0c8'; for (let i = -3; i <= 3; i++) { g.fillRect(sx + i, sy + Math.round(i * .6), 2, 1); g.fillRect(sx + i, sy - Math.round(i * .6), 2, 1); }
  }
  // The camera frames the arena, leaning a little toward her; during the intro it looks up at the nest.
  function cam(b) {
    if (!b.fight || b.dead) return null;
    const A = arena(b.phase), P = Player;
    if (b.lock) return { x: clamp(A.perch.x - W / 2, A.x0 - 16, A.x1 - W), y: 18 };
    // Stamping on the nest: the camera looks up at her.
    if (b.state === 'trans1' && b.st < 100) return { x: clamp(lerp(P.x + 5, A.perch.x, .6) - W / 2, A.x0 - 16, A.x1 - W), y: 6 };
    const fx = lerp(P.x + 5, b.state === 'leave' ? P.x + 5 : b.x + 15, .3) + P.dir * 10;
    return { x: clamp(fx - W / 2, A.x0 - 16, A.x1 - W), y: Math.min(24, P.y - 60) };
  }
  function won() {
    const A = arena(3);
    Sound.duck(false); Sound.play('clear'); Sound.playMusic('dock'); Game.toast('¡La Garza se ha ido!', 150); L.bossCk = 4;
    for (let y = 4; y <= L.h - 4; y++) if (tileAt(A.c0 - 1, y) === 'G') L.gateQueue.push({ x: A.c0 - 1, y, d: 6 + (L.h - 4 - y) * 5 });
    if (tileAt(A.c0, L.h - 4) === '^') setTile(A.c0, L.h - 4, '.');
    // The boat pulls up on the shore; the last stretch of ground becomes water for it (it already is, after the flood).
    for (let x = L.w - 4; x < L.w; x++) { setTile(x, L.h - 4, '.'); setTile(x, L.h - 3, '~'); setTile(x, L.h - 2, '~'); }
    L.ents.push(Item.boat((L.w - 4) * TS + 2, A.floor + 14)); L.boatSpawned = true;
    spawnParts(16, A.x1 - 16, A.floor - 8, { color: ['#8fd9d0', '#c8f2ea'], angle: -Math.PI / 2, spread: 1.2, speed: [1, 3], life: [14, 30] });
  }
  return { CRIAS, MAX_HP, PHASE_HP, create, update, draw, drawFront, puppet, figura, hit, won, cam, skip, restart, song, arena, vulnerable };
})();
