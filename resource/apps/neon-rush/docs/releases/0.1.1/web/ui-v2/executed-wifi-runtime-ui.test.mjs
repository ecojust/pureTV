// Actual bundled 3D UI with a synthetic native bridge. Does not verify Android
// NSD, TCP discovery, Wi-Fi radio behavior, or physical ESP32/TV hardware.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { launch, sourceHashes, sha256, tap, delay } from '../../../game-kit/qa/common.mjs';
const assetsArg=process.env.NEON_RUSH_WIFI_UI_ASSETS,outputArg=process.env.NEON_RUSH_WIFI_UI_OUTPUT;
const entry='https://game-kit.invalid/tv.html';
const qr='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><rect width="25" height="25" fill="white"/><path fill="black" d="M2 2h7v7H2zM16 2h7v7h-7zM2 16h7v7H2zM11 11h4v4h-4zM17 15h3v8h-3zM11 19h3v4h-3zM21 20h2v3h-2z"/></svg>').toString('base64');
test('Wi-Fi status and QR controls fit the final Chinese/English game UI',{timeout:150000,skip:!assetsArg&&!outputArg&&'Explicit final assets/output required'},async()=>{
 assert.ok(assetsArg&&outputArg);const assets=path.resolve(assetsArg),output=path.resolve(outputArg);await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Keep previous failures');
 const hashes=await sourceHashes(assets);for(const name of ['game.js','game-model.js','rush-theme.css'])assert.equal(hashes[name],sha256(await readFile(new URL('../src/main/assets/'+name,import.meta.url))));assert.equal(hashes['runtime.js'],sha256(await readFile(new URL('../../../game-kit/web/runtime.js',import.meta.url))));
 const script=await readFile(fileURLToPath(import.meta.url));await writeFile(path.join(output,'executed-wifi-runtime-ui.test.mjs'),script);
 const report={passed:false,scope:'Actual 3D UI with synthetic native bridge and ordinary keyboard controls; no real TCP/mDNS/radio/hardware claim.',sourceAssetHashes:hashes,scriptSha256:sha256(script),physicalTvTested:false,physicalControllerTested:false,layouts:[],statusChecks:[],screenshots:[],visualReviewCompleted:false};
 let browser,context,page;const errors=[];
 try{
  browser=await launch();report.browser=await browser.version();
  for(const language of ['zh','en']){
   context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
   await context.addInitScript(({language,qr})=>{
    window.__wifiUiPlayers=[];window.__wifiUiInfo={language,url:'http://192.0.2.1:4321/?room=fixture',qr,wifiController:{state:'available',serviceName:language==='en'?'Neon Rush TV':'霓虹飞车',port:8765,serviceType:'_puretv._tcp',version:'1'}};
    window.PureGameHost={getInfo:()=>JSON.stringify(window.__wifiUiInfo),snapshot:()=>JSON.stringify({players:window.__wifiUiPlayers}),publish(){}};
   },{language,qr});
   await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.protocol==='data:')return route.continue();if(url.origin!=='https://game-kit.invalid'||url.search||url.hash)return route.abort();const name=url.pathname.slice(1);if(!hashes[name])return route.fulfill({status:404,body:''});const ext=path.extname(name);await route.fulfill({status:200,contentType:ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':'text/html',body:await readFile(path.join(assets,name))});});
   page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
   await page.goto(entry);await page.waitForFunction(()=>window.PureTVQA?.snapshot().renderer.drawCalls>0&&document.querySelector('#rush-wifi-status')?.textContent.includes('霓虹飞车')||window.PureTVQA?.snapshot().renderer.drawCalls>0&&document.querySelector('#rush-wifi-status')?.textContent.includes('Neon Rush TV'));
   for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
    await page.setViewportSize(viewport);await delay(200);const data=await page.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const aside=document.querySelector('aside');const texts=[];const walker=document.createTreeWalker(aside,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||!n.parentElement.getClientRects().length)continue;let hidden=false;for(let p=n.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden')hidden=true;}if(hidden)continue;const range=document.createRange();range.selectNodeContents(n);texts.push({text:n.textContent.trim(),rects:[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}))});}
     return{sidebar:rect(aside),clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,clientWidth:aside.clientWidth,scrollWidth:aside.scrollWidth,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,primary:rect(document.querySelector('#primary')),qr:rect(document.querySelector('#qr')),wifiStatus:document.querySelector('#rush-wifi-status').textContent,texts};
    });
    const screenshot=`${language}-wifi-menu-${viewport.width}.png`;await page.screenshot({path:path.join(output,screenshot)});report.screenshots.push(screenshot);report.layouts.push({language,viewport,...data});
    assert.ok(data.scrollHeight<=data.clientHeight+1&&data.scrollWidth<=data.clientWidth+1,'Panel fits without scrolling');assert.ok(data.documentWidth<=viewport.width+1&&data.documentHeight<=viewport.height+1,'Page fits');assert.ok(data.primary.right<data.sidebar.left,'Primary action and controller panel do not overlap');assert.ok(data.qr.width>=110&&data.qr.height>=110,'QR remains usable');
    for(const item of data.texts)for(const r of item.rects)assert.ok(r.left>=data.sidebar.left-1&&r.right<=data.sidebar.right+1&&r.top>=data.sidebar.top-1&&r.bottom<=data.sidebar.bottom+1,'Unclipped text: '+item.text);
   }
   await page.evaluate(()=>{__wifiUiInfo.wifiController.state='registering';PureGame.roomInfo(__wifiUiInfo);});await page.waitForFunction(()=>/准备|Preparing/.test(document.querySelector('#rush-wifi-status').textContent));
   await page.evaluate(()=>{__wifiUiInfo.wifiController.state='unavailable';PureGame.roomInfo(__wifiUiInfo);});await page.waitForFunction(()=>/暂不可发现|unavailable/.test(document.querySelector('#rush-wifi-status').textContent));assert.equal(await page.locator('#primary').isEnabled(),true);assert.equal(await page.locator('#qr').isVisible(),true);
   await page.evaluate(()=>{__wifiUiPlayers=[{id:1,session:'wifi-first',controllerId:'esp32-fixture',transport:'wifi',connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0}];});await page.waitForFunction(()=>/已连接|Connected/.test(document.querySelector('#rush-wifi-status').textContent));assert.match(await page.locator('#connection').textContent(),/Wi-Fi/);assert.equal(await page.locator('#room-status').textContent(),'LOCAL','Wi-Fi alone does not mark the QR phone connected');
   await page.evaluate(()=>{__wifiUiPlayers[0]={...__wifiUiPlayers[0],transport:'phone',controllerId:'phone-fixture',session:'phone-first'};});await page.waitForFunction(()=>/扫码|Phone controller/.test(document.querySelector('#connection').textContent));assert.equal(await page.locator('#room-status').textContent(),'CONNECTED','Phone bridge marks its own QR status connected');
   await page.evaluate(()=>{__wifiUiPlayers[0]={...__wifiUiPlayers[0],transport:'wifi',controllerId:'esp32-fixture',session:'wifi-returned'};});await page.waitForFunction(()=>/Wi-Fi/.test(document.querySelector('#connection').textContent));assert.equal(await page.locator('#room-status').textContent(),'LOCAL','Switching back to Wi-Fi resets the QR status');
   await tap(page,'Enter');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside')).display==='none');await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused&&getComputedStyle(document.querySelector('aside')).display!=='none');
   report.statusChecks.push({language,registering:true,unavailablePreservesQrAndStart:true,connectedKind:'wifi',wifiKeepsQrLocal:true,phoneSetsQrConnected:true,wifiSwitchResetsQrLocal:true,playingPanelHidden:true,pausedPanelVisible:true});
   await context.close();context=null;
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
 }catch(e){report.error=e.stack;if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});throw e;}
 finally{if(context)await context.close();if(browser)await browser.close();report.errors=errors;await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
});
