// QA only: independent bounded search over the visible manifest and cargo stacks.
// Never imports the production model or writes browser/game state.
export const budgets = Object.freeze({maxWebGLDrawCalls:1,maxCanvasPaintCommands:0});
const need = (ok, message) => { if (!ok) throw Error(message); };
const copy = value => structuredClone(value);
const neutral = s => s.inputArmed && !s.cancelledLast && !s.lastHeld.a && !s.lastHeld.b && s.lastHeld.direction === 'none';
function observe(s) {
  need(Array.isArray(s.inbound) && Array.isArray(s.delivery) && s.bays?.length === 3, 'Visible inbound, manifest and three stacks required');
  need(s.inbound.length === s.delivery.length && s.bays.every(b=>Array.isArray(b)&&b.length<=s.capacity), 'Stack capacity invariant');
  const cargo=[...s.inbound.slice(s.inboundIndex),...s.bays.flat(),...(s.held===null?[]:[s.held]),...s.delivery.slice(0,s.nextDelivery)];
  need(cargo.length===s.inbound.length && new Set(cargo).size===cargo.length && cargo.every(c=>s.inbound.includes(c)), 'Cargo must be conserved exactly once');
  need(s.selected>=0&&s.selected<=3&&Number.isInteger(s.selected), 'Visible crane selection');
}
// Symmetric bay arrangements share a search key, but actual bay indices are
// retained in each node and emitted as ordinary selection + A commands.
function key(n) { return `${n.i}|${n.d}|${n.h}|${n.b.map(b=>b.join(',')).sort().join('/')}`; }
function clone(n) { return {i:n.i,d:n.d,h:n.h,b:n.b.map(b=>b.slice()),g:n.g,prev:n,action:null}; }
class Heap {
  constructor(){this.a=[];}
  push(n){const a=this.a;let i=a.length;a.push(n);while(i){const p=(i-1)>>1;if(a[p].f<=n.f)break;a[i]=a[p];i=p;}a[i]=n;}
  pop(){const a=this.a,r=a[0],n=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=n.f)break;a[i]=a[c];i=c;}a[i]=n;}return r;}
}
export function planVisible(s) {
  observe(s);
  const root={i:s.inboundIndex,d:s.nextDelivery,h:s.held,b:s.bays.map(b=>b.slice()),g:0,prev:null,action:null};
  const remaining=s.moveLimit-s.movesUsed, queue=new Heap(), best=new Map();let expanded=0;
  function enqueue(n){
    // Every queued or stacked crate still needs one pickup; held cargo does not.
    const h=s.inbound.length-n.i+n.b.reduce((a,b)=>a+b.length,0);
    if(n.g+h>remaining)return;
    const k=key(n);if(best.has(k)&&best.get(k)<=n.g)return;best.set(k,n.g);n.f=n.g+h;queue.push(n);
  }
  enqueue(root);
  while(queue.a.length){
    const n=queue.pop();if(best.get(key(n))<n.g)continue;
    need(++expanded<=250000,'Visible-state search exhausted its explicit 250000-node bound');
    if(n.d===s.delivery.length){const actions=[];for(let p=n;p.prev;p=p.prev)actions.push(p.action);return {actions:actions.reverse(),expanded,moves:n.g};}
    if(n.h===s.delivery[n.d]){const x=clone(n);x.h=null;x.d++;x.action={kind:'dispatch'};enqueue(x);continue;}
    if(n.h===null){
      if(n.i<s.inbound.length){const x=clone(n);x.h=s.inbound[x.i++];x.g++;x.action={kind:'a',bay:0};enqueue(x);}
      for(let b=0;b<3;b++)if(n.b[b].length){const x=clone(n);x.h=x.b[b].pop();x.g++;x.action={kind:'a',bay:b+1};enqueue(x);}
    } else {
      for(let b=0;b<3;b++)if(n.b[b].length<s.capacity){const x=clone(n);x.b[b].push(x.h);x.h=null;x.g++;x.action={kind:'a',bay:b+1};enqueue(x);}
    }
  }
  throw Error('Current visible cargo cannot satisfy manifest within remaining moves');
}
export function createPilot({policy='solve'}={}) {
  need(['solve','mistakes','moves'].includes(policy),'Unknown pilot policy');
  let identity=null,lastCalls=-1,route=[],pending=null,issued=[],acknowledged=[],searches=[];
  function reset(s){identity=`${s.seed}:${s.level}`;lastCalls=s.calls;route=[];pending=null;issued=[];acknowledged=[];searches=[];}
  function issue(s,key,intent){pending={key,intent,call:s.calls,selected:s.selected,moves:s.movesUsed,delivered:s.nextDelivery,mistakes:s.mistakes,held:s.held,bays:copy(s.bays),inbound:s.inboundIndex};issued.push(copy(pending));return [key];}
  function acknowledge(s){
    const p=pending;let accepted=false;
    if(p.key==='Space') accepted=s.movesUsed===p.moves+1;
    else if(p.key==='b')accepted=s.nextDelivery===p.delivered+1||s.mistakes===p.mistakes+1;
    else accepted=s.selected!==p.selected;
    if(!accepted){need(s.phase==='playing'&&s.calls-p.call<90,'Ordinary input did not receive expected acknowledgment');return [p.key];}
    if(p.key==='Space'){
      if(p.selected===0)need(s.held===s.inbound[p.inbound]&&s.inboundIndex===p.inbound+1,'Inbound A must take exactly the next cargo');
      else if(p.held===null)need(s.held===p.bays[p.selected-1].at(-1)&&s.bays[p.selected-1].length===p.bays[p.selected-1].length-1,'Bay pickup must obey LIFO');
      else need(s.bays[p.selected-1].at(-1)===p.held&&s.held===null,'Bay place must append the held cargo to the top');
    }
    if(p.key==='b'&&s.nextDelivery===p.delivered+1)need(p.held===s.delivery[p.delivered]&&s.held===null,'Dispatch must consume only the required cargo');
    acknowledged.push({key:p.key,call:s.calls,held:s.held,delivered:s.nextDelivery,moves:s.movesUsed,selected:s.selected});
    if(p.intent==='route')route.shift();pending=null;return [];
  }
  const pilot=snapshot=>{
    const s=snapshot?.model;if(!s||snapshot.paused)return [];
    if(identity!==`${s.seed}:${s.level}`||s.calls<lastCalls)reset(s);lastCalls=s.calls;observe(s);
    if(pending)return acknowledge(s);
    if(snapshot.phase!=='playing'||s.phase!=='playing'||!neutral(s))return [];
    if(policy==='mistakes'){
      if(s.held===null){need(s.selected===0&&s.inboundIndex===0,'Mistake scenario begins at inbound');return issue(s,'Space','wrong-cargo');}
      need(s.held!==s.delivery[s.nextDelivery],'Mistake scenario retains visibly wrong cargo');return issue(s,'b','wrong-dispatch');
    }
    if(policy==='moves'){
      if(s.movesUsed===0)return issue(s,'Space','take-first');
      if(s.selected!==1)return issue(s,'ArrowRight','choose-bay');
      return issue(s,'Space','rehandle');
    }
    if(!route.length){const result=planVisible(s);route=result.actions;searches.push({call:s.calls,expanded:result.expanded,moves:result.moves});}
    const action=route[0];need(action,'Unfinished manifest requires a next ordinary action');
    if(action.kind==='dispatch')return issue(s,'b','route');
    if(s.selected!==action.bay){const right=(action.bay-s.selected+4)%4;return issue(s,right<=2?'ArrowRight':'ArrowLeft','select');}
    return issue(s,'Space','route');
  };
  pilot.diagnostics=()=>copy({policy,issued,acknowledged,searches,pending,remainingRoute:route});return pilot;
}
let pilot=createPilot(),lastMode=null,terminalAt=null,menuRelease=false;
export function keys(snapshot,meta={}){
  if(lastMode!==meta.mode){pilot=createPilot();lastMode=meta.mode;terminalAt=null;menuRelease=false;}
  if(meta.mode==='record'&&snapshot.phase==='won'){
    // Real result-menu input, with a visible pause before the next shift.
    if(snapshot.model.level===2)return [];
    if(terminalAt===null)terminalAt=meta.elapsed;
    if(meta.elapsed-terminalAt<1.2)return [];
    if(menuRelease){menuRelease=false;return [];}
    menuRelease=true;
    return [snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
  }
  terminalAt=null;menuRelease=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){
  const s=after.model;assert.equal(after.phase,'won');assert.equal(s.phase,'won');assert.equal(s.score,100);
  assert.equal(s.nextDelivery,s.delivery.length);assert.equal(s.inboundIndex,s.inbound.length);assert.equal(s.held,null);
  assert.ok(s.bays.every(b=>!b.length));assert.equal(s.mistakes,0);assert.ok(s.movesUsed<=s.moveLimit&&s.movesUsed>before.model.movesUsed);
  assert.ok(trace.some(t=>t.state.model.bays.some(b=>b.length>0)),'Ordinary flow actually stored cargo');
  assert.ok(trace.some(t=>t.state.model.held!==null),'Ordinary flow actually used the crane');
}
export function assertRetry({after,initial},assert){
  const s=after.model,f=initial.model;
  for(const k of ['phase','selected','inboundIndex','bays','held','nextDelivery','movesUsed','moveLimit','mistakes','delivery','inbound','capacity','score'])assert.deepEqual(s[k],f[k],'Fresh retry restores '+k);
}
