import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
// Real browser and HTTP assets with a simulated LAN WebSocket peer.
// Captures show bundled pages; they are not physical phone/TV evidence.
const gameRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(gameRoot,'../../../desktop/package.json'));
const {chromium}=require('playwright');
const world=require(resolve(gameRoot,'src/main/assets/world.js'));
const assets=resolve(gameRoot,'src/main/assets');
const output=process.env.ALIEN_SHOOTER_UI_CAPTURE_DIR || resolve(gameRoot,'build/controller-captures');
await mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;const name=path==='/'?'controller.html':path.slice(1);if(!/^controller\.(?:html|js|css)$/.test(name)){res.writeHead(404).end();return;}res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(assets+'/'+name));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']});
let checks=0;
async function fixture(locale='zh-CN',size={width:844,height:390},mode='welcome') {
  const context=await browser.newContext({viewport:size,hasTouch:true,locale});
  await context.addInitScript(mode=>{
    window.__sent=[];window.__sockets=[];window.__serverMode=mode;
    class FakeSocket extends EventTarget {
      static OPEN=1;
      constructor(url){super();this.url=url;this.readyState=0;window.__sockets.push(this);setTimeout(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
      receive(data){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));}
      send(raw){
        const data=JSON.parse(raw);window.__sent.push(data);
        if(data.type==='hello')setTimeout(()=>{
          if(window.__serverMode==='full')this.receive({type:'error',code:'room_full'});
          else this.receive({type:'welcome',player:window.__serverMode==='invalid-player'?2:1,session:'test-resume-session'});
        },0);
      }
      close(){if(this.readyState===3)return;this.readyState=3;this.dispatchEvent(new Event('close'));}
    }
    window.WebSocket=FakeSocket;
  },mode);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(`http://127.0.0.1:${server.address().port}/?room=0123456789abcdef0123456789abcdef`);
  if(mode==='welcome')await page.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
  else await page.waitForFunction(()=>!document.querySelector('#error-actions').hidden);
  return {context,page,errors};
}
const last=page=>page.evaluate(()=>window.__sent.filter(x=>x.type==='input').at(-1));
const send=(page,id,type,pointerId,x=0,y=0)=>page.locator('#'+id).dispatchEvent(type,{pointerId,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y});
function neutral(input){assert.equal(input.x,0);assert.equal(input.y,0);assert.equal(input.aimX,0);assert.equal(input.aimY,0);for(const b of ['a','b','start','select'])assert.equal(input[b],false);}
try{
  const {context,page,errors}=await fixture();
  assert.match(await page.locator('body').innerText(),/单人行动/);
  assert.doesNotMatch(await page.locator('body').innerText(),/双人|合作|人数|玩家 ?[12]|P[12]/);
  assert.equal(await page.locator('#select-caption').innerText(),'切换武器');
  assert.equal(await page.locator('#operator-name').innerText(),'战士已就绪');checks++;
  const hello=await page.evaluate(()=>({frame:window.__sent[0],url:window.__sockets[0].url,stored:sessionStorage.getItem('alien-shooter-controller:0123456789abcdef0123456789abcdef')}));assert.deepEqual(hello.frame,{type:'hello'});assert.match(hello.url,/\/ws\?room=/);assert.equal(hello.stored,'test-resume-session');neutral(await last(page));checks++;
  await send(page,'joystick-zone','pointerdown',11,100,180);await page.waitForTimeout(40);await send(page,'joystick-zone','pointermove',11,170,180);await send(page,'button-a','pointerdown',12,700,100);await page.waitForTimeout(40);await send(page,'button-a','pointermove',12,740,60);await send(page,'button-b','pointerdown',13,700,300);
  let input=await last(page);assert.equal(input.x,1);assert.equal(input.a,true);assert.equal(input.b,true);assert.ok(input.aimX>.6&&input.aimY<-.6);assert.ok(Math.hypot(input.aimX,input.aimY)<=1.001);checks++;
  await send(page,'button-a','pointerup',12,740,60);input=await last(page);assert.equal(input.a,false);assert.equal(input.b,true);assert.equal(input.x,1);assert.equal(input.aimX,0);assert.equal(input.aimY,0);
  let cancelled=input.cancelSeq;await send(page,'button-b','pointercancel',13,700,300);input=await last(page);assert.equal(input.b,false);assert.ok(input.cancelSeq>cancelled);await send(page,'joystick-zone','pointerup',11,170,180);neutral(await last(page));checks++;
  for(const [width,height] of [[844,390],[390,844],[568,320]]){
    await page.setViewportSize({width,height});
    for(const [x,y,action] of [[Math.ceil(width*2/3)+2,2,'a'],[width-2,2,'a'],[width-2,height/2-2,'a'],[Math.ceil(width*2/3)+2,height/2+2,'b'],[width-2,height-2,'b']]){
      const before=await page.evaluate(()=>window.__sent.length);await page.touchscreen.tap(x,y);const frames=await page.evaluate(before=>window.__sent.slice(before).filter(x=>x.type==='input'),before);assert.ok(frames.some(x=>x[action]===true),`${width}x${height} corner ${x}/${y} fires ${action}`);assert.ok(frames.every(x=>x[action==='a'?'b':'a']===false));neutral(await last(page));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'No horizontal overflow');checks++;
  }
  await page.setViewportSize({width:844,height:390});await send(page,'button-a','pointerdown',20,700,100);await page.waitForTimeout(40);await send(page,'button-a','pointermove',20,730,110);await send(page,'button-b','pointerdown',21,700,300);cancelled=(await last(page)).cancelSeq;await page.evaluate(()=>window.dispatchEvent(new Event('blur')));neutral(await last(page));assert.ok((await last(page)).cancelSeq>cancelled);checks++;
  for(const type of ['contextmenu','selectstart','dragstart']){assert.equal(await page.evaluate(type=>{const event=new Event(type,{bubbles:true,cancelable:true});document.getElementById('message').dispatchEvent(event);return event.defaultPrevented;},type),true);}assert.equal(await page.locator('#message').evaluate(el=>getComputedStyle(el).userSelect),'none');checks++;
  await page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'playing',stageLabel:'地下实验室',players:[{id:1,hp:84,ammo:74,weapon:'smg',grenades:3,score:1230}]}));assert.equal(await page.locator('#health').innerText(),'84');assert.equal(await page.locator('#ammo').innerText(),'74');assert.match(await page.locator('#weapon').innerText(),/突击冲锋枪.*手雷 3.*1230/);checks++;
  // Verify the actual model weapon IDs and both locale names rather than invented fixtures.
  for(const weapon of world.weapons){await page.evaluate(weapon=>window.__sockets.at(-1).receive({type:'state',phase:'playing',players:[{id:1,hp:84,ammo:weapon.capacity,weapon:weapon.id,weaponName:'WRONG SERVER LOCALE',grenades:3,score:1230}]}),weapon);assert.match(await page.locator('#weapon').innerText(),new RegExp('^'+weapon.name[0]));}
  await page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'shop',players:[]}));assert.equal(await page.locator('#a-caption').innerText(),'购买补给');assert.equal(await page.locator('#b-caption').innerText(),'下一关');assert.equal(await page.locator('#button-a').isDisabled(),false);checks++;
  await page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'playing',players:[{id:1,hp:84,ammo:74,weapon:'smg',grenades:3,score:1230}]}));assert.match(await page.locator('#a-caption').innerText(),/开火/);
  await page.screenshot({path:resolve(output,'alien-shooter-controller.png')});
  await send(page,'joystick-zone','pointerdown',31,170,240);await page.waitForTimeout(40);await send(page,'joystick-zone','pointermove',31,200,220);await send(page,'button-a','pointerdown',32,700,100);await page.waitForTimeout(40);await send(page,'button-a','pointermove',32,730,70);
  await page.screenshot({path:resolve(output,'alien-shooter-controller-active.png')});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  // Browser pointer capture keeps shooting when a drag crosses into the lower half.
  await page.mouse.move(700,90);await page.mouse.down();await page.mouse.move(720,320,{steps:4});await page.waitForTimeout(40);input=await last(page);assert.equal(input.a,true);assert.equal(input.b,false);assert.ok(input.aimY>.9);await page.mouse.up();neutral(await last(page));checks++;
  // BFCache/pagehide releases before closing, and resume uses the previous token.
  await send(page,'button-b','pointerdown',41,700,300);cancelled=(await last(page)).cancelSeq;
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));neutral(await last(page));assert.ok((await last(page)).cancelSeq>cancelled);assert.equal(await page.evaluate(()=>window.__sockets.at(-1).readyState),3);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForFunction(()=>window.__sockets.length===2&&document.querySelector('#controller').dataset.connected==='true');neutral(await last(page));checks++;
  await page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'gameover',players:[]}));await page.touchscreen.tap(700,100);neutral(await last(page));assert.equal(await page.locator('#button-start').isDisabled(),false);checks++;
  await page.reload();await page.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');assert.equal(await page.evaluate(()=>window.__sent[0].session),'test-resume-session');assert.deepEqual(errors,[]);await context.close();checks++;
  const en=await fixture('en-US');assert.match(await en.page.locator('body').innerText(),/SOLO MISSION/);assert.doesNotMatch(await en.page.locator('body').innerText(),/two players|Player [12]|one \/ two|co-op|P[12]/i);checks++;await en.page.evaluate(()=>window.__sockets.at(-1).receive({type:'state',phase:'playing',stageLabel:'SECTOR 01',players:[{id:1,hp:100,ammo:-1,weapon:'pistol',grenades:3,score:20}]}));assert.equal(await en.page.locator('#ammo').innerText(),'∞');assert.match(await en.page.locator('#a-caption').innerText(),/FIRE.*AIM/);for(const weapon of world.weapons){await en.page.evaluate(weapon=>window.__sockets.at(-1).receive({type:'state',phase:'playing',players:[{id:1,hp:100,ammo:weapon.capacity,weapon:weapon.id,weaponName:'错误服务端语言',grenades:3,score:20}]}),weapon);assert.match(await en.page.locator('#weapon').innerText(),new RegExp('^'+weapon.name[1]));}checks++;await en.page.screenshot({path:resolve(output,'alien-shooter-controller.en.png')});await send(en.page,'joystick-zone','pointerdown',51,160,235);await en.page.waitForTimeout(40);await send(en.page,'joystick-zone','pointermove',51,190,215);await send(en.page,'button-a','pointerdown',52,700,100);await en.page.waitForTimeout(40);await send(en.page,'button-a','pointermove',52,730,70);await en.page.screenshot({path:resolve(output,'alien-shooter-controller-active.en.png')});assert.deepEqual(en.errors,[]);await en.context.close();checks++;
  for(const mode of ['full','invalid-player']) {
    const rejected=await fixture('zh-CN',{width:844,height:390},mode);
    assert.equal(await rejected.page.locator('#controller').getAttribute('data-connected'),'false');
    assert.equal(await rejected.page.locator('#button-a').isDisabled(),true);
    assert.equal(await rejected.page.locator('#button-start').isDisabled(),true);
    await rejected.page.touchscreen.tap(700,100);
    assert.equal(await rejected.page.evaluate(()=>window.__sent.filter(x=>x.type==='input').length),0,'Rejected phone must never send controllable input');
    assert.equal(await rejected.page.evaluate(()=>sessionStorage.getItem('alien-shooter-controller:0123456789abcdef0123456789abcdef')),null);
    if(mode==='full')assert.match(await rejected.page.locator('#message').innerText(),/已有手机连接.*原手机继续/);
    else assert.match(await rejected.page.locator('#message').innerText(),/房间不可用/);
    assert.doesNotMatch(await rejected.page.locator('body').innerText(),/双人|合作|人数|玩家 ?[12]|P[12]/);
    await rejected.page.evaluate(()=>{window.__serverMode='welcome';});
    await rejected.page.locator('#retry').click();
    await rejected.page.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
    neutral(await last(rejected.page));assert.deepEqual(rejected.errors,[]);
    await rejected.context.close();checks++;
  }
  console.log(`PASS ${checks} controller scenarios (handshake/resume, concurrent move+aim+fire+grenade, releases/cancels, 3 viewport edge coverage, blur, selection suppression, telemetry, gameover, localization)`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
