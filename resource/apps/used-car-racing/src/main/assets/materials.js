/* Original offline material library. Three.js r124 / WebGL 1.
 * All maps are shared by the complete six-car grid and all split-screen views.
 * Color is sRGB; normal and specular maps are linear. See TEXTURE-LICENSE.txt.
 */
(function(root){
'use strict';
/* material-definitions:start */
var DEFINITIONS={
  "asphalt": {
    "map": "asphalt-color.jpg",
    "size": 1024,
    "normalMap": "asphalt-normal.jpg",
    "normalSize": 512,
    "specularMap": "asphalt-specular.jpg",
    "specularSize": 512
  },
  "concrete": {
    "map": "concrete-color.jpg",
    "size": 512,
    "normalMap": "concrete-normal.jpg",
    "normalSize": 256
  },
  "rock": {
    "map": "rock-color.jpg",
    "size": 1024,
    "normalMap": "rock-normal.jpg",
    "normalSize": 512
  },
  "sand": {
    "map": "sand-color.jpg",
    "size": 512,
    "normalMap": "sand-normal.jpg",
    "normalSize": 256
  },
  "grass": {
    "map": "grass-color.jpg",
    "size": 512,
    "normalMap": "grass-normal.jpg",
    "normalSize": 256
  },
  "facade": {
    "map": "facade-color.jpg",
    "size": 512
  },
  "container": {
    "map": "container-color.jpg",
    "size": 512,
    "normalMap": "container-normal.jpg",
    "normalSize": 256
  },
  "solar": {
    "map": "solar-color.jpg",
    "size": 512,
    "specularMap": "solar-specular.jpg",
    "specularSize": 256
  },
  "paint": {
    "map": "paint-color.jpg",
    "size": 512,
    "normalMap": "paint-normal.jpg",
    "normalSize": 256,
    "specularMap": "paint-specular.jpg",
    "specularSize": 256
  },
  "rubber": {
    "map": "rubber-color.jpg",
    "size": 512,
    "normalMap": "rubber-normal.jpg",
    "normalSize": 512
  },
  "lamp": {
    "map": "lamp-color.jpg",
    "size": 512,
    "normalMap": "lamp-normal.jpg",
    "normalSize": 256,
    "specularMap": "lamp-specular.jpg",
    "specularSize": 256
  },
  "fabric": {
    "map": "fabric-color.jpg",
    "size": 512,
    "normalMap": "fabric-normal.jpg",
    "normalSize": 256
  },
  "foliage": {
    "map": "foliage-color.png",
    "size": 512,
    "alpha": true
  }
};
/* material-definitions:end */
var ALIASES={tire:'rubber',lens:'lamp',ground:'grass'};
var NORMAL_STRENGTH={asphalt:.55,concrete:.42,rock:.75,sand:.40,grass:.38,container:.60,paint:.18,rubber:.65,lamp:.50,fabric:.32};
function mipBytes(size,faces){return Math.ceil(size*size*4*4/3)*(faces||1);}
function Materials(T,renderer){
 this.T=T;this.renderer=renderer;this.maps={};this.environments={};this.owned=[];this.errors=[];this.disposed=false;
 this.stats={loadedTextures:0,requestedTextures:0,environmentMaps:0,estimatedMipBytes:0,maxSize:0,anisotropy:1};
 var max=renderer&&renderer.capabilities&&renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1;
 this.stats.anisotropy=Math.max(1,Math.min(4,max||1));
 var self=this,pending=[];
 Object.keys(DEFINITIONS).forEach(function(name){
  var def=DEFINITIONS[name],bundle={};
  ['map','normalMap','specularMap'].forEach(function(channel){
   if(!def[channel])return;
   var size=channel==='normalMap'?def.normalSize:channel==='specularMap'?def.specularSize:def.size;
   self.stats.requestedTextures++;self.stats.estimatedMipBytes+=mipBytes(size);self.stats.maxSize=Math.max(self.stats.maxSize,size);
   pending.push(new Promise(function(resolve){
    var loader=new T.TextureLoader(),texture=loader.load('textures/'+def[channel],function(loaded){
     if(self.disposed){loaded.dispose();loaded.image=null;resolve();return;}
     self.stats.loadedTextures++;resolve();
    },undefined,function(){self.errors.push(def[channel]);resolve();});
    var placeholder=document.createElement('canvas');placeholder.width=placeholder.height=2;var placeholderContext=placeholder.getContext('2d');
    placeholderContext.fillStyle=channel==='normalMap'?'#8080ff':'#ffffff';if(!def.alpha)placeholderContext.fillRect(0,0,2,2);
    texture.image=placeholder;texture.needsUpdate=true;
    texture.name='used-car/'+name+'/'+channel;texture.encoding=channel==='map'?T.sRGBEncoding:T.LinearEncoding;
    texture.wrapS=texture.wrapT=def.alpha?T.ClampToEdgeWrapping:T.RepeatWrapping;
    texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=self.stats.anisotropy;
    bundle[channel]=texture;self.owned.push(texture);
   }));
  });
  if(bundle.normalMap)bundle.normalScale=new T.Vector2(NORMAL_STRENGTH[name]||.5,NORMAL_STRENGTH[name]||.5);
  if(def.alpha)bundle.alphaTest=.42;
  self.maps[name]=bundle;
 });
 this.ready=Promise.all(pending).then(function(){return self;});
}
Materials.prototype.get=function(name){return this.maps[ALIASES[name]||name]||{};};
Materials.prototype.environment=function(theme){
 theme=theme==='harbor'||theme==='ridge'||theme==='solar'?theme:'garage';
 if(this.environments[theme])return this.environments[theme];
 if(this.disposed)return null;
 var T=this.T,size=128,faces=[],colors={
  garage:[[22,30,39],[104,127,139],[12,16,21]],
  harbor:[[8,16,34],[89,125,143],[15,26,34]],
  ridge:[[91,134,160],[192,211,211],[52,64,43]],
  solar:[[125,111,140],[245,193,139],[98,72,50]]
 }[theme];
 function mix(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
 for(var face=0;face<6;face++){
  var canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  var ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);
  for(var y=0;y<size;y++)for(var x=0;x<size;x++){
   var u=(x+.5)/size*2-1,v=(y+.5)/size*2-1;
   var d=face===0?[1,-v,-u]:face===1?[-1,-v,u]:face===2?[u,1,v]:face===3?[u,-1,-v]:face===4?[u,-v,1]:[-u,-v,-1];
   var length=Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]),dx=d[0]/length,dy=d[1]/length,dz=d[2]/length;
   var horizon=Math.exp(-Math.abs(dy)*4),out=[0,0,0],c;
   for(c=0;c<3;c++)out[c]=mix(dy>0?colors[0][c]:colors[2][c],colors[1][c],horizon);
   var light=0,warm=0;
   if(theme==='garage'){
    // Large studio panels give a readable paint highlight without dynamic cubemaps.
    var px=dx/Math.max(.01,dy),pz=dz/Math.max(.01,dy);
    if(dy>.10){light=Math.exp(-Math.pow((Math.abs(px)-1.45)/.20,4))*Math.exp(-Math.pow(pz/3.3,6));light=Math.max(light,Math.exp(-Math.pow((Math.abs(pz)-1.55)/.15,4))*Math.exp(-Math.pow(px/2.5,6))*.65);}
    warm=Math.exp(-Math.pow((dy-.03)/.07,2))*Math.pow(Math.max(0,dx),10)*.55;
   }else{
    var toward=Math.max(0,-dx*.69+dy*.52-dz*.51);
    light=Math.pow(toward,160)*(theme==='harbor'?.15:.8);
    if(theme==='harbor'&&dy>-.02&&dy<.32){
     var angle=Math.atan2(dx,dz),building=.08+.12*(.5+.5*Math.sin(angle*13));
     if(dy<building){for(c=0;c<3;c++)out[c]*=.38;var windows=Math.sin(angle*105)> .65&&Math.sin(dy*165)>.60; if(windows){out[0]+=65;out[1]+=91;out[2]+=100;}}
    }
   }
   var at=(y*size+x)*4;
   pixels.data[at]=Math.min(255,out[0]+light*200+warm*180);pixels.data[at+1]=Math.min(255,out[1]+light*208+warm*72);pixels.data[at+2]=Math.min(255,out[2]+light*215+warm*24);pixels.data[at+3]=255;
  }
  ctx.putImageData(pixels,0,0);faces.push(canvas);
 }
 var cube=new T.CubeTexture(faces);cube.name='used-car/environment/'+theme;cube.encoding=T.sRGBEncoding;cube.generateMipmaps=true;cube.minFilter=T.LinearMipmapLinearFilter;cube.magFilter=T.LinearFilter;cube.needsUpdate=true;
 this.owned.push(cube);this.environments[theme]=cube;this.stats.environmentMaps++;this.stats.estimatedMipBytes+=mipBytes(size,6);return cube;
};
Materials.prototype.dispose=function(){if(this.disposed)return;this.disposed=true;this.owned.forEach(function(t){t.dispose();});this.owned=[];this.maps={};this.environments={};};
Materials.definitions=DEFINITIONS;
root.UsedCarMaterials=Materials;
})(window);
