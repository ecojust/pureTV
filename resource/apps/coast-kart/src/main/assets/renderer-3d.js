/* Original real-time 3D kart scenery. Local Three.js r124, explicitly WebGL 1.
 * The deterministic game owns movement; this scene only presents that state. */
(function (root) {
  "use strict";
  var T = root.THREE, TAU = Math.PI * 2;
  var THEMES = {
    coast: { sky: 0x8fdaf5, fog: 0xc2e9ed, ground: 0x71b65d, sand: 0xf5d99c, road: 0x586578, curb: 0xf36f59, water: 0x30b9cf, tree: 0x3baf63, rock: 0x79bba6 },
    forest: { sky: 0x94c9d6, fog: 0xc6dacf, ground: 0x519558, sand: 0xa9bb7b, road: 0x536368, curb: 0xe8b552, water: 0x418d95, tree: 0x247754, rock: 0x748b79 },
    canyon: { sky: 0xffce9f, fog: 0xefb690, ground: 0xca8653, sand: 0xe6b577, road: 0x686674, curb: 0xffba59, water: 0x7ba899, tree: 0x5a9158, rock: 0xb96842 },
    harbor: { sky: 0x111c3b, fog: 0x253451, ground: 0x475a70, sand: 0x73859b, road: 0x39465c, curb: 0x4df0de, water: 0x153c5c, tree: 0x37877c, rock: 0x293955 },
  };
  var COLORS = [0xff784b,0x43d6b9,0x9b7af2,0xffc342,0x51aaf0,0xeb78bd,0xaccb56,0xd3a17e];
  function mod(v,n) { return ((v%n)+n)%n; }
  function matrix(x,y,z,sx,sy,sz,rx,ry,rz) {
    var m=new T.Matrix4(),q=new T.Quaternion();
    q.setFromEuler(new T.Euler(rx||0,ry||0,rz||0));
    return m.compose(new T.Vector3(x,y,z),q,new T.Vector3(sx||1,sy||1,sz||1));
  }
  function merge(parts) {
    var positions=[],normals=[];
    parts.forEach(function(p) {
      var g=p.g.index?p.g.toNonIndexed():p.g.clone();
      g.applyMatrix4(p.m);
      var a=g.attributes.position.array,n=g.attributes.normal.array;
      for(var i=0;i<a.length;i++) { positions.push(a[i]);normals.push(n[i]); }
      g.dispose();
    });
    var geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    return geometry;
  }
  function Scene3D() {
    this.active=false;this.failed=false;this.contextLost=false;this.frames=0;
    this.drawCalls=0;this.triangles=0;this.lastFrameMs=0;this.disposed=false;
    this.materials=[];this.geometries=[];this.textures=[];
    if(!T) {this.failed=true;return;}
    try {
      this.canvas=document.createElement('canvas');
      var attrs={alpha:false,antialias:true,depth:true,preserveDrawingBuffer:true,powerPreference:'low-power'};
      var gl=this.canvas.getContext('webgl',attrs)||this.canvas.getContext('experimental-webgl',attrs);
      if(!gl) throw new Error('WebGL 1 unavailable');
      this.supportsInstancing=!!gl.getExtension('ANGLE_instanced_arrays');
      this.renderer=new T.WebGLRenderer({canvas:this.canvas,context:gl,antialias:true,alpha:false,preserveDrawingBuffer:true});
      this.renderer.setPixelRatio(1);
      this.renderer.outputEncoding=T.sRGBEncoding;
      this.renderer.toneMapping=T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=.95;
      var self=this;
      this.canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();self.contextLost=true;self.failed=true;self.active=false;});
      this.canvas.addEventListener('webglcontextrestored',function(){if(!self.disposed){self.contextLost=false;self.failed=false;self.error='';}});
      this.scene=new T.Scene();
      this.camera=new T.PerspectiveCamera(54,16/9,0.1,320);
      this.hemi=new T.HemisphereLight(0xdff6ff,0x66734f,.65);
      this.sun=new T.DirectionalLight(0xffecd0,1.35);this.sun.position.set(-25,48,18);
      this.scene.add(this.hemi,this.sun);
      this.dummy=new T.Object3D();this.points=[];
      this.buildGeometry();this.buildKarts();this.buildRoad();this.buildScenery();this.buildItems();
    } catch(error) {this.failed=true;this.error=String(error.message||error);this.errorStack=String(error.stack||error);this.dispose();}
  }
  Scene3D.prototype.geo=function(g){this.geometries.push(g);return g;};
  Scene3D.prototype.mat=function(color,rough,metal,emissive){
    var m=new T.MeshPhongMaterial({color:color,shininess:(1-(rough === undefined ? .65 : rough))*90+8,specular:metal?0xc4d7e7:0x555555,emissive:emissive||0});
    m.color.convertSRGBToLinear();m.emissive.convertSRGBToLinear();
    this.materials.push(m);return m;
  };
  Scene3D.prototype.mesh=function(g,m,parent){var o=new T.Mesh(g,m);(parent||this.scene).add(o);return o;};
  Scene3D.prototype.buildGeometry=function(){
    this.box=this.geo(new T.BoxBufferGeometry(1,1,1));
    this.ball=this.geo(new T.SphereBufferGeometry(1,16,10));
    this.lowBall=this.geo(new T.SphereBufferGeometry(1,10,6));
    this.cylinder=this.geo(new T.CylinderBufferGeometry(1,1,1,14));
    this.cone=this.geo(new T.ConeBufferGeometry(1,1,8));
    this.tire=this.geo(new T.TorusBufferGeometry(.34,.16,6,14));
    this.ring=this.geo(new T.TorusBufferGeometry(1,.035,6,32));
    this.dark=this.mat(0x172738,.9);this.silver=this.mat(0xb2c7cf,.3,.65);
    this.white=this.mat(0xfff6d8,.38,.1);this.skin=this.mat(0xf4bd8e,.8);
    this.visor=this.mat(0x153c59,.16,.5);this.suit=this.mat(0x234968,.7);
    var shadow=document.createElement('canvas');shadow.width=64;shadow.height=64;
    var c=shadow.getContext('2d'),gradient=c.createRadialGradient(32,32,3,32,32,32);
    gradient.addColorStop(0,'rgba(8,19,32,.65)');gradient.addColorStop(.45,'rgba(8,19,32,.32)');gradient.addColorStop(1,'rgba(8,19,32,0)');
    c.fillStyle=gradient;c.fillRect(0,0,64,64);
    var texture=new T.CanvasTexture(shadow);this.textures.push(texture);
    this.shadowMaterial=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});this.materials.push(this.shadowMaterial);
    this.shadowGeometry=this.geo(new T.PlaneBufferGeometry(4.7,5.4));
    var body=[],frame=[],wheels=[],hubs=[],suit=[],skin=[],trim=[],visor=[];
    function part(list,g,x,y,z,sx,sy,sz,rx,ry,rz){list.push({g:g,m:matrix(x,y,z,sx,sy,sz,rx,ry,rz)});}
    part(body,this.ball,0,.76,-.08,1.15,.42,1.65);
    part(body,this.ball,0,.89,-1.16,.78,.35,.81);
    part(body,this.box,0,1.15,1.25,2.32,.15,.48);
    [-1,1].forEach(function(side){
      part(body,this.ball,side*1.04,.92,-.85,.42,.22,.57);
      part(body,this.ball,side*1.04,.92,1.02,.42,.22,.57);
      part(frame,this.box,side*.87,.59,0,.13,.13,2.55);
      [-.98,1.03].forEach(function(z){
        part(wheels,this.tire,side*1.25,.5,z,1,1,1,0,Math.PI/2,0);
        part(hubs,this.cylinder,side*1.27,.5,z,.25,.38,.25,0,0,Math.PI/2);
      },this);
      part(frame,this.box,side*.75,.95,1.17,.1,.57,.1);
      part(suit,this.ball,side*.4,1.47,-.18,.22,.48,.22,0,0,-side*.42);
      part(skin,this.ball,side*.58,1.24,-.48,.2,.18,.2);
      part(suit,this.ball,side*.31,1.02,-.5,.25,.22,.5);
      part(trim,this.ball,side*.68,.92,-1.64,.25,.1,.12);
    },this);
    part(frame,this.box,0,.54,0,2.45,.12,2.6);
    part(frame,this.ball,0,1.04,.28,.69,.43,.75);
    part(hubs,this.cylinder,0,.69,1.46,.24,.76,.24,Math.PI/2,0,0);
    part(frame,this.cylinder,0,.69,1.85,.18,.025,.18,Math.PI/2,0,0);
    part(suit,this.ball,0,1.48,.25,.57,.62,.43);
    part(skin,this.ball,0,2.11,.15,.48,.49,.47);
    part(body,this.ball,0,2.36,.22,.58,.48,.57);
    part(visor,this.ball,0,2.18,-.12,.53,.23,.38);
    part(trim,this.box,0,2.7,.19,.15,.025,.63);
    part(trim,this.box,0,.98,-1.35,.26,.04,.74);
    this.kartParts=[body,frame,wheels,hubs,suit,skin,trim,visor].map(function(parts){return this.geo(merge(parts));},this);
    this.lowKartPaint=this.geo(merge([{g:this.lowBall,m:matrix(0,.8,0,1.2,.4,1.65)},{g:this.lowBall,m:matrix(0,2.3,.2,.58,.5,.58)},{g:this.box,m:matrix(0,1.15,1.2,2.3,.15,.45)}]));
    var lowDark=[{g:this.lowBall,m:matrix(0,1.5,.2,.55,.6,.45)}];
    [-1,1].forEach(function(side){[-1,1].forEach(function(z){lowDark.push({g:this.cylinder,m:matrix(side*1.2,.5,z,.48,.35,.48,0,0,Math.PI/2)});},this);},this);
    this.lowKartDark=this.geo(merge(lowDark));
  };
  Scene3D.prototype.buildKarts=function(){
    this.karts=[];
    for(var i=0;i<8;i++){
      var group=new T.Group(),paint=this.mat(COLORS[i],.28,.15);
      var materials=[paint,this.dark,this.dark,this.silver,this.suit,this.skin,this.white,this.visor];
      var details=[];
      this.kartParts.forEach(function(g,j){details.push(this.mesh(g,materials[j],group));},this);
      var low=new T.Group();this.mesh(this.lowKartPaint,paint,low);this.mesh(this.lowKartDark,this.dark,low);group.add(low);low.visible=false;
      var shadow=this.mesh(this.shadowGeometry,this.shadowMaterial,group);shadow.rotation.x=-Math.PI/2;shadow.position.y=.035;
      var glow=this.mat(0x67f8ec,.3,.15,0x247d78);
      var shield=this.mesh(this.geo(new T.SphereBufferGeometry(1,16,10)),glow,group);
      shield.material=glow.clone();shield.material.transparent=true;shield.material.opacity=.17;shield.material.depthWrite=false;this.materials.push(shield.material);
      shield.scale.set(1.85,1.9,2.4);shield.position.y=1;shield.visible=false;
      var flameMaterial=this.mat(0xffc65e,.35,0,0xff8432),flames=[];
      [-.48,.48].forEach(function(x){var flame=this.mesh(this.cone,flameMaterial,group);flame.position.set(x,.64,1.85);flame.rotation.x=Math.PI/2;flame.scale.set(.23,1.3,.23);flames.push(flame);},this);
      var sparks=this.mesh(this.geo(new T.TorusBufferGeometry(1.33,.045,5,24,Math.PI)),this.mat(0x69e7ff,.5,0,0x2c9bbd),group);
      sparks.rotation.x=Math.PI/2;sparks.position.set(0,.17,.4);sparks.visible=false;
      var held=new T.Group();group.add(held);held.position.set(0,.65,2.5);
      var heldBall=this.mesh(this.lowBall,this.mat(0xb59bff,.26,.35,0x36275e),held);heldBall.scale.setScalar(.37);
      var heldTrap=this.mesh(this.cone,this.mat(0xffae58,.5),held);heldTrap.scale.set(.45,.7,.45);
      this.scene.add(group);this.karts.push({group:group,details:details,low:low,shield:shield,flames:flames,sparks:sparks,held:held,heldBall:heldBall,heldTrap:heldTrap});
    }
  };
  Scene3D.prototype.buildRoad=function(){
    this.roadGeometry=this.geo(new T.BufferGeometry());
    this.roadPositions=new Float32Array(54*13*18);this.roadColors=new Float32Array(this.roadPositions.length);this.roadUvs=new Float32Array(this.roadPositions.length/3*2);
    this.roadGeometry.setAttribute('position',new T.BufferAttribute(this.roadPositions,3).setUsage(T.DynamicDrawUsage));
    this.roadGeometry.setAttribute('color',new T.BufferAttribute(this.roadColors,3).setUsage(T.DynamicDrawUsage));
    this.roadGeometry.setAttribute('uv',new T.BufferAttribute(this.roadUvs,2).setUsage(T.DynamicDrawUsage));
    this.roadMaterial=this.mat(0xffffff,.94);this.roadMaterial.vertexColors=true;this.roadMaterial.side=T.DoubleSide;
    var asphalt=document.createElement('canvas');asphalt.width=asphalt.height=256;
    var ac=asphalt.getContext('2d');ac.fillStyle='#ffffff';ac.fillRect(0,0,256,256);
    var seed=712367;
    for(var grain=0;grain<10000;grain++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;var gx=seed%256;seed=(Math.imul(seed,1664525)+1013904223)>>>0;var gy=seed%256;ac.fillStyle='rgba(18,35,45,'+(.02+(seed%5)*.015)+')';ac.fillRect(gx,gy,1,1);}
    var roadTexture=new T.CanvasTexture(asphalt);roadTexture.wrapS=roadTexture.wrapT=T.RepeatWrapping;roadTexture.encoding=T.sRGBEncoding;this.textures.push(roadTexture);this.roadMaterial.map=roadTexture;
    this.road=this.mesh(this.roadGeometry,this.roadMaterial);this.road.frustumCulled=false;
    var waterMaterial=this.mat(0x30b9cf,.22,.4);this.water=this.mesh(this.geo(new T.PlaneBufferGeometry(900,900)),waterMaterial);this.water.rotation.x=-Math.PI/2;this.water.position.set(0,-2,-100);
    var foam=document.createElement('canvas');foam.width=foam.height=256;var fc=foam.getContext('2d');
    fc.strokeStyle='rgba(239,255,255,.85)';fc.lineWidth=4;
    for(var wave=0;wave<7;wave++){fc.beginPath();for(var x=0;x<=256;x+=4){var y=wave*37+Math.sin(x/31+wave)*5;if(x)fc.lineTo(x,y);else fc.moveTo(x,y);}fc.stroke();}
    var foamTexture=new T.CanvasTexture(foam);foamTexture.wrapS=foamTexture.wrapT=T.RepeatWrapping;foamTexture.repeat.set(40,40);this.textures.push(foamTexture);
    this.foam=this.mesh(this.water.geometry,new T.MeshBasicMaterial({map:foamTexture,transparent:true,opacity:.58,depthWrite:false}));this.materials.push(this.foam.material);this.foam.rotation.x=-Math.PI/2;this.foam.position.set(0,-1.98,-100);
  };
  Scene3D.prototype.instances=function(geometry,material,count){
    var mesh;
    if(this.supportsInstancing){
      mesh=new T.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    }else{
      // Older WebGL 1 devices keep real geometry with a smaller scenery pool.
      mesh=new T.Group();mesh.material=material;mesh.instanceMatrix={needsUpdate:false};
      for(var i=0;i<Math.min(count,12);i++){var child=new T.Mesh(geometry,material);child.matrixAutoUpdate=false;mesh.add(child);}
      mesh.setMatrixAt=function(index,matrix){if(this.children[index])this.children[index].matrix.copy(matrix);};
    }
    mesh.frustumCulled=false;this.scene.add(mesh);return mesh;
  };
  Scene3D.prototype.buildScenery=function(){
    var trunkParts=[],leafParts=[];
    trunkParts.push({g:this.cylinder,m:matrix(0,2.7,0,.28,5.4,.28,0,0,-.1)});
    var leafPositions=[];
    for(var leafSegment=0;leafSegment<6;leafSegment++){
      var t0=leafSegment/6,t1=(leafSegment+1)/6;
      var leafVertices=[[t0*3.7,-t0*t0*.9,-Math.sin(t0*Math.PI)*.55],[t0*3.7,-t0*t0*.9,Math.sin(t0*Math.PI)*.55],[t1*3.7,-t1*t1*.9,-Math.sin(t1*Math.PI)*.55],[t1*3.7,-t1*t1*.9,Math.sin(t1*Math.PI)*.55]];
      [0,1,2,1,3,2].forEach(function(v){leafPositions.push.apply(leafPositions,leafVertices[v]);});
    }
    var frond=this.geo(new T.BufferGeometry());frond.setAttribute('position',new T.Float32BufferAttribute(leafPositions,3));frond.computeVertexNormals();
    for(var n=0;n<7;n++){
      var angle=n*TAU/7;
      leafParts.push({g:frond,m:matrix(0,5.7,0,1,1,1,0,-angle,-.15)});
    }
    this.palms={trunks:this.instances(this.geo(merge(trunkParts)),this.mat(0x99734d,.9),28),leaves:this.instances(this.geo(merge(leafParts)),this.mat(0x3baf63,.7),28)};
    this.palms.leaves.material.side=T.DoubleSide;
    var pine=[];
    [0,1,2].forEach(function(i){pine.push({g:this.cone,m:matrix(0,2+i*1.4,0,2.2-i*.45,4.6-i*.4,2.2-i*.45)});},this);
    this.pines={trunks:this.instances(this.cylinder,this.mat(0x785a3f,1),36),leaves:this.instances(this.geo(merge(pine)),this.mat(0x237c56,.9),36)};
    this.rocks=this.instances(this.geo(new T.DodecahedronBufferGeometry(1,0)),this.mat(0xb96842,.95),36);
    this.buildings=this.instances(this.box,this.mat(0x334b70,.5,.22),30);
    this.windows=this.instances(this.box,this.mat(0x6cf4e7,.3,.1,0x45b5c0),90);
    this.rails=this.instances(this.box,this.mat(0xe7eef0,.4,.45),108);
    this.posts=this.instances(this.cylinder,this.mat(0xeef2e2,.45,.2),108);
    function signMaterial(left){
      var canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;var context=canvas.getContext('2d');
      context.fillStyle='#ffcf48';context.fillRect(0,0,256,128);context.fillStyle='#163b55';context.fillRect(7,7,242,114);
      if(left){context.translate(256,0);context.scale(-1,1);}
      context.fillStyle='#ffdf66';
      for(var arrow=0;arrow<3;arrow++){var start=22+arrow*76;context.beginPath();context.moveTo(start,24);context.lineTo(start+27,24);context.lineTo(start+66,64);context.lineTo(start+27,104);context.lineTo(start,104);context.lineTo(start+38,64);context.closePath();context.fill();}
      var texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;this.textures.push(texture);
      var material=this.mat(0xffffff,.8);material.map=texture;return material;
    }
    this.banners=this.instances(this.box,signMaterial.call(this,false),12);
    this.bannersLeft=this.instances(this.box,signMaterial.call(this,true),12);
    // Keep instanced materials separate from ordinary kart meshes (Three r124 program cache).
    this.signPosts=this.instances(this.box,this.mat(0xb2c7cf,.3,.65),12);
    this.mountains=this.instances(this.geo(new T.ConeBufferGeometry(1,1,7)),this.mat(0x79bba6,.95),12);
    this.clouds=this.instances(this.geo(merge([
      {g:this.lowBall,m:matrix(0,0,0,5,1.2,2)},
      {g:this.lowBall,m:matrix(-2,1,0,2.8,1.5,2)},
      {g:this.lowBall,m:matrix(2.4,.7,0,2.6,1.6,1.8)},
    ])),this.mat(0xffffff,1),9);
    this.sunDisc=this.mesh(this.lowBall,new T.MeshBasicMaterial({color:0xfff1b9}));this.materials.push(this.sunDisc.material);this.sunDisc.scale.setScalar(9);this.sunDisc.position.set(-75,65,-180);
    this.arch=new T.Group();
    var archPaint=this.mat(0x1d7395,.4,.18);
    [-8.4,8.4].forEach(function(x){var leg=this.mesh(this.box,archPaint,this.arch);leg.position.set(x,3.8,0);leg.scale.set(.65,7.6,.8);},this);
    var beam=this.mesh(this.box,archPaint,this.arch);beam.position.y=7.3;beam.scale.set(17.5,1.1,1);
    for(var k=0;k<12;k++){var tile=this.mesh(this.box,k%2?this.dark:this.white,this.arch);tile.position.set(-7.15+k*1.3,7.35,.52);tile.scale.set(1.25,.65,.08);}
    this.scene.add(this.arch);
  };
  Scene3D.prototype.buildItems=function(){
    this.boxes=[];this.projectiles=[];
    var cubeMaterial=this.mat(0x68e4e2,.23,.25,0x124a55);
    var innerMaterial=this.mat(0xffe9a8,.3,.1,0x5e4324);
    for(var i=0;i<12;i++){
      var group=new T.Group(),outer=this.mesh(this.box,cubeMaterial,group);outer.scale.setScalar(1.22);
      var core=this.mesh(this.geo(new T.OctahedronBufferGeometry(.55)),innerMaterial,group);
      core.position.z=.68;group.add(core);this.scene.add(group);this.boxes.push(group);
    }
    for(var j=0;j<16;j++){
      var node=new T.Group();
      var ball=this.mesh(this.lowBall,this.mat(0xb59bff,.25,.4,0x4c267a),node);ball.scale.setScalar(.46);
      var ring=this.mesh(this.ring,this.mat(0xe5d8ff,.3,.1,0x8b61b8),node);ring.scale.setScalar(.65);ring.rotation.x=Math.PI/2;
      var cone=this.mesh(this.cone,this.mat(0xffb457,.7),node);cone.scale.set(.55,1,.55);
      this.scene.add(node);this.projectiles.push({group:node,ball:ball,ring:ring,cone:cone});
    }
  };
  Scene3D.prototype.setTheme=function(track){
    if(this.theme===track.theme)return;
    this.theme=track.theme;var t=THEMES[this.theme],night=this.theme==='harbor';
    this.scene.background=new T.Color(t.sky);this.scene.fog=new T.Fog(t.fog,65,220);this.scene.fog.color.convertSRGBToLinear();
    this.water.visible=this.foam.visible=this.theme==='coast'||night;
    this.water.material.color.setHex(t.water).convertSRGBToLinear();this.palms.leaves.material.color.setHex(t.tree).convertSRGBToLinear();this.pines.leaves.material.color.setHex(t.tree).convertSRGBToLinear();this.rocks.material.color.setHex(t.rock).convertSRGBToLinear();this.mountains.material.color.setHex(t.rock).convertSRGBToLinear();
    this.hemi.color.setHex(night?0x8796dd:0xdff6ff);this.hemi.groundColor.setHex(night?0x253359:t.ground).convertSRGBToLinear();this.hemi.intensity=.65;
    this.sun.color.setHex(night?0x92bfff:0xffe6bb);this.sun.intensity=night ? .8 : 1.35;
    this.renderer.toneMappingExposure=night?1.05:.95;
    this.sunDisc.material.color.setHex(night?0xe8edff:0xfff1b9);this.sunDisc.scale.setScalar(night?5:9);
    this.clouds.visible=!night;
  };
  Scene3D.prototype.path=function(track,s){
    var points=[],x=0,z=0,angle=0,step=30,baseHeight=root.CoastKartGame.elevation(track,s)*.035;
    for(var d=-180;d<=1440;d+=step){
      if(points.length){angle+=root.CoastKartGame.curve(track,s+d-step/2)*.00145*step;x+=Math.sin(angle)*step*.12;z-=Math.cos(angle)*step*.12;}
      points.push({d:d,x:x,z:z,y:root.CoastKartGame.elevation(track,s+d)*.035-baseHeight,angle:angle});
    }
    var origin=points[6],ox=origin.x,oz=origin.z,oa=origin.angle,cos=Math.cos(oa),sin=Math.sin(oa);
    points.forEach(function(p){var xx=p.x-ox,zz=p.z-oz;p.x=xx*cos+zz*sin;p.z=-xx*sin+zz*cos;p.angle-=oa;});
    this.points=points;
  };
  Scene3D.prototype.at=function(d,lateral){
    var n=Math.max(0,Math.min(this.points.length-2,Math.floor((d+180)/30))),a=this.points[n],b=this.points[n+1],t=Math.max(0,Math.min(1,(d-a.d)/30));
    var angle=a.angle+(b.angle-a.angle)*t;
    return {x:a.x+(b.x-a.x)*t+Math.cos(angle)*(lateral||0),y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t+Math.sin(angle)*(lateral||0),angle:angle};
  };
  Scene3D.prototype.updateRoad=function(game,s){
    var t=THEMES[this.theme],half=6.6*game.track.width,index=0,self=this;
    function quad(a,b,left,right,color,height){
      var ca=new T.Color(color).convertSRGBToLinear(),nx=Math.cos(a.angle),nz=Math.sin(a.angle),mx=Math.cos(b.angle),mz=Math.sin(b.angle);
      var high=Array.isArray(height)?height[0]:height,low=Array.isArray(height)?height[1]:height;
      var verts=[[a.x+nx*left,a.y+high,a.z+nz*left],[a.x+nx*right,a.y+low,a.z+nz*right],[b.x+mx*left,b.y+high,b.z+mz*left],[b.x+mx*right,b.y+low,b.z+mz*right]];
      [0,2,1,1,2,3].forEach(function(v){for(var k=0;k<3;k++){self.roadPositions[index+k]=verts[v][k];self.roadColors[index+k]=k===0?ca.r:k===1?ca.g:ca.b;}var uv=index/3*2;self.roadUvs[uv]=(v%2?right:left)*.5;self.roadUvs[uv+1]=(s+(v<2?a.d:b.d))*.06;index+=3;});
    }
    for(var i=0;i<this.points.length-1;i++){
      var a=this.points[i],b=this.points[i+1],stripe=Math.floor((s+a.d)/30)%2;
      quad(a,b,-85,-half-1.1,t.ground,-.28);
      quad(a,b,half+1.1,this.theme==='coast'?19:this.theme==='harbor'?15:85,this.theme==='coast'?t.sand:t.ground,-.28);
      quad(a,b,-half-1.1,-half-.55,t.sand,-.12);
      quad(a,b,half+.55,half+1.1,t.sand,-.12);
      quad(a,b,-half-.55,-half,stripe?t.curb:0xfff8e7,.06);
      quad(a,b,half,half+.55,stripe?t.curb:0xfff8e7,.06);
      quad(a,b,-half-.55,-half-.55,stripe?t.curb:0xfff8e7,[.06,-.12]);
      quad(a,b,half+.55,half+.55,stripe?t.curb:0xfff8e7,[.06,-.12]);
      quad(a,b,-half,half,t.road,0);
      quad(a,b,-half+.16,-half+.23,0xe6e7ce,.012);
      quad(a,b,half-.23,half-.16,0xe6e7ce,.012);
      if(Math.floor((s+a.d)/60)%2===0){quad(a,b,-half/3-.035,-half/3+.035,0xd8e5dd,.018);quad(a,b,half/3-.035,half/3+.035,0xd8e5dd,.018);}
    }
    this.roadGeometry.setDrawRange(0,index/3);this.roadGeometry.attributes.position.needsUpdate=true;this.roadGeometry.attributes.color.needsUpdate=true;this.roadGeometry.attributes.uv.needsUpdate=true;this.roadGeometry.computeVertexNormals();
  };
  Scene3D.prototype.placeInstance=function(mesh,i,x,y,z,sx,sy,sz,ry,rz){
    this.dummy.position.set(x,y,z);this.dummy.scale.set(sx,sy,sz);this.dummy.rotation.set(0,ry||0,rz||0);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);
  };
  Scene3D.prototype.scenery=function(game,s){
    var type=this.theme,half=6.6*game.track.width;
    this.palms.trunks.visible=this.palms.leaves.visible=type==='coast';
    this.pines.trunks.visible=this.pines.leaves.visible=type==='forest';this.rocks.visible=type==='canyon';
    this.buildings.visible=this.windows.visible=type==='harbor';
    var start=Math.floor((s-80)/40);
    for(var i=0;i<36;i++){
      var id=start+i,d=id*40-s,side=mod(id,2)?-1:1,offset=half+4+(Math.sin(id*17.2)+1)*5,p=this.at(d,side*offset),scale=.8+(Math.sin(id*3.7)+1)*.3;
      if(type==='coast'&&i<28){this.placeInstance(this.palms.trunks,i,p.x,p.y,p.z,scale,scale,scale,id);this.placeInstance(this.palms.leaves,i,p.x,p.y,p.z,scale,scale,scale,id);}
      if(type==='forest'){this.placeInstance(this.pines.trunks,i,p.x,p.y+2,p.z,.32,4,.32,0);this.placeInstance(this.pines.leaves,i,p.x,p.y,p.z,scale,scale,scale,id);}
      if(type==='canyon')this.placeInstance(this.rocks,i,p.x,p.y+3*scale,p.z,2.1*scale,3.6*scale,2.4*scale,id,.1*Math.sin(id));
      if(type==='harbor'&&i<30){var height=5+(Math.sin(id*8.1)+1)*8;this.placeInstance(this.buildings,i,p.x,p.y+height/2,p.z,3.5,height,4.6,id*.1);for(var row=0;row<3;row++)this.placeInstance(this.windows,i*3+row,p.x,p.y+2+row*height/3,p.z+2.36,2.8,.16,.07,id*.1);}
    }
    var railCount=0;
    for(var r=0;r<54;r++){
      var distance=(Math.floor((s-150)/30)+r)*30-s;
      for(var sideIndex=-1;sideIndex<=1;sideIndex+=2){
        var at=this.at(distance,sideIndex*(half+1.2));
        this.placeInstance(this.rails,railCount,at.x,at.y+.78,at.z,.13,.23,3.65,-at.angle);
        this.placeInstance(this.posts,railCount,at.x,at.y+.4,at.z,.07,.8,.07,0);railCount++;
      }
    }
    for(var m=0;m<12;m++){
      var a=m*TAU/12;this.placeInstance(this.mountains,m,Math.sin(a)*170,-8,Math.cos(a)*170-60,20+(m%3)*9,35+(m%4)*10,22+(m%2)*12,a);
      var markId=Math.floor((s+100)/100)+m;var mark=this.at(markId*100-s,(markId%2?1:-1)*(half+2)),right=root.CoastKartGame.curve(game.track,markId*100+100)>=0;
      this.placeInstance(this.banners,m,mark.x,mark.y+2.2,mark.z,right?1.8:0,1,.1,-mark.angle);
      this.placeInstance(this.bannersLeft,m,mark.x,mark.y+2.2,mark.z,right?0:1.8,1,.1,-mark.angle);
      this.placeInstance(this.signPosts,m,mark.x,mark.y+1.1,mark.z,.12,2.2,.12,0);
    }
    for(var cloud=0;cloud<9;cloud++)this.placeInstance(this.clouds,cloud,-110+cloud*28,25+(cloud%3)*5,-95-(cloud%4)*20,1,1,1,cloud);
    [this.palms.trunks,this.palms.leaves,this.pines.trunks,this.pines.leaves,this.rocks,this.buildings,this.windows,this.rails,this.posts,this.banners,this.bannersLeft,this.signPosts,this.mountains,this.clouds].forEach(function(mesh){if(mesh.visible)mesh.instanceMatrix.needsUpdate=true;});
    var finish=mod(-s,game.track.length);if(finish>game.track.length-150)finish-=game.track.length;
    this.arch.visible=finish>-150&&finish<1350;if(this.arch.visible){var f=this.at(finish);this.arch.position.set(f.x,f.y,f.z);this.arch.rotation.y=-f.angle;}
  };
  Scene3D.prototype.render=function(game,p,w,h,pixelScale,preview){
    if(this.failed||this.disposed||!this.renderer)return false;
    var started=performance.now();
    try{
      this.setTheme(game.track);
      var s=preview?390+game.tick*.5:p.s,time=game.clock||game.tick/60;
      this.path(game.track,s);this.water.position.y=-3.5-root.CoastKartGame.elevation(game.track,s)*.035;this.foam.position.y=this.water.position.y+.03;this.foam.material.map.offset.y=time*.003;this.updateRoad(game,s);this.scenery(game,s);
      var scale=Math.min(pixelScale||1,1440/w,900/h),rw=Math.max(1,Math.round(w*scale)),rh=Math.max(1,Math.round(h*scale));
      if(this.canvas.width!==rw||this.canvas.height!==rh)this.renderer.setSize(rw,rh,false);
      var racers=preview?[p]:(game.racers||[]),self=this;
      this.karts.forEach(function(k){k.group.visible=false;});
      racers.forEach(function(r){
        var distance=preview?0:mod(r.s-s+game.track.length/2,game.track.length)-game.track.length/2;
        if(distance< -110||distance>1350)return;
        var k=self.karts[(r.id-1)%8],point=self.at(distance,r.x*6.6);
        k.group.visible=true;k.group.position.set(point.x,point.y,point.z);
        var distant=distance>300;k.details.forEach(function(mesh){mesh.visible=!distant;});k.low.visible=distant;
        k.group.rotation.set(0,-point.angle+(r.drifting ? .17*Math.sin(time*4):0)+(r.stun>0?time*9:0),r.drifting ? .04:0);
        k.shield.visible=r.shield>0;k.flames.forEach(function(flame){flame.visible=r.boost>0;flame.scale.y=1.15+Math.sin(time*40)*.25;});
        k.sparks.visible=r.drift>.3;k.sparks.material.color.setHex(r.drift>=2.4?0xd995ff:r.drift>=1.6?0xffc55a:0x69e7ff);
        k.sparks.material.emissive.copy(k.sparks.material.color).multiplyScalar(.35);
        k.held.visible=!!r.heldItem;k.heldBall.visible=r.item==='pulse';k.heldTrap.visible=r.item==='trap';k.held.rotation.y=time*2;
      });
      this.boxes.forEach(function(box,i){var data=(game.boxes||[])[i],distance=data?mod(data.s-s,game.track.length):0;box.visible=!preview&&game.selectedMode!=='time'&&!!data&&data.ready<=game.clock&&distance>5&&distance<1350;if(box.visible){var q=self.at(distance,data.x*6.6);box.position.set(q.x,q.y+1.25+Math.sin(time*3+i)*.15,q.z);box.rotation.set(.15,time*.8+i,.12);}});
      this.projectiles.forEach(function(o,i){var data=game.items&&game.items[i],distance=data?mod(data.s-s+game.track.length/2,game.track.length)-game.track.length/2:0;o.group.visible=!!data&&distance> -90&&distance<1350;if(o.group.visible){var q=self.at(distance,data.x*6.6);o.group.position.set(q.x,q.y+(data.flight>0?1.8:.55),q.z);o.ball.visible=o.ring.visible=data.type==='pulse';o.cone.visible=data.type==='trap';o.ring.rotation.z=time*5;}});
      var focus=this.at(0,p.x*6.6),look=this.at(55,p.x*6.6*.35);
      this.camera.aspect=w/h;this.camera.fov=w/h<1.1?62:54;this.camera.updateProjectionMatrix();
      this.camera.position.set(focus.x*.72,focus.y+5.3,focus.z+9.8);
      this.camera.lookAt(look.x,look.y+1.0,look.z);
      this.renderer.render(this.scene,this.camera);
      this.frames++;this.drawCalls=this.renderer.info.render.calls;this.triangles=this.renderer.info.render.triangles;
      var gl=this.renderer.getContext();
      // Loss can become observable before the DOM event; retain resources for restoration.
      if(gl.isContextLost()){this.contextLost=true;this.failed=true;this.active=false;return false;}
      this.active=this.drawCalls>0&&gl.getError()===gl.NO_ERROR;
      this.lastFrameMs=performance.now()-started;
      if(!this.active)throw new Error('WebGL rendering failed');
      if(this.renderer.info.programs.some(function(program){return program.diagnostics && program.diagnostics.runnable === false;}))
        throw new Error('WebGL shader compilation failed');
      return true;
    }catch(error){
      this.failed=true;this.active=false;this.error=String(error.message||error);this.errorStack=String(error.stack||error);
      if(this.renderer.getContext().isContextLost()){this.contextLost=true;return false;}
      this.dispose();return false;
    }
  };
  Scene3D.prototype.dispose=function(){
    if(this.disposed)return;this.disposed=true;this.active=false;
    this.geometries.forEach(function(g){g.dispose();});this.materials.forEach(function(m){m.dispose();});this.textures.forEach(function(t){t.dispose();});
    if(this.renderer){this.renderer.dispose();this.renderer.forceContextLoss();}
  };
  root.CoastKartScene3D=Scene3D;
})(window);
