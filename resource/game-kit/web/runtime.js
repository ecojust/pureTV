/* Shared local runtime. Rules and art direction live in each game's assets. */
(function(root){
  'use strict';
  const def=root.GameDef, model=root.PureModel, $=id=>document.getElementById(id);
  if(!def||!model||!root.PureRenderer){$('dialog-title').textContent='游戏资源未就绪';$('dialog-copy').textContent='请重新打开应用。';return;}
  const native=root.PureGameHost, keys=new Set(), pulses={}, pendingActions={a:false,b:false};
  const renderer=new root.PureRenderer($('game'));
  let state=model.create(def.seed||1,0), phase='menu', paused=false, level=0, tick=0, elapsed=0;
  let last=0, lastUi=0, accumulator=0, endedRecorded=false, phoneSeen=false, disconnected=false;
  let previous={a:false,b:false,start:false,select:false}, info={}, soundEnabled=false, audio=null, disposed=false, nativePauseBefore=false, phoneConnected=false, menuStick=0;
  const frameTimes=[], soundQueue=new Set();
  let best=0;
  try{const n=Number(localStorage.getItem('puretv.'+def.id+'.best'));if(Number.isFinite(n)&&n>=0&&n<1e9)best=n;}catch(_){}
  document.title=def.title; $('title').textContent=def.title; $('tagline').textContent=def.tagline||'';
  $('move-help').textContent=def.controls.move; $('a-help').textContent=def.controls.a; $('b-help').textContent=def.controls.b;
  $('tip').textContent=def.tip; document.documentElement.style.setProperty('--accent',def.accent||'#6fe4d6');
  function resize(){const a=$('arena'),w=Math.max(1,Math.min(a.clientWidth-2,(a.clientHeight-2)*16/9));$('scene').style.width=w+'px';$('scene').style.height=w*9/16+'px';}
  root.addEventListener('resize',resize); resize();
  function syncInfo(value){
    if(value)info=value;
    const ready=!!(info.url&&info.qr);$('qr').hidden=!ready;$('qr-empty').hidden=ready;
    if(ready){$('qr').src=info.qr;$('room-address').textContent=String(info.url).replace(/\?.*$/,'');}
    else if(info.error)$('room-address').textContent=info.error;
  }
  try{if(native)syncInfo(JSON.parse(native.getInfo()));}catch(_){}
  function clearInput(){keys.clear();Object.keys(pulses).forEach(k=>delete pulses[k]);pendingActions.a=pendingActions.b=false;accumulator=0;}
  function start(){state=model.create(def.seed||1,level);phase='playing';paused=false;disconnected=false;tick=0;elapsed=0;last=0;accumulator=0;endedRecorded=false;clearInput();updateUi();}
  function setPaused(value){if(phase!=='playing')return;paused=!!value;clearInput();updateUi();}
  function togglePause(){if(phase==='playing')setPaused(!paused);else start();}
  function normalKey(name){const n=String(name);const lower=n.toLowerCase();const map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down',' ':'a',space:'a',spacebar:'a',z:'a',b:'b',x:'b',enter:'confirm',start:'start',p:'start',select:'select',shift:'select',r:'retry',escape:'start'};return map[lower]||null;}
  function key(name,down){
    const action=normalKey(name);if(!action)return false;
    if(down){if(!keys.has(action))pulses[action]=true;keys.add(action);}else keys.delete(action);return true;
  }
  function unlock(){if(!audio&&soundEnabled){try{audio=new(root.AudioContext||root.webkitAudioContext)();}catch(_){}}if(audio&&audio.state==='suspended')audio.resume().catch(()=>{});}
  root.addEventListener('keydown',e=>{if(key(e.key,true)){e.preventDefault();unlock();}});
  root.addEventListener('keyup',e=>{if(key(e.key,false))e.preventDefault();});
  root.addEventListener('blur',()=>{if(phase==='playing')setPaused(true);else clearInput();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')setPaused(true);});
  document.addEventListener('contextmenu',e=>e.preventDefault());
  $('primary').onclick=()=>{unlock();if(paused)setPaused(false);else start();};
  $('pause-button').onclick=togglePause;
  function toggleSound(){soundEnabled=!soundEnabled;$('sound-button').textContent='声音：'+(soundEnabled?'开':'关');$('sound-button').setAttribute('aria-pressed',String(soundEnabled));unlock();}
  $('sound-button').onclick=toggleSound;
  function chooseLevel(value){level=(value+3)%3;document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.level)===level));if(phase==='menu')state=model.create(def.seed||1,level);updateUi();}
  document.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>chooseLevel(Number(button.dataset.level)));
  function inputs(){
    let player=null;
    try{if(native){const room=JSON.parse(native.snapshot());player=(room.players||[]).find(p=>p.connected);}}catch(_){}
    phoneConnected=!!player;
    if(player){phoneSeen=true;disconnected=false;}
    else if(phoneSeen&&!disconnected){disconnected=true;if(phase==='playing')setPaused(true);}
    const localX=Number(keys.has('right'))-Number(keys.has('left')),localY=Number(keys.has('down'))-Number(keys.has('up'));
    const val={x:localX||(Number(player&&player.x)||0),y:localY||(Number(player&&player.y)||0),a:keys.has('a')||!!(player&&player.a),b:keys.has('b')||!!(player&&player.b),start:keys.has('start')||!!(player&&player.start),select:keys.has('select')||!!(player&&player.select)};
    const length=Math.hypot(val.x,val.y);if(length>1){val.x/=length;val.y/=length;}
    ['a','b','start','select'].forEach(k=>{val[k+'Pressed']=!!pulses[k]||(val[k]&&!previous[k]);previous[k]=val[k];});
    const horizontal=player&&Math.abs(Number(player.x)||0)>.6?Math.sign(player.x):0;
    val.menuDelta=(pulses.right?1:0)-(pulses.left?1:0)||(horizontal&&horizontal!==menuStick?horizontal:0);menuStick=horizontal;
    val.confirm=!!pulses.confirm;val.retry=!!pulses.retry;
    if(player&&val.selectPressed)val.retry=true;
    Object.keys(pulses).forEach(k=>delete pulses[k]);
    return val;
  }
  function beep(type){if(!soundEnabled||!audio||audio.state!=='running')return;try{const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;const tones={pickup:660,delivery:880,delivered:880,collision:150,win:1040,refuel:440};osc.type='sine';osc.frequency.setValueAtTime(tones[type]||520,now);gain.gain.setValueAtTime(.04,now);gain.gain.exponentialRampToValueAtTime(.001,now+.14);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.15);}catch(_){} }
  function updateUi(){
    $('connection').textContent=phoneConnected?'手机手柄已连接':disconnected?'手柄已断开 · 已暂停':'遥控器 / 键盘可直接游玩';
    $('room-status').textContent=phoneConnected?'CONNECTED':'LOCAL';
    const stats=def.hud(state);const hud=$('hud');
    if(hud.children.length!==stats.length){hud.textContent='';stats.forEach(()=>{const el=document.createElement('div');el.className='stat';const label=document.createElement('div'),value=document.createElement('div');label.className='stat-label';value.className='stat-value';el.append(label,value);hud.append(el);});}
    stats.forEach((item,i)=>{const el=hud.children[i];el.children[0].textContent=item.label;el.children[1].textContent=item.value;el.dataset.tone=item.tone||'';});
    $('message').textContent=disconnected?'手柄断开后已自动暂停，重新连接或按 P 继续。':(state.message||def.tip);
    $('best').textContent='最佳 '+Math.floor(best);$('pause-button').textContent=paused?'继续 P':'暂停 P';$('pause-button').disabled=phase!=='playing';
    const show=phase!=='playing'||paused;$('overlay').hidden=!show;
    if(show){const won=phase==='won',lost=phase==='lost';$('dialog-kicker').textContent=paused?'休息一下':won?'任务完成':lost?'再试一次':'PURETV ORIGINALS';$('dialog-title').textContent=paused?'已暂停':won?(def.winTitle||'任务完成'):lost?(def.loseTitle||'本次任务结束'):def.title;$('dialog-copy').textContent=paused?'场景与计时已暂停。继续后从当前位置出发。':(won||lost)?def.result(state):def.description;$('primary').textContent=paused?'继续游戏 · P':(won||lost)?'再次出发 · ENTER':'开始游戏 · ENTER';$('difficulty-controls').hidden=paused;$('dialog-help').textContent=paused?'手机 START / 遥控器播放键继续':'左右选择航线 · B 切换声音 · START / 确认开始';}
    if(native){try{native.publish(JSON.stringify({title:def.title,phase:paused?'paused':phase,score:state.score||0,message:state.message||'',actions:def.actionLabels||['操作 A','操作 B']}));}catch(_){}}
  }
  function frame(now){
    if(disposed)return;
    const delta=last?Math.min(.1,Math.max(0,(now-last)/1000)):0;if(last&&delta>0) {frameTimes.push((now-last));if(frameTimes.length>300)frameTimes.shift();}last=now;
    const input=inputs();
    if(phase!=='playing'&&input.menuDelta)chooseLevel(level+input.menuDelta);
    if(phase!=='playing'&&input.bPressed)toggleSound();
    if(input.retry)start();
    else if(input.startPressed||(input.confirm&&phase!=='playing')){if(phase==='playing')setPaused(!paused);else start();}
    else if(input.confirm){if(paused)setPaused(false);else{input.a=true;input.aPressed=true;}}
    if(phase==='playing'&&!paused){
      pendingActions.a=pendingActions.a||input.aPressed;pendingActions.b=pendingActions.b||input.bPressed;
      input.aPressed=pendingActions.a;input.bPressed=pendingActions.b;
      accumulator+=delta;let steps=0;
      while(accumulator>=1/60&&steps<6){model.step(state,1/60,input);tick++;elapsed+=1/60;accumulator-=1/60;steps++;input.aPressed=false;input.bPressed=false;pendingActions.a=pendingActions.b=false;(state.events||[]).forEach(e=>soundQueue.add(e.type));if(state.phase==='won'||state.phase==='lost'){phase=state.phase;accumulator=0;break;}}
      if(phase!=='playing'&&!endedRecorded){endedRecorded=true;const score=Number(state.score)||0;if(score>best){best=score;try{localStorage.setItem('puretv.'+def.id+'.best',String(Math.floor(best)));}catch(_){}}updateUi();}
    }else accumulator=0;
    if(soundQueue.size){beep(soundQueue.values().next().value);soundQueue.clear();}
    renderer.begin(def.background||'#081124');def.render(renderer,state,elapsed,input);renderer.end();
    if(now-lastUi>100){lastUi=now;updateUi();}
    root.requestAnimationFrame(frame);
  }
  root.PureGame=Object.freeze({key,suspend(value){if(value){nativePauseBefore=paused;setPaused(true);}else{clearInput();if(!nativePauseBefore)setPaused(false);}},roomInfo(value){syncInfo(value);},networkChanged(value){syncInfo(value);if(phase==='playing')setPaused(true);}});
  root.PureTVQA=Object.freeze({snapshot(){return JSON.parse(JSON.stringify({id:def.id,phase,paused,tick,elapsed,level,best,model:state,renderer:renderer.metrics||{},frameTimesMs:frameTimes.slice(),connection:{phoneSeen,disconnected}}));}});
  $('game').addEventListener('webglcontextlost',()=>setPaused(true));
  root.addEventListener('pagehide',()=>{disposed=true;clearInput();if(renderer.dispose)renderer.dispose();if(audio)audio.close().catch(()=>{});});
  updateUi();root.requestAnimationFrame(frame);
})(window);
