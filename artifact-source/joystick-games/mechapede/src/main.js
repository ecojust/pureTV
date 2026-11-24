import { createController } from '../../shared/web/standard-gamepad.js';
import { Game } from "./game.js";
import { C } from "./constants.js";
import { Renderer } from "./render.js";
import { Controls } from "./input.js";
import { MechanicalAudio } from "./audio.js";
import { wrappedDelta } from "./topology.js";
const $ = (id) => document.getElementById(id);
const storage = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem("chain-drive." + key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("chain-drive." + key, JSON.stringify(value));
    } catch {
      /* Private browsing remains playable. */
    }
  },
};
const numberPref = (key, def, min, max) => {
  const n = Number(storage.get(key, def));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};
const params = new URLSearchParams(location.search);
// A game opens on its board, even if a narrow preview was previously scrolled
// down to the controls before a reload or layout update.
history.scrollRestoration = "manual";
window.scrollTo(0, 0);
window.addEventListener("pageshow", () => window.scrollTo(0, 0), {
  once: true,
});
const suppliedSeed = params.has("seed")
  ? Number(params.get("seed")) >>> 0
  : null;
// This ruleset has its own best; archived Classic/Cylinder scores remain saved.
const scoreKey = "high-score-machinery";
let best = numberPref(scoreKey, 0, 0, 999999999);
const canvas = $("game"),
  game = new Game({ seed: suppliedSeed ?? Date.now() >>> 0, highScore: best });
const audio = new MechanicalAudio({
  muted: !!storage.get("muted", false),
  volume: numberPref("volume", 0.45, 0, 1),
});
function fitPlayfield() {
  const machine = $("machine"),
    layout = document.querySelector(".console-layout"),
    cabinet = document.querySelector(".cabinet"),
    sidebar = document.querySelector(".sidebar");
  const stacked = matchMedia("(max-width: 760px)").matches;
  const machineStyle = getComputedStyle(machine),
    cabinetStyle = getComputedStyle(cabinet);
  const verticalBorders =
    parseFloat(cabinetStyle.borderTopWidth) +
    parseFloat(cabinetStyle.borderBottomWidth);
  const horizontalBorders =
    parseFloat(cabinetStyle.borderLeftWidth) +
    parseFloat(cabinetStyle.borderRightWidth);
  // Scores and controls live beside the board. Use the complete window height;
  // document coordinates keep scrolling through narrow-layout controls stable.
  const top =
    layout.getBoundingClientRect().top +
    (document.fullscreenElement ? 0 : scrollY);
  const roomHeight =
    innerHeight -
    top -
    verticalBorders -
    parseFloat(machineStyle.paddingBottom);
  const roomWidth =
    layout.clientWidth -
    horizontalBorders -
    (stacked
      ? 0
      : sidebar.getBoundingClientRect().width +
        parseFloat(getComputedStyle(layout).columnGap));
  const height = Math.max(
    1,
    Math.floor(Math.min(roomHeight, roomWidth / 0.75) * 4) / 4,
  );
  machine.style.setProperty("--field-height", `${height}px`);
  machine.style.setProperty(
    "--cabinet-height",
    `${height + verticalBorders}px`,
  );
}
fitPlayfield();
const renderer = new Renderer(canvas);
const input = new Controls(canvas, {
  getMode: () => game.state.mode,
  onAction: handleAction,
  sensitivity: numberPref("sensitivity", 1.5, 0.35, 2.5),
});
let accumulator = 0,
  last = performance.now(),
  shownMode = "",
  captureState = "idle",
  captureToken = 0,
  captureWanted = false,
  captureTimer = null,
  captureError = null;
let controlMode =
  params.get("controls") === "window"
    ? "window"
    : storage.get("control-mode", "window");
