import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch,serveAssets,delay,sourceHashes,sha256} from '../../../../qa/common.mjs';
const root=fileURLToPath(new URL('../../../../../../',import.meta.url));
const output=path.resolve(process.argv[2]);await mkdir(output,{recursive:true});
await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-layout-check.mjs'));
const cases=[['coast-kart','CoastKartHost'],['cozy-island','CozyIslandHost'],['alien-shooter','AlienShooterHost'],['used-car-racing','UsedCarHost']];
const summary={mode:'Chromium with synthetic native transport snapshots',physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,androidAppTested:false,modelWrites:false,clockOverrides:false,cases:[]};
const browser=await launch();
try{
for(const [slug,host] of cases){
 const assets=path.join(root,'resource/apps',slug,'src/main/assets'),server=await serveAssets(assets),hashes=await sourceHashes(assets);
 try{
 for(const [width,height,language] of [[960,540,'zh'],[1280,720,'en']]){
  const directory=path.join(output,slug,`${width}-${language}`);await mkdir(directory,{recursive:true});
  const record={slug,width,height,language,status:'running',assetHashes:hashes,checks:[],pageErrors:[],screenshots:[]};summary.cases.push(record);
  const context=await browser.newContext({viewport:{width,height},locale:language==='en'?'en-US':'zh-CN'});
  await context.addInitScript(({host,language})=>{
   window.__statusFixture={players:[],snapshots:0};
   window[host]={getInfo(){return JSON.stringify({language,url:'http://192.0.2.10:4040/',qr:'',addresses:['192.0.2.10'],wifiController:{port:63485,state:'available',connected:window.__statusFixture.players.some(p=>p.connected&&p.transport==='wifi'),addresses:['192.0.2.10']}})},snapshot(){window.__statusFixture.snapshots++;return JSON.stringify({players:window.__statusFixture.players})},publish(){},playSound(){},close(){}};
  },{host,language});
  const page=await context.newPage();page.on('pageerror',e=>record.pageErrors.push(e.message));
  async function fixture(ids,transport='wifi'){
   await page.evaluate(({ids,transport})=>{window.__statusFixture.players=ids.map((id,i)=>({id:i+1,connected:true,transport,controllerId:id,session:'fixture-'+(i+1),cancelSeq:0,x:0,y:0,aimX:0,aimY:0,a:false,b:false,start:false,select:false}));},{ids,transport});
  }
  async function measure(label,ids,shot=true){
   await page.waitForFunction(ids=>{const visible=[...document.querySelectorAll('[data-puretv-controller-id]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height);return visible.length===ids.length&&visible.every((e,i)=>e.dataset.puretvControllerId===ids[i]);},ids,{timeout:20000});
   const value=await page.evaluate(()=>{
    const rect=e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const visible=e=>{let r=e.getBoundingClientRect();return !!(r.width&&r.height)&&getComputedStyle(e).visibility!=='hidden'};
    return {viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},phase:window.PureTVQA.snapshot().phase,clients:[...document.querySelectorAll('[data-puretv-controller-id]')].filter(visible).map(e=>({id:e.dataset.puretvControllerId,seat:e.dataset.playerId,text:e.querySelector('[data-puretv-controller-id-text]').textContent,rect:rect(e),textRect:rect(e.querySelector('[data-puretv-controller-id-text]')),textScrollWidth:e.querySelector('[data-puretv-controller-id-text]').scrollWidth,textClientWidth:e.querySelector('[data-puretv-controller-id-text]').clientWidth})),important:[...document.querySelectorAll('#start,#pause-button,#resume,#race-time,#driver-huds,.mission-strip,#tactical-panel,.vehicle-cards')].filter(visible).map(e=>({id:e.id||e.className,rect:rect(e)})),sidebar:[...document.querySelectorAll('.sidebar,.room-panel')].filter(visible).map(e=>({rect:rect(e),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}))};
   });
   assert.ok(value.viewport.scrollWidth<=width+1&&value.viewport.scrollHeight<=height+1,'document overflow');
   for(const row of value.clients){assert.equal(row.text,'ID: '+row.id);assert.ok(row.rect.x>=0&&row.rect.y>=0&&row.rect.right<=width+1&&row.rect.bottom<=height+1,'identity visible in viewport');assert.ok(row.textScrollWidth<=row.textClientWidth+1,'ID wraps without clipping');for(const target of value.important){const a=row.rect,b=target.rect;assert.ok(a.right<=b.x||a.x>=b.right||a.bottom<=b.y||a.y>=b.bottom,'identity overlaps '+target.id);}}
   record.checks.push({label,...value});
   if(shot){const name=label+'.png';await page.screenshot({path:path.join(directory,name)});record.screenshots.push({file:name,sha256:sha256(await readFile(path.join(directory,name)))});}
  }
  try{
   await page.goto(server.url,{waitUntil:'load'});
   await page.waitForFunction(()=>window.PureTVQA&&window.PureTVQA.snapshot().phase!=='loading',{timeout:30000});
   await page.waitForFunction(()=>!document.querySelector('#game-loading:not([hidden]),#startup:not([hidden])'),null,{timeout:30000});
   const normal=['esp32-001122334455',...(slug==='alien-shooter'?[]:['esp32-aabbccddeeff'])];
   await measure('disconnected',[],false);await fixture(normal);await measure('menu-connected',normal);
   await page.keyboard.press('Enter');await page.waitForFunction(()=>['playing','race','countdown'].includes(window.PureTVQA.snapshot().phase),null,{timeout:30000});await delay(350);await measure('playing-connected',normal);
   await page.keyboard.press('Enter');await page.waitForFunction(()=>window.PureTVQA.snapshot().paused||window.PureTVQA.snapshot().phase==='paused',null,{timeout:20000});await measure('paused-connected',normal);
   const long=normal.map((_,i)=>'esp32-'+String(i+1).repeat(90));await fixture(long);await measure('long-ids',long);
   await fixture([normal[0]],'phone');await measure('phone-only',[],false);await fixture(normal);await measure('reconnected',normal,false);
   await fixture([]);await measure('disconnected-after',[],false);
   assert.deepEqual(record.pageErrors,[]);assert.deepEqual(await sourceHashes(assets),hashes);record.status='passed';
  }catch(error){record.status='failed';record.error=error.stack;await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}
  finally{await writeFile(path.join(directory,'report.json'),JSON.stringify(record,null,2)+'\n');await context.close();await writeFile(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');}
  console.log(slug,width,record.status,record.error?.split('\n')[0]||'');
 }
 }finally{await server.close();}
}
}finally{await browser.close();summary.status=summary.cases.every(x=>x.status==='passed')?'passed':'failed';await writeFile(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');}
assert.equal(summary.status,'passed');
