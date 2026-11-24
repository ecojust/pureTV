import {chromium} from '/dev/shm/puretv-download-deps/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const output='/dev/shm/neon-steering-before',assets=output+'/web';
const server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/favicon.ico'){res.writeHead(204).end();return;}p=p.slice(1);if(p.includes('/'))throw Error('path');const b=await readFile(path.join(assets,p||'tv.html'));res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html');res.end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const report={status:'running',scope:'Exact0.1.2 ZIP Web assets, normal keyboard. Observer reads actual Three.js camera matrices without writing model, clock, camera or renderer state. Not a Mac native/SDK test.',cases:[],errors:[]};
function mul(a,b){const r=Array(16).fill(0);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
function project(m,p){const clip=[0,1,2,3].map(row=>m[row]*p.x+m[4+row]*(p.y+.5)+m[8+row]*p.z+m[12+row]);return clip[0]/clip[3];}
try{
 for(const [name,key,sign] of [['LEFT','ArrowLeft',-1],['RIGHT','ArrowRight',1]]){
  const context=await browser.newContext({viewport:{width:960,height:540}});
  await context.addInitScript({content:await readFile(assets+'/bridge.js','utf8')+'\nNeonDesktop.receive({language:"zh",wifiController:{state:"available",inputEnabled:true,port:63485,addresses:["127.0.0.1"]}},{revision:0,players:[]});'});
  await context.addInitScript(()=>{
   let def;
   Object.defineProperty(window,'GameDef',{configurable:true,get(){return def;},set(value){def=value;const make=value.createRenderer;value.createRenderer=function(c){const renderer=make(c);window.__cameraRead=()=>({projection:Array.from(renderer.camera.projectionMatrix.elements),view:Array.from(renderer.camera.matrixWorldInverse.elements)});return renderer;};}});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/tv.html');await page.waitForFunction(()=>window.PureTVQA?.snapshot().renderer.drawCalls>0);
  await page.keyboard.press('Enter');await page.waitForFunction(()=>PureTVQA.snapshot().model.raceTime>=.9,{timeout:45000});
  const before=await page.evaluate(()=>({game:PureTVQA.snapshot(),camera:__cameraRead()}));
  await page.keyboard.down(key);await page.waitForFunction(t=>PureTVQA.snapshot().model.raceTime>=t,before.game.model.raceTime+.65,{timeout:20000});
  const after=await page.evaluate(()=>({game:PureTVQA.snapshot(),camera:__cameraRead()}));await page.keyboard.up(key);await page.keyboard.press('p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);await page.screenshot({path:output+'/'+name+'-after.png'});
  const matrix=mul(before.camera.projection,before.camera.view),a=project(matrix,before.game.model.player),b=project(matrix,after.game.model.player),delta=b-a;
  report.cases.push({input:name,expectedSign:sign,screenDeltaX:delta,passed:delta*sign>.015,before,after});console.log(name+': screenDeltaX='+delta+' expectedSign='+sign);
  await context.close();
 }
 report.status=report.cases.every(c=>c.passed)?'passed':'failed';process.exitCode=report.status==='passed'?0:1;
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;}
finally{await browser.close();await new Promise(r=>server.close(r));await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');}
