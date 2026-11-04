import {planVisibleState} from './automation.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,sourceHashes,serveAssets,launch,preparePage,snapshot,tap,applyKeys,releaseAll,verifyErrors,delay,inspectFrame} from '../../../game-kit/qa/common.mjs';
const args=parseArgs();assert.ok(args.assets&&args.output);
const assets=path.resolve(args.assets),output=path.resolve(args.output);await mkdir(output,{recursive:true});
const hashes=await sourceHashes(assets),server=await serveAssets(assets),browser=await launch();
const report={kind:'six-level-optics-browser-review',sourceAssetHashes:hashes,physicalTvTested:false,physicalPhoneTested:false,tests:[]};
async function test(name,fn){try{const detail=await fn();report.tests.push({name,passed:true,...detail});console.log('PASS '+name);}catch(error){report.tests.push({name,passed:false,error:error.stack});throw error;}}
async function panel(page){
 await page.waitForFunction(()=>{const a=document.querySelector('#arena').getBoundingClientRect(),s=document.querySelector('#scene').getBoundingClientRect();return s.width<=a.width&&s.height<=a.height;},null,{timeout:10000});
 const r=await page.evaluate(()=>{const aside=document.querySelector('aside'),b=aside.getBoundingClientRect(),rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom});const text=[...aside.querySelectorAll('#tip,#room-address,.control p,.small-help')].map(el=>{const range=document.createRange();range.selectNodeContents(el);return{text:el.textContent,boxes:[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(rect)};});return {bounds:rect(b),width:aside.clientWidth,height:aside.clientHeight,scrollWidth:aside.scrollWidth,scrollHeight:aside.scrollHeight,text};});
 assert.ok(r.scrollWidth<=r.width+1&&r.scrollHeight<=r.height+1,'Instructions require no scrolling');
 for(const entry of r.text){assert.ok(entry.text.trim()&&entry.boxes.length,'Every instruction is visible');for(const b of entry.boxes)assert.ok(b.left>=r.bounds.left-1&&b.top>=r.bounds.top-1&&b.right<=r.bounds.right+1&&b.bottom<=r.bounds.bottom+1,'Clipped instruction: '+entry.text);}
 for(let i=0;i<r.text.length;i++)for(let j=i+1;j<r.text.length;j++)for(const a of r.text[i].boxes)for(const b of r.text[j].boxes)assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=1,'Overlapping instruction text: '+r.text[i].text+' / '+r.text[j].text);
 const apron=await page.evaluate(()=>{const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom});const arena=document.querySelector('#arena').getBoundingClientRect(),scene=document.querySelector('#scene').getBoundingClientRect();return{arena:rect(arena),scene:rect(scene),panels:[...document.querySelectorAll('.workshop-choices,.workshop-notes')].map(el=>{const range=document.createRange();range.selectNodeContents(el);return{bounds:rect(el.getBoundingClientRect()),width:el.clientWidth,height:el.clientHeight,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight,text:[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(rect)};})};});
 assert.equal(apron.panels.length,2,'Both workshop side aprons exist');
 for(const p of apron.panels){assert.ok(p.scrollWidth<=p.width+1&&p.scrollHeight<=p.height+1,'Workshop apron needs no scrolling');assert.ok(p.bounds.left>=apron.arena.left&&p.bounds.right<=apron.arena.right&&p.bounds.top>=apron.arena.top&&p.bounds.bottom<=apron.arena.bottom,'Workshop apron fits arena');assert.ok(p.bounds.right<=apron.scene.left||p.bounds.left>=apron.scene.right,'Workshop apron never covers glass: '+JSON.stringify({panel:p.bounds,scene:apron.scene}));for(const b of p.text)assert.ok(b.left>=p.bounds.left-1&&b.right<=p.bounds.right+1&&b.top>=p.bounds.top-1&&b.bottom<=p.bounds.bottom+1,'Workshop text is not clipped');}
 return {...r,apron};
}
async function menu(page){assert.equal(await page.locator('[data-level]').count(),6);const boxes=await page.locator('.dialog').evaluate(el=>{const box=el.getBoundingClientRect(),scene=document.querySelector('#scene').getBoundingClientRect();return{top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:innerHeight,width:innerWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};});assert.ok(boxes.top>=0&&boxes.bottom<=boxes.height&&boxes.left>=0&&boxes.right<=boxes.width,'Menu fits the TV viewport');assert.ok(boxes.scrollHeight<=boxes.clientHeight+1,'Six-level menu does not need scrolling');return boxes;}
async function fresh(level){const session=await preparePage(browser,server.url);await menu(session.page);await session.page.locator(`[data-level="${level}"]`).click();await tap(session.page,'Enter');await session.page.waitForFunction(()=>PureTVQA.snapshot().phase==='playing'&&!PureTVQA.snapshot().paused);await delay(100);return session;}
async function pictures(session,label){const results=[];for(const width of [960,1280]){await session.page.setViewportSize({width,height:width*9/16});await delay(120);const p=await panel(session.page);await inspectFrame(session.page,path.join(output,label+'-'+width+'.png'));results.push({width,panel:p});}return results;}

