(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#e9e0d3',gold='#e6bd83',pileColors=['#bdacd7','#a9c5bc','#dcb891','#a6b6d8'];
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'orbittable',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#302940'],[1,'#172c3e']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#c7b6d222';c.lineWidth=1;for(var r=80;r<650;r+=90){c.beginPath();c.ellipse(297,313,r,r*.47,-.2,0,Math.PI*2);c.stroke();}
      c.fillStyle='#ead8b477';for(var star=0;star<43;star++){var x=(star*97+31)%960,y=(star*67+18)%540;c.fillRect(x,y,2,2);}
      poly(c,[[22,20],[937,20],[937,74],[22,74]],'#202435','#9c8c91');poly(c,[[30,92],[620,92],[620,493],[30,493]],'#171f3077','#766b87');
      poly(c,[[644,95],[930,95],[930,223],[644,223]],'#e4d7bc','#bcb198');poly(c,[[644,242],[930,242],[930,352],[644,352]],'#2d3048','#928895');
      poly(c,[[644,371],[930,371],[930,493],[644,493]],'#252d40','#928895');c.restore();
    }},
    {name:'meteor',x:640,y:0,w:144,h:96,paint:function(c,w,h,art){
      art.ellipse(c,72,82,62,11,'#0d142b66');poly(c,[[12,29],[40,9],[108,12],[133,34],[125,68],[94,84],[35,78],[8,57]],art.linear(c,15,10,125,83,[[0,'#fff9ed'],[.55,'#d6d6d6'],[1,'#818b9a']]),'#ebeee6');
      poly(c,[[12,29],[40,9],[48,28],[20,52],[8,57]],'#bac1c8');poly(c,[[108,12],[133,34],[111,49],[98,27]],'#f9f8e9');poly(c,[[20,52],[48,28],[98,27],[111,49],[94,69],[39,66]],'#f4f0e1');
      c.strokeStyle='#6e7c8e77';c.lineWidth=2;c.beginPath();c.moveTo(39,66);c.lineTo(35,78);c.moveTo(111,49);c.lineTo(125,68);c.stroke();
    }},
    {name:'orbitbase',x:784,y:0,w:144,h:64,paint:function(c,w,h,art){
      art.ellipse(c,72,44,65,15,'#101c3055');art.ellipse(c,72,32,64,20,art.linear(c,0,15,0,52,[[0,'#dac3a0'],[1,'#6e6b83']]));art.ellipse(c,72,26,63,17,'#4b536b');
      c.strokeStyle='#d6bc8c';c.lineWidth=2;c.beginPath();c.ellipse(72,26,53,12,0,0,Math.PI*2);c.stroke();
    }},
    {name:'pilecircle',x:0,y:800,w:64,h:64,paint:function(c){c.strokeStyle='#fff';c.lineWidth=7;c.beginPath();c.arc(32,32,21,0,Math.PI*2);c.stroke();}},
    {name:'piletriangle',x:64,y:800,w:64,h:64,paint:function(c){poly(c,[[32,7],[58,55],[6,55]],'#fff');}},
    {name:'pilediamond',x:128,y:800,w:64,h:64,paint:function(c){poly(c,[[32,5],[59,32],[32,59],[5,32]],'#fff');}},
    {name:'pilesquare',x:192,y:800,w:64,h:64,paint:function(c){c.strokeStyle='#fff';c.lineWidth=7;c.strokeRect(12,12,40,40);}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function render(r,s){
    var l=config.layouts[s.level],n=s.piles.length,span=550/n,markers=['pilecircle','piletriangle','pilediamond','pilesquare'];r.sprite('orbittable',480,270,960,540,0,'#ffffff');
    text(r,l.name,44,36,28,gold);text(r,'NIM ORBIT',764,39,24,'#c1c4d1');text(r,'REMOVE FROM ONE PILE',51,110,24,'#c8c7d7');
    for(var p=0;p<n;p++){var cx=50+span*(p+.5),selected=p===s.selected;r.sprite('orbitbase',cx,447,112,48,0,'#ffffff');
      for(var k=0;k<s.piles[p];k++){var cy=415-k*43,marked=selected&&k>=s.piles[p]-s.amount;r.sprite('meteor',cx,cy,87,51,0,marked?'#f2ce8b':pileColors[p]);center(r,k+1,cx,cy-12,22,'#3b4258');if(marked)text(r,'-',cx-59,cy-13,23,gold);}
      if(!s.piles[p])center(r,'EMPTY',cx,386,20,'#8e99ae');r.sprite(markers[p],cx-38,474,16,16,0,pileColors[p]);center(r,'PILE '+(p+1),cx+8,462,21,pileColors[p]);
      if(selected){r.rect(cx-55,489,110,3,gold);center(r,'^',cx,491,22,gold);}
    }
    text(r,'LAST STONE',663,109,24,'#746e6f');text(r,s.misere?'LOSES':'WINS',663,145,41,s.misere?'#9a504e':'#3c695b');text(r,s.misere?'AVOID TAKING THE LAST':'TAKE THE LAST TO WIN',663,196,19,'#625d63');
    text(r,'PILE '+(s.selected+1)+' / TAKE '+s.amount,663,259,28,gold);text(r,'UP +1    DOWN -1',663,306,21,'#c1c5d5');
    text(r,'LAST ROUND',663,385,21,'#aeb9cd');
    if(s.lastPlayerMove){text(r,'YOU: P'+(s.lastPlayerMove.pile+1)+' -'+s.lastPlayerMove.removed,663,417,24,ink);text(r,s.lastAiMove?'OPP: P'+(s.lastAiMove.pile+1)+' -'+s.lastAiMove.removed:'NO OPPONENT MOVE',663,451,s.lastAiMove?24:19,'#c5b3d2');}
    else{text(r,'YOU MOVE FIRST',663,422,24,ink);text(r,'PUBLIC OPTIMAL OPPONENT',663,458,17,'#aeb9cd');}
    text(r,'LEFT / RIGHT PILE',44,516,20,'#c4c6d2');text(r,'A CONFIRM TAKE',361,516,20,'#c4c6d2');text(r,'B UNUSED',803,516,20,'#c4c6d2');
  }
  root.GameDef={id:'nim-orbit',title:'取石回合',seed:config.defaultSeed,accent:gold,background:'#2c2b43',atlas,holdConfirmAsA:true,
    tagline:'选一堆取石，算好最后一颗',levelLabel:'规则局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['确认取石'],
    description:'每回合只能从一堆取走一颗或更多石子。左右选堆，上下调整数量，A 确认，随后对手立即行动。前两关取最后者胜；第三关反规则，取最后者负。',
    controls:{move:'左右选择石堆；上增加、下减少取石数量',a:'空格、Z、确认 / 手机右侧：确认取石',b:'本游戏不使用 B'},
    tip:'右侧 WINS 表示取最后者胜，LOSES 表示取最后者负；顶部也有中文当前规则。金色且带减号的石子是本次所选数量。对手按公开最优规则行动，每回合只改变一堆。',
    winTitle:'最后一颗，算得正好',loseTitle:'本局取石结束',
    hud:function(s){return[{label:'当前最后一颗规则',value:s.misere?'取最后者负':'取最后者胜',tone:s.misere?'warn':'good'},{label:'剩余石子',value:s.remaining},
      {label:'选堆 / 取量',value:(s.selected+1)+' / '+s.amount},{label:'玩家回合',value:s.playerMoves}];},
    result:function(s){return(s.reason==='player-last'?'你':'对手')+'取走最后一颗；本关取最后者'+(s.misere?'负。':'胜。')+'你行动 '+s.playerMoves+' 回合，取走 '+s.playerRemoved+' 颗，对手取走 '+s.aiRemoved+' 颗。';},render};
})(window);