if (!["trackball", "window"].includes(controlMode)) controlMode = "trackball";
function unlock() {
  audio.unlock().then((ok) => {
    if (!ok) $("mute-button").title = "Audio unavailable in this browser";
  });
}
function handleAction(action) {
  if (action === "audio") {
    unlock();
    return;
  }
  if (action === "start") {
    if (game.state.mode === "paused") {
      resume();
      return;
    }
    if (["title", "gameover"].includes(game.state.mode)) {
      input.clear();
      renderer.particles = [];
      renderer.labels = [];
      if (suppliedSeed === null)
        game.seed = crypto.getRandomValues(new Uint32Array(1))[0];
      game.start();
      shots = 0;
      game.state.highScore = Math.max(best, game.state.highScore || 0);
      unlock();
      canvas.focus({ preventScroll: true });
      accumulator = 0;
      shownMode = "";
      if (controlMode === "trackball" && !padStart) {
        game.pause();
        requestTrackball();
      }
      draw(0);
    }
    return;
  }
  if (action === "escape") {
    cancelCapture();
    pause();
    draw(0);
    return;
  }
  if (action === "pause") {
    if (game.state.mode === "paused") resume();
    else pause();
    return;
  }
  if (action === "blur" || action === "pointer-exit") {
    cancelCapture();
    pause();
    return;
  }
  if (action === "mute") {
    audio.setMuted(!audio.muted);
    storage.set("muted", audio.muted);
    syncPrefs();
    return;
  }
  if (action === "fullscreen") {
    toggleFullscreen();
    return;
  }
  if (action === "capture-enter") {
    if (!captureWanted) {
      document.exitPointerLock();
      return;
    }
    clearTimeout(captureTimer);
    captureState = "locked";
    captureError = null;
    finishResume();
    syncCaptureUI();
    return;
  }
  if (action === "capture-exit") {
    cancelCapture();
    pause();
    syncCaptureUI();
    return;
  }
  if (action === "capture-error") captureFailed();
}
function cancelCapture() {
  captureWanted = false;
  captureToken++;
  clearTimeout(captureTimer);
  captureState = "idle";
}
function captureFailed(error) {
  if (captureState !== "requesting") return;
  clearTimeout(captureTimer);
  captureWanted = false;
  captureError = error?.message || "The browser declined pointer capture.";
  captureState = "blocked";
  input.clear();
  syncCaptureUI();
  shownMode = "";
  draw(0);
}
function requestTrackball() {
  if (input.captured || captureState === "requesting") return;
  const token = ++captureToken;
  captureWanted = true;
  captureState = "requesting";
  captureError = null;
  input.clear();
  canvas.focus({ preventScroll: true });
  syncCaptureUI();
  // Invoke in the original click/keypress, before any await can lose user activation.
  try {
    if (!canvas.requestPointerLock)
      throw new Error("Pointer capture is unsupported.");
    const result = canvas.requestPointerLock();
    // Legacy WebKit returns void: only pointerlockchange confirms success.
    result?.catch((error) => {
      if (token === captureToken) captureFailed(error);
    });
    captureTimer = setTimeout(() => {
      if (token === captureToken && !input.captured) captureFailed();
    }, 5000);
  } catch (error) {
    captureFailed(error);
  }
}
function syncCaptureUI() {
  $("capture-button").textContent =
    captureState === "locked"
      ? "TRACKBALL CONNECTED"
      : captureState === "requesting"
        ? "CONNECTING TRACKBALL…"
        : captureState === "blocked"
          ? "RETRY TRACKBALL ↗"
          : "ENABLE TRACKBALL ↗";
  $("capture-button").disabled = ["requesting", "locked"].includes(
    captureState,
  );
  $("capture-note").textContent =
    captureState === "locked"
      ? "Continuous motion. Escape releases & pauses."
      : captureState === "blocked"
        ? "Capture denied. Try this game in an active Chrome window."
        : controlMode === "window"
          ? "Window controls stop at screen edges. P pauses."
          : "Start captures the pointer. Escape releases & pauses.";
  $("window-controls-btn").textContent =
    controlMode === "trackball"
      ? "USE WINDOW / KEYBOARD CONTROLS"
      : "USE TRACKBALL CONTROLS";
}
function pause() {
  cancelCapture();
  if (["playing", "dying", "wave"].includes(game.state.mode)) game.pause();
  input.clear();
  audio.stop();
  if (input.captured) document.exitPointerLock();
  syncCaptureUI();
  draw(0);
}
function resume() {
  if (game.state.mode !== "paused") return;
  if (controlMode === "trackball" && !input.captured && !padStart) requestTrackball();
  else finishResume();
}
function finishResume() {
  if (game.state.mode === "paused") game.resume();
  input.clear();
  accumulator = 0;
  last = performance.now();
  unlock();
  canvas.focus({ preventScroll: true });
  shownMode = "";
  draw(0);
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($("machine").requestFullscreen)
      await $("machine").requestFullscreen();
    else
      $("capture-note").textContent = "Use your browser’s fullscreen command.";
  } catch {
    $("capture-note").textContent = "Fullscreen unavailable in this browser.";
  }
}
$("start-btn").addEventListener("click", () => handleAction("start"));
$("pause-button").addEventListener("click", () => {
  handleAction("pause");
  if (game.state.mode !== "paused") canvas.focus({ preventScroll: true });
});
$("mute-button").addEventListener("click", () => {
  handleAction("mute");
  if (game.state.mode === "playing") canvas.focus({ preventScroll: true });
});
$("fullscreen-button").addEventListener("click", () =>
  handleAction("fullscreen"),
);
$("sensitivity").addEventListener("input", (e) => {
  input.clear();
  input.sensitivity = Number(e.target.value);
  storage.set("sensitivity", input.sensitivity);
  syncPrefs();
});
$("volume").addEventListener("input", (e) => {
  audio.setVolume(Number(e.target.value) / 100);
  storage.set("volume", audio.volume);
  unlock();
  syncPrefs();
});
for (const el of [$("sensitivity"), $("volume")])
  el.addEventListener("pointerdown", () => pause());
