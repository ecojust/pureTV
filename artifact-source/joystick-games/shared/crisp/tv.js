const engine = window.__puretvCrisp;
let stage = 'menu', frames = 0, selected = 0, difficultyIndex = 0, help = false;
let reason = '', blockedA = true, lastGameHeld = false, inputFrame, pending = { held: false, pressed: false, released: false };
const runtimeErrors = [];
window.addEventListener('error',event => runtimeErrors.push(String(event.message)));
window.addEventListener('unhandledrejection',event => runtimeErrors.push(String(event.reason)));
const levels = [{name:'标准',value:1},{name:'进阶',value:1.5},{name:'挑战',value:2}];
const clone = value => JSON.parse(JSON.stringify(value));
const $ = id => document.getElementById(id);
document.documentElement.style.setProperty('--accent',config.accent);
document.documentElement.style.setProperty('--back',config.background);
$('game-name').textContent = config.name;
$('game-name-en').textContent = config.title;
$('rule').textContent = config.rule;
$('help').textContent = config.help;
function clearInput() { blockedA = true; lastGameHeld = false; pending = {held:false,pressed:false,released:false}; engine.cancel(); }
function pause(message = '已暂停 · START 继续') {
  if (stage !== 'playing') return;
  stage = 'paused'; reason = message; selected = 0; help = false;
  clearInput(); controller.cancel(); render();
}
const controller = createController({ width:196, onSuspend:() => pause('已暂停 · 失焦或后台，请按 START 继续'), onCancel:() => pause('已暂停 · 手柄连接变化，请按 START 继续') });
engine.initialize();
const canvas = document.querySelector('canvas');
$('game-board').append(canvas);
const gl = config.pixi ? (canvas.getContext('webgl2') || canvas.getContext('webgl')) : null;
const webglVersion = gl ? gl.getParameter(gl.VERSION) : null;
const renderer = gl ? (webglVersion.includes('WebGL 2') ? 'webgl2' : 'webgl1') : 'canvas2d';
function begin() {
  stage = 'playing'; selected = 0; help = false; reason = '';
  blockedA = true; lastGameHeld = false; pending = {held:false,pressed:false,released:false};
  engine.start(levels[difficultyIndex].value); render();
}
function resume() {
  if (stage !== 'paused') return;
  stage = 'playing'; selected = 0; help = false; reason = ''; blockedA = true;
  pending = {held:false,pressed:false,released:false}; engine.resume(); render();
}
function returnToMenu() { stage = 'menu'; reason = ''; selected = 0; help = false; clearInput(); render(); }
function optionsForStage() {
  if (stage === 'playing') return [];
  if (help) return [{label:'返回',run:() => { help = false; selected = 0; render(); }}];
  if (stage === 'paused') return [{label:'继续游戏',run:resume},{label:'重新开始',run:begin},{label:'玩法说明',run:() => {help=true;selected=0;render();}},{label:'返回主菜单',run:returnToMenu}];
  return [{label:stage === 'ended' ? '再玩一次' : '开始游戏',run:begin},{label:'难度：'+levels[difficultyIndex].name+'  ◀ ▶',run:() => cycleDifficulty(1)},{label:'玩法说明',run:() => {help=true;selected=0;render();}}];
}
function cycleDifficulty(direction) { difficultyIndex = (difficultyIndex+direction+levels.length)%levels.length; render(); }
function render() {
  document.body.dataset.stage = stage;
  controller.setPlaying(stage === 'playing');
  $('stage-label').textContent = stage === 'playing' ? config.action : stage === 'paused' ? reason : stage === 'ended' ? '本局结束 · 挑战更高得分' : '按 START 开始';
  $('help').hidden = !help;
  $('rule').hidden = help;
  const list = optionsForStage(); selected = Math.max(0,Math.min(selected,list.length-1));
  $('menu').replaceChildren(...list.map((option,i) => {
    const button = document.createElement('button'); button.textContent=option.label;
    button.setAttribute('aria-current',String(i === selected));
    button.tabIndex=i === selected?0:-1;
    button.addEventListener('click',() => {selected=i;option.run();});
    return button;
  }));
}
function navigate(frame) {
  if (frame.pressed.START) { if (stage === 'playing') pause(); else if (stage === 'paused') resume(); else begin(); return; }
  if (frame.pressed.B) {
    if (stage === 'playing') pause();
    else if (help) {help=false;selected=0;render();}
    else if (stage === 'paused' || stage === 'ended') returnToMenu();
    else {help=true;selected=0;render();}
    return;
  }
  if (stage === 'playing') return;
  const list=optionsForStage();
  if (frame.pressed.UP || frame.pressed.DOWN) { selected=(selected+(frame.pressed.UP?-1:1)+list.length)%list.length; render(); }
  if (!help && stage !== 'paused' && (frame.pressed.LEFT || frame.pressed.RIGHT)) cycleDifficulty(frame.pressed.LEFT?-1:1);
  if (frame.pressed.A && !blockedA) list[selected]?.run();
}
const keys={Enter:'Enter',Space:'Enter',KeyA:'Enter',KeyP:'p',Escape:'b',KeyB:'b',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
for (const type of ['keydown','keyup']) window.addEventListener(type,event => {
  const mapped=keys[event.code]; if (!mapped) return;
  event.preventDefault(); if (event.repeat) return;
  window.PureGame.key(mapped,type==='keydown');
});
canvas.addEventListener('pointerdown',event=> {event.preventDefault();canvas.setPointerCapture(event.pointerId);window.PureGame.key('Enter',true);});
canvas.addEventListener('pointerup',()=>window.PureGame.key('Enter',false));
canvas.addEventListener('pointercancel',()=>controller.cancel());
function loop() {
  frames++;
  inputFrame = controller.poll();
  if (!inputFrame.buttons.A) blockedA = false;
  navigate(inputFrame);
  if (stage === 'playing') {
    pending.held = !blockedA && inputFrame.buttons.A;
    pending.pressed ||= !blockedA && inputFrame.pressed.A;
    pending.released ||= !blockedA && inputFrame.released.A && (lastGameHeld || pending.pressed);
    if (engine.step(pending)) { lastGameHeld = pending.held; pending.pressed=false; pending.released=false; }
    if (engine.snapshot().state === 'gameOver') { stage='ended';selected=0;clearInput();render(); }
  }
  if (stage === 'menu') engine.paintTitle();
  $('score').textContent = '得分 '+Math.floor(engine.snapshot().score);
  requestAnimationFrame(loop);
}
Object.defineProperty(window,'JoystickGameQA',{value:Object.freeze({snapshot:() => clone({
  game:config.id,renderer,webglVersion,stage,paused:stage === 'paused',frames,errors:runtimeErrors,
  gameplay:{...engine.snapshot(),...readGameState()},controller:controller.peek(),
  menu:{selected,difficulty:levels[difficultyIndex].name,help},
  input:{held:input.isPressed,pressed:input.isJustPressed,released:input.isJustReleased},
  layout:{width:innerWidth,height:innerHeight}
})})});
render(); requestAnimationFrame(loop);
