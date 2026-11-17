import { chromium } from '/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright-core/index.mjs';
import fs from 'node:fs';import http from 'node:http';
const root='/dev/shm/puretv-joystick-games/joystick-games/qq-speed/';
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(fs.readFileSync(root+'dist/tv.html'));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
for(const size of [{width:960,height:540},{width:1280,height:720}]){
 const page=await browser.newPage({viewport:size});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 console.log('open',size); await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.JoystickGameQA?.snapshot().stage==='menu'&&!window.JoystickGameQA.snapshot().loading,{timeout:60000});
 console.log('capture',size); await page.screenshot({timeout:120000,path:root+`docs/menu-${size.width}.png`});
 const state=await page.evaluate(()=>({snapshot:window.JoystickGameQA.snapshot(),menu:{scrollHeight:document.querySelector('#menu').scrollHeight,clientHeight:document.querySelector('#menu').clientHeight},panel:{x:document.querySelector('#puretv-controller-panel').getBoundingClientRect().x,y:document.querySelector('#puretv-controller-panel').getBoundingClientRect().y}}));
 results.push({size,errors,state});await page.close();
}
fs.writeFileSync(root+'docs/layout-preflight.json',JSON.stringify({scope:'real browser menu with keyboard/pointer available; no native/controller input injected',results},null,2)+'\n');await browser.close();server.close();
