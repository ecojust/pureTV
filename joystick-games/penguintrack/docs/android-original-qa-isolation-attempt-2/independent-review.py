import ast
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import types

ROOT = Path('/dev/shm/puretv-submit')
DOC = ROOT / 'joystick-games/penguintrack/docs/android-original-qa-isolation-attempt-2'
BASE = 'c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
QA = 'd3b9178bfc4748ef0d8b983f4c6775969f946625'


def record(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def blob(commit, path):
    return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT,
                                   env={**os.environ, 'GIT_NO_LAZY_FETCH': '1'})


def dump(node):
    return ast.dump(node, include_attributes=False)


inventory = json.loads((DOC / 'inventory.json').read_text())
for item in inventory['files']:
    assert record((DOC / item['path']).read_bytes()) == {k: item[k] for k in ('bytes', 'sha256')}
preflight = json.loads((DOC / 'preflight.json').read_text())
assert preflight['parentCommit'] == BASE
overlay = {x['path']: x for x in preflight['sourceFiles']}
expected_paths = {'joystick-games/penguintrack/qa-plan.json', 'joystick-games/tools/android-runtime-inputs.py', 'joystick-games/tools/android-tests.py'}
assert set(overlay) == expected_paths
for name, item in overlay.items():
    assert record((DOC / 'executed-overlay' / name).read_bytes()) == {k: item[k] for k in ('bytes', 'sha256')}
for name, expected in preflight['protectedOriginalSources'].items():
    assert name not in overlay and record(blob(BASE, name)) == expected

plan_path = 'joystick-games/penguintrack/qa-plan.json'
old_plan = json.loads(blob(BASE, plan_path))
new_plan = json.loads((DOC / 'executed-overlay' / plan_path).read_text())
assert new_plan['steps'][2:] == old_plan['steps']
assert {k: v for k, v in new_plan.items() if k != 'steps'} == {k: v for k, v in old_plan.items() if k != 'steps'}
assert (DOC / 'executed-overlay' / plan_path).read_bytes() == blob('ff645cc2f195d4071150be1fffd2b7952c265129', plan_path)

inputs_path = 'joystick-games/tools/android-runtime-inputs.py'
old_text = blob(BASE, inputs_path).decode()
new_text = (DOC / 'executed-overlay' / inputs_path).read_text()
new_ast = ast.parse(new_text)
helper = next(x for x in new_ast.body if isinstance(x, ast.FunctionDef) and x.name == 'frozen_payload')
original_helper = next(x for x in ast.parse(blob(QA, inputs_path)).body if isinstance(x, ast.FunctionDef) and x.name == 'frozen_payload')
assert dump(helper) == dump(original_helper)
old_block = """        prefix = 'joystick-games/' + slug + '/dist/'
        expected_assets = {name[len(prefix):]: value for name, value in frozen_files.items() if name.startswith(prefix)}
        assert all('/' not in name for name in expected_assets)
        expected_assets.update({Path(name).name: frozen_files[name] for name in PHONE})
        expected_assets['game-config.json'] = (json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\\n').encode()
        expected_assets['assets-index.json'] = (json.dumps(sorted(expected_assets), separators=(',', ':')) + '\\n').encode()
"""
assert old_text.count(old_block) == 1
expected = old_text.replace('import sys\n', 'import sys\nimport tempfile\nimport types\n', 1)
expected = expected.replace('\ndef verify(args):', '\n' + ast.get_source_segment(new_text, helper) + '\n\n\ndef verify(args):', 1)
expected = expected.replace(old_block, '        expected_assets = frozen_payload(meta, registered, frozen_files, slug)\n', 1)
assert dump(ast.parse(expected)) == dump(new_ast), 'Unexpected input verifier change'

tests_path = 'joystick-games/tools/android-tests.py'
old_tests = ast.parse(blob(BASE, tests_path))
new_tests = ast.parse((DOC / 'executed-overlay' / tests_path).read_text())
extra = [n for n in new_tests.body if isinstance(n, ast.ClassDef) and n.name == 'FrozenPayloadBoundaries']
assert len(extra) == 1
filtered = copy.deepcopy(new_tests)
filtered.body = [n for n in filtered.body if not isinstance(n, ast.ClassDef) or n.name != 'FrozenPayloadBoundaries']
assert dump(filtered) == dump(old_tests), 'Original packaging tests changed'
original_test_count = sum(isinstance(n, ast.FunctionDef) and n.name.startswith('test_') for n in ast.walk(old_tests))
new_test_count = sum(isinstance(n, ast.FunctionDef) and n.name.startswith('test_') for n in ast.walk(extra[0]))
assert original_test_count == 16 and new_test_count == 4

# Derive protected production paths independently using the unchanged original classifier.
production_node = next(x for x in ast.parse(old_text).body if isinstance(x, ast.FunctionDef) and x.name == 'production_path')
env = {'build': types.SimpleNamespace(REGISTRY='joystick-games/catalog-registry.json', POLICY_PATH='joystick-games/tools/asset-policy.py'),
       'PHONE': {'resource/game-kit/web/' + p for p in ('controller.html', 'controller.js', 'controller.css')}}
