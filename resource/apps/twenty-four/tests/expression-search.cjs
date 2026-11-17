'use strict';
// Test-only BigInt oracle/search. No answer expression or route is bundled with assets.
function fraction(n,d){if(!d)return null;if(!n)return{n:0n,d:1n};if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return{n:n/a,d:d/a};}
function apply(a,b,op){if(op===2||op===5)[a,b]=[b,a];if(op===0)return fraction(a.n*b.d+b.n*a.d,a.d*b.d);if(op===1||op===2)return fraction(a.n*b.d-b.n*a.d,a.d*b.d);if(op===3)return fraction(a.n*b.n,a.d*b.d);return fraction(a.n*b.d,a.d*b.n);}
function solveTerms(input,integerOnly=false){const start=input.map(t=>({mask:t.mask,n:BigInt(t.n),d:BigInt(t.d)})),seen=new Set();let visited=0,maxAbsNumerator=0n,maxDenominator=0n;
 function search(terms){const key=terms.map(t=>t.mask+':'+t.n+'/'+t.d).sort().join('|');if(seen.has(key))return null;seen.add(key);visited++;for(const t of terms){const n=t.n<0n?-t.n:t.n;if(n>maxAbsNumerator)maxAbsNumerator=n;if(t.d>maxDenominator)maxDenominator=t.d;}if(terms.length===1)return terms[0].mask===15&&terms[0].n===24n*terms[0].d?[]:null;
  for(let i=0;i<terms.length;i++)for(let j=i+1;j<terms.length;j++)for(let op=0;op<6;op++){const value=apply(terms[i],terms[j],op);if(!value||integerOnly&&value.d!==1n)continue;const result={mask:terms[i].mask|terms[j].mask,...value},next=terms.filter((_,k)=>k!==i&&k!==j).concat(result),tail=search(next);if(tail)return[{first:terms[i].mask,second:terms[j].mask,op,result:{mask:result.mask,n:Number(value.n),d:Number(value.d)}}].concat(tail);}
  return null;
 }const route=search(start);return{route,visited,maxAbsNumerator:String(maxAbsNumerator),maxDenominator:String(maxDenominator)};
}
function solve(cards,integerOnly=false){return solveTerms(cards.map((n,i)=>({mask:1<<i,n,d:1})),integerOnly);}
module.exports={fraction,apply,solve,solveTerms};
