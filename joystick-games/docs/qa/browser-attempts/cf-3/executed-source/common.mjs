import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createFrameStream } from '../../../resource/game-kit/qa/frame-stream.mjs';

const require = createRequire(process.env.PURETV_PACKAGE || '/dev/shm/joystick-qa-deps/package.json');
export const { chromium } = require('playwright');
const { PNG } = require('pngjs');
export const BUTTONS = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const here = path.dirname(fileURLToPath(import.meta.url));

export function argsFrom(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    assert.ok(argv[i].startsWith('--'), 'Expected --argument');
    const key = argv[i].slice(2);
    values[key] = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true;
  }
  return values;
}

export async function inventory(directory) {
  const result = {};
  async function walk(relative = '') {
    for (const item of (await readdir(path.join(directory, relative), { withFileTypes:true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const name = path.join(relative, item.name);
      assert.ok(!item.isSymbolicLink(), 'Assets cannot contain symlinks');
      if (item.isDirectory()) await walk(name);
      else if (item.isFile()) {
        const bytes = await readFile(path.join(directory,name));
        result[name] = { bytes:bytes.length, sha256:hash(bytes) };
      }
    }
  }
  await walk(); return result;
}

export async function makeOutput(output, assets) {
  assert.ok(!output.startsWith(assets + path.sep) && output !== assets, 'Output must be outside assets');
  await mkdir(output, { recursive:true });
  assert.equal((await readdir(output)).length, 0, 'Use a new empty evidence directory');
  await mkdir(path.join(output,'executed-source'));
  for (const item of await readdir(here)) {
    if (item.endsWith('.mjs')) await writeFile(path.join(output,'executed-source',item),await readFile(path.join(here,item)));
  }
}

export async function serve(assets) {
  const server = createServer(async (req,res) => {
    try {
      const decoded = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const name = decoded === '/' ? 'tv.html' : decoded.slice(1);
      assert.ok(name && !name.split('/').some(p => p === '..' || p === '.'), 'Invalid path');
      const file = path.join(assets,name); assert.ok((await stat(file)).isFile());
      const bytes = await readFile(file);
      const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json' }[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(bytes);
    } catch { res.writeHead(req.url === '/favicon.ico' ? 204 : 404);res.end(); }
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  return { url:`http://127.0.0.1:${server.address().port}/`, close:() => new Promise(resolve => server.close(resolve)) };
}

/** Synthetic native input only. No access to a game object, model, score or clock. */
export function installSyntheticHost() {
  const keys = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
  let active = false, identity = 'esp32-qa-browser001', session = 0, calls = 0;
  let held = Object.fromEntries(keys.map(k => [k,false]));
  let pulse = Object.fromEntries(keys.map(k => [k,false]));
  let cancelSeq = 0;
  const info = { platform:'android', language:'zh', version:'0.1.0', addresses:['192.0.2.5'], wifiController:{state:'available',port:63485,serviceName:'QA synthetic game host',inputEnabled:true} };
  window.PureGameHost = Object.freeze({
    snapshot() {
      calls++;
      const buttons = Object.fromEntries(keys.map(k => [k,active && (held[k] || pulse[k])]));
      pulse = Object.fromEntries(keys.map(k => [k,false]));
      const p = {id:1,connected:active,transport:'wifi',controllerId:identity,session:'browser-'+session,cancelSeq,inputActive:true,buttons,
        x:Number(buttons.RIGHT)-Number(buttons.LEFT),y:Number(buttons.DOWN)-Number(buttons.UP),a:buttons.A||buttons.X,b:buttons.B||buttons.Y,start:buttons.START,select:false};
      return JSON.stringify({players:[p],connections:active?1:0,inputActive:true});
    },
    getInfo() { return JSON.stringify(info); }, publish() {}, exit() {}
  });
  window.__syntheticController = Object.freeze({
    connect(id) { identity = id || identity; session++;active = true;held = Object.fromEntries(keys.map(k => [k,false]));pulse = {...held}; },
    disconnect() { active = false;cancelSeq++;held = Object.fromEntries(keys.map(k => [k,false]));pulse = {...held}; },
    buttons(next) {
      for (const k of keys) {
        const down = !!next[k];
        if (down && !held[k]) pulse[k] = true;
        held[k] = down;
      }
    },
    info() { return {calls,active,identity,session,cancelSeq,held:{...held}}; }
  });
}

export async function openBrowser(url, viewport = {width:1280,height:720}, synthetic = true) {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,
    args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling'] });
  const context = await browser.newContext({viewport,locale:'zh-CN',deviceScaleFactor:1});
  if (synthetic) await context.addInitScript(installSyntheticHost);
  const errors = {page:[],console:[],network:[]};
  await context.route('**/*',route => {
    const target = new URL(route.request().url());
    if (target.origin === new URL(url).origin || ['data:','blob:'].includes(target.protocol)) return route.continue();
    errors.network.push({url:target.href,error:'External resource'});return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror',e => errors.page.push(e.stack || e.message));
  page.on('console',e => { if (e.type() === 'error') errors.console.push(e.text()); });
  page.on('response',r => {if(r.status()>=400)errors.network.push({url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>errors.network.push({url:r.url(),error:r.failure()?.errorText}));
  await page.goto(url,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(() => typeof window.JoystickGameQA?.snapshot === 'function',null,{timeout:120000});
  await page.evaluate(async () => {await document.fonts.ready;await new Promise(requestAnimationFrame);});
  return {browser,context,page,errors,version:await browser.version()};
}

export const snapshot = page => page.evaluate(() => JSON.parse(JSON.stringify(window.JoystickGameQA.snapshot())));
export async function until(page, predicate, timeout=30000) {
  const began = performance.now(); let value;
  while (performance.now()-began < timeout) {
    value = await snapshot(page); if(predicate(value))return value; await delay(100);
  }
  throw new Error('Game state timeout: '+JSON.stringify(value).slice(0,3500));
}
export async function setButtons(page,buttons) {
  assert.ok(buttons.every(b => BUTTONS.includes(b)), 'Unsupported physical button');
  await page.evaluate(keys => window.__syntheticController.buttons(Object.fromEntries(keys.map(k=>[k,true]))),buttons);
}
export async function press(page,buttons,ms=240) {
  const before=await snapshot(page), keys=Array.isArray(buttons)?buttons:[buttons];
  await setButtons(page,keys);
  // The software renderer may take longer than a nominal tap interval. Wait for
  // a real consumer frame; never drive RAF or alter simulation time in QA.
  await until(page,s=>s.controller?.pollCount>before.controller.pollCount,30000);
  await delay(ms);
  const held=await snapshot(page);await setButtons(page,[]);
  await until(page,s=>s.controller?.pollCount>held.controller.pollCount,30000);
}
export async function keyboardTap(page,key,ms=120) {
  await page.keyboard.down(key);await delay(ms);await page.keyboard.up(key);await delay(180);
}

export async function imageEvidence(page,output,name) {
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);});
  const file=path.join(output,name+'.png'); const bytes=await page.screenshot({path:file});
  const png=PNG.sync.read(bytes),colors=new Set();
  for(let i=0;i<png.data.length;i+=4*83)colors.add((png.data[i]>>3)+','+(png.data[i+1]>>3)+','+(png.data[i+2]>>3));
  assert.ok(colors.size>15,'Capture must contain rendered content');
  return {file:name+'.png',bytes:bytes.length,sha256:hash(bytes),width:png.width,height:png.height,sampledColors:colors.size,visualReviewCompleted:false};
}

export async function layout(page) {
  return page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const visible=e=>{if(!e)return false;const r=rect(e);return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';};
    return {viewport:{width:innerWidth,height:innerHeight},body:{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},
      canvas:[...document.querySelectorAll('canvas')].filter(visible).map(rect),
      cards:[...document.querySelectorAll('[data-puretv-controller-id]')].filter(visible).map(e=>{const id=e.querySelector('[data-puretv-controller-id-text]');const range=document.createRange();if(id)range.selectNodeContents(id);return {id:e.getAttribute('data-puretv-controller-id'),seat:e.getAttribute('data-player-id'),rect:rect(e),text:id?.textContent,icon:visible(e.querySelector('svg')),textRects:id?[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom})):[]};}),
      focus:document.activeElement?.textContent?.slice(0,150),controls:[...document.querySelectorAll('button,[tabindex],input,select')].filter(visible).map(e=>({text:(e.textContent||e.getAttribute('aria-label')||e.id).trim().slice(0,150),rect:rect(e)}))};
  });
}
export function assertLayout(data,identity) {
  assert.ok(data.canvas.some(r=>r.width>data.viewport.width*.3&&r.height>data.viewport.height*.3),'Actual game canvas visible');
  assert.ok(data.body.scrollWidth<=data.viewport.width+1,'No horizontal page overflow');
  assert.ok(data.body.scrollHeight<=data.viewport.height+1,'No vertical page overflow');
  if(identity){const card=data.cards.find(c=>c.id===identity);assert.ok(card,'Connected device card visible');assert.ok(card.icon,'Controller icon visible');assert.equal(card.text,'ID: '+identity);
    for(const r of [card.rect,...card.textRects])assert.ok(r.left>=-1&&r.top>=-1&&r.right<=data.viewport.width+1&&r.bottom<=data.viewport.height+1,'Complete ID is inside viewport');}
}

function command(program,args) {
  return new Promise((resolve,reject)=>{const proc=spawn(program,args,{stdio:['ignore','ignore','pipe']});let err='';proc.stderr.on('data',d=>{err+=d;});proc.on('error',reject);proc.on('close',code=>code===0?resolve(err):reject(new Error(program+' exit '+code+'\n'+err)));});
}

export async function startRecording(page,output) {
  const dir=path.join(output,'recording'),framesDir=path.join(dir,'frames');await mkdir(framesDir,{recursive:true});
  const cdp=await page.context().newCDPSession(page),frames=[],writes=[];
  const stream=createFrameStream({acknowledge:sessionId=>cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{})});
  cdp.on('Page.screencastFrame',event=>{
    const bytes=Buffer.from(event.data,'base64');const frame=stream.observe({timestamp:event.metadata.timestamp,receivedAt:Date.now(),sha256:hash(bytes),sessionId:event.sessionId});
    if(frame){frames.push(frame);writes.push(writeFile(path.join(framesDir,frame.file),bytes));}
  });
  const startedAt=new Date().toISOString(),start=performance.now();
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:65,maxWidth:960,maxHeight:540,everyNthFrame:1});
  return async function stopRecording() {
    await cdp.send('Page.stopScreencast');stream.stop();await Promise.all(writes);await cdp.detach();
    const elapsed=(performance.now()-start)/1000;assert.ok(frames.length>=2,'Need actual recorded frames');
    const concat=[];for(let i=0;i<frames.length;i++){concat.push("file 'frames/"+frames[i].file+"'");if(i<frames.length-1)concat.push('duration '+(frames[i+1].timestamp-frames[i].timestamp).toFixed(6));}
    concat.push("file 'frames/"+frames.at(-1).file+"'");await writeFile(path.join(dir,'frames.txt'),concat.join('\n')+'\n');
    await command('ffmpeg',['-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',path.join(dir,'frames.txt'),'-vf','fps=30,scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-preset','veryfast','-crf','27','-pix_fmt','yuv420p','-an',path.join(dir,'gameplay.mp4')]);
    await command('ffmpeg',['-hide_banner','-loglevel','error','-i',path.join(dir,'gameplay.mp4'),'-f','null','-']);
    const video=await readFile(path.join(dir,'gameplay.mp4'));const result={startedAt,wallClockSeconds:elapsed,capturedSeconds:frames.at(-1).timestamp-frames[0].timestamp,frames,frameAdmission:stream.stats(),video:{file:'gameplay.mp4',bytes:video.length,sha256:hash(video),fullDecodePassed:true,audio:false,exportFramesPerSecond:30},note:'Actual CDP captures; no model writes or clock overrides. Export frame rate does not claim device frame rate.'};
    await writeFile(path.join(dir,'recording.json'),JSON.stringify(result,null,2)+'\n');return result;
  };
}
