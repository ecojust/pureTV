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

function diagnosticPage(flag) {
 const handlers={window:new Map(),document:new Map()},suspends=[];let nativeReads=0;
 const add=(where,name,fn)=>{const list=handlers[where].get(name)||[];list.push(fn);handlers[where].set(name,list);};
 const w={document:{hidden:false,hasFocus:()=>true,addEventListener:(name,fn)=>add('document',name,fn)},
   addEventListener:(name,fn)=>add('window',name,fn),performance:{now:()=>12.5},
   location:{origin:'https://puretv.local',pathname:'/tv.html',hash:''}};
 w.top=w;
 const sample=(revision,enabled,cancelSeq,held={},counts={})=>({revision,inputEnabled:enabled,players:[{
   connected:true,controllerId:'private-controller-id',session:'private-session',cancelSeq,
   buttons:Object.fromEntries(KEYS.map(k=>[k,!!held[k]])),buttonCounters:Object.fromEntries(KEYS.map(k=>[k,counts[k]||0]))}]});
 const native={get snapshot(){nativeReads++;return JSON.stringify({
   documentEpoch:2,diagnosticsEnabled:flag,info:{preferences:{secret:'never-log-preferences'},wifiController:{inputEnabled:false}},input:sample(4,false,4)});}};
 w.chrome={webview:{postMessage(){},hostObjects:{sync:{puretvBootstrap:native}}}};
 const bootstrap=fs.readFileSync(new URL('../Web/bootstrap.js',import.meta.url),'utf8');
 vm.runInNewContext(source+'\n'+bootstrap,{window:w,location:w.location});
 w.PureGame={suspend(value){suspends.push(value);}};
 return {w,sample,suspends,handlers,nativeReads:()=>nativeReads,
   emit:(where,name)=>{for(const fn of handlers[where].get(name)||[])fn();},
   receive:s=>w.JoystickDesktop.receive({wifiController:{inputEnabled:s.inputEnabled}},s),
   read:()=>JSON.parse(w.PureGameHost.snapshot()),logs:()=>w.JoystickDesktop.inputDiagnostics()};
}
test('document-start input diagnostics stay disabled unless the native flag is exactly true',()=>{
 for(const flag of [undefined,false,0,1,'true']){
  const x=diagnosticPage(flag);assert.equal(x.logs(),null);assert.equal(x.handlers.window.size,0);
  assert.equal(x.handlers.document.has('visibilitychange'),false);x.read();assert.equal(x.nativeReads(),1);
 }
 const x=diagnosticPage(true);assert.equal(x.logs().enabled,true);assert.equal(x.nativeReads(),1);
 assert.equal(x.handlers.window.get('blur').length,1);x.w.JoystickDesktop.enableInputDiagnostics();assert.equal(x.handlers.window.get('blur').length,1);
});
test('diagnostics preserve connected disabled seed to first active poll and do not consume taps',()=>{
 const x=diagnosticPage(true);assert.equal(x.read().connections,0);
 x.receive(x.sample(5,true,5));assert.equal(x.read().connections,1);
 x.receive(x.sample(6,true,5,{}, {A:1}));
 for(let i=0;i<20;i++)x.logs();assert.equal(x.read().players[0].buttons.A,true);assert.equal(x.read().players[0].buttons.A,false);
 const log=x.logs(),events=Array.from(log.events,e=>e.event);assert.deepEqual(events,['diagnostics_enabled','input_transition','suspend_called','first_poll','input_transition','first_active_poll']);
 const transitions=log.events.filter(e=>e.event==='input_transition');assert.equal(transitions[0].cancelSeq,4);assert.equal(transitions[0].inputEnabled,false);assert.equal(transitions[0].hasPureGame,false);
 assert.equal(transitions[1].cancelSeq,5);assert.equal(transitions[1].previousCancelSeq,4);assert.equal(transitions[1].sourceChanged,false);assert.equal(transitions[1].hasPureGame,true);
 assert.equal(x.suspends.length,0,'no new cancellation when enabling the first connected document');assert.equal(x.nativeReads(),1);
 assert.equal(x.logs().events.filter(e=>e.event==='first_active_poll').length,1);
});
test('blur and visibility observation is passive, bounded and contains no identity or storage',()=>{
 const x=diagnosticPage(true);for(let i=0;i<80;i++){x.w.document.hidden=!!(i%2);x.emit('document','visibilitychange');x.emit('window','blur');}
 const log=x.logs();assert.equal(log.events.length,64);assert.equal(log.discarded,log.total-64);
 assert.equal(log.events[0].sequence,log.total-63);assert.equal(log.events.at(-1).event,'window_blur');assert.equal(log.events.at(-1).documentEpoch,2);
 assert.equal(x.suspends.length,0);assert.equal(x.nativeReads(),1);
 const encoded=JSON.stringify(log);for(const secret of ['private-controller-id','private-session','never-log-preferences'])assert.equal(encoded.includes(secret),false);
 log.events[0].event='mutated';log.events.pop();assert.equal(x.logs().events.length,64);assert.notEqual(x.logs().events[0].event,'mutated');
});
test('observation exceptions never skip or duplicate the existing suspend hook',()=>{
 const x=diagnosticPage(true);x.receive(x.sample(5,true,5));x.read();x.w.document.hasFocus=()=>{throw new Error('secret diagnostic exception');};
 x.receive(x.sample(6,false,6));assert.deepEqual(x.suspends,[true]);assert.equal(x.read().connections,0);
 x.receive(x.sample(7,false,6));assert.deepEqual(x.suspends,[true]);x.w.JoystickDesktop.suspend();assert.deepEqual(x.suspends,[true,true]);
 assert.equal(x.logs().events.at(-1).observationFailed,true);assert.equal(JSON.stringify(x.logs()).includes('secret diagnostic exception'),false);
});
test('observation tracks cancellation and replacement without accepting stale revisions',()=>{
 const x=diagnosticPage(true);x.receive(x.sample(5,true,5));x.read();x.receive(x.sample(6,true,6));x.read();
 const replacement=x.sample(7,true,7);replacement.players[0].session='other-private-session';x.receive(replacement);x.read();
 const before=JSON.stringify(x.logs());assert.equal(x.receive(x.sample(2,false,2)),false);assert.equal(JSON.stringify(x.logs()),before);
 const transitions=x.logs().events.filter(e=>e.event==='input_transition');assert.equal(transitions.at(-2).sourceChanged,false);assert.equal(transitions.at(-2).cancelSeq,6);
 assert.equal(transitions.at(-1).sourceChanged,true);assert.equal(JSON.stringify(x.logs()).includes('other-private-session'),false);
});
test('diagnostics enabled and disabled preserve the same nine-key input and suspend results',()=>{
 const off=diagnosticPage(false),on=diagnosticPage(true);let revision=5,cancel=5,counts=Object.fromEntries(KEYS.map(k=>[k,0]));
 const compare=sample=>{off.receive(sample);on.receive(sample);on.logs();assert.deepEqual(on.read(),off.read());assert.deepEqual(on.suspends,off.suspends);};
 compare(off.sample(revision++,true,cancel));
 for(const key of KEYS){counts[key]++;compare(off.sample(revision++,true,cancel,{[key]:true},counts));compare(off.sample(revision++,false,++cancel,{},counts));compare(off.sample(revision++,true,++cancel,{},counts));}
 assert.equal(off.nativeReads(),1);assert.equal(on.nativeReads(),1);
});
test('actual diagnostics script reads the event cache without consuming native input',()=>{
 const x=diagnosticPage(true);x.receive(x.sample(5,true,5));x.receive(x.sample(6,true,5,{}, {Y:1}));
 Object.assign(x.w.document,{querySelectorAll:()=>[],getElementById:()=>null,title:'fixture',documentElement:{scrollWidth:1280,scrollHeight:720,lang:'en'}});
 const script=fs.readFileSync(new URL('../Web/diagnostics.js',import.meta.url),'utf8');
 for(let i=0;i<10;i++){
  const state=vm.runInNewContext(script,{window:x.w,document:x.w.document,location:x.w.location,innerWidth:1280,innerHeight:720,localStorage:{getItem:()=>null}});
  assert.equal(state.inputEvents.enabled,true);state.inputEvents.events.length=0;
 }
 assert.equal(x.logs().events.some(e=>e.event==='first_poll'),false);
 assert.equal(x.read().players[0].buttons.Y,true);assert.equal(x.read().players[0].buttons.Y,false);assert.equal(x.nativeReads(),1);
});
