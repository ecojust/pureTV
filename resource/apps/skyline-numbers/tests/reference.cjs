'use strict';
// Independent test-only Latin/visibility constraint propagation; no model imports.
const assert=require('node:assert/strict'),cache=new Map();
function visible(line){let peak=0,count=0;for(const height of line)if(height>peak){peak=height;count++;}return count;}
function permutations(n){if(cache.has(n))return cache.get(n);const result=[];function extend(row){if(row.length===n){result.push(row);return;}for(let value=1;value<=n;value++)if(!row.includes(value))extend([...row,value]);}extend([]);cache.set(n,result);return result;}
function views(board,n){const rows=Array.from({length:n},(_,r)=>board.slice(r*n,(r+1)*n)),cols=Array.from({length:n},(_,c)=>Array.from({length:n},(_,r)=>board[r*n+c]));const view=line=>line.includes(0)?null:visible(line);return{top:cols.map(view),right:rows.map(r=>view(r.slice().reverse())),bottom:cols.map(c=>view(c.slice().reverse())),left:rows.map(view)};}
function valid(board,n,clues,fixed){if(board.length!==n*n||board.some(v=>!Number.isInteger(v)||v<1||v>n))return false;for(let i=0;i<n;i++){if(new Set(board.slice(i*n,(i+1)*n)).size!==n)return false;if(new Set(Array.from({length:n},(_,r)=>board[r*n+i])).size!==n)return false;}if(fixed&&fixed.some((v,i)=>v&&board[i]!==v))return false;const v=views(board,n);return Object.keys(v).every(side=>clues[side].every((c,i)=>!c||v[side][i]===c));}
function solve(layout,limit=2){const n=layout.size,fixed=layout.fixed||layout.givens,clues=layout.clues,pool=permutations(n),initialRows=[],initialCols=[];let nodes=0,reductions=0;const solutions=[];
 for(let r=0;r<n;r++)initialRows.push(pool.filter(line=>line.every((v,c)=>!fixed[r*n+c]||fixed[r*n+c]===v)&&(!clues.left[r]||visible(line)===clues.left[r])&&(!clues.right[r]||visible(line.slice().reverse())===clues.right[r])));
 for(let c=0;c<n;c++)initialCols.push(pool.filter(line=>line.every((v,r)=>!fixed[r*n+c]||fixed[r*n+c]===v)&&(!clues.top[c]||visible(line)===clues.top[c])&&(!clues.bottom[c]||visible(line.slice().reverse())===clues.bottom[c])));
 function search(rows,cols){assert.ok(++nodes<=250000,'Independent search exceeds explicit250000-node bound');if(solutions.length>=limit)return;let changed=true;while(changed){changed=false;if(rows.some(x=>!x.length)||cols.some(x=>!x.length))return;
   for(let r=0;r<n;r++){const support=Array.from({length:n},(_,c)=>new Set(cols[c].map(line=>line[r]))),next=rows[r].filter(line=>line.every((v,c)=>support[c].has(v)));if(!next.length)return;if(next.length!==rows[r].length){reductions+=rows[r].length-next.length;rows[r]=next;changed=true;}}
   for(let c=0;c<n;c++){const support=Array.from({length:n},(_,r)=>new Set(rows[r].map(line=>line[c]))),next=cols[c].filter(line=>line.every((v,r)=>support[r].has(v)));if(!next.length)return;if(next.length!==cols[c].length){reductions+=cols[c].length-next.length;cols[c]=next;changed=true;}}
  }
  let choice=null;for(const [axis,lines]of[['row',rows],['col',cols]])for(let i=0;i<n;i++)if(lines[i].length>1&&(!choice||lines[i].length<choice.count))choice={axis,index:i,count:lines[i].length};
  if(!choice){const board=rows.flatMap(line=>line[0]);assert.ok(valid(board,n,clues,fixed));solutions.push(board);return;}
  for(const candidate of(choice.axis==='row'?rows:cols)[choice.index]){const rr=rows.slice(),cc=cols.slice();(choice.axis==='row'?rr:cc)[choice.index]=[candidate];search(rr,cc);if(solutions.length>=limit)return;}
 }
 search(initialRows,initialCols);return{solutions,nodes,reductions,unique:solutions.length===1&&solutions.length<limit};
}
module.exports={visible,permutations,views,valid,solve};
