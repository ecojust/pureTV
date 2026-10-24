import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { mockBridge, snapshot } from './fixtures.mjs';

const directory = fileURLToPath(new URL('..', import.meta.url));
const port = 1429, url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = ''; server.stdout.on('data', d => serverLog += d); server.stderr.on('data', d => serverLog += d);
let browser, passed = 0;
const act = (p, action) => p.locator(`[data-act="${action}"]`).first();
const nav = async (p, page) => {if(page==='install'){await p.locator('[data-page="apps"]').click();await p.locator('[data-act="go-install"]').first().click();}else await p.locator(`[data-page="${page}"]`).click();};
const requests = p => p.evaluate(() => window.__requests);
const box = (p, pkg) => p.locator(`input[data-select-package="${pkg}"]`);
const settled = p => p.waitForFunction(() => !document.querySelector('.busy-bar'));
async function confirmOperation(p) {
  const before = (await requests(p)).length;
  await p.locator('#confirm-operation').click();
  await p.waitForFunction(n => window.__requests.length > n, before);
  await settled(p);
}
function withoutAdb() {
  return {...snapshot(),adbPath:null,adbAvailable:false,device:null,packages:[],launchers:[],defaultHome:null};
}
async function acceptTools(p) {
  const before = await p.evaluate(()=>window.__toolsInstalls);
  await p.locator('#platform-tools-license').check();
  await p.locator('#confirm-platform-tools').click();
  await p.waitForFunction(n=>window.__toolsInstalls > n, before);
}
const captureDir = process.env.PURETV_CAPTURE_DIR;
async function shot(p, name) { if (captureDir) { await mkdir(captureDir, { recursive: true }); await p.screenshot({path:`${captureDir}/${name}.png`, fullPage:true}); } }
async function check(name, run, state = snapshot(), options = {}) {
  const context = await browser.newContext({ locale:'zh-CN', viewport: { width: 1440, height: 1000 } });
  const p = await context.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  try {
    if (state) await mockBridge(p, state, options);
    await p.goto(url);
    await p.locator('.connection-strip').waitFor();
    if (state?.device) await p.getByText(state.device.model, { exact:true }).first().waitFor();
    await run(p);
    assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
    console.log(`PASS ${++passed}: ${name}`);
  } catch (e) { await shot(p, `failed-${passed+1}`); throw new Error(`${name}: ${e.message}`, {cause:e}); }
  finally { await context.close(); }
}
try {
  for (let attempt = 0; ; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview server stopped: ${serverLog}`);
    try { if ((await fetch(url)).ok) break; } catch { /* Startup only. */ }
    if (attempt > 100) throw new Error(`Preview did not start: ${serverLog}`);
    await new Promise(resolve => setTimeout(resolve,100));
  }
  browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox']});
  await check('browser preview never pretends to connect', async p => {
    assert.match(await p.locator('.warning-banner').innerText(), /浏览器预览/);
    assert.equal(await act(p,'connect').isDisabled(), true);
    assert.equal(await act(p,'download-adb').isDisabled(), true);
    await nav(p,'apps'); assert.equal(await p.locator('input[data-select-package]').count(),0);
  }, null);
  await check('local computer IPs are labeled independently from TV, refresh before ADB, and stay on home',async p=>{
    await p.locator('.local-network-addresses').waitFor();
    assert.match(await p.locator('.local-network-panel').innerText(),/192.168.0.2\/24/);assert.match(await p.locator('.local-network-panel').innerText(),/Ethernet/);
    assert.equal(await p.locator('[name="host"]').inputValue(),'');assert.equal(await act(p,'connect').isDisabled(),true);assert.equal(await act(p,'refresh-local-network').isEnabled(),true);
    await act(p,'refresh-local-network').click();await settled(p);assert.match(await p.locator('.local-network-panel').innerText(),/192.168.8.2/);assert.equal(await p.locator('.local-network-panel').getByText('192.168.0.2/24').count(),0);
    assert.deepEqual(await requests(p),[{action:'refreshLocalNetwork'}]);
    await p.locator('[name="locale"]').selectOption('en');assert.match(await p.locator('.local-network-panel').innerText(),/LAN IP/);
    await nav(p,'apps');assert.equal(await p.locator('.local-network-panel').count(),0);
  },{...withoutAdb(),localNetwork:snapshot().localNetwork},{localNetworkAfterRefresh:{addresses:[{interfaceName:'Wi-Fi',ip:'192.168.8.2',prefixLength:24}],error:null}});
  await check('missing local network addresses are explicit and never replaced with sample data',async p=>{
    await p.waitForFunction(()=>document.querySelector('.local-network-panel').textContent.includes('未检测到'));
    assert.equal(await p.locator('.local-network-addresses').count(),0);
    await p.locator('[name="locale"]').selectOption('zh-TW');assert.match(await p.locator('.local-network-panel').innerText(),/未偵測到/);
  },{...withoutAdb(),localNetwork:{addresses:[],error:null}});
  await check('language and skins switch at runtime without translating app data',async p=>{
    await p.locator('[name="locale"]').selectOption('en');assert.equal(await p.locator('h1').innerText(),'Connection');
    await nav(p,'apps');assert.equal(await p.locator('h1').innerText(),'Apps');assert.match(await p.locator('.apps-table').innerText(),/厂商推荐/);
    assert.equal(await act(p,'scan').innerText(),'Scan again');assert.match(await p.locator('.apps-table').innerText(),/APK size/);
    await p.locator('[name="theme"]').selectOption('graphite');assert.equal(await p.locator('html').getAttribute('data-theme'),'graphite');
    assert.equal(await p.locator('.panel').first().evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(28, 40, 36)');
    await p.locator('[name="locale"]').selectOption('zh-TW');assert.equal(await p.locator('html').getAttribute('lang'),'zh-TW');assert.match(await p.locator('h1').innerText(),/應用/);
    assert.deepEqual(await requests(p),[],'Appearance changes do not change the TV');await p.reload();await p.locator('.connection-strip').waitFor();
    assert.equal(await p.locator('html').getAttribute('lang'),'zh-TW');assert.equal(await p.locator('html').getAttribute('data-theme'),'graphite');
  });
  await check('English diagnostics translate formatted counts and retain package data',async p=>{
    await p.locator('[name="locale"]').selectOption('en');await p.locator('[name="host"]').fill('bad;host');await act(p,'connect').click();assert.match(await p.locator('.notice.error').innerText(),/Enter a valid TV IP/);
    const state=snapshot();state.revision=1;state.message='安装完成：成功 1 项，失败 2 项，未执行 3 项';
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install',snapshot:value}),state);
    assert.match(await p.locator('.notice').innerText(),/Installation finished: 1 succeeded, 2 failed, 3 skipped/);
    await p.evaluate(()=>{window.__interfacePreferences={locale:'en',theme:'ocean'};window.__emitMcp('interface-preferences',window.__interfacePreferences);});
    assert.equal(await p.locator('html').getAttribute('data-theme'),'ocean');
  });
  await check('MCP configuration and agent operations synchronize with the window', async p => {
    await p.locator('.mcp-config').waitFor();
    assert.match(await p.locator('.mcp-config').innerText(), /--mcp/);
    await p.evaluate(() => window.__emitMcp('mcp-operation',{running:true,tool:'scan'}));
    await p.locator('.busy-bar').waitFor();
    assert.equal(await act(p,'connect').isDisabled(),true);
    const updated = snapshot(); updated.revision = 2; updated.device.model = 'Agent TV'; updated.message = 'Agent 扫描完成';
    await p.evaluate(value => window.__emitMcp('mcp-operation',{running:false,tool:'scan',snapshot:value}),updated);
    await settled(p);
    assert.match(await p.locator('.device-badge').innerText(), /Agent TV/);
    assert.match(await p.locator('.notice').innerText(), /Agent 扫描完成/);
    await p.evaluate(value => window.__emitMcp('mcp-operation',{running:false,tool:'scan',snapshot:value}),snapshot());
    assert.match(await p.locator('.device-badge').innerText(), /Agent TV/, 'Older state must not replace a newer agent result');
    await p.evaluate(() => window.__emitMcp('mcp-operation',{running:true,tool:'install_platform_tools'}));
    await p.evaluate(() => window.__emitMcp('mcp-progress',{stage:'downloading',downloaded:50,total:100}));
    assert.match(await p.locator('.busy-bar').innerText(),/50%/);
    await p.evaluate(value => window.__emitMcp('mcp-operation',{running:false,tool:'install_platform_tools',snapshot:value,error:'下载已取消'}),updated);
    assert.match(await p.locator('.notice.error').innerText(),/下载已取消/);
  },withoutAdb());
  await check('finishing a GUI request does not clear the next agent busy state', async p => {
    await nav(p,'apps'); await act(p,'scan').click();
    await p.locator('.busy-bar').waitFor();
    await p.evaluate(() => window.__emitMcp('mcp-operation',{running:true,tool:'scan'}));
    await p.waitForTimeout(750);
    assert.equal(await act(p,'scan').isDisabled(),true);
    assert.match(await p.locator('.busy-bar').innerText(),/Agent/);
    await p.evaluate(value => window.__emitMcp('mcp-operation',{running:false,tool:'scan',snapshot:value}),snapshot());
    await settled(p);
  },snapshot(),{slowScan:true});
  await check('user APK sizes are explicit and missing sizes are not invented', async p => {
    await nav(p,'apps');
    assert.match(await p.locator('tr[data-package="com.ecojust.webtv"] .size-cell').innerText(),/12.0 MiB/);
    assert.equal(await p.locator('tr[data-package="com.ecojust.puretv"] .size-cell').innerText(),'未能读取');
    assert.equal(await p.locator('tr[data-package="com.android.settings"] .size-cell').innerText(),'未能读取');
    await p.locator('tr[data-package="com.ecojust.webtv"] [data-act="details"]').click();
    assert.match(await p.locator('dialog.modal').innerText(),/不含私有数据和缓存/);
  });
  const longState = snapshot();
  longState.packages = Array.from({length:120},(_,i)=>({packageName:`com.example.app${i}`,label:`应用 ${i}`,installed:true,system:false,enabled:true,protectedReason:null,apkSizeBytes:1048576}));
  longState.launchers = Array.from({length:30},(_,i)=>({packageName:`com.example.home${i}`,component:`com.example.home${i}/.Main`,label:`桌面 ${i}`,isDefault:false}));
  longState.history = Array.from({length:100},(_,i)=>({id:String(i),timestamp:1,action:'install',target:`com.example.app${i}`,device:'tv',userId:0,success:true,message:'已完成'}));
  await check('all long lists scroll internally while top actions and surrounding content stay fixed', async p => {
    for (const viewport of [{width:1440,height:900},{width:960,height:640}]) {
      await p.setViewportSize(viewport);
      for (const [page,key] of [['apps','apps'],['launchers','launchers'],['history','history'],['install','apks']]) {
        await nav(p,page);
        if (page==='install' && !await p.locator('[data-scroll="apks"]').count()) await act(p,'add-apks').click();
        const area = p.locator(`[data-scroll="${key}"]`);
        const metrics = await area.evaluate(el=>({height:el.clientHeight,total:el.scrollHeight}));
        assert.ok(metrics.height>45 && metrics.total>metrics.height,`${page} has a usable internal scroll area at ${viewport.width}: ${JSON.stringify(metrics)}`);
        assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),`${page}: no document vertical overflow`);
        const header = await p.locator('.page-header').boundingBox();
        const toolbar = page==='apps' ? p.locator('#selection-bar') : page==='install' ? p.locator('.install-footer') : null;
        if (toolbar) assert.ok((await toolbar.boundingBox()).y+(await toolbar.boundingBox()).height <= (await area.boundingBox()).y+1,'Batch actions are above the list');
        await area.evaluate(el=>{el.scrollTop=1000;});
        const box = await area.boundingBox(); await p.mouse.move(box.x+box.width/2,box.y+box.height/2); await p.mouse.wheel(0,500);
        await p.waitForTimeout(80);
        assert.ok(await area.evaluate(el=>el.scrollTop>0));
        assert.equal((await p.locator('.page-header').boundingBox()).y,header.y,'Header does not move');
        assert.equal(await p.evaluate(()=>scrollY),0);
        if (page==='apps') {
          const before=await area.evaluate(el=>el.scrollTop);
          await p.locator('[data-select-all]').check();
          assert.equal(await area.evaluate(el=>el.scrollTop),before,'Selection keeps list position');
          const head=await p.locator('.apps-table thead th').first().boundingBox();
          assert.ok(head.y >= box.y-1,'Table headings remain visible');
        }
        if (page==='install') {
          if (await act(p,'clear-apks-selection').isDisabled()) await act(p,'select-apks').click();
          const before=await area.evaluate(el=>el.scrollTop);
          await act(p,'clear-apks-selection').click();
          assert.equal(await area.evaluate(el=>el.scrollTop),before,'APK rerender keeps list position');
        }
      }
    }
    await nav(p,'apps');
    assert.equal(await p.locator('html').evaluate(element=>getComputedStyle(element).overscrollBehaviorY),'none');
    assert.equal(await p.locator('.table-scroll').evaluate(element=>getComputedStyle(element).overscrollBehaviorY),'none');
    assert.equal(await p.locator('.sidebar-foot').count(),0);
    await shot(p,'scrolling-lists');
  },longState,{apkPaths:Array.from({length:40},(_,i)=>`/tmp/application-${i}.apk`)});
  await check('unsupported launcher has no layout button or screenshot controls',async p=>{
    await nav(p,'launchers');await settled(p);
    assert.equal(await act(p,'open-layout').count(),0);assert.equal(await act(p,'capture-launcher').count(),0);
    assert.equal(await p.locator('.launcher-card-background').count(),0,'No cover unless user provides an image');
  });
  const customHome = snapshot(); customHome.defaultHome='com.ecojust.puretv/.MainActivity';
  customHome.launchers.forEach(l=>l.isDefault=l.component===customHome.defaultHome);
  await check('current launcher opens a global canvas with independent home and apps layouts',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();
    await p.locator('.layout-modal[open] .tv-canvas').waitFor();
    await p.locator('[name="layoutColumns"]').fill('3');await p.locator('[name="layoutColumns"]').dispatchEvent('change');
    await p.locator('[data-layout-tile="1"]').click();await act(p,'layout-up').click();
    await p.locator('[data-layout-label="0"]').fill('文件入口');await p.locator('[data-layout-label="0"]').dispatchEvent('change');
    await p.locator('[name="layoutApp"]').selectOption('com.ecojust.webtv');await act(p,'layout-add').click();
    let draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.columns,3);assert.equal(draft.apps.columns,3);assert.equal(draft.home.items[0].action,'files');
    assert.doesNotMatch(await p.locator('[name="layoutApp"]').innerText(),/系统启动器|未安装应用/);
    await act(p,'layout-apps').click();await p.locator('[name="layoutColumns"]').fill('5');await p.locator('[name="layoutColumns"]').dispatchEvent('change');
    await act(p,'layout-home').click();assert.equal(await p.locator('[name="layoutColumns"]').inputValue(),'3');
    await act(p,'apply-layout').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));await settled(p);
    const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));assert.equal(applied.layout.apps.columns,5);assert.equal(applied.layout.home.items[0].label,'文件入口');
    await act(p,'import-layout').click();assert.equal(JSON.parse(await p.locator('[name="layoutJson"]').inputValue()).home.columns,2);
    await act(p,'reset-layout').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='resetLayout'));await settled(p);
    assert.equal(JSON.parse(await p.locator('[name="layoutJson"]').inputValue()).home.columns,4);
    const another=structuredClone(customHome);another.device.serial='192.168.1.51:5555';another.revision=1;
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'connect',snapshot:value}),another);
    assert.equal(await p.locator('.layout-modal[open]').count(),0,'Device changes close the canvas');
  },customHome,{layoutSupported:true});
  await check('canvas drag reorders cards and cancel never writes to TV',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();
    await p.locator('[data-layout-tile="0"]').dragTo(p.locator('[data-layout-tile="2"]'));
    const draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.items[2].action,'music');
    await act(p,'close-layout').click();assert.equal(await p.locator('.layout-modal[open]').count(),0);
    assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(r=>r.action==='applyLayout').length),0);
  },customHome,{layoutSupported:true});
  await check('system information is visible at home and connection controls stay only there', async p => {
    assert.match(await p.locator('.device-info').innerText(),/Test Maker/);
    assert.match(await p.locator('.device-info').innerText(),/4.0 GiB/);
    assert.match(await p.locator('.device-info').innerText(),/32.0 GiB/);
    assert.equal(await p.locator('[data-page="install"]').count(),0,'No separate install navigation');
    for(const page of ['apps','launchers','install','history']) {
      await nav(p,page);assert.equal(await p.locator('.connection-strip').count(),0,`No connection form on ${page}`);
      assert.match(await p.locator('.device-badge').innerText(),/已连接/);
    }
    await nav(p,'connect');assert.equal(await p.locator('[name="host"]').count(),1);
  });
  await check('removed live view and pairing are absent',async p=>{
    assert.equal(await p.locator('[data-page="live"]').count(),0);assert.equal(await p.locator('[name="pairCode"]').count(),0);assert.equal(await act(p,'go-live').count(),0);
  });
  await check('launcher APK installs on the same page and covers are optional backgrounds',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'add-launcher').click();
    assert.equal(await p.locator('.pending-launcher').count(),1);assert.equal(await p.locator('.pending-launcher .launcher-card-background').count(),1);
    await act(p,'install-launcher').click();await confirmOperation(p);assert.equal(await p.locator('.pending-launcher').count(),0);
    assert.equal(await p.locator('[data-page="launchers"]').getAttribute('aria-current'),'page');
    await act(p,'launcher-cover').click();assert.equal(await p.locator('.launcher-card-background').count(),1);
    await act(p,'remove-launcher-cover').click();assert.equal(await p.locator('.launcher-card-background').count(),0);
    await p.setViewportSize({width:1000,height:700});
    assert.equal(await p.locator('.launcher-card').evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('button')].every(button=>{const c=card.getBoundingClientRect(),b=button.getBoundingClientRect();return b.left>=c.left && b.right<=c.right && b.bottom<=c.bottom;}))),true,'Card buttons stay inside cards');
  },snapshot(),{thumbnail:true});
  await check('one pending APK installs independently and leaves the other rows',async p=>{
    await nav(p,'install');await act(p,'add-apks').click();await p.locator('.apk-item').first().waitFor();
    await p.locator('.apk-item').nth(1).locator('[data-act="install-one-apk"]').click();await confirmOperation(p);
    assert.deepEqual((await requests(p)).find(r=>r.action==='install').paths,['/tmp/second.apk']);assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/first.apk/);
  },snapshot(),{apkPaths:['/tmp/first.apk','/tmp/second.apk']});
  await check('pending APKs install inside app management and new apps become layout choices', async p => {
    await nav(p,'install');await act(p,'add-apks').click();await p.locator('.apk-item').first().waitFor();
    await act(p,'install-apks').click();await confirmOperation(p);
    assert.equal(await p.locator('.apk-item').count(),0,'Successful installs leave the pending queue');
    await act(p,'go-apps').click();assert.equal(await box(p,'com.imported.app').count(),1);
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[name="layoutApp"]').waitFor();
    assert.match(await p.locator('[name="layoutApp"]').innerText(),/新安装应用/);
  },customHome,{layoutSupported:true});
  await check('partial installation removes only successful paths and retains failures', async p => {
    await nav(p,'install');await act(p,'add-apks').click();await p.locator('.apk-item').first().waitFor();
    await act(p,'install-apks').click();await confirmOperation(p);
    assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/failed.apk/);
    assert.match(await p.locator('.notice.error').innerText(),/失败 1 项/);
  },snapshot(),{apkPaths:['/tmp/success.apk','/tmp/failed.apk'],partialInstall:true});
  await check('connecting stays at home and immediately presents system information', async p => {
    await p.locator('[name="host"]').fill('192.168.1.50');await act(p,'connect').click();
    await p.waitForFunction(()=>window.__requests.some(r=>r.action==='connect'));await settled(p);
    assert.equal(await p.locator('[data-page="connect"]').getAttribute('aria-current'),'page');
    await p.locator('.device-info').waitFor();
    const info=await p.locator('.device-info').boundingBox();assert.ok(info.y<400,'System information is near the top after connecting');
    assert.match(await p.locator('.device-info').innerText(),/32.0 GiB/);
  },{...snapshot(),device:null,packages:[],launchers:[],defaultHome:null});
  await check('official ADB setup requires explicit license consent and configures automatically', async p => {
    assert.equal(await act(p,'connect').isDisabled(),true);
    assert.equal(await p.evaluate(()=>window.__toolsInstalls),0,'Startup must not download');
    await act(p,'download-adb').click();
    assert.match(await p.locator('dialog.modal').innerText(),/37\.0\.1/);
    assert.match(await p.locator('dialog.modal').innerText(),/macOS/);
    assert.match(await p.locator('dialog.modal').innerText(),/15\.4 MiB/);
    assert.match(await p.locator('dialog.modal').innerText(),/dl\.google\.com/);
    assert.match(await p.locator('dialog.modal').innerText(),/mirrors\.cloud\.tencent\.com/);
    assert.equal(await p.locator('#platform-tools-license').isChecked(),false);
    assert.equal(await p.locator('#confirm-platform-tools').isDisabled(),true);
    await act(p,'platform-tools-license').click();
    assert.deepEqual(await p.evaluate(()=>window.__resources),['platformToolsLicense']);
    await act(p,'close-dialog').click(); assert.equal(await p.evaluate(()=>window.__toolsInstalls),0);
    await act(p,'download-adb').click(); await acceptTools(p);
    await p.locator('.busy-bar').waitFor();
    assert.match(await p.locator('.busy-bar').innerText(),/50%/);
    assert.equal(await p.locator('progress').getAttribute('max'),'16110554');
    assert.equal(await act(p,'choose-adb').isDisabled(),true);
    await settled(p);
    assert.deepEqual(await requests(p),[{action:'installPlatformTools',acceptedLicense:true}]);
    assert.match(await p.locator('.notice.success').innerText(),/ADB 已就绪/);
    assert.match(await p.locator('[name="adbPath"]').inputValue(),/platform-tools-37\.0\.1/);
    assert.equal(await act(p,'connect').isEnabled(),true);
    assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);assert.equal(await act(p,'download-adb').isDisabled(),true);
    await shot(p,'adb-ready');
  },withoutAdb(),{slowDownload:true});
  await check('ADB download failure stays unconfigured and can be retried', async p => {
    await act(p,'download-adb').click(); await acceptTools(p); await settled(p);
    assert.match(await p.locator('.notice.error').innerText(),/下载失败/);
    assert.equal(await act(p,'connect').isDisabled(),true);
    assert.equal(await p.locator('[name="adbPath"]').inputValue(),'');
    await act(p,'download-adb').click();
    assert.equal(await p.locator('#platform-tools-license').isChecked(),false,'Consent is explicit on retry');
    await acceptTools(p); await settled(p);
    assert.equal(await p.evaluate(()=>window.__toolsInstalls),2);
    assert.equal(await act(p,'connect').isEnabled(),true);
  },withoutAdb(),{failDownloadOnce:true});
  await check('ADB download cancellation retains setup controls and does not show success', async p => {
    await act(p,'download-adb').click(); await acceptTools(p); await p.locator('.busy-bar').waitFor();
    assert.equal(await act(p,'cancel').innerText(),'取消下载');
    await act(p,'cancel').click();
    assert.match(await p.locator('.busy-bar').innerText(),/清理临时文件/);
    assert.doesNotMatch(await p.locator('.busy-bar').innerText(),/当前修改会完成/);
    await settled(p);
    assert.match(await p.locator('.notice.info').innerText(),/已取消/);
    assert.equal(await p.locator('.notice.success').count(),0);
    assert.equal(await act(p,'download-adb').isEnabled(),true);
    assert.equal(await act(p,'connect').isDisabled(),true);
    assert.deepEqual(await requests(p),[{action:'installPlatformTools',acceptedLicense:true},{action:'cancel'}]);
  },withoutAdb(),{slowDownload:true});
  await check('ADB ready status prevents redundant setup and connected TVs prevent switching',async p=>{
    assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);assert.equal(await act(p,'download-adb').isDisabled(),true);
    assert.equal(await act(p,'choose-adb').isDisabled(),true);assert.equal(await act(p,'redownload-adb').isDisabled(),true);assert.match(await p.locator('.adb-panel').innerText(),/先断开电视/);
    await act(p,'disconnect').click();await settled(p);
    assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);assert.equal(await act(p,'download-adb').isDisabled(),true);assert.equal(await act(p,'choose-adb').isEnabled(),true);assert.equal(await p.evaluate(()=>window.__toolsInstalls),0);
  },snapshot(),{toolsInstalled:true});
  await check('missing ADB offers download while a verified cache is reused offline', async p => {
    assert.match(await act(p,'download-adb').innerText(),/下载 ADB 工具/);assert.equal(await act(p,'download-adb').isEnabled(),true);
    await act(p,'download-adb').click();
    assert.match(await p.locator('dialog.modal').innerText(),/优先验证并使用已下载工具/);
    assert.match(await p.locator('dialog.modal').innerText(),/校验失败时会重新下载并修复/);
    assert.match(await p.locator('dialog.modal').innerText(),/0 MiB/);
    await acceptTools(p); await settled(p);
    assert.equal(await act(p,'connect').isEnabled(),true);assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);assert.equal(await act(p,'download-adb').isDisabled(),true);
    assert.equal(await p.evaluate(()=>window.__toolsInstalls),1);
  },withoutAdb(),{toolsInstalled:true});
  const readyDisconnected={...snapshot(),device:null,packages:[],launchers:[],defaultHome:null};
  await check('ready ADB can be forcibly re-downloaded with consent and fresh download progress',async p=>{
    assert.equal(await act(p,'download-adb').isDisabled(),true);assert.equal(await act(p,'redownload-adb').isEnabled(),true);
    const previous=await p.locator('[name="adbPath"]').inputValue();await act(p,'redownload-adb').click();
    assert.match(await p.locator('dialog.modal h2').innerText(),/重新下载/);assert.match(await p.locator('dialog.modal').innerText(),/15\.4 MiB/);assert.doesNotMatch(await p.locator('dialog.modal').innerText(),/0 MiB/);assert.equal(await p.locator('#confirm-platform-tools').isDisabled(),true);
    await acceptTools(p);await p.locator('.busy-bar').waitFor();assert.match(await p.locator('.busy-bar').innerText(),/正在下载/);await settled(p);
    assert.deepEqual(await requests(p),[{action:'installPlatformTools',acceptedLicense:true,forceDownload:true}]);assert.notEqual(await p.locator('[name="adbPath"]').inputValue(),previous);assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);
    await shot(p,'adb-redownload-ready');
  },readyDisconnected,{toolsInstalled:true,slowDownload:true});
  await check('failed forced download retains current ADB and allows a retry',async p=>{
    const previous=await p.locator('[name="adbPath"]').inputValue();await act(p,'redownload-adb').click();await acceptTools(p);await settled(p);
    assert.match(await p.locator('.notice.error').innerText(),/下载失败/);assert.equal(await p.locator('[name="adbPath"]').inputValue(),previous);assert.equal(await act(p,'connect').isEnabled(),true);
    await act(p,'redownload-adb').click();await acceptTools(p);await settled(p);assert.equal(await p.evaluate(()=>window.__toolsInstalls),2);assert.notEqual(await p.locator('[name="adbPath"]').inputValue(),previous);
  },readyDisconnected,{toolsInstalled:true,failDownloadOnce:true});
  await check('cancelled forced download keeps ready ADB and the original path',async p=>{
    const previous=await p.locator('[name="adbPath"]').inputValue();await act(p,'redownload-adb').click();await acceptTools(p);await p.locator('.busy-bar').waitFor();await act(p,'cancel').click();await settled(p);
    assert.equal(await p.locator('[name="adbPath"]').inputValue(),previous);assert.equal(await act(p,'connect').isEnabled(),true);assert.match(await p.locator('.notice.info').innerText(),/取消/);
  },readyDisconnected,{toolsInstalled:true,slowDownload:true});
  await check('unsupported online setup keeps manual ADB selection available', async p => {
    await p.getByText('此系统请手动配置 ADB',{exact:true}).waitFor();
    assert.equal(await act(p,'download-adb').isDisabled(),true);
    assert.equal(await act(p,'choose-adb').isEnabled(),true);
    assert.equal(await p.evaluate(()=>window.__toolsInstalls),0);
  },withoutAdb(),{unsupportedTools:true});
  await check('installed/recoverable filters, search and protected components', async p => {
    await nav(p,'apps');
    assert.equal(await p.locator('input[data-select-package]').count(),6);
    assert.equal(await box(p,'com.vendor.home').isDisabled(),true);
    assert.equal(await box(p,'com.android.settings').isDisabled(),true);
    await p.locator('[data-filter="recoverable"]').click();
    assert.equal(await p.locator('input[data-select-package]').count(),1);
    assert.equal(await box(p,'com.vendor.removed').count(),1);
    await p.locator('[data-filter="user"]').click();
    assert.equal(await p.locator('input[data-select-package]').count(),2);
    await p.locator('[name="search"]').fill('webtv');
    assert.equal(await p.locator('input[data-select-package]').count(),1);
    await p.locator('[name="search"]').fill(''); await p.locator('[data-filter="all"]').click();
    await shot(p,'applications');
    await p.setViewportSize({width:960,height:640});
    for (const page of ['apps','connect','launchers','install','history']) {
      await nav(p,page);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow on ${page}`);
    }
  });
  await check('cancel confirmation sends no mutation; confirmed disable sends exact target', async p => {
    await nav(p,'apps'); await box(p,'com.vendor.recommendations').check();
    await act(p,'disable').click();
    assert.match(await p.locator('dialog.modal').innerText(),/192\.168\.1\.50:5555/);
    assert.match(await p.locator('dialog.modal').innerText(),/com\.vendor\.recommendations/);
    await p.getByRole('button',{name:'取消',exact:true}).click();
    assert.deepEqual(await requests(p),[]);
    await act(p,'disable').click(); await confirmOperation(p);
    assert.deepEqual(await requests(p),[{action:'setEnabled',packages:['com.vendor.recommendations'],enabled:false}]);
    await p.locator('[data-filter="disabled"]').click(); assert.equal(await p.locator('input[data-select-package]').count(),2);
    await nav(p,'history'); assert.match(await p.locator('.history-panel').innerText(),/com\.vendor\.recommendations/);
  });
  await check('external APK picker appends/deduplicates; installs only selected paths after confirmation', async p => {
    await nav(p,'install'); await act(p,'add-apks').click();
    await p.locator('.apk-item').first().waitFor();
    assert.equal(await p.locator('.apk-item').count(),1);
    assert.deepEqual(await requests(p),[],'Import must not install');
    await act(p,'add-apks').click();
    await p.waitForFunction(() => document.querySelectorAll('.apk-item').length === 2);
    await act(p,'clear-apks-selection').click();
    assert.equal(await act(p,'install-apks').isDisabled(),true);
    await p.getByRole('checkbox',{name:'选择 custom music.apk',exact:true}).check();
    await shot(p,'import-apks');
    await act(p,'install-apks').click();
    assert.match(await p.locator('dialog.modal').innerText(),/C:\\我的安装包\\custom music\.apk/);
    assert.doesNotMatch(await p.locator('dialog.modal').innerText(),/second\.apk/);
    assert.deepEqual(await requests(p),[]);
    await confirmOperation(p);
    assert.deepEqual(await requests(p),[{action:'install',paths:['C:\\我的安装包\\custom music.apk']}]);
    await p.locator('.apk-item').filter({hasText:'second.apk'}).locator('[data-act="remove-apk"]').click();
    assert.equal(await p.locator('.apk-item').count(),0);
    assert.equal((await requests(p)).length,1,'Remove only edits local list');
  });
  await check('launcher selection and original HOME recovery', async p => {
    await nav(p,'launchers');
    await p.locator('[data-act="set-home"]:enabled').click();
    await confirmOperation(p);
    assert.deepEqual((await requests(p))[0],{action:'setHome',component:'com.ecojust.puretv/.MainActivity'});
    assert.equal(await act(p,'restore-home').isEnabled(),true);
    await act(p,'restore-home').click(); await confirmOperation(p);
    assert.deepEqual((await requests(p))[1],{action:'restoreHome'});
    assert.equal(await act(p,'restore-home').isDisabled(),true);
    await act(p,'add-launcher').click();
    await p.locator('.pending-launcher').first().waitFor();
    assert.equal(await p.locator('[data-page="launchers"]').getAttribute('aria-current'),'page');
  });
  await check('failed mutation shows error and retains actual package state', async p => {
    await nav(p,'apps'); await box(p,'com.vendor.recommendations').check();
    await act(p,'disable').click(); await confirmOperation(p);
    assert.match(await p.locator('.notice.error').innerText(),/电视拒绝/);
    await p.locator('[data-filter="disabled"]').click(); assert.equal(await p.locator('input[data-select-package]').count(),1);
  },snapshot(),{failAction:'setEnabled'});
  await check('partial batch failure is not reported as success', async p => {
    await nav(p,'apps'); await box(p,'com.vendor.recommendations').check();
    await act(p,'disable').click(); await confirmOperation(p);
    assert.equal(await p.locator('.notice.success').count(),0);
    assert.match(await p.locator('.notice').innerText(),/失败 1 项/);
  },snapshot(),{partialFailure:true});
  await check('host validation and no browser persistence', async p => {
    await p.locator('[name="host"]').fill('192.168.1.50;reboot'); await act(p,'connect').click();
    assert.deepEqual(await requests(p),[]);
    assert.match(await p.locator('.notice.error').innerText(),/有效/);
    assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage)),['puretv.preferences']);
    assert.equal(await p.evaluate(()=>sessionStorage.length),0);
    assert.equal(await p.evaluate(()=>localStorage.getItem('puretv.preferences').includes('192.168.1.50')),false);
  });
  const rememberedState={...snapshot(),device:null,lastConnection:{host:'192.168.0.191',port:5555}};
  const routeError="无法通过局域网到达 192.168.0.192:37777。请确认电视在线、IP 正确、电脑与电视在同一网络，并检查 VPN、防火墙和访客网络隔离。macOS 请在系统设置 → 隐私与安全性 → 本地网络中允许 pureTV。原始错误：ADB 操作失败：failed to connect: No route to host";
  await check('native remembered address prefills without connecting and failures retain edits with localized guidance',async p=>{
    await p.waitForFunction(()=>document.querySelector('[name="host"]').value==='192.168.0.191');
    assert.equal(await p.locator('[name="port"]').inputValue(),'5555');assert.deepEqual(await requests(p),[]);
    await p.reload();await p.waitForFunction(()=>document.querySelector('[name="host"]').value==='192.168.0.191');
    await p.locator('[name="host"]').fill('192.168.0.192');await p.locator('[name="port"]').fill('37777');
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:value}),rememberedState);
    assert.equal(await p.locator('[name="host"]').inputValue(),'192.168.0.192');assert.equal(await p.locator('[name="port"]').inputValue(),'37777');
    await act(p,'connect').click();await p.locator('.notice.error').waitFor();assert.match(await p.locator('.notice.error').innerText(),/本地网络/);
    assert.equal(await p.locator('[name="host"]').inputValue(),'192.168.0.192');assert.equal(await p.locator('[name="port"]').inputValue(),'37777');
    assert.deepEqual(await requests(p),[{action:'connect',host:'192.168.0.192',port:37777}]);
    await p.locator('[name="locale"]').selectOption('en');assert.match(await p.locator('.notice.error').innerText(),/Cannot reach 192.168.0.192:37777/);assert.match(await p.locator('.notice.error').innerText(),/Local Network/);assert.match(await p.locator('.notice.error').innerText(),/No route to host/);
    assert.equal(await p.evaluate(()=>localStorage.getItem('puretv.preferences').includes('192.168.0.192')),false);
  },rememberedState,{connectError:routeError});
  const readyNetwork={...snapshot(),device:null,packages:[],launchers:[],defaultHome:null};
  await check('different subnets warn before connecting and cancellation sends no ADB request',async p=>{
    await p.locator('[name="host"]').fill('192.168.0.191');await act(p,'connect').click();await p.locator('#confirm-operation').waitFor();
    assert.match(await p.locator('dialog.modal').innerText(),/不在同一网段/);assert.match(await p.locator('dialog.modal').innerText(),/10.0.0.2\/24/);assert.deepEqual(await requests(p),[]);
    await act(p,'close-dialog').click();assert.deepEqual(await requests(p),[]);
    await act(p,'connect').click();await p.locator('#confirm-operation').waitFor();await confirmOperation(p);
    assert.deepEqual(await requests(p),[{action:'connect',host:'192.168.0.191',port:5555}]);assert.equal(await p.evaluate(()=>window.__networkReads),2);
  },readyNetwork,{preflightNetwork:{addresses:[{interfaceName:'Wi-Fi',ip:'10.0.0.2',prefixLength:24}],error:null}});
  await check('a matching second adapter or a wider subnet connects without a warning',async p=>{
    await p.locator('[name="host"]').fill('192.168.9.191');await act(p,'connect').click();await p.waitForFunction(()=>window.__requests.some(r=>r.action==='connect'));await settled(p);
    assert.equal(await p.locator('dialog.modal[open]').count(),0);
  },readyNetwork,{preflightNetwork:{addresses:[{interfaceName:'Ethernet',ip:'10.0.0.2',prefixLength:24},{interfaceName:'Wi-Fi',ip:'192.168.0.2',prefixLength:16}],error:null}});
  await check('unavailable subnet information does not prevent an otherwise valid connection',async p=>{
    await p.locator('[name="host"]').fill('192.168.0.191');await act(p,'connect').click();await p.waitForFunction(()=>window.__requests.some(r=>r.action==='connect'));await settled(p);
    assert.equal(await p.locator('dialog.modal[open]').count(),0);
  },readyNetwork,{preflightNetwork:{addresses:[],error:'unavailable'}});
  await check('selecting a layout tile reveals its real app independently of its custom name and icon',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-layout-tile="1"]').click();
    assert.match(await p.locator('.layout-target-info').innerText(),/文件管理器/);
    await p.locator('[data-layout-label="1"]').fill('我的快捷方式');await p.locator('[data-layout-label="1"]').dispatchEvent('change');
    await p.locator('[data-layout-target="1"]').selectOption('com.ecojust.webtv');
    assert.match(await p.locator('.layout-target-info').innerText(),/WebTV/);assert.match(await p.locator('.layout-target-info').innerText(),/com\.ecojust\.webtv/);assert.doesNotMatch(await p.locator('.layout-target-info').innerText(),/我的快捷方式/);
    const draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.items[1].packageName,'com.ecojust.webtv');assert.equal(draft.home.items[1].action,undefined);assert.equal(draft.home.items[1].label,'我的快捷方式');
    assert.doesNotMatch(await p.locator('[data-layout-target="1"]').innerText(),/系统启动器|未安装应用/);
    await p.locator('[data-layout-tile="2"]').click();assert.match(await p.locator('.layout-target-info').innerText(),/应用商店/);assert.match(await p.locator('.layout-target-info').innerText(),/dangbei/);
    assert.equal(await p.locator('.layout-inspector').evaluate(element=>getComputedStyle(element).overscrollBehaviorY),'none');
    await act(p,'close-layout').click();assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(r=>r.action==='applyLayout').length),0);
  },customHome,{layoutSupported:true});
  const sceneLayout=JSON.parse(await readFile(new URL('../public/layout-v3.json',import.meta.url),'utf8'));
  await check('scene JSON positions every control and tile, supports geometry, visibility, background and drag',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();
    assert.equal(await p.locator('.scene-canvas').count(),1);
    await shot(p,'layout-scene-default-home-034');await act(p,'layout-apps').click();await shot(p,'layout-scene-default-apps-034');await act(p,'layout-home').click();
    const canvas=p.locator('.scene-canvas'),clock=p.locator('[data-scene-node="clock"]');
    const rect=await canvas.boundingBox(),before=await clock.boundingBox();
    assert.ok(Math.abs((before.x-rect.x)/rect.width-48/960)<.005);
    await clock.click();
    await p.locator('[data-scene-frame="x"]').fill('120');await p.locator('[data-scene-frame="x"]').dispatchEvent('change');
    let draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.scene.elements.find(n=>n.id==='clock').frame.x,120);
    await p.locator('[data-scene-frame="x"]').fill('950');await p.locator('[data-scene-frame="x"]').dispatchEvent('change');
    draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.scene.elements.find(n=>n.id==='clock').frame.x,120);assert.match(await p.locator('.layout-modal .banner.error').innerText(),/元素边界/);
    await p.locator('[data-scene-node="settings"]').click();await p.locator('[data-scene-visible]').uncheck();
    draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.scene.elements.find(n=>n.id==='settings').visible,false);
    assert.equal(await p.locator('[data-scene-node="settings"].scene-hidden').count(),1);
    await p.locator('[name="sceneSelection"]').selectOption('background');await p.locator('[data-scene-background]').fill('#223344');await p.locator('[data-scene-background]').dispatchEvent('change');
    draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.equal(draft.home.scene.background.color,'#223344');
    // WebKit has no WebP canvas encoder; exercise that path and an older decoder.
    const png=await p.evaluate(()=>{const original=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(type,quality){return original.call(this,type==='image/webp'?'image/png':type,quality);};window.createImageBitmap=undefined;const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;const c=canvas.getContext('2d');c.fillStyle='#cc8844';c.fillRect(0,0,32,18);return canvas.toDataURL('image/png').split(',')[1];});
    await p.locator('[data-scene-image]').setInputFiles({name:'background.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await p.waitForFunction(()=>JSON.parse(document.querySelector('[name="layoutJson"]').value).home.scene.background.image?.startsWith('data:image/jpeg;base64,'));
    await canvas.evaluate(el=>el.style.aspectRatio='auto');const fallback=await canvas.boundingBox();assert.ok(fallback.height>0 && Math.abs(fallback.width/fallback.height-16/9)<.02,'Old WebKit retains a 16:9 canvas');

    const tile=p.locator('[data-layout-tile="0"]'),at=await tile.boundingBox();
    await p.mouse.move(at.x+at.width/2,at.y+at.height/2);await p.mouse.down();await p.mouse.move(at.x+at.width/2+40,at.y+at.height/2-20,{steps:8});await p.mouse.up();
    draft=JSON.parse(await p.locator('[name="layoutJson"]').inputValue());assert.ok(draft.home.items[0].frame.x>sceneLayout.home.items[0].frame.x);assert.ok(draft.home.items[0].frame.y<sceneLayout.home.items[0].frame.y);
    await shot(p,'layout-scene-home-034');
    await act(p,'layout-apps').click();await shot(p,'layout-scene-apps-034');
    await act(p,'apply-layout').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));await settled(p);
    const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));assert.equal(applied.layout.version,3);assert.equal(applied.layout.home.scene.background.color,'#223344');
  },customHome,{layoutSupported:true,layout:sceneLayout});
  const unifiedLayout=JSON.parse(await readFile(new URL('../public/layout.json',import.meta.url),'utf8'));
  const rawSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2 2h20v20H2z"/></svg>';
  const unifiedState=structuredClone(customHome);unifiedState.packages.push({packageName:'com.ecojust.music',label:'Music',installed:true,enabled:true,system:false,protectedReason:null});
  const unifiedApps=[{packageName:'com.ecojust.webtv',label:'WebTV'},{packageName:'com.ecojust.puretv',label:'pureTV'},{packageName:'com.ecojust.music',label:'Music'}];
  unifiedLayout.home.users=unifiedApps.map((a,i)=>({id:'user-'+i,name:a.label,text:a.label,action:a.packageName,frame:{x:[48,300,650][i],y:220+i*20,width:160,height:140},visible:true,icon:rawSvg,color:'#EEEEEE',backgroundColor:'#374959'}));
  await check('v4 uses editable users and immutable system nodes with a top toolbar and raw JSON viewer',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();
    assert.equal(await p.locator('[name="layoutColumns"]').count(),0);assert.equal(await p.locator('[data-scene-layer]').count(),0);assert.equal(await p.locator('.layout-inspector [data-u-add-app]').count(),0);assert.equal(await p.locator('.unified-toolbar [data-u-add-app]').count(),1);
    const fixed=p.locator('[data-u-node="clock"]'),before=await fixed.boundingBox();await fixed.click();assert.equal(await p.locator('[data-u-frame="x"]').isDisabled(),true);assert.equal(await p.locator('[data-u-field="icon"]').isDisabled(),true);assert.equal(await p.locator('.layout-inspector input[value="com.ecojust.puretv.clock"]').isDisabled(),true);
    await p.mouse.move(before.x+before.width/2,before.y+before.height/2);await p.mouse.down();await p.mouse.move(before.x+before.width/2+50,before.y+before.height/2+40,{steps:6});await p.mouse.up();
    await p.locator('[data-u-act="json"]').click();let draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.deepEqual(draft.home.system,unifiedLayout.home.system);assert.equal(await p.locator('.layout-json-viewer textarea').count(),0);await p.locator('[data-close-json]').click();
    await p.locator('[data-u-node="user-0"]').click();assert.equal(await p.locator('[data-u-frame="x"]').isDisabled(),false);assert.equal(await p.locator('[data-u-field="icon"]').inputValue(),rawSvg);assert.equal(await p.locator('select[data-u-field="action"]').inputValue(),'com.ecojust.webtv');
    await p.locator('[data-u-field="text"]').fill('自定义直播');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.locator('[data-u-screen="width"]').fill('1920');await p.locator('[data-u-screen="width"]').dispatchEvent('change');await p.locator('[data-u-screen="height"]').fill('1080');await p.locator('[data-u-screen="height"]').dispatchEvent('change');
    await p.locator('[data-u-act="json"]').click();draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.equal(draft.screen.width,1920);assert.equal(draft.home.system.find(n=>n.id==='clock').frame.x,96);assert.equal(draft.home.users[0].frame.x,96);assert.equal(draft.home.users[0].text,'自定义直播');await p.locator('[data-close-json]').click();
    for(const select of await p.locator('select:visible').all()){const h=await select.evaluate(el=>el.getBoundingClientRect().height);assert.ok(h>=32&&h<=40,'Select controls have a consistent usable height');}
    await shot(p,'layout-v4-properties-035');
  },unifiedState,{layoutSupported:true,layout:unifiedLayout,layoutApps:unifiedApps});
  await check('v4 marquee selects only user blocks and batch alignment/distribution changes only their frames',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();const canvas=p.locator('.unified-canvas');await canvas.waitFor();let rect=await canvas.boundingBox();
    await p.mouse.move(rect.x+20/960*rect.width,rect.y+195/540*rect.height);await p.mouse.down();await p.mouse.move(rect.x+850/960*rect.width,rect.y+420/540*rect.height,{steps:12});await p.mouse.up();
    assert.match(await p.locator('.unified-selection-tools').innerText(),/3 个用户组件已选择/);assert.equal(await p.locator('.system-fixed.selected').count(),0);
    await p.locator('[data-u-arrange="top"]').click();await p.locator('[data-u-arrange="distribute-h"]').click();await p.locator('[data-u-act="json"]').click();let draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.deepEqual(draft.home.system,unifiedLayout.home.system);assert.deepEqual(draft.home.users.map(n=>n.frame.y),[220,220,220]);assert.equal(draft.home.users[1].frame.x,349);await p.locator('[data-close-json]').click();
    const first=p.locator('[data-u-kind="users"][data-u-node="user-0"]'),firstRect=await first.boundingBox();await p.mouse.move(firstRect.x+firstRect.width/2,firstRect.y+firstRect.height/2);await p.mouse.down();await p.mouse.move(firstRect.x+firstRect.width/2+18,firstRect.y+firstRect.height/2+10,{steps:6});await p.mouse.up();await p.locator('[data-u-act="json"]').click();const moved=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());const dx=moved.home.users[0].frame.x-draft.home.users[0].frame.x;assert.ok(dx>0);assert.ok(moved.home.users.every((n,i)=>n.frame.x-draft.home.users[i].frame.x===dx));await p.locator('[data-close-json]').click();
    await p.locator('[data-u-arrange="grid"]').click();await p.locator('[data-u-act="json"]').click();draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.ok(draft.home.users.every(n=>n.frame.width>0&&n.frame.x+n.frame.width<=960&&n.frame.y+n.frame.height<=540));await p.locator('[data-close-json]').click();
    await shot(p,'layout-v4-multiselect-035');await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));assert.equal(applied.layout.version,4);assert.equal(applied.layout.home.users[0].action,'com.ecojust.webtv');
  },unifiedState,{layoutSupported:true,layout:unifiedLayout,layoutApps:unifiedApps});
  await check('v4 backgrounds are independent and never tile on hover; navigation comes from JSON',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-u-act="background"]').click();
    const png=await p.evaluate(()=>{const original=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(type,quality){return original.call(this,type==='image/webp'?'image/png':type,quality);};window.createImageBitmap=undefined;const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;const c=canvas.getContext('2d');c.fillStyle='red';c.fillRect(0,0,16,18);c.fillStyle='blue';c.fillRect(16,0,16,18);return canvas.toDataURL('image/png').split(',')[1];});
    await p.locator('[data-u-bg-file]').setInputFiles({name:'background.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await p.waitForFunction(()=>document.querySelector('.unified-canvas').style.backgroundImage.includes('data:image/jpeg'));
    await p.locator('[data-u-navigation="down"]').selectOption('apps');await p.locator('[data-u-bg-act="close"]').click();const canvas=p.locator('.unified-canvas');await canvas.hover();const style=await canvas.evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundSize,s.backgroundRepeat,s.backgroundPosition]});assert.deepEqual(style,['cover','no-repeat','50% 50%']);
    await p.locator('[data-u-page="apps"]').click();assert.equal(await canvas.evaluate(el=>el.style.backgroundImage),'');await p.locator('[data-u-act="background"]').click();await p.locator('[data-u-bg-color]').fill('#334455');await p.locator('[data-u-bg-color]').dispatchEvent('change');await p.locator('[data-u-bg-act="close"]').click();await p.locator('[data-u-act="json"]').click();const draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.ok(draft.home.background.image.startsWith('data:image/jpeg'));assert.equal(draft.apps.background.color,'#334455');assert.equal(draft.home.navigation.down,'apps');assert.equal(draft.apps.navigation.up,'home');
  },unifiedState,{layoutSupported:true,layout:unifiedLayout,layoutApps:unifiedApps});
  const homeCover='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=';
  const updatedHomeCover='data:image/png;base64,'+Buffer.concat([Buffer.from(homeCover.split(',')[1],'base64'),Buffer.from([0])]).toString('base64');
  const coverLayout=structuredClone(unifiedLayout);coverLayout.home.background.image=homeCover;
  await check('launcher card defaults to the active Home background and custom covers take precedence',async p=>{
    await nav(p,'launchers');await settled(p);const card=p.locator('[data-launcher-component="com.ecojust.puretv/.MainActivity"]');assert.equal(await card.locator('.launcher-card-background').getAttribute('src'),homeCover);
    await card.locator('[data-act="launcher-cover"]').click();const explicit=await card.locator('.launcher-card-background').getAttribute('src');
    const result={supported:true,version:4,component:'com.ecojust.puretv/.MainActivity',layout:structuredClone(coverLayout),apps:unifiedApps};result.layout.home.background.image=updatedHomeCover;
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_layout',launcherResult:value}),result);assert.equal(await card.locator('.launcher-card-background').getAttribute('src'),explicit);
    await card.locator('[data-act="remove-launcher-cover"]').click();assert.equal(await card.locator('.launcher-card-background').getAttribute('src'),updatedHomeCover);
    await shot(p,'launcher-home-background-035');
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps});
  await check('inactive launcher cards read Home background without switching the current desktop',async p=>{
    await nav(p,'launchers');await settled(p);const card=p.locator('[data-launcher-component="com.ecojust.puretv/.MainActivity"]');assert.equal(await card.locator('.launcher-card-background').getAttribute('src'),homeCover);assert.equal((await requests(p)).filter(r=>r.action==='setHome').length,0);assert.equal(await card.locator('[data-act="open-layout"]').count(),0);
  },snapshot(),{homeBackgrounds:{'com.ecojust.puretv/.MainActivity':homeCover}});
  const protocolExample=JSON.parse(await readFile(new URL('../../resource/launcher/layout.example.json',import.meta.url),'utf8'));
  await check('documented v4 file and Home/Apps previews use identical configuration',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();await shot(p,'layout-v4-home-035');await p.locator('[data-u-page="apps"]').click();await shot(p,'layout-v4-apps-035');await p.locator('[data-u-act="json"]').click();assert.deepEqual(JSON.parse(await p.locator('.layout-json-viewer pre').innerText()),protocolExample);
  },unifiedState,{layoutSupported:true,layout:protocolExample,layoutApps:unifiedApps});
  await check('scan disables competing actions and exposes cancellation', async p => {
    await nav(p,'apps'); await act(p,'scan').click(); await p.locator('.busy-bar').waitFor();
    assert.equal(await act(p,'scan').isDisabled(),true);
    assert.equal(await box(p,'com.vendor.recommendations').isDisabled(),true);
    await act(p,'cancel').click(); await settled(p);
    assert.deepEqual(await requests(p),[{action:'scan'},{action:'cancel'}]);
  },snapshot(),{slowScan:true});
  const injected = snapshot(); injected.device.model = '<img src=x onerror="window.__xss=true">'; injected.packages[0].label = injected.device.model;
  await check('device and application metadata render as text',async p => {
    await nav(p,'apps'); assert.equal(await p.locator('.apps-table img, .device-badge img').count(),0); assert.equal(await p.evaluate(()=>window.__xss),false);
    assert.match(await p.locator('.apps-table').innerText(),/onerror/);
  },injected);
  console.log(`${passed} UI scenarios passed`);
} finally {
  await browser?.close(); server.kill();
}
