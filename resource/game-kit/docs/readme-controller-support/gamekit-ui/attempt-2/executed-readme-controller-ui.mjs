// Normal-input UI checks on actual assembled games; native network metadata is a fixture.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {launch,serveAssets,parseArgs,sourceHashes as assetManifest,sha256} from './common.mjs';
const args=parseArgs(),repo=fileURLToPath(new URL('../../../',import.meta.url));
const games=(args.games||'twenty-four,torch-bridge,tower-overlap,packing-sculptor,conveyor-window,glass-fold,tension-span,prism-relay,neon-rush').split(',');
const output=path.resolve(args.output);await mkdir(output,{recursive:false});
const script=fileURLToPath(import.meta.url);await copyFile(script,path.join(output,'executed-readme-controller-ui.mjs'));
const qr=await readFile(path.resolve(args.qr));await writeFile(path.join(output,'qr-fixture.png'),qr);
const report={startedAt:new Date().toISOString(),scope:'Actual assembled game UI and normal keyboard input with a synthetic native connection/info fixture. No game model, clock or renderer writes. Not TCP protocol or physical device evidence.',physicalTvTested:false,physicalEsp32Tested:false,gameStateWrites:false,clockWrites:false,scriptSha256:sha256(await readFile(script)),cases:[],passed:false};
const buildPrepare=`import sys,importlib.util,json\nfrom pathlib import Path\nspec=importlib.util.spec_from_file_location('builder',Path(sys.argv[1])/'resource/game-kit/build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\ngame=Path(sys.argv[1])/'resource/apps'/sys.argv[2];out=Path(sys.argv[3]);out.mkdir(parents=True)\nfor name,data in m.payload(game).items():(out/name).write_bytes(data)\n`;
await writeFile(path.join(output,'prepare-assets.py'),buildPrepare);
const browser=await launch();
async function measure(page){return page.evaluate(()=>{
 const rect=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const aside=document.querySelector('aside'),primary=document.querySelector('#primary'),wifi=document.querySelector('#rush-wifi-help')||document.querySelector('#kit-wifi-help');
 const text=[];for(const element of aside.querySelectorAll('p,strong,code,h3')){
  if(!element.getClientRects().length||getComputedStyle(element).display==='none')continue;
  const range=document.createRange();range.selectNodeContents(element);const box=range.getBoundingClientRect(),parent=element.getBoundingClientRect();
  text.push({id:element.id,text:element.textContent,box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},element:rect(element),horizontalOverflow:box.left<parent.left-1||box.right>parent.right+1});
 }
 return {viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},sidebar:{...rect(aside),clientWidth:aside.clientWidth,scrollWidth:aside.scrollWidth,clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,requiresVerticalScroll:aside.scrollHeight>aside.clientHeight+1},primary:rect(primary),wifi:{...rect(wifi),hidden:wifi.hidden,text:wifi.textContent},text};
});}
async function keyUntil(page,key,predicate){await page.keyboard.down(key);try{await page.waitForFunction(predicate,null,{timeout:20000});}finally{await page.keyboard.up(key);}}
try{
 for(const slug of games){
  const dir=path.join(output,slug);await mkdir(dir);const assets=path.join(dir,'assets');
  execFileSync('python3',['-c',buildPrepare,repo,slug,assets],{env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
  const manifest=await assetManifest(assets);await writeFile(path.join(dir,'assets-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const server=await serveAssets(assets);
  try{for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
   const row={game:slug,viewport,status:'running',screenshots:[],errors:[]};report.cases.push(row);
   const context=await browser.newContext({viewport,locale:'zh-CN'});
   await context.addInitScript(({qr})=>{window.__uiConnected=false;window.PureGameHost={getInfo:()=>JSON.stringify({url:'http://192.168.1.50:8123/?room=ui-fixture',qr,addresses:['192.168.1.50'],language:'zh',wifiController:{state:'available',serviceName:'pureTV UI fixture',port:63485,serviceType:'_puretv._tcp',version:'1'}}),snapshot:()=>JSON.stringify({connections:window.__uiConnected?1:0,players:window.__uiConnected?[{id:1,transport:'wifi',controllerId:'ui-fixture',session:'ui-session',connected:true,cancelSeq:0,x:0,y:0,a:false,b:false,start:false,select:false}]:[]}),publish(){}};},{qr:'data:image/png;base64,'+qr.toString('base64')});
   const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));
   try{
    await page.goto(server.url,{waitUntil:'load'});await page.waitForFunction(()=>!!window.PureTVQA);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    await page.waitForFunction(()=>document.querySelector('#rush-wifi-status')?.textContent.includes('63485')||document.querySelector('#kit-wifi-address')?.textContent.includes('63485'));
    row.menu=await measure(page);
    const m=row.menu;assert.ok(m.document.width<=viewport.width+1&&m.document.height<=viewport.height+1,'Document overflow');assert.ok(m.primary.x>=0&&m.primary.y>=0&&m.primary.right<=viewport.width+1&&m.primary.bottom<=viewport.height+1,'Primary action clipped');assert.ok(!m.wifi.hidden&&m.wifi.width>0&&m.wifi.text.includes('192.168.1.50:63485'),'Wi-Fi instructions/address missing');assert.ok(m.sidebar.scrollWidth<=m.sidebar.clientWidth+1,'Sidebar horizontal overflow');assert.ok(m.text.every(t=>!t.horizontalOverflow),'Sidebar text overflows its allocated width');
    let image=slug+'/'+viewport.width+'-menu.png';await page.screenshot({path:path.join(output,image)});row.screenshots.push(image);
    const before=await page.evaluate(()=>PureTVQA.snapshot());row.levelBefore=before.level;
    await keyUntil(page,'ArrowRight',()=>PureTVQA.snapshot().level===1);row.levelSelected=(await page.evaluate(()=>PureTVQA.snapshot())).level;
    await keyUntil(page,'Enter',()=>PureTVQA.snapshot().phase==='playing');await page.evaluate(()=>window.__uiConnected=true);
    await page.waitForFunction(()=>PureTVQA.snapshot().tick>=8,null,{timeout:20000});row.playing=await page.evaluate(()=>PureTVQA.snapshot());
    image=slug+'/'+viewport.width+'-playing.png';await page.screenshot({path:path.join(output,image)});row.screenshots.push(image);
    await keyUntil(page,'p',()=>PureTVQA.snapshot().paused);row.paused=await page.evaluate(()=>PureTVQA.snapshot());row.pausedLayout=await measure(page);
    image=slug+'/'+viewport.width+'-paused.png';await page.screenshot({path:path.join(output,image)});row.screenshots.push(image);
    assert.equal(row.playing.phase,'playing');assert.equal(row.paused.paused,true);assert.equal(row.paused.connection.controllerKind,'wifi');assert.deepEqual(row.errors,[]);row.status='passed';
    console.log('PASS '+slug+' '+viewport.width+'x'+viewport.height+' scroll='+m.sidebar.requiresVerticalScroll);
   }catch(error){row.status='failed';row.error=error.stack;await page.screenshot({path:path.join(dir,viewport.width+'-failure.png')}).catch(()=>{});throw error;}finally{await context.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
  }}finally{await server.close();}
  assert.deepEqual(await assetManifest(assets),manifest,'Loaded assets changed during UI run');
 }
 assert.equal(sha256(await readFile(script)),report.scriptSha256,'Executed script changed during run');report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,output}));
