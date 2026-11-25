// Bloom Hop level generator: build a pond by walking the frog through it, so
// a winning route exists by construction, then replay it through rules.js.
// Creatures (turtles, beetles and flicks) are placed during the walk.
import { DIRS, DIR_KEYS, replay } from './rules.js';

// cfg: { w, h, pads, turtles, beetles, fish, fishGives, pSink, reeds, maxSteps }
export function generateCandidate(cfg, rng) {
  const W = newWorld(cfg, rng);
  for (let step = 0; step < (cfg.maxSteps || 90); step++) {
    if (done(W, cfg)) return finish(W, cfg, rng);
    // Keep only the steps that don't break a constraint, then pick one.
    const opts = [];
    for (const o of options(W, cfg)) {
      const n = tryOption(W, o, cfg, rng);
      if (!n) continue;
      // Eating the last fly before everything is placed would win early.
      if (n.pads.length >= cfg.pads && n.pads.every(p => p.visited) && !done(n, cfg)) continue;
      opts.push({ weight: o.weight, n });
    }
    if (!opts.length) return { fail: 'no moves' };
    Object.assign(W, weightedPick(opts, rng).n);
  }
  return done(W, cfg) ? finish(W, cfg, rng) : { fail: 'too long' };
}

function newWorld(cfg, rng) {
  const { w, h } = cfg;
  const x = Math.floor(rng() * w), y = Math.floor(rng() * h);
  const cell = new Array(w * h).fill(null);
  cell[y * w + x] = { t: 'pad', i: 0 };
  return {
    w, h, cell,
    pads: [{ x, y, dep: 0, sunk: false, visited: true }],
    turtles: [], beetles: [], frog: { x, y }, turn: 0, tokens: [], beetlesMade: 0,
  };
}

function clone(W) {
  return {
    ...W,
    cell: W.cell.slice(),
    pads: W.pads.map(p => ({ ...p })),
    turtles: W.turtles.map(t => ({ ...t, cons: new Map(t.cons) })),
    beetles: W.beetles.slice(), frog: { ...W.frog }, tokens: W.tokens.slice(),
  };
}

function done(W, cfg) {
  return W.pads.length >= cfg.pads && W.pads.every(p => p.visited) &&
    W.turtles.length >= (cfg.turtles || 0) && W.beetlesMade >= (cfg.beetles || 0) &&
    (!cfg.turtles || W.turtles.every(t => t.used)) &&
    (!cfg.flickTwice || W.flickedTwice);
}

function at(W, x, y) { return W.cell[y * W.w + x]; }
function inGrid(W, x, y) { return x >= 0 && y >= 0 && x < W.w && y < W.h; }
function setCons(t, T, up) {
  if (t.cons.has(T)) return t.cons.get(T) === up;
  t.cons.set(T, up);
  return true;
}

// Every possible next step as a small plan: { kind, d, k, weight, ... }.
function options(W, cfg) {
  const out = [];
  const needPads = W.pads.length < cfg.pads;
  const needTurtles = W.turtles.length < (cfg.turtles || 0);
  const needBeetles = W.beetlesMade < (cfg.beetles || 0);
  const T = W.turn;
  for (const d of DIR_KEYS) {
    const [dx, dy] = DIRS[d];
    // Hops: scan 1..3 cells; branch on unassigned cells and free turtles.
    for (let k = 1; k <= 3; k++) {
      const x = W.frog.x + dx * k, y = W.frog.y + dy * k;
      if (!inGrid(W, x, y)) break;
      const c = at(W, x, y);
      if (c === 'water') continue;
      if (c === null) {
        if (needPads) out.push({ kind: 'hopNew', d, k, weight: k === 1 ? 3 : k === 2 ? 4 : 2 });
        if (needTurtles && W.pads.length >= 2) out.push({ kind: 'hopNewTurtle', d, k, weight: 3 });
        continue; // or pass over it (it becomes water)
      }
      if (c.t === 'pad') {
        const p = W.pads[c.i];
        if (p.sunk) continue;
        if (W.beetles.includes(c.i)) break;
        out.push({ kind: 'hopPad', d, k, weight: p.visited ? 1 : 6 });
        break;
      }
      if (c.t === 'turtle') {
        const t = W.turtles[c.i];
        const s = t.cons.get(T);
        if (s === true) { out.push({ kind: 'hopTurtle', d, k, weight: 2 }); break; }
        if (s === undefined) out.push({ kind: 'hopTurtle', d, k, weight: 2 });
        continue; // passing it means it's down now
      }
    }
    // Flicks: the first beetle in 1..3, or a new beetle on a new pad.
    for (let k = 1; k <= 3; k++) {
      const x = W.frog.x + dx * k, y = W.frog.y + dy * k;
      if (!inGrid(W, x, y)) break;
      const c = at(W, x, y);
      if (c && c.t === 'pad' && !W.pads[c.i].sunk && W.beetles.includes(c.i)) {
        out.push({ kind: 'flick', d, k, weight: cfg.flickTwice && !W.flickedTwice ? 4 : 1 });
        break;
      }
      if (c === null && needBeetles && W.pads.length < cfg.pads) {
        out.push({ kind: 'flickNew', d, k, weight: 5 });
      }
    }
  }
  return out;
}

