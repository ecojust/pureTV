'use strict';
// Independent test-only constraint enumeration. This file never imports the model.
// Flags are player annotations, not evidence: only visible clues and mineCount matter.
const assert=require('node:assert/strict');
function neighbors(cell,width,height){const row=Math.floor(cell/width),col=cell%width,result=[];for(let other=0;other<width*height;other++){const dy=Math.abs(Math.floor(other/width)-row),dx=Math.abs(other%width-col);if(other!==cell&&Math.max(dx,dy)===1)result.push(other);}return result;}
function choose(n,k){if(k<0||k>n)return 0;let x=1;for(let i=1;i<=Math.min(k,n-k);i++)x=x*(n-i+1)/i;return Math.round(x);}
function infer(snapshot){const {cells,width,height,mineCount}=snapshot;assert.equal(cells.length,width*height);assert.ok(cells.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=8),'Only playing-state visible cells are accepted');
 const hidden=cells.flatMap((v,c)=>v===null?[c]:[]),constraints=[];
 for(let cell=0;cell<cells.length;cell++){if(cells[cell]===null)continue;const unknown=neighbors(cell,width,height).filter(c=>cells[c]===null);assert.ok(cells[cell]<=unknown.length,'Visible clue cannot exceed neighboring unknowns');if(unknown.length)constraints.push({cells:unknown,count:cells[cell]});else assert.equal(cells[cell],0);}
 const degree=new Map(hidden.map(c=>[c,constraints.filter(q=>q.cells.includes(c)).length]));
 const frontier=hidden.filter(c=>degree.get(c)>0).sort((a,b)=>degree.get(b)-degree.get(a)||a-b),outside=hidden.filter(c=>degree.get(c)===0);
 const touching=frontier.map(c=>constraints.flatMap((q,i)=>q.cells.includes(c)?[i]:[])),sums=constraints.map(()=>0),remaining=constraints.map(q=>q.cells.length),assignment=Array(frontier.length).fill(0),canMine=new Set(),canSafe=new Set();let nodes=0,worlds=0,frontierWorlds=0;
 function search(index,mines){assert.ok(++nodes<=5000000,'Visible constraint search exceeded explicit five-million-node bound');const left=frontier.length-index+outside.length;if(mines>mineCount||mines+left<mineCount)return;
  if(index===frontier.length){const extra=mineCount-mines,multiplicity=choose(outside.length,extra);if(!multiplicity)return;worlds+=multiplicity;frontierWorlds++;for(let j=0;j<frontier.length;j++)(assignment[j]?canMine:canSafe).add(frontier[j]);for(const c of outside){if(extra>0)canMine.add(c);if(extra<outside.length)canSafe.add(c);}return;}
  for(const value of[0,1]){let valid=true;assignment[index]=value;for(const q of touching[index]){sums[q]+=value;remaining[q]--;if(sums[q]>constraints[q].count||sums[q]+remaining[q]<constraints[q].count)valid=false;}if(valid)search(index+1,mines+value);for(const q of touching[index]){sums[q]-=value;remaining[q]++;}}
 }
 search(0,0);assert.ok(worlds>0,'Visible clues must admit at least one complete mine assignment');
 return {safe:hidden.filter(c=>!canMine.has(c)),mines:hidden.filter(c=>!canSafe.has(c)),ambiguous:hidden.filter(c=>canMine.has(c)&&canSafe.has(c)),worlds,frontierWorlds,nodes,frontier:frontier.length,outside:outside.length,constraints:constraints.length};
}
function nearest(cells,cursor,width){return cells.slice().sort((a,b)=>Math.abs(a%width-cursor%width)+Math.abs(Math.floor(a/width)-Math.floor(cursor/width))-Math.abs(b%width-cursor%width)-Math.abs(Math.floor(b/width)-Math.floor(cursor/width))||a-b)[0];}
module.exports={neighbors,choose,infer,nearest};
