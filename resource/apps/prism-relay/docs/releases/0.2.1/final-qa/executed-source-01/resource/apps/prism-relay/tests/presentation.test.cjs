'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../src/main/assets/game-model.js');
const vectors = [[1,0],[0,1],[-1,0],[0,-1]];
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/main/assets/game.js'),'utf8'), {window});
const game = window.GameDef;

test('mirror routes obey the vector reflection law for both visible mirror normals', () => {
  for (let orientation=0;orientation<2;orientation++) for (let incoming=0;incoming<4;incoming++) {
    const [dx,dy]=vectors[incoming],normal=[Math.SQRT1_2,orientation ? -Math.SQRT1_2 : Math.SQRT1_2];
    const projection=dx*normal[0]+dy*normal[1];
    const expected=[Math.round(dx-2*projection*normal[0]),Math.round(dy-2*projection*normal[1])].map(v=>v||0);
    const traced=model.traceBeams({width:7,height:7,cells:[
      {type:'source',x:3-dx*2,y:3-dy*2,direction:incoming,color:7},
      {type:'mirror',x:3,y:3,orientation}
    ]});
    const outgoing=traced.beams.at(-1);
    assert.deepEqual([Math.sign(outgoing.x2-outgoing.x1),Math.sign(outgoing.y2-outgoing.y1)],expected);
    assert.equal(outgoing.colorBits,7);
  }
});

test('custom module artwork has bounded geometry and four isolated ports matching the routed channels', () => {
  const tile=game.atlas.tiles.find(t=>t.name==='rgb_router');
  assert.ok(tile);assert.equal(game.atlas.builtins.includes('prism'),false);
  const points=[],strokes=[],stack=[];let pose={x:0,y:0,a:0},active=[];
  const world=(x,y)=>[pose.x+x*Math.cos(pose.a)-y*Math.sin(pose.a),pose.y+x*Math.sin(pose.a)+y*Math.cos(pose.a)];
  const put=(x,y)=>{const p=world(x,y);points.push(p);return p;};
  const c={save(){stack.push({...pose});},restore(){pose=stack.pop();},translate(x,y){[pose.x,pose.y]=world(x,y);},rotate(a){pose.a+=a;},
    beginPath(){active=[];},moveTo(x,y){active.push(put(x,y));},lineTo(x,y){active.push(put(x,y));},
    stroke(){strokes.push({points:active,color:this.strokeStyle,width:this.lineWidth});},
    fillRect(x,y,w,h){put(x,y);put(x+w,y+h);},strokeRect(x,y,w,h){put(x,y);put(x+w,y+h);}};
  const art={linear(){return '#000';},radial(){return '#000';},ellipse(ctx,x,y,rx,ry){put(x-rx,y-ry);put(x+rx,y+ry);},path(ctx,p){p.forEach(([x,y])=>put(x,y));}};
  tile.paint(c,tile.w,tile.h,art);assert.equal(stack.length,0);
  for(const p of points)for(let axis=0;axis<2;axis++)assert.ok(Number.isFinite(p[axis])&&p[axis]>=0&&p[axis]<=192,'paint stays inside its atlas region');
  const ports=strokes.filter(s=>s.points.length===3&&s.width===2);
  assert.equal(ports.length,4);
  const byColor=new Map(ports.map(s=>[s.color,s]));
  const directions=[['#effaff',[1,0]],['#ff6d82',[0,-1]],['#70ecaf',[1,0]],['#7aaaff',[0,1]]];
  for(const [color,expected] of directions){
    const p=byColor.get(color).points;
    const dx=p[1][0]-(p[0][0]+p[2][0])/2,dy=p[1][1]-(p[0][1]+p[2][1])/2;
    assert.deepEqual([Math.round(dx/6),Math.round(dy/6)],expected);
  }
  // Drawing and model rotate the same hardware. Check all four world-space ports.
  for(let orientation=0;orientation<4;orientation++){
    const [dx,dy]=vectors[orientation],trace=model.traceBeams({width:7,height:7,cells:[
      {type:'source',x:3-dx*2,y:3-dy*2,direction:orientation,color:7},{type:'prism',x:3,y:3,orientation}
    ]});
    for(const [color,bit] of [['#ff6d82',1],['#70ecaf',2],['#7aaaff',4]]){
      const p=byColor.get(color).points,a=orientation*Math.PI/2;
      const local=[(p[1][0]-(p[0][0]+p[2][0])/2)/6,(p[1][1]-(p[0][1]+p[2][1])/2)/6];
      const expected=[Math.round(local[0]*Math.cos(a)-local[1]*Math.sin(a)),Math.round(local[0]*Math.sin(a)+local[1]*Math.cos(a))].map(v=>v||0);
      const beam=trace.beams.find(b=>b.x1===3&&b.y1===3&&b.colorBits===bit);
      assert.deepEqual([Math.sign(beam.x2-beam.x1),Math.sign(beam.y2-beam.y1)],expected);
    }
  }
});
