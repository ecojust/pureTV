// Real WebGL 1 rendering and Canvas fallback checks; room data is a local fixture.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const {chromium}=require('playwright');
const assets=new URL('../src/main/assets/',import.meta.url);
const output=process.env.GAME_RENDER_OUTPUT||'/tmp/puretv-coast-kart-rendering';await mkdir(output,{recursive:true});
const qr='data:image/svg+xml;base64,'+(await readFile(new URL('../../tank/tests/fixtures/room-preview.svg',import.meta.url))).toString('base64');
const server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!/^[a-z0-9.-]+\.(html|js|css)$/.test(name)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL(name,assets)));}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:'+server.address().port;
async function pageFor(mode='webgl'){
  const context=await browser.newContext({viewport:{width:1920,height:1080},locale:'en-US'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
  await page.addInitScript(({mode,qr})=>{
    const native=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(mode==='no-webgl'&&/webgl/i.test(type))return null;
      const gl=native.call(this,type,...args);
      if(gl&&/webgl/i.test(type)&&mode==='no-instancing'){
        const extension=gl.getExtension.bind(gl);gl.getExtension=name=>name==='ANGLE_instanced_arrays'?null:extension(name);
      }
      return gl;
    };
    window.__inputs=[1,2].map(id=>({id,connected:true,x:0,y:0,a:false,b:false,start:false,select:false,cancelSeq:0}));
    window.CoastKartHost={getInfo:()=>JSON.stringify({language:'en-US',url:'http://192.168.1.88:38291/?room=visual-preview-token',qr}),snapshot:()=>JSON.stringify({players:window.__inputs}),publish:()=>{}};
  },{mode,qr});
  await page.goto(base+'/tv.html');
  await page.waitForFunction(()=>window.CoastKartTV&&CoastKartTV.game&&CoastKartTV.renderer);
  return {context,page,errors};
}
async function scene(page,track=0,two=false){
  await page.evaluate(({track,two})=>{
    const api=CoastKartTV,g=api.game;g.selectedPlayers=two?2:1;g.beginRace(track);g.countdown=0;g.clock=8;
    g.racers.forEach((p,i)=>{p.s=380+i*85;p.x=i===0?-.13:(i%3-1)*.45;p.speed=170;});
    g.players[0].item='pulse';
    api.suspend(true);g.phase='playing';api.renderer.draw(g);
  },{track,two});
  await page.waitForTimeout(180);
}
try{
  const full=await pageFor();
  const health=await full.page.evaluate(()=>{
    const s=CoastKartTV.renderer.scene3d,gl=s.renderer&&s.renderer.getContext();
    return {active:s.active,failed:s.failed,error:s.error,calls:s.drawCalls,triangles:s.triangles,webgl1:gl instanceof WebGLRenderingContext,webgl2:typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext};
  });
  assert.equal(health.active,true,JSON.stringify(health));assert.equal(health.failed,false);assert.equal(health.webgl1,true);assert.equal(health.webgl2,false);
  await full.page.screenshot({path:resolve(output,'coast-kart-title.png')});
  for(const [index,name] of ['coast','forest','canyon','harbor'].entries()){
    await scene(full.page,index);
    assert.equal(await full.page.locator('#battlefield').getAttribute('data-renderer'),'webgl1',JSON.stringify(await full.page.evaluate(()=>({theme:CoastKartTV.renderer.scene3d.theme,error:CoastKartTV.renderer.scene3d.error,stack:CoastKartTV.renderer.scene3d.errorStack,failed:CoastKartTV.renderer.scene3d.failed,disposed:CoastKartTV.renderer.scene3d.disposed})))+' '+JSON.stringify(full.errors));
    await full.page.screenshot({path:resolve(output,'coast-kart-'+name+'.png')});
  }
  await scene(full.page,0,true);
  await full.page.screenshot({path:resolve(output,'coast-kart-split.png')});
  const stats=await full.page.evaluate(()=>{
    const r=CoastKartTV.renderer,s=r.scene3d,before={g:s.renderer.info.memory.geometries,t:s.renderer.info.memory.textures},times=[];
    for(let i=0;i<12;i++){const start=performance.now();r.draw(CoastKartTV.game);times.push(performance.now()-start);}
    const gl=s.renderer.getContext();return {calls:s.drawCalls,triangles:s.triangles,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times),before,after:{g:s.renderer.info.memory.geometries,t:s.renderer.info.memory.textures},error:gl.getError(),lost:gl.isContextLost(),width:s.canvas.width,height:s.canvas.height};
  });
  assert.deepEqual(stats.before,stats.after,'repeated split frames reuse GPU geometry/textures');
  assert.ok(stats.calls>20&&stats.calls<250,JSON.stringify(stats));assert.ok(stats.triangles>2000&&stats.triangles<200000,JSON.stringify(stats));
  assert.equal(stats.error,0);assert.equal(stats.lost,false);assert.deepEqual(full.errors,[]);
  console.log('PASS real WebGL1, four 3D themes, split screen and bounded reused resources: '+JSON.stringify(stats));
  const clearance=await full.page.evaluate(()=>{
    const api=CoastKartTV,g=api.game,s=api.renderer.scene3d,checks=[];
    // P2 is chased by three adjacent-lane rivals, with another alongside and
    // two ahead. Repeat across the lap seam without changing race mechanics.
    for(const base of [380,10]){
      g.racers.forEach((p,i)=>{
        p.s=(base+[55,0,90,-20,-50,-80,0,240][i]+g.track.length)%g.track.length;
        p.x=[-.6,-.2,.4,.35,.6,.7,.65,-.3][i];
      });
      const before=JSON.stringify(g.racers),visible=()=>g.racers.map(p=>s.karts[(p.id-1)%8].group.visible);
      s.render(g,g.players[0],478,540,1,false);const first=visible();
      s.render(g,g.players[1],478,540,1,false);const second=visible();
      checks.push({base,first,second,unchanged:before===JSON.stringify(g.racers)});
    }
    api.renderer.draw(g);return checks;
  });
  for(const check of clearance){
    assert.equal(check.first[0],true,'P1 stays visible in its own camera');
    assert.equal(check.first[1],false,'the same P2 body is omitted behind P1');
    assert.equal(check.second[1],true,'P2 stays visible in its own camera');
    assert.deepEqual(check.second.slice(3,6),[false,false,false],'rear -20/-50/-80 rivals cannot fill the foreground');
    assert.deepEqual([check.second[0],check.second[2],check.second[6],check.second[7]],[true,true,true,true],'front and side-by-side rivals remain visible');
    assert.equal(check.unchanged,true,'view clearance never changes race state');
  }
  await full.page.screenshot({path:resolve(output,'coast-kart-camera-clearance.png')});
  assert.equal(await full.page.locator('#battlefield').getAttribute('data-renderer'),'webgl1');
  assert.deepEqual(full.errors,[]);
  console.log('PASS per-player chase-camera clearance, rear pack, side-by-side rivals and lap seam');
  await full.page.evaluate(()=>{window.__loss=CoastKartTV.renderer.scene3d.renderer.getContext().getExtension('WEBGL_lose_context');window.__loss.loseContext();});
  await full.page.waitForFunction(()=>document.getElementById('battlefield').dataset.renderer==='canvas2d');
  assert.equal(await full.page.evaluate(()=>CoastKartTV.renderer.scene3d.contextLost),true);
  await full.page.screenshot({path:resolve(output,'coast-kart-context-loss-fallback.png')});
  await full.page.evaluate(()=>window.__loss.restoreContext());
  await full.page.waitForFunction(()=>document.getElementById('battlefield').dataset.renderer==='webgl1').catch(async error=>{
    console.error('Restore state:',await full.page.evaluate(()=>{const s=CoastKartTV.renderer.scene3d;return {lost:s.contextLost,failed:s.failed,disposed:s.disposed,error:s.error,stack:s.errorStack};}),full.errors);throw error;
  });
  assert.equal(await full.page.evaluate(()=>CoastKartTV.renderer.scene3d.contextLost),false);
  assert.equal(await full.page.evaluate(()=>CoastKartTV.renderer.scene3d.active),true);
  assert.deepEqual(full.errors,[],'context restoration compiles and renders without shader errors');
  await full.page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
  assert.equal(await full.page.evaluate(()=>CoastKartTV.renderer.scene3d.disposed),true);
  await full.context.close();
  const fallback=await pageFor('no-webgl');await scene(fallback.page,0,true);
  assert.equal(await fallback.page.locator('#battlefield').getAttribute('data-renderer'),'canvas2d');
  assert.equal(await fallback.page.evaluate(()=>CoastKartTV.renderer.scene3d.failed),true);
  assert.deepEqual(fallback.errors,[]);
  await fallback.page.screenshot({path:resolve(output,'coast-kart-no-webgl-fallback.png')});
  await fallback.context.close();
  const portable=await pageFor('no-instancing');await scene(portable.page,1);
  assert.equal(await portable.page.evaluate(()=>CoastKartTV.renderer.scene3d.supportsInstancing),false);
  assert.equal(await portable.page.locator('#battlefield').getAttribute('data-renderer'),'webgl1');
  assert.deepEqual(portable.errors,[]);await portable.context.close();
  console.log('PASS WebGL context loss/restoration, no-WebGL visible compatibility view, no-instancing 3D path and GPU disposal. Screenshots: '+output);
}finally{await browser.close();await new Promise(done=>server.close(done));}
