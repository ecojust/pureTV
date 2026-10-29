"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs");
function fixture(){const calls=[],ctx={fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle});}},scope={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve("../src/main/assets/renderer.js"),"utf8"),scope);return {calls,renderer:new scope.window.AdventureRenderer({style:{},getContext:()=>ctx})};}
test("Adventure HUD overlays the scene without an opaque dashboard and keeps score, portrait and vitality within native bounds",()=>{
 const {calls,renderer}=fixture();renderer.hud({current:()=>({score:123456,lives:3,energy:11})});
 assert(calls.length>100);assert(calls.every(c=>Number.isInteger(c.x)&&Number.isInteger(c.y)&&c.x>=0&&c.x+c.w<=256&&c.y>=0&&c.y+c.h<=30));
 assert(!calls.some(c=>c.w>8||c.h>8),"HUD must not paint over the scene with a full bar");
 assert(calls.some(c=>c.x>=16&&c.x<24&&c.y>=16));
 assert(calls.some(c=>c.x>=104&&c.x<152&&c.y<16));
 assert.equal(calls.filter(c=>c.color==="#fff4cf").length,11);
});
test("empty vitality bars and critical energy are visually distinct",()=>{
 const {calls,renderer}=fixture();renderer.hud({current:()=>({score:0,lives:2,energy:3})});
 assert.equal(calls.filter(c=>c.color==="#e74c35").length,3);
 assert.equal(calls.filter(c=>c.color==="#7c7c63").length,13);
});
