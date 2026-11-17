const test=require('node:test');
const assert=require('node:assert/strict');
const tracks=require('../src/main/assets/tracks.js');
function close(a,b,tolerance,message){assert.ok(Math.abs(a-b)<tolerance,(message||'value')+': '+a+' vs '+b);}
test('three original closed roads have valid lengths, elevation and stable lap seams',()=>{
 assert.deepEqual(tracks.all.map(t=>t.id),['harbor','ridge','solar']);
 for(const track of tracks.all){assert.ok(track.length>1500&&track.length<2500);assert.ok(track.width>10);const first=tracks.sample(track,0),last=tracks.sample(track,track.length-.001);assert.ok(Math.hypot(first.x-last.x,first.z-last.z)<.002);close(tracks.angle(first.heading-last.heading),0,.001,'seam heading');close(first.y,last.y,.002,'seam elevation');assert.ok(track.points.every(p=>Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v))));assert.ok(Math.max(...track.points.map(p=>p.y))-Math.min(...track.points.map(p=>p.y))>10);}
});
test('world heading and right-positive lateral projection match the physical road',()=>{
 for(const track of tracks.all)for(let s=25;s<track.length;s+=77){const p=tracks.sample(track,s);close(Math.hypot(p.tx,p.tz),1,1e-8);close(p.tx*p.nx+p.tz*p.nz,0,1e-8);close(Math.sin(p.heading),p.tx,1e-8);for(const lateral of [-4,0,4]){const near=tracks.nearest(track,p.x+p.nx*lateral,p.z+p.nz*lateral);close(near.lateral,lateral,.06,'lateral');close(near.distance,Math.abs(lateral),.06,'distance');close(tracks.angle(near.heading-p.heading),0,.006,'projected heading');}}
});
test('sampling wraps negative and many-lap distances without changing the racing line',()=>{
 for(const track of tracks.all)for(const s of [0,29.7,track.length*.49]){const a=tracks.sample(track,s),b=tracks.sample(track,s-track.length*3),c=tracks.sample(track,s+track.length*15);close(a.x,b.x,1e-8);close(a.z,c.z,1e-8);close(a.y,b.y,1e-8);}
});
test('road grades are dimensionless slopes, banks bounded, and bends have usable radii',()=>{
 for(const track of tracks.all)for(let s=30;s<track.length;s+=60){const a=tracks.sample(track,s-1),b=tracks.sample(track,s+1),p=tracks.sample(track,s);close((b.y-a.y)/Math.hypot(b.x-a.x,b.z-a.z),p.grade,.01,'grade');assert.ok(Math.abs(p.bank)<=.091);assert.ok(Math.abs(p.curvature)<.055);assert.ok(p.grip>.8&&p.grip<1.1);}
});
