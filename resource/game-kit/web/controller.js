/* Shared LAN controller. Pointer state is authoritative; cancellation never becomes a tap. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), ui = $('controller');
  const english = !navigator.language.toLowerCase().startsWith('zh');
  const words = english ? {connecting:'Connecting…',connected:'Connected · watch the TV',lost:'Reconnecting…',full:'This game already has a player.',invalid:'Scan the QR code on your TV again.',start:'Start / pause',select:'Restart',retry:'Reconnect',fullscreen:'Fullscreen',direction:'Drag anywhere on the left to steer',error:'Could not connect. Check the TV and Wi-Fi.'} : {connecting:'正在连接…',connected:'已连接 · 看着电视玩',lost:'连接断开，正在重连…',full:'本游戏已有玩家，请使用原来的手机。',invalid:'请重新扫描电视上的二维码。',start:'开始 / 暂停',select:'重新开始',retry:'重新连接',fullscreen:'全屏',direction:'在左侧任意位置滑动控制方向',error:'无法连接，请检查电视和 Wi-Fi。'};
  for (const id of ['start','select','retry','fullscreen']) $(id).textContent = words[id];
  $('stick-caption').textContent = words.direction;
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  const room = new URLSearchParams(location.search).get('room') || '', storageKey = 'puretv-room:' + location.host + ':' + room;
  let session = ''; try { session = sessionStorage.getItem(storageKey) || ''; } catch (_) {}
  let ws, connected = false, terminal = false, leaving = false, reconnect = 0, helloTimer = 0, attempts = 0, seq = 0, lastSent = '', lastTime = 0;
  let stickPointer = null, originX = 0, originY = 0, radius = 65, stickX = 0, stickY = 0;
  const touches = new Map(), keys = new Set(), input = {x:0,y:0,aimX:0,aimY:0,a:false,b:false,start:false,select:false,cancelSeq:0};
  const visible = () => !document.hidden && !leaving;
  function status(text, error = false) { $('status').textContent = text; ui.classList.toggle('error', error); ui.classList.toggle('offline', !connected); }
  function update() {
    input.x = stickPointer === null ? Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')) : stickX;
    input.y = stickPointer === null ? Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')) : stickY;
    for (const name of ['a','b','start','select']) input[name] = [...touches.values()].includes(name) || keys.has(name);
    $('thumb').style.transform = `translate(${input.x * 38}px,${input.y * 38}px)`;
    for (const name of ['a','b','start','select']) $(name).classList.toggle('pressed', input[name]);
  }
  function send(force = false) {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now(), value = JSON.stringify(input);
    if (!force && (now - lastTime < 30 || value === lastSent && now - lastTime < 250)) return;
    try { ws.send(JSON.stringify({type:'input',...input,seq:++seq})); lastSent=value; lastTime=now; }
    catch (_) { connected=false; release(false); }
  }
  function release(sendNow = true) {
    input.cancelSeq = input.cancelSeq >= Number.MAX_SAFE_INTEGER ? 0 : input.cancelSeq + 1;
    touches.clear(); keys.clear(); stickPointer=null; stickX=stickY=0;
    $('stick').style.left=''; $('stick').style.top=''; update(); if (sendNow) send(true);
  }
  function clearTimers() { clearTimeout(reconnect); clearTimeout(helloTimer); reconnect=helloTimer=0; }
  function schedule() {
    if (terminal || reconnect || !visible()) return;
    reconnect=setTimeout(() => {reconnect=0;connect();},Math.min(6000,500 * 2 ** Math.min(attempts,4)));
  }
  function connect() {
    if (terminal || !visible()) return;
    clearTimers(); release(false); connected=false; status(attempts ? words.lost : words.connecting);
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(room)) { terminal=true; status(words.invalid,true); return; }
    const old=ws; ws=null; if(old)old.close();
    let socket; try { socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws?room=${encodeURIComponent(room)}`); }
    catch (_) { attempts++; schedule(); return; }
    ws=socket; seq=0; lastSent=''; lastTime=0; attempts++;
    helloTimer=setTimeout(() => {if(ws===socket&&!connected)socket.close();},7000);
    socket.addEventListener('open',() => { if(ws!==socket||!visible()){socket.close();return;} socket.send(JSON.stringify({type:'hello',session})); });
    socket.addEventListener('message',event => {
      if(ws!==socket||typeof event.data!=='string'||event.data.length>32768)return;
      let data; try {data=JSON.parse(event.data);}catch(_){return;} if(!data||typeof data!=='object')return;
      if(data.type==='welcome') {
        if(data.player!==1||typeof data.session!=='string'||!/^[a-zA-Z0-9_-]{16,128}$/.test(data.session)){terminal=true;status(words.invalid,true);socket.close();return;}
        clearTimeout(helloTimer); session=data.session; try{sessionStorage.setItem(storageKey,session);}catch(_){}
        connected=true; attempts=0; release(false); status(words.connected); $('retry').hidden=true; send(true);
      } else if(data.type==='error') {
        release(); connected=false; terminal=true; status(data.code==='room_full'?words.full:words.error,true); $('retry').hidden=false;socket.close();
      }
    });
    socket.addEventListener('close',() => {if(ws!==socket)return;clearTimeout(helloTimer);release(false);connected=false; if(!terminal){status(words.lost,true);schedule();}});
    socket.addEventListener('error',() => {if(ws===socket)socket.close();});
  }
  $('stick-zone').addEventListener('pointerdown',event => {
    if(!connected||event.button>0||stickPointer!==null)return;event.preventDefault();stickPointer=event.pointerId;originX=event.clientX;originY=event.clientY;
    radius=Math.max(35,Math.min(70,innerHeight*.18));$('stick').style.left=originX+'px';$('stick').style.top=originY+'px';
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch(_){} update();send(true);
  });
  window.addEventListener('pointermove',event => {
    if(event.pointerId!==stickPointer)return;event.preventDefault();let x=(event.clientX-originX)/radius,y=(event.clientY-originY)/radius,n=Math.hypot(x,y);
    if(n<.12)x=y=0;else if(n>1){x/=n;y/=n;}stickX=Math.round(x*1000)/1000;stickY=Math.round(y*1000)/1000;update();send();
  },{passive:false});
  for(const name of ['a','b','start','select']) $(name).addEventListener('pointerdown',event => {
    if(!connected||event.button>0)return;event.preventDefault();touches.set(event.pointerId,name);try{event.currentTarget.setPointerCapture(event.pointerId);}catch(_){}update();send(true);
  });
  function endPointer(event) {
    let changed=touches.delete(event.pointerId);if(event.pointerId===stickPointer){stickPointer=null;stickX=stickY=0;$('stick').style.left='';$('stick').style.top='';changed=true;}
    if(changed){if(event.type!=='pointerup')input.cancelSeq++;update();send(true);}
  }
  for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,endPointer,true);
  const keyFor=event => ({' ':'a',z:'a',x:'b',b:'b',Enter:'start',p:'start',r:'select',Shift:'select'}[event.key.length===1?event.key.toLowerCase():event.key]||event.key);
  document.addEventListener('keydown',event => {const key=keyFor(event);if(!connected||!['a','b','start','select','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key))return;if(event.target.closest('#retry,#fullscreen'))return;event.preventDefault();keys.add(key);update();send(true);});
  document.addEventListener('keyup',event => {const key=keyFor(event);if(!keys.delete(key))return;event.preventDefault();update();send(true);});
  for(const event of ['contextmenu','selectstart','dragstart','gesturestart'])document.addEventListener(event,e=>e.preventDefault());
  document.addEventListener('touchstart',event=>{if(!event.target.closest('#retry,#fullscreen'))event.preventDefault();},{passive:false});
  window.addEventListener('blur',()=>release());window.addEventListener('resize',()=>release());
  document.addEventListener('visibilitychange',()=>{if(document.hidden){release();clearTimers();connected=false;if(ws)ws.close();}else connect();});
  window.addEventListener('pagehide',()=>{release();leaving=true;clearTimers();connected=false;if(ws)ws.close();});
  window.addEventListener('pageshow',event=>{if(event.persisted){leaving=false;terminal=false;connect();}});
  window.addEventListener('online',()=>{if(!connected)connect();});
  $('retry').addEventListener('click',()=>{terminal=false;attempts=0;connect();});
  if(!document.documentElement.requestFullscreen)$('fullscreen').hidden=true;
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}release();});
  setInterval(()=>{if(visible())send();},33);
  fetch('game-config.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('config');return response.json();}).then(config=>{
    const title=english?config.nameEn:config.name;if(typeof title==='string'){$('game-name').textContent=title;document.title=title;}
    ui.dataset.actions=config.actions===1||Array.isArray(config.actions)&&config.actions.length===1?'1':'2';
    for(const [index,name] of ['a','b'].entries()) {const label=config['action'+name.toUpperCase()+(english?'En':'')]||config['action'+name.toUpperCase()]||(Array.isArray(config.actions)?config.actions[index]:null);if(typeof label==='string')$('action-'+name).textContent=label;}
    connect();
  }).catch(()=>{terminal=true;status(words.error,true);$('retry').hidden=false;});
})();
