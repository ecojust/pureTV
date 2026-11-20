import { createController } from '../../../shared/web/input.js';
import { TowerScene } from './scene.js';
import { floors, createRun, move, strike, guard, advance, buy, wares, keyNames, enemyStats, directions, readCheckpoint } from './tower.js';

const id = name => document.getElementById(name);
const key = 'puretv.sabertower.checkpoint.v1';
let checkpoint;
try { checkpoint = readCheckpoint(localStorage.getItem(key)); } catch {}
let run = checkpoint ?? createRun(), menu = '', selection = 0, actions = [];
let scene, frameCount = 0, moveDelay = 0, lastTime = 0;
const errors = [];
const controller = createController({keyboard:true,width:188,onSuspend:pause,onCancel:pause});
function openMenu(type, heading, description, items, tag = '光刃魔塔') {
  menu = type; selection = 0; actions = items;
  id('overlay').hidden = false; id('eyebrow').textContent = tag;
  id('title').textContent = heading; id('description').textContent = description;
  const buttons = items.map(([label, action], index) => {
    const el = document.createElement('button'); el.textContent = label;
    el.onclick = action; el.onfocus = () => { selection = index; }; return el;
  });
  id('choices').replaceChildren(...buttons); buttons[0]?.focus({preventScroll:true});
  controller.setPlaying(false);
}
function closeMenu() {
  menu = ''; id('overlay').hidden = true; controller.setPlaying(true); moveDelay=.18;
}
function saveFloor() {
  checkpoint = readCheckpoint(JSON.stringify(run));
  try { localStorage.setItem(key, JSON.stringify(checkpoint)); } catch {}
}
function begin() {
  run = createRun(); saveFloor(); closeMenu();
}
function restore() { run = readCheckpoint(JSON.stringify(checkpoint)) || createRun(); closeMenu(); }
function startMenu() {
  const options = checkpoint ? [['继续 · 第 '+(checkpoint.floor+1)+' 层',restore],['重新冒险',resetMenu]] : [['进入魔塔',begin]];
  openMenu('title','光刃魔塔','携光刃登上二十一层，寻回黎明之冠。收集同色钥匙开门，用晶石、药水和商人补给迎战守卫。',
    [...options,['操作与图鉴',()=>book(startMenu)]],'SABER MAGIC TOWER');
}
function resetMenu() {
  openMenu('reset','重新冒险','重新开局将替换本地楼层存档。',[['保留存档',startMenu],['从一层开始',begin]]);
}
function pause() {
  if (!menu) openMenu('paused','暂停','进出楼层时自动记录进度。',[['继续游戏',closeMenu],['操作与图鉴',()=>book(pauseMenu)],['回到标题',startMenu]]);
}
function pauseMenu() { menu=''; pause(); }
function book(back) {
  const records = ['g','s','w'].concat([6,13,20].includes(run.floor)?['K']:[])
    .map(k=>{ const e=enemyStats(run.floor,k); return e.name+'　生命 '+e.hp+'　攻 '+e.attack+'　防 '+e.def; });
  openMenu('book','怪物手册','方向键移动，走向敌人开始决斗。Z / A 连斩，X / B 在蓄力条将满时格挡，C / X 重斩，V / Y 查看手册。P / START 暂停。\n\n'+records.join('\n'),[['返回',back]],'第 '+(run.floor+1)+' 层');
}
function shop() {
  openMenu('shop','塔中商人',run.notice+'　金币 '+run.gold,[
    ...wares.map((w,i)=>[w.label+' +'+w.gain+'　'+w.price+' 金',()=>{ buy(run,i); shop(); }]),
    ['离开',()=>{ run.mode='explore'; closeMenu(); }]
  ]);
}
function finish() {
  const won = run.mode==='won';
  if (won) { checkpoint=null; try { localStorage.removeItem(key); } catch {} }
  openMenu(won?'won':'lost',won?'黎明归来':'光刃熄灭',won?'二十一层的封印已经解除。你击败了 '+run.kills+' 名守卫，带回黎明之冠。':'守卫挡住了你的去路。可从最近进入的楼层重新尝试。',won?[['回到标题',startMenu]]:[['从楼层存档重试',restore],['回到标题',startMenu]]);
}
function handle(frame,dt) {
  const p=frame.pressed,b=frame.buttons;
  if (frame.cancelled) return;
  if (menu) {
    if (p.DOWN||p.UP) {
      const next=(selection+(p.DOWN?1:-1)+actions.length)%actions.length;
      id('choices').children[next]?.focus();
    } else if ((p.A||p.START) && actions.length) actions[selection][1]();
    else if ((p.B||p.Y) && ['shop','book','reset','paused'].includes(menu)) {
      if (menu==='paused') closeMenu();
      else actions[menu==='reset'?0:actions.length-1][1]();
    }
    return;
  }
  if (p.START) { pause(); return; }
  if (p.Y) { book(closeMenu); return; }
  if (run.mode==='duel') {
    if (p.B) guard(run);
    if (p.X) strike(run,true);
    else if (b.A) strike(run);
    advance(run,dt);
  } else if (run.mode==='explore') {
    moveDelay-=dt;
    const pressedDirection=Object.keys(directions).find(k=>p[k]);
    const direction=pressedDirection || (moveDelay<=0 && Object.keys(directions).find(k=>b[k]));
    if (direction) {
      if (move(run,direction)==='checkpoint') saveFloor();
      moveDelay=.16;
    }
    if (run.mode==='shop') shop();
  }
  if (run.mode==='won'||run.mode==='lost') finish();
}
function updateText(el,text) { if(el.textContent!==text) el.textContent=text; }
let lastKeys='', lastActivity='';
function hud() {
  updateText(id('place'),floors[run.floor].name); updateText(id('floorNo'),String(run.floor+1).padStart(2,'0'));
  for (const [el,value] of [['hp',run.hp],['atk',run.attack],['def',run.defense],['gold',run.gold]]) updateText(id(el),String(value));
  updateText(id('notice'),run.notice);
  const keys=Object.keys(keyNames).map((k,i)=>'<i style="--key:'+['#ffcd68','#8adeff','#ff8a96'][i]+'">'+keyNames[k]+' '+run.keys[k]+'</i>').join('');
  if (keys!==lastKeys) { id('keys').innerHTML=keys; lastKeys=keys; }
  const duel=run.duel;
  const activity=run.mode==='duel' && duel?
    '<b>'+duel.enemy.name+'　'+duel.hp+' / '+duel.enemy.hp+'</b>敌方蓄力<progress max="100" value="'+Math.round((1-duel.timer/duel.enemy.period)*100)+'"></progress>剑气 '+duel.energy+' / 4<br>A 连斩 · B 格挡 · X 重斩':
    '<b>楼层探索</b>方向键移动 · 靠近守卫进入决斗<br>Y 怪物手册 · START 暂停<br>键盘 Z / X / C / V 对应 A / B / X / Y';
  if(activity!==lastActivity) { id('activity').innerHTML=activity; lastActivity=activity; }
}

