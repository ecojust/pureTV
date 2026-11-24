import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, makeTrack, sampleTrack, projectTrack, wrapDistance } from '../source/tracks.mjs';

const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);
const wrappedError = (a,b,length) => Math.abs(wrapDistance(a-b+length/2,length)-length/2);
const headingError = (a,b) => Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const cross = (a,b,c) => (b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function properCrossing(a,b,c,d) {
  return cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8;
}
function fullProjectionDistance(track,x,z) {
  let best=Infinity;
  for(let i=0;i<track.points.length;i++){
    const a=track.points[i],b=track.points[(i+1)%track.points.length];
    const dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
    best=Math.min(best,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));
  }
  return best;
}

test('three original routes have distinct identities and fresh deterministic data',()=>{
  assert.deepEqual(TRACKS.map(t=>t.id),['skyport','coast','canyon']);
  for(let i=0;i<TRACKS.length;i++){
    const a=makeTrack(i),b=makeTrack(a.id);
    assert.deepEqual(a,b);
    a.points[0].x+=1000;
    assert.notEqual(a.points[0].x,b.points[0].x);
    assert.notEqual(JSON.stringify(makeTrack(i).points),JSON.stringify(makeTrack((i+1)%3).points));
  }
  for(const bad of[-1,3,.5,'unknown',NaN])assert.throws(()=>makeTrack(bad),RangeError);
});

test('distance wraps in both directions and rejects non-finite queries',()=>{
  near(wrapDistance(-1,100),99);near(wrapDistance(201,100),1);near(wrapDistance(300,100),0);
  for(const args of[[Infinity,100],[0,0],[0,-1],[NaN,100]])assert.throws(()=>wrapDistance(...args),RangeError);
});

for(const descriptor of TRACKS){
  const id=descriptor.id;
  test(`${id}: continuous closed 3D route has safe width, grade, curvature and a 100m start straight`,()=>{
    const track=makeTrack(id),points=track.points;
    assert.equal(points.length,768);assert.equal(track.checkpoints,8);
    assert.ok(track.length>=700&&track.length<=1100);
    assert.ok(track.width>=18&&track.width<=22);
    near(sampleTrack(track,0).x,sampleTrack(track,track.length).x);
    near(sampleTrack(track,0).y,sampleTrack(track,track.length).y);
    near(sampleTrack(track,0).z,sampleTrack(track,track.length).z);
    let measured=0,maxGrade=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      for(const key of['x','y','z','s','yaw','curvature','width'])assert.ok(Number.isFinite(a[key]),key);
      near(a.s,measured,1e-6);
      measured+=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
      maxGrade=Math.max(maxGrade,Math.abs(b.y-a.y)/Math.hypot(b.x-a.x,b.z-a.z));
      assert.ok(headingError(a.yaw,b.yaw)<.04,'heading discontinuity');
      assert.ok(Math.abs(a.curvature)<=1/45,'bend tighter than a 45m radius');
    }
    near(track.length,measured,1e-6);assert.ok(maxGrade<.23,`road grade ${maxGrade}`);
    for(let s=5;s<=100;s+=5){const p=sampleTrack(track,s);near(p.x,points[0].x,.03);near(p.yaw,0,1e-5);}
    assert.ok(track.bounds.maxY-track.bounds.minY>5,'route must contain visible elevation changes');
    const before=sampleTrack(track,-.001),after=sampleTrack(track,.001);
    assert.ok(Math.hypot(after.x-before.x,after.y-before.y,after.z-before.z)<.003);
    assert.ok(headingError(before.yaw,after.yaw)<.001);
  });

  test(`${id}: centerline does not self-cross and separated sections cannot overlap road width`,()=>{
    const track=makeTrack(id),p=track.points,n=p.length;
    for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){
      if(i===0&&j===n-1)continue;
      assert.equal(properCrossing(p[i],p[(i+1)%n],p[j],p[(j+1)%n]),false,`segments ${i}/${j} cross`);
    }
    // Non-neighboring sections must stay far enough apart for both road edges.
    for(let i=0;i<n;i+=4)for(let j=i+4;j<n;j+=4){
      const separation=wrappedError(p[i].s,p[j].s,track.length);
      if(separation<track.width*2)continue;
      assert.ok(Math.hypot(p[i].x-p[j].x,p[i].z-p[j].z)>track.width*1.65,`road sections ${i}/${j} overlap`);
    }
  });

  test(`${id}: projection recovers signed lateral offsets and original arc positions`,()=>{
    const track=makeTrack(id);
    for(let i=0;i<64;i++)for(const lateral of[-track.width*.44,0,track.width*.44]){
      const s=(i+.37)*track.length/64,p=sampleTrack(track,s);
      const x=p.x+Math.cos(p.yaw)*lateral,z=p.z-Math.sin(p.yaw)*lateral;
      const q=projectTrack(track,x,z,s);
      near(q.lateral,lateral,.035);
      assert.ok(wrappedError(q.s,s,track.length)<.13,`bad arc projection at ${s}`);
      const sampled=sampleTrack(track,q.s);
      near(q.x,sampled.x);near(q.y,sampled.y);near(q.z,sampled.z);
      near(q.distance,Math.abs(lateral),.035);
    }
  });

  test(`${id}: stale and absent projection hints recover the global nearest section`,()=>{
    const track=makeTrack(id);
    for(let i=0;i<16;i++){
      const s=(i+.3)*track.length/16,p=sampleTrack(track,s);
      for(const hint of[0,track.length*.8,NaN]){
        const q=projectTrack(track,p.x,p.z,hint);
        near(q.distance,0,1e-7);assert.ok(wrappedError(q.s,s,track.length)<.001);
      }
    }
    for(const [x,z] of[[10000,-7000],[-460,315],[0,0],[260,-300]]){
      const q=projectTrack(track,x,z,track.length*.25);
      near(q.distance,fullProjectionDistance(track,x,z),1e-6);
    }
    assert.throws(()=>projectTrack(track,NaN,0),RangeError);
  });

  test(`${id}: boost and launch intervals are on a forward road segment and outside the finish seam`,()=>{
    const track=makeTrack(id);
    assert.equal(track.boostPads.length,2);
    for(const pad of[...track.boostPads,...track.jumpPads]){
      assert.ok(pad.s>30&&pad.length>=5&&pad.s+pad.length<track.length-30);
      for(let s=pad.s;s<=pad.s+pad.length;s+=1){
        const p=sampleTrack(track,s),q=projectTrack(track,p.x,p.z,s);
        near(q.distance,0,1e-6);
      }
    }
  });
}

test('Redrock Leap has an actual road ramp beneath its launch marker',()=>{
  const track=makeTrack('canyon');assert.equal(track.jumpPads.length,1);
  const pad=track.jumpPads[0];assert.ok(pad.power>6&&pad.power<10);
  const before=sampleTrack(track,pad.s-40),crest=sampleTrack(track,pad.s),after=sampleTrack(track,pad.s+78);
  assert.ok(crest.y-before.y>4,'launch ramp must rise from the approaching road');
  assert.ok(crest.y-after.y>2,'road must descend after the jump crest');
  assert.equal(makeTrack('skyport').jumpPads.length,0);assert.equal(makeTrack('coast').jumpPads.length,0);
});
