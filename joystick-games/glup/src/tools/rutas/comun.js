// GLUP — piezas comunes de las rutas del bot (una ruta por nivel en tools/rutas/NN.js). { reach: [col, fila] }
// lleva a Nila a pisar esa celda (la fila es la del suelo que pisa); las demás acciones son de Bigotes. Ver tools/bot.js.
'use strict';
const R = (x, y, o) => Object.assign({ reach: [x, y] }, o || {});
const D = (name, ...args) => ({ do: name, args });
// Spit straight up: hold {up} with {fish}; the aim latches for a few frames after {up} is let go.
const UP = [{ hold: { fish: 1, up: 1 }, n: 2 }, { hold: { up: 1 }, n: 1 }, { wait: 10 }];
// Jump, flap and keep {fish} held: with water in the mouth the jet holds Nila up while she drifts `dir`. The jet
// holds her height, so to come down onto something on the way she sinks with {down}: `dip` = [from, to], the frames
// of the hover (counted from the first with {fish}) during which {down} is held too.
const HOVER = (dir, n = 150, run = 0, dip = null) => {
  const d = dir < 0 ? { left: 1 } : { right: 1 }, jet = Object.assign({ fish: 1 }, d);
  const fly = dip ? [{ hold: jet, n: dip[0] }, { hold: Object.assign({ down: 1 }, jet), n: dip[1] - dip[0] }, { hold: jet, n: n - dip[1] }] : [{ hold: jet, n }];
  return [...(run ? [{ hold: d, n: run }] : []), { hold: Object.assign({ jump: 1 }, d), n: 16 }, { hold: d, n: 1 }, { hold: Object.assign({ jump: 1 }, d), n: 12 }, ...fly];
};
// Free-form step: runs `fn(g)` frame by frame (for timing that depends on where Nila is).
const DO = (label, fn) => ({ check: g => { const r = fn(g); return r === undefined ? true : r; }, label });
// Belly-flop once Nila is past `px` (pixels) while walking `dir`: walk off, wait out the coyote time (unless `fall` is false), then {down}+{jump}.
const POUND_AT = (px, dir = 1, fall = true) => DO('panzazo en x=' + px, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 };
  for (let n = 0; n < 200 && (dir > 0 ? g.P.x < px : g.P.x > px); n++) g.frame(d);
  if (fall) { for (let n = 0; n < 30 && g.P.onGround; n++) g.frame(d); for (let n = 0; n < 8 && !g.P.onGround; n++) g.frame({}); } // past the coyote time, or the press is a plain jump
  else g.frame({});
  g.frame({ down: 1, jump: 1 }); g.frame({ down: 1, jump: 1 });
  for (let n = 0; n < 60 && g.P.pound; n++) g.frame({ down: 1 });
  return g.P.pound ? 'no aterrizó el panzazo' : true;
});
// Search moves that keep the water jet on.
const JET = { extra: [-1, 0, 1].map(dir => ({ dir, jump: 0, hold: { fish: 1 } })) };
// Fill Bigotes with water facing `dir`: spit out whatever else he holds (a bug that flew in) and sip until full.
const WATER = dir => DO('agua', g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 };
  for (let tries = 0; tries < 4; tries++) {
    if (g.P.held && g.P.held.kind === 'agua' && g.P.held.amount >= 1) return true;
    if (g.P.held) { g.run(d, 1); g.run({}, 1); g.run({ fish: 1 }, 2); g.run({}, 12); continue; }
    g.run(d, 1); g.run({}, 2);
    for (let n = 0; n < 60 && !g.P.held; n++) g.frame({ fish: 1 });
    g.run({}, 2);
  }
  return g.P.held && g.P.held.kind === 'agua' || 'no traga agua';
});
// Jump and flap at the top, drifting `dir`.
const FLAP = (dir, n = 14) => { const d = dir < 0 ? { left: 1 } : dir > 0 ? { right: 1 } : {}; return [{ hold: Object.assign({ jump: 1 }, d), n: 16 }, { hold: d, n: 1 }, { hold: Object.assign({ jump: 1 }, d), n }]; };
// Wait until the nearest live `kind` walks away `dir`, run after it and slide into it (the slide flips crabs over).
const BOWL = (kind, dir = 1, maxGap = 1e9) => DO('resbalón contra ' + kind, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 };
  const e = () => g.L.ents.filter(o => !o.dead && o.kind === kind).sort((a, b) => Math.abs(a.x - g.P.x) - Math.abs(b.x - g.P.x))[0];
  for (let n = 0; n < 900; n++) { const c = e(); if (!c) return 'no hay ' + kind; const gp = dir > 0 ? c.x - g.P.x : g.P.x - c.x; if (c.dir === dir && gp > 50 && gp < maxGap) break; g.frame({}); }
  for (let n = 0; n < 200; n++) {
    const c = e(); if (!c) return 'no hay ' + kind;
    const gap = dir > 0 ? c.x - (g.P.x + g.P.w) : g.P.x - (c.x + c.w);
    if (gap < 30 && Math.abs(g.P.vx) > 1.2) { g.frame(Object.assign({ down: 1 }, d)); for (let k = 0; k < 24 && !c.flipped; k++) g.frame(Object.assign({ down: 1 }, d)); g.run({}, 4); return c.flipped || 'no lo volteó'; }
    const ahead = Math.floor((dir > 0 ? g.P.x + g.P.w + 10 : g.P.x - 10) / 16), below = Math.floor((g.P.y + g.P.h + 2) / 16);
    if (g.P.onGround && g.tileAt(ahead, below) === '~') { g.run(Object.assign({ jump: 1 }, d), 14); continue; }
    g.frame(d);
  }
  return 'no llegó';
});
// Run `dir` and slide once past `px`; then keep running for `n` frames (a low roof keeps the slide going).
const SLIDE_AT = (px, dir = 1, n = 200) => DO('resbalón en x=' + px, g => {
  const d = dir < 0 ? { left: 1 } : { right: 1 };
  for (let k = 0; k < 200 && (dir > 0 ? g.P.x < px : g.P.x > px); k++) g.frame(d);
  g.frame(Object.assign({ down: 1 }, d)); if (!(g.P.slide > 0)) return 'no resbala';
  g.run(d, n);
});
// Stand still until `cond(g)` holds (at most `n` frames).
const UNTIL = (label, cond, n = 3000) => DO(label, g => { for (let k = 0; k < n && !cond(g); k++) g.frame({}); return cond(g) || 'nunca: ' + label; });
// The heron fight, played frame by frame with real inputs. The bot reads her state (it is allowed to know
// what the telegraphs say) and, every frame: gets out of any marked danger (the dive's shadow, the stab's
// reach, the darts' crosses, the falling rocks), counters the wing gust with a puff, and otherwise fetches a
// stone and returns it: up at her when she flies, a charged spit when her beak is stuck or she is dizzy.
const HERON = DO('pelea con la Garza', g => {
  const side = d => d < 0 ? { left: 1 } : d > 0 ? { right: 1 } : {};
  const VULN = { hover: 1, aim: 1, rise: 1, rainUp: 1, fanAir: 1, lock: 1 }, OPEN = { stuck: 1, stagger: 1, land: 1 };
  let charging = 0, sucking = 0, stuckT = 0, lastX = 0, deaths = 0, wasDead = false;
  const log = [];
  for (let n = 0; n < 40000; n++) {
    const b = g.L.boss, P = g.P, L = g.L;
    if (L.boatSpawned) return deaths ? 'Nila murió ' + deaths + ' veces' : true;
    if (P.dead) { if (!wasDead) { deaths++; wasDead = true; log.push('muerte en ' + (b && b.state) + ' fase ' + (b && b.phase)); } charging = 0; sucking = 0; g.frame({}); continue; }
    wasDead = false;
    if (!b || b.dead || !b.fight || b.lock || g.Game.fadeTo || ['intro', 'final', 'dying', 'leave', 'return'].includes(b.state)) { charging = 0; sucking = 0; g.frame({}); continue; }
    const c0 = L.w - 24, floor = (L.h - 3) * 16, wet = b.phase >= 3 || L.bossCk >= 3;
    const lo = (c0 + (wet ? 3 : 1)) * 16 + 12, hi = (L.w - (wet ? 4 : 2)) * 16 - 12;
    const px = P.x + 5, bc = b.x + 15, st = b.state, onFloor = b.y + 30 >= floor - 2;
    // ---- Danger: intervals of x where Nila's centre must not be.
    const zones = [];
    if (st === 'lock' || st === 'plunge') zones.push([b.tx - 32, b.tx + 32]);
    if (st === 'aim' && b.dive === 2) zones.push([bc - 34, bc + 34]);
    if (onFloor && !['stuck', 'stagger', 'reel2'].includes(st)) zones.push([b.x - 10, b.x + 40]);
    if (st === 'windup' || st === 'stab') { const d = b.sdir || b.dir; zones.push(d < 0 ? [b.x - 62, b.x + 40] : [b.x - 10, b.x + 92]); }
    if (st === 'walk' && P2(b) === 'stab') zones.push([bc - 40, bc + 40]);
    if (b.aims) for (const q of b.aims) zones.push([q.sx - 18, q.sx + 18]);
    for (const e of L.ents) if (!e.dead && ((e.kind === 'plume' && !e.stuck) || e.hazard)) { const x = e.kind === 'plume' ? e.sx : e.x + 6, r = e.kind === 'plume' ? 18 : 16; zones.push([x - r, x + r]); }
    if (b.rain) for (const x of b.rain) zones.push([x - 16, x + 16]);
    if (st === 'rainUp' && b.st < 30) zones.push([px - 20, px + 20]);
    const bad = x => zones.some(([a, c]) => x > a && x < c) || x < lo || x > hi;
    const safeNear = x => { x = Math.max(lo, Math.min(hi, x)); if (!bad(x)) return x; for (let d = 2; d < 400; d += 2) { if (!bad(x + d)) return x + d; if (!bad(x - d)) return x - d; } return x; };
    const go = (x, extra = {}) => {
      const d = x - px; const inp = Object.assign({}, Math.abs(d) > 2 ? side(d) : {}, extra);
      // Blocked by a crate: hop onto it.
      if (Math.abs(d) > 6 && P.onGround && Math.abs(P.x - lastX) < .05 && !P.crouch) { if (++stuckT > 3) { inp.jump = 1; stuckT = 0; } } else stuckT = 0;
      lastX = P.x; g.frame(inp);
    };
    // ---- A charge in progress: keep holding, let go when full (or when the window closes).
    if (charging) {
      charging++;
      const open = OPEN[st] || VULN[st];
      if (P.charge >= 40 || !open || charging > 70 || !P.held) { charging = 0; g.frame({}); g.frame({}); continue; }
      if (bad(px)) { charging = 0; g.frame({}); continue; }
      g.frame({ fish: 1 }); continue;
    }
    // ---- The wing gust: empty the mouth, face her and puff back.
    if ((st === 'gustWind' && b.st > 14) || st === 'gust') {
      const toward = bc > px ? 1 : -1;
      if (P.held && P.onGround) { g.frame({}); g.frame({ down: 1, fish: 1 }); g.frame({}); continue; }
      if (!P.held && P.puffCd === 0 && !(P.puffWind > 0)) { if (P.dir !== toward) { g.frame(side(toward)); continue; } g.frame({ puff: 1 }); continue; }
      g.frame({}); continue;
    }
    // ---- Out of harm's way first.
    if (bad(px)) { sucking = 0; go(safeNear(px)); continue; }
    // ---- A stone in the mouth: return it.
    if (P.held) {
      // In the air she sidesteps a stone unless she is committed (aiming, shaking the nest, throwing darts),
      // or has not been hit yet at all.
      const open = OPEN[st] && b.inv === 0, fly = b.inv === 0 && !onFloor && (['aim', 'rainUp', 'fanAir'].includes(st) || (st === 'hover' && b.hp === b.maxHp) || (VULN[st] && b.dodgeCd > 0));
      if (open) {
        const left = st === 'stuck' ? (b.phase === 2 ? 110 : 80) - b.st : st === 'stagger' ? 140 - b.st : 30 - b.st;
        const want = bc + (px < bc ? -52 : 52), dist = Math.abs(px - bc);
        if (dist > 72 || dist < 30) { go(safeNear(want)); continue; }
        const toward = bc > px ? 1 : -1;
        if (P.dir !== toward) { g.frame(side(toward)); continue; }
        if (left > 56 && g.Save.has('guindilla')) { charging = 1; g.frame({ fish: 1 }); continue; }
        g.frame({ fish: 1 }); g.frame({}); continue;
      }
      if (fly) {
        const mx = px + P.dir * 2;
        if (Math.abs(bc - mx) < 7) { g.frame({ fish: 1, up: 1 }); g.frame({ up: 1 }); continue; }
        go(safeNear(bc - P.dir * 2)); continue;
      }
      // She parries now: wait at a distance, baiting the stab when it is due.
      idle(b, P, px, bc, go, safeNear, lo, hi); continue;
    }
    // ---- Empty mouth: fetch the nearest stone.
    const rocks = L.ents.filter(e => !e.dead && e.kind === 'rock' && !e.hazard && e.x + 6 > lo - 10 && e.x + 6 < hi + 10 && !bad(e.x + 6)).sort((a, c) => Math.abs(a.x - P.x) - Math.abs(c.x - P.x));
    if (!rocks.length) { sucking = 0; idle(b, P, px, bc, go, safeNear, lo, hi); continue; }
    const r = rocks[0], rx = r.x + 6;
    if (r.y + r.h < P.y) {
      // Up on a branch or the pile: stand under it and sip upwards.
      const want = rx - P.dir * 2;
      if (Math.abs(want - px) > 4 && !sucking) { go(safeNear(want)); continue; }
      if (++sucking > 50) { sucking = 0; g.frame({}); continue; }
      g.frame({ fish: 1, up: 1 }); continue;
    }
    const d = rx - px, dist = Math.abs(d), toward = Math.sign(d) || 1;
    if (!sucking && (dist > 50 || dist < 28)) { go(safeNear(rx - toward * 40)); continue; }
    if (!sucking && P.dir !== toward) { g.frame(side(toward)); continue; }
    if (++sucking > 50) { sucking = 0; g.frame({}); g.frame({}); continue; }
    g.frame({ fish: 1 });
  }
  return 'la pelea no acabó: ' + log.join('; ');
  // Phase II plan (mirrors garza.js): what she will do next.
  function P2(b) { return ['stab', 'fan', 'stab', 'gust'][b.pat % 4]; }
  // Nothing to shoot yet: in phase II keep just inside her stab range when a stab is due (so she stabs and
  // misses), hop over her if cornered; otherwise wait at a safe distance.
  function idle(b, P, px, bc, go, safeNear, lo, hi) {
    if (b.phase === 2 && b.state === 'walk') {
      const away = px < bc ? -1 : 1, room = away < 0 ? px - lo : hi - px;
      if (room < 70 && Math.abs(px - bc) < 90) {
        // Cornered: jump over her.
        if (P.onGround && Math.abs(px - bc) < 58) { g.frame(Object.assign({ jump: 1 }, side(-away))); for (let k = 0; k < 14; k++) g.frame(Object.assign({ jump: 1 }, side(-away))); g.frame(side(-away)); for (let k = 0; k < 12; k++) g.frame(Object.assign({ jump: 1 }, side(-away))); for (let k = 0; k < 40 && !P.onGround; k++) g.frame(side(-away)); return; }
        go(bc - away * 40); return;
      }
      if (P2(b) === 'stab') { go(safeNear(bc + away * 50)); return; }
      go(safeNear(bc + away * 96)); return;
    }
    go(safeNear(px));
  }
});
// Ride the raft to the right, puffing backwards, and hop up for any cría that passes overhead.
const RAFT = DO('balsa', g => {
  const raft = g.L.ents.find(e => e.kind === 'raft'); if (!raft) return 'sin balsa';
  for (let n = 0; n < 900; n++) {
    const P = g.P; if (P.dead) return 'Nila se cayó';
    if (P.onGround && P.carrier === raft && Math.abs(raft.vx) < .6 && raft.x > 850) return true;
    if (!P.onGround) { const t = raft.x + 7; g.frame(Object.assign({ jump: 1 }, P.x < t - 1 ? { right: 1 } : P.x > t + 1 ? { left: 1 } : {})); continue; }
    const cria = g.L.ents.find(e => e.kind === 'pearl' && e.y < P.y && Math.abs(e.x + 4 - (P.x + 5 + raft.vx * 12)) < 9);
    if (cria) { g.frame({ jump: 1 }); continue; }
    if (raft.vx < .6) { g.frame({ left: 1 }); g.run({}, 3); g.frame({ puff: 1 }); g.run({}, 8); continue; }
    g.frame({});
  }
  return 'la balsa no llegó';
});
const near = (kind, side, fromX) => ({ reach: require('../bot').beside(kind, side, fromX), tol: 1 });
// Talk to the level's teacher: walk up beside them (side -2 = two tiles to their left), press {up}, read every line
// and, unless `learns` is false (a quest still pending), check that Bigotes learned the trick.
const TALK = (o = {}) => ({ talk: Object.assign({ side: -2, learns: true }, o) });
// The hooks are a liana: {fish} held keeps Bigotes on the line, and to go on to the next hook a player lets go
// and presses again, so Bigotes lunges for the marked one (`dir` steers the mark). Runs until `done(g)`, which
// usually wants Nila hanging from a given hook with the swing settled (see `hangingAt`).
const settled = P => !P.rope || (Math.abs(P.rope.w * P.rope.R) < .35 && Math.abs(P.rope.th) < .1);   // still AND hanging plumb (not at the top of a swing)
const hangingAt = (col, row) => g => { const P = g.P, a = P.grapple; return !!(P.hanging && a && Math.floor((a.x + 5) / 16) === col && (row === undefined || Math.floor(a.y / 16) === row) && settled(P)); };
function hookFrames(g, done, o = {}) {
  const n = o.n || 500, hp0 = g.P.hp, steer = o.dir ? (o.dir < 0 ? { left: 1 } : { right: 1 }) : {};
  for (let k = 0; k < n; k++) {
    if (done(g)) return true;
    const P = g.P;
    if (P.grapple && P.hanging && settled(P) && P.target && !P.castTo && !(o.stop && o.stop(P.grapple))) { g.frame(Object.assign({}, steer)); g.frame(Object.assign({ fish: 1 }, steer)); continue; }
    g.frame(Object.assign({ fish: 1 }, P.grapple ? {} : (o.keys || {})));
    if (P.dead || P.hp < hp0) return 'daño en los anzuelos';
  }
  return done(g) || 'no llegó al anzuelo (x ' + (g.P.x / 16).toFixed(1) + (g.P.grapple ? ', en ' + Math.floor((g.P.grapple.x + 5) / 16) : '') + ')';
}
module.exports = { hookFrames, hangingAt, settled, R, D, UP, HOVER, DO, POUND_AT, JET, WATER, FLAP, BOWL, SLIDE_AT, UNTIL, HERON, RAFT, near, TALK };
