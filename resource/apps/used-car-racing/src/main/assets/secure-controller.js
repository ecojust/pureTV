/* A secure, top-level sensor page talks to its explicitly opened LAN controller.
 * Only the LAN opener owns the TV WebSocket. No mixed-content exception, public
 * relay, certificate bypass, or cross-origin permission is required. */
(function(root){
  'use strict';
  var ORIGIN='https://ecojust.github.io';
  var VERSION='0.1.1',PATH='/pureTV/controller/used-car/'+VERSION+'/';
  var PAGE=ORIGIN+PATH;
  var KIND='puretv-used-car-bridge-v1';
  var TOKEN=/^[a-zA-Z0-9_-]{16,128}$/;
  var CHANNEL=/^[a-f0-9]{32}$/;
  var MAX_FRAME=2048,MAX_AGE=400,ACK_TIMEOUT=900;
  function status(state,reason){root.dispatchEvent(new CustomEvent('usedcar-secure-status',{detail:{state:state,reason:reason||''}}));}
  function privateOrigin(value){
    try{
      var url=new URL(value);
      if(url.origin!==value||url.protocol!=='http:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return false;
      var host=url.hostname;
      if(host==='localhost'||host==='[::1]')return true;
      if(!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))return false;
      var parts=host.split('.').map(Number);
      if(parts.some(function(p){return p<0||p>255;}))return false;
      return parts[0]===10||parts[0]===127||parts[0]===192&&parts[1]===168||parts[0]===172&&parts[1]>=16&&parts[1]<=31||parts[0]===169&&parts[1]===254;
    }catch(_){return false;}
  }
  function validId(id){return Number.isInteger(id)&&id>0&&id<1000000000;}
  function validFrame(value){
    if(typeof value!=='string'||value.length>MAX_FRAME)return null;
    try{var frame=JSON.parse(value);if(!frame||typeof frame!=='object'||Array.isArray(frame)||!['hello','input'].includes(frame.type))return null;return frame;}catch(_){return null;}
  }
  var fragment=new URLSearchParams(location.hash.slice(1));
  var secureChild=location.origin===ORIGIN&&location.pathname===PATH;
  if(secureChild){
    var parentOrigin=fragment.get('parent')||'',room=fragment.get('room')||'',channel=fragment.get('channel')||'';
    var opener=root.opener,allowed=!!opener&&privateOrigin(parentOrigin)&&TOKEN.test(room)&&CHANNEL.test(channel)&&root.isSecureContext;
    var sockets={},nextId=0,closing=false;
    // Remove room/channel from the visible address after retaining them in memory.
    // The initial fragment is never part of a request to the static host.
    try{history.replaceState(null,'',location.pathname);}catch(_){}
    function post(message){if(!allowed||closing)return false;message.kind=KIND;message.channel=channel;try{opener.postMessage(message,parentOrigin);return true;}catch(_){return false;}}
    function ProxySocket(){
      this.readyState=0;this.id=++nextId;this.listeners={};this.lastAck=performance.now();this.created=this.lastAck;this.lastSent=0;this.lastAckSerial=0;this.timer=0;sockets[this.id]=this;
      var self=this;
      this.timer=setInterval(function(){
        if(self.readyState===3)return;
        if(!allowed||opener.closed){self.fail('opener-closed');return;}
        if(self.readyState===0&&performance.now()-self.created>6000){self.fail('bridge-unavailable');return;}
        if(self.readyState===1&&self.lastSent>self.lastAckSerial&&performance.now()-self.lastAck>ACK_TIMEOUT)self.fail('bridge-timeout');
      },200);
      if(!allowed||!post({op:'connect',id:this.id}))setTimeout(function(){self.fail('bridge-unavailable');},0);
    }
    ProxySocket.prototype.addEventListener=function(type,listener){if(typeof listener==='function')(this.listeners[type]||(this.listeners[type]=[])).push(listener);};
    ProxySocket.prototype.removeEventListener=function(type,listener){var list=this.listeners[type]||[];this.listeners[type]=list.filter(function(item){return item!==listener;});};
    ProxySocket.prototype.emit=function(type,data){var event=type==='message'?new MessageEvent(type,{data:data}):new Event(type);(this.listeners[type]||[]).slice().forEach(function(listener){listener(event);});if(typeof this['on'+type]==='function')this['on'+type](event);};
    ProxySocket.prototype.finish=function(){if(this.readyState===3)return;this.readyState=3;clearInterval(this.timer);delete sockets[this.id];this.emit('close');};
    ProxySocket.prototype.fail=function(reason){if(this.readyState===3)return;status('failed',reason);post({op:'close',id:this.id});this.emit('error');this.finish();};
    ProxySocket.prototype.send=function(data){
      if(this.readyState!==1)throw new Error('Secure controller transport is not open');
      if(!validFrame(data))throw new Error('Invalid controller frame');
      var serial=++this.lastSent;
      if(!post({op:'send',id:this.id,serial:serial,at:Date.now(),data:data}))this.fail('bridge-unavailable');
    };
    ProxySocket.prototype.close=function(){if(this.readyState===3)return;post({op:'close',id:this.id});this.finish();};
    root.addEventListener('message',function(event){
      var data=event.data;
      if(event.source!==opener||event.origin!==parentOrigin||!data||data.kind!==KIND||data.channel!==channel||!validId(data.id))return;
      var socket=sockets[data.id];if(!socket)return;
      if(data.op==='open'&&socket.readyState===0){socket.readyState=1;socket.lastAck=performance.now();socket.emit('open');}
      else if(data.op==='message'&&socket.readyState===1&&typeof data.data==='string'&&data.data.length<=32768)socket.emit('message',data.data);
      else if(data.op==='ack'&&Number.isInteger(data.serial)&&data.serial>socket.lastAckSerial&&data.serial<=socket.lastSent){socket.lastAckSerial=data.serial;socket.lastAck=performance.now();}
      else if(data.op==='close')socket.finish();
      else if(data.op==='error')socket.fail('bridge-disconnected');
    });
    root.addEventListener('pagehide',function(){Object.keys(sockets).forEach(function(id){sockets[id].close();});post({op:'leave'});closing=true;});
    root.UsedCarTransport={room:allowed?room:'',secure:true,createSocket:function(){return new ProxySocket();}};
    root.UsedCarSecureSteering={open:function(){return false;},isCompanion:true,close:function(){Object.keys(sockets).forEach(function(id){sockets[id].close();});post({op:'leave'});try{opener.focus();root.close();}catch(_){} }};
    if(!allowed)setTimeout(function(){status('failed','bridge-unavailable');},0);
    return;
  }

  var localRoom=new URL(location.href).searchParams.get('room')||'';
  var popup=null,nonce='',peer=null,peerId=0,highestId=0,lastSerial=0,lastMessage=0,watcher=0,started=0,relaying=false;
  var storageKey='used-car-racing-controller:'+localRoom;
  function session(){
    var controller=root.UsedCarController;
    if(controller&&controller.getSession){var current=controller.getSession();if(typeof current==='string'&&TOKEN.test(current))return current;}
    try{return sessionStorage.getItem(storageKey)||'';}catch(_){return '';}
  }
  function tell(op,id,extra){
    if(!popup||!nonce)return;
    var message=Object.assign({kind:KIND,channel:nonce,op:op,id:id},extra||{});
    try{popup.postMessage(message,ORIGIN);}catch(_){}
  }
  function disconnect(){var previous=peer;peer=null;peerId=0;lastSerial=0;if(previous)try{previous.close();}catch(_){} }
  function finish(reason){
    if(!relaying)return;
    disconnect();relaying=false;clearInterval(watcher);watcher=0;nonce='';popup=null;
    status('local',reason);
    if(root.UsedCarController&&root.UsedCarController.resumeFromRelay)root.UsedCarController.resumeFromRelay();
  }
  function connect(id){
    disconnect();peerId=id;lastSerial=0;lastMessage=Date.now();
    var socket;
    try{socket=new WebSocket('ws://'+location.host+'/ws?room='+encodeURIComponent(localRoom));}catch(_){tell('error',id);return;}
    peer=socket;
    socket.addEventListener('open',function(){if(peer===socket)tell('open',id);});
    socket.addEventListener('message',function(event){
      if(peer!==socket||typeof event.data!=='string'||event.data.length>32768)return;
      try{var message=JSON.parse(event.data);if(message.type==='welcome'&&typeof message.session==='string'&&TOKEN.test(message.session)){if(root.UsedCarController&&root.UsedCarController.setSession)root.UsedCarController.setSession(message.session);try{sessionStorage.setItem(storageKey,message.session);}catch(_){}}}catch(_){}
      tell('message',id,{data:event.data});
    });
    socket.addEventListener('close',function(){if(peer===socket){peer=null;tell('close',id);}});
    socket.addEventListener('error',function(){if(peer===socket){tell('error',id);socket.close();}});
  }
  root.addEventListener('message',function(event){
    var data=event.data;
    if(!relaying||event.source!==popup||event.origin!==ORIGIN||!data||data.kind!==KIND||data.channel!==nonce)return;
    if(data.op==='leave'){finish('companion-closed');return;}
    if(!validId(data.id))return;
    if(data.op==='connect'){if(data.id<=highestId)return;highestId=data.id;connect(data.id);status('remote');return;}
    if(data.id!==peerId)return;
    if(data.op==='close'){disconnect();return;}
    if(data.op!=='send'||!peer||peer.readyState!==WebSocket.OPEN)return;
    if(!Number.isInteger(data.serial)||data.serial<=lastSerial||!Number.isFinite(data.at)||Date.now()-data.at>MAX_AGE||data.at-Date.now()>1000){tell('error',peerId);disconnect();return;}
    var frame=validFrame(data.data);if(!frame){tell('error',peerId);disconnect();return;}
    lastSerial=data.serial;lastMessage=Date.now();
    if(frame.type==='hello'){var saved=session();frame={type:'hello'};if(saved)frame.session=saved;}
    try{peer.send(JSON.stringify(frame));tell('ack',peerId,{serial:data.serial});}catch(_){tell('error',peerId);disconnect();}
  });
  root.UsedCarSecureSteering={
    isCompanion:false,
    open:function(){
      if(relaying&&popup&&!popup.closed){try{popup.focus();}catch(_){}return true;}
      if(!TOKEN.test(localRoom)||!privateOrigin(location.origin)||!root.crypto||!root.crypto.getRandomValues){status('failed','bridge-unavailable');return false;}
      var bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);nonce=Array.from(bytes,function(n){return ('0'+n.toString(16)).slice(-2);}).join('');
      var fragment=new URLSearchParams({parent:location.origin,room:localRoom,channel:nonce});
      // Synchronous in the user's mode-selection gesture; do not request sensors here.
      try{popup=root.open(PAGE+'#'+fragment.toString(),'puretv-used-car-'+nonce);}catch(_){popup=null;}
      if(!popup){nonce='';status('failed','popup-blocked');return false;}
      relaying=true;started=lastMessage=Date.now();peerId=0;highestId=0;
      if(root.UsedCarController&&root.UsedCarController.suspendForRelay)root.UsedCarController.suspendForRelay();
      status('opening');
      watcher=setInterval(function(){
        if(!popup||popup.closed){finish('companion-closed');return;}
        if(!peer&&Date.now()-started>15000&&Date.now()-lastMessage>15000){finish('bridge-unavailable');return;}
        if(peer&&peer.readyState===WebSocket.OPEN&&Date.now()-lastMessage>1500){tell('error',peerId);disconnect();}
      },250);
      return true;
    },
    close:function(){if(popup)try{popup.close();}catch(_){}finish('returned-to-local');}
  };
  root.UsedCarTransport={room:localRoom,secure:false,createSocket:function(url){return new WebSocket(url);}};
  root.addEventListener('pagehide',function(){if(relaying){tell('error',peerId);finish('opener-left');}});
})(window);
