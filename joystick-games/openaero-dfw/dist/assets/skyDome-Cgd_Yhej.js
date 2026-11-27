import{t as e}from"./Vector3-CZajvpgo.js";import{f as t,o as n,t as r}from"./BufferAttribute-CM2iXJnh.js";import{n as i}from"./Euler-Dsh7Rp5B.js";import{t as a,u as o}from"./constants-b1kZgAm3.js";import{$ as s,Ct as c,Ot as l,gt as u,ht as d,jt as f,mt as p,pt as m,yt as h}from"./tv-DDJQgpJb.js";var g=Date.UTC(2e3,0,1,12);function _(e){return(e.getTime()-g)/864e5}function v(e){let t=_(e),n=t/36525;return((280.46061837+360.98564736629*t+n*n*(387933e-9-n/3871e4))%360+360)%360}function y(e,t){return(v(e)+t)%360*a}function b(e,t,n=Array(9)){let r=Math.cos(t),i=Math.sin(t),o=Math.cos(e*a),s=Math.sin(e*a);return n[0]=-i,n[1]=r,n[2]=0,n[3]=o*r,n[4]=o*i,n[5]=s,n[6]=s*r,n[7]=s*i,n[8]=-o,n}function x(e,t,n={x:0,y:0,z:0}){let{x:r,y:i,z:a}=t;return n.x=e[0]*r+e[1]*i+e[2]*a,n.y=e[3]*r+e[4]*i+e[5]*a,n.z=e[6]*r+e[7]*i+e[8]*a,n}function S(e){let t=_(e)/36525,n=(e,n)=>Math.sin((e+n*t)*a),r=(e,n)=>Math.cos((e+n*t)*a);return{lambda:218.32+481267.881*t+6.29*n(135,477198.87)-1.27*n(259.3,-413335.36)+.66*n(235.7,890534.22)+.21*n(269.9,954397.74)-.19*n(357.5,35999.05)-.11*n(186.5,966404.03),beta:5.13*n(93.3,483202.02)+.28*n(228.2,960400.89)-.28*n(318.3,6003.15)-.17*n(217.6,-407332.21),parallax:.9508+.0518*r(135,477198.87)+.0095*r(259.3,-413335.36)+.0078*r(235.7,890534.22)+.0028*r(269.9,954397.74)}}function C(e,t,n,r={x:0,y:0,z:0}){let{lambda:i,beta:s,parallax:c}=S(e),l=23.439*a,u=i*a,d=s*a,f={x:Math.cos(d)*Math.cos(u),y:Math.cos(d)*Math.sin(u),z:Math.sin(d)},p={x:f.x,y:f.y*Math.cos(l)-f.z*Math.sin(l),z:f.y*Math.sin(l)+f.z*Math.cos(l)};x(b(t,y(e,n)),p,r);let m=Math.asin(Math.max(-1,Math.min(1,r.y))),h=m-c*a*Math.cos(m),g=Math.hypot(r.x,r.z)||1;return r.x=r.x/g*Math.cos(h),r.z=r.z/g*Math.cos(h),r.y=Math.sin(h),r.elevationDeg=h*o,r}function w(e,t){return(1-(e.x*t.x+e.y*t.y+e.z*t.z))/2}function T(e){let t=(2-e)/14,n=Math.min(1,Math.max(0,t));return n*n*(3-2*n)}function ee(e,t=[1,1,1]){let n=Math.min(4e4,Math.max(1e3,e))/100,r,i,a;n<=66?(r=255,i=99.47*Math.log(n)-161.12,a=n<=19?0:138.52*Math.log(n-10)-305.04):(r=329.7*(n-60)**-.1332,i=288.12*(n-60)**-.0755,a=255);let o=Math.max(r,i,a);return t[0]=Math.max(0,r)/o,t[1]=Math.max(0,i)/o,t[2]=Math.max(0,Math.min(255,a))/o,t}var E=8e4,D=76e3,O=72e3,k=.9,te=new n(133674),A=`
uniform vec3 uZenith, uHorizon, uGlow, uSunDir, uSunCol, uMoonDir, uOvercastCol, uSpaceCol;
uniform float uGlowK, uOvercast, uSpace, uSunVis, uMoonLit;
vec3 skyColour(vec3 d) {
  float h = d.y;
  vec3 zen = mix(uZenith, uSpaceCol, uSpace);
  // The sky stays horizon-coloured below the horizon (the far ground fades into it).
  float up = clamp(h + 0.01, 0.0, 1.0);
  vec3 col = mix(uHorizon, zen, pow(up, 0.38 + 0.25 * uSpace));
  // Twilight / golden hour: the sunward horizon burns, fading upwards and around.
  vec2 dh = normalize(d.xz + 1e-5), sh = normalize(uSunDir.xz + 1e-5);
  float toward = max(dot(dh, sh), 0.0);
  col += uGlow * uGlowK * pow(toward, 2.5) * exp(-max(h, 0.0) * 7.0);
  col = mix(col, uOvercastCol, uOvercast * smoothstep(-0.1, 0.12, h));
  float clear = 1.0 - uOvercast;
  // The sun's wide Mie halo and the moonlit haze around the Moon.
  float c = max(dot(d, uSunDir), 0.0);
  float c2 = c * c, c4 = c2 * c2, c8 = c4 * c4;
  col += uSunCol * uSunVis * clear * c8 * c2 * 0.22;
  col += vec3(0.55, 0.6, 0.75) * pow(max(dot(d, uMoonDir), 0.0), 40.0) * 0.06 * uMoonLit * clear;
  return col;
}
vec3 skyDisplay(vec3 linear) { return sRGBTransferOETF(vec4(ACESFilmicToneMapping(linear), 1.0)).rgb; }
`,ne=`
#include <tonemapping_pars_fragment>
#include <colorspace_pars_fragment>
${A}
varying vec3 vOut;
void main() {
  vOut = skyDisplay(skyColour(normalize(position)));
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // on the far plane
}`,re=`
varying vec3 vOut;
void main() {
  // Break up 8-bit banding in the long night gradients (interleaved gradient noise).
  vec3 col = vOut + (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`,j=12,M=`
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,N=`
#include <tonemapping_pars_fragment>
${A}
varying vec3 vWorld;
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  float c = max(dot(d, uSunDir), 0.0);
  float edge = smoothstep(0.9781, 0.9903, c); // 12° → 8°
  if (edge <= 0.0) discard;
  float sun = pow(c, 300.0) * 0.9 + smoothstep(0.99990, 0.99997, c) * 18.0 * smoothstep(-0.012, 0.004, d.y);
  vec3 col = skyDisplay(skyColour(d) + uSunCol * uSunVis * (1.0 - uOvercast) * sun);
  gl_FragColor = vec4(col, edge);
}`,P=`
attribute float aMag;
attribute vec3 aCol;
uniform float uPx, uLimit, uTime, uTwinkle;
varying vec3 vCol;
varying float vA;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 dir = normalize(wp.xyz - cameraPosition);
  float ext = smoothstep(-0.01, 0.2, dir.y);              // extinction near the horizon
  float flux = pow(2.512, -aMag);                          // brightness relative to mag 0
  float vis = clamp((uLimit - aMag) * 0.9, 0.0, 1.0);      // fade out below the sky's limit
  float seed = fract(sin(aMag * 91.7 + position.x * 0.013) * 4375.85);
  float tw = 1.0 + uTwinkle * (1.0 - dir.y) * 0.35 * sin(uTime * (6.0 + seed * 11.0) + seed * 40.0);
  gl_PointSize = uPx * clamp(2.2 + sqrt(flux) * 2.6, 2.2, 8.0);
  vA = clamp(0.35 + flux * 0.9, 0.0, 1.4) * vis * ext * tw;
  vCol = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,F=`
varying vec3 vCol;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.2, 0.7, r);
  float halo = 1.0 - smoothstep(0.0, 1.0, r);
  gl_FragColor = vec4(vCol * vA * (core * 1.5 + halo * halo * 0.6), 1.0);
}`,I=`
uniform vec3 uSunDir, uMoonDir, uRight, uUp;
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float z = sqrt(1.0 - r2);
  // The lit hemisphere is the one facing the sun: the phase falls out of the geometry.
  vec3 n = normalize(uRight * p.x + uUp * p.y - uMoonDir * z);
  float lit = smoothstep(-0.03, 0.12, dot(n, uSunDir));
  float maria = 0.72 + 0.28 * noise(p * 2.6 + 3.0) * noise(p * 5.3 - 1.0) * 1.6;
  vec3 col = vec3(1.0, 0.97, 0.9) * maria * (lit * 1.35 + 0.025); // + earthshine
  gl_FragColor = vec4(col, uAlpha * smoothstep(1.0, 0.92, r2));
}`,L=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,R=`
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,z=`
uniform float uCover, uBelow, uSeed;
uniform vec2 uDrift;
uniform vec3 uLit, uShade;
varying vec3 vWorld;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (vWorld.xz + uDrift) / 2600.0 + uSeed;
  float n = fbm(p);
  // fbm sits around 0.5 ± 0.12: pick the threshold that leaves about uCover of the sky.
  float t = 0.68 - 0.36 * uCover;
  float dens = max(smoothstep(t - 0.04, t + 0.12, n), step(0.99, uCover) * 0.97);
  if (dens < 0.01) discard;
  float thick = smoothstep(t, t + 0.25, n);
  // From below: dark, thick bellies; from above: sunlit tops.
  vec3 col = mix(uLit, uShade, uBelow * thick * 0.85);
  gl_FragColor = vec4(col, dens * 0.95);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;function B({scene:a,base:o,reducedMotion:g=!1}){let _=new f;_.name=`skyDome`,a.add(_);let v={uZenith:{value:new n},uHorizon:{value:new n},uGlow:{value:new n},uSunDir:{value:new e(0,1,0)},uSunCol:{value:new n},uMoonDir:{value:new e(0,-1,0)},uOvercastCol:{value:new n},uGlowK:{value:0},uSunVis:{value:1},uOvercast:{value:0},uMoonLit:{value:0},uSpace:{value:0},uSpaceCol:{value:te.clone()}},x=new c(new d(E,64,64),new m({uniforms:v,vertexShader:ne,fragmentShader:re,side:1,depthWrite:!1,toneMapped:!1}));x.renderOrder=100,x.frustumCulled=!1,_.add(x);let S=new f;S.matrixAutoUpdate=!1,_.add(S);let A={uPx:{value:1},uLimit:{value:-5},uTime:{value:0},uTwinkle:{value:+!g}},B=null;fetch(`${o}sky/stars-v1.bin`).then(e=>e.ok?e.arrayBuffer():null).then(e=>{if(!e)return;let t=new Float32Array(e),n=t.length/4,i=new Float32Array(n*3),a=new Float32Array(n*3),o=new Float32Array(n),s=[1,1,1];for(let e=0;e<n;e++){let n=t[e*4],r=t[e*4+1];i[e*3]=Math.cos(r)*Math.cos(n)*D,i[e*3+1]=Math.cos(r)*Math.sin(n)*D,i[e*3+2]=Math.sin(r)*D,ee(t[e*4+3],s);for(let t=0;t<3;t++)a[e*3+t]=(.55+.45*s[t])**2.2;o[e]=t[e*4+2]}let c=new l;c.setAttribute(`position`,new r(i,3)),c.setAttribute(`aCol`,new r(a,3)),c.setAttribute(`aMag`,new r(o,1)),B=new h(c,new m({uniforms:A,vertexShader:P,fragmentShader:F,transparent:!0,depthWrite:!1,blending:2,toneMapped:!1})),B.renderOrder=-19,B.frustumCulled=!1,S.add(B)}).catch(()=>{});let V={uSunDir:v.uSunDir,uMoonDir:v.uMoonDir,uRight:{value:new e},uUp:{value:new e},uAlpha:{value:1}},H=new c(new u(1,1),new m({uniforms:V,vertexShader:L,fragmentShader:I,transparent:!0,depthWrite:!1,toneMapped:!1}));H.renderOrder=-18,H.frustumCulled=!1,H.scale.setScalar(2*O*Math.tan(k/2*Math.PI/180)),_.add(H);let U=new c(new u(1,1),new m({uniforms:v,vertexShader:M,fragmentShader:N,transparent:!0,depthWrite:!1,toneMapped:!1}));U.renderOrder=101,U.frustumCulled=!1,U.scale.setScalar(2*O*Math.tan(j*Math.PI/180)),_.add(U);let W=new u(1,1);W.rotateX(-Math.PI/2);let G=[];function K(e){if(G[e])return G[e];let r=p.merge([s.fog,{uCover:{value:.3},uBelow:{value:1},uSeed:{value:e*37.3},uDrift:{value:new t},uLit:{value:new n(1,1,1)},uShade:{value:new n(.5,.52,.56)}}]),i=new c(W,new m({uniforms:r,vertexShader:R,fragmentShader:z,fog:!0,transparent:!0,depthWrite:!1,side:2}));return i.scale.set(14e4,1,14e4),i.renderOrder=5,i.frustumCulled=!1,i.visible=!1,a.add(i),G[e]=i,i}let q=Array(9),J=new i,Y={x:0,y:0,z:0},X=new n,Z={nightness:0,moonIllumination:0,moonElevationDeg:0,limitingMag:0,stars:0},Q=[],$=0;function ie({look:e,sunDir:t,sunElevationDeg:n,date:r,latDeg:i,lonDeg:a,overcast:o,overcastColor:s}){v.uZenith.value.setHex(e.zenith),v.uHorizon.value.setHex(e.horizon),v.uGlow.value.setHex(e.glow),v.uSunDir.value.set(t.x,t.y,t.z),v.uSunCol.value.setHex(e.sun||16747068),v.uSunVis.value=Math.min(1,Math.max(0,(n+1.5)/3)),v.uGlowK.value=Math.max(0,1-Math.abs(n-.5)/12)*.9,v.uOvercast.value=o,v.uOvercastCol.value.copy(s),b(i,y(r,a),q),J.set(q[0],q[1],q[2],0,q[3],q[4],q[5],0,q[6],q[7],q[8],0,0,0,0,1),S.matrix.copy(J),C(r,i,a,Y),v.uMoonDir.value.set(Y.x,Y.y,Y.z),Z.moonIllumination=w(Y,t),Z.moonElevationDeg=Y.elevationDeg,Z.nightness=T(n);let c=Math.max(0,Math.min(1,(Y.elevationDeg+1)/6));v.uMoonLit.value=Z.moonIllumination*c*Z.nightness,V.uAlpha.value=c*(.35+.65*Z.nightness)*(1-o),Z.limitingMag=-1.5+6*Z.nightness-1.2*v.uMoonLit.value-8*o;for(let[t,n]of Q.entries()){let r=K(t).material.uniforms;X.setHex(e.ambient).multiplyScalar(e.ambientIntensity),r.uLit.value.setHex(e.sun||e.ambient).multiplyScalar(e.sunIntensity*.55).add(X),r.uShade.value.copy(X).multiplyScalar(.55),Z.nightness>.5&&(r.uLit.value.multiplyScalar(.6),r.uShade.value.multiplyScalar(.5)),r.uCover.value=n.coverage}}function ae(e,t){Q=e||[],$=t,G.forEach((e,t)=>{e.visible=t<Q.length}),Q.forEach((e,t)=>{K(t).visible=!0})}function oe(e,{time:t,pixelRatio:n,wind:r,altitudeM:i}){_.position.copy(e.position),_.updateMatrix(),S.matrix.setPosition(0,0,0),A.uTime.value=t,A.uPx.value=n;let a=Math.min(1,Math.max(0,(i-3e3)/15e3));v.uSpace.value=a,A.uLimit.value=Z.limitingMag+a*2.5,Z.stars=+!!B,B&&(B.visible=A.uLimit.value>-1.4);let o=v.uMoonDir.value;H.position.copy(o).multiplyScalar(O),H.quaternion.copy(e.quaternion),V.uRight.value.set(1,0,0).applyQuaternion(e.quaternion),V.uUp.value.set(0,1,0).applyQuaternion(e.quaternion),H.visible=o.y>-.02&&V.uAlpha.value>.01;let s=v.uSunDir.value;U.position.copy(s).multiplyScalar(O),U.quaternion.copy(e.quaternion),U.visible=v.uSunVis.value>0&&v.uOvercast.value<1;for(let[n,i]of Q.entries()){let a=G[n];a.position.set(e.position.x,$+i.baseFt*.3048,e.position.z);let o=a.material.uniforms;o.uDrift.value.set(-r.x*t,-r.z*t),o.uBelow.value=+(e.position.y<a.position.y)}}return{group:_,setSky:ie,setClouds:ae,update:oe,state:Z}}export{B as createSkyDome};