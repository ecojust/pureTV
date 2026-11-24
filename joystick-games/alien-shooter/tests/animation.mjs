// Real-WebGL locomotion regression and controlled before/after motion captures.
// Recordings advance the actual simulation with fixed inputs; the close inspection
// camera and isolated cast are fixtures, not television footage or a playthrough.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir,stat,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const options={assets:fileURLToPath(new URL('../src/main/assets/',import.meta.url)),output:'/tmp/puretv-alien-shooter-animation',label:'current',record:false,tests:true};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i].replace(/^--/,'');
  if(key==='record'){options.record=true;continue;}
  if(key==='record-only'){options.record=true;options.tests=false;continue;}
  assert.ok(['assets','output','label','compare-trace'].includes(key),'Unknown option '+key);options[key]=process.argv[++i];
}
const assets=path.resolve(options.assets),output=path.resolve(options.output);await mkdir(output,{recursive:true});
const sha=data=>createHash('sha256').update(data).digest('hex');
async function manifest(){const result={};for(const e of (await readdir(assets,{recursive:true,withFileTypes:true})).filter(e=>e.isFile())){const absolute=path.join(e.parentPath||e.path,e.name);result[path.relative(assets,absolute)]=sha(await readFile(absolute));}return result;}
const assetHashes=await manifest();
const html='<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:640px;height:720px;background:#101a1b;color:#e5e9df;font:14px "Noto Sans CJK SC",sans-serif}header{height:56px;padding:7px 16px;background:#142223;border-bottom:1px solid #31443d;display:flex;align-items:center;justify-content:space-between}h1{font-size:21px;margin:0}header span{color:#d8c67e;font-size:14px}canvas{display:block;width:640px;height:600px}footer{height:64px;padding:7px 16px;background:#142223}#chapter{font-size:16px;font-weight:600;color:#b4d9c8}#note{font-size:11px;color:#9baca6;margin-top:4px}.progress{height:2px;background:#465947;margin-top:4px}.progress i{display:block;height:2px;background:#dbbf68;width:0}</style><header><h1 id="version"></h1><span id="control"></span></header><canvas id="battlefield" width="640" height="600"></canvas><footer><div id="chapter"></div><div id="note">受控 WebGL 动作近景检视 · 非电视实拍 / 非完整人工通关</div><div class="progress"><i id="progress"></i></div></footer>';
const server=http.createServer(async(req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);if(name==='__animation'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(name==='favicon.ico'){res.writeHead(204).end();return;}const file=path.resolve(assets,name);if(!file.startsWith(assets+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'text/plain');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling']});
const context=await browser.newContext({viewport:{width:640,height:720},deviceScaleFactor:1});const page=await context.newPage(),errors=[],shaderErrors=[],networkErrors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|GL_INVALID|program/i.test(m.text()))shaderErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)networkErrors.push({url:r.url(),status:r.status()});});
const result={label:options.label,physicalTvTested:false,source:'Actual bundled WebGL renderer and game simulation; fixed-input isolated locomotion fixtures and an inspection close camera. Not a full human playthrough.',assets:assetHashes,checks:[]};
async function command(executable,args){await new Promise((resolve,reject)=>{const child=spawn(executable,args,{stdio:['ignore','ignore','pipe']});let log='';child.stderr.on('data',d=>log=(log+d).slice(-6000));child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(executable+' exited '+code+'\n'+log)));});}
try{
  await page.goto(base+'/__animation');await page.locator('#version').evaluate((el,label)=>el.textContent=label,options.label);
  const document=await readFile(path.join(assets,'tv.html'),'utf8'),scripts=[...document.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
  for(const name of scripts.slice(0,scripts.indexOf('renderer.js')+1).filter(n=>n!=='bootstrap.js'))await page.addScriptTag({url:base+'/'+name});
  await page.evaluate(async()=>{
    if(window.AlienShooterBakedLoader)await AlienShooterBakedLoader.load();
    const r=new AlienShooterRenderer(document.getElementById('battlefield'));
    if(r.failed)throw new Error(r.error);
    window.__motion={renderer:r,game:null,view:'player',lastChapter:-1};
    __motion.input=(x=0,y=0,aimX=1,aimY=0)=>({id:1,connected:true,x,y,aimX,aimY,a:false,b:false,start:false,select:false});
    __motion.snapshot=g=>JSON.stringify(g);
    __motion.reset=()=>{const g=new AlienShooterGame({seed:19790503});g.start();g.enemies=[];g.pickups=[];g.particles=[];g.bullets=[];g.decals=[];g.grenades=[];g.map.objectives.forEach(o=>o.status='locked');Object.assign(g.players[0],{x:8,y:12,angle:0,weapon:'minigun',connected:true,invulnerable:999,fireFlash:0});g.readInputs([__motion.input()]);__motion.game=g;r.render(g,0);const resetError=r.renderer.getContext().getError();if(resetError)throw new Error('Game-reset WebGL error '+resetError);return g;};
    __motion.render=dt=>{const g=__motion.game,before=__motion.snapshot(g);r.render(g,dt);if(__motion.snapshot(g)!==before)throw new Error('Renderer modified game state');const error=r.renderer.getContext().getError();if(error)throw new Error('WebGL error '+error+' phase='+g.phase+' elapsed='+g.elapsed);};
    __motion.tick=(input,steps=1,renderEach=true)=>{const g=__motion.game;for(let i=0;i<steps;i++){g.update(1/60,[input]);if(renderEach)__motion.render(1/60);}if(!renderEach)__motion.render(steps/60);};
    __motion.enemy=(type,x=10,y=12)=>{const g=__motion.game,s=AlienShooterWorld.enemyTypes[type];const e={id:1,type,x,y,angle:-Math.PI/2,radius:s.radius,hp:s.hp,maxHp:s.hp,speed:s.speed,damage:s.damage,attackCooldown:999,hitFlash:0,summoned:-999,moving:true};g.enemies=[e];return e;};
    // Sample the shipping GPU function itself. Float readback avoids a CPU
    // mirror of the IK equations and measures the transformed rest joints.
    __motion.samplers=new Map();
    __motion.gpuSample=(mesh,pose,probes)=>{
      const source=mesh.material.userData.rigShader,rigUniforms=mesh.material.userData.rigUniforms;
      if(typeof source!=='string'||!source.includes('alienRigPosition'))throw new Error('Missing shipping rig shader');
      const n=probes.length,key=mesh.uuid+':'+n;let sample=__motion.samplers.get(key);
      if(!sample){
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(probes.flatMap(p=>p.position),3));
        geometry.setAttribute('probeGroup',new THREE.Float32BufferAttribute(probes.map(p=>p.group),1));
        geometry.setAttribute('probeIndex',new THREE.Float32BufferAttribute(probes.map((_,i)=>i),1));
        const material=new THREE.RawShaderMaterial({uniforms:{...rigUniforms,probePose:{value:new THREE.Vector4(...pose)}},vertexShader:
          'precision highp float;\nattribute vec3 position;attribute float probeGroup;attribute float probeIndex;uniform vec4 probePose;varying vec3 probeResult;\n'+source+'\nvoid main(){probeResult=alienRigPosition(position,probeGroup,probePose);gl_Position=vec4((probeIndex+.5)/'+n+'.0*2.-1.,0.,0.,1.);gl_PointSize=1.;}',
          fragmentShader:'precision highp float;varying vec3 probeResult;void main(){gl_FragColor=vec4(probeResult,1.);}',depthTest:false,depthWrite:false});
        const scene=new THREE.Scene(),points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);
        const target=new THREE.WebGLRenderTarget(n,1,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
        sample={geometry,material,scene,target,values:new Float32Array(n*4)};__motion.samplers.set(key,sample);
      }
      sample.geometry.attributes.position.array.set(probes.flatMap(p=>p.position));sample.geometry.attributes.position.needsUpdate=true;
      sample.geometry.attributes.probeGroup.array.set(probes.map(p=>p.group));sample.geometry.attributes.probeGroup.needsUpdate=true;
      sample.material.uniforms.probePose.value.fromArray(pose);sample.material.uniformsNeedUpdate=true;
      const renderer=__motion.renderer.renderer,old=renderer.getRenderTarget(),values=sample.values;
      try{renderer.setRenderTarget(sample.target);renderer.render(sample.scene,new THREE.Camera());renderer.readRenderTargetPixels(sample.target,0,0,n,1,values);
        if(renderer.getContext().getError())throw new Error('GPU rig sampling error');
        return probes.map((p,i)=>{const v=Array.from(values.slice(i*4,i*4+4));if(Math.abs(v[3]-1)>.01||!v.every(Number.isFinite))throw new Error('GPU rig sample missing/nonfinite: '+JSON.stringify(v));return v.slice(0,3);});
      }finally{renderer.setRenderTarget(old);}
    };
    __motion.disposeSamples=()=>{for(const s of __motion.samplers.values()){s.target.dispose();s.geometry.dispose();s.material.dispose();}__motion.samplers.clear();};
    __motion.reset();
  });
  await page.waitForFunction(()=>!__motion.renderer.pendingTextures);
  if(options.tests){
    // Inspect actual uploaded pose data; do not duplicate the rig equations.
    assert.equal(await page.evaluate(()=>typeof __motion.renderer.inspectActor),'function','Renderer must expose read-only actual pose inspection');
    const boundaries=await page.evaluate(()=>{
      const m=__motion,r=m.renderer,checks=[];
      const check=(name,condition,details)=>{if(!condition)throw new Error(name+': '+JSON.stringify(details));checks.push({name,...(details===undefined?{}:{details})});};
      const near=(a,b,tolerance=1e-6)=>Math.abs(a-b)<=tolerance;
      const arc=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
      const pose=(kind='player',id=1)=>{const p=r.inspectActor(kind,id);if(!p)throw new Error('Missing actor inspection '+kind+':'+id);return p;};
      const stable=p=>({phase:p.phase,speed:p.speed,normalizedSpeed:p.normalizedSpeed,travelAngle:p.travelAngle,aimAngle:p.aimAngle,facingAngle:p.facingAngle,packedPose:p.packedPose});
      const run=(input,frames=12)=>{for(let i=0;i<frames;i++)m.tick(input,3,false);return pose();};
      const gait=input=>{m.reset();let last=pose().phase,total=0,samples=[];for(let i=0;i<16;i++){m.tick(input,3,false);const p=pose();let d=p.phase-last;if(d<-.5)d+=1;total+=d;last=p.phase;samples.push(p);}return{phaseTravel:total,final:pose(),samples};};
      // The simulation, rather than RAF time or the moving intent flag, owns gait progress.
      m.reset();const initial=pose();run(m.input(),12);const idle=pose();
      check('idle has no gait progress',near(initial.phase,idle.phase)&&idle.packedPose[1]<.001,{initial,idle});
      const directions=[];
      for(const [name,x,y] of [['forward',1,0],['backward',-1,0],['strafe',0,-1]]){
        m.reset();const p=run(m.input(x,y),12),g=m.game;
        check(name+' pose follows real movement',p.speed>.5&&Math.abs(arc(p.travelAngle,Math.atan2(y,x)))<.01&&Math.abs(arc(p.aimAngle,g.players[0].angle))<.0001,p);
        directions.push({name,pose:p});
      }
      checks.push({name:'independent player direction fixtures',details:directions});
      const slow=gait(m.input(.35,0)),fast=gait(m.input(1,0));
      check('real speed changes cadence and stride',fast.phaseTravel>slow.phaseTravel*1.4&&fast.final.packedPose[1]>slow.final.packedPose[1]*1.4,{slow:{phaseTravel:slow.phaseTravel,pose:slow.final},fast:{phaseTravel:fast.phaseTravel,pose:fast.final}});
      const same=stable(pose());for(let i=0;i<4;i++)m.render(.05);m.render(0);
      check('repeated RAF and dt-zero redraw cannot step or decay pose',JSON.stringify(stable(pose()))===JSON.stringify(same),{before:same,after:stable(pose())});
      const paused=stable(pose());m.game.pause();for(let i=0;i<4;i++)m.render(.1);
      check('pause freezes the visible pose after moving flag clears',JSON.stringify(stable(pose()))===JSON.stringify(paused));m.game.resume();m.tick(m.input(1,0),3,false);
      check('resuming simulation resumes distance gait',!near(pose().phase,paused.phase));
      run(m.input(),16);const stopped=pose();run(m.input(),8);
      check('release settles and then keeps feet planted',stopped.packedPose[1]<.02&&near(stopped.phase,pose().phase),{stopped,after:pose()});
      m.reset();Object.assign(m.game.players[0],{x:15.58,y:14.5});m.render(0);const wallStart=pose();run(m.input(1,0),16);const wallEnd=pose();
      check('real wall collision cannot run in place',near(m.game.players[0].x,15.58)&&near(wallStart.phase,wallEnd.phase)&&wallEnd.packedPose[1]<.001,{wallStart,wallEnd,player:m.game.players[0]});
      // Same ID in different namespaces and same ID with a new object are distinct actors.
      m.reset();m.enemy('runner');m.render(0);run(m.input(1,0),6);const player=pose(),enemy=pose('enemy');
      check('player ID 1 and enemy ID 1 have separate state',r.actorStates.has('player:1')&&r.actorStates.has('enemy:1')&&player.type!==enemy.type,{player,enemy});
      m.game.enemies=[{...m.game.enemies[0],x:9,y:10}];m.render(0);const reused=pose('enemy');
      check('same enemy ID with new object resets displacement',reused.distance===0&&reused.packedPose[1]<.001,reused);
      m.game.enemies=[];m.render(0);check('removed actors are pruned',!r.actorStates.has('enemy:1'));
      m.enemy('crawler',8,12);m.render(0);Object.assign(m.game.players[0],{x:40,y:12});r.cameraCenter.x=40;r.cameraCenter.y=12;m.render(0);const offscreenStart=pose('enemy');run(m.input(),8);const offscreenEnd=pose('enemy');
      check('culled actors still accumulate true displacement',r.stats.culledEnemies===1&&offscreenEnd.distance>offscreenStart.distance, {offscreenStart,offscreenEnd,culled:r.stats.culledEnemies});
      Object.assign(m.game.players[0],{x:8,y:12});r.cameraCenter.x=8;r.cameraCenter.y=12;m.render(0);
      check('returning to view retains gait phase',r.stats.renderedEnemies===1&&near(pose('enemy').phase,offscreenEnd.phase));
      Object.assign(m.game.enemies[0],{x:30,y:25});m.game.elapsed+=1/60;m.render(1/60);const teleported=pose('enemy');
      check('teleport resets rather than creating an enormous stride',near(teleported.distance,offscreenEnd.distance)&&teleported.normalizedSpeed===0&&teleported.phase===0&&teleported.teleportReset>offscreenEnd.teleportReset,teleported);
      m.game.loadStage(1);m.render(0);const switched=pose();
      check('map replacement clears old actor state',!r.actorStates.has('enemy:1')&&switched.distance===0&&switched.packedPose[1]<.001,switched);
      const title=new AlienShooterGame({seed:19790503});m.game=title;m.render(.1);const titleEnemy=r.inspectActor('enemy',title.enemies[0].id);m.render(.1);
      check('title moving intent without displacement is idle',titleEnemy.normalizedSpeed<.001&&near(titleEnemy.phase,r.inspectActor('enemy',title.enemies[0].id).phase));
      // Keep a read-only game fixture ready for later GPU joint checks.
      m.reset();return checks;
    });
    result.checks.push(...boundaries);console.log("PASS simulation/pose boundaries: "+boundaries.length);
    const joints=await page.evaluate(()=>{
      const m=__motion,r=m.renderer,checks=[];
      const check=(name,condition,details)=>{if(!condition)throw new Error(name+': '+JSON.stringify(details));checks.push({name,details});};
      const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
      const arc=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
      const get=(kind='player')=>r.inspectActor(kind,1);
      const jointSample=(mesh,pose)=>{
        const legs=mesh.geometry.userData.rig.legs,probes=legs.flatMap(l=>[
          {position:l.hip,group:l.groups[0]},{position:l.knee,group:l.groups[0]},
          {position:l.knee,group:l.groups[1]},{position:l.foot,group:l.groups[1]},
          {position:l.foot,group:l.groups[2]},{position:l.hip,group:mesh.geometry.userData.rig.type==='human'?mesh.geometry.userData.rig.pelvisGroup:mesh.geometry.userData.rig.bodyGroup}]);
        const values=m.gpuSample(mesh,pose,probes);return legs.map((l,i)=>({hip:values[i*6],upperKnee:values[i*6+1],lowerKnee:values[i*6+2],ankle:values[i*6+3],foot:values[i*6+4],hipSocket:values[i*6+5]}));
      };
      const analyze=(mesh,samples)=>{
        const legs=mesh.geometry.userData.rig.legs;let minKneeY=Infinity,minAnkleY=Infinity,hipGap=0,kneeGap=0,ankleGap=0,upperLengthError=0,lowerLengthError=0,footBelowFloor=0,kneeAngleRange=0;
        for(let i=0;i<legs.length;i++){
          const l=legs[i],angles=[];
          for(const s of samples){const q=s.joints[i];minKneeY=Math.min(minKneeY,q.upperKnee[1],q.lowerKnee[1]);minAnkleY=Math.min(minAnkleY,q.ankle[1]);hipGap=Math.max(hipGap,length(q.hip,q.hipSocket));kneeGap=Math.max(kneeGap,length(q.upperKnee,q.lowerKnee));ankleGap=Math.max(ankleGap,length(q.ankle,q.foot));upperLengthError=Math.max(upperLengthError,Math.abs(length(q.hip,q.upperKnee)-length(l.hip,l.knee)));lowerLengthError=Math.max(lowerLengthError,Math.abs(length(q.lowerKnee,q.ankle)-length(l.knee,l.foot)));footBelowFloor=Math.max(footBelowFloor,l.foot[1]-q.foot[1]);
            const a=new THREE.Vector3(...q.hip).sub(new THREE.Vector3(...q.upperKnee)).normalize(),b=new THREE.Vector3(...q.foot).sub(new THREE.Vector3(...q.upperKnee)).normalize();angles.push(Math.acos(Math.min(1,Math.max(-1,a.dot(b)))));
          }
          kneeAngleRange=Math.max(kneeAngleRange,Math.max(...angles)-Math.min(...angles));
        }
        return{legs:legs.length,minKneeY,minAnkleY,hipGap,kneeGap,ankleGap,upperLengthError,lowerLengthError,footBelowFloor,kneeAngleRange};
      };
      const gun=(pose)=>{
        const mesh=r.guns,rig=mesh.geometry.userData.rig.weapon;
        const points=m.gpuSample(mesh,pose.packedPose,[{position:rig.base,group:rig.group},{position:rig.muzzle,group:rig.group}]);
        const matrix=new THREE.Matrix4().fromArray(Array.from(mesh.instanceMatrix.array.slice(0,16)));
        const world=points.map(p=>new THREE.Vector3(...p).applyMatrix4(matrix)),delta=world[1].clone().sub(world[0]);
        return{angle:Math.atan2(delta.z,delta.x),aim:m.game.players[0].angle,error:Math.abs(arc(Math.atan2(delta.z,delta.x),m.game.players[0].angle))};
      };
      for(const [name,x,y] of [['forward',1,0],['backward',-1,0],['strafe',0,-1]]){
        m.reset();const samples=[];let gunError=0;
        for(let i=0;i<20;i++){m.tick(m.input(x,y),3,false);const p=get();samples.push({pose:p,joints:jointSample(r.soldiers,p.packedPose)});gunError=Math.max(gunError,gun(p).error);}
        const report=analyze(r.soldiers,samples),worldTravel=Math.atan2(y,x);let best=0,aligned=0;
        for(let i=8;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
          const a=samples[i].joints[0].foot,b=samples[j].joints[0].foot,d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));d.y=0;
          if(d.length()>best){best=d.length();d.transformDirection(new THREE.Matrix4().fromArray(samples[i].pose.instanceMatrix));aligned=Math.abs(d.x*Math.cos(worldTravel)+d.z*Math.sin(worldTravel));}
        }
        check(name+' actual GPU hip/knee/ankle articulation',report.hipGap<.003&&report.kneeGap<.003&&report.ankleGap<.01&&report.upperLengthError<.003&&report.lowerLengthError<.003&&report.footBelowFloor<.005&&report.kneeAngleRange>.08,report);
        check(name+' foot cycle follows displacement while muzzle follows aim',best>.08&&aligned>.9&&gunError<.01,{horizontalFootTravel:best,travelAlignment:aligned,maxGunAngleError:gunError});
      }
      // Verify hand closure against the active weapon's actual transformed grips.
      for(const weapon of Object.keys(r.weapons)){
        m.reset();m.game.players[0].weapon=weapon;m.tick(m.input(0,-1),18,false);const p=get(),arms=r.soldiers.geometry.userData.rig.arms,rig=r.guns.geometry.userData.rig.weapon;
        const handPoints=m.gpuSample(r.soldiers,p.packedPose,arms.flatMap(a=>[{position:a.elbow,group:a.groups[0]},{position:a.elbow,group:a.groups[1]},{position:a.hand,group:a.groups[1]},{position:a.hand,group:a.groups[2]}]));
        const grips=m.gpuSample(r.guns,p.packedPose,[{position:rig.support,group:rig.group},{position:rig.trigger,group:rig.group}]);
        const gaps=arms.map((_,i)=>({elbow:length(handPoints[i*4],handPoints[i*4+1]),wrist:length(handPoints[i*4+2],handPoints[i*4+3]),grip:length(handPoints[i*4+3],grips[i])}));
        check(weapon+' both hands stay attached to weapon',gaps.every(g=>g.elbow<.003&&g.wrist<.01&&g.grip<.003),gaps);
      }
      const species=[];
      for(const type of ['crawler','runner','spitter','brute','boss']){
        m.reset();Object.assign(m.game.players[0],{x:13,y:3});m.enemy(type);m.render(0);const samples=[],mesh=r.monsters[type].body;
        for(let i=0;i<24;i++){m.tick(m.input(),3,false);const p=get('enemy');if(!p.packedPose)throw new Error('Enemy fixture unexpectedly culled');samples.push({pose:p,joints:jointSample(mesh,p.packedPose)});}
        const report=analyze(mesh,samples),start=samples[0].pose,end=samples[samples.length-1].pose;
        report.type=type;report.phaseTravel=end.phase-start.phase;report.distance=end.distance-start.distance;report.gaitUniform=mesh.material.userData.rigUniforms.rigGait.value.toArray();
        check(type+' actual GPU jointed gait',report.hipGap<.003&&report.kneeGap<.003&&report.ankleGap<.01&&report.upperLengthError<.003&&report.lowerLengthError<.003&&report.footBelowFloor<.005&&report.kneeAngleRange>.04,report);species.push(report);
      }
      // Exercise the valid packed-pose operating envelope, including foot
      // targets that a short natural clip may not happen to reach. These are
      // direct GPU outputs, not reimplemented reachability/IK calculations.
      const envelopes=[];
      for(const [type,mesh] of [['human',r.soldiers],...Object.entries(r.monsters).map(([type,pool])=>[type,pool.body])]){
        let minKneeY=Infinity,minAnkleY=Infinity,maxHipGap=0,maxKneeGap=0,maxAnkleGap=0,belowFloor=0,worstPose=null,worstKneePose=null,worstKneeJoints=null,count=0;
        const legs=mesh.geometry.userData.rig.legs;
        for(const speed of [.2,.6,1,1.25])for(const direction of [0,Math.PI/2,Math.PI])for(const lowerHeading of [0,1.05])for(let step=0;step<8;step++){
          const packed=[step/8,speed,direction,lowerHeading],sample=jointSample(mesh,packed);count++;
          sample.forEach((q,i)=>{minKneeY=Math.min(minKneeY,q.upperKnee[1],q.lowerKnee[1]);minAnkleY=Math.min(minAnkleY,q.ankle[1]);maxHipGap=Math.max(maxHipGap,length(q.hip,q.hipSocket));const ankle=length(q.ankle,q.foot);const knee=length(q.upperKnee,q.lowerKnee);if(knee>maxKneeGap){maxKneeGap=knee;worstKneePose=packed.slice();worstKneeJoints={...q,rest:legs[i]};}if(ankle>maxAnkleGap){maxAnkleGap=ankle;worstPose=packed.slice();}belowFloor=Math.max(belowFloor,legs[i].foot[1]-q.foot[1]);});
        }
        envelopes.push({type,poses:count,minKneeY,minAnkleY,maxHipGap,maxKneeGap,maxAnkleGap,belowFloor,worstPose,worstKneePose,worstKneeJoints});
      }
      check('full pose envelope keeps all joints connected and feet above ground',envelopes.every(e=>e.maxHipGap<.003&&e.maxKneeGap<.003&&e.maxAnkleGap<.01&&e.belowFloor<.005),envelopes);
      const runner=species.find(s=>s.type==='runner'),brute=species.find(s=>s.type==='brute');
      check('runner and heavy enemy have distinct cadence and gait',runner.phaseTravel>brute.phaseTravel*1.5&&JSON.stringify(runner.gaitUniform)!==JSON.stringify(brute.gaitUniform),{runner,brute});
      // No animation field is synthesized here: both values come from uploads.
      m.reset();for(let i=0;i<16;i++)m.tick(m.input(),3,false);const idlePose=get(),idleFeet=jointSample(r.soldiers,idlePose.packedPose),idleBody=m.gpuSample(r.soldiers,idlePose.packedPose,[{position:[0,1.4,0],group:0}])[0];for(let i=0;i<8;i++)m.tick(m.input(),3,false);const idleAfter=jointSample(r.soldiers,get().packedPose),idleBodyAfter=m.gpuSample(r.soldiers,get().packedPose,[{position:[0,1.4,0],group:0}])[0];
      check('stationary GPU feet are planted',idleFeet.every((v,i)=>length(v.foot,idleAfter[i].foot)<1e-5));
      check('idle breath is subtle while feet stay planted',length(idleBody,idleBodyAfter)>.0005&&length(idleBody,idleBodyAfter)<.02,{idleBody,idleBodyAfter});m.game.pause();m.render(.1);const frozenBody=m.gpuSample(r.soldiers,get().packedPose,[{position:[0,1.4,0],group:0}])[0];check('paused GPU idle breath freezes with simulation time',length(idleBodyAfter,frozenBody)<1e-5);
      m.reset();const nearPi=Math.PI-.04;for(let i=0;i<24;i++)m.tick(m.input(0,0,Math.cos(nearPi),Math.sin(nearPi)),3,false);const turnStart=get();const afterPi=-Math.PI+.04;m.tick(m.input(0,0,Math.cos(afterPi),Math.sin(afterPi)));const turnEnd=get();
      check('heading transition uses the short arc across ±π',Math.abs(arc(turnEnd.facingAngle,turnStart.facingAngle))<.04&&Math.abs(arc(turnEnd.facingAngle,afterPi))<Math.abs(arc(turnStart.facingAngle,afterPi)),{turnStart,turnEnd});
      m.reset();const e=m.enemy('runner');m.render(0);m.tick(m.input(),12,false);m.game.damageEnemy(e,e.hp+1000,1);m.game.enemies=[];m.render(0);const corpseMesh=r.monsters.runner.body,corpsePose=Array.from(corpseMesh.geometry.attributes.instancePose.array.slice(0,4)),corpseBefore=jointSample(corpseMesh,corpsePose);for(let i=0;i<8;i++)m.tick(m.input(),3,false);const corpseAfter=jointSample(corpseMesh,Array.from(corpseMesh.geometry.attributes.instancePose.array.slice(0,4)));
      check('corpse shader freezes every leg',corpsePose[0]>=4&&corpsePose[1]===0&&corpseBefore.every((v,i)=>Object.keys(v).every(key=>length(v[key],corpseAfter[i][key])<1e-5)),{corpsePose});
      m.reset();return checks;
    });
    result.checks.push(...joints);console.log("PASS shipping-GPU rig assertions: "+joints.length);await page.evaluate(()=>__motion.disposeSamples());
    const restoredPose=await page.evaluate(()=>{const m=__motion,r=m.renderer;m.tick(m.input(0,-1),12,false);const pose=r.inspectActor('player',1);window.__motionRestore=r.renderer.getContext().getExtension('WEBGL_lose_context');if(!__motionRestore)throw new Error('Test backend must allow context loss');__motionRestore.loseContext();return pose;});
    await page.waitForFunction(()=>__motion.renderer.contextLost===true);
    await page.evaluate(()=>__motionRestore.restoreContext());await page.waitForFunction(()=>!__motion.renderer.contextLost);
    const afterRestore=await page.evaluate(()=>{__motion.render(0);return __motion.renderer.inspectActor('player',1);});
    assert.deepEqual(afterRestore,restoredPose,'Context restore must preserve the frozen uploaded locomotion pose');result.checks.push({name:'context restore preserves pose',details:afterRestore});
    const restoredMap=await page.evaluate(()=>{__motion.game.loadStage(1);__motion.render(0);__motion.reset();for(const weapon of Object.keys(__motion.renderer.weapons)){__motion.game.players[0].weapon=weapon;__motion.render(0);}return{active:__motion.renderer.active,calls:__motion.renderer.stats.calls,stage:__motion.game.stage};});assert.ok(restoredMap.active&&restoredMap.calls>0);assert.equal(restoredMap.stage,0);result.checks.push({name:'map switch and new game after context restore have no invalid old-buffer operations',details:restoredMap});
    const programs=await page.evaluate(()=>{const r=__motion.renderer,gl=r.renderer.getContext();if(gl.getError())throw new Error('WebGL error before program introspection');const programs=r.renderer.info.programs.map(p=>{if(!gl.isProgram(p.program))throw new Error('Program audit found stale WebGLProgram');let slots=0;for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_ATTRIBUTES);i++){const a=gl.getActiveAttrib(p.program,i),size=a.size*(a.type===gl.FLOAT_MAT4?4:a.type===gl.FLOAT_MAT3?3:a.type===gl.FLOAT_MAT2?2:1);slots=Math.max(slots,gl.getAttribLocation(p.program,a.name)+size);}return{slots,runnable:p.diagnostics?.runnable!==false};});const auditError=gl.getError();if(auditError)throw new Error('WebGL program audit error '+auditError);return programs;});
    assert.ok(programs.length>0&&programs.every(p=>p.slots>0&&p.slots<=9&&p.runnable),'Articulated actor shaders must keep the nine-slot budget and compile/link');result.checks.push({name:'actual shader program budgets',details:programs});



  }
  if(options.record){
    const frames=path.join(output,'frames');await mkdir(frames,{recursive:true});
    const chapters=[
      {name:'静止待机 · 脚掌落地',control:'移动 0 · 瞄准 →',seconds:.8,kind:'idle'},
      {name:'前进 · 上身继续瞄准',control:'移动 → · 瞄准 →',seconds:1.6,kind:'forward'},
      {name:'倒退 · 枪口保持方向',control:'移动 ← · 瞄准 →',seconds:1.6,kind:'backward'},
      {name:'侧移 · 下肢跟随位移',control:'移动 ↑ · 瞄准 →',seconds:1.6,kind:'strafe'},
      {name:'松开控制 · 停步',control:'移动 0 · 瞄准 →',seconds:.8,kind:'stop'},
      {name:'顶住关闭闸门 · 不原地奔跑',control:'移动 → · 实际受阻',seconds:1.6,kind:'wall'},
      {name:'越过 ±180° 瞄准',control:'短弧转身',seconds:.8,kind:'turn'},
      {name:'斜向移动 · 双手持枪',control:'移动 ↘ · 瞄准 →',seconds:1.6,kind:'diagonal'},
      ...[['crawler','爬行者'],['runner','疾行者'],['spitter','喷吐者'],['brute','重甲兽'],['boss','母巢守卫']].map(([type,name])=>({name:name+' · 真实追击位移',control:'实际 AI 位移',seconds:2.4,kind:'enemy',type})),
      {name:'倒地后的静止姿态',control:'尸体停止步态',seconds:2,kind:'corpse'}
    ];
    const fps=20,totalFrames=chapters.reduce((n,c)=>n+Math.round(c.seconds*fps),0),trace=[];let frame=0;
    await page.evaluate(()=>{const r=__motion.renderer,original=r.updateCamera.bind(r);__motion.originalCamera=original;r.time=0;r.updateCamera=function(g,dt){const target=__motion.view==='enemy'?g.enemies[0]||__motion.lastEnemy:g.players[0];const copy={...g.players[0],x:target?.x??g.players[0].x,y:target?.y??g.players[0].y};this.cameraCenter.x=copy.x;this.cameraCenter.y=copy.y;original({phase:g.phase,map:g.map,players:[copy]},dt);this.camera.zoom=2.4;this.camera.updateProjectionMatrix();};__motion.reset();});
    for(let index=0;index<chapters.length;index++){
      const chapter=chapters[index],length=Math.round(chapter.seconds*fps);
      for(let local=0;local<length;local++,frame++){
        const sample=await page.evaluate(({chapter,index,local,frame,totalFrames})=>{
          const m=__motion,g=m.game,p=g.players[0];let input=m.input();
          if(local===0){
            if(chapter.kind==='wall'){Object.assign(p,{x:15.58,y:14.5,angle:0});}
            if(chapter.kind==='diagonal'){Object.assign(p,{x:8,y:10,angle:0});}
            if(chapter.kind==='enemy'){Object.assign(p,{x:13,y:3,angle:Math.PI/2});m.enemy(chapter.type);m.view='enemy';}
            if(chapter.kind==='corpse'){const e=g.enemies[0];m.lastEnemy={...e};g.damageEnemy(e,e.hp+1000,1);g.enemies=[];g.particles=[];g.pickups=[];g.bullets=[];m.view='enemy';}
          }
          if(chapter.kind==='forward'||chapter.kind==='wall')input=m.input(1,0);
          if(chapter.kind==='backward')input=m.input(-1,0);
          if(chapter.kind==='strafe')input=m.input(0,-1);
          if(chapter.kind==='turn'){const a=local<8?Math.PI-.05:-Math.PI+.05;input=m.input(0,0,Math.cos(a),Math.sin(a));}
          if(chapter.kind==='diagonal')input=m.input(.707,.707);
          m.tick(input,3,false);
          document.getElementById('chapter').textContent=chapter.name;document.getElementById('control').textContent=chapter.control;document.getElementById('progress').style.width=((frame+1)/totalFrames*100)+'%';
          return{frame,chapter:index,elapsed:g.elapsed,input,player:{x:p.x,y:p.y,angle:p.angle,moving:p.moving},enemy:g.enemies[0]?{type:g.enemies[0].type,x:g.enemies[0].x,y:g.enemies[0].y,angle:g.enemies[0].angle,moving:g.enemies[0].moving}:null,phase:g.phase};
        },{chapter,index,local,frame,totalFrames});
        trace.push(sample);await page.screenshot({path:path.join(frames,`frame-${String(frame).padStart(5,'0')}.png`)});
      }
      console.log('CAPTURE '+(index+1)+'/'+chapters.length+': '+chapter.name);
    }
    const movie=path.join(output,'motion.mp4');await command('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate',String(fps),'-i',path.join(frames,'frame-%05d.png'),'-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',movie]);
    assert.ok((await stat(movie)).size<15*1024*1024,'Inspection clip must remain mobile-download friendly');
    if(options['compare-trace'])assert.deepEqual(trace,JSON.parse(await readFile(options['compare-trace'],'utf8')),'Before/after recordings must have identical inputs and simulated state on every frame');
    await writeFile(path.join(output,'motion-trace.json'),JSON.stringify(trace)+'\n');result.recording={file:movie,width:640,height:720,fps,frames:frame,seconds:frame/fps,bytes:(await stat(movie)).size,traceSha256:sha(JSON.stringify(trace)),chapters};
  }
  assert.deepEqual(errors,[]);assert.deepEqual(shaderErrors,[]);assert.deepEqual(networkErrors,[]);assert.deepEqual(await manifest(),assetHashes,'Capture/test source must remain frozen');
  await page.evaluate(()=>{__motion.disposeSamples();__motion.renderer.dispose();if(__motion.renderer.actorStates?.size)throw new Error('Disposed renderer retained actor states');});await writeFile(path.join(output,'animation.json'),JSON.stringify(result,null,2)+'\n');await rm(path.join(output,'failure.json'),{force:true});console.log('PASS motion fixture: '+path.join(output,'animation.json'));
}catch(error){await rm(path.join(output,'animation.json'),{force:true});await writeFile(path.join(output,'failure.json'),JSON.stringify({...result,passed:false,error:error.message},null,2)+'\n');throw error;}finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
