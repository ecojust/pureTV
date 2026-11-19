import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/workspace/scratch/market-download-20261115/ui/node_modules-before/playwright');
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist=path.join(root,'dist'),out=path.join(root,'docs','menu-layout-'+(process.argv[2]||'1'));
assert.ok(!fs.existsSync(out),'Use a new attempt');fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'executed-menu-layout.mjs'));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const original=fs.readFileSync(path.join(dist,'tv.html'));
// Isolate original markup and exact styles/fonts. No game code or WebGL runs.
const html=original.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const report={scope:'DOM/CSS fixture only; original game scripts removed, WebGL disabled. Not gameplay or native QA.',originalHtmlSha256:sha(original),fixtureHtmlSha256:sha(html),viewports:[],responses:[],errors:[]};
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://local').pathname.slice(1)||'tv.html';
 const p=path.resolve(dist,name);
 if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}
 const data=name==='tv.html'?Buffer.from(html):fs.readFileSync(p);
 report.responses.push({path:name,sha256:sha(data)});
 const mime=name.endsWith('.css')?'text/css':name.endsWith('.ttf')?'font/ttf':'text/html';
 res.writeHead(200,{'content-type':mime});res.end(data);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu','--disable-webgl'],env:{...process.env,TMPDIR:'/dev/shm'}});
try {
 const page=await browser.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 for(const width of [960,1280]){
  await page.setViewportSize({width,height:width*9/16});
  await page.goto('http://127.0.0.1:'+server.address().port+'/tv.html');
  await page.evaluate(async()=>{
   await document.fonts.ready;
   // Mirror only the normal offline UI's absent leaderboard and loaded overlay.
   document.querySelector('#loading').hidden=true;document.querySelector('#lbbtn').hidden=true;
   document.querySelector('#start').textContent='开始比赛 · 3 圈 ▸';
  });
  const layout=await page.evaluate(()=>{
   const start=document.querySelector('#start'),box=document.querySelector('#title'),r=start.getBoundingClientRect();
   return {width:innerWidth,height:innerHeight,start:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},menu:{clientHeight:box.clientHeight,scrollHeight:box.scrollHeight},keyboardInstructions:document.querySelector('.ctrls').innerText};
  });
  assert.ok(layout.start.left>=0&&layout.start.right<=width);
  assert.ok(layout.start.top>=0&&layout.start.bottom<layout.height-36,'Start must be visible above the TV help strip');
  assert.ok(layout.keyboardInstructions.includes('Shift'));
  const file=path.join(out,'menu-'+width+'.png');await page.screenshot({path:file});
  report.viewports.push({...layout,screenshotSha256:sha(fs.readFileSync(file))});
 }
 assert.deepEqual(report.errors,[]);assert.equal(sha(fs.readFileSync(path.join(dist,'tv.html'))),report.originalHtmlSha256);
 report.status='passed';
}catch(error){report.status='failed';report.error=String(error.stack);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({status:report.status,viewports:report.viewports,error:report.error}));
