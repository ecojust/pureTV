// Actual wall-clock keyboard events; no model writes or virtual time.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function ready(page){await page.waitForFunction(()=>{const s=PureTVQA.snapshot();return s.phase==='playing'&&!s.paused&&s.model.inputArmed&&!s.model.lastHeld.a&&!s.model.lastHeld.b&&s.model.lastHeld.direction==='none';});}
async function fresh(level){const session=await preparePage(browser,server.url);await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await ready(session.page);return session;}
async function action(page,key,field){await ready(page);const before=(await snapshot(page)).model[field];await page.keyboard.down(key);try{await page.waitForFunction(({field,before})=>PureTVQA.snapshot().model[field]!==before,{field,before});}finally{await page.keyboard.up(key);}if((await snapshot(page)).phase==='playing')await ready(page);}
async function choose(page,color){for(let i=0;i<4;i++){const s=await snapshot(page);if(s.model.selected===color)return;await action(page,'ArrowRight','selected');}assert.equal((await snapshot(page)).model.selected,color);}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: independent flood solver wins with ordinary keys`,async()=>{
  const session=await fresh(level),page=session.page,pilot=createPilot(),held=new Set(),trace=[];
  try{const before=await snapshot(page),started=performance.now();let captured=false;
   while(performance.now()-started<30000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
    if(!captured&&s.model.movesUsed>=2){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${level+1}-playing-${width}.png`));}captured=true;}
    await applyKeys(page,pilot(s),held);await delay(90);
   }
   await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});
   assertProgress({before,after,trace},assert);verifyErrors(session);
   await inspectFrame(page,path.join(output,`level-${level+1}-won.png`));
   await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify({trace,commands:pilot.log()},null,2)+'\n');
   return {level,moves:after.model.movesUsed,owned:after.model.ownedCount};
  }finally{await releaseAll(page,[...held]);await session.context.close();}
 });
 await test('undo restores board without refund; held A and pause require release',async()=>{
  const session=await fresh(0),page=session.page;try{
   const initial=(await snapshot(page)).model;await action(page,'Space','movesUsed');let s=(await snapshot(page)).model;
   assert.equal(s.movesUsed,1);assert.ok(s.ownedCount>initial.ownedCount);
   await action(page,'b','undos');s=(await snapshot(page)).model;
   for(const key of ['cells','owned','ownedCount','color'])assert.deepEqual(s[key],initial[key]);assert.equal(s.movesUsed,1);assert.equal(s.undos,1);
   await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.movesUsed===2);await delay(350);s=(await snapshot(page)).model;assert.equal(s.movesUsed,2);
   await tap(page,'p');await delay(100);const paused=await snapshot(page);assert.equal(paused.paused,true);await delay(150);assert.deepEqual((await snapshot(page)).model,paused.model);
   await tap(page,'p');await delay(250);assert.equal((await snapshot(page)).model.movesUsed,2);
   await page.keyboard.up('Space');await ready(page);await choose(page,0);await action(page,'Space','movesUsed');assert.equal((await snapshot(page)).model.movesUsed,3);verifyErrors(session);
   return {undoDoesNotRefund:true,heldDoesNotRepeat:true,pauseRelease:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('non-winning final paint loses naturally and terminal undo is frozen',async()=>{
  const session=await fresh(0),page=session.page;try{
   for(let turn=0;turn<6;turn++){await choose(page,turn%2?0:1);await action(page,'Space','movesUsed');}
   const terminal=await snapshot(page);assert.equal(terminal.phase,'lost');assert.equal(terminal.model.reason,'moves');assert.equal(terminal.model.movesUsed,terminal.model.moveLimit);
   assert.ok(terminal.model.ownedCount<terminal.model.cells.length);await tap(page,'b');await delay(150);assert.deepEqual((await snapshot(page)).model,terminal.model);verifyErrors(session);
   await inspectFrame(page,path.join(output,'natural-loss.png'));return {moves:terminal.model.movesUsed,terminalFrozen:true};
  }finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
