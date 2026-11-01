'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../src/main/assets/game-model.js');
const World = Game.World;
function input(id = 1, extra = {}) { return { id, connected: true, x: 0, y: 0, aimX: 0, aimY: 0, a: false, b: false, start: false, select: false, cancelSeq: 0, ...extra }; }
function advance(game, seconds, values = [input()]) { for (let t = 0; t < seconds - 1e-8; t += 1 / 60) game.update(1 / 60, values); }
function begin(count = 1, id = 1) {
  const game = new Game({ seed: 93416 });
  const values = count === 2 ? [input(1), input(2)] : [input(id)];
  game.selectedPlayers = count;
  game.update(1 / 60, values.map(p => ({ ...p, start: p.id === id })));
  game.update(1 / 60, values);
  assert.equal(game.phase, 'playing');
  return game;
}
function clearEnemies(game) { for (const e of game.enemies) game.damageEnemy(e, 100000, game.participantIds[0]); game.enemies = game.enemies.filter(e => e.hp > 0); }
function battlefield(game) { game.enemies = []; game.pickups = []; game.players.filter(p => p.active).forEach(p => p.invulnerable = 999); }

test('three authored maps have traversable mission consoles and connected gate routes', () => {
  assert.equal(World.stages.length, 3);
  assert.equal(new Set(World.stages.map(s => s.theme)).size, 3);
  const game = begin();
  for (let stage = 0; stage < 3; stage++) {
    game.loadStage(stage);
    assert.ok(game.map.solids.length > 10);
    assert.ok(game.map.props.length >= 8);
    assert.equal(game.map.objectives.length, 3);
    for (let i = 0; i < 3; i++) {
      const objective = game.map.objectives[i];
      assert.equal(game.blocked(objective.x, objective.y), false);
      if (i) game.map.doors[i - 1].open = true;
      game.rebuildNavigation();
      const flow = game.flowFor(objective), from = i ? game.map.objectives[i - 1] : game.map.spawn;
      assert.ok(flow[Math.floor(from.y) * 48 + Math.floor(from.x)] >= 0, `stage ${stage}, objective ${i} reachable`);
    }
    assert.equal(game.blocked(game.map.exit.x, game.map.exit.y), false);
  }
});

test('solo can use the only online slot 2, and a later spectator cannot pause or change equipment', () => {
  const game = begin(1, 2);
  assert.deepEqual(game.participantIds, [2]);
  assert.equal(game.players[0].active, false);
  assert.equal(game.players[1].active, true);
  battlefield(game);
  advance(game, .1, [input(1), input(2)]);
  game.update(1 / 60, [input(1, { start: true, select: true, b: true }), input(2)]);
  assert.equal(game.phase, 'playing');
  assert.equal(game.players[1].weapon, 'pistol');
  assert.equal(game.grenades.length, 0);
  game.loadStage(1);
  assert.equal(game.players[1].active, true);
  assert.equal(game.players[0].active, false);
  game.pause('manual'); game.update(.02, [input(1), input(2)]);
  game.update(.02, [input(1, { start: true }), input(2)]); assert.equal(game.phase, 'paused');
  game.phase = 'shop'; game.credits = 500; game.update(.02, [input(1), input(2)]);
  game.update(.02, [input(1, { start: true, a: true }), input(2)]); assert.equal(game.phase, 'shop'); assert.equal(game.credits, 500);
});

test('the first remote START works after an empty title screen, but true reconnect cannot replay held actions', () => {
  const game = new Game(); advance(game, .5, []);
  game.update(.02, [input(1, { start: true })]); assert.equal(game.phase, 'playing');
  game.update(.02, []); assert.equal(game.phase, 'paused');
  game.update(.02, [input(1, { start: true })]); assert.equal(game.phase, 'paused');
  game.update(.02, [input(1)]); game.update(.02, [input(1, { start: true })]); assert.equal(game.phase, 'playing');
});

test('two-player start requires both controllers, and disconnect pauses until an explicit connected resume', () => {
  const title = new Game(); title.selectedPlayers = 2;
  title.update(.02, [input(1, { start: true })]); assert.equal(title.phase, 'title');
  const game = begin(2); battlefield(game);
  const elapsed = game.elapsed;
  game.update(.05, [input(1)]); assert.equal(game.phase, 'paused'); assert.equal(game.pausedReason, 'disconnected');
  advance(game, .5, [input(1), input(2)]); assert.equal(game.elapsed, elapsed); assert.equal(game.phase, 'paused');
  game.update(.02, [input(1, { start: true }), input(2)]); assert.equal(game.phase, 'playing');
  game.update(.02, [input(1), input(2)]); assert.ok(game.elapsed > elapsed);
});

