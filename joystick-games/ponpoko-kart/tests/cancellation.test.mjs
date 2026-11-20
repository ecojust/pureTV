import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/upstream/src/core/Game.js';
import { Race } from '../src/upstream/src/core/Race.js';
import { Kart } from '../src/upstream/src/kart/Kart.js';

test('cancel charged drift and pending item without awarding boost or consuming inventory', () => {
  let awarded = 0;
  const player = {drift:{active:true,dir:1,charge:3,level:3,pendingHop:true,hopT:0.1},
    _jumpHeld:true,boostT:0.4,item:'daruma',pos:{x:12,y:2,z:45},speed:28,
    addBoost(){awarded++;}, events:[]};
  const race = Object.assign(Object.create(Race.prototype), {player,
    playerControls:{steer:1,accel:1,brake:0,jump:true},_jumpLatch:true,_itemLatch:true,_itemBack:true,
    rocket:{firstPress:1.6},time:29,simTime:32,countT:3});
  race.cancelPlayerInput();
  // Original release mechanism must see an inactive drift after cancel.
  Kart.prototype._releaseDrift.call(player);
  assert.equal(awarded,0); assert.equal(player.boostT,0.4); assert.equal(player.item,'daruma');
  assert.equal(race._itemLatch,false); assert.equal(race._jumpLatch,false);
  assert.equal(player._jumpHeld,false); assert.equal(player.drift.charge,0);
  assert.deepEqual(player.pos,{x:12,y:2,z:45}); assert.equal(player.speed,28);
  assert.equal(race.time,29); assert.equal(race.simTime,32); assert.equal(race.rocket.firstPress,-1);
  race.cancelPlayerInput(); assert.equal(awarded,0);
});

test('a paused software renderer keeps polling and only redraws an invalidated backing buffer', (t) => {
  const originalRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => {};
  t.after(() => {
    if (originalRAF) globalThis.requestAnimationFrame = originalRAF;
    else delete globalThis.requestAnimationFrame;
  });

  const counts = { polls: 0, draws: 0, rendered: 0, releases: 0 };
  const game = Object.assign(Object.create(Game.prototype), {
    _last: 0, time: 12, mode: 'racing', paused: true, world: {}, reusePausedFrame: true,
    input: { menuActions: [], pollGamepad() {}, pausePressed() { return false; }, endFrame() { counts.releases++; } },
    tv: { poll() { counts.polls++; }, rendered() { counts.rendered++; } },
    renderer: { hasRenderedFrame: true, render(dt) {
      assert.equal(dt, 0);
      this.hasRenderedFrame = true;
      counts.draws++;
    } },
  });
  game._frame(16);
  game.renderer.hasRenderedFrame = false;
  game._frame(32);
  game._frame(48);
  assert.deepEqual(counts, { polls: 3, draws: 1, rendered: 1, releases: 3 });
  assert.equal(game.time, 12);

  game.reusePausedFrame = false;
  game._frame(64);
  assert.equal(counts.draws, 2);
});
