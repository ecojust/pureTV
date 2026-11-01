/* Glass Fold: exact public RGB and integer-grid geometry on a warm glasswork bench. */
(function(root){
'use strict';
// Original one-time atlas painters for a carved-wood and glass workshop.
function woodArt(c,w,h,a){
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#9a7352'],[.45,'#79533c'],[1,'#47372e']]);c.fillRect(0,0,w,h);
 for(let plank=0;plank<5;plank++){
  const y=plank*h/5;
  c.fillStyle=plank%2?'#f4cc9910':'#1d171410';c.fillRect(0,y,w,h/5);
  c.strokeStyle='#2a211c9c';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
  c.strokeStyle='#dbb38238';c.lineWidth=1;c.beginPath();c.moveTo(0,y+2);c.lineTo(w,y+2);c.stroke();
  for(let j=0;j<8;j++){
   c.strokeStyle=j%3===0?'#2a211c27':'#d9b48522';c.lineWidth=j%2?.6:1.1;c.beginPath();
   const yy=y+6+j*4.7;c.moveTo(-10,yy);c.bezierCurveTo(w*.22,yy+Math.sin(j+plank)*8,w*.7,yy-4,w+10,yy+Math.sin(j)*3);c.stroke();
  }
 }
 [[88,30],[402,120],[204,205]].forEach(([x,y])=>{
  c.save();c.translate(x,y);c.scale(2.3,.65);
  for(let k=1;k<=4;k++){c.strokeStyle='#3f2a2228';c.lineWidth=.7;c.beginPath();c.ellipse(0,0,k*5,k*3,0,0,Math.PI*2);c.stroke();}c.restore();
 });
 c.fillStyle=a.radial(c,w*.45,h*.35,w*.63,[[0,'#edc99a22'],[1,'#1d182432']]);c.fillRect(0,0,w,h);
}
function trayArt(c,w,h,a){
 c.fillStyle='#241d1e88';c.fillRect(7,9,w-10,h-10);
 c.fillStyle=a.linear(c,0,0,w,h,[[0,'#d2b18a'],[.16,'#8c6749'],[.7,'#78553f'],[1,'#b38d62']]);c.fillRect(2,2,w-6,h-7);
 c.strokeStyle='#ead2a4';c.lineWidth=1.5;c.strokeRect(5,5,w-12,h-13);
 c.strokeStyle='#3e3028';c.lineWidth=2;c.strokeRect(11,11,w-24,h-25);
 c.fillStyle=a.linear(c,0,16,0,h-18,[[0,'#dedbcc'],[.45,'#e8e5d7'],[1,'#c8c8bd']]);c.fillRect(14,14,w-30,h-31);
 c.strokeStyle='#f7eed5';c.lineWidth=1;c.strokeRect(15.5,15.5,w-33,h-34);
 for(let y=27;y<h-28;y+=13){c.strokeStyle='#8c9d9720';c.lineWidth=.5;c.beginPath();c.moveTo(24,y);c.lineTo(w-25,y);c.stroke();}
 [[8,8],[w-10,8],[8,h-12],[w-10,h-12]].forEach(([x,y])=>{a.ellipse(c,x,y,2.4,2.4,'#302d27');a.ellipse(c,x-.3,y-.4,1.8,1.8,'#b8a075');c.strokeStyle='#5c503c';c.lineWidth=.7;c.beginPath();c.moveTo(x-1,y+1);c.lineTo(x+1,y-1);c.stroke();});
}
function glassArt(c,w,h,a){
 // Only edges and sparse top-left reflections: central RGB remains model-exact.
 c.strokeStyle='#102a324d';c.lineWidth=5;c.strokeRect(2.5,2.5,w-5,h-5);
 c.strokeStyle='#f6ffffa3';c.lineWidth=2;c.beginPath();c.moveTo(4,h-5);c.lineTo(4,4);c.lineTo(w-5,4);c.stroke();
 c.strokeStyle='#1c34496b';c.lineWidth=2.5;c.beginPath();c.moveTo(w-4,6);c.lineTo(w-4,h-4);c.lineTo(6,h-4);c.stroke();
 a.path(c,[[9,9],[w*.5,9],[9,h*.5]],a.linear(c,9,9,w*.4,h*.4,[[0,'#ffffff45'],[1,'#ffffff00']]));
 c.strokeStyle='#f4ffff7a';c.lineWidth=2;c.beginPath();c.moveTo(12,20);c.lineTo(29,12);c.moveTo(12,29);c.lineTo(19,26);c.stroke();
 c.strokeStyle='#efffff39';c.lineWidth=1;c.beginPath();c.moveTo(w-24,h-11);c.lineTo(w-10,h-22);c.stroke();
}
function clipArt(c,w,h,a){
 a.ellipse(c,w/2,h*.79,w*.42,h*.16,a.radial(c,w/2,h*.78,w*.45,[[0,'#11171d77'],[1,'#11171d00']]));
 a.path(c,[[19,23],[w-19,23],[w-12,h-22],[12,h-22]],a.linear(c,0,20,w,h,[[0,'#f3d8a3'],[.27,'#b99a63'],[.54,'#e5c485'],[.76,'#9e7c46'],[1,'#6c5337']]),'#e5c993',2);
 c.fillStyle='#463d32';c.fillRect(22,37,w-44,7);c.fillStyle='#f7deb1';c.fillRect(22,34,w-44,3);
 a.ellipse(c,w/2,h*.62,8,8,'#776447');a.ellipse(c,w/2-1,h*.62-1,5,5,'#d4b67d');c.strokeStyle='#65563c';c.lineWidth=2;c.beginPath();c.moveTo(w/2-3,h*.62+3);c.lineTo(w/2+3,h*.62-3);c.stroke();
}
function toolArt(c,w,h,a){
 c.save();c.translate(50,38);c.rotate(.2);
 a.path(c,[[0,0],[25,0],[26,143],[21,154],[3,154],[-1,143]],a.linear(c,0,0,26,0,[[0,'#92603d'],[.3,'#e5b978'],[.6,'#bf8b51'],[1,'#6e4933']]),'#eac58f',1.5);
 for(let y=12;y<144;y+=9){c.strokeStyle='#593c2c';c.lineWidth=1;c.beginPath();c.moveTo(0,y);c.lineTo(y%3===0?12:7,y);c.stroke();}c.restore();
 c.save();c.translate(145,35);c.rotate(-.3);
 a.path(c,[[0,28],[18,28],[21,139],[17,153],[2,153],[-2,139]],a.linear(c,0,0,21,0,[[0,'#c3c9c3'],[.3,'#faf1d8'],[.58,'#809a9c'],[1,'#4e6e78']]),'#d4dfd3',1.5);
 c.fillStyle='#354c58';c.fillRect(-1,81,20,55);c.strokeStyle='#789298';c.lineWidth=1;for(let y=85;y<132;y+=5){c.beginPath();c.moveTo(0,y);c.lineTo(17,y);c.stroke();}
 a.path(c,[[3,28],[3,4],[9,-3],[15,4],[15,28]],'#c7b27f','#f3dfac',1.5);a.ellipse(c,9,7,4,4,'#374855');c.restore();
}
const C={ink:'#343c44',muted:'#697877',cream:'#f4dfb9',gold:'#ecc389',teal:'#8ecac7',coral:'#edb4a2'};
const atlas={builtins:['glow','shadow'],tiles:[
 {name:'fold_wood',x:0,y:0,w:512,h:224,paint:woodArt},
 {name:'fold_tray',x:512,y:0,w:288,h:224,paint:trayArt},
 {name:'fold_glass',x:800,y:0,w:128,h:128,paint:glassArt},
 {name:'fold_clip',x:800,y:128,w:128,h:96,paint:clipArt},
 {name:'fold_tools',x:0,y:800,w:224,h:224,paint:toolArt}
]};
function rgb(v){return [v[0]/255,v[1]/255,v[2]/255,1];}
function center(r,text,x,y,size,color){r.text(text,x-r.measureText(text,size)/2,y,size,color);}
function arrow(r,x1,y1,x2,y2,width,color){
 const dx=x2-x1,dy=y2-y1,n=Math.hypot(dx,dy);if(n<1)return;
 const ux=dx/n,uy=dy/n,head=Math.min(9,n*.4);
 r.line(x1,y1,x2,y2,width,color);r.line(x2,y2,x2-ux*head-uy*head*.7,y2-uy*head+ux*head*.7,width,color);r.line(x2,y2,x2-ux*head+uy*head*.7,y2-uy*head-ux*head*.7,width,color);
}
function dashed(r,x1,y1,x2,y2,color,width=2){
 const dx=x2-x1,dy=y2-y1,n=Math.hypot(dx,dy);if(!n)return;
 for(let start=0;start<n;start+=13){const end=Math.min(n,start+7);r.line(x1+dx*start/n,y1+dy*start/n,x1+dx*end/n,y1+dy*end/n,width,color);}
}
function outline(r,x,y,w,h,color,width=1.5){r.line(x,y,x+w,y,width,color);r.line(x+w,y,x+w,y+h,width,color);r.line(x+w,y+h,x,y+h,width,color);r.line(x,y+h,x,y,width,color);}
function board(r,s,v,label){
 const size=v.cellSize,w=size*s.grid.cols,h=size*s.grid.rows;
 r.sprite('shadow',v.x+w/2,v.y+h/2+12,w+91,h+77,0,'#2d20255c');
 r.sprite('fold_tray',v.x+w/2,v.y+h/2,w+48,h+48,0,'#fff');
 r.rect(v.x,v.y,w,h,rgb(s.substrateColor));
 for(let x=0;x<=s.grid.cols;x++)r.line(v.x+x*size,v.y,v.x+x*size,v.y+h,1,'#80958b45');
 for(let y=0;y<=s.grid.rows;y++)r.line(v.x,v.y+y*size,v.x+w,v.y+y*size,1,'#80958b45');
 for(let x=0;x<s.grid.cols;x++)center(r,String(x+1),v.x+(x+.5)*size,v.y+h+7,9,'#6b7168');
 for(let y=0;y<s.grid.rows;y++)r.text(String(y+1),v.x+w+8,v.y+(y+.5)*size-5,9,'#6b7168');
 r.sprite('fold_clip',v.x-15,v.y-14,27,20.25,0,'#fff');r.sprite('fold_clip',v.x+w+15,v.y+h+12,27,20.25,Math.PI,'#fff');
 center(r,label,v.x+w/2,v.y-50,17,C.cream);
}
function glass(r,v,col,row,color,width=1,height=1,alpha=1){
 const size=v.cellSize,x=v.x+col*size,y=v.y+row*size,w=width*size,h=height*size;
 if(w<.15||h<.15)return;
 r.rect(x,y,w,h,[color[0]/255,color[1]/255,color[2]/255,alpha]);r.sprite('fold_glass',x+w/2,y+h/2,w,h,0,'#fff');
}
function silhouette(r,v,cells){
 const occupied=new Set(cells.filter(c=>c.color).map(c=>c.col+','+c.row)),k=v.cellSize;
 cells.forEach(c=>{if(!c.color)return;const x=v.x+c.col*k,y=v.y+c.row*k;
  if(!occupied.has((c.col-1)+','+c.row))r.line(x,y,x,y+k,1.4,'#344e55');
  if(!occupied.has((c.col+1)+','+c.row))r.line(x+k,y,x+k,y+k,1.4,'#344e55');
  if(!occupied.has(c.col+','+(c.row-1)))r.line(x,y,x+k,y,1.4,'#344e55');
  if(!occupied.has(c.col+','+(c.row+1)))r.line(x,y+k,x+k,y+k,1.4,'#344e55');
 });
}
function isMoving(c,fold){const coordinate=fold.axis==='x'?c.col:c.row;return fold.movingSide==='low'?coordinate<fold.at:coordinate>=fold.at;}
function currentGlass(r,s){
 const v=s.view.current,a=s.foldAnimation;
 if(s.mode!=='folding'||!a){s.cells.forEach(c=>{if(c.color)glass(r,v,c.col,c.row,c.color);});silhouette(r,v,s.cells);return;}
 const progress=Math.max(0,Math.min(1,a.progress)),factor=Math.cos(Math.PI*progress);
 const pieces=new Map(a.beforePieces.map(p=>[p.id,p])),pigments=new Map(s.palette.map(p=>[p.id,p.rgb]));
 function movingColor(cell){
  // Folded glass stays translucent. Collapse the public ordered stack into one
  // effective RGBA; the GPU then composites it over the stationary glass.
  const order=progress>.5?cell.layers.slice().reverse():cell.layers,weighted=[0,0,0];let alpha=0;
  order.forEach(id=>{const color=pigments.get(pieces.get(id).pigment);for(let channel=0;channel<3;channel++)weighted[channel]=weighted[channel]*(1-s.layerAlpha)+color[channel]*s.layerAlpha;alpha=alpha*(1-s.layerAlpha)+s.layerAlpha;});
  return{color:weighted.map(channel=>channel/alpha),alpha};
 }
 a.beforeCells.forEach(c=>{if(c.color&&!isMoving(c,a))glass(r,v,c.col,c.row,c.color);});
 a.beforeCells.forEach(c=>{if(!c.color||!isMoving(c,a))return;
  const col=a.axis==='x'?Math.min(a.at+(c.col-a.at)*factor,a.at+(c.col+1-a.at)*factor):c.col;
  const row=a.axis==='y'?Math.min(a.at+(c.row-a.at)*factor,a.at+(c.row+1-a.at)*factor):c.row;
  const tint=movingColor(c);glass(r,v,col,row,tint.color,a.axis==='x'?Math.abs(factor):1,a.axis==='y'?Math.abs(factor):1,tint.alpha);
 });
}
function crease(r,s){
 if(s.phase!=='playing')return;
 const v=s.view.current,k=v.cellSize,c=s.candidates[s.selectedIndex];if(!c)return;
 const good=c.valid||s.mode==='folding',color=good?'#916429':'#a25546',light=good?'#ffe2a8':'#ffd6c5';
 const n=c.axis==='x'?s.grid.cols:s.grid.rows,start=c.movingSide==='low'?0:c.at,end=c.movingSide==='low'?c.at:n;
 // All selection marks lie on cell boundaries or outside glass comparison centers.
 const x=v.x+(c.axis==='x'?start:0)*k,y=v.y+(c.axis==='y'?start:0)*k;
 const w=(c.axis==='x'?end-start:s.grid.cols)*k,h=(c.axis==='y'?end-start:s.grid.rows)*k;
 outline(r,x,y,w,h,light,3);outline(r,x,y,w,h,color,1);
 if(c.axis==='x'){
  const cx=v.x+c.at*k;dashed(r,cx,v.y-4,cx,v.y+s.grid.rows*k+4,'#fff4d7',4);dashed(r,cx,v.y-4,cx,v.y+s.grid.rows*k+4,color,2);
  arrow(r,cx+(c.movingSide==='low'?-37:37),v.y-17,cx+(c.movingSide==='low'?19:-19),v.y-17,3,light);
 }else{
  const cy=v.y+c.at*k;dashed(r,v.x-4,cy,v.x+s.grid.cols*k+4,cy,'#fff4d7',4);dashed(r,v.x-4,cy,v.x+s.grid.cols*k+4,cy,color,2);
  arrow(r,v.x-17,cy+(c.movingSide==='low'?-37:37),v.x-17,cy+(c.movingSide==='low'?19:-19),3,light);
 }
}
function selector(r,s){
 const x=s.view.current.x-24,y=405,w=s.grid.cols*s.view.current.cellSize+48;
 r.rect(x,y,w,129,'#2d302ee8');r.line(x,y,x+w,y,1,'#d4b386');
 r.text('DIRECTION',x+12,y+10,10,'#e6c99e');r.text('CREASE  1 / 2 / 3',x+110,y+10,10,'#c0cbc2');
 const vectors=[[1,0],[-1,0],[0,1],[0,-1]];
 vectors.forEach((v,row)=>{const cy=y+41+row*24;arrow(r,x+35-v[0]*9,cy-v[1]*9,x+35+v[0]*9,cy+v[1]*9,2.4,'#e5cd9e');});
 s.candidates.forEach(c=>{
  const bx=x+71+c.selectorCol*66,by=y+30+c.selectorRow*24,selected=c.id===s.selectedId,valid=c.valid||(selected&&s.mode==='folding');
  const fill=selected?(valid?'#e5c38c':'#cc9b85'):valid?'#57645e':'#3d4642';
  r.rect(bx,by,58,22,fill);if(selected)outline(r,bx,by,58,22,'#fff0cf',1.3);
  center(r,String(c.at),bx+29,by+2,16,selected?'#273b3c':valid?'#e2e6d5':'#8c9890');
  if(!valid){r.line(bx+47,by+5,bx+51,by+9,1,'#9c8274');r.line(bx+51,by+5,bx+47,by+9,1,'#9c8274');}
 });
}
function information(r,s){
 const x=s.view.target.x-24,y=405,w=s.grid.cols*s.view.target.cellSize+48,c=s.candidates[s.selectedIndex];
 r.rect(x,y,w,123,'#2d302ee8');r.line(x,y,x+w,y,1,'#d4b386');
 let heading='READY TO FOLD',line1='A / FLIP THE ARROW SIDE',line2='FLIPPING REVERSES LAYER ORDER',tone=C.cream;
 if(s.phase==='won'){heading='WINDOW COMPLETE';line1='COLOR + OUTLINE MATCH';line2='ENTER / MAKE ANOTHER WINDOW';tone=C.teal;}
 else if(s.phase==='lost'){heading=s.lostReason==='timeout'?'TIME HAS RUN OUT':'CHECK LIMIT REACHED';line1='ENTER / START A NEW WORK';line2='COMPARE BOTH SHAPE AND COLOR';tone=C.coral;}
 else if(s.mode==='folding'){heading='FOLD IN MOTION';line1='WAIT FOR THE GLASS TO SETTLE';line2='NEXT / COMPARE THE SETTLED COLORS';}
 else if(s.mode==='review'){heading='CHECK DID NOT MATCH';line1='B / UNDO AND CORRECT';line2='TIME AND FAILED CHECKS STAY USED';tone=C.coral;}
 else if(c&&!c.valid){heading='THIS FOLD IS BLOCKED';line1='START WITH GLASS ON BOTH SIDES';line2='MIRROR MUST STAY IN THE FRAME';tone=C.coral;}
 r.text(heading,x+14,y+12,16,tone);r.text(line1,x+14,y+42,11,'#e0dfc9');r.text(line2,x+14,y+62,9,'#b4c2b8');
 r.line(x+14,y+82,x+w-14,y+82,1,'#687369');
 const tail=s.phase==='playing'?'B / UNDO '+(s.canUndo?'AVAILABLE':'NOT YET AVAILABLE'):'MATERIAL / '+s.materialArea+' PIECES';
 r.text(tail,x+14,y+94,10,'#d5bc96');
}
function scene(r,s){
 r.sprite('fold_wood',480,270,960,540,0,'#fff');r.sprite('glow',480,200,1080,810,0,'#edc99a23');
 r.rect(0,0,960,47,'#292b2ceb');r.line(0,47,960,47,1,'#b99560');
 r.text('GLASS FOLD',27,15,20,C.cream);r.text('STAINED GLASS ATELIER / '+String(s.level).padStart(2,'0'),679,21,10,'#bfc9bd');
 board(r,s,s.view.current,'CURRENT');board(r,s,s.view.target,'TARGET');
 currentGlass(r,s);s.target.cells.forEach(c=>glass(r,s.view.target,c.col,c.row,c.color));silhouette(r,s.view.target,s.target.cells);crease(r,s);
 center(r,'MATCH',476,217,11,'#f4deb8');arrow(r,455,244,498,244,2.5,'#ebcb98');
 center(r,'COLOR',476,266,9,'#cfbca1');center(r,'+ OUTLINE',476,283,9,'#cfbca1');
 r.sprite('fold_tools',477,456,94,94,0,'#fff');
 selector(r,s);information(r,s);
}
root.GameDef={
 id:'glass-fold',title:'折光工坊',tagline:'一折一层，让颜色与轮廓恰好相逢',seed:173,
 accent:'#dfbc87',background:'#5e493a',levelLabel:'作品',levelNames:['晨光','暮色','琉璃'],atlas,
 description:'对照右侧目标，折叠左侧彩片。上下选翻折方向，左右选折线，A 折叠，B 撤销。翻面会颠倒叠放顺序。用完本轮折数后自动检查轮廓和颜色；撤销不退时间或错误次数。',
 controls:{move:'上下换翻折方向，左右选折线',a:'折叠 · 空格 / 确认 / 右上半屏',b:'撤销上一折 · B / 右下半屏'},actionLabels:['折叠','撤销'],
 tip:'箭头侧会翻向另一边，层序也会倒转。用完折数自动检查；不符按 B 撤销，时间和错误不回退。',
 winTitle:'花窗完成了',loseTitle:'再琢磨这道折痕',
 result(s){if(s.phase==='won')return '轮廓与颜色全部吻合！完成 '+s.foldsUsed+' 折，撤销 '+s.undoCount+' 次，剩余 '+Math.ceil(s.remaining)+' 秒。';if(s.lostReason==='timeout')return '90 秒已到。先看箭头侧，再按目标轮廓安排折线；最后一折也要留出翻折时间。';return '已用尽 '+s.maxMismatches+' 次检查机会。再次开始后，可用 B 撤销修正；错误次数不会退回。';},
 hud(s){const modes={editing:'选择折线',folding:'正在翻折',review:'需撤销修正'};return[
  {label:'可折次数',value:s.foldsRemaining+' / '+s.foldLimit,tone:s.foldsRemaining===0?'warn':''},
  {label:'当前阶段',value:s.phase==='won'?'花窗完成':s.phase==='lost'?'本轮结束':modes[s.mode]},
  {label:'容错剩余',value:Math.max(0,s.maxMismatches-s.mismatches)+' 次',tone:s.maxMismatches-s.mismatches<2?'warn':''},
  {label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s',tone:s.remaining<15?'warn':''}
 ];},
 render(r,s){scene(r,s);}
};

})(window);
