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
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
async function play(session,pilot,{capture=false}={}){
 const page=session.page,held=new Set(),trace=[],before=await snapshot(page),started=performance.now();let captured=false;
 try{
  while(performance.now()-started<45000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
   if(capture&&!captured&&s.model.movesUsed>=5){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
   await applyKeys(page,pilot(s),held);await delay(85);
  }
  await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};
 }finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: normal slides reach target with independently predicted merges and spawns`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,moves:result.after.model.movesUsed,target:result.after.model.target,points:result.after.model.points};}finally{await session.context.close();}
 });
 await test('two undo tickets restore board and deterministic spawn without refunding moves',async()=>{
  const session=await fresh(0),page=session.page;try{
   const initial=(await snapshot(page)).model;await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.undoTickets,2);
   await action(page,'ArrowLeft','movesUsed');const moved=(await snapshot(page)).model;await action(page,'Space','undos');let s=(await snapshot(page)).model;
   for(const k of ['cells','spawnIndex','points','lastSpawn','lastMerges'])assert.deepEqual(s[k],initial[k]);assert.equal(s.movesUsed,1);assert.equal(s.undoTickets,1);
   await action(page,'ArrowLeft','movesUsed');s=(await snapshot(page)).model;for(const k of ['cells','spawnIndex','points','lastSpawn','lastMerges'])assert.deepEqual(s[k],moved[k]);assert.equal(s.movesUsed,2);
   await action(page,'Space','undos');await action(page,'ArrowLeft','movesUsed');const before=(await snapshot(page)).model;await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.deepEqual(s.cells,before.cells);assert.equal(s.undoTickets,0);assert.equal(s.movesUsed,3);verifyErrors(session);return {noHistoryFree:true,spawnReplayExact:true,undoDoesNotRefund:true,ticketsBounded:2};
  }finally{await session.context.close();}
 });
 await test('held direction does not repeat and pause requires real release',async()=>{
  const session=await fresh(0),page=session.page;try{
   await page.keyboard.down('ArrowLeft');await page.waitForFunction(()=>PureTVQA.snapshot().model.movesUsed===1);await delay(300);assert.equal((await snapshot(page)).model.movesUsed,1);
   await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);
   await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(200);assert.equal((await snapshot(page)).model.movesUsed,1);await page.keyboard.up('ArrowLeft');await ready(page);await action(page,'ArrowRight','movesUsed');assert.equal((await snapshot(page)).model.movesUsed,2);verifyErrors(session);return {heldDoesNotRepeat:true,pauseRelease:true};
  }finally{await releaseAll(page,['ArrowLeft']);await session.context.close();}
 });
 for(const reason of ['stuck','moves'])await test(`ordinary legal slides produce natural ${reason} loss and terminal freeze`,async()=>{
  const session=await fresh(0),page=session.page;try{const result=await play(session,createPilot({lose:true,lossReason:reason})),s=result.after.model;assert.equal(result.after.phase,'lost');assert.equal(s.reason,reason);if(reason==='moves')assert.equal(s.movesUsed,s.moveLimit);await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,s);await inspectFrame(page,path.join(output,`natural-${reason}-loss.png`));return {reason,moves:s.movesUsed,terminalFrozen:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
