// Synthetic native-bridge UI regression against the actual packaged web assets.
// This is Chromium with a read-only PureGameHost fixture, not Android/TV/phone QA.
// Run explicitly after the final asset bundle is ready and the browser is free:
// NEON_RUSH_NATIVE_UI_ASSETS=/absolute/extracted/assets \
// NEON_RUSH_NATIVE_UI_OUTPUT=/absolute/empty/evidence \
// node --test tests/native-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const assetsArgument = process.env.NEON_RUSH_NATIVE_UI_ASSETS;
const outputArgument = process.env.NEON_RUSH_NATIVE_UI_OUTPUT;
const entryUrl = 'https://game-kit.invalid/tv.html';
const roomUrl = 'http://192.0.2.1:1234/controller.html?room=fixture';
const displayAddress = 'http://192.0.2.1:1234/controller.html';
// A valid local image for the host's QR slot. Scanning/pairing is outside this fixture.
const qrImage = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><rect width="25" height="25" fill="white"/><g fill="black"><path d="M2 2h7v7H2zM16 2h7v7h-7zM2 16h7v7H2zM11 2h2v2h-2zM11 6h3v5h-3zM2 11h4v2H2zM8 11h3v4H8zM13 13h3v3h-3zM18 11h5v2h-5zM17 16h2v7h-2zM21 16h2v3h-2zM11 18h3v5h-3zM21 21h2v2h-2z"/></g><g fill="white"><path d="M3 3h5v5H3zM17 3h5v5h-5zM3 17h5v5H3z"/></g><g fill="black"><path d="M4 4h3v3H4zM18 4h3v3h-3zM4 18h3v3H4z"/></g></svg>').toString('base64');
const viewports = [{ width:960, height:540 }, { width:1280, height:720 }];

