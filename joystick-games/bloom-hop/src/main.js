import { createController } from '../../shared/web/standard-gamepad.js';
import frogGeometry from './assets/sprites/frog/frog.json';
// Bloom Hop: boot, screens, input, animation and drawing.
import * as R from './rules.js';
import { LEVELS } from './levels.js';
import { WILD } from './wild.js';
import { FIXTURES } from './fixtures.js';
import { Audio, setLoopPoints } from './audio.js';
import { Save } from './save.js';
import { hintSearch } from './hint.js';
import { LOOPS } from './loops.js';

setLoopPoints(LOOPS);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const errors = [];
const keepError = message => { errors.push(String(message)); if (errors.length > 5) errors.shift(); };
addEventListener('error', e => keepError(e.message));
addEventListener('unhandledrejection', e => keepError(e.reason?.message ?? e.reason));
const save = new Save();
const audio = new Audio(save);
const FONT = 'Fredoka, system-ui, sans-serif';
const DIR_ANGLE = { U: 0, R: Math.PI / 2, D: Math.PI, L: -Math.PI / 2 };
const AREA_BG = { morning: 'bg-morning', sunset: 'bg-sunset', moon: 'bg-moon' };
const C = {
  cream: '#fff4dc', ink: '#2d3a1e', jade: '#3f8a5a', deep: '#1f5560', pink: '#f08aa8',
  gold: '#f5c542', red: '#e0564a', glow: 'rgba(255,244,220,', panel: 'rgba(255,248,232,0.94)',
};

// ---------- images ----------
const IMG = {};
const IMAGE_LIST = {
  'bg-morning': 'assets/bg/bg-morning.jpg', 'bg-sunset': 'assets/bg/bg-sunset.jpg', 'bg-moon': 'assets/bg/bg-moon.jpg',
  'pad-1': 'assets/sprites/pad-1.png', 'pad-2': 'assets/sprites/pad-2.png', 'pad-3': 'assets/sprites/pad-3.png',
  turtle: 'assets/sprites/turtle.png', fish: 'assets/sprites/fish.png', reeds: 'assets/sprites/reeds.png',
  rock: 'assets/sprites/rock.png', fly: 'assets/items/fly.png', beetle: 'assets/items/beetle.png',
  'pu-mend': 'assets/items/pu-mend.png', 'pu-leap': 'assets/items/pu-leap.png',
  'lotus-bud': 'assets/items/lotus-bud.png', 'lotus-pink': 'assets/items/lotus-pink.png',
  'lotus-white': 'assets/items/lotus-white.png', dragonfly: 'assets/items/dragonfly.png',
  anchor: 'assets/style-anchor.png',
  frog: 'assets/sprites/frog/frog.png',
  'frog-hop-1': 'assets/sprites/frog/frog-hop-1.png',
  'frog-celebrate-1': 'assets/sprites/frog/frog-celebrate-1.png',
  'frog-celebrate-2': 'assets/sprites/frog/frog-celebrate-2.png',
  'frog-idle-1': 'assets/sprites/frog/frog-idle-1.png',
};
let FROG = null; // frame size, pivot and sit-subject size from frog.json
function loadImage(key, src) {
  return new Promise(ok => {
    const im = new Image();
    im.onload = () => { IMG[key] = im; ok(); };
    im.onerror = () => ok();
    im.src = src.slice(src.lastIndexOf('/') + 1);
  });
}
async function loadAll() {
  const jobs = Object.entries(IMAGE_LIST).map(([k, v]) => loadImage(k, v));
  { const j = frogGeometry;
    FROG = { pivot: [j.pivot.x, j.pivot.y], sitSubject: [j.sitBodySize.w, j.sitBodySize.h], noseDist: j.pivot.y - j.sitBodyBBox.y };
  }
  jobs.push(document.fonts && document.fonts.load ? document.fonts.load('600 20px Fredoka').catch(() => {}) : null);
  await Promise.all(jobs);
  // Tinted copies for gold flowers and dived turtles.
  IMG['lotus-gold'] = tinted(IMG['lotus-white'] || IMG['lotus-pink'], '#f5c542', 0.55);
  IMG['turtle-dark'] = tinted(IMG.turtle, '#0f2c3a', 0.85);
}
function tinted(im, color, amount) {
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = amount;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- layout ----------
let VW = 0, VH = 0, DPR = 1;
const SAFE = { t: 0, r: 0, b: 0, l: 0 };
const LAY = {};
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  VW = canvas.clientWidth; VH = canvas.clientHeight;
  canvas.width = Math.round(VW * DPR); canvas.height = Math.round(VH * DPR);
  const s = document.getElementById('safe').getBoundingClientRect();
  SAFE.t = s.top; SAFE.l = s.left; SAFE.r = VW - s.right; SAFE.b = VH - s.bottom;
  layout();
}
function layout() {
  const portrait = VH >= VW * 1.05;
  LAY.portrait = portrait;
  const corner = 44;
  if (portrait) {
    const top = SAFE.t + 62, bar = SAFE.b + 92;
    const size = Math.min(VW - SAFE.l - SAFE.r - 20, VH - top - bar - 16);
    LAY.board = { x: (VW - size) / 2, y: top + (VH - top - bar - size) / 2, size };
    const bw = Math.min(88, (VW - SAFE.l - SAFE.r - 20) / 4 - 8), bh = 68;
    const y = VH - SAFE.b - bh - 12;
    const total = 4 * bw + 3 * 10, x0 = (VW - total) / 2;
    LAY.bar = ['undo', 'power', 'hint', 'retry'].map((id, i) => ({ id, x: x0 + i * (bw + 10), y, w: bw, h: bh }));
    LAY.hud = { x: SAFE.l + 12, y: SAFE.t + 10, w: VW - SAFE.l - SAFE.r - 24, h: 44 };
  } else {
    const barW = 96, colW = 172;
    const tall = VH - SAFE.t - SAFE.b - 16;
    LAY.hudCol = VW - SAFE.l - SAFE.r - barW - colW - 40 >= Math.min(tall, 700) && VH < 820;
    const top = LAY.hudCol ? SAFE.t + 8 : SAFE.t + 54;
    const left = SAFE.l + (LAY.hudCol ? colW : 0);
    const size = Math.min(VH - top - SAFE.b - 8, VW - left - SAFE.r - barW - 40);
    const areaW = VW - SAFE.r - barW - left;
    LAY.board = { x: left + (areaW - size) / 2, y: top + (VH - top - SAFE.b - size) / 2, size };
    const bw = 80, bh = Math.min(72, (VH - SAFE.t - 54 - SAFE.b - 30) / 4 - 10);
    const x = VW - SAFE.r - bw - 10;
    const ids = ['undo', 'power', 'hint', 'retry'];
    LAY.bar = ids.map((id, i) => ({ id, x, y: VH - SAFE.b - 12 - (i + 1) * bh - i * 10, w: bw, h: bh }));
    LAY.hud = { x: SAFE.l + 12, y: SAFE.t + 8, w: VW - SAFE.l - SAFE.r - 24, h: 40 };
  }
  LAY.pause = { id: 'pause', x: VW - SAFE.r - corner - 10, y: SAFE.t + 8, w: corner, h: corner };
  LAY.mute = { id: 'mute', x: VW - SAFE.r - 2 * corner - 18, y: SAFE.t + 8, w: corner, h: corner };
}

// ---------- game state ----------
const G = {
  screen: 'loading', mode: 'main', levelNo: 1, pondNo: 1, L: null, s: null,
  hist: [], tokens: [], hintUsed: false, overlay: null, howtoPage: 0, howtoThen: null,
  facing: 0, facingFrom: 0, facingT: 1, anim: null, beetleAnim: null, sinking: [], particles: [],
  turtleVis: [], bubble: null, toast: null, flashes: [], warn: null, leapSel: null, spacePrefix: 0,
  bloom: null, hint: null, hintSeq: 0, undos: 0, hintsUsed: 0, moves: 0, lastFly: 0,
  buffered: null, buttons: [], time: 0, levelSelectFocus: 0, menuFocus: 0, idleBlink: 0,
};
let pausedAt = null, pausedDuration = 0;
const now = () => ((pausedAt ?? performance.now()) - pausedDuration) / 1000;

function currentLevelDef() {
  if (G.mode === 'wild') return wildLevel(G.pondNo);
  if (G.mode === 'fixture') return FIXTURES[G.fixtureId];
  return LEVELS[G.levelNo - 1];
}
function wildLevel(n) {
  if (!WILD.length) return null;
  const base = WILD[(n - 1) % WILD.length];
  const sym = Math.floor((n - 1) / WILD.length) % 8;
  const L = sym ? R.transformLevel(base, sym) : { ...base };
  // Leap fish give Mend until level 10 is cleared.
  if (!save.data.cleared[10]) L.fish = (L.fish || []).map(f => [f[0], f[1], 'mend']);
  return L;
}
function areaOf(L) { return (L && L.area) || 'morning'; }

function startLevel(opts) {
  if (pausedAt !== null) { pausedDuration += performance.now() - pausedAt; pausedAt = null; }
  cancelHint();
  Object.assign(G, opts);
  const def = currentLevelDef();
  if (!def) { G.screen = 'title'; return; }
  G.L = { ...def };
  G.s = R.initState(G.L);
  G.hist = []; G.tokens = []; G.hintUsed = false; G.overlay = null; G.anim = null;
  G.beetleAnim = null; G.sinking = []; G.particles = []; G.flashes = []; G.warn = null; G.leapSel = null;
  G.bloom = null; G.hint = null; G.prevOverlay = null; G.eatenAt = {}; G.undos = 0; G.hintsUsed = 0; G.moves = 0; G.lastFly = now();
  G.facing = 0; G.facingFrom = 0; G.facingT = 1; G.buffered = null;
  G.turtleVis = (G.L.turtles || []).map(t => (R.turtleUp(t, 0) ? 1 : 0));
  G.screen = 'play';
  G.bubble = def.hint ? { text: def.hint, t: now() } : null;
  if (G.mode === 'wild') G.bubble = { text: `Wild Pond #${G.pondNo}`, t: now() };
  audio.playArea(areaOf(G.L));
}

// ---------- moves ----------
function pushHistory(extra = {}) {
  G.hist.push({ s: G.s, hint: G.hintUsed, tokens: G.tokens.slice(), ...extra });
}
function commit(tok, { silent = false } = {}) {
  const prev = G.s;
  let next;
  try { next = R.apply(G.L, prev, tok); } catch (e) { nope(); return false; }
  cancelHint();
  pushHistory();
  G.s = next;
  G.tokens.push(tok);
  G.warn = null;
  if (tok !== 'E' && tok !== 'X') G.leapSel = null;
  if (tok === 'E') {
    const d = R.DIR_KEYS.find(k => R.leapTargets(G.L, next, k).length);
    G.leapSel = d ? { d, n: 1, auto: true } : null;
  }
  if (!['M', 'E', 'X'].includes(tok)) G.moves++;
  animateMove(prev, next, tok, silent);
  return true;
}

function animateMove(prev, next, tok, silent) {
  const t = now();
  const L = G.L;
  const cell = LAY.board.size / L.w;
  if (tok === 'M') {
    const pi = R.frogPad(L, next);
    audio.play('poweruse');
    burst(next.fx, next.fy, '#9fe08a', 14);
    G.flashes.push({ x: L.pads[pi][0], y: L.pads[pi][1], t, color: '#b6f29a' });
    return;
  }
  if (tok === 'E') { audio.play('poweruse', { rate: 1.2 }); return; }
  if (tok === 'X') { audio.play('click'); return; }
  const isHop = R.DIRS[tok] || tok[0] === 'J';
  if (isHop) {
    const d = tok[0] === 'J' ? tok[1] : tok;
    turnTo(d);
    const dist = Math.abs(next.fx - prev.fx) + Math.abs(next.fy - prev.fy);
    const dur = 0.24 + 0.05 * dist + (tok[0] === 'J' ? 0.15 : 0);
    G.anim = { type: 'hop', t0: t, dur, from: [prev.fx, prev.fy], to: [next.fx, next.fy], leap: tok[0] === 'J' };
    audio.play('hop', { rate: 0.95 + Math.random() * 0.1 });
    // Pad left behind.
    const from = R.padIndexAt(L, prev.fx, prev.fy);
    if (from >= 0 && prev.pips[from] > 0) {
      if (next.pips[from] === 0) {
        G.sinking.push({ i: from, t0: t + 0.1 });
        audio.play('sink', { delay: 0.15 });
        shake(2);
      } else {
        audio.play('sink', { rate: 1.9, gain: 0.5, delay: 0.05 });
        G.particles.push({ kind: 'pip', x: prev.fx, y: prev.fy, t0: t, life: 0.6 });
      }
    }
    G.anim.onLand = () => {
      audio.play('land');
      ripple(next.fx, next.fy);
      const pi = R.padIndexAt(L, next.fx, next.fy);
      if (pi >= 0 && (prev.flies & (1 << pi)) && !(next.flies & (1 << pi))) {
        audio.play('gulp', { delay: 0.05 });
        G.lastFly = now();
        G.particles.push({ kind: 'gulp', x: next.fx, y: next.fy, t0: now(), life: 0.45 });
        G.particles.push({ kind: 'plus', x: next.fx, y: next.fy, t0: now(), life: 0.9 });
        G.flyBounce = now();
        G.eatenAt = G.eatenAt || {}; G.eatenAt[pi] = now() + 0.15;
      }
      if (next.gotFish !== undefined) fishGift(next.gotFish, next.slot);
      afterTurn(prev, next);
    };
  } else if (tok[0] === 't') {
    const d = tok[1];
    turnTo(d);
    const f = R.flickInfo(L, prev, d);
    G.anim = { type: 'tongue', t0: t, dur: 0.32, to: [f.bx, f.by] };
    audio.play('flick');
    G.beetleAnim = { from: [f.bx, f.by], to: [f.tx, f.ty], t0: t + 0.16, dur: 0.35 };
    audio.play('scuttle', { delay: 0.16 });
    G.anim.onLand = () => afterTurn(prev, next);
  }
  void cell; void silent;
}

