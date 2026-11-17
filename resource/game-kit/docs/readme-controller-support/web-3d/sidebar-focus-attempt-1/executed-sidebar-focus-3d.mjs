// Normal Tab navigation verifies scrollable sidebar controls remain reachable.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const repo=fileURLToPath(new URL('../../../',import.meta.url)),out=process.argv[2];
if(!out)throw Error('Pass fresh output directory');
const {chromium}=createRequire(process.env.PURETV_PACKAGE||path.join(repo,'desktop/package.json'))('playwright');
const games={'alien-shooter':'AlienShooterHost','used-car-racing':'UsedCarHost','cozy-island':'CozyIslandHost','coast-kart':'CoastKartHost'};
await mkdir(out,{recursive:true});await copyFile(fileURLToPath(import.meta.url),path.join(out,'executed-sidebar-focus-3d.mjs'));
const report={status:'running',method:'Actual final bundled pages, synthetic Android information and clearly TEST-labelled QR graphic; no game-state or clock writes.',physicalTvTested:false,cases:[],hashes:{}};
const server=http.createServer(async(req,res)=>{try{const [slug,...parts]=new URL(req.url,'http://localhost').pathname.slice(1).split('/');if(!games[slug]||parts.includes('..'))throw Error();const rel=parts.join('/')||'tv.html';res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':rel.endsWith('.jpg')?'image/jpeg':'text/html');res.end(await readFile(path.join(repo,'resource/apps',slug,'src/main/assets',rel)));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
for(const [slug,host] of Object.entries(games).filter(([slug])=>['cozy-island','coast-kart'].includes(slug))){
 for(const language of ['zh']){
 const context=await browser.newContext({viewport:{width:960,height:540}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({host,language})=>{const qr='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#eeeeee"/><text x="80" y="86" text-anchor="middle" font-size="24" fill="#333">TEST QR</text></svg>');window.__info={language,url:'http://192.0.2.10:8080/',qr,secureUrl:'https://192.0.2.10:8443/',secureQr:qr,certificateFingerprint:'a'.repeat(64),wifiController:{addresses:['192.0.2.10'],port:63485,state:'available',connected:0,error:0,inputActive:true}};window[host]={getInfo:()=>JSON.stringify(window.__info),snapshot:()=>JSON.stringify({players:[]}),publish:()=>{}};},{host,language});
 try{
 await page.goto(`http://127.0.0.1:${server.address().port}/${slug}/tv.html`);await page.waitForFunction(()=>window.PureTVQA&&['title','garage'].includes(PureTVQA.snapshot().phase),null,{timeout:60000});
 for(const size of [{width:960,height:540},{width:1280,height:720}]){
  await page.setViewportSize(size);await page.waitForTimeout(400);
  await page.keyboard.press('Tab');
  for(let tries=0;tries<12 && await page.evaluate(()=>document.activeElement.id!=='music-button');tries++)await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'music-button','normal Tab reaches music control');
  const geometry=await page.locator('#music-button').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.sidebar'),b=p.getBoundingClientRect();return {top:r.top,bottom:r.bottom,sidebarTop:b.top,sidebarBottom:b.bottom,scrollTop:p.scrollTop};});
  assert.ok(geometry.top>=geometry.sidebarTop && geometry.bottom<=geometry.sidebarBottom,'focused control scrolls fully into view');
  report.cases.push({game:slug,language,...size,geometry,status:'passed',method:'Normal Tab keyboard navigation; no DOM focus/scroll setters'});
  await page.screenshot({path:path.join(out,slug+'-'+language+'-'+size.width+'-music-focused.png')});
 }
 assert.deepEqual(errors,[]);
 }catch(error){report.failure={game:slug,language,error:error.stack,state:await page.evaluate(()=>({info:window.__info,status:document.querySelector('#puretv-status').textContent,visible:document.visibilityState})).catch(()=>null),pageErrors:errors};await page.screenshot({path:path.join(out,slug+'-'+language+'-failure.png')}).catch(()=>{});throw error;}finally{await context.close();}
 }
 for(const name of ['puretv-controller.js',slug==='used-car-racing'?'game.js':'runtime.js','tv.html','tv.css']){const rel=`resource/apps/${slug}/src/main/assets/${name}`;report.hashes[rel]=createHash('sha256').update(await readFile(path.join(repo,rel))).digest('hex');}
 console.log('PASS '+slug+' sidebar keyboard focus scroll');
}
report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);}
finally{await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
