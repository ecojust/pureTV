// Test-only public clues and independent attack/search rules. No solution is shipped.
export const layouts=[
 {size:6,blocked:[0,5,14],fixed:[]},
 {size:7,blocked:[0,6,42,48,24],fixed:[22]},
 {size:8,blocked:[0,7,56,63,27],fixed:[20,40]}
];
export function conflicts(queens,size){
 const ids=queens.flatMap((on,i)=>on?[i]:[]),out=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j],ra=Math.floor(a/size),rb=Math.floor(b/size),ca=a%size,cb=b%size;
  const kind=ra===rb?'row':ca===cb?'column':Math.abs(ra-rb)===Math.abs(ca-cb)?'diagonal':null;if(kind)out.push({a,b,kind});
 }return out;
}
export function solutions(layout){
 const n=layout.size,found=[],chosen=[],blocked=new Set(layout.blocked),fixed=new Map(layout.fixed.map(i=>[Math.floor(i/n),i%n]));let visited=0;
 function search(row){visited++;if(row===n){found.push(chosen.slice());return;}
  for(let col=0;col<n;col++){
   if((fixed.has(row)&&fixed.get(row)!==col)||blocked.has(row*n+col))continue;
   if(chosen.some((id,r)=>id%n===col||Math.abs(id%n-col)===row-r))continue;
   chosen.push(row*n+col);search(row+1);chosen.pop();
  }
 }search(0);return {solutions:found,visited};
}
export function nextCursorKey(cursor,wanted,n){
 const r=Math.floor(cursor/n),row=Math.floor(wanted/n);if(r!==row)return row>r?'ArrowDown':'ArrowUp';
 if(cursor!==wanted)return wanted>cursor?'ArrowRight':'ArrowLeft';return null;
}