// Turtle ticks, dives and the end-of-turn checks.
function afterTurn(prev, next) {
  const L = G.L;
  let changed = false;
  (L.turtles || []).forEach(tt => {
    if (R.turtleUp(tt, prev.turn) !== R.turtleUp(tt, next.turn)) changed = R.turtleUp(tt, next.turn) ? 'up' : (changed || 'down');
  });
  if (changed === 'down') audio.play('dive');
  else if (changed === 'up') audio.play('surface');
  else if ((L.turtles || []).length) audio.play('tick');
  if (next.status === 'won') startBloom();
  else if (next.status === 'dunked') {
    G.anim = { type: 'dunk', t0: now(), dur: 0.9 };
    audio.play('dunk');
    shake(2);
    G.anim.onLand = () => { setOverlay('dunked'); };
  } else checkStuck();
}
function setOverlay(o) {
  if (G.overlay === 'pause') G.prevOverlay = o; else G.overlay = o;
}
function checkStuck() {
  if (G.s.status === 'play' && R.isStuck(G.L, G.s)) {
    setTimeout(() => {
      if (G.screen === 'play' && G.s.status === 'play' && R.isStuck(G.L, G.s) && !G.anim) {
        setOverlay('stuck'); audio.play('stuck');
      }
    }, 350);
  }
}

function fishGift(fi, kind) {
  const [x, y] = G.L.fish[fi];
  audio.play('fishleap');
  audio.play('powerup', { delay: 0.45 });
  G.particles.push({ kind: 'fish', x, y, t0: now(), life: 1.0 });
  G.particles.push({ kind: 'bubble', x, y, item: kind, t0: now() + 0.4, life: 0.9 });
  if (!save.data.giftSeen[kind]) {
    G.bubble = {
      seenKey: kind,
      text: kind === 'mend' ? 'That fish left you a gift! Press E or tap it to mend this pad.'
        : 'A gold feather! Press E or tap it to leap far.', t: now() + 0.6,
    };
  }
}

function turnTo(d) {
  const target = DIR_ANGLE[d];
  let from = currentFacing();
  let diff = target - from;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  G.facingFrom = from; G.facing = from + diff; G.facingT = 0; G.facingStart = now();
}
function currentFacing() {
  const k = Math.min(1, (now() - (G.facingStart || 0)) / 0.08);
  return G.facingFrom + (G.facing - G.facingFrom) * (G.facingT >= 1 ? 1 : k);
}

function nope(flash) {
  audio.play('nope');
  G.frogWobble = now();
  if (flash) G.flashes.push({ ...flash, t: now(), color: flash.color || C.red });
}

function tryHop(d) {
  const L = G.L, s = G.s;
  if (s.leapArmed) return leapSelect(d);
  const t = R.hopTarget(L, s, d);
  if (!t) { turnTo(d); return nope(); }
  if (t.blocked) { turnTo(d); return nope({ x: t.blocked.x, y: t.blocked.y }); }
  if (R.isDunkMove(L, s, d)) return dunkWarning(d);
  commit(d);
}
function tryFlick(d) {
  const L = G.L, s = G.s;
  if (s.leapArmed) return nope();
  const f = R.flickInfo(L, s, d);
  turnTo(d);
  if (!f) {
    G.anim = { type: 'tongue', t0: now(), dur: 0.28, to: tongueTip(d), miss: true };
    audio.play('flick', { rate: 1.15 });
    return;
  }
  if (f.to < 0) {
    G.anim = { type: 'tongue', t0: now(), dur: 0.3, to: [f.bx, f.by] };
    audio.play('flick');
    G.wobbleBeetle = { x: f.bx, y: f.by, t: now() + 0.15 };
    audio.play('scuttle', { rate: 0.7, delay: 0.15 });
    return;
  }
  if (R.isDunkMove(L, s, 't' + d)) return dunkWarning('t' + d);
  commit('t' + d);
}
function tongueTip(d) {
  const [dx, dy] = R.DIRS[d];
  return [G.s.fx + dx * 1.2, G.s.fy + dy * 1.2];
}
function dunkWarning(tok) {
  if (G.warn && G.warn.tok === tok && now() - G.warn.t < 2) { G.warn = null; commit(tok); return; }
  G.warn = { tok, t: now() };
  G.frogWobble = now();
  audio.play('nope', { rate: 1.3 });
  toast("You'll get wet!");
}
function leapSelect(d) {
  const ts = R.leapTargets(G.L, G.s, d);
  if (!ts.length) return nope();
  if (G.leapSel && G.leapSel.d === d && !G.leapSel.auto) G.leapSel = { d, n: (G.leapSel.n % ts.length) + 1 };
  else G.leapSel = { d, n: 1 };
  turnTo(d);
  audio.play('click');
}
function leapConfirm() {
  if (!G.s.leapArmed || !G.leapSel) return;
  const tok = 'J' + G.leapSel.d + G.leapSel.n;
  if (R.isDunkMove(G.L, G.s, tok)) return dunkWarning(tok);
  commit(tok);
}
function usePower() {
  const s = G.s;
  if (!save.data.powerUsed && (R.canMend(G.L, s) || R.canArmLeap(G.L, s))) { save.data.powerUsed = true; save.write(); }
  if (s.leapArmed) return commit('X');
  if (R.canMend(G.L, s)) return commit('M');
  if (R.canArmLeap(G.L, s)) return commit('E');
  nope();
}

function undo() {
  if (G.overlay === 'complete') return;
  cancelHint();
  if (!G.hist.length) { nope(); return; }
  const e = G.hist.pop();
  G.s = e.s; G.hintUsed = e.hint; G.tokens = e.tokens;
  G.overlay = null; G.anim = null; G.beetleAnim = null; G.sinking = []; G.leapSel = null; G.warn = null;
  if (G.s.leapArmed) {
    const d = R.DIR_KEYS.find(k => R.leapTargets(G.L, G.s, k).length);
    G.leapSel = d ? { d, n: 1 } : null;
  }
  G.undos++;
  G.turtleVis = (G.L.turtles || []).map(t => (R.turtleUp(t, G.s.turn) ? 1 : 0));
  audio.play('undo');
  if (e.retry) toast('Back where you were!');
  if (G.s.status === 'won') { G.bloom = null; startBloom(); return; }
  if (G.s.status === 'dunked') { setOverlay('dunked'); return; }
  checkStuck();
}
function retry() {
  cancelHint();
  if (!G.hist.length && G.s.turn === 0 && !G.s.slot) return;
  pushHistory({ retry: true });
  G.s = R.initState(G.L); G.tokens = []; G.hintUsed = false;
  G.overlay = null; G.anim = null; G.beetleAnim = null; G.sinking = []; G.leapSel = null; G.warn = null;
  G.turtleVis = (G.L.turtles || []).map(t => (R.turtleUp(t, 0) ? 1 : 0));
  G.facing = 0; G.facingFrom = 0; G.facingT = 1;
  audio.play('undo', { rate: 0.8 });
  toast('Fresh pond! Undo to go back.');
}

// ---------- hint ----------
let worker = null, workerOk = true;
function cancelHint() {
  if (G.hint === 'pending') G.hint = null;
  if (worker && G.workerBusy) { worker.terminate(); worker = null; }
  G.workerBusy = false;
}
function getWorker() {
  if (!workerOk) return null;
  if (worker) return worker;
  try {
    worker = new Worker('hint-worker.js');
    worker.onmessage = e => onHint(e.data);
    worker.onerror = () => { workerOk = false; worker = null; if (G.hint === 'pending') runHintSync(); };
  } catch { workerOk = false; worker = null; }
  return worker;
}
const hintCache = new Map();
function hint() {
  if (G.screen !== 'play' || G.s.status === 'won') return;
  if (G.s.leapArmed) { commit('X'); return; }
  if (G.s.status === 'dunked') { undo(); return; }
  if (G.hint === 'pending') return;
  G.hintSeq++;
  G.hint = 'pending';
  G.hintStart = now();
  const key = R.stateKey(G.L, G.s) + '#' + G.hist.length;
  const cached = hintCache.get(R.stateKey(G.L, G.s));
  if (cached && cached.result === 'move') return onHint({ ...cached, seq: G.hintSeq });
  const states = [G.s, ...G.hist.map(h => h.s).reverse()];
  const w = getWorker();
  if (w) { G.workerBusy = true; w.postMessage({ seq: G.hintSeq, level: G.L, states, cap: 300000, totalCap: 1000000 }); }
  else runHintSync();
  void key;
}
function runHintSync() {
  const states = [G.s, ...G.hist.map(h => h.s).reverse()];
  onHint({ seq: G.hintSeq, ...hintSearch(G.L, states, 50000, 150000) });
}
function onHint(r) {
  G.workerBusy = false;
  if (r.seq !== G.hintSeq || G.hint !== 'pending') return;
  if (r.result === 'move') hintCache.set(R.stateKey(G.L, G.s), { result: 'move', move: r.move });
  G.hint = r.result;
  G.hintUsed = true; G.hintsUsed++;
  if (r.result === 'move') {
    playHintMove(r.move);
  } else if (r.result === 'back') {
    toast("This pond can't be finished from here. Let's hop back!");
    audio.play('stuck');
    const steps = r.index;
    for (let i = 0; i < steps && G.hist.length; i++) {
      const e = G.hist.pop();
      G.s = e.s; G.tokens = e.tokens;
    }
    G.hintUsed = true;
    G.overlay = null; G.anim = null; G.sinking = []; G.leapSel = null;
    G.turtleVis = (G.L.turtles || []).map(t => (R.turtleUp(t, G.s.turn) ? 1 : 0));
  } else {
    const sol = G.L.solution ? R.parse(G.L.solution) : [];
    const pre = G.tokens.filter(t => !['M', 'E', 'X'].includes(t));
    if (sol.length && pre.length < sol.length && pre.every((t, i) => t === sol[i]) && G.tokens.length === pre.length) {
      playHintMove(sol[pre.length]);
    } else {
      toast('Tricky! Want a fresh pond? Tap Retry.');
      G.retryPulse = now();
    }
  }
}
function playHintMove(m) {
  const toks = m.split('+');
  for (const t of toks) {
    const before = G.s;
    let target = null;
    if (R.DIRS[t]) { const h = R.hopTarget(G.L, before, t); if (h) target = [h.x, h.y]; }
    else if (t[0] === 't') { const f = R.flickInfo(G.L, before, t[1]); if (f) target = [f.bx, f.by]; }
    else if (t[0] === 'J') { const ts = R.leapTargets(G.L, before, t[1]); const h = ts[+t.slice(2) - 1]; if (h) target = [h.x, h.y]; }
    if (target) G.flashes.push({ x: target[0], y: target[1], t: now(), color: C.gold });
    commit(t);
  }
  audio.play('bloom', { rate: 1.5, gain: 0.6 });
}

