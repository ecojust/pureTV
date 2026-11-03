// Independent time-expanded public-lane search. No production transitions/routes.
export const physics={width:420,rows:7,cell:60,radius:10,tick:1/120,homeWidth:48};
const wrap=x=>((x%420)+420)%420;
export function periodicDistance(a,b){const d=Math.abs(a-b);return Math.min(d,420-d);}
export function geometry(state,player,time=0,{margin=0,allowedHomes=null}={}){
 const {x,row}=player;if(x<10+margin||x>410-margin)return {safe:false,reason:'drift'};
 if(row===0){const home=state.homes.find(h=>Math.abs(x-h.x)+10+Math.min(margin,2)<=24+1e-9);return home&&!(allowedHomes?!allowedHomes.includes(home.id):state.visited.includes(home.id))?{safe:true,home:home.id}:{safe:false,reason:home?'repeat-home':'home-miss'};}
 const lane=state.lanes.find(l=>l.row===row);if(!lane)return {safe:true};
 const objects=lane.objects.map(o=>({...o,x:wrap(o.x+lane.speed*time)}));
 if(lane.type==='road'){const car=objects.find(o=>periodicDistance(x,o.x)<=lane.width/2+10+margin);return car?{safe:false,reason:'car',objectId:car.id}:{safe:true};}
 const support=objects.find(o=>periodicDistance(x,o.x)+10+margin<=lane.width/2+1e-9);return support?{safe:true,support: support.id,speed:lane.speed,lane:lane.id}:{safe:false,reason:'water'};
}
export function predict(state,node,action,ticks,{margin=0,allowedHomes=null}={}){
 let x=node.x,row=node.row,time=node.time;const moves={up:[0,-1],down:[0,1],left:[-60,0],right:[60,0],none:[0,0]},[dx,dy]=moves[action];x+=dx;row+=dy;
 if(x<10||x>410||row<0||row>6)return null;
 let assessment=geometry(state,{x,row},time,{margin,allowedHomes});if(!assessment.safe)return null;if(assessment.home)return {x,row,time,home:assessment.home};
 for(let i=0;i<ticks;i++){assessment=geometry(state,{x,row},time,{margin,allowedHomes});if(!assessment.safe)return null;if(assessment.speed!==undefined)x+=assessment.speed/120;time+=1/120;assessment=geometry(state,{x,row},time,{margin,allowedHomes});if(!assessment.safe)return null;}
 return {x,row,time};
}
class Heap{a=[];push(value){const a=this.a;a.push(value);for(let i=a.length-1;i>0;){const p=(i-1)>>1;if(a[p].priority<=value.priority)break;a[i]=a[p];a[p]=value;i=p;}}pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){let j=i*2+1;if(j>=a.length)break;if(j+1<a.length&&a[j+1].priority<a[j].priority)j++;if(a[i].priority<=a[j].priority)break;[a[i],a[j]]=[a[j],a[i]];i=j;}}return first;}get length(){return this.a.length;}}
export function planVisible(state,{margin=3,stepTicks=24,horizon=18,maxNodes=12000,allowedHomes=null}={}){
 if(state.respawnTicks>0)return {action:'none',route:[],nodes:0};
 const homes=state.homes.filter(h=>allowedHomes?allowedHomes.includes(h.id):!state.visited.includes(h.id));if(!homes.length)return {action:'none',route:[],nodes:0};
 const heuristic=n=>n.row+Math.min(...homes.map(h=>Math.abs(n.x-h.x)/60));const first={x:state.player.x,row:state.player.row,time:0,route:[],depth:0};const heap=new Heap(),seen=new Map();heap.push({...first,priority:heuristic(first)});let nodes=0;
 while(heap.length&&nodes<maxNodes){const node=heap.pop();nodes++;if(node.depth>=horizon)continue;
  for(const action of ['up','left','right','none','down']){const next=predict(state,node,action,stepTicks,{margin,allowedHomes});if(!next)continue;const route=[...node.route,action];if(next.home)return {action:route[0],route,home:next.home,nodes};const depth=node.depth+1,key=depth+':'+next.row+':'+Math.round(next.x*2);if(seen.has(key))continue;seen.set(key,true);heap.push({...next,route,depth,priority:depth+heuristic(next)*1.5});}
 }
 // Waiting is safe only when independently checked through the same horizon step.
 const wait=predict(state,first,'none',stepTicks,{margin,allowedHomes});return {action:wait?'none':null,route:[],nodes,noRoute:true};
}
