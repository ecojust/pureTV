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
 try{while(performance.now()-started<45000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
  if(capture&&!captured&&s.model.playerMoves>=2){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
  await applyKeys(page,pilot(s),held);await delay(85);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: normal removals beat the independently evaluated opponent`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,misere:result.after.model.misere,playerMoves:result.after.model.playerMoves,reason:result.after.model.reason};}finally{await session.context.close();}
 });
 await test('removal amount clamps to pile bounds; empty pile is a free no-op',async()=>{
  const session=await fresh(0),page=session.page;try{
   await action(page,'ArrowDown','blockedActions');assert.equal((await snapshot(page)).model.amount,1);await action(page,'ArrowUp','amount');await action(page,'ArrowUp','blockedActions');assert.equal((await snapshot(page)).model.amount,2);
   await action(page,'ArrowRight','selected');assert.equal((await snapshot(page)).model.amount,2);await action(page,'ArrowLeft','selected');await action(page,'Space','playerMoves');let s=(await snapshot(page)).model;assert.equal(s.piles[0],0);assert.equal(s.amount,0);const before=s.totalMoves;
   await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.totalMoves,before);await action(page,'ArrowRight','selected');assert.equal((await snapshot(page)).model.amount,1);verifyErrors(session);return {minimumBound:true,maximumBound:true,emptyNoOp:true,nonemptyRestoresOne:true};
  }finally{await session.context.close();}
 });
 await test('held A executes one round and real release is required after pause',async()=>{
  const session=await fresh(0),page=session.page;try{
   await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.playerMoves===1);await delay(250);assert.equal((await snapshot(page)).model.playerMoves,1);
   await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.playerMoves,1);
   await page.keyboard.up('Space');await ready(page);await action(page,'Space','playerMoves');assert.equal((await snapshot(page)).model.playerMoves,2);verifyErrors(session);return {heldDoesNotRepeat:true,pauseFreeze:true,releaseAllowsNextRound:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 for(const level of [0,2])await test(`level ${level+1}: inferior ordinary removals lose under the correct final-stone rule`,async()=>{
  const session=await fresh(level),page=session.page;try{const result=await play(session,createPilot({lose:true})),s=result.after.model;assert.equal(s.phase,'lost');assert.equal(s.remaining,0);assert.equal(s.reason,s.misere?'player-last':'opponent-last');if(s.misere)assert.equal(s.lastAiMove,null);await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,s);verifyErrors(session);await inspectFrame(page,path.join(output,`natural-loss-${level+1}.png`));return {misere:s.misere,playerMoves:s.playerMoves,reason:s.reason,terminalFrozen:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
