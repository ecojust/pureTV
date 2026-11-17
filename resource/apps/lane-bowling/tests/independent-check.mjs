import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {physics,startShot,tick,simulateShot,findRoute} from './reference.mjs';
let presses=0,comparedTicks=0;
for(const[k,v]of Object.entries(physics))assert.deepEqual(model.config[k],v,'Published physics constant '+k);
function close(actual,expected,label='value'){if(typeof expected==='number'){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-7,`${label}: ${actual} vs ${expected}`);}else if(expected===null||typeof expected!=='object')assert.equal(actual,expected,label);else if(Array.isArray(expected)){assert.equal(actual.length,expected.length,label);expected.forEach((v,i)=>close(actual[i],v,`${label}[${i}]`));}else for(const[k,v]of Object.entries(expected))close(actual[k],v,label+'.'+k);}
function press(s,input){presses++;model.step(s,physics.tick,{});model.step(s,physics.tick,input);}
function aim(s,angle,power){while(s.angle!==angle)press(s,{x:s.angle<angle?1:-1});while(s.power!==power)press(s,{y:s.power<power?-1:1});}
function compare(s,r){for(const k of ['ball','pins','shotTicks','quietTicks','shotExit','shotGutter','shotBallHits','shotPinHits','totalBallHits','totalPinHits','fallReceipts'])close(s[k],r[k],k);assert.equal(s.fallenCount,r.pins.filter(p=>p.fallen).length);if(r.ended)for(const k of ['lastShot','phase','reason','score','standingCount','fallenCount','shotsRemaining'])close(s[k],r[k],k);comparedTicks++;}
function shoot(s,angle,power,{everyTick=false,dt=physics.tick}={}){aim(s,angle,power);const reference=startShot(s,angle,power);press(s,{a:true});tick(reference);if(everyTick)compare(s,reference);while(s.stage==='rolling'){model.step(s,dt,{});if(everyTick){tick(reference);compare(s,reference);}}if(!everyTick){while(!reference.ended)tick(reference);compare(s,reference);}return reference;}
const layouts=[];
for(let level=0;level<3;level++){
 const s=model.create(792,level),proof=findRoute(s);for(const command of proof.route)shoot(s,command.angle,command.power,{everyTick:true});assert.equal(s.phase,'won');assert.equal(s.fallReceipts.length,s.totalPins);assert.ok(s.totalBallHits>0&&s.totalPinHits>0);for(const f of s.fallReceipts)assert.ok(f.source==='displacement'?f.displacement>=physics.fallDistance:f.speed>=physics.fallSpeed);
 const frozen=JSON.stringify(s);model.step(s,.1,{a:true});assert.equal(JSON.stringify(s),frozen);
 const lose=model.create(792,level);while(lose.phase==='playing')shoot(lose,24,3);assert.equal(lose.phase,'lost');assert.equal(lose.fallenCount,0);assert.equal(lose.shotsUsed,lose.shotLimit);assert.ok(lose.shotHistory.every(r=>r.gutter&&r.ballHits===0));
 const final=model.create(792,level);for(let i=0;i<final.shotLimit-proof.route.length;i++)shoot(final,24,3);for(const command of proof.route)shoot(final,command.angle,command.power);assert.equal(final.phase,'won');assert.equal(final.shotsUsed,final.shotLimit);
 layouts.push({level,independentSearchSimulations:proof.shotsSimulated,route:proof.route.map(x=>({angle:x.angle,power:x.power,newlyFallen:x.expected.lastShot.newlyFallen.length,ticks:x.expected.shotTicks})),ordinaryWinShots:s.shotsUsed,ballImpacts:s.totalBallHits,pinChainImpacts:s.totalPinHits,allFallsHavePhysicalReceipts:true,naturalGutterBudgetLoss:true,ordinaryFinalAllowedThrowWin:true});
}
// Complete public aiming lattice: each real throw starts from an ordinary fresh round.
let latticeShots=0;for(let level=0;level<3;level++)for(let angle=physics.angleMin;angle<=physics.angleMax;angle+=physics.angleStep)for(let power=0;power<physics.speeds.length;power++){shoot(model.create(792,level),angle,power,{dt:.25});latticeShots++;}
const slow=model.create(792,2),chunked=model.create(792,2);shoot(slow,-3,3);shoot(chunked,-3,3,{dt:.25});for(const k of ['pins','lastShot','fallReceipts','shotTicks','phase','fallenCount'])close(slow[k],chunked[k],k);
console.log(JSON.stringify({passed:true,method:'Independent fixed-substep friction, inverse-mass circle contacts, impulse/position fall receipts and shot settlement; separate bounded public-state aim search; normal keyboard-shaped inputs only. Live ticks compared at1e-7 tolerance, all204 public first-throw choices compared to independent physics, no aim-to-award mapping.',layouts,latticeShots,comparedTicks,ordinaryPresses:presses,dtPartitionEquivalent:true,physicalTvTested:false,physicalPhoneTested:false},null,2));
