// Ordinary Chromium keyboard input, real wall clock, snapshot-only observation.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
import {cursorRoute} from './puzzle-tools.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function neutral(page){await page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase!=='playing'||(!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none');});}
async function press(page,key){await neutral(page);const before=await snapshot(page);assert.equal(before.phase,'playing');await page.keyboard.down(key);
 try{await page.waitForFunction(({key,call})=>{const s=PureTVQA.snapshot().model;return s.calls>call&&(key==='Space'?s.lastHeld.a:key==='b'?s.lastHeld.b:s.lastHeld.direction===({ArrowRight:'right',ArrowLeft:'left',ArrowUp:'up',ArrowDown:'down'}[key]));},{key,call:before.model.calls});}
 finally{await page.keyboard.up(key);}await neutral(page);return snapshot(page);
}
async function cursor(page,to){const s=await snapshot(page);for(const key of cursorRoute(s.model.cursor,to))await press(page,key);assert.equal((await snapshot(page)).model.cursor,to);}
async function fresh(level){const session=await preparePage(browser,server.url),page=session.page;await page.locator(`[data-level="${level}"]`).click();await page.waitForFunction(v=>PureTVQA.snapshot().level===v,level);
 await page.keyboard.down('Enter');try{await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await page.keyboard.up('Enter');}await neutral(page);return session;
}
async function drive(session,pilot){const held=new Set(),trace=[],start=performance.now();try{while(performance.now()-start<60000){const s=await snapshot(session.page);trace.push({elapsed:(performance.now()-start)/1000,state:s});if(s.phase!=='playing')return {state:s,trace,diagnostics:pilot.diagnostics()};await applyKeys(session.page,pilot(s),held);await delay(70);}}finally{await releaseAll(session.page,[...held]);}throw Error('Peg pilot wall-clock limit');}
async function test(name,fn){const start=performance.now();try{const details=await fn();report.tests.push({name,passed:true,milliseconds:performance.now()-start,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 await test('blocked adjacent landing, free cancel and exact three-hole jump/undo',async()=>{
  const session=await fresh(0),p=session.page;try{
   const initial=(await snapshot(p)).model.occupied;let q=await press(p,'Space');assert.equal(q.model.source,null);assert.equal(q.model.blockedActions,1);
   await cursor(p,1);await press(p,'Space');await cursor(p,0);q=await press(p,'Space');assert.equal(q.model.source,1);assert.equal(q.model.jumpsMade,0);assert.deepEqual(q.model.occupied,initial);
   q=await press(p,'b');assert.equal(q.model.source,null);assert.equal(q.model.undoRemaining,3);
   await cursor(p,3);await press(p,'Space');await cursor(p,0);q=await press(p,'Space');assert.equal(q.model.pegsRemaining,13);assert.equal(q.model.occupied[3],false);assert.equal(q.model.occupied[1],false);assert.equal(q.model.occupied[0],true);
   q=await press(p,'b');assert.deepEqual(q.model.occupied,initial);assert.equal(q.model.undoRemaining,2);assert.equal(q.model.cursor,3);assert.equal(q.model.source,null);
   await press(p,'Space');await cursor(p,0);q=await snapshot(p);assert.equal(q.model.source,3);assert.equal(q.model.cursor,0);
   const screenshots=[];for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await p.setViewportSize(viewport);await delay(120);const f=path.join(output,`selected-jump-${viewport.width}.png`);await inspectFrame(p,f);screenshots.push(f);}verifyErrors(session);return {screenshots,state:q};
  }finally{await session.context.close();}
 });
 if(!args.preview){
  for(let level=0;level<3;level++)await test(`level ${level+1}: thirteen ordinary jumps leave one peg`,async()=>{const session=await fresh(level);try{const before=await snapshot(session.page),result=await drive(session,createPilot());assertProgress({before,after:result.state,trace:result.trace},assert);verifyErrors(session);const screenshot=path.join(output,`level-${level+1}-won.png`);await inspectFrame(session.page,screenshot);await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,jumps:result.state.model.jumpsMade,pegs:result.state.model.pegsRemaining,screenshot};}finally{await session.context.close();}});
  await test('natural dead end recovers three times then loses without credits',async()=>{const session=await fresh(0);try{const result=await drive(session,createPilot({policy:'dead-end'})),s=result.state.model;assert.equal(result.state.phase,'lost');assert.equal(s.reason,'dead-end');assert.equal(s.undoRemaining,0);assert.equal(s.undosUsed,3);assert.equal(s.legalJumps.length,0);assert.ok(s.pegsRemaining>1);assert.ok(result.trace.some(t=>t.state.phase==='playing'&&t.state.model.legalJumps.length===0&&t.state.model.undoRemaining>0),'An actual recoverable dead end was observed');const frozen=structuredClone(s);await session.page.keyboard.down('b');await delay(120);await session.page.keyboard.up('b');assert.deepEqual((await snapshot(session.page)).model,frozen);verifyErrors(session);await writeFile(path.join(output,'dead-end-trace.json'),JSON.stringify(result,null,2)+'\n');return {pegs:s.pegsRemaining,undos:s.undosUsed};}finally{await session.context.close();}});
  await test('held source selection and pause require actual release before jumping',async()=>{const session=await fresh(0),p=session.page;try{
   await cursor(p,3);await p.keyboard.down('Space');await p.waitForFunction(()=>PureTVQA.snapshot().model.source===3);await delay(200);assert.equal((await snapshot(p)).model.blockedActions,0);
   for(const paused of [true,false]){await p.keyboard.down('p');try{await p.waitForFunction(v=>PureTVQA.snapshot().paused===v,paused);}finally{await p.keyboard.up('p');}if(paused){const frozen=await snapshot(p);await delay(150);assert.deepEqual((await snapshot(p)).model,frozen.model);}}
   await delay(180);let q=await snapshot(p);assert.equal(q.model.source,3);assert.equal(q.model.jumpsMade,0);assert.equal(q.model.blockedActions,0);await p.keyboard.up('Space');await neutral(p);await cursor(p,0);q=await press(p,'Space');assert.equal(q.model.pegsRemaining,13);assert.equal(q.model.jumpsMade,1);verifyErrors(session);return {pegs:q.model.pegsRemaining};
  }finally{await releaseAll(p,['Space','p']);await session.context.close();}});
 }
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
