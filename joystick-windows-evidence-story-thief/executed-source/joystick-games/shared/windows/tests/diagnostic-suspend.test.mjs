import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Execute the exact diagnostic expression embedded in the native host. This
// checks its JS side effects, not WebView2 scheduling or a real focus event.
const main=fs.readFileSync(new URL('../Sources/main.cpp',import.meta.url),'utf8');
const expression=main.match(/ExecuteScript\(L"(\(\(\)=>\{let state;.*?\}\)\(\))",Callback/)[1];

test('observes actual document and invokes original cancellation exactly once',()=>{
  let suspends=0;
  const window={__puretvDocumentEpoch:2,PureGame:{},JoystickDesktop:{suspend(){suspends++;window.__puretvDocumentEpoch=3;}}};
  Object.defineProperty(window,'PureGameHost',{get(){throw new Error('Diagnostic consumed input');}});
  Object.defineProperty(window,'JoystickGameQA',{get(){throw new Error('Diagnostic inspected model');}});
  const document={readyState:'loading',hidden:false,hasFocus:()=>true};
  const result=vm.runInNewContext(expression,{window,document});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{documentEpoch:2,readyState:'loading',hidden:false,focused:true,hasPureGame:true});
  assert.equal(suspends,1);
});
test('missing bridge is observed without inventing a document epoch or game',()=>{
  const result=vm.runInNewContext(expression,{window:{},document:{readyState:'loading',hidden:true,hasFocus:()=>false}});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{documentEpoch:null,readyState:'loading',hidden:true,focused:false,hasPureGame:false});
});
test('original suspend failure propagates and is never replaced by a successful result',()=>{
  let calls=0;
  const window={__puretvDocumentEpoch:4,JoystickDesktop:{suspend(){calls++;throw new Error('original cancellation failed');}}};
  assert.throws(()=>vm.runInNewContext(expression,{window,document:{readyState:'complete',hidden:false,hasFocus:()=>true}}),/original cancellation failed/);
  assert.equal(calls,1);
});
test('observation failure does not prevent the original cancellation',()=>{
  let calls=0;
  const window={__puretvDocumentEpoch:5,JoystickDesktop:{suspend(){calls++;}}};
  const result=vm.runInNewContext(expression,{window,document:{readyState:'complete',hidden:false,hasFocus(){throw new Error('observation failed');}}});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{observationFailed:true});
  assert.equal(calls,1);
});
