// Real bundled pages and ordinary bridge input; synthetic Android Wi-Fi snapshots,
// not a device, TCP/NSD test, or performance measurement. No model or clock writes.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const repo=fileURLToPath(new URL('../../../',import.meta.url)),out=process.argv[2];
if(!out)throw new Error('Pass a fresh RAM output directory');
const {chromium}=createRequire(process.env.PURETV_PACKAGE||path.join(repo,'desktop/package.json'))('playwright');
const games={'alien-shooter':'AlienShooterHost','used-car-racing':'UsedCarHost','cozy-island':'CozyIslandHost','coast-kart':'CoastKartHost'};
await mkdir(out,{recursive:true});await copyFile(fileURLToPath(import.meta.url),path.join(out,'executed-browser-3d.mjs'));
const report={startedAt:new Date().toISOString(),method:'Unmodified bundled game with normal synthetic native bridge inputs and actual requestAnimationFrame; no model, time or camera writes.',physicalTvTested:false,physicalEsp32Tested:false,gameStateWrites:false,cases:[],sourceHashes:{}};
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const [slug,...parts]=name.slice(1).split('/');if(!games[slug]||parts.includes('..'))throw Error();const rel=parts.join('/')||'tv.html';const file=path.join(repo,'resource/apps',slug,'src/main/assets',rel);res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':rel.endsWith('.jpg')?'image/jpeg':'text/html');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
for(const [slug,host] of Object.entries(games).filter(([slug])=>!process.env.GAME_FILTER||process.env.GAME_FILTER.split(',').includes(slug))){
 const row={game:slug,status:'running',layouts:[],checks:[]};report.cases.push(row);
 const context=await browser.newContext({viewport:{width:960,height:540}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(({host})=>{
  window.__players=[{id:1,transport:'wifi',session:'first',connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0}];window.__reads=0;
  window[host]={getInfo:()=>JSON.stringify({language:'zh',url:'',qr:'',wifiController:{port:63485,addresses:['192.0.2.10'],state:'available',connected:1,inputActive:true}}),snapshot:()=>{window.__reads++;return JSON.stringify({players:window.__players});},publish:()=>{},exit:()=>{}};
 },{host});
 const snap=()=>page.evaluate(()=>PureTVQA.snapshot());
 const put=async fields=>{await page.evaluate(fields=>Object.assign(window.__players[0],fields),fields);if(fields.connected!==false&&!fields.session){const check=Object.fromEntries(Object.entries(fields).filter(([key])=>['x','y','a','b','start','select'].includes(key)));if(Object.keys(check).length)await page.waitForFunction(check=>window.PureTVQA&&PureTVQA.snapshot().controllers[0]&&Object.entries(check).every(([key,value])=>PureTVQA.snapshot().controllers[0][key]===value),check,{timeout:30000});}};
 const waitPhase=async phases=>page.waitForFunction(phases=>window.PureTVQA&&phases.includes(PureTVQA.snapshot().phase),phases,{timeout:60000});
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/${slug}/tv.html`);await waitPhase(['title','garage']);
  for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(350);
   assert.match(await page.locator('#puretv-address').textContent(),/192\.0\.2\.10:63485/);
   const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,bodyWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight,panel:(()=>{const e=document.querySelector('#puretv-panel'),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};})(),sidebar:(()=>{const e=document.querySelector('.sidebar,.room-panel'),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};})()}));
   row.layouts.push(layout);assert.ok(layout.bodyWidth<=viewport.width+1 && layout.bodyHeight<=viewport.height+1,'page bounds');
   await page.screenshot({path:path.join(out,slug+'-'+viewport.width+'.png')});
  }
  await put({start:true});await waitPhase(['playing','countdown','race']);await put({start:false});await page.waitForTimeout(250);await waitPhase(['playing','race']);if(slug==='coast-kart')await page.waitForFunction(()=>PureTVQA.snapshot().model.countdown<=0,null,{timeout:60000});
  const before=await snap();await put({x:1,a:slug==='used-car-racing'});await page.waitForTimeout(650);const right=await snap();await put({x:-1});await page.waitForTimeout(650);const left=await snap();await put({x:0,a:false});
  row.movement={before,right,left};assert.equal(right.controllers[0].x,1);assert.equal(left.controllers[0].x,-1);row.checks.push('ordinary start and both direction inputs reach running model');
  await put({a:true});await page.waitForTimeout(550);row.actionA=await snap();await put({a:false,b:true});await page.waitForTimeout(200);row.actionB=await snap();await put({b:false,select:true});await page.waitForTimeout(200);row.select=await snap();await put({select:false});
  row.checks.push('A, B and mapped Y/SELECT reach game input');
  await put({start:true});await waitPhase(['paused']);await put({start:false});await page.waitForTimeout(200);await put({start:true});await waitPhase(['playing','race']);await put({start:false});await page.waitForTimeout(200);
  await put({connected:false,a:true,x:1});await waitPhase(['paused']);row.disconnected=await snap();
  await put({connected:true,session:'reconnected',a:true,b:true,start:true,select:true,cancelSeq:1});await page.waitForTimeout(450);assert.equal((await snap()).phase,'paused');
  await put({a:false,b:false,start:false,select:false,x:0});await page.waitForTimeout(250);assert.equal((await snap()).phase,'paused');
  await put({start:true});await waitPhase(['playing','race']);await put({start:false});row.reconnected=await snap();
  row.checks.push('disconnect pauses, stale held reconnect cannot resume, neutral then fresh START resumes');
  assert.deepEqual(errors,[]);row.status='passed';
 }catch(error){row.status='failed';row.error=error.stack;row.pageErrors=errors;row.last=await snap().catch(()=>null);row.debug=await page.evaluate(()=>({reads:window.__reads,controls:window.AlienShooterTV&&AlienShooterTV.game._controls,runtime:window.AlienShooterTV&&AlienShooterTV.runtimeStats})).catch(()=>null);await page.screenshot({path:path.join(out,slug+'-failure.png')}).catch(()=>{});throw error;}
 finally{await context.close();await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
 for(const name of ['puretv-controller.js',slug==='used-car-racing'?'game.js':'runtime.js','game-model.js','tv.html','tv.css']){const rel=`resource/apps/${slug}/src/main/assets/${name}`;report.sourceHashes[rel]=createHash('sha256').update(await readFile(path.join(repo,rel))).digest('hex');}
 console.log('PASS '+slug);
}
report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);}
finally{report.finishedAt=new Date().toISOString();await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
