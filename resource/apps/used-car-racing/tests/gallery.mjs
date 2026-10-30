// Reproducible captures of the actual local models and renderer, without a native room.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require = createRequire(new URL('../../../../desktop/package.json', import.meta.url));
const {chromium} = require('playwright');
const assets = new URL('../src/main/assets/', import.meta.url);
const output = process.env.USED_CAR_UI_CAPTURE_DIR || '/tmp/puretv-used-car-gallery';
await mkdir(output, {recursive:true});
const html = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#101b22;color:#e7ede6;font-family:Arial,sans-serif}canvas{display:block;width:100vw;height:100vh}#caption{position:absolute;left:32px;bottom:24px;padding:12px 16px;background:#09131bd9;border-left:3px solid #b7ee80;font-size:16px;letter-spacing:1px}#caption small{display:block;color:#b1c2c9;font-size:11px;margin-top:5px}.labels{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);pointer-events:none}.labels span{align-self:end;padding:20px 24px 26px;font-size:19px;text-shadow:0 2px 4px #000}.labels small{display:block;color:#b3c5cd;font-size:12px;letter-spacing:1px;margin-top:6px}</style></head><body><canvas id="scene"></canvas><div id="caption"></div><script src="three.min.js"></script><script src="materials.js"></script><script src="tracks.js"></script><script src="game-model.js"></script><script src="vehicle-models.js"></script><script src="renderer-3d.js"></script></body></html>';
const server = http.createServer(async (req,res) => {
  const name = new URL(req.url,'http://localhost').pathname.slice(1);
  if(!name){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
  if(!/^(?:[a-z0-9.-]+\.js|textures\/[a-z0-9-]+\.(?:jpg|png))$/.test(name)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',name.endsWith('.jpg')?'image/jpeg':name.endsWith('.png')?'image/png':'text/javascript');res.end(await readFile(new URL(name,assets)));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1440,height:810}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|shader/.test(m.text()))errors.push(m.text());});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(async()=>{window.view=new UsedCarRenderer(document.getElementById('scene'),{width:1440,height:810});await view.materialLibrary.ready;});
  assert.deepEqual(await page.evaluate(()=>view.materialLibrary.errors),[]);
  for(const id of ['harbor','ridge','solar']){
    const result=await page.evaluate(id=>{
      const g=UsedCarModel.create({seed:1848753919,trackId:id});g.phase='race';g.raceTime=8;
      // Identical start-section camera position across versions; no promotional scenery added.
      g.racers.forEach((c,i)=>{const s=220+i*16,p=UsedCarTracks.sample(id,s),l=i%2?2.1:-2.1;c.s=s;c.x=p.x+p.nx*l;c.z=p.z+p.nz*l;c.y=p.y;c.yaw=p.heading;c.speed=24;c.wheelSpin=5;});
      view.cameraStates=[];for(let n=0;n<3;n++)view.render(g,1/60);
      const track=UsedCarTracks.get(id);document.getElementById('caption').innerHTML=track.name+' / '+track.enName+' · '+(track.length/1000).toFixed(2)+' km<small>实际 WebGL 场景 · Chromium 渲染 · 非电视实机照片</small>';
      return {active:view.active,failed:view.failed,error:view.error,stats:view.stats};
    },id);
    assert.equal(result.active,true,JSON.stringify(result));assert.equal(result.failed,false,JSON.stringify(result));
    await page.screenshot({timeout:60000,path:output+'/used-car-racing-track-'+id+'.png'});
    console.log('CAPTURE '+id+' '+JSON.stringify(result.stats));
  }
  await page.evaluate(()=>{
    // All six production models, shown in one neutral inspection-light setup.
    const T=THREE;view.dispose();const canvas=document.getElementById('scene');
    const fresh=document.createElement('canvas');fresh.id='lineup';canvas.replaceWith(fresh);
    const gl=fresh.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
    const r=new T.WebGLRenderer({canvas:fresh,context:gl,antialias:true,preserveDrawingBuffer:true});r.setSize(1440,810);r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.02;
    const library=new UsedCarMaterials(T,r);window.lineupReady=library.ready.then(()=>{
      const scene=new T.Scene();scene.background=new T.Color(0x14242e);scene.add(new T.HemisphereLight(0xc9e2ff,0x1c2e32,.75));
      const sun=new T.DirectionalLight(0xffe6c8,1.35);sun.position.set(-8,15,4);scene.add(sun);const fill=new T.DirectionalLight(0x9dc3e5,.45);fill.position.set(7,8,-8);scene.add(fill);
      const floorMaterial=new T.MeshPhongMaterial({color:0x17262c,shininess:10});floorMaterial.color.convertSRGBToLinear();const floor=new T.Mesh(new T.PlaneBufferGeometry(180,180),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
      const specs=UsedCarModel.VEHICLES,cars=specs.map((s,i)=>{const c=UsedCarVehicles.create(T,s.modelId,s.color,100+i,library);c.setEnvironment(library.environment('garage'));c.setCondition({rust:.4,bodyDamage:0});c.wheels.filter(w=>w.front).forEach(w=>w.pivot.rotation.y=.18);const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.75)');gradient.addColorStop(.45,'rgba(0,0,0,.5)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const shadow=new T.Mesh(new T.PlaneBufferGeometry(3.5,6),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;c.group.add(shadow);scene.add(c.group);return c;});
      const camera=new T.PerspectiveCamera(39,480/405,.1,100);camera.position.set(5.2,2.6,6.2);camera.lookAt(0,.65,0);r.setScissorTest(true);
      cars.forEach((c,i)=>{cars.forEach((v,j)=>v.group.visible=i===j);r.setViewport(i%3*480,Math.floor((5-i)/3)*405,480,405);r.setScissor(i%3*480,Math.floor((5-i)/3)*405,480,405);r.render(scene,camera);});
      document.getElementById('caption').remove();const labels=document.createElement('div');labels.className='labels';specs.forEach(s=>{const label=document.createElement('span');label.textContent=s.name[0];const detail=document.createElement('small');detail.textContent=s.name[1]+' / '+s.drive+' / '+s.powerKw+' kW / '+s.mass+' kg';label.appendChild(detail);labels.appendChild(label);});document.body.appendChild(labels);
      window.lineupErrors=library.errors;window.lineupGlError=gl.getError();
    });
  });
  await page.evaluate(()=>lineupReady);
  assert.deepEqual(await page.evaluate(()=>lineupErrors),[]);assert.equal(await page.evaluate(()=>lineupGlError),0);assert.deepEqual(errors,[]);
  await page.screenshot({timeout:60000,path:output+'/used-car-racing-car-lineup.png'});
  console.log('PASS actual three-track and six-model gallery: '+output);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
