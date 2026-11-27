import * as THREE from './three.js';
import {TARGET_SPECS} from './core.js';

const COLORS = {
  cyan: {core: 0x43e3ef, ring: 0x15aeba, emissive: 0x06383d},
  orange: {core: 0xff8a18, ring: 0xc84b0a, emissive: 0x3c1200},
  gold: {core: 0xffdf43, ring: 0xffa800, emissive: 0x4a3000},
};


function targetMesh(index, spec) {
  const {x, y, z, radius, points, color: colorIndex} = spec;
  const color = ['cyan', 'orange', 'gold'][colorIndex];
  const palette = COLORS[color];
  const group = new THREE.Group();
  group.name = `BallTarget-${String(index + 1).padStart(2, '0')}`;
  group.position.set(x, y, z);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshStandardMaterial({
      color: palette.core,
      roughness: 0.28,
      metalness: 0.32,
      emissive: palette.emissive,
      emissiveIntensity: 0.82,
    }),
  );
  core.name = `${group.name}-Sphere`;
  core.castShadow = true;
  core.receiveShadow = true;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.42, radius * 0.105, 10, 32),
    new THREE.MeshStandardMaterial({
      color: palette.ring,
      roughness: 0.38,
      metalness: 0.62,
      emissive: palette.emissive,
      emissiveIntensity: 0.55,
    }),
  );
  ring.name = `${group.name}-Ring`;
  group.add(ring);

  return {
    index,
    group,
    core,
    ring,
    base: new THREE.Vector3(x, y, z),
    radius,
    points,
    color,
    colorIndex,
    phase: index * 0.73,
  };
}

export class RangeTargetManager {
  constructor(scene) {
    this.scene = scene;
    this.targets = TARGET_SPECS.map((spec, index) => targetMesh(index, spec));
    this.targets.forEach(target => scene.add(target.group));
    this.time = 0;
    this.reset();
  }

  reset() {
    this.time = 0;
    for (const target of this.targets) {
      target.alive = true;
      target.pop = 0;
      target.group.visible = true;
      target.group.scale.setScalar(1);
      target.group.position.copy(target.base);
      target.core.material.emissiveIntensity = 0.82;
    }
  }

  get remaining() { return this.targets.filter(target => target.alive).length; }

  update(dt) {
    this.time += dt;
    for (const target of this.targets) {
      if (target.alive) {
        target.group.rotation.y += dt * 0.75;
        target.ring.rotation.z -= dt * 1.35;
        target.core.material.emissiveIntensity = 1.15 + Math.sin(this.time * 4 + target.phase) * 0.3;
      } else if (target.pop < 1) {
        target.pop = Math.min(1, target.pop + dt * 7.5);
        const scale = Math.max(0.001, 1 - target.pop);
        target.group.scale.setScalar(scale);
        target.group.rotation.z += dt * 8;
        if (target.pop >= 1) target.group.visible = false;
      }
    }
  }

  sync(snapshot) {
    this.time = snapshot.tick / 60;
    for (const stateTarget of snapshot.targets) {
      const target = this.targets[stateTarget.index];
      const wasAlive = target.alive;
      target.alive = stateTarget.active;
      target.group.position.set(stateTarget.x, stateTarget.y, stateTarget.z);
      if (stateTarget.active) {
        target.pop = 0;
        target.group.visible = true;
        target.group.scale.setScalar(1);
      } else if (wasAlive) {
        target.pop = 0;
        target.core.material.emissiveIntensity = 4;
        target.group.scale.setScalar(0.001);
      }
    }
  }

}
