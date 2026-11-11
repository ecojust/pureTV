// Runs after the standard recorder has stopped capturing. Normal page navigation
// and screenshots only; no model writes, hidden overlays, or synthetic bridge.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export default async function ({ page, url }) {
  const output=process.env.NEON_RUSH_POSTCHECK_OUTPUT;
  assert.ok(output,'NEON_RUSH_POSTCHECK_OUTPUT must identify the evidence directory');
  await mkdir(output,{recursive:true});
  const captures=[];
  for(const language of ['en','zh']){
    await page.goto(url+'?lang='+language,{waitUntil:'networkidle'});
    await page.waitForFunction(language=>document.documentElement.lang===(language==='en'?'en':'zh-CN')&&window.PureTVQA?.snapshot().renderer.drawCalls>0,language);
    await page.locator('#version').waitFor();
    await page.setViewportSize({width:1280,height:720});
    const file=path.join(output,'menu-'+language+'-1280.png');
    await page.screenshot({path:file});
    const bytes=await readFile(file);
    captures.push({file:path.basename(file),language,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),state:await page.evaluate(()=>({title:document.querySelector('#title').textContent,phase:PureTVQA.snapshot().phase,renderer:PureTVQA.snapshot().renderer}))});
  }
  return {kind:'actual-local-game-UI-after-recording',syntheticBridge:false,physicalTvTested:false,physicalPhoneTested:false,captures};
}
