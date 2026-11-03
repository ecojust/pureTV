'use strict';
// Independent QA graph, never packaged. Goal-distance BFS on all reachable 8-puzzles.
const assert=require('node:assert/strict');
const goal=[1,2,3,4,5,6,7,8,0],key=b=>b.join('');
const steps=Object.freeze([{name:'up',key:'ArrowUp',dr:-1,dc:0},{name:'down',key:'ArrowDown',dr:1,dc:0},{name:'left',key:'ArrowLeft',dr:0,dc:-1},{name:'right',key:'ArrowRight',dr:0,dc:1}]);
function neighbors(board){const blank=board.indexOf(0),row=Math.floor(blank/3),col=blank%3;return steps.flatMap(d=>{const r=row+d.dr,c=col+d.dc;if(r<0||r>=3||c<0||c>=3)return [];const next=board.slice(),to=r*3+c;[next[blank],next[to]]=[next[to],next[blank]];return [{direction:d.name,key:d.key,board:next,blank:to,tile:board[to]}];});}
let table=null;
function distances(){if(table)return table;table=new Map([[key(goal),0]]);const queue=[goal];for(let head=0;head<queue.length;head++){const b=queue[head],depth=table.get(key(b));for(const n of neighbors(b)){const k=key(n.board);if(!table.has(k)){table.set(k,depth+1);queue.push(n.board);}}}assert.equal(table.size,181440);return table;}
function distance(board){assert.equal(board.length,9);assert.deepEqual([...board].sort((a,b)=>a-b),goal.slice().sort((a,b)=>a-b));const n=distances().get(key(board));assert.notEqual(n,undefined,'Position must have the goal parity');return n;}
function plan(board){let b=board.slice(),d=distance(b);const result=[];while(d){const n=neighbors(b).find(n=>distances().get(key(n.board))===d-1);assert.ok(n);result.push(n);b=n.board;d--;}return result;}
module.exports={goal,key,neighbors,distances,distance,plan};
