#!/usr/bin/env python3
"""Executed local read-only structural/source check; no remote operations."""
import ast
import hashlib
import importlib.util
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
PATH = ROOT / 'joystick-games/tools/backroad-android-release-upload.py'
spec = importlib.util.spec_from_file_location('fixed_upload_static_check', PATH)
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
FILES = ['joystick-games/tools/backroad-android-release-upload.py', 'joystick-games/tools/backroad-android-release-upload-test.py',
         '.github/workflows/joystick-backroad-android-release-upload.yml', 'joystick-games/tools/fixtures/backroad-android-release-upload/release.json',
         'joystick-games/tools/fixtures/backroad-android-release-upload/pending-qa-run.json',
         'joystick-games/tools/fixtures/backroad-android-release-upload/original-qa-plan.json']
record = lambda p: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
source = {}
for name, expected in m.SOURCE_FILES.items():
    raw = subprocess.check_output(['git', 'show', m.QA['source'] + ':' + name], cwd=ROOT)
    actual = m.record(raw); assert actual == expected
    source[name] = actual
raw_runner = subprocess.check_output(['git', 'show', m.QA['source'] + ':joystick-games/qa/android/run.py'], cwd=ROOT)
strings = {n.value for n in ast.walk(ast.parse(raw_runner)) if isinstance(n, ast.Constant) and isinstance(n.value, str)}
assert all(name in strings or name.startswith('independent cached input down/release ') for name in m.REQUIRED_TESTS)
assert 'independent cached input down/release ' in strings
plan = json.loads(subprocess.check_output(['git', 'show', m.QA['source'] + ':' + m.PLAN_PATH], cwd=ROOT))
assert len(plan['steps']) == 39
for name in FILES[:2]: ast.parse((ROOT / name).read_text())
fixture = ROOT / 'joystick-games/tools/fixtures/backroad-android-release-upload'
observed_run = json.loads((fixture / 'pending-qa-run.json').read_text())
try:
    m.validate_qa_run(observed_run)
    raise AssertionError('Observed pending QA must not pass')
except m.origin.Rejected as e:
    pending_code = str(e); assert pending_code == 'qa_not_completed_successfully'
release = json.loads((fixture / 'release.json').read_text())
release_identity = m.release_identity(release)
assert {a['name'] for a in release['assets']} == set(m.MAC_ASSETS)
assets = [m.asset_identity(a, a['name']) for a in release['assets']]
command = ['/dev/shm/racing-tooling/actionlint', '-shellcheck=', FILES[2]]
process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
assert process.returncode == 0, process.stdout + process.stderr
(OUT / 'actionlint.log').write_text(process.stdout + process.stderr)
result = {'status': 'passed', 'scope': 'Local static checks and original fixed-source inspection only',
          'networkCallsByThisScript': 0, 'workflowDispatches': 0, 'releaseWrites': 0,
          'newFiles': {n: record(ROOT / n) for n in FILES},
          'unchangedImportedHelpers': {n: record(ROOT / 'joystick-games/tools' / n) for n in ('artifact-draft-transfer.py', 'android-runtime-artifact.py')},
          'fixedQaSource': m.QA, 'fixedQaExecutedSourceFilesVerified': source, 'originalPlanSteps': len(plan['steps']),
          'requiredReportNamesExistInOriginalRunner': True,
          'recordedOriginalObservation': {'run': observed_run['id'], 'source': observed_run['head_sha'], 'status': observed_run['status'], 'conclusion': observed_run['conclusion'], 'rejectedWith': pending_code, 'notALiveStatusRefresh': True},
          'recordedReleaseIdentity': release_identity, 'recordedMacAssetIdentity': assets,
          'actionlint': {'command': command, 'returncode': process.returncode, 'log': record(OUT / 'actionlint.log')},
          'physicalTvTestedByThisWork': False, 'newPackageBuiltOrSigned': False}
(OUT / 'static-validation.json').write_text(json.dumps(result, indent=2) + '\n')
print('Fixed 10 QA source files, original 39 steps, pending rejection, Release/Mac constants and actionlint passed; no network or mutation.')