exec(compile(ast.Module(body=[production_node], type_ignores=[]), '<original-production-classifier>', 'exec'), env)
package_doc = ROOT / 'joystick-games/penguintrack/docs/android-original-packages-44606071748-44606074787'
receipt_bytes = (package_doc / 'penguintrack/packages/signing-receipt.json').read_bytes()
receipt = json.loads(receipt_bytes)
production = sorted(n for n in receipt['sourceInputs'] if env['production_path'](n, 'penguintrack'))
assert production == json.loads((DOC / 'production-inventory.json').read_text())['unchangedProductionPaths']
assert not set(production) & expected_paths
assert record(receipt_bytes)['sha256'] == preflight['receiptSha256']
assert len(receipt['assets']) == 156 and sum('/' in n for n in receipt['assets']) == 147

workflow = blob(BASE, '.github/workflows/joystick-catalog-android-runtime.yml')
assert (DOC / 'original-runtime-workflow.yml').read_bytes() == workflow
assert b'test_install_confirmation.py' not in workflow and b'test_emulator_supervisor.py' not in workflow
assert b'python3 joystick-games/qa/android/test_runner.py' in workflow and b'python3 joystick-games/tools/android-tests.py' in workflow
request = json.loads((DOC / 'dispatch-template.json').read_text())
assert request['parentCommit'] == BASE and request['candidateCommit'] is None and request['candidateTree'] is None
assert request['onlyOverlayPaths'] == preflight['sourceFiles']
assert request['inputs'] == {'qa_source_sha': 'ROOT_CREATED_ISOLATED_COMMIT', 'artifact_source': BASE, 'artifact_export': '35fca55f5a05d38785fb531004eca9add6913f04', 'artifact_run': '44606071748', 'batch': 'racing-02', 'games': 'penguintrack'}
packaging_log = (DOC / 'minimal-android-tests.log').read_text()
assert 'Ran 20 tests in 0.232s' in packaging_log and packaging_log.rstrip().endswith('OK')
runner_log = (DOC / 'test_runner-final.log').read_bytes()
assert b'Ran 39 tests' in runner_log and runner_log.rstrip().endswith(b'OK')
assert runner_log == (DOC.parent / 'android-original-qa-isolation-attempt-1/test_runner-final.log').read_bytes()

result = {
    'status': 'no-static-blocker-for-frozen-three-file-recipe',
    'scope': 'Independent fixed-source, AST, closure and existing-log review; no test rerun, browser, native execution, package download, build, commit/ref or dispatch.',
    'parentCommit': BASE,
    'reviewedInventory': record((DOC / 'inventory.json').read_bytes()),
    'overlayFiles': list(overlay.values()),
    'originalVerifierOtherAstUnchanged': True,
    'payloadHelperExactOriginalReviewedFunction': QA,
    'protectedProductionPaths': len(production),
    'productionPathOverlap': [],
    'protectedSourcesMatched': len(preflight['protectedOriginalSources']),
    'originalPlanStepsPreserved': len(old_plan['steps']),
    'newMenuSteps': ['UP 80ms -> Controller', 'DOWN 80ms -> Play'],
    'oldPackagingTestsAstIdentical': original_test_count,
    'newBoundaryTests': new_test_count,
    'existingTestResults': {'packaging': 20, 'runnerReused': 39, 'freshlyRerunByReviewer': 0},
    'testClosure': 'The unchanged c5 workflow invokes only the original runner suite and the packaging suite with four additive boundaries. No Night source proof, Back installation or Pon supervisor suite is imported. The reused 39-test suite imports the unchanged runner/Observer/SDK/schema/build/registry and identical catalog fixture plans; the c5 catalog/workflow rollback does not enter its dependency graph.',
    'identityAndAcceptance': [
        'Only c5 source, original run 44606071748/attempt 1, immutable export 35fca55f5a05d38785fb531004eca9add6913f04 and Penguin selection are requested.',
        'The unchanged workflow requires exact original workflow/repository/source/attempt, unique successful selected build and sign jobs, full export hashes and source inputs, and unchanged original production/Observer/SDK bytes.',
        'Actual APK certificate/hash/size/package/version/content and complete assets remain required before execution; normal and occupied outcomes, all original tests, source copies and video hashes must pass. Model writes and clock overrides remain false.',
        'Nested assets now use the original frozen GameKit payload with the unchanged matching per-game/registry policy; no-policy nested assets remain rejected. Full actual-assets equality remains after construction.'
    ],
    'originalPackage': {'bytes': receipt['bytes'], 'sha256': receipt['sha256'], 'certificateSha256': receipt['certificateSha256'], 'receiptSha256': record(receipt_bytes)['sha256'], 'assets': 156, 'nestedAssets': 147},
    'existingPayloadReconstruction': 'Karts executed fixed original-source reconstruction and matched all 156 names/bytes to the already audited original signed receipt; this reviewer checked the exact helper/recipe/receipt/log bindings without rerunning that reconstruction.',
    'limitations': [
        'This remains a recipe, not a materialized Git commit. Root must create exactly one child of c5 with exactly these three changed paths and recheck each SHA before dispatch.',
        'Original Android failures remain failed; normal-input DOM evidence and local tests do not establish new native gameplay.',
        'Original c5 emulator policy remains API36/3072MiB/SwiftShader with unpinned emulator build and @v2 action; no new diagnostics or claimed crash fix.',
        'Earlier 19-file candidate and its corrected dependency failure remain retained, not replaced by this result.'
    ],
    'blockers': [],
    'nativePassed': False
}
out = Path('/dev/shm/racing-review-arcade/penguin-isolation-final-independent-review.json')
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], 'protectedProductionPaths': len(production), 'output': str(out)}))
