// Deterministic real-WebGL renderer audit. The 96-actor case deliberately exceeds
// the game's 48-enemy simulation cap: it is a bounded renderer stress fixture.
// SwiftShader timings describe this host, never physical TV FPS.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const options={assets:fileURLToPath(new URL('../src/main/assets/',import.meta.url)),output:'/tmp/puretv-alien-shooter-performance',label:'current',samples:12,warmup:3,regressions:false};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i].replace(/^--/,'');
  if(key==='regressions'){options.regressions=true;continue;}
  if(key==='inventory-only'){options.inventoryOnly=true;continue;}
  assert.ok(['assets','output','label','samples','warmup','compare'].includes(key),'Unknown option '+key);
  options[key]=['samples','warmup'].includes(key)?Number(process.argv[++i]):process.argv[++i];
}
if(options.inventoryOnly){options.samples=1;options.warmup=0;}
assert.ok(Number.isInteger(options.samples)&&options.samples>=(options.inventoryOnly?1:6)&&options.samples<=120);
assert.ok(Number.isInteger(options.warmup)&&options.warmup>=(options.inventoryOnly?0:1)&&options.warmup<=30);
const assets=path.resolve(options.assets),output=path.resolve(options.output);await mkdir(output,{recursive:true});
const sha=data=>createHash('sha256').update(data).digest('hex');
async function assetManifest(){const names=(await readdir(assets,{recursive:true,withFileTypes:true})).filter(e=>e.isFile()).map(e=>path.relative(assets,path.join(e.parentPath||e.path,e.name))).sort();const result={};for(const n of names)result[n]=sha(await readFile(path.join(assets,n)));return result;}
const manifest=await assetManifest();
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(relative==='__benchmark'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><style>html,body{margin:0;background:#10191b}canvas{display:block;width:1280px;height:720px}</style></head><body><canvas id="battlefield" width="1280" height="720"></canvas></body></html>');return;}
  if(relative==='favicon.ico'){res.writeHead(204).end();return;}
  const target=path.resolve(assets,relative);if(!target.startsWith(assets+path.sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(await readFile(target));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling']});
const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],networkErrors=[],shaderErrors=[];page.on('console',message=>{if(message.type()==='error'&&/WebGL|GL_INVALID|shader|program/i.test(message.text()))shaderErrors.push(message.text());});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)networkErrors.push({url:r.url(),status:r.status()});});
const result={label:options.label,resolution:[1280,720],backend:'Chromium / ANGLE SwiftShader software WebGL',physicalTvTested:false,timingMeaning:'CPU renderer submission and 1-pixel readback-synchronized software frame milliseconds on this host. Not TV FPS and not a hardware GPU benchmark.',fixtures:'Fixed deterministic real game maps and renderer states. 48 is the gameplay enemy cap; 96 is intentionally an over-cap renderer stress fixture. Simulation is frozen, actors are not removed for optimization.',samples:options.samples,warmup:options.warmup,inventoryOnly:!!options.inventoryOnly,assets:manifest,scenes:[],regressions:{}};
try{
  await page.goto(base+'/__benchmark');
  const html=await readFile(path.join(assets,'tv.html'),'utf8'),declared=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
  const scripts=declared.slice(0,declared.indexOf('renderer.js')+1).filter(n=>n!=='bootstrap.js');
  assert.ok(scripts.includes('three.min.js')&&scripts.includes('renderer.js'),'Renderer script declaration required');
  for(const name of scripts)await page.addScriptTag({url:base+'/'+name});
  await page.evaluate(()=>{
    window.__bench={};
    __bench.quantile=(values,q)=>{const s=values.slice().sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor((s.length-1)*q))];};
    __bench.capture=()=>{const r=__bench.renderer,gl=r.renderer.getContext(),pixels=new Uint8Array(r.width*r.height*4);gl.readPixels(0,0,r.width,r.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
    __bench.snapshot=g=>JSON.stringify({stage:g.stage,phase:g.phase,map:g.map,players:g.players,enemies:g.enemies,events:g.events,eventSerial:g.eventSerial,bullets:g.bullets,particles:g.particles,pickups:g.pickups,decals:g.decals,grenades:g.grenades});
    __bench.fixture=(stage,count,distribution='map-wide')=>{
      const g=new AlienShooterGame({seed:19790503});g.start();g.loadStage(stage);g.phase='playing';
      const points=[];for(let y=2;y<=32;y+=1.4)for(let x=2;x<=46;x+=1.4)if(!g.blocked(x,y,.7))points.push({x,y});
      const center=points.slice().sort((a,b)=>Math.hypot(a.x-24,a.y-17)-Math.hypot(b.x-24,b.y-17))[0];
      Object.assign(g.players[0],{x:center.x,y:center.y,angle:-.45,connected:true,moving:true,weapon:'minigun',fireFlash:.05});
      const actorPoints=distribution==='dense'?points.filter(p=>Math.abs(p.x-center.x)<=10&&Math.abs(p.y-center.y)<=5):points;
      const kinds=['crawler','runner','spitter','brute','boss'];
      g.enemies=Array.from({length:count},(_,i)=>{const p=actorPoints[(i*37+17)%actorPoints.length],type=i===0?'boss':kinds[i%4],spec=AlienShooterWorld.enemyTypes[type];return{id:1000+i,type,x:p.x,y:p.y,radius:spec.radius,angle:(i*.7)%6.28,hp:spec.hp,maxHp:spec.hp,moving:true,hitFlash:i===1?.1:0};});
      // Every scene includes death events of all five species, impacts, drops,
      // tracer lines, a grenade and explosions; these are explicit fixtures.
      g.events=[];g.eventSerial=0;
      g.pickups=Array.from({length:24},(_,i)=>({id:2000+i,type:['health','armor','ammo','credits','grenade'][i%5],x:points[(i*23+9)%points.length].x,y:points[(i*23+9)%points.length].y,amount:1,age:0}));
      g.decals=Array.from({length:32},(_,i)=>({id:3000+i,type:i%3?'blood':'scorch',x:points[(i*19+3)%points.length].x,y:points[(i*19+3)%points.length].y,size:i%3?1.1:2.1,angle:i*.4}));
      g.bullets=Array.from({length:24},(_,i)=>({id:4000+i,x:center.x-6+(i%8)*1.5,y:center.y-4+Math.floor(i/8)*2,vx:20,vy:3,enemy:i%3===0,type:i%4?'bullet':'plasma'}));
      g.particles=Array.from({length:64},(_,i)=>({id:5000+i,x:center.x-7+(i%12)*1.2,y:center.y-4+Math.floor(i/12)*1.3,type:i%11===0?'explosion':i%3?'spark':'blood',life:.4,maxLife:.9,size:i%11===0?1.4:.15}));
      g.grenades=[{id:6000,x:center.x+2,y:center.y+1,age:.4,fuse:1.2}];
      __bench.game=g;return g;
    };
    __bench.resourceInfo=()=>{
      const r=__bench.renderer,geometries=new Set(),textures=new Set(r.textures||[]),materials=new Set();let visibleMeshes=0,drawGeometryTriangles=0,activeInstanceBytes=0;
      r.scene.traverse(o=>{if(o.isInstancedMesh&&o.visible&&o.count){activeInstanceBytes+=o.count*(16+(o.instanceColor?3:0))*4;for(const attr of Object.values(o.geometry.attributes))if(attr.isInstancedBufferAttribute)activeInstanceBytes+=o.count*attr.itemSize*attr.array.BYTES_PER_ELEMENT;}});
      r.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const key of Object.keys(m))if(m[key]?.isTexture)textures.add(m[key]);}}if(o.isMesh&&o.visible&&(!o.isInstancedMesh||o.count)){visibleMeshes++;drawGeometryTriangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
      let geometryBytes=0;for(const g of geometries){for(const a of Object.values(g.attributes))geometryBytes+=a.array?.byteLength||0;geometryBytes+=g.index?.array.byteLength||0;}
      let estimatedTextureBytes=0,ownedTextureBytes=0;const textureSizes=[];for(const t of textures){const image=t.image||{},width=image.width||0,height=image.height||0,bytes=width*height*4*(t.generateMipmaps?4/3:1),uploaded=!!r.renderer.properties.get(t).__webglTexture;ownedTextureBytes+=bytes;if(uploaded)estimatedTextureBytes+=bytes;textureSizes.push({width,height,mipmaps:t.generateMipmaps,uploaded});}
      const gl=r.renderer.getContext(),programAttributes=r.renderer.info.programs.map(program=>{const attributes=[];for(let i=0;i<gl.getProgramParameter(program.program,gl.ACTIVE_ATTRIBUTES);i++){const a=gl.getActiveAttrib(program.program,i);attributes.push({name:a.name,location:gl.getAttribLocation(program.program,a.name),slots:a.size*(a.type===gl.FLOAT_MAT4?4:a.type===gl.FLOAT_MAT3?3:a.type===gl.FLOAT_MAT2?2:1)});}return{name:program.name,slots:attributes.reduce((max,a)=>Math.max(max,a.location+a.slots),0),attributes};});
      return{maxProgramAttributeSlots:Math.max(0,...programAttributes.map(p=>p.slots)),programAttributes,uploadedGeometries:r.renderer.info.memory.geometries,uploadedTextures:r.renderer.info.memory.textures,shaderPrograms:r.renderer.info.programs.length,sceneGeometries:geometries.size,sceneMaterials:materials.size,sceneTextures:textures.size,geometryBufferBytes:geometryBytes,estimatedTextureBytes:Math.round(estimatedTextureBytes),ownedTextureBytes:Math.round(ownedTextureBytes),textureSizes,visibleMeshes,activeInstanceBytes,submittedMeshTriangles:drawGeometryTriangles};
    };
  });
  const preload=await page.evaluate(async()=>{const started=performance.now();if(window.AlienShooterBakedLoader)await AlienShooterBakedLoader.load();return{milliseconds:performance.now()-started,used:!!window.AlienShooterBakedLoader};});result.assetPreload=preload;
  const initial=await page.evaluate(()=>{const t=performance.now();__bench.renderer=new AlienShooterRenderer(document.querySelector('canvas'));const r=__bench.renderer;const gl=r.renderer?.getContext();__bench.uploadBytes=0;if(gl)for(const name of ['bufferData','bufferSubData']){const original=gl[name].bind(gl);gl[name]=function(...args){const payload=args[name==='bufferData'?1:2];__bench.uploadBytes+=typeof payload==='number'?payload:payload?.byteLength||0;return original(...args);};}return{constructorMs:performance.now()-t,error:r.error,failed:r.failed,glVendor:r.renderer?.getContext().getParameter(r.renderer.getContext().VENDOR),glRenderer:r.renderer?.getContext().getParameter(r.renderer.getContext().RENDERER)};});
  assert.equal(initial.failed,false,initial.error);result.startup=initial;
  await page.waitForFunction(()=>!__bench.renderer.pendingTextures,{timeout:30000});
  for(const stage of [0,1,2])for(const distribution of ['dense','map-wide'])for(const count of [48,96]){
    const prepared=await page.evaluate(({stage,count,distribution})=>{
      const r=__bench.renderer,g=__bench.fixture(stage,count,distribution),before=performance.now();r.time=4;r.render(g,0);
      // Register genuine death event shape after renderer has acknowledged map.
      for(let i=0;i<10;i++){const e=g.enemies[(i*3)%g.enemies.length];g.events.push({id:++g.eventSerial,kind:'enemy-death',enemyType:['crawler','runner','spitter','brute','boss'][i%5],x:e.x,y:e.y});}
      r.cameraCenter.x=g.players[0].x;r.cameraCenter.y=g.players[0].y;r.time=4;r.render(g,0);r.renderer.getContext().finish();return{mapBuildMs:performance.now()-before,fixture:__bench.snapshot(g)};
    },{stage,count,distribution});
    await page.waitForFunction(()=>!__bench.renderer.pendingTextures,{timeout:30000});
    const metrics=await page.evaluate(({samples,warmup})=>{
      const {renderer:r,game:g}=__bench,gl=r.renderer.getContext(),before=__bench.snapshot(g),submit=[],sync=[],uploads=[],pixel=new Uint8Array(4);
      for(let i=-warmup;i<samples;i++){r.time=4+(i+warmup)/60;__bench.uploadBytes=0;const started=performance.now();r.render(g,0);const rendered=performance.now();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);const completed=performance.now();if(i>=0){submit.push(rendered-started);sync.push(completed-started);uploads.push(__bench.uploadBytes);}}
      const unchanged=before===__bench.snapshot(g);r.time=4;r.render(g,0);gl.finish();
      return{simulationUnchanged:unchanged,glError:gl.getError(),shaderFailures:r.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).map(p=>p.name||'shader'),stats:{...r.stats},enemyCount:g.enemies.length,corpseCount:r.corpses.length,gpuBufferUploadBytes:{median:__bench.quantile(uploads,.5),p95:__bench.quantile(uploads,.95)},submitMs:{median:__bench.quantile(submit,.5),p95:__bench.quantile(submit,.95)},synchronizedFrameMs:{median:__bench.quantile(sync,.5),p95:__bench.quantile(sync,.95)},...__bench.resourceInfo()};
    },{samples:options.samples,warmup:options.warmup});
    assert.equal(metrics.glError,0,'No WebGL error after a benchmark scene');assert.deepEqual(metrics.shaderFailures,[],'Every shader program must compile/link');
    assert.equal(metrics.simulationUnchanged,true,'Rendering must not mutate simulation');assert.equal(metrics.enemyCount,count);assert.equal(metrics.corpseCount,10);
    if(distribution==='dense'&&metrics.stats.renderedEnemies!==undefined){assert.equal(metrics.stats.renderedEnemies,count,'Dense fixture must remain entirely visible');assert.equal(metrics.stats.renderedCorpses,10,'Dense fixture must retain all corpse silhouettes');}
    if(options.regressions){
      assert.ok(metrics.maxProgramAttributeSlots<=9,'Instanced shaders must not require more active attribute slots than 0.1.0: '+JSON.stringify(metrics.programAttributes));
      assert.ok(metrics.stats.calls<=32,'Optimized stress scene draw-call budget: '+JSON.stringify(metrics.stats));
      assert.ok(metrics.stats.triangles<=(count===48?60000:100000),'Optimized scene triangle budget');
      assert.ok(metrics.gpuBufferUploadBytes.p95<=65536,'Dynamic buffers must upload active ranges rather than the entire pool capacity');
      assert.ok(metrics.ownedTextureBytes<=32*1024*1024,'Owned uncompressed mipmapped texture estimate must stay within 32 MiB');
    }
    assert.ok(metrics.stats.calls>0&&metrics.stats.calls<=75,JSON.stringify(metrics.stats));assert.ok(metrics.stats.triangles>1000&&metrics.stats.triangles<200000);
    assert.equal(await page.evaluate(()=>__bench.renderer.width),1280,'Same render resolution must be retained');assert.equal(await page.evaluate(()=>__bench.renderer.height),720);
    const filename=options.inventoryOnly?null:`stage-${stage+1}-${distribution}-${count}.png`;if(filename)await page.locator('canvas').screenshot({path:path.join(output,filename)});
    const entry={stage,distribution,actors:count,fixtureHash:sha(prepared.fixture),mapBuildMs:prepared.mapBuildMs,...metrics,screenshot:filename};result.scenes.push(entry);
    console.log(JSON.stringify({stage,distribution,actors:count,calls:entry.stats.calls,triangles:entry.stats.triangles,submitMedianMs:entry.submitMs.median,syncMedianMs:entry.synchronizedFrameMs.median}));
  }
  if(options.regressions){
    const invariants=await page.evaluate(()=>{
      const r=__bench.renderer,g=__bench.fixture(0,48);r.time=4;r.render(g,0);r.cameraCenter.x=g.players[0].x;r.cameraCenter.y=g.players[0].y;r.render(g,0);
      const first={...r.stats},before=__bench.snapshot(g),offscreen=g.enemies.map(e=>({...e,x:-1000-e.id,y:-1000}));g.enemies=offscreen;r.render(g,0);const far={...r.stats};
      const free={x:g.players[0].x+2,y:g.players[0].y+1};g.enemies=[{...offscreen[0],x:free.x,y:free.y,type:'crawler',radius:.46,angle:0,hitFlash:0,moving:true}];g.pickups=[];g.particles=[];g.bullets=[];g.grenades=[];g.decals=[];g.players[0].moving=false;g.players[0].fireFlash=0;g.map.objectives=[];
      // Locomotion follows real displacement and simulation time. Merely changing
      // renderer wall time while an actor is stationary must no longer step legs.
      r.render(g,0);const a=__bench.capture();g.enemies[0].x+=.18;g.elapsed+=.1;r.render(g,.1);const b=__bench.capture();let changed=0,total=0;for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);total+=d;if(d>6)changed++;}
      let boundary=[];const center=r.screenToWorld(.5,.5);for(const edge of [[0,.5],[1,.5],[.5,0],[.5,1]]){const at=r.screenToWorld(...edge);g.enemies[0].x=at.x;g.enemies[0].y=at.y;r.render(g,0);boundary.push({edge,stats:{...r.stats}});}
      return{first,far,locomotionChangedPixels:changed,locomotionTotalDifference:total,boundary,center};
    });
    assert.ok(invariants.locomotionChangedPixels>20,'Real displacement must update the rendered actor; joint articulation is covered by animation.mjs');
    assert.equal(invariants.far.renderedEnemies,0,'Far off-screen enemies must not upload drawable instances');
    assert.equal(invariants.far.culledEnemies,48);assert.ok(invariants.far.calls<invariants.first.calls,'Culling removes draw submission, not simulation');
    for(const edge of invariants.boundary)assert.equal(edge.stats.renderedEnemies,1,'Actors centred on a camera edge must not disappear: '+JSON.stringify(edge));
    result.regressions.actorCullingAndAnimation=invariants;
    const churn=await page.evaluate(()=>{
      const r=__bench.renderer,values=[];for(let repeat=0;repeat<3;repeat++)for(let stage=0;stage<3;stage++){const g=__bench.fixture(stage,48);r.time=4;r.render(g,0);r.renderer.getContext().finish();values.push({stage,...__bench.resourceInfo()});}return values;
    });
    for(let i=6;i<9;i++){assert.equal(churn[i].uploadedGeometries,churn[i-3].uploadedGeometries,'Map switching must not accumulate GPU geometry');assert.equal(churn[i].uploadedTextures,churn[i-3].uploadedTextures,'Map switching must not accumulate GPU textures');}
    result.regressions.mapChurn=churn;
    const loss=await page.evaluate(()=>{const r=__bench.renderer,ext=r.renderer.getContext().getExtension('WEBGL_lose_context');if(!ext)throw new Error('Test backend must expose WebGL_lose_context');window.__restore=ext;ext.loseContext();return true;});assert.equal(loss,true);
    await page.waitForFunction(()=>__bench.renderer.contextLost===true);
    const frozen=await page.evaluate(()=>{const r=__bench.renderer,frames=r.stats.frames;r.render(__bench.game,.1);return{frames,after:r.stats.frames,game:__bench.snapshot(__bench.game)};});assert.equal(frozen.frames,frozen.after);
    await page.evaluate(()=>__restore.restoreContext());await page.waitForFunction(()=>!__bench.renderer.contextLost);
    const restored=await page.evaluate(()=>{const r=__bench.renderer;r.render(__bench.game,0);r.renderer.getContext().finish();return{active:r.active,frames:r.stats.frames,game:__bench.snapshot(__bench.game),stats:{...r.stats}};});assert.ok(restored.active&&restored.frames>frozen.frames);assert.equal(restored.game,frozen.game);result.regressions.contextLoss={pausedFrames:frozen.frames,restoredFrames:restored.frames,restoredCalls:restored.stats.calls};
  }
  const disposal=await page.evaluate(()=>{const r=__bench.renderer;let disposedTextures=0,disposedGeometry=0;for(const t of new Set(r.textures))t.addEventListener('dispose',()=>disposedTextures++);for(const g of new Set([...r.geometries,...r.worldGeometries]))g.addEventListener('dispose',()=>disposedGeometry++);const expectedTextures=new Set(r.textures).size,expectedGeometry=new Set([...r.geometries,...r.worldGeometries]).size;r.dispose();r.dispose();return{disposed:r.disposed,active:r.active,disposedTextures,disposedGeometry,expectedTextures,expectedGeometry};});
  assert.equal(disposal.disposed,true);assert.equal(disposal.active,false);assert.equal(disposal.disposedTextures,disposal.expectedTextures);assert.equal(disposal.disposedGeometry,disposal.expectedGeometry);result.regressions.disposal=disposal;
  assert.deepEqual(shaderErrors,[],'No Three.js/WebGL shader compile, link or command errors');assert.deepEqual(errors,[],'No unhandled renderer/browser errors');assert.deepEqual(networkErrors,[],'Every local baked asset must load');assert.deepEqual(await assetManifest(),manifest,'Freeze assets for the duration of a measured run');
  if(options.compare){const baseline=JSON.parse(await readFile(options.compare,'utf8'));assert.deepEqual(baseline.resolution,result.resolution);const comparisons=[];for(const scene of result.scenes){const old=baseline.scenes.find(s=>s.stage===scene.stage&&s.actors===scene.actors&&s.distribution===scene.distribution);assert.ok(old);assert.equal(scene.fixtureHash,old.fixtureHash,'Compare exactly the same actor/map/effect state');comparisons.push({stage:scene.stage,distribution:scene.distribution,actors:scene.actors,callsBefore:old.stats.calls,callsAfter:scene.stats.calls,callsReduction:1-scene.stats.calls/old.stats.calls,trianglesBefore:old.stats.triangles,trianglesAfter:scene.stats.triangles,trianglesReduction:1-scene.stats.triangles/old.stats.triangles,submitMedianMsBefore:old.submitMs.median,submitMedianMsAfter:scene.submitMs.median,synchronizedMedianMsBefore:old.synchronizedFrameMs.median,synchronizedMedianMsAfter:scene.synchronizedFrameMs.median,bufferUploadBytesBefore:old.gpuBufferUploadBytes?.median,bufferUploadBytesAfter:scene.gpuBufferUploadBytes.median,ownedTextureBytesBefore:old.ownedTextureBytes,ownedTextureBytesAfter:scene.ownedTextureBytes,uploadedTextureBytesBefore:old.estimatedTextureBytes,uploadedTextureBytesAfter:scene.estimatedTextureBytes});assert.ok(scene.stats.calls<=old.stats.calls,'Draw calls must not regress');assert.ok(scene.stats.triangles<old.stats.triangles,'Same-state triangle count must improve');}result.comparison=comparisons;}
  await writeFile(path.join(output,'performance.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS renderer performance audit: '+path.join(output,'performance.json'));
}finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
