import {tvStore as store} from './src/src/tv-storage.js';import {createTVAdapter} from './src/src/tv-adapter.js';import {t as T,translateDom,LANG} from './src/src/i18n.js';
const $=id=>document.getElementById(id);translateDom(document.body);const TOUCH=false,mp=false;
const GFX_LEVELS = {
  low:  { label: T('流畅'),   pr: 0.8, aa: false, bloom: false, shadow: 0,    trees: 0.4, rain: 1200, smoke: 0.35 },
  mid:  { label: T('均衡'),   pr: 1.1, aa: false, bloom: true,  shadow: 1024, trees: 0.7, rain: 2500, smoke: 0.7 },
  high: { label: T('高画质'), pr: 1.5, aa: true,  bloom: true,  shadow: 2048, trees: 1,   rain: 5000, smoke: 1 },
  ultra: { label: T('极高'),  pr: 2.0, aa: true,  bloom: true,  shadow: 2048, trees: 1,   rain: 5000, smoke: 1 },
  // computers only: real grass, ambient occlusion, sharp wide shadows (too heavy for phones)
  max:  { label: T('极致'),   pr: 2.0, aa: true,  bloom: true,  shadow: 4096, trees: 1.3, rain: 6000, smoke: 1, grass: true, ao: false },   // (GTAO's depth/normal pass ignores alphaTest: card trees became pale walls in the sky)
};
function autoGfx() {
  if (!TOUCH) return 'high';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return 'ultra';
  return (navigator.deviceMemory || 4) <= 4 || (navigator.hardwareConcurrency || 4) <= 4 ? 'low' : 'mid';
}
const gfxId = GFX_LEVELS[store.get('nr-gfx')] && !(TOUCH && store.get('nr-gfx') === 'max') ? store.get('nr-gfx') : autoGfx();

