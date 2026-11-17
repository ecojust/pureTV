(function(root){
'use strict';
const C={bg:'#101f32',field:'#172e45',ink:'#f6e9d2',muted:'#9db7c5',gold:'#efbe73',cyan:'#7ed8d9',coral:'#e79f82'},config=root.PureModel.config;
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
const atlas={builtins:[],tiles:[
 {name:'glassBrick',x:0,y:0,w:256,h:80,paint(c,w,h,art){round(c,1,1,254,78,9,art.linear(c,0,0,0,80,[[0,'#fcf8e8'],[.3,'#e2e7df'],[1,'#8ca8b1']]),'#365a6c');round(c,6,5,244,66,5,'#eef2e6','#fefbf0');c.fillStyle='#ffffff';c.fillRect(13,10,229,4);c.fillStyle='#587f8c55';c.fillRect(13,61,229,3);c.strokeStyle='#7b989b77';c.beginPath();c.moveTo(28,20);c.lineTo(18,54);c.moveTo(236,20);c.lineTo(226,54);c.stroke();}},
 {name:'paddle',x:256,y:0,w:256,h:48,paint(c,w,h,art){round(c,1,1,254,46,22,art.linear(c,0,0,0,48,[[0,'#fff9dd'],[.45,'#87d4d3'],[1,'#2f6a8d']]),'#c2f0dd');c.fillStyle='#f7ffeb';c.fillRect(28,6,200,4);round(c,96,12,64,25,7,'#274b63','#a6d7d3');c.fillStyle='#efc574';for(let x=109;x<148;x+=10)c.fillRect(x,19,4,10);}},
 {name:'ball',x:512,y:0,w:96,h:96,paint(c,w,h,art){art.ellipse(c,48,48,47,47,art.radial(c,48,48,47,[[0,'#efc57477'],[.7,'#efc57422'],[1,'#efc57400']]));art.ellipse(c,48,48,31,31,art.radial(c,48,48,32,[[0,'#fffbe5'],[.35,'#ffe4a4'],[1,'#c9914b']],37,34));art.ellipse(c,37,34,8,6,'#fffdec');}},
 {name:'court',x:0,y:800,w:640,h:192,paint(c,w,h,art){c.fillStyle=art.linear(c,0,0,640,192,[[0,'#203f57'],[.6,'#172f48'],[1,'#11283e']]);c.fillRect(0,0,640,192);c.strokeStyle='#7ba8ba14';c.lineWidth=1;for(let x=0;x<640;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,192);c.stroke();}for(let y=0;y<192;y+=16){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}for(let n=0;n<40;n++){c.fillStyle='#b8e0df33';c.fillRect((n*139)%638,(n*71)%190,1,1);}}}
]};
function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||C.ink);}
function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
function outline(r,x,y,w,h,color,t){r.rect(x,y,w,t,color);r.rect(x,y+h-t,w,t,color);r.rect(x,y,t,h,color);r.rect(x+w-t,y,t,h,color);}
function render(r,s){
 r.rect(0,0,960,540,C.bg);text(r,'BRICK PADDLE',28,19,29,C.ink);text(r,config.layouts[s.level].name,425,23,23,C.cyan);
 const ox=25,oy=65;r.sprite('court',ox+360,oy+225,720,450,0,'#ffffff');
 r.rect(ox-4,oy-4,728,4,'#96bebd');r.rect(ox-4,oy,4,450,'#527d93');r.rect(ox+720,oy,4,450,'#527d93');
 for(let x=0;x<720;x+=24)r.rect(ox+x,oy+447,13,3,'#d5937555');
 for(const brick of s.bricks){if(!brick.hp)continue;const colors=[C.cyan,C.gold,C.coral,'#a6c49b','#9fbadb'];const color=colors[brick.id%colors.length];
  r.sprite('glassBrick',ox+brick.x+brick.w/2,oy+brick.y+brick.h/2,brick.w,brick.h,0,color);center(r,brick.hp,ox+brick.x+brick.w/2,oy+brick.y+3,22,'#204152');
  if(brick.hp>1)outline(r,ox+brick.x+2,oy+brick.y+2,brick.w-4,brick.h-4,'#fff0bb',2);
 }
 const p=s.paddle,b=s.ball;r.sprite('paddle',ox+p.x,oy+p.y+p.height/2,p.width,p.height,0,'#ffffff');
 if(!b.attached){r.circle(ox+b.x-b.vx*.025,oy+b.y-b.vy*.025,5,'#e5c18335');r.circle(ox+b.x-b.vx*.012,oy+b.y-b.vy*.012,6,'#e5c18355');}
 r.sprite('ball',ox+b.x,oy+b.y,24,24,0,'#ffffff');
 if(b.attached&&s.phase==='playing'){center(r,'A TO LAUNCH',ox+360,oy+271,30,C.ink);center(r,'MOVE FIRST, THEN SERVE',ox+360,oy+314,20,C.muted);}
 r.rect(766,65,170,450,'#203c50');text(r,'BRICKS LEFT',779,81,21,C.muted);center(r,s.remaining,851,113,50,C.ink);
 text(r,'LIVES',779,185,22,C.muted);for(let i=0;i<3;i++){r.sprite('ball',801+i*43,232,30,30,0,i<s.lives?'#ffffff':'#314d60');}
 text(r,'HITS '+s.hits,779,273,25,C.cyan);text(r,'2 = TWO HITS',779,312,18,C.muted);
 text(r,'OFFSET STEERS',779,355,18,C.gold);
 r.rect(800,419,104,9,C.cyan);r.circle(823,412,5,C.gold);r.circle(881,412,5,C.gold);
 r.line(823,407,802,382,2,C.gold);r.line(881,407,901,382,2,C.gold);r.line(802,382,803,392,2,C.gold);r.line(802,382,812,385,2,C.gold);r.line(901,382,891,385,2,C.gold);r.line(901,382,899,392,2,C.gold);
 center(r,b.attached?'PRESS A':'LEFT / RIGHT',851,459,20,C.ink);center(r,b.attached?'TO SERVE':'HOLD TO MOVE',851,489,18,C.muted);
}
root.GameDef={id:'brick-paddle',title:'弹板清砖',seed:config.defaultSeed,tagline:'接住每次回弹，把砖墙逐块击破',accent:C.cyan,background:C.bg,atlas,holdConfirmAsA:true,levelLabel:'砖阵',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['发球'],
 description:'左右持续移动弹板，A 发球。击中弹板不同位置会改变反弹角度；标有 2 的砖需要两次命中。清空全部砖即可获胜，漏接三次则结束，没有倒计时。',
 controls:{move:'持续按左右移动弹板',a:'空格、Z、确认 / 手机右区：发球',b:'B 无游戏动作；P 暂停，R 重试'},
 tip:'撞到弹板中部会近乎直上，边缘会更斜。数字是砖块剩余耐久。漏接后球回到弹板，先松开再按 A 重新发球；按住不会连发。',
 winTitle:'砖墙清空，回弹成功',loseTitle:'三次接球机会已用完',
 hud:s=>[{label:'剩余砖块',value:s.remaining},{label:'剩余机会',value:s.lives},{label:'有效命中',value:s.hits,tone:'good'},{label:'球状态',value:s.phase!=='playing'?'本局结束':s.ball.attached?'等待发球':'飞行中'}],
 result:s=>'击中砖块 '+s.hits+' 次，发球 '+s.launches+' 次。'+(s.phase==='won'?'全部砖块均已清空。':'左右提前接球，再试一次。'),render};
})(window);
