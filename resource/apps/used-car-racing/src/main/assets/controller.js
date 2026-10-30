(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const english = !/^zh\b/i.test(navigator.language || 'zh');
  const messages = english ? {
    title: 'USED CAR RACING', controller: 'DRIVING REMOTE / UCR—01', status: 'Vehicle instruments', telemetry: 'Live vehicle telemetry', controls: 'Driving controls', yourPlayer: 'DRIVER', track: 'CIRCUIT', gear: 'GEAR', rotate: '↻ Turn sideways: left hand steers, right hand works the pedals', retry: 'Reconnect', connecting: 'Connecting', connected: 'Connected', reconnecting: 'Reconnecting', offline: 'Disconnected', waiting: 'Joining the room on your TV…', lost: 'Connection lost. All controls released. Reconnecting…', full: 'Both seats are occupied. Try again when a seat is free.', invalid: 'Room unavailable. Scan the current QR code on your TV.', waitingPlayer: 'Joining room', playerOne: 'Driver 1', playerTwo: 'Driver 2', expired: 'Room expired. Scan the new QR code on your TV.', fullscreen: 'Full screen', leaveFullscreen: 'Exit full screen', start: 'Race / pause', startLabel: 'START: begin, pause, or continue', connectionError: 'Cannot reach your TV. Connect both devices to the same local network.', playOffline: 'CONTROLS OFFLINE', playReady: 'GARAGE / READY', playActive: 'LIVE TELEMETRY', playPaused: 'RACE PAUSED', playFinished: 'RACE COMPLETE', results: 'Results are on the TV. START or SELECT returns to the garage.', move: 'TOUCH ANYWHERE LEFT · SLIDE SIDEWAYS TO STEER', actionA: 'Throttle · hold to accelerate', actionB: 'Brake · hold to build force', hint: 'TOP RIGHT: GAS · BOTTOM RIGHT: BRAKE · Eyes on the road', ready: 'Slide left/right: track · SELECT: redraw car · START: race', playing: 'SELECT: camera · Hold 0.8s at low speed for D/R · Release brake to reduce force.', paused: 'Controls released · START resumes the race', countdown: 'Get ready. The car will move when the race starts.', joystick: 'Hold anywhere on the left and slide horizontally to steer', actionALabel: 'Throttle: hold anywhere in the upper right half to accelerate', actionBLabel: 'Brake: hold anywhere in the lower right half to build simulated pedal force', select: 'Camera · hold for D/R', selectLabel: 'SELECT: redraw the car in the garage; tap to change camera during a race, or hold for 0.8 seconds below 1.2 m/s to switch drive/reverse', broken: 'BRAKE PEDAL BROKEN', brokenHint: 'Brake pedal broken: braking is unavailable for the rest of this race.', forceWarning: 'HIGH PEDAL FORCE', lapLabel: 'LAP', rankLabel: 'POSITION'
  } : {
    title: '极品二手车', controller: '驾驶控制器 / UCR—01', status: '车辆仪表', telemetry: '实时车辆状态', controls: '驾驶操作', yourPlayer: '驾驶席', track: '赛道', gear: '档位', rotate: '↻ 横屏驾驶，左右手分别操控方向与踏板', retry: '重新连接', connecting: '正在连接', connected: '已连接', reconnecting: '正在重连', offline: '连接已断开', waiting: '正在加入电视上的房间…', lost: '连接中断，已释放全部操作，正在重连…', full: '两个驾驶席均已有人，空出位置后可重新连接。', invalid: '房间不可用，请扫描电视上的当前二维码。', waitingPlayer: '正在加入', playerOne: '驾驶员 1', playerTwo: '驾驶员 2', expired: '房间已过期，请扫描电视上的新二维码。', fullscreen: '全屏', leaveFullscreen: '退出全屏', start: '开始 / 暂停', startLabel: 'START 开始、暂停或继续', connectionError: '暂时无法连接电视，请让手机和电视连接同一局域网。', playOffline: '手柄未连接', playReady: '车库 / 准备出发', playActive: '实时车辆状态', playPaused: '比赛已暂停', playFinished: '本场比赛完成', results: '成绩已显示在电视上，按 START 或 SELECT 返回车库。', move: '左侧任意位置落指 · 左右滑动转向', actionA: '油门 · 按住加速', actionB: '刹车 · 按住蓄力', hint: '右上油门 · 右下刹车 · 无需低头找按钮', ready: '左右滑动选赛道 · SELECT 重抽车辆 · START 开赛', playing: 'SELECT 短按切镜头，低速长按 0.8 秒切 D/R；松开刹车降低踏板力。', paused: '已释放全部操作 · 按 START 继续比赛', countdown: '准备起步，比赛开始后车辆才会移动。', joystick: '左侧任意位置按住，左右滑动转向', actionALabel: '油门：右上半区任意位置按住加速', actionBLabel: '刹车：右下半区任意位置按住，持续增加模拟踏板力', select: '镜头 · 长按换挡', selectLabel: 'SELECT 车库中重抽车辆；比赛中短按切换镜头，车速低于 1.2 米每秒时长按 0.8 秒切换前进或倒车', broken: '刹车踏板已断裂', brokenHint: '刹车踏板已断裂，本场比赛后续无法刹车。', forceWarning: '踏板力过高', lapLabel: '圈数', rankLabel: '名次'
  };
  Object.assign(messages, english ? {
    steeringMode:'Steering mode', stickMode:'Virtual stick', gyroMode:'Gyroscope', center:'Recenter', backLocal:'Back to LAN',
    gyroReady:'Turn the phone like a steering wheel · 45° gives full steering', gyroGarage:'Garage: slide on the left to choose a track · Tilt steering starts with the race',
    gyroCalibrating:'Hold the phone comfortably, slightly upright. This position becomes center.', gyroStandby:'Gyroscope ready · Steering stays neutral until the race',
    gyroRequesting:'Waiting for motion permission…', gyroPermission:'Gyroscope preference saved · Tap Gyroscope to allow motion access',
    gyroDenied:'Motion permission was denied. Virtual stick remains available.', gyroInsecure:'This browser needs a secure page for motion access. Use the virtual stick here.',
    gyroUnavailable:'No motion data received. Virtual stick is active; you can retry Gyroscope.', gyroStale:'Motion data stopped. Controls released; hold still to recenter.',
    gyroUpright:'Hold the phone slightly upright like a wheel. Controls are released while it is flat.', gyroOpening:'Opening secure gyroscope controls…', gyroFailed:'Secure controls could not open. Allow the new tab or keep using the virtual stick.'
  } : {
    steeringMode:'转向方式', stickMode:'虚拟摇杆', gyroMode:'陀螺仪', center:'校准中立', backLocal:'返回局域网',
    gyroReady:'像转方向盘一样转动手机 · 约 45° 打满方向', gyroGarage:'车库仍在左侧滑动选赛道 · 开赛后启用陀螺仪转向',
    gyroCalibrating:'请舒适横握并稍立起手机，当前位置将设为中立。', gyroStandby:'陀螺仪已就绪 · 比赛开始前保持中立',
    gyroRequesting:'正在请求运动传感器权限…', gyroPermission:'已记住陀螺仪偏好 · 点击「陀螺仪」授权启用',
    gyroDenied:'运动权限未获允许，可继续使用虚拟摇杆。', gyroInsecure:'此浏览器需要安全页面才能读取运动传感器，可先使用虚拟摇杆。',
    gyroUnavailable:'未收到传感器数据，已使用虚拟摇杆；可再次尝试陀螺仪。', gyroStale:'传感器数据已中断，操作已释放；请握稳手机重新校准。',
    gyroUpright:'请像方向盘一样稍立起手机，平放时会释放操作。', gyroOpening:'正在打开安全的陀螺仪控制页面…', gyroFailed:'安全手柄未能打开，请允许新页面，或继续使用虚拟摇杆。'
  });
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = messages[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', messages[el.dataset.i18nAria]); });
  $('joystick-zone').setAttribute('aria-label', messages.joystick);
  $('button-a').setAttribute('aria-label', messages.actionALabel);
  $('button-b').setAttribute('aria-label', messages.actionBLabel);
  $('button-start').setAttribute('aria-label', messages.startLabel);
  $('button-select').setAttribute('aria-label', messages.selectLabel);
  $('button-select').title = messages.selectLabel;
  $('a-caption').textContent = messages.actionA;
  $('b-caption').textContent = messages.actionB;
  $('select-caption').textContent = messages.select;
  $('start-caption').textContent = messages.start;
  $('fullscreen').setAttribute('aria-label', messages.fullscreen);
  $('fullscreen').title = messages.fullscreen;
  $('player-name').textContent = messages.waitingPlayer;
  const root = $('controller');
  const stick = $('joystick'), stickZone = $('joystick-zone');
  const room = window.UsedCarTransport && window.UsedCarTransport.room || new URL(location.href).searchParams.get('room') || '';
  const storageKey = `used-car-racing-controller:${room}`;
  let session = '';
  try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) { /* Private browser storage may be unavailable. */ }
  let ws = null, connected = false, player = 0, seq = 0, attempts = 0;
  let reconnectTimer = 0, helloTimer = 0, lastSend = 0, lastSent = '', terminal = false, leaving = false;
  let gamePhase = 'garage', brakeWasBroken = false, relaying = false, focused = true;
  let steeringMode = 'stick', gyroValue = 0, gyroDegrees = 0, lastGyroStatus = '', switching = 0, resetting = false, gyro = null;
  let stickPointer = null, stickX = 0, stickY = 0;
  let stickOriginX = 0, stickOriginY = 0, stickRadius = 1;
  const actionPointers = new Map();
  const keys = new Set();
  const input = { x: 0, y: 0, a: false, b: false, start: false, select: false, cancelSeq: 0 };
  const isVisible = () => !document.hidden && !leaving && !relaying;
  const setMessage = (key, error = false) => { $('message').textContent = messages[key] || key; root.dataset.error = String(error); };
  function titlePhase() { return ['garage', 'title', 'menu', 'lobby', 'ready'].includes(gamePhase); }
  function finishedPhase() { return ['results', 'ending', 'gameover', 'over', 'victory'].includes(gamePhase); }
  function canAct() { return !finishedPhase() && gamePhase !== 'paused'; }
  function gyroDriving() { return steeringMode === 'gyro' && !titlePhase() && !finishedPhase() && gamePhase !== 'paused'; }
  function updateGyroAccess() { if (gyro) gyro.setActive(gyroDriving() && connected && isVisible() && focused); }
  function updateSteeringUI() {
    root.dataset.steering = steeringMode; root.dataset.gyroStatus = lastGyroStatus;
    $('steering-stick').textContent = messages.stickMode; $('steering-gyro').textContent = messages.gyroMode;
    $('steering-local').textContent = messages.backLocal; $('steering-local').hidden = !(window.UsedCarSecureSteering && window.UsedCarSecureSteering.isCompanion);
    $('steering-center').textContent = messages.center; $('steering-settings').setAttribute('aria-label', messages.steeringMode);
    $('steering-stick').setAttribute('aria-pressed', String(steeringMode === 'stick'));
    $('steering-gyro').setAttribute('aria-pressed', String(steeringMode === 'gyro'));
    $('steering-center').hidden = steeringMode !== 'gyro'; $('steering-center').disabled = !connected;
    const statusKey = {requesting:'gyroRequesting',permission:'gyroPermission',denied:'gyroDenied',insecure:'gyroInsecure',unavailable:'gyroUnavailable',stale:'gyroStale',upright:'gyroUpright',calibrating:'gyroCalibrating',standby:'gyroStandby',opening:'gyroOpening',failed:'gyroFailed'}[lastGyroStatus];
    $('steering-caption').textContent = steeringMode === 'gyro' && titlePhase() ? messages.gyroGarage : steeringMode === 'gyro' && lastGyroStatus === 'ready' ? messages.gyroReady + ' · ' + Math.round(gyroDegrees) + '°' : statusKey ? messages[statusKey] : messages.move;
    const guide = document.querySelector('.steering-guide svg');
    guide.style.transform = steeringMode === 'gyro' ? 'rotate(' + gyroDegrees + 'deg)' : '';
  }
  function updateControlAccess() {
    for (const action of ['a', 'b', 'start', 'select']) {
      $(`button-${action}`).disabled = !connected || ((action === 'a' || action === 'b') && !canAct());
    }
    stickZone.setAttribute('aria-disabled', String(!connected || !canAct()));
    root.dataset.state = !connected ? 'offline' : finishedPhase() ? 'finished' : titlePhase() ? 'ready' : gamePhase === 'paused' ? 'paused' : 'active';
    const key = !connected ? 'playOffline' : finishedPhase() ? 'playFinished' : titlePhase() ? 'playReady' : gamePhase === 'paused' ? 'playPaused' : 'playActive';
    $('play-status').textContent = messages[key];
    updateGyroAccess(); updateSteeringUI();
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
    const keyboardSteer = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    input.x = stickPointer !== null ? stickX : keyboardSteer || (gyroDriving() && focused && isVisible() ? gyroValue : 0);
    input.y = 0;
    input.a = [...actionPointers.values()].includes('a') || keys.has('ArrowUp') || keys.has(' ') || keys.has('z') || keys.has('button:a');
    input.b = [...actionPointers.values()].includes('b') || keys.has('ArrowDown') || keys.has('b') || keys.has('x') || keys.has('button:b');
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
  function markCancellation() {
    input.cancelSeq = input.cancelSeq >= Number.MAX_SAFE_INTEGER ? 0 : input.cancelSeq + 1;
  }
  function hasHeldInput() { return input.x !== 0 || input.y !== 0 || input.a || input.b || input.start || input.select; }
  function resetControls(send = true, resetGyro = true) {
    const held = hasHeldInput(); resetting = true;
    clearStick(); actionPointers.clear(); keys.clear(); gyroValue = 0; gyroDegrees = 0;
    if (gyro && resetGyro) gyro.recenter();
    updateInput(); resetting = false;
    if (held) markCancellation();
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
    const track = english ? state.trackNameEn || state.trackName : state.trackName || state.trackNameEn;
    if (typeof track === 'string' && track.length) setStat('track-name', track);
    const before = gamePhase;
    gamePhase = typeof state.phase === 'string' ? state.phase : gamePhase;
    if (before !== gamePhase && (gamePhase === 'paused' || finishedPhase() || titlePhase())) resetControls();
    updateControlAccess();
    const phaseKey = { garage:'ready', title:'ready', lobby:'ready', countdown:'countdown', race:'playing', playing:'playing', paused:'paused', results:'results' }[gamePhase];
    if (phaseKey) setMessage(phaseKey);
    if (mine) {
      // The room slot identifies the socket; a lone slot 2 can still drive TV 1P.
      // Never replace `player`: it remains the authenticated telemetry lookup key.
      const driver = [1, 2].includes(Number(mine.driver)) ? Number(mine.driver) : player;
      root.dataset.player = String(driver);
      $('player-number').textContent = `P${driver}`;
      const name = english ? mine.carNameEn || mine.carName : mine.carName || mine.carNameEn;
      setStat('player-name', typeof name === 'string' && name.length ? name : messages[driver === 1 ? 'playerOne' : 'playerTwo']);
      if (Number.isFinite(mine.speedKmh)) setStat('speed', Math.round(Math.abs(mine.speedKmh)));
      if (Number.isFinite(mine.gear) || typeof mine.gear === 'string') setStat('gear', mine.gear === -1 ? 'R' : mine.gear === 0 ? 'N' : mine.gear);
      if (Number.isFinite(mine.lap)) setStat('lap', messages.lapLabel + ' ' + Math.max(1,Math.floor(mine.lap)) + ' / ' + (state.laps || 2));
      if (Number.isFinite(mine.rank)) setStat('rank', messages.rankLabel + ' ' + Math.max(1,Math.floor(mine.rank)));
      const force = Number.isFinite(mine.brakeForce) ? Math.max(0, mine.brakeForce) : null;
      if (force !== null) {
        setStat('force', Math.round(force));
        $('force-bar').style.width = Math.min(100, force / 1800 * 100) + '%';
      }
      const broken = mine.brakeBroken === true;
      root.dataset.brakeBroken = String(broken);
      $('brake-alert').textContent = broken ? messages.broken : force >= 1400 ? messages.forceWarning : '';
      if (broken && !brakeWasBroken) vibrate([50,60,90]);
      brakeWasBroken = broken;
      if (broken && (gamePhase === 'race' || gamePhase === 'playing')) setMessage('brokenHint');
    }
  }
  function connect() {
    if (!isVisible() || terminal) return;
    clearTimers();
    if (!room || !/^[a-zA-Z0-9_-]{16,128}$/.test(room)) { fail('invalid', true); return; }
    resetControls(false); connected = false; gamePhase = 'garage'; showConnection(attempts ? 'reconnecting' : 'connecting');
    setMessage(attempts > 3 ? 'connectionError' : attempts ? 'lost' : 'waiting', attempts > 3);
    $('error-actions').hidden = true;
    const previous = ws;
    ws = null;
    if (previous) previous.close();
    let socket;
    try { const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws?room=${encodeURIComponent(room)}`; socket = window.UsedCarTransport ? window.UsedCarTransport.createSocket(url) : new WebSocket(url); }
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
    // Keep steering independent from vertical finger motion: pressure and braking
    // belong to the pedal surface, never to an accidental downward steering drag.
    const raw = Math.max(-1, Math.min(1, (event.clientX - stickOriginX) / stickRadius));
    const magnitude = Math.abs(raw);
    const curved = magnitude < .07 ? 0 : Math.pow((magnitude - .07) / .93, 1.35);
    stickX = Math.round((raw < 0 ? -1 : 1) * curved * 1000) / 1000;
    stickY = 0;
    updateInput(); sendInput();
  }
  function pressStick(event) {
    if (!connected || !canAct() || gyroDriving() || stickPointer !== null || event.button > 0) return;
    event.preventDefault();
    const rect = stickZone.getBoundingClientRect();
    stickPointer = event.pointerId;
    stickOriginX = event.clientX; stickOriginY = event.clientY;
    stickX = stickY = 0;
    stick.style.left = `${stickOriginX - rect.left}px`;
    stick.style.top = `${stickOriginY - rect.top}px`;
    stickRadius = Math.max(1, Math.min(115, rect.width * .22));
    try { stickZone.setPointerCapture(event.pointerId); } catch (_) {}
    updateInput(); sendInput(true); vibrate(6);
  }
  stickZone.addEventListener('pointerdown', pressStick);
  stickZone.addEventListener('pointermove', event => { if (event.pointerId === stickPointer) { event.preventDefault(); moveStick(event); } });
  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    const held = hasHeldInput();
    clearStick(); updateInput();
    if (event.type !== 'pointerup' && held) markCancellation();
    sendInput(true);
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
    const action = event.clientY < bounds.top + bounds.height / 2 ? 'a' : 'b';
    pressAction(action, event);
  }, true);
  ['a', 'b', 'start', 'select'].forEach(action => {
    const button = $(`button-${action}`);
    button.addEventListener('pointerdown', event => pressAction(action, event));
    const release = event => {
      if (actionPointers.get(event.pointerId) !== action) return;
      const held = hasHeldInput();
      actionPointers.delete(event.pointerId); updateInput();
      if (event.type !== 'pointerup' && held) markCancellation();
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
      const held = hasHeldInput();
      if (keys.delete(`button:${action}`)) {
        updateInput();
        if (held) markCancellation();
        sendInput(true);
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (editableTarget(event.target)) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!connected || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Shift', 'z', 'x', 'b'].includes(key)) return;
    if (event.target.closest && event.target.closest('#retry, #fullscreen, #steering-settings') && [' ', 'Enter'].includes(key)) return;
    if (!canAct() && !['Enter', 'Shift'].includes(key)) { event.preventDefault(); return; }
    event.preventDefault(); keys.add(key); updateInput(); sendInput(true);
  });
  document.addEventListener('keyup', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!keys.has(key)) return;
    event.preventDefault(); keys.delete(key); updateInput(); sendInput(true);
  });
  window.addEventListener('blur', () => { focused = false; resetControls(); updateGyroAccess(); });
  window.addEventListener('focus', () => { focused = true; resetControls(); updateGyroAccess(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimers(); resetControls(); connected = false; showConnection('offline'); if (ws) ws.close(); }
    else if (!terminal) { focused = true; connect(); }
  });
  window.addEventListener('pagehide', () => { leaving = true; clearTimers(); resetControls(); connected = false; if (ws) ws.close(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { leaving = false; terminal = false; connect(); } });
  window.addEventListener('online', () => { if (!connected && !terminal) connect(); });
  window.addEventListener('resize', () => { resetControls(); updateGyroAccess(); });
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
    if (editableTarget(event.target) || event.target.closest('#fullscreen, #retry, #steering-settings')) return;
    event.preventDefault();
  }, { passive: false });
  // Pointer capture is best effort on older WebViews. A release outside a zone
  // must still clear its input when capture is unavailable or interrupted.
  ['pointerup', 'pointercancel'].forEach(name => window.addEventListener(name, event => {
    const held = hasHeldInput();
    let changed = actionPointers.delete(event.pointerId);
    if (event.pointerId === stickPointer) { clearStick(); changed = true; }
    if (changed) {
      updateInput();
      if (event.type !== 'pointerup' && held) markCancellation();
      sendInput(true);
    }
  }));

  if (!window.PointerEvent) {
    function legacyPointer(touch, event) {
      return {pointerId:'touch:' + touch.identifier, button:0, clientX:touch.clientX, clientY:touch.clientY,
        preventDefault:() => event.preventDefault()};
    }
    document.addEventListener('touchstart', event => {
      if (editableTarget(event.target) || event.target.closest('#fullscreen, #retry, #steering-settings')) return;
      event.preventDefault();
      const bounds = document.querySelector('.actions').getBoundingClientRect();
      Array.from(event.changedTouches).forEach(touch => {
        const pointer = legacyPointer(touch,event);
        if (touch.clientX >= bounds.left && touch.clientX < bounds.right) {
          pressAction(touch.clientY < bounds.top + bounds.height / 2 ? 'a' : 'b', pointer);
        } else {
          const button = touch.target && touch.target.closest && touch.target.closest('#button-start, #button-select');
          if (button) pressAction(button.id === 'button-start' ? 'start' : 'select',pointer);
          else pressStick(pointer);
        }
      });
    }, {passive:false});
    document.addEventListener('touchmove', event => {
      if (editableTarget(event.target)) return;
      event.preventDefault();
      Array.from(event.changedTouches).forEach(touch => {
        const pointer = legacyPointer(touch,event);
        if (pointer.pointerId === stickPointer) moveStick(pointer);
      });
    }, {passive:false});
    ['touchend','touchcancel'].forEach(name => document.addEventListener(name,event => {
      const held = hasHeldInput();
      let changed = false;
      Array.from(event.changedTouches).forEach(touch => {
        const pointerId = 'touch:' + touch.identifier;
        if (actionPointers.delete(pointerId)) changed = true;
        if (pointerId === stickPointer) { clearStick(); changed = true; }
      });
      if (changed) {
        event.preventDefault(); updateInput();
        if (name === 'touchcancel' && held) markCancellation();
        sendInput(true);
      }
    }, {passive:false}));
  }

  function saveSteering(mode) { try { localStorage.setItem('used-car-racing-steering', mode); } catch (_) {} }
  function useStick(persist = true) {
    switching++; steeringMode = 'stick'; if (gyro) gyro.disable(); lastGyroStatus = '';
    resetControls(); markCancellation(); sendInput(true); if (persist) saveSteering('stick'); updateSteeringUI();
  }
  function fallbackGyro(reason) {
    steeringMode = 'stick'; if (gyro) gyro.disable(); lastGyroStatus = reason;
    resetControls(); markCancellation(); sendInput(true); updateSteeringUI();
  }
  async function useGyro(requestPermission) {
    if (!window.isSecureContext && requestPermission && window.UsedCarSecureSteering) {
      resetControls(); markCancellation(); sendInput(true);
      const opened = window.UsedCarSecureSteering.open(); lastGyroStatus = opened ? 'opening' : 'failed'; updateSteeringUI(); return;
    }
    const attempt = ++switching; resetControls(); markCancellation(); sendInput(true);
    if (!gyro) { fallbackGyro('unavailable'); return; }
    const enabled = await gyro.enable(requestPermission);
    if (attempt !== switching) return;
    if (enabled) { steeringMode = 'gyro'; saveSteering('gyro'); updateGyroAccess(); }
    else fallbackGyro(gyro.status);
    updateSteeringUI();
  }
  if (window.UsedCarSteering) gyro = new window.UsedCarSteering({
    onChange(value, degrees) { gyroValue = value; gyroDegrees = degrees; if (!resetting) { updateInput(); sendInput(); } updateSteeringUI(); },
    onStatus(status) {
      lastGyroStatus = status;
      if (steeringMode === 'gyro' && status === 'unavailable') { fallbackGyro(status); return; }
      if (steeringMode === 'gyro' && (status === 'stale' || status === 'upright' || status === 'calibrating') && !resetting) resetControls(true, false);
      updateSteeringUI();
    }
  });
  $('steering-stick').addEventListener('click', () => { if (relaying && window.UsedCarSecureSteering) window.UsedCarSecureSteering.close(); useStick(); });
  $('steering-local').addEventListener('click', () => { resetControls(); if (window.UsedCarSecureSteering) window.UsedCarSecureSteering.close(); });
  $('steering-gyro').addEventListener('click', () => useGyro(true));
  $('steering-center').addEventListener('click', () => { resetControls(); markCancellation(); sendInput(true); updateSteeringUI(); });
  window.UsedCarController = {
    getSession() { return session; },
    setSession(value) { if (typeof value === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(value)) { session = value; try { sessionStorage.setItem(storageKey, session); } catch (_) {} } },
    suspendForRelay() { resetControls(); markCancellation(); sendInput(true); relaying = true; clearTimers(); if (ws) ws.close(); ws = null; connected = false; updateControlAccess(); },
    resumeFromRelay() { relaying = false; lastGyroStatus = ''; if (isVisible()) { focused = true; terminal = false; attempts = 0; connect(); } updateSteeringUI(); }
  };
  window.addEventListener('usedcar-secure-status', event => {
    const state = event.detail && event.detail.state;
    if (state === 'failed') { resetControls(); lastGyroStatus = 'failed'; }
    else if (state === 'opening') lastGyroStatus = 'opening';
    else if (state === 'local') lastGyroStatus = '';
    updateSteeringUI();
  });
  let preference = '';
  try { preference = localStorage.getItem('used-car-racing-steering') || ''; } catch (_) {}
  if (preference === 'gyro' || new URL(location.href).searchParams.get('steering') === 'gyro' || window.UsedCarSecureSteering && window.UsedCarSecureSteering.isCompanion) useGyro(false);
  updateSteeringUI();

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
