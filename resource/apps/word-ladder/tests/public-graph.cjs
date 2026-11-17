'use strict';
// Test-only graph built exclusively from the visible dictionary.
function differences(a,b){return [...a].flatMap((c,i)=>c!==b[i]?[i]:[]);}
function graph(layout){return layout.words.map(a=>layout.words.flatMap((b,i)=>differences(a,b).length===1?[i]:[]));}
function solve(layout,start=layout.start){const g=graph(layout),from=layout.words.indexOf(start),goal=layout.words.indexOf(layout.target),distance=Array(g.length).fill(-1),parent=Array(g.length).fill(-1),queue=[from];distance[from]=0;for(const i of queue)for(const to of g[i])if(distance[to]<0){distance[to]=distance[i]+1;parent[to]=i;queue.push(to);}const path=[];if(distance[goal]>=0)for(let at=goal;at>=0;at=parent[at])path.unshift(layout.words[at]);return{distance:distance[goal],path,distances:distance,edges:g,branches:g.flatMap((v,i)=>v.length>=3?[layout.words[i]]:[]),deadEnds:g.flatMap((v,i)=>v.length===1&&layout.words[i]!==layout.start&&layout.words[i]!==layout.target?[layout.words[i]]:[])};}
module.exports={differences,graph,solve};
