// Ordinary Chromium keys and read-only snapshots; no secret access or synthetic clock.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,observe,symbolKey,assertProgress} from './automation.mjs';
import {publicLayouts,feedback} from './puzzle-tools.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch(),earnedCodes=new Map();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function read(page){const q=await snapshot(page);observe(q.model);return q;}
async function neutral(page){await page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase!=='playing'||(!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none');});}
async function press(page,key){await neutral(page);const before=await read(page);assert.equal(before.phase,'playing');await page.keyboard.down(key);
 try{await page.waitForFunction(({key,call})=>{const s=PureTVQA.snapshot().model;return s.calls>call&&(key==='Space'?s.lastHeld.a:key==='b'?s.lastHeld.b:s.lastHeld.direction===({ArrowRight:'right',ArrowLeft:'left',ArrowUp:'up',ArrowDown:'down'}[key]));},{key,call:before.model.calls});}
 finally{await page.keyboard.up(key);}await neutral(page);return read(page);
}
async function fresh(level){const session=await preparePage(browser,server.url),page=session.page;await page.locator(`[data-level="${level}"]`).click();await page.waitForFunction(v=>PureTVQA.snapshot().level===v,level);await page.keyboard.down('Enter');try{await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await page.keyboard.up('Enter');}await neutral(page);return session;}
async function setGuess(page,guess){for(let i=0;i<4;i++){let q=await read(page);while(q.model.cursor!==i)q=await press(page,i>q.model.cursor?'ArrowRight':'ArrowLeft');for(let j=0;q.model.guess[i]!==guess[i]&&j<7;j++)q=await press(page,symbolKey(q.model.guess[i],guess[i],publicLayouts[q.model.level].symbols));assert.equal(q.model.guess[i],guess[i]);}}
async function drive(session,pilot){const held=new Set(),trace=[],start=performance.now();try{while(performance.now()-start<60000){const q=await read(session.page);trace.push({elapsed:(performance.now()-start)/1000,state:q});if(q.phase!=='playing'){pilot(q);return {state:q,trace,diagnostics:pilot.diagnostics()};}await applyKeys(session.page,pilot(q),held);await delay(75);}}finally{await releaseAll(session.page,[...held]);}throw Error('Code pilot wall-clock limit');}
async function test(name,fn){const start=performance.now();try{const details=await fn();report.tests.push({name,passed:true,milliseconds:performance.now()-start,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 await test('incomplete submit and clear are free; complete feedback is aggregate and copied',async()=>{const session=await fresh(2),p=session.page;try{
  let q=await press(p,'Space');assert.equal(q.model.history.length,0);assert.equal(q.model.blockedActions,1);assert.equal(q.model.reveal,null);
  q=await press(p,'ArrowUp');assert.equal(q.model.guess[0],0);q=await press(p,'b');assert.equal(q.model.guess[0],null);assert.equal(q.model.attemptsUsed,0);
  q=await press(p,'ArrowDown');assert.equal(q.model.guess[0],5);await setGuess(p,[0,0,1,1]);q=await press(p,'Space');assert.equal(q.phase,'playing');assert.equal(q.model.reveal,null);assert.equal(q.model.history.length,1);assert.equal(q.model.attemptsRemaining,8);assert.deepEqual(q.model.history[0].guess,[0,0,1,1]);
  const row=structuredClone(q.model.history[0]);q=await press(p,'b');assert.equal(q.model.guess[3],null);assert.deepEqual(q.model.history[0],row);assert.equal(q.model.attemptsUsed,1);
  const screenshots=[];for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await p.setViewportSize(viewport);await delay(120);const f=path.join(output,`feedback-and-clear-${viewport.width}.png`);await inspectFrame(p,f);screenshots.push(f);}verifyErrors(session);return {screenshots,state:q};
 }finally{await session.context.close();}});
 if(!args.preview){
  for(let level=0;level<3;level++)await test(`level ${level+1}: public feedback alone yields an ordinary win`,async()=>{const session=await fresh(level);try{const before=await read(session.page),result=await drive(session,createPilot());assertProgress({before,after:result.state,trace:result.trace},assert);earnedCodes.set(level,result.state.model.reveal.slice());verifyErrors(session);const screenshot=path.join(output,`level-${level+1}-won.png`);await inspectFrame(session.page,screenshot);await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');return {level,attempts:result.state.model.attemptsUsed,screenshot,plans:result.diagnostics.plans};}finally{await session.context.close();}});
  await test('a code earned in previous normal play wins on the exact final attempt',async()=>{const session=await fresh(0),p=session.page;try{
   const known=earnedCodes.get(0);assert.ok(known,'Code must first be earned by ordinary browser victory');const wrong=[0,0,0,0];if(wrong.every((x,i)=>x===known[i]))wrong.fill(1);await setGuess(p,wrong);
   for(let i=0;i<6;i++){const q=await press(p,'Space');assert.equal(q.phase,'playing');assert.equal(q.model.reveal,null);assert.deepEqual({exact:q.model.history.at(-1).exact,misplaced:q.model.history.at(-1).misplaced},feedback(known,wrong));}
   await setGuess(p,known);const q=await press(p,'Space');assert.equal(q.phase,'won');assert.equal(q.model.attemptsRemaining,0);assert.equal(q.model.attemptsUsed,7);assert.deepEqual(q.model.reveal,known);verifyErrors(session);return {attempts:q.model.attemptsUsed,terminalReceipt:q.model.terminalReceipt};
  }finally{await session.context.close();}});
  await test('repeated known-wrong guesses naturally exhaust attempts and freeze',async()=>{const session=await fresh(0);try{
   const known=earnedCodes.get(0),wrong=[0,0,0,0];if(wrong.every((x,i)=>x===known[i]))wrong.fill(1);const result=await drive(session,createPilot({repeatGuess:wrong})),s=result.state.model;
   assert.equal(result.state.phase,'lost');assert.equal(s.reason,'attempts');assert.equal(s.attemptsUsed,7);assert.equal(s.attemptsRemaining,0);assert.deepEqual(s.reveal,known);for(const row of s.history)assert.deepEqual({exact:row.exact,misplaced:row.misplaced},feedback(known,row.guess));
   const frozen=structuredClone(s);await session.page.keyboard.down('b');await delay(120);await session.page.keyboard.up('b');assert.deepEqual((await read(session.page)).model,frozen);verifyErrors(session);await writeFile(path.join(output,'exhaustion-trace.json'),JSON.stringify(result,null,2)+'\n');return {attempts:s.attemptsUsed,terminalReceipt:s.terminalReceipt};
  }finally{await session.context.close();}});
  await test('held direction edits once; pause requires real release before next edit',async()=>{const session=await fresh(0),p=session.page;try{
   await p.keyboard.down('ArrowUp');await p.waitForFunction(()=>PureTVQA.snapshot().model.guess[0]===0);await delay(200);assert.equal((await read(p)).model.edits,1);
   for(const paused of [true,false]){await p.keyboard.down('p');try{await p.waitForFunction(v=>PureTVQA.snapshot().paused===v,paused);}finally{await p.keyboard.up('p');}if(paused){const frozen=await read(p);await delay(150);assert.deepEqual((await read(p)).model,frozen.model);}}
   await delay(180);let q=await read(p);assert.equal(q.model.guess[0],0);assert.equal(q.model.edits,1);await p.keyboard.up('ArrowUp');await neutral(p);q=await press(p,'ArrowUp');assert.equal(q.model.guess[0],1);assert.equal(q.model.edits,2);assert.equal(q.model.attemptsUsed,0);verifyErrors(session);return {guess:q.model.guess,edits:q.model.edits};
  }finally{await releaseAll(p,['ArrowUp','p']);await session.context.close();}});
 }
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
