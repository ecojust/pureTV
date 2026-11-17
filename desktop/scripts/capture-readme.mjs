/**
 * Capture the real Chinese and English manager UI with explicitly simulated device data.
 * From desktop/: npm run build && node scripts/capture-readme.mjs
 * Requires Playwright Chromium, or set CHROMIUM_PATH to an installed Chromium binary.
 * No ADB, device, downloaded APK or screenshot pixels are modified.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {mockBridge,snapshot} from '../tests/fixtures.mjs';

const desktop=fileURLToPath(new URL('..',import.meta.url));
const outputDirectory=fileURLToPath(new URL('../../docs/previews/',import.meta.url));
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
  await mkdir(outputDirectory,{recursive:true});
  const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
  for(const capture of [
    {locale:'zh-CN',browserLocale:'zh-CN',file:'manager-zh.png',heading:'应用管理',guide:'兼容性方案'},
    {locale:'en',browserLocale:'en-US',file:'manager-en.png',heading:'Apps',guide:'Compatibility'},
  ]){
    const example=structuredClone(state);
    if(capture.locale==='zh-CN'){
      example.device.model='演示电视';
      example.systemInfo.manufacturer='示例电子';example.systemInfo.brand='示例电视';
      const labels={'com.vendor.recommendations':'电视内容推荐','com.vendor.voice':'语音助手','com.vendor.home':'原厂桌面','com.android.settings':'系统设置'};
      for(const app of example.packages){
        app.label=labels[app.packageName]||app.label;
        if(app.protectedReason)app.protectedReason=app.packageName==='com.android.settings'?'关键系统组件':'当前默认启动器';
      }
      example.launchers[0].label='原厂桌面';
    }
    const page=await browser.newPage({locale:capture.browserLocale,viewport:{width:1440,height:1080},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await mockBridge(page,example);
    await page.goto(url);
    await page.getByText(example.device.model,{exact:true}).first().waitFor();
    await page.locator('[name="locale"]').selectOption(capture.locale);
    await page.locator('[name="theme"]').selectOption('emerald');
    await page.locator('[data-page="apps"]').click();
    await page.locator('.apps-table').waitFor();
    await page.locator('[data-filter="enabled"]').click();
    await page.locator('[data-select-package="com.ecojust.shortvideo"]').check();
    await page.locator('[data-select-package="com.ecojust.webtv"]').check();
    await page.waitForFunction(()=>!document.querySelector('.busy-bar'));
    await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    assert.equal(await page.locator('html').getAttribute('lang'),capture.locale);
    assert.equal(await page.locator('html').getAttribute('data-theme'),'emerald');
    assert.equal(await page.locator('h1').innerText(),capture.heading);
    assert.equal(await page.locator('[data-page="info"]').innerText(),capture.guide);
    assert.equal(await page.locator('.app-version').innerText(),'v'+version);
    assert.equal(await page.locator('.banner.error').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),true,'The manager fits the screenshot viewport');
    assert.deepEqual(errors,[],'No page errors during capture');
    if(capture.locale==='en'){
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
      assert.deepEqual(chinese,[],'The visible English screenshot must contain no Chinese text');
    }
    const output=outputDirectory+capture.file;
    await page.screenshot({path:output,fullPage:true,animations:'disabled'});
    console.log(`Captured ${output} using the ${capture.locale} production frontend with simulated device data.`);
    await page.close();
  }
}finally{
  await browser?.close();server.kill();
}
