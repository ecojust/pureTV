'use strict';
// Test-only line-pattern search. No complete board or solver is shipped in assets.
function patterns(n){const out=[];for(let bits=0;bits<2**n;bits++){const p=Array.from({length:n},(_,i)=>(bits>>i)&1);if(p.reduce((a,b)=>a+b,0)!==n/2)continue;if(p.some((v,i)=>i+2<n&&v===p[i+1]&&v===p[i+2]))continue;out.push(p);}return out;}
function solve(layout,limit=2){
 const n=layout.width,allowed=patterns(n),rows=Array(n).fill(null),givens=layout.givens,choices=Array.from({length:n},(_,y)=>allowed.filter(p=>givens.every(g=>Math.floor(g.cell/n)!==y||p[g.cell%n]===g.value))),solutions=[];let nodes=0;
 function legal(y,p){if(rows.some(row=>row&&row.every((v,x)=>v===p[x])))return false;rows[y]=p;const cols=Array.from({length:n},(_,x)=>rows.map(row=>row?row[x]:-1));
  const possible=cols.every(col=>allowed.some(pattern=>col.every((v,k)=>v===-1||v===pattern[k])));let distinct=true;
  if(possible&&rows.every(Boolean))for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(cols[a].every((v,i)=>v===cols[b][i]))distinct=false;
  rows[y]=null;return possible&&distinct;
 }
 function visit(){nodes++;if(solutions.length>=limit)return;if(rows.every(Boolean)){solutions.push(rows.flat());return;}
  let best=-1,options=null;for(let y=0;y<n;y++)if(rows[y]===null){const current=choices[y].filter(p=>legal(y,p));if(!current.length)return;if(options===null||current.length<options.length){best=y;options=current;}}
  for(const p of options){rows[best]=p;visit();rows[best]=null;if(solutions.length>=limit)return;}
 }
 visit();return {solutions,nodes,legalPatterns:allowed.length};
}
module.exports={patterns,solve};
