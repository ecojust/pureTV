// Test-only complete row-candidate search from visible binary clues.
export function solveVisible(s){
 const w=s.width,h=s.height,clues=s.givens||Object.entries(s.fixedValues).map(([cell,value])=>({cell:+cell,value}));
 const balanced=[];for(let bits=0;bits<2**w;bits++){const row=Array.from({length:w},(_,i)=>(bits>>i)&1);if(row.reduce((a,b)=>a+b,0)!==w/2)continue;if(row.some((v,i)=>i>=2&&v===row[i-1]&&v===row[i-2]))continue;balanced.push(row);}
 const candidates=Array.from({length:h},(_,r)=>balanced.filter(row=>clues.every(g=>Math.floor(g.cell/w)!==r||row[g.cell%w]===g.value)));
 let nodes=0,solutions=0,solution=null;const rows=[],seen=new Set(),sums=Array(w).fill(0);
 function visit(r){nodes++;if(r===h){const cols=Array.from({length:w},(_,c)=>rows.map(row=>row[c]).join(''));if(new Set(cols).size!==w)return;solutions++;if(!solution)solution=rows.flat();return;}
  for(const row of candidates[r]){const key=row.join('');if(seen.has(key))continue;if(row.some((v,c)=>sums[c]+v>h/2||sums[c]+v+h-r-1<h/2||r>=2&&v===rows[r-1][c]&&v===rows[r-2][c]))continue;
   seen.add(key);rows.push(row);row.forEach((v,c)=>sums[c]+=v);visit(r+1);row.forEach((v,c)=>sums[c]-=v);rows.pop();seen.delete(key);if(solutions>1)return;
  }
 }
 visit(0);if(solutions!==1)throw Error(`Expected unique binary public-clue grid, observed ${solutions}`);return {solution,solutions,nodes,rowCandidates:candidates.map(a=>a.length)};
}
export function ruleViolations(s,cells=s.cells){
 const violations=[];
 for(const [axis,length,count]of [['row',s.width,s.height],['column',s.height,s.width]]){
  const lines=Array.from({length:count},(_,i)=>Array.from({length},(_,j)=>axis==='row'?i*s.width+j:j*s.width+i));
  for(let i=0;i<count;i++){const positions=lines[i],values=positions.map(p=>cells[p]);if(values.some(v=>v!==0&&v!==1)){violations.push({type:'incomplete',axis,index:i});continue;}
   if(values.filter(v=>v===1).length!==length/2)violations.push({type:'balance',axis,index:i});for(let j=2;j<length;j++)if(values[j]===values[j-1]&&values[j]===values[j-2])violations.push({type:'triple',axis,index:i,cells:positions.slice(j-2,j+1)});
   for(let j=0;j<i;j++)if(positions.every((p,k)=>cells[p]===cells[lines[j][k]]))violations.push({type:'duplicate',axis,indices:[j,i]});
  }
 }
 return violations;
}
export function statuses(s,cells=s.cells){
 function family(axis){const count=axis==='row'?s.height:s.width,length=axis==='row'?s.width:s.height,positions=Array.from({length:count},(_,i)=>Array.from({length},(_,j)=>axis==='row'?i*s.width+j:j*s.width+i)),lines=positions.map(ps=>ps.map(p=>cells[p]));
  return lines.map((values,index)=>{const zeros=values.filter(v=>v===0).length,ones=values.filter(v=>v===1).length,filled=zeros+ones,complete=filled===length,balanced=zeros===length/2&&ones===length/2,triples=values.flatMap((v,i)=>i+2<length&&(v===0||v===1)&&v===values[i+1]&&v===values[i+2]?[i]:[]),duplicateWith=complete?lines.flatMap((other,i)=>i!==index&&other.every((v,j)=>v===values[j])?[i]:[]):[];return {index,filled,zeros,ones,complete,balanced,triples,duplicateWith,matched:complete&&balanced&&!triples.length&&!duplicateWith.length};});
 }return {rowStatus:family('row'),columnStatus:family('column')};
}
export function validate(s,cells=s.cells){
 const out=[];for(const g of s.givens)if(cells[g.cell]!==g.value)out.push({type:'fixed-clue',cell:g.cell,cells:[g.cell],expected:g.value,actual:cells[g.cell]});const report=statuses(s,cells);
 for(const axis of ['row','column']){const lines=report[axis==='row'?'rowStatus':'columnStatus'],length=axis==='row'?s.width:s.height,pos=i=>Array.from({length},(_,j)=>axis==='row'?i*s.width+j:j*s.width+i);
  for(const line of lines){const ps=pos(line.index);if(!line.balanced)out.push({type:axis+'-balance',[axis]:line.index,cells:ps,zeros:line.zeros,ones:line.ones,expected:length/2});for(const start of line.triples)out.push({type:axis+'-triple',[axis]:line.index,start,cells:ps.slice(start,start+3),value:cells[ps[start]]});}
  for(let a=0;a<lines.length;a++)for(const b of lines[a].duplicateWith)if(a<b)out.push({type:'duplicate-'+(axis==='row'?'rows':'columns'),[axis==='row'?'rows':'columns']:[a,b],cells:[...pos(a),...pos(b)]});
 }return out;
}
