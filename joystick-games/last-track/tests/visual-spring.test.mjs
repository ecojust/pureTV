import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildHeroCarPBR} from '../src/upstream/src/render/pbr/heroCarPBR.js';
const original=JSON.parse(readFileSync(new URL('./fixtures/visual-spring-before.json',import.meta.url)));
test('Original five car visual springs: ordinary frames unchanged; slow frames remain bounded',()=>{
 for(const row of original.rows){
  const car=buildHeroCarPBR({carId:row.carId}),h=car.userData.hero;
  for(let frame=1;frame<=120;frame++){
   h.update(row.input,row.dt);
   assert.ok(Number.isFinite(h.S.heave)&&Math.abs(h.S.heave)<0.1,`${row.carId}/${row.dt}/${frame} finite body height`);
   assert.ok(Math.abs(h.S.pitch)<0.1&&Math.abs(h.S.roll)<0.1);
   assert.equal(car.userData.body.visible,true);assert.deepEqual(car.position.toArray(),[0,0,0]);
   const old=row.trace.find(t=>t.frame===frame);
   if(old&&row.dt<=1/30){for(const k of ['heave','pitch','roll'])assert.equal(h.S[k],old[k],`${row.carId}/${row.dt}/${frame}/${k} original frame behavior`)}
  }
  assert.ok(Math.abs(h.S.t-120*row.dt)<1e-10,'Original visual time continues with full dt');h.dispose();
 }
});
