// Public-state puzzle planner. It never imports the production model, writes a
// live snapshot, or invokes a solve/undo hook. Plans replay as ordinary keys.
export const budgets = Object.freeze({ maxWebGLDrawCalls: 3 });
export const budget = budgets;
const directions = [[1,0,'ArrowRight'],[0,1,'ArrowDown'],[-1,0,'ArrowLeft'],[0,-1,'ArrowUp']];
const cloneState = s => ({ player:s.player, polarity:s.polarity, positions:[...s.positions] });
function boardOf(m) {
  const cols=m.grid.cols,rows=m.grid.rows,crates=[...m.crates].sort((a,b)=>a.id-b.id);
  return {cols,rows,cells:m.cells.map(c=>({type:c.type,col:c.col,row:c.row})),ids:crates.map(c=>c.id),poles:crates.map(c=>c.polarity),goals:crates.map(c=>{const d=m.docks.find(d=>d.id===c.id);return d.row*cols+d.col}),initial:{player:m.player.row*cols+m.player.col,polarity:m.player.polarity,positions:crates.map(c=>c.row*cols+c.col)}};
}
const stateKey=s=>`${s.player}/${s.polarity}/${s.positions.join(',')}`;
function neighbor(b,pos,dx,dy){const col=pos%b.cols+dx,row=Math.floor(pos/b.cols)+dy;return col<0||row<0||col>=b.cols||row>=b.rows?-1:row*b.cols+col}
function visible(b,from,to){const fc=from%b.cols,fr=Math.floor(from/b.cols),tc=to%b.cols,tr=Math.floor(to/b.cols);if(fc!==tc&&fr!==tr)return false;const step=fc===tc?Math.sign(tr-fr)*b.cols:Math.sign(tc-fc);if(!step)return false;for(let p=from+step;p!==to;p+=step)if(b.cells[p].type==='wall')return false;return true}
function pulse(b,s) {
  const occupied=new Map(s.positions.map((p,i)=>[p,i])),proposals=new Map(),blocked=new Map(),modes=new Map(),destinations=new Map();
  for(let i=0;i<s.positions.length;i++){
    const p=s.positions[i];if(!visible(b,s.player,p))continue;
    const dx=Math.sign(p%b.cols-s.player%b.cols),dy=Math.sign(Math.floor(p/b.cols)-Math.floor(s.player/b.cols));
    const mode=b.poles[i]===s.polarity?'repel':'attract',sign=mode==='repel'?1:-1,dest=neighbor(b,p,dx*sign,dy*sign);
    proposals.set(i,dest);modes.set(i,mode);
    if(dest<0||b.cells[dest].type==='wall')blocked.set(i,'wall');
    else if(dest===s.player)blocked.set(i,'player');
    else {const list=destinations.get(dest)||[];list.push(i);destinations.set(dest,list)}
  }
  for(const list of destinations.values())if(list.length>1)for(const i of list)blocked.set(i,'conflict');
  const verdict=new Map(),stack=[];
  function accepts(i){
    if(blocked.has(i))return false;
    if(verdict.get(i)==='visiting'){const first=stack.indexOf(i);for(const member of stack.slice(first)){blocked.set(member,'cycle');verdict.set(member,false)}return false}
    if(verdict.has(i))return verdict.get(i);
    verdict.set(i,'visiting');stack.push(i);const other=occupied.get(proposals.get(i));
    let ok=other===undefined||proposals.has(other)&&accepts(other);stack.pop();
    if(blocked.has(i))ok=false;if(!ok&&!blocked.has(i))blocked.set(i,'occupied');verdict.set(i,ok);return ok;
  }
  for(const i of proposals.keys())accepts(i);
  const next=cloneState(s),targets=[];let moved=0,scrap=false;
  for(const[i,dest]of proposals){const success=verdict.get(i)===true&&!blocked.has(i);if(success){next.positions[i]=dest;moved++;if(b.cells[dest].type==='scrap')scrap=true}targets.push({crateId:b.ids[i],mode:modes.get(i),from:s.positions[i],to:success?dest:s.positions[i],moved:success,reason:success?'moved':blocked.get(i)})}
  return{state:next,cost:1,moved,scrap,targets};
}
function atomic(b,s,key){
  if(key==='b')return pulse(b,s);
  const next=cloneState(s);if(key==='Space'){next.polarity=-next.polarity;return{state:next,cost:1,moved:0,scrap:false,targets:[]}}
  const d=directions.find(d=>d[2]===key);if(!d)throw new Error('Unsupported discrete action '+key);
  const p=neighbor(b,s.player,d[0],d[1]);if(p<0||b.cells[p].type!=='floor'||s.positions.includes(p))return{state:next,cost:0,moved:0,scrap:false,targets:[]};next.player=p;return{state:next,cost:1,moved:0,scrap:false,targets:[]};
}
const matched=(b,s)=>s.positions.reduce((n,p,i)=>n+Number(p===b.goals[i]),0);
export function visibleSignature(m){const b=boardOf(m);return stateKey(b.initial)}
export function predictVisibleAction(m,key){
 const b=boardOf(m),a=atomic(b,b.initial,key),used=m.actionsUsed+a.cost,remaining=Math.max(0,m.actionBudget-used),matches=matched(b,a.state);
 const phase=a.scrap?'lost':matches===b.ids.length?'won':remaining===0?'lost':'playing';
 return{signature:stateKey(a.state),player:{col:a.state.player%b.cols,row:Math.floor(a.state.player/b.cols),polarity:a.state.polarity},crates:a.state.positions.map((p,i)=>({id:b.ids[i],col:p%b.cols,row:Math.floor(p/b.cols),polarity:b.poles[i],docked:p===b.goals[i]})),cost:a.cost,actionsUsed:used,actionsRemaining:remaining,matched:matches,phase,lostReason:a.scrap?'scrap':remaining===0&&phase==='lost'?'actions':null,targets:a.targets};
}
function walking(b,s){
 const occupied=new Set(s.positions),distance=Array(b.cells.length).fill(-1),previous=Array(b.cells.length).fill(-1),edge=Array(b.cells.length),queue=[s.player];distance[s.player]=0;
 for(let h=0;h<queue.length;h++)for(const[dx,dy,key]of directions){const n=neighbor(b,queue[h],dx,dy);if(n<0||distance[n]>=0||b.cells[n].type!=='floor'||occupied.has(n))continue;distance[n]=distance[queue[h]]+1;previous[n]=queue[h];edge[n]=key;queue.push(n)}
 return{positions:queue,distance,path(to){const keys=[];while(to!==s.player){if(previous[to]<0)throw new Error('Unreachable walking target');keys.push(edge[to]);to=previous[to]}return keys.reverse()}};
}
function dockDistances(b){return b.goals.map(goal=>{const dist=Array(b.cells.length).fill(Infinity),q=[goal];dist[goal]=0;for(let h=0;h<q.length;h++)for(const[dx,dy]of directions){const n=neighbor(b,q[h],dx,dy);if(n<0||b.cells[n].type!=='floor'||dist[n]!==Infinity)continue;dist[n]=dist[q[h]]+1;q.push(n)}return dist})}
class Heap{constructor(){this.items=[];this.serial=0}push(item){item.serial=this.serial++;let i=this.items.length;this.items.push(item);while(i){const p=(i-1)>>1;if(this.compare(this.items[p],item)<=0)break;this.items[i]=this.items[p];i=p}this.items[i]=item}compare(a,b){return a.priority-b.priority||a.h-b.h||a.serial-b.serial}pop(){const root=this.items[0],last=this.items.pop();if(this.items.length){let i=0;while(i*2+1<this.items.length){let child=i*2+1;if(child+1<this.items.length&&this.compare(this.items[child+1],this.items[child])<0)child++;if(this.compare(last,this.items[child])<=0)break;this.items[i]=this.items[child];i=child}this.items[i]=last}return root}get size(){return this.items.length}}
export function planVisibleState(m,{maxExpanded=16000,maxQueued=160000,maxMilliseconds=2500}={}){
 const b=boardOf(m),distances=dockDistances(b),heuristic=s=>s.positions.reduce((sum,p,i)=>sum+distances[i][p],0),startTime=performance.now(),open=new Heap(),best=new Map(),root={s:b.initial,g:0,h:heuristic(b.initial),parent:null,segment:[]};root.priority=root.h*2;open.push(root);best.set(stateKey(root.s),0);let expanded=0,maxHeapSize=1;
 const checkTime=()=>{if(performance.now()-startTime>maxMilliseconds)throw new Error('Visible planner time budget exceeded')};
 while(open.size){
  checkTime();const node=open.pop();if(node.g!==best.get(stateKey(node.s)))continue;
  if(matched(b,node.s)===b.ids.length){const segments=[];for(let n=node;n.parent;n=n.parent)segments.push(n.segment);return{keys:segments.reverse().flat(),actionsNeeded:node.g,expanded,queued:best.size,maxHeapSize,milliseconds:performance.now()-startTime}}
  if(++expanded>maxExpanded)throw new Error(`Visible planner budget exceeded: expanded=${expanded}, queued=${best.size}, ms=${Math.round(performance.now()-startTime)}`);
  const walk=walking(b,node.s);
  for(const position of walk.positions){
   if(!node.s.positions.some(p=>visible(b,position,p)))continue;
   for(const polarity of[node.s.polarity,-node.s.polarity]){
    checkTime();const action=pulse(b,{player:position,polarity,positions:node.s.positions});if(!action.moved||action.scrap)continue;
    const flip=Number(polarity!==node.s.polarity),g=node.g+walk.distance[position]+flip+1,h=heuristic(action.state);
    if(!Number.isFinite(h)||g+Math.ceil(h/b.ids.length)>m.actionsRemaining)continue;
    const key=stateKey(action.state);if(g>=(best.get(key)??Infinity))continue;
    if(open.size>=maxQueued||!best.has(key)&&best.size>=maxQueued)throw new Error('Visible planner queue/state budget exceeded');
    best.set(key,g);const segment=[...walk.path(position),...(flip?['Space']:[]),'b'];open.push({s:action.state,g,h,parent:node,segment,priority:g+h*2+(b.ids.length-matched(b,action.state))*2});maxHeapSize=Math.max(maxHeapSize,open.size);
   }
  }
 }
 throw new Error('No visible-state solution within the remaining action budget');
}
export function createPilot(){
 let level,modeSeen,previousElapsed=-1,plan=[],pending=null,releaseNext=false,nextAt=0,pace=.7,replans=0;const diagnostics=[];
 return Object.assign(function pilot(snapshot,{elapsed=0,mode='qa'}={}){
  const m=snapshot?.model;if(!m?.crates||snapshot.phase!=='playing'||m.phase!=='playing'||snapshot.paused)return[];
  if(level!==m.level||modeSeen!==mode||m.elapsed+.001<previousElapsed){level=m.level;modeSeen=mode;plan=[];pending=null;releaseNext=false;nextAt=elapsed+(mode==='record'?.5:0);replans=0;diagnostics.length=0}previousElapsed=m.elapsed;
  if(releaseNext){releaseNext=false;return[]}
  if(pending){
   const actual=visibleSignature(m);
   if(actual===pending.expected.signature&&m.actionsUsed===pending.expected.actionsUsed){plan.shift();pending=null;nextAt=elapsed+pace}
   else if(actual===pending.before&&m.actionsUsed===pending.beforeUsed&&elapsed-pending.sentAt<1)return[];
   else{diagnostics.push({kind:'observed-replan',elapsed:m.elapsed,expected:pending.expected.signature,actual,expectedUsed:pending.expected.actionsUsed,actualUsed:m.actionsUsed});plan=[];pending=null;if(++replans>24)throw new Error('Too many observed discrete-input replans')}
  }
  if(!plan.length){const solution=planVisibleState(m);plan=solution.keys;pace=Math.max(.28,Math.min(1.6,Math.max(4,(mode==='record'?44:32)-m.elapsed)/Math.max(plan.length,1)));diagnostics.push({kind:'visible-plan',elapsed:m.elapsed,...solution,keys:undefined});if(!plan.length)return[]}
  if(elapsed<nextAt)return[];
  const key=plan[0],expected=predictVisibleAction(m,key);pending={before:visibleSignature(m),beforeUsed:m.actionsUsed,expected,sentAt:elapsed};releaseNext=true;return[key];
 },{diagnostics:()=>structuredClone(diagnostics)});
}
const defaultPilot=createPilot();export const keys=(snapshot,options)=>defaultPilot(snapshot,options);

