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
async function fresh(level){const session=await preparePage(browser,server.url);await session.page.screenshot();await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await ready(session.page);return session;}
async function action(page,key,field){await ready(page);const before=(await snapshot(page)).model[field];await page.keyboard.down(key);try{await page.waitForFunction(({field,before})=>PureTVQA.snapshot().model[field]!==before,{field,before});}finally{await page.keyboard.up(key);}if((await snapshot(page)).phase==='playing')await ready(page);}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary timed steering collects the fruit quota`,async()=>{
  const session=await fresh(level),page=session.page,pilot=createPilot(),held=new Set(),trace=[];
  try{const before=await snapshot(page),started=performance.now();
   // Initial straight lane safely permits the two short captures. No clock changes.
   for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await inspectFrame(page,path.join(output,`level-${level+1}-playing-${width}.png`));}
   while(performance.now()-started<90000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;await applyKeys(page,pilot(s),held);await delay(60);}
   await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});assertProgress({before,after,trace},assert);verifyErrors(session);
   await inspectFrame(page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify({trace},null,2)+'\n');return {level,eaten:after.model.eaten,moves:after.model.moves,brakesUsed:after.model.brakesUsed};
  }finally{await releaseAll(page,[...held]);await session.context.close();}
 });
 await test('one queued turn survives another input; reverse is blocked',async()=>{
  const session=await fresh(0),page=session.page;try{
   await action(page,'ArrowLeft','blockedActions');assert.equal((await snapshot(page)).model.direction,'right');
   await action(page,'Space','brakesUsed');await action(page,'ArrowUp','turnsQueued');let s=(await snapshot(page)).model;assert.equal(s.queuedDirection,'up');
   await action(page,'ArrowDown','blockedActions');s=(await snapshot(page)).model;assert.equal(s.queuedDirection,'up');
   await page.waitForFunction(()=>PureTVQA.snapshot().model.direction==='up');s=(await snapshot(page)).model;assert.equal(s.queuedDirection,null);assert.equal(s.phase,'playing');verifyErrors(session);
   return {reverseBlocked:true,singleQueuedTurn:true,turnAppliedAtMovementTick:true};
  }finally{await session.context.close();}
 });
 await test('holding A spends one brake and pause freezes remaining brake time',async()=>{
  const session=await fresh(0),page=session.page;try{
   await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.brakesUsed===1);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);
   const frozen=(await snapshot(page)).model;assert.ok(frozen.brakeRemaining>0);await delay(400);assert.deepEqual((await snapshot(page)).model,frozen);
   await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await page.waitForFunction(()=>PureTVQA.snapshot().model.brakeRemaining===0);assert.equal((await snapshot(page)).model.brakesUsed,1);
   await page.keyboard.up('Space');await ready(page);await action(page,'Space','brakesUsed');assert.equal((await snapshot(page)).model.brakes,1);verifyErrors(session);return {heldBrakeSpentOnce:true,pauseFrozen:true,realReleaseAllowsSecondBrake:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('unsteered snake naturally hits the boundary and terminal input freezes',async()=>{
  const session=await fresh(0),page=session.page;try{
   await page.waitForFunction(()=>PureTVQA.snapshot().phase==='lost',null,{timeout:15000});const terminal=(await snapshot(page)).model;assert.equal(terminal.reason,'wall');
   await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,terminal);verifyErrors(session);await inspectFrame(page,path.join(output,'natural-wall-loss.png'));return {moves:terminal.moves,reason:terminal.reason,terminalFrozen:true};
  }finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
