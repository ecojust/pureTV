// Test-only planning from public jug volumes. No production-model import/state writes.
export const budgets=Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need=(ok,message)=>{if(!ok)throw Error(message);};
const copy=x=>structuredClone(x);
export function routeVolumes(capacities,initial,target){
 const queue=[{v:initial.slice(),route:[]}],seen=new Set([initial.join(',')]);
 for(let head=0;head<queue.length;head++){
  const n=queue[head];if(n.v.every((v,i)=>v===target[i]))return {route:n.route,visited:seen.size};
  for(let from=0;from<3;from++)for(let to=0;to<3;to++)if(from!==to){
   const amount=Math.min(n.v[from],capacities[to]-n.v[to]);if(amount<=0)continue;
   const v=n.v.slice();v[from]-=amount;v[to]+=amount;const key=v.join(',');
   if(!seen.has(key)){seen.add(key);queue.push({v,route:[...n.route,{from,to,amount,volumes:v.slice()}]});}
  }
 }
 throw Error('Public target is unreachable by maximal pours');
}
export function neutral(s){return s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';}
export function observe(s){
 need(s.volumes.length===3&&s.capacities.length===3&&s.target.length===3,'Three visible jugs');
 need(s.volumes.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=s.capacities[i]),'Integer volumes bounded by capacity');
 need(s.volumes.reduce((a,b)=>a+b,0)===s.target.reduce((a,b)=>a+b,0),'Water conserved');
 need(Number.isInteger(s.selected)&&s.selected>=0&&s.selected<3,'Valid jug cursor');
}
export function createPilot({policy='solve'}={}){
 let identity=null,lastCalls=-1,route=[],pending=null,searches=[],acknowledged=[];
 const pilot=q=>{
  const s=q?.model;if(!s||q.paused)return [];
  const id=`${s.seed}:${s.level}`;if(identity!==id||s.calls<lastCalls){identity=id;route=[];pending=null;searches=[];acknowledged=[];}lastCalls=s.calls;observe(s);
  if(pending){
   const p=pending;let done=p.key==='Space'?(s.source!==p.source||s.poursUsed!==p.pours):s.selected!==p.selected;
   if(!done){need(s.phase==='playing'&&s.calls-p.call<120,'Ordinary jug command needs acknowledgment');return [p.key];}
   if(s.poursUsed!==p.pours){
    const amount=Math.min(p.volumes[p.source],s.capacities[p.selected]-p.volumes[p.selected]),expected=p.volumes.slice();expected[p.source]-=amount;expected[p.selected]+=amount;
    need(amount>0&&s.volumes.every((v,i)=>v===expected[i]),'Ordinary pour must transfer maximal conserved integer volume');
    need(s.poursUsed===p.pours+1&&s.source===null,'One pour charged and source released');if(policy==='solve')route.shift();
   }
   acknowledged.push({key:p.key,call:s.calls,volumes:s.volumes.slice(),pours:s.poursUsed,selected:s.selected,source:s.source});pending=null;return [];
  }
  if(q.phase!=='playing'||s.phase!=='playing'||!neutral(s))return [];
  if(!route.length){
   if(policy==='solve'){const found=routeVolumes(s.capacities,s.volumes,s.target);route=found.route;searches.push({call:s.calls,minimumPours:route.length,visited:found.visited});need(route.length<=s.pourLimit-s.poursUsed,'Visible solution within remaining pour budget');}
   else {need(policy==='exhaust','Known pilot policy');const from=s.volumes[1]>0?1:0,to=from===0?1:0;route=[{from,to}];}
  }
  const action=route[0],wanted=s.source===null?action.from:action.to;
  let key;if(s.selected!==wanted)key=(wanted-s.selected+3)%3===1?'ArrowRight':'ArrowLeft';else key='Space';
  pending={key,call:s.calls,source:s.source,selected:s.selected,pours:s.poursUsed,volumes:s.volumes.slice()};
  if(policy==='exhaust'&&s.source!==null&&key==='Space')route=[];
  return [key];
 };
 pilot.diagnostics=()=>copy({policy,searches,acknowledged,pending,route});return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,menuRelease=false;
export function keys(q,meta={}){
 if(mode!==meta.mode){mode=meta.mode;pilot=createPilot();terminalAt=null;menuRelease=false;}
 if(meta.mode==='record'&&q.phase==='won'){
  if(q.model.level===2)return [];
  if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return [];
  if(menuRelease){menuRelease=false;return [];}menuRelease=true;
  return [q.level===q.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;menuRelease=false;return pilot(q);
}
export function assertProgress({before,after,trace},assert){
 const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.deepEqual(s.volumes,s.target);
 assert.ok(s.poursUsed>before.model.poursUsed&&s.poursUsed<=s.pourLimit);
 assert.ok(trace.some(t=>t.state.model.source!==null),'Ordinary flow chooses an actual source');
 for(const t of trace)observe(t.state.model);
}
export function assertRetry({after,initial},assert){
 for(const k of ['phase','selected','source','volumes','capacities','target','pourLimit','poursUsed','score'])assert.deepEqual(after.model[k],initial.model[k],'Retry restores '+k);
}
