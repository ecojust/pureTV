// Ordinary wall-clock keyboard inputs only. Snapshot reads never alter gameplay.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
import {createPilot} from './automation.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'six-task-normal-keyboard-regression',sourceAssetHashes:hashes,startedAt:new Date().toISOString(),physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,details});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
async function neutral(p){await p.waitForFunction(()=>{const q=PureTVQA.snapshot(),s=q.model;return q.phase!=='playing'||(!q.paused&&s.inputArmed&&!s.cancelledLast&&!s.lastHeld.a&&!s.lastHeld.b&&s.lastHeld.direction==='none');});}
async function start(session,level){const p=session.page;await p.locator(`[data-level="${level}"]`).click();await p.waitForFunction(level=>PureTVQA.snapshot().model.level===level,level);await p.keyboard.press('Enter');await p.waitForFunction(()=>PureTVQA.snapshot().phase==='playing');await neutral(p);}
async function drive(session,policy='align'){
 const held=new Set(),pilot=createPilot({policy}),began=performance.now();let partial=false,final;
 try{while(performance.now()-began<50000){const q=await snapshot(session.page);if(q.phase!=='playing'){final=q;break;}
  if(!partial&&q.model.placementsMade>=3){await session.page.screenshot({path:path.join(output,`task-${q.model.level+1}-packing.png`)});partial=true;}
  await applyKeys(session.page,pilot(q),held);await delay(35);
 }}finally{await releaseAll(session.page,[...held]);}
 assert.ok(final,'normal-input bounded play reaches a terminal state');verifyErrors(session);return final;
}
async function bounds(p){return p.evaluate(()=>{
 const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const aside=document.querySelector('aside'),stage=document.querySelector('.stage'),shell=document.querySelector('.workspace'),a=box(aside),nodes=[...aside.querySelectorAll('p,h3,.side-heading,.key')];
 const peers=[...aside.children].map(e=>({name:e.id||e.className||e.tagName,box:box(e)})).filter(e=>e.box.width&&e.box.height),overlaps=[];
 for(let i=0;i<peers.length;i++)for(let j=i+1;j<peers.length;j++){const x=peers[i].box,y=peers[j].box;if(Math.min(x.right,y.right)-Math.max(x.x,y.x)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.y,y.y)>1)overlaps.push([peers[i].name,peers[j].name]);}
 const outside=nodes.filter(e=>{const r=box(e);return r.width&&r.height&&(r.x<a.x-1||r.right>a.right+1||r.y<a.y-1||r.bottom>a.bottom+1);}).map(e=>e.id||e.className||e.tagName);
 return{aside:a,stage:box(stage),workspace:box(shell),scrollHeight:aside.scrollHeight,clientHeight:aside.clientHeight,outside,overlaps,bodyOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};
});}
try{
 await test('six task buttons and the loading desk remain visible at both TV sizes',async()=>{
  const session=await preparePage(browser,server.url),p=session.page,views=[];try{
   assert.equal(await p.locator('[data-level]').count(),6);
   for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
    await p.setViewportSize(viewport);await delay(150);await p.locator('[data-level="5"]').click();await p.waitForFunction(()=>PureTVQA.snapshot().model.level===5);
    const layout=await bounds(p);assert.ok(layout.aside.right<=layout.stage.x+1,'operator strip is on the left');assert.equal(layout.scrollHeight,layout.clientHeight);assert.deepEqual(layout.outside,[]);assert.deepEqual(layout.overlaps,[]);assert.equal(layout.bodyOverflow,false);
    const controls=await p.locator('#difficulty-controls').boundingBox(),scene=await p.locator('#scene').boundingBox(),dialog=await p.locator('.dialog').boundingBox();assert.ok(dialog.y>=scene.y-1&&dialog.y+dialog.height<=scene.y+scene.height+1,'entire menu stays inside canvas');assert.ok(controls.y>=scene.y&&controls.y+controls.height<=scene.y+scene.height,'six task menu stays inside canvas');
    await p.screenshot({path:path.join(output,`menu-${viewport.width}.png`)});views.push({viewport,layout});
   }
   await start(session,5);for(const viewport of [{width:960,height:540},{width:1280,height:720}]){await p.setViewportSize(viewport);await delay(150);const layout=await bounds(p);assert.equal(layout.scrollHeight,layout.clientHeight);assert.deepEqual(layout.outside,[]);assert.deepEqual(layout.overlaps,[]);assert.equal(layout.bodyOverflow,false);await inspectFrame(p,path.join(output,`desk-${viewport.width}.png`));}
   verifyErrors(session);return views;
  }finally{await session.context.close();}
 });
 if(!args.preview){
 for(let level=0;level<6;level++)await test(`task ${level+1}: all cargo loaded and every required extraction clears`,async()=>{
  const session=await preparePage(browser,server.url);try{await start(session,level);const q=await drive(session);assert.equal(q.phase,'won');assert.equal(q.model.geometry.canShip,true);assert.equal(q.model.failures,0);assert.equal(q.model.geometry.placedCount,q.model.pieceIds.length);assert.ok(q.model.geometry.extractions.every(e=>e.canExit));return{level,placements:q.model.placements,terminalReceipt:q.model.terminalReceipt};}finally{await session.context.close();}
 });
 await test('holding A cannot place the selected piece; pause keeps the current preview',async()=>{
  const session=await preparePage(browser,server.url),p=session.page;try{await start(session,0);await p.keyboard.down('Space');await p.waitForFunction(()=>PureTVQA.snapshot().model.mode==='place');await delay(180);let q=await snapshot(p);assert.equal(q.model.pickups,1);assert.equal(q.model.placementsMade,0);await p.keyboard.up('Space');await neutral(p);await p.keyboard.press('p');await p.waitForFunction(()=>PureTVQA.snapshot().paused);const frozen=(await snapshot(p)).model;await delay(180);assert.deepEqual((await snapshot(p)).model,frozen);await p.keyboard.press('p');await p.waitForFunction(()=>!PureTVQA.snapshot().paused);await neutral(p);verifyErrors(session);return{pickups:1,placementsMade:0,pauseRetainsPreview:true};}finally{await releaseAll(p,['Space','p']);await session.context.close();}
 });
 await test('four natural empty-box inspections lose without inventing a packing',async()=>{
  const session=await preparePage(browser,server.url);try{await start(session,5);const q=await drive(session,'reject');assert.equal(q.phase,'lost');assert.equal(q.model.failures,4);assert.equal(q.model.geometry.placedCount,0);return{terminalReceipt:q.model.terminalReceipt};}finally{await session.context.close();}
 });
 }
 assert.deepEqual(await sourceHashes(assets),hashes);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;console.error(error.stack);}
finally{await browser.close();await server.close();report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
