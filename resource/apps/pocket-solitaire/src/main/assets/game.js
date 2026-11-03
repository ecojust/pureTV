(function(root){
  'use strict';
  var config=root.PureModel.config,gold='#e8c68d',ink='#e8eee1',suitTiles=['club','diamond','spade','heart'];
  function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function poly(c,p){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();c.fill();}
  var tiles=[
    {name:'pockettable',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#2b5c56'],[1,'#193f45']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#98b7a214';c.lineWidth=1;for(var y=3;y<540;y+=9){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
      round(c,24,21,912,54,8,'#173b3a','#b0ad83');round(c,27,91,906,98,12,'#28514c','#7d967c');
      round(c,38,213,136,271,9,'#183e3b66','#74967d');round(c,208,213,136,271,9,'#183e3b66','#74967d');round(c,378,213,136,271,9,'#183e3b66','#74967d');round(c,548,213,136,271,9,'#183e3b66','#74967d');
      round(c,718,214,213,126,10,'#e4d7b9','#b1a58d');round(c,718,355,213,131,10,'#193d3d','#819980');
      c.strokeStyle='#c6b986';c.lineWidth=1;c.setLineDash([3,5]);c.strokeRect(32,29,896,38);c.setLineDash([]);c.restore();
    }},
    {name:'pocketcard',x:640,y:0,w:144,h:96,paint:function(c,w,h,art){
      round(c,3,6,138,88,7,'#102d2d66');round(c,2,2,138,87,6,art.linear(c,0,0,144,96,[[0,'#fff9e9'],[1,'#e0d6b9']]),'#d2ba8d');
      c.strokeStyle='#b8b49144';c.lineWidth=1;c.beginPath();c.moveTo(10,50);c.lineTo(132,50);c.stroke();c.strokeStyle='#b8b49133';c.strokeRect(9,9,124,71);
    }},
    {name:'pocketslot',x:784,y:0,w:144,h:96,paint:function(c){round(c,3,4,138,87,6,'#143c3a77','#a3b18b');c.strokeStyle='#a5b78a55';c.lineWidth=1;c.setLineDash([4,5]);c.strokeRect(10,11,124,73);c.setLineDash([]);}}
  ];
  for(var k=0;k<4;k++)(function(suit){tiles.push({name:suitTiles[suit],x:suit*64,y:800,w:64,h:64,paint:function(c){c.fillStyle='#fff';
    if(suit===1)poly(c,[[32,5],[58,32],[32,59],[6,32]]);
    else if(suit===3){c.beginPath();c.moveTo(32,56);c.bezierCurveTo(-9,31,10,-2,32,18);c.bezierCurveTo(54,-2,73,31,32,56);c.fill();}
    else if(suit===0){[[32,20],[19,35],[45,35]].forEach(function(p){c.beginPath();c.arc(p[0],p[1],13,0,Math.PI*2);c.fill();});poly(c,[[29,36],[22,58],[42,58],[35,36]]);}
    else{c.beginPath();c.moveTo(32,5);c.bezierCurveTo(18,18,-2,34,16,45);c.quadraticCurveTo(24,50,31,39);c.quadraticCurveTo(28,51,22,58);c.lineTo(42,58);c.quadraticCurveTo(36,51,33,39);c.bezierCurveTo(55,63,75,38,32,5);c.fill();}
  }});})(k);
  var atlas={builtins:[],tiles};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function name(p){return p<4?'T'+(p+1):p<6?'F'+(p-3):'HOME '+config.suits[p-6].id;}
  function locationZh(p){return p<4?'牌列'+(p+1):p<6?'暂存'+(p-3):config.suits[p-6].nameZh+'归位';}
  function card(r,c,cx,top,w,h){var color=c.color?'#a34f51':'#29474b';r.sprite('pocketcard',cx,top+h/2,w,h,0,'#ffffff');text(r,c.rank+' '+config.suits[c.suit].id,cx-w/2+13,top+4,22,color);r.sprite(suitTiles[c.suit],cx+w/2-23,top+16,18,18,0,color);}
  function render(r,s){
    var l=config.layouts[s.level];r.sprite('pockettable',480,270,960,540,0,'#ffffff');text(r,l.name,44,37,27,gold);text(r,'POCKET SOLITAIRE',657,40,24,'#becfb7');
    for(var top=0;top<6;top++){var loc=top+4,cx=105+150*top,yy=119,w=119,h=62;center(r,name(loc),cx,95,19,top<2?'#d3dfc1':'#e4c58e');
      var id=top<2?s.freecells[top]:s.foundations[top-2]?(top-2)*s.maxRank+s.foundations[top-2]-1:null;
      if(id!==null)card(r,s.cards[id],cx,yy,w,h);else{r.sprite('pocketslot',cx,yy+h/2,w,h,0,'#ffffff');if(top<2)center(r,'FREE',cx,yy+20,21,'#9fb99b');else{r.sprite(suitTiles[top-2],cx-25,yy+31,26,26,0,'#a6ba92');text(r,'1-'+s.maxRank,cx-3,yy+17,23,'#c3d3b4');}}
      if(s.selectedSource===loc)frame(r,cx-w/2-2,yy-2,w+4,h+4,gold,4);if(s.cursor===loc)frame(r,cx-w/2-5,yy-5,w+10,h+10,'#eaf2c9',2);
    }
    for(var p=0;p<4;p++){var cx=106+p*170,col=s.tableau[p],gap=Math.min(38,200/Math.max(1,col.length-1));center(r,'T'+(p+1)+' / '+col.length,cx,195,20,'#d0dbbc');
      if(!col.length){r.sprite('pocketslot',cx,248,125,56,0,'#ffffff');center(r,'ANY',cx,236,22,'#9bb499');}
      for(var depth=0;depth<col.length;depth++)card(r,s.cards[col[depth]],cx,220+depth*gap,125,56);
      var cardTop=220+Math.max(0,col.length-1)*gap;if(s.selectedSource===p)frame(r,cx-65,cardTop-2,130,60,gold,4);if(s.cursor===p)frame(r,cx-68,cardTop-5,136,66,'#eaf2c9',2);
    }
    text(r,'VALID MOVES',735,230,21,'#766d60');text(r,s.movesUsed+' / '+s.moveLimit,735,261,32,'#315049');text(r,'UNDO TICKETS '+s.undoTickets,735,310,18,'#675f5e');
    text(r,s.selectedSource===null?'SELECT SOURCE':'SOURCE '+name(s.selectedSource),735,372,20,gold);text(r,s.selectedSource===null?'A MARKS TOP CARD':'A PLACES / SAME',735,408,18,'#c4d2bb');text(r,s.selectedSource===null?'B UNDO: NO REFUND':'SOURCE CANCELS',735,435,17,'#c4d2bb');
    text(r,'HOME: SUIT +1',44,515,21,'#c4d4bd');text(r,'TABLEAU: ALT COLOR -1',321,515,21,'#c4d4bd');text(r,'ONE CARD AT A TIME',707,515,19,'#c4d4bd');
  }
  root.GameDef={id:'pocket-solitaire',title:'口袋接龙',seed:config.defaultSeed,accent:gold,background:'#25534a',atlas,holdConfirmAsA:true,
    tagline:'两格暂存，四花归位',levelLabel:'牌局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选牌 / 放牌','撤销（2票）'],
    description:'四列明牌只移动顶牌，每次一张。牌列按红黑交替且下降1接牌，空列任意；两个暂存格各放一张。四个归位区按本花色从1递增，全部归位获胜。',
    controls:{move:'左右循环选择全部区域；上下切换上下排',a:'空格、Z、确认 / 手机右上：选源再选目标；同源取消',b:'X、B / 手机右下：撤销，消耗票且不退步数'},
    tip:'C梅花/S黑桃为黑，D方块/H红心为红；字母和图形同时标识花色。归位牌不能直接取回，有限撤销可回退。卡牌点数和花色始终在露出的上沿，只有最下面的顶牌可移动。',
    winTitle:'四花归位，接龙完成',loseTitle:'本局移动次数已用完',
    hud:function(s){return[{label:'已归位',value:s.foundationCount+' / '+s.cards.length},{label:'所在区域',value:locationZh(s.cursor)},
      {label:'已用 / 上限',value:s.movesUsed+' / '+s.moveLimit},{label:'撤销票',value:s.undoTickets}];},
    result:function(s){return(s.phase==='won'?'全部牌已按花色从1递增归位。':'有效移动次数已用完。')+'已归位 '+s.foundationCount+'/'+s.cards.length+'，使用 '+s.movesUsed+' 步，撤销 '+s.undosUsed+' 次；撤销不退步数。';},render};
})(window);
