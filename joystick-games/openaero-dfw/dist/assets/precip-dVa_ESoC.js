import{t as e}from"./Vector3-CZajvpgo.js";import{o as t,t as n}from"./BufferAttribute-CM2iXJnh.js";import{t as r}from"./LineSegments-Df2gVfPL.js";import{Ot as i,pt as a}from"./tv-D8oZm-mq.js";var o=.3048,s=5e3,c=40,l=5,u={drizzle:[1500,3e3,4500],rain:[1200,2500,4500],snow:[1600,3200,5e3]},d={drizzle:[1.2,1.6,2],rain:[5,7,9],snow:[1,1.2,1.5]},f={drizzle:.012,rain:.02,snow:.006},p=1e4,m=1.2;function h(e,t=!1){return!e||!e.kind||t?0:Math.min(s,u[e.kind][Math.max(0,Math.min(2,e.intensity|0))])}function g(e){return 8+17*Math.min(Math.max(e,0),1)}var _=.12;function v(e){if(e<0||e>.7)return 0;if(e<_)return e/_;let t=(e-_)/.58;return(1-t)*(1-t)}var y=`
attribute float aEnd;
uniform vec3 uShift;
uniform vec3 uCamMod;
uniform vec3 uStreak;
uniform float uBox;
uniform float uNear;
varying float vA;
void main() {
  vec3 p = mod(position * uBox + uShift - uCamMod, uBox) - 0.5 * uBox;
  float d = length(p);
  vA = (1.0 - smoothstep(0.3 * uBox, 0.5 * uBox, d)) * step(uNear, d) * (1.0 - 0.6 * aEnd);
  p -= uStreak * aEnd;
  gl_Position = projectionMatrix * viewMatrix * vec4(p + cameraPosition, 1.0);
  if (vA <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`,b=`
uniform vec3 uColor;
uniform float uAlpha;
varying float vA;
void main() { gl_FragColor = vec4(uColor, uAlpha * vA); }`;function x(u,_=!1){let x=new Float32Array(s*6),S=new Float32Array(s*2);for(let e=0;e<s;e++){let t=Math.random(),n=Math.random(),r=Math.random();x.set([t,n,r,t,n,r],e*6),S[e*2+1]=1}let C=new i;C.setAttribute(`position`,new n(x,3)),C.setAttribute(`aEnd`,new n(S,1));let w={uShift:{value:new e},uCamMod:{value:new e},uStreak:{value:new e},uBox:{value:c},uNear:{value:l},uColor:{value:new t},uAlpha:{value:.3}},T=new a({uniforms:w,vertexShader:y,fragmentShader:b,transparent:!0,depthWrite:!1,toneMapped:!1}),E=new r(C,T);E.frustumCulled=!1,E.renderOrder=5,E.visible=!1,E.name=`precip`,u.add(E);let D={kind:null,intensity:0,ts:!1,count:0,visible:!1,flashes:0,flash:0},O=6,k=.02,A=0,j=0,M=p*o,N=g(Math.random()),P=-1,F=new e,I=new e,L=new e,R=!1,z=new t,B=new t,V=new t(1,1,1),H=!1,U=e=>(e%c+c)%c;function W(e,t=0,n=null){if(D.kind=e?.kind??null,D.intensity=e?.intensity??0,D.ts=!!e?.ts,D.count=h(e,_),C.setDrawRange(0,D.count*2),j=t,M=(typeof n==`number`?n:p)*o,D.kind){let e=Math.max(0,Math.min(2,D.intensity|0));O=d[D.kind][e],k=f[D.kind],A=D.kind===`snow`?.65:0,w.uAlpha.value=D.kind===`snow`?.7:.22+.06*e}D.ts||G()}function G(){H&&u.fog&&u.fog.color.equals(B)&&(u.fog.color.copy(z),u.background?.copy?.(z)),H=!1,P=-1,D.flash=0}function K(e,t,n,r=!1){r&&(e=0,P>=0&&G());let i=t.position;e>0&&(R&&I.subVectors(i,L).divideScalar(e),(!R||I.lengthSq()>16e4)&&I.set(0,0,0),L.copy(i),R=!0);let a=I;if(D.visible=D.count>0&&i.y-j<M,E.visible=D.visible,D.visible){let t=w.uShift.value;if(t.set(U(t.x+n.x*e),U(t.y+(n.y-O)*e),U(t.z+n.z*e)),w.uCamMod.value.set(U(i.x),U(i.y),U(i.z)),F.set(n.x-a.x,n.y-O-a.y,n.z-a.z).multiplyScalar(k),F.lengthSq()>1.44&&F.setLength(m),w.uStreak.value.copy(F),u.fog){let e=w.uColor.value.copy(H?z:u.fog.color),t=.2126*e.r+.7152*e.g+.0722*e.b;e.multiplyScalar(1.35).lerp(V,Math.max(A*Math.min(1,2*t),.5*D.flash)),A&&e.setRGB(Math.max(e.r,.4),Math.max(e.g,.4),Math.max(e.b,.42))}}if(!r&&D.ts&&!_&&u.fog){if(P<0){if(N-=e,N>0)return;P=0,D.flashes++,N=g(Math.random()),z.copy(u.fog.color),H=!0}else u.fog.color.equals(B)||z.copy(u.fog.color),P+=e;D.flash=v(P),P>.7?G():(u.fog.color.copy(z).lerp(V,.45*D.flash),u.background?.copy?.(u.fog.color),B.copy(u.fog.color))}}return{set:W,update:K,state:D,object:E}}export{x as createPrecip};