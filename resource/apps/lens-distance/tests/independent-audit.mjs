// Public-specification-only arithmetic and observation audit. No production imports.
// No solver, stored solutions, route, or exported hypothetical transition function.
export const DOC_HASHES = Object.freeze({design:'8ed2f4a6c8ee443ece41b5ff17ac4fe6c1b4f9139e5f5e4282cfac4c22f23050',contract:'16a758da1a57369a16a642021268fb448d8e543ecffd68292f030ac1dd8036a9',interface:'852506c49aecd1a8ef4776a944fab4775b48a17aaeec6907eb827a499cc59fc2'});
const GAME='lens-distance',MAX=2147483647,TIME=86400;
const COUNTERS=['calls','railMoves','apertureChanges','selections','exposures','totalAdjustments','blockedActions'];
const DIRECTIONS=['none','up','down','left','right'];
const INITIAL_MESSAGE='左右移动透镜，B 切换屏幕；上下调光阑，A 曝光验收。';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
const number=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
const clone=v=>Array.isArray(v)?v.map(clone):object(v)?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clone(x)])):v;
function immutable(v){if(v&&typeof v==='object'){Object.values(v).forEach(immutable);Object.freeze(v);}return v;}
const card=(id,name,nameZh,objectX,lensMin,lensMax,screenMin,screenMax,startLens,startScreen,startAperture,sourcePower,brightnessMin,brightnessMax,adjustmentLimit)=>({id,name,nameZh,objectX,lensMin,lensMax,screenMin,screenMax,startLens,startScreen,startAperture,sourcePower,brightnessMin,brightnessMax,adjustmentLimit});
export const PUBLIC_CONFIG=immutable({defaultSeed:747,focalLength:4,objectHeight:3,railMin:0,railMax:36,apertureMin:1,apertureMax:6,exposureEnergy:4,maxElapsed:TIME,maxCounter:MAX,layouts:[
  {id:'brass-bench',name:'BRASS BENCH',nameZh:'黄铜光台',cards:[
    card('arrow-plate','ARROW PLATE','箭羽底片',2,4,12,14,26,5,24,2,160,32,52,24),
    card('leaf-plate','LEAF PLATE','叶片底片',6,8,13,20,32,10,30,6,288,40,60,24)]},
  {id:'long-bench',name:'LONG BENCH',nameZh:'长距光台',cards:[
    card('star-plate','STAR PLATE','星芒底片',1,8,13,15,25,8,25,1,100,30,45,22),
    card('key-plate','KEY PLATE','钥匙底片',7,9,14,21,34,10,29,2,256,32,48,22)]},
  {id:'precision-bench',name:'PRECISION BENCH',nameZh:'精密光台',cards:[
    card('petal-plate','PETAL PLATE','花瓣底片',4,6,16,20,21,8,21,6,128,24,36,16),
    card('spire-plate','SPIRE PLATE','塔尖底片',0,2,6,19,26,4,20,1,768,38,54,16)]}
]});
const getCard=s=>PUBLIC_CONFIG.layouts[s.level].cards[s.cardIndex];
// Integer predicates are independent of decimal display values. The geometric
// defocus is evaluated from the lens equation, including finite focal behavior.
function optics(c,L,S,a){
  const u=L-c.objectX,v=S-L,n=u-4,d=Math.abs(v*n-4*u),real=n>0;
  const q=n===0?null:4*u/n,blurNumerator=16*a*d+(a-1)**2*(4*u),blurDenominator=64*u;
  const brightnessNumerator=c.sourcePower*a*a,brightnessDenominator=v*v;
  const brightnessOk=c.brightnessMin*brightnessDenominator<=brightnessNumerator&&brightnessNumerator<=c.brightnessMax*brightnessDenominator;
  const clarityOk=real&&blurNumerator<=blurDenominator;
  return {u,v,imageKind:n===0?'focal':real?'real':'virtual',imageDistance:q,imageX:q===null?null:L+q,magnification:q===null?null:-q/u,defocusNumerator:d,blurNumerator,blurDenominator,blur:blurNumerator/blurDenominator,brightnessNumerator,brightnessDenominator,brightness:brightnessNumerator/brightnessDenominator,brightnessOk,clarityOk,canExpose:real&&clarityOk&&brightnessOk};
}
function loadCard(s){const c=getCard(s);Object.assign(s,{card:clone(c),objectX:c.objectX,lensX:c.startLens,screenX:c.startScreen,aperture:c.startAperture,selected:'lens',energy:4,adjustmentsUsed:0});refresh(s);}
function refresh(s){s.optics=optics(getCard(s),s.lensX,s.screenX,s.aperture);}
function initial(seed,level){
  const s={schema:1,seed:int(seed,0,4294967295)?seed:747,level:int(level,0,2)?level:0,phase:'playing',reason:'',score:0,cardIndex:0,completed:0,elapsed:0,elapsedCapped:false,exposureReceipts:[],terminalReceipt:null,counterSaturated:false,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],message:INITIAL_MESSAGE};
  COUNTERS.forEach(k=>s[k]=0);loadCard(s);return s;
}
const STATE_KEYS=Object.keys(initial(747,0));
const SETUP_KEYS=['objectX','lensX','screenX','aperture','selected'];
const RECEIPT_KEYS=['index','call','elapsed','cardIndex','cardId',...SETUP_KEYS,'optics','energyBefore','energyAfter','adjustmentsUsed','adjustmentLimit','matched','completedBefore','completedAfter','outcome'];
const TERMINAL_KEYS=['cause','call','elapsed','level','cardIndex','cardId','completed',...SETUP_KEYS,'optics','energy','adjustmentsUsed','adjustmentLimit','score','phase','reason'];
function terminal(s){return {cause:s.phase==='won'?'success':s.reason,call:s.calls,elapsed:s.elapsed,level:s.level,cardIndex:s.cardIndex,cardId:getCard(s).id,completed:s.completed,...Object.fromEntries(SETUP_KEYS.map(k=>[k,s[k]])),optics:clone(s.optics),energy:s.energy,adjustmentsUsed:s.adjustmentsUsed,adjustmentLimit:getCard(s).adjustmentLimit,score:s.score,phase:s.phase,reason:s.reason};}
const controlName=k=>({lens:'透镜',screen:'屏幕',aperture:'光阑'})[k];
function message(e){
  if(e.type==='select')return `已选择${controlName(e.to)}；左右移动，上下调光阑。`;
  if(e.type==='adjust')return `${controlName(e.control)}调至 ${e.to}；剩余 ${e.remaining} 次调整。`;
  if(e.type==='blocked')return `${controlName(e.control)}已到调节边界；不消耗次数。`;
  if(e.type==='reject')return `成像未通过；实像、清晰度和亮度须同时合格。剩余 ${e.energy} 次曝光电量。`;
  if(e.type==='advance')return '第一张底片已完成；第二张已重置，请重新调焦。';
  if(e.type==='win')return '两张底片均已清晰曝光，实验完成。';
  return e.reason==='energy'?'曝光电量耗尽，本次实验结束。':'超过本张底片的调整次数，本次实验结束。';
}
function report(scope){return {ok:true,scope,counts:{endpoints:0,fullPairs:0,sparseIntervals:0,declaredBoundaryGaps:0},findingCount:0,omittedFindings:0,findings:[],review:[]};}
function check(r,ok,path,rule){if(ok)return true;r.ok=false;r.findingCount++;if(r.findings.length<100)r.findings.push({path,rule});else r.omittedFindings++;return false;}
function eq(r,actual,expected,path){
  if(Object.is(actual,expected))return true;
  if(!actual||!expected||typeof actual!=='object'||typeof expected!=='object'||Array.isArray(actual)!==Array.isArray(expected))return check(r,false,path,'Value differs from public-rule arithmetic');
  let ok=check(r,Object.keys(actual).length===Object.keys(expected).length,path,'Exact canonical field count');
  for(const k of Object.keys(expected)){if(!check(r,own(actual,k),path+'/'+k,'Required canonical field')){ok=false;continue;}if(!eq(r,actual[k],expected[k],path+'/'+k))ok=false;}return ok;
}
function shape(r,value,keys,path,exact=true){if(!check(r,object(value),path,'Object required'))return false;let ok=!exact||check(r,Object.keys(value).length===keys.length,path,'Exact canonical field count');for(const k of keys)if(!check(r,own(value,k),path+'/'+k,'Required field'))ok=false;return ok;}
function guard(r,path,fn){try{return fn();}catch(e){check(r,false,path,'Malformed evidence: '+String(e?.message||e));return null;}}
function finiteTree(r,v,path,seen=new Set()){
  if(typeof v==='number')return check(r,Number.isFinite(v),path,'All numerical evidence is finite');
  if(v===null||typeof v==='string'||typeof v==='boolean')return true;
  if(!check(r,typeof v==='object'&&!seen.has(v),path,'JSON-compatible acyclic evidence'))return false;
  seen.add(v);for(const [k,x] of Object.entries(v))finiteTree(r,x,path+'/'+k,seen);seen.delete(v);return true;
}
function setup(r,s,c,path){
  eq(r,s.objectX,c.objectX,path+'/objectX');
  const ok=check(r,int(s.lensX,c.lensMin,c.lensMax),path+'/lensX','Immutable current-card lens bounds')&check(r,int(s.screenX,c.screenMin,c.screenMax),path+'/screenX','Immutable current-card screen bounds')&check(r,int(s.aperture,1,6),path+'/aperture','Aperture bounds');
  check(r,['lens','screen'].includes(s.selected),path+'/selected','Selected carriage');
  if(ok)eq(r,s.optics,optics(c,s.lensX,s.screenX,s.aperture),path+'/optics');
  const distance=Math.abs(s.lensX-c.startLens)+Math.abs(s.screenX-c.startScreen)+Math.abs(s.aperture-c.startAperture);
  check(r,int(s.adjustmentsUsed,distance,c.adjustmentLimit+1)&&(s.adjustmentsUsed-distance)%2===0,path+'/adjustmentsUsed','Applied unit changes require reachable distance and parity');
}
function receipts(r,s,path){
  if(!check(r,Array.isArray(s.exposureReceipts)&&s.exposureReceipts.length<=8,path+'/exposureReceipts','At most eight actual exposures'))return;
  let completed=0,energy=4,lastCall=0,lastElapsed=0,lastUsed=0,firstSuccess=null;
  for(let i=0;i<s.exposureReceipts.length;i++){
    const x=s.exposureReceipts[i],p=path+'/exposureReceipts/'+i;
    if(!shape(r,x,RECEIPT_KEYS,p))continue;
    const ci=Math.min(completed,1),c=PUBLIC_CONFIG.layouts[s.level].cards[ci];
    eq(r,x.index,i,p+'/index');eq(r,x.cardIndex,ci,p+'/cardIndex');eq(r,x.cardId,c.id,p+'/cardId');eq(r,x.completedBefore,completed,p+'/completedBefore');
    check(r,completed<2&&int(x.call,Math.min(MAX,lastCall+1),s.calls),p+'/call','Exposure calls increase until the admitted counter saturates');
    check(r,number(x.elapsed,lastElapsed,s.elapsed),p+'/elapsed','Nondecreasing bounded exposure time');setup(r,x,c,p);
    check(r,int(x.adjustmentsUsed,lastUsed,c.adjustmentLimit),p+'/adjustmentsUsed','Exposure cannot follow adjustment overrun or reverse adjustments');eq(r,x.adjustmentLimit,c.adjustmentLimit,p+'/adjustmentLimit');
    eq(r,x.energyBefore,energy,p+'/energyBefore');eq(r,x.energyAfter,energy-1,p+'/energyAfter');
    const matched=optics(c,x.lensX,x.screenX,x.aperture).canExpose;eq(r,x.matched,matched,p+'/matched');
    const outcome=matched?(ci===0?'advance':'won'):(energy===1?'lost':'reject');eq(r,x.outcome,outcome,p+'/outcome');
    completed+=matched?1:0;eq(r,x.completedAfter,completed,p+'/completedAfter');
    if(outcome==='won'||outcome==='lost')check(r,i===s.exposureReceipts.length-1,p,'Terminal exposure must be last');
    if(outcome==='advance'){firstSuccess=x;energy=4;lastUsed=0;}else{energy--;lastUsed=x.adjustmentsUsed;}
    lastCall=x.call;lastElapsed=x.elapsed;
  }
  eq(r,s.completed,completed,path+'/completed');eq(r,s.cardIndex,Math.min(completed,1),path+'/cardIndex');eq(r,s.energy,energy,path+'/energy');
  eq(r,s.exposures,s.exposureReceipts.length,path+'/exposures');check(r,s.adjustmentsUsed>=lastUsed,path+'/adjustmentsUsed','Current card retains exposure adjustment count');
  eq(r,s.totalAdjustments,(firstSuccess?.adjustmentsUsed??0)+s.adjustmentsUsed,path+'/totalAdjustments');
  const setups=firstSuccess?[firstSuccess,s]:[s];
  for(const [counter,axes] of [['railMoves',['lensX','screenX']],['apertureChanges',['aperture']]]){
    const distance=setups.reduce((sum,x)=>{const c=PUBLIC_CONFIG.layouts[s.level].cards[x.cardIndex];return sum+axes.reduce((n,k)=>n+Math.abs(x[k]-c[({lensX:'startLens',screenX:'startScreen',aperture:'startAperture'})[k]]),0);},0);
    check(r,s[counter]>=distance&&(s[counter]-distance)%2===0,path+'/'+counter,'Control-specific unit movement distance and parity');
  }
  const last=s.exposureReceipts.at(-1);
  if(last&&(last.outcome==='won'||last.outcome==='lost')){for(const k of [...SETUP_KEYS,'optics','adjustmentsUsed'])eq(r,s[k],last[k],path+'/'+k);eq(r,s.phase,last.outcome==='won'?'won':'lost',path+'/phase');}
}
function event(r,s,path){
  if(!check(r,Array.isArray(s.events)&&s.events.length<=1,path+'/events','At most one event per admitted call'))return;
  if(s.phase!=='playing')check(r,s.events.length===1&&s.events[0]?.type===(s.phase==='won'?'win':'collision')&&(s.phase==='won'||s.events[0]?.reason===s.reason),path+'/events','Terminal event remains intact through all later no-ops');
  if(!s.events.length){eq(r,s.lastCommand,'none',path+'/lastCommand');return;}
  const e=s.events[0],p=path+'/events/0',c=getCard(s),command=s.lastCommand;
  check(r,object(e),p,'Event object');eq(r,e.call,s.calls,p+'/call');check(r,s.calls>0,p+'/call','Event requires an admitted call');eq(r,s.message,message(e),path+'/message');
  const held=command==='a'?s.lastHeld.a:command==='b'?s.lastHeld.b:s.lastHeld.direction===command;check(r,command!=='none'&&held&&!s.cancelledLast&&s.inputArmed,path+'/lastCommand','Command matches an armed held edge');
  if(e.type==='select'){shape(r,e,['type','from','to','call'],p);eq(r,command,'b',path+'/lastCommand');eq(r,e.to,s.selected,p+'/to');eq(r,e.from,s.selected==='lens'?'screen':'lens',p+'/from');}
  else if(e.type==='adjust'||e.type==='blocked'||(e.type==='collision'&&e.reason==='adjustments')){
    const control=command==='up'||command==='down'?'aperture':s.selected,key=control==='aperture'?'aperture':control+'X',delta=command==='up'||command==='right'?1:-1;
    check(r,DIRECTIONS.slice(1).includes(command),path+'/lastCommand','Adjustment is directional');eq(r,e.control,control,p+'/control');
    if(e.type==='blocked'){shape(r,e,['type','reason','control','call'],p);eq(r,e.reason,'boundary',p+'/reason');const lo=control==='aperture'?1:c[control+'Min'],hi=control==='aperture'?6:c[control+'Max'];check(r,s[key]+delta<lo||s[key]+delta>hi,p,'Blocked candidate is beyond immutable bounds');}
    else{shape(r,e,e.type==='adjust'?['type','control','from','to','used','remaining','call']:['type','reason','control','from','to','call'],p);eq(r,e.to,s[key],p+'/to');eq(r,e.from,s[key]-delta,p+'/from');if(e.type==='adjust'){eq(r,e.used,s.adjustmentsUsed,p+'/used');eq(r,e.remaining,c.adjustmentLimit-s.adjustmentsUsed,p+'/remaining');eq(r,s.phase,'playing',path+'/phase');}else{eq(r,s.phase,'lost',path+'/phase');eq(r,s.reason,'adjustments',path+'/reason');}}
  }else{
    eq(r,command,'a',path+'/lastCommand');const last=s.exposureReceipts.at(-1);check(r,last?.call===s.calls,p,'Exposure event has current receipt');
    if(e.type==='reject'){shape(r,e,['type','cardIndex','energy','call'],p);eq(r,e.cardIndex,s.cardIndex,p+'/cardIndex');eq(r,e.energy,s.energy,p+'/energy');eq(r,last?.outcome,'reject',p+'/type');}
    else if(e.type==='advance'){shape(r,e,['type','fromCard','toCard','call'],p);eq(r,e.fromCard,0,p+'/fromCard');eq(r,e.toCard,1,p+'/toCard');eq(r,last?.outcome,'advance',p+'/type');const reset=clone(s);loadCard(reset);for(const k of ['card',...SETUP_KEYS,'optics','energy','adjustmentsUsed'])eq(r,s[k],reset[k],path+'/'+k);}
    else if(e.type==='win'){shape(r,e,['type','cardIndex','call'],p);eq(r,e.cardIndex,1,p+'/cardIndex');eq(r,last?.outcome,'won',p+'/type');}
    else{shape(r,e,['type','reason','call'],p);eq(r,e.type,'collision',p+'/type');eq(r,e.reason,'energy',p+'/reason');eq(r,last?.outcome,'lost',p+'/type');}
  }
}
function endpoint(r,s,path){
  r.counts.endpoints++;if(!shape(r,s,STATE_KEYS,path))return;finiteTree(r,s,path);
  if(!check(r,int(s.level,0,2)&&int(s.cardIndex,0,1),path,'Valid public layout/card identity'))return;
  const c=getCard(s);eq(r,s.schema,1,path+'/schema');check(r,int(s.seed,0,4294967295),path+'/seed','Normalized seed');eq(r,s.card,c,path+'/card');setup(r,s,c,path);
  COUNTERS.forEach(k=>check(r,int(s[k],0,MAX),path+'/'+k,'Bounded saturating counter'));
  for(const k of COUNTERS.slice(1))check(r,s[k]<=s.calls,path+'/'+k,'At most one increment per admitted call');
  eq(r,s.totalAdjustments,s.railMoves+s.apertureChanges,path+'/totalAdjustments');
  check(r,s.totalAdjustments+s.selections+s.exposures+s.blockedActions<=s.calls||s.calls===MAX,path,'Action categories use distinct calls before saturation');
  for(const k of ['elapsedCapped','counterSaturated','inputArmed','cancelledLast'])check(r,typeof s[k]==='boolean',path+'/'+k,'Boolean flag');
  check(r,number(s.elapsed,0,TIME),path+'/elapsed','Bounded finite active time');check(r,!s.elapsedCapped||s.elapsed===TIME,path+'/elapsedCapped','Sticky cap implies capped time');check(r,!s.counterSaturated||COUNTERS.some(k=>s[k]===MAX),path+'/counterSaturated','Overflow implies a saturated counter');
  check(r,s.cancelEpoch===null||Number.isSafeInteger(s.cancelEpoch)&&s.cancelEpoch>=0,path+'/cancelEpoch','Nullable nonnegative safe epoch');
  shape(r,s.lastHeld,['a','b','direction'],path+'/lastHeld');check(r,typeof s.lastHeld.a==='boolean'&&typeof s.lastHeld.b==='boolean'&&DIRECTIONS.includes(s.lastHeld.direction),path+'/lastHeld','Normalized held sample');
  check(r,['none','a','b',...DIRECTIONS.slice(1)].includes(s.lastCommand),path+'/lastCommand','Canonical command');check(r,!s.cancelledLast||!s.inputArmed,path+'/inputArmed','Cancellation edge disarms');check(r,typeof s.message==='string'&&s.message.length<=160,path+'/message','Bounded visible message');
  check(r,int(s.energy,0,4)&&int(s.adjustmentsUsed,0,c.adjustmentLimit+1),path,'Bounded independent resources');
  if(s.phase==='playing'){eq(r,s.reason,'',path+'/reason');check(r,s.energy>=1&&s.adjustmentsUsed<=c.adjustmentLimit,path,'Live resources permit play');eq(r,s.terminalReceipt,null,path+'/terminalReceipt');}
  else{check(r,['won','lost'].includes(s.phase),path+'/phase','Canonical phase');if(s.phase==='won'){eq(r,s.cardIndex,1,path+'/cardIndex');eq(r,s.completed,2,path+'/completed');eq(r,s.reason,'',path+'/reason');check(r,s.optics.canExpose&&s.adjustmentsUsed<=c.adjustmentLimit,path,'Winning exposure has both checks');}else if(s.reason==='energy'){eq(r,s.energy,0,path+'/energy');check(r,s.adjustmentsUsed<=c.adjustmentLimit,path,'Energy loss is not adjustment overrun');}else{eq(r,s.reason,'adjustments',path+'/reason');eq(r,s.adjustmentsUsed,c.adjustmentLimit+1,path+'/adjustmentsUsed');check(r,s.energy>=1,path+'/energy','Adjustment overrun spends no energy');}shape(r,s.terminalReceipt,TERMINAL_KEYS,path+'/terminalReceipt');eq(r,s.terminalReceipt,terminal(s),path+'/terminalReceipt');}
  eq(r,s.score,s.phase==='won'?100:0,path+'/score');eq(r,s.completed,s.phase==='won'?2:s.cardIndex,path+'/completed');
  receipts(r,s,path);event(r,s,path);if(s.calls===0)eq(r,s,initial(s.seed,s.level),path);
}
export function auditEndpoint(state){const r=report('public-endpoint');guard(r,'/state',()=>endpoint(r,state,'/state'));return r;}

