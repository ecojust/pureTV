'use strict';
// Test-only exact cover. Enumerate all factor-sized, single-clue rectangles.
// No solution or search code is copied into production assets.
function solve(layout,limit=2){
 const {width:w,height:h,seeds}=layout,candidates=seeds.map((seed,index)=>{
  const options=[];
  for(let height=1;height<=h;height++)if(seed.area%height===0){const width=seed.area/height;if(width>w)continue;
   for(let top=0;top+height<=h;top++)for(let left=0;left+width<=w;left++){
    const cells=[];for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)cells.push(y*w+x);
    if(!cells.includes(seed.cell)||seeds.some((s,j)=>j!==index&&cells.includes(s.cell)))continue;
    options.push({left,top,right:left+width-1,bottom:top+height-1,area:seed.area,cells});
   }
  }return options;
 }),solutions=[];let nodes=0;
 function search(remaining,used,chosen){nodes++;if(solutions.length>=limit)return;
  if(!remaining.length){if(used.size===w*h)solutions.push(chosen.slice());return;}
  let selected=-1,options=null;
  for(const i of remaining){const legal=candidates[i].filter(r=>r.cells.every(p=>!used.has(p)));if(!legal.length)return;if(options===null||legal.length<options.length){selected=i;options=legal;}}
  for(const rect of options){const next=new Set(used);rect.cells.forEach(p=>next.add(p));search(remaining.filter(i=>i!==selected),next,chosen.concat([rect]));if(solutions.length>=limit)return;}
 }
 search(seeds.map((_,i)=>i),new Set(),[]);return {solutions,nodes,candidateCounts:candidates.map(a=>a.length)};
}
module.exports={solve};
