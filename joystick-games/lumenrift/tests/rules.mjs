import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = await build({
  stdin: { contents: "export * from './src/ui/sessions'; export { Game } from './src/game/game'; export { REALM_ORDER, REALMS, CORE_X, CORE_Y } from './src/game/config';", resolveDir: root },
  target: 'node20', platform: 'node', format: 'esm', bundle: true, write: false,
});
const { Game, newSessionId, saveSession, listSessions, loadSession, deleteSession, CORE_X, CORE_Y, REALM_ORDER, REALMS } =
  await import('data:text/javascript;base64,' + Buffer.from(fixture.outputFiles[0].contents).toString('base64'));

test('the cursor begins on a buildable tile in every campaign', () => {
  for (const realm of REALM_ORDER) {
    for (const seed of [0, 17, 108]) {
      const g = new Game(seed, 'normal', realm);
      const firstDefense = REALMS[realm].buildOrder[0];
      assert.equal(g.canPlace(firstDefense, CORE_X + 2, CORE_Y).ok, true);
      const funds = g.money;
      g.place(firstDefense, CORE_X + 2, CORE_Y);
      assert.equal(g.buildings.length, 1);
      assert.ok(g.money < funds);
      g.callWaveNow();
      assert.equal(g.wave, 1);
    }
  }
});

test('twelve independent runs fit the desktop host storage allowlist', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k),
  };
  const meta = JSON.parse(await readFile(new URL('../game.json', import.meta.url)));
  const seeds = [];
  for (let seed = 1; seed <= 13; seed++) {
    const id = newSessionId();
    saveSession(id, new Game(seed, 'normal'), seed, []);
    seeds.push(id);
    assert.ok(loadSession(id));
  }
  assert.deepEqual(seeds.slice(0, 12), Array.from({ length: 12 }, (_, i) => String(i)));
  assert.equal(listSessions().length, 12);
  for (const key of store.keys()) assert.ok(meta.storageKeys.includes(key), key);
  deleteSession('6');
  assert.equal(loadSession('6'), null);
  assert.equal(newSessionId(), '6');
});
