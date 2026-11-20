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
console.log('Graphics read-only boundary fixture: passed (no GL context calls, no native polls; bounded resources; original state unchanged)');
