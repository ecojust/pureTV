(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const english = !/^zh\b/i.test(navigator.language || 'zh');
  const messages = english ? {
    "controller": "PHONE CONTROLLER",
    "status": "Game status",
    "controls": "Game controls",
    "yourPlayer": "YOUR PLAYER",
    "rotate": "Turn sideways for a wider view",
    "retry": "Reconnect",
    "connecting": "Connecting",
    "connected": "Connected",
    "reconnecting": "Reconnecting",
    "offline": "Disconnected",
    "waiting": "Joining the room on your TV…",
    "lost": "Connection lost. Controls released — reconnecting…",
    "full": "Two players already joined. Try again when a place is free.",
    "invalid": "Room unavailable. Scan the current QR code on your TV.",
    "waitingPlayer": "Joining room",
    "playerOne": "Player 1",
    "playerTwo": "Player 2",
    "joining": "Connecting to your TV…",
    "expired": "Room expired. Scan the new QR code on your TV.",
    "fullscreen": "Full screen",
    "leaveFullscreen": "Exit full screen",
    "start": "Play / pause",
    "startLabel": "START: begin, pause, or continue",
    "connectionError": "Cannot reach your TV. Connect both devices to the same local network.",
    "playOffline": "CONTROLS OFFLINE",
    "playReady": "READY TO PLAY",
    "playActive": "PLAY TOGETHER",
    "playPaused": "TAKE A BREAK",
    "playFinished": "SESSION COMPLETE",
    "results": "Results are on your TV. Press START to continue.",
    "ending": "All done! Press START to return to the title.",
    "stage": "COURSE",
    "metric": "LAP",
    "score": "RANK",
    "move": "SLIDE TO STEER · DOWN TO BRAKE",
    "actionA": "ITEM",
    "actionB": "DRIFT",
    "hint": "Auto accelerate · Hold B to drift, release to boost",
    "ready": "← → course · ↑ ↓ mode · SELECT players · START race",
    "playing": "Race together. A uses your item; hold B through a corner.",
    "paused": "Paused · SELECT toggles music · START resumes",
    "joystick": "Hold anywhere on the left: slide left or right to steer, down to brake or reverse",
    "actionALabel": "A: use your collected item",
    "actionBLabel": "B: hold while steering to drift, release for a boost",
    "select": "Players / ♫",
    "selectLabel": "SELECT: one or two players at the title, music while paused",
    "itemLabel": "ITEM",
    "noItem": "No item",
    "boost": "Boost",
    "shield": "Shield",
    "trap": "Trap",
    "pulse": "Pulse"
} : {
    "controller": "手机控制器",
    "status": "游戏状态",
    "controls": "游戏操作",
    "yourPlayer": "你的玩家",
    "rotate": "横屏握持，视野更宽",
    "retry": "重新连接",
    "connecting": "正在连接",
    "connected": "已连接",
    "reconnecting": "正在重连",
    "offline": "连接已断开",
    "waiting": "正在加入电视上的房间…",
    "lost": "连接暂时中断，已松开所有按键，正在重连…",
    "full": "房间已有两名玩家，空出位置后可重新连接。",
    "invalid": "房间不可用，请扫描电视上的当前二维码。",
    "waitingPlayer": "正在加入",
    "playerOne": "玩家 1",
    "playerTwo": "玩家 2",
    "joining": "正在连接电视…",
    "expired": "房间已过期，请扫描电视上的新二维码。",
    "fullscreen": "全屏",
    "leaveFullscreen": "退出全屏",
    "start": "开始 / 暂停",
    "startLabel": "START 开始、暂停或继续",
    "connectionError": "暂时无法连接电视，请让手机和电视连接同一局域网。",
    "playOffline": "手柄未连接",
    "playReady": "准备开始",
    "playActive": "一起畅玩",
    "playPaused": "休息一下",
    "playFinished": "本局已完成",
    "results": "成绩已显示在电视上，按 START 继续。",
    "ending": "旅程完成！按 START 返回标题。",
    "stage": "赛道",
    "metric": "圈数",
    "score": "名次",
    "move": "左右滑动转向 · 向下刹车",
    "actionA": "道具",
    "actionB": "漂移",
    "hint": "自动加速 · 按住 B 漂移，松开冲刺",
    "ready": "左右选赛道 · 上下选模式 · SELECT 人数 · START 开始",
    "playing": "一起竞速！A 使用道具，转弯时按住 B 漂移。",
    "paused": "已暂停 · SELECT 切换音乐 · START 继续",
    "joystick": "左侧任意位置按住，左右滑动转向，向下刹车或倒车",
    "actionALabel": "A 使用收集的道具",
    "actionBLabel": "B 转弯时按住漂移，松开后加速",
    "select": "人数 / 音乐",
    "selectLabel": "SELECT 标题选择单人或双人，暂停时切换音乐",
    "itemLabel": "道具",
    "noItem": "暂无道具",
    "boost": "加速",
    "shield": "护盾",
    "trap": "陷阱",
    "pulse": "脉冲"
};
  messages.hint = english ? 'TOP: ' + messages.actionB + ' · BOTTOM: ' + messages.actionA : '右上：' + messages.actionB + ' · 右下：' + messages.actionA;
  messages.actionALabel += english ? ' (bottom right half)' : '（右下半区）';
  messages.actionBLabel += english ? ' (top right half)' : '（右上半区）';
  document.documentElement.lang = english ? 'en' : 'zh-CN';
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
  const storageKey = `coast-kart-controller:${room}`;
  let session = '';
  try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) { /* Private browser storage may be unavailable. */ }
  let ws = null, connected = false, player = 0, seq = 0, attempts = 0;
  let reconnectTimer = 0, helloTimer = 0, lastSend = 0, lastSent = '', terminal = false, leaving = false;
  let gamePhase = 'title';
  let stickPointer = null, stickX = 0, stickY = 0;
  let stickOriginX = 0, stickOriginY = 0, stickRadius = 1;
  const actionPointers = new Map();
  const keys = new Set();
  const input = { x: 0, y: 0, a: false, b: false, start: false, select: false };
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
    const key = !connected ? 'playOffline' : finishedPhase() ? 'playFinished' : titlePhase() ? 'playReady' : gamePhase === 'paused' ? 'playPaused' : 'playActive';
    $('play-status').textContent = messages[key];
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
    input.b = [...actionPointers.values()].includes('b') || keys.has('b') || keys.has('x') || keys.has('button:b');
    input.start = [...actionPointers.values()].includes('start') || keys.has('Enter') || keys.has('button:start');
    input.select = [...actionPointers.values()].includes('select') || keys.has('Shift') || keys.has('button:select');
    // Both players can act concurrently; completed games keep the menu controls available.
    if (!canAct()) { input.x = input.y = 0; input.a = input.b = false; }
    for (const action of ['a', 'b', 'start', 'select']) $(`button-${action}`).classList.toggle('pressed', input[action]);
    updateStick();
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
  function resetControls(send = true) {
    clearStick(); actionPointers.clear(); keys.clear(); updateInput();
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
      if (Number.isFinite(mine.lap)) setStat('lap', Math.max(1, Math.min(3, Math.floor(mine.lap))) + ' / 3');
      if (Number.isFinite(mine.rank)) setStat('score', Math.max(1, Math.floor(mine.rank)));
      else if (Number.isFinite(mine.score)) setStat('score', Math.max(0, Math.floor(mine.score)));
      if (typeof mine.item === 'string') setStat('item', messages.itemLabel + ': ' + (messages[mine.item] || mine.item || messages.noItem));
    }
    const priorAllowed = canAct();
    gamePhase = typeof state.phase === 'string' ? state.phase : gamePhase;
    // Release held inputs once a result screen becomes active.
    if (priorAllowed !== canAct()) resetControls();
    updateControlAccess();
    const phaseKey = { title: 'ready', menu: 'ready', lobby: 'ready', ready: 'ready', playing: 'playing', paused: 'paused', results: 'results', ending: 'ending', gameover: 'results', over: 'results', victory: 'results' }[gamePhase];
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
    event.preventDefault(); actionPointers.set(event.pointerId, action);
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
    const action = root.dataset.actionLayout === 'single' || event.clientY >= bounds.top + bounds.height / 2 ? 'a' : 'b';
    pressAction(action, event);
  }, true);
  ['a', 'b', 'start', 'select'].forEach(action => {
    const button = $(`button-${action}`);
    button.addEventListener('pointerdown', event => pressAction(action, event));
    const release = event => {
      if (actionPointers.get(event.pointerId) !== action) return;
      actionPointers.delete(event.pointerId); updateInput(); sendInput(true);
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
      if (keys.delete(`button:${action}`)) { updateInput(); sendInput(true); }
    });
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
    if (event.pointerId === stickPointer) { clearStick(); changed = true; }
    if (changed) { updateInput(); sendInput(true); }
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
