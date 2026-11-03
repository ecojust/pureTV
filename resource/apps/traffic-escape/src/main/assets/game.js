(function(root){
'use strict';
const C={bg:'#e9e5d9',ink:'#213744',muted:'#677981',road:'#29434e',line:'#55717b',yellow:'#f2cd70',cursor:'#73e2df'},config=root.PureModel.config;
function rounded(c,x,y,w,h,r,fill,stroke,width){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width||2;c.stroke();}}
function vehicle(c,w,h,art,long){
 rounded(c,9,12,w-18,h-15,21,'#132b3555');
 c.fillStyle='#233944';for(const x of [35,w-60]){c.fillRect(x,3,26,14);c.fillRect(x,h-17,26,14);}
 rounded(c,7,13,w-14,h-26,19,art.linear(c,0,0,0,h,[[0,'#ffffff'],[.48,'#e3edf0'],[1,'#9cbbc5']]),'#3b5864',3);
 rounded(c,long?77:62,24,long?w-157:w-123,h-48,10,'#dce8eb','#8caab6',2);
 rounded(c,31,25,25,h-50,7,'#315261');rounded(c,w-58,25,25,h-50,7,'#315261');
 c.fillStyle='#fff9c4';c.fillRect(w-15,25,6,14);c.fillRect(w-15,h-39,6,14);c.fillStyle='#ee947b';c.fillRect(8,27,5,12);c.fillRect(8,h-39,5,12);
 c.strokeStyle='#ffffff77';c.lineWidth=2;c.beginPath();c.moveTo(70,20);c.lineTo(w-70,20);c.stroke();
 if(long){c.strokeStyle='#7393a0';c.lineWidth=3;for(let x=107;x<w-100;x+=30){c.beginPath();c.moveTo(x,30);c.lineTo(x,h-30);c.stroke();}}
}
const atlas={builtins:[],tiles:[
 {name:'car',x:0,y:0,w:256,h:112,paint(c,w,h,art){vehicle(c,w,h,art,false);}},
 {name:'truck',x:256,y:0,w:384,h:112,paint(c,w,h,art){vehicle(c,w,h,art,true);}},
 {name:'asphalt',x:0,y:128,w:128,h:128,paint(c,w,h){c.fillStyle='#29434e';c.fillRect(0,0,w,h);for(let y=4;y<h;y+=11)for(let x=6;x<w;x+=13){c.fillStyle=(x+y)%3?'#ffffff08':'#071f2b20';c.fillRect(x,y,2,2);}c.strokeStyle='#aac2bc20';c.lineWidth=2;c.strokeRect(1,1,126,126);}},
 {name:'routeSeal',x:256,y:128,w:128,h:128,paint(c,w,h){c.strokeStyle='#657f8530';c.lineWidth=8;c.setLineDash([14,9]);c.beginPath();c.arc(64,64,47,0,Math.PI*2);c.stroke();c.setLineDash([]);c.strokeStyle='#657f8544';c.lineWidth=6;c.beginPath();c.moveTo(27,65);c.lineTo(93,65);c.moveTo(77,48);c.lineTo(94,65);c.lineTo(77,82);c.stroke();}}
]};
const palette=['#d87865','#9bc6ca','#e8cb8a','#aac59a','#a9bddd','#d9b2ca','#d2c9a3','#96bdaf','#b9b4da','#c7ad90'];
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function arrow(r,x,y,dx,dy,color,width){r.line(x-dx*9,y-dy*9,x+dx*9,y+dy*9,width,color);r.line(x+dx*9,y+dy*9,x+dx*2-dy*6,y+dy*2+dx*6,width,color);r.line(x+dx*9,y+dy*9,x+dx*2+dy*6,y+dy*2-dx*6,width,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.sprite('routeSeal',855,465,130,130,0,'#ffffff');
 r.rect(24,18,912,44,C.ink);text(r,'TRAFFIC ESCAPE',43,26,28,'#fff6d9');text(r,config.layouts[s.level].name,591,29,25,'#b9d6dc');
 const left=65,top=92,cell=64,end=left+384,gateY=top+2*cell;
 r.rect(left-9,top-9,402,402,'#789092');r.rect(end-1,gateY+4,111,56,'#4f747a');
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)r.sprite('asphalt',left+x*cell+32,top+y*cell+32,64,64,0,'#ffffff');
 r.rect(left-7,top-7,7,398,C.ink);r.rect(left-7,top-7,398,7,C.ink);r.rect(left-7,top+384,398,7,C.ink);
 r.rect(end,top-7,7,135,C.ink);r.rect(end,gateY+64,7,199,C.ink);
 for(let x=end+10;x<end+105;x+=24){r.rect(x,gateY+5,14,3,C.yellow);r.rect(x,gateY+56,14,3,C.yellow);}
 arrow(r,end+80,gateY+32,1,0,C.yellow,4);center(r,'EXIT',end+57,gateY-34,27,C.ink);
 for(let x=0;x<6;x++)center(r,String.fromCharCode(65+x),left+x*cell+32,66,23,C.muted);
 for(let y=0;y<6;y++)center(r,y+1,39,top+y*cell+20,23,C.muted);
 for(const c of s.cars){
  const horizontal=c.axis==='H',cx=left+(c.x+(horizontal?c.length/2:.5))*cell,cy=top+(c.y+(horizontal?.5:c.length/2))*cell;
  const length=c.length*cell-10,bw=horizontal?length:54,bh=horizontal?54:length;
  if(s.selected===c.id)outline(r,cx-bw/2-3,cy-bh/2-3,bw+6,bh+6,C.yellow,3);
  r.sprite(c.length===3?'truck':'car',cx,cy,length,58,horizontal?0:Math.PI/2,palette[c.id%palette.length]);
  r.circle(cx,cy,16,'#fff6d9');center(r,c.id+1,cx,cy-13,26,'#233b48');
  if(c.target){arrow(r,cx+40,cy,1,0,'#fff9e1',4);r.rect(cx-42,cy-18,5,36,'#fff9e1');}
  else{const dx=horizontal?1:0,dy=horizontal?0:1;arrow(r,cx+dx*(length/2-23),cy+dy*(length/2-23),dx,dy,'#274856',2);arrow(r,cx-dx*(length/2-23),cy-dy*(length/2-23),-dx,-dy,'#274856',2);}
 }
 const cursorX=left+s.cursor%6*cell,cursorY=top+Math.floor(s.cursor/6)*cell;
 outline(r,cursorX+2,cursorY+2,60,60,C.cursor,s.selected===null?3:2);
 r.rect(591,86,345,393,'#f9f5e7');text(r,'SLIDES USED',611,101,25,C.muted);text(r,s.movesUsed+' / '+s.moveLimit,611,137,49,C.ink);
 r.rect(610,204,307,2,'#c2c9bc');text(r,'UNDO TICKETS',611,222,24,C.muted);
 for(let i=0;i<3;i++){r.rect(815+i*32,223,24,24,i<s.undoTokens?C.yellow:'#d8d9cd');center(r,'B',827+i*32,225,19,i<s.undoTokens?'#4e4937':'#a5aca2');}
 const selected=s.selected===null?null:s.cars[s.selected];
 text(r,selected?'CAR '+(selected.id+1)+' / '+(selected.axis==='H'?'HORIZONTAL':'VERTICAL'):'CURSOR MODE',611,279,25,C.ink);
 text(r,selected?(selected.axis==='H'?'LEFT / RIGHT TO SLIDE':'UP / DOWN TO SLIDE'):'ARROWS MOVE CURSOR',611,317,23,C.muted);
 r.rect(611,357,305,46,selected?C.ink:'#456876');center(r,s.phase==='playing'?(selected?'A RELEASE VEHICLE':'A SELECT VEHICLE'):s.phase==='won'?'EXIT COMPLETE':'BUDGET EXHAUSTED',763,369,25,'#fff6d9');
 text(r,'B UNDO - NO REFUND',611,427,23,C.ink);
 text(r,'1 + WHITE ARROW = TARGET',28,505,23,C.ink);text(r,'ONE CELL / ONE SLIDE',589,505,23,C.muted);
}
root.GameDef={id:'traffic-escape',title:'车阵出口',seed:config.defaultSeed,tagline:'挪开车阵，让 1 号车驶出出口',accent:'#edc875',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'车阵',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选车 / 放下','撤回（不退步数）'],
 description:'在 6×6 车阵中为 1 号红车腾出通道。方向键选格，A 选车后只能沿车身轴向逐格滑动，再按 A 放下。只有带白色箭头的 1 号车能从第三行右侧出口驶离。每关三张撤回票，撤回不会退还已用步数。',
 controls:{move:'未选车时移动光标；选车后沿车身方向逐格滑动',a:'空格、Z、确认 / 手机右上：选车或放下',b:'X、B / 手机右下：撤回一步并放下，不退步数'},
 tip:'青框是格子光标，金框是选中的车辆。车身箭头标示移动轴向。无效方向和碰撞不耗步数；每次成功移一格耗一步。1 号车贴住右侧出口后，再向右一次就驶离。',
 winTitle:'出口畅通，车辆驶离',loseTitle:'移车额度已用完',
 hud:s=>[{label:'已用步数',value:s.movesUsed+' / '+s.moveLimit},{label:'撤回票',value:s.undoTokens+' / 3',tone:s.undoTokens?'good':'warn'},{label:'当前模式',value:s.selected===null?'光标选车':(s.selected+1)+' 号移车'},{label:'目标',value:'1 号车右出'}],
 result:s=>s.phase==='won'?'1 号车已驶出，共用 '+s.movesUsed+' 步，使用 '+s.undos+' 张撤回票。':'本关 '+s.moveLimit+' 步额度已用完。撤回不退步数，尝试先给挡路车辆留出空间。',render};
})(window);