function weightedPick(opts, rng) {
  let total = 0;
  for (const o of opts) total += o.weight;
  let r = rng() * total;
  for (const o of opts) { r -= o.weight; if (r <= 0) return o; }
  return opts[opts.length - 1];
}

function leavePad(W, cfg, rng) {
  const c = at(W, W.frog.x, W.frog.y);
  if (!c || c.t !== 'pad') return true;
  const p = W.pads[c.i];
  p.dep++;
  if (p.dep >= 3 || rng() < cfg.pSink) p.sunk = true;
  return true;
}

function landOnPad(W, i) {
  const p = W.pads[i];
  p.visited = true;
  W.frog = { x: p.x, y: p.y };
}

function endTurn(W) {
  W.turn++;
  const c = at(W, W.frog.x, W.frog.y);
  if (c && c.t === 'turtle') return setCons(W.turtles[c.i], W.turn, true);
  return true;
}

// Apply a plan to a copy of the world; null if it breaks a constraint.
function tryOption(W0, o, cfg, rng) {
  const W = clone(W0);
  const [dx, dy] = DIRS[o.d];
  const T = W.turn;
  if (o.kind.startsWith('hop')) {
    // Cells passed over become water (if unassigned) or must be down (turtles).
    for (let k = 1; k < o.k; k++) {
      const x = W.frog.x + dx * k, y = W.frog.y + dy * k, idx = y * W.w + x;
      const c = W.cell[idx];
      if (c === null) W.cell[idx] = 'water';
      else if (c.t === 'turtle' && !setCons(W.turtles[c.i], T, false)) return null;
    }
    const x = W.frog.x + dx * o.k, y = W.frog.y + dy * o.k, idx = y * W.w + x;
    leavePad(W, cfg, rng);
    if (o.kind === 'hopNew') {
      W.cell[idx] = { t: 'pad', i: W.pads.length };
      W.pads.push({ x, y, dep: 0, sunk: false, visited: true });
      W.frog = { x, y };
    } else if (o.kind === 'hopPad') {
      landOnPad(W, W.cell[idx].i);
    } else {
      let ti;
      if (o.kind === 'hopNewTurtle') {
        ti = W.turtles.length;
        W.cell[idx] = { t: 'turtle', i: ti };
        W.turtles.push({ x, y, cons: new Map(), used: false });
      } else ti = W.cell[idx].i;
      if (!setCons(W.turtles[ti], T, true)) return null;
      W.turtles[ti].used = true;
      W.frog = { x, y };
    }
    W.tokens.push(o.d);
    return endTurn(W) ? W : null;
  }
  // Flicks.
  const bx = W.frog.x + dx * o.k, by = W.frog.y + dy * o.k;
  for (let k = 1; k < o.k; k++) {
    const idx = (W.frog.y + dy * k) * W.w + (W.frog.x + dx * k);
    if (W.cell[idx] === null) W.cell[idx] = 'water';
  }
  let bi;
  if (o.kind === 'flickNew') {
    bi = W.pads.length;
    W.cell[by * W.w + bx] = { t: 'pad', i: bi };
    W.pads.push({ x: bx, y: by, dep: 0, sunk: false, visited: false, beetleStart: true });
    W.beetles.push(bi);
    W.beetlesMade++;
  } else {
    bi = at(W, bx, by).i;
    W.moved = W.moved || {};
    W.moved[bi] = true;
  }
  // Destination: first floating pad beyond the beetle, within 3.
  let dest = -1;
  for (let j = 1; j <= 3; j++) {
    const x = bx + dx * j, y = by + dy * j;
    if (!inGrid(W, x, y)) return null;
    const idx = y * W.w + x, c = W.cell[idx];
    if (c === null) { W.cell[idx] = 'water'; continue; }
    if (c === 'water' || c.t === 'turtle') continue;
    const p = W.pads[c.i];
    if (p.sunk) continue;
    if (W.beetles.includes(c.i)) return null;
    dest = c.i;
    break;
  }
  if (dest < 0) return null;
  // Track beetles moved twice (level 11): the beetle now sitting on dest.
  if (o.kind === 'flick' && W.beetleHistory && W.beetleHistory[bi]) W.flickedTwice = true;
  W.beetleHistory = { ...(W.beetleHistory || {}) };
  W.beetleHistory[dest] = true;
  delete W.beetleHistory[bi];
  W.beetles = W.beetles.map(b => (b === bi ? dest : b));
  W.tokens.push('t' + o.d);
  return endTurn(W) ? W : null;
}

