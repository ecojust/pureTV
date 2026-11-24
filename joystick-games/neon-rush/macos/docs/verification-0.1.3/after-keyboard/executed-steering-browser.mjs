#!/usr/bin/env node
// Independent screen-direction acceptance: normal keyboard input, real render matrices.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,writeFile,mkdir,readdir,stat,copyFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
assert.ok(args.assets&&args.output&&process.env.PLAYWRIGHT_MODULE,'--assets --output and PLAYWRIGHT_MODULE are required');
const assets=path.resolve(args.assets),output=path.resolve(args.output);
assert.ok(output!==assets&&!output.startsWith(assets+path.sep));
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Use a fresh directory; retain failed reports');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const {chromium}=await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href);
const report={startedAt:new Date().toISOString(),status:'running',method:'Ordinary keyboard ArrowLeft/ArrowRight on the assembled game. Freeze the actual renderer camera view-projection at turn start, then project observed before/after car positions. No AI strategy, no model/clock/camera writes.',nativeMacOSAppTested:false,physicalEsp32Tested:false,gameStateWrites:false,cases:[],errors:[],assetHashes:{}};
for(const file of await readdir(assets)){const p=path.join(assets,file);if((await stat(p)).isFile())report.assetHashes[file]=hash(await readFile(p));}
await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-steering-browser.mjs'));
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'tv.html';if(name==='favicon.ico'){res.writeHead(204).end();return;}if(name.includes('/')||name.includes('\\')||name.startsWith('.'))throw Error('path');const bytes=await readFile(path.join(assets,name));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/tv.html';
let browser;
function project(matrix,p){assert.equal(matrix.length,16);assert.ok(matrix.every(Number.isFinite));const clip=[0,1,2,3].map(row=>matrix[row]*p.x+matrix[4+row]*(p.y+.5)+matrix[8+row]*p.z+matrix[12+row]);assert.ok(clip[3]>.01);return clip[0]/clip[3];}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});report.browser=browser.version();
 for(const [input,key,expectedSign] of [['LEFT','ArrowLeft',-1],['RIGHT','ArrowRight',1]]){
  const row={input,key,expectedSign,status:'running'};report.cases.push(row);
  const context=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:path.join(output,'videos'),size:{width:960,height:540}}});
  let page;
  try{
   const bridge=await readFile(path.join(assets,'bridge.js'),'utf8');
   await context.addInitScript({content:bridge+'\nNeonDesktop.receive({language:"zh",wifiController:{state:"available",inputEnabled:true,port:63485,addresses:["127.0.0.1"]}},{revision:0,players:[]});'});
   page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>window.PureTVQA?.snapshot().renderer.drawCalls>0,null,{timeout:30000});
   await page.keyboard.press('Enter');await page.waitForFunction(()=>PureTVQA.snapshot().model.raceTime>=.9,null,{timeout:45000});
   row.before=await page.evaluate(()=>PureTVQA.snapshot());assert.equal(row.before.model.trackId,'skyport');assert.ok(Array.isArray(row.before.renderer.cameraViewProjection),'Renderer must expose its actual read-only camera matrix');
   await page.keyboard.down(key);
   await page.waitForFunction(target=>PureTVQA.snapshot().model.raceTime>=target,row.before.model.raceTime+.65,{timeout:20000});
   row.after=await page.evaluate(()=>PureTVQA.snapshot());await page.keyboard.up(key);await page.keyboard.press('p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);
   await page.screenshot({path:path.join(output,input.toLowerCase()+'-paused.png')});
   const matrix=row.before.renderer.cameraViewProjection;
   row.screenDeltaX=project(matrix,row.after.model.player)-project(matrix,row.before.model.player);
   row.reference='Actual camera matrix at steering start, fixed for both observations';
   row.status=row.screenDeltaX*expectedSign>.015?'passed':'failed';
   assert.equal(row.after.model.stats.collisions,row.before.model.stats.collisions,'A collision must not determine the direction result');
   console.log(input+' screen delta '+row.screenDeltaX+' expected '+expectedSign+': '+row.status);
  }catch(error){row.status='failed';row.error=error.stack;if(page)await page.screenshot({path:path.join(output,input.toLowerCase()+'-failure.png')}).catch(()=>{});}
  finally{
   const video=page?.video();await context.close();
   if(video){const destination=path.join(output,input.toLowerCase()+'.webm');await video.saveAs(destination);await video.delete();row.video={file:path.basename(destination),bytes:(await stat(destination)).size,sha256:hash(await readFile(destination)),scope:'Browser capture during real keyboard input; not a Mac/TV recording or device frame-rate measurement'};}
  }
 }
 assert.deepEqual(report.errors,[]);assert.ok(report.cases.every(row=>row.status==='passed'),'Screen direction must match both left and right keys');report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));for(const [file,digest]of Object.entries(report.assetHashes))assert.equal(hash(await readFile(path.join(assets,file))),digest);report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
