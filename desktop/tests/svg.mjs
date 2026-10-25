import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {chromium} from 'playwright';

let browser,page;
before(async()=>{
  const source=await readFile(new URL('../src/svg.ts',import.meta.url),'utf8');
  const script=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  page=await browser.newPage();
  await page.evaluate(async script=>{
    const url=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));
    try{window.svgModule=await import(url);}finally{URL.revokeObjectURL(url);}
  },script);
});
after(async()=>{await browser?.close();});

const cctv='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="CCTV"><title>CCTV</title><g transform="translate(-0.24 10.99) scale(0.06071)" fill="currentColor"><path d="M126.57 53.76A58 68 0 1 0 126.57 111.24L98.47 98.14A27 37 0 1 1 98.47 66.86Z"/><path d="M256.13 53.76A58 68 0 1 0 256.13 111.24L228.04 98.14A27 37 0 1 1 228.04 66.86Z"/><path d="M272.13 16H382.13V47H272.13ZM311.63 16H342.63V149H311.63Z"/><path d="M397.13 16L458.13 150.5L519.13 16L487.76 16L458.13 82.09L428.51 16Z"/></g></svg>';
const inspect=value=>page.evaluate(value=>{
  const strict=window.svgModule.svgError(value);
  try{return {strict,result:window.svgModule.prepareSvg(value)};}
  catch(error){return {strict,error:{code:error.code,detail:error.detail}};}
},value);

test('the supplied CCTV icon retains every drawing attribute after removing accessibility metadata',async()=>{
  const {strict,result}=await inspect(cctv);
  assert.equal(strict.code,'attribute');assert.equal(strict.detail,'role');assert.equal(result.normalized,true);
  const comparison=await page.evaluate(({before,after})=>{
    const parse=value=>new DOMParser().parseFromString(value,'image/svg+xml');
    const drawing=doc=>[...doc.querySelectorAll('svg,g,path')].map(node=>({tag:node.localName,attributes:[...node.attributes].filter(a=>a.name!=='role'&&!a.name.startsWith('aria-')).map(a=>[a.name,a.value])}));
    const original=parse(before),normalized=parse(after);
    return {before:drawing(original),after:drawing(normalized),title:normalized.querySelectorAll('title,desc').length,metadata:normalized.querySelectorAll('[role],[aria-label]').length,error:window.svgModule.svgError(after)};
  },{before:cctv,after:result.svg});
  assert.deepEqual(comparison.after,comparison.before);assert.equal(comparison.title,0);assert.equal(comparison.metadata,0);assert.equal(comparison.error,null);
  assert.deepEqual((await inspect(result.svg)).result,{svg:result.svg,normalized:false});
});

test('valid protocol SVG stays byte-for-byte unchanged, including widths and drawing colors',async()=>{
  const svg='\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em">\n <path fill="#ffcc00" opacity="0.8" d="M0 0L24 24"/>\n</svg>\n';
  assert.deepEqual(await inspect(svg),{strict:null,result:{svg,normalized:false}});
});

test('only plain text descriptions and accessibility attributes are normalized',async()=>{
  const svg='<svg xmlns="http://www.w3.org/2000/svg"><title><![CDATA[A & B]]></title><desc>One icon</desc><g role="presentation" aria-hidden="true"><circle cx="5" cy="5" r="3" fill="currentColor"/></g></svg>';
  const {result}=await inspect(svg);assert.equal(result.normalized,true);
  assert.doesNotMatch(result.svg,/title|desc|role=|aria-/);
  assert.match(result.svg,/<circle cx="5" cy="5" r="3" fill="currentColor"/);
});

test('normalization never silently drops script, visual features, foreign namespaces or external resources',async()=>{
  const cases=[
    ['<svg><script>alert(1)</script></svg>','element'],
    ['<svg onload="alert(1)"/>','attribute'],
    ['<svg><title onload="alert(1)">name</title></svg>','attribute'],
    ['<svg><title><path d="M0 0L1 1"/></title></svg>','metadata'],
    ['<svg><desc><script>alert(1)</script></desc></svg>','metadata'],
    ['<svg xmlns="http://www.w3.org/2000/svg"><g xmlns="http://example.org" role="img"/></svg>','namespace'],
    ['<svg><path fill="url(#paint)"/></svg>','resource'],
    ['<svg><path fill="url"/></svg>','resource'],
    ['<svg><path fill="http:example"/></svg>','resource'],
    ['<svg><image href="https://example.org/a.png"/></svg>','element'],
    ['<svg><defs><linearGradient/></defs></svg>','element'],
    ['<svg><use href="#shape"/></svg>','element'],
    ['<svg><g style="fill:red"/></svg>','attribute'],
    ['<svg class="icon"/>','attribute'],
    ['<svg xmlns:xlink="http://www.w3.org/1999/xlink"/>','namespace'],
  ];
  for(const [svg,code] of cases){const result=await inspect(svg);assert.equal(result.error?.code,code,svg);assert.equal(result.result,undefined,svg);}
});

test('malformed documents, DTDs and non-SVG roots give specific errors',async()=>{
  for(const [svg,code] of [[null,'type'],['<svg>','document'],['<!DOCTYPE svg><svg/>','document'],['<!DOCTYPE svg [<!ENTITY x "name">]><svg>&x;</svg>','document'],['<path/>','root']]){
    const result=await inspect(svg);assert.equal(result.error?.code,code);assert.equal(result.strict?.code,code);
  }
});

test('the 8 KiB limit counts UTF-8 bytes and applies before metadata removal',async()=>{
  const prefix='<svg><!--',suffix='--></svg>';
  const limit=prefix+'x'.repeat(8192-prefix.length-suffix.length)+suffix;
  assert.equal((await inspect(limit)).strict,null);
  assert.equal((await inspect(limit+' ')).error.code,'size');
  const unicode='<svg role="img"><title>'+'中'.repeat(2800)+'</title></svg>';
  assert.ok(unicode.length<8192);assert.equal((await inspect(unicode)).error.code,'size');
});
