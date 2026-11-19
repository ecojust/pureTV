import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { drivingInput, cancelDrift } from '../src/src/tv-controls.js';
import { createStore, STORAGE_KEY } from '../src/src/tv-storage.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const idle={throttle:false,brake:false,steer:0,drift:false,nitroPressed:false};
test('nine physical keys keep steering, throttle, brake, drift and nitro independent',()=>{
 assert.deepEqual(drivingInput({buttons:{UP:true,DOWN:true,LEFT:true,A:true,X:true,Y:true,START:true},pressed:{B:true}},idle),{throttle:true,brake:true,steer:-1,drift:true,nitroPressed:true});
 assert.equal(drivingInput({buttons:{RIGHT:true}},idle).steer,1);
 assert.equal(drivingInput({buttons:{LEFT:true,RIGHT:true}},idle).steer,0);
});
test('held nitro does not repeat without a new press; camera and reset do not spend it',()=>{
 assert.equal(drivingInput({buttons:{B:true,X:true,Y:true},pressed:{X:true,Y:true}},idle).nitroPressed,false);
 assert.equal(drivingInput({pressed:{B:true}},idle).nitroPressed,true);
});
test('ordinary keyboard driving and original steering sign remain available',()=>{
 assert.deepEqual(drivingInput({}, {...idle,throttle:true,steer:-1}),{...idle,throttle:true,steer:-1});
});
test('disconnect discards a charged drift without changing motion or granting boost',()=>{
 const car={drifting:true,driftTime:1.9,driftDir:-1,speed:30,x:80,z:-45,miniT:0,nitro:60,boostT:0,bottles:2};
 cancelDrift(car);
 assert.deepEqual(car,{drifting:false,driftTime:0,driftDir:0,speed:30,x:80,z:-45,miniT:0,nitro:60,boostT:0,bottles:2});
});
test('original settings/profile keys persist inside one native record',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const store=createStore(storage);for(let i=0;i<90;i++)store.set('nr-test-'+i,{t:i,f:[[1,2,3]]});store.set('nr-lang','zh');
 const restored=createStore(storage);assert.equal(restored.get('nr-lang'),'zh');assert.deepEqual(restored.get('nr-test-89'),{t:89,f:[[1,2,3]]});assert.deepEqual([...data.keys()],[STORAGE_KEY]);
 assert.throws(()=>store.set('__proto__',{}));
});
test('invalid save payload starts clean without losing subsequently stored progress',()=>{
 let data='false';const store=createStore({getItem:()=>data,setItem:(_,value)=>{data=value;}});
 assert.equal(store.get('nr-profile'),null);store.set('nr-profile',{coins:50});assert.equal(store.get('nr-profile').coins,50);
});
test('large replays on different maps do not exceed a single combined native value',()=>{
 const data=new Map(),store=createStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
 const replay={t:240,f:Array.from({length:10000},()=>[1234.56,3456.78,5678.90,7890.12,4321.09])};
 for(const key of ['nr-ghost','nr-ghost-mod','nr-ghost-ice','nr-ghost-mod-deep'])assert.equal(store.set(key,replay),true);
 assert.equal(data.size,4);assert.ok([...data.values()].every(v=>Buffer.byteLength(v)<1048576));
 assert.deepEqual(store.get('nr-ghost-mod-deep'),replay);
});
test('renderer loop samples input once and exposes no upstream simulation mutation hook',()=>{
 const main=fs.readFileSync(path.join(root,'src/src/main.js'),'utf8');
 assert.equal((main.match(/tv\.poll\(\)/g)||[]).length,1);
 assert.equal(main.includes('window.__game'),false);assert.equal(main.includes('function sim(seconds'),false);
 assert.match(main,/const TOUCH = false/);assert.match(main,/pauseReturn = state/);
});
test('original driving physics and every track definition remain byte-identical',()=>{
 // Portable expected values are generated from the already verified Git blobs.
 const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/original-core-hashes.json')));
 for(const [name,sha]of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src',name))).digest('hex'),sha,name);
});
