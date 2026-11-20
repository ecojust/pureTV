(function () {
  'use strict';
  // Only the capabilities endpoint reads the one canvas that the initialized game owns.
  // The fixed stage capability probe can copy the existing canvas once after a real frame. No renderer setters, clock changes, native input polls,
  // event hooks, storage writes or resource fetches are performed here.
  // The frozen host posts loadUrl only after its asynchronous room startup.
  // This exact empty initial document is pending, never a rendered game.
  if (location.href === 'about:blank' && !window.JoystickGameQA) {
    return {pendingInitialDocument:true,url:location.href,graphicsRead:false};
  }
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
  // Observe existing draws for two animation callbacks on this context only. All
  // original methods receive the same arguments. No extra draw or GL bind is issued.
  function observeGravelBindings(gl) {
    var marker=Symbol.for('puretv.temporaryGravelDrawObservation');
    if (gl[marker]) return;
    Object.defineProperty(gl,marker,{value:true,configurable:true});
    var original = {}, current = gl.getParameter(gl.CURRENT_PROGRAM), programs = new Set(), drawn = new Set();
    var calls = 0, stopped = false, timer;
    function wrap(name, action) {
      var previous = gl[name], own = Object.getOwnPropertyDescriptor(gl, name);
      if (typeof previous !== 'function') return;
      original[name] = own;
      gl[name] = function () {
        var result = previous.apply(this, arguments);
        try { action(arguments); } catch (error) { finish('observation-error', String(error)); }
        return result;
      };
    }
    function finish(reason, error) {
      if (stopped) return;
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      Object.keys(original).forEach(function (name) {
        if (original[name]) Object.defineProperty(gl, name, original[name]);
        else delete gl[name];
      });
      delete gl[marker];
      console.info('BackroadGravelBindingEnd ' + JSON.stringify({reason:reason, error:error||null, originalDraws:calls,
        seenPrograms:programs.size, matchedPrograms:drawn.size, restored:true, extraDraws:0, extraBindings:0}));
    }
    function floats(buffer, offset, count) {
      if (!buffer) return null;
      var targets = [[gl.ARRAY_BUFFER,gl.ARRAY_BUFFER_BINDING],[gl.UNIFORM_BUFFER,gl.UNIFORM_BUFFER_BINDING],
        [gl.COPY_READ_BUFFER,gl.COPY_READ_BUFFER_BINDING],[gl.COPY_WRITE_BUFFER,gl.COPY_WRITE_BUFFER_BINDING]];
      for (var pair of targets) {
        if (gl.getParameter(pair[1]) !== buffer) continue;
        if (offset < 0 || offset + count*4 > gl.getBufferParameter(pair[0], gl.BUFFER_SIZE)) return null;
        var value = new Float32Array(count);
        gl.getBufferSubData(pair[0], offset, value);
        return Array.from(value);
      }
      return null;
    }
    function observe() {
      calls++;
      if (calls > 1024 || programs.size >= 96) { finish('draw-limit'); return; }
      if (!current || programs.has(current)) return;
      programs.add(current);
      var shaders = gl.getAttachedShaders(current) || [];
      var gravel = shaders.some(function (shader) {
        if (gl.getShaderParameter(shader,gl.SHADER_TYPE) !== gl.FRAGMENT_SHADER) return false;
        return gl.getShaderSource(shader).split('\n').some(function (line) {
          return ['12.92','0.055','1.055','2.4'].every(function (term) { return line.indexOf(term) !== -1; });
        });
      });
      if (!gravel) return;
      drawn.add(current);
      var loc=gl.getAttribLocation(current,'color'), color=null, objectTint=null;
      if (loc >= 0) {
        var offset=gl.getVertexAttribOffset(loc,gl.VERTEX_ATTRIB_ARRAY_POINTER);
        var buffer=gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
        var type=gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_TYPE);
        color={location:loc,enabled:gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_ENABLED),
          size:gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_SIZE),type:type,normalized:gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
          stride:gl.getVertexAttrib(loc,gl.VERTEX_ATTRIB_ARRAY_STRIDE),offset:offset,bufferPresent:!!buffer,
          firstRGB:type===gl.FLOAT?floats(buffer,offset,3):null};
      }
      var blocks = [];
      for(var i=0;i<Math.min(8,gl.getProgramParameter(current,gl.ACTIVE_UNIFORM_BLOCKS));i++) {
        var name=gl.getActiveUniformBlockName(current,i);
        var binding=gl.getActiveUniformBlockParameter(current,i,gl.UNIFORM_BLOCK_BINDING);
        var b=gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING,binding);
        blocks.push({name:name,binding:binding,bufferPresent:!!b,bytes:gl.getActiveUniformBlockParameter(current,i,gl.UNIFORM_BLOCK_DATA_SIZE)});
        if(name!=='object')continue;
        var indices=gl.getActiveUniformBlockParameter(current,i,gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);
        var offsets=gl.getActiveUniforms(current,indices,gl.UNIFORM_OFFSET);
        for(var k=0;k<Math.min(128,indices.length);k++) {
          var info=gl.getActiveUniform(current,indices[k]);
          if(info.name!=='nodeUniform0')continue;
          var start=gl.getIndexedParameter(gl.UNIFORM_BUFFER_START,binding) || 0;
          objectTint={name:info.name,offset:offsets[k],type:info.type,start:start,currentBytes:floats(b,start+offsets[k],4)};
        }
      }
      console.info('BackroadGravelBinding ' + JSON.stringify({originalDraw:calls,match:drawn.size,color:color,
        activeUniformBlocks:blocks,objectTint:objectTint,source:'linked fragment sRGB transfer on the original Finnish Gravel'}));
    }
    wrap('useProgram',function(args) { current=args[0]; });
    ['drawElements','drawElementsInstanced','drawArrays','drawArraysInstanced'].forEach(function(name) { wrap(name,observe); });
    timer=setTimeout(function(){finish('wall-limit');},5000);
    requestAnimationFrame(function(){requestAnimationFrame(function(){finish('two-animation-callbacks');});});
  }

  if (typeof backroadGlObservation !== 'undefined' && backroadGlObservation) {
    var owned = document.querySelectorAll('#app > canvas');
    var previous = location.href === 'https://game-kit.invalid/tv.html'
      || location.href === 'https://game-kit.invalid/tv.html?mode=quick&stage=finland&car=swift&cond=stage&weather=stage';
    if (!previous || !cached || cached.game !== 'backroad-rally' || cached.renderer !== 'webgl2'
        || cached.webglVersion !== 2 || !(cached.frames > 0) || owned.length !== 1) {
      return {contextRead:false, reason:'No initialized Backroad WebGL2 canvas at this checkpoint', url:location.href};
    }
    // createRenderer appends this canvas only after successful initialization.
    // Calling getContext with the same type returns its existing context.
    if (cached.stage === 'playing') {
      var startFrame = cached.frames, attempts = 0, source = owned[0];
      var sample = function () {
        var next = window.JoystickGameQA.snapshot();
        if (!source.isConnected || next.stage !== 'playing') return;
        if (next.frames <= startFrame) {
          if (++attempts < 120) requestAnimationFrame(sample);
          return;
        }
        // The game has drawn a new frame in this animation cycle. Copy its existing canvas,
        // without DOM overlays, before Chromium presents and may discard the drawing buffer.
        try {
          function stats(bytes) {
            var rgb = new Set(), allRgba = new Set(), hiddenRgb = 0, visible = 0, opaque = 0;
            for (var i = 0; i < bytes.length; i += 4) {
              var packed = ((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]);
              allRgba.add(packed * 256 + bytes[i + 3]);
              if (bytes[i + 3] === 0 && packed !== 0) hiddenRgb++;
              if (bytes[i + 3] === 255) opaque++;
              if (bytes[i + 3] === 0) continue;
              visible++;
              rgb.add((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]);
            }
            return {alphaNonzeroPixels:visible,opaquePixels:opaque,distinctVisibleRgb:rgb.size,distinctRawRgba:allRgba.size,nonzeroRgbAtZeroAlpha:hiddenRgb};
          }
          // Read one central rectangle only when the original renderer left the default framebuffer
          // and standard CPU packing active. Do not change bindings or consume the game's error flags.
          var framebuffer = {read:false};
          if (gl && gl.getParameter(gl.READ_FRAMEBUFFER_BINDING) === null && gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING) === null
              && gl.getParameter(gl.PACK_ROW_LENGTH) === 0 && gl.getParameter(gl.PACK_SKIP_ROWS) === 0 && gl.getParameter(gl.PACK_SKIP_PIXELS) === 0
              && gl.drawingBufferWidth >= 96 && gl.drawingBufferHeight >= 54) {
            var w = 96, h = 54, pixels = new Uint8Array(w*h*4);
            gl.readPixels(Math.floor((gl.drawingBufferWidth-w)/2), Math.floor((gl.drawingBufferHeight-h)/2), w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            var points = [];
            [0.2, 0.5, 0.8].forEach(function(fy) { [0.2, 0.5, 0.8].forEach(function(fx) {
              var x = Math.floor(w * fx), y = Math.floor(h * fy), i = (w*y+x)*4;
              points.push({x:x,y:y,rgba:Array.from(pixels.subarray(i,i+4))});
            }); });
            framebuffer = Object.assign({read:true,width:w,height:h,points:points,
              clearColor:Array.from(gl.getParameter(gl.COLOR_CLEAR_VALUE)),
              clearDepth:gl.getParameter(gl.DEPTH_CLEAR_VALUE),clearStencil:gl.getParameter(gl.STENCIL_CLEAR_VALUE)},stats(pixels));
          }
          var copy = document.createElement('canvas');
          copy.width = 160; copy.height = 90;
          var context = copy.getContext('2d', {willReadFrequently:true});
          context.imageSmoothingEnabled = false;
          context.drawImage(source, 0, 0, copy.width, copy.height);
          var copied = stats(context.getImageData(0, 0, copy.width, copy.height).data);
          console.info('BackroadCanvasProbe ' + JSON.stringify(Object.assign({initialFrame:startFrame,drawnFrame:next.frames,
            width:copy.width,height:copy.height,framebuffer:framebuffer,sourceWidth:source.width,sourceHeight:source.height},copied)));
        } catch (error) {
          console.info('BackroadCanvasProbe ' + JSON.stringify({error:String(error),initialFrame:startFrame,drawnFrame:next.frames}));
        }
      };
      requestAnimationFrame(sample);
    }
    var gl = owned[0].getContext('webgl2');
    if (!gl) return {contextRead:false, reason:'Existing WebGL2 context unavailable', url:location.href};
    var supported = gl.getSupportedExtensions() || [];
    var debug = gl.getExtension('WEBGL_debug_renderer_info');
    if (cached.stage === 'playing' && cached.gameplay && cached.gameplay.stageId === 'finland'
        && cached.gameplay.carId === 'swift' && debug
        && gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) === 'Android Emulator OpenGL ES Translator (Google SwiftShader)') {
      observeGravelBindings(gl);
    }
    var frameHud = document.getElementById('frame-hud');
    var formats = {};
    var renderable = ['RGBA8','DEPTH_COMPONENT24'];
    if (supported.indexOf('EXT_color_buffer_float') !== -1 || supported.indexOf('EXT_color_buffer_half_float') !== -1) renderable.push('RGBA16F');
    renderable.forEach(function(name) {
      var samples = gl.getInternalformatParameter(gl.RENDERBUFFER, gl[name], gl.SAMPLES);
      formats[name] = samples ? Array.from(samples) : null;
    });
    return {contextRead:true, url:location.href, stage:cached.stage, frames:cached.frames,
      currentFramebufferStatus:gl.checkFramebufferStatus(gl.FRAMEBUFFER),
      defaultFramebufferBound:gl.getParameter(gl.FRAMEBUFFER_BINDING) === null,
      samplesPerRenderbufferFormat:formats,
      contextLost:gl.isContextLost(), drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],
      extColorBufferFloat:supported.indexOf('EXT_color_buffer_float') !== -1,
      extColorBufferHalfFloat:supported.indexOf('EXT_color_buffer_half_float') !== -1,
      vendor:gl.getParameter(gl.VENDOR), renderer:gl.getParameter(gl.RENDERER),
      unmaskedVendor:debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
      unmaskedRenderer:debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      version:gl.getParameter(gl.VERSION), contextAttributes:gl.getContextAttributes(),
      frameHud:frameHud ? limit(frameHud.textContent,2048) : null};
  }
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
