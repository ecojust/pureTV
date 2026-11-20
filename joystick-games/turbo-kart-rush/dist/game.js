"use strict";(()=>{var Nv=Object.defineProperty;var Uv=(s,e,t)=>e in s?Nv(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var E=(s,e,t)=>Uv(s,typeof e!="symbol"?e+"":e,t);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var Dp=0,td=1,Lp=2;var ga=1,hc=2,eo=3,gi=0,fn=1,bt=2,si=0,es=1,An=2,nd=3,id=4,Fp=5;var ys=100,Hp=101,Bp=102,Np=103,Up=104,Op=200,zp=201,Gp=202,Vp=203,Cl=204,Il=205,Wp=206,qp=207,Xp=208,Yp=209,Kp=210,Zp=211,$p=212,Jp=213,jp=214,Pl=0,kl=1,Dl=2,tr=3,Ll=4,Fl=5,Hl=6,Bl=7,uc=0,Qp=1,em=2,bi=0,va=1,xa=2,ba=3,ur=4,ya=5,_a=6,Ea=7;var sd=300,As=301,dr=302,dc=303,fc=304,Ta=306,Kn=1e3,Rn=1001,Nl=1002,cn=1003,tm=1004;var Ma=1005;var rn=1006,pc=1007;var zn=1008;var Gn=1009,rd=1010,od=1011,to=1012,mc=1013,yi=1014,ri=1015,bn=1016,gc=1017,vc=1018,no=1020,ad=35902,ld=35899,cd=1021,hd=1022,oi=1023,Di=1026,Cs=1027,xc=1028,bc=1029,Is=1030,yc=1031;var _c=1033,Sa=33776,wa=33777,Ra=33778,Aa=33779,Ec=35840,Tc=35841,Mc=35842,Sc=35843,wc=36196,Rc=37492,Ac=37496,Cc=37488,Ic=37489,Ca=37490,Pc=37491,kc=37808,Dc=37809,Lc=37810,Fc=37811,Hc=37812,Bc=37813,Nc=37814,Uc=37815,Oc=37816,zc=37817,Gc=37818,Vc=37819,Wc=37820,qc=37821,Xc=36492,Yc=36494,Kc=36495,Zc=36283,$c=36284,Ia=36285,Jc=36286;var Oo=2300,Ul=2301,Al=2302,Ou=2303,zu=2400,Gu=2401,Vu=2402;var nm=3200;var Pa=0,im=1,_i="",Nt="srgb",zo="srgb-linear",Go="linear",At="srgb";var Qs=7680;var Wu=519,sm=512,rm=513,om=514,jc=515,am=516,lm=517,Qc=518,cm=519,qu=35044,ud=35048;var dd="300 es",mi=2e3,zr=2001;function Ov(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function zv(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Vo(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function hm(){let s=Vo("canvas");return s.style.display="block",s}var np={},Gr=null;function fd(...s){let e="THREE."+s.shift();Gr?Gr("log",e,...s):console.log(e,...s)}function um(s){let e=s[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=s[1];t&&t.isStackTrace?s[0]+=" "+t.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function it(...s){s=um(s);let e="THREE."+s.shift();if(Gr)Gr("warn",e,...s);else{let t=s[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...s)}}function lt(...s){s=um(s);let e="THREE."+s.shift();if(Gr)Gr("error",e,...s);else{let t=s[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...s)}}function er(...s){let e=s.join(" ");e in np||(np[e]=!0,it(...s))}function dm(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var fm={[Pl]:kl,[Dl]:Hl,[Ll]:Bl,[tr]:Fl,[kl]:Pl,[Hl]:Dl,[Bl]:Ll,[Fl]:tr},Li=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}},Sn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ip=1234567,Ho=Math.PI/180,nr=180/Math.PI;function fr(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Sn[s&255]+Sn[s>>8&255]+Sn[s>>16&255]+Sn[s>>24&255]+"-"+Sn[e&255]+Sn[e>>8&255]+"-"+Sn[e>>16&15|64]+Sn[e>>24&255]+"-"+Sn[t&63|128]+Sn[t>>8&255]+"-"+Sn[t>>16&255]+Sn[t>>24&255]+Sn[n&255]+Sn[n>>8&255]+Sn[n>>16&255]+Sn[n>>24&255]).toLowerCase()}function Tt(s,e,t){return Math.max(e,Math.min(t,s))}function pd(s,e){return(s%e+e)%e}function Gv(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function Vv(s,e,t){return s!==e?(t-s)/(e-s):0}function Bo(s,e,t){return(1-t)*s+t*e}function Wv(s,e,t,n){return Bo(s,e,1-Math.exp(-t*n))}function qv(s,e=1){return e-Math.abs(pd(s,e*2)-e)}function Xv(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function Yv(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Kv(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Zv(s,e){return s+Math.random()*(e-s)}function $v(s){return s*(.5-Math.random())}function Jv(s){s!==void 0&&(ip=s);let e=ip+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function jv(s){return s*Ho}function Qv(s){return s*nr}function ex(s){return(s&s-1)===0&&s!==0}function tx(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function nx(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ix(s,e,t,n,i){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+n)/2),h=o((e+n)/2),u=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),g=o((n-e)/2);switch(i){case"XYX":s.set(a*h,l*u,l*d,a*c);break;case"YZY":s.set(l*d,a*h,l*u,a*c);break;case"ZXZ":s.set(l*u,l*d,a*h,a*c);break;case"XZX":s.set(a*h,l*g,l*f,a*c);break;case"YXY":s.set(l*f,a*h,l*g,a*c);break;case"ZYZ":s.set(l*g,l*f,a*h,a*c);break;default:it("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ur(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Dn(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var io={DEG2RAD:Ho,RAD2DEG:nr,generateUUID:fr,clamp:Tt,euclideanModulo:pd,mapLinear:Gv,inverseLerp:Vv,lerp:Bo,damp:Wv,pingpong:qv,smoothstep:Xv,smootherstep:Yv,randInt:Kv,randFloat:Zv,randFloatSpread:$v,seededRandom:Jv,degToRad:jv,radToDeg:Qv,isPowerOfTwo:ex,ceilPowerOfTwo:tx,floorPowerOfTwo:nx,setQuaternionFromProperEuler:ix,normalize:Dn,denormalize:Ur},yd=class yd{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Tt(this.x,e.x,t.x),this.y=Tt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Tt(this.x,e,t),this.y=Tt(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Tt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};yd.prototype.isVector2=!0;var de=yd,wt=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=r[o+0],f=r[o+1],g=r[o+2],v=r[o+3];if(u!==v||l!==d||c!==f||h!==g){let p=l*d+c*f+h*g+u*v;p<0&&(d=-d,f=-f,g=-g,v=-v,p=-p);let m=1-a;if(p<.9995){let y=Math.acos(p),_=Math.sin(y);m=Math.sin(m*y)/_,a=Math.sin(a*y)/_,l=l*m+d*a,c=c*m+f*a,h=h*m+g*a,u=u*m+v*a}else{l=l*m+d*a,c=c*m+f*a,h=h*m+g*a,u=u*m+v*a;let y=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=y,c*=y,h*=y,u*=y}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,o){let a=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+h*u+l*f-c*d,e[t+1]=l*g+h*d+c*u-a*f,e[t+2]=c*g+h*f+a*d-l*u,e[t+3]=h*g-a*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(i/2),u=a(r/2),d=l(n/2),f=l(i/2),g=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"YZX":this._x=d*h*u+c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u-d*f*g;break;case"XZY":this._x=d*h*u-c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u+d*f*g;break;default:it("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-i)*f}else if(n>a&&n>u){let f=2*Math.sqrt(1+n-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(r+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-n-u);this._w=(r-c)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-n-a);this._w=(o-i)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Tt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+o*a+i*c-r*l,this._y=i*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-i*a,this._w=o*h-n*a-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(n=-n,i=-i,r=-r,o=-o,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},_d=class _d{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(sp.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(sp.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*i-a*n),h=2*(a*t-r*i),u=2*(r*n-o*t);return this.x=t+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=i+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Tt(this.x,e.x,t.x),this.y=Tt(this.y,e.y,t.y),this.z=Tt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Tt(this.x,e,t),this.y=Tt(this.y,e,t),this.z=Tt(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Tt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=i*l-r*a,this.y=r*o-n*l,this.z=n*a-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return mu.copy(this).projectOnVector(e),this.sub(mu)}reflect(e){return this.sub(mu.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};_d.prototype.isVector3=!0;var C=_d,mu=new C,sp=new wt,Ed=class Ed{constructor(e,t,n,i,r,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,l,c)}set(e,t,n,i,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=i,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],v=i[0],p=i[3],m=i[6],y=i[1],_=i[4],x=i[7],S=i[2],M=i[5],w=i[8];return r[0]=o*v+a*y+l*S,r[3]=o*p+a*_+l*M,r[6]=o*m+a*x+l*w,r[1]=c*v+h*y+u*S,r[4]=c*p+h*_+u*M,r[7]=c*m+h*x+u*w,r[2]=d*v+f*y+g*S,r[5]=d*p+f*_+g*M,r[8]=d*m+f*x+g*w,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-n*r*h+n*a*l+i*r*c-i*o*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*o-a*c,d=a*l-h*r,f=c*r-o*l,g=t*u+n*d+i*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(i*c-h*n)*v,e[2]=(a*n-i*o)*v,e[3]=d*v,e[4]=(h*t-i*l)*v,e[5]=(i*r-a*t)*v,e[6]=f*v,e[7]=(n*l-c*t)*v,e[8]=(o*t-n*r)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-i*c,i*l,-i*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return er("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(gu.makeScale(e,t)),this}rotate(e){return er("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(gu.makeRotation(-e)),this}translate(e,t){return er("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(gu.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ed.prototype.isMatrix3=!0;var ut=Ed,gu=new ut,rp=new ut().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),op=new ut().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function sx(){let s={enabled:!0,workingColorSpace:zo,spaces:{},convert:function(i,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===At&&(i.r=Qi(i.r),i.g=Qi(i.g),i.b=Qi(i.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===At&&(i.r=Or(i.r),i.g=Or(i.g),i.b=Or(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===_i?Go:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,o){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return er("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return er("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[zo]:{primaries:e,whitePoint:n,transfer:Go,toXYZ:rp,fromXYZ:op,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Nt},outputColorSpaceConfig:{drawingBufferColorSpace:Nt}},[Nt]:{primaries:e,whitePoint:n,transfer:At,toXYZ:rp,fromXYZ:op,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Nt}}}),s}var Mt=sx();function Qi(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Or(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var wr,Ol=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{wr===void 0&&(wr=Vo("canvas")),wr.width=e.width,wr.height=e.height;let i=wr.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=wr}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Vo("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Qi(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Qi(t[n]/255)*255):t[n]=Qi(t[n]);return{data:t,width:e.width,height:e.height}}else return it("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},rx=0,Vr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rx++}),this.uuid=fr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(vu(i[o].image)):r.push(vu(i[o]))}else r=vu(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function vu(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Ol.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(it("Texture: Unable to serialize Texture."),{})}var ox=0,xu=new C,Ln=class s extends Li{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=Rn,i=Rn,r=rn,o=zn,a=oi,l=Gn,c=s.DEFAULT_ANISOTROPY,h=_i){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ox++}),this.uuid=fr(),this.name="",this.source=new Vr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new de(0,0),this.repeat=new de(1,1),this.center=new de(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ut,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(xu).x}get height(){return this.source.getSize(xu).y}get depth(){return this.source.getSize(xu).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){it(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){it(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==sd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Kn:e.x=e.x-Math.floor(e.x);break;case Rn:e.x=e.x<0?0:1;break;case Nl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Kn:e.y=e.y-Math.floor(e.y);break;case Rn:e.y=e.y<0?0:1;break;case Nl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ln.DEFAULT_IMAGE=null;Ln.DEFAULT_MAPPING=sd;Ln.DEFAULT_ANISOTROPY=1;var Td=class Td{constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],g=l[9],v=l[2],p=l[6],m=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+v)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(c+1)/2,x=(f+1)/2,S=(m+1)/2,M=(h+d)/4,w=(u+v)/4,b=(g+p)/4;return _>x&&_>S?_<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(_),i=M/n,r=w/n):x>S?x<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(x),n=M/i,r=b/i):S<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(S),n=w/r,i=b/r),this.set(n,i,r,t),this}let y=Math.sqrt((p-g)*(p-g)+(u-v)*(u-v)+(d-h)*(d-h));return Math.abs(y)<.001&&(y=1),this.x=(p-g)/y,this.y=(u-v)/y,this.z=(d-h)/y,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Tt(this.x,e.x,t.x),this.y=Tt(this.y,e.y,t.y),this.z=Tt(this.z,e.z,t.z),this.w=Tt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Tt(this.x,e,t),this.y=Tt(this.y,e,t),this.z=Tt(this.z,e,t),this.w=Tt(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Tt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Td.prototype.isVector4=!0;var qt=Td,zl=class extends Li{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:rn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new qt(0,0,e,t),this.scissorTest=!1,this.viewport=new qt(0,0,e,t),this.textures=[];let i={width:e,height:t,depth:n.depth},r=new Ln(i),o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:rn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new Vr(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},on=class extends zl{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Wo=class extends Ln{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=cn,this.minFilter=cn,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Gl=class extends Ln{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=cn,this.minFilter=cn,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var cc=class cc{constructor(e,t,n,i,r,o,a,l,c,h,u,d,f,g,v,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,a,l,c,h,u,d,f,g,v,p)}set(e,t,n,i,r,o,a,l,c,h,u,d,f,g,v,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=i,m[1]=r,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=g,m[11]=v,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new cc().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,i=1/Rr.setFromMatrixColumn(e,0).length(),r=1/Rr.setFromMatrixColumn(e,1).length(),o=1/Rr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*h,f=o*u,g=a*h,v=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+g*c,t[5]=d-v*c,t[9]=-a*l,t[2]=v-d*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){let d=l*h,f=l*u,g=c*h,v=c*u;t[0]=d+v*a,t[4]=g*a-f,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=f*a-g,t[6]=v+d*a,t[10]=o*l}else if(e.order==="ZXY"){let d=l*h,f=l*u,g=c*h,v=c*u;t[0]=d-v*a,t[4]=-o*u,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*h,t[9]=v-d*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let d=o*h,f=o*u,g=a*h,v=a*u;t[0]=l*h,t[4]=g*c-f,t[8]=d*c+v,t[1]=l*u,t[5]=v*c+d,t[9]=f*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let d=o*l,f=o*c,g=a*l,v=a*c;t[0]=l*h,t[4]=v-d*u,t[8]=g*u+f,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=f*u+g,t[10]=d-v*u}else if(e.order==="XZY"){let d=o*l,f=o*c,g=a*l,v=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+v,t[5]=o*h,t[9]=f*u-g,t[2]=g*u-f,t[6]=a*h,t[10]=v*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ax,e,lx)}lookAt(e,t,n){let i=this.elements;return Xn.subVectors(e,t),Xn.lengthSq()===0&&(Xn.z=1),Xn.normalize(),fs.crossVectors(n,Xn),fs.lengthSq()===0&&(Math.abs(n.z)===1?Xn.x+=1e-4:Xn.z+=1e-4,Xn.normalize(),fs.crossVectors(n,Xn)),fs.normalize(),il.crossVectors(Xn,fs),i[0]=fs.x,i[4]=il.x,i[8]=Xn.x,i[1]=fs.y,i[5]=il.y,i[9]=Xn.y,i[2]=fs.z,i[6]=il.z,i[10]=Xn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],v=n[6],p=n[10],m=n[14],y=n[3],_=n[7],x=n[11],S=n[15],M=i[0],w=i[4],b=i[8],R=i[12],P=i[1],k=i[5],L=i[9],H=i[13],B=i[2],F=i[6],O=i[10],z=i[14],J=i[3],ne=i[7],ue=i[11],fe=i[15];return r[0]=o*M+a*P+l*B+c*J,r[4]=o*w+a*k+l*F+c*ne,r[8]=o*b+a*L+l*O+c*ue,r[12]=o*R+a*H+l*z+c*fe,r[1]=h*M+u*P+d*B+f*J,r[5]=h*w+u*k+d*F+f*ne,r[9]=h*b+u*L+d*O+f*ue,r[13]=h*R+u*H+d*z+f*fe,r[2]=g*M+v*P+p*B+m*J,r[6]=g*w+v*k+p*F+m*ne,r[10]=g*b+v*L+p*O+m*ue,r[14]=g*R+v*H+p*z+m*fe,r[3]=y*M+_*P+x*B+S*J,r[7]=y*w+_*k+x*F+S*ne,r[11]=y*b+_*L+x*O+S*ue,r[15]=y*R+_*H+x*z+S*fe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],g=e[3],v=e[7],p=e[11],m=e[15],y=l*f-c*d,_=a*f-c*u,x=a*d-l*u,S=o*f-c*h,M=o*d-l*h,w=o*u-a*h;return t*(v*y-p*_+m*x)-n*(g*y-p*S+m*M)+i*(g*_-v*S+m*w)-r*(g*x-v*M+p*w)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],o=e[5],a=e[9],l=e[2],c=e[6],h=e[10];return t*(o*h-a*c)-n*(r*h-a*l)+i*(r*c-o*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],g=e[12],v=e[13],p=e[14],m=e[15],y=t*a-n*o,_=t*l-i*o,x=t*c-r*o,S=n*l-i*a,M=n*c-r*a,w=i*c-r*l,b=h*v-u*g,R=h*p-d*g,P=h*m-f*g,k=u*p-d*v,L=u*m-f*v,H=d*m-f*p,B=y*H-_*L+x*k+S*P-M*R+w*b;if(B===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/B;return e[0]=(a*H-l*L+c*k)*F,e[1]=(i*L-n*H-r*k)*F,e[2]=(v*w-p*M+m*S)*F,e[3]=(d*M-u*w-f*S)*F,e[4]=(l*P-o*H-c*R)*F,e[5]=(t*H-i*P+r*R)*F,e[6]=(p*x-g*w-m*_)*F,e[7]=(h*w-d*x+f*_)*F,e[8]=(o*L-a*P+c*b)*F,e[9]=(n*P-t*L-r*b)*F,e[10]=(g*M-v*x+m*y)*F,e[11]=(u*x-h*M-f*y)*F,e[12]=(a*R-o*k-l*b)*F,e[13]=(t*k-n*R+i*b)*F,e[14]=(v*_-g*S-p*y)*F,e[15]=(h*S-u*_+d*y)*F,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,h*a+n,h*l-i*o,0,c*l-i*a,h*l+i*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,u=a+a,d=r*c,f=r*h,g=r*u,v=o*h,p=o*u,m=a*u,y=l*c,_=l*h,x=l*u,S=n.x,M=n.y,w=n.z;return i[0]=(1-(v+m))*S,i[1]=(f+x)*S,i[2]=(g-_)*S,i[3]=0,i[4]=(f-x)*M,i[5]=(1-(d+m))*M,i[6]=(p+y)*M,i[7]=0,i[8]=(g+_)*w,i[9]=(p-y)*w,i[10]=(1-(d+v))*w,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let o=Rr.set(i[0],i[1],i[2]).length(),a=Rr.set(i[4],i[5],i[6]).length(),l=Rr.set(i[8],i[9],i[10]).length();r<0&&(o=-o),di.copy(this);let c=1/o,h=1/a,u=1/l;return di.elements[0]*=c,di.elements[1]*=c,di.elements[2]*=c,di.elements[4]*=h,di.elements[5]*=h,di.elements[6]*=h,di.elements[8]*=u,di.elements[9]*=u,di.elements[10]*=u,t.setFromRotationMatrix(di),n.x=o,n.y=a,n.z=l,this}makePerspective(e,t,n,i,r,o,a=mi,l=!1){let c=this.elements,h=2*r/(t-e),u=2*r/(n-i),d=(t+e)/(t-e),f=(n+i)/(n-i),g,v;if(l)g=r/(o-r),v=o*r/(o-r);else if(a===mi)g=-(o+r)/(o-r),v=-2*o*r/(o-r);else if(a===zr)g=-o/(o-r),v=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,o,a=mi,l=!1){let c=this.elements,h=2/(t-e),u=2/(n-i),d=-(t+e)/(t-e),f=-(n+i)/(n-i),g,v;if(l)g=1/(o-r),v=o/(o-r);else if(a===mi)g=-2/(o-r),v=-(o+r)/(o-r);else if(a===zr)g=-1/(o-r),v=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};cc.prototype.isMatrix4=!0;var xt=cc,Rr=new C,di=new xt,ax=new C(0,0,0),lx=new C(1,1,1),fs=new C,il=new C,Xn=new C,ap=new xt,lp=new wt,Ft=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],o=i[4],a=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(Tt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Tt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Tt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Tt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Tt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Tt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:it("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ap.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ap,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return lp.setFromEuler(this),this.setFromQuaternion(lp,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ft.DEFAULT_ORDER="XYZ";var qo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},cx=0,cp=new C,Ar=new wt,Ki=new xt,sl=new C,Co=new C,hx=new C,ux=new wt,hp=new C(1,0,0),up=new C(0,1,0),dp=new C(0,0,1),fp={type:"added"},dx={type:"removed"},Cr={type:"childadded",child:null},bu={type:"childremoved",child:null},dn=class s extends Li{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:cx++}),this.uuid=fr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new C,t=new Ft,n=new wt,i=new C(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new xt},normalMatrix:{value:new ut}}),this.matrix=new xt,this.matrixWorld=new xt,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new qo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ar.setFromAxisAngle(e,t),this.quaternion.multiply(Ar),this}rotateOnWorldAxis(e,t){return Ar.setFromAxisAngle(e,t),this.quaternion.premultiply(Ar),this}rotateX(e){return this.rotateOnAxis(hp,e)}rotateY(e){return this.rotateOnAxis(up,e)}rotateZ(e){return this.rotateOnAxis(dp,e)}translateOnAxis(e,t){return cp.copy(e).applyQuaternion(this.quaternion),this.position.add(cp.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(hp,e)}translateY(e){return this.translateOnAxis(up,e)}translateZ(e){return this.translateOnAxis(dp,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ki.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?sl.copy(e):sl.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Co.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ki.lookAt(Co,sl,this.up):Ki.lookAt(sl,Co,this.up),this.quaternion.setFromRotationMatrix(Ki),i&&(Ki.extractRotation(i.matrixWorld),Ar.setFromRotationMatrix(Ki),this.quaternion.premultiply(Ar.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(lt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(fp),Cr.child=e,this.dispatchEvent(Cr),Cr.child=null):lt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(dx),bu.child=e,this.dispatchEvent(bu),bu.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ki.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ki.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ki),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(fp),Cr.child=e,this.dispatchEvent(Cr),Cr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Co,e,hx),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Co,ux,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,i=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),this.static!==!1&&(i.static=this.static),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(a=>({...a})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];i.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),d=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=i,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};dn.DEFAULT_UP=new C(0,1,0);dn.DEFAULT_MATRIX_AUTO_UPDATE=!0;dn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Qe=class extends dn{constructor(){super(),this.isGroup=!0,this.type="Group"}},fx={type:"move"},Wr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let v of e.hand.values()){let p=t.getJointPose(v,n),m=this._getHandJoint(c,v);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(fx)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Qe;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},pm={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ps={h:0,s:0,l:0},rl={h:0,s:0,l:0};function yu(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var ae=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Nt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Mt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=Mt.workingColorSpace){return this.r=e,this.g=t,this.b=n,Mt.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=Mt.workingColorSpace){if(e=pd(e,1),t=Tt(t,0,1),n=Tt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=yu(o,r,e+1/3),this.g=yu(o,r,e),this.b=yu(o,r,e-1/3)}return Mt.colorSpaceToWorking(this,i),this}setStyle(e,t=Nt){function n(r){r!==void 0&&parseFloat(r)<1&&it("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:it("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);it("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Nt){let n=pm[e.toLowerCase()];return n!==void 0?this.setHex(n,t):it("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Qi(e.r),this.g=Qi(e.g),this.b=Qi(e.b),this}copyLinearToSRGB(e){return this.r=Or(e.r),this.g=Or(e.g),this.b=Or(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Nt){return Mt.workingToColorSpace(wn.copy(this),e),Math.round(Tt(wn.r*255,0,255))*65536+Math.round(Tt(wn.g*255,0,255))*256+Math.round(Tt(wn.b*255,0,255))}getHexString(e=Nt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Mt.workingColorSpace){Mt.workingToColorSpace(wn.copy(this),t);let n=wn.r,i=wn.g,r=wn.b,o=Math.max(n,i,r),a=Math.min(n,i,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Mt.workingColorSpace){return Mt.workingToColorSpace(wn.copy(this),t),e.r=wn.r,e.g=wn.g,e.b=wn.b,e}getStyle(e=Nt){Mt.workingToColorSpace(wn.copy(this),e);let t=wn.r,n=wn.g,i=wn.b;return e!==Nt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(ps),this.setHSL(ps.h+e,ps.s+t,ps.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ps),e.getHSL(rl);let n=Bo(ps.h,rl.h,t),i=Bo(ps.s,rl.s,t),r=Bo(ps.l,rl.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},wn=new ae;ae.NAMES=pm;var ir=class s{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new ae(e),this.density=t}clone(){return new s(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var sr=class extends dn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ft,this.environmentIntensity=1,this.environmentRotation=new Ft,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},fi=new C,Zi=new C,_u=new C,$i=new C,Ir=new C,Pr=new C,pp=new C,Eu=new C,Tu=new C,Mu=new C,Su=new qt,wu=new qt,Ru=new qt,bs=class s{constructor(e=new C,t=new C,n=new C){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),fi.subVectors(e,t),i.cross(fi);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){fi.subVectors(i,t),Zi.subVectors(n,t),_u.subVectors(e,t);let o=fi.dot(fi),a=fi.dot(Zi),l=fi.dot(_u),c=Zi.dot(Zi),h=Zi.dot(_u),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-a*h)*d,g=(o*h-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,$i)===null?!1:$i.x>=0&&$i.y>=0&&$i.x+$i.y<=1}static getInterpolation(e,t,n,i,r,o,a,l){return this.getBarycoord(e,t,n,i,$i)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,$i.x),l.addScaledVector(o,$i.y),l.addScaledVector(a,$i.z),l)}static getInterpolatedAttribute(e,t,n,i,r,o){return Su.setScalar(0),wu.setScalar(0),Ru.setScalar(0),Su.fromBufferAttribute(e,t),wu.fromBufferAttribute(e,n),Ru.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(Su,r.x),o.addScaledVector(wu,r.y),o.addScaledVector(Ru,r.z),o}static isFrontFacing(e,t,n,i){return fi.subVectors(n,t),Zi.subVectors(e,t),fi.cross(Zi).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return fi.subVectors(this.c,this.b),Zi.subVectors(this.a,this.b),fi.cross(Zi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,o,a;Ir.subVectors(i,n),Pr.subVectors(r,n),Eu.subVectors(e,n);let l=Ir.dot(Eu),c=Pr.dot(Eu);if(l<=0&&c<=0)return t.copy(n);Tu.subVectors(e,i);let h=Ir.dot(Tu),u=Pr.dot(Tu);if(h>=0&&u<=h)return t.copy(i);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(n).addScaledVector(Ir,o);Mu.subVectors(e,r);let f=Ir.dot(Mu),g=Pr.dot(Mu);if(g>=0&&f<=g)return t.copy(r);let v=f*c-l*g;if(v<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(n).addScaledVector(Pr,a);let p=h*g-f*u;if(p<=0&&u-h>=0&&f-g>=0)return pp.subVectors(r,i),a=(u-h)/(u-h+(f-g)),t.copy(i).addScaledVector(pp,a);let m=1/(p+v+d);return o=v*m,a=d*m,t.copy(n).addScaledVector(Ir,o).addScaledVector(Pr,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Fi=class{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(pi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(pi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=pi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,pi):pi.fromBufferAttribute(r,o),pi.applyMatrix4(e.matrixWorld),this.expandByPoint(pi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ol.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ol.copy(n.boundingBox)),ol.applyMatrix4(e.matrixWorld),this.union(ol)}let i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,pi),pi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Io),al.subVectors(this.max,Io),kr.subVectors(e.a,Io),Dr.subVectors(e.b,Io),Lr.subVectors(e.c,Io),ms.subVectors(Dr,kr),gs.subVectors(Lr,Dr),Zs.subVectors(kr,Lr);let t=[0,-ms.z,ms.y,0,-gs.z,gs.y,0,-Zs.z,Zs.y,ms.z,0,-ms.x,gs.z,0,-gs.x,Zs.z,0,-Zs.x,-ms.y,ms.x,0,-gs.y,gs.x,0,-Zs.y,Zs.x,0];return!Au(t,kr,Dr,Lr,al)||(t=[1,0,0,0,1,0,0,0,1],!Au(t,kr,Dr,Lr,al))?!1:(ll.crossVectors(ms,gs),t=[ll.x,ll.y,ll.z],Au(t,kr,Dr,Lr,al))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,pi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(pi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ji[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ji[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ji[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ji[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ji[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ji[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ji[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ji[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ji),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ji=[new C,new C,new C,new C,new C,new C,new C,new C],pi=new C,ol=new Fi,kr=new C,Dr=new C,Lr=new C,ms=new C,gs=new C,Zs=new C,Io=new C,al=new C,ll=new C,$s=new C;function Au(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){$s.fromArray(s,r);let a=i.x*Math.abs($s.x)+i.y*Math.abs($s.y)+i.z*Math.abs($s.z),l=e.dot($s),c=t.dot($s),h=n.dot($s);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var ln=new C,cl=new de,px=0,ot=class extends Li{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:px++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=qu,this.updateRanges=[],this.gpuType=ri,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)cl.fromBufferAttribute(this,t),cl.applyMatrix3(e),this.setXY(t,cl.x,cl.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix3(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyMatrix4(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.applyNormalMatrix(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ln.fromBufferAttribute(this,t),ln.transformDirection(e),this.setXYZ(t,ln.x,ln.y,ln.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ur(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ur(t,this.array)),t}setX(e,t){return this.normalized&&(t=Dn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ur(t,this.array)),t}setY(e,t){return this.normalized&&(t=Dn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ur(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Dn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ur(t,this.array)),t}setW(e,t){return this.normalized&&(t=Dn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Dn(t,this.array),n=Dn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Dn(t,this.array),n=Dn(n,this.array),i=Dn(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=Dn(t,this.array),n=Dn(n,this.array),i=Dn(i,this.array),r=Dn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==qu&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}};var Xo=class extends ot{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Yo=class extends ot{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var st=class extends ot{constructor(e,t,n){super(new Float32Array(e),t,n)}},mx=new Fi,Po=new C,Cu=new C,vi=class{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):mx.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Po.subVectors(e,this.center);let t=Po.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Po,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Cu.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Po.copy(e.center).add(Cu)),this.expandByPoint(Po.copy(e.center).sub(Cu))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},gx=0,ii=new xt,Iu=new dn,Fr=new C,Yn=new Fi,ko=new Fi,vn=new C,dt=class s extends Li{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:gx++}),this.uuid=fr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ov(e)?Yo:Xo)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ut().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ii.makeRotationFromQuaternion(e),this.applyMatrix4(ii),this}rotateX(e){return ii.makeRotationX(e),this.applyMatrix4(ii),this}rotateY(e){return ii.makeRotationY(e),this.applyMatrix4(ii),this}rotateZ(e){return ii.makeRotationZ(e),this.applyMatrix4(ii),this}translate(e,t,n){return ii.makeTranslation(e,t,n),this.applyMatrix4(ii),this}scale(e,t,n){return ii.makeScale(e,t,n),this.applyMatrix4(ii),this}lookAt(e){return Iu.lookAt(e),Iu.updateMatrix(),this.applyMatrix4(Iu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fr).negate(),this.translate(Fr.x,Fr.y,Fr.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let o=e[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new st(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&it("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){lt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Yn.setFromBufferAttribute(r),this.morphTargetsRelative?(vn.addVectors(this.boundingBox.min,Yn.min),this.boundingBox.expandByPoint(vn),vn.addVectors(this.boundingBox.max,Yn.max),this.boundingBox.expandByPoint(vn)):(this.boundingBox.expandByPoint(Yn.min),this.boundingBox.expandByPoint(Yn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&lt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new vi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){lt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){let n=this.boundingSphere.center;if(Yn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];ko.setFromBufferAttribute(a),this.morphTargetsRelative?(vn.addVectors(Yn.min,ko.min),Yn.expandByPoint(vn),vn.addVectors(Yn.max,ko.max),Yn.expandByPoint(vn)):(Yn.expandByPoint(ko.min),Yn.expandByPoint(ko.max))}Yn.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)vn.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(vn));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)vn.fromBufferAttribute(a,c),l&&(Fr.fromBufferAttribute(e,c),vn.add(Fr)),i=Math.max(i,n.distanceToSquared(vn))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&lt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){lt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==n.count)&&(o=new ot(new Float32Array(4*n.count),4),this.setAttribute("tangent",o));let a=[],l=[];for(let b=0;b<n.count;b++)a[b]=new C,l[b]=new C;let c=new C,h=new C,u=new C,d=new de,f=new de,g=new de,v=new C,p=new C;function m(b,R,P){c.fromBufferAttribute(n,b),h.fromBufferAttribute(n,R),u.fromBufferAttribute(n,P),d.fromBufferAttribute(r,b),f.fromBufferAttribute(r,R),g.fromBufferAttribute(r,P),h.sub(c),u.sub(c),f.sub(d),g.sub(d);let k=1/(f.x*g.y-g.x*f.y);isFinite(k)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(k),p.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(k),a[b].add(v),a[R].add(v),a[P].add(v),l[b].add(p),l[R].add(p),l[P].add(p))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let b=0,R=y.length;b<R;++b){let P=y[b],k=P.start,L=P.count;for(let H=k,B=k+L;H<B;H+=3)m(e.getX(H+0),e.getX(H+1),e.getX(H+2))}let _=new C,x=new C,S=new C,M=new C;function w(b){S.fromBufferAttribute(i,b),M.copy(S);let R=a[b];_.copy(R),_.sub(S.multiplyScalar(S.dot(R))).normalize(),x.crossVectors(M,R);let k=x.dot(l[b])<0?-1:1;o.setXYZW(b,_.x,_.y,_.z,k)}for(let b=0,R=y.length;b<R;++b){let P=y[b],k=P.start,L=P.count;for(let H=k,B=k+L;H<B;H+=3)w(e.getX(H+0)),w(e.getX(H+1)),w(e.getX(H+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new ot(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let i=new C,r=new C,o=new C,a=new C,l=new C,c=new C,h=new C,u=new C;if(e)for(let d=0,f=e.count;d<f;d+=3){let g=e.getX(d+0),v=e.getX(d+1),p=e.getX(d+2);i.fromBufferAttribute(t,g),r.fromBufferAttribute(t,v),o.fromBufferAttribute(t,p),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,p),a.add(h),l.add(h),c.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),h.subVectors(o,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)vn.fromBufferAttribute(e,t),vn.normalize(),e.setXYZ(t,vn.x,vn.y,vn.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h),f=0,g=0;for(let v=0,p=l.length;v<p;v++){a.isInterleavedBufferAttribute?f=l[v]*a.data.stride+a.offset:f=l[v]*h;for(let m=0;m<h;m++)d[g++]=c[f++]}return new ot(d,h,u)}if(this.index===null)return it("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let a in i){let l=i[a],c=e(l,n);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=e(d,n);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var vx=0,Hi=class extends Li{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:vx++}),this.uuid=fr(),this.name="",this.type="Material",this.blending=es,this.side=gi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Cl,this.blendDst=Il,this.blendEquation=ys,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ae(0,0,0),this.blendAlpha=0,this.depthFunc=tr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Wu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Qs,this.stencilZFail=Qs,this.stencilZPass=Qs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){it(`Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){it(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==es&&(n.blending=this.blending),this.side!==gi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Cl&&(n.blendSrc=this.blendSrc),this.blendDst!==Il&&(n.blendDst=this.blendDst),this.blendEquation!==ys&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==tr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Wu&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Qs&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Qs&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Qs&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new ae().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new de().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new de().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var ji=new C,Pu=new C,hl=new C,vs=new C,ku=new C,ul=new C,Du=new C,Ko=class{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ji)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ji.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ji.copy(this.origin).addScaledVector(this.direction,t),ji.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Pu.copy(e).add(t).multiplyScalar(.5),hl.copy(t).sub(e).normalize(),vs.copy(this.origin).sub(Pu);let r=e.distanceTo(t)*.5,o=-this.direction.dot(hl),a=vs.dot(this.direction),l=-vs.dot(hl),c=vs.lengthSq(),h=Math.abs(1-o*o),u,d,f,g;if(h>0)if(u=o*l-a,d=o*a-l,g=r*h,u>=0)if(d>=-g)if(d<=g){let v=1/h;u*=v,d*=v,f=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Pu).addScaledVector(hl,d),f}intersectSphere(e,t){ji.subVectors(e.center,this.origin);let n=ji.dot(this.direction),i=ji.dot(ji)-n*n,r=e.radius*e.radius;if(i>r)return null;let o=Math.sqrt(r-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,o=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,o=(e.min.y-d.y)*h),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),u>=0?(a=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,ji)!==null}intersectTriangle(e,t,n,i,r){ku.subVectors(t,e),ul.subVectors(n,e),Du.crossVectors(ku,ul);let o=this.direction.dot(Du),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;vs.subVectors(this.origin,e);let l=a*this.direction.dot(ul.crossVectors(vs,ul));if(l<0)return null;let c=a*this.direction.dot(ku.cross(vs));if(c<0||l+c>o)return null;let h=-a*vs.dot(Du);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Kt=class extends Hi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ft,this.combine=uc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},mp=new xt,Js=new Ko,dl=new vi,gp=new C,fl=new C,pl=new C,ml=new C,Lu=new C,gl=new C,vp=new C,vl=new C,xe=class extends dn{constructor(e=new dt,t=new Kt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let a=this.morphTargetInfluences;if(r&&a){gl.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Lu.fromBufferAttribute(u,e),o?gl.addScaledVector(Lu,h):gl.addScaledVector(Lu.sub(t),h))}t.add(gl)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),dl.copy(n.boundingSphere),dl.applyMatrix4(r),Js.copy(e.ray).recast(e.near),!(dl.containsPoint(Js.origin)===!1&&(Js.intersectSphere(dl,gp)===null||Js.origin.distanceToSquared(gp)>(e.far-e.near)**2))&&(mp.copy(r).invert(),Js.copy(e.ray).applyMatrix4(mp),!(n.boundingBox!==null&&Js.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Js)))}_computeIntersections(e,t,n){let i,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){let p=d[g],m=o[p.materialIndex],y=Math.max(p.start,f.start),_=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let x=y,S=_;x<S;x+=3){let M=a.getX(x),w=a.getX(x+1),b=a.getX(x+2);i=xl(this,m,e,n,c,h,u,M,w,b),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let y=a.getX(p),_=a.getX(p+1),x=a.getX(p+2);i=xl(this,o,e,n,c,h,u,y,_,x),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,v=d.length;g<v;g++){let p=d[g],m=o[p.materialIndex],y=Math.max(p.start,f.start),_=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let x=y,S=_;x<S;x+=3){let M=x,w=x+1,b=x+2;i=xl(this,m,e,n,c,h,u,M,w,b),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let g=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let p=g,m=v;p<m;p+=3){let y=p,_=p+1,x=p+2;i=xl(this,o,e,n,c,h,u,y,_,x),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}}};function xx(s,e,t,n,i,r,o,a){let l;if(e.side===fn?l=n.intersectTriangle(o,r,i,!0,a):l=n.intersectTriangle(i,r,o,e.side===gi,a),l===null)return null;vl.copy(a),vl.applyMatrix4(s.matrixWorld);let c=t.ray.origin.distanceTo(vl);return c<t.near||c>t.far?null:{distance:c,point:vl.clone(),object:s}}function xl(s,e,t,n,i,r,o,a,l,c){s.getVertexPosition(a,fl),s.getVertexPosition(l,pl),s.getVertexPosition(c,ml);let h=xx(s,e,t,n,fl,pl,ml,vp);if(h){let u=new C;bs.getBarycoord(vp,fl,pl,ml,u),i&&(h.uv=bs.getInterpolatedAttribute(i,a,l,c,u,new de)),r&&(h.uv1=bs.getInterpolatedAttribute(r,a,l,c,u,new de)),o&&(h.normal=bs.getInterpolatedAttribute(o,a,l,c,u,new C),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new C,materialIndex:0};bs.getNormal(fl,pl,ml,d.normal),h.face=d,h.barycoord=u}return h}var Zo=class extends Ln{constructor(e=null,t=1,n=1,i,r,o,a,l,c=cn,h=cn,u,d){super(null,o,a,l,c,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var _s=class extends ot{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Hr=new xt,xp=new xt,bl=[],bp=new Fi,bx=new xt,Do=new xe,Lo=new vi,jt=class extends xe{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new _s(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,bx)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Fi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Hr),bp.copy(e.boundingBox).applyMatrix4(Hr),this.boundingBox.union(bp)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new vi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Hr),Lo.copy(e.boundingSphere).applyMatrix4(Hr),this.boundingSphere.union(Lo)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Do.geometry=this.geometry,Do.material=this.material,Do.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Lo.copy(this.boundingSphere),Lo.applyMatrix4(n),e.ray.intersectsSphere(Lo)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Hr),xp.multiplyMatrices(n,Hr),Do.matrixWorld=xp,Do.raycast(e,bl);for(let o=0,a=bl.length;o<a;o++){let l=bl[o];l.instanceId=r,l.object=this,t.push(l)}bl.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new _s(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Zo(new Float32Array(i*this.count),i,this.count,xc,ri));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<n.length;c++)o+=n[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=i*e;return r[l]=a,r.set(n,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Fu=new C,yx=new C,_x=new ut,Pi=class{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Fu.subVectors(n,t).cross(yx.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let i=e.delta(Fu),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(i,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||_x.getNormalMatrix(e),i=this.coplanarPoint(Fu).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},js=new vi,Ex=new de(.5,.5),yl=new C,qr=class{constructor(e=new Pi,t=new Pi,n=new Pi,i=new Pi,r=new Pi,o=new Pi){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=mi,n=!1){let i=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],h=r[4],u=r[5],d=r[6],f=r[7],g=r[8],v=r[9],p=r[10],m=r[11],y=r[12],_=r[13],x=r[14],S=r[15];if(i[0].setComponents(c-o,f-h,m-g,S-y).normalize(),i[1].setComponents(c+o,f+h,m+g,S+y).normalize(),i[2].setComponents(c+a,f+u,m+v,S+_).normalize(),i[3].setComponents(c-a,f-u,m-v,S-_).normalize(),n)i[4].setComponents(l,d,p,x).normalize(),i[5].setComponents(c-l,f-d,m-p,S-x).normalize();else if(i[4].setComponents(c-l,f-d,m-p,S-x).normalize(),t===mi)i[5].setComponents(c+l,f+d,m+p,S+x).normalize();else if(t===zr)i[5].setComponents(l,d,p,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),js.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),js.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(js)}intersectsSprite(e){js.center.set(0,0,0);let t=Ex.distanceTo(e.center);return js.radius=.7071067811865476+t,js.applyMatrix4(e.matrixWorld),this.intersectsSphere(js)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(yl.x=i.normal.x>0?e.max.x:e.min.x,yl.y=i.normal.y>0?e.max.y:e.min.y,yl.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(yl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Xr=class extends Hi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ae(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},yp=new xt,Xu=new Ko,_l=new vi,El=new C,Es=class extends dn{constructor(e=new dt,t=new Xr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),_l.copy(n.boundingSphere),_l.applyMatrix4(i),_l.radius+=r,e.ray.intersectsSphere(_l)===!1)return;yp.copy(i).invert(),Xu.copy(e.ray).applyMatrix4(yp);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,v=f;g<v;g++){let p=c.getX(g);El.fromBufferAttribute(u,p),_p(El,p,l,i,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let g=d,v=f;g<v;g++)El.fromBufferAttribute(u,g),_p(El,g,l,i,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function _p(s,e,t,n,i,r,o){let a=Xu.distanceSqToPoint(s);if(a<t){let l=new C;Xu.closestPointToPoint(s,l),l.applyMatrix4(n);let c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var $o=class extends Ln{constructor(e=[],t=As,n,i,r,o,a,l,c,h){super(e,t,n,i,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},_n=class extends Ln{constructor(e,t,n,i,r,o,a,l,c){super(e,t,n,i,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var ts=class extends Ln{constructor(e,t,n=yi,i,r,o,a=cn,l=cn,c,h=Di,u=1){if(h!==Di&&h!==Cs)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,i,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Vr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Vl=class extends ts{constructor(e,t=yi,n=As,i,r,o=cn,a=cn,l,c=Di){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,n,i,r,o,a,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Jo=class extends Ln{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},be=class s extends dt{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};let a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],d=0,f=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,i,o,2),g("x","z","y",1,-1,e,n,-t,i,o,3),g("x","y","z",1,-1,e,t,n,i,r,4),g("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new st(c,3)),this.setAttribute("normal",new st(h,3)),this.setAttribute("uv",new st(u,2));function g(v,p,m,y,_,x,S,M,w,b,R){let P=x/w,k=S/b,L=x/2,H=S/2,B=M/2,F=w+1,O=b+1,z=0,J=0,ne=new C;for(let ue=0;ue<O;ue++){let fe=ue*k-H;for(let me=0;me<F;me++){let Ke=me*P-L;ne[v]=Ke*y,ne[p]=fe*_,ne[m]=B,c.push(ne.x,ne.y,ne.z),ne[v]=0,ne[p]=0,ne[m]=M>0?1:-1,h.push(ne.x,ne.y,ne.z),u.push(me/w),u.push(1-ue/b),z+=1}}for(let ue=0;ue<b;ue++)for(let fe=0;fe<w;fe++){let me=d+fe+F*ue,Ke=d+fe+F*(ue+1),Le=d+(fe+1)+F*(ue+1),ye=d+(fe+1)+F*ue;l.push(me,Ke,ye),l.push(Ke,Le,ye),J+=6}a.addGroup(f,J,R),f+=J,d+=z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}},Yr=class s extends dt{constructor(e=1,t=1,n=4,i=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:i,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),i=Math.max(3,Math.floor(i)),r=Math.max(1,Math.floor(r));let o=[],a=[],l=[],c=[],h=t/2,u=Math.PI/2*e,d=t,f=2*u+d,g=n*2+r,v=i+1,p=new C,m=new C;for(let y=0;y<=g;y++){let _=0,x=0,S=0,M=0;if(y<=n){let R=y/n,P=R*Math.PI/2;x=-h-e*Math.cos(P),S=e*Math.sin(P),M=-e*Math.cos(P),_=R*u}else if(y<=n+r){let R=(y-n)/r;x=-h+R*t,S=e,M=0,_=u+R*d}else{let R=(y-n-r)/n,P=R*Math.PI/2;x=h+e*Math.sin(P),S=e*Math.cos(P),M=e*Math.sin(P),_=u+d+R*u}let w=Math.max(0,Math.min(1,_/f)),b=0;y===0?b=.5/i:y===g&&(b=-.5/i);for(let R=0;R<=i;R++){let P=R/i,k=P*Math.PI*2,L=Math.sin(k),H=Math.cos(k);m.x=-S*H,m.y=x,m.z=S*L,a.push(m.x,m.y,m.z),p.set(-S*H,M,S*L),p.normalize(),l.push(p.x,p.y,p.z),c.push(P+b,w)}if(y>0){let R=(y-1)*v;for(let P=0;P<i;P++){let k=R+P,L=R+P+1,H=y*v+P,B=y*v+P+1;o.push(k,L,H),o.push(L,B,H)}}}this.setIndex(o),this.setAttribute("position",new st(a,3)),this.setAttribute("normal",new st(l,3)),this.setAttribute("uv",new st(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}},Bi=class s extends dt{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new C,h=new de;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*i;c.x=e*Math.cos(f),c.y=e*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[d]/e+1)/2,h.y=(o[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new st(o,3)),this.setAttribute("normal",new st(a,3)),this.setAttribute("uv",new st(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.segments,e.thetaStart,e.thetaLength)}},We=class s extends dt{constructor(e=1,t=1,n=1,i=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;i=Math.floor(i),r=Math.floor(r);let h=[],u=[],d=[],f=[],g=0,v=[],p=n/2,m=0;y(),o===!1&&(e>0&&_(!0),t>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new st(u,3)),this.setAttribute("normal",new st(d,3)),this.setAttribute("uv",new st(f,2));function y(){let x=new C,S=new C,M=0,w=(t-e)/n;for(let b=0;b<=r;b++){let R=[],P=b/r,k=P*(t-e)+e;for(let L=0;L<=i;L++){let H=L/i,B=H*l+a,F=Math.sin(B),O=Math.cos(B);S.x=k*F,S.y=-P*n+p,S.z=k*O,u.push(S.x,S.y,S.z),x.set(F,w,O).normalize(),d.push(x.x,x.y,x.z),f.push(H,1-P),R.push(g++)}v.push(R)}for(let b=0;b<i;b++)for(let R=0;R<r;R++){let P=v[R][b],k=v[R+1][b],L=v[R+1][b+1],H=v[R][b+1];(e>0||R!==0)&&(h.push(P,k,H),M+=3),(t>0||R!==r-1)&&(h.push(k,L,H),M+=3)}c.addGroup(m,M,0),m+=M}function _(x){let S=g,M=new de,w=new C,b=0,R=x===!0?e:t,P=x===!0?1:-1;for(let L=1;L<=i;L++)u.push(0,p*P,0),d.push(0,P,0),f.push(.5,.5),g++;let k=g;for(let L=0;L<=i;L++){let B=L/i*l+a,F=Math.cos(B),O=Math.sin(B);w.x=R*O,w.y=p*P,w.z=R*F,u.push(w.x,w.y,w.z),d.push(0,P,0),M.x=F*.5+.5,M.y=O*.5*P+.5,f.push(M.x,M.y),g++}for(let L=0;L<i;L++){let H=S+L,B=k+L;x===!0?h.push(B,B+1,H):h.push(B+1,B,H),b+=3}c.addGroup(m,b,x===!0?1:2),m+=b}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Vt=class s extends We{constructor(e=1,t=1,n=32,i=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,i,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new s(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},jo=class s extends dt{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let r=[],o=[];a(i),c(n),h(),this.setAttribute("position",new st(r,3)),this.setAttribute("normal",new st(r.slice(),3)),this.setAttribute("uv",new st(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function a(y){let _=new C,x=new C,S=new C;for(let M=0;M<t.length;M+=3)f(t[M+0],_),f(t[M+1],x),f(t[M+2],S),l(_,x,S,y)}function l(y,_,x,S){let M=S+1,w=[];for(let b=0;b<=M;b++){w[b]=[];let R=y.clone().lerp(x,b/M),P=_.clone().lerp(x,b/M),k=M-b;for(let L=0;L<=k;L++)L===0&&b===M?w[b][L]=R:w[b][L]=R.clone().lerp(P,L/k)}for(let b=0;b<M;b++)for(let R=0;R<2*(M-b)-1;R++){let P=Math.floor(R/2);R%2===0?(d(w[b][P+1]),d(w[b+1][P]),d(w[b][P])):(d(w[b][P+1]),d(w[b+1][P+1]),d(w[b+1][P]))}}function c(y){let _=new C;for(let x=0;x<r.length;x+=3)_.x=r[x+0],_.y=r[x+1],_.z=r[x+2],_.normalize().multiplyScalar(y),r[x+0]=_.x,r[x+1]=_.y,r[x+2]=_.z}function h(){let y=new C;for(let _=0;_<r.length;_+=3){y.x=r[_+0],y.y=r[_+1],y.z=r[_+2];let x=p(y)/2/Math.PI+.5,S=m(y)/Math.PI+.5;o.push(x,1-S)}g(),u()}function u(){for(let y=0;y<o.length;y+=6){let _=o[y+0],x=o[y+2],S=o[y+4],M=Math.max(_,x,S),w=Math.min(_,x,S);M>.9&&w<.1&&(_<.2&&(o[y+0]+=1),x<.2&&(o[y+2]+=1),S<.2&&(o[y+4]+=1))}}function d(y){r.push(y.x,y.y,y.z)}function f(y,_){let x=y*3;_.x=e[x+0],_.y=e[x+1],_.z=e[x+2]}function g(){let y=new C,_=new C,x=new C,S=new C,M=new de,w=new de,b=new de;for(let R=0,P=0;R<r.length;R+=9,P+=6){y.set(r[R+0],r[R+1],r[R+2]),_.set(r[R+3],r[R+4],r[R+5]),x.set(r[R+6],r[R+7],r[R+8]),M.set(o[P+0],o[P+1]),w.set(o[P+2],o[P+3]),b.set(o[P+4],o[P+5]),S.copy(y).add(_).add(x).divideScalar(3);let k=p(S);v(M,P+0,y,k),v(w,P+2,_,k),v(b,P+4,x,k)}}function v(y,_,x,S){S<0&&y.x===1&&(o[_]=y.x-1),x.x===0&&x.z===0&&(o[_]=S/2/Math.PI+.5)}function p(y){return Math.atan2(y.z,-y.x)}function m(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.vertices,e.indices,e.radius,e.detail)}},Qo=class s extends jo{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}};var Zn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){it("Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),i=0,r=n.length,o;t?o=t:o=e*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(i=Math.floor(a+(l-a)/2),c=n[i]-o,c<0)a=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===o)return i/(r-1);let h=n[i],d=n[i+1]-h,f=(o-h)/d;return(i+f)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let o=this.getPoint(i),a=this.getPoint(r),l=t||(o.isVector2?new de:new C);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new C,i=[],r=[],o=[],a=new C,l=new xt;for(let f=0;f<=e;f++){let g=f/e;i[f]=this.getTangentAt(g,new C)}r[0]=new C,o[0]=new C;let c=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],a),o[0].crossVectors(i[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(i[f-1],i[f]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(Tt(i[f-1].dot(i[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(i[f],r[f])}if(t===!0){let f=Math.acos(Tt(r[0].dot(r[e]),-1,1));f/=e,i[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(i[g],f*g)),o[g].crossVectors(i[g],r[g])}return{tangents:i,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Kr=class extends Zn{constructor(e=0,t=0,n=1,i=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new de){let n=t,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(o?r=0:r=i),this.aClockwise===!0&&!o&&(r===i?r=-i:r=r-i);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Wl=class extends Kr{constructor(e,t,n,i,r,o){super(e,t,n,n,i,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function md(){let s=0,e=0,t=0,n=0;function i(r,o,a,l){s=r,e=a,t=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){i(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let d=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+u)+(l-a)/u;d*=h,f*=h,i(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return s+e*r+t*o+n*a}}}var Ep=new C,Tp=new C,Hu=new md,Bu=new md,Nu=new md,Zr=class extends Zn{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new C){let n=t,i=this.points,r=i.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=i[(a-1)%r]:(Tp.subVectors(i[0],i[1]).add(i[0]),c=Tp);let u=i[a%r],d=i[(a+1)%r];if(this.closed||a+2<r?h=i[(a+2)%r]:(Ep.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=Ep),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(u),f),v=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(h),f);v<1e-4&&(v=1),g<1e-4&&(g=v),p<1e-4&&(p=v),Hu.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,g,v,p),Bu.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,g,v,p),Nu.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,g,v,p)}else this.curveType==="catmullrom"&&(Hu.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Bu.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Nu.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(Hu.calc(l),Bu.calc(l),Nu.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new C().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Mp(s,e,t,n,i){let r=(n-e)*.5,o=(i-t)*.5,a=s*s,l=s*a;return(2*t-2*n+r+o)*l+(-3*t+3*n-2*r-o)*a+r*s+t}function Tx(s,e){let t=1-s;return t*t*e}function Mx(s,e){return 2*(1-s)*s*e}function Sx(s,e){return s*s*e}function No(s,e,t,n){return Tx(s,e)+Mx(s,t)+Sx(s,n)}function wx(s,e){let t=1-s;return t*t*t*e}function Rx(s,e){let t=1-s;return 3*t*t*s*e}function Ax(s,e){return 3*(1-s)*s*s*e}function Cx(s,e){return s*s*s*e}function Uo(s,e,t,n,i){return wx(s,e)+Rx(s,t)+Ax(s,n)+Cx(s,i)}var ea=class extends Zn{constructor(e=new de,t=new de,n=new de,i=new de){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new de){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Uo(e,i.x,r.x,o.x,a.x),Uo(e,i.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ql=class extends Zn{constructor(e=new C,t=new C,n=new C,i=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new C){let n=t,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Uo(e,i.x,r.x,o.x,a.x),Uo(e,i.y,r.y,o.y,a.y),Uo(e,i.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ta=class extends Zn{constructor(e=new de,t=new de){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new de){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new de){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Xl=class extends Zn{constructor(e=new C,t=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new C){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new C){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},na=class extends Zn{constructor(e=new de,t=new de,n=new de){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new de){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(No(e,i.x,r.x,o.x),No(e,i.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},rr=class extends Zn{constructor(e=new C,t=new C,n=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new C){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(No(e,i.x,r.x,o.x),No(e,i.y,r.y,o.y),No(e,i.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ia=class extends Zn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new de){let n=t,i=this.points,r=(i.length-1)*e,o=Math.floor(r),a=r-o,l=i[o===0?o:o-1],c=i[o],h=i[o>i.length-2?i.length-1:o+1],u=i[o>i.length-3?i.length-1:o+2];return n.set(Mp(a,l.x,c.x,h.x,u.x),Mp(a,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new de().fromArray(i))}return this}},Yl=Object.freeze({__proto__:null,ArcCurve:Wl,CatmullRomCurve3:Zr,CubicBezierCurve:ea,CubicBezierCurve3:ql,EllipseCurve:Kr,LineCurve:ta,LineCurve3:Xl,QuadraticBezierCurve:na,QuadraticBezierCurve3:rr,SplineCurve:ia}),Kl=class extends Zn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Yl[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let o=i[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,r=this.curves;i<r.length;i++){let o=r[i],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new Yl[i.type]().fromJSON(i))}return this}},sa=class extends Kl{constructor(e){super(),this.type="Path",this.currentPoint=new de,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new ta(this.currentPoint.clone(),new de(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let r=new na(this.currentPoint.clone(),new de(e,t),new de(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,o){let a=new ea(this.currentPoint.clone(),new de(e,t),new de(n,i),new de(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new ia(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,n,i,r,o),this}absarc(e,t,n,i,r,o){return this.absellipse(e,t,n,n,i,r,o),this}ellipse(e,t,n,i,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,i,r,o,a,l),this}absellipse(e,t,n,i,r,o,a,l){let c=new Kr(e,t,n,i,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},xi=class extends sa{constructor(e){super(e),this.uuid=fr(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new sa().fromJSON(i))}return this}};function Ix(s,e,t=2){let n=e&&e.length,i=n?e[0]*t:s.length,r=mm(s,0,i,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c;if(n&&(r=Fx(s,e,r,t)),s.length>80*t){a=s[0],l=s[1];let h=a,u=l;for(let d=t;d<i;d+=t){let f=s[d],g=s[d+1];f<a&&(a=f),g<l&&(l=g),f>h&&(h=f),g>u&&(u=g)}c=Math.max(h-a,u-l),c=c!==0?32767/c:0}return ra(r,o,t,a,l,c,0),o}function mm(s,e,t,n,i){let r;if(i===Xx(s,e,t,n)>0)for(let o=e;o<t;o+=n)r=Sp(o/n|0,s[o],s[o+1],r);else for(let o=t-n;o>=e;o-=n)r=Sp(o/n|0,s[o],s[o+1],r);return r&&$r(r,r.next)&&(aa(r),r=r.next),r}function or(s,e){if(!s)return s;e||(e=s);let t=s,n;do if(n=!1,!t.steiner&&($r(t,t.next)||Yt(t.prev,t,t.next)===0)){if(aa(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function ra(s,e,t,n,i,r,o){if(!s)return;!o&&r&&Ox(s,n,i,r);let a=s;for(;s.prev!==s.next;){let l=s.prev,c=s.next;if(r?kx(s,n,i,r):Px(s)){e.push(l.i,s.i,c.i),aa(s),s=c.next,a=c.next;continue}if(s=c,s===a){o?o===1?(s=Dx(or(s),e),ra(s,e,t,n,i,r,2)):o===2&&Lx(s,e,t,n,i,r):ra(or(s),e,t,n,i,r,1);break}}}function Px(s){let e=s.prev,t=s,n=s.next;if(Yt(e,t,n)>=0)return!1;let i=e.x,r=t.x,o=n.x,a=e.y,l=t.y,c=n.y,h=Math.min(i,r,o),u=Math.min(a,l,c),d=Math.max(i,r,o),f=Math.max(a,l,c),g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=d&&g.y>=u&&g.y<=f&&Fo(i,a,r,l,o,c,g.x,g.y)&&Yt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function kx(s,e,t,n){let i=s.prev,r=s,o=s.next;if(Yt(i,r,o)>=0)return!1;let a=i.x,l=r.x,c=o.x,h=i.y,u=r.y,d=o.y,f=Math.min(a,l,c),g=Math.min(h,u,d),v=Math.max(a,l,c),p=Math.max(h,u,d),m=Yu(f,g,e,t,n),y=Yu(v,p,e,t,n),_=s.prevZ,x=s.nextZ;for(;_&&_.z>=m&&x&&x.z<=y;){if(_.x>=f&&_.x<=v&&_.y>=g&&_.y<=p&&_!==i&&_!==o&&Fo(a,h,l,u,c,d,_.x,_.y)&&Yt(_.prev,_,_.next)>=0||(_=_.prevZ,x.x>=f&&x.x<=v&&x.y>=g&&x.y<=p&&x!==i&&x!==o&&Fo(a,h,l,u,c,d,x.x,x.y)&&Yt(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;_&&_.z>=m;){if(_.x>=f&&_.x<=v&&_.y>=g&&_.y<=p&&_!==i&&_!==o&&Fo(a,h,l,u,c,d,_.x,_.y)&&Yt(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;x&&x.z<=y;){if(x.x>=f&&x.x<=v&&x.y>=g&&x.y<=p&&x!==i&&x!==o&&Fo(a,h,l,u,c,d,x.x,x.y)&&Yt(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function Dx(s,e){let t=s;do{let n=t.prev,i=t.next.next;!$r(n,i)&&vm(n,t,t.next,i)&&oa(n,i)&&oa(i,n)&&(e.push(n.i,t.i,i.i),aa(t),aa(t.next),t=s=i),t=t.next}while(t!==s);return or(t)}function Lx(s,e,t,n,i,r){let o=s;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Vx(o,a)){let l=xm(o,a);o=or(o,o.next),l=or(l,l.next),ra(o,e,t,n,i,r,0),ra(l,e,t,n,i,r,0);return}a=a.next}o=o.next}while(o!==s)}function Fx(s,e,t,n){let i=[];for(let r=0,o=e.length;r<o;r++){let a=e[r]*n,l=r<o-1?e[r+1]*n:s.length,c=mm(s,a,l,n,!1);c===c.next&&(c.steiner=!0),i.push(Gx(c))}i.sort(Hx);for(let r=0;r<i.length;r++)t=Bx(i[r],t);return t}function Hx(s,e){let t=s.x-e.x;if(t===0&&(t=s.y-e.y,t===0)){let n=(s.next.y-s.y)/(s.next.x-s.x),i=(e.next.y-e.y)/(e.next.x-e.x);t=n-i}return t}function Bx(s,e){let t=Nx(s,e);if(!t)return e;let n=xm(t,s);return or(n,n.next),or(t,t.next)}function Nx(s,e){let t=e,n=s.x,i=s.y,r=-1/0,o;if($r(s,t))return t;do{if($r(s,t.next))return t.next;if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){let u=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=n&&u>r&&(r=u,o=t.x<t.next.x?t:t.next,u===n))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,l=o.x,c=o.y,h=1/0;t=o;do{if(n>=t.x&&t.x>=l&&n!==t.x&&gm(i<c?n:r,i,l,c,i<c?r:n,i,t.x,t.y)){let u=Math.abs(i-t.y)/(n-t.x);oa(t,s)&&(u<h||u===h&&(t.x>o.x||t.x===o.x&&Ux(o,t)))&&(o=t,h=u)}t=t.next}while(t!==a);return o}function Ux(s,e){return Yt(s.prev,s,e.prev)<0&&Yt(e.next,s,s.next)<0}function Ox(s,e,t,n){let i=s;do i.z===0&&(i.z=Yu(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,zx(i)}function zx(s){let e,t=1;do{let n=s,i;s=null;let r=null;for(e=0;n;){e++;let o=n,a=0;for(let c=0;c<t&&(a++,o=o.nextZ,!!o);c++);let l=t;for(;a>0||l>0&&o;)a!==0&&(l===0||!o||n.z<=o.z)?(i=n,n=n.nextZ,a--):(i=o,o=o.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=o}r.nextZ=null,t*=2}while(e>1);return s}function Yu(s,e,t,n,i){return s=(s-t)*i|0,e=(e-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,s|e<<1}function Gx(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function gm(s,e,t,n,i,r,o,a){return(i-o)*(e-a)>=(s-o)*(r-a)&&(s-o)*(n-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(i-o)*(n-a)}function Fo(s,e,t,n,i,r,o,a){return!(s===o&&e===a)&&gm(s,e,t,n,i,r,o,a)}function Vx(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!Wx(s,e)&&(oa(s,e)&&oa(e,s)&&qx(s,e)&&(Yt(s.prev,s,e.prev)||Yt(s,e.prev,e))||$r(s,e)&&Yt(s.prev,s,s.next)>0&&Yt(e.prev,e,e.next)>0)}function Yt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function $r(s,e){return s.x===e.x&&s.y===e.y}function vm(s,e,t,n){let i=Ml(Yt(s,e,t)),r=Ml(Yt(s,e,n)),o=Ml(Yt(t,n,s)),a=Ml(Yt(t,n,e));return!!(i!==r&&o!==a||i===0&&Tl(s,t,e)||r===0&&Tl(s,n,e)||o===0&&Tl(t,s,n)||a===0&&Tl(t,e,n))}function Tl(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function Ml(s){return s>0?1:s<0?-1:0}function Wx(s,e){let t=s;do{if(t.i!==s.i&&t.next.i!==s.i&&t.i!==e.i&&t.next.i!==e.i&&vm(t,t.next,s,e))return!0;t=t.next}while(t!==s);return!1}function oa(s,e){return Yt(s.prev,s,s.next)<0?Yt(s,e,s.next)>=0&&Yt(s,s.prev,e)>=0:Yt(s,e,s.prev)<0||Yt(s,s.next,e)<0}function qx(s,e){let t=s,n=!1,i=(s.x+e.x)/2,r=(s.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==s);return n}function xm(s,e){let t=Ku(s.i,s.x,s.y),n=Ku(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function Sp(s,e,t,n){let i=Ku(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function aa(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Ku(s,e,t){return{i:s,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Xx(s,e,t,n){let i=0;for(let r=e,o=t-n;r<t;r+=n)i+=(s[o]-s[r])*(s[r+1]+s[o+1]),o=r;return i}var Zu=class{static triangulate(e,t,n=2){return Ix(e,t,n)}},ki=class s{static area(e){let t=e.length,n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return n*.5}static isClockWise(e){return s.area(e)<0}static triangulateShape(e,t){let n=[],i=[],r=[];wp(e),Rp(n,e);let o=e.length;t.forEach(wp);for(let l=0;l<t.length;l++)i.push(o),o+=t[l].length,Rp(n,t[l]);let a=Zu.triangulate(n,i);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function wp(s){let e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function Rp(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}var ar=class s extends dt{constructor(e=new xi([new de(.5,.5),new de(-.5,.5),new de(-.5,-.5),new de(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,i=[],r=[];for(let a=0,l=e.length;a<l;a++){let c=e[a];o(c)}this.setAttribute("position",new st(i,3)),this.setAttribute("uv",new st(r,2)),this.computeVertexNormals();function o(a){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:f-.1,v=t.bevelOffset!==void 0?t.bevelOffset:0,p=t.bevelSegments!==void 0?t.bevelSegments:3,m=t.extrudePath,y=t.UVGenerator!==void 0?t.UVGenerator:Yx,_,x=!1,S,M,w,b;if(m){_=m.getSpacedPoints(h),x=!0,d=!1;let re=m.isCatmullRomCurve3?m.closed:!1;S=m.computeFrenetFrames(h,re),M=new C,w=new C,b=new C}d||(p=0,f=0,g=0,v=0);let R=a.extractPoints(c),P=R.shape,k=R.holes;if(!ki.isClockWise(P)){P=P.reverse();for(let re=0,he=k.length;re<he;re++){let le=k[re];ki.isClockWise(le)&&(k[re]=le.reverse())}}function H(re){let le=10000000000000001e-36,Se=re[0];for(let we=1;we<=re.length;we++){let Je=we%re.length,Ve=re[Je],nt=Ve.x-Se.x,ct=Ve.y-Se.y,N=nt*nt+ct*ct,Rt=Math.max(Math.abs(Ve.x),Math.abs(Ve.y),Math.abs(Se.x),Math.abs(Se.y)),mt=le*Rt*Rt;if(N<=mt){re.splice(Je,1),we--;continue}Se=Ve}}H(P),k.forEach(H);let B=k.length,F=P;for(let re=0;re<B;re++){let he=k[re];P=P.concat(he)}function O(re,he,le){return he||lt("ExtrudeGeometry: vec does not exist"),re.clone().addScaledVector(he,le)}let z=P.length;function J(re,he,le){let Se,we,Je,Ve=re.x-he.x,nt=re.y-he.y,ct=le.x-re.x,N=le.y-re.y,Rt=Ve*Ve+nt*nt,mt=Ve*N-nt*ct;if(Math.abs(mt)>Number.EPSILON){let D=Math.sqrt(Rt),A=Math.sqrt(ct*ct+N*N),V=he.x-nt/D,X=he.y+Ve/D,j=le.x-N/A,ge=le.y+ct/A,ve=((j-V)*N-(ge-X)*ct)/(Ve*N-nt*ct);Se=V+Ve*ve-re.x,we=X+nt*ve-re.y;let ee=Se*Se+we*we;if(ee<=2)return new de(Se,we);Je=Math.sqrt(ee/2)}else{let D=!1;Ve>Number.EPSILON?ct>Number.EPSILON&&(D=!0):Ve<-Number.EPSILON?ct<-Number.EPSILON&&(D=!0):Math.sign(nt)===Math.sign(N)&&(D=!0),D?(Se=-nt,we=Ve,Je=Math.sqrt(Rt)):(Se=Ve,we=nt,Je=Math.sqrt(Rt/2))}return new de(Se/Je,we/Je)}let ne=[];for(let re=0,he=F.length,le=he-1,Se=re+1;re<he;re++,le++,Se++)le===he&&(le=0),Se===he&&(Se=0),ne[re]=J(F[re],F[le],F[Se]);let ue=[],fe,me=ne.concat();for(let re=0,he=B;re<he;re++){let le=k[re];fe=[];for(let Se=0,we=le.length,Je=we-1,Ve=Se+1;Se<we;Se++,Je++,Ve++)Je===we&&(Je=0),Ve===we&&(Ve=0),fe[Se]=J(le[Se],le[Je],le[Ve]);ue.push(fe),me=me.concat(fe)}let Ke;if(p===0)Ke=ki.triangulateShape(F,k);else{let re=[],he=[];for(let le=0;le<p;le++){let Se=le/p,we=f*Math.cos(Se*Math.PI/2),Je=g*Math.sin(Se*Math.PI/2)+v;for(let Ve=0,nt=F.length;Ve<nt;Ve++){let ct=O(F[Ve],ne[Ve],Je);_e(ct.x,ct.y,-we),Se===0&&re.push(ct)}for(let Ve=0,nt=B;Ve<nt;Ve++){let ct=k[Ve];fe=ue[Ve];let N=[];for(let Rt=0,mt=ct.length;Rt<mt;Rt++){let D=O(ct[Rt],fe[Rt],Je);_e(D.x,D.y,-we),Se===0&&N.push(D)}Se===0&&he.push(N)}}Ke=ki.triangulateShape(re,he)}let Le=Ke.length,ye=g+v;for(let re=0;re<z;re++){let he=d?O(P[re],me[re],ye):P[re];x?(w.copy(S.normals[0]).multiplyScalar(he.x),M.copy(S.binormals[0]).multiplyScalar(he.y),b.copy(_[0]).add(w).add(M),_e(b.x,b.y,b.z)):_e(he.x,he.y,0)}for(let re=1;re<=h;re++)for(let he=0;he<z;he++){let le=d?O(P[he],me[he],ye):P[he];x?(w.copy(S.normals[re]).multiplyScalar(le.x),M.copy(S.binormals[re]).multiplyScalar(le.y),b.copy(_[re]).add(w).add(M),_e(b.x,b.y,b.z)):_e(le.x,le.y,u/h*re)}for(let re=p-1;re>=0;re--){let he=re/p,le=f*Math.cos(he*Math.PI/2),Se=g*Math.sin(he*Math.PI/2)+v;for(let we=0,Je=F.length;we<Je;we++){let Ve=O(F[we],ne[we],Se);_e(Ve.x,Ve.y,u+le)}for(let we=0,Je=k.length;we<Je;we++){let Ve=k[we];fe=ue[we];for(let nt=0,ct=Ve.length;nt<ct;nt++){let N=O(Ve[nt],fe[nt],Se);x?_e(N.x,N.y+_[h-1].y,_[h-1].x+le):_e(N.x,N.y,u+le)}}}W(),se();function W(){let re=i.length/3;if(d){let he=0,le=z*he;for(let Se=0;Se<Le;Se++){let we=Ke[Se];Me(we[2]+le,we[1]+le,we[0]+le)}he=h+p*2,le=z*he;for(let Se=0;Se<Le;Se++){let we=Ke[Se];Me(we[0]+le,we[1]+le,we[2]+le)}}else{for(let he=0;he<Le;he++){let le=Ke[he];Me(le[2],le[1],le[0])}for(let he=0;he<Le;he++){let le=Ke[he];Me(le[0]+z*h,le[1]+z*h,le[2]+z*h)}}n.addGroup(re,i.length/3-re,0)}function se(){let re=i.length/3,he=0;ie(F,he),he+=F.length;for(let le=0,Se=k.length;le<Se;le++){let we=k[le];ie(we,he),he+=we.length}n.addGroup(re,i.length/3-re,1)}function ie(re,he){let le=re.length;for(;--le>=0;){let Se=le,we=le-1;we<0&&(we=re.length-1);for(let Je=0,Ve=h+p*2;Je<Ve;Je++){let nt=z*Je,ct=z*(Je+1),N=he+Se+nt,Rt=he+we+nt,mt=he+we+ct,D=he+Se+ct;Ee(N,Rt,mt,D)}}}function _e(re,he,le){l.push(re),l.push(he),l.push(le)}function Me(re,he,le){Ge(re),Ge(he),Ge(le);let Se=i.length/3,we=y.generateTopUV(n,i,Se-3,Se-2,Se-1);Fe(we[0]),Fe(we[1]),Fe(we[2])}function Ee(re,he,le,Se){Ge(re),Ge(he),Ge(Se),Ge(he),Ge(le),Ge(Se);let we=i.length/3,Je=y.generateSideWallUV(n,i,we-6,we-3,we-2,we-1);Fe(Je[0]),Fe(Je[1]),Fe(Je[3]),Fe(Je[1]),Fe(Je[2]),Fe(Je[3])}function Ge(re){i.push(l[re*3+0]),i.push(l[re*3+1]),i.push(l[re*3+2])}function Fe(re){r.push(re.x),r.push(re.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Kx(t,n,e)}static fromJSON(e,t){let n=[];for(let r=0,o=e.shapes.length;r<o;r++){let a=t[e.shapes[r]];n.push(a)}let i=e.options.extrudePath;return i!==void 0&&(e.options.extrudePath=new Yl[i.type]().fromJSON(i)),new s(n,e.options)}},Yx={generateTopUV:function(s,e,t,n,i){let r=e[t*3],o=e[t*3+1],a=e[n*3],l=e[n*3+1],c=e[i*3],h=e[i*3+1];return[new de(r,o),new de(a,l),new de(c,h)]},generateSideWallUV:function(s,e,t,n,i,r){let o=e[t*3],a=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],u=e[n*3+2],d=e[i*3],f=e[i*3+1],g=e[i*3+2],v=e[r*3],p=e[r*3+1],m=e[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new de(o,1-l),new de(c,1-u),new de(d,1-g),new de(v,1-m)]:[new de(a,1-l),new de(h,1-u),new de(f,1-g),new de(p,1-m)]}};function Kx(s,e,t){if(t.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){let r=s[n];t.shapes.push(r.uuid)}else t.shapes.push(s.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var ns=class s extends jo{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}};var Ut=class s extends dt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(i),c=a+1,h=l+1,u=e/a,d=t/l,f=[],g=[],v=[],p=[];for(let m=0;m<h;m++){let y=m*d-o;for(let _=0;_<c;_++){let x=_*u-r;g.push(x,-y,0),v.push(0,0,1),p.push(_/a),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let y=0;y<a;y++){let _=y+c*m,x=y+c*(m+1),S=y+1+c*(m+1),M=y+1+c*m;f.push(_,x,M),f.push(x,S,M)}this.setIndex(f),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(v,3)),this.setAttribute("uv",new st(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}},la=class s extends dt{constructor(e=.5,t=1,n=32,i=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);let a=[],l=[],c=[],h=[],u=e,d=(t-e)/i,f=new C,g=new de;for(let v=0;v<=i;v++){for(let p=0;p<=n;p++){let m=r+p/n*o;f.x=u*Math.cos(m),f.y=u*Math.sin(m),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,h.push(g.x,g.y)}u+=d}for(let v=0;v<i;v++){let p=v*(n+1);for(let m=0;m<n;m++){let y=m+p,_=y,x=y+n+1,S=y+n+2,M=y+1;a.push(_,x,M),a.push(x,S,M)}}this.setIndex(a),this.setAttribute("position",new st(l,3)),this.setAttribute("normal",new st(c,3)),this.setAttribute("uv",new st(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},Jr=class s extends dt{constructor(e=new xi([new de(0,.5),new de(-.5,-.5),new de(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],r=[],o=[],a=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(a,l,h),a+=l,l=0;this.setIndex(n),this.setAttribute("position",new st(i,3)),this.setAttribute("normal",new st(r,3)),this.setAttribute("uv",new st(o,2));function c(h){let u=i.length/3,d=h.extractPoints(t),f=d.shape,g=d.holes;ki.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,m=g.length;p<m;p++){let y=g[p];ki.isClockWise(y)===!0&&(g[p]=y.reverse())}let v=ki.triangulateShape(f,g);for(let p=0,m=g.length;p<m;p++){let y=g[p];f=f.concat(y)}for(let p=0,m=f.length;p<m;p++){let y=f[p];i.push(y.x,y.y,0),r.push(0,0,1),o.push(y.x,y.y)}for(let p=0,m=v.length;p<m;p++){let y=v[p],_=y[0]+u,x=y[1]+u,S=y[2]+u;n.push(_,x,S),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Zx(t,e)}static fromJSON(e,t){let n=[];for(let i=0,r=e.shapes.length;i<r;i++){let o=t[e.shapes[i]];n.push(o)}return new s(n,e.curveSegments)}};function Zx(s,e){if(e.shapes=[],Array.isArray(s))for(let t=0,n=s.length;t<n;t++){let i=s[t];e.shapes.push(i.uuid)}else e.shapes.push(s.uuid);return e}var ft=class s extends dt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new C,d=new C,f=[],g=[],v=[],p=[];for(let m=0;m<=n;m++){let y=[],_=m/n,x=o+_*a,S=e*Math.cos(x),M=Math.sqrt(e*e-S*S),w=0;m===0&&o===0?w=.5/t:m===n&&l===Math.PI&&(w=-.5/t);for(let b=0;b<=t;b++){let R=b/t,P=i+R*r;u.x=-M*Math.cos(P),u.y=S,u.z=M*Math.sin(P),g.push(u.x,u.y,u.z),d.copy(u).normalize(),v.push(d.x,d.y,d.z),p.push(R+w,1-_),y.push(c++)}h.push(y)}for(let m=0;m<n;m++)for(let y=0;y<t;y++){let _=h[m][y+1],x=h[m][y],S=h[m+1][y],M=h[m+1][y+1];(m!==0||o>0)&&f.push(_,x,M),(m!==n-1||l<Math.PI)&&f.push(x,S,M)}this.setIndex(f),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(v,3)),this.setAttribute("uv",new st(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var hn=class s extends dt{constructor(e=1,t=.4,n=12,i=48,r=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r,thetaStart:o,thetaLength:a},n=Math.floor(n),i=Math.floor(i);let l=[],c=[],h=[],u=[],d=new C,f=new C,g=new C;for(let v=0;v<=n;v++){let p=o+v/n*a;for(let m=0;m<=i;m++){let y=m/i*r;f.x=(e+t*Math.cos(p))*Math.cos(y),f.y=(e+t*Math.cos(p))*Math.sin(y),f.z=t*Math.sin(p),c.push(f.x,f.y,f.z),d.x=e*Math.cos(y),d.y=e*Math.sin(y),g.subVectors(f,d).normalize(),h.push(g.x,g.y,g.z),u.push(m/i),u.push(v/n)}}for(let v=1;v<=n;v++)for(let p=1;p<=i;p++){let m=(i+1)*v+p-1,y=(i+1)*(v-1)+p-1,_=(i+1)*(v-1)+p,x=(i+1)*v+p;l.push(m,y,x),l.push(y,_,x)}this.setIndex(l),this.setAttribute("position",new st(c,3)),this.setAttribute("normal",new st(h,3)),this.setAttribute("uv",new st(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var ca=class s extends dt{constructor(e=new rr(new C(-1,-1,0),new C(-1,1,0),new C(1,1,0)),t=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new C,l=new C,c=new de,h=new C,u=[],d=[],f=[],g=[];v(),this.setIndex(g),this.setAttribute("position",new st(u,3)),this.setAttribute("normal",new st(d,3)),this.setAttribute("uv",new st(f,2));function v(){for(let _=0;_<t;_++)p(_);p(r===!1?t:0),y(),m()}function p(_){h=e.getPointAt(_/t,h);let x=o.normals[_],S=o.binormals[_];for(let M=0;M<=i;M++){let w=M/i*Math.PI*2,b=Math.sin(w),R=-Math.cos(w);l.x=R*x.x+b*S.x,l.y=R*x.y+b*S.y,l.z=R*x.z+b*S.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=h.x+n*l.x,a.y=h.y+n*l.y,a.z=h.z+n*l.z,u.push(a.x,a.y,a.z)}}function m(){for(let _=1;_<=t;_++)for(let x=1;x<=i;x++){let S=(i+1)*(_-1)+(x-1),M=(i+1)*_+(x-1),w=(i+1)*_+x,b=(i+1)*(_-1)+x;g.push(S,M,b),g.push(M,w,b)}}function y(){for(let _=0;_<=t;_++)for(let x=0;x<=i;x++)c.x=_/t,c.y=x/i,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new s(new Yl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function pr(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];if(Ap(i))i.isRenderTargetTexture?(it("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone();else if(Array.isArray(i))if(Ap(i[0])){let r=[];for(let o=0,a=i.length;o<a;o++)r[o]=i[o].clone();e[t][n]=r}else e[t][n]=i.slice();else e[t][n]=i}}return e}function Cn(s){let e={};for(let t=0;t<s.length;t++){let n=pr(s[t]);for(let i in n)e[i]=n[i]}return e}function Ap(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function $x(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function gd(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Mt.workingColorSpace}var is={clone:pr,merge:Cn},Jx=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,jx=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ct=class extends Hi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jx,this.fragmentShader=jx,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=pr(e.uniforms),this.uniformsGroups=$x(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new ae().setHex(i.value);break;case"v2":this.uniforms[n].value=new de().fromArray(i.value);break;case"v3":this.uniforms[n].value=new C().fromArray(i.value);break;case"v4":this.uniforms[n].value=new qt().fromArray(i.value);break;case"m3":this.uniforms[n].value=new ut().fromArray(i.value);break;case"m4":this.uniforms[n].value=new xt().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},jr=class extends Ct{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},He=class extends Hi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ae(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Pa,this.normalScale=new de(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ft,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},lr=class extends He{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new de(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Tt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ae(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ae(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ae(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var ha=class extends Hi{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Pa,this.normalScale=new de(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ft,this.combine=uc,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Zl=class extends Hi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=nm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},$l=class extends Hi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Sl(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}var Ts=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let o;n:{i:if(!(e<i)){for(let a=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=i,i=t[++n],e<i)break t}o=t.length;break n}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break t}o=n,n=0;break n}break e}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let o=0;o!==i;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Jl=class extends Ts{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:zu,endingEnd:zu}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,o=e+1,a=i[r],l=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case Gu:r=e,a=2*t-n;break;case Vu:r=i.length-2,a=t+i[r]-i[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Gu:o=e,l=2*n-t;break;case Vu:o=1,l=n+i[1]-i[0];break;default:o=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-t)/(i-t),v=g*g,p=v*g,m=-d*p+2*d*v-d*g,y=(1+d)*p+(-1.5-2*d)*v+(-.5+d)*g+1,_=(-1-f)*p+(1.5+f)*v+.5*g,x=f*p-f*v;for(let S=0;S!==a;++S)r[S]=m*o[h+S]+y*o[c+S]+_*o[l+S]+x*o[u+S];return r}},jl=class extends Ts{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==a;++d)r[d]=o[c+d]*u+o[l+d]*h;return r}},Ql=class extends Ts{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},ec=class extends Ts{interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this.inTangents,u=this.outTangents;if(!h||!u){let g=(n-t)/(i-t),v=1-g;for(let p=0;p!==a;++p)r[p]=o[c+p]*v+o[l+p]*g;return r}let d=a*2,f=e-1;for(let g=0;g!==a;++g){let v=o[c+g],p=o[l+g],m=f*d+g*2,y=u[m],_=u[m+1],x=e*d+g*2,S=h[x],M=h[x+1],w=(n-t)/(i-t),b,R,P,k,L;for(let H=0;H<8;H++){b=w*w,R=b*w,P=1-w,k=P*P,L=k*P;let F=L*t+3*k*w*y+3*P*b*S+R*i-n;if(Math.abs(F)<1e-10)break;let O=3*k*(y-t)+6*P*w*(S-y)+3*b*(i-S);if(Math.abs(O)<1e-10)break;w=w-F/O,w=Math.max(0,Math.min(1,w))}r[g]=L*v+3*k*w*_+3*P*b*M+R*p}return r}},$n=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Sl(t,this.TimeBufferType),this.values=Sl(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Sl(e.times,Array),values:Sl(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ql(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new jl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Jl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new ec(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Oo:t=this.InterpolantFactoryMethodDiscrete;break;case Ul:t=this.InterpolantFactoryMethodLinear;break;case Al:t=this.InterpolantFactoryMethodSmooth;break;case Ou:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return it("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Oo;case this.InterpolantFactoryMethodLinear:return Ul;case this.InterpolantFactoryMethodSmooth:return Al;case this.InterpolantFactoryMethodBezier:return Ou}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,o=i-1;for(;r!==i&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==i){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(lt("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(lt("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){lt("KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){lt("KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(i!==void 0&&zv(i))for(let a=0,l=i.length;a!==l;++a){let c=i[a];if(isNaN(c)){lt("KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Al,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(i)l=!0;else{let u=a*n,d=u-n,f=u+n;for(let g=0;g!==n;++g){let v=t[u+g];if(v!==t[d+g]||v!==t[f+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};$n.prototype.ValueTypeName="";$n.prototype.TimeBufferType=Float32Array;$n.prototype.ValueBufferType=Float32Array;$n.prototype.DefaultInterpolation=Ul;var Ms=class extends $n{constructor(e,t,n){super(e,t,n)}};Ms.prototype.ValueTypeName="bool";Ms.prototype.ValueBufferType=Array;Ms.prototype.DefaultInterpolation=Oo;Ms.prototype.InterpolantFactoryMethodLinear=void 0;Ms.prototype.InterpolantFactoryMethodSmooth=void 0;var tc=class extends $n{constructor(e,t,n,i){super(e,t,n,i)}};tc.prototype.ValueTypeName="color";var nc=class extends $n{constructor(e,t,n,i){super(e,t,n,i)}};nc.prototype.ValueTypeName="number";var ic=class extends Ts{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(i-t),c=e*a;for(let h=c+a;c!==h;c+=4)wt.slerpFlat(r,0,o,c-a,o,c,l);return r}},ua=class extends $n{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new ic(this.times,this.values,this.getValueSize(),e)}};ua.prototype.ValueTypeName="quaternion";ua.prototype.InterpolantFactoryMethodSmooth=void 0;var Ss=class extends $n{constructor(e,t,n){super(e,t,n)}};Ss.prototype.ValueTypeName="string";Ss.prototype.ValueBufferType=Array;Ss.prototype.DefaultInterpolation=Oo;Ss.prototype.InterpolantFactoryMethodLinear=void 0;Ss.prototype.InterpolantFactoryMethodSmooth=void 0;var sc=class extends $n{constructor(e,t,n,i){super(e,t,n,i)}};sc.prototype.ValueTypeName="vector";var rc=class{constructor(e,t,n){let i=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){a++,r===!1&&i.onStart!==void 0&&i.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],g=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},bm=new rc,oc=class{constructor(e){this.manager=e!==void 0?e:bm,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};oc.DEFAULT_MATERIAL_NAME="__DEFAULT";var cr=class extends dn{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ae(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},hr=class extends cr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(dn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ae(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Uu=new xt,Cp=new C,Ip=new C,da=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new de(512,512),this.mapType=Gn,this.map=null,this.mapPass=null,this.matrix=new xt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qr,this._frameExtents=new de(1,1),this._viewportCount=1,this._viewports=[new qt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Cp.setFromMatrixPosition(e.matrixWorld),t.position.copy(Cp),Ip.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ip),t.updateMatrixWorld(),Uu.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Uu,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===zr||t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Uu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},wl=new C,Rl=new wt,Ii=new C,fa=class extends dn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new xt,this.projectionMatrix=new xt,this.projectionMatrixInverse=new xt,this.coordinateSystem=mi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(wl,Rl,Ii),Ii.x===1&&Ii.y===1&&Ii.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(wl,Rl,Ii.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(wl,Rl,Ii),Ii.x===1&&Ii.y===1&&Ii.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(wl,Rl,Ii.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},xs=new C,Pp=new de,kp=new de,xn=class extends fa{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=nr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ho*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return nr*2*Math.atan(Math.tan(Ho*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){xs.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(xs.x,xs.y).multiplyScalar(-e/xs.z),xs.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(xs.x,xs.y).multiplyScalar(-e/xs.z)}getViewSize(e,t){return this.getViewBounds(e,Pp,kp),t.subVectors(kp,Pp)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ho*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*i/l,t-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},$u=class extends da{constructor(){super(new xn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=nr*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},pa=class extends cr{constructor(e,t,n=0,i=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(dn.DEFAULT_UP),this.updateMatrix(),this.target=new dn,this.distance=n,this.angle=i,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new $u}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},Ju=class extends da{constructor(){super(new xn(90,1,.5,500)),this.isPointLightShadow=!0}},Qr=class extends cr{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Ju}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},ws=class extends fa{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,o=n+e,a=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ju=class extends da{constructor(){super(new ws(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Rs=class extends cr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(dn.DEFAULT_UP),this.updateMatrix(),this.target=new dn,this.shadow=new ju}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Br=-90,Nr=1,ac=class extends dn{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new xn(Br,Nr,e,t);i.layers=this.layers,this.add(i);let r=new xn(Br,Nr,e,t);r.layers=this.layers,this.add(r);let o=new xn(Br,Nr,e,t);o.layers=this.layers,this.add(o);let a=new xn(Br,Nr,e,t);a.layers=this.layers,this.add(a);let l=new xn(Br,Nr,e,t);l.layers=this.layers,this.add(l);let c=new xn(Br,Nr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===mi)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===zr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(n,0,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,2,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,3,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=v,e.setRenderTarget(n,5,i),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},lc=class extends xn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},ma=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Qx.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Qx(){this._document.hidden===!1&&this.reset()}var vd="\\[\\]\\.:\\/",eb=new RegExp("["+vd+"]","g"),xd="[^"+vd+"]",tb="[^"+vd.replace("\\.","")+"]",nb=/((?:WC+[\/:])*)/.source.replace("WC",xd),ib=/(WCOD+)?/.source.replace("WCOD",tb),sb=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",xd),rb=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",xd),ob=new RegExp("^"+nb+ib+sb+rb+"$"),ab=["material","materials","bones","map"],Qu=class{constructor(e,t,n){let i=n||Gt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Gt=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(eb,"")}static parseTrackName(e){let t=ob.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);ab.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){it("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){lt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){lt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){lt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){lt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){lt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){lt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){lt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[i];if(o===void 0){let c=t.nodeName;lt("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){lt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){lt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Gt.Composite=Qu;Gt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Gt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Gt.prototype.GetterByBindingType=[Gt.prototype._getValue_direct,Gt.prototype._getValue_array,Gt.prototype._getValue_arrayElement,Gt.prototype._getValue_toArray];Gt.prototype.SetterByBindingTypeAndVersioning=[[Gt.prototype._setValue_direct,Gt.prototype._setValue_direct_setNeedsUpdate,Gt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_array,Gt.prototype._setValue_array_setNeedsUpdate,Gt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_arrayElement,Gt.prototype._setValue_arrayElement_setNeedsUpdate,Gt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Gt.prototype._setValue_fromArray,Gt.prototype._setValue_fromArray_setNeedsUpdate,Gt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var i2=new Float32Array(1);var Md=class Md{constructor(e,t,n,i){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,i){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=i,this}};Md.prototype.isMatrix2=!0;var ed=Md;function bd(s,e,t,n){let i=lb(n);switch(t){case cd:return s*e;case xc:return s*e/i.components*i.byteLength;case bc:return s*e/i.components*i.byteLength;case Is:return s*e*2/i.components*i.byteLength;case yc:return s*e*2/i.components*i.byteLength;case hd:return s*e*3/i.components*i.byteLength;case oi:return s*e*4/i.components*i.byteLength;case _c:return s*e*4/i.components*i.byteLength;case Sa:case wa:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Ra:case Aa:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Tc:case Sc:return Math.max(s,16)*Math.max(e,8)/4;case Ec:case Mc:return Math.max(s,8)*Math.max(e,8)/2;case wc:case Rc:case Cc:case Ic:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Ac:case Ca:case Pc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case kc:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Dc:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case Lc:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case Fc:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case Hc:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case Bc:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case Nc:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case Uc:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case Oc:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case zc:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case Gc:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case Vc:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case Wc:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case qc:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case Xc:case Yc:case Kc:return Math.ceil(s/4)*Math.ceil(e/4)*16;case Zc:case $c:return Math.ceil(s/4)*Math.ceil(e/4)*8;case Ia:case Jc:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function lb(s){switch(s){case Gn:case rd:return{byteLength:1,components:1};case to:case od:case bn:return{byteLength:2,components:1};case gc:case vc:return{byteLength:2,components:4};case yi:case mc:case ri:return{byteLength:4,components:1};case ad:case ld:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?it("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Gm(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&s!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function mb(s){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,u=c.byteLength,d=s.createBuffer();s.bindBuffer(l,d),s.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=s.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=s.SHORT;else if(c instanceof Uint32Array)f=s.UNSIGNED_INT;else if(c instanceof Int32Array)f=s.INT;else if(c instanceof Int8Array)f=s.BYTE;else if(c instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(s.bindBuffer(c,a),u.length===0)s.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){let g=u[d],v=u[f];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++d,u[d]=v)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){let v=u[f];s.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(s.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:i,remove:r,update:o}}var gb=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,vb=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,xb=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,bb=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yb=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,_b=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Eb=`#ifdef USE_AOMAP
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
#endif`,Tb=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mb=`#ifdef USE_BATCHING
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
#endif`,Sb=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,wb=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Rb=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ab=`float G_BlinnPhong_Implicit( ) {
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
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Cb=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
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
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ib=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Pb=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,kb=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Db=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Lb=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Fb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Hb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Bb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Nb=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ub=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
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
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ob=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
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
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
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
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
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
			mip = - 2.0 * log2( 1.16 * roughness );		}
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
#endif`,zb=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
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
#endif`,Gb=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Vb=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Wb=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,qb=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Xb="gl_FragColor = linearToOutputTexel( gl_FragColor );",Yb=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Kb=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
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
#endif`,Zb=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,$b=`#ifdef USE_ENVMAP
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
#endif`,Jb=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,jb=`#ifdef USE_ENVMAP
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
#endif`,Qb=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ey=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ty=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ny=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,iy=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,sy=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ry=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,oy=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ay=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
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
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
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
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
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
#include <lightprobes_pars_fragment>`,ly=`#ifdef USE_ENVMAP
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
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,cy=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,hy=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,uy=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,dy=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,fy=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
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
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
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
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,py=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
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
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
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
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
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
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
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
	float alpha = pow2( roughness );
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
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
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
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
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
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
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
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
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
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
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
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,my=`
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
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
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
#endif`,gy=`#if defined( RE_IndirectDiffuse )
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
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,vy=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,xy=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
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
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
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
#endif`,by=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,yy=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_y=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ey=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ty=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,My=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Sy=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,wy=`#if defined( USE_POINTS_UV )
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
#endif`,Ry=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ay=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Cy=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Iy=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Py=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ky=`#ifdef USE_MORPHTARGETS
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
#endif`,Dy=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ly=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Fy=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
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
#endif`,Hy=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,By=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ny=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Uy=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Oy=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,zy=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Gy=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Vy=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Wy=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,qy=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
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
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Xy=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Yy=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ky=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Zy=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,$y=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jy=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,jy=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
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
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
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
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
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
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
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
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
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
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
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
#endif`,Qy=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
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
#endif`,e1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
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
#endif
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
#endif`,t1=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
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
	#endif
	return shadow;
}`,n1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,i1=`#ifdef USE_SKINNING
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
#endif`,s1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,r1=`#ifdef USE_SKINNING
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
#endif`,o1=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,a1=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,l1=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,c1=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
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
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,h1=`#ifdef USE_TRANSMISSION
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
#endif`,u1=`#ifdef USE_TRANSMISSION
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
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
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
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
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
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,d1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,f1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,p1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,m1=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,g1=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,v1=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,x1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,b1=`#ifdef ENVMAP_TYPE_CUBE
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
}`,y1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_1=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,E1=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
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
}`,T1=`#if DEPTH_PACKING == 3200
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
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,M1=`#define DISTANCE
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
}`,S1=`#define DISTANCE
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
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,w1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,R1=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,A1=`uniform float scale;
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
}`,C1=`uniform vec3 diffuse;
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
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,I1=`#include <common>
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
}`,P1=`uniform vec3 diffuse;
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
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
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
}`,k1=`#define LAMBERT
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
}`,D1=`#define LAMBERT
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
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,L1=`#define MATCAP
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
}`,F1=`#define MATCAP
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
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,H1=`#define NORMAL
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
}`,B1=`#define NORMAL
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
}`,N1=`#define PHONG
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
}`,U1=`#define PHONG
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
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,O1=`#define STANDARD
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
}`,z1=`#define STANDARD
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
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
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
}`,G1=`#define TOON
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
}`,V1=`#define TOON
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
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,W1=`uniform float size;
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
}`,q1=`uniform vec3 diffuse;
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
}`,X1=`#include <common>
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
}`,Y1=`uniform vec3 color;
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
}`,K1=`uniform float rotation;
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
}`,Z1=`uniform vec3 diffuse;
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
}`,yt={alphahash_fragment:gb,alphahash_pars_fragment:vb,alphamap_fragment:xb,alphamap_pars_fragment:bb,alphatest_fragment:yb,alphatest_pars_fragment:_b,aomap_fragment:Eb,aomap_pars_fragment:Tb,batching_pars_vertex:Mb,batching_vertex:Sb,begin_vertex:wb,beginnormal_vertex:Rb,bsdfs:Ab,iridescence_fragment:Cb,bumpmap_pars_fragment:Ib,clipping_planes_fragment:Pb,clipping_planes_pars_fragment:kb,clipping_planes_pars_vertex:Db,clipping_planes_vertex:Lb,color_fragment:Fb,color_pars_fragment:Hb,color_pars_vertex:Bb,color_vertex:Nb,common:Ub,cube_uv_reflection_fragment:Ob,defaultnormal_vertex:zb,displacementmap_pars_vertex:Gb,displacementmap_vertex:Vb,emissivemap_fragment:Wb,emissivemap_pars_fragment:qb,colorspace_fragment:Xb,colorspace_pars_fragment:Yb,envmap_fragment:Kb,envmap_common_pars_fragment:Zb,envmap_pars_fragment:$b,envmap_pars_vertex:Jb,envmap_physical_pars_fragment:ly,envmap_vertex:jb,fog_vertex:Qb,fog_pars_vertex:ey,fog_fragment:ty,fog_pars_fragment:ny,gradientmap_pars_fragment:iy,lightmap_pars_fragment:sy,lights_lambert_fragment:ry,lights_lambert_pars_fragment:oy,lights_pars_begin:ay,lights_toon_fragment:cy,lights_toon_pars_fragment:hy,lights_phong_fragment:uy,lights_phong_pars_fragment:dy,lights_physical_fragment:fy,lights_physical_pars_fragment:py,lights_fragment_begin:my,lights_fragment_maps:gy,lights_fragment_end:vy,lightprobes_pars_fragment:xy,logdepthbuf_fragment:by,logdepthbuf_pars_fragment:yy,logdepthbuf_pars_vertex:_y,logdepthbuf_vertex:Ey,map_fragment:Ty,map_pars_fragment:My,map_particle_fragment:Sy,map_particle_pars_fragment:wy,metalnessmap_fragment:Ry,metalnessmap_pars_fragment:Ay,morphinstance_vertex:Cy,morphcolor_vertex:Iy,morphnormal_vertex:Py,morphtarget_pars_vertex:ky,morphtarget_vertex:Dy,normal_fragment_begin:Ly,normal_fragment_maps:Fy,normal_pars_fragment:Hy,normal_pars_vertex:By,normal_vertex:Ny,normalmap_pars_fragment:Uy,clearcoat_normal_fragment_begin:Oy,clearcoat_normal_fragment_maps:zy,clearcoat_pars_fragment:Gy,iridescence_pars_fragment:Vy,opaque_fragment:Wy,packing:qy,premultiplied_alpha_fragment:Xy,project_vertex:Yy,dithering_fragment:Ky,dithering_pars_fragment:Zy,roughnessmap_fragment:$y,roughnessmap_pars_fragment:Jy,shadowmap_pars_fragment:jy,shadowmap_pars_vertex:Qy,shadowmap_vertex:e1,shadowmask_pars_fragment:t1,skinbase_vertex:n1,skinning_pars_vertex:i1,skinning_vertex:s1,skinnormal_vertex:r1,specularmap_fragment:o1,specularmap_pars_fragment:a1,tonemapping_fragment:l1,tonemapping_pars_fragment:c1,transmission_fragment:h1,transmission_pars_fragment:u1,uv_pars_fragment:d1,uv_pars_vertex:f1,uv_vertex:p1,worldpos_vertex:m1,background_vert:g1,background_frag:v1,backgroundCube_vert:x1,backgroundCube_frag:b1,cube_vert:y1,cube_frag:_1,depth_vert:E1,depth_frag:T1,distance_vert:M1,distance_frag:S1,equirect_vert:w1,equirect_frag:R1,linedashed_vert:A1,linedashed_frag:C1,meshbasic_vert:I1,meshbasic_frag:P1,meshlambert_vert:k1,meshlambert_frag:D1,meshmatcap_vert:L1,meshmatcap_frag:F1,meshnormal_vert:H1,meshnormal_frag:B1,meshphong_vert:N1,meshphong_frag:U1,meshphysical_vert:O1,meshphysical_frag:z1,meshtoon_vert:G1,meshtoon_frag:V1,points_vert:W1,points_frag:q1,shadow_vert:X1,shadow_frag:Y1,sprite_vert:K1,sprite_frag:Z1},Pe={common:{diffuse:{value:new ae(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ut},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ut}},envmap:{envMap:{value:null},envMapRotation:{value:new ut},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ut}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ut}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ut},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ut},normalScale:{value:new de(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ut},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ut}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ut}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ut}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ae(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new C},probesMax:{value:new C},probesResolution:{value:new C}},points:{diffuse:{value:new ae(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0},uvTransform:{value:new ut}},sprite:{diffuse:{value:new ae(16777215)},opacity:{value:1},center:{value:new de(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ut},alphaMap:{value:null},alphaMapTransform:{value:new ut},alphaTest:{value:0}}},Ui={basic:{uniforms:Cn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.fog]),vertexShader:yt.meshbasic_vert,fragmentShader:yt.meshbasic_frag},lambert:{uniforms:Cn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new ae(0)},envMapIntensity:{value:1}}]),vertexShader:yt.meshlambert_vert,fragmentShader:yt.meshlambert_frag},phong:{uniforms:Cn([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new ae(0)},specular:{value:new ae(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:yt.meshphong_vert,fragmentShader:yt.meshphong_frag},standard:{uniforms:Cn([Pe.common,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.roughnessmap,Pe.metalnessmap,Pe.fog,Pe.lights,{emissive:{value:new ae(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:yt.meshphysical_vert,fragmentShader:yt.meshphysical_frag},toon:{uniforms:Cn([Pe.common,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.gradientmap,Pe.fog,Pe.lights,{emissive:{value:new ae(0)}}]),vertexShader:yt.meshtoon_vert,fragmentShader:yt.meshtoon_frag},matcap:{uniforms:Cn([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,{matcap:{value:null}}]),vertexShader:yt.meshmatcap_vert,fragmentShader:yt.meshmatcap_frag},points:{uniforms:Cn([Pe.points,Pe.fog]),vertexShader:yt.points_vert,fragmentShader:yt.points_frag},dashed:{uniforms:Cn([Pe.common,Pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:yt.linedashed_vert,fragmentShader:yt.linedashed_frag},depth:{uniforms:Cn([Pe.common,Pe.displacementmap]),vertexShader:yt.depth_vert,fragmentShader:yt.depth_frag},normal:{uniforms:Cn([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,{opacity:{value:1}}]),vertexShader:yt.meshnormal_vert,fragmentShader:yt.meshnormal_frag},sprite:{uniforms:Cn([Pe.sprite,Pe.fog]),vertexShader:yt.sprite_vert,fragmentShader:yt.sprite_frag},background:{uniforms:{uvTransform:{value:new ut},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:yt.background_vert,fragmentShader:yt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ut}},vertexShader:yt.backgroundCube_vert,fragmentShader:yt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:yt.cube_vert,fragmentShader:yt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:yt.equirect_vert,fragmentShader:yt.equirect_frag},distance:{uniforms:Cn([Pe.common,Pe.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:yt.distance_vert,fragmentShader:yt.distance_frag},shadow:{uniforms:Cn([Pe.lights,Pe.fog,{color:{value:new ae(0)},opacity:{value:1}}]),vertexShader:yt.shadow_vert,fragmentShader:yt.shadow_frag}};Ui.physical={uniforms:Cn([Ui.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ut},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ut},clearcoatNormalScale:{value:new de(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ut},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ut},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ut},sheen:{value:0},sheenColor:{value:new ae(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ut},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ut},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ut},transmissionSamplerSize:{value:new de},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ut},attenuationDistance:{value:0},attenuationColor:{value:new ae(0)},specularColor:{value:new ae(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ut},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ut},anisotropyVector:{value:new de},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ut}}]),vertexShader:yt.meshphysical_vert,fragmentShader:yt.meshphysical_frag};var eh={r:0,b:0,g:0},$1=new xt,Vm=new ut;Vm.set(-1,0,0,0,1,0,0,0,1);function J1(s,e,t,n,i,r){let o=new ae(0),a=i===!0?0:1,l,c,h=null,u=0,d=null;function f(y){let _=y.isScene===!0?y.background:null;if(_&&_.isTexture){let x=y.backgroundBlurriness>0;_=e.get(_,x)}return _}function g(y){let _=!1,x=f(y);x===null?p(o,a):x&&x.isColor&&(p(x,1),_=!0);let S=s.xr.getEnvironmentBlendMode();S==="additive"?t.buffers.color.setClear(0,0,0,1,r):S==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(s.autoClear||_)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function v(y,_){let x=f(_);x&&(x.isCubeTexture||x.mapping===Ta)?(c===void 0&&(c=new xe(new be(1,1,1),new Ct({name:"BackgroundCubeMaterial",uniforms:pr(Ui.backgroundCube.uniforms),vertexShader:Ui.backgroundCube.vertexShader,fragmentShader:Ui.backgroundCube.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,M,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4($1.makeRotationFromEuler(_.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Vm),c.material.toneMapped=Mt.getTransfer(x.colorSpace)!==At,(h!==x||u!==x.version||d!==s.toneMapping)&&(c.material.needsUpdate=!0,h=x,u=x.version,d=s.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new xe(new Ut(2,2),new Ct({name:"BackgroundMaterial",uniforms:pr(Ui.background.uniforms),vertexShader:Ui.background.vertexShader,fragmentShader:Ui.background.fragmentShader,side:gi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,l.material.toneMapped=Mt.getTransfer(x.colorSpace)!==At,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||u!==x.version||d!==s.toneMapping)&&(l.material.needsUpdate=!0,h=x,u=x.version,d=s.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function p(y,_){y.getRGB(eh,gd(s)),t.buffers.color.setClear(eh.r,eh.g,eh.b,_,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(y,_=1){o.set(y),a=_,p(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(y){a=y,p(o,a)},render:g,addToRenderList:v,dispose:m}}function j1(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null),r=i,o=!1;function a(k,L,H,B,F){let O=!1,z=u(k,B,H,L);r!==z&&(r=z,c(r.object)),O=f(k,B,H,F),O&&g(k,B,H,F),F!==null&&e.update(F,s.ELEMENT_ARRAY_BUFFER),(O||o)&&(o=!1,x(k,L,H,B),F!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return s.createVertexArray()}function c(k){return s.bindVertexArray(k)}function h(k){return s.deleteVertexArray(k)}function u(k,L,H,B){let F=B.wireframe===!0,O=n[L.id];O===void 0&&(O={},n[L.id]=O);let z=k.isInstancedMesh===!0?k.id:0,J=O[z];J===void 0&&(J={},O[z]=J);let ne=J[H.id];ne===void 0&&(ne={},J[H.id]=ne);let ue=ne[F];return ue===void 0&&(ue=d(l()),ne[F]=ue),ue}function d(k){let L=[],H=[],B=[];for(let F=0;F<t;F++)L[F]=0,H[F]=0,B[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:H,attributeDivisors:B,object:k,attributes:{},index:null}}function f(k,L,H,B){let F=r.attributes,O=L.attributes,z=0,J=H.getAttributes();for(let ne in J)if(J[ne].location>=0){let fe=F[ne],me=O[ne];if(me===void 0&&(ne==="instanceMatrix"&&k.instanceMatrix&&(me=k.instanceMatrix),ne==="instanceColor"&&k.instanceColor&&(me=k.instanceColor)),fe===void 0||fe.attribute!==me||me&&fe.data!==me.data)return!0;z++}return r.attributesNum!==z||r.index!==B}function g(k,L,H,B){let F={},O=L.attributes,z=0,J=H.getAttributes();for(let ne in J)if(J[ne].location>=0){let fe=O[ne];fe===void 0&&(ne==="instanceMatrix"&&k.instanceMatrix&&(fe=k.instanceMatrix),ne==="instanceColor"&&k.instanceColor&&(fe=k.instanceColor));let me={};me.attribute=fe,fe&&fe.data&&(me.data=fe.data),F[ne]=me,z++}r.attributes=F,r.attributesNum=z,r.index=B}function v(){let k=r.newAttributes;for(let L=0,H=k.length;L<H;L++)k[L]=0}function p(k){m(k,0)}function m(k,L){let H=r.newAttributes,B=r.enabledAttributes,F=r.attributeDivisors;H[k]=1,B[k]===0&&(s.enableVertexAttribArray(k),B[k]=1),F[k]!==L&&(s.vertexAttribDivisor(k,L),F[k]=L)}function y(){let k=r.newAttributes,L=r.enabledAttributes;for(let H=0,B=L.length;H<B;H++)L[H]!==k[H]&&(s.disableVertexAttribArray(H),L[H]=0)}function _(k,L,H,B,F,O,z){z===!0?s.vertexAttribIPointer(k,L,H,F,O):s.vertexAttribPointer(k,L,H,B,F,O)}function x(k,L,H,B){v();let F=B.attributes,O=H.getAttributes(),z=L.defaultAttributeValues;for(let J in O){let ne=O[J];if(ne.location>=0){let ue=F[J];if(ue===void 0&&(J==="instanceMatrix"&&k.instanceMatrix&&(ue=k.instanceMatrix),J==="instanceColor"&&k.instanceColor&&(ue=k.instanceColor)),ue!==void 0){let fe=ue.normalized,me=ue.itemSize,Ke=e.get(ue);if(Ke===void 0)continue;let Le=Ke.buffer,ye=Ke.type,W=Ke.bytesPerElement,se=ye===s.INT||ye===s.UNSIGNED_INT||ue.gpuType===mc;if(ue.isInterleavedBufferAttribute){let ie=ue.data,_e=ie.stride,Me=ue.offset;if(ie.isInstancedInterleavedBuffer){for(let Ee=0;Ee<ne.locationSize;Ee++)m(ne.location+Ee,ie.meshPerAttribute);k.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let Ee=0;Ee<ne.locationSize;Ee++)p(ne.location+Ee);s.bindBuffer(s.ARRAY_BUFFER,Le);for(let Ee=0;Ee<ne.locationSize;Ee++)_(ne.location+Ee,me/ne.locationSize,ye,fe,_e*W,(Me+me/ne.locationSize*Ee)*W,se)}else{if(ue.isInstancedBufferAttribute){for(let ie=0;ie<ne.locationSize;ie++)m(ne.location+ie,ue.meshPerAttribute);k.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ue.meshPerAttribute*ue.count)}else for(let ie=0;ie<ne.locationSize;ie++)p(ne.location+ie);s.bindBuffer(s.ARRAY_BUFFER,Le);for(let ie=0;ie<ne.locationSize;ie++)_(ne.location+ie,me/ne.locationSize,ye,fe,me*W,me/ne.locationSize*ie*W,se)}}else if(z!==void 0){let fe=z[J];if(fe!==void 0)switch(fe.length){case 2:s.vertexAttrib2fv(ne.location,fe);break;case 3:s.vertexAttrib3fv(ne.location,fe);break;case 4:s.vertexAttrib4fv(ne.location,fe);break;default:s.vertexAttrib1fv(ne.location,fe)}}}}y()}function S(){R();for(let k in n){let L=n[k];for(let H in L){let B=L[H];for(let F in B){let O=B[F];for(let z in O)h(O[z].object),delete O[z];delete B[F]}}delete n[k]}}function M(k){if(n[k.id]===void 0)return;let L=n[k.id];for(let H in L){let B=L[H];for(let F in B){let O=B[F];for(let z in O)h(O[z].object),delete O[z];delete B[F]}}delete n[k.id]}function w(k){for(let L in n){let H=n[L];for(let B in H){let F=H[B];if(F[k.id]===void 0)continue;let O=F[k.id];for(let z in O)h(O[z].object),delete O[z];delete F[k.id]}}}function b(k){for(let L in n){let H=n[L],B=k.isInstancedMesh===!0?k.id:0,F=H[B];if(F!==void 0){for(let O in F){let z=F[O];for(let J in z)h(z[J].object),delete z[J];delete F[O]}delete H[B],Object.keys(H).length===0&&delete n[L]}}}function R(){P(),o=!0,r!==i&&(r=i,c(r.object))}function P(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:R,resetDefaultState:P,dispose:S,releaseStatesOfGeometry:M,releaseStatesOfObject:b,releaseStatesOfProgram:w,initAttributes:v,enableAttribute:p,disableUnusedAttributes:y}}function Q1(s,e,t){let n;function i(l){n=l}function r(l,c){s.drawArrays(n,l,c),t.update(c,n,1)}function o(l,c,h){h!==0&&(s.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function a(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];t.update(d,n,1)}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function e_(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let w=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(w){return!(w!==oi&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(w){let b=w===bn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(w!==Gn&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==ri&&!b)}function l(w){if(w==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(it("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&it("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),m=s.getParameter(s.MAX_VERTEX_ATTRIBS),y=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),_=s.getParameter(s.MAX_VARYING_VECTORS),x=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),S=s.getParameter(s.MAX_SAMPLES),M=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:y,maxVaryings:_,maxFragmentUniforms:x,maxSamples:S,samples:M}}function t_(s){let e=this,t=null,n=0,i=!1,r=!1,o=new Pi,a=new ut,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let g=u.clippingPlanes,v=u.clipIntersection,p=u.clipShadows,m=s.get(u);if(!i||g===null||g.length===0||r&&!p)r?h(null):c();else{let y=r?0:n,_=y*4,x=m.clippingState||null;l.value=x,x=h(g,d,_,f);for(let S=0;S!==_;++S)x[S]=t[S];m.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,g){let v=u!==null?u.length:0,p=null;if(v!==0){if(p=l.value,g!==!0||p===null){let m=f+v*4,y=d.matrixWorldInverse;a.getNormalMatrix(y),(p===null||p.length<m)&&(p=new Float32Array(m));for(let _=0,x=f;_!==v;++_,x+=4)o.copy(u[_]).applyMatrix4(y,a),o.normal.toArray(p,x),p[x+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,p}}var Ps=4,ym=[.125,.215,.35,.446,.526,.582],mr=20,n_=256,ka=new ws,_m=new ae,Sd=null,wd=0,Rd=0,Ad=!1,i_=new C,oo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,i=100,r={}){let{size:o=256,position:a=i_}=r;Sd=this._renderer.getRenderTarget(),wd=this._renderer.getActiveCubeFace(),Rd=this._renderer.getActiveMipmapLevel(),Ad=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,i,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Mm(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Tm(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Sd,wd,Rd),this._renderer.xr.enabled=Ad,e.scissorTest=!1,so(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===As||e.mapping===dr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Sd=this._renderer.getRenderTarget(),wd=this._renderer.getActiveCubeFace(),Rd=this._renderer.getActiveMipmapLevel(),Ad=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:rn,minFilter:rn,generateMipmaps:!1,type:bn,format:oi,colorSpace:zo,depthBuffer:!1},i=Em(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Em(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=s_(r)),this._blurMaterial=o_(r,e,t),this._ggxMaterial=r_(r,e,t)}return i}_compileMaterial(e){let t=new xe(new dt,e);this._renderer.compile(t,ka)}_sceneToCubeUV(e,t,n,i,r){let l=new xn(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(_m),u.toneMapping=bi,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new xe(new be,new Kt({name:"PMREM.Background",side:fn,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,p=v.material,m=!1,y=e.background;y?y.isColor&&(p.color.copy(y),e.background=null,m=!0):(p.color.copy(_m),m=!0);for(let _=0;_<6;_++){let x=_%3;x===0?(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[_],r.y,r.z)):x===1?(l.up.set(0,0,c[_]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[_],r.z)):(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[_]));let S=this._cubeSize;so(i,x*S,_>2?S:0,S,S),u.setRenderTarget(i),m&&u.render(v,l),u.render(e,l)}u.toneMapping=f,u.autoClear=d,e.background=y}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===As||e.mapping===dr;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Mm()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Tm());let r=i?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;so(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,ka)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodMeshes.length;for(let r=1;r<i;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let i=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[n];a.material=o;let l=o.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=0+c*1.25,f=u*d,{_lodMax:g}=this,v=this._sizeLods[n],p=3*v*(n>g-Ps?n-g+Ps:0),m=4*(this._cubeSize-v);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=g-t,so(r,p,m,3*v,2*v),i.setRenderTarget(r),i.render(a,ka),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-n,so(e,p,m,3*v,2*v),i.setRenderTarget(e),i.render(a,ka)}_blur(e,t,n,i,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&lt("blur direction must be either latitudinal or longitudinal!");let h=3,u=this._lodMeshes[i];u.material=c;let d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*mr-1),v=r/g,p=isFinite(r)?1+Math.floor(h*v):mr;p>mr&&it(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${mr}`);let m=[],y=0;for(let w=0;w<mr;++w){let b=w/v,R=Math.exp(-b*b/2);m.push(R),w===0?y+=R:w<p&&(y+=2*R)}for(let w=0;w<m.length;w++)m[w]=m[w]/y;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=m,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:_}=this;d.dTheta.value=g,d.mipInt.value=_-n;let x=this._sizeLods[i],S=3*x*(i>_-Ps?i-_+Ps:0),M=4*(this._cubeSize-x);so(t,S,M,3*x,2*x),l.setRenderTarget(t),l.render(u,ka)}};function s_(s){let e=[],t=[],n=[],i=s,r=s-Ps+1+ym.length;for(let o=0;o<r;o++){let a=Math.pow(2,i);e.push(a);let l=1/a;o>s-Ps?l=ym[o-s+Ps-1]:o===0&&(l=0),t.push(l);let c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,v=3,p=2,m=1,y=new Float32Array(v*g*f),_=new Float32Array(p*g*f),x=new Float32Array(m*g*f);for(let M=0;M<f;M++){let w=M%3*2/3-1,b=M>2?0:-1,R=[w,b,0,w+2/3,b,0,w+2/3,b+1,0,w,b,0,w+2/3,b+1,0,w,b+1,0];y.set(R,v*g*M),_.set(d,p*g*M);let P=[M,M,M,M,M,M];x.set(P,m*g*M)}let S=new dt;S.setAttribute("position",new ot(y,v)),S.setAttribute("uv",new ot(_,p)),S.setAttribute("faceIndex",new ot(x,m)),n.push(new xe(S,null)),i>Ps&&i--}return{lodMeshes:n,sizeLods:e,sigmas:t}}function Em(s,e,t){let n=new on(s,e,t);return n.texture.mapping=Ta,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function so(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function r_(s,e,t){return new Ct({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:n_,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:sh(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function o_(s,e,t){let n=new Float32Array(mr),i=new C(0,1,0);return new Ct({name:"SphericalGaussianBlur",defines:{n:mr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:sh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Tm(){return new Ct({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:sh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Mm(){return new Ct({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:sh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function sh(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var nh=class extends on{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new $o(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new be(5,5,5),r=new Ct({name:"CubemapFromEquirect",uniforms:pr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:fn,blending:si});r.uniforms.tEquirect.value=t;let o=new xe(i,r),a=t.minFilter;return t.minFilter===zn&&(t.minFilter=rn),new ac(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}};function a_(s){let e=new WeakMap,t=new WeakMap,n=null;function i(d,f=!1){return d==null?null:f?o(d):r(d)}function r(d){if(d&&d.isTexture){let f=d.mapping;if(f===dc||f===fc)if(e.has(d)){let g=e.get(d).texture;return a(g,d.mapping)}else{let g=d.image;if(g&&g.height>0){let v=new nh(g.height);return v.fromEquirectangularTexture(s,d),e.set(d,v),d.addEventListener("dispose",c),a(v.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture){let f=d.mapping,g=f===dc||f===fc,v=f===As||f===dr;if(g||v){let p=t.get(d),m=p!==void 0?p.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return n===null&&(n=new oo(s)),p=g?n.fromEquirectangular(d,p):n.fromCubemap(d,p),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),p.texture;if(p!==void 0)return p.texture;{let y=d.image;return g&&y&&y.height>0||v&&y&&l(y)?(n===null&&(n=new oo(s)),p=g?n.fromEquirectangular(d):n.fromCubemap(d),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),d.addEventListener("dispose",h),p.texture):null}}}return d}function a(d,f){return f===dc?d.mapping=As:f===fc&&(d.mapping=dr),d}function l(d){let f=0,g=6;for(let v=0;v<g;v++)d[v]!==void 0&&f++;return f===g}function c(d){let f=d.target;f.removeEventListener("dispose",c);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function h(d){let f=d.target;f.removeEventListener("dispose",h);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function u(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:u}}function l_(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i=s.getExtension(n);return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&er("WebGLRenderer: "+n+" extension not supported."),i}}}function c_(s,e,t,n){let i={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete i[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(u,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let f in d)e.update(d[f],s.ARRAY_BUFFER)}function c(u){let d=[],f=u.index,g=u.attributes.position,v=0;if(g===void 0)return;if(f!==null){let y=f.array;v=f.version;for(let _=0,x=y.length;_<x;_+=3){let S=y[_+0],M=y[_+1],w=y[_+2];d.push(S,M,M,w,w,S)}}else{let y=g.array;v=g.version;for(let _=0,x=y.length/3-1;_<x;_+=3){let S=_+0,M=_+1,w=_+2;d.push(S,M,M,w,w,S)}}let p=new(g.count>=65535?Yo:Xo)(d,1);p.version=v;let m=r.get(u);m&&e.remove(m),r.set(u,p)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function h_(s,e,t){let n;function i(u){n=u}let r,o;function a(u){r=u.type,o=u.bytesPerElement}function l(u,d){s.drawElements(n,d,r,u*o),t.update(d,n,1)}function c(u,d,f){f!==0&&(s.drawElementsInstanced(n,d,r,u*o,f),t.update(d,n,f))}function h(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,u,0,f);let v=0;for(let p=0;p<f;p++)v+=d[p];t.update(v,n,1)}this.setMode=i,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function u_(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=a*(r/3);break;case s.LINES:t.lines+=a*(r/2);break;case s.LINE_STRIP:t.lines+=a*(r-1);break;case s.LINE_LOOP:t.lines+=a*r;break;case s.POINTS:t.points+=a*r;break;default:lt("WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function d_(s,e,t){let n=new WeakMap,i=new qt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(a);if(d===void 0||d.count!==u){let P=function(){b.dispose(),n.delete(a),a.removeEventListener("dispose",P)};var f=P;d!==void 0&&d.texture.dispose();let g=a.morphAttributes.position!==void 0,v=a.morphAttributes.normal!==void 0,p=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],y=a.morphAttributes.normal||[],_=a.morphAttributes.color||[],x=0;g===!0&&(x=1),v===!0&&(x=2),p===!0&&(x=3);let S=a.attributes.position.count*x,M=1;S>e.maxTextureSize&&(M=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);let w=new Float32Array(S*M*4*u),b=new Wo(w,S,M,u);b.type=ri,b.needsUpdate=!0;let R=x*4;for(let k=0;k<u;k++){let L=m[k],H=y[k],B=_[k],F=S*M*4*k;for(let O=0;O<L.count;O++){let z=O*R;g===!0&&(i.fromBufferAttribute(L,O),w[F+z+0]=i.x,w[F+z+1]=i.y,w[F+z+2]=i.z,w[F+z+3]=0),v===!0&&(i.fromBufferAttribute(H,O),w[F+z+4]=i.x,w[F+z+5]=i.y,w[F+z+6]=i.z,w[F+z+7]=0),p===!0&&(i.fromBufferAttribute(B,O),w[F+z+8]=i.x,w[F+z+9]=i.y,w[F+z+10]=i.z,w[F+z+11]=B.itemSize===4?i.w:1)}}d={count:u,texture:b,size:new de(S,M)},n.set(a,d),a.addEventListener("dispose",P)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",o.morphTexture,t);else{let g=0;for(let p=0;p<c.length;p++)g+=c[p];let v=a.morphTargetsRelative?1:1-g;l.getUniforms().setValue(s,"morphTargetBaseInfluence",v),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function f_(s,e,t,n,i){let r=new WeakMap;function o(c){let h=i.render.frame,u=c.geometry,d=e.get(c,u);if(r.get(d)!==h&&(e.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return d}function a(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:o,dispose:a}}var p_={[va]:"LINEAR_TONE_MAPPING",[xa]:"REINHARD_TONE_MAPPING",[ba]:"CINEON_TONE_MAPPING",[ur]:"ACES_FILMIC_TONE_MAPPING",[_a]:"AGX_TONE_MAPPING",[Ea]:"NEUTRAL_TONE_MAPPING",[ya]:"CUSTOM_TONE_MAPPING"};function m_(s,e,t,n,i,r){let o=new on(e,t,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,depthTexture:i?new ts(e,t):void 0}),a=new on(e,t,{type:bn,depthBuffer:!1,stencilBuffer:!1}),l=new dt;l.setAttribute("position",new st([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new st([0,2,0,0,2,0],2));let c=new jr({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new xe(l,c),u=new ws(-1,1,1,-1,0,1),d=null,f=null,g=!1,v,p=null,m=[],y=!1;this.setSize=function(_,x){o.setSize(_,x),a.setSize(_,x);for(let S=0;S<m.length;S++){let M=m[S];M.setSize&&M.setSize(_,x)}},this.setEffects=function(_){m=_,y=m.length>0&&m[0].isRenderPass===!0;let x=o.width,S=o.height;for(let M=0;M<m.length;M++){let w=m[M];w.setSize&&w.setSize(x,S)}},this.begin=function(_,x){if(g||_.toneMapping===bi&&m.length===0)return!1;if(p=x,x!==null){let S=x.width,M=x.height;(o.width!==S||o.height!==M)&&this.setSize(S,M)}return y===!1&&_.setRenderTarget(o),v=_.toneMapping,_.toneMapping=bi,!0},this.hasRenderPass=function(){return y},this.end=function(_,x){_.toneMapping=v,g=!0;let S=o,M=a;for(let w=0;w<m.length;w++){let b=m[w];if(b.enabled!==!1&&(b.render(_,M,S,x),b.needsSwap!==!1)){let R=S;S=M,M=R}}if(d!==_.outputColorSpace||f!==_.toneMapping){d=_.outputColorSpace,f=_.toneMapping,c.defines={},Mt.getTransfer(d)===At&&(c.defines.SRGB_TRANSFER="");let w=p_[f];w&&(c.defines[w]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=S.texture,_.setRenderTarget(p),_.render(h,u),p=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.depthTexture&&o.depthTexture.dispose(),o.dispose(),a.dispose(),l.dispose(),c.dispose()}}var Wm=new Ln,Pd=new ts(1,1),qm=new Wo,Xm=new Gl,Ym=new $o,Sm=[],wm=[],Rm=new Float32Array(16),Am=new Float32Array(9),Cm=new Float32Array(4);function ao(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Sm[i];if(r===void 0&&(r=new Float32Array(i),Sm[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function pn(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function mn(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function rh(s,e){let t=wm[e];t===void 0&&(t=new Int32Array(e),wm[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function g_(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function v_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(pn(t,e))return;s.uniform2fv(this.addr,e),mn(t,e)}}function x_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(pn(t,e))return;s.uniform3fv(this.addr,e),mn(t,e)}}function b_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(pn(t,e))return;s.uniform4fv(this.addr,e),mn(t,e)}}function y_(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(pn(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),mn(t,e)}else{if(pn(t,n))return;Cm.set(n),s.uniformMatrix2fv(this.addr,!1,Cm),mn(t,n)}}function __(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(pn(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),mn(t,e)}else{if(pn(t,n))return;Am.set(n),s.uniformMatrix3fv(this.addr,!1,Am),mn(t,n)}}function E_(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(pn(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),mn(t,e)}else{if(pn(t,n))return;Rm.set(n),s.uniformMatrix4fv(this.addr,!1,Rm),mn(t,n)}}function T_(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function M_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(pn(t,e))return;s.uniform2iv(this.addr,e),mn(t,e)}}function S_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(pn(t,e))return;s.uniform3iv(this.addr,e),mn(t,e)}}function w_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(pn(t,e))return;s.uniform4iv(this.addr,e),mn(t,e)}}function R_(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function A_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(pn(t,e))return;s.uniform2uiv(this.addr,e),mn(t,e)}}function C_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(pn(t,e))return;s.uniform3uiv(this.addr,e),mn(t,e)}}function I_(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(pn(t,e))return;s.uniform4uiv(this.addr,e),mn(t,e)}}function P_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Pd.compareFunction=t.isReversedDepthBuffer()?Qc:jc,r=Pd):r=Wm,t.setTexture2D(e||r,i)}function k_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Xm,i)}function D_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Ym,i)}function L_(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||qm,i)}function F_(s){switch(s){case 5126:return g_;case 35664:return v_;case 35665:return x_;case 35666:return b_;case 35674:return y_;case 35675:return __;case 35676:return E_;case 5124:case 35670:return T_;case 35667:case 35671:return M_;case 35668:case 35672:return S_;case 35669:case 35673:return w_;case 5125:return R_;case 36294:return A_;case 36295:return C_;case 36296:return I_;case 35678:case 36198:case 36298:case 36306:case 35682:return P_;case 35679:case 36299:case 36307:return k_;case 35680:case 36300:case 36308:case 36293:return D_;case 36289:case 36303:case 36311:case 36292:return L_}}function H_(s,e){s.uniform1fv(this.addr,e)}function B_(s,e){let t=ao(e,this.size,2);s.uniform2fv(this.addr,t)}function N_(s,e){let t=ao(e,this.size,3);s.uniform3fv(this.addr,t)}function U_(s,e){let t=ao(e,this.size,4);s.uniform4fv(this.addr,t)}function O_(s,e){let t=ao(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function z_(s,e){let t=ao(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function G_(s,e){let t=ao(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function V_(s,e){s.uniform1iv(this.addr,e)}function W_(s,e){s.uniform2iv(this.addr,e)}function q_(s,e){s.uniform3iv(this.addr,e)}function X_(s,e){s.uniform4iv(this.addr,e)}function Y_(s,e){s.uniform1uiv(this.addr,e)}function K_(s,e){s.uniform2uiv(this.addr,e)}function Z_(s,e){s.uniform3uiv(this.addr,e)}function $_(s,e){s.uniform4uiv(this.addr,e)}function J_(s,e,t){let n=this.cache,i=e.length,r=rh(t,i);pn(n,r)||(s.uniform1iv(this.addr,r),mn(n,r));let o;this.type===s.SAMPLER_2D_SHADOW?o=Pd:o=Wm;for(let a=0;a!==i;++a)t.setTexture2D(e[a]||o,r[a])}function j_(s,e,t){let n=this.cache,i=e.length,r=rh(t,i);pn(n,r)||(s.uniform1iv(this.addr,r),mn(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||Xm,r[o])}function Q_(s,e,t){let n=this.cache,i=e.length,r=rh(t,i);pn(n,r)||(s.uniform1iv(this.addr,r),mn(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Ym,r[o])}function eE(s,e,t){let n=this.cache,i=e.length,r=rh(t,i);pn(n,r)||(s.uniform1iv(this.addr,r),mn(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||qm,r[o])}function tE(s){switch(s){case 5126:return H_;case 35664:return B_;case 35665:return N_;case 35666:return U_;case 35674:return O_;case 35675:return z_;case 35676:return G_;case 5124:case 35670:return V_;case 35667:case 35671:return W_;case 35668:case 35672:return q_;case 35669:case 35673:return X_;case 5125:return Y_;case 36294:return K_;case 36295:return Z_;case 36296:return $_;case 35678:case 36198:case 36298:case 36306:case 35682:return J_;case 35679:case 36299:case 36307:return j_;case 35680:case 36300:case 36308:case 36293:return Q_;case 36289:case 36303:case 36311:case 36292:return eE}}var kd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=F_(t.type)}},Dd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=tE(t.type)}},Ld=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,o=i.length;r!==o;++r){let a=i[r];a.setValue(e,t[a.id],n)}}},Cd=/(\w+)(\])?(\[|\.)?/g;function Im(s,e){s.seq.push(e),s.map[e.id]=e}function nE(s,e,t){let n=s.name,i=n.length;for(Cd.lastIndex=0;;){let r=Cd.exec(n),o=Cd.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){Im(t,c===void 0?new kd(a,s,e):new Dd(a,s,e));break}else{let u=t.map[a];u===void 0&&(u=new Ld(a),Im(t,u)),t=u}}}var ro=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<n;++o){let a=e.getActiveUniform(t,o),l=e.getUniformLocation(t,a.name);nE(a,l,this)}let i=[],r=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(o):r.push(o);i.length>0&&(this.seq=i.concat(r))}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function Pm(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var iE=37297,sE=0;function rE(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var km=new ut;function oE(s){Mt._getMatrix(km,Mt.workingColorSpace,s);let e=`mat3( ${km.elements.map(t=>t.toFixed(4))} )`;switch(Mt.getTransfer(s)){case Go:return[e,"LinearTransferOETF"];case At:return[e,"sRGBTransferOETF"];default:return it("WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function Dm(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+rE(s.getShaderSource(e),a)}else return r}function aE(s,e){let t=oE(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var lE={[va]:"Linear",[xa]:"Reinhard",[ba]:"Cineon",[ur]:"ACESFilmic",[_a]:"AgX",[Ea]:"Neutral",[ya]:"Custom"};function cE(s,e){let t=lE[e];return t===void 0?(it("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var th=new C;function hE(){Mt.getLuminanceCoefficients(th);let s=th.x.toFixed(4),e=th.y.toFixed(4),t=th.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function uE(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(La).join(`
`)}function dE(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function fE(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),o=r.name,a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function La(s){return s!==""}function Lm(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Fm(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var pE=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fd(s){return s.replace(pE,gE)}var mE=new Map;function gE(s,e){let t=yt[e];if(t===void 0){let n=mE.get(e);if(n!==void 0)t=yt[n],it('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Fd(t)}var vE=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Hm(s){return s.replace(vE,xE)}function xE(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Bm(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var bE={[ga]:"SHADOWMAP_TYPE_PCF",[eo]:"SHADOWMAP_TYPE_VSM"};function yE(s){return bE[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var _E={[As]:"ENVMAP_TYPE_CUBE",[dr]:"ENVMAP_TYPE_CUBE",[Ta]:"ENVMAP_TYPE_CUBE_UV"};function EE(s){return s.envMap===!1?"ENVMAP_TYPE_CUBE":_E[s.envMapMode]||"ENVMAP_TYPE_CUBE"}var TE={[dr]:"ENVMAP_MODE_REFRACTION"};function ME(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":TE[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}var SE={[uc]:"ENVMAP_BLENDING_MULTIPLY",[Qp]:"ENVMAP_BLENDING_MIX",[em]:"ENVMAP_BLENDING_ADD"};function wE(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":SE[s.combine]||"ENVMAP_BLENDING_NONE"}function RE(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function AE(s,e,t,n){let i=s.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=yE(t),c=EE(t),h=ME(t),u=wE(t),d=RE(t),f=uE(t),g=dE(r),v=i.createProgram(),p,m,y=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(La).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(La).join(`
`),m.length>0&&(m+=`
`)):(p=[Bm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(La).join(`
`),m=[Bm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==bi?"#define TONE_MAPPING":"",t.toneMapping!==bi?yt.tonemapping_pars_fragment:"",t.toneMapping!==bi?cE("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",yt.colorspace_pars_fragment,aE("linearToOutputTexel",t.outputColorSpace),hE(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(La).join(`
`)),o=Fd(o),o=Lm(o,t),o=Fm(o,t),a=Fd(a),a=Lm(a,t),a=Fm(a,t),o=Hm(o),a=Hm(a),t.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===dd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===dd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let _=y+p+o,x=y+m+a,S=Pm(i,i.VERTEX_SHADER,_),M=Pm(i,i.FRAGMENT_SHADER,x);i.attachShader(v,S),i.attachShader(v,M),t.index0AttributeName!==void 0?i.bindAttribLocation(v,0,t.index0AttributeName):t.hasPositionAttribute===!0&&i.bindAttribLocation(v,0,"position"),i.linkProgram(v);function w(k){if(s.debug.checkShaderErrors){let L=i.getProgramInfoLog(v)||"",H=i.getShaderInfoLog(S)||"",B=i.getShaderInfoLog(M)||"",F=L.trim(),O=H.trim(),z=B.trim(),J=!0,ne=!0;if(i.getProgramParameter(v,i.LINK_STATUS)===!1)if(J=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,v,S,M);else{let ue=Dm(i,S,"vertex"),fe=Dm(i,M,"fragment");lt("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(v,i.VALIDATE_STATUS)+`

Material Name: `+k.name+`
Material Type: `+k.type+`

Program Info Log: `+F+`
`+ue+`
`+fe)}else F!==""?it("WebGLProgram: Program Info Log:",F):(O===""||z==="")&&(ne=!1);ne&&(k.diagnostics={runnable:J,programLog:F,vertexShader:{log:O,prefix:p},fragmentShader:{log:z,prefix:m}})}i.deleteShader(S),i.deleteShader(M),b=new ro(i,v),R=fE(i,v)}let b;this.getUniforms=function(){return b===void 0&&w(this),b};let R;this.getAttributes=function(){return R===void 0&&w(this),R};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=i.getProgramParameter(v,iE)),P},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=sE++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=S,this.fragmentShader=M,this}var CE=0,Hd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let i=this._getShaderCacheForMaterial(e);return i.has(t)===!1&&(i.add(t),t.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Bd(e),t.set(e,n)),n}},Bd=class{constructor(e){this.id=CE++,this.code=e,this.usedTimes=0}};function IE(s){return s===Is||s===Ca||s===Ia}function PE(s,e,t,n,i,r){let o=new qo,a=new Hd,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer,d=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(b){return l.add(b),b===0?"uv":`uv${b}`}function v(b,R,P,k,L,H){let B=k.fog,F=L.geometry,O=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?k.environment:null,z=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap,J=e.get(b.envMap||O,z),ne=J&&J.mapping===Ta?J.image.height:null,ue=f[b.type];b.precision!==null&&(d=n.getMaxPrecision(b.precision),d!==b.precision&&it("WebGLProgram.getParameters:",b.precision,"not supported, using",d,"instead."));let fe=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,me=fe!==void 0?fe.length:0,Ke=0;F.morphAttributes.position!==void 0&&(Ke=1),F.morphAttributes.normal!==void 0&&(Ke=2),F.morphAttributes.color!==void 0&&(Ke=3);let Le,ye,W,se;if(ue){let Be=Ui[ue];Le=Be.vertexShader,ye=Be.fragmentShader}else{Le=b.vertexShader,ye=b.fragmentShader;let Be=a.getVertexShaderStage(b),$t=a.getFragmentShaderStage(b);a.update(b,Be,$t),W=Be.id,se=$t.id}let ie=s.getRenderTarget(),_e=s.state.buffers.depth.getReversed(),Me=L.isInstancedMesh===!0,Ee=L.isBatchedMesh===!0,Ge=!!b.map,Fe=!!b.matcap,re=!!J,he=!!b.aoMap,le=!!b.lightMap,Se=!!b.bumpMap&&b.wireframe===!1,we=!!b.normalMap,Je=!!b.displacementMap,Ve=!!b.emissiveMap,nt=!!b.metalnessMap,ct=!!b.roughnessMap,N=b.anisotropy>0,Rt=b.clearcoat>0,mt=b.dispersion>0,D=b.iridescence>0,A=b.sheen>0,V=b.transmission>0,X=N&&!!b.anisotropyMap,j=Rt&&!!b.clearcoatMap,ge=Rt&&!!b.clearcoatNormalMap,ve=Rt&&!!b.clearcoatRoughnessMap,ee=D&&!!b.iridescenceMap,oe=D&&!!b.iridescenceThicknessMap,Re=A&&!!b.sheenColorMap,Oe=A&&!!b.sheenRoughnessMap,Ce=!!b.specularMap,Ae=!!b.specularColorMap,Ze=!!b.specularIntensityMap,et=V&&!!b.transmissionMap,ht=V&&!!b.thicknessMap,U=!!b.gradientMap,pe=!!b.alphaMap,te=b.alphaTest>0,Te=!!b.alphaHash,Ie=!!b.extensions,ce=bi;b.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(ce=s.toneMapping);let ze={shaderID:ue,shaderType:b.type,shaderName:b.name,vertexShader:Le,fragmentShader:ye,defines:b.defines,customVertexShaderID:W,customFragmentShaderID:se,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:d,batching:Ee,batchingColor:Ee&&L._colorsTexture!==null,instancing:Me,instancingColor:Me&&L.instanceColor!==null,instancingMorph:Me&&L.morphTexture!==null,outputColorSpace:ie===null?s.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:Mt.workingColorSpace,alphaToCoverage:!!b.alphaToCoverage,map:Ge,matcap:Fe,envMap:re,envMapMode:re&&J.mapping,envMapCubeUVHeight:ne,aoMap:he,lightMap:le,bumpMap:Se,normalMap:we,displacementMap:Je,emissiveMap:Ve,normalMapObjectSpace:we&&b.normalMapType===im,normalMapTangentSpace:we&&b.normalMapType===Pa,packedNormalMap:we&&b.normalMapType===Pa&&IE(b.normalMap.format),metalnessMap:nt,roughnessMap:ct,anisotropy:N,anisotropyMap:X,clearcoat:Rt,clearcoatMap:j,clearcoatNormalMap:ge,clearcoatRoughnessMap:ve,dispersion:mt,iridescence:D,iridescenceMap:ee,iridescenceThicknessMap:oe,sheen:A,sheenColorMap:Re,sheenRoughnessMap:Oe,specularMap:Ce,specularColorMap:Ae,specularIntensityMap:Ze,transmission:V,transmissionMap:et,thicknessMap:ht,gradientMap:U,opaque:b.transparent===!1&&b.blending===es&&b.alphaToCoverage===!1,alphaMap:pe,alphaTest:te,alphaHash:Te,combine:b.combine,mapUv:Ge&&g(b.map.channel),aoMapUv:he&&g(b.aoMap.channel),lightMapUv:le&&g(b.lightMap.channel),bumpMapUv:Se&&g(b.bumpMap.channel),normalMapUv:we&&g(b.normalMap.channel),displacementMapUv:Je&&g(b.displacementMap.channel),emissiveMapUv:Ve&&g(b.emissiveMap.channel),metalnessMapUv:nt&&g(b.metalnessMap.channel),roughnessMapUv:ct&&g(b.roughnessMap.channel),anisotropyMapUv:X&&g(b.anisotropyMap.channel),clearcoatMapUv:j&&g(b.clearcoatMap.channel),clearcoatNormalMapUv:ge&&g(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ve&&g(b.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&g(b.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&g(b.iridescenceThicknessMap.channel),sheenColorMapUv:Re&&g(b.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&g(b.sheenRoughnessMap.channel),specularMapUv:Ce&&g(b.specularMap.channel),specularColorMapUv:Ae&&g(b.specularColorMap.channel),specularIntensityMapUv:Ze&&g(b.specularIntensityMap.channel),transmissionMapUv:et&&g(b.transmissionMap.channel),thicknessMapUv:ht&&g(b.thicknessMap.channel),alphaMapUv:pe&&g(b.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(we||N),vertexNormals:!!F.attributes.normal,vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!F.attributes.uv&&(Ge||pe),fog:!!B,useFog:b.fog===!0,fogExp2:!!B&&B.isFogExp2,flatShading:b.wireframe===!1&&(b.flatShading===!0||F.attributes.normal===void 0&&we===!1&&(b.isMeshLambertMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isMeshPhysicalMaterial)),sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:_e,skinning:L.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:me,morphTextureStride:Ke,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numLightProbes:R.numLightProbes,numLightProbeGrids:H.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:b.dithering,shadowMapEnabled:s.shadowMap.enabled&&P.length>0,shadowMapType:s.shadowMap.type,toneMapping:ce,decodeVideoTexture:Ge&&b.map.isVideoTexture===!0&&Mt.getTransfer(b.map.colorSpace)===At,decodeVideoTextureEmissive:Ve&&b.emissiveMap.isVideoTexture===!0&&Mt.getTransfer(b.emissiveMap.colorSpace)===At,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===bt,flipSided:b.side===fn,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Ie&&b.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ie&&b.extensions.multiDraw===!0||Ee)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return ze.vertexUv1s=l.has(1),ze.vertexUv2s=l.has(2),ze.vertexUv3s=l.has(3),l.clear(),ze}function p(b){let R=[];if(b.shaderID?R.push(b.shaderID):(R.push(b.customVertexShaderID),R.push(b.customFragmentShaderID)),b.defines!==void 0)for(let P in b.defines)R.push(P),R.push(b.defines[P]);return b.isRawShaderMaterial===!1&&(m(R,b),y(R,b),R.push(s.outputColorSpace)),R.push(b.customProgramCacheKey),R.join()}function m(b,R){b.push(R.precision),b.push(R.outputColorSpace),b.push(R.envMapMode),b.push(R.envMapCubeUVHeight),b.push(R.mapUv),b.push(R.alphaMapUv),b.push(R.lightMapUv),b.push(R.aoMapUv),b.push(R.bumpMapUv),b.push(R.normalMapUv),b.push(R.displacementMapUv),b.push(R.emissiveMapUv),b.push(R.metalnessMapUv),b.push(R.roughnessMapUv),b.push(R.anisotropyMapUv),b.push(R.clearcoatMapUv),b.push(R.clearcoatNormalMapUv),b.push(R.clearcoatRoughnessMapUv),b.push(R.iridescenceMapUv),b.push(R.iridescenceThicknessMapUv),b.push(R.sheenColorMapUv),b.push(R.sheenRoughnessMapUv),b.push(R.specularMapUv),b.push(R.specularColorMapUv),b.push(R.specularIntensityMapUv),b.push(R.transmissionMapUv),b.push(R.thicknessMapUv),b.push(R.combine),b.push(R.fogExp2),b.push(R.sizeAttenuation),b.push(R.morphTargetsCount),b.push(R.morphAttributeCount),b.push(R.numDirLights),b.push(R.numPointLights),b.push(R.numSpotLights),b.push(R.numSpotLightMaps),b.push(R.numHemiLights),b.push(R.numRectAreaLights),b.push(R.numDirLightShadows),b.push(R.numPointLightShadows),b.push(R.numSpotLightShadows),b.push(R.numSpotLightShadowsWithMaps),b.push(R.numLightProbes),b.push(R.shadowMapType),b.push(R.toneMapping),b.push(R.numClippingPlanes),b.push(R.numClipIntersection),b.push(R.depthPacking)}function y(b,R){o.disableAll(),R.instancing&&o.enable(0),R.instancingColor&&o.enable(1),R.instancingMorph&&o.enable(2),R.matcap&&o.enable(3),R.envMap&&o.enable(4),R.normalMapObjectSpace&&o.enable(5),R.normalMapTangentSpace&&o.enable(6),R.clearcoat&&o.enable(7),R.iridescence&&o.enable(8),R.alphaTest&&o.enable(9),R.vertexColors&&o.enable(10),R.vertexAlphas&&o.enable(11),R.vertexUv1s&&o.enable(12),R.vertexUv2s&&o.enable(13),R.vertexUv3s&&o.enable(14),R.vertexTangents&&o.enable(15),R.anisotropy&&o.enable(16),R.alphaHash&&o.enable(17),R.batching&&o.enable(18),R.dispersion&&o.enable(19),R.batchingColor&&o.enable(20),R.gradientMap&&o.enable(21),R.packedNormalMap&&o.enable(22),R.vertexNormals&&o.enable(23),b.push(o.mask),o.disableAll(),R.fog&&o.enable(0),R.useFog&&o.enable(1),R.flatShading&&o.enable(2),R.logarithmicDepthBuffer&&o.enable(3),R.reversedDepthBuffer&&o.enable(4),R.skinning&&o.enable(5),R.morphTargets&&o.enable(6),R.morphNormals&&o.enable(7),R.morphColors&&o.enable(8),R.premultipliedAlpha&&o.enable(9),R.shadowMapEnabled&&o.enable(10),R.doubleSided&&o.enable(11),R.flipSided&&o.enable(12),R.useDepthPacking&&o.enable(13),R.dithering&&o.enable(14),R.transmission&&o.enable(15),R.sheen&&o.enable(16),R.opaque&&o.enable(17),R.pointsUvs&&o.enable(18),R.decodeVideoTexture&&o.enable(19),R.decodeVideoTextureEmissive&&o.enable(20),R.alphaToCoverage&&o.enable(21),R.numLightProbeGrids>0&&o.enable(22),R.hasPositionAttribute&&o.enable(23),b.push(o.mask)}function _(b){let R=f[b.type],P;if(R){let k=Ui[R];P=is.clone(k.uniforms)}else P=b.uniforms;return P}function x(b,R){let P=h.get(R);return P!==void 0?++P.usedTimes:(P=new AE(s,R,b,i),c.push(P),h.set(R,P)),P}function S(b){if(--b.usedTimes===0){let R=c.indexOf(b);c[R]=c[c.length-1],c.pop(),h.delete(b.cacheKey),b.destroy()}}function M(b){a.remove(b)}function w(){a.dispose()}return{getParameters:v,getProgramCacheKey:p,getUniforms:_,acquireProgram:x,releaseProgram:S,releaseShaderCache:M,programs:c,dispose:w}}function kE(){let s=new WeakMap;function e(o){return s.has(o)}function t(o){let a=s.get(o);return a===void 0&&(a={},s.set(o,a)),a}function n(o){s.delete(o)}function i(o,a,l){s.get(o)[a]=l}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function DE(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.materialVariant!==e.materialVariant?s.materialVariant-e.materialVariant:s.z!==e.z?s.z-e.z:s.id-e.id}function Nm(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Um(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function a(d,f,g,v,p,m){let y=s[e];return y===void 0?(y={id:d.id,object:d,geometry:f,material:g,materialVariant:o(d),groupOrder:v,renderOrder:d.renderOrder,z:p,group:m},s[e]=y):(y.id=d.id,y.object=d,y.geometry=f,y.material=g,y.materialVariant=o(d),y.groupOrder=v,y.renderOrder=d.renderOrder,y.z=p,y.group=m),e++,y}function l(d,f,g,v,p,m){let y=a(d,f,g,v,p,m);g.transmission>0?n.push(y):g.transparent===!0?i.push(y):t.push(y)}function c(d,f,g,v,p,m){let y=a(d,f,g,v,p,m);g.transmission>0?n.unshift(y):g.transparent===!0?i.unshift(y):t.unshift(y)}function h(d,f,g){t.length>1&&t.sort(d||DE),n.length>1&&n.sort(f||Nm),i.length>1&&i.sort(f||Nm),g&&(t.reverse(),n.reverse(),i.reverse())}function u(){for(let d=e,f=s.length;d<f;d++){let g=s[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:l,unshift:c,finish:u,sort:h}}function LE(){let s=new WeakMap;function e(n,i){let r=s.get(n),o;return r===void 0?(o=new Um,s.set(n,[o])):i>=r.length?(o=new Um,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function FE(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new ae};break;case"SpotLight":t={position:new C,direction:new C,color:new ae,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new ae,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new ae,groundColor:new ae};break;case"RectAreaLight":t={color:new ae,position:new C,halfWidth:new C,halfHeight:new C};break}return s[e.id]=t,t}}}function HE(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new de};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new de};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new de,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var BE=0;function NE(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function UE(s){let e=new FE,t=HE(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new C);let i=new C,r=new xt,o=new xt;function a(c){let h=0,u=0,d=0;for(let R=0;R<9;R++)n.probe[R].set(0,0,0);let f=0,g=0,v=0,p=0,m=0,y=0,_=0,x=0,S=0,M=0,w=0;c.sort(NE);for(let R=0,P=c.length;R<P;R++){let k=c[R],L=k.color,H=k.intensity,B=k.distance,F=null;if(k.shadow&&k.shadow.map&&(k.shadow.map.texture.format===Is?F=k.shadow.map.texture:F=k.shadow.map.depthTexture||k.shadow.map.texture),k.isAmbientLight)h+=L.r*H,u+=L.g*H,d+=L.b*H;else if(k.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(k.sh.coefficients[O],H);w++}else if(k.isDirectionalLight){let O=e.get(k);if(O.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){let z=k.shadow,J=t.get(k);J.shadowIntensity=z.intensity,J.shadowBias=z.bias,J.shadowNormalBias=z.normalBias,J.shadowRadius=z.radius,J.shadowMapSize=z.mapSize,n.directionalShadow[f]=J,n.directionalShadowMap[f]=F,n.directionalShadowMatrix[f]=k.shadow.matrix,y++}n.directional[f]=O,f++}else if(k.isSpotLight){let O=e.get(k);O.position.setFromMatrixPosition(k.matrixWorld),O.color.copy(L).multiplyScalar(H),O.distance=B,O.coneCos=Math.cos(k.angle),O.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),O.decay=k.decay,n.spot[v]=O;let z=k.shadow;if(k.map&&(n.spotLightMap[S]=k.map,S++,z.updateMatrices(k),k.castShadow&&M++),n.spotLightMatrix[v]=z.matrix,k.castShadow){let J=t.get(k);J.shadowIntensity=z.intensity,J.shadowBias=z.bias,J.shadowNormalBias=z.normalBias,J.shadowRadius=z.radius,J.shadowMapSize=z.mapSize,n.spotShadow[v]=J,n.spotShadowMap[v]=F,x++}v++}else if(k.isRectAreaLight){let O=e.get(k);O.color.copy(L).multiplyScalar(H),O.halfWidth.set(k.width*.5,0,0),O.halfHeight.set(0,k.height*.5,0),n.rectArea[p]=O,p++}else if(k.isPointLight){let O=e.get(k);if(O.color.copy(k.color).multiplyScalar(k.intensity),O.distance=k.distance,O.decay=k.decay,k.castShadow){let z=k.shadow,J=t.get(k);J.shadowIntensity=z.intensity,J.shadowBias=z.bias,J.shadowNormalBias=z.normalBias,J.shadowRadius=z.radius,J.shadowMapSize=z.mapSize,J.shadowCameraNear=z.camera.near,J.shadowCameraFar=z.camera.far,n.pointShadow[g]=J,n.pointShadowMap[g]=F,n.pointShadowMatrix[g]=k.shadow.matrix,_++}n.point[g]=O,g++}else if(k.isHemisphereLight){let O=e.get(k);O.skyColor.copy(k.color).multiplyScalar(H),O.groundColor.copy(k.groundColor).multiplyScalar(H),n.hemi[m]=O,m++}}p>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Pe.LTC_FLOAT_1,n.rectAreaLTC2=Pe.LTC_FLOAT_2):(n.rectAreaLTC1=Pe.LTC_HALF_1,n.rectAreaLTC2=Pe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let b=n.hash;(b.directionalLength!==f||b.pointLength!==g||b.spotLength!==v||b.rectAreaLength!==p||b.hemiLength!==m||b.numDirectionalShadows!==y||b.numPointShadows!==_||b.numSpotShadows!==x||b.numSpotMaps!==S||b.numLightProbes!==w)&&(n.directional.length=f,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=m,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=_,n.pointShadowMap.length=_,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=_,n.spotLightMatrix.length=x+S-M,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=M,n.numLightProbes=w,b.directionalLength=f,b.pointLength=g,b.spotLength=v,b.rectAreaLength=p,b.hemiLength=m,b.numDirectionalShadows=y,b.numPointShadows=_,b.numSpotShadows=x,b.numSpotMaps=S,b.numLightProbes=w,n.version=BE++)}function l(c,h){let u=0,d=0,f=0,g=0,v=0,p=h.matrixWorldInverse;for(let m=0,y=c.length;m<y;m++){let _=c[m];if(_.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(p),u++}else if(_.isSpotLight){let x=n.spot[f];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(p),x.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(p),f++}else if(_.isRectAreaLight){let x=n.rectArea[g];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(p),o.identity(),r.copy(_.matrixWorld),r.premultiply(p),o.extractRotation(r),x.halfWidth.set(_.width*.5,0,0),x.halfHeight.set(0,_.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(_.isPointLight){let x=n.point[d];x.position.setFromMatrixPosition(_.matrixWorld),x.position.applyMatrix4(p),d++}else if(_.isHemisphereLight){let x=n.hemi[v];x.direction.setFromMatrixPosition(_.matrixWorld),x.direction.transformDirection(p),v++}}}return{setup:a,setupView:l,state:n}}function Om(s){let e=new UE(s),t=[],n=[],i=[];function r(d){u.camera=d,t.length=0,n.length=0,i.length=0}function o(d){t.push(d)}function a(d){n.push(d)}function l(d){i.push(d)}function c(){e.setup(t)}function h(d){e.setupView(t,d)}let u={lightsArray:t,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:c,setupLightsView:h,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function OE(s){let e=new WeakMap;function t(i,r=0){let o=e.get(i),a;return o===void 0?(a=new Om(s),e.set(i,[a])):r>=o.length?(a=new Om(s),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var zE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,GE=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,VE=[new C(1,0,0),new C(-1,0,0),new C(0,1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1)],WE=[new C(0,-1,0),new C(0,-1,0),new C(0,0,1),new C(0,0,-1),new C(0,-1,0),new C(0,-1,0)],zm=new xt,Da=new C,Id=new C;function qE(s,e,t){let n=new qr,i=new de,r=new de,o=new qt,a=new Zl,l=new $l,c={},h=t.maxTextureSize,u={[gi]:fn,[fn]:gi,[bt]:bt},d=new Ct({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new de},radius:{value:4}},vertexShader:zE,fragmentShader:GE}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let g=new dt;g.setAttribute("position",new ot(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new xe(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ga;let m=this.type;this.render=function(M,w,b){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||M.length===0)return;this.type===hc&&(it("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ga);let R=s.getRenderTarget(),P=s.getActiveCubeFace(),k=s.getActiveMipmapLevel(),L=s.state;L.setBlending(si),L.buffers.depth.getReversed()===!0?L.buffers.color.setClear(0,0,0,0):L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let H=m!==this.type;H&&w.traverse(function(B){B.material&&(Array.isArray(B.material)?B.material.forEach(F=>F.needsUpdate=!0):B.material.needsUpdate=!0)});for(let B=0,F=M.length;B<F;B++){let O=M[B],z=O.shadow;if(z===void 0){it("WebGLShadowMap:",O,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;i.copy(z.mapSize);let J=z.getFrameExtents();i.multiply(J),r.copy(z.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/J.x),i.x=r.x*J.x,z.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/J.y),i.y=r.y*J.y,z.mapSize.y=r.y));let ne=s.state.buffers.depth.getReversed();if(z.camera._reversedDepth=ne,z.map===null||H===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===eo){if(O.isPointLight){it("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new on(i.x,i.y,{format:Is,type:bn,minFilter:rn,magFilter:rn,generateMipmaps:!1}),z.map.texture.name=O.name+".shadowMap",z.map.depthTexture=new ts(i.x,i.y,ri),z.map.depthTexture.name=O.name+".shadowMapDepth",z.map.depthTexture.format=Di,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=cn,z.map.depthTexture.magFilter=cn}else O.isPointLight?(z.map=new nh(i.x),z.map.depthTexture=new Vl(i.x,yi)):(z.map=new on(i.x,i.y),z.map.depthTexture=new ts(i.x,i.y,yi)),z.map.depthTexture.name=O.name+".shadowMap",z.map.depthTexture.format=Di,this.type===ga?(z.map.depthTexture.compareFunction=ne?Qc:jc,z.map.depthTexture.minFilter=rn,z.map.depthTexture.magFilter=rn):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=cn,z.map.depthTexture.magFilter=cn);z.camera.updateProjectionMatrix()}let ue=z.map.isWebGLCubeRenderTarget?6:1;for(let fe=0;fe<ue;fe++){if(z.map.isWebGLCubeRenderTarget)s.setRenderTarget(z.map,fe),s.clear();else{fe===0&&(s.setRenderTarget(z.map),s.clear());let me=z.getViewport(fe);o.set(r.x*me.x,r.y*me.y,r.x*me.z,r.y*me.w),L.viewport(o)}if(O.isPointLight){let me=z.camera,Ke=z.matrix,Le=O.distance||me.far;Le!==me.far&&(me.far=Le,me.updateProjectionMatrix()),Da.setFromMatrixPosition(O.matrixWorld),me.position.copy(Da),Id.copy(me.position),Id.add(VE[fe]),me.up.copy(WE[fe]),me.lookAt(Id),me.updateMatrixWorld(),Ke.makeTranslation(-Da.x,-Da.y,-Da.z),zm.multiplyMatrices(me.projectionMatrix,me.matrixWorldInverse),z._frustum.setFromProjectionMatrix(zm,me.coordinateSystem,me.reversedDepth)}else z.updateMatrices(O);n=z.getFrustum(),x(w,b,z.camera,O,this.type)}z.isPointLightShadow!==!0&&this.type===eo&&y(z,b),z.needsUpdate=!1}m=this.type,p.needsUpdate=!1,s.setRenderTarget(R,P,k)};function y(M,w){let b=e.update(v);d.defines.VSM_SAMPLES!==M.blurSamples&&(d.defines.VSM_SAMPLES=M.blurSamples,f.defines.VSM_SAMPLES=M.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new on(i.x,i.y,{format:Is,type:bn})),d.uniforms.shadow_pass.value=M.map.depthTexture,d.uniforms.resolution.value=M.mapSize,d.uniforms.radius.value=M.radius,s.setRenderTarget(M.mapPass),s.clear(),s.renderBufferDirect(w,null,b,d,v,null),f.uniforms.shadow_pass.value=M.mapPass.texture,f.uniforms.resolution.value=M.mapSize,f.uniforms.radius.value=M.radius,s.setRenderTarget(M.map),s.clear(),s.renderBufferDirect(w,null,b,f,v,null)}function _(M,w,b,R){let P=null,k=b.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(k!==void 0)P=k;else if(P=b.isPointLight===!0?l:a,s.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){let L=P.uuid,H=w.uuid,B=c[L];B===void 0&&(B={},c[L]=B);let F=B[H];F===void 0&&(F=P.clone(),B[H]=F,w.addEventListener("dispose",S)),P=F}if(P.visible=w.visible,P.wireframe=w.wireframe,R===eo?P.side=w.shadowSide!==null?w.shadowSide:w.side:P.side=w.shadowSide!==null?w.shadowSide:u[w.side],P.alphaMap=w.alphaMap,P.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,P.map=w.map,P.clipShadows=w.clipShadows,P.clippingPlanes=w.clippingPlanes,P.clipIntersection=w.clipIntersection,P.displacementMap=w.displacementMap,P.displacementScale=w.displacementScale,P.displacementBias=w.displacementBias,P.wireframeLinewidth=w.wireframeLinewidth,P.linewidth=w.linewidth,b.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let L=s.properties.get(P);L.light=b}return P}function x(M,w,b,R,P){if(M.visible===!1)return;if(M.layers.test(w.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&P===eo)&&(!M.frustumCulled||n.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,M.matrixWorld);let H=e.update(M),B=M.material;if(Array.isArray(B)){let F=H.groups;for(let O=0,z=F.length;O<z;O++){let J=F[O],ne=B[J.materialIndex];if(ne&&ne.visible){let ue=_(M,ne,R,P);M.onBeforeShadow(s,M,w,b,H,ue,J),s.renderBufferDirect(b,null,H,ue,M,J),M.onAfterShadow(s,M,w,b,H,ue,J)}}}else if(B.visible){let F=_(M,B,R,P);M.onBeforeShadow(s,M,w,b,H,F,null),s.renderBufferDirect(b,null,H,F,M,null),M.onAfterShadow(s,M,w,b,H,F,null)}}let L=M.children;for(let H=0,B=L.length;H<B;H++)x(L[H],w,b,R,P)}function S(M){M.target.removeEventListener("dispose",S);for(let b in c){let R=c[b],P=M.target.uuid;P in R&&(R[P].dispose(),delete R[P])}}}function XE(s,e){function t(){let U=!1,pe=new qt,te=null,Te=new qt(0,0,0,0);return{setMask:function(Ie){te!==Ie&&!U&&(s.colorMask(Ie,Ie,Ie,Ie),te=Ie)},setLocked:function(Ie){U=Ie},setClear:function(Ie,ce,ze,Be,$t){$t===!0&&(Ie*=Be,ce*=Be,ze*=Be),pe.set(Ie,ce,ze,Be),Te.equals(pe)===!1&&(s.clearColor(Ie,ce,ze,Be),Te.copy(pe))},reset:function(){U=!1,te=null,Te.set(-1,0,0,0)}}}function n(){let U=!1,pe=!1,te=null,Te=null,Ie=null;return{setReversed:function(ce){if(pe!==ce){let ze=e.get("EXT_clip_control");ce?ze.clipControlEXT(ze.LOWER_LEFT_EXT,ze.ZERO_TO_ONE_EXT):ze.clipControlEXT(ze.LOWER_LEFT_EXT,ze.NEGATIVE_ONE_TO_ONE_EXT),pe=ce;let Be=Ie;Ie=null,this.setClear(Be)}},getReversed:function(){return pe},setTest:function(ce){ce?ie(s.DEPTH_TEST):_e(s.DEPTH_TEST)},setMask:function(ce){te!==ce&&!U&&(s.depthMask(ce),te=ce)},setFunc:function(ce){if(pe&&(ce=fm[ce]),Te!==ce){switch(ce){case Pl:s.depthFunc(s.NEVER);break;case kl:s.depthFunc(s.ALWAYS);break;case Dl:s.depthFunc(s.LESS);break;case tr:s.depthFunc(s.LEQUAL);break;case Ll:s.depthFunc(s.EQUAL);break;case Fl:s.depthFunc(s.GEQUAL);break;case Hl:s.depthFunc(s.GREATER);break;case Bl:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}Te=ce}},setLocked:function(ce){U=ce},setClear:function(ce){Ie!==ce&&(Ie=ce,pe&&(ce=1-ce),s.clearDepth(ce))},reset:function(){U=!1,te=null,Te=null,Ie=null,pe=!1}}}function i(){let U=!1,pe=null,te=null,Te=null,Ie=null,ce=null,ze=null,Be=null,$t=null;return{setTest:function(Ot){U||(Ot?ie(s.STENCIL_TEST):_e(s.STENCIL_TEST))},setMask:function(Ot){pe!==Ot&&!U&&(s.stencilMask(Ot),pe=Ot)},setFunc:function(Ot,Ri,Ai){(te!==Ot||Te!==Ri||Ie!==Ai)&&(s.stencilFunc(Ot,Ri,Ai),te=Ot,Te=Ri,Ie=Ai)},setOp:function(Ot,Ri,Ai){(ce!==Ot||ze!==Ri||Be!==Ai)&&(s.stencilOp(Ot,Ri,Ai),ce=Ot,ze=Ri,Be=Ai)},setLocked:function(Ot){U=Ot},setClear:function(Ot){$t!==Ot&&(s.clearStencil(Ot),$t=Ot)},reset:function(){U=!1,pe=null,te=null,Te=null,Ie=null,ce=null,ze=null,Be=null,$t=null}}}let r=new t,o=new n,a=new i,l=new WeakMap,c=new WeakMap,h={},u={},d={},f=new WeakMap,g=[],v=null,p=!1,m=null,y=null,_=null,x=null,S=null,M=null,w=null,b=new ae(0,0,0),R=0,P=!1,k=null,L=null,H=null,B=null,F=null,O=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,J=0,ne=s.getParameter(s.VERSION);ne.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(ne)[1]),z=J>=1):ne.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),z=J>=2);let ue=null,fe={},me=s.getParameter(s.SCISSOR_BOX),Ke=s.getParameter(s.VIEWPORT),Le=new qt().fromArray(me),ye=new qt().fromArray(Ke);function W(U,pe,te,Te){let Ie=new Uint8Array(4),ce=s.createTexture();s.bindTexture(U,ce),s.texParameteri(U,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(U,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let ze=0;ze<te;ze++)U===s.TEXTURE_3D||U===s.TEXTURE_2D_ARRAY?s.texImage3D(pe,0,s.RGBA,1,1,Te,0,s.RGBA,s.UNSIGNED_BYTE,Ie):s.texImage2D(pe+ze,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,Ie);return ce}let se={};se[s.TEXTURE_2D]=W(s.TEXTURE_2D,s.TEXTURE_2D,1),se[s.TEXTURE_CUBE_MAP]=W(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),se[s.TEXTURE_2D_ARRAY]=W(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),se[s.TEXTURE_3D]=W(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ie(s.DEPTH_TEST),o.setFunc(tr),Se(!1),we(td),ie(s.CULL_FACE),he(si);function ie(U){h[U]!==!0&&(s.enable(U),h[U]=!0)}function _e(U){h[U]!==!1&&(s.disable(U),h[U]=!1)}function Me(U,pe){return d[U]!==pe?(s.bindFramebuffer(U,pe),d[U]=pe,U===s.DRAW_FRAMEBUFFER&&(d[s.FRAMEBUFFER]=pe),U===s.FRAMEBUFFER&&(d[s.DRAW_FRAMEBUFFER]=pe),!0):!1}function Ee(U,pe){let te=g,Te=!1;if(U){te=f.get(pe),te===void 0&&(te=[],f.set(pe,te));let Ie=U.textures;if(te.length!==Ie.length||te[0]!==s.COLOR_ATTACHMENT0){for(let ce=0,ze=Ie.length;ce<ze;ce++)te[ce]=s.COLOR_ATTACHMENT0+ce;te.length=Ie.length,Te=!0}}else te[0]!==s.BACK&&(te[0]=s.BACK,Te=!0);Te&&s.drawBuffers(te)}function Ge(U){return v!==U?(s.useProgram(U),v=U,!0):!1}let Fe={[ys]:s.FUNC_ADD,[Hp]:s.FUNC_SUBTRACT,[Bp]:s.FUNC_REVERSE_SUBTRACT};Fe[Np]=s.MIN,Fe[Up]=s.MAX;let re={[Op]:s.ZERO,[zp]:s.ONE,[Gp]:s.SRC_COLOR,[Cl]:s.SRC_ALPHA,[Kp]:s.SRC_ALPHA_SATURATE,[Xp]:s.DST_COLOR,[Wp]:s.DST_ALPHA,[Vp]:s.ONE_MINUS_SRC_COLOR,[Il]:s.ONE_MINUS_SRC_ALPHA,[Yp]:s.ONE_MINUS_DST_COLOR,[qp]:s.ONE_MINUS_DST_ALPHA,[Zp]:s.CONSTANT_COLOR,[$p]:s.ONE_MINUS_CONSTANT_COLOR,[Jp]:s.CONSTANT_ALPHA,[jp]:s.ONE_MINUS_CONSTANT_ALPHA};function he(U,pe,te,Te,Ie,ce,ze,Be,$t,Ot){if(U===si){p===!0&&(_e(s.BLEND),p=!1);return}if(p===!1&&(ie(s.BLEND),p=!0),U!==Fp){if(U!==m||Ot!==P){if((y!==ys||S!==ys)&&(s.blendEquation(s.FUNC_ADD),y=ys,S=ys),Ot)switch(U){case es:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case An:s.blendFunc(s.ONE,s.ONE);break;case nd:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case id:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:lt("WebGLState: Invalid blending: ",U);break}else switch(U){case es:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case An:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case nd:lt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case id:lt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:lt("WebGLState: Invalid blending: ",U);break}_=null,x=null,M=null,w=null,b.set(0,0,0),R=0,m=U,P=Ot}return}Ie=Ie||pe,ce=ce||te,ze=ze||Te,(pe!==y||Ie!==S)&&(s.blendEquationSeparate(Fe[pe],Fe[Ie]),y=pe,S=Ie),(te!==_||Te!==x||ce!==M||ze!==w)&&(s.blendFuncSeparate(re[te],re[Te],re[ce],re[ze]),_=te,x=Te,M=ce,w=ze),(Be.equals(b)===!1||$t!==R)&&(s.blendColor(Be.r,Be.g,Be.b,$t),b.copy(Be),R=$t),m=U,P=!1}function le(U,pe){U.side===bt?_e(s.CULL_FACE):ie(s.CULL_FACE);let te=U.side===fn;pe&&(te=!te),Se(te),U.blending===es&&U.transparent===!1?he(si):he(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let Te=U.stencilWrite;a.setTest(Te),Te&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),Ve(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?ie(s.SAMPLE_ALPHA_TO_COVERAGE):_e(s.SAMPLE_ALPHA_TO_COVERAGE)}function Se(U){k!==U&&(U?s.frontFace(s.CW):s.frontFace(s.CCW),k=U)}function we(U){U!==Dp?(ie(s.CULL_FACE),U!==L&&(U===td?s.cullFace(s.BACK):U===Lp?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):_e(s.CULL_FACE),L=U}function Je(U){U!==H&&(z&&s.lineWidth(U),H=U)}function Ve(U,pe,te){U?(ie(s.POLYGON_OFFSET_FILL),(B!==pe||F!==te)&&(B=pe,F=te,o.getReversed()&&(pe=-pe),s.polygonOffset(pe,te))):_e(s.POLYGON_OFFSET_FILL)}function nt(U){U?ie(s.SCISSOR_TEST):_e(s.SCISSOR_TEST)}function ct(U){U===void 0&&(U=s.TEXTURE0+O-1),ue!==U&&(s.activeTexture(U),ue=U)}function N(U,pe,te){te===void 0&&(ue===null?te=s.TEXTURE0+O-1:te=ue);let Te=fe[te];Te===void 0&&(Te={type:void 0,texture:void 0},fe[te]=Te),(Te.type!==U||Te.texture!==pe)&&(ue!==te&&(s.activeTexture(te),ue=te),s.bindTexture(U,pe||se[U]),Te.type=U,Te.texture=pe)}function Rt(){let U=fe[ue];U!==void 0&&U.type!==void 0&&(s.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function mt(){try{s.compressedTexImage2D(...arguments)}catch(U){lt("WebGLState:",U)}}function D(){try{s.compressedTexImage3D(...arguments)}catch(U){lt("WebGLState:",U)}}function A(){try{s.texSubImage2D(...arguments)}catch(U){lt("WebGLState:",U)}}function V(){try{s.texSubImage3D(...arguments)}catch(U){lt("WebGLState:",U)}}function X(){try{s.compressedTexSubImage2D(...arguments)}catch(U){lt("WebGLState:",U)}}function j(){try{s.compressedTexSubImage3D(...arguments)}catch(U){lt("WebGLState:",U)}}function ge(){try{s.texStorage2D(...arguments)}catch(U){lt("WebGLState:",U)}}function ve(){try{s.texStorage3D(...arguments)}catch(U){lt("WebGLState:",U)}}function ee(){try{s.texImage2D(...arguments)}catch(U){lt("WebGLState:",U)}}function oe(){try{s.texImage3D(...arguments)}catch(U){lt("WebGLState:",U)}}function Re(U){return u[U]!==void 0?u[U]:s.getParameter(U)}function Oe(U,pe){u[U]!==pe&&(s.pixelStorei(U,pe),u[U]=pe)}function Ce(U){Le.equals(U)===!1&&(s.scissor(U.x,U.y,U.z,U.w),Le.copy(U))}function Ae(U){ye.equals(U)===!1&&(s.viewport(U.x,U.y,U.z,U.w),ye.copy(U))}function Ze(U,pe){let te=c.get(pe);te===void 0&&(te=new WeakMap,c.set(pe,te));let Te=te.get(U);Te===void 0&&(Te=s.getUniformBlockIndex(pe,U.name),te.set(U,Te))}function et(U,pe){let Te=c.get(pe).get(U);l.get(pe)!==Te&&(s.uniformBlockBinding(pe,Te,U.__bindingPointIndex),l.set(pe,Te))}function ht(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),o.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),h={},u={},ue=null,fe={},d={},f=new WeakMap,g=[],v=null,p=!1,m=null,y=null,_=null,x=null,S=null,M=null,w=null,b=new ae(0,0,0),R=0,P=!1,k=null,L=null,H=null,B=null,F=null,Le.set(0,0,s.canvas.width,s.canvas.height),ye.set(0,0,s.canvas.width,s.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ie,disable:_e,bindFramebuffer:Me,drawBuffers:Ee,useProgram:Ge,setBlending:he,setMaterial:le,setFlipSided:Se,setCullFace:we,setLineWidth:Je,setPolygonOffset:Ve,setScissorTest:nt,activeTexture:ct,bindTexture:N,unbindTexture:Rt,compressedTexImage2D:mt,compressedTexImage3D:D,texImage2D:ee,texImage3D:oe,pixelStorei:Oe,getParameter:Re,updateUBOMapping:Ze,uniformBlockBinding:et,texStorage2D:ge,texStorage3D:ve,texSubImage2D:A,texSubImage3D:V,compressedTexSubImage2D:X,compressedTexSubImage3D:j,scissor:Ce,viewport:Ae,reset:ht}}function YE(s,e,t,n,i,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new de,h=new WeakMap,u=new Set,d,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(D,A){return g?new OffscreenCanvas(D,A):Vo("canvas")}function p(D,A,V){let X=1,j=mt(D);if((j.width>V||j.height>V)&&(X=V/Math.max(j.width,j.height)),X<1)if(typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&D instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&D instanceof ImageBitmap||typeof VideoFrame<"u"&&D instanceof VideoFrame){let ge=Math.floor(X*j.width),ve=Math.floor(X*j.height);d===void 0&&(d=v(ge,ve));let ee=A?v(ge,ve):d;return ee.width=ge,ee.height=ve,ee.getContext("2d").drawImage(D,0,0,ge,ve),it("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+ge+"x"+ve+")."),ee}else return"data"in D&&it("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),D;return D}function m(D){return D.generateMipmaps}function y(D){s.generateMipmap(D)}function _(D){return D.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:D.isWebGL3DRenderTarget?s.TEXTURE_3D:D.isWebGLArrayRenderTarget||D.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function x(D,A,V,X,j,ge=!1){if(D!==null){if(s[D]!==void 0)return s[D];it("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+D+"'")}let ve;X&&(ve=e.get("EXT_texture_norm16"),ve||it("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ee=A;if(A===s.RED&&(V===s.FLOAT&&(ee=s.R32F),V===s.HALF_FLOAT&&(ee=s.R16F),V===s.UNSIGNED_BYTE&&(ee=s.R8),V===s.UNSIGNED_SHORT&&ve&&(ee=ve.R16_EXT),V===s.SHORT&&ve&&(ee=ve.R16_SNORM_EXT)),A===s.RED_INTEGER&&(V===s.UNSIGNED_BYTE&&(ee=s.R8UI),V===s.UNSIGNED_SHORT&&(ee=s.R16UI),V===s.UNSIGNED_INT&&(ee=s.R32UI),V===s.BYTE&&(ee=s.R8I),V===s.SHORT&&(ee=s.R16I),V===s.INT&&(ee=s.R32I)),A===s.RG&&(V===s.FLOAT&&(ee=s.RG32F),V===s.HALF_FLOAT&&(ee=s.RG16F),V===s.UNSIGNED_BYTE&&(ee=s.RG8),V===s.UNSIGNED_SHORT&&ve&&(ee=ve.RG16_EXT),V===s.SHORT&&ve&&(ee=ve.RG16_SNORM_EXT)),A===s.RG_INTEGER&&(V===s.UNSIGNED_BYTE&&(ee=s.RG8UI),V===s.UNSIGNED_SHORT&&(ee=s.RG16UI),V===s.UNSIGNED_INT&&(ee=s.RG32UI),V===s.BYTE&&(ee=s.RG8I),V===s.SHORT&&(ee=s.RG16I),V===s.INT&&(ee=s.RG32I)),A===s.RGB_INTEGER&&(V===s.UNSIGNED_BYTE&&(ee=s.RGB8UI),V===s.UNSIGNED_SHORT&&(ee=s.RGB16UI),V===s.UNSIGNED_INT&&(ee=s.RGB32UI),V===s.BYTE&&(ee=s.RGB8I),V===s.SHORT&&(ee=s.RGB16I),V===s.INT&&(ee=s.RGB32I)),A===s.RGBA_INTEGER&&(V===s.UNSIGNED_BYTE&&(ee=s.RGBA8UI),V===s.UNSIGNED_SHORT&&(ee=s.RGBA16UI),V===s.UNSIGNED_INT&&(ee=s.RGBA32UI),V===s.BYTE&&(ee=s.RGBA8I),V===s.SHORT&&(ee=s.RGBA16I),V===s.INT&&(ee=s.RGBA32I)),A===s.RGB&&(V===s.UNSIGNED_SHORT&&ve&&(ee=ve.RGB16_EXT),V===s.SHORT&&ve&&(ee=ve.RGB16_SNORM_EXT),V===s.UNSIGNED_INT_5_9_9_9_REV&&(ee=s.RGB9_E5),V===s.UNSIGNED_INT_10F_11F_11F_REV&&(ee=s.R11F_G11F_B10F)),A===s.RGBA){let oe=ge?Go:Mt.getTransfer(j);V===s.FLOAT&&(ee=s.RGBA32F),V===s.HALF_FLOAT&&(ee=s.RGBA16F),V===s.UNSIGNED_BYTE&&(ee=oe===At?s.SRGB8_ALPHA8:s.RGBA8),V===s.UNSIGNED_SHORT&&ve&&(ee=ve.RGBA16_EXT),V===s.SHORT&&ve&&(ee=ve.RGBA16_SNORM_EXT),V===s.UNSIGNED_SHORT_4_4_4_4&&(ee=s.RGBA4),V===s.UNSIGNED_SHORT_5_5_5_1&&(ee=s.RGB5_A1)}return(ee===s.R16F||ee===s.R32F||ee===s.RG16F||ee===s.RG32F||ee===s.RGBA16F||ee===s.RGBA32F)&&e.get("EXT_color_buffer_float"),ee}function S(D,A){let V;return D?A===null||A===yi||A===no?V=s.DEPTH24_STENCIL8:A===ri?V=s.DEPTH32F_STENCIL8:A===to&&(V=s.DEPTH24_STENCIL8,it("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):A===null||A===yi||A===no?V=s.DEPTH_COMPONENT24:A===ri?V=s.DEPTH_COMPONENT32F:A===to&&(V=s.DEPTH_COMPONENT16),V}function M(D,A){return m(D)===!0||D.isFramebufferTexture&&D.minFilter!==cn&&D.minFilter!==rn?Math.log2(Math.max(A.width,A.height))+1:D.mipmaps!==void 0&&D.mipmaps.length>0?D.mipmaps.length:D.isCompressedTexture&&Array.isArray(D.image)?A.mipmaps.length:1}function w(D){let A=D.target;A.removeEventListener("dispose",w),R(A),A.isVideoTexture&&h.delete(A),A.isHTMLTexture&&u.delete(A)}function b(D){let A=D.target;A.removeEventListener("dispose",b),k(A)}function R(D){let A=n.get(D);if(A.__webglInit===void 0)return;let V=D.source,X=f.get(V);if(X){let j=X[A.__cacheKey];j.usedTimes--,j.usedTimes===0&&P(D),Object.keys(X).length===0&&f.delete(V)}n.remove(D)}function P(D){let A=n.get(D);s.deleteTexture(A.__webglTexture);let V=D.source,X=f.get(V);delete X[A.__cacheKey],o.memory.textures--}function k(D){let A=n.get(D);if(D.depthTexture&&(D.depthTexture.dispose(),n.remove(D.depthTexture)),D.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(A.__webglFramebuffer[X]))for(let j=0;j<A.__webglFramebuffer[X].length;j++)s.deleteFramebuffer(A.__webglFramebuffer[X][j]);else s.deleteFramebuffer(A.__webglFramebuffer[X]);A.__webglDepthbuffer&&s.deleteRenderbuffer(A.__webglDepthbuffer[X])}else{if(Array.isArray(A.__webglFramebuffer))for(let X=0;X<A.__webglFramebuffer.length;X++)s.deleteFramebuffer(A.__webglFramebuffer[X]);else s.deleteFramebuffer(A.__webglFramebuffer);if(A.__webglDepthbuffer&&s.deleteRenderbuffer(A.__webglDepthbuffer),A.__webglMultisampledFramebuffer&&s.deleteFramebuffer(A.__webglMultisampledFramebuffer),A.__webglColorRenderbuffer)for(let X=0;X<A.__webglColorRenderbuffer.length;X++)A.__webglColorRenderbuffer[X]&&s.deleteRenderbuffer(A.__webglColorRenderbuffer[X]);A.__webglDepthRenderbuffer&&s.deleteRenderbuffer(A.__webglDepthRenderbuffer)}let V=D.textures;for(let X=0,j=V.length;X<j;X++){let ge=n.get(V[X]);ge.__webglTexture&&(s.deleteTexture(ge.__webglTexture),o.memory.textures--),n.remove(V[X])}n.remove(D)}let L=0;function H(){L=0}function B(){return L}function F(D){L=D}function O(){let D=L;return D>=i.maxTextures&&it("WebGLTextures: Trying to use "+D+" texture units while this GPU supports only "+i.maxTextures),L+=1,D}function z(D){let A=[];return A.push(D.wrapS),A.push(D.wrapT),A.push(D.wrapR||0),A.push(D.magFilter),A.push(D.minFilter),A.push(D.anisotropy),A.push(D.internalFormat),A.push(D.format),A.push(D.type),A.push(D.generateMipmaps),A.push(D.premultiplyAlpha),A.push(D.flipY),A.push(D.unpackAlignment),A.push(D.colorSpace),A.join()}function J(D,A){let V=n.get(D);if(D.isVideoTexture&&N(D),D.isRenderTargetTexture===!1&&D.isExternalTexture!==!0&&D.version>0&&V.__version!==D.version){let X=D.image;if(X===null)it("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)it("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(V,D,A);return}}else D.isExternalTexture&&(V.__webglTexture=D.sourceTexture?D.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,V.__webglTexture,s.TEXTURE0+A)}function ne(D,A){let V=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&V.__version!==D.version){_e(V,D,A);return}else D.isExternalTexture&&(V.__webglTexture=D.sourceTexture?D.sourceTexture:null);t.bindTexture(s.TEXTURE_2D_ARRAY,V.__webglTexture,s.TEXTURE0+A)}function ue(D,A){let V=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&V.__version!==D.version){_e(V,D,A);return}t.bindTexture(s.TEXTURE_3D,V.__webglTexture,s.TEXTURE0+A)}function fe(D,A){let V=n.get(D);if(D.isCubeDepthTexture!==!0&&D.version>0&&V.__version!==D.version){Me(V,D,A);return}t.bindTexture(s.TEXTURE_CUBE_MAP,V.__webglTexture,s.TEXTURE0+A)}let me={[Kn]:s.REPEAT,[Rn]:s.CLAMP_TO_EDGE,[Nl]:s.MIRRORED_REPEAT},Ke={[cn]:s.NEAREST,[tm]:s.NEAREST_MIPMAP_NEAREST,[Ma]:s.NEAREST_MIPMAP_LINEAR,[rn]:s.LINEAR,[pc]:s.LINEAR_MIPMAP_NEAREST,[zn]:s.LINEAR_MIPMAP_LINEAR},Le={[sm]:s.NEVER,[cm]:s.ALWAYS,[rm]:s.LESS,[jc]:s.LEQUAL,[om]:s.EQUAL,[Qc]:s.GEQUAL,[am]:s.GREATER,[lm]:s.NOTEQUAL};function ye(D,A){if(A.type===ri&&e.has("OES_texture_float_linear")===!1&&(A.magFilter===rn||A.magFilter===pc||A.magFilter===Ma||A.magFilter===zn||A.minFilter===rn||A.minFilter===pc||A.minFilter===Ma||A.minFilter===zn)&&it("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(D,s.TEXTURE_WRAP_S,me[A.wrapS]),s.texParameteri(D,s.TEXTURE_WRAP_T,me[A.wrapT]),(D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY)&&s.texParameteri(D,s.TEXTURE_WRAP_R,me[A.wrapR]),s.texParameteri(D,s.TEXTURE_MAG_FILTER,Ke[A.magFilter]),s.texParameteri(D,s.TEXTURE_MIN_FILTER,Ke[A.minFilter]),A.compareFunction&&(s.texParameteri(D,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(D,s.TEXTURE_COMPARE_FUNC,Le[A.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(A.magFilter===cn||A.minFilter!==Ma&&A.minFilter!==zn||A.type===ri&&e.has("OES_texture_float_linear")===!1)return;if(A.anisotropy>1||n.get(A).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");s.texParameterf(D,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(A.anisotropy,i.getMaxAnisotropy())),n.get(A).__currentAnisotropy=A.anisotropy}}}function W(D,A){let V=!1;D.__webglInit===void 0&&(D.__webglInit=!0,A.addEventListener("dispose",w));let X=A.source,j=f.get(X);j===void 0&&(j={},f.set(X,j));let ge=z(A);if(ge!==D.__cacheKey){j[ge]===void 0&&(j[ge]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,V=!0),j[ge].usedTimes++;let ve=j[D.__cacheKey];ve!==void 0&&(j[D.__cacheKey].usedTimes--,ve.usedTimes===0&&P(A)),D.__cacheKey=ge,D.__webglTexture=j[ge].texture}return V}function se(D,A,V){return Math.floor(Math.floor(D/V)/A)}function ie(D,A,V,X){let ge=D.updateRanges;if(ge.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,A.width,A.height,V,X,A.data);else{ge.sort((Oe,Ce)=>Oe.start-Ce.start);let ve=0;for(let Oe=1;Oe<ge.length;Oe++){let Ce=ge[ve],Ae=ge[Oe],Ze=Ce.start+Ce.count,et=se(Ae.start,A.width,4),ht=se(Ce.start,A.width,4);Ae.start<=Ze+1&&et===ht&&se(Ae.start+Ae.count-1,A.width,4)===et?Ce.count=Math.max(Ce.count,Ae.start+Ae.count-Ce.start):(++ve,ge[ve]=Ae)}ge.length=ve+1;let ee=t.getParameter(s.UNPACK_ROW_LENGTH),oe=t.getParameter(s.UNPACK_SKIP_PIXELS),Re=t.getParameter(s.UNPACK_SKIP_ROWS);t.pixelStorei(s.UNPACK_ROW_LENGTH,A.width);for(let Oe=0,Ce=ge.length;Oe<Ce;Oe++){let Ae=ge[Oe],Ze=Math.floor(Ae.start/4),et=Math.ceil(Ae.count/4),ht=Ze%A.width,U=Math.floor(Ze/A.width),pe=et,te=1;t.pixelStorei(s.UNPACK_SKIP_PIXELS,ht),t.pixelStorei(s.UNPACK_SKIP_ROWS,U),t.texSubImage2D(s.TEXTURE_2D,0,ht,U,pe,te,V,X,A.data)}D.clearUpdateRanges(),t.pixelStorei(s.UNPACK_ROW_LENGTH,ee),t.pixelStorei(s.UNPACK_SKIP_PIXELS,oe),t.pixelStorei(s.UNPACK_SKIP_ROWS,Re)}}function _e(D,A,V){let X=s.TEXTURE_2D;(A.isDataArrayTexture||A.isCompressedArrayTexture)&&(X=s.TEXTURE_2D_ARRAY),A.isData3DTexture&&(X=s.TEXTURE_3D);let j=W(D,A),ge=A.source;t.bindTexture(X,D.__webglTexture,s.TEXTURE0+V);let ve=n.get(ge);if(ge.version!==ve.__version||j===!0){if(t.activeTexture(s.TEXTURE0+V),(typeof ImageBitmap<"u"&&A.image instanceof ImageBitmap)===!1){let te=Mt.getPrimaries(Mt.workingColorSpace),Te=A.colorSpace===_i?null:Mt.getPrimaries(A.colorSpace),Ie=A.colorSpace===_i||te===Te?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,A.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ie)}t.pixelStorei(s.UNPACK_ALIGNMENT,A.unpackAlignment);let oe=p(A.image,!1,i.maxTextureSize);oe=Rt(A,oe);let Re=r.convert(A.format,A.colorSpace),Oe=r.convert(A.type),Ce=x(A.internalFormat,Re,Oe,A.normalized,A.colorSpace,A.isVideoTexture);ye(X,A);let Ae,Ze=A.mipmaps,et=A.isVideoTexture!==!0,ht=ve.__version===void 0||j===!0,U=ge.dataReady,pe=M(A,oe);if(A.isDepthTexture)Ce=S(A.format===Cs,A.type),ht&&(et?t.texStorage2D(s.TEXTURE_2D,1,Ce,oe.width,oe.height):t.texImage2D(s.TEXTURE_2D,0,Ce,oe.width,oe.height,0,Re,Oe,null));else if(A.isDataTexture)if(Ze.length>0){et&&ht&&t.texStorage2D(s.TEXTURE_2D,pe,Ce,Ze[0].width,Ze[0].height);for(let te=0,Te=Ze.length;te<Te;te++)Ae=Ze[te],et?U&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,Ae.width,Ae.height,Re,Oe,Ae.data):t.texImage2D(s.TEXTURE_2D,te,Ce,Ae.width,Ae.height,0,Re,Oe,Ae.data);A.generateMipmaps=!1}else et?(ht&&t.texStorage2D(s.TEXTURE_2D,pe,Ce,oe.width,oe.height),U&&ie(A,oe,Re,Oe)):t.texImage2D(s.TEXTURE_2D,0,Ce,oe.width,oe.height,0,Re,Oe,oe.data);else if(A.isCompressedTexture)if(A.isCompressedArrayTexture){et&&ht&&t.texStorage3D(s.TEXTURE_2D_ARRAY,pe,Ce,Ze[0].width,Ze[0].height,oe.depth);for(let te=0,Te=Ze.length;te<Te;te++)if(Ae=Ze[te],A.format!==oi)if(Re!==null)if(et){if(U)if(A.layerUpdates.size>0){let Ie=bd(Ae.width,Ae.height,A.format,A.type);for(let ce of A.layerUpdates){let ze=Ae.data.subarray(ce*Ie/Ae.data.BYTES_PER_ELEMENT,(ce+1)*Ie/Ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,ce,Ae.width,Ae.height,1,Re,ze)}A.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,Ae.width,Ae.height,oe.depth,Re,Ae.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,te,Ce,Ae.width,Ae.height,oe.depth,0,Ae.data,0,0);else it("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else et?U&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,Ae.width,Ae.height,oe.depth,Re,Oe,Ae.data):t.texImage3D(s.TEXTURE_2D_ARRAY,te,Ce,Ae.width,Ae.height,oe.depth,0,Re,Oe,Ae.data)}else{et&&ht&&t.texStorage2D(s.TEXTURE_2D,pe,Ce,Ze[0].width,Ze[0].height);for(let te=0,Te=Ze.length;te<Te;te++)Ae=Ze[te],A.format!==oi?Re!==null?et?U&&t.compressedTexSubImage2D(s.TEXTURE_2D,te,0,0,Ae.width,Ae.height,Re,Ae.data):t.compressedTexImage2D(s.TEXTURE_2D,te,Ce,Ae.width,Ae.height,0,Ae.data):it("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):et?U&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,Ae.width,Ae.height,Re,Oe,Ae.data):t.texImage2D(s.TEXTURE_2D,te,Ce,Ae.width,Ae.height,0,Re,Oe,Ae.data)}else if(A.isDataArrayTexture)if(et){if(ht&&t.texStorage3D(s.TEXTURE_2D_ARRAY,pe,Ce,oe.width,oe.height,oe.depth),U)if(A.layerUpdates.size>0){let te=bd(oe.width,oe.height,A.format,A.type);for(let Te of A.layerUpdates){let Ie=oe.data.subarray(Te*te/oe.data.BYTES_PER_ELEMENT,(Te+1)*te/oe.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Te,oe.width,oe.height,1,Re,Oe,Ie)}A.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,Re,Oe,oe.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Ce,oe.width,oe.height,oe.depth,0,Re,Oe,oe.data);else if(A.isData3DTexture)et?(ht&&t.texStorage3D(s.TEXTURE_3D,pe,Ce,oe.width,oe.height,oe.depth),U&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,Re,Oe,oe.data)):t.texImage3D(s.TEXTURE_3D,0,Ce,oe.width,oe.height,oe.depth,0,Re,Oe,oe.data);else if(A.isFramebufferTexture){if(ht)if(et)t.texStorage2D(s.TEXTURE_2D,pe,Ce,oe.width,oe.height);else{let te=oe.width,Te=oe.height;for(let Ie=0;Ie<pe;Ie++)t.texImage2D(s.TEXTURE_2D,Ie,Ce,te,Te,0,Re,Oe,null),te>>=1,Te>>=1}}else if(A.isHTMLTexture){if("texElementImage2D"in s){let te=s.canvas;if(te.hasAttribute("layoutsubtree")||te.setAttribute("layoutsubtree","true"),oe.parentNode!==te){te.appendChild(oe),u.add(A),te.onpaint=Te=>{let Ie=Te.changedElements;for(let ce of u)Ie.includes(ce.image)&&(ce.needsUpdate=!0)},te.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,oe);else{let Ie=s.RGBA,ce=s.RGBA,ze=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,Ie,ce,ze,oe)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(Ze.length>0){if(et&&ht){let te=mt(Ze[0]);t.texStorage2D(s.TEXTURE_2D,pe,Ce,te.width,te.height)}for(let te=0,Te=Ze.length;te<Te;te++)Ae=Ze[te],et?U&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,Re,Oe,Ae):t.texImage2D(s.TEXTURE_2D,te,Ce,Re,Oe,Ae);A.generateMipmaps=!1}else if(et){if(ht){let te=mt(oe);t.texStorage2D(s.TEXTURE_2D,pe,Ce,te.width,te.height)}U&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,Re,Oe,oe)}else t.texImage2D(s.TEXTURE_2D,0,Ce,Re,Oe,oe);m(A)&&y(X),ve.__version=ge.version,A.onUpdate&&A.onUpdate(A)}D.__version=A.version}function Me(D,A,V){if(A.image.length!==6)return;let X=W(D,A),j=A.source;t.bindTexture(s.TEXTURE_CUBE_MAP,D.__webglTexture,s.TEXTURE0+V);let ge=n.get(j);if(j.version!==ge.__version||X===!0){t.activeTexture(s.TEXTURE0+V);let ve=Mt.getPrimaries(Mt.workingColorSpace),ee=A.colorSpace===_i?null:Mt.getPrimaries(A.colorSpace),oe=A.colorSpace===_i||ve===ee?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,A.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),t.pixelStorei(s.UNPACK_ALIGNMENT,A.unpackAlignment),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe);let Re=A.isCompressedTexture||A.image[0].isCompressedTexture,Oe=A.image[0]&&A.image[0].isDataTexture,Ce=[];for(let ce=0;ce<6;ce++)!Re&&!Oe?Ce[ce]=p(A.image[ce],!0,i.maxCubemapSize):Ce[ce]=Oe?A.image[ce].image:A.image[ce],Ce[ce]=Rt(A,Ce[ce]);let Ae=Ce[0],Ze=r.convert(A.format,A.colorSpace),et=r.convert(A.type),ht=x(A.internalFormat,Ze,et,A.normalized,A.colorSpace),U=A.isVideoTexture!==!0,pe=ge.__version===void 0||X===!0,te=j.dataReady,Te=M(A,Ae);ye(s.TEXTURE_CUBE_MAP,A);let Ie;if(Re){U&&pe&&t.texStorage2D(s.TEXTURE_CUBE_MAP,Te,ht,Ae.width,Ae.height);for(let ce=0;ce<6;ce++){Ie=Ce[ce].mipmaps;for(let ze=0;ze<Ie.length;ze++){let Be=Ie[ze];A.format!==oi?Ze!==null?U?te&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze,0,0,Be.width,Be.height,Ze,Be.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze,ht,Be.width,Be.height,0,Be.data):it("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?te&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze,0,0,Be.width,Be.height,Ze,et,Be.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze,ht,Be.width,Be.height,0,Ze,et,Be.data)}}}else{if(Ie=A.mipmaps,U&&pe){Ie.length>0&&Te++;let ce=mt(Ce[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,Te,ht,ce.width,ce.height)}for(let ce=0;ce<6;ce++)if(Oe){U?te&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0,0,0,Ce[ce].width,Ce[ce].height,Ze,et,Ce[ce].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0,ht,Ce[ce].width,Ce[ce].height,0,Ze,et,Ce[ce].data);for(let ze=0;ze<Ie.length;ze++){let $t=Ie[ze].image[ce].image;U?te&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze+1,0,0,$t.width,$t.height,Ze,et,$t.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze+1,ht,$t.width,$t.height,0,Ze,et,$t.data)}}else{U?te&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0,0,0,Ze,et,Ce[ce]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0,ht,Ze,et,Ce[ce]);for(let ze=0;ze<Ie.length;ze++){let Be=Ie[ze];U?te&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze+1,0,0,Ze,et,Be.image[ce]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ce,ze+1,ht,Ze,et,Be.image[ce])}}}m(A)&&y(s.TEXTURE_CUBE_MAP),ge.__version=j.version,A.onUpdate&&A.onUpdate(A)}D.__version=A.version}function Ee(D,A,V,X,j,ge){let ve=r.convert(V.format,V.colorSpace),ee=r.convert(V.type),oe=x(V.internalFormat,ve,ee,V.normalized,V.colorSpace),Re=n.get(A),Oe=n.get(V);if(Oe.__renderTarget=A,!Re.__hasExternalTextures){let Ce=Math.max(1,A.width>>ge),Ae=Math.max(1,A.height>>ge);j===s.TEXTURE_3D||j===s.TEXTURE_2D_ARRAY?t.texImage3D(j,ge,oe,Ce,Ae,A.depth,0,ve,ee,null):t.texImage2D(j,ge,oe,Ce,Ae,0,ve,ee,null)}t.bindFramebuffer(s.FRAMEBUFFER,D),ct(A)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,X,j,Oe.__webglTexture,0,nt(A)):(j===s.TEXTURE_2D||j>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,X,j,Oe.__webglTexture,ge),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ge(D,A,V){if(s.bindRenderbuffer(s.RENDERBUFFER,D),A.depthBuffer){let X=A.depthTexture,j=X&&X.isDepthTexture?X.type:null,ge=S(A.stencilBuffer,j),ve=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;ct(A)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,nt(A),ge,A.width,A.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,nt(A),ge,A.width,A.height):s.renderbufferStorage(s.RENDERBUFFER,ge,A.width,A.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,ve,s.RENDERBUFFER,D)}else{let X=A.textures;for(let j=0;j<X.length;j++){let ge=X[j],ve=r.convert(ge.format,ge.colorSpace),ee=r.convert(ge.type),oe=x(ge.internalFormat,ve,ee,ge.normalized,ge.colorSpace);ct(A)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,nt(A),oe,A.width,A.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,nt(A),oe,A.width,A.height):s.renderbufferStorage(s.RENDERBUFFER,oe,A.width,A.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Fe(D,A,V){let X=A.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(s.FRAMEBUFFER,D),!(A.depthTexture&&A.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=n.get(A.depthTexture);if(j.__renderTarget=A,(!j.__webglTexture||A.depthTexture.image.width!==A.width||A.depthTexture.image.height!==A.height)&&(A.depthTexture.image.width=A.width,A.depthTexture.image.height=A.height,A.depthTexture.needsUpdate=!0),X){if(j.__webglInit===void 0&&(j.__webglInit=!0,A.depthTexture.addEventListener("dispose",w)),j.__webglTexture===void 0){j.__webglTexture=s.createTexture(),t.bindTexture(s.TEXTURE_CUBE_MAP,j.__webglTexture),ye(s.TEXTURE_CUBE_MAP,A.depthTexture);let Re=r.convert(A.depthTexture.format),Oe=r.convert(A.depthTexture.type),Ce;A.depthTexture.format===Di?Ce=s.DEPTH_COMPONENT24:A.depthTexture.format===Cs&&(Ce=s.DEPTH24_STENCIL8);for(let Ae=0;Ae<6;Ae++)s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Ae,0,Ce,A.width,A.height,0,Re,Oe,null)}}else J(A.depthTexture,0);let ge=j.__webglTexture,ve=nt(A),ee=X?s.TEXTURE_CUBE_MAP_POSITIVE_X+V:s.TEXTURE_2D,oe=A.depthTexture.format===Cs?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(A.depthTexture.format===Di)ct(A)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,oe,ee,ge,0,ve):s.framebufferTexture2D(s.FRAMEBUFFER,oe,ee,ge,0);else if(A.depthTexture.format===Cs)ct(A)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,oe,ee,ge,0,ve):s.framebufferTexture2D(s.FRAMEBUFFER,oe,ee,ge,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function re(D){let A=n.get(D),V=D.isWebGLCubeRenderTarget===!0;if(A.__boundDepthTexture!==D.depthTexture){let X=D.depthTexture;if(A.__depthDisposeCallback&&A.__depthDisposeCallback(),X){let j=()=>{delete A.__boundDepthTexture,delete A.__depthDisposeCallback,X.removeEventListener("dispose",j)};X.addEventListener("dispose",j),A.__depthDisposeCallback=j}A.__boundDepthTexture=X}if(D.depthTexture&&!A.__autoAllocateDepthBuffer)if(V)for(let X=0;X<6;X++)Fe(A.__webglFramebuffer[X],D,X);else{let X=D.texture.mipmaps;X&&X.length>0?Fe(A.__webglFramebuffer[0],D,0):Fe(A.__webglFramebuffer,D,0)}else if(V){A.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(s.FRAMEBUFFER,A.__webglFramebuffer[X]),A.__webglDepthbuffer[X]===void 0)A.__webglDepthbuffer[X]=s.createRenderbuffer(),Ge(A.__webglDepthbuffer[X],D,!1);else{let j=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ge=A.__webglDepthbuffer[X];s.bindRenderbuffer(s.RENDERBUFFER,ge),s.framebufferRenderbuffer(s.FRAMEBUFFER,j,s.RENDERBUFFER,ge)}}else{let X=D.texture.mipmaps;if(X&&X.length>0?t.bindFramebuffer(s.FRAMEBUFFER,A.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,A.__webglFramebuffer),A.__webglDepthbuffer===void 0)A.__webglDepthbuffer=s.createRenderbuffer(),Ge(A.__webglDepthbuffer,D,!1);else{let j=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ge=A.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,ge),s.framebufferRenderbuffer(s.FRAMEBUFFER,j,s.RENDERBUFFER,ge)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function he(D,A,V){let X=n.get(D);A!==void 0&&Ee(X.__webglFramebuffer,D,D.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),V!==void 0&&re(D)}function le(D){let A=D.texture,V=n.get(D),X=n.get(A);D.addEventListener("dispose",b);let j=D.textures,ge=D.isWebGLCubeRenderTarget===!0,ve=j.length>1;if(ve||(X.__webglTexture===void 0&&(X.__webglTexture=s.createTexture()),X.__version=A.version,o.memory.textures++),ge){V.__webglFramebuffer=[];for(let ee=0;ee<6;ee++)if(A.mipmaps&&A.mipmaps.length>0){V.__webglFramebuffer[ee]=[];for(let oe=0;oe<A.mipmaps.length;oe++)V.__webglFramebuffer[ee][oe]=s.createFramebuffer()}else V.__webglFramebuffer[ee]=s.createFramebuffer()}else{if(A.mipmaps&&A.mipmaps.length>0){V.__webglFramebuffer=[];for(let ee=0;ee<A.mipmaps.length;ee++)V.__webglFramebuffer[ee]=s.createFramebuffer()}else V.__webglFramebuffer=s.createFramebuffer();if(ve)for(let ee=0,oe=j.length;ee<oe;ee++){let Re=n.get(j[ee]);Re.__webglTexture===void 0&&(Re.__webglTexture=s.createTexture(),o.memory.textures++)}if(D.samples>0&&ct(D)===!1){V.__webglMultisampledFramebuffer=s.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ee=0;ee<j.length;ee++){let oe=j[ee];V.__webglColorRenderbuffer[ee]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,V.__webglColorRenderbuffer[ee]);let Re=r.convert(oe.format,oe.colorSpace),Oe=r.convert(oe.type),Ce=x(oe.internalFormat,Re,Oe,oe.normalized,oe.colorSpace,D.isXRRenderTarget===!0),Ae=nt(D);s.renderbufferStorageMultisample(s.RENDERBUFFER,Ae,Ce,D.width,D.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ee,s.RENDERBUFFER,V.__webglColorRenderbuffer[ee])}s.bindRenderbuffer(s.RENDERBUFFER,null),D.depthBuffer&&(V.__webglDepthRenderbuffer=s.createRenderbuffer(),Ge(V.__webglDepthRenderbuffer,D,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(ge){t.bindTexture(s.TEXTURE_CUBE_MAP,X.__webglTexture),ye(s.TEXTURE_CUBE_MAP,A);for(let ee=0;ee<6;ee++)if(A.mipmaps&&A.mipmaps.length>0)for(let oe=0;oe<A.mipmaps.length;oe++)Ee(V.__webglFramebuffer[ee][oe],D,A,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ee,oe);else Ee(V.__webglFramebuffer[ee],D,A,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0);m(A)&&y(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ve){for(let ee=0,oe=j.length;ee<oe;ee++){let Re=j[ee],Oe=n.get(Re),Ce=s.TEXTURE_2D;(D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(Ce=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(Ce,Oe.__webglTexture),ye(Ce,Re),Ee(V.__webglFramebuffer,D,Re,s.COLOR_ATTACHMENT0+ee,Ce,0),m(Re)&&y(Ce)}t.unbindTexture()}else{let ee=s.TEXTURE_2D;if((D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(ee=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(ee,X.__webglTexture),ye(ee,A),A.mipmaps&&A.mipmaps.length>0)for(let oe=0;oe<A.mipmaps.length;oe++)Ee(V.__webglFramebuffer[oe],D,A,s.COLOR_ATTACHMENT0,ee,oe);else Ee(V.__webglFramebuffer,D,A,s.COLOR_ATTACHMENT0,ee,0);m(A)&&y(ee),t.unbindTexture()}D.depthBuffer&&re(D)}function Se(D){let A=D.textures;for(let V=0,X=A.length;V<X;V++){let j=A[V];if(m(j)){let ge=_(D),ve=n.get(j).__webglTexture;t.bindTexture(ge,ve),y(ge),t.unbindTexture()}}}let we=[],Je=[];function Ve(D){if(D.samples>0){if(ct(D)===!1){let A=D.textures,V=D.width,X=D.height,j=s.COLOR_BUFFER_BIT,ge=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ve=n.get(D),ee=A.length>1;if(ee)for(let Re=0;Re<A.length;Re++)t.bindFramebuffer(s.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Re,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,ve.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Re,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer);let oe=D.texture.mipmaps;oe&&oe.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ve.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let Re=0;Re<A.length;Re++){if(D.resolveDepthBuffer&&(D.depthBuffer&&(j|=s.DEPTH_BUFFER_BIT),D.stencilBuffer&&D.resolveStencilBuffer&&(j|=s.STENCIL_BUFFER_BIT)),ee){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,ve.__webglColorRenderbuffer[Re]);let Oe=n.get(A[Re]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,Oe,0)}s.blitFramebuffer(0,0,V,X,0,0,V,X,j,s.NEAREST),l===!0&&(we.length=0,Je.length=0,we.push(s.COLOR_ATTACHMENT0+Re),D.depthBuffer&&D.resolveDepthBuffer===!1&&(we.push(ge),Je.push(ge),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Je)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,we))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),ee)for(let Re=0;Re<A.length;Re++){t.bindFramebuffer(s.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Re,s.RENDERBUFFER,ve.__webglColorRenderbuffer[Re]);let Oe=n.get(A[Re]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,ve.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Re,s.TEXTURE_2D,Oe,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(D.depthBuffer&&D.resolveDepthBuffer===!1&&l){let A=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[A])}}}function nt(D){return Math.min(i.maxSamples,D.samples)}function ct(D){let A=n.get(D);return D.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&A.__useRenderToTexture!==!1}function N(D){let A=o.render.frame;h.get(D)!==A&&(h.set(D,A),D.update())}function Rt(D,A){let V=D.colorSpace,X=D.format,j=D.type;return D.isCompressedTexture===!0||D.isVideoTexture===!0||V!==zo&&V!==_i&&(Mt.getTransfer(V)===At?(X!==oi||j!==Gn)&&it("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):lt("WebGLTextures: Unsupported texture color space:",V)),A}function mt(D){return typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement?(c.width=D.naturalWidth||D.width,c.height=D.naturalHeight||D.height):typeof VideoFrame<"u"&&D instanceof VideoFrame?(c.width=D.displayWidth,c.height=D.displayHeight):(c.width=D.width,c.height=D.height),c}this.allocateTextureUnit=O,this.resetTextureUnits=H,this.getTextureUnits=B,this.setTextureUnits=F,this.setTexture2D=J,this.setTexture2DArray=ne,this.setTexture3D=ue,this.setTextureCube=fe,this.rebindTextures=he,this.setupRenderTarget=le,this.updateRenderTargetMipmap=Se,this.updateMultisampleRenderTarget=Ve,this.setupDepthRenderbuffer=re,this.setupFrameBufferTexture=Ee,this.useMultisampledRTT=ct,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function KE(s,e){function t(n,i=_i){let r,o=Mt.getTransfer(i);if(n===Gn)return s.UNSIGNED_BYTE;if(n===gc)return s.UNSIGNED_SHORT_4_4_4_4;if(n===vc)return s.UNSIGNED_SHORT_5_5_5_1;if(n===ad)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===ld)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===rd)return s.BYTE;if(n===od)return s.SHORT;if(n===to)return s.UNSIGNED_SHORT;if(n===mc)return s.INT;if(n===yi)return s.UNSIGNED_INT;if(n===ri)return s.FLOAT;if(n===bn)return s.HALF_FLOAT;if(n===cd)return s.ALPHA;if(n===hd)return s.RGB;if(n===oi)return s.RGBA;if(n===Di)return s.DEPTH_COMPONENT;if(n===Cs)return s.DEPTH_STENCIL;if(n===xc)return s.RED;if(n===bc)return s.RED_INTEGER;if(n===Is)return s.RG;if(n===yc)return s.RG_INTEGER;if(n===_c)return s.RGBA_INTEGER;if(n===Sa||n===wa||n===Ra||n===Aa)if(o===At)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Sa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===wa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ra)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Aa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Sa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===wa)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ra)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Aa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ec||n===Tc||n===Mc||n===Sc)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ec)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Tc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Mc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Sc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===wc||n===Rc||n===Ac||n===Cc||n===Ic||n===Ca||n===Pc)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===wc||n===Rc)return o===At?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ac)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Cc)return r.COMPRESSED_R11_EAC;if(n===Ic)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ca)return r.COMPRESSED_RG11_EAC;if(n===Pc)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===kc||n===Dc||n===Lc||n===Fc||n===Hc||n===Bc||n===Nc||n===Uc||n===Oc||n===zc||n===Gc||n===Vc||n===Wc||n===qc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===kc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Dc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Lc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Fc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Hc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Bc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Nc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Uc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Oc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===zc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Gc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Vc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Wc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===qc)return o===At?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Xc||n===Yc||n===Kc)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Xc)return o===At?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Yc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Kc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Zc||n===$c||n===Ia||n===Jc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Zc)return r.COMPRESSED_RED_RGTC1_EXT;if(n===$c)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ia)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Jc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===no?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var ZE=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$E=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Nd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Jo(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Ct({vertexShader:ZE,fragmentShader:$E,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new xe(new Ut(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ud=class extends Li{constructor(e,t){super();let n=this,i=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,g=null,v=typeof XRWebGLBinding<"u",p=new Nd,m={},y=t.getContextAttributes(),_=null,x=null,S=[],M=[],w=new de,b=null,R=new xn;R.viewport=new qt;let P=new xn;P.viewport=new qt;let k=[R,P],L=new lc,H=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let se=S[W];return se===void 0&&(se=new Wr,S[W]=se),se.getTargetRaySpace()},this.getControllerGrip=function(W){let se=S[W];return se===void 0&&(se=new Wr,S[W]=se),se.getGripSpace()},this.getHand=function(W){let se=S[W];return se===void 0&&(se=new Wr,S[W]=se),se.getHandSpace()};function F(W){let se=M.indexOf(W.inputSource);if(se===-1)return;let ie=S[se];ie!==void 0&&(ie.update(W.inputSource,W.frame,c||o),ie.dispatchEvent({type:W.type,data:W.inputSource}))}function O(){i.removeEventListener("select",F),i.removeEventListener("selectstart",F),i.removeEventListener("selectend",F),i.removeEventListener("squeeze",F),i.removeEventListener("squeezestart",F),i.removeEventListener("squeezeend",F),i.removeEventListener("end",O),i.removeEventListener("inputsourceschange",z);for(let W=0;W<S.length;W++){let se=M[W];se!==null&&(M[W]=null,S[W].disconnect(se))}H=null,B=null,p.reset();for(let W in m)delete m[W];e.setRenderTarget(_),f=null,d=null,u=null,i=null,x=null,ye.stop(),n.isPresenting=!1,e.setPixelRatio(b),e.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&it("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,n.isPresenting===!0&&it("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&v&&(u=new XRWebGLBinding(i,t)),u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(W){if(i=W,i!==null){if(_=e.getRenderTarget(),i.addEventListener("select",F),i.addEventListener("selectstart",F),i.addEventListener("selectend",F),i.addEventListener("squeeze",F),i.addEventListener("squeezestart",F),i.addEventListener("squeezeend",F),i.addEventListener("end",O),i.addEventListener("inputsourceschange",z),y.xrCompatible!==!0&&await t.makeXRCompatible(),b=e.getPixelRatio(),e.getSize(w),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let ie=null,_e=null,Me=null;y.depth&&(Me=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=y.stencil?Cs:Di,_e=y.stencil?no:yi);let Ee={colorFormat:t.RGBA8,depthFormat:Me,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(Ee),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),x=new on(d.textureWidth,d.textureHeight,{format:oi,type:Gn,depthTexture:new ts(d.textureWidth,d.textureHeight,_e,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:y.stencil,colorSpace:e.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let ie={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,ie),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new on(f.framebufferWidth,f.framebufferHeight,{format:oi,type:Gn,colorSpace:e.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),ye.setContext(i),ye.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function z(W){for(let se=0;se<W.removed.length;se++){let ie=W.removed[se],_e=M.indexOf(ie);_e>=0&&(M[_e]=null,S[_e].disconnect(ie))}for(let se=0;se<W.added.length;se++){let ie=W.added[se],_e=M.indexOf(ie);if(_e===-1){for(let Ee=0;Ee<S.length;Ee++)if(Ee>=M.length){M.push(ie),_e=Ee;break}else if(M[Ee]===null){M[Ee]=ie,_e=Ee;break}if(_e===-1)break}let Me=S[_e];Me&&Me.connect(ie)}}let J=new C,ne=new C;function ue(W,se,ie){J.setFromMatrixPosition(se.matrixWorld),ne.setFromMatrixPosition(ie.matrixWorld);let _e=J.distanceTo(ne),Me=se.projectionMatrix.elements,Ee=ie.projectionMatrix.elements,Ge=Me[14]/(Me[10]-1),Fe=Me[14]/(Me[10]+1),re=(Me[9]+1)/Me[5],he=(Me[9]-1)/Me[5],le=(Me[8]-1)/Me[0],Se=(Ee[8]+1)/Ee[0],we=Ge*le,Je=Ge*Se,Ve=_e/(-le+Se),nt=Ve*-le;if(se.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(nt),W.translateZ(Ve),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Me[10]===-1)W.projectionMatrix.copy(se.projectionMatrix),W.projectionMatrixInverse.copy(se.projectionMatrixInverse);else{let ct=Ge+Ve,N=Fe+Ve,Rt=we-nt,mt=Je+(_e-nt),D=re*Fe/N*ct,A=he*Fe/N*ct;W.projectionMatrix.makePerspective(Rt,mt,D,A,ct,N),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function fe(W,se){se===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(se.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(i===null)return;let se=W.near,ie=W.far;p.texture!==null&&(p.depthNear>0&&(se=p.depthNear),p.depthFar>0&&(ie=p.depthFar)),L.near=P.near=R.near=se,L.far=P.far=R.far=ie,(H!==L.near||B!==L.far)&&(i.updateRenderState({depthNear:L.near,depthFar:L.far}),H=L.near,B=L.far),L.layers.mask=W.layers.mask|6,R.layers.mask=L.layers.mask&-5,P.layers.mask=L.layers.mask&-3;let _e=W.parent,Me=L.cameras;fe(L,_e);for(let Ee=0;Ee<Me.length;Ee++)fe(Me[Ee],_e);Me.length===2?ue(L,R,P):L.projectionMatrix.copy(R.projectionMatrix),me(W,L,_e)};function me(W,se,ie){ie===null?W.matrix.copy(se.matrixWorld):(W.matrix.copy(ie.matrixWorld),W.matrix.invert(),W.matrix.multiply(se.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(se.projectionMatrix),W.projectionMatrixInverse.copy(se.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=nr*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return L},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(W){l=W,d!==null&&(d.fixedFoveation=W),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=W)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(L)},this.getCameraTexture=function(W){return m[W]};let Ke=null;function Le(W,se){if(h=se.getViewerPose(c||o),g=se,h!==null){let ie=h.views;f!==null&&(e.setRenderTargetFramebuffer(x,f.framebuffer),e.setRenderTarget(x));let _e=!1;ie.length!==L.cameras.length&&(L.cameras.length=0,_e=!0);for(let Fe=0;Fe<ie.length;Fe++){let re=ie[Fe],he=null;if(f!==null)he=f.getViewport(re);else{let Se=u.getViewSubImage(d,re);he=Se.viewport,Fe===0&&(e.setRenderTargetTextures(x,Se.colorTexture,Se.depthStencilTexture),e.setRenderTarget(x))}let le=k[Fe];le===void 0&&(le=new xn,le.layers.enable(Fe),le.viewport=new qt,k[Fe]=le),le.matrix.fromArray(re.transform.matrix),le.matrix.decompose(le.position,le.quaternion,le.scale),le.projectionMatrix.fromArray(re.projectionMatrix),le.projectionMatrixInverse.copy(le.projectionMatrix).invert(),le.viewport.set(he.x,he.y,he.width,he.height),Fe===0&&(L.matrix.copy(le.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale)),_e===!0&&L.cameras.push(le)}let Me=i.enabledFeatures;if(Me&&Me.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&v){u=n.getBinding();let Fe=u.getDepthInformation(ie[0]);Fe&&Fe.isValid&&Fe.texture&&p.init(Fe,i.renderState)}if(Me&&Me.includes("camera-access")&&v){e.state.unbindTexture(),u=n.getBinding();for(let Fe=0;Fe<ie.length;Fe++){let re=ie[Fe].camera;if(re){let he=m[re];he||(he=new Jo,m[re]=he);let le=u.getCameraImage(re);he.sourceTexture=le}}}}for(let ie=0;ie<S.length;ie++){let _e=M[ie],Me=S[ie];_e!==null&&Me!==void 0&&Me.update(_e,se,c||o)}Ke&&Ke(W,se),se.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:se}),g=null}let ye=new Gm;ye.setAnimationLoop(Le),this.setAnimationLoop=function(W){Ke=W},this.dispose=function(){}}},JE=new xt,Km=new ut;Km.set(-1,0,0,0,1,0,0,0,1);function jE(s,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,gd(s)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function i(p,m,y,_,x){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(p,m):m.isMeshLambertMaterial?(r(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(p,m),u(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(p,m),d(p,m),m.isMeshPhysicalMaterial&&f(p,m,x)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),v(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(o(p,m),m.isLineDashedMaterial&&a(p,m)):m.isPointsMaterial?l(p,m,y,_):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===fn&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===fn&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let y=e.get(m),_=y.envMap,x=y.envMapRotation;_&&(p.envMap.value=_,p.envMapRotation.value.setFromMatrix4(JE.makeRotationFromEuler(x)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Km),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function o(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function a(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,y,_){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*y,p.scale.value=_*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,y){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===fn&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=y.texture,p.transmissionSamplerSize.value.set(y.width,y.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function v(p,m){let y=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(y.matrixWorld),p.nearDistance.value=y.shadow.camera.near,p.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function QE(s,e,t,n){let i={},r={},o=[],a=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,S){let M=S.program;n.uniformBlockBinding(x,M)}function c(x,S){let M=i[x.id];M===void 0&&(p(x),M=h(x),i[x.id]=M,x.addEventListener("dispose",y));let w=S.program;n.updateUBOMapping(x,w);let b=e.render.frame;r[x.id]!==b&&(d(x),r[x.id]=b)}function h(x){let S=u();x.__bindingPointIndex=S;let M=s.createBuffer(),w=x.__size,b=x.usage;return s.bindBuffer(s.UNIFORM_BUFFER,M),s.bufferData(s.UNIFORM_BUFFER,w,b),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,S,M),M}function u(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return lt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){let S=i[x.id],M=x.uniforms,w=x.__cache;s.bindBuffer(s.UNIFORM_BUFFER,S);for(let b=0,R=M.length;b<R;b++){let P=M[b];if(Array.isArray(P))for(let k=0,L=P.length;k<L;k++)f(P[k],b,k,w);else f(P,b,0,w)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function f(x,S,M,w){if(v(x,S,M,w)===!0){let b=x.__offset,R=x.value;if(Array.isArray(R)){let P=0;for(let k=0;k<R.length;k++){let L=R[k],H=m(L);g(L,x.__data,P),typeof L!="number"&&typeof L!="boolean"&&!L.isMatrix3&&!ArrayBuffer.isView(L)&&(P+=H.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(R,x.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,b,x.__data)}}function g(x,S,M){typeof x=="number"||typeof x=="boolean"?S[0]=x:x.isMatrix3?(S[0]=x.elements[0],S[1]=x.elements[1],S[2]=x.elements[2],S[3]=0,S[4]=x.elements[3],S[5]=x.elements[4],S[6]=x.elements[5],S[7]=0,S[8]=x.elements[6],S[9]=x.elements[7],S[10]=x.elements[8],S[11]=0):ArrayBuffer.isView(x)?S.set(new x.constructor(x.buffer,x.byteOffset,S.length)):x.toArray(S,M)}function v(x,S,M,w){let b=x.value,R=S+"_"+M;if(w[R]===void 0)return typeof b=="number"||typeof b=="boolean"?w[R]=b:ArrayBuffer.isView(b)?w[R]=b.slice():w[R]=b.clone(),!0;{let P=w[R];if(typeof b=="number"||typeof b=="boolean"){if(P!==b)return w[R]=b,!0}else{if(ArrayBuffer.isView(b))return!0;if(P.equals(b)===!1)return P.copy(b),!0}}return!1}function p(x){let S=x.uniforms,M=0,w=16;for(let R=0,P=S.length;R<P;R++){let k=Array.isArray(S[R])?S[R]:[S[R]];for(let L=0,H=k.length;L<H;L++){let B=k[L],F=Array.isArray(B.value)?B.value:[B.value];for(let O=0,z=F.length;O<z;O++){let J=F[O],ne=m(J),ue=M%w,fe=ue%ne.boundary,me=ue+fe;M+=fe,me!==0&&w-me<ne.storage&&(M+=w-me),B.__data=new Float32Array(ne.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=M,M+=ne.storage}}}let b=M%w;return b>0&&(M+=w-b),x.__size=M,x.__cache={},this}function m(x){let S={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(S.boundary=4,S.storage=4):x.isVector2?(S.boundary=8,S.storage=8):x.isVector3||x.isColor?(S.boundary=16,S.storage=12):x.isVector4?(S.boundary=16,S.storage=16):x.isMatrix3?(S.boundary=48,S.storage=48):x.isMatrix4?(S.boundary=64,S.storage=64):x.isTexture?it("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(S.boundary=16,S.storage=x.byteLength):it("WebGLRenderer: Unsupported uniform value type.",x),S}function y(x){let S=x.target;S.removeEventListener("dispose",y);let M=o.indexOf(S.__bindingPointIndex);o.splice(M,1),s.deleteBuffer(i[S.id]),delete i[S.id],delete r[S.id]}function _(){for(let x in i)s.deleteBuffer(i[x]);o=[],i={},r={}}return{bind:l,update:c,dispose:_}}var eT=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ni=null;function tT(){return Ni===null&&(Ni=new Zo(eT,16,16,Is,bn),Ni.name="DFG_LUT",Ni.minFilter=rn,Ni.magFilter=rn,Ni.wrapS=Rn,Ni.wrapT=Rn,Ni.generateMipmaps=!1,Ni.needsUpdate=!0),Ni}var ih=class{constructor(e={}){let{canvas:t=hm(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Gn}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=o;let v=f,p=new Set([_c,yc,bc]),m=new Set([Gn,yi,to,no,gc,vc]),y=new Uint32Array(4),_=new Int32Array(4),x=new C,S=null,M=null,w=[],b=[],R=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=bi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,k=!1,L=null,H=null,B=null,F=null;this._outputColorSpace=Nt;let O=0,z=0,J=null,ne=-1,ue=null,fe=new qt,me=new qt,Ke=null,Le=new ae(0),ye=0,W=t.width,se=t.height,ie=1,_e=null,Me=null,Ee=new qt(0,0,W,se),Ge=new qt(0,0,W,se),Fe=!1,re=new qr,he=!1,le=!1,Se=new xt,we=new C,Je=new qt,Ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},nt=!1;function ct(){return J===null?ie:1}let N=n;function Rt(I,G){return t.getContext(I,G)}try{let I={alpha:!0,depth:i,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"185"}`),t.addEventListener("webglcontextlost",$t,!1),t.addEventListener("webglcontextrestored",Ot,!1),t.addEventListener("webglcontextcreationerror",Ri,!1),N===null){let G="webgl2";if(N=Rt(G,I),N===null)throw Rt(G)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(I){throw lt("WebGLRenderer: "+I.message),I}let mt,D,A,V,X,j,ge,ve,ee,oe,Re,Oe,Ce,Ae,Ze,et,ht,U,pe,te,Te,Ie,ce;function ze(){mt=new l_(N),mt.init(),Te=new KE(N,mt),D=new e_(N,mt,e,Te),A=new XE(N,mt),D.reversedDepthBuffer&&d&&A.buffers.depth.setReversed(!0),H=N.createFramebuffer(),B=N.createFramebuffer(),F=N.createFramebuffer(),V=new u_(N),X=new kE,j=new YE(N,mt,A,X,D,Te,V),ge=new a_(P),ve=new mb(N),Ie=new j1(N,ve),ee=new c_(N,ve,V,Ie),oe=new f_(N,ee,ve,Ie,V),U=new d_(N,D,j),Ze=new t_(X),Re=new PE(P,ge,mt,D,Ie,Ze),Oe=new jE(P,X),Ce=new LE,Ae=new OE(mt),ht=new J1(P,ge,A,oe,g,l),et=new qE(P,oe,D),ce=new QE(N,V,D,A),pe=new Q1(N,mt,V),te=new h_(N,mt,V),V.programs=Re.programs,P.capabilities=D,P.extensions=mt,P.properties=X,P.renderLists=Ce,P.shadowMap=et,P.state=A,P.info=V}ze(),v!==Gn&&(R=new m_(v,t.width,t.height,a,i,r));let Be=new Ud(P,N);this.xr=Be,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let I=mt.get("WEBGL_lose_context");I&&I.loseContext()},this.forceContextRestore=function(){let I=mt.get("WEBGL_lose_context");I&&I.restoreContext()},this.getPixelRatio=function(){return ie},this.setPixelRatio=function(I){I!==void 0&&(ie=I,this.setSize(W,se,!1))},this.getSize=function(I){return I.set(W,se)},this.setSize=function(I,G,Z=!0){if(Be.isPresenting){it("WebGLRenderer: Can't change size while VR device is presenting.");return}W=I,se=G,t.width=Math.floor(I*ie),t.height=Math.floor(G*ie),Z===!0&&(t.style.width=I+"px",t.style.height=G+"px"),R!==null&&R.setSize(t.width,t.height),this.setViewport(0,0,I,G)},this.getDrawingBufferSize=function(I){return I.set(W*ie,se*ie).floor()},this.setDrawingBufferSize=function(I,G,Z){W=I,se=G,ie=Z,t.width=Math.floor(I*Z),t.height=Math.floor(G*Z),this.setViewport(0,0,I,G)},this.setEffects=function(I){if(v===Gn){lt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(I){for(let G=0;G<I.length;G++)if(I[G].isOutputPass===!0){it("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}R.setEffects(I||[])},this.getCurrentViewport=function(I){return I.copy(fe)},this.getViewport=function(I){return I.copy(Ee)},this.setViewport=function(I,G,Z,Y){I.isVector4?Ee.set(I.x,I.y,I.z,I.w):Ee.set(I,G,Z,Y),A.viewport(fe.copy(Ee).multiplyScalar(ie).round())},this.getScissor=function(I){return I.copy(Ge)},this.setScissor=function(I,G,Z,Y){I.isVector4?Ge.set(I.x,I.y,I.z,I.w):Ge.set(I,G,Z,Y),A.scissor(me.copy(Ge).multiplyScalar(ie).round())},this.getScissorTest=function(){return Fe},this.setScissorTest=function(I){A.setScissorTest(Fe=I)},this.setOpaqueSort=function(I){_e=I},this.setTransparentSort=function(I){Me=I},this.getClearColor=function(I){return I.copy(ht.getClearColor())},this.setClearColor=function(){ht.setClearColor(...arguments)},this.getClearAlpha=function(){return ht.getClearAlpha()},this.setClearAlpha=function(){ht.setClearAlpha(...arguments)},this.clear=function(I=!0,G=!0,Z=!0){let Y=0;if(I){let K=!1;if(J!==null){let De=J.texture.format;K=p.has(De)}if(K){let De=J.texture.type,Ue=m.has(De),ke=ht.getClearColor(),Xe=ht.getClearAlpha(),$e=ke.r,gt=ke.g,Et=ke.b;Ue?(y[0]=$e,y[1]=gt,y[2]=Et,y[3]=Xe,N.clearBufferuiv(N.COLOR,0,y)):(_[0]=$e,_[1]=gt,_[2]=Et,_[3]=Xe,N.clearBufferiv(N.COLOR,0,_))}else Y|=N.COLOR_BUFFER_BIT}G&&(Y|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(Y|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),Y!==0&&N.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(I){I.setRenderer(this),L=I},this.dispose=function(){t.removeEventListener("webglcontextlost",$t,!1),t.removeEventListener("webglcontextrestored",Ot,!1),t.removeEventListener("webglcontextcreationerror",Ri,!1),ht.dispose(),Ce.dispose(),Ae.dispose(),X.dispose(),ge.dispose(),oe.dispose(),Ie.dispose(),ce.dispose(),Re.dispose(),Be.dispose(),Be.removeEventListener("sessionstart",Kf),Be.removeEventListener("sessionend",Zf),Ks.stop()};function $t(I){I.preventDefault(),fd("WebGLRenderer: Context Lost."),k=!0}function Ot(){fd("WebGLRenderer: Context Restored."),k=!1;let I=V.autoReset,G=et.enabled,Z=et.autoUpdate,Y=et.needsUpdate,K=et.type;ze(),V.autoReset=I,et.enabled=G,et.autoUpdate=Z,et.needsUpdate=Y,et.type=K}function Ri(I){lt("WebGLRenderer: A WebGL context could not be created. Reason: ",I.statusMessage)}function Ai(I){let G=I.target;G.removeEventListener("dispose",Ai),Pv(G)}function Pv(I){kv(I),X.remove(I)}function kv(I){let G=X.get(I).programs;G!==void 0&&(G.forEach(function(Z){Re.releaseProgram(Z)}),I.isShaderMaterial&&Re.releaseShaderCache(I))}this.renderBufferDirect=function(I,G,Z,Y,K,De){G===null&&(G=Ve);let Ue=K.isMesh&&K.matrixWorld.determinantAffine()<0,ke=Fv(I,G,Z,Y,K);A.setMaterial(Y,Ue);let Xe=Z.index,$e=1;if(Y.wireframe===!0){if(Xe=ee.getWireframeAttribute(Z),Xe===void 0)return;$e=2}let gt=Z.drawRange,Et=Z.attributes.position,je=gt.start*$e,Lt=(gt.start+gt.count)*$e;De!==null&&(je=Math.max(je,De.start*$e),Lt=Math.min(Lt,(De.start+De.count)*$e)),Xe!==null?(je=Math.max(je,0),Lt=Math.min(Lt,Xe.count)):Et!=null&&(je=Math.max(je,0),Lt=Math.min(Lt,Et.count));let nn=Lt-je;if(nn<0||nn===1/0)return;Ie.setup(K,Y,ke,Z,Xe);let Jt,Ht=pe;if(Xe!==null&&(Jt=ve.get(Xe),Ht=te,Ht.setIndex(Jt)),K.isMesh)Y.wireframe===!0?(A.setLineWidth(Y.wireframeLinewidth*ct()),Ht.setMode(N.LINES)):Ht.setMode(N.TRIANGLES);else if(K.isLine){let Mn=Y.linewidth;Mn===void 0&&(Mn=1),A.setLineWidth(Mn*ct()),K.isLineSegments?Ht.setMode(N.LINES):K.isLineLoop?Ht.setMode(N.LINE_LOOP):Ht.setMode(N.LINE_STRIP)}else K.isPoints?Ht.setMode(N.POINTS):K.isSprite&&Ht.setMode(N.TRIANGLES);if(K.isBatchedMesh)if(mt.get("WEBGL_multi_draw"))Ht.renderMultiDraw(K._multiDrawStarts,K._multiDrawCounts,K._multiDrawCount);else{let Mn=K._multiDrawStarts,Ne=K._multiDrawCounts,qn=K._multiDrawCount,St=Xe?ve.get(Xe).bytesPerElement:1,ni=X.get(Y).currentProgram.getUniforms();for(let Ci=0;Ci<qn;Ci++)ni.setValue(N,"_gl_DrawID",Ci),Ht.render(Mn[Ci]/St,Ne[Ci])}else if(K.isInstancedMesh)Ht.renderInstances(je,nn,K.count);else if(Z.isInstancedBufferGeometry){let Mn=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Ne=Math.min(Z.instanceCount,Mn);Ht.renderInstances(je,nn,Ne)}else Ht.render(je,nn)};function Yf(I,G,Z){I.transparent===!0&&I.side===bt&&I.forceSinglePass===!1?(I.side=fn,I.needsUpdate=!0,nl(I,G,Z),I.side=gi,I.needsUpdate=!0,nl(I,G,Z),I.side=bt):nl(I,G,Z)}this.compile=function(I,G,Z=null){Z===null&&(Z=I),M=Ae.get(Z),M.init(G),b.push(M),Z.traverseVisible(function(K){K.isLight&&K.layers.test(G.layers)&&(M.pushLight(K),K.castShadow&&M.pushShadow(K))}),I!==Z&&I.traverseVisible(function(K){K.isLight&&K.layers.test(G.layers)&&(M.pushLight(K),K.castShadow&&M.pushShadow(K))}),M.setupLights();let Y=new Set;return I.traverse(function(K){if(!(K.isMesh||K.isPoints||K.isLine||K.isSprite))return;let De=K.material;if(De)if(Array.isArray(De))for(let Ue=0;Ue<De.length;Ue++){let ke=De[Ue];Yf(ke,Z,K),Y.add(ke)}else Yf(De,Z,K),Y.add(De)}),M=b.pop(),Y},this.compileAsync=function(I,G,Z=null){let Y=this.compile(I,G,Z);return new Promise(K=>{function De(){if(Y.forEach(function(Ue){X.get(Ue).currentProgram.isReady()&&Y.delete(Ue)}),Y.size===0){K(I);return}setTimeout(De,10)}mt.get("KHR_parallel_shader_compile")!==null?De():setTimeout(De,10)})};let fu=null;function Dv(I){fu&&fu(I)}function Kf(){Ks.stop()}function Zf(){Ks.start()}let Ks=new Gm;Ks.setAnimationLoop(Dv),typeof self<"u"&&Ks.setContext(self),this.setAnimationLoop=function(I){fu=I,Be.setAnimationLoop(I),I===null?Ks.stop():Ks.start()},Be.addEventListener("sessionstart",Kf),Be.addEventListener("sessionend",Zf),this.render=function(I,G){if(G!==void 0&&G.isCamera!==!0){lt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;L!==null&&L.renderStart(I,G);let Z=Be.enabled===!0&&Be.isPresenting===!0,Y=R!==null&&(J===null||Z)&&R.begin(P,J);if(I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),Be.enabled===!0&&Be.isPresenting===!0&&(R===null||R.isCompositing()===!1)&&(Be.cameraAutoUpdate===!0&&Be.updateCamera(G),G=Be.getCamera()),I.isScene===!0&&I.onBeforeRender(P,I,G,J),M=Ae.get(I,b.length),M.init(G),M.state.textureUnits=j.getTextureUnits(),b.push(M),Se.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),re.setFromProjectionMatrix(Se,mi,G.reversedDepth),le=this.localClippingEnabled,he=Ze.init(this.clippingPlanes,le),S=Ce.get(I,w.length),S.init(),w.push(S),Be.enabled===!0&&Be.isPresenting===!0){let Ue=P.xr.getDepthSensingMesh();Ue!==null&&pu(Ue,G,-1/0,P.sortObjects)}pu(I,G,0,P.sortObjects),S.finish(),P.sortObjects===!0&&S.sort(_e,Me,G.reversedDepth),nt=Be.enabled===!1||Be.isPresenting===!1||Be.hasDepthSensing()===!1,nt&&ht.addToRenderList(S,I),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),he===!0&&Ze.beginShadows();let K=M.state.shadowsArray;if(et.render(K,I,G),he===!0&&Ze.endShadows(),(Y&&R.hasRenderPass())===!1){let Ue=S.opaque,ke=S.transmissive;if(M.setupLights(),G.isArrayCamera){let Xe=G.cameras;if(ke.length>0)for(let $e=0,gt=Xe.length;$e<gt;$e++){let Et=Xe[$e];Jf(Ue,ke,I,Et)}nt&&ht.render(I);for(let $e=0,gt=Xe.length;$e<gt;$e++){let Et=Xe[$e];$f(S,I,Et,Et.viewport)}}else ke.length>0&&Jf(Ue,ke,I,G),nt&&ht.render(I),$f(S,I,G)}J!==null&&z===0&&(j.updateMultisampleRenderTarget(J),j.updateRenderTargetMipmap(J)),Y&&R.end(P),I.isScene===!0&&I.onAfterRender(P,I,G),Ie.resetDefaultState(),ne=-1,ue=null,b.pop(),b.length>0?(M=b[b.length-1],j.setTextureUnits(M.state.textureUnits),he===!0&&Ze.setGlobalState(P.clippingPlanes,M.state.camera)):M=null,w.pop(),w.length>0?S=w[w.length-1]:S=null,L!==null&&L.renderEnd()};function pu(I,G,Z,Y){if(I.visible===!1)return;if(I.layers.test(G.layers)){if(I.isGroup)Z=I.renderOrder;else if(I.isLOD)I.autoUpdate===!0&&I.update(G);else if(I.isLightProbeGrid)M.pushLightProbeGrid(I);else if(I.isLight)M.pushLight(I),I.castShadow&&M.pushShadow(I);else if(I.isSprite){if(!I.frustumCulled||re.intersectsSprite(I)){Y&&Je.setFromMatrixPosition(I.matrixWorld).applyMatrix4(Se);let Ue=oe.update(I),ke=I.material;ke.visible&&S.push(I,Ue,ke,Z,Je.z,null)}}else if((I.isMesh||I.isLine||I.isPoints)&&(!I.frustumCulled||re.intersectsObject(I))){let Ue=oe.update(I),ke=I.material;if(Y&&(I.boundingSphere!==void 0?(I.boundingSphere===null&&I.computeBoundingSphere(),Je.copy(I.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),Je.copy(Ue.boundingSphere.center)),Je.applyMatrix4(I.matrixWorld).applyMatrix4(Se)),Array.isArray(ke)){let Xe=Ue.groups;for(let $e=0,gt=Xe.length;$e<gt;$e++){let Et=Xe[$e],je=ke[Et.materialIndex];je&&je.visible&&S.push(I,Ue,je,Z,Je.z,Et)}}else ke.visible&&S.push(I,Ue,ke,Z,Je.z,null)}}let De=I.children;for(let Ue=0,ke=De.length;Ue<ke;Ue++)pu(De[Ue],G,Z,Y)}function $f(I,G,Z,Y){let{opaque:K,transmissive:De,transparent:Ue}=I;M.setupLightsView(Z),he===!0&&Ze.setGlobalState(P.clippingPlanes,Z),Y&&A.viewport(fe.copy(Y)),K.length>0&&tl(K,G,Z),De.length>0&&tl(De,G,Z),Ue.length>0&&tl(Ue,G,Z),A.buffers.depth.setTest(!0),A.buffers.depth.setMask(!0),A.buffers.color.setMask(!0),A.setPolygonOffset(!1)}function Jf(I,G,Z,Y){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(M.state.transmissionRenderTarget[Y.id]===void 0){let je=mt.has("EXT_color_buffer_half_float")||mt.has("EXT_color_buffer_float");M.state.transmissionRenderTarget[Y.id]=new on(1,1,{generateMipmaps:!0,type:je?bn:Gn,minFilter:zn,samples:Math.max(4,D.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Mt.workingColorSpace})}let De=M.state.transmissionRenderTarget[Y.id],Ue=Y.viewport||fe;De.setSize(Ue.z*P.transmissionResolutionScale,Ue.w*P.transmissionResolutionScale);let ke=P.getRenderTarget(),Xe=P.getActiveCubeFace(),$e=P.getActiveMipmapLevel();P.setRenderTarget(De),P.getClearColor(Le),ye=P.getClearAlpha(),ye<1&&P.setClearColor(16777215,.5),P.clear(),nt&&ht.render(Z);let gt=P.toneMapping;P.toneMapping=bi;let Et=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),M.setupLightsView(Y),he===!0&&Ze.setGlobalState(P.clippingPlanes,Y),tl(I,Z,Y),j.updateMultisampleRenderTarget(De),j.updateRenderTargetMipmap(De),mt.has("WEBGL_multisampled_render_to_texture")===!1){let je=!1;for(let Lt=0,nn=G.length;Lt<nn;Lt++){let Jt=G[Lt],{object:Ht,geometry:Mn,material:Ne,group:qn}=Jt;if(Ne.side===bt&&Ht.layers.test(Y.layers)){let St=Ne.side;Ne.side=fn,Ne.needsUpdate=!0,jf(Ht,Z,Y,Mn,Ne,qn),Ne.side=St,Ne.needsUpdate=!0,je=!0}}je===!0&&(j.updateMultisampleRenderTarget(De),j.updateRenderTargetMipmap(De))}P.setRenderTarget(ke,Xe,$e),P.setClearColor(Le,ye),Et!==void 0&&(Y.viewport=Et),P.toneMapping=gt}function tl(I,G,Z){let Y=G.isScene===!0?G.overrideMaterial:null;for(let K=0,De=I.length;K<De;K++){let Ue=I[K],{object:ke,geometry:Xe,group:$e}=Ue,gt=Ue.material;gt.allowOverride===!0&&Y!==null&&(gt=Y),ke.layers.test(Z.layers)&&jf(ke,G,Z,Xe,gt,$e)}}function jf(I,G,Z,Y,K,De){I.onBeforeRender(P,G,Z,Y,K,De),I.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,I.matrixWorld),I.normalMatrix.getNormalMatrix(I.modelViewMatrix),K.onBeforeRender(P,G,Z,Y,I,De),K.transparent===!0&&K.side===bt&&K.forceSinglePass===!1?(K.side=fn,K.needsUpdate=!0,P.renderBufferDirect(Z,G,Y,K,I,De),K.side=gi,K.needsUpdate=!0,P.renderBufferDirect(Z,G,Y,K,I,De),K.side=bt):P.renderBufferDirect(Z,G,Y,K,I,De),I.onAfterRender(P,G,Z,Y,K,De)}function nl(I,G,Z){G.isScene!==!0&&(G=Ve);let Y=X.get(I),K=M.state.lights,De=M.state.shadowsArray,Ue=K.state.version,ke=Re.getParameters(I,K.state,De,G,Z,M.state.lightProbeGridArray),Xe=Re.getProgramCacheKey(ke),$e=Y.programs;Y.environment=I.isMeshStandardMaterial||I.isMeshLambertMaterial||I.isMeshPhongMaterial?G.environment:null,Y.fog=G.fog;let gt=I.isMeshStandardMaterial||I.isMeshLambertMaterial&&!I.envMap||I.isMeshPhongMaterial&&!I.envMap;Y.envMap=ge.get(I.envMap||Y.environment,gt),Y.envMapRotation=Y.environment!==null&&I.envMap===null?G.environmentRotation:I.envMapRotation,$e===void 0&&(I.addEventListener("dispose",Ai),$e=new Map,Y.programs=$e);let Et=$e.get(Xe);if(Et!==void 0){if(Y.currentProgram===Et&&Y.lightsStateVersion===Ue)return ep(I,ke),Et}else ke.uniforms=Re.getUniforms(I),L!==null&&I.isNodeMaterial&&L.build(I,Z,ke),I.onBeforeCompile(ke,P),Et=Re.acquireProgram(ke,Xe),$e.set(Xe,Et),Y.uniforms=ke.uniforms;let je=Y.uniforms;return(!I.isShaderMaterial&&!I.isRawShaderMaterial||I.clipping===!0)&&(je.clippingPlanes=Ze.uniform),ep(I,ke),Y.needsLights=Bv(I),Y.lightsStateVersion=Ue,Y.needsLights&&(je.ambientLightColor.value=K.state.ambient,je.lightProbe.value=K.state.probe,je.directionalLights.value=K.state.directional,je.directionalLightShadows.value=K.state.directionalShadow,je.spotLights.value=K.state.spot,je.spotLightShadows.value=K.state.spotShadow,je.rectAreaLights.value=K.state.rectArea,je.ltc_1.value=K.state.rectAreaLTC1,je.ltc_2.value=K.state.rectAreaLTC2,je.pointLights.value=K.state.point,je.pointLightShadows.value=K.state.pointShadow,je.hemisphereLights.value=K.state.hemi,je.directionalShadowMatrix.value=K.state.directionalShadowMatrix,je.spotLightMatrix.value=K.state.spotLightMatrix,je.spotLightMap.value=K.state.spotLightMap,je.pointShadowMatrix.value=K.state.pointShadowMatrix),Y.lightProbeGrid=M.state.lightProbeGridArray.length>0,Y.currentProgram=Et,Y.uniformsList=null,Et}function Qf(I){if(I.uniformsList===null){let G=I.currentProgram.getUniforms();I.uniformsList=ro.seqWithValue(G.seq,I.uniforms)}return I.uniformsList}function ep(I,G){let Z=X.get(I);Z.outputColorSpace=G.outputColorSpace,Z.batching=G.batching,Z.batchingColor=G.batchingColor,Z.instancing=G.instancing,Z.instancingColor=G.instancingColor,Z.instancingMorph=G.instancingMorph,Z.skinning=G.skinning,Z.morphTargets=G.morphTargets,Z.morphNormals=G.morphNormals,Z.morphColors=G.morphColors,Z.morphTargetsCount=G.morphTargetsCount,Z.numClippingPlanes=G.numClippingPlanes,Z.numIntersection=G.numClipIntersection,Z.vertexAlphas=G.vertexAlphas,Z.vertexTangents=G.vertexTangents,Z.toneMapping=G.toneMapping}function Lv(I,G){if(I.length===0)return null;if(I.length===1)return I[0].texture!==null?I[0]:null;x.setFromMatrixPosition(G.matrixWorld);for(let Z=0,Y=I.length;Z<Y;Z++){let K=I[Z];if(K.texture!==null&&K.boundingBox.containsPoint(x))return K}return null}function Fv(I,G,Z,Y,K){G.isScene!==!0&&(G=Ve),j.resetTextureUnits();let De=G.fog,Ue=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial?G.environment:null,ke=J===null?P.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:Mt.workingColorSpace,Xe=Y.isMeshStandardMaterial||Y.isMeshLambertMaterial&&!Y.envMap||Y.isMeshPhongMaterial&&!Y.envMap,$e=ge.get(Y.envMap||Ue,Xe),gt=Y.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,Et=!!Z.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),je=!!Z.morphAttributes.position,Lt=!!Z.morphAttributes.normal,nn=!!Z.morphAttributes.color,Jt=bi;Y.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Jt=P.toneMapping);let Ht=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,Mn=Ht!==void 0?Ht.length:0,Ne=X.get(Y),qn=M.state.lights;if(he===!0&&(le===!0||I!==ue)){let zt=I===ue&&Y.id===ne;Ze.setState(Y,I,zt)}let St=!1;Y.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==qn.state.version||Ne.outputColorSpace!==ke||K.isBatchedMesh&&Ne.batching===!1||!K.isBatchedMesh&&Ne.batching===!0||K.isBatchedMesh&&Ne.batchingColor===!0&&K.colorTexture===null||K.isBatchedMesh&&Ne.batchingColor===!1&&K.colorTexture!==null||K.isInstancedMesh&&Ne.instancing===!1||!K.isInstancedMesh&&Ne.instancing===!0||K.isSkinnedMesh&&Ne.skinning===!1||!K.isSkinnedMesh&&Ne.skinning===!0||K.isInstancedMesh&&Ne.instancingColor===!0&&K.instanceColor===null||K.isInstancedMesh&&Ne.instancingColor===!1&&K.instanceColor!==null||K.isInstancedMesh&&Ne.instancingMorph===!0&&K.morphTexture===null||K.isInstancedMesh&&Ne.instancingMorph===!1&&K.morphTexture!==null||Ne.envMap!==$e||Y.fog===!0&&Ne.fog!==De||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==Ze.numPlanes||Ne.numIntersection!==Ze.numIntersection)||Ne.vertexAlphas!==gt||Ne.vertexTangents!==Et||Ne.morphTargets!==je||Ne.morphNormals!==Lt||Ne.morphColors!==nn||Ne.toneMapping!==Jt||Ne.morphTargetsCount!==Mn||!!Ne.lightProbeGrid!=M.state.lightProbeGridArray.length>0)&&(St=!0):(St=!0,Ne.__version=Y.version);let ni=Ne.currentProgram;St===!0&&(ni=nl(Y,G,K),L&&Y.isNodeMaterial&&L.onUpdateProgram(Y,ni,Ne));let Ci=!1,hs=!1,Mr=!1,Bt=ni.getUniforms(),sn=Ne.uniforms;if(A.useProgram(ni.program)&&(Ci=!0,hs=!0,Mr=!0),Y.id!==ne&&(ne=Y.id,hs=!0),Ne.needsLights){let zt=Lv(M.state.lightProbeGridArray,K);Ne.lightProbeGrid!==zt&&(Ne.lightProbeGrid=zt,hs=!0)}if(Ci||ue!==I){A.buffers.depth.getReversed()&&I.reversedDepth!==!0&&(I._reversedDepth=!0,I.updateProjectionMatrix()),Bt.setValue(N,"projectionMatrix",I.projectionMatrix),Bt.setValue(N,"viewMatrix",I.matrixWorldInverse);let ds=Bt.map.cameraPosition;ds!==void 0&&ds.setValue(N,we.setFromMatrixPosition(I.matrixWorld)),D.logarithmicDepthBuffer&&Bt.setValue(N,"logDepthBufFC",2/(Math.log(I.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Bt.setValue(N,"isOrthographic",I.isOrthographicCamera===!0),ue!==I&&(ue=I,hs=!0,Mr=!0)}if(Ne.needsLights&&(qn.state.directionalShadowMap.length>0&&Bt.setValue(N,"directionalShadowMap",qn.state.directionalShadowMap,j),qn.state.spotShadowMap.length>0&&Bt.setValue(N,"spotShadowMap",qn.state.spotShadowMap,j),qn.state.pointShadowMap.length>0&&Bt.setValue(N,"pointShadowMap",qn.state.pointShadowMap,j)),K.isSkinnedMesh){Bt.setOptional(N,K,"bindMatrix"),Bt.setOptional(N,K,"bindMatrixInverse");let zt=K.skeleton;zt&&(zt.boneTexture===null&&zt.computeBoneTexture(),Bt.setValue(N,"boneTexture",zt.boneTexture,j))}K.isBatchedMesh&&(Bt.setOptional(N,K,"batchingTexture"),Bt.setValue(N,"batchingTexture",K._matricesTexture,j),Bt.setOptional(N,K,"batchingIdTexture"),Bt.setValue(N,"batchingIdTexture",K._indirectTexture,j),Bt.setOptional(N,K,"batchingColorTexture"),K._colorsTexture!==null&&Bt.setValue(N,"batchingColorTexture",K._colorsTexture,j));let us=Z.morphAttributes;if((us.position!==void 0||us.normal!==void 0||us.color!==void 0)&&U.update(K,Z,ni),(hs||Ne.receiveShadow!==K.receiveShadow)&&(Ne.receiveShadow=K.receiveShadow,Bt.setValue(N,"receiveShadow",K.receiveShadow)),(Y.isMeshStandardMaterial||Y.isMeshLambertMaterial||Y.isMeshPhongMaterial)&&Y.envMap===null&&G.environment!==null&&(sn.envMapIntensity.value=G.environmentIntensity),sn.dfgLUT!==void 0&&(sn.dfgLUT.value=tT()),hs){if(Bt.setValue(N,"toneMappingExposure",P.toneMappingExposure),Ne.needsLights&&Hv(sn,Mr),De&&Y.fog===!0&&Oe.refreshFogUniforms(sn,De),Oe.refreshMaterialUniforms(sn,Y,ie,se,M.state.transmissionRenderTarget[I.id]),Ne.needsLights&&Ne.lightProbeGrid){let zt=Ne.lightProbeGrid;sn.probesSH.value=zt.texture,sn.probesMin.value.copy(zt.boundingBox.min),sn.probesMax.value.copy(zt.boundingBox.max),sn.probesResolution.value.copy(zt.resolution)}ro.upload(N,Qf(Ne),sn,j)}if(Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(ro.upload(N,Qf(Ne),sn,j),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Bt.setValue(N,"center",K.center),Bt.setValue(N,"modelViewMatrix",K.modelViewMatrix),Bt.setValue(N,"normalMatrix",K.normalMatrix),Bt.setValue(N,"modelMatrix",K.matrixWorld),Y.uniformsGroups!==void 0){let zt=Y.uniformsGroups;for(let ds=0,Sr=zt.length;ds<Sr;ds++){let tp=zt[ds];ce.update(tp,ni),ce.bind(tp,ni)}}return ni}function Hv(I,G){I.ambientLightColor.needsUpdate=G,I.lightProbe.needsUpdate=G,I.directionalLights.needsUpdate=G,I.directionalLightShadows.needsUpdate=G,I.pointLights.needsUpdate=G,I.pointLightShadows.needsUpdate=G,I.spotLights.needsUpdate=G,I.spotLightShadows.needsUpdate=G,I.rectAreaLights.needsUpdate=G,I.hemisphereLights.needsUpdate=G}function Bv(I){return I.isMeshLambertMaterial||I.isMeshToonMaterial||I.isMeshPhongMaterial||I.isMeshStandardMaterial||I.isShadowMaterial||I.isShaderMaterial&&I.lights===!0}this.getActiveCubeFace=function(){return O},this.getActiveMipmapLevel=function(){return z},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(I,G,Z){let Y=X.get(I);Y.__autoAllocateDepthBuffer=I.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),X.get(I.texture).__webglTexture=G,X.get(I.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:Z,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(I,G){let Z=X.get(I);Z.__webglFramebuffer=G,Z.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(I,G=0,Z=0){J=I,O=G,z=Z;let Y=null,K=!1,De=!1;if(I){let ke=X.get(I);if(ke.__useDefaultFramebuffer!==void 0){A.bindFramebuffer(N.FRAMEBUFFER,ke.__webglFramebuffer),fe.copy(I.viewport),me.copy(I.scissor),Ke=I.scissorTest,A.viewport(fe),A.scissor(me),A.setScissorTest(Ke),ne=-1;return}else if(ke.__webglFramebuffer===void 0)j.setupRenderTarget(I);else if(ke.__hasExternalTextures)j.rebindTextures(I,X.get(I.texture).__webglTexture,X.get(I.depthTexture).__webglTexture);else if(I.depthBuffer){let gt=I.depthTexture;if(ke.__boundDepthTexture!==gt){if(gt!==null&&X.has(gt)&&(I.width!==gt.image.width||I.height!==gt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");j.setupDepthRenderbuffer(I)}}let Xe=I.texture;(Xe.isData3DTexture||Xe.isDataArrayTexture||Xe.isCompressedArrayTexture)&&(De=!0);let $e=X.get(I).__webglFramebuffer;I.isWebGLCubeRenderTarget?(Array.isArray($e[G])?Y=$e[G][Z]:Y=$e[G],K=!0):I.samples>0&&j.useMultisampledRTT(I)===!1?Y=X.get(I).__webglMultisampledFramebuffer:Array.isArray($e)?Y=$e[Z]:Y=$e,fe.copy(I.viewport),me.copy(I.scissor),Ke=I.scissorTest}else fe.copy(Ee).multiplyScalar(ie).floor(),me.copy(Ge).multiplyScalar(ie).floor(),Ke=Fe;if(Z!==0&&(Y=H),A.bindFramebuffer(N.FRAMEBUFFER,Y)&&A.drawBuffers(I,Y),A.viewport(fe),A.scissor(me),A.setScissorTest(Ke),K){let ke=X.get(I.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+G,ke.__webglTexture,Z)}else if(De){let ke=G;for(let Xe=0;Xe<I.textures.length;Xe++){let $e=X.get(I.textures[Xe]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Xe,$e.__webglTexture,Z,ke)}}else if(I!==null&&Z!==0){let ke=X.get(I.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,ke.__webglTexture,Z)}ne=-1},this.readRenderTargetPixels=function(I,G,Z,Y,K,De,Ue,ke=0){if(!(I&&I.isWebGLRenderTarget)){lt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Xe=X.get(I).__webglFramebuffer;if(I.isWebGLCubeRenderTarget&&Ue!==void 0&&(Xe=Xe[Ue]),Xe){A.bindFramebuffer(N.FRAMEBUFFER,Xe);try{let $e=I.textures[ke],gt=$e.format,Et=$e.type;if(I.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+ke),!D.textureFormatReadable(gt)){lt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!D.textureTypeReadable(Et)){lt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=I.width-Y&&Z>=0&&Z<=I.height-K&&N.readPixels(G,Z,Y,K,Te.convert(gt),Te.convert(Et),De)}finally{let $e=J!==null?X.get(J).__webglFramebuffer:null;A.bindFramebuffer(N.FRAMEBUFFER,$e)}}},this.readRenderTargetPixelsAsync=async function(I,G,Z,Y,K,De,Ue,ke=0){if(!(I&&I.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Xe=X.get(I).__webglFramebuffer;if(I.isWebGLCubeRenderTarget&&Ue!==void 0&&(Xe=Xe[Ue]),Xe)if(G>=0&&G<=I.width-Y&&Z>=0&&Z<=I.height-K){A.bindFramebuffer(N.FRAMEBUFFER,Xe);let $e=I.textures[ke],gt=$e.format,Et=$e.type;if(I.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+ke),!D.textureFormatReadable(gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!D.textureTypeReadable(Et))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let je=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,je),N.bufferData(N.PIXEL_PACK_BUFFER,De.byteLength,N.STREAM_READ),N.readPixels(G,Z,Y,K,Te.convert(gt),Te.convert(Et),0);let Lt=J!==null?X.get(J).__webglFramebuffer:null;A.bindFramebuffer(N.FRAMEBUFFER,Lt);let nn=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await dm(N,nn,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,je),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,De),N.deleteBuffer(je),N.deleteSync(nn),De}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(I,G=null,Z=0){let Y=Math.pow(2,-Z),K=Math.floor(I.image.width*Y),De=Math.floor(I.image.height*Y),Ue=G!==null?G.x:0,ke=G!==null?G.y:0;j.setTexture2D(I,0),N.copyTexSubImage2D(N.TEXTURE_2D,Z,0,0,Ue,ke,K,De),A.unbindTexture()},this.copyTextureToTexture=function(I,G,Z=null,Y=null,K=0,De=0){let Ue,ke,Xe,$e,gt,Et,je,Lt,nn,Jt=I.isCompressedTexture?I.mipmaps[De]:I.image;if(Z!==null)Ue=Z.max.x-Z.min.x,ke=Z.max.y-Z.min.y,Xe=Z.isBox3?Z.max.z-Z.min.z:1,$e=Z.min.x,gt=Z.min.y,Et=Z.isBox3?Z.min.z:0;else{let sn=Math.pow(2,-K);Ue=Math.floor(Jt.width*sn),ke=Math.floor(Jt.height*sn),I.isDataArrayTexture?Xe=Jt.depth:I.isData3DTexture?Xe=Math.floor(Jt.depth*sn):Xe=1,$e=0,gt=0,Et=0}Y!==null?(je=Y.x,Lt=Y.y,nn=Y.z):(je=0,Lt=0,nn=0);let Ht=Te.convert(G.format),Mn=Te.convert(G.type),Ne;G.isData3DTexture?(j.setTexture3D(G,0),Ne=N.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(j.setTexture2DArray(G,0),Ne=N.TEXTURE_2D_ARRAY):(j.setTexture2D(G,0),Ne=N.TEXTURE_2D),A.activeTexture(N.TEXTURE0),A.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,G.flipY),A.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),A.pixelStorei(N.UNPACK_ALIGNMENT,G.unpackAlignment);let qn=A.getParameter(N.UNPACK_ROW_LENGTH),St=A.getParameter(N.UNPACK_IMAGE_HEIGHT),ni=A.getParameter(N.UNPACK_SKIP_PIXELS),Ci=A.getParameter(N.UNPACK_SKIP_ROWS),hs=A.getParameter(N.UNPACK_SKIP_IMAGES);A.pixelStorei(N.UNPACK_ROW_LENGTH,Jt.width),A.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Jt.height),A.pixelStorei(N.UNPACK_SKIP_PIXELS,$e),A.pixelStorei(N.UNPACK_SKIP_ROWS,gt),A.pixelStorei(N.UNPACK_SKIP_IMAGES,Et);let Mr=I.isDataArrayTexture||I.isData3DTexture,Bt=G.isDataArrayTexture||G.isData3DTexture;if(I.isDepthTexture){let sn=X.get(I),us=X.get(G),zt=X.get(sn.__renderTarget),ds=X.get(us.__renderTarget);A.bindFramebuffer(N.READ_FRAMEBUFFER,zt.__webglFramebuffer),A.bindFramebuffer(N.DRAW_FRAMEBUFFER,ds.__webglFramebuffer);for(let Sr=0;Sr<Xe;Sr++)Mr&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,X.get(I).__webglTexture,K,Et+Sr),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,X.get(G).__webglTexture,De,nn+Sr)),N.blitFramebuffer($e,gt,Ue,ke,je,Lt,Ue,ke,N.DEPTH_BUFFER_BIT,N.NEAREST);A.bindFramebuffer(N.READ_FRAMEBUFFER,null),A.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(K!==0||I.isRenderTargetTexture||X.has(I)){let sn=X.get(I),us=X.get(G);A.bindFramebuffer(N.READ_FRAMEBUFFER,B),A.bindFramebuffer(N.DRAW_FRAMEBUFFER,F);for(let zt=0;zt<Xe;zt++)Mr?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,sn.__webglTexture,K,Et+zt):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,sn.__webglTexture,K),Bt?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,us.__webglTexture,De,nn+zt):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,us.__webglTexture,De),K!==0?N.blitFramebuffer($e,gt,Ue,ke,je,Lt,Ue,ke,N.COLOR_BUFFER_BIT,N.NEAREST):Bt?N.copyTexSubImage3D(Ne,De,je,Lt,nn+zt,$e,gt,Ue,ke):N.copyTexSubImage2D(Ne,De,je,Lt,$e,gt,Ue,ke);A.bindFramebuffer(N.READ_FRAMEBUFFER,null),A.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else Bt?I.isDataTexture||I.isData3DTexture?N.texSubImage3D(Ne,De,je,Lt,nn,Ue,ke,Xe,Ht,Mn,Jt.data):G.isCompressedArrayTexture?N.compressedTexSubImage3D(Ne,De,je,Lt,nn,Ue,ke,Xe,Ht,Jt.data):N.texSubImage3D(Ne,De,je,Lt,nn,Ue,ke,Xe,Ht,Mn,Jt):I.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,De,je,Lt,Ue,ke,Ht,Mn,Jt.data):I.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,De,je,Lt,Jt.width,Jt.height,Ht,Jt.data):N.texSubImage2D(N.TEXTURE_2D,De,je,Lt,Ue,ke,Ht,Mn,Jt);A.pixelStorei(N.UNPACK_ROW_LENGTH,qn),A.pixelStorei(N.UNPACK_IMAGE_HEIGHT,St),A.pixelStorei(N.UNPACK_SKIP_PIXELS,ni),A.pixelStorei(N.UNPACK_SKIP_ROWS,Ci),A.pixelStorei(N.UNPACK_SKIP_IMAGES,hs),De===0&&G.generateMipmaps&&N.generateMipmap(Ne),A.unbindTexture()},this.initRenderTarget=function(I){X.get(I).__webglFramebuffer===void 0&&j.setupRenderTarget(I)},this.initTexture=function(I){I.isCubeTexture?j.setTextureCube(I,0):I.isData3DTexture?j.setTexture3D(I,0):I.isDataArrayTexture||I.isCompressedArrayTexture?j.setTexture2DArray(I,0):j.setTexture2D(I,0),A.unbindTexture()},this.resetState=function(){O=0,z=0,J=null,A.reset(),Ie.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return mi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Mt._getDrawingBufferColorSpace(e),t.unpackColorSpace=Mt._getUnpackColorSpace()}};function Ei(){return{throttle:0,brake:0,steer:0,drift:!1,useItem:!1,useItemHeld:!1,lookBack:!1,pause:!1,confirm:!1,back:!1,menuUp:!1,menuDown:!1,menuLeft:!1,menuRight:!1}}var Od=["banana","triple_banana","green_shell","triple_green_shell","red_shell","triple_red_shell","blue_shell","mushroom","triple_mushroom","golden_mushroom","star","lightning","bob_omb"];var zd=class{constructor(){E(this,"handlers",new Map)}on(e,t){let n=this.handlers.get(e);return n||(n=new Set,this.handlers.set(e,n)),n.add(t),()=>this.off(e,t)}once(e,t){let n=this.on(e,i=>{n(),t(i)});return n}off(e,t){this.handlers.get(e)?.delete(t)}emit(e,t){let n=this.handlers.get(e);if(n)for(let i of Array.from(n))try{i(t)}catch(r){console.error(`[events] handler for ${e} threw`,r)}}clear(){this.handlers.clear()}},$=new zd;var gr="TURBO KART RUSH";var oh=.008333333333333333,Gd=1/20,vr=26;var Oi=.85,ks=22,lo=12,Zm=3,Vd=1.6,Fa=1,$m=5,Jm=-30,xr=220;var jm=1;var qe=Math.PI*2;function at(s,e,t){return s<e?e:s>t?t:s}function Ye(s){return s<0?0:s>1?1:s}function rt(s,e,t){return s+(e-s)*t}function Zt(s,e,t){let n=Ye((t-s)/(e-s));return n*n*(3-2*n)}function pt(s,e,t,n){return rt(s,e,1-Math.exp(-t*n))}function Ha(s){return s=s%qe,s>Math.PI&&(s-=qe),s<-Math.PI&&(s+=qe),s}function Qm(s,e){return Ha(e-s)}function Dt(s){return s=s%1,s<0?s+1:s}function En(s,e){let t=Dt(e)-Dt(s);return t>.5&&(t-=1),t<-.5&&(t+=1),t}function Ti(s){let e=s>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function ah(s,e){let t=Math.imul(Math.floor(s)|0,374761393)+Math.imul(Math.floor(e)|0,668265263);return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function nT(s,e){let t=Math.floor(s),n=Math.floor(e),i=s-t,r=e-n,o=i*i*(3-2*i),a=r*r*(3-2*r),l=ah(t,n),c=ah(t+1,n),h=ah(t,n+1),u=ah(t+1,n+1);return rt(rt(l,c,o),rt(h,u,o),a)}function In(s,e,t=4,n=2,i=.5){let r=.5,o=1,a=0,l=0;for(let c=0;c<t;c++)a+=nT(s*o,e*o)*r,l+=r,r*=i,o*=n;return a/l}function lh(s){(!isFinite(s)||s<0)&&(s=0);let e=Math.floor(s/60),t=Math.floor(s%60),n=Math.floor(s*1e3%1e3);return`${e}:${t.toString().padStart(2,"0")}.${n.toString().padStart(3,"0")}`}function br(s){let e=["th","st","nd","rd"],t=s%100;return s+(e[(t-20)%10]||e[t]||e[0])}var Ba=new C;function ai(s,e,t,n,i,r){let o=2*Math.PI*i/4,a=Math.max(r-2*i,0),l=Math.PI/4;Ba.copy(e),Ba[n]=0,Ba.normalize();let c=.5*o/(o+a),h=1-Ba.angleTo(s)/l;return Math.sign(Ba[t])===1?h*c:a/(o+a)+c+c*(1-h)}var zi=class s extends be{constructor(e=1,t=1,n=1,i=2,r=.1){let o=i*2+1;if(r=Math.min(e/2,t/2,n/2,r),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:i,radius:r},o===1)return;let a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;let l=new C,c=new C,h=new C(e,t,n).divideScalar(2).subScalar(r),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,g=u.length/6,v=new C,p=.5/o;for(let m=0,y=0;m<u.length;m+=3,y+=2)switch(l.fromArray(u,m),c.copy(l),c.x-=Math.sign(c.x)*p,c.y-=Math.sign(c.y)*p,c.z-=Math.sign(c.z)*p,c.normalize(),u[m+0]=h.x*Math.sign(l.x)+c.x*r,u[m+1]=h.y*Math.sign(l.y)+c.y*r,u[m+2]=h.z*Math.sign(l.z)+c.z*r,d[m+0]=c.x,d[m+1]=c.y,d[m+2]=c.z,Math.floor(m/g)){case 0:v.set(1,0,0),f[y+0]=ai(v,c,"z","y",r,n),f[y+1]=1-ai(v,c,"y","z",r,t);break;case 1:v.set(-1,0,0),f[y+0]=1-ai(v,c,"z","y",r,n),f[y+1]=1-ai(v,c,"y","z",r,t);break;case 2:v.set(0,1,0),f[y+0]=1-ai(v,c,"x","z",r,e),f[y+1]=ai(v,c,"z","x",r,n);break;case 3:v.set(0,-1,0),f[y+0]=1-ai(v,c,"x","z",r,e),f[y+1]=1-ai(v,c,"z","x",r,n);break;case 4:v.set(0,0,1),f[y+0]=1-ai(v,c,"x","y",r,e),f[y+1]=1-ai(v,c,"y","x",r,t);break;case 5:v.set(0,0,-1),f[y+0]=ai(v,c,"x","y",r,e),f[y+1]=1-ai(v,c,"y","x",r,t);break}}static fromJSON(e){return new s(e.width,e.height,e.depth,e.segments,e.radius)}};function Ds(s,e=!1){let t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},o={},a=s[0].morphTargetsRelative,l=new dt,c=0;for(let h=0;h<s.length;++h){let u=s[h],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(e){let f;if(t)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(t){let h=0,u=[];for(let d=0;d<s.length;++d){let f=s[d].index;for(let g=0;g<f.count;++g)u.push(f.getX(g)+h);h+=s[d].attributes.position.count}l.setIndex(u)}for(let h in r){let u=e0(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){let f=[];for(let v=0;v<o[h].length;++v)f.push(o[h][v][d]);let g=e0(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}}return l}function e0(s){let e,t,n,i=-1,r=0;for(let c=0;c<s.length;++c){let h=s[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}let o=new e(r),a=new ot(o,t,n),l=0;for(let c=0;c<s.length;++c){let h=s[c];if(h.isInterleavedBufferAttribute){let u=l/t;for(let d=0,f=h.count;d<f;d++)for(let g=0;g<t;g++){let v=h.getComponent(d,g);a.setComponent(d+u,g,v)}}else o.set(h.array,l);l+=h.count*t}return i!==void 0&&(a.gpuType=i),a}function Wd(s,e=1e-4){e=Math.max(e,Number.EPSILON);let t={},n=s.getIndex(),i=s.getAttribute("position"),r=n?n.count:i.count,o=0,a=Object.keys(s.attributes),l={},c={},h=[],u=["getX","getY","getZ","getW"],d=["setX","setY","setZ","setW"];for(let y=0,_=a.length;y<_;y++){let x=a[y],S=s.attributes[x];l[x]=new S.constructor(new S.array.constructor(S.count*S.itemSize),S.itemSize,S.normalized);let M=s.morphAttributes[x];M&&(c[x]||(c[x]=[]),M.forEach((w,b)=>{let R=new w.array.constructor(w.count*w.itemSize);c[x][b]=new w.constructor(R,w.itemSize,w.normalized)}))}let f=e*.5,g=Math.log10(1/e),v=Math.pow(10,g),p=f*v;for(let y=0;y<r;y++){let _=n?n.getX(y):y,x="";for(let S=0,M=a.length;S<M;S++){let w=a[S],b=s.getAttribute(w),R=b.itemSize;for(let P=0;P<R;P++)x+=`${~~(b[u[P]](_)*v+p)},`}if(x in t)h.push(t[x]);else{for(let S=0,M=a.length;S<M;S++){let w=a[S],b=s.getAttribute(w),R=s.morphAttributes[w],P=b.itemSize,k=l[w],L=c[w];for(let H=0;H<P;H++){let B=u[H],F=d[H];if(k[F](o,b[B](_)),R)for(let O=0,z=R.length;O<z;O++)L[O][F](o,R[O][B](_))}}t[x]=o,h.push(o),o++}}let m=s.clone();for(let y in s.attributes){let _=l[y];if(m.setAttribute(y,new _.constructor(_.array.slice(0,o*_.itemSize),_.itemSize,_.normalized)),y in c)for(let x=0;x<c[y].length;x++){let S=c[y][x];m.morphAttributes[y][x]=new S.constructor(S.array.slice(0,o*S.itemSize),S.itemSize,S.normalized)}}return m.setIndex(h),m}var Gi=[{id:"zippy",name:"Zippy Nova",color:2086638,accent:16727988,driverColor:16251391,weightClass:"light",stats:{speed:.18,acceleration:.95,handling:.9,weight:.12,miniTurbo:.9},tagline:"Blink and she is already two corners ahead."},{id:"pixel",name:"Pixel Pop",color:16732067,accent:5111747,driverColor:16773544,weightClass:"light",stats:{speed:.12,acceleration:.9,handling:.95,weight:.08,miniTurbo:.85},tagline:"Sugar-rush handling. Corners are her candy."},{id:"fennec",name:"Fennec Flash",color:16764703,accent:16738816,driverColor:2824978,weightClass:"light",stats:{speed:.25,acceleration:.85,handling:.8,weight:.2,miniTurbo:.95},tagline:"Big ears, bigger mini-turbos."},{id:"max",name:"Max Vortex",color:14885410,accent:16765503,driverColor:16777215,weightClass:"medium",stats:{speed:.55,acceleration:.55,handling:.55,weight:.5,miniTurbo:.55},tagline:"The all-rounder. Every lap is a highlight reel."},{id:"juno",name:"Juno Bolt",color:8141549,accent:16756768,driverColor:1446694,weightClass:"medium",stats:{speed:.6,acceleration:.45,handling:.5,weight:.55,miniTurbo:.65},tagline:"Charges every drift like a thunderstorm."},{id:"kai",name:"Kai Tidewater",color:1993727,accent:16742938,driverColor:14677759,weightClass:"medium",stats:{speed:.5,acceleration:.6,handling:.65,weight:.45,miniTurbo:.5},tagline:"Cool as the deep end, smooth as a swell."},{id:"bram",name:"Boulder Bram",color:2071115,accent:14191164,driverColor:5913377,weightClass:"heavy",stats:{speed:.92,acceleration:.2,handling:.25,weight:.95,miniTurbo:.3},tagline:"Slow to wake up. Impossible to shove."},{id:"rosa",name:"Big Rig Rosa",color:16738816,accent:1692613,driverColor:2763316,weightClass:"heavy",stats:{speed:1,acceleration:.15,handling:.3,weight:.9,miniTurbo:.35},tagline:"Eighteen wheels of attitude in a four-wheel kart."}];function qd(s){for(let e=0;e<Gi.length;e++)if(Gi[e].id===s)return Gi[e];return Gi[0]}var ch=.2,hh=.22,iT=.18,sT=.22,Ls=.52,t0=-.52,n0=.5,i0=.64,s0=new xt,rT=new C,oT=new wt,aT=new Ft,lT=new C,li=class{constructor(){E(this,"parts",[])}add(e,t=0,n=0,i=0,r=0,o=0,a=0,l=1,c=1,h=1){let u=e.clone();if(!u.index){let d=Wd(u);u.dispose(),u=d}return s0.compose(rT.set(t,n,i),oT.setFromEuler(aT.set(r,o,a)),lT.set(l,c,h)),u.applyMatrix4(s0),this.parts.push(u),this}build(){let e=Ds(this.parts,!1);for(let t of this.parts)t.dispose();return this.parts.length=0,e}};function Fn(s,e,t){let n=new xe(s,e);return n.castShadow=!0,n.receiveShadow=!1,n.name=t,n}function uh(s,e,t,n,i,r,o,a=8){let l=new C(n-s,i-e,r-t),c=l.length(),h=new Yr(o,Math.max(.001,c),2,a),u=new wt().setFromUnitVectors(new C(0,1,0),l.normalize());return h.applyQuaternion(u),h.translate((s+n)*.5,(e+i)*.5,(t+r)*.5),h}function r0(s,e){let t=new ae(e),n=s.attributes.position.count,i=new Float32Array(n*3);for(let r=0;r<n;r++)i[r*3]=t.r,i[r*3+1]=t.g,i[r*3+2]=t.b;return s.setAttribute("color",new ot(i,3)),s}function cT(s){let e=Zt(-.92,-.18,s),t=Zt(.25,.86,s);return rt(.5,1,e)*rt(1,.8,t)}function hT(){let s=new xi;s.moveTo(-.76,.17),s.lineTo(.74,.17),s.quadraticCurveTo(.86,.17,.86,.27),s.quadraticCurveTo(.86,.36,.72,.39),s.lineTo(.36,.46),s.quadraticCurveTo(.18,.5,.12,.44),s.lineTo(.06,.31),s.lineTo(-.4,.31),s.lineTo(-.48,.42),s.lineTo(-.7,.42),s.quadraticCurveTo(-.8,.42,-.8,.32);let e=new ar(s,{depth:i0,bevelEnabled:!0,bevelThickness:.035,bevelSize:.03,bevelSegments:3,curveSegments:5});e.rotateY(Math.PI/2),e.translate(-i0/2,0,0),e.deleteAttribute("normal"),e.deleteAttribute("uv");let t=Wd(e,.001);e.dispose();let n=t.attributes.position;for(let i=0;i<n.count;i++){let r=n.getZ(i);n.setX(i,n.getX(i)*cT(r))}return n.needsUpdate=!0,t.computeVertexNormals(),t.setAttribute("uv",new ot(new Float32Array(n.count*2),2)),t}function uT(s,e,t){let i=document.createElement("canvas");i.width=128,i.height=128;let r=i.getContext("2d");if(r){let a="#"+e.toString(16).padStart(6,"0"),l=new ae(t).multiplyScalar(.28),c=22;r.clearRect(0,0,128,128),r.fillStyle="#f8f9fc",r.beginPath(),r.roundRect(4,4,120,120,c),r.fill(),r.lineWidth=10,r.strokeStyle=a,r.stroke(),r.fillStyle="#"+l.getHexString(),r.font='bold 88px system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',r.textAlign="center",r.textBaseline="middle",r.fillText(String(s),128/2,128/2+6)}let o=new _n(i);return o.colorSpace=Nt,o.anisotropy=4,o.needsUpdate=!0,o}function o0(s,e){let t=e*.5,n=new li,i=r0(new hn(s-t,t,8,16),1381658);n.add(i,0,0,0,0,Math.PI/2,0),i.dispose();let r=r0(new We(s*1.005,s*1.005,e*.42,22,1,!0),2894899);n.add(r,0,0,0,0,0,Math.PI/2),r.dispose();let o=new li,a=s*.58,l=e*.72,c=new We(a,a,l,14);o.add(c,0,0,0,0,0,Math.PI/2),c.dispose();let h=new be(l+.03,s*.5,.035);h.translate(0,s*.3,0);for(let d=0;d<5;d++)o.add(h,0,0,0,d/5*Math.PI*2,0,0);h.dispose();let u=new ft(s*.22,10,7);return o.add(u,0,0,0,0,0,0,1.6,1,1),u.dispose(),{tyre:n.build(),rim:o.build()}}function a0(s){let e=new Qe;e.name=`kart-${s.id}`;let t=new Set,n=new Set,i=new Set,r=pe=>(t.add(pe),pe),o=pe=>(n.add(pe),pe),a=o(new lr({color:s.color,metalness:.2,roughness:.32,clearcoat:1,clearcoatRoughness:.1})),l=o(new He({color:s.accent,metalness:.45,roughness:.3,emissive:s.accent,emissiveIntensity:.32})),c=o(new He({color:16777215,metalness:1,roughness:.18,emissive:4870232,emissiveIntensity:1})),h=o(new He({color:3817288,metalness:.55,roughness:.5})),u=o(new He({color:1776416,roughness:.9,metalness:.05})),d=o(new He({vertexColors:!0,roughness:.92,metalness:0})),f=o(new He({color:13620960,metalness:.7,roughness:.3,emissive:2764340,emissiveIntensity:1})),g=o(new He({color:1842211,roughness:.88,metalness:.05,side:bt})),v=o(new He({color:s.color,roughness:.62,metalness:.08})),p=o(new lr({color:s.driverColor,metalness:.15,roughness:.28,clearcoat:1,clearcoatRoughness:.08})),m=o(new lr({color:660516,metalness:.55,roughness:.06,clearcoat:1,clearcoatRoughness:.04})),y=o(new He({color:1181701,emissive:16742938,emissiveIntensity:0,roughness:.6})),_=Math.max(1,Gi.indexOf(s)+1),x=uT(_,s.accent,s.color);i.add(x);let S=o(new He({map:x,roughness:.45,metalness:.05})),M=new li,w=hT();M.add(w),w.dispose();let b=new zi(.28,.16,.74,1,.05);M.add(b,Ls-.03,.24,.02),M.add(b,-Ls+.03,.24,.02),b.dispose();let R=Fn(r(M.build()),a,"body");R.receiveShadow=!0,e.add(R);let P=new li,k=new zi(.98,.06,1.34,1,.02);P.add(k,0,.13,-.02),k.dispose();let L=new zi(.4,.24,.26,1,.04);P.add(L,0,.55,.66),L.dispose();let H=new be(.04,.04,.14);P.add(H,.17,.19,-.76),P.add(H,-.17,.19,-.76),H.dispose();let B=uh(0,.46,-.3,0,.6,-.08,.022,8);P.add(B),B.dispose();let F=new be(.04,.26,.05);P.add(F,.3,.575,.68),P.add(F,-.3,.575,.68),F.dispose(),e.add(Fn(r(P.build()),h,"darkParts"));let O=new li,z=new zi(.3,.1,.16,1,.03);O.add(z,0,.7,.64),z.dispose();let J=new We(.07,.07,.12,12);O.add(J,-.12,.7,.74,0,0,Math.PI/2),J.dispose(),e.add(Fn(r(O.build()),c,"chromeParts"));let ne=[],ue=r(new We(.046,.052,.28,12,1,!1));ue.translate(0,.14,0),ue.rotateX(Math.PI/2);let fe=r(new Bi(.04,12));fe.translate(0,0,.283);for(let pe of[-1,1]){let te=new Qe;te.name="exhaust",te.position.set(pe*.17,.5,.64),te.rotation.x=-.16,te.add(Fn(ue,c,"pipe"));let Te=Fn(fe,y,"exhaustGlow");Te.castShadow=!1,te.add(Te),e.add(te),ne.push(te)}let me=new li,Ke=new zi(.94,.035,.24,1,.015);me.add(Ke,0,.71,.72,-.22,0,0),Ke.dispose();let Le=new be(.025,.11,.26);me.add(Le,.47,.72,.72,-.22,0,0),me.add(Le,-.47,.72,.72,-.22,0,0),Le.dispose();let ye=Math.PI*.9,W=new hn(.33,.03,6,18,ye);W.rotateX(Math.PI/2),W.rotateY(ye/2+Math.PI/2),me.add(W,0,.19,-.5),W.dispose();let se=new be(.05,.014,.62);me.add(se,Ls-.03,.325,.02),me.add(se,-Ls+.03,.325,.02),se.dispose();let ie=new be(.06,.012,.36);me.add(ie,0,.465,-.54,-.19,0,0),ie.dispose();let _e=new be(.42,.03,.02);me.add(_e,0,.27,.815,.25,0,0),_e.dispose();let Me=new ft(.05,8,6);me.add(Me,.13,.605,-.08),me.add(Me,-.13,.605,-.08),Me.dispose(),e.add(Fn(r(me.build()),l,"accentParts"));let Ee=new li,Ge=new Ut(.22,.16);Ee.add(Ge,0,.29,-.9,.08,Math.PI,0),Ge.dispose();let Fe=new Ut(.18,.11);Ee.add(Fe,.636,.24,.02,0,Math.PI/2,0),Ee.add(Fe,-.636,.24,.02,0,-Math.PI/2,0),Fe.dispose();let re=Fn(r(Ee.build()),S,"plates");re.castShadow=!1,e.add(re);let he=new li,le=new We(.23,.21,.42,14,1,!0,-Math.PI/2,Math.PI);he.add(le,0,.57,.3,.12,0,0),le.dispose();let Se=new zi(.46,.09,.4,1,.03);he.add(Se,0,.37,.16),Se.dispose();let we=new zi(.2,.12,.08,1,.03);he.add(we,0,.84,.4),we.dispose(),e.add(Fn(r(he.build()),g,"seat"));let Je=new Qe;Je.position.set(0,.61,-.07),Je.rotation.x=-.53;let Ve=new Qe;Ve.name="steeringWheel";let nt=new li,ct=new hn(.13,.022,6,20);nt.add(ct),ct.dispose();let N=new We(.035,.035,.03,12);nt.add(N,0,0,0,Math.PI/2,0,0),N.dispose();let Rt=new be(.03,.11,.015);Rt.translate(0,.07,0);for(let pe of[Math.PI,Math.PI/6,-Math.PI/6])nt.add(Rt,0,0,0,0,0,pe);Rt.dispose(),Ve.add(Fn(r(nt.build()),u,"steeringWheelMesh")),Je.add(Ve),e.add(Je);let mt=o0(ch,iT),D=o0(hh,sT);r(mt.tyre),r(mt.rim),r(D.tyre),r(D.rim);let A=[],V=[],X=[],j=(pe,te,Te,Ie,ce)=>{let ze=new Qe;ze.position.set(te,Te,Ie);let Be=new Qe;Be.name="wheel",Be.add(Fn(pe.tyre,d,"tyre")),Be.add(Fn(pe.rim,f,"rim")),ze.add(Be),e.add(ze),A.push(Be),X.push(ce?ch:hh),ce&&V.push(ze)};j(mt,-Ls,ch,t0,!0),j(mt,Ls,ch,t0,!0),j(D,-Ls,hh,n0,!1),j(D,Ls,hh,n0,!1);let ge=new Qe;ge.name="driver",ge.position.set(0,.41,.18);let ve=new li,ee=new Yr(.15,.1,3,12);ve.add(ee,0,.2,.02,0,0,0,1.1,1,.75),ee.dispose();let oe=new ft(.075,8,6);ve.add(oe,.2,.33,.02),ve.add(oe,-.2,.33,.02),oe.dispose();for(let pe of[-1,1]){let te=uh(pe*.2,.33,.02,pe*.21,.2,-.13,.05);ve.add(te),te.dispose();let Te=uh(pe*.21,.2,-.13,pe*.13,.195,-.26,.045);ve.add(Te),Te.dispose();let Ie=uh(pe*.1,.02,-.02,pe*.13,-.03,-.34,.06);ve.add(Ie),Ie.dispose()}let Re=new We(.05,.06,.1,8);ve.add(Re,0,.36,.02),Re.dispose(),ge.add(Fn(r(ve.build()),v,"suit"));let Oe=new Qe;Oe.name="driverHead",Oe.position.set(0,.4,.02);let Ce=r(new ft(.155,16,12));Ce.translate(0,.14,0),Oe.add(Fn(Ce,p,"helmet"));let Ae=r(new ft(.16,12,6,Math.PI*1.18,Math.PI*.64,Math.PI*.36,Math.PI*.26));Ae.translate(0,.14,0);let Ze=Fn(Ae,m,"visor");Ze.castShadow=!1,Oe.add(Ze);let et=r(new hn(.152,.012,5,20,Math.PI*1.1));et.rotateZ(-Math.PI*.05),et.rotateY(Math.PI/2),et.translate(0,.14,0);let ht=Fn(et,l,"helmetStripe");return ht.castShadow=!1,Oe.add(ht),ge.add(Oe),e.add(ge),{root:e,body:R,wheels:A,frontWheels:V,steeringWheel:Ve,driver:ge,driverHead:Oe,exhausts:ne,bodyMaterial:a,accentMaterial:l,exhaustGlowMaterial:y,wheelRadii:X,dispose:()=>{for(let pe of t)pe.dispose();for(let pe of n)pe.dispose();for(let pe of i)pe.dispose();t.clear(),n.clear(),i.clear(),e.removeFromParent()}}}var dT=9,fT=2.2,pT=45,mT=7,l0=10,c0=2,gT=16,vT=4.5,xT=.35,bT=5,yT=1.9,_T=1.9,ET=4.5,TT=.15,MT=.45,ST=.3,wT=.49,RT=.965,Na=[1,2,3.2],AT=[0,.7,1.2,1.8],CT=.4,h0=1.1,IT=8,PT=4,u0=.3,kT=Oi*.6,DT=.55,LT=.65,FT=1.2,HT=.5,BT=.12,NT=1,d0=.32,UT=[0,5093631,16753981,13921279],dh=new C(0,1,0),Xd=new C,f0=new C,p0=new C,m0=new wt,g0=new wt,v0=new Ft,g3=new ae,OT={t:0,surface:"road",groundY:0,groundNormal:new C(0,1,0),lateral:0,halfWidth:6,wallHalfWidth:7,tangent:new C(0,0,-1),binormal:new C(1,0,0),center:new C};function Yd(s,e){return s>0?Math.max(0,s-e):s<0?Math.min(0,s+e):0}var Fs=class{constructor(e,t,n){E(this,"state");E(this,"object");E(this,"input",Ei());E(this,"parts");E(this,"visual");E(this,"lateralVel",0);E(this,"vy",0);E(this,"freeY",0);E(this,"slip",0);E(this,"groundVy",0);E(this,"lastGroundY",0);E(this,"hasGroundSample",!1);E(this,"groundNormal",new C(0,1,0));E(this,"absCharge",0);E(this,"hopTimer",0);E(this,"prevDriftHeld",!1);E(this,"padCooldown",0);E(this,"wallCooldown",0);E(this,"collisionCooldown",new Float32Array(32));E(this,"frozenThrottleTime",0);E(this,"disposed",!1);E(this,"time",0);E(this,"visYawOffset",0);E(this,"visRoll",0);E(this,"visPitch",0);E(this,"visSquash",0);E(this,"visSquashVel",0);E(this,"visShrink",1);E(this,"visSquishY",1);E(this,"visGlow",0);E(this,"visHeadYaw",0);E(this,"visHeadLean",0);E(this,"accelEst",0);E(this,"prevSpeedVis",0);E(this,"pendingLandImpact",0);E(this,"pendingHop",!1);E(this,"starVisualActive",!1);E(this,"accentStage",-1);this.state={id:e,isPlayer:n,character:t,position:new C,quaternion:new wt,velocity:new C,speed:0,heading:0,steerVisual:0,isDrifting:!1,driftDirection:0,driftCharge:0,driftStage:0,isBoosting:!1,boostTimer:0,boostStrength:0,isAirborne:!1,airTime:0,isHopping:!1,isSpinning:!1,spinTimer:0,isSquished:!1,squishTimer:0,isInvincible:!1,starTimer:0,isShrunk:!1,shrinkTimer:0,isFrozen:!1,lap:0,checkpointIndex:0,trackT:0,raceProgress:0,place:e+1,finished:!1,finishTime:0,wrongWay:!1,item:"none",itemCount:0,itemRouletteActive:!1,surface:"road",wheelSpin:0},this.parts=a0(t),this.visual=this.parts.root,this.object=new Qe,this.object.name=`kart-${e}-${t.id}`,this.object.add(this.visual)}setInput(e){let t=this.input;t.throttle=Ye(e.throttle),t.brake=Ye(e.brake),t.steer=at(e.steer,-1,1),t.drift=e.drift,t.useItem=e.useItem,t.useItemHeld=e.useItemHeld,t.lookBack=e.lookBack,t.pause=e.pause,t.confirm=e.confirm,t.back=e.back,t.menuUp=e.menuUp,t.menuDown=e.menuDown,t.menuLeft=e.menuLeft,t.menuRight=e.menuRight}cancelControls(){Object.assign(this.input,Ei()),this.endDrift(!1),this.absCharge=0,this.prevDriftHeld=!1,this.pendingHop=!1,this.frozenThrottleTime=0}update(e,t,n){if(e<=0||this.disposed)return;let i=this.state;if(this.tickTimers(e),this.syncFromVelocity(),i.isFrozen){i.speed=0,this.lateralVel=0,this.slip=0,this.frozenThrottleTime=this.input.throttle>.5?this.frozenThrottleTime+e:0,i.steerVisual=pt(i.steerVisual,this.input.steer,10,e),this.vy-=vr*e,this.freeY+=this.vy*e,this.composeVelocity(),this.resolveTrack(e,t),this.syncFromVelocity(),this.writeQuaternion();return}let r=this.topSpeed(),o=!i.isSpinning;i.steerVisual=pt(i.steerVisual,o?this.input.steer:0,12,e),this.updateSpeed(e,r,o),this.updateHopDrift(e,o),this.updateYaw(e,o);let a=i.isDrifting?i.driftDirection*wT*(.75+.25*Ye(this.input.steer*i.driftDirection)):0;if(this.slip=pt(this.slip,a,i.isDrifting?5:7,e),!i.isAirborne){let l=i.surface==="offroad"?PT:IT;this.lateralVel=pt(this.lateralVel,0,l,e)}this.vy-=vr*e,this.freeY+=this.vy*e,this.composeVelocity(),i.position.x+=i.velocity.x*e,i.position.z+=i.velocity.z*e,this.resolveTrack(e,t),this.resolveKarts(n),this.syncFromVelocity(),this.writeQuaternion()}updateVisuals(e){if(this.disposed)return;e=at(e,0,.1);let t=this.state,n=this.parts;if(this.time+=e,this.object.position.copy(t.position),this.object.quaternion.copy(t.quaternion),e>1e-4){let b=(t.speed-this.prevSpeedVis)/e;this.accelEst=pt(this.accelEst,at(b,-30,40),6,e)}this.prevSpeedVis=t.speed;let i=n.wheelRadii[0]||.2;t.wheelSpin+=t.speed/i*e,t.wheelSpin>qe?t.wheelSpin-=qe:t.wheelSpin<0&&(t.wheelSpin+=qe);let r=n.wheels;for(let b=0;b<r.length;b++)r[b].rotation.x=-t.wheelSpin*(i/(n.wheelRadii[b]||i));let o=-t.steerVisual*.42,a=n.frontWheels;for(let b=0;b<a.length;b++)a[b].rotation.y=o;n.steeringWheel.rotation.z=-t.steerVisual*1.2;let l=Ye(Math.abs(t.speed)/ks),c=t.isDrifting?-t.driftDirection*.16:0;this.visYawOffset=pt(this.visYawOffset,c,6,e);let h=t.steerVisual*.06*l+(t.isDrifting?t.driftDirection*.05:0);this.visRoll=pt(this.visRoll,h,8,e);let u=at(this.accelEst*.008,-.08,.06);t.isAirborne&&(u+=at(t.velocity.y*.035,-.3,.3)),this.visPitch=pt(this.visPitch,u,6,e);let d=0,f=0;if(t.isSpinning){let b=Ye(1-t.spinTimer/h0);d=(1-(1-b)*(1-b))*qe,f=Math.sin(b*Math.PI)*.22}this.pendingHop&&(this.visSquashVel+=2.2,this.pendingHop=!1),this.pendingLandImpact>0&&(this.visSquashVel-=Math.min(4,this.pendingLandImpact*.7),this.pendingLandImpact=0),this.visSquashVel+=(-180*this.visSquash-14*this.visSquashVel)*e,this.visSquash=at(this.visSquash+this.visSquashVel*e,-.35,.35);let g=1+this.visSquash,v=1-this.visSquash*.5;this.visSquishY=pt(this.visSquishY,t.isSquished?.35:1,12,e);let p=1+(1-this.visSquishY)*.45;this.visShrink=pt(this.visShrink,t.isShrunk?.55:1,8,e);let m=this.visual;m.scale.set(v*p*this.visShrink,g*this.visSquishY*this.visShrink,v*p*this.visShrink),m.position.y=f,v0.set(this.visPitch,this.visYawOffset+d,this.visRoll,"YXZ"),m.quaternion.setFromEuler(v0);let y=-t.steerVisual*.5-(t.isDrifting?t.driftDirection*.35:0);this.visHeadYaw=pt(this.visHeadYaw,y,8,e);let _=-t.steerVisual*.15-(t.isDrifting?t.driftDirection*.08:0);if(this.visHeadLean=pt(this.visHeadLean,_,8,e),n.driverHead.rotation.set(0,this.visHeadYaw,this.visHeadLean),n.driver.rotation.set(at(this.accelEst*.004,-.08,.1),0,this.visHeadLean*.35),t.isInvincible){let b=this.time*1.6%1;n.bodyMaterial.emissive.setHSL(b,1,.5),n.bodyMaterial.emissiveIntensity=.85,n.accentMaterial.emissiveIntensity=1.8,this.starVisualActive=!0,this.accentStage=-1}else this.starVisualActive&&(n.bodyMaterial.emissive.setRGB(0,0,0),n.bodyMaterial.emissiveIntensity=1,n.accentMaterial.emissiveIntensity=d0,this.starVisualActive=!1);if(!t.isInvincible){let b=t.isDrifting?t.driftStage:0;b!==this.accentStage&&(this.accentStage=b,b===0?(n.accentMaterial.emissive.setHex(t.character.accent),n.accentMaterial.emissiveIntensity=d0):(n.accentMaterial.emissive.setHex(UT[b]),n.accentMaterial.emissiveIntensity=1.1))}this.visGlow=pt(this.visGlow,t.isBoosting?1:0,10,e);let x=.75+.25*Math.sin(this.time*47)*Math.sin(this.time*31+1);n.exhaustGlowMaterial.emissiveIntensity=this.visGlow*3*x;let S=n.exhausts,M=1+.12*this.visGlow*x,w=1+.25*this.visGlow*x;for(let b=0;b<S.length;b++)S[b].scale.set(M,M,w)}applyBoost(e,t,n){let i=this.state;e<=0||t<=0||(i.isBoosting=!0,i.boostStrength=Math.max(i.boostStrength,e),i.boostTimer=Math.max(i.boostTimer,t),$.emit("kart:boost",{kartId:i.id,strength:e,duration:t,source:n}))}applyHit(e,t){let n=this.state;return n.isInvincible||n.isSpinning?!1:(n.isSpinning=!0,n.spinTimer=h0,n.isDrifting&&this.endDrift(!1),n.isBoosting=!1,n.boostTimer=0,n.boostStrength=0,this.syncFromVelocity(),n.speed*=.15,this.lateralVel*=.5,e==="explosion"&&(this.vy=Math.max(this.vy,6),this.freeY=n.position.y+.01,n.isAirborne=!0,n.airTime=0),this.composeVelocity(),$.emit("kart:spin",{kartId:n.id,cause:e,sourceKartId:t}),!0)}applySquish(e){let t=this.state;if(t.isInvincible||e<=0)return;let n=t.isSquished;t.isSquished=!0,t.squishTimer=Math.max(t.squishTimer,e),t.isDrifting&&this.endDrift(!1),n||$.emit("kart:squish",{kartId:t.id})}applyStar(e){let t=this.state;if(e<=0)return;let n=t.isInvincible;t.isInvincible=!0,t.starTimer=Math.max(t.starTimer,e),t.isSpinning&&(t.isSpinning=!1,t.spinTimer=0),n||$.emit("kart:starStart",{kartId:t.id})}applyShrink(e){let t=this.state;if(t.isInvincible||e<=0)return;let n=t.isShrunk;t.isShrunk=!0,t.shrinkTimer=Math.max(t.shrinkTimer,e),n||$.emit("kart:shrink",{kartId:t.id})}applyImpulse(e){let t=this.state;t.isFrozen||(t.velocity.add(e),e.y>.5&&!t.isAirborne&&(this.freeY=t.position.y+.01))}setFrozen(e){let t=this.state;if(t.isFrozen&&!e){let n=this.frozenThrottleTime;n>0&&n<.45&&this.applyBoost(.3,1.2,"start")}t.isFrozen=e,e&&(t.isDrifting&&this.endDrift(!1),t.speed=0,t.velocity.set(0,0,0),this.lateralVel=0,this.slip=0,this.frozenThrottleTime=0)}resetTo(e,t){let n=this.state;n.position.copy(e),n.quaternion.copy(t),Xd.set(0,0,-1).applyQuaternion(t),n.heading=Math.atan2(-Xd.x,-Xd.z),n.velocity.set(0,0,0),n.speed=0,this.lateralVel=0,this.vy=0,this.slip=0,this.freeY=e.y,this.groundVy=0,this.lastGroundY=e.y,this.hasGroundSample=!1,this.groundNormal.set(0,1,0),n.isAirborne=!1,n.airTime=0,n.isHopping=!1,this.hopTimer=0,this.prevDriftHeld=!0,n.isDrifting&&this.endDrift(!1),n.isBoosting=!1,n.boostTimer=0,n.boostStrength=0,n.isSpinning=!1,n.spinTimer=0,n.steerVisual=0,this.padCooldown=.5,this.wallCooldown=0,this.visYawOffset=0,this.visRoll=0,this.visPitch=0,this.visSquash=0,this.visSquashVel=0,this.accelEst=0,this.prevSpeedVis=0,this.pendingLandImpact=0,this.pendingHop=!1,this.writeQuaternion(),this.object.position.copy(n.position),this.object.quaternion.copy(n.quaternion)}forwardDir(e){return(e??new C).set(0,0,-1).applyQuaternion(this.state.quaternion)}topSpeed(){let e=this.state,t=this.baseTopSpeed(),n=e.isBoosting||e.isInvincible;return e.surface==="offroad"&&!n&&(t*=DT),e.isShrunk&&(t*=LT),e.isInvincible&&(t*=FT),e.isBoosting&&(t*=1+e.boostStrength),e.isSquished&&(t*=HT),t}dispose(){this.disposed||(this.disposed=!0,this.parts.dispose(),this.object.removeFromParent())}baseTopSpeed(){return ks*(.93+.14*this.state.character.stats.speed)}tickTimers(e){let t=this.state;t.isBoosting&&(t.boostTimer-=e,t.boostTimer<=0&&(t.isBoosting=!1,t.boostTimer=0,t.boostStrength=0)),t.isSpinning&&(t.spinTimer-=e,t.spinTimer<=0&&(t.isSpinning=!1,t.spinTimer=0)),t.isSquished&&(t.squishTimer-=e,t.squishTimer<=0&&(t.isSquished=!1,t.squishTimer=0)),t.isInvincible&&(t.starTimer-=e,t.starTimer<=0&&(t.isInvincible=!1,t.starTimer=0,$.emit("kart:starEnd",{kartId:t.id}))),t.isShrunk&&(t.shrinkTimer-=e,t.shrinkTimer<=0&&(t.isShrunk=!1,t.shrinkTimer=0,$.emit("kart:unshrink",{kartId:t.id}))),this.padCooldown>0&&(this.padCooldown-=e),this.wallCooldown>0&&(this.wallCooldown-=e);let n=this.collisionCooldown;for(let i=0;i<n.length;i++)n[i]>0&&(n[i]-=e)}syncFromVelocity(){let e=this.state,t=e.heading+this.slip,n=Math.sin(t),i=Math.cos(t),r=e.velocity.x,o=e.velocity.z;e.speed=-r*n-o*i,this.lateralVel=r*i-o*n,this.vy=e.velocity.y}composeVelocity(){let e=this.state,t=e.heading+this.slip,n=Math.sin(t),i=Math.cos(t);e.velocity.x=-n*e.speed+i*this.lateralVel,e.velocity.z=-i*e.speed-n*this.lateralVel,e.velocity.y=this.vy}updateSpeed(e,t,n){let i=this.state,r=this.input,o=i.speed;if(i.isAirborne&&!i.isHopping){o=Yd(o,.4*e),i.speed=o;return}if(!n){o=Yd(o,6*e),i.speed=o;return}let a=dT*(.5+i.character.stats.acceleration),l=i.isBoosting?1:r.throttle,c=r.brake;if(c>.05&&o>.3&&c>=l)o=Math.max(0,o-gT*c*e);else if(l>.05&&l>=c){let h=t*l;if(i.isDrifting&&(h*=RT),o<h){let u=i.isBoosting?pT:a,d=i.isBoosting?mT:fT;o+=Math.min(u,(h-o)*d+.8)*e,o>h&&(o=h)}else o+=Math.max(-l0,(h-o)*c0)*e,o<h&&(o=h)}else if(c>.05){let h=-xT*t*c;o>h?(o-=Math.min(bT,(o-h)*2+.5)*e,o<h&&(o=h)):o+=Math.min(6,(h-o)*2)*e}else o=Yd(o,(vT+.06*Math.abs(o))*e),o>t&&(o+=Math.max(-l0,(t-o)*c0)*e,o<t&&(o=t));i.speed=o}updateHopDrift(e,t){let n=this.state,i=this.input,r=this.baseTopSpeed(),o=t&&i.drift,a=o&&!this.prevDriftHeld;if(this.prevDriftHeld=o,n.isHopping&&(this.hopTimer+=e),a&&!n.isAirborne&&Math.abs(n.speed)>.3*r&&this.hop(),!n.isDrifting&&o&&n.isHopping&&this.hopTimer>=TT&&this.tryStartDrift(),!!n.isDrifting){if(!o)this.endDrift(!0);else if(Math.abs(n.speed)<ST*r)this.endDrift(!1);else if(n.isAirborne&&(!n.isHopping&&n.airTime>.4||n.airTime>.9))this.endDrift(!1);else if(!n.isAirborne){let l=Ye(i.steer*n.driftDirection);this.absCharge+=(.55+.6*n.character.stats.miniTurbo)*(.6+.8*l)*e;let c=0;if(this.absCharge>=Na[2]?c=3:this.absCharge>=Na[1]?c=2:this.absCharge>=Na[0]&&(c=1),c>n.driftStage&&(n.driftStage=c,$.emit("kart:driftStage",{kartId:n.id,stage:c})),c===3)n.driftCharge=1;else{let h=c===0?0:Na[c-1],u=Na[c];n.driftCharge=Ye((this.absCharge-h)/(u-h))}}}}hop(){let e=this.state;e.isHopping=!0,e.isAirborne=!0,e.airTime=0,this.hopTimer=0,this.vy=ET+Math.max(0,this.groundVy),this.freeY=e.position.y+.001,this.pendingHop=!0,$.emit("kart:hop",{kartId:e.id})}tryStartDrift(){let e=this.state,t=this.input;e.isDrifting||e.isSpinning||Math.abs(t.steer)<=.3||e.speed<=MT*this.baseTopSpeed()||(e.isDrifting=!0,e.driftDirection=t.steer>0?1:-1,e.driftStage=0,e.driftCharge=0,this.absCharge=0,$.emit("kart:driftStart",{kartId:e.id,direction:e.driftDirection}))}endDrift(e){let t=this.state;if(!t.isDrifting)return;let n=e?t.driftStage:0;t.isDrifting=!1,t.driftDirection=0,t.driftStage=0,t.driftCharge=0,this.absCharge=0,$.emit("kart:driftEnd",{kartId:t.id,boostStage:n}),n>0&&this.applyBoost(CT,AT[n],"drift")}updateYaw(e,t){let n=this.state;if(!t)return;let i=this.input,r=.7+.6*n.character.stats.handling,o=Math.abs(n.speed),a=o/ks,l;if(n.isDrifting){let c=(i.steer*n.driftDirection+1)*.5,h=rt(1,.72,Zt(.2,1,a));l=n.driftDirection*(.55+.45*c)*_T*r*h}else{let c=rt(1,.6,Zt(.15,1,a)),h=Math.min(1,o/2.5);l=(n.speed<-.5?-i.steer:i.steer)*yT*r*c*h,n.isSquished&&(l*=.6)}n.isAirborne&&(l*=n.isHopping?.45:.15),n.heading=Ha(n.heading-l*e)}resolveTrack(e,t){let n=this.state,i=t.query(n.position,n.trackT,OT);if(n.trackT=i.t,i.surface!==n.surface){let u=n.surface;n.surface=i.surface,$.emit("kart:surfaceChange",{kartId:n.id,from:u,to:i.surface}),i.surface==="boost"&&this.padCooldown<=0&&(this.padCooldown=1,this.applyBoost(.45,1.3,"pad"))}let r=i.surface==="void";if(!r&&!n.isFrozen){let u=i.wallHalfWidth-kT,d=i.lateral;if(Math.abs(d)>u){let f=d>0?1:-1,g=Math.abs(d)-u,v=i.binormal;n.position.x-=v.x*f*g,n.position.z-=v.z*f*g;let p=n.velocity,m=(p.x*v.x+p.z*v.z)*f;if(m>0){let y=Math.hypot(p.x,p.z),_=Ye(m/Math.max(.5,y));if(p.x-=v.x*f*m*(1+u0),p.z-=v.z*f*m*(1+u0),m>1&&this.wallCooldown<=0){let x=1-rt(.25,.45,_);p.x*=x,p.z*=x,this.wallCooldown=.3,$.emit("kart:collision",{kartId:n.id,otherId:null,impulse:m,position:n.position})}else{let x=Math.max(0,1-1.5*e);p.x*=x,p.z*=x}}}}let o=n.isAirborne;if(r)n.isAirborne=!0,n.airTime+=e,n.isHopping=!1,n.position.y=this.freeY,this.hasGroundSample=!1,this.groundVy=pt(this.groundVy,0,4,e);else{let u=i.groundY;if(this.hasGroundSample){let g=at((u-this.lastGroundY)/e,-25,25);this.groundVy=pt(this.groundVy,g,40,e)}else this.groundVy=0;this.lastGroundY=u,this.hasGroundSample=!0;let d,f=0;this.freeY<=u?(d=!0,this.freeY=u,f=Math.max(0,this.groundVy-this.vy),this.vy<this.groundVy&&(this.vy=this.groundVy)):d=this.freeY-u<BT&&Math.abs(this.vy-this.groundVy)<NT,d?(n.position.y=u,o&&this.land(f),n.isAirborne=!1,n.isHopping=!1,n.airTime=0):(n.isAirborne=!0,n.airTime+=e,n.position.y=this.freeY)}n.velocity.y=this.vy;let a=i.groundNormal,l=n.isAirborne?dh:a,c=n.isAirborne?3:12,h=1-Math.exp(-c*e);this.groundNormal.lerp(l,h),this.groundNormal.lengthSq()<1e-6?this.groundNormal.copy(dh):this.groundNormal.normalize()}land(e){let t=this.state,n=t.isHopping;e>9&&(t.speed*=.9),this.pendingLandImpact=e,(e>.5||t.airTime>.12)&&$.emit("kart:land",{kartId:t.id,impact:e}),!t.isSpinning&&!t.isFrozen&&this.input.drift&&!t.isDrifting&&(n||t.airTime<.6)&&this.tryStartDrift()}resolveKarts(e){let t=this.state;if(t.isFrozen)return;let n=Oi*(t.isShrunk?.6:1),r=1/(.7+.6*t.character.stats.weight);for(let o=0;o<e.length;o++){let a=e[o];if(a===this)continue;let l=a.state;if(l.id<=t.id||l.isFrozen)continue;let c=l.position.x-t.position.x,h=l.position.z-t.position.z,u=l.position.y-t.position.y;if(Math.abs(u)>1.2)continue;let d=Oi*(l.isShrunk?.6:1),f=n+d,g=c*c+h*h;if(g>=f*f)continue;let v=Math.sqrt(g),p,m;v>1e-4?(p=c/v,m=h/v):(p=Math.cos(t.heading),m=-Math.sin(t.heading));let y=f-v,x=1/(.7+.6*l.character.stats.weight),S=r+x,M=r/S*y,w=x/S*y;t.position.x-=p*M,t.position.z-=m*M,l.position.x+=p*w,l.position.z+=m*w;let b=(l.velocity.x-t.velocity.x)*p+(l.velocity.z-t.velocity.z)*m;if(b<0){let P=-1.4*b/S+1.2;t.velocity.x-=p*P*r,t.velocity.z-=m*P*r,f0.set(p*P*x,0,m*P*x),a.applyImpulse(f0)}let R=l.id&31;this.collisionCooldown[R]<=0&&b<-.8&&(this.collisionCooldown[R]=.3,p0.set(t.position.x+p*n,(t.position.y+l.position.y)*.5+.4,t.position.z+m*n),$.emit("kart:collision",{kartId:t.id,otherId:l.id,impulse:-b,position:p0})),t.isInvincible&&!l.isInvincible?a.applyHit("star",t.id):l.isInvincible&&!t.isInvincible&&this.applyHit("star",l.id)}}writeQuaternion(){let e=this.state;m0.setFromAxisAngle(dh,e.heading),g0.setFromUnitVectors(dh,this.groundNormal),e.quaternion.copy(g0).multiply(m0)}};var Kd=["UP","DOWN","LEFT","RIGHT","START","A","B","X","Y"];var Jd=["KeyW","ArrowUp"],jd=["KeyS","ArrowDown"],Qd=["KeyA","ArrowLeft"],ef=["KeyD","ArrowRight"],E0=["Space","ShiftLeft","ShiftRight"],tf=["KeyE","ControlLeft","ControlRight","Enter","NumpadEnter"],T0=["KeyQ"],M0=["Escape","KeyP"],zT=["Escape","KeyP","Backspace"],S0=["Enter","NumpadEnter","Space"],GT=new Set([...Jd,...jd,...Qd,...ef,...E0,...tf,...T0,...M0,...S0]),x0=0,VT=1,b0=2,WT=3,y0=4,qT=5,Zd=6,$d=7,XT=9,YT=12,KT=13,ZT=14,$T=15,fh=17,ph=.15,JT=.12,jT=.08,_0=.55,mh=class{constructor(){E(this,"state",Ei());E(this,"held",new Set);E(this,"pressed",new Set);E(this,"keyboardSteer",0);E(this,"lastTime",0);E(this,"padButtons",new Array(fh).fill(!1));E(this,"prevPadButtons",new Array(fh).fill(!1));E(this,"padStickMenuX",0);E(this,"padStickMenuY",0);E(this,"prevPadStickMenuX",0);E(this,"prevPadStickMenuY",0);E(this,"disposed",!1);E(this,"blockedKeys",new Set);E(this,"padBlocked",!1);E(this,"hadPad",!1);E(this,"tvBlocked",{});E(this,"onCancel");E(this,"padEdge",e=>this.padButtons[e]&&!this.prevPadButtons[e]);E(this,"onKeyDown",e=>{if(this.isTextTarget(e))return;let t=e.code;GT.has(t)&&!e.metaKey&&!e.altKey&&e.preventDefault(),!e.repeat&&(this.blockedKeys.has(t)||(this.held.has(t)||this.pressed.add(t),this.held.add(t)))});E(this,"onKeyUp",e=>{this.held.delete(e.code),this.blockedKeys.delete(e.code)});E(this,"onBlur",()=>{this.cancel()});E(this,"onVisibility",()=>{document.visibilityState!=="visible"&&this.cancel()});window.addEventListener("keydown",this.onKeyDown,{passive:!1}),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.onBlur),document.addEventListener("visibilitychange",this.onVisibility),this.lastTime=performance.now()}get hasGamepad(){return this.getPad()!==null}update(e,t=!0){let n=this.state,i=performance.now(),r=at((i-this.lastTime)/1e3,0,.1);this.lastTime=i;let o=e?.buttons||{},a={};for(let x of Kd)o[x]||(this.tvBlocked[x]=!1),!t&&o[x]&&(this.tvBlocked[x]=!0),a[x]=t&&!!o[x]&&!this.tvBlocked[x]&&!e?.cancelled;let l=this.anyHeld(Jd)||a.UP?1:0,c=this.anyHeld(jd)||a.DOWN?1:0,h=(this.anyHeld(ef)||a.RIGHT?1:0)-(this.anyHeld(Qd)||a.LEFT?1:0);this.keyboardSteer=eM(this.keyboardSteer,h,r);let u=this.getPad();if(!u&&this.hadPad)return this.hadPad=!1,this.cancel(),this.onCancel?.(),this.state;u&&(this.hadPad=!0,this.padBlocked&&(u.buttons.every(x=>!x.pressed&&x.value<=.5)&&u.axes.every(x=>Math.abs(x)<ph)?this.padBlocked=!1:u=null));let d=0,f=0,g=0,v=this.prevPadButtons,p=this.padButtons;this.prevPadButtons=p,this.padButtons=v;let m=this.padButtons;if(this.prevPadStickMenuX=this.padStickMenuX,this.prevPadStickMenuY=this.padStickMenuY,u){for(let M=0;M<fh;M++){let w=u.buttons[M];m[M]=w?w.pressed||w.value>.5:!1}d=u.buttons[$d]?at(u.buttons[$d].value,0,1):0,f=u.buttons[Zd]?at(u.buttons[Zd].value,0,1):0,d===0&&m[$d]&&(d=1),f===0&&m[Zd]&&(f=1);let x=u.axes[0]??0,S=u.axes[1]??0;g=QT(x),this.padStickMenuX=Math.abs(x)>_0?Math.sign(x):0,this.padStickMenuY=Math.abs(S)>_0?Math.sign(S):0}else{for(let x=0;x<fh;x++)m[x]=!1;this.padStickMenuX=0,this.padStickMenuY=0}let y=this.padEdge;n.throttle=Math.max(l,d),n.brake=Math.max(c,f),n.steer=at(this.keyboardSteer+g,-1,1),n.drift=this.anyHeld(E0)||m[x0]||m[qT],n.useItemHeld=this.anyHeld(tf)||m[b0]||m[y0],n.lookBack=this.anyHeld(T0)||m[WT],n.useItem=this.anyPressed(tf)||y(b0)||y(y0),n.pause=this.anyPressed(M0)||y(XT),n.confirm=this.anyPressed(S0)||y(x0),n.back=this.anyPressed(zT)||y(VT),n.menuUp=this.anyPressed(Jd)||y(YT)||this.padStickMenuY<0&&this.prevPadStickMenuY>=0,n.menuDown=this.anyPressed(jd)||y(KT)||this.padStickMenuY>0&&this.prevPadStickMenuY<=0,n.menuLeft=this.anyPressed(Qd)||y(ZT)||this.padStickMenuX<0&&this.prevPadStickMenuX>=0,n.menuRight=this.anyPressed(ef)||y($T)||this.padStickMenuX>0&&this.prevPadStickMenuX<=0;let _=e?.cancelled?{}:e?.pressed||{};return n.drift||(n.drift=!!a.A),n.useItemHeld||(n.useItemHeld=!!a.B),n.lookBack||(n.lookBack=!!a.X),n.useItem||(n.useItem=!!a.B&&!!_.B),n.pause||(n.pause=!!_.START),t||(n.confirm||(n.confirm=!!_.A||!!_.START),n.back||(n.back=!!_.Y),n.menuUp||(n.menuUp=!!_.UP),n.menuDown||(n.menuDown=!!_.DOWN),n.menuLeft||(n.menuLeft=!!_.LEFT),n.menuRight||(n.menuRight=!!_.RIGHT)),this.pressed.clear(),n}dispose(){this.disposed||(this.disposed=!0,window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("blur",this.onBlur),document.removeEventListener("visibilitychange",this.onVisibility),this.held.clear(),this.pressed.clear())}cancel(){for(let e of this.held)this.blockedKeys.add(e);this.held.clear(),this.pressed.clear(),this.keyboardSteer=0,this.padBlocked=!0,this.padButtons.fill(!1),this.prevPadButtons.fill(!1),this.padStickMenuX=this.padStickMenuY=this.prevPadStickMenuX=this.prevPadStickMenuY=0,Object.assign(this.state,Ei());for(let e of Kd)this.tvBlocked[e]=!0}anyHeld(e){for(let t=0;t<e.length;t++)if(this.held.has(e[t]))return!0;return!1}anyPressed(e){for(let t=0;t<e.length;t++)if(this.pressed.has(e[t]))return!0;return!1}getPad(){if(typeof navigator>"u"||typeof navigator.getGamepads!="function")return null;let e;try{e=navigator.getGamepads()}catch{return null}let t=null;for(let n=0;n<e.length;n++){let i=e[n];if(!(!i||!i.connected)){if(i.mapping==="standard")return i;t||(t=i)}}return t}isTextTarget(e){let t=e.target;if(!t||!(t instanceof HTMLElement))return!1;let n=t.tagName;return n==="INPUT"||n==="TEXTAREA"||n==="SELECT"||t.isContentEditable}};function QT(s){let e=Math.abs(s);if(e<ph)return 0;let t=(e-ph)/(1-ph);return Math.sign(s)*Math.pow(at(t,0,1),1.25)}function eM(s,e,t){if(s===e)return s;let r=(Math.abs(e)>Math.abs(s)&&Math.sign(e)===Math.sign(s||e)?1/JT:1/jT)*t;return Math.abs(e-s)<=r?e:s+Math.sign(e-s)*r}var tM=2048,gh=class{constructor(e){E(this,"curve");E(this,"n",tM);E(this,"length");E(this,"px");E(this,"py");E(this,"pz");E(this,"tx");E(this,"ty");E(this,"tz");E(this,"bx");E(this,"bz");E(this,"hw");E(this,"whw");E(this,"minX");E(this,"maxX");E(this,"minZ");E(this,"maxZ");E(this,"minY");E(this,"maxY");E(this,"maxWallHalfWidth");E(this,"maxHalfWidth");let t=this.n,n=e.controlPoints.map(v=>new C(v.x,v.y,v.z));this.curve=new Zr(n,!0,"centripetal",.5),this.curve.arcLengthDivisions=4096,this.length=this.curve.getLength(),this.px=new Float64Array(t),this.py=new Float64Array(t),this.pz=new Float64Array(t),this.tx=new Float64Array(t),this.ty=new Float64Array(t),this.tz=new Float64Array(t),this.bx=new Float64Array(t),this.bz=new Float64Array(t),this.hw=new Float64Array(t),this.whw=new Float64Array(t);let i=e.controlPoints.length,r=e.halfWidths&&e.halfWidths.length===i?e.halfWidths:null,o=new C,a=1/0,l=-1/0,c=1/0,h=-1/0,u=1/0,d=-1/0,f=0;for(let v=0;v<t;v++){let p=v/t;this.curve.getPointAt(p,o),this.px[v]=o.x,this.py[v]=o.y,this.pz[v]=o.z,o.x<a&&(a=o.x),o.x>l&&(l=o.x),o.z<c&&(c=o.z),o.z>h&&(h=o.z),o.y<u&&(u=o.y),o.y>d&&(d=o.y);let m=e.halfWidth;if(r){let _=this.curve.getUtoTmapping(p,0)*i,x=Math.floor(_)%i,S=(x+1)%i,M=_-Math.floor(_);M=M*M*(3-2*M),m=r[x]+(r[S]-r[x])*M}this.hw[v]=m,this.whw[v]=m*Math.max(1,e.wallHalfWidthFactor),m>f&&(f=m)}let g=new Float64Array(t);for(let v=0;v<t;v++){let p=0;for(let m=-8;m<=8;m++)p+=this.hw[(v+m+t)%t];g[v]=p/17}for(let v=0;v<t;v++)this.hw[v]=g[v],this.whw[v]=g[v]*Math.max(1,e.wallHalfWidthFactor);this.maxHalfWidth=f,this.maxWallHalfWidth=f*Math.max(1,e.wallHalfWidthFactor),this.minX=a,this.maxX=l,this.minZ=c,this.maxZ=h,this.minY=u,this.maxY=d;for(let v=0;v<t;v++){let p=(v+1)%t,m=(v-1+t)%t,y=this.px[p]-this.px[m],_=this.py[p]-this.py[m],x=this.pz[p]-this.pz[m],S=Math.hypot(y,_,x)||1;y/=S,_/=S,x/=S,this.tx[v]=y,this.ty[v]=_,this.tz[v]=x;let M=Math.hypot(y,x)||1;this.bx[v]=-x/M,this.bz[v]=y/M}}indexOf(e){return Dt(e)*this.n}sOf(e){return Dt(e)*this.length}tOf(e){return Dt(e/this.length)}sample(e,t){let n=Dt(e),i=this.n,r=n*i,o=Math.floor(r)%i,a=(o+1)%i,l=r-Math.floor(r),c=1-l;t.position.set(this.px[o]*c+this.px[a]*l,this.py[o]*c+this.py[a]*l,this.pz[o]*c+this.pz[a]*l);let h=this.tx[o]*c+this.tx[a]*l,u=this.ty[o]*c+this.ty[a]*l,d=this.tz[o]*c+this.tz[a]*l,f=Math.hypot(h,u,d)||1;h/=f,u/=f,d/=f,t.tangent.set(h,u,d);let g=Math.hypot(h,d)||1,v=-d/g,p=h/g;return t.binormal.set(v,0,p),t.normal.set(-p*u,p*h-v*d,v*u).normalize(),t.halfWidth=this.hw[o]*c+this.hw[a]*l,t.wallHalfWidth=this.whw[o]*c+this.whw[a]*l,t.t=n,t}dist2(e,t,n){let i=this.px[e]-t,r=this.pz[e]-n;return i*i+r*r}closestT(e,t,n){let i=this.n,r=-1,o=1/0;if(n!==void 0&&Number.isFinite(n)){let u=Math.round(Dt(n)*i),d=48;for(let v=-d;v<=d;v++){let p=(u+v+i*4)%i,m=this.dist2(p,e,t);m<o&&(o=m,r=p)}let f=((r-u)%i+i)%i;(f===d||f===i-d)&&(r=-1)}if(r<0){o=1/0;for(let d=0;d<i;d+=8){let f=this.dist2(d,e,t);f<o&&(o=f,r=d)}let u=r;for(let d=-8;d<=8;d++){let f=(u+d+i)%i,g=this.dist2(f,e,t);g<o&&(o=g,r=f)}}let a=(r-1+i)%i,l=(r+1)%i,c=r/i,h=o;{let u=this.px[a],d=this.pz[a],f=this.px[r]-u,g=this.pz[r]-d,v=f*f+g*g;if(v>1e-12){let p=((e-u)*f+(t-d)*g)/v;p=p<0?0:p>1?1:p;let m=u+f*p-e,y=d+g*p-t,_=m*m+y*y;_<h&&(h=_,c=(a+p)/i)}}{let u=this.px[r],d=this.pz[r],f=this.px[l]-u,g=this.pz[l]-d,v=f*f+g*g;if(v>1e-12){let p=((e-u)*f+(t-d)*g)/v;p=p<0?0:p>1?1:p;let m=u+f*p-e,y=d+g*p-t,_=m*m+y*y;_<h&&(h=_,c=(r+p)/i)}}return Dt(c)}};var xh=1600,Hs=2.5,nf=96,nM=.25,bh=42,w0={grassland:{hills:16,detail:3.5,bumps:.5,rim:70,base:-1.5},desert:{hills:20,detail:5,bumps:.6,rim:90,base:-1},snow:{hills:26,detail:5,bumps:.6,rim:120,base:-1},beach:{hills:10,detail:2.5,bumps:.4,rim:50,base:-1},volcano:{hills:30,detail:6,bumps:.8,rim:120,base:-1},neon:{hills:3,detail:.8,bumps:.15,rim:20,base:-.6}},vh=class{constructor(e,t){E(this,"extent",xh);E(this,"centerX");E(this,"centerZ");E(this,"minX");E(this,"minZ");E(this,"cells");E(this,"dist");E(this,"roadY");E(this,"voidW");E(this,"params");E(this,"flatRadius");E(this,"seed");E(this,"hasVoid");E(this,"fDist",0);E(this,"fRoadY",0);E(this,"fVoid",0);this.params=w0[e.theme]??w0.grassland,this.centerX=(t.minX+t.maxX)*.5,this.centerZ=(t.minZ+t.maxZ)*.5,this.minX=this.centerX-this.extent*.5,this.minZ=this.centerZ-this.extent*.5,this.cells=Math.ceil(this.extent/Hs)+1;let n=this.cells*this.cells;this.dist=new Float32Array(n).fill(nf),this.roadY=new Float32Array(n),this.voidW=new Float32Array(n),this.flatRadius=t.maxWallHalfWidth+6,this.seed=iM(e.id);let i=e.voidRanges??[];this.hasVoid=i.length>0;let r=2,o=l=>{let c=0;for(let[h,u]of i){let d=Zt(-.03,0,En(h,l)),f=Zt(-.03,0,En(l,u));c=Math.max(c,Math.min(d,f))}return c};this.forEachCellNear(t,r,nf,(l,c,h)=>{c<this.dist[l]&&(this.dist[l]=c,this.roadY[l]=t.py[h],this.voidW[l]=o(h/t.n))});let a=new Float32Array(n).fill(1/0);this.forEachCellNear(t,r,this.flatRadius+30,(l,c,h)=>{c<=this.dist[l]+2.5&&t.py[h]<a[l]&&(a[l]=t.py[h])});for(let l=0;l<n;l++)a[l]<1/0&&(this.roadY[l]=a[l])}forEachCellNear(e,t,n,i){let r=Math.ceil(n/Hs);for(let o=0;o<e.n;o+=t){let a=e.px[o],l=e.pz[o],c=Math.round((a-this.minX)/Hs),h=Math.round((l-this.minZ)/Hs),u=Math.max(0,c-r),d=Math.min(this.cells-1,c+r),f=Math.max(0,h-r),g=Math.min(this.cells-1,h+r);for(let v=f;v<=g;v++){let p=this.minZ+v*Hs-l,m=v*this.cells;for(let y=u;y<=d;y++){let _=this.minX+y*Hs-a,x=Math.sqrt(_*_+p*p);x<=n&&i(m+y,x,o)}}}}sampleField(e,t){let n=(e-this.minX)/Hs,i=(t-this.minZ)/Hs,r=this.cells;if(n<0||i<0||n>=r-1||i>=r-1){this.fDist=nf,this.fRoadY=0,this.fVoid=0;return}let o=Math.floor(n),a=Math.floor(i),l=n-o,c=i-a,h=a*r+o,u=h+1,d=h+r,f=d+1,g=(1-l)*(1-c),v=l*(1-c),p=(1-l)*c,m=l*c;this.fDist=this.dist[h]*g+this.dist[u]*v+this.dist[d]*p+this.dist[f]*m,this.fRoadY=this.roadY[h]*g+this.roadY[u]*v+this.roadY[d]*p+this.roadY[f]*m,this.fVoid=this.voidW[h]*g+this.voidW[u]*v+this.voidW[d]*p+this.voidW[f]*m}distanceToTrack(e,t){return this.sampleField(e,t),this.fDist}rawTerrain(e,t){let n=this.params,i=e+this.seed*.37,r=t-this.seed*.53,o=(In(i*.0035+7.1,r*.0035+3.3,3)-.5)*n.hills,a=(In(i*.02+1.7,r*.02+9.2,3)-.5)*n.detail,l=(In(i*.11,r*.11,2)-.5)*n.bumps,c=e-this.centerX,h=t-this.centerZ,u=Math.sqrt(c*c+h*h),d=Zt(430,780,u)*n.rim*(.6+.4*In(i*.01,r*.01,2));return n.base+o+a+l+d}heightAt(e,t){this.sampleField(e,t);let n=this.fDist,i=this.fRoadY-nM,r=this.rawTerrain(e,t),o;if(n>=this.flatRadius+26)o=r;else{let a=Zt(this.flatRadius,this.flatRadius+26,n);o=rt(i,r,a)}if(this.hasVoid&&this.fVoid>.001){let a=this.flatRadius-6,l=Zt(a-1.5,a+9,n),c=rt(i,i-bh,l),h=Zt(95,150,n),u=rt(c,r,h);o=rt(o,u,this.fVoid)}return o}};function iM(s){let e=2166136261;for(let t=0;t<s.length;t++)e^=s.charCodeAt(t),e=Math.imul(e,16777619);return(e>>>0)%1e5}function Xt(s,...e){for(let t of e)s.disposables.push(t);return e[0]}function vt(s,e){s.disposables.push(e.geometry);let t=e.material;Array.isArray(t)?s.disposables.push(...t):s.disposables.push(t)}function kt(s,e=0,t=0){let n=new ae(s);if(e!==0||t!==0){let i={h:0,s:0,l:0};n.getHSL(i),n.setHSL(i.h,io.clamp(i.s+t,0,1),io.clamp(i.l+e,0,1))}return n}function yh(s,e){let t=s.n;return(Math.round(e/s.length*t)%t+t)%t}function Bs(s,e){return Math.atan2(-s,-e)}function yr(s,e){let t=s.getAttribute("position").count,n=new Float32Array(t*3);for(let i=0;i<t;i++)n[i*3]=e.r,n[i*3+1]=e.g,n[i*3+2]=e.b;return s.setAttribute("color",new ot(n,3)),s}function sf(s){let e=s.index?s.toNonIndexed():s;e!==s&&s.dispose();let t=e.getAttribute("position").count;return e.getAttribute("normal")||e.computeVertexNormals(),e.getAttribute("uv")||e.setAttribute("uv",new ot(new Float32Array(t*2),2)),e.getAttribute("color")||yr(e,new ae(1,1,1)),e}var of=8;function rf(s){return[s>>16&255,s>>8&255,s&255]}function Qt(s,e=1){let[t,n,i]=rf(s);return`rgba(${t},${n},${i},${e})`}function Hn(s,e){let t=document.createElement("canvas");t.width=s,t.height=e;let n=t.getContext("2d");if(!n)throw new Error("2D canvas not available");return{canvas:t,ctx:n}}function Bn(s,e={}){let t=new _n(s);return e.repeat!==!1?(t.wrapS=Kn,t.wrapT=Kn):(t.wrapS=Rn,t.wrapT=Rn),e.srgb!==!1&&(t.colorSpace=Nt),t.anisotropy=e.anisotropy??16,t.minFilter=zn,t.magFilter=rn,t.generateMipmaps=!0,t.needsUpdate=!0,t}function _h(s,e,t,n,i,r,o,a){let l=s.createImageData(e,t),c=l.data,[h,u,d]=rf(n),f=a?rf(a.color):null;for(let g=0;g<t;g++)for(let v=0;v<e;v++){let p=v/e*Math.PI*2,m=g/t*Math.PI*2,y=Math.cos(p)*r+o,_=Math.sin(p)*r+o*1.7,x=Math.cos(m)*r+o*.3,S=Math.sin(m)*r+o*2.1,M=In(y+x,_+S,4),w=In(y*2.7-S,_*2.7+x,3),b=(M-.5)*i+(w-.5)*i*.5,R=h*(1+b),P=u*(1+b),k=d*(1+b);if(f){let H=Ye((w-.5)*2)*a.strength;R=R*(1-H)+f[0]*H,P=P*(1-H)+f[1]*H,k=k*(1-H)+f[2]*H}let L=(g*e+v)*4;c[L]=Ye(R/255)*255,c[L+1]=Ye(P/255)*255,c[L+2]=Ye(k/255)*255,c[L+3]=255}s.putImageData(l,0,0)}function R0(s){let{canvas:n,ctx:i}=Hn(512,512),r=s.theme,o=s.palette,a=Ti(1234);if(r==="snow"){_h(i,512,512,o.road,.09,.55,3.1,{color:13230834,strength:.22});for(let v=0;v<7;v++){let p=a()*512,m=40+a()*90,y=i.createLinearGradient(p-m/2,0,p+m/2,0);y.addColorStop(0,"rgba(255,255,255,0)"),y.addColorStop(.5,"rgba(240,250,255,0.13)"),y.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=y,i.fillRect(p-m/2,0,m,512)}for(let v=0;v<5;v++){let p=[],m=a()*512,y=a()*512,_=(a()-.5)*1.4,x=a()<.5?-1:1,S=5+Math.floor(a()*4);for(let w=0;w<=S;w++)p.push([m,y]),m+=_*30+(a()-.5)*34,y+=x*(36+a()*40);let M=()=>{i.beginPath(),i.moveTo(p[0][0],p[0][1]);for(let w=1;w<p.length;w++)i.lineTo(p[w][0],p[w][1]);i.stroke()};if(i.lineCap="round",i.strokeStyle="rgba(70,95,120,0.35)",i.lineWidth=4.5,M(),i.strokeStyle="rgba(235,248,255,0.55)",i.lineWidth=1.8,M(),a()<.7){let w=1+Math.floor(a()*(p.length-2));i.beginPath(),i.moveTo(p[w][0],p[w][1]),i.lineTo(p[w][0]+(a()-.5)*70,p[w][1]+(a()-.5)*50),i.strokeStyle="rgba(235,248,255,0.4)",i.lineWidth=1.2,i.stroke()}}}else{_h(i,512,512,o.road,r==="neon"?.16:.12,.9,3.1);let v=i.getImageData(0,0,512,512),p=v.data,m=r==="neon"?10:14;for(let y=0;y<p.length;y+=4){let _=(a()-.5)*m+(a()<.035?18:0);p[y]=Ye((p[y]+_)/255)*255,p[y+1]=Ye((p[y+1]+_)/255)*255,p[y+2]=Ye((p[y+2]+_*1.05)/255)*255}i.putImageData(v,0,0);for(let y of[.27,.73]){let x=i.createLinearGradient(512*y-51.2,0,512*y+51.2,0);x.addColorStop(0,"rgba(255,255,255,0)"),x.addColorStop(.5,r==="neon"?"rgba(200,210,255,0.07)":"rgba(255,255,255,0.09)"),x.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=x,i.fillRect(512*y-102.4/2,0,102.4,512)}if(r==="desert")for(let y of[0,1]){let _=i.createLinearGradient(y===0?0:512,0,y===0?61.44:450.56,0);_.addColorStop(0,Qt(o.offroad,.32)),_.addColorStop(1,Qt(o.offroad,0)),i.fillStyle=_,i.fillRect(y===0?0:512*.88,0,512*.12,512)}i.globalAlpha=.16,i.fillStyle="#000",i.fillRect(512*.42,512*.3,512*.16,512*.22),i.globalAlpha=1}let l=Qt(o.roadStripe),c=512*.02,h=512*.035;i.fillStyle=l,i.globalAlpha=r==="snow"?.55:.9,i.fillRect(h,0,c,512),i.fillRect(512-h-c,0,c,512);let u=2.4/of*512,d=512*.018;if(i.fillRect(512/2-d/2,512*.05,d,u),i.fillRect(512/2-d/2,512*.55,d,u),i.globalAlpha=1,r!=="snow"){i.globalAlpha=.18,i.fillStyle=Qt(o.road);for(let v=0;v<60;v++)i.fillRect(a()*512,a()*512,2+a()*6,2+a()*10);i.globalAlpha=1}let f=Bn(n),g=null;if(r==="neon"){let v=Hn(512,512);v.ctx.fillStyle="#000",v.ctx.fillRect(0,0,512,512),v.ctx.fillStyle=Qt(o.roadStripe),v.ctx.fillRect(h,0,c,512),v.ctx.fillStyle=Qt(o.curb),v.ctx.fillRect(512-h-c,0,c,512),v.ctx.fillStyle=Qt(o.roadStripe),v.ctx.fillRect(512/2-d/2,512*.05,d,u),v.ctx.fillRect(512/2-d/2,512*.55,d,u),v.ctx.globalAlpha=.35,v.ctx.fillStyle=Qt(o.roadStripe),v.ctx.fillRect(h-c,0,c*3,512),v.ctx.fillStyle=Qt(o.curb),v.ctx.fillRect(512-h-c*2,0,c*3,512),v.ctx.globalAlpha=1,g=Bn(v.canvas)}return{map:f,emissiveMap:g}}function Eh(s,e){let{canvas:n,ctx:i}=Hn(256,256);_h(i,256,256,e,s==="snow"?.08:s==="neon"||s==="grassland"?.2:.32,1.3,7.7,s==="grassland"?{color:9423166,strength:.3}:s==="desert"?{color:12089916,strength:.3}:s==="snow"?{color:13624309,strength:.25}:void 0);let a=Ti(99);if(s==="grassland"){let l=i.getImageData(0,0,256,256),c=l.data;for(let h=0;h<256;h++)for(let u=0;u<256;u++){let d=u/256*Math.PI*2,f=h/256*Math.PI*2,g=In(Math.cos(d)*.9+Math.cos(f)*.9+11.3,Math.sin(d)*.9+Math.sin(f)*.9+4.2,3),v=Ye((g-.47)*3.2)*.42,p=(h*256+u)*4;c[p]=c[p]*(1-v)+47*v,c[p+1]=c[p+1]*(1-v)+122*v,c[p+2]=c[p+2]*(1-v)+36*v}i.putImageData(l,0,0),i.globalAlpha=.55;for(let h=0;h<1400;h++)i.fillStyle=a()<.5?"rgba(170,230,80,0.6)":"rgba(30,80,25,0.65)",i.fillRect(a()*256,a()*256,1,2+a()*3)}else if(s==="desert"){i.globalAlpha=.18,i.strokeStyle="rgba(90,50,20,1)";for(let l=0;l<40;l++){i.beginPath();let c=a()*256;i.moveTo(0,c);for(let h=0;h<=256;h+=16)i.lineTo(h,c+Math.sin(h*.1+l)*4);i.stroke()}}else if(s==="snow"){i.globalAlpha=.35;for(let l=0;l<500;l++)i.fillStyle="rgba(255,255,255,0.9)",i.fillRect(a()*256,a()*256,1,1)}else if(s==="neon"){i.globalAlpha=.35,i.strokeStyle="rgba(60,80,120,1)",i.lineWidth=2;for(let l=0;l<=4;l++)i.beginPath(),i.moveTo(l*256/4,0),i.lineTo(l*256/4,256),i.stroke(),i.beginPath(),i.moveTo(0,l*256/4),i.lineTo(256,l*256/4),i.stroke()}return i.globalAlpha=1,Bn(n)}function A0(s=12,e=2){let{canvas:n,ctx:i}=Hn(s*32,e*32);for(let r=0;r<e;r++)for(let o=0;o<s;o++)i.fillStyle=(o+r)%2===0?"#f4f4f4":"#111111",i.fillRect(o*32,r*32,32,32);return Bn(n,{repeat:!1})}function C0(s,e){let{canvas:i,ctx:r}=Hn(1024,256),o=r.createLinearGradient(0,0,1024,0);s==="neon"?(o.addColorStop(0,"#12061f"),o.addColorStop(1,"#1a0b33")):(o.addColorStop(0,"#c81e2b"),o.addColorStop(.5,"#e63946"),o.addColorStop(1,"#c81e2b")),r.fillStyle=o,r.fillRect(0,0,1024,256);let a=16;for(let c=0;c<1024/a;c++)for(let h=0;h<2;h++)r.fillStyle=(c+h)%2===0?"#ffffff":"#111111",r.fillRect(c*a,h*a,a,a),r.fillRect(c*a,256-(h+1)*a,a,a);r.textAlign="center",r.textBaseline="middle",r.font='italic 900 96px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';let l=r.measureText(gr).width;return l>1024*.86&&(r.font=`italic 900 ${Math.floor(96*1024*.86/l)}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`),r.lineWidth=12,r.strokeStyle="rgba(0,0,0,0.85)",r.strokeText(gr,1024/2,256/2+6),r.fillStyle=s==="neon"?Qt(e):"#fff7d6",r.fillText(gr,1024/2,256/2+6),s==="neon"&&(r.shadowColor=Qt(e),r.shadowBlur=40,r.fillText(gr,1024/2,256/2+6),r.shadowBlur=0),Bn(i,{repeat:!1})}function I0(){let{canvas:t,ctx:n}=Hn(512,128);n.clearRect(0,0,512,128);let i=14,r=(o,a,l,c,h)=>{n.beginPath(),n.moveTo(o+h,a),n.lineTo(o+l-h,a),n.quadraticCurveTo(o+l,a,o+l,a+h),n.lineTo(o+l,a+c-h),n.quadraticCurveTo(o+l,a+c,o+l-h,a+c),n.lineTo(o+h,a+c),n.quadraticCurveTo(o,a+c,o,a+c-h),n.lineTo(o,a+h),n.quadraticCurveTo(o,a,o+h,a),n.closePath()};r(2,2,508,124,i),n.fillStyle="#4a4b52",n.fill(),r(6,6,500,116,i-3),n.fillStyle="#17171b",n.fill(),n.strokeStyle="rgba(255,255,255,0.06)",n.lineWidth=2;for(let o=1;o<4;o++)n.beginPath(),n.moveTo(512*o/4,8),n.lineTo(512*o/4,120),n.stroke();return Bn(t,{repeat:!1})}function P0(){let{canvas:t,ctx:n}=Hn(256,256);n.clearRect(0,0,256,256);let i=256*.3,r=256*.12,o=256*.62,a=n.createLinearGradient(0,o+i,0,r);return a.addColorStop(0,"#ff7a12"),a.addColorStop(.55,"#ffb020"),a.addColorStop(1,"#ffef5a"),n.fillStyle=a,n.beginPath(),n.moveTo(256*.06,o),n.lineTo(256/2,r),n.lineTo(256*.94,o),n.lineTo(256*.94,o+i),n.lineTo(256/2,r+i),n.lineTo(256*.06,o+i),n.closePath(),n.fill(),n.strokeStyle="rgba(255,255,220,0.55)",n.lineWidth=3,n.beginPath(),n.moveTo(256*.06,o),n.lineTo(256/2,r),n.lineTo(256*.94,o),n.stroke(),Bn(t)}function k0(){let{canvas:t,ctx:n}=Hn(64,256);n.clearRect(0,0,64,256);let i=n.createLinearGradient(0,256,0,0);i.addColorStop(0,"rgba(255,150,40,0.36)"),i.addColorStop(.45,"rgba(255,170,50,0.16)"),i.addColorStop(1,"rgba(255,190,60,0)"),n.fillStyle=i,n.fillRect(0,0,64,256);let r=n.createLinearGradient(0,0,64,0);return r.addColorStop(0,"rgba(0,0,0,1)"),r.addColorStop(.2,"rgba(0,0,0,0)"),r.addColorStop(.8,"rgba(0,0,0,0)"),r.addColorStop(1,"rgba(0,0,0,1)"),n.globalCompositeOperation="destination-out",n.fillStyle=r,n.fillRect(0,0,64,256),n.globalCompositeOperation="source-over",Bn(t,{repeat:!1})}function af(s,e,t,n,i=!1){let{canvas:a,ctx:l}=Hn(1024,256);l.fillStyle=Qt(e),l.fillRect(0,0,1024,256),l.fillStyle=Qt(n);for(let u of[0,884])for(let d=0;d<3;d++)l.beginPath(),l.moveTo(u+d*46,0),l.lineTo(u+d*46+22,0),l.lineTo(u+d*46+22+60,256),l.lineTo(u+d*46+60,256),l.closePath(),l.fill();l.strokeStyle=Qt(t,.8),l.lineWidth=8,l.strokeRect(6,6,1012,244),l.textAlign="center",l.textBaseline="middle";let c=128;l.font=`italic 900 ${c}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`;let h=l.measureText(s).width;return h>1024*.66&&(c=Math.floor(c*1024*.66/h),l.font=`italic 900 ${c}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`),i&&(l.shadowColor=Qt(t),l.shadowBlur=36),l.lineWidth=10,l.strokeStyle="rgba(0,0,0,0.6)",l.strokeText(s,1024/2,256/2+4),l.fillStyle=Qt(t),l.fillText(s,1024/2,256/2+4),l.shadowBlur=0,Bn(a,{repeat:!1})}function D0(s,e){let{canvas:i,ctx:r}=Hn(1024,192),o=24;for(let c=0;c<192/o;c++)for(let h=0;h<1024/o;h++)r.fillStyle=(h+c)%2===0?"#f4f4f4":"#141416",r.fillRect(h*o,c*o,o,o);let a=1024*.5,l=192*.62;return r.fillStyle=s==="neon"?"#140826":"#c81e2b",r.fillRect(1024/2-a/2,192/2-l/2,a,l),r.strokeStyle=Qt(e),r.lineWidth=6,r.strokeRect(1024/2-a/2+4,192/2-l/2+4,a-8,l-8),r.textAlign="center",r.textBaseline="middle",r.font='900 84px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif',r.fillStyle=s==="neon"?Qt(e):"#fff7d6",s==="neon"&&(r.shadowColor=Qt(e),r.shadowBlur=24),r.fillText("START  \xB7  FINISH",1024/2,192/2+4),r.shadowBlur=0,Bn(i,{repeat:!1})}function L0(s,e,t){let{canvas:r,ctx:o}=Hn(1024,256);return o.fillStyle=Qt(e),o.fillRect(0,0,1024,256),o.fillStyle=Qt(t,.9),o.fillRect(0,12,1024,10),o.fillRect(0,234,1024,10),o.textAlign="center",o.textBaseline="middle",o.font='900 120px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif',o.fillStyle=Qt(t),o.fillText(s,1024*.5,256/2+6),Bn(r)}function F0(s){let t=Hn(256,256),n=Hn(256,256);t.ctx.fillStyle="#141420",t.ctx.fillRect(0,0,256,256),n.ctx.fillStyle="#000",n.ctx.fillRect(0,0,256,256);let i=Ti(s),r=8,o=12,a=256/r,l=256/o,c=["#ffe9a8","#9fe8ff","#ff9ad6","#c9b8ff","#ffffff"];for(let h=0;h<o;h++)for(let u=0;u<r;u++){let d=i()<.62,f=u*a+a*.2,g=h*l+l*.2,v=a*.6,p=l*.55;if(t.ctx.fillStyle=d?"#2a2a3a":"#0c0c14",t.ctx.fillRect(f,g,v,p),d){let m=c[Math.floor(i()*c.length)];n.ctx.fillStyle=m,n.ctx.globalAlpha=.5+i()*.5,n.ctx.fillRect(f,g,v,p),n.ctx.globalAlpha=1}}return{map:Bn(t.canvas),emissive:Bn(n.canvas)}}function Th(s){let{canvas:n,ctx:i}=Hn(512,256),r=[{bg:"#12042a",a:"#ff2fd6",b:"#00e5ff",text:"TURBO"},{bg:"#031a2a",a:"#00e5ff",b:"#ffe83a",text:"NEXUS"},{bg:"#1a0410",a:"#ff5a5a",b:"#ffffff",text:"RUSH"}],o=r[s%r.length];i.fillStyle=o.bg,i.fillRect(0,0,512,256),i.strokeStyle=o.b,i.lineWidth=10,i.strokeRect(10,10,492,236),i.globalAlpha=.2,i.fillStyle=o.b;for(let a=0;a<256;a+=6)i.fillRect(0,a,512,2);return i.globalAlpha=1,i.textAlign="center",i.textBaseline="middle",i.font='900 150px "Arial Black", Impact, Arial, sans-serif',i.shadowColor=o.a,i.shadowBlur=30,i.fillStyle=o.a,i.fillText(o.text,512/2,256/2),i.shadowBlur=0,i.fillStyle=o.b,i.font="700 30px Arial, sans-serif",i.fillText(s%2===0?"KART  \u2022  RUSH  \u2022  NIGHT":"DRIFT  \u2022  BOOST  \u2022  WIN",512/2,216),Bn(n,{repeat:!1})}function H0(s){let{canvas:t,ctx:n}=Hn(256,256);_h(n,256,256,s,.22,1.1,4.4,{color:9067056,strength:.3}),n.globalAlpha=.25;let i=Ti(5);for(let r=0;r<14;r++){n.fillStyle=i()<.5?"rgba(80,40,20,1)":"rgba(255,230,190,1)";let o=i()*256;n.fillRect(0,o,256,2+i()*4)}return n.globalAlpha=1,Bn(t)}var sM=.1,Ua=1;function B0(s){let e=new Qe;e.name="road";let{cl:t,def:n}=s,i=t.n,r=n.theme,a=Math.max(1,Math.round(t.length/of))/t.length;{let l=new Float32Array((i+1)*2*3),c=new Float32Array((i+1)*2*3),h=new Float32Array((i+1)*2*2),u=new Uint32Array(i*6);for(let p=0;p<=i;p++){let m=p%i,y=p/i*t.length,_=t.hw[m],x=t.px[m],S=t.py[m],M=t.pz[m],w=t.bx[m],b=t.bz[m],R=t.tx[m],P=t.ty[m],k=t.tz[m],L=-b*P,H=b*R-w*k,B=w*P,F=Math.hypot(L,H,B)||1;L/=F,H/=F,B/=F;let O=p*6;l[O]=x-w*_,l[O+1]=S,l[O+2]=M-b*_,l[O+3]=x+w*_,l[O+4]=S,l[O+5]=M+b*_,c[O]=L,c[O+1]=H,c[O+2]=B,c[O+3]=L,c[O+4]=H,c[O+5]=B;let z=y*a;h[p*4]=0,h[p*4+1]=z,h[p*4+2]=1,h[p*4+3]=z}for(let p=0;p<i;p++){let m=p*2,y=m+1,_=m+2,x=m+3,S=p*6;u[S]=m,u[S+1]=y,u[S+2]=_,u[S+3]=y,u[S+4]=x,u[S+5]=_}let d=new dt;d.setAttribute("position",new ot(l,3)),d.setAttribute("normal",new ot(c,3)),d.setAttribute("uv",new ot(h,2)),d.setIndex(new ot(u,1)),d.computeBoundingSphere();let f=R0(n);Xt(s,f.map),f.emissiveMap&&Xt(s,f.emissiveMap);let g=new He({map:f.map,roughness:r==="snow"?.35:r==="neon"?.55:.92,metalness:r==="snow"?.1:0,emissive:f.emissiveMap?new ae(16777215):new ae(0),emissiveMap:f.emissiveMap??null,emissiveIntensity:f.emissiveMap?1.6:0}),v=new xe(d,g);v.name="roadSurface",v.receiveShadow=!0,vt(s,v),e.add(v)}{let l=(i+1)*3,c=new Float32Array(l*2*3),h=new Float32Array(l*2*2),u=new Uint32Array(i*2*12),d=0;for(let m=0;m<2;m++){let y=m===0?-1:1,_=m*l;for(let x=0;x<=i;x++){let S=x%i,M=x/i*t.length,w=t.hw[S],b=t.px[S],R=t.py[S],P=t.pz[S],k=t.bx[S]*y,L=t.bz[S]*y,H=_+x*3;c[H*3]=b+k*w,c[H*3+1]=R+.03,c[H*3+2]=P+L*w,c[(H+1)*3]=b+k*(w+Ua),c[(H+1)*3+1]=R+sM,c[(H+1)*3+2]=P+L*(w+Ua),c[(H+2)*3]=b+k*(w+Ua+.05),c[(H+2)*3+1]=R-.02,c[(H+2)*3+2]=P+L*(w+Ua+.05);let B=M/5;h[H*2]=0,h[H*2+1]=B,h[(H+1)*2]=.5,h[(H+1)*2+1]=B,h[(H+2)*2]=.5,h[(H+2)*2+1]=B}for(let x=0;x<i;x++){let S=_+x*3,M=S+3;y>0?(u[d++]=S,u[d++]=S+1,u[d++]=M,u[d++]=S+1,u[d++]=M+1,u[d++]=M,u[d++]=S+1,u[d++]=S+2,u[d++]=M+1,u[d++]=S+2,u[d++]=M+2,u[d++]=M+1):(u[d++]=S,u[d++]=M,u[d++]=S+1,u[d++]=S+1,u[d++]=M,u[d++]=M+1,u[d++]=S+1,u[d++]=M+1,u[d++]=S+2,u[d++]=S+2,u[d++]=M+1,u[d++]=M+2)}}let f=new dt;f.setAttribute("position",new ot(c,3)),f.setAttribute("uv",new ot(h,2)),f.setIndex(new ot(u,1)),f.computeVertexNormals(),f.computeBoundingSphere();let g=rM(n.palette.curb,n.palette.curbAlt);Xt(s,g);let v=new He({map:g,roughness:.7,metalness:0,emissive:r==="neon"?new ae(16777215):new ae(0),emissiveMap:r==="neon"?g:null,emissiveIntensity:r==="neon"?.9:0}),p=new xe(f,v);p.name="curbs",p.receiveShadow=!0,vt(s,p),e.add(p)}{let l=(i+1)*2,c=new Float32Array(l*2*3),h=new Float32Array(l*2*2),u=new Uint32Array(i*2*6),d=0;for(let m=0;m<2;m++){let y=m===0?-1:1,_=m*l;for(let x=0;x<=i;x++){let S=x%i,M=x/i*t.length,w=t.hw[S]+Ua,b=t.whw[S]+.9,R=t.px[S],P=t.py[S],k=t.pz[S],L=t.bx[S]*y,H=t.bz[S]*y,B=_+x*2;c[B*3]=R+L*w,c[B*3+1]=P-.02,c[B*3+2]=k+H*w,c[(B+1)*3]=R+L*b,c[(B+1)*3+1]=P-.02,c[(B+1)*3+2]=k+H*b,h[B*2]=w*y/4,h[B*2+1]=M/4,h[(B+1)*2]=b*y/4,h[(B+1)*2+1]=M/4}for(let x=0;x<i;x++){let S=_+x*2,M=S+2;y>0?(u[d++]=S,u[d++]=S+1,u[d++]=M,u[d++]=S+1,u[d++]=M+1,u[d++]=M):(u[d++]=S,u[d++]=M,u[d++]=S+1,u[d++]=S+1,u[d++]=M,u[d++]=M+1)}}let f=new dt;f.setAttribute("position",new ot(c,3)),f.setAttribute("uv",new ot(h,2)),f.setIndex(new ot(u,1)),f.computeVertexNormals(),f.computeBoundingSphere();let g=Eh(r,n.palette.offroad);Xt(s,g);let v=new He({map:g,roughness:1,metalness:0}),p=new xe(f,v);p.name="shoulder",p.receiveShadow=!0,vt(s,p),e.add(p)}{let h=t.hw[0],u=t.px[0],d=t.py[0],f=t.pz[0],g=t.bx[0],v=t.bz[0],p=t.tx[0],m=t.tz[0],y=Math.hypot(p,m)||1,_=p/y,x=m/y,S=new dt,M=new Float32Array([u-g*h-_*1.6,d+.035,f-v*h-x*1.6,u+g*h-_*1.6,d+.035,f+v*h-x*1.6,u-g*h+_*1.6,d+.035,f-v*h+x*1.6,u+g*h+_*1.6,d+.035,f+v*h+x*1.6]);S.setAttribute("position",new ot(M,3)),S.setAttribute("uv",new ot(new Float32Array([0,0,1,0,0,1,1,1]),2)),S.setIndex([0,1,2,1,3,2]),S.computeVertexNormals();let w=A0(12,2);Xt(s,w);let b=new He({map:w,roughness:.8,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),R=new xe(S,b);R.name="startLine",R.receiveShadow=!0,vt(s,R),e.add(R)}return e}function rM(s,e){let t=document.createElement("canvas");t.width=8,t.height=64;let n=t.getContext("2d");n&&(n.fillStyle="#"+s.toString(16).padStart(6,"0"),n.fillRect(0,0,8,32),n.fillStyle="#"+e.toString(16).padStart(6,"0"),n.fillRect(0,32,8,32));let i=new _n(t);return i.wrapS=Kn,i.wrapT=Kn,i.magFilter=cn,i.minFilter=zn,i.colorSpace=Nt,i.anisotropy=8,i.needsUpdate=!0,i}function Mh(s,e){let t=s.voidRanges;if(!t||t.length===0)return!1;let n=Dt(e);for(let[i,r]of t)if(i<=r){if(n>=i&&n<=r)return!0}else if(n>=i||n<=r)return!0;return!1}function oM(s,e,t){let n=s.voidRanges;if(!n)return 1/0;let i=1/0;for(let[r,o]of n)for(let a of[r,o]){let l=Math.abs(Dt(e)-a);l>.5&&(l=1-l),i=Math.min(i,l*t)}return i}function Oa(s,e,t,n){let{cl:i,def:r}=s,o=[],a=Math.floor(i.length/e),l=i.length/a;for(let c=-1;c<=1;c+=2)for(let h=0;h<a;h++){let u=h*l+(c>0?l*.5:0),d=u/i.length;if(!n&&Mh(r,d))continue;let f=yh(i,u),g=i.whw[f]+t;o.push({x:i.px[f]+i.bx[f]*c*g,y:i.py[f],z:i.pz[f]+i.bz[f]*c*g,heading:Bs(i.tx[f],i.tz[f]),side:c,t:d,s:u})}return o}var N0=new xt,U0=new wt,O0=new C,z0=new C,G0=new Ft,Ns=new ae;function za(s,e,t,n,i,r,o=1,a=1,l=1,c=0){O0.set(t,n,i),G0.set(c,r,0),U0.setFromEuler(G0),z0.set(o,a,l),N0.compose(O0,U0,z0),s.setMatrixAt(e,N0)}function q0(s){let e=new Qe;e.name="barriers";let t=s.def.theme;return t==="grassland"||t==="beach"?aM(s,e):t==="desert"||t==="volcano"?lM(s,e):t==="snow"?cM(s,e):uM(s,e),s.def.voidRanges&&s.def.voidRanges.length>0&&hM(s,e),e}var V0=1.02;function aM(s,e){let t=[];for(let l=0;l<3;l++){let c=new hn(.33,.145,4,8);c.rotateX(Math.PI/2),c.translate(l%2*.03,.145+l*.29,l===1?.03:0),t.push(c)}let n=Ds(t,!1);for(let l of t)l.dispose();let i=Oa(s,V0,.5,!1),r=new He({color:16777215,roughness:.92,metalness:0}),o=new jt(n,r,i.length),a=s.rng;for(let l=0;l<i.length;l++){let c=i[l];za(o,l,c.x,c.y,c.z,c.heading+(a()-.5)*.5,1,.96+a()*.08,1);let h=Math.floor(c.s/V0);h%8===0?Ns.setHex(15329769):h%8===4?Ns.setHex(13708075):Ns.setHex(1908002).offsetHSL(0,0,(a()-.5)*.04),o.setColorAt(l,Ns)}o.instanceMatrix.needsUpdate=!0,o.instanceColor&&(o.instanceColor.needsUpdate=!0),o.castShadow=!0,o.receiveShadow=!0,o.name="tyreBarriers",vt(s,o),e.add(o)}function lM(s,e){let t=new be(.8,.9,2),n=H0(s.def.palette.wall);Xt(s,n);let i=new He({color:16777215,map:n,roughness:.95,metalness:0}),r=Oa(s,2.05,.5,!1),o=s.def.id==="dune_drift"?[[.49,.685]]:[],a=7,l=0;for(let f of r)W0(o,f.t)&&(l+=a);let c=new jt(t,i,r.length+l),h=s.rng,u=0,d=kt(s.def.palette.wall);for(let f of r){let v=W0(o,f.t)?a+1:1;for(let p=0;p<v;p++){let m=.95+h()*.15,y=f.heading+(h()-.5)*.06,_=p%2===1?1:0,x=-Math.sin(y)*_,S=-Math.cos(y)*_,M=p*.14*f.side,w=Math.cos(y)*M,b=-Math.sin(y)*M;za(c,u,f.x+x+w,f.y+.45+p*.9,f.z+S+b,y,1+p*.08,m,1+p*.12),Ns.copy(d).offsetHSL((h()-.5)*.02,0,(h()-.5)*.12-p*.012),c.setColorAt(u,Ns),u++}}c.count=u,c.instanceMatrix.needsUpdate=!0,c.instanceColor&&(c.instanceColor.needsUpdate=!0),c.castShadow=!0,c.receiveShadow=!0,c.name="sandstoneBarriers",vt(s,c),e.add(c)}function W0(s,e){for(let[t,n]of s)if(e>=t&&e<=n)return!0;return!1}function cM(s,e){let t=new be(.7,.9,1.35,1,1,1),n=new He({color:16777215,roughness:.12,metalness:.05,emissive:862783,emissiveIntensity:.6}),i=Oa(s,1.48,.45,!1),r=new jt(t,n,i.length),o=s.rng;for(let a=0;a<i.length;a++){let l=i[a],c=.85+o()*.3;za(r,a,l.x,l.y+.45*c-.02,l.z,l.heading+(o()-.5)*.1,1,c,1,(o()-.5)*.05),Ns.setHex(o()<.5?11068155:13102591).offsetHSL(0,0,(o()-.5)*.08),r.setColorAt(a,Ns)}r.instanceMatrix.needsUpdate=!0,r.instanceColor&&(r.instanceColor.needsUpdate=!0),r.castShadow=!0,r.receiveShadow=!0,r.name="iceBarriers",vt(s,r),e.add(r)}function hM(s,e){let t=new We(.07,.09,1,6);t.translate(0,.5,0),yr(t,new ae(15790320));let n=new We(.085,.085,.32,6);n.translate(0,.78,0),yr(n,new ae(16726832));let i=new ft(.13,8,6);i.translate(0,1.08,0),yr(i,new ae(16765498));let r=Ds([t,n,i],!1);t.dispose(),n.dispose(),i.dispose();let{cl:o,def:a}=s,l=Oa(s,7.5,.35,!0).filter(u=>Mh(a,u.t)||oM(a,u.t,o.length)<4),c=new He({vertexColors:!0,roughness:.6,emissive:3346688,emissiveIntensity:.4}),h=new jt(r,c,l.length);for(let u=0;u<l.length;u++){let d=l[u];za(h,u,d.x,d.y,d.z,d.heading)}h.instanceMatrix.needsUpdate=!0,h.castShadow=!0,h.name="warningPosts",vt(s,h),e.add(h)}function uM(s,e){let{cl:t,def:n}=s,i=new be(.16,.86,.16);i.translate(0,.43,0);let r=new He({color:1776424,roughness:.4,metalness:.7}),o=Oa(s,2.5,.4,!1),a=new jt(i,r,o.length);for(let d=0;d<o.length;d++){let f=o[d];za(a,d,f.x,f.y,f.z,f.heading)}a.instanceMatrix.needsUpdate=!0,a.castShadow=!0,a.name="neonPosts",vt(s,a),e.add(a);let l=[{y0:.76,y1:.84,col:n.palette.curb},{y0:.4,y1:.45,col:n.palette.roadStripe}],c=2,h=t.n,u=Math.floor(h/c)+1;for(let d of l){let f=new Float32Array(u*2*2*3),g=new Uint32Array((u-1)*2*6),v=0,p=0;for(let x=-1;x<=1;x+=2){let S=v;for(let M=0;M<u;M++){let w=M*c%h,b=t.whw[w]+.4,R=t.px[w]+t.bx[w]*x*b,P=t.pz[w]+t.bz[w]*x*b,k=t.py[w];f[v*3]=R,f[v*3+1]=k+d.y0,f[v*3+2]=P,f[(v+1)*3]=R,f[(v+1)*3+1]=k+d.y1,f[(v+1)*3+2]=P,v+=2}for(let M=0;M<u-1;M++){let w=S+M*2;g[p++]=w,g[p++]=w+1,g[p++]=w+2,g[p++]=w+1,g[p++]=w+3,g[p++]=w+2}}let m=new dt;m.setAttribute("position",new ot(f,3)),m.setIndex(new ot(g,1)),m.computeVertexNormals(),m.computeBoundingSphere();let y=new He({color:0,emissive:new ae(d.col),emissiveIntensity:1.8,roughness:.4,side:bt}),_=new xe(m,y);_.name="neonRail",vt(s,_),e.add(_)}}var X0=240;function Y0(s){let{def:e,field:t}=s,n=e.theme,i=new Ut(xh,xh,X0,X0);i.rotateX(-Math.PI/2);let r=i.getAttribute("position"),o=r.count,a=new Float32Array(o*3),l=i.getAttribute("uv"),c=kt(e.palette.ground),h=new ae,u=new ae,d=n==="snow"?kt(7306122):n==="desert"?kt(9064234):n==="neon"?kt(1381149):kt(7035454),f=n==="snow"?kt(16777215):n==="desert"?kt(15251575):n==="neon"?kt(1710118):kt(10139738),g=n==="snow"?kt(14083829):n==="desert"?kt(12157503):n==="neon"?kt(657682):kt(4160042),v=n==="snow"?kt(667721):kt(1915482),p=n==="neon"?kt(1841704):n==="snow"?kt(15923196):kt(e.palette.offroad),m=s.cl.minY;for(let M=0;M<o;M++){let w=r.getX(M)+t.centerX,b=r.getZ(M)+t.centerZ,R=t.heightAt(w,b);r.setXYZ(M,w,R,b),l.setXY(M,w/6,b/6)}i.computeVertexNormals();let y=i.getAttribute("normal");for(let M=0;M<o;M++){let w=r.getX(M),b=r.getZ(M),R=r.getY(M),P=Ye((1-y.getY(M))*2.2),k=In(w*.015+3.3,b*.015+8.8,3);t.sampleField(w,b);let L=1-Zt(s.cl.maxWallHalfWidth+2,s.cl.maxWallHalfWidth+18,t.fDist),H=Ye((R-m+6)/40);if(h.copy(g).lerp(f,H),h.lerp(c,.35),u.copy(h).offsetHSL(0,0,(k-.5)*.12),h.copy(u),h.lerp(d,P*(n==="desert"?.7:.85)),h.lerp(p,L*.55),n==="snow"){let B=m-R,F=Zt(bh*.4,bh*.75,B);h.lerp(v,F)}a[M*3]=h.r,a[M*3+1]=h.g,a[M*3+2]=h.b}i.setAttribute("color",new ot(a,3)),i.computeBoundingSphere();let _=Eh(n,16777215);Xt(s,_);let x=new He({vertexColors:!0,map:_,roughness:1,metalness:0}),S=new xe(i,x);return S.name="terrain",S.receiveShadow=!0,vt(s,S),S}function K0(s){let{def:e,field:t}=s,n=e.theme,i=[{radius:560,hMin:30,hMax:95,seg:96,tint:.55},{radius:700,hMin:60,hMax:170,seg:80,tint:1}],r=[],o=[],a=[],l=kt(e.environment.fogColor),c=n==="snow"?kt(16777215):n==="desert"?kt(11561535):n==="neon"?kt(1839664):kt(5995932),h=n==="snow"?kt(10467538):n==="desert"?kt(13667160):n==="neon"?kt(919576):kt(5208664),u=new ae,d=0;for(let p of i){let m=p.seg;for(let y=0;y<=m;y++){let _=y/m*Math.PI*2,x=In(Math.cos(_)*3+p.radius*.01,Math.sin(_)*3,3),S=rt(p.hMin,p.hMax,x);n==="neon"?S=Math.round(S/12)*12+(y%2===0?10:0):S*=.8+.4*In(_*6.3,p.radius,2);let M=p.radius*(.96+.08*In(_*2,5,2)),w=t.centerX+Math.cos(_)*M,b=t.centerZ+Math.sin(_)*M;r.push(w,-40,b),u.copy(l).lerp(h,.3*p.tint),o.push(u.r,u.g,u.b),r.push(w,S,b);let R=n==="snow"?.35:n==="grassland"?.8:1.1,P=Ye(S/p.hMax);u.copy(h).lerp(c,Zt(R-.3,R+.2,P)),u.lerp(l,.25*(1.2-p.tint)),o.push(u.r,u.g,u.b)}for(let y=0;y<m;y++){let _=d+y*2,x=_+1,S=_+2,M=_+3;a.push(_,S,x,x,S,M)}d+=(m+1)*2}let f=new dt;f.setAttribute("position",new st(r,3)),f.setAttribute("color",new st(o,3)),f.setIndex(a),f.computeVertexNormals(),f.computeBoundingSphere();let g=new ha({vertexColors:!0,side:bt}),v=new xe(f,g);return v.name="mountains",vt(s,v),v}var dM=1500,fM=`
varying vec3 vWorldDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldDir = wp.xyz - cameraPosition;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // Force the dome onto the far plane so it is never clipped by the camera far distance.
  clip.z = clip.w * 0.999999;
  gl_Position = clip;
}
`,pM=`
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunSize;
uniform float uSunGlow;
uniform float uNight;
varying vec3 vWorldDir;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

void main() {
  vec3 d = normalize(vWorldDir);
  float y = d.y;
  vec3 col;
  if (y >= 0.0) {
    float k = pow(clamp(y, 0.0, 1.0), 0.55);
    col = mix(uHorizon, uTop, k);
  } else {
    float k = pow(clamp(-y, 0.0, 1.0), 0.6);
    col = mix(uHorizon, uBottom, k);
  }
  // horizon glow band
  col += uHorizon * exp(-abs(y) * 9.0) * 0.18;

  // sun / moon disc with halo
  float sd = dot(d, uSunDir);
  float disc = smoothstep(uSunSize - 0.0012, uSunSize + 0.0004, sd);
  col += uSunColor * disc * (2.2 - uNight * 1.2);
  col += uSunColor * pow(max(sd, 0.0), 90.0) * 0.55 * uSunGlow;
  col += uSunColor * pow(max(sd, 0.0), 6.0) * 0.14 * uSunGlow;

  // procedural stars (night only)
  if (uNight > 0.5) {
    vec2 sph = vec2(atan(d.z, d.x), asin(clamp(y, -1.0, 1.0)));
    vec2 g = sph * 95.0;
    vec2 cell = floor(g);
    vec2 f = fract(g);
    float h = hash(cell);
    float h2 = hash(cell + 17.0);
    vec2 sp = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 0.7 + 0.15;
    float dist = length(f - sp);
    float star = smoothstep(0.13, 0.0, dist) * step(0.74, h) * (0.4 + 0.6 * h2);
    star *= smoothstep(0.0, 0.25, y);
    col += vec3(0.75 + 0.25 * h2, 0.82, 1.0) * star * 1.6;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;function Z0(s){let e=new Qe;e.name="sky";let t=s.def.environment,n=s.def.theme,i=n==="neon",r=s.field.centerX,o=s.field.centerZ,a=new C(t.sunDirection.x,t.sunDirection.y,t.sunDirection.z).normalize(),l=i?1.7:n==="desert"?4.2:2.6,c=new ft(dM,40,20),h=new Ct({uniforms:{uTop:{value:new ae(t.skyTop)},uHorizon:{value:new ae(t.skyHorizon)},uBottom:{value:new ae(t.skyBottom)},uSunDir:{value:a},uSunColor:{value:new ae(t.sunColor)},uSunSize:{value:Math.cos(io.degToRad(l))},uSunGlow:{value:i?.5:n==="desert"?1.6:1},uNight:{value:i?1:0}},vertexShader:fM,fragmentShader:pM,side:fn,depthWrite:!1,depthTest:!1,fog:!1}),u=new xe(c,h);return u.position.set(r,0,o),u.renderOrder=-1e3,u.frustumCulled=!1,u.name="skyDome",vt(s,u),e.add(u),e}var Us=new xt,co=new wt,_r=new C,Os=new C,Sh=new Ft,zs=new ae;function It(s){let e=s.map(n=>{let i=sf(n.geo);return n.keepColor&&i.getAttribute("color")||yr(i,n.color instanceof ae?n.color:new ae(n.color)),i}),t=Ds(e,!1);for(let n of e)n.dispose();if(!t)throw new Error("mergeParts failed");return t.computeBoundingSphere(),t}function Pn(s,e,t,n,i){let{cl:r,field:o,rng:a}=s,l=[],c=n+10,h=r.minX-c,u=r.maxX+c,d=r.minZ-c,f=r.maxZ+c,g=r.px[0],v=r.pz[0],p=r.maxWallHalfWidth+3+t,m=0;for(;l.length<e&&m<e*60;){m++;let y=rt(h,u,a()),_=rt(d,f,a()),x=o.distanceToTrack(y,_);if(x<p||x>n)continue;let S=y-g,M=_-v;S*S+M*M<3025||i&&i(y,_)||l.push({x:y,y:o.heightAt(y,_),z:_})}return l}function ci(s,e,t,n,i,r=0,o=0,a,l=!1){for(let c=0;c<e.length;c++){let h=e[c],u=rt(n,i,t());_r.set(h.x,h.y+r,h.z),Sh.set((t()-.5)*o,t()*Math.PI*2,(t()-.5)*o),co.setFromEuler(Sh),l?Os.set(u*rt(.7,1.3,t()),u*rt(.6,1.4,t()),u*rt(.7,1.3,t())):Os.set(u,u,u),Us.compose(_r,co,Os),s.setMatrixAt(c,Us),a&&s.setColorAt(c,a(t))}s.instanceMatrix.needsUpdate=!0,s.instanceColor&&(s.instanceColor.needsUpdate=!0)}function Vn(s,e,t,n,i,r=!0){let o=new jt(e,t,n);return o.name=i,o.castShadow=r,o.receiveShadow=r,vt(s,o),o}var hi=(s={})=>new He({vertexColors:!0,roughness:.85,metalness:0,...s});function $0(s){let e=new Qe;switch(e.name="decor",s.def.theme){case"desert":case"volcano":gM(s,e);break;case"snow":vM(s,e);break;case"neon":xM(s,e);break;default:mM(s,e)}return e}function mM(s,e){let t=s.rng,n=new We(.3,.46,3.2,7);n.translate(0,1.6,0);let i=new ns(2.7,1);i.scale(1,1.12,1),i.translate(0,5.3,0);let r=new ns(1.7,1);r.translate(1.4,6.4,.6);let o=new ns(1.4,1);o.translate(-1.3,6,-.8);let a=It([{geo:n,color:7031339},{geo:i,color:4165430},{geo:r,color:5219134},{geo:o,color:3836468}]),l=Pn(s,200,4,220),c=Vn(s,a,hi(),l.length,"trees");ci(c,l,t,.8,1.25,-.15,.06,b=>zs.setHSL(.3+(b()-.5)*.06,.55,.42+(b()-.5)*.15)),e.add(c);let h=new We(.22,.36,3.4,6);h.translate(0,1.7,0);let u=new Vt(1.7,7.2,8);u.translate(0,6.2,0);let d=new Vt(1.2,4.2,8);d.translate(0,8.3,0);let f=It([{geo:h,color:6177575},{geo:u,color:3111475},{geo:d,color:3836476}]),g=Pn(s,90,6,230),v=Vn(s,f,hi(),g.length,"poplars");ci(v,g,t,.75,1.1,-.15,.04,b=>zs.setHSL(.32+(b()-.5)*.05,.5,.4+(b()-.5)*.12)),e.add(v);let p=It([{geo:new ns(.9,1).scale(1.2,.8,1.2),color:4033071}]),m=Pn(s,200,.5,90),y=Vn(s,p,hi(),m.length,"bushes");ci(y,m,t,.9,1.9,.2,.2,b=>zs.setHSL(.28+(b()-.5)*.08,.6,.38+(b()-.5)*.12),!0),e.add(y);let _=[16735650,16767290,16777215,16747066,11889919,16731501],x=[];for(let b=0;b<9;b++){let R=b/9*Math.PI*2+b%2*.3,P=b<3?.18:.45+b%3*.22,k=new We(.02,.028,.5,3,1,!0);k.translate(Math.cos(R)*P,.25,Math.sin(R)*P);let L=new ns(.13,0);L.translate(Math.cos(R)*P,.54,Math.sin(R)*P),x.push({geo:k,color:4165430},{geo:L,color:_[b*2%_.length]})}let S=It(x),M=Pn(s,340,0,18).concat(Pn(s,120,18,60)),w=Vn(s,S,hi({roughness:.6}),M.length,"flowers",!1);ci(w,M,t,1.1,1.9,0,0),w.castShadow=!1,e.add(w)}function gM(s,e){let t=s.rng,n=new We(.36,.46,4.4,8);n.translate(0,2.2,0);let i=new ft(.36,8,6);i.translate(0,4.4,0);let r=new We(.22,.24,1.5,7);r.rotateZ(Math.PI/2),r.translate(-.9,2.3,0);let o=new We(.22,.22,1.6,7);o.translate(-1.55,3,0);let a=new ft(.22,7,5);a.translate(-1.55,3.8,0);let l=new We(.2,.22,1.2,7);l.rotateZ(Math.PI/2),l.translate(.75,1.7,.1);let c=new We(.2,.2,1.3,7);c.translate(1.3,2.25,.1);let h=new ft(.2,7,5);h.translate(1.3,2.9,.1);let u=5214021,d=It([{geo:n,color:u},{geo:i,color:6202193},{geo:r,color:u},{geo:o,color:u},{geo:a,color:6202193},{geo:l,color:u},{geo:c,color:u},{geo:h,color:6202193}]);d.scale(1.4,1.4,1.4);let f=Pn(s,150,1,160),g=Vn(s,d,hi({roughness:.75}),f.length,"cacti");ci(g,f,t,.9,1.35,-.1,.06,w=>zs.setHSL(.3+(w()-.5)*.05,.4,.36+(w()-.5)*.1)),e.add(g);let v=It([{geo:new Qo(1.1,0),color:11565642}]),p=Pn(s,220,.5,200),m=Vn(s,v,hi({roughness:1}),p.length,"rocks");ci(m,p,t,.7,3.4,-.4,.6,w=>zs.setHSL(.07+(w()-.5)*.03,.45,.42+(w()-.5)*.18),!0),e.add(m);let y=new We(.22,.34,6.5,7);y.translate(0,3.25,0);let _=[{geo:y,color:8018490}];for(let w=0;w<8;w++){let b=w/8*Math.PI*2,R=new Ut(.7,3.4,1,3),P=R.getAttribute("position");for(let k=0;k<P.count;k++){let H=(P.getY(k)+1.7)/3.4;P.setY(k,-H*H*1.4),P.setZ(k,H*3.2),P.setX(k,P.getX(k)*(1-H*.7))}R.rotateY(b),R.translate(0,6.6,0),_.push({geo:R,color:w%2===0?4165434:5220420})}let x=It(_);x.scale(1.25,1.25,1.25);let S=Pn(s,70,.5,60),M=Vn(s,x,hi({side:bt,roughness:.7}),S.length,"palms");ci(M,S,t,.85,1.3,-.15,.1),e.add(M)}function vM(s,e){let t=s.rng,n=new We(.18,.26,1.4,6);n.translate(0,.7,0);let i=new Vt(1.6,2.8,7);i.translate(0,2.3,0);let r=new Vt(1.2,2.3,7);r.translate(0,3.7,0);let o=new Vt(.8,1.9,7);o.translate(0,5,0);let a=new Vt(.45,.9,7);a.translate(0,5.8,0);let l=It([{geo:n,color:5913894},{geo:i,color:2054714},{geo:r,color:2452036},{geo:o,color:2914894},{geo:a,color:16055039}]),c=Pn(s,260,2,240,(b,R)=>s.field.heightAt(b,R)<s.cl.minY-8),h=Vn(s,l,hi(),c.length,"pines");ci(h,c,t,.8,1.7,-.1,.06,b=>zs.setHSL(.4,.3,.5+(b()-.5)*.2)),e.add(h);let u=new ft(.8,10,8);u.translate(0,.75,0);let d=new ft(.58,10,8);d.translate(0,1.95,0);let f=new ft(.42,10,8);f.translate(0,2.8,0);let g=new Vt(.08,.5,6);g.rotateX(-Math.PI/2),g.translate(0,2.85,-.6);let v=new We(.28,.28,.45,8);v.translate(0,3.35,0);let p=new We(.45,.45,.06,8);p.translate(0,3.14,0);let m=new hn(.42,.09,6,12);m.rotateX(Math.PI/2),m.translate(0,2.4,0);let y=It([{geo:u,color:16777215},{geo:d,color:16777215},{geo:f,color:16777215},{geo:g,color:16742938},{geo:v,color:1447446},{geo:p,color:1447446},{geo:m,color:14692400}]),_=Pn(s,45,.5,45,(b,R)=>s.field.heightAt(b,R)<s.cl.minY-8),x=Vn(s,y,hi({roughness:.7}),_.length,"snowmen");ci(x,_,t,.7,1.1,-.1,.05),e.add(x);let S=It([{geo:new Vt(.6,3.6,5),color:12118271}]);S.translate(0,1.6,0);let M=Pn(s,170,.5,120,(b,R)=>s.field.heightAt(b,R)<s.cl.minY-8),w=Vn(s,S,hi({roughness:.15,metalness:.1,emissive:731709,emissiveIntensity:.5}),M.length,"iceSpikes");ci(w,M,t,.5,1.8,-.2,.5,b=>zs.setHSL(.55,.5,.75+(b()-.5)*.2),!0),e.add(w)}function xM(s,e){let t=s.rng,{field:n}=s,i=F0(77);Xt(s,i.map,i.emissive);let r=[],o=Pn(s,130,22,300);for(let _ of o){let x=rt(10,26,t()),S=rt(10,26,t()),M=rt(18,95,Math.pow(t(),1.6)),w=new be(x,M,S),b=w.getAttribute("uv"),R=[[S,M],[S,M],[x,S],[x,S],[x,M],[x,M]];for(let P=0;P<6;P++){let[k,L]=R[P];for(let H=P*4;H<P*4+4;H++){let B=P===2||P===3;b.setXY(H,B?0:b.getX(H)*k/3.2,B?0:b.getY(H)*L/3.6)}}w.translate(_.x,n.heightAt(_.x,_.z)+M/2-.5,_.z),w.rotateY(0),r.push(sf(w))}let a=Ds(r,!1);for(let _ of r)_.dispose();if(a){a.computeBoundingSphere();let _=new He({map:i.map,emissive:16777215,emissiveMap:i.emissive,emissiveIntensity:1.3,roughness:.6,metalness:.3}),x=new xe(a,_);x.name="skyscrapers",x.castShadow=!0,x.receiveShadow=!0,vt(s,x),e.add(x)}let l=It([{geo:new be(.6,13,.6).translate(0,6.5,0),color:1842218}]),c=Pn(s,150,1,70),h=Vn(s,l,hi({roughness:.4,metalness:.7}),c.length,"pylons");ci(h,c,t,.8,1.4,-.1,0),e.add(h);let u=new be(.9,.5,.9),d=new He({color:0,emissive:16777215,emissiveIntensity:2}),f=Vn(s,u,d,c.length,"pylonCaps",!1);for(let _=0;_<c.length;_++)h.getMatrixAt(_,Us),Us.decompose(_r,co,Os),_r.y+=13*Os.y,Us.compose(_r,co,Os),f.setMatrixAt(_,Us),f.setColorAt(_,zs.setHex(_%2===0?s.def.palette.curb:s.def.palette.roadStripe));f.instanceMatrix.needsUpdate=!0,f.instanceColor&&(f.instanceColor.needsUpdate=!0),e.add(f),s.updaters.push((_,x)=>{d.emissiveIntensity=1.4+Math.sin(x*2.2)*.6+(Math.sin(x*9.1)>.92?1.2:0)});let g=Pn(s,36,2,60),v=It([{geo:new We(.18,.22,8,6).translate(0,4,0),color:2105392}]),p=Vn(s,v,hi({roughness:.5,metalness:.6}),g.length,"billboardPoles");ci(p,g,t,1,1,-.1,0),e.add(p);let m=new Ut(8,4);m.translate(0,10,0);let y=[];for(let _=0;_<2;_++){let x=Th(_);Xt(s,x);let S=new He({map:x,emissive:16777215,emissiveMap:x,emissiveIntensity:1.5,side:bt,roughness:.5});y.push(S);let M=g.filter((b,R)=>R%2===_),w=Vn(s,m,S,M.length,`billboards${_}`,!1);for(let b=0;b<M.length;b++){let R=M[b],P=n.centerX,k=n.centerZ,L=Math.atan2(P-R.x,k-R.z)+(t()-.5)*.6;_r.set(R.x,R.y,R.z),Sh.set(0,L,0),co.setFromEuler(Sh),Os.set(1,1,1),Us.compose(_r,co,Os),w.setMatrixAt(b,Us)}w.instanceMatrix.needsUpdate=!0,e.add(w)}s.updaters.push((_,x)=>{y[0].emissiveIntensity=1.2+.5*Math.sin(x*3.1)+(Math.sin(x*17.3)>.97?-.9:0),y[1].emissiveIntensity=1.2+.5*Math.sin(x*2.3+1.5)+(Math.sin(x*13.7+2)>.97?-.9:0)})}var Vi=new xt,Mi=new wt,Si=new C,Wi=new C(1,1,1),kn=new Ft,hf=new ae,uf=3.5,bM=1;function ho(s,e){let t=s.cl,n=yh(t,e),i=Math.hypot(t.tx[n],t.tz[n])||1,r=t.tx[n]/i,o=t.tz[n]/i;return{x:t.px[n],y:t.py[n],z:t.pz[n],fx:r,fz:o,rx:t.bx[n],rz:t.bz[n],hw:t.hw[n],whw:t.whw[n],heading:Bs(r,o)}}function J0(s){switch(s){case"desert":case"volcano":return[{text:"NITRO COLA",bg:9051935,fg:16773840,accent:16757575},{text:"DUNE DRIFT GP",bg:2824722,fg:16765562,accent:13062191},{text:"SCORPION OIL",bg:1842204,fg:16769658,accent:14262620}];case"snow":return[{text:"GLACIER GRIP TYRES",bg:1194598,fg:16777215,accent:10474495},{text:"FROSTBITE FALLS",bg:16777215,fg:2051978,accent:3108789},{text:"POLAR PLUS ENERGY",bg:861504,fg:12576511,accent:16777215}];case"neon":return[{text:"NEXUS NETWORKS",bg:721944,fg:58879,accent:16723926},{text:"VOLT KART BATTERIES",bg:1182242,fg:16723926,accent:58879},{text:"HOLO-DRIVE",bg:399906,fg:16771130,accent:58879}];default:return[{text:"TURBO TYRES",bg:1842210,fg:16777215,accent:14165803},{text:"KART FM 101",bg:2052008,fg:16769354,accent:16777215},{text:"NITRO COLA",bg:13114923,fg:16773840,accent:16777215}]}}function j0(s){let e=new Qe;e.name="grandstands";let t=s.def.theme,n=s.rng,i=66,r=6,o=1.9,a=1.05,c=ho(s,16),h=t==="neon",u=new ae(h?2757712:t==="desert"?12080426:t==="snow"?3108789:13116460),d=new ae(h?1710630:10132128),f=new ae(h?2364986:t==="desert"?14725232:t==="snow"?4030404:14170682),g=new ae(h?1714756:t==="desert"?12614216:t==="snow"?14675711:15790320),v=[],p=[],m=c.whw+3.2,y=a*r,_=y+4.6;for(let B=-1;B<=1;B+=2){for(let ne=0;ne<r;ne++){let ue=B*(m+o*(ne+.5)),fe=a*(ne+1),me=new be(o,fe,i);me.translate(ue,fe/2,0),v.push({geo:me,color:ne%2===0?d:d.clone().offsetHSL(0,0,-.06)});let Ke=new be(.5,.12,i);Ke.translate(B*(m+o*ne+.3),fe+.06,0),v.push({geo:Ke,color:ne%2===0?f:g});let Le=Math.floor(i/.8);for(let ye=0;ye<Le;ye++)n()<.1||p.push({lat:ue+B*(n()-.5)*.5,along:-i/2+.5+ye*.8+(n()-.5)*.3,y:fe})}let F=new be(.3,1.25,i+.6);F.translate(B*(m-.15),.625,0),v.push({geo:F,color:u});let O=new be(.4,y+1.2,i+.6);O.translate(B*(m+o*r+.2),(y+1.2)/2,0),v.push({geo:O,color:d.clone().offsetHSL(0,0,-.1)});let z=new be(o*r+2.5,.3,i+2);z.rotateZ(-B*.06),z.translate(B*(m+o*r/2+.2),_,0),v.push({geo:z,color:u.clone().offsetHSL(0,0,-.12)});let J=new be(.25,.9,i+2);J.translate(B*(m-.9),_+.2,0),v.push({geo:J,color:h?58879:16053492});for(let ne=0;ne<6;ne++){let ue=new We(.18,.18,_+.6,6);ue.translate(B*(m+o*r+.6),(_+.6)/2,-i/2+ne/5*i),v.push({geo:ue,color:d.clone().offsetHSL(0,0,-.2)})}for(let ne of[-1,1]){let ue=_+9,fe=new We(.22,.34,ue,6),me=B*(m+o*r+2.2),Ke=ne*(i/2+2.5);fe.translate(me,ue/2,Ke),v.push({geo:fe,color:6974066});let Le=new be(2.6,1.2,.5);Le.translate(me-B*.6,ue+.4,Ke),v.push({geo:Le,color:2763312})}}let x=It(v),S=new xe(x,new He({vertexColors:!0,roughness:.85}));S.castShadow=!0,S.receiveShadow=!0,S.name="grandstandStructure",vt(s,S),kn.set(0,c.heading,0),S.quaternion.setFromEuler(kn),S.position.set(c.x,c.y,c.z),e.add(S);{let B=new be(2.3,.7,.2),F=new He({color:16777215,emissive:16774358,emissiveIntensity:h?2.2:1.1,roughness:.3}),O=new jt(B,F,4),z=0;for(let J=-1;J<=1;J+=2)for(let ne of[-1,1]){let ue=_+9,fe=J*(m+o*r+2.2)-J*.6,me=ne*(i/2+2.5);Si.set(c.x+c.rx*fe-c.fx*me,c.y+ue+.4,c.z+c.rz*fe-c.fz*me),kn.set(.35*J,c.heading+(J>0?Math.PI/2:-Math.PI/2),0),Mi.setFromEuler(kn),Wi.set(1,1,1),Vi.compose(Si,Mi,Wi),O.setMatrixAt(z++,Vi)}O.instanceMatrix.needsUpdate=!0,O.name="floodlights",vt(s,O),e.add(O)}{let B=J0(t),F=new Ut(14,1.05);s.disposables.push(F);for(let O=0;O<B.length;O++){let z=B[O],J=af(z.text,z.bg,z.fg,z.accent,h);Xt(s,J);let ne=new He({map:J,roughness:.6,emissive:h?new ae(16777215):new ae(0),emissiveMap:h?J:null,emissiveIntensity:h?.9:0});s.disposables.push(ne);for(let ue=-1;ue<=1;ue+=2){let fe=new xe(F,ne),me=(O-1)*20,Ke=ue*(m-.32);fe.position.set(c.x+c.rx*Ke-c.fx*me,c.y+.66,c.z+c.rz*Ke-c.fz*me),kn.set(0,c.heading+(ue>0?-Math.PI/2:Math.PI/2),0),fe.quaternion.setFromEuler(kn),fe.name="sponsorBoard",e.add(fe)}}}let M=new be(.42,.8,.3);M.translate(0,.4,0);let w=new ft(.16,6,4);w.translate(0,.95,0);let b=It([{geo:M,color:16777215},{geo:w,color:15845797}]),R=new Float32Array(p.length);for(let B=0;B<R.length;B++)R[B]=n()*Math.PI*2;b.setAttribute("aPhase",new _s(R,1));let P=new He({vertexColors:!0,roughness:.9}),k=s.timeUniform;P.onBeforeCompile=B=>{B.uniforms.uTime=k,B.vertexShader=B.vertexShader.replace("#include <common>",`#include <common>
uniform float uTime;
attribute float aPhase;`).replace("#include <begin_vertex>",`#include <begin_vertex>
float bob = max(0.0, sin(uTime * 5.5 + aPhase)) * 0.28 * step(0.02, position.y);
transformed.y += bob;`)},P.customProgramCacheKey=()=>"tkr-crowd-bob";let L=new jt(b,P,p.length);L.name="crowd",L.castShadow=!1;let H=[16731469,5089023,16767053,7077739,16751162,16777215,13134847,3200456];for(let B=0;B<p.length;B++){let F=p[B];Si.set(c.x+c.rx*F.lat-c.fx*F.along,c.y+F.y,c.z+c.rz*F.lat-c.fz*F.along),kn.set(0,c.heading+(F.lat>0?Math.PI/2:-Math.PI/2)+(n()-.5)*.5,0),Mi.setFromEuler(kn);let O=.9+n()*.25;Wi.set(O,O,O),Vi.compose(Si,Mi,Wi),L.setMatrixAt(B,Vi),L.setColorAt(B,hf.setHex(H[Math.floor(n()*H.length)]))}return L.instanceMatrix.needsUpdate=!0,L.instanceColor&&(L.instanceColor.needsUpdate=!0),vt(s,L),e.add(L),e}function Q0(s){let e=new Qe;e.name="gantry";let t=s.def.theme,n=t==="neon",i=ho(s,0),r=i.hw*2+5.2,o=9.2,a=n?2105390:15263982,l=[];for(let k of[-1,1]){for(let H of[-.42,.42])for(let B of[-.42,.42]){let F=new be(.16,o,.16);F.translate(k*r/2+H,o/2,B),l.push({geo:F,color:a})}for(let H=1;H<6;H++){let B=H/6*o,F=new be(1,.1,1);F.translate(k*r/2,B,0),l.push({geo:F,color:a})}let L=new be(1.6,.4,1.6);L.translate(k*r/2,.2,0),l.push({geo:L,color:3816e3})}let c=new be(r+1,2.2,1.1).translate(0,o-.9,0);l.push({geo:c,color:n?1315871:2829104});for(let k of[-.62,.62])l.push({geo:new be(r+1,.14,.14).translate(0,o+.3,k),color:n?s.def.palette.curb:13708075}),l.push({geo:new be(r+1,.14,.14).translate(0,o-2.1,k),color:n?s.def.palette.roadStripe:13708075});let h=Math.max(4,Math.round(r/2.2));for(let k=0;k<=h;k++){let L=-r/2-.5+k/h*(r+1);l.push({geo:new be(.1,2.5,.1).translate(L,o-.9,.62),color:a}),l.push({geo:new be(.1,2.5,.1).translate(L,o-.9,-.62),color:a})}let u=new be(5.2,.9,.6).translate(0,o-2.5,0);l.push({geo:u,color:1710622});let d=It(l),f=new He({vertexColors:!0,roughness:.45,metalness:.5}),g=new xe(d,f);g.castShadow=!0,g.receiveShadow=!0,g.name="gantryStructure",vt(s,g),e.add(g);let v=D0(t,s.def.palette.roadStripe);Xt(s,v);let p=new Kt({map:v,toneMapped:!n}),m=new Ut(r-.6,1.9),y=new xe(m,p);y.position.set(0,o-.9,.57);let _=new xe(m,p);_.rotation.y=Math.PI,_.position.set(0,o-.9,-.57),s.disposables.push(m,p),e.add(y,_);let x=C0(t,s.def.palette.roadStripe);Xt(s,x);let S=new Kt({map:x,toneMapped:!n,side:bt}),M=new Ut(r*.62,r*.62*.25),w=new xe(M,S);w.position.set(0,o+.4+r*.62*.25/2,0),s.disposables.push(M,S),e.add(w);let b=new ft(.26,10,8),R=new He({color:16777215,emissive:16777215,emissiveIntensity:1.4,roughness:.3,vertexColors:!1}),P=new jt(b,R,5);for(let k=0;k<5;k++)Si.set(-2+k*1,o-2.5,.35),kn.set(0,0,0),Mi.setFromEuler(kn),Wi.set(1,1,1),Vi.compose(Si,Mi,Wi),P.setMatrixAt(k,Vi),P.setColorAt(k,hf.setHex(k<2?16726832:k<4?16756768:4063082));if(P.instanceMatrix.needsUpdate=!0,P.instanceColor&&(P.instanceColor.needsUpdate=!0),P.name="startLights",vt(s,P),e.add(P),s.updaters.push((k,L)=>{R.emissiveIntensity=1.1+.5*(.5+.5*Math.sin(L*2.4))}),n){let k=new be(r+1.2,.12,.12).translate(0,o+.5,0),L=new He({color:0,emissive:new ae(s.def.palette.curb),emissiveIntensity:2}),H=new xe(k,L);vt(s,H),e.add(H)}else{let k=It([{geo:new We(.04,.04,1.2,5).translate(0,.6,0),color:14540253},{geo:new Ut(.7,.45).translate(.37,1,0),color:16765498}]),L=new He({vertexColors:!0,side:bt,roughness:.8}),H=9,B=new jt(k,L,H);for(let F=0;F<H;F++)Si.set(-r/2+F/(H-1)*r,o+.4,.62),kn.set(0,0,0),Mi.setFromEuler(kn),Wi.set(1,1,1),Vi.compose(Si,Mi,Wi),B.setMatrixAt(F,Vi),B.setColorAt(F,hf.setHex(F%2===0?16777215:16728128));B.instanceMatrix.needsUpdate=!0,B.instanceColor&&(B.instanceColor.needsUpdate=!0),vt(s,B),e.add(B)}return kn.set(0,i.heading,0),e.quaternion.setFromEuler(kn),e.position.set(i.x,i.y,i.z),e}function eg(s){let e=new Qe;e.name="sponsorBridges";let t=s.def.theme,n=t==="neon",i=J0(t),o=[92,s.cl.length*(s.def.voidRanges&&s.def.voidRanges.length?.72:.55)],a=n?1842218:14211294,l=[],c=new Ut(1,1);s.disposables.push(c),o.forEach((d,f)=>{let g=ho(s,d),v=g.whw*2+3,p=7.4,m=[];for(let S of[-1,1])m.push({geo:new be(.55,p,.55).translate(S*v/2,p/2,0),color:a}),m.push({geo:new be(1.4,.35,1.4).translate(S*v/2,.17,0),color:3816e3});m.push({geo:new be(v+.55,.35,.9).translate(0,p-.17,0),color:a}),m.push({geo:new be(v+.55,.35,.9).translate(0,p-2.35,0),color:a});for(let S=0;S<=8;S++){let M=-v/2+S/8*v;m.push({geo:new be(.1,2,.1).translate(M,p-1.26,.35),color:a}),m.push({geo:new be(.1,2,.1).translate(M,p-1.26,-.35),color:a})}kn.set(0,g.heading,0),Mi.setFromEuler(kn),Si.set(g.x,g.y,g.z),Wi.set(1,1,1),Vi.compose(Si,Mi,Wi);for(let S of m)S.geo.applyMatrix4(Vi),l.push(S);let y=i[(f+1)%i.length],_=af(y.text,y.bg,y.fg,y.accent,n);Xt(s,_);let x=new He({map:_,roughness:.6,emissive:n?new ae(16777215):new ae(0),emissiveMap:n?_:null,emissiveIntensity:n?1:0});s.disposables.push(x);for(let S of[1,-1]){let M=new xe(c,x);M.scale.set(v-1.2,1.8,1),M.position.set(0,p-1.26,S*.42),S<0&&(M.rotation.y=Math.PI);let w=new Qe;w.quaternion.copy(Mi),w.position.copy(Si),w.add(M),M.name="sponsorBridgeBanner",e.add(w)}});let h=It(l),u=new xe(h,new He({vertexColors:!0,roughness:.5,metalness:.4}));return u.castShadow=!0,u.receiveShadow=!0,u.name="sponsorBridgeStructure",vt(s,u),e.add(u),e}function lf(s,e,t,n,i,r,o,a,l,c,h){let u=e.length/3;for(let d=0;d<=h;d++){let f=ho(s,rt(r,o,d/h)),g=a(f);e.push(f.x-f.rx*g,f.y+l,f.z-f.rz*g,f.x+f.rx*g,f.y+l,f.z+f.rz*g);let v=d/h*c;t.push(0,v,1,v),i.push(0,1,0,0,1,0)}for(let d=0;d<h;d++){let f=u+d*2;n.push(f,f+1,f+2,f+1,f+3,f+2)}}function cf(s,e,t,n){let i=new dt;return i.setAttribute("position",new st(s,3)),i.setAttribute("uv",new st(e,2)),i.setAttribute("normal",new st(n,3)),i.setIndex(t),i.computeBoundingSphere(),i}function tg(s,e){let{cl:t,def:n}=s;if(n.boostPads.length===0)return null;let i=new Qe;i.name="boostPads";let r=uf/2,o=.28,a=3,l=7,c=[],h=[],u=[],d=[],f=[],g=[],v=[],p=[],m=[],y=[],_=[],x=[];for(let B of n.boostPads){let F=B*t.length,O=ho(s,F),z=Math.max(3,O.hw-bM);lf(s,c,h,u,d,F-r,F+r,()=>z,.03,1,4),lf(s,f,g,v,p,F-r+o,F+r-o,()=>z-o,.045,a,4),lf(s,m,y,_,x,F+r,F+r+l,()=>z*.9,.02,1,6),e.push({position:new C(O.x,O.y,O.z),forward:new C(O.fx,0,O.fz).normalize(),halfWidth:z})}let S=I0();Xt(s,S);let M=new He({map:S,transparent:!0,roughness:.55,metalness:.1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),w=new xe(cf(c,h,u,d),M);w.name="boostPadBase",w.receiveShadow=!0,w.renderOrder=2,vt(s,w),i.add(w);let b=k0();Xt(s,b);let R=new Kt({map:b,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),P=new xe(cf(m,y,_,x),R);P.name="boostPadTrail",P.renderOrder=1,vt(s,P),i.add(P);let k=P0();Xt(s,k);let L=new He({map:k,transparent:!0,depthWrite:!1,emissive:16777215,emissiveMap:k,emissiveIntensity:1.2,roughness:.4,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),H=new xe(cf(f,g,v,p),L);return H.name="boostPadChevrons",H.renderOrder=3,vt(s,H),i.add(H),s.updaters.push((B,F)=>{k.offset.y-=B*2,k.offset.y<-1e3&&(k.offset.y+=1e3),L.emissiveIntensity=1.2+Math.sin(F*5)*.12}),i}function ng(s,e){let{cl:t,def:n}=s,i=[];for(let r of n.itemBoxRows){let o=ho(s,r*t.length),a=o.hw*.8;for(let l=0;l<e;l++){let c=e===1?0:rt(-a,a,l/(e-1));i.push(new C(o.x+o.rx*c,o.y+1,o.z+o.rz*c))}}return i}function sg(s){let e=new Qe;switch(e.name="animated",s.def.theme){case"grassland":case"beach":ig(s,e,15986918,9132587),df(s,e,2,[16731469,16767053,5089023]);break;case"desert":case"volcano":ig(s,e,12171716,5921382),df(s,e,2,[16747066,16769658,13126186]);break;case"snow":TM(s,e),df(s,e,1,[5089023,16777215,16731469]);break;case"neon":MM(s,e);break}return e}function yM(s,e,t,n){let i=s.cl,r=Math.floor((e%1+1)%1*i.n)%i.n,o=n*(i.whw[r]+t),a=i.px[r]+i.bx[r]*o,l=i.pz[r]+i.bz[r]*o;return new C(a,s.field.heightAt(a,l),l)}function ig(s,e,t,n){let i=yM(s,.5,14,s.rng()<.5?-1:1),r=new We(1.6,2.4,9,10);r.translate(0,4.5,0);let o=new Vt(2,1.8,10);o.translate(0,9.9,0);let a=new be(.9,1.6,.3);a.translate(0,.8,2.3);let l=new We(.25,.25,1.6,8);l.rotateX(Math.PI/2),l.translate(0,8.4,2.4);let c=It([{geo:r,color:t},{geo:o,color:n},{geo:a,color:5913120},{geo:l,color:3355443}]),h=new xe(c,new He({vertexColors:!0,roughness:.8}));h.castShadow=!0,h.receiveShadow=!0,h.position.copy(i),vt(s,h),e.add(h);let u=[];for(let v=0;v<4;v++){let p=new be(.18,4.6,.12);p.translate(0,2.3,0);let m=new Ut(1.1,3.6);m.translate(.62,2.7,.08),p.rotateZ(v/4*Math.PI*2),m.rotateZ(v/4*Math.PI*2),u.push({geo:p,color:5913120},{geo:m,color:16774368})}let d=new ft(.45,8,6);u.push({geo:d,color:3355443});let f=It(u),g=new xe(f,new He({vertexColors:!0,roughness:.8,side:bt}));g.castShadow=!0,g.position.set(i.x,i.y+8.4,i.z+3.25),vt(s,g),e.add(g),s.updaters.push(v=>{g.rotation.z-=v*.9})}function df(s,e,t,n){let i=s.rng;for(let r=0;r<t;r++){let o=new ft(4.2,18,12);o.scale(1,1.15,1);let a=o.getAttribute("position"),l=new Float32Array(a.count*3),c=new ae(n[r%n.length]),h=new ae(n[(r+1)%n.length]),u=new ae(n[(r+2)%n.length]);for(let M=0;M<a.count;M++){let w=Math.atan2(a.getZ(M),a.getX(M)),b=Math.floor((w+Math.PI)/(Math.PI*2)*12)%3,R=b===0?c:b===1?h:u;l[M*3]=R.r,l[M*3+1]=R.g,l[M*3+2]=R.b}o.setAttribute("color",new ot(l,3)),o.translate(0,6.5,0);let d=new Vt(2.2,2.6,12,1,!0);d.rotateX(Math.PI),d.translate(0,1.6,0);let f=new be(1.6,1.2,1.6);f.translate(0,-.6,0);let g=[];for(let M=0;M<4;M++){let w=new We(.03,.03,2.6,4);w.translate(M<2?-.7:.7,1.1,M%2===0?-.7:.7),g.push({geo:w,color:3811866})}let v=It([{geo:o,color:16777215,keepColor:!0},{geo:d,color:3355443},{geo:f,color:9067051},...g]),p=new xe(v,new He({vertexColors:!0,roughness:.6,side:bt}));p.castShadow=!0,vt(s,p),e.add(p);let m=new C(s.field.centerX+(i()-.5)*200,0,s.field.centerZ+(i()-.5)*200),y=rt(50,110,i()),_=rt(38,60,i()),x=rt(.03,.05,i())*(i()<.5?1:-1),S=i()*Math.PI*2;s.updaters.push((M,w)=>{let b=S+w*x;p.position.set(m.x+Math.cos(b)*y,_+Math.sin(w*.4+S)*2.5,m.z+Math.sin(b)*y),p.rotation.y=w*.05+S})}}var _M=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,EM=`
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i.x + i.y * 57.0), b = hash(i.x + 1.0 + i.y * 57.0), c = hash(i.x + (i.y + 1.0) * 57.0), d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main() {
  float x = vUv.x * 6.0;
  float t = uTime * 0.12;
  float curtain = noise(vec2(x * 1.5 + t, t * 0.6)) * 0.6 + noise(vec2(x * 4.0 - t * 1.3, 2.0 + t)) * 0.4;
  float band = smoothstep(0.25, 0.75, curtain);
  float v = vUv.y;
  float vertical = smoothstep(0.0, 0.25, v) * (1.0 - smoothstep(0.55, 1.0, v));
  float rays = 0.6 + 0.4 * noise(vec2(x * 12.0 + t * 3.0, v * 3.0));
  float alpha = band * vertical * rays * 0.75;
  vec3 col = mix(uColorA, uColorB, smoothstep(0.1, 0.8, v + 0.2 * noise(vec2(x, t))));
  gl_FragColor = vec4(col * alpha, alpha);
}
`;function TM(s,e){let t=s.field.centerX,n=s.field.centerZ,i=new Ct({uniforms:{uTime:s.timeUniform,uColorA:{value:new ae(2617504)},uColorB:{value:new ae(8015359)}},vertexShader:_M,fragmentShader:EM,transparent:!0,depthWrite:!1,blending:An,side:bt,fog:!1});s.disposables.push(i);let r=new Ut(520,110,1,1);s.disposables.push(r);for(let o=0;o<3;o++){let a=-Math.PI/2+(o-1)*.9+.3,l=520+o*60,c=new xe(r,i);c.position.set(t+Math.cos(a)*l,150+o*25,n+Math.sin(a)*l),c.lookAt(t,120,n),c.frustumCulled=!1,c.renderOrder=-500,c.name="aurora",e.add(c)}}function MM(s,e){let t=Pn(s,4,20,140),n=new We(9,.6,160,12,1,!0);n.translate(0,80,0),s.disposables.push(n);let i=[6615295,16735974,16777215,10513407];t.forEach((r,o)=>{let a=new Kt({color:i[o%i.length],transparent:!0,opacity:.09,blending:An,depthWrite:!1,side:bt,fog:!1});s.disposables.push(a);let l=new Qe;l.position.set(r.x,r.y,r.z);let c=new xe(n,a);c.rotation.x=.55,c.frustumCulled=!1,l.add(c),e.add(l);let h=(.25+s.rng()*.2)*(o%2===0?1:-1);s.updaters.push((u,d)=>{l.rotation.y=d*h+o,c.rotation.x=.45+Math.sin(d*.7+o)*.2})})}var rg=new xt,og=new wt,ag=new C,lg=new C(1,1,1),cg=new Ft;function ss(s,e,t,n,i){let{cl:r,field:o}=s,a=Math.floor(Dt(e)*r.n)%r.n,l=r.maxWallHalfWidth+i+4,c=r.whw[a]+n+i,h=0,u=0;for(let g=0;g<40&&(h=r.px[a]+r.bx[a]*t*c,u=r.pz[a]+r.bz[a]*t*c,!(o.distanceToTrack(h,u)>=l));g++)c+=4;let d=r.px[a]-h,f=r.pz[a]-u;return{x:h,y:o.heightAt(h,u),z:u,facing:Bs(d,f)}}function rs(s,e,t=e.facing,n=.3){s.position.set(e.x,e.y-n,e.z),s.rotation.set(0,t,0)}function qi(s,e,t,n){let i=new xe(e,t);return i.name=n,i.castShadow=!0,i.receiveShadow=!0,vt(s,i),i}function hg(s){let e=new Qe;switch(e.name="landmarks",s.def.theme){case"desert":case"volcano":RM(s,e),AM(s,e);break;case"snow":CM(s,e),IM(s,e);break;case"neon":PM(s,e),kM(s,e);break;default:SM(s,e),wM(s,e)}return e}function SM(s,e){let t=ss(s,.27,1,14,6),n=16,i=[];for(let f=0;f<4;f++){let g=f/4*Math.PI*2+Math.PI/4,v=new We(.22,.3,n,6);v.translate(0,n/2,0);let p=v.getAttribute("position");for(let m=0;m<p.count;m++){let y=p.getY(m),_=rt(4.4,3.2,y/n);p.setX(m,p.getX(m)+Math.cos(g)*_),p.setZ(m,p.getZ(m)+Math.sin(g)*_)}i.push({geo:v,color:9080726});for(let m=1;m<=3;m++){let y=m/4*n,_=rt(4.4,3.2,y/n),x=(f+1)/4*Math.PI*2+Math.PI/4,S=Math.cos(g)*_,M=Math.sin(g)*_,w=Math.cos(x)*_,b=Math.sin(x)*_,R=Math.hypot(w-S,b-M),P=new be(R,.12,.12);P.rotateY(-Math.atan2(b-M,w-S)),P.translate((S+w)/2,y,(M+b)/2),i.push({geo:P,color:7304314})}}let r=new We(4.6,3.6,1.2,16);r.translate(0,n+.6,0),i.push({geo:r,color:10133672});let o=new Vt(4.9,2.6,16);o.translate(0,n+1.2+5.2+1.3,0),i.push({geo:o,color:11680314});let a=new ft(.35,8,6);a.translate(0,n+1.2+5.2+2.7,0),i.push({geo:a,color:15790320});let l=new be(.5,n+2,.08);l.translate(0,(n+2)/2,4),i.push({geo:l,color:5264474});let c=qi(s,It(i),new He({vertexColors:!0,roughness:.7,metalness:.3}),"waterTower");rs(c,t),e.add(c);let h=new We(4.6,4.6,5.2,24,1,!1);h.translate(0,n+1.2+2.6,0);let u=L0("SUNNY",15856110,11680314);Xt(s,u);let d=qi(s,h,new He({map:u,roughness:.6,metalness:.15}),"waterTowerTank");rs(d,t,t.facing+Math.PI),e.add(d)}function wM(s,e){let t=ss(s,.79,-1,10,13),n=14,i=22,r=6.5,o=[];o.push({geo:new be(n,r,i).translate(0,r/2,0),color:12071468});let a=4868690,l=(f,g,v,p)=>{let m=Math.hypot(v-f,p-g),y=Math.atan2(p-g,v-f);for(let _ of[-1,1]){let x=new be(m+.3,.3,i+1.2);x.rotateZ(_*y),x.translate(_*(f+v)/2,(g+p)/2,0),o.push({geo:x,color:a})}};l(n/2+.3,r-.2,n/2-2.6,r+2.8),l(n/2-2.6,r+2.8,0,r+4.6);for(let f of[-1,1]){let g=new be(n-.4,4.6,.4);g.translate(0,r+2.3,f*(i/2-.2)),o.push({geo:g,color:12071468}),o.push({geo:new be(4.6,4.6,.3).translate(0,2.3,f*(i/2+.05)),color:15986662}),o.push({geo:new be(.3,4.6,.3).translate(0,2.3,f*(i/2+.2)),color:12071468}),o.push({geo:new be(n+.4,.35,.35).translate(0,r+.05,f*(i/2)),color:15986662}),o.push({geo:new be(2.4,2.4,.3).translate(0,r+2.4,f*(i/2+.05)),color:15986662})}for(let f of[-1,1]){o.push({geo:new be(.35,r+.2,i+.4).translate(f*(n/2),r/2,0),color:15986662});for(let g=-2;g<=2;g++)o.push({geo:new be(.4,1.6,1.6).translate(f*(n/2+.05),3.6,g*4.2),color:2106410})}let c=17,h=new We(3.2,3.2,c,16);h.translate(n/2+4.6,c/2,-i/2+4),o.push({geo:h,color:14277600});let u=new ft(3.25,16,8,0,Math.PI*2,0,Math.PI/2);u.translate(n/2+4.6,c,-i/2+4),o.push({geo:u,color:9080726});for(let f=1;f<5;f++){let g=new hn(3.25,.09,4,16);g.rotateX(Math.PI/2),g.translate(n/2+4.6,f/5*c,-i/2+4),o.push({geo:g,color:9080726})}o.push({geo:new We(.05,.05,2.2,5).translate(0,r+5.6,0),color:3355443}),o.push({geo:new be(1.4,.08,.08).translate(0,r+6.4,0),color:3355443});let d=qi(s,It(o),new He({vertexColors:!0,roughness:.85}),"barn");rs(d,t,t.facing+Math.PI/2,.4),e.add(d)}function RM(s,e){let t=[],n=[11032634,13071692,14260842,12085828,14724220],i=(c,h,u,d)=>{let f=c.y-1.5;u.forEach((v,p)=>{let m=new We(v.r,v.r*1.12,v.h,14,1),y=m.getAttribute("position");for(let _=0;_<y.count;_++){let x=y.getX(_),S=y.getZ(_),M=Math.atan2(S,x),w=.82+.36*In(Math.cos(M)*2+d+p*3,Math.sin(M)*2+d,2);y.setX(_,x*w),y.setZ(_,S*w*.85)}m.translate(c.x,f+v.h/2,c.z),t.push({geo:m,color:n[(p+d)%n.length]}),f+=v.h});let g=new Vt(h*1.35,3.5,14);g.translate(c.x,c.y+.2,c.z),t.push({geo:g,color:10115640})},r=ss(s,.155,-1,34,26);i(r,26,[{r:26,h:9},{r:22,h:7},{r:19,h:8},{r:12,h:5}],1);let o=ss(s,.83,1,30,22);i(o,22,[{r:22,h:8},{r:17,h:10},{r:15,h:6}],3);let a=ss(s,.62,1,46,16);i(a,16,[{r:16,h:12},{r:9,h:9},{r:6,h:7}],5);let l=qi(s,It(t),new He({vertexColors:!0,roughness:1}),"mesas");e.add(l)}function AM(s,e){let t=ss(s,.4,-1,8,5),n=4885058,i=6465110,r=[],o=15,a=new We(1.15,1.45,o,12);a.translate(0,o/2,0),r.push({geo:a,color:n}),r.push({geo:new ft(1.15,12,8).translate(0,o,0),color:i});for(let h=0;h<12;h++){let u=h/12*Math.PI*2,d=new be(.28,o-1,.28);d.translate(Math.cos(u)*1.28,(o-1)/2,Math.sin(u)*1.28),d.rotateY(-u),r.push({geo:d,color:4160057})}let l=(h,u,d,f)=>{let g=new We(.62,.66,d,9);g.rotateZ(Math.PI/2),g.translate(d/2+.8,u,0);let v=new We(.6,.62,f,9);v.translate(d+.8,u+f/2-.3,0);let p=new ft(.6,9,6);p.translate(d+.8,u+f-.3,0);let m=new ft(.64,9,6);m.translate(d+.8,u,0);for(let y of[g,v,p,m])y.rotateY(h),r.push({geo:y,color:y===p?i:n})};l(.3,6.5,3.2,6),l(2.4,8.5,2.6,5),l(4.3,5.2,2.2,4.2);for(let h=0;h<5;h++){let u=h/5*Math.PI*2;r.push({geo:new ft(.32,6,5).translate(Math.cos(u)*.7,o+.9,Math.sin(u)*.7),color:16773544})}let c=qi(s,It(r),new He({vertexColors:!0,roughness:.75}),"giantCactus");rs(c,t,t.facing,.6),e.add(c)}function ug(){return new He({color:12576511,roughness:.14,metalness:.05,emissive:798280,emissiveIntensity:.55,transparent:!0,opacity:.9,depthWrite:!0})}function CM(s,e){let t=ss(s,.235,-1,20,22),n=46,i=26,r=[],o=[];for(let u=0;u<3;u++){let d=new be(n+u*4,i/3+.6,10+u*2.5);d.translate(0,(u+.5)*(i/3),-u*1.2-4),r.push({geo:d,color:u===0?5002595:u===1?5923956:7042694})}r.push({geo:new be(n+9,1.4,16).translate(0,i+.6,-6.5),color:16186367});let a=s.rng;for(let u=0;u<14;u++){let d=-n/2+3+u/13*(n-6)+(a()-.5)*1.5,f=i*(.55+a()*.45),g=1.1+a()*1.3,v=new We(g*.55,g,f,7);v.translate(d,i-f/2+.4,1.4+(a()-.5)*1),o.push({geo:v,color:16777215});let p=new Vt(g*.5,2.6+a()*2,6);p.rotateX(Math.PI),p.translate(d,i-f-1.3,1.6),o.push({geo:p,color:16777215})}let l=new We(n*.42,n*.5,1.2,18);l.scale(1,1,.55),l.translate(0,.4,6),o.push({geo:l,color:16777215});let c=qi(s,It(r),new He({vertexColors:!0,roughness:.95}),"waterfallCliff");rs(c,t,t.facing,1.5),e.add(c);let h=qi(s,It(o),ug(),"frozenWaterfall");h.castShadow=!1,rs(h,t,t.facing,1.5),e.add(h)}function IM(s,e){let t=ss(s,.66,1,22,20),n=[],i=14086143,r=4161481,o=(c,h,u,d)=>{n.push({geo:new We(u,u*1.08,d,12).translate(c,d/2,h),color:i}),n.push({geo:new Vt(u*1.25,u*3.2,12).translate(c,d+u*1.6,h),color:r}),n.push({geo:new hn(u*1.05,.35,5,12).rotateX(Math.PI/2).translate(c,d-.4,h),color:15661311}),n.push({geo:new We(.06,.06,3,4).translate(c,d+u*3.2+1.2,h),color:3356740}),n.push({geo:new Ut(1.8,.9).translate(c+.9,d+u*3.2+2.2,h),color:16731482})},a=13;o(-a,-a,3,20),o(a,-a,3,20),o(-a,a,3,18),o(a,a,3,18);for(let[c,h,u,d]of[[0,-a,a*2,2.2],[0,a,a*2,2.2],[-a,0,2.2,a*2],[a,0,2.2,a*2]]){n.push({geo:new be(u,12,d).translate(c,6,h),color:i});let f=u>d,g=Math.floor(Math.max(u,d)/2.4);for(let v=0;v<g;v++){let p=-.5+(v+.5)/g,m=f?new be(1.2,1.4,d+.2):new be(u+.2,1.4,1.2);m.translate(c+(f?p*u:0),12.7,h+(f?0:p*d)),n.push({geo:m,color:15661311})}}n.push({geo:new be(6,8,3).translate(0,4,a+.4),color:11852018}),n.push({geo:new be(3.4,6,.6).translate(0,3,a+1.8),color:1981013}),n.push({geo:new be(12,22,12).translate(0,11,0),color:i}),n.push({geo:new Vt(9.2,10,4).rotateY(Math.PI/4).translate(0,27,0),color:r}),o(0,0,2.2,32);let l=qi(s,It(n),ug(),"iceCastle");l.material.vertexColors=!0,l.material.color.set(16777215),l.material.opacity=.96,l.material.side=bt,rs(l,t,t.facing,1),e.add(l)}function PM(s,e){let t=ss(s,.585,1,16,8),n=30,i=14,r=16,o=[];for(let d of[-1,1])o.push({geo:new be(1.2,r+i,1.2).translate(d*(n/2-1.5),(r+i)/2,0),color:1842218});o.push({geo:new be(n+1.6,i+1.6,.9).translate(0,r+i/2,-.2),color:1184288}),o.push({geo:new be(n+2.4,.5,1.6).translate(0,r+i+1.1,0),color:58879}),o.push({geo:new be(n+2.4,.5,1.6).translate(0,r-1.1,0),color:16723926});let a=qi(s,It(o),new He({vertexColors:!0,roughness:.4,metalness:.6}),"holoBillboardFrame");rs(a,t,t.facing+Math.PI,.5),e.add(a);let l=Th(2);Xt(s,l);let c=new He({map:l,emissive:16777215,emissiveMap:l,emissiveIntensity:1.4,roughness:.5,transparent:!0,opacity:.92}),h=new xe(new Ut(n,i),c);h.name="holoBillboardScreen",h.position.set(0,r+i/2,.36),vt(s,h);let u=new Qe;rs(u,t,t.facing+Math.PI,.5),u.add(h),e.add(u),s.updaters.push((d,f)=>{let g=Math.sin(f*23)>.96?.5:1;c.emissiveIntensity=(1.3+.25*Math.sin(f*1.7))*g,c.opacity=.86+.08*Math.sin(f*3.3)})}function kM(s,e){let{cl:t,field:n}=s,i=.44,r=.86,o=-1,a=15,l=11.5,c=t.n,h=Math.floor(i*c),u=Math.floor(r*c),d=4,f=Math.floor((u-h)/d)+1,g=.9,v=.55,p=new Float32Array(f*4*3),m=[],y=Le=>t.py[Le]+l;for(let Le=0;Le<f;Le++){let ye=h+Le*d,W=t.whw[ye]+a,se=t.px[ye]+t.bx[ye]*o*W,ie=t.pz[ye]+t.bz[ye]*o*W,_e=y(ye),Me=[[se-t.bx[ye]*g,_e+v,ie-t.bz[ye]*g],[se+t.bx[ye]*g,_e+v,ie+t.bz[ye]*g],[se+t.bx[ye]*g,_e-v,ie+t.bz[ye]*g],[se-t.bx[ye]*g,_e-v,ie-t.bz[ye]*g]];for(let Ee=0;Ee<4;Ee++){let Ge=(Le*4+Ee)*3;p[Ge]=Me[Ee][0],p[Ge+1]=Me[Ee][1],p[Ge+2]=Me[Ee][2]}if(Le>0){let Ee=(Le-1)*4,Ge=Le*4;for(let Fe=0;Fe<4;Fe++){let re=(Fe+1)%4;m.push(Ee+Fe,Ge+Fe,Ee+re,Ee+re,Ge+Fe,Ge+re)}}}let _=new dt;_.setAttribute("position",new ot(p,3)),_.setIndex(m),_.computeVertexNormals(),_.computeBoundingSphere();let x=qi(s,_,new He({color:2763324,roughness:.5,metalness:.6,side:bt}),"monorailBeam");x.receiveShadow=!1,e.add(x);let S=new Float32Array(f*2*3),M=[];for(let Le=0;Le<f;Le++){let ye=h+Le*d,W=t.whw[ye]+a-g-.02,se=t.px[ye]+t.bx[ye]*o*W,ie=t.pz[ye]+t.bz[ye]*o*W,_e=y(ye);if(S.set([se,_e+.12,ie,se,_e-.12,ie],Le*6),Le>0){let Me=(Le-1)*2;M.push(Me,Me+2,Me+1,Me+1,Me+2,Me+3)}}let w=new dt;w.setAttribute("position",new ot(S,3)),w.setIndex(M),w.computeVertexNormals(),w.computeBoundingSphere();let b=new xe(w,new He({color:0,emissive:58879,emissiveIntensity:1.6,side:bt}));b.name="monorailGlow",vt(s,b),e.add(b);let R=new be(1.1,1,1.1);R.translate(0,.5,0);let P=new He({color:1710632,roughness:.5,metalness:.5}),k=22,L=(r-i)*t.length,H=Math.floor(L/k)+1,B=new jt(R,P,H);for(let Le=0;Le<H;Le++){let ye=Math.min(u,h+Math.floor(Le*k/t.length*c)),W=t.whw[ye]+a,se=t.px[ye]+t.bx[ye]*o*W,ie=t.pz[ye]+t.bz[ye]*o*W,_e=n.heightAt(se,ie)-.5,Me=y(ye)-v-_e;ag.set(se,_e,ie),cg.set(0,Bs(t.tx[ye],t.tz[ye]),0),og.setFromEuler(cg),lg.set(1,Me,1),rg.compose(ag,og,lg),B.setMatrixAt(Le,rg)}B.instanceMatrix.needsUpdate=!0,B.castShadow=!0,B.name="monorailPylons",vt(s,B),e.add(B);let F=[],O=7;for(let Le=0;Le<3;Le++){let ye=(Le-1)*(O+.6),W=new be(2.4,2.4,O);W.translate(0,v+1.5,ye),F.push({geo:W,color:15265012});let se=new be(2,.4,O-.8);se.translate(0,v+2.9,ye),F.push({geo:se,color:2763324});let ie=new be(2.6,.5,O-.4);ie.translate(0,v+.25,ye),F.push({geo:ie,color:1710632});for(let _e of[-1,1]){let Me=new be(.1,.9,O-1.4);Me.translate(_e*1.22,v+1.9,ye),F.push({geo:Me,color:58879});let Ee=new be(.06,.25,O-.6);Ee.translate(_e*1.24,v+.8,ye),F.push({geo:Ee,color:16723926})}}for(let Le of[-1,1]){let ye=new Vt(1.3,2.2,8);ye.rotateX(Le>0?Math.PI/2:-Math.PI/2),ye.translate(0,v+1.5,Le*(1.5*O+1.2+1.1)),F.push({geo:ye,color:15265012})}let z=It(F),J=new He({vertexColors:!0,roughness:.35,metalness:.5,emissive:16777215,emissiveIntensity:0});J.onBeforeCompile=Le=>{Le.fragmentShader=Le.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
 float glowMask = step(0.8, vColor.b) * step(vColor.r, 0.3);
 float magenta = step(0.8, vColor.r) * step(0.8, vColor.b) * step(vColor.g, 0.4);
 totalEmissiveRadiance += vColor.rgb * (glowMask * 1.6 + magenta * 1.4);`)},J.customProgramCacheKey=()=>"tkr-monorail-train";let ne=new xe(z,J);ne.name="monorailTrain",ne.castShadow=!0,vt(s,ne),e.add(ne);let ue=i*t.length+14,fe=r*t.length-14,Ke=(fe-ue)/16;s.updaters.push((Le,ye)=>{let W=(Ke+3)*2,se=ye%W/W,ie=!0;se>=.5?(se=(se-.5)*2,ie=!1):se*=2;let _e=3/(Ke+3),Me=Math.min(1,Math.max(0,(se-_e*.5)/(1-_e))),Ee=ie?rt(ue,fe,Me):rt(fe,ue,Me),Ge=Math.floor(Ee/t.length*c)%c,Fe=t.whw[Ge]+a;ne.position.set(t.px[Ge]+t.bx[Ge]*o*Fe,y(Ge),t.pz[Ge]+t.bz[Ge]*o*Fe);let re=Bs(t.tx[Ge],t.tz[Ge]);ne.rotation.y=ie?re:re+Math.PI})}var DM=uf/2,dg=.5,LM=4.5;function ff(){return{position:new C,tangent:new C(0,0,-1),normal:new C(0,1,0),binormal:new C(1,0,0),halfWidth:8,wallHalfWidth:12,t:0}}function FM(){return{t:0,surface:"road",groundY:0,groundNormal:new C(0,1,0),lateral:0,halfWidth:8,wallHalfWidth:12,tangent:new C(0,0,-1),binormal:new C(1,0,0),center:new C}}var Tn=ff(),en=ff();function HM(s){let e=2166136261;for(let t=0;t<s.length;t++)e^=s.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}var wh=class{constructor(e){E(this,"def");E(this,"object");E(this,"length");E(this,"checkpoints");E(this,"startGrid");E(this,"itemBoxPositions");E(this,"boostPads");E(this,"minimap");E(this,"cl");E(this,"field");E(this,"updaters",[]);E(this,"disposables",[]);E(this,"timeUniform",{value:0});E(this,"boostPadTs");E(this,"boostPadHalfWidths");E(this,"disposed",!1);this.def=e,this.cl=new gh(e),this.length=this.cl.length,this.field=new vh(e,this.cl),this.boostPadTs=e.boostPads.map(o=>Dt(o));let t={def:e,cl:this.cl,field:this.field,rng:Ti(HM(e.id)),disposables:this.disposables,updaters:this.updaters,timeUniform:this.timeUniform};this.checkpoints=this.buildCheckpoints(),this.startGrid=this.buildStartGrid(),this.itemBoxPositions=ng(t,$m),this.minimap=this.buildMinimap();let n=new Qe;n.name=`track:${e.id}`,n.add(Z0(t)),n.add(Y0(t)),n.add(K0(t)),n.add(B0(t)),n.add(q0(t)),n.add($0(t)),n.add(hg(t)),n.add(j0(t)),n.add(Q0(t)),n.add(eg(t));let i=[],r=tg(t,i);r&&n.add(r),this.boostPads=i,this.boostPadHalfWidths=new Float64Array(this.boostPadTs.length);for(let o=0;o<i.length&&o<this.boostPadHalfWidths.length;o++)this.boostPadHalfWidths[o]=i[o].halfWidth;n.add(sg(t)),this.object=n}sample(e,t){return this.cl.sample(e,t??ff())}closestT(e,t){return this.cl.closestT(e.x,e.z,t)}query(e,t,n){let i=n??FM(),r=this.cl.closestT(e.x,e.z,t);this.cl.sample(r,Tn),i.t=r,i.center.copy(Tn.position),i.tangent.copy(Tn.tangent),i.binormal.copy(Tn.binormal),i.halfWidth=Tn.halfWidth,i.wallHalfWidth=Tn.wallHalfWidth;let o=e.x-Tn.position.x,a=e.z-Tn.position.z,l=o*Tn.binormal.x+a*Tn.binormal.z;i.lateral=l;let c=Math.abs(l),h=Tn.halfWidth,u=Tn.wallHalfWidth,d;c<=h?d=this.isBoostAt(r,c)?"boost":"road":c<=u?d="offroad":d=Mh(this.def,r)?"void":"wall",i.surface=d;let f=Tn.position.y;if(c<=u+dg)i.groundY=f,i.groundNormal.copy(Tn.normal);else{let g=Zt(u+dg,u+LM,c),v=this.field.heightAt(e.x,e.z);i.groundY=rt(f,v,g);let p=.6,m=this.field.heightAt(e.x+p,e.z),y=this.field.heightAt(e.x-p,e.z),_=this.field.heightAt(e.x,e.z+p),x=this.field.heightAt(e.x,e.z-p),S=(y-m)/(2*p),M=(x-_)/(2*p);i.groundNormal.set(rt(Tn.normal.x,S,g),rt(Tn.normal.y,1,g),rt(Tn.normal.z,M,g)).normalize()}return i}heightAt(e,t){return this.field.heightAt(e,t)}isBoostAt(e,t){let n=this.boostPadTs,i=this.boostPadHalfWidths,r=this.length;for(let o=0;o<n.length;o++)if(t<=i[o]&&Math.abs(En(n[o],e))*r<=DM)return!0;return!1}update(e,t){this.timeUniform.value=t;for(let n=0;n<this.updaters.length;n++)this.updaters[n](e,t)}dispose(){if(this.disposed)return;this.disposed=!0;let e=new Set;for(let t of this.disposables)e.has(t)||(e.add(t),t.dispose());this.object.traverse(t=>{let n=t;n.geometry&&!e.has(n.geometry)&&(e.add(n.geometry),n.geometry.dispose());let i=n.material;if(!i)return;let r=Array.isArray(i)?i:[i];for(let o of r)e.has(o)||(e.add(o),o.dispose())}),this.updaters.length=0,this.disposables.length=0,this.object.clear(),this.object.removeFromParent()}buildCheckpoints(){let e=[];for(let t=0;t<lo;t++){let n=t/lo;this.cl.sample(n,en),e.push({index:t,t:n,position:en.position.clone(),forward:en.tangent.clone(),halfWidth:en.halfWidth,isFinishLine:t===0})}return e}buildStartGrid(){let e=[],r=Math.max(8,8),o=new Ft;for(let a=0;a<r;a++){let l=Math.floor(a/2),c=a%2,h=6+l*4.5+(c===1?4.5*.5:0),u=this.cl.tOf(-h);this.cl.sample(u,en);let d=c===0?-2.2:2.2,f=new C(en.position.x+en.binormal.x*d,en.position.y,en.position.z+en.binormal.z*d),g=Math.atan2(-en.tangent.x,-en.tangent.z);o.set(0,g,0);let v=new wt().setFromEuler(o);e.push({position:f,quaternion:v,t:u})}return e}buildMinimap(){let t=[],n=[],i=[],r=[],o=[],a=[],l=1/0,c=-1/0,h=1/0,u=-1/0;for(let y=0;y<200;y++){this.cl.sample(y/200,en);let _=en.position.clone(),x=new C(_.x-en.binormal.x*en.halfWidth,_.y,_.z-en.binormal.z*en.halfWidth),S=new C(_.x+en.binormal.x*en.halfWidth,_.y,_.z+en.binormal.z*en.halfWidth);r.push(_),o.push(x),a.push(S);for(let M of[x,S])M.x<l&&(l=M.x),M.x>c&&(c=M.x),M.z<h&&(h=M.z),M.z>u&&(u=M.z)}let d=c-l,f=u-h,g=Math.max(d,f)*1.08,v=l-(g-d)/2,p=h-(g-f)/2,m=(y,_)=>({x:(y-v)/g,y:(_-p)/g});for(let y=0;y<200;y++)t.push(m(r[y].x,r[y].z)),n.push(m(o[y].x,o[y].z)),i.push(m(a[y].x,a[y].z));return{points:t,leftEdge:n,rightEdge:i,worldToMap:m}}};var fg={id:"sunny_circuit",name:"Sunny Circuit",theme:"grassland",laps:3,description:"Rolling green hills, a long start straight and one tricky hairpin. The perfect warm-up.",difficulty:1,controlPoints:[{x:0,y:0,z:0},{x:0,y:0,z:-68.5},{x:0,y:0,z:-137.1},{x:16.1,y:.8,z:-175.9},{x:54.8,y:1.5,z:-191.9},{x:100.5,y:2,z:-191.9},{x:136.1,y:3.5,z:-177.2},{x:150.8,y:5,z:-141.7},{x:150.8,y:7,z:-61.7},{x:150.8,y:2.2,z:18.3},{x:140.7,y:1.5,z:35.7},{x:120.6,y:1.5,z:35.7},{x:110.6,y:1.5,z:18.3},{x:110.6,y:.5,z:-36.6},{x:102.6,y:0,z:-55.9},{x:83.2,y:0,z:-64},{x:64.9,y:0,z:-64},{x:48.7,y:0,z:-57.3},{x:42,y:0,z:-41.1},{x:58,y:0,z:-13.4},{x:74,y:0,z:14.3},{x:74,y:0,z:32.6},{x:55.5,y:0,z:64.6},{x:18.5,y:0,z:64.6},{x:0,y:0,z:32.6}],halfWidth:8,halfWidths:[8.5,8.5,8.5,8,8,8,8,8,8,8.5,9,9,8.5,8,8,8,8,8,8,8,8,8.5,9,9,8.5],wallHalfWidthFactor:1.55,itemBoxRows:[.1,.4,.62,.83],boostPads:[.3,.7,.95],environment:{skyTop:3108824,skyHorizon:10474495,skyBottom:14675711,fogColor:13624319,fogDensity:.0016,sunColor:16773848,sunIntensity:2.6,sunDirection:{x:.47,y:.78,z:.41},ambientSky:10470911,ambientGround:7311183,ambientIntensity:.9},palette:{road:4869202,roadStripe:16053484,curb:14165803,curbAlt:16119285,offroad:6134330,wall:2763310,ground:5214004}};var pg={id:"dune_drift",name:"Dune Drift",theme:"desert",laps:3,description:"Sunset sweepers, a canyon run between towering sandstone walls and two hairpins that punish greed.",difficulty:2,controlPoints:[{x:0,y:0,z:0},{x:0,y:0,z:-120.2},{x:60.1,y:2,z:-180.3},{x:100.2,y:3,z:-180.3},{x:136.2,y:4.5,z:-144.2},{x:136.2,y:8,z:-116.2},{x:136.2,y:4.5,z:-88.1},{x:146.2,y:2,z:-70.8},{x:166.3,y:2,z:-70.8},{x:176.3,y:2,z:-88.1},{x:176.3,y:3,z:-128.2},{x:212.3,y:5,z:-164.2},{x:248.4,y:6,z:-128.2},{x:248.4,y:3.8,z:-20.8},{x:248.4,y:.5,z:86.5},{x:237.6,y:0,z:105.3},{x:215.9,y:0,z:105.3},{x:205.1,y:0,z:86.5},{x:205.1,y:0,z:66.5},{x:171.5,y:.5,z:32.8},{x:136.8,y:1.5,z:52.9},{x:102.1,y:2.5,z:72.9},{x:44.1,y:.5,z:72.9},{x:0,y:0,z:28.8}],halfWidth:8.5,halfWidths:[9,9,8.5,8.5,8.5,8.5,8.5,9,9,9,8.5,8.5,8,7.5,7.5,9,9,9,8.5,8.5,8.5,8.5,9,9],wallHalfWidthFactor:1.3,itemBoxRows:[.12,.42,.62,.86],boostPads:[.255,.55,.88],environment:{skyTop:2833024,skyHorizon:16751196,skyBottom:16767400,fogColor:15907210,fogDensity:.0022,sunColor:16757355,sunIntensity:2.4,sunDirection:{x:-.7,y:.36,z:.61},ambientSky:16762266,ambientGround:10119738,ambientIntensity:.85},palette:{road:5918278,roadStripe:16769658,curb:13062191,curbAlt:15984328,offroad:14262620,wall:13209178,ground:13736271}};var mg={id:"frostbite_falls",name:"Frostbite Falls",theme:"snow",laps:3,description:"A plunging descent onto a frozen lake causeway with nothing but ice between you and the drop.",difficulty:2,controlPoints:[{x:0,y:8,z:0},{x:0,y:8,z:-134.1},{x:-6.7,y:7.5,z:-150.4},{x:-6.7,y:6.5,z:-182.9},{x:0,y:5.5,z:-199.2},{x:0,y:4.5,z:-237.5},{x:57.5,y:2,z:-295},{x:134.1,y:0,z:-295},{x:208.7,y:-1,z:-264.1},{x:239.5,y:-1,z:-189.6},{x:239.5,y:-1,z:-122.5},{x:239.5,y:1.5,z:-21.9},{x:239.5,y:4,z:78.7},{x:191.6,y:5.5,z:126.6},{x:143.7,y:6.5,z:126.6},{x:127.5,y:7.5,z:119.8},{x:94.9,y:8.5,z:119.8},{x:78.7,y:9,z:126.6},{x:47.9,y:8.5,z:126.6},{x:0,y:8,z:78.7}],halfWidth:8,halfWidths:[8.5,8.5,8.5,8.5,8.5,8,8,7.5,7.5,7.5,7.5,8,8,8,8,8.5,8.5,8.5,8,8.5],wallHalfWidthFactor:1.5,itemBoxRows:[.08,.36,.62,.9],boostPads:[.22,.66,.935],voidRanges:[[.315,.545]],environment:{skyTop:1982330,skyHorizon:10275824,skyBottom:14938623,fogColor:12376306,fogDensity:.0032,sunColor:14674687,sunIntensity:2,sunDirection:{x:.36,y:.66,z:-.66},ambientSky:11128309,ambientGround:9414852,ambientIntensity:1},palette:{road:5595246,roadStripe:15267583,curb:3108789,curbAlt:16777215,offroad:15397883,wall:9425138,ground:15134712}};var gg={id:"neon_nexus",name:"Neon Nexus",theme:"neon",laps:3,description:"Three hairpins, a rooftop jump and a flat-out neon straight under a violet sky. Experts only.",difficulty:3,controlPoints:[{x:0,y:0,z:0},{x:0,y:0,z:-158.5},{x:65.3,y:2,z:-223.7},{x:93.2,y:6.5,z:-223.7},{x:121.2,y:3,z:-223.7},{x:163.1,y:1,z:-181.8},{x:163.1,y:0,z:-144.5},{x:173.4,y:0,z:-126.7},{x:193.9,y:0,z:-126.7},{x:204.1,y:0,z:-144.5},{x:204.1,y:1,z:-181.8},{x:246.1,y:2.5,z:-223.7},{x:288,y:4,z:-181.8},{x:288,y:0,z:4.7},{x:275,y:0,z:27.3},{x:248.9,y:0,z:27.3},{x:235.8,y:0,z:4.7},{x:193.9,y:2,z:-37.3},{x:147.3,y:3,z:-37.3},{x:111,y:2.5,z:-16.3},{x:74.6,y:1.5,z:4.7},{x:46.7,y:1,z:32.6},{x:46.7,y:.5,z:88.6},{x:35,y:0,z:108.8},{x:11.7,y:0,z:108.8},{x:0,y:0,z:88.6}],halfWidth:7.5,halfWidths:[8,8,7.5,7.5,7.5,7.5,8,8.5,8.5,8.5,8,7.5,7.5,8,8.5,8.5,8.5,7.5,7.5,7.5,7.5,7.5,8,8.5,8.5,8],wallHalfWidthFactor:1.4,itemBoxRows:[.09,.4,.56,.8],boostPads:[.175,.52,.75],environment:{skyTop:131596,skyHorizon:7019164,skyBottom:1264227,fogColor:1181215,fogDensity:8e-4,sunColor:10467327,sunIntensity:.9,sunDirection:{x:-.35,y:.8,z:-.49},ambientSky:3873894,ambientGround:993850,ambientIntensity:.7},palette:{road:1381404,roadStripe:16723926,curb:58879,curbAlt:16723926,offroad:1973290,wall:58879,ground:789268}};var Ga=[fg,pg,mg,gg];function pf(s){return Ga.find(e=>e.id===s)??Ga[0]}var uo=64,xf=new Map;function Eg(s){let e=xf.get(s);if(e)return e;let t=document.createElement("canvas");t.width=uo,t.height=uo;let n=t.getContext("2d");return n&&(n.clearRect(0,0,uo,uo),n.lineJoin="round",n.lineCap="round",BM(n,s)),xf.set(s,t),t}function BM(s,e){let t=uo/2;switch(e){case"none":return;case"banana":Rh(s,t,t+1,1);return;case"triple_banana":Rh(s,t-15,t-10,.52),Rh(s,t+15,t-10,.52),Rh(s,t,t+13,.52);return;case"green_shell":Va(s,t,t,1,"#2fd24a","#0f6b22",!1);return;case"red_shell":Va(s,t,t,1,"#ff3b30","#8a1410",!1);return;case"blue_shell":Va(s,t,t,1,"#2f7bff","#12348f",!0);return;case"triple_green_shell":mf(s,(n,i,r)=>Va(s,n,i,r,"#2fd24a","#0f6b22",!1));return;case"triple_red_shell":mf(s,(n,i,r)=>Va(s,n,i,r,"#ff3b30","#8a1410",!1));return;case"mushroom":gf(s,t,t,1,"#ff3b30",!1);return;case"triple_mushroom":mf(s,(n,i,r)=>gf(s,n,i,r,"#ff3b30",!1));return;case"golden_mushroom":gf(s,t,t,1,"#ffc531",!0);return;case"star":NM(s,t,t,1);return;case"lightning":UM(s,t,t,1);return;case"bob_omb":OM(s,t,t,1);return}}function mf(s,e){let t=uo/2;e(t-15,t-9,.5),e(t+15,t-9,.5),e(t,t+13,.5)}function Jn(s,e,t,n,i){s.beginPath(),s.ellipse(e,t,n,i,0,0,qe)}function Rh(s,e,t,n){s.save(),s.translate(e,t),s.scale(n,n),s.rotate(-.45);let i=()=>{s.beginPath(),s.moveTo(-19,-5),s.quadraticCurveTo(-3,22,19,1)};i(),s.lineWidth=15,s.strokeStyle="#4a3208",s.stroke(),i(),s.lineWidth=11,s.strokeStyle="#ffd83a",s.stroke(),s.beginPath(),s.moveTo(-13,-5),s.quadraticCurveTo(-2,12,12,0),s.lineWidth=3,s.strokeStyle="rgba(255,255,255,0.55)",s.stroke(),s.fillStyle="#6b4a12",s.beginPath(),s.arc(-19.5,-5.5,3.4,0,qe),s.fill(),s.beginPath(),s.arc(19.5,.5,3.1,0,qe),s.fill(),s.restore()}function Va(s,e,t,n,i,r,o){if(s.save(),s.translate(e,t),s.scale(n,n),s.lineWidth=2.5,s.fillStyle="#f5ead0",s.strokeStyle="#3a2a10",Jn(s,0,10,23,8),s.fill(),s.stroke(),o){s.fillStyle="#ffffff",s.strokeStyle="#3a3a3a";for(let a=0;a<5;a++){let l=Math.PI+Math.PI*(a+.5)/5,c=Math.cos(l)*17,h=6+Math.sin(l)*17,u=Math.cos(l)*28,d=6+Math.sin(l)*28,f=-Math.sin(l)*4,g=Math.cos(l)*4;s.beginPath(),s.moveTo(c+f,h+g),s.lineTo(u,d),s.lineTo(c-f,h-g),s.closePath(),s.fill(),s.stroke()}}s.beginPath(),s.ellipse(0,6,22,21,0,Math.PI,qe),s.closePath(),s.fillStyle=i,s.fill(),s.strokeStyle=r,s.stroke(),s.save(),s.beginPath(),s.ellipse(0,6,22,21,0,Math.PI,qe),s.closePath(),s.clip(),s.strokeStyle=r,s.lineWidth=1.6,s.beginPath(),s.moveTo(-8,-15),s.lineTo(-11,-4),s.lineTo(-4,2),s.lineTo(4,2),s.lineTo(11,-4),s.lineTo(8,-15),s.closePath(),s.stroke(),s.beginPath(),s.moveTo(-11,-4),s.lineTo(-19,-1),s.moveTo(11,-4),s.lineTo(19,-1),s.moveTo(-4,2),s.lineTo(-6,9),s.moveTo(4,2),s.lineTo(6,9),s.stroke(),s.restore(),s.fillStyle="#ffffff",s.strokeStyle="#3a2a10",s.lineWidth=2,Jn(s,0,6,22.5,5),s.fill(),s.stroke(),s.fillStyle="rgba(255,255,255,0.5)",Jn(s,-9,-7,5,3),s.fill(),s.restore()}function gf(s,e,t,n,i,r){s.save(),s.translate(e,t),s.scale(n,n),s.lineWidth=2.5,s.fillStyle=r?"#fff1c4":"#fff4dc",s.strokeStyle="#3a2a10",s.beginPath(),s.roundRect(-11,2,22,20,7),s.fill(),s.stroke(),s.fillStyle="#1c1c22",Jn(s,-5,13,2.2,3.6),s.fill(),Jn(s,5,13,2.2,3.6),s.fill();let o=()=>{s.beginPath(),s.ellipse(0,5,25,21,0,Math.PI,qe),s.closePath()};o(),s.fillStyle=i,s.fill(),s.save(),o(),s.clip(),s.fillStyle=r?"#fff6cf":"#ffffff";let a=[[-12,-6,5],[0,-14,6],[12,-6,5],[-21,2,4],[21,2,4]];for(let[l,c,h]of a)s.beginPath(),s.arc(l,c,h,0,qe),s.fill();if(r){let l=s.createLinearGradient(-20,-16,20,6);l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.45,"rgba(255,255,255,0.55)"),l.addColorStop(.55,"rgba(255,255,255,0.55)"),l.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=l,s.fillRect(-26,-18,52,26)}s.restore(),o(),s.strokeStyle=r?"#7a4d00":"#3a2a10",s.stroke(),r&&(s.fillStyle="#ffffff",vg(s,16,-12,5),vg(s,-18,-2,3.5)),s.restore()}function vg(s,e,t,n){s.beginPath(),s.moveTo(e,t-n),s.quadraticCurveTo(e,t,e+n,t),s.quadraticCurveTo(e,t,e,t+n),s.quadraticCurveTo(e,t,e-n,t),s.quadraticCurveTo(e,t,e,t-n),s.fill()}function xg(s,e,t,n,i){s.beginPath();for(let r=0;r<10;r++){let o=r%2===0?n:i,a=-Math.PI/2+r*Math.PI/5,l=e+Math.cos(a)*o,c=t+Math.sin(a)*o;r===0?s.moveTo(l,c):s.lineTo(l,c)}s.closePath()}function NM(s,e,t,n){s.save(),s.translate(e,t),s.scale(n,n);let i=s.createRadialGradient(0,2,4,0,2,31);i.addColorStop(0,"rgba(255,236,120,0.95)"),i.addColorStop(.55,"rgba(255,210,60,0.35)"),i.addColorStop(1,"rgba(255,200,40,0)"),s.fillStyle=i,s.fillRect(-32,-32,64,64),xg(s,0,2,26,11.5),s.fillStyle="#ffe23a",s.fill(),s.lineWidth=2.5,s.strokeStyle="#c47a00",s.stroke(),xg(s,-1,0,16,7),s.fillStyle="rgba(255,255,255,0.35)",s.fill(),s.restore()}function UM(s,e,t,n){s.save(),s.translate(e,t),s.scale(n,n),s.fillStyle="#4d5668",s.strokeStyle="#1f2530",s.lineWidth=2.5,s.beginPath(),s.arc(-13,-12,10,0,qe),s.arc(1,-18,12,0,qe),s.arc(15,-11,10,0,qe),s.fill(),s.beginPath(),s.roundRect(-23,-12,46,12,5),s.fill(),s.beginPath(),s.arc(-13,-12,10,Math.PI*.75,Math.PI*1.75),s.arc(1,-18,12,Math.PI*1.15,Math.PI*1.95),s.arc(15,-11,10,Math.PI*1.3,Math.PI*2.25),s.lineTo(23,-2),s.lineTo(-23,-2),s.closePath(),s.stroke(),s.shadowColor="rgba(255,225,60,0.9)",s.shadowBlur=9,s.beginPath(),s.moveTo(3,-10),s.lineTo(-9,8),s.lineTo(-1,8),s.lineTo(-7,27),s.lineTo(12,2),s.lineTo(3,2),s.lineTo(11,-10),s.closePath(),s.fillStyle="#ffe135",s.fill(),s.shadowBlur=0,s.lineWidth=2,s.strokeStyle="#7a4d00",s.stroke(),s.restore()}function OM(s,e,t,n){s.save(),s.translate(e,t),s.scale(n,n),s.lineWidth=2.2,s.fillStyle="#f39a2b",s.strokeStyle="#4a2a05",Jn(s,-9,25,7,4),s.fill(),s.stroke(),Jn(s,9,25,7,4),s.fill(),s.stroke(),s.fillStyle="#ffd23a",s.strokeStyle="#6a4a00",s.beginPath(),s.rect(17,3,9,4),s.fill(),s.stroke(),Jn(s,27,5,4.5,5.5),s.fill(),s.stroke(),s.strokeStyle="#6f6f78",s.lineWidth=3,s.beginPath(),s.moveTo(0,-13),s.quadraticCurveTo(1,-20,5,-24),s.stroke(),s.fillStyle="#1b1b24",s.strokeStyle="#000000",s.lineWidth=2.2,s.beginPath(),s.arc(0,6,19,0,qe),s.fill(),s.stroke(),s.fillStyle="rgba(255,255,255,0.22)",Jn(s,-7,-4,6,3.5),s.fill(),s.fillStyle="#ffffff",Jn(s,-6,4,3,4.8),s.fill(),Jn(s,6,4,3,4.8),s.fill(),s.fillStyle="#000",Jn(s,-5.5,5.5,1.3,2.2),s.fill(),Jn(s,6.5,5.5,1.3,2.2),s.fill(),s.fillStyle="#ff9a1f",s.beginPath(),s.arc(6,-25,4,0,qe),s.fill(),s.fillStyle="#fff3b0",s.beginPath(),s.arc(6,-25,1.8,0,qe),s.fill(),s.restore()}var Ah=new Map,Ch=new Map,Ih=new Map;function un(s,e){let t=Ah.get(s);return t||(t=e(),Ah.set(s,t)),t}function bf(s,e){let t=Ch.get(s);return t||(t=e(),Ch.set(s,t)),t}function Tg(s,e){let t=Ih.get(s);return t||(t=e(),Ih.set(s,t)),t}function Mg(s,e){let t=document.createElement("canvas");t.width=s,t.height=s;let n=t.getContext("2d");n&&e(n);let i=new _n(t);return i.colorSpace=Nt,i.anisotropy=4,i}function zM(){return Tg("shellHex",()=>Mg(256,s=>{s.fillStyle="#ffffff",s.fillRect(0,0,256,256),s.strokeStyle="rgba(0,0,0,0.42)",s.lineWidth=7,s.lineJoin="round";let e=40,t=Math.sqrt(3)*e;for(let n=-1;n<6;n++)for(let i=-1;i<5;i++){let r=i*e*3+(n%2===0?0:e*1.5),o=n*t/2;s.beginPath();for(let a=0;a<6;a++){let l=a*Math.PI/3,c=r+Math.cos(l)*e,h=o+Math.sin(l)*e;a===0?s.moveTo(c,h):s.lineTo(c,h)}s.closePath(),s.stroke()}}))}function bg(s,e,t){return Tg(s,()=>Mg(256,n=>{n.fillStyle=e,n.fillRect(0,0,256,256),n.fillStyle=t,n.fillRect(0,0,256,26);for(let i=0;i<5;i++){let r=26+i*51.2;n.beginPath(),n.ellipse(r,96,22,26,0,0,qe),n.fill()}}))}function gn(s,e){return bf(s,()=>new He(e))}function GM(s,e,t,n){let i=s.attributes.position,r=new C,o=new C;for(let a=0;a<=t;a++){let l=a/t;e.getPointAt(l,r);let c=Math.abs(2*l-1),h=1-.72*c*c*c*c;for(let u=0;u<=n;u++){let d=a*(n+1)+u;o.fromBufferAttribute(i,d).sub(r).multiplyScalar(h).add(r),i.setXYZ(d,o.x,o.y,o.z)}}i.needsUpdate=!0,s.computeVertexNormals()}function yg(){return new rr(new C(-.46,.2,0),new C(0,-.3,0),new C(.46,.2,0))}function VM(){let s=new Qe,e=16,t=8,n=new xe(un("banana",()=>{let c=yg(),h=new ca(c,e,.115,t,!1);return GM(h,c,e,t),h}),gn("banana",{color:16765498,roughness:.45,metalness:0}));n.castShadow=!0,s.add(n);let i=un("bananaTip",()=>new Vt(.05,.14,6)),r=gn("bananaTip",{color:5913360,roughness:.8}),o=yg(),a=new C,l=new C;for(let c=0;c<2;c++){let h=new xe(i,r);o.getPointAt(c,a),o.getTangentAt(c,l),c===0&&l.negate(),h.position.copy(a).addScaledVector(l,.04),h.quaternion.setFromUnitVectors(new C(0,1,0),l.normalize()),s.add(h)}return s.position.y=.32,s}function vf(s,e,t){let n=new Qe,i=new xe(un("shellDome",()=>new ft(.42,12,6,0,qe,0,Math.PI/2)),gn(`shell_${e}`,{color:s,roughness:.35,metalness:.05,map:zM()}));i.castShadow=!0,n.add(i);let r=new xe(un("shellRim",()=>new hn(.4,.065,6,16)),gn("shellRim",{color:16446432,roughness:.5}));r.rotation.x=Math.PI/2,n.add(r);let o=new xe(un("shellBody",()=>new We(.36,.3,.16,12,1,!1)),gn("shellBody",{color:15852216,roughness:.6}));if(o.position.y=-.1,n.add(o),t){let a=un("shellSpike",()=>new Vt(.07,.18,5)),l=gn("shellSpike",{color:16777215,roughness:.3});for(let d=0;d<6;d++){let f=d/6*qe,g=new xe(a,l),v=new C(Math.cos(f)*.72,.7,Math.sin(f)*.72).normalize();g.position.copy(v).multiplyScalar(.44),g.quaternion.setFromUnitVectors(new C(0,1,0),v),n.add(g)}let c=new xe(a,l);c.position.y=.46,n.add(c);let h=un("shellFin",()=>{let d=new xi;return d.moveTo(0,0),d.lineTo(.55,.12),d.lineTo(.62,.34),d.lineTo(.05,.2),d.closePath(),new Jr(d)}),u=gn("shellFin",{color:16777215,roughness:.4,side:bt});for(let d=-1;d<=1;d+=2){let f=new xe(h,u);f.position.set(d*.34,.05,.12),f.rotation.y=d>0?0:Math.PI,f.rotation.z=d*-.15,n.add(f)}}return n.position.y=.2,n}function _g(s){let e=new Qe,t=s?bg("capGold","#f2b31a","#fff2b8"):bg("capRed","#e5261c","#ffffff"),n=new xe(un("mushCap",()=>new ft(.4,14,8,0,qe,0,Math.PI*.56)),s?gn("mushCapGold",{map:t,roughness:.28,metalness:.75,emissive:3810304,emissiveIntensity:.6}):gn("mushCapRed",{map:t,roughness:.4,metalness:0}));n.castShadow=!0,e.add(n);let i=new xe(un("mushUnder",()=>new Bi(.4*Math.sin(Math.PI*.56),14)),gn("mushUnder",{color:16245693,roughness:.8,side:bt}));i.rotation.x=Math.PI/2,i.position.y=.4*Math.cos(Math.PI*.56),e.add(i);let r=new xe(un("mushStem",()=>new We(.2,.24,.36,10,1)),gn("mushStem",{color:s?16773312:16774880,roughness:.7}));r.position.y=-.2,e.add(r);let o=un("mushEye",()=>new ft(.035,6,4)),a=gn("mushEye",{color:1381656,roughness:.5});for(let l=-1;l<=1;l+=2){let c=new xe(o,a);c.position.set(l*.08,-.16,-.21),c.scale.set(1,1.6,1),e.add(c)}return e.position.y=.42,e}function WM(){let s=new Qe,e=new xe(un("star",()=>{let t=new xi;for(let i=0;i<10;i++){let r=i%2===0?.46:.2,o=Math.PI/2+i*Math.PI/5,a=Math.cos(o)*r,l=Math.sin(o)*r;i===0?t.moveTo(a,l):t.lineTo(a,l)}t.closePath();let n=new ar(t,{depth:.14,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:1,curveSegments:1});return n.translate(0,0,-.07),n}),gn("star",{color:16769354,emissive:16757504,emissiveIntensity:.9,roughness:.3,metalness:.2}));return e.castShadow=!0,s.add(e),s.position.y=.5,s}function qM(){let s=new Qe,e=new xe(un("bombBody",()=>new ft(.36,12,8)),gn("bombBody",{color:1381660,roughness:.35,metalness:.3}));e.name="bombBody",e.castShadow=!0,s.add(e);let t=un("bombFoot",()=>new We(.08,.09,.07,8)),n=gn("bombFoot",{color:15964715,roughness:.6});for(let u=-1;u<=1;u+=2){let d=new xe(t,n);d.position.set(u*.16,-.36,.03),s.add(d)}let i=gn("bombKey",{color:16765498,roughness:.3,metalness:.6}),r=new xe(un("bombKeyShaft",()=>new We(.03,.03,.16,6)),i);r.rotation.z=Math.PI/2,r.position.set(.42,.02,0),s.add(r);let o=new xe(un("bombKeyRing",()=>new hn(.09,.022,4,8)),i);o.rotation.y=Math.PI/2,o.position.set(.53,.02,0),s.add(o);let a=new xe(un("bombFuse",()=>new We(.025,.025,.16,5)),gn("bombFuse",{color:7829376,roughness:.9}));a.position.set(.03,.42,0),a.rotation.z=-.25,s.add(a);let l=new xe(un("bombTip",()=>new ft(.05,6,4)),gn("bombTip",{color:16756768,emissive:16742912,emissiveIntensity:2.5,roughness:.5}));l.name="bombTip",l.position.set(.05,.51,0),s.add(l);let c=un("bombEye",()=>new ft(.05,6,4)),h=gn("bombEye",{color:16777215,roughness:.4});for(let u=-1;u<=1;u+=2){let d=new xe(c,h);d.position.set(u*.11,.02,-.33),d.scale.set(1,1.5,.6),s.add(d)}return s.position.y=.43,s}function XM(){let s=new Qe,e=un("bolt",()=>{let i=new xi;return i.moveTo(.08,.5),i.lineTo(-.22,.02),i.lineTo(-.02,.02),i.lineTo(-.18,-.5),i.lineTo(.3,.12),i.lineTo(.08,.12),i.lineTo(.28,.5),i.closePath(),new Jr(i)}),t=new xe(e,bf("bolt",()=>new Kt({color:16769333,side:bt,toneMapped:!1})));s.add(t);let n=new xe(e,bf("boltGlow",()=>new Kt({color:16761856,side:bt,transparent:!0,opacity:.45,blending:An,depthWrite:!1,toneMapped:!1})));return n.scale.setScalar(1.35),n.position.z=-.01,s.add(n),s.position.y=.55,s}function yf(s){switch(s){case"banana":case"triple_banana":return VM();case"green_shell":case"triple_green_shell":return vf(3134026,"green",!1);case"red_shell":case"triple_red_shell":return vf(16726832,"red",!1);case"blue_shell":return vf(3111935,"blue",!0);case"mushroom":case"triple_mushroom":return _g(!1);case"golden_mushroom":return _g(!0);case"star":return WM();case"lightning":return XM();case"bob_omb":return qM();default:return new Qe}}function _f(s){switch(s){case"triple_banana":return"banana";case"triple_green_shell":return"green_shell";case"triple_red_shell":return"red_shell";case"triple_mushroom":return"mushroom";default:return s}}function Sg(){for(let s of Ah.values())s.dispose();Ah.clear();for(let s of Ch.values())s.dispose();Ch.clear();for(let s of Ih.values())s.dispose();Ih.clear(),xf.clear()}var YM=40,KM=.35,Ef=.95,wg=1.05,Rg=Oi+.9,ZM=.4,kh=10,$M=20,JM=.25,jM=34,Ag=30,Cg=45,Ig=.35,QM=9,eS=8,tS=40,Tf=2.5,Mf=4,Pg=1.5,nS=.55,iS=2.4,kg=[{banana:35,green_shell:35,triple_banana:10,bob_omb:5,red_shell:15},{banana:22,green_shell:26,red_shell:22,triple_green_shell:12,mushroom:10,bob_omb:8},{banana:16,green_shell:22,red_shell:26,triple_green_shell:14,mushroom:14,bob_omb:8},{red_shell:26,triple_red_shell:14,mushroom:26,triple_mushroom:14,bob_omb:12,star:8},{red_shell:22,triple_red_shell:16,mushroom:22,triple_mushroom:18,bob_omb:12,star:10},{triple_mushroom:28,star:20,red_shell:15,lightning:10,golden_mushroom:22,triple_red_shell:5},{star:22,lightning:13,golden_mushroom:24,blue_shell:12,triple_mushroom:19,triple_red_shell:10},{star:22,lightning:17,golden_mushroom:22,blue_shell:16,triple_mushroom:15,triple_red_shell:8}],Dg=(()=>{let e=Vd*.95*.17999999999999994/(Math.pow(1.18,kh)-1),t=[];for(let n=0;n<kh;n++)t.push(e*Math.pow(1.18,n));return t})(),_t=new C,Nn=new C,Ph=new C,Wn=new C,Lg=new C,sS=new C(0,1,0),fo=new wt,po=new Ft,mo=new xt,go=new C;function Hg(){return{t:0,surface:"road",groundY:0,groundNormal:new C(0,1,0),lateral:0,halfWidth:6,wallHalfWidth:7,tangent:new C(0,0,-1),binormal:new C(1,0,0),center:new C}}function Bg(){return{position:new C,tangent:new C(0,0,-1),normal:new C(0,1,0),binormal:new C(1,0,0),halfWidth:6,wallHalfWidth:7,t:0}}var vo=Hg(),Fg=Hg(),rS=Bg(),oS=Bg(),aS=`
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
void main() {
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
    model = modelMatrix * instanceMatrix;
  #endif
  vec4 worldPos = model * vec4(position, 1.0);
  vNormal = normalize(mat3(model) * normal);
  vWorldPos = worldPos.xyz;
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,lS=`
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);
  float ndv = abs(dot(n, v));
  float fres = pow(1.0 - ndv, 2.2);
  float hue = fract(ndv * 0.9 + uTime * 0.15 + (vWorldPos.x + vWorldPos.z) * 0.35 + vWorldPos.y * 0.5 + n.y * 0.2);
  vec3 col = hsv2rgb(vec3(hue, 1.0, 1.0));
  col = mix(col, vec3(1.0), fres * 0.35);
  float alpha = 0.6 + fres * 0.35;
  gl_FragColor = vec4(col * 1.15, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,cS=1,Dh=class{constructor(e){E(this,"object",new Qe);E(this,"debugCounts",{pickup:0,use:0,hit:0,destroyed:0,rowPassEmpty:0,explosion:0});E(this,"particles");E(this,"track",null);E(this,"karts",[]);E(this,"records",[]);E(this,"time",0);E(this,"lastLightningTime",-1e3);E(this,"hazards",[]);E(this,"hazardOut",[]);E(this,"boxes",[]);E(this,"boxOut",[]);E(this,"rowTs",[]);E(this,"boxMesh",null);E(this,"innerMesh",null);E(this,"ringMesh",null);E(this,"boxMaterial",null);E(this,"innerMaterial",null);E(this,"ringMaterial",null);E(this,"boxGeometry",null);E(this,"innerGeometry",null);E(this,"ringGeometry",null);E(this,"questionTexture",null);this.particles=e,this.object.name="ItemManager"}init(e,t){this.clearAll(),this.track=e,this.karts=t,this.records=t.map(n=>({kart:n,rouletteActive:!1,rouletteTimer:0,tickTimer:0,ticks:0,lastUseTime:-10,orbitType:"none",orbitMeshes:[],orbitAngle:Math.random()*qe,orbitHitCooldown:0,prevT:n.state.trackT})),this.rowTs=e.def.itemBoxRows.slice(),this.resetDebugCounts(),this.buildBoxes(e)}resetDebugCounts(){let e=this.debugCounts;e.pickup=e.use=e.hit=e.destroyed=e.rowPassEmpty=e.explosion=0}reset(){this.clearAll();for(let e of this.boxes)e.active=!0,e.respawnTimer=0,e.scale=1;for(let e of this.records){e.rouletteActive=!1,e.rouletteTimer=0,e.lastUseTime=-10;let t=e.kart.state;t.item="none",t.itemCount=0,t.itemRouletteActive=!1,e.prevT=t.trackT}this.lastLightningTime=-1e3,this.time=0,this.resetDebugCounts()}dispose(){this.clearAll(),this.disposeBoxes(),this.records=[],this.karts=[],this.track=null,Sg()}clearAll(){for(let e=this.hazards.length-1;e>=0;e--)this.removeHazard(e);for(let e of this.records)this.clearOrbit(e),e.rouletteActive=!1}buildBoxes(e){this.disposeBoxes(),this.boxes.length=0;let t=e.itemBoxPositions;if(t.length===0)return;for(let i=0;i<t.length;i++){let r=t[i],o=e.query(r,void 0,vo);this.boxes.push({base:r.clone(),groundY:o.groundY,world:new C(r.x,o.groundY+wg,r.z),active:!0,respawnTimer:0,scale:1,phase:i*.73%qe})}let n=this.boxes.length;this.boxGeometry=new be(Ef,Ef,Ef),this.boxMaterial=new Ct({vertexShader:aS,fragmentShader:lS,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:gi}),this.boxMesh=new jt(this.boxGeometry,this.boxMaterial,n),this.boxMesh.frustumCulled=!1,this.boxMesh.renderOrder=3,this.boxMesh.name="itemBoxes",this.object.add(this.boxMesh),this.questionTexture=this.makeQuestionTexture(),this.innerGeometry=new be(.46,.46,.46),this.innerMaterial=new Kt({map:this.questionTexture,transparent:!0,depthWrite:!1,toneMapped:!1}),this.innerMesh=new jt(this.innerGeometry,this.innerMaterial,n),this.innerMesh.frustumCulled=!1,this.innerMesh.renderOrder=2,this.innerMesh.name="itemBoxQuestion",this.object.add(this.innerMesh),this.ringGeometry=new la(.55,1,24),this.ringMaterial=new Kt({color:10477823,transparent:!0,opacity:.4,blending:An,depthWrite:!1,side:bt}),this.ringMesh=new jt(this.ringGeometry,this.ringMaterial,n),this.ringMesh.frustumCulled=!1,this.ringMesh.renderOrder=1,this.ringMesh.name="itemBoxRings",this.object.add(this.ringMesh),this.updateBoxMatrices()}makeQuestionTexture(){let e=document.createElement("canvas");e.width=128,e.height=128;let t=e.getContext("2d");t&&(t.clearRect(0,0,128,128),t.font='bold 100px "Arial Black", Impact, Arial, sans-serif',t.textAlign="center",t.textBaseline="middle",t.lineWidth=12,t.lineJoin="round",t.strokeStyle="#8a4b00",t.strokeText("?",64,70),t.fillStyle="#fff4b8",t.fillText("?",64,70));let n=new _n(e);return n.colorSpace=Nt,n}disposeBoxes(){this.boxMesh&&this.object.remove(this.boxMesh),this.innerMesh&&this.object.remove(this.innerMesh),this.ringMesh&&this.object.remove(this.ringMesh),this.boxMesh?.dispose(),this.innerMesh?.dispose(),this.ringMesh?.dispose(),this.boxGeometry?.dispose(),this.innerGeometry?.dispose(),this.ringGeometry?.dispose(),this.boxMaterial?.dispose(),this.innerMaterial?.dispose(),this.ringMaterial?.dispose(),this.questionTexture?.dispose(),this.boxMesh=this.innerMesh=this.ringMesh=null,this.boxGeometry=this.innerGeometry=this.ringGeometry=null,this.boxMaterial=null,this.innerMaterial=this.ringMaterial=null,this.questionTexture=null}updateBoxes(e){for(let t of this.boxes)t.active?t.scale<1&&(t.scale=Math.min(1,t.scale+e/ZM)):(t.respawnTimer-=e,t.respawnTimer<=0&&(t.active=!0,t.scale=0,$.emit("item:boxRespawn",{position:t.world.clone()}))),t.world.set(t.base.x,t.groundY+wg+Math.sin(this.time*2.1+t.phase)*.12,t.base.z);this.updateBoxMatrices();for(let t of this.records){let n=t.kart.state,i=n.item==="none"&&!n.itemRouletteActive&&!t.rouletteActive,r=En(t.prevT,n.trackT);if(r>0&&r<.05&&i&&!n.finished)for(let o=0;o<this.rowTs.length;o++){let a=En(t.prevT,this.rowTs[o]);a>=0&&a<r&&this.debugCounts.rowPassEmpty++}if(t.prevT=n.trackT,!(!i||n.isSpinning))for(let o of this.boxes){if(!o.active||o.scale<.5)continue;let a=n.position.x-o.world.x,l=n.position.z-o.world.z,c=n.position.y-o.groundY;if(!(a*a+l*l>Rg*Rg||c>2.6||c<-1.5)){o.active=!1,o.respawnTimer=Zm,o.scale=0,this.startRoulette(t),this.debugCounts.pickup++,$.emit("item:pickup",{kartId:n.id,position:o.world.clone(),isPlayer:n.isPlayer}),this.particles?.emit("itemBoxBurst",o.world);break}}}}updateBoxMatrices(){if(!this.boxMesh||!this.innerMesh||!this.ringMesh)return;this.boxMaterial&&(this.boxMaterial.uniforms.uTime.value=this.time);let e=.85+Math.sin(this.time*3)*.15;for(let t=0;t<this.boxes.length;t++){let n=this.boxes[t],i=n.active?hS(n.scale):0;po.set(this.time*.8+n.phase,this.time*1.3+n.phase*2,0),fo.setFromEuler(po),go.setScalar(i),mo.compose(n.world,fo,go),this.boxMesh.setMatrixAt(t,mo),po.set(0,-this.time*1.6+n.phase,0),fo.setFromEuler(po),go.setScalar(i),mo.compose(n.world,fo,go),this.innerMesh.setMatrixAt(t,mo),_t.set(n.base.x,n.groundY+.03,n.base.z),po.set(-Math.PI/2,0,this.time*.5),fo.setFromEuler(po),go.setScalar(n.active?e*(.6+.4*n.scale):e*.5),mo.compose(_t,fo,go),this.ringMesh.setMatrixAt(t,mo)}this.boxMesh.instanceMatrix.needsUpdate=!0,this.innerMesh.instanceMatrix.needsUpdate=!0,this.ringMesh.instanceMatrix.needsUpdate=!0}getActiveBoxPositions(){this.boxOut.length=0;for(let e of this.boxes)e.active&&e.scale>=.5&&this.boxOut.push(e.world);return this.boxOut}startRoulette(e){e.rouletteActive=!0,e.rouletteTimer=Vd,e.ticks=0,e.tickTimer=Dg[0],e.kart.state.itemRouletteActive=!0,e.kart.state.item="none",e.kart.state.itemCount=0}updateRoulette(e,t){if(!e.rouletteActive)return;let n=e.kart.state;if(e.rouletteTimer-=t,e.tickTimer-=t,e.tickTimer<=0&&e.ticks<kh&&($.emit("item:rouletteTick",{kartId:n.id,isPlayer:n.isPlayer}),e.ticks++,e.ticks<kh&&(e.tickTimer+=Dg[e.ticks])),e.rouletteTimer<=0){e.rouletteActive=!1;let i=this.rollItem(n.place);n.item=i,n.itemCount=i.startsWith("triple_")||i==="golden_mushroom"?3:1,n.itemRouletteActive=!1,$.emit("item:rouletteEnd",{kartId:n.id,item:i,isPlayer:n.isPlayer})}}rollItem(e){let t=kg[at(Math.round(e),1,kg.length)-1],n=this.time-this.lastLightningTime>$M,i=0;for(let o in t){let a=o;a==="lightning"&&!n||a==="blue_shell"&&e<=1||(i+=t[a]??0)}if(i<=0)return"banana";let r=Math.random()*i;for(let o in t){let a=o;if(!(a==="lightning"&&!n)&&!(a==="blue_shell"&&e<=1)&&(r-=t[a]??0,r<=0))return a}return"banana"}requestUse(e,t){let n=e.state;if(!this.track||n.item==="none"||n.itemCount<=0||n.itemRouletteActive||n.isSpinning||n.isFrozen)return;let i=this.records.find(c=>c.kart===e);if(i&&i.rouletteActive)return;let r=n.item,o=_f(r);if(r==="golden_mushroom"&&i&&this.time-i.lastUseTime<JM)return;let a=n.speed,l=e.topSpeed();switch(e.forwardDir(Wn),Wn.y=0,Wn.lengthSq()<1e-6&&Wn.set(0,0,-1),Wn.normalize(),o){case"banana":{!t&&a>.5*l?this.spawnLobbed("banana",e,"banana",7.5,Math.max(a,0)+12):this.spawnDropped("banana",e,"banana");break}case"green_shell":this.spawnShell("green_shell",e,t,r);break;case"red_shell":this.spawnShell("red_shell",e,t,r);break;case"blue_shell":this.spawnBlueShell(e);break;case"mushroom":e.applyBoost(.55,1.5,"mushroom"),this.particles?.emit("boostRing",n.position);break;case"golden_mushroom":e.applyBoost(.55,1.5,"golden"),this.particles?.emit("boostRing",n.position,{color:16762161});break;case"star":e.applyStar(8);break;case"lightning":this.useLightning(e);break;case"bob_omb":t?this.spawnDropped("bob_omb",e,"bob_omb"):this.spawnLobbed("bob_omb",e,"bob_omb",8.5,Math.max(a,0)+13);break;default:return}i&&(i.lastUseTime=this.time),n.itemCount=Math.max(0,n.itemCount-1),n.itemCount===0&&(n.item="none"),this.debugCounts.use++,$.emit("item:use",{kartId:n.id,item:r,position:n.position.clone(),isPlayer:n.isPlayer})}useLightning(e){let t=e.state.id;this.lastLightningTime=this.time;for(let n of this.karts){if(n===e)continue;let i=n.state;i.isInvincible||i.finished||(n.applyShrink(6),i.isAirborne||n.applyHit("lightning",t),_t.copy(i.position),_t.y+=2.5,this.particles?.emit("lightningStrike",_t,{direction:Nn.set(0,-1,0)}),this.debugCounts.hit++,$.emit("item:hit",{kartId:i.id,item:"lightning",position:i.position.clone(),sourceKartId:t,isPlayer:i.isPlayer}))}$.emit("item:lightning",{sourceKartId:t})}newHazard(e,t,n){this.hazards.length>=YM&&this.removeHazard(0);let i=yf(e),r=null;if(e==="bob_omb"){let a=i.getObjectByName("bombBody");a&&a.material instanceof He&&(r=a.material.clone(),a.material=r)}let o={id:cS++,type:e,reportType:t,kind:e,position:new C,velocity:new C,radius:e==="banana"?.45:e==="bob_omb"?.5:.45,ownerId:n.state.id,mesh:i,age:0,life:e==="banana"?tS:e==="green_shell"?QM:e==="red_shell"?eS:30,hintT:n.state.trackT,speed:0,bounces:0,maxBounces:0,homing:!1,targetId:-1,airborne:!1,resting:!1,fuse:Tf,blinkPhase:0,wobblePhase:Math.random()*qe,bodyMat:r,flightT:0,trailTimer:0,hidden:!1};return this.hazards.push(o),this.object.add(i),o}spawnDropped(e,t,n){if(!this.track)return;let i=this.newHazard(e,n,t);i.position.copy(t.state.position).addScaledVector(Wn,-1.7);let r=this.track.query(i.position,i.hintT,vo);i.hintT=r.t,i.position.y=r.groundY+.02,i.velocity.set(0,0,0),i.resting=!0,i.mesh.position.copy(i.position),i.mesh.rotation.y=Math.random()*qe}spawnLobbed(e,t,n,i,r){let o=this.newHazard(e,n,t);o.position.copy(t.state.position).addScaledVector(Wn,1.3),o.position.y+=.6,o.velocity.copy(Wn).multiplyScalar(r),o.velocity.y=i,o.airborne=!0,o.mesh.position.copy(o.position)}spawnShell(e,t,n,i){if(!this.track)return;let r=t.state,o=this.newHazard(e,i,t),a=n?-1:1;o.position.copy(r.position).addScaledVector(Wn,a*1.4);let l=this.track.query(o.position,o.hintT,vo);o.hintT=l.t,o.position.y=l.groundY+Ig,e==="green_shell"?(o.speed=jM,o.maxBounces=6,o.homing=!1):n?(o.speed=Ag,o.maxBounces=6,o.homing=!1):(o.speed=Ag,o.maxBounces=0,o.targetId=this.findRedTarget(t),o.homing=o.targetId>=0),o.velocity.copy(Wn).multiplyScalar(a*o.speed),o.mesh.position.copy(o.position)}findRedTarget(e){let t=e.state.trackT,n=-1,i=.35;for(let r of this.karts){if(r===e)continue;let o=r.state;if(o.finished)continue;let a=En(t,o.trackT);a>.002&&a<i&&(i=a,n=o.id)}return n}findLeader(e){let t=null;for(let n of this.karts)n!==e&&(!t||n.state.place<t.state.place)&&(t=n);return t}spawnBlueShell(e){if(!this.track)return;let t=this.findLeader(e),n=this.newHazard("blue_shell","blue_shell",e);n.position.copy(e.state.position).addScaledVector(Wn,1.5),n.position.y+=1,n.flightT=e.state.trackT,n.speed=Cg,n.targetId=t?t.state.id:-1,n.homing=!0,n.life=30,n.velocity.copy(Wn).multiplyScalar(Cg),n.mesh.position.copy(n.position),n.hidden=!0,$.emit("item:blueShellLaunch",{targetKartId:n.targetId})}kartById(e){for(let t of this.karts)if(t.state.id===e)return t;return null}removeHazard(e){let t=this.hazards[e];t&&(this.object.remove(t.mesh),t.bodyMat?.dispose(),this.hazards.splice(e,1))}destroyHazard(e,t,n){let i=this.hazards[e];i&&(t&&this.particles?.emit(t,i.position),n&&(this.debugCounts.destroyed++,$.emit("item:destroyed",{item:i.reportType,position:i.position.clone()})),this.removeHazard(e))}breakPresetFor(e){return e==="banana"?"bananaSplat":"shellBreak"}updateHazards(e){let t=this.track;if(t){for(let n=this.hazards.length-1;n>=0;n--){let i=this.hazards[n];if(i.age+=e,i.age>i.life){this.removeHazard(n);continue}let r=!0;switch(i.kind){case"green_shell":case"red_shell":r=this.moveShell(i,n,e,t);break;case"blue_shell":r=this.moveBlueShell(i,n,e,t);break;case"banana":this.moveGroundItem(i,e,t);break;case"bob_omb":this.moveGroundItem(i,e,t),i.fuse-=e,this.blinkBomb(i,e),i.fuse<=0&&(this.explode(i.position,i.ownerId,"bob_omb","explosion"),this.removeHazard(n),r=!1);break}r&&this.animateHazard(i,e)}this.collideHazardsWithKarts(),this.collideHazardsWithHazards()}}moveShell(e,t,n,i){if(e.homing)this.steerRedShell(e,n,i);else{let a=i.query(e.position,e.hintT,Fg),l=e.velocity.dot(a.tangent);Math.abs(l)>1&&(_t.copy(a.tangent).multiplyScalar(Math.sign(l)),e.velocity.lerp(_t.multiplyScalar(e.speed),Math.min(1,.35*n)))}e.velocity.y=0,e.velocity.lengthSq()>1e-6&&e.velocity.setLength(e.speed),e.position.addScaledVector(e.velocity,n);let r=i.query(e.position,e.hintT,vo);e.hintT=r.t;let o=r.wallHalfWidth-.4;if(Math.abs(r.lateral)>o){if(e.bounces>=e.maxBounces)return this.destroyHazard(t,"shellBreak",!0),!1;let a=e.velocity.dot(r.binormal);e.velocity.addScaledVector(r.binormal,-2*a);let l=Math.abs(r.lateral)-o;e.position.addScaledVector(r.binormal,-Math.sign(r.lateral)*(l+.05)),e.bounces++,$.emit("item:shellBounce",{position:e.position.clone()}),this.particles?.emit("hitSparks",e.position)}return r.surface==="void"&&Math.abs(r.lateral)>r.halfWidth?(this.destroyHazard(t,"shellBreak",!0),!1):(e.position.y=r.groundY+Ig,!0)}steerRedShell(e,t,n){let i=this.kartById(e.targetId);if(!i||i.state.finished){e.homing=!1;return}let r=i.state,o=n.query(e.position,e.hintT,Fg);_t.subVectors(r.position,e.position),_t.y=0;let a=_t.length();if(a<16)_t.addScaledVector(r.velocity,.12),_t.y=0,_t.normalize();else{let y=En(o.t,r.trackT)>=0?1:-1;_t.copy(o.tangent).multiplyScalar(y).addScaledVector(o.binormal,-o.lateral*.18),_t.y=0,_t.normalize()}Nn.copy(e.velocity),Nn.y=0,Nn.lengthSq()<1e-6&&Nn.copy(_t),Nn.normalize();let l=Nn.x*_t.z-Nn.z*_t.x,c=at(Nn.dot(_t),-1,1),h=Math.atan2(l,c),u=(a<16?6.5:3.5)*t,d=at(h,-u,u),f=Math.cos(d),g=Math.sin(d),v=Nn.x*f-Nn.z*g,p=Nn.x*g+Nn.z*f;e.velocity.set(v*e.speed,0,p*e.speed)}moveBlueShell(e,t,n,i){let r=this.kartById(e.targetId);if(!r){let _=this.kartById(e.ownerId);r=_?this.findLeader(_):null,e.targetId=r?r.state.id:-1}if(!r)return this.destroyHazard(t,"shellBreak",!0),!1;let o=r.state,a=Math.max(1,i.length),c=Dt(o.trackT-e.flightT)*a;if(_t.subVectors(o.position,e.position),_t.length()<2.5||c<1.5&&e.age>.5)return e.position.copy(o.position),this.explode(e.position,e.ownerId,"blue_shell","blue_shell"),this.removeHazard(t),!1;e.flightT=Dt(e.flightT+e.speed*n/a);let u=i.sample(e.flightT,rS),d=i.sample(o.trackT,oS);Nn.subVectors(o.position,d.position);let f=at(Nn.dot(d.binormal),-d.halfWidth,d.halfWidth),g=at(1-c/30,0,1),v=rt(0,f,g),p=at(e.age/.6,0,1),m=at(c/14,0,1),y=rt(.9,3.6,p)*rt(.25,1,m)+.3;return Ph.copy(u.position).addScaledVector(u.binormal,v),Ph.y=u.position.y+y,e.velocity.subVectors(Ph,e.position).multiplyScalar(1/Math.max(n,1e-4)),e.position.copy(Ph),e.hintT=e.flightT,e.hidden=y>3,e.trailTimer-=n,e.trailTimer<=0&&(e.trailTimer=.05,this.particles?.emit("starSparkle",e.position,{color:4164863,scale:.8})),!0}moveGroundItem(e,t,n){if(e.resting)return;if(e.airborne){e.velocity.y-=vr*t,e.position.addScaledVector(e.velocity,t);let o=n.query(e.position,e.hintT,vo);e.hintT=o.t;let a=o.groundY+.02;e.position.y<=a&&e.velocity.y<0&&(e.position.y=a,e.kind==="bob_omb"&&e.velocity.y<-4?(e.velocity.y*=-.3,e.velocity.x*=.5,e.velocity.z*=.5):(e.airborne=!1,e.velocity.y=0,e.kind==="banana"?(e.velocity.set(0,0,0),e.resting=!0):e.velocity.multiplyScalar(.4),this.particles?.emit("landPuff",e.position,{scale:.5})));return}let i=Math.exp(-4*t);if(e.velocity.multiplyScalar(i),e.velocity.lengthSq()<.05){e.velocity.set(0,0,0),e.resting=!0;return}e.position.addScaledVector(e.velocity,t);let r=n.query(e.position,e.hintT,vo);e.hintT=r.t,e.position.y=r.groundY+.02}blinkBomb(e,t){if(!e.bodyMat)return;let n=at(1-e.fuse/Tf,0,1);e.blinkPhase+=t*(5+n*22),Math.sin(e.blinkPhase)>.2?(e.bodyMat.color.setHex(13904415),e.bodyMat.emissive.setHex(16722448),e.bodyMat.emissiveIntensity=.5+n):(e.bodyMat.color.setHex(1381660),e.bodyMat.emissive.setHex(0),e.bodyMat.emissiveIntensity=0)}animateHazard(e,t){let n=e.mesh;switch(n.position.copy(e.position),e.kind){case"green_shell":case"red_shell":n.rotation.y+=14*t;break;case"blue_shell":{n.rotation.y+=10*t;break}case"banana":e.airborne?(n.rotation.x+=9*t,n.rotation.y+=4*t):(n.rotation.x=0,n.rotation.z=Math.sin(this.time*3.2+e.wobblePhase)*.12);break;case"bob_omb":e.airborne?n.rotation.x+=6*t:(n.rotation.x=0,n.rotation.z=Math.sin(this.time*18)*.06*at(1-e.fuse/Tf,0,1));break}}collideHazardsWithKarts(){for(let e=this.hazards.length-1;e>=0;e--){let t=this.hazards[e];if(t.kind==="blue_shell")continue;let n=Oi+t.radius;for(let i of this.karts){let r=i.state;if(r.id===t.ownerId&&t.age<KM||r.isSpinning||r.finished)continue;let o=r.position.x-t.position.x,a=r.position.y+.45-t.position.y,l=r.position.z-t.position.z;if(!(o*o+a*a+l*l>n*n)){if(t.kind==="bob_omb"){this.explode(t.position,t.ownerId,"bob_omb","explosion"),this.removeHazard(e);break}if(r.isInvincible){this.destroyHazard(e,this.breakPresetFor(t.kind),!0);break}i.applyHit(t.kind,t.ownerId),t.kind==="banana"?(i.forwardDir(Wn),Lg.crossVectors(Wn,sS).normalize(),_t.copy(Lg).multiplyScalar(Math.random()<.5?-1.8:1.8),_t.y=1.2,i.applyImpulse(_t)):(_t.copy(t.velocity).normalize().multiplyScalar(2.5),_t.y=1.5,i.applyImpulse(_t)),this.debugCounts.hit++,$.emit("item:hit",{kartId:r.id,item:t.reportType,position:r.position.clone(),sourceKartId:t.ownerId,isPlayer:r.isPlayer}),this.destroyHazard(e,this.breakPresetFor(t.kind),!1);break}}}}collideHazardsWithHazards(){for(let e=this.hazards.length-1;e>=0;e--){let t=this.hazards[e];if(!t||t.kind==="blue_shell")continue;let n=t.kind==="green_shell"||t.kind==="red_shell";for(let i=e-1;i>=0;i--){let r=this.hazards[i];if(r.kind==="blue_shell")continue;let o=r.kind==="green_shell"||r.kind==="red_shell";if(!n&&!o||t.airborne||r.airborne)continue;let a=t.radius+r.radius;if(!(t.position.distanceToSquared(r.position)>a*a)){this.resolveHazardPair(e,i);break}}}}resolveHazardPair(e,t){let n=Math.max(e,t),i=Math.min(e,t);this.smashHazard(n,this.hazards[n]),this.smashHazard(i,this.hazards[i])}smashHazard(e,t){t.kind==="bob_omb"?(this.explode(t.position,t.ownerId,"bob_omb","explosion"),this.removeHazard(e)):this.destroyHazard(e,this.breakPresetFor(t.kind),!0)}explode(e,t,n,i){for(let r of this.karts){let o=r.state,a=o.position.distanceTo(e);if(a>Mf+Oi||o.isInvincible)continue;let l=r.applyHit(i,t);_t.subVectors(o.position,e),_t.y=0,_t.lengthSq()<1e-4&&_t.set(Math.random()-.5,0,Math.random()-.5),_t.normalize().multiplyScalar(8*at(1-a/(Mf+Oi),.3,1)),_t.y=6,r.applyImpulse(_t),(l||i==="blue_shell")&&(this.debugCounts.hit++,$.emit("item:hit",{kartId:o.id,item:n,position:o.position.clone(),sourceKartId:t,isPlayer:o.isPlayer}))}this.debugCounts.explosion++,$.emit("item:explosion",{position:e.clone(),radius:Mf}),this.particles?.emit("explosion",e,{scale:1.2})}clearOrbit(e){for(let t of e.orbitMeshes)this.object.remove(t);e.orbitMeshes.length=0,e.orbitType="none"}updateOrbits(e){for(let t of this.records){let n=t.kart.state,r=n.item.startsWith("triple_")&&n.itemCount>0&&!n.itemRouletteActive?_f(n.item):"none",o=r==="none"?0:n.itemCount;if(r!==t.orbitType||o!==t.orbitMeshes.length){this.clearOrbit(t),t.orbitType=r;for(let c=0;c<o;c++){let h=yf(r);t.orbitMeshes.push(h),this.object.add(h)}}t.orbitHitCooldown=Math.max(0,t.orbitHitCooldown-e);let a=t.orbitMeshes.length;if(a===0)continue;t.orbitAngle+=e*iS;let l=n.isShrunk?.6:1;for(let c=0;c<a;c++){let h=t.orbitAngle+c*qe/a,u=t.orbitMeshes[c];u.position.set(n.position.x+Math.cos(h)*Pg*l,n.position.y+nS*l,n.position.z+Math.sin(h)*Pg*l),u.scale.setScalar(l),u.rotation.y=-h+Math.PI/2,t.orbitType==="banana"&&(u.rotation.z=Math.sin(this.time*4+c)*.2)}if(!(t.orbitType==="mushroom"||t.orbitHitCooldown>0))e:for(let c=0;c<a;c++){let h=t.orbitMeshes[c];for(let u of this.karts){if(u===t.kart)continue;let d=u.state;if(d.isSpinning||d.finished)continue;let f=Oi+.45;if(!(h.position.distanceToSquared(d.position)>f*f)){d.isInvincible?(this.particles?.emit(t.orbitType==="banana"?"bananaSplat":"shellBreak",h.position),$.emit("item:destroyed",{item:t.orbitType,position:h.position.clone()})):(u.applyHit(t.orbitType,n.id),_t.subVectors(d.position,n.position),_t.y=0,_t.normalize().multiplyScalar(3),_t.y=1.5,u.applyImpulse(_t),this.particles?.emit(t.orbitType==="banana"?"bananaSplat":"shellBreak",h.position),this.debugCounts.hit++,$.emit("item:hit",{kartId:d.id,item:t.orbitType,position:d.position.clone(),sourceKartId:n.id,isPlayer:d.isPlayer})),n.itemCount=Math.max(0,n.itemCount-1),n.itemCount===0&&(n.item="none"),t.orbitHitCooldown=.5;break e}}}}}update(e){if(this.track){this.time+=e,this.updateBoxes(e);for(let t of this.records)this.updateRoulette(t,e);this.updateOrbits(e),this.updateHazards(e)}}getHazards(){this.hazardOut.length=0;for(let e of this.hazards)e.hidden||this.hazardOut.push(e);return this.hazardOut}};function hS(s){let n=s-1;return 1+2.70158*n*n*n+1.70158*n*n}var uS=2.2,dS=.15,fS=8,Ng=30,Sf=25,pS=2.2,mS=2.6,Ug=60,gS=1.5,Og=.8,vS=2.5,zg={easy:{noise:.09,reactionMin:1,reactionMax:1.5,driftThreshold:.45,releaseStage:1,brakeLatAccel:34,easeThrottle:.6,usesMushrooms:!1,startThrottleBeforeGo:.55},normal:{noise:.045,reactionMin:.6,reactionMax:1,driftThreshold:.35,releaseStage:2,brakeLatAccel:46,easeThrottle:.65,usesMushrooms:!0,startThrottleBeforeGo:.45},hard:{noise:.015,reactionMin:.4,reactionMax:.6,driftThreshold:.3,releaseStage:3,brakeLatAccel:62,easeThrottle:.75,usesMushrooms:!0,startThrottleBeforeGo:.3}},yn=new C,wi=new C,xo=new C,Gg=new C;function Fh(){return{position:new C,tangent:new C(0,0,-1),normal:new C(0,1,0),binormal:new C(1,0,0),halfWidth:6,wallHalfWidth:7,t:0}}var bo=Fh(),yo=Fh(),wf=Fh(),Vs=Fh();function Lh(s,e){let t=s.z*e.x-s.x*e.z,n=s.x*e.x+s.z*e.z;return Math.atan2(-t,n)}var Rf=!1,Vg=!1;function xS(){Vg||(Vg=!0,$.on("race:countdown",({count:s})=>{s===1&&(Rf=!0)}),$.on("race:start",()=>{Rf=!1}))}var Wa=class{constructor(e,t,n){E(this,"kart");E(this,"difficulty");E(this,"profile");E(this,"input",Ei());E(this,"rng");E(this,"baseOffset");E(this,"offsetDriftAmp");E(this,"offsetDriftFreq");E(this,"offsetPhase");E(this,"skillJitter");E(this,"hesitancy");E(this,"aggression");E(this,"bananaHoldLimit");E(this,"startTimingError");E(this,"time",0);E(this,"prevAngle",0);E(this,"hasPrev",!1);E(this,"dodge",0);E(this,"reactTimer",-1);E(this,"pendingMode",0);E(this,"holdTime",0);E(this,"lastItem","none");E(this,"stuckTimer",0);E(this,"recoverTimer",0);E(this,"recoverCooldown",0);E(this,"movedOnce",!1);E(this,"driftWant",!1);E(this,"driftDir",0);E(this,"driftHold",0);E(this,"driftCooldown",0);E(this,"frozenTime",0);E(this,"sinceCountOne",-1);xS(),this.kart=e,this.difficulty=t,this.profile=zg[t],this.rng=Ti(n);let i=this.rng;this.baseOffset=(i()*2-1)*.45,this.offsetDriftAmp=.08+i()*.12,this.offsetDriftFreq=.12+i()*.18,this.offsetPhase=i()*Math.PI*2,this.skillJitter=(i()*2-1)*.02,this.hesitancy=.7+i()*.6,this.aggression=i(),this.bananaHoldLimit=6+i()*4,this.startTimingError=i()}setDifficulty(e){this.difficulty=e,this.profile=zg[e]}update(e,t,n,i,r){let o=this.kart.state,a=this.input,l=this.profile;this.time+=e,a.useItem=!1,a.useItemHeld=!1,a.lookBack=!1,a.pause=!1,a.confirm=!1,a.back=!1,a.menuUp=a.menuDown=a.menuLeft=a.menuRight=!1,this.driftCooldown=Math.max(0,this.driftCooldown-e),this.recoverCooldown=Math.max(0,this.recoverCooldown-e);let c=o.speed,h=Math.max(1,this.kart.topSpeed());if(c>3&&(this.movedOnce=!0),this.kart.forwardDir(yn),yn.y=0,yn.lengthSq()<1e-6&&yn.set(0,0,-1),yn.normalize(),wi.set(-yn.z,0,yn.x),o.isFrozen){this.frozenTime+=e,Rf&&(this.sinceCountOne=this.sinceCountOne<0?0:this.sinceCountOne+e);let W;this.sinceCountOne>=0?(W=1-l.startThrottleBeforeGo,this.difficulty==="easy"&&this.startTimingError<.35&&(W=this.startTimingError<.15?.05:1.3),this.difficulty==="normal"&&(W+=(this.startTimingError-.5)*.3)):W=2.75;let se=this.sinceCountOne>=0?this.sinceCountOne:this.frozenTime;return a.throttle=se>=W?1:0,a.brake=0,a.steer=0,a.drift=!1,this.hasPrev=!1,this.kart.setInput(a),a}if(this.frozenTime=0,this.sinceCountOne=-1,o.isSpinning)return a.throttle=1,a.brake=0,a.steer=0,a.drift=!1,this.driftWant=!1,this.hasPrev=!1,this.kart.setInput(a),a;let u=Math.max(1,t.length),d=o.trackT,f=at(Math.max(c,0)*.9,fS,Ng);t.sample(d,bo),t.sample(Dt(d+f/u),yo),t.sample(Dt(d+2*f/u),wf);let g=Lh(bo.tangent,yo.tangent),v=Lh(yo.tangent,wf.tangent),p=Math.max(2,yo.halfWidth);xo.subVectors(o.position,bo.position);let m=xo.dot(bo.binormal),y=Math.atan2(bo.tangent.dot(wi),bo.tangent.dot(yn));if(this.recoverTimer>0)return this.recoverTimer-=e,a.throttle=0,a.brake=1,a.steer=-Math.sign(y)*.9,a.drift=!1,this.driftWant=!1,this.hasPrev=!1,this.kart.setInput(a),a;let _=this.movedOnce&&!o.isAirborne&&Math.abs(c)<1&&!o.finished;this.stuckTimer=_?this.stuckTimer+e:0,this.recoverCooldown<=0&&(o.wrongWay&&Math.abs(c)<6&&this.movedOnce||this.stuckTimer>gS)&&(this.recoverTimer=Og,this.recoverCooldown=vS+Og,this.stuckTimer=0,this.driftWant=!1);let x=this.baseOffset+Math.sin(this.time*this.offsetDriftFreq+this.offsetPhase)*this.offsetDriftAmp,S=at(g*.9+v*.35,-.4,.4),M=at(x+S,-.6,.6)*p;if(o.item==="none"&&!o.itemRouletteActive){let W=i.getActiveBoxPositions(),se=Ug,ie=!1,_e=0,Me=0,Ee=0;for(let Ge=0;Ge<W.length;Ge++){let Fe=W[Ge],re=Fe.x-o.position.x,he=Fe.z-o.position.z,le=re*yn.x+he*yn.z;if(le<2||le>=se)continue;let Se=re*wi.x+he*wi.z;Math.abs(Se)>p*1.6||(se=le,_e=le,Me=Fe.x,Ee=Fe.z,ie=!0)}if(ie){t.sample(Dt(d+_e/u),Vs);let Ge=(Me-Vs.position.x)*Vs.binormal.x+(Ee-Vs.position.z)*Vs.binormal.z,Fe=at(1.15-_e/Ug,.35,1);M=M+(at(Ge,-p+.8,p-.8)-M)*Fe}}let w=0,b=Sf,R=!1,P=i.getHazards();for(let W=0;W<P.length;W++){let se=P[W],ie=se.position.x-o.position.x,_e=se.position.z-o.position.z,Me=ie*yn.x+_e*yn.z,Ee=ie*wi.x+_e*wi.z,Ge=se.velocity.x*yn.x+se.velocity.z*yn.z;if(Me>0&&Me<Sf){if(se.ownerId===o.id&&Ge>5)continue;let Fe=Ee;if(Ge<-3&&(Fe+=(se.velocity.x*wi.x+se.velocity.z*wi.z)*(Me/Math.max(1,c-Ge))),Math.abs(Fe)<pS&&Me<b){b=Me;let re=m+Fe,he=p-re,le=p+re,Se=he>le?1:-1,we=.55+.45*(1-Me/Sf);w=(Se*mS-Fe)*we}}else Me<0&&Me>-12&&Ge>4&&Math.abs(Ee)<2.2&&(R=!0)}this.dodge=pt(this.dodge,w,9,e),M+=this.dodge,o.surface==="offroad"&&(M=0),M=at(M,-(p-1.4),p-1.4);let k=at(M+at((M-m)*1,-3.5,3.5),-(p-.5),p-.5);Gg.copy(yo.position).addScaledVector(yo.binormal,k),xo.subVectors(Gg,o.position),xo.y=0;let L=Math.atan2(xo.dot(wi),xo.dot(yn)),H=this.hasPrev?(L-this.prevAngle)/Math.max(e,1e-4):0;H=at(H,-6,6),this.prevAngle=L,this.hasPrev=!0;let B=uS*L+dS*H;B+=l.noise*Math.sin(this.time*1.9+this.offsetPhase)*Math.sin(this.time*.73+this.offsetPhase*2),o.surface==="offroad"&&(B*=1.3),B=at(B,-1,1);let F=1,O=Math.abs(g)/f;c*c*O>l.brakeLatAccel&&c>.6*h&&!o.isBoosting&&(F=l.easeThrottle),o.wrongWay&&(F=.5);let J=0;r&&r!==this.kart&&(J=(r.state.raceProgress-o.raceProgress)*u);let ue=this.speedFactor(J)*(1+this.skillJitter)*h;!o.isBoosting&&c>ue&&(F=Math.min(F,at(1-(c-ue)/(.05*h),0,1)));let fe=at(Math.max(c,0)*1.2,6,Ng);t.sample(Dt(d+fe/u),Vs);let me=Lh(yn,Vs.tangent),Ke=me+Lh(Vs.tangent,wf.tangent),Le=o.surface!=="offroad"&&o.surface!=="void",ye=!1;if(!this.driftWant&&this.driftCooldown<=0&&Le&&!o.isAirborne&&!o.isHopping&&c>.55*h&&Math.abs(me)>l.driftThreshold&&Math.abs(Ke)>l.driftThreshold*1.4&&Math.sign(Ke)===Math.sign(me)&&(this.difficulty!=="easy"||this.aggression>.4)&&(this.driftWant=!0,this.driftDir=me>0?1:-1,this.driftHold=0),this.driftWant){this.driftHold+=e,ye=!0,o.isDrifting&&o.driftDirection!==0&&(this.driftDir=o.driftDirection),o.isDrifting?(Math.sign(B)!==this.driftDir||Math.abs(B)<.25)&&(B=this.driftDir*.25):this.driftHold<.3&&(B=this.driftDir*Math.max(.5,Math.abs(B)));let W=o.driftStage,se=l.releaseStage;this.difficulty==="hard"&&Math.abs(Ke)<.5&&(se=2);let ie=Math.sign(L)===-this.driftDir&&Math.abs(L)>.12,_e=Math.abs(L)<.08&&Math.abs(me)<.15,Me=this.driftDir*m>p-1.6,Ee=!1;(o.isDrifting&&W>=se||o.isDrifting&&this.driftHold>.25&&(ie||_e||Me)||!o.isDrifting&&this.driftHold>.6||!Le||c<.35*h||this.driftHold>3.2)&&(Ee=!0),Ee&&(this.driftWant=!1,ye=!1,this.driftCooldown=W>=1?.6:1.6)}if(o.item!==this.lastItem&&(this.lastItem=o.item,this.holdTime=0,this.reactTimer=-1,this.pendingMode=0),o.item!=="none"&&!o.itemRouletteActive&&o.itemCount>0){this.holdTime+=e;let W=this.decideItemUse(o.item,n,J,g,v,R,h);if(W!==0)if(this.reactTimer<0||this.pendingMode!==W){this.pendingMode=W;let se=R&&W===2,ie=l.reactionMin+this.rng()*(l.reactionMax-l.reactionMin);this.reactTimer=se?ie*.35:ie*this.hesitancy,(o.item==="star"||o.item==="golden_mushroom"||o.item==="triple_mushroom"||o.item==="mushroom")&&(this.reactTimer*=.5)}else this.reactTimer-=e,this.reactTimer<=0&&(a.useItem=!0,a.lookBack=W===2,this.reactTimer=-1,this.pendingMode=0,this.holdTime=0);else this.reactTimer=-1,this.pendingMode=0}return o.isAirborne&&!o.isHopping&&(B=0),a.throttle=at(F,0,1),a.brake=0,a.steer=B,a.drift=ye,this.kart.setInput(a),a}speedFactor(e){switch(this.difficulty){case"easy":return at(.86+.06*Math.tanh(e/120),.82,.96);case"normal":return at(.94+.05*Math.tanh(e/100),.9,1);default:return at(.985+.02*Math.tanh(e/150),.97,1)}}decideItemUse(e,t,n,i,r,o,a){let l=this.kart.state,c=l.speed,h=Math.abs(i)<.12&&Math.abs(r)<.2,u=1/0,d=!1,f=1/0,g=!1,v=1/0,p=!1;for(let m=0;m<t.length;m++){let y=t[m];if(y===this.kart)continue;let _=y.state;if(_.finished)continue;let x=_.position.x-l.position.x,S=_.position.z-l.position.z,M=x*yn.x+S*yn.z,w=x*wi.x+S*wi.z,b=Math.sqrt(x*x+S*S);if(b<v&&(v=b),M>0){M<u&&(u=M,d=Math.abs(w)<1.5+M*.12);let R=En(l.trackT,_.trackT);R>0&&R<.3&&(p=!0)}else-M<f&&(f=-M,g=Math.abs(w)<4)}switch(e){case"banana":case"triple_banana":return o||f<15&&g||this.holdTime>this.bananaHoldLimit?2:this.difficulty==="hard"&&u>6&&u<20&&d&&c>.5*a&&this.aggression>.5?1:0;case"green_shell":case"triple_green_shell":return o?2:u<45&&d&&Math.abs(i)<.25?1:this.difficulty!=="easy"&&f<10&&g&&this.aggression>.6?2:this.holdTime>15?1:0;case"red_shell":case"triple_red_shell":return o?2:p&&u<90||this.holdTime>12?1:0;case"blue_shell":return l.place!==1&&this.holdTime>2?1:0;case"mushroom":case"triple_mushroom":case"golden_mushroom":return l.isBoosting?0:l.surface==="offroad"?1:this.profile.usesMushrooms?h&&c>.5*a||n>80||this.holdTime>8?1:0:this.holdTime>12?1:0;case"star":return v<20||this.holdTime>3?1:0;case"lightning":return l.place>=5&&this.holdTime>.8+this.hesitancy?1:0;case"bob_omb":return o?2:u>10&&u<30&&d?1:this.holdTime>14?f<12?2:1:0;default:return 0}}};function Af(s){return Math.pow(10,s/20)}function os(s){return 440*Math.pow(2,(s-69)/12)}var Wg=new WeakMap;function Xi(s,e="white",t=2){let n=Wg.get(s);n||(n=new Map,Wg.set(s,n));let i=n.get(e);if(i)return i;let r=Math.max(1,Math.floor(s.sampleRate*t)),o=s.createBuffer(1,r,s.sampleRate),a=o.getChannelData(0);if(e==="white")for(let l=0;l<r;l++)a[l]=Math.random()*2-1;else if(e==="pink"){let l=0,c=0,h=0,u=0,d=0,f=0,g=0;for(let v=0;v<r;v++){let p=Math.random()*2-1;l=.99886*l+p*.0555179,c=.99332*c+p*.0750759,h=.969*h+p*.153852,u=.8665*u+p*.3104856,d=.55*d+p*.5329522,f=-.7616*f-p*.016898,a[v]=(l+c+h+u+d+f+g+p*.5362)*.11,g=p*.115926}}else{let l=0;for(let c=0;c<r;c++){let h=Math.random()*2-1;l=(l+.02*h)/1.02,a[c]=l*3.5}}return n.set(e,o),o}function Ws(s,e,t,n,i={}){let r=Math.max(.001,i.attack??.005),o=Math.max(.001,i.decay??.05),a=Math.min(1,Math.max(0,i.sustain??.6)),l=Math.max(.005,i.release??.05),c=Math.max(1e-4,t),h=Math.max(1e-4,c*a);s.cancelScheduledValues(e),s.setValueAtTime(1e-4,e),s.linearRampToValueAtTime(c,e+r),s.exponentialRampToValueAtTime(h,e+r+o);let u=Math.max(e+r+o,e+n);return s.setValueAtTime(h,u),s.exponentialRampToValueAtTime(1e-4,u+l),u+l}function Cf(s,e,t,n,i,r=!0){r?(s.setValueAtTime(Math.max(1e-4,e),n),s.exponentialRampToValueAtTime(Math.max(1e-4,t),n+Math.max(.001,i))):(s.setValueAtTime(e,n),s.linearRampToValueAtTime(t,n+Math.max(.001,i)))}function ui(s,e,t,n){s.setTargetAtTime(e,t,n)}function Hh(s=2,e=1024){let t=new Float32Array(new ArrayBuffer(e*4)),n=Math.tanh(s);for(let i=0;i<e;i++){let r=i/(e-1)*2-1;t[i]=Math.tanh(r*s)/n}return t}function qg(s,e,t,n,i){let r=s.createBiquadFilter();return r.type=t.type,r.Q.value=t.q??1,t.endFreq!==void 0?Cf(r.frequency,t.freq,t.endFreq,n,t.sweepTime??i):r.frequency.value=t.freq,e.connect(r),r}function Xg(s,e,t,n){if(n!==void 0&&n!==0&&typeof s.createStereoPanner=="function"){let i=s.createStereoPanner();return i.pan.value=Math.max(-1,Math.min(1,n)),e.connect(i),i.connect(t),i}return e.connect(t),e}function tt(s,e,t){let n=t.when??s.currentTime,i=s.createOscillator();i.type=t.type??"sine",t.detune&&(i.detune.value=t.detune),i.frequency.setValueAtTime(Math.max(1e-4,t.freq),n),t.endFreq!==void 0&&i.frequency.exponentialRampToValueAtTime(Math.max(1e-4,t.endFreq),n+Math.max(.001,t.sweepTime??t.duration));let r=s.createGain(),o=Ws(r.gain,n,t.gain??.2,t.duration,t.env),a=i;t.filter&&(a=qg(s,a,t.filter,n,t.duration)),a.connect(r),Xg(s,r,e,t.pan);let l=null;if(t.vibrato&&t.vibrato.depth>0){l=s.createOscillator(),l.type="sine",l.frequency.value=t.vibrato.rate;let c=s.createGain();c.gain.value=t.vibrato.depth,l.connect(c),c.connect(i.detune),l.start(n),l.stop(o+.02)}return i.start(n),i.stop(o+.02),i.onended=()=>{i.disconnect(),r.disconnect(),l&&l.disconnect()},o}function Pt(s,e,t){let n=t.when??s.currentTime,i=s.createBufferSource(),r=Xi(s,t.color??"white");i.buffer=r,i.loop=!0,i.loopStart=0,i.loopEnd=r.duration,t.rate!==void 0&&(i.playbackRate.value=t.rate);let o=s.createGain(),a=Ws(o.gain,n,t.gain??.2,t.duration,t.env??{attack:.002,decay:t.duration*.6,sustain:.3,release:.05}),l=i;return t.filter&&(l=qg(s,l,t.filter,n,t.duration)),l.connect(o),Xg(s,o,e,t.pan),i.start(n,Math.random()*Math.max(0,r.duration-.5)),i.stop(a+.02),i.onended=()=>{i.disconnect(),o.disconnect()},a}function qs(s,e,t,n={}){let i=n.when??s.currentTime,r=n.gap??0,o=n.baseMidi??0,a=i;for(let[l,c]of t)a=tt(s,e,{freq:os(o+l),type:n.type??"square",duration:c,gain:n.gain??.15,env:n.env??{attack:.005,decay:.05,sustain:.7,release:.06},when:i,filter:n.filter,vibrato:n.vibrato}),i+=c+r;return a}function _o(s,e,t,n){let i=n.when??s.currentTime,r=i;for(let o of t)r=Math.max(r,tt(s,e,{freq:os(o),type:n.type??"sawtooth",duration:n.duration,gain:n.gain??.08,env:n.env,when:i,detune:n.detune?(Math.random()*2-1)*n.detune:0,filter:n.filter}));return r}var Yg={light:96,medium:78,heavy:62},If=.15,Pf=null,Bh=class{constructor(e,t,n,i,r){E(this,"kartId");E(this,"isPlayer");E(this,"ctx");E(this,"baseFreq");E(this,"out");E(this,"panner");E(this,"filter");E(this,"shaper");E(this,"engineGain");E(this,"saw");E(this,"sawGain");E(this,"square",null);E(this,"squareGain",null);E(this,"sub",null);E(this,"subGain",null);E(this,"turboOsc");E(this,"turboNoise");E(this,"turboFilter");E(this,"turboGain");E(this,"skidSrc");E(this,"skidFilter");E(this,"skidGain");E(this,"rpm",If);E(this,"rich",!1);E(this,"disposed",!1);E(this,"turboLevel",-1);E(this,"skidLevel",-1);if(this.ctx=e,this.kartId=n,this.isPlayer=r,this.baseFreq=Yg[i]??Yg.medium,this.out=e.createGain(),this.out.gain.value=r?1:.85,r)this.panner=null,this.out.connect(t);else{let l=e.createPanner();l.panningModel="equalpower",l.distanceModel="inverse",l.refDistance=6,l.maxDistance=90,l.rolloffFactor=1,l.coneInnerAngle=360,l.coneOuterAngle=360,this.out.connect(l),l.connect(t),this.panner=l}this.filter=e.createBiquadFilter(),this.filter.type="lowpass",this.filter.Q.value=1.1,this.filter.frequency.value=400,this.shaper=e.createWaveShaper(),Pf||(Pf=Hh(2.2)),this.shaper.curve=Pf,this.shaper.oversample="none",this.engineGain=e.createGain(),this.engineGain.gain.value=0,this.filter.connect(this.shaper),this.shaper.connect(this.engineGain),this.engineGain.connect(this.out),this.saw=e.createOscillator(),this.saw.type="sawtooth",this.saw.frequency.value=this.baseFreq,this.sawGain=e.createGain(),this.sawGain.gain.value=.5,this.saw.connect(this.sawGain),this.sawGain.connect(this.filter),this.saw.start(),this.turboFilter=e.createBiquadFilter(),this.turboFilter.type="bandpass",this.turboFilter.Q.value=2.5,this.turboFilter.frequency.value=1400,this.turboGain=e.createGain(),this.turboGain.gain.value=0,this.turboFilter.connect(this.turboGain),this.turboGain.connect(this.out),this.turboOsc=e.createOscillator(),this.turboOsc.type="triangle",this.turboOsc.frequency.value=1200;let o=e.createGain();o.gain.value=.5,this.turboOsc.connect(o),o.connect(this.turboFilter),this.turboOsc.start(),this.turboNoise=e.createBufferSource(),this.turboNoise.buffer=Xi(e,"white"),this.turboNoise.loop=!0;let a=e.createGain();a.gain.value=.35,this.turboNoise.connect(a),a.connect(this.turboFilter),this.turboNoise.start(0,Math.random()),this.skidSrc=e.createBufferSource(),this.skidSrc.buffer=Xi(e,"pink"),this.skidSrc.loop=!0,this.skidFilter=e.createBiquadFilter(),this.skidFilter.type="bandpass",this.skidFilter.frequency.value=1900,this.skidFilter.Q.value=1.4,this.skidGain=e.createGain(),this.skidGain.gain.value=0,this.skidSrc.connect(this.skidFilter),this.skidFilter.connect(this.skidGain),this.skidGain.connect(this.out),this.skidSrc.start(0,Math.random()),this.setRich(r)}setRich(e){if(this.disposed||e===this.rich)return;this.rich=e;let t=this.ctx;if(e){let n=t.currentTime;this.square=t.createOscillator(),this.square.type="square",this.square.detune.value=9,this.square.frequency.value=this.saw.frequency.value,this.squareGain=t.createGain(),this.squareGain.gain.setValueAtTime(0,n),this.squareGain.gain.linearRampToValueAtTime(.22,n+.2),this.square.connect(this.squareGain),this.squareGain.connect(this.filter),this.square.start(),this.sub=t.createOscillator(),this.sub.type="sine",this.sub.frequency.value=this.saw.frequency.value*.5,this.subGain=t.createGain(),this.subGain.gain.setValueAtTime(0,n),this.subGain.gain.linearRampToValueAtTime(.45,n+.2),this.sub.connect(this.subGain),this.subGain.connect(this.filter),this.sub.start()}else this.stopExtras()}stopExtras(){let e=this.ctx.currentTime,t=this.square,n=this.squareGain,i=this.sub,r=this.subGain;t&&n&&(n.gain.setTargetAtTime(0,e,.05),t.stop(e+.3),t.onended=()=>{t.disconnect(),n.disconnect()}),i&&r&&(r.gain.setTargetAtTime(0,e,.05),i.stop(e+.3),i.onended=()=>{i.disconnect(),r.disconnect()}),this.square=null,this.squareGain=null,this.sub=null,this.subGain=null}update(e,t,n,i){if(this.disposed)return;let r=this.ctx.currentTime,o=Math.abs(t.speed),a=at(o/Math.max(1,i),0,1.4),l=If+.85*a;l+=.2*Ye(n)*(1-Ye(a)),t.isFrozen&&(l=If+.45*Ye(n)),t.isAirborne&&(l=Math.max(l,Math.min(1.35,l+t.airTime*.7))),(t.isSpinning||t.isSquished)&&(l*=.7),t.isBoosting&&(l=Math.max(l,1.05));let c=l>this.rpm?3.2:5;this.rpm=pt(this.rpm,l,c,e);let h=this.rpm,u=t.isShrunk?1.5:1,d=this.baseFreq*(.55+1.9*h)*u;ui(this.saw.frequency,d,r,.03),this.square&&ui(this.square.frequency,d,r,.03),this.sub&&ui(this.sub.frequency,d*.5,r,.03),ui(this.filter.frequency,240+h*1900,r,.05);let f=.55+.45*Ye(n),v=(this.isPlayer?.3:.27)*f*(.7+.3*Math.min(1,h));ui(this.engineGain.gain,v,r,.06);let p=t.isBoosting?.11:0;if(ui(this.turboGain.gain,p,r,.08),t.isBoosting){let y=900+h*700+Ye(t.boostTimer)*400;ui(this.turboOsc.frequency,y,r,.06),ui(this.turboFilter.frequency,y*1.1,r,.06)}let m=t.isDrifting&&!t.isAirborne?.14*Ye(o/14)*(.6+.4*Math.abs(t.steerVisual)):0;if(ui(this.skidGain.gain,m,r,.06),m>0&&(ui(this.skidSrc.playbackRate,.75+.5*Ye(a),r,.08),ui(this.skidFilter.frequency,1500+a*900,r,.08)),this.panner){let y=t.position;bS(this.panner,y.x,y.y,y.z)}}dispose(){if(this.disposed)return;this.disposed=!0;let e=this.ctx.currentTime;this.out.gain.setTargetAtTime(0,e,.03),this.stopExtras();let t=e+.15;try{this.saw.stop(t),this.turboOsc.stop(t),this.turboNoise.stop(t),this.skidSrc.stop(t)}catch{}let n=this.out,i=this.panner;this.saw.onended=()=>{n.disconnect(),i?.disconnect()}}};function bS(s,e,t,n){s.positionX?(s.positionX.value=e,s.positionY.value=t,s.positionZ.value=n):s.setPosition(e,t,n)}function Kg(s,e,t,n,i,r,o,a,l,c){s.positionX?(s.positionX.value=e,s.positionY.value=t,s.positionZ.value=n,s.forwardX.value=i,s.forwardY.value=r,s.forwardZ.value=o,s.upX.value=a,s.upY.value=l,s.upZ.value=c):(s.setPosition(e,t,n),s.setOrientation(i,r,o,a,l,c))}var kf=class{constructor(){E(this,"pos",new C);E(this,"forward",new C(0,0,-1));E(this,"right",new C(1,0,0));E(this,"up",new C(0,1,0))}},yS=1100,Nh=class{constructor(e,t){E(this,"ctx");E(this,"gain");E(this,"murmur");E(this,"hiss");E(this,"lfo");E(this,"cheer",0);E(this,"disposed",!1);this.ctx=e,this.gain=e.createGain(),this.gain.gain.value=0,this.gain.connect(t),this.murmur=e.createBufferSource(),this.murmur.buffer=Xi(e,"pink"),this.murmur.loop=!0;let n=e.createBiquadFilter();n.type="lowpass",n.frequency.value=520,n.Q.value=.6;let i=e.createGain();i.gain.value=.8,this.lfo=e.createOscillator(),this.lfo.type="sine",this.lfo.frequency.value=.31;let r=e.createGain();r.gain.value=.25,this.lfo.connect(r),r.connect(i.gain),this.murmur.connect(n),n.connect(i),i.connect(this.gain),this.hiss=e.createBufferSource(),this.hiss.buffer=Xi(e,"white"),this.hiss.loop=!0;let o=e.createBiquadFilter();o.type="bandpass",o.frequency.value=1100,o.Q.value=.5;let a=e.createGain();a.gain.value=.28,this.hiss.connect(o),o.connect(a),a.connect(this.gain),this.murmur.start(0,Math.random()),this.hiss.start(0,Math.random()*1.5),this.lfo.start()}cheerBurst(e){this.cheer=Math.max(this.cheer,Ye(e))}update(e,t){if(this.disposed)return;let n=0;if(t!==null&&isFinite(t)){let r=t-Math.floor(t),o=Math.min(r,1-r)*yS;n=1-Zt(12,40,o)}this.cheer=Math.max(0,this.cheer-e/2.5);let i=n*.16+this.cheer*.22;this.gain.gain.setTargetAtTime(i,this.ctx.currentTime,.25)}dispose(){if(this.disposed)return;this.disposed=!0;let e=this.ctx.currentTime;this.gain.gain.setTargetAtTime(0,e,.05);try{this.murmur.stop(e+.3),this.hiss.stop(e+.3),this.lfo.stop(e+.3)}catch{}let t=this.gain;this.murmur.onended=()=>t.disconnect()}},Uh=class{constructor(e,t){E(this,"listener",new kf);E(this,"karts",[]);E(this,"playerKartId",0);E(this,"ctx");E(this,"buses");E(this,"unsubs",[]);E(this,"rouletteCount",0);E(this,"lastWrongWay",-10);E(this,"disposed",!1);this.ctx=e,this.buses=t,this.subscribe()}subscribe(){let e=this.unsubs;e.push($.on("kart:hop",t=>this.hop(t.kartId))),e.push($.on("kart:land",t=>this.land(t.kartId,t.impact))),e.push($.on("kart:driftStart",t=>this.driftStart(t.kartId))),e.push($.on("kart:driftStage",t=>this.driftStage(t.kartId,t.stage))),e.push($.on("kart:driftEnd",t=>this.driftEnd(t.kartId,t.boostStage))),e.push($.on("kart:boost",t=>this.boost(t.kartId,t.source,t.strength))),e.push($.on("kart:collision",t=>this.collision(t.kartId,t.otherId,t.impulse,t.position))),e.push($.on("kart:spin",t=>this.spin(t.kartId,t.cause))),e.push($.on("kart:squish",t=>this.squish(t.kartId))),e.push($.on("kart:shrink",t=>this.shrink(t.kartId,!0))),e.push($.on("kart:unshrink",t=>this.shrink(t.kartId,!1))),e.push($.on("item:pickup",t=>this.itemPickup(t.position,t.isPlayer))),e.push($.on("item:rouletteTick",t=>this.rouletteTick(t.isPlayer))),e.push($.on("item:rouletteEnd",t=>this.rouletteEnd(t.isPlayer))),e.push($.on("item:use",t=>this.itemUse(t.item,t.position,t.isPlayer))),e.push($.on("item:hit",t=>this.itemHit(t.item,t.position,t.isPlayer))),e.push($.on("item:destroyed",t=>this.itemDestroyed(t.item,t.position))),e.push($.on("item:shellBounce",t=>this.shellBounce(t.position))),e.push($.on("item:explosion",t=>this.explosion(t.position,t.radius))),e.push($.on("item:lightning",()=>this.lightning())),e.push($.on("item:boxRespawn",t=>this.boxRespawn(t.position))),e.push($.on("item:blueShellLaunch",()=>this.blueShellLaunch())),e.push($.on("race:countdown",t=>this.countdown(t.count))),e.push($.on("race:start",()=>this.raceStart())),e.push($.on("race:lap",t=>this.lap(t.kartId,t.isPlayer,t.isFinalLap))),e.push($.on("race:finish",t=>this.finish(t.kartId,t.place,t.isPlayer))),e.push($.on("race:positionChange",t=>{t.isPlayer&&this.positionChange(t.from,t.to)})),e.push($.on("race:wrongWay",t=>this.wrongWay(t.kartId,t.wrongWay))),e.push($.on("ui:move",()=>this.uiMove())),e.push($.on("ui:select",()=>this.uiSelect())),e.push($.on("ui:back",()=>this.uiBack())),e.push($.on("ui:error",()=>this.uiError()))}dispose(){this.disposed=!0;for(let e of this.unsubs)e();this.unsubs.length=0,this.karts=[]}kartPosition(e){let t=this.karts;if(e>=0&&e<t.length&&t[e].state.id===e)return t[e].state.position;for(let n=0;n<t.length;n++)if(t[n].state.id===e)return t[n].state.position;return null}isPlayer(e){return e===this.playerKartId}spatial(e,t,n,i){if(this.disposed)return null;let r=this.ctx,o=this.buses.sfx;if(!e){if(i===1)return o;let v=r.createGain();return v.gain.value=i,v.connect(o),v}let a=this.listener,l=e.x-a.pos.x,c=e.y-a.pos.y,h=e.z-a.pos.z,u=Math.sqrt(l*l+c*c+h*h);if(u>n)return null;let d=u<=t?1:t/(t+(u-t)),f=u>.01?(l*a.right.x+c*a.right.y+h*a.right.z)/u*.75:0,g=r.createGain();if(g.gain.value=i*d,typeof r.createStereoPanner=="function"){let v=r.createStereoPanner();v.pan.value=Math.max(-1,Math.min(1,f)),g.connect(v),v.connect(o)}else g.connect(o);return g}kartDest(e,t,n,i,r){return this.isPlayer(e)?this.spatial(null,t,n,i):this.spatial(this.kartPosition(e),t,n,r)}get now(){return this.ctx.currentTime}hop(e){let t=this.kartDest(e,8,40,1,.6);t&&tt(this.ctx,t,{freq:520,endFreq:780,type:"sine",duration:.06,gain:.22,env:{attack:.005,decay:.03,sustain:.5,release:.05}})}land(e,t){let n=this.kartDest(e,8,45,1,.6);if(!n)return;let i=Ye(t),r=this.ctx;Pt(r,n,{duration:.1,gain:.1+.25*i,color:"pink",filter:{type:"lowpass",freq:520},env:{attack:.002,decay:.08,sustain:.2,release:.05}}),tt(r,n,{freq:110,endFreq:55,type:"sine",duration:.12,gain:.15+.22*i,env:{attack:.002,decay:.1,sustain:.2,release:.05}})}driftStart(e){let t=this.kartDest(e,8,40,1,.5);t&&Pt(this.ctx,t,{duration:.12,gain:.16,rate:.9,filter:{type:"bandpass",freq:1600,q:1.2},env:{attack:.005,decay:.1,sustain:.3,release:.08}})}driftStage(e,t){let n=this.kartDest(e,8,35,1,.45);if(!n)return;let i=this.ctx,o=[0,880,1175,1568][t],a=this.now;tt(i,n,{freq:o,type:"triangle",duration:.07,gain:.18,when:a,env:{attack:.003,decay:.05,sustain:.4,release:.06}});for(let l=0;l<=t;l++)tt(i,n,{freq:o*(2+l*.5),type:"sine",duration:.04,gain:.06,when:a+.03+l*.03,env:{attack:.002,decay:.03,sustain:.2,release:.04}})}driftEnd(e,t){if(t===0)return;let n=this.kartDest(e,8,45,1,.55);if(!n)return;let i=this.ctx;Pt(i,n,{duration:.3+.08*t,gain:.22+.04*t,filter:{type:"bandpass",freq:400,endFreq:3e3,q:1},env:{attack:.01,decay:.2,sustain:.4,release:.15}}),tt(i,n,{freq:200,endFreq:500+150*t,type:"sawtooth",duration:.25,gain:.1,filter:{type:"lowpass",freq:1500},env:{attack:.02,decay:.1,sustain:.5,release:.1}})}boost(e,t,n){let i=this.kartDest(e,10,50,1,.6);if(!i)return;let r=this.ctx,o=this.now,a=.7+Ye(n)*.6;if(t==="mushroom"||t==="golden"){tt(r,i,{freq:180,endFreq:720,sweepTime:.09,type:"sine",duration:.1,gain:.22*a,when:o,env:{attack:.005,decay:.05,sustain:.8,release:.03}}),tt(r,i,{freq:720,endFreq:430,type:"sine",duration:.28,gain:.2*a,when:o+.1,vibrato:{rate:18,depth:60},env:{attack:.005,decay:.15,sustain:.4,release:.12}}),Pt(r,i,{duration:.35,gain:.16*a,when:o+.05,filter:{type:"bandpass",freq:700,endFreq:2600,q:1},env:{attack:.02,decay:.2,sustain:.4,release:.15}});return}Pt(r,i,{duration:.4,gain:.24*a,when:o,filter:{type:"bandpass",freq:500,endFreq:2500,q:1},env:{attack:.02,decay:.25,sustain:.4,release:.15}}),tt(r,i,{freq:300,endFreq:900,type:"triangle",duration:.35,gain:.1*a,when:o,filter:{type:"lowpass",freq:2e3},env:{attack:.02,decay:.15,sustain:.5,release:.1}}),(t==="pad"||t==="start")&&tt(r,i,{freq:1320,endFreq:1760,type:"sine",duration:.12,gain:.08*a,when:o+.03,env:{attack:.003,decay:.08,sustain:.2,release:.1}})}collision(e,t,n,i){let r=Ye(n/10),a=this.isPlayer(e)||t!==null&&this.isPlayer(t)?this.spatial(null,8,50,1):this.spatial(i,8,50,.6);if(!a)return;let l=this.ctx;t===null?(Pt(l,a,{duration:.12,gain:.15+.25*r,color:"pink",filter:{type:"lowpass",freq:700},env:{attack:.002,decay:.1,sustain:.2,release:.06}}),tt(l,a,{freq:140,endFreq:60,type:"sine",duration:.14,gain:.2+.2*r,env:{attack:.002,decay:.1,sustain:.3,release:.06}})):(tt(l,a,{freq:300,endFreq:180,type:"triangle",duration:.1,gain:.12+.15*r,env:{attack:.002,decay:.08,sustain:.3,release:.05}}),Pt(l,a,{duration:.05,gain:.08+.06*r,filter:{type:"bandpass",freq:1200,q:1},env:{attack:.001,decay:.04,sustain:.2,release:.03}}))}spin(e,t){let n=this.kartDest(e,10,55,1,.65);if(!n)return;let i=this.ctx,r=this.now;if(tt(i,n,{freq:420,endFreq:200,type:"triangle",duration:.55,gain:.14,when:r,vibrato:{rate:7,depth:80},env:{attack:.01,decay:.2,sustain:.6,release:.15}}),t.includes("shell")){Pt(i,n,{duration:.35,gain:.28,when:r,filter:{type:"bandpass",freq:2400,q:.6},env:{attack:.001,decay:.25,sustain:.15,release:.12}});for(let o=0;o<3;o++)tt(i,n,{freq:[1800,2400,3100][o],type:"sine",duration:.15,gain:.06,when:r+o*.015,env:{attack:.001,decay:.12,sustain:.05,release:.08}})}else t==="banana"||t==="triple_banana"?tt(i,n,{freq:900,endFreq:1500,sweepTime:.12,type:"sine",duration:.28,gain:.12,when:r,vibrato:{rate:22,depth:50},env:{attack:.01,decay:.1,sustain:.5,release:.1}}):t==="explosion"||t==="bob_omb"?tt(i,n,{freq:90,endFreq:40,type:"sine",duration:.3,gain:.2,when:r,env:{attack:.005,decay:.2,sustain:.3,release:.1}}):t==="lightning"?(Pt(i,n,{duration:.12,gain:.2,when:r,filter:{type:"highpass",freq:2500},env:{attack:.001,decay:.1,sustain:.1,release:.05}}),tt(i,n,{freq:220,endFreq:60,type:"square",duration:.1,gain:.1,when:r,filter:{type:"lowpass",freq:1800},env:{attack:.001,decay:.08,sustain:.2,release:.04}})):(tt(i,n,{freq:350,endFreq:200,type:"triangle",duration:.12,gain:.18,when:r,env:{attack:.002,decay:.1,sustain:.3,release:.06}}),Pt(i,n,{duration:.06,gain:.1,when:r,filter:{type:"bandpass",freq:900,q:1},env:{attack:.001,decay:.05,sustain:.2,release:.03}}))}squish(e){let t=this.kartDest(e,10,50,1,.6);if(!t)return;let n=this.ctx;Pt(n,t,{duration:.22,gain:.25,color:"pink",filter:{type:"lowpass",freq:900,endFreq:200},env:{attack:.002,decay:.18,sustain:.15,release:.06}}),tt(n,t,{freq:420,endFreq:70,type:"sine",duration:.22,gain:.25,env:{attack:.002,decay:.15,sustain:.3,release:.06}})}shrink(e,t){let n=this.kartDest(e,10,50,1,.55);n&&tt(this.ctx,n,{freq:t?800:150,endFreq:t?150:800,type:"square",duration:.4,gain:.14,filter:{type:"lowpass",freq:2500},env:{attack:.01,decay:.1,sustain:.7,release:.08}})}itemPickup(e,t){let n=t?this.spatial(null,8,40,1):this.spatial(e,8,40,.45);if(!n)return;let i=this.ctx,r=this.now;tt(i,n,{freq:1320,type:"sine",duration:.25,gain:.22,when:r,env:{attack:.003,decay:.2,sustain:.15,release:.15}}),tt(i,n,{freq:1980,type:"sine",duration:.2,gain:.09,when:r,env:{attack:.003,decay:.15,sustain:.1,release:.12}}),tt(i,n,{freq:2637,type:"sine",duration:.08,gain:.06,when:r+.04,env:{attack:.002,decay:.06,sustain:.1,release:.06}}),tt(i,n,{freq:3136,type:"sine",duration:.08,gain:.05,when:r+.08,env:{attack:.002,decay:.06,sustain:.1,release:.06}})}rouletteTick(e){if(!e||this.disposed)return;this.rouletteCount++;let t=this.buses.sfx,n=900*(1+.035*this.rouletteCount);Pt(this.ctx,t,{duration:.015,gain:.1,filter:{type:"highpass",freq:3e3},env:{attack:.001,decay:.012,sustain:.1,release:.01}}),tt(this.ctx,t,{freq:n,type:"sine",duration:.03,gain:.08,env:{attack:.002,decay:.02,sustain:.3,release:.02}})}rouletteEnd(e){if(this.rouletteCount=0,!e||this.disposed)return;let t=this.buses.sfx,n=this.now;tt(this.ctx,t,{freq:1568,type:"sine",duration:.25,gain:.18,when:n,env:{attack:.003,decay:.2,sustain:.2,release:.15}}),tt(this.ctx,t,{freq:2093,type:"sine",duration:.3,gain:.16,when:n+.06,env:{attack:.003,decay:.25,sustain:.2,release:.2}})}itemUse(e,t,n){let i=n?this.spatial(null,8,45,1):this.spatial(t,8,45,.5);if(!i)return;let r=this.ctx,o=this.now;switch(e){case"mushroom":case"triple_mushroom":case"golden_mushroom":tt(r,i,{freq:320,endFreq:160,sweepTime:.08,type:"sine",duration:.12,gain:.18,when:o,env:{attack:.005,decay:.06,sustain:.5,release:.04}}),tt(r,i,{freq:180,endFreq:420,type:"sine",duration:.12,gain:.14,when:o+.1,env:{attack:.005,decay:.06,sustain:.5,release:.05}});break;case"star":_o(r,i,[84,88,91,96],{type:"sine",gain:.07,duration:.2,when:o,env:{attack:.005,decay:.15,sustain:.3,release:.15}});break;case"lightning":tt(r,i,{freq:120,endFreq:2200,type:"square",duration:.5,gain:.1,when:o,filter:{type:"lowpass",freq:3e3},env:{attack:.02,decay:.1,sustain:.8,release:.05}}),Pt(r,i,{duration:.5,gain:.08,rate:1.5,when:o,filter:{type:"highpass",freq:2e3},env:{attack:.05,decay:.2,sustain:.8,release:.05}});break;case"none":break;default:Pt(r,i,{duration:.22,gain:.2,when:o,filter:{type:"bandpass",freq:900,endFreq:2600,q:1},env:{attack:.01,decay:.15,sustain:.3,release:.08}});break}}itemHit(e,t,n){let i=n?this.spatial(null,8,50,1):this.spatial(t,8,50,.7);if(!i)return;let r=this.ctx;Pt(r,i,{duration:.18,gain:n?.3:.22,filter:{type:"bandpass",freq:e==="banana"||e==="triple_banana"?700:1400,q:.8},env:{attack:.001,decay:.14,sustain:.15,release:.08}}),tt(r,i,{freq:160,endFreq:70,type:"sine",duration:.15,gain:.2,env:{attack:.002,decay:.12,sustain:.2,release:.05}})}itemDestroyed(e,t){let n=this.spatial(t,8,45,.7);if(!n)return;let i=this.ctx,r=this.now;if(e==="banana"||e==="triple_banana"){Pt(i,n,{duration:.12,gain:.14,color:"pink",filter:{type:"lowpass",freq:800},env:{attack:.002,decay:.1,sustain:.2,release:.05}});return}if(e!=="bob_omb"){for(let o=0;o<3;o++)tt(i,n,{freq:2200+Math.random()*1200,type:"sine",duration:.12,gain:.07,when:r+o*.02,env:{attack:.001,decay:.1,sustain:.05,release:.08}});Pt(i,n,{duration:.08,gain:.1,when:r,filter:{type:"highpass",freq:3e3},env:{attack:.001,decay:.06,sustain:.1,release:.04}})}}shellBounce(e){let t=this.spatial(e,8,45,.7);t&&(tt(this.ctx,t,{freq:1900,endFreq:1300,type:"sine",duration:.07,gain:.14,env:{attack:.001,decay:.05,sustain:.2,release:.04}}),Pt(this.ctx,t,{duration:.03,gain:.08,filter:{type:"highpass",freq:4e3},env:{attack:.001,decay:.025,sustain:.1,release:.02}}))}explosion(e,t){let n=this.spatial(e,14,140,1);if(!n)return;let i=this.ctx,r=this.now,o=.8+Ye(t/6)*.4;Pt(i,n,{duration:.02,gain:.3*o,when:r,filter:{type:"highpass",freq:3e3},env:{attack:.001,decay:.015,sustain:.1,release:.01}}),tt(i,n,{freq:85,endFreq:28,type:"sine",duration:.6,gain:.6*o,when:r,env:{attack:.005,decay:.4,sustain:.3,release:.3}}),Pt(i,n,{duration:.55,gain:.5*o,when:r,filter:{type:"lowpass",freq:1400,endFreq:180},env:{attack:.003,decay:.4,sustain:.25,release:.3}}),Pt(i,n,{duration:1,gain:.2*o,color:"brown",when:r+.1,filter:{type:"lowpass",freq:400},env:{attack:.05,decay:.6,sustain:.4,release:.5}})}lightning(){if(this.disposed)return;let e=this.buses.sfx,t=this.ctx,n=this.now;Pt(t,e,{duration:.35,gain:.55,when:n,filter:{type:"highpass",freq:1200,endFreq:250},env:{attack:.001,decay:.25,sustain:.2,release:.15}}),tt(t,e,{freq:3e3,endFreq:200,type:"square",duration:.15,gain:.12,when:n,filter:{type:"lowpass",freq:4e3},env:{attack:.001,decay:.12,sustain:.1,release:.05}}),Pt(t,e,{duration:1.4,gain:.4,color:"brown",when:n+.05,filter:{type:"lowpass",freq:160},env:{attack:.02,decay:.9,sustain:.4,release:.5}})}boxRespawn(e){let t=this.spatial(e,8,35,.5);t&&tt(this.ctx,t,{freq:880,endFreq:1320,type:"sine",duration:.1,gain:.08,env:{attack:.005,decay:.08,sustain:.3,release:.08}})}blueShellLaunch(){if(this.disposed)return;let e=this.buses.sfx,t=this.ctx,n=this.now;for(let i=0;i<3;i++){let r=n+i*.26;tt(t,e,{freq:600,endFreq:900,type:"square",duration:.12,gain:.09,when:r,filter:{type:"lowpass",freq:2500},env:{attack:.005,decay:.05,sustain:.7,release:.03}}),tt(t,e,{freq:900,endFreq:600,type:"square",duration:.12,gain:.09,when:r+.13,filter:{type:"lowpass",freq:2500},env:{attack:.005,decay:.05,sustain:.7,release:.03}})}Pt(t,e,{duration:.6,gain:.15,when:n,filter:{type:"bandpass",freq:600,endFreq:2e3,q:1},env:{attack:.05,decay:.3,sustain:.4,release:.2}})}countdown(e){if(this.disposed)return;let t=this.buses.sfx,n=e<=1?880:740;tt(this.ctx,t,{freq:n,type:"square",duration:.16,gain:.11,filter:{type:"lowpass",freq:3e3},env:{attack:.003,decay:.05,sustain:.7,release:.06}}),tt(this.ctx,t,{freq:n,type:"sine",duration:.16,gain:.14,env:{attack:.003,decay:.05,sustain:.7,release:.06}})}raceStart(){if(this.disposed)return;let e=this.buses.sfx,t=this.ctx,n=this.now;_o(t,e,[72,76,79,84],{type:"square",gain:.08,duration:.55,when:n,filter:{type:"lowpass",freq:3500},env:{attack:.005,decay:.15,sustain:.6,release:.3}}),_o(t,e,[60,67],{type:"sawtooth",gain:.07,duration:.55,when:n,filter:{type:"lowpass",freq:1800},env:{attack:.005,decay:.15,sustain:.6,release:.3}}),tt(t,e,{freq:150,endFreq:50,type:"sine",duration:.2,gain:.3,when:n,env:{attack:.002,decay:.15,sustain:.2,release:.08}})}lap(e,t,n){if(!t||this.disposed)return;let i=this.buses.sfx,r=this.ctx,o=this.now,a=(l,c,h)=>{tt(r,i,{freq:l,type:"sine",duration:.01,gain:c,when:h,env:{attack:.002,decay:.6,sustain:.001,release:.2}}),tt(r,i,{freq:l*2,type:"sine",duration:.01,gain:c*.3,when:h,env:{attack:.002,decay:.4,sustain:.001,release:.15}}),tt(r,i,{freq:l*2.76,type:"sine",duration:.01,gain:c*.22,when:h,env:{attack:.002,decay:.3,sustain:.001,release:.1}})};a(1568,.2,o),n&&(a(2093,.16,o+.18),qs(r,i,[[72,.12],[76,.12],[79,.12],[84,.45]],{type:"square",gain:.1,when:o+.3,filter:{type:"lowpass",freq:3e3},env:{attack:.005,decay:.05,sustain:.7,release:.08}}),qs(r,i,[[67,.12],[72,.12],[76,.12],[79,.45]],{type:"sawtooth",gain:.06,when:o+.3,filter:{type:"lowpass",freq:2200},env:{attack:.005,decay:.05,sustain:.7,release:.08}}))}finish(e,t,n){if(this.disposed)return;let i=this.ctx,r=this.now;if(!n){let l=this.spatial(this.kartPosition(e),10,60,.4);if(!l)return;tt(i,l,{freq:1046,endFreq:1568,type:"sine",duration:.2,gain:.1,when:r,env:{attack:.005,decay:.15,sustain:.3,release:.1}});return}let o=this.buses.sfx,a={type:"square",gain:.11,filter:{type:"lowpass",freq:2800},env:{attack:.01,decay:.08,sustain:.75,release:.1}};t===1?(qs(i,o,[[67,.14],[67,.14],[67,.14],[72,.5],[76,.2],[79,.7]],{...a,when:r}),qs(i,o,[[60,.14],[60,.14],[60,.14],[64,.5],[67,.2],[72,.7]],{...a,gain:.07,type:"sawtooth",when:r}),_o(i,o,[72,76,79,84],{type:"sawtooth",gain:.06,duration:1.3,when:r+1.85,detune:8,filter:{type:"lowpass",freq:2400},env:{attack:.02,decay:.3,sustain:.7,release:.6}}),tt(i,o,{freq:1568,type:"sine",duration:.01,gain:.15,when:r+1.85,env:{attack:.002,decay:.8,sustain:.001,release:.3}})):t<=3?(qs(i,o,[[72,.15],[76,.15],[79,.15],[84,.55]],{...a,when:r}),_o(i,o,[72,76,79],{type:"sawtooth",gain:.06,duration:.9,when:r+.5,detune:8,filter:{type:"lowpass",freq:2400},env:{attack:.02,decay:.3,sustain:.7,release:.5}})):(qs(i,o,[[67,.32],[65,.32],[63,.32],[60,.95]],{type:"sawtooth",gain:.11,when:r,vibrato:{rate:6,depth:45},filter:{type:"lowpass",freq:1200,endFreq:500},env:{attack:.03,decay:.1,sustain:.8,release:.15}}),qs(i,o,[[55,.32],[53,.32],[51,.32],[48,.95]],{type:"square",gain:.05,when:r,filter:{type:"lowpass",freq:900},env:{attack:.03,decay:.1,sustain:.8,release:.15}}))}positionChange(e,t){if(this.disposed)return;let n=t<e;tt(this.ctx,this.buses.sfx,{freq:n?600:1200,endFreq:n?1200:600,type:"sine",duration:.12,gain:.11,env:{attack:.005,decay:.08,sustain:.4,release:.08}}),Pt(this.ctx,this.buses.sfx,{duration:.12,gain:.06,filter:{type:"bandpass",freq:n?1200:2400,endFreq:n?2400:1200,q:1.5},env:{attack:.01,decay:.08,sustain:.3,release:.06}})}wrongWay(e,t){if(!t||!this.isPlayer(e)||this.disposed)return;let n=this.now;n-this.lastWrongWay<1||(this.lastWrongWay=n,tt(this.ctx,this.buses.sfx,{freq:110,type:"square",duration:.25,gain:.11,filter:{type:"lowpass",freq:700},env:{attack:.005,decay:.05,sustain:.8,release:.05}}))}uiMove(){this.disposed||tt(this.ctx,this.buses.ui,{freq:1200,type:"sine",duration:.035,gain:.12,env:{attack:.002,decay:.02,sustain:.3,release:.03}})}uiSelect(){if(this.disposed)return;let e=this.now;tt(this.ctx,this.buses.ui,{freq:880,type:"sine",duration:.06,gain:.13,when:e,env:{attack:.002,decay:.04,sustain:.5,release:.04}}),tt(this.ctx,this.buses.ui,{freq:1320,type:"sine",duration:.12,gain:.14,when:e+.06,env:{attack:.002,decay:.08,sustain:.4,release:.08}})}uiBack(){this.disposed||tt(this.ctx,this.buses.ui,{freq:660,endFreq:440,type:"sine",duration:.12,gain:.1,env:{attack:.003,decay:.08,sustain:.4,release:.06}})}uiError(){if(this.disposed)return;let e=this.now;for(let t=0;t<2;t++)tt(this.ctx,this.buses.ui,{freq:220,type:"square",duration:.08,gain:.08,when:e+t*.12,filter:{type:"lowpass",freq:1200},env:{attack:.003,decay:.03,sustain:.8,release:.03}})}};var _S=16,ES=.1,TS=25,Xs=class{constructor(){E(this,"notes",[])}add(e,t,n,i,r){return this.notes.push({inst:e,step:t,note:n,dur:i,vel:r}),this}kick(e,t=1){return this.add("kick",e,0,1,t)}snare(e,t=1){return this.add("snare",e,0,1,t)}hatC(e,t=1){return this.add("hatC",e,0,1,t)}hatO(e,t=1){return this.add("hatO",e,0,1,t)}crash(e,t=1){return this.add("crash",e,0,1,t)}bass(e,t,n,i=1){return this.add("bass",e,t,n,i)}lead(e,t,n,i=1){return this.add("lead",e,t,n,i)}arp(e,t,n,i=1){return this.add("arp",e,t,n,i)}bell(e,t,n,i=1){return this.add("bell",e,t,n,i)}chord(e,t,n,i=1){for(let r of t)this.add("chord",e,r,n,i);return this}pad(e,t,n,i=1){for(let r of t)this.add("pad",e,r,n,i);return this}melody(e,t,n=1){for(let[i,r,o]of t)this.add(e,i,r,o,n);return this}build(){return{notes:this.notes}}},qa=class{constructor(e,t,n){E(this,"output");E(this,"ctx");E(this,"song");E(this,"stepDur");E(this,"drumBus");E(this,"bassBus");E(this,"leadBus");E(this,"leadDelay");E(this,"leadFeedback");E(this,"leadWet");E(this,"chordBus");E(this,"chordFilter");E(this,"chordLfo");E(this,"arpBus");E(this,"timer",null);E(this,"bar",0);E(this,"step",0);E(this,"nextTime",0);E(this,"stopped",!1);this.ctx=e,this.song=n,this.stepDur=60/n.bpm/4,this.output=e.createGain(),this.output.gain.value=0,this.output.connect(t);let i=a=>{let l=e.createGain();return l.gain.value=a,l.connect(this.output),l};this.drumBus=i(.9*n.gain),this.bassBus=i(.8*n.gain),this.arpBus=i(.7*n.gain),this.leadBus=i(.85*n.gain),this.leadDelay=e.createDelay(1.5),this.leadDelay.delayTime.value=Math.min(1.4,this.stepDur*3),this.leadFeedback=e.createGain(),this.leadFeedback.gain.value=.32,this.leadWet=e.createGain(),this.leadWet.gain.value=.3*n.leadDelay*n.gain;let r=e.createBiquadFilter();r.type="lowpass",r.frequency.value=2600,this.leadBus.connect(this.leadDelay),this.leadDelay.connect(r),r.connect(this.leadFeedback),this.leadFeedback.connect(this.leadDelay),r.connect(this.leadWet),this.leadWet.connect(this.output),this.chordBus=e.createGain(),this.chordBus.gain.value=.9*n.gain,this.chordFilter=e.createBiquadFilter(),this.chordFilter.type="lowpass",this.chordFilter.frequency.value=1500,this.chordFilter.Q.value=.9,this.chordLfo=e.createOscillator(),this.chordLfo.type="sine",this.chordLfo.frequency.value=.13;let o=e.createGain();o.gain.value=750,this.chordLfo.connect(o),o.connect(this.chordFilter.frequency),this.chordBus.connect(this.chordFilter),this.chordFilter.connect(this.output),this.chordLfo.start()}start(e,t){if(this.timer||this.stopped)return;let n=this.ctx.currentTime,i=Math.max(n+.02,e);this.output.gain.cancelScheduledValues(n),this.output.gain.setValueAtTime(1e-4,n),this.output.gain.exponentialRampToValueAtTime(1,i+Math.max(.02,t)),this.nextTime=i,this.bar=0,this.step=0,this.timer=setInterval(()=>this.tick(),TS),this.tick()}stop(e){if(this.stopped)return;this.stopped=!0;let t=this.ctx.currentTime,n=this.output.gain;n.cancelScheduledValues(t),n.setValueAtTime(Math.max(1e-4,n.value),t),n.exponentialRampToValueAtTime(1e-4,t+Math.max(.02,e)),this.timer&&(clearInterval(this.timer),this.timer=null),setTimeout(()=>{try{this.chordLfo.stop()}catch{}this.output.disconnect(),this.leadFeedback.disconnect(),this.leadDelay.disconnect()},e*1e3+1200)}dispose(){this.stopped||this.stop(.02)}tick(){if(this.stopped)return;let t=this.ctx.currentTime+ES,n=this.song.bars;if(n.length===0)return;let i=0;for(;this.nextTime<t&&i++<64;){let r=n[this.bar],o=this.nextTime;for(let a of r.notes)a.step===this.step&&this.play(a,o);this.step++,this.nextTime+=this.stepDur,this.step>=_S&&(this.step=0,this.bar++,this.bar>=n.length&&(this.bar=Math.min(this.song.loopStart,n.length-1)))}}play(e,t){let n=e.dur*this.stepDur,i=e.note+this.song.transpose;switch(e.inst){case"kick":this.kick(t,e.vel);break;case"snare":this.snare(t,e.vel);break;case"hatC":this.hat(t,e.vel,!1);break;case"hatO":this.hat(t,e.vel,!0);break;case"crash":this.crash(t,e.vel);break;case"bass":this.bass(t,i,n,e.vel);break;case"lead":this.lead(t,i,n,e.vel);break;case"chord":this.chord(t,i,n,e.vel,!1);break;case"pad":this.chord(t,i,n,e.vel,!0);break;case"arp":this.arp(t,i,n,e.vel);break;case"bell":this.bell(t,i,n,e.vel);break;default:break}}kick(e,t){let n=this.ctx,i=n.createOscillator();i.type="sine",i.frequency.setValueAtTime(170,e),i.frequency.exponentialRampToValueAtTime(44,e+.1);let r=n.createGain();r.gain.setValueAtTime(.9*t,e),r.gain.exponentialRampToValueAtTime(1e-4,e+.3),i.connect(r),r.connect(this.drumBus),i.start(e),i.stop(e+.32),i.onended=()=>{i.disconnect(),r.disconnect()},Pt(n,this.drumBus,{duration:.012,gain:.22*t,when:e,filter:{type:"highpass",freq:2500},env:{attack:.001,decay:.01,sustain:.1,release:.01}})}snare(e,t){let n=this.ctx;Pt(n,this.drumBus,{duration:.14,gain:.5*t,when:e,filter:{type:"bandpass",freq:1700,q:.8},env:{attack:.001,decay:.12,sustain:.05,release:.04}});let i=n.createOscillator();i.type="triangle",i.frequency.setValueAtTime(195,e),i.frequency.exponentialRampToValueAtTime(150,e+.08);let r=n.createGain();r.gain.setValueAtTime(.35*t,e),r.gain.exponentialRampToValueAtTime(1e-4,e+.1),i.connect(r),r.connect(this.drumBus),i.start(e),i.stop(e+.12),i.onended=()=>{i.disconnect(),r.disconnect()}}hat(e,t,n){Pt(this.ctx,this.drumBus,{duration:n?.14:.03,gain:(n?.16:.2)*t,when:e,filter:{type:"highpass",freq:8e3,q:.7},env:n?{attack:.001,decay:.12,sustain:.15,release:.05}:{attack:.001,decay:.03,sustain:.05,release:.01}})}crash(e,t){Pt(this.ctx,this.drumBus,{duration:.7,gain:.28*t,when:e,filter:{type:"highpass",freq:4500,q:.6},env:{attack:.002,decay:.55,sustain:.12,release:.4}}),Pt(this.ctx,this.drumBus,{duration:.5,gain:.14*t,when:e,color:"pink",filter:{type:"bandpass",freq:3200,q:1.2},env:{attack:.002,decay:.4,sustain:.1,release:.3}})}bass(e,t,n,i){let r=this.ctx,o=os(t),a=r.createOscillator();a.type="sawtooth",a.frequency.value=o;let l=r.createOscillator();l.type="square",l.frequency.value=o*.5;let c=r.createGain();c.gain.value=.45;let h=r.createBiquadFilter();h.type="lowpass",h.Q.value=2.2,Cf(h.frequency,300+o*7,120+o*2.5,e,Math.min(.18,Math.max(.05,n)));let u=r.createGain(),d=Ws(u.gain,e,.3*i,n*.9,{attack:.004,decay:.08,sustain:.75,release:.05});a.connect(h),l.connect(c),c.connect(h),h.connect(u),u.connect(this.bassBus),a.start(e),l.start(e),a.stop(d+.02),l.stop(d+.02),a.onended=()=>{a.disconnect(),l.disconnect(),h.disconnect(),u.disconnect()}}lead(e,t,n,i){let r=this.ctx,o=os(t),a=r.createOscillator();a.type="square",a.frequency.value=o;let l=r.createOscillator();l.type="sawtooth",l.frequency.value=o,l.detune.value=-6;let c=r.createGain();c.gain.value=.45;let h=r.createOscillator();h.type="sine",h.frequency.value=5.5;let u=r.createGain();u.gain.setValueAtTime(0,e),u.gain.linearRampToValueAtTime(9,e+.15),h.connect(u),u.connect(a.detune),u.connect(l.detune);let d=r.createBiquadFilter();d.type="lowpass",d.frequency.value=3200,d.Q.value=.8;let f=r.createGain(),g=Ws(f.gain,e,.2*i,n*.92,{attack:.008,decay:.06,sustain:.75,release:.07});a.connect(d),l.connect(c),c.connect(d),d.connect(f),f.connect(this.leadBus),a.start(e),l.start(e),h.start(e),a.stop(g+.02),l.stop(g+.02),h.stop(g+.02),a.onended=()=>{a.disconnect(),l.disconnect(),h.disconnect(),d.disconnect(),f.disconnect()}}chord(e,t,n,i,r){let o=this.ctx,a=os(t),l=o.createGain(),c=r?{attack:.25,decay:.3,sustain:.85,release:.5}:{attack:.02,decay:.1,sustain:.8,release:.15},h=Ws(l.gain,e,(r?.04:.05)*i,n*.95,c),u=o.createOscillator();u.type=r?"triangle":"sawtooth",u.frequency.value=a,u.detune.value=7;let d=o.createOscillator();d.type="sawtooth",d.frequency.value=a,d.detune.value=-7;let f=o.createGain();f.gain.value=r?.5:1,u.connect(l),d.connect(f),f.connect(l),l.connect(this.chordBus),u.start(e),d.start(e),u.stop(h+.02),d.stop(h+.02),u.onended=()=>{u.disconnect(),d.disconnect(),l.disconnect()}}arp(e,t,n,i){let r=this.ctx,o=os(t),a=r.createOscillator();a.type="triangle",a.frequency.value=o;let l=r.createOscillator();l.type="sine",l.frequency.value=o*2;let c=r.createGain();c.gain.value=.3;let h=r.createBiquadFilter();h.type="lowpass",h.frequency.value=4500;let u=r.createGain(),d=Ws(u.gain,e,.18*i,n*.8,{attack:.003,decay:.1,sustain:.25,release:.05});a.connect(h),l.connect(c),c.connect(h),h.connect(u),u.connect(this.arpBus),a.start(e),l.start(e),a.stop(d+.02),l.stop(d+.02),a.onended=()=>{a.disconnect(),l.disconnect(),h.disconnect(),u.disconnect()}}bell(e,t,n,i){let r=this.ctx,o=os(t),a=r.createGain(),l=Ws(a.gain,e,.2*i,.01,{attack:.002,decay:Math.max(.2,n),sustain:.001,release:.1}),c=r.createOscillator();c.type="sine",c.frequency.value=o;let h=r.createOscillator();h.type="sine",h.frequency.value=o*2.76;let u=r.createGain();u.gain.value=.3,c.connect(a),h.connect(u),u.connect(a),a.connect(this.arpBus),c.start(e),h.start(e),c.stop(l+.02),h.stop(l+.02),c.onended=()=>{c.disconnect(),h.disconnect(),a.disconnect()}}};function Zg(s,e,t,n=1){let i=t===e?e+7:t>e?t-1:t+1,r=[e,e+7,e+12,e+7,e,e+7,e+9,i];for(let o=0;o<8;o++){let a=o%2===0?1:.8;s.bass(o*2,r[o],2,n*a)}}function $g(s,e,t){if(s.kick(0,1).kick(4,.9).kick(8,1).kick(12,.9),s.snare(4,.9).snare(12,.95),e){for(let n=0;n<16;n++)s.hatC(n,n%4===2?.8:n%2===0?.45:.3);s.hatO(6,.5).hatO(14,.5)}else for(let n=0;n<16;n+=2)s.hatC(n,n%4===2?.8:.45);t&&s.snare(12,.5).snare(13,.6).snare(14,.75).snare(15,.9)}var MS=[[[0,79,2],[2,83,2],[4,86,3],[8,83,2],[10,81,2],[12,79,4]],[[0,78,3],[4,81,2],[6,86,2],[8,81,4],[12,78,2],[14,76,2]],[[0,76,2],[2,79,2],[4,83,4],[8,79,2],[10,81,2],[12,83,4]],[[0,84,3],[4,83,2],[6,81,2],[8,79,4],[12,81,2],[14,83,2]],[[0,79,2],[2,83,2],[4,86,3],[8,88,2],[10,86,2],[12,83,4]],[[0,81,3],[4,78,2],[6,81,2],[8,86,4],[12,85,2],[14,86,2]],[[0,88,2],[2,86,2],[4,84,4],[8,83,2],[10,84,2],[12,86,4]],[[0,86,4],[4,81,2],[6,83,2],[8,81,2],[10,78,2],[12,74,4]]],SS=[[[0,83,1],[1,83,1],[2,88,2],[4,86,2],[6,83,2],[8,79,4],[12,81,2],[14,83,2]],[[0,84,1],[1,84,1],[2,88,2],[4,86,2],[6,84,2],[8,81,4],[12,79,2],[14,81,2]],[[0,83,2],[2,86,2],[4,91,4],[8,86,2],[10,83,2],[12,79,4]],[[0,81,2],[2,85,2],[4,86,4],[8,88,2],[10,86,2],[12,81,4]],[[0,83,1],[1,83,1],[2,88,2],[4,86,2],[6,83,2],[8,79,4],[12,81,2],[14,83,2]],[[0,84,1],[1,84,1],[2,88,2],[4,86,2],[6,84,2],[8,81,4],[12,84,2],[14,86,2]],[[0,88,2],[2,90,2],[4,91,4],[8,90,2],[10,88,2],[12,86,4]],[[0,85,2],[2,86,2],[4,88,2],[6,90,2],[8,91,4],[12,90,2],[14,88,2]]];function Jg(s){let e={root:43,chord:[67,71,74]},t={root:38,chord:[66,69,74]},n={root:40,chord:[64,67,71]},i={root:36,chord:[64,67,72]},r=[e,t,n,i,e,t,i,t],o=[n,i,e,t,n,i,t,t],a=s,l=[];for(let c=0;c<8;c++){let h=r[c],u=r[(c+1)%8],d=new Xs;$g(d,a,c===7),c===0&&d.crash(0,.8),Zg(d,h.root,u.root,.95),d.chord(0,h.chord,3,.9).chord(6,h.chord,2,.6).chord(8,h.chord,3,.85);for(let f=2;f<16;f+=4)d.arp(f,h.chord[Math.floor(f/4)%3]+12,1,.45);d.melody("lead",MS[c],.95),l.push(d.build())}for(let c=0;c<8;c++){let h=o[c],u=c===7?r[0]:o[c+1],d=new Xs;$g(d,!0,c===7),c===0&&d.crash(0,.7),Zg(d,h.root,u.root,1),d.chord(0,h.chord,16,.75);let f=[h.chord[0]+12,h.chord[1]+12,h.chord[2]+12,h.chord[0]+24],g=[0,1,2,3,2,1,0,1,2,3,2,1,0,1,2,3];for(let v=0;v<16;v++)d.arp(v,f[g[v]],1,v%4===0?.6:.4);d.melody("lead",SS[c],1),l.push(d.build())}return{bpm:s?152*1.1:152,transpose:s?1:0,bars:l,loopStart:0,leadDelay:1,gain:1}}var wS=[[[0,81,6],[8,78,4],[12,76,4]],[[0,74,8],[8,78,4],[12,76,2],[14,74,2]],[[0,71,6],[8,74,4],[12,76,4]],[[0,73,8],[8,76,4],[12,69,4]]];function jg(){let s=[{root:38,chord:[57,61,62,66]},{root:35,chord:[59,62,66,69]},{root:43,chord:[55,59,62,66]},{root:45,chord:[57,62,64,67]}],e=[];for(let t=0;t<8;t++){let n=s[t%4],i=new Xs;i.kick(0,.5).kick(8,.42),i.snare(4,.18).snare(12,.22);for(let a=2;a<16;a+=4)i.hatC(a,.35);t%2===1&&i.hatO(14,.2),i.bass(0,n.root,6,.8).bass(8,n.root+7,4,.6).bass(12,n.root,4,.5),i.pad(0,n.chord,16,.8);let r=n.chord.map(a=>a+12),o=[0,1,2,3,2,1,0,1];for(let a=0;a<8;a++)i.arp(a*2,r[o[a]],2,.5);t>=4&&i.melody("lead",wS[t-4],.55),e.push(i.build())}return{bpm:100,transpose:0,bars:e,loopStart:0,leadDelay:.8,gain:.85}}var RS=[[[0,67,1],[2,67,1],[4,67,2],[6,72,6],[12,76,4]],[[0,77,4],[4,76,2],[6,74,2],[8,72,8]],[[0,74,2],[2,76,2],[4,77,2],[6,79,2],[8,81,4],[12,83,4]],[[0,84,14]]],AS=[[[0,76,4],[4,79,4],[8,77,2],[10,76,2],[12,74,4]],[[0,72,6],[8,76,4],[12,74,4]],[[0,72,4],[4,74,2],[6,76,2],[8,77,8]],[[0,79,8],[8,76,4],[12,74,4]]];function CS(){let s=[],e=[{root:36,chord:[60,64,67,72]},{root:41,chord:[65,69,72,77]},{root:43,chord:[67,71,74,79]},{root:36,chord:[60,64,67,72]}];for(let n=0;n<4;n++){let i=e[n],r=new Xs;if(n<3)if(r.kick(0,1).kick(8,.9),r.chord(0,i.chord,7,.9).chord(8,i.chord,7,.8),r.bass(0,i.root,7,1).bass(8,i.root,7,.9),n===2)for(let o=8;o<16;o++)r.snare(o,.35+(o-8)*.08);else r.snare(4,.6).snare(12,.7);else r.crash(0,1).kick(0,1),r.chord(0,i.chord,15,1),r.bass(0,i.root,14,1);r.melody("lead",RS[n],1),s.push(r.build())}let t=[{root:36,chord:[60,64,67]},{root:45,chord:[60,64,69]},{root:41,chord:[60,65,69]},{root:43,chord:[59,62,67]}];for(let n=0;n<8;n++){let i=t[n%4],r=t[(n+1)%4],o=new Xs;o.kick(0,.8).kick(8,.7),o.snare(4,.5).snare(12,.55);for(let c=2;c<16;c+=4)o.hatC(c,.5);o.bass(0,i.root,4,.9).bass(6,i.root+7,2,.6).bass(8,i.root,4,.85).bass(12,i.root+12,2,.6).bass(14,r.root>i.root?r.root-1:r.root+1,2,.6),o.pad(0,i.chord,16,.85);let a=i.chord.map(c=>c+12),l=[0,1,2,1,0,1,2,1];for(let c=0;c<8;c++)o.arp(c*2+1,a[l[c]],1,.4);n>=4&&o.melody("lead",AS[n-4],.7),s.push(o.build())}return{bpm:112,transpose:0,bars:s,loopStart:4,leadDelay:.8,gain:.95}}function Qg(){let s=[72,77,79,72],e=[];for(let t=0;t<4;t++){let n=s[t],i=[n,n+4,n+7,n+12,n+16,n+19,n+16,n+12,n+7,n+12,n+16,n+12,n+7,n+4,n+7,n+4],r=new Xs;for(let o=0;o<16;o++)r.arp(o,i[o],1,o%4===0?1:.7);for(let o=0;o<16;o+=4)r.kick(o,.7).bass(o,n-24,2,.8);for(let o=2;o<16;o+=4)r.hatC(o,.6);e.push(r.build())}return{bpm:170,transpose:0,bars:e,loopStart:0,leadDelay:0,gain:1}}var Df=.8,Oh=class{constructor(e,t){E(this,"current",null);E(this,"currentTrack","none");E(this,"ctx");E(this,"dest");this.ctx=e,this.dest=t}get track(){return this.currentTrack}play(e){if(e===this.currentTrack)return;if(e==="none"){this.stop();return}let t=IS(e),n=new qa(this.ctx,this.dest,t);this.current&&this.current.stop(Df),n.start(this.ctx.currentTime+.05,Df),this.current=n,this.currentTrack=e}stop(){this.current&&this.current.stop(Df),this.current=null,this.currentTrack="none"}dispose(){this.current&&this.current.dispose(),this.current=null,this.currentTrack="none"}};function IS(s){switch(s){case"menu":return jg();case"race":return Jg(!1);case"finalLap":return Jg(!0);case"results":return CS();default:return jg()}}function ev(s){Xi(s,"white"),Xi(s,"pink")}var PS=-6,kS=.85,DS=.5,LS=-8,FS=-10,HS=1,BS=25,NS=4,US=.5,Xa=Math.max(8,16),zh=class{constructor(){E(this,"ctx",null);E(this,"master",null);E(this,"compressor",null);E(this,"limiter",null);E(this,"musicBus",null);E(this,"musicDuck",null);E(this,"sfxBus",null);E(this,"enginesBus",null);E(this,"enginesClip",null);E(this,"uiBus",null);E(this,"sfx",null);E(this,"music",null);E(this,"crowd",null);E(this,"starJingle",null);E(this,"engines",new Array(Xa).fill(null));E(this,"frame",0);E(this,"voiceTierTimer",0);E(this,"_ready",!1);E(this,"_muted",!1);E(this,"masterVolume",1);E(this,"pendingTrack","none");E(this,"starFlags",new Uint8Array(Xa));E(this,"lightningDuck",0);E(this,"lastDuckDb",0);E(this,"disposed",!1);E(this,"initPromise",null);E(this,"unsubs",[]);E(this,"camPos",new C);E(this,"camFwd",new C);E(this,"camUp",new C);E(this,"camRight",new C);let e=this.unsubs;e.push($.on("kart:starStart",t=>{t.kartId>=0&&t.kartId<Xa&&(this.starFlags[t.kartId]=1)})),e.push($.on("kart:starEnd",t=>{t.kartId>=0&&t.kartId<Xa&&(this.starFlags[t.kartId]=0)})),e.push($.on("item:lightning",()=>{this.lightningDuck=HS})),e.push($.on("race:lap",t=>{t.isPlayer&&(this.crowd?.cheerBurst(.5),t.isFinalLap&&this.music&&this.music.track==="race"&&this.playMusic("finalLap"))})),e.push($.on("race:start",()=>this.crowd?.cheerBurst(1))),e.push($.on("race:finish",t=>{t.isPlayer&&this.crowd?.cheerBurst(1)}))}get ready(){return this._ready}suspendForTV(){this.ctx?.suspend().catch(()=>{})}get contextStateForTV(){return this.ctx?.state||"not_created"}get muted(){return this._muted}init(){return this.disposed?Promise.resolve():this.initPromise?this.initPromise:(this.initPromise=this.doInit().finally(()=>{this.initPromise=null}),this.initPromise)}async doInit(){if(!this.ctx){let t=window.AudioContext??window.webkitAudioContext;if(!t){console.warn("[AudioEngine] Web Audio API unavailable");return}try{let n=new t({latencyHint:"interactive"});this.ctx=n,this.buildGraph(n)}catch(n){console.warn("[AudioEngine] failed to create AudioContext",n),this.ctx=null;return}}let e=this.ctx;if(e.state!=="running")try{await e.resume()}catch(t){console.warn("[AudioEngine] resume failed (needs a user gesture)",t)}e.state==="running"&&!this._ready&&!this.disposed&&(this._ready=!0,this.pendingTrack!=="none"&&this.music&&this.music.play(this.pendingTrack))}buildGraph(e){let t=e.createGain();t.gain.value=this._muted?0:this.masterVolume;let n=e.createDynamicsCompressor();n.threshold.value=-12,n.knee.value=20,n.ratio.value=4,n.attack.value=.003,n.release.value=.25;let i=e.createDynamicsCompressor();i.threshold.value=-3,i.knee.value=0,i.ratio.value=20,i.attack.value=.001,i.release.value=.08,t.connect(n),n.connect(i),i.connect(e.destination);let r=(d,f)=>{let g=e.createGain();return g.gain.value=d,g.connect(f),g},o=r(1,t),a=r(Af(PS),o),l=r(1,t),c=e.createWaveShaper();c.curve=Hh(1.6,2048),c.oversample="none",c.connect(t);let h=r(kS,c),u=r(DS,t);this.master=t,this.compressor=n,this.limiter=i,this.musicDuck=o,this.musicBus=a,this.sfxBus=l,this.enginesBus=h,this.enginesClip=c,this.uiBus=u,this.lastDuckDb=0,ev(e),this.sfx=new Uh(e,{sfx:l,ui:u}),this.music=new Oh(e,a),this.crowd=new Nh(e,l)}dispose(){if(this.disposed)return;this.disposed=!0;for(let t of this.unsubs)t();this.unsubs.length=0;for(let t=0;t<this.engines.length;t++){let n=this.engines[t];n&&n.voice.dispose(),this.engines[t]=null}this.starFlags.fill(0),this.music?.dispose(),this.music=null,this.starJingle?.dispose(),this.starJingle=null,this.crowd?.dispose(),this.crowd=null,this.sfx?.dispose(),this.sfx=null;let e=this.ctx;this.ctx=null,this._ready=!1,e&&setTimeout(()=>{e.close().catch(()=>{})},400),this.master=null,this.compressor=null,this.limiter=null,this.musicBus=null,this.musicDuck=null,this.sfxBus=null,this.enginesBus=null,this.enginesClip=null,this.uiBus=null}update(e,t,n,i){let r=this.ctx;if(!this._ready||!r||this.disposed||!this.sfx||!this.enginesBus)return;e=Math.min(Math.max(e,0),.1);let o=r.currentTime;this.frame++;let a=i.matrixWorld.elements;this.camPos.set(a[12],a[13],a[14]),this.camFwd.set(-a[8],-a[9],-a[10]).normalize(),this.camUp.set(a[4],a[5],a[6]).normalize(),this.camRight.crossVectors(this.camFwd,this.camUp).normalize(),Kg(r.listener,this.camPos.x,this.camPos.y,this.camPos.z,this.camFwd.x,this.camFwd.y,this.camFwd.z,this.camUp.x,this.camUp.y,this.camUp.z);let l=this.sfx.listener;l.pos.copy(this.camPos),l.forward.copy(this.camFwd),l.up.copy(this.camUp),l.right.copy(this.camRight),this.sfx.karts=t,this.sfx.playerKartId=n;let c=this.engines,h=null;for(let g=0;g<t.length;g++){let v=t[g],p=v.state,m=p.id;if(m===n&&(h=v),m<0||m>=Xa)continue;let y=m===n||p.isPlayer,_=c[m];_||(_={voice:new Bh(r,this.enginesBus,m,p.character.weightClass,y),lastSeen:this.frame,distance:0},c[m]=_),_.lastSeen=this.frame,_.distance=p.position.distanceTo(this.camPos),_.voice.update(e,p,v.input.throttle,v.topSpeed())}for(let g=0;g<c.length;g++){let v=c[g];v&&v.lastSeen!==this.frame&&(v.voice.dispose(),c[g]=null)}this.voiceTierTimer-=e,this.voiceTierTimer<=0&&(this.voiceTierTimer=US,this.assignVoiceTiers());let u=!1,d=this.starFlags;for(let g=0;g<d.length;g++){if(d[g]===0)continue;let v=OS(t,g);if(!v||!v.state.isInvincible){d[g]=0;continue}(v.state.isPlayer||g===n||v.state.position.distanceTo(this.camPos)<=BS)&&(u=!0)}if(u&&!this.starJingle&&this.sfxBus){let g=new qa(r,this.sfxBus,Qg());g.start(o+.05,.15),this.starJingle=g}else!u&&this.starJingle&&(this.starJingle.stop(.35),this.starJingle=null);let f=0;u&&(f=Math.min(f,LS)),this.lightningDuck>0&&(this.lightningDuck-=e,f=Math.min(f,FS)),f!==this.lastDuckDb&&this.musicDuck&&(this.lastDuckDb=f,this.musicDuck.gain.setTargetAtTime(Af(f),o,.12)),this.crowd?.update(e,h?h.state.trackT:null)}assignVoiceTiers(){let e=this.engines,t=NS;for(let i=0;i<e.length;i++){let r=e[i];r&&r.voice.isPlayer&&(r.voice.setRich(!0),t--)}let n=0;for(;n<t;){let i=null;for(let r=0;r<e.length;r++){let o=e[r];!o||o.voice.isPlayer||o.distance<0||(!i||o.distance<i.distance)&&(i=o)}if(!i)break;i.voice.setRich(!0),i.distance=-1-i.distance,n++}for(let i=0;i<e.length;i++){let r=e[i];!r||r.voice.isPlayer||(r.distance<0?r.distance=-1-r.distance:r.voice.setRich(!1))}}playMusic(e){this.pendingTrack=e,!(!this._ready||!this.music)&&this.music.play(e)}stopMusic(){this.pendingTrack="none",this.music?.stop()}setMasterVolume(e){this.masterVolume=Ye(e),this.master&&this.ctx&&!this._muted&&this.master.gain.setTargetAtTime(this.masterVolume,this.ctx.currentTime,.05)}setMuted(e){if(this._muted=e,this.master&&this.ctx){let t=this.master.gain,n=this.ctx.currentTime;t.cancelScheduledValues(n),t.setValueAtTime(t.value,n),t.linearRampToValueAtTime(e?0:this.masterVolume,n+.12)}}};function OS(s,e){if(e>=0&&e<s.length&&s[e].state.id===e)return s[e];for(let t=0;t<s.length;t++)if(s[t].state.id===e)return s[t];return null}var tv=`
uniform float uTime;
uniform float uGravity;
uniform float uHeightPx;
uniform float uAspect;

attribute vec3 aVelocity;
attribute vec2 aTime;   // birth, life
attribute vec2 aSize;   // start, end (world metres)
attribute vec3 aColor0;
attribute vec3 aColor1;
attribute vec2 aAlpha;  // start, end
attribute vec2 aRot;    // rotation, angular velocity
attribute vec4 aMisc;   // gravityScale, atlasIndex, alignToVelocity, drag

varying vec4 vColor;
varying float vRot;
varying float vAtlas;

void main() {
  float age = uTime - aTime.x;
  float life = max(aTime.y, 0.0001);
  float t = age / life;
  if (age < 0.0 || t >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec4(0.0);
    vRot = 0.0;
    vAtlas = 0.0;
    return;
  }

  float k = aMisc.w;
  // Ballistic motion with optional exponential drag: integral of v*exp(-k t).
  float tt = k > 0.001 ? (1.0 - exp(-k * age)) / k : age;
  float g = uGravity * aMisc.x;
  vec3 pos = position + aVelocity * tt;
  pos.y -= 0.5 * g * age * age;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = mix(aSize.x, aSize.y, t);
  float px = size * projectionMatrix[1][1] * uHeightPx * 0.5 / max(0.05, -mv.z);
  gl_PointSize = clamp(px, 0.0, 512.0);

  float fadeIn = smoothstep(0.0, 0.06, t);
  float fadeOut = 1.0 - smoothstep(0.7, 1.0, t);
  float alpha = mix(aAlpha.x, aAlpha.y, t) * fadeIn * fadeOut;
  vColor = vec4(mix(aColor0, aColor1, t), alpha);

  float rot = aRot.x + aRot.y * age;
  if (aMisc.z > 0.5) {
    // Align the sprite's x axis to the screen-space velocity direction.
    vec3 vel = aVelocity * exp(-k * age);
    vel.y -= g * age;
    vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(pos + vel * 0.02, 1.0));
    vec2 d = c1.xy / c1.w - gl_Position.xy / gl_Position.w;
    d.x *= uAspect;
    if (dot(d, d) > 1e-12) rot = atan(d.y, d.x);
  }
  vRot = rot;
  vAtlas = aMisc.y;
}
`,nv=`
uniform sampler2D uAtlas;

varying vec4 vColor;
varying float vRot;
varying float vAtlas;

void main() {
  if (vColor.a <= 0.001) discard;
  vec2 p = gl_PointCoord - 0.5;
  p.y = -p.y;
  float c = cos(vRot);
  float s = sin(vRot);
  vec2 uv = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
  uv = clamp(uv, 0.008, 0.992);
  float col = mod(vAtlas, 4.0);
  float row = floor(vAtlas / 4.0);
  vec2 auv = vec2((col + uv.x) * 0.25, 1.0 - (row + 1.0 - uv.y) * 0.25);
  vec4 tex = texture2D(uAtlas, auv);
  float a = tex.a * vColor.a;
  if (a <= 0.003) discard;
  gl_FragColor = vec4(vColor.rgb * tex.rgb, a);
}
`,iv=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,sv=`
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uBoost;
uniform float uHit;
uniform float uFlash;
uniform vec3 uFlashColor;
uniform float uGrain;

varying vec2 vUv;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Thin radial streaks in randomly chosen angular sectors, dashed segments
// racing outward from the centre. Returns 0..1 intensity.
float speedLines(vec2 adir, float r, float t) {
  float a = atan(adir.y, adir.x);
  const float SECTORS = 120.0;
  float sa = (a + 3.14159265) / 6.2831853 * SECTORS;
  float id = floor(sa);
  float fr = fract(sa);
  float rnd = hash11(id * 0.731 + 0.13);
  float rnd2 = hash11(id * 1.317 + 7.7);
  float w = 0.02 + 0.035 * rnd2;
  float line = 1.0 - smoothstep(0.0, w, abs(fr - 0.5));
  float speed = 2.5 + 2.5 * rnd2;
  float seg = fract(r * (2.0 + 2.0 * rnd) - t * speed + rnd * 13.0);
  float dash = smoothstep(0.3, 0.6, seg) * (1.0 - smoothstep(0.7, 1.0, seg));
  float mask = smoothstep(0.42, 0.9, r);
  float on = step(0.55, rnd);
  return line * dash * mask * on;
}

void main() {
  vec2 uv = vUv;
  vec2 dir = uv - 0.5;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 adir = vec2(dir.x * aspect, dir.y);
  float r = length(adir);
  float rn = length(dir) * 1.4142136;

  vec3 col;
  float boost = uBoost;
  // Radial blur + chromatic aberration only kick in past a moderate boost so a
  // light drift turbo doesn't smear the picture.
  float smear = smoothstep(0.25, 1.0, boost);
  if (smear > 0.003) {
    vec2 dn = dir / max(length(dir), 1e-4);
    float ca = smear * 0.0035 * rn * rn;
    float blur = smear * 0.016 * rn * rn;
    col = vec3(0.0);
    for (int i = 0; i < 5; i++) {
      float f = (float(i) / 4.0 - 0.5) * blur;
      vec2 o = uv - dir * f;
      col.r += texture2D(tDiffuse, o - dn * ca).r;
      col.g += texture2D(tDiffuse, o).g;
      col.b += texture2D(tDiffuse, o + dn * ca).b;
    }
    col *= 0.2;
  } else {
    col = texture2D(tDiffuse, uv).rgb;
  }

  // Speed lines: none until the kart is well past cruising speed, thin and
  // low-alpha even at full boost.
  float slAmt = smoothstep(0.6, 1.0, uSpeed) * 0.08 + boost * 0.16;
  if (slAmt > 0.002) {
    float sl = speedLines(adir, r, uTime);
    col += vec3(sl * slAmt) * vec3(0.95, 0.97, 1.05);
  }

  // Light vignette: untouched inside ~55% radius, ~15% darker in the corners.
  float vig = smoothstep(1.25, 0.55, rn * (1.0 + 0.08 * uSpeed));
  col *= mix(1.0, vig, 0.22 + 0.16 * uSpeed);

  if (uHit > 0.001) {
    float pulse = 0.8 + 0.2 * sin(uTime * 28.0);
    float edge = smoothstep(0.35, 1.0, rn);
    float hitMask = clamp(uHit * pulse * (0.2 + edge) * 1.0, 0.0, 0.8);
    col = mix(col, vec3(0.55, 0.02, 0.01), hitMask);
    float lum0 = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum0), uHit * 0.35);
  }

  col = mix(col, uFlashColor * 1.8, clamp(uFlash, 0.0, 1.0));

  // Fine grain (uGrain is a linear-light amplitude; ~1% at rest).
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float gr = hash21(uv * uResolution + fract(uTime * 7.31) * 100.0) - 0.5;
  col += gr * uGrain * (0.4 + 0.6 * (1.0 - clamp(lum, 0.0, 1.0)));

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;var Hf=0,Er=1,cs=2,Ya=3,Wh=4,av=5,lv=6,Ka=7,cv=8,Bf=9,Nf=10,zS=6144,GS=4096,Yi=Math.max(8,16),Eo=14,T={x:0,y:0,z:0,vx:0,vy:0,vz:0,life:1,size0:.3,size1:.1,r0:1,g0:1,b0:1,r1:1,g1:1,b1:1,a0:1,a1:0,rot:0,rotSpeed:0,gravity:0,atlas:0,align:0,drag:0};function q(s,e){return s+Math.random()*(e-s)}function Lf(s){return s<=.04045?s/12.92:Math.pow((s+.055)/1.055,2.4)}var rv=new Map;function jn(s){let e=rv.get(s);return e||(e={r:Lf((s>>16&255)/255),g:Lf((s>>8&255)/255),b:Lf((s&255)/255)},rv.set(s,e)),e}var VS={r:0,g:0,b:0};function Ff(s,e,t){return t=t-Math.floor(t),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*(2/3-t)*6:s}function Gh(s,e,t,n=VS){s=s-Math.floor(s);let i=t<.5?t*(1+e):t+e-t*e,r=2*t-i;return n.r=Ff(r,i,s+1/3),n.g=Ff(r,i,s),n.b=Ff(r,i,s-1/3),n}function as(s,e=1){T.r0=s.r*e,T.g0=s.g*e,T.b0=s.b*e}function ls(s,e=1){T.r1=s.r*e,T.g1=s.g*e,T.b1=s.b*e}function Qn(s,e=0){let t=Math.random()*2-1,n=Math.random()*qe,i=Math.sqrt(Math.max(0,1-t*t));T.vx=i*Math.cos(n)*s,T.vy=t*s+e,T.vz=i*Math.sin(n)*s}function Un(s,e,t,n){T.x=s+q(-n,n),T.y=e+q(-n,n),T.z=t+q(-n,n)}function WS(){let t=document.createElement("canvas");t.width=512,t.height=512;let n=t.getContext("2d");if(!n)throw new Error("ParticleSystem: 2D canvas unavailable");n.clearRect(0,0,512,512);let i=(a,l)=>{let c=a%4*128+64,h=Math.floor(a/4)*128+128/2;n.save(),n.translate(c,h),l(n,128/2),n.restore()},r=(a,l,c=0,h=1)=>{let u=a.createRadialGradient(0,0,0,0,0,l);u.addColorStop(0,"rgba(255,255,255,1)"),u.addColorStop(Math.max(.01,c),`rgba(255,255,255,${h>=1?1:.9})`),u.addColorStop(.55,"rgba(255,255,255,0.45)"),u.addColorStop(.85,"rgba(255,255,255,0.08)"),u.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=u,a.fillRect(-l,-l,l*2,l*2)};i(Hf,(a,l)=>r(a,l*.92,.15)),i(Er,(a,l)=>{a.scale(1,.22),r(a,l*.95,.1)}),i(cs,(a,l)=>{for(let h=0;h<9;h++){let u=h/9*qe+.4,d=h===0?0:l*.28,f=Math.cos(u)*d,g=Math.sin(u)*d,v=l*(h===0?.55:.42),p=a.createRadialGradient(f,g,0,f,g,v);p.addColorStop(0,"rgba(255,255,255,0.55)"),p.addColorStop(.6,"rgba(255,255,255,0.22)"),p.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=p,a.fillRect(-l,-l,l*2,l*2)}}),i(Ya,(a,l)=>{r(a,l*.55,.05),a.globalAlpha=1,a.fillStyle="#fff",a.beginPath();let c=l*.9,h=l*.18;for(let u=0;u<8;u++){let d=u%2===0?c:h,f=u/8*qe-Math.PI/2,g=Math.cos(f)*d,v=Math.sin(f)*d;u===0?a.moveTo(g,v):a.lineTo(g,v)}a.closePath(),a.fill()}),i(Wh,(a,l)=>{let c=l*.72,h=a.createLinearGradient(-c,-c,c,c);h.addColorStop(0,"rgba(255,255,255,1)"),h.addColorStop(1,"rgba(200,200,200,1)"),a.fillStyle=h,a.fillRect(-c,-c*.7,c*2,c*1.4)}),i(av,(a,l)=>{let c=a.createRadialGradient(0,0,0,0,0,l*.95);c.addColorStop(0,"rgba(255,255,255,0)"),c.addColorStop(.62,"rgba(255,255,255,0)"),c.addColorStop(.78,"rgba(255,255,255,1)"),c.addColorStop(.9,"rgba(255,255,255,0.5)"),c.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=c,a.fillRect(-l,-l,l*2,l*2)}),i(lv,(a,l)=>{a.lineCap="round",a.lineJoin="round";let c=[[-l*.05,-l*.95],[l*.25,-l*.45],[-l*.15,-l*.25],[l*.3,l*.15],[-l*.1,l*.3],[l*.12,l*.95]],h=(u,d)=>{a.strokeStyle=`rgba(255,255,255,${d})`,a.lineWidth=u,a.beginPath(),a.moveTo(c[0][0],c[0][1]);for(let f=1;f<c.length;f++)a.lineTo(c[f][0],c[f][1]);a.stroke()};h(l*.55,.12),h(l*.3,.3),h(l*.12,1)}),i(Ka,(a,l)=>{a.fillStyle="#fff",a.beginPath();for(let c=0;c<6;c++){let h=c/6*qe,u=Math.cos(h)*l*.8,d=Math.sin(h)*l*.8;c===0?a.moveTo(u,d):a.lineTo(u,d)}a.closePath(),a.fill()}),i(cv,(a,l)=>{let c=a.createRadialGradient(0,l*.25,0,0,l*.2,l*.75);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.5,"rgba(255,255,255,0.55)"),c.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=c,a.beginPath(),a.moveTo(0,-l*.95),a.bezierCurveTo(l*.75,-l*.1,l*.75,l*.6,0,l*.85),a.bezierCurveTo(-l*.75,l*.6,-l*.75,-l*.1,0,-l*.95),a.closePath(),a.fill()}),i(Bf,(a,l)=>{let c=a.createLinearGradient(-l,0,l,0);c.addColorStop(0,"rgba(255,255,255,0.7)"),c.addColorStop(.5,"rgba(255,255,255,1)"),c.addColorStop(1,"rgba(255,255,255,0.7)"),a.fillStyle=c,a.beginPath(),a.moveTo(-l*.9,0),a.lineTo(-l*.1,-l*.32),a.lineTo(l*.9,0),a.lineTo(-l*.1,l*.32),a.closePath(),a.fill()}),i(Nf,(a,l)=>{let c=a.createRadialGradient(0,0,0,0,0,l*.8);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.75,"rgba(255,255,255,1)"),c.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=c,a.fillRect(-l,-l,l*2,l*2)});let o=new _n(t);return o.colorSpace=_i,o.minFilter=zn,o.magFilter=rn,o.wrapS=Rn,o.wrapT=Rn,o.generateMipmaps=!0,o.needsUpdate=!0,o}var qh=class{constructor(e,t,n,i){E(this,"points");E(this,"material");E(this,"geometry");E(this,"capacity");E(this,"head",0);E(this,"runStart",0);E(this,"runLength",0);E(this,"position");E(this,"velocity");E(this,"time");E(this,"size");E(this,"color0");E(this,"color1");E(this,"alpha");E(this,"rot");E(this,"misc");E(this,"attributes");E(this,"supportsRanges");E(this,"drawSize",new de);this.capacity=e,this.position=new Float32Array(e*3),this.velocity=new Float32Array(e*3),this.time=new Float32Array(e*2),this.size=new Float32Array(e*2),this.color0=new Float32Array(e*3),this.color1=new Float32Array(e*3),this.alpha=new Float32Array(e*2),this.rot=new Float32Array(e*2),this.misc=new Float32Array(e*4);for(let c=0;c<e;c++)this.time[c*2]=-1e6,this.time[c*2+1]=.001;let r=new dt,o=(c,h)=>{let u=new ot(c,h);return u.setUsage(ud),u},a={position:o(this.position,3),aVelocity:o(this.velocity,3),aTime:o(this.time,2),aSize:o(this.size,2),aColor0:o(this.color0,3),aColor1:o(this.color1,3),aAlpha:o(this.alpha,2),aRot:o(this.rot,2),aMisc:o(this.misc,4)};for(let[c,h]of Object.entries(a))r.setAttribute(c,h);this.attributes=Object.values(a),this.supportsRanges=typeof a.position.addUpdateRange=="function",r.boundingSphere=new vi(new C,1e6),this.geometry=r,this.material=new Ct({uniforms:{uTime:{value:0},uGravity:{value:vr},uHeightPx:{value:1080},uAspect:{value:16/9},uAtlas:{value:n}},vertexShader:tv,fragmentShader:nv,transparent:!0,depthWrite:!1,depthTest:!0,blending:t?An:es,fog:!1});let l=new Es(r,this.material);l.frustumCulled=!1,l.renderOrder=i,l.matrixAutoUpdate=!1,l.name=t?"ParticlesAdditive":"ParticlesAlpha",l.onBeforeRender=c=>{c.getDrawingBufferSize(this.drawSize),this.material.uniforms.uHeightPx.value=this.drawSize.y,this.material.uniforms.uAspect.value=this.drawSize.x/Math.max(1,this.drawSize.y)},this.points=l}setTime(e){this.material.uniforms.uTime.value=e}spawn(e,t){let n=this.head,i=n*2,r=n*3,o=n*4;this.position[r]=e.x,this.position[r+1]=e.y,this.position[r+2]=e.z,this.velocity[r]=e.vx,this.velocity[r+1]=e.vy,this.velocity[r+2]=e.vz,this.time[i]=t,this.time[i+1]=Math.max(.01,e.life),this.size[i]=e.size0,this.size[i+1]=e.size1,this.color0[r]=e.r0,this.color0[r+1]=e.g0,this.color0[r+2]=e.b0,this.color1[r]=e.r1,this.color1[r+1]=e.g1,this.color1[r+2]=e.b1,this.alpha[i]=e.a0,this.alpha[i+1]=e.a1,this.rot[i]=e.rot,this.rot[i+1]=e.rotSpeed,this.misc[o]=e.gravity,this.misc[o+1]=e.atlas,this.misc[o+2]=e.align,this.misc[o+3]=e.drag,this.runLength===0&&(this.runStart=n),this.runLength<this.capacity&&this.runLength++,this.head=n+1>=this.capacity?0:n+1}flush(){if(this.runLength===0)return;let e=!this.supportsRanges||this.runLength>=this.capacity;for(let t of this.attributes){if(!e){let n=t.itemSize,i=this.runStart+this.runLength;i<=this.capacity?t.addUpdateRange(this.runStart*n,this.runLength*n):(t.addUpdateRange(this.runStart*n,(this.capacity-this.runStart)*n),t.addUpdateRange(0,(i-this.capacity)*n))}t.needsUpdate=!0}this.runLength=0}clear(){for(let e=0;e<this.capacity;e++)this.time[e*2]=-1e6,this.time[e*2+1]=.001;this.head=0,this.runStart=0,this.runLength=this.capacity}dispose(){this.geometry.dispose(),this.material.dispose()}},qS=0,XS=1,hv=2,uv=3;function YS(s){switch(s){case"mushroom":case"golden":return hv;case"pad":case"start":return uv;default:return XS}}var Vh=[16730955,16765503,4054148,4114175,16735457,9403391,16777215,16751150],KS=[16777215,4114175,16751150,14044671],Xh=class{constructor(){E(this,"object");E(this,"atlas");E(this,"additive");E(this,"alpha");E(this,"time",0);E(this,"karts",[]);E(this,"unsubs",[]);E(this,"accDrift",new Float32Array(Yi));E(this,"accFlame",new Float32Array(Yi));E(this,"accSmoke",new Float32Array(Yi));E(this,"accDust",new Float32Array(Yi));E(this,"accStar",new Float32Array(Yi));E(this,"accStreak",0);E(this,"boostSource",new Uint8Array(Yi));E(this,"confettiTimer",0);E(this,"confettiScale",1);E(this,"accConfetti",0);E(this,"playerPodiumPlace",0);E(this,"camPos",new C);E(this,"camFwd",new C);E(this,"camRight",new C);E(this,"camUp",new C);E(this,"tmp",new C);this.atlas=WS(),this.additive=new qh(zS,!0,this.atlas,20),this.alpha=new qh(GS,!1,this.atlas,19);let e=new Qe;e.name="ParticleSystem",e.matrixAutoUpdate=!1,e.add(this.alpha.points),e.add(this.additive.points),this.object=e,this.subscribe()}subscribe(){let e=this.unsubs;e.push($.on("item:explosion",t=>{this.emit("explosion",t.position,{scale:Math.max(.6,t.radius/4)})})),e.push($.on("item:hit",t=>{this.emit("hitSparks",t.position,{scale:1.1}),t.item==="banana"||t.item==="triple_banana"?this.emit("bananaSplat",t.position):t.item.includes("shell")&&this.emit("shellBreak",t.position,{color:ov(t.item)})})),e.push($.on("item:destroyed",t=>{t.item==="banana"||t.item==="triple_banana"?this.emit("bananaSplat",t.position):t.item==="bob_omb"?this.emit("explosion",t.position,{scale:.7}):this.emit("shellBreak",t.position,{color:ov(t.item)})})),e.push($.on("item:shellBounce",t=>this.emit("hitSparks",t.position,{scale:.55}))),e.push($.on("kart:land",t=>{let n=this.kartById(t.kartId);n&&this.emit("landPuff",n.state.position,{scale:.7+Ye(t.impact)*.8})})),e.push($.on("kart:collision",t=>{let n=.4+Ye(t.impulse/8)*.9;t.otherId===null?this.emit("hitSparks",t.position,{scale:n,color:16769162}):this.emit("hitSparks",t.position,{scale:n*.6,color:16777215})})),e.push($.on("item:pickup",t=>this.emit("itemBoxBurst",t.position))),e.push($.on("race:finish",t=>{if(!t.isPlayer||(this.playerPodiumPlace=t.place<=3?t.place:0,t.place>3))return;let n=this.kartById(t.kartId);n&&(this.tmp.copy(n.state.position),this.tmp.y+=2.5,this.emit("confetti",this.tmp,{scale:t.place===1?1.4:1}),this.emit("lapFlash",n.state.position))})),e.push($.on("game:stateChange",t=>{t.to==="results"&&this.playerPodiumPlace>0?(this.confettiScale=this.playerPodiumPlace===1?1.4:this.playerPodiumPlace===2?1.1:.85,this.confettiTimer=this.playerPodiumPlace===1?6:4,this.accConfetti=0):t.to!=="results"&&t.to!=="finished"&&(this.confettiTimer=0,this.playerPodiumPlace=0)})),e.push($.on("item:lightning",t=>{for(let n of this.karts){let i=n.state;i.id===t.sourceKartId||i.isInvincible||this.emit("lightningStrike",i.position)}})),e.push($.on("kart:boost",t=>{let n=this.slot(t.kartId);this.boostSource[n]=YS(t.source);let i=this.kartById(t.kartId);if(!i)return;let r=t.source==="mushroom"||t.source==="golden"?16751150:t.source==="pad"?4125439:10475775;this.tmp.copy(i.state.position),this.tmp.y+=.4,this.emit("boostRing",this.tmp,{color:r,scale:.6+Ye(t.strength)*.8})})),e.push($.on("kart:shrink",t=>{let n=this.kartById(t.kartId);n&&this.shrinkPuff(n.state.position)})),e.push($.on("kart:unshrink",t=>{let n=this.kartById(t.kartId);n&&this.shrinkPuff(n.state.position)})),e.push($.on("kart:squish",t=>{let n=this.kartById(t.kartId);n&&this.emit("landPuff",n.state.position,{scale:1.3})})),e.push($.on("race:lap",t=>{if(!t.isPlayer)return;let n=this.kartById(t.kartId);n&&(this.tmp.copy(n.state.position),this.tmp.y+=1.2,this.emit("lapFlash",this.tmp,{scale:t.isFinalLap?1.4:1}))}))}slot(e){return e>=0&&e<Yi?e:(e%Yi+Yi)%Yi}kartById(e){let t=this.karts;if(e>=0&&e<t.length&&t[e].state.id===e)return t[e];for(let n=0;n<t.length;n++)if(t[n].state.id===e)return t[n];return null}update(e,t,n){this.karts=t,e=Math.min(Math.max(e,0),.1),this.time+=e;let i=this.time;this.additive.setTime(i),this.alpha.setTime(i);let r=n.matrixWorld.elements;this.camPos.set(r[12],r[13],r[14]),this.camFwd.set(-r[8],-r[9],-r[10]).normalize(),this.camUp.set(r[4],r[5],r[6]).normalize(),this.camRight.set(r[0],r[1],r[2]).normalize();for(let o=0;o<t.length;o++){let a=t[o].state;a.finished&&!a.isBoosting&&!a.isDrifting||(this.updateKartEmitters(e,a,i),a.isPlayer&&a.isBoosting&&a.boostStrength>=.35&&Math.abs(a.speed)>ks*1.12?this.updateSpeedStreaks(e,i):a.isPlayer&&(this.accStreak=0))}this.confettiTimer>0&&this.updateResultsConfetti(e,i),this.additive.flush(),this.alpha.flush()}updateKartEmitters(e,t,n){let i=this.slot(t.id),r=t.position,o=t.heading,a=-Math.sin(o),l=-Math.cos(o),c=Math.cos(o),h=-Math.sin(o),u=Math.abs(t.speed),d=t.isShrunk?.6:1;if(t.isDrifting&&!t.isAirborne){let f=t.driftStage,g=f===0?40:110+f*20,v=this.take(this.accDrift,i,g,e),p=jn(KS[f]);for(let y=0;y<v;y++){let _=y%2===0?1:-1,x=r.x-a*.7+c*.55*_,S=r.z-l*.7+h*.55*_;T.x=x+q(-.06,.06),T.y=r.y+.08+q(0,.06),T.z=S+q(-.06,.06);let M=q(2.5,5.5)+u*.15;T.vx=-a*M+c*_*q(.5,2.5)+q(-.6,.6),T.vy=q(.8,2.8),T.vz=-l*M+h*_*q(.5,2.5)+q(-.6,.6),T.life=f===0?q(.15,.3):q(.25,.45),T.size0=(f===0?.12:.2+f*.03)*d,T.size1=.03,as(p,f===0?1.6:2.2),ls(p,.8),T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=.9,T.atlas=Er,T.align=1,T.drag=1.5,this.additive.spawn(T,n)}let m=this.take(this.accSmoke,i,24,e);for(let y=0;y<m;y++){let _=y%2===0?1:-1;T.x=r.x-a*.75+c*.55*_+q(-.08,.08),T.y=r.y+.12,T.z=r.z-l*.75+h*.55*_+q(-.08,.08),T.vx=-a*q(.8,2)+c*_*q(.2,.9)+q(-.25,.25),T.vy=q(.12,.4),T.vz=-l*q(.8,2)+h*_*q(.2,.9)+q(-.25,.25),T.life=q(.55,.9),T.size0=.3*d,T.size1=.95*d,T.r0=.66,T.g0=.66,T.b0=.68,T.r1=.52,T.g1=.52,T.b1=.54,T.a0=.34,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1.2,1.2),T.gravity=0,T.atlas=cs,T.align=0,T.drag=2.2,this.alpha.spawn(T,n)}}else this.accDrift[i]=0,this.accSmoke[i]=0;if(t.isBoosting){let f=this.take(this.accFlame,i,72,e),g=this.boostSource[i];for(let v=0;v<f;v++){let p=v%2===0?1:-1;T.x=r.x-a*.9+c*.25*p+q(-.025,.025),T.y=r.y+.42*d+q(-.025,.025),T.z=r.z-l*.9+h*.25*p+q(-.025,.025);let m=q(4,7);T.vx=t.velocity.x*.8-a*m+q(-.3,.3),T.vy=q(-.1,.5),T.vz=t.velocity.z*.8-l*m+q(-.3,.3),T.life=q(.09,.18),T.size0=.24*d,T.size1=.05,g===hv?(T.r0=1.5,T.g0=.72,T.b0=.2,T.r1=.9,T.g1=.2,T.b1=.02):g===uv?(T.r0=.45,T.g0=1.2,T.b0=1.5,T.r1=.08,T.g1=.5,T.b1=.9):(T.r0=.7,T.g0=.95,T.b0=1.5,T.r1=.2,T.g1=.4,T.b1=1.1),T.a0=.7,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=-.03,T.atlas=v%3===0?Hf:cv,T.align=1,T.drag=4,this.additive.spawn(T,n)}}else this.accFlame[i]=0;if(t.surface==="offroad"&&u>5&&!t.isAirborne){let f=this.take(this.accDust,i,18+u*1.4,e);for(let g=0;g<f;g++){let v=g%2===0?1:-1;T.x=r.x-a*q(.3,.8)+c*.5*v+q(-.2,.2),T.y=r.y+.1,T.z=r.z-l*q(.3,.8)+h*.5*v+q(-.2,.2),T.vx=-a*q(1,3)+c*v*q(.5,2)+q(-.5,.5),T.vy=q(.8,2.2),T.vz=-l*q(1,3)+h*v*q(.5,2)+q(-.5,.5),T.life=q(.6,1.1),T.size0=.45,T.size1=1.6,T.r0=.55,T.g0=.45,T.b0=.3,T.r1=.45,T.g1=.38,T.b1=.26,T.a0=.42,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1,1),T.gravity=.02,T.atlas=cs,T.align=0,T.drag=2.2,this.alpha.spawn(T,n)}}else this.accDust[i]=0;if(t.isInvincible){let f=this.take(this.accStar,i,70,e);for(let g=0;g<f;g++){let v=q(0,qe),p=q(.5,1.1)*d;T.x=r.x+Math.cos(v)*p,T.y=r.y+q(.1,1.1)*d,T.z=r.z+Math.sin(v)*p,T.vx=Math.cos(v)*q(.3,1.2)+t.velocity.x*.35,T.vy=q(1,2.5),T.vz=Math.sin(v)*q(.3,1.2)+t.velocity.z*.35,T.life=q(.4,.8),T.size0=q(.24,.4),T.size1=.03;let m=Gh(n*.9+g*.13,1,.6);T.r0=m.r*2.2,T.g0=m.g*2.2,T.b0=m.b*2.2,T.r1=1.5,T.g1=1.5,T.b1=1.5,T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-3,3),T.gravity=-.08,T.atlas=Ya,T.align=0,T.drag=1.5,this.additive.spawn(T,n)}}else this.accStar[i]=0}updateSpeedStreaks(e,t){this.accStreak+=38*e;let n=Math.floor(this.accStreak);this.accStreak-=n,n>Eo&&(n=Eo);let i=this.camPos,r=this.camFwd,o=this.camRight,a=this.camUp;for(let l=0;l<n;l++){let c=q(8,16),h=q(0,qe),u=q(3.2,7.5),d=Math.cos(h)*u*1.6,f=Math.sin(h)*u;T.x=i.x+r.x*c+o.x*d+a.x*f,T.y=i.y+r.y*c+o.y*d+a.y*f,T.z=i.z+r.z*c+o.z*d+a.z*f;let g=q(36,52);T.vx=-r.x*g,T.vy=-r.y*g,T.vz=-r.z*g,T.life=q(.14,.22),T.size0=.26,T.size1=.12,T.r0=.85,T.g0=.9,T.b0=1,T.r1=.6,T.g1=.65,T.b1=.8,T.a0=.16,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=0,T.atlas=Er,T.align=1,T.drag=0,this.additive.spawn(T,t)}}updateResultsConfetti(e,t){this.confettiTimer-=e;let n=this.confettiScale;this.accConfetti+=55*n*e;let i=Math.floor(this.accConfetti);this.accConfetti-=i,i>Eo&&(i=Eo);let r=this.camPos,o=this.camFwd,a=this.camRight,l=this.camUp;for(let c=0;c<i;c++){let h=q(4,9),u=q(-1,1)*h*.9,d=q(2.5,4.5);T.x=r.x+o.x*h+a.x*u+l.x*d,T.y=r.y+o.y*h+a.y*u+l.y*d,T.z=r.z+o.z*h+a.z*u+l.z*d,T.vx=q(-.8,.8),T.vy=q(-.6,.2),T.vz=q(-.8,.8),T.life=q(2.2,3.4),T.size0=q(.12,.2),T.size1=T.size0;let f=jn(Vh[c%Vh.length]);as(f,1.1),ls(f,.9),T.a0=1,T.a1=1,T.rot=q(0,qe),T.rotSpeed=q(-6,6),T.gravity=.09,T.atlas=c%5===0?Ka:Wh,T.align=0,T.drag=1.6,this.alpha.spawn(T,t)}}take(e,t,n,i){e[t]+=n*i;let r=Math.floor(e[t]);return e[t]-=r,r>Eo&&(r=Eo),r}emit(e,t,n){let i=this.time,r=n?.scale??1,o=n?.color,a=n?.direction??null,l=t.x,c=t.y,h=t.z;switch(e){case"explosion":this.explosion(l,c,h,r,i);break;case"hitSparks":this.hitSparks(l,c,h,r,o??16765562,a,i);break;case"itemBoxBurst":this.itemBoxBurst(l,c,h,r,i);break;case"confetti":this.confetti(l,c,h,r,i);break;case"dust":this.dust(l,c,h,r,o??13218954,i);break;case"boostRing":this.boostRing(l,c,h,r,o??6743807,i);break;case"starSparkle":this.starSparkle(l,c,h,r,i);break;case"lightningStrike":this.lightningStrike(l,c,h,r,i);break;case"shellBreak":this.shellBreak(l,c,h,r,o??4054148,i);break;case"bananaSplat":this.bananaSplat(l,c,h,r,i);break;case"waterSplash":this.waterSplash(l,c,h,r,i);break;case"lapFlash":this.lapFlash(l,c,h,r,o??16777215,i);break;case"landPuff":this.landPuff(l,c,h,r,i);break;default:break}}ring(e,t,n,i,r,o,a,l,c){T.x=e,T.y=t,T.z=n,T.vx=0,T.vy=0,T.vz=0,T.life=o,T.size0=i,T.size1=r,as(a,l),ls(a,l*.6),T.a0=.9,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=0,T.atlas=av,T.align=0,T.drag=0,this.additive.spawn(T,c)}flashSprite(e,t,n,i,r,o,a,l,c,h){T.x=e,T.y=t,T.z=n,T.vx=0,T.vy=0,T.vz=0,T.life=o,T.size0=i,T.size1=r,T.r0=a,T.g0=l,T.b0=c,T.r1=a*.5,T.g1=l*.5,T.b1=c*.5,T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=0,T.atlas=Hf,T.align=0,T.drag=0,this.additive.spawn(T,h)}explosion(e,t,n,i,r){for(let o=0;o<18;o++)Un(e,t+.3*i,n,.25*i),Qn(q(1.5,4.5)*i,1.2*i),T.life=q(.3,.55),T.size0=q(.9,1.4)*i,T.size1=q(1.6,2.3)*i,T.r0=1.9,T.g0=1.35,T.b0=.5,T.r1=1.1,T.g1=.25,T.b1=.03,T.a0=.8,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-2,2),T.gravity=-.1,T.atlas=cs,T.align=0,T.drag=3,this.additive.spawn(T,r);for(let o=0;o<40;o++)Un(e,t+.3*i,n,.15*i),Qn(q(6,15)*i,2*i),T.life=q(.4,.9),T.size0=.3*i,T.size1=.06*i,T.r0=2.2,T.g0=1.8,T.b0=.9,T.r1=1.5,T.g1=.5,T.b1=.08,T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=1,T.atlas=Er,T.align=1,T.drag=.8,this.additive.spawn(T,r);for(let o=0;o<24;o++)Un(e,t+.4*i,n,.4*i),Qn(q(.6,2.2)*i,q(1.2,3)*i),T.life=q(1.05,1.4),T.size0=q(.9,1.4)*i,T.size1=q(2.4,3.4)*i,T.r0=.3,T.g0=.27,T.b0=.25,T.r1=.1,T.g1=.1,T.b1=.1,T.a0=.62,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1.2,1.2),T.gravity=-.1,T.atlas=cs,T.align=0,T.drag=1.8,this.alpha.spawn(T,r);this.ring(e,t+.35*i,n,1*i,11*i,.5,jn(16761722),1.6,r),this.ring(e,t+.35*i,n,.6*i,7*i,.28,jn(16777215),1.2,r),this.flashSprite(e,t+.5*i,n,2.6*i,5.5*i,.16,1.9,1.7,1.4,r)}hitSparks(e,t,n,i,r,o,a){let l=jn(r),c=Math.round(22*i);for(let h=0;h<c;h++)Un(e,t,n,.1),Qn(q(3.5,8)*i,1.5),o&&(T.vx+=o.x*5*i,T.vy+=o.y*5*i,T.vz+=o.z*5*i),T.life=q(.25,.6),T.size0=.26*i,T.size1=.04,as(l,2.2),ls(l,1.2),T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=1,T.atlas=Er,T.align=1,T.drag=1,this.additive.spawn(T,a);this.flashSprite(e,t,n,.8*i,1.6*i,.14,l.r*2.2,l.g*2.2,l.b*2.2,a)}itemBoxBurst(e,t,n,i,r){for(let o=0;o<36;o++){Un(e,t,n,.25),Qn(q(3,7.5)*i,2.5),T.life=q(.32,.6),T.size0=q(.22,.36)*i,T.size1=.06;let a=Gh(o/36,1,.55);T.r0=a.r*1.8,T.g0=a.g*1.8,T.b0=a.b*1.8,T.r1=a.r,T.g1=a.g,T.b1=a.b,T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-9,9),T.gravity=.9,T.atlas=o%3===0?Wh:Bf,T.align=0,T.drag=1.4,this.additive.spawn(T,r)}for(let o=0;o<8;o++)Un(e,t,n,.4),Qn(q(.5,1.5),.8),T.life=q(.22,.4),T.size0=.32*i,T.size1=.02,T.r0=1.8,T.g0=1.8,T.b0=2,T.r1=1,T.g1=1,T.b1=1.5,T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-3,3),T.gravity=-.1,T.atlas=Ya,T.align=0,T.drag=1,this.additive.spawn(T,r);this.ring(e,t,n,.5*i,4*i,.3,jn(16777215),1.4,r)}confetti(e,t,n,i,r){let o=Math.round(150*i);for(let a=0;a<o;a++){Un(e,t,n,.6*i);let l=q(0,qe),c=q(1,4.5)*i;T.vx=Math.cos(l)*c,T.vz=Math.sin(l)*c,T.vy=q(4,9.5)*i,T.life=q(2.8,4.8),T.size0=q(.14,.22),T.size1=T.size0;let h=jn(Vh[a%Vh.length]);as(h,1.1),ls(h,.9),T.a0=1,T.a1=1,T.rot=q(0,qe),T.rotSpeed=q(-5,5),T.gravity=.16,T.atlas=a%5===0?Ka:Wh,T.align=0,T.drag=1.3,this.alpha.spawn(T,r)}}dust(e,t,n,i,r,o){let a=jn(r),l=Math.round(10*i);for(let c=0;c<l;c++)Un(e,t+.1,n,.2*i),Qn(q(.4,1.6)*i,q(.4,1.2)),T.life=q(.6,1.1),T.size0=.5*i,T.size1=1.7*i,as(a,.8),ls(a,.65),T.a0=.45,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1,1),T.gravity=-.02,T.atlas=cs,T.align=0,T.drag=2,this.alpha.spawn(T,o)}boostRing(e,t,n,i,r,o){let a=jn(r);this.ring(e,t,n,.8*i,3.6*i,.35,a,1.8,o);for(let l=0;l<12;l++){let c=l/12*qe;T.x=e,T.y=t,T.z=n,T.vx=Math.cos(c)*5*i,T.vy=q(.5,1.5),T.vz=Math.sin(c)*5*i,T.life=.35,T.size0=.25*i,T.size1=.04,as(a,2.2),ls(a,1),T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=.2,T.atlas=Er,T.align=1,T.drag=2,this.additive.spawn(T,o)}}starSparkle(e,t,n,i,r){let o=Math.round(14*i);for(let a=0;a<o;a++){Un(e,t,n,.6*i),Qn(q(.8,2.4),1.2),T.life=q(.4,.8),T.size0=q(.2,.34)*i,T.size1=0;let l=Gh(Math.random(),1,.6);T.r0=l.r*2.2,T.g0=l.g*2.2,T.b0=l.b*2.2,T.r1=1.6,T.g1=1.6,T.b1=1.6,T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-3,3),T.gravity=-.1,T.atlas=Ya,T.align=0,T.drag=1.5,this.additive.spawn(T,r)}}lightningStrike(e,t,n,i,r){let a=2.3*i,l=e,c=n;for(let h=0;h<7;h++){let u=t+.8+h*a*.92;T.x=l,T.y=u,T.z=c,T.vx=0,T.vy=0,T.vz=0,T.life=.22+h*.01,T.size0=a*1.1,T.size1=a*.9,T.r0=2.2,T.g0=2.6,T.b0=3.2,T.r1=.8,T.g1=1,T.b1=2.2,T.a0=1,T.a1=0,T.rot=q(-.25,.25),T.rotSpeed=0,T.gravity=0,T.atlas=lv,T.align=0,T.drag=0,this.additive.spawn(T,r),l+=q(-.35,.35),c+=q(-.35,.35)}for(let h=0;h<3;h++)this.flashSprite(e,t+.6+h*.5,n,2.5*i,5*i,.16+h*.03,1.8,2.2,3,r);for(let h=0;h<26;h++)Un(e,t+.4,n,.2),Qn(q(3,8),3),T.life=q(.3,.6),T.size0=.24,T.size1=.03,T.r0=2,T.g0=2.4,T.b0=3.2,T.r1=.6,T.g1=.8,T.b1=2,T.a0=1,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=.9,T.atlas=Er,T.align=1,T.drag=1,this.additive.spawn(T,r);this.ring(e,t+.2,n,.5,5*i,.35,jn(12575999),2,r)}shellBreak(e,t,n,i,r,o){let a=jn(r);for(let l=0;l<18;l++)Un(e,t+.1,n,.15),Qn(q(3,7)*i,3),T.life=q(.4,.7),T.size0=q(.22,.34),T.size1=.12,as(a,1.1),ls(a,.55),T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-10,10),T.gravity=1.1,T.atlas=l%2===0?Bf:Ka,T.align=0,T.drag=.6,this.alpha.spawn(T,o);this.hitSparks(e,t,n,.6*i,16777215,null,o)}bananaSplat(e,t,n,i,r){let o=jn(16769333);for(let a=0;a<14;a++)Un(e,t+.1,n,.12),Qn(q(1,3.2)*i,2.2),T.life=q(.45,.8),T.size0=q(.16,.26),T.size1=q(.25,.4),as(o,1),ls(o,.75),T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-4,4),T.gravity=1.2,T.atlas=a%3===0?Ka:Nf,T.align=0,T.drag=.8,this.alpha.spawn(T,r);this.dust(e,t,n,.6*i,13218954,r)}waterSplash(e,t,n,i,r){for(let o=0;o<30;o++){Un(e,t,n,.2*i);let a=q(0,qe),l=q(.8,2.8)*i;T.vx=Math.cos(a)*l,T.vz=Math.sin(a)*l,T.vy=q(3,7)*i,T.life=q(.5,.9),T.size0=.16*i,T.size1=.05,T.r0=1,T.g0=1.5,T.b0=1.9,T.r1=.6,T.g1=.9,T.b1=1.3,T.a0=.9,T.a1=0,T.rot=0,T.rotSpeed=0,T.gravity=1,T.atlas=Nf,T.align=0,T.drag=.4,this.additive.spawn(T,r)}for(let o=0;o<8;o++)Un(e,t+.2,n,.3*i),Qn(q(.3,1.2),1),T.life=q(.6,1),T.size0=.6*i,T.size1=1.6*i,T.r0=.85,T.g0=.9,T.b0=.95,T.r1=.8,T.g1=.85,T.b1=.9,T.a0=.4,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1,1),T.gravity=-.05,T.atlas=cs,T.align=0,T.drag=2,this.alpha.spawn(T,r)}lapFlash(e,t,n,i,r,o){let a=jn(r);this.ring(e,t,n,.6*i,6.5*i,.45,a,2,o);for(let l=0;l<22;l++){let c=l/22*qe;T.x=e,T.y=t,T.z=n,T.vx=Math.cos(c)*q(3,5)*i,T.vy=q(1.5,4),T.vz=Math.sin(c)*q(3,5)*i,T.life=q(.5,.9),T.size0=.3*i,T.size1=.02;let h=Gh(l/22,1,.6);T.r0=h.r*2.2,T.g0=h.g*2.2,T.b0=h.b*2.2,T.r1=1.5,T.g1=1.5,T.b1=1.5,T.a0=1,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-4,4),T.gravity=.3,T.atlas=Ya,T.align=0,T.drag=1.2,this.additive.spawn(T,o)}}landPuff(e,t,n,i,r){let o=Math.round(10*i);for(let a=0;a<o;a++){let l=q(0,qe);T.x=e+Math.cos(l)*.4,T.y=t+.08,T.z=n+Math.sin(l)*.4;let c=q(1.2,3)*i;T.vx=Math.cos(l)*c,T.vy=q(.3,.9),T.vz=Math.sin(l)*c,T.life=q(.45,.8),T.size0=.4*i,T.size1=1.4*i,T.r0=.6,T.g0=.58,T.b0=.52,T.r1=.5,T.g1=.48,T.b1=.44,T.a0=.45,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-1.5,1.5),T.gravity=0,T.atlas=cs,T.align=0,T.drag=2.5,this.alpha.spawn(T,r)}}shrinkPuff(e){let t=this.time;for(let n=0;n<16;n++)Un(e.x,e.y+.5,e.z,.4),Qn(q(.8,2.2),.8),T.life=q(.5,.9),T.size0=.5,T.size1=1.3,T.r0=.9,T.g0=.9,T.b0=1,T.r1=.7,T.g1=.7,T.b1=.8,T.a0=.5,T.a1=0,T.rot=q(0,qe),T.rotSpeed=q(-2,2),T.gravity=-.05,T.atlas=cs,T.align=0,T.drag=2,this.alpha.spawn(T,t);this.starSparkle(e.x,e.y+.5,e.z,.8,t)}reset(){this.additive.clear(),this.alpha.clear(),this.accDrift.fill(0),this.accFlame.fill(0),this.accSmoke.fill(0),this.accDust.fill(0),this.accStar.fill(0),this.boostSource.fill(qS),this.accStreak=0,this.confettiTimer=0,this.accConfetti=0,this.playerPodiumPlace=0}dispose(){for(let e of this.unsubs)e();this.unsubs.length=0,this.additive.dispose(),this.alpha.dispose(),this.atlas.dispose(),this.object.removeFromParent(),this.karts=[]}};function ov(s){return s.startsWith("red")?16726832:s.startsWith("blue")?3832831:s==="bob_omb"?2236979:4054148}var To={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var ei=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},ZS=new ws(-1,1,1,-1,0,1),Uf=class extends dt{constructor(){super(),this.setAttribute("position",new st([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new st([0,2,0,0,2,0],2))}},$S=new Uf,Ys=class{constructor(e){this._mesh=new xe($S,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ZS)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var Mo=class extends ei{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Ct?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=is.clone(e.uniforms),this.material=new Ct({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Ys(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Za=class extends ei{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let i=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}},Yh=class extends ei{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var Kh=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new de);this._width=n.width,this._height=n.height,t=new on(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:bn}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Mo(To),this.copyPass.material.blending=si,this.timer=new ma}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let i=0,r=this.passes.length;i<r;i++){let o=this.passes[i];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),o.needsSwap){if(n){let a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}Za!==void 0&&(o instanceof Za?n=!0:o instanceof Yh&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new de);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var Zh=class extends ei{constructor(e,t,n=null,i=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new ae}render(e,t,n){let i=e.autoClear;e.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=i}};var dv={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new ae(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var So=class s extends ei{constructor(e,t=1,n,i){super(),this.strength=t,this.radius=n,this.threshold=i,this.resolution=e!==void 0?new de(e.x,e.y):new de(256,256),this.clearColor=new ae(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new on(r,o,{type:bn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){let u=new on(r,o,{type:bn});u.texture.name="UnrealBloomPass.h"+h,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);let d=new on(r,o,{type:bn});d.texture.name="UnrealBloomPass.v"+h,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),r=Math.round(r/2),o=Math.round(o/2)}let a=dv;this.highPassUniforms=is.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Ct({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];let l=[6,10,14,18,22];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new de(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=is.clone(To.uniforms),this.blendMaterial=new Ct({uniforms:this.copyUniforms,vertexShader:To.vertexShader,fragmentShader:To.fragmentShader,premultipliedAlpha:!0,blending:An,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new ae,this._oldClearAlpha=1,this._basic=new Kt,this._fsQuad=new Ys(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),i=Math.round(t/2);this.renderTargetBright.setSize(n,i);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,i),this.renderTargetsVertical[r].setSize(n,i),this.separableBlurMaterials[r].uniforms.invSize.value=new de(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(e,t,n,i,r){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=s.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=s.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),a=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let i=0;i<e;i++)t.push(.39894*Math.exp(-.5*i*i/(n*n))/n);return new Ct({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new de(.5,.5)},direction:{value:new de(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new Ct({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};So.BlurDirectionX=new de(1,0);So.BlurDirectionY=new de(0,1);var $a={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

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

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var $h=class extends ei{constructor(){super(),this.isOutputPass=!0,this.uniforms=is.clone($a.uniforms),this.material=new jr({name:$a.name,uniforms:this.uniforms,vertexShader:$a.vertexShader,fragmentShader:$a.fragmentShader}),this._fsQuad=new Ys(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Mt.getTransfer(this._outputColorSpace)===At&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===va?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===xa?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===ba?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ur?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===_a?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Ea?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===ya&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var JS=.35,jS=.35,QS=.9,ew=.6,fv=.012,tw=.008,Jh=class{constructor(){E(this,"renderer",null);E(this,"scene",null);E(this,"camera",null);E(this,"composer",null);E(this,"renderPass",null);E(this,"bloomPass",null);E(this,"compositePass",null);E(this,"outputPass",null);E(this,"enabled",!0);E(this,"failed",!1);E(this,"speedTarget",0);E(this,"boostTarget",0);E(this,"hitTarget",0);E(this,"speed",0);E(this,"boost",0);E(this,"hit",0);E(this,"hitPulse",0);E(this,"flashLevel",0);E(this,"flashDuration",0);E(this,"flashPeak",0);E(this,"time",0);E(this,"width",1);E(this,"height",1);E(this,"pixelRatio",1);E(this,"flashColor",new ae(1,1,1));E(this,"unsubs",[]);this.unsubs.push($.on("item:lightning",()=>this.flash(13625087,.5))),this.unsubs.push($.on("item:hit",e=>{e.isPlayer&&(this.hitPulse=1)})),this.unsubs.push($.on("kart:spin",e=>{e.kartId===0&&(this.hitPulse=Math.max(this.hitPulse,.8))}))}init(e,t,n){this.disposePipeline(),this.renderer=e,this.scene=t,this.camera=n,this.failed=!1;let i=e.getSize(new de);this.width=Math.max(1,i.x),this.height=Math.max(1,i.y),this.pixelRatio=e.getPixelRatio();try{let r=Math.max(1,Math.floor(this.width*this.pixelRatio)),o=Math.max(1,Math.floor(this.height*this.pixelRatio)),a=new on(r,o,{type:bn,samples:0,depthBuffer:!0,stencilBuffer:!1}),l=new Kh(e,a);l.setPixelRatio(this.pixelRatio),l.setSize(this.width,this.height);let c=new Zh(t,n),h=new So(new de(r,o),JS,jS,QS),u=new Mo({uniforms:{tDiffuse:{value:null},uResolution:{value:new de(r,o)},uTime:{value:0},uSpeed:{value:0},uBoost:{value:0},uHit:{value:0},uFlash:{value:0},uFlashColor:{value:new ae(1,1,1)},uGrain:{value:fv}},vertexShader:iv,fragmentShader:sv}),d=new $h;l.addPass(c),l.addPass(h),l.addPass(u),l.addPass(d),this.composer=l,this.renderPass=c,this.bloomPass=h,this.compositePass=u,this.outputPass=d}catch(r){console.warn("[PostFX] failed to build pipeline, falling back to plain rendering",r),this.failed=!0,this.disposePipeline()}}setCamera(e){this.camera=e,this.renderPass&&(this.renderPass.camera=e)}render(e){let t=this.renderer,n=this.scene,i=this.camera;if(!t||!n||!i)return;if(e=Math.min(Math.max(e,0),.1),this.time+=e,this.speed=pt(this.speed,this.speedTarget,6,e),this.boost=pt(this.boost,this.boostTarget,this.boostTarget>this.boost?10:4,e),this.hitPulse>0&&(this.hitPulse=Math.max(0,this.hitPulse-e/ew)),this.hit=pt(this.hit,Math.max(this.hitTarget,this.hitPulse),12,e),this.flashLevel>0&&this.flashDuration>0?this.flashLevel=Math.max(0,this.flashLevel-e/this.flashDuration):this.flashLevel=0,!this.enabled||this.failed||!this.composer||!this.compositePass){t.render(n,i);return}let r=this.compositePass.uniforms;r.uTime.value=this.time,r.uSpeed.value=this.speed,r.uBoost.value=this.boost,r.uHit.value=this.hit,r.uGrain.value=fv+tw*this.boost;let o=this.flashLevel;r.uFlash.value=this.flashPeak*o*o,r.uFlashColor.value.copy(this.flashColor);try{this.composer.render(e)}catch(a){console.warn("[PostFX] composer render failed, disabling post-processing",a),this.failed=!0,t.render(n,i)}}setSize(e,t,n){this.width=Math.max(1,e),this.height=Math.max(1,t),this.pixelRatio=Math.max(.5,n),this.composer&&(this.composer.setPixelRatio(this.pixelRatio),this.composer.setSize(this.width,this.height)),this.compositePass&&this.compositePass.uniforms.uResolution.value.set(Math.max(1,Math.floor(this.width*this.pixelRatio)),Math.max(1,Math.floor(this.height*this.pixelRatio)))}setSpeedEffect(e){this.speedTarget=Ye(e)}setBoostEffect(e){this.boostTarget=Ye(e)}setHitEffect(e){this.hitTarget=Ye(e)}flash(e,t){this.flashColor.setHex(e),this.flashDuration=Math.max(.05,t),this.flashLevel=1,this.flashPeak=.9}setEnabled(e){this.enabled=e}disposePipeline(){this.bloomPass?.dispose(),this.compositePass?.dispose(),this.outputPass?.dispose(),this.renderPass?.dispose(),this.composer?.dispose(),this.composer=null,this.renderPass=null,this.bloomPass=null,this.compositePass=null,this.outputPass=null}dispose(){for(let e of this.unsubs)e();this.unsubs.length=0,this.disposePipeline(),this.renderer=null,this.scene=null,this.camera=null}};var pv=7,Of=3,mv=.6,nw=1.2,iw=2.6,sw=1.2,rw=-1,ow=1.5,aw=6,lw=.5,cw=.6,hw=.3,uw=12,dw=1.9;function fw(){return{position:new C,tangent:new C(0,0,-1),normal:new C(0,1,0),binormal:new C(1,0,0),halfWidth:0,wallHalfWidth:0,t:0}}var jh=class{constructor(e,t,n){E(this,"track",e);E(this,"karts",t);E(this,"totalLaps");E(this,"difficulty");E(this,"phase","grid");E(this,"time",0);E(this,"countdownTimer",0);E(this,"countdownEmitted",0);E(this,"finishedCount",0);E(this,"playerFinishedAt",-1);E(this,"allFinishedEmitted",!1);E(this,"trackers",[]);E(this,"order",[]);E(this,"checkpointT",[]);E(this,"sample",fw());E(this,"tmpPos",new C);E(this,"tmpQuat",new wt);E(this,"tmpEuler",new Ft);E(this,"playerTracker");this.totalLaps=Math.max(1,Math.floor(n.laps)),this.difficulty=n.difficulty;let i=e.checkpoints;if(i.length>=2)for(let a of i)this.checkpointT.push(Dt(a.t));else for(let a=0;a<lo;a++)this.checkpointT.push(a/lo);let r=Ti(24301+this.totalLaps*7),o=n.difficulty==="hard"?.75:n.difficulty==="normal"?.5:.3;for(let a of t){let l={kart:a,nextCheckpoint:0,started:!1,lapsCompleted:-1,wrongWayTimer:0,voidTimer:0,stuckTimer:0,respawnFreeze:0,emittedPlace:0,candidatePlace:0,candidateTimer:0,throttleStreak:0,aiStartBoost:!a.state.isPlayer&&r()<o,respawnCount:0};this.trackers.push(l),this.order.push(l)}this.playerTracker=this.trackers.find(a=>a.kart.state.isPlayer)??null,this.placeOnGrid(),this.sortOrder();for(let a=0;a<this.order.length;a++){let l=this.order[a];l.kart.state.place=a+1,l.emittedPlace=a+1,l.candidatePlace=a+1}}get raceTime(){return this.time}cancelPlayerInput(){this.playerTracker&&(this.playerTracker.throttleStreak=0)}get countdownElapsed(){return this.countdownTimer}get currentPhase(){return this.phase}get started(){return this.phase==="racing"||this.phase==="complete"}get allFinished(){return this.allFinishedEmitted}startCountdown(){if(this.phase==="grid"){this.phase="countdown",this.countdownTimer=0,this.countdownEmitted=0;for(let e of this.trackers)e.kart.setFrozen(!0)}}update(e){switch(this.phase){case"grid":return;case"countdown":this.updateCountdown(e);return;case"racing":case"complete":this.updateRacing(e);return}}getStandings(){let e=[];for(let t of this.order){let n=t.kart.state;e.push({kartId:n.id,name:n.character.name,color:n.character.color,place:n.place,finishTime:n.finished?n.finishTime:-1,isPlayer:n.isPlayer})}return e.sort((t,n)=>t.place-n.place),e}dispose(){this.trackers.length=0,this.order.length=0}placeOnGrid(){let e=this.track.startGrid;if(e.length===0)return;let t=0;for(let n of this.trackers){let i=n.kart.state,r;i.isPlayer?r=Math.min(pv,e.length-1):(t===Math.min(pv,e.length-1)&&t++,r=t%e.length,t++);let o=e[r];n.kart.resetTo(o.position,o.quaternion),n.kart.setFrozen(!0),i.trackT=Dt(o.t),i.lap=1,i.checkpointIndex=0,i.finished=!1,i.finishTime=0,i.wrongWay=!1,En(0,i.trackT)>=0&&En(0,i.trackT)<.25&&(n.started=!0,n.lapsCompleted=0,n.nextCheckpoint=1,i.checkpointIndex=1),i.raceProgress=this.computeProgress(n)}}updateCountdown(e){if(this.playerTracker){let n=this.playerTracker.kart.input.throttle;this.playerTracker.throttleStreak=n>.5?this.playerTracker.throttleStreak+e:0}this.countdownTimer+=e;let t=Of*Fa;for(;this.countdownEmitted<Of&&this.countdownTimer>=this.countdownEmitted*Fa;)$.emit("race:countdown",{count:Of-this.countdownEmitted}),this.countdownEmitted++;this.countdownTimer>=t&&this.go()}go(){this.phase="racing",this.time=0;for(let t of this.trackers)t.kart.setFrozen(!1),t.stuckTimer=0;$.emit("race:start",{trackId:this.track.def.id});let e=this.playerTracker;if(e){let t=e.throttleStreak;t>=iw?e.kart.applyHit("collision",-1):t>.02&&t<=mv?e.kart.applyBoost(.4,1,"start"):t>mv&&t<=nw&&e.kart.applyBoost(.2,.6,"start")}for(let t of this.trackers)t.aiStartBoost&&t.kart.applyBoost(.3,.8,"start")}updateRacing(e){this.time+=e;for(let t of this.trackers)this.updateTracker(t,e);this.sortOrder(),this.updatePlaces(e),this.phase==="racing"&&this.playerFinishedAt>=0&&!this.allFinishedEmitted&&(this.finishedCount>=this.trackers.length||this.time-this.playerFinishedAt>=uw)&&(this.forceFinishRemaining(),this.phase="complete",this.allFinishedEmitted=!0,$.emit("race:allFinished",{}))}updateTracker(e,t){let n=e.kart,i=n.state;if(e.respawnFreeze>0){e.respawnFreeze-=t,e.respawnFreeze<=0&&(e.respawnFreeze=0,n.setFrozen(!1));return}let r=Dt(i.trackT);if(!i.finished){let l=this.checkpointT.length;for(let c=0;c<2;c++){let h=this.checkpointT[e.nextCheckpoint],u=En(h,r);if(u<0||u>=dw/l||(this.passCheckpoint(e),i.finished))break}}let o=this.computeProgress(e);if(o>i.raceProgress&&(i.raceProgress=o),i.finished)i.wrongWay&&(i.wrongWay=!1,$.emit("race:wrongWay",{kartId:i.id,wrongWay:!1}));else{let l=this.track.sample(r,this.sample),c=i.velocity.x*l.tangent.x+i.velocity.y*l.tangent.y+i.velocity.z*l.tangent.z;c<rw?(e.wrongWayTimer+=t,e.wrongWayTimer>=sw&&!i.wrongWay&&(i.wrongWay=!0,$.emit("race:wrongWay",{kartId:i.id,wrongWay:!0}))):c>.5&&(e.wrongWayTimer=0,i.wrongWay&&(i.wrongWay=!1,$.emit("race:wrongWay",{kartId:i.id,wrongWay:!1})))}let a=!1;if(i.position.y<Jm?a=!0:i.surface==="void"?(e.voidTimer+=t,e.voidTimer>=ow&&(a=!0)):e.voidTimer=0,!a&&!i.finished&&!i.isFrozen){let l=i.isPlayer?n.input.throttle>.3||n.input.brake>.3:!0;Math.abs(i.speed)<lw&&l&&!i.isSpinning&&!i.isSquished?(e.stuckTimer+=t,e.stuckTimer>=aw&&(a=!0)):e.stuckTimer=0}a&&this.respawn(e)}passCheckpoint(e){let t=e.kart.state,n=this.checkpointT.length,i=e.nextCheckpoint;if(e.nextCheckpoint=(i+1)%n,t.checkpointIndex=e.nextCheckpoint,i!==0)return;if(!e.started){e.started=!0,e.lapsCompleted=0;return}e.lapsCompleted++;let r=e.lapsCompleted+1;if(e.lapsCompleted>=this.totalLaps){this.finish(e);return}t.lap=r,$.emit("race:lap",{kartId:t.id,lap:r,totalLaps:this.totalLaps,isPlayer:t.isPlayer,isFinalLap:r===this.totalLaps})}finish(e){let t=e.kart.state;t.finished||(t.finished=!0,t.finishTime=this.time,t.lap=this.totalLaps+1,this.finishedCount++,t.place=this.finishedCount,e.emittedPlace=t.place,e.candidatePlace=t.place,t.wrongWay=!1,t.isPlayer&&this.playerFinishedAt<0&&(this.playerFinishedAt=this.time),$.emit("race:finish",{kartId:t.id,place:t.place,time:t.finishTime,isPlayer:t.isPlayer}))}forceFinishRemaining(){for(let e of this.order)e.kart.state.finished||this.finish(e)}computeProgress(e){let t=e.kart.state,n=this.checkpointT.length,i=(e.nextCheckpoint-1+n)%n,r=this.checkpointT[i],o=r+En(r,Dt(t.trackT));return e.lapsCompleted+o}sortOrder(){let e=this.order;for(let t=1;t<e.length;t++){let n=e[t],i=t-1;for(;i>=0&&this.compare(e[i],n)>0;)e[i+1]=e[i],i--;e[i+1]=n}}compare(e,t){let n=e.kart.state,i=t.kart.state;return n.finished&&i.finished?n.place-i.place:n.finished?-1:i.finished?1:i.raceProgress!==n.raceProgress?i.raceProgress-n.raceProgress:n.id-i.id}updatePlaces(e){for(let t=0;t<this.order.length;t++){let n=this.order[t],i=n.kart.state,r=t+1;i.finished||(i.place=r);let o=i.place;if(o!==n.candidatePlace)n.candidatePlace=o,n.candidateTimer=0;else if(o!==n.emittedPlace&&(n.candidateTimer+=e,n.candidateTimer>=hw||i.finished)){let a=n.emittedPlace;n.emittedPlace=o,$.emit("race:positionChange",{kartId:i.id,from:a,to:o,isPlayer:i.isPlayer})}}}respawn(e){let t=e.kart,n=t.state,i=this.checkpointT.length,r=(e.nextCheckpoint-1+i)%i,o=this.track.checkpoints[r],a;if(o)this.tmpPos.copy(o.position),a=Math.atan2(-o.forward.x,-o.forward.z);else{let l=this.track.sample(this.checkpointT[r],this.sample);this.tmpPos.copy(l.position),a=Math.atan2(-l.tangent.x,-l.tangent.z)}this.tmpPos.y+=.35,this.tmpEuler.set(0,a,0),this.tmpQuat.setFromEuler(this.tmpEuler),t.resetTo(this.tmpPos,this.tmpQuat),n.trackT=this.checkpointT[r],n.wrongWay=!1,e.wrongWayTimer=0,e.voidTimer=0,e.stuckTimer=0,e.respawnCount++,t.setFrozen(!0),e.respawnFreeze=cw,$.emit("kart:respawn",{kartId:n.id,position:this.tmpPos.clone()})}};var pw=5.6,mw=2.25,gw=.8,vw=2.5,Qh=68,xw=80,bw=6,yw=3.4,_w=9,Ew=9,gv=16,Tw=12*Math.PI/180,Mw=.6,Sw=.045,ww=5.5;function Rw(){return{t:0,surface:"road",groundY:0,groundNormal:new C(0,1,0),lateral:0,halfWidth:0,wallHalfWidth:0,tangent:new C(0,0,-1),binormal:new C(1,0,0),center:new C}}var eu=class{constructor(e){E(this,"camera");E(this,"track",null);E(this,"followKartId",-1);E(this,"initialised",!1);E(this,"yaw",0);E(this,"fov",Qh);E(this,"roll",0);E(this,"lookBackBlend",0);E(this,"pos",new C);E(this,"look",new C);E(this,"shakeAmp",0);E(this,"shakePhase",0);E(this,"cine",!1);E(this,"cineTime",0);E(this,"cineDuration",1);E(this,"cineFovFrom",50);E(this,"cineFrom",new C);E(this,"cineLookFrom",new C);E(this,"desired",new C);E(this,"desiredLook",new C);E(this,"forward",new C);E(this,"tmp",new C);E(this,"surf",Rw());E(this,"unsubs",[]);this.camera=e,this.unsubs.push($.on("kart:collision",t=>{t.kartId===this.followKartId&&this.shake(at(t.impulse*.05,.06,.45))}),$.on("item:hit",t=>{t.kartId===this.followKartId&&this.shake(t.item==="lightning"?.35:.65)}),$.on("item:explosion",t=>{let n=this.pos.distanceTo(t.position);n<t.radius*4&&this.shake(at(.5-n/(t.radius*8),.05,.4))}))}setTrack(e){this.track=e}snapTo(e){let t=e.state;this.followKartId=t.id,this.yaw=t.heading,this.fov=Qh,this.roll=0,this.lookBackBlend=0,this.shakeAmp=0,this.computeChase(e,0,this.desired,this.desiredLook),this.pos.copy(this.desired),this.look.copy(this.desiredLook),this.initialised=!0,this.apply()}setCinematic(e,t,n,i=50){this.cine=!0,this.cineTime=0,this.cineDuration=Math.max(.01,n),this.cineFovFrom=i,this.cineFrom.copy(e),this.cineLookFrom.copy(t)}get isCinematic(){return this.cine}shake(e){this.shakeAmp=Math.max(this.shakeAmp,Ye(e))}update(e,t,n){let i=t.state;(!this.initialised||this.followKartId!==i.id)&&this.snapTo(t),this.lookBackBlend=pt(this.lookBackBlend,n?1:0,Ew,e),this.lookBackBlend<.002?this.lookBackBlend=0:this.lookBackBlend>.998&&(this.lookBackBlend=1);let r=this.lookBackBlend,o=i.heading,a=bw;n?(o+=Math.PI,a=_w):i.isDrifting&&i.driftDirection!==0&&(o-=i.driftDirection*Tw,a=yw),i.isSpinning&&(a*=.35);let l=Qm(this.yaw,o);this.yaw=Ha(this.yaw+l*(1-Math.exp(-a*e)));let c=Math.max(1,t.topSpeed()),h=Ye(Math.abs(i.speed)/c);if(this.computeChase(t,h,this.desired,this.desiredLook),this.cine){this.cineTime+=e;let u=Zt(0,1,this.cineTime/this.cineDuration),d=u*u*(3-2*u);this.pos.lerpVectors(this.cineFrom,this.desired,d),this.look.lerpVectors(this.cineLookFrom,this.desiredLook,d),this.fov=rt(this.cineFovFrom,Qh,d),this.roll=0,this.cineTime>=this.cineDuration&&(this.cine=!1,this.yaw=i.heading)}else{let u=1-Math.exp(-gv*e);this.pos.lerp(this.desired,u),this.look.lerp(this.desiredLook,1-Math.exp(-gv*1.4*e));let d=i.isBoosting?Ye(.5+i.boostStrength):0,f=rt(Qh,xw,Ye(h*h*.7+d*.5));this.fov=pt(this.fov,f,4,e);let g=i.steerVisual*(1-2*r),v=i.isDrifting?i.driftDirection*.35*(1-r):0;this.roll=pt(this.roll,-(g+v)*Sw,5,e)}if(this.track){let d=this.track.query(this.pos,i.trackT,this.surf).groundY+Mw;this.pos.y<d&&(this.pos.y=d)}this.shakeAmp>.001&&(this.shakePhase+=e*60,this.shakeAmp=pt(this.shakeAmp,0,ww,e),this.shakeAmp<.001&&(this.shakeAmp=0)),this.apply()}dispose(){for(let e of this.unsubs)e();this.unsubs.length=0,this.track=null}computeChase(e,t,n,i){let r=e.state,o=this.yaw,a=pw+t*.9+(r.isBoosting?.45:0),l=mw+t*.2;n.set(Math.sin(o)*a,l,Math.cos(o)*a).add(r.position);let c=r.heading;this.forward.set(-Math.sin(c),0,-Math.cos(c)),i.copy(r.position).addScaledVector(this.forward,vw*(1-2*this.lookBackBlend)),i.y+=gw}apply(){let e=this.camera;if(e.position.copy(this.pos),this.shakeAmp>0){let t=this.shakeAmp*.35,n=this.shakePhase;this.tmp.set(Math.sin(n*1.3)*t+Math.sin(n*3.7)*t*.5,Math.cos(n*1.7)*t*.8+Math.sin(n*4.3)*t*.4,Math.sin(n*2.1)*t*.3),e.position.add(this.tmp)}e.up.set(0,1,0),e.lookAt(this.look),this.roll!==0&&e.rotateZ(this.roll),Math.abs(e.fov-this.fov)>.01&&(e.fov=this.fov,e.updateProjectionMatrix())}};var tu={title:{distance:5.7,height:1,fov:30,sx:0,sy:-.3},characters:{distance:5.3,height:.95,fov:30,sx:.58,sy:-.08},tracks:{distance:5.9,height:.85,fov:30,sx:0,sy:.42}},Tr=1.55,wo=.32,Aw=.42,Cw=.11,Iw=.22,Ja=3.2,zf=1708342,Gf=420,Pw=7,vv=4.5,kw=`
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,Dw=`
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uGlow;
uniform float uTime;
varying vec3 vWorldPos;
void main() {
  vec3 d = normalize(vWorldPos);
  float h = d.y;
  // Above the horizon: horizon colour \u2192 zenith. Below: stay at the horizon colour so the
  // fogged floor (same colour) meets it without a seam.
  vec3 c = h > 0.0 ? mix(uMid, uTop, pow(h, 0.5)) : uMid;
  // Soft glow hugging the horizon, slowly breathing.
  float glow = exp(-abs(h) * 6.0) * (0.55 + 0.1 * sin(uTime * 0.35 + d.x * 2.0));
  c += uGlow * glow;
  // Faint aurora band.
  float band = exp(-pow((h - 0.22 + 0.03 * sin(uTime * 0.25 + d.x * 3.0)) * 10.0, 2.0));
  c += vec3(0.05, 0.03, 0.14) * band * (0.6 + 0.4 * sin(uTime * 0.4 + d.z * 4.0));
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,Lw=`
attribute float aSeed;
uniform float uTime;
uniform float uHeight;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * (0.08 + 0.06 * aSeed);
  p.y = mod(p.y + t, uHeight);
  p.x += sin(uTime * 0.3 + aSeed * 12.0) * 0.25;
  p.z += cos(uTime * 0.27 + aSeed * 9.0) * 0.25;
  // Fade in near the floor and out near the top.
  float fade = smoothstep(0.0, 0.5, p.y) * (1.0 - smoothstep(uHeight - 1.2, uHeight, p.y));
  vAlpha = fade * (0.35 + 0.65 * fract(aSeed * 7.31));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (2.0 + 4.0 * fract(aSeed * 3.17)) * (220.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}`,Fw=`
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv) * 2.0;
  float a = smoothstep(1.0, 0.2, d) * vAlpha * 0.55;
  gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * a, a);
}`,nu=class{constructor(){E(this,"group",new Qe);E(this,"kart",null);E(this,"currentId",null);E(this,"kartHolder",new Qe);E(this,"skyMaterial");E(this,"dustMaterial");E(this,"rings",[]);E(this,"disposables",[]);E(this,"fog",new ir(zf,.03));E(this,"background",new ae(zf));E(this,"envTexture",null);E(this,"framing","title");E(this,"cur",{...tu.title});E(this,"angle",.7);E(this,"time",0);E(this,"origin",new C);E(this,"identity",new wt);E(this,"focus",new C);E(this,"camPos",new C);E(this,"dir",new C);E(this,"right",new C);E(this,"upv",new C);E(this,"target",new C);E(this,"worldUp",new C(0,1,0));this.group.name="MenuBackdrop";let e=new ft(220,32,16);this.skyMaterial=new Ct({vertexShader:kw,fragmentShader:Dw,side:fn,depthWrite:!1,fog:!1,uniforms:{uTop:{value:new ae(328719)},uMid:{value:new ae(zf)},uGlow:{value:new ae(2757968)},uTime:{value:0}}});let t=new xe(e,this.skyMaterial);t.frustumCulled=!1,this.group.add(t),this.disposables.push(e,this.skyMaterial);let n=420,i=new Float32Array(n*3);for(let P=0;P<n;P++){let k=Math.random()*Math.PI*2,L=Math.acos(1-Math.random()*.75),H=190;i[P*3]=H*Math.sin(L)*Math.cos(k),i[P*3+1]=H*Math.cos(L)+12,i[P*3+2]=H*Math.sin(L)*Math.sin(k)}let r=new dt;r.setAttribute("position",new ot(i,3));let o=new Xr({color:14673663,size:1.4,sizeAttenuation:!1,transparent:!0,opacity:.6,depthWrite:!1,fog:!1}),a=new Es(r,o);a.frustumCulled=!1,this.group.add(a),this.disposables.push(r,o);let l=new Bi(140,72),c=this.makeGridTexture(),h=new He({color:16777215,roughness:.3,metalness:.75,map:c,envMapIntensity:1.2}),u=new xe(l,h);u.rotation.x=-Math.PI/2,u.position.y=-.005,u.receiveShadow=!0,this.group.add(u),this.disposables.push(l,h,c);let d=new He({color:1381420,metalness:.8,roughness:.22,envMapIntensity:1.4}),f=new We(Tr,Tr+.12,wo,72),g=new xe(f,d);g.position.y=wo/2,g.castShadow=!0,g.receiveShadow=!0,this.group.add(g),this.disposables.push(f,d);let v=new We(Tr+.75,Tr+.85,.1,72),p=new xe(v,d);p.position.y=.05,p.receiveShadow=!0,this.group.add(p),this.disposables.push(v),this.addRing(Tr+.03,wo+.01,.016,new ae(.45,1.05,1.45),1,0,.95),this.addRing(Tr+.86,.105,.014,new ae(1.3,.4,1),3,.22,.85),this.addRing(Tr+1.9,.012,.012,new ae(.35,.65,1.3),2,-.14,.6);let m=new Float32Array(Gf*3),y=new Float32Array(Gf);for(let P=0;P<Gf;P++){let k=Math.sqrt(Math.random())*Pw,L=Math.random()*Math.PI*2;m[P*3]=Math.cos(L)*k,m[P*3+1]=Math.random()*vv,m[P*3+2]=Math.sin(L)*k,y[P]=Math.random()}let _=new dt;_.setAttribute("position",new ot(m,3)),_.setAttribute("aSeed",new ot(y,1)),this.dustMaterial=new Ct({vertexShader:Lw,fragmentShader:Fw,uniforms:{uTime:{value:0},uHeight:{value:vv}},transparent:!0,depthWrite:!1,blending:An,fog:!1});let x=new Es(_,this.dustMaterial);x.frustumCulled=!1,this.group.add(x),this.disposables.push(_,this.dustMaterial);let S=new Rs(16773340,2.6);S.position.set(3.2,6.5,4.2),S.castShadow=!0,S.shadow.mapSize.set(1024,1024),S.shadow.camera.left=-3.5,S.shadow.camera.right=3.5,S.shadow.camera.top=3.5,S.shadow.camera.bottom=-3.5,S.shadow.camera.near=.5,S.shadow.camera.far=20,S.shadow.bias=-4e-4,S.shadow.normalBias=.02,this.group.add(S,S.target);let M=new pa(16777215,60,0,.55,.7,2);M.position.set(0,6.5,.5),M.target.position.set(0,wo,0),this.group.add(M,M.target);let w=new hr(4016296,722710,.55);this.group.add(w);let b=new Qr(3647743,38,22,2);b.position.set(-4.2,1.9,-3.2);let R=new Qr(16726712,38,22,2);R.position.set(4.2,1.5,-3.2),this.group.add(b,R),this.kartHolder.position.y=wo,this.group.add(this.kartHolder),this.focus.set(0,wo+Aw,0)}setCharacter(e){if(e.id!==this.currentId){this.currentId=e.id,this.disposeKart();try{let t=new Fs(0,e,!0);t.setFrozen(!0),t.resetTo(this.origin,this.identity),t.object.traverse(n=>{let i=n;i.isMesh&&(i.castShadow=!0,i.receiveShadow=!0)}),this.kartHolder.add(t.object),this.kart=t}catch(t){console.error("[MenuBackdrop] failed to build kart",t),this.kart=null}}}setFraming(e,t=!1){this.framing=e,t&&Object.assign(this.cur,tu[e])}attach(e,t,n){e.add(this.group),e.fog=this.fog,e.background=this.background,n&&!this.envTexture&&this.buildEnvironment(n),e.environment=this.envTexture,Object.assign(this.cur,tu[this.framing]),t.fov=this.cur.fov,t.updateProjectionMatrix(),this.update(0,t)}detach(e){e.remove(this.group),e.fog===this.fog&&(e.fog=null),e.environment===this.envTexture&&(e.environment=null)}update(e,t){this.time+=e,this.angle+=e*Cw,this.kartHolder.rotation.y+=e*Iw,this.skyMaterial.uniforms.uTime.value=this.time,this.dustMaterial.uniforms.uTime.value=this.time;let n=.9+.1*Math.sin(this.time*1.7);for(let u=0;u<this.rings.length;u++){let d=this.rings[u];d.mesh.rotation.z+=e*d.speed,d.material.opacity=d.baseOpacity*n}this.kart&&(this.kart.updateVisuals(e),this.kart.object.position.copy(this.origin));let i=tu[this.framing],r=this.cur;r.distance=pt(r.distance,i.distance,Ja,e),r.height=pt(r.height,i.height,Ja,e),r.fov=pt(r.fov,i.fov,Ja,e),r.sx=pt(r.sx,i.sx,Ja,e),r.sy=pt(r.sy,i.sy,Ja,e);let o=Math.sin(this.time*.45)*.1,a=this.focus;this.camPos.set(Math.sin(this.angle)*r.distance,a.y+r.height+o,Math.cos(this.angle)*r.distance),this.dir.subVectors(a,this.camPos);let l=this.dir.length();this.dir.multiplyScalar(1/Math.max(1e-6,l)),this.right.crossVectors(this.dir,this.worldUp).normalize(),this.upv.crossVectors(this.right,this.dir);let c=l*Math.tan(r.fov*Math.PI/360),h=c*Math.max(.1,t.aspect);this.target.copy(a).addScaledVector(this.right,-r.sx*h).addScaledVector(this.upv,-r.sy*c),t.position.copy(this.camPos),t.up.set(0,1,0),t.lookAt(this.target),Math.abs(t.fov-r.fov)>.01&&(t.fov=r.fov,t.updateProjectionMatrix())}dispose(){this.disposeKart();for(let e of this.disposables)e.dispose();this.disposables.length=0,this.rings.length=0,this.envTexture&&(this.envTexture.dispose(),this.envTexture=null),this.group.clear()}disposeKart(){if(this.kart){this.kartHolder.remove(this.kart.object);try{this.kart.dispose()}catch(e){console.warn("[MenuBackdrop] kart dispose failed",e)}this.kart=null}}addRing(e,t,n,i,r,o,a){let l=new Kt({color:i,toneMapped:!1,transparent:!0,opacity:a,fog:!1}),c=new Qe;c.rotation.x=Math.PI/2,c.position.y=t;let h=r===1?Math.PI*2:Math.PI*2*.62/r;for(let u=0;u<r;u++){let d=new hn(e,n,8,Math.max(24,Math.round(96*(h/(Math.PI*2)))),h),f=new xe(d,l);f.rotation.z=u/r*Math.PI*2,f.layers.enable(jm),c.add(f),this.disposables.push(d)}this.disposables.push(l),this.group.add(c),this.rings.push({mesh:c,material:l,speed:o,baseOpacity:a})}buildEnvironment(e){let t=null;try{t=new oo(e);let n=new sr,i=this.skyMaterial.clone();i.uniforms.uTime={value:0};let r=new xe(new ft(100,24,12),i);n.add(r);let o=f=>new Kt({color:f,side:bt,fog:!1}),a=new Ut(12,5),l=new xe(a,o(10148095));l.position.set(-6,9,4),l.lookAt(0,0,0);let c=new xe(a,o(16748504));c.position.set(7,7,-3),c.lookAt(0,0,0);let h=new xe(a,o(16777215));h.position.set(0,12,0),h.lookAt(0,0,0),n.add(l,c,h);let u=new xe(new Bi(80,24),new Kt({color:526106,fog:!1}));u.rotation.x=-Math.PI/2,n.add(u);let d=t.fromScene(n,.04,.5,300);this.envTexture=d.texture,r.geometry.dispose(),i.dispose(),a.dispose(),l.material.dispose(),c.material.dispose(),h.material.dispose(),u.geometry.dispose(),u.material.dispose()}catch(n){console.warn("[MenuBackdrop] environment map failed",n),this.envTexture=null}finally{t?.dispose()}}makeGridTexture(){let t=document.createElement("canvas");t.width=256,t.height=256;let n=t.getContext("2d");n&&(n.fillStyle="#0b0a19",n.fillRect(0,0,256,256),n.strokeStyle="rgba(90, 100, 220, 0.55)",n.lineWidth=2,n.beginPath(),n.moveTo(0,1),n.lineTo(256,1),n.moveTo(1,0),n.lineTo(1,256),n.stroke());let i=new _n(t);return i.wrapS=Kn,i.wrapT=Kn,i.repeat.set(70,70),i.anisotropy=4,i.colorSpace=Nt,i}};function xv(s){if(!s.getExtension("EXT_color_buffer_float")&&!s.getExtension("EXT_color_buffer_half_float"))return!1;let e=s.getExtension("WEBGL_debug_renderer_info"),t=s.getParameter(e?e.UNMASKED_RENDERER_WEBGL:s.RENDERER);return!/swiftshader|llvmpipe|lavapipe|softpipe|microsoft basic render|software rasterizer/i.test(String(t))}function bv(s,e,t,n){return s?Math.min(e,2):Math.min(e,1,960/t,540/n)}function Q(s,e="",t,n){let i=document.createElement(s);return e&&(i.className=e),t!==void 0&&(i.textContent=t),n&&n.appendChild(i),i}function tn(s){return"#"+(s>>>0&16777215).toString(16).padStart(6,"0")}function Vf(s,e){let t=s>>16&255,n=s>>8&255,i=s&255;return`rgba(${t},${n},${i},${e})`}function iu(s,e){s.classList.remove(e),s.offsetWidth,s.classList.add(e)}var an=class{constructor(e){E(this,"node",e);E(this,"value","")}set(e){return e===this.value?!1:(this.value=e,this.node.textContent=e,!0)}get(){return this.value}};function ti(s,e,t){let n=Q("button",`btn ${e}`.trim(),s);return n.type="button",n.addEventListener("click",i=>{i.stopPropagation(),t()}),n}var Ro=class{constructor(e){E(this,"onActivate",e);E(this,"index",0);E(this,"items",[])}add(e){let t=this.items.length;this.items.push(e),e.addEventListener("pointerenter",()=>this.set(t)),t===0&&e.classList.add("focused")}clear(){this.items.length=0,this.index=0}get current(){return this.index}set(e){let t=this.items.length;if(t===0)return!1;let n=(e%t+t)%t;if(n===this.index&&this.items[n].classList.contains("focused"))return!1;for(let i=0;i<t;i++)this.items[i].classList.toggle("focused",i===n);return this.index=n,!0}move(e){return this.set(this.index+e)}activate(){this.items.length!==0&&this.onActivate(this.index)}};var su=14,yv=1/30,ru=class{constructor(e){E(this,"canvas");E(this,"ctx");E(this,"layer");E(this,"track",null);E(this,"timer",0);E(this,"dpr");this.dpr=Math.min(window.devicePixelRatio||1,2),this.canvas=Q("canvas","minimap-canvas",void 0,e),this.canvas.width=xr*this.dpr,this.canvas.height=xr*this.dpr,this.canvas.style.width=`${xr}px`,this.canvas.style.height=`${xr}px`,this.ctx=this.canvas.getContext("2d"),this.layer=document.createElement("canvas"),this.layer.width=this.canvas.width,this.layer.height=this.canvas.height}setTrack(e){this.track=e,this.renderStaticLayer(),this.timer=yv}update(e,t,n){if(this.timer+=e,this.timer<yv)return;this.timer=0;let i=this.ctx;if(!i)return;let r=xr*this.dpr;i.clearRect(0,0,r,r),i.drawImage(this.layer,0,0);let o=this.track;if(!o)return;let a=r-su*2*this.dpr,l=su*this.dpr;for(let c=0;c<2;c++)for(let h=0;h<t.length;h++){let u=t[h],d=u.state.id===n;if(c===0===d)continue;let f=o.minimap.worldToMap(u.state.position.x,u.state.position.z),g=l+f.x*a,v=l+f.y*a,p=(d?6.5:4.5)*this.dpr;i.beginPath(),i.arc(g,v,p,0,Math.PI*2),i.fillStyle=tn(u.state.character.color),i.fill(),i.lineWidth=(d?2.5:1.2)*this.dpr,i.strokeStyle=d?"#ffffff":"rgba(0,0,0,0.6)",i.stroke(),d&&(i.beginPath(),i.arc(g,v,p+4*this.dpr,0,Math.PI*2),i.lineWidth=1.5*this.dpr,i.strokeStyle="rgba(255,255,255,0.45)",i.stroke())}}dispose(){this.canvas.remove(),this.track=null}renderStaticLayer(){let e=this.layer.getContext("2d");if(!e)return;let t=xr*this.dpr;e.clearRect(0,0,t,t);let n=this.track;if(!n)return;let i=n.minimap,r=t-su*2*this.dpr,o=su*this.dpr,a=d=>o+d*r,l=d=>o+d*r,c=(d,f)=>{if(d.length!==0){e.beginPath(),e.moveTo(a(d[0].x),l(d[0].y));for(let g=1;g<d.length;g++)e.lineTo(a(d[g].x),l(d[g].y));f&&e.closePath()}},h=i.leftEdge,u=i.rightEdge;if(e.lineJoin="round",e.lineCap="round",h.length>1&&u.length>1){e.beginPath(),e.moveTo(a(h[0].x),l(h[0].y));for(let d=1;d<h.length;d++)e.lineTo(a(h[d].x),l(h[d].y));for(let d=u.length-1;d>=0;d--)e.lineTo(a(u[d].x),l(u[d].y));e.closePath(),e.fillStyle="rgba(20, 22, 40, 0.85)",e.fill(),e.lineWidth=1.5*this.dpr,e.strokeStyle="rgba(255,255,255,0.75)",e.stroke()}else i.points.length>1&&(c(i.points,!0),e.lineWidth=9*this.dpr,e.strokeStyle="rgba(20, 22, 40, 0.9)",e.stroke(),e.lineWidth=11*this.dpr,e.strokeStyle="rgba(255,255,255,0.6)",e.globalCompositeOperation="destination-over",e.stroke(),e.globalCompositeOperation="source-over");if(i.points.length>1){c(i.points,!0),e.setLineDash([3*this.dpr,5*this.dpr]),e.lineWidth=1*this.dpr,e.strokeStyle="rgba(255,255,255,0.28)",e.stroke(),e.setLineDash([]);let d=i.points[0],f=i.points[1],g=f.x-d.x,v=f.y-d.y,p=Math.hypot(g,v)||1,m=-v/p,y=g/p,_=7*this.dpr,x=a(d.x),S=l(d.y);e.beginPath(),e.moveTo(x-m*_,S-y*_),e.lineTo(x+m*_,S+y*_),e.lineWidth=3*this.dpr,e.strokeStyle="#ffffff",e.stroke(),e.beginPath(),e.moveTo(x-m*_,S-y*_),e.lineTo(x+m*_,S+y*_),e.setLineDash([2*this.dpr,2*this.dpr]),e.lineWidth=3*this.dpr,e.strokeStyle="#111111",e.stroke(),e.setLineDash([])}}};var Hw={none:"",banana:"BANANA",triple_banana:"BANANA \xD73",green_shell:"GREEN SHELL",triple_green_shell:"GREEN \xD73",red_shell:"RED SHELL",triple_red_shell:"RED \xD73",blue_shell:"BLUE SHELL",mushroom:"MUSHROOM",triple_mushroom:"MUSHROOM \xD73",golden_mushroom:"GOLDEN",star:"STAR",lightning:"LIGHTNING",bob_omb:"BOB-OMB"},Bw={none:"#333",banana:"#ffd23f",triple_banana:"#ffd23f",green_shell:"#3ddc5a",triple_green_shell:"#3ddc5a",red_shell:"#ff4040",triple_red_shell:"#ff4040",blue_shell:"#3f7fff",mushroom:"#ff5a3a",triple_mushroom:"#ff5a3a",golden_mushroom:"#ffc800",star:"#ffe14a",lightning:"#ffef70",bob_omb:"#333344"},_v=184.3,Nw=.09,Uw=ks*3.6*1.7,ou=class{constructor(e,t){E(this,"buildIcon",t);E(this,"rootNode");E(this,"minimap");E(this,"unsubs",[]);E(this,"visible",!1);E(this,"playerId",0);E(this,"itemFrame");E(this,"itemIconHost");E(this,"itemCount");E(this,"itemLabel");E(this,"iconCache",new Map);E(this,"shownIcon","none");E(this,"shownCount",0);E(this,"rouletteTimer",0);E(this,"rouletteVisual",!1);E(this,"placeNode");E(this,"placeNum");E(this,"placeSuffix");E(this,"lastPlace",0);E(this,"lapText");E(this,"timerText");E(this,"speedText");E(this,"gaugeFill");E(this,"gaugeValue",-1);E(this,"speedSmooth",0);E(this,"center");E(this,"wrongWay");E(this,"wrongWayShown",!1);E(this,"vignette");E(this,"vignetteAlpha",0);E(this,"vignetteApplied",-1);E(this,"timed",[]);E(this,"boostGlow");E(this,"boostGlowApplied",-1);this.rootNode=Q("div","hud hidden",void 0,e);let n=Q("div","hud-item",void 0,this.rootNode);this.itemFrame=Q("div","item-frame",void 0,n),this.itemIconHost=Q("div","item-icon",void 0,this.itemFrame),this.itemCount=new an(Q("div","item-count","",this.itemFrame)),this.itemLabel=new an(Q("div","item-label","",n));let i=Q("div","hud-topright",void 0,this.rootNode),r=Q("div","hud-lap glass",void 0,i);Q("span","hud-lap-label","LAP",r),this.lapText=new an(Q("span","hud-lap-value","",r)),this.timerText=new an(Q("div","hud-timer glass","0:00.000",i)),this.placeNode=Q("div","hud-place",void 0,this.rootNode),this.placeNum=new an(Q("span","place-num","",this.placeNode)),this.placeSuffix=new an(Q("span","place-suffix","",this.placeNode));let o=Q("div","hud-speed",void 0,this.rootNode),a="http://www.w3.org/2000/svg",l=document.createElementNS(a,"svg");l.setAttribute("viewBox","0 0 100 100"),l.classList.add("gauge");let c=document.createElementNS(a,"circle");c.setAttribute("cx","50"),c.setAttribute("cy","50"),c.setAttribute("r","44"),c.classList.add("gauge-bg"),c.setAttribute("stroke-dasharray",`${_v} 276.5`),l.appendChild(c),this.gaugeFill=document.createElementNS(a,"circle"),this.gaugeFill.setAttribute("cx","50"),this.gaugeFill.setAttribute("cy","50"),this.gaugeFill.setAttribute("r","44"),this.gaugeFill.classList.add("gauge-fill"),this.gaugeFill.setAttribute("stroke-dasharray","0 276.5"),l.appendChild(this.gaugeFill),o.appendChild(l);let h=Q("div","speed-inner",void 0,o);this.speedText=new an(Q("div","speed-value","0",h)),Q("div","speed-unit","km/h",h);let u=Q("div","hud-minimap glass",void 0,this.rootNode);this.minimap=new ru(u),this.center=Q("div","hud-center",void 0,this.rootNode),this.wrongWay=Q("div","hud-wrongway",void 0,this.rootNode),Q("span","wrongway-arrow","\u27F2",this.wrongWay),Q("span","wrongway-text","WRONG WAY",this.wrongWay),this.vignette=Q("div","hud-vignette",void 0,this.rootNode),this.boostGlow=Q("div","hud-boostglow",void 0,this.rootNode),this.subscribe()}setTrack(e){this.minimap.setTrack(e)}show(){this.rootNode.classList.remove("hidden"),this.visible=!0}hide(){this.rootNode.classList.add("hidden"),this.visible=!1}update(e,t,n,i,r){if(!this.visible)return;let o=t.state;this.playerId=o.id;let a=o.place>0?o.place:n.length;if(a!==this.lastPlace){this.lastPlace=a;let d=br(a);this.placeNum.set(String(a)),this.placeSuffix.set(d.slice(String(a).length)),this.placeNode.classList.toggle("gold",a===1),this.placeNode.classList.toggle("silver",a===2),this.placeNode.classList.toggle("bronze",a===3),iu(this.placeNode,"punch")}let l=Math.min(Math.max(1,o.lap),r);this.lapText.set(`${l}/${r}`),this.timerText.set(lh(i));let c=Math.abs(o.speed)*3.6;this.speedSmooth=pt(this.speedSmooth,c,12,e),this.speedText.set(String(Math.round(this.speedSmooth)));let h=Ye(this.speedSmooth/Uw);Math.abs(h-this.gaugeValue)>.004&&(this.gaugeValue=h,this.gaugeFill.setAttribute("stroke-dasharray",`${(h*_v).toFixed(1)} 276.5`));let u=o.isBoosting?1:0;u!==this.boostGlowApplied&&(this.boostGlowApplied=u,this.boostGlow.classList.toggle("on",u===1),this.rootNode.classList.toggle("boosting",u===1)),this.updateItemSlot(e,o.item,o.itemCount,o.itemRouletteActive),o.wrongWay!==this.wrongWayShown&&(this.wrongWayShown=o.wrongWay,this.wrongWay.classList.toggle("visible",o.wrongWay)),this.vignetteAlpha>.001&&(this.vignetteAlpha=pt(this.vignetteAlpha,0,3.5,e),this.vignetteAlpha<.001&&(this.vignetteAlpha=0)),Math.abs(this.vignetteAlpha-this.vignetteApplied)>.01&&(this.vignetteApplied=this.vignetteAlpha,this.vignette.style.opacity=this.vignetteAlpha.toFixed(2));for(let d=this.timed.length-1;d>=0;d--){let f=this.timed[d];f.ttl-=e,f.ttl<=0&&(f.node.remove(),this.timed.splice(d,1))}this.minimap.update(e,n,o.id)}dispose(){for(let e of this.unsubs)e();this.unsubs.length=0,this.minimap.dispose(),this.rootNode.remove()}subscribe(){let e=$.on.bind($);this.unsubs.push(e("item:rouletteTick",t=>{!t.isPlayer&&t.kartId!==this.playerId||(this.rouletteVisual=!0,this.rouletteTimer=0,this.setIcon(this.randomItem(),!1),this.itemFrame.classList.add("spinning"))}),e("item:rouletteEnd",t=>{!t.isPlayer&&t.kartId!==this.playerId||(this.rouletteVisual=!1,this.itemFrame.classList.remove("spinning"),this.setIcon(t.item,!0))}),e("race:countdown",t=>{this.flashCenter(String(t.count),"hud-count",.95)}),e("race:start",()=>{this.flashCenter("GO!","hud-count hud-go",1.1)}),e("race:lap",t=>{t.isPlayer&&(t.isFinalLap?this.flashCenter("FINAL LAP!","hud-banner final",2.4):t.lap>1&&this.flashCenter(`LAP ${t.lap}`,"hud-banner lap",1.4))}),e("race:positionChange",t=>{if(!t.isPlayer)return;let n=t.to<t.from;this.flashCenter(`${n?"\u25B2":"\u25BC"} ${br(t.to).toUpperCase()}`,`hud-posflash ${n?"up":"down"}`,1)}),e("item:hit",t=>{t.isPlayer&&(this.vignetteAlpha=1,iu(this.rootNode,"hit-shake"))}),e("race:finish",t=>{if(!t.isPlayer)return;let n=this.flashCenter("FINISH","hud-finish",4.5);Q("div","hud-finish-place",br(t.place).toUpperCase()+" PLACE",n)}),e("kart:respawn",t=>{t.kartId===this.playerId&&(this.vignetteAlpha=Math.max(this.vignetteAlpha,.6))}))}randomItem(){return Od[Math.floor(Math.random()*Od.length)]}updateItemSlot(e,t,n,i){if(i){this.rouletteTimer+=e,this.rouletteTimer>=Nw&&(this.rouletteTimer=0,this.rouletteVisual=!0,this.setIcon(this.randomItem(),!1),this.itemFrame.classList.add("spinning")),this.shownCount!==0&&(this.shownCount=0,this.itemCount.set(""));return}this.rouletteVisual?(this.rouletteVisual=!1,this.itemFrame.classList.remove("spinning"),this.setIcon(t,!0)):t!==this.shownIcon&&this.setIcon(t,t!=="none");let r=t==="none"||n<=1?0:n;r!==this.shownCount&&(this.shownCount=r,this.itemCount.set(r>0?`\xD7${r}`:""))}setIcon(e,t){e===this.shownIcon&&!t||(this.shownIcon=e,this.itemIconHost.replaceChildren(),e!=="none"&&this.itemIconHost.appendChild(this.getIcon(e)),this.itemFrame.classList.toggle("has-item",e!=="none"),this.itemLabel.set(this.rouletteVisual?"":Hw[e]),t&&iu(this.itemFrame,"pop"))}getIcon(e){let t=this.iconCache.get(e);if(t)return t;try{if(t=this.buildIcon(e),!(t instanceof HTMLCanvasElement))throw new Error("buildItemIcon did not return a canvas")}catch(n){console.warn("[HUD] item icon fallback for",e,n),t=this.fallbackIcon(e)}return t.classList.add("item-icon-canvas"),this.iconCache.set(e,t),t}fallbackIcon(e){let t=document.createElement("canvas");t.width=64,t.height=64;let n=t.getContext("2d");return n&&(n.fillStyle=Bw[e],n.beginPath(),n.arc(32,32,26,0,Math.PI*2),n.fill(),n.fillStyle="#fff",n.font='bold 22px Impact, "Arial Narrow", sans-serif',n.textAlign="center",n.textBaseline="middle",n.fillText(e.replace(/^triple_/,"")[0]?.toUpperCase()??"?",32,34)),t}flashCenter(e,t,n){let i=Q("div",`hud-msg ${t}`,e,this.center);return i.style.setProperty("--ttl",`${n}s`),this.timed.push({node:i,ttl:n}),i}};var Wf=["easy","normal","hard"],zw={easy:"EASY",normal:"NORMAL",hard:"HARD"},Gw={easy:"Relaxed rivals, generous rubber-banding.",normal:"The classic Grand Prix challenge.",hard:"Ruthless AI, near-perfect lines, no mercy."},Vw=[{key:"speed",label:"SPD"},{key:"acceleration",label:"ACC"},{key:"handling",label:"HND"},{key:"weight",label:"WGT"},{key:"miniTurbo",label:"MT"}],Ev=4,au=class{constructor(e,t,n){E(this,"characters",t);E(this,"tracks",n);E(this,"onStart",null);E(this,"onHighlight",null);E(this,"onPanelChange",null);E(this,"rootNode");E(this,"panels");E(this,"panel","title");E(this,"visible",!1);E(this,"charCards",[]);E(this,"charIndex",0);E(this,"charName");E(this,"charTagline");E(this,"trackCards",[]);E(this,"trackIndex",0);E(this,"diffButtons",[]);E(this,"difficultyIndex",1);E(this,"diffBlurb");E(this,"startButton");E(this,"trackRow",0);this.rootNode=Q("div","screen menu hidden",void 0,e);let i=Q("section","panel-title-screen",void 0,this.rootNode),r=Q("div","logo",void 0,i);gr.split(" ").forEach((w,b)=>{let R=Q("span",`logo-word logo-word-${b}`,void 0,r);R.dataset.text=w,R.textContent=w}),Q("div","logo-sub","ARCADE GRAND PRIX",i);let a=Q("div","press-start",void 0,i);Q("span","press-start-text","PRESS ENTER / CLICK TO START",a);let l=Q("div","controls-legend glass",void 0,i),c=[["W / \u2191","Throttle"],["S / \u2193","Brake / Reverse"],["A D / \u2190 \u2192","Steer"],["SPACE / SHIFT","Hop \xB7 Drift"],["E / CTRL","Use item (hold BRAKE to throw back)"],["Q","Look back"],["ESC / P","Pause"],["M","Mute"]];for(let[w,b]of c){let R=Q("div","legend-row",void 0,l);Q("kbd","",w,R),Q("span","",b,R)}Q("div","version","v1.0 \xB7 Three.js \xB7 100% procedural \xB7 gamepad supported",i),i.addEventListener("click",()=>{this.panel==="title"&&this.goTo("characterSelect",!0)});let h=Q("section","panel-select panel-chars",void 0,this.rootNode),u=Q("header","select-header",void 0,h);Q("div","panel-kicker","STEP 1 / 2",u),Q("h2","panel-title","CHOOSE YOUR RACER",u);let d=Q("div","card-grid char-grid",void 0,h);t.forEach((w,b)=>{let R=this.buildCharacterCard(w);R.addEventListener("pointerenter",()=>this.setCharacter(b)),R.addEventListener("click",()=>{this.charIndex===b?this.goTo("trackSelect",!0):this.setCharacter(b,!0)}),R.addEventListener("dblclick",()=>this.goTo("trackSelect",!0)),d.appendChild(R),this.charCards.push(R)});let f=Q("footer","select-footer glass",void 0,h),g=Q("div","select-info",void 0,f);this.charName=new an(Q("div","select-info-name","",g)),this.charTagline=new an(Q("div","select-info-tagline","",g));let v=Q("div","actions",void 0,f);v.appendChild(ti("\u2190 BACK","ghost",()=>this.goTo("title",!0))),v.appendChild(ti("CONTINUE \u2192","primary",()=>this.goTo("trackSelect",!0)));let p=Q("section","panel-select panel-tracks",void 0,this.rootNode),m=Q("header","select-header",void 0,p);Q("div","panel-kicker","STEP 2 / 2",m),Q("h2","panel-title","PICK A CIRCUIT",m);let y=Q("div","card-grid track-grid",void 0,p);n.forEach((w,b)=>{let R=this.buildTrackCard(w);R.addEventListener("pointerenter",()=>{this.trackRow=0,this.setTrack(b)}),R.addEventListener("click",()=>{this.trackIndex===b&&this.trackRow===0?this.start():(this.trackRow=0,this.setTrack(b,!0))}),y.appendChild(R),this.trackCards.push(R)});let _=Q("footer","select-footer glass",void 0,p),x=Q("div","difficulty",void 0,_);Q("div","difficulty-label","DIFFICULTY",x);let S=Q("div","segmented",void 0,x);Wf.forEach((w,b)=>{let R=Q("button","seg",zw[w],S);R.type="button",R.addEventListener("pointerenter",()=>{this.trackRow=1,this.refreshTrackFocus()}),R.addEventListener("click",P=>{P.stopPropagation(),this.trackRow=1,this.setDifficulty(b,!0)}),this.diffButtons.push(R)}),this.diffBlurb=new an(Q("div","difficulty-blurb","",x));let M=Q("div","actions",void 0,_);M.appendChild(ti("\u2190 BACK","ghost",()=>this.goTo("characterSelect",!0))),this.startButton=ti("START RACE","primary start",()=>this.start()),this.startButton.addEventListener("pointerenter",()=>{this.trackRow=2,this.refreshTrackFocus()}),M.appendChild(this.startButton),this.panels={title:i,characterSelect:h,trackSelect:p},this.setCharacter(0),this.setTrack(0),this.setDifficulty(1),this.applyPanel()}get currentPanel(){return this.panel}get highlightedCharacter(){return this.characters[this.charIndex]}show(e="title"){this.rootNode.classList.remove("hidden"),this.visible=!0,this.goTo(e,!1),this.onHighlight?.(this.highlightedCharacter.id)}hide(){this.rootNode.classList.add("hidden"),this.visible=!1}dispose(){this.rootNode.remove()}handleInput(e){if(this.visible)switch(this.panel){case"title":e.confirm&&this.goTo("characterSelect",!0);break;case"characterSelect":{let t=this.characters.length;e.menuLeft?this.setCharacter((this.charIndex-1+t)%t,!0):e.menuRight?this.setCharacter((this.charIndex+1)%t,!0):e.menuUp?this.setCharacter((this.charIndex-Ev+t)%t,!0):e.menuDown&&this.setCharacter((this.charIndex+Ev)%t,!0),e.confirm?this.goTo("trackSelect",!0):e.back&&this.goTo("title",!0);break}case"trackSelect":{if(e.menuUp)this.trackRow=(this.trackRow+2)%3,this.refreshTrackFocus(),$.emit("ui:move",{});else if(e.menuDown)this.trackRow=(this.trackRow+1)%3,this.refreshTrackFocus(),$.emit("ui:move",{});else if(e.menuLeft||e.menuRight){let t=e.menuRight?1:-1;if(this.trackRow===0){let n=this.tracks.length;this.setTrack((this.trackIndex+t+n)%n,!0)}else this.trackRow===1?this.setDifficulty((this.difficultyIndex+t+3)%3,!0):$.emit("ui:move",{})}e.confirm?this.start():e.back&&this.goTo("characterSelect",!0);break}}}goTo(e,t){if(t){let i=this.panel==="title"&&e!=="title"||this.panel==="characterSelect"&&e==="trackSelect";$.emit(i?"ui:select":"ui:back",{})}let n=e!==this.panel;this.panel=e,this.applyPanel(),n&&this.onPanelChange?.(e)}applyPanel(){for(let e of Object.keys(this.panels)){let t=this.panels[e],n=e===this.panel;t.classList.toggle("active",n),n&&(t.classList.remove("panel-in"),t.offsetWidth,t.classList.add("panel-in"))}this.panel==="trackSelect"&&(this.trackRow=0,this.refreshTrackFocus())}setCharacter(e,t=!1){if(e<0||e>=this.characters.length)return;let n=e!==this.charIndex;this.charIndex=e,this.charCards.forEach((r,o)=>{r.classList.toggle("selected",o===e),r.classList.toggle("focused",o===e)});let i=this.characters[e];this.charName.set(i.name.toUpperCase()),this.charTagline.set(i.tagline),n&&(t&&$.emit("ui:move",{}),this.onHighlight?.(i.id))}setTrack(e,t=!1){if(e<0||e>=this.tracks.length)return;let n=e!==this.trackIndex;this.trackIndex=e,this.trackCards.forEach((i,r)=>i.classList.toggle("selected",r===e)),this.refreshTrackFocus(),n&&t&&$.emit("ui:move",{})}setDifficulty(e,t=!1){let n=e!==this.difficultyIndex;this.difficultyIndex=e,this.diffButtons.forEach((i,r)=>i.classList.toggle("selected",r===e)),this.diffBlurb.set(Gw[Wf[e]]),this.refreshTrackFocus(),n&&t&&$.emit("ui:move",{})}refreshTrackFocus(){this.trackCards.forEach((e,t)=>e.classList.toggle("focused",this.trackRow===0&&t===this.trackIndex)),this.diffButtons.forEach((e,t)=>e.classList.toggle("focused",this.trackRow===1&&t===this.difficultyIndex)),this.startButton.classList.toggle("focused",this.trackRow===2)}start(){let e=this.tracks[this.trackIndex],t=this.characters[this.charIndex];!e||!t||($.emit("ui:select",{}),this.onStart?.({characterId:t.id,trackId:e.id,difficulty:Wf[this.difficultyIndex],laps:e.laps>0?e.laps:3}))}buildCharacterCard(e){let t=Q("div","card char-card glass");t.tabIndex=-1,t.style.setProperty("--card-accent",tn(e.color)),t.style.setProperty("--card-accent-2",tn(e.accent)),t.style.setProperty("--card-glow",Vf(e.color,.55));let n=Q("div","char-swatch",void 0,t);n.style.background=`linear-gradient(145deg, ${tn(e.color)} 0%, ${tn(e.accent)} 100%)`;let i=Q("div","char-helmet",void 0,n);i.style.background=`radial-gradient(circle at 35% 35%, #fff 0%, ${tn(e.driverColor)} 45%, ${tn(e.accent)} 100%)`,Q("div","char-wheel char-wheel-l",void 0,n),Q("div","char-wheel char-wheel-r",void 0,n),Q("div","card-name",e.name.toUpperCase(),t),Q("div","card-tag",e.tagline,t);let r=Q("div",`pill weight-${e.weightClass}`,e.weightClass.toUpperCase(),t);r.title="Weight class";let o=Q("div","stats",void 0,t);for(let a of Vw){let l=Q("div","stat",void 0,o);Q("span","stat-label",a.label,l);let c=Q("div","stat-bar",void 0,l),h=Q("div","stat-fill",void 0,c),u=Math.max(0,Math.min(1,e.stats[a.key]));h.style.width=`${Math.round(u*100)}%`}return t}buildTrackCard(e){let t=Q("div","card track-card glass");t.tabIndex=-1;let n=e.environment;t.style.setProperty("--card-accent",tn(n.skyHorizon)),t.style.setProperty("--card-glow",Vf(n.skyHorizon,.5));let i=Q("div","track-art",void 0,t);i.style.background=`linear-gradient(180deg, ${tn(n.skyTop)} 0%, ${tn(n.skyHorizon)} 55%, ${tn(e.palette.ground)} 56%, ${tn(e.palette.ground)} 100%)`;let r=Q("div","track-art-road",void 0,i);r.style.background=tn(e.palette.road),r.style.borderColor=tn(e.palette.curb),Q("div","track-theme-pill pill",e.theme.toUpperCase(),i);let o=Q("div","track-body",void 0,t),a=Q("div","track-name-row",void 0,o);Q("div","card-name",e.name.toUpperCase(),a);let l=Q("div","stars",void 0,a);for(let h=0;h<3;h++)Q("span",h<e.difficulty?"star on":"star","\u2605",l);Q("div","card-tag",e.description,o);let c=Q("div","track-meta",void 0,o);return Q("span","pill",`${e.laps} LAPS`,c),Q("span","pill",`${["ROOKIE","PRO","EXPERT"][e.difficulty-1]??"PRO"}`,c),t}};var Ww=56,Tv=["#ffd23f","#ff3ab8","#37a8ff","#7cff6b","#ff7a2f","#ffffff"],lu=class{constructor(e){E(this,"onRaceAgain",null);E(this,"onChangeTrack",null);E(this,"onMainMenu",null);E(this,"rootNode");E(this,"panel");E(this,"heading");E(this,"subheading");E(this,"table");E(this,"confetti");E(this,"focus");E(this,"visible",!1);this.rootNode=Q("div","screen results hidden",void 0,e),this.confetti=Q("div","confetti",void 0,this.rootNode),this.panel=Q("div","glass panel results-panel",void 0,this.rootNode),Q("div","panel-kicker","RACE COMPLETE",this.panel),this.heading=new an(Q("h2","panel-title results-title","",this.panel)),this.subheading=new an(Q("div","results-sub","",this.panel)),this.table=Q("div","standings",void 0,this.panel);let t=Q("div","actions",void 0,this.panel);this.focus=new Ro(o=>this.activate(o));let n=ti("RACE AGAIN","primary",()=>this.activate(0)),i=ti("CHANGE TRACK","",()=>this.activate(1)),r=ti("MAIN MENU","ghost",()=>this.activate(2));t.append(n,i,r),this.focus.add(n),this.focus.add(i),this.focus.add(r)}show(e){this.table.replaceChildren(),this.confetti.replaceChildren();let t=e.find(r=>r.isPlayer),n=t?t.place:e.length,i=e.length>0?e[0].finishTime:0;this.heading.set(n===1?"VICTORY!":`${br(n).toUpperCase()} PLACE`),this.subheading.set(n===1?"Untouchable. The crowd goes wild.":n<=3?"Podium finish. Champagne is on ice.":n<=5?"Solid run. The podium is within reach.":"Rough race. Time for revenge."),this.panel.classList.toggle("gold",n===1),e.forEach((r,o)=>{let a=Q("div","standing-row",void 0,this.table);a.style.animationDelay=`${.12+o*.09}s`,r.isPlayer&&a.classList.add("you"),r.place<=3&&a.classList.add(`podium-${r.place}`),Q("span","standing-place",br(r.place),a);let l=Q("span","standing-chip",void 0,a);l.style.background=tn(r.color),Q("span","standing-name",r.name+(r.isPlayer?"  (YOU)":""),a);let c=r.finishTime,h=!isFinite(c)||c<=0?"DNF":o===0?lh(c):`+${(c-i).toFixed(3)}`;Q("span","standing-time",h,a)}),n<=3&&this.spawnConfetti(),this.focus.set(0),this.rootNode.classList.remove("hidden"),this.panel.classList.remove("panel-in"),this.panel.offsetWidth,this.panel.classList.add("panel-in"),this.visible=!0}hide(){this.rootNode.classList.add("hidden"),this.confetti.replaceChildren(),this.visible=!1}handleInput(e){this.visible&&(e.menuLeft||e.menuUp?this.focus.move(-1)&&$.emit("ui:move",{}):(e.menuRight||e.menuDown)&&this.focus.move(1)&&$.emit("ui:move",{}),e.confirm?this.focus.activate():e.back&&this.activate(2))}dispose(){this.rootNode.remove()}activate(e){$.emit(e===2?"ui:back":"ui:select",{}),e===0?this.onRaceAgain?.():e===1?this.onChangeTrack?.():this.onMainMenu?.()}spawnConfetti(){for(let e=0;e<Ww;e++){let t=Q("span","confetti-piece",void 0,this.confetti);t.style.left=`${Math.random()*100}%`,t.style.background=Tv[e%Tv.length],t.style.animationDelay=`${Math.random()*2.5}s`,t.style.animationDuration=`${3+Math.random()*2.5}s`,t.style.transform=`rotate(${Math.random()*360}deg)`,t.style.width=`${6+Math.random()*8}px`,t.style.height=`${10+Math.random()*10}px`}}};var cu=class{constructor(e){E(this,"onResume",null);E(this,"onRestart",null);E(this,"onQuit",null);E(this,"rootNode");E(this,"focus");E(this,"visible",!1);this.rootNode=Q("div","screen pause hidden",void 0,e);let t=Q("div","glass panel pause-panel",void 0,this.rootNode);Q("div","panel-kicker","RACE PAUSED",t),Q("h2","panel-title","PAUSED",t);let n=Q("div","actions column",void 0,t);this.focus=new Ro(a=>this.activate(a));let i=ti("RESUME","primary",()=>this.activate(0)),r=ti("RESTART RACE","",()=>this.activate(1)),o=ti("QUIT TO MENU","danger",()=>this.activate(2));n.append(i,r,o),this.focus.add(i),this.focus.add(r),this.focus.add(o),Q("div","panel-hint","ESC / P  resume   \xB7   \u2191\u2193  navigate   \xB7   ENTER  select",t)}show(){this.focus.set(0),this.rootNode.classList.remove("hidden"),this.visible=!0}hide(){this.rootNode.classList.add("hidden"),this.visible=!1}get isVisible(){return this.visible}handleInput(e){this.visible&&(e.menuUp||e.menuLeft?this.focus.move(-1)&&$.emit("ui:move",{}):(e.menuDown||e.menuRight)&&this.focus.move(1)&&$.emit("ui:move",{}),e.confirm?this.focus.activate():e.back&&($.emit("ui:back",{}),this.onResume?.()))}activate(e){$.emit("ui:select",{}),e===0?this.onResume?.():e===1?this.onRestart?.():this.onQuit?.()}dispose(){this.rootNode.remove()}};var hu=["Hold DRIFT (Space / Shift) through a corner and release for a mini-turbo. Longer drift = bigger boost.","Tap the throttle just as the countdown hits 1 for a rocket start. Hold it too early and you will spin out.","Hold BRAKE while using a shell to throw it backwards.","Press Q to look behind you. Check what is coming before dropping a banana.","Boost pads (glowing chevrons) give a free +45% speed burst. Line them up.","Item odds depend on your place. Trailing racers get stars, lightning and blue shells.","A star makes you invincible and destroys any hazard you touch.","Staying on the road matters: off-road cuts your top speed almost in half.","Use a mushroom on the long straight, or to recover after a hit.","Heavy karts bump light karts around. Pick your weight class wisely.","Hop off jump crests for a small landing boost.","Press M to mute the audio at any time."],qw=2.4,uu=class{constructor(e){E(this,"rootNode");E(this,"title");E(this,"subtitle");E(this,"band");E(this,"bar");E(this,"tipNode");E(this,"tipText");E(this,"tipTimer",0);E(this,"tipIndex",0);E(this,"progress",0);E(this,"visible",!1);this.rootNode=Q("div","screen loading hidden",void 0,e);let t=Q("div","loading-panel",void 0,this.rootNode);this.band=Q("div","loading-band",void 0,t);let n=Q("div","loading-inner",void 0,t);Q("div","loading-kicker","NOW LOADING",n),this.title=new an(Q("h2","loading-title","",n)),this.subtitle=new an(Q("div","loading-subtitle","",n));let i=Q("div","loading-track",void 0,n);this.bar=Q("div","loading-bar",void 0,i),Q("div","loading-bar-shimmer",void 0,this.bar),this.tipNode=Q("div","loading-tip",void 0,n),Q("span","loading-tip-label","TIP",this.tipNode),this.tipText=new an(Q("span","loading-tip-text","",this.tipNode))}show(e){this.title.set(e.name.toUpperCase());let t="\u2605".repeat(e.difficulty)+"\u2606".repeat(3-e.difficulty);this.subtitle.set(`${e.laps} LAPS  \xB7  ${t}  \xB7  ${e.theme.toUpperCase()}`);let n=e.environment;this.band.style.background=`linear-gradient(90deg, ${tn(n.skyTop)}, ${tn(n.skyHorizon)}, ${tn(e.palette.road)})`,this.tipIndex=Math.floor(Math.random()*hu.length),this.tipText.set(hu[this.tipIndex]),this.tipTimer=0,this.setProgress(0),this.rootNode.classList.remove("hidden"),this.visible=!0}hide(){this.rootNode.classList.add("hidden"),this.visible=!1}setProgress(e){e=Ye(e),!(Math.abs(e-this.progress)<.002)&&(this.progress=e,this.bar.style.transform=`scaleX(${e.toFixed(3)})`)}update(e){this.visible&&(this.tipTimer+=e,this.tipTimer>=qw&&(this.tipTimer=0,this.tipIndex=(this.tipIndex+1)%hu.length,this.tipText.set(hu[this.tipIndex]),this.tipNode.classList.remove("tip-in"),this.tipNode.offsetWidth,this.tipNode.classList.add("tip-in")))}dispose(){this.rootNode.remove()}};var Ao=null;function Xw(){return Ao&&Ao.isConnected||(Ao=Q("div","toast-host"),document.body.appendChild(Ao)),Ao}function qf(s,e="info",t=4500){let n=Xw();for(;n.childElementCount>=4&&n.firstElementChild;)n.removeChild(n.firstElementChild);let i=Q("div",`toast toast-${e}`,s,n);requestAnimationFrame(()=>i.classList.add("toast-in")),window.setTimeout(()=>{i.classList.remove("toast-in"),i.classList.add("toast-out"),window.setTimeout(()=>i.remove(),400)},t)}var Yw=.8,Kw=8,Mv=1.6,Sv=8,wv=90,ja=30,Rv=[];function Av(s){return s==="characterSelect"?"characters":s==="trackSelect"?"tracks":"title"}var du=class{constructor(e){E(this,"tv");E(this,"tvSuspendPending",!1);E(this,"container");E(this,"renderer");E(this,"scene",new sr);E(this,"camera");E(this,"uiRoot");E(this,"input");E(this,"audio");E(this,"particles");E(this,"postfx");E(this,"hdrEffects");E(this,"postfxOk");E(this,"backdrop");E(this,"mainMenu");E(this,"results");E(this,"pauseMenu");E(this,"loading");E(this,"muteIndicator");E(this,"state","boot");E(this,"prePauseState","racing");E(this,"race",null);E(this,"pendingSettings",null);E(this,"loadingElapsed",0);E(this,"loadingFrames",0);E(this,"loadingProgress",0);E(this,"shadersReady",!1);E(this,"rafId",0);E(this,"lastTime",-1);E(this,"elapsed",0);E(this,"accumulator",0);E(this,"pendingUseItem",!1);E(this,"currentMusic","none");E(this,"audioStarted",!1);E(this,"disposed",!1);E(this,"playerInput",Ei());E(this,"unsubs",[]);E(this,"sunDir",new C(.4,.8,.3));E(this,"tmpA",new C);E(this,"tmpB",new C);E(this,"tmpC",new C);E(this,"speedFx",0);E(this,"boostFx",0);E(this,"hitFx",0);E(this,"loop",e=>{if(this.disposed)return;this.rafId=requestAnimationFrame(this.loop),this.lastTime<0&&(this.lastTime=e);let t=(e-this.lastTime)/1e3;this.lastTime=e,t>Gd&&(t=Gd),t<0&&(t=0),this.elapsed+=t;let n=this.tv?.poll(),i=["countdown","racing","finished"].includes(this.state),r=this.input.update(n,i);["title","characterSelect","trackSelect"].includes(this.state)&&r.confirm&&(this.tvSuspendPending=!1);try{this.frame(t,r)}catch(o){console.error("[Game] frame error",o),this.tv?.fail(o),$.emit("ui:error",{})}});E(this,"onGesture",()=>{this.audioStarted||(this.audioStarted=!0,window.removeEventListener("pointerdown",this.onGesture),window.removeEventListener("keydown",this.onGesture),this.audio.init().then(()=>{this.currentMusic!=="none"&&this.safe(()=>this.audio.playMusic(this.currentMusic))}).catch(e=>{console.warn("[Game] audio init failed",e),this.audioStarted=!1,window.addEventListener("pointerdown",this.onGesture,{passive:!0}),window.addEventListener("keydown",this.onGesture)}))});E(this,"onResize",()=>{let e=Math.max(1,this.container.clientWidth||window.innerWidth),t=Math.max(1,this.container.clientHeight||window.innerHeight),n=bv(this.hdrEffects,window.devicePixelRatio||1,e,t);if(this.renderer.setPixelRatio(n),this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.postfxOk)try{this.postfx.setSize(e,t,n)}catch(i){console.error("[Game] PostFX resize failed",i),this.postfxOk=!1}});E(this,"onKeyDown",e=>{e.repeat||(this.state!=="paused"&&this.audio.init(),(e.key==="m"||e.key==="M")&&this.toggleMute())});E(this,"onBlur",()=>{this.suspendForTV()});E(this,"onVisibility",()=>{document.hidden&&this.onBlur()});if(this.container=e,this.renderer=new ih({antialias:!0,powerPreference:"high-performance"}),this.renderer.outputColorSpace=Nt,this.renderer.toneMapping=ur,this.renderer.toneMappingExposure=1.05,this.hdrEffects=xv(this.renderer.getContext()),this.postfxOk=this.hdrEffects,this.renderer.shadowMap.enabled=this.hdrEffects,this.renderer.shadowMap.type=hc,this.renderer.domElement.className="game-canvas",e.appendChild(this.renderer.domElement),this.camera=new xn(70,1,.1,1200),this.camera.position.set(0,3,8),this.scene.add(this.camera),this.uiRoot=Q("div","",void 0,e),this.uiRoot.id="ui",this.input=new mh,this.input.onCancel=()=>this.suspendForTV(),this.audio=new zh,this.particles=new Xh,this.scene.add(this.particles.object),this.postfx=new Jh,this.hdrEffects)try{this.postfx.init(this.renderer,this.scene,this.camera)}catch(t){console.error("[Game] PostFX init failed, using plain rendering",t),this.postfxOk=!1}this.backdrop=new nu,this.mainMenu=new au(this.uiRoot,Gi,Ga),this.mainMenu.onHighlight=t=>this.backdrop.setCharacter(qd(t)),this.mainMenu.onPanelChange=t=>this.onMenuPanel(t),this.mainMenu.onStart=t=>this.startRace(t),this.results=new lu(this.uiRoot),this.results.onRaceAgain=()=>{this.race&&this.startRace(this.race.settings)},this.results.onChangeTrack=()=>this.returnToMenu("trackSelect"),this.results.onMainMenu=()=>this.returnToMenu("title"),this.pauseMenu=new cu(this.uiRoot),this.pauseMenu.onResume=()=>this.resume(),this.pauseMenu.onRestart=()=>{let t=this.race?.settings;this.leavePause(),t?this.startRace(t):this.returnToMenu("title")},this.pauseMenu.onQuit=()=>{this.leavePause(),this.returnToMenu("title")},this.loading=new uu(this.uiRoot),this.muteIndicator=Q("div","mute-indicator","\u{1F507} MUTED",this.uiRoot),window.addEventListener("resize",this.onResize),window.addEventListener("keydown",this.onKeyDown),window.addEventListener("pointerdown",this.onGesture,{passive:!0}),window.addEventListener("keydown",this.onGesture),window.addEventListener("blur",this.onBlur),document.addEventListener("visibilitychange",this.onVisibility),this.onResize()}start(){this.state==="boot"&&(this.showMenu("title"),this.lastTime=-1,this.rafId=requestAnimationFrame(this.loop))}get currentState(){return this.state}cancelControls(){this.input.cancel(),this.pendingUseItem=!1,Object.assign(this.playerInput,Ei());let e=this.race?.karts[0];e instanceof Fs&&e.cancelControls(),this.race?.raceManager.cancelPlayerInput()}suspendForTV(){this.tvSuspendPending=!0,this.cancelControls(),this.pause(),this.audio.suspendForTV()}wakeAudioForTV(){this.state!=="paused"&&(this.onGesture(),this.audio.init())}observeForTV(){let e=this.race?.karts[0],t=e?.state,n=this.renderer.getContext(),i=this.state;return{renderer:"webgl2",webglVersion:n.getParameter(n.VERSION),stage:i==="paused"?"paused":i==="boot"||i==="loading"?"loading":["title","characterSelect","trackSelect"].includes(i)?"menu":i==="results"?"ended":"playing",paused:i==="paused",audioState:this.audio.contextStateForTV,gameplay:{mode:i,course:this.race?.trackDef.id||"",character:t?.character.id||"",time:this.race?.raceManager.raceTime||0,countdown:this.race?.raceManager.countdownElapsed||0,playerX:t?.position.x||0,playerY:t?.position.y||0,playerZ:t?.position.z||0,speed:t?.speed||0,heading:t?.heading||0,progress:t?.raceProgress||0,lap:t?.lap||0,place:t?.place||0,checkpoint:t?.checkpointIndex||0,driftActive:!!t?.isDrifting,driftCharge:t?.driftCharge||0,driftStage:t?.driftStage||0,boost:t?.boostTimer||0,item:t?.item||"none",itemCount:t?.itemCount||0,itemPending:this.pendingUseItem,driftHeld:!!e?.input.drift,lookBack:!!e?.input.lookBack,helpOpen:!!this.tv?.helpOpen,postfxEnabled:this.postfxOk,renderCalls:this.renderer.info.render.calls}}}dispose(){if(!this.disposed){this.disposed=!0,cancelAnimationFrame(this.rafId),window.removeEventListener("resize",this.onResize),window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("pointerdown",this.onGesture),window.removeEventListener("keydown",this.onGesture),window.removeEventListener("blur",this.onBlur),document.removeEventListener("visibilitychange",this.onVisibility);for(let e of this.unsubs)e();this.unsubs.length=0,this.disposeRace(),this.backdrop.detach(this.scene),this.backdrop.dispose(),this.mainMenu.dispose(),this.results.dispose(),this.pauseMenu.dispose(),this.loading.dispose(),this.muteIndicator.remove(),this.input.dispose(),this.safe(()=>this.audio.dispose()),this.safe(()=>this.particles.dispose()),this.safe(()=>this.postfx.dispose()),this.renderer.dispose(),this.renderer.domElement.remove(),this.uiRoot.remove()}}frame(e,t){switch(this.state){case"boot":return;case"title":case"characterSelect":case"trackSelect":this.mainMenu.handleInput(t),this.backdrop.update(e,this.camera),this.particles.update(e,Rv,this.camera),this.audio.update(e,Rv,-1,this.camera),this.render(e);return;case"loading":this.frameLoading(e);return;case"countdown":case"racing":case"finished":if(t.pause){this.pause(),this.render(e);return}this.simulate(e,t),this.renderRace(e,this.state==="racing"&&t.lookBack);return;case"paused":if(t.pause){this.resume(),this.render(e);return}this.pauseMenu.handleInput(t),t.pause&&this.state==="paused"&&this.resume(),this.render(e);return;case"results":this.results.handleInput(t),this.race&&this.state==="results"?(this.simulate(e,t),this.renderRace(e,!1)):this.render(e);return}}frameLoading(e){if(this.loading.update(e),this.loadingElapsed+=e,this.loadingFrames++,!this.race&&this.loadingFrames>=2&&this.pendingSettings){let i=this.pendingSettings;try{this.buildRace(i)}catch(r){console.error("[Game] failed to build race",r),qf("Could not build the race. Check the console for details.","error"),this.pendingSettings=null,this.loading.hide(),this.showMenu("title");return}this.warmShaders()}let t=this.race!==null&&(this.shadersReady||this.loadingElapsed>Kw),n=this.race?t?1:.9:.12;this.loadingProgress=pt(this.loadingProgress,n,t?14:1.4,e),this.loading.setProgress(this.loadingProgress),this.race&&t&&(this.renderRace(e,!1),this.loadingElapsed>=Yw&&this.loadingProgress>.985&&this.enterCountdown())}warmShaders(){let e=this.race;if(this.shadersReady=!1,!e)return;let t=this.renderer;if(typeof t.compileAsync!="function"){this.shadersReady=!0;return}let n;try{n=t.compileAsync.call(this.renderer,this.scene,this.camera)}catch(r){console.warn("[Game] compileAsync threw; falling back to synchronous compile",r),this.shadersReady=!0;return}let i=()=>{this.race===e&&(this.shadersReady=!0)};n.then(i,r=>{console.warn("[Game] compileAsync failed; falling back to synchronous compile",r),i()})}simulate(e,t){let n=this.race;if(!n)return;t.useItem&&(this.pendingUseItem=!0),this.accumulator+=e;let i=0;for(;this.accumulator>=oh&&i<Sv;)this.step(oh,n,t,this.pendingUseItem),this.pendingUseItem=!1,this.accumulator-=oh,i++;i>=Sv&&(this.accumulator=0)}step(e,t,n,i){let{track:r,karts:o,items:a}=t,l=o[0];if(t.playerAutoDriver)t.playerAutoDriver.update(e,r,o,a,null);else{let c=this.playerInput;c.throttle=n.throttle,c.brake=n.brake,c.steer=n.steer,c.drift=n.drift,c.useItem=i,c.useItemHeld=n.useItemHeld,c.lookBack=n.lookBack,c.pause=!1,c.confirm=!1,c.back=!1,c.menuUp=!1,c.menuDown=!1,c.menuLeft=!1,c.menuRight=!1,l.setInput(c)}for(let c=0;c<t.aiDrivers.length;c++)t.aiDrivers[c].update(e,r,o,a,l);for(let c=0;c<o.length;c++)o[c].update(e,r,o);for(let c=0;c<o.length;c++){let h=o[c],u=h.input;u.useItem&&!h.state.itemRouletteActive&&h.state.item!=="none"&&a.requestUse(h,u.brake>.5||u.lookBack)}a.update(e),t.raceManager.update(e)}renderRace(e,t){let n=this.race;if(!n){this.render(e);return}let i=n.karts[0];for(let r=0;r<n.karts.length;r++)n.karts[r].updateVisuals(e);n.track.update(e,this.elapsed),n.followCamera.update(e,i,t),this.updateSun(n,i),this.particles.update(e,n.karts,this.camera),this.audio.update(e,n.karts,i.state.id,this.camera),n.hud.update(e,i,n.karts,n.raceManager.raceTime,n.raceManager.totalLaps),this.updatePostFxFeel(e,i),this.state==="finished"&&n.resultsTimer>0&&(n.resultsTimer-=e,n.resultsTimer<=0&&this.enterResults()),this.render(e)}render(e){if(this.postfxOk)try{this.postfx.render(e),this.tv?.rendered();return}catch(t){console.error("[Game] PostFX render failed; falling back to plain rendering",t),this.postfxOk=!1,this.safe(()=>this.postfx.setEnabled(!1))}this.renderer.render(this.scene,this.camera),this.tv?.rendered()}updateSun(e,t){let n=t.state.position,i=2;this.tmpA.set(Math.round(n.x/i)*i,Math.round(n.y/i)*i,Math.round(n.z/i)*i),e.sun.target.position.copy(this.tmpA),e.sun.position.copy(this.tmpA).addScaledVector(this.sunDir,wv),e.fill.visible&&(e.fill.position.copy(this.camera.position),e.fill.position.y+=2,e.fill.target.position.copy(n))}updatePostFxFeel(e,t){if(!this.postfxOk)return;let n=t.state,i=Math.max(1,t.topSpeed()),r=Ye((Math.abs(n.speed)-i*.55)/(i*.9)),o=n.isBoosting?Ye(.45+n.boostStrength):n.isInvincible?.35:0;this.speedFx=pt(this.speedFx,r,5,e),this.boostFx=pt(this.boostFx,o,n.isBoosting?12:4,e),this.hitFx>0&&(this.hitFx=pt(this.hitFx,0,3,e),this.hitFx<.005&&(this.hitFx=0)),this.postfx.setSpeedEffect(this.speedFx),this.postfx.setBoostEffect(this.boostFx),this.postfx.setHitEffect(this.hitFx)}setState(e){if(e===this.state)return;let t=this.state;this.state=e,this.uiRoot.dataset.state=e,$.emit("game:stateChange",{from:t,to:e})}showMenu(e){this.results.hide(),this.pauseMenu.hide(),this.loading.hide(),this.backdrop.setCharacter(this.mainMenu.highlightedCharacter),this.backdrop.setFraming(Av(e),!0),this.backdrop.attach(this.scene,this.camera,this.hdrEffects?this.renderer:void 0),this.mainMenu.show(e),this.setState(e),this.playMusic("menu")}onMenuPanel(e){(this.state==="title"||this.state==="characterSelect"||this.state==="trackSelect")&&(this.setState(e),this.backdrop.setFraming(Av(e)))}returnToMenu(e){this.disposeRace(),this.showMenu(e)}startRace(e){this.disposeRace(),this.backdrop.detach(this.scene),this.mainMenu.hide(),this.results.hide(),this.pauseMenu.hide(),this.safe(()=>this.particles.reset());let t;try{t=pf(e.trackId)}catch{t=Ga[0]}if(!t){qf("No tracks are available yet.","error"),this.showMenu("title");return}this.pendingSettings={...e,trackId:t.id},this.loadingElapsed=0,this.loadingFrames=0,this.loadingProgress=0,this.shadersReady=!1,this.loading.show(t),this.scene.background=new ae(723738),this.scene.fog=null,this.setState("loading")}buildRace(e){let t={track:null,karts:[],items:null,followCamera:null,hud:null};try{this.buildRaceInner(e,t)}catch(n){let{hud:i,followCamera:r,items:o,karts:a,track:l}=t;i&&this.safe(()=>i.dispose()),r&&this.safe(()=>r.dispose()),o&&this.safe(()=>o.dispose());for(let c of a)this.safe(()=>c.dispose());throw l&&this.safe(()=>l.dispose()),n}}buildRaceInner(e,t){let n=pf(e.trackId),i=new wh(n);t.track=i;let r=n.environment,o=t.karts,a;try{a=qd(e.characterId)}catch{a=Gi[0]}let l=Gi.filter(w=>w.id!==a.id);for(let w=l.length-1;w>0;w--){let b=Math.floor(Math.random()*(w+1)),R=l[w];l[w]=l[b],l[b]=R}o.push(new Fs(0,a,!0));for(let w=1;w<8;w++){let b=l.length>0?l[(w-1)%l.length]:a;o.push(new Fs(w,b,!1))}let c=e.difficulty,h=[];for(let w=1;w<o.length;w++)h.push(new Wa(o[w],c,w));let u=new Dh(this.particles);t.items=u,u.init(i,o);let d=new jh(i,o,e),f=new eu(this.camera);t.followCamera=f,f.setTrack(i);let g=new ou(this.uiRoot,Eg);t.hud=g,g.setTrack(i);let v=new Rs(r.sunColor,r.sunIntensity);v.castShadow=!0,v.shadow.mapSize.set(2048,2048);let p=v.shadow.camera;p.left=-ja,p.right=ja,p.top=ja,p.bottom=-ja,p.near=1,p.far=wv+ja*3,p.updateProjectionMatrix(),v.shadow.bias=-5e-4,v.shadow.normalBias=.03,this.sunDir.set(r.sunDirection.x,r.sunDirection.y,r.sunDirection.z),this.sunDir.lengthSq()<1e-6&&this.sunDir.set(.4,.8,.3),this.sunDir.y<0&&(this.sunDir.y=-this.sunDir.y),this.sunDir.y<.15&&(this.sunDir.y=.15),this.sunDir.normalize();let m=new hr(r.ambientSky,r.ambientGround,r.ambientIntensity),y=at(.9-r.ambientIntensity,0,.6)+at((1.6-r.sunIntensity)*.3,0,.3),_=new Rs(14279935,y);_.castShadow=!1,_.visible=y>.01;let x=r.fogDensity>0?new ir(r.fogColor,r.fogDensity):null,S=new ae(r.skyHorizon);this.scene.add(i.object);for(let w of o)this.scene.add(w.object);this.scene.add(u.object),this.scene.add(v,v.target,m,_,_.target),this.scene.fog=x,this.scene.background=S;let M={settings:e,trackDef:n,track:i,karts:o,aiDrivers:h,playerAutoDriver:null,items:u,raceManager:d,followCamera:f,hud:g,sun:v,hemi:m,fill:_,fog:x,background:S,unsubs:[],resultsTimer:0};this.race=M,this.accumulator=0,this.pendingUseItem=!1,this.speedFx=0,this.boostFx=0,this.hitFx=0;for(let w of o)w.updateVisuals(0);f.snapTo(o[0]),this.updateSun(M,o[0]),M.unsubs.push($.on("race:start",()=>{this.race===M&&this.state==="countdown"&&this.setState("racing")}),$.on("race:lap",w=>{this.race!==M||!w.isPlayer||w.isFinalLap&&this.playMusic("finalLap")}),$.on("race:finish",w=>{this.race!==M||!w.isPlayer||this.onPlayerFinished(M)}),$.on("race:allFinished",()=>{this.race===M&&(this.state==="finished"?M.resultsTimer=Mv:(this.state==="racing"||this.state==="countdown")&&this.enterResults())}),$.on("item:hit",w=>{this.race!==M||!w.isPlayer||(this.hitFx=1)}),$.on("item:lightning",()=>{this.race!==M||!this.postfxOk||this.safe(()=>this.postfx.flash(16777215,.3))}))}enterCountdown(){let e=this.race;if(!e)return;this.pendingSettings=null,this.loading.hide(),e.hud.show();let t=e.track.startGrid,n=this.tmpA.set(0,0,0),i=Math.min(t.length,8);if(i>0){for(let c=0;c<i;c++)n.add(t[c].position);n.multiplyScalar(1/i)}else n.copy(e.karts[0].state.position);let r=this.tmpB;e.karts[0].forwardDir(r),r.lengthSq()<1e-6&&r.set(0,0,-1),r.y=0,r.normalize();let o=this.tmpC.set(-r.z,0,r.x),a=n.clone().addScaledVector(r,18).addScaledVector(o,11);a.y+=6.5;let l=n.clone();l.y+=.8,e.followCamera.setCinematic(a,l,3*Fa,46),e.raceManager.startCountdown(),this.setState("countdown"),this.playMusic("race"),this.tvSuspendPending&&this.pause()}onPlayerFinished(e){if(!(this.state!=="racing"&&this.state!=="countdown")){try{e.playerAutoDriver=new Wa(e.karts[0],"normal",0)}catch(t){console.warn("[Game] could not create auto-driver for the player",t),e.playerAutoDriver=null}this.postfxOk&&this.safe(()=>this.postfx.flash(16777215,.35)),this.setState("finished"),e.raceManager.allFinished&&(e.resultsTimer=Mv)}}enterResults(){let e=this.race;!e||this.state==="results"||(e.hud.hide(),this.results.show(e.raceManager.getStandings()),this.setState("results"),this.playMusic("results"))}pause(){this.state!=="countdown"&&this.state!=="racing"&&this.state!=="finished"||(this.prePauseState=this.state,this.setState("paused"),this.cancelControls(),this.tv?.onPause(),this.audio.suspendForTV(),this.pauseMenu.show(),$.emit("game:pause",{}))}resume(){this.state==="paused"&&(this.tvSuspendPending=!1,this.input.cancel(),this.pauseMenu.hide(),this.accumulator=0,this.pendingUseItem=!1,this.setState(this.prePauseState),this.audio.init(),$.emit("game:resume",{}))}leavePause(){this.tvSuspendPending=!1,this.cancelControls(),this.audio.init(),this.pauseMenu.hide(),this.state==="paused"&&$.emit("game:resume",{})}disposeRace(){let e=this.race;if(e){this.race=null;for(let t of e.unsubs)t();e.unsubs.length=0,this.scene.remove(e.track.object);for(let t of e.karts)this.scene.remove(t.object);this.scene.remove(e.items.object),this.scene.remove(e.sun,e.sun.target,e.hemi,e.fill,e.fill.target),e.sun.dispose(),e.hemi.dispose(),e.fill.dispose(),this.scene.fog=null,this.safe(()=>e.items.dispose());for(let t of e.karts)this.safe(()=>t.dispose());this.safe(()=>e.track.dispose()),e.raceManager.dispose(),e.followCamera.dispose(),e.hud.dispose(),this.safe(()=>this.particles.reset()),this.postfxOk&&this.safe(()=>{this.postfx.setSpeedEffect(0),this.postfx.setBoostEffect(0),this.postfx.setHitEffect(0)}),this.accumulator=0,this.pendingUseItem=!1}}playMusic(e){this.currentMusic=e,this.safe(()=>this.audio.playMusic(e))}toggleMute(){let e=!this.audio.muted;this.safe(()=>this.audio.setMuted(e)),this.muteIndicator.classList.toggle("visible",e)}safe(e){try{e()}catch(t){console.error("[Game]",t)}}};(function(s){"use strict";var e=["a","b","start","select"];function t(a){a=a||{};var l={},c=[];function h(u){var d=(u||[]).filter(function(f){return f&&Number(f.id)>0});return Object.keys(l).forEach(function(f){l[f].wifi&&!d.some(function(g){return Number(g.id)===Number(f)})&&d.push({id:Number(f),connected:!1,transport:"wifi"})}),c=d.map(function(f){var g=Object.assign({},f),v=Number(g.id),p=l[v],m=g.transport==="wifi",y=!!g.connected,_=y?m?"wifi:"+String(g.session||g.controllerId||v):"phone:"+String(g.session||v):"",x=Number.isSafeInteger(g.cancelSeq)?g.cancelSeq:0,S=!!p&&(p.source!==_||p.rawCancel!==x),M=!p&&m&&y||S&&(m||p.wifi),w=p||{epoch:x,blocked:{}};S&&w.epoch++;var b=M&&a.onCancel&&a.onCancel({id:v,previous:p?p.source:"",source:_,disconnected:!y})===!0;return b&&e.forEach(function(R){w.blocked[R]=!!g[R]}),e.forEach(function(R){g[R]||(w.blocked[R]=!1),g[R]=y&&!b&&!w.blocked[R]&&!!g[R]}),(!y||b)&&(g.x=g.y=g.aimX=g.aimY=0),g.id=v,g.connected=y,g.cancelSeq=w.epoch,w.source=_,w.wifi=m,w.rawCancel=x,l[v]=w,g}),c.map(function(f){return Object.assign({},f)})}return{read:h,peek:function(){return c.map(function(u){return Object.assign({},u)})}}}var n=new WeakMap;function i(a){if(!a.getElementById("ptv-client-style")){var l=a.createElement("style");l.id="ptv-client-style",l.textContent="[data-puretv-clients]{box-sizing:border-box;min-width:0}[data-puretv-clients][hidden]{display:none!important}.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}.ptv-client-card+.ptv-client-card{margin-top:6px}.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}.ptv-client-body{flex:1;min-width:0}.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}.ptv-client-seat{font:inherit;color:inherit}.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}",(a.head||a.documentElement).appendChild(l)}}function r(a){var l="http://www.w3.org/2000/svg",c=a.createElementNS(l,"svg");c.setAttribute("class","ptv-client-icon"),c.setAttribute("viewBox","0 0 24 24"),c.setAttribute("aria-hidden","true"),c.setAttribute("focusable","false"),c.setAttribute("fill","none"),c.setAttribute("stroke","currentColor"),c.setAttribute("stroke-width","1.7"),c.setAttribute("stroke-linecap","round"),c.setAttribute("stroke-linejoin","round");var h=a.createElementNS(l,"path");h.setAttribute("d","M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z"),c.appendChild(h);var u=a.createElementNS(l,"path");return u.setAttribute("d","M7 9.7v4.6M4.7 12h4.6"),c.appendChild(u),[[16,10.7],[18.8,13]].forEach(function(d){var f=a.createElementNS(l,"circle");f.setAttribute("cx",String(d[0])),f.setAttribute("cy",String(d[1])),f.setAttribute("r",".75"),f.setAttribute("fill","currentColor"),f.setAttribute("stroke","none"),c.appendChild(f)}),c}function o(a,l,c){if(!(!a||!a.ownerDocument)){var h=c&&c.language==="en"?"en":"zh",u=(Array.isArray(l)?l:[]).filter(function(g){return g&&g.connected===!0&&g.transport==="wifi"&&Number(g.id)>0}).map(function(g){return{seat:Number(g.id),identity:typeof g.controllerId=="string"?g.controllerId:""}}).sort(function(g,v){return g.seat-v.seat}),d=JSON.stringify([h,u]);if(n.get(a)!==d){n.set(a,d);var f=a.ownerDocument;for(i(f),a.setAttribute("data-puretv-clients",""),a.setAttribute("role","status"),a.setAttribute("aria-live","polite"),a.setAttribute("aria-atomic","true"),a.setAttribute("aria-label",h==="en"?"Connected pureTV controllers":"\u5DF2\u8FDE\u63A5\u7684 pureTV \u624B\u67C4");a.firstChild;)a.removeChild(a.firstChild);u.forEach(function(g){var v=f.createElement("div");v.className="ptv-client-card",v.setAttribute("data-puretv-controller-id",g.identity),v.setAttribute("data-player-id",String(g.seat)),v.appendChild(r(f));var p=f.createElement("div");p.className="ptv-client-body";var m=f.createElement("div");m.className="ptv-client-heading";var y=f.createElement("strong");y.className="ptv-client-seat",y.textContent=g.seat+"P";var _=f.createElement("span");_.className="ptv-client-state",_.textContent=h==="en"?"Connected":"\u5DF2\u8FDE\u63A5",m.appendChild(y),m.appendChild(_),p.appendChild(m);var x=f.createElement("span");x.className="ptv-client-id",x.setAttribute("data-puretv-controller-id-text",""),x.textContent="ID: "+(g.identity||(h==="en"?"not reported":"\u672A\u63D0\u4F9B")),p.appendChild(x),v.appendChild(p),a.appendChild(v)}),a.hidden=u.length===0}}}s.PureTVControllerAdapter={create:t,renderClients:o},typeof module<"u"&&module.exports&&(module.exports=s.PureTVControllerAdapter)})(typeof window<"u"?window:globalThis);var el=Object.freeze(["UP","DOWN","LEFT","RIGHT","START","A","B","X","Y"]),On=()=>Object.fromEntries(el.map(s=>[s,!1])),Qa=s=>JSON.parse(JSON.stringify(s)),Zw={ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Enter:"A",Start:"START",p:"START",b:"B",Select:"Y"};function $w(){let s=On(),e="",t=null,n=!1,i=On(),r=!1;return{cancel(){r=!0},read(o={},a={}){(!o||typeof o!="object")&&(o={});let l=Array.isArray(o.players)?o.players.filter(x=>x&&Number(x.id)>0):[],c=l.filter(x=>x.connected===!0&&x.transport==="wifi").sort((x,S)=>Number(x.id)-Number(S.id))[0],h=c?JSON.stringify([c.id,c.controllerId,c.session]):"",u=c?.cancelSeq??null,d=e!==h||!!e&&t!==u,f=r||d&&!!e,g=f||d&&n&&!!h,v=On(),p=o.inputActive!==!1&&c?.inputActive!==!1;for(let x of el)v[x]=!!a[x]||p&&c?.buttons?.[x]===!0;if(g)for(let x of el)i[x]=v[x];let m=On(),y=On(),_=On();for(let x of el)v[x]||(i[x]=!1),m[x]=!g&&v[x]&&!i[x],y[x]=m[x]&&!s[x],_[x]=!f&&!g&&!m[x]&&s[x];return s=m,e=h,t=u,r=!1,c&&(n=!0),{buttons:m,pressed:y,released:_,connected:!!c,cancelled:f,players:Qa(l),source:e}}}}function Jw(s,e){let t=s.createElement("style");t.textContent=`
    #puretv-controller-panel{position:fixed;z-index:30;box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;color:#eef6ff;background:rgba(12,22,36,.94);border:1px solid rgba(153,192,225,.35);border-radius:12px;padding:10px;font:13px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;box-shadow:0 8px 28px #0004}
    #puretv-controller-panel[hidden]{display:none!important}
    #puretv-controller-panel strong{font-weight:650}
    #puretv-controller-panel .ptv-host-title{display:block;font-size:13px;color:#a8ddff;margin-bottom:5px}
    #puretv-controller-panel .ptv-host-info{white-space:pre-line;margin:6px 0 0;color:#c4d5e7;font-size:12px}
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none}
    #puretv-controller-panel[data-playing=true] .ptv-host-title,#puretv-controller-panel[data-playing=true] .ptv-host-info{display:none}
    #puretv-controller-panel .ptv-client-card{background:rgba(12,25,43,.94)}
    #puretv-controller-panel .ptv-client-id{font-size:11px}
    #puretv-controller-panel .ptv-client-heading{font-size:12px}
  `,s.head.appendChild(t);let n=s.createElement("aside");n.id="puretv-controller-panel",n.setAttribute("aria-label","pureTV \u624B\u67C4\u8FDE\u63A5"),n.style[e.side==="left"?"left":"right"]="12px",n.style.top=e.top||"12px",n.style.width=`${Math.max(150,Math.min(300,Number(e.width)||198))}px`;let i=s.createElement("strong");i.className="ptv-host-title",i.textContent="pureTV \u624B\u67C4";let r=s.createElement("div");r.id="puretv-controller-clients",r.hidden=!0;let o=s.createElement("p");return o.className="ptv-host-info",n.append(i,r,o),s.body.appendChild(n),{element:n,clients:r,info:o}}function Cv(s={}){let e=window,t=e.document,n=Jw(t,s),i=$w(),r=On(),o=On(),a={},l=-1/0,c=!1,h={buttons:On(),pressed:On(),released:On(),connected:!1,cancelled:!1,players:[],source:"",pollCount:0,info:{}},u=e.PureGame;function d(m){m&&typeof m=="object"&&(a=Qa(m))}function f(){r=On(),o=On(),i.cancel(),s.onSuspend?.()}let g={key(m,y){let _=Zw[m];_&&(y&&!r[_]&&(o[_]=!0),r[_]=!!y)},focus(m){m||f()},suspend(m){m&&f()},resume(){},roomInfo:d,networkChanged(m){d(m),f()}};e.PureGame=g;let v=()=>{t.hidden&&f()};e.addEventListener("blur",f),t.addEventListener("visibilitychange",v);function p(){e.PureTVControllerAdapter.renderClients(n.clients,h.players,{language:"zh"}),n.element.dataset.playing=String(c),n.element.hidden=c&&!h.connected;let m=a.wifiController||{},_=(Array.isArray(m.addresses)?m.addresses:Array.isArray(a.addresses)?a.addresses:[]).filter(b=>typeof b=="string").join(" / "),x=typeof m.serviceName=="string"?m.serviceName:"",S=Number.isInteger(m.port)&&m.port>0?m.port:63485,M=h.players.filter(b=>b.connected===!0&&b.transport==="wifi").map(b=>Number(b.id)).sort((b,R)=>b-R)[0],w=h.connected?`\u5355\u4EBA\u6E38\u620F \xB7 ${M}P \u624B\u67C4\u64CD\u4F5C`:"\u624B\u67C4\u6309 GPIO 23 \u641C\u7D22\u8FDE\u63A5";e.PureGameHost||(w=`\u6D4F\u89C8\u5668\u9884\u89C8 \xB7 \u952E\u9F20\u53EF\u73A9
Wi-Fi \u624B\u67C4\u9700\u542F\u52A8\u5B89\u88C5\u7248`),x&&(w+=`
`+x),_&&(w+=`
`+_),e.PureGameHost&&(w+=`
TCP `+S),typeof m.error=="string"&&m.error&&(w+=`
`+m.error),(m.state==="failed"||m.state==="unavailable")&&(w+=`
\u624B\u67C4\u670D\u52A1\u6682\u4E0D\u53EF\u7528`),n.info.textContent=w}return{poll(){let m={players:[]},y=e.performance.now();try{e.PureGameHost?.getInfo&&y-l>=1e3&&(d(JSON.parse(e.PureGameHost.getInfo())),l=y),e.PureGameHost?.snapshot&&(m=JSON.parse(e.PureGameHost.snapshot()))}catch{m={players:[]}}let _=On();for(let x of el)_[x]=r[x]||o[x];return o=On(),h={...i.read(m,_),info:Qa(a),pollCount:h.pollCount+1,native:!!e.PureGameHost,inputAvailable:!!e.PureGameHost},p(),h.cancelled&&s.onCancel?.(),Qa(h)},peek(){return Qa(h)},setPlaying(m){c=!!m,p()},cancel:f,destroy(){e.removeEventListener("blur",f),t.removeEventListener("visibilitychange",v),e.PureGame===g&&(e.PureGame=u),n.element.remove()}}}function Iv(){let s,e=0,t=!1,n=[],i=u=>n.push(u instanceof Error?u.message:String(u));addEventListener("error",u=>i(u.error||u.message)),addEventListener("unhandledrejection",u=>i(u.reason));let r=()=>s?.suspendForTV(),o=Cv({width:190,onSuspend:r,onCancel:r}),a=document.getElementById("puretv-controller-panel"),l=document.createElement("div");l.className="tv-help",l.innerHTML="<strong>TURBO KART RUSH</strong><span>\u83DC\u5355\uFF1A\u65B9\u5411\u9009\u62E9 \xB7 A / START \u786E\u8BA4 \xB7 Y \u8FD4\u56DE</span><span>\u2191 \u52A0\u901F \xB7 \u2193 \u5239\u8F66 / \u5012\u8F66<br>\u2190 \u2192 \u8F6C\u5411 \xB7 A \u8DF3\u8DC3 / \u6F02\u79FB<br>B \u9053\u5177 \xB7 X \u56DE\u770B \xB7 Y \u64CD\u4F5C\u8BF4\u660E<br>START \u6682\u505C / \u624B\u52A8\u7EE7\u7EED</span>",a.appendChild(l);let c=()=>!!s&&["countdown","racing","finished"].includes(s.currentState);return Object.defineProperty(window,"JoystickGameQA",{value:Object.freeze({snapshot:()=>({game:"turbo-kart-rush",...s?.observeForTV(),frames:e,controller:o.peek(),helpOpen:t,errors:[...n]})}),writable:!1,configurable:!1}),{attach(u){s=u},fail:i,poll(){o.setPlaying(c());let u=o.poll();return a.dataset.mode=s?.currentState||"boot",a.dataset.connected=String(o.peek().connected),u.cancelled||(c()&&u.pressed.Y&&(t=!t,a.dataset.help=String(t)),s?.currentState!=="paused"&&Object.values(u.pressed).some(Boolean)&&s?.wakeAudioForTV()),u},rendered(){e++},onPause(){o.cancel()},get helpOpen(){return t}}}var Xf=Iv();try{let s=new du(document.getElementById("app"));s.tv=Xf,Xf.attach(s),s.start()}catch(s){Xf.fail(s);let e=document.createElement("p");e.className="tv-fatal",e.textContent="Turbo Kart Rush \u9700\u8981\u652F\u6301 WebGL 2 \u7684\u7CFB\u7EDF\u6D4F\u89C8\u5668\u3002"+String(s),document.body.appendChild(e)}})();
