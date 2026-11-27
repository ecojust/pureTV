import './controller-clients.js';

export const BUTTONS = Object.freeze(['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y']);
const empty = () => Object.fromEntries(BUTTONS.map(key => [key, false]));
const copy = value => JSON.parse(JSON.stringify(value));
const nativeKeys = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', Enter: 'A', Start: 'START', p: 'START', b: 'B', A: 'A', B: 'B', X: 'X', Y: 'Y', Select: 'Y' };

const keypad = { Numpad8: 'UP', Numpad2: 'DOWN', Numpad4: 'LEFT', Numpad6: 'RIGHT', Numpad5: 'START',
  Numpad1: 'A', Numpad3: 'B', Numpad7: 'X', Numpad9: 'Y' };
const keyboard = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  KeyP: 'START', KeyZ: 'A', KeyX: 'B', KeyC: 'X', KeyV: 'Y' };

function controllerPlayer(player) {
  if (player.transport === 'wifi') return player;
  // Game Kit's phone room predates the transport field. Its x/y axes are
  // distinct from the two face buttons, including when several are held.
  if (player.transport !== 'phone' && (player.transport || typeof player.x !== 'number' || typeof player.y !== 'number')) return player;
  const buttons = { UP: player.y < -.35, DOWN: player.y > .35, LEFT: player.x < -.35, RIGHT: player.x > .35,
    START: player.start === true, A: player.a === true, B: player.b === true,
    X: player.buttonX === true, Y: player.buttonY === true || player.select === true };
  return { ...player, transport: 'phone', buttons };
}

/** Pure frame reducer. Consumes an already-read snapshot; never touches native I/O. */
export function createInputReducer() {
  let previous = empty(), source = '', epoch = null, hasSeenController = false;
  let blocked = empty(), resetPending = false;
  return {
    cancel() { resetPending = true; },
    read(snapshot = {}, local = {}) {
      if (!snapshot || typeof snapshot !== 'object') snapshot = {};
      const players = Array.isArray(snapshot.players) ? snapshot.players.filter(p => p && Number(p.id) > 0).map(controllerPlayer) : [];
      const online = players.filter(p => p.connected === true).sort((a, b) => Number(a.id) - Number(b.id));
      const player = online.find(p => p.transport === 'wifi') || online.find(p => p.transport === 'phone');
      const nextSource = !player ? '' : player.transport === 'phone' ? JSON.stringify(['phone', player.id])
        : JSON.stringify([player.id, player.controllerId, player.session]);
      const nextEpoch = player?.cancelSeq ?? null;
      const changed = source !== nextSource || (!!source && epoch !== nextEpoch);
      const cancelled = resetPending || (changed && !!source);
      const quarantine = cancelled || (changed && hasSeenController && !!nextSource);
      const raw = empty();
      const active = snapshot.inputActive !== false && player?.inputActive !== false;
      for (const key of BUTTONS) raw[key] = !!local[key] || (active && player?.buttons?.[key] === true);
      if (quarantine) for (const key of BUTTONS) blocked[key] = raw[key];
      const buttons = empty(), pressed = empty(), released = empty();
      for (const key of BUTTONS) {
        if (!raw[key]) blocked[key] = false;
        buttons[key] = !quarantine && raw[key] && !blocked[key];
        pressed[key] = buttons[key] && !previous[key];
        // A cancellation is not an intentional release (e.g. rewarded drift).
        released[key] = !cancelled && !quarantine && !buttons[key] && previous[key];
      }
      previous = buttons; source = nextSource; epoch = nextEpoch; resetPending = false;
      if (player) hasSeenController = true;
      return { buttons, pressed, released, connected: !!player, transport: player?.transport || null, cancelled, players: copy(players), source };
    }
  };
}

