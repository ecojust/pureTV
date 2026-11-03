// Real browser event regressions. No injected model state or synthetic clock.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot,assertProgress} from './automation.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output,'--assets and --output required');
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function neutral(page){await page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase==='playing'&&!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none';});}
async function press(page,key){
 await neutral(page);const before=(await snapshot(page)).model;await page.keyboard.down(key);
 try{await page.waitForFunction(({key,moves,selected})=>{const s=PureTVQA.snapshot().model;return key==='Space'?s.movesUsed>moves:s.selected!==selected;},{key,moves:before.movesUsed,selected:before.selected});}
 finally{await page.keyboard.up(key);}
 await neutral(page);
}
async function pause(page,value){await page.keyboard.down('p');try{await page.waitForFunction(value=>PureTVQA.snapshot().paused===value,value);}finally{await page.keyboard.up('p');}}
async function fresh(level){
 const session=await preparePage(browser,server.url),page=session.page;
 await page.locator(`[data-level="${level}"]`).click();await page.waitForFunction(level=>PureTVQA.snapshot().level===level,level);
 await page.keyboard.down('Enter');try{await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}finally{await page.keyboard.up('Enter');}
 await neutral(page);assert.equal((await snapshot(page)).model.level,level);return session;
}
async function drive(session,pilot,seconds=45){const held=new Set(),trace=[],start=performance.now();let captured=false;try{while(performance.now()-start<seconds*1000){const s=await snapshot(session.page);trace.push({elapsed:(performance.now()-start)/1000,state:s});if(!captured&&s.model.inboundIndex>=4&&s.model.nextDelivery===0&&s.model.held!==null){await inspectFrame(session.page,path.join(output,`level-${s.model.level+1}-loaded.png`));captured=true;}if(s.phase!=='playing')return {state:s,trace,diagnostics:pilot.diagnostics()};await applyKeys(session.page,pilot(s),held);await delay(85);}}finally{await releaseAll(session.page,[...held]);}throw Error('Ordinary pilot exceeded wall-clock limit');}
async function test(name,fn){const started=performance.now();try{const details=await fn();report.tests.push({name,passed:true,milliseconds:performance.now()-started,...details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
try{
 await test('ordinary full-capacity bay and held cargo remain separately visible',async()=>{
  const session=await fresh(1),page=session.page;
  try{
   for(let crate=1;crate<=3;crate++){await press(page,'Space');await press(page,'ArrowRight');await press(page,'Space');await press(page,'ArrowLeft');}
   await press(page,'Space');await press(page,'ArrowRight');const state=await snapshot(page);
   assert.deepEqual(state.model.bays,[[1,2,3],[],[]]);assert.equal(state.model.held,4);assert.equal(state.model.selected,1);assert.equal(state.model.movesUsed,7);
   const screenshots=[];for(const viewport of [{width:1280,height:720},{width:960,height:540}]){await page.setViewportSize(viewport);await delay(150);const file=path.join(output,`full-bay-held-${viewport.width}.png`);await inspectFrame(page,file);screenshots.push(file);}
   verifyErrors(session);return {screenshots,state};
  }finally{await session.context.close();}
 });
 for(let level=0;level<3;level++)await test(`level ${level+1}: complete visible manifest through ordinary input`,async()=>{
  const s=await fresh(level);try{const before=await snapshot(s.page),result=await drive(s,createPilot());assertProgress({before,after:result.state,trace:result.trace},assert);verifyErrors(s);
   const frame=path.join(output,`level-${level+1}-won.png`);await inspectFrame(s.page,frame);
   await writeFile(path.join(output,`level-${level+1}-trace.json`),JSON.stringify(result,null,2)+'\n');
   return {level,moves:result.state.model.movesUsed,delivered:result.state.model.nextDelivery,screenshot:frame,searches:result.diagnostics.searches};
  }finally{await s.context.close();}
 });
 for(const policy of ['mistakes','moves'])await test(`natural ${policy} loss and terminal freeze`,async()=>{
  const s=await fresh(0);try{const result=await drive(s,createPilot({policy}));assert.equal(result.state.phase,'lost');assert.equal(result.state.model.reason,policy);
   if(policy==='mistakes'){assert.equal(result.state.model.mistakes,3);assert.equal(result.state.model.nextDelivery,0);assert.equal(result.state.model.held,1);}
   else assert.equal(result.state.model.movesUsed,result.state.model.moveLimit+1);
   const terminal=structuredClone(result.state.model);await tap(s.page,'Space');await delay(150);assert.deepEqual((await snapshot(s.page)).model,terminal,'Terminal model remains exactly frozen');verifyErrors(s);
   await writeFile(path.join(output,`${policy}-trace.json`),JSON.stringify(result,null,2)+'\n');return {reason:terminal.reason,moves:terminal.movesUsed,mistakes:terminal.mistakes};
  }finally{await s.context.close();}
 });
 await test('held A does not repeat; pause/resume requires a real release',async()=>{
  const s=await fresh(0),page=s.page;try{
   await press(page,'Space');await press(page,'ArrowRight');
   await page.keyboard.down('Space');await page.waitForFunction(()=>PureTVQA.snapshot().model.movesUsed===2);await delay(450);let current=await snapshot(page);
   assert.equal(current.model.movesUsed,2);assert.equal(current.model.held,null);assert.deepEqual(current.model.bays,[[1],[],[]]);
   await pause(page,true);const frozen=await snapshot(page);assert.equal(frozen.paused,true);await delay(200);assert.deepEqual((await snapshot(page)).model,frozen.model);
   await pause(page,false);await delay(350);current=await snapshot(page);assert.equal(current.paused,false);assert.equal(current.model.movesUsed,2);assert.equal(current.model.held,null);
   await page.keyboard.up('Space');await neutral(page);await press(page,'Space');current=await snapshot(page);assert.equal(current.model.movesUsed,3);assert.equal(current.model.held,1);assert.deepEqual(current.model.bays,[[],[],[]]);verifyErrors(s);
   const screenshot=path.join(output,'crane-after-real-release.png');await inspectFrame(page,screenshot);return {moves:current.model.movesUsed,screenshot};
  }finally{await releaseAll(page,['Space','p']);await s.context.close();}
 });
 assert.deepEqual(await sourceHashes(assets),hashes,'Read-only QA must not modify assets');report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
