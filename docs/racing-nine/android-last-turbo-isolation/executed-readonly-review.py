import ast
import hashlib
import json
import os
from pathlib import Path
import subprocess
import types

ROOT = Path('/dev/shm/puretv-submit')
OUT = ROOT / 'docs/racing-nine/android-last-turbo-isolation'
BASE = 'c5ad63e8c6a0ccfada5f763d1d26afa27f45002e'
TURBO_SOURCE = '06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7'
PENGUIN = ROOT / 'joystick-games/penguintrack/docs/android-original-qa-isolation-attempt-2'
LAST = ROOT / 'joystick-games/last-track/docs/android-attempt-3/original-export'
TURBO = ROOT / 'joystick-games/turbo-kart-rush/docs/android-runtime-ci-44606216069/original-evidence'


def rec(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def read(path):
    return json.loads(path.read_text())


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, env={**os.environ, 'GIT_NO_LAZY_FETCH': '1'})


def blob(commit, path):
    return git('show', commit + ':' + path)


def bound_file(directory, manifest, path):
    data = (directory / path).read_bytes()
    assert rec(data) == manifest['files'][path]
    return json.loads(data)


last_manifest = read(LAST / 'export-manifest.json')
turbo_manifest = read(TURBO / 'export-manifest.json')
assert last_manifest['sourceSha'] == BASE and last_manifest['runId'] == '44606071748' and last_manifest['runAttempt'] == '1'
assert last_manifest['buildResult'] == last_manifest['signResult'] == 'success'
assert turbo_manifest['qaSourceSha'] == BASE and turbo_manifest['qaRunId'] == '44606216069'
assert turbo_manifest['artifactSourceSha'] == TURBO_SOURCE
assert turbo_manifest['artifactExportCommit'] == 'e01ab3ba25008cbbcbfa718321afa49fe6eb2331'
assert turbo_manifest['runtimeAccepted'] is False

last_receipt = bound_file(LAST, last_manifest, 'packages/last-track/signing-receipt.json')
last_observer = bound_file(LAST, last_manifest, 'observers/last-track/observer-signing-receipt.json')
last_reports = {mode: bound_file(LAST, last_manifest, 'reports/joystick-android-report-runtime-last-track/last-track-' + mode + '/report.json') for mode in ('normal', 'occupied')}
turbo_prefix = 'evidence/joystick-android-runtime-turbo-kart-rush/'
turbo_inputs = turbo_prefix + 'turbo-kart-rush/verified-inputs/'
turbo_receipt = bound_file(TURBO, turbo_manifest, turbo_inputs + 'packages/turbo-kart-rush/signing-receipt.json')
turbo_observer = bound_file(TURBO, turbo_manifest, turbo_inputs + 'observers/turbo-kart-rush/observer-signing-receipt.json')
turbo_binding = bound_file(TURBO, turbo_manifest, turbo_inputs + 'input-verification.json')
assert turbo_binding['status'] == 'passed' and turbo_binding['qaSourceSha'] == BASE
assert turbo_binding['artifactSourceSha'] == TURBO_SOURCE
turbo_reports = {mode: bound_file(TURBO, turbo_manifest, turbo_prefix + 'turbo-kart-rush-' + mode + '/report.json') for mode in ('normal', 'occupied')}
events = [e for e in turbo_reports['normal']['observerTransportEvents'] if e['snapshotCall'] == 32]
assert [e['attempt'] for e in events] == [1, 2, 3] and events[-1]['retryScheduled'] is False
adb_path = turbo_prefix + 'turbo-kart-rush-normal/adb-commands.jsonl'
assert rec((TURBO / adb_path).read_bytes()) == turbo_manifest['files'][adb_path]
adb = [json.loads(line) for line in (TURBO / adb_path).read_text().splitlines()]
assert any('device offline' in str(x.get('stderr', '')) for x in adb)
assert len(turbo_reports['normal']['tests']) == 5 and len(turbo_reports['occupied']['tests']) == 0
assert all(d['status'] == 'failed' for d in [*last_reports.values(), *turbo_reports.values()])

workflow_path = '.github/workflows/joystick-catalog-android-runtime.yml'
workflow = blob(BASE, workflow_path)
assert workflow == blob(TURBO_SOURCE, workflow_path)
old_options = '-no-window -memory 3072 -gpu swiftshader_indirect -noaudio -no-boot-anim -no-snapshot'
assert workflow.decode().count('emulator-options: ' + old_options) == 1
assert b'-feature -Vulkan' not in workflow

original_inputs = ast.parse(blob(BASE, 'joystick-games/tools/android-runtime-inputs.py'))
classifier = next(n for n in original_inputs.body if isinstance(n, ast.FunctionDef) and n.name == 'production_path')
env = {'build': types.SimpleNamespace(REGISTRY='joystick-games/catalog-registry.json', POLICY_PATH='joystick-games/tools/asset-policy.py'),
       'PHONE': {'resource/game-kit/web/' + x for x in ('controller.html', 'controller.css', 'controller.js')}}
