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
      window.WebSocket=class extends EventTarget{
        static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
        constructor(){super();this.readyState=0;this.queue=Promise.resolve();setTimeout(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
        send(raw){const message=JSON.parse(raw);this.queue=this.queue.then(()=>window.__send(message)).then(state=>{
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
  assert.deepEqual(errors,[]);
  console.log('PASS kart combat: two actual phone pages guard, aim, throw, drift, intercept and resume without a queued throw');
}finally{await browser.close();await new Promise(done=>server.close(done));}
