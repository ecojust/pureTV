const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./photoreal-CB2Ed95F.js","./constants-b1kZgAm3.js","./Euler-Dsh7Rp5B.js","./Vector3-CZajvpgo.js","./BufferAttribute-CM2iXJnh.js","./runwayLights-Bbu1aGk0.js","./InterleavedBufferAttribute-CivLw0an.js","./windsock-BjZcmNQB.js","./InstancedMesh-BcSPlTKX.js","./surfaces-CgrXa_AV.js","./aircraftModel-Dbrk9XnU.js","./shortField-mhxDz6yq.js","./noFlap-SBt008Rf.js","./wingLow-CQCJzrfe.js","./xwTakeoff-BDWHTnP7.js","./softField-BGGlxOhQ.js","./shortTakeoff-Db8T4j9M.js","./wake-B265J6BN.js","./upset-Bb9T2at2.js","./slowFlight-DRA6FzmT.js","./turbulence-Ri7EPQuK.js","./emergencyDescent-RkUQF6zd.js","./steepTurns-CBgYcMHb.js","./aroundPoint-v57fFvtm.js","./power180-CVqMm5N4.js","./deadStick-BgxWnPyD.js","./pattern-C4r8Tj-4.js","./engineOut-Dn18BPxB.js","./rto-dFkgMbPy.js","./windshear-VUpaA8Bb.js","./lowIfr-Cz9lZElF.js","./metar-CfH-5DXz.js","./fbw-DzlrIn2A.js","./precip-aJqNImwC.js","./LineSegments-DxmXDdxC.js","./loadJsbsim-Cg1czyiG.js","./tower-CCjw7BRw.js","./atis-Bgyj0-fA.js","./debugScreen-Dc3_pz73.js","./skyDome-3N-So6MJ.js"])))=>i.map(i=>d[i]);
import{a as e,c as t,d as n,f as r,i,l as a,n as o,o as s,p as c,r as l,s as u,t as d,u as f}from"./BufferAttribute-CM2iXJnh.js";import{$ as p,A as m,At as h,Bt as g,Ct as _,D as v,Dt as y,E as b,Et as x,Ft as S,G as C,Gt as w,H as T,Ht as E,It as D,J as O,Jt as k,K as ee,Kt as te,Lt as A,M as ne,Mt as re,N as ie,Nt as ae,Ot as oe,Pt as se,Q as ce,Qt as le,R as ue,Rt as j,S as de,St as fe,T as M,Tt as pe,V as me,Vt as he,W as ge,Wt as _e,X as ve,Xt as ye,Yt as be,Z as xe,Zt as Se,_t as Ce,a as we,at as Te,b as N,bt as Ee,ct as De,dt as Oe,et as ke,f as Ae,ft as je,g as Me,gt as Ne,h as Pe,ht as Fe,i as P,it as Ie,jt as Le,kt as Re,l as F,lt as ze,m as Be,mt as Ve,n as He,nt as I,o as Ue,ot as L,p as R,pt as We,q as Ge,qt as Ke,r as qe,rt as Je,st as Ye,t as z,tt as Xe,ut as Ze,v as Qe,vt as $e,w as et,wt as tt,x as nt,xt as rt,y as it,yt as at,z as ot,zt as st}from"./Vector3-CZajvpgo.js";import{n as ct,t as lt}from"./Euler-Dsh7Rp5B.js";import{a as ut,c as dt,d as ft,i as pt,l as mt,n as ht,o as gt,r as _t,s as vt,t as B,u as V}from"./constants-b1kZgAm3.js";var yt=Object.defineProperty,bt=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),xt=(e,t)=>{let n={};for(var r in e)yt(n,r,{get:e[r],enumerable:!0});return t||yt(n,Symbol.toStringTag,{value:`Module`}),n};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var St,Ct=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{St===void 0&&(St=Pe(`canvas`)),St.width=e.width,St.height=e.height;let t=St.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=St}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Pe(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=f(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(f(t[e]/255)*255):t[e]=f(t[e]);return{data:t,width:e.width,height:e.height}}return N(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},wt=0,Tt=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:wt++}),this.uuid=F(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Et(r[t].image)):e.push(Et(r[t]))}else e=Et(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Et(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Ct.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(N(`Texture: Unable to serialize Texture.`),{})}var Dt=class extends Tt{constructor(e=null){nt(`Source: "Source" has been renamed to "TextureSource". Please update your code to use "THREE.TextureSource" instead.`),super(e),this.isSource=!0}},Ot=0,kt=new z,At=class e extends c{constructor(t=e.DEFAULT_IMAGE,i=e.DEFAULT_MAPPING,a=M,o=M,s=ot,c=me,l=ke,u=_e,d=e.DEFAULT_ANISOTROPY,f=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ot++}),this.uuid=F(),this.name=``,this.source=new Tt(t),this.mipmaps=[],this.mapping=i,this.channel=0,this.wrapS=a,this.wrapT=o,this.magFilter=s,this.minFilter=c,this.anisotropy=d,this.format=l,this.internalFormat=null,this.type=u,this.offset=new r(0,0),this.repeat=new r(1,1),this.center=new r(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new n,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(kt).x}get height(){return this.source.getSize(kt).y}get depth(){return this.source.getSize(kt).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){N(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?N(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case S:e.x-=Math.floor(e.x);break;case M:e.x=e.x<0?0:1;break;case C:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case S:e.y-=Math.floor(e.y);break;case M:e.y=e.y<0?0:1;break;case C:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};At.DEFAULT_IMAGE=null,At.DEFAULT_MAPPING=300,At.DEFAULT_ANISOTROPY=1;var jt=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ue(this.x,e.x,t.x),this.y=Ue(this.y,e.y,t.y),this.z=Ue(this.z,e.z,t.z),this.w=Ue(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ue(this.x,e,t),this.y=Ue(this.y,e,t),this.z=Ue(this.z,e,t),this.w=Ue(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ue(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Mt=class extends c{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ot,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new jt(0,0,e,t),this.scissorTest=!1,this.viewport=new jt(0,0,e,t),this.textures=[];let r=new At({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:ot,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Tt(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Nt=class extends Mt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Pt=class extends At{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ee,this.minFilter=ee,this.wrapR=M,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Ft=class extends At{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ee,this.minFilter=ee,this.wrapR=M,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},It=class extends u{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Lt=class e{constructor(e,t=25e-5){this.isFogExp2=!0,this.name=``,this.color=new s(e),this.density=t}clone(){return new e(this.color,this.density)}toJSON(){return{type:`FogExp2`,name:this.name,color:this.color.getHex(),density:this.density}}},Rt=class extends u{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new lt,this.environmentIntensity=1,this.environmentRotation=new lt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},zt=new z,Bt=new z,Vt=new z,Ht=new z,Ut=new z,Wt=new z,Gt=new z,Kt=new z,qt=new z,Jt=new z,Yt=new jt,Xt=new jt,Zt=new jt,Qt=class e{constructor(e=new z,t=new z,n=new z){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),zt.subVectors(e,t),r.cross(zt);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){zt.subVectors(r,t),Bt.subVectors(n,t),Vt.subVectors(e,t);let a=zt.dot(zt),o=zt.dot(Bt),s=zt.dot(Vt),c=Bt.dot(Bt),l=Bt.dot(Vt),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ht)!==null&&Ht.x>=0&&Ht.y>=0&&Ht.x+Ht.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Ht)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Ht.x),s.addScaledVector(a,Ht.y),s.addScaledVector(o,Ht.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Yt.setScalar(0),Xt.setScalar(0),Zt.setScalar(0),Yt.fromBufferAttribute(e,t),Xt.fromBufferAttribute(e,n),Zt.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Yt,i.x),a.addScaledVector(Xt,i.y),a.addScaledVector(Zt,i.z),a}static isFrontFacing(e,t,n,r){return zt.subVectors(n,t),Bt.subVectors(e,t),zt.cross(Bt).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return zt.subVectors(this.c,this.b),Bt.subVectors(this.a,this.b),zt.cross(Bt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Ut.subVectors(r,n),Wt.subVectors(i,n),Kt.subVectors(e,n);let s=Ut.dot(Kt),c=Wt.dot(Kt);if(s<=0&&c<=0)return t.copy(n);qt.subVectors(e,r);let l=Ut.dot(qt),u=Wt.dot(qt);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Ut,a);Jt.subVectors(e,i);let f=Ut.dot(Jt),p=Wt.dot(Jt);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Wt,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Gt.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Gt,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Ut,a).addScaledVector(Wt,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},$t=new e,en=new z,tn=new z,nn=class{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?$t.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;en.subVectors(e,this.center);let t=en.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(en,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(tn.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(en.copy(e.center).add(tn)),this.expandByPoint(en.copy(e.center).sub(tn))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},rn=0,an=new ct,on=new u,sn=new z,cn=new e,ln=new e,un=new z,dn=class t extends c{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:rn++}),this.uuid=F(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(R(e)?i:l)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let r=this.attributes.normal;if(r!==void 0){let t=new n().getNormalMatrix(e);r.applyNormalMatrix(t),r.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,n){return an.makeTranslation(e,t,n),this.applyMatrix4(an),this}scale(e,t,n){return an.makeScale(e,t,n),this.applyMatrix4(an),this}lookAt(e){return on.lookAt(e),on.updateMatrix(),this.applyMatrix4(on.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(sn).negate(),this.translate(sn.x,sn.y,sn.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new o(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&N(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new e);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute)Me(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));else{if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let e=0,t=n.length;e<t;e++){let t=n[e];cn.setFromBufferAttribute(t),this.morphTargetsRelative?(un.addVectors(this.boundingBox.min,cn.min),this.boundingBox.expandByPoint(un),un.addVectors(this.boundingBox.max,cn.max),this.boundingBox.expandByPoint(un)):(this.boundingBox.expandByPoint(cn.min),this.boundingBox.expandByPoint(cn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Me(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new nn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)Me(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new z,1/0);else if(e){let n=this.boundingSphere.center;if(cn.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];ln.setFromBufferAttribute(n),this.morphTargetsRelative?(un.addVectors(cn.min,ln.min),cn.expandByPoint(un),un.addVectors(cn.max,ln.max),cn.expandByPoint(un)):(cn.expandByPoint(ln.min),cn.expandByPoint(ln.max))}cn.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)un.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(un));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)un.fromBufferAttribute(a,t),o&&(sn.fromBufferAttribute(e,t),un.add(sn)),r=Math.max(r,n.distanceToSquared(un))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Me(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Me(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,i=t.normal,a=t.uv,o=this.getAttribute(`tangent`);(o===void 0||o.count!==n.count)&&(o=new d(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,o));let s=[],c=[];for(let e=0;e<n.count;e++)s[e]=new z,c[e]=new z;let l=new z,u=new z,f=new z,p=new r,m=new r,h=new r,g=new z,_=new z;function v(e,t,r){l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),f.fromBufferAttribute(n,r),p.fromBufferAttribute(a,e),m.fromBufferAttribute(a,t),h.fromBufferAttribute(a,r),u.sub(l),f.sub(l),m.sub(p),h.sub(p);let i=1/(m.x*h.y-h.x*m.y);isFinite(i)&&(g.copy(u).multiplyScalar(h.y).addScaledVector(f,-m.y).multiplyScalar(i),_.copy(f).multiplyScalar(m.x).addScaledVector(u,-h.x).multiplyScalar(i),s[e].add(g),s[t].add(g),s[r].add(g),c[e].add(_),c[t].add(_),c[r].add(_))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let t=0,n=y.length;t<n;++t){let n=y[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)v(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let b=new z,x=new z,S=new z,C=new z;function w(e){S.fromBufferAttribute(i,e),C.copy(S);let t=s[e];b.copy(t),b.sub(S.multiplyScalar(S.dot(t))).normalize(),x.crossVectors(C,t);let n=x.dot(c[e])<0?-1:1;o.setXYZW(e,b.x,b.y,b.z,n)}for(let t=0,n=y.length;t<n;++t){let n=y[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)w(e.getX(t+0)),w(e.getX(t+1)),w(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new d(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new z,i=new z,a=new z,o=new z,s=new z,c=new z,l=new z,u=new z;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)un.fromBufferAttribute(e,t),un.normalize(),e.setXYZ(t,un.x,un.y,un.z)}toNonIndexed(){function e(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new d(a,r,i)}if(this.index===null)return N(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new t,r=this.index.array,i=this.attributes;for(let t in i){let a=i[t],o=e(a,r);n.setAttribute(t,o)}let a=this.morphAttributes;for(let t in a){let i=[],o=a[t];for(let t=0,n=o.length;t<n;t++){let n=o[t],a=e(n,r);i.push(a)}n.morphAttributes[t]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},fn=new z,pn=new z,mn=new n,hn=class{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=fn.subVectors(n,t).cross(pn.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(fn),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||mn.getNormalMatrix(e),r=this.coplanarPoint(fn).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},gn=0,_n=class extends c{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:gn++}),this.uuid=F(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new s(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ue,this.stencilZFail=ue,this.stencilZPass=ue,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){N(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?N(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new s().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new hn().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new r().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new r().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},vn=new z,yn=new z,bn=new z,xn=new z,Sn=class{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,vn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=vn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(vn.copy(this.origin).addScaledVector(this.direction,t),vn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){yn.copy(e).add(t).multiplyScalar(.5),bn.copy(t).sub(e).normalize(),xn.copy(this.origin).sub(yn);let i=e.distanceTo(t)*.5,a=-this.direction.dot(bn),o=xn.dot(this.direction),s=-xn.dot(bn),c=xn.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(yn).addScaledVector(bn,d),f}intersectSphere(e,t){if(e.radius<0)return null;vn.subVectors(e.center,this.origin);let n=vn.dot(this.direction),r=vn.dot(vn)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,vn)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,ee,te,A,ne;if(y>=b&&y>=x?(w=s,D=u,ee=p,ne=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,te=_,A=v):(S=l,C=c,T=f,E=d,O=h,k=m,te=v,A=_)):b>=x?(w=c,D=d,ee=m,ne=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,te=v,A=g):(S=s,C=l,T=u,E=f,O=p,k=h,te=g,A=v)):(w=l,D=f,ee=h,ne=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,te=g,A=_):(S=c,C=s,T=d,E=u,O=m,k=p,te=_,A=g)),w===0)return null;let re=S/w,ie=C/w,ae=1/w,oe=T-re*D,se=E-ie*D,ce=O-re*ee,le=k-ie*ee,ue=te-re*ne,j=A-ie*ne,de=ue*le-j*ce,fe=oe*j-se*ue,M=ce*se-le*oe;if(r){if(de<0||fe<0||M<0)return null}else if((de<0||fe<0||M<0)&&(de>0||fe>0||M>0))return null;let pe=de+fe+M;if(pe===0)return null;let me=ae*(de*D+fe*ee+M*ne);return(pe>0?me<0:me>0)?null:this.at(me/pe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Cn=class extends _n{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new s(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new lt,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},wn=new ct,Tn=new Sn,En=new nn,Dn=new z,On=new z,kn=new z,An=new z,jn=new z,Mn=new z,Nn=new z,Pn=new z,H=class extends u{constructor(e=new dn,t=new Cn){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Mn.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(jn.fromBufferAttribute(s,e),a?Mn.addScaledVector(jn,r):Mn.addScaledVector(jn.sub(t),r))}t.add(Mn)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),En.copy(n.boundingSphere),En.applyMatrix4(i),Tn.copy(e.ray).recast(e.near),En.containsPoint(Tn.origin)===!1&&(Tn.intersectSphere(En,Dn)===null||Tn.origin.distanceToSquared(Dn)>(e.far-e.near)**2)||(wn.copy(i).invert(),Tn.copy(e.ray).applyMatrix4(wn),(n.boundingBox===null||Tn.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Tn)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=In(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=In(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=In(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=In(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Fn(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Pn.copy(s),Pn.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Pn);return l<n.near||l>n.far?null:{distance:l,point:Pn.clone(),object:e}}function In(e,t,n,i,a,o,s,c,l,u){e.getVertexPosition(c,On),e.getVertexPosition(l,kn),e.getVertexPosition(u,An);let d=Fn(e,t,n,i,On,kn,An,Nn);if(d){let e=new z;Qt.getBarycoord(Nn,On,kn,An,e),a&&(d.uv=Qt.getInterpolatedAttribute(a,c,l,u,e,new r)),o&&(d.uv1=Qt.getInterpolatedAttribute(o,c,l,u,e,new r)),s&&(d.normal=Qt.getInterpolatedAttribute(s,c,l,u,e,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));let t={a:c,b:l,c:u,normal:new z,materialIndex:0};Qt.getNormal(On,kn,An,t.normal),d.face=t,d.barycoord=e}return d}var Ln=class extends At{constructor(e=null,t=1,n=1,r,i,a,o,s,c=ee,l=ee,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Rn=new nn,zn=new r(.5,.5),Bn=new z,Vn=class{constructor(e=new hn,t=new hn,n=new hn,r=new hn,i=new hn,a=new hn){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=le,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Rn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Rn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Rn)}intersectsSprite(e){return Rn.center.set(0,0,0),Rn.radius=.7071067811865476+zn.distanceTo(e.center),Rn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Rn)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Bn.x=r.normal.x>0?e.max.x:e.min.x,Bn.y=r.normal.y>0?e.max.y:e.min.y,Bn.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Bn)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Hn=class extends _n{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new s(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Un=new ct,Wn=new Sn,Gn=new nn,Kn=new z,qn=class extends u{constructor(e=new dn,t=new Hn){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Gn.copy(n.boundingSphere),Gn.applyMatrix4(r),Gn.radius+=i,e.ray.intersectsSphere(Gn)===!1)return;Un.copy(r).invert(),Wn.copy(e.ray).applyMatrix4(Un);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);Kn.fromBufferAttribute(l,n),Jn(Kn,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)Kn.fromBufferAttribute(l,a),Jn(Kn,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Jn(e,t,n,r,i,a,o){let s=Wn.distanceSqToPoint(e);if(s<n){let n=new z;Wn.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var Yn=class extends At{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Xn=class extends At{constructor(e,t,n=k,r,i,a,o=ee,s=ee,c,l=b,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Tt(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Zn=class e extends dn{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let s=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let c=[],l=[],u=[],d=[],f=0,p=0;m(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),m(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),m(`x`,`z`,`y`,1,1,e,n,t,r,a,2),m(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),m(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),m(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(c),this.setAttribute(`position`,new o(l,3)),this.setAttribute(`normal`,new o(u,3)),this.setAttribute(`uv`,new o(d,2));function m(e,t,n,r,i,a,o,m,h,g,_){let v=a/h,y=o/g,b=a/2,x=o/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new z;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,l.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,u.push(D.x,D.y,D.z),d.push(s/h),d.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=f+t+C*e,r=f+t+C*(e+1),i=f+(t+1)+C*(e+1),a=f+(t+1)+C*e;c.push(n,r,a),c.push(r,i,a),E+=6}s.addGroup(p,E,_),p+=E,f+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Qn=class e extends dn{constructor(e=1,t=1,n=1,i=32,a=1,s=!1,c=0,l=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:a,openEnded:s,thetaStart:c,thetaLength:l};let u=this;i=Math.floor(i),a=Math.floor(a);let d=[],f=[],p=[],m=[],h=0,g=[],_=n/2,v=0;y(),s===!1&&(e>0&&b(!0),t>0&&b(!1)),this.setIndex(d),this.setAttribute(`position`,new o(f,3)),this.setAttribute(`normal`,new o(p,3)),this.setAttribute(`uv`,new o(m,2));function y(){let r=new z,o=new z,s=0,y=(t-e)/n;for(let s=0;s<=a;s++){let u=[],d=s/a,v=d*(t-e)+e;for(let e=0;e<=i;e++){let t=e/i,a=t*l+c,s=Math.sin(a),g=Math.cos(a);o.x=v*s,o.y=-d*n+_,o.z=v*g,f.push(o.x,o.y,o.z),r.set(s,y,g).normalize(),p.push(r.x,r.y,r.z),m.push(t,1-d),u.push(h++)}g.push(u)}for(let n=0;n<i;n++)for(let r=0;r<a;r++){let i=g[r][n],o=g[r+1][n],c=g[r+1][n+1],l=g[r][n+1];(e>0||r!==0)&&(d.push(i,o,l),s+=3),(t>0||r!==a-1)&&(d.push(o,c,l),s+=3)}u.addGroup(v,s,0),v+=s}function b(n){let a=h,o=new r,s=new z,g=0,y=n===!0?e:t,b=n===!0?1:-1;for(let e=1;e<=i;e++)f.push(0,_*b,0),p.push(0,b,0),m.push(.5,.5),h++;let x=h;for(let e=0;e<=i;e++){let t=e/i*l+c,n=Math.cos(t),r=Math.sin(t);s.x=y*r,s.y=_*b,s.z=y*n,f.push(s.x,s.y,s.z),p.push(0,b,0),o.x=n*.5+.5,o.y=r*.5*b+.5,m.push(o.x,o.y),h++}for(let e=0;e<i;e++){let t=a+e,r=x+e;n===!0?d.push(r,r+1,t):d.push(r+1,r,t),g+=3}u.addGroup(v,g,n===!0?1:2),v+=g}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},$n=class e extends dn{constructor(e=[new r(0,-.5),new r(.5,0),new r(0,.5)],t=12,n=0,i=Math.PI*2){super(),this.type=`LatheGeometry`,this.parameters={points:e,segments:t,phiStart:n,phiLength:i},t=Math.floor(t),i=Ue(i,0,Math.PI*2);let a=[],s=[],c=[],l=[],u=[],d=1/t,f=new z,p=new r,m=new z,h=new z,g=new z,_=0,v=0;for(let t=0;t<=e.length-1;t++)switch(t){case 0:_=e[t+1].x-e[t].x,v=e[t+1].y-e[t].y,m.x=v*1,m.y=-_,m.z=v*0,g.copy(m),m.normalize(),l.push(m.x,m.y,m.z);break;case e.length-1:l.push(g.x,g.y,g.z);break;default:_=e[t+1].x-e[t].x,v=e[t+1].y-e[t].y,m.x=v*1,m.y=-_,m.z=v*0,h.copy(m),m.x+=g.x,m.y+=g.y,m.z+=g.z,m.normalize(),l.push(m.x,m.y,m.z),g.copy(h)}for(let r=0;r<=t;r++){let a=n+r*d*i,o=Math.sin(a),m=Math.cos(a);for(let n=0;n<=e.length-1;n++){f.x=e[n].x*o,f.y=e[n].y,f.z=e[n].x*m,s.push(f.x,f.y,f.z),p.x=r/t,p.y=n/(e.length-1),c.push(p.x,p.y);let i=l[3*n+0]*o,a=l[3*n+1],d=l[3*n+0]*m;u.push(i,a,d)}}for(let n=0;n<t;n++)for(let t=0;t<e.length-1;t++){let r=t+n*e.length,i=r,o=r+e.length,s=r+e.length+1,c=r+1;a.push(i,o,c),a.push(s,c,o)}this.setIndex(a),this.setAttribute(`position`,new o(s,3)),this.setAttribute(`uv`,new o(c,2)),this.setAttribute(`normal`,new o(u,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.points,t.segments,t.phiStart,t.phiLength)}},er=class e extends dn{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,s=Math.floor(n),c=Math.floor(r),l=s+1,u=c+1,d=e/s,f=t/c,p=[],m=[],h=[],g=[];for(let e=0;e<u;e++){let t=e*f-a;for(let n=0;n<l;n++){let r=n*d-i;m.push(r,-t,0),h.push(0,0,1),g.push(n/s),g.push(1-e/c)}}for(let e=0;e<c;e++)for(let t=0;t<s;t++){let n=t+l*e,r=t+l*(e+1),i=t+1+l*(e+1),a=t+1+l*e;p.push(n,r,a),p.push(r,i,a)}this.setIndex(p),this.setAttribute(`position`,new o(m,3)),this.setAttribute(`normal`,new o(h,3)),this.setAttribute(`uv`,new o(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},tr=class e extends dn{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,s=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:s},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(a+s,Math.PI),l=0,u=[],d=new z,f=new z,p=[],m=[],h=[],g=[];for(let o=0;o<=n;o++){let p=[],_=o/n,v=a+_*s,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;o===0&&a===0?x=.5/t:o===n&&c===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;d.x=-b*Math.cos(a),d.y=y,d.z=b*Math.sin(a),m.push(d.x,d.y,d.z),f.copy(d).normalize(),h.push(f.x,f.y,f.z),g.push(n+x,1-_),p.push(l++)}u.push(p)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=u[e][r+1],i=u[e][r],o=u[e+1][r],s=u[e+1][r+1];(e!==0||a>0)&&p.push(t,i,s),(e!==n-1||c<Math.PI)&&p.push(i,o,s)}this.setIndex(p),this.setAttribute(`position`,new o(m,3)),this.setAttribute(`normal`,new o(h,3)),this.setAttribute(`uv`,new o(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},nr=class e extends dn{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,s=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:s},n=Math.floor(n),r=Math.floor(r);let c=[],l=[],u=[],d=[],f=new z,p=new z,m=new z;for(let o=0;o<=n;o++){let c=a+o/n*s;for(let a=0;a<=r;a++){let s=a/r*i;p.x=(e+t*Math.cos(c))*Math.cos(s),p.y=(e+t*Math.cos(c))*Math.sin(s),p.z=t*Math.sin(c),l.push(p.x,p.y,p.z),f.x=e*Math.cos(s),f.y=e*Math.sin(s),m.subVectors(p,f).normalize(),u.push(m.x,m.y,m.z),d.push(a/r),d.push(o/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;c.push(n,i,o),c.push(i,a,o)}this.setIndex(c),this.setAttribute(`position`,new o(l,3)),this.setAttribute(`normal`,new o(u,3)),this.setAttribute(`uv`,new o(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function rr(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(ar(i))i.isRenderTargetTexture?(N(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(ar(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function ir(e){let t={};for(let n=0;n<e.length;n++){let r=rr(e[n]);for(let e in r)t[e]=r[e]}return t}function ar(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function or(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function sr(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:a.workingColorSpace}var cr={clone:rr,merge:ir},lr=`
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,ur=`
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`,dr=class extends _n{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lr,this.fragmentShader=ur,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=rr(e.uniforms),this.uniformsGroups=or(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let a=e.uniforms[i];switch(this.uniforms[i]={},a.type){case`t`:this.uniforms[i].value=t[a.value]||null;break;case`c`:this.uniforms[i].value=new s().setHex(a.value);break;case`v2`:this.uniforms[i].value=new r().fromArray(a.value);break;case`v3`:this.uniforms[i].value=new z().fromArray(a.value);break;case`v4`:this.uniforms[i].value=new jt().fromArray(a.value);break;case`m3`:this.uniforms[i].value=new n().fromArray(a.value);break;case`m4`:this.uniforms[i].value=new ct().fromArray(a.value);break;default:this.uniforms[i].value=a.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},fr=class extends dr{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},pr=class extends _n{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new s(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new s(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new r(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new lt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},mr=class extends _n{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new s(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new s(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new r(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new lt,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},hr={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(gr(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!gr(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function gr(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var _r=class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},vr=new _r,yr=class{constructor(e){this.manager=e===void 0?vr:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};yr.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var br=new WeakMap,xr=class extends yr{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=hr.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=br.get(a);e===void 0&&(e=[],br.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=Pe(`img`);function s(){l(),t&&t(this);let n=br.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}br.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),hr.remove(`image:${e}`);let n=br.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}br.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),hr.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},Sr=class extends yr{constructor(e){super(e)}load(e,t,n,r){let i=new At,a=new xr(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},Cr=class extends u{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new s(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},wr=new ct,Tr=new z,Er=new z,Dr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new r(512,512),this.mapType=_e,this.map=null,this.mapPass=null,this.matrix=new ct,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Vn,this._frameExtents=new r(1,1),this._viewportCount=1,this._viewports=[new jt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Tr.setFromMatrixPosition(e.matrixWorld),t.position.copy(Tr),Er.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Er),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){wr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(wr,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(wr)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Or=new z,kr=new He,Ar=new z,jr=class extends u{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new ct,this.projectionMatrix=new ct,this.projectionMatrixInverse=new ct,this.coordinateSystem=le,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Or,kr,Ar),Ar.x===1&&Ar.y===1&&Ar.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Or,kr,Ar.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Or,kr,Ar),Ar.x===1&&Ar.y===1&&Ar.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Or,kr,Ar.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Mr=new z,Nr=new r,Pr=new r,Fr=class extends jr{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=we*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(qe*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return we*2*Math.atan(Math.tan(qe*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Mr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Mr.x,Mr.y).multiplyScalar(-e/Mr.z),Mr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mr.x,Mr.y).multiplyScalar(-e/Mr.z)}getViewSize(e,t){return this.getViewBounds(e,Nr,Pr),t.subVectors(Pr,Nr)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(qe*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ir=class extends jr{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Lr=class extends Dr{constructor(){super(new Ir(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Rr=class extends Cr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(u.DEFAULT_UP),this.updateMatrix(),this.target=new u,this.shadow=new Lr}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},zr=class extends Cr{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type=`AmbientLight`}},Br=-90,Vr=1,Hr=class extends u{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Fr(Br,Vr,e,t);r.layers=this.layers,this.add(r);let i=new Fr(Br,Vr,e,t);i.layers=this.layers,this.add(i);let a=new Fr(Br,Vr,e,t);a.layers=this.layers,this.add(a);let o=new Fr(Br,Vr,e,t);o.layers=this.layers,this.add(o);let s=new Fr(Br,Vr,e,t);s.layers=this.layers,this.add(s);let c=new Fr(Br,Vr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}};function Ur(e,t){let n=e.image&&e.image.width?e.image.width/e.image.height:1;return n>t?(e.repeat.x=1,e.repeat.y=n/t,e.offset.x=0,e.offset.y=(1-e.repeat.y)/2):(e.repeat.x=t/n,e.repeat.y=1,e.offset.x=(1-e.repeat.x)/2,e.offset.y=0),e}function Wr(e,t){let n=e.image&&e.image.width?e.image.width/e.image.height:1;return n>t?(e.repeat.x=t/n,e.repeat.y=1,e.offset.x=(1-e.repeat.x)/2,e.offset.y=0):(e.repeat.x=1,e.repeat.y=n/t,e.offset.x=0,e.offset.y=(1-e.repeat.y)/2),e}function Gr(e){return e.repeat.x=1,e.repeat.y=1,e.offset.x=0,e.offset.y=0,e}function Kr(e,t,n,r){let i=qr(r);switch(n){case de:return e*t;case ae:return e*t/i.components*i.byteLength;case se:return e*t/i.components*i.byteLength;case Le:return e*t*2/i.components*i.byteLength;case re:return e*t*2/i.components*i.byteLength;case _:return e*t*3/i.components*i.byteLength;case ke:return e*t*4/i.components*i.byteLength;case Xe:return e*t*4/i.components*i.byteLength;case h:case Ee:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case rt:case fe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case oe:case $e:return Math.max(e,16)*Math.max(t,8)/4;case Re:case at:return Math.max(e,8)*Math.max(t,8)/2;case x:case y:case ve:case D:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ce:case p:case st:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case De:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ze:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Ze:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Oe:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case je:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case We:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Ve:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Fe:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Je:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Ie:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Te:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case I:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case L:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Ye:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ne:case tt:case pe:return Math.ceil(e/4)*Math.ceil(t/4)*16;case ce:case j:return Math.ceil(e/4)*Math.ceil(t/4)*8;case xe:case A:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function qr(e){switch(e){case _e:case et:return{byteLength:1,components:1};case Se:case E:case ne:return{byteLength:2,components:1};case be:case ye:return{byteLength:2,components:4};case k:case ie:case m:return{byteLength:4,components:1};case Ke:case w:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}var Jr=class{static contain(e,t){return Ur(e,t)}static cover(e,t){return Wr(e,t)}static fill(e){return Gr(e)}static getByteLength(e,t,n,r){return Kr(e,t,n,r)}};function Yr(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Xr(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var U={alphahash_fragment:`
#ifdef USE_ALPHAHASH

	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;

#endif
`,alphahash_pars_fragment:`
#ifdef USE_ALPHAHASH

	/**
	 * See: https://casual-effects.com/research/Wyman2017Hashed/index.html
	 */

	const float ALPHA_HASH_SCALE = 0.05; // Derived from trials only, and may be changed.

	float hash2D( vec2 value ) {

		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );

	}

	float hash3D( vec3 value ) {

		return hash2D( vec2( hash2D( value.xy ), value.z ) );

	}

	float getAlphaHashThreshold( vec3 position ) {

		// Find the discretized derivatives of our coordinates
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );

		// Find two nearest log-discretized noise scales
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);

		// Compute alpha thresholds at our two noise scales
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);

		// Factor to interpolate lerp with
		float lerpFactor = fract( log2( pixScale ) );

		// Interpolate alpha threshold from noise at two scales
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;

		// Pass into CDF to compute uniformly distrib threshold
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);

		// Find our final, uniformly distributed alpha threshold (ατ)
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;

		// Avoids ατ == 0. Could also do ατ =1-ατ
		return clamp( threshold , 1.0e-6, 1.0 );

	}

#endif
`,alphamap_fragment:`
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`,alphamap_pars_fragment:`
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`,alphatest_fragment:`
#ifdef USE_ALPHATEST

	#ifdef ALPHA_TO_COVERAGE

	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;

	#else

	if ( diffuseColor.a < alphaTest ) discard;

	#endif

#endif
`,alphatest_pars_fragment:`
#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif
`,aomap_fragment:`
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;

	reflectedLight.indirectDiffuse *= ambientOcclusion;

	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif

	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif

	#if defined( USE_ENVMAP ) && defined( STANDARD )

		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );

		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

	#endif

#endif
`,aomap_pars_fragment:`
#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif
`,batching_pars_vertex:`
#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif

	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {

		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );

	}

	float getIndirectIndex( const in int i ) {

		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );

	}

#endif

#ifdef USE_BATCHING_COLOR

	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {

		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );

	}

#endif
`,batching_vertex:`
#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`,begin_vertex:`
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif
`,beginnormal_vertex:`
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif
`,bsdfs:`

float G_BlinnPhong_Implicit( /* const in float dotNL, const in float dotNV */ ) {

	// geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)
	return 0.25;

}

float D_BlinnPhong( const in float shininess, const in float dotNH ) {

	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );

}

vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );

	vec3 F = F_Schlick( specularColor, 1.0, dotVH );

	float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );

	float D = D_BlinnPhong( shininess, dotNH );

	return F * ( G * D );

} // validated

`,iridescence_fragment:`

#ifdef USE_IRIDESCENCE

	// XYZ to linear-sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	// Assume air interface for top
	// Note: We don't handle the case fresnel0 == 1
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float IorToFresnel0( float transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));

	}

	// Fresnel equations for dielectric/dielectric interfaces.
	// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
	// Evaluation XYZ sensitivity curves in Fourier space
	vec3 evalSensitivity( float OPD, vec3 shift ) {

		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );

		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;

		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;

	}

	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {

		vec3 I;

		// Force iridescenceIOR -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;

		// Phase shift
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}

#endif

`,bumpmap_pars_fragment:`
#ifdef USE_BUMPMAP

	uniform sampler2D bumpMap;
	uniform float bumpScale;

	// Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// https://mmikk.github.io/papers3d/mm_sfgrad_bump.pdf

	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)

	vec2 dHdxy_fwd() {

		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );

		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;

		return vec2( dBx, dBy );

	}

	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		// normalize is done to ensure that the bump map looks the same regardless of the texture's scale
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm; // normalized

		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );

		float fDet = dot( vSigmaX, R1 ) * faceDirection;

		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );

	}

#endif
`,clipping_planes_fragment:`
#if NUM_CLIPPING_PLANES > 0

	vec4 plane;

	#ifdef ALPHA_TO_COVERAGE

		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;

		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );

			if ( clipOpacity == 0.0 ) discard;

		}
		#pragma unroll_loop_end

		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

			float unionClipOpacity = 1.0;

			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );

			}
			#pragma unroll_loop_end

			clipOpacity *= 1.0 - unionClipOpacity;

		#endif

		diffuseColor.a *= clipOpacity;

		if ( diffuseColor.a == 0.0 ) discard;

	#else

		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;

		}
		#pragma unroll_loop_end

		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

			bool clipped = true;

			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;

			}
			#pragma unroll_loop_end

			if ( clipped ) discard;

		#endif

	#endif

#endif
`,clipping_planes_pars_fragment:`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif
`,clipping_planes_pars_vertex:`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif
`,clipping_planes_vertex:`
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif
`,color_fragment:`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#endif
`,color_pars_fragment:`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#endif
`,color_pars_vertex:`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	varying vec4 vColor;

#endif
`,color_vertex:`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	vColor = vec4( 1.0 );

#endif

#ifdef USE_COLOR_ALPHA

	vColor *= color;

#elif defined( USE_COLOR )

	vColor.rgb *= color;

#endif

#ifdef USE_INSTANCING_COLOR

	vColor.rgb *= instanceColor.rgb;

#endif

#ifdef USE_BATCHING_COLOR

	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );

#endif
`,common:`
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6

#ifndef saturate
// <tonemapping_pars_fragment> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )

float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }

// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand( const in vec2 uv ) {

	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );

	return fract( sin( sn ) * c );

}

#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif

struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};

struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};

#ifdef USE_ALPHAHASH

	varying vec3 vPosition;

#endif

vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

}

#define inverseTransformDirection transformDirectionByInverseViewMatrix // @deprecated r185

vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );

}

vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );

}

bool isPerspectiveMatrix( mat4 m ) {

	return m[ 2 ][ 3 ] == - 1.0;

}

vec2 equirectUv( in vec3 dir ) {

	// dir is assumed to be unit length

	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;

	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;

	return vec2( u, v );

}

vec3 BRDF_Lambert( const in vec3 diffuseColor ) {

	return RECIPROCAL_PI * diffuseColor;

} // validated

vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated

float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated
`,cube_uv_reflection_fragment:`
#ifdef ENVMAP_TYPE_CUBE_UV

	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0

	// These shader functions convert between the UV coordinates of a single face of
	// a cubemap, the 0-5 integer index of a cube face, and the direction vector for
	// sampling a textureCube (not generally normalized ).

	float getFace( vec3 direction ) {

		vec3 absDirection = abs( direction );

		float face = - 1.0;

		if ( absDirection.x > absDirection.z ) {

			if ( absDirection.x > absDirection.y )

				face = direction.x > 0.0 ? 0.0 : 3.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		} else {

			if ( absDirection.z > absDirection.y )

				face = direction.z > 0.0 ? 2.0 : 5.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		}

		return face;

	}

	// RH coordinate system; PMREM face-indexing convention
	vec2 getUV( vec3 direction, float face ) {

		vec2 uv;

		if ( face == 0.0 ) {

			uv = vec2( direction.z, direction.y ) / abs( direction.x ); // pos x

		} else if ( face == 1.0 ) {

			uv = vec2( - direction.x, - direction.z ) / abs( direction.y ); // pos y

		} else if ( face == 2.0 ) {

			uv = vec2( - direction.x, direction.y ) / abs( direction.z ); // pos z

		} else if ( face == 3.0 ) {

			uv = vec2( - direction.z, direction.y ) / abs( direction.x ); // neg x

		} else if ( face == 4.0 ) {

			uv = vec2( - direction.x, direction.z ) / abs( direction.y ); // neg y

		} else {

			uv = vec2( direction.x, direction.y ) / abs( direction.z ); // neg z

		}

		return 0.5 * ( uv + 1.0 );

	}

	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {

		float face = getFace( direction );

		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );

		mipInt = max( mipInt, cubeUV_minMipLevel );

		float faceSize = exp2( mipInt );

		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0; // #25071

		if ( face > 2.0 ) {

			uv.y += faceSize;

			face -= 3.0;

		}

		uv.x += face * faceSize;

		uv.x += filterInt * 3.0 * cubeUV_minTileSize;

		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );

		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;

		#ifdef texture2DGradEXT

			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb; // disable anisotropic filtering

		#else

			return texture2D( envMap, uv ).rgb;

		#endif

	}

	// These defines must match with PMREMGenerator

	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0

	float roughnessToMip( float roughness ) {

		float mip = 0.0;

		if ( roughness >= cubeUV_r1 ) {

			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;

		} else if ( roughness >= cubeUV_r4 ) {

			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;

		} else if ( roughness >= cubeUV_r5 ) {

			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;

		} else if ( roughness >= cubeUV_r6 ) {

			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;

		} else {

			mip = - 2.0 * log2( 1.16 * roughness ); // 1.16 = 1.79^0.25
		}

		return mip;

	}

	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {

		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );

		float mipF = fract( mip );

		float mipInt = floor( mip );

		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );

		if ( mipF == 0.0 ) {

			return vec4( color0, 1.0 );

		} else {

			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );

			return vec4( mix( color0, color1, mipF ), 1.0 );

		}

	}

#endif
`,defaultnormal_vertex:`

vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT

	vec3 transformedTangent = objectTangent;

#endif

#ifdef USE_BATCHING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;

	#ifdef USE_TANGENT

		transformedTangent = bm * transformedTangent;

	#endif

#endif

#ifdef USE_INSTANCING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;

	#ifdef USE_TANGENT

		transformedTangent = im * transformedTangent;

	#endif

#endif

transformedNormal = normalMatrix * transformedNormal;

#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

#ifdef USE_TANGENT

	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;

#endif
`,displacementmap_pars_vertex:`
#ifdef USE_DISPLACEMENTMAP

	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;

#endif
`,displacementmap_vertex:`
#ifdef USE_DISPLACEMENTMAP

	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );

#endif
`,emissivemap_fragment:`
#ifdef USE_EMISSIVEMAP

	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		emissiveColor = sRGBTransferEOTF( emissiveColor );

	#endif

	totalEmissiveRadiance *= emissiveColor.rgb;

#endif
`,emissivemap_pars_fragment:`
#ifdef USE_EMISSIVEMAP

	uniform sampler2D emissiveMap;

#endif
`,colorspace_fragment:`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`,colorspace_pars_fragment:`

vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}

vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

`,envmap_fragment:`
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vec3 cameraToFrag;

		if ( isOrthographic ) {

			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToFrag = normalize( vWorldPosition - cameraPosition );

		}

		// Transforming Normal Vectors with the Inverse Transformation
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vec3 reflectVec = reflect( cameraToFrag, worldNormal );

		#else

			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

		#endif

	#else

		vec3 reflectVec = vReflect;

	#endif

	#ifdef ENVMAP_TYPE_CUBE

		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );

		#ifdef ENVMAP_BLENDING_MULTIPLY

			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );

		#elif defined( ENVMAP_BLENDING_MIX )

			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );

		#elif defined( ENVMAP_BLENDING_ADD )

			outgoingLight += envColor.xyz * specularStrength * reflectivity;

		#endif

	#endif

#endif
`,envmap_common_pars_fragment:`
#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform mat3 envMapRotation;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif
`,envmap_pars_fragment:`
#ifdef USE_ENVMAP

	uniform float reflectivity;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif

#endif
`,envmap_pars_vertex:`
#ifdef USE_ENVMAP

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;

	#else

		varying vec3 vReflect;
		uniform float refractionRatio;

	#endif

#endif
`,envmap_physical_pars_fragment:`
#ifdef USE_ENVMAP

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );

			return PI * envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );

			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );

			return envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	#ifdef USE_RETROREFLECTION

		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

			#ifdef ENVMAP_TYPE_CUBE_UV

				// The retroreflective lobe returns light toward its source, so the environment is sampled along the view direction
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );

				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );

				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );

				return envMapColor.rgb * envMapIntensity;

			#else

				return vec3( 0.0 );

			#endif

		}

	#endif

	#ifdef USE_ANISOTROPY

		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

			#ifdef ENVMAP_TYPE_CUBE_UV

			  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

				return getIBLRadiance( viewDir, bentNormal, roughness );

			#else

				return vec3( 0.0 );

			#endif

		}

		#ifdef USE_RETROREFLECTION

			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

				#ifdef ENVMAP_TYPE_CUBE_UV

				  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

					return getIBLRetroRadiance( viewDir, bentNormal, roughness );

				#else

					return vec3( 0.0 );

				#endif

			}

		#endif

	#endif

#endif
`,envmap_vertex:`
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vWorldPosition = worldPosition.xyz;

	#else

		vec3 cameraToVertex;

		if ( isOrthographic ) {

			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );

		}

		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vReflect = reflect( cameraToVertex, worldNormal );

		#else

			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );

		#endif

	#endif

#endif
`,fog_vertex:`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z;

#endif
`,fog_pars_vertex:`
#ifdef USE_FOG

	varying float vFogDepth;

#endif
`,fog_fragment:`
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`,fog_pars_fragment:`
#ifdef USE_FOG

	uniform vec3 fogColor;
	varying float vFogDepth;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif
`,gradientmap_pars_fragment:`

#ifdef USE_GRADIENTMAP

	uniform sampler2D gradientMap;

#endif

vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {

	// dotNL will be from -1.0 to 1.0
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );

	#ifdef USE_GRADIENTMAP

		return vec3( texture2D( gradientMap, coord ).r );

	#else

		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );

	#endif

}
`,lightmap_pars_fragment:`
#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif
`,lights_lambert_fragment:`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`,lights_lambert_pars_fragment:`
varying vec3 vViewPosition;

struct LambertMaterial {

	vec3 diffuseColor;
	float specularStrength;

};

void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert
`,lights_pars_begin:`
uniform bool receiveShadow;
uniform vec3 ambientLightColor;

#if defined( USE_LIGHT_PROBES )

	uniform vec3 lightProbe[ 9 ];

#endif

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

	return result;

}

vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {

	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );

	return irradiance;

}

vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

	vec3 irradiance = ambientLightColor;

	return irradiance;

}

float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

	// based upon Frostbite 3 Moving to Physically-based Rendering
	// page 32, equation 26: E[window1]
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );

	if ( cutoffDistance > 0.0 ) {

		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

	}

	return distanceFalloff;

}

float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

	return smoothstep( coneCosine, penumbraCosine, angleCosine );

}

#if NUM_SUN_LIGHTS > 0

	struct SunLight {
		vec3 direction;
		vec3 color;
	};

	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];

	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {

		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;

	}

#endif


#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {

		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;

	}

#endif


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = pointLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float lightDistance = length( lVector );

		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );

	}

#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = spotLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float angleCos = dot( light.direction, spotLight.direction );

		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );

		if ( spotAttenuation > 0.0 ) {

			float lightDistance = length( lVector );

			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );

		} else {

			light.color = vec3( 0.0 );
			light.visible = false;

		}

	}

#endif


#if NUM_RECT_AREA_LIGHTS > 0

	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];

#endif


#if NUM_HEMI_LIGHTS > 0

	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};

	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];

	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {

		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

		return irradiance;

	}

#endif

#include <lightprobes_pars_fragment>
`,lights_toon_fragment:`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`,lights_toon_pars_fragment:`
varying vec3 vViewPosition;

struct ToonMaterial {

	vec3 diffuseColor;

};

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`,lights_phong_fragment:`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`,lights_phong_pars_fragment:`
varying vec3 vViewPosition;

struct BlinnPhongMaterial {

	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;

};

void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;

}

void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
`,lights_physical_fragment:`
PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;

vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );

material.roughness = max( roughnessFactor, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );

#ifdef IOR

	material.ior = ior;

	#ifdef USE_SPECULAR

		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;

		#ifdef USE_SPECULAR_COLORMAP

			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;

		#endif

		#ifdef USE_SPECULAR_INTENSITYMAP

			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;

		#endif

		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );

	#else

		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;

	#endif

	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );

#else

	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;

#endif

#ifdef USE_CLEARCOAT

	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;

	#ifdef USE_CLEARCOATMAP

		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;

	#endif

	#ifdef USE_CLEARCOAT_ROUGHNESSMAP

		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;

	#endif

	material.clearcoat = saturate( material.clearcoat ); // Burley clearcoat model
	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );

#endif

#ifdef USE_DISPERSION

	material.dispersion = dispersion;

#endif

#ifdef USE_RETROREFLECTION

	material.retroreflectivity = retroreflectivity;

#endif

#ifdef USE_IRIDESCENCE

	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;

	#ifdef USE_IRIDESCENCEMAP

		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;

	#endif

	#ifdef USE_IRIDESCENCE_THICKNESSMAP

		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;

	#else

		material.iridescenceThickness = iridescenceThicknessMaximum;

	#endif

#endif

#ifdef USE_SHEEN

	material.sheenColor = sheenColor;

	#ifdef USE_SHEEN_COLORMAP

		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;

	#endif

	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );

	#ifdef USE_SHEEN_ROUGHNESSMAP

		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;

	#endif

#endif

#ifdef USE_ANISOTROPY

	#ifdef USE_ANISOTROPYMAP

		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;

	#else

		vec2 anisotropyV = anisotropyVector;

	#endif

	material.anisotropy = length( anisotropyV );

	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}

	// Roughness along the anisotropy bitangent is the material roughness, while the tangent roughness increases with anisotropy.
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );

	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;

#endif
`,lights_physical_pars_fragment:`

uniform sampler2D dfgLUT;

struct PhysicalMaterial {

	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;

	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;

	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif

	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif

	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif

	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif

	#ifdef IOR
		float ior;
	#endif

	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif

	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif

};

// temporary
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );

vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );

    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {

	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );

	return 0.5 / max( gv + gl, EPSILON );

}

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney’s reparameterization
float D_GGX( const in float alpha, const in float dotNH ) {

	float a2 = pow2( alpha );

	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1

	return RECIPROCAL_PI * a2 / pow2( denom );

}

// https://google.github.io/filament/Filament.md.html#materialsystem/anisotropicmodel/anisotropicspecularbrdf
#ifdef USE_ANISOTROPY

	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {

		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );

	}

	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {

		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;

		return RECIPROCAL_PI * a2 * pow2 ( w2 );

	}

#endif

#ifdef USE_CLEARCOAT

	// GGX Distribution, Schlick Fresnel, GGX_SmithCorrelated Visibility
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {

		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;

		float alpha = pow2( roughness ); // UE4's roughness

		vec3 halfDir = normalize( lightDir + viewDir );

		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );

		vec3 F = F_Schlick( f0, f90, dotVH );

		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );

		float D = D_GGX( alpha, dotNH );

		return F * ( V * D );

	}

#endif

vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {

	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;

	float alpha = pow2( roughness ); // UE4's roughness

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );

	vec3 F = F_Schlick( f0, f90, dotVH );

	#ifdef USE_IRIDESCENCE

		F = mix( F, material.iridescenceFresnel, material.iridescence );

	#endif

	#ifdef USE_ANISOTROPY

		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );

		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );

		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );

	#else

		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );

		float D = D_GGX( alpha, dotNH );

	#endif

	return F * ( V * D );

}

// Rect Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUT_SCALE + LUT_BIAS;

	return uv;

}

float LTC_ClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.

	float l = length( f );

	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );

}

vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;

	return cross( v1, v2 ) * theta_sintheta;

}

vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );

	// construct orthonormal basis around N
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );

	// transform rect
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );

	// project rect onto sphere
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );

	// calculate vector form factor
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

/*
	// alternate method of adjusting for horizon clipping (see reference)
	// refactoring required
	float len = length( vectorFormFactor );
	float z = vectorFormFactor.z / len;

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	// tabulated horizon-clipped sphere, apparently...
	vec2 uv = vec2( z * 0.5 + 0.5, len );
	uv = uv * LUT_SCALE + LUT_BIAS;

	float scale = texture2D( ltc_2, uv ).w;

	float result = len * scale;
*/

	return vec3( result );

}

// End Rect Area Light

#if defined( USE_SHEEN )

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float D_Charlie( float roughness, float dotNH ) {

	float alpha = pow2( roughness );

	// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 ); // 2^(-14/2), so sin2h^2 > 0 in fp16

	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );

}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float V_Neubelt( float dotNV, float dotNL ) {

	// Neubelt and Pettineo 2013, "Crafting a Next-gen Material Pipeline for The Order: 1886"
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );

}

vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );

	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );

	return sheenColor * ( D * V );

}

#endif

// This is a curve-fit approximation to the "Charlie sheen" BRDF integrated over the hemisphere from
// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF".
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {

	float dotNV = saturate( dot( normal, viewDir ) );

	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );

	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;

	float DG = exp( a * dotNV + b );

	return saturate( DG );

}

vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {

	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;

	return specularColor * fab.x + specularF90 * fab.y;

}

// Fdez-Agüera's "Multiple-Scattering Microfacet Model for Real-Time Image Based Lighting"
// Approximates multiscattering in order to preserve energy.
// http://www.jcgt.org/published/0008/01/03/
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif

	#ifdef USE_IRIDESCENCE

		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );

	#else

		vec3 Fr = specularColor;

	#endif

	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;

	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;

	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619; // 1/21
	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );

	singleScatter += FssEss;
	multiScatter += Fms * Ems;

}

#if NUM_RECT_AREA_LIGHTS > 0

	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;

		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

		vec2 uv = LTC_Uv( normal, viewDir, roughness );

		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );

		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);

		// LTC Fresnel Approximation by Stephen Hill
		// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );

		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );

		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );

		#ifdef USE_CLEARCOAT

			vec3 Ncc = geometryClearcoatNormal;

			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );

			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );

			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);

			// LTC Fresnel Approximation for clearcoat
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;

			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );

		#endif

	}

#endif

void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );

	vec3 irradiance = dotNL * directLight.color;

	#ifdef USE_CLEARCOAT

		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );

		vec3 ccIrradiance = dotNLcc * directLight.color;

		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );

	#endif

	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif

	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );

	#ifdef USE_RETROREFLECTION

		// Minimal Retroreflective Microfacet Model:
		// https://jcgt.org/published/0015/01/04/
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );

		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );

	#endif

	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;

	// Light reflected by the specular interface is not available to the diffuse layer ( glTF fresnel_mix )
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );

	#ifdef USE_RETROREFLECTION

		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );

		F = mix( F, retroF, saturate( material.retroreflectivity ) );

	#endif

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}

void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	// Energy reflected by the specular lobe is not available to the diffuse layer
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );

	#ifdef USE_IRIDESCENCE

		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );

	#else

		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );

	#endif

	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );

	#ifdef USE_SHEEN

		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );

		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;

		diffuse *= sheenEnergyComp;

	#endif

	reflectedLight.indirectDiffuse += diffuse;

}

void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {

	#ifdef USE_CLEARCOAT

		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );

	#endif

	#ifdef USE_SHEEN

		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;

 	#endif

	// Both indirect specular and indirect diffuse light accumulate here
	// Compute multiscattering separately for dielectric and metallic, then mix

	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );

	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );

	#ifdef USE_IRIDESCENCE

		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );

	#else

		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );

	#endif

	// Mix based on metalness
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );

	// Diffuse energy conservation uses dielectric path
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );

	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;

	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;

	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;

	#ifdef USE_SHEEN

		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;

		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;

	#endif

	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;

}

#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical

// ref: https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {

	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );

}
`,lights_fragment_begin:`
/**
 * This is a template that can be used to light a material, it uses pluggable
 * RenderEquations (RE)for specific lighting scenarios.
 *
 * Instructions for use:
 * - Ensure that both RE_Direct, RE_IndirectDiffuse and RE_IndirectSpecular are defined
 * - Create a material parameter that is to be passed as the third parameter to your lighting functions.
 *
 * TODO:
 * - Add area light support.
 * - Add sphere light support.
 * - Add diffuse light probe (irradiance cubemap) support.
 */

vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

vec3 geometryClearcoatNormal = vec3( 0.0 );

#ifdef USE_CLEARCOAT

	geometryClearcoatNormal = clearcoatNormal;

#endif

#ifdef USE_IRIDESCENCE

	float dotNVi = saturate( dot( normal, geometryViewDir ) );

	if ( material.iridescenceThickness == 0.0 ) {

		material.iridescence = 0.0;

	} else {

		material.iridescence = saturate( material.iridescence );

	}

	if ( material.iridescence > 0.0 ) {

		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );

		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );

		// Iridescence F0 approximation
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );

	}

#endif

#ifdef STANDARD

	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );

	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;

	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )

		// Multi-scattering energy compensation for direct lighting
		// Based on "Practical Multiple Scattering Compensation for Microfacet Models"
		// https://blog.selfshadow.com/publications/turquin/ms_comp_final.pdf

		// Energy of the single-scattering lobe in a white furnace ( F0 = F90 = 1 )
		float EssMs = material.dfg.x + material.dfg.y;

		// Compensate for the energy lost to multiple scattering, tinting the added term by F0 ( equation 16 )
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );

	#endif

#endif

IncidentLight directLight;

#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		pointLight = pointLights[ i ];

		getPointLightInfo( pointLight, geometryPosition, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;

	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		spotLight = spotLights[ i ];

		getSpotLightInfo( spotLight, geometryPosition, directLight );

		// spot lights are ordered [shadows with maps, shadows without maps, maps without shadows, none]
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif

		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif

		#undef SPOT_LIGHT_MAP_INDEX

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )

	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {

		sunLight = sunLights[ i ];

		getSunLightInfo( sunLight, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		directionalLight = directionalLights[ i ];

		getDirectionalLightInfo( directionalLight, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

	RectAreaLight rectAreaLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if defined( RE_IndirectDiffuse )

	vec3 iblIrradiance = vec3( 0.0 );

	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

	#if defined( USE_LIGHT_PROBES )

		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );

	#endif

	#if ( NUM_HEMI_LIGHTS > 0 )

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );

		}
		#pragma unroll_loop_end

	#endif

	#ifdef USE_LIGHT_PROBES_GRID

		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );

	#endif

#endif

#if defined( RE_IndirectSpecular )

	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );

#endif
`,lights_fragment_maps:`
#if defined( RE_IndirectDiffuse )

	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;

		irradiance += lightMapIrradiance;

	#endif

	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )

		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )

			iblIrradiance += getIBLIrradiance( geometryNormal );

		#endif

	#endif

#endif

#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )

	#ifdef USE_ANISOTROPY

		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );

	#else

		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );

	#endif

	#ifdef USE_RETROREFLECTION

		#ifdef USE_ANISOTROPY

			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );

		#else

			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );

		#endif

		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );

	#endif

	radiance += iblRadiance;

	#ifdef USE_CLEARCOAT

		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );

	#endif

#endif
`,lights_fragment_end:`
#if defined( RE_IndirectDiffuse )

	#if defined( LAMBERT ) || defined( PHONG )

		irradiance += iblIrradiance;

	#endif

	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif

#if defined( RE_IndirectSpecular )

	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif
`,lightprobes_pars_fragment:`
#ifdef USE_LIGHT_PROBES_GRID

// Single atlas 3D texture that stores all 7 SH sub-volumes stacked along Z.
// Atlas depth = 7 * ( nz + 2 ) where nz = probesResolution.z.
// Each sub-volume occupies ( nz + 2 ) slices: 1 padding + nz data + 1 padding.
// Padding is a copy of the first / last data slice and prevents color bleeding
// when the hardware linear filter reads across a sub-volume boundary.
uniform highp sampler3D probesSH;

uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;

vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {

	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;

	// Offset sample position along normal by half a probe spacing
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );

	// Remap to texel centers of the probe grid (XY and Z)
	uvw = uvw * resMinusOne / res + 0.5 / res;

	// Atlas UV mapping along Z:
	//   paddedSlices = nz + 2  (1 padding texel at each end of every sub-volume)
	//   atlasDepth   = 7 * paddedSlices
	//   For sub-volume t the first DATA texel sits at atlas slice t*paddedSlices + 1.
	//   Given probe-grid texel-centre UVZ = ( iz + 0.5 ) / nz the atlas UV is:
	//     atlasUvZ = ( uvw.z * nz + t * paddedSlices + 1 ) / atlasDepth
	//
	// uvZBase encodes the nz-scaled Z plus the intra-volume offset (+ 1 for padding),
	// so adding t*paddedSlices steps to each successive sub-volume.
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;

	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );

	// Unpack 9 vec3 SH L2 coefficients
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;

	// Evaluate L2 irradiance
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;

	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );

	return max( result, vec3( 0.0 ) );

}

#endif
`,logdepthbuf_fragment:`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif
`,logdepthbuf_pars_fragment:`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`,logdepthbuf_pars_vertex:`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`,logdepthbuf_vertex:`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

#endif
`,map_fragment:`
#ifdef USE_MAP

	vec4 sampledDiffuseColor = texture2D( map, vMapUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );

	#endif

	diffuseColor *= sampledDiffuseColor;

#endif
`,map_pars_fragment:`
#ifdef USE_MAP

	uniform sampler2D map;

#endif
`,map_particle_fragment:`
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

	#if defined( USE_POINTS_UV )

		vec2 uv = vUv;

	#else

		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

	#endif

#endif

#ifdef USE_MAP

	diffuseColor *= texture2D( map, uv );

#endif

#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, uv ).g;

#endif
`,map_particle_pars_fragment:`
#if defined( USE_POINTS_UV )

	varying vec2 vUv;

#else

	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

		uniform mat3 uvTransform;

	#endif

#endif

#ifdef USE_MAP

	uniform sampler2D map;

#endif

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`,metalnessmap_fragment:`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelMetalness.b;

#endif
`,metalnessmap_pars_fragment:`
#ifdef USE_METALNESSMAP

	uniform sampler2D metalnessMap;

#endif
`,morphinstance_vertex:`
#ifdef USE_INSTANCING_MORPH

	float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;

	}
#endif
`,morphcolor_vertex:`
#if defined( USE_MORPHCOLORS )

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	vColor *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		#if defined( USE_COLOR_ALPHA )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];

		#elif defined( USE_COLOR )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];

		#endif

	}

#endif
`,morphnormal_vertex:`
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`,morphtarget_pars_vertex:`
#ifdef USE_MORPHTARGETS

	#ifndef USE_INSTANCING_MORPH

		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	#endif

	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;

	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {

		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;

		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );

	}

#endif
`,morphtarget_vertex:`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`,normal_fragment_begin:`
float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

#ifdef FLAT_SHADED

	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );

#else

	vec3 normal = normalize( vNormal );

	#ifdef DOUBLE_SIDED

		normal *= faceDirection;

	#endif

#endif

#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )

	#ifdef USE_TANGENT

		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

	#else

		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);

	#endif

	#ifdef DOUBLE_SIDED

		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;

	#endif

#endif

#ifdef USE_CLEARCOAT_NORMALMAP

	#ifdef USE_TANGENT

		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

	#else

		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );

	#endif

	#ifdef DOUBLE_SIDED

		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;

	#endif

#endif

// non perturbed normal for clearcoat among others

vec3 nonPerturbedNormal = normal;

`,normal_fragment_maps:`

#ifdef USE_NORMALMAP_OBJECTSPACE

	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

#elif defined( USE_NORMALMAP_TANGENTSPACE )

	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

	#if defined( USE_PACKED_NORMALMAP )

		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );

	#endif

	mapN.xy *= normalScale;

	normal = normalize( tbn * mapN );

#elif defined( USE_BUMPMAP )

	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

#endif
`,normal_pars_fragment:`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`,normal_pars_vertex:`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`,normal_vertex:`
#ifndef FLAT_SHADED // normal is computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

	#ifdef USE_TANGENT

		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

		#ifdef FLIP_SIDED

			vBitangent = - vBitangent;

		#endif

	#endif

#endif
`,normalmap_pars_fragment:`
#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

#endif

#ifdef USE_NORMALMAP_OBJECTSPACE

	uniform mat3 normalMatrix;

#endif

#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )

	// Normal Mapping Without Precomputed Tangents
	// http://www.thetenthplanet.de/archives/1180

	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {

		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );

		vec3 N = surf_norm; // normalized

		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );

		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;

		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

		return mat3( T * scale, B * scale, N );

	}

#endif
`,clearcoat_normal_fragment_begin:`
#ifdef USE_CLEARCOAT

	vec3 clearcoatNormal = nonPerturbedNormal;

#endif
`,clearcoat_normal_fragment_maps:`
#ifdef USE_CLEARCOAT_NORMALMAP

	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;

	clearcoatNormal = normalize( tbn2 * clearcoatMapN );

#endif
`,clearcoat_pars_fragment:`

#ifdef USE_CLEARCOATMAP

	uniform sampler2D clearcoatMap;

#endif

#ifdef USE_CLEARCOAT_NORMALMAP

	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;

#endif

#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	uniform sampler2D clearcoatRoughnessMap;

#endif
`,iridescence_pars_fragment:`

#ifdef USE_IRIDESCENCEMAP

	uniform sampler2D iridescenceMap;

#endif

#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform sampler2D iridescenceThicknessMap;

#endif
`,opaque_fragment:`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`,packing:`
vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}

vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;

const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );

const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );

vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}

vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	// the 0.9999 tweak is unimportant, very tiny empirical improvement
	// return vec3( vuf * Inv255, gf * PackUpscale, bf * 0.9999 );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}

vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}

float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}

float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}

float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}

vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}

vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}

// NOTE: viewZ, the z-coordinate in camera space, is negative for points in front of the camera

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( viewZ + near ) / ( near - far );
}

float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;

	#else

		return depth * ( near - far ) - near;

	#endif
}

// NOTE: https://twitter.com/gonnavis/status/1377183786949959682

float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}

float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER

		return ( near * far ) / ( ( near - far ) * depth - near );

	#else

		return ( near * far ) / ( ( far - near ) * depth - far );

	#endif
}
`,premultiplied_alpha_fragment:`
#ifdef PREMULTIPLIED_ALPHA

	gl_FragColor.rgb *= gl_FragColor.a;

#endif
`,project_vertex:`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
`,dithering_fragment:`
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif
`,dithering_pars_fragment:`
#ifdef DITHERING

	// based on https://www.shadertoy.com/view/MslGR8
	vec3 dithering( vec3 color ) {
		//Calculate grid position
		float grid_position = rand( gl_FragCoord.xy );

		//Shift the individual colors differently, thus making it even harder to see the dithering pattern
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

		//modify shift according to grid position.
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

		//shift the color by dither_shift
		return color + dither_shift_RGB;
	}

#endif
`,roughnessmap_fragment:`
float roughnessFactor = roughness;

#ifdef USE_ROUGHNESSMAP

	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughness.g;

#endif
`,roughnessmap_pars_fragment:`
#ifdef USE_ROUGHNESSMAP

	uniform sampler2D roughnessMap;

#endif
`,shadowmap_pars_fragment:`
#if NUM_SPOT_LIGHT_COORDS > 0

	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#if NUM_SPOT_LIGHT_MAPS > 0

	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// must match the cascade count in SunLightShadow

		#define SUN_LIGHT_CASCADES 2

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];

		#else

			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];

		#endif

		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;

		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];

		#else

			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];

		#endif

		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];

		#else

			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];

		#endif

		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];

		#elif defined( SHADOWMAP_TYPE_BASIC )

			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];

		#endif

		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	#if defined( SHADOWMAP_TYPE_PCF )

		// Interleaved Gradient Noise for randomizing sampling patterns
		float interleavedGradientNoise( vec2 position ) {

			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );

		}

		// Vogel disk sampling for uniform circular distribution
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {

			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;

		}

	#endif

	#if defined( SHADOWMAP_TYPE_PCF )

		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
				// 5 samples using Vogel disk + IGN = effectively 20 filtered taps with better distribution
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;

				// Use IGN to rotate sampling pattern per pixel
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;

				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#elif defined( SHADOWMAP_TYPE_VSM )

		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				shadowCoord.z -= shadowBias;

			#else

				shadowCoord.z += shadowBias;

			#endif

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;

				float mean = distribution.x;
				float variance = distribution.y * distribution.y;

				#ifdef USE_REVERSED_DEPTH_BUFFER

					float hard_shadow = step( mean, shadowCoord.z );

				#else

					float hard_shadow = step( shadowCoord.z, mean );

				#endif
				
				// Early return if fully lit
				if ( hard_shadow == 1.0 ) {

					shadow = 1.0;

				} else {

					// Variance must be non-zero to avoid division by zero
					variance = max( variance, 0.0000001 );

					// Distance from mean
					float d = shadowCoord.z - mean;

					// Chebyshev's inequality for upper bound on probability
					float p_max = variance / ( variance + d * d );

					// Reduce light bleeding by remapping [amount, 1] to [0, 1]
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );

					shadow = max( hard_shadow, p_max );

				}

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#else // SHADOWMAP_TYPE_BASIC

		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				shadowCoord.z -= shadowBias;

			#else

				shadowCoord.z += shadowBias;

			#endif

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				float depth = texture2D( shadowMap, shadowCoord.xy ).r;

				#ifdef USE_REVERSED_DEPTH_BUFFER

					shadow = step( depth, shadowCoord.z );

				#else

					shadow = step( shadowCoord.z, depth );

				#endif

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#endif

	#if NUM_SUN_LIGHT_SHADOWS > 0

		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {

			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;

			float shadow = 1.0;

			// walk the cascades back to front so each fade band can blend with the shadow behind it

			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {

				// ( begin, end, fade start ) view depths of the cascade

				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];

				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {

					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);

					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );

				}

			}

			return shadow;

		}

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

	#if defined( SHADOWMAP_TYPE_PCF )

	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

		float shadow = 1.0;

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// Direction from light to fragment
		vec3 bd3D = normalize( lightToPosition );

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			#ifdef USE_REVERSED_DEPTH_BUFFER

				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;

			#else

				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;

			#endif

			// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
			// Use Vogel disk + IGN sampling for better quality
			float texelSize = shadowRadius / shadowMapSize.x;

			// Build a tangent-space coordinate system for applying offsets
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );

			// Use IGN to rotate sampling pattern per pixel
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;

			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );

			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;

		}

		return mix( 1.0, shadow, shadowIntensity );

	}

	#elif defined( SHADOWMAP_TYPE_BASIC )

	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

		float shadow = 1.0;

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;

			// Direction from light to fragment
			vec3 bd3D = normalize( lightToPosition );

			float depth = textureCube( shadowMap, bd3D ).r;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				depth = 1.0 - depth;

			#endif

			shadow = step( dp, depth );

		}

		return mix( 1.0, shadow, shadowIntensity );

	}

	#endif

	#endif

#endif
`,shadowmap_pars_vertex:`

#if NUM_SPOT_LIGHT_COORDS > 0

	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// cascade selection and shadow coordinates are computed per fragment

		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): uniforms for area light shadows

	#endif
	*/

#endif
`,shadowmap_vertex:`

#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )

	#ifdef HAS_NORMAL

		// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.

		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );

	#else

		vec3 shadowWorldNormal = vec3( 0.0 ); // fallback, see #21483

	#endif

	vec4 shadowWorldPosition;

#endif

#if defined( USE_SHADOWMAP )

	#if NUM_SUN_LIGHT_SHADOWS > 0

		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;

		}
		#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;

		}
		#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update vAreaShadowCoord with area light info

	#endif
	*/

#endif

// spot lights can be evaluated without active shadow mapping (when SpotLight.map is used)

#if NUM_SPOT_LIGHT_COORDS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {

		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;

	}
	#pragma unroll_loop_end

#endif


`,shadowmask_pars_fragment:`
float getShadowMask() {

	float shadow = 1.0;

	#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

	SunLightShadow sunLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {

		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

	DirectionalLightShadow directionalLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

	SpotLightShadow spotLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {

		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )

	PointLightShadow pointLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update shadow for Area light

	#endif
	*/

	#endif

	return shadow;

}
`,skinbase_vertex:`
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif
`,skinning_pars_vertex:`
#ifdef USE_SKINNING

	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;

	uniform highp sampler2D boneTexture;

	mat4 getBoneMatrix( const in float i ) {

		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );

		return mat4( v1, v2, v3, v4 );

	}

#endif
`,skinning_vertex:`
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif
`,skinnormal_vertex:`
#ifdef USE_SKINNING

	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;

	#ifdef USE_TANGENT

		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#endif

#endif
`,specularmap_fragment:`
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif
`,specularmap_pars_fragment:`
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
`,tonemapping_fragment:`
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif
`,tonemapping_pars_fragment:`
#ifndef saturate
// <common> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif

uniform float toneMappingExposure;

// exposure only
vec3 LinearToneMapping( vec3 color ) {

	return saturate( toneMappingExposure * color );

}

// source: https://www.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf
vec3 ReinhardToneMapping( vec3 color ) {

	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );

}

// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 CineonToneMapping( vec3 color ) {

	// filmic operator by Jim Hejl and Richard Burgess-Dawson
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );

}

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit( vec3 v ) {

	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;

}

// this implementation of ACES is modified to accommodate a brighter viewing environment.
// the scale factor of 1/0.6 is subjective. see discussion in #19621.

vec3 ACESFilmicToneMapping( vec3 color ) {

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ), // transposed from source
		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ), // transposed from source
		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);

	color *= toneMappingExposure / 0.6;

	color = ACESInputMat * color;

	// Apply RRT and ODT
	color = RRTAndODTFit( color );

	color = ACESOutputMat * color;

	// Clamp to [0, 1]
	return saturate( color );

}

// Matrices for rec 2020 <> rec 709 color space conversion
// matrix provided in row-major order so it has been transposed
// https://www.itu.int/pub/R-REP-BT.2407-2017
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);

const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);

// https://iolite-engine.com/blog_posts/minimal_agx_implementation
// Mean error^2: 3.6705141e-06
vec3 agxDefaultContrastApprox( vec3 x ) {

	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;

	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;

}

// AgX Tone Mapping implementation based on Filament, which in turn is based
// on Blender's implementation using rec 2020 primaries
// https://github.com/google/filament/pull/7236
// Inputs and outputs are encoded as Linear-sRGB.

vec3 AgXToneMapping( vec3 color ) {

	// AgX constants
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);

	// explicit AgXOutsetMatrix generated from Filaments AgXOutsetMatrixInv
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);

	// LOG2_MIN      = -10.0
	// LOG2_MAX      =  +6.5
	// MIDDLE_GRAY   =  0.18
	const float AgxMinEv = - 12.47393;  // log2( pow( 2, LOG2_MIN ) * MIDDLE_GRAY )
	const float AgxMaxEv = 4.026069;    // log2( pow( 2, LOG2_MAX ) * MIDDLE_GRAY )

	color *= toneMappingExposure;

	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;

	color = AgXInsetMatrix * color;

	// Log2 encoding
	color = max( color, 1e-10 ); // avoid 0 or negative numbers for log2
	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );

	color = clamp( color, 0.0, 1.0 );

	// Apply sigmoid
	color = agxDefaultContrastApprox( color );

	// Apply AgX look
	// v = agxLook(v, look);

	color = AgXOutsetMatrix * color;

	// Linearize
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );

	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;

	// Gamut mapping. Simple clamp for now.
	color = clamp( color, 0.0, 1.0 );

	return color;

}

// https://modelviewer.dev/examples/tone-mapping

vec3 NeutralToneMapping( vec3 color ) {

	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;

	color *= toneMappingExposure;

	float x = min( color.r, min( color.g, color.b ) );

	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;

	color -= offset;

	float peak = max( color.r, max( color.g, color.b ) );

	if ( peak < StartCompression ) return color;

	float d = 1. - StartCompression;

	float newPeak = 1. - d * d / ( peak + d - StartCompression );

	color *= newPeak / peak;

	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );

	return mix( color, vec3( newPeak ), g );

}

vec3 CustomToneMapping( vec3 color ) { return color; }
`,transmission_fragment:`
#ifdef USE_TRANSMISSION

	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;

	#ifdef USE_TRANSMISSIONMAP

		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;

	#endif

	#ifdef USE_THICKNESSMAP

		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;

	#endif

	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );

	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );

	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );

	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );

#endif
`,transmission_pars_fragment:`
#ifdef USE_TRANSMISSION

	// Transmission code is based on glTF-Sampler-Viewer
	// https://github.com/KhronosGroup/glTF-Sample-Viewer

	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;

	#ifdef USE_TRANSMISSIONMAP

		uniform sampler2D transmissionMap;

	#endif

	#ifdef USE_THICKNESSMAP

		uniform sampler2D thicknessMap;

	#endif

	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;

	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;

	varying vec3 vWorldPosition;

	// Mipped Bicubic Texture Filtering by N8
	// https://www.shadertoy.com/view/Dl2SDW

	float w0( float a ) {

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );

	}

	float w1( float a ) {

		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );

	}

	float w2( float a ){

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );

	}

	float w3( float a ) {

		return ( 1.0 / 6.0 ) * ( a * a * a );

	}

	// g0 and g1 are the two amplitude functions
	float g0( float a ) {

		return w0( a ) + w1( a );

	}

	float g1( float a ) {

		return w2( a ) + w3( a );

	}

	// h0 and h1 are the two offset functions
	float h0( float a ) {

		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );

	}

	float h1( float a ) {

		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );

	}

	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {

		uv = uv * texelSize.zw + 0.5;

		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );

		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );

		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;

		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );

	}

	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {

		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );

	}

	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {

		// Direction of refracted light.
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );

		// Compute rotation-independent scaling of the model matrix.
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );

		// The thickness is specified in local space.
		return normalize( refractionVector ) * thickness * modelScale;

	}

	float applyIorToRoughness( const in float roughness, const in float ior ) {

		// Scale roughness with IOR so that an IOR of 1.0 results in no microfacet refraction and
		// an IOR of 1.5 results in the default amount of microfacet refraction.
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );

	}

	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {

		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );

	}

	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {

		if ( isinf( attenuationDistance ) ) {

			// Attenuation distance is +∞, i.e. the transmitted color is not attenuated at all.
			return vec3( 1.0 );

		} else {

			// Compute light attenuation using Beer's law.
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance ); // Beer's law
			return transmittance;

		}

	}

	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {

		vec4 transmittedLight;
		vec3 transmittance;

		#ifdef USE_DISPERSION

			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );

			for ( int i = 0; i < 3; i ++ ) {

				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;

				// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;

				// Sample framebuffer to get pixel the refracted ray hits.
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;

				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];

			}

			transmittedLight.a /= 3.0;

		#else

			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;

			// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;

			// Sample framebuffer to get pixel the refracted ray hits.
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );

		#endif

		vec3 attenuatedColor = transmittance * transmittedLight.rgb;

		// Get the specular component.
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );

		// As less light is transmitted, the opacity should be increased. This simple approximation does a decent job
		// of modulating a CSS background, and has no effect when the buffer is opaque, due to a solid object or clear color.
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;

		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );

	}
#endif
`,uv_pars_fragment:`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	varying vec2 vUv;

#endif
#ifdef USE_MAP

	varying vec2 vMapUv;

#endif
#ifdef USE_ALPHAMAP

	varying vec2 vAlphaMapUv;

#endif
#ifdef USE_LIGHTMAP

	varying vec2 vLightMapUv;

#endif
#ifdef USE_AOMAP

	varying vec2 vAoMapUv;

#endif
#ifdef USE_BUMPMAP

	varying vec2 vBumpMapUv;

#endif
#ifdef USE_NORMALMAP

	varying vec2 vNormalMapUv;

#endif
#ifdef USE_EMISSIVEMAP

	varying vec2 vEmissiveMapUv;

#endif
#ifdef USE_METALNESSMAP

	varying vec2 vMetalnessMapUv;

#endif
#ifdef USE_ROUGHNESSMAP

	varying vec2 vRoughnessMapUv;

#endif
#ifdef USE_ANISOTROPYMAP

	varying vec2 vAnisotropyMapUv;

#endif
#ifdef USE_CLEARCOATMAP

	varying vec2 vClearcoatMapUv;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	varying vec2 vClearcoatNormalMapUv;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	varying vec2 vClearcoatRoughnessMapUv;

#endif
#ifdef USE_IRIDESCENCEMAP

	varying vec2 vIridescenceMapUv;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	varying vec2 vIridescenceThicknessMapUv;

#endif
#ifdef USE_SHEEN_COLORMAP

	varying vec2 vSheenColorMapUv;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	varying vec2 vSheenRoughnessMapUv;

#endif
#ifdef USE_SPECULARMAP

	varying vec2 vSpecularMapUv;

#endif
#ifdef USE_SPECULAR_COLORMAP

	varying vec2 vSpecularColorMapUv;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	varying vec2 vSpecularIntensityMapUv;

#endif
#ifdef USE_TRANSMISSIONMAP

	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;

#endif
#ifdef USE_THICKNESSMAP

	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;

#endif
`,uv_pars_vertex:`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	varying vec2 vUv;

#endif
#ifdef USE_MAP

	uniform mat3 mapTransform;
	varying vec2 vMapUv;

#endif
#ifdef USE_ALPHAMAP

	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;

#endif
#ifdef USE_LIGHTMAP

	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;

#endif
#ifdef USE_AOMAP

	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;

#endif
#ifdef USE_BUMPMAP

	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;

#endif
#ifdef USE_NORMALMAP

	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;

#endif
#ifdef USE_DISPLACEMENTMAP

	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;

#endif
#ifdef USE_EMISSIVEMAP

	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;

#endif
#ifdef USE_METALNESSMAP

	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;

#endif
#ifdef USE_ROUGHNESSMAP

	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;

#endif
#ifdef USE_ANISOTROPYMAP

	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;

#endif
#ifdef USE_CLEARCOATMAP

	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;

#endif
#ifdef USE_SHEEN_COLORMAP

	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;

#endif
#ifdef USE_IRIDESCENCEMAP

	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;

#endif
#ifdef USE_SPECULARMAP

	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;

#endif
#ifdef USE_SPECULAR_COLORMAP

	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;

#endif
#ifdef USE_TRANSMISSIONMAP

	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;

#endif
#ifdef USE_THICKNESSMAP

	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;

#endif
`,uv_vertex:`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	vUv = vec3( uv, 1 ).xy;

#endif
#ifdef USE_MAP

	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ALPHAMAP

	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_LIGHTMAP

	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_AOMAP

	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_BUMPMAP

	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_NORMALMAP

	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_DISPLACEMENTMAP

	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_EMISSIVEMAP

	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_METALNESSMAP

	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ROUGHNESSMAP

	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ANISOTROPYMAP

	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOATMAP

	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_IRIDESCENCEMAP

	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SHEEN_COLORMAP

	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULARMAP

	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULAR_COLORMAP

	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_TRANSMISSIONMAP

	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_THICKNESSMAP

	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;

#endif
`,worldpos_vertex:`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0

	vec4 worldPosition = vec4( transformed, 1.0 );

	#ifdef USE_BATCHING

		worldPosition = batchingMatrix * worldPosition;

	#endif

	#ifdef USE_INSTANCING

		worldPosition = instanceMatrix * worldPosition;

	#endif

	worldPosition = modelMatrix * worldPosition;

#endif
`,background_vert:`
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`,background_frag:`
uniform sampler2D t2D;
uniform float backgroundIntensity;

varying vec2 vUv;

void main() {

	vec4 texColor = texture2D( t2D, vUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures

		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`,backgroundCube_vert:`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,backgroundCube_frag:`

#ifdef ENVMAP_TYPE_CUBE

	uniform samplerCube envMap;

#elif defined( ENVMAP_TYPE_CUBE_UV )

	uniform sampler2D envMap;

#endif

uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;

varying vec3 vWorldDirection;

#include <cube_uv_reflection_fragment>

void main() {

	#ifdef ENVMAP_TYPE_CUBE

		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );

	#elif defined( ENVMAP_TYPE_CUBE_UV )

		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );

	#else

		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`,cube_vert:`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,cube_frag:`
uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;

varying vec3 vWorldDirection;

void main() {

	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );

	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`,depth_vert:`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
// Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
// depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
varying vec2 vHighPrecisionZW;

void main() {

	#include <uv_vertex>

	#include <batching_vertex>
	#include <skinbase_vertex>

	#include <morphinstance_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vHighPrecisionZW = gl_Position.zw;

}
`,depth_frag:`
#if DEPTH_PACKING == 3200

	uniform float opacity;

#endif

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec2 vHighPrecisionZW;

void main() {

	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>

	#if DEPTH_PACKING == 3200

		diffuseColor.a = opacity;

	#endif

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	#include <logdepthbuf_fragment>

	// Higher precision equivalent of gl_FragCoord.z

	#ifdef USE_REVERSED_DEPTH_BUFFER

		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];

	#else

		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;

	#endif

	#if DEPTH_PACKING == 3200

		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );

	#elif DEPTH_PACKING == 3201

		// TODO Deprecate
		gl_FragColor = packDepthToRGBA( fragCoordZ );

	#elif DEPTH_PACKING == 3202

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );

	#elif DEPTH_PACKING == 3203

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );

	#endif

}
`,distance_vert:`
#define DISTANCE

varying vec3 vWorldPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	#include <batching_vertex>
	#include <skinbase_vertex>

	#include <morphinstance_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>

	vWorldPosition = worldPosition.xyz;

}
`,distance_frag:`
#define DISTANCE

uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;

#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist ); // clamp to [ 0, 1 ]

	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );

}
`,equirect_vert:`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

}
`,equirect_frag:`
uniform sampler2D tEquirect;

varying vec3 vWorldDirection;

#include <common>

void main() {

	vec3 direction = normalize( vWorldDirection );

	vec2 sampleUV = equirectUv( direction );

	gl_FragColor = texture2D( tEquirect, sampleUV );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`,linedashed_vert:`
uniform float scale;
attribute float lineDistance;

varying float vLineDistance;

#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	vLineDistance = scale * lineDistance;

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`,linedashed_frag:`
uniform vec3 diffuse;
uniform float opacity;

uniform float dashSize;
uniform float totalSize;

varying float vLineDistance;

#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	if ( mod( vLineDistance, totalSize ) > dashSize ) {

		discard;

	}

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>

	outgoingLight = diffuseColor.rgb; // simple shader

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`,meshbasic_vert:`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>

}
`,meshbasic_frag:`
uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	#include <aomap_fragment>

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	#include <envmap_fragment>

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,meshlambert_vert:`
#define LAMBERT

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,meshlambert_frag:`
#define LAMBERT

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,meshmatcap_vert:`
#define MATCAP

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

	vViewPosition = - mvPosition.xyz;

}
`,meshmatcap_frag:`
#define MATCAP

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;

varying vec3 vViewPosition;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

	#ifdef USE_MATCAP

		vec4 matcapColor = texture2D( matcap, uv );

	#else

		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 ); // default if matcap is missing

	#endif

	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,meshnormal_vert:`
#define NORMAL

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	varying vec3 vViewPosition;

#endif

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	vViewPosition = - mvPosition.xyz;

#endif

}
`,meshnormal_frag:`
#define NORMAL

uniform float opacity;

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	varying vec3 vViewPosition;

#endif

#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );

	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );

	#ifdef OPAQUE

		gl_FragColor.a = 1.0;

	#endif

}
`,meshphong_vert:`
#define PHONG

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,meshphong_frag:`
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,meshphysical_vert:`
#define STANDARD

varying vec3 vViewPosition;

#ifdef USE_TRANSMISSION

	varying vec3 vWorldPosition;

#endif

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef USE_TRANSMISSION

	vWorldPosition = worldPosition.xyz;

#endif
}
`,meshphysical_frag:`
#define STANDARD

#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef IOR
	uniform float ior;
#endif

#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;

	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif

	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif

#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_DISPERSION
	uniform float dispersion;
#endif

#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif

#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;

	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif

	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif

#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;

	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif

varying vec3 vViewPosition;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	#include <transmission_fragment>

	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif

	#ifdef USE_CLEARCOAT

		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );

		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;

	#endif

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,meshtoon_vert:`
#define TOON

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,meshtoon_frag:`
#define TOON

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`,points_vert:`
uniform float size;
uniform float scale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_POINTS_UV

	varying vec2 vUv;
	uniform mat3 uvTransform;

#endif

void main() {

	#ifdef USE_POINTS_UV

		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	#endif

	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

	gl_PointSize = size;

	#ifdef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );

	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`,points_frag:`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`,shadow_vert:`
#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>

void main() {

	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,shadow_frag:`
uniform vec3 color;
uniform float opacity;

#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

void main() {

	#include <logdepthbuf_fragment>

	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`,sprite_vert:`
uniform float rotation;
uniform vec2 center;

#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	vec4 mvPosition = modelViewMatrix[ 3 ];

	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );

	#ifndef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) scale *= - mvPosition.z;

	#endif

	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;

	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;

	mvPosition.xy += rotatedPosition;

	gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`,sprite_frag:`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>

}
`},W={common:{diffuse:{value:new s(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new n},alphaMap:{value:null},alphaMapTransform:{value:new n},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new n}},envmap:{envMap:{value:null},envMapRotation:{value:new n},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new n}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new n}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new n},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new n},normalScale:{value:new r(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new n},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new n}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new n}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new n}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new s(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new z},probesMax:{value:new z},probesResolution:{value:new z}},points:{diffuse:{value:new s(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new n},alphaTest:{value:0},uvTransform:{value:new n}},sprite:{diffuse:{value:new s(16777215)},opacity:{value:1},center:{value:new r(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new n},alphaMap:{value:null},alphaMapTransform:{value:new n},alphaTest:{value:0}}},Zr={basic:{uniforms:ir([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.fog]),vertexShader:U.meshbasic_vert,fragmentShader:U.meshbasic_frag},lambert:{uniforms:ir([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.fog,W.lights,{emissive:{value:new s(0)},envMapIntensity:{value:1}}]),vertexShader:U.meshlambert_vert,fragmentShader:U.meshlambert_frag},phong:{uniforms:ir([W.common,W.specularmap,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.fog,W.lights,{emissive:{value:new s(0)},specular:{value:new s(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:U.meshphong_vert,fragmentShader:U.meshphong_frag},standard:{uniforms:ir([W.common,W.envmap,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.roughnessmap,W.metalnessmap,W.fog,W.lights,{emissive:{value:new s(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:U.meshphysical_vert,fragmentShader:U.meshphysical_frag},toon:{uniforms:ir([W.common,W.aomap,W.lightmap,W.emissivemap,W.bumpmap,W.normalmap,W.displacementmap,W.gradientmap,W.fog,W.lights,{emissive:{value:new s(0)}}]),vertexShader:U.meshtoon_vert,fragmentShader:U.meshtoon_frag},matcap:{uniforms:ir([W.common,W.bumpmap,W.normalmap,W.displacementmap,W.fog,{matcap:{value:null}}]),vertexShader:U.meshmatcap_vert,fragmentShader:U.meshmatcap_frag},points:{uniforms:ir([W.points,W.fog]),vertexShader:U.points_vert,fragmentShader:U.points_frag},dashed:{uniforms:ir([W.common,W.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:U.linedashed_vert,fragmentShader:U.linedashed_frag},depth:{uniforms:ir([W.common,W.displacementmap]),vertexShader:U.depth_vert,fragmentShader:U.depth_frag},normal:{uniforms:ir([W.common,W.bumpmap,W.normalmap,W.displacementmap,{opacity:{value:1}}]),vertexShader:U.meshnormal_vert,fragmentShader:U.meshnormal_frag},sprite:{uniforms:ir([W.sprite,W.fog]),vertexShader:U.sprite_vert,fragmentShader:U.sprite_frag},background:{uniforms:{uvTransform:{value:new n},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:U.background_vert,fragmentShader:U.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new n}},vertexShader:U.backgroundCube_vert,fragmentShader:U.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:U.cube_vert,fragmentShader:U.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:U.equirect_vert,fragmentShader:U.equirect_frag},distance:{uniforms:ir([W.common,W.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:U.distance_vert,fragmentShader:U.distance_frag},shadow:{uniforms:ir([W.lights,W.fog,{color:{value:new s(0)},opacity:{value:1}}]),vertexShader:U.shadow_vert,fragmentShader:U.shadow_frag}};Zr.physical={uniforms:ir([Zr.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new n},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new n},clearcoatNormalScale:{value:new r(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new n},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new n},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new n},sheen:{value:0},sheenColor:{value:new s(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new n},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new n},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new n},transmissionSamplerSize:{value:new r},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new n},attenuationDistance:{value:0},attenuationColor:{value:new s(0)},specularColor:{value:new s(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new n},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new n},anisotropyVector:{value:new r},anisotropyMap:{value:null},anisotropyMapTransform:{value:new n}}]),vertexShader:U.meshphysical_vert,fragmentShader:U.meshphysical_frag};var Qr={r:0,b:0,g:0},$r=new ct,ei=new n;ei.set(-1,0,0,0,1,0,0,0,1);function ti(e,t,n,r,i,o){let c=new s(0),l=i===!0?0:1,u,d,f=null,p=0,m=null;function h(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function g(t){let r=!1,i=h(t);i===null?v(c,l):i&&i.isColor&&(v(i,1),r=!0);let a=e.xr.getEnvironmentBlendMode();a===`additive`?n.buffers.color.setClear(0,0,0,1,o):a===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,o),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function _(t,n){let i=h(n);i&&(i.isCubeTexture||i.mapping===306)?(d===void 0&&(d=new H(new Zn(1,1,1),new dr({name:`BackgroundCubeMaterial`,uniforms:rr(Zr.backgroundCube.uniforms),vertexShader:Zr.backgroundCube.vertexShader,fragmentShader:Zr.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute(`normal`),d.geometry.deleteAttribute(`uv`),d.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(d)),d.material.uniforms.envMap.value=i,d.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4($r.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&d.material.uniforms.backgroundRotation.value.premultiply(ei),d.material.toneMapped=a.getTransfer(i.colorSpace)!==he,(f!==i||p!==i.version||m!==e.toneMapping)&&(d.material.needsUpdate=!0,f=i,p=i.version,m=e.toneMapping),d.layers.enableAll(),t.unshift(d,d.geometry,d.material,0,0,null)):i&&i.isTexture&&(u===void 0&&(u=new H(new er(2,2),new dr({name:`BackgroundMaterial`,uniforms:rr(Zr.background.uniforms),vertexShader:Zr.background.vertexShader,fragmentShader:Zr.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute(`normal`),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(u)),u.material.uniforms.t2D.value=i,u.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,u.material.toneMapped=a.getTransfer(i.colorSpace)!==he,i.matrixAutoUpdate===!0&&i.updateMatrix(),u.material.uniforms.uvTransform.value.copy(i.matrix),(f!==i||p!==i.version||m!==e.toneMapping)&&(u.material.needsUpdate=!0,f=i,p=i.version,m=e.toneMapping),u.layers.enableAll(),t.unshift(u,u.geometry,u.material,0,0,null))}function v(t,r){t.getRGB(Qr,sr(e)),n.buffers.color.setClear(Qr.r,Qr.g,Qr.b,r,o)}function y(){d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return c},setClearColor:function(e,t=1){c.set(e),l=t,v(c,l)},getClearAlpha:function(){return l},setClearAlpha:function(e){l=e,v(c,l)},render:g,addToRenderList:_,dispose:y}}function ni(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function ri(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function ii(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(N(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&N(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function ai(e){let t=this,r=null,i=0,a=!1,o=!1,s=new hn,c=new n,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||i!==0||a;return a=t,i=e.length,n},this.beginShadows=function(){o=!0,d(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(e,t){r=d(e,t,0)},this.setState=function(t,n,s){let c=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!a||c===null||c.length===0||o&&!p)o?d(null):u();else{let e=o?0:i,t=e*4,a=m.clippingState||null;l.value=a,a=d(c,n,t,s);for(let e=0;e!==t;++e)a[e]=r[e];m.clippingState=a,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function u(){l.value!==r&&(l.value=r,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function d(e,n,r,i){let a=e===null?0:e.length,o=null;if(a!==0){if(o=l.value,i!==!0||o===null){let t=r+a*4,i=n.matrixWorldInverse;c.getNormalMatrix(i),(o===null||o.length<t)&&(o=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)s.copy(e[t]).applyMatrix4(i,c),s.normal.toArray(o,n),o[n+3]=s.constant}l.value=o,l.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,o}}var oi=class{constructor(){throw Error(`[openaero] environment maps are off: drop the noPmrem.js alias in vite.config.js`)}},si=class extends Nt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Yn(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Zn(5,5,5),i=new dr({name:`CubemapFromEquirect`,uniforms:rr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new H(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=ot),new Hr(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function ci(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new si(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new oi(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new oi(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function li(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&nt(`WebGLRenderer: `+e+` extension not supported.`),t}}}function ui(e,t,n,r){let a={},o=new WeakMap;function s(e){let i=e.target;i.index!==null&&t.remove(i.index);for(let e in i.attributes)t.remove(i.attributes[e]);i.removeEventListener(`dispose`,s),delete a[i.id];let c=o.get(i);c&&(t.remove(c),o.delete(i)),r.releaseStatesOfGeometry(i),i.isInstancedBufferGeometry===!0&&delete i._maxInstanceCount,n.memory.geometries--}function c(e,t){return a[t.id]===!0||(t.addEventListener(`dispose`,s),a[t.id]=!0,n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=[],r=e.index,a=e.attributes.position,s=0;if(a===void 0)return;if(r!==null){let e=r.array;s=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=a.array;s=a.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let c=new(a.count>=65535?i:l)(n,1);c.version=s;let u=o.get(e);u&&t.remove(u),o.set(e,c)}function f(e){let t=o.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return o.get(e)}return{get:c,update:u,getWireframeAttribute:f}}function di(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function fi(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:Me(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function pi(e,t,n){let i=new WeakMap,a=new jt;function o(o,s,c){let l=o.morphTargetInfluences,u=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,d=u===void 0?0:u.length,f=i.get(s);if(f===void 0||f.count!==d){f!==void 0&&f.texture.dispose();let e=s.morphAttributes.position!==void 0,n=s.morphAttributes.normal!==void 0,o=s.morphAttributes.color!==void 0,c=s.morphAttributes.position||[],l=s.morphAttributes.normal||[],u=s.morphAttributes.color||[],p=0;e===!0&&(p=1),n===!0&&(p=2),o===!0&&(p=3);let h=s.attributes.position.count*p,g=1;h>t.maxTextureSize&&(g=Math.ceil(h/t.maxTextureSize),h=t.maxTextureSize);let _=new Float32Array(h*g*4*d),v=new Pt(_,h,g,d);v.type=m,v.needsUpdate=!0;let y=p*4;for(let t=0;t<d;t++){let r=c[t],i=l[t],s=u[t],d=h*g*4*t;for(let t=0;t<r.count;t++){let c=t*y;e===!0&&(a.fromBufferAttribute(r,t),_[d+c+0]=a.x,_[d+c+1]=a.y,_[d+c+2]=a.z,_[d+c+3]=0),n===!0&&(a.fromBufferAttribute(i,t),_[d+c+4]=a.x,_[d+c+5]=a.y,_[d+c+6]=a.z,_[d+c+7]=0),o===!0&&(a.fromBufferAttribute(s,t),_[d+c+8]=a.x,_[d+c+9]=a.y,_[d+c+10]=a.z,_[d+c+11]=s.itemSize===4?a.w:1)}}f={count:d,texture:v,size:new r(h,g)},i.set(s,f);function b(){v.dispose(),i.delete(s),s.removeEventListener(`dispose`,b)}s.addEventListener(`dispose`,b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,`morphTexture`,o.morphTexture,n);else{let t=0;for(let e=0;e<l.length;e++)t+=l[e];let n=s.morphTargetsRelative?1:1-t;c.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),c.getUniforms().setValue(e,`morphTargetInfluences`,l)}c.getUniforms().setValue(e,`morphTargetsTexture`,f.texture,n),c.getUniforms().setValue(e,`morphTargetsTextureSize`,f.size)}return{update:o}}function mi(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var hi={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function gi(e,t,n,r,i,s){let c=new Nt(t,n,{type:e,depthBuffer:i,stencilBuffer:s,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),l=null,u=null,d=new dn;d.setAttribute(`position`,new o([-1,3,0,-1,-1,0,3,-1,0],3)),d.setAttribute(`uv`,new o([0,2,0,0,2,0],2));let f=new fr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),p=new H(d,f),m=new Ir(-1,1,1,-1,0,1),h=null,g=null,_=!1,v,y=null,b=[],x=!1;this.setSize=function(e,t){c.setSize(e,t),l!==null&&l.setSize(e,t),u!==null&&u.setSize(e,t);for(let n=0;n<b.length;n++){let r=b[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){b=e,x=b.length>0&&b[0].isRenderPass===!0;let t=c.width,n=c.height;b.length>0&&l===null&&(l=new Nt(t,n,{type:ne,depthBuffer:!1,stencilBuffer:!1}),u=new Nt(t,n,{type:ne,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<b.length;e++){let r=b[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(_||e.toneMapping===0&&b.length===0)return!1;if(y=t,t!==null){let e=t.width,n=t.height;(c.width!==e||c.height!==n)&&this.setSize(e,n)}return x===!1&&e.setRenderTarget(c),v=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return x},this.end=function(e,t){e.toneMapping=v,_=!0;let n=c,r=l;for(let i=0;i<b.length;i++){let a=b[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===l?u:l))}if(h!==e.outputColorSpace||g!==e.toneMapping){h=e.outputColorSpace,g=e.toneMapping,f.defines={},a.getTransfer(h)===`srgb`&&(f.defines.SRGB_TRANSFER=``);let t=hi[g];t&&(f.defines[t]=``),f.needsUpdate=!0}f.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(y),e.render(p,m),y=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){c.dispose(),l!==null&&l.dispose(),u!==null&&u.dispose(),d.dispose(),f.dispose()}}var _i=new At,vi=new Xn(1,1),yi=new Pt,bi=new Ft,xi=new Yn,Si=[],Ci=[],wi=new Float32Array(16),Ti=new Float32Array(9),Ei=new Float32Array(4);function Di(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Si[i];if(a===void 0&&(a=new Float32Array(i),Si[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Oi(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ki(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Ai(e,t){let n=Ci[t];n===void 0&&(n=new Int32Array(t),Ci[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function ji(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Mi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oi(n,t))return;e.uniform2fv(this.addr,t),ki(n,t)}}function Ni(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Oi(n,t))return;e.uniform3fv(this.addr,t),ki(n,t)}}function Pi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oi(n,t))return;e.uniform4fv(this.addr,t),ki(n,t)}}function Fi(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Oi(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ki(n,t)}else{if(Oi(n,r))return;Ei.set(r),e.uniformMatrix2fv(this.addr,!1,Ei),ki(n,r)}}function Ii(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Oi(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ki(n,t)}else{if(Oi(n,r))return;Ti.set(r),e.uniformMatrix3fv(this.addr,!1,Ti),ki(n,r)}}function Li(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Oi(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ki(n,t)}else{if(Oi(n,r))return;wi.set(r),e.uniformMatrix4fv(this.addr,!1,wi),ki(n,r)}}function Ri(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function zi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oi(n,t))return;e.uniform2iv(this.addr,t),ki(n,t)}}function Bi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Oi(n,t))return;e.uniform3iv(this.addr,t),ki(n,t)}}function Vi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oi(n,t))return;e.uniform4iv(this.addr,t),ki(n,t)}}function Hi(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Ui(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oi(n,t))return;e.uniform2uiv(this.addr,t),ki(n,t)}}function Wi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Oi(n,t))return;e.uniform3uiv(this.addr,t),ki(n,t)}}function Gi(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oi(n,t))return;e.uniform4uiv(this.addr,t),ki(n,t)}}function Ki(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(vi.compareFunction=n.isReversedDepthBuffer()?518:515,a=vi):a=_i,n.setTexture2D(t||a,i)}function qi(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||bi,i)}function Ji(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||xi,i)}function Yi(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||yi,i)}function Xi(e){switch(e){case 5126:return ji;case 35664:return Mi;case 35665:return Ni;case 35666:return Pi;case 35674:return Fi;case 35675:return Ii;case 35676:return Li;case 5124:case 35670:return Ri;case 35667:case 35671:return zi;case 35668:case 35672:return Bi;case 35669:case 35673:return Vi;case 5125:return Hi;case 36294:return Ui;case 36295:return Wi;case 36296:return Gi;case 35678:case 36198:case 36298:case 36306:case 35682:return Ki;case 35679:case 36299:case 36307:return qi;case 35680:case 36300:case 36308:case 36293:return Ji;case 36289:case 36303:case 36311:case 36292:return Yi}}function Zi(e,t){e.uniform1fv(this.addr,t)}function Qi(e,t){let n=Di(t,this.size,2);e.uniform2fv(this.addr,n)}function $i(e,t){let n=Di(t,this.size,3);e.uniform3fv(this.addr,n)}function ea(e,t){let n=Di(t,this.size,4);e.uniform4fv(this.addr,n)}function ta(e,t){let n=Di(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function na(e,t){let n=Di(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function ra(e,t){let n=Di(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function ia(e,t){e.uniform1iv(this.addr,t)}function aa(e,t){e.uniform2iv(this.addr,t)}function oa(e,t){e.uniform3iv(this.addr,t)}function sa(e,t){e.uniform4iv(this.addr,t)}function ca(e,t){e.uniform1uiv(this.addr,t)}function la(e,t){e.uniform2uiv(this.addr,t)}function ua(e,t){e.uniform3uiv(this.addr,t)}function da(e,t){e.uniform4uiv(this.addr,t)}function fa(e,t,n){let r=this.cache,i=t.length,a=Ai(n,i);Oi(r,a)||(e.uniform1iv(this.addr,a),ki(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?vi:_i;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function pa(e,t,n){let r=this.cache,i=t.length,a=Ai(n,i);Oi(r,a)||(e.uniform1iv(this.addr,a),ki(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||bi,a[e])}function ma(e,t,n){let r=this.cache,i=t.length,a=Ai(n,i);Oi(r,a)||(e.uniform1iv(this.addr,a),ki(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||xi,a[e])}function ha(e,t,n){let r=this.cache,i=t.length,a=Ai(n,i);Oi(r,a)||(e.uniform1iv(this.addr,a),ki(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||yi,a[e])}function ga(e){switch(e){case 5126:return Zi;case 35664:return Qi;case 35665:return $i;case 35666:return ea;case 35674:return ta;case 35675:return na;case 35676:return ra;case 5124:case 35670:return ia;case 35667:case 35671:return aa;case 35668:case 35672:return oa;case 35669:case 35673:return sa;case 5125:return ca;case 36294:return la;case 36295:return ua;case 36296:return da;case 35678:case 36198:case 36298:case 36306:case 35682:return fa;case 35679:case 36299:case 36307:return pa;case 35680:case 36300:case 36308:case 36293:return ma;case 36289:case 36303:case 36311:case 36292:return ha}}var _a=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Xi(t.type)}},va=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ga(t.type)}},ya=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},ba=/(\w+)(\])?(\[|\.)?/g;function xa(e,t){e.seq.push(t),e.map[t.id]=t}function Sa(e,t,n){let r=e.name,i=r.length;for(ba.lastIndex=0;;){let a=ba.exec(r),o=ba.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){xa(n,l===void 0?new _a(s,e,t):new va(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new ya(s),xa(n,e)),n=e}}}var Ca=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Sa(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function wa(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Ta=37297,Ea=0;function Da(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Oa=new n;function ka(e){a._getMatrix(Oa,a.workingColorSpace,e);let t=`mat3( ${Oa.elements.map(e=>e.toFixed(4))} )`;switch(a.getTransfer(e)){case ge:return[t,`LinearTransferOETF`];case he:return[t,`sRGBTransferOETF`];default:return N(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Aa(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Da(e.getShaderSource(t),r)}return i}function ja(e,t){let n=ka(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Ma={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Na(e,t){let n=Ma[t];return n===void 0?(N(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Pa=new z;function Fa(){return a.getLuminanceCoefficients(Pa),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Pa.x.toFixed(4)}, ${Pa.y.toFixed(4)}, ${Pa.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Ia(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(za).join(`
`)}function La(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ra(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function za(e){return e!==``}function Ba(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Va(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Ha=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ua(e){return e.replace(Ha,Ga)}var Wa=new Map;function Ga(e,t){let n=U[t];if(n===void 0){let e=Wa.get(t);if(e!==void 0)n=U[e],N(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Ua(n)}var Ka=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qa(e){return e.replace(Ka,Ja)}function Ja(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Ya(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Xa={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Za(e){return Xa[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Qa={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function $a(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Qa[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var eo={302:`ENVMAP_MODE_REFRACTION`};function to(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:eo[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var no={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function ro(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:no[e.combine]||`ENVMAP_BLENDING_NONE`}function io(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function ao(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Za(n),l=$a(n),u=to(n),d=ro(n),f=io(n),p=Ia(n),m=La(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(za).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(za).join(`
`),_.length>0&&(_+=`
`)):(g=[Ya(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(za).join(`
`),_=[Ya(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:U.tonemapping_pars_fragment,n.toneMapping===0?``:Na(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,U.colorspace_pars_fragment,ja(`linearToOutputTexel`,n.outputColorSpace),Fa(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(za).join(`
`)),o=Ua(o),o=Ba(o,n),o=Va(o,n),s=Ua(s),s=Ba(s,n),s=Va(s,n),o=qa(o),s=qa(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=wa(i,i.VERTEX_SHADER,y),S=wa(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=Aa(i,x,`vertex`),n=Aa(i,S,`fragment`);Me(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):N(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Ca(i,h),T=Ra(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,Ta)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Ea++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var oo=0,so=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new co(e),t.set(e,n)),n}},co=class{constructor(e){this.id=oo++,this.code=e,this.usedTimes=0}};function lo(e){return e===1030||e===37490||e===36285}function uo(e,n,r,i,o,s){let c=new t,l=new so,u=new Set,d=[],f=new Map,p=i.logarithmicDepthBuffer,m=i.precision,h={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function g(e){return u.add(e),e===0?`uv`:`uv${e}`}function _(t,o,c,d,f,_){let v=d.fog,y=f.geometry,b=t.isMeshStandardMaterial||t.isMeshLambertMaterial||t.isMeshPhongMaterial?d.environment:null,x=t.isMeshStandardMaterial||t.isMeshLambertMaterial&&!t.envMap||t.isMeshPhongMaterial&&!t.envMap,S=n.get(t.envMap||b,x),C=S&&S.mapping===306?S.image.height:null,w=h[t.type];t.precision!==null&&(m=i.getMaxPrecision(t.precision),m!==t.precision&&N(`WebGLProgram.getParameters:`,t.precision,`not supported, using`,m,`instead.`));let T=y.morphAttributes.position||y.morphAttributes.normal||y.morphAttributes.color,E=T===void 0?0:T.length,D=0;y.morphAttributes.position!==void 0&&(D=1),y.morphAttributes.normal!==void 0&&(D=2),y.morphAttributes.color!==void 0&&(D=3);let O,k,ee,te;if(w){let e=Zr[w];O=e.vertexShader,k=e.fragmentShader}else{O=t.vertexShader,k=t.fragmentShader;let e=l.getVertexShaderStage(t),n=l.getFragmentShaderStage(t);l.update(t,e,n),ee=e.id,te=n.id}let A=e.getRenderTarget(),ne=e.state.buffers.depth.getReversed(),re=f.isInstancedMesh===!0,ie=f.isBatchedMesh===!0,ae=!!t.map,oe=!!t.matcap,se=!!S,ce=!!t.aoMap,le=!!t.lightMap,ue=!!t.bumpMap&&t.wireframe===!1,j=!!t.normalMap,de=!!t.displacementMap,fe=!!t.emissiveMap,M=!!t.metalnessMap,pe=!!t.roughnessMap,me=t.anisotropy>0,he=t.clearcoat>0,ge=t.dispersion>0,_e=t.retroreflectivity>0,ve=t.iridescence>0,ye=t.sheen>0,be=t.transmission>0,xe=me&&!!t.anisotropyMap,Se=he&&!!t.clearcoatMap,Ce=he&&!!t.clearcoatNormalMap,we=he&&!!t.clearcoatRoughnessMap,Te=ve&&!!t.iridescenceMap,Ee=ve&&!!t.iridescenceThicknessMap,De=ye&&!!t.sheenColorMap,Oe=ye&&!!t.sheenRoughnessMap,ke=!!t.specularMap,Ae=!!t.specularColorMap,je=!!t.specularIntensityMap,Me=be&&!!t.transmissionMap,Ne=be&&!!t.thicknessMap,Pe=!!t.gradientMap,Fe=!!t.alphaMap,P=t.alphaTest>0,Ie=!!t.alphaHash,Le=!!t.extensions,Re=0;t.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Re=e.toneMapping);let F={shaderID:w,shaderType:t.type,shaderName:t.name,vertexShader:O,fragmentShader:k,defines:t.defines,customVertexShaderID:ee,customFragmentShaderID:te,isRawShaderMaterial:t.isRawShaderMaterial===!0,glslVersion:t.glslVersion,precision:m,batching:ie,batchingColor:ie&&f._colorsTexture!==null,instancing:re,instancingColor:re&&f.instanceColor!==null,instancingMorph:re&&f.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:a.workingColorSpace,alphaToCoverage:!!t.alphaToCoverage,map:ae,matcap:oe,envMap:se,envMapMode:se&&S.mapping,envMapCubeUVHeight:C,aoMap:ce,lightMap:le,bumpMap:ue,normalMap:j,displacementMap:de,emissiveMap:fe,normalMapObjectSpace:j&&t.normalMapType===1,normalMapTangentSpace:j&&t.normalMapType===0,packedNormalMap:j&&t.normalMapType===0&&lo(t.normalMap.format),metalnessMap:M,roughnessMap:pe,anisotropy:me,anisotropyMap:xe,clearcoat:he,clearcoatMap:Se,clearcoatNormalMap:Ce,clearcoatRoughnessMap:we,dispersion:ge,retroreflection:_e,iridescence:ve,iridescenceMap:Te,iridescenceThicknessMap:Ee,sheen:ye,sheenColorMap:De,sheenRoughnessMap:Oe,specularMap:ke,specularColorMap:Ae,specularIntensityMap:je,transmission:be,transmissionMap:Me,thicknessMap:Ne,gradientMap:Pe,opaque:t.transparent===!1&&t.blending===1&&t.alphaToCoverage===!1,alphaMap:Fe,alphaTest:P,alphaHash:Ie,combine:t.combine,mapUv:ae&&g(t.map.channel),aoMapUv:ce&&g(t.aoMap.channel),lightMapUv:le&&g(t.lightMap.channel),bumpMapUv:ue&&g(t.bumpMap.channel),normalMapUv:j&&g(t.normalMap.channel),displacementMapUv:de&&g(t.displacementMap.channel),emissiveMapUv:fe&&g(t.emissiveMap.channel),metalnessMapUv:M&&g(t.metalnessMap.channel),roughnessMapUv:pe&&g(t.roughnessMap.channel),anisotropyMapUv:xe&&g(t.anisotropyMap.channel),clearcoatMapUv:Se&&g(t.clearcoatMap.channel),clearcoatNormalMapUv:Ce&&g(t.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:we&&g(t.clearcoatRoughnessMap.channel),iridescenceMapUv:Te&&g(t.iridescenceMap.channel),iridescenceThicknessMapUv:Ee&&g(t.iridescenceThicknessMap.channel),sheenColorMapUv:De&&g(t.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&g(t.sheenRoughnessMap.channel),specularMapUv:ke&&g(t.specularMap.channel),specularColorMapUv:Ae&&g(t.specularColorMap.channel),specularIntensityMapUv:je&&g(t.specularIntensityMap.channel),transmissionMapUv:Me&&g(t.transmissionMap.channel),thicknessMapUv:Ne&&g(t.thicknessMap.channel),alphaMapUv:Fe&&g(t.alphaMap.channel),vertexTangents:!!y.attributes.tangent&&(j||me),vertexNormals:!!y.attributes.normal,vertexColors:t.vertexColors,vertexAlphas:t.vertexColors===!0&&!!y.attributes.color&&y.attributes.color.itemSize===4,pointsUvs:f.isPoints===!0&&!!y.attributes.uv&&(ae||Fe),fog:!!v,useFog:t.fog===!0,fogExp2:!!v&&v.isFogExp2,flatShading:t.wireframe===!1&&(t.flatShading===!0||y.attributes.normal===void 0&&j===!1&&(t.isMeshLambertMaterial||t.isMeshPhongMaterial||t.isMeshStandardMaterial||t.isMeshPhysicalMaterial)),sizeAttenuation:t.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:ne,skinning:f.isSkinnedMesh===!0,hasPositionAttribute:y.attributes.position!==void 0,morphTargets:y.morphAttributes.position!==void 0,morphNormals:y.morphAttributes.normal!==void 0,morphColors:y.morphAttributes.color!==void 0,morphTargetsCount:E,morphTextureStride:D,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:_.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:t.dithering,shadowMapEnabled:e.shadowMap.enabled&&c.length>0,shadowMapType:e.shadowMap.type,toneMapping:Re,decodeVideoTexture:ae&&t.map.isVideoTexture===!0&&a.getTransfer(t.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:fe&&t.emissiveMap.isVideoTexture===!0&&a.getTransfer(t.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:t.premultipliedAlpha,doubleSided:t.side===2,flipSided:t.side===1,useDepthPacking:t.depthPacking>=0,depthPacking:t.depthPacking||0,index0AttributeName:t.index0AttributeName,extensionClipCullDistance:Le&&t.extensions.clipCullDistance===!0&&r.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Le&&t.extensions.multiDraw===!0||ie)&&r.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:r.has(`KHR_parallel_shader_compile`),customProgramCacheKey:t.customProgramCacheKey()};return F.vertexUv1s=u.has(1),F.vertexUv2s=u.has(2),F.vertexUv3s=u.has(3),u.clear(),F}function v(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(y(n,t),b(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function y(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function b(e,t){c.disableAll(),t.instancing&&c.enable(0),t.instancingColor&&c.enable(1),t.instancingMorph&&c.enable(2),t.matcap&&c.enable(3),t.envMap&&c.enable(4),t.normalMapObjectSpace&&c.enable(5),t.normalMapTangentSpace&&c.enable(6),t.clearcoat&&c.enable(7),t.iridescence&&c.enable(8),t.alphaTest&&c.enable(9),t.vertexColors&&c.enable(10),t.vertexAlphas&&c.enable(11),t.vertexUv1s&&c.enable(12),t.vertexUv2s&&c.enable(13),t.vertexUv3s&&c.enable(14),t.vertexTangents&&c.enable(15),t.anisotropy&&c.enable(16),t.alphaHash&&c.enable(17),t.batching&&c.enable(18),t.dispersion&&c.enable(19),t.retroreflection&&c.enable(24),t.batchingColor&&c.enable(20),t.gradientMap&&c.enable(21),t.packedNormalMap&&c.enable(22),t.vertexNormals&&c.enable(23),e.push(c.mask),c.disableAll(),t.fog&&c.enable(0),t.useFog&&c.enable(1),t.flatShading&&c.enable(2),t.logarithmicDepthBuffer&&c.enable(3),t.reversedDepthBuffer&&c.enable(4),t.skinning&&c.enable(5),t.morphTargets&&c.enable(6),t.morphNormals&&c.enable(7),t.morphColors&&c.enable(8),t.premultipliedAlpha&&c.enable(9),t.shadowMapEnabled&&c.enable(10),t.doubleSided&&c.enable(11),t.flipSided&&c.enable(12),t.useDepthPacking&&c.enable(13),t.dithering&&c.enable(14),t.transmission&&c.enable(15),t.sheen&&c.enable(16),t.opaque&&c.enable(17),t.pointsUvs&&c.enable(18),t.decodeVideoTexture&&c.enable(19),t.decodeVideoTextureEmissive&&c.enable(20),t.alphaToCoverage&&c.enable(21),t.numLightProbeGrids>0&&c.enable(22),t.hasPositionAttribute&&c.enable(23),e.push(c.mask)}function x(e){let t=h[e.type],n;if(t){let e=Zr[t];n=cr.clone(e.uniforms)}else n=e.uniforms;return n}function S(t,n){let r=f.get(n);return r===void 0?(r=new ao(e,n,t,o),d.push(r),f.set(n,r)):++r.usedTimes,r}function C(e){if(--e.usedTimes===0){let t=d.indexOf(e);d[t]=d[d.length-1],d.pop(),f.delete(e.cacheKey),e.destroy()}}function w(e){l.remove(e)}function T(){l.dispose()}return{getParameters:_,getProgramCacheKey:v,getUniforms:x,acquireProgram:S,releaseProgram:C,releaseShaderCache:w,programs:d,dispose:T}}function fo(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function po(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function mo(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function ho(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||po),r.length>1&&r.sort(t||mo),i.length>1&&i.sort(t||mo)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function go(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new ho,e.set(t,[i])):n>=r.length?(i=new ho,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function _o(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new z,color:new s};break;case`SpotLight`:n={position:new z,direction:new z,color:new s,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new z,color:new s,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new z,skyColor:new s,groundColor:new s};break;case`RectAreaLight`:n={color:new s,position:new z,halfWidth:new z,halfHeight:new z}}return e[t.id]=n,n}}}function vo(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new r};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new r};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new r,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var yo=0;function bo(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function xo(e){let t=new _o,n=vo(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new z);let i=new z,a=new ct,o=new ct;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(bo);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=W.LTC_FLOAT_1,r.rectAreaLTC2=W.LTC_FLOAT_2):(r.rectAreaLTC1=W.LTC_HALF_1,r.rectAreaLTC2=W.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=yo++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function So(e){let t=new xo(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function Co(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new So(e),t.set(n,[a])):r>=i.length?(a=new So(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}function wo(){this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1,this.render=function(){if(this.enabled)throw Error(`[openaero] shadow maps are off: drop the noShadowMap.js alias in vite.config.js`)}}function To(e,t){function n(){let t=!1,n=new jt,r=null,i=new jt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?M(e.DEPTH_TEST):pe(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=Ae[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?M(e.STENCIL_TEST):pe(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,c=new i,l=new WeakMap,u=new WeakMap,d={},f={},p={},m=new WeakMap,h=[],g=null,_=!1,v=null,y=null,b=null,x=null,S=null,C=null,w=null,T=new s(0,0,0),E=0,D=!1,O=null,k=null,ee=null,te=null,A=null,ne=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),re=!1,ie=0,ae=e.getParameter(e.VERSION);ae.indexOf(`WebGL`)===-1?ae.indexOf(`OpenGL ES`)!==-1&&(ie=parseFloat(/^OpenGL ES (\d)/.exec(ae)[1]),re=ie>=2):(ie=parseFloat(/^WebGL (\d)/.exec(ae)[1]),re=ie>=1);let oe=null,se={},ce=e.getParameter(e.SCISSOR_BOX),le=e.getParameter(e.VIEWPORT),ue=new jt().fromArray(ce),j=new jt().fromArray(le);function de(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let fe={};fe[e.TEXTURE_2D]=de(e.TEXTURE_2D,e.TEXTURE_2D,1),fe[e.TEXTURE_CUBE_MAP]=de(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),fe[e.TEXTURE_2D_ARRAY]=de(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),fe[e.TEXTURE_3D]=de(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),c.setClear(0),M(e.DEPTH_TEST),o.setFunc(3),xe(!1),Se(1),M(e.CULL_FACE),ye(0);function M(t){d[t]!==!0&&(e.enable(t),d[t]=!0)}function pe(t){d[t]!==!1&&(e.disable(t),d[t]=!1)}function me(t,n){return p[t]!==n&&(e.bindFramebuffer(t,n),p[t]=n,t===e.DRAW_FRAMEBUFFER&&(p[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(p[e.DRAW_FRAMEBUFFER]=n),!0)}function he(t,n){let r=h,i=!1;if(t){r=m.get(n),r===void 0&&(r=[],m.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function ge(t){return g!==t&&(e.useProgram(t),g=t,!0)}let _e={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};_e[103]=e.MIN,_e[104]=e.MAX;let ve={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ye(t,n,r,i,a,o,s,c,l,u){if(t===0)_===!0&&(pe(e.BLEND),_=!1);else if(_===!1&&(M(e.BLEND),_=!0),t!==5){if(t!==v||u!==D){if((y!==100||S!==100)&&(e.blendEquation(e.FUNC_ADD),y=100,S=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Me(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:Me(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:Me(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:Me(`WebGLState: Invalid blending: `,t)}b=null,x=null,C=null,w=null,T.set(0,0,0),E=0,v=t,D=u}}else a||=n,o||=r,s||=i,(n!==y||a!==S)&&(e.blendEquationSeparate(_e[n],_e[a]),y=n,S=a),(r!==b||i!==x||o!==C||s!==w)&&(e.blendFuncSeparate(ve[r],ve[i],ve[o],ve[s]),b=r,x=i,C=o,w=s),(c.equals(T)===!1||l!==E)&&(e.blendColor(c.r,c.g,c.b,l),T.copy(c),E=l),v=t,D=!1}function be(t,n){t.side===2?pe(e.CULL_FACE):M(e.CULL_FACE);let r=t.side===1;n&&(r=!r),xe(r),t.blending===1&&t.transparent===!1?ye(0):ye(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;c.setTest(i),i&&(c.setMask(t.stencilWriteMask),c.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),c.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),we(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?M(e.SAMPLE_ALPHA_TO_COVERAGE):pe(e.SAMPLE_ALPHA_TO_COVERAGE)}function xe(t){O!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),O=t)}function Se(t){t===0?pe(e.CULL_FACE):(M(e.CULL_FACE),t!==k&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),k=t}function Ce(t){t!==ee&&(re&&e.lineWidth(t),ee=t)}function we(t,n,r){t?(M(e.POLYGON_OFFSET_FILL),(te!==n||A!==r)&&(te=n,A=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):pe(e.POLYGON_OFFSET_FILL)}function Te(t){t?M(e.SCISSOR_TEST):pe(e.SCISSOR_TEST)}function N(t){t===void 0&&(t=e.TEXTURE0+ne-1),oe!==t&&(e.activeTexture(t),oe=t)}function Ee(t,n,r){r===void 0&&(r=oe===null?e.TEXTURE0+ne-1:oe);let i=se[r];i===void 0&&(i={type:void 0,texture:void 0},se[r]=i),(i.type!==t||i.texture!==n)&&(oe!==r&&(e.activeTexture(r),oe=r),e.bindTexture(t,n||fe[t]),i.type=t,i.texture=n)}function De(){let t=se[oe];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Oe(){try{e.compressedTexImage2D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function ke(){try{e.compressedTexImage3D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function je(){try{e.texSubImage2D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Ne(){try{e.texSubImage3D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Pe(){try{e.compressedTexSubImage2D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Fe(){try{e.compressedTexSubImage3D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function P(){try{e.texStorage2D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Ie(){try{e.texStorage3D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Le(){try{e.texImage2D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function Re(){try{e.texImage3D(...arguments)}catch(e){Me(`WebGLState:`,e)}}function F(t){return f[t]===void 0?e.getParameter(t):f[t]}function ze(t,n){f[t]!==n&&(e.pixelStorei(t,n),f[t]=n)}function Be(t){ue.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ue.copy(t))}function Ve(t){j.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),j.copy(t))}function He(t,n){let r=u.get(n);r===void 0&&(r=new WeakMap,u.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function I(t,n){let r=u.get(n).get(t);l.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),l.set(n,r))}function Ue(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),d={},f={},oe=null,se={},p={},m=new WeakMap,h=[],g=null,_=!1,v=null,y=null,b=null,x=null,S=null,C=null,w=null,T=new s(0,0,0),E=0,D=!1,O=null,k=null,ee=null,te=null,A=null,ue.set(0,0,e.canvas.width,e.canvas.height),j.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),c.reset()}return{buffers:{color:a,depth:o,stencil:c},enable:M,disable:pe,bindFramebuffer:me,drawBuffers:he,useProgram:ge,setBlending:ye,setMaterial:be,setFlipSided:xe,setCullFace:Se,setLineWidth:Ce,setPolygonOffset:we,setScissorTest:Te,activeTexture:N,bindTexture:Ee,unbindTexture:De,compressedTexImage2D:Oe,compressedTexImage3D:ke,texImage2D:Le,texImage3D:Re,pixelStorei:ze,getParameter:F,updateUBOMapping:He,uniformBlockBinding:I,texStorage2D:P,texStorage3D:Ie,texSubImage2D:je,texSubImage3D:Ne,compressedTexSubImage2D:Pe,compressedTexSubImage3D:Fe,scissor:Be,viewport:Ve,reset:Ue}}function Eo(e,t,n,i,o,s,c){let l=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,u=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),d=new r,f=new WeakMap,p=new Set,m,h=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):Pe(`canvas`)}function y(e,t,n){let r=1,i=ze(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);m===void 0&&(m=_(n,a));let o=t?_(n,a):m;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),N(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&N(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function b(e){return e.generateMipmaps}function x(t){e.generateMipmap(t)}function w(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function E(n,r,i,o,s,c=!1){if(n!==null){if(e[n]!==void 0)return e[n];N(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let l;o&&(l=t.get(`EXT_texture_norm16`),l||N(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let u=r;if(r===e.RED&&(i===e.FLOAT&&(u=e.R32F),i===e.HALF_FLOAT&&(u=e.R16F),i===e.UNSIGNED_BYTE&&(u=e.R8),i===e.UNSIGNED_SHORT&&l&&(u=l.R16_EXT),i===e.SHORT&&l&&(u=l.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(u=e.R8UI),i===e.UNSIGNED_SHORT&&(u=e.R16UI),i===e.UNSIGNED_INT&&(u=e.R32UI),i===e.BYTE&&(u=e.R8I),i===e.SHORT&&(u=e.R16I),i===e.INT&&(u=e.R32I)),r===e.RG&&(i===e.FLOAT&&(u=e.RG32F),i===e.HALF_FLOAT&&(u=e.RG16F),i===e.UNSIGNED_BYTE&&(u=e.RG8),i===e.UNSIGNED_SHORT&&l&&(u=l.RG16_EXT),i===e.SHORT&&l&&(u=l.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(u=e.RG8UI),i===e.UNSIGNED_SHORT&&(u=e.RG16UI),i===e.UNSIGNED_INT&&(u=e.RG32UI),i===e.BYTE&&(u=e.RG8I),i===e.SHORT&&(u=e.RG16I),i===e.INT&&(u=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(u=e.RGB8UI),i===e.UNSIGNED_SHORT&&(u=e.RGB16UI),i===e.UNSIGNED_INT&&(u=e.RGB32UI),i===e.BYTE&&(u=e.RGB8I),i===e.SHORT&&(u=e.RGB16I),i===e.INT&&(u=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(u=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(u=e.RGBA16UI),i===e.UNSIGNED_INT&&(u=e.RGBA32UI),i===e.BYTE&&(u=e.RGBA8I),i===e.SHORT&&(u=e.RGBA16I),i===e.INT&&(u=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&l&&(u=l.RGB16_EXT),i===e.SHORT&&l&&(u=l.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(u=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(u=e.R11F_G11F_B10F)),r===e.RGBA){let t=c?ge:a.getTransfer(s);i===e.FLOAT&&(u=e.RGBA32F),i===e.HALF_FLOAT&&(u=e.RGBA16F),i===e.UNSIGNED_BYTE&&(u=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&l&&(u=l.RGBA16_EXT),i===e.SHORT&&l&&(u=l.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(u=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(u=e.RGB5_A1)}return(u===e.R16F||u===e.R32F||u===e.RG16F||u===e.RG32F||u===e.RGBA16F||u===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),u}function D(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,N(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function k(e,t){return b(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),ne(t),t.isVideoTexture&&f.delete(t),t.isHTMLTexture&&p.delete(t)}function A(e){let t=e.target;t.removeEventListener(`dispose`,A),ie(t)}function ne(e){let t=i.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=h.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&re(e),Object.keys(r).length===0&&h.delete(n)}i.remove(e)}function re(t){let n=i.get(t);e.deleteTexture(n.__webglTexture);let r=t.source,a=h.get(r);delete a[n.__cacheKey],c.memory.textures--}function ie(t){let n=i.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),i.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let r=t.textures;for(let t=0,n=r.length;t<n;t++){let n=i.get(r[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),c.memory.textures--),i.remove(r[t])}i.remove(t)}let ae=0;function oe(){ae=0}function se(){return ae}function ce(e){ae=e}function le(){let e=ae;return e>=o.maxTextures&&N(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+o.maxTextures),ae+=1,e}function ue(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function j(t,r){let a=i.get(t);if(t.isVideoTexture&&Re(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)N(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)N(`WebGLRenderer: Texture marked for update but image is incomplete`);else{Ce(a,t,r);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+r)}function de(t,r){let a=i.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?Ce(a,t,r):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+r))}function fe(t,r){let a=i.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?Ce(a,t,r):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+r)}function pe(t,r){let a=i.get(t);t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version?we(a,t,r):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+r)}let he={[S]:e.REPEAT,[M]:e.CLAMP_TO_EDGE,[C]:e.MIRRORED_REPEAT},_e={[ee]:e.NEAREST,[O]:e.NEAREST_MIPMAP_NEAREST,[Ge]:e.NEAREST_MIPMAP_LINEAR,[ot]:e.LINEAR,[T]:e.LINEAR_MIPMAP_NEAREST,[me]:e.LINEAR_MIPMAP_LINEAR},ve={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function ye(n,r){if(r.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(r.magFilter===1006||r.magFilter===1007||r.magFilter===1005||r.magFilter===1008||r.minFilter===1006||r.minFilter===1007||r.minFilter===1005||r.minFilter===1008)&&N(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,he[r.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,he[r.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,he[r.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,_e[r.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,_e[r.minFilter]),r.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ve[r.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(r.magFilter===1003||r.minFilter!==1005&&r.minFilter!==1008||r.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(r.anisotropy>1||i.get(r).__currentAnisotropy){let a=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,a.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,o.getMaxAnisotropy())),i.get(r).__currentAnisotropy=r.anisotropy}}}function be(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,te));let i=n.source,a=h.get(i);a===void 0&&(a={},h.set(i,a));let o=ue(n);if(o!==t.__cacheKey){a[o]===void 0&&(a[o]={texture:e.createTexture(),usedTimes:0},c.memory.textures++,r=!0),a[o].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&re(n)),t.__cacheKey=o,t.__webglTexture=a[o].texture}return r}function xe(e,t,n){return Math.floor(Math.floor(e/n)/t)}function Se(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=xe(n.start,r.width,4),c=xe(t.start,r.width,4);n.start<=i+1&&a===c&&xe(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function Ce(t,r,c){let l=e.TEXTURE_2D;(r.isDataArrayTexture||r.isCompressedArrayTexture)&&(l=e.TEXTURE_2D_ARRAY),r.isData3DTexture&&(l=e.TEXTURE_3D);let u=be(t,r),d=r.source;n.bindTexture(l,t.__webglTexture,e.TEXTURE0+c);let f=i.get(d);if(d.version!==f.__version||u===!0){if(n.activeTexture(e.TEXTURE0+c),!(typeof ImageBitmap<`u`&&r.image instanceof ImageBitmap)){let t=a.getPrimaries(a.workingColorSpace),i=r.colorSpace===``?null:a.getPrimaries(r.colorSpace),o=r.colorSpace===``||t===i?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,o)}n.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment);let t=y(r.image,!1,o.maxTextureSize);t=F(r,t);let i=s.convert(r.format,r.colorSpace),m=s.convert(r.type),h=E(r.internalFormat,i,m,r.normalized,r.colorSpace,r.isVideoTexture);ye(l,r);let g,_=r.mipmaps,S=r.isVideoTexture!==!0,C=f.__version===void 0||u===!0,w=d.dataReady,T=k(r,t);if(r.isDepthTexture)h=D(r.format===v,r.type),C&&(S?n.texStorage2D(e.TEXTURE_2D,1,h,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,h,t.width,t.height,0,i,m,null));else if(r.isDataTexture){if(_.length>0){S&&C&&n.texStorage2D(e.TEXTURE_2D,T,h,_[0].width,_[0].height);for(let t=0,r=_.length;t<r;t++)g=_[t],S?w&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,g.width,g.height,i,m,g.data):n.texImage2D(e.TEXTURE_2D,t,h,g.width,g.height,0,i,m,g.data);r.generateMipmaps=!1}else S?(C&&n.texStorage2D(e.TEXTURE_2D,T,h,t.width,t.height),w&&Se(r,t,i,m)):n.texImage2D(e.TEXTURE_2D,0,h,t.width,t.height,0,i,m,t.data)}else if(r.isCompressedTexture){if(r.isCompressedArrayTexture){S&&C&&n.texStorage3D(e.TEXTURE_2D_ARRAY,T,h,_[0].width,_[0].height,t.depth);for(let a=0,o=_.length;a<o;a++)if(g=_[a],r.format!==1023){if(i!==null){if(S){if(w){if(r.layerUpdates.size>0){let t=Kr(g.width,g.height,r.format,r.type);for(let o of r.layerUpdates){let r=g.data.subarray(o*t/g.data.BYTES_PER_ELEMENT,(o+1)*t/g.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,o,g.width,g.height,1,i,r)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,0,g.width,g.height,t.depth,i,g.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,a,h,g.width,g.height,t.depth,0,g.data,0,0)}else N(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else S?w&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,a,0,0,0,g.width,g.height,t.depth,i,m,g.data):n.texImage3D(e.TEXTURE_2D_ARRAY,a,h,g.width,g.height,t.depth,0,i,m,g.data);r.layerUpdates.size>0&&r.clearLayerUpdates()}else{S&&C&&n.texStorage2D(e.TEXTURE_2D,T,h,_[0].width,_[0].height);for(let t=0,a=_.length;t<a;t++)g=_[t],r.format===1023?S?w&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,g.width,g.height,i,m,g.data):n.texImage2D(e.TEXTURE_2D,t,h,g.width,g.height,0,i,m,g.data):i===null?N(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):S?w&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,g.width,g.height,i,g.data):n.compressedTexImage2D(e.TEXTURE_2D,t,h,g.width,g.height,0,g.data)}}else if(r.isDataArrayTexture){if(S){if(C&&n.texStorage3D(e.TEXTURE_2D_ARRAY,T,h,t.width,t.height,t.depth),w){if(r.layerUpdates.size>0){let a=Kr(t.width,t.height,r.format,r.type);for(let o of r.layerUpdates){let r=t.data.subarray(o*a/t.data.BYTES_PER_ELEMENT,(o+1)*a/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,o,t.width,t.height,1,i,m,r)}r.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,i,m,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,h,t.width,t.height,t.depth,0,i,m,t.data)}else if(r.isData3DTexture)S?(C&&n.texStorage3D(e.TEXTURE_3D,T,h,t.width,t.height,t.depth),w&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,i,m,t.data)):n.texImage3D(e.TEXTURE_3D,0,h,t.width,t.height,t.depth,0,i,m,t.data);else if(r.isFramebufferTexture){if(C){if(S)n.texStorage2D(e.TEXTURE_2D,T,h,t.width,t.height);else{let r=t.width,a=t.height;for(let t=0;t<T;t++)n.texImage2D(e.TEXTURE_2D,t,h,r,a,0,i,m,null),r>>=1,a>>=1}}}else if(r.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),p.add(r),n.onpaint=e=>{let t=e.changedElements;for(let e of p)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(_.length>0){if(S&&C){let t=ze(_[0]);n.texStorage2D(e.TEXTURE_2D,T,h,t.width,t.height)}for(let t=0,r=_.length;t<r;t++)g=_[t],S?w&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,i,m,g):n.texImage2D(e.TEXTURE_2D,t,h,i,m,g);r.generateMipmaps=!1}else if(S){if(C){let r=ze(t);n.texStorage2D(e.TEXTURE_2D,T,h,r.width,r.height)}w&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,i,m,t)}else n.texImage2D(e.TEXTURE_2D,0,h,i,m,t);b(r)&&x(l),f.__version=d.version,r.onUpdate&&r.onUpdate(r)}t.__version=r.version}function we(t,r,c){if(r.image.length!==6)return;let l=be(t,r),u=r.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+c);let d=i.get(u);if(u.version!==d.__version||l===!0){n.activeTexture(e.TEXTURE0+c);let t=a.getPrimaries(a.workingColorSpace),i=r.colorSpace===``?null:a.getPrimaries(r.colorSpace),f=r.colorSpace===``||t===i?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,f);let p=r.isCompressedTexture||r.image[0].isCompressedTexture,m=r.image[0]&&r.image[0].isDataTexture,h=[];for(let e=0;e<6;e++)!p&&!m?h[e]=y(r.image[e],!0,o.maxCubemapSize):h[e]=m?r.image[e].image:r.image[e],h[e]=F(r,h[e]);let g=h[0],_=s.convert(r.format,r.colorSpace),v=s.convert(r.type),S=E(r.internalFormat,_,v,r.normalized,r.colorSpace),C=r.isVideoTexture!==!0,w=d.__version===void 0||l===!0,T=u.dataReady,D=k(r,g);ye(e.TEXTURE_CUBE_MAP,r);let O;if(p){C&&w&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,S,g.width,g.height);for(let t=0;t<6;t++){O=h[t].mipmaps;for(let i=0;i<O.length;i++){let a=O[i];r.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,0,0,a.width,a.height,_,v,a.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,S,a.width,a.height,0,_,v,a.data):_===null?N(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,0,0,a.width,a.height,_,a.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,i,S,a.width,a.height,0,a.data)}}}else{if(O=r.mipmaps,C&&w){O.length>0&&D++;let t=ze(h[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,S,t.width,t.height)}for(let t=0;t<6;t++)if(m){C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,h[t].width,h[t].height,_,v,h[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,h[t].width,h[t].height,0,_,v,h[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,_,v,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,i.width,i.height,0,_,v,i.data)}}else{C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,_,v,h[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,_,v,h[t]);for(let r=0;r<O.length;r++){let i=O[r];C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,_,v,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,_,v,i.image[t])}}}b(r)&&x(e.TEXTURE_CUBE_MAP),d.__version=u.version,r.onUpdate&&r.onUpdate(r)}t.__version=r.version}function Te(t,r,a,o,c,u){let d=s.convert(a.format,a.colorSpace),f=s.convert(a.type),p=E(a.internalFormat,d,f,a.normalized,a.colorSpace),m=i.get(r),h=i.get(a);if(h.__renderTarget=r,!m.__hasExternalTextures){let t=Math.max(1,r.width>>u),i=Math.max(1,r.height>>u);c===e.TEXTURE_3D||c===e.TEXTURE_2D_ARRAY?n.texImage3D(c,u,p,t,i,r.depth,0,d,f,null):n.texImage2D(c,u,p,t,i,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),Le(r)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,o,c,h.__webglTexture,0,Ie(r)):(c===e.TEXTURE_2D||c>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&c<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,o,c,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Ee(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=D(n.stencilBuffer,a),s=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Le(n)?l.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ie(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ie(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,s,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let a=t[i],o=s.convert(a.format,a.colorSpace),c=s.convert(a.type),u=E(a.internalFormat,o,c,a.normalized,a.colorSpace);Le(n)?l.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ie(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ie(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function De(t,r,a){let o=r.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(r.depthTexture&&r.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=i.get(r.depthTexture);if(c.__renderTarget=r,c.__webglTexture&&r.depthTexture.image.width===r.width&&r.depthTexture.image.height===r.height||(r.depthTexture.image.width=r.width,r.depthTexture.image.height=r.height,r.depthTexture.needsUpdate=!0),o){if(c.__webglInit===void 0&&(c.__webglInit=!0,r.depthTexture.addEventListener(`dispose`,te)),c.__webglTexture===void 0){c.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),ye(e.TEXTURE_CUBE_MAP,r.depthTexture);let t=s.convert(r.depthTexture.format),i=s.convert(r.depthTexture.type),a;r.depthTexture.format===1026?a=e.DEPTH_COMPONENT24:r.depthTexture.format===1027&&(a=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,a,r.width,r.height,0,t,i,null)}}else j(r.depthTexture,0);let u=c.__webglTexture,d=Ie(r),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=r.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(r.depthTexture.format===1026)Le(r)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(r.depthTexture.format===1027)Le(r)?l.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Oe(t){let r=i.get(t),a=t.isWebGLCubeRenderTarget===!0;if(r.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(r.__depthDisposeCallback&&r.__depthDisposeCallback(),e){let t=()=>{delete r.__boundDepthTexture,delete r.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),r.__depthDisposeCallback=t}r.__boundDepthTexture=e}if(t.depthTexture&&!r.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)De(r.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?De(r.__webglFramebuffer[0],t,0):De(r.__webglFramebuffer,t,0)}}else if(a){r.__webglDepthbuffer=[];for(let i=0;i<6;i++)if(n.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[i]),r.__webglDepthbuffer[i]===void 0)r.__webglDepthbuffer[i]=e.createRenderbuffer(),Ee(r.__webglDepthbuffer[i],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=r.__webglDepthbuffer[i];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let i=t.texture.mipmaps;if(i&&i.length>0?n.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer),r.__webglDepthbuffer===void 0)r.__webglDepthbuffer=e.createRenderbuffer(),Ee(r.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,i=r.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,i),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,i)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ke(t,n,r){let a=i.get(t);n!==void 0&&Te(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),r!==void 0&&Oe(t)}function Ae(t){let r=t.texture,a=i.get(t),o=i.get(r);t.addEventListener(`dispose`,A);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(o.__webglTexture===void 0&&(o.__webglTexture=e.createTexture()),o.__version=r.version,c.memory.textures++),u){a.__webglFramebuffer=[];for(let t=0;t<6;t++)if(r.mipmaps&&r.mipmaps.length>0){a.__webglFramebuffer[t]=[];for(let n=0;n<r.mipmaps.length;n++)a.__webglFramebuffer[t][n]=e.createFramebuffer()}else a.__webglFramebuffer[t]=e.createFramebuffer()}else{if(r.mipmaps&&r.mipmaps.length>0){a.__webglFramebuffer=[];for(let t=0;t<r.mipmaps.length;t++)a.__webglFramebuffer[t]=e.createFramebuffer()}else a.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=i.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),c.memory.textures++)}if(t.samples>0&&Le(t)===!1){a.__webglMultisampledFramebuffer=e.createFramebuffer(),a.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,a.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];a.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,a.__webglColorRenderbuffer[n]);let i=s.convert(r.format,r.colorSpace),o=s.convert(r.type),c=E(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=Ie(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,a.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(a.__webglDepthRenderbuffer=e.createRenderbuffer(),Ee(a.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,o.__webglTexture),ye(e.TEXTURE_CUBE_MAP,r);for(let n=0;n<6;n++)if(r.mipmaps&&r.mipmaps.length>0)for(let i=0;i<r.mipmaps.length;i++)Te(a.__webglFramebuffer[n][i],t,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,i);else Te(a.__webglFramebuffer[n],t,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);b(r)&&x(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let r=0,o=l.length;r<o;r++){let o=l[r],s=i.get(o),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,s.__webglTexture),ye(c,o),Te(a.__webglFramebuffer,t,o,e.COLOR_ATTACHMENT0+r,c,0),b(o)&&x(c)}n.unbindTexture()}else{let i=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(i=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(i,o.__webglTexture),ye(i,r),r.mipmaps&&r.mipmaps.length>0)for(let n=0;n<r.mipmaps.length;n++)Te(a.__webglFramebuffer[n],t,r,e.COLOR_ATTACHMENT0,i,n);else Te(a.__webglFramebuffer,t,r,e.COLOR_ATTACHMENT0,i,0);b(r)&&x(i),n.unbindTexture()}t.depthBuffer&&Oe(t)}function je(e){let t=e.textures;for(let r=0,a=t.length;r<a;r++){let a=t[r];if(b(a)){let t=w(e),r=i.get(a).__webglTexture;n.bindTexture(t,r),x(t),n.unbindTexture()}}}let Ne=[],Fe=[];function P(t){if(t.samples>0){if(Le(t)===!1){let r=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,c=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,l=i.get(t),d=r.length>1;if(d)for(let t=0;t<r.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,l.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,l.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,l.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglFramebuffer);for(let n=0;n<r.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,l.__webglColorRenderbuffer[n]);let t=i.get(r[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),u===!0&&(Ne.length=0,Fe.length=0,Ne.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(Ne.push(c),Fe.push(c),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Fe)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ne))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<r.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,l.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,l.__webglColorRenderbuffer[t]);let a=i.get(r[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,l.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,l.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&u){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Ie(e){return Math.min(o.maxSamples,e.samples)}function Le(e){let n=i.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Re(e){let t=c.render.frame;f.get(e)!==t&&(f.set(e,t),e.update())}function F(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(a.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&N(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):Me(`WebGLTextures: Unsupported texture color space:`,n)),t}function ze(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(d.width=e.naturalWidth||e.width,d.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(d.width=e.displayWidth,d.height=e.displayHeight):(d.width=e.width,d.height=e.height),d}this.allocateTextureUnit=le,this.resetTextureUnits=oe,this.getTextureUnits=se,this.setTextureUnits=ce,this.setTexture2D=j,this.setTexture2DArray=de,this.setTexture3D=fe,this.setTextureCube=pe,this.rebindTextures=ke,this.setupRenderTarget=Ae,this.updateRenderTargetMipmap=je,this.updateMultisampleRenderTarget=P,this.setupDepthRenderbuffer=Oe,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=Le,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Do(e,t){function n(n,r=``){let i,o=a.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(o===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return o===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return o===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return o===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Oo=class extends c{constructor(){super(),this.enabled=!1,this.isPresenting=!1,this.cameraAutoUpdate=!0}setAnimationLoop(){}dispose(){}hasDepthSensing(){return!1}getEnvironmentBlendMode(){}},ko=new ct,Ao=new n;Ao.set(-1,0,0,0,1,0,0,0,1);function jo(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,sr(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(ko.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Ao),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Mo(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return Me(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?N(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):N(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var No=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Po=null;function Fo(){return Po===null&&(Po=new Ln(No,16,16,Le,ne),Po.name=`DFG_LUT`,Po.minFilter=ot,Po.magFilter=ot,Po.wrapS=M,Po.wrapT=M,Po.generateMipmaps=!1,Po.needsUpdate=!0),Po}var Io=class{constructor(e={}){let{canvas:t=Be(),context:n=null,depth:r=!0,stencil:i=!1,alpha:o=!1,antialias:c=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:u=!1,powerPreference:d=`default`,failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:p=!1,outputBufferType:m=_e}=e;this.isWebGLRenderer=!0;let h;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);h=n.getContextAttributes().alpha}else h=o;let _=m,v=new Set([Xe,re,se]),y=new Set([_e,k,Se,te,be,ye]),b=new Uint32Array(4),x=new Int32Array(4),S=new z,C=null,w=null,T=[],E=[],D=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let O=this,ee=!1,A=null,ie=null,ae=null,oe=null;this._outputColorSpace=g;let ce=0,ue=0,j=null,de=-1,fe=null,M=new jt,pe=new jt,he=null,ge=new s(0),ve=0,xe=t.width,Ce=t.height,we=1,Te=null,Ee=null,De=new jt(0,0,xe,Ce),Oe=new jt(0,0,xe,Ce),ke=!1,Ae=new Vn,je=!1,Ne=!1,Pe=new ct,Fe=new z,P=new jt,Ie={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Le=!1;function Re(){return j===null?we:1}let F=n;function ze(e,n){return t.getContext(e,n)}let Ve,He,I,Ue,L,R,We,Ge,Ke,qe,Je,Ye,Ze,$e,et,tt,nt,rt,at,ot,st,lt,ut;try{let e={alpha:!0,depth:r,stencil:i,antialias:c,premultipliedAlpha:l,preserveDrawingBuffer:u,powerPreference:d,failIfMajorPerformanceCaveat:f};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,pt,!1),t.addEventListener(`webglcontextrestored`,mt,!1),t.addEventListener(`webglcontextcreationerror`,ht,!1),F===null){let t=`webgl2`;if(F=ze(t,e),F===null)throw ze(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}dt()}catch(e){throw t.removeEventListener(`webglcontextlost`,pt,!1),t.removeEventListener(`webglcontextrestored`,mt,!1),t.removeEventListener(`webglcontextcreationerror`,ht,!1),Me(`WebGLRenderer: `+e.message),e}function dt(){Ve=new li(F),Ve.init(),st=new Do(F,Ve),He=new ii(F,Ve,e,st),I=new To(F,Ve),He.reversedDepthBuffer&&p&&I.buffers.depth.setReversed(!0),ie=F.createFramebuffer(),ae=F.createFramebuffer(),oe=F.createFramebuffer(),Ue=new fi(F),L=new fo,R=new Eo(F,Ve,I,L,He,st,Ue),We=new ci(O),Ge=new Xr(F),lt=new ni(F,Ge),Ke=new ui(F,Ge,Ue,lt),qe=new mi(F,Ke,Ge,lt,Ue),rt=new pi(F,He,R),et=new ai(L),Je=new uo(O,We,Ve,He,lt,et),Ye=new jo(O,L),Ze=new go,$e=new Co(Ve),nt=new ti(O,We,I,qe,h,l),tt=new wo(O,qe,He),ut=new Mo(F,Ue,He,I),at=new ri(F,Ve,Ue),ot=new di(F,Ve,Ue),Ue.programs=Je.programs,O.capabilities=He,O.extensions=Ve,O.properties=L,O.renderLists=Ze,O.shadowMap=tt,O.state=I,O.info=Ue}_!==1009&&(D=new gi(_,t.width,t.height,c,r,i));let ft=new Oo(O,F);this.xr=ft,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let e=Ve.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ve.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return we},this.setPixelRatio=function(e){e!==void 0&&(we=e,this.setSize(xe,Ce,!1))},this.getSize=function(e){return e.set(xe,Ce)},this.setSize=function(e,n,r=!0){ft.isPresenting?N(`WebGLRenderer: Can't change size while VR device is presenting.`):(xe=e,Ce=n,t.width=Math.floor(e*we),t.height=Math.floor(n*we),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),D!==null&&D.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(xe*we,Ce*we).floor()},this.setDrawingBufferSize=function(e,n,r){xe=e,Ce=n,we=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(_===1009)Me(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){N(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}D.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(M)},this.getViewport=function(e){return e.copy(De)},this.setViewport=function(e,t,n,r){e.isVector4?De.set(e.x,e.y,e.z,e.w):De.set(e,t,n,r),I.viewport(M.copy(De).multiplyScalar(we).round())},this.getScissor=function(e){return e.copy(Oe)},this.setScissor=function(e,t,n,r){e.isVector4?Oe.set(e.x,e.y,e.z,e.w):Oe.set(e,t,n,r),I.scissor(pe.copy(Oe).multiplyScalar(we).round())},this.getScissorTest=function(){return ke},this.setScissorTest=function(e){I.setScissorTest(ke=e)},this.setOpaqueSort=function(e){Te=e},this.setTransparentSort=function(e){Ee=e},this.getClearColor=function(e){return e.copy(nt.getClearColor())},this.setClearColor=function(){nt.setClearColor(...arguments)},this.getClearAlpha=function(){return nt.getClearAlpha()},this.setClearAlpha=function(){nt.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(j!==null){let t=j.texture.format;e=v.has(t)}if(e){let e=j.texture.type,t=y.has(e),n=nt.getClearColor(),r=nt.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(b[0]=i,b[1]=a,b[2]=o,b[3]=r,F.clearBufferuiv(F.COLOR,0,b)):(x[0]=i,x[1]=a,x[2]=o,x[3]=r,F.clearBufferiv(F.COLOR,0,x))}else r|=F.COLOR_BUFFER_BIT}t&&(r|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&F.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),A=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,pt,!1),t.removeEventListener(`webglcontextrestored`,mt,!1),t.removeEventListener(`webglcontextcreationerror`,ht,!1),nt.dispose(),Ze.dispose(),$e.dispose(),L.dispose(),We.dispose(),qe.dispose(),lt.dispose(),ut.dispose(),Je.dispose(),ft.dispose(),ft.removeEventListener(`sessionstart`,bt),ft.removeEventListener(`sessionend`,xt),St.stop()};function pt(e){e.preventDefault(),Qe(`WebGLRenderer: Context Lost.`),ee=!0}function mt(){Qe(`WebGLRenderer: Context Restored.`),ee=!1;let e=Ue.autoReset,t=tt.enabled,n=tt.autoUpdate,r=tt.needsUpdate,i=tt.type;dt(),Ue.autoReset=e,tt.enabled=t,tt.autoUpdate=n,tt.needsUpdate=r,tt.type=i}function ht(e){Me(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function gt(e){let t=e.target;t.removeEventListener(`dispose`,gt),_t(t)}function _t(e){vt(e),L.remove(e)}function vt(e){let t=L.get(e).programs;t!==void 0&&(t.forEach(function(e){Je.releaseProgram(e)}),e.isShaderMaterial&&Je.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=Ie);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Pt(e,t,n,r,i);I.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Ke.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;lt.setup(i,r,s,n,c);let h,g=at;if(c!==null&&(h=Ge.get(c),g=ot,g.setIndex(h)),i.isMesh)r.wireframe===!0?(I.setLineWidth(r.wireframeLinewidth*Re()),g.setMode(F.LINES)):g.setMode(F.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),I.setLineWidth(e*Re()),i.isLineSegments?g.setMode(F.LINES):i.isLineLoop?g.setMode(F.LINE_LOOP):g.setMode(F.LINE_STRIP)}else i.isPoints?g.setMode(F.POINTS):i.isSprite&&g.setMode(F.TRIANGLES);if(i.isBatchedMesh){if(Ve.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ge.get(c).bytesPerElement:1,o=L.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(F,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function B(e,t,n,r){A!==null&&e.isNodeMaterial&&A.setObject(r,e),je===!0&&et.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Ot(e,t,r),e.side=0,e.needsUpdate=!0,Ot(e,t,r),e.side=2):Ot(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),A!==null&&A.renderStart(e,t,n),w=$e.get(n),w.init(t),E.push(w),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(w.pushLight(e),e.castShadow&&w.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(w.pushLight(e),e.castShadow&&w.pushShadow(e))}),w.setupLights(),A!==null&&A.updateLights(w.state.lightsArray),Ne=this.localClippingEnabled,je=et.init(this.clippingPlanes,Ne),je===!0&&et.setGlobalState(this.clippingPlanes,t),A!==null&&tt.render(w.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];B(o,n,t,e),r.add(o)}else B(i,n,t,e),r.add(i)}}),w=E.pop(),A!==null&&A.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=L.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Ve.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let V=null;function yt(e){V&&V(e)}function bt(){St.stop()}function xt(){St.start()}let St=new Yr;St.setAnimationLoop(yt),typeof self<`u`&&St.setContext(self),this.setAnimationLoop=function(e){V=e,ft.setAnimationLoop(e),e===null?St.stop():St.start()},ft.addEventListener(`sessionstart`,bt),ft.addEventListener(`sessionend`,xt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){Me(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(ee===!0)return;A!==null&&A.renderStart(e,t);let n=ft.enabled===!0&&ft.isPresenting===!0,r=D!==null&&(j===null||n)&&D.begin(O,j);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),ft.enabled===!0&&ft.isPresenting===!0&&(D===null||D.isCompositing()===!1)&&(ft.cameraAutoUpdate===!0&&ft.updateCamera(t),t=ft.getCamera()),e.isScene===!0&&e.onBeforeRender(O,e,t,j),w=$e.get(e,E.length),w.init(t),w.state.textureUnits=R.getTextureUnits(),E.push(w),Pe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Ae.setFromProjectionMatrix(Pe,le,t.reversedDepth),Ne=this.localClippingEnabled,je=et.init(this.clippingPlanes,Ne),C=Ze.get(e,T.length),C.init(),T.push(C),ft.enabled===!0&&ft.isPresenting===!0){let e=O.xr.getDepthSensingMesh();e!==null&&Ct(e,t,-1/0,O.sortObjects)}Ct(e,t,0,O.sortObjects),C.finish(),A!==null&&A.updateLights(w.state.lightsArray),O.sortObjects===!0&&C.sort(Te,Ee),Le=ft.enabled===!1||ft.isPresenting===!1||ft.hasDepthSensing()===!1,Le&&nt.addToRenderList(C,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),je===!0&&et.beginShadows();let i=w.state.shadowsArray;if(tt.render(i,e,t),je===!0&&et.endShadows(),(r&&D.hasRenderPass())===!1){let n=C.opaque,r=C.transmissive;if(w.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];Tt(n,r,e,a)}Le&&nt.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];wt(C,e,n,n.viewport)}}else r.length>0&&Tt(n,r,e,t),Le&&nt.render(e),wt(C,e,t)}j!==null&&ue===0&&(R.updateMultisampleRenderTarget(j),R.updateRenderTargetMipmap(j)),r&&D.end(O),e.isScene===!0&&e.onAfterRender(O,e,t),lt.resetDefaultState(),de=-1,fe=null,E.pop(),E.length>0?(w=E[E.length-1],R.setTextureUnits(w.state.textureUnits),je===!0&&et.setGlobalState(O.clippingPlanes,w.state.camera)):w=null,T.pop(),C=T.length>0?T[T.length-1]:null,A!==null&&A.renderEnd()};function Ct(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)w.pushLightProbeGrid(e);else if(e.isLight)w.pushLight(e),e.castShadow&&w.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(Ae)){r&&P.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Pe);let i=qe.update(e),a=e.material;a.visible&&C.push(e,i,a,n,P.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(Ae))){let i=qe.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),P.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),P.copy(e.boundingSphere.center)),P.applyMatrix4(e.matrixWorld).applyMatrix4(Pe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&C.push(e,i,c,n,P.z,s,t)}}else a.visible&&C.push(e,i,a,n,P.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)Ct(i[e],t,n,r)}function wt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;w.setupLightsView(n),je===!0&&et.setGlobalState(O.clippingPlanes,n),r&&I.viewport(M.copy(r)),i.length>0&&Et(i,t,n),a.length>0&&Et(a,t,n),o.length>0&&Et(o,t,n),I.buffers.depth.setTest(!0),I.buffers.depth.setMask(!0),I.buffers.color.setMask(!0),I.setPolygonOffset(!1)}function Tt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[r.id]===void 0){let e=Ve.has(`EXT_color_buffer_half_float`)||Ve.has(`EXT_color_buffer_float`);w.state.transmissionRenderTarget[r.id]=new Nt(1,1,{generateMipmaps:!0,type:e?ne:_e,minFilter:me,samples:Math.max(4,He.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:a.workingColorSpace})}let o=w.state.transmissionRenderTarget[r.id],s=r.viewport||M;o.setSize(s.z*O.transmissionResolutionScale,s.w*O.transmissionResolutionScale);let c=O.getRenderTarget(),l=O.getActiveCubeFace(),u=O.getActiveMipmapLevel();O.setRenderTarget(o),O.getClearColor(ge),ve=O.getClearAlpha(),ve<1&&O.setClearColor(16777215,.5),O.clear(),Le&&nt.render(n);let d=O.toneMapping;O.toneMapping=0;let f=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),w.setupLightsView(r),je===!0&&et.setGlobalState(O.clippingPlanes,r),Et(e,n,r),R.updateMultisampleRenderTarget(o),R.updateRenderTargetMipmap(o),Ve.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Dt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(R.updateMultisampleRenderTarget(o),R.updateRenderTargetMipmap(o))}O.setRenderTarget(c,l,u),O.setClearColor(ge,ve),f!==void 0&&(r.viewport=f),O.toneMapping=d}function Et(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Dt(o,t,n,s,l,c)}}function Dt(e,t,n,r,i,a){A!==null&&i.isNodeMaterial&&A.setObject(e,i),e.onBeforeRender(O,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(O,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,O.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,O.renderBufferDirect(n,t,r,i,e,a),i.side=2):O.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(O,t,n,r,i,a)}function Ot(e,t,n){t.isScene!==!0&&(t=Ie);let r=L.get(e),i=w.state.lights,a=w.state.shadowsArray,o=i.state.version,s=Je.getParameters(e,i.state,a,t,n,w.state.lightProbeGridArray),c=Je.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=We.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,gt),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return At(e,s),d}else s.uniforms=Je.getUniforms(e),A!==null&&e.isNodeMaterial&&A.build(e,n,s),e.onBeforeCompile(s,O),d=Je.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=et.uniform),At(e,s),r.needsLights=It(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=w.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function kt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Ca.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function At(e,t){let n=L.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Mt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];S.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(S))return n}return null}function Pt(e,t,n,r,i){t.isScene!==!0&&(t=Ie),R.resetTextureUnits();let o=t.fog,s=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,c=j===null?O.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:a.workingColorSpace,l=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,u=We.get(r.envMap||s,l),d=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,f=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),p=!!n.morphAttributes.position,m=!!n.morphAttributes.normal,h=!!n.morphAttributes.color,g=0;r.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(g=O.toneMapping);let _=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,v=_===void 0?0:_.length,y=L.get(r),b=w.state.lights;if(je===!0&&(Ne===!0||e!==fe)){let t=e===fe&&r.id===de;et.setState(r,e,t)}let x=!1;r.version===y.__version?y.needsLights&&y.lightsStateVersion!==b.state.version?x=!0:y.outputColorSpace===c?i.isBatchedMesh&&y.batching===!1||!i.isBatchedMesh&&y.batching===!0||i.isBatchedMesh&&y.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&y.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&y.instancing===!1||!i.isInstancedMesh&&y.instancing===!0||i.isSkinnedMesh&&y.skinning===!1||!i.isSkinnedMesh&&y.skinning===!0||i.isInstancedMesh&&y.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&y.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&y.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&y.instancingMorph===!1&&i.morphTexture!==null?x=!0:y.envMap===u?r.fog===!0&&y.fog!==o||y.numClippingPlanes!==void 0&&(y.numClippingPlanes!==et.numPlanes||y.numIntersection!==et.numIntersection)?x=!0:y.vertexAlphas===d&&y.vertexTangents===f&&y.morphTargets===p&&y.morphNormals===m&&y.morphColors===h&&y.toneMapping===g&&y.morphTargetsCount===v?!!y.lightProbeGrid!=w.state.lightProbeGridArray.length>0&&(x=!0):x=!0:x=!0:x=!0:(x=!0,y.__version=r.version);let S=y.currentProgram;x===!0&&(S=Ot(r,t,i),A&&r.isNodeMaterial&&A.onUpdateProgram(r,S,y));let C=!1,T=!1,E=!1,D=S.getUniforms(),k=y.uniforms;if(I.useProgram(S.program)&&(C=!0,T=!0,E=!0),r.id!==de&&(de=r.id,T=!0),y.needsLights){let e=Mt(w.state.lightProbeGridArray,i);y.lightProbeGrid!==e&&(y.lightProbeGrid=e,T=!0)}if(C||fe!==e){I.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),D.setValue(F,`projectionMatrix`,e.projectionMatrix),D.setValue(F,`viewMatrix`,e.matrixWorldInverse);let t=D.map.cameraPosition;t!==void 0&&t.setValue(F,Fe.setFromMatrixPosition(e.matrixWorld)),He.logarithmicDepthBuffer&&D.setValue(F,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&D.setValue(F,`isOrthographic`,e.isOrthographicCamera===!0),fe!==e&&(fe=e,T=!0,E=!0)}if(y.needsLights&&(b.state.sunShadowMap.length>0&&D.setValue(F,`sunShadowMap`,b.state.sunShadowMap,R),b.state.directionalShadowMap.length>0&&D.setValue(F,`directionalShadowMap`,b.state.directionalShadowMap,R),b.state.spotShadowMap.length>0&&D.setValue(F,`spotShadowMap`,b.state.spotShadowMap,R),b.state.pointShadowMap.length>0&&D.setValue(F,`pointShadowMap`,b.state.pointShadowMap,R)),i.isSkinnedMesh){D.setOptional(F,i,`bindMatrix`),D.setOptional(F,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),D.setValue(F,`boneTexture`,e.boneTexture,R))}i.isBatchedMesh&&(D.setOptional(F,i,`batchingTexture`),D.setValue(F,`batchingTexture`,i._matricesTexture,R),D.setOptional(F,i,`batchingIdTexture`),D.setValue(F,`batchingIdTexture`,i._indirectTexture,R),D.setOptional(F,i,`batchingColorTexture`),i._colorsTexture!==null&&D.setValue(F,`batchingColorTexture`,i._colorsTexture,R));let ee=n.morphAttributes;if((ee.position!==void 0||ee.normal!==void 0||ee.color!==void 0)&&rt.update(i,n,S),(T||y.receiveShadow!==i.receiveShadow)&&(y.receiveShadow=i.receiveShadow,D.setValue(F,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=Fo()),T){if(D.setValue(F,`toneMappingExposure`,O.toneMappingExposure),y.needsLights&&Ft(k,E),o&&r.fog===!0&&Ye.refreshFogUniforms(k,o),Ye.refreshMaterialUniforms(k,r,we,Ce,w.state.transmissionRenderTarget[e.id]),y.needsLights&&y.lightProbeGrid){let e=y.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}Ca.upload(F,kt(y),k,R)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Ca.upload(F,kt(y),k,R),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&D.setValue(F,`center`,i.center),D.setValue(F,`modelViewMatrix`,i.modelViewMatrix),D.setValue(F,`normalMatrix`,i.normalMatrix),D.setValue(F,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];ut.update(n,S),ut.bind(n,S)}}return S}function Ft(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function It(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return ce},this.getActiveMipmapLevel=function(){return ue},this.getRenderTarget=function(){return j},this.setRenderTargetTextures=function(e,t,n){let r=L.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),L.get(e.texture).__webglTexture=t,L.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=L.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){j=e,ce=t,ue=n;let r=null,i=!1,a=!1;if(e){let o=L.get(e);if(o.__useDefaultFramebuffer!==void 0){I.bindFramebuffer(F.FRAMEBUFFER,o.__webglFramebuffer),M.copy(e.viewport),pe.copy(e.scissor),he=e.scissorTest,I.viewport(M),I.scissor(pe),I.setScissorTest(he),de=-1;return}if(o.__webglFramebuffer===void 0)R.setupRenderTarget(e);else if(o.__hasExternalTextures)R.rebindTextures(e,L.get(e.texture).__webglTexture,L.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&L.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);R.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=L.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&R.useMultisampledRTT(e)===!1?L.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,M.copy(e.viewport),pe.copy(e.scissor),he=e.scissorTest}else M.copy(De).multiplyScalar(we).floor(),pe.copy(Oe).multiplyScalar(we).floor(),he=ke;if(n!==0&&(r=ie),I.bindFramebuffer(F.FRAMEBUFFER,r)&&I.drawBuffers(e,r),I.viewport(M),I.scissor(pe),I.setScissorTest(he),i){let r=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=L.get(e.textures[t]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=L.get(e.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,t.__webglTexture,n)}de=-1};function Lt(e){let t=L.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=He.textureFormatReadable(e.format),t.__typeReadable=He.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){Me(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){I.bindFramebuffer(F.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s);let u=Lt(o);if(u.__formatReadable===!1){Me(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){Me(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&F.readPixels(t,n,r,i,st.convert(c),st.convert(l),a)}finally{let e=j===null?null:L.get(j).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=L.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){I.bindFramebuffer(F.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+s);let d=Lt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,f),F.bufferData(F.PIXEL_PACK_BUFFER,a.byteLength,F.STREAM_READ),F.readPixels(t,n,r,i,st.convert(l),st.convert(u),0),F.bindBuffer(F.PIXEL_PACK_BUFFER,null);let p=j===null?null:L.get(j).__webglFramebuffer;I.bindFramebuffer(F.FRAMEBUFFER,p);let m=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await it(F,m,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,f),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,a),F.bindBuffer(F.PIXEL_PACK_BUFFER,null),F.deleteBuffer(f),F.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;R.setTexture2D(e,0),F.copyTexSubImage2D(F.TEXTURE_2D,n,0,0,o,s,i,a),I.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=st.convert(t.format),_=st.convert(t.type),v;t.isData3DTexture?(R.setTexture3D(t,0),v=F.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(R.setTexture2DArray(t,0),v=F.TEXTURE_2D_ARRAY):(R.setTexture2D(t,0),v=F.TEXTURE_2D),I.activeTexture(F.TEXTURE0),I.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,t.flipY),I.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),I.pixelStorei(F.UNPACK_ALIGNMENT,t.unpackAlignment);let y=I.getParameter(F.UNPACK_ROW_LENGTH),b=I.getParameter(F.UNPACK_IMAGE_HEIGHT),x=I.getParameter(F.UNPACK_SKIP_PIXELS),S=I.getParameter(F.UNPACK_SKIP_ROWS),C=I.getParameter(F.UNPACK_SKIP_IMAGES);I.pixelStorei(F.UNPACK_ROW_LENGTH,h.width),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,h.height),I.pixelStorei(F.UNPACK_SKIP_PIXELS,l),I.pixelStorei(F.UNPACK_SKIP_ROWS,u),I.pixelStorei(F.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=L.get(e),r=L.get(t),h=L.get(n.__renderTarget),g=L.get(r.__renderTarget);I.bindFramebuffer(F.READ_FRAMEBUFFER,h.__webglFramebuffer),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(e).__webglTexture,i,d+n),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,L.get(t).__webglTexture,a,m+n)),F.blitFramebuffer(l,u,o,s,f,p,o,s,F.DEPTH_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||L.has(e)){let n=L.get(e),r=L.get(t);I.bindFramebuffer(F.READ_FRAMEBUFFER,ae),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,oe);for(let e=0;e<c;e++)w?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,n.__webglTexture,i),T?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,r.__webglTexture,a),i===0?T?F.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):F.copyTexSubImage2D(v,a,f,p,l,u,o,s):F.blitFramebuffer(l,u,o,s,f,p,o,s,F.COLOR_BUFFER_BIT,F.NEAREST);I.bindFramebuffer(F.READ_FRAMEBUFFER,null),I.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?F.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):F.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):F.texSubImage2D(F.TEXTURE_2D,a,f,p,o,s,g,_,h);I.pixelStorei(F.UNPACK_ROW_LENGTH,y),I.pixelStorei(F.UNPACK_IMAGE_HEIGHT,b),I.pixelStorei(F.UNPACK_SKIP_PIXELS,x),I.pixelStorei(F.UNPACK_SKIP_ROWS,S),I.pixelStorei(F.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&F.generateMipmap(v),I.unbindTexture()},this.initRenderTarget=function(e){L.get(e).__webglFramebuffer===void 0&&R.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?R.setTextureCube(e,0):e.isData3DTexture?R.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?R.setTexture2DArray(e,0):R.setTexture2D(e,0),I.unbindTexture()},this.resetState=function(){ce=0,ue=0,j=null,I.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return le}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=a._getDrawingBufferColorSpace(e),t.unpackColorSpace=a._getUnpackColorSpace()}},Lo=606*pt,Ro={x0:-48e3,z0:-42e3,step:100,cols:961,rows:841},zo=`terrain/dfw-dem-v1.bin`,Bo=e=>e-Lo,Vo=e=>e*pt-Lo,Ho=e=>(e+Lo)/pt;function Uo(e,t,n){let r=t%n;return t<n?r===0?0:e[t-1]:r===0?e[t-n]:e[t-1]+e[t-n]-e[t-n-1]}function Wo(e,t=Ro){let n=t.cols*t.rows;if(e.byteLength!==n)throw Error(`DEM: expected ${n} bytes, got ${e.byteLength}`);let r=new Int8Array(e.buffer,e.byteOffset,n),i=new Int16Array(n),a=new Float32Array(n);for(let e=0;e<n;e++)i[e]=r[e]+Uo(i,e,t.cols),a[e]=Bo(i[e]+200);return a}function Go(e,t,n,r=Ro){let i=Math.min(Math.max((t-r.x0)/r.step,0),r.cols-1.001),a=Math.min(Math.max((n-r.z0)/r.step,0),r.rows-1.001),o=Math.floor(i),s=Math.floor(a),c=i-o,l=a-s,u=s*r.cols+o,d=e[u],f=e[u+1],p=e[u+r.cols],m=e[u+r.cols+1];return(d*(1-c)+f*c)*(1-l)+(p*(1-c)+m*c)*l}function Ko(e){return e.map(e=>{let t=e.bx-e.ax,n=e.bz-e.az,r=Math.hypot(t,n);return{...e,ux:t/r,uz:n/r,len:r}})}function qo(e,t,n,r){let i=t-e.ax,a=n-e.az,o=i*e.ux+a*e.uz,s=Math.abs(i*-e.uz+a*e.ux),c=Math.min(Math.max(o/e.len,0),1);r.h=e.ay+(e.by-e.ay)*c;let l=o<0?-o:o>e.len?o-e.len:0,u=Math.hypot(Math.max(0,s-150),Math.max(0,l-300));if(u<=0){r.w=1;return}if(u>=600){r.w=0;return}let d=1-u/600;r.w=d*d*(3-2*d)}function Jo(e){let t=Ko(e),n={h:0,w:0},r=null;return{setDem(e){r=e},hasDem(){return r!==null},naturalAt(e,t){return r?Go(r,e,t):0},heightAt(e,i){let a=0,o=0;for(let r=0;r<t.length;r++)qo(t[r],e,i,n),n.w>0&&(a+=n.w,o+=n.w*n.h);let s=r?Go(r,e,i):0;return a===0?s:a>=1?o/a:o+(1-a)*s}}}function Yo(e,t){let{cols:n,rows:r,step:i,x0:a,z0:o}=Ro,c=(n-1)*i,l=(r-1)*i,u=new er(c,l,(n-1)/5,(r-1)/5);u.rotateX(-Math.PI/2),u.translate(a+c/2,0,o+l/2);let f=u.getAttribute(`position`),p=new Float32Array(3*f.count),m=new s(5137225),h=new s(9868388),g=new s;for(let t=0;t<f.count;t++){let n=f.getX(t),r=f.getZ(t),a=e.heightAt(n,r);f.setY(t,a-2);let o=(e.heightAt(n-i,r-i)-a)/i,s=Math.max(0,Math.min(1,.35+a/220+o*4));g.copy(m).lerp(h,s).toArray(p,t*3)}return u.setAttribute(`color`,new d(p,3)),u.computeBoundingSphere(),new H(u,t)}bt(((e,t)=>{(function(e){var n=[`a`,`b`,`start`,`select`];function r(e){e||={};var t={},r=[];function i(i){var a=(i||[]).filter(function(e){return e&&Number(e.id)>0});return Object.keys(t).forEach(function(e){t[e].wifi&&!a.some(function(t){return Number(t.id)===Number(e)})&&a.push({id:Number(e),connected:!1,transport:`wifi`})}),r=a.map(function(r){var i=Object.assign({},r),a=Number(i.id),o=t[a],s=i.transport===`wifi`,c=!!i.connected,l=c?s?`wifi:`+String(i.session||i.controllerId||a):`phone:`+String(i.session||a):``,u=Number.isSafeInteger(i.cancelSeq)?i.cancelSeq:0,d=!!o&&(o.source!==l||o.rawCancel!==u),f=!o&&s&&c||d&&(s||o.wifi),p=o||{epoch:u,blocked:{}};d&&p.epoch++;var m=f&&e.onCancel&&e.onCancel({id:a,previous:o?o.source:``,source:l,disconnected:!c})===!0;return m&&n.forEach(function(e){p.blocked[e]=!!i[e]}),n.forEach(function(e){i[e]||(p.blocked[e]=!1),i[e]=c&&!m&&!p.blocked[e]&&!!i[e]}),(!c||m)&&(i.x=i.y=i.aimX=i.aimY=0),i.id=a,i.connected=c,i.cancelSeq=p.epoch,p.source=l,p.wifi=s,p.rawCancel=u,t[a]=p,i}),r.map(function(e){return Object.assign({},e)})}return{read:i,peek:function(){return r.map(function(e){return Object.assign({},e)})}}}var i=new WeakMap;function a(e){if(!e.getElementById(`ptv-client-style`)){var t=e.createElement(`style`);t.id=`ptv-client-style`,t.textContent=`[data-puretv-clients]{box-sizing:border-box;min-width:0}[data-puretv-clients][hidden]{display:none!important}.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}.ptv-client-card+.ptv-client-card{margin-top:6px}.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}.ptv-client-body{flex:1;min-width:0}.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}.ptv-client-seat{font:inherit;color:inherit}.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}`,(e.head||e.documentElement).appendChild(t)}}function o(e){var t=`http://www.w3.org/2000/svg`,n=e.createElementNS(t,`svg`);n.setAttribute(`class`,`ptv-client-icon`),n.setAttribute(`viewBox`,`0 0 24 24`),n.setAttribute(`aria-hidden`,`true`),n.setAttribute(`focusable`,`false`),n.setAttribute(`fill`,`none`),n.setAttribute(`stroke`,`currentColor`),n.setAttribute(`stroke-width`,`1.7`),n.setAttribute(`stroke-linecap`,`round`),n.setAttribute(`stroke-linejoin`,`round`);var r=e.createElementNS(t,`path`);r.setAttribute(`d`,`M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z`),n.appendChild(r);var i=e.createElementNS(t,`path`);return i.setAttribute(`d`,`M7 9.7v4.6M4.7 12h4.6`),n.appendChild(i),[[16,10.7],[18.8,13]].forEach(function(r){var i=e.createElementNS(t,`circle`);i.setAttribute(`cx`,String(r[0])),i.setAttribute(`cy`,String(r[1])),i.setAttribute(`r`,`.75`),i.setAttribute(`fill`,`currentColor`),i.setAttribute(`stroke`,`none`),n.appendChild(i)}),n}function s(e,t,n){if(e&&e.ownerDocument){var r=n&&n.language===`en`?`en`:`zh`,s=(Array.isArray(t)?t:[]).filter(function(e){return e&&e.connected===!0&&e.transport===`wifi`&&Number(e.id)>0}).map(function(e){return{seat:Number(e.id),identity:typeof e.controllerId==`string`?e.controllerId:``}}).sort(function(e,t){return e.seat-t.seat}),c=JSON.stringify([r,s]);if(i.get(e)!==c){i.set(e,c);var l=e.ownerDocument;for(a(l),e.setAttribute(`data-puretv-clients`,``),e.setAttribute(`role`,`status`),e.setAttribute(`aria-live`,`polite`),e.setAttribute(`aria-atomic`,`true`),e.setAttribute(`aria-label`,r===`en`?`Connected pureTV controllers`:`已连接的 pureTV 手柄`);e.firstChild;)e.removeChild(e.firstChild);s.forEach(function(t){var n=l.createElement(`div`);n.className=`ptv-client-card`,n.setAttribute(`data-puretv-controller-id`,t.identity),n.setAttribute(`data-player-id`,String(t.seat)),n.appendChild(o(l));var i=l.createElement(`div`);i.className=`ptv-client-body`;var a=l.createElement(`div`);a.className=`ptv-client-heading`;var s=l.createElement(`strong`);s.className=`ptv-client-seat`,s.textContent=t.seat+`P`;var c=l.createElement(`span`);c.className=`ptv-client-state`,c.textContent=r===`en`?`Connected`:`已连接`,a.appendChild(s),a.appendChild(c),i.appendChild(a);var u=l.createElement(`span`);u.className=`ptv-client-id`,u.setAttribute(`data-puretv-controller-id-text`,``),u.textContent=`ID: `+(t.identity||(r===`en`?`not reported`:`未提供`)),i.appendChild(u),n.appendChild(i),e.appendChild(n)}),e.hidden=s.length===0}}}e.PureTVControllerAdapter={create:r,renderClients:s},t!==void 0&&t.exports&&(t.exports=e.PureTVControllerAdapter)})(typeof window<`u`?window:globalThis)}))();var Xo=Object.freeze([`UP`,`DOWN`,`LEFT`,`RIGHT`,`START`,`A`,`B`,`X`,`Y`]),Zo=()=>Object.fromEntries(Xo.map(e=>[e,!1])),Qo=e=>JSON.parse(JSON.stringify(e)),$o={ArrowUp:`UP`,ArrowDown:`DOWN`,ArrowLeft:`LEFT`,ArrowRight:`RIGHT`,Enter:`A`,Start:`START`,p:`START`,b:`B`,A:`A`,B:`B`,X:`X`,Y:`Y`,Select:`Y`},es={Numpad8:`UP`,Numpad2:`DOWN`,Numpad4:`LEFT`,Numpad6:`RIGHT`,Numpad5:`START`,Numpad1:`A`,Numpad3:`B`,Numpad7:`X`,Numpad9:`Y`},ts={ArrowUp:`UP`,ArrowDown:`DOWN`,ArrowLeft:`LEFT`,ArrowRight:`RIGHT`,KeyP:`START`,KeyZ:`A`,KeyX:`B`,KeyC:`X`,KeyV:`Y`};function ns(e){if(e.transport===`wifi`||e.transport!==`phone`&&(e.transport||typeof e.x!=`number`||typeof e.y!=`number`))return e;let t={UP:e.y<-.35,DOWN:e.y>.35,LEFT:e.x<-.35,RIGHT:e.x>.35,START:e.start===!0,A:e.a===!0,B:e.b===!0,X:e.buttonX===!0,Y:e.buttonY===!0||e.select===!0};return{...e,transport:`phone`,buttons:t}}function rs(){let e=Zo(),t=``,n=null,r=!1,i=Zo(),a=!1;return{cancel(){a=!0},read(o={},s={}){o&&typeof o==`object`||(o={});let c=Array.isArray(o.players)?o.players.filter(e=>e&&Number(e.id)>0).map(ns):[],l=c.filter(e=>e.connected===!0).sort((e,t)=>Number(e.id)-Number(t.id)),u=l.find(e=>e.transport===`wifi`)||l.find(e=>e.transport===`phone`),d=u?u.transport===`phone`?JSON.stringify([`phone`,u.id]):JSON.stringify([u.id,u.controllerId,u.session]):``,f=u?.cancelSeq??null,p=t!==d||!!t&&n!==f,m=a||p&&!!t,h=m||p&&r&&!!d,g=Zo(),_=o.inputActive!==!1&&u?.inputActive!==!1;for(let e of Xo)g[e]=!!s[e]||_&&u?.buttons?.[e]===!0;if(h)for(let e of Xo)i[e]=g[e];let v=Zo(),y=Zo(),b=Zo();for(let t of Xo)g[t]||(i[t]=!1),v[t]=!h&&g[t]&&!i[t],y[t]=v[t]&&!e[t],b[t]=!m&&!h&&!v[t]&&e[t];return e=v,t=d,n=f,a=!1,u&&(r=!0),{buttons:v,pressed:y,released:b,connected:!!u,transport:u?.transport||null,cancelled:m,players:Qo(c),source:t}}}}function is(e,t){let n=e.createElement(`style`);n.textContent=`
    #puretv-controller-panel{position:fixed;z-index:30;box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;color:#eef6ff;background:rgba(12,22,36,.94);border:1px solid rgba(153,192,225,.35);border-radius:12px;padding:10px;font:13px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;box-shadow:0 8px 28px #0004}
    #puretv-controller-panel[hidden]{display:none!important}
    #puretv-controller-panel strong{font-weight:650}
    #puretv-controller-panel .ptv-host-title{display:block;font-size:13px;color:#a8ddff;margin-bottom:5px}
    #puretv-controller-panel .ptv-host-info{white-space:pre-line;margin:6px 0 0;color:#c4d5e7;font-size:12px}
    #puretv-controller-panel .ptv-phone{margin:4px 0}
    #puretv-controller-panel .ptv-phone img{display:block;width:min(108px,20vh);height:auto;background:white;image-rendering:pixelated}
    #puretv-controller-panel .ptv-phone small{display:block;color:#c4d5e7}
    #puretv-controller-panel .ptv-phone [hidden],#puretv-controller-panel .ptv-phone[hidden]{display:none}
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none;pointer-events:none}
    #puretv-controller-panel[data-playing=true] .ptv-client-card{padding:3px 6px;align-items:center}
    #puretv-controller-panel[data-playing=true] .ptv-client-icon{width:17px;height:17px;flex-basis:17px;margin-right:5px}
    #puretv-controller-panel[data-playing=true] .ptv-client-heading,#puretv-controller-panel[data-playing=true] .ptv-client-id{line-height:1.2;margin-top:0}
    #puretv-controller-panel .ptv-status{display:inline-block;border-radius:4px;padding:2px 5px;background:#0c192bee;color:#eef6ff;font:11px/1.25 system-ui,sans-serif}
    #puretv-controller-panel .ptv-status[hidden]{display:none}
    #puretv-controller-panel[data-playing=true] .ptv-host-title,#puretv-controller-panel[data-playing=true] .ptv-host-info{display:none}
    #puretv-controller-panel .ptv-client-card{background:rgba(12,25,43,.94)}
    #puretv-controller-panel .ptv-client-id{font-size:11px}
    #puretv-controller-panel .ptv-client-heading{font-size:12px}
  `,e.head.appendChild(n);let r=e.createElement(`aside`);r.id=`puretv-controller-panel`,r.setAttribute(`aria-label`,`pureTV 手柄连接`),r.style[t.side===`left`?`left`:`right`]=`12px`,r.style.top=t.top||`12px`,r.style.width=`${Math.max(150,Math.min(300,Number(t.width)||198))}px`;let i=e.createElement(`strong`);i.className=`ptv-host-title`,i.textContent=`pureTV 手柄`;let a=e.createElement(`div`);a.id=`puretv-controller-clients`,a.hidden=!0;let o=e.createElement(`p`);o.className=`ptv-host-info`;let s=e.createElement(`div`);s.className=`ptv-phone`,s.hidden=!0;let c=e.createElement(`img`);c.alt=`手机手柄房间二维码`,c.hidden=!0;let l=e.createElement(`small`);s.append(c,l);let u=e.createElement(`span`);return u.className=`ptv-status`,u.hidden=!0,r.append(i,a,s,u,o),e.body.appendChild(r),{element:r,clients:a,info:o,phone:s,qr:c,join:l,status:u,style:n}}function as(e={}){let t=window,n=t.document,r=is(n,e),i=rs(),a=new Map,o=Zo(),s={},c=-1/0,l=!1,u={buttons:Zo(),pressed:Zo(),released:Zo(),connected:!1,cancelled:!1,players:[],source:``,pollCount:0,info:{}},d=t.PureGame;function f(e){e&&typeof e==`object`&&(s=Qo(e))}function p(){a.clear(),o=Zo(),i.cancel(),e.onSuspend?.()}function m(e,t,n){n?(a.has(e)||(o[t]=!0),a.set(e,t)):a.delete(e)}function h(t){let n=es[t.code]||e.keyboard===!0&&ts[t.code];if(!n||!t.isTrusted)return;let r=`dom:`+t.code;if(t.type===`keyup`){if(!a.has(r))return}else if(t.isComposing||t.altKey||t.ctrlKey||t.metaKey||t.target?.closest?.(`input, textarea, select, [contenteditable]:not([contenteditable=false])`))return;t.preventDefault(),t.stopImmediatePropagation(),t.repeat||m(r,n,t.type===`keydown`)}let g={key(e,t){let n=$o[e];n&&m(`native:`+e,n,t)},focus(e){e||p()},suspend(e){e&&p()},resume(){},roomInfo:f,networkChanged(e){f(e),p()}};t.PureGame=g;let _=()=>{n.hidden&&p()};t.addEventListener(`keydown`,h,!0),t.addEventListener(`keyup`,h,!0),t.addEventListener(`blur`,p),n.addEventListener(`visibilitychange`,_);function v(){t.PureTVControllerAdapter.renderClients(r.clients,u.players,{language:`zh`});let e=String(l);r.element.dataset.playing!==e&&(r.element.dataset.playing=e,n.body.dataset.puretvPlaying=e);let i=u.players.find(e=>e.connected&&e.transport===`phone`);r.status.hidden=!l||u.transport===`wifi`;let a=u.transport===`phone`?`${i.id}P 手机手柄已连接`:`手柄未连接`;r.status.textContent!==a&&(r.status.textContent=a);let o=typeof s.url==`string`&&/^https?:\/\//.test(s.url)?s.url:``;r.phone.hidden=l||u.connected||!o;let c=String(!r.phone.hidden);if(n.body.dataset.puretvJoining!==c&&(n.body.dataset.puretvJoining=c),!r.phone.hidden){let e=typeof s.qr==`string`&&s.qr.startsWith(`data:image/png;base64,`)?s.qr:``;r.qr.hidden=!e,e&&r.qr.getAttribute(`src`)!==e&&(r.qr.src=e);let t=e?`同一 Wi-Fi 下用手机扫码`:`手机打开 `+o;r.join.textContent!==t&&(r.join.textContent=t)}let d=s.wifiController||{},f=(Array.isArray(d.addresses)?d.addresses:Array.isArray(s.addresses)?s.addresses:[]).filter(e=>typeof e==`string`).join(` / `),p=typeof d.serviceName==`string`?d.serviceName:``,m=Number.isInteger(d.port)&&d.port>0?d.port:63485,h=u.players.filter(e=>e.connected===!0&&e.transport===u.transport).map(e=>Number(e.id)).sort((e,t)=>e-t)[0],g=u.connected?`单人游戏 · ${h}P ${u.transport===`phone`?`手机手柄`:`无线手柄`}操作`:`无线手柄按 GPIO 23 搜索连接`;t.PureGameHost||(g=`浏览器预览 · 键鼠可玩
Wi-Fi 手柄需启动安装版`),s.url||(g+=`
小键盘 8/2/4/6 方向 · 5 START · 1/3/7/9 A/B/X/Y`),p&&(g+=`
`+p),f&&(g+=`
`+f),t.PureGameHost&&(g+=`
TCP `+m),typeof d.error==`string`&&d.error&&(g+=`
`+d.error),(d.state===`failed`||d.state===`unavailable`)&&(g+=`
手柄服务暂不可用`),r.info.textContent!==g&&(r.info.textContent=g)}return{poll(){let n={players:[]},r=t.performance.now();try{t.PureGameHost?.getInfo&&r-c>=1e3&&(f(JSON.parse(t.PureGameHost.getInfo())),c=r),t.PureGameHost?.snapshot&&(n=JSON.parse(t.PureGameHost.snapshot()))}catch{n={players:[]}}let l=o;for(let e of a.values())l[e]=!0;return o=Zo(),u={...i.read(n,l),info:Qo(s),pollCount:u.pollCount+1,native:!!t.PureGameHost,inputAvailable:!!t.PureGameHost},v(),u.cancelled&&e.onCancel?.(),Qo(u)},peek(){return Qo(u)},setPlaying(e){l!==!!e&&(l=!!e,v())},cancel:p,destroy(){t.removeEventListener(`keydown`,h,!0),t.removeEventListener(`keyup`,h,!0),t.removeEventListener(`blur`,p),n.removeEventListener(`visibilitychange`,_),t.PureGame===g&&(t.PureGame=d,delete n.body.dataset.puretvPlaying,delete n.body.dataset.puretvJoining),r.element.remove(),r.style.remove()}}}function os({sim:e,menuOpen:t,setPaused:n,renderer:r}){let i=r.domElement,a=r.getContext(),o=a.getParameter(a.VERSION),s=document.getElementById(`onboardingModal`),c=document.getElementById(`resultsCard`),l=document.getElementById(`btnStartFlight`),u=as({side:`right`,width:180,onCancel:m,onSuspend:m}),d=0,f=0,p={};function m(){p={},t()||n(!0)}function h(){return t()?`menu`:c.classList.contains(`hidden`)?e.paused?`paused`:`playing`:`ended`}function g(e,t,n){if(t.START){n.click();return}let r=[...e.querySelectorAll(`button, select, input, summary`)].filter(e=>!e.disabled&&e.getClientRects().length),i=r.indexOf(document.activeElement);if(t.A){(r[i]||n).click();return}if(t.B&&e===s&&window.PureGameHost?.exit){window.PureGameHost.exit();return}let a=t.DOWN||t.RIGHT?1:t.UP||t.LEFT?-1:0;if(!a||!r.length)return;let o=r[i];o instanceof HTMLSelectElement&&(t.RIGHT||t.LEFT)?(o.selectedIndex=(o.selectedIndex+a+o.options.length)%o.options.length,o.dispatchEvent(new Event(`change`,{bubbles:!0}))):r[(i+a+r.length)%r.length].focus()}let _=()=>({game:`openaero-dfw`,ready:d>0,stage:h(),paused:e.paused,frames:d,renderer:a.isContextLost()?null:`webgl2`,webglVersion:o,canvasWidth:i.width,canvasHeight:i.height,controller:u.peek(),gameplay:{altitudeFt:e.mslFt,airspeedKt:e.iasKts,throttle:e.throttle,pitchInput:e.pitchIn,rollInput:e.rollIn,brakesOn:e.brakesOn,gearDown:e.gearDown,flapsIndex:e.flapsIndex,mission:e.missionKey}});return window.JoystickGameQA=Object.freeze({snapshot:_}),{get buttons(){return p},update(t){d++;let r=u.poll(),i=h();if(p=i===`playing`&&!r.cancelled?r.buttons:{},r.cancelled||(i===`menu`?g(s,r.pressed,l):i===`ended`?g(c,r.pressed,document.getElementById(`btnFlyAgain`)):r.pressed.START?n(!e.paused):i===`playing`&&(r.buttons.A&&r.buttons.B&&(r.pressed.A||r.pressed.B)&&document.getElementById(`btnBrakes`).click(),r.pressed.X&&document.getElementById(`btnFlaps`).click(),r.pressed.Y&&document.getElementById(`btnGear`).click())),u.setPlaying(h()===`playing`),window.PureGameHost?.publish&&t>=f){let e=_();delete e.controller.info,window.PureGameHost.publish(JSON.stringify(e)),f=t+180}}}}var ss={b738:{name:`波音 737-800 NG`,massKg:65e3,wingAreaM2:124.6,wingSpanM:35.8,aspectRatio:10.2,oswaldEfficiency:.82,cd0:.021,cl0:.28,clAlpha:5.2,clMaxFlaps:2.65,flapDetentsDeg:[0,5,10,30,40],landingFlapsIndex:3,controlThrowsDeg:{aileronUp:20,aileronDown:15,elevatorUp:20,elevatorDown:15,rudder:26},flapCl:[0,.1,.38,.559,.856],alphaStallDegByFlap:[14.8,16,14.8,14.12,14.12],flapCd:[0,.009,.015,.077,.1],groundSpoilers:{liftDump:.8,dCd:.08},systems:{hydraulics:{psi:3e3},gear:{extendS:10,retractS:7},flaps:{degPerS:1.5,loadRelief:{fromIndex:4,toIndex:3,aboveKts:162}},brakes:{tauS:.3,muMax:.55,tirePsi:205,antiSkid:.8},autobrake:{decelFtS2:[0,4,5,7.2,14]},reverser:{deployS:2,effectiveness:.35}},pitchAuthority:.5,rollAuthority:1,maxGroundPitchDeg:11,kidFlarePerS:.315,alphaStallDeg:14.8,maxThrustN:24e4,engine:{type:`turbofan`,staticThrustN:24e4,idleFraction:.04,machLapse:[.9,.6],densityExp:.94,spoolTau:1.2,climb:{refThrustN:53e3,refFt:35e3,refMach:.8}},transonic:{kappaA:.95,tOverC:.1289,sweepDeg:25},vneKts:340,vfeKtsByFlapDeg:[[5,250],[10,210],[15,200],[25,190],[30,175],[40,162]],vrefKts:150,vrefKtsByFlap:[null,null,null,150,141],vrKts:145,vrKtsByFlap:[null,145,135],gearVrKts:135,twoCrew:!0,stallCleanKts:114,gearHeight:3.4,gear:{noseZ:14.13,mainZ:1.47,trackM:5.72,strokeM:.15,zeta:.6,steerDeg:7},inertia:{roll:76e4,pitch:176e4,yaw:239e4},eyeOffset:new z(0,4.2,-12.8),chaseDist:48,chaseHeight:12.5,pitchDamping:2.4,elevatorAlphaDeg:108/Math.PI,rollDamping:3.2,yawDamping:1.8,cyBeta:-108.8/124.6,clBeta:-.09,clAileron:.1*.35},c172:{name:`塞斯纳 172S「天鹰」`,massKg:1150,wingAreaM2:16.2,wingSpanM:11,aspectRatio:7.45,oswaldEfficiency:.78,cd0:.018,fixedGear:!0,cl0:.35,clAlpha:4.8,clMaxFlaps:1.95,flapDetentsDeg:[0,10,20,30],controlThrowsDeg:{aileronUp:20,aileronDown:15,elevatorUp:28,elevatorDown:23,rudder:16.2},flapCl:[0,.19,.3,.4],alphaStallDegByFlap:[14.1,14.1,13.7,13.3],flapCd:[0,.004,.022,.04],systems:{flaps:{degPerS:3},brakes:{tauS:.3,muMax:.39,tirePsi:38,antiSkid:.37}},alphaStallDeg:14.1,maxThrustN:2100,engine:{type:`piston-prop`,thrustTableN:[[0,2070],[20,2100],[38,2105],[50,1960],[65,1680],[80,1250],[124,0]],windmillCd:.0188,spoolTau:.3},vneKts:163,vfeKtsByFlapDeg:[[10,110],[30,85]],vrefKts:62,vrKts:55,vyKts:74,stallCleanKts:48,vGlideKts:68,gearHeight:1.65,gear:{noseZ:1.214,mainZ:.437,trackM:2.54,strokeM:.08,zeta:.6,steerDeg:10,tail:[3.297,.884]},inertia:{roll:1285,pitch:1825,yaw:2667},eyeOffset:new z(0,1.85,-1.3),chaseDist:18,chaseHeight:4.5,pitchAuthority:7.2,pitchDamping:3.8,cmAlphaDot:-5.2,kidFlarePerS:.18,elevatorAlphaDeg:1.28/.89*25.5,clElevator:.43,elevatorPerAlpha:.89/1.28,rollDamping:4.2,yawDamping:2.5,cyBeta:-.31,cyRudder:.187,clBeta:-.089,clAileron:.178*17.5*Math.PI/180,rollPerTas:.02103,prop:{torqueArmM:.229}},f16:{name:`F-16C「战隼」`,massKg:12e3,wingAreaM2:27.87,wingSpanM:10,aspectRatio:3.2,oswaldEfficiency:.72,cd0:.018,cl0:.15,clAlpha:3.6,clMaxFlaps:1.8,controlThrowsDeg:{aileronUp:21.5,aileronDown:21.5,elevatorUp:25,elevatorDown:25,rudder:30},flaperons:!0,clByAlphaDeg:[[20,.15+72*Math.PI/180],[25,1.558],[30,1.816],[35,1.894]],alphaStallDeg:25,maxThrustN:13e4,engine:{type:`turbofan`,staticThrustN:13e4,idleFraction:.04,machLapse:[.3,.3],densityExp:.8,spoolTau:.8},vrefKts:148,vrKts:155,gearHeight:2.2,gear:{noseZ:3.48,mainZ:.52,trackM:2.36,strokeM:.12,zeta:.6,steerDeg:10},inertia:{roll:12875,pitch:75674,yaw:85551},eyeOffset:new z(0,2.3,-2.5),chaseDist:24,chaseHeight:5.5,pitchDamping:1.8,pitchFbw:!0,rollDamping:5.2,rollPerTas:.02798,rollCmdRad:5.376,yawDamping:2.2,cyBeta:-1.146}};function cs(e,t,n){let r=e.length,i=[],a=e.reduce((t,[n,i],a)=>t+n*e[(a+1)%r][1]-e[(a+1)%r][0]*i,0)>0?e:[...e].reverse(),s=(e,t)=>i.push(a[e%r][0],a[e%r][1],t);for(let e=1;e<r-1;e++)s(0,n),s(e,n),s(e+1,n),s(0,t),s(e+1,t),s(e,t);for(let e=0;e<r;e++)s(e,t),s(e+1,t),s(e+1,n),s(e,t),s(e+1,n),s(e,n);let c=new dn;return c.setAttribute(`position`,new o(i,3)),c.computeVertexNormals(),c}var ls=2.7,us=e=>((e-ls)%360+360)%360,ds=e=>String(Math.round(us(e))%360||360).padStart(3,`0`);function fs(e,t,n){return{x:Math.floor((t+180)/360*2**n),y:Math.floor((1-Math.log(Math.tan(e*Math.PI/180)+1/Math.cos(e*Math.PI/180))/Math.PI)/2*2**n)}}function ps(e,t,n){let r=Math.PI-2*Math.PI*t/2**n,i=e/2**n*360-180;return{lat:180/Math.PI*Math.atan(.5*(Math.exp(r)-Math.exp(-r))),lon:i}}function ms(e,t){let n=6378137,r=(e-ht)*B;return{x:(t-_t)*B*Math.cos(ht*B)*n,z:-r*n}}var hs=`https://server.arcgisonline.com`;function gs(e,t,n){return`${hs}/ArcGIS/rest/services/World_Imagery/MapServer/tile/${e}/${n}/${t}`}function _s(e,t,n){let r=ps(e,t,n),i=ps(e+1,t+1,n),a=ms(r.lat,r.lon),o=ms(i.lat,i.lon);return{widthM:Math.abs(o.x-a.x),lengthM:Math.abs(o.z-a.z),posX:(a.x+o.x)/2,posZ:(a.z+o.z)/2}}var vs=`https://en.wikipedia.org/wiki/`,ys={bankOfAmericaPlaza:{name:`Bank of America Plaza`,lat:32.7799,lon:-96.8038,heightM:279,source:`${vs}Bank_of_America_Plaza_(Dallas)`},reunionTower:{name:`Reunion Tower`,lat:32.7753,lon:-96.8089,heightM:171,source:`${vs}Reunion_Tower`},renaissanceTower:{name:`Renaissance Tower`,lat:32.7812,lon:-96.802,heightM:220,source:`${vs}Renaissance_Tower_(Dallas)`},comericaBankTower:{name:`Comerica Bank Tower`,lat:32.78157,lon:-96.7966,heightM:240,source:`${vs}Comerica_Bank_Tower`},jpmorganChaseTower:{name:`JPMorgan Chase Tower`,lat:32.7878,lon:-96.7966,heightM:225,source:`${vs}JPMorgan_Chase_Tower_(Dallas)`},margaretHuntHillBridge:{name:`Margaret Hunt Hill Bridge`,lat:32.78,lon:-96.8221,heightM:122,spanBearingDeg:60,source:`${vs}Margaret_Hunt_Hill_Bridge`},attStadium:{name:`AT&T Stadium`,lat:32.74778,lon:-97.09278,heightM:91,source:`${vs}AT%26T_Stadium`}};function bs(e){let t=ys[e];return ms(t.lat,t.lon)}var xs=bs(`bankOfAmericaPlaza`),Ss=bs(`attStadium`);function Cs(e,t=ft){return .5*t*e*e}function ws(e,t,n){let r=Math.floor(t),i=t-r,a=e[r]??n;return i>0?a+((e[r+1]??n)-a)*i:a}var Ts=(e,t)=>e.flapCl?ws(e.flapCl,t,0):t*(e.flapClPerNotch??.28),Es=(e,t)=>e.alphaStallDegByFlap?ws(e.alphaStallDegByFlap,t,e.alphaStallDeg):e.alphaStallDeg;function Ds(e,t,n){let r=e.cl0+e.clAlpha*t+Ts(e,n),i=Es(e,n)*B,a=e.clByAlphaDeg;if(a&&t>0){let o=t/B,s=a[a.length-1];if(o>a[0][0]){let t=1;for(;t<a.length-1&&o>a[t][0];)t++;let i=a[t-1],s=a[t];r=i[1]+(s[1]-i[1])*(o-i[0])/(s[0]-i[0])+Ts(e,n)}i=Math.max(i,s[0]*B)}if(Math.abs(t)>i){let e=Math.abs(t)-i;r*=Math.exp(-e*4)}return r}function Os(e,t){let n=Ds(e,Es(e,t)*B,t);return Math.sqrt(2*e.massKg*9.80665/(ft*e.wingAreaM2*n))/.514444}var ks=(e,t)=>e.vrefKtsByFlap?.[t]??e.vrefKts,As=(e,t)=>e.vrKtsByFlap?.[t]??e.vrKts,js=e=>e.landingFlapsIndex??2,Ms=(e,t)=>Os(e,t)+5;function Ns(e,t){let n=e.vneKts??null,r=e.vfeKtsByFlapDeg;if(n===null||!r||t<=.5)return n;for(let[e,i]of r)if(t<=e+.5)return Math.min(n,i);return Math.min(n,r[r.length-1][1])}var Ps=(e,t,n)=>n!==null&&t>(e?n-3:n);function Fs(e,t){let n=16*Math.max(1,e)/t;return Math.min(1,(n/(1+n))**2)}function Is(e){return 1/(Math.PI*e.aspectRatio*e.oswaldEfficiency)}var Ls=.018,Rs=.006;function zs(e,t,n,r,i,a=0){let o=e.flapCd?ws(e.flapCd,r,0):r*.012,s=e.fixedGear?1:Number(n),c=Ls*s+(s>0&&s<1?Rs:0);return e.cd0+c+o+Is(e)*t*t*i+Us(e,t,a)}var Bs=Math.cbrt(.1/80),Vs=20*Bs**4;function Hs(e,t){let n=e.transonic,r=Math.cos(n.sweepDeg*B);return n.kappaA/r-n.tOverC/(r*r)-Math.abs(t)/(10*r*r*r)}function Us(e,t,n){if(!e.transonic||!(n>.5))return 0;let r=Hs(e,t),i=n-(r-Bs);return i<=0?0:i<Bs?20*i*i*i*i:e.supersonicCd?e.supersonicCd(r,n):Vs+.1*(i-Bs)}function Ws(e,t){let n=e-t;return n>180&&(n-=360),n<-180&&(n+=360),n}var Gs=[-30/60,-10/60,10/60,30/60];function Ks(e,t=3){let n=0;for(let r=0;r<4;r++)e>t+Gs[r]&&n++;return n}var qs=[1e3,500,400,300,200,100,50,40,30,20,10],Js=[`one thousand`,`five hundred`,`four hundred`,`three hundred`,`two hundred`,`one hundred`,`fifty`,`forty`,`thirty`,`twenty`,`ten`],Ys=e=>Js[e];function Xs(e,t){for(let n=qs.length-1;n>=0;n--){let r=qs[n];if(e<=r)return e>r-35&&n>t?n:-1}return-1}var Zs=(e,t)=>t>=0&&e>qs[t]+100?-1:t,Qs=[`eighty knots`,`V1`,`rotate`,`positive rate`],$s=[`80 节`,`V1`,`抬轮`,`正爬升率`],ec=[`80 节 · 速度正常`,`V1 · 继续起飞`,`抬轮 · 抬起机头`,`正爬升率 · 正在爬升`];function tc(e,t,n,r,i,a){let o=i+1;return!a&&o<2&&(o=2),o===0?e>=80?0:-1:o===1?e>=r-3?1:-1:o===2?e>=r?2:-1:o===3&&n>5&&t>300?3:-1}function nc(e,t,n){return e<t&&!n}function rc(e,t,n){return e<450&&t<-1400&&!n}function ic(e,t,n,r){return!n&&!r&&e<500&&t<0}var ac=1e3,oc=1.25,sc=.35;function cc(e){return typeof e.ceilingFt==`number`&&e.ceilingFt<1e3||(e.visibilitySm??10)<3}function lc(e,t,n){return Math.atan2(e,Math.max(1,t))*180/Math.PI/n}var uc={SLOW:`过慢`,FAST:`过快`,SINK:`下降率`,GEAR:`起落架`,FLAPS:`襟翼`,GLIDESLOPE:`下滑道`,LOCALIZER:`航向道`};function dc(e){let t=[];return e.iasKt<e.vref?t.push(`SLOW`):e.iasKt>e.vref+20+(e.gustAddKts??0)&&t.push(`FAST`),-e.vsFpm>1e3&&t.push(`SINK`),e.gearDown||t.push(`GEAR`),e.flapsOk||t.push(`FLAPS`),Math.abs(e.glideDevDots)>1&&t.push(`GLIDESLOPE`),Math.abs(e.locDevDots)>1&&t.push(`LOCALIZER`),{gateHeight:e.vmc?500:ac,stable:t.length===0,failing:t}}function fc(e,t,n){return e==null?t:n>0?e+(t-e)*(1-Math.exp(-n/2)):e}function pc(e,t,n,r,i){if(t>(e.done?n+100:n)){let t=e.done;return e.armed=!0,e.armFt=n,e.done=!1,t?`reset`:``}return!e.armed||t>e.armFt||!r||(e.armed=!1,!i)?``:(e.done=!0,`evaluate`)}var mc=.3048,hc={KDFW:`达拉斯／沃思堡国际机场`,KDAL:`达拉斯爱田机场`,KADS:`艾迪生机场`,KAFW:`沃思堡联盟机场`,KFTW:`沃思堡米查姆机场`,KGKY:`阿灵顿市立机场`},gc=[{airport:`KDFW`,lengthFt:9e3,widthFt:200,le:{ident:`13L`,lat:32.912601,lon:-97.0215,elevFt:550,hdgT:135.3,displacedFt:625},he:{ident:`31R`,lat:32.895,lon:-97.000801,elevFt:508,hdgT:315.3,displacedFt:0}},{airport:`KDFW`,lengthFt:9300,widthFt:150,le:{ident:`13R`,lat:32.909599,lon:-97.083099,elevFt:591,hdgT:139,displacedFt:0},he:{ident:`31L`,lat:32.890301,lon:-97.063301,elevFt:577,hdgT:319,displacedFt:0}},{airport:`KDFW`,lengthFt:13400,widthFt:150,le:{ident:`17C`,lat:32.915699,lon:-97.026001,elevFt:562,hdgT:180.3,displacedFt:0},he:{ident:`35C`,lat:32.878899,lon:-97.026199,elevFt:562,hdgT:.3,displacedFt:0}},{airport:`KDFW`,lengthFt:8500,widthFt:150,le:{ident:`17L`,lat:32.8983,lon:-97.009804,elevFt:524,hdgT:180.3,displacedFt:0},he:{ident:`35R`,lat:32.875,lon:-97.009903,elevFt:575,hdgT:.3,displacedFt:0}},{airport:`KDFW`,lengthFt:13400,widthFt:200,le:{ident:`17R`,lat:32.915699,lon:-97.0299,elevFt:567,hdgT:180.3,displacedFt:0},he:{ident:`35L`,lat:32.878899,lon:-97.030098,elevFt:563,hdgT:.3,displacedFt:0}},{airport:`KDFW`,lengthFt:13401,widthFt:200,le:{ident:`18L`,lat:32.915798,lon:-97.050697,elevFt:602,hdgT:180.2,displacedFt:0},he:{ident:`36R`,lat:32.879002,lon:-97.050903,elevFt:575,hdgT:.2,displacedFt:0}},{airport:`KDFW`,lengthFt:13400,widthFt:150,le:{ident:`18R`,lat:32.915798,lon:-97.054604,elevFt:607,hdgT:180.3,displacedFt:0},he:{ident:`36L`,lat:32.879002,lon:-97.054802,elevFt:582,hdgT:.3,displacedFt:0}},{airport:`KDAL`,lengthFt:7752,widthFt:150,le:{ident:`13L`,lat:32.8573,lon:-96.856796,elevFt:477,hdgT:135.6,displacedFt:0},he:{ident:`31R`,lat:32.841999,lon:-96.839104,elevFt:487,hdgT:315.6,displacedFt:0}},{airport:`KDAL`,lengthFt:8800,widthFt:150,le:{ident:`13R`,lat:32.851299,lon:-96.863503,elevFt:476,hdgT:135.6,displacedFt:490},he:{ident:`31L`,lat:32.834,lon:-96.843399,elevFt:476,hdgT:315.6,displacedFt:0}},{airport:`KADS`,lengthFt:7203,widthFt:100,le:{ident:`16`,lat:32.977798,lon:-96.8405,elevFt:633,hdgT:160,displacedFt:979},he:{ident:`34`,lat:32.959301,lon:-96.832397,elevFt:639,hdgT:340,displacedFt:0}},{airport:`KAFW`,lengthFt:11e3,widthFt:150,src:`FAA ends`,le:{ident:`16L`,lat:33.005428,lon:-97.321526,elevFt:723,hdgT:170.3,displacedFt:0},he:{ident:`34R`,lat:32.975637,lon:-97.315429,elevFt:664,hdgT:350.3,displacedFt:0}},{airport:`KAFW`,lengthFt:11125,widthFt:150,src:`FAA ends`,le:{ident:`16R`,lat:33.005148,lon:-97.323455,elevFt:721,hdgT:170.3,displacedFt:0},he:{ident:`34L`,lat:32.975019,lon:-97.317288,elevFt:665,hdgT:350.3,displacedFt:716}},{airport:`KFTW`,lengthFt:7502,widthFt:150,le:{ident:`16`,lat:32.8302,lon:-97.362503,elevFt:710,hdgT:171.9,displacedFt:0},he:{ident:`34`,lat:32.809799,lon:-97.359001,elevFt:674,hdgT:351.9,displacedFt:0}},{airport:`KFTW`,lengthFt:4005,widthFt:75,le:{ident:`17`,lat:32.824799,lon:-97.366501,elevFt:668,hdgT:171.9,displacedFt:0},he:{ident:`35`,lat:32.8139,lon:-97.3647,elevFt:667,hdgT:351.9,displacedFt:0}},{airport:`KGKY`,lengthFt:6080,widthFt:100,le:{ident:`16`,lat:32.672001,lon:-97.096298,elevFt:628,hdgT:168,displacedFt:0},he:{ident:`34`,lat:32.655701,lon:-97.092201,elevFt:597,hdgT:348,displacedFt:0}}];function _c(e){let t=e*B;return{x:Math.sin(t),z:-Math.cos(t)}}function vc(e,t,n){let r=ms(t.lat,t.lon),i=_c(t.hdgT),a=t.displacedFt*mc,o=a/(e.lengthFt*mc),s=t.elevFt+(n.elevFt-t.elevFt)*o,c=Vo(s);return{id:`${e.airport}_${t.ident}`,airport:e.airport,ident:t.ident,name:`${e.airport} ${t.ident}`,hdgT:t.hdgT,elevFt:t.elevFt,thrElevFt:s,lengthFt:e.lengthFt,widthFt:e.widthFt,widthM:e.widthFt*mc,lengthM:e.lengthFt*mc,endX:r.x,endZ:r.z,thrX:r.x+i.x*a,thrZ:r.z+i.z*a,displacedM:a,thrY:c,src:e.src||`OurAirports`}}var yc=gc.flatMap(e=>[vc(e,e.le,e.he),vc(e,e.he,e.le)]),bc=gc.map(e=>{let t=ms(e.le.lat,e.le.lon),n=ms(e.he.lat,e.he.lon);return{name:`${e.airport} ${e.le.ident}/${e.he.ident}`,airport:e.airport,cx:(t.x+n.x)/2,cz:(t.z+n.z)/2,lengthM:Math.hypot(n.x-t.x,n.z-t.z),widthM:e.widthFt*mc,hdgT:e.le.hdgT,ends:[`${e.airport}_${e.le.ident}`,`${e.airport}_${e.he.ident}`],ax:t.x,az:t.z,ay:Vo(e.le.elevFt),bx:n.x,bz:n.z,by:Vo(e.he.elevFt)}}),xc=e=>Math.round(e).toLocaleString(`en-US`);function Sc(e){return e?`${e.ident} 跑道：长 ${xc(e.lengthFt)} 英尺，宽 ${xc(e.widthFt)} 英尺 · 磁航向 ${ds(e.hdgT)}° · 入口标高 ${xc(e.thrElevFt)} 英尺`:``}function Cc(e,t){return yc.find(n=>n.airport===e&&n.ident===t)||null}function wc(e){return yc.find(t=>t.id===e)||null}function Tc(e,t){let n=_c(e.hdgT),r=t.x-e.thrX,i=t.z-e.thrZ,a=r*n.x+i*n.z,o=r*-n.z+i*n.x,s=-a,c=(s+305)*Math.tan(3*B);return{distM:s,crossM:o,heightAbovePathM:t.y-(e.thrY??0)-c,pathHeightM:c}}function Ec(e,t,n){return n<=-305?null:Ks(Math.atan2(t.y-(e.thrY??0),Math.max(10,n+305))/B,3)}function Dc(e,t,n,r){let i=null,a=1/0;for(let r of e){let e=Tc(r,t);if(e.distM<-200||e.distM>3e4||Math.abs(((n-r.hdgT)%360+540)%360-180)>35||Math.abs(e.crossM)>Math.max(300,Math.max(e.distM,0)*Math.tan(15*B)))continue;let o=Math.max(e.distM,0)+10*Math.abs(e.crossM);o<a&&(a=o,i=r)}return i||r}function Oc(e,t,n=72,r=0){let i=_c(e.hdgT),a=t*mt,o=(a+305)*Math.tan(3*B),s=3*B;return{pos:{x:e.thrX-i.x*a,y:e.thrY+o+r,z:e.thrZ-i.z*a},vel:{x:i.x*n*Math.cos(s),y:-n*Math.sin(s),z:i.z*n*Math.cos(s)},yawRad:-e.hdgT*B}}function kc(e,t=60){let n=_c(e.hdgT);return{pos:{x:e.thrX+n.x*t,z:e.thrZ+n.z*t},yawRad:-e.hdgT*B}}var Ac=[`Now`,`Dawn`,`Noon`,`Dusk`,`Night`];function jc(e,t,n){let r=(e.getTime()/864e5+2440587.5-2451545)/36525,i=(280.46646+r*(36000.76983+r*3032e-7))%360,a=357.52911+r*(35999.05029-1537e-7*r),o=.016708634-r*(42037e-9+1.267e-7*r),s=a*B,c=Math.sin(s)*(1.914602-r*(.004817+14e-6*r))+Math.sin(2*s)*(.019993-101e-6*r)+Math.sin(3*s)*289e-6,l=(125.04-1934.136*r)*B,u=(i+c-.00569-.00478*Math.sin(l))*B,d=(23+(26+(21.448-r*(46.815+r*(59e-5-r*.001813)))/60)/60+.00256*Math.cos(l))*B,f=Math.asin(Math.sin(d)*Math.sin(u)),p=Math.tan(d/2)**2,m=i*B,h=4*V*(p*Math.sin(2*m)-2*o*Math.sin(s)+4*o*p*Math.sin(s)*Math.cos(2*m)-.5*p*p*Math.sin(4*m)-1.25*o*o*Math.sin(2*s)),g=(((e.getTime()/6e4%1440+1440)%1440+h+4*n)%1440+1440)%1440/4-180;g<-180&&(g+=360);let _=g*B,v=t*B,y=Math.min(1,Math.max(-1,Math.sin(v)*Math.sin(f)+Math.cos(v)*Math.cos(f)*Math.cos(_))),b=90-Math.acos(y)*V,x=(Math.atan2(Math.sin(_),Math.cos(_)*Math.sin(v)-Math.tan(f)*Math.cos(v))*V+540)%360;return{elevationDeg:b+Mc(b),azimuthDeg:x}}function Mc(e){if(e>85)return 0;let t=Math.tan(e*B),n;return n=e>5?58.1/t-.07/t**3+86e-6/t**5:e>-.575?1735+e*(-518.2+e*(103.4+e*(-12.79+e*.711))):-20.774/t,n/3600}function Nc({elevationDeg:e,azimuthDeg:t},n={x:0,y:0,z:0}){let r=e*B,i=t*B;return n.x=Math.cos(r)*Math.sin(i),n.y=Math.sin(r),n.z=-Math.cos(r)*Math.cos(i),n}var Pc=2.5;function Fc(e,t,n,r){if(e===`Now`||!Ac.includes(e))return{...jc(t,n,r),at:t.getTime()};let i=(12-r/15)*36e5,a=864e5,o=Math.round((t.getTime()-i)/a)*a+i,s=null,c=null,l=null,u=null,d=null;for(let e=o-a/2;e<=o+a/2;e+=3e5){let t=jc(new Date(e),n,r);t.at=e,(!s||t.elevationDeg>s.elevationDeg)&&(s=t),(!c||t.elevationDeg<c.elevationDeg)&&(c=t),d&&(!l&&d.elevationDeg<Pc&&t.elevationDeg>=Pc&&(l=t),d.elevationDeg>=Pc&&t.elevationDeg<Pc&&(u=d)),d=t}return e===`Noon`?s:e===`Night`?c:e===`Dawn`?l||s:u||s}var Ic=[{el:-18,sky:396058,zenith:132367,horizon:1777718,glow:1777718,ambient:8228804,ambientIntensity:.34,sun:0,sunIntensity:0},{el:-9,sky:1054778,zenith:396582,horizon:2829388,glow:4863312,ambient:8885960,ambientIntensity:.4,sun:0,sunIntensity:0},{el:-4,sky:2634854,zenith:1188431,horizon:5917290,glow:11556922,ambient:11839172,ambientIntensity:.5,sun:0,sunIntensity:0},{el:0,sky:14254159,zenith:2902662,horizon:14715482,glow:16747068,ambient:16701354,ambientIntensity:.55,sun:16753756,sunIntensity:0},{el:3,sky:14983280,zenith:3957928,horizon:15772280,glow:16752720,ambient:16701354,ambientIntensity:.62,sun:16758903,sunIntensity:.7},{el:8,sky:9091296,zenith:4027584,horizon:14206126,glow:16766624,ambient:16639688,ambientIntensity:.72,sun:16767392,sunIntensity:1},{el:25,sky:5810408,zenith:2779332,horizon:11849190,glow:16773852,ambient:14412542,ambientIntensity:.85,sun:16776171,sunIntensity:1.4},{el:60,sky:4890858,zenith:2055356,horizon:11192554,glow:16775404,ambient:14412542,ambientIntensity:.85,sun:16776171,sunIntensity:1.4}],Lc=[`sky`,`zenith`,`horizon`,`glow`,`ambient`,`sun`];function Rc(e,t,n){let r=0;for(let i=16;i>=0;i-=8){let a=e>>i&255,o=t>>i&255;r|=Math.round(a+(o-a)*n)<<i}return r}function zc(e){let t=Ic,n;if(e<=t[0].el)n={...t[0]};else if(e>=t[t.length-1].el)n={...t[t.length-1]};else{let r=1;for(;t[r].el<e;)r++;let i=t[r-1],a=t[r],o=(e-i.el)/(a.el-i.el);n={el:e,ambientIntensity:i.ambientIntensity+(a.ambientIntensity-i.ambientIntensity)*o,sunIntensity:i.sunIntensity+(a.sunIntensity-i.sunIntensity)*o};for(let e of Lc)n[e]=Rc(i[e],a[e],o)}return n.fog=n.horizon,n}var Bc=e=>e<-6?2:0,Vc=ms(32.967,-97.067),Hc=ms(32.97991,-96.79924),Uc=ms(32.97173,-96.82205),Wc=ms(32.94468,-96.75069),Gc=ms(32.97555,-96.82898),Kc=ms(33.115,-97.345),qc=[{key:`kdfw_35c_final`,label:`KDFW 35C 跑道：4 海里仪表进近`,blurb:`距跑道 4 海里，航向已对准 35C。跟随绿色速度矢量和四灯坡度指示器（PAPI）下降。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:4},{key:`kdfw_35c_flare`,label:`KDFW 35C：最后 1 海里拉平挑战`,blurb:`距跑道 1 海里，高度 300 英尺。把握拉平时机，让飞机轻柔接地。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:1},{key:`kdfw_takeoff`,label:`KDFW 35C：起飞滑跑`,blurb:`踩住刹车，设定起飞推力，再松刹车。听到 Vr 报速后抬轮。`,kind:`takeoff`,airport:`KDFW`,rwy:`35C`},{key:`go_around_drill`,label:`KDFW 35C：复飞训练`,blurb:`飞机起始速度和高度偏高。听到 500 英尺稳定进近检查提示时即可复飞，也可提前决定。加推力、爬升、收襟翼和起落架；若能重新建立稳定进近，也可继续着陆。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:4,fastKts:20,highDots:1,goAround:!0},{key:`kdfw_35c_rto`,label:`KDFW 35C：737 中断起飞`,blurb:`沿 35C 全推力滑跑，V1 前将出现发动机火警。收至慢车，使用刹车和反推，在跑道内停稳。`,kind:`takeoff`,airport:`KDFW`,rwy:`35C`,aircraft:`b738`,rto:!0},{key:`kdfw_35c_windshear`,label:`KDFW 35C：737 风切变脱离`,blurb:`短五边有微下击暴流。听到风切变警报时加至全推力，保持机头上仰 15°，避免低头追赶损失的空速。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:3,aircraft:`b738`,windshear:!0},{key:`kdfw_35c_low_ifr`,label:`KDFW 35C：低云仪表进近（5 海里）`,blurb:`云底 400 英尺，薄雾中能见度 2 英里。跟随 ILS 指引下降。到达 200 英尺决断高度后，看到跑道灯光可继续着陆，否则复飞。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:5,lowIfr:!0,group:`weather`},{key:`kdfw_35c_night`,label:`KDFW 35C：夜间仪表进近（4 海里）`,blurb:`循进近灯的顺序闪光和 PAPI，引导飞机降落在亮灯的跑道上。结束后恢复原先的时段设置。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:4,sun:`Night`},{key:`kdfw_35c_wake`,label:`KDFW 35C：塞斯纳尾流避让`,blurb:`一架 737 在前方进近，尾流会下沉。保持在它的航迹上方，观察它的接地点并在更远处着陆。入门模式自动辅助；任务按飞行轨迹评分，不施加尾流推力。固定正午光照，结束后恢复。`,kind:`final`,airport:`KDFW`,rwy:`35C`,distNm:5,aircraft:`c172`,wake:!0,sun:`Noon`},{key:`kdfw_17c_final`,label:`KDFW 17C：南向进近（4 海里）`,blurb:`从北侧进近中央跑道，体验达拉斯—沃思堡遇南风时的着陆方向。`,kind:`final`,airport:`KDFW`,rwy:`17C`,distNm:4},{key:`kdfw_36l_final`,label:`KDFW 36L：西侧进近（6 海里）`,blurb:`从南面飞入机场西侧，体验较长的 6 海里五边。`,kind:`final`,airport:`KDFW`,rwy:`36L`,distNm:6},{key:`kdfw_13r_final`,label:`KDFW 13R：斜向跑道进近（5 海里）`,blurb:`进近机场西侧的斜向跑道，体验偏离主跑道南北轴线的航向。`,kind:`final`,airport:`KDFW`,rwy:`13R`,distNm:5},{key:`kdal_31r_final`,label:`KDAL 达拉斯爱田机场：31R 进近`,blurb:`从东南方向飞越机场附近的达拉斯街区，进入爱田机场。`,kind:`final`,airport:`KDAL`,rwy:`31R`,distNm:4},{key:`kdal_31r_dusk`,label:`KDAL 爱田机场：黄昏 31R 进近`,blurb:`从东南方飞入，西边夕阳低垂。任务结束后恢复原先的时段设置。`,kind:`final`,airport:`KDAL`,rwy:`31R`,distNm:4,sun:`Dusk`},{key:`kdal_13l_final`,label:`KDAL 爱田机场：13L 进近`,blurb:`从西北侧进近，可在前方看到达拉斯市区天际线。`,kind:`final`,airport:`KDAL`,rwy:`13L`,distNm:5},{key:`kads_16_final`,label:`KADS 艾迪生 16：短跑道进近`,blurb:`从 3 海里外向艾迪生进近，跑道两侧是北达拉斯的办公楼群。`,kind:`final`,airport:`KADS`,rwy:`16`,distNm:3},{key:`deadstick_kads_16`,label:`KADS 艾迪生：塞斯纳无动力滑翔`,blurb:`距艾迪生 2 海里时发动机停止。保持 68 节滑翔，按教练提示转向跑道并着陆。`,kind:`drill`,airport:`KADS`,rwy:`16`,aircraft:`c172`,pos:[Hc.x,Hc.z],aglFt:3500,kias:75,hdg:340,deadStick:!0},{key:`pattern_kads_16`,label:`KADS 艾迪生：塞斯纳起落航线`,blurb:`在机场上方 1,000 英尺进入下风边，依次转入四边、五边并着陆。`,kind:`drill`,airport:`KADS`,rwy:`16`,aircraft:`c172`,pos:[Uc.x,Uc.z],aglFt:1e3,kias:85,hdg:340,pattern:!0},{key:`pattern_entry_kads`,label:`KADS 艾迪生：塞斯纳加入起落航线`,blurb:`从 4 海里外保持场高 1,000 英尺，以 45° 切入下风边，在跑道中部旁右转加入，随后着陆。加入时保持 70–100 节并平飞；跳过下风边最高只能得 C。`,kind:`drill`,airport:`KADS`,rwy:`16`,aircraft:`c172`,pos:[Wc.x,Wc.z],aglFt:1e3,kias:90,hdg:295,pattern:!0,entry:!0},{key:`pad_180_kads_16`,label:`KADS 艾迪生：180° 无动力定点着陆`,blurb:`发动机在 16 跑道下风边停车，此时距地 1,000 英尺，正侧方是白色标志块。以 68 节滑翔转弯，接地点应在标志块或其后 200 英尺内，不能提前接地。`,kind:`drill`,airport:`KADS`,rwy:`16`,aircraft:`c172`,pos:[Gc.x,Gc.z],aglFt:1e3,kias:85,hdg:340,deadStick:!0,power180:!0,group:`drills`},{key:`kads_16_short_field`,label:`KADS 艾迪生：塞斯纳短距着陆`,blurb:`3 海里外以 70 节、襟翼收起进近。放全襟翼后循 PAPI 保持 61 节；跑道入口收慢车，在 1,000 英尺白色标志块前接地，立即制动。滑跑距离将与手册值比较。`,kind:`final`,airport:`KADS`,rwy:`16`,distNm:3,aircraft:`c172`,kias:70,flaps:0,shortField:!0,group:`drills`},{key:`kads_16_no_flap`,label:`KADS 艾迪生：塞斯纳无襟翼着陆`,blurb:`襟翼卡在收起位。距跑道 4 海里时循 PAPI 保持 70 节（手册范围 65–75 节）。机头较高，拉平后的飘距较长，让飞机自然接地再刹车。成绩卡也显示襟翼 30° 的估算滑跑距离。`,kind:`final`,airport:`KADS`,rwy:`16`,distNm:4,aircraft:`c172`,kias:70,flaps:0,noFlap:!0,group:`drills`},{key:`kads_crosswind_wing_low`,label:`KADS 艾迪生：低翼侧风着陆`,blurb:`迎风翼稍低抑制侧移，用方向舵将机头对准 16 跑道。拉平时保持修正，让迎风侧主轮先接地。若当地风适合则使用实时侧风，否则使用右侧 12 节风；触屏可用油门旁的方向舵按钮。`,kind:`final`,airport:`KADS`,rwy:`16`,distNm:2,aircraft:`c172`,kias:70,flaps:1,wingLow:!0,group:`drills`},{key:`kads_16_short_field_takeoff`,label:`KADS 艾迪生：塞斯纳短距起飞`,blurb:`襟翼 10°，踩住刹车加全推力后松开。45 节轻拉，保持微抬前轮，约 51 节离地。爬升至 50 英尺前保持 56 节越障，再加速到 74 节。按当天条件对照手册距离评分。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:1,fullLength:!0,shortTakeoff:!0,group:`drills`},{key:`kads_16_hot_takeoff`,label:`KADS 艾迪生：炎热天气起飞`,blurb:`夏日 38°C、静风、高度表 29.92，密度高度约 3,500 英尺。按短距程序起飞，超过 60 节收襟翼，以 74 节爬升。比较凉爽与炎热天气的滑跑距离和爬升表现。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:1,fullLength:!0,shortTakeoff:!0,hot:!0,group:`drills`},{key:`kads_16_soft_field`,label:`KADS 艾迪生：塞斯纳松软跑道起飞`,blurb:`在模拟松软地面上保持滑行，减轻前轮负荷。飞机离地后贴近跑道利用地效加速，再建立爬升；成绩卡将检查滑跑、离地和爬升。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:1,fullLength:!0,softField:!0,group:`drills`},{key:`kads_crosswind_takeoff`,label:`KADS 艾迪生：塞斯纳侧风起飞`,blurb:`在 16 跑道迎风侧打副翼，用方向舵保持中线，加速时逐渐减小修正。离地后向风中修正航向，维持跑道延长线航迹。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:0,fullLength:!0,xwTakeoff:!0,group:`drills`},{key:`efato_kads_16_300`,label:`KADS 艾迪生：300 英尺发动机故障`,blurb:`在 16 跑道全推力起飞，55 节抬轮。发动机在 300 英尺停车，建立 68 节滑翔，在前方选择着陆区。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:0,fullLength:!0,engineOutFt:300},{key:`efato_kads_16_700`,label:`KADS 艾迪生：700 英尺发动机故障`,blurb:`在 16 跑道起飞，发动机在 700 英尺停车。按 74 节爬升的实际表现和当时风况判断能否返场，留意教练对转弯的提示。`,kind:`takeoff`,airport:`KADS`,rwy:`16`,aircraft:`c172`,flaps:0,fullLength:!0,engineOutFt:700},{key:`kafw_34l_final`,label:`KAFW 联盟机场：34L 进近`,blurb:`前往沃思堡以北的联盟机场，体验繁忙货运机场宽长的跑道。`,kind:`final`,airport:`KAFW`,rwy:`34L`,distNm:5},{key:`kftw_16_final`,label:`KFTW 米查姆机场：16 跑道`,blurb:`米查姆是沃思堡历史悠久的机场，就在沃思堡市中心以北。`,kind:`final`,airport:`KFTW`,rwy:`16`,distNm:4},{key:`kgky_34_final`,label:`KGKY 阿灵顿机场：34 跑道`,blurb:`从 3 海里外飞入阿灵顿市立机场，球场就在机场北侧。`,kind:`final`,airport:`KGKY`,rwy:`34`,distNm:3},{key:`c172_stall_recovery`,label:`塞斯纳：失速改出`,blurb:`在格雷普韦恩湖上空收至慢车，抬头直至失速。降低机头，保持机翼水平，加全推力，恢复爬升。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:4500,kias:90,hdg:0,stallDrill:!0},{key:`c172_power_on_stall`,label:`塞斯纳：有动力失速训练`,blurb:`模拟起飞后的低速状态。襟翼 10°、全推力，机头上仰 20° 并保持航向直至失速。随后降低机头、平翼，保持推力，收襟翼爬升。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:4500,kias:60,flaps:1,hdg:0,stallDrill:!0,powerOn:!0},{key:`steep_turns`,label:`塞斯纳：大坡度盘旋`,blurb:`在格雷普韦恩湖上空保持 45° 坡度盘旋一周，再向另一侧盘旋，保持高度（±100 英尺）和速度。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:3e3,kias:95,hdg:0,steepTurns:!0},{key:`c172_slow_flight`,label:`塞斯纳：慢飞训练`,blurb:`收油门、抬机头，减速至接近失速警告。再加推力，在警告不响的前提下保持高度（±100 英尺）与航向（±10°）45 秒。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:4500,kias:95,hdg:0,slowFlight:!0},{key:`c172_emergency_descent`,label:`塞斯纳：紧急下降`,blurb:`座舱出现烟雾，需快速下降 3,000 英尺。收慢车，坡度 30–45°，保持 95–105 节，不得超过 163 节；在教练指定高度平飞（±100 英尺）。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:5e3,kias:100,hdg:0,emergencyDescent:!0},{key:`turns_around_point`,label:`塞斯纳：绕地标盘旋`,blurb:`南风 12 节，标杆位于左前方。当杆到左翼尖侧方时向左盘旋两周，半径保持 1,500 英尺。顺风时坡度较大，迎风时减小，最大 45°；保持 1,000 英尺和 90 节。航向条下方显示方位及距离。`,kind:`drill`,aircraft:`c172`,pos:[Kc.x+1500*.3048,Kc.z+926],point:[Kc.x,Kc.z],radiusFt:1500,wind:[180,12],aglFt:1e3,kias:90,hdg:0,aroundPoint:!0},{key:`rectangular_course`,label:`塞斯纳：矩形地面航线`,blurb:`南风 12 节，四根标杆围成一块田地。向左绕行两圈，始终与田地边缘保持半英里；用航向修正侧风，顺风转弯坡度较大，最大 45°。保持 1,000 英尺（±100）和 90 节（±10）。`,kind:`drill`,aircraft:`c172`,pos:[Kc.x+1207.008,Kc.z+4620*.3048],field:[Kc.x,Kc.z],fieldFt:[2640,3960],distFt:2640,wind:[180,12],aglFt:1e3,kias:90,hdg:0,rectCourse:!0},{key:`s_turns_road`,label:`塞斯纳：跨道路 S 形转弯`,blurb:`五根相距 3,000 英尺的标杆代表东西向道路，南风 12 节。平翼飞越第一根，交替左右飞四个半圆，半径 1,500 英尺，每次越过下一标杆时恢复平翼。保持 1,000 英尺和 90 节，坡度不超过 45°。`,kind:`drill`,aircraft:`c172`,pos:[Kc.x+6e3*.3048,Kc.z+1200],road:[Kc.x+6e3*.3048,Kc.z],radiusFt:1500,wind:[180,12],aglFt:1e3,kias:90,hdg:0,sTurns:!0},{key:`upset_nose_high`,label:`塞斯纳：大仰角异常姿态`,blurb:`教练将机头拉高、让飞机减速后交给你。加全推力，把机头降向地平线并恢复平翼。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:5e3,kias:100,hdg:0,upset:`high`},{key:`upset_nose_low`,label:`塞斯纳：大俯角异常姿态`,blurb:`教练将飞机带入大坡度下降转弯后交给你。先收慢车、平翼，再抬头改出，避免带坡度拉起。`,kind:`drill`,aircraft:`c172`,pos:[Vc.x,Vc.z],aglFt:5e3,kias:100,hdg:0,upset:`low`},{key:`downtown_skyline`,label:`达拉斯市中心天际线观光`,blurb:`飞越达拉斯市中心的美国银行广场与重逢塔。`,kind:`tour`,pos:[xs.x,520,xs.z+3200],speedMps:108,hdg:0,throttle:.65},{key:`att_stadium`,label:`阿灵顿 AT&T 体育场观光`,blurb:`低空飞越阿灵顿，游览 AT&T 体育场及旁边的棒球场。`,kind:`tour`,pos:[Ss.x,480,Ss.z+2900],speedMps:100,hdg:0,throttle:.62}],Jc=(e,t=[])=>t.find(t=>t.key===e)||qc.find(t=>t.key===e)||qc[0];function Yc(e,t,n){let r=e.sun?Ac.indexOf(e.sun):-1;return r>=0?{mode:r,before:n??t}:n==null?{mode:t,before:null}:{mode:n,before:null}}var Xc=`crosswind_today`,Zc=[`KDFW`,`KDAL`,`KADS`,`KAFW`,`KFTW`,`KGKY`];function Qc(e){let t=[{id:`recommended`,missions:[]},...Zc.map(e=>({id:e,missions:[]}))],n={id:`weather`,missions:[]},r={id:`drills`,missions:[]},i={id:`tours`,missions:[]},a=new Map(t.map(e=>[e.id,e]));for(let o of e){if(o.key===`kdfw_35c_final`){a.get(`recommended`).missions.push(o);continue}if(o.group===`weather`){n.missions.push(o);continue}if(o.group===`drills`||o.kind===`drill`&&!o.airport){r.missions.push(o);continue}if(o.kind===`tour`||!o.airport){i.missions.push(o);continue}let e=a.get(o.airport);e||(e={id:o.airport,missions:[]},a.set(o.airport,e),t.push(e)),e.missions.push(o)}return[...t,n,r,i].filter(e=>e.missions.length)}var $c=Object.freeze([`airport`,`mission`]);function el(e){let t;try{t=new URLSearchParams(e)}catch{return null}let n=(t.get(`mission`)||``).trim().toLowerCase();if(n&&qc.some(e=>e.key===n))return n;let r=(t.get(`airport`)||``).trim().toUpperCase();if(!Object.prototype.hasOwnProperty.call(hc,r))return null;let i=qc.filter(e=>e.airport===r),a=i.find(e=>e.kind===`takeoff`&&!e.engineOutFt&&!e.rto&&!e.softField&&!e.xwTakeoff&&!e.shortTakeoff)||i[0];return a?a.key:null}var tl=e=>new URLSearchParams(e).get(`view`)===`terrain`,nl=e=>new URLSearchParams(e).get(`fdm`)===`jsbsim`?`jsbsim`:`builtin`;function rl(e){let t=new URLSearchParams(e);$c.forEach(e=>t.delete(e));let n=t.toString().replace(/=(&|$)/g,`$1`);return n?`?${n}`:``}var il=`openaero_best`,al=(e,t,n)=>e+(t-e)*Math.max(0,Math.min(1,n));function ol(e,t){if(e<=t[0][0])return t[0][1];for(let n=1;n<t.length;n++)if(e<=t[n][0])return al(t[n-1][1],t[n][1],(e-t[n-1][0])/(t[n][0]-t[n-1][0]));return t[t.length-1][1]}var sl={rate:.35,centreline:.2,zone:.2,flare:.15,speed:.1},cl=[150,600];function ll(e){let t=Math.max(0,-e.vsFpm),n=Math.abs(e.crossM),r=Math.abs(e.bankDeg),i=[{key:`rate`,label:`接地下降率`,value:`${Math.round(t)} fpm`,score:ol(t,[[0,100],[120,100],[240,75],[400,40],[600,10]])},{key:`centreline`,label:`中线偏差`,value:`${n.toFixed(1)} 米（偏${e.crossM>=0?`右`:`左`}）`,score:ol(n,[[0,100],[3,100],[e.runwayWidthM/2,40]])},{key:`zone`,label:`接地区`,value:`${Math.round(e.pastThresholdM)} 米（过跑道入口）`,score:e.pastThresholdM<0?0:ol(e.pastThresholdM,[[0,70],[cl[0],100],[cl[1],100],[900,40],[1500,20]])},{key:`flare`,label:`拉平姿态`,value:`${e.pitchDeg.toFixed(1)}° 俯仰，${r.toFixed(1)}° 坡度`,score:Math.max(0,(e.pitchDeg<0?40:ol(e.pitchDeg,[[0,70],[1,100],[7,100],[10,60]]))-Math.max(0,r-2)*8)},{key:`speed`,label:`接地空速`,value:`${Math.round(e.iasKts)} kt (Vref ${e.vrefKts})`,score:ol(e.iasKts-e.vrefKts,[[-20,20],[-5,100],[10,100],[30,30]])}];if(typeof e.driftDeg==`number`){let t=Math.abs(e.driftDeg);i.push({key:`crab`,label:`偏流修正`,value:`${t.toFixed(1)}° 偏流角（不计分）`,score:ol(t,[[0,100],[3,100],[10,30],[15,0]])})}for(let e of i)e.score=Math.round(e.score);let a=Math.round(i.reduce((e,t)=>e+t.score*(sl[t.key]||0),0)),o=hl(a),s=null,c=n>e.runwayWidthM/2||e.pastThresholdM>e.runwayLengthM;e.gearLocked===!1?(o=`CRASH`,s=`起落架未放下锁定，机腹着地。`):t>600?(o=`CRASH`,s=`重着陆：撞击超过了起落架的承载能力。`):r>10?(o=`CRASH`,s=`翼尖触地：接地时坡度过大。`):e.pastThresholdM<0?(o=`D`,s=`接地点在跑道入口之前。`):c&&(o=`D`,s=`接地点偏出跑道。`);let l={pastThresholdM:e.pastThresholdM,crossM:e.crossM,lengthM:e.runwayLengthM,widthM:e.runwayWidthM};return{grade:o,score:o===`CRASH`?0:a,factors:i,reason:s,touchdown:l}}var ul=()=>({bounces:0,airS:0,groundS:0,settled:!1,contact:!0,peakFt:0});function dl(e,t,n,r){return e.settled||(n&&(e.contact=!0),t>e.peakFt&&(e.peakFt=t),t>2?(e.groundS=0,e.airS+=r,e.contact&&e.airS>=.3&&(e.bounces++,e.contact=!1)):(e.airS=0,e.groundS=n?e.groundS+r:0,e.groundS>=1&&(e.settled=!0))),e}function fl(e,t){return-e>600?`弹跳后重着陆，起落架无法承受冲击。`:Math.abs(t)>10?`弹跳后翼尖触地，坡度过大。`:null}function pl(e,t){if(!t||e.grade===`CRASH`)return e;let n=Math.min(e.score,t>1?54:69),r=`${t>1?`弹跳 ${t} 次，最高评级 D`:`弹跳一次，最高评级 C`}。`;return{...e,grade:e.grade===`D`?`D`:hl(n),score:n,bounces:t,reason:e.reason?`${r} ${e.reason}`:r}}var ml={S:`text-fuchsia-300`,A:`text-emerald-300`,B:`text-sky-300`,C:`text-amber-300`,D:`text-orange-400`,CRASH:`text-red-400`};function hl(e){return e>=95?`S`:e>=85?`A`:e>=70?`B`:e>=55?`C`:`D`}function gl(e,t,n){return!t&&!n?0:((e-Math.atan2(t,-n)*180/Math.PI)%360+540)%360-180}var _l=()=>({v:1,missions:{}});function vl(e){try{let t=e.getItem(il);if(!t)return _l();let n=JSON.parse(t);return n&&n.v===1&&n.missions&&typeof n.missions==`object`?n:_l()}catch{return _l()}}function yl(e){let t={};if(!e)return t;for(let[n,r]of Object.entries(vl(e).missions))typeof r?.grade==`string`&&(t[n]=r.grade);return t}function bl(e,t,n,r=Date.now()){let i=vl(e),a=i.missions[t]||null;if(n.grade===`CRASH`||a&&a.score>=n.score)return{isNewBest:!1,best:a,previous:a};let o={score:n.score,grade:n.grade,at:r};i.missions[t]=o;try{e.setItem(il,JSON.stringify(i))}catch{}return{isNewBest:!0,best:o,previous:a}}var xl=`openaero_coach_v1`,Sl={papi:`保持跑道旁的 PAPI 灯两白两红。`,wet:`跑道湿滑，及早刹车；滑跑距离会变长。`,high:`位置偏高，轻轻压低机头。`,low:`位置偏低，抬头并增加推力。`,sink:`下降太快，抬头并增加推力。`,flare:`开始拉平：轻轻后拉操纵杆。`,idle:`油门收至慢车。`,done:`已接地！按住刹车直至停稳。`,kid:`松开操纵杆，飞机将自动着陆。`,kidWet:`跑道湿滑，先松杆，接地后按住刹车停稳。`,gear:`即将着陆，请按 G 放起落架！`,flaps:`按 F 将着陆襟翼放至 30°。`,slow:`速度偏低，加大推力，稍稍低头。`,fast:`速度偏高，稍微收油门。`,offLeft:`偏离中线左侧，轻轻向右倾。`,offRight:`偏离中线右侧，轻轻向左倾。`,decrab:`拉平，用方向舵对正机头。`,reverse:`按 R 展开反推，再加推力。`,brake:`按 B 刹车，直至停稳。`,stow:`已到 60 节，按 R 收回反推。`,stopped:`已停稳，着陆完成！`,bounce:`接地弹跳：保持姿态，稍加推力。`,bounceGa:`再次弹跳！加到最大推力，复飞。`,bounceHigh:`弹跳过高！加到最大推力，复飞。`,bounceKid:`飞机弹跳！松杆，让飞机自动着陆。`},Cl={},wl={papi:1,wet:1,high:1,low:1,kid:1,fast:1,offLeft:1,offRight:1,slow:2,flaps:2,sink:2,gear:3,flare:3,decrab:3,idle:4,done:5,brake:5,reverse:5,stow:5,stopped:6,bounce:5,bounceGa:5,bounceHigh:5,bounceKid:5},Tl={gear:`即将着陆，点按「起落架」将其放下！`,reverse:`点按「反推」，再增加推力。`,brake:`点按「刹车」停稳。`,stow:`已到 60 节，点按「反推」将其收回。`};function El(e,t={}){return e===`slow`&&t.targetKts?`速度偏低，加推力至 ${t.targetKts} 节。`:e===`fast`&&t.targetKts?`速度偏高，收油门至 ${t.targetKts} 节。`:e===`gaFlaps`&&typeof t.flapsDeg==`number`?t.touch?`点按「襟翼」，收一挡至 ${t.flapsDeg}°。`:`按 F 收一挡襟翼至 ${t.flapsDeg}°。`:e===`flaps`&&t.flapsDeg?t.touch?`点按「襟翼」，将其放至 ${t.flapsDeg}°。`:`按 F 将着陆襟翼放至 ${t.flapsDeg}°。`:t.touch&&Tl[e]?Tl[e]:Sl[e]??Cl[e]}function Dl(e){return e.kid?`gaKid`:e.throttle<.9?`gaPower`:e.vsiFpm<=0?`gaPitch`:e.flapsLanding?`gaFlaps`:e.gearLocked?`gaGear`:`gaClimb`}function Ol(e){return e.stall===`armed`?e.kid?`stKidSlow`:e.throttle>.05?`stIdle`:`stSlow`:e.stall===`stalled`?e.kid?`stKid`:`stNose`:e.stall===`unstalled`?e.kid?`stKid`:Math.abs(e.bankDeg??0)>5?`stWings`:e.throttle<.9?`stPower`:`stClimb`:null}function kl(e){if(e.autopilot)return null;if(e.onGround)return e.dsGround??null;if(e.stall)return Ol(e);if(e.ds)return e.ds;if(e.goAround)return Dl(e);if(e.kid)return e.papiWhite===null||e.papiWhite===void 0||e.aglFt<50?null:e.wet?`kidWet`:`kid`;if(e.aglFt<(e.idleFt??30)&&e.throttle>.05)return`idle`;if(e.aglFt<(e.flareFt??50))return Math.abs(e.driftDeg??0)>4?`decrab`:`flare`;if(e.papiWhite===null||e.papiWhite===void 0)return null;if(e.gearLocked===!1&&e.aglFt<2e3)return`gear`;if(e.flapsLanding===!1&&e.aglFt<1500)return`flaps`;if(e.aglFt<1e3&&e.vsiFpm<-1200)return`sink`;let t=e.targetKts?e.iasKts-e.targetKts:0;return t<-5-(e.gustAddKts??0)?`slow`:Math.abs(e.locDots??0)>.6?e.locDots>0?`offRight`:`offLeft`:e.papiWhite>=3?`high`:e.papiWhite<=1?`low`:t>10?`fast`:e.wet&&e.aglFt>500?`wet`:`papi`}function Al(e){return typeof e.gsKts==`number`?e.gsKts<3?`stopped`:e.reverserPos>0&&e.gsKts<70?`stow`:e.canReverse&&!(e.reverserPos>0)&&e.gsKts>80?`reverse`:!e.braking&&e.gsKts>20?`brake`:null:null}var jl=()=>({prompt:null,pending:null,pendingS:0,flown:!1,done:!1,doneS:0});function Ml(e,t,n){t===e.prompt?(e.pending=null,e.pendingS=0):t===null||e.prompt===null||(wl[t]??1)>(wl[e.prompt]??1)?(e.prompt=t,e.pending=null,e.pendingS=0):(t!==e.pending&&(e.pending=t,e.pendingS=0),e.pendingS+=n,e.pendingS>=1.5&&(e.prompt=t,e.pending=null,e.pendingS=0))}function Nl(e,t,n){if(e.done){if(t.bounces>0&&!t.onGround)return e.prompt=t.kid?`bounceKid`:t.noPower?`dsBounce`:t.bounces>=2?`bounceGa`:t.bounceHigh?`bounceHigh`:`bounce`,e.pending=null,e.pendingS=0,e.doneS=0,e;if(e.prompt?.startsWith(`bounce`)&&t.onGround&&(e.prompt=null),e.doneS+=n,e.prompt===`stopped`||!t.onGround||e.doneS<2||!t.rollout)return e;let r=Al(t.rollout);return r===null||r!==e.prompt&&(e.prompt=r,e.pending=null,e.pendingS=0),e}if(!t.onGround)e.flown=!0;else if(e.flown)return e.done=!0,e.prompt=`done`,e.doneS=0,e;return Ml(e,kl(t),n),e}function Pl(e){try{let t=JSON.parse(e.getItem(`openaero_coach_v1`)||`null`);return!!(t&&t.v===1&&t.seen===!0)}catch{return!1}}function Fl(e,t=Date.now()){try{e.setItem(xl,JSON.stringify({v:1,seen:!0,at:t}))}catch{}}var Il=`openaero_tutor_v1`,Ll=()=>({caption:null,shownS:0,pending:null,pendingS:0});function Rl(e){try{let t=JSON.parse(e.getItem(`openaero_tutor_v1`)||`null`);return!(t&&t.v===1&&t.on===!1)}catch{return!0}}function zl(e,t,n=Date.now()){try{e.setItem(Il,JSON.stringify({v:1,on:t,at:n}))}catch{}}var Bl=(e,t,n)=>Math.max(t,Math.min(n,e)),Vl=.01,Hl=e=>Bl(-e*.5,-25,25),Ul=.33,Wl=(e,t=75)=>Bl(Math.atan(t*e*Ul*Math.PI/180/9.80665)*180/Math.PI,-25,25),Gl=(e,t,n,r=1)=>Bl(Bl((e-t)*.05-n*.8,-.6,.6)*r,-1,1),Kl=(e,t=0)=>Bl(-3-e*.12-t*Vl,-6,-.5),ql=(e,t,n)=>Math.min(9.5,t+e-n),Jl=(e,t=.2)=>-Math.max(.8,e*t),Yl=(e,t,n)=>Bl((t-e)*.22+n*4.5,-1,1);function Xl(e,t,n,r=1.225){let i=.5*r*t*t;return(e.massKg*9.80665/(i*e.wingAreaM2)-(e.cl0+Ts(e,n)))/e.clAlpha*180/Math.PI}var Zl=.012,Ql=.04,$l=4e-4;function eu(e,t,n,r,i,a){let o=r-n;return t.trim=Bl(t.trim+o*$l*a,-.3,.3),Bl(e+o*Zl-i*Ql+t.trim,0,1)}var tu=e=>-e*3;function nu(){return{icao:`KDFW`,raw:`SCENARIO KDFW 35010KT 10SM FEW050 18/08 A3000`,obsTime:null,windDirDeg:350,windKts:10,gustKts:10,visibilitySm:10,ceilingFt:null,ceilingCover:null,cloudLayers:[{cover:`FEW`,baseFt:5e3,coverage:.2}],altimInHg:30,tempC:18,fltCat:`VFR`,wetRunway:!1,live:!1}}function ru(e,t){if(e==null||!t)return{x:0,z:0};let n=e*B;return{x:-Math.sin(n)*t,z:Math.cos(n)*t}}var iu=.03;function au(e){return e<10?Math.log(Math.max(1,e)/iu)/Math.log(10/iu):1}function ou(e,t,n){if(!n||n<=t)return t;let r=(Math.sin(e*.37)+Math.sin(e*.83+1.3)*.6+Math.sin(e*1.91+.4)*.3)/1.9,i=Math.max(0,Math.min(1,(r+1)/2));return t+(n-t)*i*i}function su(e,t,n){if(e==null)return{headwindKts:0,crosswindKts:0};let r=(e-n)*B;return{headwindKts:t*Math.cos(r),crosswindKts:t*Math.sin(r)}}function cu(e){return 1.517/(e>=10?25e3:Math.max(400,e*1609.34))}function lu(e,t){return t&&t.kind?Math.min(e,9.99):e}function uu(e,t){return Math.max(0,Math.round((t-e)/60))}function du(e,t){return e==null?`SOUTH`:t*Math.cos(e*B)>=5?`NORTH`:`SOUTH`}var fu={uNight:{value:0},uGroundTint:{value:new s(1,1,1)}},pu=`varying vec3 vNightW;
`,mu=`vNightW = (modelMatrix * vec4(transformed, 1.0)).xyz;
`,hu=`
uniform float uNight;
uniform vec3 uGroundTint;
varying vec3 vNightW;
`,gu=`
#ifdef NIGHT_TINT
  diffuseColor.rgb *= uGroundTint;
#endif
#if defined(USE_MAP) && defined(NIGHT_GROUND)
{
  vec3 tex = sampledDiffuseColor.rgb;
  float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));
  float mx = max(tex.r, max(tex.g, tex.b)), mn = min(tex.r, min(tex.g, tex.b));
  float sat = (mx - mn) / (mx + 0.02);
  // Asphalt (roads, parking lots): dark-to-mid grey and unsaturated. That is where the
  // street lights stand. Bright roofs, fields, trees and water stay dark.
  float grey = 1.0 - smoothstep(0.1, 0.32, sat);
  float asphalt = smoothstep(0.025, 0.06, lum) * (1.0 - smoothstep(0.16, 0.3, lum)) * grey;
  float built = smoothstep(0.05, 0.2, lum) * grey;
#ifdef NIGHT_TINT
  vec3 fn = cross(dFdx(vNightW), dFdy(vNightW));
  asphalt *= smoothstep(0.8, 0.95, abs(fn.y) / max(length(fn), 1e-6)) * (1.0 - smoothstep(0.05, 0.16, sat));
  const float GAIN = 0.45;
#else
  const float GAIN = 1.0;
#endif
  // Moonlit grade: cooler and flatter than the daylight photo.
  float g = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb = mix(diffuseColor.rgb, g * vec3(0.78, 0.88, 1.18), 0.55 * uNight);
  // Street lights: one candidate per 20 m cell, jittered; each throws a warm pool on the
  // pavement around a small bright head. Far away, where a cell is under a pixel, their
  // average glow.
  vec2 cell = vNightW.xz / 20.0;
  vec2 id = floor(cell);
  float h = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
  vec2 off = (vec2(fract(h * 17.31), fract(h * 31.77)) - 0.5) * 0.7;
  float d = length(fract(cell) - 0.5 - off);
  float lit = step(0.45, h);
  float pool = lit * smoothstep(0.75, 0.0, d);
  float head = lit * smoothstep(0.09, 0.0, d);
  float near = 1.0 - smoothstep(0.25, 0.9, length(fwidth(cell)));
  vec3 colour = mix(vec3(1.0, 0.6, 0.24), vec3(0.95, 0.9, 0.8), step(0.75, fract(h * 7.7)));
  vec3 lamps = colour * (tex * pool * pool * 7.0 + head * 2.0);
  vec3 far = colour * (tex * 1.6 + 0.16);
  diffuseColor.rgb += mix(far, lamps, near) * asphalt * GAIN * uNight + colour * built * 0.04 * uNight;
}
#endif
`,_u=!1,vu=new Set;function yu(e){fu.uNight.value=e;let t=e>.001;if(t!==_u){_u=t;for(let e of vu){let t=e.deref();t?t.needsUpdate=!0:vu.delete(e)}}}function bu(e,{tint:t=!1}={}){e.onBeforeCompile=e=>{e.uniforms.uNight=fu.uNight,e.uniforms.uGroundTint=fu.uGroundTint,e.vertexShader=pu+e.vertexShader.replace(`#include <project_vertex>`,`#include <project_vertex>\n${mu}`),e.fragmentShader=(t?`#define NIGHT_TINT
`:``)+(_u?`#define NIGHT_GROUND
`:``)+hu+e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>\n${gu}`)},e.customProgramCacheKey=()=>`nightGround:${t?`tint`:``}:${_u?`lit`:`day`}`;let n=new WeakRef(e);return vu.add(n),e.addEventListener(`dispose`,()=>vu.delete(n)),e}function xu(e){let t=Math.min(1,Math.max(0,(2-e)/8));return t*t*(3-2*t)}var Su=6e4,Cu=(e,t,n)=>`${e}/${t}/${n}`;function wu(e=Su){let t=6378137,n=e/t/B,r=e/(t*Math.cos(ht*B))/B,i=fs(ht+n,_t-r,10),a=fs(ht-n,_t+r,10),o=[];for(let e=i.x;e<=a.x;e++)for(let t=i.y;t<=a.y;t++)o.push({z:10,x:e,y:t});return o}var Tu=new Map;function Eu(e,t,n){let r=Cu(e,t,n),i=Tu.get(r);if(!i){let a=_s(t,n,e);i={cx:a.posX,cz:a.posZ,w:a.widthM,l:a.lengthM,minX:a.posX-a.widthM/2,maxX:a.posX+a.widthM/2,minZ:a.posZ-a.lengthM/2,maxZ:a.posZ+a.lengthM/2},Tu.set(r,i)}return i}function Du(e,t,n=0){let r=Math.max(e.minX-t.x,0,t.x-e.maxX),i=Math.max(e.minZ-t.z,0,t.z-e.maxZ),a=Math.max(0,t.y-n);return Math.hypot(r,a,i)}function Ou(e,{groundY:t=0,maxZoom:n=16,splitFactor:r=2,visible:i=null,roots:a=wu()}={}){let o=(a,s,c)=>{let l=Eu(a,s,c),u={z:a,x:s,y:c,key:Cu(a,s,c),children:null},d=Du(l,e,t)<l.w*r;return a<n&&d&&(!i||i(l))&&(u.children=[o(a+1,2*s,2*c),o(a+1,2*s+1,2*c),o(a+1,2*s,2*c+1),o(a+1,2*s+1,2*c+1)]),u};return a.map(e=>o(e.z,e.x,e.y))}function ku(e,t=[]){for(let n of e)t.push(n),n.children&&ku(n.children,t);return t}function Au(e,t){let n=[],r=e=>{if(!e.children)return t(e.key)?[e]:null;let n=e.children.map(r);return n.every(Boolean)?n.flat():t(e.key)?[e]:n.filter(Boolean).flat()};for(let t of e){let e=r(t);e&&n.push(...e)}return n}function ju(e){return e<=13?2:4}var Mu=6,Nu=260,Pu=.2,Fu=-100,Iu=150,Lu=.85,Ru=1.4;function zu(t,n,r,i){let a=n+1,o=a*a+4*a,s=new Float32Array(o*3),c=new Float32Array(o*2),l=0,u=(e,t,n,r,i)=>{s[l*3]=e,s[l*3+1]=i,s[l*3+2]=t,c[l*2]=n,c[l*2+1]=r,l++};for(let e=0;e<a;e++)for(let i=0;i<a;i++){let a=i/n,o=1-e/n,s=-t.w/2+a*t.w,c=-t.l/2+e/n*t.l;u(s,c,a,o,r(t.cx+s,t.cz+c))}let f=l,p=[];for(let e=0;e<n;e++)for(let t=0;t<n;t++){let n=e*a+t,r=n+1,i=n+a,o=i+1;p.push(n,i,r,r,i,o)}let m=Math.max(25,t.w*.01),h=[],g=[Array.from({length:a},(e,t)=>t),Array.from({length:a},(e,t)=>t*a+n),Array.from({length:a},(e,t)=>n*a+(n-t)),Array.from({length:a},(e,t)=>(n-t)*a)];for(let e of g){let t=l;for(let t of e)h.push(t),u(s[t*3],s[t*3+2],c[t*2],c[t*2+1],s[t*3+1]-m);for(let r=0;r<n;r++){let n=e[r],i=e[r+1],a=t+r,o=t+r+1;p.push(n,i,a,i,o,a)}}let _=new dn;_.setAttribute(`position`,new d(s,3)),_.setAttribute(`uv`,new d(c,2)),_.setIndex(p),_.computeVertexNormals();let v=_.attributes.normal.array,y=new Float32Array(o*3),b=Lu+Ru*Math.max(0,i.y);for(let e=0;e<o;e++){let t=e<f?e:h[e-f],n=v[t*3]*i.x+v[t*3+1]*i.y+v[t*3+2]*i.z,r=(Lu+Ru*Math.max(0,n))/b;y[e*3]=r,y[e*3+1]=r,y[e*3+2]=r}return _.setAttribute(`color`,new d(y,3)),_.deleteAttribute(`normal`),_.boundingBox=new e(new z(-t.w/2,Fu,-t.l/2),new z(t.w/2,Iu,t.l/2)),_.boundingSphere=_.boundingBox.getBoundingSphere(new nn),_}function Bu({scene:t,ground:n,renderOrder:r=-5,maxZoom:i,anisotropy:a=4,sunDir:o}){let c=new s(1,1,1),l=new It;l.name=`terrain-lod`,t.add(l);let u=new Sr;u.crossOrigin=`anonymous`;let d=new Map,f=[],p=0,m=0,h=0,_=[],v=wu(),y=new Vn,b=new ct,x=new e,S={loaded:0,failed:0,drawn:0,cached:0,triangles:0,finestZoom:0},C=e=>{let t=Eu(e.z,e.x,e.y),i=bu(new Cn({color:c,vertexColors:!0})),a=new H(zu(t,ju(e.z),n.heightAt,o),i);a.position.set(t.cx,0,t.cz),a.renderOrder=r,a.visible=!1,a.matrixAutoUpdate=!1,a.updateMatrix(),l.add(a);let s={mesh:a,ready:!1,loading:!1,lastUsed:h,z:e.z,x:e.x,y:e.y,b:t};return d.set(e.key,s),s},w=()=>{for(;p<Mu&&f.length;){let e=f.shift(),t=d.get(e);!t||t.ready||t.loading||(t.loading=!0,p++,u.load(gs(t.z,t.x,t.y),n=>{p--,n.colorSpace=g,n.anisotropy=a,d.get(e)===t?(t.mesh.material.map=n,t.mesh.material.needsUpdate=!0,t.ready=!0,t.loading=!1,S.loaded++,w()):(n.dispose(),w())},void 0,()=>{p--,d.get(e)===t&&(t.mesh.material.color.setHex(2308135).multiply(c),t.mesh.userData.plain=!0,t.ready=!0,t.loading=!1,S.failed++),w()}))}},T=()=>{if(d.size<=Nu)return;let e=[...d.entries()].filter(([,e])=>e.lastUsed<h&&!e.loading).sort((e,t)=>e[1].lastUsed-t[1].lastUsed);for(let t=0;t<e.length&&d.size>Nu;t++){let[n,r]=e[t];l.remove(r.mesh),r.mesh.geometry.dispose(),r.mesh.material.map?.dispose(),r.mesh.material.dispose(),d.delete(n)}};function E(e,t){if(m-=e,m>0)return;m=Pu,h++,t.updateMatrixWorld(),b.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),y.setFromProjectionMatrix(b);let r=t.position;_=Ou(r,{groundY:n.heightAt(r.x,r.z),maxZoom:i,visible:e=>(x.min.set(e.minX,Fu,e.minZ),x.max.set(e.maxX,Iu,e.maxZ),y.intersectsBox(x)),roots:v});let a=ku(_),o=[];for(let e of a){let t=d.get(e.key)||C(e);t.lastUsed=h,!t.ready&&!t.loading&&o.push(e)}o.sort((e,t)=>e.z-t.z||Hu(Eu(e.z,e.x,e.y),r)-Hu(Eu(t.z,t.x,t.y),r)),f.length=0;for(let e of o)f.push(e.key);w();for(let e of d.values())e.mesh.visible=!1;let s=Au(_,e=>d.get(e)?.ready),c=0,l=0;for(let e of s){let t=d.get(e.key).mesh;t.visible=!0,c+=t.geometry.index.count/3,e.z>l&&(l=e.z)}S.finestZoom=l,S.drawn=s.length,S.cached=d.size,S.triangles=c,T()}function D(){for(let[,e]of d)l.remove(e.mesh),e.mesh.geometry.dispose(),e.mesh.material.map?.dispose(),e.mesh.material.dispose();d.clear(),f.length=0,_=[],m=0,S.drawn=0,S.cached=0,S.triangles=0,S.finestZoom=0}function O(){for(let[,e]of d){let t=e.mesh.geometry;e.mesh.geometry=zu(e.b,ju(e.z),n.heightAt,o),t.dispose()}}function k(e){c.copy(e);for(let[,e]of d)e.mesh.material.color.copy(c),e.mesh.userData.plain&&e.mesh.material.color.multiply(Vu)}return{group:l,update:E,redrape:O,reset:D,setTint:k,stats:S,setVisible:e=>{l.visible=e}}}var Vu=new s(2308135);function Hu(e,t){let n=e.cx-t.x,r=e.cz-t.z;return n*n+r*r}var Uu=`modulepreload`,Wu=function(e,t){return new URL(e,t).href},Gu={},Ku=function(e){return e.pathname.endsWith(`.css`)},qu=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},G=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Wu(t,n);let r=s(t),i=Ku(r);return qu(Gu,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Uu,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Ju=[`https://mutaafaziz.com`];function Yu(e){return Ju.includes(e.origin)||new URLSearchParams(e.search).has(`photoreal`)}function Xu(e,t=()=>G(()=>import(`./photoreal-CB2Ed95F.js`).then(e=>e.t),__vite__mapDeps([0,1,2,3,4]),import.meta.url)){let n={status:`off`,reason:``,visibleTiles:0,loadedTiles:0,calibM:0,calibSamples:0,attributions:``},r=null,i=null,a=null;return{get state(){return r?r.state:n},start(o){return r?r.start(o):i||(n.status=`starting`,i=t().then(({createPhotoreal:t})=>(r=t(e),a!==null&&r.setVisible(a),r.start(o))).catch(t=>{r||(n.status=`unavailable`,n.reason=t?.message||`error`,e.onUnavailable?.(n.reason))}),i)},update(e){r?.update(e)},setVisible(e){a=e,r?.setVisible(e)},resize(){r?.resize()},noteSessionReuse(){r?.noteSessionReuse()},debugLine(){return r?r.debugLine():`3D tiles: ${n.status}`},debugState(){return r?r.debugState():{...n,page:null,usage:null,bounds:null}}}}var Zu=288.15,Qu=101325,$u=1.225,ed=.0065,td=287.05287,nd=9.80665,rd=1.4,id=11e3,ad=Zu-ed*id,od=Qu*(ad/Zu)**+(nd/(td*ed));function sd(e){return e<=id?Qu*(1-ed*e/Zu)**(nd/(td*ed)):od*Math.exp(-9.80665/(td*ad)*(e-id))}var cd=e=>e<=id?Zu-ed*e:ad;function ld(e,t=0,n=29.92,r={}){let i=e+(29.92-n)*1e3*pt,a=cd(i)+t,o=sd(i);return r.tempK=a,r.pressurePa=o,r.rho=o/(td*a),r.sigma=r.rho/$u,r.speedOfSoundMps=Math.sqrt(rd*td*a),r}var ud=(e,t)=>typeof e==`number`?e-(15-ed*t):0,dd=(e,t)=>e/Math.sqrt(t);function fd(e,t=29.92,n=null){let r=e+(29.92-(t||29.92))*1e3;return typeof n==`number`?r+118.8*(n-(15-.00198*r)):r}var pd=(e,t)=>e-t>=1500,md=`openaero_assist_v1`,hd=[`kid`,`learner`,`pilot`],gd=`learner`,_d={kid:{bankMaxDeg:30,pitchUpMaxDeg:15,pitchDownMaxDeg:-10,aoaMarginDeg:4,flareAoaMarginDeg:3,autoThrottle:!0,autoConfig:!0,autoFlare:!0,softLanding:!0,groundFloor:!0,handsOff:!0},learner:{bankMaxDeg:45,pitchUpMaxDeg:20,pitchDownMaxDeg:-15,aoaMarginDeg:4,autoThrottle:!1,autoConfig:!1,autoFlare:!1,softLanding:!1,groundFloor:!1,handsOff:!1},pilot:null},vd=e=>_d[e]??null,yd=e=>hd.includes(e),bd=(e,t,n)=>Math.max(t,Math.min(n,e)),xd=.05,Sd=8,Cd=4,wd=.1,Td=3,Ed=.85,Dd=12,Od=5,kd=150,Ad=-4,jd=2,Md=2,Nd=2.5,Pd=.7,Fd=.4,Id=17,Ld=(e,t,n)=>bd(-e*n-t.yawRateRight*Id,-1,1),Rd=()=>({pitchHoldDeg:null,departing:!1}),zd=e=>(e.pitchHoldDeg=null,e.departing=!1,e);function Bd(e,t,n){return t?e.departing=!0:n>1e3&&(e.departing=!1),e.departing}function Vd(e,t,n,r,i){if(n.onGround){if(t.pitchHoldDeg=null,i.elev=n.pitchIn,i.ail=n.rollIn,Math.abs(n.yawIn)>xd||n.rwyHdgDeg==null)i.rud=n.yawIn;else{let e=Ws(n.noseHdgDeg,Wd(n.rwyHdgDeg,n.crossM,n.crossVelMps));i.rud=n.noseWheelDown===!1?Ld(e,n,Fd):bd(Gd(n.rwyHdgDeg,n.noseHdgDeg,n.crossM,n.crossVelMps,n.steerRateDegS)-bd(e,-1,1)*5/Math.max(1,n.steerRateDegS)*bd(n.airspeedMps/16-.94,0,1),-1,1)}return i}if(t.pitchHoldDeg===null&&(t.pitchHoldDeg=n.pitchDeg),Math.abs(n.pitchIn)>xd)t.pitchHoldDeg=bd(t.pitchHoldDeg-n.pitchIn*Sd*r,n.pitchDeg-Cd,n.pitchDeg+Cd);else if(e.handsOff){let i=Md*r,a=e.autoFlare&&n.wheelHeightM<Dd&&n.vsMps>0;t.pitchHoldDeg+=bd(n.guideGammaDeg+n.aoaDeg-t.pitchHoldDeg,a?0:-i,i)}if(t.pitchHoldDeg=bd(t.pitchHoldDeg,e.pitchDownMaxDeg*Ed,(n.pitchUpMaxDeg??e.pitchUpMaxDeg)*Ed),e.groundFloor&&!n.noFloor&&n.wheelHeightM<kd&&(t.pitchHoldDeg=Math.max(t.pitchHoldDeg,Ad+n.aoaDeg)),e.autoFlare&&n.wheelHeightM<Dd){let e=Math.atan2(Jl(Math.max(0,n.wheelHeightM),n.flarePerS),Math.max(20,n.airspeedMps))*180/Math.PI;t.pitchHoldDeg=Math.min(Math.max(t.pitchHoldDeg,e+n.aoaDeg),n.tailstrikeDeg-jd)}let a=e.autoFlare&&n.wheelHeightM<Dd,o=n.stallAoaDeg-(a?e.flareAoaMarginDeg:e.aoaMarginDeg),s=n.pitchDeg-n.aoaDeg+o,c=Math.min(t.pitchHoldDeg,s);c<t.pitchHoldDeg&&(t.pitchHoldDeg=Math.max(c,e.pitchDownMaxDeg*Ed));let l=bd(n.bankRightDeg,-60,60)*Math.PI/180,u=n.airspeedMps>20?9.81/n.airspeedMps*Math.tan(l)*Math.sin(l):0;i.elev=Yl(c,n.pitchDeg,n.pitchRateUp-u);let d=e.autoFlare&&n.wheelHeightM<Dd?Od:n.bankMaxDeg||e.bankMaxDeg,f=d*Ed,p=Math.abs(n.rollIn)<=xd&&e.handsOff?bd(n.guideBankDeg,-f,f):bd(n.rollIn,-1,1)*f,m=n.rollScale??1;return i.ail=bd(Gl(p,n.bankRightDeg,n.rollRateRight,m)-(n.dihedralAil??0)+(n.propAil??0),-1,1),Math.abs(n.bankRightDeg)>d&&(i.ail=-Math.sign(n.bankRightDeg)*Math.min(1,m)),i.rud=Math.abs(n.yawIn)>xd?n.yawIn:e.autoFlare&&!t.departing&&n.wheelHeightM<Nd&&n.vsMps<1?Ld(n.driftDeg,n,Pd):n.wheelHeightM<Td?0:bd(n.betaDeg*wd,-1,1),i}var Hd=(e,t,n)=>e+bd(t-e,-2*n,2*n),Ud=4,Wd=(e,t,n)=>e-bd(t*.5+n,-3,3);function Gd(e,t,n,r,i){return bd(bd(Ws(Wd(e,n,r),t)*.5,-4,Ud)/Math.max(.5,i),-1,1)}var Kd=(e,t,n)=>.8*Wl(Ws(e+bd(-n*.15,-20,20),t));function qd(e,t=1){if(!(t>0)||t===1)return e;let n=t*Math.tan(e*Math.PI/180);return Math.asin(Math.max(-1,Math.min(1,n)))*180/Math.PI}function Jd(e,t,n,r){let i=Math.hypot(e,t);if(i<1)return 1;let a=((e-n)*e+(t-r)*t)/i;return a>1?i/a:1}function Yd(e,t,n,r,i,a=0,o=1){let s=t.distM<0;if(!(s&&t.heightAbovePathM+t.pathHeightM>30+a)&&t.distM<2e4&&Math.abs(t.crossM)<1500&&Math.abs(Ws(e.hdgT,n))<45){if(i.guideBankDeg=Kd(e.hdgT,r,t.crossM),s&&-t.distM>(e.lengthM-e.displacedM)/3+a*19.08)return;i.guideGammaDeg=s?Math.max(Kl(t.heightAbovePathM-a),a>0?-3:-2):qd(Kl(t.heightAbovePathM-a),o)}}function Xd(e,t,n){if(t.onGround)return n;let r=t.vsiFpm<-300,i=t.vsiFpm>300;return e.fixedGear||(r&&t.aglFt<1e3?n.gearDown=!0:i&&t.aglFt>500&&(n.gearDown=!1)),r&&t.aglFt<1500&&t.iasKts<e.vrefKts+40?n.flapsIndex=Math.max(n.flapsIndex,js(e)):i&&t.aglFt>1e3&&(n.flapsIndex=0),n}var Zd=(e,t,n=0)=>t>0?ks(e,t)+5+n:e.vrefKts+30,Qd=(e,t)=>e.engine?.type===`piston-prop`&&t&&t.gustKts>t.windKts?(t.gustKts-t.windKts)/2:0,$d=(e,t,n)=>ks(e,t)+5+(t>0?Qd(e,n):0),ef=(e,t)=>t===`pilot`||!yd(t)?e:`${e}@${t}`;function tf(e){try{let t=JSON.parse(e.getItem(`openaero_assist_v1`)||`null`);if(t&&t.v===1&&yd(t.level))return t.level}catch{}return nf(e)?`pilot`:gd}function nf(e){try{let t=JSON.parse(e.getItem(`openaero_best`)||`null`);return!!t&&t.v===1&&!!t.missions&&Object.keys(t.missions).some(e=>!e.includes(`@`))}catch{return!1}}function rf(e,t,n=Date.now()){if(yd(t))try{e.setItem(md,JSON.stringify({v:1,level:t,at:n}))}catch{}}var af={},of=null,sf=e=>of?of.get(e)??(of.has(` `+e)?null:e):e;function cf(e){for(let e in af)af[e]=!1;of=e}function lf(e){let t=0,n=0,r=0;return(e.KeyW||e.ArrowDown)&&(t+=1),(e.KeyS||e.ArrowUp)&&--t,(e.KeyA||e.ArrowLeft)&&--n,(e.KeyD||e.ArrowRight)&&(n+=1),e.KeyQ&&--r,e.KeyE&&(r+=1),{pitch:t,roll:n,yaw:r}}function uf(e){return(e.BracketRight||e.Numpad1?1:0)-(e.BracketLeft||e.Numpad7?1:0)}function df(e,t,n){let r=e=>Math.max(-1,Math.min(1,e));return{x:r((e-n.left)/n.width*2-1),y:r((t-n.top)/n.height*2-1)}}function ff(e,t,n){if(t&&t.active){let r=n&&n.active&&n.yaw?n.yaw:e.yaw;return{pitch:t.y,roll:t.x,yaw:r,source:`stick`}}return n&&n.active?{pitch:n.pitch,roll:n.roll,yaw:n.yaw||e.yaw,source:`gamepad`}:{pitch:e.pitch,roll:e.roll,yaw:e.yaw,source:`keyboard`}}function pf(e,t){let n=1-(e-t.top)/t.height;return Math.max(0,Math.min(1,n))}var mf=.25;function hf(e,t,n,r){let i=Math.sign(e)*Math.max(0,Math.abs(e)-mf)/.75,a=8*Math.PI/180*n/(Math.max(.5,t)*Math.tan(r*Math.PI/180));return Math.max(-1,Math.min(1,i*Math.min(1,a)))}var gf=e=>Math.max(0,Math.min(1,(40-e/gt)/20));function _f(e,t,n,r,i){let a=Math.abs(e)>.25?gf(t):0;return a*hf(e,t,n,r)+(1-a)*i}var vf=.09;function yf(e,t){return{min:e.vneKts?Xl(e,e.vneKts*gt,t):-2,max:Es(e,t)-4}}function bf(e,t,n,r){let{min:i,max:a}=yf(n,r);return e>t?Math.min(e,Math.max(t,a)):e<t?Math.max(e,Math.min(t,i)):t}function xf(e,t,n,r,i){let a=Math.max(.1,Ds(r,e*B,i));return bf(e+t*(2*vf*a/r.clAlpha*V)*n,e,r,i)}function Sf(e,t,n){let r=Ds(e,t*B,n);return r<.05?null:Math.sqrt(2*e.massKg*ut/(ft*e.wingAreaM2*r))*vt}var Cf=(e,t)=>Xl(e,!t&&e.vyKts*.514444||(e.vrKtsByFlap?.[t]??e.vrKts)*.617,t),wf={"one thousand":`一千`,"five hundred":`五百`,"four hundred":`四百`,"three hundred":`三百`,"two hundred":`两百`,"one hundred":`一百`,fifty:`五十`,forty:`四十`,thirty:`三十`,twenty:`二十`,ten:`十`,retard:`收油门`,"throttle idle":`油门慢车`,"sink rate":`下降率过大`,"too fast down":`下降过快`,"pull up":`拉起`,"sink rate · too fast down":`下降率过大，请减缓下降`,"too low, gear · gear down":`高度过低，请放起落架`,"overspeed · slow down":`已超速，请减速`,"too low, gear":`高度过低，检查起落架`,"gear down":`放起落架`,overspeed:`超速`,"slow down":`减速`,"unstabilized, go around":`进近不稳定，复飞`,"windshear, windshear, windshear":`风切变，风切变，风切变`,"windshear ×3":`风切变 ×3`,minimums:`到达决断高度`,"eighty knots":`八十节`,rotate:`抬轮`,"positive rate":`正爬升率`},Tf=e=>wf[e]??e,Ef=1.2,Df={"windshear, windshear, windshear":`windshear ×3`},Of=e=>Df[e]||e,kf={retard:`throttle idle`,"sink rate":`sink rate · too fast down`,"too low, gear":`too low, gear · gear down`,overspeed:`overspeed · slow down`},Af=e=>kf[e]||e,jf=/^(\w+ (thousand|hundred)|\w+ty|ten|retard|throttle idle)$/;function Mf(e,t=Ef){let n=``,r=``,i=``,a=-1;return{say(o,s,c=!1,l=t){if(!o||o===r&&s<a)return;let u=c&&s<a?i&&jf.test(r)&&!jf.test(i)?i:r:``;n=u?`${u} · ${o}`:o,i=u,r=o,a=s+l,e(n)},update(t){n&&t>=a&&(n=``,i=``,e(``))},get text(){return n}}}function Nf(e,t,n=()=>{}){let r=null,i=null,a=null,o=null,s=null,c=null,l=null,u=null,d=null,f=null,p=null,m=null,h={hz:150,gain:.08,filterHz:450};function g(){if(r)e.paused||te(!1);else try{r=new(window.AudioContext||window.webkitAudioContext),i=r.createOscillator(),i.type=`sawtooth`,i.frequency.setValueAtTime(80,r.currentTime),a=r.createBiquadFilter(),a.type=`lowpass`,a.frequency.setValueAtTime(450,r.currentTime),o=r.createGain(),o.gain.setValueAtTime(.001,r.currentTime),i.connect(a),a.connect(o),o.connect(r.destination),i.start(),G(()=>import(`./engineSound-CiswPnnv.js`).then(e=>{f=e.engineVoice,p=e.audioSession,m=e.rollSound(r)},()=>{}),[],import.meta.url).catch(console.warn);let n=r.sampleRate*2,h=r.createBuffer(1,n,r.sampleRate),g=h.getChannelData(0);for(let e=0;e<n;e++)g[e]=Math.random()*2-1;s=r.createBufferSource(),s.buffer=h,s.loop=!0,c=r.createBiquadFilter(),c.type=`bandpass`,c.frequency.setValueAtTime(320,r.currentTime),l=r.createGain(),l.gain.setValueAtTime(.001,r.currentTime),s.connect(c),c.connect(l),l.connect(r.destination),s.start(),u=r.createOscillator(),u.type=`square`,u.frequency.setValueAtTime(750,r.currentTime),d=r.createGain(),d.gain.setValueAtTime(0,r.currentTime),u.connect(d),d.connect(r.destination),u.start(),e.audioEnabled=!0,t()}catch(e){console.warn(`Web Audio error:`,e)}}function _(t,n){if(r&&e.audioEnabled)try{let e=r.createOscillator(),i=r.createGain();e.frequency.setValueAtTime(t,r.currentTime),i.gain.setValueAtTime(.12,r.currentTime),i.gain.exponentialRampToValueAtTime(.001,r.currentTime+n),e.connect(i),i.connect(r.destination),e.start(),e.stop(r.currentTime+n)}catch{}}let v=typeof window<`u`&&window.speechSynthesis?window.speechSynthesis:null;function y(t,{interrupt:n=!0}={}){if(!r||!e.audioEnabled||e.paused||!v||typeof SpeechSynthesisUtterance>`u`)return!1;try{n&&v.cancel&&v.cancel();let e=new SpeechSynthesisUtterance(Tf(t));return e.lang=/[\u3400-\u9fff]/.test(e.text)?`zh-CN`:`en-US`,e.rate=1.35,e.pitch=.75,e.volume=.9,v.speak(e),!0}catch{return!1}}let b=()=>r?r.currentTime:performance.now()/1e3,x=-10,S=-10;function C(){if(e.lastCalloutIdx=Zs(e.raFt,e.lastCalloutIdx),e.onGround||e.vel.y>=0||rc(e.raFt,e.vsiFpm,e.onGround))return;let t=Xs(e.raFt,e.lastCalloutIdx);if(t>=0&&t<qs.length){e.lastCalloutIdx=t;let r=b()-x>2.5&&b()-S>1.5;n(Ys(t),!r),y(Ys(t),{interrupt:r})||_(587.33,.18),qs[t]===20&&e.throttle>.05&&!e.engineFailed&&(n(`retard`,!0),y(`retard`,{interrupt:!1}),S=b())}}let w=-10;function T(){if(!rc(e.raFt,e.vsiFpm,e.onGround))return;let t=b();if(t-w<3)return;w=t;let r=e.raFt<250?`pull up`:`sink rate`,i=t-x>2.5;n(r,!i),y(r,{interrupt:i})||_(880,.4)}function E(t=!0){if(p?.(e),e.paused||(t&&(C(),T()),!r||!e.audioEnabled))return;let n=r.currentTime;f&&f(e,h),i.frequency.setTargetAtTime(h.hz,n,.1),a.frequency.setTargetAtTime(h.filterHz,n,.1),o.gain.setTargetAtTime(h.gain,n,.1);let s=Math.min(e.iasKts/260,1.6);l.gain.setTargetAtTime(.015+s*.065,n,.1);let c=nc(e.iasKts,Ms(e.spec,e.flapsIndex),e.onGround);d.gain.setTargetAtTime(c?.07:0,n,.05),m?.(e)}function D(t){x=b(),n(t,!0),r&&e.audioEnabled&&(y(t,{interrupt:!1})||_(440,.3))}function O(t){r&&e.audioEnabled&&(y(t)||_(523.25,.15))}function k(){o&&(o.gain.value=0),l&&(l.gain.value=0),d&&(d.gain.value=0),m?.(null)}let ee=e=>y(e,{interrupt:!1});function te(t){try{t&&v?.cancel()}catch{}p?.(e),r&&r.state!==`closed`&&r[t?`suspend`:`resume`]().catch(()=>{})}return{init:g,update:E,mute:k,callout:D,takeoffCall:O,teach:ee,pause:te,get ctx(){return r},get state(){return r?r.state:`off`}}}function Pf(e=typeof navigator<`u`?navigator:void 0){let t=typeof e?.wakeLock?.request==`function`?e.wakeLock:null,n={held:!1,sync:u},r=null,i=!1,a=!1,o=!0,s=!1,c=e=>e.release().catch(()=>{});function l(){a=!0,o=!1,new Promise(e=>e(t.request(`screen`))).then(e=>{if(a=!1,!i)return c(e);r=e,n.held=!0,e.onrelease=()=>{r===e&&(r=null,n.held=!1,s||(o=s=!0))}},()=>{a=!1})}function u(e){if(t){if(e!==i){if(i=e,e)o=!0,s=!1;else if(r){let e=r;r=null,n.held=!1,c(e)}}e&&!r&&!a&&o&&l()}}return n}var Ff=`openaero_view_v1`;function If(e){try{let t=JSON.parse(e.getItem(`openaero_view_v1`)||`null`);return t&&t.v===1&&typeof t.clean==`boolean`?t.clean:!0}catch{return!0}}function Lf(e,t,n=Date.now()){try{e.setItem(Ff,JSON.stringify({v:1,clean:!!t,at:n}))}catch{}}var Rf=`openaero_hand_v1`;function zf(e){try{let t=JSON.parse(e.getItem(`openaero_hand_v1`)||`null`);return!!t&&t.v===1&&t.left===!0}catch{return!1}}function Bf(e,t,n=Date.now()){try{e.setItem(Rf,JSON.stringify({v:1,left:!!t,at:n}))}catch{}}var Vf=`openaero_prefs_v1`;function Hf(e,t,n){let r;try{r=JSON.parse(e().getItem(Vf))}catch{}r?.v!==1&&(r={});let i=r.camera;return{sound:r.sound!==!1,camera:Number.isInteger(i)&&i>=0&&i<n?i:0,mission:t.includes(r.mission)?r.mission:null}}function Uf(e,{sound:t,camera:n,mission:r},i=Date.now()){try{e().setItem(Vf,JSON.stringify({v:1,sound:t,camera:n,mission:r,at:i}))}catch{}}var Wf=`openaero_haptics_v1`,Gf=[40];function Kf(e,t=!1,n=!1){let r=Math.max(0,-e)||0;return t||r<240?Gf:r<=600||n?[80]:[80,40,120]}var qf={stall:[40,60,40,60,40],pullup:[120,80,120]},Jf=(e,t=!1)=>t?null:qf[e]??null;function Yf(e=3){let t=!1,n=-1/0;return(r,i)=>{let a=r&&!t&&i-n>=e;return a&&(n=i),t=r,a}}var Xf=e=>typeof e?.vibrate==`function`;function Zf(e,t){if(!t||!Xf(e)||e.userActivation?.hasBeenActive===!1)return!1;try{return e.vibrate(t)!==!1}catch{return!1}}function Qf(e){try{let t=JSON.parse(e.getItem(`openaero_haptics_v1`)||`null`);return t&&t.v===1&&typeof t.on==`boolean`?t.on:!0}catch{return!0}}function $f(e,t,n=Date.now()){try{e.setItem(Wf,JSON.stringify({v:1,on:!!t,at:n}))}catch{}}function ep(e){return Math.max(e-145,72)}var tp=-131,np={dx:8,w:56,h:22};function rp(e){return e>=390?tp:Math.max(tp,64-e/2)}function ip(e){return e>=390?130:Math.min(130,e/2-4-np.dx-np.w)}function ap(e,t,n,r=130){return n.x=Math.round(e+r+12),n.y=Math.round(t+np.h/2+2),n.w=26,n.h=13,n}function op(e){let t=e.toFixed(1);return t===`-0.0`?`0.0`:t}function sp(e,t,n,r){let i=e-(t-n)*2;return r.y=i,r.tick=i>=e+-90&&i<=e- -90,r.top=e+-90,r.bot=Math.min(i,e- -90),r.show=r.bot>r.top,r}var cp=1.1;function lp(e,t,n,r){let i=e+-90,a=e- -90,o=e-(t-n)*2,s=e-(t*cp-n)*2;return r.redTop=Math.max(i,o),r.redBot=a,r.red=r.redTop<a,r.amberTop=Math.max(i,s),r.amberBot=Math.min(a,r.redTop),r.amber=r.amberTop<r.amberBot,r}function up(e,t=30,n=2){return e===e?Math.max(-n,Math.min(n,e))*t:0}function dp(e){return ep(e)+24+4}var fp=1.5;function pp(e,t,n=!0){return!n||!(e>0&&t>0)?1:Math.min(fp,Math.max(1,Math.min(e,t)/600))}function mp(e,t){if(!(e>0&&t>0))return 62;let n=2*Math.atan(Math.tan(60*Math.PI/360)/(e/t))*(180/Math.PI);return Math.min(80,Math.max(62,n))}function hp(e,t,n={x:0,y:0,w:68,h:50},r=!1){let i=e/2,a=t/2,o=Math.min(a+-90-2,t*.35);if(o-50>=72)n.x=Math.min(i+126,e-68-2),n.y=o-50;else if(n.x=Math.min(i+192,e-68-2),n.y=Math.max(a+-90,72),r){n.x=e-n.x-68;let r=Math.min(128,Math.max(56,i-207));n.y=Math.max(72,t-33-r-4-50)}return n.w=68,n.h=50,n}function gp(e,t,n){return n<1500&&e.distM<2e4&&e.distM>-((t||4e3)+300)&&Math.abs(e.crossM)<1500}function _p(e,t,n){return e==null||!(Math.round(t)>=2)?null:((e-n+180)%360+360)%360}function vp(e,t,n={},r=!1,i=!1){let a=Math.round(e.windKts||0),o=e.windDirDeg===null||e.windDirDeg===void 0;n.live=!!e.live,n.wet=!!e.wetRunway;let s=/IFR/.test(e.fltCat)&&e.fltCat;if(n.bumpy=!!r,n.storm=!!i,n.source=n.storm?`雷暴`:n.wet?`道面湿滑`:s?`${s} ${n.live?`实况`:`场景`}`:n.bumpy?`颠簸 ${n.live?`实况`:`场景`}`:n.live?`实况风`:`场景风`,n.calm=a<2,n.dirDeg=o?null:e.windDirDeg,n.kts=a,n.speed=n.calm?`静风`:`${o?`VRB`:String(Math.round(e.windDirDeg)%360).padStart(3,`0`)}/${a}${e.gustKts>e.windKts?`G${Math.round(e.gustKts)}`:``}`,n.xwKts=null,n.hwKts=null,n.xw=``,n.hw=``,t&&!n.calm&&!o){let e=Math.round(t.crosswindKts),r=Math.round(t.headwindKts);n.xwKts=e,n.hwKts=r,n.xw=`XW ${Math.abs(e)}${e>0?`R`:e<0?`L`:``}`,n.hw=`${r>=0?`HW`:`TW`} ${Math.abs(r)}`}return n}function yp(e,t=1){let n=e/2;return Math.max(n+132*t,n+e*.12)}function bp(e,t,n,r=1){return n>e/2+-90*r&&t<yp(e,r)}var xp=(e,t)=>{if(t<=e[0][0])return e[0][1];for(let n=1;n<e.length;n++){let[r,i]=e[n];if(t<=r){let[a,o]=e[n-1];return o+(i-o)*(t-a)/(r-a)}}return e[e.length-1][1]},Sp=(e,t)=>(10*e/101325/Math.sqrt(t/288.15)-1)/9;function Cp(e,t,n,r,i,a){let o=e.engine;if(!o)return t*e.maxThrustN;if(o.type===`piston-prop`){let i=xp(o.thrustTableN,n)*Sp(r.pressurePa,r.tempK),s=(o.windmillCd??0)*a*e.wingAreaM2;return t*i-(1-t)*s}let[s,c]=o.machLapse,l=o.staticThrustN*r.sigma**+o.densityExp*Math.max(0,1-s*i+c*i*i),u=o.idleFraction??0;return l*(u+(1-u)*t)}function wp(e,t,n,r){let i=e.engine;if(!i)return n;let a=n>t&&i.type===`turbofan`?i.spoolTau*(1+2*(1-t)*(1-t)):i.spoolTau;return t+(n-t)*Math.min(1,r/a)}function Tp(e,t,n,r,i,a){let o=Cp(e,0,n,r,i,a),s=Cp(e,1,n,r,i,a);return Math.max(0,Math.min(1,(t-o)/(s-o)))}var Ep=[`关`,`1`,`2`,`3`,`最大`],Dp=[0,10,25,40],Op=.3048,kp=.514444,Ap={gear:{extendS:6,retractS:5},flaps:{degPerS:5},brakes:{tauS:.3,muMax:.45,tirePsi:300,antiSkid:.8}},jp=e=>({gear:e.systems?.gear??Ap.gear,flaps:e.systems?.flaps??Ap.flaps,brakes:e.systems?.brakes??Ap.brakes,autobrake:e.systems?.autobrake??null,reverser:e.systems?.reverser??null,hydraulics:e.systems?.hydraulics??null}),Mp=e=>e.flapDetentsDeg??Dp;function Np(e,t){if(t<=e[0])return 0;for(let n=1;n<e.length;n++)if(t<=e[n])return n-1+(t-e[n-1])/(e[n]-e[n-1]);return e.length-1}function Pp(e,t){let n=Mp(e),r=Math.min(t.flapsIndex??0,n.length-1),i=jp(e).flaps.loadRelief;return i&&r===i.fromIndex&&(t.iasKts??0)>i.aboveKts?n[i.toIndex]:n[r]}var Fp=e=>(e.gearPos??+!!e.gearDown)>=1,Ip=e=>{let t=e.gearPos??+!!e.gearDown;return t>0&&t<1};function Lp(e,t){t.gearPos=e.fixedGear||t.gearDown?1:0,t.flapDeg=Mp(e)[Math.min(t.flapsIndex??0,Mp(e).length-1)],t.flapPos=Np(Mp(e),t.flapDeg),t.brakePress=+!!t.brakesOn,t.autobrakeActive=!1,t.reverserPos=0,t.reverseCmd=!1,t.hydPsi=jp(e).hydraulics?.psi??0,t._gs=null,t.decelMps2=0}function Rp(e,t,n){(e.gearPos===void 0||e.flapDeg===void 0)&&Lp(t,e);let r=jp(t);if(r.hydraulics&&(e.hydPsi=r.hydraulics.psi),t.fixedGear)e.gearPos=1;else{let t=e.gearDown,i=1/(t?r.gear.extendS:r.gear.retractS);e.gearPos=Math.min(1,Math.max(0,e.gearPos+(t?i:-i)*n))}let i=Pp(t,e),a=r.flaps.degPerS*n;e.flapDeg+=Math.max(-a,Math.min(a,i-e.flapDeg)),e.flapPos=Np(Mp(t),e.flapDeg);let o=Math.hypot(e.vel.x,e.vel.z);if(e._gs!==null&&n>0&&(e.decelMps2+=((e._gs-o)/n-e.decelMps2)*Math.min(1,n/.15)),e._gs=o,r.reverser){e.onGround||(e.reverseCmd=!1);let t=+!!e.reverseCmd,i=n/r.reverser.deployS;e.reverserPos=Math.min(1,Math.max(0,e.reverserPos+(t>e.reverserPos?i:-i)))}let s=+!!e.brakesOn;if(r.autobrake&&e.autobrake>0){let t=e.throttle<.05||e.reverserPos>0;if(e.onGround?e.brakesOn||!t?(e.autobrake=0,e.autobrakeActive=!1):!e.autobrakeActive&&o>30*kp&&(e.autobrakeActive=!0,e._abI=e.autobrake===4?1:.3):e.autobrakeActive=!1,e.autobrakeActive){if(o<3*kp)e.autobrakeActive=!1,e.autobrake=0;else{let t=r.autobrake.decelFtS2[e.autobrake]*Op-e.decelMps2;e._abI=Math.min(1,Math.max(0,e._abI+t*.5*n)),s=Math.max(s,Math.min(1,Math.max(0,e._abI+t*.06)))}}}else e.autobrakeActive=!1;e.brakePress+=(s-e.brakePress)*Math.min(1,n/r.brakes.tauS)}var zp=[[50,-.035,.306,-.851,.883],[100,-.0437,.32,-.805,.804],[200,-.0331,.252,-.658,.692],[300,-.0401,.263,-.611,.614]],Bp=(e,t)=>((e[1]*t+e[2])*t+e[3])*t+e[4];function Vp(e,t){let n=Math.min(2,Math.max(0,t/100)),r=Math.min(300,Math.max(50,e)),i=0;for(;i<zp.length-2&&r>zp[i+1][0];)i++;let a=zp[i],o=zp[i+1];return Bp(a,n)+(Bp(o,n)-Bp(a,n))*(r-a[0])/(o[0]-a[0])}var Hp=.03;function Up(e,t,n=!1,r=0){let i=e.systems?.brakes??Ap.brakes,a=Hp+(i.muMax-Hp)*Math.min(1,Math.max(0,t));return n?Math.max(Hp,Math.min(a,Vp(i.tirePsi??Ap.brakes.tirePsi,r)*(i.antiSkid??Ap.brakes.antiSkid))):a}function Wp(e,t,n){let r=jp(e).reverser;return!r||!(n>0)?t:t*(1-n*(1+r.effectiveness))}var Gp=new z,Kp=new z,qp=new z,Jp=new z,Yp=new z,Xp=new He,Zp=10,Qp=new WeakMap;function $p(e){let t=Qp.get(e);if(t)return t;let n=e.gear,r=n.noseZ+n.mainZ,i=n.mainZ/r,a=[i,(1-i)/2,(1-i)/2].map(t=>t*e.massKg*ut),o=a.map(e=>e/ut),s=a.map(e=>e/n.strokeM),c=s.map((e,t)=>2*(n.zeta??.6)*Math.sqrt(e*o[t])),l=-(e.gearHeight+n.strokeM),u=[new z(0,l,-n.noseZ),new z(-n.trackM/2,l,n.mainZ),new z(n.trackM/2,l,n.mainZ)];return n.tail&&(u.push(new z(0,l+n.tail[1],n.mainZ+n.tail[0])),s.push(29e4),c.push(4e3)),t={wheelbase:r,noseShare:i,k:s,d:c,wheels:u,maxStroke:n.strokeM*2.5},Qp.set(e,t),t}function em(e,t,n,r,i=0){let a=$p(t);Yp.copy(e.angVel).applyQuaternion(e.quat),Xp.copy(e.quat).invert();let o=0;e.mainPitchMomentNm=0;let s=e.wheelLoads||=a.wheels.map(()=>0);for(let t=0;t<a.wheels.length;t++){Gp.copy(a.wheels[t]).applyQuaternion(e.quat);let c=e.pos.y+Gp.y,l=e.groundY-c;Kp.copy(Yp).cross(Gp).add(e.vel);let u=1;if(t===3&&i>0){let e=l-Kp.y*i;if(l<=0&&e<=0){s[t]=0;continue}l>0&&e>0?l=(l+e)/2:(u=Math.max(l,e)/Math.abs(e-l),l=Math.max(l,e)/2)}if(l<=0){s[t]=0;continue}let d=a.d[t]*(Kp.y>0&&t<3?3:1),f=u*Math.max(0,a.k[t]*(Math.min(l,a.maxStroke)+Zp*Math.max(0,l-a.maxStroke))-d*Kp.y);s[t]=f,t<3&&(o+=f),n.y+=f,qp.set(0,f,0),Jp.copy(Gp).cross(qp).applyQuaternion(Xp),r.add(Jp),t&&t<3&&(e.mainPitchMomentNm-=Jp.x)}return o}function tm(e,t,n,r,i,a){let o=e.wheelLoads,s=e.surfaceMu??.03,c=Math.max(s,Up(t,e.brakePress??0,e.wetRunway,Math.abs(r)*vt));if(Math.abs(r)<=.3){let e=s*Math.max(0,o[0])+c*(Math.max(0,o[1])+Math.max(0,o[2])),a=i.x*n.x+i.z*n.z,l=Math.max(-e,Math.min(e,-a-r*t.massKg*2));i.x+=n.x*l,i.z+=n.z*l;return}let l=$p(t);Xp.copy(e.quat).invert();let u=-Math.sign(r);for(let t=0;t<l.wheels.length;t++){if(!(o[t]>0))continue;let r=u*(t?t<3?c:.5:s)*o[t];qp.set(n.x*r,0,n.z*r),i.x+=qp.x,i.z+=qp.z,Gp.copy(l.wheels[t]).applyQuaternion(e.quat),Jp.copy(Gp).cross(qp).applyQuaternion(Xp),a.add(Jp)}}function nm(e,t,n){let r=$p(t);if(!(e.wheelLoads?.[0]>0))return null;let i=-(e.rudderInput??0)*(t.gear.steerDeg??7)*Math.PI/180;return n*Math.tan(i)/r.wheelbase}var rm=.5;function im(e,t,n,r){let i=$p(t),a=Math.max(0,e.wheelLoads[0]),o=a/(i.noseShare*t.massKg*ut),s=rm*a*i.wheelbase/t.inertia.yaw*r,c=n*Math.min(1,r*30*Math.min(1,o));return Math.max(-s,Math.min(s,c))}var am=.8;function om(e,t,n,r){let i=t.gear,a=e.wheelLoads,o=am*(Math.max(0,a[0])*i.noseZ+(Math.max(0,a[1])+Math.max(0,a[2]))*i.mainZ)/t.inertia.yaw*r;return Math.max(-o,Math.min(o,n))}function sm(e,t,n){let r=e.mainPitchMomentNm??0;if(!(r>0))return 0;let i=Math.min(1,(n/(.8*(t.gearVrKts??t.vrKts??t.vrefKts)))**2);return-(e.elevInput??0)*i*r/t.inertia.pitch}function cm(e,t){if(!t.gear)return Math.max(0,e.pos.y-e.groundY-t.gearHeight);let n=$p(t),r=e.quat,i=1/0;for(let e=1;e<3;e++)Gp.copy(n.wheels[e]).applyQuaternion(r),Gp.y<i&&(i=Gp.y);return Math.max(0,e.pos.y+i-e.groundY)}var lm=new z,um=new z,dm=new z,fm=new z,pm=new He,mm=new lt(0,0,0,`YXZ`),hm={},gm=new z,_m=20*B,vm=90*B,ym=.5;function bm(e,t,n){Rp(e,t,n);let r=pm.copy(e.quat).invert(),i=lm.copy(e.vel).sub(e.windVec).applyQuaternion(r),a=-i.z,o=i.x,s=-i.y,c=ld(e.pos.y+(e.mslOffsetM??0),e.isaDevC??0,e.altimInHg??29.92,hm);e.sigma=c.sigma;let l=Math.max(.1,i.length());e.tasKts=l*vt,e.iasKts=e.tasKts*Math.sqrt(c.sigma),e.gsKts=Math.round(Math.hypot(e.vel.x,e.vel.z)*vt),e.mach=l/c.speedOfSoundMps;let u=Math.atan2(s,Math.max(a,.1));e.aoaDeg=u*V;let d=Math.asin(P.clamp(o/l,-1,1));e.betaDeg=d*V;let f=Cs(l,c.rho),p=Ds(t,u,e.flapPos);t.clElevator&&(e.elevLiftK=e.onGround?0:Math.min(1,(e.elevLiftK??1)+n/ym),e.elevLiftK>0&&(p+=xm(t,e.elevInput,e.trimAlphaDeg??e.aoaDeg,e.aoaDeg)*e.elevLiftK));let m=Fs(e.pos.y-e.groundY,t.wingSpanM),h=zs(t,p,e.gearPos,e.flapPos,m,e.mach);if(t.groundSpoilers){let r=e.onGround&&(e.throttle<.05||e.reverserPos>0)?1:0;e.spoilers=P.clamp((e.spoilers??0)+Math.sign(r-(e.spoilers??0))*n,0,1),p*=1-t.groundSpoilers.liftDump*e.spoilers,h+=t.groundSpoilers.dCd*e.spoilers}let g=p*f*t.wingAreaM2,_=h*f*t.wingAreaM2;e.engineN=wp(t,e.engineN??e.throttle,e.engineFailed?0:e.throttle,n);let v=Wp(t,Cp(t,e.engineN,l,c,e.mach,f),e.reverserPos),y=dm.copy(i).divideScalar(l),b=fm.set(1,0,0).cross(y).normalize(),x=P.clamp(d,-_m,_m),S=e.rudderInput*(t.controlThrowsDeg?.rudder??0)*B,C=((t.cyBeta??0)*x-(t.cyRudder??0)*S)*f*t.wingAreaM2,w=b.x*g-y.x*_+C,T=b.y*g-y.y*_,E=b.z*g-y.z*_-v,D=um.set(w,T,E).applyQuaternion(e.quat);D.y-=t.massKg*ut;let O=Fp(e),k=O&&t.gear;gm.set(0,0,0);let ee=k?e.groundY+t.gearHeight+t.gear.strokeM-$p(t).maxStroke:e.groundY+t.gearHeight*(O?1:.35),te=0,A=!1;if(k)e.pos.y<=e.groundY+t.gearHeight+t.gear.noseZ+1&&(te=em(e,t,D,gm,n));else if(e.pos.y<=ee+.01){let n=ee-e.pos.y,r=t.massKg*85,i=t.massKg*9;te=Math.max(0,n*r-e.vel.y*i,-D.y),D.y+=te,te=Math.max(te,1e-6)}if(te>0){e.onGround=!0;let n=dm.set(0,0,-1).applyQuaternion(e.quat);n.y=0,n.normalize();let r=e.vel.x*n.x+e.vel.z*n.z,i=e.vel.x-n.x*r,a=e.vel.z-n.z*r;if(k)tm(e,t,n,r,D,gm);else{let i=O?Up(t,e.brakePress,e.wetRunway,Math.abs(r)*vt):.5,a=Math.abs(r)>.3?-Math.sign(r)*i*te:-r*t.massKg*2;D.x+=n.x*a,D.z+=n.z*a}let o=.8*te,s=-i*t.massKg*4,c=-a*t.massKg*4,l=D.x*n.x+D.z*n.z;A=k&&Math.abs(r)<=.3&&Math.hypot(i,a)<=.3&&Math.abs(l)<=t.massKg*.6,A&&(s-=D.x-n.x*l,c-=D.z-n.z*l),D.x+=P.clamp(s,-o,o),D.z+=P.clamp(c,-o,o),e.vAlongMps=r}else e.onGround=!1;let ne=D.divideScalar(t.massKg);e.accelY=ne.y,e.loadFactor=fm.set(0,1,0).applyQuaternion(e.quat).dot(ne)/ut+fm.y,e.vel.addScaledVector(ne,n),e.pos.addScaledVector(e.vel,n),e.onGround||(e.lastAirVsi=Math.round(e.vel.y*dt*60)),e.pos.y<ee&&(e.pos.y=ee,e.vel.y<0&&(e.vel.y=0));let re=t.pitchAuthority??1.8;(e.autoTrim||t.pitchFbw||e.trimAlphaDeg==null)&&(e.trimAlphaDeg=e.aoaDeg);let ie=t.elevatorAlphaDeg?re/(t.elevatorAlphaDeg*B):0,ae=t.pitchBreak,oe=P.clamp(u+(ae?ae.breakDeg(e.aoaDeg)*B:0)-e.trimAlphaDeg*B,-vm,vm),se=-e.elevInput*re/t.pitchDamping*(ae?ae.eta(e.aoaDeg,e.elevInput):1);t.fbw&&(se=t.fbw(e,t,se,u,T,l,f));let ce=(se*t.pitchDamping-ie*oe-e.angVel.x*t.pitchDamping)*(l/120),le=0;if(t.cmAlphaDot&&n>0){let r=e.aoaPrevRad,i=r==null?0:P.clamp((u-r)/n,-2,2),a=r==null?0:(e.aoaRateF??0)+(i-(e.aoaRateF??0))*Math.min(1,n/.08);e.aoaRateF=a,e.aoaPrevRad=u;let o=t.wingAreaM2/t.wingSpanM;l>10&&(le=f*t.wingAreaM2*o*t.cmAlphaDot*(o/(2*l))*a/t.inertia.pitch)}let ue=Tm(t,d),j=t.prop&&!e.onGround?Dm(t,v,f):0;e.propAil=j;let de=Cm(t,l),fe=(-(e.aileronInput+ue-j)*(e.onGround?Math.min(de,Sm(t)):de)-e.angVel.z)*t.rollDamping*(l/120),M=(-e.rudderInput*1.2+tu(d)-e.angVel.y*t.yawDamping)*(l/120);if(e.angVel.x+=(ce+le)*n,e.angVel.y+=M*n,e.angVel.z+=fe*n,k){e.angVel.x+=(gm.x/t.inertia.pitch+sm(e,t,e.iasKts))*n,e.angVel.y+=gm.y/t.inertia.yaw*n,e.angVel.z+=gm.z/t.inertia.roll*n;let r=nm(e,t,e.vAlongMps??0);r!==null&&(e.angVel.y+=(A?om:im)(e,t,r-e.angVel.y,n))}Math.abs(e.aileronInput-j)*de<.05*Sm(t)&&!e.apMaster&&(e.angVel.z-=e.angVel.z*1.5*n);let pe=pm.set(e.angVel.x*n*.5,e.angVel.y*n*.5,e.angVel.z*n*.5,1).normalize();if(e.quat.multiply(pe).normalize(),e.onGround){mm.setFromQuaternion(e.quat,`YXZ`);let n=t.gear?.tail?2:(t.maxGroundPitchDeg??15)*B,r=k?-.12:-.05;(mm.x>n||mm.x<r)&&(mm.x=P.clamp(mm.x,r,n),e.quat.setFromEuler(mm),(mm.x>=n&&e.angVel.x>0||mm.x<=r&&e.angVel.x<0)&&(e.angVel.x=0))}}function xm(e,t,n,r){let i=P.clamp(r,-.2*V,e.alphaStallDegByFlap[0]),a=e.pitchBreak?e.pitchBreak.eta(i,t):1;return e.clElevator*e.elevatorPerAlpha*B*(t*e.elevatorAlphaDeg+(i-n)/a)}var Sm=e=>(e.rollAuthority??2.8)/e.rollDamping,Cm=(e,t)=>e.rollPerTas?Math.min(e.rollCmdRad??9,e.rollPerTas*t):Sm(e),wm=(e,t)=>Math.min(4,Sm(e)/Math.max(.01,Cm(e,t))),Tm=(e,t)=>e.clBeta&&e.clAileron?e.clBeta*P.clamp(t,-_m,_m)/e.clAileron:0,Em=(e,t)=>e.prop?Math.max(0,t)*e.prop.torqueArmM:0,Dm=(e,t,n)=>Math.min(1,Em(e,t)/(e.clAileron*Math.max(n,1)*e.wingAreaM2*e.wingSpanM));function Om(e,t,n,r,i=!0,a=ld(0)){let o=Xl(e,t,n)*B,s=Ds(e,o,n),c=Cs(t),l=t/Math.sqrt(a.sigma),u=l/a.speedOfSoundMps;return Tp(e,(zs(e,s,i,n,1,u)*c*e.wingAreaM2+e.massKg*ut*Math.sin(r*B))/Math.cos(o),l,a,u,c)}var km=[2,1.5,1.25,1],Am=1e3;function jm(e){let t=Math.min(e>0&&Number.isFinite(e)?e:1,km[0]);return[t,...km.filter(e=>e<t)]}function Mm(e){let t=jm(e);return{ladder:t,rung:0,ratio:t[0],winMs:0,winN:0,fastS:0,coolS:5,sinceUpS:1/0,sinceDownS:0,longRun:0,graceMs:Am}}function Nm(e){e.winMs=0,e.winN=0,e.fastS=0,e.longRun=0,e.graceMs=Am}function Pm(e,t){if(!(t>0))return!1;if(t>250){if(++e.longRun<3)return!1;t=250}else e.longRun=0;if(e.graceMs>0)return e.graceMs-=t,!1;if(e.winMs+=t,e.winN++,e.winMs<1e3)return!1;let n=e.winMs/1e3,r=e.winMs/e.winN;return e.winMs=0,e.winN=0,e.sinceUpS+=n,e.sinceDownS+=n,e.sinceDownS>=120&&(e.coolS=5),r>22?(e.fastS=0,e.rung>=e.ladder.length-1?!1:(e.sinceUpS<=3&&(e.coolS=Math.min(e.coolS*2,60)),e.sinceDownS=0,e.ratio=e.ladder[++e.rung],!0)):r>=13?(e.fastS=0,!1):(e.fastS+=n,e.rung===0||e.fastS<e.coolS?!1:(e.fastS=0,e.sinceUpS=0,e.ratio=e.ladder[--e.rung],!0))}var K=e=>document.getElementById(e),q={paused:!1,pitchIn:0,rollIn:0,aircraftKey:`b738`,spec:ss.b738,pos:new z(0,390,7408),vel:new z(0,-3.6,-72),quat:new He,angVel:new z(0,0,0),iasKts:140,tasKts:144,gsKts:122,mach:.22,vsiFpm:-700,aglFt:1270,raFt:1258,mslFt:1876,loadFactor:1,aoaDeg:2.4,betaDeg:0,throttle:.44,elevInput:0,aileronInput:0,rudderInput:0,flapsIndex:2,flapAngles:[0,10,25,40],spoilers:0,propAil:0,aoaPrevRad:null,aoaRateF:0,gateVsFpm:null,gearDown:!0,brakesOn:!1,onGround:!1,autobrake:0,reverseCmd:!1,speedLimitKts:null,overspeed:!1,stallKts:null,groundY:0,mslOffsetM:Lo,isaDevC:0,altimInHg:29.92,sigma:1,fm:{stepFlightModel:bm,trimThrottle:Om,rollHoldScale:wm},apMaster:!1,apHdgHold:!1,apAltHold:!1,apApproach:!1,apPrevIasKts:null,apIasRate:0,apGsIntegral:0,apGsEndId:null,apAt:{trim:0},targetHdgDeg:360,targetAltFt:1880,hudHdg:``,cameraMode:0,cameraNames:[`三维座舱`,`环绕追踪`,`地面观测`,`翼尖`,`机场塔台`,`尾部跟拍`],orbitYaw:0,orbitPitch:.2,orbitDist:48,mouseYoke:!1,timeOfDayMode:0,satelliteEnabled:!1,wx:nu(),wxByIcao:{},crosswindMission:null,dynamicMissions:[],loadedMission:null,windVec:new z,windNowKts:0,hudWind:vp(nu(),null),hudScale:1,simTime:0,wasOnGround:!1,airborneTime:0,lastAirVsi:0,landingGraded:!1,lastLanding:null,audioEnabled:!1,lastCalloutIdx:-1,takeoffCalloutIdx:-1,takeoffCalls:[],takeoffCallShownUntil:0,gateState:{armed:!1,armFt:500,done:!1},gate:null,gateLines:[],gateShownUntil:0,goAround:null,stallDrill:null,wake:null,shortField:null,noFlap:null,wingLow:null,touchYaw:0,deadStick:null,engineOut:null,softField:null,shortTakeoff:null,xwTakeoff:null,surfaceMu:null,rto:null,windshear:null,engineFailed:!1,stick:{x:0,y:0,active:!1},touchTrim:0,trimUsed:!1,mouseStick:{x:0,y:0},assist:gd,activeEnd:null,missionKey:`kdfw_35c_final`,approach:{distM:0,crossM:0,heightAbovePathM:0,pathHeightM:0},ilsLocDots:0,ilsGsDots:0,ilsLocBarPx:null,ilsGsBarPx:null,rwySelectTimer:0,pad:null,inputSource:`keyboard`,papiWhite:null},Fm=new z,Im=new z,Lm=new z,J=new lt(0,0,0,`YXZ`),Rm=K(`simCanvas`),zm=K(`hudCanvas`),Y=zm.getContext(`2d`),Bm=K(`mapCanvas`),X=Bm.getContext(`2d`),Vm,Hm,Z,Um,Wm,Gm,Km,qm,Jm,Ym=[],Xm={flame:null,parts:null,model:null},Zm=null,Qm=Mm(window.devicePixelRatio||1),$m=!1,eh={lost:!1,pausedIt:!1,hidPaused:!1,reloadTimer:0};try{Vm=new Io({canvas:Rm,antialias:!0,powerPreference:`high-performance`}),Vm.setPixelRatio(Qm.ratio),Vm.setSize(window.innerWidth,window.innerHeight),Vm.toneMapping=4,Vm.toneMappingExposure=1.05,Vm.debug.checkShaderErrors=!1}catch(e){console.error(`Three.js renderer init failure:`,e)}Hm=new Rt,Hm.background=new s(3718648),Hm.fog=new Lt(9741240,35e-6);var th=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,nh=null,rh=null,ih=null,ah,oh,sh=null,ch=null,lh=null,uh=0;Z=new Fr(mp(window.innerWidth,window.innerHeight),window.innerWidth/window.innerHeight,.5,95e3);var dh=Math.PI;Um=new zr(14412542,.85*dh),Hm.add(Um),Wm=new Rr(16776171,1.4*dh),Wm.position.set(-4500,7500,3500),Hm.add(Wm);var fh={elevationDeg:50,azimuthDeg:210},ph={x:0,y:0,z:0},mh=K(`calloutCaption`),hh=Mf(e=>{mh.replaceChildren(...e.split(` · `).flatMap((e,t)=>{let n=document.createElement(`span`);return e.length<=26&&(n.className=`whitespace-nowrap`),n.textContent=Tf(e),t?[` · `,n]:[n]})),mh.classList.toggle(`hidden`,!e)}),gh=(e,t)=>hh.say(q.assist===`pilot`?Of(e):Af(Of(e)),performance.now()/1e3,t),_h=Nf(q,vh,gh);function vh(){let e=K(`txtAudioState`),t=K(`btnAudio`);q.audioEnabled?(e.textContent=`开`,e.className=`text-emerald-400 font-bold`,t.classList.add(`active`)):(e.textContent=`关`,e.className=`text-amber-400 font-bold`,t.classList.remove(`active`),_h.mute())}var yh=Jo(bc),bh={imagery:-5,base:-4,runway:-3,marking:-2},xh={base:8,runway:-2,marking:-4},Sh=[],Ch=new s,wh=new s,Th=new z;function Eh(e,t,n){let r=xh[n]??0,i=r<0,a=new Cn({...e,depthWrite:!i,side:i?2:0,polygonOffset:r!==0,polygonOffsetFactor:Math.sign(r),polygonOffsetUnits:r});return a.userData.order=t,a.userData.baseColor=a.color.clone(),Sh.push(a),Dh(a),a}function Dh(e){let t=Math.max(0,Th.copy(Wm.position).normalize().y);wh.copy(Wm.color).multiplyScalar(Wm.intensity*t),Ch.copy(Um.color).multiplyScalar(Um.intensity).add(wh).multiplyScalar(1/Math.PI);for(let t of e?[e]:Sh)t.color.copy(t.userData.baseColor).multiply(Ch);e||qm?.setTint(Ch),fu.uGroundTint.value.copy(Ch).multiplyScalar(1/Oh),yu(xu(fh.elevationDeg))}var Oh=(()=>{let e=zc(60),t=new s(e.ambient).multiplyScalar(e.ambientIntensity).add(new s(e.sun).multiplyScalar(e.sunIntensity*Math.sin(60*B)));return t.r*.2126+t.g*.7152+t.b*.0722})();function kh(e,t,n,r,i,a,o,s,c){let l=Math.cos(r),u=Math.sin(r),d=[[i-o/2,a-s/2],[i+o/2,a-s/2],[i+o/2,a+s/2],[i-o/2,a+s/2]].map(([e,r])=>[t+e*l+r*u,n-e*u+r*l]);for(let t of[0,2,1,0,3,2])e.push(d[t][0],c,d[t][1])}function Ah(e,t,n){for(let t=0;t<e.length;t+=3)e[t+1]+=yh.heightAt(e[t],e[t+2]);let r=new dn;r.setAttribute(`position`,new o(e,3)),r.computeVertexNormals();let i=new H(r,t);return i.renderOrder=n,i}function jh(){let e=[],t=[];for(let n of bc){let r=Math.PI-n.hdgT*B,i=n.lengthM/2;kh(e,n.cx,n.cz,r,0,0,n.widthM,n.lengthM,0);for(let e=-i+120;e<i-120;e+=61)kh(t,n.cx,n.cz,r,0,e,.9,36.6,0);n.ends.forEach((e,a)=>{let o=wc(e),s=a===0?-1:1,c=s*(i-o.displacedM),l=-s,u=Math.max(4,Math.floor((n.widthM-6)/3.6));for(let e=0;e<u;e++){let i=-((u-1)*3.6)/2+e*3.6;kh(t,n.cx,n.cz,r,i,c+l*26,1.8,45,0)}kh(t,n.cx,n.cz,r,0,c+l*1.5,n.widthM-2,3,0);for(let e of[-1,1])kh(t,n.cx,n.cz,r,e*n.widthM*.22,c+l*327,9,45,0)});for(let e of[-1,1])kh(t,n.cx,n.cz,r,e*(n.widthM/2-1),0,.9,n.lengthM,0)}Ym.push(Ah(e,Eh({color:1843241},bh.runway,`runway`),bh.runway)),Hm.add(Ym[0]);let n=new Cn({color:15857145,depthWrite:!1,side:2,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:xh.marking});Ym.push(Ah(t,n,bh.marking)),Hm.add(Ym[1]);let r=new Float32Array(yc.length*4*3),i=new Float32Array(yc.length*4*3);yc.forEach((e,t)=>{let n=_c(e.hdgT),a={x:n.z,z:-n.x};for(let o=0;o<4;o++){let s=e.widthM/2+15+o*9,c=(t*4+o)*3;r[c]=e.thrX+n.x*305+a.x*s,r[c+2]=e.thrZ+n.z*305+a.z*s,r[c+1]=yh.heightAt(r[c],r[c+2])+1.5,i[c]=1,i[c+1]=.13,i[c+2]=.13}});let a=new dn;a.setAttribute(`position`,new d(r,3)),a.setAttribute(`color`,new d(i,3)),Zm=new qn(a,new Hn({size:5,sizeAttenuation:!1,vertexColors:!0})),Hm.add(Zm),G(async()=>{let{createRunwayLights:e,createLandingLight:t,createTouchdownFeel:n}=await import(`./runwayLights-Bbu1aGk0.js`);return{createRunwayLights:e,createLandingLight:t,createTouchdownFeel:n}},__vite__mapDeps([5,4,3,2,6]),import.meta.url).then(({createRunwayLights:e,createLandingLight:t,createTouchdownFeel:n})=>{rh=e({runways:bc,endById:wc,heightAt:yh.heightAt,reducedMotion:th}),Hm.add(rh.points),Hm.add((ah=t(q,()=>Gm,yh.heightAt)).group),Hm.add((oh=n(q,()=>Gm,_h,th)).group)}).catch(console.warn),G(async()=>{let{createWindsocks:e}=await import(`./windsock-BjZcmNQB.js`);return{createWindsocks:e}},__vite__mapDeps([7,3,4,2,8]),import.meta.url).then(({createWindsocks:e})=>{ih=e({runways:bc,endById:wc,heightAt:yh.heightAt,gustAt:ou,surfaceFactor:au,reducedMotion:th}),Hm.add(ih.group)}).catch(console.warn),G(()=>import(`./replay-CHgKbIey.js`).then(e=>{sh=e,ch=e.createReplayBuffer()}),[],import.meta.url).catch(()=>{})}function Mh(){Km=new It;let e=new H(new er(16e4,16e4),Eh({color:1779743},bh.base,`base`));e.rotation.x=-Math.PI/2,e.position.y=-90,e.renderOrder=bh.base,Km.add(e),qm=Bu({scene:Km,ground:yh,renderOrder:bh.imagery,maxZoom:window.innerWidth<700?15:16,anisotropy:Math.min(4,Vm?.capabilities.getMaxAnisotropy()||1),sunDir:py()}),Dh(),Rh(),Jm=Xu({scene:Hm,camera:Z,renderer:Vm,base:`./`,storage:Nh(),isMobile:window.innerWidth<700,runwayEnds:yc,onActive:()=>Fh(!0),onUnavailable:()=>Fh(!1)}),Hm.add(Km),jh();let t=(e,t)=>{let n=bs(e);return t.position.x=n.x,t.position.z=n.z,t.userData.landmark=e,Hm.add(t),Ih.push(t),t},n=(e,n,r)=>{let i=ys[e].heightM,a=new H(new Zn(n,i,n),new mr({color:r}));return a.position.y=i/2,t(e,a)},r=n(`bankOfAmericaPlaza`,58,1976635),i=new H(new Zn(60,ys.bankOfAmericaPlaza.heightM,2),new Cn({color:1096065}));i.position.z=30,r.add(i);let a=[r,n(`jpmorganChaseTower`,48,3359061),n(`renaissanceTower`,48,993594),n(`comericaBankTower`,52,4011310)],o=ys.reunionTower.heightM,s=new It,c=new H(new Qn(6,8,o-36,12),new mr({color:9741240}));c.position.y=(o-36)/2,s.add(c);let l=new H(new tr(18,16,16),new Cn({color:3718648,wireframe:!0}));l.position.y=o-18,s.add(l),a.push(t(`reunionTower`,s));for(let e=0;e<24;e++){let t=e*.92,n=180+e%5*110,r=xs.x+250+Math.cos(t)*n,i=xs.z-250+Math.sin(t)*n;if(a.some(e=>Math.max(Math.abs(e.position.x-r),Math.abs(e.position.z-i))<60))continue;let o=80+e*27%110,s=new H(new Zn(36,o,36),new mr({color:e%2==0?1976635:2569545}));s.position.set(r,o/2,i),Hm.add(s),Ih.push(s)}let u=ys.margaretHuntHillBridge,d=new It;d.rotation.y=-u.spanBearingDeg*B;let f=new H(new nr(92,3.5,8,32,Math.PI),new Cn({color:16777215}));f.scale.y=u.heightM/92,f.rotation.y=Math.PI/2,d.add(f),t(`margaretHuntHillBridge`,d);let p=ys.attStadium.heightM,m=new H(new Qn(150,130,p,24),new mr({color:13358561}));m.position.y=p/2,t(`attStadium`,m),Lh()}function Nh(){try{return window.localStorage}catch{return null}}var Ph=!1;function Fh(e){Ph=e;let t=q.satelliteEnabled;qm?.setVisible(t&&!e);for(let t of Ym)t.visible=!e;for(let t of Ih)t.visible=!e;Jm?.setVisible(t),K(`creditsFree`).classList.toggle(`hidden`,e),K(`creditsEsri`).classList.toggle(`hidden`,!t),K(`creditsGoogle`).classList.toggle(`hidden`,!e)}var Ih=[];function Lh(){for(let e of Ih)e.userData.baseY===void 0&&(e.userData.baseY=e.position.y),e.position.y=e.userData.baseY+yh.heightAt(e.position.x,e.position.z)}async function Rh(){try{let e=await fetch(`./${zo}`);if(!e.ok||!e.body||typeof DecompressionStream>`u`)return;let t=await new Response(e.body.pipeThrough(new DecompressionStream(`gzip`))).arrayBuffer();yh.setDem(Wo(new Uint8Array(t)));let n=Yo(yh,Eh({vertexColors:!0},bh.base,`base`));n.renderOrder=bh.base,Km.add(n),Dh(),qm.redrape(),Lh(),rh?.reseat(),ih?.reseat()}catch(e){console.warn(`Terrain elevation unavailable, flying on flat ground:`,e.message)}}function zh(e){Gm&&(Hm.remove(Gm),Gm.traverse(e=>{e.userData.own&&(e.geometry.dispose(),e.material.dispose())})),Gm=new It,Xm={flame:null,parts:null,model:null};let t=new pr({color:15857145,metalness:.25,roughness:.35}),n=new pr({color:165063,metalness:.35,roughness:.3}),i=new pr({color:988970,metalness:.9,roughness:.1}),a=new pr({color:6583435,metalness:.65,roughness:.4}),o=new Cn({color:1976635}),s=new pr({color:13358561,metalness:.3,roughness:.4}),c=(e,t,n,r,i,a,o,{yaw:c=0,pitch:l=0,aft:u=o/2,mat:d=s}={})=>{let f=new It;f.name=e,f.position.set(t,n,r),f.rotation.set(l,c,0);let p=new H(new Zn(i,a,o),d);return p.position.z=u,f.add(p),f};if(e===`b738`){let e=new It,s=[];s.push(new r(.01,-18)),s.push(new r(.9,-17.2)),s.push(new r(1.5,-16)),s.push(new r(1.88,-14)),s.push(new r(1.88,12)),s.push(new r(1.5,15)),s.push(new r(.8,17.5)),s.push(new r(.01,18.5));let l=new H(new $n(s,24),t);l.rotation.x=Math.PI/2,e.add(l);let u=new H(new Zn(2.1,.75,1.8),i);u.position.set(0,.85,-14.6),u.rotation.x=-.22,e.add(u);let d=new H(new Zn(3.82,.45,24),n);d.position.set(0,.1,-1),e.add(d);let f=new H(cs([[0,-3.2],[-17.5,2.5],[-17.5,4],[0,1.2]],-.08,.43),t);f.rotation.x=Math.PI/2,f.position.set(0,-.2,0),e.add(f);let p=f.clone();p.scale.set(-1,1,1),e.add(p);let m=Math.atan2(2.8,17.5),h=e=>1.2+2.8*e/17.5-.1;for(let[t,n]of[[`L`,-1],[`R`,1]]){let r=-n*m;e.add(c(`ctl_flap_${t}`,n*5.6,-.38,h(5.6),7,.12,.7,{yaw:r})),e.add(c(`ctl_aileron_${t}`,n*13.2,-.38,h(13.2),5.6,.12,.6,{yaw:r}))}[-17.5,17.5].forEach((t,r)=>{let i=new H(new Zn(.25,2.4,1.2),n);i.position.set(t,1.1,3.2),i.rotation.z=r===0?.2:-.2,e.add(i)}),[-5.8,5.8].forEach((n,r)=>{let i=new H(new Qn(1.15,1.05,4.4,20),t);i.rotation.x=Math.PI/2,i.position.set(n,-1.35,-1.2),e.add(i);let s=new H(new nr(1.08,.08,8,20),a);s.position.set(n,-1.35,-3.4),e.add(s);let c=new It;c.name=r===0?`fan_L`:`fan_R`,c.position.set(n,-1.35,-3.2);let l=new H(new Qn(.95,.95,.1,16),o);l.rotation.x=Math.PI/2,c.add(l),e.add(c);let u=new H(new Qn(0,.55,1.4,16),a);u.rotation.x=-Math.PI/2,u.position.set(n,-1.35,1.4),e.add(u)});let g=new H(cs([[0,0],[0,6.8],[2.8,6.5],[5.2,0]],-.05,.37),n);g.rotation.y=Math.PI/2,g.position.set(.16,1.6,11.5),e.add(g),e.add(c(`ctl_rudder`,.32,4.4,11.55,.26,4.4,1.1,{mat:n}));let _=new H(new Zn(11.8,.22,2),t);_.position.set(0,1.2,16.1),e.add(_),e.add(c(`ctl_elevator`,0,1.2,17.1,11,.16,.9)),Gm.add(e)}else if(e===`c172`){let e=new It,r=new H(new Zn(1.4,1.5,4.4),t);r.position.set(0,.15,-.2),e.add(r);let i=new H(new Qn(0,.72,1.8,16),t);i.rotation.x=-Math.PI/2,i.position.set(0,0,-3.1),e.add(i);let a=new pr({color:988970,roughness:.1}),s=new H(new Zn(1.42,.7,1.1),a);s.position.set(0,.55,-1.2),s.rotation.x=-.35,e.add(s);let l=new H(new Zn(11,.18,1.25),t);l.position.set(0,.95,-.6),e.add(l);for(let[t,n]of[[`L`,-1],[`R`,1]])e.add(c(`ctl_flap_${t}`,n*1.85,.95,.025,2.3,.1,.4)),e.add(c(`ctl_aileron_${t}`,n*4.25,.95,.025,2.5,.1,.4));let u=new H(new Zn(2.1,.2,.06),o);u.position.set(0,0,-4.05),u.name=`prop`,e.add(u);let d=new H(new Zn(.16,2,1.1),n);d.position.set(0,1.1,3.35),d.rotation.x=.3,e.add(d),e.add(c(`ctl_rudder`,0,1.3,3.9,.12,1.5,.5,{pitch:.3,mat:n}));let f=new H(new Zn(3.6,.12,.45),t);f.position.set(0,.35,3.82),e.add(f),e.add(c(`ctl_elevator`,0,.35,4.05,3.4,.08,.35)),Gm.add(e)}else{let e=new It,t=new H(new Qn(.75,.95,11.5,16),a);t.rotation.x=Math.PI/2,e.add(t);let r=new H(new Qn(0,.75,3.8,16),o);r.rotation.x=-Math.PI/2,r.position.set(0,0,-7.6),e.add(r);let i=new H(new tr(.68,16,12),new pr({color:3718648,roughness:.1,transparent:!0,opacity:.65}));i.scale.set(.85,.72,2.8),i.position.set(0,.62,-3.5),e.add(i);let s=new H(new Zn(9.96,.14,3.3),a);s.position.set(0,0,.55),e.add(s);for(let[t,n]of[[`L`,-1],[`R`,1]])e.add(c(`ctl_aileron_${t}`,n*2.6,0,2.2,2.8,.1,.7)),e.add(c(`ctl_elevator_${t}`,n*2.2,0,5.1,2.4,.1,1.8,{aft:.2}));let l=new H(new Zn(.18,3.2,2.2),n);l.position.set(0,1.7,4),e.add(l),e.add(c(`ctl_rudder`,0,1.7,5.1,.14,2.8,.6,{mat:n}));let u=new H(new Qn(0,.55,3.5,12),new Cn({color:16347926}));u.rotation.x=Math.PI/2,u.position.set(0,0,7.8),e.add(u),Xm.flame=u,Gm.add(e)}Gm.traverse(e=>{e.isMesh&&(e.userData.own=!0)}),Hh(Xm,Gm),Hm.add(Gm),u_?.paint(Gm),Wh(e)}var Bh=null,Vh=G(()=>import(`./surfaces-CgrXa_AV.js`).then(e=>(Bh=e,e)),__vite__mapDeps([9,3]),import.meta.url);function Hh(e,t){Vh.then(n=>{e.parts||=n.rigParts(t)}).catch(()=>{})}var Uh=!1;function Wh(e){let t=Xm;Uh&&G(()=>import(`./aircraftModel-Dbrk9XnU.js`).then(n=>n.attachModel(Gm,e,`./`,t,()=>t===Xm)),__vite__mapDeps([10,4,3,2,9]),import.meta.url).then(()=>u_?.paint()).catch(console.warn)}function Gh(){let e=q.activeEnd;if(!e||q.onGround||q.engineFailed||q.windshear)return;let t=q.gateState,n=(q.pos.y-e.thrY)*dt,r=cc(q.wx)?ac:500,i=q.approach,a=0;t.armed&&n<=t.armFt&&q.vel.y<0&&(a=lc(i.crossM,i.distM+Dv(e),oc));let o=i.distM>0&&i.distM<t.armFt*18&&Math.abs(a)<=3,s=pc(t,n,r,q.vel.y<0,o);if(s===`reset`&&(q.gate=null),s!==`evaluate`)return;let c=q.gate=dc({iasKt:q.iasKts,vref:q.shortField?Fg.GATE_VREF:ks(q.spec,q.flapsIndex),gustAddKts:W_(),vsFpm:q.gateVsFpm??q.vsiFpm,gearDown:Fp(q),flapsOk:qh(G_()),glideDevDots:lc(q.wake?.end.id===e.id?Ng.gateHeightAbovePathM(q.wake,i.heightAbovePathM):i.heightAbovePathM,i.distM+305,sc),locDevDots:a,vmc:t.armFt===500});c.runway=e.id,c.iasKt=Math.round(q.iasKts),c.vsFpm=Math.round(q.gateVsFpm??q.vsiFpm),q.gateLines=[0,3].map(e=>c.failing.slice(e,e+3).map(e=>uc[e]??e).join(` · `)),q.gateShownUntil=q.simTime+6,c.stable||_h.callout(`unstabilized, go around`)}var Kh=null,qh=(e=js(q.spec))=>q.flapsIndex>=e&&q.flapPos>=e-.001,Jh={gate:null,aaeFt:0,vsFpm:0,iasKts:0,throttle:0,flapsIndex:0,onGround:!1},Yh=()=>{let e=q.goAround?.phase;return(e===`goAround`||e===`complete`)&&!q.onGround};function Xh(){let e=q.goAround;if(!e)return;let t=e.end;Jh.gate=q.gate&&q.gate.runway===t.id?q.gate:null,Jh.aaeFt=(q.pos.y-t.thrY)*dt,Jh.vsFpm=q.vsiFpm,Jh.iasKts=q.iasKts,Jh.throttle=q.throttle,Jh.flapsIndex=q.flapsIndex,Jh.onGround=q.onGround;let n=Kh.goAroundState(e,Jh);if(n===`goAround`&&vd(q.assist)?.autoThrottle&&(ry.departing=!0),n!==`complete`)return;let r=vd(q.assist),i=Kh.gradeGoAround({callFt:e.callFt,lowFt:e.lowFt,gateFt:e.gate?e.gate.gateHeight:500,minIasKts:e.minIasKts,vrefKts:ks(q.spec,e.callFlaps),climbFpm:e.climbFpm,flapsUp:r?.autoConfig?null:q.flapsIndex<e.callFlaps}),a={isNewBest:!1,best:null};try{a=bl(window.localStorage,ef(q.missionKey,q.assist),i)}catch{}c_(i,a,t,e.gate)}function Zh(e,t){let n={isNewBest:!1,best:null};try{n=bl(window.localStorage,ef(q.missionKey,q.assist),e)}catch{}K_(0),c_(e,n,t,null)}function Qh(e,t,n,r){let i=t=>{q.loadedMission===e&&r(t)};t?i(t):n().then(i).catch(console.warn)}function $h(e){q.goAround=null,e.goAround&&Qh(e,Kh,()=>G(()=>import(`./goAround-D3JUkYC4.js`),[],import.meta.url),t=>{Kh=t,q.goAround=t.createGoAround(),q.goAround.end=Cc(e.airport,e.rwy),q.goAround.holdKts=q.spec.vrefKts+5+(e.fastKts??0)})}var eg=null,tg=null,ng=null,rg=null,ig=null,ag={t:0,dt:0,altFt:0,aglFt:0,aoaDeg:0,stallAoaDeg:0,vsFpm:0,bankDeg:0,pullIn:0,throttle:0,iasKts:0,warnKts:0,hdgDeg:0,pitchDeg:0,flapsIndex:0},og=0,sg=null,cg=!1,lg=()=>q.stallDrill&&q.stallDrill.phase!==`complete`&&q.stallDrill.phase!==`failed`;function ug(e){let t=q.stallDrill;if(!t)return;J.setFromQuaternion(q.quat,`YXZ`),ag.t=q.simTime,ag.dt=e,ag.altFt=q.pos.y*dt,ag.aglFt=q.aglFt,ag.aoaDeg=q.aoaDeg,ag.stallAoaDeg=Es(q.spec,q.flapsIndex),ag.vsFpm=q.vsiFpm,ag.bankDeg=-J.z*V,ag.pullIn=og,ag.throttle=q.throttle,ag.iasKts=q.iasKts,ag.warnKts=Ms(q.spec,q.flapsIndex),ag.hdgDeg=-J.y*V,ag.pitchDeg=J.x*V,ag.flapsIndex=q.flapsIndex;let n=eg.stallDrillState(t,ag);(n===`complete`||n===`failed`)&&Zh(eg.gradeStallRecovery(eg.stallResultInput(t,q.assist===`kid`,q.aglFt)),eg.STALL_PLACE)}var dg=null,fg=null,pg=null,mg=null;function hg(){let e=q.rto&&!mg.rtoDone(q.rto)&&mg.rtoStep(q.rto,q);e&&(q.rto.phase===`fire`&&q.assist===`kid`&&(q.throttle=0,q.reverseCmd=!1,q.autobrakeActive||(q.autobrake=4)),e!==`fire`&&(K(`masterAlertBanner`).classList.add(`hidden`),Zh(mg.gradeRto(q.rto,q.assist===`kid`),mg.RTO_END)))}var gg=null;function _g(e){let t=q.windshear&&gg.shearLive(q.windshear)&&gg.shearStep(q.windshear,q,e);t===`warning`&&_h.callout(`windshear, windshear, windshear`),q.windshear?.phase===`warning`&&(q.apMaster=!1,q.apApproach=!1),(t===`clear`||t===`failed`)&&(K(`masterAlertBanner`).classList.add(`hidden`),Zh(gg.gradeShear(q.windshear,q.assist===`kid`),gg.SHEAR_END))}var vg=null,yg=null;function bg(e){let t=q.steepTurns&&yg.steepStep(q.steepTurns,q,e);if(t!==`complete`&&t!==`failed`)return;let n=yg.gradeSteepTurns(q.steepTurns,q.assist===`kid`);q.steepTurns=null,Zh(n,yg.STEEP_PLACE)}var xg=[],Sg=null,Cg=null;function wg(e){let t=q.groundRef;if(!t)return;Sg.seatMarker(t,Cg,yh.heightAt);let n=Sg.simStep(t,q,e,ky&&!My());(n===`complete`||n===`failed`)&&Zh(Sg.grade(t,q.assist===`kid`),Sg.PLACE)}function Tg(){q.groundRef&&(q.groundRef=null,Hm.remove(Cg),lv())}var Eg=null;function Dg(e){let t=q.upset&&Eg.upsetSimStep(q.upset,q,e,ky&&!My());if(t!==`done`&&t!==`failed`)return;let n=Eg.gradeUpset(q.upset,q.assist);q.upset=null,Zh(n,Eg.UPSET_PLACE)}var Og=null;function kg(e){let t=q.slowFlight&&Og.slowSimStep(q.slowFlight,q,e,ky&&!My());if(t===`holding`&&q.assist===`kid`&&(q.apAt.trim=0),t!==`complete`&&t!==`failed`)return;let n=Og.gradeSlowFlight(q.slowFlight,q.assist===`kid`);q.slowFlight=null,Zh(n,Og.SLOW_PLACE)}var Ag=null,jg=0;function Mg(e){let t=q.emergencyDescent&&Ag.descentSimStep(q.emergencyDescent,q,e,ky&&!My());if(t===`leveling`&&q.assist===`kid`&&(q.apAt.trim=0),t!==`complete`&&t!==`failed`)return;let n=Ag.gradeEmergencyDescent(q.emergencyDescent,q.assist===`kid`);q.emergencyDescent=null,Zh(n,Ag.ED_PLACE)}var Ng=null;function Pg(e){let t=q.wake;if(!t)return;if(!t.ready){if(!ky||My())return;t.ready=!0}let n=t.end,r=n.hdgT*B;Ng.wakeStep(t,(q.pos.x-n.thrX)*Math.sin(r)-(q.pos.z-n.thrZ)*Math.cos(r),q.pos.y,q.onGround,e)}var Fg=null,Ig={alongM:0,crossM:0,aglFt:0,vsFpm:0,iasKts:0,flapsFull:!1,onGround:!1,gsKts:0,braking:!1,wx:null},Lg=null;function Rg(e){let t=q.softField;t&&!Lg.softFieldDone(t)&&ky&&!My()&&(J.setFromQuaternion(q.quat,`YXZ`),Lg.softFieldSimStep(t,q,J.x*V,e)===`done`&&(q.surfaceMu=null,Zh(Lg.gradeSoftField(t,q.assist===`kid`),t.end)))}var zg=null;function Bg(e){let t=q.shortTakeoff;t&&!zg.shortTakeoffDone(t)&&ky&&!My()&&(J.setFromQuaternion(q.quat,`YXZ`),zg.shortTakeoffSimStep(t,q,J.x*V,e)===`done`&&Zh(zg.gradeShortTakeoff(t,q.assist===`kid`,q.assist===`learner`),t.end))}var Vg=null;function Hg(e){let t=q.xwTakeoff;if(!t||Vg.xwTakeoffDone(t)||!ky||My())return;J.setFromQuaternion(q.quat,`YXZ`);let n=t.phase,r=Vg.xwTakeoffSimStep(t,q,(-J.y*V+360)%360,-J.z*V,e)===`done`;n===`roll`&&t.phase!==`roll`&&(q.touchYaw=0),r&&Zh(Vg.gradeXwTakeoff(t,q.assist===`kid`,q.assist===`learner`),t.end)}function Ug(e){let t=q.shortField;if(!t||!ky||My())return;let n=t.end===q.activeEnd?q.approach:Tc(t.end,q.pos),r=Ig;r.alongM=-n.distM,r.crossM=n.crossM,r.aglFt=q.aglFt,r.vsFpm=q.vsiFpm,r.iasKts=q.iasKts,r.flapsFull=qh(Fg.FULL_FLAPS),r.onGround=q.onGround,r.gsKts=q.gsKts,r.braking=q.brakesOn||q.autobrakeActive,r.wx=q.wx,Fg.shortFieldStep(t,r,e)}var Wg=null,Gg=()=>!!q.noFlap||!!q.loadedMission?.noFlap&&!Wg&&q.aircraftKey===q.loadedMission.aircraft;function Kg(e){let t=q.noFlap;if(!t||t.stopped&&q.onGround||!ky||My())return;let n=t.end===q.activeEnd?q.approach:Tc(t.end,q.pos),r=Ig;r.alongM=-n.distM,r.crossM=n.crossM,r.aglFt=(q.pos.y-q.groundY-q.spec.gearHeight)*dt,r.vsFpm=q.vsiFpm,r.iasKts=q.iasKts,r.onGround=q.onGround,r.gsKts=q.gsKts,r.wx=q.wx,Wg.noFlapStep(t,r,e)}var qg=null,Jg={aglFt:0,onGround:!1,bankRightDeg:0,noseHdgT:0,pitchDeg:0,loads:null,driftKts:0};function Yg(e){let t=q.wingLow;if(!t||!ky||My())return;J.setFromQuaternion(q.quat,`YXZ`);let n=Jg;n.aglFt=(q.pos.y-q.groundY-q.spec.gearHeight)*dt,n.onGround=q.onGround,n.bankRightDeg=-J.z*V,n.noseHdgT=(-J.y*V+360)%360,n.pitchDeg=J.x*V,n.loads=Py?.flies(q.aircraftKey)?null:q.wheelLoads??null;let r=n.noseHdgT*B;n.driftKts=(q.vel.x*Math.cos(r)+q.vel.z*Math.sin(r))/gt,qg.wingLowStep(t,n,e)}function Xg(e){q.stallDrill=null,q.deadStick=null,q.pattern=null,q.engineOut=null,q.rto=null,q.windshear=null,q.steepTurns=q.upset=q.wake=q.slowFlight=q.shortField=q.noFlap=q.emergencyDescent=null,q.softField=q.surfaceMu=q.shortTakeoff=null,q.wingLow=q.xwTakeoff=null,q.touchYaw=0,Tg(),q.dh=null,q.engineFailed=!!e.deadStick,cg=!!(e.stallDrill||e.deadStick||e.pattern||e.engineOutFt||e.rto||e.steepTurns||e.upset||e.wake||e.slowFlight||e.emergencyDescent||e.shortField||e.noFlap||e.softField||e.shortTakeoff||e.wingLow||e.xwTakeoff||e.aroundPoint||e.rectCourse||e.sTurns),e.shortField&&Qh(e,Fg,()=>G(()=>import(`./shortField-mhxDz6yq.js`),__vite__mapDeps([11,1]),import.meta.url),t=>{Fg=t,q.aircraftKey===e.aircraft&&(q.shortField=t.createShortField(Cc(e.airport,e.rwy)))}),e.noFlap&&Qh(e,Wg,()=>G(()=>import(`./noFlap-SBt008Rf.js`),__vite__mapDeps([12,1]),import.meta.url),t=>{Wg=t,q.aircraftKey===e.aircraft&&(q.noFlap=t.createNoFlap(Cc(e.airport,e.rwy)))}),e.wingLow&&Qh(e,qg,()=>G(()=>import(`./wingLow-CQCJzrfe.js`),__vite__mapDeps([13,1]),import.meta.url),t=>{qg=t,q.aircraftKey===e.aircraft&&(q.wingLow=t.createWingLow(Cc(e.airport,e.rwy)),lv())}),e.xwTakeoff&&Qh(e,Vg,()=>G(()=>import(`./xwTakeoff-BDWHTnP7.js`),__vite__mapDeps([14,1,13]),import.meta.url),t=>{Vg=t,q.aircraftKey===e.aircraft&&(q.xwTakeoff=t.createXwTakeoff(Cc(e.airport,e.rwy)),lv())}),e.softField&&Qh(e,Lg,()=>G(()=>import(`./softField-BGGlxOhQ.js`),__vite__mapDeps([15,1]),import.meta.url),t=>{Lg=t,q.aircraftKey===e.aircraft&&(q.softField=t.createSoftField(Cc(e.airport,e.rwy)),q.surfaceMu=t.SURFACE_MU)}),e.shortTakeoff&&Qh(e,zg,()=>G(()=>import(`./shortTakeoff-Db8T4j9M.js`),__vite__mapDeps([16,1]),import.meta.url),t=>{zg=t,q.aircraftKey===e.aircraft&&(q.shortTakeoff=t.createShortTakeoff(Cc(e.airport,e.rwy),e.hot),q.brakesOn=!0,lv())}),e.wake&&Qh(e,Ng,()=>G(()=>import(`./wake-B265J6BN.js`),__vite__mapDeps([17,1]),import.meta.url),t=>{Ng=t,q.aircraftKey===e.aircraft&&(q.wake=t.createWake(Cc(e.airport,e.rwy)))}),e.upset&&Qh(e,Eg,()=>G(()=>import(`./upset-Bb9T2at2.js`),__vite__mapDeps([18,1]),import.meta.url),t=>{Eg=t,q.upset=t.createUpset(e.upset)}),e.slowFlight&&Qh(e,Og,()=>G(()=>import(`./slowFlight-DRA6FzmT.js`),__vite__mapDeps([19,1,20]),import.meta.url),t=>{Og=t,q.aircraftKey===e.aircraft&&(q.slowFlight=t.createSlowFlight())}),e.emergencyDescent&&Qh(e,Ag,()=>G(()=>import(`./emergencyDescent-RkUQF6zd.js`),__vite__mapDeps([21,1]),import.meta.url),t=>{Ag=t,q.aircraftKey===e.aircraft&&(q.emergencyDescent=t.createEmergencyDescent())}),e.steepTurns&&Qh(e,yg,()=>G(()=>import(`./steepTurns-CBgYcMHb.js`),__vite__mapDeps([22,1]),import.meta.url),e=>{yg=e,q.steepTurns=e.createSteepTurns()});let t=e.rectCourse?1:e.sTurns?2:e.aroundPoint?0:-1;t>=0&&Qh(e,xg[t],()=>G(t===1?()=>import(`./rectCourse-B1cV9Qil.js`):t===2?()=>import(`./sTurns-GcIVmQIZ.js`):()=>import(`./aroundPoint-v57fFvtm.js`),__vite__mapDeps([23,1]),import.meta.url),n=>{xg[t]=n,q.aircraftKey===e.aircraft&&(Sg=n,Hm.add(Cg=n.makeMarker(q.groundRef=n.create(e))),lv())}),e.stallDrill&&Qh(e,tg,()=>G(()=>import(`./powerOnStall-Ca_6L-sA.js`),[],import.meta.url),t=>{tg=t,eg=e.powerOn?t:t.idle,q.stallDrill=eg.createStallDrill()}),e.deadStick&&Qh(e,null,()=>e.power180?G(()=>import(`./power180-CVqMm5N4.js`),__vite__mapDeps([24,1,25]),import.meta.url):G(()=>import(`./deadStick-BgxWnPyD.js`),__vite__mapDeps([25,1]),import.meta.url),e=>{dg=e,q.deadStick=e.createDeadStick(q.simTime)}),e.pattern&&Qh(e,fg,()=>G(()=>import(`./pattern-C4r8Tj-4.js`),__vite__mapDeps([26,1]),import.meta.url),t=>{fg=t,q.pattern=t.createPattern(e)}),e.engineOutFt&&Qh(e,pg,()=>G(()=>import(`./engineOut-Dn18BPxB.js`),__vite__mapDeps([27,1,25]),import.meta.url),t=>{pg=t,q.aircraftKey===e.aircraft&&(q.engineOut=t.createEngineOut(e))}),e.rto&&Qh(e,mg,()=>G(()=>import(`./rto-dFkgMbPy.js`),__vite__mapDeps([28,1]),import.meta.url),t=>{mg=t,q.aircraftKey===e.aircraft&&(q.rto=t.createRto())}),q.toCoach=null,e.kind===`takeoff`&&!cg&&Qh(e,null,()=>G(()=>import(`./takeoffCoach-DsbPbQJl.js`),[],import.meta.url),e=>{q.toCoach=e.createTakeoffCoach(q.aircraftKey,q.spec)}),e.windshear&&Qh(e,gg,()=>G(()=>import(`./windshear-VUpaA8Bb.js`),__vite__mapDeps([29,1]),import.meta.url),t=>{if(gg=t,q.aircraftKey===e.aircraft){let n=_c(Cc(e.airport,e.rwy).hdgT);q.windshear=t.createShear(n.x,n.z)}}),e.lowIfr&&Qh(e,vg,()=>G(()=>import(`./lowIfr-Cz9lZElF.js`),__vite__mapDeps([30,31,20,1]),import.meta.url),t=>{let n=!vg;vg=t,q.dh=t.createDh(),n&&(!Uh||q.airborneTime<3)&&dy(q.missionKey,q.missionKey.startsWith(`debug_`)&&e)})}var Zg=null,Qg=ul(),$g=null,e_=null;function t_(e){let t=(q.pos.y-q.groundY-q.spec.gearHeight)*dt;if(dl(Qg,t,q.onGround,e),Qg.bounces&&q.onGround&&!q.wasOnGround){O_(),J.setFromQuaternion(q.quat,`YXZ`);let e=fl(q.lastAirVsi,J.z*V);if(e){let t=$g;$g=null;let n={...t.result,grade:`CRASH`,score:0,reason:e,bounces:Qg.bounces};r_(n)||i_(n,t.end,t.gate,t.bestKey);return}}if(t>50)$g=null,q.lastLanding=null,M_(),Qg.bounces&&q.throttle>.9&&lb(`弹跳后选择复飞，判断正确。`);else if(Qg.settled&&(!q.shortField||q.shortField.stopped)&&(!q.noFlap||q.noFlap.stopped)){let e=$g;$g=null;let t=pl(e.result,Qg.bounces),n=q.shortField;n?.end.id===e.end.id&&(t=Fg.shortFieldResult(t,n,Fg.pohRollFt(n.end.elevFt,q.wx.altimInHg,q.wx.tempC??15,Fg.headwindKts(q.wx,n.end.hdgT)),q.assist===`kid`)),q.noFlap?.end.id===e.end.id&&(t=Wg.noFlapResult(t,q.noFlap,q.assist===`kid`)),i_(t,e.end,e.gate,e.bestKey)}}function n_(e){if(Zg!==null&&q.simTime>=Zg){Zg=null,dy(q.missionKey);return}$g&&t_(e),q.onGround||(q.airborneTime+=e,q.aglFt>50&&(q.landingGraded=!1));let t=q.onGround&&!q.wasOnGround&&q.airborneTime>3&&!q.landingGraded;if(q.wasOnGround=q.onGround,!t||(O_(),q.landingGraded=!0,q.airborneTime=0,q.loadedMission?.engineOutFt&&!q.engineOut?.failed)||q.loadedMission?.rto||q.softField&&!Lg.softFieldDone(q.softField)||q.shortTakeoff&&!zg.shortTakeoffDone(q.shortTakeoff)||q.xwTakeoff&&(!Vg.xwTakeoffDone(q.xwTakeoff)||q.xwTakeoff.why)||q.windshear&&q.windshear.phase!==`final`)return;J.setFromQuaternion(q.quat,`YXZ`);let n=q.deadStick?dg:q.engineOut?.failed?pg:null,r=n?n.landingEnd((-J.y*V+360)%360):q.activeEnd||Dc(yc,q.pos,0,null);if(!r)return;let i=Tc(r,q.pos),a=bc.find(e=>e.ends.includes(r.id)),o=ll({vsFpm:q.lastAirVsi,crossM:i.crossM,pastThresholdM:-i.distM,runwayLengthM:a?a.lengthM-r.displacedM:3e3,runwayWidthM:r.widthM,pitchDeg:J.x*V,bankDeg:J.z*V,iasKts:q.iasKts,vrefKts:ks(q.spec,q.flapsIndex),gearLocked:Fp(q),driftDeg:q.missionKey===`crosswind_today`?gl((-J.y*V+360)%360,q.vel.x,q.vel.z):void 0});if(q.goAround?.phase===`landed`&&(o=Kh.capUnstableLanding(o)),q.wingLow?.end.id===r.id&&(o=qg.wingLowResult(o,q.wingLow,q.assist===`kid`)),q.wake?.end.id===r.id&&(o=Ng.wakeResult(o,q.wake,-i.distM)),q.pattern?.ent&&q.aircraftKey===q.pattern.aircraft&&(o=fg.entryResult(o,q.pattern)),q.deadStick?o=dg.deadStickResult(o,r,q.pos,q.deadStick):n&&(o=pg.engineOutResult(o,q.engineOut,r,q.pos)),r_(o))return;let s=q.gate&&q.gate.runway===r.id?q.gate:null;q.lastLanding={pastThresholdM:-i.distM,crossM:i.crossM,vsFpm:q.lastAirVsi,pitchDeg:J.x*V,bankRightDeg:-J.z*V,grade:o.grade,score:o.score,runway:r.id,bounces:0,stabilized:s?.stable??null};let c=ef(q.missionKey===`crosswind_today`?`${Xc}:${r.id}`:q.missionKey,q.assist);o.grade===`CRASH`?i_(o,r,s,c):(Object.assign(Qg,ul()),$g={result:o,end:r,gate:s,bestKey:c})}function r_(e){return e.grade!==`CRASH`||!vd(q.assist)?.softLanding?!1:(q.vel.y=Math.max(q.vel.y,2.5),m_.done=!0,m_.prompt=null,lb(`飞机弹起来了！${e.reason} 再试一次吧！`),Zg=q.simTime+2,!0)}function i_(e,t,n,r){Object.assign(q.lastLanding,{grade:e.grade,score:e.score,bounces:e.bounces??0});let i={isNewBest:!1,best:null};try{i=bl(window.localStorage,r,e)}catch{}c_(e,i,t,n,!0)}var a_=!1,o_=null,s_=()=>o_??=G(()=>import(`./results-Dablgyti.js`),[],import.meta.url).catch(e=>{throw o_=null,e});function c_(e,t,n,r,i=!1){let a=q.loadedMission;s_().then(o=>{q.loadedMission===a&&(q.paused||(a_=!0,Uy(!0)),o.showResults(q,e,t,n,r,i?ch:null),K(`btnReplay`).classList.toggle(`hidden`,!(ch&&sh.replayDuration(ch)>2)))}).catch(()=>lb(`${e.title??`着陆`}：${e.grade===`CRASH`?`坠机`:e.grade} · ${e.score} 分`))}function l_(){a_&&q.paused&&Uy(!1),a_=!1}var u_=null,d_=!1;function f_(){K(`resultsCard`).classList.add(`hidden`),l_(),dy(q.missionKey)}K(`btnFlyAgain`).addEventListener(`click`,()=>{K(`btnReplay`).classList.add(`hidden`);let e=u_?.between();e?e.then(f_):f_()});function p_(e){Gm.position.copy(e.pos),Gm.quaternion.copy(e.quat),Bh&&Xm.parts&&Bh.poseParts(Xm.parts,q.spec,e,0),Xm.model?.update(e)}K(`btnReplay`).addEventListener(`click`,()=>{lh=Gm&&sh.startReplay({buf:ch,camera:Z,heightAt:yh.heightAt,spec:q.spec,pose:p_,done:()=>{lh=null,Z.up.set(0,1,0),p_(q)}})}),K(`btnKeepRolling`).addEventListener(`click`,()=>{K(`resultsCard`).classList.add(`hidden`),l_()});var m_=jl(),h_=!1,g_=void 0,__=0,v_=!1,y_=0,Q={aglFt:0,vsiFpm:0,papiWhite:null,throttle:0,onGround:!1,autopilot:!1,kid:!1,iasKts:0,targetKts:0,locDots:0,gearLocked:!0,flapsLanding:!0,driftDeg:0,goAround:!1,stall:null,ds:null,noPower:!1,wet:!1,bankDeg:0,bounces:0,bounceHigh:!1,rollout:{gsKts:0,canReverse:!1,reverserPos:0,braking:!1}},b_={targetKts:0,flapsDeg:0},x_=window.matchMedia?.(`(hover: none) and (pointer: coarse)`).matches??!1,S_=x_&&Xf(navigator),C_=Qf(Nh()),w_=Yf(),T_=Yf(),E_=e=>S_&&C_&&ky&&!My()&&Zf(navigator,e);function D_(){S_&&C_&&Zf(navigator,[0]),w_=Yf(),T_=Yf()}function O_(){q.tdT=q.simTime,E_(Kf(q.lastAirVsi,th,q.assist===`kid`)),ky&&!My()&&oh?.touch()}function k_(){let e=K(`txtHapticsState`);e.textContent=C_?`开`:`关`,e.className=C_?`text-emerald-400 font-bold`:`text-amber-400 font-bold`;let t=K(`btnHaptics`);t.setAttribute(`aria-pressed`,String(C_)),t.classList.toggle(`active`,C_)}S_&&K(`btnHaptics`).classList.remove(`hidden`),k_(),K(`btnHaptics`).addEventListener(`click`,()=>{C_=!C_,$f(Nh(),C_),k_(),E_(Gf)});var A_=!1;function j_(e){A_=e,document.documentElement.classList.toggle(`lefty`,e);for(let t of document.querySelectorAll(`#handPicker .btnHand`)){let n=t.dataset.hand===`left`===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}}if(x_){K(`handPicker`).classList.replace(`hidden`,`flex`),j_(zf(Nh()));for(let e of document.querySelectorAll(`#handPicker .btnHand`))e.addEventListener(`click`,()=>{let t=e.dataset.hand===`left`;j_(t),Bf(Nh(),t)})}function M_(){Object.assign(m_,jl()),y_=0}var N_=[`touchStick`,`touchThrottle`,`virtualStickPad`],P_=!1,F_=Ll(),I_=null;G(()=>import(`./fbw-DzlrIn2A.js`),__vite__mapDeps([32,3,1]),import.meta.url).catch(console.warn),G(()=>import(`./supersonic-Ztqzhq9i.js`),[],import.meta.url).catch(console.warn),G(()=>import(`./pitchBreak-C-KBWeDl.js`),[],import.meta.url).catch(console.warn),G(()=>import(`./apTutor-CO70NIS_.js`).then(e=>{I_=e}),[],import.meta.url).catch(console.warn);var L_=!0,R_=!1,z_={apMaster:!1,apApproach:!1,apHdgHold:!1,apAltHold:!1,onGround:!1,aglFt:0,crossM:0,heightAbovePathM:0,iasKts:0,targetKts:0},B_={targetKts:0,hdgDeg:0,altFt:0};function V_(e){return!L_||!I_||q.windshear?.phase===`warning`?(F_.caption=null,null):(z_.apMaster=q.apMaster,z_.apApproach=q.apApproach,z_.apHdgHold=q.apHdgHold,z_.apAltHold=q.apAltHold,z_.onGround=q.onGround,z_.aglFt=q.raFt,z_.crossM=q.approach.crossM,z_.heightAbovePathM=q.approach.heightAbovePathM,z_.iasKts=q.iasKts,z_.targetKts=$d(q.spec,q.flapsIndex,q.wx),I_.stepTutor(F_,z_,e),F_.caption)}var H_=()=>(Q.noseOffDeg=((-J.y*V-q.wingLow.end.hdgT)%360+540)%360-180,Q),U_=()=>q.shortField?Fg.APPROACH_KTS:q.noFlap?Wg.APPROACH_KTS:q.emergencyDescent?Ag.ED_KID_KTS:$d(q.spec,q.flapsIndex,q.wx),W_=()=>q.shortField||q.noFlap||q.emergencyDescent||!(q.flapsIndex>0)?0:Qd(q.spec,q.wx),G_=()=>q.noFlap?Wg.STUCK_FLAPS:q.shortField?Fg.FULL_FLAPS:q.wingLow?qg.FLAPS:js(q.spec);function K_(e){let t=null;if((!q.windshear||gg.shearLive(q.windshear))&&(h_&&(q.loadedMission?.kind===`final`||R_||q.toCoach&&!q.toCoach.over)||cg&&(lg()||q.deadStick||q.pattern||q.steepTurns||q.upset||q.slowFlight||q.emergencyDescent||q.wake||q.shortField||q.noFlap||q.wingLow||q.groundRef&&Sg.live(q.groundRef)||q.softField&&!Lg.softFieldDone(q.softField)||q.shortTakeoff&&!zg.shortTakeoffDone(q.shortTakeoff)||q.xwTakeoff&&!Vg.xwTakeoffDone(q.xwTakeoff)||q.rto&&mg.rtoLive(q.rto)||q.engineOut&&(q.engineFailed||!q.onGround||!m_.flown)))){Q.aglFt=q.aglFt,Q.vsiFpm=q.vsiFpm,Q.papiWhite=q.papiWhite,Q.throttle=q.engineFailed?0:q.throttle,Q.noPower=q.engineFailed,Q.onGround=q.onGround,Q.autopilot=q.apMaster||q.apApproach,Q.kid=q.assist===`kid`,Q.iasKts=q.iasKts,Q.targetKts=U_(),Q.gustAddKts=W_(),Q.locDots=q.activeEnd?lc(q.approach.crossM,Math.max(0,q.approach.distM)+Dv(q.activeEnd),oc):0,Q.gearLocked=Fp(q),Q.flapsLanding=qh(G_()),Q.flareFt=q.shortField?Fg.FLARE_FT:void 0,Q.wet=q.wetRunway,Q.goAround=Yh(),Q.goAround&&(Q.gearLocked=!q.spec.fixedGear&&q.gearDown,Q.flapsLanding=q.flapsIndex>=q.goAround.callFlaps),J.setFromQuaternion(q.quat,`YXZ`),Q.stall=q.stallDrill&&!eg.powerOnPrompt?q.stallDrill.phase:null,Q.ds=q.stallDrill&&eg.powerOnPrompt?eg.powerOnPrompt(q.stallDrill,Q.kid,Q.throttle):q.deadStick?dg.deadStickPrompt(q.deadStick,q):q.pattern?fg.patternPrompt(q.pattern,q):q.engineOut?pg.engineOutPrompt(q.engineOut,q):q.rto?mg.rtoPrompt(q.rto,q):q.windshear?gg.shearPrompt(q.windshear,q):q.steepTurns?yg.steepCoach(q.steepTurns,Q.kid):q.groundRef?Sg.coachWord(q.groundRef,Q.kid):q.upset?Eg.upsetCoach(q.upset,Q.kid):q.slowFlight?Og.slowCoach(q.slowFlight,Q.kid):q.emergencyDescent?Ag.descentCoach(q.emergencyDescent,Q.kid):q.wake?Ng.wakePrompt(q.wake,Q,q.approach.heightAbovePathM):q.shortField?Fg.shortFieldPrompt(q.shortField,Q,q.approach):q.noFlap?Wg.noFlapPrompt(q.noFlap,Q):q.wingLow?qg.wingLowPrompt(q.wingLow,H_()):q.softField?Lg.softFieldPrompt(q.softField,q,J.x*V):q.shortTakeoff?zg.shortTakeoffPrompt(q.shortTakeoff,q,J.x*V):q.xwTakeoff?Vg.xwTakeoffSimPrompt(q.xwTakeoff,q,(-J.y*V+360)%360,-J.z*V):q.dh?vg.dhPrompt(q.dh,q,Q.kid):q.toCoach?q.toCoach.prompt(q,J.x*V,-J.z*V):null,Q.dsGround=q.onGround&&(q.engineOut||q.rto||q.toCoach||q.softField||q.shortTakeoff||q.xwTakeoff)?Q.ds:null,Q.bankDeg=-J.z*V,Q.driftDeg=q.gsKts>30?gl((-J.y*V+360)%360,q.vel.x,q.vel.z):0,Q.bounces=$g&&Qg.airS>=.3?Qg.bounces:0,Q.bounceHigh=Qg.peakFt>5;let n=Q.rollout;n.gsKts=q.gsKts,n.canReverse=!!jp(q.spec).reverser,n.reverserPos=q.reverserPos??0,n.braking=q.brakesOn||q.autobrakeActive,(q.toCoach||q.xwTakeoff&&!Vg.xwTakeoffDone(q.xwTakeoff)||q.shortTakeoff&&!zg.shortTakeoffDone(q.shortTakeoff))&&(m_.flown=!1),Nl(m_,Q,e),m_.done&&(y_+=e),t=m_.prompt===`stopped`&&y_>24?null:m_.prompt}let n=V_(e),r=n?`ap:${n}`:t;if(q.slowFlight&&Og&&Og.slowWordsRev()!==__&&(__=Og.slowWordsRev(),g_=void 0),q.emergencyDescent&&Ag.descentWordsRev()!==jg&&(jg=Ag.descentWordsRev(),g_=void 0),r===g_||(g_=r,K(`coach`).classList.toggle(`hidden`,r===null),K(`btnTakeover`).classList.toggle(`hidden`,!n),K(`coach`).classList.toggle(`coach-ap`,!!n),r===null))return;K(`txtCoachLabel`).textContent=n?`自动驾驶`:`飞行教练`;let i=K(`btnCoachSkip`);if(i.textContent=n?`隐藏`:`跳过`,i.setAttribute(`aria-label`,n?`隐藏自动驾驶提示`:`跳过教练提示`),n){B_.targetKts=Math.round($d(q.spec,q.flapsIndex,q.wx)),B_.hdgDeg=ds(q.targetHdgDeg),B_.altFt=Math.round(q.targetAltFt/100)*100;let e=I_.TUTOR_TEXT[n](B_);K(`txtCoach`).textContent=e,Y_(),(q.aglFt>100||n===`rollout`)&&_h.teach(e);return}b_.targetKts=Math.round(U_());let a=q.spec.flapDetentsDeg??q.flapAngles;b_.flapsDeg=t===`gaFlaps`?a[Math.max(0,q.goAround.callFlaps-1)]:a[G_()],b_.touch=x_;let o=t===`done`&&q.autobrakeActive?`已接地！自动刹车正在减速。`:t===`done`&&q.shortField?El(x_?`sfDoneTouch`:`sfDone`):El(t,b_);if(K(`txtCoach`).textContent=o,Y_(),(q.aglFt>100||q.onGround||q.toCoach)&&_h.teach(o),!v_){v_=!0;try{Fl(window.localStorage)}catch{}}}var q_=!1,J_=0;function Y_(e=!1){let t=K(`coach`);if(e&&(q_=!1),J_=0,t.classList.contains(`hidden`))return;if(!q_){t.classList.remove(`coach-top`);let e=t.getBoundingClientRect();q_=bp(window.innerHeight,e.top,e.bottom,q.hudScale),t.classList.toggle(`coach-top`,q_)}t.classList.remove(`coach-tight`);let n=q.hudScale;q_&&t.getBoundingClientRect().bottom>n*ep(window.innerHeight/2/n)-2&&t.classList.add(`coach-tight`);let r=t.getBoundingClientRect(),i=n*dp(window.innerHeight/2/n),a=window.innerWidth/2;r.bottom>i&&r.top<i+24*n&&r.left<a+116*n&&r.right>a-116*n&&(J_=(r.bottom+4)/n)}function X_(){L_=K(`chkTutor`).checked;try{zl(window.localStorage,L_)}catch{}h_=K(`chkCoach`).checked,h_&&M_()}K(`btnCoachSkip`).addEventListener(`click`,()=>{if(F_.caption){L_=!1,K(`chkTutor`).checked=!1;try{zl(window.localStorage,!1)}catch{}}else h_=!1,cg=!1,K(`chkCoach`).checked=!1;K_(0)}),K(`btnTakeover`).addEventListener(`click`,()=>{q.apMaster=!1,q.apApproach=!1,q.apHdgHold=!1,q.apAltHold=!1,uy(),q.activeEnd&&!q.onGround&&(h_=!0,R_=!0,M_()),lb(`现在由你操纵`),K_(0)});var Z_=`KDFW,KDAL,KADS,KAFW,KFTW,KGKY`,Q_=new s(10134961),$_={nightness:0,moonIllumination:0,moonElevationDeg:-90},ev=new s,tv=new Date;fy(),q.timeOfDayMode=Bc(fh.elevationDeg),fy();function nv(){let e=q.wx.ceilingFt,t=q.wx.live&&q.wx.precip?.ts,n=t?.9:e!==null&&e<=12e3?q.wx.ceilingCover===`BKN`?.45:.8:0,r=zc(fh.elevationDeg);ev.copy(Q_).multiplyScalar(Math.min(1,.12+r.ambientIntensity*.9+r.sunIntensity*.15)*(t?.45:1)),tv.setTime(fh.at??Date.now()),nh?.setSky({look:r,sunDir:ph,sunElevationDeg:fh.elevationDeg,date:tv,latDeg:ht,lonDeg:_t,overcast:n,overcastColor:ev}),Hm.fog.color.setHex(r.fog).lerp(ev,n),Hm.background.copy(Hm.fog.color);let i=nh?.state??$_,a=i.moonIllumination*Math.max(0,Math.min(1,i.moonElevationDeg/10))*i.nightness*(1-n);Um.intensity=(r.ambientIntensity+.18*a)*dh,Vm&&(Vm.toneMappingExposure=1.05+.35*i.nightness),Dh()}var rv=null,iv=null;function av(e){e&&!iv&&G(()=>import(`./precip-aJqNImwC.js`).then(e=>{iv??=e.createPrecip(Hm,th),lv()}),__vite__mapDeps([33,3,4,2,34]),import.meta.url).catch(console.warn),iv?.set(e,q.activeEnd?.thrY??0,q.wx.ceilingFt??q.wx.cloudLayers?.[0]?.baseFt)}async function ov(){try{let e=Math.floor(Date.now()/6e4),t=await fetch(`./api/metar?ids=${Z_}&t=${e}`,{cache:`no-store`});if(!t.ok){rv??=await G(()=>import(`./metar-CfH-5DXz.js`),__vite__mapDeps([31,20,1]),import.meta.url).catch(()=>null);return}let n=await t.json();rv??=await G(()=>import(`./metar-CfH-5DXz.js`),__vite__mapDeps([31,20,1]),import.meta.url);let r={};for(let e of n.metars||[])r[e.icaoId]=rv.parseMetar(e);Object.keys(r).length&&(q.wxByIcao=r)}catch(e){console.warn(e)}rv??=await G(()=>import(`./metar-CfH-5DXz.js`),__vite__mapDeps([31,20,1]),import.meta.url).catch(()=>null),lv(),sv(),Uh||dy(q.missionKey,q.missionKey.startsWith(`debug_`)&&q.loadedMission)}function sv(){let e=rv&&rv.crosswindMission(rv.pickCrosswindRunway(q.wxByIcao,yc,Date.now()/1e3));q.crosswindMission=e;let t=q.missionKey===`crosswind_today`&&q.loadedMission?[q.loadedMission]:[];q.dynamicMissions=e?[e]:t;let n=K(`selScenario`),r=n.querySelector(`option[value="${Xc}"]`);e?(r||(r=document.createElement(`option`),r.value=Xc,n.prepend(r)),r.textContent=e.label):r&&q.missionKey!==`crosswind_today`&&r.remove();let i=K(`btnCrosswindToday`);e&&(K(`txtCrosswindToday`).textContent=e.label.replace(`今日侧风：`,``)),e||i.classList.remove(`active`),i.classList.toggle(`hidden`,!e),i.classList.toggle(`flex`,!!e),Nb()}function cv(){let e=q.activeEnd?q.activeEnd.airport:`KDFW`;if(q.dh)return vg.WX;let t=q.wxByIcao[e]||q.wxByIcao.KDFW||nu();return q.wingLow?qg.lessonWx(q.wingLow,t):q.xwTakeoff?Vg.lessonWx(q.xwTakeoff,t):q.groundRef?q.groundRef.wx:q.shortTakeoff?.wx||t}function lv(){let e=q.wx;if(q.wx=cv(),(q.wingLow&&q.wingLow.readyT===null||q.groundRef&&!q.groundRef.live)&&e&&e!==q.wx&&!q.onGround){let t=gt*au(q.pos.y-q.groundY),n=ru(e.windDirDeg,e.windKts*t),r=ru(q.wx.windDirDeg,q.wx.windKts*t);q.vel.x+=r.x-n.x,q.vel.z+=r.z-n.z}q.isaDevC=ud(q.wx.tempC,Lo),q.altimInHg=q.wx.altimInHg||29.92,q.wetRunway=!!q.wx.wetRunway;let t=q.precip=q.wx.live&&q.wx.icao===(q.activeEnd?.airport??`KDFW`)?q.wx.precip:null;Hm.fog.density=cu(lu(q.wx.visibilitySm,t)),av(t),nh?.setClouds(q.wx.cloudLayers,q.activeEnd?.thrY??0),nv(),pv()}var uv={takeoff:`空气稀薄：起飞滑跑距离更长，爬升能力降低。`,final:`空气稀薄：着陆地速更高，滑跑距离更长。`,other:`空气稀薄：可用功率和升力比凉爽天气时低。`};function dv(){let e=cv(),t=q.activeEnd,n=t?t.elevFt:Lo/pt,r=fd(n,e.altimInHg,e.tempC),i=e.live?e.icao===t?.airport?`实时 METAR`:`实时 ${e.icao} METAR`:`场景天气`;return{where:t?`${t.airport} ${t.ident}`:`达拉斯地区`,ft:`${(Math.round(r/100)*100).toLocaleString(`en-US`)} ft`,src:`${i}${typeof e.tempC==`number`?`, ${e.tempC} °C`:``}`,thin:pd(r,n)}}var fv=``;function pv(){let e=dv(),t=q.loadedMission?.kind,n=e.thin?uv[t]||uv.other:``,r=`${e.where} 密度高度：${e.ft}（${e.src}）。`,i=Sc(q.activeEnd),a=r+n+i+q.activeEnd?.src;if(a===fv)return;fv=a;let o=K(`txtRunwayFacts`);K(`txtRunwayFactsLine`).textContent=i,i&&(K(`txtRunwayFactsSrc`).textContent=`(${q.activeEnd.src})`),o.classList.toggle(`hidden`,!i),K(`txtDaValue`).textContent=r;let s=K(`txtThinAir`);s.textContent=n,s.classList.toggle(`hidden`,!n)}var mv=null;function hv(e){q.simTime+=e;let t=q.wx;q.windNowKts=ou(q.simTime,t.windKts,t.gustKts);let n=ru(t.windDirDeg,q.windNowKts*gt*au(q.pos.y-q.groundY));q.windVec.set(n.x,0,n.z),rv&&rv.addTurbulence(mv??=rv.createTurbulence(Date.now()),e,q.onGround?0:rv.turbulenceSigmaW(t)*rv.assistTurbulenceScale(q.assist,q.raFt),q.raFt*pt,q.tasKts*gt,q.quat,q.windVec,q.spec.wingSpanM),q.windshear&&gg.addShearWind(q.windshear,q)}function gv(e){return e.windKts?`${e.windDirDeg===null?`VRB`:`${String(Math.round(e.windDirDeg)).padStart(3,`0`)}°`} @ ${e.windKts}${e.gustKts>e.windKts?`G${e.gustKts}`:``} KT`:`静风`}var _v=0;function vv(e){if(_v-=e,_v>0)return;_v=1;let t=cv();t!==q.wx&&lv();let n=K(`wxBadge`);n.textContent=t.live?`实时航空天气`:`场景天气`,n.toggleAttribute(`data-live`,t.live);let r=t.live&&t.obsTime?` · ${uu(t.obsTime,Date.now()/1e3)} 分钟前`:``;K(`txtMetarString`).textContent=`${String(t.raw).split(` RMK`)[0]}${r}`,K(`txtWindBadge`).textContent=gv(t);let i=!!rv?.isBumpy(rv.turbulenceSigmaW(t));K(`wxBumpy`).classList.toggle(`hidden`,!i);let a=q.dh?q.wx:q.wxByIcao.KDFW||nu(),o=du(a.windDirDeg,a.windKts);K(`txtFlow`).textContent=`${o===`NORTH`?`向北`:`向南`}（跑道 ${o===`NORTH`?`35/36`:`17/18`}）`,vp(t,q.activeEnd&&gp(q.approach,q.activeEnd.lengthM,q.aglFt)?su(t.windDirDeg,t.windKts,q.activeEnd.hdgT):null,q.hudWind,i,q.precip?.ts);let s=K(`txtRwyWind`);if(q.activeEnd&&t.windKts){let e=su(t.windDirDeg,t.windKts,q.activeEnd.hdgT),n=Math.round(e.headwindKts),r=Math.round(Math.abs(e.crosswindKts));s.textContent=`${q.activeEnd.ident}：${n>=0?`逆风`:`顺风`} ${Math.abs(n)} 节 · ${r?e.crosswindKts>0?`右侧风`:`左侧风`:`侧风`} ${r} 节${t.wetRunway?` · 道面湿滑`:``}`}else s.textContent=q.activeEnd&&t.wetRunway?`${q.activeEnd.ident}：道面湿滑`:``}function yv(e){if(q.paused)return;q.groundY=yh.heightAt(q.pos.x,q.pos.z),hv(e);let t=Math.max(3,Math.ceil(e*60)),n=e/t;for(let e=0;e<t;e++)xv(n);Gm&&(Gm.position.copy(q.pos),Gm.quaternion.copy(q.quat)),ch&&sh.recordReplay(ch,q),Bh&&Xm.parts&&Bh.poseParts(Xm.parts,q.spec,q,Bh.spinRate(q.engineN)*e),Xm.flame&&(Xm.flame.scale.set(1,1,.8+q.throttle*1.6),Xm.flame.visible=q.throttle>.6),Xm.model?.update(q),wv(e),Sv(),Gh();let r=sg?.towerStep(q);r&&(hh.say(r.text,performance.now()/1e3,!0,r.holdS),_h.takeoffCall(r.text)),Xh(),ug(e),q.engineOut&&pg.engineOutStep(q.engineOut,q)&&(q.engineFailed=!0),q.deadStick?.spot&&dg.p180Step(q.deadStick,q,ky&&!My()),hg(),_g(e),bg(e),wg(e),kg(e),Mg(e),Dg(e),Pg(e),q.pattern?.ent&&ky&&fg.entryStep(q.pattern,q),Ug(e),Kg(e),Yg(e),Rg(e),Bg(e),Hg(e),q.dh&&(vg.dhStep(q.dh,q)&&_h.callout(`minimums`),q.activeEnd&&(Hm.fog.density=vg.cloudFog((Z.position.y-q.activeEnd.thrY)*dt))),n_(e),bv()}function bv(){if(q.loadedMission?.kind!==`takeoff`||q.softField||q.shortTakeoff||q.takeoffCalloutIdx>=Qs.length-1)return;let e=q.onGround?0:(q.pos.y-q.groundY-q.spec.gearHeight)*dt,t=tc(q.iasKts,q.vsiFpm,e,As(q.spec,q.flapsIndex),q.takeoffCalloutIdx,!!q.spec.twoCrew);t<0||(q.takeoffCalloutIdx=t,q.takeoffCalls.push(Qs[t]),q.takeoffCallShownUntil=q.simTime+2.5,_h.takeoffCall(Qs[t]))}function xv(e){q.groundY=yh.heightAt(q.pos.x,q.pos.z),e_&&q.onGround&&(e_.s-=e)<=0&&(q.vel.y=e_.mps,e_=null);let t=q.spec,n=lf(af),r=vb.buttons;(r.UP||r.DOWN)&&(n.pitch=Number(!!r.DOWN)-Number(!!r.UP)),(r.LEFT||r.RIGHT)&&(n.roll=Number(!!r.RIGHT)-Number(!!r.LEFT));let i=ff(n,q.stick,q.pad);q.inputSource=i.source;let a=i.pitch,o=i.roll,s=i.yaw,c=performance.now(),l=(ib.r&&c-ib.r>ab?1:0)-(ib.l&&c-ib.l>ab?1:0);if(l?q.touchYaw=P.clamp(q.touchYaw+l*.6*e,-1,1):q.touchYaw&&q.onGround&&q.wingLow?.td&&(q.touchYaw=0),!s&&q.touchYaw&&(s=q.touchYaw),q.onGround&&(i.source===`stick`||x_&&i.source===`keyboard`)&&!s&&q.assist===`pilot`&&!q.apMaster&&t.gear){let e=Math.hypot(q.vel.x,q.vel.z);J.setFromQuaternion(q.quat,`YXZ`),sy(e,-J.y*V);let n=$,r=n.rwyHdgDeg==null?0:Gd(n.rwyHdgDeg,n.noseHdgDeg,n.crossM,n.crossVelMps,n.steerRateDegS);s=_f(o,e,t.gear.noseZ+t.gear.mainZ,t.gear.steerDeg??7,r),o*=1-gf(e)}q.pad&&q.pad.throttleRate&&(q.throttle=P.clamp(q.throttle+q.pad.throttleRate*e*.5,0,1)),(r.A&&!r.B||af.ShiftLeft||af.ShiftRight)&&(q.throttle=Math.min(1,q.throttle+e*.4),K(`rngThrottle`).value=Math.round(q.throttle*100)),(r.B&&!r.A||af.ControlLeft||af.ControlRight)&&(q.throttle=Math.max(0,q.throttle-e*.4),K(`rngThrottle`).value=Math.round(q.throttle*100));let u=q.apMaster?null:vd(q.assist);q.mouseYoke&&i.source===`keyboard`&&(o=u||t.pilotRoll?q.mouseStick.x:q.aileronInput,a=u?q.mouseStick.y:q.elevInput),og=Math.max(0,-a),q.pitchIn=a,q.rollIn=o,q.autoTrim=q.assist!==`pilot`||q.apMaster&&(q.apApproach||q.apAltHold);let d=P.clamp(uf(af)+q.touchTrim+(q.pad?.trim??0),-1,1);if(Gv()&&d?(q.trimAlphaDeg=xf(q.trimAlphaDeg,d,e,q.spec,q.flapsIndex),q.trimUsed=!0):!q.autoTrim&&q.trimAlphaDeg!=null&&!q.trimUsed&&Math.abs(q.elevInput)>.05&&(q.trimAlphaDeg=bf(q.trimAlphaDeg+(q.aoaDeg-q.trimAlphaDeg)*e/8,q.trimAlphaDeg,q.spec,q.flapsIndex)),u?cy(u,a,o,s,e):(zd(ry),q.elevInput=P.lerp(q.elevInput,a,e*10),q.aileronInput=t.pilotRoll?t.pilotRoll(q.aileronInput,o,e,t.rollCmdRad,q.mouseYoke?`stick`:i.source):P.lerp(q.aileronInput,o,e*10),q.rudderInput=P.lerp(q.rudderInput,s,e*10)),q.apMaster){J.setFromQuaternion(q.quat,`YXZ`);let n=(-J.y*V+360)%360,r=J.x*V,i=-J.z*V,a=-q.angVel.z,o=q.angVel.x,s=e=>{q.aileronInput=Gl(Wl(Ws(e,n),q.tasKts*gt),i,a,wm(t,q.tasKts*gt))+q.propAil,q.aileronInput=P.clamp(q.aileronInput,-1,1)},c=Math.atan2(q.vel.y,Math.max(20,Math.hypot(q.vel.x,q.vel.z)))*V,l=(e,t=!1)=>{q.elevInput=Yl(t?ql(e,r,c):Math.min(9.5,e+q.aoaDeg),r,o)};if(ny(e),q.apApproach&&q.activeEnd){let n=Tc(q.activeEnd,q.pos);s(q.activeEnd.hdgT+Hl(n.crossM));let r=q.pos.y-q.groundY-t.gearHeight,i=Math.max(20,Math.hypot(q.vel.x,q.vel.z));r>15?(q.apGsEndId!==q.activeEnd.id&&(q.apGsEndId=q.activeEnd.id,q.apGsIntegral=0),Math.abs(n.heightAbovePathM)<15&&(q.apGsIntegral=P.clamp(q.apGsIntegral+n.heightAbovePathM*e,-100,100)),l(Kl(n.heightAbovePathM,q.apGsIntegral),!0),q.throttle=ly($d(t,q.flapsIndex,q.wx),-3,e)):(l(Math.atan2(Jl(r),i)*V),q.throttle=r>8?ly(ks(t,q.flapsIndex)+3,-1.5,e):Math.max(0,q.throttle-e*.5)),q.onGround&&(q.elevInput=0,q.throttle=0)}else if(q.apHdgHold&&s(q.targetHdgDeg),q.apAltHold){let e=q.targetAltFt-q.mslFt;l(P.clamp(e*.01,-4,4))}}Py&&Py.flies(q.aircraftKey)?(Rp(q,t,e),Py.step(q,t,e),q.propAil=0,q.aoaPrevRad=null):bm(q,t,e),q.aglFt=Math.max(0,Math.round((q.pos.y-q.groundY)*dt)),q.raFt=Math.round(cm(q,t)*dt),q.mslFt=Math.round(Ho(q.pos.y)),q.vsiFpm=Math.round(q.vel.y*dt*60),q.gateVsFpm=fc(q.gateVsFpm,q.vel.y*dt*60,e);let f=nc(q.iasKts,Ms(t,q.flapPos??q.flapsIndex),q.onGround),p=rc(q.raFt,q.vsiFpm,q.onGround),m=!p&&ic(q.raFt,q.vsiFpm,Fp(q),q.onGround);K(`stallAlertBanner`).classList.toggle(`hidden`,!f);let h=q.simTime-q.tdT<.5;w_(f,q.simTime)&&!h&&E_(Jf(`stall`,th)),T_(p,q.simTime)&&!h&&E_(Jf(`pullup`,th));let g=K(`masterAlertBanner`),_=q.rto,v=q.assist===`kid`,y=_?.phase===`fire`&&(v?q.simTime-_.t0<2:_.idleS===null),b=q.windshear?.phase===`warning`&&q.simTime-q.windshear.warnT<6;g.classList.toggle(`hidden`,!p&&!m&&!y&&!b);let x=y?v?`发动机起火`:`发动机起火：推力慢车，刹车`:b?v?`风切变`:`风切变：推力最大，俯仰 15°`:m?`高度过低，请放起落架`:`前方有地形，请拉起！`;g.textContent!==x&&(g.textContent=x),m&&!q.gearWarned?(q.gearWarned=!0,_h.callout(`too low, gear`)):!m&&q.raFt>600&&(q.gearWarned=!1),q.speedLimitKts=v?null:Ns(t,q.flapDeg??0);let S=Ps(q.overspeed,q.iasKts,q.speedLimitKts);S&&!q.overspeed&&_h.callout(`overspeed`),q.overspeed=S,q.stallKts=v||t.pitchFbw?null:Os(t,q.flapPos??q.flapsIndex)}function Sv(){if(!Zm)return;let e=Zm.geometry.attributes.color.array;yc.forEach((t,n)=>{let r=Tc(t,q.pos),i=Ec(t,q.pos,r.distM)??0;for(let t=0;t<4;t++){let r=(n*4+t)*3,a=3-t<i;e[r]=1,e[r+1]=a?1:.13,e[r+2]=a?1:.13}}),Zm.geometry.attributes.color.needsUpdate=!0;let t=q.activeEnd?Ec(q.activeEnd,q.pos,q.approach.distM):null;q.papiWhite=t;let n=K(`txtPapiStatus`);n.dataset.papi!==`${t??``}`&&(n.dataset.papi=t??``,n.textContent=Cv[t]??`—`)}var Cv=[`低`,`略低`,`在下滑道上`,`略高`,`高`];function wv(e){if(q.rwySelectTimer-=e,q.rwySelectTimer<=0){q.rwySelectTimer=.5,J.setFromQuaternion(q.quat,`YXZ`);let e=(-J.y*V+360)%360;q.onGround||(q.activeEnd=q.groundRef&&Sg.live(q.groundRef)?null:Dc(yc,q.pos,e,q.activeEnd))}if(q.activeEnd){let e=Object.assign(q.approach,Tc(q.activeEnd,q.pos));q.ilsLocDots=lc(e.crossM,e.distM+Dv(q.activeEnd),oc),q.ilsGsDots=lc(e.heightAbovePathM,e.distM+305,sc)}else q.ilsLocDots=q.ilsGsDots=0}var Tv=null,Ev=0;function Dv(e){if(e!==Tv){let t=bc.find(t=>t.ends.includes(e.id));Tv=e,Ev=(t?t.lengthM:e.lengthM)-e.displacedM+300}return Ev}function Ov(){if(!Gm)return;let e=q.cameraMode;if(e===0){let e=Fm.copy(q.spec.eyeOffset).applyQuaternion(q.quat);Z.position.copy(q.pos).add(e);let t=Im.set(0,q.spec.eyeOffset.y-.15,-400).applyQuaternion(q.quat);Z.lookAt(Lm.copy(q.pos).add(t)),Z.up.set(0,1,0).applyQuaternion(q.quat)}else if(e===1){let e=Math.cos(q.orbitPitch),t=Math.sin(q.orbitYaw)*e*q.orbitDist,n=Math.sin(q.orbitPitch)*q.orbitDist+4,r=Math.cos(q.orbitYaw)*e*q.orbitDist,i=Fm.set(t,n,r).applyQuaternion(q.quat);Z.position.copy(q.pos).add(i),Z.lookAt(q.pos.clone().add(Im.set(0,2,-10).applyQuaternion(q.quat))),Z.up.set(0,1,0)}else if(e===2){let e=Fm.set(160,25,-350);Z.position.copy(q.pos).add(e),Z.lookAt(q.pos),Z.up.set(0,1,0)}else if(e===3){let e=Fm.set(-q.spec.wingSpanM*.48,1.2,2.5).applyQuaternion(q.quat);Z.position.copy(q.pos).add(e),Z.lookAt(q.pos.clone().add(Im.set(-.2,.4,-20).applyQuaternion(q.quat))),Z.up.set(0,1,0).applyQuaternion(q.quat)}else if(e===4)Z.position.set(-960,yh.heightAt(-960,-80)+96,-80),Z.lookAt(q.pos),Z.up.set(0,1,0);else{let e=Fm.set(0,7.5,24).applyQuaternion(q.quat);Z.position.copy(q.pos).add(e),Z.lookAt(q.pos.clone().add(Im.set(0,1.2,-40).applyQuaternion(q.quat))),Z.up.set(0,1,0)}if(e!==0){let e=yh.heightAt(Z.position.x,Z.position.z)+1.5;Z.position.y<e&&(Z.position.y=e)}}function kv(e,t,n,r,i,a,o,s=!1,c=16){Y.save(),Y.beginPath(),Y.rect(n<0?e-60:e,t-90,60,180),Y.clip(),Y.fillStyle=`rgba(2, 6, 23, 0.3)`,Y.fill(),Y.strokeStyle=`rgba(186, 230, 253, 0.85)`,Y.fillStyle=`#e0f2fe`,Y.font=`10px monospace`,Y.textAlign=n<0?`right`:`left`,Y.beginPath(),Y.moveTo(e,t-90),Y.lineTo(e,t+90);let l=Math.floor((r-90/i)/a)*a;for(let s=l;s<=r+90/i;s+=a){let a=t-(s-r)*i,l=s%o===0;Y.moveTo(e,a),Y.lineTo(e+n*(l?9:5),a),l&&(a<t-16||a>t+c)&&Y.fillText(`${s}`,e+n*12,a+3.5)}Y.stroke(),Y.restore();let u=n<0?44:56,d=n<0?e-8-u:e+8,f=s&&(th||(performance.now()/250|0)%2==0);Y.fillStyle=`rgba(2, 6, 23, 0.7)`,Y.strokeStyle=f?`#f59e0b`:`#38bdf8`,Y.beginPath(),Y.rect(d,t-11,u,22),Y.fill(),Y.stroke(),Y.fillStyle=f?`#fbbf24`:`#f0f9ff`,Y.font=`bold 13px monospace`,Y.textAlign=`center`,Y.fillText(`${Math.round(r)}`,d+u/2,t+4.5),Y.textAlign=`left`}var Av={},jv={speedX:0,altX:0,scale:1},Mv=np.h/2+2+13+4,Nv=(e,t=q.hudScale)=>e&&{...e,x:e.x*t,y:e.y*t,w:e.w*t,h:e.h*t};function Pv(){let e=q.hudScale,t=zm.width/e,n=zm.height/e;Y.setTransform(e,0,0,e,0,0),Y.clearRect(0,0,t,n);let r=t/2,i=n/2;J.setFromQuaternion(q.quat,`YXZ`);let a=J.x,o=J.z,s=-J.y*V,c=Math.round((s+360)%360);Y.save(),Y.strokeStyle=`#38bdf8`,Y.fillStyle=`#38bdf8`,Y.lineWidth=1.5,Y.font=`12px monospace`,Y.beginPath(),Y.arc(r,i,6,0,Math.PI*2),Y.moveTo(r-18,i),Y.lineTo(r-6,i),Y.moveTo(r+6,i),Y.lineTo(r+18,i),Y.moveTo(r,i-6),Y.lineTo(r,i-14),Y.stroke();let l=q.vel.lengthSq()>4?Bv(Fm.copy(q.vel).normalize().multiplyScalar(2e4).add(Z.position),t,n):null;if(l){let e=P.clamp(l.x,40,t-40),r=P.clamp(l.y,40,n-40);Y.strokeStyle=`#10b981`,Y.lineWidth=2,Y.beginPath(),Y.arc(e,r,7,0,Math.PI*2),Y.moveTo(e-18,r),Y.lineTo(e-7,r),Y.moveTo(e+7,r),Y.lineTo(e+18,r),Y.moveTo(e,r-7),Y.lineTo(e,r-13),Y.stroke(),Y.lineWidth=1.5}let u=q.activeEnd;if(u&&!q.onGround&&q.approach.distM>-305&&q.approach.distM<2e4){let e=_c(u.hdgT),r=Bv(Im.set(u.thrX+e.x*305,u.thrY,u.thrZ+e.z*305),t,n);r&&(Y.strokeStyle=`#f8fafc`,Y.beginPath(),Y.moveTo(r.x,r.y-7),Y.lineTo(r.x+7,r.y),Y.lineTo(r.x,r.y+7),Y.lineTo(r.x-7,r.y),Y.closePath(),Y.stroke())}Y.save(),Y.translate(r,i),Y.rotate(-o);let d=a*V;[-20,-10,-5,0,5,10,15,20].forEach(e=>{let t=(d-e)*7;t>-140&&t<140&&(Y.strokeStyle=e===0?`rgba(56, 189, 248, 0.9)`:`rgba(56, 189, 248, 0.45)`,Y.beginPath(),Y.moveTo(-35,t),Y.lineTo(-12,t),Y.moveTo(12,t),Y.lineTo(35,t),Y.stroke(),e!==0&&(Y.fillStyle=`#38bdf8`,Y.font=`9px monospace`,Y.fillText(`${e}`,40,t+3)))}),Y.restore();let f=r+rp(t),p=ip(t);jv.speedX=f*e,jv.altX=(r+p)*e,jv.scale=e,kv(f,i,-1,q.iasKts,2,5,20,q.overspeed),kv(r+p,i,1,q.mslFt,.2,100,500,!1,Mv),Lv?.drawAltCaption(Y,ap(r,i,Av,p),q.assist,t,q,qv),q.speedLimitKts&&Uv(f,i),q.stallKts&&!q.onGround&&Lv?.drawStallBand(Y,f,i,q.stallKts,q.iasKts),q.activeEnd&&!q.onGround&&Vv(f,i);let m=Wv()&&(!q.wingLow&&!q.xwTakeoff||q.assist===`kid`);m!==Kv&&(Kv=m,K(`touchTrim`).classList.toggle(`hidden`,!m),m||(rb.up=rb.dn=!1,q.touchTrim=0));let h=!!(q.wingLow||q.xwTakeoff)&&q.assist!==`kid`;h!==ob&&(ob=h,K(`touchRudder`).classList.toggle(`hidden`,!h),h||(ib.l=ib.r=0,q.touchYaw=0));let g=h?Math.round(q.touchYaw*100):0;g!==sb&&(sb=g,K(`txtTouchRud`).textContent=g?`${Math.abs(g)}% ${g<0?`L`:`R`}`:`0`),Wv()&&q.trimAlphaDeg!=null&&Lv?.drawTrimBug(Y,f,i,Sf(q.spec,q.trimAlphaDeg,q.flapsIndex),q.iasKts),q.activeEnd&&!q.onGround&&q.raFt<60&&Yv(r,i);let _=ep(i);if(Y.strokeStyle=`#38bdf8`,Y.fillStyle=`rgba(2, 6, 23, 0.55)`,Y.fillRect(r-40,_,80,24),Y.strokeRect(r-40,_,80,24),Y.fillStyle=`#e0f2fe`,Y.textAlign=`center`,Y.font=`bold 13px monospace`,Y.fillText(q.hudHdg=`${ds(s)}°M`,r,_+16),Y.font=`12px monospace`,Jv(t,n,c),q.ilsLocBarPx=q.ilsGsBarPx=null,q.activeEnd&&q.approach.distM>-500&&q.approach.distM<2e4){let e=q.ilsLocBarPx=-up(q.ilsLocDots),t=!q.onGround&&q.raFt>=60&&q.approach.distM>-305,n=t?q.ilsGsBarPx=up(q.ilsGsDots):0;Y.fillStyle=`rgba(245, 158, 11, 0.8)`;for(let e=-2;e<=2;e++){if(!e)continue;let n=e*30;Y.fillRect(r+n-1,i+70-8,2,6),t&&Y.fillRect(r+70-8,i+n-1,6,2)}Y.strokeStyle=`rgba(245, 158, 11, 0.7)`,Y.setLineDash(Fv),Y.beginPath(),Y.moveTo(r+e,i-70),Y.lineTo(r+e,i+70),t&&(Y.moveTo(r-70,i+n),Y.lineTo(r+70,i+n)),Y.stroke(),Y.setLineDash(Iv)}q.gate&&q.simTime<q.gateShownUntil&&Lv?.drawGateVerdict(Y,q,t,n,hh.text),q.takeoffCalloutIdx>=0&&q.simTime<q.takeoffCallShownUntil&&!hh.text?Xv(r,i):q.groundRef&&!hh.text&&Sg.drawHud(Y,r,J_||dp(i),q.groundRef,q,s),Y.restore()}var Fv=[3,3],Iv=[],Lv=null,Rv=new z,zv={x:0,y:0};function Bv(e,t,n){return Rv.copy(e).project(Z),Rv.z>1||Rv.z<-1?null:(zv.x=(Rv.x+1)/2*t,zv.y=(1-Rv.y)/2*n,zv)}function Vv(e,t){let n=U_(),r=(n-q.iasKts)*2,i=t-P.clamp(r,-88,88);Y.fillStyle=`rgba(16, 185, 129, 0.35)`;let a=P.clamp(t-(n+5-q.iasKts)*2,t-90,t+90),o=P.clamp(t-(n-5-W_()-q.iasKts)*2,t-90,t+90);Y.fillRect(e-3,a,3,o-a),Y.fillStyle=`#e879f9`,Y.beginPath(),Y.moveTo(e,i),Y.lineTo(e+9,i-6),Y.lineTo(e+9,i+6),Y.closePath(),Y.fill(),Y.font=`bold 11px monospace`,Y.textAlign=`right`,Y.fillText(`SPD ${Math.round(n)}`,e,t+106),Y.textAlign=`left`}var Hv={y:0,tick:!1,top:0,bot:0,show:!1};function Uv(e,t){let n=sp(t,q.speedLimitKts,q.iasKts,Hv);n.show&&(Y.fillStyle=`rgba(249, 115, 22, 0.9)`,Y.fillRect(e-7,n.top,3,n.bot-n.top),n.tick&&Y.fillRect(e-8,n.y-1,8,2))}var Wv=()=>!q.autoTrim&&!q.spec.pitchFbw&&!(Py&&Py.flies(q.aircraftKey)),Gv=()=>Wv()&&q.trimAlphaDeg!=null,Kv=!1,qv=hp(1,1);function Jv(e,t,n){let r=hp(e,t,qv,A_),i=q.hudWind;Y.fillStyle=`rgba(2, 6, 23, 0.7)`,Y.strokeStyle=i.calm?`#475569`:i.bumpy||i.storm?`#fcd34d`:`#38bdf8`,Y.fillRect(r.x,r.y,r.w,r.h),Y.strokeRect(r.x,r.y,r.w,r.h),Y.textAlign=`left`,Y.font=`bold 9px monospace`,Y.fillStyle=i.wet||i.bumpy||i.storm?`#fcd34d`:i.live?`#6ee7b7`:`#cbd5e1`,Y.fillText(i.source,r.x+3,r.y+10);let a=_p(i.dirDeg,i.kts,n);a!==null&&(Y.save(),Y.translate(r.x+12,r.y+37),Y.rotate(a*B),Y.strokeStyle=`#e0f2fe`,Y.fillStyle=`#e0f2fe`,Y.lineWidth=2,Y.beginPath(),Y.moveTo(0,9),Y.lineTo(0,-4),Y.stroke(),Y.beginPath(),Y.moveTo(0,-10),Y.lineTo(5,-3),Y.lineTo(-5,-3),Y.closePath(),Y.fill(),Y.restore()),Y.font=`bold 10px monospace`,Y.fillStyle=`#e0f2fe`,Y.fillText(i.speed,r.x+3,r.y+22),i.xw&&(Y.fillText(i.xw,r.x+24,r.y+35),Y.fillStyle=i.hwKts<0?`#fcd34d`:`#e0f2fe`,Y.fillText(i.hw,r.x+24,r.y+47))}function Yv(e,t){let n=q.raFt<=20&&q.throttle>.05;Y.font=`bold 15px monospace`,Y.textAlign=`center`,Y.fillStyle=n?`#fcd34d`:`#6ee7b7`,Y.fillText(n?`▼ 慢车 ▼`:`▲ 拉平 ▲`,e,t-34),Y.textAlign=`left`}function Xv(e,t){let n=dp(t);Y.textAlign=`center`,Y.fillStyle=`rgba(15, 23, 42, 0.8)`,Y.fillRect(e-116,n,232,26),Y.font=`bold 15px monospace`,Y.fillStyle=`#f8fafc`;let r=q.assist===`pilot`?$s:ec;Y.fillText(r[q.takeoffCalloutIdx],e,n+18)}var Zv=null,Qv=null,$v=!0;function ey(){if(!$v)return;let e=Bm.width,t=Bm.height;X.clearRect(0,0,e,t);let n=e/2,r=t/2,i=.007;X.fillStyle=`#090e1a`,X.fillRect(0,0,e,t),Zv?.draw(X,n,r,i,q.pos),X.strokeStyle=`rgba(56, 189, 248, 0.25)`,X.beginPath(),X.arc(n,r,35,0,Math.PI*2),X.arc(n,r,65,0,Math.PI*2),X.stroke(),X.lineCap=`round`;let a=new Set;for(let e of bc){let t=_c(e.hdgT),o=t.x*e.lengthM/2,s=t.z*e.lengthM/2,c=n+(e.cx-o-q.pos.x)*i,l=r+(e.cz-s-q.pos.z)*i,u=n+(e.cx+o-q.pos.x)*i,d=r+(e.cz+s-q.pos.z)*i,f=q.activeEnd&&e.ends.includes(q.activeEnd.id);X.strokeStyle=f?`#f59e0b`:`#38bdf8`,X.lineWidth=f?3:2,X.beginPath(),X.moveTo(c,l),X.lineTo(u,d),X.stroke(),a.has(e.airport)||(a.add(e.airport),X.fillStyle=`#94a3b8`,X.font=`8px monospace`,X.fillText(e.airport,Math.max(c,u)+4,(l+d)/2))}X.lineWidth=1;let o=n+(xs.x-q.pos.x)*i,s=r+(xs.z-q.pos.z)*i;X.fillStyle=`#10b981`,X.beginPath(),X.arc(o,s,3.5,0,Math.PI*2),X.fill(),X.fillText(`达拉斯`,o+5,s+2),J.setFromQuaternion(q.quat,`YXZ`),X.save(),X.translate(n,r),X.rotate(J.y),X.fillStyle=`#f59e0b`,X.beginPath(),X.moveTo(0,-7),X.lineTo(5,6),X.lineTo(0,3),X.lineTo(-5,6),X.closePath(),X.fill(),X.restore(),Zv?.status(X,q.pos,q.mslFt)}var ty={};function ny(e){if(q.apPrevIasKts!==null&&e>0){let t=q.iasKts-q.apPrevIasKts;Math.abs(t)<5&&(q.apIasRate+=(t/e-q.apIasRate)*Math.min(1,e/.5))}q.apPrevIasKts=q.iasKts}var ry=Rd(),$={},iy={elev:0,ail:0,rud:0},ay={gearDown:!0,flapsIndex:0},oy=90;function sy(e,t){let n=q.activeEnd,r=q.approach,i=q.spec.gear,a=q.onGround&&n&&Math.abs(r.crossM)<n.widthM/2+3&&Math.abs(Ws(n.hdgT,t))<20;if($.rwyHdgDeg=a?n.hdgT:null,!a)return;let o=n.hdgT*B;$.noseHdgDeg=t,$.crossM=r.crossM,$.crossVelMps=q.vel.x*Math.cos(o)+q.vel.z*Math.sin(o),$.steerRateDegS=i?e*Math.tan((i.steerDeg??7)*B)/(i.noseZ+i.mainZ)*V:0}function cy(e,t,n,r,i){let a=q.spec;J.setFromQuaternion(q.quat,`YXZ`);let o=q.pos.y-q.groundY-a.gearHeight,s=Math.hypot(q.vel.x,q.vel.z);$.pitchIn=t,$.rollIn=n,$.yawIn=r,$.pitchDeg=J.x*V,$.bankRightDeg=-J.z*V,$.pitchRateUp=q.angVel.x,$.rollRateRight=-q.angVel.z,$.rollScale=wm(a,q.tasKts*gt),$.yawRateRight=-q.angVel.y;let c=-J.y*V,l=Math.atan2(q.vel.x,-q.vel.z)*V;$.driftDeg=Ws(c,l),$.aoaDeg=q.aoaDeg,$.betaDeg=q.betaDeg,$.dihedralAil=Tm(a,q.betaDeg*B),$.propAil=q.propAil;let u=q.stallDrill?eg.drillAssist(q.stallDrill.phase):null;$.stallAoaDeg=u&&!u.protect?oy:Es(a,q.flapsIndex)-(q.slowFlight&&Og?Og.slowGustAoaDeg(q,q.assist===`pilot`?1:.5):0),$.pitchUpMaxDeg=u?.pitchUpMaxDeg??null,$.tailstrikeDeg=a.maxGroundPitchDeg??15,$.onGround=q.onGround,$.noseWheelDown=!(q.wheelLoads?.[0]<=0),$.wheelHeightM=o,$.airspeedMps=q.tasKts*gt,$.flarePerS=a.kidFlarePerS,$.vsMps=q.vel.y;let d=e.autoThrottle&&Bd(ry,q.onGround&&!$g,q.aglFt);$.guideBankDeg=0,$.guideGammaDeg=0;let f=q.approach,p=q.windshear&&gg.kidEscape(q.windshear);if(p?$.guideGammaDeg=15-q.aoaDeg:u?.kidPitchDeg?$.guideGammaDeg=u.kidPitchDeg-q.aoaDeg:d||u?.kidClimb?$.guideGammaDeg=5:e.handsOff&&q.activeEnd&&!$g&&Yd(q.activeEnd,f,c,l,$,q.wake?.end.id===q.activeEnd.id?Ng.kidLiftM(q.wake,void 0,q.wx):q.shortField?Fg.kidLiftM():0,Jd(q.vel.x,q.vel.z,q.windVec.x,q.windVec.z)),q.deadStick?dg.kidGuide(q.deadStick,q,$):q.engineFailed&&q.engineOut?pg.kidGuide(q,$):q.pattern&&!d&&fg.kidGuide(q.pattern,q,$),$.bankMaxDeg=q.steepTurns?yg.kidGuide(q.steepTurns,$):q.groundRef?Sg.kidGuide(q.groundRef,$):0,q.emergencyDescent&&($.bankMaxDeg=Ag.kidGuide(q.emergencyDescent,$)),q.slowFlight&&Og.kidGuide(q.slowFlight,$),$.noFloor=q.engineFailed,sy(s,c),Vd(e,ry,$,i,iy),q.onGround)q.elevInput=P.lerp(q.elevInput,iy.elev,i*10),q.aileronInput=P.lerp(q.aileronInput,iy.ail,i*10),q.rudderInput=Hd(q.rudderInput,iy.rud,i);else if(q.elevInput=iy.elev,q.aileronInput=iy.ail,q.rudderInput=Hd(q.rudderInput,iy.rud,i),!q.engineFailed&&(e.autoConfig&&!p&&!(q.groundRef&&Sg.live(q.groundRef))&&(ay.gearDown=q.gearDown,ay.flapsIndex=q.flapsIndex,Xd(a,q,ay),q.shortField&&ay.flapsIndex>=js(a)&&(ay.flapsIndex=Fg.FULL_FLAPS),Gg()&&(ay.flapsIndex=0),q.gearDown=ay.gearDown,q.flapsIndex=ay.flapsIndex),e.autoThrottle)){if(ny(i),p)q.throttle=1;else if(q.windshear?.phase!==`shear`){if(q.emergencyDescent&&Ag.kidIdle(q.emergencyDescent))q.throttle=0;else if(u&&u.kidThrottle!==null)q.throttle=u.kidThrottle;else if(d)q.throttle=1;else if(o>8){let e=Math.atan2(q.vel.y,Math.max(20,s))*V;q.throttle=ly((q.goAround?.phase===`approach`?q.goAround.holdKts+W_():q.steepTurns||q.groundRef?q.loadedMission.kias:q.slowFlight?Og.slowKidKts(q.slowFlight):q.emergencyDescent?Ag.ED_KID_LEVEL_KTS:q.shortField?Fg.kidKts(qh(Fg.FULL_FLAPS),Qd(a,q.wx)):q.noFlap?Wg.APPROACH_KTS+Qd(a,q.wx):0)||Zd(a,q.flapsIndex,Qd(a,q.wx)),e,i)}else q.throttle=Math.max(0,q.throttle-i*.5)}}}function ly(e,t,n){return ld(q.pos.y+q.mslOffsetM,q.isaDevC,q.altimInHg,ty),eu(Om(q.spec,e*gt,q.flapsIndex,t,q.gearDown,ty),q.apAt,q.iasKts,e,q.apIasRate,n)}function uy(){q.apPrevIasKts=null,q.apIasRate=0,q.apAt.trim=0,q.apGsIntegral=0,q.apGsEndId=null}function dy(e,t=null){q_=!1,D_(),lh?.stop(!1),ch&&sh.resetReplay(ch);let n=t?{...qc[0],...t}:Jc(e,q.dynamicMissions);if(n.aircraft?n.aircraft!==q.aircraftKey&&(ng??=q.aircraftKey,By(n.aircraft)):ng&&=(By(ng),null),n.key!==ig){ig=null;let e=Yc(n,q.timeOfDayMode,rg);rg=e.before,e.mode!==q.timeOfDayMode&&(q.timeOfDayMode=e.mode,my())}q.missionKey=n.key,q.towerFor=null;let r=null;if(q.loadedMission=n,q.brakesOn=!1,q.apMaster=!1,q.apApproach=!1,uy(),zd(ry),Zg=null,q.lastCalloutIdx=-1,q.takeoffCalloutIdx=-1,q.takeoffCalls.length=0,q.takeoffCallShownUntil=0,Object.assign(q.gateState,{armed:!1,armFt:500,done:!1}),q.gate=null,q.gateShownUntil=0,q.angVel.set(0,0,0),q.rwySelectTimer=0,q.landingGraded=!1,q.airborneTime=0,q.lastLanding=null,q.fuelGal=null,$g=null,ky&&Ry(),$h(n),Xg(n),M_(),R_=!1,Object.assign(F_,Ll()),K(`resultsCard`).classList.add(`hidden`),l_(),n.kind===`final`){let e=Cc(n.airport,n.rwy);q.activeEnd=e,lv();let t=(n.kias??q.spec.vrefKts+5+(n.fastKts??0))*gt,i=ld(e.thrY+Lo,q.isaDevC,q.altimInHg),a=dd(t,i.sigma),o=Math.tan((n.highDots??0)*sc*B)*(n.distNm*mt+305),s=Oc(e,n.distNm,a,o);q.pos.set(s.pos.x,s.pos.y,s.pos.z),q.vel.set(s.vel.x,s.vel.y,s.vel.z),q.flapsIndex=n.flaps??js(q.spec);let c=(Xl(q.spec,t,q.flapsIndex)-3)*B;q.quat.setFromEuler(J.set(c,s.yawRad,0,`YXZ`)),q.throttle=Om(q.spec,t,q.flapsIndex,-3,!0,i),r=Xl(q.spec,t,q.flapsIndex),q.gearDown=!0,q.onGround=!1,q.activeEnd=e}else if(n.kind===`takeoff`){let e=Cc(n.airport,n.rwy),t=kc(e,n.fullLength?30-e.displacedM:60);q.pos.set(t.pos.x,yh.heightAt(t.pos.x,t.pos.z)+q.spec.gearHeight,t.pos.z),q.vel.set(0,0,0),q.quat.setFromAxisAngle(Lm.set(0,1,0),t.yawRad),q.throttle=0,q.flapsIndex=n.flaps??1,r=Cf(q.spec,q.flapsIndex),q.gearDown=!0,q.onGround=!0,q.activeEnd=e}else if(n.kind===`drill`){let[e,t]=n.pos,i=n.kias*gt,a=yh.heightAt(e,t)+n.aglFt*pt,o=ld(a+Lo,q.isaDevC,q.altimInHg),s=dd(i,o.sigma),c=_c(n.hdg);q.pos.set(e,a,t),q.vel.set(c.x*s,0,c.z*s),q.flapsIndex=n.flaps??0,q.gearDown=!!q.spec.fixedGear,q.quat.setFromEuler(J.set(Xl(q.spec,i,q.flapsIndex)*B,-n.hdg*B,0,`YXZ`)),q.throttle=n.deadStick?0:Om(q.spec,i,q.flapsIndex,0,q.gearDown,o),r=Xl(q.spec,n.deadStick?q.spec.vGlideKts*gt:i,q.flapsIndex),q.onGround=!1,q.activeEnd=null}else{let[e,t,r]=n.pos,i=-n.hdg*B,a=_c(n.hdg);q.pos.set(e,t,r);let o=q.spec.vneKts?Math.min(n.speedMps,.8*q.spec.vneKts*gt):n.speedMps;q.vel.set(a.x*o,0,a.z*o),q.quat.setFromAxisAngle(Lm.set(0,1,0),i),q.throttle=n.throttle,q.flapsIndex=0,q.gearDown=!!q.spec.fixedGear,q.onGround=!1,q.activeEnd=null}q.engineN=q.throttle,q.trimAlphaDeg=r,q.trimUsed=!1,q.spoilers=0,q.aoaPrevRad=null,q.aoaRateF=0,q.gateVsFpm=null,q.autobrake=n.kind===`final`&&jp(q.spec).autobrake?2:0,q.gearWarned=!1,q.overspeed=!1,Lp(q.spec,q),q.groundY=yh.heightAt(q.pos.x,q.pos.z),q.onGround||(lv(),hv(0),q.vel.add(q.windVec)),Jm?.noteSessionReuse(),q.activeEnd&&Object.assign(q.approach,Tc(q.activeEnd,q.pos)),K(`rngThrottle`).value=Math.round(q.throttle*100),Fb(n)}function fy(){Object.assign(fh,Fc(Ac[q.timeOfDayMode],new Date,ht,_t)),Nc(fh,ph),Wm.position.set(ph.x,ph.y,ph.z).multiplyScalar(1e4);let e=zc(fh.elevationDeg);Wm.color.setHex(e.sun),Wm.intensity=e.sunIntensity*dh,Um.color.setHex(e.ambient),Um.intensity=e.ambientIntensity*dh}function py(){let e=Nc({elevationDeg:Math.max(20,fh.elevationDeg),azimuthDeg:fh.azimuthDeg});return new z(e.x,e.y,e.z)}function my(){fy(),nv();let e=Ac[q.timeOfDayMode];for(let e of document.querySelectorAll(`#timePicker .btnTime`)){let t=Number(e.dataset.time)===q.timeOfDayMode;e.classList.toggle(`active`,t),e.setAttribute(`aria-pressed`,String(t))}K(`txtSkyNow`).textContent=_y(e),K(`txtTimeBadge`).textContent=hy[e],K(`btnTimeOfDay`).title=`${hy[e]}，太阳高度角 ${Math.round(fh.elevationDeg)}°，点击切换时段`}var hy={Now:`当前`,Dawn:`黎明`,Noon:`正午`,Dusk:`黄昏`,Night:`夜间`},gy=new Intl.DateTimeFormat(`zh-CN`,{timeZone:`America/Chicago`,hour:`numeric`,minute:`2-digit`});function _y(e){let t=nh?.state??$_,n=Math.round(fh.elevationDeg),r=n>6?`太阳高度角 ${n}°`:n>-1?`太阳位于地平线附近`:fh.elevationDeg>-6?`暮光`:`夜色`,i=t.moonElevationDeg>0?`月面亮度 ${Math.round(t.moonIllumination*100)}%，高度角 ${Math.round(t.moonElevationDeg)}°`:`月亮位于地平线以下`;return`${e===`Now`?`达拉斯当地时间 ${gy.format(new Date(fh.at))}`:`达拉斯今日${hy[e]} ${gy.format(new Date(fh.at))}`} · ${r} · ${i}`}for(let e of document.querySelectorAll(`#timePicker .btnTime`))e.addEventListener(`click`,()=>{q.timeOfDayMode=Number(e.dataset.time),rg=null,ig=q.missionKey,my()});function vy(e,t=!0){if(document.body.classList.toggle(`view-clean`,e),e||zy(!1),Ey(),t)try{Lf(window.localStorage,e)}catch{}}K(`btnPanelsShow`).addEventListener(`click`,()=>vy(!1)),K(`btnPanelsHide`).addEventListener(`click`,()=>vy(!0));function yy(){q.timeOfDayMode=(q.timeOfDayMode+1)%Ac.length,rg=null,ig=q.missionKey,my()}var by=null,xy=!1,Sy=()=>(q.spec.flapDetentsDeg??q.flapAngles)[q.flapsIndex],Cy=()=>{let e=Math.round(q.flapDeg??Sy());return e===Sy()?`${e}°`:`${e}→${Sy()}°`};function wy(){let e=Math.round(q.throttle*100);K(`txtThrottle`).textContent=q.engineFailed?`发动机失效`:`${e}%`;let t=by||=K(`rngThrottle`);!xy&&Math.abs(Number(t.value)-e)>=1&&(t.value=e),K(`txtIasGs`).textContent=`${Math.round(q.iasKts)}/${q.gsKts}K`,K(`txtAltMsl`).textContent=`${q.mslFt} FT`,K(`txtAltAgl`).textContent=`${q.raFt} FT`,K(`txtVsi`).textContent=`${q.vsiFpm} FPM`,K(`txtGLoad`).textContent=`${q.loadFactor.toFixed(2)}G`,K(`txtAoaBadge`).textContent=`${op(q.aoaDeg)}°`,J.setFromQuaternion(q.quat,`YXZ`),K(`txtRadarHdg`).textContent=`${ds(-J.y*V)}°M`;let n=K(`txtNav1`);if(q.activeEnd){let e=Math.max(0,q.approach.distM)/mt;K(`txtNavDist`).textContent=`DME ${e.toFixed(1)} NM`,n.textContent=`NAV1：${q.activeEnd.name} ILS · 跑道 ${ds(q.activeEnd.hdgT)}°M`}else K(`txtNavDist`).textContent=`DME ---`,n.textContent=`NAV1：前方无跑道`;K(`txtSurfaceState`).textContent=q.onGround?`接地／滑跑`:`飞行中`,q.engineFailed&&(q.apMaster=q.apApproach=!1),K(`btnApMaster`).classList.toggle(`active`,q.apMaster),K(`btnApHdg`).classList.toggle(`active`,q.apHdgHold),K(`btnApAlt`).classList.toggle(`active`,q.apAltHold),K(`btnApApr`).classList.toggle(`active`,q.apApproach);let r=Fp(q),i=Ip(q);K(`btnGear`).classList.toggle(`active`,r),K(`btnGear`).classList.toggle(`active-amber`,i),K(`txtGear`).textContent=r?`放下 · 三绿灯`:i?q.gearDown?`正在放下 ▼`:`正在收起 ▲`:`收起`,K(`txtFlaps`).textContent=Cy(),K(`btnBrakes`).classList.toggle(`active-amber`,q.brakesOn),K(`txtBrakes`).textContent=q.brakesOn?`已施加`:q.autobrakeActive?`自动`:`关`;let a=jp(q.spec);K(`btnAutobrake`).disabled=!a.autobrake,K(`txtAutobrake`).textContent=a.autobrake?Ep[q.autobrake]:`N/A`,K(`btnAutobrake`).classList.toggle(`active-amber`,q.autobrakeActive),K(`btnReverse`).disabled=!a.reverser,K(`txtReverse`).textContent=a.reverser?q.reverserPos>=1?`已展开`:q.reverserPos>0?`已解锁`:`收起`:`N/A`,K(`btnReverse`).classList.toggle(`active-amber`,q.reverserPos>0),K(`txtHyd`).textContent=a.hydraulics?`HYD ${q.hydPsi} PSI`:`HYD —`,K(`meterElev`).textContent=`${Math.round(q.elevInput*100)}%`,K(`meterAil`).textContent=`${Math.round(q.aileronInput*100)}%`,K(`meterRud`).textContent=`${Math.round(q.rudderInput*100)}%`;let o=K(`virtualStickKnob`);if(o){let e=q.aileronInput*36,t=q.elevInput*36;o.style.transform=`translate(${e}px, ${t}px)`}if(q.apMaster!==P_){P_=q.apMaster;for(let e of N_)K(e)?.classList.toggle(`ap-flying`,q.apMaster)}let s=K(`touchStickKnob`);s.style.transform=`translate(${q.aileronInput*44}px, ${q.elevInput*44}px)`;let c=Math.round(q.throttle*100);K(`txtTouchThr`).textContent=q.engineFailed?`失效`:`${c}%`,K(`touchThrottleFill`).style.height=`${c}%`,K(`touchThrottleHandle`).style.bottom=`${c}%`,K(`touchThrottle`).setAttribute(`aria-valuenow`,String(c)),K(`txtTouchGear`).textContent=r?`放下`:i?`···`:`收起`,K(`touchGear`).classList.toggle(`active`,r),K(`txtTouchFlaps`).textContent=Cy(),K(`touchBrakes`).classList.toggle(`active-amber`,q.brakesOn);let l=q.onGround&&!!a.reverser,u=l?q.reverserPos>0?`反推开启`:`反推`:`ILS 自动`,d=K(`txtTouchIls`);d.textContent!==u&&(d.textContent=u),K(`touchIls`).classList.toggle(`active-amber`,l?q.reverserPos>0:q.apApproach),K(`txtPhoneIas`).textContent=`${Math.round(q.iasKts)}`,K(`txtPhoneAgl`).textContent=`${q.raFt}`,K(`txtPhoneVs`).textContent=`${q.vsiFpm}`,K(`txtPhoneThr`).textContent=q.engineFailed?`失效`:`${e}%`,K(`txtPhoneConfig`).textContent=`${q.spec.fixedGear?`固定`:r?`放下`:i?`···`:`收起`} · ${Cy()}`;let f=K(`txtPapiStatus`),p=K(`txtPhonePapi`);p.dataset.papi!==f.dataset.papi&&(p.dataset.papi=f.dataset.papi,p.textContent=f.textContent.replace(`在下滑道上`,`正常`))}function Ty(){let e=window.innerWidth,t=window.innerHeight;e!==0&&t!==0&&(Vm.setSize(e,t),Z.aspect=e/t,Z.fov=mp(e,t),Z.updateProjectionMatrix(),Jm?.resize(),zm.width=e,zm.height=t,q.hudScale=pp(e,t,x_),document.documentElement.style.setProperty(`--hud-s`,q.hudScale),Ey(),Y_(!0))}function Ey(){let e=Bm.parentElement.getBoundingClientRect();$v=e.width>0,Bm.width=Math.max(120,Math.floor(e.width)),Bm.height=Math.max(80,Math.floor(e.height)),e.width&&!Qv&&(Qv=G(()=>import(`./airspace-CG9qnntf.js`).then(e=>e.loadAirspace()),[],import.meta.url).then(e=>{Zv=e}).catch(console.warn))}window.addEventListener(`resize`,Ty);var Dy=K(`onboardingModal`),Oy=null,ky=!1;function Ay(e){Oy=e,Nb(),Dy.classList.remove(`hidden`),K(`modalPanel`).focus({preventScroll:!0})}function jy(e=!1){ky=!0,D_(),Dy.classList.add(`hidden`);let t=e&&[Oy,K(`btnMenu`)].find(e=>e?.offsetParent);t?t.focus({preventScroll:!0}):document.activeElement?.blur(),Oy=null}var My=()=>!Dy.classList.contains(`hidden`);K(`btnCloseModal`).addEventListener(`click`,e=>{X_(),jy(e.detail===0)});var Ny=nl(window.location.search)===`jsbsim`,Py=null,Fy=!1;function Iy(){Ny&&!Fy&&(Fy=!0,G(()=>import(`./loadJsbsim-Cg1czyiG.js`).then(e=>e.loadJsbsim(`./`)),__vite__mapDeps([35,3,2,1]),import.meta.url).then(e=>{Py=e}).catch(e=>console.warn(`[openaero] JSBSim unavailable, flying the built-in model:`,e)))}K(`btnStartFlight`).addEventListener(`click`,()=>{if(Iy(),Uh||(Uh=!0,Wh(q.aircraftKey)),K(`chkAutoSound`).checked&&_h.init(),X_(),G(()=>import(`./atis-Bgyj0-fA.js`).then(e=>e.showAtis(q)),[],import.meta.url).catch(()=>{}),G(()=>import(`./tower-CCjw7BRw.js`).then(e=>{sg=e}),__vite__mapDeps([36,37]),import.meta.url).catch(()=>{}),q.loadedMission?.kind===`takeoff`){let e=dv();lb(`${e.where} 密度高度 ${e.ft}。${e.thin?uv.takeoff:e.src}`,6e3)}Yu(window.location)&&!tl(window.location.search)&&Jm.start(`./api/config`),jy(),Ry(),K(`btnStartFlight`).textContent=`开始飞行 ✈`});var Ly=()=>window.localStorage,Ry=()=>Uf(Ly,{sound:K(`chkAutoSound`).checked,camera:q.cameraMode,mission:q.missionKey});K(`btnOpenMissions`).addEventListener(`click`,e=>{zy(!1),pv(),Ay(e.currentTarget)}),document.addEventListener(`keydown`,e=>{if(!My())return;if(e.key===`Escape`){K(`btnCloseModal`).click();return}if(e.key!==`Tab`)return;let t=[...Dy.querySelectorAll(`button, input, select, a[href]`)].filter(e=>!e.disabled&&e.offsetParent);if(!t.length)return;let n=t[0],r=t[t.length-1],i=Dy.contains(document.activeElement)&&document.activeElement!==K(`modalPanel`);e.shiftKey&&(!i||document.activeElement===n)?(e.preventDefault(),r.focus()):e.shiftKey||i&&document.activeElement!==r||(e.preventDefault(),n.focus())});function zy(e){let t=K(`hudMenu`),n=K(`btnMenu`);!e&&t.contains(document.activeElement)&&n.offsetParent&&n.focus(),t.classList.toggle(`open`,e),n.setAttribute(`aria-expanded`,String(e)),document.body.classList.toggle(`hud-menu-open`,e)}K(`btnMenu`).addEventListener(`click`,()=>{zy(!K(`hudMenu`).classList.contains(`open`))});for(let e of[`simCanvas`,`touchStick`,`touchThrottle`])K(e).addEventListener(`pointerdown`,()=>zy(!1));document.addEventListener(`keydown`,e=>{e.key===`Escape`&&zy(!1)}),K(`missionList`).addEventListener(`click`,e=>{let t=e.target.closest(`.btnMission`);if(!t)return;let n=t.dataset.scenario;K(`btnStartFlight`).textContent=`开始飞行 ✈`,K(`selScenario`).value=n,dy(n)}),K(`selAircraft`).addEventListener(`change`,e=>{ng=null,q.stallDrill=null,q.deadStick=null,q.engineOut=null,q.rto=null,q.steepTurns=q.upset=q.wake=q.slowFlight=q.shortField=q.noFlap=q.emergencyDescent=null;let t=q.shortTakeoff?.hot;q.shortTakeoff&&(q.brakesOn=!1),q.softField=q.surfaceMu=q.shortTakeoff=null,t&&lv(),(q.wingLow||q.xwTakeoff)&&(q.wingLow=q.xwTakeoff=null,q.touchYaw=0,lv()),Tg(),q.windshear=null,q.engineFailed=!1,By(e.target.value)});function By(e){K(`selAircraft`).value=e,q.aircraftKey=e,q.spec=ss[q.aircraftKey],q.trimAlphaDeg=null,q.aoaPrevRad=null,q.aoaRateF=0,q.gateVsFpm=null,q.trimUsed=!1,q.spec.fixedGear&&(q.gearDown=!0),jp(q.spec).autobrake||(q.autobrake=0),Lp(q.spec,q),q.takeoffCalloutIdx=-1,q.takeoffCalls.length=0,K(`txtAircraftTitle`).textContent=q.spec.name,zh(q.aircraftKey)}if(Ny){let e=K(`selAircraft`);e.value=`c172`,e.dispatchEvent(new Event(`change`))}K(`selScenario`).addEventListener(`change`,e=>{dy(e.target.value)}),K(`btnCamera`).addEventListener(`click`,()=>{Vy((q.cameraMode+1)%q.cameraNames.length),Ry()});function Vy(e){q.cameraMode=e,K(`txtCamMode`).textContent=q.cameraNames[e]}window.PureGameHost&&!window.PureTVPC&&(K(`btnSatLayer`).style.display=`none`,K(`onlineTerrainOption`).style.display=`none`);function Hy(e){q.satelliteEnabled=e,K(`chkSatellite`).checked=e,Fh(Ph);let t=K(`txtSatState`);t.textContent=q.satelliteEnabled?`联网卫星`:`本地地形`,K(`btnSatLayer`).classList.toggle(`active-sky`,q.satelliteEnabled)}K(`btnSatLayer`).addEventListener(`click`,()=>Hy(!q.satelliteEnabled)),K(`chkSatellite`).addEventListener(`change`,e=>Hy(e.target.checked)),K(`btnMouseYoke`).addEventListener(`click`,()=>{q.mouseYoke=!q.mouseYoke;let e=K(`txtMouseYokeState`),t=K(`mouseFlightCrosshair`);q.mouseYoke?(e.textContent=`开`,e.className=`text-emerald-400 font-bold`,K(`btnMouseYoke`).classList.add(`active`),t.classList.remove(`hidden`)):(e.textContent=`关`,e.className=`text-amber-400 font-bold`,K(`btnMouseYoke`).classList.remove(`active`),t.classList.add(`hidden`),q.aileronInput=0,q.elevInput=0)}),K(`btnTimeOfDay`).addEventListener(`click`,yy);function Uy(e){if(e&&S_&&C_&&Zf(navigator,[0]),!e&&eh.lost)return;eh.hidPaused=!1,q.paused=e,_h.pause(e),K(`btnPause`).textContent=q.paused?`继续`:`暂停`;let t=K(`btnMenu`);t.textContent=q.paused?`☰ 已暂停`:`☰ 菜单`,t.setAttribute(`aria-label`,q.paused?`菜单（已暂停）`:`菜单`),t.classList.toggle(`text-red-400`,q.paused),t.classList.toggle(`text-sky-300`,!q.paused)}var Wy=K(`controlsSheet`),Gy=!1;function Ky(e=document.activeElement){zy(!1),G(()=>import(`./controlsSheet--9mC7s3I.js`).then(t=>t.openControls({from:e,touch:x_,pause:()=>q.paused?null:(Uy(!0),Gy=!0,()=>Gy&&Uy(Gy=!1))})),[],import.meta.url).catch(()=>lb(`操控说明加载失败，请检查网络连接后重试。`))}K(`btnControls`).addEventListener(`click`,e=>Ky(e.currentTarget)),K(`btnPause`).addEventListener(`click`,()=>{a_=Gy=!1,Uy(!q.paused),q.paused||zy(!1)}),document.addEventListener(`visibilitychange`,()=>{document.hidden&&!q.paused&&ky&&(Uy(!0),eh.hidPaused=!0)});var qy=K(`gfxLost`),Jy=K(`gfxLostPanel`),Yy=K(`txtGfxLost`),Xy=Yy.textContent,Zy=K(`txtGfxLostTitle`),Qy=K(`btnGfxResume`),$y=K(`btnGfxReload`);Rm.addEventListener(`webglcontextlost`,e=>{lh?.stop(!1),e.preventDefault(),eh.lost||(qy.classList.contains(`hidden`)&&(eh.pausedIt=!q.paused||eh.hidPaused||Gy),Gy=!1,Wy.classList.add(`hidden`),Uy(!0),eh.lost=!0,qm?.reset(),Zy.textContent=`图形渲染已暂停`,Yy.textContent=Xy,Qy.classList.add(`hidden`),$y.classList.add(`hidden`),qy.classList.remove(`hidden`),Jy.focus(),clearTimeout(eh.reloadTimer),eh.reloadTimer=setTimeout(()=>{eh.lost&&(Yy.textContent=Yy.dataset.gone,$y.classList.remove(`hidden`),$y.focus())},5e3))}),Rm.addEventListener(`webglcontextrestored`,()=>{eh.lost=!1,clearTimeout(eh.reloadTimer),Zy.textContent=`图形设备已恢复`,Yy.textContent=Yy.dataset[eh.pausedIt?`ready`:`held`],Qy.textContent=eh.pausedIt?`继续飞行`:`继续`,$y.classList.add(`hidden`),Qy.classList.remove(`hidden`),Qy.focus()}),Qy.addEventListener(`click`,()=>{qy.classList.add(`hidden`),eh.pausedIt&&Uy(!1),eh.pausedIt=!1}),document.addEventListener(`keydown`,e=>{if(qy.classList.contains(`hidden`)||(e.stopImmediatePropagation(),e.key!==`Tab`))return;e.preventDefault();let t=[Qy,$y].filter(e=>!e.classList.contains(`hidden`));t.length?t[(t.indexOf(document.activeElement)+(e.shiftKey?-1:1)+t.length)%t.length].focus():Jy.focus()},!0),$y.addEventListener(`click`,()=>window.location.reload()),K(`btnReset`).addEventListener(`click`,()=>{dy(K(`selScenario`).value),zy(!1)}),K(`btnApMaster`).addEventListener(`click`,()=>{q.apMaster=!q.apMaster,q.apMaster&&(q.apHdgHold=!0,q.apAltHold=!0,uy())}),K(`btnApHdg`).addEventListener(`click`,()=>{q.apHdgHold=!q.apHdgHold}),K(`btnApAlt`).addEventListener(`click`,()=>{q.apAltHold=!q.apAltHold}),K(`btnApApr`).addEventListener(`click`,()=>{q.apApproach=!q.apApproach,q.apApproach&&(q.apMaster=!0,uy())}),K(`btnGear`).addEventListener(`click`,()=>{!q.onGround&&!q.spec.fixedGear&&(q.gearDown=!q.gearDown)});function eb(){Gg()?K(`toast`).classList.contains(`hidden`)&&lb(`本训练模拟襟翼卡在 0°。`):q.flapsIndex=Yh()||q.stallDrill?.flapsUp||q.shortTakeoff?.flapsUp?Math.max(0,q.flapsIndex-1):(q.flapsIndex+1)%(q.spec.flapDetentsDeg??q.flapAngles).length}K(`btnFlaps`).addEventListener(`click`,eb),K(`btnBrakes`).addEventListener(`click`,()=>{q.brakesOn=!q.brakesOn}),K(`btnAutobrake`).addEventListener(`click`,()=>{jp(q.spec).autobrake&&(q.autobrake=(q.autobrake+1)%Ep.length)}),K(`btnReverse`).addEventListener(`click`,()=>{jp(q.spec).reverser&&(q.onGround||q.reverseCmd)&&(q.reverseCmd=!q.reverseCmd,q.throttle=0)}),K(`rngThrottle`).addEventListener(`input`,e=>{q.throttle=Number(e.target.value)/100}),K(`rngThrottle`).addEventListener(`pointerdown`,()=>{xy=!0}),window.addEventListener(`pointerup`,()=>{xy=!1}),window.addEventListener(`pointercancel`,()=>{xy=!1}),K(`btnIdle`).addEventListener(`click`,()=>{q.throttle=0,K(`rngThrottle`).value=0}),K(`btnApp`).addEventListener(`click`,()=>{q.throttle=.44,K(`rngThrottle`).value=44}),K(`btnClimb`).addEventListener(`click`,()=>{q.throttle=.75,K(`rngThrottle`).value=75}),K(`btnToga`).addEventListener(`click`,()=>{q.throttle=1,K(`rngThrottle`).value=100}),K(`btnCenterWings`).addEventListener(`click`,()=>{q.elevInput=0,q.aileronInput=0,q.rudderInput=0,q.angVel.set(0,0,0)});var tb=e=>{for(let t of[`pointerup`,`pointercancel`,`lostpointercapture`])window.addEventListener(t,e,!0);window.addEventListener(`blur`,e),document.addEventListener(`visibilitychange`,e)};function nb(e){let t=null,n=t=>{let n=df(t.clientX,t.clientY,e.getBoundingClientRect());q.stick.x=n.x,q.stick.y=n.y};e.addEventListener(`pointerdown`,r=>{t=r.pointerId,e.setPointerCapture(r.pointerId),q.stick.active=!0,n(r),r.preventDefault()}),e.addEventListener(`pointermove`,e=>{e.pointerId===t&&n(e)}),tb(e=>{(e.pointerId==null||e.pointerId===t)&&(t=null,q.stick.active=!1,q.stick.x=0,q.stick.y=0)})}nb(K(`virtualStickPad`)),nb(K(`touchStick`)),(function(){let e=K(`touchThrottle`),t=null,n=t=>{q.throttle=pf(t.clientY,e.getBoundingClientRect()),K(`rngThrottle`).value=Math.round(q.throttle*100)};e.addEventListener(`pointerdown`,r=>{t=r.pointerId,e.setPointerCapture(r.pointerId),n(r),r.preventDefault()}),e.addEventListener(`pointermove`,e=>{e.pointerId===t&&n(e)}),tb(e=>{e.pointerId===t&&(t=null)})})();var rb={up:!1,dn:!1};for(let[e,t]of[[`touchTrimDn`,`dn`],[`touchTrimUp`,`up`]]){let n=K(e),r=null,i=e=>{rb[t]=e,q.touchTrim=+!!rb.up-!!rb.dn};n.addEventListener(`pointerdown`,e=>{r=e.pointerId,n.setPointerCapture(e.pointerId),i(!0),e.preventDefault()}),tb(e=>{(e.pointerId==null||e.pointerId===r)&&(r=null,i(!1))})}var ib={l:0,r:0},ab=400;for(let[e,t]of[[`touchRudL`,`l`],[`touchRudR`,`r`]]){let n=K(e),r=null;n.addEventListener(`pointerdown`,e=>{r=e.pointerId,n.setPointerCapture(e.pointerId),ib[t]=performance.now(),e.preventDefault(),q.touchYaw=Math.round(P.clamp(q.touchYaw+(t===`r`?.2:-.2),-1,1)*10)/10}),tb(e=>{(e.pointerId==null||e.pointerId===r)&&(r=null,ib[t]=0)})}var ob=!1,sb=0;K(`touchGear`).addEventListener(`click`,()=>K(`btnGear`).click()),K(`touchFlaps`).addEventListener(`click`,()=>K(`btnFlaps`).click()),K(`touchBrakes`).addEventListener(`click`,()=>K(`btnBrakes`).click()),K(`touchIls`).addEventListener(`click`,()=>{K(q.onGround&&jp(q.spec).reverser?`btnReverse`:`btnApApr`).click()});var cb=0;function lb(e,t=3500){let n=K(`toast`);n.textContent=e,n.classList.remove(`hidden`),clearTimeout(cb),cb=setTimeout(()=>n.classList.add(`hidden`),t)}var ub=null,db=!1;window.addEventListener(`gamepadconnected`,e=>G(()=>import(`./gamepad-CTiqvJqI.js`).then(t=>lb(t.connectedText(e.gamepad?.id))),[],import.meta.url).catch(console.warn)),window.addEventListener(`gamepaddisconnected`,()=>{q.pad=null,lb(`🎮 手柄已断开`)});function fb(){if(!ub){!db&&navigator.getGamepads?.().some(Boolean)&&(db=G(()=>import(`./gamepad-CTiqvJqI.js`).then(e=>ub=e,e=>{db=!1,console.warn(e)}),[],import.meta.url)),q.pad=null;return}let e=ub.pollGamepad(q,C_);if(!e)q.pad=null;else if(q.pad=e.targets,lh)e.edges.length&&lh.stop();else if(Wy.classList.contains(`hidden`))for(let t of e.edges)ub.PAD_CLICKS[t]&&K(ub.PAD_CLICKS[t]).click()}var pb=!1,mb=0,hb=0;Rm.addEventListener(`mousedown`,e=>{pb=!0,mb=e.clientX,hb=e.clientY}),window.addEventListener(`mousemove`,e=>{if(q.mouseYoke){let t=K(`mouseFlightCrosshair`);t.style.left=`${e.clientX}px`,t.style.top=`${e.clientY}px`;let n=e.clientX/window.innerWidth*2-1,r=e.clientY/window.innerHeight*2-1;q.mouseStick.x=P.clamp(n*1.5,-1,1),q.mouseStick.y=P.clamp(r*1.5,-1,1),vd(q.assist)||(q.spec.pilotRoll||(q.aileronInput=q.mouseStick.x),q.elevInput=q.mouseStick.y)}else if(pb){let t=e.clientX-mb,n=e.clientY-hb;mb=e.clientX,hb=e.clientY,q.orbitYaw-=t*.008,q.orbitPitch=P.clamp(q.orbitPitch+n*.008,-.4,1.4)}}),window.addEventListener(`mouseup`,()=>{pb=!1}),window.addEventListener(`wheel`,e=>{q.orbitDist=P.clamp(q.orbitDist+e.deltaY*.05,12,160)},{passive:!0});try{localStorage.getItem(`openaero_keys_v1`)&&G(()=>import(`./controlsSheet--9mC7s3I.js`).then(e=>e.useStoredKeys()),[],import.meta.url).catch(console.warn)}catch{}window.addEventListener(`keydown`,e=>{let t=sf(e.code);af[t]=!0,!My()&&(e.ctrlKey&&/Key[RB]/.test(e.code+t)||t!==e.code)&&e.preventDefault(),e.code===`Space`&&e.target.closest?.(`button`)&&!Dy.contains(e.target)&&e.preventDefault(),e.key===`?`?e.repeat||Ky():t===`KeyG`?!q.onGround&&!q.spec.fixedGear&&(q.gearDown=!q.gearDown):t===`KeyF`?e.repeat&&Gg()||eb():t===`KeyB`?q.brakesOn=!q.brakesOn:t===`KeyK`?K(`btnAutobrake`).click():t===`KeyR`?K(`btnReverse`).click():t===`KeyC`?K(`btnCamera`).click():t===`KeyM`?K(`btnMouseYoke`).click():t===`KeyH`?vy(!document.body.classList.contains(`view-clean`)):t===`KeyZ`?K(`btnApMaster`).click():t===`Space`&&(q.elevInput=0,q.aileronInput=0,q.rudderInput=0,q.angVel.set(0,0,0))}),window.addEventListener(`keyup`,e=>{af[sf(e.code)]=!1}),K(`btnAudio`).addEventListener(`click`,()=>{_h.ctx?(q.audioEnabled=!q.audioEnabled,vh()):_h.init(),K(`chkAutoSound`).checked=q.audioEnabled,Ry()});var gb=Pf(),_b=K(`resultsCard`),vb,yb=performance.now(),bb=.25;function xb(e){requestAnimationFrame(xb),vb.update(e);let t=e-yb,n=Math.min(t/1e3,bb);yb=e;let r=q.paused||eh.lost||document.hidden||My();r?($m&&Nm(Qm),$m=!1):($m=!0,Pm(Qm,t)&&Vm.setPixelRatio(Qm.ratio)),gb.sync(!!lh||!r&&_b.classList.contains(`hidden`)),fb(),yv(n),q.paused||K_(n),vv(n),lh?lh.step(n):Ov(),Sb(e/1e3),iv?.update(n,Z,q.windVec,r),!eh.lost&&q.satelliteEnabled&&qm.update(n,Z),Jm.update(n),Ob(n),Vm.render(Hm,Z),Pv(),ey(),wy(),_h.update(!My()),hh.update(performance.now()/1e3)}function Sb(e){nh?.update(Z,{time:e,pixelRatio:Vm.getPixelRatio(),wind:q.windVec,altitudeM:Z.position.y+Lo});let t=fu.uNight.value;rh?.update(e,Vm.getPixelRatio(),t,Z.position,q.wx.visibilitySm),Zm&&(Zm.material.size=5+4*t),ah?.update(t),ih&&(ih.update(q.simTime,q.simTime-uh,Cb,Z.position,t,fu.uGroundTint.value),uh=q.simTime)}function Cb(e){return e===(q.activeEnd?.airport??`KDFW`)?q.wx:q.wxByIcao[e]||q.wx}var wb=new URLSearchParams(window.location.search).has(`debug`),Tb=0,Eb,Db=0;function Ob(e){if(Ph&&(Db-=e)<=0){Db=1;let e=K(`txtGoogleData`);e.textContent!==Jm.state.attributions&&(e.textContent=Jm.state.attributions)}!Eb||(Tb-=e)>0||(Tb=1,Eb.overlay(`${Jm.debugLine()} · px ${Qm.ratio}`))}wb&&(window.openaeroDebugCaption=gh,G(()=>import(`./debugScreen-Dc3_pz73.js`).then(e=>(Eb=e).hooks(q,(e,t)=>Cc(t.airport,t.rwy)&&dy(e,t),e=>e_=e,()=>dg,yh)),__vite__mapDeps([38,3]),import.meta.url)),window.openaeroDebug=()=>{J.setFromQuaternion(q.quat,`YXZ`);let e=q.loadedMission||Jc(q.missionKey),t=(-J.y*V+360)%360;return{mission:q.missionKey,assist:q.assist,trimAlphaDeg:q.trimAlphaDeg,trimKts:q.trimAlphaDeg==null?null:Sf(q.spec,q.trimAlphaDeg,q.flapsIndex),speedLimitKts:q.speedLimitKts??null,overspeed:!!q.overspeed,stallKts:q.stallKts??null,papiWhite:q.papiWhite,papiLampsWhite:Eb?.papiLampsWhite(Zm,q.activeEnd,yc)??null,ilsLocDots:q.ilsLocDots,ilsGsDots:q.ilsGsDots,ilsLocBarPx:q.ilsLocBarPx&&q.ilsLocBarPx*q.hudScale,ilsGsBarPx:q.ilsGsBarPx&&q.ilsGsBarPx*q.hudScale,inputSource:q.inputSource,stick:{...q.stick},simTime:q.simTime,missionRunway:e.airport?`${e.airport}_${e.rwy}`:null,activeRunway:q.activeEnd?.id??null,runwayHdgT:q.activeEnd?.hdgT??null,hudHeading:q.hudHdg,hudTapes:{...jv},speedBug:{kts:U_(),gustAddKts:W_()},hudAltCaption:Nv(Av),headingDeg:t,pitchDeg:J.x*V,bankRightDeg:-J.z*V,aileronInput:q.aileronInput,rudderInput:q.rudderInput,crossM:q.approach.crossM,distM:q.approach.distM,heightAbovePathM:q.approach.heightAbovePathM,pos:{x:q.pos.x,y:q.pos.y,z:q.pos.z},aircraft:q.aircraftKey,aircraftModel:Xm.model?.name,brakesOn:q.brakesOn,parts:Xm.parts&&Bh?Bh.partPoses(Xm.parts):[],gearDown:q.gearDown,fdm:Py&&Py.flies(q.aircraftKey)?`jsbsim`:`builtin`,groundY:q.groundY,aglFt:q.aglFt,raFt:q.raFt,windUpMps:q.windVec.y,mslFt:q.mslFt,onGround:q.onGround,iasKts:q.iasKts,gsKts:q.gsKts,throttle:q.throttle,engineN:q.engineN,flapsIndex:q.flapsIndex,aoaDeg:q.aoaDeg,wxLive:q.wx.live,wetRunway:!!q.wetRunway,precip:iv&&{...iv.state},airspace:Zv&&{...Zv.state},hudWind:{...q.hudWind,arrowDeg:_p(q.hudWind.dirDeg,q.hudWind.kts,t),box:Nv(qv),plainBox:Nv(q.hudWind.plainBox),baroBox:Nv(q.hudWind.baroBox)},pixelRatio:Qm.ratio,paused:q.paused,gfxLost:eh.lost,audio:_h.state,caption:hh.text,wakeLock:gb.held,sun:{mode:Ac[q.timeOfDayMode],elevationDeg:fh.elevationDeg},fltCat:q.wx.fltCat,dh:q.dh&&{...q.dh},cloudBaseFt:q.wx.cloudLayers?.find(e=>e.coverage>=.75)?.baseFt??null,sky:{...nh?.state,cityLights:fu.uNight.value,runwayLights:rh?.count??0},lastLanding:q.lastLanding,stabilizedGate:q.gate,goAround:q.goAround?{...q.goAround}:null,stallDrill:q.stallDrill?{...q.stallDrill}:null,engineFailed:!!q.engineFailed,rto:q.rto?{...q.rto}:null,windshear:q.windshear?{...q.windshear}:null,steepTurns:q.steepTurns?{...q.steepTurns}:null,...q.groundRef&&{[Sg.SNAP]:Sg.debugSnap(q.groundRef)},upset:q.upset?{...q.upset}:null,slowFlight:q.slowFlight?{...q.slowFlight}:null,emergencyDescent:q.emergencyDescent?{...q.emergencyDescent}:null,wake:q.wake&&Ng.debugSnap(q.wake),shortField:q.shortField&&{...q.shortField,end:q.shortField.end.id},noFlap:q.noFlap&&Wg.debugSnap(q.noFlap),wingLow:q.wingLow&&qg.debugSnap(q.wingLow),touchYaw:q.touchYaw,softField:q.softField&&{...q.softField,end:q.softField.end.id},xwTakeoff:q.xwTakeoff&&Vg.debugSnap(q.xwTakeoff),shortTakeoff:q.shortTakeoff&&{...q.shortTakeoff,end:q.shortTakeoff.end.id},surfaceMu:q.surfaceMu,takeoffCalls:[...q.takeoffCalls],landmarks:Eb?.landmarkSeats(Ih,yh)??null,terrain:qm?{...qm.stats,demLoaded:yh.hasDem()}:null,photoreal:Jm?Jm.debugState():null,...Eb?.screen(q.activeEnd,Z,Rm,yh,Vm)}};function kb(){let e=K(`selScenario`);e.innerHTML=``;for(let t of qc){let n=document.createElement(`option`);n.value=t.key,n.textContent=t.label,e.appendChild(n)}}var Ab={recommended:`首次飞行推荐`,weather:`天气`,drills:`训练`,tours:`观光`};function jb(){let e=K(`missionList`),t=K(`btnCrosswindToday`);e.replaceChildren();for(let n of Qc(qc)){let r=document.createElement(`section`);r.className=`flex flex-col gap-1.5`;let i=document.createElement(`h2`);i.className=`text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono`,i.textContent=Ab[n.id]||(hc[n.id]?`${n.id} · ${hc[n.id]}`:n.id);let a=document.createElement(`div`);a.className=`grid grid-cols-1 sm:grid-cols-2 gap-2`;for(let e of n.missions)a.appendChild(Mb(e,n.id===`recommended`));n.id===`recommended`&&a.appendChild(t),r.append(i,a),e.appendChild(r)}t.isConnected||e.prepend(t)}function Mb(e,t){let n=document.createElement(`button`);n.className=`btnMission hud-btn p-3 min-h-[44px] rounded-xl text-left flex flex-col gap-1${t?` border-emerald-500/50`:``}`,n.dataset.scenario=e.key;let r=document.createElement(`div`);r.className=`flex items-center justify-between gap-2 font-bold`;let i=document.createElement(`span`);i.className=t?`text-emerald-300`:e.kind===`tour`?`text-amber-300`:`text-sky-300`,i.textContent=e.label;let a=document.createElement(`span`);a.className=`missionBest shrink-0 text-[10px] font-mono`,r.append(i,a);let o=document.createElement(`div`);return o.className=`text-[10px] text-slate-400`,o.textContent=e.blurb||``,n.append(r,o),n}function Nb(){let e={};try{e=yl(window.localStorage)}catch{}for(let t of document.querySelectorAll(`#missionList .btnMission`)){let n=t.dataset.scenario;if(n===`crosswind_today`){let e=q.crosswindMission;n=e?`${Xc}:${Cc(e.airport,e.rwy).id}`:null}let r=n&&e[ef(n,q.assist)]||null,i=t.querySelector(`.missionBest`);i.textContent=r?`最佳 ${r}`:``,i.className=`missionBest shrink-0 text-[10px] font-mono ${r?`rounded bg-slate-950/80 px-1.5 py-0.5 ${ml[r]}`:``}`}}function Pb(e,t=!0){if(!hd.includes(e))return;let n=q.assist!==e;q.assist=e;for(let t of document.querySelectorAll(`#assistPicker .btnAssist`)){let n=t.dataset.assist===e;t.classList.toggle(`active`,n),t.setAttribute(`aria-pressed`,String(n))}if(document.body.classList.toggle(`assist-kid`,e===`kid`),document.body.classList.toggle(`assist-pilot`,e===`pilot`),zd(ry),t)try{rf(window.localStorage,e)}catch{}Nb(),t&&n&&dy(q.missionKey)}for(let e of document.querySelectorAll(`#assistPicker .btnAssist`))e.addEventListener(`click`,()=>Pb(e.dataset.assist));function Fb(e){for(let t of document.querySelectorAll(`#missionList .btnMission`))t.classList.toggle(`active`,t.dataset.scenario===e.key);K(`txtPickedMission`).textContent=e.label,pv()}function Ib(){kb(),jb(),Nb();let e=!1;try{e=Pl(window.localStorage)}catch{}K(`chkCoach`).checked=!e;try{L_=Rl(window.localStorage)}catch{}K(`chkTutor`).checked=L_;try{Pb(tf(window.localStorage),!1)}catch{Pb(gd,!1)}try{vy(If(window.localStorage),!1)}catch{vy(!0,!1)}location.hostname===`mutaafaziz.com`&&(ov(),setInterval(ov,6e5)),my(),setInterval(()=>{Ac[q.timeOfDayMode]===`Now`&&my()},6e4),Mh(),G(async()=>{let{createSkyDome:e}=await import(`./skyDome-3N-So6MJ.js`);return{createSkyDome:e}},__vite__mapDeps([39,3,4,2,1]),import.meta.url).then(({createSkyDome:e})=>{nh=e({scene:Hm,base:`./`,reducedMotion:th}),lv(),my()}).catch(e=>console.warn(`Sky unavailable, plain haze instead:`,e.message)),s_().catch(()=>{}),G(()=>import(`./gateVerdict-DG2H0aD0.js`).then(e=>Lv=e,console.warn),[],import.meta.url),G(()=>import(`./ads-B0l35Dg_.js`).then(e=>{u_=e.createAds({level:()=>q.assist,inMenu:()=>My()||!_b.classList.contains(`hidden`),pause:()=>{d_=!q.paused,Uy(!0)},resume:()=>{d_&&Uy(!1),d_=!1},root:()=>Gm})}),[],import.meta.url).catch(()=>{}),zh(`b738`);let t=el(window.location.search),n=Hf(Ly,qc.map(e=>e.key),q.cameraNames.length);K(`chkAutoSound`).checked=n.sound,Vy(n.camera);let r=t||n.mission;if(dy(r||`kdfw_35c_final`),r&&(K(`selScenario`).value=r),n.mission&&!t&&(K(`btnStartFlight`).textContent=`继续飞行 ✈`,K(`btnStartFlight`).classList.replace(`px-7`,`px-4`),document.querySelector(`#missionList .btnMission.active`)?.scrollIntoView({block:`nearest`})),n.sound||(K(`chkAutoSound`).closest(`details`).open=!0),t)try{history.replaceState(null,``,`${location.pathname}${rl(location.search)}${location.hash}`)}catch{}Ty(),vb=os({sim:q,menuOpen:My,setPaused:Uy,renderer:Vm}),requestAnimationFrame(xb)}document.readyState===`complete`?Ib():window.addEventListener(`load`,Ib,{once:!0});export{Jr as $,Tl as A,It as At,Oc as B,Xl as C,Cn as Ct,Rl as D,dn as Dt,zl as E,hn as Et,Xc as F,Dt as Ft,Es as G,Cc as H,Jc as I,xt as It,ms as J,Os as K,bc as L,cl as M,Nt as Mt,ol as N,jt as Nt,Cl as O,nn as Ot,hl as P,At as Pt,W as Q,yc as R,Kl as S,H as St,Ll as T,_n as Tt,Ds as U,_c as V,Ns as W,Lo as X,ss as Y,Io as Z,Gl as _,Zn as _t,Kd as a,Sr as at,Yl as b,Vn as bt,dd as c,_r as ct,bu as d,pr as dt,Rr as et,cu as f,dr as ft,au as g,Qn as gt,nu as h,er as ht,cf as i,Cr as it,ml as j,Pt as jt,wl as k,Qt as kt,G as l,hr as lt,su as m,tr as mt,lp as n,Fr as nt,ld as o,yr as ot,ou as p,cr as pt,Ms as q,sf as r,Dr as rt,fd as s,vr as st,Lp as t,Ir as tt,fu as u,mr as ut,eu as v,qn as vt,Il as w,Sn as wt,Jl as x,Ln as xt,Wl as y,Hn as yt,Tc as z};