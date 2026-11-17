(function(root){
'use strict';
const C={bg:'#e5e5d0',ink:'#22433f',muted:'#60786b',paper:'#f6f2db',green:'#71965d',deep:'#385d45',gold:'#b8873d',rose:'#a94d61'},config=root.PureModel.config;
const atlas={builtins:[],tiles:[
 {name:'golfGrass',x:0,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#8baa70'],[1,'#658850']]);c.fillRect(0,0,w,h);c.fillStyle='#e9f0ab15';for(let x=0;x<w;x+=32)c.fillRect(x,0,16,h);c.strokeStyle='#365f3922';c.lineWidth=1;for(let y=12;y<h;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}}},
 {name:'golfBlock',x:128,y:0,w:128,h:128,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,w,h,[[0,'#bba56a'],[1,'#8a733d']]);c.fillRect(0,0,w,h);c.strokeStyle='#dcc992';c.lineWidth=6;c.strokeRect(4,4,w-8,h-8);c.strokeStyle='#574b2e55';c.lineWidth=2;for(let y=24;y<128;y+=28){c.beginPath();c.moveTo(10,y);c.lineTo(118,y);c.stroke();}}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function fit(r,t,x,y,width,size,color){text(r,t,x,y,Math.min(size,width/r.measureText(String(t),1)),color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);r.rect(24,18,912,44,C.ink);text(r,'POCKET GOLF',42,26,28,'#fff7dc');fit(r,config.layouts[s.level].name,601,29,318,25,'#d1dfba');
 const scale=.82,left=35,top=110,w=config.fieldWidth*scale,h=config.fieldHeight*scale,point=(x,y)=>({x:left+x*scale,y:top+y*scale});
 r.rect(left-9,top-9,w+18,h+18,'#5a6d43');r.rect(left-5,top-5,w+10,h+10,'#b6bc8a');r.sprite('golfGrass',left+w/2,top+h/2,w,h,0,'#ffffff');outline(r,left,top,w,h,'#e1e4b1',3);
 const start=point(config.layouts[s.level].start.x,config.layouts[s.level].start.y);r.circle(start.x,start.y,11,'#dbe8af44');r.line(start.x-7,start.y,start.x+7,start.y,2,'#e8edc799');r.line(start.x,start.y-7,start.x,start.y+7,2,'#e8edc799');
 for(const o of s.obstacles){const p=point(o.x,o.y);r.rect(p.x+4,p.y+5,o.w*scale,o.h*scale,'#28462f66');r.sprite('golfBlock',p.x+o.w*scale/2,p.y+o.h*scale/2,o.w*scale,o.h*scale,0,'#ffffff');outline(r,p.x,p.y,o.w*scale,o.h*scale,'#5d5d37',2);}
 for(let i=0;i<s.trail.length;i+=2){const p=point(s.trail[i].x,s.trail[i].y);r.circle(p.x,p.y,1.8,'#f6f4d466');}
 const cup=point(s.cup.x,s.cup.y);r.circle(cup.x,cup.y,s.cup.radius*scale+2,'#c9d39a');r.circle(cup.x,cup.y,s.cup.radius*scale,'#244331');r.circle(cup.x,cup.y,s.cup.captureRadius*scale,'#102b25');r.line(cup.x,cup.y,cup.x,cup.y-44,2,'#f7edd1');r.line(cup.x+2,cup.y-42,cup.x+24,cup.y-34,5,'#f2bd66');r.line(cup.x+24,cup.y-34,cup.x+2,cup.y-27,5,'#e5a04e');
 const ball=point(s.ball.x,s.ball.y),theta=s.angleIndex*config.angleStep*Math.PI/180;
 if(!s.ball.moving&&s.phase==='playing'){
  const distance=50+s.power*10;for(let t=17;t<distance;t+=11){const x=s.ball.x+Math.cos(theta)*t,y=s.ball.y+Math.sin(theta)*t;if(x>=8&&x<=712&&y>=8&&y<=442){const p=point(x,y);r.circle(p.x,p.y,2.1,'#fff5c3');}}
  // Direction cue follows the selected angle; it is not a simulated trajectory.
  const back=point(s.ball.x-Math.cos(theta)*19,s.ball.y-Math.sin(theta)*19),far=point(s.ball.x-Math.cos(theta)*36,s.ball.y-Math.sin(theta)*36);if(far.x>=left&&far.x<=left+w&&far.y>=top&&far.y<=top+h){r.line(back.x,back.y,far.x,far.y,3,'#293f37');r.line(back.x-Math.sin(theta)*6,back.y+Math.cos(theta)*6,back.x+Math.sin(theta)*6,back.y-Math.cos(theta)*6,4,'#e0cb92');}
 }
 r.circle(ball.x+2,ball.y+3,s.ball.radius*scale+1,'#243f3a55');r.circle(ball.x,ball.y,s.ball.radius*scale,'#fffbea');r.circle(ball.x-2,ball.y-2,2,'#ffffff');
 fit(r,'LEFT / RIGHT AIM  |  UP / DOWN POWER',32,77,600,22,C.muted);fit(r,'A HIT WHEN STILL',32,506,570,25,C.ink);
 r.rect(651,84,285,408,C.paper);fit(r,s.ball.moving?'BALL ROLLING':'READY TO PUTT',670,99,247,25,s.ball.moving?C.rose:C.deep);
 text(r,'STROKES',670,140,22,C.muted);fit(r,s.strokes+' / '+s.strokeLimit,670,171,247,38,C.ink);
 text(r,'ANGLE',670,224,22,C.muted);fit(r,s.angleIndex*config.angleStep+' DEG',770,221,147,27,C.ink);
 text(r,'POWER',670,263,22,C.muted);for(let i=0;i<5;i++){r.rect(670+i*50,297,42,18,i<s.power?C.gold:'#d5d6b9');center(r,i+1,691+i*50,320,21,C.muted);}
 r.rect(670,354,247,2,'#c7cbb0');const speed=Math.round(Math.hypot(s.ball.vx,s.ball.vy));fit(r,'SPEED '+speed,670,370,247,27,C.ink);fit(r,'CUP: SPEED <= 65',670,409,247,23,C.muted);fit(r,'SLOW BALL WINS',670,446,247,22,C.deep);
 fit(r,'LOW SPEED INTO THE CUP',651,506,285,22,C.muted);
}
root.GameDef={id:'pocket-golf',title:'口袋果岭',seed:config.defaultSeed,tagline:'调角、控力，借墙绕障后轻推入杯',accent:'#d2b76e',background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'球洞',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['击球','未使用'],
 description:'静止时选择角度和五档力度，再击球。球会真实滚动、受到摩擦减速，并在边墙和石障反弹。球心进入杯口的内圈且速度不超过65才进洞；高速掠过无效。限定杆数内入杯，最后一杆仍能获胜。',
 controls:{move:'静止时左/右调5度，上/下调力度；0度向右，90度向下',a:'空格、Z、确认 / 手机右上：静止时击球；松开后才能再次按',b:'本游戏不使用 B'},
 tip:'瞄准点只表示方向和力度，不是自动路线。运动中按键不会排队到下一杆。球停稳后可以在新位置继续击球；杆数用完要等球停稳才判失败。回弹湾角和曲径花园的直线被石障阻挡，需要绕行或借墙。',
 winTitle:'轻球入杯，完成此洞',loseTitle:'杆数用完，球已停稳',
 hud:s=>[{label:'杆数',value:s.strokes+' / '+s.strokeLimit},{label:'角度',value:s.angleIndex*config.angleStep+'°'},{label:'力度',value:s.power+' / 5'},{label:'球速',value:Math.round(Math.hypot(s.ball.vx,s.ball.vy))}],
 result:s=>s.phase==='won'?'用 '+s.strokes+' 杆完成，实际入杯速度 '+s.capture.speed.toFixed(1)+'；本洞边墙反弹 '+s.wallHits+' 次、碰障 '+s.obstacleHits+' 次。':'最后一杆已经停稳，球尚未低速入杯。调整力度，利用反弹或先绕过石障后再推杆。',render};
})(window);
