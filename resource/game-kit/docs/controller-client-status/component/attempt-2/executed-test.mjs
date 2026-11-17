#!/usr/bin/env node
// Synthetic DOM component checks; no Android, network or physical controller claims.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../../../../',import.meta.url));
const output=path.resolve(process.argv[2]||'');assert.ok(process.argv[2],'Pass a fresh output directory');
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Preserve prior attempts');
const require=createRequire(process.env.PURETV_PACKAGE||path.join(root,'desktop/package.json'));
const {chromium}=require('playwright');
const digest=b=>createHash('sha256').update(b).digest('hex');
const modulePath=path.join(root,'resource/game-kit/web/puretv-controller.js');
const source=await readFile(modulePath,'utf8');
const files=['resource/game-kit/web/puretv-controller.js','resource/game-kit/legacy-controller-web/puretv-controller.js',...['tank','jackal','jewel','tetris','adventure-island','bomb-jack','super-mario','coast-kart','cozy-island','used-car-racing','alien-shooter'].map(slug=>`resource/apps/${slug}/src/main/assets/puretv-controller.js`)];
const report={status:'running',scope:'Synthetic DOM display and unchanged adapter regression; not Android or actual TCP/device acceptance',sourceHashes:{},tests:[],physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,modelWrites:false,clockOverrides:false};
await copyFile(fileURLToPath(import.meta.url),path.join(output,'executed-test.mjs'));
await writeFile(path.join(output,'executed-puretv-controller.js'),source);
let browser;
async function test(name,fn){const t={name,status:'running'};report.tests.push(t);try{t.result=await fn();t.status='passed';}catch(e){t.status='failed';t.error=e.stack;throw e;}}
try{
 await test('all thirteen module copies match and the original input adapter body is unchanged',async()=>{
  for(const file of files){const bytes=await readFile(path.join(root,file));report.sourceHashes[file]=digest(bytes);assert.equal(bytes.toString(),source,file);}
  const previous=spawnSync('git',['show','9af9f197855eb7a0ce7174c0e6295c8974b3250d:resource/game-kit/legacy-controller-web/puretv-controller.js'],{cwd:root,encoding:'utf8'});assert.equal(previous.status,0,previous.stderr);
  const before=previous.stdout.slice(previous.stdout.indexOf('  var actions ='),previous.stdout.indexOf('  root.PureTVControllerAdapter =')).trimEnd();
  const after=source.slice(source.indexOf('  var actions ='),source.indexOf('  var clientViews =')).trimEnd();assert.equal(after,before);
  return {copies:files.length,originalInputBodySha256:digest(before),productionModuleSha256:digest(source)};
 });
 if(process.argv.includes('--dom-only'))report.reusedInputRegression={report:'../attempt-1/report.json',reason:'Only CSS gap-to-margin compatibility changed; the unchanged input body is still checked against the original public source.'};
 if(!process.argv.includes('--dom-only'))await test('existing six input-boundary tests and maintenance sync check pass',async()=>{
  const file='resource/game-kit/legacy-controller-web/adapter.test.cjs';await copyFile(path.join(root,file),path.join(output,'executed-adapter.test.cjs'));
  for(const [name,args] of [['adapter',['node','--test',file]],['sync',['python3','resource/game-kit/legacy-controller-web/sync.py','--check']]]){
   const run=spawnSync(args[0],args.slice(1),{cwd:root,encoding:'utf8'});await writeFile(path.join(output,name+'.stdout.log'),run.stdout||'');await writeFile(path.join(output,name+'.stderr.log'),run.stderr||'');assert.equal(run.status,0,run.stderr||run.stdout);
  }
  return {existingInputTests:6};
 });
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:24px;background:#eef3f8;font-family:sans-serif"><h1 style="font-size:18px">Controller identity component · synthetic DOM fixture</h1><main style="display:flex;gap:24px;align-items:flex-start"><section style="width:150px"><h2 style="font-size:13px">150 px compact area</h2><div id="clients"></div></section><section style="width:174px"><h2 style="font-size:13px">174 px sidebar</h2><div id="second"></div></section></main></body></html>');
 await page.addScriptTag({content:source});
 await page.evaluate(()=>{window.render=(rows,language='en',id='clients')=>PureTVControllerAdapter.renderClients(document.getElementById(id),rows,{language});window.pad=(id=1,controllerId='esp32-001122334455')=>({id,controllerId,transport:'wifi',connected:true});});
 await test('zero connections and phone input stay hidden; genuine cached Wi-Fi identities are displayed',async()=>{
  const value=await page.evaluate(()=>{render([]);const empty=document.querySelector('#clients').hidden;render([{id:1,connected:true,transport:'phone',controllerId:'phone-1'}]);const phone=document.querySelector('#clients').hidden;render([pad()]);const card=document.querySelector('.ptv-client-card');return {empty,phone,hidden:document.querySelector('#clients').hidden,text:card.textContent,id:card.dataset.puretvControllerId,seat:card.dataset.playerId,svg:card.querySelectorAll('svg.ptv-client-icon').length};});
  assert.equal(value.empty,true);assert.equal(value.phone,true);assert.equal(value.hidden,false);assert.equal(value.id,'esp32-001122334455');assert.equal(value.seat,'1');assert.equal(value.svg,1);assert.match(value.text,/1PConnectedID: esp32-001122334455/);return value;
 });
 await test('buttons, cancellation and session changes never rewrite the stable ID DOM or poll input',async()=>{
  const value=await page.evaluate(async()=>{window.reads=0;window.Android={snapshot(){reads++;throw Error('UI must not consume a native frame');}};const container=document.getElementById('clients'),first=container.firstChild,records=[];const observer=new MutationObserver(rows=>records.push(...rows));observer.observe(container,{attributes:true,childList:true,characterData:true,subtree:true});const rows=[Object.freeze({...pad(),a:true,start:true,session:'replacement',cancelSeq:42})];Object.freeze(rows);for(let i=0;i<50;i++)render(rows);await Promise.resolve();observer.disconnect();return {sameNode:first===container.firstChild,mutations:records.length,reads};});
  assert.deepEqual(value,{sameNode:true,mutations:0,reads:0});return value;
 });
 await test('two controller IDs retain separate seats, deterministic order and honest disconnection',async()=>{
  const value=await page.evaluate(async()=>{render([pad(2,'virtual-abc123abc123'),pad()]);const before=[...document.querySelectorAll('#clients .ptv-client-card')].map(row=>[row.dataset.playerId,row.dataset.puretvControllerId]);const first=document.querySelector('#clients').firstChild;render([pad(),pad(2,'virtual-abc123abc123')]);const stable=first===document.querySelector('#clients').firstChild;render([{...pad(),connected:false},pad(2,'virtual-abc123abc123')]);const after=[...document.querySelectorAll('#clients .ptv-client-card')].map(row=>[row.dataset.playerId,row.dataset.puretvControllerId]);render([]);const disconnected=document.getElementById('clients').hidden&&document.querySelectorAll('#clients .ptv-client-card').length===0;render([pad()]);return {before,after,stable,disconnected,reconnected:document.querySelector('#clients .ptv-client-card').dataset.puretvControllerId};});
  assert.deepEqual(value.before,[['1','esp32-001122334455'],['2','virtual-abc123abc123']]);assert.deepEqual(value.after,[['2','virtual-abc123abc123']]);assert.equal(value.stable,true);assert.equal(value.disconnected,true);assert.equal(value.reconnected,'esp32-001122334455');return value;
 });
 await test('IDs are literal text and safe attributes; untranslated RSSI or device names are never invented',async()=>{
  const value=await page.evaluate(()=>{const unsafe='<img src=x onerror="window.pwned=true">&<script>window.pwned=true</script>';render([{...pad(1,unsafe),rssi:-42,name:'Untrusted device'}]);const container=document.getElementById('clients'),card=container.firstChild;return {unsafe,id:card.dataset.puretvControllerId,text:card.querySelector('[data-puretv-controller-id-text]').textContent,injected:container.querySelectorAll('img,script').length,pwned:!!window.pwned,rssi:container.textContent.includes('-42'),name:container.textContent.includes('Untrusted device')};});
  assert.equal(value.id,value.unsafe);assert.equal(value.text,'ID: '+value.unsafe);assert.equal(value.injected,0);assert.equal(value.pwned,false);assert.equal(value.rssi,false);assert.equal(value.name,false);return value;
 });
 await test('localization updates once and styles are installed once per document',async()=>{
  const value=await page.evaluate(()=>{render([pad()],'zh');render([pad(2,'esp32-667788990011')],'en','second');return {zh:document.querySelector('#clients .ptv-client-state').textContent,en:document.querySelector('#second .ptv-client-state').textContent,styleCount:document.querySelectorAll('#ptv-client-style').length,label:document.getElementById('clients').getAttribute('aria-label'),live:document.getElementById('clients').getAttribute('aria-live')};});
  assert.equal(value.zh,'已连接');assert.equal(value.en,'Connected');assert.equal(value.styleCount,1);assert.equal(value.label,'已连接的 pureTV 手柄');assert.equal(value.live,'polite');return value;
 });
 await test('full ninety-six-character IDs wrap without ellipsis in 150 and 174 pixel columns at both viewports',async()=>{
  const observations=[];
  for(const [width,height] of [[960,540],[1280,720]]){
   await page.setViewportSize({width,height});const value=await page.evaluate(()=>{const id='esp32-'+'A'.repeat(90);render([pad(1,id)],'zh');render([pad(1,id),pad(2,'esp32-001122334455')],'en','second');return ['clients','second'].map(name=>{const container=document.getElementById(name),row=container.firstChild,text=row.querySelector('[data-puretv-controller-id-text]'),range=document.createRange();range.selectNodeContents(text);const box=container.getBoundingClientRect(),rects=[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),style=getComputedStyle(text);return {name,identity:row.dataset.puretvControllerId,text:text.textContent,box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},rects,overflow:container.scrollWidth-container.clientWidth,whiteSpace:style.whiteSpace,overflowWrap:style.overflowWrap,textOverflow:style.textOverflow,lines:rects.length};});});
   for(const v of value){assert.equal(v.identity.length,96);assert.equal(v.text,'ID: '+v.identity);assert.ok(v.overflow<=1);assert.notEqual(v.textOverflow,'ellipsis');assert.ok(v.lines>1);assert.ok(v.rects.every(r=>r.left>=v.box.left-1&&r.right<=v.box.right+1&&r.top>=v.box.top-1&&r.bottom<=v.box.bottom+1));}
   const file=`identity-layout-${width}.png`;await page.screenshot({path:path.join(output,file)});observations.push({viewport:{width,height},columns:value,screenshot:file});
  }
  return observations;
 });
 assert.deepEqual(errors,[]);report.pageErrors=errors;report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;}finally{if(browser)await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,tests:report.tests.map(t=>({name:t.name,status:t.status}))}));}
