// Independent test-only path geometry. No model imports or future fruit prediction.
export const directions=[{name:'up',key:'ArrowUp',x:0,y:-1},{name:'right',key:'ArrowRight',x:1,y:0},{name:'down',key:'ArrowDown',x:0,y:1},{name:'left',key:'ArrowLeft',x:-1,y:0}];
export function nextCell(s,p,d){const x=p%s.width+d.x,y=Math.floor(p/s.width)+d.y;return x<0||x>=s.width||y<0||y>=s.height?-1:y*s.width+x;}
function path(s,body,target){
 const blocked=new Set(body.slice(1,-1)),queue=[{cell:body[0],route:[]}],seen=new Set([body[0]]);
 for(let q=0;q<queue.length;q++){const n=queue[q];if(n.cell===target)return n.route;
  for(const d of directions){const p=nextCell(s,n.cell,d);if(p<0||s.walls[p]||blocked.has(p)||seen.has(p))continue;seen.add(p);queue.push({cell:p,route:[...n.route,d]});}}
 return null;
}
function simulated(s,route){const body=s.body.slice();for(const d of route){const p=nextCell(s,body[0],d),growing=p===s.food;if(p<0||s.walls[p]||(growing?body:body.slice(0,-1)).includes(p))return null;body.unshift(p);if(!growing)body.pop();}return body;}
export function chooseDirection(s){
 if(s.queuedDirection)return directions.find(d=>d.name===s.queuedDirection);
 const foodPath=s.food===null?null:path(s,s.body,s.food);
 if(foodPath?.length){const grown=simulated(s,foodPath);if(grown&&(s.eaten+1===s.goalFruit||path(s,grown,grown.at(-1))))return foodPath[0];}
 const tailPath=path(s,s.body,s.body.at(-1));if(tailPath?.length)return tailPath[0];
 const opposite={up:'down',down:'up',left:'right',right:'left'};
 return directions.find(d=>d.name!==opposite[s.direction]&&simulated(s,[d]))||null;
}
