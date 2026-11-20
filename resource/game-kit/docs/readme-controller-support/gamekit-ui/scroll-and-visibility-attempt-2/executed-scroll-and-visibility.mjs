import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {launch,serveAssets,sourceHashes,sha256} from '/dev/shm/puretv-controller-games/resource/game-kit/qa/common.mjs';
const root='/dev/shm/controller-gamekit-ui',output=root+'/scroll-and-visibility-attempt-2';
await mkdir(output,{recursive:false});await copyFile(new URL(import.meta.url),output+'/executed-scroll-and-visibility.mjs');
const browser=await launch(),qr='data:image/png;base64,'+(await readFile(root+'/qr-fixture.png')).toString('base64');
const report={scope:'Read-only browser layout plus actual mouse wheel. No game state or clock writes. Synthetic native info only.',cases:[],passed:false};
try{for(const [game,attempt,scroll] of [['packing-sculptor','final-scroll-assets',true],['prism-relay','final-scroll-assets',true],['glass-fold','final-scroll-assets',false]]){
 const assets=path.join(root,attempt,game,'assets'),server=await serveAssets(assets),context=await browser.newContext({viewport:{width:960,height:540},locale:'zh-CN'});
 await context.addInitScript(qr=>{window.PureGameHost={getInfo:()=>JSON.stringify({url:'http://192.168.1.50:8123/?room=ui-fixture',qr,addresses:['192.168.1.50'],language:'zh',wifiController:{state:'available',serviceName:'pureTV UI fixture',port:63485,serviceType:'_puretv._tcp',version:'1'}}),snapshot:()=>JSON.stringify({connections:0,players:[]}),publish(){}};},qr);
 const page=await context.newPage();try{
  await page.goto(server.url);await page.waitForFunction(()=>!!window.PureTVQA&&document.getElementById('kit-wifi-address').textContent.includes('63485'));await page.evaluate(()=>document.fonts.ready);
  const row={game,source:attempt+'/'+game+'/assets',hashes:await sourceHashes(assets)};report.cases.push(row);
  row.before=await page.evaluate(()=>{const a=document.querySelector('aside'),w=document.getElementById('kit-wifi-help'),r=w.getBoundingClientRect(),o=document.getElementById('overlay').getBoundingClientRect(),ar=document.getElementById('arena').getBoundingClientRect();return{scrollTop:a.scrollTop,scrollHeight:a.scrollHeight,clientHeight:a.clientHeight,overflowY:getComputedStyle(a).overflowY,wifiTopmost:w.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),overlay:{x:o.x,y:o.y,right:o.right,bottom:o.bottom},arena:{x:ar.x,y:ar.y,right:ar.right,bottom:ar.bottom}};});
  assert.ok(row.before.wifiTopmost,'Connection help occluded by overlay');
  if(scroll){const box=await page.locator('aside').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,600);await page.waitForFunction(()=>document.querySelector('aside').scrollTop>0);row.after=await page.evaluate(()=>{const a=document.querySelector('aside'),t=document.querySelector('.tip').getBoundingClientRect(),r=a.getBoundingClientRect();return{scrollTop:a.scrollTop,tipBottom:t.bottom,asideBottom:r.bottom};});assert.ok(row.after.tipBottom<=row.after.asideBottom+1,'Tip inaccessible after wheel');}
  else{assert.ok(row.before.overlay.y>=row.before.arena.y&&row.before.overlay.bottom<=row.before.arena.bottom+1,'Menu overlay must stay inside arena');}
  await page.screenshot({path:output+'/'+game+'.png'});row.passed=true;
 }finally{await context.close();await server.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');}
}report.passed=true;}catch(error){report.error=error.stack;process.exitCode=1;}finally{await browser.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
