import './controller-clients.js';

export const BUTTONS = Object.freeze(['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y']);
const empty = () => Object.fromEntries(BUTTONS.map(key => [key, false]));
const copy = value => JSON.parse(JSON.stringify(value));
const nativeKeys = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', Enter: 'A', Start: 'START', p: 'START', b: 'B', Select: 'Y' };

/** Pure frame reducer. Consumes an already-read snapshot; never touches native I/O. */
export function createInputReducer() {
  let previous = empty(), source = '', epoch = null, hasSeenController = false;
  let blocked = empty(), resetPending = false;
  return {
    cancel() { resetPending = true; },
    read(snapshot = {}, local = {}) {
      if (!snapshot || typeof snapshot !== 'object') snapshot = {};
      const players = Array.isArray(snapshot.players) ? snapshot.players.filter(p => p && Number(p.id) > 0) : [];
      const player = players.filter(p => p.connected === true && p.transport === 'wifi').sort((a, b) => Number(a.id) - Number(b.id))[0];
      const nextSource = player ? JSON.stringify([player.id, player.controllerId, player.session]) : '';
      const nextEpoch = player?.cancelSeq ?? null;
      const changed = source !== nextSource || (source && epoch !== nextEpoch);
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
      return { buttons, pressed, released, connected: !!player, cancelled, players: copy(players), source };
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
    #puretv-controller-panel[data-playing=true]{background:transparent;border:0;padding:0;box-shadow:none}
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
  element.append(title, clients, info); document.body.appendChild(element);
  return { element, clients, info };
}

/** One owner per page. Call poll exactly once per animation frame, including menus. */
export function createController(options = {}) {
  const root = window, document = root.document;
  const view = panel(document, options), reducer = createInputReducer();
  let localHeld = empty(), localPulse = empty(), info = {}, infoAt = -Infinity, playing = false;
  let frame = { buttons: empty(), pressed: empty(), released: empty(), connected: false, cancelled: false, players: [], source: '', pollCount: 0, info: {} };
  const previousHost = root.PureGame;
  function acceptInfo(value) {
    if (value && typeof value === 'object') info = copy(value);
  }
  function suspend() {
    localHeld = empty(); localPulse = empty(); reducer.cancel();
    options.onSuspend?.();
  }
  const hooks = {
    key(key, down) {
      const action = nativeKeys[key]; if (!action) return;
      if (down && !localHeld[action]) localPulse[action] = true;
      localHeld[action] = !!down;
    },
    focus(focused) { if (!focused) suspend(); },
    suspend(paused) { if (paused) suspend(); },
    resume() {},
    roomInfo: acceptInfo,
    networkChanged(value) { acceptInfo(value); suspend(); }
  };
  root.PureGame = hooks;
  const onVisibility = () => { if (document.hidden) suspend(); };
  root.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', onVisibility);
  function render() {
    root.PureTVControllerAdapter.renderClients(view.clients, frame.players, { language: 'zh' });
    view.element.dataset.playing = String(playing);
    view.element.hidden = playing && !frame.connected;
    const wifi = info.wifiController || {};
    const addresses = Array.isArray(wifi.addresses) ? wifi.addresses : Array.isArray(info.addresses) ? info.addresses : [];
    const address = addresses.filter(value => typeof value === 'string').join(' / ');
    const name = typeof wifi.serviceName === 'string' ? wifi.serviceName : '';
    const port = Number.isInteger(wifi.port) && wifi.port > 0 ? wifi.port : 63485;
    const activeSeat = frame.players.filter(p => p.connected === true && p.transport === 'wifi').map(p => Number(p.id)).sort((a, b) => a - b)[0];
    let status = frame.connected ? `单人游戏 · ${activeSeat}P 手柄操作` : '手柄按 GPIO 23 搜索连接';
    if (!root.PureGameHost) status = '浏览器预览 · 键鼠可玩\nWi-Fi 手柄需启动安装版';
    if (name) status += '\n' + name;
    if (address) status += '\n' + address;
    if (root.PureGameHost) status += '\nTCP ' + port;
    if (typeof wifi.error === 'string' && wifi.error) status += '\n' + wifi.error;
    if (wifi.state === 'failed' || wifi.state === 'unavailable') status += '\n手柄服务暂不可用';
    view.info.textContent = status;
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
      const local = empty();
      for (const key of BUTTONS) local[key] = localHeld[key] || localPulse[key];
      localPulse = empty();
      frame = { ...reducer.read(sample, local), info: copy(info), pollCount: frame.pollCount + 1, native: !!root.PureGameHost, inputAvailable: !!root.PureGameHost };
      render();
      if (frame.cancelled) options.onCancel?.();
      return copy(frame);
    },
    peek() { return copy(frame); },
    setPlaying(value) { playing = !!value; render(); },
    cancel: suspend,
    destroy() {
      root.removeEventListener('blur', suspend); document.removeEventListener('visibilitychange', onVisibility);
      if (root.PureGame === hooks) root.PureGame = previousHost;
      view.element.remove();
    }
  };
}
