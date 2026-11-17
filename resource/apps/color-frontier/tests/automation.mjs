// Test-only solver over visible cells. No model imports, state writes or clock overrides.
export const budgets = { maxWebGLDrawCalls: 1, maxCanvasPaintCommands: 0 };
const need = (ok, message) => { if (!ok) throw Error(message); };
export function flood(cells, owned, width, height, color) {
  const result = owned.slice(), queue = [];
  for (let i = 0; i < result.length; i++) if (result[i]) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head], x = i % width, y = Math.floor(i / width);
    for (const j of [x ? i - 1 : -1, x + 1 < width ? i + 1 : -1, y ? i - width : -1, y + 1 < height ? i + width : -1]) {
      if (j >= 0 && !result[j] && cells[j] === color) { result[j] = true; queue.push(j); }
    }
  }
  return result;
}
export function solveVisible(s) {
  const width=s.width, height=s.height;
  need(Number.isInteger(width)&&Number.isInteger(height)&&s.cells.length===width*height,'Visible board dimensions required');
  const key=(owned,color)=>owned.map(v=>v?'1':'0').join('')+color;
  const first={owned:s.owned.slice(),color:s.color,route:[]},queue=[first],seen=new Set([key(first.owned,first.color)]);
  const remaining=s.moveLimit-s.movesUsed;
  for(let head=0;head<queue.length;head++){
    need(head<250000,'Independent search exceeded bounded state count');
    const n=queue[head];if(n.owned.every(Boolean))return {route:n.route,states:seen.size};
    if(n.route.length>=remaining)continue;
    for(let color=0;color<4;color++){
      if(color===n.color)continue;
      const owned=flood(s.cells,n.owned,width,height,color);
      if(owned.every((v,i)=>v===n.owned[i]))continue; // A no-growth paint cannot improve a shortest route.
      const k=key(owned,color);if(seen.has(k))continue;seen.add(k);
      queue.push({owned,color,route:[...n.route,color]});
    }
  }
  throw Error('Visible board cannot be completed within remaining paint allowance');
}
export function createPilot(){
  let identity=null,lastCalls=-1,route=[],pending=null,log=[];
  const pilot=snapshot=>{
    const s=snapshot.model;if(!s||snapshot.paused)return [];
    if(identity!==s.level||s.calls<lastCalls){identity=s.level;route=[];pending=null;log=[];}
    lastCalls=s.calls;
    if(pending){
      const done=pending.key==='Space'?s.movesUsed===pending.moves+1:s.selected!==pending.selected;
      if(!done){need(s.calls-pending.call<120,'Ordinary key did not receive an acknowledgment');return [pending.key];}
      if(pending.key==='Space'){
        const expected=flood(pending.cells,pending.owned,s.width,s.height,pending.selected);
        need(expected.every((v,i)=>v===s.owned[i]),'Actual flood must match independent four-neighbor closure');
        need(s.color===pending.selected,'Paint uses selected palette color');route.shift();
      }
      log.push({key:pending.key,call:s.calls,moves:s.movesUsed,owned:s.ownedCount});pending=null;return [];
    }
    if(s.phase!=='playing'||snapshot.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return [];
    if(!route.length)route=solveVisible(s).route;
    const target=route[0];need(target!==undefined,'Incomplete board needs a paint');
    const key=s.selected===target?'Space':((target-s.selected+4)%4<=2?'ArrowRight':'ArrowLeft');
    pending={key,call:s.calls,moves:s.movesUsed,selected:s.selected,cells:s.cells.slice(),owned:s.owned.slice()};return [key];
  };
  pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
  if(mode!==meta.mode){pilot=createPilot();mode=meta.mode;terminalAt=null;release=false;}
  if(meta.mode==='record'&&snapshot.phase==='won'){
    if(snapshot.model.level===2)return [];
    if(terminalAt===null)terminalAt=meta.elapsed;
    if(meta.elapsed-terminalAt<1.5)return [];
    if(release){release=false;return [];}
    release=true;return [snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
  }
  terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){
  const s=after.model;assert.equal(after.phase,'won');assert.equal(s.phase,'won');assert.equal(s.score,100);
  assert.ok(s.owned.every(Boolean));assert.ok(s.cells.every(c=>c===s.color));assert.equal(s.ownedCount,s.cells.length);
  assert.ok(s.movesUsed>before.model.movesUsed&&s.movesUsed<=s.moveLimit);
  assert.ok(trace.some(t=>t.state.model.ownedCount>before.model.ownedCount),'Normal play expands the owned connected region');
}
export function assertRetry({after,initial},assert){
  for(const k of ['level','phase','cells','owned','ownedCount','color','selected','movesUsed','moveLimit','history','undos','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);
}
