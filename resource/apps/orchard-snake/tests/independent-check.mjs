import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {chooseDirection,nextCell,directions} from './route.mjs';
import {createPilot} from './automation.mjs';
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(763,level);let previous=structuredClone(s),loops=0;
 while(s.phase==='playing'&&loops++<36000){
  const d=chooseDirection(s);assert.ok(d,'Visible body must permit a safe next direction');
  const input=s.queuedDirection||d.name===s.direction?{}:{x:d.x,y:d.y};model.step(s,1/60,input);
  if(s.moves!==previous.moves){const heading=directions.find(x=>x.name===s.direction),head=nextCell(s,previous.body[0],heading),grew=head===previous.food,expected=[head,...previous.body];if(!grew)expected.pop();assert.deepEqual(s.body,expected);assert.equal(s.eaten,previous.eaten+(grew?1:0));assert.equal(new Set(s.body).size,s.body.length);assert.equal(s.body.length,3+s.eaten);assert.ok(s.body.every(p=>!s.walls[p]));if(s.food!==null)assert.ok(!s.body.includes(s.food)&&!s.walls[s.food]);}
  previous=structuredClone(s);
 }
 assert.equal(s.phase,'won');assert.equal(s.eaten,s.goalFruit);assert.equal(s.score,100);const frozen=JSON.stringify(s);model.step(s,.25,{a:true,x:-1});assert.equal(JSON.stringify(s),frozen);
 results.push({level,eaten:s.eaten,moves:s.moves,elapsed:s.elapsed,bodyLength:s.body.length,phase:s.phase,independentMovementAndGrowth:true});
}
const captureWarmups=[];
for(let level=0;level<3;level++){
 const s=model.create(763,level),pilot=createPilot();model.step(s,1/60,{});
 for(let capture=0;capture<2;capture++){model.step(s,1/60,{a:true});for(let frame=0;frame<66;frame++)model.step(s,1/60,{});}
 let loops=0;while(s.phase==='playing'&&loops++<3000){const keys=pilot({phase:s.phase,paused:false,model:structuredClone(s)}),input={a:keys.includes('Space'),x:keys.includes('ArrowRight')?1:keys.includes('ArrowLeft')?-1:0,y:keys.includes('ArrowDown')?1:keys.includes('ArrowUp')?-1:0};for(let frame=0;frame<4;frame++)model.step(s,1/60,input);}
 assert.equal(s.phase,'won');captureWarmups.push({level,normalBrakePresses:2,idleSecondsPerCapture:1.1,pilotPollingSeconds:4/60,moves:s.moves,brakesUsed:s.brakesUsed,phase:s.phase});
}
console.log(JSON.stringify({passed:true,method:'Public-current-food BFS with simulated growth and tail-reachability checks; ordinary fixed-step controls, independent body transition comparison. No future spawn prediction.',layouts:results,captureWarmups,note:'Capture warmups are pure-model timing regression simulations with ordinary A presses and neutral elapsed time, not browser screenshot measurements.'},null,2));
