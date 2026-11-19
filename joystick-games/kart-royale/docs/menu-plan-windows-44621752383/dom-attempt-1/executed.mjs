// DOM calibration of the actual menu modules and Windows pulse-preserving bridge.
// No WebGL context, race physics, native TCP server or game-clock override.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out=path.resolve(process.argv[2]);
assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const require=createRequire(root+'/package.json');
const {build}=require('esbuild');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const plan=JSON.parse(fs.readFileSync(root+'/qa-plan.json'));
const steps=plan.steps.slice(0,11);
const fixture=`
import {Menus} from './src/src/ui/Menus';
import {TouchControls} from './src/src/core/TouchControls';
import {installTV} from './src/src/tv-input';
document.getElementById('boot').remove();
window.__calls=[];
const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
const player={id:1,connected:true,transport:'wifi',controllerId:'Royale-DOM-42',session:'dom-menu-one',cancelSeq:0,buttons:Object.fromEntries(keys.map(k=>[k,false])),buttonCounters:Object.fromEntries(keys.map(k=>[k,0]))};
let revision=0;
const info={storageKeys:['kr.controls.v1'],preferences:{},wifiController:{port:63485,serviceName:'Royale DOM calibration',inputEnabled:true}};
function publish(){window.JoystickDesktop.receive(info,{revision:++revision,inputEnabled:true,players:[player]});}
publish();
window.__native={player,publish,tap(key){player.buttons[key]=true;player.buttonCounters[key]++;publish();return new Promise(resolve=>setTimeout(()=>{player.buttons[key]=false;publish();resolve();},16));}};
const pad=new TouchControls();
const input={pad,state:{steer:0,itemPressed:false,pausePressed:false},touch:false,cancelTV(){},setTV(){}};
const karts=['Vela','Koa','Sol','Miso','Nori','Yuzu','Pip','Lux'].map((name,i)=>({id:i,isPlayer:i===0,stats:{name,color:{getHexString(){return 'ff3b5c'}},accelMul:1,topSpeedMul:1,weightMul:1,handlingMul:1},position:{toArray(){return [0,0,0]}},forwardSpeed:0}));
const race={state:0,raceTime:0,karts,player:karts[0],setPaused(){},selectKart(i){window.__calls.push(['selectKart',i]);},reset(){window.__calls.push(['reset']);}};
const ctx={race,input,bus:{on(){},emit(){}}};
const menus=new Menus(document.getElementById('ui'));menus.init(ctx);
const tv=installTV(ctx,input);
function frame(now){tv.poll(now);menus.update(ctx,0);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__observe=()=>({game:window.JoystickGameQA.snapshot(),native:structuredClone(player),saved:localStorage.getItem('kr.controls.v1'),calls:window.__calls});
`;
fs.copyFileSync(fileURLToPath(import.meta.url),out+'/executed.mjs');
fs.writeFileSync(out+'/fixture.ts',fixture);
const built=await build({absWorkingDir:root,stdin:{contents:fixture,resolveDir:root,loader:'ts'},bundle:true,write:false,metafile:true,format:'iife'});
const js=Buffer.from(built.outputFiles[0].contents);
const bridge=fs.readFileSync(root+'/../shared/windows/Web/bridge.js');
const html=fs.readFileSync(root+'/dist/tv.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('</body>','<script src="/bridge.js"></script><script src="/fixture.js"></script></body>');
const report={scope:'Actual Menus/ControlsMenu/TouchControls/ControlPrefs and installTV with unmodified Windows bridge.js in Chromium DOM. Native revisions/counters are a fixture, race/renderer absent. No native TCP, WebGL, physics or performance claim.',sourceInputs:Object.keys(built.metafile.inputs).filter(p=>p!=='<stdin>').concat(['../shared/windows/Web/bridge.js','dist/tv.html','dist/kart-royale.css','qa-plan.json']).map(p=>{const b=fs.readFileSync(path.resolve(root,p));return {path:p,bytes:b.length,sha256:sha(b)};}),cases:[],errors:[]};
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;const files={'/tv.html':html,'/fixture.js':js,'/bridge.js':bridge,'/kart-royale.css':fs.readFileSync(root+'/dist/kart-royale.css')};const data=files[name];if(data===undefined){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});res.end(data);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
function matches(expect,game){return expect.every(e=>e.op==='eq'&&e.path.split('.').reduce((v,k)=>v?.[k],game)===e.value);}
try {
 browser=await chromium.launch({executablePath:process.env.CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-webgl','--disable-gpu']});
 const deadline=Date.now()+110000;
 for(const viewport of [{width:960,height:540},{width:1280,height:720}]) {
  const context=await browser.newContext({viewport});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/tv.html');await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>3);
  const row={viewport,steps:[]};report.cases.push(row);
  for(const step of steps) {
   assert.ok(step.menuTap);const before=await page.evaluate(()=>window.__observe());
   assert.equal(matches(step.expect,before.game),false,step.name+' already satisfied');
   const began=Date.now();await page.evaluate(key=>window.__native.tap(key),step.keys[0]);
   let baseline=null,stable=0,after;
   while(Date.now()-began<5000&&Date.now()<deadline) {
    after=await page.evaluate(()=>window.__observe());
    const released=Object.values(after.native.buttons).every(v=>!v)&&Object.values(after.game.controller.buttons).every(v=>!v);
    const counters=Object.entries(before.native.buttonCounters).every(([k,n])=>after.native.buttonCounters[k]===n+(k===step.keys[0]?1:0));
    const identity=after.native.controllerId===before.native.controllerId&&after.native.session===before.native.session;
    if(released&&counters&&identity&&matches(step.expect,after.game)) {
     if(baseline===null)baseline=after.game.frames;
     else if(after.game.frames>baseline){stable++;baseline=after.game.frames;}
    } else {baseline=null;stable=0;}
    if(stable>=2)break;
    await page.waitForTimeout(20);
   }
   assert.ok(stable>=2,step.name+' not stable on two later released polls');
   row.steps.push({name:step.name,key:step.keys[0],before,after,stableFreshSamples:stable,elapsedMs:Date.now()-began});save();
  }
  const final=await page.evaluate(()=>window.__observe());
  assert.equal(final.game.gameplay.focus,'Start race');assert.equal(final.game.gameplay.controlHand,'left');
  assert.equal(JSON.parse(final.saved).hand,'left');assert.deepEqual(final.calls,[]);
  row.savedHand='left';row.roster='Start race';row.status='passed';
  await context.close();save();
 }
 assert.deepEqual(report.errors,[]);report.status='passed-dom-only';
} catch(error) {report.status='failed';report.error=String(error.stack);process.exitCode=1;}
finally {save();await browser?.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify({status:report.status,error:report.error,cases:report.cases.map(c=>({viewport:c.viewport,status:c.status,steps:c.steps.map(s=>({name:s.name,focus:s.after.game.gameplay.focus,stable:s.stableFreshSamples}))}))}));
