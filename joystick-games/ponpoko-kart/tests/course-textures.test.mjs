import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { asphaltTextures, stoneTextures, preloadRoadTextures } from '../src/upstream/src/track/roadTextures.js';

test('the selected course reuses decoded albedo and linear normals with the original sampling', async t => {
  const urls = [];
  t.mock.method(THREE.TextureLoader.prototype, 'loadAsync', async url => {
    urls.push(url);
    return new THREE.Texture();
  });
  for (const [road, getTextures] of [['asphalt', asphaltTextures], ['stone', stoneTextures]]) {
    const style = { road, roadOpts: { seed: 8 } };
    await preloadRoadTextures(style, road + '-map.png', road + '-normal.png');
    const { map, normalMap } = getTextures(style.roadOpts);
    assert.equal(map.colorSpace, THREE.SRGBColorSpace);
    assert.equal(normalMap.colorSpace, THREE.NoColorSpace);
    for (const texture of [map, normalMap]) {
      assert.equal(texture.wrapS, THREE.RepeatWrapping);
      assert.equal(texture.wrapT, THREE.RepeatWrapping);
      assert.equal(texture.anisotropy, 8);
      assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
      assert.equal(texture.generateMipmaps, true);
    }
    await preloadRoadTextures(style, road + '-map.png', road + '-normal.png');
  }
  assert.deepEqual(urls, ['asphalt-map.png', 'asphalt-normal.png', 'stone-map.png', 'stone-normal.png']);
});