exec(compile(ast.Module(body=[classifier], type_ignores=[]), '<original-production-path>', 'exec'), env)

helper_paths = [workflow_path, 'joystick-games/qa/android/run.py', 'joystick-games/qa/android/test_runner.py',
    'joystick-games/tools/qa-plan.py', 'joystick-games/tools/android-catalog.py', 'joystick-games/tools/android-build.py',
    'joystick-games/tools/android-runtime-inputs.py', 'joystick-games/tools/android-runtime-copies.py',
    'joystick-games/tools/android-tests.py', 'joystick-games/tools/asset-policy.py',
    'resource/game-kit/build.py', 'tools/resource_catalog.py', 'tools/puretv-release-certificate-v2.sha256',
    'puretv-joystick/joystick_sdk.py', 'joystick-games/catalog-registry.json',
    'joystick-games/qa/android/build-observer.py', 'joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java']
helper_paths += git('ls-tree', '-r', '--name-only', BASE, '--', 'joystick-games/qa/android/fixtures').decode().splitlines()
closure = {name: rec(blob(BASE, name)) for name in sorted(set(helper_paths))}
overlay_names = ['joystick-games/tools/android-runtime-inputs.py', 'joystick-games/tools/android-tests.py']
overlay = []
for name in overlay_names:
    file = PENGUIN / 'executed-overlay' / name
    overlay.append({'path': name, 'copyFromPath': file.relative_to(ROOT).as_posix(), **rec(file.read_bytes())})
assert overlay[0]['sha256'] == 'aa6c535038fc14a97d83bc8ded3b91a2e1a94dafe5e94214ab564f4f99842c08'
assert overlay[1]['sha256'] == '3776ce754e10332433dc2c9de46476986f0ca17982fd425566cd7e90d2afcb40'

games = []
for slug, source, artifact_run, export, receipt, observer, reports in [
    ('last-track', BASE, 44606071748, '35fca55f5a05d38785fb531004eca9add6913f04', last_receipt, last_observer, last_reports),
    ('turbo-kart-rush', TURBO_SOURCE, 44600152694, 'e01ab3ba25008cbbcbfa718321afa49fe6eb2331', turbo_receipt, turbo_observer, turbo_reports)]:
    plan_path = 'joystick-games/' + slug + '/qa-plan.json'
    plan_bytes = blob(BASE, plan_path)
    assert plan_bytes == blob(source, plan_path)
    production = sorted(name for name in receipt['sourceInputs'] if env['production_path'](name, slug))
    assert not set(overlay_names) & set(production)
    # Compare immutable Git tree object identities without rereading large source blobs.
    def tree(commit):
        result = {}
        for line in git('ls-tree', '-r', commit, '--', *production).decode().splitlines():
            metadata, name = line.split('\t', 1); result[name] = metadata.split()[2]
        return result
    artifact_tree, qa_tree = tree(source), tree(BASE)
    assert set(artifact_tree) == set(production) and artifact_tree == qa_tree
    assert blob(source, 'puretv-joystick/joystick_sdk.py') == blob(BASE, 'puretv-joystick/joystick_sdk.py')
    assert all(blob(source, name) == blob(BASE, name) for name in observer['sourceFiles'])
    actual_plan = read((LAST / 'reports/joystick-android-report-runtime-last-track/last-track/executed-source' if slug == 'last-track'
        else TURBO / (turbo_prefix + 'turbo-kart-rush/executed-source')) / plan_path)
    assert actual_plan == json.loads(plan_bytes)
    games.append({
        'game': slug, 'qaParentCommit': BASE, 'originalPackageSource': source,
        'originalPackageRun': artifact_run, 'originalPackageAttempt': 1, 'originalPackageExport': export,
        'package': {key: receipt[key] for key in ('bytes', 'sha256', 'packageName', 'versionName', 'versionCode', 'certificateSha256')},
        'observer': observer['apkIdentity'],
        'lastActualQaRun': 44606071748 if slug == 'last-track' else 44606216069,
        'lastActualQaSource': BASE,
        'lastActualQaExport': export if slug == 'last-track' else 'dc8ec7aadcd7ea2357abf4c168a197a2c17b9371',
        'lastActualOutcomes': {mode: {'status': d['status'], 'passedChecks': len(d['tests'])} for mode, d in reports.items()},
        'currentRequiredOverlay': overlay if slug == 'last-track' else [],
        'originalPlan': {'path': plan_path, **rec(plan_bytes), 'steps': len(json.loads(plan_bytes)['steps']), 'unchangedFromPackageAndLatestQa': True},
        'productionPathsWithIdenticalGitObjects': len(production),
        'signedAssets': len(receipt['assets']), 'nestedSignedAssets': sum('/' in name for name in receipt['assets']),
        'dispatchInputTemplate': {'qa_source_sha': 'ROOT_CREATED_ISOLATED_COMMIT', 'artifact_source': source,
            'artifact_export': export, 'artifact_run': str(artifact_run), 'batch': 'racing-02' if slug == 'last-track' else 'racing-03', 'games': slug},
        'prospectiveOverlayCountIfVulkanOffLaterSelected': 3 if slug == 'last-track' else 1,
        'futureContractSuites': ['unchanged c5 test_runner.py (39 existing tests)', 'android-tests.py (16 original + 4 reviewed payload boundaries)' if slug == 'last-track' else 'unchanged c5 android-tests.py (16 existing tests)'],
        'packageAuditScope': 'Receipt and source-tree consistency checked here; complete Last APK/certificate/asset byte audit is still required before delivery.' if slug == 'last-track' else 'Prior original full package audit and latest original successful input-binding retained; no new package audit/download was performed here.'
    })

