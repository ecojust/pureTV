import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = await build({
  stdin: {
    contents: `export { Track } from './src/src/world/Track';
      export { RacingLine } from './src/src/game/AI';
      export { activeCircuit, resolveCircuit } from './src/src/world/Circuits';
      export { BOOST_PADS } from './src/src/world/TrackLayout';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, write: false, format: 'iife', globalName: 'circuitFixture',
});

for (const [id, metres] of [['sunset-bay', 1600], ['cape-crown', 1920], ['marina-esses', 1681]]) {
  test(id + ' builds a closed lap with a driveable AI line, grid and boost strips', () => {
    const page = { location: {search: '?track=' + id}, URLSearchParams };
    runInNewContext(fixture.outputFiles[0].text, page);
    const { Track, RacingLine, activeCircuit, resolveCircuit, BOOST_PADS } = page.circuitFixture;
    assert.equal(activeCircuit.id, id);
    assert.equal(resolveCircuit('?track=removed-track').id, 'sunset-bay');
    const track = new Track();
    assert.ok(track.length >= metres && track.length < metres + 40);
    const last = track.sampleByDistance(track.length - 0.5);
    const first = track.sample(0);
    assert.ok(first.pos.distanceTo(last.pos) < 0.51);
    assert.ok(first.tangent.dot(last.tangent) > 0.999);
    assert.equal(track.startGrid.length, 8);
    for (const slot of track.startGrid) assert.equal(track.probe(slot.pos, 0.99).surface, 0);
    for (let i = 0; i < track.checkpointCount; i++) {
      const t = (i + 0.5) / track.checkpointCount;
      assert.equal(track.checkpointAt(track.probe(track.sample(t).pos, t).t), i);
    }
    for (const pad of BOOST_PADS) {
      const t = (pad.t0 + pad.t1) / 2;
      const station = track.sample(t);
      assert.ok(Math.abs(pad.lat) + pad.hw < station.halfWidth);
      const pos = station.pos.addScaledVector(station.binormal, pad.lat);
      assert.equal(track.probe(pos, t).surface, 4);
    }
    const ai = new RacingLine();
    ai.build(track);
    for (let i = 0; i < ai.count; i++) {
      assert.ok(Math.abs(ai.off[i]) < ai.half[i]);
      assert.ok(Number.isFinite(ai.speed[i]) && ai.speed[i] > 0);
    }
  });
}
