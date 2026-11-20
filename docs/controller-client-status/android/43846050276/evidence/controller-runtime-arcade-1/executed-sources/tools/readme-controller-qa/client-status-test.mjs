#!/usr/bin/env node
// Contract tests for the read-only observer and its failure detection, not game acceptance.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {launch,sha256} from '../../resource/game-kit/qa/common.mjs';
import {controllerClientDom} from './client-status-dom.mjs';
import {assertControllerClients} from './client-status-cases.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=path.resolve(process.argv[2]);await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const sources=['tools/readme-controller-qa/client-status-test.mjs','tools/readme-controller-qa/client-status-dom.mjs','tools/readme-controller-qa/client-status-cases.mjs','tools/readme-controller-qa/run.mjs','tools/readme-controller-qa/android-observer/src/com/ecojust/controllerqa/Observer.java','resource/game-kit/web/puretv-controller.js'];
const hashes={};for(const name of sources){hashes[name]=sha256(await readFile(path.join(root,name)));await copyFile(path.join(root,name),path.join(output,'executed-'+path.basename(name)));}
const results=[];const browser=await launch();const page=await browser.newPage({viewport:{width:960,height:540}});
async function test(name,fn){await fn();results.push({name,status:'passed'});}
async function fixture(id='virtual-status-1'){
 await page.setContent('<style>body{margin:16px}#clip{width:260px}#host{width:250px}</style><div id="clip"><div id="host"></div></div>');
 await page.addScriptTag({path:path.join(root,'resource/game-kit/web/puretv-controller.js')});
 await page.evaluate(id=>{window.snapshotCalls=0;window.PureGameHost={snapshot(){window.snapshotCalls++;throw Error('Observer must not consume input');}};window.PureTVControllerAdapter.renderClients(document.getElementById('host'),[{id:1,transport:'wifi',connected:true,controllerId:id}],{language:'en'});},id);
 return [{controllerId:id,playerId:1}];
}
async function sample(){return {document:{width:960,height:540,controllerClients:await page.evaluate(controllerClientDom)}};}
try{
 await test('Android embeds exactly the same fixed read-only DOM function',async()=>{
  const java=await readFile(path.join(root,'tools/readme-controller-qa/android-observer/src/com/ecojust/controllerqa/Observer.java'),'utf8');
  const literal=java.match(/private static final String CLIENT_STATUS_SCRIPT = ("(?:\\.|[^"\\])*");/)[1];
  assert.equal(JSON.parse(literal),'('+controllerClientDom.toString()+')()');
 });
 await test('a rendered icon, seat and full real-ID-shaped text satisfy the observation contract',async()=>{
  const wanted=await fixture();assertControllerClients(await sample(),wanted);assert.equal(await page.evaluate(()=>window.snapshotCalls),0);
 });
 await test('a 128-character ID is fully measured across wrapped lines',async()=>{
  const wanted=await fixture('virtual-'+('x'.repeat(120)));assertControllerClients(await sample(),wanted);
  assert.ok((await sample()).document.controllerClients.containers[0].rows[0].idTextRects.length>1);
 });
 await test('hidden ancestors cannot produce a false visible-ID pass',async()=>{
  const wanted=await fixture();await page.locator('#clip').evaluate(node=>node.style.display='none');
  const state=await sample();assert.throws(()=>assertControllerClients(state,wanted));
 });
 await test('attribute-only IDs with missing rendered text are rejected',async()=>{
  const wanted=await fixture();await page.locator('[data-puretv-controller-id-text]').evaluate(node=>node.textContent='ID:');
  const state=await sample();assert.throws(()=>assertControllerClients(state,wanted),/full ID/);
 });
 await test('missing icons are rejected',async()=>{
  const wanted=await fixture();await page.locator('.ptv-client-icon').evaluate(node=>node.remove());const state=await sample();assert.throws(()=>assertControllerClients(state,wanted),/SVG icon/);
 });
 await test('wrong seats are rejected even when the device ID matches',async()=>{
  const wanted=await fixture();await page.locator('[data-player-id]').evaluate(node=>node.setAttribute('data-player-id','2'));const state=await sample();assert.throws(()=>assertControllerClients(state,wanted),/actual seat/);
 });
 await test('cropped controller cards are rejected',async()=>{
  const wanted=await fixture();await page.locator('#clip').evaluate(node=>{node.style.height='10px';node.style.overflow='hidden';});const state=await sample();assert.throws(()=>assertControllerClients(state,wanted),/without clipping/);
 });
 await test('duplicate visible identity rows are rejected',async()=>{
  const wanted=await fixture();await page.locator('[data-player-id]').evaluate(node=>node.parentNode.append(node.cloneNode(true)));const state=await sample();assert.throws(()=>assertControllerClients(state,wanted),/Exactly/);
 });
 await test('disconnected strips must actually disappear',async()=>{
  await fixture();await page.evaluate(()=>window.PureTVControllerAdapter.renderClients(document.getElementById('host'),[],{language:'en'}));assertControllerClients(await sample(),[]);
 });
 await test('status-only cannot silently combine with gameplay-only',async()=>{
  const run=spawnSync(process.execPath,[path.join(root,'tools/readme-controller-qa/run.mjs'),'--slug','tank','--mode','browser','--output',path.join(output,'unused-output'),'--status-only','--gameplay-only'],{encoding:'utf8',env:process.env});
  await writeFile(path.join(output,'incompatible-mode.stdout.log'),run.stdout);await writeFile(path.join(output,'incompatible-mode.stderr.log'),run.stderr);
  assert.notEqual(run.status,0);assert.match(run.stderr,/Choose either --status-only or --gameplay-only/);
 });
 for(const name of sources)assert.equal(sha256(await readFile(path.join(root,name))),hashes[name],'Source changed during contract tests');
 await writeFile(path.join(output,'report.json'),JSON.stringify({status:'passed',scope:'Synthetic DOM/observer validation contract only; no game or Android acceptance',sourceHashes:hashes,tests:results,modelWrites:false,physicalTvTested:false,physicalEsp32Tested:false},null,2)+'\n');
 console.log(JSON.stringify({status:'passed',tests:results.length}));
}catch(error){await writeFile(path.join(output,'report.json'),JSON.stringify({status:'failed',scope:'Synthetic DOM/observer validation contract only; no game or Android acceptance',sourceHashes:hashes,tests:results,error:error.stack,modelWrites:false},null,2)+'\n');throw error;}finally{await browser.close();}
