'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { sceneUpdates, requiredAssets } = require('../src/main/assets/scene-updates.js');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const command = (name, distance, frame = 100) => ({ command: name, distance, frame });
const operation = index => ({ kind: 'boss-background-row', index, frame: 200 + index });
function game(extra = {}) {
  return { stage: 6, frame: 100, commandLog: [], backgroundOperations: [],
    level: { palettes: Array.from({ length: 64 * 420 }, (_, i) => i % 4) }, ...extra };
}
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('all forty PPU row tables contain the 494 source tile bytes, without control markers', () => {
  const rows = sceneUpdates(game({ backgroundOperations: Array.from({ length: 40 }, (_, i) => operation(0x3d + i)) })).rows;
  assert.deepEqual(rows.map(row => row.index), Array.from({ length: 40 }, (_, i) => 0x3d + i));
  assert.equal(rows.reduce((sum, row) => sum + row.tiles.length, 0), 494);
  for (const row of rows) {
    assert.ok(row.tiles.every(tile => Number.isInteger(tile) && tile >= 0 && tile < 0xfe));
    assert.ok(row.tiles.length <= 32 - (row.ppuAddress & 31), `PPU row ${row.index} crosses a nametable edge`);
    assert.equal(row.x, ((row.ppuAddress >> 10) & 1) * 256 + (row.ppuAddress & 31) * 8);
    const ppuRow = (row.ppuAddress & 1023) >> 5;
    assert.equal(row.y, ppuRow === 29 ? 232 : 240 + ppuRow * 8);
  }
  // Independently decoded from pinned Bank7.ASM tables2793..3050: address high/low,
  // byte count, then payload. This digest detects edits beyond the sample below.
  const sourceBytes = rows.flatMap(row => [row.ppuAddress >> 8, row.ppuAddress & 255, row.tiles.length, ...row.tiles]);
  assert.equal(sha256(Buffer.from(sourceBytes)), '4f43951345bd49b8455c90147988c80efc677affd3b5ef9c7fb9118ce46817a8');
  const row63 = rows.find(row => row.index === 63);
  assert.equal(row63.ppuAddress, 0x2019);
  assert.deepEqual([row63.x, row63.y], [200, 240]);
  assert.deepEqual(row63.tiles, [0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c]);
});

test('row writes preserve palette attributes and order, ignoring unrelated or unknown operations', () => {
  const input = game({ backgroundOperations: [operation(0x3d), { kind: 'sound', index: 0x55 }, operation(0x55), operation(0x65)] });
  const result = sceneUpdates(input);
  assert.deepEqual(result.rows.map(row => row.index), [0x3d, 0x55]);
  for (const row of result.rows) {
    assert.equal(row.frame, 200 + row.index);
    assert.deepEqual(row.palettes, row.tiles.map((_, i) => input.level.palettes[(row.y / 8) * 64 + row.x / 8 + i]));
  }
  assert.equal(sceneUpdates({ ...input, stage: 5 }).rows.length, 0);
});

test('palette preparation and replacement occur at their recorded ticks and remain stable while paused', () => {
  const input = game({ stage: 1, commandLog: [command('palette_prepare', 2674)] });
  input.frame = 99;
  assert.equal(sceneUpdates(input).tilesPath, 'textures/stage_01_tiles.png');
  for (const tick of [100, 101]) {
    input.frame = tick;
    assert.equal(sceneUpdates(input).tilesPath, 'textures/phases/stage_01/palette_prepare/frame_000_tiles.png');
  }
  input.frame = 102;
  assert.equal(sceneUpdates(input).tilesPath, 'textures/phases/stage_01/palette_prepare/frame_002_tiles.png');
  assert.deepEqual(sceneUpdates(input), sceneUpdates({ ...input, phase: 'paused' }));
  input.commandLog.push(command('palette_change', 2738, 200));
  input.frame = 201;
  assert.equal(sceneUpdates(input).spritesPath, 'textures/phases/stage_01/palette_change/frame_000_sprites.png');
  input.frame = 202;
  assert.equal(sceneUpdates(input).spritesPath, 'textures/phases/stage_01/palette_change/frame_002_sprites.png');
  input.commandLog.push(command('forced_scroll', 2771, 202));
  assert.equal(sceneUpdates(input).spritesPath, 'textures/phases/stage_01/palette_change/frame_002_sprites.png');
  input.stage = 2;
  input.commandLog = [];
  assert.equal(sceneUpdates(input).tilesPath, 'textures/stage_02_tiles.png');
});

