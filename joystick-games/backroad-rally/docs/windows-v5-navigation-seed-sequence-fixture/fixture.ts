
import {configurePureTv} from './src/upstream/src/puretv';
import {StageMenus} from './src/upstream/src/menu/stageMenus';
const w=window;
let paused=false;
const menus=new StageMenus({sub:'isolated menu fixture',controls:[],mode:'quick',canPause:()=>true,onPause:p=>paused=p,restart:()=>{},recover:()=>{},quit:()=>{},settings:{} as any},{warmup_min_s:1.5,warmup_max_s:6,warmup_frame_ms:25,warmup_stable_frames:45,curtain_fade_s:.6});
configurePureTv({phase:()=>menus.ready&&!menus.open?'play':'menu',ready:()=>menus.ready,pause:()=>{if(!menus.open)menus.pause()},clear:()=>{},paused:()=>paused,audio:()=> 'fixture',observe:()=>({phase:'intro',ready:menus.ready})});
let last=performance.now();
function tick(now){const frameDt=now-last;last=now;menus.frame(Math.min(frameDt/1000,.1),frameDt,false);requestAnimationFrame(tick)}requestAnimationFrame(tick);
w.fixtureRead=()=>({ready:menus.ready,paused,open:menus.open,adapter:w.PureTvBackroad.snapshot(),game:w.JoystickGameQA.snapshot()});
