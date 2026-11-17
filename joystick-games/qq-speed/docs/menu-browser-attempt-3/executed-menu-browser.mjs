// Real browser inputs and screenshots. No model writes or clock overrides.
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import crypto from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_IMPORT || '/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright-core/index.mjs');
const root=path.resolve(new URL('..',import.meta.url).pathname),out=process.env.QQ_QA_OUTPUT;
if(!out||fs.existsSync(out))throw Error('QQ_QA_OUTPUT must be a new directory');fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(new URL(import.meta.url),path.join(out,'executed-menu-browser.mjs'));
const html=fs.readFileSync(path.join(root,'dist/tv.html'));const report={scope:'ordinary browser pointer/keyboard inputs, original four maps and two modes; menu layout and actual race entry, not a complete race',assetSha256:crypto.createHash('sha256').update(html).digest('hex'),cases:[],physicalTvTested:false,physicalEsp32Tested:false,modelWrites:false,clockOverrides:false};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:960,height:540}});page.setDefaultTimeout(120000);page.setDefaultNavigationTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const snap=()=>page.evaluate(()=>window.JoystickGameQA.snapshot());
 const wait=state=>page.waitForFunction(st=>window.JoystickGameQA?.snapshot().stage===st&&!window.JoystickGameQA.snapshot().loading,state,{timeout:120000});
 await wait('menu');console.log('menu ready',await snap());
 for(const width of [960,1280]){
  await page.setViewportSize({width,height:width===960?540:720});await page.screenshot({path:path.join(out,`menu-${width}.png`),timeout:120000});
  const dims=await page.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,menuHeight:document.querySelector('#menu').clientHeight,menuScroll:document.querySelector('#menu').scrollHeight,panel:document.querySelector('#puretv-controller-panel').getBoundingClientRect().toJSON()}));
  report.cases.push({name:`menu-${width}`,status:'passed',dimensions:dims,state:await snap()});save();
 }
 await page.setViewportSize({width:960,height:540});
 for(const map of ['city','aegean','egypt','snow']){
  await page.locator(`#maps .map[data-id=${map}]`).click();await wait('menu');
  for(const [index,mode] of ['speed','item'].entries()){
   await page.locator(`#modes .opt[data-i="${index}"]`).click();await page.locator('#laps .opt[data-i="0"]').click();
   await page.locator('#start').click();await wait('countdown');const state=await snap();
   if(state.map!==map||state.mode!==mode||!state.player||state.render.calls<1||!state.webglVersion.startsWith('WebGL 2'))throw Error('wrong game scene or missing rendered frame');
   await page.screenshot({path:path.join(out,`${map}-${mode}.png`),timeout:120000});
   report.cases.push({name:`${map}-${mode}`,status:'passed',state});save();console.log(map,mode,'entered');
   await page.keyboard.press('KeyP');await wait('paused');await page.locator('#quit').click();await wait('menu');
  }
 }
 report.pageErrors=errors;if(errors.length)throw Error(errors.join('\n'));report.status='passed';save();
} catch(e){report.status='failed';report.error=String(e);save();throw e;} finally {await browser?.close();server.close();}
