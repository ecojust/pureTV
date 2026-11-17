/* Thermal Glider: public flight geometry with a separate aperture/attitude instrument. */
(function(root){
'use strict';
// Original atlas painters; all lighting/material detail is baked once.
function meadowArt(c,w,h,a){
 c.fillStyle='#89ad84';c.fillRect(0,0,w,h);
 // Wrap broad tonal patches at every edge so the meadow has no tile seams.
 [[118,48,180,83,'#d8dcb12b'],[355,163,170,102,'#375f4929'],[45,199,115,68,'#bad3a026']].forEach(([x,y,rx,ry,color])=>{
  for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){
   c.save();c.translate(x+ix*w,y+iy*h);c.scale(1,ry/rx);a.ellipse(c,0,0,rx,rx,a.radial(c,0,0,rx,[[0,color],[1,'#8aaa8000']]));c.restore();
  }
 });
 c.strokeStyle='#dfe4b72b';c.lineWidth=1.1;
 for(let row=-1;row<=9;row++){const y=8+row*h/8;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*.25,y+12,w*.75,y-12,w,y);c.stroke();}
 let seed=841;for(let i=0;i<44;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%w;seed=(seed*1664525+1013904223)>>>0;const y=seed%h;const radius=2+(i%4);
  for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){c.save();c.translate(x+ix*w,y+iy*h);c.scale(1,.6);a.ellipse(c,0,0,radius,radius,a.radial(c,0,0,radius,[[0,'#3b6a4d22'],[1,'#3b6a4d00']]));c.restore();}
 }
}
function mountainArt(c,w,h,a){
 // Constant-height rock mesas: the whole visible round footprint is a cliff.
 c.save();c.scale(w/256,h/256);
 a.ellipse(c,128,128,123,123,'#47695f');
 a.ellipse(c,128,128,118,118,a.linear(c,34,24,223,233,[[0,'#c5ccb3'],[.45,'#a0b39a'],[1,'#748f7e']]));
 a.path(c,[[40,65],[100,27],[178,38],[212,81],[161,118],[86,112]],'#b9c6ac');
 a.path(c,[[33,102],[86,112],[101,177],[50,206],[18,155]],'#97b09a');
 a.path(c,[[86,112],[161,118],[205,169],[181,222],[106,237],[101,177]],'#a7baa0');
 a.path(c,[[161,118],[212,81],[239,140],[205,169]],'#819e8a');
 a.path(c,[[100,27],[178,38],[159,70],[116,75]],'#d3d7bd');
 c.strokeStyle='#e4e7c966';c.lineWidth=2;c.beginPath();c.moveTo(43,70);c.lineTo(96,42);c.lineTo(150,48);c.moveTo(60,204);c.lineTo(100,176);c.lineTo(144,185);c.stroke();
 c.strokeStyle='#56796770';c.lineWidth=1.5;c.beginPath();c.moveTo(86,112);c.lineTo(101,177);c.lineTo(105,210);c.moveTo(161,118);c.lineTo(192,99);c.lineTo(212,81);c.stroke();
 c.strokeStyle='#e9e8c359';c.lineWidth=2;c.beginPath();c.arc(128,128,116,Math.PI*.91,Math.PI*1.8);c.stroke();c.restore();
}
function gliderArt(c,w,h,a){
 c.save();c.scale(w/256,h/224);
 // The modeled aircraft center maps to(128,112), nose points toward negative z.
 a.path(c,[[121,83],[111,90],[14,108],[8,118],[10,128],[118,113],[121,187],[97,195],[94,204],[126,200],[130,200],[162,204],[159,195],[135,187],[138,113],[246,128],[248,118],[242,108],[145,90],[135,83],[134,41],[131,22],[128,14],[125,22],[122,41]],a.linear(c,80,25,160,203,[[0,'#fffef0'],[.45,'#e5f0e8'],[.65,'#b9d4d3'],[1,'#89b0b5']]),'#f2fff2',2);
 a.path(c,[[9,117],[26,113],[28,125],[10,128]],'#dd786c');a.path(c,[[230,113],[247,117],[246,128],[228,125]],'#dd786c');
 a.path(c,[[121,83],[127,75],[133,83],[136,181],[130,195],[125,195],[120,181]],a.linear(c,119,0,136,0,[[0,'#bad2d0'],[.35,'#fffdf0'],[.65,'#f0f6e9'],[1,'#83aab3']]));
 a.path(c,[[122,61],[124,45],[128,38],[132,45],[134,61],[132,85],[124,85]],a.linear(c,122,43,134,83,[[0,'#acd6d7'],[.3,'#345b6e'],[.8,'#244858'],[1,'#7faeb7']]),'#d6ece6',1.2);
 c.strokeStyle='#e6fcf3';c.lineWidth=1.3;c.beginPath();c.moveTo(126,44);c.lineTo(124,62);c.stroke();
 c.strokeStyle='#6a969e';c.lineWidth=1.1;c.beginPath();c.moveTo(31,119);c.lineTo(110,105);c.lineTo(117,108);c.moveTo(139,108);c.lineTo(146,105);c.lineTo(225,119);c.moveTo(100,199);c.lineTo(123,193);c.moveTo(133,193);c.lineTo(156,199);c.stroke();
 c.strokeStyle='#f9ffef';c.lineWidth=1.8;c.beginPath();c.moveTo(31,111);c.lineTo(110,95);c.moveTo(146,95);c.lineTo(225,111);c.stroke();
 c.fillStyle='#d97d6d';c.fillRect(125,156,6,22);c.restore();
}
function runwayArt(c,w,h,a){
 c.fillStyle='#477365';c.fillRect(0,0,w,h);c.fillStyle='#b8c8a0';c.fillRect(w*.11,0,w*.78,h);
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#809c8a'],[.5,'#587b74'],[1,'#40665f']]);c.fillRect(w*.18,0,w*.64,h);
 c.strokeStyle='#f6edce';c.lineWidth=2;c.beginPath();c.moveTo(w*.2,0);c.lineTo(w*.2,h);c.moveTo(w*.8,0);c.lineTo(w*.8,h);c.stroke();
 c.strokeStyle='#eaf1d0';c.lineWidth=2.5;for(let y=9;y<h;y+=26){c.beginPath();c.moveTo(w*.5,y);c.lineTo(w*.5,y+13);c.stroke();}
 c.fillStyle='#eee4c2';for(let x=w*.25;x<w*.77;x+=w*.11)c.fillRect(x,h-30,w*.055,17);
 c.strokeStyle='#dae6bd';c.lineWidth=1;c.strokeRect(w*.25,9,w*.5,14);
}
const V={x:20,y:56,w:704,h:372,cx:372,cy:246,scale:2};
const C={ink:'#183d49',cream:'#eef0d9',mint:'#a6e0c9',gold:'#f1ca83',coral:'#f0a091',muted:'#a2c0bb'};
const atlas={builtins:['glow','ring','shadow'],tiles:[
 {name:'flight_meadow',x:0,y:0,w:512,h:224,paint:meadowArt},
 {name:'flight_glider',x:512,y:0,w:256,h:224,paint:gliderArt},
 {name:'flight_mountain',x:0,y:800,w:256,h:224,paint:mountainArt},
 {name:'flight_runway',x:256,y:800,w:128,h:224,paint:runwayArt}
]};
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x)),deg=x=>x*180/Math.PI;
function center(r,t,x,y,n,c){r.text(t,x-r.measureText(t,n)/2,y,n,c);}
function point(s,x,z){return{x:V.cx+(x-s.glider.x)*V.scale,y:V.cy-(z-s.glider.z)*V.scale};}
function arrow(r,x1,y1,x2,y2,color,width=2,head=7){const d=Math.hypot(x2-x1,y2-y1);if(d<.01)return;const ux=(x2-x1)/d,uy=(y2-y1)/d;r.line(x1,y1,x2,y2,width,color);r.line(x2,y2,x2-ux*head-uy*head*.6,y2-uy*head+ux*head*.6,width,color);r.line(x2,y2,x2-ux*head+uy*head*.6,y2-uy*head-ux*head*.6,width,color);}
function loop(r,x,y,rad,color,width=1.2,dashed=false){const count=48;for(let i=0;i<count;i++){if(dashed&&i%3===2)continue;const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2;r.line(x+Math.cos(a)*rad,y+Math.sin(a)*rad,x+Math.cos(b)*rad,y+Math.sin(b)*rad,width,color);}}
function visible(p,radius=0){return p.x+radius>=V.x&&p.x-radius<=V.x+V.w&&p.y+radius>=V.y&&p.y-radius<=V.y+V.h;}
function terrain(r,s){
 const g=s.glider,tile=160;
 const left=Math.floor((g.x-(V.cx-V.x)/V.scale)/tile),right=Math.ceil((g.x+(V.x+V.w-V.cx)/V.scale)/tile);
 const bottom=Math.floor((g.z-(V.y+V.h-V.cy)/V.scale)/tile),top=Math.ceil((g.z+(V.cy-V.y)/V.scale)/tile);
 for(let x=left;x<right;x++)for(let z=bottom;z<top;z++){const p=point(s,(x+.5)*tile,(z+.5)*tile);r.sprite('flight_meadow',p.x,p.y,tile*V.scale,tile*V.scale,0,'#fff');}
 // A decorative watercourse has no collision or lift behavior.
 const riverX=z=>(s.world.xMin+s.world.xMax)*.5+Math.sin(z*.007)*45+(s.world.xMax-s.world.xMin)*.25;
 const zStart=Math.floor((g.z-160)/12)*12,zEnd=g.z+160;
 for(let z=zStart;z<zEnd;z+=12){const a=point(s,riverX(z),z),b=point(s,riverX(z+12),z+12);r.line(a.x,a.y,b.x,b.y,13,'#c8d7b4');r.line(a.x,a.y,b.x,b.y,9,'#70acb3');r.line(a.x-1,a.y,b.x-1,b.y,2,'#b2d9cb88');}
 const w=s.world,corners=[[w.xMin,w.zMin],[w.xMax,w.zMin],[w.xMax,w.zMax],[w.xMin,w.zMax]];
 corners.forEach((p,i)=>{const a=point(s,p[0],p[1]),q=corners[(i+1)%4],b=point(s,q[0],q[1]);r.line(a.x,a.y,b.x,b.y,4,'#d78c7299');});
 s.thermals.forEach(t=>{
  const p=point(s,t.x,t.z),radius=t.radius*V.scale;if(!visible(p,radius))return;
  r.sprite('glow',p.x,p.y,radius*2,radius*2,0,'#e8e3b253');loop(r,p.x,p.y,radius,'#fff2b9b3',1.5,true);
  for(let i=0;i<3;i++){const phase=(s.elapsed*.17+i/3)%1,rr=radius*(.18+.7*phase);loop(r,p.x,p.y,rr,[1,.96,.77,(1-phase)*.28],1);}
  center(r,'PEAK LIFT '+t.strength.toFixed(1)+' m/s',p.x,p.y-radius+10,11,'#4f654f');
  const rise=(s.elapsed*.7)%1;for(let i=0;i<2;i++){const y=p.y+9-i*10-rise*10;r.line(p.x-5,y+3,p.x,y,1.5,'#fff4c5');r.line(p.x,y,p.x+5,y+3,1.5,'#fff4c5');}
 });
 s.mountains.forEach((m,index)=>{
  const p=point(s,m.x,m.z),radius=m.radius*V.scale;if(!visible(p,radius+20))return;
  r.sprite('flight_mountain',p.x,p.y,radius*2*256/246,radius*2*256/246,0,'#fff');
  loop(r,p.x,p.y,radius,'#375d53',1.5);loop(r,p.x,p.y,(m.radius+g.radius)*V.scale,g.altitude<=m.height?'#9d584cbb':'#4b777b88',1,true);
  const text='ROCK '+Math.round(m.height)+' m',labelWidth=r.measureText(text,12)+14;r.rect(p.x-labelWidth/2,p.y-8,labelWidth,22,'#234c48cf');center(r,text,p.x,p.y-3,12,'#ecedcd');
 });
 const runway=s.runway,p=point(s,runway.x,runway.z);
 r.sprite('flight_runway',p.x,p.y,runway.width*V.scale,runway.length*V.scale,runway.heading,'#fff');
 const dx=Math.sin(runway.heading),dy=-Math.cos(runway.heading),tx=Math.cos(runway.heading),ty=Math.sin(runway.heading),halfWidth=runway.width*V.scale/2,halfLength=runway.length*V.scale/2;
 const runwayCorners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([cross,along])=>({x:p.x+tx*halfWidth*cross+dx*halfLength*along,y:p.y+ty*halfWidth*cross+dy*halfLength*along}));
 runwayCorners.forEach((a,i)=>{const b=runwayCorners[(i+1)%4];r.line(a.x,a.y,b.x,b.y,1.5,'#eee9bda6')});
 arrow(r,p.x-dx*25,p.y-dy*25,p.x+dx*25,p.y+dy*25,'#f8e9ba',3,10);
 center(r,'LAND',p.x,p.y+10,14,'#fff1c9');
}
function gates(r,s){
 s.rings.forEach((gate,i)=>{
  const p=point(s,gate.x,gate.z),radius=gate.radius*V.scale;if(!visible(p,radius+30))return;
  const tx=Math.cos(gate.heading),ty=Math.sin(gate.heading),nx=Math.sin(gate.heading),ny=-Math.cos(gate.heading),active=i===s.nextRing,color=gate.passed?'#337e70':active?'#b36a3f':'#71989a';
  // A vertical aperture projects to its exact cross-track diameter, not a disk.
  r.line(p.x-tx*radius,p.y-ty*radius,p.x+tx*radius,p.y+ty*radius,active?5:3,color);
  r.line(p.x-tx*radius,p.y-ty*radius,p.x+tx*radius,p.y+ty*radius,1.3,gate.passed?'#b8e2ca':'#fff0c6');
  [-1,1].forEach(sign=>r.circle(p.x+tx*radius*sign,p.y+ty*radius*sign,3,active?'#fbe0a1':'#d7e2c4'));
  if(active)arrow(r,p.x-nx*24,p.y-ny*24,p.x+nx*17,p.y+ny*17,'#fff1c5',2.4,8);
  const text='R'+(i+1)+' / '+Math.round(gate.altitude)+'m',width=r.measureText(text,12)+10;r.rect(p.x-width/2,p.y-radius-24,width,20,'#254b49cf');center(r,text,p.x,p.y-radius-20,12,C.cream);
 });
}
function aircraft(r,s){
 const g=s.glider,bankScale=Math.cos(g.bank),pitchScale=Math.cos(g.pitch),width=g.span*V.scale*256/240*.98,height=g.length*V.scale*224/190*.98;
 const shadow=point(s,g.x-g.altitude*.09,g.z-g.altitude*.06);
 r.sprite('flight_glider',shadow.x,shadow.y,width*bankScale,height*pitchScale,g.heading,'#173e4561');
 loop(r,V.cx,V.cy,g.radius*V.scale,'#244e6099',1);
 r.sprite('flight_glider',V.cx,V.cy,width*bankScale,height*pitchScale,g.heading,'#fff');
 if(g.airbrake){const dx=Math.cos(g.heading)*8,dy=Math.sin(g.heading)*8;r.line(V.cx-dx,V.cy-dy,V.cx+dx,V.cy+dy,2,'#d77a59');}
}
function maskWorld(r){
 r.rect(0,0,960,V.y,'#173e49');r.rect(0,V.y+V.h,960,540-V.y-V.h,'#173e49');r.rect(0,V.y,V.x,V.h,'#173e49');r.rect(V.x+V.w,V.y,960-V.x-V.w,V.h,'#173e49');
 r.line(V.x,V.y,V.x+V.w,V.y,1,'#a2c3b7');r.line(V.x,V.y+V.h,V.x+V.w,V.y+V.h,1,'#729d95');
}
function navigation(r,s){
 const paintPointer=()=>{
 const target=s.rings[s.nextRing]||s.runway,p=point(s,target.x,target.z),dx=p.x-V.cx,dy=p.y-V.cy;
 if(!visible(p,0)){
  const limitX=V.w/2-26,limitY=V.h/2-30,f=Math.min(limitX/Math.max(.001,Math.abs(dx)),limitY/Math.max(.001,Math.abs(dy))),x=V.cx+dx*f,y=V.cy+dy*f,d=Math.hypot(dx,dy);
  arrow(r,x-dx/d*20,y-dy/d*20,x,y,'#fff0b2',3,9);const label=s.nextRing<s.rings.length?'R'+(s.nextRing+1):'LAND';center(r,label,x,y+12,13,'#fff0b2');
 }
 };
 arrow(r,42,96,42,69,'#ecedd4',2,6);r.text('N',37,59,11,'#eff0d4');r.text('TOP VIEW',57,67,9,'#2f5d5c');
 r.line(40,406,140,406,2,'#f3edca');r.line(40,402,40,410,1,'#f3edca');r.line(140,402,140,410,1,'#f3edca');r.text('50 m',73,412,10,'#f3edca');
 const x=562,y=67,w=148,h=105,b=s.world,scale=Math.min((w-12)/(b.xMax-b.xMin),(h-12)/(b.zMax-b.zMin));
 const mini=(xx,zz)=>({x:x+w/2+(xx-(b.xMin+b.xMax)/2)*scale,y:y+h/2-(zz-(b.zMin+b.zMax)/2)*scale});
 r.rect(x,y,w,h,'#214d50dc');
 s.thermals.forEach(t=>{const p=mini(t.x,t.z);loop(r,p.x,p.y,t.radius*scale,'#e5dda477',1)});
 s.mountains.forEach(m=>{const p=mini(m.x,m.z);r.circle(p.x,p.y,Math.max(1.5,m.radius*scale),'#9ba98a')});
 s.rings.forEach((g,i)=>{const p=mini(g.x,g.z);r.circle(p.x,p.y,i===s.nextRing?3:2,g.passed?'#91d5bc':i===s.nextRing?'#f1cd87':'#849b99')});
 const landing=mini(s.runway.x,s.runway.z);r.rect(landing.x-s.runway.width*scale/2,landing.y-s.runway.length*scale/2,s.runway.width*scale,s.runway.length*scale,'#cddbb7',s.runway.heading);
 const g=s.glider,pilot=mini(g.x,g.z);arrow(r,pilot.x-Math.sin(g.heading)*4,pilot.y+Math.cos(g.heading)*4,pilot.x+Math.sin(g.heading)*4,pilot.y-Math.cos(g.heading)*4,'#fff7da',1.5,3);
 // Keep the next public target cue visible even when it falls over the inset.
 paintPointer();
}
function gateInstrument(r,s){
 const x=742,y=56,w=194,gate=s.rings[s.nextRing],g=s.glider;r.rect(x,y,w,372,'#214c55');
 if(!gate){landingInstrument(r,s,x,y,w);return;}
 r.text('NEXT / RING '+(s.nextRing+1),x+13,y+14,16,C.gold);r.text('APERTURE VIEW',x+13,y+39,12,C.muted);
 const cx=x+w/2,cy=y+133,radius=64,scale=radius/gate.radius,clearance=gate.radius-g.radius,dx=g.x-gate.x,dz=g.z-gate.z,cross=dx*Math.cos(gate.heading)-dz*Math.sin(gate.heading),height=g.altitude-gate.altitude,normal=dx*Math.sin(gate.heading)+dz*Math.cos(gate.heading),aligned=cross*cross+height*height<=clearance*clearance;
 r.circle(cx,cy,radius+5,'#163f4a');loop(r,cx,cy,radius,'#e4c58b',3);loop(r,cx,cy,clearance*scale,'#8dbdb777',1.2,true);
 r.line(cx-radius,cy,cx+radius,cy,1,'#729e9a55');r.line(cx,cy-radius,cx,cy+radius,1,'#729e9a55');
 const px=cx+clamp(cross*scale,-72,72),py=cy-clamp(height*scale,-72,72);r.circle(px,py,4,aligned?'#c5edd0':'#f0b398');r.line(px-8,py,px+8,py,2,'#edf1d4');
 center(r,s.phase!=='playing'?'FLIGHT ENDED':aligned?'CENTER ALIGNED':'ADJUST HEIGHT / LINE',cx,y+217,aligned?15:12,aligned?C.mint:C.coral);
 r.text('GATE HEIGHT',x+13,y+245,12,C.muted);r.text(Math.round(gate.altitude)+' m',x+13,y+264,22,C.cream);
 r.text('HEIGHT '+(height>=0?'+':'')+height.toFixed(0)+' m',x+13,y+302,12,C.cream);r.text('CROSS '+(cross>=0?'+':'')+cross.toFixed(0)+' m',x+13,y+322,12,C.cream);
 r.text(s.phase!=='playing'?'ENTER / FLY AGAIN':normal<0?'TO PLANE '+Math.round(-normal)+' m':'BEYOND PLANE / GO BEHIND',x+13,y+349,12,normal<0?C.gold:C.coral);
}
function landingInstrument(r,s,x,y,w){
 const status=s.landingStatus,runway=s.runway;
 r.text('LANDING CHECK',x+13,y+14,16,C.gold);r.text(s.phase==='won'?'LANDED SAFELY':s.phase==='lost'?'FLIGHT ENDED':status.ready?'TOUCHDOWN READY':'NOT READY YET',x+13,y+44,status.ready?14:15,status.ready?C.mint:C.coral);
 const checks=[['inside','IN STRIP'],['allRings','ALL RINGS'],['airSpeedOk','AIRSPEED'],['groundSpeedOk','GROUND'],['verticalSpeedOk','SINK'],['bankOk','BANK'],['pitchOk','PITCH'],['headingOk','HEADING'],['trackOk','TRACK'],['notStalled','NO STALL']];
 checks.forEach(([key,label],i)=>{const xx=x+12+(i%2)*88,yy=y+83+Math.floor(i/2)*31;r.rect(xx,yy,12,12,status[key]?'#91cbb4':'#916f63');r.text(status[key]?'+':'-',xx+2,yy,12,'#183d49');r.text(label,xx+17,yy+1,13,status[key]?C.cream:'#d8b9a3');});
 r.line(x+13,y+247,x+w-13,y+247,1,'#6e9a95');
 r.text('AIR '+runway.minAirspeed.toFixed(1)+' - '+runway.maxAirspeed.toFixed(1)+' m/s',x+13,y+261,12,C.cream);
 r.text('SINK <= '+runway.maxSinkSpeed.toFixed(1)+' m/s',x+13,y+284,12,C.cream);
 r.text('BANK <= '+deg(runway.maxBank).toFixed(0)+' deg',x+13,y+307,12,C.muted);
 r.text('ALIGN +/- '+deg(runway.maxHeadingError).toFixed(0)+' deg',x+13,y+328,12,C.muted);
 r.text(s.phase==='playing'?'GROUND CONTACT DECIDES':'ENTER / FLY AGAIN',x+13,y+350,12,C.gold);
}
function instruments(r,s){
 const g=s.glider,ended=s.phase!=='playing',y=442;
 [[20,210],[242,210],[464,242],[718,218]].forEach(([x,w])=>{r.rect(x,y,w,84,'#214c55');r.line(x,y,x+w,y,1,'#719f98')});
 r.text('AIRSPEED',32,y+9,11,C.muted);r.text(g.airspeed.toFixed(1),32,y+28,28,g.stalled?C.coral:C.cream);r.text('m/s',116,y+42,12,C.muted);
 r.text('STALL '+g.stallSpeed.toFixed(1)+' m/s',32,y+65,12,g.stalled?C.coral:C.gold);
 r.text('HEIGHT ABOVE GROUND',254,y+9,10,C.muted);r.text(Math.max(0,g.altitude).toFixed(0)+' m',254,y+29,26,C.cream);
 r.text((g.verticalSpeed>=0?'+':'')+g.verticalSpeed.toFixed(1)+' m/s',254,y+65,12,g.verticalSpeed>0?C.mint:C.muted);
 r.text('ATTITUDE / ENLARGED',476,y+9,9,C.muted);
 r.sprite('flight_glider',523,y+50,83*Math.cos(g.bank),45*Math.cos(g.pitch),0,'#fff');
 r.text('BANK '+(g.bank>=0?'+':'')+deg(g.bank).toFixed(0)+' deg',573,y+31,14,C.cream);r.text('PITCH '+(g.pitch>=0?'+':'')+deg(g.pitch).toFixed(0)+' deg',573,y+53,14,C.cream);
 r.text(ended?'AIRBRAKE':'A / AIRBRAKE',730,y+10,11,C.muted);r.text(g.airbrake?'OPEN':'CLOSED',850,y+9,13,g.airbrake?C.coral:C.cream);
 r.text(ended?'FLAPS':'B / FLAPS',730,y+37,11,C.muted);r.text(g.flaps?'ON':'OFF',850,y+36,15,g.flaps?C.gold:C.cream);
 r.text(ended?'FLIGHT ENDED':g.stalled?'STALL / LOWER THE NOSE':g.thermalLift>0?'THERMAL LIFT '+g.thermalLift.toFixed(1)+' m/s':'NO ENGINE / GLIDE',730,y+65,9,g.stalled?C.coral:g.thermalLift>0?C.mint:C.muted);
}
function render(r,s){
 terrain(r,s);gates(r,s);aircraft(r,s);maskWorld(r);navigation(r,s);gateInstrument(r,s);instruments(r,s);
 r.text('THERMAL GLIDER',24,17,20,C.cream);r.text('VALLEY FLIGHT / '+String(s.level).padStart(2,'0'),739,23,10,C.muted);
 const modes={glide:'GLIDING',thermal:'THERMAL LIFT',airbrake:'AIRBRAKE OPEN',stall:'STALL / LOWER THE NOSE',approach:'LANDING APPROACH',landed:'LANDED',crashed:'FLIGHT ENDED'};
 center(r,s.phase==='won'?'SAFELY LANDED':s.phase==='lost'?'FLIGHT ENDED':modes[s.flightMode]||'GLIDING',477,23,12,s.glider.stalled?C.coral:s.phase==='won'?C.mint:C.gold);
}
root.GameDef={
 id:'thermal-glider',title:'热流滑翔',tagline:'让气流托住机翼，把高度换成一段远行',seed:193,
 accent:'#a7d7c5',background:'#173e49',holdConfirmAsA:true,levelLabel:'航线',levelNames:['初升','侧风','双热流'],atlas,
 description:'无引擎滑翔：左右转弯，上抬机头、下压俯冲。寻找热流，按箭头方向依次穿环。按住 A 开减速板，B 切换襟翼。全部穿环后，对准跑道并满足着陆检查再落地。',
 controls:{move:'左右转弯；上抬头、下俯冲',a:'按住减速板 · 空格 / 确认 / 右上半屏',b:'切换襟翼 · B / 右下半屏'},actionLabels:['按住减速板','切换襟翼'],
 tip:'抬头会减速，减速板会增加下沉。襟翼利于低速，高速下沉更多。穿完航环后再按着陆检查落地。',
 winTitle:'稳稳落地',loseTitle:'再飞一次',
 result(s){if(s.phase==='won')return '已穿过全部 '+s.checkpointCount+' 个航环并安全着陆，剩余 '+Math.ceil(s.remaining)+' 秒。';if(s.lostReason==='timeout')return '90 秒已到，完成 '+s.checkpointsPassed+' / '+s.checkpointCount+' 个航环。用热流保留高度，再为最后进场留出时间。';return '完成 '+s.checkpointsPassed+' / '+s.checkpointCount+' 个航环。'+(s.message||'再次出发前，注意高度、空速与着陆检查。');},
 hud(s){return[
  {label:'高度',value:Math.max(0,Math.round(s.glider.altitude))+' m'},
  {label:'空速',value:s.glider.airspeed.toFixed(1)+' m/s',tone:s.glider.stalled?'warn':''},
  {label:'航环',value:s.checkpointsPassed+' / '+s.checkpointCount,tone:s.checkpointsPassed===s.checkpointCount?'good':''},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},render
};

})(window);