test('actual bundle honors the synthetic native bridge, address, panel and language lifecycle', {
  timeout:120000,
  skip:!assetsArgument && !outputArgument && 'Explicit final assets and output are required; synthetic native UI browser fixture not run',
}, async t => {
  assert.ok(assetsArgument && outputArgument, 'Set both NEON_RUSH_NATIVE_UI_ASSETS and NEON_RUSH_NATIVE_UI_OUTPUT');
  const { launch, sourceHashes, sha256, snapshot, tap, delay, verifyErrors } = await import('../../../game-kit/qa/common.mjs');
  const assets = path.resolve(assetsArgument), output = path.resolve(outputArgument);
  assert.ok(output !== assets && !output.startsWith(assets + path.sep), 'Evidence must not modify tested assets');
  await mkdir(output, { recursive:true });
  assert.equal((await readdir(output)).length, 0, 'Preserve prior failures: use an empty evidence directory');
  const sourceAssetHashes = await sourceHashes(assets);
  const script = await readFile(fileURLToPath(import.meta.url));
  const report = {
    startedAt:new Date().toISOString(), status:'running', sourceAssetHashes, scriptSha256:sha256(script),
    scope:'Synthetic native-bridge UI regression using the actual final bundle; not a real Android WebView, TV, phone, LAN server or QR pairing test',
    environment:{ physicalTvTested:false, physicalPhoneTested:false, actualAndroidHostTested:false, syntheticNativeBridge:true },
    inputMethod:'Ordinary Chromium keyboard Enter/P and mouse click; no model/state writes or clock overrides',
    fixture:{ entryUrl, getInfo:{language:'en',url:roomUrl,qrImageType:'valid local SVG data URL; not scanned'}, snapshot:{players:[]}, publish:'no-op; no writes' },
    tests:[], layouts:[], screenshots:[], navigations:[], servedAssets:{}, visualReviewCompleted:false,
  };
  await writeFile(path.join(output, 'executed-native-ui.test.mjs'), script);
  let browser, context, page;
  const errors = [], consoleErrors = [], network = [];
  const session = { errors, consoleErrors, network };
  async function check(name, action) {
    const item = { name, status:'running' }, started = performance.now();
    report.tests.push(item);
    try { item.details = await action(); item.status = 'passed'; }
    catch (error) { item.status = 'failed'; item.error = error.stack; throw error; }
    finally { item.wallSeconds = (performance.now() - started) / 1000; t.diagnostic(JSON.stringify(item)); }
  }
  async function ready() {
    await page.waitForFunction(() => typeof window.PureTVQA?.snapshot === 'function' && !!document.getElementById('rush-language-button'), null, {timeout:20000});
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
    await page.waitForFunction(() => { const q=document.getElementById('qr'); return !q.hidden && q.complete && q.naturalWidth>0; });
  }
  async function panel(expected) {
    await page.waitForFunction(visible => {
      const el=document.querySelector('aside');
      return !!el && (getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden' && el.getClientRects().length>0)===visible;
    }, expected);
  }
  async function capture(name) {
    const file = name + '.png';
    await page.screenshot({ path:path.join(output,file) });
    report.screenshots.push(file);
  }
  async function layout(phase, language, viewport) {
    await page.setViewportSize(viewport); await delay(150); await panel(true);
    const measured = await page.evaluate(() => {
      const box = el => { const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
      const aside=document.querySelector('aside'), qr=document.getElementById('qr');
      const visible = el => { for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse')return false;}return !!el.getClientRects().length; };
      const result={viewport:{width:innerWidth,height:innerHeight},language:document.documentElement.lang,phase:document.body.dataset.rushPhase,
        page:{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bodyScrollWidth:document.body.scrollWidth,bodyScrollHeight:document.body.scrollHeight},
        sidebar:{box:box(aside),clientWidth:aside.clientWidth,clientHeight:aside.clientHeight,scrollWidth:aside.scrollWidth,scrollHeight:aside.scrollHeight,scrollTop:aside.scrollTop,scrollLeft:aside.scrollLeft},
        qr:{box:box(qr),visible:visible(qr),loaded:qr.complete&&qr.naturalWidth>0},texts:[],controls:[]};
      const walker=document.createTreeWalker(aside,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode,parent=node.parentElement,text=node.textContent.trim();
        if(!text||!visible(parent))continue;
        const range=document.createRange();range.selectNodeContents(node);
        result.texts.push({text,parent:parent.id||parent.className||parent.tagName,rects:[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}))});
      }
      for(const selector of ['.side-heading .eyebrow','#room-address','aside h3','#move-help','#a-help','#b-help','aside .small-help','#tip']){
        const el=document.querySelector(selector);result.controls.push({selector,visible:visible(el),text:el.textContent.trim(),box:box(el)});
      }
      for(const id of ['primary','dialog-title','rush-language-button']){
        const el=document.getElementById(id);result.controls.push({selector:'#'+id,visible:visible(el),text:el.textContent.trim(),box:box(el)});
      }
      return result;
    });
    report.layouts.push({requestedPhase:phase,requestedLanguage:language,...measured});
    // Save the actual layout even if a measurement below fails.
    await capture(`${language}-${phase}-${viewport.width}x${viewport.height}`);
    assert.equal(measured.phase,phase); assert.equal(measured.language,language==='en'?'en':'zh-CN');
    const inside = (r,b) => r.left>=b.left-1&&r.top>=b.top-1&&r.right<=b.right+1&&r.bottom<=b.bottom+1;
    const viewportBox={left:0,top:0,right:viewport.width,bottom:viewport.height};
    assert.ok(inside(measured.sidebar.box,viewportBox),'Sidebar is fully inside the viewport');
    assert.ok(measured.sidebar.scrollWidth<=measured.sidebar.clientWidth+1&&measured.sidebar.scrollHeight<=measured.sidebar.clientHeight+1,'Entire sidebar fits without scrolling');
    assert.equal(measured.sidebar.scrollTop,0); assert.equal(measured.sidebar.scrollLeft,0);
    assert.ok(measured.page.scrollWidth<=viewport.width+1&&measured.page.bodyScrollWidth<=viewport.width+1&&measured.page.scrollHeight<=viewport.height+1&&measured.page.bodyScrollHeight<=viewport.height+1,'No page overflow');
    assert.ok(measured.qr.visible&&measured.qr.loaded,'Host image is loaded and visible');
    assert.ok(inside(measured.qr.box,measured.sidebar.box),'Host image fits inside the panel');
    for(const element of measured.controls){assert.ok(element.visible&&element.text.length>0,'Required visible text: '+element.selector);assert.ok(inside(element.box,viewportBox),'Required element is unclipped: '+element.selector);}
    assert.ok(measured.texts.length>=10,'Measure all sidebar text nodes, including instructions');
    for(const item of measured.texts){assert.ok(item.rects.length>0,'Text has rendered glyph boxes: '+item.text);for(const rect of item.rects)assert.ok(inside(rect,measured.sidebar.box)&&inside(rect,viewportBox),'Entire sidebar text is visible: '+item.text);}
    return {viewport,phase,language,textNodes:measured.texts.length,sidebar:measured.sidebar};
  }
  try {
    for(const name of ['tv.html','tv.css','runtime.js','renderer.js','game.js','game-model.js','rush-theme.css','game-config.json'])assert.ok(sourceAssetHashes[name], 'Final asset is present: '+name);
    // Reject old extraction directories before claiming that this is the final bundle.
    for(const name of ['game.js','game-model.js','rush-theme.css'])assert.equal(sourceAssetHashes[name],sha256(await readFile(new URL('../src/main/assets/'+name,import.meta.url))),'Extracted game asset matches current production output: '+name);
    for(const name of ['tv.html','tv.css','runtime.js','renderer.js'])assert.equal(sourceAssetHashes[name],sha256(await readFile(new URL('../../../game-kit/web/'+name,import.meta.url))),'Extracted shared asset matches current production source: '+name);
    browser=await launch(); report.environment.browser=await browser.version();
    context=await browser.newContext({viewport:viewports[1],locale:'zh-CN',deviceScaleFactor:1});
    // Deliberately use a Chinese browser locale: English must come from getInfo().
    await context.addInitScript(({url,qr}) => {
      Object.defineProperty(window,'PureGameHost',{value:Object.freeze({
        getInfo:()=>JSON.stringify({language:'en',url,qr}),
        snapshot:()=>JSON.stringify({players:[]}),
        publish:()=>{},
      }),writable:false,configurable:false});
    },{url:roomUrl,qr:qrImage});
    await context.route('**/*',async route => {
      const request=route.request(),url=new URL(request.url());
      try {
        if(['data:','blob:'].includes(url.protocol))return route.continue();
        assert.equal(url.origin,new URL(entryUrl).origin,'No external requests');
        if(request.isNavigationRequest())assert.equal(url.href,entryUrl,'Native navigation must retain the exact permitted URL, without query/hash');
        if(url.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});
        const name=decodeURIComponent(url.pathname).slice(1),file=path.resolve(assets,name);
        assert.ok(file.startsWith(assets+path.sep)&&sourceAssetHashes[name],'Only actual bundled assets are served');
        const body=await readFile(file),hash=sha256(body);assert.equal(hash,sourceAssetHashes[name],'Asset changed while being served: '+name);
        report.servedAssets[name]=hash;
        const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
        return route.fulfill({status:200,contentType:types[path.extname(name)]||'application/octet-stream',body});
      }catch(error){network.push({url:url.href,error:error.message});return route.abort();}
    });
    page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('requestfailed',request=>network.push({url:request.url(),error:request.failure()?.errorText}));
    page.on('framenavigated',frame=>{if(frame===page.mainFrame())report.navigations.push(frame.url());});
    await page.goto(entryUrl,{waitUntil:'load'}); await ready();
    await check('fresh native English locale retains the LAN address and supplied image',async()=>{
      assert.equal((await snapshot(page)).phase,'menu');
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      assert.equal(await page.locator('#title').textContent(),'Neon Rush');
      assert.equal(await page.evaluate(()=>localStorage.getItem('neon-rush.language')),null,'Fresh fixture has no saved language');
      assert.equal(await page.locator('#room-address').textContent(),displayAddress,'Keep real address and remove room query');
      assert.equal(await page.locator('#qr').getAttribute('src'),qrImage);
      assert.ok(await page.locator('#qr').isVisible());assert.equal(await page.locator('#qr-empty').isVisible(),false);
      await panel(true);verifyErrors(session);return {language:'en',address:displayAddress,phase:'menu'};
    });
    await check('native menu automatically shows all panel text at 960 and 1280',async()=>{
      const results=[];for(const viewport of viewports)results.push(await layout('menu','en',viewport));return results;
    });
    await check('ordinary start hides the panel and P pause restores it without advancing the race',async()=>{
      await tap(page,'Enter');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing'&&!PureTVQA.snapshot().paused);
      await panel(false);await capture('en-playing-1280x720');
      await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);await panel(true);
      const before=await snapshot(page);await delay(250);const after=await snapshot(page);
      assert.equal(after.tick,before.tick);assert.deepEqual(after.model,before.model,'Pause freezes the actual model');
      const results=[];for(const viewport of viewports)results.push(await layout('paused','en',viewport));
      await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await panel(false);
      await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);await panel(true);
      return {pausedTick:before.tick,layouts:results};
    });
    await check('clicking language reloads the exact native URL and persists Chinese over native English',async()=>{
      const navigationsBefore=report.navigations.length;
      await Promise.all([page.waitForEvent('load'),page.locator('#rush-language-button').click()]);await ready();
      assert.equal(page.url(),entryUrl);assert.equal(new URL(page.url()).search,'');assert.equal(new URL(page.url()).hash,'');
      assert.equal(report.navigations.length,navigationsBefore+1,'Actual document reload occurred');
      assert.equal(await page.evaluate(()=>performance.getEntriesByType('navigation')[0].type),'reload');
      assert.equal(await page.evaluate(()=>localStorage.getItem('neon-rush.language')),'zh');
      assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert.equal(await page.locator('#title').textContent(),'霓虹飞车');
      assert.equal((await snapshot(page)).phase,'menu');assert.equal(await page.locator('#room-address').textContent(),displayAddress);await panel(true);
      const results=[];for(const viewport of viewports)results.push(await layout('menu','zh',viewport));
      verifyErrors(session);return {url:page.url(),storedLanguage:'zh',navigationType:'reload',layouts:results};
    });
    assert.deepEqual(await sourceHashes(assets),sourceAssetHashes,'Tested assets are unchanged');
    assert.ok(Object.keys(report.servedAssets).includes('game.js')&&Object.keys(report.servedAssets).includes('runtime.js'),'Executed real bundled game and shared runtime');
    verifyErrors(session);report.status='passed';
  }catch(error){
    report.status='failed';report.error=error.stack;
    if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});report.lastSnapshot=await snapshot(page).catch(()=>null);}
    throw error;
  }finally{
    report.browserErrors={page:errors,console:consoleErrors,network};report.finishedAt=new Date().toISOString();
    if(context)await context.close();if(browser)await browser.close();
    await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    t.diagnostic('Synthetic native UI report: '+path.join(output,'report.json'));
  }
});
