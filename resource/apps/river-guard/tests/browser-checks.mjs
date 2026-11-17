import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
import {solveVisible} from './reference.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function ready(page){await page.waitForFunction(()=>{const s=PureTVQA.snapshot();return s.phase==='playing'&&!s.paused&&s.model.inputArmed&&!s.model.lastHeld.a&&!s.model.lastHeld.b&&s.model.lastHeld.direction==='none';});}
async function fresh(level){const session=await preparePage(browser,server.url);await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await ready(session.page);return session;}
async function action(page,key,field){await ready(page);const before=JSON.stringify((await snapshot(page)).model[field]);await page.keyboard.down(key);try{await page.waitForFunction(({field,before})=>JSON.stringify(PureTVQA.snapshot().model[field])!==before,{field,before});}finally{await page.keyboard.up(key);}if((await snapshot(page)).phase==='playing')await ready(page);}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
async function select(page,to){while((await snapshot(page)).model.selected!==to)await action(page,'ArrowRight','selected');}
async function load(page,cargo){for(const i of cargo){await select(page,i);await action(page,'Space','cargo');}}
async function play(session,pilot,{capture=false}={}){
 const page=session.page,held=new Set(),trace=[],before=await snapshot(page),started=performance.now();let captured=false;
 try{
  while(performance.now()-started<60000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
   if(capture&&!captured&&s.model.crossingsUsed>=2){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
   await applyKeys(page,pilot(s),held);await delay(85);
  }
  await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};
 }finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary safe crossings match independent bank partition plan`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,crossings:result.after.model.crossingsUsed,delivered:result.after.model.deliveredCount};}finally{await session.context.close();}
 });
 await test('capacity and wrong-bank selections are blocked; loading and unloading preserve bank membership',async()=>{
  const session=await fresh(0),page=session.page;try{
   const initial=(await snapshot(page)).model;await select(page,1);await action(page,'Space','cargo');assert.deepEqual((await snapshot(page)).model.sides,initial.sides);
   await select(page,0);await action(page,'Space','blockedActions');let s=(await snapshot(page)).model;assert.deepEqual(s.cargo,[1]);assert.equal(s.crossingsUsed,0);
   await select(page,1);await action(page,'Space','cargo');assert.deepEqual((await snapshot(page)).model.cargo,[]);await action(page,'Space','cargo');await action(page,'b','crossingsUsed');
   await select(page,0);await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.equal(s.crossingsUsed,1);assert.deepEqual(s.cargo,[]);assert.equal(s.sides[0],0);assert.equal(s.farmer,1);verifyErrors(session);return {capacityBounded:true,otherBankBlocked:true,unloadFree:true,selectionDoesNotMove:true};
  }finally{await session.context.close();}
 });
 await test('held B crosses once; pause freezes and release permits an empty return',async()=>{
  const session=await fresh(0),page=session.page;try{
   await load(page,[1]);await page.keyboard.down('b');await page.waitForFunction(()=>PureTVQA.snapshot().model.crossingsUsed===1);await delay(250);assert.equal((await snapshot(page)).model.crossingsUsed,1);
   await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.crossingsUsed,1);
   await page.keyboard.up('b');await ready(page);await action(page,'b','crossingsUsed');const s=(await snapshot(page)).model;assert.equal(s.crossingsUsed,2);assert.deepEqual(s.lastCrossing.cargo,[]);assert.equal(s.phase,'playing');verifyErrors(session);return {heldDoesNotRepeat:true,pauseFreeze:true,ordinaryEmptyReturn:true};
  }finally{await releaseAll(page,['b']);await session.context.close();}
 });
 await test('an unattended conflict naturally loses on an empty departure',async()=>{
  const session=await fresh(2),page=session.page;try{await action(page,'b','crossingsUsed');const s=(await snapshot(page)).model;assert.equal(s.phase,'lost');assert.equal(s.reason,'danger');assert.deepEqual(s.dangerPairs,s.conflicts);await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,s);verifyErrors(session);await inspectFrame(page,path.join(output,'natural-danger-loss.png'));return {unsafePairs:s.dangerPairs,terminalFrozen:true};}finally{await session.context.close();}
 });
 await test('safe but wasteful round trips exhaust the actual crossing allowance',async()=>{
  const session=await fresh(0),page=session.page;try{const initial=(await snapshot(page)).model,cargo=solveVisible(initial).route[0].cargo;for(let i=0;i<initial.crossingLimit;i++){await load(page,cargo);await action(page,'b','crossingsUsed');}const s=(await snapshot(page)).model;assert.equal(s.phase,'lost');assert.equal(s.reason,'crossings');assert.equal(s.crossingsUsed,s.crossingLimit);assert.deepEqual(s.dangerPairs,[]);verifyErrors(session);await inspectFrame(page,path.join(output,'natural-budget-loss.png'));return {crossings:s.crossingsUsed,danger:false};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
