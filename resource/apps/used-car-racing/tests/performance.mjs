// Opt-in, reproducible draw-call comparison against an explicit local Git commit.
// Example: node tests/performance.mjs --baseline <40-char SHA> --output /tmp/used-car-perf
// Run serially: SwiftShader contexts contend for the same CPU/GPU resources.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, mkdir, writeFile, appendFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
const execute=promisify(execFile);
const options={output:process.env.GAME_PERFORMANCE_OUTPUT||'/tmp/puretv-used-car-performance',samples:8};
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];
 if(key==='--help'){console.log('Usage: node tests/performance.mjs --baseline <40-char commit SHA> [--output directory] [--samples 3..20]');process.exit(0);}
 if(!['--baseline','--output','--samples'].includes(key)||!process.argv[i+1])throw new Error('Unknown or incomplete option: '+key);
 options[key.slice(2)]=process.argv[++i];
}
assert.match(options.baseline||'',/^[0-9a-f]{40}$/i,'An explicit full baseline SHA is required; the benchmark never fetches history.');
options.samples=Number(options.samples);assert.ok(Number.isInteger(options.samples)&&options.samples>=3&&options.samples<=20);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),assetRoot=new URL('../src/main/assets/',import.meta.url),assetPrefix='resource/apps/used-car-racing/src/main/assets/';
const git=async args=>(await execute('git',args,{cwd:repository,maxBuffer:32*1024*1024,encoding:'buffer'})).stdout;
await git(['cat-file','-e',options.baseline+'^{commit}']);
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url)),{chromium}=require('playwright');
await mkdir(options.output,{recursive:true});
const resultPath=path.join(options.output,'performance.json'),logPath=path.join(options.output,'performance.log');await writeFile(logPath,'');
const log=async message=>{console.log(message);await appendFile(logPath,message+'\n');};
const html='<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#08121a;overflow:hidden}canvas{width:100vw;height:100vh}</style></head><body><canvas id="scene"></canvas><script src="three.min.js"></script><script src="materials.js"></script><script src="tracks.js"></script><script src="game-model.js"></script><script src="vehicle-models.js"></script><script src="renderer-3d.js"></script></body></html>';
const baselineAssets=new Map();
const server=http.createServer(async(req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname.match(/^\/(baseline|live)\/(.*)$/);
 if(!route){res.writeHead(404).end();return;}
 const [,version,name]=route;
 if(!name){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(!/^(?:[a-z0-9.-]+\.js|textures\/[a-z0-9-]+\.(?:jpg|png))$/.test(name)){res.writeHead(404).end();return;}
 try{
  let bytes;
  if(version==='baseline'){if(!baselineAssets.has(name))baselineAssets.set(name,git(['show',options.baseline+':'+assetPrefix+name]));bytes=await baselineAssets.get(name);}
  else bytes=await readFile(new URL(name,assetRoot));
  res.setHeader('Content-Type',name.endsWith('.jpg')?'image/jpeg':name.endsWith('.png')?'image/png':'text/javascript');res.setHeader('Cache-Control','no-store');res.end(bytes);
 }catch(error){res.writeHead(404).end('Missing benchmark asset');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const viewport={width:960,height:540},report={baselineCommit:options.baseline,workingHead:String(await git(['rev-parse','HEAD'])).trim(),workingChanges:String(await git(['diff','--stat'])).trim(),viewport,warmupFrames:3,sampledFrames:options.samples,renderer:'Chromium WebGL 1 / ANGLE SwiftShader',timingNote:'renderSubmissionWallMs measures JavaScript render() elapsed wall time and may include driver waits. It is not GPU execution time, hardware FPS, or TV performance.',fixture:'All six original body models; s=220+16*i metres, lateral ±2.1m, speed24m/s, fixed colour/condition, identical chase camera and frozen simulation.',scenes:[],comparisons:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
function summarize(values){const sorted=[...values].sort((a,b)=>a-b);return {min:sorted[0],median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)],max:sorted.at(-1),samples:values};}
try{
 for(const version of ['baseline','live']){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|shader/i.test(message.text()))errors.push(message.text());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/');
  await page.evaluate(size=>{
   window.view=new UsedCarRenderer(document.getElementById('scene'),size);window.state={phase:'race',playerCount:1,trackId:'harbor',raceTime:5,racers:[]};window.draws=[];
   const draw=view.renderer.render;view.renderer.render=function(...args){const result=draw.apply(this,args);draws.push({calls:this.info.render.calls,triangles:this.info.render.triangles});return result;};
   window.setFixture=(track,players)=>{
    state.trackId=track;state.playerCount=players;state.racers=['compact','sedan','coupe','wagon','muscle','rally'].map((modelId,i)=>{
     const s=220+i*16,p=UsedCarTracks.sample(track,s),lateral=i%2?2.1:-2.1;
     return {id:i,playerIndex:i<players?i:null,x:p.x+p.nx*lateral,y:p.y,z:p.z+p.nz*lateral,s,yaw:p.heading,speed:24,steerAngle:.08,wheelSpin:5,roll:.02,pitch:.01,spec:{modelId,color:[0xc39f62,0x365b73,0xb84c44,0x638672,0x262d37,0xa5bdc5][i]},condition:{bodyDamage:.1,rust:.2,brakeBroken:false},telemetry:{brake:i===0?.4:0,slipAngle:0}};
    });view.cameraStates=[];
   };
   window.drawFixture=async()=>{await new Promise(requestAnimationFrame);draws.length=0;const started=performance.now(),ok=view.render(state,1/60),elapsed=performance.now()-started;return {ok,error:view.error,stats:{...view.stats},draws:draws.slice(),renderSubmissionWallMs:elapsed,memory:{...view.renderer.info.memory},programs:view.renderer.info.programs.length};};
  },viewport);
  await page.evaluate(()=>view.materialLibrary.ready);assert.deepEqual(await page.evaluate(()=>view.materialLibrary.errors),[]);
  assert.equal(await page.evaluate(()=>view.renderer.getContext() instanceof WebGLRenderingContext),true);
  for(const track of ['harbor','ridge','solar'])for(const players of [1,2]){
   await page.evaluate(({track,players})=>setFixture(track,players),{track,players});
   for(let i=0;i<3;i++){const warm=await page.evaluate(()=>drawFixture());assert.equal(warm.ok,true,warm.error);}
   const frames=[];
   for(let i=0;i<options.samples;i++){
    const frame=await page.evaluate(()=>drawFixture());assert.equal(frame.ok,true,frame.error);assert.equal(frame.draws.length,players);
    assert.equal(frame.stats.calls,frame.draws.reduce((sum,draw)=>sum+draw.calls,0),'Total calls must include every split-screen view');
    assert.equal(frame.stats.triangles,frame.draws.reduce((sum,draw)=>sum+draw.triangles,0));
    assert.equal(frame.stats.views,players);frames.push(frame);
   }
   const last=frames.at(-1),scene={version,track,players,calls:last.stats.calls,callsPerView:last.draws.map(draw=>draw.calls),triangles:last.stats.triangles,trianglesPerView:last.draws.map(draw=>draw.triangles),memory:last.memory,programs:last.programs,materialBytes:last.stats.materialBytes,renderSubmissionWallMs:summarize(frames.map(frame=>frame.renderSubmissionWallMs))};
   for(const frame of frames){assert.equal(frame.stats.calls,scene.calls,'Frozen scene has stable call count');assert.equal(frame.stats.triangles,scene.triangles);assert.deepEqual(frame.memory,scene.memory,'Sampling must not allocate new GPU resources');}
   report.scenes.push(scene);await writeFile(resultPath,JSON.stringify(report,null,2)+'\n');
   if(players===1)await page.screenshot({timeout:60000,path:path.join(options.output,'performance-'+version+'-'+track+'.png')});
   await log('PASS '+version+' '+track+' '+players+'P calls='+scene.calls+' perView='+scene.callsPerView.join('+')+' triangles='+scene.triangles+' textures='+scene.memory.textures+' renderSubmissionWallMs.median='+scene.renderSubmissionWallMs.median.toFixed(2));
  }
  assert.deepEqual(errors,[]);await page.evaluate(()=>view.dispose());await context.close();
 }
 for(const before of report.scenes.filter(scene=>scene.version==='baseline')){
  const after=report.scenes.find(scene=>scene.version==='live'&&scene.track===before.track&&scene.players===before.players),comparison={track:before.track,players:before.players,beforeCalls:before.calls,afterCalls:after.calls,callReductionPercent:Number((100*(1-after.calls/before.calls)).toFixed(2)),beforeTriangles:before.triangles,afterTriangles:after.triangles,triangleRatio:after.triangles/before.triangles};report.comparisons.push(comparison);
  assert.ok(after.calls<=before.calls*.60,'Draw calls should fall by at least 40%: '+JSON.stringify(comparison));
  assert.ok(after.triangles<=before.triangles*1.03,'Batching should not inflate geometry beyond 3%: '+JSON.stringify(comparison));
  assert.ok(after.triangles<350000*after.players,'Per-view geometry budget is bounded');
 }
 report.passed=true;await log('PASS all six identical-scene comparisons: >=40% fewer calls, geometry increase <=3%, split-view totals and stable GPU allocations.');await writeFile(resultPath,JSON.stringify(report,null,2)+'\n');
}catch(error){report.passed=false;report.error=String(error.stack||error);await writeFile(resultPath,JSON.stringify(report,null,2)+'\n');await log('FAIL '+report.error);throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
