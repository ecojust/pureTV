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
async function play(session,pilot,{capture=false,until=null}={}){
 const page=session.page,held=new Set(),trace=[],before=await snapshot(page),started=performance.now();let captured=false;
 try{while(performance.now()-started<60000){let s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing'||until?.(s))break;
  if(capture&&!captured&&s.model.player.row===3){await releaseAll(page,[...held]);held.clear();for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s,afterSafeBankScreenshots:true});}
  await applyKeys(page,pilot(s),held);await delay(80);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: live public-lane planning reaches distinct homes with real keys`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);assert.equal(result.after.model.deaths,0);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,homes:result.after.model.goalCount,jumps:result.after.model.jumps,deaths:result.after.model.deaths,activeSeconds:result.after.model.activeTicks/120,gameplayScreenshotsParkedOnSafeBank:true};}finally{await session.context.close();}
 });
 await test('held safe-bank hop does not repeat and pause freezes every lane and active clock',async()=>{
  const session=await fresh(0),page=session.page;try{await page.keyboard.down('ArrowLeft');await page.waitForFunction(()=>PureTVQA.snapshot().model.jumps===1);await delay(250);let s=(await snapshot(page)).model;assert.equal(s.jumps,1);assert.equal(s.player.x,150);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(250);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.jumps,1);await page.keyboard.up('ArrowLeft');await ready(page);await action(page,'ArrowRight','jumps');assert.equal((await snapshot(page)).model.player.x,210);verifyErrors(session);return {heldDoesNotRepeat:true,lanesAndClockFreeze:true,releaseAllowsNextHop:true};}finally{await releaseAll(page,['ArrowLeft']);await session.context.close();}
 });
 await test('real log carrying changes continuous x; pause freezes it and normal replanning still wins',async()=>{
  const session=await fresh(0),page=session.page;try{const first=await play(session,createPilot(),{until:s=>s.model.player.row===2&&s.model.player.x>80&&s.model.player.x<340}),before=first.after.model;assert.ok(before.supportId!==null);await delay(250);let s=(await snapshot(page)).model;assert.equal(s.player.row,2);assert.ok(s.player.x<before.player.x);assert.ok(s.carriedDistance>before.carriedDistance);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(250);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);const result=await play(session,createPilot());assertProgress({...result,before:first.before,trace:[...first.trace,...result.trace]},assert);assert.equal(result.after.model.deaths,0);return {continuousCarry:true,carryingPauseFreeze:true,continuedNormallyToWin:true};}finally{await session.context.close();}
 });
 await test('three ordinary car contacts consume all lives and terminal input freezes',async()=>{
  const session=await fresh(2),page=session.page;try{const result=await play(session,createPilot({lose:true})),s=result.after.model;assert.equal(s.phase,'lost');assert.equal(s.reason,'lives');assert.equal(s.lives,0);assert.equal(s.deaths,3);assert.ok(s.deathHistory.every(d=>d.cause==='car'));await tap(page,'ArrowRight');await delay(150);assert.deepEqual((await snapshot(page)).model,s);await inspectFrame(page,path.join(output,'natural-car-loss.png'));return {naturalCarDeaths:3,terminalFrozen:true};}finally{await session.context.close();}
 });
 await test('revisiting a home naturally costs a life and cannot count twice; other homes still win',async()=>{
  const session=await fresh(0),page=session.page;try{const first=await play(session,createPilot(),{until:s=>s.model.goalCount===1}),home=first.after.model.visited[0];const repeat=await play(session,createPilot({allowedHomes:[home]}),{until:s=>s.model.deaths>0});assert.equal(repeat.after.model.lastDeath.cause,'repeat-home');assert.equal(repeat.after.model.goalCount,1);assert.equal(repeat.after.model.lives,2);const result=await play(session,createPilot());assertProgress({...result,before:first.before,trace:[...first.trace,...repeat.trace,...result.trace]},assert);assert.equal(result.after.model.deaths,1);return {repeatedHomeNotCounted:true,naturalLifeCost:true,recoveredToDifferentHomeWin:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
