// pureTV input is sampled exactly once by Game.frame; QA only reads this cached frame.
const PureTVGLUP = (() => {
  let frames = 0;
  const errors = [];
  addEventListener('error', e => errors.push(String(e.error?.message || e.message)));
  addEventListener('unhandledrejection', e => errors.push(String(e.reason?.message || e.reason)));
  function cancel() { Game.pause(); Input.release(); Sound.suspend(true); }
  const controller = TVInput.createController({ width: 192, onSuspend: cancel, onCancel: cancel });
  const help = document.createElement('aside'); help.id = 'tv-controls';
  help.innerHTML = '<strong>GLUP · 沼泽猫鱼</strong><span>← → 移动 · ↑ 交谈 / 瞄准<br>↓ 蹲下 / 放下<br>A 跳跃 / 确认<br>B 吸入 / 蓄力后吐出<br>X 吹气（解锁后）<br>Y 声音 / 菜单返回<br>START 开始 / 暂停 / 继续</span>';
  document.body.append(help);
  function stage() { return Game.paused ? 'paused' : Game.state === 'play' ? 'playing' : Game.state === 'ending' ? 'ended' : 'menu'; }
  const snapshot = () => ({ game: 'glup', renderer: 'canvas2d', webglVersion: null, stage: stage(), paused: !!Game.paused, frames,
    gameplay: { screen: Game.state, tick: Game.state === 'play' ? L.time : 0, worldTick: Game.t, level: Game.level, selection: Game.sel,
      playerX: Player.x, playerY: Player.y, velocityX: Player.vx, velocityY: Player.vy, hp: Player.hp, sucking: !!Player.sucking,
      suckTicks: Player.suckT, charge: Player.charge, holding: Player.held?.kind || null, pearls: L.pearls || 0,
      projectiles: L.projs?.length || 0, arrival: !!Game.arrival, learning: !!Game.learning, talking: Charla.active(),
      muted: Sound.isMuted() }, audioState: Sound.stats().estado || 'not_created', controller: controller.peek(), errors: [...errors] });
  Object.defineProperty(window, 'JoystickGameQA', { value: Object.freeze({ snapshot }), writable: false, configurable: false });
  return {
    poll() {
      frames++;
      controller.setPlaying(Game.state === 'play' && !Game.paused);
      const frame = controller.poll();
      if (frame.cancelled) return;
      if (!Game.paused && Object.values(frame.pressed).some(Boolean)) Sound.suspend(false);
      const map = { LEFT:'left', RIGHT:'right', UP:'up', DOWN:'down', A:'jump', B:'fish', X:'puff',
        START:Game.state === 'play' ? 'pause' : 'confirm', Y:Game.state === 'play' && !Game.paused ? 'mute' : 'pause' };
      Input.nativeHeld = Object.fromEntries(['left','right','up','down','jump','fish','puff','pause','confirm','mute'].map(action => [action, false]));
      for (const [key, action] of Object.entries(map)) {
        Input.nativeHeld[action] = !!Input.nativeHeld[action] || !!frame.buttons[key];
        if (frame.pressed[key]) Input.press(action);
      }
      Input.sync();
    }
  };
})();
