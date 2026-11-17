// Layout/input preflight: actual game assets, explicit synthetic native connection fixtures.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {launch,serveAssets,parseArgs,sourceHashes,sha256} from './common.mjs';
const args=parseArgs(),repo=fileURLToPath(new URL('../../../',import.meta.url));
const games=(args.games||'twenty-four,torch-bridge,tower-overlap,packing-sculptor,conveyor-window,glass-fold,tension-span,prism-relay,neon-rush').split(',');
const output=path.resolve(args.output);await mkdir(output,{recursive:false});
const script=fileURLToPath(import.meta.url);await copyFile(script,path.join(output,'executed-controller-client-ui.mjs'));
const qr=await readFile(path.resolve(args.qr));await writeFile(path.join(output,'qr-fixture.png'),qr);
const report={startedAt:new Date().toISOString(),scope:'Actual assembled game UI using synthetic native metadata/connection samples, plus ordinary keyboard start/pause. No game-model or clock writes. Not TCP, APK, physical-TV, phone or ESP32 evidence.',physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,gameStateWrites:false,clockWrites:false,scriptSha256:sha256(await readFile(script)),cases:[],passed:false};
const browser=await launch();
async function layout(page){return page.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const visible=e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(p.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return e.getClientRects().length>0;};
 const clients=document.getElementById('kit-wifi-clients'),card=clients.querySelector('[data-puretv-controller-id]'),text=card?.querySelector('[data-puretv-controller-id-text]');
 const clips=[];if(text){const t=text.getBoundingClientRect();for(let p=text.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),r=p.getBoundingClientRect();if(['auto','scroll','hidden','clip'].includes(s.overflowY)&&t.bottom>r.bottom+1)clips.push({id:p.id,class:p.className,overflow:s.overflowY,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight});}}
 const aside=document.querySelector('aside');return {viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},container:{...rect(clients),visible:visible(clients),hidden:clients.hidden,inSidebar:!!clients.closest('aside')},card:card?{...rect(card),visible:visible(card),identity:card.dataset.puretvControllerId,seat:card.dataset.playerId,icons:card.querySelectorAll('svg').length,text:text.textContent,textBounds:rect(text),textScrollWidth:text.scrollWidth,textClientWidth:text.clientWidth}:null,verticalClips:clips,sidebar:{...rect(aside),scrollHeight:aside.scrollHeight,clientHeight:aside.clientHeight,scrollWidth:aside.scrollWidth,clientWidth:aside.clientWidth},primary:rect(document.getElementById('primary')),phase:window.PureTVQA.snapshot().phase,paused:window.PureTVQA.snapshot().paused};
});}
function assertLayout(row,identity,{long=false}={}){const v=row.viewport,c=row.card;assert.ok(c&&c.visible&&row.container.visible,'Connected client is visible');assert.equal(c.identity,identity);assert.equal(c.text,'ID: '+identity);assert.equal(c.icons,1);assert.equal(c.seat,'1');assert.ok(row.document.width<=v.width+1&&row.document.height<=v.height+1,'Document stays within TV viewport');assert.ok(c.x>=0&&c.right<=v.width+1&&c.y>=0&&c.y<v.height,'Client card stays horizontally inside viewport');assert.ok(c.textScrollWidth<=c.textClientWidth+1,'Full ID wraps without horizontal overflow');if(!long){assert.ok(c.bottom<=v.height+1,'Normal client ID is vertically visible');assert.deepEqual(row.verticalClips,[],'Normal ID must not require scrolling');}}
async function keyUntil(page,key,predicate){await page.keyboard.down(key);try{await page.waitForFunction(predicate,null,{timeout:20000});}finally{await page.keyboard.up(key);}}
async function setClient(page,id,session='session-1'){await page.evaluate(({id,session})=>{window.__uiPlayer=id?{id:1,transport:'wifi',controllerId:id,session,connected:true,cancelSeq:0,x:0,y:0,a:false,b:false,start:false,select:false}:null;},{id,session});if(id)await page.waitForFunction(id=>document.querySelector('[data-puretv-controller-id]')?.dataset.puretvControllerId===id,id);else await page.waitForFunction(()=>!document.querySelector('[data-puretv-controller-id]'));}
try{
 for(const slug of games){
  const dir=path.join(output,slug);await mkdir(dir);const assets=path.join(dir,'assets');
  execFileSync('python3',[path.join(repo,'tools/readme-controller-qa/prepare-assets.py'),'--slug',slug,'--output',assets],{env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  const manifest=await sourceHashes(assets);await writeFile(path.join(dir,'assets-manifest.json'),JSON.stringify(manifest,null,2)+'\n');const server=await serveAssets(assets);
  try{for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
   const row={game:slug,viewport,status:'running',screenshots:[],errors:[],networkErrors:[]};report.cases.push(row);
   const context=await browser.newContext({viewport,locale:'zh-CN'});
   await context.addInitScript(({qr})=>{window.__uiPlayer=null;window.PureGameHost={getInfo:()=>JSON.stringify({url:'http://192.168.1.50:8123/?room=ui-fixture',qr,addresses:['192.168.1.50'],language:'zh',wifiController:{state:'available',serviceName:'pureTV UI fixture',port:63485,serviceType:'_puretv._tcp',version:'1'}}),snapshot:()=>JSON.stringify({connections:window.__uiPlayer?1:0,players:window.__uiPlayer?[window.__uiPlayer]:[]}),publish(){}};},{qr:'data:image/png;base64,'+qr.toString('base64')});
   const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)row.networkErrors.push({url:r.url(),status:r.status()});});
   const capture=async name=>{const image=slug+'/'+viewport.width+'-'+name+'.png';await page.screenshot({path:path.join(output,image)});row.screenshots.push(image);};
   try{
    await page.goto(server.url,{waitUntil:'load'});await page.waitForFunction(()=>!!window.PureTVQA&&!!window.PureTVControllerAdapter?.renderClients);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    await page.waitForFunction(()=>document.querySelector('[data-puretv-clients]')?.hidden===true);row.initial=await layout(page);assert.equal(row.initial.card,null);
    const id='esp32-001122334455';await setClient(page,id);row.connectedMenu=await layout(page);assertLayout(row.connectedMenu,id);await capture('connected-menu');
    await keyUntil(page,'Enter',()=>PureTVQA.snapshot().phase==='playing');await page.waitForFunction(()=>{const el=document.querySelector('[data-puretv-controller-id]');return el&&(!document.body.classList.contains('rush-native')||!el.closest('aside'));});row.playing=await layout(page);assertLayout(row.playing,id);await capture('playing');
    await keyUntil(page,'p',()=>PureTVQA.snapshot().paused);await page.waitForFunction(()=>{const el=document.querySelector('[data-puretv-controller-id]');return el&&(!document.body.classList.contains('rush-native')||!!el.closest('aside'));});row.paused=await layout(page);assertLayout(row.paused,id);await capture('paused');
    await setClient(page,null);row.disconnected=await layout(page);assert.equal(row.disconnected.card,null);assert.ok(row.disconnected.container.hidden);assert.ok(row.disconnected.paused);
    await setClient(page,id,'session-2');row.reconnected=await layout(page);assertLayout(row.reconnected,id);assert.ok(row.reconnected.paused,'Reconnection does not resume a paused game');
    const longId='virtual-'+ 'a'.repeat(88);await setClient(page,longId,'session-3');row.longIdentity=await layout(page);assertLayout(row.longIdentity,longId,{long:true});await capture('long-id');
    assert.deepEqual(row.errors,[]);assert.deepEqual(row.networkErrors,[]);row.status='passed';console.log('PASS '+slug+' '+viewport.width+'x'+viewport.height+' long-id-scroll='+row.longIdentity.verticalClips.length);
   }catch(error){row.status='failed';row.error=error.stack;await capture('failure').catch(()=>{});throw error;}finally{await context.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
  }}finally{await server.close();}
  assert.deepEqual(await sourceHashes(assets),manifest,'Loaded assets changed during UI run');
 }
 assert.equal(sha256(await readFile(script)),report.scriptSha256,'Executed script changed during run');report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,output}));
