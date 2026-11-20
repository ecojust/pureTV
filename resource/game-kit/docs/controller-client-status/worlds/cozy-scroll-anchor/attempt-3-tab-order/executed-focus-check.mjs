import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch,serveAssets,sourceHashes,sha256,delay} from '../../../../qa/common.mjs';
const [assets,output,expectation='observe']=process.argv.slice(2).map((x,i)=>i<2?path.resolve(x):x);
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'empty output required');
await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-focus-check.mjs'));
const info=JSON.parse(await readFile(new URL('./room-info-fixture.json',import.meta.url),'utf8'));
await writeFile(path.join(output,'room-info-fixture.json'),JSON.stringify(info,null,2)+'\n');
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const baselineAssets=process.argv[5]&&path.resolve(process.argv[5]),baselineServer=baselineAssets&&await serveAssets(baselineAssets);
function geometry(){return ['.arena-panel','#battlefield'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {selector,x:r.x,y:r.y,width:r.width,height:r.height};});}
const report={mode:'Prepared APK/source assets in Chromium; synthetic native transport fixture, actual QR geometry',expectation,assetHashes:hashes,baselineAssetHashes:baselineAssets?await sourceHashes(baselineAssets):null,physicalTvTested:false,physicalPhoneTested:false,androidAppTested:false,modelWrites:false,clockOverrides:false,cases:[]};
try{
for(const [width,height] of [[960,540],[1280,720]]){
 let baselineGeometry=null;
 if(baselineServer){const before=await browser.newContext({viewport:{width,height},locale:'en-US'});await before.addInitScript(info=>{window.CozyIslandHost={getInfo(){return JSON.stringify(info)},snapshot(){return JSON.stringify({players:[]})},publish(){},close(){},playSound(){}};},info);const beforePage=await before.newPage();await beforePage.goto(baselineServer.url);await beforePage.waitForFunction(()=>window.PureTVQA&&window.PureTVQA.snapshot().phase==='title');baselineGeometry=await beforePage.evaluate(geometry);await before.close();}
 const context=await browser.newContext({viewport:{width,height},locale:'en-US'});
 await context.addInitScript(info=>{window.__clients=[];window.CozyIslandHost={getInfo(){return JSON.stringify(info)},snapshot(){return JSON.stringify({players:window.__clients})},publish(){},close(){},playSound(){}};},info);
 const page=await context.newPage(),record={width,height,baselineGeometry,observations:[],pageErrors:[]};report.cases.push(record);page.on('pageerror',e=>record.pageErrors.push(e.message));
 async function observe(label){
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await delay(150);
  const value=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const sidebar=document.querySelector('.sidebar'),content=document.querySelector('.sidebar-content'),card=document.querySelector('#controller-clients');
   const clipped=n=>{let b=rect(n);for(let p=n.parentElement;p;p=p.parentElement){const style=getComputedStyle(p),r=rect(p);if(/^(hidden|clip|auto|scroll)$/.test(style.overflowY)){b.y=Math.max(b.y,r.y+p.clientTop);b.bottom=Math.min(b.bottom,r.y+p.clientTop+p.clientHeight)}if(/^(hidden|clip|auto|scroll)$/.test(style.overflowX)){b.x=Math.max(b.x,r.x+p.clientLeft);b.right=Math.min(b.right,r.x+p.clientLeft+p.clientWidth)}}b.x=Math.max(b.x,0);b.y=Math.max(b.y,0);b.right=Math.min(b.right,innerWidth);b.bottom=Math.min(b.bottom,innerHeight);b.width=Math.max(0,b.right-b.x);b.height=Math.max(0,b.bottom-b.y);return b};
   const rows=[...card.querySelectorAll('[data-puretv-controller-id]')].map(n=>({id:n.dataset.puretvControllerId,rect:rect(n)}));
   const nodes=[...document.querySelectorAll('.room-brand,.qr-frame,#music-button,.player-card,.menu-help')].map(n=>({selector:n.id||n.className,rect:rect(n),visibleRect:clipped(n)}));
   return {activeElement:document.activeElement.id,content:content?{rect:rect(content),scrollTop:content.scrollTop,clientHeight:content.clientHeight,scrollHeight:content.scrollHeight}:null,scrollTop:sidebar.scrollTop,scrollHeight:sidebar.scrollHeight,clientHeight:sidebar.clientHeight,sidebar:rect(sidebar),overflowAnchor:getComputedStyle(sidebar).overflowAnchor,rows,nodes};
  });
  value.gameGeometry=await page.evaluate(geometry);if(baselineGeometry)assert.deepEqual(value.gameGeometry,baselineGeometry,'main game area size unchanged');
  value.label=label;value.overlaps=[];
  for(const row of value.rows)for(const node of value.nodes){const a=row.rect,b=node.visibleRect;if(b.width>0&&b.height>0&&a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)value.overlaps.push({id:row.id,target:node.selector});}
  const file=`${width}-${label}.png`;await page.screenshot({path:path.join(output,file)});value.qrFullyVisible=value.nodes.filter(n=>n.selector==='qr-frame').every(n=>Math.abs(n.rect.width-n.visibleRect.width)<1&&Math.abs(n.rect.height-n.visibleRect.height)<1);value.screenshot={file,sha256:sha256(await readFile(path.join(output,file)))};record.observations.push(value);console.log(width,label,JSON.stringify({scrollTop:value.scrollTop,active:value.activeElement,contentScrollTop:value.content?.scrollTop,qrFullyVisible:value.qrFullyVisible,overlaps:value.overlaps}));

 }
 async function connect(count){await page.evaluate(count=>{window.__clients=Array.from({length:count},(_,i)=>({id:i+1,connected:true,transport:'wifi',controllerId:'virtual-'+(i?'d5e5a9a69cc5':'af60c0c408a1'),session:'fixture-'+i,cancelSeq:0,x:0,y:0,a:false,b:false,start:false,select:false}));},count);await page.waitForFunction(count=>document.querySelectorAll('[data-puretv-controller-id]').length===count,count);}
 try{
  await page.goto(server.url,{waitUntil:'load'});await page.waitForFunction(()=>window.PureTVQA&&window.PureTVQA.snapshot().phase==='title'&&document.querySelector('#room-qr').complete);
  await observe('before-focus');await page.keyboard.press('Tab');await page.waitForFunction(()=>document.activeElement.id==='music-button');await observe('focused-music');
  await connect(1);await observe('focused-one-client');await connect(2);await observe('focused-two-clients');
  if(expectation==='clear'){const box=await page.locator('.sidebar-content').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,1000);await observe('scrolled-details');await page.mouse.wheel(0,-1000);await observe('details-returned-top');const text=await page.locator('#music-button').textContent();await page.locator('#music-button').click();await page.waitForFunction(previous=>document.querySelector('#music-button').textContent!==previous,text);await observe('music-toggle');}
  await connect(0);await observe('focused-disconnected');
  if(expectation==='clear'){assert.deepEqual(record.observations.flatMap(value=>value.overlaps),[],'connected cards must not overlap QR/brand/controls');for(const value of record.observations){assert.equal(value.scrollTop,0,'outer sidebar must not scroll');if(value.label!=='scrolled-details')assert.equal(value.qrFullyVisible,true,'normal-ID QR matrix stays fully visible');const music=value.nodes.find(n=>n.selector==='music-button');assert.ok(Math.abs(music.rect.height-music.visibleRect.height)<1,'Music stays visible and reachable');}}
  assert.deepEqual(record.pageErrors,[]);record.status='passed';
 }catch(e){record.status='failed';record.error=e.stack;await page.screenshot({path:path.join(output,`${width}-failure.png`)}).catch(()=>{});}
 finally{await context.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
}
assert.deepEqual(await sourceHashes(assets),hashes);
}finally{await browser.close();await server.close();if(baselineServer)await baselineServer.close();report.status=report.cases.every(c=>c.status==='passed')?'passed':'failed';await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
assert.equal(report.status,'passed');
