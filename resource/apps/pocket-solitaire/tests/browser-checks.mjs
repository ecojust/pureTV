import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
import {navigation} from './reference.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function ready(page){await page.waitForFunction(()=>{const s=PureTVQA.snapshot();return s.phase==='playing'&&!s.paused&&s.model.inputArmed&&!s.model.lastHeld.a&&!s.model.lastHeld.b&&s.model.lastHeld.direction==='none';});}
async function fresh(level){const session=await preparePage(browser,server.url);await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await ready(session.page);return session;}
async function action(page,key,field){await ready(page);const before=(await snapshot(page)).model[field];await page.keyboard.down(key);try{await page.waitForFunction(({field,before})=>PureTVQA.snapshot().model[field]!==before,{field,before});}finally{await page.keyboard.up(key);}if((await snapshot(page)).phase==='playing')await ready(page);}
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
async function go(page,to){const s=(await snapshot(page)).model;for(const d of navigation(s.cursor,to))await action(page,d.key,'cursor');}
async function move(page,from,to){await go(page,from);await action(page,'Space','selectedSource');await go(page,to);await action(page,'Space','movesUsed');}
const position=s=>({tableau:s.tableau,freecells:s.freecells,foundations:s.foundations});
async function play(session,pilot,{capture=false,until=null}={}){
 const page=session.page,held=new Set(),trace=[],before=await snapshot(page),started=performance.now();let captured=false;
 try{while(performance.now()-started<90000){const s=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:s});if(s.phase!=='playing'||until?.(s))break;
  if(capture&&!captured&&s.model.movesUsed>=5){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
  await applyKeys(page,pilot(s),held);await delay(75);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
try{
 for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary one-card transfers complete all foundations`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,moves:result.after.model.movesUsed,temporary:result.after.model.movesUsed-result.after.model.cards.length};}finally{await session.context.close();}
 });
 await test('same-source cancel and blocked destinations are free; occupied freecell stays occupied',async()=>{
  const session=await fresh(0),page=session.page;try{const initial=(await snapshot(page)).model;await action(page,'Space','selectedSource');assert.deepEqual(position((await snapshot(page)).model),position(initial));await action(page,'Space','selectedSource');assert.equal((await snapshot(page)).model.selectedSource,null);
   await action(page,'Space','selectedSource');await go(page,6);await action(page,'Space','blockedActions');await go(page,1);await action(page,'Space','blockedActions');let s=(await snapshot(page)).model;assert.equal(s.selectedSource,0);assert.equal(s.movesUsed,0);assert.deepEqual(position(s),position(initial));await go(page,4);await action(page,'Space','movesUsed');await go(page,1);await action(page,'Space','selectedSource');await go(page,4);await action(page,'Space','blockedActions');s=(await snapshot(page)).model;assert.equal(s.selectedSource,1);assert.equal(s.movesUsed,1);assert.equal(s.freecells[0],initial.tableau[0].at(-1));verifyErrors(session);return {sameSourceCancel:true,foundationRule:true,tableauRule:true,occupiedFreecellBlocked:true};
  }finally{await session.context.close();}
 });
 await test('B restores a foundation card with no move refund and only two undo tickets',async()=>{
  const session=await fresh(0),page=session.page;try{const partial=await play(session,createPilot(),{until:s=>s.model.foundationCount>0}),s=partial.after.model,receipt=s.lastMove,completed=position(s);assert.ok(receipt.to>=6);const used=s.movesUsed;
   await go(page,receipt.to);await action(page,'Space','blockedActions');assert.equal((await snapshot(page)).model.selectedSource,null);
   await action(page,'b','undosUsed');let undone=(await snapshot(page)).model;assert.equal(undone.movesUsed,used);assert.equal(undone.undoTickets,1);assert.ok(undone.foundationCount<s.foundationCount);await move(page,receipt.from,receipt.to);assert.deepEqual(position((await snapshot(page)).model),completed);
   await action(page,'b','undosUsed');assert.equal((await snapshot(page)).model.undoTickets,0);await action(page,'b','blockedActions');assert.equal((await snapshot(page)).model.movesUsed,used+1);verifyErrors(session);return {foundationSourceBlocked:true,foundationUndoException:true,moveBudgetNotRefunded:true,ticketsBounded:2};
  }finally{await session.context.close();}
 });
 await test('held A selects only once and pause requires a genuine release',async()=>{
  const session=await fresh(0),page=session.page;try{const initial=position((await snapshot(page)).model);await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.selectedSource===0);await delay(250);assert.deepEqual(position((await snapshot(page)).model),initial);assert.equal((await snapshot(page)).model.movesUsed,0);
   await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.selectedSource,0);
   await page.keyboard.up('Space');await ready(page);await action(page,'Space','selectedSource');assert.equal((await snapshot(page)).model.selectedSource,null);verifyErrors(session);return {heldSelectOnly:true,pauseFreeze:true,realReleaseAllowsCancel:true};
  }finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('ordinary freecell shuttling naturally exhausts the move budget and freezes',async()=>{
  const session=await fresh(0),page=session.page;try{await move(page,0,4);while((await snapshot(page)).phase==='playing'){const s=(await snapshot(page)).model,from=s.freecells[0]===null?5:4;await move(page,from,from===4?5:4);}const s=(await snapshot(page)).model;assert.equal(s.phase,'lost');assert.equal(s.reason,'moves');assert.equal(s.movesUsed,s.moveLimit);await tap(page,'b');await delay(150);assert.deepEqual((await snapshot(page)).model,s);verifyErrors(session);await inspectFrame(page,path.join(output,'natural-budget-loss.png'));return {moves:s.movesUsed,terminalFrozen:true};}finally{await session.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
