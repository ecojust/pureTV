// Independent bank partition search, with no production transition helpers.
export function crossing(s,cargo){
 if(cargo.length>s.capacity||new Set(cargo).size!==cargo.length||cargo.some(i=>s.sides[i]!==s.farmer))throw Error('Invalid independent cargo');
 const sides=s.sides.slice(),from=s.farmer,to=1-from;for(const i of cargo)sides[i]=to;
 const unsafePairs=s.conflicts.filter(([a,b])=>sides[a]===from&&sides[b]===from).map(p=>p.slice()),crossingsUsed=s.crossingsUsed+1;
 let phase='playing',reason='';if(unsafePairs.length){phase='lost';reason='danger';}else if(to===1&&sides.every(b=>b===1)){phase='won';reason='delivered';}else if(crossingsUsed>=s.crossingLimit){phase='lost';reason='crossings';}
 return {...s,sides,farmer:to,cargo:[],crossingsUsed,phase,reason,dangerPairs:unsafePairs,bankCounts:[sides.filter(b=>b===0).length,sides.filter(b=>b===1).length],deliveredCount:sides.filter(b=>b===1).length,lastCrossing:{from,to,cargo:cargo.slice(),unattended:from,unsafePairs,crossing:crossingsUsed}};
}
export function loads(s){const own=s.sides.flatMap((b,i)=>b===s.farmer?[i]:[]),result=[];for(let mask=0;mask<(1<<own.length);mask++){const cargo=own.filter((_,i)=>mask&(1<<i));if(cargo.length<=s.capacity)result.push(cargo);}return result;}
export function solveVisible(s){
 const queue=[{state:structuredClone(s),route:[]}],seen=new Set([s.sides.join('')+s.farmer]);
 for(let at=0;at<queue.length;at++)for(const cargo of loads(queue[at].state)){const next=crossing(queue[at].state,cargo),route=[...queue[at].route,{cargo,expected:next}];if(next.phase==='won')return {route,states:seen.size};if(next.phase!=='playing')continue;const key=next.sides.join('')+next.farmer;if(seen.has(key))continue;seen.add(key);queue.push({state:next,route});}
 throw Error('No safe route within the public crossing allowance');
}
