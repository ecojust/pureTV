const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../graphics.js'),'utf8');
let snapshotCalls=0,contextCalls=0;
const make=(tag,id)=>({tagName:tag,id,className:'fixture',width:1920,height:1080,parentElement:null,getBoundingClientRect(){return {x:0,y:0,left:0,top:0,width:960,height:540}},getContext(){contextCalls++;throw Error('No context may be created or read')}});
const parent=make('DIV','app'),canvas=make('CANVAS',''),overlay=make('DIV','curtain');canvas.parentElement=parent;
const game=Object.freeze({game:'backroad-rally',renderer:'webgl2',webglVersion:2,frames:3,stage:'menu',paused:false,gameplay:Object.freeze({phase:'menu'}),errors:[],controller:Object.freeze({pollCount:7,buttons:Object.freeze({A:false}),players:[Object.freeze({id:1,controllerId:'virtual-fixture',session:'session-fixture',connected:true,inputActive:true,cancelSeq:1,buttons:{A:false}})],info:{url:'not-copied',qr:'not-copied',wifiController:{port:63485,serviceType:'_puretv._tcp',version:'1'}}})});
const sandbox={location:{origin:'https://game-kit.invalid',pathname:'/tv.html',href:'https://game-kit.invalid/tv.html?mode=quick'},innerWidth:960,innerHeight:540,devicePixelRatio:2,
  window:{JoystickGameQA:{snapshot(){snapshotCalls++;return game}},PureGameHost:{snapshot(){throw Error('Native poll forbidden')}}},
  document:{readyState:'complete',hidden:false,hasFocus:()=>true,querySelectorAll:()=>[canvas],elementsFromPoint:()=>[overlay,canvas,parent]},
  performance:{now:()=>123,getEntriesByType:()=>Array.from({length:100},(_,i)=>({name:'asset-'+i,initiatorType:'fetch',duration:i,encodedBodySize:100,decodedBodySize:100}))},
  getComputedStyle:e=>({display:'block',visibility:'visible',opacity:e===overlay?'1':'1',position:'static',zIndex:'auto',backgroundColor:'rgb(0,0,0)',transform:'none',filter:'none',overflow:'visible',pointerEvents:'auto'})};
const result=vm.runInNewContext(source,sandbox);
assert.equal(result.graphicsRead,true);assert.equal(result.contextRead,false);assert.equal(contextCalls,0);assert.equal(snapshotCalls,1);assert.equal(result.cachedGame.pollCount,7);
assert.equal(result.canvases[0].ancestors[0].id,'app');assert.equal(result.canvases[0].centerStack[0].id,'curtain');assert.equal(result.resourceTail.length,96);assert.equal(result.resourceTail[0].name,'asset-4');assert.equal(result.resourceTail[0].responseStatus,null);
assert.equal(game.frames,3);assert.equal(canvas.width,1920);assert.equal(result.devicePixelRatio,2);
assert.equal(result.cachedGame.controller.players[0].controllerId,'virtual-fixture');assert.equal(result.cachedGame.controller.players[0].buttons.A,false);assert.equal(result.controllerService.port,63485);assert.equal(result.cachedGame.controller.info,undefined);assert.ok(!JSON.stringify(result).includes('not-copied'));
result.cachedGame.controller.players[0].buttons.A=true;assert.equal(game.controller.players[0].buttons.A,false);
sandbox.location.origin='https://outside.invalid';assert.equal(vm.runInNewContext(source,sandbox).graphicsRead,false);assert.equal(snapshotCalls,1);assert.equal(contextCalls,0);
sandbox.location.origin='https://game-kit.invalid';sandbox.location.pathname='/other.html';assert.equal(vm.runInNewContext(source,sandbox).graphicsRead,false);assert.equal(snapshotCalls,1);
sandbox.location={origin:'null',pathname:'blank',href:'about:blank'};const qa=sandbox.window.JoystickGameQA;delete sandbox.window.JoystickGameQA;
const initial=vm.runInNewContext(source,sandbox);assert.equal(initial.pendingInitialDocument,true);assert.equal(initial.url,'about:blank');assert.equal(initial.graphicsRead,false);assert.equal(snapshotCalls,1);
sandbox.window.JoystickGameQA=qa;assert.equal(vm.runInNewContext(source,sandbox).error,'Unexpected target document');assert.equal(snapshotCalls,1);assert.equal(contextCalls,0);
console.log('Graphics read-only boundary fixture: passed (no GL context calls, no native polls; bounded resources; original state unchanged)');

