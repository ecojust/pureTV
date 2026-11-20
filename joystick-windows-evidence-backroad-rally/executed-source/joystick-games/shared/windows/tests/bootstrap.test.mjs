import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const bridge=fs.readFileSync(new URL('../Web/bridge.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../Web/bootstrap.js',import.meta.url),'utf8');
function page(native,epoch,{origin='https://puretv.local',pathname='/tv.html',hash='',subframe=false}={}) {
 class Storage{constructor(){this.v=new Map([['save','stale browser cache']]);}getItem(k){return this.v.get(String(k))??null;}setItem(k,v){this.v.set(String(k),String(v));}removeItem(k){this.v.delete(String(k));}clear(){this.v.clear();}}
 let calls=0;const w={Storage,TextEncoder,localStorage:new Storage(),document:{addEventListener(){}},location:{origin,pathname,hash}};
 w.top=subframe?{}:w;
 w.chrome={webview:{
  postMessage(message){if(message.type==='preference'){if(message.value===null)delete native[message.key];else native[message.key]=message.value;}},
  hostObjects:{sync:{puretvBootstrap:{get snapshot(){calls++;return JSON.stringify({documentEpoch:epoch,info:{storageKeys:['save','removed'],preferences:{...native},wifiController:{inputEnabled:false}},input:{revision:epoch,inputEnabled:false,players:[]}});}}}}
 }};
 vm.runInNewContext(bridge+'\n'+bootstrap,{window:w,location:w.location});
 return {w,calls};
}
test('each document reads live native preferences before the first game read',()=>{
 const native={save:'native initial',removed:'old'};const first=page(native,1);assert.equal(first.w.localStorage.getItem('save'),'native initial');assert.equal(first.calls,1);
 first.w.localStorage.setItem('save','chosen low');first.w.localStorage.removeItem('removed');
 const second=page(native,2);assert.equal(second.w.localStorage.getItem('save'),'chosen low');assert.equal(second.w.localStorage.getItem('removed'),null);assert.equal(second.w.JoystickDesktop.initialStorage().save,'chosen low');assert.equal(second.w.__puretvDocumentEpoch,2);
 second.w.localStorage.clear();const third=page(native,3);assert.equal(third.w.localStorage.getItem('save'),null);assert.equal(third.w.__puretvDocumentEpoch,3);
});
test('document epoch is immutable and cannot be relabeled by later native info',()=>{
 const x=page({},7);assert.throws(()=>{x.w.__puretvDocumentEpoch=8;},TypeError);assert.throws(()=>Object.defineProperty(x.w,'__puretvDocumentEpoch',{value:8}),TypeError);
 x.w.JoystickDesktop.receive({preferences:{save:'late'},wifiController:{inputEnabled:true}},{revision:8,inputEnabled:true,players:[]});assert.equal(x.w.__puretvDocumentEpoch,7);assert.equal(x.w.localStorage.getItem('save'),null);
});
test('non-entry or subframe bootstrap never calls the host object',()=>{
 for(const options of [{origin:'https://evil.invalid'},{pathname:'/other.html'},{hash:'#fragment'},{subframe:true}]){const x=page({},1,options);assert.equal(x.calls,0);assert.equal(x.w.__puretvDocumentEpoch,undefined);}
});
test('invalid native epoch fails closed before seed',()=>{
 for(const epoch of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1,null])assert.throws(()=>page({},epoch),/Invalid native document epoch/);
});