function panel(document, options) {
  const style = document.createElement('style');
  style.textContent = `
    #puretv-controller-panel{position:fixed;z-index:30;box-sizing:border-box;max-height:calc(100vh - 24px);overflow:auto;color:#eef6ff;background:rgba(12,22,36,.94);border:1px solid rgba(153,192,225,.35);border-radius:12px;padding:10px;font:13px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;box-shadow:0 8px 28px #0004}
    #puretv-controller-panel[hidden]{display:none!important}
    #puretv-controller-panel strong{font-weight:650}
    #puretv-controller-panel .ptv-host-title{display:block;font-size:13px;color:#a8ddff;margin-bottom:5px}
    #puretv-controller-panel .ptv-host-info{white-space:pre-line;margin:6px 0 0;color:#c4d5e7;font-size:12px}
    #puretv-controller-panel .ptv-phone{margin:4px 0}
    #puretv-controller-panel .ptv-phone img{display:block;width:min(108px,20vh);height:auto;background:white;image-rendering:pixelated}
    #puretv-controller-panel .ptv-phone small{display:block;color:#c4d5e7}
    #puretv-controller-panel .ptv-phone [hidden],#puretv-controller-panel .ptv-phone[hidden]{display:none}
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none;pointer-events:none}
    #puretv-controller-panel[data-playing=true] .ptv-client-card{padding:3px 6px;align-items:center}
    #puretv-controller-panel[data-playing=true] .ptv-client-icon{width:17px;height:17px;flex-basis:17px;margin-right:5px}
    #puretv-controller-panel[data-playing=true] .ptv-client-heading,#puretv-controller-panel[data-playing=true] .ptv-client-id{line-height:1.2;margin-top:0}
    #puretv-controller-panel .ptv-status{display:inline-block;border-radius:4px;padding:2px 5px;background:#0c192bee;color:#eef6ff;font:11px/1.25 system-ui,sans-serif}
    #puretv-controller-panel .ptv-status[hidden]{display:none}
    #puretv-controller-panel[data-playing=true] .ptv-host-title,#puretv-controller-panel[data-playing=true] .ptv-host-info{display:none}
    #puretv-controller-panel .ptv-client-card{background:rgba(12,25,43,.94)}
    #puretv-controller-panel .ptv-client-id{font-size:11px}
    #puretv-controller-panel .ptv-client-heading{font-size:12px}
  `;
  document.head.appendChild(style);
  const element = document.createElement('aside');
  element.id = 'puretv-controller-panel';
  element.setAttribute('aria-label', 'pureTV 手柄连接');
  element.style[options.side === 'left' ? 'left' : 'right'] = '12px';
  element.style.top = options.top || '12px';
  element.style.width = `${Math.max(150, Math.min(300, Number(options.width) || 198))}px`;
  const title = document.createElement('strong'); title.className = 'ptv-host-title'; title.textContent = 'pureTV 手柄';
  const clients = document.createElement('div'); clients.id = 'puretv-controller-clients'; clients.hidden = true;
  const info = document.createElement('p'); info.className = 'ptv-host-info';
  const phone = document.createElement('div'); phone.className = 'ptv-phone'; phone.hidden = true;
  const qr = document.createElement('img'); qr.alt = '手机手柄房间二维码'; qr.hidden = true;
  const join = document.createElement('small');
  phone.append(qr, join);
  const status = document.createElement('span'); status.className = 'ptv-status'; status.hidden = true;
  element.append(title, clients, phone, status, info); document.body.appendChild(element);
  return { element, clients, info, phone, qr, join, status, style };
}

