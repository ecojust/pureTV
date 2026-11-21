import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshState, hydrate, solvePuzzle, finish, ARRIVAL_ORDER, RADIO_SOLUTION, MERIDIAN_SOLUTION, VERSION } from '../src/game.js';
import { chapters, chapterPuzzles } from '../src/chapters.js';
import { words } from '../src/content.js';
import { CHAPTER_PUZZLES, REEFS, ROUTE_SOLUTION, SPECIMEN_GIVENS, ORIGIN_SOLUTION, adjacent, initialPuzzle, freshChapter, extendRoute, lampClaims, toggleBridge, bridgePlan, traceLight, grow, overlayShutters, SHUTTER_TARGET, validateChapterPuzzle, unlockedChapter, selectChapter, changeChapterPuzzle, resetChapterPuzzle, submitChapterPuzzle, completeChapter } from '../src/campaign.js';
const permutations=a=>a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];
const cartesian=(radix,length)=>Array.from({length:radix**length},(_,n)=>Array.from({length},()=>{const v=n%radix;n=Math.floor(n/radix);return v;}));
const answers={route:ROUTE_SOLUTION,lamps:[0,1,1,1],bridge:Array(9).fill(0),mirrors:[0,0,1,0,0,1],growth:[1,0,1,0,2],specimens:[1,2,3,4,3,4,1,2,4,3,2,1,2,1,4,3],causality:[3,1,4,2,0],shutters:[1,3,2],origin:ORIGIN_SOLUTION};
function chapterOne() {
  const s=freshState('en');s.started=true;
  s.archive=[...ARRIVAL_ORDER];solvePuzzle(s,'archive');s.radio=[...RADIO_SOLUTION];solvePuzzle(s,'radio');s.tide=[0,0,0,0];solvePuzzle(s,'tide');s.phase='echo';s.meridian=[...MERIDIAN_SOLUTION];solvePuzzle(s,'meridian');s.phase='present';finish(s,'keep');return s;
}
function solveChapter(state,id) {
  assert.equal(selectChapter(state,id),true);
  for(const key of CHAPTER_PUZZLES[id]) {state.campaign.chapters[id].puzzles[key]=[...answers[key]];assert.equal(submitChapterPuzzle(state,key),true,key);}
}

