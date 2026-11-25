// GLUP — simulador sin pantalla. Carga el juego en Node con un canvas de mentira y
// expone una API para jugar fotograma a fotograma, guardar y restaurar el estado.
//   const sim = require('./sim'); const g = sim.load(); g.start(0, ['aleteo']); g.run({ right: 1 }, 60);
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
// The levels: every file in niveles/, in name order (each one places itself by its id).
const NIVELES = fs.readdirSync(path.join(ROOT, 'niveles')).filter(f => f.endsWith('.js')).sort().map(f => 'niveles/' + f);
// The songs: every file in musica/ (they only register data; audio is inert without an AudioContext).
const MUSICA = fs.readdirSync(path.join(ROOT, 'musica')).filter(f => f.endsWith('.js')).sort().map(f => 'musica/' + f);
const FILES = ['art.js', 'mundo.js', 'audio.js', ...MUSICA, 'levels.js', ...NIVELES, 'cine.js', 'titulo.js', 'mapa.js', 'hud.js', 'aprende.js', 'letra.js', 'maestros.js', 'fx.js', 'barca.js', 'victoria.js', 'garza.js', 'final.js', 'gramola.js', 'pausa.js', 'farol.js', 'game.js'].filter(f => fs.existsSync(path.join(ROOT, f)));

function stubContext() {
  const noop = () => { };
  const ctx2d = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createImageData' || k === 'getImageData') return (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
      if (k === 'createRadialGradient' || k === 'createLinearGradient' || k === 'createPattern') return () => ({ addColorStop: noop });
      if (k === 'measureText') return () => ({ width: 0 });
      // Like a real canvas: a negative radius throws (it froze the game once, unseen by these tests).
      if (k === 'ellipse') return (x, y, rx, ry) => { if (rx < 0 || ry < 0) throw new Error('ellipse con radio negativo: ' + rx + ', ' + ry); };
      if (k === 'arc') return (x, y, r) => { if (r < 0) throw new Error('arc con radio negativo: ' + r); };
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
  const makeEl = () => ({ style: {}, dataset: {}, hidden: false, textContent: '', width: 0, height: 0,
    classList: { toggle: noop, add: noop, remove: noop, contains: () => false },
    addEventListener: noop, removeEventListener: noop, setAttribute: noop, setPointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    getContext: () => ctx2d });
  const els = {};
  const document = {
    createElement: () => makeEl(), getElementById: id => els[id] || (els[id] = makeEl()), querySelectorAll: () => [],
    addEventListener: noop, body: makeEl(), documentElement: makeEl(), hidden: false, fullscreenEnabled: false };
  const store = {};
  const window = {
    document, location: { search: '', protocol: 'file:' }, navigator: { getGamepads: () => [] },
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); } },
    matchMedia: () => ({ matches: false, addEventListener: noop }), addEventListener: noop, innerWidth: 1280, innerHeight: 720,
    requestAnimationFrame: noop, performance: { now: () => 0 }, setTimeout: (f, ms) => { window.__timers.push({ f, at: window.__frame + Math.ceil(ms / 16.7) }); return 0; }, clearTimeout: noop,
    console, Math, Date, JSON, Set, Map, WeakMap, Array, Object, String, Number, Boolean, Uint8ClampedArray, Float32Array, Int16Array, Uint8Array, Promise, Proxy, Symbol, Error, isNaN, parseInt, parseFloat, structuredClone,
    __timers: [], __frame: 0 };
  window.window = window; window.self = window; window.globalThis = window;
  return window;
}

