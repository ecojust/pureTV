import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../Web/bridge.js',import.meta.url),'utf8');
const KEYS=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
function setup(){
 const events=[];const w={document:{addEventListener(){}},PureGame:{suspend(){events.push('suspend')}},webkit:{messageHandlers:{joystickHost:{postMessage(){}}}}};
 vm.runInNewContext(source,{window:w});
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
