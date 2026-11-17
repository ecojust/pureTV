"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs");
function fixture(){const calls=[],ctx={fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle});}},scope={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve("../src/main/assets/renderer.js"),"utf8"),scope);return {calls,renderer:new scope.window.BombJackRenderer({getContext:()=>ctx})};}
test("Bomb Jack native HUD cells keep last stage and timer inside their fields",()=>{
 const {calls,renderer}=fixture();renderer.hudText("STAGE16",184,8);renderer.hudText("TIME99",168,24);
 assert(calls.length>100);assert(calls.every(c=>c.x>=168&&c.x<240&&c.y>=8&&c.y<32&&c.w===1&&c.h===1));
});
test("Bomb Jack HUD preserves power and warning colors in a complete 8px grid",()=>{
 const {calls,renderer}=fixture();renderer.hudText("M9",88,24,"#91b8f5");assert(calls.every(c=>c.color==="#91b8f5"));
 calls.length=0;renderer.hudText("00",0,0);const left=calls.filter(c=>c.x<8).map(c=>[c.x,c.y]);const right=calls.filter(c=>c.x>=8).map(c=>[c.x-8,c.y]);assert.deepEqual(left,right);
});
