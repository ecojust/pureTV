// Native room simulation; actions travel through the actual phone controller page.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const assets=new URL('../src/main/assets/',import.meta.url);
const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!/^[a-z-]+\.(html|js|css)$/.test(name)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL(name,assets)));}
  catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errors=[];
try{
  const tv=await browser.newPage({viewport:{width:1280,height:720}});
  tv.on('pageerror',e=>errors.push(e.message));
  await tv.addInitScript(()=>{
    window.__inputs=[1,2].map(id=>({id,connected:true,x:0,y:0,a:false,b:false,start:false,select:false}));
    window.CoastKartHost={getInfo:()=>JSON.stringify({language:'en-US',url:'http://localhost',qr:''}),snapshot:()=>JSON.stringify({players:window.__inputs}),publish:value=>{window.__published=JSON.parse(value);}};
  });
  await tv.goto(base+'/tv.html');
  await tv.waitForFunction(()=>window.CoastKartTV&&CoastKartTV.game);
  async function phone(id){
    const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,locale:'en-US'});
    await context.exposeBinding('__send',async(_,message)=>tv.evaluate(({id,message})=>{
      if(message.type==='input')Object.assign(window.__inputs[id-1],message,{id,connected:true});
      return window.__published;
    },{id,message}));
    await context.addInitScript(id=>{
      window.__sent=[];
      window.WebSocket=class extends EventTarget{
        static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
        constructor(){super();this.readyState=0;this.queue=Promise.resolve();setTimeout(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
        send(raw){const message=JSON.parse(raw);window.__sent.push(message);this.queue=this.queue.then(()=>window.__send(message)).then(state=>{
          if(message.type==='hello')this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'welcome',player:id,session:'combat-'+id,heartbeatMs:100})}));
          if(state)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'state',...state})}));
        });}
        close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
      };
    },id);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/controller.html?room=kart-combat-fixture-token');
    await page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
    return page;
  }
  const p1=await phone(1),p2=await phone(2);
  const down=(page,id,pointerId=1)=>page.locator('#'+id).dispatchEvent('pointerdown',{pointerId,pointerType:'touch',button:0,buttons:1});
  const up=(page,id,pointerId=1)=>page.locator('#'+id).dispatchEvent('pointerup',{pointerId,pointerType:'touch',button:0,buttons:0});
  async function stick(page,dx,dy){
    const box=await page.locator('#joystick-zone').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5;
    await page.locator('#joystick-zone').dispatchEvent('pointerdown',{pointerId:9,pointerType:'touch',button:0,buttons:1,clientX:x,clientY:y});
    await page.waitForTimeout(40);
    await page.locator('#joystick-zone').dispatchEvent('pointermove',{pointerId:9,pointerType:'touch',button:0,buttons:1,clientX:x+dx,clientY:y+dy});
  }
  await tv.evaluate(()=>{
    const g=CoastKartTV.game;g.selectedPlayers=2;g.start();g.countdown=0;g.racers=g.players;
    Object.assign(g.players[0],{s:500,x:-.4,item:'pulse'});
    Object.assign(g.players[1],{s:1000,x:.4,item:'trap'});
  });
  await down(p1,'button-a');await down(p2,'button-a');
  await tv.waitForFunction(()=>CoastKartTV.game.players.every(p=>p.heldItem));
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),0);
  await p1.waitForFunction(()=>/GUARDING/.test(document.getElementById('message').textContent));
  await stick(p1,0,100);
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].itemAim===-1);
  await up(p1,'button-a');await up(p1,'joystick-zone',9);
  await tv.waitForFunction(()=>CoastKartTV.game.items.some(i=>i.owner===1&&i.speed<0));
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[1].heldItem),true);
  await tv.evaluate(()=>{CoastKartTV.game.players[1].speed=180;});
  await stick(p2,35,0);await down(p2,'button-b',2);
  await tv.waitForFunction(()=>CoastKartTV.game.players[1].drift>0);
  await up(p2,'button-b',2);await up(p2,'joystick-zone',9);
  await tv.evaluate(()=>{
    const g=CoastKartTV.game,p=g.players[1];p.speed=0;p.x=0;
    g.items=[{type:'pulse',owner:1,s:(p.s-95+g.track.length)%g.track.length,x:0,speed:400,life:5}];
  });
  await tv.waitForFunction(()=>CoastKartTV.game.players[1].blockFlash>0);
  assert.deepEqual(await tv.evaluate(()=>({item:CoastKartTV.game.players[1].item,stun:CoastKartTV.game.players[1].stun})),{item:null,stun:0});
  await up(p2,'button-a');
  await tv.evaluate(()=>{CoastKartTV.game.players[0].item='trap';});
  await down(p1,'button-a');
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  await down(p1,'button-start',3);
  await tv.waitForFunction(()=>CoastKartTV.game.phase==='paused');
  await up(p1,'button-start',3);await up(p1,'button-a');
  await tv.waitForFunction(()=>!window.__inputs[0].start&&!window.__inputs[0].a);
  await down(p1,'button-start',3);
  await tv.waitForFunction(()=>CoastKartTV.game.phase==='playing');
  await up(p1,'button-start',3);
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].item),'trap');
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),0);
  // Canceling one independent control must not release another finger's A.
  await tv.evaluate(()=>{const g=CoastKartTV.game;g.items=[];Object.assign(g.players[0],{item:'pulse',x:0,s:500,speed:0,stun:0,recover:0});});
  const independentSeq=await tv.evaluate(()=>window.__inputs[0].cancelSeq||0);
  async function settledPhone() {
    const seq=await p1.evaluate(()=>window.__sent.filter(m=>m.type==='input').at(-1).seq);
    await tv.waitForFunction(seq=>window.__inputs[0].seq>=seq,seq);
    const tick=await tv.evaluate(()=>CoastKartTV.game.tick);
    await tv.waitForFunction(tick=>CoastKartTV.game.tick>tick,tick);
  }
  await down(p1,'button-a',101);await down(p1,'button-b',102);await stick(p1,30,0);
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  await p1.locator('#button-b').dispatchEvent('pointercancel',{pointerId:102,pointerType:'touch'});
  await settledPhone();
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].heldItem),true,'B cancellation preserves held A');
  await p1.locator('#joystick-zone').dispatchEvent('pointercancel',{pointerId:9,pointerType:'touch'});
  await settledPhone();
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].heldItem),true,'stick cancellation preserves held A');
  await down(p1,'button-a',103);
  await p1.locator('#button-a').dispatchEvent('pointercancel',{pointerId:101,pointerType:'touch'});
  await settledPhone();
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].heldItem),true,'another A finger keeps the effective A held');
  assert.equal(await tv.evaluate(()=>window.__inputs[0].cancelSeq),independentSeq,'independent cancellation does not mark A');
  await tv.keyboard.down('ArrowLeft');await tv.keyboard.down('x');
  await tv.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await settledPhone();
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].heldItem),true,'TV direction/B blur cannot cancel phone A');
  await tv.keyboard.up('ArrowLeft');await tv.keyboard.up('x');
  await tv.keyboard.down('z');
  await tv.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await settledPhone();
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].heldItem),true,'phone A also survives overlapping TV A blur');
  await tv.keyboard.up('z');
  await up(p1,'button-a',103);
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].item===null);
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),1,'the final A finger release throws exactly once');
  for(const cancellation of ['pointercancel','lostpointercapture','blur','resize']) {
    await tv.evaluate(()=>{const g=CoastKartTV.game;g.items=[];Object.assign(g.players[0],{item:'pulse',x:0,s:500,stun:0,recover:0});});
    const before=await tv.evaluate(()=>window.__inputs[0].cancelSeq||0);
    await down(p1,'button-a',41);
    await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
    if(cancellation==='blur'||cancellation==='resize')await p1.evaluate(type=>window.dispatchEvent(new Event(type)),cancellation);
    else await p1.locator('#button-a').dispatchEvent(cancellation,{pointerId:41,pointerType:'touch',button:0,buttons:0});
    await tv.waitForFunction(before=>window.__inputs[0].cancelSeq===before+1&&!CoastKartTV.game.players[0].heldItem,before);
    assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].item),'pulse',cancellation+' preserves inventory');
    assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),0,cancellation+' cannot throw');
    const seq=before+1;
    await p1.waitForTimeout(280);
    assert.equal(await p1.evaluate(()=>window.__sent.filter(m=>m.type==='input').at(-1).cancelSeq),seq,'heartbeat persists cancellation');
    await p1.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('resize'));});
    await p1.locator('#button-a').dispatchEvent('lostpointercapture',{pointerId:41,pointerType:'touch'});
    assert.equal(await p1.evaluate(()=>window.__sent.filter(m=>m.type==='input').at(-1).cancelSeq),seq,'idle cleanup is not a new cancellation');
    await down(p1,'button-a',42);
    await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
    await up(p1,'button-a',42);
    await p1.locator('#button-a').dispatchEvent('lostpointercapture',{pointerId:42,pointerType:'touch'});
    await tv.waitForFunction(()=>CoastKartTV.game.players[0].item===null);
    assert.equal(await tv.evaluate(()=>window.__inputs[0].cancelSeq),seq,'normal pointerup plus lostcapture does not cancel');
    assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),1,'a fresh normal gesture still throws');
  }
  await tv.evaluate(()=>{const g=CoastKartTV.game;g.items=[];Object.assign(g.players[0],{item:'pulse',x:0,s:500,stun:0,recover:0});});
  await tv.keyboard.down('z');
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  await tv.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await tv.waitForFunction(()=>!CoastKartTV.game.players[0].heldItem);
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.players[0].item),'pulse','TV keyboard blur preserves the held item');
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),0,'TV keyboard blur does not throw');
  await tv.keyboard.up('z');
  await tv.waitForFunction(()=>!CoastKartTV.game.players[0].itemButton);
  await tv.keyboard.down('z');
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  await tv.keyboard.up('z');
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].item===null);
  assert.equal(await tv.evaluate(()=>CoastKartTV.game.items.length),1,'a fresh keyboard keyup throws normally');
  // Change the native source between RAFs to exercise keyboard/phone blur races.
  await tv.evaluate(()=>{
    const g=CoastKartTV.game;g.items=[];Object.assign(g.players[0],{item:'pulse',x:0,s:500,stun:0,recover:0});
  });
  await down(p1,'button-a',151);
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  await tv.keyboard.down('z');
  const raceState=await tv.evaluate(()=>{
    window.__inputs[0].a=false;
    window.dispatchEvent(new Event('blur'));
    return {held:CoastKartTV.game.players[0].heldItem,item:CoastKartTV.game.players[0].item};
  });
  assert.deepEqual(raceState,{held:false,item:'pulse'},'same-event phone release cannot be hidden by a stale phone-A cache');
  await tv.keyboard.up('z');
  await up(p1,'button-a',151);
  await tv.waitForFunction(()=>!CoastKartTV.game.players[0].itemButton);
  await tv.keyboard.down('z');
  await tv.waitForFunction(()=>CoastKartTV.game.players[0].heldItem);
  const overlapState=await tv.evaluate(()=>{
    window.__inputs[0].a=true;
    window.dispatchEvent(new Event('blur'));
    return CoastKartTV.game.players[0].heldItem;
  });
  assert.equal(overlapState,true,'a same-event new phone press keeps the overlapping A held');
  await tv.keyboard.up('z');
  assert.deepEqual(errors,[]);
  console.log('PASS kart combat: two actual phone pages guard, aim, throw, drift, intercept, resume, cancel without throwing and start fresh gestures');
}finally{await browser.close();await new Promise(done=>server.close(done));}
