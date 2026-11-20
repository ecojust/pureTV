import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import * as THREE from 'three';

const root = fileURLToPath(new URL('..', import.meta.url));
const result = await build({
  absWorkingDir: root, stdin: { resolveDir: root, loader: 'ts', contents: `
    export { installSoftwareSurfaces } from './src/src/render/SoftwareSurfaces';
    export { patchLod, patchCrowd, makeShared } from './src/src/world/Props';
  ` },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { installSoftwareSurfaces, patchLod, patchCrowd, makeShared } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));

test('the software surface keeps original paint, texture, geometry and later quality switches', () => {
  const scene = new THREE.Scene();
  const ctx = { scene, sun: new THREE.DirectionalLight(), sunDirection: new THREE.Vector3(0, 1, 0) };
  const renderer = { renderBufferDirect(...args) { this.last = args; } };
  const draw = renderer.renderBufferDirect;
  let enabled = true;
  const stop = installSoftwareSurfaces(renderer, ctx, () => enabled);
  const map = new THREE.Texture();
  map.repeat.set(4, 3);
  const road = new THREE.MeshStandardMaterial({ map, vertexColors: true });
  const worldUniforms = makeShared();
  patchLod(road, worldUniforms);
  patchCrowd(road, worldUniforms);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), road);
  function render(material, world = scene) {
    renderer.renderBufferDirect(null, world, mesh.geometry, material, mesh, null);
    assert.equal(renderer.last[2], mesh.geometry);
    return renderer.last[3];
  }
  const low = render(road);
  assert.ok(low.isShaderMaterial);
  const shader = { vertexShader: low.vertexShader, fragmentShader: low.fragmentShader, uniforms: {} };
  low.onBeforeCompile(shader, renderer);
  assert.ok(shader.vertexShader.includes('smoothstep(aLod * 0.86, aLod, dCam)'));
  assert.equal(shader.uniforms.uCam, worldUniforms.uCam);
  assert.equal(shader.uniforms.uCheer, worldUniforms.uCheer);
  assert.equal(low.uniforms.albedo.value, map);
  assert.equal(low.uniforms.mapTransform.value.elements[0], 4);
  assert.equal(low.uniforms.baseColor.value, road.color);
  assert.equal(mesh.material, road);
  road.emissiveIntensity = 3;
  assert.equal(render(road), low);
  assert.equal(low.uniforms.emissionStrength.value, 3);
  for (const options of [{ transparent: true }, { alphaTest: 0.5 }, { name: 'boostpad' }]) {
    const effect = new THREE.MeshStandardMaterial(options);
    assert.equal(render(effect), effect);
  }
  assert.equal(render(road, new THREE.Scene()), road);
  enabled = false;
  assert.equal(render(road), road);
  enabled = true;
  let disposed = 0;
  low.addEventListener('dispose', () => disposed++);
  road.dispose();
  assert.equal(disposed, 1);
  assert.notEqual(render(road), low);
  stop();
  assert.equal(renderer.renderBufferDirect, draw);
});
