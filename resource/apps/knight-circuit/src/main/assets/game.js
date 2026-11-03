(function(root){
'use strict';
const C={bg:'#102334',navy:'#102a40',ink:'#eff0da',muted:'#a5bac7',gold:'#efc574',blue:'#74c5d3',dark:'#24485b'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'courtCell',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,128,128,[[0,'#fffbea'],[1,'#d1d3c4']]);c.fillRect(0,0,128,128);c.fillStyle='#ffffff66';c.fillRect(2,2,124,3);c.fillRect(2,2,3,124);c.fillStyle='#344f5d33';c.fillRect(2,123,124,3);c.fillRect(123,2,3,124);}},
 {name:'knight',x:128,y:0,w:128,h:128,paint(c,w,h,art){
  art.ellipse(c,65,115,49,10,'#071b2955');
  art.path(c,[[35,104],[44,88],[48,66],[32,74],[17,60],[37,32],[52,25],[59,8],[68,28],[86,36],[100,57],[100,76],[91,100],[94,105]],art.linear(c,20,15,102,105,[[0,'#fffbea'],[.45,'#eee4bc'],[1,'#a7b6b0']]),'#163747',3);
  art.path(c,[[51,27],[43,43],[27,57],[32,63],[48,54],[61,56],[66,76],[56,100],[88,100],[96,73],[92,53],[79,40]],'#d0d5c3');
  c.fillStyle='#153d4c';c.beginPath();c.arc(52,40,4,0,Math.PI*2);c.fill();
  c.strokeStyle='#658d98';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(75+i*3,42+i*8);c.lineTo(84+i*2,40+i*8);c.stroke();}
  art.path(c,[[31,104],[98,104],[105,116],[23,116]],'#f2e4b7','#173a4a',3);c.fillStyle='#c7a967';c.fillRect(31,107,66,3);
 }},
 {name:'sealed',x:256,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle='#142d41';c.fillRect(0,0,128,128);c.strokeStyle='#486579';c.lineWidth=2;for(let i=-128;i<128;i+=18){c.beginPath();c.moveTo(i,0);c.lineTo(i+128,128);c.stroke();}c.strokeStyle='#99a9af';c.lineWidth=4;c.strokeRect(25,25,78,78);c.beginPath();c.moveTo(36,36);c.lineTo(92,92);c.moveTo(92,36);c.lineTo(36,92);c.stroke();}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function coord(s,c){return String.fromCharCode(65+c%s.width)+(Math.floor(c/s.width)+1);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,20,912,45,'#1b3d51');text(r,'KNIGHT CIRCUIT',43,29,28,C.ink);text(r,config.layouts[s.level].name,601,30,25,C.blue);
 const size=72,left=s.width===6?75:111,top=101,bw=s.width*size,bh=s.height*size;
 r.rect(left-13,top-13,bw+26,bh+26,'#69808a');r.rect(left-8,top-8,bw+16,bh+16,'#243d4c');
 for(let x=0;x<s.width;x++)center(r,String.fromCharCode(65+x),left+x*size+36,72,22,C.muted);
 for(let y=0;y<s.height;y++)center(r,y+1,left-31,top+y*size+24,23,C.muted);
 for(let cell=0;cell<s.width*s.height;cell++){
  const x=left+(cell%s.width)*size,y=top+Math.floor(cell/s.width)*size;
  if(s.blocked.includes(cell))r.sprite('sealed',x+36,y+36,size,size,0,'#ffffff');
  else{
   r.sprite('courtCell',x+36,y+36,size,size,0,(cell%s.width+Math.floor(cell/s.width))%2?'#a9bfca':'#ffffff');
   if(s.visited[cell]&&cell!==s.knight){r.circle(x+36,y+36,22,'#315e77');center(r,s.path.indexOf(cell)+1,x+36,y+23,27,'#f6f5df');}
   if(s.legalMoves.includes(cell)){r.circle(x+36,y+36,13,'#23546e');r.circle(x+36,y+36,7,C.gold);}
   if(cell===s.knight){r.sprite('knight',x+36,y+34,70,70,0,'#ffffff');}
  }
  if(cell===s.cursor)outline(r,x+2,y+2,size-4,size-4,C.gold,4);
 }
 text(r,'VISITED',565,98,24,C.muted);text(r,s.path.length+' / '+(s.path.length+s.remaining),731,90,36,C.ink);
 text(r,'REMAINING '+s.remaining,565,146,26,C.blue);
 r.rect(563,190,338,2,'#49687d');
 text(r,'KNIGHT '+coord(s,s.knight),565,211,27,C.ink);text(r,'CURSOR '+coord(s,s.cursor),565,250,27,C.gold);
 text(r,'LEGAL JUMPS '+s.legalMoves.length,565,289,25,C.muted);
 text(r,'UNDO TOKENS',565,333,24,C.muted);
 for(let i=0;i<3;i++){r.circle(591+i*55,388,18,i<s.undoTokens?C.blue:'#2c4556');if(i<s.undoTokens)center(r,'B',591+i*55,375,25,C.navy);}
 text(r,'USED '+s.undos,761,375,25,C.muted);
 r.rect(563,429,338,43,'#1e4157');center(r,s.phase==='won'?'TOUR COMPLETE':s.phase==='lost'?'NO JUMPS / NO UNDO':!s.legalMoves.length?'B TO RECOVER':'A JUMP / B UNDO',732,441,24,C.ink);
 text(r,'GOLD FRAME = CURSOR',74,500,23,C.gold);text(r,'NUMBERS = VISIT ORDER',548,500,23,C.muted);
}
root.GameDef={id:'knight-circuit',title:'马步巡游',seed:config.defaultSeed,tagline:'日字走遍棋盘，每一格只来一次',accent:C.gold,background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'棋庭',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['跳到光标','回退一跳'],
 description:'方向移动黄框，A 让马走日字跳到黄框。访问全部可走棋格，每格恰好一次，无需回到起点。B 消耗一枚回退券，撤回上一跳；每局只有三枚。',
 controls:{move:'方向键移动黄框，马暂不移动',a:'空格、Z、确认 / 手机右上：跳跃',b:'X、B / 手机右下：消耗一券回退'},
 tip:'黄框是光标，白马是当前位置，圆点是合法落点，数字是访问顺序。马可跨越留白格。无路时还能用 B 回退；三券用尽又无路则结束。长按不连动。',
 winTitle:'巡游完成，每格皆至',loseTitle:'前路与退路都已用尽',
 hud:s=>[{label:'已访问',value:s.path.length+' / '+(s.path.length+s.remaining),tone:'good'},{label:'合法落点',value:s.legalMoves.length},{label:'剩余回退券',value:s.undoTokens},{label:'当前马位',value:coord(s,s.knight)}],
 result:s=>'已访问 '+s.path.length+' 格，累计跳跃 '+s.jumps+' 次，回退 '+s.undos+' 次。'+(s.phase==='won'?'所有可走棋格均已完成。':'试着先处理落点较少的边角。'),render};
})(window);
