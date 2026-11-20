import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = fileURLToPath(new URL('../', import.meta.url));
const game = path.basename(root.replace(/\/$/,''));
const plan = JSON.parse(fs.readFileSync(path.join(root,'qa-plan.json')));
const dir = path.join(root,'docs', process.env.EVIDENCE_DIR || 'browser');
fs.mkdirSync(dir,{recursive:true});
const html = fs.readFileSync(path.join(root,'dist/tv.html'));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={game,browser:browser.version(),transport:'browser fixture for the native snapshot interface',modelWrites:false,clockOverrides:false,physicalTvTested:false,physicalPhoneTested:false,results:[]};
try {
 for(const [width,height] of (process.env.QA_WIDTH ? [[Number(process.env.QA_WIDTH), Number(process.env.QA_WIDTH)*9/16]] : [[960,540],[1280,720]])){
  const ctx=await browser.newContext({viewport:{width,height}});
  const p=await ctx.newPage();p.setDefaultTimeout(90000);
  const errors=[],external=[];
  p.on('pageerror',e=>{errors.push(String(e));console.error(e.message);});
  p.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:'))external.push(r.url());});
  await p.addInitScript(()=>{
   window.buttonFixture={active:true,player:{id:1,controllerId:'TV-QA-01',session:'session-one',connected:true,inputActive:true,transport:'wifi',buttons:Object.fromEntries(['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'].map(k=>[k,false]))}};
   window.PureGameHost={getInfo(){return JSON.stringify({wifiController:{state:'ready',port:63485}});},snapshot(){const f=window.buttonFixture;return JSON.stringify({inputActive:f.active,players:f.player.connected?[f.player]:[]});}};
  });
  await p.goto(url);
  const snap=()=>p.evaluate(()=>JoystickGameQA.snapshot());
  const waitFrame=async(n=2)=>{const f=(await snap()).frames;await p.waitForFunction(([f,n])=>JoystickGameQA.snapshot().frames>=f+n,[f,n]);};
  const press=async(k,hold=0)=>{await p.evaluate(k=>{buttonFixture.player.buttons[k]=true;},k);await waitFrame();if(hold)await p.waitForTimeout(hold);await p.evaluate(k=>{buttonFixture.player.buttons[k]=false;},k);await waitFrame();};
  await p.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>2);const menu=await snap();
  await p.locator('#tv-controls strong').click();
  assert.equal(menu.stage,'menu');assert.equal(menu.webglVersion,2);
  await p.screenshot({path:path.join(dir,'menu-'+width+'.png')});
  const stepResults=[];
  for(const step of plan.steps){
   const before=await snap();console.log(game,width,step.name);
   await press(step.keys[0],step.holdMs);
   await p.waitForFunction(({before,expects})=>{const now=JoystickGameQA.snapshot();const read=(s,k)=>k.split('.').reduce((v,x)=>v?.[x],s);return expects.every(e=>{const v=read(now,e.path),old=read(before,e.path);return e.op==='eq'?v===e.value:e.op==='changed'?v!==old:v>old;});},{before,expects:step.expect});
   const after=await snap();stepResults.push({name:step.name,gameplay:after.gameplay,stage:after.stage});
   if(after.stage==='paused') await p.screenshot({path:path.join(dir,'paused-'+width+'.png')});
  }
  // Solve the displayed hint through the same cursor and swap controls a player uses.
  if(game==='oathstones'){
   await p.waitForFunction(()=>JoystickGameQA.snapshot().gameplay.ready);
   await press('Y');const model=(await snap()).gameplay;assert.equal(model.hint.length,2);
   const [start,end]=model.hint;
   let cursor=model.cursor;
   for(const [unit,up,down] of [[7,'DOWN','UP'],[1,'RIGHT','LEFT']]){
    let delta=unit===7 ? Math.floor(start/7)-Math.floor(cursor/7) : (start%7)-(cursor%7);
    for(let n=0;n<Math.abs(delta);n++){await press(delta>0?up:down);cursor=(await snap()).gameplay.cursor;}
   }
   assert.equal(cursor,start);await press('A');assert.equal((await snap()).gameplay.selected,start);
   await press(({1:'RIGHT','-1':'LEFT',7:'DOWN','-7':'UP'})[end-start]);
   const after=(await snap()).gameplay;assert.ok(after.moves>model.moves);assert.ok(after.clears>model.clears);
   stepResults.push({name:'Complete a genuine hinted match',start,end,before:model,after});
  }
  await p.screenshot({path:path.join(dir,'playing-'+width+'.png')});
  await p.waitForFunction(()=>JoystickGameQA.snapshot().audioState==='running');
  await p.evaluate(()=>PureGame.focus(false));await waitFrame();
  await p.waitForFunction(()=>JoystickGameQA.snapshot().audioState==='suspended');
  assert.equal((await snap()).stage,'paused');const paused=(await snap()).gameplay;
  await p.evaluate(()=>PureGame.focus(true));await waitFrame(4);
  const resumedFocus=await snap();assert.equal(resumedFocus.stage,'paused');assert.equal(resumedFocus.audioState,'suspended');
  for(const k of plan.pauseStablePaths){const key=k.split('.')[1];assert.deepEqual(paused[key],resumedFocus.gameplay[key]);}
  await press('START');assert.equal((await snap()).stage,'playing');
  await p.waitForFunction(()=>JoystickGameQA.snapshot().audioState==='running');
  await p.evaluate(()=>{buttonFixture.player.connected=false;});await waitFrame();assert.equal((await snap()).stage,'paused');
  await p.evaluate(()=>{buttonFixture.player.connected=true;buttonFixture.player.session='session-two';buttonFixture.player.buttons.START=true;});await waitFrame();
  assert.equal((await snap()).stage,'paused');await p.waitForFunction(()=>JoystickGameQA.snapshot().audioState==='suspended');
  await p.evaluate(()=>{buttonFixture.player.buttons.START=false;});await waitFrame();await press('START');assert.equal((await snap()).stage,'playing');
  const layout=await p.evaluate(()=>{const rect=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};return {view:rect('view'),panel:rect('puretv-controller-panel'),controls:rect('tv-controls'),scrollWidth:document.documentElement.scrollWidth};});
  assert.ok(layout.view.right<=layout.controls.left);assert.ok(layout.controls.bottom<=height);assert.equal(layout.scrollWidth,width);
  await p.waitForFunction(()=>JoystickGameQA.snapshot().audioState==='running');
  const final=await snap();assert.deepEqual(errors,[]);assert.deepEqual(final.errors,[]);assert.deepEqual(external,[]);
  report.results.push({width,height,menu,steps:stepResults,layout,external,errors,focusLossPauses:true,reconnectRequiresNewStart:true,realAudioStates:['running','suspended-on-blur','suspended-on-focus-return','running-after-START','suspended-after-reconnect','running-after-new-START']});
  await ctx.close();fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
} catch(e){report.error=e.stack;fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
