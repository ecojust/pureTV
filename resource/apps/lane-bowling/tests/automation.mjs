// Public-state physical planning, ordinary keys and real active time only.
import {findRoute,simulateShot,physics} from './reference.mjs';
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function near(actual,expected,label='value'){if(typeof expected==='number')need(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-6,label+' differs from independent physics');else if(expected===null||typeof expected!=='object')need(actual===expected,label+' differs');else if(Array.isArray(expected)){need(actual.length===expected.length,label+' length differs');expected.forEach((v,i)=>near(actual[i],v,label+'['+i+']'));}else for(const[k,v]of Object.entries(expected))near(actual[k],v,label+'.'+k);}
export function createPilot({lose=false}={}){
 let level=null,lastCalls=-1,route=[],pending=null,rolling=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;rolling=null;log=[];}lastCalls=s.calls;
  if(pending){if(s[pending.field]===pending.before){if(!s.inputArmed||s.cancelledLast||s.cancelEpoch!==pending.cancelEpoch){pending=null;return[];}need(s.calls-pending.call<120,'Ordinary bowling input was not acknowledged');return[pending.key];}if(pending.field==='shotsUsed'){need(s.shotsUsed===pending.before+1,'A spends exactly one throw');rolling=pending.expected;}log.push({key:pending.key,call:s.calls,shotsUsed:s.shotsUsed,angle:s.angle,power:s.power});pending=null;return[];}
  if(rolling){if(s.stage==='rolling')return[];for(const k of ['pins','lastShot','fallReceipts','phase','reason','standingCount','fallenCount'])near(s[k],rolling[k],k);log.push({shotEnded:s.shotsUsed,receipt:s.lastShot});rolling=null;route.shift();return[];}
  if(snapshot.phase!=='playing'||s.phase!=='playing'||s.stage!=='aiming'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  if(!route.length)route=lose?[{angle:24,power:3,expected:simulateShot(s,24,3)}]:findRoute(s).route;
  const target=route[0];let key,field;if(s.angle!==target.angle){key=s.angle<target.angle?'ArrowRight':'ArrowLeft';field='angle';}else if(s.power!==target.power){key=s.power<target.power?'ArrowUp':'ArrowDown';field='power';}else{key='Space';field='shotsUsed';}
  pending={key,field,before:s[field],call:s.calls,expected:target.expected,cancelEpoch:s.cancelEpoch};return[key];
 };pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot();mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return[];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return[];
  if(release){release=false;return[];}release=true;return[snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.reason,'cleared');assert.equal(s.score,100);assert.equal(s.standingCount,0);assert.equal(s.fallReceipts.length,s.totalPins);assert.ok(s.totalBallHits>0&&s.totalPinHits>0);assert.ok(s.shotsUsed<=s.shotLimit);assert.ok(trace.some(t=>t.state.model.stage==='rolling'));let reference=before.model;for(const shot of s.shotHistory.filter(r=>r.shot>reference.shotsUsed)){reference=simulateShot(reference,shot.angle,shot.power);near(shot,reference.lastShot,'shot receipt');}near(s.pins,reference.pins,'final public bodies');for(const f of s.fallReceipts)assert.ok(f.source==='displacement'?f.displacement>=physics.fallDistance:f.speed>=physics.fallSpeed);}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','stage','pins','ball','angle','power','shotsUsed','shotTicks','physicsRemainder','fallenCount','standingCount','shotHistory','fallReceipts','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
