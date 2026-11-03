// Independent public sum/permutation constraints. No answer board or model helper.
const permutationCache=new Map();
export function permutations(length,sum){const key=length+':'+sum;if(permutationCache.has(key))return permutationCache.get(key);const result=[];function visit(values,used,left){if(values.length===length){if(left===0)result.push(values);return;}for(let digit=1;digit<=9;digit++)if(!(used&(1<<digit))&&digit<=left)visit([...values,digit],used|(1<<digit),left-digit);}visit([],0,sum);permutationCache.set(key,result);return result;}
const bits=mask=>Array.from({length:9},(_,i)=>i+1).filter(v=>mask&(1<<v));
export function solveVisible(s){
 const candidateSets=s.runs.map(run=>permutations(run.cells.length,run.sum)),initial=Array(s.cells.length).fill(0);for(const cell of s.whiteCells)initial[cell]=Object.hasOwn(s.givens,cell)?1<<s.givens[cell]:1022;
 const solutions=[];let nodes=0;
 function search(domains,lists){if(solutions.length>=2)return;if(++nodes>200000)throw Error('Independent sum search exceeded bound');let changed=true;
  while(changed){changed=false;for(let r=0;r<s.runs.length;r++){const run=s.runs[r],valid=lists[r].filter(values=>values.every((v,i)=>domains[run.cells[i]]&(1<<v)));if(!valid.length)return;lists[r]=valid;for(let i=0;i<run.cells.length;i++){let mask=0;for(const values of valid)mask|=1<<values[i];const cell=run.cells[i],next=domains[cell]&mask;if(!next)return;if(next!==domains[cell]){domains[cell]=next;changed=true;}}}}
  const target=s.whiteCells.filter(c=>bits(domains[c]).length>1).sort((a,b)=>bits(domains[a]).length-bits(domains[b]).length)[0];
  if(target===undefined){solutions.push(domains.map((mask,i)=>mask?bits(mask)[0]:-1));return;}
  for(const digit of bits(domains[target])){const next=domains.slice();next[target]=1<<digit;search(next,lists.slice());}
 }
 search(initial,candidateSets.slice());if(solutions.length!==1)throw Error('Public clues must have exactly one solution, found '+solutions.length);return {solution:solutions[0],solutions:solutions.length,nodes,initialPermutations:candidateSets.map(p=>p.length)};
}
export function validate(s,cells=s.cells){return s.runs.map(run=>{const values=run.cells.map(c=>cells[c]),actualSum=values.filter(v=>v>0).reduce((a,b)=>a+b,0),positive=values.filter(v=>v>0),complete=values.every(v=>Number.isInteger(v)&&v>=1&&v<=9),duplicate=new Set(positive).size!==positive.length;return {id:run.id,complete,actualSum,duplicate,matched:complete&&!duplicate&&actualSum===run.sum};});}
export function navigation(s,from,to){const white=new Set(s.whiteCells),queue=[{cell:from,route:[]}],seen=new Set([from]),dirs=[{key:'ArrowLeft',x:-1,y:0},{key:'ArrowRight',x:1,y:0},{key:'ArrowUp',x:0,y:-1},{key:'ArrowDown',x:0,y:1}];for(let at=0;at<queue.length;at++){const n=queue[at];if(n.cell===to)return n.route;for(const d of dirs){let x=n.cell%s.width+d.x,y=Math.floor(n.cell/s.width)+d.y;while(x>=0&&x<s.width&&y>=0&&y<s.height){const cell=y*s.width+x;if(white.has(cell)){if(!seen.has(cell)){seen.add(cell);queue.push({cell,route:[...n.route,{...d,cell}]});}break;}x+=d.x;y+=d.y;}}}throw Error('No ordinary white-cell navigation route');}
