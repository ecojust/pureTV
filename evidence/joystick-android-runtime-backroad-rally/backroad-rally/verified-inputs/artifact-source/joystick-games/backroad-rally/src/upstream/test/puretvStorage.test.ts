import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { bestKey } from '../src/game/save';
import { CAR_IDS } from '../src/menu/data';
import { MAX_GHOSTS, loadGhost, saveGhost } from '../src/game/ghostStore';
import type { GhostSample } from '../src/game/ghostCodec';

const metadata = JSON.parse(readFileSync(new URL('../../../game.json', import.meta.url), 'utf8')) as { storageKeys: string[] };
const menu = JSON.parse(readFileSync(new URL('../public/data/menu.json', import.meta.url), 'utf8')) as { stages: { id: string }[] };
const weather = JSON.parse(readFileSync(new URL('../public/data/weather.json', import.meta.url), 'utf8')) as { order: string[] };
afterEach(() => vi.unstubAllGlobals());

it('declares every actual playable ghost key and only the exact finite set, retaining original 60-record eviction', () => {
  const expected = new Set(['backroad-rally.save', 'backroad-rally.game', 'backroad-rally.display', 'backroad-rally.hud', 'backroad-rally.audio', 'backroad-rally.run', 'backroad-rally.autoquality']);
  for (const mode of ['quick', 'attack'] as const) for (const stage of menu.stages) for (const reverse of [false, true]) for (const car of CAR_IDS) for (const condition of weather.order) {
    expected.add('backroad-rally.ghost.' + bestKey(mode, stage.id, reverse, car, condition));
  }
  expect(metadata.storageKeys.length).toBe(367);
  expect(new Set(metadata.storageKeys)).toEqual(expected);
  expect(MAX_GHOSTS).toBe(60);
});

it('the unchanged original ghost codec/store writes and loads an allowed boundary key without a game model', async () => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { get length() { return values.size; }, key: (i: number) => [...values.keys()][i] ?? null,
    getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, String(value)); }, removeItem: (key: string) => { values.delete(key); } });
  const key = bestKey('attack', 'vermont', true, 'kaze', 'snow');
  const samples: GhostSample[] = [0, 1, 2].map(i => ({ x: i * 100, y: i * 20, z: 0, yaw: 0, pitch: 0, roll: 0, steer: 0, progress: i }));
  const bytes = await saveGhost(key, samples, { time: 2 / 15, total: 2 / 15, car: 'kaze', livery: 0, hz: 15 });
  expect(bytes).toBeGreaterThan(0);
  expect(metadata.storageKeys).toContain('backroad-rally.ghost.' + key);
  const stored = values.get('backroad-rally.ghost.' + key)!;
  expect(Buffer.byteLength(stored)).toBeLessThanOrEqual(1048576);
  const loaded = await loadGhost(key);
  expect(loaded?.samples).toEqual(samples);
  expect(loaded?.meta.key).toBe(key);
  expect(values.size).toBe(1);
});
