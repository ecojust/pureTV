import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Use the actual shared QA predicate evaluator against unchanged game snapshots
// from both failed Windows runs; do not implement a second matcher in this test.
test('menu steps reject all twelve original stale Controls snapshots', () => {
  const root=fileURLToPath(new URL('..',import.meta.url));
  const result=spawnSync(process.platform==='win32'?'python':'python3',['-c',`
import importlib.util,json,pathlib
g=pathlib.Path.cwd();p=g.parent/'tools/qa-plan.py'
spec=importlib.util.spec_from_file_location('qa_plan_original',p);qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)
plan=qa.load_plan(g/'qa-plan.json')
data=json.loads((g/'tests/fixtures/menu-focus-original-failures.json').read_text())
assert len(data['cases'])==12 and {c['mode'] for c in data['cases']}=={'normal','occupied'}
legacy=[{'path':'gameplay.menu','op':'eq','value':'controls'}]
for case in data['cases']:
    step=next(s for s in plan['steps'] if s['name']==case['name'])
    snapshot=case['snapshot']
    assert qa.matches(legacy,snapshot,snapshot),case['name']
    assert not qa.matches(step['expect'],snapshot,snapshot),case['name']
    assert step.get('menuTap') is True
    # A missing label or another panel must never certify a focus transition.
    for game in ({'gameplay':{'menu':'controls'}},{'gameplay':{'menu':'title','focus':'Left'}}):
        assert not qa.matches(step['expect'],game,snapshot)
print(json.dumps({'originalStaleSnapshotsRejected':12,'originalControlsOnlyFalsePositives':12}))
`],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
  assert.deepEqual(JSON.parse(result.stdout),{originalStaleSnapshotsRejected:12,originalControlsOnlyFalsePositives:12});
});
