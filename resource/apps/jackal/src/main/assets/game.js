/* Jackal TV browser host. Game rules and pixel renderer stay independent of Android. */
(function (root) {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('battlefield'), renderer = new root.JackalRenderer(canvas);
let info = {language:'zh',url:'',qr:''};
try { if(root.JackalHost) info = JSON.parse(root.JackalHost.getInfo()); } catch (_) {}
const en = String(info.language).startsWith('en');
const tr = (zh,english) => en ? english : zh;
document.documentElement.lang = en ? 'en' : 'zh-CN';
document.title = 'Jackal TV';
const labels = {
  'brand-name':['赤色要塞','JACKAL TV'], 'mission-title':['深入敌后 · 营救行动','BEHIND ENEMY LINES'],
  'stage-label':['关卡','STAGE'], 'battle-name':['营救行动','Rescue mission'],
  'rescue-label':['已救出','RESCUED'], 'mission-label':['突破要塞','BREAK THE FORTRESS'],
  'battle-tip':['炸开营房 · 接走战俘 · 停机坪撤离','Break huts · Collect prisoners · Evacuate at H'],
  'join-label':['加入小队','JOIN THE SQUAD'], 'lan-label':['局域网','LOCAL LAN'],
  'scan-title':['手机扫码，深入敌后','Scan. Rescue. Escape.'],
  'scan-description':['手机和电视连接同一局域网\n无需安装任何应用','Connect to the same network as your TV\nNo app needed on your phone'],
  'player-name-1':['玩家一 · 黄色吉普','PLAYER 1 · YELLOW'], 'player-name-2':['玩家二 · 绿色吉普','PLAYER 2 · GREEN'],
  'move-label':['驾驶','Drive'], 'fire-label':['机枪','Gun'], 'grenade-label':['榴弹','Grenade'],
  'mission-tip':['机枪朝上射击 · 榴弹沿车头方向','Gun fires north · Grenades follow the jeep'],
  'footer-left':['JACKAL TV · 8-BIT RESCUE','JACKAL TV · 8-BIT RESCUE'],
  'footer-right':['方向键驾驶 · OK 机枪 · 菜单键榴弹 · 返回退出','Arrows: drive · OK: gun · Menu: grenade · Back: exit']
};
for(const [id,value] of Object.entries(labels)) {
  const element = $(id); if(element) element.textContent = value[en ? 1 : 0];
}
$('scan-description').style.whiteSpace = 'pre-line';
canvas.setAttribute('aria-label',tr('赤色要塞战场','Jackal rescue battlefield'));
$('room-qr').alt = tr('扫码加入房间','Scan to join the room');
function updateRoom(data) {
  if(data.qr && data.url) {
    $('room-qr').src = data.qr; $('room-qr').hidden = false; $('qr-pending').hidden = true;
    $('room-address').textContent = data.url.replace(/\?.*$/,'');
  } else {
    $('room-qr').hidden = true; $('qr-pending').hidden = false;
    $('network-message').textContent = data.error || tr('连接局域网后重新打开游戏','Connect to a LAN, then reopen the game');
    $('room-address').textContent = '';
  }
}
updateRoom(info);
const game = new root.JackalGame(), keys = new Set();
let keyboardActive = false, last = 0, frame = 0, lastPublish = 0, lastUi = 0;
let visible = true, externallySuspended = false, aPulseUntil = 0, bPulseUntil = 0;
function key(code,pressed) {
  const normalized = code.length === 1 ? code.toLowerCase() : code;
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','b','p','Escape'].includes(normalized)) return;
  if(pressed) {
    if(normalized === 'Enter' || normalized === ' ') aPulseUntil = performance.now() + 70;
    if(normalized === 'b') bPulseUntil = performance.now() + 70;
    if(!keys.has(normalized) && normalized === 'p') game.togglePause();
    keys.add(normalized);
    if(normalized !== 'Escape' && normalized !== 'p') keyboardActive = true;
  } else keys.delete(normalized);
}
function clearKeys() { keys.clear(); aPulseUntil = 0; bPulseUntil = 0; }
root.JackalTV = {
  key, game, updateRoom,
  suspend(value) { externallySuspended = !!value; clearKeys(); last = 0; updateUi(); }
};
document.addEventListener('keydown',event => {
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','b','B','p','P'].includes(event.key)) {
    event.preventDefault(); key(event.key,true);
  }
});
document.addEventListener('keyup',event => key(event.key,false));
root.addEventListener('blur',clearKeys);
function readInputs() {
  let players = [];
  try { if(root.JackalHost) players = JSON.parse(root.JackalHost.snapshot()).players || []; } catch (_) {}
  players = players.map(p => ({id:Number(p.id),connected:!!p.connected,x:Number(p.x)||0,y:Number(p.y)||0,a:!!p.a,b:!!p.b}));
  if(keyboardActive) {
    let player = players.find(p => p.id === 1);
    if(!player) { player = {id:1,connected:true,x:0,y:0,a:false,b:false}; players.push(player); }
    const x = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    const y = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
    player.connected = true; player.x = x || player.x; player.y = y || player.y;
    player.a = player.a || keys.has('Enter') || keys.has(' ') || performance.now() < aPulseUntil;
    player.b = player.b || keys.has('b') || performance.now() < bPulseUntil;
  }
  return players;
}
let previousOverlay = '';
function updateUi() {
  const status = game.status();
  $('stage-value').textContent = String(game.stage).padStart(2,'0');
  $('rescue-value').textContent = String(status.rescued || 0).padStart(2,'0');
  for(const player of game.players) {
    $('player-'+player.id).classList.toggle('connected',player.connected);
    const lives = '♥'.repeat(Math.max(0,player.lives)) + '♡'.repeat(Math.max(0,3-player.lives));
    const cargo = Number(player.passengers) || 0;
    const level = (Number(player.weaponLevel) || 0) + 1;
    $('player-status-'+player.id).textContent = !player.connected ? tr('等待手机加入','Waiting for a phone')
      : game.phase === 'lobby' ? tr('已连接 · 按 A 出发','Connected · A to start')
      : player.lives === 0 ? tr('吉普已耗尽','No jeeps remaining')
      : `${lives} · ${tr('载员','POW')} ${cargo}/8\n${tr('火力等级','WEAPON LV')} ${level}`;
    $('player-score-'+player.id).textContent = player.joined ? String(player.score).padStart(4,'0') : player.connected ? 'READY' : '—';
  }
  const phase = externallySuspended ? 'paused' : game.phase;
  $('game-overlay').hidden = phase === 'playing';
  const overlayKey = `${phase}:${game.manualPause || externallySuspended}:${game.players.some(p=>p.connected)}:${phase === 'victory' ? status.rescued : ''}`;
  if(overlayKey !== previousOverlay) {
    previousOverlay = overlayKey;
    let title,copy,hint,kicker;
    if(phase === 'gameover') {
      title = 'GAME OVER'; copy = tr('小队的吉普已经耗尽。\n重新出发，把战友带回家。','NO JEEPS REMAIN.\nTRY AGAIN. BRING THEM HOME.');
      hint = tr('松开后再按 A 重新出发','Release, then press A to restart'); kicker = `STAGE ${String(game.stage).padStart(2,'0')}`;
    } else if(phase === 'victory') {
      title = 'MISSION\nCOMPLETE'; copy = tr(`要塞已摧毁 · 已营救 ${status.rescued || 0} 人\n小队，欢迎回家！`,`FORTRESS DESTROYED · ${status.rescued || 0} RESCUED\nWELCOME HOME, SQUAD!`);
      hint = tr('松开后再按 A 再次挑战','Release, then press A to play again'); kicker = 'ALL 3 SECTORS CLEARED';
    } else if(phase === 'paused') {
      title = 'PAUSE';
      copy = (game.manualPause || externallySuspended)
        ? tr('行动已暂停。','THE MISSION IS PAUSED.')
        : tr('手柄已断开，行动自动暂停。\n重新连接手机即可继续。','CONTROLLERS DISCONNECTED.\nRECONNECT TO CONTINUE.');
      hint = (game.manualPause || externallySuspended) ? tr('按 P 或遥控器播放键继续','Press P or Play to resume') : tr('扫描二维码重新加入','Scan the QR code to reconnect');
      kicker = 'HOLD POSITION';
    } else {
      title = 'JACKAL\nTV';
      copy = tr('1 PLAYER / 2 PLAYERS\n驾驶吉普，营救战俘，突破要塞。','1 PLAYER / 2 PLAYERS\nRESCUE PRISONERS. BREAK THE FORTRESS.');
      hint = tr('连接后按 A 出发','Connect, then press A to start'); kicker = '8-BIT RESCUE OPERATION';
    }
    $('overlay-title').textContent = title; $('overlay-copy').textContent = copy;
    $('overlay-hint').textContent = hint; $('overlay-kicker').textContent = kicker;
  }
  const banner = $('wave-banner'); banner.hidden = !(game.transition > 0);
  if(game.transition > 0) banner.textContent = tr(`区域突破\nSTAGE ${game.stage + 1}`,`SECTOR CLEAR\nSTAGE ${game.stage + 1}`);
}
let audioContext = null;
function sound(type) {
  try {
    if(!audioContext) { const Constructor = root.AudioContext || root.webkitAudioContext; if(!Constructor) return; audioContext = new Constructor(); }
    if(audioContext.state === 'suspended') { audioContext.resume().catch(()=>{}); return; }
    if(type === 'fire' && game.time % .1 > .04) return;
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
    oscillator.type = type === 'explosion' ? 'sawtooth' : 'square';
    const frequency = type === 'fire' ? 180 : type === 'grenade' ? 110 : type === 'rescue' ? 740 : type === 'upgrade' ? 880 : type === 'victory' ? 500 : 70;
    oscillator.frequency.setValueAtTime(frequency,now);
    oscillator.frequency.exponentialRampToValueAtTime(['rescue','upgrade'].includes(type) ? frequency*1.4 : Math.max(25,frequency/3),now+.11);
    gain.gain.setValueAtTime(type === 'explosion' ? .025 : .015,now);
    gain.gain.exponentialRampToValueAtTime(.001,now+.13);
    oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(now+.14);
  } catch (_) {}
}
function publish() {
  try { if(root.JackalHost) root.JackalHost.publish(JSON.stringify(externallySuspended ? {...game.status(),phase:'paused'} : game.status())); } catch (_) {}
}
function tick(now) {
  if(!visible) return;
  const dt = last ? Math.min((now-last)/1000,.05) : 0; last = now;
  if(!externallySuspended) game.step(dt,readInputs());
  renderer.draw(game);
  if(!externallySuspended) for(const event of game.events) sound(event);
  if(now-lastUi > 100) { updateUi(); lastUi = now; }
  if(now-lastPublish > 200) { publish(); lastPublish = now; }
  frame = requestAnimationFrame(tick);
}
function resize() {
  const wrapper = canvas.parentElement, panel = wrapper.parentElement;
  const scale = Math.min(panel.clientWidth/256,panel.clientHeight/240);
  const width = Math.floor(256*scale)+'px', height = Math.floor(240*scale)+'px';
  wrapper.style.width = width; wrapper.style.height = height; canvas.style.width = width; canvas.style.height = height;
}
root.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{
  visible = !document.hidden; clearKeys(); last = 0;
  if(!visible) {
    cancelAnimationFrame(frame);
    try { if(root.JackalHost) root.JackalHost.publish(JSON.stringify({...game.status(),phase:'paused'})); } catch (_) {}
    if(audioContext) audioContext.suspend().catch(()=>{});
  } else frame = requestAnimationFrame(tick);
});
root.addEventListener('pagehide',()=>{
  visible = false; cancelAnimationFrame(frame); clearKeys();
  if(audioContext) audioContext.close().catch(()=>{});
});
resize(); updateUi(); frame = requestAnimationFrame(tick);
})(window);
