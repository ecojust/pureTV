import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameConfig, fieldKeeping, gridIds } from '../../src/data/sliceConfig.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { createRaceSim } from '../../src/sim/raceSim.js';

const FIELD = ['vex', 'fuse', 'kane', 'cinder', 'rust'];   // the racers drawn when the track was chosen

test('the race runs the field the track was chosen with, in the order drawn', () => {
  const cfg = createGameConfig({ mode: 'race', trackId: 'neonloop', save: defaultSave(), seed: 3, field: FIELD });
  assert.deepEqual(cfg.rivals.map((r) => r.driverId), FIELD);
});

test('a running contract keeps its named racers on the grid it settles in', () => {
  const all = DRIVERS.map((d) => d.id);
  const drawn = all.slice(0, 5), named = all.slice(9, 11);   // the named two are not in the drawn field
  const kept = fieldKeeping(drawn, { targets: named });
  assert.equal(kept.length, drawn.length);
  assert.equal(new Set(kept).size, kept.length, 'no racer twice');
  for (const id of named) assert.ok(kept.includes(id), id);
  assert.deepEqual(fieldKeeping(drawn, null), drawn, 'no contract: the draw stays as it is');
  assert.deepEqual(fieldKeeping(drawn, { targets: [drawn[1]] }), drawn, 'a named racer already drawn keeps its place');
  const raced = createGameConfig({ mode: 'race', trackId: 'neonloop', save: defaultSave(), seed: 5, field: kept }).rivals.map((r) => r.driverId);
  assert.deepEqual(raced, kept, 'the race runs the kept field');
});

test('the grid a bid names is the grid the race runs: practice without rivals has none', () => {
  assert.deepEqual(gridIds({ mode: 'race', field: FIELD }), FIELD);
  assert.deepEqual(gridIds({ mode: 'practice', practiceRivals: true, field: FIELD }), FIELD);
  assert.deepEqual(gridIds({ mode: 'practice', field: FIELD }), []);
  assert.deepEqual(gridIds({ mode: 'race', field: null }), []);
  for (const setup of [{ mode: 'race', field: FIELD }, { mode: 'practice', practiceRivals: true, field: FIELD }, { mode: 'practice', field: FIELD }]) {
    const raced = createGameConfig({ ...setup, trackId: 'neonloop', save: defaultSave(), seed: 3 }).rivals.map((r) => r.driverId);
    assert.deepEqual(raced, gridIds(setup), setup.mode);
  }
});

test('a wreck the player is credited with names that racer in the result', () => {
  const cfg = createGameConfig({ mode: 'race', trackId: 'neonloop', save: { ...defaultSave(), carId: 'hammer' }, seed: 11, field: FIELD });
  const sim = createRaceSim(cfg);
  const credited = [];
  sim.events.on('wreck', (ev) => { if (ev.byId === 0) credited.push(sim.cars[ev.carId].driverId); });
  const idle = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
  const fire = { throttle: 1, brake: 0, steer: 0, fire: true, cycleWeapon: false, selectWeapon: null, handbrake: false };
  for (let i = 0; i < 120 * 10 && sim.phase !== 'racing'; i++) sim.step(idle);
  // a fragile rival right in front of the player: one burst of machine-gun fire wrecks it
  const player = sim.cars[0], rival = sim.cars[1];
  rival.armor = 1;
  rival.x = player.x + Math.cos(player.heading) * 14; rival.y = player.y + Math.sin(player.heading) * 14;
  for (let i = 0; i < 120 * 20 && !sim.isOver() && credited.length === 0; i++) sim.step(fire);
  assert.deepEqual(credited, [FIELD[0]], 'the sim credits the player with the rival it wrecked');
  assert.deepEqual(sim.result().player.wrecks, [FIELD[0]], 'and the result names that racer');
});

test('a running contract\'s racers race in practice without rivals too; without a contract that practice has nobody', () => {
  const named = DRIVERS.map((d) => d.id).slice(9, 10);   // a racer the drawn field does not have
  const save = { ...defaultSave(), contract: { patron: 'military', quota: 1, targets: named } };
  const kept = fieldKeeping(FIELD, save.contract);
  assert.ok(kept.includes(named[0]));
  assert.deepEqual(gridIds({ mode: 'practice', field: kept, contract: save.contract }), kept);
  const raced = createGameConfig({ mode: 'practice', practiceRivals: false, trackId: 'neonloop', save, seed: 3, field: kept }).rivals.map((r) => r.driverId);
  assert.deepEqual(raced, kept, 'the practice race runs the kept field');
  const drawn = createGameConfig({ mode: 'practice', trackId: 'neonloop', save, seed: 3 }).rivals.map((r) => r.driverId);
  assert.ok(drawn.includes(named[0]), 'with no field drawn, the running contract still gets its racer');
  assert.deepEqual(gridIds({ mode: 'practice', field: kept }), [], 'without a contract, practice without rivals still has nobody');
  assert.deepEqual(createGameConfig({ mode: 'practice', trackId: 'neonloop', save: defaultSave(), seed: 3, field: kept }).rivals, [], 'and the race has no rivals');
});
