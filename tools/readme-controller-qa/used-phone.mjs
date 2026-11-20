import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const [out,observer,room,adb,serial]=process.argv.slice(2);
const {chromium}=createRequire(process.env.PURETV_PACKAGE)('playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const android=(...args)=>execFileSync(adb,['-s',serial,...args],{timeout:20000,maxBuffer:8*1024*1024});
const report={status:'running',originalGameSha256:JSON.parse(fs.readFileSync(path.join(out,'identity.json'))).apk,modelWrites:false,syntheticGameFrames:false,physicalDevice:false,actions:[],screens:[],states:[],mobileStartDown:0,phoneConnection:'real Android Java HTTP and WebSocket',scope:'The installed original game is read with the signed observer. System-dialog buttons use Android UI input. The touch browser operates the unchanged phone page.'};
function save(){fs.writeFileSync(path.join(out,'phone-dialog.json'),JSON.stringify(report,null,2)+'\n');}
function write(name,s){report.states.push({name,...s});save();return s;}
function capture(name){
 const bytes=android('exec-out','screencap','-p');assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
 fs.writeFileSync(path.join(out,name+'.png'),bytes);
 report.screens.push({name:name+'.png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});save();
}
async function state(){
 const r=await fetch(observer,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);const s=await r.json(),g=s.game;
 assert.equal(s.targetPackage,'com.ecojust.usedcartv');if(!g)throw Error('target game not ready');
 const people=g.controllers.filter(p=>p.connected);assert(!people.some(p=>p.transport==='wifi'),'Wi-Fi SDK controller unexpectedly connected');
 const phone=people.find(p=>p.transport!=='wifi');return {phase:g.phase,paused:g.paused,focused:s.page.focused,activity:s.activityState,active:g.info?.wifiController?.inputActive??s.info.wifiController?.inputActive,players:people.length,seat:phone?.id??null,start:phone?.start??null,startSeq:phone?.startSeq??null,gas:phone?.a??null,s:g.players[0]?.s??null,speed:g.players[0]?.speed??null,raceTime:g.model.raceTime,at:Date.now()};
}
async function wait(name,check,seconds=45){
 const end=Date.now()+1000*seconds;let last,error;while(Date.now()<end){
  try{last=await state();if(check(last))return write(name,last);}catch(e){if(String(e).includes('unexpectedly connected'))throw e;error=String(e);}
  await delay(180);
 }
 throw Error(name+' did not match. Final '+JSON.stringify({last,error}));
}
async function stable(name,initial,phase,sequence,advance){
 const end=Date.now()+30000;let count=0,last;while(Date.now()<end){
  last=await state();assert.equal(last.phase,phase);assert.equal(last.players,1);assert.equal(last.seat,initial.seat);assert.equal(last.startSeq,sequence);assert.equal(last.start,false);count++;
  if(advance){if(count>=4 && last.raceTime>initial.raceTime+.25)return write(name,{...last,consecutiveSamples:count});}
  else{assert.equal(last.raceTime,initial.raceTime);if(count>=4 && Date.now()-initial.at>=1300)return write(name,{...last,consecutiveSamples:count});}
  await delay(250);
 }throw Error(name+' failed to demonstrate a stable phase with the original clock');
}
async function dialog(name){
 android('shell','input','keyevent','KEYCODE_BACK');report.actions.push(name+': Android BACK');
 const paused=await wait(name+' original dialog suspended and hides phone seat',s=>s.phase==='paused'&&s.paused&&s.active===false&&s.players===0);
 capture(name+'-dialog');
 android('shell','uiautomator','dump','--compressed','/sdcard/puretv-used-car-dialog.xml');const xml=android('exec-out','cat','/sdcard/puretv-used-car-dialog.xml').toString();fs.writeFileSync(path.join(out,name+'-dialog.xml'),xml);
 const n=[...xml.matchAll(/<node\b[^>]*>/g)].map(m=>m[0]).find(t=>t.includes('resource-id="android:id/button2"'));assert(n && /text="(?:CANCEL|Cancel|取消)"/i.test(n),'Actual Android cancel button was missing');
 const b=n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert(b);
 android('shell','input','tap',String(Math.floor((Number(b[1])+Number(b[3]))/2)),String(Math.floor((Number(b[2])+Number(b[4]))/2)));report.actions.push(name+': selected system Cancel');
 return paused;
}
let b;
try{
 b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await b.newContext({isMobile:true,hasTouch:true,viewport:{width:844,height:390},deviceScaleFactor:1,locale:'en-US'});
 const page=await context.newPage(),dev=await context.newCDPSession(page);let sock;const outgoing=[];
 page.on('websocket',ws=>{if(new URL(ws.url()).pathname!='/ws')return;sock=ws;ws.on('framesent',f=>{try{const v=JSON.parse(f.payload);if(v.type==='input')outgoing.push(v);}catch{}});});
 const loaded=await page.goto(room,{waitUntil:'load'});assert.equal(loaded.status(),200);await page.locator('#controller[data-connected="true"]').waitFor({timeout:30000});
 assert(sock && new URL(sock.url()).search===new URL(room).search);report.browser=b.version();
 await wait('original room garage connected by phone alone',s=>s.phase==='garage'&&s.players===1&&s.startSeq===0);
 await page.screenshot({path:path.join(out,'original-mobile-controller.png')});
 async function touch(stage,selector,hold){
  const el=page.locator(selector),bounds=await el.boundingBox();assert(bounds);const point=selector==='#button-a'?{x:730,y:78}:{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  await dev.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1,radiusX:4,radiusY:4,force:1}]});
  try{await hold();}finally{await dev.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  report.actions.push(stage+' via real phone touch');if(selector==='#button-start')report.mobileStartDown++;save();
 }
 await touch('begin race','#button-start',()=>delay(160));
 const race=await wait('natural countdown enters race with released START',s=>s.phase==='race'&&s.start===false&&s.startSeq===1,95);
 await touch('accelerate','#button-a',()=>wait('accelerator changes original speed and track distance',s=>s.phase==='race'&&s.gas&&s.speed>1&&s.s>race.s+.25,45));
 const before=await wait('released accelerator before Android BACK',s=>s.phase==='race'&&s.gas===false&&s.start===false&&s.startSeq===1);capture('original-race');
 await dialog('active');const resume=await wait('Cancel restores original race with the previous phone sequence',s=>s.phase==='race'&&s.active===true&&!s.paused&&s.players===1&&s.start===false&&s.startSeq===before.startSeq);
 await stable('restored race clock advances without a new START',resume,'race',before.startSeq,true);capture('resumed-race');
 await touch('manual pause','#button-start',()=>delay(160));const manual=await wait('explicit phone pause',s=>s.phase==='paused'&&s.start===false&&s.startSeq===2);
 await dialog('manual');const returned=await wait('Cancel leaves manual pause intact',s=>s.phase==='paused'&&s.active===true&&s.players===1&&s.start===false&&s.startSeq===2);
 await stable('original race clock remains frozen while manually paused',returned,'paused',manual.startSeq,false);
 await touch('manual resume','#button-start',()=>delay(160));await wait('new phone START explicitly restores original race',s=>s.phase==='race'&&!s.paused&&s.active===true&&s.start===false&&s.startSeq===3);
 assert(outgoing.some(x=>x.a===true)&&outgoing.some(x=>x.start===true));report.inputFrames=outgoing.length;report.mobileStartRises=outgoing.reduce((n,r,i)=>n+(r.start&&!(outgoing[i-1]?.start)?1:0),0);
 assert.equal(report.mobileStartRises,3);assert.equal(report.mobileStartDown,3);report.status='passed';
}catch(e){report.status='failed';report.error=String(e?.stack??e);try{capture('native-failure');}catch{};process.exitCode=1;}
finally{save();if(b)await b.close();}
