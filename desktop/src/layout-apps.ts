import type {LauncherLayout, UnifiedLayout} from './types';

export interface UnavailableLayoutApp {page:'home'|'apps';id:string;name:string;packageName:string}

/** Check every page, including hidden cards; availability comes from the current TV user. */
export function unavailableLayoutApps(layout:LauncherLayout|UnifiedLayout, apps:readonly {packageName:string}[]):UnavailableLayoutApp[] {
  const available=new Set(apps.map(app=>app.packageName));
  const result:UnavailableLayoutApp[]=[];
  for(const page of ['home','apps'] as const){
    const section=layout[page];
    if('users' in section){
      for(const entry of section.users)if(!available.has(entry.action))result.push({page,id:entry.id,name:entry.name,packageName:entry.action});
    }else{
      section.items.forEach((entry,index)=>{if(entry.packageName&&!available.has(entry.packageName))result.push({page,id:String(index+1),name:entry.label||entry.packageName,packageName:entry.packageName});});
    }
  }
  return result;
}
