import {createController} from "../../shared/web/standard-gamepad.js";

export function connectTV(arena) {
  const source = arena.sources.puretv = {dx: 0, dy: 0, bomb: false, act: false};
  let focus = null, lastScreen = "", frames = 0;
  function release() {
    for (const held of Object.values(arena.sources)) {
      Object.assign(held, {dx: 0, dy: 0, bomb: false, act: false});
    }
    if (arena.screen === "game") arena.pause(true);
  }
  const pad = createController({keyboard: true, onSuspend: release, onCancel: release, width: 160});
  function buttons(root) {
    return Array.from(root.querySelectorAll("button:not(:disabled),input[type=checkbox]"))
      .filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== "hidden");
  }
  function select(button) {
    focus?.classList.remove("tv-focus");
    focus = button;
    if (focus) {
      focus.classList.add("tv-focus");
      if (focus.matches("input")) document.activeElement?.blur();
      else focus.focus({preventScroll: true});
      focus.scrollIntoView({block: "nearest", inline: "nearest"});
    }
  }
  function snapshot() {
    const frame = pad.peek(), game = arena.snapshot();
    return {...game, game: "kaboom-arena", ready: true, paused: arena.paused, frames, renderer: game.gameplay.renderer === "3d" ? "webgl2" : "canvas2d",
      webglVersion: game.gameplay.renderer === "3d" ? document.getElementById("c3").getContext("webgl2")?.getParameter(0x1f02) || "" : "",
      controller: frame};
  }
  window.addEventListener("keydown", e => {
    if (arena.screen === "localLobby" && e.code === "Space" && !e.repeat) {
      e.preventDefault();
      e.stopImmediatePropagation();
      arena.joinLocal("kb1");
    }
  }, true);
  window.JoystickGameQA = Object.freeze({snapshot});
  let ownsStandardPad = false;
  return {
    get ownsStandardPad() { return ownsStandardPad; },
    poll() {
      frames++;
      const frame = pad.poll(), key = frame.buttons, hit = frame.pressed;
      ownsStandardPad = frame.transport === "gamepad";
      const playing = arena.screen === "game" && !arena.paused && !arena.rematch;
      pad.setPlaying(playing);
      if (frames % 6 === 0 && window.PureGameHost?.publish) window.PureGameHost.publish(JSON.stringify(snapshot()));
      if (frame.cancelled) return;
      if (playing) {
        if (focus) select(null);
        lastScreen = "";
        if (hit.START) { release(); return; }
        source.dx = Number(key.RIGHT) - Number(key.LEFT);
        source.dy = Number(key.DOWN) - Number(key.UP);
        source.bomb ||= hit.A;
        source.act ||= hit.X;
        if (hit.Y) document.querySelector("#muteBtn").click();
        return;
      }
      Object.assign(source, {dx: 0, dy: 0, bomb: false, act: false});
      const help = document.getElementById("help");
      const root = help?.getClientRects().length ? help :
        arena.paused ? document.getElementById("pause") :
        arena.rematch ? document.getElementById("rematch") : document.querySelector(".screen.on");
      if (!root) return;
      const items = buttons(root);
      // A joins seat one in the local lobby. A second player joins with Space or a USB pad.
      if (root.id === "localLobby" && hit.A && document.querySelector("#localStart").disabled) {
        arena.joinLocal("puretv"); return;
      }
      if (lastScreen !== root.id || !items.includes(focus)) {
        select(root.id === "menu" ? root.querySelector('[data-solo="3"]') : items[0]);
        lastScreen = root.id;
      }
      if (!items.length) return;
      if (hit.B) {
        if (root.id === "pause") arena.pause(false);
        else if (root.id === "help") document.getElementById("helpDone").click();
        else if (root.id !== "menu") arena.back();
        return;
      }
      const direction = hit.UP || hit.LEFT ? -1 : hit.DOWN || hit.RIGHT ? 1 : 0;
      if (direction) select(items[(items.indexOf(focus) + direction + items.length) % items.length]);
      if (hit.START && root.id === "pause") arena.pause(false);
      else if (hit.START && root.id === "localLobby" && !document.querySelector("#localStart").disabled) document.querySelector("#localStart").click();
      else if (hit.START || hit.A) focus?.click();
    }
  };
}
