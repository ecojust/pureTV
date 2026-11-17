'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=require('./reference.cjs');
const app=path.resolve(__dirname,'..'),M=require('../src/main/assets/game-model.js');
const checked=[];function check(name,fn){fn();checked.push(name);}
const step=(s,input={})=>M.step(s,1/60,input);
function tap(s,input){step(s);step(s,input);}
function navigate(s,target){while(s.cursor!==target){const r=Math.floor(s.cursor/6),c=s.cursor%6,tr=Math.floor(target/6),tc=target%6;tap(s,r!==tr?{y:r<tr?1:-1}:{x:c<tc?1:-1});}}
function observe(s){assert.deepEqual(s.counts,R.counts(s.board));assert.deepEqual(s.legalMoves,R.legal(s.board,1).map(m=>m.cell));assert.equal(s.board.length,36);assert.ok(s.board.every(v=>v===0||v===1||v===2));}
function act(s,cell){const before=s.board.slice(),p=s.playerMoves,a=s.aiMoves,passes=s.playerPasses;const expected=R.round(before,cell);if(cell!==null)navigate(s,cell);tap(s,cell===null?{b:true}:{a:true});assert.deepEqual(s.board,expected.board,'Actual human/AI transition matches independently derived bracket lines');assert.equal(s.playerMoves-p,cell===null?0:1);assert.equal(s.playerPasses-passes,cell===null?1:0);assert.equal(s.aiMoves-a,expected.ai?1:0);observe(s);return expected;}
const outcomes=[];
check('hand-authored eight-direction and row-edge reference cases',()=>{
 const b=Array(36).fill(0);for(const dr of [-1,0,1])for(const dc of [-1,0,1])if(dr||dc){b[(2+dr)*6+2+dc]=2;b[(2+2*dr)*6+2+2*dc]=1;}
 assert.equal(R.flips(b,14,1).length,8);assert.equal(R.counts(R.place(b,14,1)).player,17);
 const edge=Array(36).fill(0);edge[6]=2;edge[7]=1;assert.deepEqual(R.flips(edge,5,1),[],'Row edge must not wrap');
});
check('independent exact search and ordinary input replay win all three authored boards',()=>{
 for(let level=0;level<3;level++){
  const s=M.create(751,level);step(s);observe(s);const plan=R.route(s.board),loss=R.route(s.board,'min');assert.ok(plan.margin>0);assert.ok(loss.margin<0,'Each puzzle must permit meaningful losing choices');let aiPasses=0;
  for(const command of plan.steps)if(act(s,command.cell).aiPass)aiPasses++;
  assert.equal(s.phase,'won');assert.equal(s.score,100);assert.equal(s.counts.player-s.counts.opponent,plan.margin);assert.ok(aiPasses>0);assert.ok(s.aiPasses>0);
  const terminal=JSON.stringify(s);step(s,{a:true,b:true,x:1});assert.equal(JSON.stringify(s),terminal);
  outcomes.push({level,maximumMargin:plan.margin,minimumMargin:loss.margin,searchedPositions:plan.states,playerCommands:plan.steps.length,aiPasses,phase:s.phase,counts:s.counts});
 }
});
check('ordinary intentionally poor legal choices lose without forced state mutation',()=>{
 const s=M.create(751,0);step(s);const plan=R.route(s.board,'min');for(const command of plan.steps)act(s,command.cell);assert.equal(s.phase,'lost');assert.equal(s.reason,'opponent');assert.equal(s.counts.player-s.counts.opponent,plan.margin);assert.equal(s.score,0);
 const final=JSON.stringify(s);step(s,{b:true});assert.equal(JSON.stringify(s),final);
});
let passEvidence;
check('natural forced player pass invokes the actual deterministic opponent reply',()=>{
 const s=M.create(751,1);step(s);const found=R.passRoute(s.board);assert.ok(found.cells);for(const cell of found.cells)act(s,cell);
 assert.ok(s.playerPasses>0);passEvidence={level:1,commands:found.cells,playerPasses:s.playerPasses,aiMoves:s.aiMoves,counts:s.counts};
});
const sourceSha256={};for(const f of ['src/main/assets/game-model.js','tests/reference.cjs','tests/independent-check.cjs'])sourceSha256[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(app,f))).digest('hex');
const report={passed:true,method:'Independent 6x6 bracket rules and exhaustive player-choice search against the documented deterministic greedy opponent. No production model imported for planning; completed paths replayed through ordinary create/step inputs.',checks:checked,layouts:outcomes,playerPass:passEvidence,sourceSha256,physicalTvTested:false,physicalPhoneTested:false};
if(process.argv.includes('--write-report'))fs.writeFileSync(path.join(app,'docs/independent-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
