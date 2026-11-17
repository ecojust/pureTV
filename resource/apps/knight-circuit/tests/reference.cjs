'use strict';
// Independent, test-only knight graph and tour search; no production imports.
const assert=require('node:assert/strict');
function adjacency(width,height,blocked=[]){const forbidden=new Set(blocked);return Array.from({length:width*height},(_,from)=>{if(forbidden.has(from))return [];const x=from%width,y=Math.floor(from/width),out=[];for(let to=0;to<width*height;to++){if(forbidden.has(to))continue;const dx=Math.abs(to%width-x),dy=Math.abs(Math.floor(to/width)-y);if(dx*dy===2)out.push(to);}return out;});}
function legal(state){const graph=adjacency(state.width,state.height,state.blocked);return graph[state.knight].filter(c=>!state.visited[c]);}
function solve(state){const graph=adjacency(state.width,state.height,state.blocked),visited=state.visited.slice(),result=[],total=state.width*state.height-state.blocked.length;let nodes=0;
 const degree=c=>graph[c].filter(to=>!visited[to]).length;
 function dfs(at,left){assert.ok(++nodes<=2000000,'Independent search exceeds explicit2Mnode bound');if(left===0)return true;const options=graph[at].filter(c=>!visited[c]).sort((a,b)=>degree(a)-degree(b)||a-b);for(const to of options){visited[to]=true;result.push(to);if((left===1||degree(to)>0)&&dfs(to,left-1))return true;result.pop();visited[to]=false;}return false;}
 const found=dfs(state.knight,total-state.path.length);return {found,cells:found?result:[],nodes};
}
function badPath(state){const graph=adjacency(state.width,state.height,state.blocked),visited=state.visited.slice(),cells=[];let knight=state.knight;
 while(true){const options=graph[knight].filter(c=>!visited[c]);if(!options.length)break;options.sort((a,b)=>graph[b].filter(c=>!visited[c]).length-graph[a].filter(c=>!visited[c]).length||a-b);knight=options[0];visited[knight]=true;cells.push(knight);}
 return {cells,remaining:state.width*state.height-state.blocked.length-state.path.length-cells.length};
}
module.exports={adjacency,legal,solve,badPath};
