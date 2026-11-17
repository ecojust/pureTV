// Public graph planning and actual input acknowledgements only. No Model import or tick rollout.
export const budgets = { maxWebGLDrawCalls: 1 };
export const lossPolicies = ['enter-closed-gate', 'wait-out-budget', 'enter-trap'];
export const lossReasons = ['closed_gate', 'beat_budget', 'trap'];
const need = (ok, message) => { if (!ok) throw Error(message); };
const clone = value => structuredClone(value);
const moves = [['up',0,-1],['right',1,0],['down',0,1],['left',-1,0],['wait',0,0]];
const keyFor = kind => ({up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft',wait:'Space'})[kind];
const pointKey = (x,y) => `${x},${y}`;
const stateKey = (x,y,mask,beat) => `${x},${y}:${mask}:${beat%6}`;
function shape(m) {
  need(m?.physics?.ticksPerSecond===60 && m.physics.ticksPerBeat===72 && m.physics.queueCapacity===6,'Public Metronome Gates rules required');
  need(Number.isSafeInteger(m.tick) && Number.isSafeInteger(m.beatNo) && Array.isArray(m.queue),'Actual tick, beat and queue required');
  need(Array.isArray(m.queueReceipts) && Array.isArray(m.beatReceipts),'Both permanent public banks required');
}
function markerMask(m) { return m.scenario.markers.reduce((mask,row,i)=>mask|(m.collectedMarkerIds.includes(row.id)?1<<i:0),0); }
function signature(m) { return stateKey(m.player.x,m.player.y,markerMask(m),m.beatNo); }
// BFS keeps the earliest depth for each (cell, marker mask, beat modulo 6). A later
// arrival at the same state costs another six beats and cannot improve the remaining budget.
export function planVisibleState(m, policy='normal', {maxNodes=40000,maxMilliseconds=1000}={}) {
  shape(m);need(policy==='normal'||lossPolicies.includes(policy),'Unknown public planning objective');
  if(policy==='wait-out-budget')return {path:[{key:signature(m),action:'wait',remainingSteps:1}],expanded:0,visited:1,elapsedMilliseconds:0};
  const started=performance.now(),s=m.scenario,all=(1<<s.markers.length)-1;
  need(s.markers.length<=12 && s.gates.every(g=>[2,3].includes(g.period)),'Bounded public mask and period-6 graph required');
  const markerAt=new Map(s.markers.map((row,i)=>[pointKey(row.x,row.y),1<<i])),gateAt=new Map(s.gates.map(g=>[pointKey(g.x,g.y),g]));
  const nodes=[{x:m.player.x,y:m.player.y,mask:markerMask(m),depth:0,parent:-1,action:null}],seen=new Set([signature(m)]);
  let head=0,goal=-1;
  search:while(head<nodes.length){
    need(head<maxNodes && nodes.length<=maxNodes,'Public graph node bound reached');
    need(performance.now()-started<=maxMilliseconds,'Public graph time bound reached; preserve failure without alternate search');
    const n=nodes[head],parent=head++;if(n.depth>=m.beatsRemaining)continue;
    for(const [action,dx,dy] of moves){
      const x=n.x+dx,y=n.y+dy,cell=s.grid[y]?.[x];if(cell===undefined||cell==='#')continue;
      const depth=n.depth+1,beat=m.beatNo+depth,gate=action==='wait'?null:gateAt.get(pointKey(x,y));
      const closed=!!gate&&!gate.openResidues.includes(beat%gate.period),trap=action!=='wait'&&cell==='X';
      const fatalGoal=(policy==='enter-closed-gate'&&closed)||(policy==='enter-trap'&&!closed&&trap);
      if((closed||trap)&&!fatalGoal)continue;
      // Closed-gate loss stays at the origin; trap loss actually reaches the target.
      const nextX=closed?n.x:x,nextY=closed?n.y:y,mask=closed||trap?n.mask:n.mask|(markerAt.get(pointKey(x,y))||0);
      const won=!closed&&!trap&&mask===all&&x===s.exit.x&&y===s.exit.y;
      if(won&&policy!=='normal')continue;
      const key=stateKey(nextX,nextY,mask,beat),child={x:nextX,y:nextY,mask,depth,parent,action};
      if(fatalGoal||(policy==='normal'&&won)){nodes.push(child);goal=nodes.length-1;break search;}
      if(!seen.has(key)){need(nodes.length<maxNodes,'Public graph node bound reached');seen.add(key);nodes.push(child);}
    }
  }
  need(goal>=0,'No public plan within the actual remaining beat budget');
  const reverse=[];for(let at=goal;nodes[at].parent>=0;at=nodes[at].parent){const child=nodes[at],p=nodes[child.parent];reverse.push({key:stateKey(p.x,p.y,p.mask,m.beatNo+p.depth),action:child.action});}
  const path=reverse.reverse().map((row,i)=>({...row,remainingSteps:reverse.length-i}));
  return {path,expanded:head,visited:nodes.length,elapsedMilliseconds:performance.now()-started};
}
export function createPilot({mode='record',policy=mode==='loss'?lossPolicies[0]:'normal'}={}) {
  need(policy==='normal'||lossPolicies.includes(policy),'Unknown gate input policy');
  let identity=null,lastTick=-1,primed=false,pending=null,needsNeutral=true,cache=new Map(),stats={};
  function reset(m){identity=`${m.seed}:${m.level}`;lastTick=m.tick;primed=false;pending=null;needsNeutral=true;cache=new Map();stats={plans:[],issued:[],acknowledged:[],cancellations:[]};}
  function choose(m){
    const key=signature(m);if(!cache.has(key)){
      const result=planVisibleState(m,policy);for(const row of result.path)cache.set(row.key,{action:row.action,remainingSteps:row.remainingSteps});
      stats.plans.push({observedTick:m.tick,observedBeatNo:m.beatNo,actualBeatsRemaining:m.beatsRemaining,...result,scope:'Public graph hypothesis, not observed future input/state.'});
    }
    const next=cache.get(key);need(next.remainingSteps<=m.beatsRemaining,'Public cached plan exceeds actual remaining budget');return next.action;
  }
  function prime(state){const m=state?.model;shape(m);need(m.tick===0&&!m.queue.length&&!m.queueReceipts.length&&!m.beatReceipts.length,'Prime requires untouched actual public initial state');
    reset(m);choose(m);primed=true;return {level:m.level,modelSteps:0,searches:stats.plans.length,expanded:stats.plans.reduce((n,r)=>n+r.expanded,0),scope:'Bounded public graph preparation only; routes remain solely in pilot diagnostics.'};}
  function acknowledge(m){
    if(!pending)return;
    if(!pending.acknowledged){
      const r=m.queueReceipts.find(r=>r.source===pending.source&&r.edgeOrdinal>pending.beforeOrdinal);
      if(!r)return;need(r.operation==='enqueue'&&r.result==='enqueued'&&r.command.kind===pending.kind,'Actual enqueue did not match the issued command');
      need(r.beatNo===pending.observedBeatNo,'Input arrived after its planned next-beat boundary; preserve actual evidence');
      pending.acknowledged=true;pending.receipt=clone(r);stats.acknowledged.push({kind:'actual-enqueue',observedTick:m.tick,receipt:clone(r)});
    }
    if(!pending.consumed){
      const r=m.beatReceipts.find(r=>r.command?.id===pending.receipt.command.id);
      if(r){need(r.command.kind===pending.kind&&r.action===pending.kind&&r.beatNo===pending.observedBeatNo+1,'Actual consumed command must match its issued ID/kind and following beat');
        pending.consumed=true;stats.acknowledged.push({kind:'actual-command-consumed',observedTick:m.tick,receipt:clone(r)});}
    }
  }
  function pilot(state){
    const m=state?.model;if(!m)return [];if(identity!==`${m.seed}:${m.level}`||m.tick<lastTick)reset(m);lastTick=m.tick;
    if(primed)acknowledge(m);if(m.phase!=='playing'||state.phase!=='playing'||state.paused)return [];
    shape(m);need(primed,'Prime from the actual initial/menu snapshot before play');
    if(m.inputState.quarantined||m.lastInput?.raw.cancelled){if(pending)stats.cancellations.push({tick:m.tick,pending:clone(pending)});pending=null;needsNeutral=true;return [];}
    const neutral=m.lastInput?.fullNeutral&&m.inputState.directionArmed&&m.inputState.aArmed&&m.inputState.bArmed;
    if(needsNeutral){if(!neutral)return [];needsNeutral=false;stats.acknowledged.push({kind:'actual-complete-neutral',tick:m.tick});}
    if(pending){
      if(!pending.acknowledged){need(m.tick-pending.issuedTick<=144,'No actual enqueue acknowledgement');return [keyFor(pending.kind)];}
      if(pending.releaseTick===null){pending.releaseTick=m.tick;return [];}
      if(!pending.neutralConfirmed&&m.tick>pending.releaseTick&&neutral){pending.neutralConfirmed=true;stats.acknowledged.push({kind:'actual-neutral-after-command',tick:m.tick,commandId:pending.receipt.command.id});}
      if(!pending.neutralConfirmed||!pending.consumed)return [];
      pending=null;
    }
    if(m.queue.length||!neutral)return [];
    // A 24-model-tick dispatch margin is an adapter allowance, not a guarantee of wall-clock delivery.
    // If missed, allow the real empty-queue beat and replan from its observed beat number.
    if(m.ticksUntilBeat<24)return [];
    const kind=choose(m),source=kind==='wait'?'a':'direction';need(stats.issued.length<=m.beatBudget,'Bounded one-command queue policy');
    pending={kind,source,beforeOrdinal:m.inputState.edgeOrdinals[source],issuedTick:m.tick,observedBeatNo:m.beatNo,acknowledged:false,consumed:false,neutralConfirmed:false,releaseTick:null};
    stats.issued.push(clone(pending));return [keyFor(kind)];
  }
  pilot.prime=prime;pilot.keys=pilot;pilot.diagnostics=()=>clone({policy,pending,needsNeutral,...stats});return pilot;
}
const defaultPilot=createPilot();
export const keys=(state,context)=>defaultPilot(state,context);
export const prime=state=>defaultPilot.prime(state);
export function assertPublicBoard(m,assert){
  shape(m);assert.equal(m.elapsed,m.tick/60);assert.equal(m.beatNo,Math.floor(m.tick/72));assert.equal(m.beatPhaseTicks,m.tick%72);assert.equal(m.ticksUntilBeat,72-m.beatPhaseTicks);
  assert.equal(m.beatBudget,m.scenario.beatBudget);assert.equal(m.beatsRemaining,m.beatBudget-m.beatNo);assert.ok(m.beatsRemaining>=0);
  assert.equal(m.level,m.difficulty+1);assert.equal(m.scenarioId,m.scenario.id);assert.equal(m.identity.seed,m.seed);
  assert.equal(m.markerCount,m.scenario.markers.length);assert.equal(m.collectedCount,m.collectedMarkerIds.length);assert.equal(new Set(m.collectedMarkerIds).size,m.collectedCount);
  assert.ok(m.collectedMarkerIds.every(id=>m.scenario.markers.some(row=>row.id===id)));assert.equal(m.exitUnlocked,m.collectedCount===m.markerCount);
  assert.equal(m.score,100*m.collectedCount+(m.phase==='won'?1000:0));assert.equal(m.beatReceipts.length,m.beatNo);
  assert.ok(m.queue.length<=6);assert.equal(new Set(m.queue.map(r=>r.id)).size,m.queue.length);assert.ok(m.queue.every(r=>r.id<m.nextCommandId));
  assert.equal(m.nextCommandId,1+m.queueReceipts.filter(r=>r.result==='enqueued').length);
  m.queueReceipts.forEach((r,i)=>{assert.equal(r.id,i+1);assert.ok(r.tick<=m.tick);if(r.result==='enqueued')assert.equal(r.command.queuedTick,r.tick);});
  m.beatReceipts.forEach((r,i)=>{assert.equal(r.id,i+1);assert.equal(r.beatNo,i+1);assert.equal(r.tick,r.beatNo*72);assert.equal(r.remainingAfter,m.beatBudget-r.beatNo);});
  assert.ok(m.scenario.grid[m.player.y]?.[m.player.x]&&m.scenario.grid[m.player.y][m.player.x]!=='#');
  if(!m.tick){assert.equal(m.lastStep,null);assert.equal(m.lastInput,null);assert.deepEqual(m.lastQueueReceipts,[]);assert.equal(m.lastBeat,null);return;}
  const st=m.lastStep;assert.equal(st.fromTick,m.tick-1);assert.equal(st.toTick,m.tick);assert.equal(st.toBeatNo,m.beatNo);assert.equal(m.lastInput.tick,m.tick);
  assert.equal(st.inputMode,m.lastInput.mode);assert.deepEqual(st.queueAfterIds,m.queue.map(r=>r.id));assert.deepEqual(st.positionAfter,m.player);assert.deepEqual(st.markersAfterIds,m.collectedMarkerIds);assert.equal(st.scoreAfter,m.score);
  assert.deepEqual(m.lastQueueReceipts,st.queueReceiptIds.map(id=>m.queueReceipts[id-1]));assert.deepEqual(m.lastBeat,st.beatReceiptId===null?null:m.beatReceipts[st.beatReceiptId-1]);
  assert.equal(st.terminalAfter,m.terminal?.reason??null);
  if(m.phase==='playing'){assert.equal(m.terminal,null);assert.equal(m.lostReason,null);}else{assert.equal(m.terminal.tick,m.tick);assert.equal(m.terminal.beatNo,m.beatNo);assert.deepEqual(m.terminal.position,m.player);assert.equal(m.terminal.reason,m.phase==='won'?'all_markers_exit':m.lostReason);}
}
export function assertProgress({after},assert){const m=after.model;assertPublicBoard(m,assert);assert.equal(after.phase,'won');assert.equal(m.phase,'won');assert.equal(m.terminal.reason,'all_markers_exit');
  assert.equal(m.collectedCount,m.markerCount);assert.deepEqual(m.player,m.scenario.exit);assert.ok(m.elapsed>=30&&m.elapsed<=90);assert.ok(m.beatNo<=m.beatBudget);
  for(const period of [2,3])assert.ok(m.beatReceipts.some(r=>r.gateCheck?.period===period&&r.gateCheck.open&&r.outcome==='moved'));
  assert.ok(m.queueReceipts.some(r=>r.source==='direction'&&r.result==='enqueued'));
}
export function assertRetry({after,initial},assert){const m=after.model;assertPublicBoard(m,assert);assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.ok(m.tick>=0&&m.tick<72);
  assert.deepEqual(m.scenario,initial.model.scenario);assert.deepEqual(m.player,m.scenario.start);assert.equal(m.beatNo,0);assert.equal(m.score,0);assert.equal(m.nextCommandId,1);
  for(const field of ['queue','collectedMarkerIds','queueReceipts','beatReceipts','lastQueueReceipts'])assert.deepEqual(m[field],[]);assert.equal(m.terminal,null);
}
