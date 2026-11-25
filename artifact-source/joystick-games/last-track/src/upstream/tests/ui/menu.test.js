import test from 'node:test';
import assert from 'node:assert/strict';
import { nextFocus, trackOutlinePath, difficultyOf, difficultyLabel, ringGeometry, podiumOrder, countValue, easeOutCubic, rating } from '../../src/ui/menuLogic.js';
import { normalizeSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../src/ui/settings.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { saveSummary } from '../../src/ui/screens/title.js';
import { damageZones } from '../../src/ui/screens/garage.js';
import { stageCamera } from '../../src/render/menuScene.js';

test('nextFocus moves spatially and stays put at the edge', () => {
  const r = (x, y) => ({ x, y, w: 100, h: 40 });
  const col = [r(0, 0), r(0, 60), r(0, 120)];
  assert.equal(nextFocus(col, 0, 'down'), 1);
  assert.equal(nextFocus(col, 1, 'down'), 2);
  assert.equal(nextFocus(col, 2, 'down'), 2);
  assert.equal(nextFocus(col, 1, 'up'), 0);
  assert.equal(nextFocus(col, 1, 'left'), 1);
  const grid = [r(0, 0), r(200, 0), r(0, 60), r(200, 60)];
  assert.equal(nextFocus(grid, 0, 'right'), 1);
  assert.equal(nextFocus(grid, 1, 'down'), 3);
  assert.equal(nextFocus([], 0, 'down'), -1);
  assert.equal(nextFocus(col, -1, 'down'), 0);
});

test('every track has a closed outline path that fits its viewBox', () => {
  for (const t of TRACKS) {
    const o = trackOutlinePath(t.control, { w: 200, h: 110, pad: 12 });
    assert.ok(o.d.startsWith('M') && o.d.endsWith('Z'), t.id);
    const nums = o.d.match(/-?\d+(\.\d+)?/g).map(Number);
    assert.ok(nums.every((n) => Number.isFinite(n)));
    assert.ok(o.start[0] >= 0 && o.start[0] <= 200 && o.start[1] >= 0 && o.start[1] <= 110);
  }
  assert.equal(trackOutlinePath([], {}).d, '');
});

test('difficulty ramps 1..5 across ten tracks', () => {
  const d = TRACKS.map((_, i) => difficultyOf(i, TRACKS.length));
  assert.equal(d[0], 1); assert.equal(d[d.length - 1], 5);
  for (let i = 1; i < d.length; i++) assert.ok(d[i] >= d[i - 1]);
  assert.equal(difficultyLabel(5), 'LEGEND');
});

test('ring geometry, counters, ratings', () => {
  const g = ringGeometry(2, 4); assert.ok(Math.abs(g.offset - g.c / 2) < 1e-9);
  assert.equal(ringGeometry(9, 3).offset, 0); assert.equal(ringGeometry(0, 3).frac, 0);
  assert.equal(countValue(0, 1000, 0), 0); assert.equal(countValue(0, 1000, 1), 1000); assert.equal(countValue(0, 1000, 2), 1000);
  assert.ok(easeOutCubic(0.5) > 0.5);
  assert.equal(rating(1.4), 100); assert.equal(rating(0.855), 86);
});

test('podium order is 2nd, 1st, 3rd', () => {
  const fo = [{ position: 3, id: 'c' }, { position: 1, id: 'a' }, { position: 2, id: 'b' }, { position: 4, id: 'd' }];
  assert.deepEqual(podiumOrder(fo).map((r) => r.id), ['b', 'a', 'c']);
  assert.deepEqual(podiumOrder([{ position: 1, id: 'a' }]).map((r) => r.id), ['a']);
});

test('settings normalise, persist and reload', () => {
  assert.deepEqual(normalizeSettings(null), { ...DEFAULT_SETTINGS });
  const s = normalizeSettings({ quality: 'ultra', master: 3, music: -1, sfx: 'x', muted: 'yes', camera: 'tv', hints: false });
  assert.equal(s.quality, 'med'); assert.equal(s.master, 1); assert.equal(s.music, 0); assert.equal(s.sfx, DEFAULT_SETTINGS.sfx);
  assert.equal(s.muted, false); assert.equal(s.camera, 'tv'); assert.equal(s.hints, false);
  const st = createMemoryStorage();
  saveSettings(st, { ...s, master: 0.3 });
  assert.equal(loadSettings(st).master, 0.3);
  assert.deepEqual(loadSettings(createMemoryStorage()), { ...DEFAULT_SETTINGS });
  st.setItem('lasttrack.settings', '{bad'); assert.deepEqual(loadSettings(st), { ...DEFAULT_SETTINGS });
});

test('title save summary and garage damage zones', () => {
  assert.match(saveSummary({ cash: 12400, carId: 'hammer', passedTracks: ['neonloop'] }), /\$12,400 · Hammer · 1\/3 passed/);
  assert.equal(saveSummary(null), '');
  const z = damageZones(0.4); assert.equal(z.length, 4); assert.ok(z.every((v) => v >= 0 && v <= 1)); assert.deepEqual(damageZones(5).map((v) => v), [1, 0.85, 1, 0.85]);
});

test('menu stage camera: title orbits, showcase spins the car', () => {
  const a = stageCamera('title', 0), b = stageCamera('title', 10);
  assert.notEqual(a.x, b.x); assert.equal(a.turn, 0);
  assert.ok(stageCamera('showcase', 0).turn > 0);
  assert.ok(stageCamera('title', 3).fov < 50);
});

test('animateCount counts up to the target and honours cancel', async () => {
  const { animateCount } = await import('../../src/ui/dom.js');
  let now = 0; const q = [];
  globalThis.requestAnimationFrame = (fn) => { q.push(fn); return q.length; };
  globalThis.cancelAnimationFrame = () => {};
  const el = { textContent: '' };
  animateCount(el, 1000, { ms: 500, delay: 100, fmt: (n) => '$' + n });
  assert.equal(el.textContent, '$0');
  const pump = (t) => { now = t; const fns = q.splice(0); fns.forEach((f) => f(now)); };
  pump(0); pump(100); assert.equal(el.textContent, '$0');
  pump(350); const mid = +el.textContent.slice(1); assert.ok(mid > 400 && mid < 1000, String(mid));
  pump(700); assert.equal(el.textContent, '$1000');
  const el2 = { textContent: '' }; const stop = animateCount(el2, 50, { ms: 500 }); stop(); pump(10); pump(900); assert.equal(el2.textContent, '0');
  delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame;
});

test('version constant matches package.json and the manifest is valid', async () => {
  const { readFileSync } = await import('node:fs');
  const { VERSION } = await import('../../src/version.js');
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(VERSION, pkg.version);
  const man = JSON.parse(readFileSync(new URL('../../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(man.name, 'Last Track');
  for (const i of man.icons) assert.ok(readFileSync(new URL('../../' + i.src, import.meta.url)).length > 500, i.src);
});
