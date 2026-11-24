import * as THREE from 'three';

// Small deterministic albedo tiles for software WebGL. The normal GPU path
// bakes the upstream surface shaders. Both use the game's authored material tint.
export function fallbackTile(key, bake) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  let seed = bake.seed || 1;
  const base = new THREE.Color(bake.tintA ?? 0xcecece);
  const secondary = new THREE.Color(bake.tintB ?? 0xffffff);
  const tint = new THREE.Color();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 0x100000000;
      let shade = .7 + .23 * noise;
      if (key === 'brick' && (y % 16 < 2 || (x + 16 * Math.floor(y / 16)) % 32 < 2)) shade *= .48;
      if (key === 'wood') shade += .11 * Math.sin(y * Math.PI / 4 + .55 * Math.cos(x * Math.PI / 32));
      if (key === 'fabric' || key === 'burlap') shade += ((x + y) % 2) * .08;
      if (key === 'corrugated') shade += .11 * Math.sin(x * Math.PI / 8);
      tint.copy(base).lerp(secondary, .22 * noise).multiplyScalar(shade).convertLinearToSRGB();
      const i = (y * size + x) * 4;
      data[i] = tint.r * 255;
      data[i + 1] = tint.g * 255;
      data[i + 2] = tint.b * 255;
      data[i + 3] = 255;
    }
  }
  const albedo = new THREE.DataTexture(data, size, size);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.generateMipmaps = true;
  albedo.minFilter = THREE.LinearMipmapLinearFilter;
  albedo.magFilter = THREE.LinearFilter;
  albedo.needsUpdate = true;
  return { name: key, albedo, normal: null, orm: null, size, worldSize: bake.worldSize };
}
