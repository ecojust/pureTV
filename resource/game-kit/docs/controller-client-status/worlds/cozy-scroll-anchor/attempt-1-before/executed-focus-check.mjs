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
const report={mode:'Prepared APK/source assets in Chromium; synthetic native transport fixture, actual QR geometry',expectation,assetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,androidAppTested:false,modelWrites:false,clockOverrides:false,cases:[]};
try{
for(const [width,height] of [[960,540],[1280,720]]){
 const context=await browser.newContext({viewport:{width,height},locale:'en-US'});
 await context.addInitScript(info=>{window.__clients=[];window.CozyIslandHost={getInfo(){return JSON.stringify(info)},snapshot(){return JSON.stringify({players:window.__clients})},publish(){},close(){},playSound(){}};},info);
 const page=await context.newPage(),record={width,height,observations:[],pageErrors:[]};report.cases.push(record);page.on('pageerror',e=>record.pageErrors.push(e.message));
 async function observe(label){
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await delay(150);
  const value=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const sidebar=document.querySelector('.sidebar'),card=document.querySelector('#controller-clients');
   const rows=[...card.querySelectorAll('[data-puretv-controller-id]')].map(n=>({id:n.dataset.puretvControllerId,rect:rect(n)}));
   const nodes=[...document.querySelectorAll('.brand,.qr-frame,#music-button,.player-card,.menu-help')].map(n=>({selector:n.id||n.className,rect:rect(n)}));
   return {activeElement:document.activeElement.id,scrollTop:sidebar.scrollTop,scrollHeight:sidebar.scrollHeight,clientHeight:sidebar.clientHeight,sidebar:rect(sidebar),overflowAnchor:getComputedStyle(sidebar).overflowAnchor,rows,nodes};
  });
  value.label=label;value.overlaps=[];
  for(const row of value.rows)for(const node of value.nodes){const a=row.rect,b=node.rect;if(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)value.overlaps.push({id:row.id,target:node.selector});}
  const file=`${width}-${label}.png`;await page.screenshot({path:path.join(output,file)});value.screenshot={file,sha256:sha256(await readFile(path.join(output,file)))};record.observations.push(value);console.log(width,label,JSON.stringify({scrollTop:value.scrollTop,active:value.activeElement,overlaps:value.overlaps}));
  if(expectation==='clear'&&value.rows.length)assert.deepEqual(value.overlaps,[],'connected cards must not overlap QR/brand/controls');
 }
 async function connect(count){await page.evaluate(count=>{window.__clients=Array.from({length:count},(_,i)=>({id:i+1,connected:true,transport:'wifi',controllerId:'virtual-'+(i?'d5e5a9a69cc5':'af60c0c408a1'),session:'fixture-'+i,cancelSeq:0,x:0,y:0,a:false,b:false,start:false,select:false}));},count);await page.waitForFunction(count=>document.querySelectorAll('[data-puretv-controller-id]').length===count,count);}
 try{
  await page.goto(server.url,{waitUntil:'load'});await page.waitForFunction(()=>window.PureTVQA&&window.PureTVQA.snapshot().phase==='title'&&document.querySelector('#room-qr').complete);
  await observe('before-focus');await page.keyboard.press('Tab');await page.waitForFunction(()=>document.activeElement.id==='music-button');await observe('focused-music');
  await connect(1);await observe('focused-one-client');await connect(2);await observe('focused-two-clients');await connect(0);await observe('focused-disconnected');
  assert.deepEqual(record.pageErrors,[]);record.status='passed';
 }catch(e){record.status='failed';record.error=e.stack;await page.screenshot({path:path.join(output,`${width}-failure.png`)}).catch(()=>{});}
 finally{await context.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
}
assert.deepEqual(await sourceHashes(assets),hashes);
}finally{await browser.close();await server.close();report.status=report.cases.every(c=>c.status==='passed')?'passed':'failed';await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
assert.equal(report.status,'passed');
