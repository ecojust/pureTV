#!/usr/bin/env python3
"""Extract counts and verbatim evidence from this run's complete archived job logs.

Only this script's input files are read; it never runs tests or alters the repo.
Ignored and filtered Rust tests stay distinct from executed passes. MCP counts
are logged call checks, which can include repeated status polling.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUN = 42455034353
SOURCE = 'a3b1ef17a08e574c5ad5e607f27dd5d1bc4d8166'
TAG = '6da7e0b94da0ebbb6bdb6f651dbcd8673a330016'
PLATFORMS = {'windows-x64', 'linux-x64', 'macos-x64', 'macos-arm64'}
STEPS = (
    'Verify version metadata', 'Check and build frontend', 'Test subnet comparison',
    'Test read-only TV compatibility probe', 'Test ADB core',
    'Test Platform Tools installer',
    'Verify official Platform Tools download and offline reuse',
    'Verify Tencent mirror download and ADB', 'Test desktop UI',
    'Test SVG normalization', 'Verify MCP against the running desktop',
    'Verify actual client update installation',
    'Verify macOS DMG, bundle signature and installed startup',
)
SOURCES = (
    '.github/workflows/desktop.yml', 'desktop/tests/ui.mjs',
    'desktop/scripts/verify-client-update.py',
    'desktop/scripts/verify-macos-bundle.py', 'desktop/scripts/verify-mcp.py',
    'desktop/src-tauri/tauri.conf.json',
)
run = json.loads((ROOT / 'run-final.json').read_text())
metadata = json.loads((ROOT / 'run-metadata.json').read_text())
tag = json.loads((ROOT / 'tag-metadata.json').read_text())
index = json.loads((ROOT / 'raw-log-index.json').read_text())
assert run['databaseId'] == RUN and run['headSha'] == SOURCE
assert run['status'] == 'completed' and metadata['head_sha'] == SOURCE
assert metadata['id'] == RUN and metadata['run_attempt'] == 1
assert metadata['status'] == run['status'] and metadata['conclusion'] == run['conclusion']
assert tag['sha'] == TAG and tag['object']['sha'] == SOURCE
result = {
    'runId': RUN, 'sourceCommit': SOURCE, 'tagObject': TAG,
    'status': run['status'], 'conclusion': run['conclusion'],
    'runAttempt': metadata['run_attempt'], 'platforms': {},
    'publish': [{key: job[key] for key in ('databaseId', 'status', 'conclusion')}
                for job in run['jobs'] if job['name'] == 'Publish desktop release'],
    'physicalTvTested': False, 'physicalPhoneTested': False,
    'limitations': [
        'Rust ignored and filteredOut counts are not executed passes.',
        'Official download, Tencent mirror and update preparation each explicitly execute one test separately from the main native suite.',
        'UI, SVG and MCP steps run only on Linux; skipped steps are not counted as passed tests.',
        'MCP passedMcpCheckLines counts logged calls including repeated status polling; expectedFailureMcpChecks are expected rejections.',
        'MCP and installed-startup ADB actions use simulated ADB, not a physical television.',
        'Linux update checks validate the actual DEB and native metadata preparation without system package installation.',
        'macOS signature/startup checks do not establish Apple notarization or Gatekeeper approval.',
        'Public release download verification is handled separately from this CI audit.',
    ],
}
rust_pattern = re.compile(r'test result: (\w+)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured; (\d+) filtered out;')
useful_pattern = re.compile(
    r'test result:|test market::|test .+ \.\.\. ignored|PASS \d+:|PASS MCP:|PASS:|All .*passed|\d+ UI scenarios passed|tests? passed|tests? failed|Ran \d+ tests|# (tests|pass|fail|cancelled|skipped|todo)|ℹ (tests|pass|fail|cancelled|skipped|todo) |(?:^|\s)OK$|FAILED|Verified actual|Verified baseline|Verified .*signature|Installed copy|DMG install/startup checks|native_update_package_preparation|official_download_and_offline_reuse \.\.\.|mirror_download_and_adb_check \.\.\.'
)
for job in run['jobs']:
    name = job['name']
    if name not in PLATFORMS:
        continue
    raw = (ROOT / (name + '.log')).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    assert index[name]['jobId'] == job['databaseId']
    assert index[name]['logBytes'] == len(raw) and index[name]['logSha256'] == digest
    entry = {
        'jobId':job['databaseId'], 'conclusion':job['conclusion'],
        'logRetrieved':True, 'logBytes':len(raw), 'logSha256':digest,
        'steps':{step['name']:{'status':step['status'], 'conclusion':step['conclusion']}
                 for step in job['steps'] if step['name'] in STEPS},
    }
    excerpts = {step:[] for step in STEPS}
    for line in raw.decode(errors='replace').splitlines():
        fields = line.split('\t', 2)
        if len(fields) != 3 or fields[1] not in STEPS:
            continue
        step, text = fields[1:]
        details = entry['steps'][step]
        match = rust_pattern.search(text)
        if match:
            values = match.groups()
            details.setdefault('rustResults', []).append({
                'result':values[0], **dict(zip(
                    ('passed', 'failed', 'ignored', 'measured', 'filteredOut'), map(int, values[1:])))})
        ignored = re.search(r'test (.+?) \.\.\. ignored(?:, (.*))?$', text)
        if ignored:
            details.setdefault('ignoredTests', []).append({'name':ignored[1], 'reason':ignored[2]})
        if step == 'Test desktop UI' and re.search(r'PASS \d+:', text):
            details['passedScenarios'] = details.get('passedScenarios', 0) + 1
        ui_summary = re.search(r'(\d+) UI scenarios passed', text)
        if step == 'Test desktop UI' and ui_summary:
            details['reportedPassedScenarios'] = int(ui_summary[1])
        if step == 'Verify MCP against the running desktop' and re.search(r'PASS MCP:', text):
            details['passedMcpCheckLines'] = details.get('passedMcpCheckLines', 0) + 1
            if '(expected failure)' in text:
                details['expectedFailureMcpChecks'] = details.get('expectedFailureMcpChecks', 0) + 1
        node = re.search(r'(?:ℹ|#) (tests|pass|fail|cancelled|skipped|todo) (\d+)', text)
        if node:
            details.setdefault('nodeSummary', {})[node[1]] = int(node[2])
        python = re.search(r'Ran (\d+) tests in', text)
        if python:
            details['pythonTests'] = int(python[1])
        upgrade = re.search(r'Verified actual ([0-9.]+) -> ([0-9.]+) helper upgrade, normal shutdown, relaunch and retained data', text)
        if upgrade:
            details['actualUpgrade'] = {
                'baselineVersion':upgrade[1], 'currentVersion':upgrade[2],
                'helperUpgrade':True, 'normalShutdown':True, 'relaunch':True,
                'retainedData':True,
            }
        if 'Verified actual DEB identity and native metadata preparation; no system installation performed' in text:
            details['linuxUpdate'] = {'actualDebIdentity':True, 'nativeMetadataPreparation':True, 'systemInstallationPerformed':False}
        bundle = re.search(r'Verified .+\.app: (\S+), macOS ([0-9.]+)\+, complete bundle signature', text)
        if bundle:
            details.setdefault('bundleVerifications', []).append({'architecture':bundle[1], 'minimumMacOS':bundle[2], 'completeBundleSignature':True})
        if 'Installed copy stayed running for 5 seconds (no device operations)' in text:
            details['installedCopyStartupSeconds'] = 5
            details['startupDeviceOperations'] = False
        if 'Installed copy exited normally after stopping simulated ADB' in text:
            details['normalExitAfterStoppingSimulatedAdb'] = True
        if 'DMG install/startup checks passed.' in text:
            details['dmgInstallStartupPassed'] = True
            details['appleNotarizationVerified'] = False
            details['gatekeeperApprovalVerified'] = False
        if useful_pattern.search(text):
            excerpts[step].append(re.sub(r'https?://[^\s"<>]+\?[^\s"<>]+', '[URL with query omitted]', line))
    extracted = '\n\n'.join('## ' + step + '\n' + '\n'.join(lines)
                             for step, lines in excerpts.items() if lines) + '\n'
    excerpt = ROOT / (name + '-excerpts.log')
    excerpt.write_text(extracted)
    entry['excerptSha256'] = hashlib.sha256(excerpt.read_bytes()).hexdigest()
    ui = entry['steps'].get('Test desktop UI', {})
    if ui.get('conclusion') == 'success':
        assert ui['passedScenarios'] == ui['reportedPassedScenarios']
    result['platforms'][name] = entry

assert set(result['platforms']) == PLATFORMS
source_hashes = {}
for path in SOURCES:
    data = subprocess.check_output(['git', 'show', SOURCE + ':' + path], cwd='/workspace/pureTV')
    source_hashes[path] = {'sourceCommit':SOURCE, 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest()}
result['frozenSourceFiles'] = source_hashes
config = json.loads(subprocess.check_output(
    ['git', 'show', SOURCE + ':desktop/src-tauri/tauri.conf.json'], cwd='/workspace/pureTV'))
assert config['version'] == '0.5.6'
result['frozenMacOSSigningConfiguration'] = {
    'signingIdentity':config['bundle']['macOS']['signingIdentity'],
    'meaning':'ad-hoc' if config['bundle']['macOS']['signingIdentity'] == '-' else 'other',
    'source':'desktop/src-tauri/tauri.conf.json at ' + SOURCE,
}
result['extractionScripts'] = {filename:hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
                               for filename in ('audit-ci.py', 'summarize-ci.py')}
result['totalRawLogBytes'] = sum(item['logBytes'] for item in result['platforms'].values())
(ROOT / 'final-summary.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'runId':RUN, 'conclusion':run['conclusion'], 'platforms':{
    name:{'jobId':item['jobId'], 'logBytes':item['logBytes'], 'steps':item['steps']}
    for name,item in result['platforms'].items()}}, ensure_ascii=False, indent=2))
