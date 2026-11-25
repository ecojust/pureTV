import test from 'node:test';
import assert from 'node:assert/strict';
import { healthColor, plateLook, wreckAlpha, reticleSize, PLATE_RANGE, PLATE_NEAR } from '../../src/ui/overlays.js';
import { normalizeSettings, DEFAULT_SETTINGS } from '../../src/ui/settings.js';

test('healthColor runs green -> amber -> red and clamps', () => {
  const rgb = (s) => s.match(/\d+/g).map(Number);
  const g = rgb(healthColor(1)), a = rgb(healthColor(0.5)), r = rgb(healthColor(0));
  assert.ok(g[1] > g[0], 'green dominant at full'); assert.ok(a[0] > 200 && a[1] > 150, 'amber mid'); assert.ok(r[0] > 200 && r[1] < 80, 'red at empty');
  assert.equal(healthColor(5), healthColor(1)); assert.equal(healthColor(-1), healthColor(0));
});

test('plateLook: hidden too close / too far, fades with distance and shrinks', () => {
  assert.equal(plateLook(PLATE_RANGE + 1).show, false); assert.equal(plateLook(PLATE_NEAR - 1).show, false);
  const n = plateLook(20), m = plateLook(100);
  assert.equal(n.alpha, 1); assert.ok(m.alpha < 1 && m.alpha > 0); assert.ok(m.scale < n.scale);
});

test('wreck fade and lock reticle sizing', () => {
  assert.equal(wreckAlpha(0), 1); assert.ok(wreckAlpha(2) < 1 && wreckAlpha(2) > 0); assert.equal(wreckAlpha(10), 0);
  assert.ok(reticleSize(0) > reticleSize(0.5) && reticleSize(0.5) > reticleSize(1)); assert.equal(reticleSize(2), reticleSize(1));
});

test('nameplates setting defaults on and normalises', () => {
  assert.equal(DEFAULT_SETTINGS.nameplates, true);
  assert.equal(normalizeSettings({ nameplates: false }).nameplates, false);
  assert.equal(normalizeSettings({ nameplates: 'no' }).nameplates, true);
});
