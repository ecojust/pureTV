// Runs the packaged TV/phone UI with a simulated Android room bridge.
// Screenshots are real browser renders, not physical-TV captures.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const kind = 'tank', api = 'TankTV', bridge = 'TankHost';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const { chromium } = require('playwright');
const assets = fileURLToPath(new URL('../src/main/assets/', import.meta.url));
const artwork = kind === 'jackal' ? resolve(process.env.JACKAL_ART_DIR || resolve(assets, 'art')) : null;
if (artwork) {
  try { await stat(resolve(artwork, 'levels/sprites.json')); }
  catch { throw new Error('Jackal artwork is unavailable. Set JACKAL_ART_DIR to the local reference-art directory, or provide packaged assets/art/. This test does not download artwork.'); }
}
const qr = `data:image/svg+xml;base64,${(await readFile(new URL('fixtures/room-preview.svg', import.meta.url))).toString('base64')}`;
const output = resolve(process.env[`${kind.toUpperCase()}_UI_CAPTURE_DIR`] || `/tmp/puretv-${kind}-previews`);
await mkdir(output, { recursive: true });
const types = {'.js':'application/javascript','.json':'application/json','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
    if (pathname === 'favicon.ico') { response.writeHead(204).end(); return; }
    const isArt = artwork && pathname.startsWith('art/');
    const root = isArt ? artwork : assets;
    const file = resolve(root, isArt ? pathname.slice(4) : pathname || 'controller.html');
    const rel = relative(root, file);
    if (rel === '..' || rel.startsWith('..' + sep) || !types[extname(file)]) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', types[extname(file)]);
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const failures = [];
async function context(options) {
  const ctx = await browser.newContext(options);
  await ctx.route('**/*', route => {
    if (route.request().url().startsWith(base + '/') || /^(data:|blob:)/.test(route.request().url())) return route.continue();
    failures.push(`Unexpected external request: ${route.request().url()}`); return route.abort();
  });
  return ctx;
}
async function press(page, id, pointerId=1, coordinates={}) {
  await page.locator('#'+id).dispatchEvent('pointerdown',{pointerId,pointerType:'touch',button:0,buttons:1,...coordinates});
}
async function release(page, id, pointerId=1) {
  await page.locator('#'+id).dispatchEvent('pointerup',{pointerId,pointerType:'touch',button:0,buttons:0});
}
async function tap(page,id) { await press(page,id); await page.waitForTimeout(100); await release(page,id); await page.waitForTimeout(100); }
async function phase(page, value) { await page.waitForFunction(({api,value})=>window[api]?.game?.phase===value,{api,value},{timeout:20000}); }
async function captureTv(page, path) {
  // Wait for layout, image decoding and two compositor opportunities after resize.
  // Check pixels in the resulting PNG as well as DOM bounds: a headless capture
  // can otherwise silently omit static text while keeping the animated canvas.
  const regions=await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].filter(image=>!image.hidden).map(image=>image.decode()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return ['room-brand','room-qr','scan-title','menu-help'].map(id=>{
      const box=document.getElementById(id).getBoundingClientRect();
      return {id,x:Math.floor(box.x),y:Math.floor(box.y),width:Math.ceil(box.width),height:Math.ceil(box.height)};
    });
  });
  const png=await page.screenshot({path,animations:'disabled'});
  const painted=await page.evaluate(async({data,regions})=>{
    const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    return regions.map(region=>{
      const pixels=ctx.getImageData(region.x,region.y,region.width,region.height).data;
      let nonBlack=0;for(let offset=0;offset<pixels.length;offset+=4)if(Math.max(pixels[offset],pixels[offset+1],pixels[offset+2])>64)nonBlack++;
      return {...region,nonBlack};
    });
  },{data:png.toString('base64'),regions});
  for(const region of painted)assert.ok(region.nonBlack>(region.id==='room-qr'?region.width*region.height*.2:20),`Screenshot omitted ${region.id}: ${path} (${JSON.stringify(region)})`);
}
async function positions(page) {
  return page.evaluate(api=>{
    const game=window[api].game;
    return {players:game.players.map(p=>[p.x,p.y,p.lives]),enemies:game.enemies.map(p=>[p.x,p.y,p.hp]),bullets:game.bullets.map(p=>[p.x,p.y])};
  },api);
}
let scenarios=0;
try {
  for (const language of ['zh','en']) {
    const suffix=language==='en'?'.en':'';
    const tvContext=await context({viewport:{width:1280,height:720},locale:language==='zh'?'zh-CN':'en-US'});
    await tvContext.addInitScript(({language,qr,bridge})=>{
      window.__audioContexts=[];window.__audioStarts=0;
      const NativeAudioContext=window.AudioContext;
      if(NativeAudioContext)window.AudioContext=class extends NativeAudioContext {
        constructor(...args){super(...args);window.__audioContexts.push(this);}
        createOscillator(){const node=super.createOscillator(),start=node.start.bind(node);node.start=(...args)=>{window.__audioStarts++;return start(...args);};return node;}
        createBufferSource(){const node=super.createBufferSource(),start=node.start.bind(node);node.start=(...args)=>{window.__audioStarts++;return start(...args);};return node;}
      };
      window.__inputs=[1,2].map(id=>({id,connected:false,x:0,y:0,a:false,b:false,start:false,select:false}));
      window[bridge]={
        getInfo:()=>JSON.stringify({language,qr,url:'http://192.168.1.88:38291/?room=preview-room-token-for-capture',addresses:['192.168.1.88']}),
        snapshot:()=>JSON.stringify({players:window.__inputs}),
        publish:raw=>{window.__lastState=JSON.parse(raw);}
      };
    },{language,qr,bridge});
    const tv=await tvContext.newPage();
    const errors=[];
    tv.on('pageerror',error=>errors.push(error.message));
    tv.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    await tv.goto(base+'/tv.html');
    await tv.waitForFunction(api=>window[api]?.game && window.__lastState,api,{timeout:20000});
    assert.equal(await tv.locator('#game-loading').isHidden(),true,'Artwork and game model load successfully');
    await phase(tv,'title');
    assert.deepEqual(await tv.locator('#battlefield').evaluate(canvas=>({width:canvas.width,height:canvas.height,smoothing:canvas.getContext('2d').imageSmoothingEnabled,rendering:getComputedStyle(canvas).imageRendering})),{width:256,height:240,smoothing:false,rendering:'pixelated'});
    const world=await tv.evaluate(({api,kind})=>{const game=window[api].game;return kind==='tank'?[game.map[0].length*4,game.map.length*4]:[game.worldWidth,game.worldHeight];},{api,kind});
    assert.deepEqual(world,kind==='tank'?[208,208]:[512,3120],'Native gameplay coordinates match the model');
    await captureTv(tv,resolve(output,`${kind}-title${suffix}.png`));

    const phoneContext=await context({viewport:{width:844,height:390},locale:language==='zh'?'zh-CN':'en-US',hasTouch:true});
    await phoneContext.exposeBinding('__roomMessage',async (_source,message)=>{
      return tv.evaluate(({message})=>{
        const player=window.__inputs[0];
        if(message.type==='hello') { player.connected=true; return window.__lastState; }
        if(message.type==='input') Object.assign(player,{connected:true,x:message.x,y:message.y,a:!!message.a,b:!!message.b,start:!!message.start,select:!!message.select});
        if(message.type==='closed') Object.assign(player,{connected:false,x:0,y:0,a:false,b:false,start:false,select:false});
        return null;
      },{message});
    });
    await phoneContext.addInitScript(()=>{
      window.__networkAvailable=true;window.__sockets=[];
      class RoomSocket extends EventTarget {
        static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
        constructor(){super();this.readyState=0;this.queue=Promise.resolve();window.__sockets.push(this);setTimeout(()=>{if(!window.__networkAvailable){this.close();return;}this.readyState=1;this.dispatchEvent(new Event('open'));},0);}
        receive(data){if(this.readyState===1)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));}
        send(raw){const message=JSON.parse(raw);this.queue=this.queue.then(()=>window.__roomMessage(message)).then(state=>{if(message.type==='hello'){this.receive({type:'welcome',player:1,session:'capture-player-1',heartbeatMs:250});this.receive({type:'state',...state});}});}
        close(){if(this.readyState===3)return;this.readyState=3;this.queue=this.queue.then(()=>window.__roomMessage({type:'closed'}));this.dispatchEvent(new Event('close'));}
      }
      window.WebSocket=RoomSocket;
    });
    const phone=await phoneContext.newPage();
    phone.on('pageerror',error=>errors.push(error.message));
    await phone.goto(base+'/controller.html?room=preview-room-token-for-capture');
    await phone.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
    await tap(phone,'button-select');
    await tv.waitForFunction(({api,kind})=>kind==='tank'?window[api].game.menuIndex===1:window[api].game.selectedPlayers===2,{api,kind});
    await tv.evaluate(()=>{window.__inputs[1].connected=true;});
    await captureTv(tv,resolve(output,`${kind}-title-2p${suffix}.png`));
    await tap(phone,'button-start');
    if(kind==='tank') { await phase(tv,'stageintro'); await tap(phone,'button-start'); }
    await phase(tv,'playing');
    await tv.waitForFunction(api=>window[api].game.players.every(p=>p.joined&&p.alive&&!p.spawnFrames),api);
    await captureTv(tv,resolve(output,`${kind}-playing${suffix}.png`));
    console.log(`PREVIEW ${resolve(output,`${kind}-playing${suffix}.png`)}`);
    await tv.waitForFunction(()=>window.__audioStarts>0&&window.__audioContexts.some(audio=>audio.state==='running'));


    // Observe accepted weapon actions without changing their rules or their return values.
    await tv.evaluate(api=>{
      const game=window[api].game;window.__shots={fire:0,throwGrenade:0};
      for(const name of Object.keys(window.__shots))if(typeof game[name]==='function'){
        const original=game[name];game[name]=function(...args){const result=original.apply(this,args);if(result&&args[0]?.id===1)window.__shots[name]++;return result;};
      }
    },api);
    const before=await tv.evaluate(api=>window[api].game.players[0].y,api);
    const stick=await phone.locator('#joystick').boundingBox();
    await press(phone,'joystick',11,{clientX:stick.x+stick.width/2,clientY:stick.y});
    await tv.waitForFunction(({api,before})=>window[api].game.players[0].y<before,{api,before});
    await release(phone,'joystick',11);
    await tap(phone,'button-a');
    await tv.waitForFunction(kind=>window.__shots[kind==='tank'?'fire':'throwGrenade']>0,kind);
    await tv.waitForTimeout(550);
    if(kind==='tank')await tv.waitForFunction(api=>!window[api].game.bullets.some(bullet=>bullet.owner===1),api,{timeout:5000});
    const shots=await tv.evaluate(()=>window.__shots.fire);
    await press(phone,'button-b');
    await tv.waitForFunction(shots=>window.__shots.fire>shots,shots,{timeout:5000});
    await release(phone,'button-b');
    await tap(phone,'button-start'); await phase(tv,'paused');
    const paused=await positions(tv); await tv.waitForTimeout(150);
    assert.deepEqual(await positions(tv),paused,'Phone START freezes gameplay');
    await tap(phone,'button-start'); await phase(tv,'playing');

    await tv.evaluate(()=>{window.__inputs[1].connected=false;});
    await phone.evaluate(()=>{window.__networkAvailable=false;window.__sockets.at(-1).close();});
    await phase(tv,'paused');
    const disconnected=await positions(tv); await tv.waitForTimeout(150);
    assert.deepEqual(await positions(tv),disconnected,'Losing all controllers freezes gameplay');
    assert.deepEqual(await tv.evaluate(()=>{const {x,y,a,b,start,select}=window.__inputs[0];return{x,y,a,b,start,select};}),{x:0,y:0,a:false,b:false,start:false,select:false});
    await phone.reload();
    await phone.waitForFunction(()=>document.querySelector('#controller').dataset.connected==='true');
    await phase(tv,'playing');
    await tv.evaluate(()=>{window.__inputs[1].connected=true;});

    // Android dispatches these exact key names for physical NES START/SELECT buttons.
    await tv.evaluate(api=>window[api].key('Start',true),api); await phase(tv,'paused');
    await tv.evaluate(api=>window[api].key('Start',false),api); await tv.waitForTimeout(100);
    await tv.evaluate(api=>window[api].key('Start',true),api); await phase(tv,'playing');
    await tv.evaluate(api=>window[api].key('Start',false),api); await tv.waitForTimeout(100);
    await tv.evaluate(api=>window[api].suspend(true),api);
    const suspended=await tv.evaluate(api=>({frame:window[api].game.frame,players:window[api].game.players.map(p=>[p.x,p.y])}),api);
    await tv.waitForTimeout(150);
    assert.deepEqual(await tv.evaluate(api=>({frame:window[api].game.frame,players:window[api].game.players.map(p=>[p.x,p.y])}),api),suspended,'Android exit confirmation suspends all game ticks');
    assert.ok(await tv.evaluate(()=>window.__audioContexts.every(audio=>audio.state==='suspended')),'Exit confirmation also suspends audio');
    await tv.evaluate(api=>window[api].suspend(false),api);

    assert.equal(await tv.locator('#room-qr').evaluate(img=>img.complete&&img.naturalWidth>0),true);
    if(language==='en')assert.doesNotMatch(await tv.locator('body').innerText(),/[\u3400-\u9fff]/,'English TV UI contains no untranslated Chinese');
    for(const [width,height] of [[720,480],[960,540],[1280,720],[1920,1080]]) {
      await tv.setViewportSize({width,height});
      const bounds=await tv.locator('.sidebar').evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth}));
      assert.ok(bounds.top>=0&&bounds.bottom<=height+.5,`Sidebar fits ${width}x${height}: ${JSON.stringify(bounds)}`);
      assert.ok(bounds.scrollHeight<=height&&bounds.scrollWidth<=width,`No page scrolling at ${width}x${height}`);
      const screen=await tv.locator('#battlefield').boundingBox();
      assert.ok(Math.abs(screen.width/screen.height-256/240)<.005,`NES aspect ratio at ${width}x${height}`);
      assert.ok(screen.x>=0&&screen.y>=0&&screen.x+screen.width<=width+.5&&screen.y+screen.height<=height+.5,`Whole NES frame visible at ${width}x${height}`);
      await captureTv(tv,resolve(output,`${kind}-tv-${width}x${height}${suffix}.png`));
    }
    await tv.setViewportSize({width:1280,height:720});
    await captureTv(tv,resolve(output,`${kind}-tv${suffix}.png`));
    await phone.evaluate(state=>window.__sockets.at(-1).receive({type:'state',...state}),await tv.evaluate(()=>window.__lastState));
    assert.equal(await phone.locator('#button-start').isEnabled(),true);
    assert.equal(await phone.locator('#button-select').isEnabled(),true);
    if(language==='en')assert.doesNotMatch(await phone.locator('body').innerText(),/[\u3400-\u9fff]/,'English phone UI contains no untranslated Chinese');
    await phone.screenshot({path:resolve(output,`${kind}-controller${suffix}.png`)});
    // Stop the mock phone before navigating its paired TV. Pending heartbeat
    // bindings otherwise evaluate into the destroyed TV execution context.
    await phone.evaluate(async()=>{
      window.dispatchEvent(new PageTransitionEvent('pagehide'));
      await Promise.all(window.__sockets.map(socket=>socket.queue));
    });
    // Reload resets the keyboard-connected flag; test native SELECT independently of phone input.
    await tv.reload(); await phase(tv,'title');
    await tv.evaluate(api=>window[api].key('Select',true),api);
    await tv.waitForFunction(({api,kind})=>kind==='tank'?window[api].game.menuIndex===1:window[api].game.selectedPlayers===2,{api,kind});
    await tv.evaluate(api=>window[api].key('Select',false),api);
    await tv.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
    const exitFrame=await tv.evaluate(api=>window[api].game.frame,api);
    await tv.waitForTimeout(150);
    assert.equal(await tv.evaluate(api=>window[api].game.frame,api),exitFrame,'Leaving the WebView stops animation ticks');
    assert.ok(await tv.evaluate(()=>window.__audioContexts.length>0&&window.__audioContexts.every(audio=>audio.state==='closed')),'Leaving the WebView closes audio contexts');
    assert.deepEqual(errors,[],'No runtime errors or missing local resources');
    await phoneContext.close(); await tvContext.close();
    scenarios++; console.log(`PASS ${kind} ${language}: title, START/SELECT, phone movement and A/B, pause, disconnect/reconnect, exit suspension, four TV sizes`);
  }
  assert.deepEqual(failures,[],'Captures use only local assets');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
console.log(`${scenarios} bilingual integration scenarios passed. Screenshots: ${output}`);
