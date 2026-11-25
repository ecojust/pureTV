// Solver for Bloom Hop: depth-first search that never expands a state twice
// (sound for "is a win reachable", and safe against move cycles).
// Never uses power-ups or dunk moves (levels must be solvable without them).
import { legalMoves, apply, stateKey, initState, fliesLeft, canArmLeap, leapTargets, DIR_KEYS, isDunkMove } from './rules.js';

// Moves for the Hint search with power-ups: hops, flicks, Mend, and Leap as one
// macro step 'E+J<d><n>' (never E or X on their own).
function powerMoves(L, s) {
  const out = legalMoves(L, s, { power: true }).filter(t => t !== 'E' && t !== 'X' && t[0] !== 'J');
  if (canArmLeap(L, s)) {
    const armed = apply(L, s, 'E');
    for (const d of DIR_KEYS) leapTargets(L, armed, d).forEach((_, i) => {
      const j = 'J' + d + (i + 1);
      if (!isDunkMove(L, armed, j)) out.push('E+' + j);
    });
  }
  return out;
}
export function applyMove(L, s, m) {
  for (const t of m.split('+')) s = apply(L, s, t);
  return s;
}

// Returns { solvable: true|false|null (cap hit), path: tokens|null, nodes }.
export function solve(L, s0 = initState(L), { cap = 2e6, noFlick = false, power = false } = {}) {
  const seen = new Set();
  let nodes = 0, capped = false;
  const path = [];
  function dfs(s) {
    if (s.status === 'won') return true;
    if (s.status !== 'play') return false;
    if (++nodes > cap) { capped = true; return false; }
    const key = stateKey(L, s);
    if (seen.has(key)) return false;
    seen.add(key);
    // Try moves that eat a fly first: it finds wins faster on average.
    let moves = power ? powerMoves(L, s) : legalMoves(L, s);
    if (noFlick) moves = moves.filter(t => t[0] !== 't');
    moves = moves.map(t => [t, applyMove(L, s, t)]);
    // Fly-eating moves first, then hops before flicks and power-ups.
    const rank = t => (t.length === 1 ? 0 : t[0] === 't' ? 1 : 2);
    moves.sort((a, b) => fliesLeft(a[1]) - fliesLeft(b[1]) || rank(a[0]) - rank(b[0]));
    for (const [t, n] of moves) {
      path.push(t);
      if (dfs(n)) return true;
      path.pop();
      if (capped) return false;
    }
    return false;
  }
  const ok = dfs(s0);
  return { solvable: ok ? true : capped ? null : false, path: ok ? path.slice() : null, nodes };
}

// Count solutions (stops at cap). Returns { count, capped }. Only meaningful
// for levels without turtles or beetles, which have no move cycles.
export function countSolutions(L, { cap = 1000, nodeCap = 2e6 } = {}) {
  const memo = new Map();
  let nodes = 0, capped = false;
  function dfs(s) {
    if (s.status === 'won') return 1;
    if (s.status !== 'play') return 0;
    if (++nodes > nodeCap) { capped = true; return 0; }
    const key = stateKey(L, s) + '#' + s.turn; // turn matters for distinct paths
    if (memo.has(key)) return memo.get(key);
    let n = 0;
    for (const t of legalMoves(L, s)) {
      n += dfs(apply(L, s, t));
      if (n >= cap) { capped = true; break; }
    }
    memo.set(key, n);
    return n;
  }
  const count = dfs(initState(L));
  return { count: Math.min(count, cap), capped };
}

// Win rate of a player who picks a random legal (non-dunk) move each turn.
export function randomWinRate(L, rng, playouts = 1000) {
  let wins = 0;
  for (let i = 0; i < playouts; i++) {
    let s = initState(L);
    const maxTurns = 4 * L.pads.length;
    for (let step = 0; step < maxTurns && s.status === 'play'; step++) {
      const m = legalMoves(L, s);
      if (!m.length) break;
      s = apply(L, s, m[Math.floor(rng() * m.length)]);
    }
    if (s.status === 'won') wins++;
  }
  return wins / playouts;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
