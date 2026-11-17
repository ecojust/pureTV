'use strict';
// Test-only exact cell search. Uses published sums/givens, never a stored solution.
function solve(puzzle,limit=2){const white=Array.from(new Set(puzzle.runs.flatMap(r=>r.cells))).sort((a,b)=>a-b),values=Object.fromEntries(white.map(p=>[p,puzzle.givens[p]||0])),touch=Object.fromEntries(white.map(p=>[p,puzzle.runs.filter(r=>r.cells.includes(p))])),solutions=[];let nodes=0;
 function possible(digits,count,target,start=0){if(count===0)return target===0;if(target<=0||digits.length-start<count)return false;for(let k=start;k<=digits.length-count;k++)if(possible(digits,count-1,target-digits[k],k+1))return true;return false;}
 function valid(run){const chosen=run.cells.map(p=>values[p]).filter(Boolean);if(new Set(chosen).size!==chosen.length)return false;const empty=run.cells.length-chosen.length,target=run.sum-chosen.reduce((a,b)=>a+b,0),available=Array.from({length:9},(_,i)=>i+1).filter(v=>!chosen.includes(v));return possible(available,empty,target);}
 function visit(){if(solutions.length>=limit)return;nodes++;let best=null,domain=null;for(const p of white)if(values[p]===0){const d=[];for(let v=1;v<=9;v++){values[p]=v;if(touch[p].every(valid))d.push(v);}values[p]=0;if(d.length===0)return;if(domain===null||d.length<domain.length){best=p;domain=d;}}
  if(best===null){if(puzzle.runs.every(valid))solutions.push({...values});return;}for(const v of domain){values[best]=v;visit();values[best]=0;if(solutions.length>=limit)return;}}
 if(puzzle.runs.every(valid))visit();return {solutions,nodes};}
module.exports={solve};
