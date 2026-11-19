import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../Web/bridge.js',import.meta.url),'utf8');
const KEYS=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
function setup(){
 const events=[];const w={document:{addEventListener(){}},PureGame:{suspend(){events.push('suspend')}},webkit:{messageHandlers:{joystickHost:{postMessage(){}}}}};
 w.chrome={webview:w.webkit.messageHandlers.joystickHost};vm.runInNewContext(source,{window:w});
 const sample=(revision,buttons={},counts={},extra={})=>({revision,inputEnabled:true,players:[{id:1,connected:true,controllerId:'sdk-test',session:'one',cancelSeq:0,buttons:Object.fromEntries(KEYS.map(k=>[k,!!buttons[k]])),buttonCounters:Object.fromEntries(KEYS.map(k=>[k,counts[k]||0])),...extra}]});
 const receive=(s,enabled=true)=>w.JoystickDesktop.receive({wifiController:{inputEnabled:enabled}},s);
 receive({revision:0,inputEnabled:true,players:[]});
 return {w,events,sample,receive,read:()=>JSON.parse(w.PureGameHost.snapshot())};
}
test('every physical short tap is independent and consumed exactly once',()=>{
 for(const key of KEYS){const x=setup();x.receive(x.sample(1,{}, {[key]:1}));let p=x.read().players[0];assert.equal(p.buttons[key],true);assert.equal(Object.values(p.buttons).filter(Boolean).length,1);p=x.read().players[0];assert.equal(p.buttons[key],false);}
});
test('X/Y never drive A/B fields and native pushes preserve queued pulses',()=>{
 const x=setup();x.receive(x.sample(1,{}, {X:1,Y:1}));x.receive(x.sample(2,{}, {X:1,Y:1}));const p=x.read().players[0];assert.equal(p.buttons.X,true);assert.equal(p.buttons.Y,true);assert.equal(p.a,false);assert.equal(p.b,false);assert.equal(x.read().players[0].buttons.X,false);
});
test('held keys survive reads and releasing one never releases its former alias',()=>{
 const x=setup();x.receive(x.sample(1,{A:true,X:true},{A:1,X:1}));x.read();x.receive(x.sample(2,{X:true},{A:1,X:1}));const p=x.read().players[0];assert.equal(p.buttons.A,false);assert.equal(p.buttons.X,true);assert.equal(x.read().players[0].buttons.X,true);
});
test('repeated and stale revisions cannot replay a consumed short tap',()=>{
 const x=setup();x.receive(x.sample(2,{}, {START:1}));x.read();x.receive(x.sample(2,{}, {START:1}));assert.equal(x.read().players[0].buttons.START,false);assert.equal(x.receive(x.sample(1,{A:true},{A:1})),false);assert.equal(x.read().players[0].buttons.A,false);
});
test('disconnect clears pending input; reconnect held keys require fresh release',()=>{
 const x=setup();x.receive(x.sample(1,{X:true},{X:1}));x.receive({revision:2,players:[]});assert.equal(x.read().connections,0);x.receive(x.sample(3,{X:true},{X:8},{session:'two'}));assert.equal(x.read().players[0].buttons.X,false);x.receive(x.sample(4,{}, {X:8},{session:'two'}));x.receive(x.sample(5,{X:true},{X:9},{session:'two'}));assert.equal(x.read().players[0].buttons.X,true);
});
test('foreground cancellation suppresses all nine held keys and background pulses',()=>{
 const x=setup();x.receive(x.sample(1,{},{}));x.receive(x.sample(2,{A:true},{A:1}),false);assert.equal(x.read().connections,0);assert.deepEqual(x.events,['suspend']);x.receive(x.sample(3,{X:true},{X:1}),false);x.receive(x.sample(4,{X:true},{X:1},{cancelSeq:2}));assert.equal(x.read().players[0].buttons.X,false);x.receive(x.sample(5,{}, {X:1},{cancelSeq:2}));x.receive(x.sample(6,{X:true},{X:2},{cancelSeq:2}));assert.equal(x.read().players[0].buttons.X,true);
});
test('identity and port are native values and do not consume input',()=>{
 const x=setup();x.w.JoystickDesktop.receive({wifiController:{inputEnabled:true,port:63485}},x.sample(1,{Y:true},{Y:1}));assert.equal(JSON.parse(x.w.PureGameHost.getInfo()).wifiController.port,63485);assert.equal(x.read().players[0].controllerId,'sdk-test');assert.equal(x.read().players[0].buttons.Y,true);
});