/** One owner per page. Call poll exactly once per animation frame, including menus. */
export function createController(options = {}) {
  const root = window, document = root.document;
  const view = panel(document, options), reducer = createInputReducer();
  const heldKeys = new Map();
  let localPulse = empty(), info = {}, infoAt = -Infinity, playing = false;
  let frame = { buttons: empty(), pressed: empty(), released: empty(), connected: false, cancelled: false, players: [], source: '', pollCount: 0, info: {} };
  const previousHost = root.PureGame;
  function acceptInfo(value) {
    if (value && typeof value === 'object') info = copy(value);
  }
  function suspend() {
    heldKeys.clear(); localPulse = empty(); reducer.cancel();
    options.onSuspend?.();
  }
  function setKey(code, action, down) {
    if (!down) { heldKeys.delete(code); return; }
    if (!heldKeys.has(code)) localPulse[action] = true;
    heldKeys.set(code, action);
  }
  function onKey(event) {
    const action = keypad[event.code] || (options.keyboard === true && keyboard[event.code]);
    if (!action || !event.isTrusted) return;
    const code = 'dom:' + event.code;
    if (event.type === 'keyup') {
      if (!heldKeys.has(code)) return;
    } else if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
               event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable=false])')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!event.repeat) setKey(code, action, event.type === 'keydown');
  }
  const hooks = {
    key(key, down) {
      const action = nativeKeys[key]; if (!action) return;
      setKey('native:' + key, action, down);
    },
    focus(focused) { if (!focused) suspend(); },
    suspend(paused) { if (paused) suspend(); },
    resume() {},
    roomInfo: acceptInfo,
    networkChanged(value) { acceptInfo(value); suspend(); }
  };
  root.PureGame = hooks;
  const onVisibility = () => { if (document.hidden) suspend(); };
  root.addEventListener('keydown', onKey, true);
  root.addEventListener('keyup', onKey, true);
  root.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', onVisibility);
  function render() {
    root.PureTVControllerAdapter.renderClients(view.clients, frame.players, { language: 'zh' });
    const stage = String(playing);
    if (view.element.dataset.playing !== stage) {
      view.element.dataset.playing = stage;
      document.body.dataset.puretvPlaying = stage;
    }
    const phoneSeat = frame.players.find(p => p.connected && p.transport === 'phone');
    view.status.hidden = !playing || frame.transport === 'wifi';
    const label = frame.transport === 'phone' ? `${phoneSeat.id}P 手机手柄已连接` : '手柄未连接';
    if (view.status.textContent !== label) view.status.textContent = label;
    const room = typeof info.url === 'string' && /^https?:\/\//.test(info.url) ? info.url : '';
    view.phone.hidden = playing || frame.connected || !room;
    const joining = String(!view.phone.hidden);
    if (document.body.dataset.puretvJoining !== joining) document.body.dataset.puretvJoining = joining;
    if (!view.phone.hidden) {
      const qr = typeof info.qr === 'string' && info.qr.startsWith('data:image/png;base64,') ? info.qr : '';
      view.qr.hidden = !qr;
      if (qr && view.qr.getAttribute('src') !== qr) view.qr.src = qr;
      const joinText = qr ? '同一 Wi-Fi 下用手机扫码' : '手机打开 ' + room;
      if (view.join.textContent !== joinText) view.join.textContent = joinText;
    }
    const wifi = info.wifiController || {};
    const addresses = Array.isArray(wifi.addresses) ? wifi.addresses : Array.isArray(info.addresses) ? info.addresses : [];
    const address = addresses.filter(value => typeof value === 'string').join(' / ');
    const name = typeof wifi.serviceName === 'string' ? wifi.serviceName : '';
    const port = Number.isInteger(wifi.port) && wifi.port > 0 ? wifi.port : 63485;
    const activeSeat = frame.players.filter(p => p.connected === true && p.transport === frame.transport).map(p => Number(p.id)).sort((a, b) => a - b)[0];
    let status = frame.connected ? `单人游戏 · ${activeSeat}P ${frame.transport === 'phone' ? '手机手柄' : '无线手柄'}操作` : '无线手柄按 GPIO 23 搜索连接';
    if (!root.PureGameHost) status = '浏览器预览 · 键鼠可玩\nWi-Fi 手柄需启动安装版';
    if (!info.url) status += '\n小键盘 8/2/4/6 方向 · 5 START · 1/3/7/9 A/B/X/Y';
    if (name) status += '\n' + name;
    if (address) status += '\n' + address;
    if (root.PureGameHost) status += '\nTCP ' + port;
    if (typeof wifi.error === 'string' && wifi.error) status += '\n' + wifi.error;
    if (wifi.state === 'failed' || wifi.state === 'unavailable') status += '\n手柄服务暂不可用';
    if (view.info.textContent !== status) view.info.textContent = status;
  }
  return {
    poll() {
      let sample = { players: [] };
      const now = root.performance.now();
      try {
        if (root.PureGameHost?.getInfo && now - infoAt >= 1000) {
          acceptInfo(JSON.parse(root.PureGameHost.getInfo())); infoAt = now;
        }
        if (root.PureGameHost?.snapshot) sample = JSON.parse(root.PureGameHost.snapshot());
      } catch (_) { sample = { players: [] }; }
      const local = localPulse;
      for (const action of heldKeys.values()) local[action] = true;
      localPulse = empty();
      frame = { ...reducer.read(sample, local), info: copy(info), pollCount: frame.pollCount + 1, native: !!root.PureGameHost, inputAvailable: !!root.PureGameHost };
      render();
      if (frame.cancelled) options.onCancel?.();
      return copy(frame);
    },
    peek() { return copy(frame); },
    setPlaying(value) { if (playing !== !!value) { playing = !!value; render(); } },
    cancel: suspend,
    destroy() {
      root.removeEventListener('keydown', onKey, true); root.removeEventListener('keyup', onKey, true);
      root.removeEventListener('blur', suspend); document.removeEventListener('visibilitychange', onVisibility);
      if (root.PureGame === hooks) {
        root.PureGame = previousHost;
        delete document.body.dataset.puretvPlaying;
        delete document.body.dataset.puretvJoining;
      }
      view.element.remove(); view.style.remove();
    }
  };
}
