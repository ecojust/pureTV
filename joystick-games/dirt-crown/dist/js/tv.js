import { createController, BUTTONS } from '../shared/web/input.js';
import { drivingHeld, edges } from './tv-input.js';

export function installDirtTV({app,input,UI,pause,renderer,unlock,setLifecyclePaused}) {
 let frozen=false, focus=null, focusKey='', frames=0, local={}, localPulse={}, previous={}, editing=null;
 const errors=[];
 window.addEventListener('error',e=>errors.push(String(e.error?.message||e.message)));
 window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason?.message||e.reason)));
 const layer=document.createElement('section');layer.id='tv-suspend';layer.hidden=true;
 layer.innerHTML='<div><h2>已暂停 · Dirt Crown</h2><p>连接变化或窗口失焦，操作已取消。</p><button id="tv-resume">继续 · START / A</button></div>';
 document.body.append(layer);
 const editor=document.createElement('aside');editor.id='tv-editor';editor.hidden=true;document.body.append(editor);
 function clear(){input.clear();local={};localPulse={};previous={};}
 function freeze(){clear();editing=null;editor.hidden=true;if(app.mode==='loading')return;setLifecyclePaused(true);frozen=true;layer.hidden=false;focus=null;}
 function resume(){clear();setLifecyclePaused(false);frozen=false;layer.hidden=true;focus=null;}
 layer.querySelector('button').onclick=resume;
 const controller=createController({width:170,side:'right',top:'42%',onSuspend:freeze,onCancel:freeze});
 const help=document.createElement('aside');help.id='tv-help';help.textContent='方向选择 · A确认 B返回 · START暂停/继续 · ↑油门 ↓刹车 A漂移 B氮气 X复位 Y镜头';document.body.append(help);
 const keyboard={KeyW:'UP',KeyS:'DOWN',KeyA:'LEFT',KeyD:'RIGHT',KeyR:'X',KeyC:'Y',ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',Enter:'A',NumpadEnter:'A',Space:'A',KeyB:'B',ShiftLeft:'B',ShiftRight:'B',KeyX:'X',KeyY:'Y',KeyP:'START',Escape:'START'};
 for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{
  const key=keyboard[e.code];if(!key)return;
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;local[key]=type==='keydown';if(type==='keydown')localPulse[key]=true;
 },true);
 const visible=e=>!!e&&!e.disabled&&e.getClientRects().length&&!e.closest('[hidden],.hidden')&&getComputedStyle(e).visibility!=='hidden';
 const identity=e=>e.id||[e.tagName,e.getAttribute('data-t'),e.getAttribute('data-v'),e.getAttribute('data-key'),e.getAttribute('data-tab'),e.getAttribute('data-ev'),e.getAttribute('data-cat'),e.getAttribute('data-paint'),e.getAttribute('data-liv'),e.textContent?.trim()].join('|');
 function host(){return frozen?layer:UI.modalOpen()?document.getElementById('modal'):UI.storyActive()?document.getElementById('story'):document.getElementById(app.mode==='hub'?'hub':app.mode==='results'?'results':'title');}
 function list(){return [...(host()?.querySelectorAll('button,input,select,[role=button]')||[])].filter(visible);}
 function choose(el){focus?.classList.remove('tv-focus');focus=el;focusKey=el?identity(el):'';if(el){el.classList.add('tv-focus');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});}}
 function sync(){const options=list();if(!options.includes(focus))choose(options.find(e=>identity(e)===focusKey)||options[0]);return options;}
 function move(delta){const options=sync();if(options.length)choose(options[(Math.max(0,options.indexOf(focus))+delta+options.length)%options.length]);}
 function value(delta){if(!focus)return false;if(['number','range'].includes(focus.type)){const step=Number(focus.step)||1;focus.value=String(Math.max(Number(focus.min||0),Math.min(Number(focus.max||99),Number(focus.value)+step*delta)));focus.dispatchEvent(new Event('input',{bubbles:true}));focus.dispatchEvent(new Event('change',{bubbles:true}));return true;}return false;}
 function editDraw(){editor.textContent='←→光标 · ↑↓字符 · A追加 · X删除 · Y保存 · B取消\n'+editing.value.slice(0,editing.index)+'['+(editing.value[editing.index]||' ')+']'+editing.value.slice(editing.index+1);}
 function editKeys(p){const chars=' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';if(p.LEFT||p.RIGHT)editing.index=Math.max(0,Math.min(Math.max(0,editing.value.length-1),editing.index+(p.RIGHT?1:-1)));if(p.UP||p.DOWN){const arr=[...(editing.value||' ')],n=Math.max(0,chars.indexOf(arr[editing.index]||' '));arr[editing.index]=chars[(n+(p.UP?1:-1)+chars.length)%chars.length];editing.value=arr.join('');}if(p.A&&editing.value.length<(editing.el.maxLength>0?editing.el.maxLength:12)){editing.value+='a';editing.index=editing.value.length-1;}if(p.X){editing.value=editing.value.slice(0,editing.index)+editing.value.slice(editing.index+1);editing.index=Math.max(0,editing.index-1);}if(p.Y||p.B){if(p.Y){editing.el.value=editing.value;editing.el.dispatchEvent(new Event('input',{bubbles:true}));editing.el.dispatchEvent(new Event('change',{bubbles:true}));}editing=null;editor.hidden=true;return;}editDraw();}
 function activate(){if(!focus)return;if(focus.type==='text'){editing={el:focus,value:focus.value,index:0};editor.hidden=false;editDraw();}else if(!['range','number'].includes(focus.type)){unlock();focus.click();}}
 function back(){if(UI.modalOpen()){const cancel=['m-no','m-back','m-ok','p-res'].map(id=>document.getElementById(id)).find(visible);if(cancel)cancel.click();else UI.closeModal();}else if(app.mode==='hub')UI.hubMenu();else if(app.mode==='results')document.getElementById('r-cont')?.click();}
 function tick(){
  frames++;
  const frame=controller.poll();
  const buttons=Object.fromEntries(BUTTONS.map(k=>[k,!!frame.buttons[k]||!!local[k]||!!localPulse[k]]));
  localPulse={};
  const pressed=edges(buttons,previous);previous=buttons;
  const menu=frozen||UI.modalOpen()||UI.storyActive()||app.mode!=='race'||app.paused;
  controller.setPlaying(!menu);help.hidden=!menu;
  document.body.classList.toggle('tv-menu',menu);
  if(frame.cancelled){input.clear();return;}
  if(frozen){sync();if(pressed.START||pressed.A)resume();return;}
  if(pressed.START){input.clear();if(editing){editing=null;editor.hidden=true;return;}if(app.mode==='race'){if(app.paused){const resumeButton=document.getElementById('p-res');if(visible(resumeButton))resumeButton.click();else back();}else if(UI.storyActive())freeze();else pause();}else if(UI.storyActive())freeze();else if(app.mode==='hub')UI.hubMenu();else{sync();activate();}return;}
  if(menu){input.tvHeld.clear();sync();if(editing){editKeys(pressed);return;}if(UI.storyActive()){if(pressed.A)UI.storyAdvance();if(pressed.X)document.getElementById('dlg-skip')?.click();return;}if(pressed.UP)move(-1);if(pressed.DOWN)move(1);if(pressed.LEFT||pressed.RIGHT){const d=pressed.RIGHT?1:-1;if(!value(d))move(d);}if(pressed.A)activate();if(pressed.B)back();if(pressed.Y&&app.mode==='hub'&&!UI.modalOpen()){const tabs=[...document.querySelectorAll('#hub-tabs button')];const i=tabs.findIndex(e=>e.classList.contains('on'));tabs[(i+1)%tabs.length]?.click();}return;}
  focus?.blur();focus?.classList.remove('tv-focus');focus=null;focusKey='';
  input.tvHeld=drivingHeld(buttons);
  if(pressed.X)input.emit('reset');if(pressed.Y)input.emit('camera');
 }
 const snapshot=()=>{const r=app.race,p=r?.player;return JSON.parse(JSON.stringify({game:'dirt-crown',renderer:renderer.capabilities.isWebGL2?'webgl2':'webgl1',webglVersion:renderer.capabilities.isWebGL2?2:1,frames,stage:frozen||app.paused?'paused':app.mode==='title'||app.mode==='loading'?'menu':app.mode==='results'?'ended':'playing',paused:frozen||app.paused,gameplay:{mode:app.mode,phase:r?.phase||null,time:r?.t||0,countdown:r?.cd||0,track:app.ev?.track||null,lap:p?.lap||0,x:p?.x||0,z:p?.z||0,speed:p?.speed||0,heading:p?.h||0,nitro:p?.nitro||0,ghost:p?.ghost||0,coins:app.profile?.coins||0,results:app.profile?.results||{},levels:app.profile?.levels||{},profileName:app.profile?.name||null,guest:!!app.profile?.guest,quality:app.settings.quality,autoGas:input.autoGas,controls:{...input.ctl},focus:focus?.textContent?.trim()||'',focusId:focus?.id||'',modal:UI.modalOpen(),story:UI.storyActive(),camera:app.settings.camera},ui:{editing:!!editing,focusId:focus?.id||'',panelOverflow:document.getElementById('puretv-controller-panel')?.scrollHeight>document.getElementById('puretv-controller-panel')?.clientHeight},controller:controller.peek(),errors:[...errors]}));};
 Object.defineProperty(window,'JoystickGameQA',{value:Object.freeze({snapshot}),writable:false,configurable:false});
 return {tick,suspended:()=>frozen};
}
