(function () {
  'use strict';
  // Test-only observation. Do not call getContext: it can create a new context.
  // No framebuffer reads, renderer setters, clock changes, native input polls,
  // event hooks, storage writes or resource fetches are performed here.
  if (location.origin !== 'https://game-kit.invalid' || location.pathname !== '/tv.html') {
    return {error: 'Unexpected target document', graphicsRead: false};
  }
  var limit = function (s, n) { return String(s == null ? '' : s).slice(0, n); };
  var rect = function (e) {
    var r = e.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height};
  };
  var style = function (e) {
    var s = getComputedStyle(e);
    return {tag:e.tagName,id:limit(e.id,128),className:limit(e.className,256),rect:rect(e),
      display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,zIndex:s.zIndex,
      backgroundColor:s.backgroundColor,transform:s.transform,filter:s.filter,
      overflow:s.overflow,pointerEvents:s.pointerEvents};
  };
  var cached = window.JoystickGameQA && window.JoystickGameQA.snapshot
    ? window.JoystickGameQA.snapshot() : null;
  var control = cached && cached.controller;
  var keys = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
  var buttons = function (value) {
    var result={};keys.forEach(function(k){if(value && typeof value[k]==='boolean')result[k]=value[k];});return result;
  };
  // Copy only the cached protocol fields needed to prove ordinary SDK input.
  // Do not copy the phone-room URL/QR or call the consuming native snapshot.
  var controller = control ? {pollCount:control.pollCount,connected:control.connected,
    cancelled:control.cancelled,native:control.native,inputAvailable:control.inputAvailable,
    buttons:buttons(control.buttons),players:(control.players||[]).slice(0,4).map(function(p){
      return {id:p.id,controllerId:limit(p.controllerId,128),session:limit(p.session,128),
        connected:p.connected,inputActive:p.inputActive,cancelSeq:p.cancelSeq,buttons:buttons(p.buttons)};
    })}:null;
  var service = control && control.info && control.info.wifiController;
  var canvases = Array.prototype.slice.call(document.querySelectorAll('canvas'),0,4).map(function(c) {
    var ancestors=[],p=c.parentElement;
    while(p && ancestors.length<12){ancestors.push(style(p));p=p.parentElement;}
    var r=c.getBoundingClientRect(),x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),
      y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));
    var stack=document.elementsFromPoint ? document.elementsFromPoint(x,y).slice(0,12).map(style) : [];
    return {width:c.width,height:c.height,style:style(c),ancestors:ancestors,
      centerPoint:{x:x,y:y},centerStack:stack,
      contextRead:false,contextReason:'No existing context reference is exposed. getContext is deliberately not called.'};
  });
  var resources = performance.getEntriesByType('resource');
  var selected = resources.slice(-96).map(function(r){
    return {name:limit(r.name,1024),initiatorType:r.initiatorType,duration:r.duration,
      transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,
      responseStatus:typeof r.responseStatus==='number'?r.responseStatus:null};
  });
  return {graphicsRead:true,url:limit(location.href,2048),readyState:document.readyState,
    hidden:document.hidden,focused:document.hasFocus(),devicePixelRatio:devicePixelRatio,
    viewport:{width:innerWidth,height:innerHeight},
    cachedGame:cached?{game:cached.game,renderer:cached.renderer,webglVersion:cached.webglVersion,
      frames:cached.frames,stage:cached.stage,paused:cached.paused,gameplay:cached.gameplay,
      errors:cached.errors,pollCount:control&&control.pollCount,controller:controller}:null,
    controllerService:service?{port:service.port,serviceType:service.serviceType,version:service.version,
      state:service.state,error:service.error}:null,
    canvases:canvases,canvasCount:document.querySelectorAll('canvas').length,
    resourceCount:resources.length,resourceTail:selected,
    observedAt:performance.now(),nativeSnapshotPolled:false,contextRead:false};
})()