let state=new URLSearchParams(location.search).get('fixture')==='pause'?'paused':'title',reflect=1,autoDegrade=true;
const scene={environmentIntensity:1},sound={vol:{master:1,car:1,rain:1,sfx:1,music:1},init(){},setVolume(k,v){this.vol[k]=v;}},flash=()=>{};
window.__uiFixture={resumeCalls:0,startCalls:0,rendererCreated:false,bootSerial:Number(sessionStorage.getItem('fixtureBoots')||0)+1};sessionStorage.setItem('fixtureBoots',String(window.__uiFixture.bootSerial));
function setPaused(p){state=p?'paused':'race';$('pause').hidden=!p;if(!p){$('volume').hidden=true;window.__uiFixture.resumeCalls++;}}
const VOL = [['master', '总音量'], ['car', '车辆（引擎、轮胎、风噪）'], ['rain', '雨声'], ['sfx', '音效（碰撞、倒计时、提示）'], ['music', '音乐（霓虹梦境）']].map(([k, s]) => [k, T(s)]);
const volBox = $('volume');
{
  const seg = (title, opts, cur, onPick, note) => {
    const row = document.createElement('div'); row.className = 'srow';
    const h = document.createElement('span'); h.textContent = title; row.append(h);
    const s = document.createElement('div'); s.className = 'seg'; s.setAttribute('role', 'group'); s.setAttribute('aria-label', title);
    for (const [v, txt] of opts) {
      const b = document.createElement('button'); b.textContent = txt; b.setAttribute('aria-pressed', String(v === cur));
      b.addEventListener('click', () => { s.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); onPick(v); });
      s.append(b);
    }
    row.append(s);
    if (note) { const n = document.createElement('span'); n.className = 'note'; n.textContent = note; row.append(n); }
    volBox.append(row);
  };
  const head = t => { const d = document.createElement('div'); d.className = 'shead'; d.textContent = t; volBox.append(d); };
  head(T('画面'));
  seg(T('画质'), Object.entries(GFX_LEVELS).filter(([k]) => k !== 'max' || !TOUCH).map(([k, v]) => [k, v.label]), gfxId, v => {
    if (v === gfxId) return;
    store.set('nr-gfx', v);
    if (state === 'title') { $('loading').hidden = false; setTimeout(() => location.reload(), 30); }
    else flash(T('回到主菜单后生效'));
  }, T('卡顿或手机发烫时选「流畅」。切换后会重新载入。'));
  seg(T('卡顿时自动降画质'), [[true, T('开')], [false, T('关')]], store.get('nr-autodeg') ?? true, v => { autoDegrade = v; store.set('nr-autodeg', v); }, T('关掉后始终保持你选的画质，哪怕掉帧。'));
  seg(T('语言'), [['zh', '中文'], ['en', 'English']], LANG, v => { store.set('nr-lang', v); $('loading').hidden = false; setTimeout(() => location.reload(), 30); });
  {
    const row = document.createElement('label'); row.className = 'vrow'; row.htmlFor = 'refl';
    const name = document.createElement('span'); name.textContent = T('反光强度');
    const input = document.createElement('input'); input.type = 'range'; input.id = 'refl'; input.min = 0; input.max = 150; input.value = Math.round(reflect * 100);
    const val = document.createElement('b'); val.className = 'num'; val.textContent = input.value;
    input.addEventListener('input', () => { val.textContent = input.value; reflect = input.value / 100; scene.environmentIntensity = reflect; store.set('nr-refl', reflect); });
    row.append(name, input, val); volBox.append(row);
  }
  if (TOUCH) {
    head(T('操作'));
    seg(T('转向方式'), [['pad', T('滑动转向板')], ['buttons', T('左右按钮')]], store.get('nr-steer') || 'pad', v => { store.set('nr-steer', v); document.body.classList.toggle('steer-buttons', v === 'buttons'); });
    const row = document.createElement('label'); row.className = 'vrow'; row.htmlFor = 'sens';
    const name = document.createElement('span'); name.textContent = T('转向灵敏度');
    const input = document.createElement('input'); input.type = 'range'; input.id = 'sens'; input.min = 50; input.max = 150; input.value = Math.round((store.get('nr-sens') ?? 1) * 100);
    const val = document.createElement('b'); val.className = 'num'; val.textContent = input.value;
    input.addEventListener('input', () => { val.textContent = input.value; steerSens = input.value / 100; store.set('nr-sens', steerSens); });
    row.append(name, input, val); volBox.append(row);
  }
  head(T('声音'));
}
for (const [k, label] of VOL) {
  const id = 'vol-' + k;
  const row = document.createElement('label'); row.className = 'vrow'; row.htmlFor = id;
  const name = document.createElement('span'); name.textContent = label;
  const input = document.createElement('input'); input.type = 'range'; input.min = 0; input.max = 100; input.id = id; input.value = Math.round(sound.vol[k] * 100);
  const val = document.createElement('b'); val.className = 'num'; val.textContent = input.value;
  input.addEventListener('input', () => { val.textContent = input.value; sound.setVolume(k, input.value / 100); store.set('nr-vol', sound.vol); });
  row.append(name, input, val); volBox.append(row);
}
const toggleVol = () => { sound.init(); volBox.hidden = !volBox.hidden; };
$('volbtn').addEventListener('click', toggleVol);
$('volbtn2').addEventListener('click', toggleVol);
$('volclose').addEventListener('click', () => { volBox.hidden = true; });

$('resume').addEventListener('click', () => (mp ? ($('pause').hidden = true) : setPaused(false)));
for(const id of ['loading','boot','mpbtn','lbbtn','hud'])$(id).hidden=true;$('title').hidden=state!=='title';$('pause').hidden=state!=='paused';const mode='race',LAPS=3,ghostData=null;  $('start').textContent = mode === 'race' ? T('开始比赛 · {0} 圈 ▸', LAPS) : T(ghostData ? '开始计时赛 · 挑战幽灵车 ▸' : '开始计时赛 ▸'); $('coins').textContent='🪙 300';
window.__device={buttons:{},seq:0,consumed:0,calls:0};window.PureGameHost={snapshot(){const d=window.__device;d.calls++;const buttons={...d.buttons};if(d.pulse){d.buttons={};d.pulse=false;d.consumed=d.seq;}return JSON.stringify({players:[{id:1,connected:true,transport:'wifi',controllerId:'Night-DOM-long-ID-42',session:1,buttons}]})},getInfo(){return JSON.stringify({wifiController:{port:63485,serviceName:'Night Racer UI fixture',addresses:['127.0.0.1']}})}};
const game={state:()=>state,pause:setPaused,title(){state='title';$('title').hidden=false;$('pause').hidden=true},start(){state='countdown';$('title').hidden=true;window.__uiFixture.startCalls++},reset(){throw Error('Not a gameplay fixture')},camera(){},snapshot:()=>({stage:state==='paused'?'paused':state==='title'?'menu':'playing',paused:state==='paused',gameplay:{state,renderPreset:gfxId,ready:true}})};
const tv=createTVAdapter(game);function frame(){tv.poll();requestAnimationFrame(frame)}requestAnimationFrame(frame);