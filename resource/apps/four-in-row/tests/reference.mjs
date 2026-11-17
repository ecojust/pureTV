// Test-only independent reference, derived from the published opponent contract.
export const rows=[['2200200','1200100','2101201','1121222','2112111','1222121'],['1000020','2100112','2200211','2200121','1102121','1121222'],['2100001','2100002','1200002','1201121','1102212','2121212']];
export const order=[3,2,4,1,5,0,6];
export const flatten=b=>b.flat();
export const initial=level=>rows[level].join('').split('').map(Number);
export const windows=[];
for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])if(r+3*dr>=0&&r+3*dr<6&&c+3*dc>=0&&c+3*dc<7)windows.push(Array.from({length:4},(_,i)=>(r+i*dr)*7+c+i*dc));
export function winning(board,who){return [...new Set(windows.filter(w=>w.every(i=>board[i]===who)).flat())].sort((a,b)=>a-b);}
export const legal=board=>order.filter(c=>board[c]===0);
export function drop(board,col,who){const copy=board.slice();for(let row=5;row>=0;row--)if(copy[row*7+col]===0){copy[row*7+col]=who;return {board:copy,move:{row,col}};}return null;}
export function evaluate(board){let sum=0;for(let r=0;r<6;r++)sum+=board[r*7+3]===2?6:board[r*7+3]===1?-6:0;
 for(const w of windows){let own=0,other=0;for(const i of w){own+=board[i]===2;other+=board[i]===1;}if(own&&!other)sum+=[0,1,6,40][own];else if(other&&!own)sum-=[0,1,7,45][other];}return sum;}
function minimax(board,depth,who){if(winning(board,2).length)return 1000000+depth;if(winning(board,1).length)return -1000000-depth;const moves=legal(board);if(!moves.length)return 0;if(!depth)return evaluate(board);const values=moves.map(c=>minimax(drop(board,c,who).board,depth-1,3-who));return who===2?Math.max(...values):Math.min(...values);}
const aiCache=new Map();
export function opponent(board){const key=board.join('');if(aiCache.has(key))return aiCache.get(key);const moves=legal(board);let choice=null,kind='minimax';
 for(const who of [2,1]){const hit=moves.find(c=>winning(drop(board,c,who).board,who).length);if(hit!==undefined){choice=hit;kind=who===2?'immediate-win':'immediate-block';break;}}
 let score=-Infinity;if(choice===null)for(const c of moves){const value=minimax(drop(board,c,2).board,2,1);if(value>score){score=value;choice=c;}}
 const result={col:choice,kind,score:Number.isFinite(score)?score:null};aiCache.set(key,result);return result;}
export function turn(board,col){const first=drop(board,col,1);if(!first)return {board:board.slice(),blocked:true};let b=first.board,cells=winning(b,1);if(cells.length)return {board:b,player:first.move,ai:null,phase:'won',reason:'',winningCells:cells,policy:null};if(!legal(b).length)return {board:b,player:first.move,ai:null,phase:'lost',reason:'draw',winningCells:[],policy:null};const policy=opponent(b),second=drop(b,policy.col,2);b=second.board;cells=winning(b,2);return {board:b,player:first.move,ai:second.move,phase:cells.length?'lost':legal(b).length?'playing':'lost',reason:cells.length?'opponent':legal(b).length?'':'draw',winningCells:cells,policy};}
export function explore(level){const start=initial(level),seen=new Set([start.join('')]),queue=[{board:start,path:[]}],edges=[];let win=null,loss=null,draw=null;
 for(let index=0;index<queue.length;index++){const node=queue[index];for(const col of legal(node.board)){const result=turn(node.board,col),path=[...node.path,col];edges.push({prefix:node.path,col,result});if(result.phase==='won'){if(!win)win=path;}else if(result.phase==='lost'){if(result.reason==='draw'){if(!draw)draw=path;}else if(!loss)loss=path;}else{const key=result.board.join('');if(!seen.has(key)){seen.add(key);queue.push({board:result.board,path});}}}}
 return {level,states:queue.length,edges,win,loss,draw};
}