// Own DATA descriptors are gathered atomically. One throwing descriptor discards
// all values; accessors and inherited values are never invoked or accepted.
function sample(input){
  let v=Object.create(null);try{if(input!==null&&typeof input==='object'&&!Array.isArray(input))for(const k of ['x','y','a','b','cancelEpoch','cancelled','paused']){const d=Object.getOwnPropertyDescriptor(input,k);if(d&&own(d,'value'))v[k]=d.value;}}catch{v=Object.create(null);}
  const axis=x=>typeof x==='number'&&Number.isFinite(x)?Math.max(-1,Math.min(1,x)):0,x=axis(v.x),y=axis(v.y),ax=Math.abs(x),ay=Math.abs(y);
  return {a:v.a===true,b:v.b===true,paused:v.paused===true,cancelled:v.cancelled===true,epoch:Number.isSafeInteger(v.cancelEpoch)&&v.cancelEpoch>=0?v.cancelEpoch:null,direction:ax<=.5&&ay<=.5?'none':ay>=ax?(y>0?'down':'up'):(x>0?'right':'left')};
}
function inc(s,k){if(s[k]===MAX)s.counterSaturated=true;else s[k]++;}
function command(s,key){
  const c=getCard(s),call=s.calls;let e;s.lastCommand=key;
  if(key==='b'){const from=s.selected;s.selected=from==='lens'?'screen':'lens';inc(s,'selections');e={type:'select',from,to:s.selected,call};}
  else if(key!=='a'){
    const control=key==='up'||key==='down'?'aperture':s.selected,k=control==='aperture'?'aperture':control+'X',from=s[k],to=from+(key==='up'||key==='right'?1:-1),lo=control==='aperture'?1:c[control+'Min'],hi=control==='aperture'?6:c[control+'Max'];
    if(to<lo||to>hi){inc(s,'blockedActions');e={type:'blocked',reason:'boundary',control,call};}
    else{s[k]=to;inc(s,control==='aperture'?'apertureChanges':'railMoves');inc(s,'totalAdjustments');s.adjustmentsUsed++;refresh(s);if(s.adjustmentsUsed>c.adjustmentLimit){s.phase='lost';s.reason='adjustments';e={type:'collision',reason:'adjustments',control,from,to,call};}else e={type:'adjust',control,from,to,used:s.adjustmentsUsed,remaining:c.adjustmentLimit-s.adjustmentsUsed,call};}
  }else{
    refresh(s);inc(s,'exposures');const matched=s.optics.canExpose,ci=s.cardIndex;
    const x={index:s.exposureReceipts.length,call,elapsed:s.elapsed,cardIndex:ci,cardId:c.id,...Object.fromEntries(SETUP_KEYS.map(k=>[k,s[k]])),optics:clone(s.optics),energyBefore:s.energy,energyAfter:s.energy-1,adjustmentsUsed:s.adjustmentsUsed,adjustmentLimit:c.adjustmentLimit,matched,completedBefore:s.completed,completedAfter:s.completed+(matched?1:0),outcome:matched?(ci===0?'advance':'won'):(s.energy===1?'lost':'reject')};
    s.energy--;s.completed=x.completedAfter;s.exposureReceipts.push(x);
    if(matched&&ci===0){s.cardIndex=1;loadCard(s);e={type:'advance',fromCard:0,toCard:1,call};}
    else if(matched){s.phase='won';s.reason='';s.score=100;e={type:'win',cardIndex:1,call};}
    else if(s.energy===0){s.phase='lost';s.reason='energy';e={type:'collision',reason:'energy',call};}
    else e={type:'reject',cardIndex:ci,energy:s.energy,call};
  }
  s.events=[e];s.message=message(e);if(s.phase!=='playing')s.terminalReceipt=terminal(s);
}
// This is deliberately private and only called for an actual supplied pair.
function expectedAfter(before,dt,input){
  const s=clone(before);if(s.phase!=='playing'||typeof dt!=='number'||!Number.isFinite(dt)||dt<=0||dt>.25)return s;
  const v=sample(input);if(v.paused)return s;const armed=s.inputArmed,held=clone(s.lastHeld),disarm=(v.epoch!==null&&s.cancelEpoch!==null&&v.epoch!==s.cancelEpoch)||(v.cancelled&&!s.cancelledLast);
  s.events=[];s.lastCommand='none';inc(s,'calls');const elapsed=s.elapsed+dt;if(elapsed>TIME)s.elapsedCapped=true;s.elapsed=Math.min(TIME,elapsed);
  if(disarm)s.inputArmed=false;if(v.epoch!==null)s.cancelEpoch=v.epoch;s.cancelledLast=v.cancelled;
  let key='none';if(!disarm&&!v.cancelled&&armed)key=v.b&&!held.b?'b':v.a&&!held.a?'a':v.direction!=='none'&&v.direction!==held.direction?v.direction:'none';
  if(!disarm&&!v.cancelled&&!v.a&&!v.b&&v.direction==='none')s.inputArmed=true;
  if(key!=='none')command(s,key);s.lastHeld={a:v.a,b:v.b,direction:v.direction};return s;
}
function pair(r,before,after,dt,input,path){endpoint(r,before,path+'/before');endpoint(r,after,path+'/after');eq(r,after,expectedAfter(before,dt,input),path+'/after');r.counts.fullPairs++;}
export function auditPair({before,after,dt,input}){const r=report('actual-before-after');guard(r,'/pair',()=>pair(r,before,after,dt,input,'/pair'));return r;}
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function hashes(r,v,path){check(r,object(v)&&Object.keys(v).length>0,path,'Retained original source hash map');}
function docHashes(r,v,path){for(const [k,d] of Object.entries(DOC_HASHES))eq(r,v?.['docs/'+({design:'public-design',contract:'model-contract',interface:'public-interface'}[k])+'.md'],d,path+'/'+k);}
function chronology(r,row,previous,path){check(r,timestamp(row.observedAt),path+'/observedAt','Actual UTC observation time');if(previous&&timestamp(previous.observedAt)&&Date.parse(row.observedAt)<Date.parse(previous.observedAt))r.review.push({path,status:'review-required',reason:'Actual wall clock moved backward; preserve and review clock correction'});}
export function auditFullRun(run){
  const r=report('complete-actual-pairs');guard(r,'/run',()=>{
    if(!shape(r,run,['schema','kind','runId','channel','sourceHashes','origin','calls','end'],'/run',false))return;
    eq(r,run.schema,1,'/run/schema');eq(r,run.kind,GAME+'-ordinary-run','/run/kind');eq(r,run.channel,'model','/run/channel');check(r,typeof run.runId==='string'&&run.runId.length>0,'/run/runId','Recorded identity');hashes(r,run.sourceHashes,'/run/sourceHashes');
    const o=run.origin;if(!shape(r,o,['kind','seed','level','state','publicConfig','completeCallCapture','inputRepresentation','sourceHashes','publicDocHashes','observedAt','clock'],'/run/origin',false))return;
    eq(r,o.kind,'create','/run/origin/kind');eq(r,o.completeCallCapture,true,'/run/origin/completeCallCapture');eq(r,o.publicConfig,PUBLIC_CONFIG,'/run/origin/publicConfig');eq(r,o.state,initial(o.seed,o.level),'/run/origin/state');eq(r,o.sourceHashes,run.sourceHashes,'/run/origin/sourceHashes');docHashes(r,o.publicDocHashes,'/run/origin/publicDocHashes');chronology(r,o,null,'/run/origin');
    check(r,typeof o.inputRepresentation==='string'&&o.inputRepresentation.length>0,'/run/origin/inputRepresentation','Faithful own-input representation declared');check(r,typeof o.clock==='string'&&o.clock.length>0||object(o.clock),'/run/origin/clock','Explicit actual monotonic clock');endpoint(r,o.state,'/run/origin/state');
    if(!check(r,Array.isArray(run.calls),'/run/calls','Complete actual invocation array'))return;let previous=o.state,time=o;
    run.calls.forEach((x,i)=>guard(r,'/run/calls/'+i,()=>{const p='/run/calls/'+i;if(!shape(r,x,['kind','seq','dt','input','before','after','observedAt','error'],p,false))return;eq(r,x.kind,'call',p+'/kind');eq(r,x.seq,i+1,p+'/seq');eq(r,x.error,null,p+'/error');chronology(r,x,time,p);eq(r,x.before,previous,p+'/before');pair(r,x.before,x.after,x.dt,x.input,p);previous=x.after;time=x;}));
    const e=run.end;if(shape(r,e,['kind','observedAt','outcome','reason','calls','complete','final','failure'],'/run/end',false)){eq(r,e.kind,'end','/run/end/kind');eq(r,e.complete,true,'/run/end/complete');eq(r,e.failure,null,'/run/end/failure');eq(r,e.calls,run.calls.length,'/run/end/calls');eq(r,e.final,previous,'/run/end/final');eq(r,e.outcome,e.final?.phase,'/run/end/outcome');eq(r,e.reason,e.final?.reason,'/run/end/reason');chronology(r,e,time,'/run/end');endpoint(r,e.final,'/run/end/final');}
  });return r;
}
export function auditSparseSegments(corpus){
  const r=report('sparse-public-endpoints');r.intervals=[];guard(r,'/corpus',()=>{
    if(!check(r,object(corpus),'/corpus','Public browser corpus'))return;eq(r,corpus.schema,1,'/corpus/schema');hashes(r,corpus.sourceHashes,'/corpus/sourceHashes');
    const projected=Array.isArray(corpus.segments),segments=projected?corpus.segments:[corpus];eq(r,corpus.kind,GAME+(projected?'-public-browser-segments':'-public-observations'),'/corpus/kind');check(r,segments.length>0,'/corpus/segments','At least one actual segment');const ids=new Set();
    segments.forEach((s,index)=>guard(r,'/corpus/segments/'+index,()=>{
      const p=projected?'/corpus/segments/'+index:'/corpus',id=s.segmentId??s.runId;check(r,typeof id==='string'&&id.length>0&&!ids.has(id),p+'/segmentId','Distinct retained source identity');ids.add(id);
      if(!check(r,Array.isArray(s.observations)&&s.observations.length>0,p+'/observations','Retained nonempty original observations'))return;check(r,Array.isArray(s.inputs),p+'/inputs','Original input metadata retained');
      if(projected)shape(r,s.parentContext,['clock','source','originalParent'],p+'/parentContext',false);else{eq(r,s.channel,'browser',p+'/channel');eq(r,s.calls,[],p+'/calls');docHashes(r,s.publicDocHashes,p+'/publicDocHashes');check(r,own(s,'clock'),p+'/clock','Original observation clock retained');}
      let previous=null,lastModel=null;
      s.observations.forEach((o,i)=>{
        const q=p+'/observations/'+i;guard(r,q,()=>{
          if(!shape(r,o,['seq','sourceObservationIndex','label','observedAt','readWindow','snapshot'],q,false))return;
          check(r,Number.isSafeInteger(o.seq)&&o.seq>=0&&Number.isSafeInteger(o.sourceObservationIndex)&&o.sourceObservationIndex>=0,q,'Original safe observation indices');chronology(r,o,previous,q);
          if(previous)check(r,o.seq>previous.seq&&o.sourceObservationIndex>previous.sourceObservationIndex,q,'Original indices increase within a segment');
          if(shape(r,o.readWindow,['start','end'],q+'/readWindow',false))check(r,number(o.readWindow.start,-Infinity,Infinity)&&number(o.readWindow.end,o.readWindow.start,Infinity),q+'/readWindow','Finite ordered original-clock read window');
          if(!shape(r,o.snapshot,['id','phase','paused','tick','elapsed','level','best','model','renderer','frameTimesMs','connection'],q+'/snapshot',false))return;eq(r,o.snapshot.id,GAME,q+'/snapshot/id');
          const m=o.snapshot.model;if(m!==null){endpoint(r,m,q+'/snapshot/model');if(lastModel){for(const k of ['seed','level'])eq(r,m[k],lastModel[k],q+'/snapshot/model/'+k);for(const k of [...COUNTERS,'elapsed','completed'])check(r,m[k]>=lastModel[k],q+'/snapshot/model/'+k,'Observed counter/identity decrease requires a segment boundary');}lastModel=m;}
        });
        if(previous){r.counts.sparseIntervals++;r.intervals.push({fromRef:p+'/observations/'+(i-1),toRef:q,continuity:'not-observed',inputAndGateTransitions:'review-required'});}previous=o;
      });
    }));
    const gaps=corpus.boundaryGaps??[];check(r,Array.isArray(gaps),'/corpus/boundaryGaps','Original declared boundary gaps');if(projected)check(r,gaps.length===Math.max(0,segments.length-1),'/corpus/boundaryGaps','One retained gap between adjacent segments');
    gaps.forEach((g,i)=>{const p='/corpus/boundaryGaps/'+i;check(r,object(g)&&g.intervalContinuity==='not-observed'&&g.lifecycle==='review-required',p,'No assumed continuity across source boundary');if(segments[i]&&segments[i+1]){eq(r,g.fromSegmentId,segments[i].segmentId??segments[i].runId,p+'/fromSegmentId');eq(r,g.toSegmentId,segments[i+1].segmentId??segments[i+1].runId,p+'/toSegmentId');}r.counts.declaredBoundaryGaps++;});
    check(r,r.counts.endpoints>0,'/corpus','At least one actual nonnull model endpoint');
  });return r;
}
