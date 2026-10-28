(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const english = !/^zh\b/i.test(navigator.language || 'zh');
  const messages = english ? {
    controller: 'NES CONTROLLER', yourPlayer: 'YOUR CONTROLLER', move: 'MOVE · LEFT STICK',
    actionA: 'ACTION A', actionB: 'ACTION B', hint: 'SELECT chooses · START begins / pauses', rotate: 'Turn your phone sideways for a better grip',
    retry: 'Reconnect', connecting: 'Connecting', connected: 'Connected', reconnecting: 'Reconnecting', offline: 'Disconnected',
    waiting: 'Joining the room on your TV…', ready: 'SELECT chooses the mode. START begins the game.', playing: 'Game running on the TV. Controls follow the loaded ROM.',
    paused: 'Game paused on TV.', gameover: 'Round over. Use START on the TV title screen.', victory: 'Stage clear! Get ready for the next wave.',
    lost: 'Connection lost. Controls released — reconnecting…', full: 'This room already has two players. Try again when a place is free.',
    invalid: 'This room is unavailable. Scan the current QR code on your TV.', waitingPlayer: 'Waiting for a place',
    gold: 'Player 1', cyan: 'Player 2', joining: 'Connecting to your TV…', expired: 'Room expired. Scan the new QR code on your TV.',
    fullscreen: 'Full screen', leaveFullscreen: 'Exit full screen', joystick: 'Movement joystick', actionALabel: 'A', actionBLabel: 'B',
    select: 'Select', start: 'Start / pause', selectLabel: 'SELECT: choose mode', startLabel: 'START: begin or pause',
    connectionError: 'Cannot reach the TV. Keep your phone and TV on the same local network.',
    currentRom: 'CURRENT ROM', importRom: 'Import ROM', replaceRom: 'Replace ROM', noRom: 'No ROM imported',
    chooseRom: 'Choose a .nes file, up to 16 MiB.', uploading: 'Uploading', verifying: 'Checking ROM on the TV…',
    imported: 'ROM imported. Press START to play.', uploadFailed: 'Import failed. The previous ROM is unchanged.',
    wrongFile: 'Choose an uncompressed .nes file.', tooLarge: 'ROM must be between 16 bytes and 16 MiB.',
    invalidRom: 'Invalid or unsupported NES ROM. The previous ROM is unchanged.',
    romBusy: 'Another ROM is being imported. Try again shortly.', uploadNetwork: 'Upload interrupted. Check the local network and try again.',
    loadRom: 'Import a ROM from your phone to begin.', loading: 'Loading the ROM on the TV…', romError: 'The TV could not load this ROM. Check the TV for details.',
  } : {
    controller: 'NES 手机控制器', yourPlayer: '你的控制器', move: '移动 · 左侧摇杆',
    actionA: '动作 A', actionB: '动作 B', hint: 'SELECT 选择 · START 开始 / 暂停', rotate: '横屏握持，体验更好',
    retry: '重新连接', connecting: '正在连接', connected: '已连接', reconnecting: '正在重连', offline: '连接已断开',
    waiting: '正在加入电视上的房间…', ready: 'SELECT 选择模式，START 开始游戏。', playing: '游戏在电视上运行，按键功能以导入的 ROM 为准。',
    paused: '游戏已在电视上暂停。', gameover: '本局结束，回到标题画面后按 START 开始。', victory: '关卡完成，准备迎接下一波！',
    lost: '连接暂时中断，已松开所有按键，正在重连…', full: '房间已有两名玩家，空出位置后可重新连接。',
    invalid: '房间不可用，请重新扫描电视上的二维码。', waitingPlayer: '等待加入房间',
    gold: '玩家 1', cyan: '玩家 2', joining: '正在连接电视…', expired: '房间已过期，请扫描电视上的新二维码。',
    fullscreen: '全屏', leaveFullscreen: '退出全屏', joystick: '方向摇杆', actionALabel: 'A', actionBLabel: 'B',
    select: '选择', start: '开始 / 暂停', selectLabel: 'SELECT 选择模式', startLabel: 'START 开始或暂停',
    connectionError: '暂时无法连接电视，请确认手机和电视处于同一局域网。',
    currentRom: '当前 ROM', importRom: '导入 ROM', replaceRom: '更换 ROM', noRom: '尚未导入 ROM',
    chooseRom: '请选择 .nes 文件，最大 16 MiB。', uploading: '正在上传', verifying: '正在电视上检查 ROM…',
    imported: 'ROM 已导入，按 START 开始游戏。', uploadFailed: '导入失败，原 ROM 保持不变。',
    wrongFile: '请选择解压后的 .nes 文件。', tooLarge: 'ROM 大小必须为 16 字节至 16 MiB。',
    invalidRom: 'NES ROM 无效或暂不支持，原 ROM 保持不变。',
    romBusy: '其他玩家正在导入 ROM，请稍后重试。', uploadNetwork: '上传中断，请检查局域网连接后重试。',
    loadRom: '请从手机导入 ROM 后开始。', loading: '电视正在加载 ROM…', romError: '电视无法加载该 ROM，请查看电视上的详细信息。',
  };
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = messages[el.dataset.i18n]; });
  $('joystick').setAttribute('aria-label', messages.joystick);
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
  const room = new URL(location.href).searchParams.get('room') || '';
  const storageKey = `nes-controller:${room}`;
  let session = '';
  try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) { /* Private browser storage may be unavailable. */ }
  let ws = null, connected = false, player = 0, seq = 0, attempts = 0;
  let uploading = false, upload = null, infoRequest = null;
  let reconnectTimer = 0, helloTimer = 0, lastSend = 0, lastSent = '', terminal = false, leaving = false;
  let stickPointer = null, stickX = 0, stickY = 0;
  const actionPointers = new Map();
  const keys = new Set();
  const input = { x: 0, y: 0, a: false, b: false, start: false, select: false };
  const isVisible = () => !document.hidden && !leaving;
  const setMessage = (key, error = false) => { $('message').textContent = messages[key] || key; root.dataset.error = String(error); };
  function showConnection(key) {
    $('connection-text').textContent = messages[key];
    root.dataset.connected = String(connected);
    for (const action of ['a', 'b', 'start', 'select']) $(`button-${action}`).disabled = !connected || uploading;
    $('joystick').setAttribute('aria-disabled', String(!connected || uploading));
    $('import-rom').disabled = !connected || uploading;
  }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) {} }
  function updateStick() {
    const radius = $('joystick').clientWidth * .265;
    $('joystick-thumb').style.transform = `translate(${input.x * radius}px,${input.y * radius}px)`;
    $('joystick').classList.toggle('active', !!(input.x || input.y));
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
  function resetControls(send = true) {
    stickPointer = null; stickX = stickY = 0; actionPointers.clear(); keys.clear(); updateInput();
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
  function applyInfo(info) {
    if (!info || typeof info !== 'object') return;
    if (typeof info.title === 'string') {
      const title = info.title.slice(0, 100);
      $('app-title').textContent = title;
      document.title = `${title} · ${messages.controller}`;
    }
    const rom = info.rom;
    const name = rom && typeof rom.name === 'string' ? rom.name.slice(0, 255) : '';
    $('rom-name').textContent = name || messages.noRom;
    $('rom-name').title = name || messages.noRom;
    $('import-rom').textContent = name ? messages.replaceRom : messages.importRom;
  }
  async function loadInfo() {
    if (!room || infoRequest || uploading || leaving) return;
    infoRequest = new AbortController();
    const timeout = setTimeout(() => infoRequest?.abort(), 8000);
    try {
      const response = await fetch(`/api/info?room=${encodeURIComponent(room)}`, { signal: infoRequest.signal, cache: 'no-store' });
      if (response.ok) applyInfo(await response.json());
    } catch (_) { /* The WebSocket reports actionable connection errors. */ }
    finally { clearTimeout(timeout); infoRequest = null; }
  }
  function applyState(state) {
    if (!connected) return;
    const phaseKey = { title: 'ready', menu: 'ready', lobby: 'loadRom', empty: 'loadRom', ready: 'ready', playing: 'playing', running: 'playing', loading: 'loading', paused: 'paused', error: 'romError' }[state.phase];
    if (phaseKey) setMessage(phaseKey, state.phase === 'error');
    if (state.rom) applyInfo({ rom: state.rom });
  }
  function uploadStatus(message, failed = false) {
    $('rom-upload').hidden = false;
    $('rom-status').textContent = message;
    $('rom-upload').dataset.error = String(failed);
    $('rom-progress').hidden = !uploading;
  }
  function uploadRom(file) {
    if (!file || uploading) return;
    resetControls();
    if (!/\.nes$/i.test(file.name)) { uploadStatus(messages.wrongFile, true); return; }
    if (file.size < 16 || file.size > 16 * 1024 * 1024) { uploadStatus(messages.tooLarge, true); return; }
    // Mobile file pickers may briefly hide the page and reconnect its WebSocket.
    // The HTTP upload has its own room authentication and can start during that reconnect.
    if (terminal || !/^[a-zA-Z0-9_-]{16,128}$/.test(room)) { uploadStatus(messages.expired, true); return; }
    uploading = true;
    showConnection(connected ? 'connected' : 'reconnecting');
    $('rom-progress').value = 0;
    uploadStatus(`${messages.uploading} 0%`);
    const request = new XMLHttpRequest();
    upload = request;
    request.open('POST', `/api/rom?room=${encodeURIComponent(room)}`);
    request.timeout = 180000;
    request.setRequestHeader('Content-Type', 'application/octet-stream');
    request.setRequestHeader('X-ROM-Name', encodeURIComponent(file.name));
    request.upload.addEventListener('progress', event => {
      if (upload !== request || !event.lengthComputable) return;
      const percent = Math.min(100, Math.round(event.loaded / event.total * 100));
      $('rom-progress').value = percent;
      uploadStatus(percent === 100 ? messages.verifying : `${messages.uploading} ${percent}%`);
    });
    function finish(message, failed) {
      if (upload !== request) return;
      upload = null; uploading = false;
      resetControls(); showConnection(connected ? 'connected' : 'offline');
      uploadStatus(message, failed); loadInfo();
    }
    request.addEventListener('load', () => {
      let data = {}; try { data = JSON.parse(request.responseText); } catch (_) {}
      if (request.status >= 200 && request.status < 300) {
        applyInfo(data);
        finish(messages.imported, false);
      } else {
        const code = String(data.error || data.code || '');
        const message = request.status === 401 || request.status === 403 ? messages.expired
          : request.status === 413 ? messages.tooLarge
          : request.status === 409 ? messages.romBusy
          : request.status === 400 || /rom|mapper|format|size/.test(code) ? messages.invalidRom
          : messages.uploadFailed;
        finish(message, true);
      }
    });
    for (const event of ['error', 'timeout', 'abort']) request.addEventListener(event, () => finish(messages.uploadNetwork, true));
    try { request.send(file); } catch (_) { finish(messages.uploadNetwork, true); }
  }
  $('rom-name').textContent = messages.noRom;
  $('import-rom').addEventListener('click', () => {
    if (!connected || uploading) return;
    resetControls(); $('rom-file').value = ''; $('rom-file').click();
  });
  $('rom-file').addEventListener('change', () => uploadRom($('rom-file').files[0]));
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
        resetControls(false); showConnection('connected'); setMessage('ready'); sendInput(true); loadInfo();
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

  const stick = $('joystick');
  function moveStick(event) {
    const rect = stick.getBoundingClientRect();
    const radius = Math.max(1, rect.width * .265);
    let x = (event.clientX - rect.left - rect.width / 2) / radius;
    let y = (event.clientY - rect.top - rect.height / 2) / radius;
    const length = Math.hypot(x, y);
    if (length < .13) x = y = 0;
    else if (length > 1) { x /= length; y /= length; }
    stickX = Math.round(x * 1000) / 1000; stickY = Math.round(y * 1000) / 1000; updateInput(); sendInput();
  }
  stick.addEventListener('pointerdown', event => {
    if (!connected || uploading || stickPointer !== null || event.button > 0) return;
    event.preventDefault(); stickPointer = event.pointerId;
    try { stick.setPointerCapture(event.pointerId); } catch (_) {}
    moveStick(event); vibrate(8);
  });
  stick.addEventListener('pointermove', event => { if (event.pointerId === stickPointer) { event.preventDefault(); moveStick(event); } });
  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null; stickX = stickY = 0; updateInput(); sendInput(true);
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => stick.addEventListener(name, releaseStick));
  ['a', 'b', 'start', 'select'].forEach(action => {
    const button = $(`button-${action}`);
    button.addEventListener('pointerdown', event => {
      if (!connected || uploading || event.button > 0) return;
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
      if (!connected || uploading || ![' ', 'Enter'].includes(event.key)) return;
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
    if (!connected || uploading || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift', 'z', 'x', 'b'].includes(key)) return;
    if ((event.target === $('retry') || event.target === $('fullscreen') || event.target === $('import-rom') || event.target === $('rom-file')) && [' ', 'Enter'].includes(key)) return;
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
  window.addEventListener('pagehide', () => { leaving = true; if (upload) upload.abort(); if (infoRequest) infoRequest.abort(); clearTimers(); resetControls(); connected = false; if (ws) ws.close(); });
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

  let infoTimer = setInterval(() => { if (isVisible() && connected) loadInfo(); }, 10000);
  window.addEventListener('pagehide', () => { clearInterval(infoTimer); infoTimer = 0; });
  window.addEventListener('pageshow', event => { if (event.persisted && !infoTimer) infoTimer = setInterval(() => { if (isVisible() && connected) loadInfo(); }, 10000); });
  connect();
})();
