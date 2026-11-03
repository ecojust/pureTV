'use strict';
// Test-only logical inference. Input is exclusively public visible clues and a
// set of mines established by earlier deductions, never a private board map.
function adjacent(i){const a=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=i%6+dx,y=Math.floor(i/6)+dy;if(x>=0&&x<6&&y>=0&&y<6)a.push(y*6+x);}return a;}
function deduce(cells,knownMines,mineCount){
 const eq=[],seen=new Set(),safe=new Set(),mines=new Set();
 function add(list,n){const a=list.slice().sort((a,b)=>a-b);if(!a.length)return;if(n<0||n>a.length)throw Error('Inconsistent visible constraints');const key=a.join(',')+':'+n;if(seen.has(key))return;seen.add(key);eq.push({a,n});if(n===0)a.forEach(i=>safe.add(i));if(n===a.length)a.forEach(i=>mines.add(i));}
 for(let i=0;i<36;i++)if(cells[i]!==null&&cells[i]>=0){const ns=adjacent(i);add(ns.filter(n=>cells[n]===null&&!knownMines.has(n)),cells[i]-ns.filter(n=>knownMines.has(n)).length);}
 add(cells.flatMap((v,i)=>v===null&&!knownMines.has(i)?[i]:[]),mineCount-knownMines.size);
 for(let i=0;i<eq.length&&eq.length<400;i++){const a=eq[i];for(let j=0;j<i;j++){const b=eq[j];if(a.a.every(v=>b.a.includes(v)))add(b.a.filter(v=>!a.a.includes(v)),b.n-a.n);if(b.a.every(v=>a.a.includes(v)))add(a.a.filter(v=>!b.a.includes(v)),a.n-b.n);}if(safe.size||mines.size)break;}
 return {safe:[...safe].sort((a,b)=>a-b),mines:[...mines].sort((a,b)=>a-b)};
}
module.exports={adjacent,deduce};
