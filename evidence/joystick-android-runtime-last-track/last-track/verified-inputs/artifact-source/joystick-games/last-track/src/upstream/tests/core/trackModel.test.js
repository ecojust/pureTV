import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, analyzeTrack } from '../../src/core/trackModel.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { wrapAngle } from '../../src/core/mathUtil.js';

for (const def of TRACKS) {
  test(`${def.id}: geometry`, () => {
    const t = buildTrack(def);
    const a = analyzeTrack(t);
    assert.ok(def.control.length >= 16);
    assert.ok(a.length >= 1600 && a.length <= 4000, `length ${a.length}`);
    assert.equal(a.crossings, 0);
    assert.ok(a.minRadius >= 1.5 * def.width / 2, `minRadius ${a.minRadius}`);
    assert.ok(a.minSeparation > def.width + 20, `separation ${a.minSeparation}`);
    assert.ok(a.closeGap < 2 * t.ds + 1e-6);
    assert.equal(t.samples.length, t.n);
    assert.ok(Math.abs(t.n * t.ds - t.length) < 1e-6);
  });

  test(`${def.id}: project round-trips and signs`, () => {
    const t = buildTrack(def);
    for (let k = 0; k < 40; k++) {
      const s = (k / 40) * t.length + 0.37;
      const p = t.pointAt(s);
      for (const d of [-5, 0, 6, 12]) {
        const x = p.x - Math.sin(p.heading) * d, y = p.y + Math.cos(p.heading) * d;
        const r = t.project(x, y, Math.floor(s / t.ds));
        assert.ok(Math.abs(r.d - d) < 0.05, `d ${r.d} vs ${d}`);
        assert.ok(Math.abs(wrapAngle(r.s - s + t.length / 2) - t.length / 2) < 0.2 || Math.abs(r.s - s) < 0.2, `s ${r.s} vs ${s}`);
        assert.equal(r.onRoad, Math.abs(d) <= def.width / 2);
        assert.ok(Math.abs(t.project(x, y).s - r.s) < 0.2); // no-hint agrees
      }
    }
  });

  test(`${def.id}: edges, grid, pickups`, () => {
    const t = buildTrack(def);
    const l = t.leftEdge(10), r = t.rightEdge(10), c = t.samples[10];
    assert.ok(Math.abs(Math.hypot(l.x - r.x, l.y - r.y) - def.width) < 1e-6);
    // right edge has d > 0
    assert.ok(t.project(r.x, r.y).d > 0 && t.project(l.x, l.y).d < 0);
    assert.ok(Math.abs(t.leftEdge(t.n + 10).x - l.x) < 1e-9);
    const grid = t.startGrid(5);
    assert.equal(grid.length, 5);
    const seen = new Set();
    grid.forEach((g, i) => {
      const pr = t.project(g.x, g.y);
      assert.ok(pr.onRoad);
      assert.ok(Math.abs(wrapAngle(g.heading - pr.heading)) < 0.05);
      // behind the line: s just below length
      assert.ok(t.length - pr.s > 1 && t.length - pr.s < 40, `grid s ${pr.s}`);
      seen.add(`${g.x.toFixed(2)},${g.y.toFixed(2)}`);
    });
    assert.equal(seen.size, 5);
    assert.ok(t.length - t.project(grid[0].x, grid[0].y).s < t.length - t.project(grid[2].x, grid[2].y).s);
    assert.equal(t.pickups.length, def.pickups.length);
    for (const p of t.pickups) assert.ok(t.project(p.x, p.y).onRoad);
    assert.ok(c.width === def.width);
  });
}
