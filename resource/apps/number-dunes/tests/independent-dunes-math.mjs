// Pure public geometry and predecessor-rank oracle. No Model, planner, files or import-time search.
const demand=(ok,message)=>{if(!ok)throw Error(message);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function geometry(){
  const cells=Array.from({length:16},(_,i)=>({id:'C'+(i+1),col:i%4,row:Math.floor(i/4),x:180+(i%4+.5)*72,y:136+(Math.floor(i/4)+.5)*72}));
  const lines=[],actions=[];
  for(const axis of ['row','column'])for(let k=0;k<4;k++){
    const indices=Array.from({length:4},(_,j)=>axis==='row'?4*k+j:4*j+k),lineId=axis+(k+1);
    lines.push({id:lineId,axis,index:k,indices,cellIds:indices.map(i=>cells[i].id)});
    for(const direction of axis==='row'?['W','E']:['N','S'])actions.push({id:(axis==='row'?'R':'C')+(k+1)+direction,lineId,direction,
      x:axis==='row'?(direction==='W'?140:508):216+k*72,y:axis==='row'?172+k*72:(direction==='N'?96:464)});
  }
  const snake=Array.from({length:16},(_,k)=>4*Math.floor(k/4)+(Math.floor(k/4)%2?3-k%4:k%4));
  return {cells,lines,actions,snake};
}
export function publicBoard(m){
  const g=geometry();demand(m.cells?.length===16&&Array.isArray(m.stones)&&m.stones.length>0,'Invalid public board size');
  const ids=m.stones.map(s=>s.id),values=m.stones.map(s=>s.value),initial=m.cells.map(c=>c.stoneId),pillars=[];
  demand(new Set(ids).size===ids.length&&ids.every((id,i)=>id==='S'+(i+1))&&values.every(Number.isSafeInteger),'Invalid physical IDs or values');
  for(let i=0;i<16;i++){
    const c=m.cells[i];demand(c.id===g.cells[i].id&&['sand','pillar'].includes(c.kind),'Invalid cell geometry');
    if(c.kind==='pillar'){pillars.push(i);demand(c.stoneId===null,'Stone inside pillar');}
    else demand(c.stoneId===null||ids.includes(c.stoneId),'Unknown stone ID');
  }
  const targets=m.targetHoleIds.map(id=>g.cells.findIndex(c=>c.id===id));
  demand(targets.every(i=>i>=0&&!pillars.includes(i))&&new Set(targets).size===targets.length&&targets.every((x,i)=>!i||targets[i-1]<x),'Invalid target-hole set');
  demand(targets.length===16-pillars.length-ids.length&&Number.isInteger(m.moveLimit)&&m.moveLimit>0,'Target holes/inventory or move limit inconsistent');
  const board={ids,values,initial,pillars,targets,moveLimit:m.moveLimit};positionCheck(board,initial);
  demand(m.stones.every(s=>g.cells[initial.indexOf(s.id)].id===s.cellId),'Stone/cell physical mapping differs');
  return board;
}
export function positionCheck(board,position){
  demand(position.length===16&&board.pillars.every(i=>position[i]===null),'Position geometry/pillars invalid');
  const seen=position.filter(x=>x!==null);demand(seen.length===board.ids.length&&new Set(seen).size===seen.length&&board.ids.every(id=>seen.includes(id)),'Physical inventory is not a bijection');
}
export function assignments(board,position){positionCheck(board,position);return position.flatMap((id,i)=>id===null?[]:[{cellId:'C'+(i+1),stoneId:id}]);}
export function facts(board,position){
  positionCheck(board,position);const snake=geometry().snake,occupied=snake.filter(i=>position[i]!==null),holes=[];
  for(let i=0;i<16;i++)if(!board.pillars.includes(i)&&position[i]===null)holes.push(i);
  const readStoneIds=occupied.map(i=>position[i]),readValues=readStoneIds.map(id=>board.values[board.ids.indexOf(id)]);
  let orderedPairs=0;for(let i=1;i<readValues.length;i++)if(readValues[i-1]<readValues[i])orderedPairs++;
  const matchedHoleCount=board.targets.reduce((n,i)=>n+Number(holes.includes(i)),0),strictlyIncreasing=orderedPairs===board.ids.length-1;
  const holesCorrect=equal(holes,board.targets);
  return {stoneCount:board.ids.length,pillarCount:board.pillars.length,targetHoleCount:board.targets.length,
    pillarIds:board.pillars.map(i=>'C'+(i+1)),targetHoleIds:board.targets.map(i=>'C'+(i+1)),holeIds:holes.map(i=>'C'+(i+1)),snakeOrder:snake.map(i=>'C'+(i+1)),
    readCellIds:occupied.map(i=>'C'+(i+1)),readStoneIds,readValues,orderedPairs,orderPairCount:board.ids.length-1,strictlyIncreasing,matchedHoleCount,holesCorrect,goalReady:strictlyIncreasing&&holesCorrect};
}
export function compact(board,position,actionId){
  positionCheck(board,position);const g=geometry(),action=g.actions.find(a=>a.id===actionId);demand(action,'Unknown public compaction action');
  const line=g.lines.find(l=>l.id===action.lineId),towardLow=['W','N'].includes(action.direction),destinations=new Map();
  // Determine each stone's segment and destination independently by counting predecessor stones.
  // Never filter a segment's stone sequence and pad it into a new line.
  for(const id of board.ids){
    const from=position.indexOf(id),j=line.indices.indexOf(from);if(j<0){destinations.set(id,from);continue;}
    let low=j,high=j;while(low>0&&!board.pillars.includes(line.indices[low-1]))low--;while(high<3&&!board.pillars.includes(line.indices[high+1]))high++;
    let rank=0;for(const other of board.ids){const at=line.indices.indexOf(position.indexOf(other));if(at>=low&&at<=high&&(towardLow?at<j:at>j))rank++;}
    destinations.set(id,line.indices[towardLow?low+rank:high-rank]);
  }
  const after=Array(16).fill(null);for(const id of board.ids){const to=destinations.get(id);demand(after[to]===null&&!board.pillars.includes(to),'Rank mapping overlaps or crosses a pillar');after[to]=id;}
  positionCheck(board,after);
  const moves=board.ids.flatMap(id=>position.indexOf(id)===destinations.get(id)?[]:[{stoneId:id,fromCellId:'C'+(position.indexOf(id)+1),toCellId:'C'+(destinations.get(id)+1)}]);
  return {actionId,lineId:action.lineId,direction:action.direction,position:after,changed:moves.length>0,movedCount:moves.length,moves,afterAssignments:assignments(board,after)};
}
export function segments(board,lineId){
  const line=geometry().lines.find(l=>l.id===lineId);demand(line,'Unknown line');const out=[];let current=[];
  for(const i of line.indices){if(board.pillars.includes(i)){if(current.length)out.push(current);current=[];}else current.push('C'+(i+1));}
  if(current.length)out.push(current);return out;
}
export function focusTarget(fromId,direction){
  const items=geometry().actions,from=items.find(a=>a.id===fromId),d={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]}[direction];demand(from&&d,'Invalid focus input');let best=null;
  items.forEach((to,index)=>{const dx=to.x-from.x,dy=to.y-from.y,along=dx*d[0]+dy*d[1],cross=dx*d[1]-dy*d[0];if(along<=0)return;
    const dist=dx*dx+dy*dy,rank=[dist+2*cross*cross,dist,Math.abs(cross),index];
    if(!best||rank.some((n,k)=>n<best.rank[k]&&rank.slice(0,k).every((x,j)=>x===best.rank[j])))best={rank,id:to.id};});
  return best?.id||fromId;
}
export function focusRoute(from,to){
  const q=[{id:from,path:[]}],seen=new Set([from]);for(let i=0;i<q.length;i++){const r=q[i];if(r.id===to)return r.path;
    for(const d of ['N','E','S','W']){const id=focusTarget(r.id,d);if(!seen.has(id)){seen.add(id);q.push({id,path:[...r.path,d]});}}}
  throw Error('Unreachable public focus');
}
export function searchPublic(board,{maxVisited=100000,maxDepth=board.moveLimit}={}){
  demand(Number.isSafeInteger(maxVisited)&&maxVisited>0&&Number.isSafeInteger(maxDepth)&&maxDepth>=0,'Invalid finite search cap');
  const actionIds=geometry().actions.map(a=>a.id),key=p=>p.map(x=>x||'.').join(','),q=[{position:[...board.initial],path:[]}],seen=new Set([key(board.initial)]);
  let expanded=0,transitions=0,solution=null,orderedWrongHoles=null,holesWrongOrder=null,stoppedBy=null;
  for(let head=0;head<q.length;head++){
    const node=q[head],f=facts(board,node.position),w={path:node.path,position:node.position,depth:node.path.length,facts:f};
    if(f.goalReady){if(solution===null)solution=w;}
    else if(node.path.length<board.moveLimit){if(f.strictlyIncreasing&&!f.holesCorrect&&orderedWrongHoles===null)orderedWrongHoles=w;if(f.holesCorrect&&!f.strictlyIncreasing&&holesWrongOrder===null)holesWrongOrder=w;}
    if(solution&&orderedWrongHoles&&holesWrongOrder){stoppedBy='all-required-witnesses';break;}
    // A won state, or a budget-exhausted non-goal, is terminal and cannot be used as a route through another puzzle state.
    if(f.goalReady||node.path.length>=Math.min(maxDepth,board.moveLimit))continue;expanded++;
    for(const action of actionIds){transitions++;const next=compact(board,node.position,action);if(!next.changed)continue;const k=key(next.position);if(seen.has(k))continue;
      if(seen.size>=maxVisited)return {complete:false,stoppedBy:'visited-cap',expanded,visited:seen.size,transitions,solution,orderedWrongHoles,holesWrongOrder,maxVisited,maxDepth};
      seen.add(k);q.push({position:next.position,path:[...node.path,action]});
    }
  }
  return {complete:!!(solution&&orderedWrongHoles&&holesWrongOrder),stoppedBy:stoppedBy||'bounded-frontier-exhausted',expanded,visited:seen.size,transitions,solution,orderedWrongHoles,holesWrongOrder,maxVisited,maxDepth};
}
