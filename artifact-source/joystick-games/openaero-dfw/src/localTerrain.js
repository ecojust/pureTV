// Draw the bundled USGS elevation grid even when no imagery provider is reachable.
import { BufferAttribute, Color, Mesh, PlaneGeometry } from 'three';
import { DEM_GRID } from './terrain.js';

export function localTerrain(ground, material) {
  const {cols, rows, step, x0, z0} = DEM_GRID;
  const width = (cols - 1) * step, depth = (rows - 1) * step;
  const geometry = new PlaneGeometry(width, depth, (cols - 1) / 5, (rows - 1) / 5);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(x0 + width / 2, 0, z0 + depth / 2);
  const positions = geometry.getAttribute('position'), colors = new Float32Array(3 * positions.count);
  const dark = new Color(0x4e6349), light = new Color(0x969464), color = new Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    const y = ground.heightAt(x, z);
    positions.setY(i, y - 2); // leave the surveyed runway surfaces visible
    const slope = (ground.heightAt(x - step, z - step) - y) / step;
    const level = Math.max(0, Math.min(1, 0.35 + y / 220 + slope * 4));
    color.copy(dark).lerp(light, level).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return new Mesh(geometry, material);
}
