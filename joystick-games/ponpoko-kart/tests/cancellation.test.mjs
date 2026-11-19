import test from 'node:test';
import assert from 'node:assert/strict';
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
