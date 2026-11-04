import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
import {findRoute,combine} from './reference.mjs';
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
  if(capture&&!captured&&s.model.mergesUsed>=1){for(const width of [960,1280]){await page.setViewportSize({width,height:width*9/16});await delay(80);await inspectFrame(page,path.join(output,`level-${s.model.level+1}-playing-${width}.png`));}captured=true;}
  await applyKeys(page,pilot(s),held);await delay(80);
 }await releaseAll(page,[...held]);const after=await snapshot(page);trace.push({elapsed:(performance.now()-started)/1000,state:after});verifyErrors(session);return {before,after,trace,commands:pilot.log()};}finally{await releaseAll(page,[...held]);}
}
async function select(page,mask){while((await snapshot(page)).model.terms[(await snapshot(page)).model.cursor].mask!==mask)await action(page,'ArrowRight','cursor');}
async function prepare(page,a,b,op){await select(page,a);await action(page,'Space','stage');await select(page,b);await action(page,'Space','stage');while((await snapshot(page)).model.opIndex!==op)await action(page,'ArrowRight','opIndex');}
async function merge(page,a,b,op){await prepare(page,a,b,op);await action(page,'Space','mergesUsed');}
try{
 await test('six distinct courses remain selectable with complete instructions at both TV sizes',async()=>{
  const session=await preparePage(browser,server.url),p=session.page,layouts=[];
  try{
   await p.waitForFunction(()=>document.querySelector('link[href="game-theme.css"]')?.sheet);
   assert.equal(await p.locator('[data-level]').count(),6);
   for(const width of [960,1280]){
    await p.setViewportSize({width,height:width*9/16});await delay(100);
    const ui=await p.evaluate(()=>{
     const aside=document.querySelector('aside'),bounds=aside.getBoundingClientRect(),rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom});
     const texts=[...aside.querySelectorAll('#tip,#room-address,.control p,.small-help')].map(el=>{const range=document.createRange();range.selectNodeContents(el);return {text:el.textContent,rects:[...range.getClientRects()].filter(r=>r.width&&r.height).map(rect)};});
     return {bounds:rect(bounds),clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,clientWidth:aside.clientWidth,scrollWidth:aside.scrollWidth,texts,buttons:[...document.querySelectorAll('[data-level]')].map(el=>({label:el.textContent,bounds:rect(el.getBoundingClientRect())})),scene:rect(document.querySelector('#scene').getBoundingClientRect())};
    });
    assert.ok(ui.scrollHeight<=ui.clientHeight+1&&ui.scrollWidth<=ui.clientWidth+1,'Instructions fit without scrolling');
    for(const text of ui.texts){assert.ok(text.text.trim()&&text.rects.length);for(const box of text.rects)assert.ok(box.left>=ui.bounds.left-1&&box.top>=ui.bounds.top-1&&box.right<=ui.bounds.right+1&&box.bottom<=ui.bounds.bottom+1,'Clipped instruction: '+text.text);}
    for(const button of ui.buttons)assert.ok(button.bounds.left>=ui.scene.left&&button.bounds.top>=ui.scene.top&&button.bounds.right<=ui.scene.right&&button.bounds.bottom<=ui.scene.bottom,'Clipped course button: '+button.label);
    const screenshot=path.join(output,`six-courses-${width}.png`);await inspectFrame(p,screenshot);layouts.push({width,...ui,screenshot});
   }
   for(let level=0;level<6;level++){await p.locator(`[data-level="${level}"]`).click();await p.waitForFunction(level=>PureTVQA.snapshot().level===level&&PureTVQA.snapshot().model.level===level,level);}
   await p.keyboard.down('Enter');await delay(80);await p.keyboard.up('Enter');await p.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');await delay(100);
   await p.keyboard.down('Space');await delay(80);await p.keyboard.up('Space');
   const playing=[];for(const width of [960,1280]){await p.setViewportSize({width,height:width*9/16});await delay(100);const screenshot=path.join(output,`new-layout-playing-${width}.png`);await inspectFrame(p,screenshot);playing.push(screenshot);}
   verifyErrors(session);return {layouts,playing};
  }finally{await session.context.close();}
 });
 if(!args.preview){
 for(let level=0;level<6;level++)await test(`level ${level+1}: ordinary exact arithmetic uses every source card and reaches24`,async()=>{
  const session=await fresh(level);try{const result=await play(session,createPilot(),{capture:true});assertProgress(result,assert);await inspectFrame(session.page,path.join(output,`level-${level+1}-won.png`));await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,merges:result.after.model.mergesUsed,expression:result.after.model.terms[0].expr,fractionsObserved:result.trace.some(t=>t.state.model.terms.some(term=>term.d!==1))};}finally{await session.context.close();}
 });
 await test('held confirmation selects only once, pause freezes it, and B cancels without spending a ticket',async()=>{
  const session=await fresh(0),page=session.page;try{await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.stage==='second');await delay(250);assert.equal((await snapshot(page)).model.mergesUsed,0);await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(page)).model;await delay(200);assert.deepEqual((await snapshot(page)).model,frozen);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await delay(150);assert.equal((await snapshot(page)).model.stage,'second');await page.keyboard.up('Space');await ready(page);await action(page,'b','stage');const s=(await snapshot(page)).model;assert.equal(s.stage,'first');assert.equal(s.undoTickets,2);assert.equal(s.mergesUsed,0);verifyErrors(session);return {heldSelectOnly:true,pauseFreeze:true,pendingCancelFree:true};}finally{await releaseAll(page,['Space']);await session.context.close();}
 });
 await test('ordinary zero divisor is rejected freely and preserves the selected division',async()=>{
  const session=await fresh(2),page=session.page;try{await merge(page,1,2,1);await prepare(page,4,3,4);const before=(await snapshot(page)).model;await action(page,'Space','blockedActions');const s=(await snapshot(page)).model;for(const k of ['terms','stage','firstMask','secondMask','opIndex','mergesUsed','failures','undoTickets'])assert.deepEqual(s[k],before[k]);assert.ok(s.message.includes('0')||s.message.includes('零'));await inspectFrame(page,path.join(output,'zero-divisor.png'));verifyErrors(session);return {rejectedWithoutCost:true,selectionPreserved:true};}finally{await session.context.close();}
 });
 await test('undoing a completed wrong result retains its failure and global merge cost before repair',async()=>{
  const session=await fresh(0),page=session.page;try{const initial=(await snapshot(page)).model,route=findRoute(initial.terms).route;for(const c of route.slice(0,-1))await merge(page,c.firstMask,c.secondMask,c.opIndex);const before=(await snapshot(page)).model,last=route.at(-1),a=before.terms.find(t=>t.mask===last.firstMask),b=before.terms.find(t=>t.mask===last.secondMask);let wrongOp=0;while(!combine(a,b,wrongOp)||combine(a,b,wrongOp).n===24*combine(a,b,wrongOp).d)wrongOp++;await merge(page,last.firstMask,last.secondMask,wrongOp);assert.equal((await snapshot(page)).model.stage,'retry');await action(page,'b','undoUsed');let s=(await snapshot(page)).model;assert.deepEqual(s.terms,before.terms);assert.equal(s.failures,1);assert.equal(s.mergesUsed,3);assert.equal(s.currentAttempt,2);assert.equal(s.undoTickets,1);await merge(page,last.firstMask,last.secondMask,last.opIndex);s=(await snapshot(page)).model;assert.equal(s.phase,'won');assert.equal(s.failures,1);assert.equal(s.mergesUsed,4);assert.equal(s.attemptHistory.length,2);verifyErrors(session);return {failedChanceRetained:true,noMergeRefund:true,repairWon:true};}finally{await session.context.close();}
 });
 await test('three ordinary wrong completions naturally lose and terminal input cannot reset or undo',async()=>{
  const session=await fresh(0),page=session.page;try{const result=await play(session,createPilot({wrong:true})),s=result.after.model;assert.equal(s.phase,'lost');assert.equal(s.reason,'attempts');assert.equal(s.failures,3);assert.equal(s.mergesUsed,9);await tap(page,'Space');await tap(page,'b');await delay(150);assert.deepEqual((await snapshot(page)).model,s);await inspectFrame(page,path.join(output,'natural-attempt-loss.png'));return {naturalFailures:3,terminalFrozen:true};}finally{await session.context.close();}
 });
 await test('correct arithmetic wins on the third attempt after two genuine failed completions',async()=>{
  const session=await fresh(2);try{const partial=await play(session,createPilot({wrong:true}),{until:s=>s.model.failures===2}),result=await play(session,createPilot());assertProgress({...result,before:partial.before,trace:[...partial.trace,...result.trace]},assert);assert.equal(result.after.model.currentAttempt,3);assert.equal(result.after.model.failures,2);assert.equal(result.after.model.mergesUsed,9);return {thirdAttemptWon:true,failuresNotRefunded:true};}finally{await session.context.close();}
 });
 }
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