async function solve(session){
 const page=session.page,initial=await snapshot(page),route=planVisibleState(initial.model).folds,trace=[initial];
 for(const id of route){
  let state=await snapshot(page);const target=state.model.candidates.find(c=>c.id===id);
  for(let guard=0;state.model.selectedId!==id&&guard<12;guard++){
   const selected=state.model.candidates[state.model.selectedIndex],key=selected.selectorRow<target.selectorRow?'ArrowDown':selected.selectorRow>target.selectorRow?'ArrowUp':selected.selectorCol<target.selectorCol?'ArrowRight':'ArrowLeft';
   await tap(page,key,100);await delay(60);state=await snapshot(page);
  }
  assert.equal(state.model.selectedId,id);const count=state.model.foldCount;
  await tap(page,'Space',100);await page.waitForFunction(count=>PureTVQA.snapshot().model.foldCount===count+1,count);
  await page.waitForFunction(()=>PureTVQA.snapshot().model.mode!=='folding');trace.push(await snapshot(page));
 }
 const final=await snapshot(page);assert.equal(final.phase,'won');assert.equal(final.model.targetMatched,true);assert.equal(final.model.materialArea,initial.model.pieces.length);return {trace,route,final};
}

try{
 await test('menu and individual instructions fit both TV resolutions without overlap',async()=>{
  const session=await preparePage(browser,server.url);try{const layouts=[];for(const width of [960,1280]){await session.page.setViewportSize({width,height:width*9/16});await delay(120);layouts.push({width,menu:await menu(session.page),panel:await panel(session.page)});await session.page.screenshot({path:path.join(output,'menu-'+width+'.png')});}verifyErrors(session);return{layouts};}finally{await session.context.close();}
 });
 if(args['preview-only']){
  const session=await fresh(5);try{await test('final level gameplay layout',async()=>({layouts:await pictures(session,'final-level-preview')}));verifyErrors(session);}finally{await session.context.close();}
 }else{
  for(let level=0;level<6;level++)await test('level '+(level+1)+' reaches its target through ordinary keys',async()=>{
   const session=await fresh(level);try{const layouts=await pictures(session,'level-'+(level+1)+'-playing');const result=await solve(session);await session.page.screenshot({path:path.join(output,'level-'+(level+1)+'-won.png')});await writeFile(path.join(output,'level-'+(level+1)+'-trace.json'),JSON.stringify(result,null,2)+'\n');verifyErrors(session);return{level:level+1,elapsed:result.final.model.elapsed,phase:result.final.phase,layouts};}finally{await session.context.close();}
  });
  await test('pause freezes a new level and retry restores its initial puzzle',async()=>{
   const session=await fresh(5);try{const page=session.page;await tap(page,'p');await page.waitForFunction(()=>PureTVQA.snapshot().paused);const before=(await snapshot(page)).model;await delay(220);assert.deepEqual((await snapshot(page)).model,before);await tap(page,'p');await page.waitForFunction(()=>!PureTVQA.snapshot().paused);await tap(page,'r');await delay(80);const after=await snapshot(page);assert.equal(after.model.level,6);assert.equal(after.phase,'playing');assert.ok(after.model.elapsed<.5);verifyErrors(session);return{pauseFrozen:true,retryFresh:true};}finally{await session.context.close();}
  });
 }
 assert.deepEqual(await sourceHashes(assets),hashes,'Assets unchanged during browser tests');report.passed=true;
}catch(error){report.passed=false;throw error;}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await server.close();}
