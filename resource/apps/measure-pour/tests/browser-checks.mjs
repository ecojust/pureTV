// Wall-clock Chromium input tests; observations only, no model writes/clock injection.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output,'--assets and --output required');
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function neutral(page){await page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase!=='playing'||(!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none');});}
async function press(page,key){
 await neutral(page);const before=await snapshot(page);assert.equal(before.phase,'playing');await page.keyboard.down(key);
 try{await page.waitForFunction(({key,call})=>{const s=PureTVQA.snapshot().model;return s.calls>call&&(key==='Space'?s.lastHeld.a:key==='b'?s.lastHeld.b:s.lastHeld.direction===(key==='ArrowRight'?'right':'left'));},{key,call:before.model.calls});}
 finally{await page.keyboard.up(key);}await neutral(page);return snapshot(page);
}
async function fresh(level){
 const session=await preparePage(browser,server.url),page=session.page;
 await page.locator(`[data-level="${level}"]`).click();await page.waitForFunction(level=>PureTVQA.snapshot().level===level,level);
 await page.keyboard.down('Enter');try{await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await page.keyboard.up('Enter');}
 await neutral(page);assert.equal((await snapshot(page)).model.level,level);return session;
}
async function select(page,target){for(let i=0;i<3;i++){const s=await snapshot(page);if(s.model.selected===target)return;await press(page,'ArrowRight');}throw Error('Cursor did not select jug');}
async function drive(session,pilot){
 const held=new Set(),trace=[],start=performance.now();try{
  while(performance.now()-start<40000){const q=await snapshot(session.page);trace.push({elapsed:(performance.now()-start)/1000,state:q});if(q.phase!=='playing')return {state:q,trace,diagnostics:pilot.diagnostics()};await applyKeys(session.page,pilot(q),held);await delay(75);}
 }finally{await releaseAll(session.page,[...held]);}throw Error('Jug pilot wall-clock timeout');
}
async function test(name,fn){const start=performance.now();try{const details=await fn();report.tests.push({name,passed:true,milliseconds:performance.now()-start,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 await test('source, blocked choices, maximal pour and free cancellation',async()=>{
  const s=await fresh(0),p=s.page;try{
   await select(p,1);let q=await press(p,'Space');assert.equal(q.model.source,null);assert.equal(q.model.poursUsed,0);assert.equal(q.model.blockedActions,1);
   await select(p,0);q=await press(p,'Space');assert.equal(q.model.source,0);q=await press(p,'Space');assert.equal(q.model.source,0);assert.equal(q.model.poursUsed,0);
   q=await press(p,'b');assert.equal(q.model.source,null);assert.equal(q.model.poursUsed,0);await press(p,'Space');await select(p,1);q=await press(p,'Space');assert.deepEqual(q.model.volumes,[3,5,0]);assert.equal(q.model.poursUsed,1);
   await press(p,'Space');await select(p,2);q=await press(p,'Space');assert.deepEqual(q.model.volumes,[3,2,3]);assert.equal(q.model.poursUsed,2);
   await select(p,0);await press(p,'Space');await select(p,2);const before=await snapshot(p);q=await press(p,'Space');assert.deepEqual(q.model.volumes,[3,2,3]);assert.equal(q.model.poursUsed,2);assert.equal(q.model.source,0);assert.equal(q.model.blockedActions,before.model.blockedActions+1);
   const screenshots=[];for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await p.setViewportSize(viewport);await delay(150);const f=path.join(output,`jugs-source-full-${viewport.width}.png`);await inspectFrame(p,f);screenshots.push(f);}
   q=await press(p,'b');assert.equal(q.model.source,null);assert.equal(q.model.poursUsed,2);verifyErrors(s);return {screenshots,state:q};
  }finally{await s.context.close();}
 });
 if(!args.preview){
  for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary complete maximal-pour solution`,async()=>{
   const s=await fresh(level);try{const before=await snapshot(s.page),result=await drive(s,createPilot());assertProgress({before,after:result.state,trace:result.trace},assert);verifyErrors(s);
    const screenshot=path.join(output,`level-${level+1}-won.png`);await inspectFrame(s.page,screenshot);await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');
    return {level,pours:result.state.model.poursUsed,volumes:result.state.model.volumes,screenshot,searches:result.diagnostics.searches};
   }finally{await s.context.close();}
  });
  await test('natural pour-budget exhaustion and terminal model freeze',async()=>{
   const s=await fresh(0);try{const result=await drive(s,createPilot({policy:'exhaust'}));assert.equal(result.state.phase,'lost');assert.equal(result.state.model.poursUsed,result.state.model.pourLimit);
    assert.notDeepEqual(result.state.model.volumes,result.state.model.target);const terminal=structuredClone(result.state.model);
    await s.page.keyboard.down('Space');await delay(150);await s.page.keyboard.up('Space');await delay(100);assert.deepEqual((await snapshot(s.page)).model,terminal);verifyErrors(s);
    await writeFile(path.join(output,'exhaustion-trace.json'),JSON.stringify(result,null,2)+'\n');return {reason:terminal.reason,pours:terminal.poursUsed};
   }finally{await s.context.close();}
  });
  await test('held selection does not repeat and pause requires a physical release',async()=>{
   const s=await fresh(0),p=s.page;try{
    await p.keyboard.down('Space');await p.waitForFunction(()=>PureTVQA.snapshot().model.source===0);await delay(250);let q=await snapshot(p);assert.equal(q.model.blockedActions,0);assert.equal(q.model.poursUsed,0);
    for(const paused of [true,false]){await p.keyboard.down('p');try{await p.waitForFunction(v=>PureTVQA.snapshot().paused===v,paused);}finally{await p.keyboard.up('p');}if(paused){const frozen=await snapshot(p);await delay(150);assert.deepEqual((await snapshot(p)).model,frozen.model);}}
    await delay(200);q=await snapshot(p);assert.equal(q.model.source,0);assert.equal(q.model.poursUsed,0);assert.equal(q.model.blockedActions,0);
    await p.keyboard.up('Space');await neutral(p);await press(p,'ArrowRight');q=await press(p,'Space');assert.deepEqual(q.model.volumes,[3,5,0]);assert.equal(q.model.poursUsed,1);verifyErrors(s);return {volumes:q.model.volumes,pours:q.model.poursUsed};
   }finally{await releaseAll(p,['Space','p']);await s.context.close();}
  });
 }
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
