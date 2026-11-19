import {createController,BUTTONS} from './shared/web/input.js';
import {clearDrive,applyDrive,createMenuGate} from './tv-input.js';
export function installKartTV({state,input,getKart,getTrack,getCup,renderer,sound,hud,pauseGame,resumeGame,showMenu,typeKey,submitHello,openHelp,observe}){
 let frozen=false,wasPaused=false,focus=null,focusKey='',frames=0,local={},pulse={},previous={};const errors=[];const gate=createMenuGate();
 window.addEventListener('error',e=>errors.push(String(e.error?.message||e.message)));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason?.message||e.reason)));
 const layer=document.createElement('section');layer.id='tv-suspend';layer.hidden=true;layer.innerHTML='<div><h2>已暂停 · Kart Rush</h2><p>手柄连接变化或窗口失焦；请松开按键后继续。</p><button id="tv-resume">继续 · START / A</button></div>';document.body.append(layer);
 function clear(){clearDrive(input,getKart());local={};pulse={};previous={};}
 function freeze(){clear();if(frozen)return;wasPaused=state.paused;if(!state.paused)pauseGame();sound.suspend();frozen=true;layer.hidden=false;focus=null;}
 function resume(){const held={...previous};clear();previous=held;frozen=false;layer.hidden=true;if(!wasPaused&&state.paused)resumeGame();else if(!state.paused)sound.unlock();focus=null;}
 layer.querySelector('button').onclick=resume;
 const controller=createController({width:170,side:'right',top:'36%',onSuspend:freeze,onCancel:freeze});
 const help=document.createElement('aside');help.id='tv-help';help.textContent='↑油门 ↓刹车 ←→转向 · A道具 B反向道具 X复位 Y帮助 · START暂停\n菜单方向选择 A确认 B返回 · 姓名：A选字，Y完成';document.body.append(help);
 const keyboard={ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',KeyW:'UP',KeyS:'DOWN',KeyA:'LEFT',KeyD:'RIGHT',Enter:'A',Space:'A',KeyE:'A',KeyB:'B',KeyQ:'B',KeyR:'X',KeyX:'X',KeyY:'Y',KeyH:'Y',KeyP:'START',Escape:'START'};
 for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{const k=keyboard[e.code];if(!k)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;local[k]=type==='keydown';if(type==='keydown')pulse[k]=true;},true);
 const visible=e=>!!e&&!e.disabled&&e.getClientRects().length&&!e.closest('[hidden],.hidden')&&getComputedStyle(e).visibility!=='hidden';
 const identity=e=>e.id||[e.tagName,e.dataset.k,e.dataset.mode,e.dataset.pick,e.dataset.track,e.dataset.driver,e.dataset.view,e.dataset.vol,e.dataset.diff,e.textContent?.trim()].join('|');
 function activeScreen(){return frozen?layer:[hud.helloScreen,hud.pickScreen,hud.resultsScreen,hud.pauseScreen,hud.settingsScreen,hud.helpScreen,hud.menuScreen].find(e=>visible(e));}
 function list(){return [...(activeScreen()?.querySelectorAll('button,input,select')||[])].filter(visible);}
 function choose(e){focus?.classList.remove('tv-focus');focus=e;focusKey=e?identity(e):'';if(e){e.classList.add('tv-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'});}}
 function sync(){const opts=list();if(!opts.includes(focus))choose(opts.find(e=>identity(e)===focusKey)||opts[0]);return opts;}
 function move(d){const opts=sync();if(opts.length)choose(opts[(Math.max(0,opts.indexOf(focus))+d+opts.length)%opts.length]);}
 function activate(){if(!focus)return;sound.unlock();if(focus.id==='hello-name'){choose(document.querySelector('#kbd [data-k]'));return;}if(focus.dataset.k!==undefined){typeKey(focus.dataset.k);return;}focus.click();}
 function back(){const s=activeScreen();if(s===hud.pickScreen)document.getElementById('btn-pick-done').click();else if(s===hud.settingsScreen)document.getElementById('btn-settings-back').click();else if(s===hud.helpScreen)document.getElementById('btn-help-back').click();else if(s===hud.pauseScreen)resumeGame();else if(s===hud.resultsScreen)document.getElementById('btn-menu').click();}
 function tick(){frames++;const frame=controller.poll();const menu=frozen||state.paused||!hud.overlay.classList.contains('hidden');const held=gate(menu,Object.fromEntries(BUTTONS.map(k=>[k,!!frame.buttons[k]||!!local[k]||!!pulse[k]])));pulse={};const pressed=Object.fromEntries(BUTTONS.map(k=>[k,held[k]&&!previous[k]]));previous=held;
  controller.setPlaying(!menu);help.hidden=!menu;
  if(frame.cancelled){clearDrive(input,getKart());return;}
  if(frozen){sync();if(pressed.START||pressed.A)resume();return;}
  if(pressed.START){clearDrive(input,getKart());if(state.paused){if(activeScreen()===hud.pauseScreen)resumeGame();else back();}else if(state.phase==='race'||state.phase==='countdown')pauseGame();else if(activeScreen()===hud.helloScreen)submitHello();else if(activeScreen()===hud.menuScreen)document.getElementById('btn-start').click();else{sync();activate();}return;}
  if(menu){clearDrive(input,getKart());sync();if(pressed.UP)move(-1);if(pressed.DOWN)move(1);if(pressed.LEFT)move(-1);if(pressed.RIGHT)move(1);if(pressed.A)activate();if(pressed.B)back();if(pressed.X&&activeScreen()===hud.helloScreen)typeKey('back');if(pressed.Y){if(activeScreen()===hud.helloScreen)submitHello();else back();}return;}
  focus?.blur();focus?.classList.remove('tv-focus');focus=null;focusKey='';applyDrive(input,held,pressed);
  if(pressed.Y){clearDrive(input,getKart());pauseGame();openHelp();}
 }
 const snapshot=()=>{const k=getKart(),t=getTrack(),cup=getCup(),p=k.body.position,v=k.body.velocity;return JSON.parse(JSON.stringify({game:'kart-rush',renderer:renderer.capabilities.isWebGL2?'webgl2':'webgl1',webglVersion:renderer.capabilities.isWebGL2?2:1,frames,stage:frozen||state.paused?'paused':state.phase==='menu'?'menu':state.phase==='finished'?'ended':'playing',paused:frozen||state.paused,gameplay:{phase:state.phase,time:state.raceTime,countdown:state.countdown,track:t.id,speed:k.speed,x:p.x,y:p.y,z:p.z,vx:v.x,vz:v.z,lap:k.lap,progress:k.progress,place:k.place,boost:k.boost,driftCharge:k.driftCharge,item:k.item||null,cup:cup?{at:cup.at,pts:cup.pts,over:cup.over}:null,controls:{...input},autoGas:false,screen:activeScreen()?.id||null,focusId:focus?.id||'',focus:focus?.textContent?.trim()||focus?.getAttribute('aria-label')||'',...observe()},controller:controller.peek(),errors:[...errors]}));};Object.defineProperty(window,'JoystickGameQA',{value:Object.freeze({snapshot}),configurable:false,writable:false});return{tick,suspended:()=>frozen};
}