function samples(before,after,trace){return[before,...(trace||[]).map(x=>x.state||x.snapshot||x),after].filter(x=>x?.model)}
export function assertProgress({before,after,trace},assert){
 const list=samples(before,after,trace),last=after.model;
 assert.equal(after.phase,'won','ordinary moves, polarity changes and magnetic pulses must solve the warehouse');assert.equal(last.phase,'won');assert.equal(last.level,before.model.level);assert.equal(last.matched,last.target);
 assert.ok(last.crates.every(c=>{const d=last.docks.find(d=>d.id===c.id);return c.docked&&c.col===d.col&&c.row===d.row}),'every exact crate ID must occupy its own dock');
 assert.ok(last.docks.every(d=>d.matched&&d.occupiedBy===d.id));assert.equal(last.lostReason,null);
 assert.ok(last.flipCount>0&&last.pulseCount>0&&last.attractedMoves>0&&last.repelledMoves>0,'the real solution must use polarity changes, attraction and repulsion');
 assert.ok(list.some(({model:m})=>m.pulse?.targets.some(t=>t.mode==='attract'&&t.moved)),'an actual attracting pulse must be observed');
 assert.ok(list.some(({model:m})=>m.pulse?.targets.some(t=>t.mode==='repel'&&t.moved)),'an actual repelling pulse must be observed');
 assert.ok(list.some(({model:m})=>m.player.polarity!==before.model.player.polarity),'A must visibly change the robot pole');
 assert.ok(last.elapsed>=30&&last.elapsed<=90,'ordinary paced exploration must fit a 30–90 second round');
 assert.equal(last.score,last.target*300+500+last.actionsRemaining*10+Math.floor(last.remaining)*5);
 let used=before.model.actionsUsed;
 for(const{model:m}of list){
  assert.ok(m.actionsUsed>=used);used=m.actionsUsed;
  assert.equal(m.actionsUsed,m.moveCount+m.flipCount+m.pulseCount,'only successful walking, A and B spend actions');
  assert.equal(m.actionsRemaining,Math.max(0,m.actionBudget-m.actionsUsed));assert.ok(m.actionsUsed<=m.actionBudget);
  assert.equal(m.matched,m.crates.filter(c=>c.docked).length);assert.equal(new Set(m.crates.map(c=>`${c.col},${c.row}`)).size,m.crates.length);
  assert.ok(!m.crates.some(c=>c.col===m.player.col&&c.row===m.player.row));
  for(const piece of[m.player,...m.crates]){assert.ok(Number.isInteger(piece.col)&&Number.isInteger(piece.row));assert.equal(piece.x,m.grid.x+(piece.col+.5)*m.grid.cellSize);assert.equal(piece.y,m.grid.y+(piece.row+.5)*m.grid.cellSize);assert.equal(m.cells[piece.row*m.grid.cols+piece.col].type,'floor')}
  assert.ok(Math.abs(m.remaining-Math.max(0,m.timeLimit-m.elapsed))<1e-7);
 }
}
export function assertRetry({before,after,initial},assert){
 const m=after.model;assert.equal(after.phase,'playing');assert.equal(m.phase,'playing');assert.equal(m.level,before.model.level);assert.ok(m.elapsed<.5&&m.elapsed<before.model.elapsed);assert.equal(m.lostReason,null);assert.equal(m.matched,0);assert.equal(m.score,0);
 for(const field of['actionsUsed','moveCount','blockedMoves','flipCount','pulseCount','attractedMoves','repelledMoves','blockedPulses'])assert.equal(m[field],0,field+' resets');assert.equal(m.actionsRemaining,m.actionBudget);assert.equal(m.player.polarity,1);assert.equal(m.pulse,null);assert.ok(m.crates.every(c=>!c.docked));assert.ok(m.docks.every(d=>!d.matched));
 if(initial?.model){assert.equal(visibleSignature(m),visibleSignature(initial.model));assert.equal(m.actionBudget,initial.model.actionBudget)}
}
