// Production scheduler: original UI/audio timers advance only with the TV owner frame.
let elapsed=0,nextId=1;const jobs=new Map();
export function later(fn,ms=0,...args){const id=nextId++;jobs.set(id,{fn,args,due:elapsed+Math.max(0,Number(ms)||0),interval:0});return id;}
export function repeat(fn,ms=0,...args){const id=nextId++;jobs.set(id,{fn,args,due:elapsed+Math.max(1,Number(ms)||1),interval:Math.max(1,Number(ms)||1)});return id;}
export function cancel(id){jobs.delete(id);}
export function paint(fn){return later(()=>fn(elapsed),0);}
export function advance(ms){elapsed+=Math.max(0,Math.min(100,ms));for(const [id,j] of [...jobs])if(j.due<=elapsed&&jobs.has(id)){if(j.interval)j.due=elapsed+j.interval;else jobs.delete(id);j.fn(...j.args);}}
export function clockSnapshot(){return {elapsed,pending:jobs.size};}
