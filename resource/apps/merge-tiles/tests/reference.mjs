// Independent line compaction, merge and public spawn rules; QA only.
export const directions=[{name:'up',key:'ArrowUp',x:0,y:-1},{name:'right',key:'ArrowRight',x:1,y:0},{name:'down',key:'ArrowDown',x:0,y:1},{name:'left',key:'ArrowLeft',x:-1,y:0}];
const spawnValues=[2,2,4,2,2,2,4,2];
export function slide(cells,d){
 const result=cells.slice(),merges=[];let points=0;
 for(let line=0;line<4;line++){
  const positions=Array.from({length:4},(_,i)=>d.name==='left'?line*4+i:d.name==='right'?line*4+3-i:d.name==='up'?i*4+line:(3-i)*4+line);
  const values=positions.map(i=>cells[i]).filter(Boolean),out=[];
  for(let i=0;i<values.length;i++){if(i+1<values.length&&values[i]===values[i+1]){const value=values[i]*2;points+=value;merges.push({index:positions[out.length],value});out.push(value);i++;}else out.push(values[i]);}
  while(out.length<4)out.push(0);positions.forEach((p,i)=>result[p]=out[i]);
 }
 return {cells:result,points,merges,changed:result.some((v,i)=>v!==cells[i])};
}
export function advance(s,d){
 const moved=slide(s.cells,d);if(!moved.changed)return null;
 const next={...s,cells:moved.cells,movesUsed:s.movesUsed+1,points:s.points+moved.points,lastMerges:moved.merges,lastSpawn:null,phase:'playing',reason:''};
 if(next.cells.some(v=>v>=s.target)){next.phase='won';return next;}
 const empty=next.cells.flatMap((v,i)=>v===0?[i]:[]),index=empty[(s.seed+s.spawnIndex*7)%empty.length],value=spawnValues[s.spawnIndex%8];
 next.cells[index]=value;next.lastSpawn={index,value};next.spawnIndex++;next.nextSpawnValue=spawnValues[next.spawnIndex%8];
 if(directions.every(dir=>!slide(next.cells,dir).changed)){next.phase='lost';next.reason='stuck';}
 else if(next.movesUsed>=s.moveLimit){next.phase='lost';next.reason='moves';}
 return next;
}
function merit(s){
 const c=s.cells,max=Math.max(...c),corners=[c[0],c[3],c[12],c[15]],empty=c.filter(v=>!v).length;let adjacency=0;
 for(let r=0;r<4;r++)for(let col=0;col<4;col++){const i=r*4+col;if(col<3&&c[i]===c[i+1])adjacency+=c[i];if(r<3&&c[i]===c[i+4])adjacency+=c[i];}
 return c.reduce((a,v)=>a+v*v,0)*10+empty*100+(corners.includes(max)?max*100:0)+adjacency*10;
}
export function planVisible(s,{lose=false,lossReason=null}={}){
 let beam=[{state:structuredClone(s),route:[]}],expanded=0;const seen=new Set();
 for(let depth=0;depth<s.moveLimit-s.movesUsed;depth++){
  const next=[];
  for(const node of beam)for(let d=0;d<4;d++){
   const state=advance(node.state,directions[d]);if(!state)continue;expanded++;const route=[...node.route,d];
   if((lose&&state.phase==='lost'&&(!lossReason||state.reason===lossReason))||(!lose&&state.phase==='won'))return {route,expanded};
   if(state.phase!=='playing')continue;const key=state.cells.join(',')+'|'+state.spawnIndex;if(seen.has(key))continue;seen.add(key);
   const score=lose&&lossReason!=='moves'?state.cells.filter(Boolean).length*1000-Math.max(...state.cells)*20-state.points:merit(state);next.push({state,route,score});
  }
  next.sort((a,b)=>b.score-a.score);beam=next.slice(0,500);if(!beam.length)break;
 }
 throw Error('Independent bounded beam found no '+(lose?'loss':'win')+' within public move allowance');
}
