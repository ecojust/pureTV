import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { mockBridge, snapshot, marketCatalog, packageInsight, clientUpdate } from './fixtures.mjs';

const directory = fileURLToPath(new URL('..', import.meta.url));
const port = 1429, url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = ''; server.stdout.on('data', d => serverLog += d); server.stderr.on('data', d => serverLog += d);
let browser, passed = 0;
const testMatch=process.env.PURETV_TEST_MATCH?new RegExp(process.env.PURETV_TEST_MATCH):null;
const feedback = p => p.locator('dialog.operation-feedback[open]');
const act = (p, action) => p.locator(action==='cancel' ? 'dialog.operation-feedback[open][data-phase="loading"] [data-feedback-cancel], body:not(:has(dialog.operation-feedback[open][data-phase="loading"])) [data-act="cancel"]' : `[data-act="${action}"]`).first();
const nav = async (p, page) => {if(page==='install'){await p.locator('[data-page="apps"]').click();await p.locator('[data-act="go-install"]').first().click();}else await p.locator(`[data-page="${page}"]`).click();};
const requests = p => p.evaluate(() => window.__requests);
const box = (p, pkg) => p.locator(`input[data-select-package="${pkg}"]`);
async function acknowledge(p) {
  const result=feedback(p).filter({has:p.locator('[data-feedback-close]')});
  if(await result.count())await result.locator('[data-feedback-close]').click();
}
async function settled(p) {
  await p.waitForFunction(() => !document.querySelector('.busy-bar'));
  await acknowledge(p);
}
async function held(p, action) {
  await p.waitForFunction(action=>window.__pendingOperations.some(operation=>operation.action===action),action);
  await p.locator('dialog.operation-feedback[open][data-phase="loading"]').waitFor();
}
const release=(p,action,outcome={})=>p.evaluate(({action,outcome})=>window.__releaseOperation(action,outcome),{action,outcome});
async function result(p,outcome) {
  const modal=p.locator(`dialog.operation-feedback[open][data-phase="result"][data-outcome="${outcome}"]`);
  await modal.waitFor();
  assert.equal(await p.locator('dialog.operation-feedback[data-phase="loading"]').count(),0,'Loading clears before the result is displayed');
  return modal;
}
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
  if(testMatch&&!testMatch.test(name))return;
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
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/不含私有数据和缓存/);
  });
  const infoDialog=p=>p.locator('dialog.package-info-dialog[open]');
  const infoButton=(p,pkg)=>p.locator(`tr[data-package="${pkg}"] [data-act="package-info"]`);
  const infoAction=(p,action)=>infoDialog(p).locator(`[data-package-info-action="${action}"]`).first();
  async function openInfo(p,pkg,state='loaded') {
    await infoButton(p,pkg).click();
    await infoDialog(p).locator(`[data-package-info-state="${state}"]`).waitFor();
  }
  const recommended='com.vendor.recommendations';
  const recommendationInsight=packageInsight(recommended);
  await check('package info: keyboard icon queries the exact package, shows purpose and risk without changing selection or TV',async p=>{
    await nav(p,'apps');
    const button=infoButton(p,recommended);
    assert.ok(await button.getAttribute('aria-label'),'The info icon has an accessible name');
    await button.focus();await p.keyboard.press('Enter');
    await infoDialog(p).locator('[data-package-info-state="loaded"]').waitFor();
    const modalBox=await infoDialog(p).boundingBox(),closeBox=await infoDialog(p).locator('.modal-heading [data-package-info-action="close"]').boundingBox();
    assert.ok(closeBox.width<=48&&closeBox.height<=48&&closeBox.x>=modalBox.x&&closeBox.x+closeBox.width<=modalBox.x+modalBox.width,'The header close icon is compact and visible inside the modal');
    assert.equal(await p.locator('[data-select-package]:checked').count(),0);
    assert.deepEqual((await p.evaluate(()=>window.__packageInsightRequests)).map(r=>r.packageName),[recommended]);
    assert.match(await infoDialog(p).innerText(),/com\.vendor\.recommendations/);
    assert.equal(await infoDialog(p).locator('.package-purpose').innerText(),recommendationInsight.description);
    assert.equal(await infoDialog(p).locator('.package-risk').getAttribute('data-risk'),'low');
    assert.match(await infoDialog(p).innerText(),/UAD-ng/);
    await infoAction(p,'source').click();await infoAction(p,'search').click();
    assert.deepEqual(await p.evaluate(()=>window.__packageResources),[{packageName:recommended,resource:'source'},{packageName:recommended,resource:'search'}]);
    assert.deepEqual(await requests(p),[],'Reading package guidance does not execute ADB mutations');
    await p.keyboard.press('Escape');assert.equal(await infoDialog(p).count(),0);
    assert.equal(await button.evaluate(element=>document.activeElement===element),true,'Closing returns keyboard focus to the info icon');
  },snapshot(),{packageInsights:{[recommended]:recommendationInsight}});
  const protectedInfoState=snapshot();protectedInfoState.packages.find(p=>p.packageName==='com.vendor.home').protectedReason=null;
  await check('package info: protected system apps and current HOME override community low risk',async p=>{
    await nav(p,'apps');
    for(const pkg of ['com.android.settings','com.vendor.home']){
      await openInfo(p,pkg);
      assert.equal(await infoDialog(p).locator('.package-risk').getAttribute('data-risk'),'critical');
      assert.match(await infoDialog(p).innerText(),pkg==='com.vendor.home'?/当前默认启动器/:/关键系统组件/);
      await infoAction(p,'close').click();
    }
    assert.deepEqual(await requests(p),[]);
  },protectedInfoState,{packageInsights:{'com.android.settings':packageInsight('com.android.settings'),'com.vendor.home':packageInsight('com.vendor.home')}});
  const unknownInfoState=snapshot();unknownInfoState.packages.push({packageName:'com.example.unknown',label:'未知用户应用',system:false,installed:true,enabled:true,protectedReason:null});
  await check('package info: a user app absent from the source remains unknown rather than safe',async p=>{
    await nav(p,'apps');await openInfo(p,'com.example.unknown','missing');
    assert.match(await infoDialog(p).innerText(),/未收录/);
    assert.equal(await infoDialog(p).locator('.package-risk').getAttribute('data-risk'),'unknown');
    assert.equal(await infoAction(p,'search').isEnabled(),true);
    assert.deepEqual(await requests(p),[]);
  },unknownInfoState);
  await check('package info: pending lookup is visible and network failure can be retried explicitly',async p=>{
    await nav(p,'apps');
    await p.evaluate(pkg=>window.__holdNextOperation('packageInsight:'+pkg),recommended);
    await infoButton(p,recommended).click();
    await infoDialog(p).locator('[data-package-info-state="loading"]').waitFor();
    assert.equal(await infoDialog(p).locator('[data-package-info-content]').getAttribute('aria-busy'),'true');
    await release(p,'packageInsight:'+recommended,{error:'查询服务暂时不可用'});
    await infoDialog(p).locator('[data-package-info-state="error"]').waitFor();
    assert.match(await infoDialog(p).innerText(),/查询失败/);
    assert.equal(await infoDialog(p).locator('.package-risk').getAttribute('data-risk'),'unknown');
    await infoAction(p,'retry').click();await infoDialog(p).locator('[data-package-info-state="loaded"]').waitFor();
    assert.equal((await p.evaluate(()=>window.__packageInsightRequests)).at(-1).refresh,true);
    assert.equal(await infoDialog(p).locator('.package-risk').getAttribute('data-risk'),'low');
    assert.deepEqual(await requests(p),[]);
  },snapshot(),{packageInsights:{[recommended]:recommendationInsight}});
  await check('package info: cached guidance remains available with an explicit stale notice',async p=>{
    await nav(p,'apps');await openInfo(p,recommended);
    assert.match(await infoDialog(p).innerText(),/缓存|过期/);
    assert.match(await infoDialog(p).innerText(),/资料更新失败，显示上次缓存/);
    assert.equal(await infoDialog(p).locator('.package-purpose').innerText(),recommendationInsight.description);
    assert.equal(await infoAction(p,'retry').isEnabled(),true);
  },snapshot(),{packageInsights:{[recommended]:packageInsight(recommended,{stale:true,warning:'资料更新失败，显示上次缓存'})}});
  await check('package info: an old response cannot replace another package or reopen a closed dialog',async p=>{
    await nav(p,'apps');
    await p.evaluate(pkg=>window.__holdNextOperation('packageInsight:'+pkg),recommended);
    await infoButton(p,recommended).click();await infoDialog(p).locator('[data-package-info-state="loading"]').waitFor();
    await infoAction(p,'close').click();
    await openInfo(p,'com.vendor.disabled');
    await release(p,'packageInsight:'+recommended,{response:packageInsight(recommended,{description:'OLD RESULT MUST NOT APPEAR'})});
    assert.equal(await infoDialog(p).locator('.package-purpose').innerText(),'Description for the second package.');
    assert.doesNotMatch(await infoDialog(p).innerText(),/OLD RESULT/);
    await infoAction(p,'close').click();
    await p.evaluate(pkg=>window.__holdNextOperation('packageInsight:'+pkg),recommended);
    await infoButton(p,recommended).click();await infoDialog(p).locator('[data-package-info-state="loading"]').waitFor();
    await infoAction(p,'close').click();
    await release(p,'packageInsight:'+recommended,{response:recommendationInsight});
    assert.equal(await infoDialog(p).count(),0);
    assert.deepEqual(await requests(p),[]);
  },snapshot(),{packageInsights:{'com.vendor.disabled':packageInsight('com.vendor.disabled',{description:'Description for the second package.'})}});
  await check('package info: switching the selected TV invalidates pending package guidance',async p=>{
    await nav(p,'apps');
    await p.evaluate(pkg=>window.__holdNextOperation('packageInsight:'+pkg),recommended);
    await infoButton(p,recommended).click();await infoDialog(p).locator('[data-package-info-state="loading"]').waitFor();
    const updated=snapshot();updated.revision=2;updated.device.serial='192.168.1.99:5555';updated.device.model='另一台电视';
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'connect',snapshot:value}),updated);
    await p.locator('.device-badge').filter({hasText:'另一台电视'}).waitFor();
    await release(p,'packageInsight:'+recommended,{response:recommendationInsight});
    assert.equal(await infoDialog(p).count(),0,'A result for the old TV does not remain open');
    assert.deepEqual(await requests(p),[]);
  });
  const hostilePurpose='<img src=x onerror="window.__xss=true"><script>window.__xss=true</script>\nUntrusted package notes are plain text.';
  await check('package info: remote descriptions are rendered as text and long guidance scrolls in a small window',async p=>{
    await p.setViewportSize({width:960,height:640});await nav(p,'apps');await openInfo(p,recommended);
    assert.match(await infoDialog(p).locator('.package-purpose').innerText(),/<img src=x/);
    assert.equal(await infoDialog(p).locator('.package-purpose img,.package-purpose script').count(),0);
    assert.equal(await p.evaluate(()=>window.__xss),false);
    const box=await infoDialog(p).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=641,'The modal fits the viewport');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true);
    await infoAction(p,'close').click();assert.equal(await infoDialog(p).count(),0);
  },snapshot(),{packageInsights:{[recommended]:packageInsight(recommended,{description:hostilePurpose+'\n'+('Additional package details.\n'.repeat(100))})}});
  await check('package info: Chinese, English and Traditional Chinese retain package data and accessible controls',async p=>{
    await nav(p,'apps');await openInfo(p,recommended);
    assert.match(await infoDialog(p).innerText(),/用途与卸载风险/);
    await shot(p,'package-info-zh-CN');await infoAction(p,'close').click();
    await p.locator('[name="locale"]').selectOption('en');await openInfo(p,recommended);
    assert.match(await infoDialog(p).innerText(),/purpose/i);assert.match(await infoDialog(p).innerText(),/uninstall risk/i);
    assert.equal(await infoDialog(p).locator('.package-purpose').innerText(),recommendationInsight.description);
    await shot(p,'package-info-en');await infoAction(p,'close').click();
    await p.locator('[name="locale"]').selectOption('zh-TW');await openInfo(p,recommended);
    assert.match(await infoDialog(p).innerText(),/解除安裝風險/);
    assert.match(await infoDialog(p).innerText(),/com\.vendor\.recommendations/);
    assert.deepEqual(await requests(p),[]);
  },snapshot(),{packageInsights:{[recommended]:recommendationInsight}});
  const updateDialog=p=>p.locator('dialog.client-update-dialog[open]');
  const updateAction=(p,name)=>updateDialog(p).locator(`[data-client-update-action="${name}"]`).first();
  const updateRequests=p=>p.evaluate(()=>window.__clientUpdateRequests);
  const updateInstalls=async p=>(await updateRequests(p)).filter(item=>item.command==='install_client_update');
  const newerClient=clientUpdate({status:'available',available:true,latestVersion:'0.4.12',fileName:'pureTV-Manager-0.4.12-macos-arm64.dmg',bytes:5242880});
  async function startupUpdate(p) {await p.waitForFunction(()=>window.__clientUpdateRequests.some(item=>item.command==='check_client_update'));}
  async function openUpdate(p,state='available') {
    await act(p,'client-update').click();
    await updateDialog(p).locator(`[data-client-update-state="${state}"]`).waitFor();
  }
  async function heldUpdate(p,action='installClientUpdate') {await p.waitForFunction(action=>window.__pendingOperations.some(item=>item.action===action),action);}
  await check('client update: startup checks once in the background without downloading or opening a modal',async p=>{
    await startupUpdate(p);
    await act(p,'client-update').filter({hasText:'0.4.12'}).waitFor();
    assert.equal(await updateDialog(p).count(),0,'An available update does not interrupt device work with a modal');
    assert.equal((await updateRequests(p)).filter(item=>item.command==='check_client_update').length,1);
    assert.equal((await updateRequests(p)).filter(item=>item.command==='client_update_result').length,1);
    assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdate:newerClient});
  await check('client update: completing a background check preserves the current input and caret',async p=>{
    await startupUpdate(p);await heldUpdate(p,'checkClientUpdate');
    const host=p.locator('[name="host"]');await host.fill('192.168.1.123');await host.focus();
    await host.evaluate(input=>input.setSelectionRange(4,7));
    await release(p,'checkClientUpdate',{response:newerClient});await act(p,'client-update').filter({hasText:'0.4.12'}).waitFor();
    assert.deepEqual(await host.evaluate(input=>({focused:document.activeElement===input,value:input.value,start:input.selectionStart,end:input.selectionEnd})),{focused:true,value:'192.168.1.123',start:4,end:7});
    assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
  },snapshot(),{holdActions:['checkClientUpdate']});
  await check('client update: ordinary browser preview is disabled and demo never downloads or exits',async p=>{
    assert.equal(await act(p,'client-update').isDisabled(),true);
    const remote=[];p.on('request',request=>{if(!request.url().startsWith(url))remote.push(request.url());});
    await p.goto(url+'?demo=1');await p.locator('.demo-banner').waitFor();await openUpdate(p);
    assert.match(await updateDialog(p).innerText(),/演示模式/);await updateAction(p,'install').click();
    await updateDialog(p).locator('[data-client-update-state="demoComplete"]').waitFor();
    assert.match(await updateDialog(p).innerText(),/未下载或安装任何文件/);assert.equal(p.isClosed(),false);assert.deepEqual(remote,[]);
    assert.equal(await updateAction(p,'close').isEnabled(),true);
  },null);
  await check('client update: manual lookup shows the exact platform package and Gitee source before installation',async p=>{
    await startupUpdate(p);await openUpdate(p);
    const text=await updateDialog(p).innerText();
    assert.match(text,/0\.4\.12/);assert.ok(text.includes(newerClient.currentVersion));
    assert.match(text,/Apple Silicon/);assert.match(text,/5\.0 MiB/);
    assert.match(text,/pureTV-Manager-0\.4\.12-macos-arm64\.dmg/);
    assert.match(text,/https:\/\/gitee\.com\/juzisang331\/pure-tv-store/);
    assert.equal(await updateAction(p,'install').isEnabled(),true);
    await updateAction(p,'source').click();assert.deepEqual(await p.evaluate(()=>window.__resources),['market']);
    assert.deepEqual(await updateInstalls(p),[]);
    await p.keyboard.press('Escape');assert.equal(await updateDialog(p).count(),0);
    assert.equal(await act(p,'client-update').evaluate(element=>document.activeElement===element),true);
  },snapshot(),{clientUpdate:newerClient});
  await check('client update: explicit install pins version and revision and handoff never claims completed installation',async p=>{
    await startupUpdate(p);await nav(p,'apps');await openUpdate(p);await updateAction(p,'install').click();await heldUpdate(p);
    await updateDialog(p).locator('[data-client-update-stage="downloading"]').waitFor();
    const meter=updateDialog(p).locator('[data-client-update-meter]');
    assert.equal(await meter.getAttribute('max'),String(newerClient.bytes));assert.equal(await meter.getAttribute('value'),String(newerClient.bytes/2));
    assert.deepEqual(await updateInstalls(p),[{command:'install_client_update',version:newerClient.latestVersion,revision:newerClient.revision}]);
    assert.equal(await act(p,'scan').isDisabled(),true,'The normal device mutation controls stay locked during installation');
    assert.equal(await updateAction(p,'close').isDisabled(),true);
    await release(p,'installClientUpdate');await updateDialog(p).locator('[data-client-update-stage="installing"]').waitFor({state:'attached'});
    assert.equal(await updateAction(p,'cancel').isDisabled(),true);
    assert.equal(await updateDialog(p).locator('[data-client-update-result="success"]').count(),0);
    assert.match(await updateDialog(p).innerText(),/退出并安装|正在安装/);
    assert.doesNotMatch(await updateDialog(p).innerText(),/更新成功|安装成功|已安装新版本/);
    assert.deepEqual(await requests(p),[],'The browser never sends a device mutation to install the desktop update');
  },snapshot(),{clientUpdate:newerClient,holdActions:['installClientUpdate']});
  await check('client update: a current device operation blocks install without cancelling or replacing it',async p=>{
    await startupUpdate(p);await openUpdate(p);
    await p.evaluate(()=>window.__emitMcp('mcp-operation',{running:true,tool:'scan'}));
    await p.waitForFunction(()=>document.querySelector('[data-client-update-action="install"]').disabled);
    assert.match(await updateDialog(p).innerText(),/等待当前操作完成/);
    assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'scan',snapshot:value}),snapshot());
    await p.waitForFunction(()=>!document.querySelector('[data-client-update-action="install"]').disabled);
    assert.deepEqual(await updateInstalls(p),[]);
  },snapshot(),{clientUpdate:newerClient});
  await check('client update: cancelling a held download waits for cleanup and leaves the current client usable',async p=>{
    await startupUpdate(p);await nav(p,'apps');await openUpdate(p);await updateAction(p,'install').click();await heldUpdate(p);
    await updateAction(p,'cancel').click();
    assert.equal((await updateRequests(p)).filter(item=>item.command==='cancel_client_update').length,1);
    assert.equal(await act(p,'scan').isDisabled(),true,'Busy remains set until the native operation acknowledges cleanup');
    await release(p,'installClientUpdate');await updateDialog(p).locator('[data-client-update-state="cancelled"]').waitFor();
    assert.match(await updateDialog(p).innerText(),/取消/);assert.ok((await updateDialog(p).innerText()).includes(newerClient.currentVersion));
    assert.equal(await act(p,'scan').isEnabled(),true);assert.equal(await updateAction(p,'close').isEnabled(),true);
    assert.equal(await updateDialog(p).locator('[data-client-update-result="success"]').count(),0);assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdate:newerClient,holdActions:['installClientUpdate']});
  await check('client update: changed catalog rejection preserves the client and retry requires a fresh selection',async p=>{
    await startupUpdate(p);await openUpdate(p);
    const updated=clientUpdate({...newerClient,latestVersion:'0.4.13',fileName:'pureTV-Manager-0.4.13-macos-arm64.dmg',revision:'f'.repeat(40)});
    await p.evaluate(value=>window.__clientUpdateInfo=value,updated);
    await updateAction(p,'install').click();await updateDialog(p).locator('[data-client-update-state="error"]').waitFor();
    assert.match(await updateDialog(p).innerText(),/目录已变化/);assert.equal(await updateAction(p,'install').isDisabled(),true);
    assert.deepEqual(await updateInstalls(p),[{command:'install_client_update',version:newerClient.latestVersion,revision:newerClient.revision}]);
    await updateAction(p,'check').click();await updateDialog(p).locator('[data-client-update-state="available"]').waitFor();
    assert.match(await updateDialog(p).innerText(),/0\.4\.13/);await updateAction(p,'install').click();
    await updateDialog(p).locator('[data-client-update-stage="installing"]').waitFor({state:'attached'});
    assert.deepEqual((await updateInstalls(p)).at(-1),{command:'install_client_update',version:updated.latestVersion,revision:updated.revision});
    assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdate:newerClient});
  await check('client update: a background network failure stays non-modal and never reports up to date',async p=>{
    await startupUpdate(p);await act(p,'client-update').filter({hasText:'失败'}).waitFor();
    assert.equal(await updateDialog(p).count(),0);await openUpdate(p,'error');
    assert.match(await updateDialog(p).innerText(),/网络暂时不可用/);
    assert.equal(await updateDialog(p).locator('[data-client-update-state="upToDate"]').count(),0);
    assert.equal(await updateDialog(p).locator('[data-client-update-action="install"]:enabled').count(),0);
    await p.evaluate(()=>window.__clientUpdateError=null);await updateAction(p,'check').click();
    await updateDialog(p).locator('[data-client-update-state="upToDate"]').waitFor();assert.deepEqual(await updateInstalls(p),[]);
    assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdateError:'网络暂时不可用，请重试'});
  for (const [label,value,expected] of [
    ['missing platform',clientUpdate({platform:'linux-x64',status:'notPublished',latestVersion:null,fileName:null,revision:null,bytes:null}),/尚未提供当前系统/],
    ['unsupported platform',clientUpdate({platform:'linux-arm64',supported:false,status:'unsupported',latestVersion:null,fileName:null,revision:null,bytes:null}),/不支持自动更新/],
    ['older repository version',clientUpdate({latestVersion:'0.1.0',fileName:'pureTV-Manager-0.1.0-macos-arm64.dmg'}),/无需更新/],
  ]) {
    await check('client update: '+label+' never offers an incorrect package or downgrade',async p=>{
      await startupUpdate(p);await openUpdate(p,value.status);assert.match(await updateDialog(p).innerText(),expected);
      assert.equal(await updateDialog(p).locator('[data-client-update-action="install"]:enabled').count(),0);
      assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
    },snapshot(),{clientUpdate:value});
  }
  await check('client update: closing and reopening a pending check reuses it and late results never reopen a closed dialog',async p=>{
    await startupUpdate(p);await heldUpdate(p,'checkClientUpdate');await openUpdate(p,'checking');
    assert.equal(await updateAction(p,'check').isDisabled(),true);await updateAction(p,'close').click();
    await openUpdate(p,'checking');assert.equal((await updateRequests(p)).filter(item=>item.command==='check_client_update').length,1);
    await updateAction(p,'close').click();await release(p,'checkClientUpdate',{response:newerClient});
    await act(p,'client-update').filter({hasText:'0.4.12'}).waitFor();assert.equal(await updateDialog(p).count(),0);
    await openUpdate(p);assert.equal((await updateRequests(p)).filter(item=>item.command==='check_client_update').length,1);
    assert.deepEqual(await updateInstalls(p),[]);
  },snapshot(),{holdActions:['checkClientUpdate']});
  await check('client update: previous installer failure is visible and untrusted diagnostic text remains plain text',async p=>{
    await startupUpdate(p);await openUpdate(p,'upToDate');
    const report=updateDialog(p).locator('[data-client-update-result="error"]');
    assert.match(await report.innerText(),/上次安装未完成/);assert.match(await report.innerText(),/<img src=x/);
    assert.equal(await report.locator('img,script').count(),0);assert.equal(await p.evaluate(()=>window.__xss),false);
    assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdateResult:{version:'0.4.10',success:false,message:'上次安装未完成 <img src=x onerror="window.__xss=true">'}});
  await check('client update: localized update details stay usable in a compact window and all themes',async p=>{
    await startupUpdate(p);await nav(p,'apps');await p.setViewportSize({width:960,height:640});
    for(const [language,title] of [['zh-CN',/更新/],['en',/update/i],['zh-TW',/更新/]]) {
      await p.locator('[name="locale"]').selectOption(language);
      await p.locator('[name="theme"]').selectOption(language==='en'?'graphite':language==='zh-TW'?'ocean':'emerald');
      await openUpdate(p);assert.match(await updateDialog(p).locator('h2').innerText(),title);
      const modal=await updateDialog(p).boundingBox();assert.ok(modal.x>=0&&modal.y>=0&&modal.x+modal.width<=961&&modal.y+modal.height<=641,'The update dialog fits a compact window');
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
      const install=await updateAction(p,'install').boundingBox();assert.ok(install.x>=modal.x&&install.y>=modal.y&&install.x+install.width<=modal.x+modal.width+1&&install.y+install.height<=modal.y+modal.height+1,'The primary update action remains visible');
      assert.ok((await updateDialog(p).innerText()).includes(newerClient.fileName));
      if(language==='en')assert.doesNotMatch(await updateDialog(p).innerText(),/[\u3400-\u9fff]/);
      await shot(p,'client-update-'+language);await updateAction(p,'close').click();
    }
    assert.deepEqual(await updateInstalls(p),[]);assert.deepEqual(await requests(p),[]);
  },snapshot(),{clientUpdate:newerClient});
  const longState = snapshot();
  longState.packages = Array.from({length:120},(_,i)=>({packageName:`com.example.app${i}`,label:`应用 ${i}`,installed:true,system:false,enabled:true,protectedReason:null,apkSizeBytes:1048576}));
  longState.launchers = Array.from({length:30},(_,i)=>({packageName:`com.example.home${i}`,component:`com.example.home${i}/.Main`,label:`桌面 ${i}`,isDefault:false}));
  longState.history = Array.from({length:100},(_,i)=>({id:String(i),timestamp:1,action:'install',target:`com.example.app${i}`,device:'tv',userId:0,success:true,message:'已完成'}));
  await check('all long lists scroll internally while top actions and surrounding content stay fixed', async p => {
    for (const viewport of [{width:1440,height:900},{width:960,height:640}]) {
      await p.setViewportSize(viewport);
      for (const [page,key] of [['apps','apps'],['launchers','launchers'],['history','history'],['install','apks']]) {
        await nav(p,page);await settled(p);
        if (page==='install' && !await p.locator('[data-scroll="apks"]').count()) await act(p,'add-apks').click();await settled(p);
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
    await act(p,'import-layout').click();await settled(p);assert.equal(JSON.parse(await p.locator('[name="layoutJson"]').inputValue()).home.columns,2);
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
  await check('launcher APK installs on the same page and sidecar previews remain read-only',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'add-launcher').click();await settled(p);
    assert.equal(await p.locator('.pending-launcher').count(),1);assert.equal(await p.locator('.pending-launcher .launcher-card-background').count(),1);
    await act(p,'install-launcher').click();await confirmOperation(p);assert.equal(await p.locator('.pending-launcher').count(),0);
    assert.equal(await p.locator('[data-page="launchers"]').getAttribute('aria-current'),'page');
    assert.equal(await p.locator('[data-act="launcher-cover"], [data-act="remove-launcher-cover"]').count(),0);
    await settled(p);
    await p.setViewportSize({width:1000,height:700});
    assert.equal(await p.locator('.launcher-card').evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('button')].every(button=>{const c=card.getBoundingClientRect(),b=button.getBoundingClientRect();return b.left>=c.left && b.right<=c.right && b.bottom<=c.bottom;}))),true,'Card buttons stay inside cards');
  },snapshot(),{thumbnail:true});
  await check('one pending APK installs independently and leaves the other rows',async p=>{
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await p.locator('.apk-item').first().waitFor();
    await p.locator('.apk-item').nth(1).locator('[data-act="install-one-apk"]').click();await confirmOperation(p);
    assert.deepEqual((await requests(p)).find(r=>r.action==='install').paths,['/tmp/second.apk']);assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/first.apk/);
  },snapshot(),{apkPaths:['/tmp/first.apk','/tmp/second.apk']});
  await check('pending APKs install inside app management and new apps become layout choices', async p => {
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await p.locator('.apk-item').first().waitFor();
    await act(p,'install-apks').click();await confirmOperation(p);
    assert.equal(await p.locator('.apk-item').count(),0,'Successful installs leave the pending queue');
    await act(p,'go-apps').click();assert.equal(await box(p,'com.imported.app').count(),1);
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[name="layoutApp"]').waitFor();
    assert.match(await p.locator('[name="layoutApp"]').innerText(),/新安装应用/);
  },customHome,{layoutSupported:true});
  await check('partial installation removes only successful paths and retains failures', async p => {
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await p.locator('.apk-item').first().waitFor();
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
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/37\.0\.1/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/macOS/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/15\.4 MiB/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/dl\.google\.com/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/mirrors\.cloud\.tencent\.com/);
    assert.equal(await p.locator('#platform-tools-license').isChecked(),false);
    assert.equal(await p.locator('#confirm-platform-tools').isDisabled(),true);
    await act(p,'platform-tools-license').click();
    assert.deepEqual(await p.evaluate(()=>window.__resources),['platformToolsLicense']);
    await act(p,'close-dialog').click(); assert.equal(await p.evaluate(()=>window.__toolsInstalls),0);
    await act(p,'download-adb').click(); await acceptTools(p);
    await p.locator('.busy-bar').waitFor();
    assert.match(await p.locator('.busy-bar').innerText(),/50%/);
    assert.equal(await p.locator('.busy-bar progress').getAttribute('max'),'16110554');
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
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/优先验证并使用已下载工具/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/校验失败时会重新下载并修复/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/0 MiB/);
    await acceptTools(p); await settled(p);
    assert.equal(await act(p,'connect').isEnabled(),true);assert.match(await act(p,'download-adb').innerText(),/ADB 已就绪/);assert.equal(await act(p,'download-adb').isDisabled(),true);
    assert.equal(await p.evaluate(()=>window.__toolsInstalls),1);
  },withoutAdb(),{toolsInstalled:true});
  const readyDisconnected={...snapshot(),device:null,packages:[],launchers:[],defaultHome:null};
  await check('ready ADB can be forcibly re-downloaded with consent and fresh download progress',async p=>{
    assert.equal(await act(p,'download-adb').isDisabled(),true);assert.equal(await act(p,'redownload-adb').isEnabled(),true);
    const previous=await p.locator('[name="adbPath"]').inputValue();await act(p,'redownload-adb').click();
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback) h2').innerText(),/重新下载/);assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/15\.4 MiB/);assert.doesNotMatch(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/0 MiB/);assert.equal(await p.locator('#confirm-platform-tools').isDisabled(),true);
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
  const filterState = snapshot();
  filterState.packages.push(
    {packageName:'com.example.disabled',label:'停用的用户应用',system:false,installed:true,enabled:false,protectedReason:null},
    {packageName:'com.example.removed',label:'未安装的用户应用',system:false,installed:false,enabled:true,protectedReason:null},
  );
  await check('installed/enabled/recoverable filters, search and protected components', async p => {
    await nav(p,'apps');
    assert.equal(await p.locator('input[data-select-package]').count(),7);
    assert.equal(await box(p,'com.vendor.home').isDisabled(),true);
    assert.equal(await box(p,'com.android.settings').isDisabled(),true);
    await p.locator('[data-filter="recoverable"]').click();
    assert.equal(await p.locator('input[data-select-package]').count(),2);
    assert.equal(await box(p,'com.vendor.removed').count(),1);
    await p.locator('[data-filter="enabled"]').click();
    assert.match(await p.locator('[data-filter="enabled"]').innerText(),/^已启用/);
    assert.equal(await p.locator('[data-filter="enabled"] span').innerText(),'2');
    assert.equal(await p.locator('input[data-select-package]').count(),2);
    assert.equal(await box(p,'com.example.disabled').count(),0);
    assert.equal(await box(p,'com.example.removed').count(),0);
    assert.equal(await box(p,'com.vendor.recommendations').count(),0);
    assert.match(await p.locator('#list-count').innerText(),/2 \/ 2/);
    await p.locator('[name="locale"]').selectOption('en');
    assert.match(await p.locator('[data-filter="enabled"]').innerText(),/^Enabled/);
    await p.locator('[name="locale"]').selectOption('zh-TW');
    assert.match(await p.locator('[data-filter="enabled"]').innerText(),/^已啟用/);
    await p.locator('[name="locale"]').selectOption('zh-CN');
    await p.locator('[name="search"]').fill('com.example');
    assert.equal(await p.locator('input[data-select-package]').count(),0);
    await p.locator('[name="search"]').fill('webtv');
    assert.equal(await p.locator('input[data-select-package]').count(),1);
    await p.locator('[name="search"]').fill('');
    await p.locator('[data-select-all]').check();
    assert.deepEqual(await p.locator('input[data-select-package]:checked').evaluateAll(inputs=>inputs.map(input=>input.dataset.selectPackage).sort()),['com.ecojust.puretv','com.ecojust.webtv']);
    const changedState=structuredClone(filterState);changedState.revision=1;
    changedState.packages.find(app=>app.packageName==='com.ecojust.webtv').enabled=false;
    await p.evaluate(state=>{window.__setMockState(state);window.__emitMcp('mcp-operation',{running:false,tool:'set_enabled',snapshot:state});},changedState);
    assert.equal(await box(p,'com.ecojust.webtv').count(),0);
    assert.equal(await p.locator('[data-filter="enabled"] span').innerText(),'1');
    assert.match(await p.locator('#selection-bar').innerText(),/已选择 1 项/);
    assert.equal(await box(p,'com.ecojust.puretv').isChecked(),true);
    await p.locator('[data-filter="disabled"]').click();
    assert.equal(await box(p,'com.example.disabled').count(),1);
    assert.equal(await box(p,'com.ecojust.webtv').count(),1);
    await p.locator('[name="search"]').fill(''); await p.locator('[data-filter="all"]').click();
    await shot(p,'applications');
    await p.setViewportSize({width:960,height:640});
    for (const page of ['apps','connect','launchers','install','history']) {
      await nav(p,page);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow on ${page}`);
    }
  },filterState);
  await check('cancel confirmation sends no mutation; confirmed disable sends exact target', async p => {
    await nav(p,'apps'); await box(p,'com.vendor.recommendations').check();
    await act(p,'disable').click();
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/192\.168\.1\.50:5555/);
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/com\.vendor\.recommendations/);
    await p.getByRole('button',{name:'取消',exact:true}).click();
    assert.deepEqual(await requests(p),[]);
    await act(p,'disable').click(); await confirmOperation(p);
    assert.deepEqual(await requests(p),[{action:'setEnabled',packages:['com.vendor.recommendations'],enabled:false}]);
    await p.locator('[data-filter="disabled"]').click(); assert.equal(await p.locator('input[data-select-package]').count(),2);
    await nav(p,'history'); assert.match(await p.locator('.history-panel').innerText(),/com\.vendor\.recommendations/);
  });
  await check('external APK picker appends/deduplicates; installs only selected paths after confirmation', async p => {
    await nav(p,'install'); await act(p,'add-apks').click();await settled(p);
    await p.locator('.apk-item').first().waitFor();
    assert.equal(await p.locator('.apk-item').count(),1);
    assert.deepEqual(await requests(p),[],'Import must not install');
    await act(p,'add-apks').click();await settled(p);
    await p.waitForFunction(() => document.querySelectorAll('.apk-item').length === 2);
    await act(p,'clear-apks-selection').click();
    assert.equal(await act(p,'install-apks').isDisabled(),true);
    await p.getByRole('checkbox',{name:'选择 custom music.apk',exact:true}).check();
    await shot(p,'import-apks');
    await act(p,'install-apks').click();
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/C:\\我的安装包\\custom music\.apk/);
    assert.doesNotMatch(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/second\.apk/);
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
    await act(p,'add-launcher').click();await settled(p);
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
    await act(p,'connect').click();await p.locator('.notice.error').waitFor();await settled(p);assert.match(await p.locator('.notice.error').innerText(),/本地网络/);
    assert.equal(await p.locator('[name="host"]').inputValue(),'192.168.0.192');assert.equal(await p.locator('[name="port"]').inputValue(),'37777');
    assert.deepEqual(await requests(p),[{action:'connect',host:'192.168.0.192',port:37777}]);
    await p.locator('[name="locale"]').selectOption('en');assert.match(await p.locator('.notice.error').innerText(),/Cannot reach 192.168.0.192:37777/);assert.match(await p.locator('.notice.error').innerText(),/Local Network/);assert.match(await p.locator('.notice.error').innerText(),/No route to host/);
    assert.equal(await p.evaluate(()=>localStorage.getItem('puretv.preferences').includes('192.168.0.192')),false);
  },rememberedState,{connectError:routeError});
  const readyNetwork={...snapshot(),device:null,packages:[],launchers:[],defaultHome:null};
  await check('different subnets warn before connecting and cancellation sends no ADB request',async p=>{
    await p.locator('[name="host"]').fill('192.168.0.191');await act(p,'connect').click();await p.locator('#confirm-operation').waitFor();
    assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/不在同一网段/);assert.match(await p.locator('dialog.modal[open]:not(.operation-feedback)').innerText(),/10.0.0.2\/24/);assert.deepEqual(await requests(p),[]);
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
  const unifiedLayout=JSON.parse(await readFile(new URL('../public/layout-v4.json',import.meta.url),'utf8'));
  const rawSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M2 2h20v20H2z"/></svg>';
  const unifiedState=structuredClone(customHome);unifiedState.packages.push({packageName:'com.ecojust.music',label:'Music',installed:true,enabled:true,system:false,protectedReason:null});
  const unifiedApps=[{packageName:'com.ecojust.webtv',label:'WebTV'},{packageName:'com.ecojust.puretv',label:'pureTV'},{packageName:'com.ecojust.music',label:'Music'}];
  unifiedLayout.home.users=unifiedApps.map((a,i)=>({id:'user-'+i,name:a.label,text:a.label,action:a.packageName,frame:{x:[48,300,650][i],y:220+i*20,width:160,height:140},visible:true,icon:rawSvg,color:'#EEEEEE',backgroundColor:'#374959'}));
  await check('v4 uses editable users and immutable system nodes with a top toolbar and raw JSON viewer',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();
    assert.equal(await p.locator('[name="layoutColumns"]').count(),0);assert.equal(await p.locator('[data-scene-layer]').count(),0);assert.equal(await p.locator('.layout-inspector [data-u-add-app]').count(),0);assert.equal(await p.locator('.unified-toolbar [data-u-act="add"]').count(),1);assert.equal(await p.locator('[data-u-add-app]').count(),0);
    const fixed=p.locator('[data-u-node="clock"]'),before=await fixed.boundingBox();await fixed.click();assert.equal(await p.locator('[data-u-frame="x"]').isDisabled(),true);assert.equal(await p.locator('[data-u-field="icon"]').isDisabled(),true);assert.equal(await p.locator('.layout-inspector input[value="com.ecojust.puretv.clock"]').isDisabled(),true);
    await p.mouse.move(before.x+before.width/2,before.y+before.height/2);await p.mouse.down();await p.mouse.move(before.x+before.width/2+50,before.y+before.height/2+40,{steps:6});await p.mouse.up();
    await p.locator('[data-u-act="json"]').click();let draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.deepEqual(draft.home.system,unifiedLayout.home.system);assert.equal(await p.locator('.layout-json-viewer textarea').count(),0);await p.locator('[data-close-json]').click();
    await p.locator('[data-u-node="user-0"]').click();assert.equal(await p.locator('[data-u-frame="x"]').isDisabled(),false);assert.equal(await p.locator('[data-u-field="icon"]').inputValue(),rawSvg);assert.equal(await p.locator('select[data-u-field="action"]').inputValue(),'com.ecojust.webtv');
    await p.locator('[data-u-field="text"]').fill('自定义直播');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    assert.equal(await p.locator('[data-u-screen]').count(),0);assert.match(await p.locator('.screen-baseline').innerText(),/960 × 540/);
    await p.locator('[data-u-act="json"]').click();draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.equal(draft.screen.width,960);assert.equal(draft.home.system.find(n=>n.id==='clock').frame.x,48);assert.equal(draft.home.users[0].frame.x,48);assert.equal(draft.home.users[0].text,'自定义直播');await p.locator('[data-close-json]').click();
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
  const addState=structuredClone(unifiedState);addState.packages.push({packageName:'com.example.extra',label:'Extra TV',installed:true,enabled:true,system:false,protectedReason:null});
  await check('top toolbar adds a v4 app block without modern UUID APIs and preserves its package action',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.evaluate(()=>crypto.randomUUID=undefined);await p.locator('[data-u-act="add"]').click();await p.locator('[data-u-act="json"]').click();let draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.equal(draft.home.users.length,4);const added=draft.home.users.at(-1);assert.match(added.id,/^app-[0-9a-f]{32}$/);assert.equal(added.action,'com.example.extra');assert.equal(added.name,'Extra TV');assert.ok(added.icon.startsWith('<svg'));await p.locator('[data-close-json]').click();await p.locator('[data-u-act="remove"]').click();await p.locator('[data-u-act="json"]').click();draft=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());assert.equal(draft.home.users.length,3);
  },addState,{layoutSupported:true,layout:unifiedLayout,layoutApps:[...unifiedApps,{packageName:'com.example.extra',label:'Extra TV'}]});
  const modernLayout=JSON.parse(await readFile(new URL('../../resource/launcher/puretv/layout.example.json',import.meta.url),'utf8'));
  const mossTemplate=JSON.parse(await readFile(new URL('../../resource/launcher/moss/app/src/main/assets/layout.json',import.meta.url),'utf8'));
  const cctvApp={packageName:'com.ecojust.cctvlive',label:'CCTV Live',installed:true,enabled:true,system:false,protectedReason:null};
  const mossState=structuredClone(unifiedState);
  mossState.defaultHome='com.ecojust.mosstv/.MainActivity';
  mossState.packages.push({...cctvApp},{packageName:'com.ecojust.mosstv',label:'MossTV',installed:true,enabled:true,system:false,protectedReason:'当前默认启动器'});
  mossState.launchers.forEach(launcher=>launcher.isDefault=false);
  mossState.launchers.push({packageName:'com.ecojust.mosstv',component:mossState.defaultHome,label:'MossTV',isDefault:true});
  const cctvNode={...structuredClone(modernLayout.home.users[0]),id:'cctv-live',name:'央视直播',text:'央视直播',action:cctvApp.packageName};
  const mossLayout=structuredClone(mossTemplate);mossLayout.home.users=[cctvNode];mossLayout.apps.users=[];
  const mossApps=[...unifiedApps,{packageName:cctvApp.packageName,label:cctvApp.label}];
  const openMossEditor=async p=>{await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();};
  const readEditorJson=async p=>{await p.locator('[data-u-act="json"]').click();const value=JSON.parse(await p.locator('.layout-json-viewer pre').innerText());await p.locator('[data-close-json]').click();return value;};
  await check('layout validation: MossTV reopens with the current generated layout instead of a stale closed draft',async p=>{
    await openMossEditor(p);assert.equal((await readEditorJson(p)).home.users[0].action,'com.ecojust.cctvlive');
    await p.locator('[data-u-act="close"]').first().click();await nav(p,'apps');
    const updated=structuredClone(mossState);updated.revision=2;updated.packages=updated.packages.filter(app=>app.packageName!==cctvApp.packageName);
    const current=structuredClone(mossLayout);current.home.users=[{...cctvNode,id:'webtv-current',name:'当前电视应用',text:'当前电视应用',action:'com.ecojust.webtv'}];
    await p.evaluate(({state,layout,apps})=>{window.__setMockState(state);window.__setMockLayout(layout);window.__setMockLayoutApps(apps);},{state:updated,layout:current,apps:unifiedApps});
    await openMossEditor(p);const reopened=await readEditorJson(p);
    assert.deepEqual(reopened.home.users,current.home.users,'A closed, unedited cache must not overwrite the fresh launcher layout');
    assert.equal(await p.locator('[data-u-invalid-id]').count(),0);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  const beforeCctvInstall=structuredClone(mossState);beforeCctvInstall.packages=beforeCctvInstall.packages.filter(app=>app.packageName!==cctvApp.packageName);
  await check('layout validation: preflight discovers externally installed CCTV Live and preserves the edited MossTV draft',async p=>{
    await openMossEditor(p);await p.locator('[data-u-node="cctv-live"]').click();
    await p.locator('[data-u-field="text"]').fill('客厅央视直播');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    const count=await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='getLayout').length);
    await p.evaluate(({state,apps})=>{window.__setMockState(state);window.__setMockLayoutApps(apps);},{state:{...mossState,revision:2},apps:mossApps});
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').waitFor();
    assert.ok(await p.evaluate(before=>window.__launcherRequests.filter(request=>request.action==='getLayout').length>before,count),'Apply refreshes the real launcher before confirmation');
    assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0,'Preflight remains read-only');
    await p.locator('#confirm-operation').click();await result(p,'success');await acknowledge(p);
    const applied=await p.evaluate(()=>window.__launcherRequests.find(request=>request.action==='applyLayout').layout);
    assert.equal(applied.home.users[0].action,'com.ecojust.cctvlive');assert.equal(applied.home.users[0].text,'客厅央视直播');
    assert.equal(await p.locator('[data-u-invalid-id]').count(),0);
  },beforeCctvInstall,{layoutSupported:true,layout:mossLayout,layoutApps:unifiedApps});
  const obsoleteLayout=structuredClone(mossLayout);
  obsoleteLayout.apps.users=[{...structuredClone(cctvNode),id:'old-hidden-app',name:'旧电影入口',text:'旧电影入口',action:'com.old.removed',visible:false}];
  await check('layout validation: an unrelated hidden Apps entry identifies its package and can be removed before applying CCTV Live',async p=>{
    await openMossEditor(p);await p.locator('[data-u-node="cctv-live"]').click();
    await p.locator('[data-u-act="apply"]').click();await settled(p);
    assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0);
    const jump=p.locator('[data-u-invalid-page="apps"][data-u-invalid-id="old-hidden-app"]');await jump.waitFor();
    const displayed=await p.locator('.layout-modal[open]').innerText();assert.match(displayed,/Apps/);assert.match(displayed,/旧电影入口/);assert.match(displayed,/com\.old\.removed/);
    assert.equal((await readEditorJson(p)).apps.users.length,1,'Unavailable entries are never silently deleted');
    await jump.click();assert.equal(await p.locator('[data-u-field="name"]').inputValue(),'旧电影入口');assert.equal(await p.locator('[data-u-field="visible"]').isChecked(),false);
    assert.equal(await p.locator('[data-u-page="apps"]').evaluate(el=>el.classList.contains('primary')),true);
    await p.locator('[data-u-act="remove"]').click();assert.equal(await p.locator('[data-u-invalid-id]').count(),0);
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');
    const applied=await p.evaluate(()=>window.__launcherRequests.find(request=>request.action==='applyLayout').layout);
    assert.equal(applied.home.users[0].action,'com.ecojust.cctvlive');assert.deepEqual(applied.apps.users,[]);
  },mossState,{layoutSupported:true,layout:obsoleteLayout,layoutApps:mossApps});
  const restrictedState=structuredClone(mossState);
  const restrictedApps=[
    {packageName:'com.blocked.system',label:'系统入口',system:true,installed:true,enabled:true,protectedReason:null},
    {packageName:'com.blocked.disabled',label:'已停用入口',system:false,installed:true,enabled:false,protectedReason:null},
    {packageName:'com.blocked.removed',label:'未安装入口',system:false,installed:false,enabled:true,protectedReason:null},
    {packageName:'com.blocked.service',label:'无启动入口',system:false,installed:true,enabled:true,protectedReason:null},
  ];
  restrictedState.packages.push(...restrictedApps);
  const restrictedLayout=structuredClone(mossLayout);restrictedLayout.apps.users=restrictedApps.map((app,index)=>({...structuredClone(cctvNode),id:'blocked-'+index,name:app.label,text:app.label,action:app.packageName}));
  await check('layout validation: refreshed provider choices never admit system disabled uninstalled or non-launchable entries',async p=>{
    await openMossEditor(p);await p.locator('[data-u-act="apply"]').click();await settled(p);
    assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0);
    const displayed=await p.locator('.layout-modal[open]').innerText();
    for(const [index,app] of restrictedApps.entries()){assert.ok(displayed.includes(app.packageName));await p.locator(`[data-u-invalid-page="apps"][data-u-invalid-id="blocked-${index}"]`).waitFor();}
    assert.equal((await readEditorJson(p)).apps.users.length,4,'Validation does not remove invalid entries without the user editing the draft');
  },restrictedState,{layoutSupported:true,layout:restrictedLayout,layoutApps:[...mossApps,...restrictedApps.slice(0,3).map(({packageName,label})=>({packageName,label}))]});
  await check('layout validation: a failed refresh cannot confirm or apply a cached CCTV Live draft',async p=>{
    await openMossEditor(p);await p.locator('[data-u-node="cctv-live"]').click();
    await p.locator('[data-u-field="text"]').fill('保持这份修改');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.evaluate(()=>window.__failNextLayoutRead('无法刷新电视应用，请重新连接'));
    await p.locator('[data-u-act="apply"]').click();await settled(p);
    assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0);
    assert.equal((await readEditorJson(p)).home.users[0].text,'保持这份修改');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('layout validation: explicit refresh updates application choices without replacing an edited MossTV draft',async p=>{
    await openMossEditor(p);await p.locator('[data-u-node="cctv-live"]').click();
    await p.locator('[data-u-field="text"]').fill('刷新前的央视文案');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.locator('[data-u-frame="x"]').fill('88');await p.locator('[data-u-frame="x"]').dispatchEvent('change');
    const before=await readEditorJson(p),external={packageName:'com.new.external',label:'新装的电视应用',installed:true,enabled:true,system:false,protectedReason:null};
    const updated=structuredClone(mossState);updated.revision=2;updated.packages.push(external);
    const current=structuredClone(mossLayout);current.home.users[0].text='电视返回的原始布局';
    const reads=await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='getLayout').length);
    await p.evaluate(({state,layout,apps})=>{window.__setMockState(state);window.__setMockLayout(layout);window.__setMockLayoutApps(apps);},{state:updated,layout:current,apps:[...mossApps,{packageName:external.packageName,label:external.label}]});
    await p.locator('[data-u-act="refresh"]').click();await result(p,'success');await acknowledge(p);
    assert.ok(await p.evaluate(count=>window.__launcherRequests.filter(request=>request.action==='getLayout').length>count,reads));
    assert.equal(await p.locator('[data-u-field="action"] option[value="com.new.external"]').isEnabled(),true);
    assert.deepEqual(await readEditorJson(p),before,'Refreshing app choices preserves edited text, frames and current action');
    assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0,'Refresh never writes a layout');
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('layout validation: changing the television user or launcher during confirmation prevents every layout write',async p=>{
    let revision=2;
    for(const change of [{device:{...mossState.device,serial:'192.168.1.99:5555'}},{device:{...mossState.device,userId:10}},{defaultHome:'com.ecojust.puretv/.MainActivity'}]){
      await openMossEditor(p);await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').waitFor();
      const changed={...structuredClone(mossState),...change,revision:revision++};
      await p.evaluate(state=>{window.__setMockState(state);window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:state});},changed);
      await p.locator('#confirm-operation').click();const error=await result(p,'error');
      assert.match(await error.innerText(),/设备或启动器已变化/);
      assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout').length),0,'Confirmation for an earlier target cannot authorize a write to the new target');
      await acknowledge(p);
      await p.evaluate(state=>{window.__setMockState(state);window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:state});},{...structuredClone(mossState),revision:revision++});
    }
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  const holdNext=(p,action)=>p.evaluate(action=>window.__holdNextOperation(action),action);
  const layoutWrites=p=>p.evaluate(()=>window.__launcherRequests.filter(request=>request.action==='applyLayout'));
  await check('layout preflight: checking is modal before the first read and continues through snapshot reconciliation',async p=>{
    await openMossEditor(p);const before=await p.evaluate(()=>window.__launcherRequests.length);await holdNext(p,'getLayout');await holdNext(p,'getState');
    await p.locator('[data-u-act="apply"]').click();await held(p,'getLayout');
    const observed=await p.evaluate(()=>window.__pendingOperations.find(operation=>operation.action==='getLayout').feedback);
    assert.equal(observed.phase,'loading');assert.equal(observed.modal,true);assert.match(observed.text,/正在检查电视应用和启动器布局/);
    assert.equal(await p.locator('[data-u-act="apply"]').isDisabled(),true);assert.equal(await p.locator('[data-u-field="text"]').isDisabled(),true);
    await p.keyboard.press('Escape');assert.equal(await feedback(p).getAttribute('data-phase'),'loading');
    for(let i=0;i<4;i++){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('.operation-feedback')),true);}
    assert.equal(await p.locator('#confirm-operation').count(),0);await release(p,'getLayout');await held(p,'getState');
    assert.equal(await feedback(p).getAttribute('data-phase'),'loading','Snapshot reconciliation remains covered by the same loading dialog');
    assert.deepEqual(await p.evaluate(index=>window.__launcherRequests.slice(index).map(request=>request.action),before),['getLayout'],'Checking does not scan unrelated launcher backgrounds');
    await release(p,'getState');await p.locator('#confirm-operation').waitFor();assert.equal(await feedback(p).count(),0,'The checking overlay is gone before confirmation');
    assert.equal(await p.locator('#confirm-operation').evaluate(el=>el.closest('dialog').matches(':modal')),true);assert.equal((await layoutWrites(p)).length,0);
    await p.locator('dialog[open]:has(#confirm-operation) [data-act="close-dialog"]').last().click();assert.equal((await layoutWrites(p)).length,0);assert.equal(await p.locator('[data-u-act="apply"]').isEnabled(),true);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('layout preflight: cancelling a slow check keeps edits and never opens confirmation or writes',async p=>{
    await openMossEditor(p);await p.locator('[data-u-field="text"]').fill('取消检查也保留');await p.locator('[data-u-field="text"]').dispatchEvent('change');await holdNext(p,'getLayout');
    await p.locator('[data-u-act="apply"]').click();await held(p,'getLayout');await feedback(p).locator('[data-feedback-cancel]').click();assert.equal(await feedback(p).locator('[data-feedback-cancel]').isDisabled(),true);
    await release(p,'getLayout');const modal=await result(p,'info');assert.match(await modal.innerText(),/检查已取消，尚未写入电视/);assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal((await layoutWrites(p)).length,0);
    await acknowledge(p);assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'取消检查也保留');assert.equal(await p.locator('[data-u-act="apply"]').isEnabled(),true);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('layout preflight: failed layout or snapshot reads show an error and preserve the draft for retry',async p=>{
    await openMossEditor(p);await p.locator('[data-u-field="text"]').fill('检查失败保留草稿');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    for(const action of ['getLayout','getState']){
      await holdNext(p,action);await p.locator('[data-u-act="apply"]').click();await held(p,action);await release(p,action,{error:'读取失败 '+action});
      assert.match(await (await result(p,'error')).innerText(),new RegExp('读取失败 '+action));assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal((await layoutWrites(p)).length,0);await acknowledge(p);
      assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'检查失败保留草稿');assert.equal(await p.locator('[data-u-act="apply"]').isEnabled(),true);
    }
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');assert.equal((await layoutWrites(p))[0].layout.home.users[0].text,'检查失败保留草稿');
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  const cctvSvg=await readFile(new URL('./fixtures/cctv-logo.svg',import.meta.url),'utf8');
  const svgInput=p=>p.locator('textarea[data-u-field="icon"]');
  const editSvg=async(p,value)=>{await svgInput(p).fill(value);await svgInput(p).dispatchEvent('change');};
  const savedLogo='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img"><title>Saved TV logo</title><path fill="#ffbb44" d="M8 12H56V52H8Z"/></svg>';
  const logoApp={packageName:'com.example.savedlogo',label:'Saved Logo TV',logoSvg:savedLogo};
  const noLogoApp={packageName:'com.example.nologo',label:'No Logo TV'};
  const badLogoApp={packageName:'com.example.badlogo',label:'Invalid Logo TV',logoSvg:'<svg xmlns="http://www.w3.org/2000/svg" onload="window.__logoXss=true"><image href="https://invalid.example/logo.png"/></svg>'};
  const logoState=structuredClone(mossState);
  for(const app of [logoApp,noLogoApp,badLogoApp])logoState.packages.push({packageName:app.packageName,label:app.label,installed:true,enabled:true,system:false,protectedReason:null});
  const logoApps=[logoApp,noLogoApp,badLogoApp,...mossApps.map(app=>({...app,logoSvg:app.packageName===cctvApp.packageName?savedLogo:undefined}))];
  await check('saved app logo: adding a block uses sanitized downloaded SVG and applies it to the TV',async p=>{
    await openMossEditor(p);
    assert.equal((await readEditorJson(p)).home.users[0].icon,cctvNode.icon,'Reading a layout must not replace its existing artwork');
    await p.locator('[data-u-act="add"]').click();
    const draft=await readEditorJson(p),added=draft.home.users.at(-1);
    assert.equal(added.action,logoApp.packageName);assert.equal(added.name,logoApp.label);
    assert.match(added.icon,/width="64"/);assert.match(added.icon,/M8 12H56V52H8Z/);assert.doesNotMatch(added.icon,/<title|role=/);
    assert.equal(await svgInput(p).inputValue(),added.icon,'Inspector shows the saved SVG source');
    assert.equal(await p.locator(`[data-u-node="${added.id}"] svg path[fill="#ffbb44"]`).count(),1,'Canvas renders the real logo');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');
    assert.equal((await layoutWrites(p))[0].layout.home.users.at(-1).icon,added.icon);
    assert.deepEqual((await layoutWrites(p))[0].layout.home.system,mossLayout.home.system);
  },logoState,{layoutSupported:true,layout:mossLayout,layoutApps:logoApps});
  await check('saved app logo: selection and refresh preserve custom artwork; changing action selects the new default',async p=>{
    await openMossEditor(p);
    const custom='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="21" fill="#123abc"/></svg>';
    await editSvg(p,custom);
    await p.locator(`[data-u-node="${mossLayout.home.system[0].id}"]`).click();await p.locator('[data-u-node="cctv-live"]').click();
    assert.equal(await svgInput(p).inputValue(),custom,'Selecting a component retains its user-edited icon');
    await p.evaluate(apps=>window.__setMockLayoutApps(apps),logoApps.map(app=>({...app,logoSvg:app.packageName===cctvApp.packageName?savedLogo.replace('#ffbb44','#3399cc'):app.logoSvg})));
    await p.locator('[data-u-act="refresh"]').click();await settled(p);
    assert.equal((await readEditorJson(p)).home.users[0].icon,custom,'Refreshing available apps must not overwrite the current draft');
    await p.locator('[data-u-field="action"]').selectOption(logoApp.packageName);
    const changed=(await readEditorJson(p)).home.users[0];assert.equal(changed.action,logoApp.packageName);assert.match(changed.icon,/M8 12H56V52H8Z/);assert.notEqual(changed.icon,custom);
    await editSvg(p,custom);await p.locator('[data-u-field="action"]').dispatchEvent('change');
    assert.equal((await readEditorJson(p)).home.users[0].icon,custom,'A same-value action event does not reset custom artwork');
    await p.locator('[data-u-field="action"]').selectOption(noLogoApp.packageName);
    const generic=(await readEditorJson(p)).home.users[0].icon;
    assert.match(generic,/M8 8h8v8H8z/);assert.doesNotMatch(generic,/M8 12H56V52H8Z|circle/,'An app without a logo never inherits another application logo');
  },logoState,{layoutSupported:true,layout:mossLayout,layoutApps:logoApps});
  await check('saved app logo: unsafe artwork falls back and changing action clears an abandoned invalid icon draft',async p=>{
    await openMossEditor(p);await p.evaluate(()=>window.__logoXss=false);
    await editSvg(p,'<svg><path');assert.equal(await p.locator('[data-svg-error]').count(),1);
    await p.locator('[data-u-field="action"]').selectOption(badLogoApp.packageName);
    const changed=(await readEditorJson(p)).home.users[0];assert.equal(changed.action,badLogoApp.packageName);assert.match(changed.icon,/M8 8h8v8H8z/);
    assert.equal(await p.locator('[data-svg-error]').count(),0);assert.equal(await p.locator('[data-u-act="discard-svg"]').count(),0);
    assert.equal(await p.locator('.unified-canvas script,.unified-canvas image,.unified-canvas [onload]').count(),0);assert.equal(await p.evaluate(()=>window.__logoXss),false);
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');
    assert.equal((await layoutWrites(p))[0].layout.home.users[0].icon,changed.icon);
  },logoState,{layoutSupported:true,layout:mossLayout,layoutApps:logoApps});
  await check('SVG icon: the supplied CCTV artwork strips accessibility metadata and preserves every drawing command',async p=>{
    await openMossEditor(p);await editSvg(p,cctvSvg);assert.equal(await p.locator('[data-svg-error]').count(),0);
    const normalized=(await readEditorJson(p)).home.users[0].icon;
    const details=await p.evaluate(({source,normalized})=>{
      const parse=text=>new DOMParser().parseFromString(text,'image/svg+xml'),attrs=node=>Object.fromEntries([...node.attributes].map(attr=>[attr.name,attr.value]));
      const original=parse(source),clean=parse(normalized);
      return {originalPaths:[...original.querySelectorAll('path')].map(attrs),cleanPaths:[...clean.querySelectorAll('path')].map(attrs),originalGroup:attrs(original.querySelector('g')),cleanGroup:attrs(clean.querySelector('g')),root:attrs(clean.documentElement),metadata:clean.querySelectorAll('title,desc,[role],[aria-label]').length};
    },{source:cctvSvg,normalized});
    assert.deepEqual(details.cleanPaths,details.originalPaths);assert.deepEqual(details.cleanGroup,details.originalGroup);assert.equal(details.metadata,0);assert.equal(details.root.viewBox,'0 0 32 32');assert.equal(details.root.width,'32');assert.equal(details.root.height,'32');assert.equal(await p.locator('[data-u-node="cctv-live"] svg path').count(),4);
    const systemId=mossLayout.home.system[0].id;await p.locator(`[data-u-node="${systemId}"]`).click();assert.equal(await svgInput(p).isDisabled(),true);await p.locator('[data-u-node="cctv-live"]').click();
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');const sent=(await layoutWrites(p))[0].layout;assert.equal(sent.home.users[0].icon,normalized);assert.deepEqual(sent.home.system,mossLayout.home.system);await shot(p,'svg-cctv-applied');
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('SVG icon: pasting and immediately applying does not consume the first click',async p=>{
    await openMossEditor(p);await svgInput(p).fill(cctvSvg);
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').waitFor({timeout:4000});
    assert.equal((await layoutWrites(p)).length,0,'The initial click starts checking and confirmation, never a premature write');
    await p.locator('#confirm-operation').click();await result(p,'success');
    const applied=(await layoutWrites(p))[0].layout.home.users[0].icon;assert.match(applied,/M126\.57 53\.76/);assert.doesNotMatch(applied,/<title|role=|aria-label=/);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('SVG icon: invalid input survives page changes and blocks apply until explicitly discarded',async p=>{
    await openMossEditor(p);await p.locator('[data-u-field="text"]').fill('保留文案');await p.locator('[data-u-field="text"]').dispatchEvent('change');const malformed='<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0';await editSvg(p,malformed);
    assert.match(await p.locator('[data-svg-error]').innerText(),/SVG/);assert.doesNotMatch(await p.locator('[data-svg-error]').innerText(),/屏幕范围|系统组件只读/);
    await p.locator('[data-u-page="apps"]').click();const before=await p.evaluate(()=>window.__launcherRequests.length);await p.locator('[data-u-act="apply"]').click();await settled(p);
    assert.equal(await p.evaluate(()=>window.__launcherRequests.length),before,'Invalid SVG is rejected before reading or writing any television state');assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal(await svgInput(p).inputValue(),malformed);assert.equal(await p.locator('[data-u-page="home"]').evaluate(el=>el.classList.contains('primary')),true);
    await p.locator('[data-u-act="discard-svg"]').click();assert.equal(await svgInput(p).inputValue(),cctvNode.icon);assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'保留文案');await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await result(p,'success');assert.equal((await layoutWrites(p))[0].layout.home.users[0].text,'保留文案');
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('SVG icon: an invalid icon alone preserves its application identity during a catalogue refresh',async p=>{
    await openMossEditor(p);const original=await readEditorJson(p),malformed='<svg><path';await editSvg(p,malformed);
    const fresh=structuredClone(mossLayout);fresh.home.users=[{...structuredClone(cctvNode),id:'new-webtv-default',name:'新的默认入口',text:'新的默认入口',action:'com.ecojust.webtv'}];
    await p.evaluate(layout=>window.__setMockLayout(layout),fresh);await p.locator('[data-u-act="refresh"]').click();await result(p,'success');await acknowledge(p);
    assert.equal(await svgInput(p).inputValue(),malformed);assert.deepEqual(await readEditorJson(p),original,'An invalid icon draft alone protects the card identity even before any valid property edit');
    const before=await p.evaluate(()=>window.__launcherRequests.length);await p.locator('[data-u-act="apply"]').click();await settled(p);assert.equal(await p.evaluate(()=>window.__launcherRequests.length),before);assert.equal((await layoutWrites(p)).length,0);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('SVG icon: unsupported drawing features and active content are rejected without changing the last valid artwork',async p=>{
    await openMossEditor(p);await editSvg(p,cctvSvg);
    for(const value of [
      '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=true"><path d="M0 0L24 24"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__xss=true</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><title><script>window.__xss=true</script></title></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/image.png"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="round"><circle r="10"/></clipPath></defs><path d="M0 0L24 24"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><title>'+('x'.repeat(8200))+'</title><path d="M0 0L24 24"/></svg>',
    ]){
      await editSvg(p,value);const message=await p.locator('[data-svg-error]').innerText();assert.match(message,/SVG/);assert.doesNotMatch(message,/屏幕范围|系统组件只读/);assert.equal(await svgInput(p).inputValue(),value);
      assert.equal(await p.locator('[data-u-node="cctv-live"] svg path').count(),4);assert.equal(await p.locator('.unified-canvas script,.unified-canvas image,.unified-canvas [onload]').count(),0);assert.equal(await p.evaluate(()=>window.__xss),false);
    }
    const before=await p.evaluate(()=>window.__launcherRequests.length);await p.locator('[data-u-act="apply"]').click();await settled(p);assert.equal(await p.evaluate(()=>window.__launcherRequests.length),before);assert.equal((await layoutWrites(p)).length,0);
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  const paddedSvg=count=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0L24 24"/><!--'+' '.repeat(count)+'--></svg>';
  const largeSvgLayout=structuredClone(mossLayout),largeSvgState=structuredClone(mossState),largeSvgApps=structuredClone(mossApps);
  for(let index=0;index<12;index++){
    const packageName='com.example.svgfiller'+index,label='SVG filler '+index;
    largeSvgLayout.apps.users.push({...structuredClone(cctvNode),id:'svg-filler-'+index,name:label,text:label,action:packageName,icon:paddedSvg(3000)});
    largeSvgState.packages.push({packageName,label,installed:true,enabled:true,system:false,protectedReason:null});largeSvgApps.push({packageName,label});
  }
  const layoutByteLimit=90*1024,largeSvgTarget=layoutByteLimit-128;
  let svgPadding=largeSvgTarget-Buffer.byteLength(JSON.stringify(largeSvgLayout));assert.ok(svgPadding>0);
  for(const node of largeSvgLayout.apps.users){const count=Math.min(svgPadding,8192-Buffer.byteLength(node.icon));node.icon=node.icon.replace('--></svg>',' '.repeat(count)+'--></svg>');svgPadding-=count;}
  assert.equal(svgPadding,0);assert.equal(Buffer.byteLength(JSON.stringify(largeSvgLayout)),largeSvgTarget);
  await check('SVG icon: a valid small icon cannot silently bypass the total layout size limit',async p=>{
    await openMossEditor(p);const replacement=paddedSvg(7200);assert.ok(Buffer.byteLength(replacement)<8192);
    assert.equal(Buffer.byteLength(JSON.stringify(await readEditorJson(p))),largeSvgTarget,'Initial layout fits the protocol limit');
    await editSvg(p,replacement);assert.match(await p.locator('[data-svg-error]').innerText(),/90 KiB/);assert.equal(await svgInput(p).inputValue(),replacement);
    await p.locator('[data-u-page="apps"]').click();await p.locator('[data-u-page="home"]').click();assert.equal(await svgInput(p).inputValue(),replacement,'Rejected replacement survives navigation');
    const before=await p.evaluate(()=>window.__launcherRequests.length);await p.locator('[data-u-act="apply"]').click();await settled(p);assert.equal(await p.evaluate(()=>window.__launcherRequests.length),before);assert.equal(await p.locator('#confirm-operation').count(),0);assert.equal((await layoutWrites(p)).length,0);
    const unchanged=await readEditorJson(p);assert.equal(unchanged.home.users[0].icon,cctvNode.icon);assert.equal(Buffer.byteLength(JSON.stringify(unchanged)),largeSvgTarget,'Committed layout retains its original valid icon');
    await p.locator('[data-u-act="discard-svg"]').click();assert.equal(await svgInput(p).inputValue(),cctvNode.icon);assert.equal(await p.locator('[data-svg-error]').count(),0);
  },largeSvgState,{layoutSupported:true,layout:largeSvgLayout,layoutApps:largeSvgApps});
  await check('layout switch: visibility keeps a circular thumb in every theme without changing ordinary checkboxes',async p=>{
    await p.addStyleTag({content:'input[role="switch"],input[role="switch"]::after{transition:none!important}'});
    const inspect=locator=>locator.evaluate(el=>{
      const style=getComputedStyle(el),thumb=getComputedStyle(el,'::after'),probe=document.createElement('span');probe.style.backgroundColor='var(--green)';probe.style.color='var(--on-accent)';document.body.append(probe);const colors=getComputedStyle(probe),expectedTrack=colors.backgroundColor,expectedThumb=colors.color;probe.remove();
      return {width:style.width,height:style.height,track:style.backgroundColor,thumb:thumb.backgroundColor,geometry:[thumb.width,thumb.height,thumb.left,thumb.top,thumb.borderLeftWidth,thumb.borderBottomWidth],transform:thumb.transform,expectedTrack,expectedThumb};
    });
    for(const theme of ['emerald','ocean','graphite']){
      await p.locator('[name="theme"]').selectOption(theme);await openMossEditor(p);const visibility=p.getByRole('switch',{name:'显示组件'});assert.equal(await visibility.isChecked(),true);
      let style=await inspect(visibility);assert.equal(style.width,'36px');assert.equal(style.height,'21px');assert.deepEqual(style.geometry,['15px','15px','3px','3px','0px','0px']);assert.equal(style.transform,'matrix(1, 0, 0, 1, 15, 0)');assert.equal(style.track,style.expectedTrack);assert.equal(style.thumb,style.expectedThumb);
      await visibility.click();assert.equal(await visibility.isChecked(),false);style=await inspect(visibility);assert.deepEqual(style.geometry,['15px','15px','3px','3px','0px','0px']);assert.equal(style.transform,'matrix(1, 0, 0, 1, 0, 0)');assert.equal((await readEditorJson(p)).home.users[0].visible,false,'Switch toggles the actual layout property');
      await visibility.click();assert.equal((await readEditorJson(p)).home.users[0].visible,true);
      const ordinary=p.locator('[data-u-field="transparentBackground"]');await ordinary.check();const checkmark=await ordinary.evaluate(el=>{const a=getComputedStyle(el,'::after');return [a.width,a.height,a.borderLeftWidth,a.borderBottomWidth];});assert.deepEqual(checkmark,['8px','4px','2px','2px'],'Ordinary checkbox still has its checkmark');
      const systemId=mossLayout.home.system[0].id;await p.locator('[data-u-selection]').selectOption('system:'+systemId);assert.equal(await visibility.isDisabled(),true);const checked=await visibility.isChecked();await visibility.evaluate(el=>el.click());assert.equal(await visibility.isChecked(),checked);assert.deepEqual((await inspect(visibility)).geometry,['15px','15px','3px','3px','0px','0px']);assert.deepEqual((await readEditorJson(p)).home.system,mossLayout.home.system);
      await p.locator('[data-u-act="close"]').first().click();
    }
  },mossState,{layoutSupported:true,layout:mossLayout,layoutApps:mossApps});
  await check('feedback: applying v5 layout blocks the whole window and returns to the saved editor',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();
    const id=modernLayout.home.users[0].id;
    await p.locator(`[data-u-node="${id}"]`).click();
    await p.locator('[data-u-field="text"]').fill('客厅电视');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await held(p,'applyLayout');
    assert.equal(await feedback(p).evaluate(el=>el.matches(':modal')),true,'Loading uses the browser top layer');
    assert.equal(await p.locator('.layout-modal[open]').count(),1,'The editor stays open below the loading dialog');
    assert.equal(await p.locator('[data-u-act="apply"]').isDisabled(),true);
    await p.keyboard.press('Escape');assert.equal(await feedback(p).getAttribute('data-phase'),'loading','Escape cannot hide an in-flight write');
    for(let i=0;i<4;i++){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('.operation-feedback')),true,'Keyboard focus cannot reach the editor or main window');}
    assert.equal(await feedback(p).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Feedback is visibly above the editor');
    assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(r=>r.action==='applyLayout').length),1);
    await shot(p,'feedback-layout-loading');await release(p,'applyLayout');
    const modal=await result(p,'success');assert.match(await modal.innerText(),/布局/);await shot(p,'feedback-layout-success');
    await acknowledge(p);assert.equal(await p.locator('.layout-modal[open]').count(),1);assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'客厅电视');
    await p.locator('[data-u-act="json"]').click();assert.equal(JSON.parse(await p.locator('.layout-json-viewer pre').innerText()).home.users[0].text,'客厅电视');
  },unifiedState,{layoutSupported:true,layout:modernLayout,layoutApps:unifiedApps,holdActions:['applyLayout']});
  await check('feedback: a failed layout write preserves the draft and a retry can succeed',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator(`[data-u-node="${modernLayout.home.users[0].id}"]`).click();
    await p.locator('[data-u-field="text"]').fill('保留我的修改');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await held(p,'applyLayout');await release(p,'applyLayout',{error:'电视拒绝写入，请重新授权'});
    assert.match(await (await result(p,'error')).innerText(),/电视拒绝写入/);assert.equal(await p.locator('dialog.operation-feedback[data-outcome="success"]').count(),0);
    await acknowledge(p);assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'保留我的修改');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await held(p,'applyLayout');await release(p,'applyLayout');await result(p,'success');await acknowledge(p);
    assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'保留我的修改');assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(r=>r.action==='applyLayout').length),2);
  },unifiedState,{layoutSupported:true,layout:modernLayout,layoutApps:unifiedApps,holdActions:['applyLayout']});
  await check('feedback: an unverified layout response never reports success or discards the edited draft',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator(`[data-u-node="${modernLayout.home.users[0].id}"]`).click();
    await p.locator('[data-u-field="text"]').fill('仍待确认的布局');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await held(p,'applyLayout');
    await release(p,'applyLayout',{response:{supported:false,component:customHome.defaultHome,serial:customHome.device.serial,userId:0,message:'启动器未返回可验证的布局'}});
    await result(p,'error');await acknowledge(p);assert.equal(await p.locator('.layout-modal[open]').count(),1);assert.equal(await p.locator('[data-u-field="text"]').inputValue(),'仍待确认的布局');
  },unifiedState,{layoutSupported:true,layout:modernLayout,layoutApps:unifiedApps,holdActions:['applyLayout']});
  await check('feedback: installing one app shows English loading and success without removing other APKs',async p=>{
    await p.locator('[name="locale"]').selectOption('en');await p.locator('[name="theme"]').selectOption('graphite');await nav(p,'install');await act(p,'add-apks').click();await settled(p);
    await p.locator('.apk-item').first().locator('[data-act="install-one-apk"]').click();await p.locator('#confirm-operation').click();await held(p,'install');
    assert.match(await feedback(p).innerText(),/install/i);assert.doesNotMatch(await feedback(p).innerText(),/[\u3400-\u9fff]/);await shot(p,'feedback-install-loading-en-graphite');
    assert.equal(await act(p,'add-apks').isDisabled(),true);await release(p,'install');
    const modal=await result(p,'success');assert.match(await modal.innerText(),/install/i);assert.doesNotMatch(await modal.innerText(),/[\u3400-\u9fff]/);await shot(p,'feedback-install-success-en-graphite');
    assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/second.apk/);await acknowledge(p);
    await act(p,'go-apps').click();assert.equal(await box(p,'com.imported.app').count(),1);
  },snapshot(),{apkPaths:['/tmp/first.apk','/tmp/second.apk'],holdActions:['install']});
  await check('feedback: mixed installation reports failures and skipped files in English without claiming success',async p=>{
    await p.locator('[name="locale"]').selectOption('en');await nav(p,'install');await act(p,'add-apks').click();await settled(p);await act(p,'install-apks').click();await p.locator('#confirm-operation').click();await held(p,'install');
    const response=snapshot();response.installResults=[{path:'/tmp/done.apk',success:true,message:'电视已确认安装成功，已刷新应用列表'},{path:'/tmp/failed.apk',success:false,message:'电视未确认安装成功：INSTALL_FAILED_UPDATE_INCOMPATIBLE'}];
    response.history=[{id:'mixed-install',timestamp:1,action:'install',target:'/tmp/failed.apk',device:response.device.serial,userId:0,success:false,message:'签名不一致'}];response.message='安装完成：成功 1 项，失败 1 项，未执行 1 项';
    await release(p,'install',{response});const modal=await result(p,'error');assert.match(await modal.innerText(),/failed|incomplete/i);assert.match(await modal.innerText(),/failed.apk/);assert.match(await modal.innerText(),/INSTALL_FAILED_UPDATE_INCOMPATIBLE/);assert.doesNotMatch(await modal.innerText(),/[\u3400-\u9fff]/);
    assert.equal(await p.locator('.apk-item').count(),2);assert.doesNotMatch(await p.locator('.apk-list').innerText(),/done.apk/);assert.match(await p.locator('.apk-list').innerText(),/skipped.apk/);await acknowledge(p);
    assert.equal(await act(p,'install-apks').isEnabled(),true);
  },snapshot(),{apkPaths:['/tmp/done.apk','/tmp/failed.apk','/tmp/skipped.apk'],holdActions:['install']});
  await check('feedback: cancellation keeps skipped APKs and never reports all files installed',async p=>{
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await act(p,'install-apks').click();await p.locator('#confirm-operation').click();await held(p,'install');
    await feedback(p).locator('[data-feedback-cancel]').click();assert.equal(await feedback(p).locator('[data-feedback-cancel]').isDisabled(),true);
    const response=snapshot();response.installResults=[{path:'/tmp/done.apk',success:true,message:'已安装'}];response.message='安装完成：成功 1 项，失败 0 项，未执行 1 项';
    await release(p,'install',{response});await result(p,'info');assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/skipped.apk/);
    assert.equal((await requests(p)).filter(r=>r.action==='cancel').length,1);await acknowledge(p);assert.equal(await act(p,'install-apks').isEnabled(),true);
  },snapshot(),{apkPaths:['/tmp/done.apk','/tmp/skipped.apk'],holdActions:['install']});
  await check('feedback: missing installation results are incomplete even without a local cancel request',async p=>{
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await act(p,'install-apks').click();await p.locator('#confirm-operation').click();await held(p,'install');
    const response=snapshot();response.installResults=[{path:'/tmp/done.apk',success:true,message:'已安装'}];response.message='安装完成：成功 1 项，失败 0 项，未执行 1 项';
    await release(p,'install',{response});await result(p,'info');assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/skipped.apk/);assert.equal((await requests(p)).some(r=>r.action==='cancel'),false);
  },snapshot(),{apkPaths:['/tmp/done.apk','/tmp/skipped.apk'],holdActions:['install']});
  const staleInstallState={...snapshot(),installResults:[{path:'/tmp/retry.apk',success:true,message:'上次安装成功'}]};
  await check('feedback: an install exception cannot consume stale success results from an earlier operation',async p=>{
    await nav(p,'install');await act(p,'add-apks').click();await settled(p);await act(p,'install-one-apk').click();await p.locator('#confirm-operation').click();await held(p,'install');
    await release(p,'install',{error:'安装前检查失败'});assert.match(await (await result(p,'error')).innerText(),/安装前检查失败/);assert.equal(await p.locator('.apk-item').count(),1,'Rejected requests must retain their pending APK');await acknowledge(p);
    await act(p,'install-one-apk').click();await p.locator('#confirm-operation').click();await held(p,'install');await release(p,'install');await result(p,'success');assert.equal(await p.locator('.apk-item').count(),0);
  },staleInstallState,{apkPaths:['/tmp/retry.apk'],holdActions:['install']});
  await check('feedback: launcher install and activation each show progress and a persistent success result',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'add-launcher').click();await settled(p);await act(p,'install-launcher').click();await p.locator('#confirm-operation').click();await held(p,'install');
    assert.match(await feedback(p).innerText(),/启动器/);await release(p,'install');assert.match(await (await result(p,'success')).innerText(),/启动器/);
    await p.waitForFunction(()=>!document.querySelector('.busy-bar'));assert.equal(await feedback(p).getAttribute('data-phase'),'result','Optional layout reads do not cover or dismiss the success result');assert.equal(await p.locator('.pending-launcher').count(),0);await acknowledge(p);
    await p.locator('[data-act="set-home"]:enabled').click();await p.locator('#confirm-operation').click();await held(p,'setHome');await release(p,'setHome');await result(p,'success');
    await p.waitForFunction(()=>!document.querySelector('.busy-bar'));assert.equal(await feedback(p).getAttribute('data-outcome'),'success');assert.match(await p.locator('.launcher-card.current').innerText(),/pureTV/);await acknowledge(p);
    assert.equal(await act(p,'restore-home').isEnabled(),true);
  },snapshot(),{holdActions:['install','setHome']});
  await check('feedback: a rejected launcher switch reports failure and retains the active launcher',async p=>{
    await nav(p,'launchers');await settled(p);await p.locator('[data-act="set-home"]:enabled').click();await p.locator('#confirm-operation').click();await held(p,'setHome');
    await release(p,'setHome',{error:'电视拒绝切换桌面'});assert.match(await (await result(p,'error')).innerText(),/电视拒绝切换/);assert.match(await p.locator('.launcher-card.current').innerText(),/原厂桌面/);await acknowledge(p);await settled(p);
    assert.equal(await p.locator('[data-act="set-home"]:enabled').count(),1);
  },snapshot(),{holdActions:['setHome']});
  await check('feedback: ADB download progress preserves keyboard focus on its cancel control',async p=>{
    await act(p,'download-adb').click();await acceptTools(p);await held(p,'installPlatformTools');
    await feedback(p).locator('[data-feedback-cancel]').focus();
    for(const [stage,downloaded] of [['downloading',12000000],['verifying',16110554],['extracting',16110554]]){
      await p.evaluate(({stage,downloaded})=>window.__emitToolsProgress(stage,downloaded),{stage,downloaded});
      assert.equal(await p.evaluate(()=>document.activeElement.hasAttribute('data-feedback-cancel')),true,'Progress updates retain the focused cancel control');
      assert.equal(await feedback(p).getAttribute('aria-busy'),'true');
    }
    await release(p,'installPlatformTools');await result(p,'success');await acknowledge(p);assert.equal(await act(p,'connect').isEnabled(),true);
  },withoutAdb(),{holdActions:['installPlatformTools']});
  await check('feedback: a user-cancelled scan reports cancellation instead of failure',async p=>{
    await nav(p,'apps');await act(p,'scan').click();await held(p,'scan');await feedback(p).locator('[data-feedback-cancel]').click();await release(p,'scan',{error:'操作已取消'});
    assert.match(await (await result(p,'info')).innerText(),/取消/);await acknowledge(p);assert.equal(await act(p,'scan').isEnabled(),true);
  },snapshot(),{holdActions:['scan']});
  await check('feedback: a concurrent agent event cannot replace a failed local operation result',async p=>{
    await nav(p,'apps');await act(p,'scan').click();await held(p,'scan');await p.evaluate(()=>window.__holdNextStateRead=true);await release(p,'scan',{error:'本次扫描失败'});
    await p.waitForFunction(()=>window.__pendingOperations.some(operation=>operation.action==='getState'));
    const updated=snapshot();updated.revision=2;updated.message='Agent 读取状态完成';
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:value}),updated);await release(p,'getState');
    const modal=await result(p,'error');assert.match(await modal.innerText(),/本次扫描失败/);assert.doesNotMatch(await modal.innerText(),/Agent 读取状态完成/);await acknowledge(p);
  },snapshot(),{holdActions:['scan','getState']});
  await check('feedback: dismissing a result stays closed across immediate renders and cannot clear the next operation',async p=>{
    await nav(p,'apps');await act(p,'scan').click();await held(p,'scan');await release(p,'scan');await result(p,'success');
    const afterClose=await p.evaluate(()=>{
      const dialog=document.querySelector('dialog.operation-feedback');
      dialog.querySelector('[data-feedback-close]').click();
      // A preference/channel update may render before the browser delivers the queued close event.
      window.__emitMcp('interface-preferences',{locale:'en',theme:'graphite'});
      return dialog.open;
    });
    assert.equal(afterClose,false,'A result acknowledged by the user must not reopen during the next render');
    assert.equal(await feedback(p).count(),0);await nav(p,'history');await nav(p,'apps');
    await act(p,'scan').click();await held(p,'scan');await release(p,'scan');await result(p,'success');
    await p.evaluate(()=>{
      document.querySelector('[data-feedback-close]').click();
      document.querySelector('[data-act="scan"]').click();
    });
    await held(p,'scan');
    await p.evaluate(()=>window.__emitMcp('interface-preferences',{locale:'en',theme:'ocean'}));
    assert.equal(await feedback(p).getAttribute('data-phase'),'loading','An old close event must not discard a newly started operation');
    await release(p,'scan');await result(p,'success');
    await p.evaluate(()=>document.querySelector('dialog.operation-feedback').addEventListener('cancel',()=>{
      queueMicrotask(()=>window.__emitMcp('interface-preferences',{locale:'zh-CN',theme:'graphite'}));
    },{once:true}));
    await p.keyboard.press('Escape');assert.equal(await feedback(p).count(),0,'Escape dismissal stays closed across a queued render');
    await nav(p,'history');assert.equal(await feedback(p).count(),0);
  },snapshot(),{holdActions:['scan']});
  await check('feedback: explicit scans show results while navigation and automatic reads stay silent',async p=>{
    await nav(p,'launchers');await settled(p);assert.equal(await feedback(p).count(),0);await nav(p,'apps');await act(p,'scan').click();await held(p,'scan');await release(p,'scan');await result(p,'success');await acknowledge(p);
    await act(p,'scan').click();await held(p,'scan');await release(p,'scan',{error:'扫描失败，请检查电视授权'});assert.match(await (await result(p,'error')).innerText(),/扫描失败/);await acknowledge(p);
    await nav(p,'launchers');await settled(p);assert.equal(await feedback(p).count(),0);
  },snapshot(),{holdActions:['scan']});
  await check('v5 has independent SVG and text colors, transparent systems and compact read-only baseline',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();
    assert.equal(await p.locator('[data-u-screen]').count(),0);assert.equal(await p.locator('.unified-toolbar select').count(),0);
    assert.equal(await p.locator('.layout-inspector [data-u-selection]').count(),1);assert.equal(await p.locator('.unified-editor > .layout-workspace').count(),1);const toolbarBox=await p.locator('.unified-toolbar').boundingBox(),canvasBox=await p.locator('.unified-canvas').boundingBox();assert.ok(canvasBox.y-toolbarBox.y-toolbarBox.height<40,'Canvas follows the compact toolbar without blank space');
    const id=modernLayout.home.users[0].id;await p.locator(`[data-u-node="${id}"]`).click();
    await p.locator('[data-u-field="textColor"]').fill('#112233');await p.locator('[data-u-field="textColor"]').dispatchEvent('change');
    await p.locator('[data-u-field="iconColor"]').fill('#aabbcc');await p.locator('[data-u-field="iconColor"]').dispatchEvent('change');
    const paint=await p.locator(`[data-u-node="${id}"]`).evaluate(el=>[getComputedStyle(el.querySelector('svg')).color,getComputedStyle(el.querySelector('.unified-text')).color]);assert.deepEqual(paint,['rgb(170, 187, 204)','rgb(17, 34, 51)']);
    const visibility=p.getByRole('switch',{name:'显示组件'});assert.equal(await visibility.isChecked(),true);await visibility.click();assert.equal(await visibility.isChecked(),false);await visibility.click();
    assert.equal(await p.locator('.component-visibility-switch').evaluate(el=>!!(el.previousElementSibling?.classList.contains('pill'))),true);

    await p.locator('[data-u-node="clock"]').click();assert.equal(await p.locator('[data-u-node="clock"]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await p.locator('[data-u-field="iconColor"]').isDisabled(),true);
    await shot(p,'layout-v5-properties-036');
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));assert.equal(applied.layout.version,5);
  },unifiedState,{layoutSupported:true,layout:modernLayout,layoutApps:unifiedApps});
  const novaLayout=JSON.parse(await readFile(new URL('../../resource/launcher/nova/layout.example.json',import.meta.url),'utf8'));
  const novaComponent='com.ecojust.novatv/.MainActivity';
  const novaState=structuredClone(unifiedState);novaState.defaultHome=novaComponent;
  novaState.launchers.forEach(l=>l.isDefault=false);
  novaState.launchers.push({packageName:'com.ecojust.novatv',component:novaComponent,label:'Nova TV',isDefault:true});
  novaState.packages.push({packageName:'com.ecojust.novatv',label:'Nova TV',installed:true,enabled:true,system:false,protectedReason:'当前默认启动器'});
  const novaApps=[...new Map([...novaLayout.home.users,...novaLayout.apps.users].map(node=>[node.action,{packageName:node.action,label:node.name}])).values()];
  for(const app of novaApps)if(!novaState.packages.some(p=>p.packageName===app.packageName))novaState.packages.push({...app,installed:true,enabled:true,system:false,protectedReason:null});
  const novaFirst=novaLayout.home.users[0],novaClock=novaLayout.home.system.find(n=>n.id==='statusClock');
  await check('Nova v5 keeps its background and geometry and applies user edits to the current Nova desktop',async p=>{
    await nav(p,'launchers');await settled(p);
    const card=p.locator(`[data-launcher-component="${novaComponent}"]`);
    assert.equal(await card.locator('.launcher-card-background').getAttribute('src'),novaLayout.home.background.image);
    await card.locator('[data-act="open-layout"]').click();await p.locator('[data-unified-editor]').waitFor();
    const canvas=p.locator('.unified-canvas');
    assert.ok((await canvas.evaluate(el=>getComputedStyle(el).backgroundImage)).includes(novaLayout.home.background.image));
    assert.deepEqual(await canvas.evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundSize,s.backgroundRepeat]}),['cover','no-repeat']);
    assert.equal(novaLayout.home.users.length,6,'The shipped example shows six app tiles');
    assert.equal(await p.locator('[data-u-kind="users"]').count(),6);
    for(const node of [novaClock,...novaLayout.home.users]){
      const rect=await canvas.boundingBox(),box=await p.locator(`[data-u-node="${node.id}"]`).boundingBox();
      assert.ok(Math.abs((box.x-rect.x)/rect.width-node.frame.x/novaLayout.screen.width)<.005,'Nova x matches layout JSON');
      assert.ok(Math.abs((box.y-rect.y)/rect.height-node.frame.y/novaLayout.screen.height)<.005,'Nova y matches layout JSON');
      assert.ok(Math.abs(box.width/rect.width-node.frame.width/novaLayout.screen.width)<.005,'Nova width matches layout JSON');
    }
    await p.locator('[data-u-node="statusClock"]').click();assert.equal(await p.locator('[data-u-field="name"]').isDisabled(),true);
    assert.equal(await p.locator('[data-u-field="text"]').inputValue(),novaClock.text);
    assert.equal(await p.locator('[data-u-node="statusClock"]').evaluate(el=>el.style.getPropertyValue('--u-font')),'13','Status time uses the v5 generic system label size');
    assert.equal(await p.locator('[data-u-node="statusClock"] .unified-icon').count(),0,'Empty SVG adds no phantom status icon');
    await p.locator(`[data-u-node="${novaFirst.id}"]`).click();
    await shot(p,'nova-layout-home-011');
    // A committed edit removes a still-focused dirty input; its native blur must not re-enter DOM replacement.
    await p.locator('[data-u-field="text"]').fill('我的音乐');await p.locator('[data-u-field="text"]').dispatchEvent('change');
    assert.equal(await p.locator('.layout-modal .banner.error').count(),0,'Focused text edits must render without a caught error');
    await p.locator('[data-u-frame="x"]').fill('72');await p.locator('[data-u-frame="x"]').dispatchEvent('change');
    assert.equal(await p.locator('.layout-modal .banner.error').count(),0,'Nova edits must not show a caught render error');
    await shot(p,'nova-layout-home-edited-011');
    await p.locator('[data-u-page="apps"]').click();
    if(novaLayout.apps.background.image)assert.ok((await canvas.evaluate(el=>getComputedStyle(el).backgroundImage)).includes(novaLayout.apps.background.image));
    else assert.equal(await canvas.evaluate(el=>getComputedStyle(el).backgroundImage),'none');
    assert.equal(await p.locator('.layout-modal .banner.error').count(),0,'Switching Nova pages must keep the editor error-free');
    await shot(p,'nova-layout-apps-011');
    await p.locator('[data-u-act="apply"]').click();
    assert.match(await p.locator('#confirm-operation').locator('..').locator('..').innerText(),/com\.ecojust\.novatv/);
    await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));await settled(p);
    const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));
    assert.equal(applied.layout.version,5);assert.equal(applied.layout.home.users[0].text,'我的音乐');assert.equal(applied.layout.home.users[0].frame.x,72);
    assert.equal(applied.layout.home.users[0].action,novaFirst.action);
    assert.deepEqual(applied.layout.home.system,novaLayout.home.system);assert.deepEqual(applied.layout.apps.system,novaLayout.apps.system);
    assert.deepEqual(applied.layout.home.background,novaLayout.home.background);assert.deepEqual(applied.layout.apps.background,novaLayout.apps.background);
  },novaState,{layoutSupported:true,layout:novaLayout,layoutApps:novaApps});
  for(const name of ['aster','sol','moss','forma','mono','drift','circuit','pixel']){
    const layout=JSON.parse(await readFile(new URL(`../../resource/launcher/${name}/layout.example.json`,import.meta.url),'utf8'));
    const template=JSON.parse(await readFile(new URL(`../../resource/launcher/${name}/app/src/main/assets/layout.json`,import.meta.url),'utf8'));
    for(const section of ['home','apps'])for(const field of ['system','background','navigation'])assert.deepEqual(layout[section][field],template[section][field],`${name} example preserves shipped ${section}.${field}`);
    const packageName=`com.ecojust.${name}tv`,component=`${packageName}/.MainActivity`,state=snapshot();
    state.defaultHome=component;state.launchers.forEach(launcher=>launcher.isDefault=false);
    state.launchers.push({packageName,component,label:name.toUpperCase()+' TV',isDefault:true});
    const apps=[...new Map([...layout.home.users,...layout.apps.users].map(node=>[node.action,{packageName:node.action,label:node.name}])).values()];
    for(const app of [{packageName,label:name.toUpperCase()+' TV'},...apps])if(!state.packages.some(p=>p.packageName===app.packageName))state.packages.push({...app,installed:true,enabled:true,system:false,protectedReason:null});
    await check(`${name} v5 collection layout renders both pages and preserves system components on apply`,async p=>{
      await nav(p,'launchers');await settled(p);
      const card=p.locator(`[data-launcher-component="${component}"]`);
      await card.locator('[data-act="open-layout"]').click();await p.locator('[data-unified-editor]').waitFor();
      const canvas=p.locator('.unified-canvas');
      const rgb=hex=>hex==='transparent'?'rgba(0, 0, 0, 0)':`rgb(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')})`;
      for(const section of ['home','apps']){
        await p.locator(`[data-u-page="${section}"]`).click();
        assert.equal(await p.locator('.layout-modal .banner.error').count(),0,`${name} ${section} has no caught UI error`);
        assert.equal(await p.locator('[data-u-kind="users"]').count(),6,`${name} shows its six example installed apps`);
        const background=await canvas.evaluate(el=>{const style=getComputedStyle(el);return {image:style.backgroundImage,color:style.backgroundColor,size:style.backgroundSize,repeat:style.backgroundRepeat}});
        assert.equal(background.color,rgb(layout[section].background.color));assert.equal(background.size,'cover');assert.equal(background.repeat,'no-repeat');
        if(layout[section].background.image)assert.ok(background.image.includes(layout[section].background.image));else assert.equal(background.image,'none');
        const rect=await canvas.boundingBox();
        for(const kind of ['system','users'])for(const node of layout[section][kind]){
          const element=p.locator(`[data-u-kind="${kind}"][data-u-node="${node.id}"]`),box=await element.boundingBox();
          assert.ok(box,`${name} ${section}.${node.id} is represented in the editor`);
          for(const [actual,expected] of [[(box.x-rect.x)/rect.width,node.frame.x/layout.screen.width],[(box.y-rect.y)/rect.height,node.frame.y/layout.screen.height],[box.width/rect.width,node.frame.width/layout.screen.width],[box.height/rect.height,node.frame.height/layout.screen.height]])assert.ok(Math.abs(actual-expected)<.005,`${name} ${section}.${node.id} geometry follows JSON: ${actual} vs ${expected}`);
          assert.equal(await element.evaluate(el=>el.classList.contains('scene-hidden')),!node.visible);
          const paint=await element.evaluate(el=>({text:getComputedStyle(el.querySelector('.unified-text')).color,icon:el.style.getPropertyValue('--u-icon-color'),background:el.style.getPropertyValue('--u-bg')}));
          assert.deepEqual(paint,{text:rgb(node.textColor),icon:node.iconColor,background:node.backgroundColor});
        }
        await shot(p,`${name}-layout-${section}`);
      }
      await p.locator('[data-u-page="home"]').click();
      if(name==='aster'){
        await p.setViewportSize({width:1024,height:800});
        const tiny=layout.home.system.find(n=>n.id==='date'),rect=await canvas.boundingBox(),box=await p.locator('[data-u-node="date"]').boundingBox();
        assert.ok(box.height<38,'Small system nodes must not inherit normal button minimum height');
        assert.ok(Math.abs(box.height-rect.height*tiny.frame.height/layout.screen.height)<1,'Small canvas preserves exact system height');
        assert.ok(Math.abs(box.width-rect.width*tiny.frame.width/layout.screen.width)<1,'Small canvas preserves exact system width');
        await shot(p,'aster-layout-home-compact');
        await p.setViewportSize({width:1440,height:1000});
      }
      const first=layout.home.users[0],system=layout.home.system[0];
      await p.locator('[data-u-selection]').selectOption(`system:${system.id}`);
      assert.equal(await p.locator('[data-u-field="name"]').isDisabled(),true);assert.equal(await p.locator('[data-u-frame="x"]').isDisabled(),true);
      await p.locator(`[data-u-node="${first.id}"][data-u-kind="users"]`).click();
      const changedText=first.text+' · 自定义';await p.locator('[data-u-field="text"]').fill(changedText);await p.locator('[data-u-field="text"]').dispatchEvent('change');
      assert.equal(await p.locator('.layout-modal .banner.error').count(),0,'Editing an installed app must not report a caught render error');
      await p.locator('[data-u-act="apply"]').click();assert.ok((await p.locator('#confirm-operation').locator('..').locator('..').innerText()).includes(component));
      await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));await settled(p);
      const applied=await p.evaluate(()=>window.__launcherRequests.find(r=>r.action==='applyLayout'));
      const expected=structuredClone(layout);expected.home.users[0].text=changedText;assert.deepEqual(applied.layout,expected,`${name} applies only the intended user edit`);
      assert.equal(await p.locator('.layout-modal .banner.error').count(),0);
    },state,{layoutSupported:true,layout,layoutApps:apps});
  }
  const homeCover='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=';
  const updatedHomeCover='data:image/png;base64,'+Buffer.concat([Buffer.from(homeCover.split(',')[1],'base64'),Buffer.from([0])]).toString('base64');
  const coverLayout=structuredClone(unifiedLayout);coverLayout.home.background.image=homeCover;
  const pureComponent='com.ecojust.puretv/.MainActivity';
  const cardFor=(p,component=pureComponent)=>p.locator(`[data-launcher-component="${component}"]`);
  const backgroundResult=(state,colors,images={})=>({supported:true,serial:state.device.serial,userId:state.device.userId,backgroundColors:colors,backgrounds:images});
  await check('launcher cards read every Home and ignore old local covers without any cover controls or writes',async p=>{
    await nav(p,'launchers');await settled(p);
    assert.equal(await cardFor(p).locator('.launcher-card-background').getAttribute('src'),homeCover);
    assert.equal(await cardFor(p,'com.vendor.home/.Main').locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(34, 51, 68)');
    assert.equal(await p.locator('[data-act="launcher-cover"], [data-act="remove-launcher-cover"]').count(),0);
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds']);
    assert.deepEqual(await requests(p),[],'Reading cards must not activate a launcher or write to the TV');
    await shot(p,'launcher-home-background-039');
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps,covers:{[pureComponent]:updatedHomeCover},homeBackgroundColors:{'com.vendor.home/.Main':'#223344'}});
  await check('Home image removal and reset update cards; only editor apply and reset write layouts',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();
    await p.locator('[data-u-act="background"]').click();await p.locator('[data-u-bg-act="remove"]').click();
    await p.locator('[data-u-bg-color]').fill('#334455');await p.locator('[data-u-bg-color]').dispatchEvent('change');await p.locator('[data-u-bg-act="close"]').click();
    assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover,'Unsaved editor changes do not affect cards');
    assert.equal(await p.evaluate(()=>window.__launcherRequests.filter(r=>['applyLayout','resetLayout'].includes(r.action)).length),0);
    await p.locator('[data-u-act="apply"]').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='applyLayout'));await settled(p);
    assert.equal(await cardFor(p).locator('img.launcher-card-background').count(),0,'Pure color clears the old image and never revives a saved local cover');
    assert.equal(await cardFor(p).locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(51, 68, 85)');
    await p.locator('[data-u-act="reset"]').click();await p.locator('#confirm-operation').click();await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='resetLayout'));await settled(p);
    assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover);
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds','getLayout','applyLayout','getBackgrounds','resetLayout','getBackgrounds'],'Apply rechecks the current layout and apps before its single write; reset performs its own single write');
    assert.equal(await p.locator('.banner.error').count(),0);
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps,covers:{[pureComponent]:updatedHomeCover}});
  await check('list entry and scan refresh inactive Home backgrounds without activating the desktop',async p=>{
    await nav(p,'launchers');await settled(p);assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover);
    await nav(p,'apps');await p.evaluate(component=>{window.__homeBackgroundColors[component]='#445566';delete window.__homeBackgrounds[component];},pureComponent);
    await nav(p,'launchers');await settled(p);assert.equal(await cardFor(p).locator('img.launcher-card-background').count(),0);
    assert.equal(await cardFor(p).locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(68, 85, 102)');
    await p.evaluate(({component,image})=>{window.__homeBackgrounds[component]=image;}, {component:pureComponent,image:updatedHomeCover});
    await act(p,'scan').click();await settled(p);assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),updatedHomeCover);
    assert.deepEqual(await requests(p),[{action:'scan'}]);
    assert.equal(await cardFor(p).locator('[data-act="open-layout"]').count(),0);
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds','getLayout','getBackgrounds','getLayout','getBackgrounds']);
  },snapshot(),{homeBackgrounds:{[pureComponent]:homeCover},homeBackgroundColors:{[pureComponent]:'#112233'},covers:{[pureComponent]:updatedHomeCover}});
  await check('a HOME switched on the television reconciles the snapshot before rendering its layout',async p=>{
    await nav(p,'launchers');await settled(p);await nav(p,'apps');
    const changed=structuredClone(unifiedState);changed.revision=1;changed.defaultHome='com.vendor.home/.Main';changed.launchers.forEach(l=>l.isDefault=l.component===changed.defaultHome);
    await p.evaluate(value=>window.__setMockState(value),changed);
    await nav(p,'launchers');await settled(p);
    assert.equal(await cardFor(p,'com.vendor.home/.Main').locator('[data-act="open-layout"]').count(),1);
    assert.equal(await cardFor(p).locator('[data-act="open-layout"]').count(),0);
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds','getLayout','getBackgrounds']);
    assert.deepEqual(await requests(p),[],'Recognizing a TV-side switch does not change HOME again');
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps});
  await check('MCP layout changes refresh cards once and background results never create a read loop',async p=>{
    await nav(p,'launchers');await settled(p);
    const changed=structuredClone(coverLayout);changed.home.background={color:'#556677'};
    const result={supported:true,serial:unifiedState.device.serial,userId:unifiedState.device.userId,component:pureComponent,layout:changed,apps:unifiedApps};
    await p.evaluate(value=>{window.__setMockLayout(value.layout);window.__emitMcp('mcp-operation',{running:false,tool:'apply_launcher_layout',launcherResult:value});},result);await settled(p);
    assert.equal(await cardFor(p).locator('img.launcher-card-background').count(),0);
    assert.equal(await cardFor(p).locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(85, 102, 119)');
    const before=await p.evaluate(()=>window.__launcherRequests.length);
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_backgrounds',launcherResult:value}),backgroundResult(unifiedState,{[pureComponent]:'#667788'}));
    await p.waitForTimeout(220);
    assert.equal(await p.evaluate(()=>window.__launcherRequests.length),before,'Completed background read is terminal');
    assert.equal(await cardFor(p).locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(102, 119, 136)');
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds','getBackgrounds']);
    assert.equal(await p.locator('.banner.error').count(),0);
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps,covers:{[pureComponent]:updatedHomeCover}});
  await check('temporary provider failure preserves confirmed Home but invalid or unsupported layouts clear cached previews',async p=>{
    await nav(p,'launchers');await settled(p);
    assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover,'Secondary read failure cannot erase the just-confirmed active Home');
    const failed={...backgroundResult(unifiedState,{}),failedComponents:[pureComponent]};
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_backgrounds',launcherResult:value}),failed);
    assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover);
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_backgrounds',launcherResult:value}),backgroundResult(unifiedState,{}));
    assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),updatedHomeCover,'A confirmed unsupported layout can use its old independent cover fallback');
    assert.deepEqual(await p.evaluate(()=>window.__launcherRequests.map(r=>r.action)),['getLayout','getBackgrounds']);
  },unifiedState,{layoutSupported:true,layout:coverLayout,layoutApps:unifiedApps,covers:{[pureComponent]:updatedHomeCover},failedBackgroundComponents:[pureComponent]});
  await check('background responses are scoped to the device and Android user during in-flight reads',async p=>{
    await nav(p,'launchers');await p.waitForFunction(()=>window.__launcherRequests.some(r=>r.action==='getBackgrounds'));
    const next=structuredClone(snapshot());next.revision=1;next.device.userId=10;
    await p.evaluate(value=>{window.__setMockState(value);window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:value});},next);
    await settled(p);assert.equal(await cardFor(p).locator('.launcher-card-background').count(),0,'Old user response cannot populate the new user card');
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_backgrounds',launcherResult:value}),backgroundResult(snapshot(),{[pureComponent]:'#112233'},{[pureComponent]:homeCover}));
    assert.equal(await cardFor(p).locator('.launcher-card-background').count(),0,'MCP results for another user are ignored');
    await nav(p,'apps');await nav(p,'launchers');await settled(p);assert.equal(await cardFor(p).locator('img.launcher-card-background').getAttribute('src'),homeCover);
    const other=structuredClone(next);other.revision=2;other.device.serial='192.168.1.99:5555';
    await p.evaluate(value=>{window.__setMockState(value);window.__emitMcp('mcp-operation',{running:false,tool:'get_state',snapshot:value});},other);
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_launcher_backgrounds',launcherResult:value}),backgroundResult(next,{[pureComponent]:'#112233'},{[pureComponent]:homeCover}));
    assert.equal(await cardFor(p).locator('.launcher-card-background').count(),0,'MCP results for another television are ignored');
    assert.equal(await p.locator('.banner.error').count(),0);
  },snapshot(),{backgroundDelay:350,homeBackgrounds:{[pureComponent]:homeCover},homeBackgroundColors:{[pureComponent]:'#112233'}});
  await check('pending APK cards use embedded Home image or color before sidecar fallback',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'add-launcher').click();await settled(p);
    const pending=path=>p.locator(`[data-launcher-apk="${path}"]`);
    assert.equal(await pending('/tmp/with-image.apk').locator('img.launcher-card-background').getAttribute('src'),homeCover);
    assert.equal(await pending('/tmp/color-only.apk').locator('img.launcher-card-background').count(),0);
    assert.equal(await pending('/tmp/color-only.apk').locator('.launcher-card-background').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(51, 68, 85)');
    assert.equal(await pending('/tmp/legacy.apk').locator('img.launcher-card-background').getAttribute('src'),updatedHomeCover);
    assert.deepEqual(await requests(p),[],'Import previews do not modify any television layout');
  },snapshot(),{launcherApks:[{path:'/tmp/with-image.apk',homeBackgroundColor:'#223344',homeBackground:homeCover,cover:updatedHomeCover},{path:'/tmp/color-only.apk',homeBackgroundColor:'#334455',cover:updatedHomeCover},{path:'/tmp/legacy.apk',cover:updatedHomeCover}]});
  const protocolExample=JSON.parse(await readFile(new URL('../../resource/launcher/puretv/layout.example.json',import.meta.url),'utf8'));
  await check('documented v5 file and Home/Apps previews use identical configuration',async p=>{
    await nav(p,'launchers');await settled(p);await act(p,'open-layout').click();await p.locator('[data-unified-editor]').waitFor();await shot(p,'layout-v5-home-036');await p.locator('[data-u-page="apps"]').click();await shot(p,'layout-v5-apps-036');await p.locator('[data-u-act="json"]').click();assert.deepEqual(JSON.parse(await p.locator('.layout-json-viewer pre').innerText()),protocolExample);
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

  const store=marketCatalog();
  const marketCard=(p,item)=>p.locator('.market-card').filter({has:p.locator(`[data-act="download-market"][data-id="${item.id}"]`)});
  const openMarket=async p=>{await nav(p,'market');await p.locator('.market-card').first().waitFor();await settled(p);};
  const marketRequests=p=>p.evaluate(()=>window.__marketRequests);
  const versionedItem=version=>({...store.items[0],id:`apps/hifini/hifini-${version}.apk`,version,fileName:`hifini-${version}.apk`,bytes:Number(version.split('.')[1])*1048576,blobSha:version.replaceAll('.','').padStart(40,'0'),coverUrl:`https://gitee.com/juzisang331/pure-tv-store/raw/${store.revision}/apps/hifini/hifini-${version}.thumb.png`});
  const versionedStore={...store,items:[...['0.8.0','0.2.0','0.10.0','0.6.0','0.9.0','0.5.0','0.7.0'].map(versionedItem),store.items[1],store.items[2]]};
  const topVersions=['0.10.0','0.9.0','0.8.0','0.7.0','0.6.0'].map(versionedItem);
  const versionSelect=(p,item)=>marketCard(p,item).locator('select[data-market-version]');
  const mockVersionCovers=p=>p.route('https://gitee.com/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=','base64')}));
  const sameNameOtherFolder={...versionedItem('0.10.0'),id:'apps/another/hifini-0.10.0.apk',folderUrl:store.items[0].folderUrl.replace('/hifini','/another')};
  const sameFolderOtherApp={...versionedItem('0.10.0'),id:'apps/hifini/hifini-lite-0.10.0.apk',fileName:'hifini-lite-0.10.0.apk'};
  const sameNameLauncher={...versionedItem('0.99.0'),kind:'launcher',id:'launcher/hifini/hifini-0.99.0.apk',folderUrl:store.items[0].folderUrl.replace('/apps/','/launcher/')};
  await check('market versions group each app separately and offer the latest five in numeric order',async p=>{
    await mockVersionCovers(p);await openMarket(p);
    assert.equal(await p.locator('.market-card').count(),4,'Multiple APK versions share one application card');
    assert.match(await p.locator('#market-count').innerText(),/4\s*\/\s*4/);
    assert.equal(await p.locator('[data-market-kind="app"] span').innerText(),'4','Category counts represent applications rather than APK files');
    const select=versionSelect(p,topVersions[0]);
    assert.deepEqual(await select.locator('option').evaluateAll(options=>options.map(option=>option.value)),topVersions.map(item=>item.id));
    assert.equal(await select.inputValue(),topVersions[0].id,'0.10.0 is newer than 0.9.0');
    assert.equal(await marketCard(p,sameNameOtherFolder).count(),1,'Equal display names in different application folders remain separate');
    assert.equal(await marketCard(p,sameFolderOtherApp).count(),1,'Different filename bases in one folder remain separate applications');
    assert.equal(await versionSelect(p,store.items[1]).locator('option').count(),1,'A single-version app keeps a usable version selector');
    await p.locator('[data-market-kind="launcher"]').click();
    assert.equal(await p.locator('.market-card').count(),2);assert.equal(await marketCard(p,sameNameLauncher).count(),1,'Apps and launchers never share a version group');
    assert.deepEqual(await requests(p),[],'Version grouping never invokes ADB');
    await shot(p,'market-versions-grouped');
  },withoutAdb(),{marketCatalog:{...versionedStore,items:[...versionedStore.items,sameNameOtherFolder,sameFolderOtherApp,sameNameLauncher]}});
  await check('market versions switch metadata and download the selected APK while preserving the choice',async p=>{
    await mockVersionCovers(p);await openMarket(p);const selected=topVersions[2],latest=topVersions[0];
    await versionSelect(p,latest).selectOption(selected.id);
    let card=marketCard(p,selected);
    assert.equal(await card.getAttribute('data-market-id'),selected.id);
    assert.equal(await card.locator('.market-file').innerText(),selected.fileName);
    assert.match(await card.locator('.market-meta').innerText(),/8\.0 MB/);
    assert.equal(await card.locator('.market-cover img').getAttribute('src'),selected.coverUrl);
    assert.equal(await card.locator('[data-act="install-market"]').getAttribute('data-id'),selected.id);
    await p.locator('[name="marketSearch"]').fill('hifini');assert.equal(await versionSelect(p,selected).inputValue(),selected.id);
    await p.locator('[name="marketSearch"]').fill('');await nav(p,'apps');await nav(p,'market');
    assert.equal(await versionSelect(p,selected).inputValue(),selected.id);
    await p.locator('[name="locale"]').selectOption('en');assert.equal(await versionSelect(p,selected).inputValue(),selected.id);
    await marketCard(p,selected).locator('[data-act="download-market"]').click();await held(p,'downloadMarketItem');
    assert.equal(await versionSelect(p,selected).isDisabled(),true,'A pending download locks version selection');
    await release(p,'downloadMarketItem');await result(p,'success');await acknowledge(p);
    assert.deepEqual((await marketRequests(p)).filter(value=>value.command==='download_market_item'),[{command:'download_market_item',id:selected.id,revision:versionedStore.revision}]);
    assert.equal(await marketCard(p,selected).locator('.market-downloaded').count(),1);
    await versionSelect(p,selected).selectOption(latest.id);assert.equal(await marketCard(p,latest).locator('.market-downloaded').count(),0,'Downloading an older version does not mark the latest APK as downloaded');
    await versionSelect(p,latest).selectOption(selected.id);assert.equal(await marketCard(p,selected).locator('.market-downloaded').count(),1);
    await p.locator('[data-act="market-pending"][data-kind="app"]').click();assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/hifini-0\.8\.0\.apk/);
  },withoutAdb(),{marketCatalog:versionedStore,holdActions:['downloadMarketItem']});
  await check('market versions install the chosen older version after confirming its exact filename',async p=>{
    await mockVersionCovers(p);await openMarket(p);const selected=topVersions[1];
    await versionSelect(p,topVersions[0]).selectOption(selected.id);await marketCard(p,selected).locator('[data-act="install-market"]').click();
    assert.match(await p.locator('dialog[open]').innerText(),/hifini-0\.9\.0\.apk/);
    await p.locator('#confirm-operation').click();await held(p,'installMarketItem');
    assert.equal(await versionSelect(p,selected).isDisabled(),true);await release(p,'installMarketItem');
    await result(p,'success');await acknowledge(p);
    assert.deepEqual((await marketRequests(p)).filter(value=>value.command==='install_market_item'),[{command:'install_market_item',id:selected.id,revision:versionedStore.revision}]);
    assert.equal(await versionSelect(p,selected).inputValue(),selected.id);
    assert.equal(await versionSelect(p,selected).isEnabled(),true);
    await nav(p,'apps');assert.match(await p.locator('.apps-table').innerText(),/HIFINi TV/);
  },snapshot(),{marketCatalog:versionedStore,holdActions:['installMarketItem']});
  await check('market versions refresh preserves an available selection and falls back when it leaves the latest five',async p=>{
    await mockVersionCovers(p);await openMarket(p);const selected=topVersions[4];
    await versionSelect(p,topVersions[0]).selectOption(selected.id);
    const refresh=async catalog=>{await p.evaluate(value=>{window.__marketCatalog=value;},catalog);await act(p,'refresh-market').click();await result(p,'success');await acknowledge(p);};
    await refresh({...versionedStore,revision:'e'.repeat(40)});
    assert.equal(await versionSelect(p,selected).inputValue(),selected.id,'A valid manual selection survives a catalog refresh');
    const latest=versionedItem('0.11.0'),updated={...versionedStore,revision:'f'.repeat(40),items:[latest,...versionedStore.items]};
    await refresh(updated);
    assert.equal(await versionSelect(p,latest).inputValue(),latest.id,'A selected version outside the latest five falls back to the newest');
    assert.equal(await versionSelect(p,latest).locator(`option[value="${selected.id}"]`).count(),0);
    const removed=topVersions[1];await versionSelect(p,latest).selectOption(removed.id);
    await refresh({...updated,revision:'d'.repeat(40),items:updated.items.filter(item=>item.id!==removed.id)});
    assert.equal(await versionSelect(p,latest).inputValue(),latest.id,'A removed APK cannot remain selected');
    await marketCard(p,latest).locator('[data-act="download-market"]').click();await result(p,'success');await acknowledge(p);
    assert.deepEqual((await marketRequests(p)).filter(value=>value.command==='download_market_item'),[{command:'download_market_item',id:latest.id,revision:'d'.repeat(40)}],'Fallback uses the refreshed revision and latest APK identifier');
  },withoutAdb(),{marketCatalog:versionedStore});
  const unsafeMarket=marketCatalog();unsafeMarket.items[0].name='<img src=x onerror="window.__xss=true">';
  await check('market discovers categorized APKs without ADB and escapes repository metadata',async p=>{
    await openMarket(p);
    const navigation=await p.locator('nav [data-page]').evaluateAll(elements=>elements.map(element=>element.dataset.page));
    assert.equal(navigation[navigation.indexOf('launchers')+1],'market','Market immediately follows Launchers');
    assert.equal(await p.locator('.market-card').count(),2);
    assert.equal(await marketCard(p,store.items[0]).locator('img[src="x"]').count(),0);
    assert.match(await marketCard(p,store.items[0]).innerText(),/onerror/);
    assert.equal(await p.evaluate(()=>window.__xss),false);
    assert.match(await marketCard(p,store.items[0]).innerText(),/193\.1 KB/);
    assert.match(await marketCard(p,store.items[1]).innerText(),/2\.0 MB/);
    assert.equal(await act(p,'download-market').isEnabled(),true);
    assert.equal(await act(p,'install-market').isDisabled(),true);
    await p.locator('[name="marketSearch"]').fill('WEB');
    assert.equal(await p.locator('.market-card').count(),1);
    assert.match(await p.locator('.market-card').innerText(),/WebTV/);
    assert.equal(await p.locator('[name="marketSearch"]').evaluate(element=>element===document.activeElement),true,'Filtering preserves typing focus');
    await p.locator('[name="marketSearch"]').fill('');
    await p.locator('[data-market-kind="launcher"]').click();
    assert.equal(await p.locator('.market-card').count(),1);assert.match(await p.locator('.market-card').innerText(),/Nova TV/);
    assert.deepEqual(await requests(p),[],'Browsing does not invoke ADB');
    assert.equal((await marketRequests(p)).filter(value=>value.command==='get_market_catalog').length,1,'Changing tabs reuses the catalog');
  },withoutAdb(),{marketCatalog:unsafeMarket});
  await check('market offline download uses displayed revision and joins the pending app list once',async p=>{
    await openMarket(p);await marketCard(p,store.items[0]).locator('[data-act="download-market"]').click();await held(p,'downloadMarketItem');
    assert.doesNotMatch(await feedback(p).innerText(),/ADB/,'APK progress is independent from ADB setup');
    assert.equal(await act(p,'refresh-market').isDisabled(),true);
    await release(p,'downloadMarketItem');await result(p,'success');await acknowledge(p);
    const download=(await marketRequests(p)).find(value=>value.command==='download_market_item');
    assert.deepEqual(download,{command:'download_market_item',id:store.items[0].id,revision:store.revision});
    await p.locator('[data-act="market-pending"][data-kind="app"]').click();
    assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/hifini-0\.1\.3\.apk/);
    await nav(p,'market');await act(p,'download-market').click();await held(p,'downloadMarketItem');await release(p,'downloadMarketItem');await result(p,'success');await acknowledge(p);
    await p.locator('[data-act="market-pending"][data-kind="app"]').click();assert.equal(await p.locator('.apk-item').count(),1,'Repeated downloads do not duplicate a pending path');
    assert.deepEqual(await requests(p),[],'Offline download never starts ADB');
  },withoutAdb(),{holdActions:['downloadMarketItem']});
  await check('market launcher download carries APK Home background into the launcher queue',async p=>{
    await openMarket(p);await p.locator('[data-market-kind="launcher"]').click();await act(p,'download-market').click();await result(p,'success');await acknowledge(p);
    await p.locator('[data-act="market-pending"][data-kind="launcher"]').click();
    const pending=p.locator('[data-launcher-apk="/tmp/puretv-market/nova-0.1.1.apk"]');await pending.waitFor();
    assert.equal(await pending.locator('.launcher-card-background').evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(34, 51, 68)');
    assert.deepEqual(await requests(p),[],'Downloading a launcher never changes the default Home');
  },withoutAdb());
  await check('market installation reports completion and does not activate a downloaded launcher',async p=>{
    await openMarket(p);await p.locator('[data-market-kind="launcher"]').click();await act(p,'install-market').click();
    await p.locator('#confirm-operation').click();await held(p,'installMarketItem');
    await release(p,'installMarketItem');await result(p,'success');await acknowledge(p);
    const install=(await marketRequests(p)).find(value=>value.command==='install_market_item');assert.equal(install.id,store.items[2].id);assert.equal(install.revision,store.revision);
    await nav(p,'launchers');await settled(p);
    assert.match(await p.locator('.launcher-card.current').innerText(),/原厂桌面/);
    assert.equal(await p.locator('[data-launcher-apk]').count(),0,'A verified successful install is removed from pending');
    assert.match(await p.locator('.launcher-grid').innerText(),/Nova TV/);
    assert.equal((await requests(p)).some(value=>value.action==='setHome'),false,'Installing does not silently select the launcher');
  },snapshot(),{holdActions:['installMarketItem']});
  const signatureFailure='安装失败：应用签名不一致，无法覆盖安装。请在电视系统设置中卸载旧版并删除数据后重装；这会清除存档和本地数据。如需保留数据，请先备份或使用原签名版本。原始错误：INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package com.ecojust.tanktv signatures do not match previously installed version; ignoring!';
  for (const [language, expected, uncertainText] of [
    ['zh-CN', /请在电视系统设置中卸载旧版并删除数据后重装/, /操作可能已生效/],
    ['zh-TW', /請在電視系統設定中解除安裝舊版並刪除資料後重新安裝/, /操作可能已生效/],
    ['en', /Uninstall the old app and delete its data in the TV system settings/, /change may have taken effect/],
  ]) await check('market installation failure explains signature migration and keeps the APK '+language,async p=>{
    await p.locator('[name="locale"]').selectOption(language);
    await openMarket(p);await act(p,'install-market').click();await p.locator('#confirm-operation').click();
    const text=await (await result(p,'error')).innerText();
    assert.match(text,/INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package com\.ecojust\.tanktv/);
    assert.match(text,expected);assert.doesNotMatch(text,uncertainText);
    assert.equal((await requests(p)).some(request=>request.action==='uninstall'),false,'A rejected install never deletes the old app automatically');
    await acknowledge(p);
    await p.locator('[data-act="market-pending"][data-kind="app"]').click();
    assert.equal(await p.locator('.apk-item').count(),1);assert.match(await p.locator('.apk-item').innerText(),/hifini-0\.1\.3\.apk/);
    assert.equal(await act(p,'install-one-apk').isEnabled(),true);
  },snapshot(),{marketInstallError:signatureFailure});
  await check('market cancellation and failed verification never add a partial APK',async p=>{
    await openMarket(p);await act(p,'download-market').click();await held(p,'downloadMarketItem');
    await act(p,'cancel').click();await release(p,'downloadMarketItem');await p.locator('dialog.operation-feedback[open][data-phase="result"]').waitFor();
    assert.match(await feedback(p).innerText(),/取消/);assert.notEqual(await feedback(p).getAttribute('data-outcome'),'success');await acknowledge(p);
    await act(p,'download-market').click();await held(p,'downloadMarketItem');await release(p,'downloadMarketItem',{error:'下载校验失败，请重试'});
    assert.match(await (await result(p,'error')).innerText(),/校验失败/);await acknowledge(p);
    await nav(p,'install');assert.equal(await p.locator('.apk-item').count(),0);
  },snapshot(),{holdActions:['downloadMarketItem']});
  await check('market refresh replaces a stale catalog and preserves localized controls',async p=>{
    await openMarket(p);assert.match(await p.locator('main').innerText(),/缓存目录/);
    await p.locator('[name="locale"]').selectOption('en');assert.equal(await p.locator('h1').innerText(),'Market');
    assert.match(await p.locator('[data-market-kind="launcher"]').innerText(),/Launchers/);
    assert.match(await marketCard(p,store.items[0]).innerText(),/HIFINi TV/);
    const updated=marketCatalog();updated.revision='f'.repeat(40);updated.items=[updated.items[1]];
    await p.evaluate(value=>{window.__marketCatalog=value;},updated);
    await act(p,'refresh-market').click();await result(p,'success');await acknowledge(p);
    assert.equal(await p.locator('.market-card').count(),1);assert.match(await p.locator('.market-card').innerText(),/WebTV/);
    assert.equal((await marketRequests(p)).at(-1).refresh,true,'Manual refresh bypasses catalog cache');
    await p.locator('[name="locale"]').selectOption('zh-TW');assert.equal(await p.locator('h1').innerText(),'市場');
    assert.match(await p.locator('[data-market-kind="launcher"]').innerText(),/啟動器/);
    await p.locator('[data-market-kind="launcher"]').click();assert.equal(await p.locator('.market-card').count(),0);
    await shot(p,'market-traditional-empty');
  },withoutAdb(),{marketCatalog:{...marketCatalog(),stale:true,warning:'网络暂不可用，正在显示缓存目录'}});
  await check('market initial network failure shows an empty error state and can be retried',async p=>{
    await nav(p,'market');await p.waitForFunction(()=>document.querySelector('.market-warning')?.textContent.includes('无法读取市场目录'));await settled(p);
    assert.equal(await p.locator('.market-card').count(),0,'Failed live requests never display a fabricated catalog');
    assert.match(await p.locator('.market-empty').innerText(),/暂时无法读取市场/);
    await p.evaluate(()=>{window.__marketCatalogError=null;});await act(p,'refresh-market').click();await result(p,'success');await acknowledge(p);
    assert.equal(await p.locator('.market-card').count(),2);assert.deepEqual(await requests(p),[]);
  },withoutAdb(),{failMarketCatalog:true});
  const largeMarket=marketCatalog();largeMarket.items=Array.from({length:45},(_,index)=>({...store.items[0],id:`apps/example${index}/example-${index}.apk`,name:`Example ${index}`,fileName:`example-${index}.apk`}));
  await check('market long catalogs scroll internally in compact windows and all themes',async p=>{
    await p.setViewportSize({width:960,height:640});await openMarket(p);
    const area=p.locator('[data-scroll="market-app"]');
    const metrics=await area.evaluate(element=>({height:element.clientHeight,total:element.scrollHeight}));
    assert.ok(metrics.height>60 && metrics.total>metrics.height,JSON.stringify(metrics));
    const cardBounds=await p.locator('.market-card').first().evaluate(element=>({card:element.getBoundingClientRect().toJSON(),cover:element.querySelector('.market-cover').getBoundingClientRect().toJSON(),buttons:[...element.querySelectorAll('.market-card-actions button')].map(button=>button.getBoundingClientRect().toJSON())}));
    assert.ok(cardBounds.card.height>=250,`Cards must not collapse into grid lines: ${JSON.stringify(cardBounds)}`);
    assert.ok(cardBounds.cover.height>100,'Cover keeps a visible aspect ratio in a long catalog');
    assert.ok(cardBounds.buttons.every(button=>button.top>=cardBounds.card.top && button.bottom<=cardBounds.card.bottom && button.left>=cardBounds.card.left && button.right<=cardBounds.card.right),`Download and install controls stay inside the card: ${JSON.stringify(cardBounds)}`);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'Document does not scroll');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Cards do not overflow horizontally');
    const top=(await p.locator('.page-header').boundingBox()).y;
    await area.evaluate(element=>{element.scrollTop=1000;});assert.ok(await area.evaluate(element=>element.scrollTop>0));
    assert.equal((await p.locator('.page-header').boundingBox()).y,top);assert.equal(await p.evaluate(()=>scrollY),0);
    await p.locator('[name="theme"]').selectOption('graphite');assert.equal(await p.locator('html').getAttribute('data-theme'),'graphite');
    await p.locator('[name="locale"]').selectOption('en');await shot(p,'market-en-graphite');
  },withoutAdb(),{marketCatalog:largeMarket});
  await check('market MCP results synchronize catalog and download/install queues with the window',async p=>{
    await openMarket(p);
    const imported={...store.items[0],id:'apps/agent/agent.apk',name:'Agent import',fileName:'agent.apk'};
    const catalog={...marketCatalog(),items:[imported]};
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'get_market_catalog',marketResult:{operation:'catalog',catalog:value}}),catalog);
    assert.equal(await p.locator('.market-card').count(),1);assert.match(await p.locator('.market-card').innerText(),/Agent import/);
    await p.evaluate(()=>{window.__emitMcp('mcp-operation',{running:true,tool:'download_market_item'});window.__emitMcp('mcp-market-progress',{stage:'downloading',downloaded:50,total:100,itemId:'apps/agent/agent.apk'});});
    await p.locator('.busy-bar').waitFor();assert.match(await p.locator('.busy-bar').innerText(),/50%/);
    const download={item:imported,path:'/tmp/puretv-market/agent.apk'};
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'download_market_item',marketResult:{operation:'download',download:value,installed:false}}),download);
    await settled(p);await p.locator('[data-act="market-pending"][data-kind="app"]').click();assert.equal(await p.locator('.apk-item').count(),1);
    const installed=snapshot();installed.revision=3;installed.installResults=[{path:download.path,success:true,message:'Installed'}];
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install_market_item',snapshot:value.snapshot,marketResult:{operation:'install',download:value.download,installed:true,snapshot:value.snapshot}}),{download,snapshot:installed});
    await settled(p);assert.equal(await p.locator('.apk-item').count(),0);
  },snapshot());


  await check('market install confirmation rejects a changed television or Android user',async p=>{
    await openMarket(p);let target=snapshot();
    for(const change of [{serial:'192.168.1.99:5555'},{userId:10}]) {
      await act(p,'install-market').click();await p.locator('#confirm-operation').waitFor();
      target={...target,revision:target.revision+1,device:{...target.device,...change}};
      await p.evaluate(value=>{window.__setMockState(value);window.__emitMcp('mcp-operation',{running:false,tool:'connect',snapshot:value});},target);
      await p.locator('#confirm-operation').click();await p.locator('.notice.error').waitFor();
      assert.match(await p.locator('.notice.error').innerText(),/目标电视已变化/);await acknowledge(p);
      assert.equal((await marketRequests(p)).filter(value=>value.command==='install_market_item').length,0,'An earlier confirmation cannot authorize installation on a new target');
    }
  });
  await check('market pending queues follow verified generic MCP installs and ignore failed or older results',async p=>{
    await openMarket(p);await act(p,'download-market').click();await result(p,'success');await acknowledge(p);
    await p.locator('[data-market-kind="launcher"]').click();await act(p,'download-market').click();await result(p,'success');await acknowledge(p);
    await nav(p,'install');assert.equal(await p.locator('.apk-item').count(),1);
    const appPath='/tmp/puretv-market/'+store.items[0].fileName,launcherPath='/tmp/puretv-market/'+store.items[2].fileName;
    const previous={...snapshot(),revision:2,installResults:[{path:appPath,success:true,message:'Previous install'},{path:launcherPath,success:true,message:'Previous install'}]};
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install',snapshot:value,error:'安装前检查失败'}),previous);
    await settled(p);assert.equal(await p.locator('.apk-item').count(),1,'A failed call cannot reuse successful results from an earlier install');
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install',snapshot:{...value,revision:1}}),previous);
    await settled(p);assert.equal(await p.locator('.apk-item').count(),1,'Older snapshots cannot remove pending files');
    const partial={...previous,revision:3,installResults:[{path:appPath,success:true,message:'Installed'},{path:launcherPath,success:false,message:'Install failed'}]};
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install',snapshot:value}),partial);
    await settled(p);assert.equal(await p.locator('.apk-item').count(),0,'A successful generic MCP install clears its downloaded app');
    await nav(p,'launchers');await settled(p);assert.equal(await p.locator('[data-launcher-apk]').count(),1,'Failed launchers remain retryable');
    await p.evaluate(value=>window.__emitMcp('mcp-operation',{running:false,tool:'install',snapshot:{...value,revision:4,installResults:value.installResults.map(item=>({...item,success:true}))}}),partial);
    await settled(p);assert.equal(await p.locator('[data-launcher-apk]').count(),0,'A successful retry clears its downloaded launcher');
  });

  console.log(`${passed} UI scenarios passed`);
} finally {
  await browser?.close(); server.kill();
}
