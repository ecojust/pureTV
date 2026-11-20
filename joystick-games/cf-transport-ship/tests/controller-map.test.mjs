import test from 'node:test';
import assert from 'node:assert/strict';
import { mapController, neutral } from '../src/controller-map.js';
const frame = (buttons = {}, pressed = {}, extra = {}) => ({ connected: true, buttons, pressed, ...extra });
test('turn directions follow Three camera yaw, up moves forward', () => {
  assert.ok(mapController(frame({LEFT:true}), .05).yawDelta > 0);
  assert.ok(mapController(frame({RIGHT:true}), .05).yawDelta < 0);
  assert.equal(mapController(frame({UP:true}), .05).forward, 1);
  assert.equal(mapController(frame({DOWN:true}), .05).forward, -1);
});
test('fine aim is independent from movement and can fire simultaneously', () => {
  const a=mapController(frame({B:true,UP:true,LEFT:true,A:true},{A:true}),.05);
  assert.ok(a.pitchDelta > 0);assert.ok(a.yawDelta > 0);assert.equal(a.forward,0);assert.equal(a.strafe,0);assert.equal(a.fire,true);assert.equal(a.firePressed,true);
});
test('X/Y physical buttons and modifier chords remain separate', () => {
  const a=mapController(frame({X:true,Y:true},{X:true,Y:true}),.05);assert.equal(a.reload,true);assert.equal(a.jump,true);assert.equal(a.fire,false);assert.equal(a.cycle,false);
  const b=mapController(frame({B:true,X:true,Y:true},{X:true,Y:true}),.05);assert.equal(b.cycle,true);assert.equal(b.altPressed,true);assert.equal(b.reload,false);assert.equal(b.jump,false);
});
test('held chords do not repeat one-shot weapon or scope actions', () => {
  const a=mapController(frame({B:true,X:true,Y:true}),.05);assert.equal(a.cycle,false);assert.equal(a.altPressed,false);
});
test('cancellation clears held fire; native remote works without Wi-Fi', () => {
  assert.deepEqual(mapController(frame({A:true,UP:true,B:true},{X:true},{cancelled:true}),.05),neutral());
  assert.equal(mapController(frame({UP:true},{},{connected:false,native:true}),.05).forward,1);
  assert.deepEqual(mapController(frame({},{},{connected:false}),.05),neutral());
});
test('strafe mode retains B turn and crouch supports crouch jump', () => {
  const a=mapController(frame({RIGHT:true,Y:true}),.05,{strafe:true,crouch:true});assert.equal(a.strafe,1);assert.equal(a.yawDelta,0);assert.equal(a.crouch,true);assert.equal(a.jump,true);
  assert.ok(mapController(frame({B:true,RIGHT:true}),.05,{strafe:true}).yawDelta<0);
});
test('turn delta is capped on a stalled frame', () => {
  assert.equal(mapController(frame({RIGHT:true}),5).yawDelta,mapController(frame({RIGHT:true}),.1).yawDelta);
});