// ---------- bloom ----------
function startBloom() {
  const L = G.L;
  const fx = G.s.fx, fy = G.s.fy;
  const occupied = new Set(L.pads.map(p => p[0] + ',' + p[1]));
  (L.turtles || []).forEach(t => occupied.add(t[0] + ',' + t[1]));
  const flowers = [];
  let seed = L.w * 31 + L.pads.length * 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    if (occupied.has(x + ',' + y)) continue;
    if (rnd() < 0.6) flowers.push({ x: x + (rnd() - 0.5) * 0.3, y: y + (rnd() - 0.5) * 0.3, s: 0.32 + rnd() * 0.12 });
  }
  // A ring around the board edge.
  for (let i = -1; i <= L.w; i += 1) {
    flowers.push({ x: i + (rnd() - 0.5) * 0.4, y: -0.85, s: 0.34 + rnd() * 0.14 });
    flowers.push({ x: i + (rnd() - 0.5) * 0.4, y: L.h - 0.15, s: 0.34 + rnd() * 0.14 });
  }
  for (let j = 0; j < L.h; j += 1) {
    flowers.push({ x: -0.85, y: j + (rnd() - 0.5) * 0.4, s: 0.34 + rnd() * 0.14 });
    flowers.push({ x: L.w - 0.15, y: j + (rnd() - 0.5) * 0.4, s: 0.34 + rnd() * 0.14 });
  }
  for (const f of flowers) {
    f.d = Math.hypot(f.x - fx, f.y - fy);
    f.kind = rnd() < 0.7 ? 'lotus-pink' : 'lotus-white';
    f.rot = rnd() * Math.PI * 2;
  }
  const maxD = Math.max(...flowers.map(f => f.d), 1);
  const span = G.mode === 'wild' ? 1.0 : 1.9;
  flowers.forEach(f => { f.delay = 0.25 + (f.d / maxD) * span; });
  flowers.sort((a, b) => a.delay - b.delay);
  G.bloom = { t0: now(), flowers, dur: G.mode === 'wild' ? 2.2 : 4.2, chimes: 0 };
  G.buffered = null;
  audio.fanfare();
  // Progress.
  if (G.mode === 'main') {
    const n = G.levelNo;
    save.data.cleared[n] = true;
    if (!G.hintUsed) save.data.gold[n] = true;
    save.data.furthest = Math.max(save.data.furthest, Math.min(12, n + 1));
    save.write();
  } else if (G.mode === 'wild') {
    save.data.wildBest = Math.max(save.data.wildBest, G.pondNo);
    save.data.wildNext = G.pondNo + 1;
    save.write();
  }
}
function finishBloom() {
  if (!G.bloom || G.overlay === 'complete' || G.overlay === 'pause') return;
  if (now() - G.bloom.t0 < 0.6) return; // ignore presses from before the bloom
  G.bloom.t0 = now() - G.bloom.dur;
  G.overlay = 'complete';
  audio.play('croak');
}

// ---------- particles and effects ----------
function ripple(x, y) { G.particles.push({ kind: 'ripple', x, y, t0: now(), life: 0.8 }); burst(x, y, '#d8f3f0', 8); }
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * 1.2;
    G.particles.push({ kind: 'drop', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color, t0: now(), life: 0.5 + Math.random() * 0.3 });
  }
}
let shakeAmt = 0, shakeT = 0;
function shake(px) { shakeAmt = px; shakeT = now(); }
function toast(text) { G.toast = { text, t: now() }; }

// ---------- input ----------
const keysDown = new Set();
window.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Backspace', 'Tab'].includes(k)) e.preventDefault();
  if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) return;
  audio.unlock();
  keysDown.add(k);
  onKey(k, e.shiftKey);
});
window.addEventListener('keyup', e => { keysDown.delete(e.key); });
const KEY_DIR = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };

function onKey(k, shift) {
  if (G.screen === 'loading') return;
  if (G.screen !== 'play') return menuKey(k);
  // Gameplay.
  if (G.overlay === 'pause') {
    if (k === 'Escape' || k === 'p' || k === 'P') return togglePause();
    if (KEY_DIR[k] || k === 'Enter' || k === ' ') return menuKey(k);
    if (k === 'r' || k === 'R') { togglePause(); return act({ type: 'retry' }); }
    if (k === 'm' || k === 'M') return audio.toggleAll();
    return;
  }
  if (G.overlay === 'complete') {
    if (k === 'Enter' || k === ' ' || k === 'n' || k === 'N') return nextLevel();
    if (k === 'r' || k === 'R') return startLevel({});
    if (k === 'Escape') return goScreen('levels');
    return;
  }
  if (G.bloom && !G.overlay) { finishBloom(); return; }
  const dir = KEY_DIR[k];
  if (dir) {
    if (G.spacePrefix && now() - G.spacePrefix < 1) { G.spacePrefix = 0; return act({ type: 'flick', d: dir }); }
    G.spacePrefix = 0;
    return act({ type: shift ? 'flick' : 'hop', d: dir });
  }
  G.spacePrefix = 0;
  if (k === ' ' || k === 'Enter') {
    if (G.s.leapArmed) return act({ type: 'leapGo' });
    if (G.overlay) return;
    if (k === ' ') { G.spacePrefix = now(); return; }
    return;
  }
  if (k === 'x' || k === 'X') { G.spacePrefix = now(); return; }
  if (k === 'z' || k === 'Z' || k === 'u' || k === 'U' || k === 'Backspace') return act({ type: 'undo' });
  if (k === 'r' || k === 'R') return act({ type: 'retry' });
  if (k === 'h' || k === 'H') return act({ type: 'hint' });
  if (k === 'e' || k === 'E' || k === 'q' || k === 'Q') return act({ type: 'power' });
  if (k === 'Escape' || k === 'p' || k === 'P') return togglePause();
  if (k === 'm' || k === 'M') return audio.toggleAll();
}

// Every gameplay action goes through here (keys, taps, swipes, buttons).
function act(a) {
  if (G.screen !== 'play') return;
  if (G.overlay === 'pause') return;
  if (G.bloom) { finishBloom(); return; }
  const boardInput = ['hop', 'flick', 'tap', 'swipe', 'leapGo', 'power'].includes(a.type);
  if (G.bubble && boardInput) G.bubble = null;
  if (a.type === 'undo') { G.buffered = null; return undo(); }
  if (busy() && (a.type === 'retry' || a.type === 'hint')) { G.buffered = a; return; }
  if (a.type === 'retry') { G.buffered = null; return retry(); }
  if (a.type === 'hint') return hint();
  if (G.overlay) return; // stuck / dunked cards take only undo and retry
  if (busy()) { G.buffered = a; return; }
  if (a.type === 'hop') return tryHop(a.d);
  if (a.type === 'flick') return tryFlick(a.d);
  if (a.type === 'power') return usePower();
  if (a.type === 'leapGo') return leapConfirm();
  if (a.type === 'swipe') {
    if (G.s.leapArmed) {
      const ts = R.leapTargets(G.L, G.s, a.d);
      if (!ts.length) return nope();
      G.leapSel = { d: a.d, n: 1 };
      return leapConfirm();
    }
    return tryHop(a.d);
  }
  if (a.type === 'tap') return tapCell(a.x, a.y);
}
function busy() { return !!G.anim || (G.beetleAnim && now() < G.beetleAnim.t0 + G.beetleAnim.dur); }

function tapCell(cx, cy) {
  const L = G.L, s = G.s;
  if (cx === s.fx && cy === s.fy) {
    if (s.slot) return usePower();
    G.frogWobble = now();
    return;
  }
  if (s.leapArmed) {
    for (const d of R.DIR_KEYS) {
      const ts = R.leapTargets(L, s, d);
      const i = ts.findIndex(t => t.x === cx && t.y === cy);
      if (i >= 0) { G.leapSel = { d, n: i + 1 }; return leapConfirm(); }
    }
    return nope({ x: cx, y: cy });
  }
  for (const d of R.DIR_KEYS) {
    const t = R.hopTarget(L, s, d);
    if (t && !t.blocked && t.x === cx && t.y === cy) return tryHop(d);
  }
  for (const d of R.DIR_KEYS) {
    const f = R.flickInfo(L, s, d);
    if (f && f.bx === cx && f.by === cy) return tryFlick(d);
  }
  // Not a target: never move elsewhere; show what's in the way.
  let d = null;
  if (cx === s.fx) d = cy < s.fy ? 'U' : 'D';
  else if (cy === s.fy) d = cx < s.fx ? 'L' : 'R';
  if (d) {
    const t = R.hopTarget(L, s, d);
    if (t && t.blocked) return nope({ x: t.blocked.x, y: t.blocked.y });
    if (t) return nope({ x: t.x, y: t.y, color: C.gold });
  }
  nope({ x: cx, y: cy });
}

// Pointer: buttons first, then the board (tap or swipe).
let ptr = null;
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  audio.unlock();
  canvas.focus();
  ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now() };
});
canvas.addEventListener('pointerup', e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
  const start = ptr;
  ptr = null;
  if (Math.hypot(dx, dy) < 12) return onTap(start.x, start.y);
  if (Math.hypot(dx, dy) >= 24 && G.screen === 'play') {
    const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U');
    if (G.screen === 'play' && !G.overlay) act({ type: 'swipe', d });
  } else if (G.screen === 'howto') {
    if (Math.abs(dx) > 30) howtoPage(dx < 0 ? 1 : -1);
  }
});
canvas.addEventListener('pointercancel', () => { ptr = null; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });

function onTap(x, y) {
  for (let i = G.buttons.length - 1; i >= 0; i--) {
    const b = G.buttons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.disabled) { audio.play('nope'); return; }
      audio.play('click');
      b.on();
      return;
    }
  }
  if (G.screen === 'title' && !G.overlay) return;
  if (G.screen !== 'play') return;
  if (G.bloom) return finishBloom();
  if (G.overlay) return;
  if (G.bubble && G.bubble.rect) {
    const r = G.bubble.rect;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { G.bubble = null; return; }
  }
  const B = LAY.board, cell = B.size / G.L.w;
  const cx = Math.floor((x - B.x) / cell), cy = Math.floor((y - B.y) / cell);
  if (cx < 0 || cy < 0 || cx >= G.L.w || cy >= G.L.h) return;
  act({ type: 'tap', x: cx, y: cy });
}

// ---------- menus ----------
function goScreen(s) {
  if (pausedAt !== null) { pausedDuration += performance.now() - pausedAt; pausedAt = null; }
  cancelHint();
  
  G.screen = s; G.overlay = null; G.bloom = null; G.menuFocus = 0;
  if (s === 'title' || s === 'levels' || s === 'howto') audio.playArea('morning');
  if (s === 'victory') { audio.playArea('moon'); G.victoryT = now(); }
}
function continueLevel() {
  for (let n = 1; n <= 12; n++) if (!save.data.cleared[n]) return startLevelChecked(n);
  startLevelChecked(12);
}
function startLevelChecked(n) {
  if (!save.data.howtoSeen) { G.howtoPage = 0; G.howtoThen = n; goScreen('howto'); return; }
  startLevel({ mode: 'main', levelNo: n });
}
function nextLevel() {
  if (G.mode === 'wild') return startLevel({ mode: 'wild', pondNo: G.pondNo + 1 });
  if (G.mode === 'fixture') return goScreen('title');
  if (G.levelNo >= 12) return goScreen('victory');
  startLevel({ mode: 'main', levelNo: G.levelNo + 1 });
}
function togglePause() {
  if (G.screen !== 'play') return;
  if (G.overlay === 'pause') { if (pausedAt !== null) pausedDuration += performance.now() - pausedAt; pausedAt = null; G.overlay = G.prevOverlay || null; G.prevOverlay = null;  audio.resume(); audio.setPaused(false); }
  else if (G.overlay !== 'complete') { pausedAt = performance.now(); G.prevOverlay = G.overlay; G.overlay = 'pause'; G.menuFocus = 0; audio.setPaused(true); }
}

function howtoPage(delta) {
  G.howtoPage += delta;
  if (G.howtoPage < 0) G.howtoPage = 0;
  if (G.howtoPage > 2) {
    save.data.howtoSeen = true; save.write();
    if (G.howtoThen) { const n = G.howtoThen; G.howtoThen = null; startLevel({ mode: 'main', levelNo: n }); }
    else goScreen('title');
  }
}
function menuKey(k) {
  const btns = G.buttons.filter(b => b.menu && !b.disabled);
  if (G.screen === 'howto') {
    if (k === 'ArrowRight' || k === 'Enter' || k === ' ' || k === 'd') return howtoPage(1);
    if (k === 'ArrowLeft' || k === 'a') return howtoPage(-1);
    if (k === 'Escape') return goScreen('title');
    return;
  }
  if (k === 'm' || k === 'M') return audio.toggleAll();
  if (k === 'Escape' && G.screen !== 'title') return goScreen('title');
  if (!btns.length) return;
  const dir = KEY_DIR[k];
  if (dir) {
    const step = (G.screen === 'levels' && (dir === 'U' || dir === 'D')) ? 4 : 1;
    const sign = dir === 'U' || dir === 'L' ? -1 : 1;
    G.menuFocus = (G.menuFocus + sign * step + btns.length * 4) % btns.length;
    audio.play('click', { gain: 0.6 });
    return;
  }
  if (k === 'Enter' || k === ' ') {
    const b = btns[G.menuFocus % btns.length];
    if (b) { audio.play('click'); b.on(); }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (G.screen === 'play' && G.overlay !== 'pause' && G.overlay !== 'complete' && !G.bloom) togglePause();
    audio.suspend();
  } else audio.resume();
});
window.addEventListener('blur', () => {
  if (G.screen === 'play' && !G.overlay && !G.bloom) togglePause();
});
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

