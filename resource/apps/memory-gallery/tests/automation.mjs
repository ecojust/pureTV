// QA remembers only faces observed during the ordinary visible preview.
// Never imports the model, predicts a seed, or reads hidden/private deck data.
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export function memorizePreview(s){
 need(s.stage==='preview'&&s.visibleFaces.length===s.width*s.height&&s.visibleFaces.every(Number.isInteger),'A full visible preview is required');
 const faces=s.visibleFaces.slice();for(let symbol=1;symbol<=s.pairCount;symbol++)need(faces.filter(x=>x===symbol).length===2,'Every visible symbol must occur twice');return faces;
}
export function createPilot(){
 let level=null,lastCalls=-1,memory=null,pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return[];
  if(level!==s.level||s.calls<lastCalls){level=s.level;memory=null;pending=null;log=[];}lastCalls=s.calls;
  if(snapshot.phase==='playing'&&s.stage==='preview'){if(!memory)memory=memorizePreview(s);return[];}
  if(pending){const changed=pending.kind==='move'?s.cursor!==pending.cursor:s.flips===pending.flips+1;
   if(!changed){need(s.calls-pending.call<120,'Normal memory input was not acknowledged');return[pending.key];}
   if(pending.kind==='flip'){
    need(s.visibleFaces[pending.cursor]===memory[pending.cursor],'Revealed face must equal previously observed preview');
    if(pending.first!==null)need(s.matchedPairs===pending.matchedPairs+1&&s.locked[pending.first]&&s.locked[pending.cursor],'The two remembered equal faces must lock as a pair');
   }
   log.push({key:pending.key,call:s.calls,cursor:s.cursor,flips:s.flips,matchedPairs:s.matchedPairs});pending=null;return[];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing')return[];
  need(memory!==null,'Preview was missed; do not reconstruct hidden faces');need(s.stage==='choosing','Remembered matching pairs should never enter mismatch comparison');
  if(!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return[];
  const target=s.first===null?s.locked.findIndex(x=>!x):memory.findIndex((face,i)=>i!==s.first&&face===memory[s.first]);need(target>=0,'Unfinished gallery requires an unlocked card');
  const x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),tx=target%s.width,ty=Math.floor(target/s.width);let key,kind;
  if(x!==tx){key=x<tx?'ArrowRight':'ArrowLeft';kind='move';}else if(y!==ty){key=y<ty?'ArrowDown':'ArrowUp';kind='move';}else{key='Space';kind='flip';}
  pending={key,kind,cursor:s.cursor,call:s.calls,flips:s.flips,first:s.first,matchedPairs:s.matchedPairs};return[key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
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
export function assertProgress({before,after,trace},assert){const s=after.model;assert.equal(after.phase,'won');assert.equal(s.score,100);assert.equal(s.matchedPairs,s.pairCount);assert.ok(s.locked.every(Boolean));assert.equal(s.mistakes,0);assert.equal(s.flips,s.pairCount*2);assert.ok(s.flips>before.model.flips);
 assert.ok(trace.some(t=>t.state.model.stage==='preview'&&t.state.model.visibleFaces.every(Number.isInteger)),'Pilot actually observed the visible preview');
 assert.ok(trace.some(t=>t.state.model.stage==='choosing'&&t.state.model.visibleFaces.some(v=>v===null)),'Cards really became hidden before remembered input');
}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','stage','visibleFaces','locked','cursor','first','second','matchedPairs','mistakes','flips','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