sandbox.location={origin:'https://game-kit.invalid',pathname:'/tv.html',href:'https://game-kit.invalid/tv.html'};
sandbox.backroadGlObservation=true;
sandbox.document.getElementById=()=>null;
canvas.getContext=(kind)=>{
  assert.equal(kind,'webgl2');contextCalls++;
  return {getSupportedExtensions:()=>['EXT_color_buffer_half_float'],getExtension:()=>null,
    drawingBufferWidth:480,drawingBufferHeight:270,READ_FRAMEBUFFER_BINDING:1,PIXEL_PACK_BUFFER_BINDING:2,PACK_ROW_LENGTH:3,PACK_SKIP_ROWS:4,PACK_SKIP_PIXELS:5,
    readPixels(x,y,w,h,format,kind,data){assert.deepEqual([x,y,w,h],[192,108,96,54]);data.set([7,8,9,255,9,8,7,255,42,12,3,0]);data.set([65,44,2,255],(96*27+48)*4);},
    isContextLost:()=>false,getInternalformatParameter:()=>[],checkFramebufferStatus:()=>0x8cd5,getParameter:p=>p===1||p===2?null:0,getContextAttributes:()=>({alpha:true})};
};
const caps=vm.runInNewContext(source,sandbox);
assert.equal(caps.contextRead,true);assert.equal(contextCalls,1);assert.equal(caps.extColorBufferFloat,false);
assert.equal(caps.extColorBufferHalfFloat,true);assert.equal(caps.unmaskedRenderer,null);
sandbox.document.querySelectorAll=()=>[canvas,canvas];
assert.equal(vm.runInNewContext(source,sandbox).contextRead,false);assert.equal(contextCalls,1);

sandbox.document.querySelectorAll=()=>[canvas];
let frames=3;
sandbox.window.JoystickGameQA.snapshot=()=>({...game,stage:'playing',frames});
let nextCall=null,copyCount=0,logged=null;
sandbox.requestAnimationFrame=fn=>{nextCall=fn;};
sandbox.console={info(message){logged=JSON.parse(message.substring('BackroadCanvasProbe '.length));}};
canvas.isConnected=true;
const pixels=new Uint8ClampedArray(160*90*4);
pixels.set([17,18,19,255,17,18,19,255,3,4,5,120,255,255,255,0]);
sandbox.document.createElement=(tag)=>{
  assert.equal(tag,'canvas');
  return {getContext(kind){assert.equal(kind,'2d');return {
    drawImage(src,left,top,w,h){assert.equal(src,canvas);assert.deepEqual([left,top,w,h],[0,0,160,90]);copyCount++;},
    getImageData(){return {data:pixels};}
  };}};
};
assert.equal(vm.runInNewContext(source,sandbox).contextRead,true);
assert.equal(copyCount,0);nextCall();assert.equal(copyCount,0);
frames++;nextCall();
assert.equal(copyCount,1);assert.equal(logged.framebuffer.read,true);assert.equal(logged.framebuffer.distinctVisibleRgb,3);assert.equal(logged.framebuffer.nonzeroRgbAtZeroAlpha,1);assert.equal(logged.framebuffer.distinctRawRgba,5);assert.deepEqual(logged.framebuffer.points[4].rgba,[65,44,2,255]);assert.equal(logged.drawnFrame,4);assert.equal(logged.initialFrame,3);
assert.equal(logged.alphaNonzeroPixels,3);assert.equal(logged.opaquePixels,2);assert.equal(logged.distinctVisibleRgb,2);
console.log('Stage canvas sample observes one new frame, excludes transparent colors and deduplicates visible colors');
