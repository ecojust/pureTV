import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {launch,serveAssets,sourceHashes,sha256} from '/dev/shm/puretv-controller-games/resource/game-kit/qa/common.mjs';
const repo='/dev/shm/puretv-controller-games',out='/dev/shm/gamekit-english-preview-final',binding=JSON.parse(await readFile(out+'/apk-asset-binding.json','utf8'));
await copyFile(repo+'/resource/game-kit/qa/common.mjs',out+'/executed-common.mjs');
const qrBytes=await readFile(repo+'/resource/game-kit/docs/readme-controller-support/gamekit-ui/qr-fixture.png');await writeFile(out+'/qr-fixture.png',qrBytes);
const qr='data:image/png;base64,'+qrBytes.toString('base64');
const report={startedAt:new Date().toISOString(),sourceSha:binding.sourceSha,scope:'English-gallery menu previews of actual signed-APK asset bytes in Chromium with an explicitly synthetic native bridge; no gameplay regression or Android execution claim.',viewport:{width:1280,height:720},deviceScaleFactor:1,locale:'en-US',physicalTvTested:false,physicalEsp32Tested:false,gameStateWrites:false,clockWrites:false,scriptSha256:sha256(await readFile(new URL(import.meta.url))),cases:[],passed:false};
const browser=await launch();
try{for(const game of binding.games){
 const assets=path.join(repo,game.assets);assert.deepEqual(await sourceHashes(assets),game.assetSha256);
 const config=JSON.parse(await readFile(assets+'/game-config.json','utf8')),server=await serveAssets(assets),context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,locale:'en-US'});
 const row={game:game.id,version:game.version,sourceSha:game.sourceSha,apkSha256:game.apkSha256,assetSha256:game.assetSha256,errors:[],networkErrors:[],ordinaryInputs:[],passed:false};report.cases.push(row);
 await context.addInitScript(({qr,serviceName})=>{window.PureGameHost={getInfo:()=>JSON.stringify({url:'http://192.168.1.50:8123/?room=ui-fixture',qr,addresses:['192.168.1.50'],language:'en',wifiController:{state:'available',serviceName,port:63485,serviceType:'_puretv._tcp',version:'1'}}),snapshot:()=>JSON.stringify({connections:0,players:[]}),publish(){}};},{qr,serviceName:config.nameEn});
 const page=await context.newPage();page.on('pageerror',error=>row.errors.push(error.message));page.on('requestfailed',request=>row.networkErrors.push({url:request.url(),error:request.failure()?.errorText}));
 try{await page.goto(server.url,{waitUntil:'load'});await page.waitForFunction(()=>!!window.PureTVQA);await page.evaluate(()=>document.fonts.ready);
  if(game.id==='neon-rush'){
   await page.waitForFunction(()=>document.getElementById('rush-language-button')?.textContent==='中文');
   await page.locator('#rush-language-button').click();row.ordinaryInputs.push({type:'click',selector:'#rush-language-button',action:'Switch to Chinese'});await page.waitForFunction(()=>document.getElementById('rush-language-button')?.textContent==='EN');
   await page.locator('#rush-language-button').click();row.ordinaryInputs.push({type:'click',selector:'#rush-language-button',action:'Switch to English'});await page.waitForFunction(()=>document.getElementById('rush-language-button')?.textContent==='中文'&&document.documentElement.lang==='en');
   await page.waitForFunction(()=>document.getElementById('rush-wifi-status')?.textContent.includes('63485'));
   row.languageScope='Full English UI through the normal language button; synthetic native locale is English.';
  }else{
   await page.waitForFunction(()=>document.getElementById('kit-wifi-status')?.textContent==='Same Wi-Fi · press Search');
   row.languageScope='Existing English Wi-Fi host instructions only. Game title, rules, controls, and scene remain their actual Chinese content; no translation is fabricated.';
  }
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  row.snapshot=await page.evaluate(()=>PureTVQA.snapshot());assert.equal(row.snapshot.phase,'menu');assert.equal(row.snapshot.level,0);assert.equal(row.snapshot.tick,0);
  row.layout=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};const a=document.querySelector('aside'),w=document.getElementById('rush-wifi-help')||document.getElementById('kit-wifi-help');return{document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},primary:rect(document.getElementById('primary')),aside:{...rect(a),scrollHeight:a.scrollHeight,clientHeight:a.clientHeight},wifi:{...rect(w),text:w.textContent},title:document.getElementById('title').textContent,language:document.documentElement.lang};});
  const l=row.layout;assert.ok(l.document.width<=1281&&l.document.height<=721);assert.ok(l.primary.x>=0&&l.primary.y>=0&&l.primary.right<=1281&&l.primary.bottom<=721);assert.ok(l.wifi.y>=l.aside.y&&l.wifi.bottom<=l.aside.bottom+1&&l.wifi.text.includes('192.168.1.50:63485'));
  row.screenshot=game.id+'-1280-menu-en.png';await page.screenshot({path:out+'/'+row.screenshot});row.screenshotSha256=sha256(await readFile(out+'/'+row.screenshot));assert.deepEqual(row.errors,[]);assert.deepEqual(row.networkErrors,[]);assert.deepEqual(await sourceHashes(assets),row.assetSha256);row.passed=true;console.log('PASS '+game.id+' '+row.screenshotSha256);
 }catch(error){row.error=error.stack;await page.screenshot({path:out+'/'+game.id+'-failure.png'}).catch(()=>{});throw error;}finally{await context.close();await server.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
}report.passed=true;}catch(error){report.error=error.stack;process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,output:out}));
