// Independent test-only geometry and exhaustive public-rule search. No model import.
'use strict';
const windows=[];
for(let row=0;row<6;row++)for(let col=0;col<6;col++)for(const [dr,dc]of [[0,1],[1,0],[1,1],[1,-1]]){
 const cells=Array.from({length:5},(_,k)=>[row+k*dr,col+k*dc]);
 if(cells.every(([r,c])=>r>=0&&r<6&&c>=0&&c<6))windows.push(cells.map(([r,c])=>r*6+c));
}
function mapCell(cell,q,d){if(cell===null)return null;const row=Math.floor(cell/6),col=cell%6,r0=3*Math.floor(q/2),c0=3*(q%2),r=row-r0,c=col-c0;if(r<0||r>2||c<0||c>2)return cell;const [nr,nc]=d===1?[c,2-r]:[2-c,r];return (r0+nr)*6+c0+nc;}
function rotate(board,q,d){const result=Array(36);for(let cell=0;cell<36;cell++)result[mapCell(cell,q,d)]=board[cell];return result;}
function evaluate(board){const lines=[];let value=0;const weight=[0,1,4,12,40,1000];for(const line of windows){const values=line.map(i=>board[i]),p=values.filter(v=>v===1).length,a=values.filter(v=>v===2).length;if(p===5)lines.push({actor:1,cells:line.slice()});if(a===5)lines.push({actor:2,cells:line.slice()});if(!p)value+=weight[a];if(!a)value-=weight[p];}const p=lines.some(l=>l.actor===1),a=lines.some(l=>l.actor===2),outcome=p?(a?'simultaneous':'player'):a?'opponent':board.includes(0)?'playing':'draw';return {outcome,score:value,winningLines:lines};}
function apply(board,actor,action){const [cell,q,d]=action;if(board[cell]!==0)throw Error('Reference placement occupied');const placed=board.slice();placed[cell]=actor;return rotate(placed,q,d);}
function actions(board){const out=[];board.forEach((v,cell)=>{if(!v)for(let q=0;q<4;q++)for(const d of[1,-1])out.push([cell,q,d]);});return out;}
const priorities={opponent:4,playing:3,simultaneous:2,draw:1,player:0};
const aiCache=new Map();
function ai(board){const key=board.join('');if(aiCache.has(key))return aiCache.get(key);let best=null;for(const action of actions(board)){const after=apply(board,2,action),result=evaluate(after),priority=priorities[result.outcome];if(!best||priority>best.priority||priority===best.priority&&result.score>best.score)best={action,board:after,...result,priority};}aiCache.set(key,best);return best;}
function transition(board,action){const after=apply(board,1,action),result=evaluate(after);if(result.outcome!=='playing')return {board:after,...result,reply:null};const reply=ai(after);return {board:reply.board,outcome:reply.outcome,score:reply.score,winningLines:reply.winningLines,reply};}
function find(board,target='player',maxDepth=4){const failed=new Set();let states=0,edges=0;function walk(b,left){const key=b.join('')+':'+left;if(!left||failed.has(key))return null;states++;const seen=new Set();for(const action of actions(b)){const own=apply(b,1,action),signature=own.join('');if(seen.has(signature))continue;seen.add(signature);edges++;const t=transition(b,action);if(t.outcome===target)return[action];if(t.outcome==='playing'&&left>1){const rest=walk(t.board,left-1);if(rest)return[action,...rest];}}failed.add(key);return null;}for(let depth=1;depth<=maxDepth;depth++){const route=walk(board,depth);if(route)return {route,minimum:depth,states,edges,aiBoards:aiCache.size};}return {route:null,minimum:null,states,edges,aiBoards:aiCache.size};}
module.exports={windows,mapCell,rotate,evaluate,apply,actions,ai,transition,find};
