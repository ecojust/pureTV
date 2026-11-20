import test from 'node:test';
import assert from 'node:assert/strict';
import { supportsHalfFloatTargets, halfFloatSamples } from '../src/upstream/src/core/renderTargets.js';
import { Sky } from '../src/upstream/src/world/Sky.js';

test('WebGL 2 without renderable half-float textures skips sky prefiltering', () => {
  const renderer = { extensions: { has: () => false } };
  assert.equal(supportsHalfFloatTargets(renderer), false);
  assert.equal(Sky.prototype.buildEnvironment.call({}, renderer), null);
});

test('either color-buffer extension enables HDR with a supported sample count', () => {
  for (const extension of ['EXT_color_buffer_float', 'EXT_color_buffer_half_float']) {
    assert.ok(supportsHalfFloatTargets({ extensions: { has: name => name === extension } }));
  }
  for (const [counts, expected] of [[[8, 4, 2], 4], [[2], 2], [[], 0], [null, 0]]) {
    const gl = { RENDERBUFFER: 36161, RGBA16F: 34842, SAMPLES: 32937,
      getInternalformatParameter(...args) {
        assert.deepEqual(args, [this.RENDERBUFFER, this.RGBA16F, this.SAMPLES]);
        return counts === null ? null : Int32Array.from(counts);
      },
    };
    assert.equal(halfFloatSamples({ getContext: () => gl }), expected);
  }
});
