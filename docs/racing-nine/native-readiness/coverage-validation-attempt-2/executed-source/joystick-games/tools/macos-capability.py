#!/usr/bin/env python3
"""Observe a frozen independent WKWebView probe; never open or modify a game."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import platform
import plistlib
import re
import subprocess
import tempfile
import traceback

ROOT = Path(__file__).resolve().parents[2]
PROBE = ROOT / 'joystick-games/shared/macos/tools/webgl-probe.swift'
SYSCTL_KEYS = ('hw.machine', 'machdep.cpu.brand_string', 'sysctl.proc_translated', 'hw.optional.arm64')


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def zero_or_missing(observation, key):
    if observation['returncode'] == 0:
        return observation['stdout'].strip() == '0' and not observation['stderr'].strip()
    return observation['returncode'] == 1 and not observation['stdout'].strip() and observation['stderr'].strip() == "sysctl: unknown oid '" + key + "'"


def native_intel(machine, observations):
    hw, cpu = observations['hw.machine'], observations['machdep.cpu.brand_string']
    return machine == 'x86_64' and hw['returncode'] == cpu['returncode'] == 0 and hw['stdout'].strip() == 'x86_64' and 'Intel' in cpu['stdout'] and not hw['stderr'].strip() and not cpu['stderr'].strip() and all(zero_or_missing(observations[key], key) for key in SYSCTL_KEYS[2:])


def select_job(jobs, run, attempt, source, runner_name, runner_kind, batch):
    selected = [job for job in jobs if job.get('runner_name') == runner_name and job.get('status') == 'in_progress' and job.get('name', '').startswith('verify (' + batch + ',') and job.get('name', '').endswith(', ' + runner_kind + ')')]
    assert len(selected) == 1, 'Cannot identify exactly one current verification job'
    job = selected[0]
    assert type(job['id']) is int and job['id'] > 0
    assert job['run_id'] == run and job['run_attempt'] == attempt and job['head_sha'] == source
    assert runner_kind in job['labels']
    return job


def command(argv, output, name, timeout=180, required=True):
    timed_out = False
    try:
        result = subprocess.run(list(map(str, argv)), capture_output=True, timeout=timeout)
        stdout, stderr, code = result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired as error:
        stdout, stderr, code, timed_out = error.stdout or b'', error.stderr or b'', None, True
    (output / (name + '-stdout.log')).write_bytes(stdout)
    (output / (name + '-stderr.log')).write_bytes(stderr)
    record = {'command': list(map(str, argv)), 'returncode': code,
              'stdout': stdout.decode('utf-8', errors='replace'), 'stderr': stderr.decode('utf-8', errors='replace')}
    if timed_out: record['timedOut'] = True
    (output / (name + '-command.json')).write_text(json.dumps(record, indent=2) + '\n')
    assert not timed_out, name + ' timed out; original stdout/stderr retained'
    if required: assert code == 0, name + ' failed; original stdout/stderr retained'
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game', required=True)
    parser.add_argument('--phase', choices=['before', 'after'], required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=False)
    report = {'schemaVersion': 1, 'status': 'running', 'game': args.game, 'phase': args.phase,
              'startedAt': now(), 'gamesOpened': False, 'gameAssetsChanged': False,
              'binaryIncluded': False, 'binaryDisposition': 'Temporary compiled probe removed after observation; exact binary SHA and executed source retained',
              'executedSources': {}, 'sourceHashes': {}}
    try:
        assert platform.system() == 'Darwin', 'This observation requires a real macOS runner'
        source = os.environ.get('ARTIFACT_SOURCE_COMMIT', os.environ['GITHUB_SHA']); qa_source = os.environ['GITHUB_SHA']
        assert re.fullmatch('[a-f0-9]{40}', source) and re.fullmatch('[a-f0-9]{40}', qa_source)
        run, attempt = int(os.environ['GITHUB_RUN_ID']), int(os.environ['GITHUB_RUN_ATTEMPT'])
        assert run > 0 and attempt > 0 and os.environ['GITHUB_REPOSITORY'] == 'ecojust/pureTV'
        runner, runner_name = os.environ['RUNNER_KIND'], os.environ['RUNNER_NAME']
        assert runner in ['macos-latest', 'macos-15-intel']
        report.update(sourceCommit=source, qaSourceCommit=qa_source, runId=run, runAttempt=attempt, runner=runner, runnerName=runner_name)
        image = {key: os.environ.get(key) for key in ['ImageOS', 'ImageVersion']}
        report['runnerImage'] = {**image, 'unavailableFields': [key for key, value in image.items() if not value]}
        for path, name in [(PROBE, 'executed-webgl-probe.swift'), (Path(__file__).resolve(), 'executed-macos-capability.py')]:
            data = path.read_bytes(); relative = path.relative_to(ROOT).as_posix()
            assert data == subprocess.check_output(['git', '-C', str(ROOT), 'show', qa_source + ':' + relative]), 'Unfrozen capability source: ' + relative
            (out / name).write_bytes(data)
            report['executedSources'][name] = {'bytes': len(data), 'sha256': digest(data)}
            report['sourceHashes'][relative] = digest(data)
        report['probeSourceSha256'] = digest(PROBE.read_bytes())
        jobs = json.loads(command(['gh', 'api', f'repos/ecojust/pureTV/actions/runs/{run}/attempts/{attempt}/jobs?per_page=100'], out, 'original-jobs')['stdout'])
        assert jobs['total_count'] <= len(jobs['jobs']), 'Job selection requires the complete run attempt job list'
        job = select_job(jobs['jobs'], run, attempt, qa_source, runner_name, runner, os.environ['BATCH'])
        report.update(jobId=job['id'], job=job)
        meta = json.loads(args.manifest.read_text())
        assert meta['game'] == args.game and meta['sourceCommit'] == source and meta['committedInputsVerified'] is True
        binaries = [row for name, row in meta['appFiles'].items() if name.startswith('Contents/MacOS/')]
        assert len(binaries) == 1
        report['package'] = {'game': args.game, 'sourceCommit': source, 'binarySha256': binaries[0]['sha256'],
                             'appFilesManifestSha256': digest(json.dumps(meta['appFiles'], sort_keys=True, separators=(',', ':')).encode())}
        observations = {}
        for key in SYSCTL_KEYS:
            row = command(['/usr/sbin/sysctl', '-n', key], out, key, required=False)
            observations[key] = {name: row[name] for name in ['returncode', 'stdout', 'stderr']}
        machine = platform.machine()
        assert machine == ('arm64' if runner == 'macos-latest' else 'x86_64')
        report['host'] = {'processArchitecture': machine, 'hardwareMachine': observations['hw.machine']['stdout'].strip(),
                          'translatedProcess': observations['sysctl.proc_translated']['returncode'] == 0 and observations['sysctl.proc_translated']['stdout'].strip() == '1',
                          'nativeIntelVerified': native_intel(machine, observations), 'sysctlObservations': observations}
        report['systemVersion'] = command(['/usr/bin/sw_vers'], out, 'system-version')['stdout']
        webkit_bytes = Path('/System/Library/Frameworks/WebKit.framework/Resources/Info.plist').read_bytes()
        (out / 'WebKit-Info.plist').write_bytes(webkit_bytes)
        webkit = plistlib.loads(webkit_bytes)
        report['webKitFramework'] = {key: webkit.get(key) for key in ['CFBundleIdentifier', 'CFBundleShortVersionString', 'CFBundleVersion']}
        report['webKitInfoSha256'] = digest(webkit_bytes)
        report['xcodeVersion'] = command(['/usr/bin/xcodebuild', '-version'], out, 'xcode-version')['stdout']
        report['swiftVersion'] = command(['xcrun', 'swiftc', '--version'], out, 'swift-version')['stdout']
        sdk = command(['xcrun', '--sdk', 'macosx', '--show-sdk-path'], out, 'sdk-path')['stdout'].strip()
        report['sdkVersion'] = command(['xcrun', '--sdk', 'macosx', '--show-sdk-version'], out, 'sdk-version')['stdout'].strip()
        with tempfile.TemporaryDirectory(prefix='puretv-native-capability-') as temporary:
            binary = Path(temporary) / 'probe'
            command(['xcrun', 'swiftc', '-swift-version', '5', '-target', machine + '-apple-macos11.0', '-sdk', sdk,
                     '-framework', 'AppKit', '-framework', 'WebKit', PROBE, '-o', binary], out, 'compile-probe')
            command(['/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', binary], out, 'sign-probe')
            report['probeBinarySha256'] = digest(binary.read_bytes())
            result = command([binary, out / 'probe.json'], out, 'probe', timeout=60, required=False)
            report['probeExitCode'] = result['returncode']
            assert result['returncode'] == 0, 'Probe process failed'
            report['probe'] = json.loads((out / 'probe.json').read_text())
            assert report['probe']['status'] == 'complete' and report['probe']['processArchitecture'] == machine, 'Incomplete or wrong-architecture capability observation'
        report['status'] = 'observed'
    except Exception:
        report.update(status='failed', error=traceback.format_exc())
    finally:
        report['finishedAt'] = now()
        (out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: report.get(key) for key in ['status', 'game', 'phase', 'runner', 'jobId']}, sort_keys=True))
    return 0 if report['status'] == 'observed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
