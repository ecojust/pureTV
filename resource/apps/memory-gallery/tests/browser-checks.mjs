import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,memorizePreview,assertProgress} from './automation.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function ready(page){await page.waitForFunction(()=>{const s=PureTVQA.snapshot();return s.phase==='playing'&&!s.paused&&s.model.inputArmed&&!s.model.lastHeld.a&&!s.model.lastHeld.b&&s.model.lastHeld.direction==='none';});}
async function fresh(level){const session=await preparePage(browser,server.url);await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await ready(session.page);return session;}
async function action(page,key,field){await ready(page);const before=(await snapshot(page)).model[field];await page.keyboard.down(key);try{await page.waitForFunction(({field,before})=>PureTVQA.snapshot().model[field]!==before,{field,before});}finally{await page.keyboard.up(key);}if((await snapshot(page)).phase==='playing')await ready(page);}
async function move(page,to){for(let guard=0;guard<20;guard++){const s=(await snapshot(page)).model;if(s.cursor===to)return;const x=s.cursor%s.width,tx=to%s.width;await action(page,x!==tx?(x<tx?'ArrowRight':'ArrowLeft'):(s.cursor<to?'ArrowDown':'ArrowUp'),'cursor');}assert.equal((await snapshot(page)).model.cursor,to);}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: remember visible preview and match every pair normally`,async()=>{
  const session=await fresh(level),page=session.page,pilot=createPilot(),held=new Set(),trace=[];
  try{const before=await snapshot(page),started=performance.now();pilot(before);trace.push({elapsed:0,state:before});let captured=false;
   while(performance.now()-started<60000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
    if(!captured&&s.model.matchedPairs>=2){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${level+1}-playing-${width}.png`));}captured=true;}
    await applyKeys(page,pilot(s),held);await delay(85);
   }
   await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});assertProgress({before,after,trace},assert);verifyErrors(session);
   await inspectFrame(page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify({trace,commands:pilot.log()},null,2)+'\n');return {level,pairs:after.model.matchedPairs,flips:after.model.flips,mistakes:after.model.mistakes};
  }finally{await releaseAll(page,[...held]);await session.context.close();}
 });
 await test('A held through preview cannot reveal; same and locked cards are blocked',async()=>{
  const session=await fresh(0),page=session.page;try{
   const memory=memorizePreview((await snapshot(page)).model);await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.blockedActions>0);await page.waitForFunction(()=>PureTVQA.snapshot().model.stage==='choosing');await delay(200);
   let s=(await snapshot(page)).model;assert.equal(s.flips,0);assert.ok(s.visibleFaces.every(v=>v===null));await page.keyboard.up('Space');await ready(page);await action(page,'Space','flips');
   await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.equal(s.flips,1);assert.equal(s.mistakes,0);
   const partner=memory.findIndex((v,i)=>i!==0&&v===memory[0]);await move(page,partner);await action(page,'Space','flips');assert.equal((await snapshot(page)).model.matchedPairs,1);
   await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.flips,2);verifyErrors(session);return {previewHoldSuppressed:true,sameCardBlocked:true,lockedCardBlocked:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('visible mismatch delay pauses, then naturally reaches mistake loss',async()=>{
  const session=await fresh(0),page=session.page;try{
   const memory=memorizePreview((await snapshot(page)).model),wrong=memory.findIndex(v=>v!==memory[0]);await page.waitForFunction(()=>PureTVQA.snapshot().model.stage==='choosing');
   const limit=(await snapshot(page)).model.mistakeLimit;
   for(let n=0;n<limit;n++){
    await move(page,0);await action(page,'Space','flips');await move(page,wrong);await action(page,'Space','flips');let s=(await snapshot(page)).model;
    assert.equal(s.stage,'compare');assert.equal(s.mistakes,n);assert.equal(s.visibleFaces.filter(v=>v!==null).length,2);
    if(n===0){await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(300);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);}
    await page.waitForFunction(expected=>PureTVQA.snapshot().model.mistakes===expected,n+1);s=(await snapshot(page)).model;assert.ok(s.visibleFaces.every(v=>v===null));
   }
   const terminal=(await snapshot(page)).model;assert.equal(terminal.phase,'lost');assert.equal(terminal.reason,'mistakes');await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,terminal);verifyErrors(session);
   await inspectFrame(page,path.join(output,'natural-mistake-loss.png'));return {mistakes:terminal.mistakes,comparisonPauseFrozen:true,lossHidesUnmatchedFaces:true,terminalFrozen:true};
  }finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
