/* Local HTTPS pairing. The TV supplies its own per-installation CA and serves
 * the same controller over HTTPS/WSS after the phone explicitly trusts it.
 * No public host, popup, background relay, or certificate-error bypass is used. */
(function (root) {
  'use strict';
  var TOKEN = /^[a-zA-Z0-9_-]{16,128}$/;
  var room = new URL(location.href).searchParams.get('room') || '';
  var fragment = new URLSearchParams(location.hash.slice(1));
  var handoff = location.protocol === 'https:' && TOKEN.test(fragment.get('session') || '') ? fragment.get('session') : '';
  var requestedSteering = location.protocol === 'https:' && fragment.get('steering') === 'gyro' ? 'gyro' : '';
  if (fragment.has('session') || fragment.has('steering')) {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { handoff = ''; requestedSteering = ''; }
  }
  root.UsedCarTransport = {
    room: room,
    secure: location.protocol === 'https:',
    preferredSteering: requestedSteering,
    takeSession: function () { var value = handoff; handoff = ''; return value; },
    createSocket: function (url) { return new WebSocket(url); }
  };
  var $ = function (id) { return document.getElementById(id); };
  var english = !/^zh\b/i.test(navigator.language || 'zh');
  var words = english ? {
    eyebrow: 'THIS TV ONLY · NO INTERNET REQUIRED', title: 'Set up gyroscope steering',
    intro: 'The virtual stick works now. To use your phone’s motion sensors, first trust this TV’s local certificate in your phone settings. The controller then connects directly to the TV using HTTPS.',
    loading: 'Reading this TV’s certificate details…', ready: 'Complete these steps once for each phone and TV.',
    failed: 'Cannot read a valid secure-controller address from this TV. Check the local connection and retry, or continue with the virtual stick.',
    checkTitle: '1. Check the TV and certificate',
    checkHint: 'Install only on your own trusted local network. In the downloaded certificate’s system details or a certificate viewer, compare its name and SHA-256 fingerprint with the TV. The summary below is a reference, not proof of the download’s identity.',
    androidHelp: '2. Download the CA certificate. In Android Settings, open Security → More security settings → Encryption & credentials → Install a certificate → CA certificate. The exact menu varies by phone; install the downloaded file.',
    iosHelp: '2. Download the certificate profile. Open Settings → Profile Downloaded (or General → VPN & Device Management) and install it. Then open General → About → Certificate Trust Settings and turn on full trust for this TV’s certificate.',
    android: 'Android: download CA certificate', ios: 'iPhone: download certificate profile',
    trustNote: 'This grants system-level certificate trust, separately from motion permission. A browser’s “continue anyway” button is not a substitute. Remove this TV’s certificate from your phone settings when you no longer use it.',
    nextNote: '3. After trusting the certificate, continue below. In the same controller, tap Gyroscope to grant motion access and calibrate, or choose Virtual stick. If the TV’s app data is cleared or its certificate changes, repeat setup.',
    proceed: 'Certificate trusted — open controller', cancel: 'Continue with virtual stick', retry: 'Retry setup'
  } : {
    eyebrow: '仅连接当前电视 · 无需公网', title: '首次连接陀螺仪手柄',
    intro: '虚拟摇杆现在就能使用。要使用手机运动传感器，请先在手机系统设置中信任这台电视的本地证书，手柄随后通过 HTTPS 直接连接电视。',
    loading: '正在读取这台电视的证书信息…', ready: '每部手机首次连接这台电视时完成一次。',
    failed: '暂时无法从这台电视取得有效的安全手柄地址。请检查局域网连接后重试，或继续使用虚拟摇杆。',
    checkTitle: '1. 核对电视与证书',
    checkHint: '只在你自己的可信局域网安装。请在系统证书详情或证书查看器中，核对下载证书的名称与 SHA-256 指纹和电视显示一致；下方摘要只作对照，不能代替对下载证书的核验。',
    androidHelp: '2. 下载 CA 证书，在 Android「设置 → 安全 → 更多安全设置 → 加密与凭据 → 安装证书 → CA 证书」中安装下载的文件；不同手机的菜单名称可能不同。',
    iosHelp: '2. 下载证书描述文件，在「设置 → 已下载描述文件」（或「通用 → VPN 与设备管理」）中安装，再到「通用 → 关于本机 → 证书信任设置」为这台电视的证书开启完整信任。',
    android: 'Android：下载 CA 证书', ios: 'iPhone：下载证书描述文件',
    trustNote: '这是系统级证书信任，与运动传感器授权是两件事。浏览器的“继续访问”不能代替此步骤。不再使用这台电视时，可在手机系统设置中移除它的证书。',
    nextNote: '3. 完成信任后点击下方按钮，在同一个手柄里点「陀螺仪」授权并校准，也可随时选择「虚拟摇杆」。电视清除应用数据或更换证书后，需要重新设置。',
    proceed: '已信任，进入安全手柄', cancel: '继续使用摇杆', retry: '重试设置'
  };
  var panel = $('tls-setup'), opened = false, generation = 0, configuration = null, timeout = 0;
  function status(state) { root.dispatchEvent(new CustomEvent('usedcar-secure-status', { detail: { state: state } })); }
  function privateIpv4(host) {
    if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
    var p = host.split('.').map(Number);
    return p.every(function (part) { return part >= 0 && part <= 255; }) &&
      (p[0] === 10 || p[0] === 127 || p[0] === 192 && p[1] === 168 || p[0] === 172 && p[1] >= 16 && p[1] <= 31 || p[0] === 169 && p[1] === 254);
  }
  function pairedUrl(value, scheme, pathname) {
    if (typeof value !== 'string' || value.length > 512) throw new Error('Invalid local URL');
    var url = new URL(value);
    if (url.protocol !== scheme || url.hostname !== location.hostname || !privateIpv4(url.hostname) ||
        !url.port || url.username || url.password || url.hash || url.pathname !== pathname ||
        url.searchParams.getAll('room').length !== 1 || url.searchParams.get('room') !== room ||
        Array.from(url.searchParams.keys()).some(function (key) { return key !== 'room'; })) throw new Error('Invalid paired origin');
    return url;
  }
  function validate(data) {
    if (!data || data.room !== room || !TOKEN.test(room) || !privateIpv4(location.hostname) ||
        !/^[a-f0-9]{64}$/.test(data.certificateSha256) || typeof data.certificateName !== 'string' ||
        !data.certificateName.length || data.certificateName.length > 120) throw new Error('Invalid pairing details');
    var secure = pairedUrl(data.secureUrl, 'https:', '/');
    var local = pairedUrl(data.localUrl, 'http:', '/');
    if (location.origin !== (location.protocol === 'https:' ? secure.origin : local.origin)) throw new Error('Pairing origin mismatch');
    var cert = pairedUrl(data.certificateUrl, location.protocol, '/ca.crt');
    var profile = pairedUrl(data.profileUrl, location.protocol, '/ca.mobileconfig');
    if (cert.origin !== location.origin || profile.origin !== location.origin) throw new Error('Cross-origin certificate');
    return { secureUrl: secure.href, certificateUrl: cert.href, profileUrl: profile.href,
      fingerprint: data.certificateSha256.toUpperCase().match(/.{4}/g).join(' '), name: data.certificateName };
  }
  function setText(id, value) { if ($(id)) $(id).textContent = value; }
  function renderLanguage() {
    ['eyebrow', 'title', 'intro', 'android', 'ios', 'cancel', 'retry'].forEach(function (name) { setText('tls-' + name, words[name]); });
    setText('tls-check-title', words.checkTitle); setText('tls-check-hint', words.checkHint);
    setText('tls-android-help', words.androidHelp); setText('tls-ios-help', words.iosHelp);
    $('tls-close').setAttribute('aria-label', words.cancel); $('tls-close').title = words.cancel;
    setText('tls-trust-note', words.trustNote); setText('tls-next-note', words.nextNote); setText('tls-continue', words.proceed);
  }
  function failed(attempt) {
    if (!opened || attempt !== generation) return;
    clearTimeout(timeout); generation++; configuration = null;
    $('tls-details').hidden = true; $('tls-continue').disabled = true; $('tls-retry').hidden = false;
    $('tls-status').dataset.error = 'true'; setText('tls-status', words.failed); status('failed');
  }
  function requestConfiguration() {
    var attempt = ++generation; configuration = null;
    clearTimeout(timeout); $('tls-details').hidden = true; $('tls-continue').disabled = true; $('tls-retry').hidden = true;
    $('tls-status').dataset.error = 'false'; setText('tls-status', words.loading);
    timeout = setTimeout(function () { failed(attempt); }, 7000);
    fetch('/connection.json?room=' + encodeURIComponent(room), { cache: 'no-store', credentials: 'omit', redirect: 'error' }).then(function (response) {
      if (!response.ok) throw new Error('Pairing unavailable');
      var length = Number(response.headers.get('content-length') || 0);
      if (length > 4096) throw new Error('Pairing response too large');
      return response.text();
    }).then(function (body) {
      if (!opened || attempt !== generation) return;
      if (body.length > 4096) throw new Error('Pairing response too large');
      var value = validate(JSON.parse(body)); clearTimeout(timeout); configuration = value;
      setText('tls-name', value.name); setText('tls-fingerprint', value.fingerprint);
      $('tls-android').href = value.certificateUrl; $('tls-ios').href = value.profileUrl;
      $('tls-details').hidden = false; $('tls-continue').disabled = false;
      $('tls-status').dataset.error = 'false'; setText('tls-status', words.ready);
    }).catch(function () { failed(attempt); });
  }
  function close() {
    if (!opened) return;
    opened = false; generation++; clearTimeout(timeout); configuration = null; panel.hidden = true;
    if (root.UsedCarController) root.UsedCarController.setSetupActive(false);
    status('local');
    if ($('steering-gyro')) $('steering-gyro').focus();
  }
  root.UsedCarSecureSteering = {
    open: function () {
      if (!panel || !TOKEN.test(room) || !privateIpv4(location.hostname)) { status('failed'); return false; }
      renderLanguage(); panel.hidden = false; opened = true;
      if (root.UsedCarController) root.UsedCarController.setSetupActive(true);
      status('opening'); requestConfiguration(); $('tls-cancel').focus();
      return true;
    },
    close: close
  };
  if (!panel) return;
  $('tls-cancel').addEventListener('click', close);
  $('tls-close').addEventListener('click', close);
  $('tls-retry').addEventListener('click', requestConfiguration);
  $('tls-continue').addEventListener('click', function () {
    if (!opened || !configuration) return;
    var target = new URL(configuration.secureUrl), controller = root.UsedCarController;
    var session = controller && controller.getSession ? controller.getSession() : '';
    var hash = new URLSearchParams();
    if (TOKEN.test(session)) hash.set('session', session);
    hash.set('steering', 'gyro'); target.hash = hash.toString();
    if (controller) controller.prepareNavigation();
    location.assign(target.href);
  });
  panel.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    var focusable = Array.from(panel.querySelectorAll('a[href],button:not([disabled])')).filter(function (el) { return !el.hidden && el.getClientRects().length; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  root.addEventListener('pagehide', function () { generation++; clearTimeout(timeout); });
})(window);