// ---------- update ----------
function update() {
  if (G.overlay === 'pause') return;
  const t = now();
  G.lastUpdate = G.time || t;
  G.time = t;
  if (G.anim && t >= G.anim.t0 + G.anim.dur) {
    const a = G.anim;
    G.anim = null;
    if (a.onLand) a.onLand();
  }
  if (G.beetleAnim && t >= G.beetleAnim.t0 + G.beetleAnim.dur) G.beetleAnim = null;
  if (!busy() && G.buffered) { const b = G.buffered; G.buffered = null; act(b); }
  G.sinking = G.sinking.filter(sk => t < sk.t0 + 0.8);
  G.particles = G.particles.filter(p => t < p.t0 + p.life);
  G.flashes = G.flashes.filter(f => t < f.t + 0.7);
  if (G.toast && t > G.toast.t + 3) G.toast = null;
  if (G.screen === 'play' && G.L) {
    if (G.overlay === 'pause' && G.bloom) G.bloom.t0 += t - (G.lastUpdate || t);
    (G.L.turtles || []).forEach((tt, i) => {
      const target = R.turtleUp(tt, G.s.turn) ? 1 : 0;
      const v = G.turtleVis[i] ?? target;
      G.turtleVis[i] = v + (target - v) * 0.12;
    });
    if (G.bloom) {
      const bt = t - G.bloom.t0;
      while (G.bloom.chimes < 14 && G.bloom.flowers.length &&
        bt > G.bloom.flowers[Math.floor(G.bloom.chimes * (G.bloom.flowers.length - 1) / 13)].delay) {
        audio.play('bloom', { rate: Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31][G.bloom.chimes] / 12) * 0.8, gain: 0.7 });
        G.bloom.chimes++;
      }
      if (bt > G.bloom.dur && G.overlay !== 'complete' && G.prevOverlay !== 'complete') { setOverlay('complete'); audio.play('croak'); }
    }
  }
}

// ---------- drawing helpers ----------
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(str, x, y, size, { color = C.ink, align = 'center', weight = 600, base = 'middle', stroke = null, maxW } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = base;
  if (stroke) { ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y, maxW); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y, maxW);
}
function wrap(str, maxW, size, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const localized = globalThis.PureTVChinese?.translate(str) ?? str;
  const chinese = /[\u3400-\u9fff]/.test(localized);
  const words = chinese ? Array.from(localized) : localized.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line && !chinese ? line + ' ' + w : line + w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function drawSprite(key, cx, cy, size, { rot = 0, alpha = 1, scaleY = 1 } = {}) {
  const im = IMG[key];
  if (!im) return;
  const k = size / Math.max(im.width, im.height);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  ctx.scale(1, scaleY);
  ctx.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k);
  ctx.restore();
}
function drawFrogSprite(key, cx, cy, body, rot = 0) {
  const im = IMG[key] || IMG.frog;
  if (!im || !FROG) return drawSprite(key, cx, cy, body * 1.4, { rot });
  const k = body / Math.max(FROG.sitSubject[0], FROG.sitSubject[1]);
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(k, k);
  ctx.drawImage(im, -FROG.pivot[0], -FROG.pivot[1]);
  ctx.restore();
}
function drawCover(key) {
  const im = IMG[key];
  if (!im) { ctx.fillStyle = '#2f7f84'; ctx.fillRect(0, 0, VW, VH); return; }
  const k = Math.max(VW / im.width, VH / im.height);
  ctx.drawImage(im, (VW - im.width * k) / 2, (VH - im.height * k) / 2, im.width * k, im.height * k);
}
function button(b, label, { icon, primary, disabled, focus, small } = {}) {
  const r = Math.min(18, b.h / 2.5);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  rr(b.x, b.y, b.w, b.h, r);
  ctx.fillStyle = disabled ? 'rgba(255,248,232,0.45)' : primary ? '#ffd56b' : 'rgba(255,248,232,0.9)';
  ctx.fill();
  ctx.restore();
  if (focus) { rr(b.x - 3, b.y - 3, b.w + 6, b.h + 6, r + 3); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.stroke(); }
  rr(b.x, b.y, b.w, b.h, r);
  ctx.strokeStyle = 'rgba(45,58,30,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  const col = disabled ? 'rgba(45,58,30,0.4)' : C.ink;
  if (icon && label) {
    drawIcon(icon, b.x + b.w / 2, b.y + b.h * 0.4, Math.min(b.h * 0.42, 28), col);
    text(label, b.x + b.w / 2, b.y + b.h * 0.8, Math.min(13, b.h * 0.2), { color: col, weight: 600 });
  } else if (icon) drawIcon(icon, b.x + b.w / 2, b.y + b.h / 2, Math.min(b.h * 0.5, 26), col);
  else text(label, b.x + b.w / 2, b.y + b.h / 2 + 1, small ? 16 : Math.min(22, b.h * 0.42), { color: col, maxW: b.w - 12 });
}
function addButton(b, on, opts = {}) { G.buttons.push({ ...b, on, ...opts }); }

function drawIcon(name, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2.5, s * 0.13); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const h = s / 2;
  if (name === 'undo' || name === 'retry') {
    ctx.beginPath();
    if (name === 'undo') {
      ctx.arc(0, h * 0.15, h * 0.7, Math.PI * 1.05, Math.PI * 2.25, false);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-h * 0.95, -h * 0.55); ctx.lineTo(-h * 0.72, h * 0.1); ctx.lineTo(-h * 0.08, -h * 0.18); ctx.stroke();
    } else {
      ctx.arc(0, 0, h * 0.72, -Math.PI * 0.35, Math.PI * 1.45, false);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h * 0.2, -h * 0.95); ctx.lineTo(h * 0.55, -h * 0.55); ctx.lineTo(h * 0.05, -h * 0.35); ctx.stroke();
    }
  } else if (name === 'hint') {
    ctx.beginPath(); ctx.arc(0, -h * 0.2, h * 0.55, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-h * 0.3, h * 0.45); ctx.lineTo(h * 0.3, h * 0.45); ctx.moveTo(-h * 0.2, h * 0.75); ctx.lineTo(h * 0.2, h * 0.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-h * 0.25, h * 0.2); ctx.lineTo(-h * 0.3, h * 0.45); ctx.moveTo(h * 0.25, h * 0.2); ctx.lineTo(h * 0.3, h * 0.45); ctx.stroke();
  } else if (name === 'pause') {
    ctx.fillRect(-h * 0.45, -h * 0.55, h * 0.3, h * 1.1); ctx.fillRect(h * 0.15, -h * 0.55, h * 0.3, h * 1.1);
  } else if (name === 'sound' || name === 'muted') {
    ctx.beginPath(); ctx.moveTo(-h * 0.8, -h * 0.25); ctx.lineTo(-h * 0.4, -h * 0.25); ctx.lineTo(h * 0.05, -h * 0.65);
    ctx.lineTo(h * 0.05, h * 0.65); ctx.lineTo(-h * 0.4, h * 0.25); ctx.lineTo(-h * 0.8, h * 0.25); ctx.closePath(); ctx.fill();
    if (name === 'sound') {
      ctx.beginPath(); ctx.arc(h * 0.15, 0, h * 0.45, -0.8, 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(h * 0.15, 0, h * 0.8, -0.8, 0.8); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(h * 0.35, -h * 0.35); ctx.lineTo(h * 0.95, h * 0.35); ctx.moveTo(h * 0.95, -h * 0.35); ctx.lineTo(h * 0.35, h * 0.35); ctx.stroke();
    }
  } else if (name === 'back') {
    ctx.beginPath(); ctx.moveTo(h * 0.3, -h * 0.6); ctx.lineTo(-h * 0.35, 0); ctx.lineTo(h * 0.3, h * 0.6); ctx.stroke();
  } else if (name === 'lock') {
    ctx.beginPath(); ctx.arc(0, -h * 0.2, h * 0.4, Math.PI, 0); ctx.stroke();
    rr(-h * 0.6, -h * 0.2, h * 1.2, h * 0.9, 4); ctx.fill();
  }
  ctx.restore();
}