test('movement follows screen directions, normalizes diagonals and cannot cross solid walls', () => {
  const straight = begin(), diagonal = begin(); battlefield(straight); battlefield(diagonal);
  straight.players[0].x = diagonal.players[0].x = 8; straight.players[0].y = diagonal.players[0].y = 12;
  advance(straight, .5, [input(1, { x: 1 })]); advance(diagonal, .5, [input(1, { x: 1, y: -1 })]);
  assert.ok(straight.players[0].x > 10); assert.equal(straight.players[0].y, 12);
  const d = Math.hypot(diagonal.players[0].x - 8, diagonal.players[0].y - 12);
  assert.ok(Math.abs(d - (straight.players[0].x - 8)) < .02); assert.ok(diagonal.players[0].y < 12);
  straight.players[0].x = 15; straight.players[0].y = 7;
  advance(straight, 1, [input(1, { x: 1 })]); assert.ok(straight.players[0].x < 16 - straight.players[0].radius + .01);
  straight.players[0].x = 15; straight.players[0].y = 14.5;
  advance(straight, 1, [input(1, { x: 1 })]); assert.ok(straight.players[0].x < 16);
  straight.map.doors[0].open = true; straight.rebuildNavigation();
  advance(straight, 1, [input(1, { x: 1 })]); assert.ok(straight.players[0].x > 18);
});

test('held fire aims at a visible alien and actually kills it; solid walls stop bullets', () => {
  const game = begin(); battlefield(game); const p = game.players[0]; p.x = 7; p.y = 10;
  game.enemies.push({ id: 999, type: 'crawler', x: 11, y: 10, radius: .46, angle: 0, hp: 38, maxHp: 38, speed: 0, damage: 0, attackCooldown: 999, hitFlash: 0 });
  advance(game, 1, [input(1, { a: true })]); assert.equal(game.kills, 1); assert.equal(game.enemies.length, 0); assert.ok(game.credits >= 7);
  assert.ok(game.events.some(e => e.kind === 'shot')); assert.ok(game.events.some(e => e.kind === 'enemy-death'));
  game.enemies.push({ id: 1000, type: 'crawler', x: 18, y: 7, radius: .46, angle: 0, hp: 100, maxHp: 100, speed: 0, damage: 0, attackCooldown: 999, hitFlash: 0 });
  p.x = 14; p.y = 7;
  advance(game, 1, [input(1, { a: true, aimX: 1 })]); assert.equal(game.enemies[0].hp, 100);
  assert.equal(game.lineOfSight(p, game.enemies[0]), false);
});

test('independent aim is preserved while strafing and empty equipment falls back to an unlimited pistol', () => {
  const game = begin(); battlefield(game); const p = game.players[0]; p.x = 7; p.y = 12;
  p.owned.push('smg'); p.weapon = 'smg'; p.ammo.smg = 1;
  advance(game, .5, [input(1, { x: 1, a: true, aimY: -1 })]);
  assert.ok(p.x > 8); assert.ok(Math.abs(p.angle + Math.PI / 2) < 1e-9); assert.equal(p.ammo.smg, 0); assert.equal(p.weapon, 'pistol'); assert.equal(p.ammo.pistol, -1);
});

test('grenade edge is single-shot, cancelSeq cannot synthesize actions, and reconnect requires release', () => {
  const game = begin(); battlefield(game); const p = game.players[0], initial = p.grenades;
  advance(game, .4, [input(1, { b: true })]); assert.equal(p.grenades, initial - 1);
  game.update(.02, [input(1, { b: true, start: true, select: true, cancelSeq: 1 })]);
  assert.equal(game.phase, 'playing'); assert.equal(p.grenades, initial - 1);
  advance(game, .2, [input(1, { b: true, start: true, cancelSeq: 1 })]); assert.equal(game.phase, 'playing'); assert.equal(p.grenades, initial - 1);
  game.update(.02, [input(1, { cancelSeq: 1 })]);
  game.update(.02, [input(1, { b: true, cancelSeq: 1 })]); assert.equal(p.grenades, initial - 2);
  advance(game, 1.5, [input(1, { cancelSeq: 1 })]); assert.equal(game.grenades.length, 0); assert.ok(game.events.some(e => e.kind === 'explosion'));
});

