import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS } from '../../src/data/weapons.js';
import { CARS } from '../../src/data/cars.js';
import {
  WEAPON_ICONS, UI_ICONS, ICON_NAMES, iconData, damageColor, zoneColors, ZONE_NAMES, CAR_SILHOUETTES, carSilhouetteData, setDamageZones,
} from '../../src/ui/icons.js';

const HEX = /^#[0-9a-f]{6}$/;

test('every weapon has a non-empty icon (24x24, valid path data)', () => {
  for (const w of WEAPONS) {
    const ic = WEAPON_ICONS[w.id];
    assert.ok(ic, `icon for ${w.id}`);
    assert.equal(ic.viewBox, '0 0 24 24');
    assert.ok(ic.paths.length >= 2, `${w.id} has paths`);
    for (const p of ic.paths) assert.match(p.d, /^M[\d\s.,MLHVCSQTAZmlhvcsqtaz-]+$/, `${w.id} path data`);
  }
  assert.equal(Object.keys(WEAPON_ICONS).length, 9);
  const sig = new Set(Object.values(WEAPON_ICONS).map((i) => i.paths.map((p) => p.d).join('|')));
  assert.equal(sig.size, 9, 'weapon silhouettes are all distinct');
});

test('UI glyph names resolve', () => {
  for (const n of ['armor', 'bolt', 'wrench', 'cash', 'lap', 'skull', 'target', 'camera', 'volume', 'mute', 'gear', 'lock', 'trophy', 'play', 'back', 'garage', 'car']) {
    assert.ok(ICON_NAMES.includes(n), n);
    assert.ok(UI_ICONS[n].paths.length > 0, n);
    assert.equal(iconData(n), UI_ICONS[n]);
  }
  assert.equal(iconData('rocket'), WEAPON_ICONS.rocket, 'weapon ids resolve through iconData too');
  assert.equal(iconData('nope'), null);
});

test('no NaN / undefined leaks into generated path data', () => {
  for (const ic of [...Object.values(UI_ICONS), ...Object.values(WEAPON_ICONS)]) for (const p of ic.paths) assert.doesNotMatch(p.d, /NaN|undefined|Infinity/);
  for (const c of Object.values(CAR_SILHOUETTES)) for (const d of [c.outline, c.chassis, c.glass, ...c.wheels, ...Object.values(c.zones), ...c.extras]) assert.doesNotMatch(d, /NaN|undefined|Infinity/);
});

test('damageColor: pure lime -> amber -> red, clamped, monotone red channel', () => {
  assert.equal(damageColor(0), '#5dff9d');
  assert.equal(damageColor(1), '#ff4466');
  assert.equal(damageColor(0.55), '#ffb02e');
  assert.equal(damageColor(-5), damageColor(0));
  assert.equal(damageColor(7), damageColor(1));
  assert.equal(damageColor(NaN), damageColor(0));
  let prev = -1;
  for (let d = 0; d <= 1.0001; d += 0.05) {
    const c = damageColor(d);
    assert.match(c, HEX);
    const rr = parseInt(c.slice(1, 3), 16);
    assert.ok(rr >= prev, 'red channel never decreases');
    prev = rr;
  }
  assert.deepEqual(zoneColors([0, 1, 0.55, 0]), ['#5dff9d', '#ff4466', '#ffb02e', '#5dff9d']);
  assert.deepEqual(zoneColors(null), Array(4).fill('#5dff9d'));
});

test('car silhouettes: 3 cars, 4 zone paths each, fallback for unknown ids', () => {
  for (const car of CARS) {
    const s = CAR_SILHOUETTES[car.id];
    assert.ok(s, car.id);
    assert.deepEqual(Object.keys(s.zones), ZONE_NAMES);
    assert.equal(s.wheels.length, 4);
    for (const z of ZONE_NAMES) assert.ok(s.zones[z].length > 10);
  }
  assert.equal(carSilhouetteData('???'), CAR_SILHOUETTES.hammer);
});

test('setDamageZones colours zones in front,right,rear,left order and only touches changed ones', () => {
  const calls = [];
  const zones = ZONE_NAMES.map((n) => ({ style: { set fill(v) { calls.push([n, v]); } } }));
  const svg = {
    style: { setProperty() {} },
    querySelector: (sel) => zones[ZONE_NAMES.indexOf(/"(\w+)"/.exec(sel)[1])],
  };
  setDamageZones(svg, [0, 1, 0.55, 0]);
  assert.deepEqual(calls.map((c) => c[0]), ['front', 'right', 'rear', 'left']);
  assert.deepEqual(calls.map((c) => c[1]), ['#5dff9d', '#ff4466', '#ffb02e', '#5dff9d']);
  calls.length = 0;
  setDamageZones(svg, [0, 1, 0.55, 0]);
  assert.equal(calls.length, 0, 'unchanged -> no writes');
  setDamageZones(svg, [0, 1, 0.55, 1]);
  assert.deepEqual(calls.map((c) => c[0]), ['left']);
  setDamageZones(svg, undefined, { wrecked: true });
  assert.equal(new Set(calls.slice(1).map((c) => c[1])).size, 1, 'wrecked: all zones one dead colour');
  assert.doesNotThrow(() => setDamageZones(null, [0, 0, 0, 0]));
});