result = {
    'status': 'prepared-recipes-only-awaiting-Pon-result-and-root-decision',
    'scope': 'Read-only fixed-source/evidence/manifest/plan/dependency comparison. No current QA/game source edits, tests, native execution, package download, Git ref or dispatch.',
    'games': games,
    'fixedCommonQaClosure': {'sourceCommit': BASE, 'files': closure},
    'existingObserverRetry': {'sourceCommit': BASE, 'maximumAttempts': 3, 'maximumWallSeconds': 45, 'perRequestMaximumSeconds': 15, 'alreadyExecutedInTurboRun': 44606216069, 'noAdditionalBackportNeeded': True},
    'originalEnvironment': {'workflow': workflow_path, **rec(workflow), 'action': 'reactivecircus/android-emulator-runner@v2',
        'apiLevel': 36, 'target': 'android-tv', 'arch': 'x86_64', 'profile': 'tv_1080p', 'avdName': 'JoystickGamesValidation',
        'emulatorOptions': old_options, 'emulatorBuildPinned': False, 'actualPriorEmulator': '37.2.13.0 build 16740729'},
    'prospectiveSingleVariable': {'state': 'not-selected-not-applied', 'awaitedPonRun': 44630011092,
        'path': workflow_path, 'lineInFixedParent': 181, 'oldValue': old_options, 'candidateValue': old_options + ' -feature -Vulkan',
        'onlyAddedArgv': ['-feature', '-Vulkan'],
        'preserve': ['3072 MiB RAM', 'API 36 TV image', 'SwiftShader GPU', 'action reference', 'original menu/physics/clock/plan and strict SDK freshness assertions', 'fixed package and Observer bytes', 'both normal and occupied modes'],
        'limitation': 'The original workflow leaves emulator version and @v2 action floating. A future run must record its actual version; if those changed, comparison against historical runs is not a fully controlled sole-runtime-variable experiment. No Vulkan causal or cross-game fix conclusion is implied.'},
    'latestFailureBasis': {
        'last-track': 'c5/run44606071748: normal five checks pass, original MED modal/frame86 then LEFT seq89 ACK, subsequent pings not ACKed, Observer refused and emulator-5554 missing. Occupied wait-for-device times out before checks. No evidence justifies menu/physics change.',
        'turbo-kart-rush': 'Latest c5 QA run44606216069, not the older06f production runtime: normal five checks pass, snapshotCall32 uses three fresh GETs then exhausts; ADB pidof/video pull explicitly device offline. Occupied wait-for-device fails before checks. The earlier06f run had callback timeouts with ADB still available; both original histories remain distinct.'},
    'strictAcceptancePreserved': ['exact repository/workflow/source/run/attempt/export and original successful build/sign jobs', 'complete original source inventory and unchanged production/Observer/SDK', 'fixed release certificate/package/version/content/assets', 'native nine-key SDK and complete ID card', 'original plan predicates and fresh frame/poll checks', 'manual recovery and both normal/occupied outcomes', 'original failure preservation and no model/clock writes'],
    'openItems': ['Await actual Pon Vulkan comparison; no new workflows authorized by this recipe.', 'Root materializes any selected child with exact parent/diff/SHA; do not use later master production.', 'Last original signed APK needs full independent package audit before public delivery.', 'Existing tests are referenced, not rerun for these unmaterialized recipes.', 'If native execution still loses ADB, preserve exact evidence and do not weaken assertions or infer OOM without process evidence.']
}
OUT.mkdir(parents=True, exist_ok=False)
(OUT / 'recipe.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'output': str(OUT / 'recipe.json'), 'games': [{'game': g['game'], 'production': g['productionPathsWithIdenticalGitObjects'], 'overlaysNow': len(g['currentRequiredOverlay']), 'assets': g['signedAssets']} for g in games]}))
