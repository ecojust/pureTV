// Read-only synthetic reproduction against the archived 600b6add game sources.
// Camera right = normalize(viewForward cross worldUp) is Three.js lookAt's
// right basis: Three uses up cross cameraBack, where cameraBack=-viewForward.
// Project all three trajectories through the same initial camera to separate
// steering direction from subsequent chase-camera motion.
import { create, step } from './model.mjs';
import { sampleTrack, makeTrack } from './tracks.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const root=new URL('./',import.meta.url);
const provenance=JSON.parse(readFileSync(new URL('provenance.json',root),'utf8'));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((v,c,i)=>v+c*b[i],0);
const unit=a=>a.map(v=>v/Math.hypot(...a));
const records=[];
for (let trackIndex=0;trackIndex<3;trackIndex++) {
 const start=create(7,trackIndex);
 // Three seconds of normal countdown, then 0.1 seconds of auto throttle.
 for(let i=0;i<186;i++)step(start,1/60,{});
 // This mathematical isolation omits opponent contact; it is not gameplay QA.
 start.cars.splice(1);
 const p=start.player, track=makeTrack(start.trackId), speed=Math.abs(p.speed);
 const followYaw=p.yaw-Math.max(-.55,Math.min(.55,p.slip))*.26,distance=10.5+speed*.055;
 const at=sampleTrack(track,p.trackS+16+speed*.16);
 const camera=[p.x-Math.sin(followYaw)*distance,p.y+5.5+speed*.025,p.z-Math.cos(followYaw)*distance];
 const target=[p.x+Math.sin(followYaw)*12,Math.max(p.y+1.2,at.y+.8),p.z+Math.cos(followYaw)*12];
 const forward=unit(sub(target,camera)),right=unit(cross(forward,[0,1,0]));
 const fov=64+Math.min(9,speed*.13),aspect=16/9;
 const screenX=car=>{const v=sub([car.x,car.y,car.z],camera);return dot(v,right)/(dot(v,forward)*Math.tan(fov*Math.PI/360)*aspect);};
 const variants={};
 for(const [label,x] of [['left',-1],['straight',0],['right',1]]) {
  const s=structuredClone(start);s.player=s.cars[0];
  for(let i=0;i<72;i++)step(s,1/60,{x});
  variants[label]={inputX:x,steer:s.player.steer,yaw:s.player.yaw,worldX:s.player.x,worldZ:s.player.z,lateral:s.player.lateral,initialCameraProjectedX:screenX(s.player),headDirectionScreenRightComponent:dot([Math.sin(s.player.yaw),0,Math.cos(s.player.yaw)],right)};
 }
 const result={track:start.trackId,initialYaw:p.yaw,cameraPosition:camera,cameraTarget:target,cameraRight:right,variants,rightMinusStraightScreenX:variants.right.initialCameraProjectedX-variants.straight.initialCameraProjectedX,leftMinusStraightScreenX:variants.left.initialCameraProjectedX-variants.straight.initialCameraProjectedX};
 assert.ok(result.rightMinusStraightScreenX<-.05,'Old RIGHT input projects left');
 assert.ok(result.leftMinusStraightScreenX>.05,'Old LEFT input projects right');
 assert.ok(variants.right.headDirectionScreenRightComponent<-.4,'Old RIGHT heading turns to camera-left');
 records.push(result);
}
const script=readFileSync(new URL('reproduce.mjs',root));
console.log(JSON.stringify({status:'reproduced',sourceCommit:provenance.sourceCommit,scope:provenance.scope,node:process.version,scriptSha256:createHash('sha256').update(script).digest('hex'),records},null,2));
