// Shared menu/theme regression using an explicit probe, not gameplay evidence.
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs,serveAssets,launch,preparePage,tap,snapshot,verifyErrors,sha256} from './common.mjs';

const args=parseArgs(), output=path.resolve(args.output||path.join(os.tmpdir(),'puretv-presentation-report'));
const web=fileURLToPath(new URL('../web/',import.meta.url));
const fixture=await mkdtemp(path.join(os.tmpdir(),'puretv-presentation-'));
await mkdir(output,{recursive:true});
for(const name of ['runtime.js','renderer.js','tv.html','tv.css'])await copyFile(path.join(web,name),path.join(fixture,name));
await writeFile(path.join(fixture,'game-config.json'),' {"version":"0.0.0"}');
await writeFile(path.join(fixture,'game-model.js'),`window.PureModel={create(seed,level){return {phase:'playing',level,score:0,events:[],message:'Probe'};},step(){}};`);
await writeFile(path.join(fixture,'game.js'),`const extended=new URL(location.href).searchParams.has('extended');window.GameDef={id:'presentation-probe',title:'Presentation probe',description:'Fixture',tip:'Fixture',controls:{move:'Move',a:'A',b:'B'},levelNames:extended?['一','二','三','四','五','六']:undefined,stylesheet:extended?'probe-theme.css':undefined,hud:()=>[],result:()=>'',render(r){r.rect(0,0,960,540,'#102030');}};`);
await writeFile(path.join(fixture,'probe-theme.css'),':root{--presentation-probe:loaded}.workspace{grid-template-columns:minmax(0,1fr) 260px}');
const server=await serveAssets(fixture),browser=await launch();
const report={scope:'Shared runtime menu and optional theme probe; not game or hardware validation',runtimeSha256:sha256(await readFile(path.join(web,'runtime.js'))),tests:[],passed:false};
async function check(name,url,run){const s=await preparePage(browser,url,{viewport:{width:960,height:540}});try{await run(s.page);verifyErrors(s);report.tests.push({name,passed:true});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:String(error.stack)});throw error;}finally{await s.context.close();}}
try{
 await check('default three-level menu preserves wraparound and start',server.url,async page=>{
  assert.equal(await page.locator('[data-level]').count(),3);
  assert.equal(await page.locator('link[href="probe-theme.css"]').count(),0);
  await tap(page,'ArrowLeft');await page.waitForFunction(()=>PureTVQA.snapshot().level===2);
  await tap(page,'ArrowRight');await page.waitForFunction(()=>PureTVQA.snapshot().level===0);
  await tap(page,'Enter');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');
 });
 await check('six levels support buttons, keyboard wrap, restart and local theme',server.url+'?extended=1',async page=>{
  assert.equal(await page.locator('[data-level]').count(),6);
  await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--presentation-probe').trim()==='loaded');
  await page.locator('[data-level="5"]').click();assert.equal((await snapshot(page)).model.level,5);
  await tap(page,'ArrowRight');await page.waitForFunction(()=>PureTVQA.snapshot().level===0);
  await tap(page,'ArrowLeft');await page.waitForFunction(()=>PureTVQA.snapshot().level===5);
  await tap(page,'Enter');await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');assert.equal((await snapshot(page)).model.level,5);
  await tap(page,'r');assert.equal((await snapshot(page)).model.level,5);
  for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(()=>{const a=document.querySelector('#arena').getBoundingClientRect(),s=document.querySelector('#scene').getBoundingClientRect();return s.width<=a.width&&s.height<=a.height&&Math.abs(s.width/s.height-16/9)<.01;});
  }
 });
 report.passed=true;
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await server.close();await rm(fixture,{recursive:true,force:true});}
