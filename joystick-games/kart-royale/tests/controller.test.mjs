import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kart-controller-tests-'));
const bundled=await build({absWorkingDir:root,preserveSymlinks:true,alias:Object.fromEntries(['three','n8ao','postprocessing','simplex-noise'].map(name=>[name,path.join(root,'node_modules',name)])),stdin:{contents:"export {Input} from './src/src/core/Input';export {Kart} from './src/src/kart/Kart';export {Race} from './src/src/game/Race';",resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
fs.writeFileSync(path.join(temp,'fixture.mjs'),bundled.outputFiles[0].contents);
const{Input,Kart,Race}=await import(pathToFileURL(path.join(temp,'fixture.mjs')));
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
const frame=b=>({buttons:b,pressed:b,cancelled:false});
const ctx={race:{state:2,player:null},items:{held(){return null}}};
test('independent nine-key controls feed original steering/drift/item pipeline',()=>{
 const input=new Input(); input.setTV(frame({UP:true,DOWN:true,LEFT:true,RIGHT:true,A:true,B:true,X:true,Y:true,START:true}),true);input.update(ctx,0.05);
 assert.equal(input.state.steer,0);assert.equal(input.state.accel,1);assert.equal(input.state.brake,1);assert.equal(input.state.drift,true);assert.equal(input.state.itemPressed,true);assert.equal(input.state.lookBack,true);assert.equal(input.state.pausePressed,false);
 input.cancelTV();input.setTV(frame({LEFT:true}),true);input.update(ctx,0.05);assert.ok(input.state.steer<0);
 input.cancelTV();input.setTV(frame({RIGHT:true}),true);input.update(ctx,0.05);assert.ok(input.state.steer>0);
});
test('cancellation empties drift minimum hold and item re-arm buffer',()=>{
 const input=new Input();input.setTV(frame({UP:true,B:true,X:true}),true);input.update(ctx,0.01);input.cancelTV();input.update(ctx,0.01);
 assert.equal(input.state.accel,0);assert.equal(input.state.drift,false);assert.equal(input.state.driftPressed,false);assert.equal(input.state.itemPressed,false);
});
test('cancelling original Kart drift forfeits charge without paying a boost',()=>{
 const kart=Object.create(Kart.prototype);Object.assign(kart,{driftDir:1,driftTier:3,driftCharge:1,driftTime:5,driftCarry:2,driftCarryTime:1,driftBeta:0.2,boostTime:2});
 kart.releaseDrift=()=>{throw Error('cancellation must not reward a release')};kart.cancelControllerDrift();
 assert.equal(kart.driftDir,0);assert.equal(kart.driftTier,0);assert.equal(kart.driftCharge,0);assert.equal(kart.driftCarry,0);assert.equal(kart.boostTime,2);
});
test('throttle cannot resume a paused original race; explicit resume can',()=>{
 const race=new Race(),events=[];race._state=5;race.prePause=2;race.raceTime=42;
 const c={input:{state:{accel:0,pausePressed:false}},bus:{emit:e=>events.push(e)}};
 race.update(c,0.05);c.input.state.accel=1;race.update(c,0.05);assert.equal(race.state,5);assert.equal(race.raceTime,42);
 race.setPaused(false);assert.equal(race.state,2);assert.equal(events.at(-1).name,'resume');
});

test('Wi-Fi seat isolates touch AUTO gas; cancellation clears touch pointer latches',()=>{
 const input=new Input();input.touch=true;
 input.pad.state.accel=1;input.pad.state.drift=true;input.pad.state.item=true;
 const button={pointer:7,tapped:true,el:{classList:{remove(){}}}};input.pad.buttons.push(button);
 input.setTV({...frame({}),connected:true},true);input.update(ctx,0.05);
 assert.equal(input.state.accel,0);assert.equal(input.state.drift,false);assert.equal(input.state.itemPressed,false);
 input.cancelTV();assert.equal(button.pointer,-1);assert.equal(button.tapped,false);assert.equal(input.pad.state.accel,0);assert.equal(input.pad.state.drift,false);assert.equal(input.pad.state.item,false);
 input.setTV({...frame({}),connected:false},false);input.update({...ctx,race:{state:5,player:null}},0.05);assert.equal(input.state.accel,0);
});

test('held standard gamepad confirm/pause cannot become fresh after cancellation',()=>{
 const buttons=Array.from({length:16},()=>({pressed:false,value:0}));buttons[2]={pressed:true,value:1};buttons[9]={pressed:true,value:1};
 Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{index:0,connected:true,axes:[0,0],buttons}]});
 try {
  const input=new Input();input.update(ctx,0.05);input.cancelTV();input.update({...ctx,race:{state:5,player:null}},0.05);
  assert.equal(input.state.itemPressed,false);assert.equal(input.state.pausePressed,false);
  buttons[2]={pressed:false,value:0};buttons[9]={pressed:false,value:0};input.update(ctx,0.05);
  buttons[2]={pressed:true,value:1};input.update(ctx,0.05);assert.equal(input.state.itemPressed,true);
 } finally { delete navigator.getGamepads; }
});
test('cancelled keyboard OS repeat cannot auto-confirm; fresh keydown still works',()=>{
 const input=new Input(),event={code:'Enter',repeat:false,preventDefault(){}};
 input.onDown(event);input.update(ctx,0.05);input.cancelTV();input.onDown({...event,repeat:true});input.update({...ctx,race:{state:5,player:null}},0.05);assert.equal(input.state.itemPressed,false);
 input.onUp(event);input.onDown(event);input.update(ctx,0.05);assert.equal(input.state.itemPressed,true);
});

test('desktop settings save before optional touch DOM is mounted',()=>{
 const saved=new Map(),oldDocument=globalThis.document,oldStorage=globalThis.localStorage;
 globalThis.document={documentElement:{setAttribute(){},removeAttribute(){}}};
 globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 try{const input=new Input();input.pad.setHand('left');input.pad.setAuto(false);input.pad.setScheme('buttons');
  const prefs=JSON.parse(saved.get('kr.controls.v1'));assert.equal(prefs.hand,'left');assert.equal(prefs.autoAccel,false);assert.equal(prefs.scheme,'buttons');
 }finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
