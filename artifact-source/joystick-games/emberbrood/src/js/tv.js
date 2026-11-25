import {createTV} from '../../../shared/triptych/tv.js';
import {state} from './game/state.js';
import {activeBattle} from './game/adventure.js';
import {saveTo} from './game/save.js';
import {show,currentScreenName,overlayOpen,dismissOverlay} from './ui/shell.js';
import {pauseAudio,unlock} from './audio.js';
import {advance,clockSnapshot} from '../tv-clock.js';
export function installEmberTV(){
 let paused=false,focus=null,scope='',edit=null,last=performance.now(),xPulse=false;
 const pane=document.createElement('section');pane.id='tv-pause';pane.hidden=true;pane.innerHTML='<div><h2>已暂停 · Emberbrood</h2><p id="tv-reason">START 继续冒险</p><button class="btn" data-resume>继续</button><button class="btn" data-title>保存并返回标题</button></div>';document.body.append(pane);
 const editor=document.createElement('aside');editor.id='tv-edit';editor.hidden=true;document.body.append(editor);
 function setPause(value,reason='START 继续冒险'){if(value===paused||value&&currentScreenName()==='title'&&!state.roster.length)return;paused=value;edit=null;editor.hidden=true;pane.hidden=!value;document.body.classList.toggle('tv-paused',value);document.getElementById('app').inert=value;document.getElementById('overlay').inert=value;document.getElementById('tv-reason').textContent=reason;pauseAudio(value);focus=null;scope='';last=performance.now();}
 pane.querySelector('[data-resume]').onclick=()=>setPause(false);pane.querySelector('[data-title]').onclick=()=>{saveTo('auto');location.reload();};
 const tv=createTV({game:'emberbrood',title:'Emberbrood · 余烬龙裔',controls:'方向键：焦点 / 调整\nA：选择 · B：返回\nX：滚动阅读 · Y：页签\n文本：A编辑，Y确认',suspend:()=>setPause(true,'连接变化或失焦 · 请按 START 继续'),observe:()=>{const b=activeBattle();return JSON.parse(JSON.stringify({renderer:'dom',stage:paused?'paused':currentScreenName()==='title'?'menu':state.ending?'ended':'playing',paused,gameplay:{screen:currentScreenName(),overlay:overlayOpen(),focus:focus?.textContent?.trim()||focus?.getAttribute('aria-label')||'',clockElapsed:clockSnapshot().elapsed,seed:state.seed,coin:state.coin,act:state.act,node:state.node,steps:state.stats.steps,stats:state.stats,roster:state.roster,rosterCount:state.roster.length,party:state.party,inventory:state.inventory,quests:state.quests,eggs:state.eggs,ending:state.ending,battle:b?{state:b.state,round:b.round,surge:b.surge,allies:b.allies,enemies:b.enemies}:null},ui:{overlay:overlayOpen(),focus:focus?.textContent?.trim()||focus?.getAttribute('aria-label')||'',focusId:focus?.id||'',editing:!!edit,scrollTop:document.getElementById('screen').scrollTop},timers:clockSnapshot()}));}});
 const keys={ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',Enter:'Enter',Space:'Enter',KeyA:'Enter',KeyB:'b',Escape:'b',KeyP:'p',KeyX:'X',KeyY:'Select'};
 const keyboardDown = new Set();
 function handleKeyboard(event) {
   const up = event.type === 'keyup';
   const releasing = up && keyboardDown.delete(event.code);
   const field = event.target;
   const textField = field?.isContentEditable || field?.tagName === 'TEXTAREA' ||
     (field?.tagName === 'INPUT' && (field.type === 'text' || field.type === 'search'));
   if (textField && !paused && !edit && !releasing) {
     const singleLineNavigation = field.tagName === 'INPUT' &&
       (event.code === 'ArrowUp' || event.code === 'ArrowDown');
     if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey ||
         (!singleLineNavigation && event.code !== 'Escape')) return;
   }
   const action = keys[event.code];
   if (!action) {
     if (paused) { event.preventDefault(); event.stopImmediatePropagation(); }
     return;
   }
   if (up && !releasing) return;
   if (!up) keyboardDown.add(event.code);
   event.preventDefault();
   event.stopImmediatePropagation();
   if (event.repeat) return;
   if (action === 'X') {
     if (event.type === 'keydown') xPulse = true;
   } else {
     window.PureGame.key(action, event.type === 'keydown');
   }
 }
 for (const type of ['keydown', 'keyup']) window.addEventListener(type, handleKeyboard, true);
 function candidates(){const host=paused?pane:overlayOpen()?document.getElementById('overlay'):document.getElementById(currentScreenName()==='battle'?'screen':'app');return [...host.querySelectorAll('button,input,select,textarea,[data-tv-action],[role="button"]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
 function choose(e){focus?.classList.remove('tv-focus');focus=e;if(e){e.classList.add('tv-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'});}}
 function sync(){const next=paused?'pause':overlayOpen()?'overlay':'screen:'+currentScreenName();const list=candidates();if(next!==scope||!list.includes(focus)){scope=next;choose(list[0]);}return list;}
 function move(n){const list=sync();if(list.length)choose(list[(Math.max(0,list.indexOf(focus))+n+list.length)%list.length]);}
 function changeValue(e,d){if(e.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+d+e.options.length)%e.options.length;e.dispatchEvent(new Event('change',{bubbles:true}));}else if(e.type==='range'){e.value=String(Math.max(Number(e.min),Math.min(Number(e.max),Number(e.value)+d*(Number(e.step)||.1))));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}
 function drawEdit(){editor.textContent='←→光标 · ↑↓字符 · A追加 · X删除 · Y确认 · B取消\n'+edit.value.slice(0,edit.index)+'['+(edit.value[edit.index]||' ')+']'+edit.value.slice(edit.index+1);}
 function editInput(p){const chars=' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';if(p.LEFT||p.RIGHT)edit.index=Math.max(0,Math.min(Math.max(0,edit.value.length-1),edit.index+(p.RIGHT?1:-1)));if(p.UP||p.DOWN){let v=[...(edit.value||' ')];const n=Math.max(0,chars.indexOf(v[edit.index]||' '));v[edit.index]=chars[(n+(p.UP?1:-1)+chars.length)%chars.length];edit.value=v.join('');}if(p.A&&edit.value.length<(Number(edit.el.maxLength)>0?edit.el.maxLength:28)){edit.value+='a';edit.index=edit.value.length-1;}if(p.X){edit.value=edit.value.slice(0,edit.index)+edit.value.slice(edit.index+1);edit.index=Math.max(0,edit.index-1);}if(p.Y||p.B){if(p.Y){edit.el.value=edit.value;edit.el.dispatchEvent(new Event('input',{bubbles:true}));edit.el.dispatchEvent(new Event('change',{bubbles:true}));}edit=null;editor.hidden=true;return;}drawEdit();}
 function back(){if(overlayOpen()){dismissOverlay();return;}if(currentScreenName()==='battle'){document.getElementById('battle-back')?.click();return;}if(!['title','place'].includes(currentScreenName()))show('place');else if(currentScreenName()==='place')show('map');}
 function loop(now){const dt=now-last;last=now;const f=tv.poll(!paused&&currentScreenName()!=='title');const p={...f.pressed,X:f.pressed.X||xPulse};xPulse=false;sync();if(p.START){if(paused)setPause(false);else if(currentScreenName()==='title'){unlock();focus?.click();}else setPause(true);}else if(edit)editInput(p);else{if(p.UP)move(-1);if(p.DOWN)move(1);if(p.LEFT||p.RIGHT){if(focus?.tagName==='SELECT'||focus?.type==='range')changeValue(focus,p.RIGHT?1:-1);else move(p.RIGHT?1:-1);}if(p.A&&focus){unlock();if(['text','search'].includes(focus.type)||focus.tagName==='TEXTAREA'){edit={el:focus,value:focus.value,index:0};editor.hidden=false;drawEdit();}else focus.click();}if(p.B){if(paused)setPause(false);else back();}if(p.Y&&!paused&&!overlayOpen()&&currentScreenName()!=='battle'){const tabs=[...document.querySelectorAll('#tabbar button')];const i=tabs.findIndex(e=>e.getAttribute('aria-current')==='true');tabs[(i+1)%tabs.length]?.click();}if(p.X){const s=paused?pane.querySelector('div'):overlayOpen()?document.querySelector('.overlay-inner'):document.getElementById('screen');s?.scrollBy({top:s.clientHeight*.7,behavior:'instant'});}}if(!paused)advance(dt);requestAnimationFrame(loop);}
 document.addEventListener('click',e=>{if(paused&&!pane.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}},true);requestAnimationFrame(loop);
}
