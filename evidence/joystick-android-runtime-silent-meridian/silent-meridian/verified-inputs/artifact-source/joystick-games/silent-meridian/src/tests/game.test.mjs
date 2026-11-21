import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshState, hydrate, saveState, loadState, addNote, placeSymbol, turnTide, tidePlan, validatePuzzle, solvePuzzle, canFinish, finish, allCalibrated, ARRIVAL_ORDER, RADIO_SOLUTION, MERIDIAN_SOLUTION, SYMBOL_IDS, ROOM_IDS, NOTE_IDS, COUPLINGS, mod, SAVE_KEY } from '../src/game.js';
import { words, rooms, notes, symbols, hints } from '../src/content.js';

const permutations = a => a.length ? a.flatMap((v,i) => permutations(a.filter((_,j)=>j!==i)).map(p=>[v,...p])) : [[]];
function restored() {
  const s=freshState(); s.started=true;
  s.archive=[...ARRIVAL_ORDER]; solvePuzzle(s,'archive');
  s.radio=[...RADIO_SOLUTION]; solvePuzzle(s,'radio');
  s.tide=[0,0,0,0]; solvePuzzle(s,'tide');
  return s;
}

test('the two arrival records determine exactly one sequence', () => {
  const candidates=permutations(SYMBOL_IDS).filter(p=>p[2]==='sun' && p[4]==='diamond' && p.indexOf('star')===p.indexOf('sun')-1 && p.indexOf('wave')<p.indexOf('peak'));
  assert.deepEqual(candidates,[ARRIVAL_ORDER]);
});
test('radio evidence independently determines the three tuning values', () => {
  const solutions=[];
  for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++) {
    if(a===ARRIVAL_ORDER.indexOf('star')+1 && b===2*a && c===b+2)solutions.push([a,b,c]);
  }
  assert.deepEqual(solutions,[RADIO_SOLUTION]);
});
test('final inscription combines the three recovered references', () => {
  assert.deepEqual(MERIDIAN_SOLUTION,[0,ARRIVAL_ORDER.indexOf('sun')+1,RADIO_SOLUTION[2]]);
});
test('placing an already used emblem swaps instead of losing a symbol', () => {
  const original=['wave','star',null,null,null];
  assert.deepEqual(placeSymbol(original,0,'star'),['star','wave',null,null,null]);
  assert.deepEqual(placeSymbol(original,2,'wave'),[null,'star','wave',null,null]);
  assert.deepEqual(original,['wave','star',null,null,null]);
});
test('all 4096 tide configurations are reachable; no arrangement can soft-lock', () => {
  const reachable=new Set();
  for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let c=0;c<8;c++)for(let d=0;d<8;d++) {
    reachable.add([0,1,2,3].map(i=>mod([a,b,c,d].reduce((sum,v,j)=>sum+v*COUPLINGS[j][i],0),8)).join(','));
  }
  assert.equal(reachable.size,4096);
});
test('every tide control can be reversed exactly, including wraparound', () => {
  for(const values of [[0,0,0,0],[7,7,7,7],[1,4,2,6]])for(let i=0;i<4;i++)assert.deepEqual(turnTide(turnTide(values,i,1),i,-1),values);
});
test('adaptive tide hints solve the current state, after arbitrary exploration', () => {
  for(const start of [freshState().tide,[1,4,2,6],[0,0,0,0],[7,7,7,7],[2,5,1,0],[1,7,2,4],[3,0,5,6]]) {
    const plan=tidePlan(start); assert.ok(plan);
    let positions=[...start];
    plan.presses.forEach((n,i)=>{for(let j=0;j<Math.abs(n);j++)positions=turnTide(positions,i,Math.sign(n));});
    assert.deepEqual(positions,[0,0,0,0]);
    assert.ok(plan.cost<=16);
  }
});
test('incorrect puzzle submissions do not grant a calibration or result note', () => {
  const s=freshState();
  for(const puzzle of ['archive','radio','tide','meridian'])assert.equal(solvePuzzle(s,puzzle),false);
  assert.equal(allCalibrated(s),false); assert.deepEqual(s.notes,[]);
});
test('meridian cannot bypass its three references or the Echo phase', () => {
  const s=freshState(); s.meridian=[...MERIDIAN_SOLUTION];s.phase='echo';assert.equal(solvePuzzle(s,'meridian'),false);
  const ready=restored();ready.meridian=[...MERIDIAN_SOLUTION];assert.equal(solvePuzzle(ready,'meridian'),false);
  ready.phase='echo';assert.equal(solvePuzzle(ready,'meridian'),true);assert.equal(canFinish(ready),false);
  ready.phase='present';assert.equal(canFinish(ready),true);
});
for(const ending of ['keep','release'])test(`complete investigation reaches the ${ending} ending and survives reload`, () => {
  const s=restored();s.notes.push('welcome','meridian-rule','last-letter');s.meridian=[...MERIDIAN_SOLUTION];s.phase='echo';
  assert.equal(solvePuzzle(s,'meridian'),true);assert.equal(finish(s,ending),false);
  s.phase='present';assert.equal(finish(s,ending),true);
  s.personalNote='The same observer. 同一个人。';
  const reloaded=hydrate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(reloaded,s);
});
test('invalid endings cannot overwrite progress', () => {
  const s=freshState();assert.equal(finish(s,'keep'),false);assert.equal(s.ending,null);
  const ready=restored();ready.anchor=true;assert.equal(finish(ready,'other'),false);assert.equal(ready.ending,null);
});
test('corrupt and outdated saves fall back safely without trusting invalid values', () => {
  assert.deepEqual(hydrate({version:0}),freshState());
  const s=hydrate({version:1,room:'outside',phase:'future',lang:'fr',tide:[NaN,9,-1,3],archive:['sun','sun',null,null,null],solved:{archive:true,radio:true,tide:true},anchor:true,ending:'keep',notes:['welcome','welcome','unknown'],personalNote:'x'.repeat(5000),hints:{tide:99}});
  assert.equal(s.room,'observatory');assert.equal(s.phase,'present');assert.equal(s.ending,null);assert.equal(s.anchor,false);
  assert.deepEqual(s.archive,[null,null,null,null,null]);assert.deepEqual(s.notes,['welcome']);assert.equal(s.personalNote.length,4000);assert.equal(s.hints.tide,3);
});
test('storage failures never throw into the game', () => {
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('full');}};
  assert.deepEqual(loadState(blocked,'en'),{state:freshState('en'),available:false});
  assert.equal(saveState(blocked,freshState()),false);
  const broken={getItem(){return '{not json';}};assert.equal(loadState(broken,'zh').state.started,false);
});
test('save serialization round-trips in either language', () => {
  const data=new Map(), storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  for(const lang of ['zh','en']) {
    const s=freshState(lang);s.started=true;s.room='radio';s.phase='echo';s.radio=[4,8,2];addNote(s,'radio-b');
    assert.equal(saveState(storage,s),true);assert.ok(data.has(SAVE_KEY));assert.deepEqual(loadState(storage,'zh').state,s);
  }
});
test('journal rejects unknown notes and deduplicates evidence', () => {
  const s=freshState();assert.equal(addNote(s,'welcome'),true);assert.equal(addNote(s,'welcome'),false);assert.equal(addNote(s,'unknown'),false);assert.deepEqual(s.notes,['welcome']);
});
test('every visible phrase and clue has both Chinese and English text', () => {
  const pair=(value,label)=>{assert.equal(value.length,2,label);value.forEach(v=>assert.ok(typeof v==='string' && v.trim().length,label));};
  for(const [key,value] of Object.entries(words))pair(value,key);
  assert.deepEqual(Object.keys(notes).sort(),[...NOTE_IDS].sort());
  for(const [id,note]of Object.entries(notes)){pair(note.title,id);pair(note.body,id);assert.ok(ROOM_IDS.includes(note.room));}
  for(const [id,room]of Object.entries(rooms)){pair(room.name,id);pair(room.description,id);pair(room.sub,id);room.note.forEach(n=>assert.ok(notes[n]));}
  for(const symbol of Object.values(symbols))pair(symbol.name,symbol.glyph);
  for(const [id,levels]of Object.entries(hints)){assert.equal(levels.length,3);levels.forEach((value,i)=>{if(id!=='tide'||i!==2)pair(value,`${id}/${i}`);});}
});
test('literal interface translation keys resolve', async () => {
  const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  for(const match of source.matchAll(/\bt\('([A-Za-z][A-Za-z0-9]*)'\)/g))assert.ok(words[match[1]],`Missing word: ${match[1]}`);
});
test('all four scene files are local, real PNGs', async () => {
  for(const id of ROOM_IDS){const bytes=await readFile(new URL(`../assets/${id}.png`,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.length>10000);}
});
