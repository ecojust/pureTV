import {chromium} from '/dev/shm/joystick-qa-deps/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import crypto from 'node:crypto'; import assert from 'node:assert/strict'; import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))), out=path.join(root,'docs','coarse-layout-attempt-'+(process.argv[2]||'1'));
fs.mkdirSync(out,{recursive:true}); fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'executed-coarse-layout.mjs'));
const html=fs.readFileSync(path.join(root,'dist/tv.html'));
const report={distSha256:crypto.createHash('sha256').update(html).digest('hex'),syntheticBridge:true,rendering:'Canvas2D --disable-gpu; no performance claim',cases:[],failures:[]};
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(html);}); await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],env:{...process.env,TMPDIR:'/dev/shm'}});
try {
 for(const [width,height] of [[960,540],[1280,720]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await ctx.newPage();
  await page.addInitScript(()=>{window.__buttons={};window.PureGameHost={getInfo(){return JSON.stringify({wifiController:{state:'ready',port:63485,serviceName:'pureTV layout fixture',addresses:['127.0.0.1']}})},snapshot(){return JSON.stringify({players:[{id:1,controllerId:'QA-GLUP-LAYOUT-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ',session:'layout-1',connected:true,transport:'wifi',inputActive:true,cancelSeq:0,buttons:window.__buttons}]})}};});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>5);
  const plan=JSON.parse(fs.readFileSync(path.join(root,'qa-plan.json')));
  for(const step of plan.steps.slice(0,4)){
   await page.evaluate(()=>{__buttons.START=true});await page.waitForTimeout(step.holdMs);await page.evaluate(()=>{__buttons.START=false});await page.waitForFunction(()=>!JoystickGameQA.snapshot().controller.buttons.START);
   await page.waitForFunction(items=>{const s=JoystickGameQA.snapshot();return items.every(e=>{const v=e.path.split('.').reduce((v,k)=>v[k],s);return e.op==='eq'?v===e.value:v>=e.value})},step.expect);
  }
  await page.touchscreen.tap(20,20);await page.waitForTimeout(200);
  const layout=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const blocks=['puretv-controller-panel','tv-controls'].map(id=>{const el=document.getElementById(id),text=[];const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=walk.nextNode();n;n=walk.nextNode())if(n.textContent.trim()){const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())text.push({text:n.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom});}return {id,rect:rect(el),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,text}});
   return {coarse:matchMedia('(pointer:coarse)').matches,touchNodes:[...document.querySelectorAll('.touch-only')].map(e=>({id:e.id,display:getComputedStyle(e).display})),canvas:rect(document.querySelector('#c')),blocks,identity:document.getElementById('puretv-controller-panel').innerText,width:innerWidth,height:innerHeight,documentScrollWidth:document.documentElement.scrollWidth};
  });
  assert.equal(layout.coarse,true);assert.ok(layout.touchNodes.every(e=>e.display==='none'));
  assert.equal(layout.documentScrollWidth,width);assert.ok(layout.identity.includes('QA-GLUP-LAYOUT-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  for(const b of layout.blocks){assert.ok(b.scrollWidth<=b.clientWidth);assert.ok(b.scrollHeight<=b.clientHeight);for(const t of b.text){assert.ok(t.left>=b.rect.left-1&&t.right<=b.rect.right+1,JSON.stringify(t));assert.ok(t.top>=0&&t.bottom<=height,JSON.stringify(t));}}
  assert.ok(layout.canvas.right<layout.blocks[0].rect.left);assert.ok(layout.blocks[0].rect.bottom<layout.blocks[1].rect.top);
  report.cases.push(layout);await page.screenshot({path:path.join(out,'long-id-'+width+'.png')});await ctx.close();
 }
}catch(e){report.failures.push(e.stack)}finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
if(report.failures.length){console.error(report.failures.join('\n'));process.exitCode=1}else console.log('GLUP both viewport text bounds, sidebar scroll metrics and full long controller ID passed.');
