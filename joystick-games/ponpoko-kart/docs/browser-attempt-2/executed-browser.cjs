const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const report={startedAt:new Date().toISOString(),scope:'Synthetic PureGameHost bridge; original model/time/physics untouched. Not SDK TCP or native platform acceptance.',events:[],requests:[],errors:[],status:'running'};
let browser,page;
fs.copyFileSync(__filename,path.join(out,'executed-browser.cjs'));
report.dist=Object.fromEntries(fs.readdirSync('/dev/shm/puretv-submit/joystick-games/ponpoko-kart/dist').map(name=>{const b=fs.readFileSync('/dev/shm/puretv-submit/joystick-games/ponpoko-kart/dist/'+name);return [name,{bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}]}));
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
save();
const snapshot=()=>page.evaluate(()=>window.JoystickGameQA?.snapshot());
async function checkpoint(name,shot=true){const value=await snapshot();report.events.push({name,at:new Date().toISOString(),snapshot:value});save();if(shot){await page.screenshot({path:path.join(out,name+'.png'),timeout:30000});report.events.at(-1).bounds=await page.evaluate(()=>{const p=document.querySelector('#puretv-controller-panel'),r=p.getBoundingClientRect();return {viewport:[innerWidth,innerHeight],panel:{x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight},fonts:['Dela Gothic One','M PLUS Rounded 1c','Yuji Syuku'].map(n=>({name:n,loaded:document.fonts.check('16px \"'+n+'\"')}))};});report.events.at(-1).screenshot=name+'.png';save();}console.log(name,JSON.stringify({stage:value?.stage,mode:value?.gameplay?.mode,screen:value?.gameplay?.screen,frames:value?.frames,speed:value?.gameplay?.speed}));return value;}
async function press(keys,ms=120){const before=await snapshot();await page.evaluate(keys=>window.__bridge.keys=keys,keys);await page.waitForFunction(n=>window.JoystickGameQA.snapshot().controller.pollCount>n,(before?.controller?.pollCount||0),{timeout:50000});await page.waitForTimeout(ms);await page.evaluate(()=>window.__bridge.keys=[]);const pressed=await snapshot();await page.waitForFunction(n=>window.JoystickGameQA.snapshot().controller.pollCount>n,pressed.controller.pollCount,{timeout:50000});}
(async()=>{try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.setDefaultTimeout(50000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('request',r=>{report.requests.push(r.url());save();});
 await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:18264/')||route.request().url().startsWith('data:')?route.continue():route.abort());
 await page.addInitScript(()=>{window.__bridge={keys:[],connected:true,session:'browser-a',cancelSeq:0,polls:0};window.PureGameHost={getInfo:()=>JSON.stringify({wifiController:{port:63485,serviceName:'Ponpoko Kart',addresses:['192.0.2.1'],state:'listening'}}),snapshot:()=>{window.__bridge.polls++;return JSON.stringify({players:window.__bridge.connected?[{id:1,controllerId:'ponpoko-test-controller-1280',session:window.__bridge.session,cancelSeq:window.__bridge.cancelSeq,connected:true,transport:'wifi',buttons:Object.fromEntries(['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'].map(k=>[k,window.__bridge.keys.includes(k)]))}]:[]});}};});
 await page.goto('http://127.0.0.1:18264/tv.html',{waitUntil:'commit',timeout:30000});
 await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().frames>2,null,{timeout:120000});
 await checkpoint('01-title');await press(['START']);await checkpoint('02-character');
 await press(['RIGHT']);await press(['A']);await checkpoint('03-course');
 await press(['START']);await page.waitForFunction(()=>['intro','countdown','racing'].includes(window.JoystickGameQA.snapshot().gameplay.mode),null,{timeout:90000});
 await checkpoint('04-race-intro');await press(['A']);
 await page.waitForFunction(()=>window.JoystickGameQA.snapshot().gameplay.mode==='racing',null,{timeout:90000});
 await checkpoint('05-grid');await press(['UP'],3000);await checkpoint('06-drive');
 await press(['UP','LEFT','A'],1000);await checkpoint('07-drift');
 await press(['START']);await checkpoint('08-pause');
 await page.setViewportSize({width:960,height:540});await checkpoint('09-pause-960');
 const bounds=await page.evaluate(()=>{const p=document.querySelector('#puretv-controller-panel'),r=p.getBoundingClientRect();return {width:innerWidth,height:innerHeight,panel:{x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight},body:{scrollWidth:document.body.scrollWidth,scrollHeight:document.body.scrollHeight}};});report.bounds=bounds;
 await press(['START']);await checkpoint('10-resumed-960');
 await page.evaluate(()=>window.PureGame.focus(false));await checkpoint('11-focus-paused');
 report.readOnlyPeek=await page.evaluate(()=>{const before=window.__bridge.polls;for(let i=0;i<20;i++)window.JoystickGameQA.snapshot();return {before,after:window.__bridge.polls,snapshot:window.JoystickGameQA.snapshot()};});
 report.status='completed';
 }catch(e){report.status='failed';report.failure=String(e.stack||e);try{report.lastSnapshot=await snapshot();await page.screenshot({path:path.join(out,'failure.png'),timeout:15000});}catch(e2){report.captureFailure=String(e2);}}
 finally{report.endedAt=new Date().toISOString();save();if(browser)await browser.close();}})();
