"""Read-only original evidence analysis; never launches Android or modifies reports."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SOURCE = '467670b4e43189dc8fc4786a5c6b3a14b6f9b2bd'
EVIDENCE = HERE / 'original-export/evidence/joystick-android-runtime-ponpoko-kart'
GAME = EVIDENCE / 'ponpoko-kart'
PRIOR = HERE.parent / 'emulator-supervisor-v6-44622571226'


def load(path):
    return json.loads(path.read_text())


def record(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


recovery = load(HERE / 'recovery-validation.json')
for name, value in recovery['records'].items():
    assert record(HERE / 'original-export' / name) == {k: value[k] for k in ['bytes', 'sha256']}

executed = load(GAME / 'executed-source.json')
assert executed['qaSourceSha'] == SOURCE and executed['qaRunId'] == '44630011092'
source_records = {}
for name, value in executed['files'].items():
    path = GAME / 'executed-source' / name
    assert record(path) == value
    frozen = subprocess.check_output(['git', 'show', SOURCE + ':' + name], cwd=ROOT)
    assert path.read_bytes() == frozen
    source_records[name] = value

binding = load(GAME / 'input-verification.log')
assert binding['status'] == 'passed' and binding['qaSourceSha'] == SOURCE
package = binding['games'][0]['package']
assert package['sha256'] == 'a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22'
assert package['bytes'] == 1602736

folder = GAME / 'emulator-launch-supervisor'
launch = load(folder / 'launch/report.json')
state = load(folder / 'state.json')
prior = load(PRIOR / 'findings.json')
assert launch['arguments'] == prior['originalArguments'] + ['-feature', '-Vulkan']
assert state['disableVulkan'] is True and state['expectedArguments'] == launch['arguments']
assert launch['actualQemuExitProven'] and launch['returnCode'] == launch['qemuExitCode'] == -11
assert launch['terminationSignal'] == 11 and launch['intervention'] is None and launch['receivedSignal'] is None
assert state['restored'] and state['queriesIdentical'] and not state['supervisorCleanupIncomplete']
assert state['original'] == prior['restore']['original']
for old, new in zip(prior['exit']['executables'], launch['executables'], strict=True):
    assert old['basename'] == new['basename'] and old['sha256'] == new['sha256'] and old['bytes'] == new['bytes']
    assert new['pid'] == launch['child']['pid'] and new['starttimeTicks'] == launch['child']['starttimeTicks']
for stream in ['stdout', 'stderr']:
    path = folder / 'launch' / (stream + '.log')
    assert record(path) == {'bytes': launch['bytesRetained'][stream], 'sha256': launch['outputSha256'][stream]}
assert record(folder / 'executed-supervisor.py') == source_records['joystick-games/tools/android-emulator-supervisor.py']
stdout = (folder / 'launch/stdout.log').read_text()
assert "Feature 'Vulkan' (21) is overridden to 'disabled'" in stdout

modes = []
for mode in ['normal', 'occupied']:
    path = EVIDENCE / ('ponpoko-kart-' + mode)
    report = load(path / 'report.json')
    assert report['sourceCommit'] == SOURCE and report['apk']['sha256'] == package['sha256']
    for name, value in report['sourceFiles'].items():
        assert record(path / 'source' / name) == value == source_records[name]
    snapshots = []
    for snapshot in report.get('snapshots', []):
        value = snapshot.get('snapshot') or {}
        snapshots.append({'label': snapshot['label'], 'game': value.get('game'),
                          'canvasCount': len((value.get('page') or {}).get('canvases', [])),
                          'activityState': value.get('activityState'), 'error': snapshot.get('error')})
    modes.append({'mode': mode, 'status': report['status'], 'tests': report['tests'],
                  'error': report['error'], 'snapshots': snapshots})

environment = load(GAME / 'environment-diagnostics/report.json')
samples = [json.loads(line) for line in (GAME / 'environment-diagnostics/samples.jsonl').read_text().splitlines()]
crash = load(GAME / 'environment-diagnostics/crash-report.json')
assert len(samples) == environment['log']['rows']
contracts = []
for name, count in [('qa-contracts.log', 53), ('artifact-contracts.log', 16), ('reuse-contracts.log', 15),
                    ('environment-diagnostics-tests.log', 14), ('install-confirmation-tests.log', 18),
                    ('emulator-supervisor-tests.log', 20)]:
    path = GAME / name
    raw = path.read_bytes()
    match = re.search(rb'Ran (\d+) tests? in ([0-9.]+)s', raw)
    assert match and int(match[1]) == count and raw.endswith(b'\nOK\n')
    contracts.append({'log': name, 'tests': count, 'durationSeconds': float(match[2]), **record(path)})
summary = {
    'scope': 'Original native observations; no new workflow or APK build, no gameplay acceptance',
    'runId': 44630011092, 'attempt': 1, 'qaSource': SOURCE, 'immutableExport': recovery['immutableExport'],
    'originalPackage': package, 'originalPackageSource': binding['artifactSourceSha'],
    'originalPackageRun': binding['artifactRunId'], 'originalPackageExport': binding['artifactExportCommit'],
    'recovery': {'files': recovery['files'], 'bytes': recovery['bytes'], 'manifestAndGitBlobVerified': True},
    'sourceCopiesBoundToFrozenGit': source_records,
    'actualCIContractSuites': contracts,
    'actualComparisonExecuted': True, 'configuredOnlyArgumentDelta': ['-feature', '-Vulkan'],
    'originalArgs': prior['originalArguments'], 'actualArgs': launch['arguments'],
    'originalApkAndObserverReusePassed': True, 'sameEmulatorAndQemuBinaryBytes': True,
    'explicitEmulatorLogObservation': "Feature 'Vulkan' (21) is overridden to 'disabled'",
    'exit': {k: launch[k] for k in ['actualQemuExitProven', 'qemuExitCode', 'returnCode', 'terminationSignal',
                                 'elapsedSeconds', 'receivedSignal', 'intervention', 'executables', 'child',
                                 'startedAtEpoch', 'finishedAtEpoch', 'originalExecutableUnchanged']},
    'sdkRestoration': {k: state[k] for k in ['original', 'restored', 'queriesIdentical', 'supervisorCleanupIncomplete']},
    'comparison': {'priorRun': 44622571226, 'priorQemuExitCode': prior['exit']['qemuExitCode'],
                   'priorElapsedSeconds': prior['exit']['elapsedSeconds'],
                   'interpretation': 'The controlled Vulkan-off run still observed actual QEMU SIGSEGV. This is not a crash fix. Different Actions runs do not establish identical host conditions or a unique crash cause.'},
    'modes': modes, 'runtimeVerification': load(HERE / 'original-export/runtime-verification.json'),
    'runConclusion': load(HERE / 'original-final-run.json')['conclusion'],
    'jobs': [{'id': j['id'], 'name': j['name'], 'conclusion': j['conclusion']} for j in load(HERE / 'original-final-jobs.json')['jobs']],
    'environment': {'samples': len(samples), 'minMemAvailableKiB': min(s['memory']['fields']['MemAvailable']['value'] for s in samples),
                    'cgroupOomValues': sorted({s['cgroup']['files']['memory.events']['fields']['oom'] for s in samples}),
                    'cgroupOomKillValues': sorted({s['cgroup']['files']['memory.events']['fields']['oom_kill'] for s in samples}),
                    'kernelEmulatorFaults': environment['kernelAfter']['emulatorFaults'],
                    'crashMetadataFiles': crash['files'], 'noNativeStackRecovered': True},
    'rootCauseProven': False, 'physicalTvTested': False, 'physicalEsp32Tested': False,
    'originalReportsModified': False, 'newWorkflowPostByThisAnalysis': False,
}
(HERE / 'findings.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps({'sourceFiles': len(source_records), 'originalFiles': recovery['files'],
                  'qemuExit': launch['qemuExitCode'], 'elapsedSeconds': launch['elapsedSeconds'],
                  'actualVulkanOff': True, 'rootCauseProven': False}))
