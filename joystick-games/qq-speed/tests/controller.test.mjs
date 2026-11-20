import test from 'node:test';
import assert from 'node:assert/strict';
import { drivingInput, cancelDrift, PAD_KEYS } from '../src/controller.js';
import { PlayerCar } from '../src/vehicle.js';
import { MAPS, MODES } from '../src/maps.js';
import { LAYOUTS } from '../src/layouts.js';
import { Track } from '../src/track.js';
import { Input } from '../src/input.js';

test('four original maps and both modes remain selectable', () => {
 assert.deepEqual(MAPS.map(m=>m.id),['city','aegean','egypt','snow']);
 assert.deepEqual(MODES.map(m=>m.id),['speed','item']);
 for(const m of MAPS) assert.ok(LAYOUTS[m.layout]);
});
test('nine independent keys preserve source actions without A/X aliases', () => {
 const expectations={UP:'up',DOWN:'down',LEFT:'left',RIGHT:'right',A:'shift',B:'nitroPressed',X:'wPressed',Y:'resetPressed'};
 for(const key of PAD_KEYS){const input=drivingInput({buttons:{[key]:true},pressed:{[key]:true}});
  for(const [other,field] of Object.entries(expectations)) assert.equal(input[field],other===key,`${key} -> ${field}`);
 }
 assert.equal(drivingInput({buttons:{B:true}}).nitroPressed,false);
 assert.equal(drivingInput({buttons:{X:true}}).wPressed,false);
});
test('cancellation ends drift without awarding a release boost', () => {
 const p=Object.create(PlayerCar.prototype);Object.assign(p,{drifting:true,driftTime:1,smallWindow:0,emit(){}});
 cancelDrift(p);assert.equal(p.drifting,false);assert.equal(p.smallWindow,0);
 p.drifting=true;p.endDrift(true);assert.ok(p.smallWindow>0);cancelDrift(p);assert.equal(p.smallWindow,0);
});
test('focus loss clears queued keyboard and touch actions',()=>{
 const listeners={};globalThis.window={addEventListener(n,f){listeners[n]=f;}};
 const input=new Input();input.down.add('ArrowUp');input.pressed.add('KeyW');input.touchPressed.add('TouchNitro');input.touch.shift=true;
 listeners.blur();assert.ok(Object.values(input.frame()).every(v=>!v));delete globalThis.window;
});
test('gamepad directional and action taps merge once with the keyboard',()=>{
 globalThis.window={addEventListener(){}};const input=new Input();input.down.add('ArrowUp');
 const first=input.frame({buttons:{LEFT:true,A:true},pressed:{B:true,X:true}});
 assert.equal(first.up,true);assert.equal(first.left,true);assert.equal(first.right,false);assert.equal(first.shift,true);assert.equal(first.nitroPressed,true);assert.equal(first.wPressed,true);
 const second=input.frame({buttons:{},pressed:{}});assert.equal(second.up,true);assert.equal(second.nitroPressed,false);assert.equal(second.wPressed,false);delete globalThis.window;
});
test('original vehicle turns opposite headings for left and right mapped controls',()=>{
 const track=new Track(LAYOUTS.city,{});
 const create=()=>{const p=new PlayerCar(track,null,'test');p.s=25;return p;};
 const a=create(),b=create(),initial=a.h;
 for(let i=0;i<12;i++) {a.update(1/120,drivingInput({buttons:{UP:true,LEFT:true}}),true,false);b.update(1/120,drivingInput({buttons:{UP:true,RIGHT:true}}),true,false);}
 assert.ok(a.h>initial);assert.ok(b.h<initial);
 assert.notEqual(a.x,b.x);
});
