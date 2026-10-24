import type {UnifiedLayout,UnifiedComponent} from './types';
export const defaultSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h8v8H8z"/></svg>';
const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon']);
const attrs=new Set(['xmlns','viewBox','width','height','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','color']);
export function validSvg(value:unknown):value is string {
 if(typeof value!=='string'||new TextEncoder().encode(value).length>8192||/<!DOCTYPE|<!ENTITY/i.test(value))return false;
 try {const doc=new DOMParser().parseFromString(value,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')return false;
 return [...doc.querySelectorAll('*')].every(e=>tags.has(e.localName)&&[...e.attributes].every(a=>attrs.has(a.name)&&(a.name==='xmlns'?a.value==='http://www.w3.org/2000/svg':!/[<>]|url\s*\(|javascript:|https?:|data:|@import/i.test(a.value))));
 }catch{return false;}
}
export function validUnified(value:unknown):value is UnifiedLayout {
 const d=value as UnifiedLayout;if(!d||![4,5].includes(d.version)||Object.keys(d).some(k=>!['version','screen','home','apps'].includes(k)))return false;
 const s=d.screen;if(!s||Object.keys(s).length!==2||![s.width,s.height].every(n=>Number.isInteger(n)&&n>=320&&n<=7680))return false;
 if(new TextEncoder().encode(JSON.stringify(d)).length>90*1024)return false;
 for(const section of ['home','apps'] as const){const p=d[section];if(!p||Object.keys(p).some(k=>!['users','system','background','navigation'].includes(k))||!Array.isArray(p.users)||!Array.isArray(p.system)||p.users.length>(section==='home'?24:100)||p.system.length>32)return false;if(!p.background||Object.keys(p.background).some(k=>!['color','image'].includes(k))||!/^#[\da-f]{6}$/i.test(p.background.color))return false;const image=p.background.image;if(image!==undefined&&(typeof image!=='string'||image.length>33000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)))return false;if(!p.navigation||Object.entries(p.navigation).some(([key,value])=>!['up','down'].includes(key)||!['home','apps'].includes(value)))return false;const ids=new Set(),apps=new Set();
  for(const [kind,nodes] of [['users',p.users],['system',p.system]] as const)for(const n of nodes){
   const fields=d.version===5?['id','name','frame','action','text','visible','icon','textColor','iconColor','backgroundColor']:['id','name','frame','action','text','visible','icon','color','backgroundColor'];
   if(!n||Object.keys(n).length!==fields.length||Object.keys(n).some(k=>!fields.includes(k)))return false;
   if(typeof n.id!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(n.id)||ids.has(n.id))return false;ids.add(n.id);
   if(typeof n.name!=='string'||n.name.length>100||typeof n.text!=='string'||n.text.length>100||typeof n.visible!=='boolean'||!/^#[\da-f]{6}$/i.test((d.version===5?n.textColor:n.color)??'')||(d.version===5&&!/^#[\da-f]{6}$/i.test(n.iconColor??''))||(!/^#[\da-f]{6}$/i.test(n.backgroundColor)&&!(d.version===5&&n.backgroundColor==='transparent'))||!validSvg(n.icon)||!/^\w+(?:\.\w+)+$/.test(n.action)||n.action.length>255)return false;
   const f=n.frame;if(!f||Object.keys(f).length!==4||!['x','y','width','height'].every(k=>Number.isInteger(f[k as keyof typeof f]))||f.x<0||f.y<0||f.width<1||f.height<1||f.x+f.width>s.width||f.y+f.height>s.height)return false;
   if(kind==='users'){if(apps.has(n.action))return false;apps.add(n.action);}
  }
 }return true;
}
export function resizedSystem(nodes:UnifiedComponent[],from:{width:number;height:number},to:{width:number;height:number}):UnifiedComponent[]{
 return nodes.map(n=>({...n,frame:{x:Math.round(n.frame.x*to.width/from.width),y:Math.round(n.frame.y*to.height/from.height),width:Math.max(1,Math.round(n.frame.width*to.width/from.width)),height:Math.max(1,Math.round(n.frame.height*to.height/from.height))}}));
}
export function systemUnchanged(next:UnifiedLayout,current:UnifiedLayout):boolean {
 return (['home','apps'] as const).every(page=>{const a=next[page].system,b=resizedSystem(current[page].system,current.screen,next.screen);return a.length===b.length&&a.every((n,i)=>['id','name','action','text','visible','icon','color','textColor','iconColor','backgroundColor'].every(k=>n[k as keyof UnifiedComponent]===b[i][k as keyof UnifiedComponent])&&(['x','y','width','height'] as const).every(k=>n.frame[k]===b[i].frame[k]));});
}

export function textColor(n:UnifiedComponent):string{return n.textColor??n.color??'#F5F5F5';}
export function iconColor(n:UnifiedComponent):string{return n.iconColor??textColor(n);}
