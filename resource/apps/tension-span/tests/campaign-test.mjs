// Offline recording-controller rehearsal; never claimed as browser/video evidence.
import assert from 'node:assert/strict';
import Model from '../src/main/assets/game-model.js';
import {keys as campaignKeys} from './recording-automation.mjs';
let selected=0,state=Model.create(79,0),held=[],previous=new Set(),cancelEpoch=0,cancelled=true;
const wins=[];
for(let frame=0;frame<360*60&&wins.length<6;frame++){
  if(frame%5===0)held=campaignKeys({phase:state.phase,paused:false,model:structuredClone(state),level:selected},{elapsed:frame/60});
  const pressed=key=>held.includes(key)&&!previous.has(key);
  if(state.phase==='won'){
    if(pressed('ArrowRight'))selected=(selected+1)%6;
    if(pressed('Enter')){assert.equal(selected,wins.length);state=Model.create(79,selected);cancelEpoch++;cancelled=true;}
  }else{
    Model.step(state,1/60,{x:Number(held.includes('ArrowRight'))-Number(held.includes('ArrowLeft')),y:Number(held.includes('ArrowDown'))-Number(held.includes('ArrowUp')),a:held.includes('Space'),b:held.includes('b'),cancelEpoch,cancelled});cancelled=false;
    assert.notEqual(state.phase,'lost','ordinary campaign timed out');
    if(state.phase==='won')wins.push({level:state.level,roundSeconds:state.elapsed,wallSeconds:frame/60,attempts:state.attempts});
  }
  previous=new Set(held);
}
assert.deepEqual(wins.map(win=>win.level),[1,2,3,4,5,6]);
assert.equal(wins[0].attempts,2,'first bridge includes a real failed test and normal repair');
console.log(JSON.stringify({kind:'offline-normal-input-campaign-rehearsal',physicalTvTested:false,wins},null,2));
