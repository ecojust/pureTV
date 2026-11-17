// Test-only exact cover of public Shikaku numbers. No production planner import.
export function rectangle(width,a,b){
 const left=Math.min(a%width,b%width),right=Math.max(a%width,b%width),top=Math.min(Math.floor(a/width),Math.floor(b/width)),bottom=Math.max(Math.floor(a/width),Math.floor(b/width));
 const cells=[];for(let p=0;p<width*(bottom+1);p++)if(p%width>=left&&p%width<=right&&Math.floor(p/width)>=top)cells.push(p);
 return {left,top,right,bottom,area:cells.length,cells};
}
export function solveVisible(s){
 const candidates=s.seeds.map(seed=>{const out=[];for(let a=0;a<s.width*s.height;a++)for(let b=a;b<s.width*s.height;b++){if(a%s.width>b%s.width)continue;const r=rectangle(s.width,a,b);if(r.area===seed.area&&r.cells.includes(seed.cell)&&s.seeds.filter(other=>r.cells.includes(other.cell)).length===1)out.push(r);}return out;});
 let nodes=0,solutions=0,solution=null;const used=new Set();
 function visit(remaining,chosen){nodes++;if(!remaining.length){if(used.size===s.width*s.height){solutions++;if(!solution)solution=chosen.map(r=>structuredClone(r));}return;}
  let best=null,options=null;for(const i of remaining){const fitting=candidates[i].filter(r=>r.cells.every(p=>!used.has(p)));if(!options||fitting.length<options.length){best=i;options=fitting;}}
  for(const r of options){r.cells.forEach(p=>used.add(p));visit(remaining.filter(i=>i!==best),[...chosen,r]);r.cells.forEach(p=>used.delete(p));if(solutions>1)return;}
 }
 visit(candidates.map((_,i)=>i),[]);if(solutions!==1)throw Error(`Expected one public exact cover, observed ${solutions}`);return {solution,solutions,nodes,candidates:candidates.map(a=>a.length)};
}
export function validate(s,rectangles=s.rectangles){
 const errors=[],count=Array(s.width*s.height).fill(0);for(const r of rectangles)for(const p of r.cells)count[p]++;
 const overlap=count.flatMap((n,p)=>n>1?[p]:[]);if(overlap.length)errors.push({type:'overlap',cells:overlap});
 for(const r of [...rectangles].sort((a,b)=>a.id-b.id)){const seeds=s.seeds.filter(seed=>r.cells.includes(seed.cell));if(seeds.length===0)errors.push({type:'missing-number',rect:r.id,cells:r.cells.slice()});else if(seeds.length>1)errors.push({type:'multiple-numbers',rect:r.id,cells:r.cells.slice(),seeds:seeds.map(seed=>seed.cell)});else if(r.cells.length!==seeds[0].area)errors.push({type:'wrong-area',rect:r.id,cells:r.cells.slice(),seed:seeds[0].cell,expected:seeds[0].area,actual:r.cells.length});}
 return errors;
}
