'use strict';
// Test-only public-state search. Routes are computed, never bundled with the game.
const M=require('../src/main/assets/game-model.js'),copy=x=>JSON.parse(JSON.stringify(x)),inputs={up:{y:-1},down:{y:1},left:{x:-1},right:{x:1},wait:{}};
function command(s,action,dt=.08){M.step(s,dt,{});M.step(s,dt,inputs[action]);return s;}
function findHome(start,homeId=null,repeat=false){let beam=[{s:copy(start),route:[]}],expanded=0;const available=start.homes.filter(h=>homeId===null?!start.visited.includes(h.id):h.id===homeId);
 for(let depth=0;depth<70;depth++){const next=[],seen=new Set();for(const node of beam)for(const action of ['up','left','right','wait','down']){const s=command(copy(node.s),action);expanded++;if(repeat&&s.lives<start.lives&&s.lastDeath.cause==='repeat-home'&&s.lastDeath.objectId===homeId)return{route:node.route.concat(action),expanded};if(s.lives<start.lives||s.phase==='lost')continue;if(s.goalCount>start.goalCount){if(!repeat&&(homeId===null||s.visited.at(-1)===homeId))return{route:node.route.concat(action),expanded};continue;}
  const key=s.player.row+':'+Math.round(s.player.x/3)+':'+s.respawnTicks;if(seen.has(key))continue;seen.add(key);const d=Math.min(...available.map(h=>Math.abs(h.x-s.player.x)));next.push({s,route:node.route.concat(action),rank:s.player.row*12+d/60+(s.respawnTicks?2:0)});
 }next.sort((a,b)=>a.rank-b.rank);beam=next.slice(0,90);if(!beam.length)break;}return{route:null,expanded};
}
function win(level,dt=.08){const s=M.create(796,level);M.step(s,dt,{});const routes=[],searches=[];for(let home=0;home<4&&s.phase==='playing';home++){const p=findHome(s);if(!p.route)return{s,routes,searches,failed:true};routes.push(p.route);searches.push(p.expanded);for(const action of p.route)command(s,action,dt);}return{s,routes,searches,failed:s.phase!=='won'};}
module.exports={inputs,command,findHome,win};
