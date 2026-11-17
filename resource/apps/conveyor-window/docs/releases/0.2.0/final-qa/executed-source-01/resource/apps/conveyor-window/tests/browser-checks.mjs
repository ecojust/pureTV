// Real browser input and layout checks for the six authored 0.2.0 production scenarios.
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {parseArgs,serveAssets,launch,preparePage,tap,snapshot,verifyErrors,sourceHashes} from '../../../game-kit/qa/common.mjs';
const args=parseArgs(),assets=path.resolve(args.assets),output=path.resolve(args.output);
await mkdir(output,{recursive:true});
const server=await serveAssets(assets),browser=await launch();
const report={schema:1,assets:await sourceHashes(assets),checks:[],physicalTvTested:false,physicalPhoneTested:false,passed:false};
try{
 for(const viewport of [{width:960,height:540},{width:1280,height:720}]){
  const session=await preparePage(browser,server.url,{viewport}),{page}=session;
  try{
   await page.waitForFunction(()=>!!document.querySelector('link[href="game-theme.css"]')?.sheet);
   assert.equal(await page.locator('[data-level]').count(),6);
   for(let level=0;level<6;level++){await page.locator(`[data-level="${level}"]`).click();await page.waitForFunction(level=>window.PureTVQA.snapshot().model.level===level+1,level);}
   const menu=await page.locator('.dialog').boundingBox();assert.ok(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=viewport.width+1&&menu.y+menu.height<=viewport.height+1,JSON.stringify({viewport,menu}));
   const bounds=await page.evaluate(()=>{
    const aside=document.querySelector('aside'),b=aside.getBoundingClientRect();
    return{clientHeight:aside.clientHeight,scrollHeight:aside.scrollHeight,aside:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},texts:['h3','#room-address','#move-help','#a-help','#b-help','.small-help','#tip'].map(selector=>{const el=aside.querySelector(selector),r=document.createRange();r.selectNodeContents(el);const t=r.getBoundingClientRect();return{selector,visible:getComputedStyle(el).display!=='none'&&t.width>0&&t.height>0,x:t.x,y:t.y,right:t.right,bottom:t.bottom};})};
   });
   assert.equal(bounds.scrollHeight,bounds.clientHeight,'Instructions must not scroll: '+JSON.stringify(bounds));
   for(const t of bounds.texts){assert.ok(t.visible,'Hidden instruction '+t.selector);assert.ok(t.x>=bounds.aside.x-1&&t.y>=bounds.aside.y-1&&t.right<=bounds.aside.right+1&&t.bottom<=bounds.aside.bottom+1,'Instruction outside rail: '+JSON.stringify(t));}
   for(let i=0;i<bounds.texts.length;i++)for(let j=i+1;j<bounds.texts.length;j++){const a=bounds.texts[i],b=bounds.texts[j];assert.ok(Math.min(a.right,b.right)-Math.max(a.x,b.x)<1||Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)<1,'Overlapping instructions: '+a.selector+' / '+b.selector);}
   await page.screenshot({path:path.join(output,`menu-${viewport.width}.png`)});
   await tap(page,'Enter');await page.waitForFunction(()=>window.PureTVQA.snapshot().phase==='playing');
   const initial=await snapshot(page);assert.equal(initial.model.level,6);
   await tap(page,'ArrowRight');await tap(page,'Space');
   await page.waitForFunction(tick=>window.PureTVQA.snapshot().tick>tick,initial.tick,{timeout:15000});
   const progressed=await snapshot(page);assert.ok(progressed.tick>initial.tick);
   await page.screenshot({path:path.join(output,`playing-${viewport.width}.png`)});
   await tap(page,'p');const paused=await snapshot(page);assert.equal(paused.paused,true);await tap(page,'p');
   await tap(page,'r');assert.equal((await snapshot(page)).model.level,6);
   verifyErrors(session);report.checks.push({viewport,bounds,menu,sixLevelsSelectable:true,ordinaryInputs:true,passed:true});
  }catch(error){report.browserErrors={errors:session.errors,consoleErrors:session.consoleErrors,network:session.network};await page.screenshot({path:path.join(output,`failed-${viewport.width}.png`)});throw error;}
  finally{await session.context.close();}
 }
 report.passed=true;console.log(JSON.stringify({passed:true,viewports:report.checks.length}));
}catch(error){report.error=String(error.stack);throw error;}
finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await server.close();}
