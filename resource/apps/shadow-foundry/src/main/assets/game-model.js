/* Shadow Foundry: public integer projection rules; no solver or fixture API. */
(function (root) {
  'use strict';
  function frozen(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(frozen);
      Object.freeze(value);
    }
    return value;
  }
  const config = frozen({
    defaultSeed:742, boardMin:-6, boardMax:6, focusNames:['WORK','LIGHT'],
    lampNames:['E','SE','S','SW','W','NW','N','NE'],
    lampVectors:[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],
    maxCounter:2147483647, maxElapsed:3600,
    tasks:[
      {id:'west-cast',name:'WEST CAST',nameZh:'西光落影',pivot:[0,0],
        prisms:[{center:[0,0],height:3},{center:[1,0],height:1},{center:[1,1],height:2}],
        initialYaw:2,initialLamp:0,footPrism:2,lightPrism:0,guideFoot:[1,1],guideTip:[3,0],
        targetCells:[[0,0],[1,0],[2,0],[3,0],[1,1],[2,1],[3,1]],
        forbiddenCells:[[0,-1],[1,-1],[2,-1],[3,-1],[-3,0],[-2,0],[-1,0]],
        requiredTargetHits:7,maxForbiddenHits:0,budget:12},
      {id:'north-cast',name:'NORTH CAST',nameZh:'北光长脊',pivot:[-1,0],
        prisms:[{center:[0,0],height:2},{center:[1,0],height:3},{center:[0,1],height:1}],
        initialYaw:3,initialLamp:2,footPrism:2,lightPrism:1,guideFoot:[-2,0],guideTip:[-1,4],
        targetCells:[[-2,0],[-1,0],[-2,1],[-1,1],[-1,2],[-1,3],[-1,4]],
        forbiddenCells:[[-3,-1],[-2,-1],[-1,-1],[0,0],[0,1],[0,2]],
        requiredTargetHits:7,maxForbiddenHits:0,budget:12},
      {id:'diagonal-pour',name:'DIAGONAL POUR',nameZh:'斜光交叠',pivot:[0,1],
        prisms:[{center:[0,0],height:3},{center:[1,0],height:1},{center:[1,1],height:2}],
        initialYaw:1,initialLamp:7,footPrism:2,lightPrism:0,guideFoot:[1,0],guideTip:[3,-2],
        targetCells:[[2,-2],[3,-2],[0,-1],[1,-1],[2,-1],[3,-1],[0,0],[1,0],[2,0],[0,1],[1,1]],
        forbiddenCells:[[-2,1],[-1,1],[-2,2],[-1,2],[0,2],[1,2]],
        requiredTargetHits:11,maxForbiddenHits:0,budget:12}
    ]
  });

  function cross(a,b,p) { return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]); }
  function hull(points) {
    const sorted=points.sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
    const unique=sorted.filter((p,i)=>i===0 || p[0]!==sorted[i-1][0] || p[1]!==sorted[i-1][1]);
    const lower=[], upper=[];
    for (const p of unique) {
      while (lower.length>=2 && cross(lower[lower.length-2],lower[lower.length-1],p)<=0) lower.pop();
      lower.push(p);
    }
    for (let i=unique.length-1;i>=0;i--) {
      const p=unique[i];
      while (upper.length>=2 && cross(upper[upper.length-2],upper[upper.length-1],p)<=0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }
  function contains(polygon,point) {
    return polygon.every((p,i)=>cross(p,polygon[(i+1)%polygon.length],point)>=0);
  }
  function project(level,yaw,lamp) {
    const task=config.tasks[level], vector=config.lampVectors[lamp];
    const prisms=task.prisms.map(prism=>{
      let [x,y]=prism.center;
      for (let turn=0;turn<yaw;turn++) [x,y]=[-y,x];
      x+=task.pivot[0]; y+=task.pivot[1];
      const footprint2=[[2*x-1,2*y-1],[2*x+1,2*y-1],[2*x+1,2*y+1],[2*x-1,2*y+1]];
      const vertices2=footprint2.map(p=>[p[0],p[1],0])
        .concat(footprint2.map(p=>[p[0],p[1],2*prism.height]));
      return {center:[x,y],height:prism.height,footprint2,vertices2};
    });
    const shadowHulls2=prisms.map(prism=>hull(prism.footprint2.map(p=>p.slice())
      .concat(prism.footprint2.map(p=>[p[0]-2*prism.height*vector[0],p[1]-2*prism.height*vector[1]]))));
    const shadowMask=[], coveredCells=[];
    for (let y=config.boardMin;y<=config.boardMax;y++) for (let x=config.boardMin;x<=config.boardMax;x++) {
      const covered=shadowHulls2.some(polygon=>contains(polygon,[2*x,2*y]));
      shadowMask.push(covered);
      if (covered) coveredCells.push([x,y]);
    }
    const hits=cells=>cells.filter(p=>shadowMask[(p[1]+6)*13+(p[0]+6)]).map(p=>p.slice());
    const targetHitCells=hits(task.targetCells), forbiddenHitCells=hits(task.forbiddenCells);
    const targetHits=targetHitCells.length, forbiddenHits=forbiddenHitCells.length;
    const targetPassed=targetHits>=task.requiredTargetHits, forbiddenPassed=forbiddenHits<=task.maxForbiddenHits;
    const lightCenter=prisms[task.lightPrism].center.slice(), lightHeight=prisms[task.lightPrism].height;
    return {prisms,shadowHulls2,shadowMask,coveredCells,targetHitCells,forbiddenHitCells,
      targetHits,forbiddenHits,shadowCells:coveredCells.length,targetPassed,forbiddenPassed,
      matched:targetPassed&&forbiddenPassed,lightVector:vector.slice(),
      lightRay:[vector[0]===0?0:-vector[0],vector[1]===0?0:-vector[1],-1],
      footPoint:prisms[task.footPrism].center.slice(),lightCenter,lightHeight,
      tipPoint:[lightCenter[0]-lightHeight*vector[0],lightCenter[1]-lightHeight*vector[1]]};
  }

  function create(seed,level) {
    seed=Number.isInteger(seed)&&seed>=0&&seed<=4294967295?seed:config.defaultSeed;
    level=Number.isInteger(level)&&level>=0&&level<3?level:0;
    const task=config.tasks[level], yaw=task.initialYaw, lamp=task.initialLamp;
    return {schema:1,seed,level,phase:'playing',reason:'',score:0,yaw,lamp,focus:0,
      geometry:project(level,yaw,lamp),adjustmentsUsed:0,workRotations:0,lightRotations:0,adjustments:[],
      calls:0,focusChanges:0,elapsed:0,counterSaturated:false,clockSaturated:false,
      inputArmed:false,cancelEpoch:null,cancelledLast:false,
      lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],
      message:'选择工件或灯光，A 顺时针，B 逆时针；覆盖目标并避开禁区。'};
  }
  function normalized(input) {
    let data={};
    try {
      if (input!==null && typeof input==='object' && !Array.isArray(input)) {
        for (const key of ['x','y','a','b','cancelled','paused','cancelEpoch']) {
          const descriptor=Object.getOwnPropertyDescriptor(input,key);
          if (descriptor && Object.prototype.hasOwnProperty.call(descriptor,'value')) data[key]=descriptor.value;
        }
      }
    } catch (_) { data={}; }
    const axis=key=>Number.isFinite(data[key])?Math.max(-1,Math.min(1,data[key])):0;
    const x=axis('x'), y=axis('y'), ax=Math.abs(x), ay=Math.abs(y);
    let direction='none';
    if (ax>0.5 || ay>0.5) direction=ay>=ax?(y>0?'down':'up'):(x>0?'right':'left');
    return {a:data.a===true,b:data.b===true,cancelled:data.cancelled===true,paused:data.paused===true,
      direction,epoch:Number.isSafeInteger(data.cancelEpoch)&&data.cancelEpoch>=0?data.cancelEpoch:null};
  }
  function increment(state,key) {
    const next=state[key]+1;
    if (next>config.maxCounter) state.counterSaturated=true;
    state[key]=Math.min(config.maxCounter,next);
  }
  function emit(state,event) { state.events=[Object.assign(event,{call:state.calls})]; }
  function rotate(state,turn) {
    const task=config.tasks[state.level], from={yaw:state.yaw,lamp:state.lamp};
    if (state.focus===0) { state.yaw=(state.yaw+turn+4)%4; state.workRotations++; }
    else { state.lamp=(state.lamp+turn+8)%8; state.lightRotations++; }
    state.adjustmentsUsed++;
    state.geometry=project(state.level,state.yaw,state.lamp);
    const g=state.geometry, remaining=task.budget-state.adjustmentsUsed;
    if (g.matched) {
      state.phase='won'; state.reason=''; state.score=100;
      state.message='目标全部覆盖，禁区没有侵入，铸影完成。'; emit(state,{type:'win'});
    } else if (remaining===0) {
      state.phase='lost'; state.reason='budget'; state.score=0;
      state.message='十二次调整已耗尽，目标或禁区仍不合格，请重试。'; emit(state,{type:'collision',reason:'budget'});
    } else {
      state.message='目标 '+g.targetHits+'/'+task.requiredTargetHits+'，禁区 '+g.forbiddenHits+'/'+task.maxForbiddenHits+'，剩余调整 '+remaining+'。';
      emit(state,{type:'rotate',focus:state.focus,turn});
    }
    state.adjustments.push({index:state.adjustments.length,call:state.calls,elapsed:state.elapsed,
      focus:state.focus,turn,from,to:{yaw:state.yaw,lamp:state.lamp},targetHits:g.targetHits,
      forbiddenHits:g.forbiddenHits,shadowCells:g.shadowCells,matched:g.matched,remaining,phase:state.phase});
  }
  function step(state,dt,input) {
    if (state.phase!=='playing' || !Number.isFinite(dt) || dt<=0 || dt>0.25) return state;
    const sample=normalized(input);
    if (sample.paused) return state;
    state.events=[]; state.lastCommand='none'; increment(state,'calls');
    const nextElapsed=state.elapsed+dt;
    if (nextElapsed>config.maxElapsed) state.clockSaturated=true;
    state.elapsed=Math.min(config.maxElapsed,nextElapsed);
    if ((sample.epoch!==null && state.cancelEpoch!==null && sample.epoch!==state.cancelEpoch) ||
        (sample.cancelled && !state.cancelledLast)) state.inputArmed=false;
    if (sample.epoch!==null) state.cancelEpoch=sample.epoch;
    state.cancelledLast=sample.cancelled;
    let command='none';
    if (state.inputArmed && !sample.cancelled) {
      if (sample.b && !state.lastHeld.b) command='b';
      else if (sample.a && !state.lastHeld.a) command='a';
      else if (sample.direction!=='none' && sample.direction!==state.lastHeld.direction) command=sample.direction;
    }
    state.lastHeld={a:sample.a,b:sample.b,direction:sample.direction};
    if (!sample.cancelled && !sample.a && !sample.b && sample.direction==='none') state.inputArmed=true;
    state.lastCommand=command;
    if (command==='a' || command==='b') rotate(state,command==='a'?1:-1);
    else if (command!=='none') {
      const focus=command==='up'||command==='left'?0:1;
      if (focus!==state.focus) { state.focus=focus; increment(state,'focusChanges'); emit(state,{type:'focus',focus}); }
      state.message='已选择'+(focus===0?'工件':'灯光')+'；A 顺时针，B 逆时针。';
    }
    return state;
  }
  const api=Object.freeze({create,step,config});
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.PureModel=api;
})(typeof globalThis==='object'?globalThis:this);
