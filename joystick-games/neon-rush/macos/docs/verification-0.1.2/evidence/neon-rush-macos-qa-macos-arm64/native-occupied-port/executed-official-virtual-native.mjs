// Original virtual.html in headless Chromium -> original bridge/SDK -> native Mac app.
// The app is only observed through its read-only diagnostics, never a browser shim.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,list)=>index%2?pairs:[...pairs,[value.replace(/^--/,''),list[index+1]]],[]));
assert.ok(args.url&&args.diagnostics&&args.output&&process.env.PLAYWRIGHT_MODULE,'--url --diagnostics --output and PLAYWRIGHT_MODULE required');
const {chromium}=await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href);
const output=path.resolve(args.output);await mkdir(output,{recursive:true});
const official=fileURLToPath(new URL('../../../../../puretv-joystick/virtual.html',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const state=async()=>JSON.parse(await readFile(path.join(args.diagnostics,'state.json'),'utf8'));
const report={startedAt:new Date().toISOString(),status:'running',method:'Unmodified official virtual page, actual mouse events, unchanged bridge.py and joystick_sdk.py, production native TCP receiver and WKWebView game. Read-only diagnostic observations.',physicalEsp32Tested:false,nativeMacOSAppTested:true,tests:[],inputs:[],requests:[],errors:[]};
let browser,page;
async function until(predicate,label,timeout=15000){const end=Date.now()+timeout;let last;while(Date.now()<end){last=await state();assert.equal(last.active,true,'Native app must remain foreground during headless controller test');if(predicate(last))return last;await delay(80);}throw Error(label+' timeout: '+JSON.stringify(last.game));}
async function test(name,fn){const row={name,status:'running'};report.tests.push(row);try{row.details=await fn();row.status='passed';}catch(error){row.status='failed';row.error=error.stack;throw error;}finally{console.log(name+': '+row.status);}}
async function key(name,hold=100){const button=page.locator('[data-key="'+name+'"]');await button.hover();await page.mouse.down();report.inputs.push({key:name,action:'mouse-down',at:new Date().toISOString()});await delay(hold);await page.mouse.up();report.inputs.push({key:name,action:'mouse-up',at:new Date().toISOString()});}
try{
 browser=await chromium.launch({headless:true});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:760,height:640}});page=await context.newPage();
 await page.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/event'))report.requests.push(request.postDataJSON());});
 const response=await page.goto(args.url);assert.equal(response.status(),200);
 report.originalHtmlSha256=hash(await readFile(official));assert.equal(hash(await response.body()),report.originalHtmlSha256);
 await test('Official connect button synchronizes without resuming native race',async()=>{
  await page.locator('#connect').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('TCP 已连接'));
  const s=await until(s=>s.game.connection.connected&&s.game.connection.controllerKind==='wifi','Official SDK connected');assert.equal(s.game.paused,true);
  return {nativePhase:s.game.phase,paused:s.game.paused};
 });
 await test('Original nine mouse buttons send long holds and START resumes native game',async()=>{
  for(const name of ['UP','DOWN','LEFT','RIGHT','A','B','X','Y','START']){
   const start=report.requests.length;await key(name,650);await delay(120);
   const actions=report.requests.slice(start).filter(event=>event.key===name).map(event=>event.action);
   assert.deepEqual(actions,['down','long_press','long_release'],name);
  }
  const running=await until(s=>!s.game.paused,'Original START resumes');const tick=running.game.tick;
  await until(s=>s.game.tick>tick+5,'Native race advances under official virtual controller');
  await key('START');await until(s=>s.game.paused,'Original START pauses');
  await page.screenshot({path:path.join(output,'official-virtual-controller.png')});
  return {keys:9,longPressHoldMs:650,nativeResumed:true,nativePaused:true};
 });
 await test('Original disconnect and reconnect stay paused until fresh START',async()=>{
  await page.locator('#connect').click();await until(s=>s.game.connection.disconnected,'Official disconnect');
  await page.locator('#connect').click();await until(s=>s.game.connection.connected,'Official reconnect');
  await delay(250);assert.equal((await state()).game.paused,true);
  await key('START');await until(s=>!s.game.paused,'Fresh official START resumes');
  await key('START');await until(s=>s.game.paused,'Fresh official START pauses');
  await page.locator('#connect').click();await until(s=>s.game.connection.disconnected,'Final official disconnect');
  return {reconnectDoesNotStart:true,freshStartRequired:true};
 });
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally{if(browser)await browser.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
