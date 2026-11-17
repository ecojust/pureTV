/* Original smooth 2.5D art direction for Gravity Courier. */
(function(root){
  'use strict';
  const stars=Array.from({length:118},(_,i)=>({x:(i*7919+29)%956+2,y:(i*3571+61)%536+2,size:i%9===0?1.7:.7,alpha:i%4===0?.8:.35}));
  function dashed(r,x1,y1,x2,y2,color,offset){const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);if(len<1)return;for(let d=offset%18;d<len;d+=18){const end=Math.min(d+7,len);r.line(x1+dx*d/len,y1+dy*d/len,x1+dx*end/len,y1+dy*end/len,1,color);}}
  root.GameDef={
    id:'gravity-courier',title:'引力快递',tagline:'让每一份小小的托付，抵达星海的另一边',seed:17,
    accent:'#6fe4d6',background:'#081225',
    description:'轻推摇杆，为小艇提供推力。靠近货箱自动拾取，在指定空间站减速后按 A 交付。完成三次配送，让星海中的托付抵达。',
    controls:{move:'摇杆 / 方向键：推动小艇',a:'交付货物 · 空格 / 右上半屏',b:'按住减速 · B / 右下半屏'},
    actionLabels:['交付货物','减速'],
    tip:'松开摇杆后小艇仍会滑行。接近空间站时提前按住 B 减速；青色补给站可以补充燃料。',
    winTitle:'星海配送完成',loseTitle:'这趟航线还差一点',
    result(s){return s.phase==='won'?'三份货物都已送达。完成用时 '+Math.ceil(s.elapsed)+' 秒，获得 '+Math.floor(s.score)+' 分。':(s.message||'调整航线，再出发一次。')+' 已完成 '+s.deliveries+' / '+s.target+' 次配送。';},
    hud(s){const p=s.player;return[{label:'配送进度',value:s.deliveries+' / '+s.target,tone:'good'},{label:'燃料',value:Math.ceil(p.fuel)+'%',tone:p.fuel<25?'warn':''},{label:'护盾',value:Math.ceil(p.shield)+'%',tone:p.shield<40?'warn':''},{label:'剩余时间',value:Math.max(0,Math.ceil(s.remaining))+' s'},{label:'航行速度',value:Math.round(Math.hypot(p.vx,p.vy))+' m/s'}];},
    render(r,s,t,input){
      const p=s.player;
      // Large atlas glows and sparse stars provide depth without post-processing passes.
      r.sprite('glow',190,95,700,520,0,'#10294f');r.sprite('glow',790,430,640,510,0,'#132e42');
      stars.forEach(star=>r.circle(star.x,star.y,star.size,star.alpha>.5?'#647d9e':'#31455f'));
      for(let x=0;x<=960;x+=80)r.line(x,0,x,540,.5,'#122239');
      for(let y=0;y<=540;y+=90)r.line(0,y,960,y,.5,'#122239');
      r.rect(16,16,120,2,'#32506b');r.text('SECTOR  /  07',19,26,11,'#67849e');
      r.text('GRAVITY COURIER',19,43,9,'#42617e');
      s.planets.forEach((planet,i)=>{
        const rad=planet.radius;
        r.sprite('glow',planet.x,planet.y,rad*4.4,rad*4.4,0,i===1?'#3d285f':'#133c52');
        r.sprite('ring',planet.x,planet.y,rad*3.1,rad*2.1,.3+i*.6,'#35516b');
        r.sprite('shadow',planet.x+12,planet.y+20,rad*2.6,rad*2.6,0,'#070c18');
        r.sprite('orb',planet.x,planet.y,rad*2,rad*2,0,planet.color||['#86b3c8','#b29bd9','#85baa1'][i%3]);
        r.text('G'+(i+1),planet.x-8,planet.y+rad+12,10,'#68829b');
      });
      const cargo=s.parcels.find(c=>c.id===p.cargo),active=s.parcels.find(c=>c.id===s.activeParcelId),target=cargo?s.stations.find(st=>st.id===cargo.stationId):active;
      if(target)dashed(r,p.x,p.y,target.x,target.y,cargo?'#426d71':'#52546f',t*8);
      s.stations.forEach((station,i)=>{
        const fuel=station.kind==='fuel',color=fuel?'#62d4c6':station.color||'#80adf4',done=s.parcels.some(c=>c.stationId===station.id&&c.status==='delivered');
        r.sprite('glow',station.x,station.y,104,104,0,fuel?'#123e42':'#192f50');
        r.sprite('ring',station.x,station.y,station.dockingRadius*2,station.dockingRadius*2,0,done?'#5fe5ae':color);
        r.sprite('shadow',station.x+4,station.y+10,72,45,0,'#040a16');
        r.sprite('station',station.x,station.y,56,56,0,color);
        if(done)r.circle(station.x,station.y,5,'#9bffcd');
        r.text(fuel?'FUEL':('DOCK '+(i+1)),station.x-22,station.y+34,9,done?'#99f2c4':'#9bb4cd');
      });
      s.parcels.filter(c=>c.status==='waiting').forEach((parcel,i)=>{
        const activeNow=parcel.id===s.activeParcelId;
        if(activeNow)r.sprite('ring',parcel.x,parcel.y,39+Math.sin(t*3)*3,39+Math.sin(t*3)*3,0,'#d5b776');
        r.sprite('shadow',parcel.x+3,parcel.y+8,30,16,0,'#030917');
        r.sprite('crate',parcel.x,parcel.y,25,25,Math.sin(t+i)*.06,activeNow?'#e9cb96':'#67839a');
        if(activeNow)r.text('PICK UP',parcel.x-21,parcel.y-29,9,'#dfc185');
      });
      if(p.thrusting&&p.fuel>0){const length=22+Math.sin(t*30)*5,dx=Math.cos(p.angle),dy=Math.sin(p.angle);r.sprite('glow',p.x-dx*22,p.y-dy*22,length,20,p.angle,'#5ddfc5');r.sprite('spark',p.x-dx*17,p.y-dy*17,20,8,p.angle,'#c4fff0');}
      r.sprite('shadow',p.x+6,p.y+12,46,32,p.angle,'#020814');
      if(p.invulnerable>0)r.sprite('ring',p.x,p.y,54,54,0,Math.sin(t*30)>0?'#f5b2a7':'#706a88');
      if(p.braking)r.sprite('ring',p.x,p.y,40,40,0,'#71b4e6');
      r.sprite('ship',p.x,p.y,29,39,p.angle+Math.PI/2,'#d1e7f2');
      if(cargo)r.sprite('crate',p.x-Math.cos(p.angle)*11,p.y-Math.sin(p.angle)*11,10,10,p.angle,'#eacb91');
      r.rect(17,513,925,1,'#253a50');r.text('THRUST  /  COAST  /  DELIVER',20,522,9,'#536f8a');
      r.text('3 CARGO - 1 PILOT - AN OPEN SKY',731,522,9,'#536f8a');
    }
  };
})(window);