function load() {
  const win = stubContext(); const ctx = vm.createContext(win);
  const src = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
  const api = `
;(function () {
  const S = { powers: [] };
  function start(level, powers) {
    Save.data = Save.fresh(); Save.data.mute = true; LEVELS.forEach(d => { Save.data.abiertos[d.id] = true; });
    Save.data.seen = Object.assign(Save.data.seen || {}, { rucaTodas: true });   // the bot does not stop for Ruca
    for (const p of powers || []) Save.data.powers[p] = true;
    Maestros.reset(); Game.still = true; Game.capture = null; Game.frozen = false; Game.learning = null; Game.fadeTo = null; Game.fade = 0; Game.story = null;
    Game.startLevel(level); Game.banner = 0; Game.intro = null;
  }
  function frame(inp) {
    Input.held = {}; Input.pressed = {};
    for (const k in inp || {}) if (inp[k]) { Input.held[k] = true; if (inp[k] === 'press' || !S.prev[k]) Input.pressed[k] = true; }
    S.prev = Object.assign({}, inp || {});
    Game.update(); Input.pressed = {};
    // The learning card waits for a press: skip it at once so a search never stalls on it.
    for (let n = 0; Game.learning && n < 400; n++) { Input.held = {}; Input.pressed = Game.learning.t > 80 ? { confirm: true } : {}; Game.update(); }
    Input.pressed = {};
    window.__frame++;
    for (let i = window.__timers.length - 1; i >= 0; i--) if (window.__timers[i].at <= window.__frame) { const t = window.__timers.splice(i, 1)[0]; t.f(); }
  }
  S.prev = {};
  // Deep copy of the whole mutable world, keeping functions and canvases by reference.
  const SHARED = new Set(['rows', 'def', 'bg', 'spawn', 'sprite', 'frames', 'terrain', 'lightMask', 'titleParts']), COSMETIC = new Set(['parts', 'words', 'ghosts', 'jetDrops']);
  function cloneGraph(root) {
    const seen = new Map();
    const c = v => {
      if (v === null || typeof v !== 'object') return v;
      if (seen.has(v)) return seen.get(v);
      if (v.getContext) return v;
      if (v instanceof Map) { const m = new Map(); seen.set(v, m); for (const [k, x] of v) m.set(k, c(x)); return m; }
      if (v instanceof Set) { const s = new Set(); seen.set(v, s); for (const x of v) s.add(c(x)); return s; }
      if (ArrayBuffer.isView(v)) { const a = v.slice(); seen.set(v, a); return a; }
      if (Array.isArray(v)) {
        if (v.length && typeof v[0] !== 'object') { const a = v.slice(); seen.set(v, a); return a; }
        const a = new Array(v.length); seen.set(v, a); for (let i = 0; i < v.length; i++) a[i] = c(v[i]); return a;
      }
      const o = {}; seen.set(v, o);
      for (const k in v) { const x = v[k]; o[k] = SHARED.has(k) ? x : COSMETIC.has(k) ? [] : c(x); }
      return o;
    };
    return c(root);
  }
  const ROOTS = () => ({ L, Player, Cam, Game: Object.fromEntries(Object.entries(Game).filter(([k, v]) => typeof v !== 'function')), save: Save.data, fx: typeof FX !== 'undefined' ? FX.state : null });
  function snapshot() { return cloneGraph(ROOTS()); }
  function restore(s) {
    const copy = cloneGraph(s);
    for (const k of Object.keys(L)) delete L[k]; Object.assign(L, copy.L);
    for (const k of Object.keys(Player)) if (typeof Player[k] !== 'function') delete Player[k]; Object.assign(Player, copy.Player);
    Object.assign(Cam, copy.Cam); Object.assign(Game, copy.Game); Save.data = copy.save;
    if (copy.fx && typeof FX !== 'undefined') FX.state = copy.fx;
  }
  window.__glup = { start, frame, ev: src => eval(src), setPrev(p) { S.prev = p || {}; }, snapshot, restore, get L() { return L; }, get P() { return Player; }, get Game() { return Game; }, get LEVELS() { return LEVELS; }, tileAt, get Save() { return Save; }, get Input() { return Input; }, get NIVEL() { return NIVEL; }, get Maestros() { return Maestros; }, get Charla() { return Charla; } };
})();`;
  vm.runInContext(src + api, ctx, { filename: 'glup.js' });
  const g = win.__glup;
  g.run = (inp, n) => { for (let i = 0; i < n; i++) g.frame(inp); };
  return g;
}
module.exports = { load, FILES, ROOT };
