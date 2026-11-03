(function(root){
  'use strict';
  var config=root.PureModel.config,ink='#eee6d3',gold='#e8c57d';
  function poly(c,p,fill,stroke){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'draughtstable',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#513f3c'],[1,'#2d3336']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#c39e7733';c.lineWidth=1;for(var y=0;y<540;y+=26){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(280,y+9,650,y-8,960,y+4);c.stroke();}
      poly(c,[[22,20],[938,20],[938,73],[22,73]],'#282e30','#a48f70');
      poly(c,[[49,88],[475,88],[475,513],[49,513]],'#bba37a','#e8d5a1');poly(c,[[63,101],[462,101],[462,500],[63,500]],'#3a4e45','#655b46');
      poly(c,[[500,95],[919,95],[919,191],[500,191]],'#dfd1ac','#f0e1b9');
      poly(c,[[500,209],[919,209],[919,317],[500,317]],'#263d37','#8a9981');
      poly(c,[[500,335],[919,335],[919,488],[500,488]],'#293d39','#8a9981');
      c.restore();
    }},
    {name:'boardsquare',x:640,y:0,w:96,h:96,paint:function(c,w,h){
      c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.strokeStyle='#bac3b455';c.lineWidth=1;c.strokeRect(1,1,w-2,h-2);
      c.strokeStyle='#879b9022';c.lineWidth=2;c.beginPath();c.moveTo(7,21);c.bezierCurveTo(37,5,66,40,91,20);c.moveTo(7,71);c.bezierCurveTo(39,52,57,85,90,65);c.stroke();
    }},
    {name:'checker',x:736,y:0,w:128,h:128,paint:function(c,w,h,art){
      art.ellipse(c,64,105,55,13,'#071e2455');art.ellipse(c,64,71,54,43,'#718d8b');
      art.ellipse(c,64,59,54,43,art.linear(c,0,15,0,105,[[0,'#ffffff'],[.5,'#d9e4d6'],[1,'#9db4ab']]));
      c.strokeStyle='#f5fae5';c.lineWidth=3;c.beginPath();c.ellipse(64,57,45,34,0,0,Math.PI*2);c.stroke();c.strokeStyle='#839f9266';c.lineWidth=2;c.beginPath();c.ellipse(64,57,36,26,0,0,Math.PI*2);c.stroke();
    }},
    {name:'crown',x:0,y:800,w:96,h:72,paint:function(c){poly(c,[[12,15],[29,34],[48,9],[67,34],[84,15],[76,59],[20,59]],'#ffffff');c.fillStyle='#ffffff';c.fillRect(20,62,56,5);}}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function coordinate(p){return String.fromCharCode(65+p%6)+(Math.floor(p/6)+1);}
  function render(r,s){
    var l=config.layouts[s.level],ox=70,oy=108,u=64;r.sprite('draughtstable',480,270,960,540,0,'#ffffff');
    text(r,l.name,45,36,28,gold);text(r,'DRAUGHTS TRAIL',652,40,24,'#c9d3bd');
    for(var x=0;x<6;x++)center(r,String.fromCharCode(65+x),ox+x*u+u/2,86,18,'#ddcead');
    for(var row=0;row<6;row++)center(r,row+1,57,oy+row*u+24,18,'#ddcead');
    for(var p=0;p<36;p++){var xx=ox+p%6*u,yy=oy+Math.floor(p/6)*u,dark=(p%6+Math.floor(p/6))%2===1,v=s.board[p];
      r.sprite('boardsquare',xx+u/2,yy+u/2,u,u,0,dark?'#577469':'#d6c5a1');
      if(s.legalDestinations.includes(p)){r.circle(xx+u/2,yy+u/2,11,'#b4d5b6');r.circle(xx+u/2,yy+u/2,5,'#426e55');}
      if(v){r.sprite('checker',xx+u/2,yy+u/2+3,56,56,0,v>0?'#f0dfb6':'#d69187');
        if(Math.abs(v)===2){r.sprite('crown',xx+u/2,yy+20,24,18,0,'#465849');center(r,v>0?'P':'E',xx+u/2,yy+30,21,'#354e47');}
        else{center(r,v>0?'P':'E',xx+u/2,yy+23,25,'#354e47');var ay=v>0?yy+15:yy+50;
          r.line(xx+u/2-5,ay+(v>0?4:-4),xx+u/2,ay,2,'#354e47');r.line(xx+u/2,ay,xx+u/2+5,ay+(v>0?4:-4),2,'#354e47');}
        if(s.forcedPieces.includes(p)&&!s.chainActive)frame(r,xx+5,yy+5,u-10,u-10,'#d8b081',2);
      }
      if(s.selected===p)frame(r,xx+3,yy+3,u-6,u-6,'#f3de94',3);
      if(s.cursor===p)frame(r,xx+1,yy+1,u-2,u-2,'#fff2c3',2);
    }
    text(r,'P  YOU',521,108,24,'#596d59');text(r,'E  OPPONENT',713,108,24,'#7b6257');text(r,s.playerPieces,521,144,32,'#2f5041');text(r,s.aiPieces,713,144,32,'#6d433d');
    text(r,s.chainActive?'CONTINUE CAPTURE':s.forcedPieces.length?'CAPTURE REQUIRED':'YOUR TURN',520,224,26,s.chainActive?'#f0c088':'#d3dfc1');
    text(r,'HALF-TURNS '+s.halfTurns+' / 80',521,265,24,'#c0ceb6');
    text(r,'LAST OPPONENT PATH',520,349,23,'#b9c9b4');
    if(s.lastAiTurn){var path=s.lastAiTurn.path.map(coordinate);for(var k=0;k<Math.ceil(path.length/3);k++)text(r,(k?'> ':'')+path.slice(k*3,k*3+3).join(' > '),521,387+k*25,22,ink);}
    else text(r,'WAITING FOR YOUR MOVE',521,389,21,'#aabdad');
    text(r,s.chainActive?'B LOCKED DURING CHAIN':'B CANCEL BEFORE CAPTURE',520,461,20,gold);
    text(r,'P UP / E DOWN  |  CROWN = KING',507,510,20,'#d3c7ad');
  }
  root.GameDef={id:'draughts-trail',title:'跳吃棋径',seed:config.defaultSeed,accent:gold,background:'#2d3935',atlas,holdConfirmAsA:true,
    tagline:'有吃必跳，连跳到底',levelLabel:'残局',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['选子 / 落子','取消未跳吃选择'],
    description:'你执浅色P，普通子向上斜走与跳吃；深色E向下。全盘有吃必吃，连跳必须同子完成。王棋可双向短跳，升王立即结束回合。A 选子与落点，B 取消尚未跳吃的选择。',
    controls:{move:'四向移动光标',a:'空格、Z、确认 / 手机右上：选子或落子',b:'X、B / 手机右下：跳吃前取消'},
    tip:'圆点是合法落点；有跳吃时只能选带框的浅色子。连跳中不能取消或换子。皇冠表示王棋，不能飞跳。对方路径完整显示，80个半回合未决按失败处理。',
    winTitle:'棋径打通，你赢了',loseTitle:'本局棋径结束',
    hud:function(s){return[{label:'己方 / 对方',value:s.playerPieces+' / '+s.aiPieces},{label:'己方已吃',value:s.playerCaptures,tone:'good'},
      {label:'当前选择',value:s.selected===null?'未选子':coordinate(s.selected)},{label:'半回合',value:s.halfTurns+' / 80'}];},
    result:function(s){return(s.phase==='won'?'对方已无棋子或合法行动。':s.reason==='turn-limit'?'达到回合上限，和局按本关失败处理。':'己方已无棋子或合法行动。')+'你走了 '+s.playerTurns+' 回合，吃子 '+s.playerCaptures+' 枚，总计 '+s.halfTurns+' 个半回合。';},render};
})(window);
