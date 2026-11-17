import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {launch} from '/workspace/pureTV/resource/game-kit/qa/common.mjs';
const require=createRequire('/workspace/pureTV/desktop/package.json'),ts=require('typescript');
const source=await readFile('/workspace/pureTV/desktop/src/svg.ts','utf8');
const script=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const svg=await readFile('/workspace/pureTV/resource/apps/prism-relay/logo.svg','utf8');
const browser=await launch();
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({script,svg})=>{
  const url=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));
  try{const mod=await import(url);const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;return{strict:mod.svgError(svg),prepared:mod.prepareSvg(svg),dimensions:['width','height','viewBox'].map(k=>root.getAttribute(k))};}finally{URL.revokeObjectURL(url);}
 },{script,svg});
 assert.equal(result.strict,null);assert.equal(result.prepared.svg,svg);assert.equal(result.prepared.normalized,false);assert.deepEqual(result.dimensions,['64','64','0 0 64 64']);
 await writeFile('/workspace/scratch/game-polish/physics-021/preflight/prism-relay/logo-browser-01.json',JSON.stringify({kind:'single-changed-logo-browser-protocol-check',passed:true,source:'/workspace/pureTV/desktop/src/svg.ts',sourceSha256:createHash('sha256').update(source).digest('hex'),logoSha256:createHash('sha256').update(svg).digest('hex'),bytes:Buffer.byteLength(svg),...result},null,2)+'\n');
 console.log('PASS changed prism-relay/logo.svg: exact static SVG protocol, 64px, <8192 bytes');
}finally{await browser.close();}
