'use strict';
// Test-only ordinary-command search. No route or search function ships in assets.
const M=require('../src/main/assets/game-model.js'),copy=x=>JSON.parse(JSON.stringify(x));
function step(s,input={},dt=1/60){M.step(s,dt,input);}
function press(s,input){step(s);step(s,input);}
function aim(s,angle,power){while(s.angle!==angle)press(s,{x:s.angle<angle?1:-1});while(s.power!==power)press(s,{y:s.power<power?-1:1});}
function shoot(s,angle,power){aim(s,angle,power);press(s,{a:true});for(let guard=0;s.phase==='playing'&&s.stage==='rolling';guard++){if(guard>800)throw Error('shot did not settle');step(s,{},1/60);}return s;}
function solve(start){let beam=[{state:copy(start),route:[]}],simulations=0;for(let depth=0;depth<start.shotsRemaining;depth++){const next=[];for(const node of beam)for(let angle=M.config.angleMin;angle<=M.config.angleMax;angle+=M.config.angleStep)for(let power=0;power<M.config.speeds.length;power++){
  const state=shoot(copy(node.state),angle,power);simulations++;const route=node.route.concat([{angle,power}]);if(state.phase==='won')return{route,simulations};if(state.phase==='playing')next.push({state,route});
 }next.sort((a,b)=>b.state.fallenCount-a.state.fallenCount||a.state.lastShot.ticks-b.state.lastShot.ticks);beam=next.slice(0,6);if(!beam.length)break;}return {route:null,simulations};}
module.exports={aim,shoot,solve};
