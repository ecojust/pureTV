// Test-only lattice geometry/search; never shipped in the game assets.
export const positions=[];
for(let row=0;row<5;row++)for(let col=0;col<=row;col++)positions.push({row,col});
const index=(r,c)=>r>=0&&r<5&&c>=0&&c<=r?r*(r+1)/2+c:-1;
export const jumps=[];
for(let from=0;from<15;from++)for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1]]){
 const p=positions[from],over=index(p.row+dr,p.col+dc),to=index(p.row+2*dr,p.col+2*dc);if(over>=0&&to>=0)jumps.push({from,over,to});
}
export const maskOf=occupied=>occupied.reduce((mask,on,i)=>on?mask|(1<<i):mask,0);
export const legal=mask=>jumps.filter(j=>(mask&(1<<j.from))&&(mask&(1<<j.over))&&!(mask&(1<<j.to)));
export const apply=(mask,j)=>mask^(1<<j.from)^(1<<j.over)^(1<<j.to);
export const count=mask=>{let n=0;for(;mask;mask&=mask-1)n++;return n;};
export function search(mask,goal='win'){
 const dead=new Set();let visited=0;
 function visit(m){
  if(dead.has(m))return null;visited++;const moves=legal(m);
  if(goal==='win'&&count(m)===1)return [];
  if(goal==='dead-end'&&!moves.length&&count(m)>1)return [];
  for(const j of moves){const tail=visit(apply(m,j));if(tail)return [j,...tail];}
  dead.add(m);return null;
 }
 const route=visit(mask);if(!route)throw Error('No independent '+goal+' route');return {route,visited};
}
export function cursorNext(cursor,key){
 let {row,col}=positions[cursor];
 if(key==='ArrowLeft')col=Math.max(0,col-1);else if(key==='ArrowRight')col=Math.min(row,col+1);
 else if(key==='ArrowUp'){row=Math.max(0,row-1);col=Math.min(col,row);}else if(key==='ArrowDown')row=Math.min(4,row+1);
 return index(row,col);
}
export function cursorRoute(from,to){
 const q=[{at:from,keys:[]}],seen=new Set([from]);
 for(let i=0;i<q.length;i++){const n=q[i];if(n.at===to)return n.keys;
  for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']){const at=cursorNext(n.at,key);if(!seen.has(at)){seen.add(at);q.push({at,keys:[...n.keys,key]});}}}
 throw Error('Unreachable cursor position');
}
