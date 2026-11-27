import {createController} from 'puretv-input-bridge';

export function createTV(game) {
  let stage = 'loading';
  let frames = 0, published = 0;
  let x = innerWidth * 0.5, y = innerHeight * 0.5;
  const menu = document.getElementById('tv-menu');
  const launch = document.getElementById('launch');
  const restart = document.getElementById('return');
  const cursor = document.getElementById('tv-cursor');
  const heading = menu.querySelector('h1');
  const intro = document.getElementById('tv-intro');
  const viewport = document.getElementById('viewport');
  const controller = createController({side:'right', onCancel: pause, onSuspend: pause});
  let lastGamepad = {}, blocked = new Set();

  function show(next) {
    stage = next;
    document.body.dataset.tvStage = stage;
    menu.hidden = stage === 'playing' || stage === 'loading';
    cursor.hidden = true;
    controller.setPlaying(stage === 'playing');
    heading.textContent = stage === 'paused' ? '指挥已暂停' : '星落舰队';
    launch.textContent = stage === 'paused' ? '继续指挥' : '开始指挥';
    restart.hidden = stage !== 'paused';
    if (stage === 'playing') viewport.focus({preventScroll:true});
    else if (!menu.hidden) launch.focus({preventScroll:true});
  }
  function pause() {
    if (stage === 'playing') show('paused');
  }
  function begin() {
    if (stage !== 'menu' && stage !== 'paused') return;
    show('playing');
    void game.audio.start();
  }
  launch.addEventListener('click', begin);
  restart.addEventListener('click', () => location.reload());
  window.addEventListener('keydown', event => {
    if (stage === 'playing' && event.code === 'Escape' && !game.menu.isOpen) {
      event.preventDefault(); event.stopImmediatePropagation(); pause();
    } else if (stage === 'paused' && event.code === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); begin();
    }
  }, true);
  window.addEventListener('pointermove', event => { if (event.isTrusted) cursor.hidden = true; });
  function pointer(button) {
    if (button === 0) {
      const control = document.elementFromPoint(x, y)?.closest('button,input,[role="button"],a');
      if (control) {control.click();return;}
    }
    for (const type of ['pointermove','pointerdown','pointerup']) {
      viewport.dispatchEvent(new PointerEvent(type, {bubbles:true, cancelable:true, pointerId:87, isPrimary:true,
        pointerType:'mouse', clientX:x, clientY:y, button, buttons:type === 'pointerdown' ? (button === 2 ? 2 : 1) : 0}));
    }
  }
  function cycleShip() {
    const ships = game.world.ships.items.filter(ship => ship.alive && ship.team === 0 && ship.dockedIn < 0);
    if (!ships.length) return;
    const index = ships.findIndex(ship => ship.id === game.world.selection[0]);
    const ship = index < 0 ? ships.find(ship => ship.id !== game.world.motherships[0]) || ships[0] : ships[(index + 1) % ships.length];
    game.controls.setSelection([ship.id]);
    game.cam.frame([ship.id],game.world);
  }
  function samplePad() {
    let pad;
    try { pad = [...(navigator.getGamepads?.() || [])].find(p => p?.connected); } catch { /* controller policy */ }
    const button = index => !!pad?.buttons[index]?.pressed;
    return {
      UP:button(12) || (pad?.axes[1] ?? 0) < -0.4, DOWN:button(13) || (pad?.axes[1] ?? 0) > 0.4,
      LEFT:button(14) || (pad?.axes[0] ?? 0) < -0.4, RIGHT:button(15) || (pad?.axes[0] ?? 0) > 0.4,
      A:button(0),B:button(1),X:button(2),Y:button(3),START:button(9),
    };
  }
  function snapshot() {
    const w=game.world, id=w.selection[0], ship=id == null ? null : w.ships.items[id];
    const gl=game.stage?.renderer.getContext();
    return {game:'starfall',ready:stage !== 'loading',stage,paused:stage === 'paused',frames,
      renderer:gl && !gl.isContextLost() ? 'webgl2' : null,webglVersion:gl?.getParameter(gl.VERSION) || '',
      canvasWidth:gl?.drawingBufferWidth || 0,canvasHeight:gl?.drawingBufferHeight || 0,controller:controller.peek(),
      gameplay:{time:w.time,selected:w.selection.length,ship:id ?? -1,order:ship?.order?.kind || '',cursorX:x,cursorY:y,
        x:ship?.pos.x ?? 0,y:ship?.pos.y ?? 0,z:ship?.pos.z ?? 0,ships:w.ships.liveCount()}};
  }
  window.JoystickGameQA = Object.freeze({snapshot});
  let last = performance.now();
  function pump(now) {
    requestAnimationFrame(pump);
    frames++;
    const dt = Math.min((now-last)/1000,0.1);last=now;
    const remote=controller.poll(), pad=samplePad(), down={}, edge={};
    for (const key of Object.keys(pad)) {
      down[key]=remote.buttons[key] || pad[key];
      if (!down[key]) blocked.delete(key);
      edge[key]=!blocked.has(key) && (remote.pressed[key] || (pad[key] && !lastGamepad[key]));
    }
    lastGamepad=pad;
    const before=stage;
    if (stage==='loading' && window.__starfallReady) show('menu');
    else if (stage==='playing') {
      if (edge.START) pause();
      else {
        const dx=Number(down.RIGHT)-Number(down.LEFT),dy=Number(down.DOWN)-Number(down.UP);
        if (dx || dy) {
          x=Math.max(3,Math.min(innerWidth-3,x+dx*dt*innerWidth*.55));
          y=Math.max(3,Math.min(innerHeight-3,y+dy*dt*innerHeight*.7));
          cursor.style.left=x+'px';cursor.style.top=y+'px';cursor.hidden=false;
        }
        if (edge.X) cycleShip();
        if (edge.Y && game.world.selection.length) game.cam.frame([...game.world.selection], game.world);
        if (edge.A) pointer(0);
        if (edge.B) pointer(2);
      }
    } else if (stage==='paused' || stage==='menu') {
      if (stage==='paused' && (edge.UP || edge.DOWN)) (document.activeElement===launch ? restart : launch).focus();
      if (edge.START || edge.B && stage==='paused') begin();
      else if (edge.A) (document.activeElement===restart && !restart.hidden ? restart : launch).click();
    }
    if (before!==stage) blocked=new Set(Object.keys(down).filter(key=>down[key]));
    if (window.PureGameHost?.publish && (before!==stage || now-published>=200)) {
      const value=snapshot();
      delete value.controller.info;
      window.PureGameHost.publish(JSON.stringify(value));published=now;
    }
  }
  requestAnimationFrame(pump);
  return {get playing(){return stage==='playing';}};
}
