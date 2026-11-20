import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { lab } from '../src/specimens.js';
import { adaptRenderer } from '../src/adapt-renderer.mjs';

for (const renderer of ['webgl', 'webgpu']) {
  test(renderer + ' uses the added specimens in its actual budgeted wave picker', () => {
    const source = adaptRenderer(fs.readFileSync(new URL('../src/upstream/' + renderer + '.js', import.meta.url), 'utf8'));
    const rules = source.match(/(\w+)=(\{\.\.\.PureLab\.rules,walker:.*?\}\}),\w+=\{containmentMachine:"containmentMachine"/s);
    const picker = source.match(/(\w+)=Math.min\(\.\.\.Object.values\(\w+\).map\(\w+=>\w+.threatCost\)\),(\w+)=(\[\.\.\.PureLab\.picker,.*?\]);(function \w+\(\w+,\w+,\w+,\w+=\[\],\w+=!1\)\{.*?\})function /s);
    assert.ok(rules && picker);
    const [_, min, pool, campaign, select] = picker;
    const wave = Function('PureLab', 'const ' + rules[1] + '=' + rules[2] + '; const ' + min + '=1,' + pool + '=' + campaign + ';return ' + select)(lab);
    const chances = { runnerChance: 0, heavyChance: 0, codexSentinelChance: .05, emberHopperChance: .04 };
    for (const [name, draw] of [['codexSentinel', .03], ['emberHopper', .07]]) {
      assert.deepEqual(wave(5, chances, () => draw), [name, name, 'walker']);
      assert.deepEqual(wave(3, {}, () => .95, [name]), [name, 'walker']);
      assert.ok(lab.hints[name] && lab.scores[name] > 0 && lab.names[name]);
    }
    assert.ok(lab.rules.codexSentinel.ranged.shots > 1);
    assert.ok(lab.rules.emberHopper.attack.leap && lab.rules.emberHopper.blast);
    assert.deepEqual(lab.introductions.map(entry => entry.sector), [2,4]);
  });
}
