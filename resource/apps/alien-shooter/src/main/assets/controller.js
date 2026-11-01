(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const english = !/^zh\b/i.test(navigator.language || 'zh');
  const words = {
  "controller": [
    "手机控制器",
    "PHONE CONTROLLER"
  ],
  "title": [
    "孤胆枪手 TV",
    "ALIEN SHOOTER TV"
  ],
  "status": [
    "游戏状态",
    "Game status"
  ],
  "controls": [
    "游戏操作",
    "Game controls"
  ],
  "yourPlayer": [
    "你的玩家",
    "YOUR PLAYER"
  ],
  "rotate": [
    "横屏握持，视野更宽",
    "Turn sideways for a wider view"
  ],
  "retry": [
    "重新连接",
    "Reconnect"
  ],
  "connecting": [
    "正在连接",
    "Connecting"
  ],
  "connected": [
    "已连接",
    "Connected"
  ],
  "reconnecting": [
    "正在重连",
    "Reconnecting"
  ],
  "offline": [
    "连接已断开",
    "Disconnected"
  ],
  "waiting": [
    "正在加入电视上的房间…",
    "Joining the room on your TV…"
  ],
  "lost": [
    "连接暂时中断，已松开所有按键，正在重连…",
    "Connection lost. Controls released — reconnecting…"
  ],
  "full": [
    "房间已有两名玩家，空出位置后可重新连接。",
    "Two players already joined. Try again when a place is free."
  ],
  "invalid": [
    "房间不可用，请扫描电视上的当前二维码。",
    "Room unavailable. Scan the current QR code on your TV."
  ],
  "waitingPlayer": [
    "正在加入",
    "Joining room"
  ],
  "playerOne": [
    "玩家 1",
    "Player 1"
  ],
  "playerTwo": [
    "玩家 2",
    "Player 2"
  ],
  "expired": [
    "房间已过期，请扫描电视上的新二维码。",
    "Room expired. Scan the new QR code on your TV."
  ],
  "fullscreen": [
    "全屏",
    "Full screen"
  ],
  "leaveFullscreen": [
    "退出全屏",
    "Exit full screen"
  ],
  "start": [
    "开始 / 暂停",
    "Play / pause"
  ],
  "startLabel": [
    "START 开始、暂停或继续",
    "START: begin, pause, or continue"
  ],
  "connectionError": [
    "暂时无法连接电视，请让手机和电视连接同一局域网。",
    "Cannot reach your TV. Connect both devices to the same local network."
  ],
  "playOffline": [
    "手柄未连接",
    "CONTROLS OFFLINE"
  ],
  "playReady": [
    "准备出击",
    "READY TO DEPLOY"
  ],
  "playActive": [
    "任务进行中",
    "MISSION ACTIVE"
  ],
  "playPaused": [
    "行动已暂停",
    "MISSION PAUSED"
  ],
  "playFinished": [
    "任务已结束",
    "MISSION COMPLETE"
  ],
  "results": [
    "结果已显示在电视上，按 START 继续。",
    "Results are on your TV. Press START to continue."
  ],
  "ending": [
    "行动完成！按 START 返回标题。",
    "Mission complete! Press START to return to the title."
  ],
  "stage": [
    "任务",
    "MISSION"
  ],
  "health": [
    "生命",
    "HEALTH"
  ],
  "ammo": [
    "弹药",
    "AMMO"
  ],
  "grenades": [
    "手雷",
    "GRENADES"
  ],
  "score": [
    "得分",
    "SCORE"
  ],
  "move": [
    "左侧任意位置按住滑动，控制移动",
    "HOLD & SLIDE ANYWHERE LEFT TO MOVE"
  ],
  "actionA": [
    "开火 · 拖动瞄准",
    "FIRE · DRAG TO AIM"
  ],
  "actionB": [
    "手雷",
    "GRENADE"
  ],
  "hint": [
    "右上半区开火与瞄准 · 右下半区手雷",
    "TOP RIGHT: FIRE & AIM · BOTTOM RIGHT: GRENADE"
  ],
  "ready": [
    "SELECT 选择单人 / 双人 · START 开始任务",
    "SELECT one / two players · START deploys"
  ],
  "playing": [
    "按住右上半区开火，拖动瞄准；点按辅助瞄准。",
    "Hold the upper right to fire, drag to aim; tap for aim assist."
  ],
  "paused": [
    "行动已暂停 · 按 START 继续",
    "Mission paused · Press START to resume"
  ],
  "joystick": [
    "左侧任意位置按住滑动，控制移动",
    "Hold anywhere on the left and slide to move"
  ],
  "actionALabel": [
    "右上整个半区按住开火、拖动瞄准；点按辅助瞄准",
    "Hold anywhere in the top right half to fire; drag to aim, tap for aim assist"
  ],
  "actionBLabel": [
    "右下整个半区投掷手雷",
    "Tap anywhere in the bottom right half to throw a grenade"
  ],
  "select": [
    "武器 / 人数",
    "Weapon / players"
  ],
  "selectLabel": [
    "SELECT 标题选择人数，游戏中切换武器",
    "SELECT: player count at title, next weapon during gameplay"
  ],
  "pistol": [
    "战术手枪",
    "TACTICAL PISTOL"
  ],
  "shotgun": [
    "破门霰弹枪",
    "BREACH SHOTGUN"
  ],
  "smg": [
    "突击冲锋枪",
    "ASSAULT SMG"
  ],
  "minigun": [
    "六管重机枪",
    "ROTARY CANNON"
  ],
  "plasma": [
    "聚能等离子",
    "PLASMA LANCE"
  ],
  "shop": ["补给整备", "SUPPLY STATION"],
  "shopHint": ["摇杆 / SELECT 选择补给 · 右上购买 · 右下 / START 下一关", "Stick / SELECT browse · upper right buys · lower right / START continues"],
  "buy": ["购买补给", "BUY SUPPLIES"],
  "nextMission": ["下一关", "NEXT MISSION"],
  "browseSupplies": ["选择补给", "BROWSE SUPPLIES"]
};
  const messages = Object.fromEntries(Object.entries(words).map(([key, pair]) => [key, pair[english ? 1 : 0]]));
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  document.title = messages.title + ' · ' + messages.controller;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = messages[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', messages[el.dataset.i18nAria]); });
  $('joystick-zone').setAttribute('aria-label', messages.joystick);
  $('button-a').setAttribute('aria-label', messages.actionALabel);
  $('button-b').setAttribute('aria-label', messages.actionBLabel);
  $('button-start').setAttribute('aria-label', messages.startLabel);
  $('button-select').setAttribute('aria-label', messages.selectLabel);
  $('a-caption').textContent = messages.actionA;
  $('b-caption').textContent = messages.actionB;
  $('select-caption').textContent = messages.select;
  $('start-caption').textContent = messages.start;
  $('fullscreen').setAttribute('aria-label', messages.fullscreen);
  $('fullscreen').title = messages.fullscreen;
  $('player-name').textContent = messages.waitingPlayer;
  const root = $('controller');
  const stick = $('joystick'), stickZone = $('joystick-zone');
  const room = new URL(location.href).searchParams.get('room') || '';
  const storageKey = `alien-shooter-controller:${room}`;
  let session = '';
  try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) { /* Private browser storage may be unavailable. */ }
  let ws = null, connected = false, player = 0, seq = 0, attempts = 0;
  let reconnectTimer = 0, helloTimer = 0, lastSend = 0, lastSent = '', terminal = false, leaving = false;
  let gamePhase = 'title';
  let stickPointer = null, stickX = 0, stickY = 0;
  let stickOriginX = 0, stickOriginY = 0, stickRadius = 1;
  let aimPointer = null, aimX = 0, aimY = 0, aimOriginX = 0, aimOriginY = 0, aimRadius = 48;
  const actionPointers = new Map();
  const keys = new Set();
  const input = { x: 0, y: 0, aimX: 0, aimY: 0, a: false, b: false, start: false, select: false, cancelSeq: 0 };
  const isVisible = () => !document.hidden && !leaving;
  const setMessage = (key, error = false) => { $('message').textContent = messages[key] || key; root.dataset.error = String(error); };
  function titlePhase() { return ['title', 'menu', 'lobby', 'ready'].includes(gamePhase); }
  function finishedPhase() { return ['results', 'ending', 'gameover', 'over', 'victory'].includes(gamePhase); }
  function canAct() { return !finishedPhase(); }
  function updateControlAccess() {
    for (const action of ['a', 'b', 'start', 'select']) {
      $(`button-${action}`).disabled = !connected || ((action === 'a' || action === 'b') && !canAct());
    }
    stickZone.setAttribute('aria-disabled', String(!connected || !canAct()));
    root.dataset.state = !connected ? 'offline' : finishedPhase() ? 'finished' : titlePhase() ? 'ready' : gamePhase === 'paused' ? 'paused' : 'active';
    const key = !connected ? 'playOffline' : finishedPhase() ? 'playFinished' : titlePhase() ? 'playReady' : gamePhase === 'paused' ? 'playPaused' : gamePhase === 'shop' ? 'shop' : 'playActive';
    $('play-status').textContent = messages[key];
    const shopping = gamePhase === 'shop';
    $('a-caption').textContent = messages[shopping ? 'buy' : 'actionA'];
    $('b-caption').textContent = messages[shopping ? 'nextMission' : 'actionB'];
    $('button-a').setAttribute('aria-label', messages[shopping ? 'buy' : 'actionALabel']);
    $('button-b').setAttribute('aria-label', messages[shopping ? 'nextMission' : 'actionBLabel']);
    $('select-caption').textContent = messages[shopping ? 'browseSupplies' : 'select'];
    $('start-caption').textContent = messages[shopping ? 'nextMission' : 'start'];
    $('footer-hint').textContent = messages[shopping ? 'shopHint' : 'hint'];
  }
  function showConnection(key) {
    $('connection-text').textContent = messages[key];
    root.dataset.connected = String(connected);
    updateControlAccess();
  }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) {} }
  function updateStick() {
    $('joystick-thumb').style.transform = `translate(${stickX * stickRadius}px,${stickY * stickRadius}px)`;
    const active = stickPointer !== null;
    stick.classList.toggle('active', active);
    stickZone.dataset.active = String(active);
  }
  function updateInput() {
    input.x = stickPointer !== null ? stickX : (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    input.y = stickPointer !== null ? stickY : (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
    input.a = [...actionPointers.values()].includes('a') || keys.has(' ') || keys.has('z') || keys.has('button:a');
    input.aimX = input.a && aimPointer !== null ? aimX : 0;
    input.aimY = input.a && aimPointer !== null ? aimY : 0;
    input.b = [...actionPointers.values()].includes('b') || keys.has('b') || keys.has('x') || keys.has('button:b');
    input.start = [...actionPointers.values()].includes('start') || keys.has('Enter') || keys.has('button:start');
    input.select = [...actionPointers.values()].includes('select') || keys.has('Shift') || keys.has('button:select');
    // Both players can act concurrently; completed games keep the menu controls available.
    if (!canAct()) { input.x = input.y = input.aimX = input.aimY = 0; input.a = input.b = false; }
    for (const action of ['a', 'b', 'start', 'select']) $(`button-${action}`).classList.toggle('pressed', input[action]);
    updateStick();
    $('aim-stick').classList.toggle('active', aimPointer !== null && input.a);
    $('aim-thumb').style.transform = `translate(${aimX * 35}px,${aimY * 35}px)`;
  }
  function sendInput(force = false) {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    const state = JSON.stringify(input);
    if (!force && ((state === lastSent && now - lastSend < 250) || now - lastSend < 30)) return;
    try {
      ws.send(JSON.stringify(Object.assign({ type: 'input' }, input, { seq: ++seq })));
      lastSent = state; lastSend = now;
    } catch (_) { resetControls(false); }
  }
  function clearStick() {
    const pointer = stickPointer;
    stickPointer = null; stickX = stickY = 0;
    stickOriginX = stickOriginY = 0; stickRadius = 1;
    stick.style.left = ''; stick.style.top = '';
    try {
      if (pointer !== null && stickZone.hasPointerCapture(pointer)) stickZone.releasePointerCapture(pointer);
    } catch (_) {}
  }
  function clearAim() {
    aimPointer = null; aimX = aimY = 0;
    $('aim-stick').classList.remove('active');
  }
  function cancelGesture() {
    // Retain cancellation in every heartbeat so delayed frames never turn a
    // cancelled touch into another shot or grenade.
    input.cancelSeq = input.cancelSeq >= Number.MAX_SAFE_INTEGER ? 0 : input.cancelSeq + 1;
  }
  function resetControls(send = true) {
    cancelGesture();
    clearAim(); clearStick(); actionPointers.clear(); keys.clear(); updateInput();
    if (send) sendInput(true);
  }
  function clearTimers() { clearTimeout(reconnectTimer); clearTimeout(helloTimer); reconnectTimer = helloTimer = 0; }
  function scheduleReconnect() {
    if (terminal || !isVisible() || reconnectTimer) return;
    const delay = Math.min(6000, 500 * 2 ** Math.min(attempts, 4));
    reconnectTimer = setTimeout(() => { reconnectTimer = 0; connect(); }, delay);
  }
  function fail(key, stop = false) {
    resetControls(); connected = false; terminal = stop; showConnection('offline'); setMessage(key, true);
    $('error-actions').hidden = !stop;
    if (stop) { clearTimers(); if (ws) ws.close(); }
  }
  function setStat(id, value) {
    const element = $(id);
    element.textContent = String(value);
    element.title = element.textContent;
  }
  function applyState(state) {
    if (!connected) return;
    const mine = Array.isArray(state.players) ? state.players.find(p => p && Number(p.id) === player) : null;
    const label = mine && typeof mine.stageLabel === 'string' ? mine.stageLabel : state.stageLabel;
    if (typeof label === 'string' && label.length) setStat('stage', label);
    else if (mine && Number.isFinite(mine.level)) setStat('stage', Math.max(1, mine.level));
    if (mine) {
      const hp = Number.isFinite(mine.hp) ? mine.hp : mine.health;
      if (Number.isFinite(hp)) setStat('health', Math.max(0, Math.ceil(hp)));
      if (Number.isFinite(mine.ammo)) setStat('ammo', mine.ammo < 0 ? '∞' : Math.floor(mine.ammo));
      else if (mine.ammo === null || mine.ammo === 'infinite') setStat('ammo', '∞');
      const knownWeapon = ['pistol', 'smg', 'shotgun', 'minigun', 'plasma'].includes(mine.weapon);
      const weapon = knownWeapon ? messages[mine.weapon] : typeof mine.weaponName === 'string' ? mine.weaponName : typeof mine.weapon === 'string' ? mine.weapon : '—';
      const grenades = Number.isFinite(mine.grenades) ? Math.max(0, Math.floor(mine.grenades)) : 0;
      const score = Number.isFinite(mine.score) ? Math.max(0, Math.floor(mine.score)) : 0;
      setStat('weapon', weapon + ' · ' + messages.grenades + ' ' + grenades + ' · ' + messages.score + ' ' + score);
    }
    const priorAllowed = canAct();
    gamePhase = typeof state.phase === 'string' ? state.phase : gamePhase;
    // Release held inputs once a result screen becomes active.
    if (priorAllowed !== canAct()) resetControls();
    updateControlAccess();
    const phaseKey = { title: 'ready', menu: 'ready', lobby: 'ready', ready: 'ready', playing: 'playing', shop: 'shopHint', paused: 'paused', results: 'results', ending: 'ending', gameover: 'results', over: 'results', victory: 'results' }[gamePhase];
    if (phaseKey) setMessage(phaseKey);
  }
  function connect() {
    if (!isVisible() || terminal) return;
    clearTimers();
    if (!room || !/^[a-zA-Z0-9_-]{16,128}$/.test(room)) { fail('invalid', true); return; }
    resetControls(false); connected = false; gamePhase = 'title'; showConnection(attempts ? 'reconnecting' : 'connecting');
    setMessage(attempts > 3 ? 'connectionError' : attempts ? 'lost' : 'waiting', attempts > 3);
    $('error-actions').hidden = true;
    const previous = ws;
    ws = null;
    if (previous) previous.close();
    let socket;
    try { socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws?room=${encodeURIComponent(room)}`); }
    catch (_) { attempts++; scheduleReconnect(); return; }
    ws = socket; seq = 0; lastSent = ''; lastSend = 0; attempts++;
    helloTimer = setTimeout(() => { if (socket === ws && !connected) socket.close(); }, 7000);
    socket.addEventListener('open', () => {
      if (socket !== ws || !isVisible()) { socket.close(); return; }
      socket.send(JSON.stringify(Object.assign({ type: 'hello' }, session ? { session } : {})));
    });
    socket.addEventListener('message', event => {
      if (socket !== ws || typeof event.data !== 'string' || event.data.length > 32768) return;
      let data; try { data = JSON.parse(event.data); } catch (_) { return; }
      if (!data || typeof data !== 'object') return;
      if (data.type === 'welcome' && [1, 2].includes(data.player) && typeof data.session === 'string') {
        clearTimeout(helloTimer); helloTimer = 0;
        session = data.session; try { sessionStorage.setItem(storageKey, session); } catch (_) {}
        player = data.player; connected = true; attempts = 0; root.dataset.player = String(player);
        $('player-number').textContent = `P${player}`; $('player-name').textContent = messages[player === 1 ? 'playerOne' : 'playerTwo'];
        resetControls(false); showConnection('connected'); setMessage('ready'); sendInput(true);
      } else if (data.type === 'state') applyState(data);
      else if (data.type === 'error') {
        const code = String(data.code || data.error || '').toLowerCase();
        if (/full|capacity/.test(code)) fail('full', true);
        else if (/room|token|auth|expired/.test(code)) fail('expired', true);
        else if (/session/.test(code)) { session = ''; try { sessionStorage.removeItem(storageKey); } catch (_) {} socket.close(); }
        else fail('connectionError', true);
      }
    });
    socket.addEventListener('close', () => {
      if (socket !== ws) return;
      clearTimeout(helloTimer); helloTimer = 0;
      resetControls(false); connected = false; showConnection('offline');
      if (!terminal && isVisible()) { setMessage(attempts > 3 ? 'connectionError' : 'lost', attempts > 3); scheduleReconnect(); }
    });
    socket.addEventListener('error', () => { if (socket === ws) socket.close(); });
  }

  function moveStick(event) {
    // The first touch remains the origin, including when it is close to an edge.
    let x = (event.clientX - stickOriginX) / stickRadius;
    let y = (event.clientY - stickOriginY) / stickRadius;
    const length = Math.hypot(x, y);
    if (length < .13) x = y = 0;
    else if (length > 1) { x /= length; y /= length; }
    stickX = Math.round(x * 1000) / 1000; stickY = Math.round(y * 1000) / 1000; updateInput(); sendInput();
  }
  stickZone.addEventListener('pointerdown', event => {
    if (!connected || !canAct() || stickPointer !== null || event.button > 0) return;
    event.preventDefault();
    const rect = stickZone.getBoundingClientRect();
    stickPointer = event.pointerId;
    stickOriginX = event.clientX; stickOriginY = event.clientY;
    stickX = stickY = 0;
    stick.style.left = `${stickOriginX - rect.left}px`;
    stick.style.top = `${stickOriginY - rect.top}px`;
    stickRadius = Math.max(1, stick.clientWidth * .265);
    try { stickZone.setPointerCapture(event.pointerId); } catch (_) {}
    updateInput(); sendInput(true); vibrate(8);
  });
  stickZone.addEventListener('pointermove', event => { if (event.pointerId === stickPointer) { event.preventDefault(); moveStick(event); } });
  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    clearStick(); updateInput(); sendInput(true);
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => stickZone.addEventListener(name, releaseStick));
  function pressAction(action, event) {
    const button = $(`button-${action}`);
    if (!connected || event.button > 0 || ((action === 'a' || action === 'b') && !canAct())) return;
    if (action === 'a' && aimPointer !== null) return;
    event.preventDefault(); actionPointers.set(event.pointerId, action);
    if (action === 'a') {
      aimPointer = event.pointerId; aimX = aimY = 0;
      aimOriginX = event.clientX; aimOriginY = event.clientY;
      aimRadius = Math.max(36, Math.min(64, window.innerHeight * .13));
      const bounds = button.getBoundingClientRect();
      $('aim-stick').style.left = `${aimOriginX - bounds.left}px`;
      $('aim-stick').style.top = `${aimOriginY - bounds.top}px`;
    }
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
    updateInput(); sendInput(true); vibrate(action === 'a' ? 10 : 20);
  }
  // Chromium can adjust a wide fingertip near a divider onto the neighboring
  // joystick. Classify the actual contact coordinates before target handlers so
  // every point in the right third keeps its advertised action.
  document.addEventListener('pointerdown', event => {
    if (editableTarget(event.target)) return;
    const bounds = document.querySelector('.actions').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom) return;
    event.preventDefault(); event.stopPropagation();
    const action = event.clientY < bounds.top + bounds.height / 2 ? 'a' : 'b';
    pressAction(action, event);
  }, true);
  ['a', 'b', 'start', 'select'].forEach(action => {
    const button = $(`button-${action}`);
    button.addEventListener('pointerdown', event => pressAction(action, event));
    const release = event => {
      if (actionPointers.get(event.pointerId) !== action) return;
      actionPointers.delete(event.pointerId);
      if (event.pointerId === aimPointer) clearAim();
      updateInput();
      if (event.type !== 'pointerup') cancelGesture();
      sendInput(true);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
    button.addEventListener('keydown', event => {
      if (!connected || ![' ', 'Enter'].includes(event.key) || ((action === 'a' || action === 'b') && !canAct())) return;
      event.preventDefault(); event.stopPropagation(); keys.add(`button:${action}`); updateInput(); sendInput(true);
    });
    button.addEventListener('keyup', event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation(); keys.delete(`button:${action}`); updateInput(); sendInput(true);
    });
    button.addEventListener('blur', () => {
      if (keys.delete(`button:${action}`)) {
        updateInput(); cancelGesture(); sendInput(true);
      }
    });
  });
  $('button-a').addEventListener('pointermove', event => {
    if (event.pointerId !== aimPointer || !connected || !canAct()) return;
    event.preventDefault();
    let x = (event.clientX - aimOriginX) / aimRadius, y = (event.clientY - aimOriginY) / aimRadius;
    const length = Math.hypot(x, y);
    if (length < .18) x = y = 0;
    else if (length > 1) { x /= length; y /= length; }
    aimX = Math.round(x * 1000) / 1000; aimY = Math.round(y * 1000) / 1000;
    updateInput(); sendInput();
  });
  document.addEventListener('keydown', event => {
    if (editableTarget(event.target)) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!connected || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift', 'z', 'x', 'b'].includes(key)) return;
    if ((event.target === $('retry') || event.target === $('fullscreen')) && [' ', 'Enter'].includes(key)) return;
    if (!canAct() && !['Enter', 'Shift'].includes(key)) { event.preventDefault(); return; }
    event.preventDefault(); keys.add(key); updateInput(); sendInput(true);
  });
  document.addEventListener('keyup', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!keys.has(key)) return;
    event.preventDefault(); keys.delete(key); updateInput(); sendInput(true);
  });
  window.addEventListener('blur', () => resetControls());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimers(); resetControls(); connected = false; showConnection('offline'); if (ws) ws.close(); }
    else if (!terminal) connect();
  });
  window.addEventListener('pagehide', () => { leaving = true; clearTimers(); resetControls(); connected = false; if (ws) ws.close(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { leaving = false; terminal = false; connect(); } });
  window.addEventListener('online', () => { if (!connected && !terminal) connect(); });
  window.addEventListener('resize', () => resetControls());
  // Cancel native long-press selection/callouts, including on labels and while
  // disconnected. Real text fields and ordinary browser buttons remain usable.
  function editableTarget(target) {
    return target && target.closest && target.closest('input, textarea, [contenteditable="true"]');
  }
  ['contextmenu', 'selectstart', 'dragstart'].forEach(name => {
    document.addEventListener(name, event => {
      if (!editableTarget(event.target)) event.preventDefault();
    });
  });
  document.addEventListener('touchstart', event => {
    if (editableTarget(event.target) || event.target.closest('#fullscreen, #retry')) return;
    event.preventDefault();
  }, { passive: false });
  // Pointer capture is best effort on older WebViews. A release outside a zone
  // must still clear its input when capture is unavailable or interrupted.
  ['pointerup', 'pointercancel'].forEach(name => window.addEventListener(name, event => {
    let changed = actionPointers.delete(event.pointerId);
    if (event.pointerId === aimPointer) { clearAim(); changed = true; }
    if (event.pointerId === stickPointer) { clearStick(); changed = true; }
    if (changed) {
      updateInput(); if (event.type === 'pointercancel') cancelGesture(); sendInput(true);
    }
  }));

  document.addEventListener('gesturestart', event => event.preventDefault());
  $('retry').addEventListener('click', () => { terminal = false; attempts = 0; connect(); });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch (_) { /* Fullscreen is optional, including on iOS browsers. */ }
  });
  if (!document.documentElement.requestFullscreen) $('fullscreen').hidden = true;
  document.addEventListener('fullscreenchange', () => {
    const label = messages[document.fullscreenElement ? 'leaveFullscreen' : 'fullscreen'];
    $('fullscreen').title = label; $('fullscreen').setAttribute('aria-label', label); resetControls();
  });
  let heartbeat = 0;
  function startHeartbeat() { if (!heartbeat && isVisible()) heartbeat = setInterval(() => { if (isVisible()) sendInput(); }, 33); }
  function stopHeartbeat() { clearInterval(heartbeat); heartbeat = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopHeartbeat(); else startHeartbeat(); });
  window.addEventListener('pagehide', stopHeartbeat);
  window.addEventListener('pageshow', event => { if (event.persisted) startHeartbeat(); });
  startHeartbeat();

  connect();
})();
