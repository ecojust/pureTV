import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, move, floors, tile, directions, guard, strike, advance, readCheckpoint, buy } from '../src/js/tower.js';

// Search using only walkable tiles, inventory, and the visible contents of this floor.
function route(run, isGoal) {
  const queue=[[run.x,run.z,[]]],seen=new Set([run.z*11+run.x]);
  for(let i=0;i<queue.length;i++) {
    const [x,z,path]=queue[i];
    for(const [key,[dx,dz]] of Object.entries(directions)) {
      const a=x+dx,b=z+dz,pos=b*11+a,t=tile(run,a,b);
      if(seen.has(pos)||t==='#'||(t==='<' && run.floor>0)) continue;
      if('YBR'.includes(t)&&!run.keys[t.toLowerCase()]) continue;
      seen.add(pos);
      const steps=[...path,key];
      if(isGoal(t)) return steps;
      if(!'*>'.includes(t)) queue.push([a,b,steps]);
    }
  }
  return [];
}
function walk(run,key) {
  move(run,key);
  if(run.mode==='shop') { buy(run,0); run.mode='explore'; }
  if(run.mode==='duel') {
    for(let i=0;i<500 && run.mode==='duel';i++) {
      if(run.duel.timer<.25) guard(run);
      strike(run,run.duel.energy>=2); advance(run,.05);
    }
    assert.equal(run.mode,'explore');
    move(run,key);
  }
}

test('21 distinct maps and playable ascent through the final king to the crown',()=>{
  assert.equal(floors.length,21);
  assert.equal(new Set(floors.map(f=>f.rows.join(''))).size,21);
  const run=createRun(), defeat=new Set();
  for(let floor=0;floor<21;floor++) {
    assert.equal(run.floor,floor);
    for(let action=0; action<800 && run.floor===floor && run.mode!=='won'; action++) {
      const path=route(run,t=>'ybhrad'.includes(t));
      const next=path.length?path:route(run,t=>'>*'.includes(t));
      assert.ok(next.length,'A key or the exit must be reachable on floor '+(floor+1));
      for(const key of next) {
        const [dx,dz]=directions[key], target=tile(run,run.x+dx,run.z+dz);
        walk(run,key);
        if (target==='K') defeat.add(floor+1);
      }
    }
    assert.ok(run.floor>floor||run.mode==='won');
    if(run.mode==='explore') assert.deepEqual(readCheckpoint(JSON.stringify(run)),run);
  }
  assert.deepEqual([...defeat],[7,14,21]); assert.equal(run.mode,'won');
  const final=JSON.stringify(run); move(run,'RIGHT');strike(run,true);advance(run,2);
  assert.equal(JSON.stringify(run),final);
});

test('keys match lock color, unlock once, and picked items survive revisits',()=>{
  const run=createRun();run.x=8;run.z=9;
  move(run,'RIGHT');assert.equal(run.x,8);
  run.keys.b=1;move(run,'RIGHT');assert.equal(run.x,8);
  run.keys.y=1;move(run,'RIGHT');assert.equal(run.x,9);assert.deepEqual(run.keys,{y:0,b:1,r:0});
  move(run,'LEFT');move(run,'RIGHT');assert.equal(run.x,9);
});

test('stairs return to the same cleared floor, with inventory intact',()=>{
  const run=createRun();run.x=7;run.z=2;run.gold=19;run.clears[0]=[29];
  assert.equal(move(run,'DOWN'),'checkpoint');assert.equal(run.floor,1);move(run,'RIGHT');
  assert.equal(move(run,'LEFT'),'checkpoint');assert.equal(run.floor,0);
  assert.deepEqual(run.clears[0],[29]);assert.equal(run.gold,19);
});
test('parry prevents damage only during the timing window, defeat freezes combat',()=>{
  const run=createRun();run.x=3;run.z=8;move(run,'UP');assert.equal(run.mode,'duel');
  const hp=run.hp;run.duel.timer=.1;guard(run);advance(run,.11);
  assert.equal(run.hp,hp);assert.equal(run.duel.parried,true);
  for(let i=0;i<40;i++)advance(run,.05);assert.ok(run.hp<hp);
  run.hp=1;run.duel.timer=.02;advance(run,.05);assert.equal(run.mode,'lost');
  const final=JSON.stringify(run);advance(run,1);strike(run);assert.equal(JSON.stringify(run),final);
});
test('corrupt checkpoints are ignored',()=>{
  assert.equal(readCheckpoint('[]'),null);assert.equal(readCheckpoint('{'),null);
  assert.equal(readCheckpoint(JSON.stringify({...createRun(),floor:999})),null);
});
