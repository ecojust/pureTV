import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armorColorIndex, armorColorHex, speedFrac, posParts, carChip, CHIP_FALLBACK, GAUGE_MAX_KPH, feedLine, standings, coracerFace } from '../../src/ui/hud.js';
import { zoneColor, gaugeAngle, gearLabel } from '../../src/ui/dash.js';
import { ordinal, fmtMoney, fmtTime, kph } from '../../src/ui/dom.js';

test('armor colour thresholds', () => {
  assert.equal(armorColorIndex(1), 11);
  assert.equal(armorColorIndex(0.5), 10);
  assert.equal(armorColorIndex(0.3), 9);
  assert.equal(armorColorIndex(0.1), 8);
  assert.equal(armorColorIndex(0), 8);
});

test('kill feed lines', () => {
  const names = ['YOU', 'Vex', 'Kane'];
  assert.equal(feedLine({ type: 'wreck', carId: 1, byId: 0 }, names), 'YOU ✕ Vex');
  assert.equal(feedLine({ type: 'wreck', carId: 2 }, names), 'Kane wrecked');
  assert.equal(feedLine({ type: 'wreck', carId: 2, byId: 2 }, names), 'Kane wrecked');
  assert.equal(feedLine({ type: 'hit' }, names), null);
});

test('standings sorted by position without mutating the snapshot', () => {
  const snap = { cars: [{ id: 0, position: 3 }, { id: 1, position: 1 }, { id: 2, position: 2 }] };
  assert.deepEqual(standings(snap).map((c) => c.id), [1, 2, 0]);
  assert.equal(snap.cars[0].id, 0);
});

test('co-racer status face: finished > wrecked > burning > low armour > ok', () => {
  assert.equal(coracerFace({ finished: true, wrecked: true, armor: 0, armorMax: 100 }), 'fin');
  assert.equal(coracerFace({ wrecked: true, burning: true, armor: 0, armorMax: 100 }), 'dead');
  assert.equal(coracerFace({ burning: true, armor: 10, armorMax: 100 }), 'burn');
  assert.equal(coracerFace({ armor: 34, armorMax: 100 }), 'hurt');
  assert.equal(coracerFace({ armor: 35, armorMax: 100 }), 'ok');
  assert.equal(coracerFace({ armor: 80, armorMax: 100 }), 'ok');
  assert.equal(coracerFace({ armor: 0, armorMax: 0 }), 'ok');
});

test('formatters', () => {
  assert.equal(ordinal(1), '1st'); assert.equal(ordinal(2), '2nd'); assert.equal(ordinal(3), '3rd'); assert.equal(ordinal(11), '11th');
  assert.equal(fmtMoney(5000), '$5,000'); assert.equal(fmtMoney(NaN), '$0');
  assert.equal(fmtTime(65.4321), '1:05.43'); assert.equal(fmtTime(null), '--:--.--');
  assert.equal(kph(10), 36);
});

test('armour colour (hex) runs lime -> amber -> red and clamps', () => {
  assert.equal(armorColorHex(1), '#5dff9d');
  assert.equal(armorColorHex(0), '#ff4466');
  assert.equal(armorColorHex(2), armorColorHex(1));
  assert.equal(armorColorHex(-1), armorColorHex(0));
  assert.notEqual(armorColorHex(0.5), armorColorHex(0.9));
  assert.match(armorColorHex(0.45), /^#[0-9a-f]{6}$/);
});

test('gauge fraction + position parts', () => {
  assert.equal(speedFrac(0), 0);
  assert.equal(speedFrac(GAUGE_MAX_KPH / 2), 0.5);
  assert.equal(speedFrac(9999), 1);
  assert.equal(speedFrac(NaN), 0);
  assert.deepEqual(posParts(1), { n: '1', sfx: 'st' });
  assert.deepEqual(posParts(2), { n: '2', sfx: 'nd' });
  assert.deepEqual(posParts(11), { n: '11', sfx: 'th' });
  assert.deepEqual(posParts(undefined), { n: '1', sfx: 'st' });
});

test('car chips resolve for every palette slot (wraps, never undefined)', () => {
  for (let i = -3; i < 20; i++) assert.match(carChip(i), /^#[0-9a-fA-F]{6}$/);
  assert.equal(carChip(16), carChip(0));
  assert.equal(CHIP_FALLBACK.length, 16);
});

test('dash helpers (hex zone colours, 270 degree dial, gear label)', () => {
  assert.equal(zoneColor(0), '#5dff9d');
  assert.equal(zoneColor(1), '#ff4466');
  assert.ok(gaugeAngle(0, 100) < gaugeAngle(100, 100));
  assert.ok(Math.abs(gaugeAngle(100, 100) - gaugeAngle(0, 100) - 1.5 * Math.PI) < 1e-9);
  assert.deepEqual([gearLabel(3, false, 20), gearLabel(1, true, 3), gearLabel(1, false, 0)], ['3', 'R', 'N']);
});
