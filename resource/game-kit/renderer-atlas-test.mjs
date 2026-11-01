// Renderer regression: real Chromium WebGL/Canvas, no APK/signing dependencies.
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) {
  assert.ok(['--baseline', '--output', '--chromium'].includes(args[i]) && args[i + 1], 'Expected --baseline FILE, --output DIR or --chromium FILE');
  options[args[i].slice(2)] = resolve(args[i + 1]);
}
const kit = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../desktop/package.json', import.meta.url));
const {chromium} = require('playwright');
const current = await readFile(join(kit, 'web/renderer.js'), 'utf8');
const baseline = options.baseline ? await readFile(options.baseline, 'utf8') : null;
const output = options.output || join(tmpdir(), 'puretv-atlas-regression');
await mkdir(output, {recursive: true});
const browser = await chromium.launch({executablePath: options.chromium || process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const errors = [], checks = [], report = {browser: 'Chromium / SwiftShader WebGL', physicalTVTested: false, checks};
const sha = data => createHash('sha256').update(data).digest('hex');
const png = data => Buffer.from(data.split(',')[1], 'base64');
async function pageFor(source = current) {
  const page = await browser.newPage({viewport: {width: 960, height: 540}, deviceScaleFactor: 1});
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<!doctype html><style>html,body{margin:0;background:#000}canvas{display:block}</style><canvas id="game"></canvas>');
  await page.addScriptTag({content: source});
  return page;
}
const expectedRegions = {
  orb: [0,0,224,224], ship: [224,0,224,224], crate: [448,0,192,192], station: [640,0,256,256],
  glow: [0,256,192,192], ring: [192,256,192,192], shadow: [384,256,192,128], spark: [576,256,128,128],
  disc: [704,256,128,128], white: [848,272,16,16], mirror: [0,800,192,192], prism: [192,800,192,192],
  locomotive: [384,800,224,128], freight: [608,800,192,128]
};
async function legacyAtlas(source) {
  const page = await pageFor(source);
  try {
    return await page.evaluate(() => {
      const r = new PureRenderer(document.querySelector('canvas'));
      const result = {regions: Object.fromEntries(Object.entries(r.atlas.regions).map(([k,v]) => [k,[v.x,v.y,v.w,v.h]])),
        glyphs: r.atlas.glyphs, image: r.atlas.canvas.toDataURL(), size: [r.atlas.canvas.width,r.atlas.canvas.height]};
      r.begin('#081321'); r.sprite('does_not_exist', 120, 120, 100, 100, 0, '#fff'); r.end();
      const fallback = r.canvas.toDataURL();
      r.begin('#081321'); r.sprite('orb', 120, 120, 100, 100, 0, '#fff'); r.end();
      result.legacyFallback = fallback === r.canvas.toDataURL(); r.dispose(); return result;
    });
  } finally { await page.close(); }
}
try {
  const oldDefault = await legacyAtlas(current);
  assert.deepEqual(oldDefault.regions, expectedRegions); assert.deepEqual(oldDefault.size, [1024,1024]);
  assert.equal(Object.keys(oldDefault.glyphs).length, 95); assert.equal(oldDefault.legacyFallback, true);
  for (let i = 0; i < 95; i++) {
    const g = oldDefault.glyphs[String.fromCharCode(i + 32)];
    assert.deepEqual([g.x,g.y,g.w,g.h], [(i % 20) * 48,448 + Math.floor(i / 20) * 64,48,64]);
  }
  report.legacyAtlasSha256 = sha(png(oldDefault.image));
  await writeFile(join(output, 'legacy-atlas.png'), png(oldDefault.image));
  checks.push('All 14 legacy UV rectangles, 95 ASCII cells and missing-name orb fallback');
  if (baseline) {
    const previous = await legacyAtlas(baseline);
    assert.deepEqual(oldDefault, previous, 'Default atlas pixels, glyph metrics and UVs must match the supplied baseline');
    checks.push('Default atlas PNG and glyph metrics exactly match baseline');
  }

  const validationPage = await pageFor();
  const validation = await validationPage.evaluate(() => {
    let paints = 0; const outcomes = [];
    const paint = () => { paints++; };
    const tile = (extra = {}) => Object.assign({name:'custom',x:0,y:0,w:16,h:16,paint}, extra);
    const invalid = (label, config) => {
      let message = ''; paints = 0;
      try { const r = new PureRenderer(document.createElement('canvas'), {atlas: config}); r.dispose(); }
      catch (error) { message = error.message; }
      outcomes.push({label,message,paints});
    };
    for (const value of [true,1,'bad',[]]) invalid('configuration type ' + typeof value, value);
    invalid('builtins must be array', {builtins:{}}); invalid('tiles must be array', {tiles:{}});
    invalid('unknown builtin', {builtins:['none']}); invalid('builtin duplicate', {builtins:['glow','glow']});
    invalid('automatic core duplicate', {builtins:['white']});
    invalid('tile count', {tiles:Array.from({length:127},(_,i) => tile({name:'n'+i}))});
    invalid('null tile', {tiles:[null]}); invalid('array tile', {tiles:[[]]});
    for (const name of ['', '1bad', '__proto__', 'constructor', 'prototype', 'x'.repeat(65)]) invalid('name ' + name, {tiles:[tile({name})]});
    for (const [key,value] of [['x',-.1],['x',-1],['x',NaN],['y',Infinity],['w',0],['h',-1],['w',1.5],['h','16'],['x',1024],['y',1024],['w',1025],['h',1025]])
      invalid('invalid dimension ' + key + ':' + value, {tiles:[tile({[key]:value})]});
    invalid('missing painter', {tiles:[tile({paint:null})]});
    invalid('duplicate custom name', {tiles:[tile(),tile({x:16})]});
    invalid('overlap custom', {tiles:[tile(),tile({name:'other',x:15})]});
    invalid('duplicate core name', {tiles:[tile({name:'disc'})]});
    invalid('overlap core disc', {tiles:[tile({x:704,y:256})]});
    invalid('overlap core white', {tiles:[tile({x:848,y:272})]});
    invalid('overlap selected builtin', {builtins:['glow'],tiles:[tile({y:256})]});
    invalid('first glyph cell', {tiles:[tile({y:448})]});
    invalid('last glyph cell', {tiles:[tile({x:719,y:767,w:2,h:2})]});
    invalid('invalid after valid painter', {tiles:[tile(),tile({name:'later',x:64,w:0})]});
    let optionError=''; try { new PureRenderer(document.createElement('canvas'), []); } catch(e) { optionError=e.message; }
    return {outcomes,optionError};
  });
  for (const result of validation.outcomes) {
    assert.match(result.message, /^PureRenderer atlas:/, result.label); assert.equal(result.paints, 0, result.label + ' paints before validation');
  }
  assert.match(validation.optionError, /options/); report.invalidConfigurations = validation.outcomes.length;
  checks.push(`${validation.outcomes.length} invalid configurations fail before any painter`);
  await validationPage.close();

  const configPage = await pageFor();
  const isolation = await configPage.evaluate(() => {
    const makeCanvas = () => { const c=document.createElement('canvas');document.body.append(c);return c; };
    let paintsA=0,paintsB=0,helperKeys=[];
    const a=new PureRenderer(makeCanvas(),{atlas:{tiles:[{name:'local',x:0,y:0,w:32,h:32,paint(c,w,h,art){paintsA++;helperKeys=Object.keys(art).sort();c.fillStyle='#f00';c.fillRect(-200,-200,400,400);}}]}});
    const b=new PureRenderer(makeCanvas(),{atlas:{builtins:['glow'],tiles:[{name:'local',x:64,y:0,w:32,h:32,paint(c,w,h,art){paintsB++;art.path(c,[[0,0],[w,0],[w,h],[0,h]],art.linear(c,0,0,w,h,[[0,'#00f'],[1,'#00f']]));art.ellipse(c,16,16,4,4,art.radial(c,16,16,4,[[0,'#00f'],[1,'#00f']]));}}]}});
    const render = r => {r.begin('#000');r.sprite('local',100,100,64,64,0,'#fff');r.text('A',150,100,20,'#fff');r.end();return r.canvas.toDataURL();};
    const firstA=render(a),firstB=render(b),secondA=render(a);
    let missing='';try {a.sprite('glow',0,0,1,1,0,'#fff');}catch(e){missing=e.message;}
    const pixel = (r,x,y) => Array.from(r.atlas.canvas.getContext('2d').getImageData(x,y,1,1).data);
    const result={isolated:a.atlas!==b.atlas&&a.atlas.canvas!==b.atlas.canvas,regionsA:Object.keys(a.atlas.regions).sort(),regionsB:Object.keys(b.atlas.regions).sort(),
      pixelA:pixel(a,10,10),pixelB:pixel(b,74,10),outsideA:pixel(a,33,10),missing,firstA,firstB,secondA,paintsA,paintsB,helperKeys};
    a.dispose();b.dispose();
    // Descriptors are frozen by value before callbacks; later callbacks cannot be redirected.
    let second=0,substituted=0;
    const config={tiles:[{name:'first',x:0,y:0,w:16,h:16,paint(){config.tiles[1].x=900;config.tiles[1].paint=()=>substituted++;}},
      {name:'second',x:16,y:0,w:16,h:16,paint(){second++;}}]};
    const snap=new PureRenderer(makeCanvas(),{atlas:config});
    result.descriptors={x:snap.atlas.regions.second.x,second,substituted};snap.dispose();
    const free=new PureRenderer(makeCanvas(),{atlas:{tiles:[{name:'A',x:720,y:704,w:240,h:64,paint(){}}]}});
    result.unusedGlyphCells=!!free.atlas.regions.A;free.dispose();
    const empty=new PureRenderer(makeCanvas(),{atlas:{}});result.empty=Object.keys(empty.atlas.regions).sort();empty.dispose();
    return result;
  });
  assert.equal(isolation.isolated,true);assert.deepEqual(isolation.regionsA,['disc','local','white']);
  assert.deepEqual(isolation.regionsB,['disc','glow','local','white']);assert.deepEqual(isolation.empty,['disc','white']);
  assert.deepEqual(isolation.pixelA,[255,0,0,255]);assert.deepEqual(isolation.pixelB,[0,0,255,255]);assert.deepEqual(isolation.outsideA,[0,0,0,0]);
  assert.equal(isolation.firstA,isolation.secondA);assert.notEqual(isolation.firstA,isolation.firstB);
  assert.equal(isolation.paintsA,1);assert.equal(isolation.paintsB,1);assert.match(isolation.missing,/missing configured sprite glow/);
  assert.deepEqual(isolation.helperKeys,['ellipse','linear','path','radial']);assert.deepEqual(isolation.descriptors,{x:16,second:1,substituted:0});assert.equal(isolation.unusedGlyphCells,true);
  await writeFile(join(output,'configured-red.png'),png(isolation.firstA));await writeFile(join(output,'configured-blue.png'),png(isolation.firstB));
  checks.push('Independent per-instance regions/pixels, helpers, clipping, missing-name error and descriptor snapshot');
  checks.push('Empty config retains core; touching tiles and unused glyph cells are usable');
  await configPage.close();

  const gpuPage = await pageFor();
  const gpu = await gpuPage.evaluate(() => {
    window.painterCalls=0;
    const r=window.testRenderer=new PureRenderer(document.querySelector('canvas'),{atlas:{tiles:[{name:'test',x:0,y:0,w:32,h:32,paint(c){window.painterCalls++;c.fillStyle='#67b8de';c.fillRect(0,0,32,32);}}]}});
    if(!r.gl)throw Error('WebGL is required for the GPU regression');
    window.actualCalls=0;window.restoredUploads=0;
    const draw=r.gl.drawElements.bind(r.gl),upload=r.gl.texImage2D.bind(r.gl);
    r.gl.drawElements=function(...args){window.actualCalls++;return draw(...args);};
    r.gl.texImage2D=function(...args){if(args.at(-1)!==r.atlas.canvas)throw Error('Restore uploaded another atlas');window.restoredUploads++;return upload(...args);};
    const batches=[];
    for(const n of [1,8192,8193]){window.actualCalls=0;r.begin('#071321');for(let i=0;i<n;i++)r.sprite('test',120,120,32,32,0,'#fff');r.end();batches.push({n,actual:window.actualCalls,metrics:{...r.metrics}});}
    window.renderSample=()=>{window.actualCalls=0;r.begin('#071321');r.sprite('test',120,120,64,64,.1,'#fff');r.text('RESTORE',180,120,20,'#fff');r.end();return r.canvas.toDataURL();};
    window.beforeRestore=window.renderSample();window.beforeAtlas=r.atlas.canvas.toDataURL();
    window.lossExtension=r.gl.getExtension('WEBGL_lose_context');if(!window.lossExtension)throw Error('WEBGL_lose_context unavailable');
    const debug=r.gl.getExtension('WEBGL_debug_renderer_info');
    return {batches,renderer:debug?r.gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):r.gl.getParameter(r.gl.RENDERER)};
  });
  for(const batch of gpu.batches){assert.equal(batch.actual,batch.n<=8192?1:2);assert.equal(batch.metrics.drawCalls,batch.actual);assert.equal(batch.metrics.quads,batch.n);assert.equal(batch.metrics.textureCount,1);assert.equal(batch.metrics.atlasSize,1024);}
  await gpuPage.evaluate(()=>window.lossExtension.loseContext());
  await gpuPage.waitForFunction(()=>window.testRenderer.contextLost);
  assert.equal(await gpuPage.evaluate(()=>window.testRenderer.begin('#000')),false);
  await gpuPage.evaluate(()=>window.lossExtension.restoreContext());
  await gpuPage.waitForFunction(()=>!window.testRenderer.contextLost,{},{timeout:10000});
  const restored=await gpuPage.evaluate(()=>({identical:window.beforeRestore===window.renderSample(),sameAtlas:window.beforeAtlas===window.testRenderer.atlas.canvas.toDataURL(),
    paints:window.painterCalls,uploads:window.restoredUploads,actual:window.actualCalls,metrics:{...window.testRenderer.metrics}}));
  assert.equal(restored.identical,true);assert.equal(restored.sameAtlas,true);assert.equal(restored.paints,1);assert.equal(restored.uploads,1);assert.equal(restored.actual,1);assert.equal(restored.metrics.contextLost,false);
  report.gpu={...gpu,restored};checks.push('Actual GPU drawElements: 1 call for 1/8192 quads, 2 calls for 8193');
  checks.push('Real WEBGL_lose_context restore reuploads configured atlas once without repaint, identical frame');
  await gpuPage.evaluate(()=>window.testRenderer.dispose());await gpuPage.close();

  const fallbackPage=await pageFor();
  const fallback=await fallbackPage.evaluate(()=>{
    const canvas=document.querySelector('canvas'),get=canvas.getContext.bind(canvas);
    canvas.getContext=(kind,...args)=>kind==='webgl'||kind==='experimental-webgl'?null:get(kind,...args);
    const r=new PureRenderer(canvas,{atlas:{tiles:[{name:'local',x:64,y:0,w:32,h:32,paint(c){c.fillStyle='#1a86db';c.fillRect(0,0,32,32);}}]}});
    r.begin('#000');r.sprite('local',100,100,32,32,0,'#fff');r.rect(150,100,20,20,'#f00');r.circle(200,100,10,'#0f0');r.text('CANVAS',250,100,20,'#fff');r.end();
    const result={metrics:{...r.metrics},region:r.atlas.regions.local,pixel:Array.from(r.ctx.getImageData(100,100,1,1).data),image:canvas.toDataURL()};r.dispose();return result;
  });
  assert.equal(fallback.metrics.kind,'canvas2d');assert.equal(fallback.metrics.textureCount,0);assert.equal(fallback.metrics.drawCalls,0);assert.deepEqual(fallback.pixel,[26,134,219,255]);assert.deepEqual(fallback.region,{x:64,y:0,w:32,h:32});
  await writeFile(join(output,'canvas-fallback.png'),png(fallback.image));report.canvasFallback=fallback.metrics;
  checks.push('Canvas 2D fallback uses custom UV/pixels and core graphics, reports no GPU calls');await fallbackPage.close();

  report.games=[];
  for(const slug of ['gravity-courier','prism-relay','switchyard-minute']){
    const sources=await Promise.all(['game-model.js','game.js'].map(name=>readFile(join(kit,'../apps',slug,'src/main/assets',name),'utf8')));
    async function snapshots(source){
      const page=await pageFor(source);try{
        for(const content of sources)await page.addScriptTag({content});
        return await page.evaluate(()=>{
          const r=new PureRenderer(document.querySelector('canvas'),{atlas:GameDef.atlas}),frames=[];
          for(let level=0;level<3;level++){
            const state=PureModel.create(GameDef.seed||1,level),input={x:0,y:0,a:false,b:false,aPressed:false,bPressed:false};
            for(let i=0;i<60;i++)PureModel.step(state,1/60,input);
            r.begin(GameDef.background);GameDef.render(r,state,1,input);r.end();frames.push({level,image:r.canvas.toDataURL(),metrics:{...r.metrics}});
          }
          r.dispose();return frames;
        });
      }finally{await page.close();}
    }
    const frames=await snapshots(current),old=baseline?await snapshots(baseline):null;
    if(old)assert.deepEqual(frames,old,slug+' rendered frames differ from baseline');
    for(const frame of frames){assert.equal(frame.metrics.drawCalls,1);await writeFile(join(output,`${slug}-${frame.level+1}.png`),png(frame.image));}
    report.games.push({slug,frames:frames.map(f=>({level:f.level+1,sha256:sha(png(f.image)),quads:f.metrics.quads,drawCalls:f.metrics.drawCalls})),baselineExact:!!old});
  }
  checks.push('Three legacy games × three levels render successfully with one draw per frame'+(baseline?', exact baseline frame PNGs':' (baseline comparison not requested)'));
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.passed=checks.length;report.baselineProvided=!!baseline;
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
