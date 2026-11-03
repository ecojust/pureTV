'use strict';
// Test-only A* over complete public body configurations. Never bundled in assets.
const directions=['up','right','down','left'],opposite={up:'down',down:'up',left:'right',right:'left'};
function neighbor(p,d,w,h){const x=p%w,y=Math.floor(p/w),dx=d==='right'?1:d==='left'?-1:0,dy=d==='down'?1:d==='up'?-1:0;return x+dx<0||x+dx>=w||y+dy<0||y+dy>=h?-1:p+dx+dy*w;}
function route(state){
 if(state.food===null)throw Error('No public food to route toward');
 const w=state.width,h=state.height,food=state.food,heap=[],best=new Map();let expanded=0;
 const distance=p=>Math.abs(p%w-food%w)+Math.abs(Math.floor(p/w)-Math.floor(food/w));
 function push(n){heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].score<=n.score)break;heap[i]=heap[p];i=p;}heap[i]=n;}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=last.score)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
 push({body:state.body.slice(),dir:state.direction,path:[],score:distance(state.body[0])});
 while(heap.length){const n=pop(),key=n.body.join(',')+'|'+n.dir,g=n.path.length;if(best.has(key)&&best.get(key)<g)continue;
  if(++expanded>200000)throw Error('Public-body route search exceeded bound');
  for(const dir of directions){if(dir===opposite[n.dir])continue;const p=neighbor(n.body[0],dir,w,h);if(p<0||state.walls[p])continue;
   const grow=p===food;if((grow?n.body:n.body.slice(0,-1)).includes(p))continue;const body=[p,...n.body];if(!grow)body.pop();const path=n.path.concat(dir);
   if(grow)return {directions:path,expanded};const childKey=body.join(',')+'|'+dir;if(best.has(childKey)&&best.get(childKey)<=g+1)continue;best.set(childKey,g+1);push({body,dir,path,score:g+1+distance(p)});
  }
 }
 throw Error('No safe route to current public fruit');
}
module.exports={route,neighbor};
