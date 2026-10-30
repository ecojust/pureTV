// Exercises the bundled controller through an actual local WebSocket connection.
// The server speaks the native hello/welcome/input/state protocol with test telemetry.
import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash, randomBytes} from 'node:crypto';
import {readFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const {chromium} = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);
const rooms = new Map();
let nextConnection = 1, passed = 0;
function encode(value, opcode=1) {
  const data=Buffer.from(typeof value==='string'?value:JSON.stringify(value));
  const header=data.length<126?Buffer.from([0x80|opcode,data.length]):Buffer.from([0x80|opcode,126,data.length>>8,data.length&255]);
  return Buffer.concat([header,data]);
}
function publish(room,state) {
  room.state=state;
  for(const peer of room.peers)if(peer.welcomed&&!peer.socket.destroyed)peer.socket.write(encode({...state,type:'state'}));
}
const server=http.createServer(async(request,response)=>{
  const file=new URL(request.url,'http://localhost').pathname.slice(1)||'controller.html';
  if(!['controller.html','controller.js','controller.css'].includes(file)){response.writeHead(404).end();return;}
  response.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
  response.end(await readFile(new URL(file,assets)));
});
server.on('upgrade',(request,socket)=>{
  const url=new URL(request.url,'http://localhost'),room=rooms.get(url.searchParams.get('room'));
  if(url.pathname!='/ws'||!room){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
  const accept=createHash('sha1').update(request.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const peer={socket,id:nextConnection++,welcomed:false,buffer:Buffer.alloc(0)};room.peers.add(peer);room.connections.push(peer);
  socket.on('data',data=>{
    peer.buffer=Buffer.concat([peer.buffer,data]);
    while(peer.buffer.length>=2){
      const opcode=peer.buffer[0]&15,masked=!!(peer.buffer[1]&128);let length=peer.buffer[1]&127,offset=2;
      if(length===126){if(peer.buffer.length<4)return;length=peer.buffer.readUInt16BE(2);offset=4;}
      if(length===127||length>32768||!masked){socket.destroy();return;}
      if(peer.buffer.length<offset+4+length)return;
      const mask=peer.buffer.subarray(offset,offset+4);offset+=4;const body=Buffer.from(peer.buffer.subarray(offset,offset+length));
      peer.buffer=peer.buffer.subarray(offset+length);for(let i=0;i<body.length;i++)body[i]^=mask[i%4];
      if(opcode===8){socket.end(encode('',8));return;}
      if(opcode===9){socket.write(encode(body.toString(),10));continue;}
      if(opcode!==1)continue;
      const message=JSON.parse(body.toString());room.messages.push({...message,connection:peer.id});
      if(message.type==='hello'){
        if(room.mode==='full'){socket.write(encode({type:'error',code:'room_full'}));continue;}
        assert.ok(!message.session||message.session===room.session,'Reconnect uses the room session token');
        peer.welcomed=true;socket.write(encode({type:'welcome',player:room.player,session:room.session,heartbeatMs:250}));
        socket.write(encode({...room.state,type:'state'}));
      }
    }
  });
  socket.on('error',()=>{});socket.on('close',()=>room.peers.delete(peer));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const garage={phase:'garage',trackName:'霓虹港湾',trackNameEn:'Neon Harbor',laps:2,players:[{id:1,carName:'旧车测试驾驶席',carNameEn:'Used car test driver',speedKmh:0,gear:0,brakeForce:0,brakeBroken:false,lap:1,rank:1}]};
async function fixture({locale='zh-CN',viewport={width:844,height:390},legacy=false,mode='welcome',player=1}={}){
  const room={token:randomBytes(16).toString('hex'),session:randomBytes(16).toString('hex'),mode,player,peers:new Set(),connections:[],messages:[],state:structuredClone(garage)};
  room.state.players[0].id=player;rooms.set(room.token,room);
  const context=await browser.newContext({locale,viewport,hasTouch:true});
  if(legacy)await context.addInitScript(()=>{window.PointerEvent=undefined;});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/?room='+room.token);
  if(mode==='welcome')await page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
  else await page.locator('#error-actions:not([hidden])').waitFor();
  async function close(){assert.deepEqual(errors,[],'No page errors');await context.close();for(const peer of room.peers)peer.socket.destroy();rooms.delete(room.token);}
  return {page,context,room,close};
}
const lastInput=room=>room.messages.filter(m=>m.type==='input').at(-1);
async function expectInput(room,values){
  for(let i=0;i<100;i++){
    const actual=lastInput(room);
    if(actual&&Object.entries(values).every(([key,value])=>actual[key]===value))return actual;
    await new Promise(resolve=>setTimeout(resolve,15));
  }
  assert.deepEqual(Object.fromEntries(Object.keys(values).map(key=>[key,lastInput(room)?.[key]])),values);
}
function neutral(frame){return frame.x===0&&frame.y===0&&!frame.a&&!frame.b&&!frame.start&&!frame.select;}
async function point(page,id,fx=.5,fy=.5){const r=await page.locator('#'+id).boundingBox();return{x:r.x+r.width*fx,y:r.y+r.height*fy};}
async function touch(cdp,type,points){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:6,radiusY:6,force:1}))});}
async function check(name,run){await run();passed++;console.log('PASS '+name);}
const capture=process.env.USED_CAR_UI_CAPTURE_DIR;
try{
  await check('Native protocol handshake, neutral heartbeat, sequence and session-resume identity',async()=>{
    const f=await fixture();
    assert.deepEqual(f.room.messages[0],{type:'hello',connection:f.room.connections[0].id});
    await f.page.waitForTimeout(320);const inputs=f.room.messages.filter(m=>m.type==='input');assert.ok(inputs.length>=2);assert.ok(inputs.every(neutral));assert.ok(inputs.every((m,i)=>i===0||m.seq>inputs[i-1].seq));
    assert.equal(await f.page.evaluate(key=>sessionStorage.getItem(key),'used-car-racing-controller:'+f.room.token),f.room.session);
    await f.page.reload();await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
    const hello=f.room.messages.filter(m=>m.type==='hello').at(-1);assert.equal(hello.session,f.room.session);await f.close();
  });
  await check('Whole right third: every edge and both midpoint boundaries have the advertised pedal',async()=>{
    const f=await fixture();const cdp=await f.context.newCDPSession(f.page);const {width:w,height:h}=f.page.viewportSize();
    for(const y of [1,h/4,h/2-1,h/2,h*.75,h-1])for(const x of [w*2/3+.6,w*5/6,w-1]){
      await touch(cdp,'touchStart',[[1,x,y]]);await expectInput(f.room,{a:y<h/2,b:y>=h/2});
      await touch(cdp,'touchEnd',[]);await expectInput(f.room,{a:false,b:false});
    }
    await f.close();
  });
  await check('Steering has a neutral touch origin, progressive response, full travel and no vertical braking',async()=>{
    const f=await fixture();const cdp=await f.context.newCDPSession(f.page);
    await touch(cdp,'touchStart',[[1,180,245]]);await expectInput(f.room,{x:0,y:0,a:false,b:false});
    await touch(cdp,'touchMove',[[1,220,305]]);await f.page.waitForTimeout(80);assert.ok(lastInput(f.room).x>.05&&lastInput(f.room).x<.5);assert.equal(lastInput(f.room).y,0);assert.equal(lastInput(f.room).b,false);
    await touch(cdp,'touchMove',[[1,400,305]]);await expectInput(f.room,{x:1,y:0});
    await touch(cdp,'touchMove',[[1,20,305]]);await expectInput(f.room,{x:-1,y:0});
    await touch(cdp,'touchEnd',[]);await expectInput(f.room,{x:0,y:0});
    await touch(cdp,'touchStart',[[1,370,245]]);await expectInput(f.room,{x:0});await touch(cdp,'touchEnd',[]);await f.close();
  });
  await check('Three real touches steer, accelerate and brake simultaneously with independent release',async()=>{
    const f=await fixture();const cdp=await f.context.newCDPSession(f.page);
    await touch(cdp,'touchStart',[[1,180,245]]);await touch(cdp,'touchMove',[[1,330,245]]);await expectInput(f.room,{x:1});
    await touch(cdp,'touchStart',[[1,330,245],[2,720,90],[3,720,300]]);await expectInput(f.room,{x:1,a:true,b:true});
    await touch(cdp,'touchEnd',[[3,720,300]]);await expectInput(f.room,{x:1,a:true,b:false});
    await touch(cdp,'touchEnd',[[2,720,90]]);await expectInput(f.room,{x:1,a:false,b:false});
    const before=lastInput(f.room).cancelSeq;await touch(cdp,'touchCancel',[]);await expectInput(f.room,{x:0,a:false,b:false});assert.ok(lastInput(f.room).cancelSeq>before);await f.close();
  });
  await check('Brake-only cancel, blur and resize increase cancellation sequence and release controls',async()=>{
    const f=await fixture();const cdp=await f.context.newCDPSession(f.page);
    for(const cancel of ['touchcancel','blur','resize']){
      const before=lastInput(f.room).cancelSeq;await touch(cdp,'touchStart',[[1,720,300]]);await expectInput(f.room,{b:true});
      if(cancel==='touchcancel')await touch(cdp,'touchCancel',[]);
      else{await f.page.evaluate(type=>window.dispatchEvent(new Event(type)),cancel);await touch(cdp,'touchEnd',[]);}
      await expectInput(f.room,{x:0,y:0,a:false,b:false,start:false,select:false});assert.ok(lastInput(f.room).cancelSeq>before,cancel);
    }
    await f.close();
  });
  await check('Hidden page sends neutral before disconnecting and resumes without held pedals',async()=>{
    const f=await fixture();await f.page.keyboard.down('ArrowDown');await expectInput(f.room,{b:true});
    await f.page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expectInput(f.room,{b:false});
    await f.page.waitForTimeout(600);assert.equal(f.room.connections.length,1);
    await f.page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');
    assert.equal(f.room.connections.length,2);await expectInput(f.room,{x:0,a:false,b:false});await f.page.keyboard.up('ArrowDown');await f.close();
  });
  await check('Transport loss clears the UI and reconnects the same seat with neutral fresh input',async()=>{
    const f=await fixture();await f.page.keyboard.down('ArrowDown');await expectInput(f.room,{b:true});
    for(const peer of f.room.peers)peer.socket.destroy();await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='false');
    assert.equal(await f.page.locator('#button-b').isDisabled(),true);assert.equal(await f.page.locator('#button-b').evaluate(el=>el.classList.contains('pressed')),false);
    await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');await expectInput(f.room,{b:false});
    const first=f.room.messages.find(m=>m.type==='input'&&m.connection===f.room.connections.at(-1).id);assert.equal(first.seq,1);assert.ok(neutral(first));await f.page.keyboard.up('ArrowDown');await f.close();
  });
  await check('Physical slot 2 follows its own telemetry while displaying logical driver 1, with legacy fallback',async()=>{
    const f=await fixture({player:2});
    assert.equal(await f.page.locator('#player-number').innerText(),'P2');
    publish(f.room,{...garage,phase:'race',players:[
      {...garage.players[0],id:1,driver:2,carName:'另一辆车',speedKmh:222},
      {...garage.players[0],id:2,driver:1,carName:'我的车辆',speedKmh:88,brakeForce:450}
    ]});
    await f.page.waitForFunction(()=>document.getElementById('speed').textContent==='88');
    assert.equal(await f.page.locator('#player-number').innerText(),'P1');
    assert.equal(await f.page.locator('#controller').getAttribute('data-player'),'1');
    assert.equal(await f.page.locator('#player-name').innerText(),'我的车辆');
    assert.equal(await f.page.locator('#force').innerText(),'450');
    // A later update must still select physical id 2 after displaying logical P1.
    publish(f.room,{...garage,phase:'race',players:[
      {...garage.players[0],id:1,driver:1,speedKmh:12},
      {...garage.players[0],id:2,speedKmh:99,carName:'',carNameEn:''}
    ]});
    await f.page.waitForFunction(()=>document.getElementById('speed').textContent==='99');
    assert.equal(await f.page.locator('#player-number').innerText(),'P2');
    assert.equal(await f.page.locator('#controller').getAttribute('data-player'),'2');
    assert.equal(await f.page.locator('#player-name').innerText(),'驾驶员 2');
    await f.close();
  });
  await check('Telemetry is server-authoritative, shows permanent pedal failure, and pauses release all input',async()=>{
    const f=await fixture();publish(f.room,{...garage,phase:'race',players:[{...garage.players[0],speedKmh:87.4,gear:3,brakeForce:1200,rank:2}]});await f.page.waitForFunction(()=>document.getElementById('force').textContent==='1200');
    await f.page.keyboard.down('ArrowDown');await expectInput(f.room,{b:true});await f.page.waitForTimeout(400);assert.equal(await f.page.locator('#force').innerText(),'1200','Phone must not invent real pedal pressure');
    publish(f.room,{...garage,phase:'race',players:[{...garage.players[0],brakeForce:1600,brakeBroken:true}]});await f.page.waitForFunction(()=>document.getElementById('controller').dataset.brakeBroken==='true');assert.match(await f.page.locator('#message').innerText(),/断裂/);
    publish(f.room,{...garage,phase:'paused'});await expectInput(f.room,{b:false,a:false,x:0});assert.equal(await f.page.locator('#button-a').isDisabled(),true);assert.equal(await f.page.locator('#button-start').isDisabled(),false);
    publish(f.room,{...garage,phase:'results'});await f.page.waitForFunction(()=>document.getElementById('controller').dataset.state==='finished');assert.equal(await f.page.locator('#button-select').isDisabled(),false);await f.page.keyboard.up('ArrowDown');await f.close();
  });
  await check('START and SELECT are separate, reachable menu controls with keyboard and touch release',async()=>{
    const f=await fixture();await f.page.locator('#button-select').focus();await f.page.keyboard.down('Enter');await expectInput(f.room,{select:true,start:false,a:false});await f.page.keyboard.up('Enter');await expectInput(f.room,{select:false});
    const cdp=await f.context.newCDPSession(f.page),start=await point(f.page,'button-start'),select=await point(f.page,'button-select');
    await touch(cdp,'touchStart',[[1,start.x,start.y],[2,select.x,select.y]]);await expectInput(f.room,{start:true,select:true});await touch(cdp,'touchEnd',[[1,start.x,start.y]]);await expectInput(f.room,{start:false,select:true});await touch(cdp,'touchEnd',[]);await expectInput(f.room,{start:false,select:false});await f.close();
  });
  await check('Room capacity failures stop retries until requested and keep pedals disabled',async()=>{
    const f=await fixture({mode:'full'});assert.match(await f.page.locator('#message').innerText(),/驾驶席/);assert.equal(await f.page.locator('#button-a').isDisabled(),true);await f.page.waitForTimeout(700);assert.equal(f.room.connections.length,1);
    f.room.mode='welcome';await f.page.locator('#retry').click();await f.page.waitForFunction(()=>document.getElementById('controller').dataset.connected==='true');assert.equal(f.room.connections.length,2);await f.close();
  });
  await check('Legacy touch fallback without PointerEvent supports simultaneous steering and both pedals',async()=>{
    const f=await fixture({legacy:true});
    async function legacy(type,points){await f.page.evaluate(({type,points})=>{
      const touches=points.map(([identifier,x,y])=>new Touch({identifier,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y,target:document.elementFromPoint(x,y)}));
      const event=new TouchEvent(type,{bubbles:true,cancelable:true,changedTouches:touches,touches:type==='touchend'||type==='touchcancel'?[]:touches});(touches[0]?.target||document).dispatchEvent(event);
    },{type,points});}
    await legacy('touchstart',[[1,180,245],[2,720,80],[3,720,300]]);await expectInput(f.room,{x:0,a:true,b:true});await legacy('touchmove',[[1,330,245]]);await expectInput(f.room,{x:1,a:true,b:true});
    const cancel=lastInput(f.room).cancelSeq;await legacy('touchcancel',[[1,330,245],[2,720,80],[3,720,300]]);await expectInput(f.room,{x:0,a:false,b:false});assert.ok(lastInput(f.room).cancelSeq>cancel);await f.close();
  });
  for(const locale of ['zh-CN','en-US'])await check(locale+' full-screen zones, selection prevention, portrait layout and real captures',async()=>{
    const f=await fixture({locale});const english=locale==='en-US';assert.equal(await f.page.locator('html').getAttribute('lang'),english?'en':'zh-CN');assert.match(await f.page.locator('#a-caption').innerText(),english?/Throttle/:/油门/);
    assert.deepEqual(await f.page.evaluate(()=>['contextmenu','selectstart','dragstart'].map(type=>document.querySelector('.brand').dispatchEvent(new Event(type,{bubbles:true,cancelable:true})))),[false,false,false]);
    assert.equal(await f.page.locator('body').evaluate(el=>getComputedStyle(el).userSelect),'none');assert.equal(await f.page.locator('body').evaluate(el=>getComputedStyle(el).touchAction),'none');
    if(capture){await mkdir(capture,{recursive:true});await f.page.screenshot({path:capture+'/used-car-racing-controller'+(english?'.en':'')+'.png'});}
    const cdp=await f.context.newCDPSession(f.page);await touch(cdp,'touchStart',[[1,180,245]]);await touch(cdp,'touchMove',[[1,260,245]]);await touch(cdp,'touchStart',[[1,260,245],[2,720,80]]);await expectInput(f.room,{a:true});
    publish(f.room,{...garage,phase:'race',players:[{...garage.players[0],speedKmh:126,gear:4,brakeForce:0,rank:2}]});await f.page.waitForFunction(()=>document.getElementById('speed').textContent==='126');
    if(capture)await f.page.screenshot({path:capture+'/used-car-racing-controller-active'+(english?'.en':'')+'.png'});
    await f.page.waitForTimeout(650);assert.equal(await f.page.evaluate(()=>String(getSelection())), '');await touch(cdp,'touchEnd',[]);
    await f.page.setViewportSize({width:390,height:844});await expectInput(f.room,{x:0,a:false,b:false});
    const a=await f.page.locator('#button-a').boundingBox(),b=await f.page.locator('#button-b').boundingBox();assert.ok(Math.abs(a.x-260)<.1&&a.y===0&&a.height===422);assert.ok(Math.abs(b.x-260)<.1&&b.y===422&&b.height===422);assert.equal(await f.page.locator('.rotate-hint').isVisible(),true);assert.ok(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await f.close();
  });
  console.log(passed+' controller scenarios passed');
}finally{await browser.close();for(const room of rooms.values())for(const peer of room.peers)peer.socket.destroy();await new Promise(resolve=>server.close(resolve));}
