/* Native WebView2 snapshot cache. Each of the nine physical buttons is independent.
 * Cumulative counters preserve short taps across native pushes; only snapshot()
 * consumes those cached pulses. Never call it from UI/diagnostic rendering. */
(function (root) {
  'use strict';
  const keys = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
  let preferences = new Set(['cf_ship_opts', 'feiche3d.v1']), storageMaxBytes = 65536;
  const originalSet = root.Storage?.prototype?.setItem;
  const originalRemove = root.Storage?.prototype?.removeItem;
  const originalClear = root.Storage?.prototype?.clear;
  let initialStorage = {};
  let info = {platform:'windows',language:'zh',wifiController:{state:'starting'}};
  let player = null, identity = null, revision = -1, suspendedRevision = -1;
  let counters = {}, pending = {}, blocked = {}, initialized = false, everConnected = false, disabled = false, seeded = false;
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  function send(message) { try { root.chrome?.webview?.postMessage(message); } catch (_) {} }
  function fits(value) { return typeof value === 'string' && value.length <= storageMaxBytes && new root.TextEncoder().encode(value).length <= storageMaxBytes; }
  if (originalSet) root.Storage.prototype.setItem = function(key, value) {
    key=String(key);value=String(value);originalSet.call(this,key,value);
    if (this === root.localStorage && preferences.has(key) && fits(value)) send({type:'preference',key,value});
  };
  if (originalRemove) root.Storage.prototype.removeItem = function(key) {
    key=String(key);originalRemove.call(this,key);
    if (this === root.localStorage && preferences.has(key)) send({type:'preference',key,value:null});
  };
  if (originalClear) root.Storage.prototype.clear = function() {
    originalClear.call(this);
    if (this === root.localStorage) for (const key of preferences) send({type:'preference',key,value:null});
  };
  function receive(nextInfo, sample) {
    if (!sample || !integer(sample.revision) || sample.revision < revision) return false;
    if (nextInfo && typeof nextInfo === 'object') {
      info = JSON.parse(JSON.stringify(nextInfo)); info.platform = 'windows';
      if (!seeded) {
        seeded = true;
        if (Array.isArray(info.storageKeys)) preferences=new Set(info.storageKeys.filter(key=>typeof key==='string'));
        if (Number.isSafeInteger(info.storageMaxBytes) && info.storageMaxBytes>0 && info.storageMaxBytes<=1048576) storageMaxBytes=info.storageMaxBytes;
        for (const key of preferences) {
          const value=info.preferences?.[key];
          try { if(fits(value)) originalSet?.call(root.localStorage,key,value); else originalRemove?.call(root.localStorage,key); initialStorage[key]=root.localStorage?.getItem(key)??null; } catch (_) { initialStorage[key]=null; }
        }
      }
      try { root.PureGame?.roomInfo(info); } catch (_) {}
    }
    if (sample.inputEnabled === false || info.wifiController?.inputEnabled === false) {
      if (!disabled) suspend();
      disabled = true; revision = sample.revision; suspendedRevision = revision; initialized = true;
      if (sample.players?.some(p=>p?.connected)) everConnected=true;
      return true;
    }
    disabled = false;
    if (sample.revision <= suspendedRevision) return false;
    if (sample.revision === revision) return true;
    const next = sample.players?.find(p=>p?.connected === true);
    if (!next) { player=null; identity=null; counters={}; pending={}; blocked={}; }
    else {
      const nextIdentity=JSON.stringify([next.controllerId,next.session]);
      const replacement=identity!==nextIdentity;
      const cancelled=!replacement && player && player.cancelSeq!==next.cancelSeq;
      const baseline=!initialized || cancelled || (replacement && everConnected);
      const nextCounters={}, buttons={};
      for (const key of keys) {
        const held=next.buttons?.[key]===true;
        if(baseline) blocked[key]=held;
        else if(!held) blocked[key]=false;
        const count=next.buttonCounters?.[key]; nextCounters[key]=integer(count)?count:0;
        pending[key]=baseline || blocked[key] ? false : !!pending[key] || nextCounters[key] > (replacement ? 0 : counters[key]||0);
        buttons[key]=held && !blocked[key];
      }
      counters=nextCounters; identity=nextIdentity; everConnected=true;
      player={id:1,connected:true,transport:'wifi',controllerId:String(next.controllerId||''),session:next.session,cancelSeq:integer(next.cancelSeq)?next.cancelSeq:0,buttons};
    }
    revision=sample.revision; initialized=true; return true;
  }
  function snapshot() {
    if(!player) return JSON.stringify({players:[],connections:0});
    const buttons={}; for(const key of keys) buttons[key]=player.buttons[key] || !!pending[key];
    const sample={...player,buttons,x:Number(buttons.RIGHT)-Number(buttons.LEFT),y:Number(buttons.DOWN)-Number(buttons.UP),a:buttons.A,b:buttons.B,start:buttons.START,select:buttons.Y};
    pending={}; return JSON.stringify({players:[sample],connections:1});
  }
  function suspend() {
    player=null;identity=null;counters={};pending={};blocked={};suspendedRevision=revision;
    try { root.PureGame?.suspend(true); } catch (_) {}
  }
  root.PureGameHost=Object.freeze({getInfo(){return JSON.stringify(info);},snapshot,publish(value){if(typeof value==='string' && value.length<=8192) try {send({type:'publish',value:JSON.parse(value)});}catch(_){}},exit(){send({type:'exit'});}});
  root.JoystickDesktop=Object.freeze({receive,suspend,initialStorage(){return {...initialStorage};}});
  root.document?.addEventListener('DOMContentLoaded',()=>send({type:'ready'}),{once:true});
})(window);
