// Reuse the game’s authored terrain mask and biome colors with one flat-color
// texture per surface. Hardware GPUs keep the original detailed terrain shader.
import * as THREE from 'three';

export function createSoftwareTerrain(layers, mask) {
  const material = new THREE.MeshLambertMaterial({color: 0xffffff});
  material.onBeforeCompile = shader => {
    shader.uniforms.baseGround = {value: layers.G.albedo};
    shader.uniforms.roadGround = {value: layers.D.albedo};
    shader.uniforms.rockGround = {value: layers.R.albedo};
    shader.uniforms.wetGround = {value: layers.M.albedo};
    shader.uniforms.landMask = {value: mask};
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec2 fieldPosition; varying float fieldSlope;')
      .replace('#include <begin_vertex>',
        '#include <begin_vertex>\nfieldPosition = (modelMatrix * vec4(position, 1.0)).xz; fieldSlope = 1.0 - max(normal.y, 0.0);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      varying vec2 fieldPosition; varying float fieldSlope;
      uniform sampler2D baseGround, roadGround, rockGround, wetGround, landMask;
    `).replace('#include <map_fragment>', `
      vec4 maskSample = texture2D(landMask, (fieldPosition + 512.0) / 1024.0);
      vec2 tile = fieldPosition * 0.16;
      vec3 ground = texture2D(baseGround, tile).rgb;
      ground = mix(ground, texture2D(roadGround, tile).rgb, max(smoothstep(0.06, 0.7, maskSample.r), maskSample.a * 0.7));
      ground = mix(ground, texture2D(rockGround, tile).rgb, smoothstep(0.08, 0.36, fieldSlope));
      ground = mix(ground, texture2D(wetGround, tile).rgb, maskSample.b * (1.0 - smoothstep(0.03, 0.08, fieldSlope)));
      diffuseColor.rgb *= ground;
    `);
  };
  material.customProgramCacheKey = () => 'offline-software-terrain';
  return material;
}
