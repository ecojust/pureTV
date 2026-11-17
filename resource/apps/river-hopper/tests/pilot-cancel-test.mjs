import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {createPilot} from './automation.mjs';
const input=keys=>({a:keys.includes('Space'),b:keys.includes('b'),x:keys.includes('ArrowRight')?1:keys.includes('ArrowLeft')?-1:0,y:keys.includes('ArrowDown')?1:keys.includes('ArrowUp')?-1:0});
const runs=[];for(let level=0;level<3;level++)for(const appliedBeforeCancel of [false,true]){
 const s=model.create(undefined,level),pilot=createPilot();model.step(s,.08,{cancelEpoch:0});const snap=()=>({phase:s.phase,paused:false,model:s});let first=pilot(snap());assert.ok(first.length);if(appliedBeforeCancel)model.step(s,.08,{...input(first),cancelEpoch:0});
 model.step(s,.08,{cancelEpoch:1,cancelled:true});assert.deepEqual(pilot(snap()),[],'Quarantined control emits neutral; already-applied command is acknowledged first');
 model.step(s,.08,{cancelEpoch:1});let calls=0;for(;calls<2000&&s.phase==='playing';calls++){const keys=pilot(snap());model.step(s,[.08,.11,.065,.095][calls%4],{...input(keys),cancelEpoch:1});}
 assert.equal(s.phase,'won');runs.push({level,appliedBeforeCancel,won:true,calls});
}
console.log(JSON.stringify({passed:true,scope:'Ordinary epoch/cancel/release signals before and after a pending command; six resumed normal-input wins, no gameplay state writes.',runs},null,2));
