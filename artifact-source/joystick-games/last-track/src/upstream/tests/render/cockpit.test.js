import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CameraRig, COCKPITS, cockpitFor } from '../../src/render/cameras.js';

const still = { x: 0, y: 0, heading: 0, speed: 0, steer: 0, ay: 0, wrecked: false };
/** The cockpit camera's eye for a model, one frame into a racing cockpit view. */
const eyeOf = (carId) => {
  const cam = new THREE.PerspectiveCamera(60, 1.5, 0.5, 2000), rig = new CameraRig(cam);
  rig.setMode('cockpit'); rig.setCarId(carId);
  rig.update(1 / 60, still, 'racing');
  return { y: cam.position.y, fov: cam.fov };
};

test('each car has its own cockpit: the Wasp is lowest, the Bulwark highest, and no two share an eye height', () => {
  const wasp = eyeOf('wasp').y, hammer = eyeOf('hammer').y, bulwark = eyeOf('bulwark').y;
  assert.ok(wasp < hammer && hammer < bulwark, `eyes ${wasp} ${hammer} ${bulwark}`);
  assert.equal(new Set(Object.values(COCKPITS).map((c) => c.y)).size, 5);
});

test('the eye sits a head below each roof over the seat: roofs 1.11 / 1.46 / 1.89 m (scaled body), less about 0.2 m', () => {
  assert.ok(Math.abs(eyeOf('wasp').y - 0.91) < 1e-9);
  assert.ok(Math.abs(eyeOf('hammer').y - 1.26) < 1e-9);
  assert.ok(Math.abs(eyeOf('bulwark').y - 1.69) < 1e-9);
  assert.ok(Math.abs(eyeOf('gullwing').y - 0.98) < 1e-9);
  assert.ok(Math.abs(eyeOf('rhino').y - 1.5) < 1e-9);
  // the seat stations sit between the bumpers and behind the dash: the Hammer family at x -0.55, the new cabins a little forward or back
  assert.ok(Object.values(COCKPITS).every((c) => c.x >= -0.6 && c.x <= -0.25), 'the eye is on the seat, behind the dash');
});

test('the camera follows the model it is given: switching to a rival changes the cockpit, an unknown model falls back to the hammer', () => {
  const cam = new THREE.PerspectiveCamera(60, 1.5, 0.5, 2000), rig = new CameraRig(cam);
  rig.setMode('cockpit'); rig.setCarId('wasp'); rig.update(1 / 60, still, 'racing');
  const first = cam.position.y;
  rig.setCarId('bulwark'); rig.update(1 / 60, still, 'racing');
  assert.notEqual(cam.position.y, first, 'the rival cockpit is its own');
  assert.deepEqual(cockpitFor('tank'), COCKPITS.hammer);
});
