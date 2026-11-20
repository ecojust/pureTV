const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const root='/dev/shm/puretv-submit/joystick-games/turbo-kart-rush',out=process.argv[2],frozen=process.argv[3];
fs.mkdirSync(out,{recursive:true});fs.copyFileSync(__filename,path.join(out,'executed-browser.cjs'));
const report={startedAt:new Date().toISOString(),scope:'Synthetic PureGameHost bridge; normal menu/actions only; original model, clock and renderer quality unchanged. No SDK TCP/native package acceptance.',physicalTvTested:false,physicalPhoneTested:false,nativeSdkTested:false,events:[],requests:[],errors:[],checks:[],status:'running',frozen:JSON.parse(fs.readFileSync(path.join(frozen,'manifest.json')))};
let browser,page,server;const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
const snapshot=()=>page.evaluate(()=>window.JoystickGameQA?.snapshot());
const wait=async(fn,arg,timeout=120000)=>page.waitForFunction(fn,arg,{timeout});
const keys=async(value)=>page.evaluate(value=>window.__bridge.keys=value,value);
async function pulse(value){const before=await snapshot();await keys(value);await wait(({n,keys})=>{const s=window.JoystickGameQA.snapshot();return s.controller.pollCount>n&&keys.every(k=>s.controller.buttons[k]);},{n:before.controller.pollCount,keys:value});await keys([]);const held=await snapshot();await wait(n=>{const s=window.JoystickGameQA.snapshot();return s.controller.pollCount>n&&!Object.values(s.controller.buttons).some(Boolean);},held.controller.pollCount);}
async function checkpoint(name){const value=await snapshot();const row={name,at:new Date().toISOString(),snapshot:value};report.events.push(row);save();await page.screenshot({path:path.join(out,name+'.png'),timeout:45000});row.screenshot=name+'.png';row.sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,name+'.png'))).digest('hex');row.layout=await page.evaluate(()=>{const p=document.querySelector('#puretv-controller-panel'),r=p.getBoundingClientRect();const buttons=[...document.querySelectorAll('button')].filter(b=>{const s=getComputedStyle(b);return s.visibility!=='hidden'&&s.display!=='none'&&parseFloat(s.opacity)>0&&b.getBoundingClientRect().width>0;}).map(b=>{const a=b.getBoundingClientRect();return{text:b.textContent.trim(),x:a.x,y:a.y,width:a.width,height:a.height,overlapsPanel:Math.max(r.left,a.left)<Math.min(r.right,a.right)&&Math.max(r.top,a.top)<Math.min(r.bottom,a.bottom)};});return{viewport:[innerWidth,innerHeight],panel:{x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight},buttons};});save();console.log(name,JSON.stringify({stage:value.stage,mode:value.gameplay.mode,screen:value.gameplay.screen,frames:value.frames,speed:value.gameplay.speed}));return value;}
async function resize(width,height){const n=(await snapshot()).frames;await page.setViewportSize({width,height});await wait(n=>window.JoystickGameQA.snapshot().frames>n,n);}
(async()=>{try{
 server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'tv.html';if(name.includes('/')||name.includes('..')){res.writeHead(404);res.end();return;}const file=path.join(frozen,'dist',name);if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'text/plain');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(18266,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('request',r=>{report.requests.push(r.url());save();});await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:18266/')||route.request().url().startsWith('data:')?route.continue():route.abort());
 await page.addInitScript(()=>{window.__bridge={keys:[],connected:true,session:'browser-a',cancelSeq:0,polls:0};window.PureGameHost={getInfo:()=>JSON.stringify({wifiController:{port:63485,serviceName:'Turbo Kart Rush',addresses:['192.0.2.1'],state:'listening'}}),snapshot:()=>{window.__bridge.polls++;return JSON.stringify({players:window.__bridge.connected?[{id:1,controllerId:'rush-test-controller-960-long-id',session:window.__bridge.session,cancelSeq:window.__bridge.cancelSeq,connected:true,transport:'wifi',buttons:Object.fromEntries(['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'].map(k=>[k,window.__bridge.keys.includes(k)]))}]:[]});}};});
 await page.goto('http://127.0.0.1:18266/tv.html',{waitUntil:'commit',timeout:30000});await wait(()=>window.JoystickGameQA?.snapshot().frames>2,null,150000);
 await checkpoint('01-title-960');
 await pulse(['START']);await wait(()=>window.JoystickGameQA.snapshot().gameplay.mode==='characterSelect');
 await checkpoint('02-character-960');await resize(1280,720);await checkpoint('03-character-1280');await resize(960,540);
 await pulse(['RIGHT']);await pulse(['A']);await wait(()=>window.JoystickGameQA.snapshot().gameplay.mode==='trackSelect');
 await checkpoint('04-track-960');await pulse(['START']);await wait(()=>window.JoystickGameQA.snapshot().gameplay.mode==='racing',null,240000);
 const grid=await snapshot();await keys(['UP']);await wait(()=>window.JoystickGameQA.snapshot().gameplay.speed>8,null,150000);
 const driving=await checkpoint('05-drive-960');assert.ok(Math.hypot(driving.gameplay.playerX-grid.gameplay.playerX,driving.gameplay.playerZ-grid.gameplay.playerZ)>0.1);
 report.checks.push({name:'normal throttle changes original position and speed',passed:true,before:grid,after:driving});save();
 await resize(1280,720);await checkpoint('06-drive-1280');await resize(960,540);
 await keys(['UP','X']);await wait(()=>window.JoystickGameQA.snapshot().gameplay.lookBack);const looking=await snapshot();await keys([]);
 await pulse(['Y']);assert.equal((await snapshot()).gameplay.helpOpen,true);await checkpoint('06b-help-960');
 await pulse(['Y']);assert.equal((await snapshot()).gameplay.helpOpen,false);
 report.checks.push({name:'X looks back and Y toggles help independently from movement/drift/item',passed:true,lookBack:looking});save();
 await pulse(['START']);const paused=await checkpoint('07-paused-960');assert.equal(paused.paused,true);
 await wait(n=>window.JoystickGameQA.snapshot().frames>n+2,paused.frames);const stable=await snapshot();
 for(const k of ['time','countdown','playerX','playerY','playerZ','speed','heading','progress','lap','boost'])assert.equal(stable.gameplay[k],paused.gameplay[k],k);
 report.checks.push({name:'pause freezes original simulation while rendered/controller frames advance',passed:true,before:paused,after:stable});save();
 await keys(['START']);await wait(()=>!window.JoystickGameQA.snapshot().paused);const resumed=await snapshot();
 await page.waitForTimeout(800);await wait(n=>window.JoystickGameQA.snapshot().frames>n+3,resumed.frames);const heldStart=await snapshot();
 assert.equal(heldStart.paused,false);assert.equal(heldStart.controller.buttons.START,true);assert.equal(heldStart.controller.pressed.START,false);
 report.checks.push({name:'holding resume START for >=800ms and >=4 actual frames does not re-pause',passed:true,before:resumed,after:heldStart});save();
 await keys([]);await wait(()=>!window.JoystickGameQA.snapshot().controller.buttons.START);await checkpoint('08-resume-held-start-960');
 await keys(['UP','LEFT','A']);await wait(()=>window.JoystickGameQA.snapshot().controller.buttons.A);await wait(()=>window.JoystickGameQA.snapshot().gameplay.driftActive,null,90000);
 await checkpoint('09-drift-960');const beforeDisconnect=await page.evaluate(()=>{const state=window.JoystickGameQA.snapshot();window.__bridge.connected=false;return state;});
 assert.equal(beforeDisconnect.gameplay.driftActive,true);await wait(()=>window.JoystickGameQA.snapshot().paused);const disconnected=await checkpoint('10-disconnected-paused');
 assert.equal(disconnected.gameplay.driftActive,false);assert.equal(disconnected.gameplay.itemPending,false);assert.equal(disconnected.gameplay.boost,beforeDisconnect.gameplay.boost);
 report.checks.push({name:'disconnect cancels active original drift without release boost',passed:true,before:beforeDisconnect,after:disconnected});save();
 await page.evaluate(()=>{window.__bridge.connected=true;window.__bridge.session='browser-b';});await wait(()=>window.JoystickGameQA.snapshot().controller.connected);
 const reconnect=await snapshot();assert.equal(reconnect.paused,true);assert.equal(reconnect.controller.buttons.A,false);
 await keys([]);const neutralPoll=(await snapshot()).controller.pollCount;await wait(n=>{const s=window.JoystickGameQA.snapshot();return s.controller.pollCount>n&&!Object.values(s.controller.buttons).some(Boolean);},neutralPoll);
 await pulse(['START']);await wait(()=>!window.JoystickGameQA.snapshot().paused);await checkpoint('11-manual-resume-960');
 await page.evaluate(()=>window.PureGame.focus(false));await wait(()=>window.JoystickGameQA.snapshot().paused);await page.evaluate(()=>window.PureGame.focus(true));assert.equal((await snapshot()).paused,true);
 await checkpoint('12-focus-paused');
 report.readOnlyPeek=await page.evaluate(()=>{const before=window.__bridge.polls;for(let i=0;i<20;i++)window.JoystickGameQA.snapshot();return{before,after:window.__bridge.polls,snapshot:window.JoystickGameQA.snapshot()};});assert.equal(report.readOnlyPeek.before,report.readOnlyPeek.after);assert.equal(report.errors.length,0);report.status='completed';report.passed=report.checks.every(c=>c.passed);
 }catch(error){report.status='failed';report.passed=false;report.failure=String(error.stack||error);try{report.lastSnapshot=await snapshot();await page.screenshot({path:path.join(out,'failure.png'),timeout:20000});}catch(e){report.captureFailure=String(e);}}
 finally{report.endedAt=new Date().toISOString();save();if(browser)await browser.close();if(server)server.close();if(report.status!=='completed')process.exitCode=1;}})();
