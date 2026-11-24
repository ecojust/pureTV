import {launch,serveAssets,sourceHashes,tap,delay} from '/dev/shm/puretv-neon-macos/resource/game-kit/qa/common.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='/dev/shm/neon-macos-012-preflight/ui',assets='/dev/shm/neon-macos-012-preflight/web';
const report={passed:false,scope:'Chromium game presentation with production macOS bridge and synthetic native snapshots; not native macOS/TCP/mDNS/hardware validation.',layouts:[],checks:[],errors:[],assetHashes:await sourceHashes(assets)};
const server=await serveAssets(assets),browser=await launch();let page;
try {
 for(const lang of ['zh','en']) {
  const ctx=await browser.newContext({viewport:{width:1280,height:720}});
  const bridge=await readFile(assets+'/bridge.js','utf8');
  await ctx.addInitScript({content:bridge+'\nNeonDesktop.receive('+JSON.stringify({language:lang,appVersion:'0.1.2',wifiController:{state:'available',serviceName:'Neon Rush',port:8765,addresses:['192.0.2.10']},preferences:{'neon-rush.language':lang}})+',{revision:0,players:[]});'});
  page=await ctx.newPage(); page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(server.url+'tv.html');await page.waitForFunction(()=>window.PureTVQA?.snapshot().renderer.drawCalls>0);
  for(const viewport of [{width:960,height:540},{width:1280,height:720}]) {
   await page.setViewportSize(viewport);await delay(300);
   await page.evaluate(() => NeonDesktop.receive({...JSON.parse(PureGameHost.getInfo()),wifiController:{...JSON.parse(PureGameHost.getInfo()).wifiController,inputEnabled:false}},{revision:1,players:[]}));
   await delay(100);
   assert.equal(await page.locator('#version').textContent(),'0.1.2');
   assert.equal(await page.locator('#room-status').textContent(),'PAUSED');
   const layout=await page.evaluate(()=>{const aside=document.querySelector('aside'),p=document.querySelector('#primary'),r=aside.getBoundingClientRect(),b=p.getBoundingClientRect();return{clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,clientWidth:aside.clientWidth,scrollWidth:aside.scrollWidth,primaryRight:b.right,asideLeft:r.left,qrVisible:document.querySelector('#qr-wrap').getClientRects().length>0,address:document.querySelector('#room-address').textContent,bodyText:document.body.innerText,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight};});
   await page.screenshot({path:`${out}/${lang}-${viewport.width}-menu.png`}); report.layouts.push({language:lang,viewport,...layout});
   assert.ok(layout.scrollHeight<=layout.clientHeight+1,'sidebar scroll');assert.ok(layout.scrollWidth<=layout.clientWidth+1,'sidebar horizontal overflow');assert.ok(layout.primaryRight<layout.asideLeft,'primary obscured');assert.ok(layout.pageWidth<=viewport.width&&layout.pageHeight<=viewport.height,'page overflow');assert.equal(layout.qrVisible,false);assert.ok(layout.address.includes('192.0.2.10:8765'));assert.doesNotMatch(layout.bodyText,/扫码|SCAN TO|Android|Open the TV/);
  }
  await page.evaluate(() => NeonDesktop.receive({...JSON.parse(PureGameHost.getInfo()),wifiController:{...JSON.parse(PureGameHost.getInfo()).wifiController,inputEnabled:true}},{revision:2,players:[]}));
  await tap(page,'Enter');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside')).display==='none');
  await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside')).display!=='none');
  await page.screenshot({path:`${out}/${lang}-paused.png`});
  await page.click('#rush-phone-button');await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside')).display==='none');
  await page.click('#rush-phone-button');await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside')).display!=='none');
  report.checks.push({language:lang,keyboardStartPause:true,panelToggle:true});
  await ctx.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
} catch(e) {report.error=e.stack;await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();await server.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
