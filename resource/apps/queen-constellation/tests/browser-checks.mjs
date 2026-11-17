// Ordinary Chromium keyboard input, real wall clock, snapshot-only observation.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,releaseAll,verifyErrors,delay,inspectFrame,sha256,PNG} from '../../../game-kit/qa/common.mjs';
import {createPilot,observe,assertProgress} from './automation.mjs';
import {layouts,solutions,nextCursorKey} from './puzzle-tools.mjs';

const args=parseArgs();
assert.ok(args.assets&&args.output,'--assets and --output required');
const assets=path.resolve(args.assets),output=path.resolve(args.output);
await mkdir(output,{recursive:true});
const searches=layouts.map(solutions),hashes=await sourceHashes(assets);
const server=await serveAssets(assets),browser=await launch();
const report={kind:'ordinary-browser-keyboard-regression',startedAt:new Date().toISOString(),sourceAssetHashes:hashes,
 physicalTvTested:false,physicalPhoneTested:false,preview:!!args.preview,
 publicPuzzles:searches.map((search,level)=>({level,size:layouts[level].size,solutions:search.solutions.length,visited:search.visited})),tests:[]};

async function read(page){const q=await snapshot(page);observe(q.model);return q;}
async function neutral(page){
 await page.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase!=='playing'||
  (!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none');});
}
async function heldAcknowledgment(page,key,call){
 await page.waitForFunction(({key,call})=>{
  const s=PureTVQA.snapshot().model,directions={ArrowRight:'right',ArrowLeft:'left',ArrowUp:'up',ArrowDown:'down'};
  return s.calls>call&&(key==='Space'?s.lastHeld.a:key==='b'?s.lastHeld.b:s.lastHeld.direction===directions[key]);
 },{key,call});
}
async function press(page,key){
 await neutral(page);const before=await read(page);assert.equal(before.phase,'playing');
 await page.keyboard.down(key);
 try{await heldAcknowledgment(page,key,before.model.calls);}
 finally{await page.keyboard.up(key);}
 await neutral(page);return read(page);
}
async function cursor(page,to){
 let q=await read(page);const n=layouts[q.model.level].size;
 assert.ok(Number.isInteger(to)&&to>=0&&to<n*n,'Cursor target is a public cell');
 for(let moves=0;q.model.cursor!==to&&moves<2*n;moves++)q=await press(page,nextCursorKey(q.model.cursor,to,n));
 assert.equal(q.model.cursor,to);return q;
}
async function fresh(level){
 const session=await preparePage(browser,server.url),page=session.page;
 try{
  await page.locator(`[data-level="${level}"]`).click();
  await page.waitForFunction(value=>PureTVQA.snapshot().level===value,level);
  await page.keyboard.down('Enter');
  try{await page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');}
  finally{await page.keyboard.up('Enter');}
  await neutral(page);const q=await read(page);assert.equal(q.model.level,level);return session;
 }catch(error){await session.context.close();throw error;}
}
async function capture(page,name,viewport){
 if(viewport){
  await page.setViewportSize(viewport);
  await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,viewport);
  await delay(120);
 }
 const file=path.join(output,name),inspection=await inspectFrame(page,file),bytes=await readFile(file),png=PNG.sync.read(bytes);
 const expected=viewport||page.viewportSize();assert.equal(png.width,expected.width);assert.equal(png.height,expected.height);
 return {file,sha256:sha256(bytes),width:png.width,height:png.height,...inspection};
}
async function drive(session,pilot,{validScreenshot}={}){
 const trace=[],screenshots=[],start=performance.now();let captured=false;
 try{
  while(performance.now()-start<90000){
   const q=await read(session.page);trace.push({elapsed:(performance.now()-start)/1000,state:q});
   if(q.phase!=='playing'){
    pilot(q); // Acknowledge the final B in the test-only pilot diagnostics.
    return {state:q,trace,diagnostics:pilot.diagnostics(),screenshots};
   }
   if(validScreenshot&&!captured&&q.model.canSubmit){
    assert.equal(q.model.phase,'playing');assert.equal(q.model.submissions,0);
    screenshots.push(await capture(session.page,validScreenshot));
    const after=await read(session.page);
    assert.equal(after.phase,'playing','An independently valid board stays in play until B');
    assert.equal(after.model.canSubmit,true);assert.deepEqual(after.model.queens,q.model.queens);
    assert.equal(after.model.submissions,0);assert.equal(after.model.checksRemaining,3);captured=true;
   }
   const keys=pilot(q);assert.ok(Array.isArray(keys)&&keys.length<=1,'Pilot requests one ordinary key at a time');
   if(keys.length)await press(session.page,keys[0]);
   else{await neutral(session.page);await delay(20);}
  }
 }finally{await releaseAll(session.page,['Space','b','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);}
 throw Error('Queen pilot wall-clock limit');
}
function assertWin(before,result){
 assertProgress({before,after:result.state,trace:result.trace},assert);
 const s=result.state.model,positions=s.queens.flatMap((on,id)=>on?[id]:[]);
 assert.ok(searches[s.level].solutions.some(solution=>JSON.stringify(solution)===JSON.stringify(positions)),
  'Winning board belongs to the independently enumerated public solutions');
 assert.equal(s.checkReceipts.at(-1).matched,true);assert.equal(s.checkReceipts.at(-1).outcome,'won');
 assert.equal(s.terminalReceipt.cause,'success');assert.deepEqual(s.terminalReceipt.queens,s.queens);
 assert.ok(result.diagnostics.actions.some(action=>action.key==='b'),'Pilot observed the explicit winning B');
}
async function saveTrace(name,result){await writeFile(path.join(output,name),JSON.stringify(result,null,2)+'\n');}
async function test(name,fn){
 const start=performance.now();
 try{const details=await fn();report.tests.push({name,passed:true,milliseconds:performance.now()-start,...details});console.log('PASS '+name);}
 catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}
}

try{
 await test('8x8 public clues stay protected and a failed check preserves conflicting queens',async()=>{
  const session=await fresh(2),page=session.page;
  try{
   const layout=layouts[2],initial=(await read(page)).model,clueAttempts=[];
   const clueCells=args.preview?[layout.blocked[0],layout.fixed[0]]:[...layout.blocked,...layout.fixed];
   for(const position of clueCells){
    await cursor(page,position);const before=(await read(page)).model,q=await press(page,'Space');
    assert.deepEqual(q.model.queens,initial.queens,'A cannot alter a blocked cell or fixed queen');
    assert.equal(q.model.blockedActions,before.blockedActions+1);
    assert.equal(q.model.placements,0);assert.equal(q.model.removals,0);
    assert.equal(q.model.checksRemaining,3);assert.equal(q.model.submissions,0);
    clueAttempts.push({position,kind:layout.fixed.includes(position)?'fixed':'blocked',blockedActions:q.model.blockedActions});
   }
   for(const position of [1,2]){await cursor(page,position);await press(page,'Space');}
   const before=(await read(page)).model;
   assert.equal(before.movableCount,2);assert.equal(before.queenCount,layout.fixed.length+2);
   assert.equal(before.placements,2);assert.equal(before.checksRemaining,3);
   assert.ok(before.conflicts.some(pair=>pair.a===1&&pair.b===2&&pair.kind==='row'),'Two movable queens visibly attack in their row');
   assert.ok(before.conflicts.some(pair=>pair.a===2&&pair.b===20&&pair.kind==='diagonal'),'Movable and fixed queens visibly attack diagonally');
   assert.equal(before.canSubmit,false);
   const q=await press(page,'b'),s=q.model;
   assert.equal(q.phase,'playing');assert.equal(s.checksRemaining,2);assert.equal(s.submissions,1);
   assert.deepEqual(s.queens,before.queens,'Rejected B preserves every placement');
   assert.deepEqual(s.conflicts,before.conflicts);assert.equal(s.placements,2);assert.equal(s.removals,0);
   assert.equal(s.checkReceipts.length,1);assert.equal(s.checkReceipts[0].matched,false);
   assert.equal(s.checkReceipts[0].outcome,'playing');assert.equal(s.checkReceipts[0].checksBefore,3);
   assert.equal(s.checkReceipts[0].checksAfter,2);assert.deepEqual(s.checkReceipts[0].queens,s.queens);
   const screenshots=[];
   for(const viewport of [{width:1280,height:720},{width:960,height:540}])screenshots.push(await capture(page,`queen-conflicts-${viewport.width}.png`,viewport));
   verifyErrors(session);return {level:2,clueAttempts,screenshots,state:await read(page)};
  }finally{await session.context.close();}
 });

 if(!args.preview){
  for(let level=0;level<3;level++)await test(`level ${level+1}: ordinary placement wins only after explicit B`,async()=>{
   const session=await fresh(level);
   try{
    const before=await read(session.page),result=await drive(session,createPilot(),
     level===0?{validScreenshot:'level-1-valid-before-submit.png'}:{});
    assertWin(before,result);assert.equal(result.state.model.submissions,1);assert.equal(result.state.model.checksRemaining,2);
    if(level===0)assert.equal(result.screenshots.length,1,'A valid pre-submit board was captured during play');
    const screenshot=await capture(session.page,`level-${level+1}-won.png`);verifyErrors(session);
    await saveTrace(`level-${level+1}-trace.json`,result);
    return {level,placements:result.state.model.placements,queens:result.state.model.queens,
     checksRemaining:result.state.model.checksRemaining,receipts:result.state.model.checkReceipts,screenshots:[...result.screenshots,screenshot]};
   }finally{await session.context.close();}
  });

  await test('a valid third and final check wins after two natural rejected checks',async()=>{
   const session=await fresh(2),page=session.page;
   try{
    const initial=(await read(page)).model;
    for(let used=1;used<=2;used++){
     const q=await press(page,'b');assert.equal(q.phase,'playing');assert.equal(q.model.canSubmit,false);
     assert.equal(q.model.submissions,used);assert.equal(q.model.checksRemaining,3-used);
     assert.deepEqual(q.model.queens,initial.queens);assert.equal(q.model.checkReceipts.at(-1).matched,false);
    }
    const before=await read(page),result=await drive(session,createPilot());assertWin(before,result);
    const s=result.state.model;assert.equal(s.submissions,3);assert.equal(s.checksRemaining,0);assert.equal(s.reason,'');
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.outcome),['playing','playing','won']);
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.checksAfter),[2,1,0]);
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.matched),[false,false,true]);
    assert.equal(s.terminalReceipt.checksRemaining,0);assert.equal(s.terminalReceipt.score,100);
    const screenshot=await capture(page,'final-check-won.png');verifyErrors(session);
    await saveTrace('final-check-trace.json',result);return {level:2,receipts:s.checkReceipts,terminalReceipt:s.terminalReceipt,screenshot};
   }finally{await session.context.close();}
  });

  await test('three natural invalid checks lose and every later game input leaves the model frozen',async()=>{
   const session=await fresh(0),page=session.page;
   try{
    await cursor(page,1);const placed=await press(page,'Space');assert.equal(placed.model.queenCount,1);
    const result=await drive(session,createPilot({policy:'exhaust'})),s=result.state.model;
    assert.equal(result.state.phase,'lost');assert.equal(s.reason,'checks');assert.equal(s.score,0);
    assert.equal(s.submissions,3);assert.equal(s.checksRemaining,0);assert.equal(s.canSubmit,false);
    assert.deepEqual(s.queens,placed.model.queens);assert.equal(s.placements,1);assert.equal(s.removals,0);
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.checksBefore),[3,2,1]);
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.checksAfter),[2,1,0]);
    assert.deepEqual(s.checkReceipts.map(receipt=>receipt.outcome),['playing','playing','lost']);
    for(const receipt of s.checkReceipts){assert.equal(receipt.matched,false);assert.deepEqual(receipt.queens,placed.model.queens);}
    for(const remaining of [2,1])assert.ok(result.trace.some(t=>t.state.phase==='playing'&&t.state.model.checksRemaining===remaining));
    assert.equal(s.terminalReceipt.cause,'checks');assert.deepEqual(s.terminalReceipt.queens,s.queens);
    const frozen=structuredClone(s);
    // Terminal commands intentionally cannot advance calls or produce a held acknowledgment.
    for(const key of ['Space','ArrowRight','b']){
     await page.keyboard.down(key);try{await delay(150);}finally{await page.keyboard.up(key);}
     assert.deepEqual((await read(page)).model,frozen,'Terminal state is an exact no-op under ordinary input');
    }
    const screenshot=await capture(page,'three-invalid-checks-lost.png');verifyErrors(session);
    await saveTrace('three-invalid-checks-trace.json',result);return {receipts:s.checkReceipts,terminalReceipt:s.terminalReceipt,screenshot};
   }finally{await session.context.close();}
  });

  await test('held A toggles once and pause quarantines it until an actual keyboard release',async()=>{
   const session=await fresh(0),page=session.page;
   try{
    await cursor(page,1);const before=await read(page);await page.keyboard.down('Space');
    await heldAcknowledgment(page,'Space',before.model.calls);
    const placed=await read(page);assert.equal(placed.model.queens[1],true);assert.equal(placed.model.placements,1);
    await page.waitForFunction(call=>PureTVQA.snapshot().model.calls>=call+10,placed.model.calls);
    let q=await read(page);assert.equal(q.model.lastHeld.a,true);assert.equal(q.model.placements,1);
    assert.equal(q.model.removals,0);assert.equal(q.model.checksRemaining,3);assert.deepEqual(q.model.queens,placed.model.queens);
    await page.keyboard.down('p');
    try{await page.waitForFunction(()=>PureTVQA.snapshot().paused===true);}finally{await page.keyboard.up('p');}
    const paused=await read(page);await delay(180);assert.deepEqual((await read(page)).model,paused.model,'Pause freezes the entire model');
    await page.keyboard.down('p');
    try{await page.waitForFunction(()=>PureTVQA.snapshot().paused===false);}finally{await page.keyboard.up('p');}
    await page.waitForFunction(call=>{
     const s=PureTVQA.snapshot().model;return s.calls>call&&!s.inputArmed&&s.cancelledLast&&!s.lastHeld.a;
    },paused.model.calls);
    const quarantined=await read(page);
    await page.waitForFunction(call=>PureTVQA.snapshot().model.calls>=call+10,quarantined.model.calls);
    q=await read(page);assert.equal(q.model.inputArmed,false);assert.equal(q.model.cancelledLast,true);
    assert.deepEqual(q.model.queens,placed.model.queens);assert.equal(q.model.placements,1);assert.equal(q.model.removals,0);
    assert.equal(q.model.blockedActions,0);assert.equal(q.model.submissions,0);assert.equal(q.model.checksRemaining,3);
    await page.keyboard.up('Space');await neutral(page);
    const rearmed=await read(page);assert.equal(rearmed.model.inputArmed,true);assert.equal(rearmed.model.cancelledLast,false);
    q=await press(page,'Space');assert.equal(q.model.queens[1],false);assert.equal(q.model.queenCount,0);
    assert.equal(q.model.placements,1);assert.equal(q.model.removals,1);assert.equal(q.model.checksRemaining,3);
    verifyErrors(session);return {heldPlacementCalls:placed.model.calls,quarantinedCalls:quarantined.model.calls,
     releaseRearmedCalls:rearmed.model.calls,placements:q.model.placements,removals:q.model.removals};
   }finally{await releaseAll(page,['Space','p']);await session.context.close();}
  });
 }
 assert.deepEqual(await sourceHashes(assets),hashes,'Served assets remain unchanged throughout browser QA');report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{
 await browser.close();await server.close();report.finishedAt=new Date().toISOString();
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
}
