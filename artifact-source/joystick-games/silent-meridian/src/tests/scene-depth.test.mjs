import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, hydrate } from '../src/game.js';
import { renderSize, projectScenePoint } from '../src/scene-depth.js';

test('3D preferences migrate old saves and accept only explicit booleans', () => {
  for (const version of [1, 2]) {
    for (const value of [undefined, null, 'false', 0, {}, true]) {
      const old = { ...freshState('en'), version, depth: value, personalNote: 'Keep this deduction.' };
      const restored = hydrate(old);
      assert.equal(restored.depth, true);
      assert.equal(restored.personalNote, old.personalNote);
      assert.equal(restored.lang, 'en');
    }
    const off = freshState(); off.version=version; off.depth=false; off.radio=[2,4,0];
    assert.equal(hydrate(off).depth,false);
    assert.deepEqual(hydrate(off).radio,[2,4,0]);
  }
});

test('GPU buffers stay within the pixel budget on phones, retina screens and ultrawide displays', () => {
  for (const coarse of [false,true]) for (const [width,height] of [[320,180],[1672,941],[3840,2160],[10000,100],[100,10000]]) for (const dpr of [.8,1,2,3,5]) {
    const [w,h] = renderSize(width,height,dpr,coarse);
    assert.ok(w>0 && h>0 && w<=2048 && h<=2048);
    assert.ok(w*h <= (coarse?700000:1600000));
    assert.ok(Math.abs(w/width-h/height) <= 1/width+1/height);
  }
  for(const size of [[0,0],[-1,20],[Infinity,3],[3,NaN]])assert.deepEqual(renderSize(...size),[1,1]);
  assert.deepEqual(renderSize(320,180,NaN),[320,180]);
});

test('clue marker projection tracks its texture point throughout the camera range', () => {
  const smooth = (a,b,n) => {const t=Math.max(0,Math.min(1,(n-a)/(b-a)));return t*t*(3-2*t);};
  for(const x of [.17,.23,.5,.64,.9])for(const y of [.29,.46,.65,.84])for(const px of [-1,0,1])for(const py of [-1,0,1]) {
    const aspect=1672/941,[u,v]=projectScenePoint(x,y,[px,py],aspect);
    const depth=.12+.60*smooth(.32,1,v)+.20*Math.pow(Math.abs(u-.5)*2,3);
    const sampledX=(u-.5)*.974+.5+px*.024*depth/aspect;
    const sampledY=(v-.5)*.974+.5+py*.024*depth;
    assert.ok(Math.abs(sampledX-x)*2048 < .01);
    assert.ok(Math.abs(sampledY-y)*2048 < .01);
    assert.ok(u>0 && u<1 && v>0 && v<1);
  }
});
