import ast
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path('/dev/shm/puretv-submit')
DOC = ROOT / 'joystick-games/penguintrack/docs/android-original-qa-isolation-attempt-1'
BASE = 'c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'


def record(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT,
                                   env={**os.environ, 'GIT_NO_LAZY_FETCH': '1'})


def blob(commit, name):
    return git('show', commit + ':' + name)


inventory = json.loads((DOC / 'inventory.json').read_text())
for entry in inventory['files']:
    assert record((DOC / entry['path']).read_bytes()) == {k: entry[k] for k in ('bytes', 'sha256')}
preflight = json.loads((DOC / 'preflight-final.json').read_text())
assert preflight['parentCommit'] == BASE
overlay = {entry['path']: entry for entry in preflight['sourceFiles']}
assert len(overlay) == 19
for name, entry in overlay.items():
    data = (DOC / 'executed-overlay' / name).read_bytes()
    assert record(data) == {k: entry[k] for k in ('bytes', 'sha256')}
    assert data == blob(entry['copyFromCommit'], name)
for name, expected in preflight['protectedOriginalSources'].items():
    assert name not in overlay
    assert record(blob(BASE, name)) == expected
assert not set(overlay) & set(preflight['unchangedProductionPaths'])

plan_path = 'joystick-games/penguintrack/qa-plan.json'
original = json.loads(blob(BASE, plan_path))
new = json.loads((DOC / 'executed-overlay' / plan_path).read_text())
assert new['steps'][2:] == original['steps']
assert {k: v for k, v in new.items() if k != 'steps'} == {k: v for k, v in original.items() if k != 'steps'}
assert [s['keys'] for s in new['steps'][:2]] == [['UP'], ['DOWN']]
assert all(s['holdMs'] == 80 for s in new['steps'][:2])

runner = blob(BASE, 'joystick-games/qa/android/run.py')
assert b'import install_failure' not in runner and b'import install_confirmation' not in runner
install_test = (DOC / 'executed-overlay/joystick-games/qa/android/test_install_confirmation.py').read_text()
assert "HERE / 'run.py'" in install_test
assert 'self.runner.install_failure' in install_test and 'self.runner.install_confirmation' in install_test

prefix = 'joystick-games/penguintrack/dist/'
paths = git('ls-tree', '-r', '--name-only', BASE, '--', prefix).decode().splitlines()
nested = [p[len(prefix):] for p in paths if '/' in p[len(prefix):]]
assert len(paths) == 151 and len(nested) == 147
old_inputs = blob(BASE, 'joystick-games/tools/android-runtime-inputs.py')
assert b"assert all('/' not in name for name in expected_assets)" in old_inputs
package_doc = ROOT / 'joystick-games/penguintrack/docs/android-original-packages-44606071748-44606074787'
receipt = json.loads((package_doc / 'penguintrack/packages/signing-receipt.json').read_text())
assert len(receipt['assets']) == 156 and sum('/' in p for p in receipt['assets']) == 147
prior = json.loads((package_doc / 'report.json').read_text())
game = next(g for g in prior['games'] if g['game'] == 'penguintrack')
assert game['exportCommit'] == '35fca55f5a05d38785fb531004eca9add6913f04'
assert game['run'] == '44606071748' and prior['source'] == BASE
assert game['package']['sha256'] == 'e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827'
assert game['package']['bytes'] == 2342332
assert game['observer']['sha256'] == '3cec77b567652ac6b05f49587d222981e88b60c940e658e4d4958e39c33329e9'
assert game['package']['certificateSha256'] == blob(BASE, 'tools/puretv-release-certificate-v2.sha256').decode().strip()

result = {
    'status': 'blocked-superseded-candidate',
    'scope': 'Independent read-only source and recorded-evidence review; no native/test rerun, package fetch, Git object/ref creation or dispatch.',
    'parentCommit': BASE,
    'reviewedInventory': record((DOC / 'inventory.json').read_bytes()),
    'overlaySourceFilesMatchedFixedGit': len(overlay),
    'originalPlanStepsPreserved': len(original['steps']),
    'addedNormalInputSteps': new['steps'][:2],
    'protectedOriginalSourcesMatched': len(preflight['protectedOriginalSources']),
    'productionPathOverlap': [],
    'findings': [
        {'id': 'unconditional-backroad-test-dependency', 'blocking': True,
         'file': 'joystick-games/qa/android/test_install_confirmation.py',
         'lines': [233, 253, 255],
         'detail': 'The unconditional new installation suite imports run.py and requires its install_failure/install_confirmation hooks, absent in preserved c5. Its previous 18 passes used a different runner; the 117-test and unchanged-five-suite claims cannot establish this final 19-file candidate.'},
        {'id': 'old-supervisor-fixture-race', 'blocking': True,
         'detail': 'Root independently identified a launch/restore test-fixture race in the imported old supervisor suite. A separate Native-readiness fix was pending; the existing 15-pass log does not prove that race absent. No supervisor change was made by this reviewer.'},
        {'id': 'one-file-alternative-flat-only-verifier', 'blocking': True,
         'file': 'joystick-games/tools/android-runtime-inputs.py',
         'detail': 'The c5-only alternative retains a flat-only expected_assets assertion. Penguin has 147 nested files among 151 dist files and 156 signed APK assets. It needs the narrow frozen original payload/policy verifier backport, with ordinary no-policy nested rejection retained; merely overlaying qa-plan.json fails before runtime.'}
    ],
    'originalPackageIdentity': game,
    'originalWorkflowReview': {
        'file': '.github/workflows/joystick-catalog-android-runtime.yml',
        **record(blob(BASE, '.github/workflows/joystick-catalog-android-runtime.yml')),
        'sourceRunExportBinding': True,
        'successfulOriginalBuildAndSignRequired': True,
        'fullFixedCertificateAndApkContentVerification': True,
        'bothOriginalModesAndAllTestsRequired': True,
        'originalModelWritesAndClockOverridesFalseRequired': True,
        'smallApkObserverCopiesSupported': True,
        'limitations': ['Original c5 @v2 emulator action is not a pinned action commit and no emulator build is pinned; this is unchanged original environment policy, not a new runtime outcome.', 'The frozen full source tree has not yet been materialized; no candidate Git parent/diff can yet be verified.']
    },
    'nativePassed': False,
    'originalRuntimeStillFailed': True,
    'recommendedScope': 'Preserve c5 workflow, runner, schema, tests and all production paths; prepend only the two proven menu steps and narrowly backport exact original nested-payload/policy verification with necessary boundary coverage. Root materializes and checks the final exact parent/diff.'
}
destination = Path('/dev/shm/racing-review-arcade/penguin-isolation-independent-review.json')
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'review': str(destination), 'status': result['status'], 'overlayFiles': len(overlay), 'nestedAssets': len(nested)}))