$("capture-button").addEventListener("click", () => {
  controlMode = "trackball";
  storage.set("control-mode", controlMode);
  if (["title", "gameover"].includes(game.state.mode)) handleAction("start");
  else {
    if (["playing", "wave", "dying"].includes(game.state.mode)) game.pause();
    requestTrackball();
  }
});
$("window-controls-btn").addEventListener("click", () => {
  controlMode = controlMode === "trackball" ? "window" : "trackball";
  storage.set("control-mode", controlMode);
  cancelCapture();
  syncCaptureUI();
  handleAction("start");
});
function syncPrefs() {
  $("sensitivity").value = input.sensitivity;
  $("sensitivity-output").value = input.sensitivity.toFixed(2) + "×";
  $("volume").value = Math.round(audio.volume * 100);
  $("volume-output").value = Math.round(audio.volume * 100) + "%";
  $("mute-button").textContent = audio.muted ? "SOUND OFF" : "SOUND ON";
  $("mute-button").setAttribute(
    "aria-label",
    audio.muted ? "Unmute sound" : "Mute sound",
  );
  $("mute-button").setAttribute("aria-pressed", String(audio.muted));
}
function consumeEvents() {
  const events = game.drainEvents();
  if (
    events.some((event) =>
      ["player-death", "life-start", "game-over"].includes(event.type),
    )
  )
    input.clear();
  for (const event of events) if (event.type === "fire") shots++;
  renderer.events(events);
  for (const event of events) audio.play(event);
}
function simulate(seconds) {
  accumulator += seconds;
  const steps = Math.floor((accumulator + 1e-9) / C.STEP);
  if (!steps) return;
  for (let n = 0; n < steps; n++) {
    const control = input.take(C.STEP, steps - n);
    const before = { ...game.state.player };
    game.step(control, C.STEP);
    if (["playing", "wave"].includes(game.state.mode)) {
      for (const axis of ["x", "y"]) {
        const intended = Math.max(
          -C.PLAYER_MAX_STEP,
          Math.min(C.PLAYER_MAX_STEP, control["d" + axis]),
        );
        let actual = game.state.player[axis] - before[axis];
        if (axis === "x")
          actual = wrappedDelta(actual);
        if (Math.abs(intended - actual) > 1e-7) input.spin.stopAxis(axis);
      }
    }
    consumeEvents();
  }
  accumulator -= steps * C.STEP;
}
function updateHUD() {
  const s = game.state;
  const score = s.score || 0;
  if (score > best) {
    best = score;
    storage.set(scoreKey, best);
  }
  s.highScore = Math.max(best, s.highScore || 0);
  $("score").textContent = String(score).padStart(6, "0");
  $("high-score").textContent = String(best).padStart(6, "0");
  $("wave").textContent = String(s.wave || 1).padStart(2, "0");
  $("lives-icons").textContent = Array.from(
    { length: Math.min(s.lives ?? 3, C.MAX_LIVES) },
    () => "▴",
  ).join(" ");
  $("lives-label").textContent = `${s.lives ?? 3} TOOLS REMAINING`;
  const mode = s.mode;
  $("pause-button").disabled = ["title", "gameover"].includes(mode);
  const pauseLabel =
    mode === "paused" ? "RESUME <kbd>P</kbd>" : "PAUSE <kbd>P</kbd>";
  // Keep the pressed child attached between pointerdown and pointerup.
  if ($("pause-button").innerHTML !== pauseLabel)
    $("pause-button").innerHTML = pauseLabel;
  $("system-label").textContent =
    {
      title: "SYSTEM STANDBY",
      playing: "DRIVE ENGAGED",
      paused: "SYSTEM PAUSED",
      dying: "TOOL OFFLINE",
      wave: "NEXT CYCLE",
      gameover: "SYSTEM OFFLINE",
    }[mode] || "DRIVE ENGAGED";
  document.body.classList.toggle("playing", ["playing", "wave"].includes(mode));
  document.body.classList.toggle("paused", mode === "paused");
  const displayMode = mode === "paused" ? s.beforePause : mode;
  $("announcement").hidden = !["wave", "dying"].includes(displayMode);
  $("announcement").textContent =
    displayMode === "wave"
      ? `WAVE ${String(s.wave + 1).padStart(2, "0")}`
      : s.lives > 0
        ? "REPLACING TOOL"
        : "TOOL DESTROYED";
  if (mode === "gameover" && input.captured) {
    cancelCapture();
    document.exitPointerLock();
  }
  const overlayKey = mode + ":" + captureState + ":" + controlMode + ":" + s.variant;
  if (shownMode === overlayKey) return;
  shownMode = overlayKey;
  $("start-btn").disabled = captureState === "requesting";
  syncCaptureUI();
  const visible = ["title", "paused", "gameover"].includes(mode);
  $("overlay").hidden = !visible;
  $("overlay").classList.toggle("compact", mode !== "title");
  $("overlay").classList.toggle("paused", mode === "paused");
  $("overlay").classList.toggle(
    "capture-notice",
    mode === "paused" && ["requesting", "blocked"].includes(captureState),
  );
  if (!visible) return;
  $("overlay-title").classList.toggle("game-name", mode === "title");
  if (mode === "title") {
    $("overlay-eyebrow").textContent = "THE MACHINE HAS GONE ROGUE";
    $("overlay-title").innerHTML = "MECHA<span>PEDE</span>";
    $("overlay-description").innerHTML =
      "Break the chain.<br>Keep the machine from breaking you.";
    $("start-btn").innerHTML = "ENGAGE DRIVE <span>↗</span>";
    $("start-hint").innerHTML =
      controlMode === "trackball"
        ? "<kbd>ENTER</kbd> captures motion · <kbd>ESC</kbd> releases"
        : "or press <kbd>ENTER</kbd>";
  } else if (
    mode === "paused" &&
    ["requesting", "blocked"].includes(captureState)
  ) {
    const blocked = captureState === "blocked";
    $("overlay-eyebrow").textContent = blocked
      ? "PAUSED · POINTER RELEASED"
      : "PAUSED · CONNECTING";
    $("overlay-description").innerHTML = blocked
      ? "Pointer capture was declined. Retry in an active Chrome window, or use window controls below."
      : "Your game stays frozen until pointer control is ready.";
    $("start-btn").innerHTML = blocked
      ? "RETRY <span>↗</span>"
      : "CONNECTING…";
    $("start-hint").textContent = blocked
      ? "Press Enter to retry"
      : "Escape cancels";
  } else if (mode === "paused") {
    $("overlay-eyebrow").textContent = "PAUSED · POINTER RELEASED";
    $("start-btn").innerHTML = "RESUME <span>↗</span>";
    $("start-hint").innerHTML = "<kbd>P</kbd> / <kbd>ENTER</kbd> to resume";
  } else {
    $("overlay-eyebrow").textContent =
      score >= best && score > 0
        ? "PERSONAL BEST RECORDED"
        : "ALL CUTTING TOOLS LOST";
    $("overlay-title").innerHTML = "DRIVE<br><span>OFFLINE</span>";
    $("overlay-description").innerHTML =
      `SCORE ${String(score).padStart(6, "0")} · WAVE ${s.wave}<br>The machine is ready for another round.`;
    $("start-btn").innerHTML = "RESTART DRIVE <span>↗</span>";
    $("start-hint").innerHTML =
      controlMode === "trackball"
        ? "<kbd>ENTER</kbd> captures motion · <kbd>ESC</kbd> releases"
        : "or press <kbd>ENTER</kbd>";
  }
}
function draw(delta) {
  consumeEvents();
  renderer.draw(game.state, delta);
  audio.update(game.state);
  updateHUD();
}
const errors = [];
addEventListener('error', event => errors.push(String(event.message)));
addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
let frames = 0, shots = 0, menuIndex = 0, padStart = false;
const visibleModes = new Set(['title', 'paused', 'gameover']);
function stage() {
  const mode = game.state.mode;
  if (mode === 'title') return 'menu';
  return mode === 'gameover' || mode === 'paused' ? mode : 'playing';
}
function suspend() {
  input.clear();
  if (stage() === 'playing') pause();
}
const pad = createController({ keyboard: true, width: 161, onSuspend: suspend, onCancel: suspend });
const menu = ['start-btn', 'mute-button', 'volume', 'sensitivity'];
function focusMenu() {
  for (const [idx, id] of menu.entries()) $(id).classList.toggle('pad-focus', idx === menuIndex);
}
function beginOrResume() {
  input.clear();
  padStart = true;
  try { handleAction('start'); } finally { padStart = false; }
  menuIndex = 0;
  focusMenu();
}
function pollControls() {
  pad.setPlaying(stage() === 'playing');
  const { buttons, pressed, cancelled } = pad.poll();
  if (cancelled) return;
  if (pressed.START) {
    if (stage() === 'playing') { pause(); menuIndex = 0; focusMenu(); }
    else beginOrResume();
    return;
  }
  if (visibleModes.has(game.state.mode)) {
    if (pressed.UP || pressed.DOWN) {
      menuIndex = (menuIndex + (pressed.DOWN ? 1 : -1) + menu.length) % menu.length;
      focusMenu();
    }
    const active = $(menu[menuIndex]);
    if (active.type === 'range' && (pressed.LEFT || pressed.RIGHT)) {
      pressed.RIGHT ? active.stepUp() : active.stepDown();
      active.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (pressed.A) { if (menuIndex === 0) beginOrResume(); else if (active.tagName === 'BUTTON') active.click(); }
    if (pressed.B) { menuIndex = 0; focusMenu(); }
  } else if (pressed.B) { pause(); menuIndex = 0; focusMenu(); }
  if (pressed.X) handleAction('mute');
  // Native pad state remains independent of the upstream keyboard and pointer.
  input.pad = visibleModes.has(game.state.mode) ? {} : buttons;
}
const observe = () => ({
  game: 'mechapede', ready: true, stage: stage(), paused: stage() === 'paused', renderer: 'canvas2d', webglVersion: null,
  frames, gameplay: { frame: game.state.frame, playerX: game.state.player.x, playerY: game.state.player.y,
    shots, score: game.state.score, lives: game.state.lives, wave: game.state.wave },
  controller: pad.peek(), errors: errors.slice(),
});
Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot: observe }) });
function frame(now) {
  frames++;
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  pollControls();
  simulate(dt);
  draw(dt);
  if (frames % 6 === 0) window.PureGameHost?.publish?.(JSON.stringify(observe()));
  requestAnimationFrame(frame);
}
new ResizeObserver(() => {
  renderer.resize();
  input.clear();
  draw(0);
}).observe(canvas);
window.addEventListener("resize", () => {
  fitPlayfield();
  renderer.resize();
  input.clear();
  draw(0);
});
document.addEventListener("fullscreenchange", fitPlayfield);
syncPrefs();
syncCaptureUI();
draw(0);
requestAnimationFrame(frame);