test('enemy navigation advances around storage obstacles instead of walking through them', () => {
  const game = begin(); battlefield(game); const p = game.players[0]; p.x = 7; p.y = 22;
  game.enemies.push({ id: 300, type: 'crawler', x: 7, y: 13, radius: .46, angle: 0, hp: 100, maxHp: 100, speed: 1.8, damage: 0, attackCooldown: 999, hitFlash: 0 });
  const e = game.enemies[0];
  for (let i = 0; i < 900; i++) { game.update(1 / 60, [input()]); assert.equal(game.blocked(e.x, e.y, e.radius * .98), false); }
  assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < 1.5, `enemy reached player via path: ${e.x},${e.y}`);
});

test('large enemy navigation uses body clearance and does not wedge against the cargo corner', () => {
  for (const type of ['spitter', 'brute', 'boss']) {
    const game = begin(); battlefield(game); const p = game.players[0]; p.x = 26; p.y = 28;
    const spec = World.enemyTypes[type];
    const e = { id: 301, type, x: 29.857, y: 3.154, radius: spec.radius, angle: 0, hp: 9999, maxHp: 9999, speed: spec.speed, damage: 0, attackCooldown: 999, hitFlash: 0, summoned: -999 };
    if (game.blocked(e.x, e.y, e.radius)) e.x = 30.5;
    game.enemies = [e];
    advance(game, 60, [input()]);
    assert.equal(game.lineOfSight(e, p), true, `${type} found line of sight after routing around cargo`);
    assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < (type === 'boss' ? 8.2 : type === 'spitter' ? 6.7 : 1.5), `${type} reached attack range: ${e.x},${e.y}`);
    assert.equal(game.blocked(e.x, e.y, e.radius * .99), false);
  }
});

test('a round heavy alien can navigate the reactor diagonal gap without square-clearance deadlock', () => {
  const game = begin(); game.loadStage(2); battlefield(game); game.map.objectives[0].status = 'locked'; const p = game.players[0]; p.x = 40; p.y = 6;
  const e = { id: 302, type: 'brute', x: 45.5071, y: 20.9477, radius: .69, angle: 0, hp: 9999, maxHp: 9999, speed: .94, damage: 0, attackCooldown: 999, hitFlash: 0 };
  game.enemies = [e]; advance(game, 50, [input()]);
  assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < 1.5, `heavy alien reached the reactor console: ${e.x},${e.y}`);
  assert.equal(game.blocked(e.x, e.y, e.radius * .99), false);
});

test('co-op damage, revival and all-down gameover are meaningful and cannot trigger empty-team extraction', () => {
  const game = begin(2); battlefield(game); const [a, b] = game.players; a.invulnerable = 0; a.armor = 0;
  game.damagePlayer(a, 150); assert.equal(a.downed, true); assert.equal(a.alive, false);
  b.x = a.x + .7; b.y = a.y;
  advance(game, 3.2, [input(1), input(2)]); assert.equal(a.downed, false); assert.equal(a.hp, 50); assert.ok(a.invulnerable > 0);
  a.invulnerable = b.invulnerable = 0; a.armor = b.armor = 0;
  game.damagePlayer(a, 200); game.damagePlayer(b, 200); game.extractionReady = true;
  game.update(.02, [input(1), input(2)]); assert.equal(game.phase, 'gameover');
});

test('shared-screen tether bounds separation without reversing movement', () => {
  const game = begin(2); battlefield(game); const [a, b] = game.players; a.x = 3; a.y = 30; b.x = 8; b.y = 30;
  advance(game, 4, [input(1), input(2, { x: 1 })]);
  assert.ok(b.x >= 8); assert.ok(Math.hypot(a.x - b.x, a.y - b.y) <= 13.01);
});

