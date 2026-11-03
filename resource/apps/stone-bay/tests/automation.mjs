// Independent QA push-space search. Only visible snapshots and normal keys.
export const budgets={maxWebGLDrawCalls:1,maxCanvasPaintCommands:0};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
export const directions=[{key:'ArrowUp',x:0,y:-1},{key:'ArrowRight',x:1,y:0},{key:'ArrowDown',x:0,y:1},{key:'ArrowLeft',x:-1,y:0}];
function neighbor(n,d,w,h){const x=n%w+d.x,y=Math.floor(n/w)+d.y;return x<0||x>=w||y<0||y>=h?-1:y*w+x;}
function reachable(s,player,crates){
 const occupied=new Set(crates),paths=new Map([[player,[]]]),queue=[player];
 for(let q=0;q<queue.length;q++)for(let d=0;d<4;d++){const p=neighbor(queue[q],directions[d],s.width,s.height);if(p>=0&&!s.walls[p]&&!occupied.has(p)&&!paths.has(p)){paths.set(p,[...paths.get(queue[q]),d]);queue.push(p);}}
 return paths;
}
export function solveVisible(s){
 const root={player:s.player,crates:s.crates.slice(),route:[],pushes:0},queue=[root],seen=new Set();
 const key=n=>n.crates.slice().sort((a,b)=>a-b).join(',')+'|'+Math.min(...reachable(s,n.player,n.crates).keys());seen.add(key(root));
 for(let q=0;q<queue.length;q++){
  need(q<250000,'Independent push search exceeded bounded state count');const n=queue[q];
  if(n.crates.every(c=>s.targets.includes(c)))return {route:n.route,pushes:n.pushes,states:seen.size};
  if(n.pushes>=s.pushLimit-s.pushCount)continue;
  const reach=reachable(s,n.player,n.crates);
  for(let index=0;index<n.crates.length;index++)for(let d=0;d<4;d++){
   const crate=n.crates[index],to=neighbor(crate,directions[d],s.width,s.height),behind=neighbor(crate,directions[(d+2)%4],s.width,s.height);
   if(to<0||s.walls[to]||n.crates.includes(to)||!reach.has(behind))continue;
   const crates=n.crates.slice();crates[index]=to;
   const next={player:crate,crates,route:[...n.route,...reach.get(behind),d],pushes:n.pushes+1},k=key(next);
   if(!seen.has(k)){seen.add(k);queue.push(next);}
  }
 }
 throw Error('Visible courtyard cannot be completed within remaining pushes');
}
export function expectedMove(s,d){
 const to=neighbor(s.player,directions[d],s.width,s.height),crates=s.crates.slice(),index=crates.indexOf(to);
 need(to>=0&&!s.walls[to],'Planned worker move hits wall');
 if(index>=0){const dest=neighbor(to,directions[d],s.width,s.height);need(dest>=0&&!s.walls[dest]&&!crates.includes(dest),'Planned push must have one free destination');crates[index]=dest;}
 return {player:to,crates,pushCount:s.pushCount+(index>=0?1:0)};
}
export function createPilot(){
 let level=null,lastCalls=-1,route=[],pending=null,log=[];
 const pilot=snapshot=>{
  const s=snapshot.model;if(!s||snapshot.paused)return [];
  if(level!==s.level||s.calls<lastCalls){level=s.level;route=[];pending=null;log=[];}lastCalls=s.calls;
  if(pending){if(s.player===pending.player){need(s.calls-pending.call<120,'Ordinary direction was not acknowledged');return [pending.key];}
   need(s.player===pending.expected.player&&JSON.stringify(s.crates)===JSON.stringify(pending.expected.crates)&&s.pushCount===pending.expected.pushCount,'Actual move must equal independent walk/push transition');
   log.push({key:pending.key,call:s.calls,player:s.player,pushCount:s.pushCount});route.shift();pending=null;return [];
  }
  if(snapshot.phase!=='playing'||s.phase!=='playing'||!s.inputArmed||s.cancelledLast||s.lastHeld.a||s.lastHeld.b||s.lastHeld.direction!=='none')return [];
  if(!route.length)route=solveVisible(s).route;const d=route[0];need(d!==undefined,'Unfinished courtyard requires a move');
  const key=directions[d].key;pending={key,player:s.player,call:s.calls,expected:expectedMove(s,d)};return [key];
 };
 pilot.log=()=>structuredClone(log);return pilot;
}
let pilot=createPilot(),mode=null,terminalAt=null,release=false;
export function keys(snapshot,meta={}){
 if(mode!==meta.mode){pilot=createPilot();mode=meta.mode;terminalAt=null;release=false;}
 if(meta.mode==='record'&&snapshot.phase==='won'){
  if(snapshot.model.level===2)return [];if(terminalAt===null)terminalAt=meta.elapsed;if(meta.elapsed-terminalAt<1.2)return [];
  if(release){release=false;return [];}release=true;return [snapshot.level===snapshot.model.level+1?'Enter':'ArrowRight'];
 }
 terminalAt=null;release=false;return pilot(snapshot);
}
export function assertProgress({before,after,trace},assert){const s=after.model;
 assert.equal(after.phase,'won');assert.equal(s.score,100);assert.ok(s.crates.every(c=>s.targets.includes(c)));assert.equal(s.matched,s.crates.length);
 assert.equal(new Set(s.crates).size,s.crates.length);assert.ok(!s.crates.includes(s.player));assert.ok(s.pushCount>0&&s.pushCount<=s.pushLimit);
 assert.ok(trace.some(t=>t.state.model.pushCount>before.model.pushCount),'Ordinary play must actually push crates');
}
export function assertRetry({after,initial},assert){for(const k of ['level','phase','player','crates','targets','walls','facing','matched','pushCount','steps','history','undos','score'])assert.deepEqual(after.model[k],initial.model[k],'Fresh retry restores '+k);}
