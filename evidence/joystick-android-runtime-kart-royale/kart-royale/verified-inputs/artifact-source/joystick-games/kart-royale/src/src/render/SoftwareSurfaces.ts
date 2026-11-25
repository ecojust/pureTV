import * as THREE from 'three';
import type { Ctx } from '../types';
import { copyVertexPatches } from '../world/Props';

// The original PBR material library generates dozens of fragment programs on the
// first visible grid. CPU-backed WebGL uses the original geometry, UVs, paint,
// textures and sunlight with one vertex-lit surface shader instead.
const vertexShader = /* glsl */ `
  uniform vec3 sunDirection;
  uniform vec3 sunPower;
  uniform mat3 mapTransform;
  uniform bool usePaint;
  uniform bool maskTint;
  attribute vec3 aTint;
  attribute vec4 aUv;
  varying vec2 surfaceUv;
  varying vec3 surfaceLight;
  varying vec3 paint;
  varying float depth;

  void main() {
    #include <begin_vertex>
    vec4 point = vec4(transformed, 1.0);
    vec3 localNormal = normal;
    #ifdef USE_INSTANCING
      mat3 basis = mat3(instanceMatrix);
      localNormal /= max(vec3(dot(basis[0], basis[0]), dot(basis[1], basis[1]),
                              dot(basis[2], basis[2])), vec3(1e-8));
      localNormal = basis * localNormal;
      point = instanceMatrix * point;
    #endif
    vec3 viewNormal = normalize(normalMatrix * localNormal);
    float sky = dot(viewNormal, viewMatrix[1].xyz) * 0.5 + 0.5;
    float sunlight = max(dot(viewNormal, mat3(viewMatrix) * sunDirection), 0.0);
    surfaceLight = mix(vec3(0.35, 0.41, 0.50), vec3(0.65, 0.69, 0.78), sky)
                 + sunPower * sunlight;
    vec3 tint = maskTint ? mix(vec3(1.0), aTint, clamp(uv.x, 0.0, 1.0)) : aTint;
    paint = (usePaint ? color.rgb : vec3(1.0)) * tint;
    #ifdef USE_INSTANCING_COLOR
      paint *= instanceColor;
    #endif
    surfaceUv = (mapTransform * vec3(uv, 1.0)).xy * aUv.xy + aUv.zw;
    vec4 viewPoint = modelViewMatrix * point;
    depth = -viewPoint.z;
    gl_Position = projectionMatrix * viewPoint;
  }`;

const fragmentShader = /* glsl */ `
  #define PURETV_SOFTWARE_SURFACE
  uniform vec3 baseColor;
  uniform vec3 emission;
  uniform float emissionStrength;
  uniform sampler2D albedo;
  uniform bool mapped;
  uniform vec3 hazeColor;
  uniform float hazeDensity;
  varying vec2 surfaceUv;
  varying vec3 surfaceLight;
  varying vec3 paint;
  varying float depth;

  void main() {
    vec3 texel = mapped ? texture2D(albedo, surfaceUv).rgb : vec3(1.0);
    vec3 lit = texel * baseColor * paint * surfaceLight + emission * emissionStrength;
    float haze = clamp(1.0 - exp(-max(depth, 0.0) * hazeDensity), 0.0, 0.78);
    gl_FragColor = vec4(mix(lit, hazeColor, haze), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function eligible(material: THREE.Material): material is THREE.MeshStandardMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial &&
    !material.transparent && material.alphaTest === 0 &&
    !/boost|water|glow|decal|item|particle|hazard/i.test(material.name);
}

export function installSoftwareSurfaces(
  renderer: THREE.WebGLRenderer, ctx: Ctx, enabled: () => boolean,
): () => void {
  const surfaces = new Map<THREE.MeshStandardMaterial, THREE.ShaderMaterial>();
  const draw = renderer.renderBufferDirect;

  function release(event: { target: THREE.MeshStandardMaterial }) {
    const source = event.target;
    source.removeEventListener('dispose', release);
    surfaces.get(source)?.dispose();
    surfaces.delete(source);
  }

  renderer.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
    // Keep shadow, environment bake, diagnostic and fallback passes independent.
    if (scene === ctx.scene && ctx.sun && enabled() && eligible(material)) {
      let surface = surfaces.get(material);
      if (!surface) {
        const fog = scene.fog;
        surface = new THREE.ShaderMaterial({
          name: 'software-surface', vertexShader, fragmentShader, vertexColors: true,
          side: material.side, depthWrite: material.depthWrite, depthTest: material.depthTest,
          depthFunc: material.depthFunc, colorWrite: material.colorWrite,
          polygonOffset: material.polygonOffset, polygonOffsetFactor: material.polygonOffsetFactor,
          polygonOffsetUnits: material.polygonOffsetUnits, toneMapped: material.toneMapped,
          uniforms: {
            baseColor: { value: material.color }, emission: { value: material.emissive },
            emissionStrength: { value: material.emissiveIntensity },
            albedo: { value: material.map }, mapped: { value: !!material.map },
            mapTransform: { value: material.map?.matrix ?? new THREE.Matrix3() },
            maskTint: { value: material.customProgramCacheKey().split('|').includes('tintM') },
            usePaint: { value: material.vertexColors }, sunDirection: { value: ctx.sunDirection },
            sunPower: { value: ctx.sun.color.clone().multiplyScalar(ctx.sun.intensity / Math.PI) },
            hazeColor: { value: fog?.color ?? new THREE.Color() },
            hazeDensity: { value: fog && material.fog ? 0.0013 : 0 },
          },
        });
        copyVertexPatches(material, surface);
        if (material.map?.matrixAutoUpdate) material.map.updateMatrix();
        Object.assign(surface.defaultAttributeValues, { aTint: [1, 1, 1], aUv: [1, 1, 0, 0] });
        material.addEventListener('dispose', release);
        surfaces.set(material, surface);
      }
      surface.uniforms.emissionStrength.value = material.emissiveIntensity;
      material = surface;
    }
    draw.call(this, camera, scene, geometry, material, object, group);
  };

  return () => {
    renderer.renderBufferDirect = draw;
    for (const source of surfaces.keys()) release({ target: source });
  };
}