function finish(W, cfg, rng) {
  // Turtle rhythms that satisfy every recorded constraint.
  const turtles = [];
  for (const t of W.turtles) {
    const fits = [];
    const want = (cfg.rhythms || [])[turtles.length];
    for (let up = 1; up <= 3; up++) for (let down = 1; down <= 3; down++)
      if (!want || (want[0] === up && want[1] === down))
      for (let ph = 0; ph < up + down; ph++) {
        let ok = true;
        for (const [T, u] of t.cons) if ((((T + ph) % (up + down)) < up) !== u) { ok = false; break; }
        if (ok) fits.push([up, down, ph]);
      }
    if (!fits.length) return { fail: 'turtle rhythm' };
    // Prefer rhythms with both phases at least 2 long (easier to read).
    const nice = fits.filter(f => f[0] >= 2 && f[1] >= 2);
    const f = (nice.length ? nice : fits)[Math.floor(rng() * (nice.length ? nice : fits).length)];
    turtles.push([t.x, t.y, ...f]);
  }
  const pads = W.pads.map(p => [p.x, p.y, p.dep + (p.sunk ? 0 : 1)]);
  if (pads.some(p => p[2] < 1 || p[2] > 3)) return { fail: 'pips' };
  const startBeetles = W.pads.map((p, i) => i).filter(i => W.pads[i].beetleStart);
  const level = {
    w: W.w, h: W.h, pads, turtles,
    beetles: startBeetles, fish: [], reeds: [],
    solution: W.tokens.join(' '),
  };
  // Fish next to a pad the route lands on in its first half.
  const free = [];
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
    const c = at(W, x, y);
    if (c === null || c === 'water') free.push([x, y]);
  }
  if (cfg.fish) {
    const early = landedPads(level).slice(1, Math.max(2, Math.ceil(W.tokens.length / 2)));
    const spots = free.filter(([x, y]) => early.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) === 1));
    for (let f = 0; f < cfg.fish && spots.length; f++) {
      const [x, y] = spots.splice(Math.floor(rng() * spots.length), 1)[0];
      level.fish.push([x, y, (cfg.fishGives || ['mend'])[f] || 'mend']);
      free.splice(free.findIndex(c => c[0] === x && c[1] === y), 1);
    }
    if (level.fish.length < cfg.fish) return { fail: 'fish' };
  }
  for (let r = 0; r < (cfg.reeds || 0) && free.length; r++) {
    level.reeds.push(free.splice(Math.floor(rng() * free.length), 1)[0]);
  }
  try {
    const s = replay(level, W.tokens);
    if (s.status !== 'won') return { fail: 'replay not won' };
  } catch (e) {
    return { fail: 'replay: ' + e.message };
  }
  return { level };
}

// Cells the stored solution stands on after each move (start first).
function landedPads(level) {
  const pos = [];
  const toks = level.solution.split(' ');
  for (let i = 0; i <= toks.length; i++) {
    const st = replay(level, toks.slice(0, i));
    pos.push([st.fx, st.fy]);
  }
  return pos;
}
