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
async function select(page,to){for(let i=0;i<3;i++){if((await snapshot(page)).model.selected===to)return;await action(page,'ArrowRight','selected');}assert.equal((await snapshot(page)).model.selected,to);}
async function transfer(page,from,to){await select(page,from);await action(page,'Space','source');await select(page,to);await action(page,'Space','movesUsed');}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary legal tower transfer victory`,async()=>{
  const session=await fresh(level),page=session.page,pilot=createPilot(),held=new Set(),trace=[];
  try{const before=await snapshot(page),started=performance.now();let captured=false;
   while(performance.now()-started<60000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing')break;
    if(!captured&&s.model.movesUsed>=3){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${level+1}-playing-${width}.png`));}captured=true;}
    await applyKeys(page,pilot(s),held);await delay(85);
   }
   await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});assertProgress({before,after,trace},assert);verifyErrors(session);
   await inspectFrame(page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify({trace,commands:pilot.log()},null,2)+'\n');return {level,transfers:after.model.movesUsed,rings:after.model.diskCount};
  }finally{await releaseAll(page,[...held]);await session.context.close();}
 });
 await test('source selection and cancel preserve rings; invalid destinations cost nothing',async()=>{
  const session=await fresh(0),page=session.page;try{
   const initial=(await snapshot(page)).model;await action(page,'Space','source');assert.deepEqual((await snapshot(page)).model.pegs,initial.pegs);
   await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.movesUsed,0);
   await action(page,'b','source');await select(page,1);await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.source,null);
   await transfer(page,0,1);await select(page,0);await action(page,'Space','source');await select(page,1);const before=(await snapshot(page)).model;
   await action(page,'Space','blockedActions');const after=(await snapshot(page)).model;assert.deepEqual(after.pegs,before.pegs);assert.equal(after.movesUsed,1);assert.equal(after.source,0);
   await action(page,'b','source');assert.equal((await snapshot(page)).model.source,null);verifyErrors(session);return {sourceDoesNotRemove:true,cancelFree:true,emptyAndSamePegBlocked:true,largerOnSmallerBlocked:true};
  }finally{await session.context.close();}
 });
 await test('held A cannot transfer across pause without a real release',async()=>{
  const session=await fresh(0),page=session.page;try{
   await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.source===0);await delay(300);assert.equal((await snapshot(page)).model.movesUsed,0);
   await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(150);assert.deepEqual((await snapshot(page)).model,frozen);
   await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(200);assert.equal((await snapshot(page)).model.movesUsed,0);
   await page.keyboard.up('Space');await ready(page);await select(page,2);await action(page,'Space','movesUsed');assert.equal((await snapshot(page)).model.movesUsed,1);verifyErrors(session);return {heldDoesNotRepeat:true,pauseRelease:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('legal but wasteful transfers naturally exhaust budget; terminal state frozen',async()=>{
  const session=await fresh(0),page=session.page;try{
   const limit=(await snapshot(page)).model.moveLimit;for(let i=0;i<limit;i++)await transfer(page,i%2?1:0,i%2?0:1);
   const terminal=(await snapshot(page)).model;assert.equal(terminal.phase,'lost');assert.equal(terminal.reason,'moves');assert.equal(terminal.movesUsed,limit);
   await tap(page,'Space');await delay(150);assert.deepEqual((await snapshot(page)).model,terminal);verifyErrors(session);await inspectFrame(page,path.join(output,'natural-loss.png'));return {transfers:limit,terminalFrozen:true};
  }finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
