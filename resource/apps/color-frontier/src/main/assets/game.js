(function(root){
  'use strict';
  var config=root.PureModel.config, ink='#243b40', cream='#fff5dc', muted='#66777a';
  function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  var atlas={builtins:[],tiles:[
    {name:'dyetable',x:0,y:0,w:640,h:384,paint:function(c,w,h,art){
      c.save();c.scale(w/960,h/540);c.fillStyle=art.linear(c,0,0,960,540,[[0,'#24494b'],[1,'#132d35']]);c.fillRect(0,0,960,540);
      c.strokeStyle='#94b4a51a';c.lineWidth=2;
      for(var j=0;j<540;j+=27){c.beginPath();c.moveTo(0,j);c.bezierCurveTo(290,j+12,510,j-9,960,j+7);c.stroke();}
      rounded(c,20,18,920,504,16,'#081c2655');
      rounded(c,25,14,910,504,13,art.linear(c,0,0,850,540,[[0,'#fcf2d8'],[.5,'#e8dec4'],[1,'#cfc8ad']]),'#fcf7e3');
      c.fillStyle='#fff8e918';for(var k=0;k<500;k++){var x=34+(k*137)%888,y=24+(k*73)%480;c.fillRect(x,y,1+(k%3),1);}
      c.fillStyle='#d2c5a7';c.fillRect(459,78,1,411);
      rounded(c,42,88,402,402,8,'#263e43','#fff6dc');
      rounded(c,483,90,430,102,9,'#f8edcf88','#b6b49b');
      rounded(c,483,209,430,131,9,'#324c4c','#697b6e');
      rounded(c,483,354,430,84,9,'#fcf4dd88','#b6b49b');
      c.strokeStyle='#304c4566';c.lineWidth=1;
      for(var mark=0;mark<12;mark++){var mx=54+mark*33;c.beginPath();c.moveTo(mx,493);c.lineTo(mx,mark%3?498:503);c.stroke();}
      // Inked cartographic corner ornament.
      c.strokeStyle='#b69b67';c.lineWidth=2;c.beginPath();c.arc(895,48,19,0,Math.PI*2);c.stroke();
      art.path(c,[[895,26],[901,48],[895,70],[889,48]],'#426a66');
      art.path(c,[[875,48],[895,43],[915,48],[895,53]],'#b3a776');
      c.restore();
    }},
    {name:'dyejar',x:640,y:0,w:110,h:160,paint:function(c,w,h,art){
      art.ellipse(c,55,147,45,10,'#00000033');
      rounded(c,12,35,86,106,15,art.linear(c,0,35,100,130,[[0,'#fffef5'],[.5,'#d8ded5'],[1,'#a6beb4']]),'#466365');
      rounded(c,21,44,68,84,10,'#ffffff','#a8b9ac');
      c.fillStyle='#ffffff66';c.fillRect(23,53,9,60);
      rounded(c,17,19,76,24,5,art.linear(c,0,19,0,43,[[0,'#b0bcb3'],[1,'#506b68']]),'#243e43');
      c.strokeStyle='#e7ece1';c.lineWidth=2;for(var x=24;x<88;x+=10){c.beginPath();c.moveTo(x,22);c.lineTo(x,38);c.stroke();}
      rounded(c,35,70,40,38,6,'#f7f4e4','#768f7e');
    }},
    {name:'maptile',x:0,y:800,w:128,h:128,paint:function(c,w,h,art){
      rounded(c,3,3,122,122,8,art.linear(c,0,0,128,128,[[0,'#ffffff'],[.6,'#f5f5ec'],[1,'#d1dcd3']]),'#fcfff088');
      c.strokeStyle='#ffffff50';c.lineWidth=2;c.beginPath();c.moveTo(13,85);c.bezierCurveTo(40,65,54,103,114,76);c.stroke();
      c.beginPath();c.moveTo(7,103);c.bezierCurveTo(46,85,63,119,118,96);c.stroke();
      c.fillStyle='#ffffff33';c.fillRect(13,15,26,3);
    }}
  ]};
  function text(r,t,x,y,size,color){r.text(String(t),x,y,size,color||ink);}
  function center(r,t,x,y,size,color){text(r,t,x-r.measureText(String(t),size)/2,y,size,color);}
  function frame(r,x,y,w,h,color,n){r.rect(x,y,w,n,color);r.rect(x,y+h-n,w,n,color);r.rect(x,y,n,h,color);r.rect(x+w-n,y,n,h,color);}
  function render(r,s){
    var l=config.layouts[s.level],size=390/l.width,ox=48,oy=94;
    r.sprite('dyetable',480,270,960,540,0,'#ffffff');
    text(r,l.name,48,35,30,ink);text(r,'DYE '+s.movesUsed+' / '+s.moveLimit,635,37,26,ink);
    for(var i=0;i<s.cells.length;i++){
      var x=ox+(i%l.width)*size,y=oy+Math.floor(i/l.width)*size,c=s.cells[i];
      r.sprite('maptile',x+size/2,y+size/2,size-2,size-2,0,config.colors[c].hex);
      center(r,c+1,x+size/2,y+size/2-14,27,'#233b41');
      if(s.owned[i]){
        r.circle(x+size-11,y+11,4,'#243b40');r.circle(x+size-11,y+11,2,'#fff8db');
        // Only the outer edge of the owned component is highlighted.
        if(i<l.width||!s.owned[i-l.width])r.rect(x+2,y+2,size-4,2,cream);
        if(i>=s.cells.length-l.width||!s.owned[i+l.width])r.rect(x+2,y+size-4,size-4,2,cream);
        if(i%l.width===0||!s.owned[i-1])r.rect(x+2,y+2,2,size-4,cream);
        if(i%l.width===l.width-1||!s.owned[i+1])r.rect(x+size-4,y+2,2,size-4,cream);
      }
    }
    r.circle(56,102,7,'#243b40');r.circle(56,102,3,cream);
    text(r,'OWNED TERRITORY',501,102,24,muted);
    text(r,s.ownedCount+' / '+s.cells.length,501,135,32,ink);
    text(r,'+'+s.lastGain+' LAST',744,140,24,ink);
    r.rect(501,176,393,5,'#bdc2a8');r.rect(501,176,393*s.ownedCount/s.cells.length,5,'#3d7d6b');
    text(r,'SELECT DYE',501,218,24,cream);
    config.colors.forEach(function(c,i){
      var x=541+i*106;
      r.sprite('dyejar',x,284,58,85,0,c.hex);
      center(r,i+1,x,273,24,ink);
      if(i===s.selected)frame(r,x-43,246,86,80,'#fff2b0',3);
      center(r,c.name,x,321,17,cream);
      if(i===s.color)r.circle(x+25,254,4,cream);
    });
    text(r,'B UNDO: '+s.history.length+' BACK',501,365,25,ink);
    text(r,'DYE SPENT IS NOT REFUNDED',501,402,20,muted);
    text(r,'< > PALETTE     A FLOOD',491,453,23,ink);
    text(r,'DOT = OWNED   /   SIDES CONNECT',491,483,18,muted);
  }
  root.GameDef={id:'color-frontier',title:'染色连疆',seed:config.defaultSeed,accent:'#e8c66e',background:'#24494b',atlas,holdConfirmAsA:true,
    tagline:'一滴染料，连起整片疆域',levelLabel:'地图',levelNames:config.layouts.map(l=>l.nameZh),actionLabels:['扩染连疆','撤回（不退次数）'],
    description:'左右选择染料，A 改染左上角相连区域，并吸收上下左右相邻的同色地块。用有限次数连满全图；B 撤回地图但不退次数。长按不连动。',
    controls:{move:'左右选择染料',a:'空格、Z、确认 / 手机右上：扩染',b:'X、B / 手机右下：撤回，不退次数'},
    tip:'地图圆点表示已拥有。编号 1–4 对应染料，斜角不连接。相同颜色免费；改色即扣一次。最后一次连满仍能获胜，次数耗尽后不能撤回。',
    winTitle:'全域连色，染疆完成',loseTitle:'染料额度已用尽',
    hud:function(s){return[{label:'已连区域',value:s.ownedCount+' / '+s.cells.length,tone:'good'},
      {label:'剩余次数',value:s.moveLimit-s.movesUsed,tone:s.moveLimit-s.movesUsed<=2?'warn':''},
      {label:'当前染料',value:config.colors[s.selected].nameZh},{label:'可撤回',value:s.history.length+' 步'}];},
    result:function(s){return(s.phase==='won'?'整幅地图已按四向连通统一。':'仍有未连入的色块，请观察疆域边界后重试。')+'扩染 '+s.movesUsed+'/'+s.moveLimit+' 次，撤回 '+s.undos+' 次，用时 '+s.elapsed.toFixed(1)+' 秒。';},
    render};
})(window);