test('all stage transitions retain intermediate and final atlases, and HQ gate uses its event clock', () => {
  const cases = [
    [2, 'palette_prepare', 2194, 2, 'textures/phases/stage_02/palette_prepare/frame_002_tiles.png'],
    [3, 'palette_change', 2739, 3, 'textures/phases/stage_03/palette_change/frame_003_tiles.png'],
    [3, 'palette_change', 2739, 30, 'textures/phases/stage_03/palette_change/frame_030_tiles.png'],
    [4, 'palette_change', 2707, 36, 'textures/phases/stage_04/palette_change/frame_000_tiles.png'],
    [5, 'palette_change', 2707, 41, 'textures/phases/stage_05/palette_change/frame_041_tiles.png'],
    [6, 'palette_prepare', 1518, 2, 'textures/phases/stage_06/palette_prepare/frame_002_tiles.png'],
    [6, 'palette_change', 2947, 16, 'textures/phases/stage_06/palette_change/frame_016_tiles.png'],
  ];
  for (const [stage, name, distance, elapsed, expected] of cases) {
    assert.equal(sceneUpdates(game({ stage, frame: 100 + elapsed, commandLog: [command(name, distance)] })).tilesPath, expected);
  }
  const gate = game({ commandLog: [command('headquarters_gate', 3008)] });
  gate.frame = 102;
  assert.equal(sceneUpdates(gate).spritesPath, 'textures/hq_gate/frame_000_sprites.png');
  gate.frame = 103;
  assert.equal(sceneUpdates(gate).spritesPath, 'textures/hq_gate/frame_003_sprites.png');
  gate.frame = 1000;
  assert.equal(sceneUpdates(gate).spritesPath, 'textures/hq_gate/frame_015_sprites.png');
  gate.commandLog[0].distance = 3007;
  assert.equal(sceneUpdates(gate).spritesPath, 'textures/stage_06_sprites.png');
});

test('HQ collapse, tank treads and final destruction select separate recorded timelines', () => {
  const cases = [
    [{ phase: 'hq-dying', transition: 24 }, [], 'hq_collapse/frame_000'],
    [{ phase: 'hq-exploding', transitionAge: 1 }, [], 'hq_collapse/frame_000'],
    [{ phase: 'hq-exploding', transitionAge: 2 }, [], 'hq_collapse/frame_026'],
    [{ phase: 'hq-exploding', transitionAge: 28 }, [], 'hq_collapse/frame_052'],
    [{ phase: 'hq-to-tank' }, [], 'hq_collapse/frame_052'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 1 }], 'hq_building_initial_0/frame_000'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 3 }], 'hq_building_initial_0/frame_002'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 6 }], 'hq_building_0_1/frame_002'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 11 }], 'hq_building_1_2/frame_003'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 14 }], 'hq_building_2_3/frame_002'],
    [{ phase: 'flame-tank' }, [{ sourceType: 75, age: 18 }], 'hq_building_3_0/frame_002'],
    [{ phase: 'tank-exploding', transitionAge: 1 }, [], 'hq_final/frame_000'],
    [{ phase: 'tank-exploding', transitionAge: 3 }, [], 'hq_final/frame_002'],
    [{ phase: 'tank-exploding', transitionAge: 12 }, [], 'hq_final/frame_011'],
  ];
  for (const [boss, enemies, expected] of cases) {
    assert.equal(sceneUpdates(game({ boss, enemies })).spritesPath, `textures/${expected}_sprites.png`);
  }
  const finished = sceneUpdates(game({ boss: { phase: 'defeated' }, backgroundOperations: [operation(0x55)] }));
  assert.equal(finished.tilesPath, 'textures/hq_final/frame_011_tiles.png');
});

test('frozen inputs are untouched and returned arrays cannot corrupt subsequent presentations', () => {
  const input = freeze(game({ commandLog: [command('palette_change', 2947)], backgroundOperations: [operation(0x3d)] }));
  const before = JSON.stringify(input);
  const first = sceneUpdates(input);
  first.rows[0].tiles[0] = 0;
  first.rows[0].palettes[0] = 3;
  first.rows.push({ index: 999 });
  const next = sceneUpdates(input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(next.rows.length, 1);
  assert.deepEqual(next.rows[0].tiles, [81, 84]);
  assert.equal(next.rows[0].palettes[0], 2);
});

test('asset manifest includes all 297 pinned source atlases, including intermediate uploads', () => {
  const paths = requiredAssets();
  assert.equal(paths.length, 297);
  assert.equal(new Set(paths).size, 297);
  assert.deepEqual(paths, [...paths].sort());
  assert.ok(paths.every(path => /^textures\/[a-z0-9_/]+\.png$/.test(path) && !path.includes('..')));
  // Digest generated independently from the fixed external texture_phases.json and
  // seven HQ timeline JSON files; the test needs no external art or network access.
  assert.equal(sha256(paths.join('\n')), '11a982aa7b0eaa8c62d21969d159ce4ea5e053a2fa3de58dd8ef0d68e5dd865d');
  assert.ok(paths.includes('textures/phases/stage_03/palette_change/frame_003_tiles.png'));
  assert.ok(paths.includes('textures/hq_collapse/frame_027_sprites.png'));
  assert.ok(paths.includes('textures/hq_final/frame_011_tiles.png'));
  paths.pop();
  assert.equal(requiredAssets().length, 297);
});
