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
async function go(page,to){while((await snapshot(page)).model.cursor!==to){const s=(await snapshot(page)).model,x=s.cursor%s.width,y=Math.floor(s.cursor/s.width),tx=to%s.width,ty=Math.floor(to/s.width);await action(page,x!==tx?(x<tx?'ArrowRight':'ArrowLeft'):(y<ty?'ArrowDown':'ArrowUp'),'cursor');}}
async function play(session,pilot,{capture=false,until=null}={}){
 const page=session.page,held=new Set(),trace=[],before=await snapshot(page),started=performance.now();let captured=false;
 try{while(performance.now()-started<60000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing'||until?.(s))break;
  if(capture&&!captured&&s.model.placements>=2){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
  await applyKeys(page,pilot(s),held);await delay(80);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: partition from public clues with ordinary corners and explicit submit`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,placements:result.after.model.placements,checks:result.after.model.checks,mistakes:result.after.model.mistakes};}finally{await session.context.close();}
 });
 await test('overlap is rejected freely, B cancels anchors, A removes whole regions and reuses IDs',async()=>{
  const session=await fresh(0),page=session.page;try{await action(page,'b','blockedActions');assert.equal((await snapshot(page)).model.checks,0);await action(page,'Space','anchor');await go(page,1);await action(page,'Space','placements');await go(page,4);await action(page,'Space','anchor');await go(page,0);let s=(await snapshot(page)).model;assert.equal(s.candidate.overlap,true);await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.equal(s.anchor,4);assert.equal(s.placements,1);assert.equal(s.mistakes,0);await action(page,'b','anchor');await action(page,'Space','removals');assert.equal((await snapshot(page)).model.coveredCount,0);await action(page,'Space','anchor');await action(page,'Space','placements');s=(await snapshot(page)).model;assert.equal(s.rectangles[0].id,1);assert.equal(s.rectangles[0].area,1);verifyErrors(session);return {overlapRejectedFree:true,anchorCancelFree:true,wholeRegionRemoved:true,lowestIdReused:true};}finally{await session.context.close();}
 });
 await test('holding A does not place a second corner, and pause preserves the anchor',async()=>{
  const session=await fresh(0),page=session.page;try{await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.anchor===0);await delay(250);assert.equal((await snapshot(page)).model.placements,0);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.anchor,0);assert.equal((await snapshot(page)).model.placements,0);await page.keyboard.up('Space');await ready(page);await action(page,'Space','placements');assert.equal((await snapshot(page)).model.rectangles[0].area,1);verifyErrors(session);return {heldDoesNotRepeat:true,pauseFreeze:true,anchorPreserved:true};}finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('a full wrong rectangle naturally loses after three separate checks and freezes',async()=>{
  const session=await fresh(0),page=session.page;try{const result=await play(session,createPilot({wrong:true})),s=result.after.model;assert.equal(s.phase,'lost');assert.equal(s.reason,'mistakes');assert.equal(s.checks,3);assert.equal(s.mistakes,3);assert.ok(s.lastCheck.errors.some(e=>e.type==='multiple-numbers'));await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,s);await inspectFrame(page,path.join(output,'natural-loss.png'));return {checks:s.checks,mistakes:s.mistakes,terminalFrozen:true};}finally{await session.context.close();}
 });
 await test('ordinary removal and redrawing clear stale errors and win on check three',async()=>{
  const session=await fresh(0),page=session.page;try{const partial=await play(session,createPilot({wrong:true}),{until:s=>s.model.checks===2});assert.equal(partial.after.model.mistakes,2);const result=await play(session,createPilot());assertProgress({...result,before:partial.before,trace:[...partial.trace,...result.trace]},assert);assert.equal(result.after.model.checks,3);assert.equal(result.after.model.mistakes,2);assert.equal(result.after.model.removals,1);assert.ok(result.trace.some(t=>t.state.model.removals===1&&t.state.model.lastCheck===null));return {thirdCheckWon:true,mistakesRemainTwo:true,editingClearsOldCheck:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
