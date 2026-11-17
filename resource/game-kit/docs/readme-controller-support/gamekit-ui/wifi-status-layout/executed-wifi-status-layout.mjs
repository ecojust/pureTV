import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {launch,serveAssets,sourceHashes,sha256} from '/dev/shm/puretv-controller-games/resource/game-kit/qa/common.mjs';
const root='/dev/shm/controller-gamekit-ui',repo='/dev/shm/puretv-controller-games',output=root+'/wifi-status-layout';
await mkdir(output,{recursive:false});await copyFile(new URL(import.meta.url),output+'/executed-wifi-status-layout.mjs');
const prepare=await readFile(root+'/attempt-4/prepare-assets.py','utf8');await writeFile(output+'/prepare-assets.py',prepare);
const browser=await launch(),qr='data:image/png;base64,'+(await readFile(root+'/qr-fixture.png')).toString('base64');
const report={scope:'Actual game menu + native metadata fixture updates; read-only layout. No game state or clock writes.',viewport:{width:960,height:540},cases:[],passed:false};
try{for(const game of ['twenty-four','prism-relay']){
 const assets=output+'/'+game+'/assets';await mkdir(output+'/'+game);execFileSync('python3',['-c',prepare,repo,game,assets],{env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 const server=await serveAssets(assets),context=await browser.newContext({viewport:report.viewport,locale:'zh-CN'});const page=await context.newPage();
 await context.addInitScript(()=>{window.PureGameHost={getInfo:()=>JSON.stringify({}),snapshot:()=>JSON.stringify({connections:0,players:[]}),publish(){}};});
 try{await page.goto(server.url);await page.waitForFunction(()=>!!window.PureGame);await page.evaluate(()=>document.fonts.ready);
 for(const language of ['zh','en'])for(const state of ['registering','unavailable','stopped']){
  const port=state==='stopped'?0:63485,info={url:'http://192.168.1.50:8123/?room=ui-fixture',qr,addresses:['192.168.1.50'],language,wifiController:{state,serviceName:'pureTV UI fixture',port,serviceType:'_puretv._tcp',version:'1'}};
  await page.evaluate(info=>PureGame.roomInfo(info),info);
  const expected={zh:{registering:'正在发布，可用地址直连',unavailable:'发现不可用，请用地址直连',stopped:'服务未启动，请用扫码/遥控'},en:{registering:'Publishing · direct IP ready',unavailable:'No discovery · use IP below',stopped:'Offline · use QR or remote'}}[language][state];
  await page.waitForFunction(expected=>document.getElementById('kit-wifi-status').textContent===expected,expected);
  const row={game,language,state,port,layout:await page.evaluate(()=>{const panel=document.getElementById('kit-wifi-help'),aside=document.querySelector('aside'),r=panel.getBoundingClientRect(),ar=aside.getBoundingClientRect();const elements=[...panel.children].map(e=>{const range=document.createRange();range.selectNodeContents(e);const b=range.getBoundingClientRect();return{text:e.textContent,left:b.left,right:b.right,top:b.top,bottom:b.bottom,empty:!e.textContent};});return{panel:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},aside:{top:ar.top,bottom:ar.bottom},elements,address:document.getElementById('kit-wifi-address').textContent,topmost:panel.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};})};
  report.cases.push(row);const p=row.layout.panel;assert.ok(row.layout.topmost);assert.ok(p.top>=row.layout.aside.top&&p.bottom<=row.layout.aside.bottom+1);assert.ok(row.layout.elements.every(e=>e.empty||(e.left>=p.left&&e.right<=p.right+1&&e.top>=p.top&&e.bottom<=p.bottom+1)),'Text outside visible Wi-Fi card');assert.equal(row.layout.address,port?'192.168.1.50:63485':'');
  row.screenshot=game+'/'+language+'-'+state+'.png';await page.screenshot({path:output+'/'+row.screenshot});row.passed=true;console.log('PASS '+game+' '+language+' '+state);
 }
 await writeFile(output+'/'+game+'/assets-manifest.json',JSON.stringify(await sourceHashes(assets),null,2)+'\n');
 }finally{await context.close();await server.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');}
}report.passed=true;}catch(error){report.error=error.stack;process.exitCode=1;}finally{await browser.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({passed:report.passed,cases:report.cases.length}));
