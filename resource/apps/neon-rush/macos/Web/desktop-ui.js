/* macOS presentation adapter; the shared racing rules and renderer are unchanged. */
(function (root) {
  'use strict';
  const def = root.GameDef;
  if (!def) return;
  const afterUI = def.afterUI;
  const $ = id => document.getElementById(id);
  let panelRequested = false, previousPhase = '', installed = false;
  function info() { try { return JSON.parse(root.PureGameHost.getInfo()); } catch (_) { return {}; } }
  def.afterUI = function (state, ctx) {
    afterUI(state, ctx);
    const english = document.documentElement.lang === 'en';
    const text = (zh, en) => english ? en : zh;
    const current = info(), wifi = current.wifiController || {};
    const phase = ctx.paused ? 'paused' : ctx.phase;
    document.body.classList.add('neon-desktop');
    if (!installed) {
      installed = true;
      const button = $('rush-phone-button');
      button.hidden = false;
      button.onclick = () => {
        panelRequested = !document.body.classList.contains('rush-phone-open');
        if (panelRequested && root.PureTVQA?.snapshot().phase === 'playing') root.PureGame?.suspend(true);
        document.body.classList.toggle('rush-phone-open', panelRequested);
        button.setAttribute('aria-expanded', String(panelRequested));
      };
      $('qr-wrap').hidden = true;
      $('qr').alt = '';
      $('qr-empty').textContent = '';
    }
    if (phase !== previousPhase) { panelRequested = phase !== 'playing'; previousPhase = phase; }
    document.body.classList.toggle('rush-phone-open', panelRequested);
    $('rush-phone-button').textContent = text('手柄与操作', 'Controllers');
    $('rush-phone-button').setAttribute('aria-expanded', String(panelRequested));
    document.querySelector('.side-heading .eyebrow').textContent = 'PURETV CONTROLLER';
    $('room-status').textContent = ctx.phoneConnected ? 'CONNECTED' : wifi.state === 'available' ? 'READY' : 'OFFLINE';
    $('rush-wifi-help').hidden = false;
    $('rush-wifi-help').querySelector('strong').textContent = text('连接 pureTV 手柄', 'CONNECT YOUR CONTROLLER');
    const addresses = Array.isArray(wifi.addresses) ? wifi.addresses.filter(v => typeof v === 'string') : [];
    const endpoints = addresses.map(address => address + (wifi.port ? ':' + wifi.port : ''));
    $('room-address').textContent = endpoints.length ? endpoints.join(' · ') : wifi.port ? text('监听端口 ', 'Listening on port ') + wifi.port : text('正在准备本机地址…', 'Preparing local address…');
    $('rush-wifi-status').textContent = ctx.phoneConnected
      ? text('已连接 · START 开始、暂停或继续', 'Connected · START starts, pauses or resumes')
      : wifi.state === 'available'
        ? text('手柄与 Mac 加入同一网络，按搜索键连接“', 'On the same network as your Mac, press Search to find “') + (wifi.serviceName || 'Neon Rush') + text('”。', '”.')
        : wifi.state === 'registering' || wifi.state === 'starting'
          ? text('正在准备自动发现…', 'Preparing automatic discovery…')
          : wifi.state === 'stopped'
            ? text('回到游戏窗口后恢复连接服务。', 'Return to the game window to restore the controller service.')
            : text('自动发现暂不可用。可按上方地址直连；请检查网络和系统权限。', 'Discovery is unavailable. Connect directly using the address above; check your network and system permissions.');
    if (wifi.error) $('rush-wifi-status').textContent += ' ' + String(wifi.error);
    $('move-help').textContent = text('← → 转向 · ↓ 刹车 · 自动油门', '← → steer · ↓ brake · auto throttle');
    $('a-help').textContent = text('手柄 A / X · Shift / 空格：漂移', 'Pad A / X · Shift / Space: drift');
    $('b-help').textContent = text('手柄 B / Y · B / Ctrl：氮气', 'Pad B / Y · B / Ctrl: nitro');
    document.querySelector('.small-help').textContent = text('START / Enter 开始 · P 暂停 · R 重开\n⌃⌘F 全屏 · 断线自动暂停', 'START / Enter: race · P: pause · R: restart\n⌃⌘F: full screen · disconnect pauses');
    $('dialog-help').textContent = ctx.paused ? text('手柄 START / P 继续比赛', 'Controller START / P resumes the race') : text('左右选择赛道 · B 切换声音 · START / Enter 开始', 'Choose a circuit · B: sound · START / Enter: race');
    if (!ctx.phoneConnected) $('connection').textContent = ctx.disconnected ? text('手柄断开 · 已暂停', 'Disconnected · Paused') : text('键盘 / pureTV 手柄', 'KEYBOARD / PURETV CONTROLLER');
    if (document.body.classList.contains('rush-webgl-error')) {
      const message = text('无法建立 3D 画面。请重新打开游戏，并确认 macOS 支持硬件加速。', 'The 3D view could not start. Reopen the game and check macOS graphics acceleration.');
      $('dialog-copy').textContent = message;
      $('message').textContent = message;
      const error = document.querySelector('.rush-render-error');
      if (error) error.textContent = message;
    }
  };
})(window);
