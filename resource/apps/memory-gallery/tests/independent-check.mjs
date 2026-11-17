import assert from 'node:assert/strict';
import model from '../src/main/assets/game-model.js';
import {memorizePreview} from './automation.mjs';
function press(s,input){model.step(s,1/60,{});model.step(s,1/60,input);}
function cursor(s,to){while(s.cursor%s.width!==to%s.width)press(s,{x:s.cursor%s.width<to%s.width?1:-1});while(Math.floor(s.cursor/s.width)!==Math.floor(to/s.width))press(s,{y:s.cursor<to?1:-1});}
function waitPreview(s){while(s.stage==='preview')model.step(s,.25,{});assert.ok(s.visibleFaces.every(v=>v===null));}
const results=[];
for(let level=0;level<3;level++){
 const s=model.create(760,level),memory=memorizePreview(s);waitPreview(s);
 const foreign=structuredClone(s),frozenCopy=JSON.stringify(foreign);model.step(foreign,.25,{a:true});assert.equal(JSON.stringify(foreign),frozenCopy);
 for(let symbol=1;symbol<=s.pairCount;symbol++){
  const pair=memory.flatMap((v,i)=>v===symbol?[i]:[]);cursor(s,pair[0]);press(s,{a:true});assert.equal(s.visibleFaces[pair[0]],symbol);assert.ok(s.visibleFaces.every((v,i)=>v===null||s.locked[i]||i===pair[0]));
  cursor(s,pair[1]);press(s,{a:true});assert.ok(s.locked[pair[0]]&&s.locked[pair[1]]);assert.equal(s.matchedPairs,symbol);
 }
 assert.equal(s.phase,'won');assert.equal(s.flips,s.pairCount*2);const terminal=JSON.stringify(s);press(s,{a:true});assert.equal(JSON.stringify(s),terminal);
 const loss=model.create(760,level),seen=memorizePreview(loss),wrong=seen.findIndex(v=>v!==seen[0]);waitPreview(loss);
 for(let n=0;n<loss.mistakeLimit;n++){
  cursor(loss,0);press(loss,{a:true});cursor(loss,wrong);press(loss,{a:true});assert.equal(loss.stage,'compare');assert.equal(loss.mistakes,n);assert.equal(loss.visibleFaces.filter(v=>v!==null).length,2);
  for(let k=0;k<3;k++){model.step(loss,.25,{});assert.equal(loss.mistakes,n);}model.step(loss,.25,{});assert.equal(loss.mistakes,n+1);assert.ok(loss.visibleFaces.every(v=>v===null));
 }
 assert.equal(loss.phase,'lost');assert.equal(loss.reason,'mistakes');
 results.push({level,pairs:s.matchedPairs,ordinaryFlips:s.flips,phase:s.phase,memorizedOnlyVisiblePreview:true,hiddenCardsNull:true,foreignSnapshotNoop:true,ordinaryDelayedMismatchLoss:true});
}
console.log(JSON.stringify({passed:true,method:'Remember the actual initial public preview; use ordinary inputs to pair remembered faces and exercise visible mismatch delays. No private deck or seed reconstruction.',layouts:results},null,2));