test('ferry evidence admits exactly one ten-move crossing',()=>{
  const c=freshChapter(2), solutions=[];
  function walk(path) {
    if(path.at(-1)===15){c.puzzles.route=path;if(validateChapterPuzzle(c,'route'))solutions.push(path);return;}
    if(path.length===11)return;
    for(let n=0;n<16;n++)if(!REEFS.includes(n)&&!path.includes(n)&&adjacent(path.at(-1),n))walk([...path,n]);
  }
  walk([0]);assert.deepEqual(solutions,[ROUTE_SOLUTION]);
});
test('route can backtrack and cannot teleport, cross reefs, or form a loop',()=>{
  const path=[0,4,5,6];assert.deepEqual(extendRoute(path,4),[0,4]);assert.deepEqual(extendRoute(path,15),path);assert.deepEqual(extendRoute(path,2),path);assert.deepEqual(path,[0,4,5,6]);
});
test('the four truthful-or-lying lamps have one consistent state',()=>{
  const solutions=cartesian(2,4).filter(v=>v.every((n,i)=>n===lampClaims(v)[i]));assert.deepEqual(solutions,[answers.lamps]);
});
test('all 512 electrical boards have an exact adaptive solution',()=>{
  for(const values of cartesian(2,9)) {
    const plan=bridgePlan(values);assert.ok(plan);
    assert.deepEqual(plan.reduce(toggleBridge,values),Array(9).fill(0));
    for(let i=0;i<9;i++)assert.deepEqual(toggleBridge(toggleBridge(values,i),i),values);
  }
});
test('one mirror arrangement visits every mirror and reaches the receiver',()=>{
  const matches=cartesian(2,6).filter(v=>traceLight(v).success);assert.deepEqual(matches,[answers.mirrors]);
  for(const values of cartesian(2,6))assert.ok(traceLight(values).points.length<=102);
});
test('cultivation has exactly one five-cycle program under the written rules',()=>{
  const c=freshChapter(3);const solutions=cartesian(3,5).filter(v=>{c.puzzles.growth=v;return validateChapterPuzzle(c,'growth');});
  assert.deepEqual(solutions,[answers.growth]);assert.deepEqual(grow(answers.growth).history,[[1,0,0],[2,0,0],[2,2,0],[3,2,0],[3,5,0],[2,5,5]]);
  assert.equal(grow([2,2,2,2,2]).valid,false);assert.equal(grow([1,1,1,1,1,1]).valid,false);
});
test('row-column specimen rules and five givens determine one cabinet',()=>{
  const c=freshChapter(3),rows=permutations([1,2,3,4]), solutions=[];
  function fill(values) {
    if(values.length===16){c.puzzles.specimens=values;if(validateChapterPuzzle(c,'specimens'))solutions.push(values);return;}
    for(const row of rows) {
      const next=[...values,...row];
      if(Object.entries(SPECIMEN_GIVENS).some(([i,v])=>Number(i)<next.length&&next[i]!==v))continue;
      if(row.some((n,col)=>values.some((v,i)=>i%4===col&&v===n)))continue;
      fill(next);
    }
  }
  fill([]);assert.deepEqual(solutions,[answers.specimens]);
});
test('causal constraints and shutter overlay independently have unique solutions',()=>{
  const c=freshChapter(4);
  assert.deepEqual(permutations([0,1,2,3,4]).filter(v=>{c.puzzles.causality=v;return validateChapterPuzzle(c,'causality');}),[answers.causality]);
  assert.deepEqual(cartesian(4,3).filter(v=>overlayShutters(v).every((n,i)=>n===SHUTTER_TARGET[i])),[answers.shutters]);
});
test('legacy version-one saves preserve partial progress, language, notes, and endings',()=>{
  for(const old of [freshState('zh'),chapterOne()]) {
    old.personalNote='Keep this deduction. 保留推理。';old.radio=[...RADIO_SOLUTION];old.sound=true;
    delete old.campaign;old.version=1;
    const next=hydrate(JSON.parse(JSON.stringify(old)));
    assert.equal(next.version,VERSION);assert.equal(next.lang,old.lang);assert.equal(next.personalNote,old.personalNote);assert.deepEqual(next.radio,old.radio);assert.equal(next.ending,old.ending);assert.equal(next.sound,true);assert.equal(unlockedChapter(next),old.ending?2:1);
  }
});
test('locked chapters, unknown controls, wrong solutions and Echo exits cannot bypass gates',()=>{
  const s=freshState();assert.equal(selectChapter(s,2),false);assert.equal(selectChapter(s,99),false);
  const ready=chapterOne();selectChapter(ready,2);assert.equal(completeChapter(ready),false);assert.equal(submitChapterPuzzle(ready,'route'),false);assert.equal(submitChapterPuzzle(ready,'origin'),false);assert.equal(changeChapterPuzzle(ready,'missing',0),false);
  solveChapter(ready,2);ready.campaign.chapters[2].phase='echo';assert.equal(completeChapter(ready),false);ready.campaign.chapters[2].phase='present';assert.equal(completeChapter(ready,'carry'),false);assert.equal(completeChapter(ready),true);assert.equal(unlockedChapter(ready),3);
});
for(const ending of ['carry','quiet'])test(`all four chapters complete with ${ending}; revisits and reloads retain independent progress`,()=>{
  let s=chapterOne();s.personalNote='Four places / 四个地点';
  for(const id of [2,3,4]) {
    solveChapter(s,id);s.campaign.chapters[id].inspected=['present','echo'];s.campaign.chapters[id].hints[CHAPTER_PUZZLES[id][0]]=2;
    assert.equal(completeChapter(s,id===4?ending:'continue'),true);
    assert.deepEqual(hydrate(JSON.parse(JSON.stringify(s))),s);
  }
  const snapshot=JSON.stringify(s.campaign.chapters);
  selectChapter(s,1);assert.equal(s.ending,'keep');selectChapter(s,3);assert.equal(s.campaign.chapters[3].complete,true);assert.equal(JSON.stringify(s.campaign.chapters),snapshot);assert.equal(s.personalNote,'Four places / 四个地点');
  assert.equal(resetChapterPuzzle(s,'growth'),false);assert.equal(changeChapterPuzzle(s,'specimens',2),false);
});
test('origin requires the other lighthouse instruments; resets stay within one puzzle',()=>{
  const s=chapterOne();solveChapter(s,2);completeChapter(s);solveChapter(s,3);completeChapter(s);selectChapter(s,4);
  const c=s.campaign.chapters[4];c.puzzles.origin=[...ORIGIN_SOLUTION];assert.equal(submitChapterPuzzle(s,'origin'),false);
  changeChapterPuzzle(s,'shutters',0);const origin=[...c.puzzles.origin];resetChapterPuzzle(s,'shutters');assert.deepEqual(c.puzzles.origin,origin);
});
test('a visited chapter remains started after selecting another chapter and reloading',()=>{
  const s=chapterOne();selectChapter(s,2);assert.equal(s.campaign.chapters[2].started,true);
  selectChapter(s,1);const next=hydrate(s);assert.equal(next.campaign.active,1);assert.equal(next.campaign.chapters[2].started,true);
});
test('corrupt campaign saves cannot forge chapter completion or overwrite fixed clues',()=>{
  const s=chapterOne();s.campaign.active=4;s.campaign.chapters[2].complete=true;
  const sanitized=hydrate(s);assert.equal(sanitized.campaign.active,2);assert.equal(sanitized.campaign.chapters[2].complete,false);
  solveChapter(s,2);completeChapter(s);selectChapter(s,3);s.campaign.chapters[3].puzzles.specimens[0]=4;s.campaign.chapters[3].puzzles.growth=[1,1,1,1,99];
  const next=hydrate(s);assert.deepEqual(next.campaign.chapters[3].puzzles.specimens,initialPuzzle('specimens'));assert.deepEqual(next.campaign.chapters[3].puzzles.growth,initialPuzzle('growth'));
});
test('all chapter copy, puzzle hints and records are bilingual, with local scene art',async()=>{
  const pair=(v,label)=>{assert.equal(v.length,2,label);v.forEach(s=>assert.ok(typeof s==='string'&&s.trim(),label));};
  for(const [id,data]of Object.entries(chapters)) {
    for(const key of ['title','subtitle','summary'])pair(data[key],`${id}/${key}`);
    if(data.intro)pair(data.intro,`${id}/intro`);
    for(const record of data.records||[]){pair(record.slice(0,2),`${id}/record title`);pair(record.slice(2),`${id}/record text`);}
    for(const key of ['endTitle','endBody','travelTitle','travelResult'])if(data[key])pair(data[key],`${id}/${key}`);
    const image=await readFile(new URL(`../assets/${data.art}.png`,import.meta.url));assert.equal(image.subarray(1,4).toString(),'PNG');
  }
  for(const [id,data]of Object.entries(chapterPuzzles)){for(const key of ['title','intro','result'])pair(data[key],id);assert.equal(data.hints.length,3);data.hints.forEach(v=>pair(v,id));}
  const source=await readFile(new URL('../src/expedition.js',import.meta.url),'utf8');for(const m of source.matchAll(/\bt\('([A-Za-z][A-Za-z0-9]*)'\)/g))assert.ok(words[m[1]],m[1]);
});
