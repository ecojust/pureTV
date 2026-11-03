'use strict';
// Test-only connected shape enumeration. The production model exports no solver/answer.
function solve(puzzle,limit=2){const n=puzzle.width*puzzle.height,neighbors=Array.from({length:n},(_,p)=>{const out=[],x=p%puzzle.width,y=Math.floor(p/puzzle.width);if(x)out.push(p-1);if(x+1<puzzle.width)out.push(p+1);if(y)out.push(p-puzzle.width);if(y+1<puzzle.height)out.push(p+puzzle.width);return out;}),seedCells=new Set(puzzle.seeds.map(s=>s.cell));
 const domains=puzzle.seeds.map(seed=>{const forbidden=new Set(puzzle.givenSea);for(const p of seedCells)if(p!==seed.cell){forbidden.add(p);neighbors[p].forEach(q=>forbidden.add(q));}let shapes=[[seed.cell]];
  for(let size=1;size<seed.size;size++){const next=new Map();for(const shape of shapes)for(const p of shape)for(const q of neighbors[p])if(!forbidden.has(q)&&!shape.includes(q)){const grown=shape.concat(q).sort((a,b)=>a-b);next.set(grown.join(','),grown);}shapes=[...next.values()];}
  return shapes.map(cells=>({cells,halo:new Set(cells.concat(cells.flatMap(p=>neighbors[p])))}));});
 const solutions=[];let nodes=0;
 function validSea(land){const sea=Array.from({length:n},(_,p)=>p).filter(p=>!land.has(p));if(!sea.length)return false;const seen=new Set([sea[0]]),queue=[sea[0]];for(let k=0;k<queue.length;k++)for(const q of neighbors[queue[k]])if(!land.has(q)&&!seen.has(q)){seen.add(q);queue.push(q);}if(seen.size!==sea.length)return false;
  for(let y=0;y<puzzle.height-1;y++)for(let x=0;x<puzzle.width-1;x++){const p=y*puzzle.width+x;if([p,p+1,p+puzzle.width,p+puzzle.width+1].every(q=>!land.has(q)))return false;}return true;}
 function search(todo,land,blocked){if(solutions.length>=limit)return;nodes++;if(!todo.length){if(validSea(land))solutions.push(Array.from({length:n},(_,p)=>land.has(p)?2:1));return;}
  const options=todo.map(id=>({id,choices:domains[id].filter(c=>c.cells.every(p=>!blocked.has(p)))})).sort((a,b)=>a.choices.length-b.choices.length);const choice=options[0];for(const candidate of choice.choices){const nextLand=new Set([...land,...candidate.cells]),nextBlocked=new Set([...blocked,...candidate.halo]);search(todo.filter(id=>id!==choice.id),nextLand,nextBlocked);}}
 search(puzzle.seeds.map((_,i)=>i),new Set(),new Set());return {solutions,nodes,candidateCounts:domains.map(d=>d.length)};
}
module.exports={solve};
