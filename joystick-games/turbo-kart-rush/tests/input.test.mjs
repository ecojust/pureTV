import test from 'node:test';
import assert from 'node:assert/strict';
import { InputManager } from '../src/upstream/src/kart/InputManager.ts';
import { Kart } from '../src/upstream/src/kart/Kart.ts';
import { createEmptyInput } from '../src/upstream/src/core/types.ts';
import { createInputReducer, BUTTONS } from '../../shared/web/input.js';

function setup() {
  let time = 0;
  const handlers = {};
  globalThis.window = {addEventListener:(k,v)=>(handlers[k]||=[]).push(v),removeEventListener(){}};
  globalThis.document = {addEventListener(){},removeEventListener(){},visibilityState:'visible'};
  globalThis.HTMLElement = class {};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[]}});
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>time}});
  const input=new InputManager();
  return {input,update:(f,active=true)=>{time+=100;return {...input.update(f,active)};},fire:(event,code)=>handlers[event]?.forEach(fn=>fn({code,target:null,preventDefault(){}}))};
}
function frame(keys=[]) {
  const buttons=Object.fromEntries(BUTTONS.map(k=>[k,keys.includes(k)]));
  return {buttons,pressed:{...buttons}};
}

test('physical movement, drift, item, look, help and START are separate',()=>{
  const {update}=setup();
  const all=update(frame(['UP','LEFT','A','B','X']));
  assert.equal(all.throttle,1);assert.ok(all.steer<0);assert.equal(all.drift,true);
  assert.equal(all.useItem,true);assert.equal(all.lookBack,true);assert.equal(all.pause,false);
  const y=update(frame(['Y']));assert.equal(y.drift,false);assert.equal(y.useItem,false);assert.equal(y.lookBack,false);assert.equal(y.pause,false);
  const start=update(frame(['START']));assert.equal(start.pause,true);assert.equal(start.drift,false);assert.equal(start.useItem,false);
  const brake=update(frame(['DOWN','RIGHT']));assert.equal(brake.brake,1);assert.ok(brake.steer>0);
});

test('menus confirm with A/START, return with Y; held confirmation cannot drift',()=>{
  const {update}=setup();
  assert.equal(update(frame(['A']),false).confirm,true);
  assert.equal(update(frame(['A']),true).drift,false);
  update(frame());assert.equal(update(frame(['A'])).drift,true);
  assert.equal(update(frame(['START']),false).confirm,true);
  assert.equal(update(frame(['Y']),false).back,true);
  assert.equal(update(frame(['B']),false).back,false);
});

test('disconnect and reconnection quarantine cannot trigger stale item or charged drift release',()=>{
  const {input,update}=setup();const reducer=createInputReducer();
  const sample=(session,keys)=>({players:[{id:1,controllerId:'rush-test',session,connected:true,transport:'wifi',buttons:frame(keys).buttons}]});
  assert.equal(update(reducer.read(sample('a',['A','B']))).useItem,true);
  const lost=reducer.read({players:[]});assert.equal(lost.cancelled,true);assert.equal(lost.released.A,false);input.cancel();
  const stale=update(reducer.read(sample('b',['A','B'])));assert.equal(stale.drift,false);assert.equal(stale.useItem,false);
  update(reducer.read(sample('b',[])));assert.equal(update(reducer.read(sample('b',['B']))).useItem,true);
});

test('keyboard cancel clears edges and quarantines held keys until physical release',()=>{
  const {input,update,fire}=setup();fire('keydown','Space');fire('keydown','KeyE');input.cancel();
  fire('keydown','Space');fire('keydown','KeyE');const cancelled=update(frame());assert.equal(cancelled.drift,false);assert.equal(cancelled.useItem,false);
  fire('keyup','Space');fire('keydown','Space');assert.equal(update(frame()).drift,true);
});

test('cancel through original endDrift(false) preserves earned boost and inventory',()=>{
  let awarded=0;
  const kart=Object.assign(Object.create(Kart.prototype),{state:{id:0,isDrifting:true,driftDirection:1,driftStage:3,driftCharge:1,boostTimer:0.6,item:'red_shell',itemCount:1,position:{x:12,y:2,z:30},speed:18},
    input:{...createEmptyInput(),drift:true,useItem:true},absCharge:5,prevDriftHeld:true,pendingHop:true,frozenThrottleTime:2,applyBoost(){awarded++;}});
  kart.cancelControls();
  assert.equal(awarded,0);assert.equal(kart.state.isDrifting,false);assert.equal(kart.state.driftStage,0);assert.equal(kart.input.useItem,false);
  assert.equal(kart.state.item,'red_shell');assert.equal(kart.state.itemCount,1);assert.equal(kart.state.boostTimer,0.6);
  assert.equal(kart.state.speed,18);assert.deepEqual(kart.state.position,{x:12,y:2,z:30});
});
