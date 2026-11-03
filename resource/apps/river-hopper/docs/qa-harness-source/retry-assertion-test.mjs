import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {assertRetry} from './automation.mjs';
const schedules=[[],[.013],[.08,.11],[.25,.25,.25,.25],[.25,.25,.25,1/12]];
let positive=0,negative=0;
for(let level=0;level<3;level++){
 const initial={model:model.create(undefined,level)},before={model:model.create(undefined,level)};
 for(let i=0;i<32;i++)model.step(before.model,.25,{});
 for(const schedule of schedules){const after={model:model.create(undefined,level)};for(const dt of schedule)model.step(after.model,dt,{});if(schedule.at(-1)===1/12)assert.equal(after.model.activeTicks,100);assertRetry({initial,before,after},assert);positive++;}
 const fresh=model.create(undefined,level);model.step(fresh,.1,{});
 const defects=[s=>s.player.x-=60,s=>s.lives--,s=>s.goalCount++,s=>s.visited.push('stale'),s=>s.jumps++,s=>s.deaths++,s=>s.rideTicks++,s=>s.score=1,s=>s.timeLeft+=.1,s=>s.physicsTicks++,s=>s.elapsed+=.1,s=>s.physicsRemainder=-.1,s=>s.lanes[0].objects[0].x+=1,s=>s.lanes[0].speed++,s=>s.lanes[0].width++,s=>s.lanes[0].objects.pop(),s=>s.lastDeath={cause:'car'},s=>s.lanes[0].objects[0].x=420,s=>s.lanes[0].objects[0].x=-1,s=>s.lanes[0].objects[0].x+=420,s=>s.lanes[0].objects[0].x-=420];
 for(const mutate of defects){const copy=structuredClone(fresh);mutate(copy);assert.throws(()=>assertRetry({initial,before,after:{model:copy}},assert));negative++;}
}
console.log(JSON.stringify({passed:true,ordinaryFreshSnapshots:positive,syntheticInvalidSnapshotRejections:negative,note:'Positive snapshots use ordinary create/step with real neutral dt. Negative cases are labeled assertion fixtures, never used to claim gameplay wins.'},null,2));