function storagePage(saved, allowed=['save','settings'], old={}) {
 class Storage {
  constructor(values={}) { this.values=new Map(Object.entries(values)); }
  getItem(key) { return this.values.get(String(key))??null; }
  setItem(key,value) { this.values.set(String(key),String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
 }
 const messages=[];
 const w={Storage,TextEncoder,localStorage:new Storage(old),sessionStorage:new Storage(),document:{addEventListener(){}},webkit:{messageHandlers:{joystickHost:{postMessage(m){messages.push({...m});if(m.type==='preference'&&allowed.includes(m.key)){if(m.value===null)delete saved[m.key];else saved[m.key]=m.value;}}}}}};
 w.chrome={webview:w.webkit.messageHandlers.joystickHost};vm.runInNewContext(source,{window:w});
 const receive=()=>w.JoystickDesktop.receive({storageKeys:allowed,storageMaxBytes:1048576,preferences:{...saved}}, {revision:0,inputEnabled:true,players:[]});
 receive();return {w,messages,receive};
}
test('actual bridge restores a different origin before game code, then mirrors writes and deletion',()=>{
 const saved={};const first=storagePage(saved);
 first.w.localStorage.setItem('save','{"tick":123,"label":"存档"}');first.w.localStorage.setItem('settings','');
 const reopened=storagePage(saved,undefined,{'save':'stale origin value'});
 assert.equal(reopened.w.localStorage.getItem('save'),saved.save);assert.equal(reopened.w.localStorage.getItem('settings'),'');
 assert.equal(reopened.messages.length,0,'hydration must not echo native writes');
 const initial=reopened.w.JoystickDesktop.initialStorage();initial.save='tampered';
 assert.equal(reopened.w.JoystickDesktop.initialStorage().save,saved.save,'diagnostics must not mutate hydrated evidence');
 reopened.w.localStorage.removeItem('save');assert.equal(saved.save,undefined);
 const third=storagePage(saved,undefined,{'save':'stale deleted save'});assert.equal(third.w.localStorage.getItem('save'),null);
 third.w.localStorage.clear();assert.deepEqual(saved,{});
 assert.equal(storagePage(saved).w.localStorage.getItem('settings'),null);
});
test('storage allowlists isolate games and never mirror session, unknown or oversized values',()=>{
 const firstNative={},secondNative={};const first=storagePage(firstNative);first.w.localStorage.setItem('save','one');
 assert.equal(storagePage(secondNative).w.localStorage.getItem('save'),null);
 first.w.sessionStorage.setItem('save','session');first.w.localStorage.setItem('unknown','unlisted');
 first.w.localStorage.setItem('save','界'.repeat(349526));assert.equal(firstNative.save,'one','UTF-8 bytes enforce native limit');
 first.w.sessionStorage.clear();assert.equal(firstNative.save,'one');
 const disabled=storagePage({},[]);disabled.w.localStorage.setItem('save','blocked');assert.equal(disabled.messages.length,0);
 const stale={save:'native old'};const live=storagePage(stale);live.w.localStorage.setItem('save','current');stale.save='late stale push';live.receive();assert.equal(live.w.localStorage.getItem('save'),'current','later info pushes cannot overwrite active localStorage');
});

test('Windows native bridge reports its own platform',()=>{const x=setup();assert.equal(JSON.parse(x.w.PureGameHost.getInfo()).platform,'windows');});
