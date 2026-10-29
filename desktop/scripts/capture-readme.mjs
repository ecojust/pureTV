/**
 * Capture the real English manager UI with explicitly simulated English device data.
 * From desktop/: npm run build && node scripts/capture-readme.mjs
 * Requires the Playwright Chromium browser (npx playwright install chromium).
 * No ADB, device, downloaded APK or screenshot pixels are modified.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {mockBridge,snapshot} from '../tests/fixtures.mjs';

const desktop=fileURLToPath(new URL('..',import.meta.url));
const output=fileURLToPath(new URL('../../docs/previews/manager-en.png',import.meta.url));
const port=1437,url=`http://127.0.0.1:${port}`;
const state=snapshot();
state.device.model='Demo TV';
state.adbPath='/Applications/platform-tools/adb';
state.systemInfo.manufacturer='Example Electronics';
state.systemInfo.brand='Example TV';
state.systemInfo.cpu='Quad-core ARM Cortex-A55';
state.packages=[
  {packageName:'com.vendor.recommendations',label:'TV Recommendations',system:true,enabled:true,installed:true,protectedReason:null,apkSizeBytes:8*1024*1024},
  {packageName:'com.vendor.voice',label:'Voice Assistant',system:true,enabled:false,installed:true,protectedReason:null,apkSizeBytes:5*1024*1024},
  {packageName:'com.vendor.home',label:'Original TV Launcher',system:true,enabled:true,installed:true,protectedReason:null,apkSizeBytes:12*1024*1024},
  {packageName:'com.android.settings',label:'System Settings',system:true,enabled:true,installed:true,protectedReason:'Core system component',apkSizeBytes:6*1024*1024},
];
for(const [folder,label] of [
  ['launcher/nova','Nova TV'],['launcher/puretv','pureTV Launcher'],
  ['apps/shortvideo','ShortVideo TV'],['apps/webtv','WebTV'],
]){
  const resource=JSON.parse(await readFile(new URL(`../../resource/${folder}/resource.json`,import.meta.url),'utf8'));
  state.packages.push({packageName:resource.packageName,label,system:false,enabled:true,installed:true,protectedReason:folder==='launcher/nova'?'Current default launcher':null,apkSizeBytes:resource.apkBytes});
}
state.defaultHome='com.ecojust.novatv/.MainActivity';
state.originalHome='com.vendor.home/.Main';
state.launchers=[
  {packageName:'com.vendor.home',component:'com.vendor.home/.Main',label:'Original TV Launcher',isDefault:false},
  {packageName:'com.ecojust.novatv',component:state.defaultHome,label:'Nova TV',isDefault:true},
  {packageName:'com.ecojust.puretv',component:'com.ecojust.puretv/.MainActivity',label:'pureTV Launcher',isDefault:false},
];
assert.doesNotMatch(JSON.stringify(state),/\p{Script=Han}/u,'All screenshot fixture values must be English');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:desktop,stdio:['ignore','pipe','pipe']});
let serverLog='',browser;
server.stdout.on('data',data=>serverLog+=data);server.stderr.on('data',data=>serverLog+=data);
try{
  for(let attempt=0;;attempt++){
    if(server.exitCode!==null)throw Error(`Preview failed: ${serverLog}`);
    try{if((await fetch(url)).ok)break;}catch{}
    if(attempt>100)throw Error(`Preview unavailable: ${serverLog}`);
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  const page=await browser.newPage({locale:'en-US',viewport:{width:1440,height:1080},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mockBridge(page,state);
  await page.goto(url);
  await page.getByText(state.device.model,{exact:true}).first().waitFor();
  await page.locator('[name="locale"]').selectOption('en');
  await page.locator('[data-page="apps"]').click();
  await page.locator('.apps-table').waitFor();
  await page.locator('[data-filter="enabled"]').click();
  await page.locator('[data-select-package="com.ecojust.shortvideo"]').check();
  await page.locator('[data-select-package="com.ecojust.webtv"]').check();
  await page.waitForFunction(()=>!document.querySelector('.busy-bar'));
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('h1').innerText(),'Apps');
  const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
  assert.match(await page.locator('.app-version').innerText(),new RegExp(version.replaceAll('.','\\.')));
  assert.equal(await page.locator('.banner.error').count(),0);
  assert.deepEqual(errors,[],'No page errors during capture');
  // Inspect rendered text nodes; closed native select options are not visible text.
  const chinese=await page.evaluate(()=>{
    const result=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,element=node.parentElement;
      if(!/\p{Script=Han}/u.test(node.textContent)||!element||element.closest('option,script,style')||!element.checkVisibility({checkVisibilityCSS:true}))continue;
      const range=document.createRange();range.selectNodeContents(node);
      if([...range.getClientRects()].some(r=>r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth))result.push(node.textContent.trim());
    }
    return result;
  });
  assert.deepEqual(chinese,[],'The visible screenshot must contain no Chinese text');
  await mkdir(fileURLToPath(new URL('../../docs/previews/',import.meta.url)),{recursive:true});
  await page.screenshot({path:output,fullPage:true,animations:'disabled'});
  console.log(`Captured ${output} using the English production frontend with simulated device data.`);
}finally{
  await browser?.close();server.kill();
}
