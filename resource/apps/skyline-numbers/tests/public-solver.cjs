'use strict';
// Test-only row permutation enumeration from public fixed cells and edge clues.
function visibility(a){let high=0,count=0;for(const v of a)if(v>high){high=v;count++;}return count;}
const cached=new Map();function perms(n){if(cached.has(n))return cached.get(n);const a=[];function visit(row,left){if(!left.length){a.push({row,left:visibility(row),right:visibility(row.slice().reverse())});return;}for(const v of left)visit([...row,v],left.filter(x=>x!==v));}visit([],Array.from({length:n},(_,i)=>i+1));cached.set(n,a);return a;}
function solve(p,limit=2){const n=p.size,rows=Array.from({length:n},(_,r)=>perms(n).filter(q=>(!p.clues.left[r]||q.left===p.clues.left[r])&&(!p.clues.right[r]||q.right===p.clues.right[r])&&q.row.every((v,c)=>!p.fixed[r*n+c]||p.fixed[r*n+c]===v)).map(q=>q.row)),board=[],solutions=[];let nodes=0;
 function dfs(r){if(++nodes>3000000)throw Error('bound');if(r===n){for(let c=0;c<n;c++){const col=board.map(row=>row[c]);if(p.clues.bottom[c]&&visibility(col.slice().reverse())!==p.clues.bottom[c])return;}solutions.push(board.flat());return;}
 for(const row of rows[r]){let valid=true;for(let c=0;c<n;c++){if(board.some(a=>a[c]===row[c])){valid=false;break;}const prefix=board.map(a=>a[c]).concat(row[c]),count=visibility(prefix),max=Math.max(...prefix),target=p.clues.top[c];if(target&&(count>target||count+Math.min(n-r-1,n-max)<target)){valid=false;break;}}
 if(!valid)continue;board.push(row);dfs(r+1);board.pop();if(solutions.length>=limit)return;}}
 dfs(0);return {solutions,nodes};}

module.exports={solve,visibility};