function tick(now) {
  const dt=Math.min(.08,Math.max(0,(now-lastTime)/1000)); lastTime=now;
  const frame=controller.poll(); frameCount++;
  if (scene) {
    handle(frame,dt); hud();
    if (!menu || frameCount===1 || frameCount%4===0) scene.draw(run,now/1000,Math.max(dt,1/60));
  }
  requestAnimationFrame(tick);
}
window.JoystickGameQA=Object.freeze({snapshot:()=>({
  game:'saber-magic-tower',renderer:'webgl2',webglVersion:scene?2:null,frames:frameCount,
  ready:!!scene,stage:!menu?'playing':menu==='paused'?'paused':['won','lost'].includes(menu)?'ended':'menu',
  playing:!menu,paused:menu==='paused',ended:['won','lost'].includes(menu),error:errors[0]||null,
  controller:controller.peek(),gameplay:{overlay:menu,floor:run.floor+1,mode:run.mode,position:[run.x,run.z],
    hp:run.hp,gold:run.gold,kills:run.kills,steps:run.steps,duelHealth:run.duel?.hp??0}
})});
try { scene=new TowerScene(document.querySelector('canvas')); startMenu(); }
catch(error) {
  errors.push(error.message);
  openMenu('error','无法显示魔塔','这台设备需要支持 WebGL 2 的浏览器或电视 WebView。',[]);
}
requestAnimationFrame(tick);
