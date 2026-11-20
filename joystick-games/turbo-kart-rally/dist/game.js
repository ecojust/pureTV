(()=>{var mf=Object.defineProperty;var nm=(i,t,e)=>t in i?mf(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var ys=(i,t)=>{for(var e in t)mf(i,e,{get:t[e],enumerable:!0})};var gf=(i,t,e)=>nm(i,typeof t!="symbol"?t+"":t,e);var im=0,xf=1,sm=2;var Rd=1,Jh=2,rs=3,Rs=0,vn=1,$e=2,Wi=0,cs=1,xi=2,_f=3,vf=4,rm=5,Zs=100,om=101,am=102,lm=103,cm=104,hm=200,um=201,fm=202,dm=203,Pc=204,Lc=205,pm=206,mm=207,gm=208,xm=209,_m=210,vm=211,ym=212,Mm=213,bm=214,Dc=0,kc=1,Uc=2,kr=3,Nc=4,Fc=5,Oc=6,zc=7,jh=0,Sm=1,Em=2,As=0,Qh=1,tu=2,eu=3,ko=4,Tm=5,nu=6,iu=7;var Cd=300,Ur=301,Nr=302,bo=303,Bc=304,al=306,Xi=1e3,Gi=1001,Hc=1002,Fn=1003,wm=1004;var ta=1005;var oi=1006,Ql=1007;var as=1008;var us=1009,Id=1010,Pd=1011,So=1012,su=1013,Js=1014,Vi=1015,ki=1016,ru=1017,ou=1018,Fr=1020,Ld=35902,Dd=1021,kd=1022,ai=1023,Ud=1024,Nd=1025,Pr=1026,Or=1027,au=1028,lu=1029,Fd=1030,cu=1031;var hu=1033,Ra=33776,Ca=33777,Ia=33778,Pa=33779,Gc=35840,Vc=35841,Wc=35842,Xc=35843,qc=36196,Yc=37492,Zc=37496,Kc=37808,$c=37809,Jc=37810,jc=37811,Qc=37812,th=37813,eh=37814,nh=37815,ih=37816,sh=37817,rh=37818,oh=37819,ah=37820,lh=37821,La=36492,ch=36494,hh=36495,Od=36283,uh=36284,fh=36285,dh=36286;var Da=2300,ph=2301,tc=2302,yf=2400,Mf=2401,bf=2402;var Am=3200,Rm=3201;var uu=0,Cm=1,Hi="",Ke="srgb",Xr="srgb-linear",ll="linear",Ue="srgb";var dr=7680;var Sf=519,Im=512,Pm=513,Lm=514,zd=515,Dm=516,km=517,Um=518,Nm=519,Ef=35044,Yi=35048;var Tf="300 es",ls=2e3,ka=2001,Cs=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Rn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],wf=1234567,go=Math.PI/180,Eo=180/Math.PI;function nr(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Rn[i&255]+Rn[i>>8&255]+Rn[i>>16&255]+Rn[i>>24&255]+"-"+Rn[t&255]+Rn[t>>8&255]+"-"+Rn[t>>16&15|64]+Rn[t>>24&255]+"-"+Rn[e&63|128]+Rn[e>>8&255]+"-"+Rn[e>>16&255]+Rn[e>>24&255]+Rn[n&255]+Rn[n>>8&255]+Rn[n>>16&255]+Rn[n>>24&255]).toLowerCase()}function pn(i,t,e){return Math.max(t,Math.min(e,i))}function fu(i,t){return(i%t+t)%t}function Fm(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Om(i,t,e){return i!==t?(e-i)/(t-i):0}function xo(i,t,e){return(1-e)*i+e*t}function zm(i,t,e,n){return xo(i,t,1-Math.exp(-e*n))}function Bm(i,t=1){return t-Math.abs(fu(i,t*2)-t)}function Hm(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Gm(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Vm(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Wm(i,t){return i+Math.random()*(t-i)}function Xm(i){return i*(.5-Math.random())}function qm(i){i!==void 0&&(wf=i);let t=wf+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ym(i){return i*go}function Zm(i){return i*Eo}function Km(i){return(i&i-1)===0&&i!==0}function $m(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Jm(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function jm(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+n)/2),h=o((t+n)/2),u=r((t-n)/2),d=o((t-n)/2),f=r((n-t)/2),p=o((n-t)/2);switch(s){case"XYX":i.set(a*h,l*u,l*d,a*c);break;case"YZY":i.set(l*d,a*h,l*u,a*c);break;case"ZXZ":i.set(l*u,l*d,a*h,a*c);break;case"XZX":i.set(a*h,l*p,l*f,a*c);break;case"YXY":i.set(l*f,a*h,l*p,a*c);break;case"ZYZ":i.set(l*p,l*f,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Rr(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function kn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Uo={DEG2RAD:go,RAD2DEG:Eo,generateUUID:nr,clamp:pn,euclideanModulo:fu,mapLinear:Fm,inverseLerp:Om,lerp:xo,damp:zm,pingpong:Bm,smoothstep:Hm,smootherstep:Gm,randInt:Vm,randFloat:Wm,randFloatSpread:Xm,seededRandom:qm,degToRad:Ym,radToDeg:Zm,isPowerOfTwo:Km,ceilPowerOfTwo:$m,floorPowerOfTwo:Jm,setQuaternionFromProperEuler:jm,normalize:kn,denormalize:Rr},pt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(pn(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},ge=class i{constructor(t,e,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],p=n[8],x=s[0],g=s[3],m=s[6],M=s[1],_=s[4],v=s[7],w=s[2],R=s[5],T=s[8];return r[0]=o*x+a*M+l*w,r[3]=o*g+a*_+l*R,r[6]=o*m+a*v+l*T,r[1]=c*x+h*M+u*w,r[4]=c*g+h*_+u*R,r[7]=c*m+h*v+u*T,r[2]=d*x+f*M+p*w,r[5]=d*g+f*_+p*R,r[8]=d*m+f*v+p*T,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,d=a*l-h*r,f=c*r-o*l,p=e*u+n*d+s*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/p;return t[0]=u*x,t[1]=(s*c-h*n)*x,t[2]=(a*n-s*o)*x,t[3]=d*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-a*e)*x,t[6]=f*x,t[7]=(n*l-c*e)*x,t[8]=(o*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(ec.makeScale(t,e)),this}rotate(t){return this.premultiply(ec.makeRotation(-t)),this}translate(t,e){return this.premultiply(ec.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},ec=new ge;function Bd(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ua(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Qm(){let i=Ua("canvas");return i.style.display="block",i}var Af={};function po(i){i in Af||(Af[i]=!0,console.warn(i))}function t0(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function e0(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function n0(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var Ae={enabled:!0,workingColorSpace:Xr,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===Ue&&(i.r=hs(i.r),i.g=hs(i.g),i.b=hs(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===Ue&&(i.r=Lr(i.r),i.g=Lr(i.g),i.b=Lr(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Hi?ll:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function hs(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Lr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Rf=[.64,.33,.3,.6,.15,.06],Cf=[.2126,.7152,.0722],If=[.3127,.329],Pf=new ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Lf=new ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Ae.define({[Xr]:{primaries:Rf,whitePoint:If,transfer:ll,toXYZ:Pf,fromXYZ:Lf,luminanceCoefficients:Cf,workingColorSpaceConfig:{unpackColorSpace:Ke},outputColorSpaceConfig:{drawingBufferColorSpace:Ke}},[Ke]:{primaries:Rf,whitePoint:If,transfer:Ue,toXYZ:Pf,fromXYZ:Lf,luminanceCoefficients:Cf,outputColorSpaceConfig:{drawingBufferColorSpace:Ke}}});var pr,mh=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{pr===void 0&&(pr=Ua("canvas")),pr.width=t.width,pr.height=t.height;let n=pr.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=pr}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Ua("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=hs(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(hs(e[n]/255)*255):e[n]=hs(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},i0=0,Na=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:i0++}),this.uuid=nr(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(nc(s[o].image)):r.push(nc(s[o]))}else r=nc(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function nc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?mh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var s0=0,Jn=class i extends Cs{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Gi,s=Gi,r=oi,o=as,a=ai,l=us,c=i.DEFAULT_ANISOTROPY,h=Hi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:s0++}),this.uuid=nr(),this.name="",this.source=new Na(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new pt(0,0),this.repeat=new pt(1,1),this.center=new pt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Cd)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Xi:t.x=t.x-Math.floor(t.x);break;case Gi:t.x=t.x<0?0:1;break;case Hc:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Xi:t.y=t.y-Math.floor(t.y);break;case Gi:t.y=t.y<0?0:1;break;case Hc:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Jn.DEFAULT_IMAGE=null;Jn.DEFAULT_MAPPING=Cd;Jn.DEFAULT_ANISOTROPY=1;var sn=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],p=l[9],x=l[2],g=l[6],m=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(p+g)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let _=(c+1)/2,v=(f+1)/2,w=(m+1)/2,R=(h+d)/4,T=(u+x)/4,C=(p+g)/4;return _>v&&_>w?_<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(_),s=R/n,r=T/n):v>w?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=R/s,r=C/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=T/r,s=C/r),this.set(n,s,r,e),this}let M=Math.sqrt((g-p)*(g-p)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(M)<.001&&(M=1),this.x=(g-p)/M,this.y=(u-x)/M,this.z=(d-h)/M,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},gh=class extends Cs{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new sn(0,0,t,e),this.scissorTest=!1,this.viewport=new sn(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:oi,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Jn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Na(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},On=class extends gh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Fa=class extends Jn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Fn,this.minFilter=Fn,this.wrapR=Gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var xh=class extends Jn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Fn,this.minFilter=Fn,this.wrapR=Gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var yn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[o+0],f=r[o+1],p=r[o+2],x=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=p,t[e+3]=x;return}if(u!==x||l!==d||c!==f||h!==p){let g=1-a,m=l*d+c*f+h*p+u*x,M=m>=0?1:-1,_=1-m*m;if(_>Number.EPSILON){let w=Math.sqrt(_),R=Math.atan2(w,m*M);g=Math.sin(g*R)/w,a=Math.sin(a*R)/w}let v=a*M;if(l=l*g+d*v,c=c*g+f*v,h=h*g+p*v,u=u*g+x*v,g===1-a){let w=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=w,c*=w,h*=w,u*=w}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],d=r[o+1],f=r[o+2],p=r[o+3];return t[e]=a*p+h*u+l*f-c*d,t[e+1]=l*p+h*d+c*u-a*f,t[e+2]=c*p+h*f+a*d-l*u,t[e+3]=h*p-a*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),d=l(n/2),f=l(s/2),p=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"YZX":this._x=d*h*u+c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u-d*f*p;break;case"XZY":this._x=d*h*u-c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u+d*f*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(n>a&&n>u){let f=2*Math.sqrt(1+n-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-n-u);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-n-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(pn(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-e;return this._w=f*o+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Df.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Df.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),h=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ic.copy(this).projectOnVector(t),this.sub(ic)}reflect(t){return this.sub(ic.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(pn(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ic=new P,Df=new yn,Li=class{constructor(t=new P(1/0,1/0,1/0),e=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ci.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ci.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Ci.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Ci):Ci.fromBufferAttribute(r,o),Ci.applyMatrix4(t.matrixWorld),this.expandByPoint(Ci);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ea.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ea.copy(n.boundingBox)),ea.applyMatrix4(t.matrixWorld),this.union(ea)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ci),Ci.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ao),na.subVectors(this.max,ao),mr.subVectors(t.a,ao),gr.subVectors(t.b,ao),xr.subVectors(t.c,ao),Ms.subVectors(gr,mr),bs.subVectors(xr,gr),Hs.subVectors(mr,xr);let e=[0,-Ms.z,Ms.y,0,-bs.z,bs.y,0,-Hs.z,Hs.y,Ms.z,0,-Ms.x,bs.z,0,-bs.x,Hs.z,0,-Hs.x,-Ms.y,Ms.x,0,-bs.y,bs.x,0,-Hs.y,Hs.x,0];return!sc(e,mr,gr,xr,na)||(e=[1,0,0,0,1,0,0,0,1],!sc(e,mr,gr,xr,na))?!1:(ia.crossVectors(Ms,bs),e=[ia.x,ia.y,ia.z],sc(e,mr,gr,xr,na))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ci).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ci).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ts[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ts[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ts[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ts[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ts[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ts[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ts[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ts[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ts),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},ts=[new P,new P,new P,new P,new P,new P,new P,new P],Ci=new P,ea=new Li,mr=new P,gr=new P,xr=new P,Ms=new P,bs=new P,Hs=new P,ao=new P,na=new P,ia=new P,Gs=new P;function sc(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Gs.fromArray(i,r);let a=s.x*Math.abs(Gs.x)+s.y*Math.abs(Gs.y)+s.z*Math.abs(Gs.z),l=t.dot(Gs),c=e.dot(Gs),h=n.dot(Gs);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var r0=new Li,lo=new P,rc=new P,qi=class{constructor(t=new P,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):r0.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;lo.subVectors(t,this.center);let e=lo.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(lo,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(rc.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(lo.copy(t.center).add(rc)),this.expandByPoint(lo.copy(t.center).sub(rc))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},es=new P,oc=new P,sa=new P,Ss=new P,ac=new P,ra=new P,lc=new P,Oa=class{constructor(t=new P,e=new P(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,es)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=es.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(es.copy(this.origin).addScaledVector(this.direction,e),es.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){oc.copy(t).add(e).multiplyScalar(.5),sa.copy(e).sub(t).normalize(),Ss.copy(this.origin).sub(oc);let r=t.distanceTo(e)*.5,o=-this.direction.dot(sa),a=Ss.dot(this.direction),l=-Ss.dot(sa),c=Ss.lengthSq(),h=Math.abs(1-o*o),u,d,f,p;if(h>0)if(u=o*l-a,d=o*a-l,p=r*h,u>=0)if(d>=-p)if(d<=p){let x=1/h;u*=x,d*=x,f=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-p?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=p?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(oc).addScaledVector(sa,d),f}intersectSphere(t,e){es.subVectors(t.center,this.origin);let n=es.dot(this.direction),s=es.dot(es)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(r=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,es)!==null}intersectTriangle(t,e,n,s,r){ac.subVectors(e,t),ra.subVectors(n,t),lc.crossVectors(ac,ra);let o=this.direction.dot(lc),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ss.subVectors(this.origin,t);let l=a*this.direction.dot(ra.crossVectors(Ss,ra));if(l<0)return null;let c=a*this.direction.dot(ac.cross(Ss));if(c<0||l+c>o)return null;let h=-a*Ss.dot(lc);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ue=class i{constructor(t,e,n,s,r,o,a,l,c,h,u,d,f,p,x,g){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,h,u,d,f,p,x,g)}set(t,e,n,s,r,o,a,l,c,h,u,d,f,p,x,g){let m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=p,m[11]=x,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/_r.setFromMatrixColumn(t,0).length(),r=1/_r.setFromMatrixColumn(t,1).length(),o=1/_r.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let d=o*h,f=o*u,p=a*h,x=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+p*c,e[5]=d-x*c,e[9]=-a*l,e[2]=x-d*c,e[6]=p+f*c,e[10]=o*l}else if(t.order==="YXZ"){let d=l*h,f=l*u,p=c*h,x=c*u;e[0]=d+x*a,e[4]=p*a-f,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=f*a-p,e[6]=x+d*a,e[10]=o*l}else if(t.order==="ZXY"){let d=l*h,f=l*u,p=c*h,x=c*u;e[0]=d-x*a,e[4]=-o*u,e[8]=p+f*a,e[1]=f+p*a,e[5]=o*h,e[9]=x-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let d=o*h,f=o*u,p=a*h,x=a*u;e[0]=l*h,e[4]=p*c-f,e[8]=d*c+x,e[1]=l*u,e[5]=x*c+d,e[9]=f*c-p,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let d=o*l,f=o*c,p=a*l,x=a*c;e[0]=l*h,e[4]=x-d*u,e[8]=p*u+f,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*u+p,e[10]=d-x*u}else if(t.order==="XZY"){let d=o*l,f=o*c,p=a*l,x=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+x,e[5]=o*h,e[9]=f*u-p,e[2]=p*u-f,e[6]=a*h,e[10]=x*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(o0,t,a0)}lookAt(t,e,n){let s=this.elements;return si.subVectors(t,e),si.lengthSq()===0&&(si.z=1),si.normalize(),Es.crossVectors(n,si),Es.lengthSq()===0&&(Math.abs(n.z)===1?si.x+=1e-4:si.z+=1e-4,si.normalize(),Es.crossVectors(n,si)),Es.normalize(),oa.crossVectors(si,Es),s[0]=Es.x,s[4]=oa.x,s[8]=si.x,s[1]=Es.y,s[5]=oa.y,s[9]=si.y,s[2]=Es.z,s[6]=oa.z,s[10]=si.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],p=n[2],x=n[6],g=n[10],m=n[14],M=n[3],_=n[7],v=n[11],w=n[15],R=s[0],T=s[4],C=s[8],b=s[12],E=s[1],D=s[5],Y=s[9],H=s[13],X=s[2],Z=s[6],O=s[10],ct=s[14],K=s[3],W=s[7],j=s[11],wt=s[15];return r[0]=o*R+a*E+l*X+c*K,r[4]=o*T+a*D+l*Z+c*W,r[8]=o*C+a*Y+l*O+c*j,r[12]=o*b+a*H+l*ct+c*wt,r[1]=h*R+u*E+d*X+f*K,r[5]=h*T+u*D+d*Z+f*W,r[9]=h*C+u*Y+d*O+f*j,r[13]=h*b+u*H+d*ct+f*wt,r[2]=p*R+x*E+g*X+m*K,r[6]=p*T+x*D+g*Z+m*W,r[10]=p*C+x*Y+g*O+m*j,r[14]=p*b+x*H+g*ct+m*wt,r[3]=M*R+_*E+v*X+w*K,r[7]=M*T+_*D+v*Z+w*W,r[11]=M*C+_*Y+v*O+w*j,r[15]=M*b+_*H+v*ct+w*wt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],p=t[3],x=t[7],g=t[11],m=t[15];return p*(+r*l*u-s*c*u-r*a*d+n*c*d+s*a*f-n*l*f)+x*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*h-r*l*h)+g*(+e*c*u-e*a*f-r*o*u+n*o*f+r*a*h-n*c*h)+m*(-s*a*h-e*l*u+e*a*d+s*o*u-n*o*d+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],p=t[12],x=t[13],g=t[14],m=t[15],M=u*g*c-x*d*c+x*l*f-a*g*f-u*l*m+a*d*m,_=p*d*c-h*g*c-p*l*f+o*g*f+h*l*m-o*d*m,v=h*x*c-p*u*c+p*a*f-o*x*f-h*a*m+o*u*m,w=p*u*l-h*x*l-p*a*d+o*x*d+h*a*g-o*u*g,R=e*M+n*_+s*v+r*w;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/R;return t[0]=M*T,t[1]=(x*d*r-u*g*r-x*s*f+n*g*f+u*s*m-n*d*m)*T,t[2]=(a*g*r-x*l*r+x*s*c-n*g*c-a*s*m+n*l*m)*T,t[3]=(u*l*r-a*d*r-u*s*c+n*d*c+a*s*f-n*l*f)*T,t[4]=_*T,t[5]=(h*g*r-p*d*r+p*s*f-e*g*f-h*s*m+e*d*m)*T,t[6]=(p*l*r-o*g*r-p*s*c+e*g*c+o*s*m-e*l*m)*T,t[7]=(o*d*r-h*l*r+h*s*c-e*d*c-o*s*f+e*l*f)*T,t[8]=v*T,t[9]=(p*u*r-h*x*r-p*n*f+e*x*f+h*n*m-e*u*m)*T,t[10]=(o*x*r-p*a*r+p*n*c-e*x*c-o*n*m+e*a*m)*T,t[11]=(h*a*r-o*u*r-h*n*c+e*u*c+o*n*f-e*a*f)*T,t[12]=w*T,t[13]=(h*x*s-p*u*s+p*n*d-e*x*d-h*n*g+e*u*g)*T,t[14]=(p*a*s-o*x*s-p*n*l+e*x*l+o*n*g-e*a*g)*T,t[15]=(o*u*s-h*a*s+h*n*l-e*u*l-o*n*d+e*a*d)*T,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,d=r*c,f=r*h,p=r*u,x=o*h,g=o*u,m=a*u,M=l*c,_=l*h,v=l*u,w=n.x,R=n.y,T=n.z;return s[0]=(1-(x+m))*w,s[1]=(f+v)*w,s[2]=(p-_)*w,s[3]=0,s[4]=(f-v)*R,s[5]=(1-(d+m))*R,s[6]=(g+M)*R,s[7]=0,s[8]=(p+_)*T,s[9]=(g-M)*T,s[10]=(1-(d+x))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=_r.set(s[0],s[1],s[2]).length(),o=_r.set(s[4],s[5],s[6]).length(),a=_r.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Ii.copy(this);let c=1/r,h=1/o,u=1/a;return Ii.elements[0]*=c,Ii.elements[1]*=c,Ii.elements[2]*=c,Ii.elements[4]*=h,Ii.elements[5]*=h,Ii.elements[6]*=h,Ii.elements[8]*=u,Ii.elements[9]*=u,Ii.elements[10]*=u,e.setFromRotationMatrix(Ii),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=ls){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),d=(n+s)/(n-s),f,p;if(a===ls)f=-(o+r)/(o-r),p=-2*o*r/(o-r);else if(a===ka)f=-o/(o-r),p=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=p,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=ls){let l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(o-r),d=(e+t)*c,f=(n+s)*h,p,x;if(a===ls)p=(o+r)*u,x=-2*u;else if(a===ka)p=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=x,l[14]=-p,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},_r=new P,Ii=new ue,o0=new P(0,0,0),a0=new P(1,1,1),Es=new P,oa=new P,si=new P,kf=new ue,Uf=new yn,bn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(pn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-pn(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(pn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-pn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(pn(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-pn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return kf.makeRotationFromQuaternion(t),this.setFromRotationMatrix(kf,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Uf.setFromEuler(this),this.setFromQuaternion(Uf,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};bn.DEFAULT_ORDER="XYZ";var za=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},l0=0,Nf=new P,vr=new yn,ns=new ue,aa=new P,co=new P,c0=new P,h0=new yn,Ff=new P(1,0,0),Of=new P(0,1,0),zf=new P(0,0,1),Bf={type:"added"},u0={type:"removed"},yr={type:"childadded",child:null},cc={type:"childremoved",child:null},rn=class i extends Cs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:l0++}),this.uuid=nr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new P,e=new bn,n=new yn,s=new P(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ue},normalMatrix:{value:new ge}}),this.matrix=new ue,this.matrixWorld=new ue,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new za,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return vr.setFromAxisAngle(t,e),this.quaternion.multiply(vr),this}rotateOnWorldAxis(t,e){return vr.setFromAxisAngle(t,e),this.quaternion.premultiply(vr),this}rotateX(t){return this.rotateOnAxis(Ff,t)}rotateY(t){return this.rotateOnAxis(Of,t)}rotateZ(t){return this.rotateOnAxis(zf,t)}translateOnAxis(t,e){return Nf.copy(t).applyQuaternion(this.quaternion),this.position.add(Nf.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ff,t)}translateY(t){return this.translateOnAxis(Of,t)}translateZ(t){return this.translateOnAxis(zf,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ns.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?aa.copy(t):aa.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),co.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ns.lookAt(co,aa,this.up):ns.lookAt(aa,co,this.up),this.quaternion.setFromRotationMatrix(ns),s&&(ns.extractRotation(s.matrixWorld),vr.setFromRotationMatrix(ns),this.quaternion.premultiply(vr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Bf),yr.child=t,this.dispatchEvent(yr),yr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(u0),cc.child=t,this.dispatchEvent(cc),cc.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ns.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ns.multiply(t.parent.matrixWorld)),t.applyMatrix4(ns),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Bf),yr.child=t,this.dispatchEvent(yr),yr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,t,c0),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,h0,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),p=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};rn.DEFAULT_UP=new P(0,1,0);rn.DEFAULT_MATRIX_AUTO_UPDATE=!0;rn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Pi=new P,is=new P,hc=new P,ss=new P,Mr=new P,br=new P,Hf=new P,uc=new P,fc=new P,dc=new P,pc=new sn,mc=new sn,gc=new sn,Ks=class i{constructor(t=new P,e=new P,n=new P){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Pi.subVectors(t,e),s.cross(Pi);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Pi.subVectors(s,e),is.subVectors(n,e),hc.subVectors(t,e);let o=Pi.dot(Pi),a=Pi.dot(is),l=Pi.dot(hc),c=is.dot(is),h=is.dot(hc),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-a*h)*d,p=(o*h-a*l)*d;return r.set(1-f-p,p,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,ss)===null?!1:ss.x>=0&&ss.y>=0&&ss.x+ss.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,ss)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ss.x),l.addScaledVector(o,ss.y),l.addScaledVector(a,ss.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return pc.setScalar(0),mc.setScalar(0),gc.setScalar(0),pc.fromBufferAttribute(t,e),mc.fromBufferAttribute(t,n),gc.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(pc,r.x),o.addScaledVector(mc,r.y),o.addScaledVector(gc,r.z),o}static isFrontFacing(t,e,n,s){return Pi.subVectors(n,e),is.subVectors(t,e),Pi.cross(is).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Pi.subVectors(this.c,this.b),is.subVectors(this.a,this.b),Pi.cross(is).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;Mr.subVectors(s,n),br.subVectors(r,n),uc.subVectors(t,n);let l=Mr.dot(uc),c=br.dot(uc);if(l<=0&&c<=0)return e.copy(n);fc.subVectors(t,s);let h=Mr.dot(fc),u=br.dot(fc);if(h>=0&&u<=h)return e.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(n).addScaledVector(Mr,o);dc.subVectors(t,r);let f=Mr.dot(dc),p=br.dot(dc);if(p>=0&&f<=p)return e.copy(r);let x=f*c-l*p;if(x<=0&&c>=0&&p<=0)return a=c/(c-p),e.copy(n).addScaledVector(br,a);let g=h*p-f*u;if(g<=0&&u-h>=0&&f-p>=0)return Hf.subVectors(r,s),a=(u-h)/(u-h+(f-p)),e.copy(s).addScaledVector(Hf,a);let m=1/(g+x+d);return o=x*m,a=d*m,e.copy(n).addScaledVector(Mr,o).addScaledVector(br,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Hd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ts={h:0,s:0,l:0},la={h:0,s:0,l:0};function xc(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var ft=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ke){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Ae.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Ae.workingColorSpace){return this.r=t,this.g=e,this.b=n,Ae.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Ae.workingColorSpace){if(t=fu(t,1),e=pn(e,0,1),n=pn(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=xc(o,r,t+1/3),this.g=xc(o,r,t),this.b=xc(o,r,t-1/3)}return Ae.toWorkingColorSpace(this,s),this}setStyle(t,e=Ke){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ke){let n=Hd[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=hs(t.r),this.g=hs(t.g),this.b=hs(t.b),this}copyLinearToSRGB(t){return this.r=Lr(t.r),this.g=Lr(t.g),this.b=Lr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ke){return Ae.fromWorkingColorSpace(Cn.copy(this),t),Math.round(pn(Cn.r*255,0,255))*65536+Math.round(pn(Cn.g*255,0,255))*256+Math.round(pn(Cn.b*255,0,255))}getHexString(t=Ke){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Ae.workingColorSpace){Ae.fromWorkingColorSpace(Cn.copy(this),e);let n=Cn.r,s=Cn.g,r=Cn.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Ae.workingColorSpace){return Ae.fromWorkingColorSpace(Cn.copy(this),e),t.r=Cn.r,t.g=Cn.g,t.b=Cn.b,t}getStyle(t=Ke){Ae.fromWorkingColorSpace(Cn.copy(this),t);let e=Cn.r,n=Cn.g,s=Cn.b;return t!==Ke?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Ts),this.setHSL(Ts.h+t,Ts.s+e,Ts.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Ts),t.getHSL(la);let n=xo(Ts.h,la.h,e),s=xo(Ts.s,la.s,e),r=xo(Ts.l,la.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Cn=new ft;ft.NAMES=Hd;var f0=0,fs=class extends Cs{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:f0++}),this.uuid=nr(),this.name="",this.blending=cs,this.side=Rs,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pc,this.blendDst=Lc,this.blendEquation=Zs,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ft(0,0,0),this.blendAlpha=0,this.depthFunc=kr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sf,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=dr,this.stencilZFail=dr,this.stencilZPass=dr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==cs&&(n.blending=this.blending),this.side!==Rs&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Pc&&(n.blendSrc=this.blendSrc),this.blendDst!==Lc&&(n.blendDst=this.blendDst),this.blendEquation!==Zs&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==kr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sf&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==dr&&(n.stencilFail=this.stencilFail),this.stencilZFail!==dr&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==dr&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Sn=class extends fs{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=jh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var cn=new P,ca=new pt,Ie=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Ef,this.updateRanges=[],this.gpuType=Vi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ca.fromBufferAttribute(this,e),ca.applyMatrix3(t),this.setXY(e,ca.x,ca.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)cn.fromBufferAttribute(this,e),cn.applyMatrix3(t),this.setXYZ(e,cn.x,cn.y,cn.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)cn.fromBufferAttribute(this,e),cn.applyMatrix4(t),this.setXYZ(e,cn.x,cn.y,cn.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)cn.fromBufferAttribute(this,e),cn.applyNormalMatrix(t),this.setXYZ(e,cn.x,cn.y,cn.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)cn.fromBufferAttribute(this,e),cn.transformDirection(t),this.setXYZ(e,cn.x,cn.y,cn.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Rr(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=kn(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Rr(e,this.array)),e}setX(t,e){return this.normalized&&(e=kn(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Rr(e,this.array)),e}setY(t,e){return this.normalized&&(e=kn(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Rr(e,this.array)),e}setZ(t,e){return this.normalized&&(e=kn(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Rr(e,this.array)),e}setW(t,e){return this.normalized&&(e=kn(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=kn(e,this.array),n=kn(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=kn(e,this.array),n=kn(n,this.array),s=kn(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=kn(e,this.array),n=kn(n,this.array),s=kn(s,this.array),r=kn(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ef&&(t.usage=this.usage),t}};var Ba=class extends Ie{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ha=class extends Ie{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Ee=class extends Ie{constructor(t,e,n){super(new Float32Array(t),e,n)}},d0=0,gi=new ue,_c=new rn,Sr=new P,ri=new Li,ho=new Li,_n=new P,qe=class i extends Cs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:d0++}),this.uuid=nr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Bd(t)?Ha:Ba)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ge().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return gi.makeRotationFromQuaternion(t),this.applyMatrix4(gi),this}rotateX(t){return gi.makeRotationX(t),this.applyMatrix4(gi),this}rotateY(t){return gi.makeRotationY(t),this.applyMatrix4(gi),this}rotateZ(t){return gi.makeRotationZ(t),this.applyMatrix4(gi),this}translate(t,e,n){return gi.makeTranslation(t,e,n),this.applyMatrix4(gi),this}scale(t,e,n){return gi.makeScale(t,e,n),this.applyMatrix4(gi),this}lookAt(t){return _c.lookAt(t),_c.updateMatrix(),this.applyMatrix4(_c.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sr).negate(),this.translate(Sr.x,Sr.y,Sr.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Ee(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Li);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];ri.setFromBufferAttribute(r),this.morphTargetsRelative?(_n.addVectors(this.boundingBox.min,ri.min),this.boundingBox.expandByPoint(_n),_n.addVectors(this.boundingBox.max,ri.max),this.boundingBox.expandByPoint(_n)):(this.boundingBox.expandByPoint(ri.min),this.boundingBox.expandByPoint(ri.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new qi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){let n=this.boundingSphere.center;if(ri.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];ho.setFromBufferAttribute(a),this.morphTargetsRelative?(_n.addVectors(ri.min,ho.min),ri.expandByPoint(_n),_n.addVectors(ri.max,ho.max),ri.expandByPoint(_n)):(ri.expandByPoint(ho.min),ri.expandByPoint(ho.max))}ri.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)_n.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(_n));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)_n.fromBufferAttribute(a,c),l&&(Sr.fromBufferAttribute(t,c),_n.add(Sr)),s=Math.max(s,n.distanceToSquared(_n))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ie(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let C=0;C<n.count;C++)a[C]=new P,l[C]=new P;let c=new P,h=new P,u=new P,d=new pt,f=new pt,p=new pt,x=new P,g=new P;function m(C,b,E){c.fromBufferAttribute(n,C),h.fromBufferAttribute(n,b),u.fromBufferAttribute(n,E),d.fromBufferAttribute(r,C),f.fromBufferAttribute(r,b),p.fromBufferAttribute(r,E),h.sub(c),u.sub(c),f.sub(d),p.sub(d);let D=1/(f.x*p.y-p.x*f.y);isFinite(D)&&(x.copy(h).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(D),g.copy(u).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(D),a[C].add(x),a[b].add(x),a[E].add(x),l[C].add(g),l[b].add(g),l[E].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let C=0,b=M.length;C<b;++C){let E=M[C],D=E.start,Y=E.count;for(let H=D,X=D+Y;H<X;H+=3)m(t.getX(H+0),t.getX(H+1),t.getX(H+2))}let _=new P,v=new P,w=new P,R=new P;function T(C){w.fromBufferAttribute(s,C),R.copy(w);let b=a[C];_.copy(b),_.sub(w.multiplyScalar(w.dot(b))).normalize(),v.crossVectors(R,b);let D=v.dot(l[C])<0?-1:1;o.setXYZW(C,_.x,_.y,_.z,D)}for(let C=0,b=M.length;C<b;++C){let E=M[C],D=E.start,Y=E.count;for(let H=D,X=D+Y;H<X;H+=3)T(t.getX(H+0)),T(t.getX(H+1)),T(t.getX(H+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ie(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new P,r=new P,o=new P,a=new P,l=new P,c=new P,h=new P,u=new P;if(t)for(let d=0,f=t.count;d<f;d+=3){let p=t.getX(d+0),x=t.getX(d+1),g=t.getX(d+2);s.fromBufferAttribute(e,p),r.fromBufferAttribute(e,x),o.fromBufferAttribute(e,g),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,p),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,g),a.add(h),l.add(h),c.add(h),n.setXYZ(p,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)_n.fromBufferAttribute(t,e),_n.normalize(),t.setXYZ(e,_n.x,_n.y,_n.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h),f=0,p=0;for(let x=0,g=l.length;x<g;x++){a.isInterleavedBufferAttribute?f=l[x]*a.data.stride+a.offset:f=l[x]*h;for(let m=0;m<h;m++)d[p++]=c[f++]}return new Ie(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=t(d,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Gf=new ue,Vs=new Oa,ha=new qi,Vf=new P,ua=new P,fa=new P,da=new P,vc=new P,pa=new P,Wf=new P,ma=new P,$t=class extends rn{constructor(t=new qe,e=new Sn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){pa.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(vc.fromBufferAttribute(u,t),o?pa.addScaledVector(vc,h):pa.addScaledVector(vc.sub(e),h))}e.add(pa)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ha.copy(n.boundingSphere),ha.applyMatrix4(r),Vs.copy(t.ray).recast(t.near),!(ha.containsPoint(Vs.origin)===!1&&(Vs.intersectSphere(ha,Vf)===null||Vs.origin.distanceToSquared(Vf)>(t.far-t.near)**2))&&(Gf.copy(r).invert(),Vs.copy(t.ray).applyMatrix4(Gf),!(n.boundingBox!==null&&Vs.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Vs)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let p=0,x=d.length;p<x;p++){let g=d[p],m=o[g.materialIndex],M=Math.max(g.start,f.start),_=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let v=M,w=_;v<w;v+=3){let R=a.getX(v),T=a.getX(v+1),C=a.getX(v+2);s=ga(this,m,t,n,c,h,u,R,T,C),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let p=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){let M=a.getX(g),_=a.getX(g+1),v=a.getX(g+2);s=ga(this,o,t,n,c,h,u,M,_,v),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let p=0,x=d.length;p<x;p++){let g=d[p],m=o[g.materialIndex],M=Math.max(g.start,f.start),_=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let v=M,w=_;v<w;v+=3){let R=v,T=v+1,C=v+2;s=ga(this,m,t,n,c,h,u,R,T,C),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let p=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){let M=g,_=g+1,v=g+2;s=ga(this,o,t,n,c,h,u,M,_,v),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function p0(i,t,e,n,s,r,o,a){let l;if(t.side===vn?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===Rs,a),l===null)return null;ma.copy(a),ma.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(ma);return c<e.near||c>e.far?null:{distance:c,point:ma.clone(),object:i}}function ga(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,ua),i.getVertexPosition(l,fa),i.getVertexPosition(c,da);let h=p0(i,t,e,n,ua,fa,da,Wf);if(h){let u=new P;Ks.getBarycoord(Wf,ua,fa,da,u),s&&(h.uv=Ks.getInterpolatedAttribute(s,a,l,c,u,new pt)),r&&(h.uv1=Ks.getInterpolatedAttribute(r,a,l,c,u,new pt)),o&&(h.normal=Ks.getInterpolatedAttribute(o,a,l,c,u,new P),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new P,materialIndex:0};Ks.getNormal(ua,fa,da,d.normal),h.face=d,h.barycoord=u}return h}var Oe=class i extends qe{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],d=0,f=0;p("z","y","x",-1,-1,n,e,t,o,r,0),p("z","y","x",1,-1,n,e,-t,o,r,1),p("x","z","y",1,1,t,n,e,s,o,2),p("x","z","y",1,-1,t,n,-e,s,o,3),p("x","y","z",1,-1,t,e,n,s,r,4),p("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Ee(c,3)),this.setAttribute("normal",new Ee(h,3)),this.setAttribute("uv",new Ee(u,2));function p(x,g,m,M,_,v,w,R,T,C,b){let E=v/T,D=w/C,Y=v/2,H=w/2,X=R/2,Z=T+1,O=C+1,ct=0,K=0,W=new P;for(let j=0;j<O;j++){let wt=j*D-H;for(let Yt=0;Yt<Z;Yt++){let te=Yt*E-Y;W[x]=te*M,W[g]=wt*_,W[m]=X,c.push(W.x,W.y,W.z),W[x]=0,W[g]=0,W[m]=R>0?1:-1,h.push(W.x,W.y,W.z),u.push(Yt/T),u.push(1-j/C),ct+=1}}for(let j=0;j<C;j++)for(let wt=0;wt<T;wt++){let Yt=d+wt+Z*j,te=d+wt+Z*(j+1),rt=d+(wt+1)+Z*(j+1),mt=d+(wt+1)+Z*j;l.push(Yt,te,mt),l.push(te,rt,mt),K+=6}a.addGroup(f,K,b),f+=K,d+=ct}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function zr(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Un(i){let t={};for(let e=0;e<i.length;e++){let n=zr(i[e]);for(let s in n)t[s]=n[s]}return t}function m0(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Gd(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Ae.workingColorSpace}var Zi={clone:zr,merge:Un},g0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,x0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Be=class extends fs{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=g0,this.fragmentShader=x0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=zr(t.uniforms),this.uniformsGroups=m0(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Ga=class extends rn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ue,this.projectionMatrix=new ue,this.projectionMatrixInverse=new ue,this.coordinateSystem=ls}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ws=new P,Xf=new pt,qf=new pt,Nn=class extends Ga{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Eo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(go*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Eo*2*Math.atan(Math.tan(go*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ws.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ws.x,ws.y).multiplyScalar(-t/ws.z),ws.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ws.x,ws.y).multiplyScalar(-t/ws.z)}getViewSize(t,e){return this.getViewBounds(t,Xf,qf),e.subVectors(qf,Xf)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(go*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Er=-90,Tr=1,_h=class extends rn{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Nn(Er,Tr,t,e);s.layers=this.layers,this.add(s);let r=new Nn(Er,Tr,t,e);r.layers=this.layers,this.add(r);let o=new Nn(Er,Tr,t,e);o.layers=this.layers,this.add(o);let a=new Nn(Er,Tr,t,e);a.layers=this.layers,this.add(a);let l=new Nn(Er,Tr,t,e);l.layers=this.layers,this.add(l);let c=new Nn(Er,Tr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===ls)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===ka)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Va=class extends Jn{constructor(t,e,n,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Ur,super(t,e,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},vh=class extends On{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Va(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:oi}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Oe(5,5,5),r=new Be({name:"CubemapFromEquirect",uniforms:zr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:vn,blending:Wi});r.uniforms.tEquirect.value=e;let o=new $t(s,r),a=e.minFilter;return e.minFilter===as&&(e.minFilter=oi),new _h(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},yc=new P,_0=new P,v0=new ge,os=class{constructor(t=new P(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=yc.subVectors(n,e).cross(_0.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(yc),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||v0.getNormalMatrix(t),s=this.coplanarPoint(yc).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ws=new qi,xa=new P,To=class{constructor(t=new os,e=new os,n=new os,s=new os,r=new os,o=new os){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ls){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],f=s[8],p=s[9],x=s[10],g=s[11],m=s[12],M=s[13],_=s[14],v=s[15];if(n[0].setComponents(l-r,d-c,g-f,v-m).normalize(),n[1].setComponents(l+r,d+c,g+f,v+m).normalize(),n[2].setComponents(l+o,d+h,g+p,v+M).normalize(),n[3].setComponents(l-o,d-h,g-p,v-M).normalize(),n[4].setComponents(l-a,d-u,g-x,v-_).normalize(),e===ls)n[5].setComponents(l+a,d+u,g+x,v+_).normalize();else if(e===ka)n[5].setComponents(a,u,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ws.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ws.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ws)}intersectsSprite(t){return Ws.center.set(0,0,0),Ws.radius=.7071067811865476,Ws.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ws)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(xa.x=s.normal.x>0?t.max.x:t.min.x,xa.y=s.normal.y>0?t.max.y:t.min.y,xa.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(xa)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Vd(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function y0(i){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<u.length;f++){let p=u[d],x=u[f];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,p=u.length;f<p;f++){let x=u[f];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var zn=class i extends qe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=t/a,d=e/l,f=[],p=[],x=[],g=[];for(let m=0;m<h;m++){let M=m*d-o;for(let _=0;_<c;_++){let v=_*u-r;p.push(v,-M,0),x.push(0,0,1),g.push(_/a),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let M=0;M<a;M++){let _=M+c*m,v=M+c*(m+1),w=M+1+c*(m+1),R=M+1+c*m;f.push(_,v,R),f.push(v,w,R)}this.setIndex(f),this.setAttribute("position",new Ee(p,3)),this.setAttribute("normal",new Ee(x,3)),this.setAttribute("uv",new Ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},M0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,b0=`#ifdef USE_ALPHAHASH
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
#endif`,S0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,E0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,T0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,w0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,A0=`#ifdef USE_AOMAP
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
#endif`,R0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,C0=`#ifdef USE_BATCHING
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
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,I0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,P0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,L0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,D0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,k0=`#ifdef USE_IRIDESCENCE
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
#endif`,U0=`#ifdef USE_BUMPMAP
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
#endif`,N0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,F0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,O0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,z0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,B0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,H0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,G0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,V0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,W0=`#define PI 3.141592653589793
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
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
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
} // validated`,X0=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,q0=`vec3 transformedNormal = objectNormal;
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
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Y0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Z0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,K0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,$0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,J0="gl_FragColor = linearToOutputTexel( gl_FragColor );",j0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Q0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,tg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,eg=`#ifdef USE_ENVMAP
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
#endif`,ng=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ig=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,sg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,rg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,og=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ag=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,lg=`#ifdef USE_GRADIENTMAP
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
}`,cg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,hg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ug=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,fg=`uniform bool receiveShadow;
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
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
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
#endif`,dg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
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
#endif`,pg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,mg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,gg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,xg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_g=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
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
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
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
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
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
#endif`,vg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
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
		float v = 0.5 / ( gv + gl );
		return saturate(v);
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
	vec3 f0 = material.specularColor;
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
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
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
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
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
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
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
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,yg=`
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
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
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
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
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
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Mg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
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
#endif`,bg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Sg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Eg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ag=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Rg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Cg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Ig=`#if defined( USE_POINTS_UV )
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
#endif`,Pg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Lg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Dg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,kg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ug=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ng=`#ifdef USE_MORPHTARGETS
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
#endif`,Fg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Og=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
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
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,zg=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Bg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Vg=`#ifdef USE_NORMALMAP
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
#endif`,Wg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Xg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,qg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Yg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Zg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Kg=`vec3 packNormalToRGB( const in vec3 normal ) {
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
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,$g=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Jg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,jg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Qg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,tx=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ex=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,nx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
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
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
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
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
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
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,ix=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,sx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
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
#endif`,rx=`float getShadowMask() {
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
	#if NUM_POINT_LIGHT_SHADOWS > 0
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
}`,ox=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ax=`#ifdef USE_SKINNING
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
#endif`,lx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,cx=`#ifdef USE_SKINNING
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
#endif`,hx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ux=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,fx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,dx=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,px=`#ifdef USE_TRANSMISSION
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
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,mx=`#ifdef USE_TRANSMISSION
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
#endif`,gx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,xx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,_x=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,vx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,yx=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Mx=`uniform sampler2D t2D;
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
}`,bx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ex=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Tx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wx=`#include <common>
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
}`,Ax=`#if DEPTH_PACKING == 3200
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
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Rx=`#define DISTANCE
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
}`,Cx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Ix=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Px=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lx=`uniform float scale;
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
}`,Dx=`uniform vec3 diffuse;
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
}`,kx=`#include <common>
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
}`,Ux=`uniform vec3 diffuse;
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
}`,Nx=`#define LAMBERT
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
}`,Fx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
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
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
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
}`,Ox=`#define MATCAP
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
}`,zx=`#define MATCAP
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
}`,Bx=`#define NORMAL
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
}`,Hx=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
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
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Gx=`#define PHONG
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
}`,Vx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
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
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
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
}`,Wx=`#define STANDARD
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
}`,Xx=`#define STANDARD
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
#include <packing>
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
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
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
}`,qx=`#define TOON
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
}`,Yx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
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
}`,Zx=`uniform float size;
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
}`,Kx=`uniform vec3 diffuse;
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
}`,$x=`#include <common>
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
}`,Jx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
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
}`,jx=`uniform float rotation;
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
}`,Qx=`uniform vec3 diffuse;
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
}`,_e={alphahash_fragment:M0,alphahash_pars_fragment:b0,alphamap_fragment:S0,alphamap_pars_fragment:E0,alphatest_fragment:T0,alphatest_pars_fragment:w0,aomap_fragment:A0,aomap_pars_fragment:R0,batching_pars_vertex:C0,batching_vertex:I0,begin_vertex:P0,beginnormal_vertex:L0,bsdfs:D0,iridescence_fragment:k0,bumpmap_pars_fragment:U0,clipping_planes_fragment:N0,clipping_planes_pars_fragment:F0,clipping_planes_pars_vertex:O0,clipping_planes_vertex:z0,color_fragment:B0,color_pars_fragment:H0,color_pars_vertex:G0,color_vertex:V0,common:W0,cube_uv_reflection_fragment:X0,defaultnormal_vertex:q0,displacementmap_pars_vertex:Y0,displacementmap_vertex:Z0,emissivemap_fragment:K0,emissivemap_pars_fragment:$0,colorspace_fragment:J0,colorspace_pars_fragment:j0,envmap_fragment:Q0,envmap_common_pars_fragment:tg,envmap_pars_fragment:eg,envmap_pars_vertex:ng,envmap_physical_pars_fragment:dg,envmap_vertex:ig,fog_vertex:sg,fog_pars_vertex:rg,fog_fragment:og,fog_pars_fragment:ag,gradientmap_pars_fragment:lg,lightmap_pars_fragment:cg,lights_lambert_fragment:hg,lights_lambert_pars_fragment:ug,lights_pars_begin:fg,lights_toon_fragment:pg,lights_toon_pars_fragment:mg,lights_phong_fragment:gg,lights_phong_pars_fragment:xg,lights_physical_fragment:_g,lights_physical_pars_fragment:vg,lights_fragment_begin:yg,lights_fragment_maps:Mg,lights_fragment_end:bg,logdepthbuf_fragment:Sg,logdepthbuf_pars_fragment:Eg,logdepthbuf_pars_vertex:Tg,logdepthbuf_vertex:wg,map_fragment:Ag,map_pars_fragment:Rg,map_particle_fragment:Cg,map_particle_pars_fragment:Ig,metalnessmap_fragment:Pg,metalnessmap_pars_fragment:Lg,morphinstance_vertex:Dg,morphcolor_vertex:kg,morphnormal_vertex:Ug,morphtarget_pars_vertex:Ng,morphtarget_vertex:Fg,normal_fragment_begin:Og,normal_fragment_maps:zg,normal_pars_fragment:Bg,normal_pars_vertex:Hg,normal_vertex:Gg,normalmap_pars_fragment:Vg,clearcoat_normal_fragment_begin:Wg,clearcoat_normal_fragment_maps:Xg,clearcoat_pars_fragment:qg,iridescence_pars_fragment:Yg,opaque_fragment:Zg,packing:Kg,premultiplied_alpha_fragment:$g,project_vertex:Jg,dithering_fragment:jg,dithering_pars_fragment:Qg,roughnessmap_fragment:tx,roughnessmap_pars_fragment:ex,shadowmap_pars_fragment:nx,shadowmap_pars_vertex:ix,shadowmap_vertex:sx,shadowmask_pars_fragment:rx,skinbase_vertex:ox,skinning_pars_vertex:ax,skinning_vertex:lx,skinnormal_vertex:cx,specularmap_fragment:hx,specularmap_pars_fragment:ux,tonemapping_fragment:fx,tonemapping_pars_fragment:dx,transmission_fragment:px,transmission_pars_fragment:mx,uv_pars_fragment:gx,uv_pars_vertex:xx,uv_vertex:_x,worldpos_vertex:vx,background_vert:yx,background_frag:Mx,backgroundCube_vert:bx,backgroundCube_frag:Sx,cube_vert:Ex,cube_frag:Tx,depth_vert:wx,depth_frag:Ax,distanceRGBA_vert:Rx,distanceRGBA_frag:Cx,equirect_vert:Ix,equirect_frag:Px,linedashed_vert:Lx,linedashed_frag:Dx,meshbasic_vert:kx,meshbasic_frag:Ux,meshlambert_vert:Nx,meshlambert_frag:Fx,meshmatcap_vert:Ox,meshmatcap_frag:zx,meshnormal_vert:Bx,meshnormal_frag:Hx,meshphong_vert:Gx,meshphong_frag:Vx,meshphysical_vert:Wx,meshphysical_frag:Xx,meshtoon_vert:qx,meshtoon_frag:Yx,points_vert:Zx,points_frag:Kx,shadow_vert:$x,shadow_frag:Jx,sprite_vert:jx,sprite_frag:Qx},Ot={common:{diffuse:{value:new ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ge},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ge}},envmap:{envMap:{value:null},envMapRotation:{value:new ge},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ge},normalScale:{value:new pt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0},uvTransform:{value:new ge}},sprite:{diffuse:{value:new ft(16777215)},opacity:{value:1},center:{value:new pt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ge},alphaMap:{value:null},alphaMapTransform:{value:new ge},alphaTest:{value:0}}},Bi={basic:{uniforms:Un([Ot.common,Ot.specularmap,Ot.envmap,Ot.aomap,Ot.lightmap,Ot.fog]),vertexShader:_e.meshbasic_vert,fragmentShader:_e.meshbasic_frag},lambert:{uniforms:Un([Ot.common,Ot.specularmap,Ot.envmap,Ot.aomap,Ot.lightmap,Ot.emissivemap,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,Ot.fog,Ot.lights,{emissive:{value:new ft(0)}}]),vertexShader:_e.meshlambert_vert,fragmentShader:_e.meshlambert_frag},phong:{uniforms:Un([Ot.common,Ot.specularmap,Ot.envmap,Ot.aomap,Ot.lightmap,Ot.emissivemap,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,Ot.fog,Ot.lights,{emissive:{value:new ft(0)},specular:{value:new ft(1118481)},shininess:{value:30}}]),vertexShader:_e.meshphong_vert,fragmentShader:_e.meshphong_frag},standard:{uniforms:Un([Ot.common,Ot.envmap,Ot.aomap,Ot.lightmap,Ot.emissivemap,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,Ot.roughnessmap,Ot.metalnessmap,Ot.fog,Ot.lights,{emissive:{value:new ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag},toon:{uniforms:Un([Ot.common,Ot.aomap,Ot.lightmap,Ot.emissivemap,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,Ot.gradientmap,Ot.fog,Ot.lights,{emissive:{value:new ft(0)}}]),vertexShader:_e.meshtoon_vert,fragmentShader:_e.meshtoon_frag},matcap:{uniforms:Un([Ot.common,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,Ot.fog,{matcap:{value:null}}]),vertexShader:_e.meshmatcap_vert,fragmentShader:_e.meshmatcap_frag},points:{uniforms:Un([Ot.points,Ot.fog]),vertexShader:_e.points_vert,fragmentShader:_e.points_frag},dashed:{uniforms:Un([Ot.common,Ot.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:_e.linedashed_vert,fragmentShader:_e.linedashed_frag},depth:{uniforms:Un([Ot.common,Ot.displacementmap]),vertexShader:_e.depth_vert,fragmentShader:_e.depth_frag},normal:{uniforms:Un([Ot.common,Ot.bumpmap,Ot.normalmap,Ot.displacementmap,{opacity:{value:1}}]),vertexShader:_e.meshnormal_vert,fragmentShader:_e.meshnormal_frag},sprite:{uniforms:Un([Ot.sprite,Ot.fog]),vertexShader:_e.sprite_vert,fragmentShader:_e.sprite_frag},background:{uniforms:{uvTransform:{value:new ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:_e.background_vert,fragmentShader:_e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ge}},vertexShader:_e.backgroundCube_vert,fragmentShader:_e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:_e.cube_vert,fragmentShader:_e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:_e.equirect_vert,fragmentShader:_e.equirect_frag},distanceRGBA:{uniforms:Un([Ot.common,Ot.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:_e.distanceRGBA_vert,fragmentShader:_e.distanceRGBA_frag},shadow:{uniforms:Un([Ot.lights,Ot.fog,{color:{value:new ft(0)},opacity:{value:1}}]),vertexShader:_e.shadow_vert,fragmentShader:_e.shadow_frag}};Bi.physical={uniforms:Un([Bi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ge},clearcoatNormalScale:{value:new pt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ge},sheen:{value:0},sheenColor:{value:new ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ge},transmissionSamplerSize:{value:new pt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ge},attenuationDistance:{value:0},attenuationColor:{value:new ft(0)},specularColor:{value:new ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ge},anisotropyVector:{value:new pt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ge}}]),vertexShader:_e.meshphysical_vert,fragmentShader:_e.meshphysical_frag};var _a={r:0,b:0,g:0},Xs=new bn,t_=new ue;function e_(i,t,e,n,s,r,o){let a=new ft(0),l=r===!0?0:1,c,h,u=null,d=0,f=null;function p(M){let _=M.isScene===!0?M.background:null;return _&&_.isTexture&&(_=(M.backgroundBlurriness>0?e:t).get(_)),_}function x(M){let _=!1,v=p(M);v===null?m(a,l):v&&v.isColor&&(m(v,1),_=!0);let w=i.xr.getEnvironmentBlendMode();w==="additive"?n.buffers.color.setClear(0,0,0,1,o):w==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||_)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(M,_){let v=p(_);v&&(v.isCubeTexture||v.mapping===al)?(h===void 0&&(h=new $t(new Oe(1,1,1),new Be({name:"BackgroundCubeMaterial",uniforms:zr(Bi.backgroundCube.uniforms),vertexShader:Bi.backgroundCube.vertexShader,fragmentShader:Bi.backgroundCube.fragmentShader,side:vn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,R,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Xs.copy(_.backgroundRotation),Xs.x*=-1,Xs.y*=-1,Xs.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Xs.y*=-1,Xs.z*=-1),h.material.uniforms.envMap.value=v,h.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(t_.makeRotationFromEuler(Xs)),h.material.toneMapped=Ae.getTransfer(v.colorSpace)!==Ue,(u!==v||d!==v.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,u=v,d=v.version,f=i.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new $t(new zn(2,2),new Be({name:"BackgroundMaterial",uniforms:zr(Bi.background.uniforms),vertexShader:Bi.background.vertexShader,fragmentShader:Bi.background.fragmentShader,side:Rs,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=Ae.getTransfer(v.colorSpace)!==Ue,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,u=v,d=v.version,f=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function m(M,_){M.getRGB(_a,Gd(i)),n.buffers.color.setClear(_a.r,_a.g,_a.b,_,o)}return{getClearColor:function(){return a},setClearColor:function(M,_=1){a.set(M),l=_,m(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,m(a,l)},render:x,addToRenderList:g}}function n_(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,o=!1;function a(E,D,Y,H,X){let Z=!1,O=u(H,Y,D);r!==O&&(r=O,c(r.object)),Z=f(E,H,Y,X),Z&&p(E,H,Y,X),X!==null&&t.update(X,i.ELEMENT_ARRAY_BUFFER),(Z||o)&&(o=!1,v(E,D,Y,H),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function l(){return i.createVertexArray()}function c(E){return i.bindVertexArray(E)}function h(E){return i.deleteVertexArray(E)}function u(E,D,Y){let H=Y.wireframe===!0,X=n[E.id];X===void 0&&(X={},n[E.id]=X);let Z=X[D.id];Z===void 0&&(Z={},X[D.id]=Z);let O=Z[H];return O===void 0&&(O=d(l()),Z[H]=O),O}function d(E){let D=[],Y=[],H=[];for(let X=0;X<e;X++)D[X]=0,Y[X]=0,H[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:Y,attributeDivisors:H,object:E,attributes:{},index:null}}function f(E,D,Y,H){let X=r.attributes,Z=D.attributes,O=0,ct=Y.getAttributes();for(let K in ct)if(ct[K].location>=0){let j=X[K],wt=Z[K];if(wt===void 0&&(K==="instanceMatrix"&&E.instanceMatrix&&(wt=E.instanceMatrix),K==="instanceColor"&&E.instanceColor&&(wt=E.instanceColor)),j===void 0||j.attribute!==wt||wt&&j.data!==wt.data)return!0;O++}return r.attributesNum!==O||r.index!==H}function p(E,D,Y,H){let X={},Z=D.attributes,O=0,ct=Y.getAttributes();for(let K in ct)if(ct[K].location>=0){let j=Z[K];j===void 0&&(K==="instanceMatrix"&&E.instanceMatrix&&(j=E.instanceMatrix),K==="instanceColor"&&E.instanceColor&&(j=E.instanceColor));let wt={};wt.attribute=j,j&&j.data&&(wt.data=j.data),X[K]=wt,O++}r.attributes=X,r.attributesNum=O,r.index=H}function x(){let E=r.newAttributes;for(let D=0,Y=E.length;D<Y;D++)E[D]=0}function g(E){m(E,0)}function m(E,D){let Y=r.newAttributes,H=r.enabledAttributes,X=r.attributeDivisors;Y[E]=1,H[E]===0&&(i.enableVertexAttribArray(E),H[E]=1),X[E]!==D&&(i.vertexAttribDivisor(E,D),X[E]=D)}function M(){let E=r.newAttributes,D=r.enabledAttributes;for(let Y=0,H=D.length;Y<H;Y++)D[Y]!==E[Y]&&(i.disableVertexAttribArray(Y),D[Y]=0)}function _(E,D,Y,H,X,Z,O){O===!0?i.vertexAttribIPointer(E,D,Y,X,Z):i.vertexAttribPointer(E,D,Y,H,X,Z)}function v(E,D,Y,H){x();let X=H.attributes,Z=Y.getAttributes(),O=D.defaultAttributeValues;for(let ct in Z){let K=Z[ct];if(K.location>=0){let W=X[ct];if(W===void 0&&(ct==="instanceMatrix"&&E.instanceMatrix&&(W=E.instanceMatrix),ct==="instanceColor"&&E.instanceColor&&(W=E.instanceColor)),W!==void 0){let j=W.normalized,wt=W.itemSize,Yt=t.get(W);if(Yt===void 0)continue;let te=Yt.buffer,rt=Yt.type,mt=Yt.bytesPerElement,It=rt===i.INT||rt===i.UNSIGNED_INT||W.gpuType===su;if(W.isInterleavedBufferAttribute){let dt=W.data,zt=dt.stride,ie=W.offset;if(dt.isInstancedInterleavedBuffer){for(let Vt=0;Vt<K.locationSize;Vt++)m(K.location+Vt,dt.meshPerAttribute);E.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let Vt=0;Vt<K.locationSize;Vt++)g(K.location+Vt);i.bindBuffer(i.ARRAY_BUFFER,te);for(let Vt=0;Vt<K.locationSize;Vt++)_(K.location+Vt,wt/K.locationSize,rt,j,zt*mt,(ie+wt/K.locationSize*Vt)*mt,It)}else{if(W.isInstancedBufferAttribute){for(let dt=0;dt<K.locationSize;dt++)m(K.location+dt,W.meshPerAttribute);E.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=W.meshPerAttribute*W.count)}else for(let dt=0;dt<K.locationSize;dt++)g(K.location+dt);i.bindBuffer(i.ARRAY_BUFFER,te);for(let dt=0;dt<K.locationSize;dt++)_(K.location+dt,wt/K.locationSize,rt,j,wt*mt,wt/K.locationSize*dt*mt,It)}}else if(O!==void 0){let j=O[ct];if(j!==void 0)switch(j.length){case 2:i.vertexAttrib2fv(K.location,j);break;case 3:i.vertexAttrib3fv(K.location,j);break;case 4:i.vertexAttrib4fv(K.location,j);break;default:i.vertexAttrib1fv(K.location,j)}}}}M()}function w(){C();for(let E in n){let D=n[E];for(let Y in D){let H=D[Y];for(let X in H)h(H[X].object),delete H[X];delete D[Y]}delete n[E]}}function R(E){if(n[E.id]===void 0)return;let D=n[E.id];for(let Y in D){let H=D[Y];for(let X in H)h(H[X].object),delete H[X];delete D[Y]}delete n[E.id]}function T(E){for(let D in n){let Y=n[D];if(Y[E.id]===void 0)continue;let H=Y[E.id];for(let X in H)h(H[X].object),delete H[X];delete Y[E.id]}}function C(){b(),o=!0,r!==s&&(r=s,c(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:C,resetDefaultState:b,dispose:w,releaseStatesOfGeometry:R,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:g,disableUnusedAttributes:M}}function i_(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let f=0;for(let p=0;p<u;p++)f+=h[p];e.update(f,n,1)}function l(c,h,u,d){if(u===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let p=0;p<c.length;p++)o(c[p],h[p],d[p]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,d,0,u);let p=0;for(let x=0;x<u;x++)p+=h[x]*d[x];e.update(p,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function s_(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(T){return!(T!==ai&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){let C=T===ki&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==us&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Vi&&!C)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),_=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=p>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:M,maxVaryings:_,maxFragmentUniforms:v,vertexTextures:w,maxSamples:R}}function r_(i){let t=this,e=null,n=0,s=!1,r=!1,o=new os,a=new ge,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){let p=u.clippingPlanes,x=u.clipIntersection,g=u.clipShadows,m=i.get(u);if(!s||p===null||p.length===0||r&&!g)r?h(null):c();else{let M=r?0:n,_=M*4,v=m.clippingState||null;l.value=v,v=h(p,d,_,f);for(let w=0;w!==_;++w)v[w]=e[w];m.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,p){let x=u!==null?u.length:0,g=null;if(x!==0){if(g=l.value,p!==!0||g===null){let m=f+x*4,M=d.matrixWorldInverse;a.getNormalMatrix(M),(g===null||g.length<m)&&(g=new Float32Array(m));for(let _=0,v=f;_!==x;++_,v+=4)o.copy(u[_]).applyMatrix4(M,a),o.normal.toArray(g,v),g[v+3]=o.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,g}}function o_(i){let t=new WeakMap;function e(o,a){return a===bo?o.mapping=Ur:a===Bc&&(o.mapping=Nr),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===bo||a===Bc)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new vh(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var Br=class extends Ga{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Cr=4,Yf=[.125,.215,.35,.446,.526,.582],$s=20,Mc=new Br,Zf=new ft,bc=null,Sc=0,Ec=0,Tc=!1,Ys=(1+Math.sqrt(5))/2,wr=1/Ys,Kf=[new P(-Ys,wr,0),new P(Ys,wr,0),new P(-wr,0,Ys),new P(wr,0,Ys),new P(0,Ys,-wr),new P(0,Ys,wr),new P(-1,1,-1),new P(1,1,-1),new P(-1,1,1),new P(1,1,1)],Hr=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){bc=this._renderer.getRenderTarget(),Sc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),Tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=jf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Jf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(bc,Sc,Ec),this._renderer.xr.enabled=Tc,t.scissorTest=!1,va(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ur||t.mapping===Nr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),bc=this._renderer.getRenderTarget(),Sc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),Tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:oi,minFilter:oi,generateMipmaps:!1,type:ki,format:ai,colorSpace:Xr,depthBuffer:!1},s=$f(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$f(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=a_(r)),this._blurMaterial=l_(r,t,e)}return s}_compileMaterial(t){let e=new $t(this._lodPlanes[0],t);this._renderer.compile(e,Mc)}_sceneToCubeUV(t,e,n,s){let a=new Nn(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Zf),h.toneMapping=As,h.autoClear=!1;let f=new Sn({name:"PMREM.Background",side:vn,depthWrite:!1,depthTest:!1}),p=new $t(new Oe,f),x=!1,g=t.background;g?g.isColor&&(f.color.copy(g),t.background=null,x=!0):(f.color.copy(Zf),x=!0);for(let m=0;m<6;m++){let M=m%3;M===0?(a.up.set(0,l[m],0),a.lookAt(c[m],0,0)):M===1?(a.up.set(0,0,l[m]),a.lookAt(0,c[m],0)):(a.up.set(0,l[m],0),a.lookAt(0,0,c[m]));let _=this._cubeSize;va(s,M*_,m>2?_:0,_,_),h.setRenderTarget(s),x&&h.render(p,a),h.render(t,a)}p.geometry.dispose(),p.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=g}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Ur||t.mapping===Nr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=jf()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Jf());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new $t(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;va(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Mc)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Kf[(s-r-1)%Kf.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new $t(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*$s-1),x=r/p,g=isFinite(r)?1+Math.floor(h*x):$s;g>$s&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${$s}`);let m=[],M=0;for(let T=0;T<$s;++T){let C=T/x,b=Math.exp(-C*C/2);m.push(b),T===0?M+=b:T<g&&(M+=2*b)}for(let T=0;T<m.length;T++)m[T]=m[T]/M;d.envMap.value=t.texture,d.samples.value=g,d.weights.value=m,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:_}=this;d.dTheta.value=p,d.mipInt.value=_-n;let v=this._sizeLods[s],w=3*v*(s>_-Cr?s-_+Cr:0),R=4*(this._cubeSize-v);va(e,w,R,3*v,2*v),l.setRenderTarget(e),l.render(u,Mc)}};function a_(i){let t=[],e=[],n=[],s=i,r=i-Cr+1+Yf.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>i-Cr?l=Yf[o-i+Cr-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,p=6,x=3,g=2,m=1,M=new Float32Array(x*p*f),_=new Float32Array(g*p*f),v=new Float32Array(m*p*f);for(let R=0;R<f;R++){let T=R%3*2/3-1,C=R>2?0:-1,b=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];M.set(b,x*p*R),_.set(d,g*p*R);let E=[R,R,R,R,R,R];v.set(E,m*p*R)}let w=new qe;w.setAttribute("position",new Ie(M,x)),w.setAttribute("uv",new Ie(_,g)),w.setAttribute("faceIndex",new Ie(v,m)),t.push(w),s>Cr&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function $f(i,t,e){let n=new On(i,t,e);return n.texture.mapping=al,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function va(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function l_(i,t,e){let n=new Float32Array($s),s=new P(0,1,0);return new Be({name:"SphericalGaussianBlur",defines:{n:$s,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:du(),fragmentShader:`

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
		`,blending:Wi,depthTest:!1,depthWrite:!1})}function Jf(){return new Be({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:du(),fragmentShader:`

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
		`,blending:Wi,depthTest:!1,depthWrite:!1})}function jf(){return new Be({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wi,depthTest:!1,depthWrite:!1})}function du(){return`

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
	`}function c_(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===bo||l===Bc,h=l===Ur||l===Nr;if(c||h){let u=t.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new Hr(i)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new Hr(i)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function h_(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&po("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function u_(i,t,e,n){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&t.remove(d.index);for(let p in d.attributes)t.remove(d.attributes[p]);for(let p in d.morphAttributes){let x=d.morphAttributes[p];for(let g=0,m=x.length;g<m;g++)t.remove(x[g])}d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(u){let d=u.attributes;for(let p in d)t.update(d[p],i.ARRAY_BUFFER);let f=u.morphAttributes;for(let p in f){let x=f[p];for(let g=0,m=x.length;g<m;g++)t.update(x[g],i.ARRAY_BUFFER)}}function c(u){let d=[],f=u.index,p=u.attributes.position,x=0;if(f!==null){let M=f.array;x=f.version;for(let _=0,v=M.length;_<v;_+=3){let w=M[_+0],R=M[_+1],T=M[_+2];d.push(w,R,R,T,T,w)}}else if(p!==void 0){let M=p.array;x=p.version;for(let _=0,v=M.length/3-1;_<v;_+=3){let w=_+0,R=_+1,T=_+2;d.push(w,R,R,T,T,w)}}else return;let g=new(Bd(d)?Ha:Ba)(d,1);g.version=x;let m=r.get(u);m&&t.remove(m),r.set(u,g)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function f_(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*o),e.update(f,n,1)}function c(d,f,p){p!==0&&(i.drawElementsInstanced(n,f,r,d*o,p),e.update(f,n,p))}function h(d,f,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,p);let g=0;for(let m=0;m<p;m++)g+=f[m];e.update(g,n,1)}function u(d,f,p,x){if(p===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let m=0;m<d.length;m++)c(d[m]/o,f[m],x[m]);else{g.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,x,0,p);let m=0;for(let M=0;M<p;M++)m+=f[M]*x[M];e.update(m,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function d_(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function p_(i,t,e){let n=new WeakMap,s=new sn;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(a);if(d===void 0||d.count!==u){let b=function(){T.dispose(),n.delete(a),a.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],_=0;f===!0&&(_=1),p===!0&&(_=2),x===!0&&(_=3);let v=a.attributes.position.count*_,w=1;v>t.maxTextureSize&&(w=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let R=new Float32Array(v*w*4*u),T=new Fa(R,v,w,u);T.type=Vi,T.needsUpdate=!0;let C=_*4;for(let E=0;E<u;E++){let D=g[E],Y=m[E],H=M[E],X=v*w*4*E;for(let Z=0;Z<D.count;Z++){let O=Z*C;f===!0&&(s.fromBufferAttribute(D,Z),R[X+O+0]=s.x,R[X+O+1]=s.y,R[X+O+2]=s.z,R[X+O+3]=0),p===!0&&(s.fromBufferAttribute(Y,Z),R[X+O+4]=s.x,R[X+O+5]=s.y,R[X+O+6]=s.z,R[X+O+7]=0),x===!0&&(s.fromBufferAttribute(H,Z),R[X+O+8]=s.x,R[X+O+9]=s.y,R[X+O+10]=s.z,R[X+O+11]=H.itemSize===4?s.w:1)}}d={count:u,texture:T,size:new pt(v,w)},n.set(a,d),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let f=0;for(let x=0;x<c.length;x++)f+=c[x];let p=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function m_(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var Wa=class extends Jn{constructor(t,e,n,s,r,o,a,l,c,h=Pr){if(h!==Pr&&h!==Or)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Pr&&(n=Js),n===void 0&&h===Or&&(n=Fr),super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Fn,this.minFilter=l!==void 0?l:Fn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Wd=new Jn,Qf=new Wa(1,1),Xd=new Fa,qd=new xh,Yd=new Va,td=[],ed=[],nd=new Float32Array(16),id=new Float32Array(9),sd=new Float32Array(4);function qr(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=td[s];if(r===void 0&&(r=new Float32Array(s),td[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function mn(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function gn(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function cl(i,t){let e=ed[t];e===void 0&&(e=new Int32Array(t),ed[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function g_(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function x_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(mn(e,t))return;i.uniform2fv(this.addr,t),gn(e,t)}}function __(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(mn(e,t))return;i.uniform3fv(this.addr,t),gn(e,t)}}function v_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(mn(e,t))return;i.uniform4fv(this.addr,t),gn(e,t)}}function y_(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(mn(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),gn(e,t)}else{if(mn(e,n))return;sd.set(n),i.uniformMatrix2fv(this.addr,!1,sd),gn(e,n)}}function M_(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(mn(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),gn(e,t)}else{if(mn(e,n))return;id.set(n),i.uniformMatrix3fv(this.addr,!1,id),gn(e,n)}}function b_(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(mn(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),gn(e,t)}else{if(mn(e,n))return;nd.set(n),i.uniformMatrix4fv(this.addr,!1,nd),gn(e,n)}}function S_(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function E_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(mn(e,t))return;i.uniform2iv(this.addr,t),gn(e,t)}}function T_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(mn(e,t))return;i.uniform3iv(this.addr,t),gn(e,t)}}function w_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(mn(e,t))return;i.uniform4iv(this.addr,t),gn(e,t)}}function A_(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function R_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(mn(e,t))return;i.uniform2uiv(this.addr,t),gn(e,t)}}function C_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(mn(e,t))return;i.uniform3uiv(this.addr,t),gn(e,t)}}function I_(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(mn(e,t))return;i.uniform4uiv(this.addr,t),gn(e,t)}}function P_(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Qf.compareFunction=zd,r=Qf):r=Wd,e.setTexture2D(t||r,s)}function L_(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||qd,s)}function D_(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Yd,s)}function k_(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Xd,s)}function U_(i){switch(i){case 5126:return g_;case 35664:return x_;case 35665:return __;case 35666:return v_;case 35674:return y_;case 35675:return M_;case 35676:return b_;case 5124:case 35670:return S_;case 35667:case 35671:return E_;case 35668:case 35672:return T_;case 35669:case 35673:return w_;case 5125:return A_;case 36294:return R_;case 36295:return C_;case 36296:return I_;case 35678:case 36198:case 36298:case 36306:case 35682:return P_;case 35679:case 36299:case 36307:return L_;case 35680:case 36300:case 36308:case 36293:return D_;case 36289:case 36303:case 36311:case 36292:return k_}}function N_(i,t){i.uniform1fv(this.addr,t)}function F_(i,t){let e=qr(t,this.size,2);i.uniform2fv(this.addr,e)}function O_(i,t){let e=qr(t,this.size,3);i.uniform3fv(this.addr,e)}function z_(i,t){let e=qr(t,this.size,4);i.uniform4fv(this.addr,e)}function B_(i,t){let e=qr(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function H_(i,t){let e=qr(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function G_(i,t){let e=qr(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function V_(i,t){i.uniform1iv(this.addr,t)}function W_(i,t){i.uniform2iv(this.addr,t)}function X_(i,t){i.uniform3iv(this.addr,t)}function q_(i,t){i.uniform4iv(this.addr,t)}function Y_(i,t){i.uniform1uiv(this.addr,t)}function Z_(i,t){i.uniform2uiv(this.addr,t)}function K_(i,t){i.uniform3uiv(this.addr,t)}function $_(i,t){i.uniform4uiv(this.addr,t)}function J_(i,t,e){let n=this.cache,s=t.length,r=cl(e,s);mn(n,r)||(i.uniform1iv(this.addr,r),gn(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Wd,r[o])}function j_(i,t,e){let n=this.cache,s=t.length,r=cl(e,s);mn(n,r)||(i.uniform1iv(this.addr,r),gn(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||qd,r[o])}function Q_(i,t,e){let n=this.cache,s=t.length,r=cl(e,s);mn(n,r)||(i.uniform1iv(this.addr,r),gn(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Yd,r[o])}function tv(i,t,e){let n=this.cache,s=t.length,r=cl(e,s);mn(n,r)||(i.uniform1iv(this.addr,r),gn(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Xd,r[o])}function ev(i){switch(i){case 5126:return N_;case 35664:return F_;case 35665:return O_;case 35666:return z_;case 35674:return B_;case 35675:return H_;case 35676:return G_;case 5124:case 35670:return V_;case 35667:case 35671:return W_;case 35668:case 35672:return X_;case 35669:case 35673:return q_;case 5125:return Y_;case 36294:return Z_;case 36295:return K_;case 36296:return $_;case 35678:case 36198:case 36298:case 36306:case 35682:return J_;case 35679:case 36299:case 36307:return j_;case 35680:case 36300:case 36308:case 36293:return Q_;case 36289:case 36303:case 36311:case 36292:return tv}}var yh=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=U_(e.type)}},Mh=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=ev(e.type)}},bh=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},wc=/(\w+)(\])?(\[|\.)?/g;function rd(i,t){i.seq.push(t),i.map[t.id]=t}function nv(i,t,e){let n=i.name,s=n.length;for(wc.lastIndex=0;;){let r=wc.exec(n),o=wc.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){rd(e,c===void 0?new yh(a,i,t):new Mh(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new bh(a),rd(e,u)),e=u}}}var Dr=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);nv(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function od(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var iv=37297,sv=0;function rv(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}var ad=new ge;function ov(i){Ae._getMatrix(ad,Ae.workingColorSpace,i);let t=`mat3( ${ad.elements.map(e=>e.toFixed(4))} )`;switch(Ae.getTransfer(i)){case ll:return[t,"LinearTransferOETF"];case Ue:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function ld(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+rv(i.getShaderSource(t),o)}else return s}function av(i,t){let e=ov(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function lv(i,t){let e;switch(t){case Qh:e="Linear";break;case tu:e="Reinhard";break;case eu:e="Cineon";break;case ko:e="ACESFilmic";break;case nu:e="AgX";break;case iu:e="Neutral";break;case Tm:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var ya=new P;function cv(){Ae.getLuminanceCoefficients(ya);let i=ya.x.toFixed(4),t=ya.y.toFixed(4),e=ya.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function hv(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(mo).join(`
`)}function uv(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function fv(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function mo(i){return i!==""}function cd(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function hd(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var dv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Sh(i){return i.replace(dv,mv)}var pv=new Map;function mv(i,t){let e=_e[t];if(e===void 0){let n=pv.get(t);if(n!==void 0)e=_e[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Sh(e)}var gv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ud(i){return i.replace(gv,xv)}function xv(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function fd(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function _v(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Rd?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Jh?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===rs&&(t="SHADOWMAP_TYPE_VSM"),t}function vv(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ur:case Nr:t="ENVMAP_TYPE_CUBE";break;case al:t="ENVMAP_TYPE_CUBE_UV";break}return t}function yv(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Nr:t="ENVMAP_MODE_REFRACTION";break}return t}function Mv(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case jh:t="ENVMAP_BLENDING_MULTIPLY";break;case Sm:t="ENVMAP_BLENDING_MIX";break;case Em:t="ENVMAP_BLENDING_ADD";break}return t}function bv(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Sv(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=_v(e),c=vv(e),h=yv(e),u=Mv(e),d=bv(e),f=hv(e),p=uv(r),x=s.createProgram(),g,m,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(mo).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(mo).join(`
`),m.length>0&&(m+=`
`)):(g=[fd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(mo).join(`
`),m=[fd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==As?"#define TONE_MAPPING":"",e.toneMapping!==As?_e.tonemapping_pars_fragment:"",e.toneMapping!==As?lv("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",_e.colorspace_pars_fragment,av("linearToOutputTexel",e.outputColorSpace),cv(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(mo).join(`
`)),o=Sh(o),o=cd(o,e),o=hd(o,e),a=Sh(a),a=cd(a,e),a=hd(a,e),o=ud(o),a=ud(a),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",e.glslVersion===Tf?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Tf?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let _=M+g+o,v=M+m+a,w=od(s,s.VERTEX_SHADER,_),R=od(s,s.FRAGMENT_SHADER,v);s.attachShader(x,w),s.attachShader(x,R),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function T(D){if(i.debug.checkShaderErrors){let Y=s.getProgramInfoLog(x).trim(),H=s.getShaderInfoLog(w).trim(),X=s.getShaderInfoLog(R).trim(),Z=!0,O=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,w,R);else{let ct=ld(s,w,"vertex"),K=ld(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+Y+`
`+ct+`
`+K)}else Y!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Y):(H===""||X==="")&&(O=!1);O&&(D.diagnostics={runnable:Z,programLog:Y,vertexShader:{log:H,prefix:g},fragmentShader:{log:X,prefix:m}})}s.deleteShader(w),s.deleteShader(R),C=new Dr(s,x),b=fv(s,x)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let b;this.getAttributes=function(){return b===void 0&&T(this),b};let E=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=s.getProgramParameter(x,iv)),E},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=sv++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=w,this.fragmentShader=R,this}var Ev=0,Eh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Th(t),e.set(t,n)),n}},Th=class{constructor(t){this.id=Ev++,this.code=t,this.usedTimes=0}};function Tv(i,t,e,n,s,r,o){let a=new za,l=new Eh,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(b){return c.add(b),b===0?"uv":`uv${b}`}function g(b,E,D,Y,H){let X=Y.fog,Z=H.geometry,O=b.isMeshStandardMaterial?Y.environment:null,ct=(b.isMeshStandardMaterial?e:t).get(b.envMap||O),K=ct&&ct.mapping===al?ct.image.height:null,W=p[b.type];b.precision!==null&&(f=s.getMaxPrecision(b.precision),f!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",f,"instead."));let j=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,wt=j!==void 0?j.length:0,Yt=0;Z.morphAttributes.position!==void 0&&(Yt=1),Z.morphAttributes.normal!==void 0&&(Yt=2),Z.morphAttributes.color!==void 0&&(Yt=3);let te,rt,mt,It;if(W){let le=Bi[W];te=le.vertexShader,rt=le.fragmentShader}else te=b.vertexShader,rt=b.fragmentShader,l.update(b),mt=l.getVertexShaderID(b),It=l.getFragmentShaderID(b);let dt=i.getRenderTarget(),zt=i.state.buffers.depth.getReversed(),ie=H.isInstancedMesh===!0,Vt=H.isBatchedMesh===!0,oe=!!b.map,at=!!b.matcap,St=!!ct,L=!!b.aoMap,Zt=!!b.lightMap,xt=!!b.bumpMap,Ut=!!b.normalMap,Pt=!!b.displacementMap,ee=!!b.emissiveMap,Et=!!b.metalnessMap,I=!!b.roughnessMap,y=b.anisotropy>0,U=b.clearcoat>0,z=b.dispersion>0,V=b.iridescence>0,B=b.sheen>0,vt=b.transmission>0,lt=y&&!!b.anisotropyMap,Mt=U&&!!b.clearcoatMap,Wt=U&&!!b.clearcoatNormalMap,st=U&&!!b.clearcoatRoughnessMap,Q=V&&!!b.iridescenceMap,Lt=V&&!!b.iridescenceThicknessMap,Dt=B&&!!b.sheenColorMap,ht=B&&!!b.sheenRoughnessMap,Kt=!!b.specularMap,Ft=!!b.specularColorMap,Xt=!!b.specularIntensityMap,N=vt&&!!b.transmissionMap,Tt=vt&&!!b.thicknessMap,J=!!b.gradientMap,nt=!!b.alphaMap,Rt=b.alphaTest>0,Ct=!!b.alphaHash,ne=!!b.extensions,Se=As;b.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(Se=i.toneMapping);let ze={shaderID:W,shaderType:b.type,shaderName:b.name,vertexShader:te,fragmentShader:rt,defines:b.defines,customVertexShaderID:mt,customFragmentShaderID:It,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:f,batching:Vt,batchingColor:Vt&&H._colorsTexture!==null,instancing:ie,instancingColor:ie&&H.instanceColor!==null,instancingMorph:ie&&H.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:dt===null?i.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:Xr,alphaToCoverage:!!b.alphaToCoverage,map:oe,matcap:at,envMap:St,envMapMode:St&&ct.mapping,envMapCubeUVHeight:K,aoMap:L,lightMap:Zt,bumpMap:xt,normalMap:Ut,displacementMap:d&&Pt,emissiveMap:ee,normalMapObjectSpace:Ut&&b.normalMapType===Cm,normalMapTangentSpace:Ut&&b.normalMapType===uu,metalnessMap:Et,roughnessMap:I,anisotropy:y,anisotropyMap:lt,clearcoat:U,clearcoatMap:Mt,clearcoatNormalMap:Wt,clearcoatRoughnessMap:st,dispersion:z,iridescence:V,iridescenceMap:Q,iridescenceThicknessMap:Lt,sheen:B,sheenColorMap:Dt,sheenRoughnessMap:ht,specularMap:Kt,specularColorMap:Ft,specularIntensityMap:Xt,transmission:vt,transmissionMap:N,thicknessMap:Tt,gradientMap:J,opaque:b.transparent===!1&&b.blending===cs&&b.alphaToCoverage===!1,alphaMap:nt,alphaTest:Rt,alphaHash:Ct,combine:b.combine,mapUv:oe&&x(b.map.channel),aoMapUv:L&&x(b.aoMap.channel),lightMapUv:Zt&&x(b.lightMap.channel),bumpMapUv:xt&&x(b.bumpMap.channel),normalMapUv:Ut&&x(b.normalMap.channel),displacementMapUv:Pt&&x(b.displacementMap.channel),emissiveMapUv:ee&&x(b.emissiveMap.channel),metalnessMapUv:Et&&x(b.metalnessMap.channel),roughnessMapUv:I&&x(b.roughnessMap.channel),anisotropyMapUv:lt&&x(b.anisotropyMap.channel),clearcoatMapUv:Mt&&x(b.clearcoatMap.channel),clearcoatNormalMapUv:Wt&&x(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:st&&x(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Q&&x(b.iridescenceMap.channel),iridescenceThicknessMapUv:Lt&&x(b.iridescenceThicknessMap.channel),sheenColorMapUv:Dt&&x(b.sheenColorMap.channel),sheenRoughnessMapUv:ht&&x(b.sheenRoughnessMap.channel),specularMapUv:Kt&&x(b.specularMap.channel),specularColorMapUv:Ft&&x(b.specularColorMap.channel),specularIntensityMapUv:Xt&&x(b.specularIntensityMap.channel),transmissionMapUv:N&&x(b.transmissionMap.channel),thicknessMapUv:Tt&&x(b.thicknessMap.channel),alphaMapUv:nt&&x(b.alphaMap.channel),vertexTangents:!!Z.attributes.tangent&&(Ut||y),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!Z.attributes.uv&&(oe||nt),fog:!!X,useFog:b.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:zt,skinning:H.isSkinnedMesh===!0,morphTargets:Z.morphAttributes.position!==void 0,morphNormals:Z.morphAttributes.normal!==void 0,morphColors:Z.morphAttributes.color!==void 0,morphTargetsCount:wt,morphTextureStride:Yt,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:Se,decodeVideoTexture:oe&&b.map.isVideoTexture===!0&&Ae.getTransfer(b.map.colorSpace)===Ue,decodeVideoTextureEmissive:ee&&b.emissiveMap.isVideoTexture===!0&&Ae.getTransfer(b.emissiveMap.colorSpace)===Ue,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===$e,flipSided:b.side===vn,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:ne&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&b.extensions.multiDraw===!0||Vt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return ze.vertexUv1s=c.has(1),ze.vertexUv2s=c.has(2),ze.vertexUv3s=c.has(3),c.clear(),ze}function m(b){let E=[];if(b.shaderID?E.push(b.shaderID):(E.push(b.customVertexShaderID),E.push(b.customFragmentShaderID)),b.defines!==void 0)for(let D in b.defines)E.push(D),E.push(b.defines[D]);return b.isRawShaderMaterial===!1&&(M(E,b),_(E,b),E.push(i.outputColorSpace)),E.push(b.customProgramCacheKey),E.join()}function M(b,E){b.push(E.precision),b.push(E.outputColorSpace),b.push(E.envMapMode),b.push(E.envMapCubeUVHeight),b.push(E.mapUv),b.push(E.alphaMapUv),b.push(E.lightMapUv),b.push(E.aoMapUv),b.push(E.bumpMapUv),b.push(E.normalMapUv),b.push(E.displacementMapUv),b.push(E.emissiveMapUv),b.push(E.metalnessMapUv),b.push(E.roughnessMapUv),b.push(E.anisotropyMapUv),b.push(E.clearcoatMapUv),b.push(E.clearcoatNormalMapUv),b.push(E.clearcoatRoughnessMapUv),b.push(E.iridescenceMapUv),b.push(E.iridescenceThicknessMapUv),b.push(E.sheenColorMapUv),b.push(E.sheenRoughnessMapUv),b.push(E.specularMapUv),b.push(E.specularColorMapUv),b.push(E.specularIntensityMapUv),b.push(E.transmissionMapUv),b.push(E.thicknessMapUv),b.push(E.combine),b.push(E.fogExp2),b.push(E.sizeAttenuation),b.push(E.morphTargetsCount),b.push(E.morphAttributeCount),b.push(E.numDirLights),b.push(E.numPointLights),b.push(E.numSpotLights),b.push(E.numSpotLightMaps),b.push(E.numHemiLights),b.push(E.numRectAreaLights),b.push(E.numDirLightShadows),b.push(E.numPointLightShadows),b.push(E.numSpotLightShadows),b.push(E.numSpotLightShadowsWithMaps),b.push(E.numLightProbes),b.push(E.shadowMapType),b.push(E.toneMapping),b.push(E.numClippingPlanes),b.push(E.numClipIntersection),b.push(E.depthPacking)}function _(b,E){a.disableAll(),E.supportsVertexTextures&&a.enable(0),E.instancing&&a.enable(1),E.instancingColor&&a.enable(2),E.instancingMorph&&a.enable(3),E.matcap&&a.enable(4),E.envMap&&a.enable(5),E.normalMapObjectSpace&&a.enable(6),E.normalMapTangentSpace&&a.enable(7),E.clearcoat&&a.enable(8),E.iridescence&&a.enable(9),E.alphaTest&&a.enable(10),E.vertexColors&&a.enable(11),E.vertexAlphas&&a.enable(12),E.vertexUv1s&&a.enable(13),E.vertexUv2s&&a.enable(14),E.vertexUv3s&&a.enable(15),E.vertexTangents&&a.enable(16),E.anisotropy&&a.enable(17),E.alphaHash&&a.enable(18),E.batching&&a.enable(19),E.dispersion&&a.enable(20),E.batchingColor&&a.enable(21),b.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reverseDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),b.push(a.mask)}function v(b){let E=p[b.type],D;if(E){let Y=Bi[E];D=Zi.clone(Y.uniforms)}else D=b.uniforms;return D}function w(b,E){let D;for(let Y=0,H=h.length;Y<H;Y++){let X=h[Y];if(X.cacheKey===E){D=X,++D.usedTimes;break}}return D===void 0&&(D=new Sv(i,E,b,r),h.push(D)),D}function R(b){if(--b.usedTimes===0){let E=h.indexOf(b);h[E]=h[h.length-1],h.pop(),b.destroy()}}function T(b){l.remove(b)}function C(){l.dispose()}return{getParameters:g,getProgramCacheKey:m,getUniforms:v,acquireProgram:w,releaseProgram:R,releaseShaderCache:T,programs:h,dispose:C}}function wv(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Av(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function dd(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function pd(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,d,f,p,x,g){let m=i[t];return m===void 0?(m={id:u.id,object:u,geometry:d,material:f,groupOrder:p,renderOrder:u.renderOrder,z:x,group:g},i[t]=m):(m.id=u.id,m.object=u,m.geometry=d,m.material=f,m.groupOrder=p,m.renderOrder=u.renderOrder,m.z=x,m.group=g),t++,m}function a(u,d,f,p,x,g){let m=o(u,d,f,p,x,g);f.transmission>0?n.push(m):f.transparent===!0?s.push(m):e.push(m)}function l(u,d,f,p,x,g){let m=o(u,d,f,p,x,g);f.transmission>0?n.unshift(m):f.transparent===!0?s.unshift(m):e.unshift(m)}function c(u,d){e.length>1&&e.sort(u||Av),n.length>1&&n.sort(d||dd),s.length>1&&s.sort(d||dd)}function h(){for(let u=t,d=i.length;u<d;u++){let f=i[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function Rv(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new pd,i.set(n,[o])):s>=r.length?(o=new pd,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Cv(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new P,color:new ft};break;case"SpotLight":e={position:new P,direction:new P,color:new ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new P,color:new ft,distance:0,decay:0};break;case"HemisphereLight":e={direction:new P,skyColor:new ft,groundColor:new ft};break;case"RectAreaLight":e={color:new ft,position:new P,halfWidth:new P,halfHeight:new P};break}return i[t.id]=e,e}}}function Iv(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Pv=0;function Lv(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Dv(i){let t=new Cv,e=Iv(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new P);let s=new P,r=new ue,o=new ue;function a(c){let h=0,u=0,d=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let f=0,p=0,x=0,g=0,m=0,M=0,_=0,v=0,w=0,R=0,T=0;c.sort(Lv);for(let b=0,E=c.length;b<E;b++){let D=c[b],Y=D.color,H=D.intensity,X=D.distance,Z=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)h+=Y.r*H,u+=Y.g*H,d+=Y.b*H;else if(D.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(D.sh.coefficients[O],H);T++}else if(D.isDirectionalLight){let O=t.get(D);if(O.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let ct=D.shadow,K=e.get(D);K.shadowIntensity=ct.intensity,K.shadowBias=ct.bias,K.shadowNormalBias=ct.normalBias,K.shadowRadius=ct.radius,K.shadowMapSize=ct.mapSize,n.directionalShadow[f]=K,n.directionalShadowMap[f]=Z,n.directionalShadowMatrix[f]=D.shadow.matrix,M++}n.directional[f]=O,f++}else if(D.isSpotLight){let O=t.get(D);O.position.setFromMatrixPosition(D.matrixWorld),O.color.copy(Y).multiplyScalar(H),O.distance=X,O.coneCos=Math.cos(D.angle),O.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),O.decay=D.decay,n.spot[x]=O;let ct=D.shadow;if(D.map&&(n.spotLightMap[w]=D.map,w++,ct.updateMatrices(D),D.castShadow&&R++),n.spotLightMatrix[x]=ct.matrix,D.castShadow){let K=e.get(D);K.shadowIntensity=ct.intensity,K.shadowBias=ct.bias,K.shadowNormalBias=ct.normalBias,K.shadowRadius=ct.radius,K.shadowMapSize=ct.mapSize,n.spotShadow[x]=K,n.spotShadowMap[x]=Z,v++}x++}else if(D.isRectAreaLight){let O=t.get(D);O.color.copy(Y).multiplyScalar(H),O.halfWidth.set(D.width*.5,0,0),O.halfHeight.set(0,D.height*.5,0),n.rectArea[g]=O,g++}else if(D.isPointLight){let O=t.get(D);if(O.color.copy(D.color).multiplyScalar(D.intensity),O.distance=D.distance,O.decay=D.decay,D.castShadow){let ct=D.shadow,K=e.get(D);K.shadowIntensity=ct.intensity,K.shadowBias=ct.bias,K.shadowNormalBias=ct.normalBias,K.shadowRadius=ct.radius,K.shadowMapSize=ct.mapSize,K.shadowCameraNear=ct.camera.near,K.shadowCameraFar=ct.camera.far,n.pointShadow[p]=K,n.pointShadowMap[p]=Z,n.pointShadowMatrix[p]=D.shadow.matrix,_++}n.point[p]=O,p++}else if(D.isHemisphereLight){let O=t.get(D);O.skyColor.copy(D.color).multiplyScalar(H),O.groundColor.copy(D.groundColor).multiplyScalar(H),n.hemi[m]=O,m++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Ot.LTC_FLOAT_1,n.rectAreaLTC2=Ot.LTC_FLOAT_2):(n.rectAreaLTC1=Ot.LTC_HALF_1,n.rectAreaLTC2=Ot.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let C=n.hash;(C.directionalLength!==f||C.pointLength!==p||C.spotLength!==x||C.rectAreaLength!==g||C.hemiLength!==m||C.numDirectionalShadows!==M||C.numPointShadows!==_||C.numSpotShadows!==v||C.numSpotMaps!==w||C.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=g,n.point.length=p,n.hemi.length=m,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=_,n.pointShadowMap.length=_,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=_,n.spotLightMatrix.length=v+w-R,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=T,C.directionalLength=f,C.pointLength=p,C.spotLength=x,C.rectAreaLength=g,C.hemiLength=m,C.numDirectionalShadows=M,C.numPointShadows=_,C.numSpotShadows=v,C.numSpotMaps=w,C.numLightProbes=T,n.version=Pv++)}function l(c,h){let u=0,d=0,f=0,p=0,x=0,g=h.matrixWorldInverse;for(let m=0,M=c.length;m<M;m++){let _=c[m];if(_.isDirectionalLight){let v=n.directional[u];v.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),u++}else if(_.isSpotLight){let v=n.spot[f];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),v.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),f++}else if(_.isRectAreaLight){let v=n.rectArea[p];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),o.identity(),r.copy(_.matrixWorld),r.premultiply(g),o.extractRotation(r),v.halfWidth.set(_.width*.5,0,0),v.halfHeight.set(0,_.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),p++}else if(_.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),d++}else if(_.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(_.matrixWorld),v.direction.transformDirection(g),x++}}}return{setup:a,setupView:l,state:n}}function md(i){let t=new Dv(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function o(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function kv(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new md(i),t.set(s,[a])):r>=o.length?(a=new md(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var wh=class extends fs{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Am,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Ah=class extends fs{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Uv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Nv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Fv(i,t,e){let n=new To,s=new pt,r=new pt,o=new sn,a=new wh({depthPacking:Rm}),l=new Ah,c={},h=e.maxTextureSize,u={[Rs]:vn,[vn]:Rs,[$e]:$e},d=new Be({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new pt},radius:{value:4}},vertexShader:Uv,fragmentShader:Nv}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let p=new qe;p.setAttribute("position",new Ie(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new $t(p,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Rd;let m=this.type;this.render=function(R,T,C){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;let b=i.getRenderTarget(),E=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),Y=i.state;Y.setBlending(Wi),Y.buffers.color.setClear(1,1,1,1),Y.buffers.depth.setTest(!0),Y.setScissorTest(!1);let H=m!==rs&&this.type===rs,X=m===rs&&this.type!==rs;for(let Z=0,O=R.length;Z<O;Z++){let ct=R[Z],K=ct.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",ct,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;s.copy(K.mapSize);let W=K.getFrameExtents();if(s.multiply(W),r.copy(K.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/W.x),s.x=r.x*W.x,K.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/W.y),s.y=r.y*W.y,K.mapSize.y=r.y)),K.map===null||H===!0||X===!0){let wt=this.type!==rs?{minFilter:Fn,magFilter:Fn}:{};K.map!==null&&K.map.dispose(),K.map=new On(s.x,s.y,wt),K.map.texture.name=ct.name+".shadowMap",K.camera.updateProjectionMatrix()}i.setRenderTarget(K.map),i.clear();let j=K.getViewportCount();for(let wt=0;wt<j;wt++){let Yt=K.getViewport(wt);o.set(r.x*Yt.x,r.y*Yt.y,r.x*Yt.z,r.y*Yt.w),Y.viewport(o),K.updateMatrices(ct,wt),n=K.getFrustum(),v(T,C,K.camera,ct,this.type)}K.isPointLightShadow!==!0&&this.type===rs&&M(K,C),K.needsUpdate=!1}m=this.type,g.needsUpdate=!1,i.setRenderTarget(b,E,D)};function M(R,T){let C=t.update(x);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new On(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(T,null,C,d,x,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(T,null,C,f,x,null)}function _(R,T,C,b){let E=null,D=C.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(D!==void 0)E=D;else if(E=C.isPointLight===!0?l:a,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let Y=E.uuid,H=T.uuid,X=c[Y];X===void 0&&(X={},c[Y]=X);let Z=X[H];Z===void 0&&(Z=E.clone(),X[H]=Z,T.addEventListener("dispose",w)),E=Z}if(E.visible=T.visible,E.wireframe=T.wireframe,b===rs?E.side=T.shadowSide!==null?T.shadowSide:T.side:E.side=T.shadowSide!==null?T.shadowSide:u[T.side],E.alphaMap=T.alphaMap,E.alphaTest=T.alphaTest,E.map=T.map,E.clipShadows=T.clipShadows,E.clippingPlanes=T.clippingPlanes,E.clipIntersection=T.clipIntersection,E.displacementMap=T.displacementMap,E.displacementScale=T.displacementScale,E.displacementBias=T.displacementBias,E.wireframeLinewidth=T.wireframeLinewidth,E.linewidth=T.linewidth,C.isPointLight===!0&&E.isMeshDistanceMaterial===!0){let Y=i.properties.get(E);Y.light=C}return E}function v(R,T,C,b,E){if(R.visible===!1)return;if(R.layers.test(T.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&E===rs)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,R.matrixWorld);let H=t.update(R),X=R.material;if(Array.isArray(X)){let Z=H.groups;for(let O=0,ct=Z.length;O<ct;O++){let K=Z[O],W=X[K.materialIndex];if(W&&W.visible){let j=_(R,W,b,E);R.onBeforeShadow(i,R,T,C,H,j,K),i.renderBufferDirect(C,null,H,j,R,K),R.onAfterShadow(i,R,T,C,H,j,K)}}}else if(X.visible){let Z=_(R,X,b,E);R.onBeforeShadow(i,R,T,C,H,Z,null),i.renderBufferDirect(C,null,H,Z,R,null),R.onAfterShadow(i,R,T,C,H,Z,null)}}let Y=R.children;for(let H=0,X=Y.length;H<X;H++)v(Y[H],T,C,b,E)}function w(R){R.target.removeEventListener("dispose",w);for(let C in c){let b=c[C],E=R.target.uuid;E in b&&(b[E].dispose(),delete b[E])}}}var Ov={[Dc]:kc,[Uc]:Oc,[Nc]:zc,[kr]:Fc,[kc]:Dc,[Oc]:Uc,[zc]:Nc,[Fc]:kr};function zv(i,t){function e(){let N=!1,Tt=new sn,J=null,nt=new sn(0,0,0,0);return{setMask:function(Rt){J!==Rt&&!N&&(i.colorMask(Rt,Rt,Rt,Rt),J=Rt)},setLocked:function(Rt){N=Rt},setClear:function(Rt,Ct,ne,Se,ze){ze===!0&&(Rt*=Se,Ct*=Se,ne*=Se),Tt.set(Rt,Ct,ne,Se),nt.equals(Tt)===!1&&(i.clearColor(Rt,Ct,ne,Se),nt.copy(Tt))},reset:function(){N=!1,J=null,nt.set(-1,0,0,0)}}}function n(){let N=!1,Tt=!1,J=null,nt=null,Rt=null;return{setReversed:function(Ct){if(Tt!==Ct){let ne=t.get("EXT_clip_control");Tt?ne.clipControlEXT(ne.LOWER_LEFT_EXT,ne.ZERO_TO_ONE_EXT):ne.clipControlEXT(ne.LOWER_LEFT_EXT,ne.NEGATIVE_ONE_TO_ONE_EXT);let Se=Rt;Rt=null,this.setClear(Se)}Tt=Ct},getReversed:function(){return Tt},setTest:function(Ct){Ct?dt(i.DEPTH_TEST):zt(i.DEPTH_TEST)},setMask:function(Ct){J!==Ct&&!N&&(i.depthMask(Ct),J=Ct)},setFunc:function(Ct){if(Tt&&(Ct=Ov[Ct]),nt!==Ct){switch(Ct){case Dc:i.depthFunc(i.NEVER);break;case kc:i.depthFunc(i.ALWAYS);break;case Uc:i.depthFunc(i.LESS);break;case kr:i.depthFunc(i.LEQUAL);break;case Nc:i.depthFunc(i.EQUAL);break;case Fc:i.depthFunc(i.GEQUAL);break;case Oc:i.depthFunc(i.GREATER);break;case zc:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}nt=Ct}},setLocked:function(Ct){N=Ct},setClear:function(Ct){Rt!==Ct&&(Tt&&(Ct=1-Ct),i.clearDepth(Ct),Rt=Ct)},reset:function(){N=!1,J=null,nt=null,Rt=null,Tt=!1}}}function s(){let N=!1,Tt=null,J=null,nt=null,Rt=null,Ct=null,ne=null,Se=null,ze=null;return{setTest:function(le){N||(le?dt(i.STENCIL_TEST):zt(i.STENCIL_TEST))},setMask:function(le){Tt!==le&&!N&&(i.stencilMask(le),Tt=le)},setFunc:function(le,He,Mn){(J!==le||nt!==He||Rt!==Mn)&&(i.stencilFunc(le,He,Mn),J=le,nt=He,Rt=Mn)},setOp:function(le,He,Mn){(Ct!==le||ne!==He||Se!==Mn)&&(i.stencilOp(le,He,Mn),Ct=le,ne=He,Se=Mn)},setLocked:function(le){N=le},setClear:function(le){ze!==le&&(i.clearStencil(le),ze=le)},reset:function(){N=!1,Tt=null,J=null,nt=null,Rt=null,Ct=null,ne=null,Se=null,ze=null}}}let r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},d=new WeakMap,f=[],p=null,x=!1,g=null,m=null,M=null,_=null,v=null,w=null,R=null,T=new ft(0,0,0),C=0,b=!1,E=null,D=null,Y=null,H=null,X=null,Z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),O=!1,ct=0,K=i.getParameter(i.VERSION);K.indexOf("WebGL")!==-1?(ct=parseFloat(/^WebGL (\d)/.exec(K)[1]),O=ct>=1):K.indexOf("OpenGL ES")!==-1&&(ct=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),O=ct>=2);let W=null,j={},wt=i.getParameter(i.SCISSOR_BOX),Yt=i.getParameter(i.VIEWPORT),te=new sn().fromArray(wt),rt=new sn().fromArray(Yt);function mt(N,Tt,J,nt){let Rt=new Uint8Array(4),Ct=i.createTexture();i.bindTexture(N,Ct),i.texParameteri(N,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(N,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ne=0;ne<J;ne++)N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY?i.texImage3D(Tt,0,i.RGBA,1,1,nt,0,i.RGBA,i.UNSIGNED_BYTE,Rt):i.texImage2D(Tt+ne,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Rt);return Ct}let It={};It[i.TEXTURE_2D]=mt(i.TEXTURE_2D,i.TEXTURE_2D,1),It[i.TEXTURE_CUBE_MAP]=mt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),It[i.TEXTURE_2D_ARRAY]=mt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),It[i.TEXTURE_3D]=mt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),dt(i.DEPTH_TEST),o.setFunc(kr),xt(!1),Ut(xf),dt(i.CULL_FACE),L(Wi);function dt(N){h[N]!==!0&&(i.enable(N),h[N]=!0)}function zt(N){h[N]!==!1&&(i.disable(N),h[N]=!1)}function ie(N,Tt){return u[N]!==Tt?(i.bindFramebuffer(N,Tt),u[N]=Tt,N===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=Tt),N===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=Tt),!0):!1}function Vt(N,Tt){let J=f,nt=!1;if(N){J=d.get(Tt),J===void 0&&(J=[],d.set(Tt,J));let Rt=N.textures;if(J.length!==Rt.length||J[0]!==i.COLOR_ATTACHMENT0){for(let Ct=0,ne=Rt.length;Ct<ne;Ct++)J[Ct]=i.COLOR_ATTACHMENT0+Ct;J.length=Rt.length,nt=!0}}else J[0]!==i.BACK&&(J[0]=i.BACK,nt=!0);nt&&i.drawBuffers(J)}function oe(N){return p!==N?(i.useProgram(N),p=N,!0):!1}let at={[Zs]:i.FUNC_ADD,[om]:i.FUNC_SUBTRACT,[am]:i.FUNC_REVERSE_SUBTRACT};at[lm]=i.MIN,at[cm]=i.MAX;let St={[hm]:i.ZERO,[um]:i.ONE,[fm]:i.SRC_COLOR,[Pc]:i.SRC_ALPHA,[_m]:i.SRC_ALPHA_SATURATE,[gm]:i.DST_COLOR,[pm]:i.DST_ALPHA,[dm]:i.ONE_MINUS_SRC_COLOR,[Lc]:i.ONE_MINUS_SRC_ALPHA,[xm]:i.ONE_MINUS_DST_COLOR,[mm]:i.ONE_MINUS_DST_ALPHA,[vm]:i.CONSTANT_COLOR,[ym]:i.ONE_MINUS_CONSTANT_COLOR,[Mm]:i.CONSTANT_ALPHA,[bm]:i.ONE_MINUS_CONSTANT_ALPHA};function L(N,Tt,J,nt,Rt,Ct,ne,Se,ze,le){if(N===Wi){x===!0&&(zt(i.BLEND),x=!1);return}if(x===!1&&(dt(i.BLEND),x=!0),N!==rm){if(N!==g||le!==b){if((m!==Zs||v!==Zs)&&(i.blendEquation(i.FUNC_ADD),m=Zs,v=Zs),le)switch(N){case cs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case xi:i.blendFunc(i.ONE,i.ONE);break;case _f:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case vf:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case cs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case xi:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case _f:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case vf:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}M=null,_=null,w=null,R=null,T.set(0,0,0),C=0,g=N,b=le}return}Rt=Rt||Tt,Ct=Ct||J,ne=ne||nt,(Tt!==m||Rt!==v)&&(i.blendEquationSeparate(at[Tt],at[Rt]),m=Tt,v=Rt),(J!==M||nt!==_||Ct!==w||ne!==R)&&(i.blendFuncSeparate(St[J],St[nt],St[Ct],St[ne]),M=J,_=nt,w=Ct,R=ne),(Se.equals(T)===!1||ze!==C)&&(i.blendColor(Se.r,Se.g,Se.b,ze),T.copy(Se),C=ze),g=N,b=!1}function Zt(N,Tt){N.side===$e?zt(i.CULL_FACE):dt(i.CULL_FACE);let J=N.side===vn;Tt&&(J=!J),xt(J),N.blending===cs&&N.transparent===!1?L(Wi):L(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),o.setFunc(N.depthFunc),o.setTest(N.depthTest),o.setMask(N.depthWrite),r.setMask(N.colorWrite);let nt=N.stencilWrite;a.setTest(nt),nt&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),ee(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?dt(i.SAMPLE_ALPHA_TO_COVERAGE):zt(i.SAMPLE_ALPHA_TO_COVERAGE)}function xt(N){E!==N&&(N?i.frontFace(i.CW):i.frontFace(i.CCW),E=N)}function Ut(N){N!==im?(dt(i.CULL_FACE),N!==D&&(N===xf?i.cullFace(i.BACK):N===sm?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):zt(i.CULL_FACE),D=N}function Pt(N){N!==Y&&(O&&i.lineWidth(N),Y=N)}function ee(N,Tt,J){N?(dt(i.POLYGON_OFFSET_FILL),(H!==Tt||X!==J)&&(i.polygonOffset(Tt,J),H=Tt,X=J)):zt(i.POLYGON_OFFSET_FILL)}function Et(N){N?dt(i.SCISSOR_TEST):zt(i.SCISSOR_TEST)}function I(N){N===void 0&&(N=i.TEXTURE0+Z-1),W!==N&&(i.activeTexture(N),W=N)}function y(N,Tt,J){J===void 0&&(W===null?J=i.TEXTURE0+Z-1:J=W);let nt=j[J];nt===void 0&&(nt={type:void 0,texture:void 0},j[J]=nt),(nt.type!==N||nt.texture!==Tt)&&(W!==J&&(i.activeTexture(J),W=J),i.bindTexture(N,Tt||It[N]),nt.type=N,nt.texture=Tt)}function U(){let N=j[W];N!==void 0&&N.type!==void 0&&(i.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function z(){try{i.compressedTexImage2D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function V(){try{i.compressedTexImage3D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function B(){try{i.texSubImage2D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function vt(){try{i.texSubImage3D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function lt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Mt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Wt(){try{i.texStorage2D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function st(){try{i.texStorage3D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Q(){try{i.texImage2D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Lt(){try{i.texImage3D.apply(i,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Dt(N){te.equals(N)===!1&&(i.scissor(N.x,N.y,N.z,N.w),te.copy(N))}function ht(N){rt.equals(N)===!1&&(i.viewport(N.x,N.y,N.z,N.w),rt.copy(N))}function Kt(N,Tt){let J=c.get(Tt);J===void 0&&(J=new WeakMap,c.set(Tt,J));let nt=J.get(N);nt===void 0&&(nt=i.getUniformBlockIndex(Tt,N.name),J.set(N,nt))}function Ft(N,Tt){let nt=c.get(Tt).get(N);l.get(Tt)!==nt&&(i.uniformBlockBinding(Tt,nt,N.__bindingPointIndex),l.set(Tt,nt))}function Xt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},W=null,j={},u={},d=new WeakMap,f=[],p=null,x=!1,g=null,m=null,M=null,_=null,v=null,w=null,R=null,T=new ft(0,0,0),C=0,b=!1,E=null,D=null,Y=null,H=null,X=null,te.set(0,0,i.canvas.width,i.canvas.height),rt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:dt,disable:zt,bindFramebuffer:ie,drawBuffers:Vt,useProgram:oe,setBlending:L,setMaterial:Zt,setFlipSided:xt,setCullFace:Ut,setLineWidth:Pt,setPolygonOffset:ee,setScissorTest:Et,activeTexture:I,bindTexture:y,unbindTexture:U,compressedTexImage2D:z,compressedTexImage3D:V,texImage2D:Q,texImage3D:Lt,updateUBOMapping:Kt,uniformBlockBinding:Ft,texStorage2D:Wt,texStorage3D:st,texSubImage2D:B,texSubImage3D:vt,compressedTexSubImage2D:lt,compressedTexSubImage3D:Mt,scissor:Dt,viewport:ht,reset:Xt}}function gd(i,t,e,n){let s=Bv(n);switch(e){case Dd:return i*t;case Ud:return i*t;case Nd:return i*t*2;case au:return i*t/s.components*s.byteLength;case lu:return i*t/s.components*s.byteLength;case Fd:return i*t*2/s.components*s.byteLength;case cu:return i*t*2/s.components*s.byteLength;case kd:return i*t*3/s.components*s.byteLength;case ai:return i*t*4/s.components*s.byteLength;case hu:return i*t*4/s.components*s.byteLength;case Ra:case Ca:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ia:case Pa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Vc:case Xc:return Math.max(i,16)*Math.max(t,8)/4;case Gc:case Wc:return Math.max(i,8)*Math.max(t,8)/2;case qc:case Yc:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Zc:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Kc:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case $c:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Jc:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case jc:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Qc:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case th:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case eh:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case nh:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case ih:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case sh:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case rh:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case oh:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ah:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case lh:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case La:case ch:case hh:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Od:case uh:return Math.ceil(i/4)*Math.ceil(t/4)*8;case fh:case dh:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Bv(i){switch(i){case us:case Id:return{byteLength:1,components:1};case So:case Pd:case ki:return{byteLength:2,components:1};case ru:case ou:return{byteLength:2,components:4};case Js:case su:case Vi:return{byteLength:4,components:1};case Ld:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Hv(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new pt,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(I,y){return f?new OffscreenCanvas(I,y):Ua("canvas")}function x(I,y,U){let z=1,V=Et(I);if((V.width>U||V.height>U)&&(z=U/Math.max(V.width,V.height)),z<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let B=Math.floor(z*V.width),vt=Math.floor(z*V.height);u===void 0&&(u=p(B,vt));let lt=y?p(B,vt):u;return lt.width=B,lt.height=vt,lt.getContext("2d").drawImage(I,0,0,B,vt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+V.width+"x"+V.height+") to ("+B+"x"+vt+")."),lt}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+V.width+"x"+V.height+")."),I;return I}function g(I){return I.generateMipmaps}function m(I){i.generateMipmap(I)}function M(I){return I.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?i.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function _(I,y,U,z,V=!1){if(I!==null){if(i[I]!==void 0)return i[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let B=y;if(y===i.RED&&(U===i.FLOAT&&(B=i.R32F),U===i.HALF_FLOAT&&(B=i.R16F),U===i.UNSIGNED_BYTE&&(B=i.R8)),y===i.RED_INTEGER&&(U===i.UNSIGNED_BYTE&&(B=i.R8UI),U===i.UNSIGNED_SHORT&&(B=i.R16UI),U===i.UNSIGNED_INT&&(B=i.R32UI),U===i.BYTE&&(B=i.R8I),U===i.SHORT&&(B=i.R16I),U===i.INT&&(B=i.R32I)),y===i.RG&&(U===i.FLOAT&&(B=i.RG32F),U===i.HALF_FLOAT&&(B=i.RG16F),U===i.UNSIGNED_BYTE&&(B=i.RG8)),y===i.RG_INTEGER&&(U===i.UNSIGNED_BYTE&&(B=i.RG8UI),U===i.UNSIGNED_SHORT&&(B=i.RG16UI),U===i.UNSIGNED_INT&&(B=i.RG32UI),U===i.BYTE&&(B=i.RG8I),U===i.SHORT&&(B=i.RG16I),U===i.INT&&(B=i.RG32I)),y===i.RGB_INTEGER&&(U===i.UNSIGNED_BYTE&&(B=i.RGB8UI),U===i.UNSIGNED_SHORT&&(B=i.RGB16UI),U===i.UNSIGNED_INT&&(B=i.RGB32UI),U===i.BYTE&&(B=i.RGB8I),U===i.SHORT&&(B=i.RGB16I),U===i.INT&&(B=i.RGB32I)),y===i.RGBA_INTEGER&&(U===i.UNSIGNED_BYTE&&(B=i.RGBA8UI),U===i.UNSIGNED_SHORT&&(B=i.RGBA16UI),U===i.UNSIGNED_INT&&(B=i.RGBA32UI),U===i.BYTE&&(B=i.RGBA8I),U===i.SHORT&&(B=i.RGBA16I),U===i.INT&&(B=i.RGBA32I)),y===i.RGB&&U===i.UNSIGNED_INT_5_9_9_9_REV&&(B=i.RGB9_E5),y===i.RGBA){let vt=V?ll:Ae.getTransfer(z);U===i.FLOAT&&(B=i.RGBA32F),U===i.HALF_FLOAT&&(B=i.RGBA16F),U===i.UNSIGNED_BYTE&&(B=vt===Ue?i.SRGB8_ALPHA8:i.RGBA8),U===i.UNSIGNED_SHORT_4_4_4_4&&(B=i.RGBA4),U===i.UNSIGNED_SHORT_5_5_5_1&&(B=i.RGB5_A1)}return(B===i.R16F||B===i.R32F||B===i.RG16F||B===i.RG32F||B===i.RGBA16F||B===i.RGBA32F)&&t.get("EXT_color_buffer_float"),B}function v(I,y){let U;return I?y===null||y===Js||y===Fr?U=i.DEPTH24_STENCIL8:y===Vi?U=i.DEPTH32F_STENCIL8:y===So&&(U=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Js||y===Fr?U=i.DEPTH_COMPONENT24:y===Vi?U=i.DEPTH_COMPONENT32F:y===So&&(U=i.DEPTH_COMPONENT16),U}function w(I,y){return g(I)===!0||I.isFramebufferTexture&&I.minFilter!==Fn&&I.minFilter!==oi?Math.log2(Math.max(y.width,y.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?y.mipmaps.length:1}function R(I){let y=I.target;y.removeEventListener("dispose",R),C(y),y.isVideoTexture&&h.delete(y)}function T(I){let y=I.target;y.removeEventListener("dispose",T),E(y)}function C(I){let y=n.get(I);if(y.__webglInit===void 0)return;let U=I.source,z=d.get(U);if(z){let V=z[y.__cacheKey];V.usedTimes--,V.usedTimes===0&&b(I),Object.keys(z).length===0&&d.delete(U)}n.remove(I)}function b(I){let y=n.get(I);i.deleteTexture(y.__webglTexture);let U=I.source,z=d.get(U);delete z[y.__cacheKey],o.memory.textures--}function E(I){let y=n.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),n.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let z=0;z<6;z++){if(Array.isArray(y.__webglFramebuffer[z]))for(let V=0;V<y.__webglFramebuffer[z].length;V++)i.deleteFramebuffer(y.__webglFramebuffer[z][V]);else i.deleteFramebuffer(y.__webglFramebuffer[z]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[z])}else{if(Array.isArray(y.__webglFramebuffer))for(let z=0;z<y.__webglFramebuffer.length;z++)i.deleteFramebuffer(y.__webglFramebuffer[z]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let z=0;z<y.__webglColorRenderbuffer.length;z++)y.__webglColorRenderbuffer[z]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[z]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let U=I.textures;for(let z=0,V=U.length;z<V;z++){let B=n.get(U[z]);B.__webglTexture&&(i.deleteTexture(B.__webglTexture),o.memory.textures--),n.remove(U[z])}n.remove(I)}let D=0;function Y(){D=0}function H(){let I=D;return I>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+s.maxTextures),D+=1,I}function X(I){let y=[];return y.push(I.wrapS),y.push(I.wrapT),y.push(I.wrapR||0),y.push(I.magFilter),y.push(I.minFilter),y.push(I.anisotropy),y.push(I.internalFormat),y.push(I.format),y.push(I.type),y.push(I.generateMipmaps),y.push(I.premultiplyAlpha),y.push(I.flipY),y.push(I.unpackAlignment),y.push(I.colorSpace),y.join()}function Z(I,y){let U=n.get(I);if(I.isVideoTexture&&Pt(I),I.isRenderTargetTexture===!1&&I.version>0&&U.__version!==I.version){let z=I.image;if(z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{rt(U,I,y);return}}e.bindTexture(i.TEXTURE_2D,U.__webglTexture,i.TEXTURE0+y)}function O(I,y){let U=n.get(I);if(I.version>0&&U.__version!==I.version){rt(U,I,y);return}e.bindTexture(i.TEXTURE_2D_ARRAY,U.__webglTexture,i.TEXTURE0+y)}function ct(I,y){let U=n.get(I);if(I.version>0&&U.__version!==I.version){rt(U,I,y);return}e.bindTexture(i.TEXTURE_3D,U.__webglTexture,i.TEXTURE0+y)}function K(I,y){let U=n.get(I);if(I.version>0&&U.__version!==I.version){mt(U,I,y);return}e.bindTexture(i.TEXTURE_CUBE_MAP,U.__webglTexture,i.TEXTURE0+y)}let W={[Xi]:i.REPEAT,[Gi]:i.CLAMP_TO_EDGE,[Hc]:i.MIRRORED_REPEAT},j={[Fn]:i.NEAREST,[wm]:i.NEAREST_MIPMAP_NEAREST,[ta]:i.NEAREST_MIPMAP_LINEAR,[oi]:i.LINEAR,[Ql]:i.LINEAR_MIPMAP_NEAREST,[as]:i.LINEAR_MIPMAP_LINEAR},wt={[Im]:i.NEVER,[Nm]:i.ALWAYS,[Pm]:i.LESS,[zd]:i.LEQUAL,[Lm]:i.EQUAL,[Um]:i.GEQUAL,[Dm]:i.GREATER,[km]:i.NOTEQUAL};function Yt(I,y){if(y.type===Vi&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===oi||y.magFilter===Ql||y.magFilter===ta||y.magFilter===as||y.minFilter===oi||y.minFilter===Ql||y.minFilter===ta||y.minFilter===as)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(I,i.TEXTURE_WRAP_S,W[y.wrapS]),i.texParameteri(I,i.TEXTURE_WRAP_T,W[y.wrapT]),(I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY)&&i.texParameteri(I,i.TEXTURE_WRAP_R,W[y.wrapR]),i.texParameteri(I,i.TEXTURE_MAG_FILTER,j[y.magFilter]),i.texParameteri(I,i.TEXTURE_MIN_FILTER,j[y.minFilter]),y.compareFunction&&(i.texParameteri(I,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(I,i.TEXTURE_COMPARE_FUNC,wt[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Fn||y.minFilter!==ta&&y.minFilter!==as||y.type===Vi&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let U=t.get("EXT_texture_filter_anisotropic");i.texParameterf(I,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function te(I,y){let U=!1;I.__webglInit===void 0&&(I.__webglInit=!0,y.addEventListener("dispose",R));let z=y.source,V=d.get(z);V===void 0&&(V={},d.set(z,V));let B=X(y);if(B!==I.__cacheKey){V[B]===void 0&&(V[B]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,U=!0),V[B].usedTimes++;let vt=V[I.__cacheKey];vt!==void 0&&(V[I.__cacheKey].usedTimes--,vt.usedTimes===0&&b(y)),I.__cacheKey=B,I.__webglTexture=V[B].texture}return U}function rt(I,y,U){let z=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(z=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(z=i.TEXTURE_3D);let V=te(I,y),B=y.source;e.bindTexture(z,I.__webglTexture,i.TEXTURE0+U);let vt=n.get(B);if(B.version!==vt.__version||V===!0){e.activeTexture(i.TEXTURE0+U);let lt=Ae.getPrimaries(Ae.workingColorSpace),Mt=y.colorSpace===Hi?null:Ae.getPrimaries(y.colorSpace),Wt=y.colorSpace===Hi||lt===Mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Wt);let st=x(y.image,!1,s.maxTextureSize);st=ee(y,st);let Q=r.convert(y.format,y.colorSpace),Lt=r.convert(y.type),Dt=_(y.internalFormat,Q,Lt,y.colorSpace,y.isVideoTexture);Yt(z,y);let ht,Kt=y.mipmaps,Ft=y.isVideoTexture!==!0,Xt=vt.__version===void 0||V===!0,N=B.dataReady,Tt=w(y,st);if(y.isDepthTexture)Dt=v(y.format===Or,y.type),Xt&&(Ft?e.texStorage2D(i.TEXTURE_2D,1,Dt,st.width,st.height):e.texImage2D(i.TEXTURE_2D,0,Dt,st.width,st.height,0,Q,Lt,null));else if(y.isDataTexture)if(Kt.length>0){Ft&&Xt&&e.texStorage2D(i.TEXTURE_2D,Tt,Dt,Kt[0].width,Kt[0].height);for(let J=0,nt=Kt.length;J<nt;J++)ht=Kt[J],Ft?N&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,Q,Lt,ht.data):e.texImage2D(i.TEXTURE_2D,J,Dt,ht.width,ht.height,0,Q,Lt,ht.data);y.generateMipmaps=!1}else Ft?(Xt&&e.texStorage2D(i.TEXTURE_2D,Tt,Dt,st.width,st.height),N&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,st.width,st.height,Q,Lt,st.data)):e.texImage2D(i.TEXTURE_2D,0,Dt,st.width,st.height,0,Q,Lt,st.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ft&&Xt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Tt,Dt,Kt[0].width,Kt[0].height,st.depth);for(let J=0,nt=Kt.length;J<nt;J++)if(ht=Kt[J],y.format!==ai)if(Q!==null)if(Ft){if(N)if(y.layerUpdates.size>0){let Rt=gd(ht.width,ht.height,y.format,y.type);for(let Ct of y.layerUpdates){let ne=ht.data.subarray(Ct*Rt/ht.data.BYTES_PER_ELEMENT,(Ct+1)*Rt/ht.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,Ct,ht.width,ht.height,1,Q,ne)}y.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ht.width,ht.height,st.depth,Q,ht.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,J,Dt,ht.width,ht.height,st.depth,0,ht.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ft?N&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,ht.width,ht.height,st.depth,Q,Lt,ht.data):e.texImage3D(i.TEXTURE_2D_ARRAY,J,Dt,ht.width,ht.height,st.depth,0,Q,Lt,ht.data)}else{Ft&&Xt&&e.texStorage2D(i.TEXTURE_2D,Tt,Dt,Kt[0].width,Kt[0].height);for(let J=0,nt=Kt.length;J<nt;J++)ht=Kt[J],y.format!==ai?Q!==null?Ft?N&&e.compressedTexSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,Q,ht.data):e.compressedTexImage2D(i.TEXTURE_2D,J,Dt,ht.width,ht.height,0,ht.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?N&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,ht.width,ht.height,Q,Lt,ht.data):e.texImage2D(i.TEXTURE_2D,J,Dt,ht.width,ht.height,0,Q,Lt,ht.data)}else if(y.isDataArrayTexture)if(Ft){if(Xt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Tt,Dt,st.width,st.height,st.depth),N)if(y.layerUpdates.size>0){let J=gd(st.width,st.height,y.format,y.type);for(let nt of y.layerUpdates){let Rt=st.data.subarray(nt*J/st.data.BYTES_PER_ELEMENT,(nt+1)*J/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,nt,st.width,st.height,1,Q,Lt,Rt)}y.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,Q,Lt,st.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Dt,st.width,st.height,st.depth,0,Q,Lt,st.data);else if(y.isData3DTexture)Ft?(Xt&&e.texStorage3D(i.TEXTURE_3D,Tt,Dt,st.width,st.height,st.depth),N&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,Q,Lt,st.data)):e.texImage3D(i.TEXTURE_3D,0,Dt,st.width,st.height,st.depth,0,Q,Lt,st.data);else if(y.isFramebufferTexture){if(Xt)if(Ft)e.texStorage2D(i.TEXTURE_2D,Tt,Dt,st.width,st.height);else{let J=st.width,nt=st.height;for(let Rt=0;Rt<Tt;Rt++)e.texImage2D(i.TEXTURE_2D,Rt,Dt,J,nt,0,Q,Lt,null),J>>=1,nt>>=1}}else if(Kt.length>0){if(Ft&&Xt){let J=Et(Kt[0]);e.texStorage2D(i.TEXTURE_2D,Tt,Dt,J.width,J.height)}for(let J=0,nt=Kt.length;J<nt;J++)ht=Kt[J],Ft?N&&e.texSubImage2D(i.TEXTURE_2D,J,0,0,Q,Lt,ht):e.texImage2D(i.TEXTURE_2D,J,Dt,Q,Lt,ht);y.generateMipmaps=!1}else if(Ft){if(Xt){let J=Et(st);e.texStorage2D(i.TEXTURE_2D,Tt,Dt,J.width,J.height)}N&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Q,Lt,st)}else e.texImage2D(i.TEXTURE_2D,0,Dt,Q,Lt,st);g(y)&&m(z),vt.__version=B.version,y.onUpdate&&y.onUpdate(y)}I.__version=y.version}function mt(I,y,U){if(y.image.length!==6)return;let z=te(I,y),V=y.source;e.bindTexture(i.TEXTURE_CUBE_MAP,I.__webglTexture,i.TEXTURE0+U);let B=n.get(V);if(V.version!==B.__version||z===!0){e.activeTexture(i.TEXTURE0+U);let vt=Ae.getPrimaries(Ae.workingColorSpace),lt=y.colorSpace===Hi?null:Ae.getPrimaries(y.colorSpace),Mt=y.colorSpace===Hi||vt===lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Mt);let Wt=y.isCompressedTexture||y.image[0].isCompressedTexture,st=y.image[0]&&y.image[0].isDataTexture,Q=[];for(let nt=0;nt<6;nt++)!Wt&&!st?Q[nt]=x(y.image[nt],!0,s.maxCubemapSize):Q[nt]=st?y.image[nt].image:y.image[nt],Q[nt]=ee(y,Q[nt]);let Lt=Q[0],Dt=r.convert(y.format,y.colorSpace),ht=r.convert(y.type),Kt=_(y.internalFormat,Dt,ht,y.colorSpace),Ft=y.isVideoTexture!==!0,Xt=B.__version===void 0||z===!0,N=V.dataReady,Tt=w(y,Lt);Yt(i.TEXTURE_CUBE_MAP,y);let J;if(Wt){Ft&&Xt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Tt,Kt,Lt.width,Lt.height);for(let nt=0;nt<6;nt++){J=Q[nt].mipmaps;for(let Rt=0;Rt<J.length;Rt++){let Ct=J[Rt];y.format!==ai?Dt!==null?Ft?N&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt,0,0,Ct.width,Ct.height,Dt,Ct.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt,Kt,Ct.width,Ct.height,0,Ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ft?N&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt,0,0,Ct.width,Ct.height,Dt,ht,Ct.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt,Kt,Ct.width,Ct.height,0,Dt,ht,Ct.data)}}}else{if(J=y.mipmaps,Ft&&Xt){J.length>0&&Tt++;let nt=Et(Q[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Tt,Kt,nt.width,nt.height)}for(let nt=0;nt<6;nt++)if(st){Ft?N&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,Q[nt].width,Q[nt].height,Dt,ht,Q[nt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Kt,Q[nt].width,Q[nt].height,0,Dt,ht,Q[nt].data);for(let Rt=0;Rt<J.length;Rt++){let ne=J[Rt].image[nt].image;Ft?N&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt+1,0,0,ne.width,ne.height,Dt,ht,ne.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt+1,Kt,ne.width,ne.height,0,Dt,ht,ne.data)}}else{Ft?N&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,Dt,ht,Q[nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Kt,Dt,ht,Q[nt]);for(let Rt=0;Rt<J.length;Rt++){let Ct=J[Rt];Ft?N&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt+1,0,0,Dt,ht,Ct.image[nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Rt+1,Kt,Dt,ht,Ct.image[nt])}}}g(y)&&m(i.TEXTURE_CUBE_MAP),B.__version=V.version,y.onUpdate&&y.onUpdate(y)}I.__version=y.version}function It(I,y,U,z,V,B){let vt=r.convert(U.format,U.colorSpace),lt=r.convert(U.type),Mt=_(U.internalFormat,vt,lt,U.colorSpace),Wt=n.get(y),st=n.get(U);if(st.__renderTarget=y,!Wt.__hasExternalTextures){let Q=Math.max(1,y.width>>B),Lt=Math.max(1,y.height>>B);V===i.TEXTURE_3D||V===i.TEXTURE_2D_ARRAY?e.texImage3D(V,B,Mt,Q,Lt,y.depth,0,vt,lt,null):e.texImage2D(V,B,Mt,Q,Lt,0,vt,lt,null)}e.bindFramebuffer(i.FRAMEBUFFER,I),Ut(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,z,V,st.__webglTexture,0,xt(y)):(V===i.TEXTURE_2D||V>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&V<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,z,V,st.__webglTexture,B),e.bindFramebuffer(i.FRAMEBUFFER,null)}function dt(I,y,U){if(i.bindRenderbuffer(i.RENDERBUFFER,I),y.depthBuffer){let z=y.depthTexture,V=z&&z.isDepthTexture?z.type:null,B=v(y.stencilBuffer,V),vt=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=xt(y);Ut(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,lt,B,y.width,y.height):U?i.renderbufferStorageMultisample(i.RENDERBUFFER,lt,B,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,B,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,vt,i.RENDERBUFFER,I)}else{let z=y.textures;for(let V=0;V<z.length;V++){let B=z[V],vt=r.convert(B.format,B.colorSpace),lt=r.convert(B.type),Mt=_(B.internalFormat,vt,lt,B.colorSpace),Wt=xt(y);U&&Ut(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Wt,Mt,y.width,y.height):Ut(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Wt,Mt,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Mt,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function zt(I,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,I),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let z=n.get(y.depthTexture);z.__renderTarget=y,(!z.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Z(y.depthTexture,0);let V=z.__webglTexture,B=xt(y);if(y.depthTexture.format===Pr)Ut(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,V,0,B):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,V,0);else if(y.depthTexture.format===Or)Ut(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,V,0,B):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,V,0);else throw new Error("Unknown depthTexture format")}function ie(I){let y=n.get(I),U=I.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==I.depthTexture){let z=I.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),z){let V=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,z.removeEventListener("dispose",V)};z.addEventListener("dispose",V),y.__depthDisposeCallback=V}y.__boundDepthTexture=z}if(I.depthTexture&&!y.__autoAllocateDepthBuffer){if(U)throw new Error("target.depthTexture not supported in Cube render targets");zt(y.__webglFramebuffer,I)}else if(U){y.__webglDepthbuffer=[];for(let z=0;z<6;z++)if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[z]),y.__webglDepthbuffer[z]===void 0)y.__webglDepthbuffer[z]=i.createRenderbuffer(),dt(y.__webglDepthbuffer[z],I,!1);else{let V=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,B=y.__webglDepthbuffer[z];i.bindRenderbuffer(i.RENDERBUFFER,B),i.framebufferRenderbuffer(i.FRAMEBUFFER,V,i.RENDERBUFFER,B)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),dt(y.__webglDepthbuffer,I,!1);else{let z=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,V=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,V),i.framebufferRenderbuffer(i.FRAMEBUFFER,z,i.RENDERBUFFER,V)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Vt(I,y,U){let z=n.get(I);y!==void 0&&It(z.__webglFramebuffer,I,I.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),U!==void 0&&ie(I)}function oe(I){let y=I.texture,U=n.get(I),z=n.get(y);I.addEventListener("dispose",T);let V=I.textures,B=I.isWebGLCubeRenderTarget===!0,vt=V.length>1;if(vt||(z.__webglTexture===void 0&&(z.__webglTexture=i.createTexture()),z.__version=y.version,o.memory.textures++),B){U.__webglFramebuffer=[];for(let lt=0;lt<6;lt++)if(y.mipmaps&&y.mipmaps.length>0){U.__webglFramebuffer[lt]=[];for(let Mt=0;Mt<y.mipmaps.length;Mt++)U.__webglFramebuffer[lt][Mt]=i.createFramebuffer()}else U.__webglFramebuffer[lt]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){U.__webglFramebuffer=[];for(let lt=0;lt<y.mipmaps.length;lt++)U.__webglFramebuffer[lt]=i.createFramebuffer()}else U.__webglFramebuffer=i.createFramebuffer();if(vt)for(let lt=0,Mt=V.length;lt<Mt;lt++){let Wt=n.get(V[lt]);Wt.__webglTexture===void 0&&(Wt.__webglTexture=i.createTexture(),o.memory.textures++)}if(I.samples>0&&Ut(I)===!1){U.__webglMultisampledFramebuffer=i.createFramebuffer(),U.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let lt=0;lt<V.length;lt++){let Mt=V[lt];U.__webglColorRenderbuffer[lt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,U.__webglColorRenderbuffer[lt]);let Wt=r.convert(Mt.format,Mt.colorSpace),st=r.convert(Mt.type),Q=_(Mt.internalFormat,Wt,st,Mt.colorSpace,I.isXRRenderTarget===!0),Lt=xt(I);i.renderbufferStorageMultisample(i.RENDERBUFFER,Lt,Q,I.width,I.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,U.__webglColorRenderbuffer[lt])}i.bindRenderbuffer(i.RENDERBUFFER,null),I.depthBuffer&&(U.__webglDepthRenderbuffer=i.createRenderbuffer(),dt(U.__webglDepthRenderbuffer,I,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(B){e.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture),Yt(i.TEXTURE_CUBE_MAP,y);for(let lt=0;lt<6;lt++)if(y.mipmaps&&y.mipmaps.length>0)for(let Mt=0;Mt<y.mipmaps.length;Mt++)It(U.__webglFramebuffer[lt][Mt],I,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,Mt);else It(U.__webglFramebuffer[lt],I,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0);g(y)&&m(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(vt){for(let lt=0,Mt=V.length;lt<Mt;lt++){let Wt=V[lt],st=n.get(Wt);e.bindTexture(i.TEXTURE_2D,st.__webglTexture),Yt(i.TEXTURE_2D,Wt),It(U.__webglFramebuffer,I,Wt,i.COLOR_ATTACHMENT0+lt,i.TEXTURE_2D,0),g(Wt)&&m(i.TEXTURE_2D)}e.unbindTexture()}else{let lt=i.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(lt=I.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(lt,z.__webglTexture),Yt(lt,y),y.mipmaps&&y.mipmaps.length>0)for(let Mt=0;Mt<y.mipmaps.length;Mt++)It(U.__webglFramebuffer[Mt],I,y,i.COLOR_ATTACHMENT0,lt,Mt);else It(U.__webglFramebuffer,I,y,i.COLOR_ATTACHMENT0,lt,0);g(y)&&m(lt),e.unbindTexture()}I.depthBuffer&&ie(I)}function at(I){let y=I.textures;for(let U=0,z=y.length;U<z;U++){let V=y[U];if(g(V)){let B=M(I),vt=n.get(V).__webglTexture;e.bindTexture(B,vt),m(B),e.unbindTexture()}}}let St=[],L=[];function Zt(I){if(I.samples>0){if(Ut(I)===!1){let y=I.textures,U=I.width,z=I.height,V=i.COLOR_BUFFER_BIT,B=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,vt=n.get(I),lt=y.length>1;if(lt)for(let Mt=0;Mt<y.length;Mt++)e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,vt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglFramebuffer);for(let Mt=0;Mt<y.length;Mt++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(V|=i.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(V|=i.STENCIL_BUFFER_BIT)),lt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,vt.__webglColorRenderbuffer[Mt]);let Wt=n.get(y[Mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Wt,0)}i.blitFramebuffer(0,0,U,z,0,0,U,z,V,i.NEAREST),l===!0&&(St.length=0,L.length=0,St.push(i.COLOR_ATTACHMENT0+Mt),I.depthBuffer&&I.resolveDepthBuffer===!1&&(St.push(B),L.push(B),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,L)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,St))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),lt)for(let Mt=0;Mt<y.length;Mt++){e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,vt.__webglColorRenderbuffer[Mt]);let Wt=n.get(y[Mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,Wt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&l){let y=I.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function xt(I){return Math.min(s.maxSamples,I.samples)}function Ut(I){let y=n.get(I);return I.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Pt(I){let y=o.render.frame;h.get(I)!==y&&(h.set(I,y),I.update())}function ee(I,y){let U=I.colorSpace,z=I.format,V=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||U!==Xr&&U!==Hi&&(Ae.getTransfer(U)===Ue?(z!==ai||V!==us)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",U)),y}function Et(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=Y,this.setTexture2D=Z,this.setTexture2DArray=O,this.setTexture3D=ct,this.setTextureCube=K,this.rebindTextures=Vt,this.setupRenderTarget=oe,this.updateRenderTargetMipmap=at,this.updateMultisampleRenderTarget=Zt,this.setupDepthRenderbuffer=ie,this.setupFrameBufferTexture=It,this.useMultisampledRTT=Ut}function Gv(i,t){function e(n,s=Hi){let r,o=Ae.getTransfer(s);if(n===us)return i.UNSIGNED_BYTE;if(n===ru)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ou)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ld)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Id)return i.BYTE;if(n===Pd)return i.SHORT;if(n===So)return i.UNSIGNED_SHORT;if(n===su)return i.INT;if(n===Js)return i.UNSIGNED_INT;if(n===Vi)return i.FLOAT;if(n===ki)return i.HALF_FLOAT;if(n===Dd)return i.ALPHA;if(n===kd)return i.RGB;if(n===ai)return i.RGBA;if(n===Ud)return i.LUMINANCE;if(n===Nd)return i.LUMINANCE_ALPHA;if(n===Pr)return i.DEPTH_COMPONENT;if(n===Or)return i.DEPTH_STENCIL;if(n===au)return i.RED;if(n===lu)return i.RED_INTEGER;if(n===Fd)return i.RG;if(n===cu)return i.RG_INTEGER;if(n===hu)return i.RGBA_INTEGER;if(n===Ra||n===Ca||n===Ia||n===Pa)if(o===Ue)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ra)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ca)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ia)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Pa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ra)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ca)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ia)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Pa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Gc||n===Vc||n===Wc||n===Xc)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Gc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Vc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Wc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===qc||n===Yc||n===Zc)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===qc||n===Yc)return o===Ue?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Zc)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Kc||n===$c||n===Jc||n===jc||n===Qc||n===th||n===eh||n===nh||n===ih||n===sh||n===rh||n===oh||n===ah||n===lh)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Kc)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===$c)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Jc)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===jc)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Qc)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===th)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===eh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===nh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ih)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===sh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===rh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===oh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ah)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===lh)return o===Ue?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===La||n===ch||n===hh)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===La)return o===Ue?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ch)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===hh)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Od||n===uh||n===fh||n===dh)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===La)return r.COMPRESSED_RED_RGTC1_EXT;if(n===uh)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===fh)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===dh)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Fr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Rh=class extends Nn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},pe=class extends rn{constructor(){super(),this.isGroup=!0,this.type="Group"}},Vv={type:"move"},_o=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let x of t.hand.values()){let g=e.getJointPose(x,n),m=this._getHandJoint(c,x);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Vv)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new pe;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Wv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Xv=`
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

}`,Ch=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Jn,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Be({vertexShader:Wv,fragmentShader:Xv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new $t(new zn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ih=class extends Cs{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,p=null,x=new Ch,g=e.getContextAttributes(),m=null,M=null,_=[],v=[],w=new pt,R=null,T=new Nn;T.viewport=new sn;let C=new Nn;C.viewport=new sn;let b=[T,C],E=new Rh,D=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(rt){let mt=_[rt];return mt===void 0&&(mt=new _o,_[rt]=mt),mt.getTargetRaySpace()},this.getControllerGrip=function(rt){let mt=_[rt];return mt===void 0&&(mt=new _o,_[rt]=mt),mt.getGripSpace()},this.getHand=function(rt){let mt=_[rt];return mt===void 0&&(mt=new _o,_[rt]=mt),mt.getHandSpace()};function H(rt){let mt=v.indexOf(rt.inputSource);if(mt===-1)return;let It=_[mt];It!==void 0&&(It.update(rt.inputSource,rt.frame,c||o),It.dispatchEvent({type:rt.type,data:rt.inputSource}))}function X(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",Z);for(let rt=0;rt<_.length;rt++){let mt=v[rt];mt!==null&&(v[rt]=null,_[rt].disconnect(mt))}D=null,Y=null,x.reset(),t.setRenderTarget(m),f=null,d=null,u=null,s=null,M=null,te.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(rt){r=rt,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(rt){a=rt,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(rt){c=rt},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(rt){if(s=rt,s!==null){if(m=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",X),s.addEventListener("inputsourceschange",Z),g.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(w),s.renderState.layers===void 0){let mt={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,mt),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new On(f.framebufferWidth,f.framebufferHeight,{format:ai,type:us,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let mt=null,It=null,dt=null;g.depth&&(dt=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,mt=g.stencil?Or:Pr,It=g.stencil?Fr:Js);let zt={colorFormat:e.RGBA8,depthFormat:dt,scaleFactor:r};u=new XRWebGLBinding(s,e),d=u.createProjectionLayer(zt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),M=new On(d.textureWidth,d.textureHeight,{format:ai,type:us,depthTexture:new Wa(d.textureWidth,d.textureHeight,It,void 0,void 0,void 0,void 0,void 0,void 0,mt),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),te.setContext(s),te.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function Z(rt){for(let mt=0;mt<rt.removed.length;mt++){let It=rt.removed[mt],dt=v.indexOf(It);dt>=0&&(v[dt]=null,_[dt].disconnect(It))}for(let mt=0;mt<rt.added.length;mt++){let It=rt.added[mt],dt=v.indexOf(It);if(dt===-1){for(let ie=0;ie<_.length;ie++)if(ie>=v.length){v.push(It),dt=ie;break}else if(v[ie]===null){v[ie]=It,dt=ie;break}if(dt===-1)break}let zt=_[dt];zt&&zt.connect(It)}}let O=new P,ct=new P;function K(rt,mt,It){O.setFromMatrixPosition(mt.matrixWorld),ct.setFromMatrixPosition(It.matrixWorld);let dt=O.distanceTo(ct),zt=mt.projectionMatrix.elements,ie=It.projectionMatrix.elements,Vt=zt[14]/(zt[10]-1),oe=zt[14]/(zt[10]+1),at=(zt[9]+1)/zt[5],St=(zt[9]-1)/zt[5],L=(zt[8]-1)/zt[0],Zt=(ie[8]+1)/ie[0],xt=Vt*L,Ut=Vt*Zt,Pt=dt/(-L+Zt),ee=Pt*-L;if(mt.matrixWorld.decompose(rt.position,rt.quaternion,rt.scale),rt.translateX(ee),rt.translateZ(Pt),rt.matrixWorld.compose(rt.position,rt.quaternion,rt.scale),rt.matrixWorldInverse.copy(rt.matrixWorld).invert(),zt[10]===-1)rt.projectionMatrix.copy(mt.projectionMatrix),rt.projectionMatrixInverse.copy(mt.projectionMatrixInverse);else{let Et=Vt+Pt,I=oe+Pt,y=xt-ee,U=Ut+(dt-ee),z=at*oe/I*Et,V=St*oe/I*Et;rt.projectionMatrix.makePerspective(y,U,z,V,Et,I),rt.projectionMatrixInverse.copy(rt.projectionMatrix).invert()}}function W(rt,mt){mt===null?rt.matrixWorld.copy(rt.matrix):rt.matrixWorld.multiplyMatrices(mt.matrixWorld,rt.matrix),rt.matrixWorldInverse.copy(rt.matrixWorld).invert()}this.updateCamera=function(rt){if(s===null)return;let mt=rt.near,It=rt.far;x.texture!==null&&(x.depthNear>0&&(mt=x.depthNear),x.depthFar>0&&(It=x.depthFar)),E.near=C.near=T.near=mt,E.far=C.far=T.far=It,(D!==E.near||Y!==E.far)&&(s.updateRenderState({depthNear:E.near,depthFar:E.far}),D=E.near,Y=E.far),T.layers.mask=rt.layers.mask|2,C.layers.mask=rt.layers.mask|4,E.layers.mask=T.layers.mask|C.layers.mask;let dt=rt.parent,zt=E.cameras;W(E,dt);for(let ie=0;ie<zt.length;ie++)W(zt[ie],dt);zt.length===2?K(E,T,C):E.projectionMatrix.copy(T.projectionMatrix),j(rt,E,dt)};function j(rt,mt,It){It===null?rt.matrix.copy(mt.matrixWorld):(rt.matrix.copy(It.matrixWorld),rt.matrix.invert(),rt.matrix.multiply(mt.matrixWorld)),rt.matrix.decompose(rt.position,rt.quaternion,rt.scale),rt.updateMatrixWorld(!0),rt.projectionMatrix.copy(mt.projectionMatrix),rt.projectionMatrixInverse.copy(mt.projectionMatrixInverse),rt.isPerspectiveCamera&&(rt.fov=Eo*2*Math.atan(1/rt.projectionMatrix.elements[5]),rt.zoom=1)}this.getCamera=function(){return E},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(rt){l=rt,d!==null&&(d.fixedFoveation=rt),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=rt)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(E)};let wt=null;function Yt(rt,mt){if(h=mt.getViewerPose(c||o),p=mt,h!==null){let It=h.views;f!==null&&(t.setRenderTargetFramebuffer(M,f.framebuffer),t.setRenderTarget(M));let dt=!1;It.length!==E.cameras.length&&(E.cameras.length=0,dt=!0);for(let ie=0;ie<It.length;ie++){let Vt=It[ie],oe=null;if(f!==null)oe=f.getViewport(Vt);else{let St=u.getViewSubImage(d,Vt);oe=St.viewport,ie===0&&(t.setRenderTargetTextures(M,St.colorTexture,d.ignoreDepthValues?void 0:St.depthStencilTexture),t.setRenderTarget(M))}let at=b[ie];at===void 0&&(at=new Nn,at.layers.enable(ie),at.viewport=new sn,b[ie]=at),at.matrix.fromArray(Vt.transform.matrix),at.matrix.decompose(at.position,at.quaternion,at.scale),at.projectionMatrix.fromArray(Vt.projectionMatrix),at.projectionMatrixInverse.copy(at.projectionMatrix).invert(),at.viewport.set(oe.x,oe.y,oe.width,oe.height),ie===0&&(E.matrix.copy(at.matrix),E.matrix.decompose(E.position,E.quaternion,E.scale)),dt===!0&&E.cameras.push(at)}let zt=s.enabledFeatures;if(zt&&zt.includes("depth-sensing")){let ie=u.getDepthInformation(It[0]);ie&&ie.isValid&&ie.texture&&x.init(t,ie,s.renderState)}}for(let It=0;It<_.length;It++){let dt=v[It],zt=_[It];dt!==null&&zt!==void 0&&zt.update(dt,mt,c||o)}wt&&wt(rt,mt),mt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:mt}),p=null}let te=new Vd;te.setAnimationLoop(Yt),this.setAnimationLoop=function(rt){wt=rt},this.dispose=function(){}}},qs=new bn,qv=new ue;function Yv(i,t){function e(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,Gd(i)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function s(g,m,M,_,v){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(g,m):m.isMeshToonMaterial?(r(g,m),u(g,m)):m.isMeshPhongMaterial?(r(g,m),h(g,m)):m.isMeshStandardMaterial?(r(g,m),d(g,m),m.isMeshPhysicalMaterial&&f(g,m,v)):m.isMeshMatcapMaterial?(r(g,m),p(g,m)):m.isMeshDepthMaterial?r(g,m):m.isMeshDistanceMaterial?(r(g,m),x(g,m)):m.isMeshNormalMaterial?r(g,m):m.isLineBasicMaterial?(o(g,m),m.isLineDashedMaterial&&a(g,m)):m.isPointsMaterial?l(g,m,M,_):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,e(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===vn&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,e(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===vn&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,e(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,e(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let M=t.get(m),_=M.envMap,v=M.envMapRotation;_&&(g.envMap.value=_,qs.copy(v),qs.x*=-1,qs.y*=-1,qs.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(qs.y*=-1,qs.z*=-1),g.envMapRotation.value.setFromMatrix4(qv.makeRotationFromEuler(qs)),g.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,g.aoMapTransform))}function o(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform))}function a(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,M,_){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*M,g.scale.value=_*.5,m.map&&(g.map.value=m.map,e(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function u(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function d(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,M){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===vn&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=M.texture,g.transmissionSamplerSize.value.set(M.width,M.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function x(g,m){let M=t.get(m).light;g.referencePosition.value.setFromMatrixPosition(M.matrixWorld),g.nearDistance.value=M.shadow.camera.near,g.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Zv(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,_){let v=_.program;n.uniformBlockBinding(M,v)}function c(M,_){let v=s[M.id];v===void 0&&(p(M),v=h(M),s[M.id]=v,M.addEventListener("dispose",g));let w=_.program;n.updateUBOMapping(M,w);let R=t.render.frame;r[M.id]!==R&&(d(M),r[M.id]=R)}function h(M){let _=u();M.__bindingPointIndex=_;let v=i.createBuffer(),w=M.__size,R=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,w,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,_,v),v}function u(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){let _=s[M.id],v=M.uniforms,w=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,_);for(let R=0,T=v.length;R<T;R++){let C=Array.isArray(v[R])?v[R]:[v[R]];for(let b=0,E=C.length;b<E;b++){let D=C[b];if(f(D,R,b,w)===!0){let Y=D.__offset,H=Array.isArray(D.value)?D.value:[D.value],X=0;for(let Z=0;Z<H.length;Z++){let O=H[Z],ct=x(O);typeof O=="number"||typeof O=="boolean"?(D.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,Y+X,D.__data)):O.isMatrix3?(D.__data[0]=O.elements[0],D.__data[1]=O.elements[1],D.__data[2]=O.elements[2],D.__data[3]=0,D.__data[4]=O.elements[3],D.__data[5]=O.elements[4],D.__data[6]=O.elements[5],D.__data[7]=0,D.__data[8]=O.elements[6],D.__data[9]=O.elements[7],D.__data[10]=O.elements[8],D.__data[11]=0):(O.toArray(D.__data,X),X+=ct.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,Y,D.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(M,_,v,w){let R=M.value,T=_+"_"+v;if(w[T]===void 0)return typeof R=="number"||typeof R=="boolean"?w[T]=R:w[T]=R.clone(),!0;{let C=w[T];if(typeof R=="number"||typeof R=="boolean"){if(C!==R)return w[T]=R,!0}else if(C.equals(R)===!1)return C.copy(R),!0}return!1}function p(M){let _=M.uniforms,v=0,w=16;for(let T=0,C=_.length;T<C;T++){let b=Array.isArray(_[T])?_[T]:[_[T]];for(let E=0,D=b.length;E<D;E++){let Y=b[E],H=Array.isArray(Y.value)?Y.value:[Y.value];for(let X=0,Z=H.length;X<Z;X++){let O=H[X],ct=x(O),K=v%w,W=K%ct.boundary,j=K+W;v+=W,j!==0&&w-j<ct.storage&&(v+=w-j),Y.__data=new Float32Array(ct.storage/Float32Array.BYTES_PER_ELEMENT),Y.__offset=v,v+=ct.storage}}}let R=v%w;return R>0&&(v+=w-R),M.__size=v,M.__cache={},this}function x(M){let _={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(_.boundary=4,_.storage=4):M.isVector2?(_.boundary=8,_.storage=8):M.isVector3||M.isColor?(_.boundary=16,_.storage=12):M.isVector4?(_.boundary=16,_.storage=16):M.isMatrix3?(_.boundary=48,_.storage=48):M.isMatrix4?(_.boundary=64,_.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),_}function g(M){let _=M.target;_.removeEventListener("dispose",g);let v=o.indexOf(_.__bindingPointIndex);o.splice(v,1),i.deleteBuffer(s[_.id]),delete s[_.id],delete r[_.id]}function m(){for(let M in s)i.deleteBuffer(s[M]);o=[],s={},r={}}return{bind:l,update:c,dispose:m}}var Xa=class{constructor(t={}){let{canvas:e=Qm(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;let p=new Uint32Array(4),x=new Int32Array(4),g=null,m=null,M=[],_=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ke,this.toneMapping=As,this.toneMappingExposure=1;let v=this,w=!1,R=0,T=0,C=null,b=-1,E=null,D=new sn,Y=new sn,H=null,X=new ft(0),Z=0,O=e.width,ct=e.height,K=1,W=null,j=null,wt=new sn(0,0,O,ct),Yt=new sn(0,0,O,ct),te=!1,rt=new To,mt=!1,It=!1,dt=new ue,zt=new ue,ie=new P,Vt=new sn,oe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},at=!1;function St(){return C===null?K:1}let L=n;function Zt(A,G){return e.getContext(A,G)}try{let A={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r170"),e.addEventListener("webglcontextlost",nt,!1),e.addEventListener("webglcontextrestored",Rt,!1),e.addEventListener("webglcontextcreationerror",Ct,!1),L===null){let G="webgl2";if(L=Zt(G,A),L===null)throw Zt(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let xt,Ut,Pt,ee,Et,I,y,U,z,V,B,vt,lt,Mt,Wt,st,Q,Lt,Dt,ht,Kt,Ft,Xt,N;function Tt(){xt=new h_(L),xt.init(),Ft=new Gv(L,xt),Ut=new s_(L,xt,t,Ft),Pt=new zv(L,xt),Ut.reverseDepthBuffer&&d&&Pt.buffers.depth.setReversed(!0),ee=new d_(L),Et=new wv,I=new Hv(L,xt,Pt,Et,Ut,Ft,ee),y=new o_(v),U=new c_(v),z=new y0(L),Xt=new n_(L,z),V=new u_(L,z,ee,Xt),B=new m_(L,V,z,ee),Dt=new p_(L,Ut,I),st=new r_(Et),vt=new Tv(v,y,U,xt,Ut,Xt,st),lt=new Yv(v,Et),Mt=new Rv,Wt=new kv(xt),Lt=new e_(v,y,U,Pt,B,f,l),Q=new Fv(v,B,Ut),N=new Zv(L,ee,Ut,Pt),ht=new i_(L,xt,ee),Kt=new f_(L,xt,ee),ee.programs=vt.programs,v.capabilities=Ut,v.extensions=xt,v.properties=Et,v.renderLists=Mt,v.shadowMap=Q,v.state=Pt,v.info=ee}Tt();let J=new Ih(v,L);this.xr=J,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let A=xt.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=xt.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return K},this.setPixelRatio=function(A){A!==void 0&&(K=A,this.setSize(O,ct,!1))},this.getSize=function(A){return A.set(O,ct)},this.setSize=function(A,G,et=!0){if(J.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}O=A,ct=G,e.width=Math.floor(A*K),e.height=Math.floor(G*K),et===!0&&(e.style.width=A+"px",e.style.height=G+"px"),this.setViewport(0,0,A,G)},this.getDrawingBufferSize=function(A){return A.set(O*K,ct*K).floor()},this.setDrawingBufferSize=function(A,G,et){O=A,ct=G,K=et,e.width=Math.floor(A*et),e.height=Math.floor(G*et),this.setViewport(0,0,A,G)},this.getCurrentViewport=function(A){return A.copy(D)},this.getViewport=function(A){return A.copy(wt)},this.setViewport=function(A,G,et,tt){A.isVector4?wt.set(A.x,A.y,A.z,A.w):wt.set(A,G,et,tt),Pt.viewport(D.copy(wt).multiplyScalar(K).round())},this.getScissor=function(A){return A.copy(Yt)},this.setScissor=function(A,G,et,tt){A.isVector4?Yt.set(A.x,A.y,A.z,A.w):Yt.set(A,G,et,tt),Pt.scissor(Y.copy(Yt).multiplyScalar(K).round())},this.getScissorTest=function(){return te},this.setScissorTest=function(A){Pt.setScissorTest(te=A)},this.setOpaqueSort=function(A){W=A},this.setTransparentSort=function(A){j=A},this.getClearColor=function(A){return A.copy(Lt.getClearColor())},this.setClearColor=function(){Lt.setClearColor.apply(Lt,arguments)},this.getClearAlpha=function(){return Lt.getClearAlpha()},this.setClearAlpha=function(){Lt.setClearAlpha.apply(Lt,arguments)},this.clear=function(A=!0,G=!0,et=!0){let tt=0;if(A){let S=!1;if(C!==null){let F=C.texture.format;S=F===hu||F===cu||F===lu}if(S){let F=C.texture.type,k=F===us||F===Js||F===So||F===Fr||F===ru||F===ou,q=Lt.getClearColor(),$=Lt.getClearAlpha(),ut=q.r,gt=q.g,ot=q.b;k?(p[0]=ut,p[1]=gt,p[2]=ot,p[3]=$,L.clearBufferuiv(L.COLOR,0,p)):(x[0]=ut,x[1]=gt,x[2]=ot,x[3]=$,L.clearBufferiv(L.COLOR,0,x))}else tt|=L.COLOR_BUFFER_BIT}G&&(tt|=L.DEPTH_BUFFER_BIT),et&&(tt|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(tt)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",nt,!1),e.removeEventListener("webglcontextrestored",Rt,!1),e.removeEventListener("webglcontextcreationerror",Ct,!1),Mt.dispose(),Wt.dispose(),Et.dispose(),y.dispose(),U.dispose(),B.dispose(),Xt.dispose(),N.dispose(),vt.dispose(),J.dispose(),J.removeEventListener("sessionstart",pi),J.removeEventListener("sessionend",wn),Pn.stop()};function nt(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function Rt(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;let A=ee.autoReset,G=Q.enabled,et=Q.autoUpdate,tt=Q.needsUpdate,S=Q.type;Tt(),ee.autoReset=A,Q.enabled=G,Q.autoUpdate=et,Q.needsUpdate=tt,Q.type=S}function Ct(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function ne(A){let G=A.target;G.removeEventListener("dispose",ne),Se(G)}function Se(A){ze(A),Et.remove(A)}function ze(A){let G=Et.get(A).programs;G!==void 0&&(G.forEach(function(et){vt.releaseProgram(et)}),A.isShaderMaterial&&vt.releaseShaderCache(A))}this.renderBufferDirect=function(A,G,et,tt,S,F){G===null&&(G=oe);let k=S.isMesh&&S.matrixWorld.determinant()<0,q=dn(A,G,et,tt,S);Pt.setMaterial(tt,k);let $=et.index,ut=1;if(tt.wireframe===!0){if($=V.getWireframeAttribute(et),$===void 0)return;ut=2}let gt=et.drawRange,ot=et.attributes.position,yt=gt.start*ut,At=(gt.start+gt.count)*ut;F!==null&&(yt=Math.max(yt,F.start*ut),At=Math.min(At,(F.start+F.count)*ut)),$!==null?(yt=Math.max(yt,0),At=Math.min(At,$.count)):ot!=null&&(yt=Math.max(yt,0),At=Math.min(At,ot.count));let Ht=At-yt;if(Ht<0||Ht===1/0)return;Xt.setup(S,tt,q,et,$);let ce,Gt=ht;if($!==null&&(ce=z.get($),Gt=Kt,Gt.setIndex(ce)),S.isMesh)tt.wireframe===!0?(Pt.setLineWidth(tt.wireframeLinewidth*St()),Gt.setMode(L.LINES)):Gt.setMode(L.TRIANGLES);else if(S.isLine){let Nt=tt.linewidth;Nt===void 0&&(Nt=1),Pt.setLineWidth(Nt*St()),S.isLineSegments?Gt.setMode(L.LINES):S.isLineLoop?Gt.setMode(L.LINE_LOOP):Gt.setMode(L.LINE_STRIP)}else S.isPoints?Gt.setMode(L.POINTS):S.isSprite&&Gt.setMode(L.TRIANGLES);if(S.isBatchedMesh)if(S._multiDrawInstances!==null)Gt.renderMultiDrawInstances(S._multiDrawStarts,S._multiDrawCounts,S._multiDrawCount,S._multiDrawInstances);else if(xt.get("WEBGL_multi_draw"))Gt.renderMultiDraw(S._multiDrawStarts,S._multiDrawCounts,S._multiDrawCount);else{let Nt=S._multiDrawStarts,Re=S._multiDrawCounts,se=S._multiDrawCount,he=$?z.get($).bytesPerElement:1,xe=Et.get(tt).currentProgram.getUniforms();for(let ve=0;ve<se;ve++)xe.setValue(L,"_gl_DrawID",ve),Gt.render(Nt[ve]/he,Re[ve])}else if(S.isInstancedMesh)Gt.renderInstances(yt,Ht,S.count);else if(et.isInstancedBufferGeometry){let Nt=et._maxInstanceCount!==void 0?et._maxInstanceCount:1/0,Re=Math.min(et.instanceCount,Nt);Gt.renderInstances(yt,Ht,Re)}else Gt.render(yt,Ht)};function le(A,G,et){A.transparent===!0&&A.side===$e&&A.forceSinglePass===!1?(A.side=vn,A.needsUpdate=!0,de(A,G,et),A.side=Rs,A.needsUpdate=!0,de(A,G,et),A.side=$e):de(A,G,et)}this.compile=function(A,G,et=null){et===null&&(et=A),m=Wt.get(et),m.init(G),_.push(m),et.traverseVisible(function(S){S.isLight&&S.layers.test(G.layers)&&(m.pushLight(S),S.castShadow&&m.pushShadow(S))}),A!==et&&A.traverseVisible(function(S){S.isLight&&S.layers.test(G.layers)&&(m.pushLight(S),S.castShadow&&m.pushShadow(S))}),m.setupLights();let tt=new Set;return A.traverse(function(S){if(!(S.isMesh||S.isPoints||S.isLine||S.isSprite))return;let F=S.material;if(F)if(Array.isArray(F))for(let k=0;k<F.length;k++){let q=F[k];le(q,et,S),tt.add(q)}else le(F,et,S),tt.add(F)}),_.pop(),m=null,tt},this.compileAsync=function(A,G,et=null){let tt=this.compile(A,G,et);return new Promise(S=>{function F(){if(tt.forEach(function(k){Et.get(k).currentProgram.isReady()&&tt.delete(k)}),tt.size===0){S(A);return}setTimeout(F,10)}xt.get("KHR_parallel_shader_compile")!==null?F():setTimeout(F,10)})};let He=null;function Mn(A){He&&He(A)}function pi(){Pn.stop()}function wn(){Pn.start()}let Pn=new Vd;Pn.setAnimationLoop(Mn),typeof self<"u"&&Pn.setContext(self),this.setAnimationLoop=function(A){He=A,J.setAnimationLoop(A),A===null?Pn.stop():Pn.start()},J.addEventListener("sessionstart",pi),J.addEventListener("sessionend",wn),this.render=function(A,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),J.enabled===!0&&J.isPresenting===!0&&(J.cameraAutoUpdate===!0&&J.updateCamera(G),G=J.getCamera()),A.isScene===!0&&A.onBeforeRender(v,A,G,C),m=Wt.get(A,_.length),m.init(G),_.push(m),zt.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),rt.setFromProjectionMatrix(zt),It=this.localClippingEnabled,mt=st.init(this.clippingPlanes,It),g=Mt.get(A,M.length),g.init(),M.push(g),J.enabled===!0&&J.isPresenting===!0){let F=v.xr.getDepthSensingMesh();F!==null&&un(F,G,-1/0,v.sortObjects)}un(A,G,0,v.sortObjects),g.finish(),v.sortObjects===!0&&g.sort(W,j),at=J.enabled===!1||J.isPresenting===!1||J.hasDepthSensing()===!1,at&&Lt.addToRenderList(g,A),this.info.render.frame++,mt===!0&&st.beginShadows();let et=m.state.shadowsArray;Q.render(et,A,G),mt===!0&&st.endShadows(),this.info.autoReset===!0&&this.info.reset();let tt=g.opaque,S=g.transmissive;if(m.setupLights(),G.isArrayCamera){let F=G.cameras;if(S.length>0)for(let k=0,q=F.length;k<q;k++){let $=F[k];qt(tt,S,A,$)}at&&Lt.render(A);for(let k=0,q=F.length;k<q;k++){let $=F[k];Kn(g,A,$,$.viewport)}}else S.length>0&&qt(tt,S,A,G),at&&Lt.render(A),Kn(g,A,G);C!==null&&(I.updateMultisampleRenderTarget(C),I.updateRenderTargetMipmap(C)),A.isScene===!0&&A.onAfterRender(v,A,G),Xt.resetDefaultState(),b=-1,E=null,_.pop(),_.length>0?(m=_[_.length-1],mt===!0&&st.setGlobalState(v.clippingPlanes,m.state.camera)):m=null,M.pop(),M.length>0?g=M[M.length-1]:g=null};function un(A,G,et,tt){if(A.visible===!1)return;if(A.layers.test(G.layers)){if(A.isGroup)et=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(G);else if(A.isLight)m.pushLight(A),A.castShadow&&m.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||rt.intersectsSprite(A)){tt&&Vt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(zt);let k=B.update(A),q=A.material;q.visible&&g.push(A,k,q,et,Vt.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||rt.intersectsObject(A))){let k=B.update(A),q=A.material;if(tt&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Vt.copy(A.boundingSphere.center)):(k.boundingSphere===null&&k.computeBoundingSphere(),Vt.copy(k.boundingSphere.center)),Vt.applyMatrix4(A.matrixWorld).applyMatrix4(zt)),Array.isArray(q)){let $=k.groups;for(let ut=0,gt=$.length;ut<gt;ut++){let ot=$[ut],yt=q[ot.materialIndex];yt&&yt.visible&&g.push(A,k,yt,et,Vt.z,ot)}}else q.visible&&g.push(A,k,q,et,Vt.z,null)}}let F=A.children;for(let k=0,q=F.length;k<q;k++)un(F[k],G,et,tt)}function Kn(A,G,et,tt){let S=A.opaque,F=A.transmissive,k=A.transparent;m.setupLightsView(et),mt===!0&&st.setGlobalState(v.clippingPlanes,et),tt&&Pt.viewport(D.copy(tt)),S.length>0&&Me(S,G,et),F.length>0&&Me(F,G,et),k.length>0&&Me(k,G,et),Pt.buffers.depth.setTest(!0),Pt.buffers.depth.setMask(!0),Pt.buffers.color.setMask(!0),Pt.setPolygonOffset(!1)}function qt(A,G,et,tt){if((et.isScene===!0?et.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[tt.id]===void 0&&(m.state.transmissionRenderTarget[tt.id]=new On(1,1,{generateMipmaps:!0,type:xt.has("EXT_color_buffer_half_float")||xt.has("EXT_color_buffer_float")?ki:us,minFilter:as,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ae.workingColorSpace}));let F=m.state.transmissionRenderTarget[tt.id],k=tt.viewport||D;F.setSize(k.z,k.w);let q=v.getRenderTarget();v.setRenderTarget(F),v.getClearColor(X),Z=v.getClearAlpha(),Z<1&&v.setClearColor(16777215,.5),v.clear(),at&&Lt.render(et);let $=v.toneMapping;v.toneMapping=As;let ut=tt.viewport;if(tt.viewport!==void 0&&(tt.viewport=void 0),m.setupLightsView(tt),mt===!0&&st.setGlobalState(v.clippingPlanes,tt),Me(A,et,tt),I.updateMultisampleRenderTarget(F),I.updateRenderTargetMipmap(F),xt.has("WEBGL_multisampled_render_to_texture")===!1){let gt=!1;for(let ot=0,yt=G.length;ot<yt;ot++){let At=G[ot],Ht=At.object,ce=At.geometry,Gt=At.material,Nt=At.group;if(Gt.side===$e&&Ht.layers.test(tt.layers)){let Re=Gt.side;Gt.side=vn,Gt.needsUpdate=!0,ae(Ht,et,tt,ce,Gt,Nt),Gt.side=Re,Gt.needsUpdate=!0,gt=!0}}gt===!0&&(I.updateMultisampleRenderTarget(F),I.updateRenderTargetMipmap(F))}v.setRenderTarget(q),v.setClearColor(X,Z),ut!==void 0&&(tt.viewport=ut),v.toneMapping=$}function Me(A,G,et){let tt=G.isScene===!0?G.overrideMaterial:null;for(let S=0,F=A.length;S<F;S++){let k=A[S],q=k.object,$=k.geometry,ut=tt===null?k.material:tt,gt=k.group;q.layers.test(et.layers)&&ae(q,G,et,$,ut,gt)}}function ae(A,G,et,tt,S,F){A.onBeforeRender(v,G,et,tt,S,F),A.modelViewMatrix.multiplyMatrices(et.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),S.onBeforeRender(v,G,et,tt,A,F),S.transparent===!0&&S.side===$e&&S.forceSinglePass===!1?(S.side=vn,S.needsUpdate=!0,v.renderBufferDirect(et,G,tt,S,A,F),S.side=Rs,S.needsUpdate=!0,v.renderBufferDirect(et,G,tt,S,A,F),S.side=$e):v.renderBufferDirect(et,G,tt,S,A,F),A.onAfterRender(v,G,et,tt,S,F)}function de(A,G,et){G.isScene!==!0&&(G=oe);let tt=Et.get(A),S=m.state.lights,F=m.state.shadowsArray,k=S.state.version,q=vt.getParameters(A,S.state,F,G,et),$=vt.getProgramCacheKey(q),ut=tt.programs;tt.environment=A.isMeshStandardMaterial?G.environment:null,tt.fog=G.fog,tt.envMap=(A.isMeshStandardMaterial?U:y).get(A.envMap||tt.environment),tt.envMapRotation=tt.environment!==null&&A.envMap===null?G.environmentRotation:A.envMapRotation,ut===void 0&&(A.addEventListener("dispose",ne),ut=new Map,tt.programs=ut);let gt=ut.get($);if(gt!==void 0){if(tt.currentProgram===gt&&tt.lightsStateVersion===k)return fn(A,q),gt}else q.uniforms=vt.getUniforms(A),A.onBeforeCompile(q,v),gt=vt.acquireProgram(q,$),ut.set($,gt),tt.uniforms=q.uniforms;let ot=tt.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(ot.clippingPlanes=st.uniform),fn(A,q),tt.needsLights=Ln(A),tt.lightsStateVersion=k,tt.needsLights&&(ot.ambientLightColor.value=S.state.ambient,ot.lightProbe.value=S.state.probe,ot.directionalLights.value=S.state.directional,ot.directionalLightShadows.value=S.state.directionalShadow,ot.spotLights.value=S.state.spot,ot.spotLightShadows.value=S.state.spotShadow,ot.rectAreaLights.value=S.state.rectArea,ot.ltc_1.value=S.state.rectAreaLTC1,ot.ltc_2.value=S.state.rectAreaLTC2,ot.pointLights.value=S.state.point,ot.pointLightShadows.value=S.state.pointShadow,ot.hemisphereLights.value=S.state.hemi,ot.directionalShadowMap.value=S.state.directionalShadowMap,ot.directionalShadowMatrix.value=S.state.directionalShadowMatrix,ot.spotShadowMap.value=S.state.spotShadowMap,ot.spotLightMatrix.value=S.state.spotLightMatrix,ot.spotLightMap.value=S.state.spotLightMap,ot.pointShadowMap.value=S.state.pointShadowMap,ot.pointShadowMatrix.value=S.state.pointShadowMatrix),tt.currentProgram=gt,tt.uniformsList=null,gt}function Ge(A){if(A.uniformsList===null){let G=A.currentProgram.getUniforms();A.uniformsList=Dr.seqWithValue(G.seq,A.uniforms)}return A.uniformsList}function fn(A,G){let et=Et.get(A);et.outputColorSpace=G.outputColorSpace,et.batching=G.batching,et.batchingColor=G.batchingColor,et.instancing=G.instancing,et.instancingColor=G.instancingColor,et.instancingMorph=G.instancingMorph,et.skinning=G.skinning,et.morphTargets=G.morphTargets,et.morphNormals=G.morphNormals,et.morphColors=G.morphColors,et.morphTargetsCount=G.morphTargetsCount,et.numClippingPlanes=G.numClippingPlanes,et.numIntersection=G.numClipIntersection,et.vertexAlphas=G.vertexAlphas,et.vertexTangents=G.vertexTangents,et.toneMapping=G.toneMapping}function dn(A,G,et,tt,S){G.isScene!==!0&&(G=oe),I.resetTextureUnits();let F=G.fog,k=tt.isMeshStandardMaterial?G.environment:null,q=C===null?v.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Xr,$=(tt.isMeshStandardMaterial?U:y).get(tt.envMap||k),ut=tt.vertexColors===!0&&!!et.attributes.color&&et.attributes.color.itemSize===4,gt=!!et.attributes.tangent&&(!!tt.normalMap||tt.anisotropy>0),ot=!!et.morphAttributes.position,yt=!!et.morphAttributes.normal,At=!!et.morphAttributes.color,Ht=As;tt.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(Ht=v.toneMapping);let ce=et.morphAttributes.position||et.morphAttributes.normal||et.morphAttributes.color,Gt=ce!==void 0?ce.length:0,Nt=Et.get(tt),Re=m.state.lights;if(mt===!0&&(It===!0||A!==E)){let $n=A===E&&tt.id===b;st.setState(tt,A,$n)}let se=!1;tt.version===Nt.__version?(Nt.needsLights&&Nt.lightsStateVersion!==Re.state.version||Nt.outputColorSpace!==q||S.isBatchedMesh&&Nt.batching===!1||!S.isBatchedMesh&&Nt.batching===!0||S.isBatchedMesh&&Nt.batchingColor===!0&&S.colorTexture===null||S.isBatchedMesh&&Nt.batchingColor===!1&&S.colorTexture!==null||S.isInstancedMesh&&Nt.instancing===!1||!S.isInstancedMesh&&Nt.instancing===!0||S.isSkinnedMesh&&Nt.skinning===!1||!S.isSkinnedMesh&&Nt.skinning===!0||S.isInstancedMesh&&Nt.instancingColor===!0&&S.instanceColor===null||S.isInstancedMesh&&Nt.instancingColor===!1&&S.instanceColor!==null||S.isInstancedMesh&&Nt.instancingMorph===!0&&S.morphTexture===null||S.isInstancedMesh&&Nt.instancingMorph===!1&&S.morphTexture!==null||Nt.envMap!==$||tt.fog===!0&&Nt.fog!==F||Nt.numClippingPlanes!==void 0&&(Nt.numClippingPlanes!==st.numPlanes||Nt.numIntersection!==st.numIntersection)||Nt.vertexAlphas!==ut||Nt.vertexTangents!==gt||Nt.morphTargets!==ot||Nt.morphNormals!==yt||Nt.morphColors!==At||Nt.toneMapping!==Ht||Nt.morphTargetsCount!==Gt)&&(se=!0):(se=!0,Nt.__version=tt.version);let he=Nt.currentProgram;se===!0&&(he=de(tt,G,S));let xe=!1,ve=!1,An=!1,Ce=he.getUniforms(),nn=Nt.uniforms;if(Pt.useProgram(he.program)&&(xe=!0,ve=!0,An=!0),tt.id!==b&&(b=tt.id,ve=!0),xe||E!==A){Pt.buffers.depth.getReversed()?(dt.copy(A.projectionMatrix),e0(dt),n0(dt),Ce.setValue(L,"projectionMatrix",dt)):Ce.setValue(L,"projectionMatrix",A.projectionMatrix),Ce.setValue(L,"viewMatrix",A.matrixWorldInverse);let Ri=Ce.map.cameraPosition;Ri!==void 0&&Ri.setValue(L,ie.setFromMatrixPosition(A.matrixWorld)),Ut.logarithmicDepthBuffer&&Ce.setValue(L,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(tt.isMeshPhongMaterial||tt.isMeshToonMaterial||tt.isMeshLambertMaterial||tt.isMeshBasicMaterial||tt.isMeshStandardMaterial||tt.isShaderMaterial)&&Ce.setValue(L,"isOrthographic",A.isOrthographicCamera===!0),E!==A&&(E=A,ve=!0,An=!0)}if(S.isSkinnedMesh){Ce.setOptional(L,S,"bindMatrix"),Ce.setOptional(L,S,"bindMatrixInverse");let $n=S.skeleton;$n&&($n.boneTexture===null&&$n.computeBoneTexture(),Ce.setValue(L,"boneTexture",$n.boneTexture,I))}S.isBatchedMesh&&(Ce.setOptional(L,S,"batchingTexture"),Ce.setValue(L,"batchingTexture",S._matricesTexture,I),Ce.setOptional(L,S,"batchingIdTexture"),Ce.setValue(L,"batchingIdTexture",S._indirectTexture,I),Ce.setOptional(L,S,"batchingColorTexture"),S._colorsTexture!==null&&Ce.setValue(L,"batchingColorTexture",S._colorsTexture,I));let Dn=et.morphAttributes;if((Dn.position!==void 0||Dn.normal!==void 0||Dn.color!==void 0)&&Dt.update(S,et,he),(ve||Nt.receiveShadow!==S.receiveShadow)&&(Nt.receiveShadow=S.receiveShadow,Ce.setValue(L,"receiveShadow",S.receiveShadow)),tt.isMeshGouraudMaterial&&tt.envMap!==null&&(nn.envMap.value=$,nn.flipEnvMap.value=$.isCubeTexture&&$.isRenderTargetTexture===!1?-1:1),tt.isMeshStandardMaterial&&tt.envMap===null&&G.environment!==null&&(nn.envMapIntensity.value=G.environmentIntensity),ve&&(Ce.setValue(L,"toneMappingExposure",v.toneMappingExposure),Nt.needsLights&&mi(nn,An),F&&tt.fog===!0&&lt.refreshFogUniforms(nn,F),lt.refreshMaterialUniforms(nn,tt,K,ct,m.state.transmissionRenderTarget[A.id]),Dr.upload(L,Ge(Nt),nn,I)),tt.isShaderMaterial&&tt.uniformsNeedUpdate===!0&&(Dr.upload(L,Ge(Nt),nn,I),tt.uniformsNeedUpdate=!1),tt.isSpriteMaterial&&Ce.setValue(L,"center",S.center),Ce.setValue(L,"modelViewMatrix",S.modelViewMatrix),Ce.setValue(L,"normalMatrix",S.normalMatrix),Ce.setValue(L,"modelMatrix",S.matrixWorld),tt.isShaderMaterial||tt.isRawShaderMaterial){let $n=tt.uniformsGroups;for(let Ri=0,vs=$n.length;Ri<vs;Ri++){let pf=$n[Ri];N.update(pf,he),N.bind(pf,he)}}return he}function mi(A,G){A.ambientLightColor.needsUpdate=G,A.lightProbe.needsUpdate=G,A.directionalLights.needsUpdate=G,A.directionalLightShadows.needsUpdate=G,A.pointLights.needsUpdate=G,A.pointLightShadows.needsUpdate=G,A.spotLights.needsUpdate=G,A.spotLightShadows.needsUpdate=G,A.rectAreaLights.needsUpdate=G,A.hemisphereLights.needsUpdate=G}function Ln(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(A,G,et){Et.get(A.texture).__webglTexture=G,Et.get(A.depthTexture).__webglTexture=et;let tt=Et.get(A);tt.__hasExternalTextures=!0,tt.__autoAllocateDepthBuffer=et===void 0,tt.__autoAllocateDepthBuffer||xt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),tt.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(A,G){let et=Et.get(A);et.__webglFramebuffer=G,et.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(A,G=0,et=0){C=A,R=G,T=et;let tt=!0,S=null,F=!1,k=!1;if(A){let $=Et.get(A);if($.__useDefaultFramebuffer!==void 0)Pt.bindFramebuffer(L.FRAMEBUFFER,null),tt=!1;else if($.__webglFramebuffer===void 0)I.setupRenderTarget(A);else if($.__hasExternalTextures)I.rebindTextures(A,Et.get(A.texture).__webglTexture,Et.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let ot=A.depthTexture;if($.__boundDepthTexture!==ot){if(ot!==null&&Et.has(ot)&&(A.width!==ot.image.width||A.height!==ot.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");I.setupDepthRenderbuffer(A)}}let ut=A.texture;(ut.isData3DTexture||ut.isDataArrayTexture||ut.isCompressedArrayTexture)&&(k=!0);let gt=Et.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(gt[G])?S=gt[G][et]:S=gt[G],F=!0):A.samples>0&&I.useMultisampledRTT(A)===!1?S=Et.get(A).__webglMultisampledFramebuffer:Array.isArray(gt)?S=gt[et]:S=gt,D.copy(A.viewport),Y.copy(A.scissor),H=A.scissorTest}else D.copy(wt).multiplyScalar(K).floor(),Y.copy(Yt).multiplyScalar(K).floor(),H=te;if(Pt.bindFramebuffer(L.FRAMEBUFFER,S)&&tt&&Pt.drawBuffers(A,S),Pt.viewport(D),Pt.scissor(Y),Pt.setScissorTest(H),F){let $=Et.get(A.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+G,$.__webglTexture,et)}else if(k){let $=Et.get(A.texture),ut=G||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,$.__webglTexture,et||0,ut)}b=-1},this.readRenderTargetPixels=function(A,G,et,tt,S,F,k){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let q=Et.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&k!==void 0&&(q=q[k]),q){Pt.bindFramebuffer(L.FRAMEBUFFER,q);try{let $=A.texture,ut=$.format,gt=$.type;if(!Ut.textureFormatReadable(ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ut.textureTypeReadable(gt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=A.width-tt&&et>=0&&et<=A.height-S&&L.readPixels(G,et,tt,S,Ft.convert(ut),Ft.convert(gt),F)}finally{let $=C!==null?Et.get(C).__webglFramebuffer:null;Pt.bindFramebuffer(L.FRAMEBUFFER,$)}}},this.readRenderTargetPixelsAsync=async function(A,G,et,tt,S,F,k){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let q=Et.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&k!==void 0&&(q=q[k]),q){let $=A.texture,ut=$.format,gt=$.type;if(!Ut.textureFormatReadable(ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ut.textureTypeReadable(gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(G>=0&&G<=A.width-tt&&et>=0&&et<=A.height-S){Pt.bindFramebuffer(L.FRAMEBUFFER,q);let ot=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,ot),L.bufferData(L.PIXEL_PACK_BUFFER,F.byteLength,L.STREAM_READ),L.readPixels(G,et,tt,S,Ft.convert(ut),Ft.convert(gt),0);let yt=C!==null?Et.get(C).__webglFramebuffer:null;Pt.bindFramebuffer(L.FRAMEBUFFER,yt);let At=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await t0(L,At,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,ot),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,F),L.deleteBuffer(ot),L.deleteSync(At),F}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(A,G=null,et=0){A.isTexture!==!0&&(po("WebGLRenderer: copyFramebufferToTexture function signature has changed."),G=arguments[0]||null,A=arguments[1]);let tt=Math.pow(2,-et),S=Math.floor(A.image.width*tt),F=Math.floor(A.image.height*tt),k=G!==null?G.x:0,q=G!==null?G.y:0;I.setTexture2D(A,0),L.copyTexSubImage2D(L.TEXTURE_2D,et,0,0,k,q,S,F),Pt.unbindTexture()},this.copyTextureToTexture=function(A,G,et=null,tt=null,S=0){A.isTexture!==!0&&(po("WebGLRenderer: copyTextureToTexture function signature has changed."),tt=arguments[0]||null,A=arguments[1],G=arguments[2],S=arguments[3]||0,et=null);let F,k,q,$,ut,gt,ot,yt,At,Ht=A.isCompressedTexture?A.mipmaps[S]:A.image;et!==null?(F=et.max.x-et.min.x,k=et.max.y-et.min.y,q=et.isBox3?et.max.z-et.min.z:1,$=et.min.x,ut=et.min.y,gt=et.isBox3?et.min.z:0):(F=Ht.width,k=Ht.height,q=Ht.depth||1,$=0,ut=0,gt=0),tt!==null?(ot=tt.x,yt=tt.y,At=tt.z):(ot=0,yt=0,At=0);let ce=Ft.convert(G.format),Gt=Ft.convert(G.type),Nt;G.isData3DTexture?(I.setTexture3D(G,0),Nt=L.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(I.setTexture2DArray(G,0),Nt=L.TEXTURE_2D_ARRAY):(I.setTexture2D(G,0),Nt=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,G.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,G.unpackAlignment);let Re=L.getParameter(L.UNPACK_ROW_LENGTH),se=L.getParameter(L.UNPACK_IMAGE_HEIGHT),he=L.getParameter(L.UNPACK_SKIP_PIXELS),xe=L.getParameter(L.UNPACK_SKIP_ROWS),ve=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,Ht.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Ht.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,$),L.pixelStorei(L.UNPACK_SKIP_ROWS,ut),L.pixelStorei(L.UNPACK_SKIP_IMAGES,gt);let An=A.isDataArrayTexture||A.isData3DTexture,Ce=G.isDataArrayTexture||G.isData3DTexture;if(A.isRenderTargetTexture||A.isDepthTexture){let nn=Et.get(A),Dn=Et.get(G),$n=Et.get(nn.__renderTarget),Ri=Et.get(Dn.__renderTarget);Pt.bindFramebuffer(L.READ_FRAMEBUFFER,$n.__webglFramebuffer),Pt.bindFramebuffer(L.DRAW_FRAMEBUFFER,Ri.__webglFramebuffer);for(let vs=0;vs<q;vs++)An&&L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Et.get(A).__webglTexture,S,gt+vs),A.isDepthTexture?(Ce&&L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Et.get(G).__webglTexture,S,At+vs),L.blitFramebuffer($,ut,F,k,ot,yt,F,k,L.DEPTH_BUFFER_BIT,L.NEAREST)):Ce?L.copyTexSubImage3D(Nt,S,ot,yt,At+vs,$,ut,F,k):L.copyTexSubImage2D(Nt,S,ot,yt,At+vs,$,ut,F,k);Pt.bindFramebuffer(L.READ_FRAMEBUFFER,null),Pt.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else Ce?A.isDataTexture||A.isData3DTexture?L.texSubImage3D(Nt,S,ot,yt,At,F,k,q,ce,Gt,Ht.data):G.isCompressedArrayTexture?L.compressedTexSubImage3D(Nt,S,ot,yt,At,F,k,q,ce,Ht.data):L.texSubImage3D(Nt,S,ot,yt,At,F,k,q,ce,Gt,Ht):A.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,S,ot,yt,F,k,ce,Gt,Ht.data):A.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,S,ot,yt,Ht.width,Ht.height,ce,Ht.data):L.texSubImage2D(L.TEXTURE_2D,S,ot,yt,F,k,ce,Gt,Ht);L.pixelStorei(L.UNPACK_ROW_LENGTH,Re),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,se),L.pixelStorei(L.UNPACK_SKIP_PIXELS,he),L.pixelStorei(L.UNPACK_SKIP_ROWS,xe),L.pixelStorei(L.UNPACK_SKIP_IMAGES,ve),S===0&&G.generateMipmaps&&L.generateMipmap(Nt),Pt.unbindTexture()},this.copyTextureToTexture3D=function(A,G,et=null,tt=null,S=0){return A.isTexture!==!0&&(po("WebGLRenderer: copyTextureToTexture3D function signature has changed."),et=arguments[0]||null,tt=arguments[1]||null,A=arguments[2],G=arguments[3],S=arguments[4]||0),po('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,G,et,tt,S)},this.initRenderTarget=function(A){Et.get(A).__webglFramebuffer===void 0&&I.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?I.setTextureCube(A,0):A.isData3DTexture?I.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?I.setTexture2DArray(A,0):I.setTexture2D(A,0),Pt.unbindTexture()},this.resetState=function(){R=0,T=0,C=null,Pt.reset(),Xt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ls}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=Ae._getDrawingBufferColorSpace(t),e.unpackColorSpace=Ae._getUnpackColorSpace()}};var qa=class i{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new ft(t),this.near=e,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},js=class extends rn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var wo=class extends Jn{constructor(t=null,e=1,n=1,s,r,o,a,l,c=Fn,h=Fn,u,d){super(null,o,a,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Is=class extends Ie{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ar=new ue,xd=new ue,Ma=[],_d=new Li,Kv=new ue,uo=new $t,fo=new qi,Bn=class extends $t{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Is(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Kv)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Li),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ar),_d.copy(t.boundingBox).applyMatrix4(Ar),this.boundingBox.union(_d)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new qi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ar),fo.copy(t.boundingSphere).applyMatrix4(Ar),this.boundingSphere.union(fo)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(uo.geometry=this.geometry,uo.material=this.material,uo.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fo.copy(this.boundingSphere),fo.applyMatrix4(n),t.ray.intersectsSphere(fo)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ar),xd.multiplyMatrices(n,Ar),uo.matrixWorld=xd,uo.raycast(t,Ma);for(let o=0,a=Ma.length;o<a;o++){let l=Ma[o];l.instanceId=r,l.object=this,e.push(l)}Ma.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Is(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new wo(new Float32Array(s*this.count),s,this.count,au,Vi));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<n.length;c++)o+=n[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Ph=class extends fs{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new ft(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},vd=new ue,Lh=new Oa,ba=new qi,Sa=new P,Ya=class extends rn{constructor(t=new qe,e=new Ph){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ba.copy(n.boundingSphere),ba.applyMatrix4(s),ba.radius+=r,t.ray.intersectsSphere(ba)===!1)return;vd.copy(s).invert(),Lh.copy(t.ray).applyMatrix4(vd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let p=d,x=f;p<x;p++){let g=c.getX(p);Sa.fromBufferAttribute(u,g),yd(Sa,g,l,s,t,e,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let p=d,x=f;p<x;p++)Sa.fromBufferAttribute(u,p),yd(Sa,p,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function yd(i,t,e,n,s,r,o){let a=Lh.distanceSqToPoint(i);if(a<e){let l=new P;Lh.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var jn=class extends Jn{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},_i=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let n=this.getLengths(),s=0,r=n.length,o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);let h=n[s],d=n[s+1]-h,f=(o-h)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new pt:new P);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){let n=new P,s=[],r=[],o=[],a=new P,l=new ue;for(let f=0;f<=t;f++){let p=f/t;s[f]=this.getTangentAt(p,new P)}r[0]=new P,o[0]=new P;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let p=Math.acos(pn(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,p))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(pn(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let p=1;p<=t;p++)r[p].applyMatrix4(l.makeRotationAxis(s[p],f*p)),o[p].crossVectors(s[p],r[p])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},Ao=class extends _i{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new pt){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Dh=class extends Ao{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function pu(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let d=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+u)+(l-a)/u;d*=h,f*=h,s(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return i+t*r+e*o+n*a}}}var Ea=new P,Ac=new pu,Rc=new pu,Cc=new pu,Ps=class extends _i{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new P){let n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Ea.subVectors(s[0],s[1]).add(s[0]),c=Ea);let u=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Ea.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Ea),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(h),f);x<1e-4&&(x=1),p<1e-4&&(p=x),g<1e-4&&(g=x),Ac.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,p,x,g),Rc.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,p,x,g),Cc.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,p,x,g)}else this.curveType==="catmullrom"&&(Ac.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Rc.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Cc.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(Ac.calc(l),Rc.calc(l),Cc.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new P().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Md(i,t,e,n,s){let r=(n-t)*.5,o=(s-e)*.5,a=i*i,l=i*a;return(2*e-2*n+r+o)*l+(-3*e+3*n-2*r-o)*a+r*i+e}function $v(i,t){let e=1-i;return e*e*t}function Jv(i,t){return 2*(1-i)*i*t}function jv(i,t){return i*i*t}function vo(i,t,e,n){return $v(i,t)+Jv(i,e)+jv(i,n)}function Qv(i,t){let e=1-i;return e*e*e*t}function ty(i,t){let e=1-i;return 3*e*e*i*t}function ey(i,t){return 3*(1-i)*i*i*t}function ny(i,t){return i*i*i*t}function yo(i,t,e,n,s){return Qv(i,t)+ty(i,e)+ey(i,n)+ny(i,s)}var Za=class extends _i{constructor(t=new pt,e=new pt,n=new pt,s=new pt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new pt){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(yo(t,s.x,r.x,o.x,a.x),yo(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},kh=class extends _i{constructor(t=new P,e=new P,n=new P,s=new P){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new P){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(yo(t,s.x,r.x,o.x,a.x),yo(t,s.y,r.y,o.y,a.y),yo(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Ka=class extends _i{constructor(t=new pt,e=new pt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new pt){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new pt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Uh=class extends _i{constructor(t=new P,e=new P){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new P){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new P){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},$a=class extends _i{constructor(t=new pt,e=new pt,n=new pt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new pt){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(vo(t,s.x,r.x,o.x),vo(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ja=class extends _i{constructor(t=new P,e=new P,n=new P){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new P){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(vo(t,s.x,r.x,o.x),vo(t,s.y,r.y,o.y),vo(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},ja=class extends _i{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new pt){let n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(Md(a,l.x,c.x,h.x,u.x),Md(a,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new pt().fromArray(s))}return this}},Qa=Object.freeze({__proto__:null,ArcCurve:Dh,CatmullRomCurve3:Ps,CubicBezierCurve:Za,CubicBezierCurve3:kh,EllipseCurve:Ao,LineCurve:Ka,LineCurve3:Uh,QuadraticBezierCurve:$a,QuadraticBezierCurve3:Ja,SplineCurve:ja}),Nh=class extends _i{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Qa[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(new Qa[s.type]().fromJSON(s))}return this}},Ro=class extends Nh{constructor(t){super(),this.type="Path",this.currentPoint=new pt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let n=new Ka(this.currentPoint.clone(),new pt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){let r=new $a(this.currentPoint.clone(),new pt(t,e),new pt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){let a=new Za(this.currentPoint.clone(),new pt(t,e),new pt(n,s),new pt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),n=new ja(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,s,r,o,a,l),this}absellipse(t,e,n,s,r,o,a,l){let c=new Ao(t,e,n,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},Gr=class i extends qe{constructor(t=[new pt(0,-.5),new pt(.5,0),new pt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=pn(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/e,u=new P,d=new pt,f=new P,p=new P,x=new P,g=0,m=0;for(let M=0;M<=t.length-1;M++)switch(M){case 0:g=t[M+1].x-t[M].x,m=t[M+1].y-t[M].y,f.x=m*1,f.y=-g,f.z=m*0,x.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(x.x,x.y,x.z);break;default:g=t[M+1].x-t[M].x,m=t[M+1].y-t[M].y,f.x=m*1,f.y=-g,f.z=m*0,p.copy(f),f.x+=x.x,f.y+=x.y,f.z+=x.z,f.normalize(),l.push(f.x,f.y,f.z),x.copy(p)}for(let M=0;M<=e;M++){let _=n+M*h*s,v=Math.sin(_),w=Math.cos(_);for(let R=0;R<=t.length-1;R++){u.x=t[R].x*v,u.y=t[R].y,u.z=t[R].x*w,o.push(u.x,u.y,u.z),d.x=M/e,d.y=R/(t.length-1),a.push(d.x,d.y);let T=l[3*R+0]*v,C=l[3*R+1],b=l[3*R+0]*w;c.push(T,C,b)}}for(let M=0;M<e;M++)for(let _=0;_<t.length-1;_++){let v=_+M*t.length,w=v,R=v+t.length,T=v+t.length+1,C=v+1;r.push(w,R,C),r.push(T,C,R)}this.setIndex(r),this.setAttribute("position",new Ee(o,3)),this.setAttribute("uv",new Ee(a,2)),this.setAttribute("normal",new Ee(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.points,t.segments,t.phiStart,t.phiLength)}},li=class i extends Gr{constructor(t=1,e=1,n=4,s=8){let r=new Ro;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new i(t.radius,t.length,t.capSegments,t.radialSegments)}},Qn=class i extends qe{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);let r=[],o=[],a=[],l=[],c=new P,h=new pt;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){let f=n+u/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[d]/t+1)/2,h.y=(o[d+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Ee(o,3)),this.setAttribute("normal",new Ee(a,3)),this.setAttribute("uv",new Ee(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Te=class i extends qe{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],p=0,x=[],g=n/2,m=0;M(),o===!1&&(t>0&&_(!0),e>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new Ee(u,3)),this.setAttribute("normal",new Ee(d,3)),this.setAttribute("uv",new Ee(f,2));function M(){let v=new P,w=new P,R=0,T=(e-t)/n;for(let C=0;C<=r;C++){let b=[],E=C/r,D=E*(e-t)+t;for(let Y=0;Y<=s;Y++){let H=Y/s,X=H*l+a,Z=Math.sin(X),O=Math.cos(X);w.x=D*Z,w.y=-E*n+g,w.z=D*O,u.push(w.x,w.y,w.z),v.set(Z,T,O).normalize(),d.push(v.x,v.y,v.z),f.push(H,1-E),b.push(p++)}x.push(b)}for(let C=0;C<s;C++)for(let b=0;b<r;b++){let E=x[b][C],D=x[b+1][C],Y=x[b+1][C+1],H=x[b][C+1];(t>0||b!==0)&&(h.push(E,D,H),R+=3),(e>0||b!==r-1)&&(h.push(D,Y,H),R+=3)}c.addGroup(m,R,0),m+=R}function _(v){let w=p,R=new pt,T=new P,C=0,b=v===!0?t:e,E=v===!0?1:-1;for(let Y=1;Y<=s;Y++)u.push(0,g*E,0),d.push(0,E,0),f.push(.5,.5),p++;let D=p;for(let Y=0;Y<=s;Y++){let X=Y/s*l+a,Z=Math.cos(X),O=Math.sin(X);T.x=b*O,T.y=g*E,T.z=b*Z,u.push(T.x,T.y,T.z),d.push(0,E,0),R.x=Z*.5+.5,R.y=O*.5*E+.5,f.push(R.x,R.y),p++}for(let Y=0;Y<s;Y++){let H=w+Y,X=D+Y;v===!0?h.push(X,X+1,H):h.push(X+1,X,H),C+=3}c.addGroup(m,C,v===!0?1:2),m+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},on=class i extends Te{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Co=class i extends qe{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],o=[];a(s),c(n),h(),this.setAttribute("position",new Ee(r,3)),this.setAttribute("normal",new Ee(r.slice(),3)),this.setAttribute("uv",new Ee(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(M){let _=new P,v=new P,w=new P;for(let R=0;R<e.length;R+=3)f(e[R+0],_),f(e[R+1],v),f(e[R+2],w),l(_,v,w,M)}function l(M,_,v,w){let R=w+1,T=[];for(let C=0;C<=R;C++){T[C]=[];let b=M.clone().lerp(v,C/R),E=_.clone().lerp(v,C/R),D=R-C;for(let Y=0;Y<=D;Y++)Y===0&&C===R?T[C][Y]=b:T[C][Y]=b.clone().lerp(E,Y/D)}for(let C=0;C<R;C++)for(let b=0;b<2*(R-C)-1;b++){let E=Math.floor(b/2);b%2===0?(d(T[C][E+1]),d(T[C+1][E]),d(T[C][E])):(d(T[C][E+1]),d(T[C+1][E+1]),d(T[C+1][E]))}}function c(M){let _=new P;for(let v=0;v<r.length;v+=3)_.x=r[v+0],_.y=r[v+1],_.z=r[v+2],_.normalize().multiplyScalar(M),r[v+0]=_.x,r[v+1]=_.y,r[v+2]=_.z}function h(){let M=new P;for(let _=0;_<r.length;_+=3){M.x=r[_+0],M.y=r[_+1],M.z=r[_+2];let v=g(M)/2/Math.PI+.5,w=m(M)/Math.PI+.5;o.push(v,1-w)}p(),u()}function u(){for(let M=0;M<o.length;M+=6){let _=o[M+0],v=o[M+2],w=o[M+4],R=Math.max(_,v,w),T=Math.min(_,v,w);R>.9&&T<.1&&(_<.2&&(o[M+0]+=1),v<.2&&(o[M+2]+=1),w<.2&&(o[M+4]+=1))}}function d(M){r.push(M.x,M.y,M.z)}function f(M,_){let v=M*3;_.x=t[v+0],_.y=t[v+1],_.z=t[v+2]}function p(){let M=new P,_=new P,v=new P,w=new P,R=new pt,T=new pt,C=new pt;for(let b=0,E=0;b<r.length;b+=9,E+=6){M.set(r[b+0],r[b+1],r[b+2]),_.set(r[b+3],r[b+4],r[b+5]),v.set(r[b+6],r[b+7],r[b+8]),R.set(o[E+0],o[E+1]),T.set(o[E+2],o[E+3]),C.set(o[E+4],o[E+5]),w.copy(M).add(_).add(v).divideScalar(3);let D=g(w);x(R,E+0,M,D),x(T,E+2,_,D),x(C,E+4,v,D)}}function x(M,_,v,w){w<0&&M.x===1&&(o[_]=M.x-1),v.x===0&&v.z===0&&(o[_]=w/2/Math.PI+.5)}function g(M){return Math.atan2(M.z,-M.x)}function m(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.details)}},tl=class i extends Co{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var Ls=class extends Ro{constructor(t){super(t),this.uuid=nr(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(new Ro().fromJSON(s))}return this}},iy={triangulate:function(i,t,e=2){let n=t&&t.length,s=n?t[0]*e:i.length,r=Zd(i,0,s,e,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c,h,u,d,f;if(n&&(r=ly(i,t,r,e)),i.length>80*e){a=c=i[0],l=h=i[1];for(let p=e;p<s;p+=e)u=i[p],d=i[p+1],u<a&&(a=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);f=Math.max(c-a,h-l),f=f!==0?32767/f:0}return Io(r,o,e,a,l,f,0),o}};function Zd(i,t,e,n,s){let r,o;if(s===vy(i,t,e,n)>0)for(r=t;r<e;r+=n)o=bd(r,i[r],i[r+1],o);else for(r=e-n;r>=t;r-=n)o=bd(r,i[r],i[r+1],o);return o&&hl(o,o.next)&&(Lo(o),o=o.next),o}function Qs(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(hl(e,e.next)||Je(e.prev,e,e.next)===0)){if(Lo(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Io(i,t,e,n,s,r,o){if(!i)return;!o&&r&&dy(i,n,s,r);let a=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?ry(i,n,s,r):sy(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),Lo(i),i=c.next,a=c.next;continue}if(i=c,i===a){o?o===1?(i=oy(Qs(i),t,e),Io(i,t,e,n,s,r,2)):o===2&&ay(i,t,e,n,s,r):Io(Qs(i),t,e,n,s,r,1);break}}}function sy(i){let t=i.prev,e=i,n=i.next;if(Je(t,e,n)>=0)return!1;let s=t.x,r=e.x,o=n.x,a=t.y,l=e.y,c=n.y,h=s<r?s<o?s:o:r<o?r:o,u=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c,p=n.next;for(;p!==t;){if(p.x>=h&&p.x<=d&&p.y>=u&&p.y<=f&&Ir(s,a,r,l,o,c,p.x,p.y)&&Je(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function ry(i,t,e,n){let s=i.prev,r=i,o=i.next;if(Je(s,r,o)>=0)return!1;let a=s.x,l=r.x,c=o.x,h=s.y,u=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,p=h<u?h<d?h:d:u<d?u:d,x=a>l?a>c?a:c:l>c?l:c,g=h>u?h>d?h:d:u>d?u:d,m=Fh(f,p,t,e,n),M=Fh(x,g,t,e,n),_=i.prevZ,v=i.nextZ;for(;_&&_.z>=m&&v&&v.z<=M;){if(_.x>=f&&_.x<=x&&_.y>=p&&_.y<=g&&_!==s&&_!==o&&Ir(a,h,l,u,c,d,_.x,_.y)&&Je(_.prev,_,_.next)>=0||(_=_.prevZ,v.x>=f&&v.x<=x&&v.y>=p&&v.y<=g&&v!==s&&v!==o&&Ir(a,h,l,u,c,d,v.x,v.y)&&Je(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;_&&_.z>=m;){if(_.x>=f&&_.x<=x&&_.y>=p&&_.y<=g&&_!==s&&_!==o&&Ir(a,h,l,u,c,d,_.x,_.y)&&Je(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;v&&v.z<=M;){if(v.x>=f&&v.x<=x&&v.y>=p&&v.y<=g&&v!==s&&v!==o&&Ir(a,h,l,u,c,d,v.x,v.y)&&Je(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function oy(i,t,e){let n=i;do{let s=n.prev,r=n.next.next;!hl(s,r)&&Kd(s,n,n.next,r)&&Po(s,r)&&Po(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),Lo(n),Lo(n.next),n=i=r),n=n.next}while(n!==i);return Qs(n)}function ay(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&gy(o,a)){let l=$d(o,a);o=Qs(o,o.next),l=Qs(l,l.next),Io(o,t,e,n,s,r,0),Io(l,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function ly(i,t,e,n){let s=[],r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*n,l=r<o-1?t[r+1]*n:i.length,c=Zd(i,a,l,n,!1),c===c.next&&(c.steiner=!0),s.push(my(c));for(s.sort(cy),r=0;r<s.length;r++)e=hy(s[r],e);return e}function cy(i,t){return i.x-t.x}function hy(i,t){let e=uy(i,t);if(!e)return t;let n=$d(e,i);return Qs(n,n.next),Qs(e,e.next)}function uy(i,t){let e=t,n=-1/0,s,r=i.x,o=i.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){let d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>n&&(n=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;let a=s,l=s.x,c=s.y,h=1/0,u;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Ir(o<c?r:n,o,l,c,o<c?n:r,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(r-e.x),Po(e,i)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&fy(s,e)))&&(s=e,h=u)),e=e.next;while(e!==a);return s}function fy(i,t){return Je(i.prev,i,t.prev)<0&&Je(t.next,i,i.next)<0}function dy(i,t,e,n){let s=i;do s.z===0&&(s.z=Fh(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,py(s)}function py(i){let t,e,n,s,r,o,a,l,c=1;do{for(e=i,i=null,r=null,o=0;e;){for(o++,n=e,a=0,t=0;t<c&&(a++,n=n.nextZ,!!n);t++);for(l=c;a>0||l>0&&n;)a!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,a--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(o>1);return i}function Fh(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function my(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Ir(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function gy(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!xy(i,t)&&(Po(i,t)&&Po(t,i)&&_y(i,t)&&(Je(i.prev,i,t.prev)||Je(i,t.prev,t))||hl(i,t)&&Je(i.prev,i,i.next)>0&&Je(t.prev,t,t.next)>0)}function Je(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function hl(i,t){return i.x===t.x&&i.y===t.y}function Kd(i,t,e,n){let s=wa(Je(i,t,e)),r=wa(Je(i,t,n)),o=wa(Je(e,n,i)),a=wa(Je(e,n,t));return!!(s!==r&&o!==a||s===0&&Ta(i,e,t)||r===0&&Ta(i,n,t)||o===0&&Ta(e,i,n)||a===0&&Ta(e,t,n))}function Ta(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function wa(i){return i>0?1:i<0?-1:0}function xy(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Kd(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Po(i,t){return Je(i.prev,i,i.next)<0?Je(i,t,i.next)>=0&&Je(i,i.prev,t)>=0:Je(i,t,i.prev)<0||Je(i,i.next,t)<0}function _y(i,t){let e=i,n=!1,s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function $d(i,t){let e=new Oh(i.i,i.x,i.y),n=new Oh(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function bd(i,t,e,n){let s=new Oh(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Lo(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Oh(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function vy(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}var Mo=class i{static area(t){let e=t.length,n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return i.area(t)<0}static triangulateShape(t,e){let n=[],s=[],r=[];Sd(t),Ed(n,t);let o=t.length;e.forEach(Sd);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,Ed(n,e[l]);let a=iy.triangulate(n,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function Sd(i){let t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ed(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}var vi=class i extends qe{constructor(t=new Ls([new pt(.5,.5),new pt(-.5,.5),new pt(-.5,-.5),new pt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let n=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){let c=t[a];o(c)}this.setAttribute("position",new Ee(s,3)),this.setAttribute("uv",new Ee(r,2)),this.computeVertexNormals();function o(a){let l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1,d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,p=e.bevelSize!==void 0?e.bevelSize:f-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,g=e.bevelSegments!==void 0?e.bevelSegments:3,m=e.extrudePath,M=e.UVGenerator!==void 0?e.UVGenerator:yy,_,v=!1,w,R,T,C;m&&(_=m.getSpacedPoints(h),v=!0,d=!1,w=m.computeFrenetFrames(h,!1),R=new P,T=new P,C=new P),d||(g=0,f=0,p=0,x=0);let b=a.extractPoints(c),E=b.shape,D=b.holes;if(!Mo.isClockWise(E)){E=E.reverse();for(let at=0,St=D.length;at<St;at++){let L=D[at];Mo.isClockWise(L)&&(D[at]=L.reverse())}}let H=Mo.triangulateShape(E,D),X=E;for(let at=0,St=D.length;at<St;at++){let L=D[at];E=E.concat(L)}function Z(at,St,L){return St||console.error("THREE.ExtrudeGeometry: vec does not exist"),at.clone().addScaledVector(St,L)}let O=E.length,ct=H.length;function K(at,St,L){let Zt,xt,Ut,Pt=at.x-St.x,ee=at.y-St.y,Et=L.x-at.x,I=L.y-at.y,y=Pt*Pt+ee*ee,U=Pt*I-ee*Et;if(Math.abs(U)>Number.EPSILON){let z=Math.sqrt(y),V=Math.sqrt(Et*Et+I*I),B=St.x-ee/z,vt=St.y+Pt/z,lt=L.x-I/V,Mt=L.y+Et/V,Wt=((lt-B)*I-(Mt-vt)*Et)/(Pt*I-ee*Et);Zt=B+Pt*Wt-at.x,xt=vt+ee*Wt-at.y;let st=Zt*Zt+xt*xt;if(st<=2)return new pt(Zt,xt);Ut=Math.sqrt(st/2)}else{let z=!1;Pt>Number.EPSILON?Et>Number.EPSILON&&(z=!0):Pt<-Number.EPSILON?Et<-Number.EPSILON&&(z=!0):Math.sign(ee)===Math.sign(I)&&(z=!0),z?(Zt=-ee,xt=Pt,Ut=Math.sqrt(y)):(Zt=Pt,xt=ee,Ut=Math.sqrt(y/2))}return new pt(Zt/Ut,xt/Ut)}let W=[];for(let at=0,St=X.length,L=St-1,Zt=at+1;at<St;at++,L++,Zt++)L===St&&(L=0),Zt===St&&(Zt=0),W[at]=K(X[at],X[L],X[Zt]);let j=[],wt,Yt=W.concat();for(let at=0,St=D.length;at<St;at++){let L=D[at];wt=[];for(let Zt=0,xt=L.length,Ut=xt-1,Pt=Zt+1;Zt<xt;Zt++,Ut++,Pt++)Ut===xt&&(Ut=0),Pt===xt&&(Pt=0),wt[Zt]=K(L[Zt],L[Ut],L[Pt]);j.push(wt),Yt=Yt.concat(wt)}for(let at=0;at<g;at++){let St=at/g,L=f*Math.cos(St*Math.PI/2),Zt=p*Math.sin(St*Math.PI/2)+x;for(let xt=0,Ut=X.length;xt<Ut;xt++){let Pt=Z(X[xt],W[xt],Zt);dt(Pt.x,Pt.y,-L)}for(let xt=0,Ut=D.length;xt<Ut;xt++){let Pt=D[xt];wt=j[xt];for(let ee=0,Et=Pt.length;ee<Et;ee++){let I=Z(Pt[ee],wt[ee],Zt);dt(I.x,I.y,-L)}}}let te=p+x;for(let at=0;at<O;at++){let St=d?Z(E[at],Yt[at],te):E[at];v?(T.copy(w.normals[0]).multiplyScalar(St.x),R.copy(w.binormals[0]).multiplyScalar(St.y),C.copy(_[0]).add(T).add(R),dt(C.x,C.y,C.z)):dt(St.x,St.y,0)}for(let at=1;at<=h;at++)for(let St=0;St<O;St++){let L=d?Z(E[St],Yt[St],te):E[St];v?(T.copy(w.normals[at]).multiplyScalar(L.x),R.copy(w.binormals[at]).multiplyScalar(L.y),C.copy(_[at]).add(T).add(R),dt(C.x,C.y,C.z)):dt(L.x,L.y,u/h*at)}for(let at=g-1;at>=0;at--){let St=at/g,L=f*Math.cos(St*Math.PI/2),Zt=p*Math.sin(St*Math.PI/2)+x;for(let xt=0,Ut=X.length;xt<Ut;xt++){let Pt=Z(X[xt],W[xt],Zt);dt(Pt.x,Pt.y,u+L)}for(let xt=0,Ut=D.length;xt<Ut;xt++){let Pt=D[xt];wt=j[xt];for(let ee=0,Et=Pt.length;ee<Et;ee++){let I=Z(Pt[ee],wt[ee],Zt);v?dt(I.x,I.y+_[h-1].y,_[h-1].x+L):dt(I.x,I.y,u+L)}}}rt(),mt();function rt(){let at=s.length/3;if(d){let St=0,L=O*St;for(let Zt=0;Zt<ct;Zt++){let xt=H[Zt];zt(xt[2]+L,xt[1]+L,xt[0]+L)}St=h+g*2,L=O*St;for(let Zt=0;Zt<ct;Zt++){let xt=H[Zt];zt(xt[0]+L,xt[1]+L,xt[2]+L)}}else{for(let St=0;St<ct;St++){let L=H[St];zt(L[2],L[1],L[0])}for(let St=0;St<ct;St++){let L=H[St];zt(L[0]+O*h,L[1]+O*h,L[2]+O*h)}}n.addGroup(at,s.length/3-at,0)}function mt(){let at=s.length/3,St=0;It(X,St),St+=X.length;for(let L=0,Zt=D.length;L<Zt;L++){let xt=D[L];It(xt,St),St+=xt.length}n.addGroup(at,s.length/3-at,1)}function It(at,St){let L=at.length;for(;--L>=0;){let Zt=L,xt=L-1;xt<0&&(xt=at.length-1);for(let Ut=0,Pt=h+g*2;Ut<Pt;Ut++){let ee=O*Ut,Et=O*(Ut+1),I=St+Zt+ee,y=St+xt+ee,U=St+xt+Et,z=St+Zt+Et;ie(I,y,U,z)}}}function dt(at,St,L){l.push(at),l.push(St),l.push(L)}function zt(at,St,L){Vt(at),Vt(St),Vt(L);let Zt=s.length/3,xt=M.generateTopUV(n,s,Zt-3,Zt-2,Zt-1);oe(xt[0]),oe(xt[1]),oe(xt[2])}function ie(at,St,L,Zt){Vt(at),Vt(St),Vt(Zt),Vt(St),Vt(L),Vt(Zt);let xt=s.length/3,Ut=M.generateSideWallUV(n,s,xt-6,xt-3,xt-2,xt-1);oe(Ut[0]),oe(Ut[1]),oe(Ut[3]),oe(Ut[1]),oe(Ut[2]),oe(Ut[3])}function Vt(at){s.push(l[at*3+0]),s.push(l[at*3+1]),s.push(l[at*3+2])}function oe(at){r.push(at.x),r.push(at.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return My(e,n,t)}static fromJSON(t,e){let n=[];for(let r=0,o=t.shapes.length;r<o;r++){let a=e[t.shapes[r]];n.push(a)}let s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Qa[s.type]().fromJSON(s)),new i(n,t.options)}},yy={generateTopUV:function(i,t,e,n,s){let r=t[e*3],o=t[e*3+1],a=t[n*3],l=t[n*3+1],c=t[s*3],h=t[s*3+1];return[new pt(r,o),new pt(a,l),new pt(c,h)]},generateSideWallUV:function(i,t,e,n,s,r){let o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],u=t[n*3+2],d=t[s*3],f=t[s*3+1],p=t[s*3+2],x=t[r*3],g=t[r*3+1],m=t[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new pt(o,1-l),new pt(c,1-u),new pt(d,1-p),new pt(x,1-m)]:[new pt(a,1-l),new pt(h,1-u),new pt(f,1-p),new pt(g,1-m)]}};function My(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var Hn=class i extends Co{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}},el=class i extends Co{constructor(t=1,e=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var ti=class i extends qe{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new P,d=new P,f=[],p=[],x=[],g=[];for(let m=0;m<=n;m++){let M=[],_=m/n,v=0;m===0&&o===0?v=.5/e:m===n&&l===Math.PI&&(v=-.5/e);for(let w=0;w<=e;w++){let R=w/e;u.x=-t*Math.cos(s+R*r)*Math.sin(o+_*a),u.y=t*Math.cos(o+_*a),u.z=t*Math.sin(s+R*r)*Math.sin(o+_*a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),g.push(R+v,1-_),M.push(c++)}h.push(M)}for(let m=0;m<n;m++)for(let M=0;M<e;M++){let _=h[m][M+1],v=h[m][M],w=h[m+1][M],R=h[m+1][M+1];(m!==0||o>0)&&f.push(_,v,R),(m!==n-1||l<Math.PI)&&f.push(v,w,R)}this.setIndex(f),this.setAttribute("position",new Ee(p,3)),this.setAttribute("normal",new Ee(x,3)),this.setAttribute("uv",new Ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var an=class i extends qe{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new P,u=new P,d=new P;for(let f=0;f<=n;f++)for(let p=0;p<=s;p++){let x=p/s*r,g=f/n*Math.PI*2;u.x=(t+e*Math.cos(g))*Math.cos(x),u.y=(t+e*Math.cos(g))*Math.sin(x),u.z=e*Math.sin(g),a.push(u.x,u.y,u.z),h.x=t*Math.cos(x),h.y=t*Math.sin(x),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(p/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let p=1;p<=s;p++){let x=(s+1)*f+p-1,g=(s+1)*(f-1)+p-1,m=(s+1)*(f-1)+p,M=(s+1)*f+p;o.push(x,g,M),o.push(g,m,M)}this.setIndex(o),this.setAttribute("position",new Ee(a,3)),this.setAttribute("normal",new Ee(l,3)),this.setAttribute("uv",new Ee(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}};var Do=class i extends qe{constructor(t=new Ja(new P(-1,-1,0),new P(-1,1,0),new P(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};let o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new P,l=new P,c=new pt,h=new P,u=[],d=[],f=[],p=[];x(),this.setIndex(p),this.setAttribute("position",new Ee(u,3)),this.setAttribute("normal",new Ee(d,3)),this.setAttribute("uv",new Ee(f,2));function x(){for(let _=0;_<e;_++)g(_);g(r===!1?e:0),M(),m()}function g(_){h=t.getPointAt(_/e,h);let v=o.normals[_],w=o.binormals[_];for(let R=0;R<=s;R++){let T=R/s*Math.PI*2,C=Math.sin(T),b=-Math.cos(T);l.x=b*v.x+C*w.x,l.y=b*v.y+C*w.y,l.z=b*v.z+C*w.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=h.x+n*l.x,a.y=h.y+n*l.y,a.z=h.z+n*l.z,u.push(a.x,a.y,a.z)}}function m(){for(let _=1;_<=e;_++)for(let v=1;v<=s;v++){let w=(s+1)*(_-1)+(v-1),R=(s+1)*_+(v-1),T=(s+1)*_+v,C=(s+1)*(_-1)+v;p.push(w,R,C),p.push(R,T,C)}}function M(){for(let _=0;_<=e;_++)for(let v=0;v<=s;v++)c.x=_/e,c.y=v/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new i(new Qa[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};var nl=class extends Be{static get type(){return"RawShaderMaterial"}constructor(t){super(t),this.isRawShaderMaterial=!0}},ye=class extends fs{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new pt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},ci=class extends ye{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new pt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return pn(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ft(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ft(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ft(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};var Gn=class extends fs{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new pt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=jh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function Aa(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function by(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Vr=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},zh=class extends Vr{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:yf,endingEnd:yf}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Mf:r=t,a=2*e-n;break;case bf:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Mf:o=t,l=2*n-e;break;case bf:o=1,l=n+s[1]-s[0];break;default:o=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-e)/(s-e),x=p*p,g=x*p,m=-d*g+2*d*x-d*p,M=(1+d)*g+(-1.5-2*d)*x+(-.5+d)*p+1,_=(-1-f)*g+(1.5+f)*x+.5*p,v=f*g-f*x;for(let w=0;w!==a;++w)r[w]=m*o[h+w]+M*o[c+w]+_*o[l+w]+v*o[u+w];return r}},Bh=class extends Vr{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(n-e)/(s-e),u=1-h;for(let d=0;d!==a;++d)r[d]=o[c+d]*u+o[l+d]*h;return r}},Hh=class extends Vr{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Di=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Aa(e,this.TimeBufferType),this.values=Aa(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Aa(t.times,Array),values:Aa(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Hh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Bh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new zh(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Da:e=this.InterpolantFactoryMethodDiscrete;break;case ph:e=this.InterpolantFactoryMethodLinear;break;case tc:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Da;case this.InterpolantFactoryMethodLinear:return ph;case this.InterpolantFactoryMethodSmooth:return tc}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&by(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===tc,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*n,d=u-n,f=u+n;for(let p=0;p!==n;++p){let x=e[u+p];if(x!==e[d+p]||x!==e[f+p]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*n,d=o*n;for(let f=0;f!==n;++f)e[d+f]=e[u+f]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Di.prototype.TimeBufferType=Float32Array;Di.prototype.ValueBufferType=Float32Array;Di.prototype.DefaultInterpolation=ph;var tr=class extends Di{constructor(t,e,n){super(t,e,n)}};tr.prototype.ValueTypeName="bool";tr.prototype.ValueBufferType=Array;tr.prototype.DefaultInterpolation=Da;tr.prototype.InterpolantFactoryMethodLinear=void 0;tr.prototype.InterpolantFactoryMethodSmooth=void 0;var Gh=class extends Di{};Gh.prototype.ValueTypeName="color";var Vh=class extends Di{};Vh.prototype.ValueTypeName="number";var Wh=class extends Vr{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)yn.slerpFlat(r,0,o,c-a,o,c,l);return r}},il=class extends Di{InterpolantFactoryMethodLinear(t){return new Wh(this.times,this.values,this.getValueSize(),t)}};il.prototype.ValueTypeName="quaternion";il.prototype.InterpolantFactoryMethodSmooth=void 0;var er=class extends Di{constructor(t,e,n){super(t,e,n)}};er.prototype.ValueTypeName="string";er.prototype.ValueBufferType=Array;er.prototype.DefaultInterpolation=Da;er.prototype.InterpolantFactoryMethodLinear=void 0;er.prototype.InterpolantFactoryMethodSmooth=void 0;var Xh=class extends Di{};Xh.prototype.ValueTypeName="vector";var qh=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],p=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null}}},Sy=new qh,Yh=class{constructor(t){this.manager=t!==void 0?t:Sy,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};Yh.DEFAULT_MATERIAL_NAME="__DEFAULT";var sl=class extends rn{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ft(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},rl=class extends sl{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ft(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},Ic=new ue,Td=new P,wd=new P,Zh=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new pt(512,512),this.map=null,this.mapPass=null,this.matrix=new ue,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new To,this._frameExtents=new pt(1,1),this._viewportCount=1,this._viewports=[new sn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Td.setFromMatrixPosition(t.matrixWorld),e.position.copy(Td),wd.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(wd),e.updateMatrixWorld(),Ic.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ic),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ic)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var Kh=class extends Zh{constructor(){super(new Br(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ol=class extends sl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.target=new rn,this.shadow=new Kh}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var Wr=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ad(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let e=Ad();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}};function Ad(){return performance.now()}var mu="\\[\\]\\.:\\/",Ey=new RegExp("["+mu+"]","g"),gu="[^"+mu+"]",Ty="[^"+mu.replace("\\.","")+"]",wy=/((?:WC+[\/:])*)/.source.replace("WC",gu),Ay=/(WCOD+)?/.source.replace("WCOD",Ty),Ry=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gu),Cy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gu),Iy=new RegExp("^"+wy+Ay+Ry+Cy+"$"),Py=["material","materials","bones","map"],$h=class{constructor(t,e,n){let s=n||Ye.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Ye=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Ey,"")}static parseTrackName(t){let e=Iy.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Py.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ye.Composite=$h;Ye.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ye.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ye.prototype.GetterByBindingType=[Ye.prototype._getValue_direct,Ye.prototype._getValue_array,Ye.prototype._getValue_arrayElement,Ye.prototype._getValue_toArray];Ye.prototype.SetterByBindingTypeAndVersioning=[[Ye.prototype._setValue_direct,Ye.prototype._setValue_direct_setNeedsUpdate,Ye.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ye.prototype._setValue_array,Ye.prototype._setValue_array_setNeedsUpdate,Ye.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ye.prototype._setValue_arrayElement,Ye.prototype._setValue_arrayElement_setNeedsUpdate,Ye.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ye.prototype._setValue_fromArray,Ye.prototype._setValue_fromArray_setNeedsUpdate,Ye.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ub=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var ul={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};var hi=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},Ly=new Br(-1,1,1,-1,0,1),xu=class extends qe{constructor(){super(),this.setAttribute("position",new Ee([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ee([0,2,0,0,2,0],2))}},Dy=new xu,Ds=class{constructor(t){this._mesh=new $t(Dy,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Ly)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var fl=class extends hi{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof Be?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Zi.clone(t.uniforms),this.material=new Be({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new Ds(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var No=class extends hi{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){let s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},dl=class extends hi{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var pl=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let n=t.getSize(new pt);this._width=n.width,this._height=n.height,e=new On(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:ki}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new fl(ul),this.copyPass.material.blending=Wi,this.clock=new Wr}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());let e=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),o.needsSwap){if(n){let a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}No!==void 0&&(o instanceof No?n=!0:o instanceof dl&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new pt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var ml=class extends hi{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new ft}render(t,e,n){let s=t.autoClear;t.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=s}};var Jd={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new ft(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};var Yr=class i extends hi{constructor(t,e,n,s){super(),this.strength=e!==void 0?e:1,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new pt(t.x,t.y):new pt(256,256),this.clearColor=new ft(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new On(r,o,{type:ki}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let d=new On(r,o,{type:ki});d.texture.name="UnrealBloomPass.h"+u,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);let f=new On(r,o,{type:ki});f.texture.name="UnrealBloomPass.v"+u,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),r=Math.round(r/2),o=Math.round(o/2)}let a=Jd;this.highPassUniforms=Zi.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Be({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];let l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new pt(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let h=ul;this.copyUniforms=Zi.clone(h.uniforms),this.blendMaterial=new Be({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:xi,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new ft,this.oldClearAlpha=1,this.basic=new Sn,this.fsQuad=new Ds(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new pt(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this.fsQuad.render(t),a=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(n),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=o}getSeperableBlurMaterial(t){let e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new Be({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new pt(.5,.5)},direction:{value:new pt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new Be({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};Yr.BlurDirectionX=new pt(1,0);Yr.BlurDirectionY=new pt(0,1);var jd={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var gl=class extends hi{constructor(){super();let t=jd;this.uniforms=Zi.clone(t.uniforms),this.material=new nl({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new Ds(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},Ae.getTransfer(this._outputColorSpace)===Ue&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Qh?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===tu?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===eu?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===ko?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===nu?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===iu&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var _u=class{constructor(){this.handlers=new Map}on(t,e){return this.handlers.has(t)||this.handlers.set(t,new Set),this.handlers.get(t).add(e),()=>this.off(t,e)}off(t,e){this.handlers.get(t)?.delete(e)}emit(t,e){let n=this.handlers.get(t);if(n)for(let s of[...n])try{s(e)}catch(r){console.error(`[bus] handler for ${t} failed`,r)}}clear(){this.handlers.clear()}},Bt=new _u;(function(i){"use strict";var t=["a","b","start","select"];function e(a){a=a||{};var l={},c=[];function h(u){var d=(u||[]).filter(function(f){return f&&Number(f.id)>0});return Object.keys(l).forEach(function(f){l[f].wifi&&!d.some(function(p){return Number(p.id)===Number(f)})&&d.push({id:Number(f),connected:!1,transport:"wifi"})}),c=d.map(function(f){var p=Object.assign({},f),x=Number(p.id),g=l[x],m=p.transport==="wifi",M=!!p.connected,_=M?m?"wifi:"+String(p.session||p.controllerId||x):"phone:"+String(p.session||x):"",v=Number.isSafeInteger(p.cancelSeq)?p.cancelSeq:0,w=!!g&&(g.source!==_||g.rawCancel!==v),R=!g&&m&&M||w&&(m||g.wifi),T=g||{epoch:v,blocked:{}};w&&T.epoch++;var C=R&&a.onCancel&&a.onCancel({id:x,previous:g?g.source:"",source:_,disconnected:!M})===!0;return C&&t.forEach(function(b){T.blocked[b]=!!p[b]}),t.forEach(function(b){p[b]||(T.blocked[b]=!1),p[b]=M&&!C&&!T.blocked[b]&&!!p[b]}),(!M||C)&&(p.x=p.y=p.aimX=p.aimY=0),p.id=x,p.connected=M,p.cancelSeq=T.epoch,T.source=_,T.wifi=m,T.rawCancel=v,l[x]=T,p}),c.map(function(f){return Object.assign({},f)})}return{read:h,peek:function(){return c.map(function(u){return Object.assign({},u)})}}}var n=new WeakMap;function s(a){if(!a.getElementById("ptv-client-style")){var l=a.createElement("style");l.id="ptv-client-style",l.textContent="[data-puretv-clients]{box-sizing:border-box;min-width:0}[data-puretv-clients][hidden]{display:none!important}.ptv-client-card{box-sizing:border-box;display:flex;align-items:flex-start;min-width:0;padding:7px 8px;border:1px solid rgba(130,222,229,.45);border-radius:9px;background:rgba(8,28,36,.96);color:#effcff;text-align:left}.ptv-client-card+.ptv-client-card{margin-top:6px}.ptv-client-icon{display:block;width:24px;height:24px;flex:0 0 24px;margin-right:8px;color:#8ae5dc}.ptv-client-body{flex:1;min-width:0}.ptv-client-heading{display:flex;align-items:baseline;flex-wrap:wrap;font:600 12px/1.35 sans-serif;letter-spacing:normal;text-transform:none}.ptv-client-seat{font:inherit;color:inherit}.ptv-client-state{font:inherit;margin-left:6px;color:#a9f0d4}.ptv-client-id{display:block;min-width:0;margin-top:3px;font:12px/1.4 monospace;color:#effcff;white-space:normal;word-break:break-all;overflow-wrap:anywhere;letter-spacing:normal;text-transform:none}",(a.head||a.documentElement).appendChild(l)}}function r(a){var l="http://www.w3.org/2000/svg",c=a.createElementNS(l,"svg");c.setAttribute("class","ptv-client-icon"),c.setAttribute("viewBox","0 0 24 24"),c.setAttribute("aria-hidden","true"),c.setAttribute("focusable","false"),c.setAttribute("fill","none"),c.setAttribute("stroke","currentColor"),c.setAttribute("stroke-width","1.7"),c.setAttribute("stroke-linecap","round"),c.setAttribute("stroke-linejoin","round");var h=a.createElementNS(l,"path");h.setAttribute("d","M7.5 7h9c2.2 0 3.4 1.2 4 3.3l1.2 4.8c.5 2.1-1.7 3.6-3.2 2.1l-2.1-2.1H7.6l-2.1 2.1c-1.5 1.5-3.7 0-3.2-2.1l1.2-4.8C4.1 8.2 5.3 7 7.5 7Z"),c.appendChild(h);var u=a.createElementNS(l,"path");return u.setAttribute("d","M7 9.7v4.6M4.7 12h4.6"),c.appendChild(u),[[16,10.7],[18.8,13]].forEach(function(d){var f=a.createElementNS(l,"circle");f.setAttribute("cx",String(d[0])),f.setAttribute("cy",String(d[1])),f.setAttribute("r",".75"),f.setAttribute("fill","currentColor"),f.setAttribute("stroke","none"),c.appendChild(f)}),c}function o(a,l,c){if(!(!a||!a.ownerDocument)){var h=c&&c.language==="en"?"en":"zh",u=(Array.isArray(l)?l:[]).filter(function(p){return p&&p.connected===!0&&p.transport==="wifi"&&Number(p.id)>0}).map(function(p){return{seat:Number(p.id),identity:typeof p.controllerId=="string"?p.controllerId:""}}).sort(function(p,x){return p.seat-x.seat}),d=JSON.stringify([h,u]);if(n.get(a)!==d){n.set(a,d);var f=a.ownerDocument;for(s(f),a.setAttribute("data-puretv-clients",""),a.setAttribute("role","status"),a.setAttribute("aria-live","polite"),a.setAttribute("aria-atomic","true"),a.setAttribute("aria-label",h==="en"?"Connected pureTV controllers":"\u5DF2\u8FDE\u63A5\u7684 pureTV \u624B\u67C4");a.firstChild;)a.removeChild(a.firstChild);u.forEach(function(p){var x=f.createElement("div");x.className="ptv-client-card",x.setAttribute("data-puretv-controller-id",p.identity),x.setAttribute("data-player-id",String(p.seat)),x.appendChild(r(f));var g=f.createElement("div");g.className="ptv-client-body";var m=f.createElement("div");m.className="ptv-client-heading";var M=f.createElement("strong");M.className="ptv-client-seat",M.textContent=p.seat+"P";var _=f.createElement("span");_.className="ptv-client-state",_.textContent=h==="en"?"Connected":"\u5DF2\u8FDE\u63A5",m.appendChild(M),m.appendChild(_),g.appendChild(m);var v=f.createElement("span");v.className="ptv-client-id",v.setAttribute("data-puretv-controller-id-text",""),v.textContent="ID: "+(p.identity||(h==="en"?"not reported":"\u672A\u63D0\u4F9B")),g.appendChild(v),x.appendChild(g),a.appendChild(x)}),a.hidden=u.length===0}}}i.PureTVControllerAdapter={create:e,renderClients:o},typeof module<"u"&&module.exports&&(module.exports=i.PureTVControllerAdapter)})(typeof window<"u"?window:globalThis);var xl=Object.freeze(["UP","DOWN","LEFT","RIGHT","START","A","B","X","Y"]),yi=()=>Object.fromEntries(xl.map(i=>[i,!1])),Fo=i=>JSON.parse(JSON.stringify(i)),ky={ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Enter:"A",Start:"START",p:"START",b:"B",A:"A",B:"B",X:"X",Y:"Y",Select:"Y"},Uy={Numpad8:"UP",Numpad2:"DOWN",Numpad4:"LEFT",Numpad6:"RIGHT",Numpad5:"START",Numpad1:"A",Numpad3:"B",Numpad7:"X",Numpad9:"Y"},Ny={ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",KeyP:"START",KeyZ:"A",KeyX:"B",KeyC:"X",KeyV:"Y"};function Fy(i){if(i.transport==="wifi"||i.transport!=="phone"&&(i.transport||typeof i.x!="number"||typeof i.y!="number"))return i;let t={UP:i.y<-.35,DOWN:i.y>.35,LEFT:i.x<-.35,RIGHT:i.x>.35,START:i.start===!0,A:i.a===!0,B:i.b===!0,X:i.buttonX===!0,Y:i.buttonY===!0||i.select===!0};return{...i,transport:"phone",buttons:t}}function Oy(){let i=yi(),t="",e=null,n=!1,s=yi(),r=!1;return{cancel(){r=!0},read(o={},a={}){(!o||typeof o!="object")&&(o={});let l=Array.isArray(o.players)?o.players.filter(w=>w&&Number(w.id)>0).map(Fy):[],c=l.filter(w=>w.connected===!0).sort((w,R)=>Number(w.id)-Number(R.id)),h=c.find(w=>w.transport==="wifi")||c.find(w=>w.transport==="phone"),u=h?h.transport==="phone"?JSON.stringify(["phone",h.id]):JSON.stringify([h.id,h.controllerId,h.session]):"",d=h?.cancelSeq??null,f=t!==u||!!t&&e!==d,p=r||f&&!!t,x=p||f&&n&&!!u,g=yi(),m=o.inputActive!==!1&&h?.inputActive!==!1;for(let w of xl)g[w]=!!a[w]||m&&h?.buttons?.[w]===!0;if(x)for(let w of xl)s[w]=g[w];let M=yi(),_=yi(),v=yi();for(let w of xl)g[w]||(s[w]=!1),M[w]=!x&&g[w]&&!s[w],_[w]=M[w]&&!i[w],v[w]=!p&&!x&&!M[w]&&i[w];return i=M,t=u,e=d,r=!1,h&&(n=!0),{buttons:M,pressed:_,released:v,connected:!!h,transport:h?.transport||null,cancelled:p,players:Fo(l),source:t}}}}function zy(i,t){let e=i.createElement("style");e.textContent=`
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
  `,i.head.appendChild(e);let n=i.createElement("aside");n.id="puretv-controller-panel",n.setAttribute("aria-label","pureTV \u624B\u67C4\u8FDE\u63A5"),n.style[t.side==="left"?"left":"right"]="12px",n.style.top=t.top||"12px",n.style.width=`${Math.max(150,Math.min(300,Number(t.width)||198))}px`;let s=i.createElement("strong");s.className="ptv-host-title",s.textContent="pureTV \u624B\u67C4";let r=i.createElement("div");r.id="puretv-controller-clients",r.hidden=!0;let o=i.createElement("p");o.className="ptv-host-info";let a=i.createElement("div");a.className="ptv-phone",a.hidden=!0;let l=i.createElement("img");l.alt="\u624B\u673A\u624B\u67C4\u623F\u95F4\u4E8C\u7EF4\u7801",l.hidden=!0;let c=i.createElement("small");a.append(l,c);let h=i.createElement("span");return h.className="ptv-status",h.hidden=!0,n.append(s,r,a,h,o),i.body.appendChild(n),{element:n,clients:r,info:o,phone:a,qr:l,join:c,status:h,style:e}}function Qd(i={}){let t=window,e=t.document,n=zy(e,i),s=Oy(),r=new Map,o=yi(),a={},l=-1/0,c=!1,h={buttons:yi(),pressed:yi(),released:yi(),connected:!1,cancelled:!1,players:[],source:"",pollCount:0,info:{}},u=t.PureGame;function d(_){_&&typeof _=="object"&&(a=Fo(_))}function f(){r.clear(),o=yi(),s.cancel(),i.onSuspend?.()}function p(_,v,w){if(!w){r.delete(_);return}r.has(_)||(o[v]=!0),r.set(_,v)}function x(_){let v=Uy[_.code]||i.keyboard===!0&&Ny[_.code];if(!v||!_.isTrusted)return;let w="dom:"+_.code;if(_.type==="keyup"){if(!r.has(w))return}else if(_.isComposing||_.altKey||_.ctrlKey||_.metaKey||_.target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable=false])"))return;_.preventDefault(),_.stopImmediatePropagation(),_.repeat||p(w,v,_.type==="keydown")}let g={key(_,v){let w=ky[_];w&&p("native:"+_,w,v)},focus(_){_||f()},suspend(_){_&&f()},resume(){},roomInfo:d,networkChanged(_){d(_),f()}};t.PureGame=g;let m=()=>{e.hidden&&f()};t.addEventListener("keydown",x,!0),t.addEventListener("keyup",x,!0),t.addEventListener("blur",f),e.addEventListener("visibilitychange",m);function M(){t.PureTVControllerAdapter.renderClients(n.clients,h.players,{language:"zh"});let _=String(c);n.element.dataset.playing!==_&&(n.element.dataset.playing=_,e.body.dataset.puretvPlaying=_);let v=h.players.find(Z=>Z.connected&&Z.transport==="phone");n.status.hidden=!c||h.transport==="wifi";let w=h.transport==="phone"?`${v.id}P \u624B\u673A\u624B\u67C4\u5DF2\u8FDE\u63A5`:"\u624B\u67C4\u672A\u8FDE\u63A5";n.status.textContent!==w&&(n.status.textContent=w);let R=typeof a.url=="string"&&/^https?:\/\//.test(a.url)?a.url:"";n.phone.hidden=c||h.connected||!R;let T=String(!n.phone.hidden);if(e.body.dataset.puretvJoining!==T&&(e.body.dataset.puretvJoining=T),!n.phone.hidden){let Z=typeof a.qr=="string"&&a.qr.startsWith("data:image/png;base64,")?a.qr:"";n.qr.hidden=!Z,Z&&n.qr.getAttribute("src")!==Z&&(n.qr.src=Z);let O=Z?"\u540C\u4E00 Wi-Fi \u4E0B\u7528\u624B\u673A\u626B\u7801":"\u624B\u673A\u6253\u5F00 "+R;n.join.textContent!==O&&(n.join.textContent=O)}let C=a.wifiController||{},E=(Array.isArray(C.addresses)?C.addresses:Array.isArray(a.addresses)?a.addresses:[]).filter(Z=>typeof Z=="string").join(" / "),D=typeof C.serviceName=="string"?C.serviceName:"",Y=Number.isInteger(C.port)&&C.port>0?C.port:63485,H=h.players.filter(Z=>Z.connected===!0&&Z.transport===h.transport).map(Z=>Number(Z.id)).sort((Z,O)=>Z-O)[0],X=h.connected?`\u5355\u4EBA\u6E38\u620F \xB7 ${H}P ${h.transport==="phone"?"\u624B\u673A\u624B\u67C4":"\u65E0\u7EBF\u624B\u67C4"}\u64CD\u4F5C`:"\u65E0\u7EBF\u624B\u67C4\u6309 GPIO 23 \u641C\u7D22\u8FDE\u63A5";t.PureGameHost||(X=`\u6D4F\u89C8\u5668\u9884\u89C8 \xB7 \u952E\u9F20\u53EF\u73A9
Wi-Fi \u624B\u67C4\u9700\u542F\u52A8\u5B89\u88C5\u7248`),a.url||(X+=`
\u5C0F\u952E\u76D8 8/2/4/6 \u65B9\u5411 \xB7 5 START \xB7 1/3/7/9 A/B/X/Y`),D&&(X+=`
`+D),E&&(X+=`
`+E),t.PureGameHost&&(X+=`
TCP `+Y),typeof C.error=="string"&&C.error&&(X+=`
`+C.error),(C.state==="failed"||C.state==="unavailable")&&(X+=`
\u624B\u67C4\u670D\u52A1\u6682\u4E0D\u53EF\u7528`),n.info.textContent!==X&&(n.info.textContent=X)}return{poll(){let _={players:[]},v=t.performance.now();try{t.PureGameHost?.getInfo&&v-l>=1e3&&(d(JSON.parse(t.PureGameHost.getInfo())),l=v),t.PureGameHost?.snapshot&&(_=JSON.parse(t.PureGameHost.snapshot()))}catch{_={players:[]}}let w=o;for(let R of r.values())w[R]=!0;return o=yi(),h={...s.read(_,w),info:Fo(a),pollCount:h.pollCount+1,native:!!t.PureGameHost,inputAvailable:!!t.PureGameHost},M(),h.cancelled&&i.onCancel?.(),Fo(h)},peek(){return Fo(h)},setPlaying(_){c!==!!_&&(c=!!_,M())},cancel:f,destroy(){t.removeEventListener("keydown",x,!0),t.removeEventListener("keyup",x,!0),t.removeEventListener("blur",f),e.removeEventListener("visibilitychange",m),t.PureGame===g&&(t.PureGame=u,delete e.body.dataset.puretvPlaying,delete e.body.dataset.puretvJoining),n.element.remove(),n.style.remove()}}}var tp="Turbo Kart Rally",ir={laps:3,racers:8,countdownSeconds:3},Ve={gravity:38,kartRadius:1.3,maxSpeed:38,reverseMaxSpeed:12,accel:22,brakeDecel:45,coastDecel:8,offroadMaxSpeedFactor:.45,boostSpeedBonus:16,miniTurboTimes:[.55,.45,.5],driftChargeThresholds:[.9,1.9,3],mushroomBoostTime:1.3,starTime:7.5,spinOutTime:1.1,tumbleTime:1.6,lightningShrinkTime:5},Vn=[{id:"blaze",name:"Blaze",color:15022389,accent:16777215,skin:16764057,hat:"cap",stats:{speed:3,accel:3,handling:3,weight:3}},{id:"zippy",name:"Zippy",color:4431943,accent:16777215,skin:16764057,hat:"cap",stats:{speed:3,accel:4,handling:3,weight:2}},{id:"bella",name:"Bella",color:15753874,accent:16773494,skin:16769213,hat:"crown",stats:{speed:2,accel:4,handling:5,weight:2}},{id:"toadly",name:"Toadly",color:2001125,accent:16777215,skin:16769213,hat:"mushroom",stats:{speed:2,accel:5,handling:4,weight:1}},{id:"rex",name:"Rex",color:3046706,accent:16748288,skin:10275941,hat:"horns",stats:{speed:5,accel:1,handling:2,weight:5}},{id:"grumbo",name:"Grumbo",color:16635957,accent:6953882,skin:16764057,hat:"cap",stats:{speed:4,accel:2,handling:2,weight:4}},{id:"koopz",name:"Koopz",color:44225,accent:16775620,skin:11457921,hat:"shell",stats:{speed:3,accel:3,handling:4,weight:2}},{id:"dotty",name:"Dotty",color:9315498,accent:16771899,skin:16769213,hat:"bow",stats:{speed:2,accel:4,handling:4,weight:1}}],ks=["mushroom","triple_mushroom","banana","green_shell","red_shell","star","lightning","blue_shell"],vu={easy:{aiSpeedFactor:.86,aiSkill:.55,rubberBand:.08},normal:{aiSpeedFactor:.94,aiSkill:.75,rubberBand:.12},hard:{aiSpeedFactor:1,aiSkill:.95,rubberBand:.16}},ep={accelerate:["ArrowUp","KeyW"],brake:["ArrowDown","KeyS"],left:["ArrowLeft","KeyA"],right:["ArrowRight","KeyD"],drift:["Space","ShiftRight"],item:["KeyE","ShiftLeft","KeyX"],lookBack:["KeyC"],pause:["Escape","KeyP"]};var yu=new P,_l=class{constructor({track:t,karts:e,player:n=null,laps:s=ir.laps,silent:r=!1}){this.track=t,this.karts=e,this.player=n,this.laps=Math.max(1,s|0),this.silent=r,this.phase="grid",this.countdownTime=0,this.countdownValue=null,this.raceTime=0,this.standings=e.slice(),this.playerFinished=!1,this.ended=!1,this.endTimer=-1,this.results=null,this.wrongWay=!1,this._wrongTimer=0,this._rightTimer=0,this._cdIndex=0,this._finishCount=0;for(let o of e)this._initKart(o)}_emit(t,e){this.silent||Bt.emit(t,e)}_initKart(t){t.lap=1,t.finished=!1,t.finishTime=null,t.place=1,t._lapCount=0,t._checkpoint=!1,t._prevT=null,t._lapStart=0,t.lapTimes=[],t.raceProgress=0,t._startProgress=null}placeOnGrid(t=this.karts){let e=this.track&&this.track.startPositions;t.forEach((n,s)=>{let r=e&&e[s%e.length];if(r){try{typeof n.reset=="function"?n.reset(r.position.clone(),r.heading):(n.position.copy(r.position),n.heading=r.heading)}catch(o){console.warn("[race] reset failed",o)}try{n.trackT=this.track.getSurfaceInfo(n.position).t}catch{n.trackT=this._tOf(n)}n._prevT=n.trackT,n._lapCount=n.trackT<.5?1:0,n.controlsLocked=!0}}),this._updateProgress(),this._sortPlaces()}_tOf(t){if(typeof t.trackT=="number"&&isFinite(t.trackT))return t.trackT;try{return this.track.getSurfaceInfo(t.position).t}catch{return 0}}startCountdown(){this.phase="countdown",this.countdownTime=0,this._cdIndex=0;for(let t of this.karts)t.controlsLocked=!0}startImmediately(){this.phase="racing";for(let t of this.karts)t.controlsLocked=!1}update(t){if(this.phase==="countdown"){this.countdownTime+=t;let e=[.5,1.5,2.5,3.5];for(;this._cdIndex<e.length&&this.countdownTime>=e[this._cdIndex];){let n=this._cdIndex++;if(n<3)this.countdownValue=3-n,this._emit("race:countdown",{n:3-n});else{this.countdownValue="GO",this.phase="racing",this.raceTime=0;for(let s of this.karts)s.controlsLocked=!1,s._lapStart=0;this._emit("race:go",{})}}this._updateProgress(),this._sortPlaces();return}if(this.phase!=="racing"&&this.phase!=="done"){this._updateProgress(),this._sortPlaces();return}this.raceTime+=t;for(let e of this.karts)this._updateLaps(e);this._updateProgress(),this._sortPlaces(),this.player&&!this.player.finished&&this.phase==="racing"?this._updateWrongWay(t):this.wrongWay&&this._setWrongWay(!1),this.endTimer>=0&&(this.endTimer-=t,this.endTimer<0&&!this.ended&&this._end())}_updateLaps(t){let e=this._tOf(t),n=t._prevT==null?e:t._prevT;t._prevT=e,e>.4&&e<.62&&(t._checkpoint=!0);let s=e-n;if(s<-.5){if((t._lapCount===0||t._checkpoint)&&(t._lapCount++,t._checkpoint=!1,t._lapCount>=2)){let r=this.raceTime-t._lapStart;if(t.lapTimes.push(r),t._lapStart=this.raceTime,t._lapCount>this.laps){this._finish(t);return}t.lap=t._lapCount,this._emit("race:lap",{kart:t,lap:t.lap,lapTime:r}),t===this.player&&t.lap===this.laps&&this.laps>1&&this._emit("race:finalLap",{})}}else s>.5&&(t.finished||(t._lapCount--,t._checkpoint=!0));t.finished||(t.lap=Math.max(1,Math.min(this.laps,t._lapCount)))}_finish(t){if(t.finished)return;t.finished=!0,t.finishTime=this.raceTime,t.lap=this.laps,this._finishCount++,t._finishOrder=this._finishCount,this._sortPlaces();let e=t.place;this._emit("race:finish",{kart:t,place:e,time:t.finishTime}),t===this.player&&(this.playerFinished=!0,this.endTimer=3.8,this._setWrongWay(!1)),this._finishCount>=this.karts.length&&this.endTimer<0&&!this.ended&&this.player&&(this.endTimer=1)}_updateProgress(){for(let t of this.karts){if(t.finished){t.raceProgress=this.laps+1+(100-(t._finishOrder??0))*1e-4;continue}let e=this._tOf(t);t.raceProgress=t._lapCount+e,t._startProgress==null&&this.phase==="racing"&&(t._startProgress=t.raceProgress)}}_sortPlaces(){let t=this.standings;t.sort((e,n)=>e.finished&&n.finished?e.finishTime-n.finishTime:e.finished?-1:n.finished?1:n.raceProgress-e.raceProgress);for(let e=0;e<t.length;e++)t[e].place=e+1}_updateWrongWay(t){let e=this.player;if(!this.track||typeof this.track.getTangentAt!="function")return;let n;try{n=this.track.getTangentAt(this._tOf(e))}catch{return}if(!n)return;yu.set(Math.sin(e.heading||0),0,Math.cos(e.heading||0));let s=Math.hypot(n.x,n.z)||1,r=(yu.x*n.x+yu.z*n.z)/s,o=e.velocity?e.velocity.x:0,a=e.velocity?e.velocity.z:0,l=(o*n.x+a*n.z)/s;Math.abs(e.speed||0)>3&&r<-.25&&l<-2?(this._wrongTimer+=t,this._rightTimer=0):(this._rightTimer+=t,this._wrongTimer=0),!this.wrongWay&&this._wrongTimer>1?this._setWrongWay(!0):this.wrongWay&&this._rightTimer>.4&&this._setWrongWay(!1)}_setWrongWay(t){this.wrongWay!==t&&(this.wrongWay=t,this._emit("race:wrongWay",{active:t}))}_end(){this.ended=!0,this.phase="done",this.results=this.computeResults(),this._emit("race:end",{results:this.results})}computeResults(){let t=this.track&&this.track.length||2e3,e=[],n=[];for(let r of this.karts)r.finished?e.push({kart:r,time:r.finishTime,estimated:!1}):n.push(r);e.sort((r,o)=>r.time-o.time),n.sort((r,o)=>o.raceProgress-r.raceProgress);let s=e.length?e[e.length-1].time:this.raceTime;for(let r of n){let o=Math.max(.05,r.raceProgress-(r._startProgress??.95))*t,a=Math.max(12,o/Math.max(1,this.raceTime)),l=Math.max(0,this.laps+1-r.raceProgress)*t,c=this.raceTime+l/a;c<=s&&(c=s+.3+Math.random()*.8),s=c,e.push({kart:r,time:c,estimated:!0})}return e.map((r,o)=>({place:o+1,kart:r.kart,character:r.kart.character,name:r.kart.character?r.kart.character.name:`Racer ${o+1}`,isPlayer:!!r.kart.isPlayer,time:r.time,estimated:r.estimated,bestLap:r.kart.lapTimes&&r.kart.lapTimes.length?Math.min(...r.kart.lapTimes):null}))}debugSetLap(t,e){t._lapCount=e,t._checkpoint=!0,t.lap=Math.max(1,Math.min(this.laps,e))}dispose(){this.karts=[],this.standings=[],this.player=null}};function Zr(i){if(i==null||!isFinite(i))return"--:--.--";let t=Math.floor(i/60),e=i-t*60,n=Math.floor(e),s=Math.floor((e-n)*100);return`${t}:${String(n).padStart(2,"0")}.${String(s).padStart(2,"0")}`}var vl=i=>"#"+(i>>>0).toString(16).padStart(6,"0").slice(-6),Mu=i=>{let t=["th","st","nd","rd"],e=i%100;return t[(e-20)%10]||t[e]||t[0]},bu=["#ffd23f","#e3ecf5","#f0a162","#8fdcff","#8fdcff","#8fdcff","#ff8a8a","#ff6b6b"];function Fe(i,t,e,n){let s=document.createElement(i);return t&&(s.className=t),n!=null&&(s.innerHTML=n),e&&e.appendChild(s),s}function Ki(i,t){i.classList.remove(t),i.offsetWidth,i.classList.add(t)}var Su=new Map;function np(i){if(Su.has(i))return Su.get(i);let t=document.createElement("canvas");t.width=t.height=128;let e=t.getContext("2d");e.lineJoin="round",e.lineCap="round";try{Hy(e,i)}catch{}let n=t.toDataURL();return Su.set(i,n),n}function yl(i,t,e,n){i.save(),i.translate(t,e),i.scale(n,n),i.fillStyle="#fbe7c6",i.strokeStyle="#3a2410",i.lineWidth=5,i.beginPath(),i.roundRect(-22,0,44,36,12),i.fill(),i.stroke(),i.fillStyle="#231a12",i.beginPath(),i.ellipse(-8,14,4,8,0,0,Math.PI*2),i.fill(),i.beginPath(),i.ellipse(8,14,4,8,0,0,Math.PI*2),i.fill();let s=i.createRadialGradient(-12,-26,4,0,-10,50);s.addColorStop(0,"#ff6b6b"),s.addColorStop(1,"#c71f1f"),i.fillStyle=s,i.beginPath(),i.moveTo(-44,4),i.bezierCurveTo(-46,-46,46,-46,44,4),i.closePath(),i.fill(),i.stroke(),i.fillStyle="#fff",i.beginPath(),i.arc(0,-24,11,0,Math.PI*2),i.fill(),i.beginPath(),i.arc(-30,-8,8,0,Math.PI*2),i.fill(),i.beginPath(),i.arc(30,-8,8,0,Math.PI*2),i.fill(),i.restore()}function Eu(i,t,e){i.save(),i.translate(64,70),i.strokeStyle="#1b1b1b",i.lineWidth=5,i.fillStyle="#fffbea",i.beginPath(),i.ellipse(0,14,46,16,0,0,Math.PI*2),i.fill(),i.stroke();let n=i.createRadialGradient(-14,-24,4,0,-6,56);n.addColorStop(0,t),n.addColorStop(1,e),i.fillStyle=n,i.beginPath(),i.moveTo(-42,10),i.bezierCurveTo(-44,-50,44,-50,42,10),i.closePath(),i.fill(),i.stroke(),i.strokeStyle="rgba(255,255,255,0.85)",i.lineWidth=4,i.beginPath();for(let s=0;s<6;s++){let r=s/6*Math.PI*2,o=Math.cos(r)*13,a=-14+Math.sin(r)*11;s===0?i.moveTo(o,a):i.lineTo(o,a)}i.closePath(),i.stroke(),i.beginPath(),i.moveTo(-13,-14),i.lineTo(-34,-6),i.moveTo(13,-14),i.lineTo(34,-6),i.moveTo(-6,-24),i.lineTo(-12,-38),i.moveTo(6,-24),i.lineTo(12,-38),i.stroke(),i.fillStyle="rgba(255,255,255,0.55)",i.beginPath(),i.ellipse(-18,-26,9,5,-.6,0,Math.PI*2),i.fill(),i.restore()}function By(i,t,e,n,s){i.beginPath();for(let r=0;r<10;r++){let o=-Math.PI/2+r*Math.PI/5,a=r%2===0?n:s,l=t+Math.cos(o)*a,c=e+Math.sin(o)*a;r===0?i.moveTo(l,c):i.lineTo(l,c)}i.closePath()}function Hy(i,t){switch(t){case"mushroom":yl(i,64,62,1.05);break;case"triple_mushroom":yl(i,64,42,.6),yl(i,34,86,.6),yl(i,94,86,.6);break;case"banana":{i.save(),i.translate(64,64),i.strokeStyle="#3a2a05",i.lineWidth=5;let e=i.createLinearGradient(-40,-40,40,40);e.addColorStop(0,"#fff176"),e.addColorStop(1,"#f9a825"),i.fillStyle=e,i.beginPath(),i.moveTo(-38,-34),i.bezierCurveTo(-52,20,0,52,44,30),i.bezierCurveTo(10,30,-22,10,-24,-36),i.closePath(),i.fill(),i.stroke(),i.fillStyle="#5d4037",i.beginPath(),i.roundRect(-40,-48,14,16,4),i.fill(),i.stroke(),i.strokeStyle="rgba(255,255,255,0.6)",i.lineWidth=4,i.beginPath(),i.moveTo(-36,-14),i.quadraticCurveTo(-30,18,0,32),i.stroke(),i.restore();break}case"green_shell":Eu(i,"#66e06a","#1b8a2a");break;case"red_shell":Eu(i,"#ff6b6b","#b71c1c");break;case"blue_shell":{i.save(),i.fillStyle="#ffffff",i.strokeStyle="#1b1b1b",i.lineWidth=4;for(let e of[-1,1])i.beginPath(),i.moveTo(64+e*30,58),i.bezierCurveTo(64+e*70,30,64+e*66,70,64+e*40,78),i.closePath(),i.fill(),i.stroke();i.restore(),Eu(i,"#64b5ff","#0d47a1"),i.fillStyle="#fff",i.strokeStyle="#1b1b1b",i.lineWidth=3;for(let[e,n]of[[44,44],[64,34],[84,44]])i.beginPath(),i.moveTo(e-7,n+8),i.lineTo(e,n-10),i.lineTo(e+7,n+8),i.closePath(),i.fill(),i.stroke();break}case"star":{let e=i.createRadialGradient(56,50,6,64,66,60);e.addColorStop(0,"#fffde7"),e.addColorStop(.5,"#ffeb3b"),e.addColorStop(1,"#ffa000"),i.fillStyle=e,i.strokeStyle="#8a4b00",i.lineWidth=5,By(i,64,68,56,24),i.fill(),i.stroke(),i.fillStyle="#1b1b1b",i.beginPath(),i.ellipse(55,64,5,10,0,0,Math.PI*2),i.fill(),i.beginPath(),i.ellipse(73,64,5,10,0,0,Math.PI*2),i.fill();break}case"lightning":{let e=i.createLinearGradient(40,10,90,120);e.addColorStop(0,"#fffde7"),e.addColorStop(.5,"#ffe54a"),e.addColorStop(1,"#ffb300"),i.fillStyle=e,i.strokeStyle="#7a4a00",i.lineWidth=5,i.beginPath(),i.moveTo(74,8),i.lineTo(30,70),i.lineTo(60,70),i.lineTo(46,120),i.lineTo(98,50),i.lineTo(68,50),i.lineTo(84,8),i.closePath(),i.fill(),i.stroke();break}default:i.fillStyle="#fff",i.font="bold 80px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillText("?",64,68)}}var Ml=class{constructor(t){this.uiRoot=t,this.root=Fe("div","hud hidden",t),this.portraitFn=null,this.player=null,this.track=null,this._offs=[],this._last={},this._rouletteTimer=0,this._rouletteIdx=0,this._lastItemKey="",this._standKey="",this.active=!1;let e=this.root;this.tl=Fe("div","hud-tl",e),this.lapEl=Fe("div","hud-lap",this.tl,'<span class="lbl">LAP</span><span class="val">1</span><span class="of">/3</span>'),this.lapVal=this.lapEl.querySelector(".val"),this.lapOf=this.lapEl.querySelector(".of"),this.timerEl=Fe("div","hud-timer",this.tl,"0:00.00"),this.splitsEl=Fe("div","hud-splits",this.tl),this.itemWrap=Fe("div","hud-item",e),this.itemSlot=Fe("div","item-slot",this.itemWrap),this.itemImg=Fe("img","item-img",this.itemSlot),this.itemImg.alt="",this.itemCount=Fe("div","item-count",this.itemSlot),this.itemHint=Fe("div","item-hint",this.itemWrap,"E / SHIFT"),this.standEl=Fe("div","hud-standings",e),this.standRows=[];for(let n=0;n<8;n++){let s=Fe("div","st-row",this.standEl,'<span class="st-pos"></span><span class="st-chip"></span><span class="st-name"></span>');this.standRows.push({row:s,pos:s.querySelector(".st-pos"),chip:s.querySelector(".st-chip"),name:s.querySelector(".st-name")})}this.mapWrap=Fe("div","hud-minimap",e),this.mapCanvas=Fe("canvas","",this.mapWrap),this.mapCanvas.width=this.mapCanvas.height=440,this.mapCtx=this.mapCanvas.getContext("2d"),this.mapBg=null,this.br=Fe("div","hud-br",e),this.speedo=Fe("div","hud-speedo",this.br),this.speedCanvas=Fe("canvas","",this.speedo),this.speedCanvas.width=this.speedCanvas.height=320,this.speedCtx=this.speedCanvas.getContext("2d"),this.speedText=Fe("div","speed-val",this.speedo,"0"),Fe("div","speed-unit",this.speedo,"km/h"),this.driftPill=Fe("div","drift-pill",this.speedo,"DRIFT"),this.placeEl=Fe("div","hud-place",this.br,'<span class="num">1</span><span class="suf">st</span>'),this.placeNum=this.placeEl.querySelector(".num"),this.placeSuf=this.placeEl.querySelector(".suf"),this.countEl=Fe("div","hud-countdown",e),this.bannerEl=Fe("div","hud-banner",e),this.wrongEl=Fe("div","hud-wrongway",e,'<div class="ww-arrow"></div><div class="ww-text">WRONG WAY</div>'),this.flashEl=Fe("div","hud-flash",t),this.finishEl=Fe("div","hud-finish",e),this.lapPop=Fe("div","hud-lappop",e),this.resultsEl=Fe("div","results hidden",t),this._resultsKey=null,this.toastEl=Fe("div","toast",t),this._subscribe()}setPortraitProvider(t){this.portraitFn=t}portrait(t){if(!t)return"";let e=t.id;if(this._portraits=this._portraits||new Map,this._portraits.has(e))return this._portraits.get(e);let n="";try{this.portraitFn&&(n=this.portraitFn(t)||"")}catch{n=""}return this._portraits.set(e,n),n}_subscribe(){let t=(e,n)=>this._offs.push(Bt.on(e,s=>{this.active&&n(s||{})}));t("race:countdown",e=>this.showCount(String(e.n),"n"+e.n)),t("race:go",()=>{this.showCount("GO!","go"),clearTimeout(this._cdT),this._cdT=setTimeout(()=>this.countEl.classList.remove("show"),1100)}),t("race:finalLap",()=>this.banner("FINAL LAP!","final")),t("race:lap",e=>{e.kart&&e.kart.isPlayer&&(Ki(this.lapEl,"pulse"),e.lapTime!=null&&(this.lapPop.textContent=Zr(e.lapTime),Ki(this.lapPop,"show")))}),t("race:wrongWay",e=>this.wrongEl.classList.toggle("show",!!e.active)),t("item:lightning",e=>{e.by&&e.by.isPlayer?Ki(this.flashEl,"flash-soft"):Ki(this.flashEl,"flash")}),t("race:finish",e=>{if(e.kart&&e.kart.isPlayer){let n=e.place||1;this.finishEl.innerHTML=`<div class="fin-title">FINISH!</div><div class="fin-place" style="color:${bu[n-1]||"#fff"}">${n}<small>${Mu(n)}</small></div>`,Ki(this.finishEl,"show"),this.wrongEl.classList.remove("show")}}),t("item:got",e=>{e.kart&&e.kart.isPlayer&&Ki(this.itemSlot,"got")}),t("kart:hit",e=>{e.kart&&e.kart.isPlayer&&Ki(this.root,"shake")})}show(){this.active=!0,this.root.classList.remove("hidden")}hide(){this.active=!1,this.root.classList.add("hidden")}reset({player:t,track:e,laps:n}){this.player=t,this.track=e,this.laps=n,this._last={},this._standKey="",this._lastItemKey="",this.splitsEl.innerHTML="",this.countEl.className="hud-countdown",this.bannerEl.className="hud-banner",this.wrongEl.classList.remove("show"),this.finishEl.className="hud-finish",this.lapPop.className="hud-lappop",this.hideResults(),this._buildMinimap(e)}toast(t){this.toastEl.textContent=t,Ki(this.toastEl,"show")}showCount(t,e){this.countEl.textContent=t,this.countEl.className="hud-countdown",this.countEl.offsetWidth,this.countEl.className=`hud-countdown show ${e}`}banner(t,e=""){this.bannerEl.textContent=t,this.bannerEl.className="hud-banner",this.bannerEl.offsetWidth,this.bannerEl.className=`hud-banner show ${e}`}_buildMinimap(t){this.mapBg=null;let e=t&&t.minimap;if(!e||!e.points||e.points.length<2){this.mapWrap.style.display="none";return}this.mapWrap.style.display="";let n=this.mapCanvas.width,s=34,r=e.bounds||this._bounds(e.points),o=Math.max(1,r.maxX-r.minX),a=Math.max(1,r.maxZ-r.minZ),l=(n-s*2)/Math.max(o,a),c=(n-o*l)/2,h=(n-a*l)/2;this._map={minX:r.minX,minZ:r.minZ,scale:l,ox:c,oz:h};let u=document.createElement("canvas");u.width=u.height=n;let d=u.getContext("2d"),f=()=>{d.beginPath(),e.points.forEach((R,T)=>{let[C,b]=this._mp(R.x,R.z);T===0?d.moveTo(C,b):d.lineTo(C,b)}),d.closePath()};d.lineJoin="round",d.lineCap="round";let p=Math.max(10,(t.roadWidth||24)*l);f(),d.strokeStyle="rgba(0,0,0,0.55)",d.lineWidth=p+16,d.stroke(),f(),d.strokeStyle="#ffffff",d.lineWidth=p+6,d.stroke(),f(),d.strokeStyle="#5b6b86",d.lineWidth=p,d.stroke();let x=e.points[0],g=e.points[1],[m,M]=this._mp(x.x,x.z),[_,v]=this._mp(g.x,g.z),w=Math.atan2(v-M,_-m);d.save(),d.translate(m,M),d.rotate(w);for(let R=-3;R<3;R++)for(let T=0;T<2;T++)d.fillStyle=(R+T)%2===0?"#fff":"#111",d.fillRect(T*5-5,R*(p/6),5,p/6);d.restore(),this.mapBg=u}_bounds(t){let e={minX:1/0,maxX:-1/0,minZ:1/0,maxZ:-1/0};for(let n of t)e.minX=Math.min(e.minX,n.x),e.maxX=Math.max(e.maxX,n.x),e.minZ=Math.min(e.minZ,n.z),e.maxZ=Math.max(e.maxZ,n.z);return e}_mp(t,e){let n=this._map;return[n.ox+(t-n.minX)*n.scale,n.oz+(e-n.minZ)*n.scale]}_drawMinimap(t,e,n,s){if(!this.mapBg)return;let r=this.mapCtx,o=this.mapCanvas.width;if(r.clearRect(0,0,o,o),r.drawImage(this.mapBg,0,0),this.track&&this.track.itemBoxPositions){r.fillStyle="rgba(255,215,64,0.85)";for(let a of this.track.itemBoxPositions){let[l,c]=this._mp(a.x,a.z);r.fillRect(l-3,c-3,6,6)}}if(s&&typeof s.getHazards=="function"){let a=null;try{a=s.getHazards()}catch{a=null}if(a)for(let l of a){if(!l||!l.position)continue;let[c,h]=this._mp(l.position.x,l.position.z);r.fillStyle=l.type==="banana"?"#ffe44d":l.type&&l.type.includes("red")?"#ff5252":l.type&&l.type.includes("blue")?"#448aff":"#69f06e",r.beginPath(),r.arc(c,h,5,0,Math.PI*2),r.fill()}}for(let a=t.length-1;a>=0;a--){let l=t[a];if(l===e||!l.position)continue;let[c,h]=this._mp(l.position.x,l.position.z);r.fillStyle=l.character?vl(l.character.color):"#ccc",r.strokeStyle="#111",r.lineWidth=4,r.beginPath(),r.arc(c,h,11,0,Math.PI*2),r.fill(),r.stroke()}if(e&&e.position){let[a,l]=this._mp(e.position.x,e.position.z),c=1+Math.sin(n*6)*.15;r.fillStyle="rgba(255,255,255,0.35)",r.beginPath(),r.arc(a,l,24*c,0,Math.PI*2),r.fill();let h=e.heading||0,u=Math.sin(h),d=Math.cos(h);r.save(),r.translate(a,l),r.rotate(Math.atan2(d,u)),r.fillStyle=e.character?vl(e.character.color):"#f33",r.strokeStyle="#fff",r.lineWidth=5,r.beginPath(),r.moveTo(20,0),r.lineTo(-12,13),r.lineTo(-6,0),r.lineTo(-12,-13),r.closePath(),r.fill(),r.stroke(),r.restore()}}_drawSpeedo(t,e,n=60){let s=this.speedCtx,r=this.speedCanvas.width,o=r/2,a=r/2,l=r*.4;s.clearRect(0,0,r,r);let c=Math.PI*.75,h=Math.PI*2.25;s.lineCap="round",s.lineWidth=26,s.strokeStyle="rgba(0,0,0,0.45)",s.beginPath(),s.arc(o,a,l,c,h),s.stroke();let u=Math.min(1,Math.abs(t)/n),d=s.createLinearGradient(0,r,r,0);e?(d.addColorStop(0,"#ff9100"),d.addColorStop(1,"#ffea00")):(d.addColorStop(0,"#40c4ff"),d.addColorStop(.7,"#69f0ae"),d.addColorStop(1,"#eeff41")),s.strokeStyle=d,s.lineWidth=18,u>.005&&(s.beginPath(),s.arc(o,a,l,c,c+(h-c)*u),s.stroke()),s.strokeStyle="rgba(255,255,255,0.75)",s.lineWidth=4;for(let f=0;f<=10;f++){let p=c+(h-c)*f/10,x=l-26,g=l-(f%5===0?44:36);s.beginPath(),s.moveTo(o+Math.cos(p)*x,a+Math.sin(p)*x),s.lineTo(o+Math.cos(p)*g,a+Math.sin(p)*g),s.stroke()}}update(t,{player:e,karts:n,race:s,itemSystem:r,time:o=0}={}){if(!this.active||!e)return;let a=this._last,l=s?s.laps:this.laps||3,c=Math.max(1,Math.min(l,e.lap||1));(a.lap!==c||a.laps!==l)&&(a.lap!=null&&c>a.lap&&Ki(this.lapEl,"pulse"),a.lap=c,a.laps=l,this.lapVal.textContent=c,this.lapOf.textContent="/"+l,this.lapEl.classList.toggle("final",c===l&&l>1));let h=s&&(s.phase==="racing"||s.phase==="done")?e.finished?e.finishTime:s.raceTime:0,u=Zr(h);a.ts!==u&&(a.ts=u,this.timerEl.textContent=u);let d=e.lapTimes||[];if(a.splits!==d.length){a.splits=d.length;let T=d.length?Math.min(...d):0;this.splitsEl.innerHTML=d.map((C,b)=>`<div class="split${C===T&&d.length>1?" best":""}"><span>L${b+1}</span>${Zr(C)}</div>`).join("")}let f=e.place||1;a.place!==f&&(a.place=f,this.placeNum.textContent=f,this.placeSuf.textContent=Mu(f),this.placeEl.style.setProperty("--pc",bu[f-1]||"#fff"),Ki(this.placeEl,"bump"));let p=!1,x=null;if(r&&typeof r.rouletteState=="function")try{let T=r.rouletteState(e);T&&(p=!!T.spinning,x=T.displayItem||null)}catch{}let g;if(p){this._rouletteTimer-=t,this._rouletteTimer<=0&&(this._rouletteTimer=.07,this._rouletteIdx=(this._rouletteIdx+1)%ks.length);let T=x&&ks.includes(x)?x:ks[this._rouletteIdx];g="spin:"+T,g!==this._lastItemKey&&(this.itemImg.src=np(T))}else if(e.item){let T=e.itemCount||1;g="item:"+e.item+":"+T,g!==this._lastItemKey&&(this.itemImg.src=np(e.item),this.itemCount.textContent=T>1?"\xD7"+T:"")}else g="none";if(g!==this._lastItemKey){this._lastItemKey=g;let T=g!=="none";this.itemImg.style.visibility=T?"visible":"hidden",this.itemSlot.classList.toggle("spinning",p),this.itemSlot.classList.toggle("filled",T&&!p),(!e.item||p)&&(this.itemCount.textContent=""),this.itemHint.style.opacity=T&&!p?1:0}let m=Math.abs(e.speed||0),M=e.boostTimer>0||e.starTimer>0;this._drawSpeedo(m,M);let _=Math.round(m*3.6);a.kmh!==_&&(a.kmh=_,this.speedText.textContent=_),a.boost!==M&&(a.boost=M,this.speedo.classList.toggle("boost",M));let v=e.drifting?e.driftLevel||0:-1;a.dl!==v&&(a.dl=v,this.driftPill.className="drift-pill"+(v>=0?" show lvl"+v:""),this.driftPill.textContent=v>=3?"ULTRA":v===2?"SUPER":v===1?"MINI":"DRIFT");let w=s&&s.standings||n||[],R=w.map(T=>T.index).join(",");if(R!==this._standKey){this._standKey=R;for(let T=0;T<this.standRows.length;T++){let C=this.standRows[T],b=w[T];if(!b){C.row.style.display="none";continue}C.row.style.display="",C.pos.textContent=T+1,C.chip.style.background=b.character?vl(b.character.color):"#888",C.name.textContent=b.character?b.character.name:"?",C.row.classList.toggle("me",b===e)}}this._drawMinimap(w,e,o,r)}showResults(t,{onRestart:e,onMenu:n,laps:s}={}){let r=this.resultsEl,o=t.map((f,p)=>{let x=this.portrait(f.character),g=f.character?vl(f.character.color):"#888",m=bu[f.place-1]||"#fff";return`<div class="res-row${f.isPlayer?" me":""}" style="--d:${.25+p*.07}s">
        <div class="res-place" style="color:${m}">${f.place}<small>${Mu(f.place)}</small></div>
        <div class="res-portrait" style="--kc:${g}">${x?`<img src="${x}" alt="">`:`<span>${(f.name||"?")[0]}</span>`}</div>
        <div class="res-name">${f.name}${f.isPlayer?" <em>YOU</em>":""}</div>
        <div class="res-best">${f.bestLap?"BEST "+Zr(f.bestLap):""}</div>
        <div class="res-time">${f.estimated?"~":""}${Zr(f.time)}</div>
      </div>`}).join(""),a=t.find(f=>f.isPlayer),l=a?a.place===1?"VICTORY!":a.place<=3?"PODIUM FINISH!":"RACE COMPLETE":"RESULTS";r.innerHTML=`
      <div class="res-panel">
        <div class="res-title">${l}</div>
        <div class="res-sub">${s||""} LAP RACE \xB7 FINAL STANDINGS</div>
        <div class="res-table">${o}</div>
        <div class="res-buttons">
          <button class="btn primary" data-act="restart">RACE AGAIN</button>
          <button class="btn" data-act="menu">MAIN MENU</button>
        </div>
      </div>`,r.classList.remove("hidden"),requestAnimationFrame(()=>r.classList.add("show"));let c=[...r.querySelectorAll(".btn")],h=0,u=()=>c.forEach((f,p)=>f.classList.toggle("focus",p===h));u();let d=f=>{this.hideResults(),Bt.emit("ui:confirm"),f==="restart"?e&&e():n&&n()};c.forEach((f,p)=>{f.addEventListener("click",()=>d(f.dataset.act)),f.addEventListener("mouseenter",()=>{h!==p&&(h=p,u(),Bt.emit("ui:move"))})}),this._resKey=f=>{["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD"].includes(f.code)?(h=(h+1)%c.length,u(),Bt.emit("ui:move"),f.preventDefault()):(f.code==="Enter"||f.code==="Space"||f.code==="NumpadEnter")&&!f.repeat&&(f.preventDefault(),d(c[h].dataset.act))},setTimeout(()=>{this._resKey&&window.addEventListener("keydown",this._resKey)},400)}hideResults(){this._resKey&&(window.removeEventListener("keydown",this._resKey),this._resKey=null),this.resultsEl.classList.remove("show"),this.resultsEl.classList.add("hidden"),this.resultsEl.innerHTML=""}get resultsVisible(){return!!this._resKey||this.resultsEl.classList.contains("show")}dispose(){for(let t of this._offs)t();this._offs=[],this.hideResults(),this.root.remove(),this.flashEl.remove(),this.resultsEl.remove(),this.toastEl.remove()}};var Oo=i=>"#"+(i>>>0).toString(16).padStart(6,"0").slice(-6),zo=["easy","normal","hard"],Gy={easy:"50cc \xB7 EASY",normal:"100cc \xB7 NORMAL",hard:"150cc \xB7 HARD"},Kr=[1,3,5],ip=[["speed","SPEED","SPD"],["accel","ACCEL","ACC"],["handling","HANDLING","HDL"],["weight","WEIGHT","WGT"]];function Bo(i,t,e,n){let s=document.createElement(i);return t&&(s.className=t),n!=null&&(s.innerHTML=n),e&&e.appendChild(s),s}var sp=i=>`<div class="bar">${[1,2,3,4,5].map(t=>`<i class="${t<=i?"on":""}"></i>`).join("")}</div>`,rp=`
  <div class="ctl"><span class="kc">\u2191</span><span class="kc">W</span> Accelerate</div>
  <div class="ctl"><span class="kc">\u2193</span><span class="kc">S</span> Brake / Reverse</div>
  <div class="ctl"><span class="kc">\u2190\u2192</span><span class="kc">A D</span> Steer</div>
  <div class="ctl"><span class="kc wide">SPACE</span> Hop / Drift</div>
  <div class="ctl"><span class="kc">E</span><span class="kc">X</span><span class="kc wide">L-SHIFT</span> Use item</div>
  <div class="ctl"><span class="kc">C</span> Look back</div>
  <div class="ctl"><span class="kc wide">ESC</span><span class="kc">P</span> Pause</div>
  <div class="ctl"><span class="kc">M</span> Mute</div>`,bl=class{constructor(t,e={}){this.uiRoot=t,this.h=e,this.screen=null,this.portraitFn=null,this.charIndex=0,this.diffIndex=1,this.lapsIndex=1,this.zone="grid",this.optIndex=0,this.pauseIndex=0,this._pad={prev:{},repeatT:0,dir:null},this.gameState="title";try{let n=JSON.parse(localStorage.getItem("tkr-settings")||"{}");n.charIndex>=0&&n.charIndex<Vn.length&&(this.charIndex=n.charIndex),n.diffIndex>=0&&n.diffIndex<zo.length&&(this.diffIndex=n.diffIndex),n.lapsIndex>=0&&n.lapsIndex<Kr.length&&(this.lapsIndex=n.lapsIndex)}catch{}this._buildTitle(),this._buildSelect(),this._buildPause(),this._buildLoading(),this._onKey=n=>this._key(n),window.addEventListener("keydown",this._onKey)}setPortraitProvider(t){this.portraitFn=t,this._portraits=new Map,this.cards.forEach((e,n)=>{let s=this.portrait(Vn[n]);s&&(e.img.src=s,e.img.style.display="",e.initial.style.display="none")}),this._refreshPreview()}portrait(t){if(!t||!this.portraitFn)return"";if(this._portraits=this._portraits||new Map,this._portraits.has(t.id))return this._portraits.get(t.id);let e="";try{e=this.portraitFn(t)||""}catch{e=""}return this._portraits.set(t.id,e),e}_buildTitle(){let t=this.titleEl=Bo("div","screen title-screen",this.uiRoot),e=tp.toUpperCase().split(" "),n=e.shift();t.innerHTML=`
      <div class="title-vignette"></div>
      <div class="logo">
        <div class="logo-line l1" data-text="${n}">${n}</div>
        <div class="logo-line l2" data-text="${e.join(" ")}">${e.join(" ")}</div>
        <div class="logo-swoosh"></div>
      </div>
      <div class="press-start">PRESS ENTER / CLICK TO START</div>
      <div class="title-foot">
        <span>\xA9 Turbo Kart Rally \xB7 original procedural game</span>
        <span class="kc">M</span> mute
      </div>`,t.addEventListener("click",()=>{this.screen==="title"&&this._toSelect()})}_buildSelect(){let t=this.selectEl=Bo("div","screen select-screen",this.uiRoot);t.innerHTML=`
      <div class="sel-header"><div class="sel-title">CHOOSE YOUR RACER</div><div class="sel-back">ESC \xB7 BACK</div></div>
      <div class="sel-body">
        <div class="sel-grid"></div>
        <div class="sel-side">
          <div class="preview">
            <div class="pv-portrait"><img alt=""><span class="pv-initial"></span></div>
            <div class="pv-info">
              <div class="pv-name"></div>
              <div class="pv-kart"><span class="swatch"></span><span class="pv-kart-lbl"></span></div>
              <div class="pv-stats"></div>
            </div>
          </div>
          <div class="opts">
            <div class="opt" data-i="0"><span class="opt-lbl">CLASS</span><span class="opt-arrow l">\u25C0</span><span class="opt-val"></span><span class="opt-arrow r">\u25B6</span></div>
            <div class="opt" data-i="1"><span class="opt-lbl">LAPS</span><span class="opt-arrow l">\u25C0</span><span class="opt-val"></span><span class="opt-arrow r">\u25B6</span></div>
            <button class="btn primary race-btn" data-i="2">RACE!</button>
          </div>
        </div>
      </div>
      <div class="controls-help">${rp}</div>`;let e=t.querySelector(".sel-grid");this.cards=Vn.map((n,s)=>{let r=Bo("div","card",e);return r.style.setProperty("--kc",Oo(n.color)),r.style.setProperty("--ka",Oo(n.accent)),r.innerHTML=`
        <div class="card-portrait"><img alt="" style="display:none"><span class="initial">${n.name[0]}</span></div>
        <div class="card-name">${n.name}</div>
        <div class="card-stats">${ip.map(([o,,a])=>`<div class="st"><span>${a}</span>${sp(n.stats[o])}</div>`).join("")}</div>`,r.addEventListener("mouseenter",()=>{this.screen==="select"&&(this.zone="grid",this._setChar(s))}),r.addEventListener("click",()=>{this.screen==="select"&&(this._setChar(s),this._confirmChar())}),r.addEventListener("dblclick",()=>{this.screen==="select"&&this._start()}),{card:r,img:r.querySelector("img"),initial:r.querySelector(".initial")}}),this.pv={img:t.querySelector(".pv-portrait img"),initial:t.querySelector(".pv-initial"),portrait:t.querySelector(".pv-portrait"),name:t.querySelector(".pv-name"),swatch:t.querySelector(".swatch"),kartLbl:t.querySelector(".pv-kart-lbl"),stats:t.querySelector(".pv-stats")},this.optEls=[...t.querySelectorAll(".opts [data-i]")],this.optEls.forEach((n,s)=>{n.addEventListener("mouseenter",()=>{this.screen==="select"&&(this.zone="opts",this.optIndex=s,this._refreshFocus())}),s<2?(n.querySelector(".l").addEventListener("click",r=>{r.stopPropagation(),this.zone="opts",this.optIndex=s,this._changeOpt(-1)}),n.querySelector(".r").addEventListener("click",r=>{r.stopPropagation(),this.zone="opts",this.optIndex=s,this._changeOpt(1)}),n.querySelector(".opt-val").addEventListener("click",()=>{this.zone="opts",this.optIndex=s,this._changeOpt(1)})):n.addEventListener("click",()=>this._start())}),t.querySelector(".sel-back").addEventListener("click",()=>this._toTitle()),this._refreshPreview(),this._refreshOpts()}_buildPause(){let t=this.pauseEl=Bo("div","screen pause-screen",this.uiRoot);t.innerHTML=`
      <div class="pause-panel">
        <div class="pause-title">PAUSED</div>
        <button class="btn" data-a="resume">RESUME</button>
        <button class="btn" data-a="restart">RESTART</button>
        <button class="btn" data-a="quit">QUIT TO MENU</button>
        <div class="controls-help compact">${rp}</div>
      </div>`,this.pauseBtns=[...t.querySelectorAll(".btn")],this.pauseBtns.forEach((e,n)=>{e.addEventListener("mouseenter",()=>{this.pauseIndex!==n&&(this.pauseIndex=n,this._refreshPause(),Bt.emit("ui:move"))}),e.addEventListener("click",()=>this._pauseAct(e.dataset.a))})}_buildLoading(){this.loadingEl=Bo("div","screen loading-screen",this.uiRoot,'<div class="spinner"></div><div class="loading-text">LOADING</div>')}_showOnly(t){for(let e of[this.titleEl,this.selectEl,this.pauseEl,this.loadingEl])e.classList.toggle("active",e===t)}showTitle(){this.screen="title",this._showOnly(this.titleEl)}showSelect(){this.screen="select",this.zone="grid",this._showOnly(this.selectEl),this._setChar(this.charIndex,!0),this._refreshOpts()}showPause(){this.screen="pause",this.pauseIndex=0,this._refreshPause(),this._showOnly(this.pauseEl)}showLoading(t="LOADING"){this.screen="loading",this.loadingEl.querySelector(".loading-text").textContent=t,this._showOnly(this.loadingEl)}hideAll(){this.screen=null,this._showOnly(null)}get settings(){return{characterIndex:this.charIndex,difficulty:zo[this.diffIndex],laps:Kr[this.lapsIndex]}}_toSelect(){Bt.emit("ui:confirm"),this.showSelect(),this.h.onScreen&&this.h.onScreen("select")}_toTitle(){Bt.emit("ui:back"),this.showTitle(),this.h.onScreen&&this.h.onScreen("title")}_setChar(t,e){t=(t+Vn.length)%Vn.length,t!==this.charIndex&&!e&&Bt.emit("ui:move"),this.charIndex=t,this.cards.forEach((n,s)=>n.card.classList.toggle("selected",s===t)),this._refreshPreview(),this._refreshFocus()}_confirmChar(){Bt.emit("ui:confirm"),this.zone="opts",this.optIndex=2;let t=this.cards[this.charIndex].card;t.classList.remove("picked"),t.offsetWidth,t.classList.add("picked"),this._refreshFocus()}_refreshPreview(){if(!this.pv)return;let t=Vn[this.charIndex],e=this.portrait(t);e?(this.pv.img.src=e,this.pv.img.style.display="",this.pv.initial.style.display="none"):(this.pv.img.style.display="none",this.pv.initial.style.display="",this.pv.initial.textContent=t.name[0]),this.pv.portrait.style.setProperty("--kc",Oo(t.color)),this.pv.name.textContent=t.name.toUpperCase(),this.pv.swatch.style.background=`linear-gradient(135deg, ${Oo(t.color)} 60%, ${Oo(t.accent)} 60%)`,this.pv.kartLbl.textContent=`${t.hat.toUpperCase()} \xB7 KART`,this.pv.stats.innerHTML=ip.map(([n,s])=>`<div class="st big"><span>${s}</span>${sp(t.stats[n])}</div>`).join(""),this.pv.portrait.classList.remove("pop"),this.pv.portrait.offsetWidth,this.pv.portrait.classList.add("pop")}_refreshOpts(){this.optEls&&(this.optEls[0].querySelector(".opt-val").textContent=Gy[zo[this.diffIndex]],this.optEls[1].querySelector(".opt-val").textContent=`${Kr[this.lapsIndex]} LAP${Kr[this.lapsIndex]>1?"S":""}`)}_refreshFocus(){this.cards.forEach((t,e)=>t.card.classList.toggle("focus",this.zone==="grid"&&e===this.charIndex)),this.optEls.forEach((t,e)=>t.classList.toggle("focus",this.zone==="opts"&&e===this.optIndex))}_changeOpt(t){if(this.optIndex===0)this.diffIndex=(this.diffIndex+t+zo.length)%zo.length;else if(this.optIndex===1)this.lapsIndex=(this.lapsIndex+t+Kr.length)%Kr.length;else return;Bt.emit("ui:move"),this._refreshOpts(),this._refreshFocus();let e=this.optEls[this.optIndex].querySelector(".opt-val");e.classList.remove("bump"),e.offsetWidth,e.classList.add("bump")}_start(){if(this.screen==="select"){try{localStorage.setItem("tkr-settings",JSON.stringify({charIndex:this.charIndex,diffIndex:this.diffIndex,lapsIndex:this.lapsIndex}))}catch{}Bt.emit("ui:confirm"),this.h.onStart&&this.h.onStart(this.settings)}}_gridCols(){try{let t=this.selectEl.querySelector(".sel-grid"),e=getComputedStyle(t).gridTemplateColumns.split(" ").filter(Boolean).length;return e>=1&&e<=8?e:2}catch{return 2}}_refreshPause(){this.pauseBtns.forEach((t,e)=>t.classList.toggle("focus",e===this.pauseIndex))}_pauseAct(t){this.screen==="pause"&&(Bt.emit("ui:confirm"),t==="resume"?this.h.onResume&&this.h.onResume():t==="restart"?this.h.onRestart&&this.h.onRestart():t==="quit"&&this.h.onQuit&&this.h.onQuit())}_key(t){let e=t.code,n=e==="Enter"||e==="NumpadEnter"||e==="Space";if(this.screen==="title"){(n||e==="KeyE")&&!t.repeat&&(t.preventDefault(),this._toSelect());return}if(this.screen==="select"){let s=e==="ArrowUp"||e==="KeyW",r=e==="ArrowDown"||e==="KeyS",o=e==="ArrowLeft"||e==="KeyA",a=e==="ArrowRight"||e==="KeyD";if((s||r||o||a||n)&&t.preventDefault(),e==="Escape"||e==="Backspace"){this.zone==="opts"?(this.zone="grid",this._refreshFocus(),Bt.emit("ui:back")):this._toTitle();return}if(this.zone==="grid"){let l=this._gridCols(),c=this.charIndex,h=c%l,u=Math.floor(c/l),d=Math.ceil(Vn.length/l);o?this._setChar(h===0?c+l-1:c-1):a?h===l-1?(this.zone="opts",this.optIndex=0,Bt.emit("ui:move"),this._refreshFocus()):this._setChar(c+1):s?this._setChar((u-1+d)%d*l+h):r?this._setChar((u+1)%d*l+h):n&&!t.repeat&&this._confirmChar()}else s?(this.optIndex===0?this.zone="grid":this.optIndex--,Bt.emit("ui:move"),this._refreshFocus()):r?(this.optIndex=Math.min(2,this.optIndex+1),Bt.emit("ui:move"),this._refreshFocus()):o?this.optIndex===2?(this.zone="grid",Bt.emit("ui:move"),this._refreshFocus()):this._changeOpt(-1):a?this.optIndex<2&&this._changeOpt(1):n&&!t.repeat&&(this.optIndex===2?this._start():this._changeOpt(1));return}this.screen==="pause"&&(e==="ArrowUp"||e==="KeyW"?(this.pauseIndex=(this.pauseIndex+2)%3,this._refreshPause(),Bt.emit("ui:move"),t.preventDefault()):e==="ArrowDown"||e==="KeyS"?(this.pauseIndex=(this.pauseIndex+1)%3,this._refreshPause(),Bt.emit("ui:move"),t.preventDefault()):n&&!t.repeat&&(t.preventDefault(),this._pauseAct(this.pauseBtns[this.pauseIndex].dataset.a)))}update(t,e){this.gameState=e;let n=navigator.getGamepads?navigator.getGamepads():[],s=null;for(let d of n||[])if(d&&d.connected){s=d;break}if(!s)return;let r=d=>!!(s.buttons[d]&&s.buttons[d].pressed),o=s.axes[0]||0,a=s.axes[1]||0,l={up:r(12)||a<-.6,down:r(13)||a>.6,left:r(14)||o<-.6,right:r(15)||o>.6,a:r(0),b:r(1),start:r(9)},c=this._pad.prev,h=this.screen==="title"||this.screen==="select"||this.screen==="pause"||e==="results",u=d=>window.dispatchEvent(new KeyboardEvent("keydown",{code:d,key:d,bubbles:!0}));if(h){let d=[["up","ArrowUp"],["down","ArrowDown"],["left","ArrowLeft"],["right","ArrowRight"]],f=null;for(let[p,x]of d)l[p]&&!c[p]&&(u(x),this._pad.repeatT=.4),l[p]&&(f=x);f&&(this._pad.repeatT-=t,this._pad.repeatT<=0&&(u(f),this._pad.repeatT=.14)),l.a&&!c.a&&u("Enter"),l.b&&!c.b&&u(this.screen==="pause"?"Escape":"Backspace")}l.start&&!c.start&&u(this.screen==="title"?"Enter":"Escape"),e==="intro"&&l.a&&!c.a&&u("Enter"),this._pad.prev=l}dispose(){window.removeEventListener("keydown",this._onKey);for(let t of[this.titleEl,this.selectEl,this.pauseEl,this.loadingEl])t.remove()}};var En=i=>440*Math.pow(2,(i-69)/12),Sl=(i,t,e)=>Math.max(t,Math.min(e,i)),Vy={bpm:150,bars:[{root:36,chord:[60,64,67],mel:[[0,76,2],[2,79,2],[4,84,3],[7,83,1],[8,79,2],[10,76,2],[12,79,4]]},{root:45,chord:[57,60,64],mel:[[0,81,2],[2,79,2],[4,76,2],[6,72,2],[8,76,3],[11,74,1],[12,72,4]]},{root:41,chord:[60,65,69],mel:[[0,77,2],[2,81,2],[4,84,2],[6,81,2],[8,79,2],[10,77,2],[12,81,4]]},{root:43,chord:[59,62,67],mel:[[0,79,3],[3,81,1],[4,83,2],[6,86,2],[8,83,2],[10,79,2],[12,74,2],[14,79,2]]},{root:41,chord:[60,65,69],mel:[[0,84,2],[2,81,2],[4,77,2],[6,81,2],[8,84,2],[10,86,2],[12,84,4]]},{root:43,chord:[59,62,67],mel:[[0,83,2],[2,79,2],[4,74,2],[6,79,2],[8,83,2],[10,86,2],[12,83,4]]},{root:45,chord:[57,60,64],mel:[[0,84,3],[3,83,1],[4,81,2],[6,76,2],[8,81,2],[10,84,2],[12,88,4]]},{root:43,chord:[59,62,67],mel:[[0,86,2],[2,84,2],[4,83,2],[6,81,2],[8,79,2],[10,81,1],[11,83,1],[12,86,4]],fill:!0}],bassPattern:[0,0,12,0,7,0,12,7],style:"race"},Wy={bpm:92,bars:[{root:41,chord:[53,57,60,64],mel:[[0,76,6],[6,74,2],[8,72,4],[12,69,4]]},{root:40,chord:[52,55,59,62],mel:[[0,71,6],[6,72,2],[8,74,8]]},{root:38,chord:[50,53,57,60],mel:[[0,77,4],[4,76,4],[8,74,4],[12,72,4]]},{root:36,chord:[48,52,55,59],mel:[[0,71,8],[8,67,4],[12,72,4]]},{root:41,chord:[53,57,60,64],mel:[[0,72,2],[2,76,2],[4,79,8],[12,77,4]]},{root:40,chord:[52,55,59,62],mel:[[0,76,4],[4,74,4],[8,71,8]]},{root:38,chord:[50,53,57,60],mel:[[0,74,4],[4,72,4],[8,69,4],[12,72,4]]},{root:43,chord:[50,55,59,62],mel:[[0,71,8],[8,74,8]]}],style:"menu"},Xy={race:Vy,menu:Wy},El=class{constructor(){this.ctx=null,this.muted=!1,this.volume=.8,this.gameplay=!1,this.paused=!1,this.camera=null,this.player=null,this.songName=null,this.tempoScale=1,this._pendingSong=null,this._rouletteTimer=0,this._rouletteActive=!1,this._offs=[],this._onGesture=()=>this.unlock(),window.addEventListener("pointerdown",this._onGesture),window.addEventListener("keydown",this._onGesture),window.addEventListener("touchstart",this._onGesture),this._subscribe()}unlock(){if(!this.ctx){let t=window.AudioContext||window.webkitAudioContext;if(!t)return;try{this.ctx=new t}catch(e){console.warn("[audio] no AudioContext",e);return}this._buildGraph()}if(this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{}),this._pendingSong!==null&&this.ctx){let t=this._pendingSong;this._pendingSong=null,this.playMusic(t)}}_buildGraph(){let t=this.ctx;this.master=t.createGain(),this.master.gain.value=this.muted?0:this.volume,this.comp=t.createDynamicsCompressor(),this.comp.threshold.value=-14,this.comp.knee.value=12,this.comp.ratio.value=4,this.comp.attack.value=.004,this.comp.release.value=.2,this.master.connect(this.comp),this.comp.connect(t.destination),this.musicGain=t.createGain(),this.musicGain.gain.value=.42,this.musicGain.connect(this.master),this.sfxGain=t.createGain(),this.sfxGain.gain.value=.9,this.sfxGain.connect(this.master);let e=t.sampleRate*2;this.noiseBuf=t.createBuffer(1,e,t.sampleRate);let n=this.noiseBuf.getChannelData(0);for(let a=0;a<e;a++)n[a]=Math.random()*2-1;this.engGain=t.createGain(),this.engGain.gain.value=0,this.engFilter=t.createBiquadFilter(),this.engFilter.type="lowpass",this.engFilter.frequency.value=400,this.engFilter.Q.value=3,this.engA=t.createOscillator(),this.engA.type="sawtooth",this.engA.frequency.value=60,this.engB=t.createOscillator(),this.engB.type="square",this.engB.frequency.value=60,this.engB.detune.value=14,this.engSub=t.createOscillator(),this.engSub.type="sine",this.engSub.frequency.value=30;let s=t.createGain();s.gain.value=.5;let r=t.createGain();r.gain.value=.28;let o=t.createGain();o.gain.value=.6,this.engA.connect(s),this.engB.connect(r),this.engSub.connect(o),s.connect(this.engFilter),r.connect(this.engFilter),o.connect(this.engFilter),this.engLfo=t.createOscillator(),this.engLfo.frequency.value=18,this.engLfoGain=t.createGain(),this.engLfoGain.gain.value=.25,this.engAm=t.createGain(),this.engAm.gain.value=.75,this.engLfo.connect(this.engLfoGain),this.engLfoGain.connect(this.engAm.gain),this.engFilter.connect(this.engAm),this.engAm.connect(this.engGain),this.engGain.connect(this.sfxGain);for(let a of[this.engA,this.engB,this.engSub,this.engLfo])a.start();this.drSrc=t.createBufferSource(),this.drSrc.buffer=this.noiseBuf,this.drSrc.loop=!0,this.drFilter=t.createBiquadFilter(),this.drFilter.type="bandpass",this.drFilter.frequency.value=1500,this.drFilter.Q.value=6,this.drGain=t.createGain(),this.drGain.gain.value=0,this.drSrc.connect(this.drFilter),this.drFilter.connect(this.drGain),this.drGain.connect(this.sfxGain),this.drSrc.start(),this._step=0,this._nextTime=0,this._sched=setInterval(()=>this._schedule(),25)}_subscribe(){let t=(n,s)=>this._offs.push(Bt.on(n,r=>{if(this.ctx)try{s(r||{})}catch(o){console.warn("[audio]",n,o)}})),e=n=>n&&n.isPlayer;t("race:countdown",()=>this.beep(440,.18,"square",.22)),t("race:go",()=>{this.beep(880,.55,"square",.24),this.beep(1760,.4,"sine",.08)}),t("race:lap",n=>{e(n.kart)&&this.lapChime()}),t("race:finalLap",()=>{this.finalLapJingle(),this.tempoScale=1.12}),t("race:finish",n=>{e(n.kart)&&this.fanfare(n.place)}),t("kart:driftLevel",n=>{e(n.kart)&&n.level>0&&this.sparkTick(n.level)}),t("kart:miniTurbo",n=>{e(n.kart)&&this.whoosh(.3+.15*(n.level||1),1+.2*(n.level||1))}),t("kart:boost",n=>{e(n.kart)&&n.source!=="miniTurbo"&&this.whoosh(.6,1)}),t("kart:hit",n=>{e(n.kart)?this.hitSound(n.kind):this.atPos(n.kart&&n.kart.position,.5,s=>this.hitSound(n.kind,s))}),t("kart:wallBump",n=>{e(n.kart)&&this.thud(Sl(n.intensity??.5,.1,1))}),t("kart:bump",n=>{(e(n.a)||e(n.b))&&this.thud(Sl((n.intensity??.5)*.7,.1,.8),180)}),t("kart:jump",n=>{e(n.kart)&&this.boing()}),t("kart:land",n=>{e(n.kart)&&this.thud(.35,90)}),t("item:pickup",n=>{e(n.kart)&&this.chime()}),t("item:roulette",n=>{e(n.kart)&&(this._rouletteActive=!0,this._rouletteTimer=0,this._rouletteElapsed=0)}),t("item:got",n=>{e(n.kart)&&(this._rouletteActive=!1,this.gotItem())}),t("item:use",n=>{e(n.kart)&&this.throwSound(n.item)}),t("item:hit",n=>{e(n.by)&&!e(n.kart)&&this.beep(1320,.12,"square",.08)}),t("item:explode",n=>{let s=n.kind==="small"||n.radius!=null&&n.radius<3;this.atPos(n.position,s?.35:1,r=>s?this.pop(r):this.explosion(r))}),t("item:lightning",()=>this.zap()),t("ui:move",()=>this.uiClick(0)),t("ui:confirm",()=>this.uiClick(1)),t("ui:back",()=>this.uiClick(2))}setGameplayActive(t){this.gameplay=!!t,t||(this._rouletteActive=!1,this.tempoScale=1)}setPaused(t){this.paused=!!t,this.musicGain&&this.ctx&&this.musicGain.gain.setTargetAtTime(t?.14:.42,this.ctx.currentTime,.1)}toggleMute(){return this.muted=!this.muted,this.master&&this.ctx&&this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.03),this.muted}setVolume(t){this.volume=Sl(t,0,1),this.master&&!this.muted&&(this.master.gain.value=this.volume)}playMusic(t){if(!this.ctx){this._pendingSong=t;return}if(t===this.songName)return;this.songName=t,this.tempoScale=1,this._step=0,this._nextTime=this.ctx.currentTime+.08;let e=this.musicGain.gain,n=this.ctx.currentTime;e.cancelScheduledValues(n),e.setValueAtTime(0,n),e.linearRampToValueAtTime(this.paused?.14:.42,n+.4)}stopMusic(){this.songName=null,this._pendingSong=null}update(t,{player:e,karts:n,camera:s}={}){if(this.player=e||null,this.camera=s||this.camera,!this.ctx)return;let r=this.ctx.currentTime,o=this.gameplay&&!this.paused&&e;if(o){let a=Math.abs(e.speed||0),l=e.boostTimer>0||e.starTimer>0,c=e.shrinkTimer>0?1.5:1,h=(48+a*2.3+(l?22:0))*c;e.airborne&&(h*=1.12),this.engA.frequency.setTargetAtTime(h,r,.06),this.engB.frequency.setTargetAtTime(h*1.005,r,.06),this.engSub.frequency.setTargetAtTime(h*.5,r,.06),this.engLfo.frequency.setTargetAtTime(10+a*.6,r,.1),this.engFilter.frequency.setTargetAtTime(260+a*45+(l?900:0),r,.08),this.engGain.gain.setTargetAtTime(.13+Math.min(a,40)*.0016,r,.1);let u=e.drifting&&a>6&&!e.airborne;this.drGain.gain.setTargetAtTime(u?.06:0,r,u?.04:.08),this.drFilter.frequency.setTargetAtTime(1300+(e.driftLevel||0)*280+Math.sin(r*13)*120,r,.05)}else this.engGain.gain.setTargetAtTime(0,r,.12),this.drGain.gain.setTargetAtTime(0,r,.05);this._rouletteActive&&o&&(this._rouletteTimer-=t,this._rouletteElapsed+=t,this._rouletteTimer<=0&&(this._rouletteTimer=.075,this.beep(1100+Math.random()*500,.03,"square",.05)),this._rouletteElapsed>3&&(this._rouletteActive=!1))}_env(t,e,n,s,r){let o=t.gain;o.setValueAtTime(1e-4,e),o.linearRampToValueAtTime(s,e+n),o.exponentialRampToValueAtTime(1e-4,e+n+r)}_osc(t,e,n,s,r,o,a=.005){let l=this.ctx,c=l.createOscillator();c.type=t,c.frequency.setValueAtTime(e,n);let h=l.createGain();return this._env(h,n,a,r,Math.max(.02,s)),c.connect(h),h.connect(o||this.sfxGain),c.start(n),c.stop(n+a+s+.05),{o:c,g:h}}_noise(t,e,n,s,r,o=1,a){let l=this.ctx,c=l.createBufferSource();c.buffer=this.noiseBuf,c.playbackRate.value=1;let h=l.createBiquadFilter();h.type=s,h.frequency.setValueAtTime(r,t),h.Q.value=o;let u=l.createGain();this._env(u,t,.003,n,e),c.connect(h),h.connect(u),u.connect(a||this.sfxGain);let d=Math.random()*Math.max(0,1.9-e);return c.start(t,d),c.stop(t+e+.05),{s:c,f:h,g:u}}atPos(t,e,n){if(!this.gameplay)return;let s=e;if(t&&this.camera){let r=this.camera.position.distanceTo(t);s=e*Sl(1-r/140,0,1)}s>.03&&n(s)}beep(t,e,n="square",s=.15){this.ctx&&this._osc(n,t,this.ctx.currentTime,e,s)}uiClick(t){let e=this.ctx.currentTime;t===0?this._osc("triangle",880,e,.05,.12):t===1?(this._osc("square",660,e,.06,.09),this._osc("square",990,e+.06,.1,.09)):this._osc("triangle",440,e,.08,.12)}chime(){let t=this.ctx.currentTime;[72,76,79,84].forEach((e,n)=>this._osc("triangle",En(e+12),t+n*.045,.18,.12)),this._osc("sine",En(96),t+.18,.3,.05)}gotItem(){let t=this.ctx.currentTime;this._osc("square",En(84),t,.07,.07),this._osc("square",En(91),t+.07,.16,.07)}sparkTick(t){let e=this.ctx.currentTime,n=[0,76,81,88][t]||88;this._osc("sine",En(n+12),e,.1,.1),this._osc("triangle",En(n+19),e+.04,.12,.06)}whoosh(t=.6,e=1){let n=this.ctx.currentTime,s=this._noise(n,t,.28,"bandpass",400*e,1.2);s.f.frequency.exponentialRampToValueAtTime(3200*e,n+t*.5),s.f.frequency.exponentialRampToValueAtTime(900,n+t),this._osc("sawtooth",120*e,n,t,.06).o.frequency.exponentialRampToValueAtTime(420*e,n+t*.8)}hitSound(t,e=1){let n=this.ctx.currentTime;if(t==="shrink"){this._osc("square",900,n,.5,.1*e).o.frequency.exponentialRampToValueAtTime(200,n+.5);return}let s=this._osc("square",700,n,.6,.12*e);s.o.frequency.exponentialRampToValueAtTime(120,n+.6);let r=this.ctx.createOscillator();r.frequency.value=22;let o=this.ctx.createGain();o.gain.value=60,r.connect(o),o.connect(s.o.frequency),r.start(n),r.stop(n+.7),this._noise(n,.15,.25*e,"lowpass",1800)}thud(t=.5,e=120){let n=this.ctx.currentTime;this._osc("sine",e,n,.18,.35*t).o.frequency.exponentialRampToValueAtTime(40,n+.18),this._noise(n,.08,.18*t,"lowpass",600)}boing(){let t=this.ctx.currentTime;this._osc("triangle",220,t,.25,.1).o.frequency.exponentialRampToValueAtTime(660,t+.2)}throwSound(t){let e=this.ctx.currentTime;if(t==="mushroom"||t==="triple_mushroom")return;if(t==="star"){[72,76,79,84,88,91].forEach((r,o)=>this._osc("square",En(r),e+o*.05,.1,.06));return}if(t==="lightning")return;this._noise(e,.25,.22,"bandpass",2400,2).f.frequency.exponentialRampToValueAtTime(600,e+.25),this._osc("square",500,e,.15,.05).o.frequency.exponentialRampToValueAtTime(1200,e+.15)}explosion(t=1){let e=this.ctx.currentTime;this._noise(e,1.1,.6*t,"lowpass",2400,.7).f.frequency.exponentialRampToValueAtTime(120,e+1),this._osc("sine",110,e,.9,.7*t).o.frequency.exponentialRampToValueAtTime(28,e+.9)}pop(t=1){let e=this.ctx.currentTime;this._noise(e,.18,.4*t,"bandpass",1400,.8),this._osc("square",320,e,.12,.12*t).o.frequency.exponentialRampToValueAtTime(90,e+.12)}zap(){let t=this.ctx.currentTime;for(let s=0;s<5;s++)this._noise(t+s*.05+Math.random()*.03,.08,.3,"highpass",2500+Math.random()*3e3,1);this._osc("sawtooth",1800,t,.8,.12).o.frequency.exponentialRampToValueAtTime(80,t+.8),this._osc("sine",60,t+.05,.9,.4).o.frequency.exponentialRampToValueAtTime(30,t+.9)}lapChime(){let t=this.ctx.currentTime;[79,84,88].forEach((e,n)=>this._osc("square",En(e),t+n*.09,.14,.08)),this._osc("triangle",En(91),t+.27,.4,.1)}finalLapJingle(){let t=this.ctx.currentTime,e=[[72,0],[72,.12],[72,.24],[76,.36],[79,.6],[84,.84]];for(let[n,s]of e)this._osc("square",En(n),t+s,.14,.09),this._osc("triangle",En(n-12),t+s,.14,.08);this._osc("square",En(88),t+1.08,.6,.09),this._osc("triangle",En(76),t+1.08,.6,.08)}fanfare(t=1){let e=this.ctx.currentTime+.05,n=t<=3,s=n?[[72,0,.12],[76,.14,.12],[79,.28,.12],[84,.42,.36],[79,.8,.12],[84,.94,.9]]:[[72,0,.2],[71,.24,.2],[69,.48,.2],[67,.72,.8]];for(let[r,o,a]of s)this._osc("square",En(r),e+o,a,.09),this._osc("triangle",En(r-12),e+o,a,.1),n&&this._osc("sawtooth",En(r+7),e+o,a,.025);n&&this._noise(e+.94,1.2,.08,"highpass",6e3)}_schedule(){if(!this.ctx||!this.songName||this.ctx.state!=="running")return;let t=Xy[this.songName];if(!t)return;let e=this.ctx.currentTime;this._nextTime<e-.2&&(this._nextTime=e+.02);let n=60/(t.bpm*this.tempoScale)/4;for(;this._nextTime<e+.13;){try{this._playStep(t,this._step,this._nextTime,n)}catch{}this._nextTime+=n,this._step=(this._step+1)%(t.bars.length*16)}}_mOsc(t,e,n,s,r,o){let a=this.ctx,l=a.createOscillator();l.type=t,l.frequency.setValueAtTime(En(e),n);let c=a.createGain();c.gain.setValueAtTime(1e-4,n),c.gain.linearRampToValueAtTime(r,n+.008),c.gain.setValueAtTime(r,n+Math.max(.01,s*.6)),c.gain.exponentialRampToValueAtTime(1e-4,n+s);let h=l;if(o){let u=a.createBiquadFilter();u.type="lowpass",u.frequency.value=o,l.connect(u),h=u}return h.connect(c),c.connect(this.musicGain),l.start(n),l.stop(n+s+.05),l}_kick(t,e=.6){let n=this.ctx,s=n.createOscillator();s.type="sine",s.frequency.setValueAtTime(160,t),s.frequency.exponentialRampToValueAtTime(42,t+.12);let r=n.createGain();r.gain.setValueAtTime(e,t),r.gain.exponentialRampToValueAtTime(1e-4,t+.28),s.connect(r),r.connect(this.musicGain),s.start(t),s.stop(t+.3)}_snare(t,e=.3){this._noise(t,.16,e,"highpass",1500,.7,this.musicGain);let n=this.ctx,s=n.createOscillator();s.type="triangle",s.frequency.setValueAtTime(200,t),s.frequency.exponentialRampToValueAtTime(140,t+.08);let r=n.createGain();r.gain.setValueAtTime(e*.8,t),r.gain.exponentialRampToValueAtTime(1e-4,t+.1),s.connect(r),r.connect(this.musicGain),s.start(t),s.stop(t+.12)}_hat(t,e=.08,n=!1){this._noise(t,n?.12:.035,e,"highpass",7500,.8,this.musicGain)}_playStep(t,e,n,s){let r=Math.floor(e/16)%t.bars.length,o=e%16,a=t.bars[r];if(t.style==="race"){o%4===0&&this._kick(n,.55),a.fill&&o===14&&this._kick(n,.4),(o===4||o===12)&&this._snare(n,.26),a.fill&&o>=13&&this._snare(n,.14+(o-13)*.05),o%2===1&&this._hat(n,.035),o%4===2&&this._hat(n,.06,!0),o%2===0&&this._mOsc("sawtooth",a.root+t.bassPattern[o/2],n,s*1.6,.13,900);let l=a.chord,c=[l[0],l[1],l[2],l[0]+12][o%4]+12;this._mOsc("square",c,n,s*.8,.025,3e3);for(let[h,u,d]of a.mel)if(h===o){let f=this._mOsc("square",u,n,s*d*.95,.055,4200);if(d>=3){let p=this.ctx.createOscillator();p.frequency.value=6;let x=this.ctx.createGain();x.gain.value=6,p.connect(x),x.connect(f.detune),p.start(n+s),p.stop(n+s*d)}this._mOsc("triangle",u-12,n,s*d*.9,.03)}}else{if((o===0||o===10)&&this._kick(n,.32),o===8&&this._snare(n,.08),o%2===0&&this._hat(n,o%4===2?.03:.015),o===0){for(let l of a.chord)this._mOsc("triangle",l,n,s*15,.028,1400);this._mOsc("sine",a.root,n,s*6,.16)}if(o===8&&this._mOsc("sine",a.root+7,n,s*6,.12),o%2===0){let l=a.chord,c=[0,1,2,3,2,1,2,3];this._mOsc("sine",l[c[o/2]]+12,n,s*1.8,.035)}for(let[l,c,h]of a.mel)l===o&&(this._mOsc("sine",c,n,s*h,.07),this._mOsc("triangle",c+12,n,s*Math.min(h,2),.015))}}dispose(){for(let t of this._offs)t();this._offs=[],clearInterval(this._sched),window.removeEventListener("pointerdown",this._onGesture),window.removeEventListener("keydown",this._onGesture),window.removeEventListener("touchstart",this._onGesture);try{this.ctx&&this.ctx.close()}catch{}}};var Cu={};ys(Cu,{createTrack:()=>Jy});function je(i,t=!1){let e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,l=new qe,c=0;for(let h=0;h<i.length;++h){let u=i[h],d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0,u=[];for(let d=0;d<i.length;++d){let f=i[d].index;for(let p=0;p<f.count;++p)u.push(f.getX(p)+h);h+=i[d].attributes.position.count}l.setIndex(u)}for(let h in r){let u=op(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){let f=[];for(let x=0;x<o[h].length;++x)f.push(o[h][x][d]);let p=op(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}return l}function op(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){let h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}let o=new t(r),a=new Ie(o,e,n),l=0;for(let c=0;c<i.length;++c){let h=i[c];if(h.isInterleavedBufferAttribute){let u=l/e;for(let d=0,f=h.count;d<f;d++)for(let p=0;p<e;p++){let x=h.getComponent(d,p);a.setComponent(d+u,p,x)}}else o.set(h.array,l);l+=h.count*e}return s!==void 0&&(a.gpuType=s),a}function Ni(i,t){let e=document.createElement("canvas");return e.width=i,e.height=t,[e,e.getContext("2d")]}function Fi(i,{repeat:t=!0,anisotropy:e=8,srgb:n=!0}={}){let s=new jn(i);return t&&(s.wrapS=Xi,s.wrapT=Xi),s.anisotropy=e,n&&(s.colorSpace=Ke),s.generateMipmaps=!0,s.minFilter=as,s}function Tu(i){let t=i>>>0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function wu(i,t,e,n,s,r,o=1,a=2.5){for(let l=0;l<n;l++){i.fillStyle=s[r()*s.length|0];let c=o+r()*(a-o);i.fillRect(r()*t,r()*e,c,c)}}function ap(){let[e,n]=Ni(512,512),s=Tu(11);n.fillStyle="#5b5f68",n.fillRect(0,0,512,512);for(let r=0;r<60;r++){let o=s()*512,a=s()*512,l=20+s()*60,c=n.createRadialGradient(o,a,0,o,a,l),h=s()<.5;c.addColorStop(0,h?"rgba(40,42,48,0.18)":"rgba(120,124,132,0.14)"),c.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=c,n.fillRect(o-l,a-l,l*2,l*2)}wu(n,512,512,9e3,["#4a4e56","#6d717b","#7d818a","#3f424a","#62666f"],s,1,2.2);for(let r of[.3,.7]){let o=n.createLinearGradient(512*(r-.12),0,512*(r+.12),0);o.addColorStop(0,"rgba(30,30,36,0)"),o.addColorStop(.5,"rgba(30,30,36,0.16)"),o.addColorStop(1,"rgba(30,30,36,0)"),n.fillStyle=o,n.fillRect(512*(r-.12),0,512*.24,512)}n.fillStyle="#f4f4f0",n.fillRect(512*.035,0,512*.022,512),n.fillRect(512*(1-.057),0,512*.022,512),n.fillStyle="#ffd54a";for(let r=0;r<512;r+=256)n.fillRect(512*.5-5,r+40,10,150);n.fillStyle="rgba(245,245,240,0.55)";for(let r of[.27,.73])for(let o=0;o<512;o+=256)n.fillRect(512*r-3,o+170,6,70);return Fi(e,{anisotropy:16})}function lp(){let[i,t]=Ni(64,128);t.fillStyle="#e8322f",t.fillRect(0,0,64,64),t.fillStyle="#fbfbf7",t.fillRect(0,64,64,64);let e=t.createLinearGradient(0,0,64,0);return e.addColorStop(0,"rgba(0,0,0,0.25)"),e.addColorStop(.2,"rgba(0,0,0,0)"),e.addColorStop(.8,"rgba(255,255,255,0.1)"),e.addColorStop(1,"rgba(0,0,0,0.2)"),t.fillStyle=e,t.fillRect(0,0,64,128),Fi(i)}function cp(){let[e,n]=Ni(256,256),s=Tu(23);n.fillStyle="#6fbf3f",n.fillRect(0,0,256,256),n.fillStyle="rgba(255,255,255,0.06)",n.fillRect(0,0,256,256/2),wu(n,256,256,5e3,["#5eae34","#7fcf4b","#68b83a","#8ad656","#57a22f"],s,1,3);for(let r=0;r<40;r++)n.fillStyle=["#ffe66b","#ffffff","#ff8fb1"][s()*3|0],n.fillRect(s()*256,s()*256,2,2);return Fi(e)}function hp(){let[e,n]=Ni(256,256),s=Tu(41);return n.fillStyle="#b9bcc2",n.fillRect(0,0,256,256),wu(n,256,256,4e3,["#a8abb2","#c7cad0","#9fa3aa"],s,1,2),n.strokeStyle="rgba(80,80,90,0.35)",n.lineWidth=2,n.beginPath(),n.moveTo(0,1),n.lineTo(256,1),n.stroke(),Fi(e)}function up(){let[e,n]=Ni(1024,128),s=[{bg:"#1e6fe8",fg:"#ffffff",text:"TURBO"},{bg:"#ffd21f",fg:"#e8322f",text:"KART"},{bg:"#e8322f",fg:"#ffffff",text:"RALLY"},{bg:"#ffffff",fg:"#1e6fe8",text:"\u2605 GO! \u2605"}],r=1024/s.length;return s.forEach((o,a)=>{n.fillStyle=o.bg,n.fillRect(a*r,0,r,128),n.fillStyle="rgba(255,255,255,0.18)",n.fillRect(a*r,0,r,18),n.fillStyle="rgba(0,0,0,0.18)",n.fillRect(a*r,110,r,18),n.fillStyle=o.fg,n.font='bold 72px "Lilita One", "Arial Black", Impact, sans-serif',n.textAlign="center",n.textBaseline="middle",n.fillText(o.text,a*r+r/2,128/2+4),n.fillStyle="rgba(0,0,0,0.35)",n.fillRect(a*r,0,4,128)}),Fi(e)}function fp(){let[e,n]=Ni(256,64);n.fillStyle="#f5f7fa",n.fillRect(0,0,256,64),n.fillStyle="#2563d9";for(let s=-64;s<320;s+=64)n.beginPath(),n.moveTo(s,64),n.lineTo(s+32,64),n.lineTo(s+32+64,0),n.lineTo(s+64,0),n.closePath(),n.fill();return n.fillStyle="#c9ced6",n.fillRect(0,0,256,6),n.fillRect(0,58,256,6),Fi(e)}function dp(){let[e,n]=Ni(128,256),s=n.createLinearGradient(0,0,128,0);s.addColorStop(0,"#ff7a00"),s.addColorStop(.5,"#ffb300"),s.addColorStop(1,"#ff7a00"),n.fillStyle=s,n.fillRect(0,0,128,256);for(let r=0;r<2;r++){let o=r*128;n.fillStyle="#fff6c2",n.beginPath(),n.moveTo(14,o+96),n.lineTo(64,o+30),n.lineTo(114,o+96),n.lineTo(114,o+124),n.lineTo(64,o+58),n.lineTo(14,o+124),n.closePath(),n.fill()}return n.strokeStyle="#7a2a00",n.lineWidth=8,n.strokeRect(4,-10,120,276),Fi(e)}function pp(){let[e,n]=Ni(256,256);for(let s=0;s<8;s++)n.fillStyle=s%2?"#1e88e5":"#e3f2fd",n.fillRect(s*32,0,32,256);return n.fillStyle="#ffd21f",n.strokeStyle="#1a1a2e",n.lineWidth=6,n.beginPath(),n.moveTo(128,20),n.lineTo(210,120),n.lineTo(160,120),n.lineTo(160,236),n.lineTo(96,236),n.lineTo(96,120),n.lineTo(46,120),n.closePath(),n.fill(),n.stroke(),Fi(e,{repeat:!1})}function Au(i=8,t=2){let[n,s]=Ni(i*32,t*32);for(let o=0;o<i;o++)for(let a=0;a<t;a++)s.fillStyle=(o+a)%2?"#111318":"#fafafa",s.fillRect(o*32,a*32,32,32);let r=Fi(n);return r.magFilter=Fn,r}function mp(i){let[n,s]=Ni(1024,128),r=s.createLinearGradient(0,0,0,128);r.addColorStop(0,"#ff4d3d"),r.addColorStop(1,"#c81e1e"),s.fillStyle=r,s.fillRect(0,0,1024,128);let o=16;for(let a of[0,928])for(let l=0;l<6;l++)for(let c=0;c<8;c++)s.fillStyle=(l+c)%2?"#111":"#fff",s.fillRect(a+l*o,c*o,o,o);return s.fillStyle="#ffd21f",s.fillRect(96,0,832,8),s.fillRect(96,120,832,8),s.font='bold 78px "Lilita One", "Arial Black", Impact, sans-serif',s.textAlign="center",s.textBaseline="middle",s.lineWidth=10,s.strokeStyle="#7a0d0d",s.strokeText(i,1024/2,128/2+5),s.fillStyle="#ffffff",s.fillText(i,1024/2,128/2+5),Fi(n,{repeat:!1})}function gp(i="#ffffff",t="#e8322f",e=8){let[n,s]=Ni(256,16);for(let r=0;r<e;r++)s.fillStyle=r%2?t:i,s.fillRect(r*256/e,0,256/e,16);return Fi(n)}var Mi=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)},Jr=(i,t,e)=>i+(t-i)*e;function Tl(i,t){let e=Math.imul(i|0,374761393)^Math.imul(t|0,668265263);return e=Math.imul(e^e>>>13,1274126177),((e^e>>>16)>>>0)/4294967296}function Yy(i,t){let e=Math.floor(i),n=Math.floor(t),s=i-e,r=t-n,o=s*s*(3-2*s),a=r*r*(3-2*r),l=Tl(e,n),c=Tl(e+1,n),h=Tl(e,n+1),u=Tl(e+1,n+1);return Jr(Jr(l,c,o),Jr(h,u,o),a)}function Us(i,t,e=4){let n=0,s=.5,r=1,o=0;for(let a=0;a<e;a++)n+=s*Yy(i*r+a*17.3,t*r-a*9.1),o+=s,r*=2.03,s*=.5;return n/o}function $r(i){let t=i>>>0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function ei(i,t){let e=i.index?i.toNonIndexed():i,n=e.attributes.position.count,s=new Float32Array(n*3),r=new ft(t);for(let o=0;o<n;o++)s[o*3]=r.r,s[o*3+1]=r.g,s[o*3+2]=r.b;return e.setAttribute("color",new Ie(s,3)),e!==i&&i.dispose(),e}var De=i=>(i.deleteAttribute("uv"),i);function xp(i,t,e,n){let s=[],r=y=>(s.push(y),y),o={uTime:{value:0}},a=n.waterLevel,l=new P(.32,.78,-.54).normalize(),c={top:new ft(3112928),horizon:new ft(13625595),bottom:new ft(10275306),sun:new ft(16773839)},h=(n.bounds.minX+n.bounds.maxX)/2,u=(n.bounds.minZ+n.bounds.maxZ)/2,d=760,f=r(new Be({uniforms:{uTop:{value:c.top},uHorizon:{value:c.horizon},uBottom:{value:c.bottom},uSunDir:{value:l},uSunColor:{value:c.sun}},vertexShader:`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
      }`,fragmentShader:`
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; uniform vec3 uSunDir; uniform vec3 uSunColor;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float y = d.y;
        vec3 col = y > 0.0 ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, y), 0.75)) : mix(uHorizon, uBottom, smoothstep(0.0, -0.15, y));
        float sd = max(dot(d, uSunDir), 0.0);
        col += uSunColor * (smoothstep(0.9993, 0.9996, sd) * 4.0 + pow(sd, 60.0) * 0.45 + pow(sd, 6.0) * 0.12);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,side:vn,depthWrite:!1,depthTest:!1,toneMapped:!1,fog:!1})),p=r(new ti(900,48,24)),x=()=>{let y=new $t(p,f);return y.frustumCulled=!1,y.renderOrder=-1e3,y.name="sky",y.onBeforeRender=(U,z,V)=>{y.position.copy(V.position),y.updateMatrixWorld()},y};e.add(x());let g=null,m=i.environment,M=i.background,_=i.fog;try{if(t&&t.isWebGLRenderer){let y=new Hr(t),U=new js;U.add(x());let z=new $t(new Qn(400,24).rotateX(-Math.PI/2),new Sn({color:6134340}));z.position.y=-20,U.add(z),g=y.fromScene(U,.02,.1,2e3),z.geometry.dispose(),z.material.dispose(),y.dispose(),i.environment=g.texture,"environmentIntensity"in i&&(i.environmentIntensity=.55)}}catch{g=null}i.background=c.horizon.clone(),i.fog=new qa(c.horizon.clone(),380,1550);let v=new rl(13625599,8036442,1.25);i.add(v);let w=new ol(16773336,2.8);w.castShadow=!0,w.shadow.mapSize.set(2048,2048);let R=75;Object.assign(w.shadow.camera,{left:-R,right:R,top:R,bottom:-R,near:1,far:600}),w.shadow.camera.updateProjectionMatrix(),w.shadow.bias=-4e-4,w.shadow.normalBias=.04,i.add(w),i.add(w.target);let T=R*2/2048;function C(y){if(!y||!isFinite(y.x))return;let U=Math.round(y.x/T)*T,z=Math.round(y.z/T)*T;w.target.position.set(U,y.y||0,z),w.position.set(U,y.y||0,z).addScaledVector(l,250),w.target.updateMatrixWorld()}C(n.startPositions[0]?.position||new P);function b(y,U){let z=y-h,V=U-u,B=Math.hypot(z,V)/d,vt=1.2+4.5*Us(y*.0075,U*.0075)+9*Math.pow(Us(y*.004-20,U*.004+13,3),2.2),lt=Math.atan2(V,z),Mt=Mi(.58,.8,B)*(1-Mi(.86,.95,B))*(.45+.55*Math.max(0,Math.sin(lt*3+1.3)));vt+=Mt*(14+34*Us(y*.012+3,U*.012-7)),vt=Jr(vt,-16,Mi(.9,1.06,B));let Wt=Math.hypot(y-n.lake.x,U-n.lake.z);return vt=Jr(vt,-9-3*Us(y*.03,U*.03),1-Mi(n.lake.r*.72,n.lake.r+14,Wt)),vt}let E={w:0,y:0,d:0,wall:0,i:-1};function D(y,U){let z=n.nearest(y,U,!0);if(E.i=z.i,z.i<0)return E.w=0,E.d=1e9,E;let V=z.i,B=Math.sqrt(z.d2),lt=(y-n.px[V])*n.rx[V]+(U-n.pz[V])*n.rz[V]>=0?n.wallR[V]:n.wallL[V];return E.d=B,E.wall=lt,E.y=n.py[V],E.w=(1-Mi(lt+4,lt+58,B))*(1-n.bridge[V]),E}function Y(y,U){let z=b(y,U),V=D(y,U);return V.w>0?Jr(z,V.y-.6,V.w):z}let H=1900,X=280,Z=r(new zn(H,H,X,X).rotateX(-Math.PI/2));Z.translate(h,0,u);let O=Z.attributes.position,ct=new Float32Array(O.count*3),K=new Float32Array(O.count),W=X+1,j=new Uint8Array(W*W*4);for(let y=0;y<O.count;y++){let U=O.getX(y),z=O.getZ(y),V=Y(U,z);O.setY(y,V),K[y]=E.w}Z.computeVertexNormals();{let y=new ft,U=new ft(13480567),z=new ft(15850656),V=new ft(5811511),B=new ft(9425746),vt=new ft(4164142),lt=new ft(10261896),Mt=new ft(9416335),Wt=Z.attributes.normal;for(let st=0;st<O.count;st++){let Q=O.getX(st),Lt=O.getY(st),Dt=O.getZ(st),ht=Us(Q*.02,Dt*.02,3);y.copy(V).lerp(B,Mi(.35,.7,ht)),y.lerp(vt,Mi(14,30,Lt)*.8),y.lerp(B,K[st]*.35);let Kt=1-Wt.getY(st);y.lerp(lt,Mi(.22,.4,Kt));let Ft=(1-Mi(a+1.6,a+3.2,Lt))*(1-Mi(.02,.2,K[st]));y.lerp(z,Ft),y.lerp(U,(1-Mi(a-.5,a+.6,Lt))*(1-K[st])),y.lerp(Mt,Mi(a-1,a-8,Lt)*.5),ct[st*3]=y.r,ct[st*3+1]=y.g,ct[st*3+2]=y.b}for(let st=0;st<O.count;st++){let Q=st%W,Lt=Math.floor(st/W),Dt=O.getX(st),ht=O.getZ(st),Kt=Q,Ft=Math.round((ht-(u-H/2))/H*X),Xt=Math.min(1,Math.max(0,(a-O.getY(st))/9)),N=(Ft*W+Kt)*4;j[N]=Xt*255,j[N+1]=0,j[N+2]=0,j[N+3]=255}}Z.setAttribute("color",new Ie(ct,3));let wt=(()=>{let y=document.createElement("canvas");y.width=y.height=256;let U=y.getContext("2d");U.fillStyle="#e8e8e8",U.fillRect(0,0,256,256);let z=$r(7);for(let B=0;B<7e3;B++)U.fillStyle=["#d2d2d2","#f6f6f6","#dcdcdc","#c4c4c4"][z()*4|0],U.fillRect(z()*256,z()*256,1+z()*2,1+z()*2.5);let V=new jn(y);return V.wrapS=V.wrapT=Xi,V.anisotropy=8,V.colorSpace=Ke,V.repeat.set(H/9,H/9),r(V)})(),Yt=r(new Gn({vertexColors:!0,map:wt})),te=new $t(Z,Yt);te.receiveShadow=!0,te.name="terrain",e.add(te);let rt=r(new wo(j,W,W,ai));rt.magFilter=oi,rt.minFilter=oi,rt.needsUpdate=!0;let mt=r(new Be({uniforms:Zi.merge([Ot.fog,{uTime:{value:0},uSunDir:{value:l.clone()},uDeep:{value:new ft(1011635)},uShallow:{value:new ft(4183760)},uSky:{value:new ft(12904191)},uFoam:{value:new ft(16777215)},uDepth:{value:null},uBounds:{value:new P(h-H/2,u-H/2,H)}}]),vertexShader:`
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:`
      uniform float uTime; uniform vec3 uSunDir; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uFoam;
      uniform sampler2D uDepth; uniform vec3 uBounds;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      vec2 waveGrad(vec2 p, float t) {
        vec2 g = vec2(0.0);
        vec2 d1 = normalize(vec2(0.7, 0.4)), d2 = normalize(vec2(-0.3, 0.9)), d3 = normalize(vec2(0.9, -0.5)), d4 = normalize(vec2(-0.8, -0.3));
        g += d1 * cos(dot(p, d1) * 0.11 + t * 1.3) * 0.22;
        g += d2 * cos(dot(p, d2) * 0.19 + t * 1.7) * 0.16;
        g += d3 * cos(dot(p, d3) * 0.37 + t * 2.3) * 0.10;
        g += d4 * cos(dot(p, d4) * 0.61 + t * 2.9) * 0.07;
        float e = 0.35;
        vec2 q = p * 0.35 + vec2(t * 0.4, t * 0.25);
        float n0 = vn(q), nx = vn(q + vec2(e, 0.0)), nz = vn(q + vec2(0.0, e));
        g += vec2(nx - n0, nz - n0) / e * 0.18;
        return g;
      }
      void main() {
        vec2 p = vWorld.xz;
        vec2 g = waveGrad(p, uTime);
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        vec2 duv = (p - uBounds.xy) / uBounds.z;
        float depth = 1.0;
        if (duv.x > 0.0 && duv.x < 1.0 && duv.y > 0.0 && duv.y < 1.0) depth = texture2D(uDepth, duv).r;
        vec3 col = mix(uShallow, uDeep, smoothstep(0.02, 0.55, depth));
        col = mix(col, uSky, clamp(fres * 0.75, 0.0, 0.75));
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(n, H), 0.0), 260.0) * 3.0;
        float sparkle = step(0.985, vn(p * 1.7 + uTime * 0.8)) * pow(max(dot(n, H), 0.0), 20.0) * 1.5;
        float foamBand = smoothstep(0.1, 0.0, depth);
        float foamWave = 0.55 + 0.45 * sin(depth * 70.0 - uTime * 2.2 + vn(p * 0.25) * 6.0);
        float foam = clamp(foamBand * foamWave + smoothstep(0.03, 0.0, depth), 0.0, 1.0) * step(0.001, depth + 0.001);
        col = mix(col, uFoam, foam * 0.9);
        col += (spec + sparkle) * vec3(1.0, 0.96, 0.85);
        float alpha = mix(0.62, 0.96, smoothstep(0.0, 0.35, depth));
        alpha = max(alpha, foam);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,transparent:!0,fog:!0,depthWrite:!0}));mt.uniforms.uDepth.value=rt;let It=r(new zn(9e3,9e3,1,1).rotateX(-Math.PI/2)),dt=new $t(It,mt);dt.position.set(h,a,u),dt.name="water",dt.renderOrder=1,e.add(dt);{let y=$r(99),U=[],z=c.horizon.clone(),V=new ft(5214021),B=new ft(9146268),vt=new ft(16185855),lt=22;for(let st=0;st<lt;st++){let Q=st/lt*Math.PI*2+y()*.2,Lt=1080+y()*380,Dt=140+y()*170,ht=170+y()*260,Kt=new on(Dt,ht,11,6).toNonIndexed(),Ft=Kt.attributes.position,Xt=y()*100,N=new Float32Array(Ft.count*3),Tt=new ft;for(let J=0;J<Ft.count;J++){let nt=Ft.getX(J),Rt=Ft.getY(J),Ct=Ft.getZ(J),ne=(Rt+ht/2)/ht,Se=Math.atan2(Ct,nt),ze=Us(Math.cos(Se)*2+Xt,Math.sin(Se)*2+ne*3,3),le=1+(ze-.5)*.7*(1-ne);nt*=le,Ct*=le,Rt+=(ze-.5)*ht*.12*(1-ne)*ne*4,Ft.setXYZ(J,nt,Rt,Ct)}for(let J=0;J<Ft.count;J+=3){let Rt=((Ft.getY(J)+Ft.getY(J+1)+Ft.getY(J+2))/3+ht/2)/ht+(y()-.5)*.08;Tt.copy(Rt<.45?V:Rt<.74?B:vt),Rt>=.45&&Rt<.74&&Tt.lerp(V,(.74-Rt)*1.2),Tt.lerp(z,.3+.15*(Lt-1080)/380);for(let Ct=0;Ct<3;Ct++)N[(J+Ct)*3]=Tt.r,N[(J+Ct)*3+1]=Tt.g,N[(J+Ct)*3+2]=Tt.b}Kt.setAttribute("color",new Ie(N,3)),Kt.deleteAttribute("uv"),Kt.computeVertexNormals(),Kt.translate(h+Math.cos(Q)*Lt,ht/2-25,u+Math.sin(Q)*Lt),U.push(Kt)}let Mt=r(je(U));U.forEach(st=>st.dispose());let Wt=new $t(Mt,r(new Gn({vertexColors:!0,flatShading:!0,fog:!1})));Wt.name="mountains",e.add(Wt)}let zt=new pe;zt.position.set(h,0,u),e.add(zt);{let y=$r(5),U=[];for(let Q=0;Q<7;Q++){let Lt=7+y()*7,Dt=new Hn(Lt,1);Dt.scale(1,.72,1),Dt.translate((Q-3)*7+y()*4,(3-Math.abs(Q-3))*2.5+y()*3,y()*10-5),U.push(De(Dt))}let z=r(je(U));U.forEach(Q=>Q.dispose());let V=r(new Gn({color:16777215,emissive:10135739,flatShading:!0,fog:!1})),B=34,vt=new Bn(z,V,B),lt=new ue,Mt=new yn,Wt=new P,st=new P;for(let Q=0;Q<B;Q++){let Lt=y()*Math.PI*2,Dt=250+y()*800;st.set(Math.cos(Lt)*Dt,190+y()*160,Math.sin(Lt)*Dt),Mt.setFromAxisAngle(new P(0,1,0),y()*Math.PI);let ht=1.2+y()*2.2;Wt.set(ht,ht*(.8+y()*.4),ht),vt.setMatrixAt(Q,lt.compose(st,Mt,Wt))}vt.frustumCulled=!1,zt.add(vt)}let ie=[],Vt=(y,U,z,V)=>{for(let B of ie)if((B.i0<=B.i1?y>=B.i0&&y<=B.i1:y>=B.i0||y<=B.i1)&&Math.sign(U)===B.side&&z<V+B.depth)return!0;return!1};function oe(y,U,z){let V=n.nearest(y,U,!0);if(V.i<0)return{ok:!0,d:1e9,i:-1};let B=V.i,vt=Math.sqrt(V.d2),lt=(y-n.px[B])*n.rx[B]+(U-n.pz[B])*n.rz[B],Mt=lt>=0?n.wallR[B]:n.wallL[B];return vt<Mt+z?{ok:!1}:Vt(B,lt,vt,Mt)?{ok:!1}:{ok:!0,d:vt-Mt,i:B}}let at=[],St=(y,U)=>(y.onBeforeCompile=z=>{z.uniforms.uTime=o.uTime,z.vertexShader=`uniform float uTime;
`+z.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
`+U)},at.push(y),y);{let y=$r(123),U=nt=>Math.round(nt/n.ds),z=[{from:-150,to:70,side:1,tiers:8},{from:-70,to:45,side:-1,tiers:6}],V=[],B=[],vt=[1994728,16250871,15217199,16765471],lt=10;for(let nt of z){let Rt=(U(nt.from)%n.N+n.N)%n.N,Ct=(U(nt.to)%n.N+n.N)%n.N,ne=4+nt.tiers*1.6+4;ie.push({i0:Rt,i1:Ct,side:nt.side,depth:ne});let Se=U(lt),ze=U(nt.to-nt.from);for(let le=0;le<=ze-Se;le+=Se){let He=(Rt+le+Math.floor(Se/2))%n.N,Mn=nt.side>0?n.wallR[He]:n.wallL[He],pi=new P(n.px[He],n.py[He],n.pz[He]),wn=new P(n.rx[He],0,n.rz[He]).multiplyScalar(nt.side),Pn=Math.atan2(wn.x,wn.z),un=(ae,de,Ge,fn)=>{ae.rotateY(Pn);let dn=wn.clone().multiplyScalar(Mn+3+fn),mi=new P(-wn.z,0,wn.x).multiplyScalar(de);return ae.translate(pi.x+dn.x+mi.x,pi.y+Ge,pi.z+dn.z+mi.z),ae};V.push(un(ei(De(new Oe(lt+.05,4,.5)),14342095),0,-1,0));for(let ae=0;ae<nt.tiers;ae++){let de=1+ae*.85;V.push(un(ei(De(new Oe(lt+.05,de+3,1.6)),vt[(ae+(le/Se|0))%4]),0,(de-3)/2,.5+ae*1.6+.8));for(let Ge=0;Ge<6;Ge++)y()<.12||B.push({p:pi.clone().addScaledVector(wn,Mn+3+.5+ae*1.6+.8+(y()-.5)*.3).addScaledVector(new P(-wn.z,0,wn.x),(Ge-2.5)*(lt/6)+(y()-.5)*.6).setY(pi.y+de),rot:Pn+Math.PI})}let Kn=.5+nt.tiers*1.6+.3,qt=1+nt.tiers*.85+4.2;V.push(un(ei(De(new Oe(lt+.05,qt+3,.6)),13617856),0,(qt-3)/2,Kn));let Me=ei(De(new Oe(lt+.1,.4,nt.tiers*1.6+3)),(le/Se|0)%2?15217199:16777215);Me.rotateX(-.08),V.push(un(Me,0,qt,Kn-(nt.tiers*1.6+3)/2+.3)),V.push(un(ei(De(new Te(.18,.18,qt-1,6)),10133672),-lt/2+.3,(qt-1)/2+1,.5))}}let Mt=r(je(V));V.forEach(nt=>nt.dispose());let Wt=new $t(Mt,r(new Gn({vertexColors:!0})));Wt.castShadow=!0,Wt.receiveShadow=!0,Wt.name="grandstands",e.add(Wt);let st=r(new Te(.28,.36,.95,6,1,!0).translate(0,.55,0)),Q=r(new ti(.27,6,4).translate(0,1.28,0)),Lt=`
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 1.37 + instanceMatrix[3].z * 0.71;
        float jumper = step(0.45, fract(ph * 0.173));
        transformed.y += jumper * max(0.0, sin(uTime * (7.0 + fract(ph) * 3.0) + ph)) * 0.38;
      #endif`,Dt=r(St(new Gn,Lt)),ht=r(St(new Gn,Lt)),Kt=new Bn(st,Dt,B.length),Ft=new Bn(Q,ht,B.length),Xt=[15022389,4431943,2001125,16635957,9315498,16740419,44225,15753874,16777215],N=[16765606,15843467,13011546,9263675,16769213],Tt=new ue,J=new ft;B.forEach((nt,Rt)=>{Tt.makeRotationY(nt.rot).setPosition(nt.p),Kt.setMatrixAt(Rt,Tt),Ft.setMatrixAt(Rt,Tt),Kt.setColorAt(Rt,J.setHex(Xt[y()*Xt.length|0])),Ft.setColorAt(Rt,J.setHex(N[y()*N.length|0]))}),e.add(Kt,Ft)}let L=[];{let y=Math.round(55/n.ds);for(let Q=0;Q<n.N;Q+=y){if(n.bridge[Q]>.2)continue;let Lt=n.kS[Q]>0?1:-1,Dt=Lt>0?n.wallR[Q]:n.wallL[Q],ht=Lt*(Dt+2.2),Kt=n.px[Q]+n.rx[Q]*ht,Ft=n.pz[Q]+n.rz[Q]*ht;oe(Kt,Ft,1.5).ok&&L.push({x:Kt,y:n.py[Q]-.5,z:Ft,rot:n.head[Q]+Math.PI/2})}for(let Q of ie){let Lt=(Q.i1-Q.i0+n.N)%n.N;for(let Dt=0;Dt<=Lt;Dt+=Math.round(12/n.ds)){let ht=(Q.i0+Dt)%n.N,Kt=Q.side>0?n.wallR[ht]:n.wallL[ht],Ft=Q.side*(Kt+Q.depth-4.8);L.push({x:n.px[ht]+n.rx[ht]*Ft,y:n.py[ht]+1+8*.85+3.2,z:n.pz[ht]+n.rz[ht]*Ft,rot:n.head[ht]+Math.PI/2,short:!0})}}let U=r(new Te(.1,.13,8,6).translate(0,4,0)),z=r(new Gn({color:15330543})),V=r(new zn(3.2,1.9,12,4).translate(1.6,7,0)),B=r(St(new Gn({side:$e}),`
      #ifdef USE_INSTANCING
        float fph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23;
        float fw = clamp(position.x / 3.2, 0.0, 1.0);
        transformed.z += sin(uTime * 6.0 - position.x * 1.7 + fph) * 0.42 * fw;
        transformed.y += sin(uTime * 3.7 - position.x * 1.2 + fph) * 0.12 * fw;
      #endif`)),vt=new Bn(U,z,L.length),lt=new Bn(V,B,L.length),Mt=[15217199,16765471,1994728,4431943,16740419,15753874,16777215],Wt=new ue,st=new ft;L.forEach((Q,Lt)=>{let Dt=Q.short?.6:1;Wt.makeRotationY(Q.rot).scale(new P(1,Dt,1)).setPosition(Q.x,Q.y,Q.z),vt.setMatrixAt(Lt,Wt);let ht=new ue().makeRotationY(Q.rot).setPosition(Q.x,Q.y-(1-Dt)*7,Q.z);lt.setMatrixAt(Lt,ht),lt.setColorAt(Lt,st.setHex(Mt[Lt%Mt.length]))}),vt.castShadow=!0,e.add(vt,lt)}let Zt=new ue,xt=new yn,Ut=new P,Pt=new P,ee=new P(0,1,0);function Et(y,U,z,{cast:V=!0,colors:B=null}={}){let vt=new Bn(y,U,Math.max(1,z.length));return z.forEach((lt,Mt)=>{xt.setFromAxisAngle(ee,lt.r),lt.tilt&&xt.multiply(new yn().setFromEuler(new bn(lt.tilt,0,lt.tilt2||0))),Ut.set(lt.s*(lt.sx||1),lt.s*(lt.sy||1),lt.s*(lt.sz||1)),vt.setMatrixAt(Mt,Zt.compose(Pt.set(lt.x,lt.y,lt.z),xt,Ut)),B&&vt.setColorAt(Mt,B(lt,Mt))}),vt.count=z.length,vt.castShadow=V,vt.receiveShadow=!0,e.add(vt),vt}{let y=$r(2024),U=[],z=[],V=[],B=[],vt=[],lt=[],Mt=[],Wt=d*.93,st=0;for(;(U.length<700||z.length<420||V.length<110)&&st++<9e4;){let qt=y()*Math.PI*2,Me=Math.sqrt(y())*Wt,ae=h+Math.cos(qt)*Me,de=u+Math.sin(qt)*Me,Ge=b(ae,de);if(Ge<a+.3||!oe(ae,de,6).ok)continue;let dn=Y(ae,de);if(dn<a+.3)continue;let mi=Ge<a+3.2,Ln=Us(ae*.008+11,de*.008-4,3);if(mi){V.length<110&&y()<.8&&V.push({x:ae,y:dn-.3,z:de,r:y()*6.28,s:1+y()*.45,tilt:(y()-.5)*.3,tilt2:(y()-.5)*.3});continue}Ln<.42&&y()<.85||(dn>12||Ln>.62&&y()<.6?z.length<420&&z.push({x:ae,y:dn-.3,z:de,r:y()*6.28,s:1.1+y()*.9}):U.length<700&&U.push({x:ae,y:dn-.3,z:de,r:y()*6.28,s:1+y()*.7,hue:y()}))}for(let qt=0;qt<n.N;qt+=Math.round(22/n.ds))if(Math.hypot(n.px[qt]-n.lake.x,n.pz[qt]-n.lake.z)<n.lake.r+90)for(let ae of[1,-1]){let de=ae*((ae>0?n.wallR[qt]:n.wallL[qt])+7+y()*5),Ge=n.px[qt]+n.rx[qt]*de,fn=n.pz[qt]+n.rz[qt]*de;if(!oe(Ge,fn,5).ok)continue;let dn=Y(Ge,fn);dn<a+.3||V.push({x:Ge,y:dn-.3,z:fn,r:y()*6.28,s:.9+y()*.3,tilt:(y()-.5)*.3,tilt2:(y()-.5)*.3})}for(st=0;(B.length<160||vt.length<2600||lt.length<3200||Mt.length<260)&&st++<9e4;){let qt=y()*Math.PI*2,Me=Math.sqrt(y())*Wt,ae=h+Math.cos(qt)*Me,de=u+Math.sin(qt)*Me,Ge=oe(ae,de,1.2);if(!Ge.ok)continue;let fn=Y(ae,de);if(fn<a-.2)continue;let dn=Ge.d<70;if(B.length<160&&y()<.05){let Ln=.8+y()*y()*4;B.push({x:ae,y:fn-Ln*.25,z:de,r:y()*6.28,s:Ln,sx:.8+y()*.6,sy:.55+y()*.5,sz:.8+y()*.6,tilt:y()*.4});continue}if(fn<a+2.5)continue;let mi=Us(ae*.03-3,de*.03+8,2);if(vt.length<2600&&mi>.52&&(dn||y()<.3))for(let Ln=0;Ln<5;Ln++)vt.push({x:ae+(y()-.5)*3,y:fn+.12,z:de+(y()-.5)*3,r:y()*6.28,s:.7+y()*.6,c:(mi*37+Ln*.1)%1});else lt.length<3200&&(dn||y()<.25)?lt.push({x:ae,y:fn-.05,z:de,r:y()*6.28,s:.7+y()*.8}):Mt.length<260&&y()<.3&&Mt.push({x:ae,y:fn-.2,z:de,r:y()*6.28,s:.8+y()*.9,sy:.7})}let Q=qt=>r(new Gn({flatShading:!0,...qt})),Lt=r(De(new Te(.32,.5,3.4,6).translate(0,1.7,0))),Dt=[De(new Hn(2.6,0).translate(0,4.6,0)),De(new Hn(1.9,0).translate(1.3,4,.6)),De(new Hn(1.7,0).translate(-1.1,4.2,-.8)),De(new Hn(1.5,0).translate(.2,6.1,.2))],ht=r(je(Dt));Dt.forEach(qt=>qt.dispose());let Kt=Q({color:9067062}),Ft=Q({color:16777215}),Xt=[6075192,7783490,4890161,9425231,7061309,10868314],N=new ft,Tt=[...U];Et(Lt,Kt,Tt),Et(ht,Ft,U,{colors:qt=>N.setHex(Xt[qt.hue*Xt.length|0])});let J=r(De(new Te(.25,.4,2.2,5).translate(0,1.1,0))),nt=[De(new on(2.8,3.6,7).translate(0,3.4,0)),De(new on(2.2,3.2,7).translate(0,5.2,0)),De(new on(1.5,2.8,7).translate(0,6.9,0))],Rt=r(je(nt));nt.forEach(qt=>qt.dispose());let Ct=[3112250,3837764,2649652,4497484];Et(J,Kt,z),Et(Rt,Ft,z,{colors:(qt,Me)=>N.setHex(Ct[Me%Ct.length])});let ne=[];for(let qt=0;qt<6;qt++){let Me=De(new Te(.3-qt*.02,.36-qt*.02,1.35,6));Me.translate(qt*qt*.035,.65+qt*1.25,0),ne.push(Me)}let Se=r(je(ne));ne.forEach(qt=>qt.dispose());let ze=25*.035,le=.65+5*1.25+.6,He=[];for(let qt=0;qt<8;qt++){let Me=De(new Oe(3.8,.08,.9,4,1,1)),ae=Me.attributes.position;for(let de=0;de<ae.count;de++){let Ge=ae.getX(de)+1.9;ae.setX(de,Ge),ae.setY(de,ae.getY(de)-.09*Ge*Ge),ae.setZ(de,ae.getZ(de)*(1-Ge/4.5))}Me.rotateY(qt/8*Math.PI*2+qt%2*.2),Me.translate(ze,le,0),He.push(Me.toNonIndexed()),Me.dispose()}He.push(De(new Hn(.45,0).translate(ze,le-.3,0)));let Mn=r(je(He));He.forEach(qt=>qt.dispose()),Mn.computeVertexNormals(),Et(Se,Q({color:11042895}),V),Et(Mn,r(new Gn({color:16777215,side:$e})),V,{colors:(qt,Me)=>N.setHex([4170573,5419866,3511367][Me%3])});let pi=r(De(new Hn(1.3,0)));Et(pi,Ft,Mt,{colors:(qt,Me)=>N.setHex(Xt[Me*7%Xt.length]).multiplyScalar(.85)});let wn=r(De(new tl(1,0)));Et(wn,Q({color:16777215}),B,{colors:(qt,Me)=>N.setHex([10131085,11775651,8749434,10985879][Me%4])});let Pn=r(De(new el(.26,0).scale(1,.6,1))),un=[16732013,16767050,16777215,16747224,11566335,16751164];Et(Pn,Q({color:16777215}),vt,{cast:!1,colors:qt=>N.setHex(un[qt.c*un.length|0])});let Kn=r(De(new on(.28,1,4).translate(0,.45,0)));Et(Kn,Q({color:16777215}),lt,{cast:!1,colors:(qt,Me)=>N.setHex([5217843,6731838,4164139][Me%3])})}let I=[];{let y=new pt(n.lake.x-h,n.lake.z-u).normalize(),U=h,z=u;for(let Xt=d*.6;Xt<d*1.1;Xt+=4){let N=h+y.x*Xt,Tt=u+y.y*Xt;if(b(N,Tt)<a+1.5)break;U=N,z=Tt}let V=b(U,z),B=[];B.push(ei(De(new Te(6,8,10,9).translate(0,V-4,0)),9407104));for(let Xt=0;Xt<6;Xt++)B.push(ei(De(new Te(2.6-Xt*.18,2.8-Xt*.18,3.2,14).translate(0,V+2.6+Xt*3.2,0)),Xt%2?16777215:15217199));let vt=V+1+6*3.2;B.push(ei(De(new Te(2.4,2.4,.5,14).translate(0,vt+.2,0)),3356740)),B.push(ei(De(new Te(1.4,1.4,2.4,10).translate(0,vt+1.6,0)),16774064)),B.push(ei(De(new on(2,1.8,10).translate(0,vt+3.7,0)),13114910));let lt=r(je(B));B.forEach(Xt=>Xt.dispose()),lt.translate(U,0,z);let Mt=new $t(lt,r(new Gn({vertexColors:!0})));Mt.castShadow=!0,Mt.name="lighthouse",e.add(Mt);let Wt=ei(De(new Oe(2.4,1.2,7,1,1,2)),16777215),st=Wt.attributes.position;for(let Xt=0;Xt<st.count;Xt++)st.getZ(Xt)>3&&st.getY(Xt)>-.1&&st.setX(Xt,st.getX(Xt)*.2);let Q=ei(De(new Te(.1,.1,8,5).translate(0,4.5,0)),7162931),Lt=ei(De(new on(2.4,7,3).scale(.08,1,1).translate(0,4.8,-1.2)),16777215),Dt=ei(De(new Oe(2.45,.3,6.6).translate(0,.3,0)),1994728),ht=r(je([Wt,Q,Lt,Dt]));[Wt,Q,Lt,Dt].forEach(Xt=>Xt.dispose()),ht.computeVertexNormals();let Kt=r(new Gn({vertexColors:!0,flatShading:!0})),Ft=$r(77);for(let Xt=0;Xt<6;Xt++){let N=Ft()*Math.PI*2,Tt=d*(1.12+Ft()*.3),J=new $t(ht,Kt);J.position.set(h+Math.cos(N)*Tt,a,u+Math.sin(N)*Tt),J.rotation.y=N+Math.PI/2,J.userData={a:N,r:Tt,speed:(.004+Ft()*.004)*(Ft()<.5?1:-1),ph:Ft()*6},J.scale.setScalar(1.6),e.add(J),I.push(J)}}return{sunLight:w,hemiLight:v,heightAt:Y,setShadowFocus:C,update(y,U){o.uTime.value=U,mt.uniforms.uTime.value=U,zt.rotation.y=U*.004;for(let z of I){let V=z.userData,B=V.a+U*V.speed;z.position.x=h+Math.cos(B)*V.r,z.position.z=u+Math.sin(B)*V.r,z.position.y=a-.2+Math.sin(U*1.3+V.ph)*.25,z.rotation.y=-B+(V.speed>0?0:Math.PI),z.rotation.z=Math.sin(U*1.1+V.ph)*.06}},dispose(){i.remove(v,w,w.target),w.shadow&&w.shadow.map&&w.shadow.map.dispose(),e.traverse(y=>{y.isInstancedMesh&&y.dispose()}),s.forEach(y=>y&&y.dispose&&y.dispose()),g&&g.dispose(),i.environment===(g&&g.texture)&&(i.environment=m||null),i.fog=_||null,i.background=M||null}}}var Zy="Palm Cove Circuit",wl=1.15,kt=2e3,Qe=12,Ns=40,ds=[[0,0,-60],[0,0,60],[2,0,175],[22,1,258],[80,3,302],[160,5,296],[230,6,252],[262,6,182],[238,5,118],[292,4,64],[258,4,4],[296,6,-62],[304,10,-140],[284,10,-212],[226,6,-262],[150,3,-284],[66,1,-300],[-20,0,-318],[-96,0,-322],[-128,0,-292],[-106,0,-256],[-50,0,-236],[-8,0,-196],[0,0,-140]],Ho={x:405,z:-205,r:125},Ru=-1,Ky=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)},$y=i=>{for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;return i},Al=(i,t,e)=>Math.min(e,Math.max(t,i));function jr(i,t,e=1){let n=Float32Array.from(i),s=n.length;for(let r=0;r<e;r++){let o=new Float32Array(s),a=0;for(let c=-t;c<=t;c++)a+=n[(c+s)%s];let l=2*t+1;for(let c=0;c<s;c++)o[c]=a/l,a+=n[(c+t+1)%s]-n[(c-t+s)%s];n=o}return n}function Jy(i,t){let e=new pe;e.name="track",i.add(e);let n=[],s={},r=ds.map(([S,F,k])=>new P(S*wl,F,k*wl)),o=new Ps(r,!0,"centripetal",.5);o.arcLengthDivisions=6e3,o.updateArcLengths();let a=o.getLength(),l=a/kt,c=new Float32Array(kt),h=new Float32Array(kt),u=new Float32Array(kt),d=new Float32Array(kt),f=new Float32Array(kt),p=new Float32Array(kt),x=new Float32Array(kt),g=new Float32Array(kt),m=new Float32Array(kt),M=new P,_=new P;for(let S=0;S<kt;S++){let F=S/kt;o.getPointAt(F,M),o.getTangentAt(F,_).normalize(),c[S]=M.x,h[S]=M.y,u[S]=M.z,d[S]=_.x,f[S]=_.y,p[S]=_.z;let k=Math.hypot(_.x,_.z)||1;x[S]=-_.z/k,g[S]=_.x/k,m[S]=Math.atan2(_.x,_.z)}let v=new Float32Array(kt);for(let S=0;S<kt;S++)v[S]=$y(m[(S+1)%kt]-m[(S-1+kt)%kt])/(2*l);let w=jr(v,6,2),R=jr(v,22,3),T=new Float32Array(kt);for(let S=0;S<kt;S++){let F=Math.hypot(c[S]-Ho.x,u[S]-Ho.z);T[S]=1-Ky(Ho.r-5,Ho.r+28,F)}T=jr(T,8,1);let C=S=>{let F=new Float32Array(kt);for(let k=0;k<kt;k++){let q=S>0?Math.max(0,w[k]):Math.max(0,-w[k]);F[k]=Qe+7+Math.min(6,q*700)}return F},b=(S,F)=>{for(let k=0;k<kt;k++){let q=F>0?Math.max(0,-w[k]):Math.max(0,w[k]);q>1e-4&&(S[k]=Math.min(S[k],1/q-5)),S[k]=Math.max(Qe+1.5,S[k]),S[k]=S[k]*(1-T[k])+(Qe+1.2)*T[k]}return S},E=b(jr(b(C(1),1),18,2),1),D=b(jr(b(C(-1),-1),18,2),-1),Y=Math.max(...E,...D),H=Qe-3,X=new Float32Array(kt);for(let S=0;S<kt;S++)X[S]=-Al(R[S]*160,-1,1)*H;let Z=Math.round(32/l),O=new Float32Array(kt);for(let S=0;S<kt;S++)O[S]=Al(X[S]-.55*X[(S+Z)%kt],-H,H);O=jr(O,14,2);let ct=1/0,K=-1/0,W=1/0,j=-1/0;for(let S=0;S<kt;S++)ct=Math.min(ct,c[S]),K=Math.max(K,c[S]),W=Math.min(W,u[S]),j=Math.max(j,u[S]);let wt=ct-200,Yt=W-200,te=Math.ceil((K-ct+400)/Ns),rt=Math.ceil((j-W+400)/Ns),mt=Array.from({length:te*rt},()=>[]);for(let S=0;S<kt;S++){let F=Math.floor((c[S]-wt)/Ns),k=Math.floor((u[S]-Yt)/Ns);mt[k*te+F].push(S)}let It=0;function dt(S,F,k=!1){let q=Math.floor((S-wt)/Ns),$=Math.floor((F-Yt)/Ns),ut=-1,gt=1/0;for(let ot=1;ot<=2;ot++){for(let yt=$-ot;yt<=$+ot;yt++)if(!(yt<0||yt>=rt))for(let At=q-ot;At<=q+ot;At++){if(At<0||At>=te||ot===2&&yt>$-2&&yt<$+2&&At>q-2&&At<q+2)continue;let Ht=mt[yt*te+At];for(let ce=0;ce<Ht.length;ce++){let Gt=Ht[ce],Nt=c[Gt]-S,Re=u[Gt]-F,se=Nt*Nt+Re*Re;se<gt&&(gt=se,ut=Gt)}}if(ut>=0&&gt<=Ns*ot*(Ns*ot))return It=gt,ut}if(k)return It=1/0,-1;for(let ot=0;ot<kt;ot++){let yt=c[ot]-S,At=u[ot]-F,Ht=yt*yt+At*At;Ht<gt&&(gt=Ht,ut=ot)}return It=gt,ut}let zt=45;function ie(S,F,k){if(typeof k=="number"&&isFinite(k)){let q=Math.round((k%1+1)%1*kt),$=-1,ut=1/0,gt=0;for(let yt=-zt;yt<=zt;yt++){let At=(q+yt+kt)%kt,Ht=c[At]-S,ce=u[At]-F,Gt=Ht*Ht+ce*ce;Gt<ut&&(ut=Gt,$=At,gt=yt)}let ot=Y+8;if(ut<ot*ot&&Math.abs(gt)<zt)return It=ut,$}return dt(S,F)}let Vt={a:0,b:1,f:0,s:0,lat:0,y:0,cx:0,cz:0,rx:0,rz:0};function oe(S,F,k){let q=ie(S,F,k),$=(q+1)%kt,ut=(q-1+kt)%kt,gt=(S-c[q])*d[q]+(F-u[q])*p[q],ot=gt>=0?q:ut,yt=gt>=0?$:q,At=c[yt]-c[ot],Ht=u[yt]-u[ot],ce=At*At+Ht*Ht||1,Gt=Al(((S-c[ot])*At+(F-u[ot])*Ht)/ce,0,1),Nt=c[ot]+At*Gt,Re=u[ot]+Ht*Gt,se=x[ot]+(x[yt]-x[ot])*Gt,he=g[ot]+(g[yt]-g[ot])*Gt,xe=Math.hypot(se,he)||1;return se/=xe,he/=xe,Vt.a=ot,Vt.b=yt,Vt.f=Gt,Vt.s=ot+Gt,Vt.cx=Nt,Vt.cz=Re,Vt.y=h[ot]+(h[yt]-h[ot])*Gt,Vt.rx=se,Vt.rz=he,Vt.lat=(S-Nt)*se+(F-Re)*he,Vt}let at=(S,F,k,q)=>S[F]+(S[k]-S[F])*q,St=S=>(S/l%kt+kt)%kt,L=S=>{let F=Math.floor(S)%ds.length,k=(F+1)%ds.length,q=S-Math.floor(S),$=(ds[F][0]+(ds[k][0]-ds[F][0])*q)*wl,ut=(ds[F][2]+(ds[k][2]-ds[F][2])*q)*wl;return dt($,ut)},Zt=Math.max(3,Math.round(7/l)),xt=[],Ut=(S,F)=>xt.push({s0:(S%kt+kt)%kt,len:Zt,lat:F,hw:2.6}),Pt=Math.round(16/l);{let S=L(10.45);Ut(S,-6),Ut(S+Pt,0),Ut(S+Pt*2,6)}{let S=L(20.55);Ut(S,-4.5),Ut(S,4.5),Ut(S+Pt*2,0)}{let S=L(4.15);Ut(S,O[S]),Ut(S+Pt,O[(S+Pt)%kt])}let ee=Math.max(4,Math.round(9/l)),Et=[],I=(S,F=10,k=1.7)=>Et.push({s0:(S%kt+kt)%kt,len:ee,hw:F,h:k});I(L(14.35)),I(L(4.65),9,1.5);let y=[],U=[1.25,6.5,9.2,12.5,16.4,21.6].map(L);for(let S of U)for(let F of[-8,-4,0,4,8])y.push(new P(c[S]+x[S]*F,h[S]+1.4,u[S]+g[S]*F));let z=(S,F)=>{let k=S-F;return k<0&&(k+=kt),k};function V(S,F){if(!S||!isFinite(S.x)||!isFinite(S.z))return{height:0,normal:new P(0,1,0),surface:"road",t:0,lateral:0,onRoad:!0};let k=oe(S.x,S.z,F),{a:q,b:$,f:ut}=k,gt=k.lat,ot=k.s/kt%1,yt=k.y,At=at(d,q,$,ut),Ht=at(f,q,$,ut),ce=at(p,q,$,ut),Gt=new P(-k.rz*Ht,k.rz*At-k.rx*ce,k.rx*Ht).normalize(),Nt=Math.abs(gt)<=Qe,Re=Nt?"road":"offroad";if(Nt){for(let se=0;se<Et.length;se++){let he=Et[se],xe=z(k.s,he.s0);if(xe<=he.len&&Math.abs(gt)<=he.hw){let ve=he.h/(he.len*l);yt+=ve*xe*l,Re="jump",Gt.set(Gt.x-At*ve,Gt.y-Ht*ve,Gt.z-ce*ve).normalize();break}}if(Re==="road")for(let se=0;se<xt.length;se++){let he=xt[se];if(z(k.s,he.s0)<=he.len&&Math.abs(gt-he.lat)<=he.hw){Re="boost";break}}}return{height:yt,normal:Gt,surface:Re,t:ot,lateral:gt,onRoad:Nt}}function B(S,F=1.3){if(!S||!isFinite(S.x)||!isFinite(S.z))return null;let k=oe(S.x,S.z),q=at(E,k.a,k.b,k.f),$=at(D,k.a,k.b,k.f);return k.lat+F>q?{normal:new P(-k.rx,0,-k.rz),depth:k.lat+F-q}:-k.lat+F>$?{normal:new P(k.rx,0,k.rz),depth:-k.lat+F-$}:null}let vt=S=>o.getPointAt((S%1+1)%1),lt=S=>o.getTangentAt((S%1+1)%1).normalize();function Mt(S){let F=(S%1+1)%1*kt,k=Math.floor(F)%kt,q=(k+1)%kt,$=F-Math.floor(F),ut=O[k]+(O[q]-O[k])*$,gt=at(c,k,q,$),ot=at(h,k,q,$),yt=at(u,k,q,$),At=at(x,k,q,$),Ht=at(g,k,q,$),ce=Math.hypot(At,Ht)||1;return At/=ce,Ht/=ce,new P(gt+At*ut,ot,yt+Ht*ut)}let Wt=[];for(let S=0;S<8;S++){let F=8+S*5.2,k=St(a-F),q=Math.floor(k)%kt,$=(q+1)%kt,ut=k-Math.floor(k),gt=S%2===0?-4.5:4.5,ot=at(c,q,$,ut)+at(x,q,$,ut)*gt,yt=at(u,q,$,ut)+at(g,q,$,ut)*gt;Wt.push({position:new P(ot,at(h,q,$,ut),yt),heading:Math.atan2(at(d,q,$,ut),at(p,q,$,ut))})}let st={points:[],bounds:{minX:ct,maxX:K,minZ:W,maxZ:j}};for(let S=0;S<256;S++){let F=Math.floor(S*kt/256);st.points.push({x:c[F],z:u[F]})}function Q(S,F,k,{across:q=null,acrossScale:$=1,alongScale:ut=1,alongSign:gt=1,swap:ot=!1,step:yt=1}={}){let At=[];for(let xe=S;xe<F;xe+=yt)At.push(xe);At.push(F);let Ht=k(S%kt).length,ce=new Float32Array(At.length*Ht*3),Gt=new Float32Array(At.length*Ht*2),Nt=0,Re=0;for(let xe of At){let ve=(Math.round(xe)%kt+kt)%kt,An=k(ve,xe),Ce=(xe-S)*l/ut*gt;for(let nn=0;nn<Ht;nn++){let[Dn,$n]=An[nn];ce[Nt++]=c[ve]+x[ve]*Dn,ce[Nt++]=h[ve]+$n,ce[Nt++]=u[ve]+g[ve]*Dn;let Ri=q?q[nn]:Dn/$;ot?(Gt[Re++]=Ce,Gt[Re++]=Ri):(Gt[Re++]=Ri,Gt[Re++]=Ce)}}let se=[];for(let xe=0;xe<At.length-1;xe++)for(let ve=0;ve<Ht-1;ve++){let An=xe*Ht+ve,Ce=xe*Ht+ve+1,nn=(xe+1)*Ht+ve,Dn=(xe+1)*Ht+ve+1;se.push(An,Ce,nn,Ce,Dn,nn)}let he=new qe;return he.setAttribute("position",new Ie(ce,3)),he.setAttribute("uv",new Ie(Gt,2)),he.setIndex(se),he.computeVertexNormals(),he}function Lt(S,F=1){let k=[],q=new Uint8Array(kt);for(let gt=0;gt<kt;gt++)q[gt]=S(gt)?1:0;if(q.every(gt=>gt))return[[0,kt]];let $=0;for(;q[$];)$++;let ut=-1;for(let gt=1;gt<=kt;gt++){let ot=$+gt,yt=q[ot%kt];yt&&ut<0&&(ut=ot),!yt&&ut>=0&&(ot-ut>=F&&k.push([ut-1,ot]),ut=-1)}return k}let Dt=(S,F,{cast:k=!1,receive:q=!0,name:$=""}={})=>{let ut=new $t(S,F);return ut.castShadow=k,ut.receiveShadow=q,ut.name=$,e.add(ut),n.push(S),ut},ht=S=>(n.push(S),S.map&&n.push(S.map),S),Kt=ap(),Ft=ht(new ye({map:Kt,roughness:.88,metalness:0}));Dt(Q(0,kt,()=>[[-Qe,0],[0,0],[Qe,0]],{across:[0,.5,1],alongScale:22,step:1}),Ft,{name:"road"});let Xt=ht(new ye({map:lp(),roughness:.6})),N=new Uint8Array(kt);for(let S=0;S<kt;S++)if(Math.abs(w[S])>1/240&&T[S]<.2)for(let F=-30;F<=30;F++)N[(S+F+kt)%kt]=1;for(let S=0;S<kt;S++)T[S]>.05&&(N[S]=0);let Tt=[];for(let[S,F]of Lt(k=>N[k],10))Tt.push(Q(S,F,()=>[[Qe-1.4,0],[Qe-1.1,.08],[Qe+.7,.08],[Qe+.9,-.05]],{across:[0,.15,.9,1],alongScale:4})),Tt.push(Q(S,F,()=>[[-Qe-.9,-.05],[-Qe-.7,.08],[-Qe+1.1,.08],[-Qe+1.4,0]],{across:[0,.1,.85,1],alongScale:4}));Tt.length&&Dt(je(Tt),Xt,{name:"curbs"}),Tt.forEach(S=>S.dispose());let J=ht(new ye({map:cp(),roughness:1}));J.map.repeat.set(1,1);let nt=ht(new ye({map:hp(),roughness:.9})),Rt=[],Ct=[];for(let[S,F]of Lt(k=>T[k]<.5,5))Rt.push(Q(S,F,k=>[[Qe-.2,-.03],[E[k]+.35,-.03]],{acrossScale:6,alongScale:6})),Rt.push(Q(S,F,k=>[[-D[k]-.35,-.03],[-Qe+.2,-.03]],{acrossScale:6,alongScale:6}));let ne=Lt(S=>T[S]>=.5,5);for(let[S,F]of ne)Ct.push(Q(S,F,k=>[[Qe-.2,-.02],[E[k]+.8,-.02]],{acrossScale:4,alongScale:4})),Ct.push(Q(S,F,k=>[[-D[k]-.8,-.02],[-Qe+.2,-.02]],{acrossScale:4,alongScale:4})),Ct.push(Q(S,F,k=>[[E[k]+.8,-.02],[E[k]+.8,-2.4]],{acrossScale:4,alongScale:4})),Ct.push(Q(S,F,k=>[[-D[k]-.8,-2.4],[-D[k]-.8,-.02]],{acrossScale:4,alongScale:4})),Ct.push(Q(S,F,k=>[[E[k]+.8,-2.4],[-D[k]-.8,-2.4]],{acrossScale:4,alongScale:4}));Rt.length&&Dt(je(Rt),J,{name:"offroad"}),Ct.length&&Dt(je(Ct),nt,{name:"deck",cast:!0}),Rt.forEach(S=>S.dispose()),Ct.forEach(S=>S.dispose());let Se=S=>{let F=new Array(kt),k=new Uint8Array(kt);for(let q=0;q<kt;q++)if(S>0?w[q]>.01818181818181818:w[q]<-.01818181818181818)for(let ut=-18;ut<=18;ut++)k[(q+ut+kt)%kt]=1;for(let q=0;q<kt;q++)F[q]=T[q]>=.5?"rail":k[q]?"tires":"wall";return F},ze=Se(1),le=Se(-1),He=up(),Mn=ht(new ye({map:He,roughness:.55})),pi=ht(new ye({color:15921906,roughness:.5})),wn=ht(new ye({map:fp(),roughness:.45})),Pn=1.25,un=.7,Kn=9.6,qt=S=>(S+.05)/(Pn+.05),Me=[],ae=[],de=[];for(let S of[1,-1]){let F=S>0?ze:le,k=S>0?E:D;for(let q of["wall","rail"]){let $=q==="wall"?Me:de,ut=q==="rail"?-2.4:-1.5,gt=q==="rail"?1.1:Pn;for(let[ot,yt]of Lt(At=>F[At]===q,4))S>0?($.push(Q(ot,yt,At=>[[k[At],ut],[k[At],gt]],{across:[qt(ut),qt(gt)],alongScale:Kn,alongSign:-1,swap:!0})),ae.push(Q(ot,yt,At=>[[k[At],gt],[k[At]+un,gt]],{across:[0,1],alongScale:Kn})),$.push(Q(ot,yt,At=>[[k[At]+un,gt],[k[At]+un,ut]],{across:[qt(gt),qt(ut)],alongScale:Kn,swap:!0}))):($.push(Q(ot,yt,At=>[[-k[At]-un,ut],[-k[At]-un,gt]],{across:[qt(ut),qt(gt)],alongScale:Kn,alongSign:-1,swap:!0})),ae.push(Q(ot,yt,At=>[[-k[At]-un,gt],[-k[At],gt]],{across:[0,1],alongScale:Kn})),$.push(Q(ot,yt,At=>[[-k[At],gt],[-k[At],ut]],{across:[qt(gt),qt(ut)],alongScale:Kn,swap:!0})))}}Me.length&&Dt(je(Me),Mn,{cast:!0,name:"walls"}),de.length&&(wn.map.repeat.set(1/2.5,1),Dt(je(de),wn,{cast:!0,name:"rails"})),ae.length&&Dt(je(ae),pi,{cast:!1,name:"wallTops"}),[...Me,...de,...ae].forEach(S=>S.dispose());{let F=new Te(.9,.9,.42,14,1),k=ht(new ye({roughness:.8})),q=[];for(let At of[1,-1]){let Ht=At>0?ze:le,ce=At>0?E:D;for(let[Gt,Nt]of Lt(Re=>Ht[Re]==="tires",4)){let Re=1e9,se=0,he=0,xe=0;for(let ve=Gt;ve<=Nt;ve++){let An=ve%kt,Ce=At*(ce[An]+.9),nn=c[An]+x[An]*Ce,Dn=u[An]+g[An]*Ce;Re+=Math.hypot(nn-se,Dn-he),se=nn,he=Dn,Re>=.9*1.95&&(Re=0,q.push({x:nn,y:h[An],z:Dn,stack:xe++}))}}}let $=[new ft(15217199),new ft(16250871),new ft(1994728),new ft(16250871)],ut=new ft(2763825),gt=new Bn(F,k,q.length*3),ot=new ue,yt=0;for(let At of q)for(let Ht=0;Ht<3;Ht++)ot.makeRotationY(At.stack*.7+Ht),ot.setPosition(At.x,At.y+.21+Ht*.44,At.z),gt.setMatrixAt(yt,ot),gt.setColorAt(yt,Ht===1?$[At.stack%2*2]:Ht===0?ut:$[1]),yt++;gt.count=yt,gt.castShadow=!0,gt.receiveShadow=!0,gt.name="tires",e.add(gt),n.push(F)}{let S=new Oe(1,1,1),F=ht(new ye({color:14275783,roughness:.85})),k=[];for(let[$,ut]of ne){let gt=Math.round(26/l);for(let ot=$+Math.round(gt/2);ot<ut-gt/3;ot+=gt){let yt=ot%kt,At=h[yt]-2.4,Ht=Ru-12,ce=At-Ht,Gt=new ue().makeRotationY(m[yt]);Gt.scale(new P(E[yt]+D[yt]-2,ce,2.6));let Nt=(E[yt]-D[yt])/2;Gt.setPosition(c[yt]+x[yt]*Nt,Ht+ce/2,u[yt]+g[yt]*Nt),k.push(Gt)}}let q=new Bn(S,F,Math.max(1,k.length));k.forEach(($,ut)=>q.setMatrixAt(ut,$)),q.count=k.length,q.castShadow=!0,q.receiveShadow=!0,e.add(q),n.push(S)}let Ge=dp(),fn=ht(new Sn({map:Ge,toneMapped:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));fn.color.setScalar(1.25);{let S=xt.map(F=>Q(F.s0,F.s0+F.len,()=>[[F.lat-F.hw,.04],[F.lat+F.hw,.04]],{across:[0,1],alongScale:F.len*l/2}));Dt(je(S),fn,{name:"boostPads"}),S.forEach(F=>F.dispose())}{let S=ht(new ye({map:pp(),roughness:.5,side:$e})),F=ht(new ye({color:16761370,roughness:.6,side:$e})),k=[],q=[];for(let $ of Et){let ut=ot=>$.h*Al((ot-$.s0)/$.len,0,1);k.push(Q($.s0,$.s0+$.len,(ot,yt)=>[[-$.hw,ut(yt)+.03],[$.hw,ut(yt)+.03]],{across:[0,1],alongScale:$.len*l})),q.push(Q($.s0,$.s0+$.len,(ot,yt)=>[[$.hw,ut(yt)+.03],[$.hw,-.1]],{across:[0,1]})),q.push(Q($.s0,$.s0+$.len,(ot,yt)=>[[-$.hw,-.1],[-$.hw,ut(yt)+.03]],{across:[0,1]}));let gt=($.s0+$.len)%kt;q.push(Q(gt,gt+.001,(ot,yt)=>yt===gt?[[-$.hw,$.h+.03],[$.hw,$.h+.03]]:[[-$.hw,-.1],[$.hw,-.1]],{across:[0,1]}))}Dt(je(k),S,{cast:!0,name:"ramps"}),Dt(je(q),F,{cast:!0,name:"rampSides"}),[...k,...q].forEach($=>$.dispose())}let dn=S=>ht(new ye({roughness:.7,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,...S}));{let S=Au(12,2),F=Math.max(2,Math.round(1.5/l));Dt(Q(kt-F,kt+F,()=>[[-Qe,.02],[Qe,.02]],{across:[0,1],alongScale:2*F*l}),dn({map:S}),{name:"startLine"});let k=[];for(let q of Wt){let $=q.heading,ut=new P(Math.sin($),0,Math.cos($)),gt=new P(-Math.cos($),0,Math.sin($)),ot=(yt,At,Ht,ce)=>{let Gt=new zn(yt,At).rotateX(-Math.PI/2).rotateY($),Nt=q.position.clone().addScaledVector(ut,Ht).addScaledVector(gt,ce);Gt.translate(Nt.x,Nt.y+.025,Nt.z),k.push(Gt)};ot(3.6,.35,2,0),ot(.3,1.6,1.3,1.65),ot(.3,1.6,1.3,-1.65)}Dt(je(k),dn({color:16777215}),{name:"gridMarks"}),k.forEach(q=>q.dispose())}let mi=[];{let S=new pe;S.position.set(c[0],h[0],u[0]),S.rotation.y=m[0];let F=D[0]+2.2,k=-(E[0]+2.2),q=ht(new ye({map:gp("#ffffff","#e8322f",10),roughness:.5}));q.map.rotation=Math.PI/2;let $=new Te(.9,1.1,12,16);n.push($);for(let he of[F,k]){let xe=new $t($,q);xe.position.set(he,6,0),xe.castShadow=!0,S.add(xe)}let ut=F-k+2.5,gt=mp("TURBO KART RALLY");n.push(gt);let ot=ht(new ye({color:13114910,roughness:.5})),yt=ht(new ye({map:gt,roughness:.5,emissive:2228224})),At=new Oe(ut,3,1.4);n.push(At);let Ht=new $t(At,[ot,ot,ot,ot,yt,yt]);Ht.position.set((F+k)/2,11,0),Ht.castShadow=!0,S.add(Ht);let ce=new Oe(6.5,2,.8);n.push(ce);let Gt=new $t(ce,ht(new ye({color:1776932,roughness:.4})));Gt.position.set(0,8.4,-.4),S.add(Gt);let Nt=new ti(.62,16,12);n.push(Nt);for(let he=0;he<3;he++){let xe=ht(new ye({color:3346705,emissive:0,roughness:.3})),ve=new $t(Nt,xe);ve.position.set((he-1)*2,8.4,-.85),S.add(ve),mi.push(xe)}let Re=new zn(3,2,1,1).translate(1.5,0,0);n.push(Re);let se=ht(new ye({map:Au(6,4),side:$e,roughness:.8}));for(let he of[F,k]){let xe=new $t(Re,se);xe.position.set(he,13.2,0),xe.rotation.y=Math.PI/2,S.add(xe)}e.add(S)}let Ln=(S,F)=>{mi.forEach((k,q)=>{let $=q<S;k.emissive.setHex($?F:0),k.emissiveIntensity=$?3:0,k.color.setHex($?F:3346705)})},A=0,G=[Bt.on("race:countdown",S=>{let F=S&&S.n;Ln(F===3?1:F===2?2:3,16722458),A=0}),Bt.on("race:go",()=>{Ln(3,2293589),A=3})],tt=xp(i,t,e,{N:kt,ds:l,length:a,px:c,py:h,pz:u,rx:x,rz:g,tx:d,tz:p,head:m,kS:w,wallL:D,wallR:E,bridge:T,halfWidth:Qe,nearest:(S,F,k=!1)=>({i:dt(S,F,k),d2:It}),lake:Ho,waterLevel:Ru,bounds:{minX:ct,maxX:K,minZ:W,maxZ:j},boostPads:xt,ramps:Et,startPositions:Wt});return Object.assign(s,{name:Zy,curve:o,length:a,roadWidth:Qe*2,startPositions:Wt,itemBoxPositions:y,minimap:st,getSurfaceInfo:V,resolveWall:B,getPointAt:vt,getTangentAt:lt,getRacingLine:Mt,boostPads:xt.map(S=>({t:S.s0/kt,lateral:S.lat,length:S.len*l,halfWidth:S.hw})),jumpRamps:Et.map(S=>({t:S.s0/kt,length:S.len*l,halfWidth:S.hw,height:S.h})),waterLevel:Ru,sunLight:tt.sunLight,getWallOffsets(S){let F=(S%1+1)%1*kt,k=Math.floor(F)%kt,q=(k+1)%kt,$=F-Math.floor(F);return{left:at(D,k,q,$),right:at(E,k,q,$)}},setShadowFocus(S){tt.setShadowFocus(S)},update(S,F){try{let k=typeof F=="number"?F:0;Ge.offset.y=-(k*1.6%1),A>0&&(A-=S||0,A<=0&&Ln(0,0)),tt.update(S||0,k)}catch{}},dispose(){G.forEach(S=>S&&S()),tt.dispose(),e.traverse(S=>{S.isInstancedMesh&&S.dispose()}),n.forEach(S=>S&&S.dispose&&S.dispose()),i.remove(e)}}),s}var Uu={};ys(Uu,{Kart:()=>ku,resolveKartCollisions:()=>P1});var Lu={};ys(Lu,{InputController:()=>Go});var jy={confirm:["Enter","NumpadEnter","Space"],back:["Escape","Backspace"],up:["ArrowUp","KeyW"],down:["ArrowDown","KeyS"],mute:["KeyM"]},_p={...jy,...ep},tn={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,L3:10,R3:11,UP:12,DOWN:13,LEFT:14,RIGHT:15},Rl={accelerate:[tn.A,tn.RT],brake:[tn.B,tn.LT],drift:[tn.RB,tn.X],item:[tn.LB,tn.Y],lookBack:[tn.R3,tn.L3],pause:[tn.START],left:[tn.LEFT],right:[tn.RIGHT],up:[tn.UP],down:[tn.DOWN],confirm:[tn.A,tn.START],back:[tn.B,tn.BACK],mute:[]},vp=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"]),Iu=.18,Qy=.08,t1=.06;function e1(i){if(!i)return!1;let t=i.tagName;return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"||i.isContentEditable}var Qr=class Qr{constructor({target:t=typeof window<"u"?window:null}={}){this.target=t,this.keys=new Set,this.tvFrame=null,this.latch=Object.create(null),this.itemEdge=!1,this.gpHeld=Object.create(null),this.gpPrev=Object.create(null),this.gpSteer=0,this.gpThrottle=0,this.gpBrake=0,this.gamepadConnected=!1,this.lastDevice="keyboard",this.steer=0,this._lastTime=Pu(),this._lastPoll=-1,this._state={throttle:0,brake:0,steer:0,drift:!1,item:!1,lookBack:!1},this._codeToActions=new Map;for(let[e,n]of Object.entries(_p))for(let s of n||[])this._codeToActions.has(s)||this._codeToActions.set(s,[]),this._codeToActions.get(s).push(e);this._onKeyDown=e=>{if(e1(e.target))return;if(vp.has(e.code)&&e.preventDefault(),this.lastDevice="keyboard",e.repeat||this.keys.has(e.code)){this.keys.add(e.code);return}let n=this._codeToActions.get(e.code);if(n)for(let s of n)this._keyHeld(s)||(this.latch[s]=!0,s==="item"&&(this.itemEdge=!0));this.keys.add(e.code)},this._onKeyUp=e=>{vp.has(e.code)&&e.preventDefault(),this.keys.delete(e.code)},this._onBlur=()=>{this.keys.clear()},t?.addEventListener&&(t.addEventListener("keydown",this._onKeyDown,{passive:!1}),t.addEventListener("keyup",this._onKeyUp,{passive:!1}),t.addEventListener("blur",this._onBlur)),Qr.active=this}_keyHeld(t){let e=_p[t];if(!e)return!1;for(let n of e)if(this.keys.has(n))return!0;return!1}_pollGamepad(){let t=Pu();if(t===this._lastPoll)return;this._lastPoll=t;let e=null;try{e=typeof navigator<"u"&&navigator.getGamepads?navigator.getGamepads():null}catch{e=null}let n=null;if(e){for(let r of e)if(r&&r.connected!==!1){n=r;break}}this.gamepadConnected=!!n;let s=this.gpHeld;for(let r in Rl)s[r]=!1;if(this.gpSteer=0,this.gpThrottle=0,this.gpBrake=0,n){let r=c=>{let h=n.buttons?.[c];return h?typeof h=="object"?h.pressed?Math.max(h.value||0,1):h.value||0:h?1:0:0};for(let[c,h]of Object.entries(Rl))for(let u of h)if(r(u)>.35){s[c]=!0;break}this.gpThrottle=Math.max(r(tn.A)>.5?1:0,r(tn.RT)),this.gpBrake=Math.max(r(tn.B)>.5?1:0,r(tn.LT));let o=n.axes?.[0]??0,a=n.axes?.[1]??0;Math.abs(o)>Iu&&(this.gpSteer=Math.sign(o)*Math.min(1,(Math.abs(o)-Iu)/(1-Iu))),s.left&&(this.gpSteer=-1),s.right&&(this.gpSteer=1),o<-.6&&(s.left=!0),o>.6&&(s.right=!0),a<-.6&&(s.up=!0),a>.6&&(s.down=!0);let l=!1;for(let c in Rl)s[c]&&!this.gpPrev[c]&&(this.latch[c]=!0,c==="item"&&(this.itemEdge=!0),l=!0);(l||this.gpSteer!==0||this.gpThrottle>0)&&(this.lastDevice="gamepad")}for(let r in Rl)this.gpPrev[r]=s[r]}isPressed(t){return this._pollGamepad(),this._keyHeld(t)||!!this.gpHeld[t]}consumePressed(t){return this._pollGamepad(),this.latch[t]?(this.latch[t]=!1,!0):!1}peekThrottle(){return this._pollGamepad(),Math.max(this._keyHeld("accelerate")?1:0,this.gpThrottle,this.tvFrame?.buttons.UP?1:0)}getInput(){this._pollGamepad();let t=Pu(),e=Math.min(.05,Math.max(0,(t-this._lastTime)/1e3));this._lastTime=t;let n=(this._keyHeld("right")||this.tvFrame?.buttons.RIGHT?1:0)-(this._keyHeld("left")||this.tvFrame?.buttons.LEFT?1:0);if(this.gpSteer!==0)this.steer=this.gpSteer;else{let r=this.steer;if(n===0){let o=e/t1;r=Math.abs(r)<=o?0:r-Math.sign(r)*o}else{Math.sign(r)===-n&&(r=0);let o=e/Qy;r=Math.abs(n-r)<=o?n:r+Math.sign(n-r)*o}this.steer=r}let s=this._state;return s.throttle=Math.max(this._keyHeld("accelerate")?1:0,this.gpThrottle,this.tvFrame?.buttons.UP?1:0),s.brake=Math.max(this._keyHeld("brake")?1:0,this.gpBrake,this.tvFrame?.buttons.DOWN?1:0),s.steer=Math.max(-1,Math.min(1,this.steer)),s.drift=this._keyHeld("drift")||!!this.gpHeld.drift||!!this.tvFrame?.buttons.A,s.item=this.itemEdge||!!this.tvFrame?.pressed.B,this.itemEdge=!1,s.lookBack=this._keyHeld("lookBack")||!!this.gpHeld.lookBack||!!this.tvFrame?.buttons.X,{...s}}reset(){this.tvFrame=null,this.keys.clear();for(let t in this.latch)this.latch[t]=!1;this.itemEdge=!1,this.steer=0}dispose(){let t=this.target;t?.removeEventListener&&(t.removeEventListener("keydown",this._onKeyDown),t.removeEventListener("keyup",this._onKeyUp),t.removeEventListener("blur",this._onBlur)),Qr.active===this&&(Qr.active=null),this.keys.clear()}};gf(Qr,"active",null);var Go=Qr;function Pu(){return typeof performance<"u"?performance.now():Date.now()}var Cl=Math.PI*2,bi=(i,t,e)=>i<t?t:i>e?e:i,sr=(i,t,e,n)=>i+(t-i)*(1-Math.exp(-e*n)),Vo=(i,t,e)=>t+(e-t)*bi(((Number.isFinite(i)?i:3)-1)/4,0,1),We=i=>Number.isFinite(i),n1=2.15,i1=9,s1=.16,r1=13,o1=2.6,a1=.4,l1=.85,yp=12,c1=8,h1=.62,u1=.5,f1=1.08,d1=.42,p1=[.72,.86,1],m1=4.8,g1=40,x1=.28,_1=60,Mp=5,v1=7,y1=16,M1=48,b1=.35,bp=.35,S1=.12,Sp=.6,E1=.74,T1=1.4,Ep=2.2,w1=.7,A1=1,R1=.7,C1=9.5,I1=.17,ui=new P;function Il(){return{throttle:0,brake:0,steer:0,drift:!1,item:!1,lookBack:!1}}var ku=class{constructor({scene:t=null,track:e=null,character:n=null,isPlayer:s=!1,index:r=0,model:o=null}={}){this.scene=t,this.track=e,this.character=n||{id:"racer",name:"Racer",stats:{}},this.isPlayer=!!s,this.index=r|0,this.model=o||null;let a=this.character.stats||{};this.stats={maxSpeed:Ve.maxSpeed*Vo(a.speed,.93,1.07),accel:Ve.accel*Vo(a.accel,.8,1.28),turnRate:n1*Vo(a.handling,.88,1.14),driftCharge:Vo(a.handling,.92,1.1),mass:Vo(a.weight,.75,1.4)},this.object3D=new pe,this.object3D.name=`kart-${this.index}`,this.object3D.userData.kart=this,this.tiltGroup=new pe,this.bodyGroup=new pe,this.object3D.add(this.tiltGroup),this.tiltGroup.add(this.bodyGroup),this.model?.root&&this.bodyGroup.add(this.model.root),t?.add?.(this.object3D),this.position=this.object3D.position,this.velocity=new P,this._forward=new P(0,0,1),this._right=new P(-1,0,0),this.groundNormal=new P(0,1,0),this.input=Il(),this.maxSpeedScale=1,this.time=0,this.lap=0,this.place=this.index+1,this.finished=!1,this.finishTime=null,this.raceProgress=0,this.item=null,this.itemCount=0,this.controlsLocked=!1,this._resetState(),this._countdown={oneAt:-1,holdStart:-1},this._unsubs=[Bt.on("race:countdown",l=>this._onCountdown(l)),Bt.on("race:go",()=>this._onGo())]}get heading(){return this.object3D.rotation.y}set heading(t){We(t)&&(this.object3D.rotation.y=t)}get forward(){let t=this.heading;return this._forward.set(Math.sin(t),0,Math.cos(t))}get right(){let t=this.heading;return this._right.set(-Math.cos(t),0,Math.sin(t))}get boosting(){return this.boostTimer>0}get shrunk(){return this.shrinkTimer>0}get spinning(){return this.spinTimer>0}get mass(){let t=this.stats.mass;return this.shrinkTimer>0&&(t*=.35),this.starTimer>0&&(t*=25),t}get topSpeed(){return this._topSpeed()}_resetState(){this.velocity.set(0,0,0),this.speed=0,this.radius=Ve.kartRadius,this.trackT=0,this.surface="road",this.onRoad=!0,this.lateral=0,this.groundHeight=0,this.groundNormal.set(0,1,0),this.airborne=!1,this.airTime=0,this.drifting=!1,this.driftDir=1,this.driftLevel=0,this.driftCharge=0,this.driftTime=0,this.boostTimer=0,this.boostStrength=1,this.boostSource=null,this.starTimer=0,this.shrinkTimer=0,this.spinTimer=0,this.spinDuration=1,this.hitKind=null,this.invulnTimer=0,this.respawnTimer=0,this.respawnInvuln=0,this.stallTimer=0,this.squashTimer=0,this.steerSmoothed=0,this.hopY=0,this.hopVel=0,this.hopping=!1,this._driftPending=0,this._prevDrift=!1,this._padCooldown=0,this._jumpCooldown=0,this._wallCooldown=0,this.bumpCooldown=0,this._fromRamp=!1,this._trick=!1,this._trickTime=0,this._boostKick=0,this._pitch=0,this._roll=0,this._bodyYaw=0,this._lean=0,this._landSquash=0,this._landSquashVel=0,this._boostPitch=0,this._boostDurationMax=0}_onCountdown(t){t?.n===1&&(this._countdown.oneAt=Du()),t?.n>=3&&(this._countdown.holdStart=-1)}_onGo(){if(!this.isPlayer)return;let t=this._countdown;if(this._rawThrottle()<.5||t.holdStart<0){t.holdStart=-1;return}let n=Du()-t.holdStart;t.holdStart=-1,n>=.2&&n<=.95?this.applyBoost(1.2,1,"start"):n>.95&&n<=1.3?this.applyBoost(.5,.7,"start"):n>1.3&&(this.stallTimer=.9,this.spinTimer=.9,this.spinDuration=.9,this.hitKind="stall",Bt.emit("kart:stall",{kart:this}))}_rawThrottle(){let t=this.input?.throttle||0;if(this.isPlayer)try{t=Math.max(t,Go.active?.peekThrottle?.()||0)}catch{}return t}applyBoost(t,e=1,n="item"){!We(t)||t<=0||(e=We(e)?e:1,this.boostTimer>0?this.boostStrength=Math.max(this.boostStrength,e):this.boostStrength=e,this.boostTimer=Math.max(this.boostTimer,t),this._boostDurationMax=Math.max(this.boostTimer,.01),this.boostSource=n,this._boostKick=Math.max(this._boostKick,Mp*e),this._boostPitch=.09*e,Bt.emit("kart:boost",{kart:this,source:n,seconds:t,strength:e}))}startStar(t=Ve.starTime){this.starTimer=Math.max(this.starTimer,We(t)?t:Ve.starTime),this.shrinkTimer>0&&this._endShrink(),this.spinTimer>0&&this.hitKind!=="stall"&&(this.spinTimer=0,this.hitKind=null),this._boostKick=Math.max(this._boostKick,Mp),Bt.emit("kart:boost",{kart:this,source:"star",seconds:this.starTimer,strength:1})}applyHit(t="spin"){if(this.starTimer>0)return!1;if(t==="shrink"){let e=this.shrinkTimer>0;this.shrinkTimer=Ve.lightningShrinkTime,this.radius=Ve.kartRadius*Sp;try{this.model?.setShrunk?.(Sp)}catch{}return this.invulnTimer<=0&&(this._cancelDrift(!1),this.boostTimer=0,this._startSpin("shrink",.8,.55)),(!e||this.invulnTimer<=0)&&Bt.emit("kart:hit",{kart:this,kind:"shrink"}),!0}if(this.invulnTimer>0)return!1;if(this._cancelDrift(!1),this.boostTimer=0,this._trick=!1,t==="tumble")this._startSpin("tumble",Ve.tumbleTime,.12);else{if(t==="squash")return this._startSpin("spin",Ve.spinOutTime,.3),this.squashTimer=1.4,Bt.emit("kart:hit",{kart:this,kind:"spin",squash:!0}),!0;this._startSpin("spin",Ve.spinOutTime,.45)}return Bt.emit("kart:hit",{kart:this,kind:t==="tumble"?"tumble":"spin"}),!0}_startSpin(t,e,n){this.hitKind=t,this.spinDuration=e,this.spinTimer=e,this.invulnTimer=Math.max(this.invulnTimer,e+T1),this.velocity.x*=n,this.velocity.z*=n,this.speed*=n,t==="tumble"&&!this.airborne&&(this.hopVel=0,this.hopY=0)}_endShrink(){this.shrinkTimer=0,this.radius=Ve.kartRadius;try{this.model?.setShrunk?.(1)}catch{}}respawn(t=this.trackT){let e=this.track;if(!e)return;let n=We(t)?t:0;n=((n-.003)%1+1)%1;let s,r;try{s=e.getPointAt?.(n),r=e.getTangentAt?.(n)}catch{s=null}(!s||!We(s.x))&&(s=e.startPositions?.[0]?.position||new P);let o=r&&We(r.x)?Math.atan2(r.x,r.z):this.heading;this._cancelDrift(!1),this.velocity.set(0,0,0),this.speed=0,this.heading=We(o)?o:0,this.position.set(s.x,(s.y||0)+2.6,s.z),this.airborne=!0,this.airTime=0,this._fromRamp=!1,this._trick=!1,this.spinTimer=0,this.hitKind=null,this.stallTimer=0,this.boostTimer=0,this.respawnTimer=w1,this.respawnInvuln=Ep,this.invulnTimer=Math.max(this.invulnTimer,Ep),this.trackT=n,Bt.emit("kart:respawn",{kart:this})}reset(t,e){if(this._resetState(),this.shrinkTimer<=0)try{this.model?.setShrunk?.(1)}catch{}t&&We(t.x)&&this.position.copy(t),this.heading=We(e)?e:0,this.input=Il(),this._countdown.holdStart=-1;let n=this._surfaceInfo(this.position,void 0);n&&(this._applySurfaceInfo(n),this.position.y=this.groundHeight),this.bodyGroup.position.set(0,0,0),this.bodyGroup.rotation.set(0,0,0),this.bodyGroup.scale.set(1,1,1),this.bodyGroup.visible=!0,this.tiltGroup.rotation.set(0,0,0)}_surfaceInfo(t,e){try{let n=this.track?.getSurfaceInfo?.(t,e);return!n||!We(n.height)?null:n}catch{return null}}_applySurfaceInfo(t){this.groundHeight=t.height,t.normal&&We(t.normal.x)&&We(t.normal.y)?this.groundNormal.copy(t.normal):this.groundNormal.set(0,1,0),this.groundNormal.y<.2&&this.groundNormal.set(0,1,0),this.groundNormal.normalize(),this.surface=t.surface||(t.onRoad===!1?"offroad":"road"),this.onRoad=t.onRoad!==void 0?!!t.onRoad:this.surface!=="offroad",We(t.t)&&(this.trackT=(t.t%1+1)%1),We(t.lateral)&&(this.lateral=t.lateral)}_topSpeed(){let t=this.stats.maxSpeed*(We(this.maxSpeedScale)?this.maxSpeedScale:1);return this.shrinkTimer>0&&(t*=E1),this.surface==="offroad"&&this.boostTimer<=0&&this.starTimer<=0&&!this.airborne&&(t*=Ve.offroadMaxSpeedFactor),this.starTimer>0&&(t+=v1),this.boostTimer>0&&(t+=Ve.boostSpeedBonus*this.boostStrength),t}cancelDrivingInput(){this._cancelDrift(!1),this._prevDrift=!1,this._driftPending=0,this.input=Il()}_cancelDrift(t){if(!this.drifting){this.driftLevel=0,this.driftCharge=0;return}let e=this.driftLevel;if(this.drifting=!1,this.driftLevel=0,this.driftCharge=0,this.driftTime=0,Bt.emit("kart:driftEnd",{kart:this,level:e,fired:!!(t&&e>0)}),t&&e>0){let n=Ve.miniTurboTimes?.[e-1]??.5;Bt.emit("kart:miniTurbo",{kart:this,level:e}),this.applyBoost(n,p1[e-1]??1,"miniTurbo")}}_startDrift(t){this.drifting=!0,this.driftDir=t>=0?1:-1,this.driftLevel=0,this.driftCharge=0,this.driftTime=0,this._driftPending=0,Bt.emit("kart:driftStart",{kart:this,dir:this.driftDir})}update(t){if(t>0){t=Math.min(t,1/20);try{this._update(t)}catch(e){this._warned||(console.error("[kart] update failed",e),this._warned=!0),this.respawn()}}}_update(t){this.time+=t;let e=Ve;this.boostTimer>0&&(this.boostTimer=Math.max(0,this.boostTimer-t)),this.starTimer>0&&(this.starTimer=Math.max(0,this.starTimer-t)),this.invulnTimer>0&&(this.invulnTimer=Math.max(0,this.invulnTimer-t)),this.respawnInvuln>0&&(this.respawnInvuln=Math.max(0,this.respawnInvuln-t)),this.stallTimer>0&&(this.stallTimer=Math.max(0,this.stallTimer-t)),this.squashTimer>0&&(this.squashTimer=Math.max(0,this.squashTimer-t)),this._padCooldown>0&&(this._padCooldown-=t),this._jumpCooldown>0&&(this._jumpCooldown-=t),this._wallCooldown>0&&(this._wallCooldown-=t),this.bumpCooldown>0&&(this.bumpCooldown-=t),this._driftPending>0&&(this._driftPending-=t),this.spinTimer>0&&(this.spinTimer=Math.max(0,this.spinTimer-t),this.spinTimer===0&&(this.hitKind=null)),this.shrinkTimer>0&&(this.shrinkTimer=Math.max(0,this.shrinkTimer-t),this.shrinkTimer===0&&this._endShrink());let n=this.input||Il(),s=this.controlsLocked&&!this.finished;s&&this.isPlayer&&(this._rawThrottle()>.5?this._countdown.holdStart<0&&(this._countdown.holdStart=Du()):this._countdown.holdStart=-1);let r=s||this.spinTimer>0||this.stallTimer>0,o=r?0:bi(+n.throttle||0,0,1),a=r?0:bi(+n.brake||0,0,1),l=r?0:bi(+n.steer||0,-1,1),c=!r&&!!n.drift,h=c&&!this._prevDrift;if(this._prevDrift=!r&&!!n.drift,this.respawnTimer>0&&(o=0,a=0),this.steerSmoothed=sr(this.steerSmoothed,l,14,t),this.respawnTimer>0){this.respawnTimer=Math.max(0,this.respawnTimer-t),this.velocity.set(0,0,0),this.speed=0,this._animate(t,l,o);return}let u=this.forward,d=this.right,f=this.velocity.x*u.x+this.velocity.z*u.z,p=this.velocity.x*d.x+this.velocity.z*d.z,x=this._topSpeed(),g=this.boostTimer>0;if(this._boostKick>0&&(f<x&&(f=Math.min(x,f+this._boostKick)),this._boostKick=0),!this.airborne){if(g||this.starTimer>0&&o>0)f<x&&(f=Math.min(x,f+(g?_1:this.stats.accel*1.8)*t));else if(a>0&&a>=o)f>.5?f=Math.max(0,f-e.brakeDecel*a*t):f=Math.max(-e.reverseMaxSpeed,f-this.stats.accel*.7*a*t);else if(o>0){if(f<0)f=Math.min(0,f+e.brakeDecel*o*t)+(f>-1?this.stats.accel*o*t:0);else if(f<x){let W=f/Math.max(1,x),j=this.stats.accel*Math.max(.3,1.6-1.2*W)*o;f=Math.min(x,f+j*t)}}else{let W=e.coastDecel*t;f=Math.abs(f)<=W?0:f-Math.sign(f)*W}if(this.spinTimer>0){let W=(this.hitKind==="tumble"?30:22)*t;f=Math.abs(f)<=W?0:f-Math.sign(f)*W}if(f>x){let W=this.surface==="offroad"&&!g&&this.starTimer<=0?M1:y1;f=Math.max(x,f-W*t)}f<-e.reverseMaxSpeed&&(f=sr(f,-e.reverseMaxSpeed,8,t));let K=this.groundNormal;if(K.y>.3){let W=-(K.x*u.x+K.z*u.z)/K.y;f-=e.gravity*b1*W*t}}if(this.hopping&&(this.hopVel-=g1*t,this.hopY+=this.hopVel*t,this.hopY<=0&&(this.hopY=0,this.hopVel=0,this.hopping=!1,c&&!this.drifting&&f>yp*.8&&(Math.abs(l)>.25?this._startDrift(Math.sign(l)):this._driftPending=x1))),h&&!this.airborne&&!this.hopping&&!this.drifting&&(this.hopping=!0,this.hopVel=m1,this.hopY=.001,Bt.emit("kart:hop",{kart:this})),h&&this.airborne&&this._fromRamp&&!this._trick&&(this._trick=!0,this._trickTime=0,Bt.emit("kart:trick",{kart:this})),this._driftPending>0&&!this.drifting&&(c?Math.abs(l)>.3&&f>yp*.8&&this._startDrift(Math.sign(l)):this._driftPending=0),this.drifting&&(c?f<c1&&this._cancelDrift(!1):this._cancelDrift(!0)),this.drifting){if(this.driftTime+=t,!this.airborne&&this.surface!=="offroad"){let j=l*this.driftDir,wt=(j>=0?1+.4*j:1+.3*j)*this.stats.driftCharge;this.driftCharge+=wt*t}let K=e.driftChargeThresholds,W=0;for(let j=0;j<K.length;j++)this.driftCharge>=K[j]&&(W=j+1);W>this.driftLevel&&(this.driftLevel=W,Bt.emit("kart:driftLevel",{kart:this,level:W}))}let m=Math.abs(f),M=bi(m/i1,0,1),_=Math.max(1,this.stats.maxSpeed),v=this.stats.turnRate*M*(1-s1*bi(m/_,0,1)),w;if(this.drifting){let K=l*this.driftDir;w=this.driftDir*(h1+u1*K)*v*f1}else w=l*v*(f<-.5?-1:1),this.hopping&&(w*=1.15);this.airborne&&(w*=.4),this.spinTimer>0&&(w=0);let R=this.heading;this.heading=R-w*t;let T=u.x*f+d.x*p,C=u.z*f+d.z*p,b=this.forward,E=this.right,D=T*b.x+C*b.z,Y=T*E.x+C*E.z,H=Math.hypot(D,Y),X=this.airborne?a1:this.drifting?o1:this.spinTimer>0?3:r1;Y*=Math.exp(-X*t),this.drifting&&!this.airborne&&(Y-=this.driftDir*m*.12*t);let Z=Math.hypot(D,Y);if(Z>1e-4&&!this.airborne&&D>1){let K=Z+(H-Z)*l1,W=K*K-Y*Y;W>0&&(D=Math.max(D,Math.min(Math.sqrt(W),Math.max(x,D))))}T=b.x*D+E.x*Y,C=b.z*D+E.z*Y,this.velocity.x=T,this.velocity.z=C;let O=this.position;O.x+=T*t,O.z+=C*t,this.airborne&&(this.velocity.y-=e.gravity*t,O.y+=this.velocity.y*t,this.airTime+=t,this._trick&&(this._trickTime+=t)),this._resolveWalls();let ct=this._surfaceInfo(O,this.trackT);if(ct){let K=this.groundHeight;this._applySurfaceInfo(ct);let W=ct.height;if(this.airborne)O.y<=W&&this.velocity.y<=0?this._land(W):O.y<W-.5&&this._land(W);else{let j=O.y-W,wt=(W-K)/t;j>1&&wt<-8?(this.airborne=!0,this.airTime=0,this._fromRamp=!1,this.velocity.y=Math.max(0,this._lastGroundVy||0)):(O.y=W,this.velocity.y=0,this._lastGroundVy=bi(wt,-30,30))}this.airborne||(this.surface==="boost"&&this._padCooldown<=0?(this._padCooldown=.35,this.applyBoost(A1,1,"pad")):this.surface==="jump"&&this._jumpCooldown<=0&&D>6&&(this._jumpCooldown=.6,this.airborne=!0,this.airTime=0,this._fromRamp=!0,this._trick=!1,this.velocity.y=C1+I1*D,O.y+=.05,Bt.emit("kart:jump",{kart:this})))}this._checkValidity(ct),this.speed=this.velocity.x*this.forward.x+this.velocity.z*this.forward.z,this._animate(t,l,o)}_land(t){let e=-this.velocity.y;this.position.y=t,this.velocity.y=0;let n=this._fromRamp,s=this.airTime;this.airborne=!1,this.airTime=0,this._fromRamp=!1,this._landSquashVel=-Math.min(3.5,e*.12),(s>.12||n)&&Bt.emit("kart:land",{kart:this,impact:e,airTime:s}),this._trick&&(this._trick=!1,this.spinTimer<=0&&this.applyBoost(R1,.8,"trick"))}_resolveWalls(){let t=this.track;if(t?.resolveWall)for(let e=0;e<2;e++){let n=null;try{n=t.resolveWall(this.position,this.radius)}catch{n=null}if(!n||!n.normal||!We(n.depth)||n.depth<=0||(ui.set(n.normal.x||0,0,n.normal.z||0),ui.lengthSq()<1e-6))return;ui.normalize(),this.position.x+=ui.x*n.depth,this.position.z+=ui.z*n.depth;let s=this.velocity.x*ui.x+this.velocity.z*ui.z;if(s<0){let r=-s,o=this.velocity.x-ui.x*s,a=this.velocity.z-ui.z*s,l=1-S1*bi(r/12,0,1);this.velocity.x=o*l-ui.x*s*bp,this.velocity.z=a*l-ui.z*s*bp;let c=this.forward,h=c.x*ui.x+c.z*ui.z;if(h<0&&h>-.75&&Math.hypot(o,a)>4){let d=Math.atan2(o,a)-this.heading;d=Math.atan2(Math.sin(d),Math.cos(d)),this.heading=this.heading+d*.35}r>3&&this._wallCooldown<=0&&(this._wallCooldown=.25,this.drifting&&r>12&&this._cancelDrift(!1),Bt.emit("kart:wallBump",{kart:this,intensity:bi(r/25,0,1),impactSpeed:r}))}}}_checkValidity(t){let e=this.position,n=this.velocity,s=!We(e.x)||!We(e.y)||!We(e.z)||!We(n.x)||!We(n.y)||!We(n.z)||!We(this.heading);if(!s&&t){e.y<t.height-25&&(s=!0);let r=(this.track?.roadWidth||24)/2;We(t.lateral)&&Math.abs(t.lateral)>r+40&&(s=!0)}!s&&e.y<-500&&(s=!0),s&&(We(this.heading)||(this.object3D.rotation.y=0),this.respawn())}_animate(t,e,n){let s=this.bodyGroup,r=this.tiltGroup,o=this.heading,a=Math.sin(o),l=Math.cos(o),c=Math.cos(o),h=-Math.sin(o),u=0,d=0;if(this.airborne){let E=Math.max(4,Math.abs(this.speed));u=bi(-Math.atan2(this.velocity.y,E)*.6,-.4,.4)}else{let E=this.groundNormal;u=Math.atan2(E.x*a+E.z*l,E.y),d=Math.atan2(-(E.x*c+E.z*h),E.y)}this._boostPitch=sr(this._boostPitch,0,3,t),this._pitch=sr(this._pitch,u-this._boostPitch,this.airborne?4:12,t),this._roll=sr(this._roll,d,12,t),r.rotation.x=this._pitch,r.rotation.z=this._roll;let f=this.drifting?-this.driftDir*d1*(.85+.15*e*this.driftDir):0;this._bodyYaw=sr(this._bodyYaw,f,10,t);let p=0;this._lean=sr(this._lean,p,8,t);let x=0,g=0,m=0,M=0;if(this.spinTimer>0){M=1-this.spinTimer/Math.max(.01,this.spinDuration);let E=1-Math.pow(1-M,2.2);this.hitKind==="tumble"?(g=-E*Cl,m=Math.sin(Math.min(1,M*1.4)*Math.PI)*2.2,x=E*Math.PI*.5):this.hitKind==="stall"?x=Math.sin(M*Math.PI*6)*.18*(1-M):this.hitKind==="shrink"?x=E*Cl:x=E*Cl*2}let _=0;this._trick&&(_=Math.min(1,this._trickTime/.45)*Cl*(this.index%2?1:-1));let v=180,w=14;this._landSquashVel+=(-v*this._landSquash-w*this._landSquashVel)*t,this._landSquash+=this._landSquashVel*t,Math.abs(this._landSquash)<1e-4&&Math.abs(this._landSquashVel)<.001&&(this._landSquash=0,this._landSquashVel=0);let R=bi(this._landSquash,-.35,.35),T=1+R,C=1-R*.5;if(this.squashTimer>0){let E=Math.min(1,this.squashTimer/.3);T*=1-.65*E,C*=1+.35*E}s.position.y=this.hopY+m+(this.respawnTimer>0?Math.sin(this.time*6)*.1:0),s.rotation.set(g,this._bodyYaw+x,this._lean+_,"YXZ"),s.scale.set(C,T,C),s.visible=this.respawnInvuln>0?Math.floor(this.time*16)%2===0:!0;let b=this.model;if(b?.animate)try{b.animate({dt:t,speed:this.speed,steer:this.steerSmoothed,drifting:this.drifting,driftDir:this.driftDir,driftLevel:this.driftLevel,boosting:this.boostTimer>0,airborne:this.airborne||this.hopping,spin:M,star:this.starTimer>0,shrunk:this.shrinkTimer>0,throttle:n,time:this.time})}catch(E){this._animWarned||(console.warn("[kart] model.animate failed",E),this._animWarned=!0)}}dispose(){for(let t of this._unsubs)try{t()}catch{}this._unsubs.length=0,this.object3D.parent?.remove(this.object3D);try{this.model?.dispose?.()}catch{}this.model=null}};function Du(){return(typeof performance<"u"?performance.now():Date.now())/1e3}function P1(i){if(!Array.isArray(i))return;let t=i.length;for(let e=0;e<t;e++){let n=i[e];if(!(!n||n.respawnTimer>0))for(let s=e+1;s<t;s++){let r=i[s];if(!r||r.respawnTimer>0)continue;let o=r.position.x-n.position.x,a=r.position.z-n.position.z,l=r.position.y-n.position.y;if(Math.abs(l)>2.2)continue;let c=n.radius+r.radius,h=o*o+a*a;if(h>=c*c)continue;let u=Math.sqrt(h),d,f;if(u<1e-4){let T=(e*7+s*13)%6.28;d=Math.cos(T),f=Math.sin(T),u=0}else d=o/u,f=a/u;let p=c-u,x=n.starTimer>0,g=r.starTimer>0,m=(n.velocity.x-r.velocity.x)*d+(n.velocity.z-r.velocity.z)*f;if(x&&!g)r.applyHit("spin");else if(g&&!x)n.applyHit("spin");else if(!x&&!g){let T=n.shrinkTimer>0,C=r.shrinkTimer>0;T&&!C?n.applyHit("squash"):C&&!T&&r.applyHit("squash")}let M=n.mass||1,_=r.mass||1,v=1/(M+_);if(n.position.x-=d*p*_*v,n.position.z-=f*p*_*v,r.position.x+=d*p*M*v,r.position.z+=f*p*M*v,m>0){let C=1.55*m/(1/M+1/_);n.velocity.x-=C/M*d,n.velocity.z-=C/M*f,r.velocity.x+=C/_*d,r.velocity.z+=C/_*f}let w=Math.min(6,p*6);n.velocity.x-=d*w*_*v,n.velocity.z-=f*w*_*v,r.velocity.x+=d*w*M*v,r.velocity.z+=f*w*M*v;let R=Math.max(0,m);R>2&&(n.bumpCooldown||0)<=0&&(r.bumpCooldown||0)<=0&&(n.bumpCooldown=.3,r.bumpCooldown=.3,Bt.emit("kart:bump",{a:n,b:r,intensity:bi(R/20,0,1),impactSpeed:R}))}}}var zu={};ys(zu,{AIDriver:()=>Ou});var Wn=(i,t,e)=>i<t?t:i>e?e:i,$i=i=>Number.isFinite(i),Wo=i=>(i%1+1)%1,Nu=i=>Math.atan2(Math.sin(i),Math.cos(i)),Fu=new P,L1=new P,Ou=class{constructor(t,e,{difficulty:n="normal",personality:s=null}={}){this.kart=t,this.track=e,this.difficulty=vu[n]?n:"normal",this.cfg=vu[this.difficulty],this.skill=Wn(this.cfg.aiSkill??.75,0,1);let r=()=>Math.random(),o=s||{};this.laneBias=o.laneBias??(r()*2-1)*.6,this.laneWeave=o.laneWeave??.12+r()*.2,this.laneFreq=.04+r()*.07,this.lanePhase=r()*Math.PI*2,this.aggression=o.aggression??r(),this.driftLove=Wn(o.driftLove??this.skill+(r()-.5)*.35,.1,1),this.lookMul=o.lookMul??.9+r()*.25,this.caution=o.caution??.9+r()*.2,this.reaction=.15+(1-this.skill)*.6+r()*.3,this.noiseAmp=(1-this.skill)*.12,this.time=r()*100,this.prevErr=0,this.stuckTime=0,this.reverseTime=0,this.recoveries=[],this.wrongWayTime=0,this.driftCooldown=0,this.driftOppositeTime=0,this.driftTargetLevel=2+(r()<this.skill?1:0),this.itemHoldTime=0,this.itemCooldown=0,this.lastItem=null,this.avoidOffset=0,this.lastProgress=null,this.progressTimer=0,this._unsubs=[Bt.on("race:go",()=>{if(this.kart&&Math.random()<this.skill*.8){let a=Math.random()<this.skill,l=Math.random()*.15;setTimeout(()=>this.kart?.applyBoost?.(a?1.2:.6,a?1:.7,"start"),l*1e3)}})]}_neutral(){let t=this.kart.input||(this.kart.input={});return t.throttle=0,t.brake=0,t.steer=0,t.drift=!1,t.item=!1,t.lookBack=!1,t}update(t,e={}){let n=this.kart,s=this.track;if(!(!n||!s||!(t>0)))try{this._update(Math.min(t,.05),e||{})}catch(r){this._warned||(console.error("[ai] update failed",r),this._warned=!0),this._neutral()}}_update(t,e){let n=this.kart,s=this.track;this.time+=t;let r=this._neutral();if(n.controlsLocked&&!n.finished){this.stuckTime=0,this.prevErr=0;return}let o=Math.max(100,s.length||1e3),a=(s.roadWidth||24)/2,l=Wo(n.trackT||0),c=n.speed||0,h=Math.abs(c),u=n.heading,d=Math.sin(u),f=Math.cos(u),p=n.spinTimer>0||n.respawnTimer>0||n.stallTimer>0;this._rubberBand(e);let x=this._tangent(l),g=d*x.x+f*x.z,m=this._cornerAngle(l,5,5+Math.max(20,h*.9)),M=this._cornerAngle(l,10,10+Math.max(35,h*1.6)),_=Math.max(Math.abs(m),Math.abs(M)*.8),v=this.laneBias*a*.55+Math.sin(this.time*this.laneFreq*Math.PI*2+this.lanePhase)*a*this.laneWeave;v*=1-Wn(_/1.2,0,.75);let w=this._avoidance(e,l,o,a,v);this.avoidOffset+=(w-this.avoidOffset)*(1-Math.exp(-6*t)),v=Wn(v+this.avoidOffset,-a*.8,a*.8);let R=(7+h*.42)*this.lookMul,T=Wo(l+R/o),C=this._racingPoint(T,L1),b=this._tangent(T),E=0;try{let It=s.getPointAt(T);It&&$i(It.x)&&(E=(C.x-It.x)*-b.z+(C.z-It.z)*b.x)}catch{E=0}let D=Math.max(1,a-2.2),H=Wn(E+v,-D,D)-E;C.x+=-b.z*H,C.z+=b.x*H;let X=C.x-n.position.x,Z=C.z-n.position.z,O=Math.atan2(X,Z),ct=Nu(O-u);ct+=Math.sin(this.time*1.7+this.lanePhase)*this.noiseAmp*.2;let K=(ct-this.prevErr)/t;this.prevErr=ct;let W=Wn(-(ct*2.8)-Wn(K,-8,8)*.06,-1,1),j=1,wt=0,Yt=n.stats?.turnRate||2,te=Math.max(20,h*.9),rt=Math.abs(m)/te;if(rt>1e-4){let It=n.drifting,dt=Yt*(It?1.05:.9)/rt*this.caution*(.85+this.skill*.25);h>dt+4&&(j=.2),h>dt+10&&(j=0,wt=.6)}Math.abs(ct)>1.2&&h>14&&(j=.3),this.driftCooldown-=t;let mt=!1;if(n.drifting){mt=!0;let It=n.driftDir,dt=n.velocity.x,zt=n.velocity.z,ie=Math.hypot(dt,zt)>3?Math.atan2(dt,zt):u,Vt=Nu(O-ie),oe=Math.max(.5,(n.stats?.turnRate||2)*1.08*(1-.16*Wn(h/(n.stats?.maxSpeed||38),0,1))),at=-Vt*3.2+-m/Math.max(.6,te/Math.max(8,h)),St=n.lateral||0,L=Wn((Math.abs(St)-a*.7)/(a*.3),0,1),xt=((at-Math.sign(St)*L*.9)*It/oe-.62)/.5;W=Wn(xt,-1,1)*It,xt<-1.6?this.driftOppositeTime+=t:this.driftOppositeTime=Math.max(0,this.driftOppositeTime-t);let Ut=Ve.driftChargeThresholds?.[n.driftLevel],Pt=Ut!==void 0&&Ut-(n.driftCharge||0)<.3*this.skill,ee=Math.abs(m)<.12&&Math.abs(Vt)<.15&&!Pt,Et=this.driftOppositeTime>.35?"opposite":ee?"ending":n.driftTime>4.5?"long":n.driftLevel>=this.driftTargetLevel&&Math.abs(m)<.3?"charged":n.surface==="offroad"?"offroad":Math.abs(n.lateral||0)>a*.82&&Math.sign(n.lateral||0)===-It?"edge":null;Et&&(this.lastDriftRelease=Et,mt=!1,this.driftCooldown=.35+(1-this.skill)*.5)}else!(this._driftAttempt>0)&&this.driftCooldown<=0&&!p&&!n.airborne&&h>18&&Math.abs(M)>.55-this.driftLove*.15&&Math.sign(M)===Math.sign(-W||M)&&h*Math.abs(M)/Math.max(35,h*1.6)>(n.stats?.turnRate||2)*.2&&Math.abs(W)>.2&&(Math.random()<this.driftLove*.9+.05?(mt=!0,this._driftAttempt=.5,this._driftSteerDir=M>0?-1:1,this.driftTargetLevel=Math.random()<this.skill?3:2):this.driftCooldown=1);if(n.drifting?this._driftAttempt=0:this._driftAttempt>0&&(this._driftAttempt-=t,mt=!0,(Math.abs(W)<.35||Math.sign(W)!==this._driftSteerDir)&&(W=this._driftSteerDir*.6),(this._driftAttempt<=0||p)&&(mt=!1,this._driftAttempt=0,this.driftCooldown=.6)),g<-.3&&!p?this.wrongWayTime+=t:this.wrongWayTime=Math.max(0,this.wrongWayTime-t),!p&&!n.airborne&&this.reverseTime<=0&&h<2.5&&j>0?this.stuckTime+=t:h>5&&(this.stuckTime=0),this.progressTimer+=t,this.progressTimer>4){let It=l;if(this.lastProgress!==null&&!n.finished){let dt=It-this.lastProgress;dt-=Math.round(dt),dt<8/o&&!p&&!n.controlsLocked&&this._forceRespawn()}this.lastProgress=It,this.progressTimer=0}this.stuckTime>1.1&&(this.stuckTime=0,this.reverseTime=.9,this.recoveries.push(this.time)),this.recoveries=this.recoveries.filter(It=>this.time-It<12),(this.recoveries.length>=3||this.wrongWayTime>7)&&(this.recoveries.length=0,this.wrongWayTime=0,this._forceRespawn()),this.reverseTime>0&&(this.reverseTime-=t,j=0,wt=1,mt=!1,W=Wn(ct*3,-1,1)),r.throttle=j,r.brake=wt,r.steer=Wn(W,-1,1),r.drift=mt,r.item=this._items(t,e,M,p)}_forceRespawn(){this.stuckTime=0,this.reverseTime=0;try{this.kart.respawn?.()}catch{}}_rubberBand(t){let e=this.kart,n=this.cfg.aiSpeedFactor??.94,s=this.cfg.rubberBand??.1,r=t.player,o=n;if(r&&r!==e&&!r.finished&&!e.finished&&$i(r.raceProgress)&&$i(e.raceProgress)){let a=Math.max(100,this.track.length||1e3),l=(e.raceProgress-r.raceProgress)*a;l<0?o=n+s*Wn(-l/160,0,1)*1.1:o=n-s*.8*Wn(l/200,0,1)}else e.finished&&(o=n*.9);e.maxSpeedScale=o}_tangent(t){try{let e=this.track.getTangentAt(Wo(t));if(e&&$i(e.x)&&(Fu.set(e.x,0,e.z),Fu.lengthSq()>1e-8))return Fu.normalize().clone()}catch{}return new P(0,0,1)}_racingPoint(t,e){let n=null;try{n=this.track.getRacingLine?this.track.getRacingLine(t):this.track.getPointAt(t)}catch{n=null}if(!n||!$i(n.x))try{n=this.track.getPointAt(t)}catch{n=null}return!n||!$i(n.x)?e.set(0,0,0):e.copy(n)}_cornerAngle(t,e,n){let s=Math.max(100,this.track.length||1e3),r=this._tangent(t+e/s),o=this._tangent(t+n/s),a=Math.atan2(r.x,r.z),l=Math.atan2(o.x,o.z);return Nu(l-a)}_avoidance(t,e,n,s,r){let o=this.kart,a=Math.sin(o.heading),l=Math.cos(o.heading),c=-Math.cos(o.heading),h=Math.sin(o.heading),u=0,d=18+Math.abs(o.speed||0)*.6,f=null;try{f=t.itemSystem?.getHazards?.()}catch{f=null}if(Array.isArray(f)&&f.length){let x=[],g=this._lineLat(e)+r,m=s-1.8;for(let M of f){let _=M?.position;if(!_||!$i(_.x))continue;let v=_.x-o.position.x,w=_.z-o.position.z;if(v*v+w*w>d*d*1.5)continue;let R=this._hazardInfo(M,_,e);if(!R)continue;let T=R.t-e;T-=Math.round(T);let C=T*n;if(C<1.5||C>d||!this._hazardSeen(M,C,d))continue;let b=this._lineLat(R.t)+r,E=(M.radius||1)+(o.radius||1.3)+.9;x.push([R.lateral-E-b,R.lateral+E-b])}if(x.length){let M=[0];for(let[v,w]of x)M.push(v-.01,w+.01);let _=null;for(let v of M){if(Math.abs(g+v)>m)continue;let w=!1;for(let[R,T]of x)if(v>R&&v<T){w=!0;break}!w&&(_===null||Math.abs(v)<Math.abs(_))&&(_=v)}_!==null&&(u+=_)}}let p=t.karts;if(Array.isArray(p))for(let x of p){if(!x||x===o)continue;let g=x.position.x-o.position.x,m=x.position.z-o.position.z,M=g*a+m*l;if(M<.5||M>14||(o.speed||0)-(x.speed||0)<1&&M>5)continue;let v=g*c+m*h,w=(x.radius||1.3)+(o.radius||1.3)+.8;if(Math.abs(v)<w){let R=v>=0?-1:1;u+=R*(w-Math.abs(v))*.9}}return Wn(u,-s*.8,s*.8)}_lineLat(t){try{let e=this.track;if(!e.getRacingLine)return 0;let n=e.getRacingLine(Wo(t)),s=e.getPointAt(Wo(t)),r=this._tangent(t);return!n||!s||!$i(n.x)?0:(n.x-s.x)*-r.z+(n.z-s.z)*r.x}catch{return 0}}_hazardInfo(t,e,n){this._hzCache||(this._hzCache=new WeakMap);let s=null;try{s=this._hzCache.get(t)}catch{s=null}if(s&&Math.abs(s.x-e.x)<.5&&Math.abs(s.z-e.z)<.5)return s.info;let r=null;try{r=this.track.getSurfaceInfo(e,n)}catch{r=null}if(!r||!$i(r.t)||!$i(r.lateral))return null;let o={t:r.t,lateral:r.lateral};try{this._hzCache.set(t,{x:e.x,z:e.z,info:o})}catch{}return o}_hazardSeen(t,e,n){this._seen||(this._seen=new WeakMap);let s=this._seen.get(t);if(s===void 0){s=Math.random()<.25+this.skill*.75;try{this._seen.set(t,s)}catch{return s}}return s&&e<n*(.55+this.skill*.45)}_items(t,e,n,s){let r=this.kart;this.itemCooldown>0&&(this.itemCooldown-=t);let o=r.item;if(!o)return this.itemHoldTime=0,this.lastItem=null,!1;if(o!==this.lastItem&&(this.itemHoldTime=0,this.lastItem=o),this.itemHoldTime+=t,s||this.itemCooldown>0||this.itemHoldTime<this.reaction)return!1;let a=this.itemHoldTime,l=.5+this.aggression,c=r.place||4,h=Math.abs(n)<.3,u=this._relKarts(e),d=!1;switch(o){case"star":d=!0;break;case"mushroom":case"triple_mushroom":d=h&&(r.speed||0)>14&&(c>1||a>5/l)||r.surface==="offroad"&&(r.speed||0)<22||a>12;break;case"banana":d=u.some(f=>f.ahead<-2&&f.ahead>-20&&Math.abs(f.side)<4)||a>14/l;break;case"green_shell":d=u.some(f=>f.ahead>4&&f.ahead<45&&Math.abs(f.side)<1.2+f.ahead*.06)||a>10&&u.some(f=>f.ahead<-2&&f.ahead>-15&&Math.abs(f.side)<3)||a>16/l;break;case"red_shell":d=c>1&&u.some(f=>f.ahead>5&&f.ahead<90&&Math.abs(f.angle)<.8)||a>8/l;break;case"blue_shell":d=a>1.2;break;case"lightning":d=c>1&&a>1||a>14;break;default:d=a>3}return r.finished&&a>2&&(d=!0),d&&(this.itemCooldown=o==="triple_mushroom"?.9+Math.random()*.6:.5+Math.random()*.6,o!=="triple_mushroom"&&(this.itemHoldTime=0)),d}_relKarts(t){let e=this.kart,n=[],s=t.karts;if(!Array.isArray(s))return n;let r=e.heading,o=Math.sin(r),a=Math.cos(r),l=-Math.cos(r),c=Math.sin(r);for(let h of s){if(!h||h===e)continue;let u=h.position.x-e.position.x,d=h.position.z-e.position.z,f=u*o+d*a,p=u*l+d*c;n.push({kart:h,ahead:f,side:p,angle:Math.atan2(p,f)})}return n}dispose(){for(let t of this._unsubs)try{t()}catch{}this._unsubs.length=0,this.kart=null}};var Ku={};ys(Ku,{ItemSystem:()=>Zu});var Vu={};ys(Vu,{configureReflections:()=>D1,createCharacterPortrait:()=>lM,createItemModel:()=>kl,createKartModel:()=>J1});var Xo=new P;function Si(i,t,e,n,s,r){let o=2*Math.PI*s/4,a=Math.max(r-2*s,0),l=Math.PI/4;Xo.copy(t),Xo[n]=0,Xo.normalize();let c=.5*o/(o+a),h=1-Xo.angleTo(i)/l;return Math.sign(Xo[e])===1?h*c:a/(o+a)+c+c*(1-h)}var Ei=class extends Oe{constructor(t=1,e=1,n=1,s=2,r=.1){if(s=s*2+1,r=Math.min(t/2,e/2,n/2,r),super(1,1,1,s,s,s),s===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let a=new P,l=new P,c=new P(t,e,n).divideScalar(2).subScalar(r),h=this.attributes.position.array,u=this.attributes.normal.array,d=this.attributes.uv.array,f=h.length/6,p=new P,x=.5/s;for(let g=0,m=0;g<h.length;g+=3,m+=2)switch(a.fromArray(h,g),l.copy(a),l.x-=Math.sign(l.x)*x,l.y-=Math.sign(l.y)*x,l.z-=Math.sign(l.z)*x,l.normalize(),h[g+0]=c.x*Math.sign(a.x)+l.x*r,h[g+1]=c.y*Math.sign(a.y)+l.y*r,h[g+2]=c.z*Math.sign(a.z)+l.z*r,u[g+0]=l.x,u[g+1]=l.y,u[g+2]=l.z,Math.floor(g/f)){case 0:p.set(1,0,0),d[m+0]=Si(p,l,"z","y",r,n),d[m+1]=1-Si(p,l,"y","z",r,e);break;case 1:p.set(-1,0,0),d[m+0]=1-Si(p,l,"z","y",r,n),d[m+1]=1-Si(p,l,"y","z",r,e);break;case 2:p.set(0,1,0),d[m+0]=1-Si(p,l,"x","z",r,t),d[m+1]=Si(p,l,"z","x",r,n);break;case 3:p.set(0,-1,0),d[m+0]=1-Si(p,l,"x","z",r,t),d[m+1]=1-Si(p,l,"z","x",r,n);break;case 4:p.set(0,0,1),d[m+0]=1-Si(p,l,"x","y",r,t),d[m+1]=1-Si(p,l,"y","x",r,e);break;case 5:p.set(0,0,-1),d[m+0]=Si(p,l,"x","y",r,t),d[m+1]=1-Si(p,l,"y","x",r,e);break}}};var bt=Math.PI,me=bt*2,Ji=(i,t,e)=>i<t?t:i>e?e:i,to=(i,t,e,n)=>i+(t-i)*(1-Math.exp(-e*n)),rr=(i,t=0)=>Number.isFinite(i)?i:t,Bu=new ft;function or(i,t=1,e=1,n=0){let s={};return Bu.setHex(i).getHSL(s),Bu.setHSL(s.h,Ji(s.s*e,0,1),Ji(s.l*t+n,0,1)),Bu.getHex()}function wi(i){return"#"+(i>>>0).toString(16).padStart(6,"0").slice(-6)}function qo(i,t,e=1,n=0){return wi(or(i,t,e,n))}var eo=null,Lp=!0;function D1(i){Lp=i}function fi(){if(!Lp)return null;if(eo)return eo;let i=document.createElement("canvas");i.width=512,i.height=256;let t=i.getContext("2d"),e=t.createLinearGradient(0,0,0,256);e.addColorStop(0,"#3f78c9"),e.addColorStop(.35,"#9cc8f2"),e.addColorStop(.49,"#f4fbff"),e.addColorStop(.52,"#b9b49a"),e.addColorStop(.7,"#6f7d4e"),e.addColorStop(1,"#3a4428"),t.fillStyle=e,t.fillRect(0,0,512,256);let n=(s,r,o,a,l)=>{let c=t.createRadialGradient(s,r,0,s,r,o);c.addColorStop(0,`rgba(255,255,255,${l})`),c.addColorStop(1,"rgba(255,255,255,0)"),t.save(),t.translate(s,r),t.scale(1,a/o),t.translate(-s,-r),t.fillStyle=c,t.beginPath(),t.arc(s,r,o,0,me),t.fill(),t.restore()};return n(120,50,60,26,1),n(330,70,90,20,.75),n(450,40,40,30,.8),n(256,124,260,10,.5),eo=new jn(i),eo.mapping=bo,eo.colorSpace=Ke,eo}var Tp=new Map;function qn(i,t){let e=Tp.get(i);return e||(e=t(),e.userData.shared=!0,Tp.set(i,e)),e}function we(i,t=.55,e=0,n=null,s=""){return qn(`std:${i}:${t}:${e}:${s}`,()=>new ye({color:i,roughness:t,metalness:e,envMap:fi(),envMapIntensity:.8,...n||{}}))}function ni(i,t=""){return qn(`gloss:${i}:${t}`,()=>new ci({color:i,roughness:.3,metalness:.05,clearcoat:1,clearcoatRoughness:.08,envMap:fi(),envMapIntensity:.6}))}function k1(i){return qn(`basic:${i}`,()=>new Sn({color:i}))}var Jt={get chassis(){return we(2830136,.5,.2)},get rubber(){return we(1842465,.8,0)},get seat(){return we(2301994,.45,0,{envMapIntensity:.5},"seat")},get chrome(){return we(15922424,.12,1,{envMapIntensity:1.25},"chrome")},get gunmetal(){return we(5988974,.32,.85,{envMapIntensity:1},"gun")},get gold(){return we(16762416,.22,1,{envMapIntensity:1.3},"gold")},get white(){return we(16777215,.45,0)},get eyeWhite(){return we(16777215,.2,0,null,"eye")},get pupil(){return we(855314,.15,0,null,"pupil")},get shine(){return k1(16777215)},get mouth(){return we(8003371,.5,0)},get blush(){return we(16747162,.7,0,{transparent:!0,opacity:.55,depthWrite:!1},"blush")},get lens(){return we(16776166,.1,0,{emissive:16773808,emissiveIntensity:.9},"lens")},get ivory(){return we(16774102,.45,0)},get cream(){return we(16773596,.6,0)}},wp=new Map;function no(i,t,e=256,n=256,s={}){let r=wp.get(i);if(r)return r;let o=document.createElement("canvas");return o.width=e,o.height=n,t(o.getContext("2d"),e,n),r=new jn(o),r.colorSpace=s.linear?Hi:Ke,r.anisotropy=4,s.repeat&&(r.wrapS=r.wrapT=Xi,r.repeat.set(s.repeat[0],s.repeat[1])),r.userData.shared=!0,wp.set(i,r),r}function Ll(i,t,e,n,s,r){i.beginPath(),i.moveTo(t+r,e),i.arcTo(t+n,e,t+n,e+s,r),i.arcTo(t+n,e+s,t,e+s,r),i.arcTo(t,e+s,t,e,r),i.arcTo(t,e,t+n,e,r),i.closePath()}function U1(){return no("tire",(i,t,e)=>{i.fillStyle="#8a8a8a",i.fillRect(0,0,t,e),i.fillStyle="#6e6e6e",i.fillRect(0,0,t,e*.2),i.fillRect(0,e*.8,t,e*.2),i.strokeStyle="#1a1a1a",i.lineWidth=9,i.lineCap="round";let n=22;for(let s=0;s<n+1;s++){let r=s/n*t;i.beginPath(),i.moveTo(r-10,e*.24),i.lineTo(r+8,e*.5),i.lineTo(r-10,e*.76),i.stroke()}i.fillStyle="#2a2a2a",i.fillRect(0,e*.47,t,e*.06)},512,128,{linear:!1})}function Dp(){return no("hex",(i,t,e)=>{i.fillStyle="#ffffff",i.fillRect(0,0,t,e);let n=t/6,s=Math.sqrt(3)*n;i.strokeStyle="#9a9a9a",i.lineWidth=7;for(let r=-1;r<8;r++)for(let o=-1;o<5;o++){let a=r*1.5*n,l=o*s+(r%2?s/2:0);i.beginPath();for(let c=0;c<6;c++){let h=c/6*me,u=a+Math.cos(h)*n*.92,d=l+Math.sin(h)*n*.92;c===0?i.moveTo(u,d):i.lineTo(u,d)}i.closePath(),i.stroke()}},256,Math.round(3*Math.sqrt(3)*256/6),{repeat:[4,2]})}function N1(i,t,e){return no(`num:${i}:${t}:${e}`,(n,s,r)=>{n.clearRect(0,0,s,r),n.beginPath(),n.arc(s/2,r/2,s/2-4,0,me),n.fillStyle="#ffffff",n.fill(),n.lineWidth=12,n.strokeStyle=wi(e===16777215?2238513:e),n.stroke(),n.beginPath(),n.arc(s/2,r/2,s/2-16,0,me),n.lineWidth=4,n.strokeStyle=wi(t),n.stroke(),n.fillStyle=wi(or(t,.8)),n.font=`900 ${Math.round(s*.62)}px "Arial Black", "Lilita One", Arial, sans-serif`,n.textAlign="center",n.textBaseline="middle",n.fillText(String(i),s/2,r/2+s*.04)},128,128)}function F1(i,t,e){return no(`name:${i}:${t}:${e}`,(n,s,r)=>{n.clearRect(0,0,s,r);let o=String(i||"").toUpperCase();n.font=`italic 900 ${Math.round(r*.7)}px "Arial Black", "Lilita One", Arial, sans-serif`,n.textAlign="center",n.textBaseline="middle",n.lineJoin="round",n.lineWidth=10,n.strokeStyle="rgba(15,15,25,0.9)",n.strokeText(o,s/2,r/2+3);let a=new ft(e).getHSL({}).l;n.fillStyle=wi(e),Math.abs(a-new ft(t).getHSL({}).l)<.12&&(n.fillStyle="#ffffff"),n.fillText(o,s/2,r/2+3),n.fillStyle="rgba(255,255,255,0.65)";for(let l=0;l<3;l++)n.fillRect(6,r*.3+l*r*.16,22-l*6,4)},256,64)}function O1(i,t){return no(`emb:${i}:${t}`,(e,n,s)=>{e.clearRect(0,0,n,s),e.beginPath(),e.arc(n/2,s/2,n/2-3,0,me),e.fillStyle="#ffffff",e.fill(),e.fillStyle=wi(t),e.font=`900 ${Math.round(n*.66)}px "Arial Black", "Lilita One", Arial, sans-serif`,e.textAlign="center",e.textBaseline="middle",e.fillText(i,n/2,s/2+n*.05)},128,128)}function Hu(i){return qn(`decal:${i.uuid}`,()=>new ye({map:i,alphaTest:.5,roughness:.3,metalness:0,envMap:fi(),envMapIntensity:.6,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}))}var Qt=(i=0,t=0,e=0)=>new P(i,t,e),ar=Qt(0,1,0),Dl=Qt(0,0,1);function _t(i=[0,0,0],t=[0,0,0],e=1){let n=typeof e=="number"?Qt(e,e,e):Qt(e[0],e[1],e[2]);return new ue().compose(Qt(i[0],i[1],i[2]),new yn().setFromEuler(new bn(t[0],t[1],t[2],t[3]||"XYZ")),n)}function en(i,t,e=1){let n=typeof e=="number"?Qt(e,e,e):Qt(e[0],e[1],e[2]);return new ue().compose(i.isVector3?i:Qt(i[0],i[1],i[2]),t,n)}function ps(i,t){return new yn().setFromUnitVectors(i.clone().normalize(),t.clone().normalize())}function Xn(i,t=0){let e=ps(Dl,i);return t&&e.multiply(new yn().setFromAxisAngle(Dl,t)),e}function Ti(i,t){return Qt(Math.sin(i)*Math.cos(t),Math.sin(t),Math.cos(i)*Math.cos(t))}function Fs(i,t){let e=new Ls,n=i.length,s=i.map(r=>new pt(r[0],r[1]));for(let r=0;r<n;r++){let o=s[(r-1+n)%n],a=s[r],l=s[(r+1)%n],c=Array.isArray(t)?t[r]:t,h=o.clone().sub(a),u=l.clone().sub(a),d=Math.min(c,h.length()*.45,u.length()*.45),f=a.clone().add(h.normalize().multiplyScalar(d)),p=a.clone().add(u.normalize().multiplyScalar(d));r===0?e.moveTo(f.x,f.y):e.lineTo(f.x,f.y),e.quadraticCurveTo(a.x,a.y,p.x,p.y)}return e.closePath(),e}var Ai=class{constructor(){this.parts=new Map,this.stack=[new ue]}top(){return this.stack[this.stack.length-1]}push(t){return this.stack.push(this.top().clone().multiply(t)),this}pop(){return this.stack.length>1&&this.stack.pop(),this}add(t,e,n=null){let s=t.index?t.toNonIndexed():t.clone();t.dispose();for(let a of Object.keys(s.attributes))a!=="position"&&a!=="normal"&&a!=="uv"&&s.deleteAttribute(a);s.attributes.normal||s.computeVertexNormals(),s.attributes.uv||s.setAttribute("uv",new Ie(new Float32Array(s.attributes.position.count*2),2)),s.morphAttributes={},s.clearGroups(),s.applyMatrix4(n?this.top().clone().multiply(n):this.top());let r=typeof e=="string"?"slot:"+e:e.uuid,o=this.parts.get(r);return o||(o={material:e,geos:[]},this.parts.set(r,o)),o.geos.push(s),this}build(){let t=[];for(let e of this.parts.values()){let n=je(e.geos,!1);e.geos.forEach(s=>s.dispose()),n&&(n.computeBoundingSphere(),n.userData.shared=!0,t.push({material:e.material,geometry:n}))}return this.parts.clear(),t}};function Oi(i,t,e=!0){let n=new pe;for(let s of i){let r=typeof s.material=="string"?t[s.material]:s.material,o=new $t(s.geometry,r);o.castShadow=e,o.receiveShadow=!1,n.add(o)}return n}var jt=(i=1,t=24,e=16,...n)=>new ti(i,t,e,...n),z1={blaze:{hair:7027484,eye:3108832,mustache:"small",gloves:!0},zippy:{hair:5911318,eye:3054922,freckles:!0,gloves:!0,tuft:!0},bella:{hair:16766287,eye:3049182,longHair:!0,lashes:!0,gloves:!0,lips:!0},toadly:{eye:1776420,gloves:!0,vest:!0},rex:{eye:16748288,snout:"dino",gloves:!1,tail:!0,brows:"dino"},grumbo:{hair:2891026,eye:6953882,mustache:"big",brows:"grumpy",wide:1.18,bigNose:!0,gloves:!0},koopz:{eye:1402304,snout:"beak",gloves:!1},dotty:{hair:7159848,eye:9315498,pigtails:!0,lashes:!0,gloves:!0,bowColor:16732058}};function kp(i){let t=z1[i.id];if(t)return t;let e=i.hat||"cap";return{hair:5913120,eye:3364215,gloves:e!=="horns"&&e!=="shell",snout:e==="horns"?"dino":e==="shell"?"beak":null}}function Up(i){let t=i||{};return{id:t.id||"racer",name:t.name||"Racer",color:Number.isFinite(t.color)?t.color:15022389,accent:Number.isFinite(t.accent)?t.accent:16777215,skin:Number.isFinite(t.skin)?t.skin:16764057,hat:t.hat||"cap"}}var fe={rearR:.33,rearW:.3,rearX:.66,rearZ:-.7,frontR:.28,frontW:.25,frontX:.64,frontZ:.74,wheelC:Qt(0,.92,.28),wheelTilt:.75,wheelRad:.17,hip:Qt(0,.5,-.36),neck:Qt(0,.55,.02),headR:.3,exhaustTilt:.35};function B1(i,t){let e=i*.6,n=Math.min(.085,t*.32),s=[];s.push(new pt(e,-t*.44)),s.push(new pt(i-n,-t/2));for(let o=1;o<5;o++){let a=-bt/2+o/5*(bt/2);s.push(new pt(i-n+n*Math.cos(a),-t/2+n+n*Math.sin(a)))}for(let o=0;o<=4;o++){let a=-t/2+n+o/4*(t-2*n);s.push(new pt(i+Math.sin(o/4*bt)*.008,a))}for(let o=1;o<5;o++){let a=o/5*(bt/2);s.push(new pt(i-n+n*Math.cos(a),t/2-n+n*Math.sin(a)))}s.push(new pt(i-n,t/2)),s.push(new pt(e,t*.44));let r=new Gr(s,36);return r.rotateZ(bt/2),r}function H1(){return qn("tire",()=>{let i=U1();return new ye({color:3815998,map:i,bumpMap:i,bumpScale:3,roughness:.88,metalness:0,envMap:fi(),envMapIntensity:.4})})}var Ap=new Map;function G1(i,t,e,n){let s=`${i}:${t}:${e}:${n}`,r=Ap.get(s);if(r)return r;let o=new Ai;o.add(B1(i,t),H1());let a=i*.6;o.add(new Te(a*1.01,a*1.01,t*.86,28,1,!1),ni(e,"rim"),_t([0,0,0],[0,0,bt/2])),o.add(new an(a*.82,a*.1,8,28),Jt.chassis,_t([t*.43,0,0],[0,bt/2,0]));let l=[];for(let h=0;h<10;h++){let u=h/10*me+bt/2,d=h%2?a*.36:a*.86;l.push([Math.cos(u)*d,Math.sin(u)*d])}let c=new vi(Fs(l,.02),{depth:.03,bevelEnabled:!0,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:4});o.add(c,ni(n,"spoke"),_t([t*.4,0,0],[0,bt/2,0])),o.add(jt(a*.32,16,10),Jt.chrome,_t([t*.46,0,0],[0,0,0],[.55,1,1]));for(let h=0;h<5;h++){let u=h/5*me;o.add(new Te(.018,.018,.03,6),Jt.chrome,_t([t*.45,Math.cos(u)*a*.52,Math.sin(u)*a*.52],[0,0,bt/2]))}return o.add(new Qn(a,20),Jt.chassis,_t([-t*.43,0,0],[0,-bt/2,0])),r=o.build(),Ap.set(s,r),r}function V1(i){let t=new Ai,e=(r,o,a)=>new vi(r,{depth:o,bevelEnabled:!0,bevelThickness:a,bevelSize:a,bevelSegments:4,curveSegments:10});{let r=Fs([[-.42,-1.02],[.42,-1.02],[.45,-.2],[.45,.5],[.34,1.08],[-.34,1.08],[-.45,.5],[-.45,-.2]],.14),o=e(r,.1,.045);o.rotateX(bt/2),t.add(o,"paint",_t([0,.38,0]));let a=Fs([[-.36,-.95],[.36,-.95],[.38,.5],[.28,1],[-.28,1],[-.38,.5]],.1),l=e(a,.05,.02);l.rotateX(bt/2),t.add(l,Jt.chassis,_t([0,.25,0]))}{let r=Fs([[.18,.36],[1.16,.36],[1.2,.47],[1.02,.6],[.56,.74],[.18,.77]],[.05,.08,.1,.18,.2,.06]),o=.72,a=e(r,o,.07);a.rotateY(-bt/2),a.translate(o/2,0,0),t.add(a,"paint"),t.add(new Ei(.62,.1,.22,2,.045),Jt.chassis,_t([0,.83,.3],[.2,0,0]));let l=Fs([[.2,0],[1.02,0],[1.02,.001],[.2,.001]],0)}for(let r of[-.14,.14]){let o=new Ps([Qt(r,.842,.2),Qt(r,.84,.45),Qt(r,.8,.66),Qt(r,.74,.86),Qt(r,.675,1.02),Qt(r,.57,1.18)]);t.add(new Do(o,24,.035,6,!1),"accent",_t([0,0,0],[0,0,0],[1.6,.35,1]))}t.add(new li(.075,.9,6,14),"accent",_t([0,.3,1.26],[0,0,bt/2]));for(let r of[-.46,.46])t.add(new Te(.035,.035,.2,8),Jt.chassis,_t([r*.7,.3,1.17],[bt/2,0,0]));for(let r of[-.24,.24])t.add(new an(.075,.022,8,20),Jt.chrome,_t([r,.5,1.235],[.35,0,0])),t.add(jt(.07,16,10),Jt.lens,_t([r,.5,1.225],[.35,0,0],[1,1,.55]));for(let r of[-1,1])t.add(new li(.16,.43,8,18),"paint",_t([r*.55,.43,.05],[bt/2,0,0],[1.1,1,1])),t.add(new li(.045,.5,4,10),"accent",_t([r*.6,.555,.05],[bt/2,0,0])),t.add(new Ei(.06,.12,.08,2,.02),Jt.chassis,_t([r*.7,.42,.44]));t.add(new Ei(.66,.62,.15,3,.07),Jt.seat,_t([0,.76,-.62],[-.28,0,0])),t.add(new Ei(.62,.13,.52,3,.05),Jt.seat,_t([0,.47,-.32]));for(let r of[-1,1])t.add(new Ei(.1,.4,.5,2,.045),Jt.seat,_t([r*.33,.62,-.42],[-.15,0,0]));t.add(new li(.04,.5,4,10),"accent",_t([0,1.06,-.71],[-.28,0,bt/2])),t.add(new Ei(.74,.34,.44,3,.06),Jt.gunmetal,_t([0,.55,-.88]));for(let r=0;r<4;r++)t.add(new Ei(.66,.025,.4,1,.01),Jt.chassis,_t([0,.43+r*.07,-.89]));for(let r of[-.18,.18])t.add(new Te(.1,.11,.12,16),Jt.chrome,_t([r,.77,-.86])),t.add(new Te(.075,.075,.02,16),Jt.chassis,_t([r,.835,-.86]));t.add(new an(.1,.03,8,20),Jt.chrome,_t([0,.8,-.72],[bt/2-.2,0,0]));let n=fe.exhaustTilt,s=Qt(0,Math.sin(n),-Math.cos(n));for(let r of[-.22,.22]){let o=Qt(r,.52,-.98),a=.36,l=o.clone().addScaledVector(s,a/2),c=ps(ar,s);t.add(new Te(.065,.065,a,16,1,!0),Jt.chrome,en(l,c));let h=o.clone().addScaledVector(s,a);t.add(new Te(.09,.07,.08,16,1,!0),Jt.chrome,en(h.clone().addScaledVector(s,-.03),c)),t.add(new an(.08,.014,6,16),Jt.chrome,en(h.clone().addScaledVector(s,.01),ps(Dl,s))),t.add(new Qn(.068,16),Jt.rubber,en(h.clone().addScaledVector(s,-.02),ps(Dl,s)))}{let r=Fs([[-.18,-.02],[.18,-.03],[.2,.02],[-.16,.05]],.02),o=new vi(r,{depth:1.26,bevelEnabled:!0,bevelThickness:.02,bevelSize:.02,bevelSegments:3,curveSegments:6});o.translate(0,0,-.63),o.rotateY(-bt/2),t.add(o,"paint",_t([0,1.02,-1.08],[.1,0,0]));for(let a of[-1,1])t.add(new Ei(.05,.3,.44,2,.02),"accent",_t([a*.66,1,-1.08])),t.add(new Te(.03,.03,.34,8),Jt.chassis,_t([a*.26,.86,-1.02],[-.25,0,0]))}for(let r of[-1,1]){let o=fe.rearR+.07;t.add(new Te(o,o,fe.rearW+.08,24,1,!0,.25,2.35),"paint",_t([r*fe.rearX,fe.rearR,fe.rearZ],[0,0,bt/2])),t.add(new an(o,.022,6,24,2.35),"accent",_t([r*(fe.rearX+r*(fe.rearW/2+.04)),fe.rearR,fe.rearZ],[0,-bt/2,.25,"YXZ"]))}t.add(new li(.065,.62,4,12),Jt.chassis,_t([0,.3,-1.13],[0,0,bt/2]));{let r=fe.wheelC,o=Qt(0,.6,.62),a=r.clone().sub(o);t.add(new Te(.03,.035,a.length(),10),Jt.chassis,en(o.clone().add(r).multiplyScalar(.5),ps(ar,a)))}return t.build()}function W1(i,t){let e=new Ai;e.add(new an(fe.wheelRad,.028,10,28),Jt.rubber);for(let s=0;s<3;s++){let r=bt/2+s/3*me+bt;e.add(new Oe(fe.wheelRad,.035,.02),Jt.chassis,_t([Math.cos(r)*fe.wheelRad*.5,Math.sin(r)*fe.wheelRad*.5,0],[0,0,r]))}e.add(new Te(.06,.06,.04,16),"accent",_t([0,0,-.005],[bt/2,0,0]));let n=t.gloves?Jt.white:we(i.skin,.6);for(let s of[.35,bt-.35]){let r=Qt(Math.cos(s)*fe.wheelRad,Math.sin(s)*fe.wheelRad,-.03);e.add(jt(.064,16,12),n,_t([r.x,r.y,r.z],[0,0,0],[1,1,.85])),e.add(jt(.03,10,8),n,_t([r.x*.8,r.y+.045,r.z-.035]))}return e.build()}function X1(i,t){let e=new Ai,n=t.wide||1,s=we(or(i.color,.55,.9),.65);e.add(jt(.27,28,20),"paint",_t([0,.3,0],[0,0,0],[1.05*n,1.12,.92])),e.add(new an(.12,.045,8,20),"accent",_t([0,.56,0],[bt/2-.15,0,0])),i.hat==="horns"?e.add(jt(.2,20,14),we(15983264,.6),_t([0,.25,.1],[0,0,0],[.9*n,1.05,.7])):(e.add(jt(.035,10,8),Jt.gold,_t([.1,.36,.235])),e.add(jt(.035,10,8),Jt.gold,_t([-.1,.36,.235])),e.add(jt(.25,24,16,0,me,bt*.45,bt*.55),s,_t([0,.3,0],[0,0,0],[1.08*n,1.14,.95]))),t.vest&&e.add(jt(.275,24,16,bt*.15,bt*.7,.3,bt*.45),Jt.white,_t([0,.3,0],[0,0,0],[1.08,1.13,.95]));for(let r of[-1,1])e.add(jt(.1,14,10),"paint",_t([r*.25*n,.44,.02]));for(let r of[-1,1]){let o=Qt(r*.13,.08,.05),a=Qt(r*.16,.2,.45),l=Qt(r*.14,.02,.8),c=(h,u,d)=>{let f=u.clone().sub(h);e.add(new li(d,f.length(),4,10),s,en(h.clone().add(u).multiplyScalar(.5),ps(ar,f)))};c(o,a,.095),c(a,l,.08),e.add(jt(.09,12,8),we(5913122,.6),_t([l.x,l.y+.02,l.z+.04],[0,0,0],[1,.8,1.3]))}if(i.hat==="shell"){let r=qn(`shellback:${i.color}`,()=>new ci({color:i.color,map:Dp(),roughness:.35,clearcoat:1,clearcoatRoughness:.1,envMap:fi(),envMapIntensity:.9}));e.add(jt(.33,28,14,0,me,0,bt/2),r,_t([0,.32,-.16],[-bt/2,0,0],[1.02,.62,1.12])),e.add(new an(.335,.05,10,32),we(i.accent,.5),_t([0,.32,-.16],[0,0,0],[1.02,1.12,1]))}if(i.hat==="horns"){let r=ni(i.accent,"spike");for(let o=0;o<3;o++){let a=.5-o*.14,l=-.22-o*.02;e.add(new on(.06,.14,10),r,_t([0,a,l],[-1.2,0,0]))}}if(t.tail){let r=[Qt(.15,.05,-.2),Qt(.36,.08,-.4),Qt(.52,.22,-.5),Qt(.62,.38,-.5)],o=new Ps(r),a=new Do(o,16,.07,10,!1),l=a.attributes.position,c=16,h=10;for(let u=0;u<=c;u++){let d=u/c,f=o.getPointAt(d),p=1.3-d*.9;for(let x=0;x<=h;x++){let g=u*(h+1)+x;l.setXYZ(g,f.x+(l.getX(g)-f.x)*p,f.y+(l.getY(g)-f.y)*p,f.z+(l.getZ(g)-f.z)*p)}}a.computeVertexNormals(),e.add(a,"paint"),e.add(new on(.05,.12,8),ni(i.accent,"spike"),_t([.6,.45,-.5],[0,0,-.4]))}return e.build()}function Rp(i,t,e,n,s={}){let r=t.clone().multiplyScalar(e*.93),o=s.scale||1;if(i.push(en(r,Xn(t,s.roll||0),o)),i.add(jt(1,20,14),Jt.eyeWhite,_t([0,0,0],[0,0,0],[.078,.1,.045])),i.add(jt(1,16,12),we(n.eye,.25,0,null,"iris"),_t([0,-.008,.024],[0,0,0],[.056,.07,.03])),i.add(jt(1,12,10),Jt.pupil,_t([0,-.01,.037],[0,0,0],[.03,.042,.02])),i.add(jt(.016,8,6),Jt.shine,_t([.018,.022,.05])),i.add(jt(.008,6,4),Jt.shine,_t([-.016,-.03,.05])),n.lashes){let a=s.side||1;for(let l=0;l<2;l++){let c=bt/2-a*(.55+l*.4);i.add(new li(.008,.028,2,6),Jt.pupil,_t([Math.cos(c)*.088,Math.sin(c)*.108,.012],[0,0,c-bt/2]))}}i.pop()}function q1(i,t){let e=new Ai,n=fe.headR,s=we(i.skin,.6,0,{envMapIntensity:.35,emissive:or(i.skin,.5,1.1),emissiveIntensity:.18},"skin");e.push(_t([0,.28,0])),e.add(jt(n,36,26),s),e.add(new Te(.1,.12,.14,12),s,_t([0,-.27,0]));let r=.34,o=t.snout==="dino"?.34:t.snout?.2:.06;if(Rp(e,Ti(r,o),n,t,{side:1,roll:.06}),Rp(e,Ti(-r,o),n,t,{side:-1,roll:-.06}),t.brows==="grumpy"||t.brows==="dino"){let l=t.brows==="dino"?we(or(i.skin,.6),.6):we(t.hair||2236962,.7);for(let c of[-1,1]){let h=Ti(c*.33,o+.24);e.add(new li(.034,.11,4,8),l,en(h.clone().multiplyScalar(n*1),Xn(h,c*(bt/2-.35))))}}if(t.snout==="dino"){e.add(jt(1,28,18),s,_t([0,-.07,.2],[.1,0,0],[.24,.17,.2]));for(let l of[-1,1])e.add(jt(.022,8,6),Jt.pupil,_t([l*.07,-.02,.385]));e.add(new an(.11,.016,6,20,bt*.8),Jt.mouth,_t([0,-.06,.345],[.35,0,bt+bt*.1],[1,.55,1])),e.add(new on(.018,.04,6),Jt.white,_t([.055,-.115,.37],[bt-.3,0,0])),e.add(new on(.018,.04,6),Jt.white,_t([-.055,-.115,.37],[bt-.3,0,0]))}else if(t.snout==="beak"){e.add(jt(1,24,16),s,_t([0,-.08,.2],[.15,0,0],[.19,.13,.17])),e.add(new an(.1,.014,6,18,bt*.8),Jt.mouth,_t([0,-.07,.3],[.45,0,bt+bt*.1],[1,.6,1]));for(let l of[-1,1])e.add(jt(.016,8,6),Jt.pupil,_t([l*.05,-.02,.365]))}else{let l=t.bigNose?.085:.05,c=Ti(0,-.12);e.add(jt(l,16,12),we(or(i.skin,.94,1.2),.55),en(c.clone().multiplyScalar(n*.98),Xn(c),[1,.9,1]));let h=Ti(0,-.4);e.add(new an(.065,.014,6,16,bt),t.lips?we(14162784,.4):Jt.mouth,en(h.clone().multiplyScalar(n*.96),Xn(h,bt),[1,.8,1]));for(let u of[-1,1])e.add(jt(.07,12,10),s,_t([u*n*.95,-.02,0],[0,0,0],[.55,1,.8]))}for(let l of[-1,1]){let c=Ti(l*.62,-.18);e.add(new Qn(.05,16),Jt.blush,en(c.clone().multiplyScalar(n*1.004),Xn(c)))}if(t.freckles){let l=we(or(i.skin,.72,1.3),.7);for(let[c,h]of[[.5,-.1],[.58,-.05],[.63,-.14],[-.5,-.1],[-.58,-.05],[-.63,-.14]]){let u=Ti(c,h);e.add(new Qn(.012,8),l,en(u.clone().multiplyScalar(n*1.004),Xn(u)))}}if(t.mustache){let l=t.mustache==="big",c=we(t.hair||3877402,.8);for(let h of[-1,1]){let u=Ti(h*(l?.2:.15),-.25),d=u.clone().multiplyScalar(n*(l?1:.99));e.add(jt(1,14,10),c,en(d,Xn(u,h*(l?-.5:-.3)),l?[.12,.05,.05]:[.075,.035,.035])),l&&e.add(jt(1,10,8),c,en(d.clone().add(Qt(h*.1,.03,-.02)),Xn(u,h*.6),[.06,.035,.035]))}}if(t.hair!==void 0&&i.hat!=="mushroom"){let l=we(t.hair,.55,0,{envMapIntensity:.6},"hair");if(e.add(jt(n*1.045,28,18,bt*.95,bt*1.1,0,bt*.68),l),i.hat==="crown"||i.hat==="bow"){e.add(jt(n*1.05,28,14,0,me,0,bt*.28),l);for(let c=-2;c<=2;c++){let h=Ti(c*.28,.62);e.add(jt(1,10,8),l,en(h.clone().multiplyScalar(n*.96),Xn(h,c*.2),[.09,.07,.06]))}}if(t.longHair){e.add(jt(1,24,18),l,_t([0,-.2,-.16],[.25,0,0],[.31,.36,.17]));for(let c of[-1,1])e.add(jt(1,16,12),l,_t([c*.25,-.18,-.02],[0,0,c*.15],[.09,.24,.12]));e.add(new an(.2,.06,10,24),l,_t([0,-.48,-.13],[bt/2-.3,0,0],[1.2,1,1]))}if(t.pigtails)for(let c of[-1,1])e.add(jt(.12,16,12),l,_t([c*.33,.02,-.08],[0,0,0],[.9,1.25,.9])),e.add(jt(.05,10,8),we(t.bowColor||i.accent,.4),_t([c*.28,.13,-.06]));if(t.tuft)for(let c=0;c<3;c++)e.add(new on(.05,.14,8),l,_t([(c-1)*.08,.02-Math.abs(c-1)*.02,-.3],[-1.9,0,(c-1)*.4]));if(i.hat==="cap")for(let c of[-1,1])e.add(jt(1,10,8),l,_t([c*.27,.02,.06],[0,0,0],[.05,.1,.07]))}let a=i.hat;if(a==="cap"){e.add(jt(n*1.07,32,16,0,me,0,bt*.5),"paint",_t([0,.035,-.01],[-.12,0,0],[1,.9,1.02])),e.add(new an(n*1.05,.02,6,32),"paint",_t([0,.035,-.01],[bt/2-.12,0,0]));let l=new Te(.22,.22,.03,28,1,!1,-bt/2,bt);e.add(l,"paint",_t([0,.07,.22],[.14,0,0],[1.08,1,1.3])),e.add(jt(.035,10,8),"paint",_t([0,n*.99,-.03]))}else if(a==="crown"){let l=Jt.gold;e.add(new Te(.17,.15,.1,24,1,!0),l,_t([0,.32,-.02],[-.12,0,0])),e.add(new Te(.15,.15,.02,24),l,_t([0,.28,-.02],[-.12,0,0])),e.push(_t([0,.32,-.02],[-.12,0,0]));for(let c=0;c<5;c++){let h=c/5*me;e.add(new on(.035,.1,8),l,_t([Math.sin(h)*.16,.1,Math.cos(h)*.16])),e.add(jt(.022,8,6),l,_t([Math.sin(h)*.16,.16,Math.cos(h)*.16]))}e.add(jt(.035,12,8),we(15277667,.1,.2,{emissive:8912947,emissiveIntensity:.5},"gem"),_t([0,0,.168],[0,0,0],[1,1,.6])),e.add(jt(.025,12,8),we(2733814,.1,.2,{emissive:17510,emissiveIntensity:.5},"gem"),_t([.11,0,.125],[0,.7,0],[1,1,.6])),e.add(jt(.025,12,8),we(2733814,.1,.2,{emissive:17510,emissiveIntensity:.5},"gem"),_t([-.11,0,.125],[0,-.7,0],[1,1,.6])),e.pop()}else if(a==="mushroom"){let l=ni(16777215,"mushcap"),c=.15,h=.5,u=.74;e.add(jt(h,40,20,0,me,0,bt*.56),l,_t([0,c,0],[0,0,0],[1,u,1])),e.add(new Qn(h*Math.sin(bt*.56)*.99,32),Jt.cream,_t([0,c+h*u*Math.cos(bt*.56)+.004,0],[bt/2,0,0]));let d=ni(i.color,"spot"),f=[[0,0],[.9,.3],[.9,.3+me/5],[.9,.3+2*me/5],[.9,.3+3*me/5],[.9,.3+4*me/5],[1.45,.3+me/10],[1.45,.3+me/10+bt]];for(let[p,x]of f){let g=h*Math.sin(p)*Math.cos(x),m=h*u*Math.cos(p),M=h*Math.sin(p)*Math.sin(x),_=Qt(g/(h*h),m/(h*u*h*u),M/(h*h)).normalize(),v=p===0?.15:p>1.2?.1:.13;e.add(jt(1,16,10),d,en(Qt(g,m+c,M),Xn(_),[v,v,.03]))}}else if(a==="horns"){for(let c of[-1,1]){let h=Qt(c*.6,.75,-.1).normalize();e.add(new on(.07,.24,14),Jt.ivory,en(h.clone().multiplyScalar(n*.95+.1),ps(ar,Qt(c*.55,1,-.2))))}let l=ni(i.accent,"spike");for(let c=0;c<4;c++){let h=.25+c*.42,u=Qt(0,Math.cos(h),-Math.sin(h));e.add(new on(.075-c*.006,.2,10),l,en(u.clone().multiplyScalar(n*.95),ps(ar,u)))}}else if(a==="shell"){let l=qn(`helm:${i.color}`,()=>new ci({color:i.color,roughness:.3,clearcoat:1,clearcoatRoughness:.08,envMap:fi(),envMapIntensity:.9}));e.add(jt(n*1.09,32,16,0,me,0,bt*.46),l,_t([0,.03,-.02],[-.18,0,0])),e.add(new an(n*1.07,.03,8,32),we(i.accent,.5),_t([0,.07,-.01],[bt/2-.18,0,0]));for(let c of[-1,1]){let h=Ti(c*.3,.7);e.add(new an(.055,.018,8,16),Jt.chrome,en(h.clone().multiplyScalar(n*1.1),Xn(h))),e.add(new Qn(.05,16),we(8445674,.05,.3,{emissive:1131605,emissiveIntensity:.4},"goggle"),en(h.clone().multiplyScalar(n*1.11),Xn(h)))}e.add(new Te(.02,.02,.1,6),Jt.chassis,_t([0,n*1.02,-.05],[0,0,bt/2]))}else if(a==="bow"){let l=ni(t.bowColor||i.accent,"bow");e.push(_t([0,.26,-.1],[-.5,0,0]));for(let c of[-1,1])e.add(jt(1,20,14),l,_t([c*.13,.02,0],[0,0,c*.4],[.14,.1,.06])),e.add(jt(.022,8,6),Jt.white,_t([c*.15,.04,.055])),e.add(jt(.018,8,6),Jt.white,_t([c*.09,-.01,.055]));e.add(jt(.055,14,10),l,_t([0,0,.01])),e.pop()}return e.pop(),e.build()}var Cp=new Map;function Y1(i){let t=`${i.id}:${i.color}:${i.accent}:${i.skin}:${i.hat}`,e=Cp.get(t);if(e)return e;let n=kp(i);return e={chassis:V1(i),steer:W1(i,n),torso:X1(i,n),head:q1(i,n),st:n},Cp.set(t,e),e}var Pl=null;function Z1(){return Pl||(Pl=new li(.068,.46,4,12),Pl.userData.shared=!0),Pl}var K1=.46+.068*2;function $1(i){let t=Vn.findIndex(e=>e.id===i.id);return t>=0?t+1:1+Math.abs([...String(i.id)].reduce((e,n)=>e*31+n.charCodeAt(0),7))%9}function J1(i){let t=Up(i),e=Y1(t),n=e.st,s=new ci({color:t.color,roughness:.32,metalness:.12,clearcoat:1,clearcoatRoughness:.06,envMap:fi(),envMapIntensity:.55,emissive:0,side:$e}),r=new ci({color:t.accent,roughness:.35,metalness:.1,clearcoat:.8,clearcoatRoughness:.1,envMap:fi(),envMapIntensity:.55,emissive:0}),o={paint:s,accent:r},a=[s,r],l=new pe;l.name=`kartModel-${t.id}`;let c=new pe;l.add(c);let h=new pe;c.add(h),h.add(Oi(e.chassis,o));let u=$1(t),d=Hu(N1(u,t.color,t.accent)),f=Os("decalCircle",()=>new Qn(.15,28)),p=new $t(f,d);p.position.set(0,.748,.8),p.rotation.set(-bt/2+.29,0,bt),h.add(p);for(let W of[-1,1]){let j=new $t(f,d);j.scale.setScalar(.9),j.position.set(W*.432,.56,.62),j.rotation.set(0,W*bt/2,0),h.add(j)}let x=Hu(F1(t.name,t.color,t.accent)),g=new $t(Os("decalName",()=>new zn(1.1,.275)),x);g.position.set(0,1.02+.058,-1.08+.005),g.rotation.set(-bt/2+.1,0,bt,"XYZ"),h.add(g);let m=new pe;m.position.copy(fe.wheelC),m.rotation.x=fe.wheelTilt;let M=new pe;m.add(M),M.add(Oi(e.steer,o)),h.add(m);let _=new pe;_.position.copy(fe.hip),h.add(_),_.add(Oi(e.torso,o));let v=new pe;if(v.position.copy(fe.neck),_.add(v),v.add(Oi(e.head,o)),t.hat==="cap"){let W=new $t(Os("emblem",()=>new Qn(.085,24)),Hu(O1(t.name.charAt(0).toUpperCase(),t.color))),j=Ti(0,.62),wt=fe.headR*1.07,Yt=Qt(j.x*wt,j.y*wt*.9,j.z*wt*1.02).applyAxisAngle(Qt(1,0,0),-.12);W.position.set(0,.28+.035,-.01).add(Yt).addScaledVector(j,.006),W.quaternion.copy(Xn(Qt(0,j.y*.8,j.z).normalize().applyAxisAngle(Qt(1,0,0),-.12))),v.add(W)}let w=[];for(let W of[1,-1]){let j=new $t(Z1(),s);j.castShadow=!0,h.add(j),w.push({mesh:j,sx:W,shoulder:Qt(W*.25*(n.wide||1),.44,.02),hand:Qt(Math.cos(W>0?.35:bt-.35)*fe.wheelRad*.95,Math.sin(.35)*fe.wheelRad-.02,-.06)})}let R=[],T=(W,j,wt,Yt,te,rt)=>{let mt=new pe;mt.position.set(j,Yt,wt);let It=new pe;j<0&&(It.rotation.y=bt);let dt=new pe;mt.add(It),It.add(dt),dt.add(Oi(G1(Yt,te,t.accent,t.color),o)),c.add(mt),R.push({pivot:mt,spin:dt,R:Yt,front:rt,dirSign:j<0?-1:1,baseY:Yt});let zt=new rn;return zt.name=W,zt.position.set(j,0,wt),l.add(zt),zt},C={wheelRL:T("wheelRL",fe.rearX,fe.rearZ,fe.rearR,fe.rearW,!1),wheelRR:T("wheelRR",-fe.rearX,fe.rearZ,fe.rearR,fe.rearW,!1),wheelFL:T("wheelFL",fe.frontX,fe.frontZ,fe.frontR,fe.frontW,!0),wheelFR:T("wheelFR",-fe.frontX,fe.frontZ,fe.frontR,fe.frontW,!0)};{let W=fe.exhaustTilt,j=Qt(0,Math.sin(W),-Math.cos(W));for(let[Yt,te]of[["exhaustL",.22],["exhaustR",-.22]]){let rt=new rn;rt.name=Yt,rt.position.copy(Qt(te,.52,-.98).addScaledVector(j,.4)),l.add(rt),C[Yt]=rt}let wt=new rn;wt.name="itemHold",wt.position.set(0,.6,-1.6),l.add(wt),C.itemHold=wt}let b={wheelRot:0,steer:0,prevSpeed:0,accel:0,pitch:0,pitchV:0,roll:0,rollV:0,bob:0,bobV:0,lean:0,headYaw:0,headRoll:0,wasAir:!1,starOn:!1,lookTimer:4+Math.random()*8,lookPhase:0,lookSide:1,dizzy:0,time:0},E=Qt(),D=Qt(),Y=Qt(),H=new ue,X=new ft;function Z(){_.updateMatrix(),m.updateMatrix(),M.updateMatrix(),H.multiplyMatrices(m.matrix,M.matrix);for(let W of w){E.copy(W.shoulder).applyMatrix4(_.matrix),D.copy(W.hand).applyMatrix4(H),Y.subVectors(D,E);let j=Y.length();if(j<1e-4)continue;W.mesh.position.addVectors(E,D).multiplyScalar(.5),W.mesh.quaternion.setFromUnitVectors(ar,Y.multiplyScalar(1/j));let wt=j/K1;W.mesh.scale.set(1,wt,1)}}Z();function O(W={}){try{let j=Ji(rr(W.dt,.016666666666666666),0,.1),wt=rr(W.speed,0),Yt=Ji(rr(W.steer,0),-1,1),te=!!W.drifting,rt=rr(W.driftDir,0)>=0?1:-1,mt=!!W.airborne,It=Ji(rr(W.spin,0),0,1),dt=rr(W.time,b.time+j);b.time=dt;let zt=Ji(Math.abs(wt)/38,0,1.6);b.steer=to(b.steer,Yt,14,j),b.wheelRot=(b.wheelRot+wt*j/fe.rearR)%(me*1e3);let ie=-b.steer*.42*(te?.6:1);for(let Et of R){let I=b.wheelRot*(fe.rearR/Et.R);Et.spin.rotation.x=I*Et.dirSign,Et.front&&(Et.pivot.rotation.y=ie)}let Vt=j>0?(wt-b.prevSpeed)/j:0;b.prevSpeed=wt,b.accel=to(b.accel,Ji(Vt,-80,80),6,j);let oe=-Ji(b.accel*.0018,-.05,.05);W.boosting&&(oe-=.06),mt&&(oe-=.04);let at=-b.steer*zt*.05;te&&(at=-rt*.06*Math.min(1,zt+.3));let St=140,L=13;b.pitchV+=((oe-b.pitch)*St-b.pitchV*L)*j,b.pitch+=b.pitchV*j,b.rollV+=((at-b.roll)*St-b.rollV*L)*j,b.roll+=b.rollV*j,b.wasAir&&!mt&&(b.bobV-=1.4+Math.min(1.5,zt)),b.wasAir=mt;let Zt=mt?.03:(Math.sin(dt*23)*.5+Math.sin(dt*37)*.5)*.006*Math.min(1,zt*1.5);b.bobV+=((Zt-b.bob)*220-b.bobV*14)*j,b.bob+=b.bobV*j,b.bob=Ji(b.bob,-.12,.08),h.position.y=b.bob,h.rotation.set(b.pitch,0,b.roll);let xt=te?rt*.22:b.steer*.14*Math.min(1,zt+.35);b.lean=to(b.lean,xt,8,j),b.dizzy=to(b.dizzy,It>0&&It<1?1:0,It>0?12:3,j);let Ut=b.dizzy;_.rotation.set(Math.sin(dt*9)*.06*Ut,Math.sin(dt*7)*.15*Ut,b.lean+Math.sin(dt*12)*.12*Ut),b.lookTimer-=j;let Pt=0;if(b.lookTimer<=0&&b.lookPhase<=0&&(Math.abs(Yt)<.25&&!te&&zt>.3&&!mt&&(b.lookPhase=1.1,b.lookSide=Math.random()<.5?-1:1),b.lookTimer=7+Math.random()*10),b.lookPhase>0){b.lookPhase-=j;let Et=1-b.lookPhase/1.1;Pt=Math.sin(Ji(Et,0,1)*bt)*1.5*b.lookSide,(te||Math.abs(Yt)>.6)&&(b.lookPhase=0)}if(b.headYaw=to(b.headYaw,-b.steer*.38+Pt+Math.sin(dt*10)*.5*Ut,10,j),b.headRoll=to(b.headRoll,b.steer*.1+(te?rt*.1:0),8,j),v.rotation.set(-.04+(mt?-.1:0)+(W.boosting?-.06:0),b.headYaw,b.headRoll,"YXZ"),M.rotation.z=b.steer*1,Z(),!!W.star){let Et=dt*1.6%1;X.setHSL(Et,1,.5),s.color.copy(X),s.emissive.copy(X),s.emissiveIntensity=.35+Math.sin(dt*20)*.1,X.setHSL((Et+.5)%1,1,.5),r.color.copy(X),r.emissive.copy(X),r.emissiveIntensity=.35,b.starOn=!0}else b.starOn&&(s.emissive.setHex(0),r.emissive.setHex(0),s.color.setHex(t.color),r.color.setHex(t.accent),s.emissiveIntensity=1,r.emissiveIntensity=1,b.starOn=!1)}catch(j){b.warned||(console.warn("[models] animate failed",j),b.warned=!0)}}function ct(W){let j=rr(W,1);l.scale.setScalar(j>0?j:1)}function K(){try{l.parent?.remove(l)}catch{}for(let W of a)W.dispose();a.length=0}return l.traverse(W=>{W.isMesh&&(W.castShadow=!0)}),p.castShadow=!1,g.castShadow=!1,{root:l,anchors:C,animate:O,setShrunk:ct,dispose:K,character:t,parts:{body:h,driver:_,head:v,wheels:R.map(W=>W.pivot)}}}var Ip=new Map;function Os(i,t){let e=Ip.get(i);return e||(e=t(),e.userData.shared=!0,Ip.set(i,e)),e}var Pp=new Map;function Yo(i,t){let e=Pp.get(i);return e||(e=t(),Pp.set(i,e)),e}function j1(){return no("itemboxface",(i,t,e)=>{i.clearRect(0,0,t,e),i.fillStyle="rgba(255,255,255,0.10)",i.fillRect(0,0,t,e);let n=i.createLinearGradient(0,0,t,e);["#ff1744","#ff9100","#ffea00","#00e676","#00b0ff","#d500f9","#ff1744"].forEach((r,o,a)=>n.addColorStop(o/(a.length-1),r)),i.strokeStyle=n,i.lineWidth=26,Ll(i,13,13,t-26,e-26,22),i.stroke(),i.strokeStyle="rgba(255,255,255,0.85)",i.lineWidth=4,Ll(i,28,28,t-56,e-56,14),i.stroke(),i.font=`900 ${Math.round(e*.62)}px "Arial Black", "Lilita One", Arial, sans-serif`,i.textAlign="center",i.textBaseline="middle",i.shadowColor="rgba(255,255,255,1)",i.shadowBlur=24,i.lineWidth=14,i.lineJoin="round";let s=i.createLinearGradient(0,e*.2,0,e*.8);s.addColorStop(0,"#ff9100"),s.addColorStop(1,"#ff1744"),i.strokeStyle=s,i.strokeText("?",t/2,e/2+e*.04),i.shadowBlur=0,i.fillStyle="#ffffff",i.fillText("?",t/2,e/2+e*.04)},256,256)}function Q1(){let t=j1(),e=qn("itembox:shell",()=>new ci({color:16777215,map:t,emissive:16777215,emissiveMap:t,emissiveIntensity:.22,transparent:!0,opacity:1,roughness:.08,metalness:0,clearcoat:1,clearcoatRoughness:.05,iridescence:1,iridescenceIOR:1.8,iridescenceThicknessRange:[200,900],envMap:fi(),envMapIntensity:1.3,side:$e,depthWrite:!1})),n=qn("itembox:core",()=>new Sn({color:16777215,transparent:!0,opacity:.55,blending:xi,depthWrite:!1})),s=Os("itembox:geo",()=>new Ei(1.5,1.5,1.5,4,.16)),r=Os("itembox:core",()=>new Hn(.42,1)),o=Os("itembox:halo",()=>new ti(.62,20,14)),a=qn("itembox:halo",()=>new Sn({color:16777215,transparent:!0,opacity:.12,blending:xi,depthWrite:!1})),l=new pe;l.name="item_box";let c=new $t(s,e);c.renderOrder=2,c.castShadow=!1;let h=new $t(r,n),u=new $t(o,a);l.add(u,h,c);let d=new ft;return h.onBeforeRender=()=>{let f=performance.now()/1e3;d.setHSL(f*.35%1,1,.6),n.color.copy(d),a.color.setHSL((f*.35+.3)%1,1,.6),e.emissive.setHSL(f*.2%1,.8,.6),h.rotation.set(f*1.3,f*1.7,0),h.updateMatrix(),h.matrixWorld.multiplyMatrices(l.matrixWorld,h.matrix)},l}function tM(i,t){let e=new Ai,n=.46,s=qn(`shell:${i}`,()=>new ci({color:i,map:Dp(),roughness:.25,clearcoat:1,clearcoatRoughness:.05,envMap:fi(),envMapIntensity:1})),r=.17;if(e.add(jt(n,36,18,0,me,0,bt/2),s,_t([0,r,0],[0,0,0],[1,.78,1])),e.add(new an(n,.075,12,40),ni(16777215,"shellrim"),_t([0,r,0],[bt/2,0,0])),e.add(jt(n*.98,32,10,0,me,bt/2,bt/2),Jt.cream,_t([0,r,0],[0,0,0],[1,.32,1])),t){let o=ni(16777215,"spike"),a=[[0,0]];for(let l=0;l<6;l++)a.push([.85,l/6*me]);for(let[l,c]of a){let h=Qt(Math.sin(l)*Math.cos(c),Math.cos(l)*.78,Math.sin(l)*Math.sin(c)),u=Qt(h.x*n,h.y*n+r,h.z*n),d=Qt(h.x/n,h.y/(.78*.78*n),h.z/n).normalize();e.add(new on(.07,.2,12),o,en(u.clone().addScaledVector(d,.06),ps(ar,d)))}}return e.build()}function eM(){return Os("wing",()=>{let i=new Ls;i.moveTo(0,0),i.quadraticCurveTo(.2,.35,.55,.42),i.quadraticCurveTo(.5,.32,.56,.28),i.quadraticCurveTo(.45,.2,.52,.14),i.quadraticCurveTo(.38,.06,.42,0),i.quadraticCurveTo(.2,-.06,0,0);let t=new vi(i,{depth:.03,bevelEnabled:!0,bevelThickness:.015,bevelSize:.015,bevelSegments:2,curveSegments:8});return t.translate(0,0,-.015),t})}function nM(i){let t=i==="red_shell"?14689837:i==="blue_shell"?1993727:2274106,e=Yo(i,()=>tM(t,i==="blue_shell")),n=Oi(e,{});if(n.name=i,i==="blue_shell"){let s=ni(16777215,"wing"),r=[];for(let a of[-1,1]){let l=new pe;l.position.set(a*.42,.32,-.05);let c=new $t(eM(),s);c.castShadow=!0,c.rotation.set(0,a>0?0:bt,0),l.add(c),n.add(l),r.push({pivot:l,sx:a})}let o=()=>{let a=performance.now()/1e3;for(let l of r)l.pivot.rotation.set(.25,0,l.sx*(.35+Math.sin(a*16)*.45)),l.pivot.updateMatrix(),l.pivot.matrixWorld.multiplyMatrices(n.matrixWorld,l.pivot.matrix),l.pivot.children[0].matrixWorld.multiplyMatrices(l.pivot.matrixWorld,l.pivot.children[0].matrix)};r[0].pivot.children[0].onBeforeRender=o}return n}function iM(){let i=new Ai,t=qn("banana:peel",()=>new ci({color:16761856,roughness:.45,clearcoat:.6,clearcoatRoughness:.2,envMap:fi(),envMapIntensity:.7,side:$e})),e=we(7031326,.7),n=we(16774856,.6),s=Qt(0,.62,0),r=new li(.12,.42,8,16),o=r.attributes.position;for(let l=0;l<o.count;l++){let c=o.getY(l);o.setX(l,o.getX(l)+.25*Math.pow((c+.33)/.66,2)*.35)}r.computeVertexNormals(),i.add(r,n,_t([0,.42,0])),i.add(new Te(.035,.05,.14,10),e,_t([.11,.76,0],[0,0,-.3]));let a=3;for(let l=0;l<a;l++){let c=l/a*me+.3,h=Qt(-Math.cos(c),0,Math.sin(c)),u=Qt(-h.z,0,h.x).normalize(),d=new ti(.3,12,14,c-.62,1.24,0,bt*.58),f=d.attributes.position;for(let M=0;M<f.count;M++){let _=f.getX(M),v=f.getY(M),w=f.getZ(M),R=1-v/.3,T=1+Math.max(0,R-.7)*1.2;f.setXYZ(M,_*T,v,w*T)}d.computeVertexNormals();let p=new ue().makeTranslation(s.x,s.y,s.z).multiply(new ue().makeRotationAxis(u,.38)).multiply(_t([0,-.3*1.8,0],[0,0,0],[1.05,1.8,1.05]));i.add(d,t,p);let x=h.clone(),m=Qt(x.x*.3*Math.sin(bt*.58)*1.05*1.25,-.3*1.8+.3*1.8*Math.cos(bt*.58),x.z*.3*Math.sin(bt*.58)*1.05*1.25).applyAxisAngle(u,.38).add(s);i.add(jt(.05,10,8),e,_t([m.x,Math.max(.03,m.y),m.z],[0,0,0],[1,.6,1]))}return i.build()}function sM(){let i=new Ai,t=Jt.cream,e=[];for(let a=0;a<=10;a++){let l=a/10;e.push(new pt(.2+Math.sin(l*bt)*.04-l*.03,l*.42))}e.unshift(new pt(0,0)),e.push(new pt(0,.42)),i.add(new Gr(e,28),t);for(let a of[-1,1]){let l=Ti(a*.32,0);i.add(jt(1,12,10),Jt.pupil,en(Qt(l.x*.225,.2,l.z*.225),Xn(l),[.035,.065,.03])),i.add(jt(.012,6,4),Jt.shine,_t([l.x*.25,.225,l.z*.25]))}let n=.42,s=.82,r=.38;i.add(jt(n,36,18,0,me,0,bt*.58),ni(15214125,"mushroomcap"),_t([0,r,0],[0,0,0],[1,s,1])),i.add(new Qn(n*Math.sin(bt*.58),28),Jt.cream,_t([0,r+n*s*Math.cos(bt*.58)+.003,0],[bt/2,0,0]));let o=[[0,0,.14],[.95,.5,.12],[.95,.5+me/4,.12],[.95,.5+bt,.12],[.95,.5+3*me/4,.12]];for(let[a,l,c]of o){let h=n*Math.sin(a)*Math.cos(l),u=n*s*Math.cos(a),d=n*Math.sin(a)*Math.sin(l),f=Qt(h,u/(s*s),d).normalize();i.add(jt(1,16,10),ni(16777215,"spotw"),en(Qt(h,u+r,d),Xn(f),[c,c,.03]))}return i.build()}function rM(i,t,e){let n=[];for(let s=0;s<10;s++){let r=bt/2+s/10*me,o=s%2?t:i;n.push([Math.cos(r)*o,Math.sin(r)*o])}return Fs(n,e)}function oM(){let i=new Ai,t=qn("star",()=>new ci({color:16761095,emissive:16748288,emissiveIntensity:.22,roughness:.2,metalness:.1,clearcoat:1,clearcoatRoughness:.05,envMap:fi(),envMapIntensity:1.1})),e=.16,n=.1,s=new vi(rM(.55,.26,.06),{depth:e,bevelEnabled:!0,bevelThickness:n,bevelSize:.06,bevelSegments:5,curveSegments:6});s.translate(0,0,-e/2),i.add(s,t);for(let r of[1,-1])for(let o of[-1,1])i.add(jt(1,14,10),Jt.pupil,_t([o*.09,.06,r*(e/2+n-.01)],[0,r>0?0:bt,0],[.04,.09,.025])),i.add(jt(.014,6,4),Jt.shine,_t([o*.09+.012,.1,r*(e/2+n+.012)]));return i.build()}function aM(){let i=new Ai,t=qn("bolt",()=>new ci({color:16764928,emissive:16752640,emissiveIntensity:.4,roughness:.25,clearcoat:1,envMap:fi(),envMapIntensity:.9})),e=Fs([[-.05,.62],[.32,.62],[.1,.16],[.32,.16],[-.22,-.62],[-.02,-.06],[-.24,-.06]],.025),n=new vi(e,{depth:.1,bevelEnabled:!0,bevelThickness:.05,bevelSize:.04,bevelSegments:4,curveSegments:4});n.translate(0,0,-.05),i.add(n,t);let s=qn("boltEdge",()=>new Sn({color:16769154,transparent:!0,opacity:.25,blending:xi,depthWrite:!1,side:vn})),r=new vi(e,{depth:.1,bevelEnabled:!0,bevelThickness:.09,bevelSize:.08,bevelSegments:2,curveSegments:4});return r.translate(0,0,-.05),i.add(r,s),i.build()}function kl(i){try{switch(i){case"item_box":return Q1();case"banana":{let t=Oi(Yo("banana",iM),{});return t.name="banana",t}case"green_shell":case"red_shell":case"blue_shell":return nM(i);case"mushroom":case"triple_mushroom":{let t=Yo("mushroom",sM);if(i==="mushroom"){let n=Oi(t,{});return n.name="mushroom",n}let e=new pe;return e.name="triple_mushroom",[[-.42,0,0],[.42,0,0],[0,0,-.38]].forEach((n,s)=>{let r=Oi(t,{});r.position.set(n[0],0,n[2]),r.scale.setScalar(s===2?.85:.8),e.add(r)}),e}case"star":{let t=new pe;t.name="star";let e=Oi(Yo("star",oM),{});t.add(e);let n=Math.random()*10;return e.children[0].onBeforeRender=()=>{let s=performance.now()/1e3+n;e.rotation.set(Math.sin(s*2)*.15,s*2.2,0),e.updateMatrix(),e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix);for(let r of e.children)r.matrixWorld.multiplyMatrices(e.matrixWorld,r.matrix)},t}case"lightning":{let t=Oi(Yo("lightning",aM),{});return t.name="lightning",t.children.forEach((e,n)=>{n>0&&(e.castShadow=!1)}),t}default:{let t=new pe;return t.add(new $t(Os("fallbackItem",()=>new Hn(.4,1)),ni(16711935,"fallback"))),t}}}catch(t){return console.warn("[models] createItemModel failed",i,t),new pe}}var Gu=new Map;function lM(i){let t=Up(i),e=`${t.id}:${t.color}:${t.hat}`;if(Gu.has(e))return Gu.get(e);let n="";try{let s=document.createElement("canvas");s.width=128,s.height=128,cM(s.getContext("2d"),t,kp(t)),n=s.toDataURL("image/png")}catch(s){console.warn("[models] portrait failed",s)}return Gu.set(e,n),n}function cM(i,t,e){let n=wi(t.color),s=wi(t.accent),r=wi(t.skin),o=qo(t.color,.55),a=qo(t.color,1,1,.28),l="rgba(20,16,30,0.85)",c=2.6;i.save(),Ll(i,2,2,124,124,26),i.clip();let h=i.createRadialGradient(64,44,6,64,64,96);h.addColorStop(0,a),h.addColorStop(.55,n),h.addColorStop(1,o),i.fillStyle=h,i.fillRect(0,0,128,128),i.globalAlpha=.12,i.fillStyle="#ffffff";for(let _=0;_<12;_++){let v=_/12*me,w=v+me/24;i.beginPath(),i.moveTo(64,60),i.lineTo(64+Math.cos(v)*140,60+Math.sin(v)*140),i.lineTo(64+Math.cos(w)*140,60+Math.sin(w)*140),i.closePath(),i.fill()}i.globalAlpha=1;let u=(_,v,w=c)=>{i.beginPath(),v(),i.fillStyle=_,i.fill(),i.lineWidth=w,i.strokeStyle=l,i.stroke()},d=(_,v,w,R,T=0)=>i.ellipse(_,v,w,R,T,0,me),f=e.hair!==void 0?wi(e.hair):null,p=64,x=70,g=31;if(u(n,()=>d(64,134,44,34)),u(s,()=>d(64,104,13,6)),t.hat==="shell"&&(u(n,()=>d(64,118,52,24)),u(s,()=>d(64,106,46,7))),f&&e.longHair&&u(f,()=>{i.moveTo(30,66),i.quadraticCurveTo(26,118,44,116),i.lineTo(84,116),i.quadraticCurveTo(102,118,98,66),i.closePath()}),f&&e.pigtails&&(u(f,()=>d(30,80,11,16,.3)),u(f,()=>d(98,80,11,16,-.3))),t.hat==="horns"){for(let _ of[-1,1])u("#fff3d6",()=>{i.moveTo(p+_*16,x-24),i.quadraticCurveTo(p+_*30,x-40,p+_*26,x-50),i.quadraticCurveTo(p+_*20,x-36,p+_*6,x-28),i.closePath()});for(let _=0;_<3;_++)u(s,()=>{let v=p-10+_*10;i.moveTo(v-6,x-28),i.lineTo(v,x-42+Math.abs(_-1)*4),i.lineTo(v+6,x-28),i.closePath()})}e.snout||(u(r,()=>d(p-g+1,x+2,6,9)),u(r,()=>d(p+g-1,x+2,6,9))),u(r,()=>d(p,x,g,g*.97)),e.snout==="dino"&&u(r,()=>d(p,x+14,24,14)),e.snout==="beak"&&u(r,()=>d(p,x+14,18,11));let m=e.snout?x-6:x-2;for(let _ of[-1,1]){let v=p+_*11;if(u("#ffffff",()=>d(v,m,7.5,10),2),i.beginPath(),d(v+_*.5,m+1.5,5.2,7),i.fillStyle=wi(e.eye),i.fill(),i.beginPath(),d(v+_*.5,m+2,2.8,4.2),i.fillStyle="#0d0d12",i.fill(),i.beginPath(),d(v+2,m-3,2,2.4),i.fillStyle="#ffffff",i.fill(),e.lashes){i.strokeStyle=l,i.lineWidth=2;for(let w=0;w<3;w++){let R=-bt/2+_*(.5+w*.35);i.beginPath(),i.moveTo(v+Math.cos(R)*8,m+Math.sin(R)*10),i.lineTo(v+Math.cos(R)*12,m+Math.sin(R)*14),i.stroke()}}}if(e.brows){i.strokeStyle=e.brows==="dino"?qo(t.skin,.55):f||"#222",i.lineWidth=4.5,i.lineCap="round";for(let _ of[-1,1])i.beginPath(),i.moveTo(p+_*5,m-10),i.lineTo(p+_*18,m-15),i.stroke()}i.fillStyle="rgba(255,120,140,0.45)";for(let _ of[-1,1])i.beginPath(),d(p+_*20,x+10,5.5,3.5),i.fill();if(e.freckles){i.fillStyle=qo(t.skin,.7,1.3);for(let[_,v]of[[-20,6],[-16,9],[-23,10],[20,6],[16,9],[23,10]])i.beginPath(),i.arc(p+_,x+v,1.2,0,me),i.fill()}if(e.snout==="dino"){i.fillStyle="#1a1a1a";for(let _ of[-1,1])i.beginPath(),d(p+_*7,x+9,2,1.5),i.fill();i.strokeStyle="#6d1b2b",i.lineWidth=3,i.beginPath(),i.arc(p,x+12,14,.25*bt,.75*bt),i.stroke(),i.fillStyle="#fff";for(let _ of[-1,1])i.beginPath(),i.moveTo(p+_*7,x+24),i.lineTo(p+_*9,x+28),i.lineTo(p+_*5,x+25),i.fill()}else e.snout==="beak"?(i.strokeStyle="#6d1b2b",i.lineWidth=3,i.beginPath(),i.arc(p,x+12,10,.25*bt,.75*bt),i.stroke()):(u(qo(t.skin,.93,1.2),()=>d(p,x+7,e.bigNose?8:5,e.bigNose?7:4.5),2),i.strokeStyle=e.lips?"#d81b60":"#6d1b2b",i.lineWidth=3,i.lineCap="round",i.beginPath(),i.arc(p,x+12,8,.2*bt,.8*bt),i.stroke());if(e.mustache){let _=e.mustache==="big";for(let v of[-1,1])u(f||"#3b2a1a",()=>d(p+v*(_?9:6),x+12,_?11:7,_?5:3.5,v*-.3),2)}let M=t.hat;if(M==="cap")f&&u(f,()=>{d(p-24,x-6,6,9)},2),f&&u(f,()=>{d(p+24,x-6,6,9)},2),e.tuft&&f&&u(f,()=>{i.moveTo(p+22,x-18),i.lineTo(p+36,x-26),i.lineTo(p+28,x-12),i.closePath()}),u(n,()=>{i.moveTo(p-g-1,x-16),i.bezierCurveTo(p-g,x-56,p+g,x-56,p+g+1,x-16),i.closePath()}),u(o,()=>d(p+4,x-16,36,6)),u("#ffffff",()=>i.arc(p,x-33,9,0,me),2),i.fillStyle=n,i.font='900 13px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(t.name.charAt(0).toUpperCase(),p,x-32);else if(M==="crown")u(f||"#ffd54f",()=>{i.moveTo(p-g,x-2),i.bezierCurveTo(p-g-2,x-44,p+g+2,x-44,p+g,x-2),i.quadraticCurveTo(p+14,x-22,p,x-18),i.quadraticCurveTo(p-14,x-22,p-g,x-2),i.closePath()}),u("#ffc630",()=>{i.moveTo(p-20,x-30),i.lineTo(p-22,x-50),i.lineTo(p-11,x-40),i.lineTo(p,x-54),i.lineTo(p+11,x-40),i.lineTo(p+22,x-50),i.lineTo(p+20,x-30),i.closePath()}),u("#e91e63",()=>i.arc(p,x-36,3.5,0,me),1.5),u("#29b6f6",()=>i.arc(p-13,x-35,2.5,0,me),1.5),u("#29b6f6",()=>i.arc(p+13,x-35,2.5,0,me),1.5);else if(M==="mushroom"){u("#ffffff",()=>{i.moveTo(p-52,x-16),i.bezierCurveTo(p-54,x-74,p+54,x-74,p+52,x-16),i.quadraticCurveTo(p,x-8,p-52,x-16),i.closePath()});for(let[_,v,w]of[[0,-44,11],[-32,-31,9],[32,-31,9],[-16,-54,5],[17,-54,5]])i.beginPath(),i.arc(p+_,x+v,w,0,me),i.fillStyle=n,i.fill()}else if(M==="shell"){u(n,()=>{i.moveTo(p-g-3,x-8),i.bezierCurveTo(p-g-2,x-52,p+g+2,x-52,p+g+3,x-8),i.closePath()}),u(s,()=>{i.rect(p-g-4,x-12,2*g+8,6)},2);for(let _ of[-1,1])u("#cfd8dc",()=>i.arc(p+_*10,x-26,7,0,me),2),i.beginPath(),i.arc(p+_*10,x-26,4.5,0,me),i.fillStyle="#80deea",i.fill()}else if(M==="bow"){u(f||"#6d4028",()=>{i.moveTo(p-g,x),i.bezierCurveTo(p-g-2,x-44,p+g+2,x-44,p+g,x),i.quadraticCurveTo(p+10,x-24,p-4,x-20),i.quadraticCurveTo(p-20,x-20,p-g,x),i.closePath()});let _=wi(e.bowColor||t.accent);u(_,()=>d(p+6,x-40,13,9,-.4)),u(_,()=>d(p+30,x-36,13,9,.4)),u(_,()=>i.arc(p+18,x-38,5,0,me))}i.restore(),Ll(i,3,3,122,122,25),i.lineWidth=4,i.strokeStyle="rgba(255,255,255,0.85)",i.stroke()}var hM=2,uM=.4,fM=1.2,dM=1.6,Np=.45,pM=.9,mM=.28,gM=.4,Fp=.75,Op=.05,xM=62,_M=8,vM=5,zp=58,yM=11,Bp=6.5,MM=28,Wu=78,Ul=7,bM=30,SM=1,Xu=8,EM=.75,TM=24,wM=24,AM=[[10,0,45,37,8,0,0,0],[22,4,22,24,24,2,0,2],[24,10,12,18,30,3,0,3],[22,18,8,12,30,6,1,3],[20,26,5,8,27,10,2,2],[18,30,3,5,24,14,4,2],[12,34,0,3,20,22,7,2],[8,36,0,0,16,28,10,2]],io=["mushroom","triple_mushroom","banana","green_shell","red_shell","star","lightning","blue_shell"],Zo=ks&&ks.length?ks:io,RM={item_box:1.7,banana:1,green_shell:1.1,red_shell:1.1,blue_shell:1.5},ln=new P,Ne=new P,qu=new P,Ko=new Li;function xn(i,t=0){return Number.isFinite(i)?i:t}function Hp(i){return i%=1,i<0?i+1:i}function Yu(i,t){let e=xn(i.heading,i.object3D?.rotation?.y??0);return t.set(Math.sin(e),0,Math.cos(e))}function Nl(i){return xn(i.radius,Ve.kartRadius)}var lr=null;function CM(){if(lr)return lr;let i=document.createElement("canvas");i.width=i.height=128;let t=i.getContext("2d"),e=t.createLinearGradient(0,0,128,128);e.addColorStop(0,"#ff5ca8"),e.addColorStop(.33,"#ffd84a"),e.addColorStop(.66,"#4ae3ff"),e.addColorStop(1,"#9b6bff"),t.fillStyle=e,t.fillRect(0,0,128,128),t.fillStyle="rgba(255,255,255,0.35)",t.fillRect(8,8,112,112),t.strokeStyle="#ffffff",t.lineWidth=8,t.strokeRect(4,4,120,120),t.fillStyle="#ffffff",t.font="bold 92px sans-serif",t.textAlign="center",t.textBaseline="middle",t.lineWidth=6,t.strokeStyle="#6a2fb8",t.strokeText("?",64,70),t.fillText("?",64,70);let n=new jn(i);return n.colorSpace=Ke,lr={tex:n,boxGeo:new Oe(1.5,1.5,1.5),boxMat:new ye({map:n,transparent:!0,opacity:.85,emissive:4465254,emissiveIntensity:.4,roughness:.2}),shellGeo:new ti(.55,16,10,0,Math.PI*2,0,Math.PI/2),rimGeo:new an(.55,.14,8,20),rimMat:new ye({color:16777215,roughness:.4}),green:new ye({color:3066944,roughness:.35}),red:new ye({color:15214122,roughness:.35}),blue:new ye({color:3107839,roughness:.3,emissive:662118,emissiveIntensity:.6}),spikeGeo:new on(.14,.4,8),wingGeo:new Oe(.9,.05,.35),wingMat:new ye({color:16777215,roughness:.4}),bananaGeo:new an(.4,.14,8,16,Math.PI*1.1),bananaMat:new ye({color:16769333,roughness:.5}),tipMat:new ye({color:5913106,roughness:.8}),tipGeo:new ti(.08,6,6)},lr}function IM(i){let t=CM(),e=new pe;if(i==="item_box"){let n=new $t(t.boxGeo,t.boxMat);e.add(n)}else if(i==="banana"){let n=new $t(t.bananaGeo,t.bananaMat);n.rotation.z=Math.PI*.95,n.position.y=.5;let s=new $t(t.tipGeo,t.tipMat);s.position.set(.4,0,0),n.add(s),e.add(n)}else{let n=i==="red_shell"?t.red:i==="blue_shell"?t.blue:t.green,s=new $t(t.shellGeo,n);s.position.y=.15;let r=new $t(t.rimGeo,t.rimMat);if(r.rotation.x=Math.PI/2,r.position.y=.15,e.add(s,r),i==="blue_shell"){for(let l=0;l<6;l++){let c=new $t(t.spikeGeo,t.rimMat),h=l/6*Math.PI*2;c.position.set(Math.cos(h)*.3,.55,Math.sin(h)*.3),c.rotation.set(Math.sin(h)*.5,0,-Math.cos(h)*.5),e.add(c)}let o=new $t(t.wingGeo,t.wingMat);o.position.set(.7,.4,0),o.rotation.z=.4;let a=new $t(t.wingGeo,t.wingMat);a.position.set(-.7,.4,0),a.rotation.z=-.4,e.add(o,a)}}return e.userData.fallback=!0,e}function Gp(i){let t=null;if(kl)try{let r=kl(i);r&&r.isObject3D?t=r:r&&r.root&&r.root.isObject3D&&(t=r.root)}catch(r){console.warn("[items] createItemModel failed for",i,r)}let e=!t;t||(t=IM(i));let n=new pe,s=new pe;s.add(t),n.add(s);try{if(t.updateMatrixWorld(!0),Ko.setFromObject(t),!Ko.isEmpty()){Ko.getSize(ln);let r=Math.max(ln.x,ln.y,ln.z),o=RM[i]||1,a=1;r>0&&(r>o*1.8||r<o*.45)&&(a=o/r),s.scale.setScalar(a),Ko.getCenter(Ne),i==="item_box"?t.position.sub(Ne):t.position.set(t.position.x-Ne.x,t.position.y-Ko.min.y,t.position.z-Ne.z)}}catch{}return e&&n.traverse(r=>{r.isMesh&&(r.castShadow=!0)}),n.userData.fallback=e,n.userData.type=i,n.userData.inner=s,n}var Zu=class{constructor({scene:t,track:e,karts:n}){this.scene=t,this.track=e,this.karts=n||[],this.group=new pe,this.group.name="ItemSystem",t?.add(this.group),this.time=0,this.boxes=[],this.entities=[],this.pools=new Map,this.roulettes=new Map,this.kartState=new Map,this._hazards=[],this._rouletteOut={spinning:!1,displayItem:null};let s=e?.itemBoxPositions||[];for(let r=0;r<s.length;r++){let o=s[r];if(!o)continue;let a=new P(xn(o.x),xn(o.y),xn(o.z));try{let c=e.getSurfaceInfo?.(a);c&&Number.isFinite(c.height)&&a.y<c.height+1.1&&(a.y=c.height+1.3)}catch{}let l=Gp("item_box");l.position.copy(a),this.group.add(l),this.boxes.push({base:a,holder:l,active:!0,timer:0,scaleT:1,phase:r*.7})}}update(t,e){if(t>0){t=Math.min(t,.1),this.time=Number.isFinite(e)?e:this.time+t;try{this._updateBoxes(t)}catch(n){console.error("[items] boxes",n)}try{this._updateRoulettes(t)}catch(n){console.error("[items] roulette",n)}try{this._updateUse(t)}catch(n){console.error("[items] use",n)}try{this._updateEntities(t)}catch(n){console.error("[items] entities",n)}}}getHazards(){let t=this._hazards;t.length=0;for(let e of this.entities)e.dead||!e.hazard||e.type!=="blue_shell"&&(e.type==="banana"&&e.flying||t.push(e.hazard));return t}rouletteState(t){let e=this._rouletteOut,n=t?this.roulettes.get(t):null;return n?(e.spinning=!0,e.displayItem=n.display):(e.spinning=!1,e.displayItem=t?.item??null),e.count=t?.itemCount??0,e}dispose(){for(let n of this.entities)this._release(n.holder);this.entities.length=0,this.roulettes.clear(),this.kartState.clear(),this.scene?.remove(this.group);let t=new Set,e=n=>{n.traverse(s=>{s.geometry&&!t.has(s.geometry)&&(t.add(s.geometry),s.geometry.dispose?.());let r=Array.isArray(s.material)?s.material:s.material?[s.material]:[];for(let o of r)t.has(o)||(t.add(o),o.map?.dispose?.(),o.dispose?.())})};for(let n of this.boxes)n.holder.userData.fallback&&e(n.holder);for(let n of this.pools.values())for(let s of n)s.userData.fallback&&e(s);this.boxes.length=0,this.pools.clear(),lr&&(Object.values(lr).forEach(n=>n?.dispose?.()),lr=null)}_updateBoxes(t){let e=this.time;for(let n of this.boxes){let s=n.holder;if(!n.active)if(n.timer-=t,n.timer<=0)n.active=!0,n.scaleT=0,s.visible=!0;else continue;n.scaleT<1&&(n.scaleT=Math.min(1,n.scaleT+t/uM));let r=n.scaleT,o=1.9,a=o+1,l=r>=1?1:Math.max(.001,1+a*Math.pow(r-1,3)+o*Math.pow(r-1,2));if(s.scale.setScalar(l),s.position.set(n.base.x,n.base.y+Math.sin(e*2.4+n.phase)*.22,n.base.z),s.rotation.set(Math.sin(e*1.3+n.phase)*.35,e*1.6+n.phase,Math.cos(e*1.1+n.phase)*.25),!(n.scaleT<.5))for(let c of this.karts){if(!c||!c.position)continue;let h=Nl(c)+fM,u=c.position.x-n.base.x,d=c.position.z-n.base.z,f=c.position.y+.6-n.base.y;if(u*u+d*d<h*h&&Math.abs(f)<2.6){this._pickupBox(n,c);break}}}}_pickupBox(t,e){if(t.active=!1,t.timer=hM,t.holder.visible=!1,Bt.emit("item:pickup",{kart:e,position:t.base}),e.item==null&&!this.roulettes.has(e)&&!e.finished){let n=this._rollItem(e),s=e.isPlayer?dM:Np+Math.random()*(pM-Np);this.roulettes.set(e,{timer:0,duration:s,final:n,display:Zo[Math.random()*Zo.length|0],cycleTimer:0}),Bt.emit("item:roulette",{kart:e})}}_rollItem(t){let e=Math.max(1,this.karts.length),n=xn(t.place,Math.ceil(e/2));n=Math.min(Math.max(n,1),e);let s=e<=1?3:Math.round((n-1)/(e-1)*7),r=AM[Math.min(7,Math.max(0,s))],o=this.entities.some(c=>c.type==="blue_shell"&&!c.dead)||this.karts.some(c=>c&&c.item==="blue_shell"),a=0;for(let c=0;c<io.length;c++)io[c]==="blue_shell"&&(o||n===1)||(a+=r[c]);let l=Math.random()*a;for(let c=0;c<io.length;c++)if(!(io[c]==="blue_shell"&&(o||n===1))&&(l-=r[c],l<=0))return io[c];return"banana"}_updateRoulettes(t){for(let[e,n]of this.roulettes){n.timer+=t,n.cycleTimer-=t;let s=n.duration-n.timer;if(n.cycleTimer<=0){n.cycleTimer=s<.4?.14:.07;let r=Zo.indexOf(n.display);r=(r+1+(Math.random()*2|0))%Zo.length,n.display=Zo[r]}n.timer>=n.duration&&(this.roulettes.delete(e),e.item=n.final,e.itemCount=n.final==="triple_mushroom"?3:1,this._getState(e).cooldown=.2,Bt.emit("item:got",{kart:e,item:n.final}))}}_getState(t){let e=this.kartState.get(t);return e||(e={prevItem:!1,cooldown:0},this.kartState.set(t,e)),e}_updateUse(t){for(let e of this.karts){if(!e)continue;let n=this._getState(e);n.cooldown=Math.max(0,n.cooldown-t);let s=!!e.input?.item,r=s&&!n.prevItem;n.prevItem=s,!(!r||n.cooldown>0)&&(e.item==null||this.roulettes.has(e)||e.controlsLocked&&!e.finished||(n.cooldown=mM,this._useItem(e)))}}_useItem(t){let e=t.item,n=!0;try{switch(e){case"mushroom":case"triple_mushroom":t.applyBoost?.(Ve.mushroomBoostTime,1);break;case"banana":this._spawnBanana(t);break;case"green_shell":this._spawnShell(t,"green_shell");break;case"red_shell":this._spawnShell(t,"red_shell");break;case"blue_shell":this._spawnBlue(t);break;case"star":t.startStar?.(Ve.starTime);break;case"lightning":this._lightning(t);break;default:n=!0}}catch(s){console.error("[items] use failed",e,s)}if(Bt.emit("item:use",{kart:t,item:e==="triple_mushroom"?"mushroom":e}),n){let s=xn(t.itemCount,1)-1;e==="triple_mushroom"&&s>0?t.itemCount=s:(t.item=null,t.itemCount=0)}}_lightning(t){Bt.emit("item:lightning",{by:t});for(let e of this.karts)!e||e===t||xn(e.starTimer)>0||(e.applyHit?.("shrink"),(e.item!=null||this.roulettes.has(e))&&(e.item=null,e.itemCount=0,this.roulettes.delete(e)),Bt.emit("item:hit",{kart:e,item:"lightning",by:t}))}_acquire(t){let e=this.pools.get(t),n=e&&e.length?e.pop():null;return n||(n=Gp(t)),n.visible=!0,n.scale.setScalar(1),n.rotation.set(0,0,0),this.group.add(n),n}_release(t){if(!t)return;this.group.remove(t);let e=t.userData.type;this.pools.has(e)||this.pools.set(e,[]),this.pools.get(e).push(t)}_groundHeight(t,e){let n=this.track;if(!n?.getSurfaceInfo)return t.y;try{let s=n.getSurfaceInfo(t,e?e.t:void 0);if(s&&(e&&Number.isFinite(s.t)&&(e.t=s.t),Number.isFinite(s.height)))return s.height}catch{}return t.y}_makeEntity(t,e,n){let s={type:t,owner:e,dead:!1,age:0,pos:n.clone(),vel:new P,t:xn(e?.trackT,void 0),bounces:0,life:0,flying:!1,holder:this._acquire(t),target:null,phase:"travel",hoverTimer:0,spin:Math.random()*6,radius:t==="banana"?EM:Fp};return s.hazard={position:s.pos,radius:s.radius,type:t,velocity:s.vel,owner:e},s.holder.position.copy(s.pos),this.entities.push(s),this._enforceCaps(t),s}_enforceCaps(t){let e=t==="banana"?TM:wM,n=0;for(let s=this.entities.length-1;s>=0;s--){let r=this.entities[s];if(r.dead)continue;let o=r.type==="banana";t==="banana"===o&&(n++,n>e&&this._kill(r,!0))}}_spawnBanana(t){let e=Yu(t,ln),n=!!t.input?.throwForward,s=Nl(t);if(n){Ne.copy(t.position).addScaledVector(e,s+1.2),Ne.y+=1.2;let r=this._makeEntity("banana",t,Ne);r.flying=!0,r.vel.copy(e).multiplyScalar(Math.max(0,xn(t.speed))+24),r.vel.y=11}else{Ne.copy(t.position).addScaledVector(e,-(s+1.1));let r=this._makeEntity("banana",t,Ne);r.pos.y=this._groundHeight(r.pos,r),r.holder.rotation.y=Math.random()*Math.PI*2}}_spawnShell(t,e){let n=Yu(t,ln),s=!!t.input?.lookBack,r=s?-1:1,o=Nl(t);Ne.copy(t.position).addScaledVector(n,r*(o+Fp+.6));let a=this._makeEntity(e,t,Ne);a.pos.y=this._groundHeight(a.pos,a)+Op;let l=Math.max(0,xn(t.speed)*(s?0:1)),c=(e==="red_shell"?zp:xM)+l*.35;a.vel.copy(n).multiplyScalar(r*c),a.speed=c,e==="red_shell"&&(a.target=s?null:this._kartAhead(t),a.homing=!s)}_spawnBlue(t){Ne.copy(t.position),Ne.y+=2.5;let e=this._makeEntity("blue_shell",t,Ne);if(e.t=xn(t.trackT,e.t),!Number.isFinite(e.t))try{e.t=this.track.getSurfaceInfo(t.position)?.t??0}catch{e.t=0}e.phase="rise",e.alt=2.5,e.target=this._leader()}_leader(){let t=null,e=-1/0;for(let n of this.karts){if(!n)continue;let s;Number.isFinite(n.place)?s=-n.place*1e3:Number.isFinite(n.raceProgress)?s=n.raceProgress:s=xn(n.trackT),s>e&&(e=s,t=n)}return t}_kartAhead(t){if(Number.isFinite(t.place)&&t.place>1){for(let r of this.karts)if(r&&r!==t&&r.place===t.place-1)return r}if(Number.isFinite(t.place)&&t.place===1)return null;let e=Yu(t,qu),n=null,s=1/0;for(let r of this.karts){if(!r||r===t||!r.position||(Ne.subVectors(r.position,t.position),Ne.dot(e)<=0))continue;let o=Ne.lengthSq();o<s&&(s=o,n=r)}return n}_updateEntities(t){let e=this.entities;for(let s=0;s<e.length;s++){let r=e[s];if(!r.dead)switch(r.age+=t,r.type){case"banana":this._simBanana(r,t);break;case"green_shell":this._simShell(r,t,!1);break;case"red_shell":this._simShell(r,t,!0);break;case"blue_shell":this._simBlue(r,t);break;default:break}}this._collide();let n=0;for(let s=0;s<e.length;s++){let r=e[s];r.dead?this._release(r.holder):e[n++]=r}e.length=n}_simBanana(t,e){if(t.flying){t.vel.y-=Ve.gravity*.8*e,t.pos.addScaledVector(t.vel,e);let n=this._wall(t.pos,t.radius);if(n){ln.copy(n.normal),ln.y=0,ln.normalize(),t.pos.addScaledVector(ln,n.depth);let r=t.vel.dot(ln);r<0&&t.vel.addScaledVector(ln,-1.6*r)}let s=this._groundHeight(t.pos,t);t.pos.y<=s&&t.vel.y<0&&(t.pos.y=s,t.flying=!1,t.vel.set(0,0,0)),t.holder.rotation.x+=e*9}else t.holder.rotation.x*=Math.max(0,1-e*12),t.age<.6?t.holder.scale.setScalar(1+Math.sin(t.age*18)*.15*(1-t.age/.6)):t.holder.scale.setScalar(1);t.holder.position.copy(t.pos)}_wall(t,e){let n=this.track;if(!n?.resolveWall)return null;try{let s=n.resolveWall(t,e);if(s&&s.normal&&Number.isFinite(s.depth))return s}catch{}return null}_simShell(t,e,n){t.life+=e;let s=n?yM:_M;if(t.life>s){this._kill(t,!0);return}n&&t.homing&&t.age>.18&&this._steerRed(t,e);let r=Math.max(1,Math.ceil(t.vel.length()*e/1.2)),o=e/r;for(let c=0;c<r;c++){t.pos.x+=t.vel.x*o,t.pos.z+=t.vel.z*o;let h=this._wall(t.pos,t.radius);if(h){if(ln.copy(h.normal),ln.y=0,ln.lengthSq()<1e-6)continue;ln.normalize(),t.pos.addScaledVector(ln,h.depth+.02);let u=t.vel.x*ln.x+t.vel.z*ln.z;if(u<0){if(t.vel.x-=2*u*ln.x,t.vel.z-=2*u*ln.z,t.bounces++,!n&&t.bounces>vM){this._kill(t,!0);return}if(n&&!t.homing){this._kill(t,!0);return}}}}let a=this._groundHeight(t.pos,t)+Op;t.pos.y>a+.05?(t.vel.y-=Ve.gravity*e,t.pos.y+=t.vel.y*e,t.pos.y<a&&(t.pos.y=a,t.vel.y=0)):(t.pos.y=a,t.vel.y=0),t.spin+=e*16;let l=t.holder;l.position.copy(t.pos),l.rotation.set(0,t.spin,0)}_steerRed(t,e){let n=this.track,s=t.target;s&&s.finished&&s.place==null&&(s=null);let r=ln,o=!1;if(s&&s.position&&(Ne.subVectors(s.position,t.pos),Ne.y=0,Ne.length()<MM&&(r.copy(Ne),o=!0)),!o)if(n?.getPointAt&&Number.isFinite(t.t)&&Number.isFinite(n.length)&&n.length>0){let f=14/n.length;try{let p=n.getPointAt(Hp(t.t+f));p?r.set(p.x-t.pos.x,0,p.z-t.pos.z):r.copy(t.vel)}catch{r.copy(t.vel)}}else s&&s.position?(r.subVectors(s.position,t.pos),r.y=0):r.copy(t.vel);if(r.y=0,r.lengthSq()<1e-6)return;let a=Math.atan2(t.vel.x,t.vel.z),c=Math.atan2(r.x,r.z)-a;for(;c>Math.PI;)c-=Math.PI*2;for(;c<-Math.PI;)c+=Math.PI*2;let h=(o?Bp*1.6:Bp)*e,u=a+Math.max(-h,Math.min(h,c)),d=t.speed||zp;t.vel.x=Math.sin(u)*d,t.vel.z=Math.cos(u)*d}_simBlue(t,e){t.life+=e;let n=this.track,s=this._leader();s&&(t.target=s);let r=t.target;if(t.spin+=e*10,t.life>bM||!r||!r.position){this._explodeBlue(t);return}if(t.phase==="rise"&&(t.alt=Math.min(Ul,t.alt+e*12),t.alt>=Ul-.01&&(t.phase="travel")),t.phase==="rise"||t.phase==="travel")if(Ne.subVectors(r.position,t.pos),Ne.y=0,Ne.length()<22)t.phase="seek";else if(n?.getPointAt&&Number.isFinite(n.length)&&n.length>0){t.t=Hp(xn(t.t)+Wu*e/n.length);let l=null;try{l=n.getPointAt(t.t)}catch{l=null}if(l){let c=Math.min(1,e*8);t.pos.x+=(l.x-t.pos.x)*c,t.pos.z+=(l.z-t.pos.z)*c,t.pos.y+=(l.y+t.alt-t.pos.y)*c}}else Ne.normalize(),t.pos.addScaledVector(Ne,Wu*e);if(t.phase==="seek"){Ne.subVectors(r.position,t.pos),Ne.y=0;let a=Ne.length(),l=Math.min(a,(Wu*.9+xn(r.speed)*.5)*e);a>.001&&t.pos.addScaledVector(Ne.normalize(),l),t.pos.y+=(r.position.y+Ul-t.pos.y)*Math.min(1,e*5),a<2&&(t.phase="hover",t.hoverTimer=0)}if(t.phase==="hover"){t.hoverTimer+=e;let a=t.hoverTimer/SM,l=t.hoverTimer*9,c=1.4*(1-a);t.pos.x=r.position.x+Math.cos(l)*c,t.pos.z=r.position.z+Math.sin(l)*c;let h=Ul*(1-a)+1.6*a+Math.sin(t.hoverTimer*20)*.1;if(t.pos.y=r.position.y+h,t.spin+=e*20*a,a>=1){this._explodeBlue(t);return}}let o=t.holder;o.position.copy(t.pos),o.rotation.set(Math.sin(t.life*6)*.2,t.spin,Math.cos(t.life*5)*.2)}_explodeBlue(t){let e=t.phase==="hover"&&t.target?.position?qu.copy(t.target.position):qu.copy(t.pos);t.phase!=="hover"&&(e.y=this._groundHeight(e,null)),Bt.emit("item:explode",{position:e.clone(),radius:Xu,kind:"blue_shell"});for(let n of this.karts){if(!n||!n.position)continue;let s=n.position.x-e.x,r=n.position.z-e.z,o=n.position.y-e.y;s*s+r*r<Xu*Xu&&Math.abs(o)<6&&this._hitKart(n,"tumble","blue_shell",t.owner)}t.dead=!0}_hitKart(t,e,n,s){return xn(t.starTimer)>0||xn(t.invulnTimer)>0?!1:(t.applyHit?.(e),Bt.emit("item:hit",{kart:t,item:n,by:s}),!0)}_kill(t,e){t.dead||(t.dead=!0,e&&t.type!=="banana"&&Bt.emit("item:explode",{position:t.pos.clone(),radius:1.6,kind:"small"}))}_collide(){let t=this.entities,e=this.karts;for(let n=0;n<t.length;n++){let s=t[n];if(!(s.dead||s.type==="blue_shell")&&!(s.type==="banana"&&s.flying&&s.vel.y>0)){for(let r of e){if(!r||!r.position||r===s.owner&&s.age<gM)continue;let o=Nl(r)+s.radius,a=r.position.x-s.pos.x,l=r.position.z-s.pos.z,c=r.position.y+.4-s.pos.y;if(!(a*a+l*l>o*o||Math.abs(c)>1.9)){if(xn(r.starTimer)>0){s.dead=!0,Bt.emit("item:explode",{position:s.pos.clone(),radius:1.4,kind:"small"});break}if(s.type==="banana")if(this._hitKart(r,"spin","banana",s.owner)||xn(r.invulnTimer)<=0)s.dead=!0;else continue;else this._hitKart(r,"tumble",s.type,s.owner),this._kill(s,!0);break}}if(!s.dead&&s.type!=="banana")for(let r=0;r<t.length;r++){if(r===n)continue;let o=t[r];if(o.dead||o.type==="blue_shell"||o.type==="banana"&&o.flying||s.age<.1&&o.owner===s.owner&&o.type!=="banana")continue;let a=s.radius+o.radius,l=o.pos.x-s.pos.x,c=o.pos.z-s.pos.z,h=o.pos.y-s.pos.y;if(l*l+c*c<a*a&&Math.abs(h)<1.5){this._kill(s,!0),o.dead=!0;break}}}}}};var ju={};ys(ju,{Effects:()=>Ju});var PM=5e3,LM=2200,DM=700,kM=10,UM=16,Fl=8,cr=5,$o=70,NM=[16777215,4176127,16751135,14696699],FM=[16777215,11068159,16764784,16030975],re=new P,Vp=new P,so=new P,di=new P,hr=new P,zl=new yn,Bl=new bn,Hl=new P,ii=new ue,OM=new ft,PS=new ft,Ol=new ft,Wp=new pt,zM=new P(0,0,1),it=(i,t)=>i+Math.random()*(t-i),Xe=(i,t=0)=>Number.isFinite(i)?i:t;function BM(){let i=document.createElement("canvas");i.width=i.height=64;let t=i.getContext("2d"),e=t.createRadialGradient(32,32,0,32,32,32);e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(.25,"rgba(255,255,255,0.85)"),e.addColorStop(.55,"rgba(255,255,255,0.3)"),e.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=e,t.fillRect(0,0,64,64);let n=new jn(i);return n.wrapS=n.wrapT=Gi,n}function HM(){let i=document.createElement("canvas");i.width=i.height=128;let t=i.getContext("2d"),e=[[64,64,44,.9],[44,56,30,.7],[84,58,30,.7],[58,82,28,.6],[80,80,26,.6],[62,40,26,.6]];for(let[s,r,o,a]of e){let l=t.createRadialGradient(s,r,0,s,r,o);l.addColorStop(0,`rgba(255,255,255,${a})`),l.addColorStop(.6,`rgba(255,255,255,${a*.45})`),l.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=l,t.fillRect(0,0,128,128)}let n=new jn(i);return n.wrapS=n.wrapT=Gi,n}var GM=`
  attribute vec4 aColor;
  attribute float aSize;
  attribute float aRot;
  attribute float aShape;
  uniform float uScale;
  varying vec4 vColor;
  varying float vRot;
  varying float vShape;
  void main() {
    vColor = aColor; vRot = aRot; vShape = aShape;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / max(0.2, -mv.z);
    if (aSize <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`,VM=`
  uniform sampler2D uMap;
  varying vec4 vColor;
  varying float vRot;
  varying float vShape;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    float a = texture2D(uMap, p + 0.5).a;
    if (vShape > 0.5) {
      vec2 q = abs(p * 2.0);
      float star = max(0.0, 1.0 - q.x * 7.0) * max(0.0, 1.0 - q.y) + max(0.0, 1.0 - q.y * 7.0) * max(0.0, 1.0 - q.x);
      a = max(a * 0.75, star);
    }
    a *= vColor.a;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor.rgb, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,Gl=class{constructor(t,e,n,s){this.n=t,this.cursor=0,this.fadeIn=s,this.alive=0,this.pos=new Float32Array(t*3),this.col=new Float32Array(t*4),this.size=new Float32Array(t),this.rot=new Float32Array(t),this.shape=new Float32Array(t),this.vel=new Float32Array(t*3),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.s0=new Float32Array(t),this.s1=new Float32Array(t),this.c0=new Float32Array(t*3),this.c1=new Float32Array(t*3),this.a0=new Float32Array(t),this.grav=new Float32Array(t),this.drag=new Float32Array(t),this.spin=new Float32Array(t);let r=new qe;this.aPos=new Ie(this.pos,3).setUsage(Yi),this.aCol=new Ie(this.col,4).setUsage(Yi),this.aSize=new Ie(this.size,1).setUsage(Yi),this.aRot=new Ie(this.rot,1).setUsage(Yi),this.aShape=new Ie(this.shape,1).setUsage(Yi),r.setAttribute("position",this.aPos),r.setAttribute("aColor",this.aCol),r.setAttribute("aSize",this.aSize),r.setAttribute("aRot",this.aRot),r.setAttribute("aShape",this.aShape),r.boundingSphere=new qi(new P,1e6),this.geometry=r,this.material=new Be({uniforms:{uMap:{value:e},uScale:{value:600}},vertexShader:GM,fragmentShader:VM,transparent:!0,depthWrite:!1,blending:n}),this.points=new Ya(r,this.material),this.points.frustumCulled=!1;let o=this.material.uniforms.uScale;this.points.onBeforeRender=(a,l,c)=>{c?.isPerspectiveCamera&&(a.getDrawingBufferSize(Wp),o.value=Wp.y/(2*Math.tan(Uo.degToRad(c.fov*.5))*(c.zoom?1/c.zoom:1)))}}spawn(t,e,n,s,r,o,a,l,c,h,u,d,f,p,x=0,g=0){let m=this.cursor;this.cursor=(m+1)%this.n;let M=m*3;this.pos[M]=t,this.pos[M+1]=e,this.pos[M+2]=n,this.vel[M]=s,this.vel[M+1]=r,this.vel[M+2]=o,this.life[m]=a,this.maxLife[m]=a,this.s0[m]=l,this.s1[m]=c,this.c0[M]=h.r,this.c0[M+1]=h.g,this.c0[M+2]=h.b,this.c1[M]=u.r,this.c1[M+1]=u.g,this.c1[M+2]=u.b,this.a0[m]=d,this.grav[m]=f,this.drag[m]=p,this.shape[m]=x,this.spin[m]=g,this.rot[m]=Math.random()*Math.PI*2,this.size[m]=l;let _=m*4;this.col[_]=h.r,this.col[_+1]=h.g,this.col[_+2]=h.b,this.col[_+3]=this.fadeIn?0:d,this.alive=Math.max(this.alive,1)}update(t){if(this.alive===0)return;let e=0,{pos:n,vel:s,life:r,maxLife:o,s0:a,s1:l,c0:c,c1:h,a0:u,grav:d,drag:f,col:p,size:x,rot:g,spin:m}=this;for(let M=0;M<this.n;M++){if(r[M]<=0)continue;if(r[M]-=t,r[M]<=0){x[M]=0,p[M*4+3]=0;continue}e++;let _=M*3,v=Math.max(0,1-f[M]*t);s[_]*=v,s[_+1]=s[_+1]*v-d[M]*t,s[_+2]*=v,n[_]+=s[_]*t,n[_+1]+=s[_+1]*t,n[_+2]+=s[_+2]*t;let w=1-r[M]/o[M];x[M]=a[M]+(l[M]-a[M])*w,g[M]+=m[M]*t;let R=M*4;p[R]=c[_]+(h[_]-c[_])*w,p[R+1]=c[_+1]+(h[_+1]-c[_+1])*w,p[R+2]=c[_+2]+(h[_+2]-c[_+2])*w;let T=this.fadeIn?Math.min(1,w*6):1;p[R+3]=u[M]*T*(1-w)*(this.fadeIn?1:1-w*.3)}this.alive=e,this.aPos.needsUpdate=!0,this.aCol.needsUpdate=!0,this.aSize.needsUpdate=!0,this.aRot.needsUpdate=!0,this.aShape.needsUpdate=!0}clear(){this.life.fill(0),this.size.fill(0),this.alive=1}dispose(){this.geometry.dispose(),this.material.dispose()}},$u=class{constructor(t){this.n=t,this.cursor=0,this.alive=0,this.geometry=new Oe(1,1,1),this.material=new ye({roughness:.45,metalness:.05,emissive:2236962}),this.mesh=new Bn(this.geometry,this.material,t),this.mesh.instanceMatrix.setUsage(Yi),this.mesh.frustumCulled=!1,this.mesh.castShadow=!1,this.mesh.instanceColor=new Is(new Float32Array(t*3),3),this.pos=new Float32Array(t*3),this.vel=new Float32Array(t*3),this.rot=new Float32Array(t*3),this.angVel=new Float32Array(t*3),this.scl=new Float32Array(t*3),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.grav=new Float32Array(t),this.drag=new Float32Array(t),this.floor=new Float32Array(t),this.flutter=new Float32Array(t),ii.makeScale(0,0,0);for(let e=0;e<t;e++)this.mesh.setMatrixAt(e,ii)}spawn(t,e,n,s,r,o,a,l,c,h,u,d,f,p,x=0){let g=this.cursor;this.cursor=(g+1)%this.n;let m=g*3;this.pos[m]=t,this.pos[m+1]=e,this.pos[m+2]=n,this.vel[m]=s,this.vel[m+1]=r,this.vel[m+2]=o,this.rot[m]=Math.random()*6,this.rot[m+1]=Math.random()*6,this.rot[m+2]=Math.random()*6,this.angVel[m]=it(-10,10),this.angVel[m+1]=it(-10,10),this.angVel[m+2]=it(-10,10),this.scl[m]=l,this.scl[m+1]=c,this.scl[m+2]=h,this.life[g]=a,this.maxLife[g]=a,this.grav[g]=d,this.drag[g]=f,this.floor[g]=p,this.flutter[g]=x,this.mesh.setColorAt(g,u),this.mesh.instanceColor.needsUpdate=!0,this.alive=Math.max(1,this.alive)}update(t,e){if(this.alive===0)return;let n=0,{pos:s,vel:r,rot:o,angVel:a,scl:l,life:c,maxLife:h,grav:u,drag:d,floor:f,flutter:p}=this;for(let x=0;x<this.n;x++){if(c[x]<=0)continue;let g=x*3;if(c[x]-=t,c[x]<=0){ii.makeScale(0,0,0),this.mesh.setMatrixAt(x,ii);continue}n++;let m=Math.max(0,1-d[x]*t);r[g]*=m,r[g+2]*=m,r[g+1]=r[g+1]*m-u[x]*t,p[x]>0&&(s[g]+=Math.sin(e*7+x)*p[x]*t,s[g+2]+=Math.cos(e*6+x*1.3)*p[x]*t),s[g]+=r[g]*t,s[g+1]+=r[g+1]*t,s[g+2]+=r[g+2]*t,s[g+1]<f[x]&&(s[g+1]=f[x],r[g+1]<0&&(r[g+1]*=-.35),r[g]*=.6,r[g+2]*=.6,a[g]*=.6,a[g+1]*=.6,a[g+2]*=.6),o[g]+=a[g]*t,o[g+1]+=a[g+1]*t,o[g+2]+=a[g+2]*t;let M=c[x]/h[x],_=M<.2?M/.2:1;Bl.set(o[g],o[g+1],o[g+2]),zl.setFromEuler(Bl),re.set(s[g],s[g+1],s[g+2]),Hl.set(l[g]*_,l[g+1]*_,l[g+2]*_),ii.compose(re,zl,Hl),this.mesh.setMatrixAt(x,ii)}this.alive=n,this.mesh.instanceMatrix.needsUpdate=!0}clear(){this.life.fill(0),ii.makeScale(0,0,0);for(let t=0;t<this.n;t++)this.mesh.setMatrixAt(t,ii);this.mesh.instanceMatrix.needsUpdate=!0,this.alive=0}dispose(){this.geometry.dispose(),this.material.dispose(),this.mesh.dispose?.()}},WM=`
  uniform float uTime;
  varying float vNoise;
  varying vec3 vN;
  varying vec3 vV;
  float n3(vec3 p) {
    return sin(p.x * 3.1 + uTime * 5.0) * sin(p.y * 2.7 + uTime * 4.3) * sin(p.z * 3.3 + uTime * 6.1)
         + 0.5 * sin(p.x * 7.3 - uTime * 7.0) * sin(p.z * 6.1 + uTime * 5.0);
  }
  void main() {
    vec3 p = position;
    float n = n3(normal * 2.0);
    vNoise = n;
    p += normal * n * 0.22;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,XM=`
  uniform float uLife;
  uniform float uOpacity;
  varying float vNoise;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fres = 1.0 - abs(dot(vN, vV));
    float heat = clamp(0.9 - uLife * 1.5 + vNoise * 0.4 - fres * 0.75, 0.0, 1.0);
    vec3 col = mix(vec3(0.35, 0.03, 0.0), vec3(1.0, 0.45, 0.05), smoothstep(0.0, 0.45, heat));
    col = mix(col, vec3(1.0, 0.95, 0.65), smoothstep(0.55, 1.0, heat));
    float edge = smoothstep(0.0, 0.55, 1.0 - fres);
    float a = uOpacity * pow(1.0 - uLife, 0.8) * edge;
    gl_FragColor = vec4(col * 1.15, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,qM=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`,YM=`
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uThick;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float ring = smoothstep(1.0 - uThick, 1.0 - uThick * 0.35, d) * (1.0 - smoothstep(0.93, 1.0, d));
    float inner = (1.0 - smoothstep(0.0, 1.0 - uThick, d)) * 0.12;
    float a = (ring + inner) * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,ZM=`
  attribute float aAlpha;
  varying float vAlpha;
  void main() { vAlpha = aAlpha; gl_Position = projectionMatrix * vec4(position, 1.0); }
`,KM=`
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.004) discard;
    gl_FragColor = vec4(uColor, vAlpha);
    #include <colorspace_fragment>
  }
`,Ju=class{constructor(t,e){this.scene=t,this.camera=e,this.time=0,this.group=new pe,this.group.name="Effects",t?.add(this.group),this.glowTex=BM(),this.smokeTex=HM(),this.add=new Gl(PM,this.glowTex,xi,!1),this.smoke=new Gl(LM,this.smokeTex,cs,!0),this.chunks=new $u(DM),this.smoke.points.renderOrder=5,this.add.points.renderOrder=6,this.group.add(this.chunks.mesh,this.smoke.points,this.add.points),this.fireGeo=new Hn(1,4),this.fireballs=[];for(let l=0;l<kM;l++){let c=new Be({uniforms:{uTime:{value:0},uLife:{value:0},uOpacity:{value:1}},vertexShader:WM,fragmentShader:XM,transparent:!0,depthWrite:!1,blending:cs}),h=new $t(this.fireGeo,c);h.visible=!1,h.renderOrder=7,this.group.add(h),this.fireballs.push({mesh:h,mat:c,t:0,dur:0,size:1,active:!1,seed:Math.random()*10})}this.fireCursor=0,this.ringGeo=new zn(2,2),this.rings=[];for(let l=0;l<UM;l++){let c=new Be({uniforms:{uColor:{value:new ft(1,1,1)},uOpacity:{value:0},uThick:{value:.3}},vertexShader:qM,fragmentShader:YM,transparent:!0,depthWrite:!1,blending:xi,side:$e}),h=new $t(this.ringGeo,c);h.visible=!1,h.renderOrder=8,this.group.add(h),this.rings.push({mesh:h,mat:c,t:0,dur:0,r0:0,r1:1,active:!1,kart:null,back:0})}this.ringCursor=0;let n=new Ls;for(let l=0;l<10;l++){let c=l%2===0?.26:.11,h=l/10*Math.PI*2+Math.PI/2;l===0?n.moveTo(Math.cos(h)*c,Math.sin(h)*c):n.lineTo(Math.cos(h)*c,Math.sin(h)*c)}n.closePath(),this.starGeo=new vi(n,{depth:.07,bevelEnabled:!1}),this.starGeo.center(),this.starMat=new Sn({color:16777215}),this.starMesh=new Bn(this.starGeo,this.starMat,Fl*cr),this.starMesh.frustumCulled=!1,this.starMesh.instanceMatrix.setUsage(Yi),this.starMesh.instanceColor=new Is(new Float32Array(Fl*cr*3),3),ii.makeScale(0,0,0);let s=[16769357,16777215,16757504,16774557,16766287];for(let l=0;l<Fl*cr;l++)this.starMesh.setMatrixAt(l,ii),this.starMesh.setColorAt(l,OM.setHex(s[l%s.length]));this.group.add(this.starMesh),this.starSlots=[];for(let l=0;l<Fl;l++)this.starSlots.push({kart:null,t:0,dur:0,active:!1});this.streakPos=new Float32Array($o*4*3),this.streakAlpha=new Float32Array($o*4);let r=new Uint16Array($o*6);for(let l=0;l<$o;l++){let c=l*4,h=l*6;r[h]=c,r[h+1]=c+2,r[h+2]=c+1,r[h+3]=c+1,r[h+4]=c+2,r[h+5]=c+3}let o=new qe;this.aStreakPos=new Ie(this.streakPos,3).setUsage(Yi),this.aStreakAlpha=new Ie(this.streakAlpha,1).setUsage(Yi),o.setAttribute("position",this.aStreakPos),o.setAttribute("aAlpha",this.aStreakAlpha),o.setIndex(new Ie(r,1)),this.streakGeo=o,this.streakMat=new Be({uniforms:{uColor:{value:new ft(.9,.95,1)}},vertexShader:ZM,fragmentShader:KM,transparent:!0,depthWrite:!1,depthTest:!1,blending:xi,side:$e}),this.streakMesh=new $t(o,this.streakMat),this.streakMesh.frustumCulled=!1,this.streakMesh.renderOrder=999,this.streakMesh.visible=!1,this.group.add(this.streakMesh),this.streaks=[];for(let l=0;l<$o;l++)this.streaks.push({ang:0,k:0,d:0,len:0,w:0,spd:0,bright:0});for(let l of this.streaks)this._resetStreak(l,!0);this.streakIntensity=0,this.kartState=new Map,this.driftCols=NM.map(l=>new ft(l)),this.driftHot=FM.map(l=>new ft(l)),this.C={white:new ft(16777215),flameCore:new ft(1,.72,.22),flameEnd:new ft(.85,.1,0),flameBlue:new ft(.55,.75,1),smokeLight:new ft(15263976),smokeGrey:new ft(11579568),smokeDark:new ft(3814704),smokeDarker:new ft(2235931),dust:new ft(13215864),dustEnd:new ft(14733230),grass1:new ft(6142778),grass2:new ft(4034341),dirt:new ft(8016432),spark:new ft(1,.85,.4),sparkEnd:new ft(1,.3,.05),orange:new ft(16742938),yellow:new ft(16769357),water:new ft(14218239),waterEnd:new ft(8374527),debris:new ft(3879728)},this.rainbow=[16726876,16752412,16769357,4054148,3126783,9067775,16735432].map(l=>new ft(l)),this.unsubs=[];let a=(l,c)=>this.unsubs.push(Bt.on(l,h=>{try{c(h||{})}catch(u){console.error("[effects]",l,u)}}));a("item:pickup",l=>this.burst("itemBox",l.position||l.kart?.position)),a("item:explode",l=>this.burst("explosion",l.position,{radius:l.radius,kind:l.kind})),a("kart:hit",l=>{l.kart&&(l.kind==="shrink"?this.burst("shrink",l.kart.position,{kart:l.kart}):this.burst("hitStars",l.kart.position,{kart:l.kart,kind:l.kind}))}),a("kart:land",l=>l.kart&&this.burst("landingDust",l.kart.position,{kart:l.kart})),a("race:finish",l=>{l.kart?.isPlayer&&this.burst("confetti",l.kart.position,{kart:l.kart})}),a("kart:wallBump",l=>{let c=l.kart;c?.position&&(this._kartForward(c,di),so.copy(c.position).addScaledVector(di,Xe(c.radius,1.3)*.8),so.y+=.5,this.burst("sparks",so,{intensity:l.intensity}))}),a("kart:bump",l=>{!l.a?.position||!l.b?.position||(so.addVectors(l.a.position,l.b.position).multiplyScalar(.5),so.y+=.6,this.burst("sparks",so,{intensity:l.intensity,small:!0}))}),a("kart:miniTurbo",l=>l.kart&&this.burst("miniTurbo",l.kart.position,{kart:l.kart,level:l.level})),a("kart:boost",l=>{if(!l.kart)return;let c=this._state(l.kart);(l.source==="mushroom"||l.source==="item")&&(c.bigBoost=!0)}),a("item:use",l=>{if(l.kart&&(l.item==="mushroom"||l.item==="triple_mushroom")){let c=this._state(l.kart);c.bigBoost=!0,c.boostKick=.25}})}_state(t){let e=this.kartState.get(t);return e||(e={spark:0,smoke:0,flame:0,dust:0,fleck:0,star:0,puff:0,bigBoost:!1,boostKick:0,lastBoost:0},this.kartState.set(t,e)),e}_kartForward(t,e){let n=Xe(t.heading,t.object3D?.rotation?.y??0);return e.set(Math.sin(n),0,Math.cos(n))}_anchor(t,e,n,s,r,o){let a=t.model?.anchors?.[e];if(a&&a.isObject3D)try{return a.updateWorldMatrix(!0,!1),o.setFromMatrixPosition(a.matrixWorld)}catch{}let l=t.object3D;if(l&&l.isObject3D)return l.updateWorldMatrix(!0,!1),o.set(n,s,r).applyMatrix4(l.matrixWorld);this._kartForward(t,di);let c=t.position||Vp.set(0,0,0);return o.set(c.x+di.z*n+di.x*r,c.y+s,c.z-di.x*n+di.z*r)}update(t,e){if(t>0){t=Math.min(t,.1),this.time+=t;try{if(e)for(let n of e)n&&this._emitKart(n,t)}catch(n){console.error("[effects] emit",n)}try{this.add.update(t),this.smoke.update(t),this.chunks.update(t,this.time),this._updateFireballs(t),this._updateRings(t),this._updateStars(t),this._updateStreaks(t,e)}catch(n){console.error("[effects] update",n)}}}_emitKart(t,e){if(!t.position)return;let n=this._state(t),s=this.add,r=this.smoke,o=this.C,a=Xe(t.speed),l=Math.abs(a),c=this._kartForward(t,di);hr.set(-c.z,0,c.x);let h=Xe(t.velocity?.x),u=Xe(t.velocity?.y),d=Xe(t.velocity?.z),f=Xe(t.object3D?.scale?.x,1)*(Xe(t.shrinkTimer)>0?.7:1),p=!!t.airborne;if(t.drifting&&!p){let g=Math.max(0,Math.min(3,Xe(t.driftLevel)|0)),m=Xe(t.driftDir,1);if(g>=1){n.spark+=e*(g===3?110:g===2?90:70);let M=this.driftCols[g],_=this.driftHot[g];for(;n.spark>=1;){n.spark-=1;let v=Math.random()<.5;this._anchor(t,v?"wheelRL":"wheelRR",v?.78:-.78,.18,-.85,re);let w=(v?1:-1)*it(1,4),R=it(3,9);s.spawn(re.x,re.y,re.z,h*.6-c.x*R-hr.x*w,it(3,8),d*.6-c.z*R-hr.z*w,it(.2,.42),it(.5,.85)*f,.08,_,M,1,26,1.5,Math.random()<.3?1:0)}for(n.puff+=e*30;n.puff>=1;){n.puff-=1;for(let v=0;v<2;v++)this._anchor(t,v?"wheelRL":"wheelRR",v?.78:-.78,.25,-.85,re),s.spawn(re.x,re.y,re.z,h,u+1,d,.1,(1.3+g*.35)*f,.6*f,_,M,.9,0,0,0)}n.smoke+=e*8}else n.smoke+=e*22;for(;n.smoke>=1;){n.smoke-=1;let M=Math.random()<.5;this._anchor(t,M?"wheelRL":"wheelRR",M?.78:-.78,.15,-.85,re),r.spawn(re.x,re.y,re.z,h*.15-hr.x*m*it(0,2),it(.8,2),d*.15-hr.z*m*it(0,2),it(.5,.9),.5*f,it(1.8,2.6)*f,o.smokeLight,o.smokeGrey,.5,-1.2,2.5,0,it(-1,1))}}else n.spark=0;let x=Xe(t.boostTimer);if(x>0){let g=n.bigBoost;n.flame+=e*(g?110:75);let m=(g?1.25:.85)*f;for(;n.flame>=1;){n.flame-=1;for(let M=0;M<2;M++){this._anchor(t,M?"exhaustL":"exhaustR",M?.32:-.32,.5,-1.2,re),re.addScaledVector(c,-.35);let _=it(5,10);s.spawn(re.x,re.y,re.z,h-c.x*_+it(-.7,.7),u+it(.3,1.6),d-c.z*_+it(-.7,.7),it(.12,.24),m*it(.9,1.3),m*.3,o.flameCore,o.flameEnd,.75,-3,0,0),g&&Math.random()<.35&&s.spawn(re.x,re.y,re.z,h*.9-c.x*3,u*.9,d*.9-c.z*3,.1,m*1.5,m*.7,o.flameBlue,o.flameEnd,.35,0,0,0)}}n.lastBoost=x}else if(n.flame=0,n.bigBoost=!1,Xe(t.input?.throttle)>.2&&l<14&&!p)for(n.puff+=e*7;n.puff>=1;)n.puff-=1,this._anchor(t,Math.random()<.5?"exhaustL":"exhaustR",.32,.5,-1.2,re),r.spawn(re.x,re.y,re.z,h*.5-c.x*2,it(.6,1.4),d*.5-c.z*2,.6,.25*f,.9*f,o.smokeGrey,o.smokeLight,.35,-.8,2,0,it(-1,1));if(n.boostKick>0&&(n.boostKick-=e),t.surface==="offroad"&&l>4&&!p){let g=Math.min(1,l/30);for(n.dust+=e*28*g,n.fleck+=e*22*g;n.dust>=1;){n.dust-=1;let m=Math.random()<.5;this._anchor(t,m?"wheelRL":"wheelRR",m?.78:-.78,.1,-.85,re),r.spawn(re.x,re.y,re.z,h*.2-c.x*2+it(-1,1),it(1,2.5),d*.2-c.z*2+it(-1,1),it(.6,1),.6*f,it(2,3)*f,o.dust,o.dustEnd,.55,-.5,2,0,it(-1,1))}for(;n.fleck>=1;){n.fleck-=1;let m=Math.random()<.5;this._anchor(t,m?"wheelRL":"wheelRR",m?.78:-.78,.15,-.85,re);let M=Math.random(),_=M<.45?o.grass1:M<.8?o.grass2:o.dirt,v=it(.08,.16);this.chunks.spawn(re.x,re.y,re.z,h*.3-c.x*it(2,6)+it(-2,2),it(4,8),d*.3-c.z*it(2,6)+it(-2,2),it(.5,.8),v,v*.4,v*1.6,_,26,.5,re.y-.3)}}if(Xe(t.starTimer)>0)for(n.star+=e*130;n.star>=1;){n.star-=1;let g=this.rainbow[Math.random()*this.rainbow.length|0];Ol.copy(g).lerp(o.white,.35);let m=it(-1.1,1.1),M=it(.2,1.8),_=it(-1.4,1);re.set(t.position.x+hr.x*m+c.x*_,t.position.y+M,t.position.z+hr.z*m+c.z*_),s.spawn(re.x,re.y,re.z,h*.5+it(-1,1),it(.5,2.5),d*.5+it(-1,1),it(.35,.7),it(.7,1.2)*f,.05,Ol,g,1,-1,2,1,it(-3,3))}}burst(t,e,n={}){try{if(e||(e=n.kart?.position),!e||!Number.isFinite(e.x))return;switch(t){case"itemBox":return this._burstItemBox(e);case"explosion":return this._burstExplosion(e,n);case"confetti":return this._burstConfetti(e,n);case"hitStars":return this._burstHitStars(e,n);case"splash":return this._burstSplash(e,n);case"landingDust":return this._burstLanding(e,n);case"sparks":return this._burstSparks(e,n);case"miniTurbo":return this._burstMiniTurbo(e,n);case"shrink":return this._burstShrink(e,n);case"smoke":return this._burstSmoke(e,n);default:return}}catch(s){console.error("[effects] burst",t,s)}}_burstItemBox(t){let e=this.C;this.add.spawn(t.x,t.y,t.z,0,0,0,.22,3.5,6,e.white,e.white,.9,0,0,0);for(let n=0;n<22;n++){let s=this.rainbow[n%this.rainbow.length],r=Math.random()*Math.PI*2,o=it(-.3,1),a=it(5,11),l=it(.12,.24);this.chunks.spawn(t.x,t.y,t.z,Math.cos(r)*a,o*a*.8+4,Math.sin(r)*a,it(.6,1),l,l,l*.35,s,24,.8,t.y-1.2)}for(let n=0;n<36;n++){let s=this.rainbow[Math.random()*this.rainbow.length|0];Ol.copy(s).lerp(e.white,.5);let r=Math.random()*Math.PI*2,o=it(-1,1),a=it(3,9),l=Math.sqrt(1-o*o);this.add.spawn(t.x,t.y,t.z,Math.cos(r)*l*a,o*a+1.5,Math.sin(r)*l*a,it(.35,.7),it(.4,.7),.05,Ol,s,1,4,2.5,1,it(-4,4))}this._ring(t,0,null,.4,2.6,.3,e.white,.4,"ground",.18)}_burstExplosion(t,e){let n=this.C,s=Xe(e.radius,3),r=Math.max(.4,s/3),o=e.kind==="small"||s<2;this._fireball(t.x,t.y+s*.35,t.z,s*(o?.8:.6),o?.45:.9),o||this._fireball(t.x+it(-1,1)*r,t.y+1.6*r,t.z+it(-1,1)*r,s*.45,.75),this.add.spawn(t.x,t.y+1,t.z,0,0,0,.2,s*1.8,s*2.6,n.flameCore,n.orange,.75,0,0,0);let a=Math.round(o?18:45*Math.min(2,r));for(let h=0;h<a;h++){let u=Math.random()*Math.PI*2,d=it(-.2,1),f=it(8,20)*Math.sqrt(r),p=Math.sqrt(1-d*d);this.add.spawn(t.x,t.y+.5,t.z,Math.cos(u)*p*f,d*f+3,Math.sin(u)*p*f,it(.4,.9),it(.3,.55),.05,n.spark,n.sparkEnd,1,22,1.2,0)}let l=Math.round(o?7:16*Math.min(2,r));for(let h=0;h<l;h++){let u=Math.random()*Math.PI*2,d=it(1,4)*r;this.smoke.spawn(t.x+Math.cos(u)*r*.8,t.y+it(.5,2)*r,t.z+Math.sin(u)*r*.8,Math.cos(u)*d,it(2,5)*Math.sqrt(r),Math.sin(u)*d,it(1,1.8),it(1.5,2.5)*r,it(4,6)*r,n.smokeDark,n.smokeDarker,.7,-1.5,1.2,0,it(-1,1))}let c=o?6:Math.round(14*Math.min(2,r));for(let h=0;h<c;h++){let u=Math.random()*Math.PI*2,d=it(5,12)*Math.sqrt(r),f=it(.15,.35)*Math.sqrt(r);this.chunks.spawn(t.x,t.y+.6,t.z,Math.cos(u)*d,it(6,13),Math.sin(u)*d,it(1,1.6),f,f,f,Math.random()<.4?n.orange:n.debris,30,.3,t.y)}this._ring(t,.15,null,.5*r,s*1.7,o?.35:.55,n.flameCore,1,"ground",.25),o||this._ring(t,.3,null,.5*r,s*1.2,.45,n.white,.7,"ground",.15)}_burstConfetti(t){for(let e=0;e<200;e++){let n=this.rainbow[e%this.rainbow.length],s=Math.random()*Math.PI*2,r=it(2,9);this.chunks.spawn(t.x+it(-2,2),t.y+it(1,3),t.z+it(-2,2),Math.cos(s)*r,it(9,20),Math.sin(s)*r,it(3,5),it(.18,.28),.02,it(.1,.16),n,9,2.4,t.y-.5,it(1,3))}for(let e=0;e<60;e++){let n=this.rainbow[Math.random()*this.rainbow.length|0];this.add.spawn(t.x+it(-3,3),t.y+it(1,5),t.z+it(-3,3),it(-2,2),it(1,5),it(-2,2),it(.6,1.4),it(.5,.9),.05,this.C.white,n,1,1,1,1,it(-3,3))}}_burstHitStars(t,e){let n=e.kart,s=this.C;if(n){let r=this.starSlots.find(o=>o.active&&o.kart===n)||this.starSlots.find(o=>!o.active);r||(r=this.starSlots.reduce((o,a)=>o.t/o.dur>a.t/a.dur?o:a)),r.kart=n,r.t=0,r.dur=e.kind==="spin"?1.4:1.8,r.active=!0}for(let r=0;r<18;r++){let o=Math.random()*Math.PI*2,a=it(4,9);this.add.spawn(t.x,t.y+1,t.z,Math.cos(o)*a,it(2,7),Math.sin(o)*a,it(.3,.55),it(.35,.6),.05,s.white,s.yellow,1,14,1.5,1,it(-4,4))}for(let r=0;r<5;r++)this.smoke.spawn(t.x+it(-.8,.8),t.y+.5,t.z+it(-.8,.8),it(-1.5,1.5),it(1,2.5),it(-1.5,1.5),.7,1,2.4,s.smokeLight,s.smokeGrey,.5,-.5,2,0,it(-1,1))}_burstShrink(t,e){let n=this.C;this.add.spawn(t.x,t.y+1,t.z,0,0,0,.25,5,1,n.white,n.yellow,1,0,0,0);for(let s=0;s<16;s++){let r=Math.random()*Math.PI*2;this.add.spawn(t.x+Math.cos(r)*1.5,t.y+it(.2,2),t.z+Math.sin(r)*1.5,-Math.cos(r)*3,it(0,2),-Math.sin(r)*3,it(.3,.5),.5,.05,n.white,n.yellow,1,0,1,1,it(-4,4))}this._burstSmoke(t,{count:6}),e.kart&&this._burstHitStars(t,{kart:e.kart,kind:"spin"})}_burstSmoke(t,e){let n=this.C,s=Xe(e.count,8);for(let r=0;r<s;r++)this.smoke.spawn(t.x+it(-1,1),t.y+it(.3,1.2),t.z+it(-1,1),it(-2,2),it(1,3),it(-2,2),it(.6,1),1.2,3,n.smokeLight,n.smokeGrey,.6,-.5,2,0,it(-1,1))}_burstSplash(t,e){let n=this.C,s=Xe(e.scale,1);for(let r=0;r<40;r++){let o=Math.random()*Math.PI*2,a=it(2,6)*s;this.add.spawn(t.x,t.y+.2,t.z,Math.cos(o)*a,it(5,11)*s,Math.sin(o)*a,it(.5,.9),it(.25,.45)*s,.1,n.water,n.waterEnd,.8,24,.5,0)}for(let r=0;r<10;r++){let o=Math.random()*Math.PI*2;this.smoke.spawn(t.x+Math.cos(o),t.y+.3,t.z+Math.sin(o),Math.cos(o)*3,it(1,3),Math.sin(o)*3,.8,1.2*s,3*s,n.water,n.waterEnd,.5,0,2,0,it(-1,1))}this._ring(t,.05,null,.4,3.2*s,.7,n.water,.8,"ground",.2)}_burstLanding(t,e){let n=this.C,s=e.kart,r=s?.surface==="offroad",o=r?n.dust:n.smokeLight,a=r?n.dustEnd:n.smokeGrey,l=Xe(s?.object3D?.scale?.x,1);for(let c=0;c<16;c++){let h=c/16*Math.PI*2+it(-.2,.2),u=it(4,7);this.smoke.spawn(t.x+Math.cos(h)*.8,t.y+.15,t.z+Math.sin(h)*.8,Math.cos(h)*u,it(.3,1.2),Math.sin(h)*u,it(.45,.75),.6*l,2.2*l,o,a,.55,0,3.5,0,it(-1,1))}}_burstSparks(t,e){let n=this.C,s=Xe(e.intensity,.5);s>2&&(s/=20),s=Math.max(.15,Math.min(1,s));let r=Math.round((e.small?6:10)+s*(e.small?14:28));for(let o=0;o<r;o++){let a=Math.random()*Math.PI*2,l=it(0,1),c=it(5,13),h=Math.sqrt(1-l*l);this.add.spawn(t.x,t.y,t.z,Math.cos(a)*h*c,l*c+2,Math.sin(a)*h*c,it(.2,.45),it(.2,.35),.03,n.spark,n.sparkEnd,1,26,1,0)}this.add.spawn(t.x,t.y,t.z,0,0,0,.1,1.5+s*2,.5,n.white,n.spark,.9,0,0,0)}_burstMiniTurbo(t,e){let n=e.kart,s=Math.max(1,Math.min(3,Xe(e.level,1)|0)),r=this.driftCols[s],o=this.driftHot[s];n?(this._kartForward(n,di),re.copy(n.position).addScaledVector(di,-1.3),re.y+=.6,this._ring(re,0,n,.3,1.5+s*.3,.28,r,.9,"kart",.3)):(re.copy(t),re.y+=.6),this.add.spawn(re.x,re.y,re.z,0,0,0,.15,4+s,2,o,r,1,0,0,0);let a=Xe(n?.velocity?.x),l=Xe(n?.velocity?.z);for(let c=0;c<16+s*8;c++){let h=Math.random()*Math.PI*2,u=it(3,8);this.add.spawn(re.x,re.y,re.z,a*.7+Math.cos(h)*u,it(1,6),l*.7+Math.sin(h)*u,it(.25,.45),it(.3,.5),.05,o,r,1,12,2,Math.random()<.5?1:0)}}_fireball(t,e,n,s,r){let o=this.fireballs[this.fireCursor];this.fireCursor=(this.fireCursor+1)%this.fireballs.length,o.active=!0,o.t=0,o.dur=r,o.size=s,o.mesh.position.set(t,e,n),o.mesh.visible=!0,o.mesh.scale.setScalar(.01),o.mesh.rotation.set(Math.random()*6,Math.random()*6,0)}_updateFireballs(t){for(let e of this.fireballs){if(!e.active)continue;e.t+=t;let n=e.t/e.dur;if(n>=1){e.active=!1,e.mesh.visible=!1;continue}let s=1-Math.pow(1-Math.min(1,n*2.5),3);e.mesh.scale.setScalar(e.size*(.25+.85*s)),e.mesh.position.y+=t*e.size*.6,e.mat.uniforms.uLife.value=n,e.mat.uniforms.uTime.value=this.time+e.seed}}_ring(t,e,n,s,r,o,a,l,c,h=.3){let u=this.rings[this.ringCursor];this.ringCursor=(this.ringCursor+1)%this.rings.length,u.active=!0,u.t=-e,u.dur=o,u.r0=s,u.r1=r,u.kart=n,u.mode=c,u.opacity=l,u.mat.uniforms.uColor.value.copy(a),u.mat.uniforms.uThick.value=h,u.mat.uniforms.uOpacity.value=0,u.mesh.position.copy(t),c==="ground"&&(u.mesh.position.y+=.25,u.mesh.quaternion.setFromAxisAngle(Vp.set(1,0,0),-Math.PI/2)),u.mesh.scale.setScalar(Math.max(.001,s)),u.mesh.visible=!1}_updateRings(t){for(let e of this.rings){if(!e.active||(e.t+=t,e.t<0))continue;let n=e.t/e.dur;if(n>=1){e.active=!1,e.mesh.visible=!1;continue}e.mesh.visible=!0;let s=1-Math.pow(1-n,3);e.mesh.scale.setScalar(Math.max(.001,e.r0+(e.r1-e.r0)*s)),e.mat.uniforms.uOpacity.value=e.opacity*(1-n),e.mode==="kart"&&e.kart?.position&&(this._kartForward(e.kart,di),e.mesh.position.copy(e.kart.position).addScaledVector(di,-1.4-n*1.5),e.mesh.position.y+=.8,e.mesh.quaternion.setFromUnitVectors(zM,di))}}_updateStars(t){let e=this.starMesh,n=!1;for(let s=0;s<this.starSlots.length;s++){let r=this.starSlots[s],o=s*cr;if(!r.active)continue;r.t+=t;let a=r.kart;if(r.t>=r.dur||!a?.position){r.active=!1,ii.makeScale(0,0,0);for(let u=0;u<cr;u++)e.setMatrixAt(o+u,ii);n=!0;continue}n=!0;let l=r.t/r.dur,c=Math.min(1,r.t*6)*(l>.8?(1-l)/.2:1),h=Xe(a.object3D?.scale?.x,1);for(let u=0;u<cr;u++){let d=r.t*5+u/cr*Math.PI*2,f=1.05*h;re.set(a.position.x+Math.cos(d)*f,a.position.y+2.1*h+Math.sin(d*2+u)*.12,a.position.z+Math.sin(d)*f),Bl.set(.25,-d+r.t*3,Math.sin(r.t*4+u)*.3),zl.setFromEuler(Bl),Hl.setScalar(Math.max(.001,c*1.1*h)),ii.compose(re,zl,Hl),e.setMatrixAt(o+u,ii)}}n&&(e.instanceMatrix.needsUpdate=!0)}_resetStreak(t,e){t.ang=Math.random()*Math.PI*2,t.k=it(.55,1.05),t.d=e?it(3,40):it(30,45),t.len=it(3,8),t.w=it(.07,.16),t.spd=it(40,70),t.bright=it(.4,1),t.r=0}_updateStreaks(t,e){let n=null;if(e){for(let d of e)if(d?.isPlayer){n=d;break}}let s=0;n&&(Xe(n.boostTimer)>0&&(s=this._state(n).bigBoost?1:.7),Xe(n.starTimer)>0&&(s=Math.max(s,.8)),Math.abs(Xe(n.speed))<8&&(s*=.3));let r=s>this.streakIntensity?6:2.5;this.streakIntensity+=(s-this.streakIntensity)*Math.min(1,t*r);let o=this.camera;if(this.streakIntensity<.01||!o?.isPerspectiveCamera){this.streakMesh.visible=!1;return}this.streakMesh.visible=!0;let a=Math.tan(Uo.degToRad(o.fov*.5)),l=Xe(o.aspect,1.6),c=this.streakPos,h=this.streakAlpha,u=this.streakIntensity;for(let d=0;d<this.streaks.length;d++){let f=this.streaks[d];f.d-=f.spd*t*(.6+u*.6),f.d<1&&this._resetStreak(f,!1),f.r||(f.r=f.k*34*a);let p=Math.cos(f.ang)*f.r*l*.75,x=Math.sin(f.ang)*f.r,g=-Math.sin(f.ang)*f.w,m=Math.cos(f.ang)*f.w,M=-f.d,_=-(f.d+f.len),v=d*12;c[v]=p+g,c[v+1]=x+m,c[v+2]=M,c[v+3]=p-g,c[v+4]=x-m,c[v+5]=M,c[v+6]=p+g,c[v+7]=x+m,c[v+8]=_,c[v+9]=p-g,c[v+10]=x-m,c[v+11]=_;let w=Math.min(1,(45-f.d)/12),R=Math.min(1,(f.d-1)/4),T=u*f.bright*.4*Math.max(0,w)*Math.max(0,R),C=d*4;h[C]=T,h[C+1]=T,h[C+2]=0,h[C+3]=0}this.aStreakPos.needsUpdate=!0,this.aStreakAlpha.needsUpdate=!0}clear(){this.add.clear(),this.smoke.clear(),this.chunks.clear();for(let t of this.fireballs)t.active=!1,t.mesh.visible=!1;for(let t of this.rings)t.active=!1,t.mesh.visible=!1;for(let t of this.starSlots)t.active=!1}dispose(){for(let t of this.unsubs)try{t()}catch{}this.unsubs.length=0,this.scene?.remove(this.group),this.add.dispose(),this.smoke.dispose(),this.chunks.dispose(),this.fireGeo.dispose();for(let t of this.fireballs)t.mat.dispose();this.ringGeo.dispose();for(let t of this.rings)t.mat.dispose();this.starGeo.dispose(),this.starMat.dispose(),this.starMesh.dispose?.(),this.streakGeo.dispose(),this.streakMat.dispose(),this.glowTex.dispose(),this.smokeTex.dispose(),this.kartState.clear()}};var tf={};ys(tf,{ChaseCamera:()=>Qu});var ur=Math.PI,ji=(i,t,e)=>i<t?t:i>e?e:i,Ze=(i,t=0)=>Number.isFinite(i)?i:t,zs=(i,t)=>1-Math.exp(-i*t),Xp=i=>(i=(i+ur)%(2*ur),i<0&&(i+=2*ur),i-ur),$M=i=>i*i*(3-2*i),Tn=(i,t,e)=>i+(t-i)*e,JM=4,Qu=class{constructor(t){this.camera=t,this.target=null,this.baseFov=70,this.maxFov=84,this.distance=6.5,this.height=2.6,this.lookAhead=3,this.lookHeight=.55,this.yaw=0,this.slope=0,this.offset=new P(0,this.height,-this.distance),this.lookOffset=new P(0,this.lookHeight,this.lookAhead),this.camY=0,this.fov=this.baseFov,this.roll=0,this.shake=0,this.shakeTime=0,this.mode=null,this.modeTime=0,this.modeYaw=0,this.lookBack=!1,this.initialized=!1,this._pos=new P,this._look=new P,this._desired=new P,this._desiredLook=new P,this._tmp=new P;let e=n=>n&&this.target&&n.kart===this.target;this._unsubs=[Bt.on("kart:hit",n=>{e(n)&&this.addShake(n.kind==="tumble"?.75:.5)}),Bt.on("kart:wallBump",n=>{e(n)&&this.addShake(.12+.45*ji(Ze(n.intensity,.3),0,1))}),Bt.on("kart:land",n=>{e(n)&&this.addShake(ji(.05+Ze(n.airTime,0)*.15,0,.25))}),Bt.on("kart:boost",n=>{e(n)&&n.source!=="star"&&this.addShake(.08)}),Bt.on("kart:bump",n=>{n&&this.target&&(n.a===this.target||n.b===this.target)&&this.addShake(.1+.25*ji(Ze(n.intensity,.3),0,1))}),Bt.on("item:explode",n=>{let s=n?.position,r=this.target?.position;if(!s||!r)return;let o=s.distanceTo(r),a=n.kind==="blue_shell"||Ze(n.radius,0)>3,l=a?40:18;o<l&&this.addShake((a?1:.45)*(1-o/l)**1.5)})]}addShake(t){this.shake=ji(Math.max(this.shake,Ze(t,0))+Ze(t,0)*.25,0,1.2)}_kartInfo(t){let e=t.position||t.object3D?.position||this._tmp.set(0,0,0),n=Ze(t.heading,Ze(t.object3D?.rotation?.y,0)),s=t.velocity,r=Ze(t.speed,s?Math.hypot(Ze(s.x),Ze(s.z)):0),o=0,a=t.groundNormal;return a&&Ze(a.y,0)>.3&&(o=ji(-(Ze(a.x)*Math.sin(n)+Ze(a.z)*Math.cos(n))/a.y,-.6,.6)),{pos:e,heading:n,vel:s,speed:r,slope:o}}_raceDesired(t,e,n,s,r){let o=Math.sin(this.yaw),a=Math.cos(this.yaw);if(n){this._desired.set(o*6,2.1,a*6),this._desiredLook.set(-o*4,.9,-a*4);return}let l=this.distance+s*.7+r*.8,c=ji(-this.slope*l*.85,-1.6,2.4);this._desired.set(-o*l,this.height+c-r*.15,-a*l);let h=this.lookAhead+s*.8;this._desiredLook.set(o*h,this.lookHeight+this.slope*h*.6,a*h)}update(t,e,n={}){try{if(!e||!this.camera)return;t=ji(Ze(t,1/60),0,.1);let s=n.mode||"race",r=!!n.lookBack&&(s==="race"||s==="countdown"),o=this._kartInfo(e),a=this.target!==e;this.target=e,(!this.initialized||a)&&this.snap(e),s!==this.mode&&(this.mode=s,this.modeTime=0,this.modeYaw=o.heading),this.modeTime+=t;let l=ji(Math.abs(o.speed)/Ze(Ve.maxSpeed,38),0,1.4),c=Ze(e.boostTimer,0)>0||Ze(e.starTimer,0)>0;this._boost=Tn(this._boost||0,c?1:0,zs(c?6:2.5,t));let h=this._boost,u=o.heading;if((o.vel?Math.hypot(Ze(o.vel.x),Ze(o.vel.z)):0)>4&&o.vel){let Z=Math.atan2(o.vel.x,o.vel.z),O=Xp(Z-o.heading);Math.abs(O)<1.2&&o.speed>0&&(u=o.heading+O*(e.drifting?.55:.3))}let p=Ze(e.spinTimer,0)>0?1.5:e.drifting?3.2:5.5;this.yaw+=Xp(u-this.yaw)*zs(p,t),e.airborne||(this.slope=Tn(this.slope,o.slope,zs(3,t)));let x=o.pos,g=this.baseFov,m=10,M=e.airborne?3.5:9,_=12;if(s==="intro"){let Z=$M(ji(this.modeTime/JM,0,1)),O=this.modeYaw,ct=O+Tn(.7,ur,Z)+Math.sin(Z*ur)*.6,K=Tn(28,this.distance,Z),W=Tn(13,this.height,Z),j=Math.sin(O)*Tn(10,0,Z),wt=Math.cos(O)*Tn(10,0,Z);this._desired.set(j+Math.sin(ct)*K,W,wt+Math.cos(ct)*K);let Yt=Math.sin(O),te=Math.cos(O);this._desiredLook.set(Yt*Tn(8,this.lookAhead,Z),Tn(.5,this.lookHeight,Z),te*Tn(8,this.lookAhead,Z)),this.yaw=O,m=1e3,M=1e3,_=1e3,g=Tn(58,this.baseFov,Z)}else if(s==="finish"){let Z=this.modeYaw+ur+this.modeTime*.32,O=7.5+Math.min(this.modeTime,4)*.4;this._desired.set(Math.sin(Z)*O,2.3+Math.sin(this.modeTime*.4)*.4,Math.cos(Z)*O),this._desiredLook.set(0,.9,0),m=2.2,M=2.2,_=3,g=62}else this._raceDesired(e,o,r,l,h),s==="countdown"?(m=3,M=3,_=4):g=this.baseFov+l*9+h*6,r!==this.lookBack&&(this.lookBack=r,this.offset.copy(this._desired),this.lookOffset.copy(this._desiredLook),this.camY=x.y+this._desired.y);let v=zs(m,t);if(this.offset.x=Tn(this.offset.x,this._desired.x,v),this.offset.z=Tn(this.offset.z,this._desired.z,v),s==="race"&&!r){let Z=Math.hypot(this.offset.x,this.offset.z),O=Math.hypot(this._desired.x,this._desired.z);if(Z>.001){let ct=Tn(1,O/Z,.5);this.offset.x*=ct,this.offset.z*=ct}}let w=x.y+this._desired.y;this.camY=Tn(this.camY,w,zs(M,t));let R=x.y+(s==="intro"?1.2:.8);this.camY<R&&(this.camY=R),this.camY>x.y+18&&(this.camY=x.y+18),this.lookOffset.lerp(this._desiredLook,zs(_,t)),this.fov=Tn(this.fov,ji(g,40,this.maxFov),zs(3.5,t));let T=s==="race"&&!r?e.drifting?-Ze(e.driftDir,0)*.035:-Ze(e.steerSmoothed,Ze(e.input?.steer,0))*.012*l:0;this.roll=Tn(this.roll,T,zs(4,t)),this.shake=Math.max(0,this.shake*Math.exp(-4.5*t)-.02*t),this.shakeTime+=t;let C=this.shake*this.shake*.45,b=this.shakeTime,E=(Math.sin(b*41.3)+Math.sin(b*27.1+1.3)*.6)*C,D=(Math.sin(b*37.7+2.1)+Math.sin(b*19.4)*.6)*C,Y=Math.sin(b*33.9+.7)*C*.5,H=this.camera;this._pos.set(x.x+this.offset.x+E,this.camY+D,x.z+this.offset.z+Y),this._look.set(x.x+this.lookOffset.x,x.y+this.lookOffset.y,x.z+this.lookOffset.z),H.position.copy(this._pos),H.up.set(0,1,0),H.lookAt(this._look);let X=this.roll+Math.sin(b*29.3)*C*.08;X&&H.rotateZ(X),Math.abs(H.fov-this.fov)>.01&&(H.fov=this.fov,H.updateProjectionMatrix())}catch(s){this._warned||(console.warn("[camera] update failed",s),this._warned=!0)}}snap(t){if(!t||!this.camera)return;this.target=t;let e=this._kartInfo(t);this.yaw=e.heading,this.slope=e.slope,this._boost=0,this.lookBack=!1,this._raceDesired(t,e,!1,0,0),this.offset.copy(this._desired),this.lookOffset.copy(this._desiredLook),this.camY=e.pos.y+this._desired.y,this.roll=0,this.shake=0,this.initialized=!0,this.fov=this.baseFov;let n=this.camera;n.position.set(e.pos.x+this.offset.x,this.camY,e.pos.z+this.offset.z),n.up.set(0,1,0),n.lookAt(e.pos.x+this.lookOffset.x,e.pos.y+this.lookOffset.y,e.pos.z+this.lookOffset.z),n.fov=this.fov,n.updateProjectionMatrix()}dispose(){for(let t of this._unsubs)try{t()}catch{}this._unsubs=[],this.target=null}};var Pe={track:Cu,kart:Uu,ai:zu,input:Lu,items:Ku,effects:ju,models:Vu,camera:tf},Wl=new Set;function fr(i,t){let e=i+"|"+(t&&t.message);Wl.has(e)||(Wl.add(e),console.error(`[${i}]`,t))}function ke(i,t){try{return t()}catch(e){fr(i,e);return}}var Kp=document.getElementById("game-canvas"),ro=document.getElementById("ui-root"),Zn;try{Zn=new Xa({canvas:Kp,antialias:!0,powerPreference:"high-performance"})}catch(i){throw document.getElementById("boot-message").textContent="Turbo Kart Rally \u9700\u8981\u652F\u6301 WebGL 2 \u7684\u6D4F\u89C8\u5668\u6216 Android TV WebView\u3002",i}document.getElementById("boot-message").remove();var jo=Zn.getContext(),qp=jo.getExtension("WEBGL_debug_renderer_info"),jM=qp?jo.getParameter(qp.UNMASKED_RENDERER_WEBGL):"",oo=/swiftshader|llvmpipe|lavapipe|software rasterizer/i.test(jM)||!jo.getExtension("EXT_color_buffer_float");Pe.models.configureReflections(!oo);function Xl(){return oo?Math.min(1,640/innerWidth,360/innerHeight):Math.min(devicePixelRatio||1,2)}Zn.setPixelRatio(Xl());Zn.setSize(window.innerWidth,window.innerHeight,!1);Zn.toneMapping=ko;Zn.toneMappingExposure=1;Zn.outputColorSpace=Ke;Zn.shadowMap.enabled=!oo;Zn.shadowMap.type=Jh;var Yn=new Nn(62,window.innerWidth/window.innerHeight,.1,3e3);Yn.position.set(0,30,60);var hf=new js;hf.background=new ft(2781147);var _s=oo?null:new pl(Zn);_s?.setPixelRatio(Xl());_s?.setSize(window.innerWidth,window.innerHeight);var $l=new ml(hf,Yn);_s?.addPass($l);var QM=new Yr(new pt(window.innerWidth,window.innerHeight),.32,.45,.88);_s?.addPass(QM);_s?.addPass(new gl);function tb(){let i=window.innerWidth,t=window.innerHeight;Yn.aspect=i/t,Yn.updateProjectionMatrix(),Zn.setPixelRatio(Xl()),Zn.setSize(i,t,!1),_s?.setSize(i,t),_s?.setPixelRatio(Xl())}window.addEventListener("resize",tb);function eb(i){let t=new pe,e=new ye({color:i?i.color:16711680}),n=new $t(new Oe(1.6,.6,2.4),e);n.position.y=.5,n.castShadow=!0,t.add(n);let s={};for(let[r,o,a,l]of[["exhaustL",.4,.5,-1.3],["exhaustR",-.4,.5,-1.3],["wheelRL",.8,.3,-.8],["wheelRR",-.8,.3,-.8],["wheelFL",.8,.3,.8],["wheelFR",-.8,.3,.8],["itemHold",0,.6,-1.8]]){let c=new rn;c.position.set(o,a,l),t.add(c),s[r]=c}return{root:t,anchors:s,animate(){},setShrunk(r){t.scale.setScalar(r)},dispose(){n.geometry.dispose(),e.dispose()}}}function nb(i){if(Pe.models&&Pe.models.createKartModel)try{return Pe.models.createKartModel(i)}catch(t){fr("models.createKartModel",t)}return eb(i)}var ql=class{constructor(t,e){this.kart=t,this.track=e}update(){let t=this.kart,e=this.track,n=e.getPointAt(((t.trackT||0)+25/(e.length||2e3))%1),s=n.x-t.position.x,r=n.z-t.position.z,a=Math.atan2(s,r)-t.heading;a=Math.atan2(Math.sin(a),Math.cos(a)),t.input={throttle:1,brake:0,steer:Uo.clamp(-a*2,-1,1),drift:!1,item:!!t.item&&Math.random()<.01,lookBack:!1}}},nf=class{constructor(t){this.cam=t,this.pos=new P,this.look=new P}snap(t){this._target(t,this.pos,this.look),this.cam.position.copy(this.pos),this.cam.lookAt(this.look)}_target(t,e,n){let s=t.heading||0;e.set(t.position.x-Math.sin(s)*9,t.position.y+4,t.position.z-Math.cos(s)*9),n.set(t.position.x+Math.sin(s)*4,t.position.y+1.2,t.position.z+Math.cos(s)*4)}update(t,e){let n=new P,s=new P;this._target(e,n,s);let r=1-Math.exp(-t*6);this.pos.lerp(n,r),this.look.lerp(s,r),this.cam.position.copy(this.pos),this.cam.lookAt(this.look)}},In=new El,zi=new Ml(ro),hn=new bl(ro,{onStart:i=>cf(i),onResume:()=>df(),onRestart:()=>{hn.hideAll(),cf(xs)},onQuit:()=>ff(),onScreen:i=>{Qi(i==="select"?"select":"title")}}),gs=null,be="boot",Yl=null,Le=null,xs={characterIndex:0,difficulty:"normal",laps:ir.laps},sf=0,Bs=!1,Jo=0,$p=new Wr,ef=Object.freeze({throttle:0,brake:0,steer:0,drift:!1,item:!1,lookBack:!1});function Qi(i){be!==i&&(be=i,document.body.dataset.state=i,Bt.emit("game:state",{state:i}))}var Jp=0,rf=!1;function jp(){gs?.reset();let i=Le?.player;i&&i.cancelDrivingInput(),Kl=null}function of(){jp(),be==="loading"?rf=!0:Qo()}var af=Qd({width:174,onCancel:of,onSuspend:of});window.addEventListener("gamepaddisconnected",of);var uf=document.createElement("p");uf.className="tv-mapping";uf.textContent="\u65B9\u5411\u952E\u9A7E\u9A76 \xB7 A \u6F02\u79FB \xB7 B \u9053\u5177 \xB7 X \u56DE\u770B \xB7 Y \u9759\u97F3 / \u83DC\u5355\u8FD4\u56DE \xB7 START \u6682\u505C\u6216\u786E\u8BA4";document.getElementById("puretv-controller-panel").append(uf);function Vl(i){window.dispatchEvent(new KeyboardEvent("keydown",{code:i,bubbles:!0})),window.dispatchEvent(new KeyboardEvent("keyup",{code:i,bubbles:!0}))}function ib(){af.setPlaying(Jl.has(be)&&!Bs);let i=af.poll();if(!gs||i.cancelled)return;gs.tvFrame=i;let t=i.pressed;if(Object.values(t).some(Boolean)&&In.unlock(),hn.screen==="title"||hn.screen==="select"||hn.screen==="pause"||zi.resultsVisible){for(let[e,n]of Object.entries({UP:"ArrowUp",DOWN:"ArrowDown",LEFT:"ArrowLeft",RIGHT:"ArrowRight"}))t[e]&&Vl(n);t.START||t.A?Vl("Enter"):t.Y&&Vl(hn.screen==="pause"?"Escape":"Backspace");return}t.START?Qo():be==="intro"&&t.A?jl():t.Y&&Vl("KeyM")}var Jl=new Set(["intro","countdown","racing","finished"]);function Yp(i){for(let t=i.length-1;t>0;t--){let e=Math.random()*(t+1)|0;[i[t],i[e]]=[i[e],i[t]]}return i}function Qp({mode:i,characterIndex:t=0,difficulty:e="normal",laps:n=ir.laps}){if(!Pe.track||!Pe.track.createTrack)throw new Error("track.js unavailable");if(!Pe.kart||!Pe.kart.Kart)throw new Error("kart.js unavailable");let s={mode:i,difficulty:e,laps:n,karts:[],ais:[],playerAI:null,player:null,scene:new js};s.track=Pe.track.createTrack(s.scene,oo?null:Zn);let r;if(i==="race"){let h=Yp(Vn.filter((u,d)=>d!==t));r=[Vn[t],...h]}else r=Vn.slice();let{Kart:o}=Pe.kart;for(let h=0;h<ir.racers;h++){let u=r[h%r.length],d=i==="race"&&h===0,f=nb(u),p=new o({scene:s.scene,track:s.track,character:u,isPlayer:d,index:h,model:f});s.karts.push(p),d&&(s.player=p)}let a=new Array(ir.racers),l=Yp(s.karts.filter(h=>h!==s.player));if(s.player){let h=4+(Math.random()*2|0);a[h]=s.player}for(let h=0;h<a.length;h++)a[h]||(a[h]=l.shift());s.race=new _l({track:s.track,karts:s.karts,player:s.player,laps:n,silent:i!=="race"}),s.race.placeOnGrid(a);let c=Pe.ai&&Pe.ai.AIDriver||null;for(let h of s.karts){if(h===s.player)continue;let u=null;c&&(u=ke("ai.ctor",()=>new c(h,s.track,{difficulty:i==="race"?e:"hard"}))),s.ais.push(u||new ql(h,s.track))}return Pe.items&&Pe.items.ItemSystem&&(s.items=ke("items.ctor",()=>new Pe.items.ItemSystem({scene:s.scene,track:s.track,karts:s.karts}))),Pe.effects&&Pe.effects.Effects&&(s.effects=ke("effects.ctor",()=>new Pe.effects.Effects(s.scene,Yn))),s.chase=Pe.camera&&Pe.camera.ChaseCamera&&ke("camera.ctor",()=>new Pe.camera.ChaseCamera(Yn))||new nf(Yn),s.ctx={karts:s.karts,player:s.player||s.karts[0],itemSystem:s.items||null,time:0},s.player&&ke("camera.snap",()=>s.chase.snap(s.player)),$l.scene=s.scene,s}function lf(){let i=Le;if(Le=null,$l.scene=hf,!!i){ke("dispose.items",()=>i.items&&i.items.dispose&&i.items.dispose()),ke("dispose.effects",()=>i.effects&&i.effects.dispose&&i.effects.dispose());for(let t of i.karts)ke("dispose.kart",()=>t.dispose&&t.dispose());ke("dispose.track",()=>i.track&&i.track.dispose&&i.track.dispose()),ke("dispose.race",()=>i.race&&i.race.dispose()),ke("dispose.ai",()=>{for(let t of[...i.ais,i.playerAI])t&&t.dispose&&t.dispose()}),ke("dispose.chase",()=>i.chase&&i.chase.dispose&&i.chase.dispose()),ke("dispose.scene",()=>{let t=new Set,e=n=>{for(let s in n){let r=n[s];r&&r.isTexture&&!t.has(r)&&(t.add(r),r.dispose())}};i.scene.traverse(n=>{n.geometry&&!t.has(n.geometry)&&(t.add(n.geometry),n.geometry.dispose());let s=Array.isArray(n.material)?n.material:n.material?[n.material]:[];for(let r of s)t.has(r)||(t.add(r),e(r),r.dispose());n.isLight&&n.shadow&&n.shadow.map&&n.shadow.map.dispose()}),i.scene.background&&i.scene.background.isTexture&&i.scene.background.dispose(),i.scene.environment&&i.scene.environment.isTexture&&i.scene.environment.dispose(),i.scene.clear()}),Zn.renderLists.dispose()}}function tm(){lf();try{Le=Qp({mode:"attract"}),Le.race.startImmediately(),Zl.targetIndex=0,Zl.switchT=0,ro.classList.remove("no-world")}catch(i){fr("attract",i),lf(),ro.classList.add("no-world")}}function ff(){zi.hide(),zi.hideResults(),In.setPaused(!1),In.setGameplayActive(!1),Bs=!1,hn.showLoading("LOADING"),setTimeout(()=>{tm(),hn.showTitle(),Qi("title"),In.playMusic("menu")},30)}function cf(i){rf=!1,xs={...xs,...i},zi.hide(),zi.hideResults(),hn.showLoading("GET READY!"),In.setPaused(!1),In.stopMusic(),Qi("loading"),setTimeout(()=>{lf();try{Le=Qp({mode:"race",...xs})}catch(t){fr("buildWorld",t),hn.showLoading("RACE FAILED TO LOAD \u2014 SEE CONSOLE"),setTimeout(ff,2500);return}Bs=!1,sf=0,Wl.clear(),zi.reset({player:Le.player,track:Le.track,laps:xs.laps}),zi.show(),hn.hideAll(),In.setGameplayActive(!0),ro.classList.remove("no-world"),Qi("intro"),sb(),(rf||document.hidden)&&Qo()},40)}var ms=null;function sb(){ms||(ms=Object.assign(document.createElement("div"),{className:"intro-card"})),ro.appendChild(ms);let i=Le&&Le.track&&Le.track.name||"Grand Circuit",t={easy:"50cc",normal:"100cc",hard:"150cc"}[xs.difficulty]||"";ms.innerHTML=`<div class="ic-sub">${t} \xB7 ${xs.laps} LAP${xs.laps>1?"S":""}</div><div class="ic-name">${i}</div><div class="ic-skip">ENTER \xB7 SKIP</div>`,ms.classList.remove("show"),ms.offsetWidth,ms.classList.add("show")}function rb(){ms&&ms.classList.remove("show")}function jl(){be!=="intro"||!Le||(rb(),Le.race.startCountdown(),Qi("countdown"),ke("camera.snap",()=>Le.chase.snap(Le.player)))}function Qo(){!Jl.has(be)||Bs||(jp(),Yl=be,Qi("paused"),hn.showPause(),In.setPaused(!0))}function df(){be==="paused"&&(hn.hideAll(),Qi(Yl||"racing"),In.setPaused(!1),$p.getDelta())}Bt.on("race:go",()=>{(be==="countdown"||be==="paused"&&Yl==="countdown")&&(be==="paused"?Yl="racing":Qi("racing"),In.playMusic("race"))});Bt.on("race:finish",i=>{if(!Le||!i||!i.kart||!i.kart.isPlayer)return;Qi("finished");let t=Pe.ai&&Pe.ai.AIDriver;Le.playerAI=t&&ke("ai.player",()=>new t(Le.player,Le.track,{difficulty:"easy"}))||new ql(Le.player,Le.track)});Bt.on("race:end",i=>{if(!Le||Le.mode!=="race")return;Bs=!0;let t=i&&i.results||Le.race.computeResults();be==="paused"&&df(),setTimeout(()=>{!Le||!Bs||(In.playMusic("menu"),zi.showResults(t,{laps:Le.race.laps,onRestart:()=>cf(xs),onMenu:()=>ff()}))},200)});window.addEventListener("keydown",i=>{if(i.code==="KeyM"&&!i.repeat){let t=In.toggleMute();zi.toast(t?"SOUND OFF":"SOUND ON");return}if((i.code==="Escape"||i.code==="KeyP")&&!i.repeat){be==="paused"?(i.code==="Escape"||i.code==="KeyP")&&(Bt.emit("ui:back"),df()):Jl.has(be)&&Qo();return}be==="intro"&&(i.code==="Enter"||i.code==="Space"||i.code==="NumpadEnter")&&!i.repeat&&jl(),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(i.code)&&be!=="boot"&&i.preventDefault()});Kp.addEventListener("click",()=>{be==="intro"&&jl()});document.addEventListener("visibilitychange",()=>{document.hidden&&(be==="racing"||be==="countdown")&&Qo()});var Zl={targetIndex:0,switchT:0,angle:0,pos:new P(0,40,80),look:new P,init:!1,_p:new P,_l:new P};function Zp(i){let t=Le,e=Zl;e.angle+=i*(be==="select"?.28:.16);let n=null;if(t&&t.karts.length)if(be==="select")n=t.karts[hn.charIndex]||t.karts[0];else{if(e.switchT-=i,e.switchT<=0){e.switchT=9;let r=t.race.standings,o=r[Math.random()*Math.min(4,r.length)|0];e.targetIndex=t.karts.indexOf(o)}n=t.karts[e.targetIndex]||t.karts[0]}if(n){let r=be==="select",o=r?7.5:14+Math.sin(e.angle*.7)*3,l=(n.heading||0)+(r?Math.PI*.75+Math.sin(e.angle)*.5:e.angle);e._p.set(n.position.x+Math.sin(l)*o,n.position.y+(r?2.6:5+Math.sin(e.angle*.5)*2),n.position.z+Math.cos(l)*o),e._l.set(n.position.x,n.position.y+(r?1.1:1.5),n.position.z);let c=n.velocity;c&&(e._p.addScaledVector(c,.4),e._l.addScaledVector(c,.4))}else{let r=0,o=0,a=200,l=t&&t.track&&t.track.minimap&&t.track.minimap.bounds;l&&(r=(l.minX+l.maxX)/2,o=(l.minZ+l.maxZ)/2,a=Math.max(l.maxX-l.minX,l.maxZ-l.minZ)),e._p.set(r+Math.cos(e.angle)*a*.6,a*.3,o+Math.sin(e.angle)*a*.6),e._l.set(r,0,o)}let s=e.init?1-Math.exp(-i*2.5):1;e.init=!0,e.pos.lerp(e._p,s),e.look.lerp(e._l,s),Yn.position.copy(e.pos),Yn.lookAt(e.look),Yn.fov!==55&&(Yn.fov=55,Yn.updateProjectionMatrix())}var Kl=null;function ob(i,t){Jo+=t,i.ctx.time=Jo;let e=i.mode==="race",n=i.player;if(e&&n){let r=null;gs&&(r=ke("input.getInput",()=>gs.getInput())),gs&&ke("input.pause",()=>gs.consumePressed&&gs.consumePressed("pause")),Kl=r||ef,n.finished&&i.playerAI?ke("ai.player",()=>i.playerAI.update(t,i.ctx)):n.controlsLocked?n.input={...ef}:n.input=r||{...ef}}for(let r=0;r<i.ais.length;r++){let o=i.ais[r];try{o.update(t,i.ctx)}catch(a){fr("ai.update",a)}}for(let r=0;r<i.karts.length;r++)try{i.karts[r].update(t)}catch(o){fr("kart.update",o)}Pe.kart&&Pe.kart.resolveKartCollisions&&ke("resolveKartCollisions",()=>Pe.kart.resolveKartCollisions(i.karts)),i.items&&ke("items.update",()=>i.items.update(t,Jo)),ke("race.update",()=>i.race.update(t)),i.effects&&ke("effects.update",()=>i.effects.update(t,i.karts)),ke("track.update",()=>i.track.update&&i.track.update(t,Jo));let s=e?n:i.karts[Zl.targetIndex]||i.karts[0];s&&i.track.setShadowFocus&&ke("track.setShadowFocus",()=>i.track.setShadowFocus(s.position)),e&&be==="intro"&&(sf+=t,sf>4&&jl())}function em(){requestAnimationFrame(em),Jp++,ib();let i=$p.getDelta(),t=Math.min(i,1/30);ke("menu.update",()=>hn.update(i,Bs?"results":be));let e=Le;if(e){if(be!=="paused"&&be!=="loading"&&be!=="boot"&&ob(e,t),e.mode==="race"&&e.player){if(be!=="paused"){let s=be==="intro"?"intro":be==="countdown"?"countdown":be==="finished"?"finish":"race",r=!!(be==="racing"&&Kl&&Kl.lookBack);ke("camera.update",()=>e.chase.update(t,e.player,{lookBack:r,mode:s}))}ke("hud.update",()=>zi.update(t,{player:e.player,karts:e.karts,race:e.race,itemSystem:e.items,track:e.track,time:Jo}))}else Zp(t);ke("audio.update",()=>In.update(t,{player:e.player,karts:e.karts,camera:Yn}))}else Zp(t),ke("audio.update",()=>In.update(t,{camera:Yn}));try{_s?_s.render(t):Zn.render($l.scene,Yn)}catch(n){fr("render",n)}}async function ab(){if(document.body.dataset.state="boot",hn.showLoading("LOADING"),requestAnimationFrame(em),await document.fonts.ready,Pe.input&&Pe.input.InputController&&(gs=ke("input.ctor",()=>new Pe.input.InputController)),Pe.models&&Pe.models.createCharacterPortrait){let i=t=>Pe.models.createCharacterPortrait(t);ke("portraits",()=>hn.setPortraitProvider(i)),zi.setPortraitProvider(i)}tm(),hn.showTitle(),Qi("title"),In.playMusic("menu")}ab();Object.defineProperty(window,"JoystickGameQA",{value:Object.freeze({snapshot(){let i=Le?.player,t=be==="paused"?"paused":Bs?"ended":["boot","loading"].includes(be)?"loading":Jl.has(be)?"playing":"menu";return{game:"turbo-kart-rally",frames:Jp,stage:t,paused:be==="paused",renderer:"webgl2",webglVersion:jo.getParameter(jo.VERSION),audioState:In.ctx?.state||"locked",controller:af.peek(),errors:[...Wl],gameplay:{mode:be,characterIndex:hn.charIndex,menuZone:hn.zone,option:hn.optIndex,playerX:i?.position.x||0,playerZ:i?.position.z||0,heading:i?.heading||0,speed:i?.speed||0,progress:i?.trackT||0,driftHeld:!!i?.input.drift,lookBack:!!i?.input.lookBack,driftLevel:i?.driftLevel||0,boost:i?.boostTimer||0,racers:Le?.karts.length||0,lap:i?.lap||0,time:Le?.race.raceTime||0,course:Le?.track.name||"",reducedEffects:oo}}}})});})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
