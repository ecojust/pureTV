
import {Menus} from './src/src/ui/Menus';
import {TouchControls} from './src/src/core/TouchControls';
import {installTV} from './src/src/tv-input';
document.getElementById('boot').remove();
window.__calls=[];
const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
const player={id:1,connected:true,transport:'wifi',controllerId:'Royale-DOM-42',session:'dom-menu-one',cancelSeq:0,buttons:Object.fromEntries(keys.map(k=>[k,false])),buttonCounters:Object.fromEntries(keys.map(k=>[k,0]))};
let revision=0;
const info={storageKeys:['kr.controls.v1'],preferences:{},wifiController:{port:63485,serviceName:'Royale DOM calibration',inputEnabled:true}};
function publish(){window.JoystickDesktop.receive(info,{revision:++revision,inputEnabled:true,players:[player]});}
publish();
window.__native={player,publish,tap(key){player.buttons[key]=true;player.buttonCounters[key]++;publish();return new Promise(resolve=>setTimeout(()=>{player.buttons[key]=false;publish();resolve();},16));}};
const pad=new TouchControls();
const input={pad,state:{steer:0,itemPressed:false,pausePressed:false},touch:false,cancelTV(){},setTV(){}};
const karts=['Vela','Koa','Sol','Miso','Nori','Yuzu','Pip','Lux'].map((name,i)=>({id:i,isPlayer:i===0,stats:{name,color:{getHexString(){return 'ff3b5c'}},accelMul:1,topSpeedMul:1,weightMul:1,handlingMul:1},position:{toArray(){return [0,0,0]}},forwardSpeed:0}));
const race={state:0,raceTime:0,karts,player:karts[0],setPaused(){},selectKart(i){window.__calls.push(['selectKart',i]);},reset(){window.__calls.push(['reset']);}};
const ctx={race,input,bus:{on(){},emit(){}}};
const menus=new Menus(document.getElementById('ui'));menus.init(ctx);
const tv=installTV(ctx,input);
function frame(now){tv.poll(now);menus.update(ctx,0);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__observe=()=>({game:window.JoystickGameQA.snapshot(),native:structuredClone(player),saved:localStorage.getItem('kr.controls.v1'),calls:window.__calls});
