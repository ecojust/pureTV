(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const english = !/^zh\b/i.test(navigator.language || 'zh');
  const messages = english ? {
    controller: 'FIELD CONTROLLER', yourJeep: 'YOUR JEEP', stage: 'STAGE', lives: 'LIVES', score: 'SCORE', cargo: 'ON BOARD', move: 'HOLD AND SLIDE ON THE LEFT',
    actionA: 'GRENADE', actionB: 'MACHINE GUN', hint: 'A: grenade · B: machine gun · START: begin / pause', rotate: 'Turn your phone sideways for a better grip',
    retry: 'Reconnect', connecting: 'Connecting', connected: 'Connected', reconnecting: 'Reconnecting', offline: 'Disconnected',
    waiting: 'Joining the room on your TV…', ready: 'SELECT chooses the mode. START begins the game.', playing: 'Use A against huts. Rescue prisoners and reach the helicopter.',
    paused: 'Game paused on TV.', gameover: 'Round over. Use START on the TV title screen.', victory: 'Mission complete! Use START on the TV title screen.',
    lost: 'Connection lost. Controls released — reconnecting…', full: 'This room already has two players. Try again when a place is free.',
    invalid: 'This room is unavailable. Scan the current QR code on your TV.', waitingPlayer: 'Waiting for a place',
    gold: 'Green jeep', cyan: 'Brown jeep', joining: 'Connecting to your TV…', expired: 'Room expired. Scan the new QR code on your TV.',
    fullscreen: 'Full screen', leaveFullscreen: 'Exit full screen', joystick: 'Hold and slide anywhere on the left to move', actionALabel: 'A: Grenade', actionBLabel: 'B: Machine gun',
    select: 'Select', start: 'Start / pause', selectLabel: 'SELECT: choose mode', startLabel: 'START: begin or pause',
    connectionError: 'Cannot reach the TV. Keep your phone and TV on the same local network.', cooling: 's',
  } : {
    controller: '手机控制器', yourJeep: '你的吉普', stage: '关卡', lives: '生命', score: '得分', cargo: '载员', move: '左侧按住滑动',
    actionA: '榴弹', actionB: '机枪', hint: 'A 榴弹 · B 机枪 · START 开始或暂停', rotate: '横屏握持，体验更好',
    retry: '重新连接', connecting: '正在连接', connected: '已连接', reconnecting: '正在重连', offline: '连接已断开',
    waiting: '正在加入电视上的房间…', ready: 'SELECT 选择模式，START 开始游戏。', playing: '用 A 炸开营房，接走战俘后到直升机撤离点。',
    paused: '游戏已在电视上暂停。', gameover: '本局结束，回到标题画面后按 START 开始。', victory: '行动完成！回到标题画面后按 START 开始。',
    lost: '连接暂时中断，已松开所有按键，正在重连…', full: '房间已有两名玩家，空出位置后可重新连接。',
    invalid: '房间不可用，请重新扫描电视上的二维码。', waitingPlayer: '等待加入房间',
    gold: '绿色吉普', cyan: '棕色吉普', joining: '正在连接电视…', expired: '房间已过期，请扫描电视上的新二维码。',
    fullscreen: '全屏', leaveFullscreen: '退出全屏', joystick: '左侧任意位置按住滑动来移动', actionALabel: 'A 榴弹', actionBLabel: 'B 机枪',
    select: '选择', start: '开始 / 暂停', selectLabel: 'SELECT 选择模式', startLabel: 'START 开始或暂停',
    connectionError: '暂时无法连接电视，请确认手机和电视处于同一局域网。', cooling: '秒',
  };
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = messages[el.dataset.i18n]; });
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
  const storageKey = `jackal-controller:${room}`;
  let session = '';
  try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) { /* Private browser storage may be unavailable. */ }
  let ws = null, connected = false, player = 0, seq = 0, attempts = 0;
  let reconnectTimer = 0, helloTimer = 0, lastSend = 0, lastSent = '', terminal = false, leaving = false;
  let stickPointer = null, stickX = 0, stickY = 0;
  let stickOriginX = 0, stickOriginY = 0, stickRadius = 1;
  const actionPointers = new Map();
  const keys = new Set();
  const input = { x: 0, y: 0, a: false, b: false, start: false, select: false };
  const isVisible = () => !document.hidden && !leaving;
  const setMessage = (key, error = false) => { $('message').textContent = messages[key] || key; root.dataset.error = String(error); };
  function showConnection(key) {
    $('connection-text').textContent = messages[key];
    root.dataset.connected = String(connected);
    for (const action of ['a', 'b', 'start', 'select']) $(`button-${action}`).disabled = !connected;
    stickZone.setAttribute('aria-disabled', String(!connected));
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
    for (const action of ['a', 'b', 'start', 'select']) $(`button-${action}`).classList.toggle('pressed', input[action]);
    updateStick();
  }
  function sendInput(force = false) {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    const state = JSON.stringify(input);
    if (!force && ((state === lastSent && now - lastSend < 250) || now - lastSend < 30)) return;
    try {
      ws.send(JSON.stringify({ type: 'input', ...input, seq: ++seq }));
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
  function applyState(state) {
    if (!connected) return;
    if (Number.isFinite(state.stage)) $('stage').textContent = String(Math.max(1, state.stage)).padStart(2, '0');
    const mine = Array.isArray(state.players) ? state.players.find(p => Number(p.id) === player) : null;
    if (mine) {
      if (Number.isFinite(mine.lives)) $('lives').textContent = String(Math.max(0, mine.lives));
      if (Number.isFinite(mine.score)) $('score').textContent = String(Math.max(0, mine.score)).padStart(4, '0');
      if (Number.isFinite(mine.passengers)) $('cargo').textContent = String(Math.max(0, Math.floor(mine.passengers)));
      const cooldown = Number(mine.grenadeCooldown) || 0;
      $('button-a').dataset.cooling = String(cooldown > 0);
      $('a-caption').textContent = cooldown > 0 ? `${cooldown.toFixed(1)}${messages.cooling}` : messages.actionA;
    }
    const phaseKey = { title: 'ready', menu: 'ready', lobby: 'ready', ready: 'ready', playing: 'playing', paused: 'paused', gameover: 'gameover', over: 'gameover', victory: 'victory', stageclear: 'victory' }[state.phase];
    if (phaseKey) setMessage(phaseKey);
  }
  function connect() {
    if (!isVisible() || terminal) return;
    clearTimers();
    if (!room || !/^[a-zA-Z0-9_-]{16,128}$/.test(room)) { fail('invalid', true); return; }
    resetControls(false); connected = false; showConnection(attempts ? 'reconnecting' : 'connecting');
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
      socket.send(JSON.stringify({ type: 'hello', ...(session ? { session } : {}) }));
    });
    socket.addEventListener('message', event => {
      if (socket !== ws || typeof event.data !== 'string' || event.data.length > 32768) return;
      let data; try { data = JSON.parse(event.data); } catch (_) { return; }
      if (!data || typeof data !== 'object') return;
      if (data.type === 'welcome' && [1, 2].includes(data.player) && typeof data.session === 'string') {
        clearTimeout(helloTimer); helloTimer = 0;
        session = data.session; try { sessionStorage.setItem(storageKey, session); } catch (_) {}
        player = data.player; connected = true; attempts = 0; root.dataset.player = String(player);
        $('player-number').textContent = `P${player}`; $('player-name').textContent = messages[player === 1 ? 'gold' : 'cyan'];
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
    if (!connected || stickPointer !== null || event.button > 0) return;
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
  ['a', 'b', 'start', 'select'].forEach(action => {
    const button = $(`button-${action}`);
    button.addEventListener('pointerdown', event => {
      if (!connected || event.button > 0) return;
      event.preventDefault(); actionPointers.set(event.pointerId, action);
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      updateInput(); sendInput(true); vibrate(action === 'a' ? 10 : 20);
    });
    const release = event => {
      if (actionPointers.get(event.pointerId) !== action) return;
      actionPointers.delete(event.pointerId); updateInput(); sendInput(true);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
    button.addEventListener('keydown', event => {
      if (!connected || ![' ', 'Enter'].includes(event.key)) return;
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
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!connected || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift', 'z', 'x', 'b'].includes(key)) return;
    if ((event.target === $('retry') || event.target === $('fullscreen')) && [' ', 'Enter'].includes(key)) return;
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
  document.addEventListener('contextmenu', event => event.preventDefault());
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
