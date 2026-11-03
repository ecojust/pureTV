(function(root){
'use strict';
const C={bg:'#e7ddd0',ink:'#333e43',muted:'#6f7370',cream:'#fff4d8',gold:'#c68d3b',blue:'#457d8a',wood:'#785140'},config=root.PureModel.config;
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
const atlas={builtins:[],tiles:[
 {name:'woodFrame',x:0,y:0,w:384,h:384,paint(c,w,h,art){
  round(c,3,3,378,378,22,art.linear(c,0,0,384,384,[[0,'#b58b62'],[.35,'#806046'],[1,'#5b3d33']]),'#c7a580');
  for(let i=7;i<384;i+=13){c.strokeStyle='#efd4a51b';c.beginPath();c.moveTo(i,10);c.bezierCurveTo(i-9,120,i+11,260,i,374);c.stroke();}
  round(c,16,16,352,352,11,'#a17c56','#d0ae7c');round(c,24,24,336,336,7,'#2d4143','#503b2f');
  [[13,13],[371,13],[13,371],[371,371]].forEach(([x,y])=>{c.fillStyle='#d1ad6f';c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();});
 }},
 {name:'ceramic',x:384,y:0,w:128,h:128,paint(c,w,h,art){
  round(c,6,9,116,115,10,'#15282b70');round(c,5,4,116,116,10,art.linear(c,0,4,115,120,[[0,'#fffcee'],[.4,'#ede3c8'],[1,'#b5ac95']]),'#9b937d');
  round(c,12,10,101,101,6,'#f9f3dd','#fefbf0');c.fillStyle='#ffffffaa';c.fillRect(19,16,86,3);c.strokeStyle='#c7bc9e';c.lineWidth=1;c.strokeRect(20,22,85,80);
  c.strokeStyle='#b9c9c166';c.beginPath();c.moveTo(23,96);c.quadraticCurveTo(44,86,61,96);c.quadraticCurveTo(82,106,103,96);c.stroke();
 }},
 {name:'emptyCell',x:512,y:0,w:128,h:128,paint(c,w,h,art){
  round(c,5,5,118,118,9,art.linear(c,0,0,128,128,[[0,'#20383e'],[1,'#3b555a']]),'#a7a188');c.strokeStyle='#90a8a144';c.lineWidth=1;c.strokeRect(15,15,98,98);
  c.strokeStyle='#d5d5b8';c.lineWidth=4;c.beginPath();c.moveTo(64,33);c.lineTo(64,95);c.moveTo(33,64);c.lineTo(95,64);c.moveTo(54,43);c.lineTo(64,33);c.lineTo(74,43);c.moveTo(54,85);c.lineTo(64,95);c.lineTo(74,85);c.moveTo(43,54);c.lineTo(33,64);c.lineTo(43,74);c.moveTo(85,54);c.lineTo(95,64);c.lineTo(85,74);c.stroke();
 }}]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(26,20,908,44,C.wood);text(r,'SLIDING ORDER',45,29,28,C.cream);text(r,config.layouts[s.level].name,565,30,25,'#e4cbae');
 const left=75,top=95,cell=118;
 r.sprite('woodFrame',left+177,top+177,406,406,0,'#ffffff');
 s.board.forEach((value,index)=>{const x=left+(index%3)*cell+59,y=top+Math.floor(index/3)*cell+59;
  r.sprite(value?'ceramic':'emptyCell',x,y,116,116,0,'#ffffff');
  if(value){center(r,value,x,y-31,61,value===index+1?C.blue:C.ink);if(value===index+1){r.line(x+30,y+35,x+36,y+41,3,C.blue);r.line(x+36,y+41,x+47,y+27,3,C.blue);}}
  else outline(r,x-55,y-55,110,110,'#e7bf6a',3);
 });
 text(r,'TARGET',532,87,24,C.muted);
 const mx=533,my=121,ms=48;
 config.goal.forEach((v,i)=>{const x=mx+(i%3)*ms,y=my+Math.floor(i/3)*ms;r.rect(x,y,44,44,v?'#f8f2de':'#3b555a');if(v)center(r,v,x+22,y+7,30,C.blue);});
 text(r,'EMPTY',728,124,23,C.muted);text(r,'ROW '+(Math.floor(s.blank/3)+1),728,157,26,C.ink);text(r,'COL '+(s.blank%3+1),728,192,26,C.ink);
 r.rect(532,281,352,2,'#b9ad97');text(r,'SLIDES',532,301,24,C.muted);text(r,s.movesUsed+' / '+s.moveLimit,714,296,34,C.ink);
 text(r,'IN PLACE',532,346,24,C.muted);text(r,s.matched+' / 8',745,342,30,C.blue);
 text(r,'UNDO DEPTH '+s.history.length,532,392,24,C.muted);text(r,'USED '+s.undos,770,392,24,C.muted);
 r.rect(532,436,352,40,'#d2c8b1');center(r,'A UNDO / NO REFUND',708,445,24,C.ink);
 text(r,'ARROWS MOVE THE EMPTY CELL',75,499,25,C.ink);text(r,'1 2 3 / 4 5 6 / 7 8 _',587,501,23,C.muted);
}
root.GameDef={id:'sliding-order',title:'滑格归序',seed:config.defaultSeed,tagline:'留一格余地，让数字各归其位',accent:'#e7bf6a',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'排布',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['撤销一步'],
 description:'方向键移动空格，与相邻瓷砖交换。把数字按 1–8 排好，让空格留在右下角。每次实际滑动消耗一步；A 可撤销，但已用步数不会退还。最后一步归位仍可获胜。',
 controls:{move:'方向键移动空格，一按一格',a:'空格、Z、确认 / 手机右区：撤销一步',b:'B 无游戏动作；R 重试，P 暂停'},
 tip:'箭头控制空格，不是数字。右侧小图是目标；蓝色数字已归位。A 撤销不退步数，触碰边缘不扣步。长按不连动，额度用完仍未归位则结束。',
 winTitle:'瓷砖归位，排布完成',loseTitle:'滑动额度已用完',
 hud:s=>[{label:'剩余滑动',value:s.moveLimit-s.movesUsed},{label:'数字归位',value:s.matched+' / 8',tone:'good'},{label:'可撤销',value:s.history.length},{label:'空格位置',value:(Math.floor(s.blank/3)+1)+' 行 '+(s.blank%3+1)+' 列'}],
 result:s=>'已用 '+s.movesUsed+' / '+s.moveLimit+' 步，撤销 '+s.undos+' 次。'+(s.phase==='won'?'数字和空格均已归位。':'重新开始，试着为转角预留空格。'),render};
})(window);
