import {buildHeroCarPBR} from '../src/upstream/src/render/pbr/heroCarPBR.js';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const phase=process.argv[2],file=new URL(`../docs/visual-spring-${phase}.json`,import.meta.url);
if(!['before','after'].includes(phase)||existsSync(file))throw Error('Choose a new evidence output; preserve prior report');
const rows=[];
for(const carId of ['wasp','hammer','bulwark','gullwing','rhino'])for(const dt of [1/120,1/60,1/30,1/20,0.1]){
 const car=buildHeroCarPBR({carId}),h=car.userData.hero,trace=[];let max=0;
 // This is the original visual function in isolation. No game model/clock/renderer exists.
 const input={speed:5,throttle:1,ax:2,ay:1,frac:1};
 for(let frame=1;frame<=120;frame++){h.update(input,dt);max=Math.max(max,Math.abs(h.S.heave));if([1,10,30,60,120].includes(frame))trace.push({frame,heave:h.S.heave,pitch:h.S.pitch,roll:h.S.roll,bodyVisible:car.userData.body.visible,bodyY:car.userData.sprung.position.y,root:car.position.toArray()})}
 rows.push({carId,dt,input,maxHeave:max,stable:Number.isFinite(max)&&max<0.1,trace});h.dispose();
}
const report={scope:'Original heroCarPBR visual function with explicit bounded input/dt sequence, no WebGL or real game simulation instantiated; not gameplay evidence',phase,sourceSha256:createHash('sha256').update(readFileSync(new URL('../src/upstream/src/render/pbr/heroCarPBR.js',import.meta.url))).digest('hex'),scriptSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),rows};
writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({phase,unstable:rows.filter(r=>!r.stable).map(r=>({car:r.carId,dt:r.dt,maxHeave:r.maxHeave}))}));
