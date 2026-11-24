import { RushRenderer } from './world.mjs';
import { makeTrack, TRACKS } from './tracks.mjs';
import { RushAudio } from './audio.mjs';

const root=window;
let savedLanguage='';
try{savedLanguage=localStorage.getItem('neon-rush.language')||'';}catch{}
let nativeLanguage='';
try{if(root.PureGameHost)nativeLanguage=JSON.parse(root.PureGameHost.getInfo()).language||'';}catch{}
const english=(new URLSearchParams(location.search).get('lang')||savedLanguage||nativeLanguage)==='en';
const text=(zh,en)=>english?en:zh;
const audio=new RushAudio();
const $=id=>document.getElementById(id);
let installed=false,renderFailure='',lastMapTrack='',mapTrack=null;
const heldPointers=new Map(),heldAliases=new Map();
const seconds=value=>{const n=Math.max(0,Number(value)||0);return String(Math.floor(n/60)).padStart(2,'0')+':'+(n%60).toFixed(1).padStart(4,'0');};
const controllerKey={left:'ArrowLeft',right:'ArrowRight',brake:'ArrowDown',drift:' ',nitro:'b'};
function send(name,down){if(root.PureGame)root.PureGame.key(name,down);}
function clearExtras(){for(const name of new Set([...heldPointers.values(),...heldAliases.values()]))send(name,false);heldPointers.clear();heldAliases.clear();document.querySelectorAll('[data-rush-control]').forEach(b=>b.classList.remove('pressed'));audio.silence();}
function install(){
  if(installed)return;installed=true;
  document.documentElement.lang=english?'en':'zh-CN';
  document.body.classList.toggle('rush-native',!!root.PureGameHost);
  document.querySelector('.brand-mark').textContent='NR';
  document.querySelector('header .eyebrow').textContent='PURETV RACING CLUB';
  document.querySelector('footer > span').textContent=text('桔子桑 · 原创竞速','ecojust · Original racing');
  const phone=document.createElement('button');phone.id='rush-phone-button';phone.type='button';phone.hidden=!!root.PureGameHost;phone.textContent=text('连接手柄','Controllers');phone.setAttribute('aria-expanded','false');phone.onclick=()=>{const open=document.body.classList.toggle('rush-phone-open');phone.setAttribute('aria-expanded',String(open));};document.querySelector('.top-actions').prepend(phone);
  document.querySelector('.side-heading .eyebrow').textContent=text('扫码手柄','SCAN TO CONNECT');
  const wifi=document.createElement('section');wifi.id='rush-wifi-help';wifi.innerHTML='<strong>'+text('Wi-Fi 实体手柄','Wi-Fi CONTROLLER')+'</strong><p id="rush-wifi-status"></p>';document.querySelector('aside').insertBefore(wifi,document.querySelector('aside .divider'));
  const lang=document.createElement('button');lang.id='rush-language-button';lang.type='button';lang.textContent=english?'中文':'EN';lang.setAttribute('aria-label',text('切换英文','Switch to Chinese'));lang.onclick=()=>{clearExtras();const next=english?'zh':'en';try{localStorage.setItem('neon-rush.language',next);}catch{}if(root.PureGameHost){location.reload();return;}const url=new URL(location.href);url.searchParams.set('lang',next);location.href=url.href;};document.querySelector('.top-actions').append(lang);
  const dashboard=document.createElement('div');dashboard.id='rush-dashboard';dashboard.innerHTML='<canvas id="rush-map" width="160" height="110" aria-label="'+text('赛道小地图','Track minimap')+'"></canvas><div id="rush-countdown" hidden></div><div id="rush-feedback"></div><div id="rush-meters"><div class="rush-meter-label"><span>'+text('氮气储备','NITRO')+'</span><span id="rush-nitro-text"></span></div><div class="rush-meter-track"><i id="rush-nitro-fill"></i></div><div class="rush-meter-label rush-drift-label"><span>'+text('漂移蓄力','DRIFT CHARGE')+'</span><span id="rush-drift-text"></span></div><div class="rush-meter-track rush-drift-track"><i id="rush-drift-fill"></i></div></div>';
  $('scene').insertBefore(dashboard,$('overlay'));
  const touch=document.createElement('div');touch.id='rush-touch';
  const labels={left:'◀',right:'▶',brake:text('刹车','BRAKE'),drift:text('漂移','DRIFT'),nitro:text('氮气','NITRO')};
  for(const name of Object.keys(controllerKey)){
    const b=document.createElement('button');b.type='button';b.dataset.rushControl=name;b.textContent=labels[name];b.setAttribute('aria-label',labels[name]);
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button!==0&&e.pointerType==='mouse')return;b.setPointerCapture(e.pointerId);const key=controllerKey[name];heldPointers.set(e.pointerId,key);b.classList.add('pressed');send(key,true);audio.unlock();});
    const release=e=>{const key=heldPointers.get(e.pointerId);if(!key)return;if(e.type!=='pointerup'){if(root.PureGame)root.PureGame.suspend(true);clearExtras();return;}heldPointers.delete(e.pointerId);if(![...heldPointers.values()].includes(key)&&![...heldAliases.values()].includes(key))send(key,false);if(![...heldPointers.values()].includes(controllerKey[name]))b.classList.remove('pressed');};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,release);touch.append(b);
  }
  $('scene').append(touch);
  const touchMode=()=>document.body.classList.toggle('rush-touch',matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).has('touch'));
  touchMode();root.addEventListener('resize',touchMode);
  root.addEventListener('keydown',e=>{
    let key=null;if(e.key==='Shift')key=' ';else if(e.key==='Control')key='b';
    if(!key)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||heldAliases.has(e.code))return;heldAliases.set(e.code,key);send(key,true);audio.unlock();
  },true);
  root.addEventListener('keyup',e=>{const key=heldAliases.get(e.code);if(!key)return;e.preventDefault();e.stopImmediatePropagation();heldAliases.delete(e.code);if(![...heldAliases.values()].includes(key)&&![...heldPointers.values()].includes(key))send(key,false);},true);
  root.addEventListener('blur',clearExtras);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearExtras();});
  $('sound-button').addEventListener('click',()=>audio.unlock());
  $('game').addEventListener('webglcontextlost',()=>{renderFailure=text('3D画面已中断，请重新打开游戏。','The 3D context was lost. Reopen the game.');document.body.classList.add('rush-webgl-error');clearExtras();});
  root.addEventListener('pagehide',()=>{clearExtras();audio.dispose();});
  if(english){
    $('qr').alt='Scan for the local phone controller';
    $('qr-empty').innerHTML='<span class="phone-icon">▣</span><p>Open the TV app<br>then scan to connect</p>';
    if(!root.PureGameHost)$('room-address').textContent='Phone and TV on the same Wi-Fi';
    document.querySelector('aside h3').textContent='CONTROLS';
    document.querySelector('.small-help').textContent='START start / pause · P pause · R restart';
    document.querySelector('.tip .eyebrow').textContent='RACE TIP';
  }else document.querySelector('.small-help').textContent='START 开始/暂停 · P 暂停 · R 重开';
}
function drawMap(state){
  if(lastMapTrack!==state.trackId){lastMapTrack=state.trackId;mapTrack=makeTrack(state.trackId);}
  const canvas=$('rush-map'),c=canvas.getContext('2d');if(!c)return;
  const b=mapTrack.bounds,pad=14,scale=Math.min((160-pad*2)/(b.maxX-b.minX),(110-pad*2)/(b.maxZ-b.minZ));
  const x=v=>80+(v-(b.minX+b.maxX)/2)*scale,z=v=>55+(v-(b.minZ+b.maxZ)/2)*scale;
  c.clearRect(0,0,160,110);c.beginPath();mapTrack.points.forEach((p,i)=>{if(i%4)return;if(i===0)c.moveTo(x(p.x),z(p.z));else c.lineTo(x(p.x),z(p.z));});c.closePath();c.lineWidth=5;c.strokeStyle='#102a42';c.stroke();c.lineWidth=1.5;c.strokeStyle='#9eb4bf';c.stroke();
  for(const [index,car]of state.cars.entries()){c.beginPath();c.arc(x(car.x),z(car.z),index===0?4.2:2.8,0,Math.PI*2);c.fillStyle=index===0?'#ff8656':'#7ae7f3';c.fill();if(index===0){c.strokeStyle='#fff7e6';c.lineWidth=1.5;c.stroke();}}
}
function afterUI(state,ctx){
  install();
  document.body.dataset.rushPhase=ctx.paused?'paused':ctx.phase;
  const p=state.player||state.cars[0],active=ctx.phase==='playing'&&!ctx.paused;
  if(root.PureGameHost)document.body.classList.toggle('rush-phone-open',!active);
  const wifi=ctx.wifiController;
  $('rush-wifi-help').hidden=!root.PureGameHost;
  $('rush-wifi-status').textContent=ctx.phoneConnected&&ctx.controllerKind==='wifi'?text('已连接 · START 开始/暂停','Connected · START starts / pauses'):wifi?.state==='available'?text('同一网络，按搜索键连接 '+(wifi.serviceName||'霓虹飞车'),'Same Wi-Fi: press Search for '+(wifi.serviceName||'Neon Rush')):wifi?.state==='registering'?text('正在准备自动发现…','Preparing discovery…'):text('暂不可发现，请重开游戏或扫码连接。','Discovery unavailable. Reopen the game or scan to connect.');
  const enabled=$('sound-button').getAttribute('aria-pressed')==='true';
  audio.update(state,active,enabled);
  $('rush-nitro-fill').style.width=Math.max(0,Math.min(100,p.nitro))+'%';
  $('rush-drift-fill').style.width=Math.min(100,(p.driftTime||0)/1.8*100)+'%';
  $('rush-nitro-text').textContent=p.boostTime>0?text('推进中','BOOSTING'):p.nitro>=99.5?text('就绪 · B / Ctrl','READY · B / Ctrl'):Math.floor(p.nitro)+'%';
  $('rush-drift-text').textContent=p.drifting?text('松开小喷','RELEASE TO BURST'):text('Shift / 空格','Shift / Space');
  const countdown=$('rush-countdown');countdown.hidden=!active||state.countdown<=0&&state.raceTime>=.8;countdown.textContent=state.countdown>0?String(Math.ceil(state.countdown)):'GO!';
  $('rush-feedback').textContent=!active?'':p.resetCooldown>0?text('返回赛道 · 继续出发','BACK ON TRACK'):p.boostTime>0?text('氮气加速','NITRO BOOST'):p.miniBoostTime>0?text('出弯小喷','MINI TURBO'):p.airHeight>.3?text('飞跃！','AIR TIME'):p.drifting?text('漂移集气','DRIFTING'):'';
  $('message').textContent=ctx.disconnected?text('手柄断开，比赛已暂停。','Controller disconnected. Race paused.'):renderFailure||state.countdown>0?renderFailure||text('准备发车 · 自动油门','Get ready · Auto throttle'):p.drifting?text('保持转向，松开漂移触发小喷。','Hold the turn; release drift for a mini turbo.'):p.nitro>=99.5?text('氮气已满，按 B / Ctrl 提速！','Nitro ready. Press B / Ctrl to boost!'):text('自动油门 · ↓ 刹车 · Shift 漂移 · B 氮气','Auto throttle · ↓ Brake · Shift Drift · B Nitro');
  $('best').textContent=text('最佳积分 ','BEST ')+Math.floor(ctx.best);
  if(english){
    $('connection').textContent=ctx.phoneConnected?(ctx.controllerKind==='wifi'?'Wi-Fi controller connected':'Phone controller connected'):ctx.disconnected?'Disconnected · Paused':'REMOTE / KEYBOARD';
    $('pause-button').textContent=ctx.paused?'Resume P':'Pause P';$('sound-button').textContent='Sound: '+(enabled?'On':'Off');
    $('dialog-kicker').textContent=ctx.paused?'TAKE A BREATHER':ctx.phase==='won'?'RACE COMPLETE':ctx.phase==='lost'?'TIME IS UP':'PURETV RACING CLUB';
    $('dialog-title').textContent=ctx.paused?'Paused':ctx.phase==='won'?'Across the line':ctx.phase==='lost'?'One more run?':'Neon Rush';
    if(ctx.paused)$('dialog-copy').textContent='Race time and driving are paused. Resume from here.';
    $('primary').textContent=ctx.paused?'RESUME · P':ctx.phase==='won'||ctx.phase==='lost'?'RACE AGAIN · ENTER':'START RACE · ENTER';
    $('dialog-help').textContent=ctx.paused?'Controller START or remote Play to resume':'Choose a circuit · B sound · ENTER / START race';
  }else{
    $('primary').textContent=ctx.paused?'继续比赛 · P':ctx.phase==='won'||ctx.phase==='lost'?'再跑一场 · ENTER':'开始竞速 · ENTER';
    if(ctx.phase==='menu')$('dialog-kicker').textContent='PURETV RACING CLUB';
  }
  if(renderFailure){$('primary').disabled=true;$('pause-button').disabled=true;$('dialog-title').textContent=text('此设备暂不支持 3D 竞速','3D racing is unavailable');$('dialog-copy').textContent=renderFailure;$('overlay').hidden=false;$('rush-feedback').textContent='';}
  drawMap(state);
}
root.GameDef={
  id:'neon-rush',title:text('霓虹飞车','Neon Rush'),tagline:text('踩住节奏，甩开夜色。','CHASE THE APEX. OWN THE NIGHT.'),
  seed:417,levelLabel:text('赛道','CIRCUIT'),levelNames:TRACKS.map(t=>english?t.nameEn:t.name),
  description:text('六车同场，两圈决胜。自动油门，压弯漂移集气，松手小喷，再用氮气冲过终点。','Six racers. Two laps. Auto throttle keeps you moving. Drift to charge, release for a mini turbo, then unleash nitro.'),
  tip:text('弯前减速，入弯再按漂移。每个检查点都要按顺序经过。','Brake before a corner, then drift. Pass every checkpoint in order.'),
  controls:{move:text('← → 转向，↓ 刹车；自动油门','← → steer · ↓ brake · auto throttle'),a:text('手柄 A/X · Shift/空格/确认：漂移','Pad A/X · Shift/Space/OK: drift'),b:text('手柄 B/Y · B/Ctrl/菜单：氮气','Pad B/Y · B/Ctrl/Menu: nitro')},
  actionLabels:[text('漂移','Drift'),text('氮气','Nitro')],holdConfirmAsA:true,accent:'#ff784b',background:'#101a2e',stylesheet:'rush-theme.css',
  winTitle:text('冲线完成！','Across the line!'),loseTitle:text('时间到，再跑一场','Time is up'),
  hud(s){const p=s.player||s.cars[0];return[{label:text('排名','POSITION'),value:String(s.rank||1).padStart(2,'0')+' / 06'},{label:text('圈数','LAP'),value:Math.min(s.lapTarget,p.lap)+' / '+s.lapTarget},{label:text('用时','TIME'),value:seconds(s.raceTime)},{label:text('时速 km/h','SPEED km/h'),value:Math.round(Math.max(0,p.speed)*3.6),tone:p.boostTime>0?'good':''}];},
  result(s){return text(`第 ${s.rank} 名 · ${seconds(s.raceTime)} · 漂移 ${s.stats.drifts} 次 · 氮气 ${s.stats.nitros} 次`,`Position ${s.rank}/6 · ${seconds(s.raceTime)} · ${s.stats.drifts} drifts · ${s.stats.nitros} nitro boosts`);},
  createRenderer(canvas){try{return new RushRenderer(canvas);}catch(error){renderFailure=text('无法建立 WebGL 画面。请更新 Android System WebView，或使用支持 WebGL 的设备。','WebGL could not start. Update Android System WebView or use a WebGL-capable device.');document.body.classList.add('rush-webgl-error');console.error('Neon Rush renderer unavailable',error);const c=document.createElement('div');c.className='rush-render-error';c.textContent=renderFailure;canvas.parentElement.append(c);return{begin(){},end(){},draw(){},dispose(){},metrics:{backend:'unsupported',drawCalls:0,triangles:0}};}},
  render(renderer,state,time,input){renderer.draw(state,time,input);},afterUI,
};
