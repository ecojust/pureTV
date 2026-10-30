/* Original closed road circuits, expressed in metres. No render-engine dependency.
 * World XZ is horizontal, Y is height; heading 0 points +Z, positive turns to +X.
 * Positive lateral offset is right of travel: (nx,nz) = (tz,-tx). */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UsedCarTracks=api;})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var TAU=Math.PI*2,COUNT=640;
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function wrap(x,n){return ((x%n)+n)%n;}
  function angle(x){return Math.atan2(Math.sin(x),Math.cos(x));}
  function curve(points,t){
    var i=Math.floor(t),u=t-i,n=points.length,a=points[wrap(i-1,n)],b=points[wrap(i,n)],c=points[wrap(i+1,n)],d=points[wrap(i+2,n)],out=[];
    for(var k=0;k<3;k++)out[k]=.5*((2*b[k])+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-d[k])*u*u+(-a[k]+3*b[k]-3*c[k]+d[k])*u*u*u);
    return {x:out[0],z:out[1],y:out[2]};
  }
  function build(data){
    var raw=[],length=0,previous;
    for(var i=0;i<=COUNT*4;i++){var p=curve(data.control,i/(COUNT*4)*data.control.length);if(previous)length+=Math.hypot(p.x-previous.x,p.z-previous.z);p.s=length;raw.push(p);previous=p;}
    data.length=length;data.points=[];var cursor=0;
    for(i=0;i<COUNT;i++){
      var s=i/COUNT*length;while(cursor<raw.length-2&&raw[cursor+1].s<s)cursor++;
      var a=raw[cursor],b=raw[cursor+1],u=(s-a.s)/(b.s-a.s||1);
      data.points.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,s:s,index:i});
    }
    var step=length/COUNT;
    for(i=0;i<COUNT;i++){
      p=data.points[i];a=data.points[wrap(i-1,COUNT)];b=data.points[(i+1)%COUNT];var dx=b.x-a.x,dz=b.z-a.z,span=Math.hypot(dx,dz)||1;
      p.tx=dx/span;p.tz=dz/span;p.nx=p.tz;p.nz=-p.tx;p.heading=Math.atan2(p.tx,p.tz);p.grade=(b.y-a.y)/span;
      p.width=data.width;p.grip=data.surfaceGrip;
    }
    data.bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
    data.points.forEach(function(p,i){
      var a=data.points[wrap(i-1,COUNT)],b=data.points[(i+1)%COUNT];p.curvature=angle(b.heading-a.heading)/(2*step);
      p.bank=clamp(p.curvature*(data.id==='ridge'?28:20),-.09,.09);
      if(data.id==='harbor'&&p.s/length>.22&&p.s/length<.41)p.grip*=.92;
      if(data.id==='solar'&&p.s/length>.68&&p.s/length<.78)p.grip*=.90;
      data.bounds.minX=Math.min(data.bounds.minX,p.x);data.bounds.maxX=Math.max(data.bounds.maxX,p.x);data.bounds.minZ=Math.min(data.bounds.minZ,p.z);data.bounds.maxZ=Math.max(data.bounds.maxZ,p.z);
    });
    return data;
  }
  var all=[
    build({id:'harbor',name:'霓虹港湾',enName:'NEON DOCKLANDS',subtitle:'雨后高架 · 海港夜赛',enSubtitle:'AFTER-RAIN VIADUCT / NIGHT RUN',width:13.8,surfaceGrip:.94,theme:'harbor',laps:3,control:[[-180,-250,5],[20,-300,5],[220,-230,9],[260,-40,20],[180,180,19],[20,260,7],[-180,210,4],[-250,40,4]]}),
    build({id:'ridge',name:'云脊公路',enName:'CLOUDLINE PASS',subtitle:'悬崖弯道 · 高差约 65 米',enSubtitle:'CLIFFSIDE SWITCHBACKS / ~65 M ELEVATION RANGE',width:11.8,surfaceGrip:1.03,theme:'ridge',laps:3,control:[[-150,-300,10],[40,-320,18],[170,-180,36],[100,-30,48],[240,100,60],[140,270,72],[-60,300,55],[-220,160,36],[-100,20,18],[-270,-120,8]]}),
    build({id:'solar',name:'落日能源环线',enName:'SOLAR OUTRUN',subtitle:'光伏阵列 · 荒漠高速',enSubtitle:'SOLAR FIELDS / DESERT EXPRESSWAY',width:14.4,surfaceGrip:1.0,theme:'solar',laps:3,control:[[-250,-200,2],[-30,-300,5],[230,-230,2],[340,-40,10],[240,180,16],[0,260,6],[-200,200,3],[-280,20,4]]})
  ];
  function get(id){if(typeof id==='object'&&id&&id.points)return id;if(typeof id==='number')return all[wrap(id,all.length)];for(var i=0;i<all.length;i++)if(all[i].id===id)return all[i];return all[0];}
  function sample(track,distance){
    track=get(track);var s=wrap(distance,track.length),index=s/track.length*COUNT,i=Math.floor(index),u=index-i,a=track.points[i],b=track.points[(i+1)%COUNT],heading=a.heading+angle(b.heading-a.heading)*u,tx=Math.sin(heading),tz=Math.cos(heading);
    return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,tx:tx,tz:tz,nx:tz,nz:-tx,heading:heading,curvature:a.curvature+(b.curvature-a.curvature)*u,grade:a.grade+(b.grade-a.grade)*u,bank:a.bank+(b.bank-a.bank)*u,grip:a.grip+(b.grip-a.grip)*u,width:track.width,s:s,index:i};
  }
  function nearest(track,x,z,hint){
    track=get(track);var points=track.points,best=Infinity,index=0,ratio=0;
    // A complete circuit search avoids snapping to the wrong branch after resets,
    // impacts or teleporting previews; 640 cheap segment tests stay deterministic.
    for(var i=0;i<points.length;i++){
      var a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z,u=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1),0,1),ex=x-a.x-dx*u,ez=z-a.z-dz*u,d=ex*ex+ez*ez;
      if(d<best){best=d;index=i;ratio=u;}
    }
    var p=sample(track,(index+ratio)/COUNT*track.length);p.lateral=(x-p.x)*p.nx+(z-p.z)*p.nz;p.distance=Math.sqrt(best);return p;
  }
  return {all:all,get:get,sample:sample,nearest:nearest,wrap:wrap,angle:angle};
});