// ---------- drawing: the pond ----------
function cellCenter(x, y) {
  const B = LAY.board, c = B.size / G.L.w;
  return [B.x + (x + 0.5) * c, B.y + (y + 0.5) * c];
}
function drawPond(t) {
  const L = G.L, s = G.s, B = LAY.board, cell = B.size / L.w;
  drawCover(AREA_BG[areaOf(L)]);
  // Soft vignette under the board so sprites pop.
  const g = ctx.createRadialGradient(B.x + B.size / 2, B.y + B.size / 2, B.size * 0.2, B.x + B.size / 2, B.y + B.size / 2, B.size * 0.75);
  g.addColorStop(0, 'rgba(10,40,50,0.18)'); g.addColorStop(1, 'rgba(10,40,50,0)');
  ctx.fillStyle = g; ctx.fillRect(B.x - B.size * 0.3, B.y - B.size * 0.3, B.size * 1.6, B.size * 1.6);
  // Shimmer.
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 5; i++) {
    const yy = B.y + ((t * 12 + i * B.size / 5) % B.size);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(B.x + B.size * (0.2 + 0.15 * i) % B.size, yy, cell * 0.9, cell * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // Faint cell dots so lines are easy to read.
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const [px, py] = cellCenter(x, y);
    ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, cell * 0.03), 0, Math.PI * 2); ctx.fill();
  }
  // Rocks just outside the board (decoration).
  if (IMG.rock && B.x > cell * 0.7) {
    drawSprite('rock', B.x - cell * 0.25, B.y + B.size * 0.15, cell * 0.55);
    drawSprite('rock', B.x + B.size + cell * 0.2, B.y + B.size * 0.8, cell * 0.45, { rot: 1.3 });
  }
  // Reeds.
  for (const [x, y] of L.reeds || []) {
    const [px, py] = cellCenter(x, y);
    drawSprite('reeds', px, py, cell * 0.9, { rot: Math.sin(t * 0.8 + x + y) * 0.04 });
  }
  // Fish spots.
  (L.fish || []).forEach(([x, y], fi) => {
    const used = s.fishUsed & (1 << fi);
    const [px, py] = cellCenter(x, y);
    ctx.save();
    for (let k = 0; k < (used ? 1 : 3); k++) {
      const ph = ((t * 0.6 + k / 3) % 1);
      ctx.globalAlpha = used ? 0.18 : 0.55 * (1 - ph);
      ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = Math.max(1.5, cell * 0.035);
      ctx.beginPath(); ctx.ellipse(px, py, cell * (0.12 + ph * 0.3), cell * (0.08 + ph * 0.2), 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (!used) {
      // A glimpse of the koi under the water.
      ctx.globalAlpha = 0.28;
      drawSprite('fish', px + Math.sin(t) * cell * 0.08, py, cell * 0.55, { rot: t * 0.5 });
    }
    ctx.restore();
  });
  // Turtles.
  (L.turtles || []).forEach((tt, i) => drawTurtle(tt, i, t, cell));
  // Glows for reachable cells.
  const targets = reachable();
  for (const tg of targets) {
    const [px, py] = cellCenter(tg.x, tg.y);
    const pulse = 0.55 + 0.25 * Math.sin(t * 4);
    ctx.save();
    ctx.globalAlpha = tg.leap ? 0.9 : pulse;
    ctx.strokeStyle = tg.leap ? C.gold : 'rgba(255,244,220,0.95)';
    ctx.lineWidth = Math.max(3, cell * 0.07);
    ctx.shadowColor = tg.leap ? C.gold : '#fff4dc'; ctx.shadowBlur = cell * 0.25;
    ctx.beginPath(); ctx.arc(px, py, cell * 0.47, 0, Math.PI * 2); ctx.stroke();
    if (tg.selected) {
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.arc(px, py, cell * 0.47, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  // Pads.
  const frogPadIdx = R.frogPad(L, s);
  L.pads.forEach((p, i) => {
    const pips = s.pips[i];
    const sink = G.sinking.find(sk => sk.i === i);
    if (pips <= 0 && !sink) return;
    const [px, py] = cellCenter(p[0], p[1]);
    let size = cell * 0.9, alpha = 1, rot = (i * 1.7) % (Math.PI * 2);
    let key = 'pad-' + Math.max(1, Math.min(3, pips));
    if (sink) {
      const k = Math.max(0, Math.min(1, (t - sink.t0) / 0.7));
      size *= 1 - 0.45 * k; alpha = 1 - k; rot += k * 0.6; key = 'pad-1';
      if (Math.random() < 0.3) G.particles.push({ kind: 'bubbleup', x: p[0] + (Math.random() - 0.5) * 0.4, y: p[1] + (Math.random() - 0.5) * 0.4, t0: t, life: 0.6 });
    }
    const bob = Math.sin(t * 1.6 + i) * cell * 0.012;
    const beetle = s.beetles.includes(i) && !(G.beetleAnim && G.beetleAnim.to[0] === p[0] && G.beetleAnim.to[1] === p[1]);
    // Soft shadow under the pad.
    ctx.save();
    ctx.globalAlpha = 0.18 * alpha; ctx.fillStyle = '#062a33';
    ctx.beginPath(); ctx.ellipse(px + cell * 0.04, py + cell * 0.06, size * 0.45, size * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawSprite(key, px, py + bob, size, { rot, alpha: alpha * (beetle ? 0.75 : 1) });
    if (sink) return;
    // Fly.
    const fly = s.flies & (1 << i);
    if (fly) {
      const fx = px + Math.sin(t * 3 + i * 2) * cell * (beetle ? 0.28 : 0.04);
      const fy = py - cell * 0.08 + Math.cos(t * 3.4 + i) * cell * (beetle ? 0.22 : 0.03);
      drawSprite('fly', fx, fy, cell * (beetle ? 0.22 : 0.32), { rot: Math.sin(t * 20 + i) * 0.08, scaleY: 0.92 + 0.08 * Math.sin(t * 40 + i) });
    }
    if (beetle) {
      let wob = 0;
      if (G.wobbleBeetle && G.wobbleBeetle.x === p[0] && G.wobbleBeetle.y === p[1] && t > G.wobbleBeetle.t && t < G.wobbleBeetle.t + 0.5) {
        wob = Math.sin((t - G.wobbleBeetle.t) * 40) * 0.25;
      }
      drawSprite('beetle', px, py, cell * 0.5, { rot: Math.sin(t * 2 + i) * 0.1 + wob });
    }
    // A little lotus opens on each pad once its fly is eaten: the garden grows as you go.
    if (!fly && i !== 0) {
      const e = G.eatenAt && G.eatenAt[i] ? Math.min(1, (t - G.eatenAt[i]) / 0.5) : 1;
      const pop = e < 1 ? Math.sin(e * Math.PI) * 0.3 + e : 1;
      drawSprite(e < 0.4 ? 'lotus-bud' : 'lotus-pink', px - cell * 0.3, py - cell * 0.28 + bob, cell * 0.3 * pop, { rot: i });
    }
    // Pips.
    drawPips(i, px, py + bob, cell, pips, !!fly, i === frogPadIdx && !G.anim, t);
  });
  // Beetle in flight.
  if (G.beetleAnim && t >= G.beetleAnim.t0) {
    const a = G.beetleAnim, k = Math.min(1, (t - a.t0) / a.dur);
    const e = k * k * (3 - 2 * k);
    const [ax, ay] = cellCenter(a.from[0], a.from[1]), [bx, by] = cellCenter(a.to[0], a.to[1]);
    drawSprite('beetle', ax + (bx - ax) * e, ay + (by - ay) * e - Math.sin(k * Math.PI) * cell * 0.25, cell * 0.5, { rot: k * Math.PI * 2 });
  } else if (G.beetleAnim) {
    const [ax, ay] = cellCenter(G.beetleAnim.from[0], G.beetleAnim.from[1]);
    drawSprite('beetle', ax, ay, cell * 0.5);
  }
  // Tongue markers on beetles in reach, with where they'd go.
  if (!G.anim && s.status === 'play' && !s.leapArmed) {
    for (const d of R.DIR_KEYS) {
      const f = R.flickInfo(L, s, d);
      if (!f) continue;
      const [bx, by] = cellCenter(f.bx, f.by);
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = f.to >= 0 ? C.pink : 'rgba(240,138,168,0.45)';
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx + cell * 0.3, by - cell * 0.3, cell * 0.11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink;
      text('t', bx + cell * 0.3, by - cell * 0.31, cell * 0.15, { color: C.ink, weight: 700 });
      if (f.to >= 0) {
        const [tx, ty] = cellCenter(f.tx, f.ty);
        ctx.setLineDash([cell * 0.06, cell * 0.06]);
        ctx.strokeStyle = 'rgba(240,138,168,0.8)'; ctx.lineWidth = Math.max(2, cell * 0.04);
        const [dx, dy] = R.DIRS[d];
        ctx.beginPath(); ctx.moveTo(bx + dx * cell * 0.3, by + dy * cell * 0.3); ctx.lineTo(tx - dx * cell * 0.3, ty - dy * cell * 0.3); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        const ex = tx - dx * cell * 0.3, ey = ty - dy * cell * 0.3;
        ctx.moveTo(ex, ey); ctx.lineTo(ex - dx * cell * 0.1 - dy * cell * 0.08, ey - dy * cell * 0.1 - dx * cell * 0.08);
        ctx.moveTo(ex, ey); ctx.lineTo(ex - dx * cell * 0.1 + dy * cell * 0.08, ey - dy * cell * 0.1 + dx * cell * 0.08);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Flashes (what's in the way, hint target).
  for (const f of G.flashes) {
    const [px, py] = cellCenter(f.x, f.y);
    const k = (t - f.t) / 0.7;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.strokeStyle = f.color; ctx.lineWidth = Math.max(3, cell * 0.08);
    ctx.beginPath(); ctx.arc(px, py, cell * (0.42 + k * 0.12), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (G.bloom) drawBloom(t, cell);
  drawFrog(t, cell);
  drawParticles(t, cell);
  if (areaOf(L) === 'moon') drawFireflies(t);
}

function reachable() {
  const L = G.L, s = G.s, out = [];
  if (G.anim || s.status !== 'play' || G.overlay || G.bloom) return out;
  if (s.leapArmed) {
    for (const d of R.DIR_KEYS) R.leapTargets(L, s, d).forEach((tg, i) => {
      if (R.isDunkMove(L, s, 'J' + d + (i + 1))) return;
      out.push({ x: tg.x, y: tg.y, leap: true, selected: G.leapSel && G.leapSel.d === d && G.leapSel.n === i + 1 });
    });
    return out;
  }
  for (const d of R.DIR_KEYS) {
    const tg = R.hopTarget(L, s, d);
    if (tg && !tg.blocked && !R.isDunkMove(L, s, d)) out.push({ x: tg.x, y: tg.y });
  }
  return out;
}

function drawPips(i, px, py, cell, pips, hasFly, frogOn, t) {
  const r = Math.max(4.5, cell * 0.09);
  let cx = px, cy = py + cell * 0.24, gap = r * 2.5;
  let tab = false;
  if (frogOn) { cy = py + cell * 0.37; tab = true; }
  else if (G.s.beetles.includes(i)) { cy = py + cell * 0.36; }
  else if (!hasFly) { cy = py; gap = r * 2.7; }
  const big = !frogOn && !hasFly ? 1.15 : 1;
  const rad = r * big;
  const w = (pips - 1) * gap;
  if (tab) {
    ctx.save();
    rr(cx - w / 2 - rad * 1.6, cy - rad * 1.5, w + rad * 3.2, rad * 3, rad * 1.5);
    ctx.fillStyle = 'rgba(31,85,96,0.85)'; ctx.fill();
    ctx.strokeStyle = C.cream; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  for (let k = 0; k < pips; k++) {
    let a = 1;
    if (pips === 1 && frogOn) a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 6)); // the last pip blinks
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(cx - w / 2 + k * gap, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = C.cream; ctx.fill();
    ctx.lineWidth = Math.max(1.5, rad * 0.35); ctx.strokeStyle = '#1e3a24'; ctx.stroke();
    ctx.restore();
  }
}

function drawTurtle(tt, i, t, cell) {
  const [x, y] = tt;
  const [px, py] = cellCenter(x, y);
  const v = G.turtleVis[i] ?? 1;
  const up = R.turtleUp(tt, G.s.turn);
  const r = cell * 0.5;
  if (v < 0.98) {
    // Under water: dark silhouette with a light edge and a slow ripple.
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - v);
    drawSprite('turtle-dark', px, py, cell * 0.82, { rot: Math.sin(t * 0.5 + i) * 0.1 });
    ctx.globalAlpha = 0.3 * (1 - v);
    ctx.strokeStyle = '#d8f3f0'; ctx.lineWidth = 2;
    const ph = (t * 0.4) % 1;
    ctx.beginPath(); ctx.ellipse(px, py, cell * (0.3 + 0.15 * ph), cell * (0.24 + 0.12 * ph), 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (v > 0.02) drawSprite('turtle', px, py + (1 - v) * cell * 0.05, cell * 0.9 * (0.85 + 0.15 * v), { alpha: v, rot: Math.sin(t * 0.7 + i) * 0.04 });
  // Ring: filled dots = moves it will hold you; red = it dives as you land.
  // Under water: hollow dots = moves until it surfaces.
  if (G.bloom) return;
  let n, filled, color;
  if (up) {
    n = R.turtleHold(tt, G.s.turn); filled = true;
    color = n === 0 ? C.red : C.cream;
  } else {
    n = 0; while (n < 8 && !R.turtleUp(tt, G.s.turn + n)) n++;
    filled = false; color = 'rgba(216,243,240,0.9)';
  }
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, cell * 0.05);
  if (up) { ctx.setLineDash(n === 0 ? [] : [cell * 0.08, cell * 0.05]); ctx.beginPath(); ctx.arc(px, py, r * 0.98, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  const dots = Math.max(1, up && n === 0 ? 0 : n);
  const dr = Math.max(4, cell * 0.075);
  if (!up) {
    // Moves until it surfaces, as a small badge on the turtle's shadow.
    const br = Math.max(9, cell * 0.15);
    ctx.beginPath(); ctx.arc(px, py, br, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(31,85,96,0.85)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d8f3f0'; ctx.stroke();
    text('↑' + n, px, py + 1, br * 1.05, { color: '#e8fbff', weight: 700 });
  } else if (n > 0) {
    for (let k = 0; k < dots; k++) {
      const a = -Math.PI / 2 + (k - (dots - 1) / 2) * 0.42;
      const dx = px + Math.cos(a) * r * 0.98, dy = py + Math.sin(a) * r * 0.98;
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = filled ? C.cream : 'rgba(31,85,96,0.7)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = filled ? '#1e3a24' : '#d8f3f0'; ctx.stroke();
    }
  } else {
    // Warning drops.
    text('!', px + r * 0.72, py - r * 0.72, cell * 0.28, { color: C.red, weight: 700, stroke: C.cream });
  }
  ctx.restore();
}

function frogFrame(t) {
  if (G.bloom && t - G.bloom.t0 > 0.5) {
    const k = Math.floor((t - G.bloom.t0) * 6) % 4;
    return ['frog-celebrate-1', 'frog-celebrate-2', 'frog-celebrate-1', 'frog'][k];
  }
  if (G.anim && G.anim.type === 'hop') {
    const k = (t - G.anim.t0) / G.anim.dur;
    if (k > 0.12 && k < 0.88) return 'frog-hop-1';
  }
  // Blink now and then.
  if ((t % 4.3) < 0.15) return 'frog-idle-1';
  return 'frog';
}
function drawFrog(t, cell) {
  const s = G.s;
  let x = s.fx, y = s.fy, lift = 0, sq = 1;
  const a = G.anim;
  if (a && a.type === 'hop') {
    const k = Math.min(1, (t - a.t0) / a.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    x = a.from[0] + (a.to[0] - a.from[0]) * e;
    y = a.from[1] + (a.to[1] - a.from[1]) * e;
    lift = Math.sin(k * Math.PI) * (a.leap ? 0.55 : 0.35);
    sq = k < 0.1 ? 1 - k * 1.2 : k > 0.9 ? 1 - (1 - k) * 1.2 : 1;
  }
  let dunk = 0;
  if (a && a.type === 'dunk') dunk = Math.min(1, (t - a.t0) / 0.4);
  if (G.overlay === 'dunked') dunk = 1;
  const [px, py0] = cellCenter(x, y);
  const py = py0 - cell * 0.06;
  // Shadow.
  ctx.save();
  ctx.globalAlpha = 0.22 * (1 - dunk);
  ctx.fillStyle = '#062a33';
  ctx.beginPath(); ctx.ellipse(px + cell * 0.05 + lift * cell * 0.15, py + cell * 0.1 + lift * cell * 0.2, cell * 0.28 * (1 - lift * 0.3), cell * 0.24 * (1 - lift * 0.3), 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const key = frogFrame(t);
  const im = IMG[key] || IMG.frog || IMG.anchor;
  if (!im) return;
  // Scale: the sit subject is 0.62 cell.
  const subject = FROG ? Math.max(FROG.sitSubject[0], FROG.sitSubject[1]) : 664;
  const pivot = FROG ? FROG.pivot : [im.width / 2, im.height / 2];
  let k = (cell * 0.62) / subject;
  k *= 1 + lift * 0.45;
  if (G.bloom) k *= 1 + 0.12 * Math.abs(Math.sin((t - G.bloom.t0) * 6));
  let rot = currentFacing();
  if (G.frogWobble && t - G.frogWobble < 0.35) rot += Math.sin((t - G.frogWobble) * 40) * 0.12;
  if (G.bloom && t - G.bloom.t0 > 0.5) rot = Math.sin((t - G.bloom.t0) * 3) * 0.25;
  ctx.save();
  ctx.translate(px, py - lift * cell * 0.25);
  ctx.rotate(rot);
  ctx.scale(k * sq, k * (2 - sq));
  if (dunk) {
    ctx.globalAlpha = 1 - dunk * 0.55;
    ctx.scale(1 - dunk * 0.25, 1 - dunk * 0.25);
  }
  // Tongue (drawn under the frog's head).
  if (a && a.type === 'tongue') drawTongue(t, a, cell, k);
  ctx.drawImage(im, -pivot[0], -pivot[1]);
  if (dunk) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(40,110,150,' + (0.45 * dunk) + ')';
    ctx.fillRect(-pivot[0], -pivot[1], im.width, im.height);
  }
  ctx.restore();
  if (dunk > 0 && a && a.type === 'dunk') {
    ripple(s.fx, s.fy);
  }
}
function drawTongue(t, a, cell, k) {
  // In frog-local units (rotated to face up, scaled by k).
  const kk = Math.min(1, (t - a.t0) / a.dur);
  const out = kk < 0.5 ? kk * 2 : (1 - kk) * 2;
  const [fx, fy] = [G.s.fx, G.s.fy];
  const dist = Math.hypot(a.to[0] - fx, a.to[1] - fy) * cell / k;
  const len = dist * out;
  const nose = (FROG ? FROG.noseDist : 300) * 0.75;
  ctx.save();
  ctx.strokeStyle = '#e66a8c'; ctx.lineCap = 'round';
  ctx.lineWidth = cell * 0.07 / k;
  ctx.beginPath(); ctx.moveTo(0, -nose); ctx.lineTo(0, -nose - len); ctx.stroke();
  ctx.fillStyle = '#f08aa8';
  ctx.beginPath(); ctx.arc(0, -nose - len, cell * 0.07 / k, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawParticles(t, cell) {
  for (const p of G.particles) {
    const k = (t - p.t0) / p.life;
    if (k < 0) continue;
    const [px, py] = cellCenter(p.x, p.y);
    ctx.save();
    if (p.kind === 'ripple') {
      ctx.globalAlpha = 0.6 * (1 - k); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px, py, cell * (0.35 + k * 0.35), cell * (0.3 + k * 0.3), 0, 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === 'drop') {
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(px + p.vx * k * cell * 0.6, py + p.vy * k * cell * 0.6, Math.max(1.5, cell * 0.03), 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'pip') {
      ctx.globalAlpha = 1 - k; ctx.fillStyle = C.cream; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px + k * cell * 0.3, py + cell * 0.3 - Math.sin(k * Math.PI) * cell * 0.4, cell * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (p.kind === 'gulp') {
      drawSprite('fly', px, py - cell * 0.1 * (1 - k), cell * 0.3 * (1 - k), { alpha: 1 - k, rot: k * 6 });
    } else if (p.kind === 'plus') {
      ctx.globalAlpha = 1 - k * k;
      text('+1', px + cell * 0.3, py - cell * 0.4 - k * cell * 0.5, Math.max(14, cell * 0.32), { color: '#fff4dc', stroke: '#2d3a1e', weight: 700 });
    } else if (p.kind === 'bubbleup') {
      ctx.globalAlpha = 0.7 * (1 - k); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py - k * cell * 0.3, cell * 0.04 + k * cell * 0.03, 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === 'fish') {
      const h = Math.sin(k * Math.PI);
      ctx.globalAlpha = 0.25 * (1 - h); ctx.fillStyle = '#062a33';
      ctx.beginPath(); ctx.ellipse(px, py + cell * 0.1, cell * 0.3, cell * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      drawSprite('fish', px, py - h * cell * 0.6, cell * (0.7 + h * 0.35), { rot: k * Math.PI * 1.2 - 0.6 });
      if (k > 0.85) { ctx.globalAlpha = (1 - k) * 4; drawSplash(px, py, cell); }
    } else if (p.kind === 'bubble') {
      const slot = LAY.bar.find(b => b.id === 'power');
      const tx = slot.x + slot.w / 2, ty = slot.y + slot.h * 0.4;
      const e = k * k;
      const bx = px + (tx - px) * e, by = py - cell * 0.6 + (ty - py + cell * 0.6) * e;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(230,250,255,0.35)'; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, cell * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawSprite('pu-' + p.item, bx, by, cell * 0.4);
    }
    ctx.restore();
  }
}
function drawSplash(px, py, cell) {
  ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * cell * 0.2, py + Math.sin(a) * cell * 0.15);
    ctx.lineTo(px + Math.cos(a) * cell * 0.35, py + Math.sin(a) * cell * 0.27); ctx.stroke();
  }
}
function drawBloom(t, cell) {
  const b = G.bloom, bt = t - b.t0;
  // Warm light.
  ctx.save();
  ctx.globalAlpha = Math.min(0.18, bt * 0.08);
  ctx.fillStyle = '#ffe2a8';
  ctx.fillRect(0, 0, VW, VH);
  ctx.restore();
  for (const f of b.flowers) {
    const k = (bt - f.delay) / 0.55;
    if (k <= 0) continue;
    const [px, py] = cellCenter(f.x, f.y);
    const e = Math.min(1, k);
    const pop = e < 1 ? 1 + Math.sin(e * Math.PI) * 0.25 : 1;
    if (e < 0.45) drawSprite('lotus-bud', px, py, cell * f.s * (0.4 + e), { rot: f.rot });
    else drawSprite(f.kind, px, py, cell * f.s * pop, { rot: f.rot + (1 - e) * 0.8 });
    if (k > 0 && k < 1.2 && Math.random() < 0.04) G.particles.push({ kind: 'drop', x: f.x, y: f.y, vx: (Math.random() - 0.5), vy: -Math.random(), color: '#f8c1d2', t0: t, life: 0.8 });
  }
  // Drifting petals.
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const ph = (bt * 0.15 + i * 0.137) % 1;
    const x = LAY.board.x + ((i * 97) % 100) / 100 * LAY.board.size + Math.sin(bt + i) * 20;
    const y = LAY.board.y - 20 + ph * (LAY.board.size + 40);
    ctx.globalAlpha = Math.min(1, bt * 0.5) * 0.85;
    ctx.fillStyle = i % 3 ? '#f8b4c8' : '#fff0f4';
    ctx.beginPath(); ctx.ellipse(x, y, cell * 0.08, cell * 0.04, bt * 2 + i, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawFireflies(t) {
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const x = (Math.sin(t * 0.13 * (1 + i % 3) + i * 7.1) * 0.5 + 0.5) * VW;
    const y = (Math.cos(t * 0.11 * (1 + i % 4) + i * 3.3) * 0.5 + 0.5) * VH;
    const a = 0.3 + 0.5 * Math.max(0, Math.sin(t * 2 + i * 1.7));
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, `rgba(255,240,150,${a})`); g.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
  }
  ctx.restore();
}

// ---------- drawing: HUD and cards ----------
function drawHUD(t) {
  const L = G.L, s = G.s, h = LAY.hud;
  // Title chip.
  const title = G.mode === 'wild' ? `Wild Pond #${G.pondNo}` : G.mode === 'fixture' ? L.name : `${G.levelNo} · ${L.name}`;
  ctx.font = `600 18px ${FONT}`;
  const room = LAY.hudCol ? 150 : LAY.mute.x - h.x - 10 - 92 - 10 - 40;
  const tw = Math.max(90, Math.min(ctx.measureText(title).width + 28, room));
  rr(h.x, h.y, tw, 40, 20); ctx.fillStyle = C.panel; ctx.fill();
  text(title, h.x + tw / 2, h.y + 21, 18, { maxW: tw - 20 });
  // Flies left.
  const left = R.fliesLeft(s);
  const bx = LAY.hudCol ? h.x : h.x + tw + 10;
  if (LAY.hudCol) h.y += 50;
  const bounce = G.flyBounce && t - G.flyBounce < 0.3 ? 1 + Math.sin((t - G.flyBounce) / 0.3 * Math.PI) * 0.25 : 1;
  rr(bx, h.y, 92, 40, 20); ctx.fillStyle = C.panel; ctx.fill();
  drawSprite('fly', bx + 24, h.y + 20, 28 * bounce);
  text('× ' + left, bx + 60, h.y + 21, 20 * bounce, { weight: 700 });
  // Gold bud: dims when a hint is used.
  drawSprite(G.hintUsed ? 'lotus-bud' : 'lotus-gold', bx + 92 + 24, h.y + 20, 30, { alpha: G.hintUsed ? 0.35 : 1 });
  if (LAY.hudCol) h.y -= 50;
  // Corner buttons.
  button(LAY.pause, '', { icon: 'pause' });
  addButton(LAY.pause, togglePause);
  button(LAY.mute, '', { icon: audio.allMuted ? 'muted' : 'sound' });
  addButton(LAY.mute, () => audio.toggleAll());
  // Action bar.
  for (const b of LAY.bar) {
    if (b.id === 'power') {
      const usable = R.canMend(L, s) || R.canArmLeap(L, s) || s.leapArmed;
      const teach = s.slot && usable && !save.data.powerUsed && Math.sin(t * 5) > 0;
      button(b, '', { disabled: !s.slot, primary: s.leapArmed || teach });
      if (s.slot) drawSprite('pu-' + s.slot, b.x + b.w / 2, b.y + b.h * 0.42, b.h * 0.5, { alpha: usable ? 1 : 0.4 });
      else { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = C.ink; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h * 0.42, b.h * 0.2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      const lbl = s.leapArmed ? 'Cancel' : s.slot === 'mend' ? 'Mend' : s.slot === 'leap' ? 'Leap' : 'Gift';
      text(lbl, b.x + b.w / 2, b.y + b.h * 0.83, Math.min(13, b.h * 0.2), { color: s.slot ? C.ink : 'rgba(45,58,30,0.45)' });
      addButton(b, () => act({ type: 'power' }), { disabled: !s.slot || !usable });
    } else if (b.id === 'undo') {
      button(b, 'Undo', { icon: 'undo', disabled: !G.hist.length });
      addButton(b, () => act({ type: 'undo' }), { disabled: !G.hist.length });
    } else if (b.id === 'retry') {
      const pulse = G.retryPulse && t - G.retryPulse < 3;
      button(b, 'Retry', { icon: 'retry', primary: pulse && Math.sin(t * 6) > 0 });
      addButton(b, () => act({ type: 'retry' }));
    } else if (b.id === 'hint') {
      const pending = G.hint === 'pending';
      const pulse = !pending && t - G.lastFly > 45 && s.status === 'play';
      button(b, pending ? '' : 'Hint', { icon: pending ? null : 'hint', primary: pulse && Math.sin(t * 3) > 0 });
      if (pending) {
        ctx.save(); ctx.strokeStyle = C.jade; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.h * 0.22, t * 6, t * 6 + 4.2); ctx.stroke(); ctx.restore();
      }
      addButton(b, () => act({ type: 'hint' }));
    }
  }
  // Leap armed banner.
  if (s.leapArmed) {
    const B = LAY.board;
    text('Pick a gold pad to leap to!', B.x + B.size / 2, B.y - 14, 16, { color: C.cream, stroke: '#1f3a2a' });
  }
}

function drawBubble(t) {
  const b = G.bubble;
  if (!b || t < b.t) { if (b) b.rect = null; return; }
  const B = LAY.board;
  const maxW = Math.min(B.size * 0.9, 420);
  const lines = wrap(b.text, maxW - 76, 17);
  const h = lines.length * 22 + 26;
  const frogLow = G.s && G.L && G.s.fy >= G.L.h / 2;
  const x = B.x + (B.size - maxW) / 2, y = frogLow ? B.y + 10 : B.y + B.size - h - 10;
  const a = Math.min(1, (t - b.t) * 4);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 10;
  rr(x, y, maxW, h, 16); ctx.fillStyle = 'rgba(255,250,236,0.97)'; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = C.jade; ctx.lineWidth = 2.5; ctx.stroke();
  drawFrogSprite('frog', x + 22, y + h / 2, 24);
  lines.forEach((ln, i) => text(ln, x + 44, y + 24 + i * 22, 17, { align: 'left', weight: 500, maxW: maxW - 76 }));
  // Gift tips count as seen only once they've been on screen a while.
  if (b.seenKey && t - b.t > 1.5) { save.data.giftSeen[b.seenKey] = true; save.write(); b.seenKey = null; }
  text('×', x + maxW - 14, y + 14, 16, { color: 'rgba(45,58,30,0.5)' });
  ctx.restore();
  b.rect = { x, y, w: maxW, h };
}
function drawToast(t) {
  if (!G.toast) return;
  const k = t - G.toast.t;
  const a = k < 0.2 ? k / 0.2 : k > 2.6 ? Math.max(0, (3 - k) / 0.4) : 1;
  const B = LAY.board;
  const lines = wrap(G.toast.text, Math.min(B.size, 460) - 40, 17);
  const w = Math.min(B.size, 460), h = lines.length * 22 + 18;
  const x = B.x + (B.size - w) / 2, y = B.y + 8;
  ctx.save();
  ctx.globalAlpha = a;
  rr(x, y, w, h, 14); ctx.fillStyle = 'rgba(31,58,42,0.9)'; ctx.fill();
  lines.forEach((ln, i) => text(ln, x + w / 2, y + 20 + i * 22, 17, { color: C.cream, weight: 500 }));
  ctx.restore();
}
function card(w, h) {
  const x = (VW - w) / 2, y = (VH - h) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  rr(x, y, w, h, 24); ctx.fillStyle = C.panel; ctx.fill();
  ctx.restore();
  rr(x, y, w, h, 24); ctx.strokeStyle = C.jade; ctx.lineWidth = 3; ctx.stroke();
  return { x, y, w, h };
}
function dim(a = 0.35) { ctx.fillStyle = `rgba(10,30,35,${a})`; ctx.fillRect(0, 0, VW, VH); }

function drawOverlay(t) {
  const o = G.overlay;
  if (!o) return;
  const W = Math.min(VW - 32, 380);
  if (o === 'pause') {
    dim(0.5);
    const n = 5;
    const H = Math.min(360, VH - SAFE.t - SAFE.b - 16);
    const c = card(W, H);
    const bh = Math.min(50, (H - 90) / n - 8);
    text('Paused', c.x + W / 2, c.y + Math.min(42, bh + 6), Math.min(30, bh * 0.75), { weight: 700 });
    const bw = W - 60;
    const items = [
      ['Resume', () => togglePause(), true],
      ['Retry', () => { togglePause(); act({ type: 'retry' }); }],
      ['Levels', () => goScreen(G.mode === 'wild' ? 'title' : 'levels')],
      [`Music: ${audio.musicMuted ? 'off' : 'on'}`, () => audio.setMusicMuted(!audio.musicMuted)],
      [`Sounds: ${audio.sfxMuted ? 'off' : 'on'}`, () => audio.setSfxMuted(!audio.sfxMuted)],
    ];
    items.forEach(([label, on, primary], i) => {
      const b = { x: c.x + 30, y: c.y + H - 16 - (n - i) * (bh + 8) + 8, w: bw, h: bh };
      button(b, label, { primary, small: true, focus: G.menuFocus % items.length === i });
      addButton(b, on, { menu: true });
    });
  } else if (o === 'stuck' || o === 'dunked') {
    dim(0.3);
    const c = card(W, 200);
    text(o === 'stuck' ? 'Stuck!' : 'Splash! Dunked!', c.x + W / 2, c.y + 40, 28, { weight: 700 });
    text(o === 'stuck' ? 'No hops left from here.' : 'The turtle dived. Hop back and try again!', c.x + W / 2, c.y + 80, 16, { weight: 500, maxW: W - 30 });
    const bw = (W - 80) / 2;
    const u = { x: c.x + 30, y: c.y + 120, w: bw, h: 56 }, r = { x: c.x + 50 + bw, y: c.y + 120, w: bw, h: 56 };
    button(u, 'Undo', { icon: 'undo', primary: true }); addButton(u, () => act({ type: 'undo' }));
    button(r, 'Retry', { icon: 'retry' }); addButton(r, () => act({ type: 'retry' }));
  } else if (o === 'complete') {
    const k = Math.min(1, (t - (G.bloom ? G.bloom.t0 + G.bloom.dur : t)) * 3 + 0.01);
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, k);
    const c = card(W, 300);
    const gold = !G.hintUsed;
    text(G.mode === 'wild' ? `Pond #${G.pondNo} in Bloom!` : 'Pond in Bloom!', c.x + W / 2, c.y + 40, 28, { weight: 700, maxW: W - 30 });
    text(`${G.L.pads.length - 1} flies eaten · ${G.s.turn} moves`, c.x + W / 2, c.y + 78, 17, { weight: 500 });
    drawSprite(gold ? 'lotus-gold' : 'lotus-pink', c.x + W / 2, c.y + 128, 60);
    if (gold) {
      for (let i = 0; i < 5; i++) {
        const a = t * 1.5 + i * 1.26;
        text('✦', c.x + W / 2 + Math.cos(a) * 42, c.y + 128 + Math.sin(a) * 32, 12, { color: C.gold });
      }
    }
    text(gold ? 'Gold flower! Solved without a hint.' : 'Solved! (Gold flowers are for no-hint wins.)', c.x + W / 2, c.y + 176, 15, { weight: 500, maxW: W - 30 });
    const bw = (W - 80) / 3;
    const isLast = G.mode === 'main' && G.levelNo >= 12;
    const items = [
      [G.mode === 'wild' ? 'Levels' : 'Levels', () => goScreen(G.mode === 'wild' ? 'title' : 'levels')],
      ['Replay', () => startLevel({})],
      [isLast ? 'Finish' : 'Next', () => nextLevel(), true],
    ];
    items.forEach(([label, on, primary], i) => {
      const b = { x: c.x + 25 + i * (bw + 15), y: c.y + 212, w: bw, h: 58 };
      button(b, label, { primary, small: true });
      addButton(b, on);
    });
    ctx.restore();
  }
}

// ---------- screens ----------
function drawDecorRing(t, key) {
  drawCover(key);
  const m = Math.min(VW, VH);
  const items = [
    ['pad-3', 0.08, 0.12, 0.2], ['lotus-pink', 0.16, 0.08, 0.1], ['pad-2', 0.9, 0.1, 0.17], ['lotus-white', 0.82, 0.16, 0.09],
    ['reeds', 0.05, 0.55, 0.2], ['pad-3', 0.92, 0.6, 0.19], ['lotus-pink', 0.86, 0.68, 0.1], ['pad-1', 0.12, 0.88, 0.16],
    ['lotus-bud', 0.22, 0.92, 0.08], ['lotus-pink', 0.08, 0.32, 0.08], ['reeds', 0.94, 0.9, 0.18], ['pad-2', 0.72, 0.94, 0.15],
    ['lotus-white', 0.6, 0.06, 0.07],
  ];
  for (const [k, fx, fy, fs] of items) drawSprite(k, fx * VW, fy * VH, m * fs, { rot: (fx * 9 + fy * 5) + Math.sin(t * 0.5 + fx * 10) * 0.05 });
  // Dragonflies.
  for (let i = 0; i < 2; i++) {
    const x = VW * (0.5 + 0.42 * Math.sin(t * 0.21 + i * 3)), y = VH * (0.5 + 0.4 * Math.sin(t * 0.17 + i * 2));
    drawSprite('dragonfly', x, y, m * 0.07, { rot: t * 0.21 + i * 3 + Math.PI / 2, scaleY: 0.9 + 0.1 * Math.sin(t * 30) });
  }
}
// A def with { half: 'left' } or { half: 'right' } shares its row with its neighbour.
function menuButtons(defs, top, bw, bh) {
  const btns = [];
  let row = -1;
  defs.forEach(([label, on, opts = {}]) => {
    if (opts.half !== 'right') row++;
    const b = { x: (VW - bw) / 2, y: top + row * (bh + 12), w: bw, h: bh };
    if (opts.half) { b.w = (bw - 12) / 2; if (opts.half === 'right') b.x += b.w + 12; }
    const focus = G.menuFocus % defs.filter(d => !(d[2] || {}).disabled).length === btns.length && !opts.disabled;
    button(b, label, { ...opts, focus, small: opts.small || !!opts.half });
    addButton(b, on, { menu: true, disabled: opts.disabled });
    if (!opts.disabled) btns.push(b);
  });
}
function drawTitle(t) {
  drawDecorRing(t, 'bg-morning');
  const m = Math.min(VW, VH);
  const tsz = Math.min(84, VW * 0.16, VH * 0.13);
  const ty = Math.max(SAFE.t + tsz * 0.7, Math.min(VH * 0.24, VH * 0.5 - 140));
  const tagY = ty + tsz * 0.68;
  const bh = Math.max(40, Math.min(54, (VH - SAFE.b - 30) * 0.11));
  const menuTop = Math.min(Math.max(VH * 0.56, ty + 120), VH - SAFE.b - 26 - 4 * (bh + 12));
  text('Bloom Hop', VW / 2, ty, tsz, { color: '#fff4dc', stroke: '#2e5a33', weight: 700 });
  if (menuTop > tagY + 22) text('hop every pad · eat every fly · make the pond bloom', VW / 2, tagY, Math.min(18, VW * 0.04), { color: '#fff4dc', stroke: '#2e5a33', weight: 500, maxW: VW - 24 });
  const room = menuTop - (tagY + 14);
  const fy = menuTop - room / 2 - 6;
  const ps = Math.min(m * 0.2, room * 0.9);
  if (ps > 40) {
    drawSprite('pad-3', VW / 2, fy, ps, { rot: 0.4 });
    const blink = (t % 3.7) < 0.15;
    drawFrogSprite(blink ? 'frog-idle-1' : 'frog', VW / 2, fy, ps * 0.6 * (1 + 0.02 * Math.sin(t * 2)));
  }
  const anyCleared = Object.keys(save.data.cleared).length > 0;
  const wildOpen = !!save.data.cleared[8] && WILD.length > 0;
  const bw = Math.min(280, VW - 60);
  menuButtons([
    [anyCleared ? 'Continue' : 'Play', () => continueLevel(), { primary: true }],
    ['Levels', () => goScreen('levels')],
    [wildOpen ? 'Wild Pond' : 'Wild Pond (after level 8)', () => startLevel({ mode: 'wild', pondNo: save.data.wildNext || 1 }), { disabled: !wildOpen }],
    ['How to Play', () => { G.howtoPage = 0; G.howtoThen = null; goScreen('howto'); }, {}],
  ], menuTop, bw, bh);
  button(LAY.mute, '', { icon: audio.allMuted ? 'muted' : 'sound' });
  addButton(LAY.mute, () => audio.toggleAll());
  if (!audio.ctx) text(TOUCH ? 'Tap anywhere for sound' : 'Tap or press any key for sound', VW / 2, VH - SAFE.b - 18, 14, { color: '#fff4dc', stroke: '#2e5a33', weight: 500 });
}
function drawLevels(t) {
  drawDecorRing(t, 'bg-morning');
  text('Choose a Pond', VW / 2, SAFE.t + 44, Math.min(40, VW * 0.09), { color: '#fff4dc', stroke: '#2e5a33', weight: 700 });
  const cols = VW > VH ? 6 : 4, rows = Math.ceil(12 / cols);
  const areaW = Math.min(VW - 40, cols * 120), areaH = Math.min(VH - 200, rows * 130);
  const cw = areaW / cols, ch = areaH / rows;
  const x0 = (VW - areaW) / 2, y0 = SAFE.t + 90 + (VH - 200 - areaH) / 2;
  const areaNames = { morning: 'Morning', sunset: 'Sunset', moon: 'Moonlight' };
  let focusIdx = 0;
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(i / cols);
    const c = r % 2 === 0 ? i % cols : cols - 1 - (i % cols); // winding row
    const cx = x0 + (c + 0.5) * cw, cy = y0 + (r + 0.5) * ch;
    const n = i + 1, open = save.isUnlocked(n), done = save.data.cleared[n], gold = save.data.gold[n];
    const size = Math.min(cw, ch) * 0.82;
    const b = { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
    const focus = open && (G.menuFocus % countOpen()) === focusIdx;
    if (open) focusIdx++;
    if (focus) { ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    drawSprite(open ? 'pad-3' : 'pad-1', cx, cy, size, { alpha: open ? 1 : 0.6, rot: i * 0.9 });
    const L = LEVELS[i];
    if (gold) drawSprite('lotus-gold', cx + size * 0.28, cy - size * 0.28, size * 0.42);
    else if (done) drawSprite('lotus-pink', cx + size * 0.28, cy - size * 0.28, size * 0.4);
    else if (!open) drawSprite('lotus-bud', cx + size * 0.28, cy - size * 0.28, size * 0.35, { alpha: 0.7 });
    if (open) text(String(n), cx, cy, size * 0.36, { color: C.cream, stroke: '#1f3a24', weight: 700 });
    else drawIcon('lock', cx, cy, size * 0.3, 'rgba(31,58,36,0.75)');
    if (L) text(areaNames[L.area] || '', cx, cy + size * 0.5, Math.max(11, size * 0.12), { color: C.cream, stroke: '#1f3a24', weight: 500 });
    addButton(b, () => { if (open) startLevelChecked(n); }, { menu: true, disabled: !open });
  }
  const back = { x: SAFE.l + 12, y: SAFE.t + 20, w: 48, h: 48 };
  button(back, '', { icon: 'back' }); addButton(back, () => goScreen('title'));
  text(`Gold flowers: ${save.goldCount()} / 12`, VW / 2, VH - SAFE.b - 26, 17, { color: C.cream, stroke: '#1f3a24', weight: 600 });
}
function countOpen() { let n = 0; for (let i = 1; i <= 12; i++) if (save.isUnlocked(i)) n++; return Math.max(1, n); }

const TOUCH = matchMedia('(pointer: coarse)').matches;
const HOWTO = [
  { title: 'Hop and eat', touch: ['Tap a glowing pad to hop there (swipes work too).', 'You land on the first pad in line, up to 3 cells away.', 'Eat the fly on every pad to win.'], lines: ['Hop with the arrows, or tap a glowing pad (swipes work too).', 'You land on the first pad in line, up to 3 cells away.', 'Eat the fly on every pad to win.'] },
  { title: 'Pads sink!', lines: ['The dots show how many more hops a pad can take.', 'Each time you hop off, it loses a dot. At zero it sinks.', 'Sunk pads can be hopped over. Undo is free!'] },
  { title: 'Pond friends', lines: ['Beetles block pads: flick them away with your tongue (Shift + arrow, or tap the beetle).', 'Turtles are stepping stones that dive. The ring shows how many moves they will hold you.', 'Land next to a ripple and a fish brings a gift.'],
    touch: ['Beetles block pads: tap one to flick it away with your tongue.', 'Turtles are stepping stones that dive. The ring shows how many moves they will hold you.', 'Land next to a ripple and a fish brings a gift.'] },
];
function drawHowto(t) {
  drawDecorRing(t, 'bg-morning');
  const p = HOWTO[Math.min(2, G.howtoPage)];
  const W = Math.min(VW - 32, 460), H = Math.min(VH - 40, 480);
  const c = card(W, H);
  text(p.title, c.x + W / 2, c.y + 40, 30, { weight: 700 });
  // Illustration.
  const iy = c.y + 66, ih = Math.min(H * 0.26, 130), cx = c.x + W / 2;
  const u = Math.min(ih / 2.2, W / 5.5);
  rr(c.x + 20, iy, W - 40, ih, 16); ctx.fillStyle = '#4c9a9c'; ctx.fill();
  const icy = iy + ih / 2;
  if (G.howtoPage === 0) {
    drawSprite('pad-2', cx - u * 1.5, icy, u * 1.1);
    drawSprite('pad-1', cx + u * 0.5, icy, u * 1.1);
    drawSprite('fly', cx + u * 0.5, icy - u * 0.1, u * 0.38);
    const hop = (t % 2) / 2;
    const fx = cx - u * 1.5 + Math.min(1, hop * 1.6) * u * 2;
    drawFrogSprite(hop > 0.2 && hop < 0.55 ? 'frog-hop-1' : 'frog', fx, icy - Math.sin(Math.min(1, hop * 1.6) * Math.PI) * u * 0.3, u * 0.62, Math.PI / 2);
  } else if (G.howtoPage === 1) {
    ['pad-3', 'pad-2', 'pad-1'].forEach((k, i) => {
      const x = cx + (i - 1) * u * 1.4;
      drawSprite(k, x, icy, u * 1.1);
      const n = 3 - i;
      for (let j = 0; j < n; j++) { ctx.beginPath(); ctx.arc(x + (j - (n - 1) / 2) * u * 0.25, icy + u * 0.25, u * 0.09, 0, Math.PI * 2); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = '#1e3a24'; ctx.lineWidth = 2; ctx.stroke(); }
    });
  } else {
    drawSprite('pad-3', cx - u * 1.6, icy, u * 1.0);
    drawSprite('beetle', cx - u * 1.6, icy, u * 0.55);
    drawSprite('turtle', cx, icy, u * 1.0);
    ctx.strokeStyle = C.cream; ctx.lineWidth = 3; ctx.setLineDash([u * 0.1, u * 0.06]);
    ctx.beginPath(); ctx.arc(cx, icy, u * 0.55, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    drawSprite('fish', cx + u * 1.6, icy - Math.abs(Math.sin(t * 2)) * u * 0.3, u * 0.9, { rot: Math.sin(t * 2) * 0.4 });
    drawSprite('pu-mend', cx + u * 2.1, icy - u * 0.6, u * 0.4);
  }
  let y = iy + ih + 26;
  const lines = TOUCH ? (p.touch || p.lines) : p.lines;
  const fs = H < 470 ? 15 : 17;
  for (const ln of lines) {
    const ls = wrap(ln, W - 50, fs);
    ls.forEach(l => { text(l, c.x + 25, y, fs, { align: 'left', weight: 500 }); y += fs + 5; });
    y += 5;
  }
  // Page dots and buttons.
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(cx + (i - 1) * 18, c.y + H - 86, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === G.howtoPage ? C.jade : 'rgba(45,58,30,0.25)'; ctx.fill();
  }
  const bw = (W - 70) / 2;
  const b1 = { x: c.x + 25, y: c.y + H - 70, w: bw, h: 50 }, b2 = { x: c.x + 45 + bw, y: c.y + H - 70, w: bw, h: 50 };
  button(b1, G.howtoPage === 0 ? 'Skip' : 'Back', { small: true });
  addButton(b1, () => (G.howtoPage === 0 ? howtoPage(3) : howtoPage(-1)));
  button(b2, G.howtoPage === 2 ? (G.howtoThen ? "Let's hop!" : 'Done') : 'Next', { primary: true, small: true });
  addButton(b2, () => howtoPage(1));
}
function drawVictory(t) {
  drawCover('bg-moon');
  const m = Math.min(VW, VH);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + t * 0.03;
    const rx = VW * 0.42, ry = VH * 0.42;
    const k = Math.min(1, Math.max(0, (t - (G.victoryT || t) - i * 0.06) * 2));
    drawSprite(k < 0.4 ? 'lotus-bud' : i % 3 ? 'lotus-pink' : 'lotus-white', VW / 2 + Math.cos(a) * rx, VH / 2 + Math.sin(a) * ry, m * 0.12 * (0.4 + 0.6 * k), { rot: a * 3 });
  }
  drawFireflies(t);
  text('The whole pond is in bloom!', VW / 2, VH * 0.2, Math.min(36, VW * 0.07), { color: C.cream, stroke: '#1f2a4a', weight: 700, maxW: VW - 40 });
  drawSprite('pad-3', VW / 2, VH * 0.42, m * 0.24);
  const k = Math.floor(t * 5) % 3;
  drawFrogSprite(['frog-celebrate-1', 'frog-celebrate-2', 'frog'][k], VW / 2, VH * 0.42 - Math.abs(Math.sin(t * 5)) * m * 0.02, m * 0.14);
  text(`Gold flowers: ${save.goldCount()} / 12`, VW / 2, Math.min(VH * 0.58, VH - SAFE.b - 12 - 3 * 62 - 34), 20, { color: '#ffe08a', stroke: '#1f2a4a' });
  const wildOpen = WILD.length > 0;
  menuButtons([
    ['Wild Pond', () => startLevel({ mode: 'wild', pondNo: save.data.wildNext || 1 }), { primary: true, disabled: !wildOpen }],
    ['Levels', () => goScreen('levels')],
    ['Title', () => goScreen('title')],
  ], Math.min(VH * 0.64, VH - SAFE.b - 12 - 3 * 50 - 24), Math.min(260, VW - 60), Math.min(50, (VH - SAFE.b) * 0.12));
}

// ---------- main loop ----------
function frame() {
  try { pollControls(); draw(); if (frames % 6 === 0) window.PureGameHost?.publish?.(JSON.stringify(observe())); } catch (e) { console.error(e); keepError(e && e.message || e); }
  requestAnimationFrame(frame);
}
function draw() {
  update();
  const t = G.time;
  G.buttons = [];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  let sx = 0, sy = 0;
  if (shakeAmt && t - shakeT < 0.25) { sx = (Math.random() - 0.5) * shakeAmt * 2; sy = (Math.random() - 0.5) * shakeAmt * 2; }
  ctx.translate(sx, sy);
  if (G.screen === 'loading') {
    ctx.fillStyle = '#2f7f84'; ctx.fillRect(0, 0, VW, VH);
    text('Loading the pond…', VW / 2, VH / 2, 22, { color: C.cream });
  } else if (G.screen === 'title') drawTitle(t);
  else if (G.screen === 'levels') drawLevels(t);
  else if (G.screen === 'howto') drawHowto(t);
  else if (G.screen === 'victory') drawVictory(t);
  else if (G.screen === 'play') {
    drawPond(t);
    drawHUD(t);
    drawBubble(t);
    drawToast(t);
    drawOverlay(t);
  }
}

// Only the game RAF polls the native host. QA reads the cached sample and puzzle state.
const controller = createController({ keyboard: true, width: 168, onSuspend: suspend, onCancel: suspend });
let frames = 0;
function stage() {
  if (G.screen !== 'play') return G.screen === 'loading' ? 'loading' : 'menu';
  return G.overlay === 'pause' ? 'paused' : G.overlay === 'complete' ? 'complete' : 'playing';
}
function suspend() {
  keysDown.clear();
  ptr = null;
  G.buffered = null;
  G.spacePrefix = 0;
  if (stage() === 'playing') togglePause();
}
function pollControls() {
  frames++;
  controller.setPlaying(stage() === 'playing');
  const { pressed, buttons, cancelled } = controller.poll();
  if (cancelled || G.screen === 'loading') return;
  if (Object.values(pressed).some(Boolean)) audio.unlock();
  if (pressed.START) {
    if (G.screen === 'play' && G.overlay !== 'complete') togglePause();
    else if (G.screen === 'title') {
      const n = LEVELS.findIndex((_, i) => !save.data.cleared[i + 1]);
      startLevel({ mode: 'main', levelNo: n < 0 ? 12 : n + 1 });
    } else onKey('Enter', false);
    return;
  }
  const inMenu = G.screen !== 'play' || !!G.overlay;
  if (pressed.B && inMenu && G.overlay !== 'stuck' && G.overlay !== 'dunked') return onKey('Escape', false);
  if (pressed.B) return onKey('u', false);
  if (pressed.X) return onKey('e', false);
  if (pressed.Y) return inMenu ? onKey('Escape', false) : onKey('h', false);
  for (const [button, key] of Object.entries({ UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' })) {
    if (pressed[button]) return onKey(key, buttons.A && !inMenu);
  }
  if (pressed.A) {
    if (['stuck', 'dunked'].includes(G.overlay)) return act({ type: 'retry' });
    if (inMenu || G.s?.leapArmed || G.bloom) onKey('Enter', false);
    else onKey(' ', false);
  }
}
const observe = () => ({
  game: 'bloom-hop', ready: G.screen !== 'loading', renderer: 'canvas2d', webglVersion: null, frames, stage: stage(), paused: stage() === 'paused',
  gameplay: { level: G.levelNo, moves: G.moves, turn: G.s?.turn ?? 0, frogX: G.s?.fx ?? 0, frogY: G.s?.fy ?? 0,
    fliesLeft: G.s ? R.fliesLeft(G.s) : 0, undos: G.undos, overlay: G.overlay, area: G.L?.area ?? '' },
  controller: controller.peek(), errors: errors.slice(),
});
Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot: observe }) });
// ---------- boot ----------
resize();
requestAnimationFrame(frame);
loadAll().then(() => { G.screen = 'title'; });
