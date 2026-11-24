// Bloom Hop puzzle rules: the single source of truth (see design/GAME_DESIGN.md,
// "Rules (exact)"). Pure functions, shared by the game, the solver, the
// generator and the node tools.

export const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
export const DIR_KEYS = ['U', 'D', 'L', 'R'];
const HOP_RANGE = 3, TONGUE_RANGE = 3, BEETLE_RANGE = 3, LEAP_RANGE = 6;

// Build lookup tables for a level (cached on the level object).
export function prep(level) {
  if (level._prep) return level._prep;
  const { w, h } = level;
  const padAt = new Int16Array(w * h).fill(-1);
  const turtleAt = new Int16Array(w * h).fill(-1);
  level.pads.forEach(([x, y], i) => { padAt[y * w + x] = i; });
  (level.turtles || []).forEach(([x, y], i) => { turtleAt[y * w + x] = i; });
  let lcm = 1;
  for (const [, , up, down] of level.turtles || []) lcm = lcmOf(lcm, up + down);
  const p = { padAt, turtleAt, lcm };
  Object.defineProperty(level, '_prep', { value: p, enumerable: false });
  return p;
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function lcmOf(a, b) { return a / gcd(a, b) * b; }

export function initState(level) {
  const n = level.pads.length;
  let flies = 0;
  for (let i = 1; i < n; i++) flies |= 1 << i;
  return {
    fx: level.pads[0][0], fy: level.pads[0][1],
    pips: level.pads.map(p => p[2]),
    flies,
    beetles: [...(level.beetles || [])].sort((a, b) => a - b),
    turn: 0, slot: null, leapArmed: false, fishUsed: 0, status: 'play',
  };
}

export function cloneState(s) {
  return { ...s, pips: s.pips.slice(), beetles: s.beetles.slice() };
}

export function turtleUp(t, T) {
  const [, , up, down, phase] = t;
  return ((T + phase) % (up + down)) < up;
}

// How many more turns (hops) this surfaced turtle stays up after turn T,
// i.e. how many hops it will hold you if you land on it now. 0 = it dives as
// you land (a dunk).
export function turtleHold(t, T) {
  let n = 0;
  while (n < 8 && turtleUp(t, T + n + 1)) n++;
  return n;
}

function inGrid(L, x, y) { return x >= 0 && y >= 0 && x < L.w && y < L.h; }
export function padIndexAt(L, x, y) { return inGrid(L, x, y) ? prep(L).padAt[y * L.w + x] : -1; }
export function turtleIndexAt(L, x, y) { return inGrid(L, x, y) ? prep(L).turtleAt[y * L.w + x] : -1; }
export function hasBeetle(s, i) { return s.beetles.includes(i); }

// What's in a cell for movement purposes at the state's turn.
function cellInfo(L, s, x, y) {
  if (!inGrid(L, x, y)) return { off: true };
  const pi = padIndexAt(L, x, y);
  if (pi >= 0 && s.pips[pi] > 0) {
    return hasBeetle(s, pi) ? { pad: pi, beetle: true } : { pad: pi, landable: true };
  }
  const ti = turtleIndexAt(L, x, y);
  if (ti >= 0 && turtleUp(L.turtles[ti], s.turn)) return { turtle: ti, landable: true };
  return { water: true };
}

// Result of hopping in direction d: { x, y, dist, pad?, turtle? } or
// { blocked: {x, y, pad} } or null (nothing in range).
export function hopTarget(L, s, d) {
  const [dx, dy] = DIRS[d];
  for (let k = 1; k <= HOP_RANGE; k++) {
    const x = s.fx + dx * k, y = s.fy + dy * k;
    const c = cellInfo(L, s, x, y);
    if (c.off) return null;
    if (c.beetle) return { blocked: { x, y, pad: c.pad } };
    if (c.landable) return { x, y, dist: k, pad: c.pad, turtle: c.turtle };
  }
  return null;
}

// Tongue in direction d: null (no beetle in reach), or
// { beetle: padIndex, bx, by, to: padIndex | -1, tx, ty } (to -1 = wobble).
export function flickInfo(L, s, d) {
  const [dx, dy] = DIRS[d];
  for (let k = 1; k <= TONGUE_RANGE; k++) {
    const x = s.fx + dx * k, y = s.fy + dy * k;
    if (!inGrid(L, x, y)) return null;
    const pi = padIndexAt(L, x, y);
    if (pi >= 0 && s.pips[pi] > 0 && hasBeetle(s, pi)) {
      for (let j = 1; j <= BEETLE_RANGE; j++) {
        const qx = x + dx * j, qy = y + dy * j;
        if (!inGrid(L, qx, qy)) break;
        const qi = padIndexAt(L, qx, qy);
        if (qi >= 0 && s.pips[qi] > 0) {
          if (hasBeetle(s, qi)) break;
          return { beetle: pi, bx: x, by: y, to: qi, tx: qx, ty: qy };
        }
      }
      return { beetle: pi, bx: x, by: y, to: -1 };
    }
  }
  return null;
}

// Leap targets in direction d: landable cells 1..6 away, nearest first.
export function leapTargets(L, s, d) {
  const [dx, dy] = DIRS[d];
  const out = [];
  for (let k = 1; k <= LEAP_RANGE; k++) {
    const x = s.fx + dx * k, y = s.fy + dy * k;
    const c = cellInfo(L, s, x, y);
    if (c.off) break;
    if (c.landable) out.push({ x, y, dist: k, pad: c.pad, turtle: c.turtle });
  }
  return out;
}

export function frogPad(L, s) {
  const pi = padIndexAt(L, s.fx, s.fy);
  return pi >= 0 && s.pips[pi] > 0 ? pi : -1;
}
export function frogTurtle(L, s) { return frogPad(L, s) >= 0 ? -1 : turtleIndexAt(L, s.fx, s.fy); }

export function canMend(L, s) {
  if (s.status !== 'play' || s.slot !== 'mend' || s.leapArmed) return false;
  const pi = frogPad(L, s);
  return pi >= 0 && s.pips[pi] < 3;
}
export function canArmLeap(L, s) {
  return s.status === 'play' && s.slot === 'leap' && !s.leapArmed &&
    DIR_KEYS.some(d => leapTargets(L, s, d).length > 0);
}

// Move the frog to (x, y): pip loss on the pad left, fly, fish.
function moveFrog(L, s, x, y) {
  const from = frogPad(L, s);
  if (from >= 0) s.pips[from]--;
  s.fx = x; s.fy = y;
  const pi = padIndexAt(L, x, y);
  if (pi >= 0 && s.pips[pi] > 0) {
    s.flies &= ~(1 << pi);
    if (!s.slot && L.fish) {
      for (let f = 0; f < L.fish.length; f++) {
        if (s.fishUsed & (1 << f)) continue;
        const [fx, fy] = L.fish[f];
        if (Math.abs(fx - x) + Math.abs(fy - y) === 1) {
          s.slot = L.fish[f][2]; s.fishUsed |= 1 << f; s.gotFish = f;
          break;
        }
      }
    }
  }
}

function endTurn(L, s) {
  s.turn++;
  if (s.flies === 0) { s.status = 'won'; return; }
  const ti = frogTurtle(L, s);
  if (ti >= 0 && !turtleUp(L.turtles[ti], s.turn)) s.status = 'dunked';
}

// Apply a token; returns a new state or throws on an illegal move.
// The returned state may carry transient info: gotFish (fish index).
export function apply(L, s0, tok) {
  if (s0.status !== 'play') throw new Error('not playing');
  const s = cloneState(s0);
  delete s.gotFish;
  const c = tok[0];
  if (DIRS[tok] ) {
    if (s.leapArmed) throw new Error('leap armed');
    const t = hopTarget(L, s, tok);
    if (!t || t.blocked) throw new Error('illegal hop ' + tok);
    moveFrog(L, s, t.x, t.y);
    endTurn(L, s);
  } else if (c === 't' && DIRS[tok[1]]) {
    if (s.leapArmed) throw new Error('leap armed');
    const f = flickInfo(L, s, tok[1]);
    if (!f || f.to < 0) throw new Error('no flick ' + tok);
    s.beetles = s.beetles.map(b => (b === f.beetle ? f.to : b)).sort((a, b) => a - b);
    endTurn(L, s);
  } else if (tok === 'M') {
    if (!canMend(L, s)) throw new Error('cannot mend');
    s.pips[frogPad(L, s)]++; s.slot = null;
  } else if (tok === 'E') {
    if (!canArmLeap(L, s)) throw new Error('cannot arm');
    s.leapArmed = true;
  } else if (tok === 'X') {
    if (!s.leapArmed) throw new Error('not armed');
    s.leapArmed = false;
  } else if (c === 'J' && DIRS[tok[1]]) {
    if (!s.leapArmed) throw new Error('not armed');
    const n = parseInt(tok.slice(2), 10);
    const t = leapTargets(L, s, tok[1])[n - 1];
    if (!t) throw new Error('no leap target ' + tok);
    s.slot = null; s.leapArmed = false;
    moveFrog(L, s, t.x, t.y);
    endTurn(L, s);
  } else throw new Error('bad token ' + tok);
  return s;
}

export function tryApply(L, s, tok) {
  try { return apply(L, s, tok); } catch { return null; }
}

// Turn-costing moves (hops and real flicks), optionally with power-ups.
export function legalMoves(L, s, { power = false, dunk = false } = {}) {
  if (s.status !== 'play') return [];
  const out = [];
  if (!s.leapArmed) {
    for (const d of DIR_KEYS) {
      const t = hopTarget(L, s, d);
      if (t && !t.blocked) out.push(d);
      const f = flickInfo(L, s, d);
      if (f && f.to >= 0) out.push('t' + d);
    }
  }
  if (power) {
    if (canMend(L, s)) out.push('M');
    if (canArmLeap(L, s)) out.push('E');
    if (s.leapArmed) {
      out.push('X');
      for (const d of DIR_KEYS) leapTargets(L, s, d).forEach((_, i) => out.push('J' + d + (i + 1)));
    }
  }
  if (dunk) return out;
  return out.filter(tok => !isDunkMove(L, s, tok));
}

export function isDunkMove(L, s, tok) {
  if (tok === 'M' || tok === 'E' || tok === 'X') return false;
  const r = tryApply(L, s, tok);
  return !!r && r.status === 'dunked';
}

export function isStuck(L, s) {
  return s.status === 'play' && s.flies !== 0 &&
    legalMoves(L, s, { power: true }).length === 0;
}

export function fliesLeft(s) {
  let n = 0, f = s.flies;
  while (f) { n += f & 1; f >>>= 1; }
  return n;
}

// A compact key for memoising solver states (power-ups ignored).
export function stateKey(L, s) {
  return s.fx + ',' + s.fy + '|' + s.pips.join('') + '|' + s.flies + '|' +
    s.beetles.join('.') + '|' + (s.turn % prep(L).lcm) + '|' + (s.slot || '') +
    (s.leapArmed ? '!' : '') + '|' + s.fishUsed;
}

export function parse(str) { return str.trim() ? str.trim().split(/\s+/) : []; }

export function replay(L, tokens) {
  let s = initState(L);
  for (const t of tokens) s = apply(L, s, t);
  return s;
}

// Mirror/rotate a level and its solution (8 symmetries; k in 0..7).
export function transformLevel(L, k) {
  const { w, h } = L;
  const swap = k & 4;
  const fx = k & 1, fy = k & 2;
  const nw = swap ? h : w, nh = swap ? w : h;
  const tp = ([x, y]) => {
    let a = x, b = y;
    if (swap) [a, b] = [b, a];
    if (fx) a = nw - 1 - a;
    if (fy) b = nh - 1 - b;
    return [a, b];
  };
  const td = d => {
    let [dx, dy] = DIRS[d];
    if (swap) [dx, dy] = [dy, dx];
    if (fx) dx = -dx;
    if (fy) dy = -dy;
    return DIR_KEYS.find(k2 => DIRS[k2][0] === dx && DIRS[k2][1] === dy);
  };
  const tt = tok => {
    if (DIRS[tok]) return td(tok);
    if (tok[0] === 't' || tok[0] === 'J') return tok[0] + td(tok[1]) + tok.slice(2);
    return tok;
  };
  return {
    ...L, w: nw, h: nh,
    pads: L.pads.map(p => [...tp(p), p[2]]),
    turtles: (L.turtles || []).map(t => [...tp(t), t[2], t[3], t[4]]),
    fish: (L.fish || []).map(f => [...tp(f), f[2]]),
    reeds: (L.reeds || []).map(r => tp(r)),
    solution: L.solution ? parse(L.solution).map(tt).join(' ') : L.solution,
  };
}