test('shop purchases are charged once, shared with the squad and capped', () => {
  const game = begin(2); battlefield(game); game.phase = 'shop'; game.credits = 500;
  assert.equal(game.buy(0), true); assert.equal(game.credits, 380);
  for (const p of game.players) { assert.ok(p.owned.includes('smg')); assert.equal(p.ammo.smg, 240); assert.equal(p.weapon, 'smg'); }
  assert.equal(game.buy(3), false); assert.equal(game.credits, 380);
  game.players.forEach(p => { p.maxHp = 200; }); assert.equal(game.buy(8), false); assert.equal(game.credits, 380);
  assert.equal(game.continueCampaign(), true); assert.equal(game.stage, 1); assert.equal(game.phase, 'playing');
  assert.equal(game.buy(0), false);
});

test('all nine mission objectives, two shops, final boss and extraction form a complete campaign', () => {
  const game = begin(); const controls = [input()]; let bossSeen = false, totalWaves = 0;
  for (let stage = 0; stage < 3; stage++) {
    assert.equal(game.stage, stage); game.players[0].invulnerable = 999;
    for (let objective = 0; objective < 3; objective++) {
      const task = game.map.objectives[objective], p = game.players[0]; p.x = task.x; p.y = task.y;
      let limit = 1800;
      while (task.status !== 'done' && limit-- > 0) {
        if (game.enemies.some(e => e.type === 'boss')) bossSeen = true;
        clearEnemies(game); game.update(.1, controls);
      }
      assert.ok(limit > 0, `objective ${stage}/${objective} completes`);
      assert.equal(task.status, 'done'); totalWaves++;
      if (objective < 2) assert.equal(game.map.doors[objective].open, true);
    }
    assert.equal(game.extractionReady, true);
    game.players[0].x = game.map.exit.x; game.players[0].y = game.map.exit.y; game.update(.1, controls);
    if (stage < 2) { assert.equal(game.phase, 'shop'); assert.equal(game.buy(stage === 0 ? 0 : 3), true); assert.equal(game.continueCampaign(), true); }
  }
  assert.equal(totalWaves, 9); assert.equal(bossSeen, true); assert.equal(game.phase, 'victory'); assert.ok(game.kills > 200);
});

test('boss spawning is retried when the crowd cap blocks the first attempt', () => {
  const game = begin(); game.loadStage(2); battlefield(game); game.objectiveIndex = 2;
  const task = game.map.objectives[2]; task.status = 'defending'; task.progress = 1; game.waveRemaining = 0; game.bossPending = true;
  for (let i = 0; i < Game.LIMITS.enemies; i++) game.enemies.push({ id: i + 1, type: 'crawler', x: 8, y: 12, radius: .46, hp: 1 });
  game.stepObjectives(.1); assert.equal(game.bossPending, true); assert.equal(task.status, 'defending');
  game.enemies = []; game.stepObjectives(.1); assert.equal(game.bossPending, false); assert.ok(game.enemies.some(e => e.type === 'boss')); assert.equal(task.status, 'defending');
});

test('entity pools remain bounded and malformed control values never contaminate coordinates', () => {
  const game = begin(); battlefield(game); const p = game.players[0]; p.weapon = 'minigun'; p.owned.push('minigun'); p.ammo.minigun = 2000;
  for (let i = 0; i < 500; i++) { game.effect('spark', 5, 5, 10, '#fff', 3, .1); game.addPickup('ammo', 9, 9, 1); game.emit('shot'); game.spawnEnemy('crawler', 0); }
  assert.ok(game.enemies.length <= Game.LIMITS.enemies); assert.ok(game.particles.length <= Game.LIMITS.particles); assert.ok(game.pickups.length <= Game.LIMITS.pickups); assert.ok(game.events.length <= Game.LIMITS.events);
  advance(game, 4, [input(1, { a: true, x: Infinity, y: NaN, aimX: 'bad', aimY: -Infinity })]);
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.angle)); assert.ok(game.bullets.length <= Game.LIMITS.bullets);
  assert.ok(game.decals.length <= Game.LIMITS.decals);
});

test('same seed and control timeline reproduce the simulation', () => {
  const a = begin(), b = begin();
  for (let frame = 0; frame < 300; frame++) {
    const controls = [input(1, { x: frame < 60 ? 1 : 0, y: frame >= 60 && frame < 120 ? -1 : 0, a: true, b: frame === 150 })];
    a.update(1 / 60, controls); b.update(1 / 60, controls);
  }
  for (const field of ['players', 'enemies', 'bullets', 'pickups', 'credits', 'kills', 'events']) assert.deepEqual(a[field], b[field]);
});
