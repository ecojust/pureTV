import * as THREE from 'three';

// The full HDR renderer uses many light/material combinations. A software
// WebGL device can draw the same world and animated actors with vertex lighting.
export class SoftwareView {
  constructor(ctx) {
    this.materials = new WeakMap();
    this.arrays = new WeakMap();
    const fill = new THREE.HemisphereLight(0xc8daec, 0xa48672, 1.6);
    const key = new THREE.DirectionalLight(0xffd7a2, 2.1);
    key.position.set(-10, 13, 6);
    ctx.scene.add(fill, key);
    ctx.viewScene.add(fill.clone(), key.clone());
    this.walk = (object) => {
      if (object.isPointLight) object.layers.disable(0);
      if (!object.isMesh) return;
      const material = object.material;
      if (Array.isArray(material)) {
        if (!this.arrays.has(material)) {
          const mapped = material.map(m => this.surface(m));
          this.arrays.set(material, mapped);
          this.arrays.set(mapped, mapped);
        }
        object.material = this.arrays.get(material);
      } else {
        object.material = this.surface(material);
      }
    };
  }

  surface(source) {
    if (!source?.isMeshStandardMaterial && !source?.isMeshPhongMaterial) return source;
    if (this.materials.has(source)) return this.materials.get(source);
    const material = new THREE.MeshLambertMaterial({
      color: source.color, emissive: source.emissive, emissiveIntensity: source.emissiveIntensity,
      map: source.map, transparent: source.transparent, opacity: source.opacity,
      alphaMap: source.alphaMap, alphaTest: source.alphaTest, side: source.side,
      depthWrite: source.depthWrite, vertexColors: source.vertexColors,
    });
    this.materials.set(source, material);
    return material;
  }

  draw(renderer, ctx) {
    ctx.scene.traverseVisible(this.walk);
    ctx.viewScene.traverseVisible(this.walk);
    renderer.setRenderTarget(null);
    renderer.clear(true, true, false);
    renderer.render(ctx.scene, ctx.camera);
    renderer.clearDepth();
    renderer.render(ctx.viewScene, ctx.viewCamera);
  }
}
