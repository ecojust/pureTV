/* NES TV shell. All gameplay, maps, graphics and sound are executed from ROM. */
(function (root) {
  "use strict";
  const $ = (id) => document.getElementById(id),
    bridge = root.NesNative;
  let info = {
    title: "NES TV",
    game: "tank",
    language: "zh",
    url: "",
    qr: "",
    rom: null,
  };
  try {
    if (bridge) info = { ...info, ...JSON.parse(bridge.getInfo()) };
  } catch (_) {}
  const english = String(info.language).startsWith("en"),
    tr = (zh, en) => (english ? en : zh);
  const keys = new Set(),
    pulses = new Map(),
    missing = new Set();
  let keyboardActive = false,
    previousSeats = new Set(),
    players = [],
    manualPause = false,
    nativePaused = false,
    menuOpen = false;
  let destroyed = false,
    visible = !document.hidden,
    error = "",
    loading = false,
    loadSequence = 0,
    loadedRevision = null;
  let raf = 0,
    last = 0,
    accumulator = 0,
    lastUi = 0,
    lastPublish = 0,
    abort = null,
    overlayAction = null;
  const canvas = $("battlefield"),
    context = canvas.getContext("2d", { alpha: false });
  context.imageSmoothingEnabled = false;
  const pixels = context.createImageData(256, 240),
    pixelWords = new Uint32Array(pixels.data.buffer);
  const littleEndian =
    new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 4;
  const audio = new root.NesAudio(root);
  const adapter = new root.NesAdapter({
    core: root.jsnes,
    sampleRate: audio.sampleRate,
    onFrame(frame) {
      // JSNES stores 0x00BBGGRR for direct little-endian ImageData output.
      if (littleEndian)
        for (let i = 0; i < frame.length; i++)
          pixelWords[i] = 0xff000000 | frame[i];
      else
        for (let i = 0; i < frame.length; i++) {
          const j = i * 4,
            p = frame[i];
          pixels.data[j] = p & 255;
          pixels.data[j + 1] = (p >> 8) & 255;
          pixels.data[j + 2] = (p >> 16) & 255;
          pixels.data[j + 3] = 255;
        }
      context.putImageData(pixels, 0, 0);
    },
    onAudioSample(l, r) {
      audio.sample(l, r);
    },
  });
  document.documentElement.lang = english ? "en" : "zh-CN";
  document.body.dataset.game = String(info.game).includes("jackal")
    ? "jackal"
    : "tank";
  document.title = info.title;
  const labels = {
    "app-title": [info.title, info.title],
    "join-label": ["手机手柄", "PHONE CONTROLLERS"],
    "lan-label": ["同一局域网", "LOCAL NETWORK"],
    "scan-title": ["扫码连接 · 最多两人", "Scan to join · Two players"],
    "scan-description": [
      "手机无需安装应用\n也可在手机页面导入 ROM",
      "No phone app needed\nImport your ROM from the controller page",
    ],
    "rom-label": ["当前卡带", "CURRENT CARTRIDGE"],
    "import-rom": ["导入 ROM", "Import ROM"],
    "restart-game": ["重新开始", "Reset"],
    "menu-help": [
      "SELECT 选择模式 · START 开始\nA / B 功能由游戏决定",
      "SELECT chooses mode · START begins\nA / B actions are defined by the game",
    ],
    "footer-left": [
      "NES · 256 × 240 · JSNES 2.1.0",
      "NES · 256 × 240 · JSNES 2.1.0",
    ],
    "footer-right": [
      "菜单键：操作 · 返回键：退出",
      "Menu: options · Back: exit",
    ],
  };
  for (const [id, value] of Object.entries(labels))
    $(id).textContent = value[english ? 1 : 0];
  for (let id = 1; id <= 2; id++)
    $("player-name-" + id).textContent = tr("玩家 " + id, "Player " + id);
  function resize() {
    const panel = canvas.parentElement.parentElement;
    const scale = Math.max(
      0.1,
      Math.min((panel.clientWidth - 2) / 256, (panel.clientHeight - 2) / 240),
    );
    canvas.parentElement.style.width = Math.floor(256 * scale) + "px";
    canvas.parentElement.style.height = Math.floor(240 * scale) + "px";
  }
  function releaseKeys() {
    keys.clear();
    pulses.clear();
    adapter.releaseAll();
  }
  function state() {
    let reason = "";
    if (!visible) reason = "hidden";
    else if (nativePaused) reason = "native";
    else if (menuOpen) reason = "menu";
    else if (manualPause) reason = "manual";
    else if (
      missing.has(2) ||
      (!keyboardActive && (missing.has(1) || !players.some((p) => p.connected)))
    )
      reason = "disconnected";
    return {
      phase: error
        ? "error"
        : loading
          ? "loading"
          : !adapter.loaded
            ? "empty"
            : reason
              ? "paused"
              : "playing",
      reason,
      rom: info.rom ? { name: info.rom.name, size: info.rom.size } : null,
      players: players.map((p) => ({ id: p.id, connected: p.connected })),
      frameCount: adapter.frameCount,
    };
  }
  function formatError(value) {
    const code = value && value.code;
    const messages = {
      header: [
        "文件不是有效的 .nes 卡带，请导入未压缩的 ROM。",
        "Choose a valid, uncompressed .nes ROM.",
      ],
      size: [
        "ROM 大小不受支持（上限 16 MiB）。",
        "ROM size is unsupported (maximum 16 MiB).",
      ],
      length: [
        "ROM 文件不完整，或与卡带头信息不匹配。",
        "The ROM is incomplete or its header length is incorrect.",
      ],
      mapper: [
        "当前核心不支持此卡带的 Mapper。",
        "The emulator does not support this cartridge mapper.",
      ],
      region: [
        "此版本支持 NTSC 制式，请使用 NTSC 卡带。",
        "This preview supports NTSC cartridges. PAL and Dendy are unsupported.",
      ],
      trainer: [
        "当前版本不支持带 Trainer 的 ROM。",
        "This preview does not support ROM trainer data.",
      ],
      console: [
        "此卡带需要不支持的硬件。",
        "This cartridge requires unsupported hardware.",
      ],
      hardware: [
        "此卡带需要不支持的扩展硬件。",
        "This cartridge requires unsupported expansion hardware.",
      ],
      submapper: [
        "此版本不支持该 NES 2.0 Submapper。",
        "This NES 2.0 submapper is unsupported.",
      ],
    };
    return code && messages[code]
      ? messages[code][english ? 1 : 0]
      : String(
          (value && value.message) ||
            value ||
            tr("无法载入 ROM", "Could not load ROM"),
        );
  }
  function syncButtons() {
    $("pause-game").disabled = !adapter.loaded || loading || !!error;
    $("restart-game").disabled = !adapter.loaded || loading || !!error;
    $("pause-game").textContent =
      manualPause || missing.size ? tr("继续", "Resume") : tr("暂停", "Pause");
    $("rom-name").textContent =
      (info.rom && info.rom.name) || tr("尚未导入 ROM", "No ROM imported");
    $("rom-name").title = $("rom-name").textContent;
    const size = (info.rom && Number(info.rom.size)) || 0;
    $("rom-detail").textContent =
      adapter.info && !loading && !error
        ? "Mapper " +
          adapter.info.mapper +
          " · " +
          (size / 1024).toFixed(size < 1024 * 1024 ? 0 : 1) +
          " KB"
        : tr("导入后保存在本机", "Imported ROM stays on this TV");
  }
  function updateUi() {
    syncButtons();
    const value = state(),
      paused = value.phase === "paused";
    const count = players.filter((p) => p.connected).length;
    $("connection-label").textContent =
      tr("手柄 ", "Controllers ") +
      count +
      " / 2" +
      (keyboardActive ? tr(" · 电视按键", " · TV controls") : "");
    for (let id = 1; id <= 2; id++) {
      const connected = players.some((p) => p.id === id && p.connected);
      $("player-" + id).classList.toggle("connected", connected);
      $("player-status-" + id).textContent = connected
        ? tr("已连接", "Connected")
        : tr("等待连接", "Waiting");
    }
    $("game-overlay").hidden = value.phase === "playing";
    $("game-overlay").dataset.phase = value.phase;
    overlayAction = null;
    $("overlay-action").hidden = true;
    if (value.phase === "loading") {
      $("overlay-title").textContent = tr(
        "正在读取卡带…",
        "Loading cartridge…",
      );
      $("overlay-detail").textContent = (info.rom && info.rom.name) || "";
    } else if (value.phase === "error") {
      $("overlay-title").textContent = tr(
        "卡带无法运行",
        "Unable to run cartridge",
      );
      $("overlay-detail").textContent = error;
      overlayAction = pickRom;
      $("overlay-action").textContent = tr(
        "重新导入 ROM",
        "Import another ROM",
      );
    } else if (value.phase === "empty") {
      $("overlay-title").textContent = tr(
        "放入你的游戏卡带",
        "Insert your game cartridge",
      );
      $("overlay-detail").textContent = tr(
        "导入 .nes 文件开始游戏\n手机扫码后也可以上传到电视",
        "Import a .nes file to play\nScan the QR code to upload it from your phone",
      );
      overlayAction = pickRom;
      $("overlay-action").textContent = tr("导入 ROM", "Import ROM");
    } else if (paused) {
      const disconnected = value.reason === "disconnected";
      $("overlay-title").textContent = disconnected
        ? tr("等待手柄连接", "Waiting for controller")
        : tr("游戏已暂停", "Game paused");
      $("overlay-detail").textContent = disconnected
        ? tr(
            "手机扫码连接，或按电视方向键继续\n断开手柄后会自动暂停，避免丢失操作",
            "Scan to connect, or press a TV direction key\nThe game pauses when a controller disconnects",
          )
        : value.reason === "menu"
          ? tr(
              "方向键选择右侧操作，确定键执行\n再次按菜单键返回游戏",
              "Use arrows to select an option, then press OK\nPress Menu again to return to the game",
            )
          : tr("点击继续返回游戏", "Choose Resume to return to the game");
      if (!["menu", "native", "hidden"].includes(value.reason)) {
        overlayAction = resume;
        $("overlay-action").textContent = tr("继续", "Resume");
      }
    }
    $("overlay-action").hidden = !overlayAction;
  }
  function publish() {
    try {
      if (bridge) bridge.publish(JSON.stringify(state()));
    } catch (_) {}
  }
  function updateRoom(value) {
    info = { ...info, ...(value || {}) };
    const ready = !!(info.url && info.qr);
    $("room-qr").hidden = !ready;
    $("network-message").hidden = ready;
    if (ready) {
      if ($("room-qr").src !== info.qr) $("room-qr").src = info.qr;
      $("room-address").textContent = info.url.replace(/\?.*$/, "");
    } else {
      $("room-address").textContent = "";
      $("network-message").textContent =
        info.error ||
        tr(
          "连接局域网后重新打开应用",
          "Connect to a local network and reopen the app",
        );
    }
    const revision = info.rom
      ? String(info.rom.revision || info.rom.name || "")
      : null;
    if (revision !== loadedRevision) loadRom();
    updateUi();
  }
  async function loadRom() {
    const sequence = ++loadSequence;
    if (abort) abort.abort();
    abort = null;
    releaseKeys();
    audio.pause(true);
    error = "";
    loading = !!info.rom;
    loadedRevision = info.rom
      ? String(info.rom.revision || info.rom.name || "")
      : null;
    if (!info.rom) {
      adapter.dispose();
      context.clearRect(0, 0, 256, 240);
      updateUi();
      publish();
      return;
    }
    updateUi();
    publish();
    try {
      abort =
        typeof root.AbortController === "function"
          ? new root.AbortController()
          : null;
      const response = await fetch("/rom.nes", {
        cache: "no-store",
        ...(abort ? { signal: abort.signal } : {}),
      });
      if (!response.ok)
        throw new Error(
          tr("读取 ROM 失败：", "ROM could not be read: ") + response.status,
        );
      const data = await response.arrayBuffer();
      if (destroyed || sequence !== loadSequence) return;
      adapter.load(data);
      manualPause = false;
      menuOpen = false;
      missing.clear();
      // Draw a real first frame before a controller connects, without a fake game screenshot.
      adapter.step();
      last = 0;
      accumulator = 0;
    } catch (value) {
      if (destroyed || sequence !== loadSequence || value.name === "AbortError")
        return;
      error = formatError(value);
    }
    if (destroyed || sequence !== loadSequence) return;
    abort = null;
    loading = false;
    updateUi();
    publish();
  }
  function pickRom() {
    releaseKeys();
    menuOpen = false;
    if (bridge && typeof bridge.pickRom === "function") bridge.pickRom();
    else {
      error = tr(
        "请通过电视应用或扫码后的手机页面导入 ROM。",
        "Import a ROM from the TV app or the phone controller page.",
      );
      updateUi();
    }
  }
  function resume() {
    if (!players.some((p) => p.connected)) keyboardActive = true;
    manualPause = false;
    menuOpen = false;
    missing.clear();
    last = 0;
    accumulator = 0;
    updateUi();
  }
  function togglePause() {
    if (!adapter.loaded || loading || error) return;
    if (manualPause || missing.size) resume();
    else {
      manualPause = true;
      releaseKeys();
      audio.pause(true);
      updateUi();
    }
  }
  function reset() {
    if (!adapter.loaded || loading || error) return;
    releaseKeys();
    audio.pause(true);
    adapter.reset();
    adapter.step();
    manualPause = false;
    menuOpen = false;
    missing.clear();
    if (!players.some((p) => p.connected)) keyboardActive = true;
    last = 0;
    accumulator = 0;
    updateUi();
  }
  function snapshot() {
    let list = [];
    try {
      if (bridge) list = JSON.parse(bridge.snapshot()).players || [];
    } catch (_) {}
    list = list
      .filter((p) => p && [1, 2].includes(Number(p.id)))
      .map((p) => ({
        id: Number(p.id),
        connected: !!p.connected,
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        a: !!p.a,
        b: !!p.b,
        start: !!p.start,
        select: !!p.select,
      }));
    const current = new Set(list.filter((p) => p.connected).map((p) => p.id));
    for (const id of previousSeats) if (!current.has(id)) missing.add(id);
    for (const id of current) missing.delete(id);
    previousSeats = current;
    if (keyboardActive) {
      let player = list.find((p) => p.id === 1);
      if (!player) {
        player = { id: 1, x: 0, y: 0 };
        list.push(player);
      }
      player.connected = true;
      player.x =
        Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft")) ||
        player.x;
      player.y =
        Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp")) || player.y;
      for (const action of ["a", "b", "start", "select"])
        player[action] =
          !!player[action] ||
          keys.has(action) ||
          performance.now() < (pulses.get(action) || 0);
    }
    return list;
  }
  function actionFor(code) {
    if (code === "Start" || code === "Enter" || code === "p") return "start";
    if (code === "Select" || code === "Shift") return "select";
    if (["a", "z", " "].includes(code)) return "a";
    if (["b", "x"].includes(code)) return "b";
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)
      ? code
      : null;
  }
  function menuActions() {
    return [...$("actions").querySelectorAll("button")].filter(
      (button) => !button.disabled,
    );
  }
  function toggleMenu() {
    menuOpen = !menuOpen;
    releaseKeys();
    $("actions").classList.toggle("menu-open", menuOpen);
    if (menuOpen) {
      audio.pause(true);
      menuActions()[0].focus();
    } else if (document.activeElement) document.activeElement.blur();
    last = 0;
    updateUi();
  }
  function key(code, pressed) {
    code = code.length === 1 ? code.toLowerCase() : code;
    if (code === "Menu" || code === "Escape" || code === "m") {
      if (pressed) toggleMenu();
      return;
    }
    if (menuOpen) {
      if (!pressed) return;
      const buttons = menuActions(),
        current = Math.max(0, buttons.indexOf(document.activeElement));
      if (["ArrowUp", "ArrowLeft"].includes(code))
        buttons[(current + buttons.length - 1) % buttons.length].focus();
      else if (["ArrowDown", "ArrowRight"].includes(code))
        buttons[(current + 1) % buttons.length].focus();
      else if (["Enter", "Start", "a"].includes(code)) {
        buttons[current].click();
        menuOpen = false;
        $("actions").classList.remove("menu-open");
        document.activeElement.blur();
        updateUi();
      }
      return;
    }
    if (
      (!adapter.loaded || error) &&
      ["Enter", "Start"].includes(code) &&
      pressed
    ) {
      pickRom();
      return;
    }
    const action = actionFor(code);
    if (!action) return;
    if (pressed) {
      if (!keys.has(action) && ["a", "b", "start", "select"].includes(action))
        pulses.set(action, performance.now() + 55);
      keys.add(action);
      keyboardActive = true;
      missing.delete(1);
      audio.unlock();
    } else keys.delete(action);
  }
  function animate(now) {
    if (destroyed || !visible) return;
    players = snapshot();
    const current = state(),
      running = current.phase === "playing";
    audio.pause(!running);
    if (running) {
      if (players.some((p) => p.a || p.b || p.start || p.select))
        audio.unlock();
      adapter.setPlayers(players);
      const dt = last
        ? Math.min(Math.max(now - last, 0), 100)
        : 1000 / root.NES_FPS;
      accumulator += dt;
      let frames = 0;
      try {
        while (accumulator >= 1000 / root.NES_FPS && frames < 4) {
          adapter.step();
          accumulator -= 1000 / root.NES_FPS;
          frames++;
        }
        if (frames === 4) accumulator = 0;
      } catch (value) {
        error = formatError(value);
        adapter.releaseAll();
        audio.pause(true);
        updateUi();
        publish();
      }
    } else {
      accumulator = 0;
      adapter.releaseAll();
    }
    last = now;
    if (now - lastUi > 100) {
      updateUi();
      lastUi = now;
    }
    if (now - lastPublish > 200) {
      publish();
      lastPublish = now;
    }
    raf = root.requestAnimationFrame(animate);
  }
  function suspend(value) {
    nativePaused = !!value;
    releaseKeys();
    audio.pause(true);
    last = 0;
    accumulator = 0;
    updateUi();
    publish();
  }
  function visibilityChanged() {
    visible = !document.hidden;
    releaseKeys();
    last = 0;
    accumulator = 0;
    if (!visible) {
      root.cancelAnimationFrame(raf);
      audio.pause(true);
    } else if (!destroyed) raf = root.requestAnimationFrame(animate);
    updateUi();
    publish();
  }
  function dispose() {
    if (destroyed) return;
    destroyed = true;
    loadSequence++;
    if (abort) abort.abort();
    root.cancelAnimationFrame(raf);
    releaseKeys();
    adapter.dispose();
    audio.dispose();
    root.removeEventListener("resize", resize);
    root.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", visibilityChanged);
    document.removeEventListener("keydown", keyDown);
    document.removeEventListener("keyup", keyUp);
    root.removeEventListener("pagehide", dispose);
  }
  function keyDown(event) {
    if (event.repeat) return;
    if (
      event.target instanceof HTMLButtonElement &&
      ["Enter", " "].includes(event.key) &&
      !menuOpen
    )
      return;
    if (
      actionFor(event.key.length === 1 ? event.key.toLowerCase() : event.key) ||
      ["Menu", "Escape", "m"].includes(event.key)
    ) {
      event.preventDefault();
      key(event.key, true);
    }
  }
  function keyUp(event) {
    key(event.key, false);
  }
  function onBlur() {
    releaseKeys();
  }
  $("import-rom").addEventListener("click", pickRom);
  $("pause-game").addEventListener("click", togglePause);
  $("restart-game").addEventListener("click", reset);
  $("overlay-action").addEventListener("click", () => {
    if (overlayAction) overlayAction();
  });
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  document.addEventListener("visibilitychange", visibilityChanged);
  root.addEventListener("resize", resize);
  root.addEventListener("blur", onBlur);
  root.addEventListener("pagehide", dispose);
  root.NesTV = {
    key,
    updateRoom,
    romChanged(value) {
      if (value) info = { ...info, ...value };
      return loadRom();
    },
    suspend,
    dispose,
    reset,
    togglePause,
    get adapter() {
      return adapter;
    },
    get state() {
      return state();
    },
    get audio() {
      return audio;
    },
    get destroyed() {
      return destroyed;
    },
  };
  resize();
  updateRoom(info);
  if (visible) raf = root.requestAnimationFrame(animate);
})(window);
