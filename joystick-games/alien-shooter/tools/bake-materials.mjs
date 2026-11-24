#!/usr/bin/env node
// Deterministic original texture authoring and approximate ground-light baking.
// No network assets, GPU rendering, random clock seed or system fonts are used.
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
const require=createRequire(new URL('../../../../desktop/package.json',import.meta.url));
const root=new URL('../',import.meta.url),assets=new URL('src/main/assets/',root);
const destination=process.argv.includes('--output')?process.argv[process.argv.indexOf('--output')+1]:fileURLToPath(assets);
const worldSource=await readFile(new URL('world.js',assets),'utf8');
const worldHash=createHash('sha256').update(worldSource).digest('hex');
const recipeHash=createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex');
if(process.argv.includes('--verify')){
  const scope={};runInNewContext(await readFile(destination+'/baked-materials.js','utf8'),scope,{timeout:1000});
  const m=scope.AlienShooterBaked;
  if(!m||m.version!==1||m.worldSha256!==worldHash||m.recipeSha256!==recipeHash)throw new Error('Bake inputs changed; regenerate baked textures with tools/bake-materials.mjs');
  const expected={'baked-atlas.png':[1024,1024],'baked-floor.png':[1024,1024],'baked-light-0.png':[512,512],'baked-light-1.png':[512,512],'baked-light-2.png':[512,512]};
  if(JSON.stringify(Object.keys(m.files).sort())!==JSON.stringify(Object.keys(expected).sort()))throw new Error('Unexpected baked texture set');
  let total=0;
  for(const [name,dimensions]of Object.entries(expected)){
    const data=await readFile(destination+'/'+name),entry=m.files[name];
    if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.toString('ascii',12,16)!=='IHDR')throw new Error('Invalid PNG '+name);
    if(data.readUInt32BE(16)!==dimensions[0]||data.readUInt32BE(20)!==dimensions[1]||data.length!==entry.bytes||createHash('sha256').update(data).digest('hex')!==entry.sha256)throw new Error('Baked texture dimensions/checksum mismatch: '+name);
    total+=data.length;
  }
  if(total>3*1024*1024)throw new Error('Baked PNGs exceed the 3MiB disk budget');
  if(m.flipY!==false||m.atlas.url!=='baked-atlas.png'||m.atlas.size!==1024||m.stages.length!==3||m.encoding.atlas!=='sRGB'||m.encoding.floor!=='sRGB'||m.encoding.light!=='linear')throw new Error('Baked texture coordinate/encoding contract changed');
  for(let i=0;i<3;i++){const s=m.stages[i];if(s.floor!=='baked-floor.png'||s.light!=='baked-light-'+i+'.png'||s.width!==48||s.height!==34||!Number.isInteger(s.floorTint)||s.floorTint<0||s.floorTint>0xffffff||s.lightMapIntensity!==1)throw new Error('Invalid baked stage metadata '+i);}
  for(const name of ['crateTop','crateSide','metal','skin','white','barrelTop','barrelSide','pickupHealth','pickupAmmo','pickupArmor','pickupCredits','pickupGrenade']){
    const r=m.atlas.tiles[name];if(!Array.isArray(r)||r.length!==4||r.some(v=>!Number.isFinite(v)||v<0||v>1)||r[0]>=r[2]||r[1]>=r[3])throw new Error('Invalid atlas tile '+name);
  }
  console.log(JSON.stringify({verified:true,textures:5,bytes:total,worldSha256:worldHash,recipeSha256:recipeHash}));
  process.exit(0);
}
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
let result;
try{
  const page=await browser.newPage();
  await page.addScriptTag({content:worldSource});
  result=await page.evaluate(()=>{
    const TAU=Math.PI*2;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
    function surface(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d',{willReadFrequently:true})];}
    const files={};
    function save(name,c){files[name]=c.toDataURL('image/png').split(',')[1];}
    // A tiny authored block alphabet makes labels identical across host fonts.
    const glyphs={
      A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],
      C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],
      E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],
      G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],
      I:['11111','00100','00100','00100','00100','00100','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],
      L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],
      N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],
      P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],
      S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],
      U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],
      X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],
      '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],
      '2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],
      '4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],
      '6':['01111','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
      '8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','11110'],
      '-':['00000','00000','00000','11111','00000','00000','00000']
    };
    function text(g,value,x,y,scale,color){g.fillStyle=color;for(const ch of value){const rows=glyphs[ch];if(rows)for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(rows[row][col]==='1')g.fillRect(x+col*scale,y+row*scale,scale,scale);x+=6*scale;}}
    function noise(g,w,h,seed,strength=10){const r=rng(seed),im=g.getImageData(0,0,w,h);for(let i=0;i<im.data.length;i+=4){const n=(r()-.5)*strength;im.data[i]+=n;im.data[i+1]+=n;im.data[i+2]+=n;}g.putImageData(im,0,0);}
    function bevel(g,x,y,w,h,base,depth=8){
      g.fillStyle='#263132';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle=base;g.fillRect(x,y,w,h);
      g.fillStyle='rgba(235,244,229,.27)';g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x+w-depth,y+depth);g.lineTo(x+depth,y+depth);g.lineTo(x+depth,y+h-depth);g.lineTo(x,y+h);g.fill();
      g.fillStyle='rgba(9,18,18,.32)';g.beginPath();g.moveTo(x+w,y);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.lineTo(x+depth,y+h-depth);g.lineTo(x+w-depth,y+h-depth);g.lineTo(x+w-depth,y+depth);g.fill();
    }
    function bolt(g,x,y,r=5){g.fillStyle='rgba(8,14,14,.65)';g.beginPath();g.arc(x+1,y+2,r+2,0,TAU);g.fill();g.fillStyle='#c5c9b5';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.strokeStyle='#4a5553';g.lineWidth=2;g.beginPath();g.moveTo(x-r*.65,y);g.lineTo(x+r*.65,y);g.stroke();}
    function scratches(g,w,h,seed,count=220){const r=rng(seed);for(let i=0;i<count;i++){let x=r()*w,y=r()*h;g.strokeStyle=r()<.55?'rgba(5,18,16,.16)':'rgba(236,237,211,.17)';g.lineWidth=.7+r();g.beginPath();g.moveTo(x,y);g.lineTo(x+3+r()*19,y-1-r()*4);g.stroke();}}
    function hazard(g,x,y,w,h){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='#b5aa72';g.fillRect(x,y,w,h);g.fillStyle='#28302d';for(let i=-h;i<w+h;i+=h*.72){g.beginPath();g.moveTo(x+i,y+h);g.lineTo(x+i+h*.33,y+h);g.lineTo(x+i+h*1.33,y);g.lineTo(x+i+h,y);g.fill();}g.restore();}
    function crateTop(g,w,h){
      g.fillStyle='#8d9994';g.fillRect(0,0,w,h);bevel(g,8,8,w-16,h-16,'#aeb6aa',12);bevel(g,38,38,w-76,h-76,'#8b9790',10);
      for(const x of [w*.17,w*.83]){bevel(g,x-13,4,26,h-8,'#c4cabc',4);for(const y of [20,h-20])bolt(g,x,y,5);}
      for(const y of [h*.18,h*.82]){g.fillStyle='#303d37';g.fillRect(44,y-4,w-88,8);g.fillStyle='#cbd0bb';g.fillRect(44,y-5,w-88,1);}
      bevel(g,w*.3,h*.38,w*.4,h*.23,'#b9bda5',4);text(g,'CARGO',w*.335,h*.405,4,'#44514b');text(g,'03-71',w*.354,h*.49,2.5,'#56615a');
      hazard(g,w*.26,h*.68,w*.48,22);scratches(g,w,h,31,350);noise(g,w,h,177,8);
    }
    function crateSide(g,w,h){
      g.fillStyle='#94a099';g.fillRect(0,0,w,h);bevel(g,6,6,w-12,h-12,'#a6b0a7',10);bevel(g,36,35,w-72,h-70,'#7b8982',9);
      for(let i=0;i<5;i++)bevel(g,61+i*(w-122)/5,54,(w-122)/5-9,h-108,'#a0aaa0',6);
      for(const y of [h*.16,h*.84]){bevel(g,4,y-13,w-8,26,'#bbc1ae',4);for(const x of [20,w-20])bolt(g,x,y,5);}
      bevel(g,w*.32,h*.39,w*.36,h*.22,'#bdc1ad',4);text(g,'FREIGHT',w*.345,h*.418,3,'#3c4a43');text(g,'017',w*.443,h*.5,3,'#58625a');
      for(let i=0;i<19;i++){g.fillStyle=i%3?'#49584e':'#879181';g.fillRect(w*.36+i*6,h*.68,i%2?2:4,23);}
      scratches(g,w,h,79,340);noise(g,w,h,511,8);
    }
    function metal(g,w,h){
      const r=rng(311);g.fillStyle='#aab5af';g.fillRect(0,0,w,h);
      for(let y=0;y<h;y++){g.fillStyle=`rgba(35,50,46,${r()*.1})`;g.fillRect(0,y,w,1);}
      for(let x=0;x<w;x+=w/4){g.fillStyle='#52605b';g.fillRect(x,0,2,h);g.fillStyle='#d2d6c7';g.fillRect(x+3,0,1,h);}
      scratches(g,w,h,192,130);noise(g,w,h,602,6);
    }
    function skin(g,w,h){
      const r=rng(5718);g.fillStyle='#b8b798';g.fillRect(0,0,w,h);
      for(let i=0;i<1250;i++){let x=r()*w,y=r()*h,a=r()*TAU,size=2+r()*9;g.fillStyle=r()<.62?'rgba(42,49,29,.23)':'rgba(238,224,168,.22)';g.beginPath();g.ellipse(x,y,size,size*.45,a,0,TAU);g.fill();}
      for(let row=0;row<5;row++)for(let col=0;col<10;col++){let x=col*w/9+(row%2)*w/18,y=row*h/4;g.strokeStyle='rgba(48,58,35,.32)';g.lineWidth=2;g.beginPath();g.moveTo(x-14,y);g.bezierCurveTo(x,y+6,x+8,y+18,x+18,y+22);g.stroke();g.strokeStyle='rgba(242,230,168,.18)';g.beginPath();g.moveTo(x-14,y-1);g.bezierCurveTo(x,y+5,x+8,y+17,x+18,y+21);g.stroke();}
      noise(g,w,h,778,6);
    }
    function barrelSide(g,w,h){
      g.fillStyle='#a78b58';g.fillRect(0,0,w,h);const grad=g.createLinearGradient(0,0,w,0);grad.addColorStop(0,'rgba(10,24,19,.25)');grad.addColorStop(.32,'rgba(249,231,177,.18)');grad.addColorStop(1,'rgba(10,24,19,.25)');g.fillStyle=grad;g.fillRect(0,0,w,h);
      for(const y of [h*.18,h*.82]){g.fillStyle='#263832';g.fillRect(0,y-7,w,14);g.fillStyle='#a5ad94';g.fillRect(0,y-8,w,2);}
      hazard(g,w*.23,h*.34,w*.54,h*.3);text(g,'FUEL',w*.35,h*.7,3,'#e4d6a4');scratches(g,w,h,678,160);noise(g,w,h,619,8);
    }
    function barrelTop(g,w,h){g.fillStyle='#454f3f';g.fillRect(0,0,w,h);g.fillStyle='#baa776';g.beginPath();g.arc(w/2,h/2,w*.47,0,TAU);g.fill();g.strokeStyle='#e0cea1';g.lineWidth=4;g.beginPath();g.arc(w/2,h/2,w*.425,0,TAU);g.stroke();g.strokeStyle='#4e5743';g.lineWidth=7;g.beginPath();g.arc(w/2,h/2,w*.40,0,TAU);g.stroke();bolt(g,w*.68,h*.33,12);noise(g,w,h,229,8);}
    function pickup(kind,g,w,h){
      const color={Health:'#aa6559',Ammo:'#b1a275',Armor:'#6694aa',Credits:'#b3a063',Grenade:'#82935b'}[kind];
      g.fillStyle=color;g.fillRect(0,0,w,h);bevel(g,5,5,w-10,h-10,color,7);g.fillStyle='#ecebd9';
      if(kind==='Health'){g.fillRect(w*.42,h*.21,w*.16,h*.58);g.fillRect(w*.21,h*.42,w*.58,h*.16);}
      else if(kind==='Ammo'){for(let n=0;n<3;n++){g.fillRect(w*(.25+n*.19),h*.38,w*.12,h*.36);g.beginPath();g.moveTo(w*(.25+n*.19),h*.38);g.lineTo(w*(.31+n*.19),h*.23);g.lineTo(w*(.37+n*.19),h*.38);g.fill();}}
      else if(kind==='Armor'){g.beginPath();g.moveTo(w*.25,h*.22);g.lineTo(w*.75,h*.22);g.lineTo(w*.71,h*.63);g.lineTo(w*.5,h*.82);g.lineTo(w*.29,h*.63);g.fill();}
      else if(kind==='Credits'){g.lineWidth=6;g.strokeStyle='#ecebd9';g.beginPath();g.arc(w*.5,h*.5,w*.25,0,TAU);g.stroke();text(g,'C',w*.37,h*.32,5,'#ecebd9');}
      else{g.beginPath();g.ellipse(w*.48,h*.57,w*.18,h*.24,-.25,0,TAU);g.fill();g.fillRect(w*.46,h*.21,w*.16,h*.15);g.strokeStyle='#ecebd9';g.lineWidth=5;g.beginPath();g.arc(w*.68,h*.29,w*.11,0,TAU);g.stroke();}
      noise(g,w,h,kind.length*101,5);
    }
    const [atlas,ag]=surface(1024),tiles={};ag.fillStyle='#808879';ag.fillRect(0,0,1024,1024);
    const slots=[['crateTop',0,0,512,512,16,crateTop],['crateSide',512,0,512,512,16,crateSide],['metal',0,512,256,256,8,metal],['barrelSide',256,512,256,256,8,barrelSide],['skin',512,512,512,256,8,skin],['barrelTop',0,768,256,256,8,barrelTop],['white',896,896,128,128,8,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);}]];
    ['Health','Ammo','Armor','Credits','Grenade'].forEach((kind,i)=>slots.push(['pickup'+kind,256+i*128,768,128,128,4,(g,w,h)=>pickup(kind,g,w,h)]));
    for(const [name,x,y,w,h,pad,draw]of slots){const [tile,tg]=surface(w-pad*2,h-pad*2);draw(tg,tile.width,tile.height);const tw=tile.width,th=tile.height;ag.drawImage(tile,x+pad,y+pad);ag.drawImage(tile,0,0,1,th,x,y+pad,pad,th);ag.drawImage(tile,tw-1,0,1,th,x+w-pad,y+pad,pad,th);ag.drawImage(atlas,x,y+pad,w,1,x,y,w,pad);ag.drawImage(atlas,x,y+h-pad-1,w,1,x,y+h-pad,w,pad);tiles[name]=[(x+pad+.5)/1024,(y+pad+.5)/1024,(x+w-pad-.5)/1024,(y+h-pad-.5)/1024];}
    save('baked-atlas.png',atlas);
    const [floor,fg]=surface(1024),fr=rng(7182);fg.fillStyle='#a1aaa4';fg.fillRect(0,0,1024,1024);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){
      const x=i*256,y=j*256;
      // Floor detail supports the actors: softer seams than the crate atlas,
      // otherwise a large repeating field becomes a high-contrast checkerboard.
      fg.fillStyle='#78857b';fg.fillRect(x+1,y+1,254,254);fg.fillStyle='#9ca69f';fg.fillRect(x+5,y+5,246,246);
      fg.fillStyle='rgba(231,237,217,.13)';fg.fillRect(x+5,y+5,246,3);fg.fillRect(x+5,y+5,3,246);
      fg.fillStyle='rgba(34,47,38,.14)';fg.fillRect(x+248,y+8,3,243);fg.fillRect(x+8,y+248,243,3);
      fg.save();fg.globalAlpha=.68;for(const [bx,by]of [[14,14],[242,14],[14,242],[242,242]])bolt(fg,x+bx,y+by,3);fg.restore();
      if((i+j)%4===1)for(let k=0;k<12;k++){fg.fillStyle='#78847b';fg.fillRect(x+36,y+40+k*14,184,5);fg.fillStyle='#a8b2a8';fg.fillRect(x+36,y+45+k*14,184,1);}
    }
    noise(fg,1024,1024,7182,8);fg.save();fg.globalAlpha=.65;scratches(fg,1024,1024,888,620);fg.restore();
    for(let i=0;i<90;i++){let x=fr()*1024,y=fr()*1024,r=10+fr()*65;for(const dx of [-1024,0,1024])for(const dy of [-1024,0,1024]){const cx=x+dx,cy=y+dy,grad=fg.createRadialGradient(cx,cy,0,cx,cy,r);grad.addColorStop(0,'rgba(50,43,23,.12)');grad.addColorStop(1,'rgba(50,43,23,0)');fg.fillStyle=grad;fg.fillRect(cx-r,cy-r,r*2,r*2);}}
    save('baked-floor.png',floor);
    const stages=[],labels=['CARGO 01','BIOLAB 02','CORE 03'],tints=[0xd1d4bd,0xc4d9dd,0xc4c8d2];
    function distRect(x,y,s){return Math.hypot(Math.max(s.x-x,0,x-s.x-s.w),Math.max(s.y-y,0,y-s.y-s.h));}
    function blocked(x,y,lx,ly,solids){for(const s of solids){let t0=0,t1=1,dx=lx-x,dy=ly-y;for(const [p,q]of [[-dx,x-s.x],[dx,s.x+s.w-x],[-dy,y-s.y],[dy,s.y+s.h-y]]){if(Math.abs(p)<1e-8){if(q<0){t0=2;break;}}else{const r=q/p;if(p<0)t0=Math.max(t0,r);else t1=Math.min(t1,r);}}if(t0<t1&&t1>.02&&t0<.97)return true;}return false;}
    for(const map of AlienShooterWorld.stages){
      const [light,lg]=surface(512),im=lg.createImageData(512,512),solids=map.solids;
      const emitters=[];for(let y=4;y<map.height-2;y+=7)for(const x of [1.1,map.width-1.1])emitters.push({x,y,r:3.6,color:map.id===1?[.28,.52,.57]:[.68,.42,.16]});
      for(const e of map.lights){const n=parseInt(e.color.slice(1),16);emitters.push({x:e.x,y:e.y,r:3.7,color:[((n>>16)&255)/255*.65,((n>>8)&255)/255*.65,(n&255)/255*.65]});}
      const contacts=map.props.filter(p=>['rack','tank','console'].includes(p.type)).map(p=>({x:p.x-.5,y:p.y-.4,w:1,h:.8})).concat(map.objectives.map(p=>({x:p.x-.5,y:p.y-.35,w:1,h:.7})));
      for(let py=0;py<512;py++)for(let px=0;px<512;px++){
        const x=(px+.5)/512*map.width,y=(py+.5)/512*map.height;let shade=1;
        for(const s of solids){const d=distRect(x,y,s),offset={x:s.x+.18,y:s.y+.28,w:s.w,h:s.h};const sd=distRect(x,y,offset);shade*=1-.32*Math.exp(-d*d/.22);shade*=1-.2*Math.exp(-sd*sd/.55);}
        for(const s of contacts){const d=distRect(x,y,s);shade*=1-.35*Math.exp(-d*d/.16);}
        shade=Math.max(.19,shade);const rgb=[.71*shade,.73*shade,.72*shade];
        for(const e of emitters){const d=Math.hypot(x-e.x,y-e.y);if(d>e.r)continue;const fall=Math.pow(1-d/e.r,2)*.75;if(fall>.015&&!blocked(x,y,e.x,e.y,solids))for(let c=0;c<3;c++)rgb[c]+=e.color[c]*fall;}
        const i=(py*512+px)*4;for(let c=0;c<3;c++)im.data[i+c]=Math.round(clamp(rgb[c],0,1)*255);im.data[i+3]=255;
      }
      lg.putImageData(im,0,0);
      // Paint is baked as a modest neutral radiance lift, not an extra decal pass.
      const wx=512/map.width,wy=512/map.height;lg.save();lg.scale(wx,wy);
      lg.fillStyle='rgba(242,232,180,.38)';for(let q=0;q<3;q++){let cx=map.width*(q+.5)/3;for(let k=0;k<8;k++)lg.fillRect(cx-2.4+k*.68,3.5,.42,.14);lg.fillRect(cx-1.9,map.height-3,3.8,.055);}
      lg.fillStyle='rgba(183,235,202,.42)';for(let q=-1;q<=1;q++)lg.fillRect(map.exit.x+q*.5-.04,map.exit.y-.675,.08,1.35);
      lg.restore();const scale=1.5,label=labels[map.id],lw=label.length*6*scale;text(lg,label,(512-lw)/2,512/2-5,scale,'rgba(237,236,202,.26)');
      save('baked-light-'+map.id+'.png',light);stages.push({floor:'baked-floor.png',floorTint:tints[map.id],light:'baked-light-'+map.id+'.png',width:map.width,height:map.height,lightMapIntensity:1});
    }
    return {files,metadata:{version:1,atlas:{url:'baked-atlas.png',size:1024,tiles},stages,encoding:{atlas:'sRGB',floor:'sRGB',light:'linear'},flipY:false,lightMapUV:'worldX / width, worldZ / height',source:'Original deterministic authored surface detail and approximate static ground contact/light bake; not a path-traced lightmap.'}};
  });
}finally{await browser.close();}
await mkdir(destination,{recursive:true});
const hashes={};
for(const [name,base64]of Object.entries(result.files)){
  let data=Buffer.from(base64,'base64');
  // Palette encoding preserves 1024px detail while removing needless RGB noise
  // entropy from the APK. Light maps retain full RGB to avoid lighting bands.
  if(name==='baked-atlas.png'||name==='baked-floor.png'){
    const encoded=spawnSync('python3',['-c',`import io,sys\nfrom PIL import Image\nim=Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB')\nout=io.BytesIO()\nim.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).save(out,format='PNG',optimize=True)\nsys.stdout.buffer.write(out.getvalue())`],{input:data,maxBuffer:8*1024*1024});
    if(encoded.status!==0)throw new Error('PNG palette encoding requires Python3 + Pillow: '+encoded.stderr.toString().slice(0,600));
    data=encoded.stdout;
  }
  await writeFile(destination+'/'+name+'.tmp',data);await rename(destination+'/'+name+'.tmp',destination+'/'+name);hashes[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
}
result.metadata.worldSha256=worldHash;
result.metadata.recipeSha256=recipeHash;
result.metadata.files=hashes;
await writeFile(destination+'/baked-materials.js.tmp','/* Generated by tools/bake-materials.mjs. Do not hand-edit. See docs/baking.md. */\n(function(root){\n  \'use strict\';\n  root.AlienShooterBaked = '+JSON.stringify(result.metadata,null,2)+';\n})(typeof window !== \'undefined\' ? window : this);\n');
await rename(destination+'/baked-materials.js.tmp',destination+'/baked-materials.js');
console.log(JSON.stringify({output:destination,worldSha256:worldHash,files:hashes},null,2));
