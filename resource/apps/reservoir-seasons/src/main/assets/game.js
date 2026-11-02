/* Original watershed relief. Branches are schematic; quantities come only from the public seasonal account. */
function rsGradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [at,color]of stops)g.addColorStop(at,color);return g;}
function rsPath(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function rsEllipse(c,x,y,rx,ry,fill,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function rsLine(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function rsTree(c,x,y,size=1){
  c.save();c.translate(x,y);c.scale(size,size);rsEllipse(c,2,3,12,4,'rgba(40,61,61,.16)');c.fillStyle='#6b6d58';c.fillRect(-2,-12,4,14);
  rsPath(c,[[0,-38],[-16,-10],[15,-10]],'#6e947c');rsPath(c,[[0,-38],[0,-10],[15,-10]],'#567866');rsPath(c,[[0,-29],[-19,0],[18,0]],'#789e80');rsPath(c,[[0,-29],[0,0],[18,0]],'#597e68');rsLine(c,[[-10,-13],[-4,-21]],'#a4b397',1);c.restore();
}
function rsRock(c,x,y,size=1){
  c.save();c.translate(x,y);c.scale(size,size);rsPath(c,[[-15,7],[-10,-7],[3,-15],[17,-6],[20,8],[3,13]],'#a4aba4','#7c8e89',.7);
  rsPath(c,[[-10,-7],[3,-15],[17,-6],[2,-1]],'#c3c8b9');rsPath(c,[[2,-1],[17,-6],[20,8],[3,13]],'#879a94');rsLine(c,[[-10,-7],[2,-1],[3,13]],'#dde0cf',.7);c.restore();
}
function rsBasin(c,w,h){
  c.save();c.scale(w/512,h/256);rsEllipse(c,264,220,230,25,'rgba(52,70,71,.15)');
  rsPath(c,[[24,82],[112,31],[396,36],[486,102],[469,207],[367,242],[92,231],[20,171]],rsGradient(c,0,40,0,240,[[0,'#c0c9ad'],[.45,'#a9baa0'],[1,'#899d8e']]),'#81958b',1.5);
  rsPath(c,[[20,171],[92,216],[367,227],[469,193],[469,207],[367,242],[92,231]],rsGradient(c,0,190,0,242,[[0,'#a8aa91'],[1,'#7f8c83']]));
  rsLine(c,[[24,181],[91,224],[200,228],[363,235],[455,208]],'#c5c3a7',1.3);
  rsPath(c,[[33,91],[89,58],[110,14],[157,43],[181,70],[165,100],[96,123]],'#9caca1');
  rsPath(c,[[89,58],[110,14],[120,62],[96,123]],'#c7cdbb');rsPath(c,[[110,14],[157,43],[181,70],[120,62]],'#aebbb1');rsLine(c,[[89,58],[109,68],[96,123]],'#748f88',1);
  rsPath(c,[[343,78],[379,17],[422,39],[465,97],[449,131],[394,121]],'#a4b3a4');rsPath(c,[[379,17],[383,72],[343,78]],'#d0d2bb');rsPath(c,[[379,17],[422,39],[383,72]],'#bcc4ae');rsPath(c,[[383,72],[422,39],[465,97],[449,131]],'#8fa798');
  // The bare storage cavity contains no baked water or forecast allocation.
  rsPath(c,[[104,78],[362,78],[397,103],[397,198],[104,198],[77,173],[77,104]],'#849995','#6f8987',1.5);
  rsPath(c,[[104,78],[362,78],[397,103],[104,103],[77,104]],'#d1d3bf');
  rsPath(c,[[77,104],[104,103],[104,198],[77,173]],rsGradient(c,77,0,104,0,[[0,'#b8c3b2'],[1,'#8ca19a']]));
  c.fillStyle=rsGradient(c,0,104,0,198,[[0,'#789895'],[1,'#aab3a0']]);c.fillRect(105,104,291,93);
  for(let y=122;y<198;y+=18)rsLine(c,[[108,y],[391,y]],'rgba(211,219,201,.32)',1);
  rsPath(c,[[104,198],[397,198],[397,211],[105,211],[91,198]],'#d2cfb7');rsLine(c,[[108,201],[390,201]],'#eef0dc',1.3);
  for(const [x,y,s]of [[45,143,.55],[63,174,.6],[438,163,.65],[415,205,.45],[202,45,.5],[311,47,.48]])rsRock(c,x,y,s);
  for(const [x,y,s]of [[49,122,.65],[68,89,.6],[171,65,.57],[330,62,.66],[452,134,.65],[431,98,.6],[54,187,.55]])rsTree(c,x,y,s);
  rsLine(c,[[31,160],[56,174],[73,186]],'#d8d7bd',4);rsLine(c,[[412,182],[443,173],[463,153]],'#d8d7bd',4);c.restore();
}
function rsDam(c,w,h){
  c.save();c.scale(w/192,h/240);rsEllipse(c,100,211,81,15,'rgba(44,65,66,.2)');
  rsPath(c,[[36,31],[122,23],[161,62],[171,202],[55,215],[23,172]],rsGradient(c,40,30,145,200,[[0,'#e4dfc7'],[.5,'#bdbfae'],[1,'#95aaa3']]),'#79928e',1.5);
  rsPath(c,[[36,31],[122,23],[161,62],[65,72]],'#f1ead2');rsPath(c,[[23,172],[36,31],[65,72],[55,215]],'#b4beb0');
  rsPath(c,[[65,72],[161,62],[171,202],[55,215]],rsGradient(c,60,65,150,215,[[0,'#d7d7c2'],[.55,'#adbeb4'],[1,'#849f98']]));
  for(let y=94;y<204;y+=27)rsLine(c,[[62,y],[163,y-11]],'#889f96',1);for(let x=80;x<155;x+=24)rsLine(c,[[x,73],[x+3,203]],'rgba(239,238,214,.56)',1);
  rsPath(c,[[85,143],[89,124],[115,121],[123,138],[127,205],[81,210]],'#527f83','#789b98',1.5);
  rsPath(c,[[91,145],[95,131],[112,129],[117,143],[119,201],[90,204]],'#385e66');
  for(let y=149;y<196;y+=10)rsLine(c,[[92,y],[117,y-3]],'#6b9597',2);
  rsPath(c,[[52,56],[153,45],[164,61],[64,73]],'#718b89');rsLine(c,[[54,51],[151,41]],'#e6e7d1',2);
  for(const [x,y]of [[56,52],[81,49],[106,46],[131,43],[151,41]])rsLine(c,[[x,y],[x,y-12]],'#889f98',2);
  rsLine(c,[[56,40],[151,29]],'#cbd3be',2);rsPath(c,[[49,34],[71,30],[82,39],[61,43]],'#f0e9cb');
  c.fillStyle='#9cae9f';c.fillRect(46,23,25,14);rsPath(c,[[43,23],[63,17],[76,22],[55,28]],'#547d80');c.restore();
}
function rsHouse(c,x,y,scale=1,roof='#a97955'){
  c.save();c.translate(x,y);c.scale(scale,scale);rsPath(c,[[0,0],[28,-7],[47,3],[20,11]],roof,'#7a7e69',.7);
  rsPath(c,[[0,0],[20,11],[20,43],[0,32]],'#e4d9b8');rsPath(c,[[20,11],[47,3],[47,34],[20,43]],'#c3ceb8');
  rsPath(c,[[-4,1],[17,-17],[33,-18],[52,3],[20,12]],roof,'#857c61',.7);rsPath(c,[[17,-17],[33,-18],[52,3],[20,12]],'#c49d70');
  rsLine(c,[[17,-17],[20,12]],'#efd6a6',1);c.fillStyle='#638c93';c.fillRect(5,11,8,10);c.fillStyle='#96b4ad';c.fillRect(6,12,6,3);
  for(const xx of [26,37])rsPath(c,[[xx,16],[xx+6,14],[xx+6,23],[xx,25]],'#5c8289');rsPath(c,[[28,29],[35,27],[35,39],[28,41]],'#818e7a');c.restore();
}
function rsTown(c,w,h){
  c.save();c.scale(w/224,h/128);rsEllipse(c,114,106,99,12,'rgba(52,70,71,.13)');rsPath(c,[[13,78],[97,38],[209,70],[213,100],[113,123],[18,105]],'#c0c5a5');
  rsLine(c,[[29,99],[104,76],[194,97]],'#e9dfc0',8);rsLine(c,[[112,118],[108,76],[161,55]],'#e9dfc0',7);
  rsHouse(c,27,60,.85,'#b1865e');rsHouse(c,86,38,1.05,'#8b9c8b');rsHouse(c,151,68,.86,'#ae8261');
  for(const [x,y,s]of [[24,87,.58],[72,44,.52],[142,103,.5],[197,84,.53]])rsTree(c,x,y,s);
  rsPath(c,[[91,99],[110,94],[120,100],[101,106]],'#819f9a');rsEllipse(c,106,98,5,2,'#dfdfc5');c.restore();
}
function rsFarm(c,w,h){
  c.save();c.scale(w/224,h/128);rsEllipse(c,111,109,100,12,'rgba(52,70,71,.13)');rsPath(c,[[14,58],[107,20],[210,60],[208,104],[113,123],[14,100]],'#bfb48b');
  const beds=[[[22,62],[70,43],[111,58],[62,78]],[[78,40],[109,29],[153,45],[119,58]],[[70,83],[119,64],[169,82],[119,103]],[[128,61],[160,49],[201,65],[173,77]],[[25,71],[58,83],[58,103],[25,94]]];
  for(let i=0;i<beds.length;i++)rsPath(c,beds[i],i%2?'#a1ae76':'#819d70','#dfd2a1',2);
  for(let i=0;i<5;i++){const x=27+i*8;rsLine(c,[[x,62+i*.2],[x+37,48+i*.2]],'#b9c58f',2);rsLine(c,[[82+i*8,83],[122+i*8,69]],'#bfd09a',2);}
  for(let i=0;i<6;i++){const x=91+i*8,y=86-i*3;rsLine(c,[[x,y+5],[x,y-1]],'#486f59',1.2);rsPath(c,[[x,y],[x-4,y-4],[x,y-2],[x+4,y-5]],'#d6d8a0');}
  rsHouse(c,166,34,.57,'#a8845b');rsLine(c,[[17,105],[111,125],[208,107]],'#e6d4a6',2);c.restore();
}
function rsRiver(c,w,h){
  c.save();c.scale(w/224,h/128);rsEllipse(c,110,108,100,11,'rgba(52,70,71,.12)');rsPath(c,[[15,49],[100,22],[205,44],[214,101],[125,124],[13,97]],'#adbca2');
  // A riverbed specimen identifies the ecological recipient; transfer water is not baked here.
  rsPath(c,[[74,28],[104,24],[147,46],[149,65],[117,85],[130,119],[101,116],[88,82],[118,58],[117,49]],'#c8c5ab');
  rsPath(c,[[89,28],[103,29],[134,48],[135,61],[103,84],[115,117],[106,116],[97,83],[126,59],[126,50]],'#9bad9f');
  rsLine(c,[[91,32],[122,48],[126,58],[95,82],[106,110]],'#dce1c4',1.5);
  for(const [x,y,s]of [[48,64,.52],[162,88,.7],[181,65,.45],[62,90,.4]])rsRock(c,x,y,s);
  for(const [x,y]of [[48,85],[68,58],[157,63],[177,101]])for(let i=0;i<4;i++){const xx=x+i*3;rsLine(c,[[xx,y],[xx-3+i,y-17-i*2]],'#6d9174',1.2);rsEllipse(c,xx-3+i,y-18-i*2,1.5,4,'#a7a77a',-.1);}
  rsTree(c,30,71,.6);rsTree(c,187,47,.7);c.restore();
}
function rsSeason(kind){return function(c,w,h){
  c.save();c.scale(w/64,h/64);rsEllipse(c,32,34,25,24,'#e7e6d1');
  if(kind==='spring'){rsLine(c,[[25,49],[34,18]],'#668e71',3);rsPath(c,[[30,34],[15,31],[14,18],[26,19],[32,29]],'#8fab75');rsPath(c,[[32,34],[34,21],[49,16],[49,28],[40,36]],'#aac58a');rsLine(c,[[30,32],[20,24]],'#d7ddaf',1);}
  else if(kind==='summer'){for(let i=0;i<8;i++){const a=i*Math.PI/4;rsLine(c,[[32+Math.cos(a)*19,32+Math.sin(a)*19],[32+Math.cos(a)*25,32+Math.sin(a)*25]],'#d4a65c',2.5);}rsEllipse(c,32,32,14,14,'#e5bb6c');rsEllipse(c,28,28,7,6,'#efd295');}
  else if(kind==='autumn'){rsPath(c,[[32,10],[39,22],[52,19],[46,34],[51,42],[36,44],[30,55],[24,42],[11,39],[20,29],[17,17],[28,23]],'#c99b68');rsLine(c,[[31,51],[32,19]],'#edcf96',1.8);rsLine(c,[[32,33],[23,27],[32,33],[43,28]],'#edcf96',1.2);}
  else{for(let i=0;i<6;i++){const a=i*Math.PI/3,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;rsLine(c,[[32,32],[32+dx*22,32+dy*22]],'#89aab3',2);rsLine(c,[[32+dx*13+px*6,32+dy*13+py*6],[32+dx*17,32+dy*17],[32+dx*13-px*6,32+dy*13-py*6]],'#89aab3',1.8);}rsEllipse(c,32,32,3,3,'#c8d8cf');}
  c.restore();
};}
function rsWater(c,w,h){
  c.fillStyle=rsGradient(c,0,0,0,h,[[0,'#83bab9'],[.22,'#5b9daa'],[1,'#316b82']]);c.fillRect(0,0,w,h);
  for(let i=0;i<24;i++){const x=(i*61+9)%w,y=(i*29+5)%h,len=8+i%5*4;rsLine(c,[[x,y],[Math.min(w,x+len),y-1]],i%3?'rgba(183,218,208,.3)':'rgba(230,239,209,.46)',1);}
}
function rsConcrete(c,w,h){c.fillStyle=rsGradient(c,0,0,w,h,[[0,'#e3dec6'],[1,'#aebdaf']]);c.fillRect(0,0,w,h);for(let i=0;i<120;i++){const x=(i*37+11)%w,y=(i*47+7)%h;rsEllipse(c,x,y,i%3*.5+.3,.4,'rgba(83,106,98,.15)');}for(let y=31;y<h;y+=32)rsLine(c,[[0,y],[w,y]],'rgba(122,142,129,.22)',1);}
function rsGround(c,w,h){c.fillStyle=rsGradient(c,0,0,w,h,[[0,'#e7e5cd'],[1,'#cdd7c0']]);c.fillRect(0,0,w,h);for(let i=0;i<140;i++){const x=(i*67+11)%w,y=(i*41+9)%h;rsEllipse(c,x,y,.6+i%4*.4,.3,'rgba(112,131,104,.09)');}}
function rsGate(c,w,h){
  c.save();c.scale(w/128,h/128);rsEllipse(c,64,112,42,8,'rgba(37,67,71,.15)');rsPath(c,[[24,25],[104,25],[104,113],[24,113]],'#b2c2b2','#789993',2);
  rsPath(c,[[33,34],[95,34],[95,104],[33,104]],'#4c7c87');for(let y=45;y<102;y+=12)rsLine(c,[[37,y],[91,y]],'#a5c5b9',3);
  rsLine(c,[[64,16],[64,70]],'#879b8e',4);rsEllipse(c,64,18,18,7,'#d7cc9d');rsEllipse(c,64,17,12,3,'#789c96');rsLine(c,[[47,18],[81,18]],'#e8dfb8',2);c.restore();
}
const RS_ATLAS={builtins:[],tiles:[
  {name:'rs_basin',x:0,y:0,w:512,h:256,paint:rsBasin},{name:'rs_dam',x:512,y:0,w:192,h:240,paint:rsDam},
  {name:'rs_spring',x:704,y:0,w:64,h:64,paint:rsSeason('spring')},{name:'rs_summer',x:768,y:0,w:64,h:64,paint:rsSeason('summer')},{name:'rs_autumn',x:832,y:0,w:64,h:64,paint:rsSeason('autumn')},{name:'rs_winter',x:896,y:0,w:64,h:64,paint:rsSeason('winter')},
  {name:'rs_town',x:0,y:256,w:224,h:128,paint:rsTown},{name:'rs_farm',x:224,y:256,w:224,h:128,paint:rsFarm},{name:'rs_river',x:448,y:256,w:224,h:128,paint:rsRiver},
  {name:'rs_gate',x:832,y:128,w:128,h:128,paint:rsGate},{name:'rs_water',x:0,y:800,w:256,h:128,paint:rsWater},{name:'rs_concrete',x:256,y:800,w:128,h:128,paint:rsConcrete},{name:'rs_ground',x:384,y:800,w:256,h:128,paint:rsGround}
]};
const RS_INK='#325c64',RS_MUTED='#6b837b',RS_PAPER='#f0edda',RS_WARN='#b16d4b';
const RS_CATEGORIES=['RESIDENTS','FARMS','RIVER'],RS_SEASONS=['SPRING','SUMMER','AUTUMN','WINTER'],RS_SEASON_TILES=['rs_spring','rs_summer','rs_autumn','rs_winter'];
function rsForecasts(r,s){
  for(let i=0;i<s.seasons.length;i++){
    const x=20+i*235,y=52,f=s.seasons[i],current=i===s.seasonIndex,done=i<s.completedSeasons;
    r.rect(x,y,215,78,current?'#d1dfd0':'#e5e6d4');if(current)r.rect(x,y,215,3,'#5a8f91');
    r.sprite(RS_SEASON_TILES[i],x+24,y+36,40,40,0,'#fff');r.text(RS_SEASONS[i],x+51,y+7,16,RS_INK);r.text(done?'DONE':current?'NOW':'AHEAD',x+162,y+9,13,RS_MUTED);
    r.text('IN '+f.inflowUnits+' / EVAP '+f.evaporationUnits,x+51,y+28,13,RS_MUTED);r.text('R '+f.demandUnits[0]+'  F '+f.demandUnits[1]+'  E '+f.demandUnits[2],x+51,y+45,13,RS_INK);r.text('RES FLOOR '+f.residentFloorUnits,x+51,y+62,13,RS_MUTED);
  }
}
function rsBranches(r,s){
  function branch(i,color){
    const y=187+i*95;
    r.line(448,299,493,299,3,color);r.line(493,299,493,y,3,color);r.line(493,y,520,y,3,color);
    r.line(514,y-4,520,y,1.5,color);r.line(514,y+4,520,y,1.5,color);
  }
  for(let i=0;i<3;i++)branch(i,'#a5b8aa');
  const release=s.lastInterval&&s.lastInterval.release;
  if(s.phase==='playing'&&s.stage==='releasing'&&release&&release.seasonIndex===s.seasonIndex)for(let i=0;i<3;i++)if(release.creditedUnits[i]>0)branch(i,'#3a94a5');
}
function rsReservoir(r,s){
  r.text('STORAGE '+s.storedUnits+' / '+s.capacityUnits,30,148,22,RS_INK);r.text('1 UNIT = '+s.physics.unitCubicMetres+' m3',282,154,13,RS_MUTED);
  const x=28,y=172,w=442,h=188,sx=w/512,sy=h/256;r.sprite('rs_basin',x+w/2,y+h/2,w,h,0,'#fff');
  const waterX=x+105*sx,waterW=291*sx,bottom=y+197*sy,waterH=93*sy*s.storedUnits/s.capacityUnits;
  r.sprite('rs_water',waterX+waterW/2,bottom-waterH/2,waterW,waterH,0,'#fff');
  for(let n=0;n<=4;n++){const yy=bottom-93*sy*n/4;r.line(waterX-9,yy,waterX-3,yy,1,'#688b88');}
  r.line(waterX,bottom-waterH,waterX+waterW,bottom-waterH,1,'#cde5d8');r.sprite('rs_dam',393,281,94,118,0,'#fff');
  r.text('YEAR IN +'+s.totalInflowUnits,30,374,15,RS_INK);r.text('EVAP -'+s.totalEvaporationUnits,190,374,15,RS_MUTED);r.text('SPILL -'+s.totalOverflowUnits,340,374,15,RS_WARN);
  r.text('RESERVED '+s.reservedUndeliveredUnits,30,401,14,RS_MUTED);r.text('FREE '+s.unallocatedStoredUnits,190,401,14,RS_INK);r.text('OUT '+s.inventory.totalDeliveredUnits,340,401,14,RS_INK);
}
function rsRecipients(r,s){
  const current=s.seasons[s.seasonIndex],tiles=['rs_town','rs_farm','rs_river'];
  for(let i=0;i<3;i++){
    const y=144+i*95,selected=s.phase==='playing'&&s.stage==='planning'&&s.cursor===i;
    r.rect(520,y,420,86,selected?'#e5e8d1':'#e9ead9');if(selected)r.rect(520,y,3,86,'#729d98');
    r.sprite(tiles[i],579,y+45,116,67,0,'#fff');r.text(RS_CATEGORIES[i],644,y+5,17,RS_INK);
    r.text('RECEIVED '+s.currentDeliveredUnits[i]+' / '+current.demandUnits[i],644,y+28,17,RS_INK);
    r.text('YEAR '+s.deliveredUnits[i]+'/'+s.annualDemandUnits[i]+' / MIN '+s.minimumFulfillmentPercent[i]+'%',644,y+51,13,s.annualTargetsMet[i]?'#477d67':RS_MUTED);
    const note=i===0?'SEASON FLOOR >= '+current.residentFloorUnits:i===1?(s.annualTargetsMet[i]?'YEAR GOAL MET':'YEAR GOAL NOT YET'):'DRY SEASONS '+s.riverDryStreak+'/'+s.physics.drySeasonFailureCount;
    r.text(note,644,y+69,13,i===2&&s.riverDryStreak>0?RS_WARN:RS_MUTED);
  }
}
function rsChoices(r,s){
  for(let i=0;i<4;i++){
    const x=20+i*235,y=435,editable=s.phase==='playing'&&s.stage==='planning',selected=editable&&s.cursor===i;
    r.rect(x,y,215,54,selected?'#d0dfcc':'#e4e5d1');if(selected){r.rect(x,y,215,3,'#598b84');r.rect(x,y+51,215,3,'#598b84');}
    r.text(i<3?RS_CATEGORIES[i]:'COMMIT SEASON',x+12,y+7,16,RS_INK);
    const value=i<3?(editable?'PLAN ':'LOCKED ')+s.planUnits[i]:s.phase!=='playing'?'FINAL ACCOUNT':s.stage==='releasing'?'RELEASE IN PROGRESS':s.inputState.quarantined?'RELEASE CONTROLS':'A: START RELEASE';
    r.text(value,x+12,y+30,i<3?18:14,editable?RS_INK:RS_MUTED);
  }
}
function rsHeaderFooter(r,s){
  r.rect(0,0,960,44,RS_INK);r.text('RESERVOIR SEASONS',22,12,22,'#f3ecd2');r.text(s.levelNameEn.toUpperCase(),358,17,13,'#d7e0d0');r.text('SEASON '+(s.seasonIndex+1)+' / 4',788,15,16,'#e8dcb3');
  r.rect(0,500,960,40,RS_INK);let title,detail,right='';
  if(s.phase==='won'){title='FOUR SEASONS COMPLETE';detail='FINAL WATER ACCOUNT / THREE INDEPENDENT GOALS';}
  else if(s.phase==='lost'){title='ENDED / '+s.lostReason.toUpperCase().replace(/-/g,' ');detail='FINAL WATER ACCOUNT / NO CROSS-CATEGORY OFFSET';}
  else if(s.stage==='releasing'){title='RELEASING / INPUT LOCKED';detail='THIS SEASON RECEIVED '+s.currentDeliveredUnits.reduce((a,b)=>a+b,0)+' / '+s.planTotalUnits;right=s.releaseSecondsRemaining.toFixed(1)+'s LEFT';}
  else{title=s.inputState.quarantined?'RELEASE CONTROLS TO PLAN':'A: ADD '+s.physics.allocationQuantumUnits+' / B: UNDO / COMMIT TO RELEASE';detail='R / F / E = RESIDENTS / FARMS / ECOLOGICAL RIVER';right='UNTIMED PLANNING';}
  r.text(title,22,505,16,'#f5efd7');r.text(detail,22,525,13,'#ccddcf');if(right)r.text(right,940-r.measureText(right,14),507,14,'#d8e5d1');
}
window.GameDef={id:'reservoir-seasons',title:'四季蓄水',seed:730,accent:'#5695a1',background:'#dce3d1',atlas:RS_ATLAS,holdConfirmAsA:false,
  description:'左右选去向或提交栏。A 增加5单位计划，B撤销最近配水；提交后放水8秒且不能改动。规划无时限。保住居民底线，避免河流连续两季断流，并分别完成三方年度目标。',
  controls:{move:'左右选择配水栏',a:'加5·提交 / 空格',b:'撤销配水 / B'},actionLabels:['配水 / 提交','撤销配水'],levelLabel:'流域',levelNames:['春汛入库','旱季留水','洪峰与冬储'],
  tip:'四季预报全部公开。蒸发和溢流不会回库，未用水结转下季。计划提交前才能撤销。',winTitle:'四季供水完成',loseTitle:'本年供水失衡',
  result(s){if(s.phase==='won')return'四季结算完成，三方年度目标均已达到。';if(s.lostReason==='resident-floor')return'本季居民供水低于底线。先保住每季最低用水。';if(s.lostReason==='river-dry-streak')return'河流连续两季断流。记得为生态河流留水。';return'有类别未达年度目标。三方需求分别结算。';},
  hud(s){return[{label:'季节',value:['春','夏','秋','冬'][s.seasonIndex]+' · '+(s.seasonIndex+1)+'/4',tone:''},{label:'库存',value:s.storedUnits+' 单位',tone:''},{label:'未分配',value:s.unallocatedStoredUnits+' 单位',tone:s.unallocatedStoredUnits===0?'warn':''},{label:s.phase!=='playing'?'阶段':s.stage==='planning'?'规划':'放水',value:s.phase!=='playing'?'已结束':s.stage==='planning'?'不限时':s.releaseSecondsRemaining.toFixed(1)+' s',tone:''}];},
  render(r,s){r.sprite('rs_ground',480,270,960,540,0,'#fff');rsForecasts(r,s);rsBranches(r,s);rsReservoir(r,s);rsRecipients(r,s);rsChoices(r,s);rsHeaderFooter(r,s);}
};
