import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium, serveAssets, sourceHashes, sha256 } from '/workspace/pureTV/resource/game-kit/qa/common.mjs';
const output=path.dirname(fileURLToPath(import.meta.url));
const assets='/workspace/scratch/neon-rush-wifi-signed-assets';
const apk='/workspace/pureTV/resource/apps/neon-rush/neon-rush-0.1.1.apk';
const args=['--no-sandbox','--disable-webgl','--disable-background-timer-throttling'];
const report={schema:1,startedAt:new Date().toISOString(),status:'running',scope:'Chromium missing-WebGL error-UI check of exact signed 0.1.1 assets; not Android WebView execution or diagnosis of the user device',physicalTvTested:false,actualAndroidHostTested:false,productionCodeModified:false,rendererApisReplaced:false,modelOrClockModified:false,launchArgs:args,viewport:{width:1280,height:720},apk,apkSha256:sha256(await readFile(apk)),sourceAssetHashes:await sourceHashes(assets),scriptSha256:sha256(await readFile(fileURLToPath(import.meta.url))),console:[],pageErrors:[],networkFailures:[],checks:[],normalBaseline:'Retain prior actual 0.1.1 normal renderer / gameplay evidence under resource/apps/neon-rush/docs/releases/0.1.1. No normal race rerun.'};
let server,browser;
try {
 server=await serveAssets(assets);browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args});
 report.browserVersion=browser.version();
 const context=await browser.newContext({viewport:report.viewport,locale:'zh-CN',deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('console',m=>report.console.push({type:m.type(),text:m.text()}));
 page.on('pageerror',e=>report.pageErrors.push(e.stack||e.message));
 page.on('requestfailed',r=>report.networkFailures.push({url:r.url(),failure:r.failure()}));
 await page.goto(server.url+'tv.html',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.PureTVQA?.snapshot==='function');
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);});
 report.observed=await page.evaluate(()=>{
  const text=id=>document.getElementById(id)?.textContent;
  const element=document.getElementById('dialog-copy'),box=element.getBoundingClientRect(),title=document.getElementById('dialog-title'),t=title.getBoundingClientRect();
  const testCanvas=document.createElement('canvas');
  return{url:location.href,title:document.title,dialogTitle:text('dialog-title'),dialogCopy:text('dialog-copy'),message:text('message'),primaryDisabled:document.getElementById('primary').disabled,errorClass:document.body.classList.contains('rush-webgl-error'),overlayHidden:document.getElementById('overlay').hidden,errorTextVisible:getComputedStyle(element).visibility!=='hidden'&&box.width>0&&box.height>0&&box.top>=0&&box.bottom<=innerHeight,titleVisible:t.width>0&&t.height>0&&t.top>=0&&t.bottom<=innerHeight,unmodifiedBrowserWebgl2Available:!!testCanvas.getContext('webgl2'),unmodifiedBrowserWebglAvailable:!!testCanvas.getContext('webgl'),snapshot:window.PureTVQA.snapshot()};
 });
 await page.screenshot({path:path.join(output,'webgl-disabled-1280x720.png')});
 const o=report.observed;
 for(const [name,passed] of Object.entries({browserActuallyLacksWebGL:!o.unmodifiedBrowserWebgl2Available&&!o.unmodifiedBrowserWebglAvailable,gameRuntimeInitialized:o.snapshot?.id==='neon-rush',notStuckOnDefaultLoadingPage:o.title==='霓虹飞车'&&o.dialogTitle!=='准备好了吗？',unsupportedRendererReported:o.snapshot?.renderer?.backend==='unsupported',actualErrorMessageVisible:o.errorTextVisible&&o.titleVisible&&o.dialogTitle==='此设备暂不支持 3D 竞速'&&o.dialogCopy.includes('无法建立 WebGL 画面'),startButtonDisabled:o.primaryDisabled,noUncaughtPageErrors:report.pageErrors.length===0,noRequestFailures:report.networkFailures.length===0}))report.checks.push({name,passed});
 assert.ok(report.checks.every(x=>x.passed),'All error-UI checks should pass');report.status='passed';
} catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;}
finally {if(browser)await browser.close();if(server)await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,checks:report.checks,observed:report.observed&&{dialogTitle:report.observed.dialogTitle,dialogCopy:report.observed.dialogCopy,renderer:report.observed.snapshot?.renderer},error:report.error}));
