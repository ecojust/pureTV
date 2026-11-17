// Actual controller page and DOM events; the WebSocket peer is a controlled LAN fixture.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../desktop/package.json',import.meta.url)),{chromium}=require('playwright');
let actionCount=2;
const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://local').pathname.slice(1)||'controller.html';
  if(name==='game-config.json'){res.setHeader('content-type','application/json');res.end(JSON.stringify({name:'控制器回归',nameEn:'Controller regression',actions:actionCount,actionA:'交付',actionB:'减速'}));return;}
  if(!['controller.html','controller.css','controller.js'].includes(name)){res.writeHead(404).end();return;}
  res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL('web/'+name,import.meta.url)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true,locale:'zh-CN'}),page=await context.newPage();
const inputs=[],hellos=[],errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message));
await page.routeWebSocket('**/ws?room=*',socket=>socket.onMessage(raw=>{
  const message=JSON.parse(raw);
  if(message.type==='hello'){hellos.push(message);socket.send(JSON.stringify({type:'welcome',player:1,session:'regressionsession0123456789'}));}
  else if(message.type==='input')inputs.push(message);
}));
const url=`http://127.0.0.1:${server.address().port}/?room=regressionroom0123456789`;
const cdp=await context.newCDPSession(page);
const touch=async(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
const point=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2,force:1});
const last=()=>inputs.at(-1);
async function waitFor(test,label){const end=Date.now()+3000;while(!test()&&Date.now()<end)await new Promise(r=>setTimeout(r,20));assert.ok(test(),label+'; last input '+JSON.stringify(last()));}
try{
  await page.goto(url);await waitFor(()=>last()?.type==='input','Handshake reaches a neutral input');
  assert.equal(last().x,0);assert.equal(last().a,false);checks.push('LAN hello/welcome and neutral initial input');
  const prevention=await page.evaluate(()=>({events:['contextmenu','selectstart','dragstart'].map(type=>!document.dispatchEvent(new Event(type,{cancelable:true,bubbles:true}))),selection:getComputedStyle(document.body).userSelect,callout:getComputedStyle(document.body).webkitTouchCallout}));
  assert.ok(prevention.events.every(Boolean));assert.equal(prevention.selection,'none');checks.push('Long-press context/selection/drag events prevented and user-select disabled');
  await touch('touchStart',[point(1,120,310)]);await touch('touchMove',[point(1,190,310)]);await waitFor(()=>last().x>.9,'Joystick movement');
  await touch('touchStart',[point(1,190,310),point(2,959,1)]);await waitFor(()=>last().a&&last().x>.9,'Move + fire together at top-right edge');
  await touch('touchEnd',[point(2,959,1)]);await waitFor(()=>!last().a&&last().x>.9,'Releasing action keeps held joystick');
  await touch('touchStart',[point(1,190,310),point(3,959,539)]);await waitFor(()=>last().b&&last().x>.9,'Bottom-right edge activates B');
  const cancelled=last().cancelSeq;await touch('touchCancel',[]);await waitFor(()=>!last().a&&!last().b&&last().x===0&&last().cancelSeq>cancelled,'Cancellation neutralizes all touches');checks.push('CDP multi-touch: direction + edge A/B, independent release, cancel token');
  await page.locator('#a').dispatchEvent('pointerdown',{pointerId:44,button:0,bubbles:true,clientX:900,clientY:100});await waitFor(()=>last().a,'Pointer action before blur');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await waitFor(()=>!last().a&&last().x===0,'Blur releases held action');checks.push('Window blur releases action');
  await page.locator('#b').dispatchEvent('pointerdown',{pointerId:45,button:0,bubbles:true,clientX:900,clientY:400});await waitFor(()=>last().b,'Pointer action before resize');
  await page.setViewportSize({width:844,height:390});await waitFor(()=>!last().b,'Resize cancels touch ownership');checks.push('Resize cancels touch ownership');
  await page.locator('#start').dispatchEvent('pointerdown',{pointerId:46,button:0,bubbles:true});await waitFor(()=>last().start,'Start is a dedicated input');await page.locator('#start').dispatchEvent('pointerup',{pointerId:46,button:0,bubbles:true});await waitFor(()=>!last().start,'Start release');
  await page.locator('#select').dispatchEvent('pointerdown',{pointerId:47,button:0,bubbles:true});await waitFor(()=>last().select,'Restart is a dedicated input');await page.locator('#select').dispatchEvent('pointerup',{pointerId:47,button:0,bubbles:true});await waitFor(()=>!last().select,'Restart release');checks.push('System start/restart press and release');
  const joins=hellos.length;
  await page.locator('#a').dispatchEvent('pointerdown',{pointerId:48,button:0,bubbles:true});await waitFor(()=>last().a,'Action before visibility event');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await waitFor(()=>!last().a,'Visibility handler sends neutral input');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await waitFor(()=>hellos.length>joins,'Visible controller rejoins');assert.equal(hellos.at(-1).session,'regressionsession0123456789');checks.push('Synthetic visibility transition neutralizes and resumes saved session');
  actionCount=1;await page.reload();await waitFor(()=>hellos.length>joins+1,'Single-action controller rejoined');await page.waitForFunction(()=>document.querySelector('#controller').dataset.actions==='1');
  assert.equal(await page.locator('#b').isVisible(),false);await touch('touchStart',[point(5,843,389)]);await waitFor(()=>last().a&&!last().b,'Single-action bottom edge maps to A');await touch('touchEnd',[]);checks.push('One action owns the entire right third');
  await page.setViewportSize({width:390,height:844});const bounds=await page.locator('#a').boundingBox();assert.ok(bounds&&bounds.x>=259&&bounds.y===0&&bounds.height===844);checks.push('Portrait controller preserves the complete action surface');
  assert.deepEqual(errors,[]);
  const output=process.env.GAME_KIT_TEST_OUTPUT||'/workspace/scratch/hundred-games/controller-regression';await mkdir(output,{recursive:true});
  await page.screenshot({path:output+'/portrait.png'});await page.setViewportSize({width:960,height:540});await page.screenshot({path:output+'/landscape.png'});
  const report={checks,passed:checks.length,browser:'Chromium',transport:'Playwright WebSocket fixture',touch:'CDP synthetic multi-touch',physicalPhoneTested:false,pageErrors:errors};await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
