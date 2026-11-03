// Independent orthogonal components and connected island-shape enumeration. QA only.
export function neighbors(s,cell){const x=cell%s.width,y=Math.floor(cell/s.width),out=[];if(x)out.push(cell-1);if(x+1<s.width)out.push(cell+1);if(y)out.push(cell-s.width);if(y+1<s.height)out.push(cell+s.width);return out;}
function components(s,cells,value){const seen=new Set(),result=[];for(let start=0;start<cells.length;start++)if(cells[start]===value&&!seen.has(start)){const queue=[start];seen.add(start);for(let at=0;at<queue.length;at++)for(const n of neighbors(s,queue[at]))if(cells[n]===value&&!seen.has(n)){seen.add(n);queue.push(n);}result.push(queue.sort((a,b)=>a-b));}return result;}
export function validate(s,cells=s.cells){const errors=[];for(const key of Object.keys(s.fixedValues).map(Number).sort((a,b)=>a-b))if(cells[key]!==s.fixedValues[key])errors.push({type:'fixed-cell',cells:[key],cell:key,expected:s.fixedValues[key],actual:cells[key]});
 for(const island of components(s,cells,2)){const seeds=s.seeds.filter(seed=>island.includes(seed.cell)).sort((a,b)=>a.cell-b.cell);if(!seeds.length)errors.push({type:'unseeded-island',cells:island});else if(seeds.length>1)errors.push({type:'merged-islands',cells:island,seeds:seeds.map(seed=>seed.cell)});else if(island.length!==seeds[0].size)errors.push({type:'island-size',cells:island,seed:seeds[0].cell,expected:seeds[0].size,actual:island.length});}
 const sea=components(s,cells,1);if(!sea.length)errors.push({type:'missing-sea',cells:[]});else if(sea.length>1)errors.push({type:'split-sea',cells:sea.flat().sort((a,b)=>a-b),components:sea.length});
 for(let y=0;y<s.height-1;y++)for(let x=0;x<s.width-1;x++){const a=y*s.width+x,block=[a,a+1,a+s.width,a+s.width+1];if(block.every(c=>cells[c]===1))errors.push({type:'sea-square',cells:block});}return errors;
}
export function solveVisible(s){
 const fixedSea=new Set(s.givenSea),seedCells=new Set(s.seeds.map(seed=>seed.cell));
 const choices=s.seeds.map(seed=>{let frontier=new Map([[String(seed.cell),[seed.cell]]]);for(let size=1;size<seed.size;size++){const next=new Map();for(const shape of frontier.values())for(const at of shape)for(const cell of neighbors(s,at)){if(shape.includes(cell)||fixedSea.has(cell)||(seedCells.has(cell)&&cell!==seed.cell)||neighbors(s,cell).some(n=>seedCells.has(n)&&n!==seed.cell))continue;const added=[...shape,cell].sort((a,b)=>a-b);next.set(added.join(','),added);}frontier=next;}return [...frontier.values()];});
 const order=s.seeds.map((_,i)=>i).sort((a,b)=>choices[a].length-choices[b].length),solutions=[];let nodes=0;
 function search(depth,occupied){if(solutions.length>=2)return;if(++nodes>250000)throw Error('Independent island-shape search exceeded bound');if(depth===order.length){const cells=Array(s.cells.length).fill(1);for(const cell of occupied)cells[cell]=2;if(!validate(s,cells).length)solutions.push(cells);return;}
  for(const shape of choices[order[depth]]){if(shape.some(cell=>occupied.has(cell)||neighbors(s,cell).some(n=>occupied.has(n))))continue;const next=new Set(occupied);shape.forEach(cell=>next.add(cell));search(depth+1,next);}
 }
 search(0,new Set());if(solutions.length!==1)throw Error('Public island clues must have exactly one legal coloring, found '+solutions.length);return {solution:solutions[0],solutions:solutions.length,nodes,shapeCandidates:choices.map(a=>a.length)};
}
