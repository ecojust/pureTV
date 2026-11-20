import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root=fileURLToPath(new URL('../',import.meta.url));
const audio=fs.readFileSync(path.join(root,'src/js/audio.js'));
const document=`<button id="start">Start</button><button id="lose">Suspend</button><button id="tap">Ordinary input</button><button id="resume">Resume</button><script type="module">
import {Audio} from './audio.js';const a=new Audio();
document.querySelector('#start').onclick=()=>a.init();
document.querySelector('#lose').onclick=()=>a.suspendForHost();
document.querySelector('#tap').onclick=()=>a.init();
document.querySelector('#resume').onclick=()=>a.resumeForPlay();
window.observe=()=>({state:a.ctx?.state,locked:a.hostSuspended,time:a.ctx?.currentTime});
</script>`;
const server=http.createServer((req,res)=>{const code=req.url.endsWith('.js');res.setHeader('Content-Type',code?'text/javascript':'text/html');res.end(code?audio:document);});
await new Promise(f=>server.listen(0,'127.0.0.1',f));
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});
try{const p=await b.newPage();await p.goto('http://127.0.0.1:'+server.address().port);
 const steps=[];for(const [id,state,locked] of [['start','running',false],['lose','suspended',true],['tap','suspended',true],['resume','running',false]]){
  await p.locator('#'+id).click();
  await p.waitForFunction(([state,locked])=>window.observe().state===state && window.observe().locked===locked,[state,locked]);
  const snap=await p.evaluate(()=>window.observe());steps.push({id,...snap});if(id==='tap')assert.equal(snap.time,steps[1].time);
 }
 const report={status:'passed',scope:'Exact production Audio class and a real Web Audio context, exercised by trusted clicks in an isolated harness',browser:b.version(),sourceSha256:createHash('sha256').update(audio).digest('hex'),steps};
 fs.writeFileSync(path.join(root,'docs/audio-lifecycle.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(steps));
}finally{await b.close();server.close();}
