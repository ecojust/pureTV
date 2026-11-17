import type {LauncherLayout,LayoutFrame,LayoutGeometry} from './types';
export const sceneLabels:Record<string,string>={background:'背景',clock:'时钟',date:'日期',weather:'天气',wallpaper:'桌面设置',favourites:'收藏',inputs:'输入源',network:'网络',settings:'设置',allApps:'全部应用',title:'应用标题',subtitle:'应用副标题',backHome:'返回首页'};
export function validGeometry(node:any):boolean {
 if(node.visible!==undefined && typeof node.visible!=='boolean')return false;
 if(node.zIndex!==undefined && (!Number.isInteger(node.zIndex)||node.zIndex<0||node.zIndex>20))return false;
 if(node.frame===undefined)return true;const f=node.frame;
 return !!f && Object.keys(f).length===4 && ['x','y','width','height'].every(k=>Number.isInteger(f[k])) && f.x>=0 && f.y>=0 && f.width>0 && f.height>0 && f.x+f.width<=960 && f.y+f.height<=540;
}
export function validScene(scene:any,section:string):boolean {
 if(!scene || Object.keys(scene).some(k=>!['background','elements'].includes(k)))return false;
 const bg=scene.background;if(!bg || !bg.frame || Object.keys(bg).some(k=>!['frame','visible','zIndex','color','image'].includes(k)) || !validGeometry(bg) || !/^#[0-9a-fA-F]{6}$/.test(bg.color))return false;
 if(bg.image!==undefined && (typeof bg.image!=='string'||bg.image.length>33000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(bg.image)))return false;
 const allowed=section==='home'?['clock','date','weather','wallpaper','favourites','inputs','network','settings','allApps']:['title','subtitle','backHome'];
 if(!Array.isArray(scene.elements))return false;const ids=new Set();
 return scene.elements.every((n:any)=>n && allowed.includes(n.id) && !ids.has(n.id) && ids.add(n.id) && n.frame && validGeometry(n) && Object.keys(n).every(k=>['id','frame','visible','zIndex'].includes(k)));
}
export function autoFrame(section:string,index:number,columns:number,count:number):LayoutFrame {
 const rows=Math.max(1,Math.ceil(count/columns)),start=section==='home' && rows===1?326:128,step=Math.floor(Math.min(174,348/rows));
 return {x:48+(index%columns)*Math.floor(864/columns),y:start+Math.floor(index/columns)*step,width:Math.floor(864/columns)-16,height:Math.max(1,Math.min(150,step-16))};
}
export function sceneNode(draft:LauncherLayout,section:'home'|'apps',node:string|null,index:number):LayoutGeometry|undefined {
 const page=draft[section];return node==='background'?page.scene?.background:node?page.scene?.elements.find(n=>n.id===node):page.items[index];
}
export function frameStyle(frame:LayoutFrame):string {return `left:${frame.x/9.6}%;top:${frame.y/5.4}%;width:${frame.width/9.6}%;height:${frame.height/5.4}%;`;}
