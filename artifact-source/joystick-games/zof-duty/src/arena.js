import * as THREE from './three.js';

function standard(color, roughness = 0.72, metalness = 0.08, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness, emissive});
}

export function buildArena(scene) {
  scene.background = new THREE.Color(0x05080b);
  scene.fog = new THREE.FogExp2(0x071018, 0.017);

  const owned = [];
  const add = object => {
    scene.add(object);
    owned.push(object);
    return object;
  };
  const box = (name, size, position, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    mesh.castShadow = position[1] > 0.2;
    add(mesh);
    return mesh;
  };

  const concrete = standard(0x182127, 0.92, 0.02);
  const dark = standard(0x0b1014, 0.86, 0.1);
  const steel = standard(0x34414a, 0.45, 0.72);
  const orange = standard(0xff8a16, 0.54, 0.18, 0x2a0d00);
  const cyan = standard(0x23d1e2, 0.48, 0.22, 0x00262b);

  box('RangeFloor', [18, 0.4, 42], [0, -0.2, -13], concrete);
  box('Backstop', [18, 8, 0.7], [0, 4, -34], dark);
  box('LeftWall', [0.45, 5, 42], [-9, 2.5, -13], dark);
  box('RightWall', [0.45, 5, 42], [9, 2.5, -13], dark);
  box('ObservationDeck', [8, 0.12, 4], [0, 0.06, 5], steel);

  for (let z = 2; z >= -32; z -= 4) {
    box(`LaneMarkL${z}`, [0.055, 0.018, 2.4], [-2.8, 0.02, z], orange);
    box(`LaneMarkR${z}`, [0.055, 0.018, 2.4], [2.8, 0.02, z], orange);
  }
  for (const z of [-9, -18, -27]) {
    box(`TargetRail${z}`, [15.5, 0.1, 0.12], [0, 3.3, z], steel);
    for (const x of [-7.2, 7.2]) box(`RailPost${x}:${z}`, [0.12, 6.4, 0.12], [x, 3.2, z], steel);
  }

  const grid = new THREE.GridHelper(42, 42, 0x1fbccb, 0x18343a);
  grid.position.set(0, 0.012, -13);
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  add(grid);

  const hemi = new THREE.HemisphereLight(0x86dfff, 0x12100c, 1.6);
  add(hemi);
  const key = new THREE.DirectionalLight(0xffd4a1, 3.2);
  key.position.set(-5, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 14;
  key.shadow.camera.bottom = -14;
  add(key);
  const rim = new THREE.PointLight(0x20dbe8, 32, 34, 1.7);
  rim.position.set(0, 5.5, -18);
  add(rim);

  return {
    owned,
    playerSpawn: new THREE.Vector3(0, 0, 5.2),
    update(time) {
      rim.intensity = 30 + Math.sin(time * 1.7) * 3;
    },
    dispose() {
      for (const object of owned) {
        scene.remove(object);
        object.traverse?.(child => {
          child.geometry?.dispose?.();
          if (Array.isArray(child.material)) child.material.forEach(material => material.dispose?.());
          else child.material?.dispose?.();
        });
      }
    },
  };
}
