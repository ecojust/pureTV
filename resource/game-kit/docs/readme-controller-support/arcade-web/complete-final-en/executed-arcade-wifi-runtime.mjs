// Actual browser frames and ordinary bridge inputs; synthetic Android bridge,
// not a TCP/NSD/device test. Does not write model state or alter time.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import http from 'node:http';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const require=createRequire(process.env.PURETV_PACKAGE);
const {chromium}=require('playwright');
const repo=fileURLToPath(new URL('../../',import.meta.url));
const out=path.resolve(process.env.ARCADE_QA_OUTPUT||'/dev/shm/controller-arcade-qa/attempt-1');
await mkdir(out,{recursive:true});await copyFile(fileURLToPath(import.meta.url),path.join(out,'executed-arcade-wifi-runtime.mjs'));
const all=[['super-mario','MarioHost'],['bomb-jack','BombJackHost'],['adventure-island','AdventureHost'],['tetris','TetrisHost'],['jewel','JewelHost'],['jackal','JackalHost'],['tank','TankHost']];
const games=process.env.ARCADE_GAMES?all.filter(([id])=>process.env.ARCADE_GAMES.split(',').includes(id)):all;
const report={scope:process.env.ARCADE_LAYOUT_ONLY==='1'?'layout-only':'layout-and-input',startedAt:new Date().toISOString(),method:'Chromium actual renderer and frames with ordinary input snapshots; synthetic Android bridge consumes short pulses once, no model/clock writes.',physicalTvTested:false,physicalPhoneTested:false,physicalEsp32Tested:false,gameStateWrites:false,tests:[]};
const sha=data=>createHash('sha256').update(data).digest('hex');
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=process.env.JACKAL_ART_DIR&&pathname.startsWith('/jackal/src/main/assets/art/')?path.join(process.env.JACKAL_ART_DIR,pathname.slice('/jackal/src/main/assets/art/'.length)):path.join(repo,'resource/apps',pathname);if(!file.startsWith(path.join(repo,'resource/apps')+'/')&&!(process.env.JACKAL_ART_DIR&&file.startsWith(path.resolve(process.env.JACKAL_ART_DIR)+'/')))throw Error('path');const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{for(const [slug,bridge] of games){const row={game:slug,status:'running',assetHashes:{}};report.tests.push(row);
 for(const file of ['runtime.js','puretv-controller.js','tv.html','tv.css','game-model.js'])row.assetHashes[file]=sha(await readFile(path.join(repo,'resource/apps',slug,'src/main/assets',file)));
 const context=await browser.newContext({viewport:{width:960,height:540}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
 await page.addInitScript(({bridge,language})=>{window.__bridgePlayers=[];window.__pulse={};window.__calls=0;window.__roomInfo={language,qr:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="white"/></svg>',url:'http://192.168.1.100:8080/?room=fixture',wifiController:{state:'available',addresses:['192.168.1.100'],port:63485,serviceName:'pureTV fixture',connected:false,inputActive:true}};window[bridge]={getInfo:()=>JSON.stringify(window.__roomInfo),snapshot:()=>{window.__calls++;const players=JSON.parse(JSON.stringify(window.__bridgePlayers));for(const [key,value]of Object.entries(window.__pulse))if(players[0])players[0][key]=value;window.__pulse={};return JSON.stringify({players});},publish:()=>{},exit:()=>{}};}, {bridge,language:process.env.ARCADE_LANGUAGE||'zh-CN'});
 await page.goto(`http://127.0.0.1:${server.address().port}/${slug}/src/main/assets/tv.html`);
 await page.waitForFunction(()=>window.PureTVQA&&PureTVQA.snapshot().model,{},{timeout:20000});
 const snap=()=>page.evaluate(()=>PureTVQA.snapshot());
 const put=async value=>{await page.evaluate(value=>{if(!window.__bridgePlayers.length)window.__bridgePlayers=[{id:1,transport:'wifi',session:'fixture-1',controllerId:'sdk-fixture',connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0}];Object.assign(window.__bridgePlayers[0],value);window.__roomInfo.wifiController.connected=window.__bridgePlayers.some(p=>p.connected);},value);};
 const tap=async key=>{await page.evaluate(key=>{window.__pulse[key]=true;},key);await page.waitForTimeout(100);};
 await page.screenshot({path:path.join(out,slug+'-menu-960.png')});
 const layout=()=>page.evaluate(()=>{const e=document.querySelector('.sidebar');return {width:innerWidth,height:innerHeight,bodyWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight,sidebarClient:e.clientHeight,sidebarScroll:e.scrollHeight,sidebarBox:e.getBoundingClientRect().toJSON(),wifiText:document.getElementById('wifi-controller').innerText};});
 row.layout960=await layout();assert.ok(row.layout960.bodyWidth<=961&&row.layout960.bodyHeight<=541);assert.match(row.layout960.wifiText,/63485/);if(process.env.ARCADE_LAYOUT_ONLY==='1')assert.ok(row.layout960.sidebarScroll<=row.layout960.sidebarClient+1,'Compact controls must fit without scrolling');
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(100);await page.screenshot({path:path.join(out,slug+'-menu-1280.png')});row.layout1280=await layout();assert.ok(row.layout1280.bodyWidth<=1281&&row.layout1280.bodyHeight<=721);
 if(process.env.ARCADE_LAYOUT_ONLY==='1'){
  row.wifiStates=[];
  const english=(process.env.ARCADE_LANGUAGE||'zh-CN').startsWith('en');
  const wifiStates=[
   {name:'connected',state:'available',connected:true,port:63485,addresses:['192.168.1.100'],title:english?'pureTV controller connected':'pureTV 手柄已连接'},
   {name:'registering',state:'registering',connected:false,port:63485,addresses:['192.168.1.100'],title:english?'Publishing controller service':'正在发布手柄服务'},
   {name:'discovery-failed',state:'unavailable',connected:false,port:63485,addresses:['192.168.1.100'],title:english?'Controller discovery unavailable':'手柄自动发现不可用'},
   {name:'service-failed',state:'unavailable',connected:false,port:0,addresses:[],title:english?'Controller service unavailable':'手柄服务不可用'},
   {name:'stopped',state:'stopped',connected:false,port:0,addresses:[],title:english?'Controller service stopped':'手柄服务已停止'},
  ];
  for(const testState of wifiStates){
   await page.evaluate(value=>Object.assign(window.__roomInfo.wifiController,value,{error:-1}),testState);
   await page.waitForFunction(title=>document.getElementById('wifi-state').textContent===title,testState.title);
   const stateResult={name:testState.name};
   for(const width of [960,1280]){
    await page.setViewportSize({width,height:width===960?540:720});await page.waitForTimeout(50);
    const measured=await layout();stateResult['layout'+width]=measured;
    assert.ok(measured.sidebarScroll<=measured.sidebarClient+1,slug+' '+testState.name+' controls fit at '+width);
    assert.ok(measured.bodyWidth<=width+1&&measured.bodyHeight<=(width===960?541:721));
    assert.ok(!measured.wifiText.includes('-1'),'Native error codes must not appear as help text');
    if(width===960)await page.screenshot({path:path.join(out,slug+'-'+testState.name+'-960.png')});
   }
   row.wifiStates.push(stateResult);
  }
  assert.deepEqual(errors,[]);row.status='passed';continue;
 }
 await put({});await page.waitForTimeout(100);await tap('select');row.afterSelect=await snap();await tap('select');if(slug==='tank')await tap('select');
 await tap('start');if(slug==='tank'){await page.waitForFunction(()=>PureTVQA.snapshot().phase==='stageintro');await tap('start');}await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing',null,{timeout:25000});
 if(slug==='tank')await page.waitForFunction(()=>PureTVQA.snapshot().players[0].alive&&!PureTVQA.snapshot().players[0].spawnFrames);
 row.started=await snap();
 await put({x:1});await page.waitForTimeout(220);row.right=await snap();await put({x:-1});await page.waitForFunction(({slug,target})=>{const p=PureTVQA.snapshot().players[0];const x=slug==='tetris'?p.piece.x:slug==='jewel'?p.active.x:p.x;return x<target;},{slug,target:slug==='tetris'?row.right.players[0].piece.x:slug==='jewel'?row.right.players[0].active.x:row.right.players[0].x},{timeout:4000});row.left=await snap();await put({x:0});
 const xpos=s=>{const p=s.players[0];return slug==='tetris'?p.piece.x:slug==='jewel'?p.active.x:p.x;};
 row.direction={before:xpos(row.started),right:xpos(row.right),left:xpos(row.left)};
 assert.ok(row.direction.right>row.direction.before,slug+' RIGHT increases visible world x');assert.ok(row.direction.left<row.direction.right,slug+' LEFT decreases visible world x');
 await tap('a');await page.waitForTimeout(130);row.actionA=await snap();
 await tap('start');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='paused');await put({connected:false});await page.waitForTimeout(80);await put({connected:true,session:'manual-reconnect'});await page.waitForTimeout(80);assert.equal((await snap()).phase,'paused');await tap('start');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');
 await put({connected:false});await page.waitForFunction(()=>PureTVQA.snapshot().controllerPaused);const frozen=await snap();await page.waitForTimeout(150);assert.deepEqual((await snap()).players,frozen.players);
 await put({connected:true,session:'fixture-2',a:true,start:true});await page.waitForTimeout(120);assert.equal((await snap()).controllerPaused,true,'Reconnect held actions cannot resume');
 await put({a:false,start:false});await page.waitForTimeout(80);await tap('start');await page.waitForFunction(()=>!PureTVQA.snapshot().controllerPaused);row.resumed=await snap();assert.equal(row.resumed.phase,'playing');
 await page.screenshot({path:path.join(out,slug+'-playing.png')});
 assert.deepEqual(errors,[]);row.status='passed';row.nativeSnapshotCalls=await page.evaluate(()=>__calls);
 }catch(e){row.status='failed';row.error=e.stack;row.last=await page.evaluate(()=>window.PureTVQA?PureTVQA.snapshot():null);await page.screenshot({path:path.join(out,slug+'-failure.png')});throw e;}finally{await context.close();await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
 }}finally{report.finishedAt=new Date().toISOString();report.status=report.tests.length===games.length&&report.tests.every(t=>t.status==='passed')?'passed':'failed';await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
console.log(JSON.stringify({status:report.status,games:report.tests.map(x=>({game:x.game,status:x.status,direction:x.direction}))}));
