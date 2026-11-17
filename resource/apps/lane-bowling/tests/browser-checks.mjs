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
 try{while(performance.now()-started<60000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing'||until?.(s))break;
  if(capture&&!captured&&s.model.stage==='rolling'&&s.model.shotTicks>=8){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
  await applyKeys(page,pilot(s),held);await delay(60);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
async function gutterAim(page){while((await snapshot(page)).model.angle<24)await action(page,'ArrowRight','angle');while((await snapshot(page)).model.power<3)await action(page,'ArrowUp','power');}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary physical throws clear public pins and match independent circle simulation`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,shots:result.after.model.shotsUsed,fallen:result.after.model.fallenCount,ballHits:result.after.model.totalBallHits,pinChainHits:result.after.model.totalPinHits};}finally{await session.context.close();}
 });
 await test('pause freezes moving bodies and held launch never spends the next throw',async()=>{
  const session=await fresh(0),page=session.page;try{await gutterAim(page);await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.shotsUsed===1);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;assert.equal(frozen.stage,'rolling');await delay(250);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await page.waitForFunction(()=>PureTVQA.snapshot().model.stage==='aiming');await delay(250);let s=(await snapshot(page)).model;assert.equal(s.shotsUsed,1);assert.equal(s.phase,'playing');assert.equal(s.fallenCount,0);await page.keyboard.up('Space');await ready(page);verifyErrors(session);return {movingBodiesFreeze:true,heldDoesNotRelaunch:true,naturalGutter:true};}finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('aim and launch commands during rolling are rejected without changing aim or throw count',async()=>{
  const session=await fresh(1),page=session.page;try{await action(page,'Space','shotsUsed');let s=(await snapshot(page)).model;assert.equal(s.stage,'rolling');const angle=s.angle,power=s.power;await action(page,'ArrowLeft','blockedActions');await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.equal(s.angle,angle);assert.equal(s.power,power);assert.equal(s.shotsUsed,1);assert.ok(s.shotTicks>0);verifyErrors(session);return {rollingAimBlocked:true,extraLaunchFree:true,physicsContinues:true};}finally{await session.context.close();}
 });
 await test('ordinary gutter throws exhaust the budget with no arbitrary pin awards',async()=>{
  const session=await fresh(0),page=session.page;try{const result=await play(session,createPilot({lose:true})),s=result.after.model;assert.equal(s.phase,'lost');assert.equal(s.reason,'throws');assert.equal(s.shotsUsed,s.shotLimit);assert.equal(s.fallenCount,0);assert.equal(s.fallReceipts.length,0);assert.ok(s.shotHistory.every(shot=>shot.gutter&&shot.ballHits===0));await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,s);await inspectFrame(page,path.join(output,'natural-gutter-loss.png'));return {throws:s.shotsUsed,noUnhitPinsAwarded:true,terminalFrozen:true};}finally{await session.context.close();}
 });
 await test('a genuine missed throw followed by ordinary physical clears wins on the last allowed throw',async()=>{
  const session=await fresh(1),page=session.page;try{const before=await snapshot(page);await gutterAim(page);await action(page,'Space','shotsUsed');await page.waitForFunction(()=>PureTVQA.snapshot().model.stage==='aiming');assert.equal((await snapshot(page)).model.fallenCount,0);const result=await play(session,createPilot());assertProgress({...result,before},assert);assert.equal(result.after.model.shotsUsed,result.after.model.shotLimit);return {finalAllowedThrowWin:true,firstThrowNaturalMiss:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
