'use strict';
// Independent test-only rigid-vehicle geometry and breadth-first unit-slide graph.
const assert=require('node:assert/strict');
function cells(car){return Array.from({length:car.length},(_,k)=>({x:car.x+(car.axis==='H'?k:0),y:car.y+(car.axis==='V'?k:0)}));}
function occupancy(cars){const board=Array(36).fill(-1);for(const car of cars)for(const {x,y}of cells(car)){if(x<0||x>=6||y<0||y>=6){assert.ok(car.target&&car.x===5&&car.axis==='H'&&car.y===2,'Only the escaped target may extend outside');continue;}assert.equal(board[y*6+x],-1,'Vehicles cannot overlap');board[y*6+x]=car.id;}return board;}
function moves(cars){const board=occupancy(cars),result=[];for(const car of cars)for(const delta of[-1,1]){const moved={...car,x:car.x+(car.axis==='H'?delta:0),y:car.y+(car.axis==='V'?delta:0)},exit=car.target&&car.axis==='H'&&car.y===2&&car.x===4&&delta===1;if(!exit&&cells(moved).some(p=>p.x<0||p.x>=6||p.y<0||p.y>=6))continue;if(cells(moved).some(p=>p.x>=0&&p.x<6&&p.y>=0&&p.y<6&&board[p.y*6+p.x]!==-1&&board[p.y*6+p.x]!==car.id))continue;const direction=car.axis==='H'?(delta>0?'right':'left'):(delta>0?'down':'up');result.push({car:car.id,direction,key:'Arrow'+direction[0].toUpperCase()+direction.slice(1),from:{x:car.x,y:car.y},to:{x:moved.x,y:moved.y},exit,cars:cars.map(c=>c.id===car.id?moved:{...c})});}return result;}
function key(cars){return cars.map(c=>c.axis==='H'?c.x:c.y).join(',');}
function solve(cars){const original=cars.map(c=>({...c})),start=key(cars),queue=[start],parents=new Map([[start,null]]);let expanded=0;
 function materialize(encoded){const values=encoded.split(',').map(Number);return original.map((c,i)=>({...c,[c.axis==='H'?'x':'y']:values[i]}));}
 function route(current,last){const result=[last];while(parents.get(current)){const {previous,move}=parents.get(current);result.unshift(move);current=previous;}return result;}
 for(let i=0;i<queue.length;i++){assert.ok(++expanded<=3000000,'Independent car graph exceeded three million states');const current=queue[i],state=materialize(current);for(const m of moves(state)){const move={car:m.car,direction:m.direction,key:m.key,from:m.from,to:m.to,exit:m.exit};if(m.exit)return{found:true,route:route(current,move),expanded,visited:parents.size};const next=key(m.cars);if(!parents.has(next)){parents.set(next,{previous:current,move});queue.push(next);}}}return{found:false,route:[],expanded,visited:parents.size};
}
function nearestCell(car,cursor){return cells(car).filter(p=>p.x>=0&&p.x<6&&p.y>=0&&p.y<6).map(p=>p.y*6+p.x).sort((a,b)=>Math.abs(a%6-cursor%6)+Math.abs(Math.floor(a/6)-Math.floor(cursor/6))-Math.abs(b%6-cursor%6)-Math.abs(Math.floor(b/6)-Math.floor(cursor/6))||a-b)[0];}
module.exports={cells,occupancy,moves,key,solve,nearestCell};
