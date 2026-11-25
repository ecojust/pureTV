import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createEffects } from '../../src/render/effects.js';

test('effects: mines (blinking), oil slicks, flames and oiled cars render headlessly and dispose', () => {
  const scene = new THREE.Scene();
  const fx = createEffects(scene);
  const car = { id: 0, x: 0, y: 0, heading: 0, vx: 0, vy: 0, speed: 0, oiled: true };
  const hazards = [{ id: 1, type: 'mine', x: 5, y: 0, heading: 0, armed: true }, { id: 2, type: 'oil', x: 9, y: 2, heading: 0 }, { id: 3, type: 'mine', x: 12, y: 2, heading: 0, armed: false }];
  const snap = (tick, list = hazards) => ({ tick, cars: [car], projectiles: [], pickups: [], hazards: list,
    events: [{ type: 'flame', carId: 0, range: 14, cone: 0.38 }, { type: 'explosion', x: 3, y: 3, radius: 5 }, { type: 'hit', carId: 0, weaponId: 'flamethrower', x: 1, y: 1 }] });
  const lamps = new Set();
  for (let i = 1; i < 60; i++) {
    fx.update(snap(i), 1 / 60);
    const mine = fx.group.children.find((c) => c.type === 'Group' && c.children.length === 2);
    if (mine) lamps.add(mine.children[1].material.uuid);
  }
  assert.ok(lamps.size >= 2, 'armed mine lamp blinks');
  assert.ok(fx.particles.active > 20, 'flame / explosion particles are alive');
  const groups = fx.group.children.filter((c) => c.type === 'Group');
  assert.equal(groups.length, 3, 'two mines and one oil slick');
  fx.update(snap(61, []), 1 / 60);
  assert.equal(fx.group.children.filter((c) => c.type === 'Group').length, 0, 'removed with the hazards');
  fx.dispose();
});
