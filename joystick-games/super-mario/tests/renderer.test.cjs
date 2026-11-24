"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm"), fs = require("node:fs");
function fixture() {
  const calls = [], ctx = {fillStyle:"", fillRect(x,y,w,h){calls.push({x,y,w,h,color:this.fillStyle});}};
  const scope={window:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve("../src/main/assets/renderer.js"),"utf8"),scope);
  const renderer=new scope.window.MarioRenderer({style:{},getContext:()=>ctx});
  const p={id:1,joined:true,x:32,y:64,w:12,h:30,power:1,grounded:true,vx:0,facing:1};
  const g={phase:"playing",frame:0,cameraX:0};
  return {renderer,calls,p,g};
}
function bounds(calls){return {top:Math.min(...calls.map(p=>p.y)),bottom:Math.max(...calls.map(p=>p.y+p.h)),left:Math.min(...calls.map(p=>p.x)),right:Math.max(...calls.map(p=>p.x+p.w))};}
test("large character has independently drawn 32px art aligned to its unchanged 30px collision feet",()=>{
  const {renderer,calls,p,g}=fixture();renderer.player(p,g);
  assert(calls.every(c=>c.w===1&&c.h===1&&Number.isInteger(c.x)&&Number.isInteger(c.y)),"native pixels are never stretched");
  assert.equal(bounds(calls).top,p.y-2);
  assert.equal(bounds(calls).bottom,p.y+p.h);
  assert(bounds(calls).right-bounds(calls).left<=16);
});
test("small and large running cycles contain three different poses and jumping is a separate silhouette",()=>{
  for(const power of [0,1]){
    const {renderer,calls,p,g}=fixture();p.power=power;p.h=power?30:16;p.vx=1;
    const frames=[];
    for(const frame of [0,7,14]){calls.length=0;g.frame=frame;renderer.player(p,g);frames.push(JSON.stringify(calls));}
    assert.equal(new Set(frames).size,3);
    calls.length=0;p.grounded=false;renderer.player(p,g);
    assert(!frames.includes(JSON.stringify(calls)));
    assert(bounds(calls).bottom<=p.y+p.h);
  }
});
test("large crouch is a short native pose, and facing flips pixels without stretching",()=>{
  const {renderer,calls,p,g}=fixture();p.crouching=true;p.h=16;
  renderer.player(p,g);const right=calls.map(c=>({...c}));
  assert(bounds(right).bottom-bounds(right).top<=16);
  calls.length=0;p.facing=-1;renderer.player(p,g);
  const normalize=a=>a.map(c=>[c.x,c.y,c.color].join(":")).sort();
  assert.deepEqual(normalize(calls),normalize(right.map(c=>({...c,x:2*(p.x-2)+15-c.x}))));
});
test("Mario, Luigi and Fire form use distinct three-color palettes",()=>{
  const {renderer,calls,p,g}=fixture(),palettes=[];
  for(const [id,power]of [[1,1],[2,1],[1,2]]){calls.length=0;p.id=id;p.power=power;renderer.player(p,g);const colors=[...new Set(calls.map(c=>c.color))].sort();assert.equal(colors.length,3);palettes.push(colors.join());}
  assert.equal(new Set(palettes).size,3);
});
test("SMB HUD uses 8px character cells and fits the rightmost TIME counter",()=>{
  const {renderer,calls}=fixture();renderer.hudText("TIME",208,16);renderer.hudText("999",216,24);
  assert(calls.every(c=>c.x>=208&&c.x<240&&c.y>=16&&c.y<32&&c.w===1&&c.h===1));
  calls.length=0;renderer.hudText("AA",0,0);
  const first=calls.filter(c=>c.x<8).map(c=>[c.x,c.y]);const second=calls.filter(c=>c.x>=8).map(c=>[c.x-8,c.y]);
  assert.deepEqual(first,second);
});
