#!/usr/bin/env python3
"""Default-off, disposable-runner Pon launcher supervision. Never rebuild an APK."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import signal
import stat
import subprocess
import sys
import time

FLAG = 'SUPERVISE_PON_EMULATOR'
EXPECTED_ARGS = ['-port', '5554', '-avd', 'JoystickGamesValidation', '-no-window',
                 '-memory', '2048', '-gpu', 'swiftshader_indirect', '-noaudio', '-no-boot-anim', '-no-snapshot']
MAX_OUTPUT = 1024 * 1024
MAX_SECONDS = 40 * 60
SOURCE_LIMIT = 128 * 1024
BACKUP_NAME = 'emulator.puretv-original'
SHIM_NAME = 'emulator.puretv-shim.tmp'


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(65536), b''):
            value.update(chunk)
    return value.hexdigest()


def atomic_json(path, value):
    raw = (json.dumps(value, indent=2) + '\n').encode()
    assert len(raw) <= 128 * 1024
    temporary = path.with_name(path.name + '.tmp-' + str(os.getpid()) + '-' + str(time.monotonic_ns()))
    created = False
    try:
        with temporary.open('xb') as stream:
            created = True
            stream.write(raw); stream.flush(); os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if created and temporary.exists(): temporary.unlink()


def enabled(environment=os.environ):
    value = environment.get(FLAG, 'false')
    assert value in ('false', 'true'), 'Invalid supervisor opt-in'
    if value == 'false':
        return False
    assert environment.get('PURETV_DISPOSABLE_EMULATOR') == '1'
    assert environment.get('GITHUB_ACTIONS') == 'true' and environment.get('GAME') == 'ponpoko-kart'
    assert environment.get('ARTIFACT_SOURCE') == '8f283c73f52f857777306eafc88f710262367834'
    assert environment.get('ARTIFACT_RUN') == '44597115244'
    assert environment.get('ARTIFACT_EXPORT') == '4249f5c0ec3053a1dec652a7880a040e1bb143f0'
    assert not environment.get('ARTIFACT_ID') and not environment.get('ARTIFACT_ATTEMPT')
    assert re.fullmatch('[a-f0-9]{40}', environment.get('GITHUB_SHA', ''))
    for name in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT'):
        assert re.fullmatch('[1-9][0-9]*', environment.get(name, ''))
    return True


def process_identity(pid):
    result = {'pid': pid, 'starttimeTicks': None}
    try:
        fields = (Path('/proc') / str(pid) / 'stat').read_text().rsplit(')', 1)[1].split()
        result.update(starttimeTicks=int(fields[19]), parentPid=int(fields[1]), state=fields[0])
    except (OSError, ValueError, IndexError):
        pass
    return result


def owned_supervisor_identity():
    value = process_identity(os.getpid())
    value['executableSha256'] = digest('/proc/self/exe')
    value['commandLineSha256'] = digest('/proc/self/cmdline')
    return value


def matches_supervisor(expected):
    pid = expected.get('pid')
    if type(pid) is not int or pid <= 1 or pid == os.getpid(): return False
    actual = process_identity(pid)
    if actual.get('starttimeTicks') != expected.get('starttimeTicks') or actual.get('starttimeTicks') is None: return False
    try:
        return (digest('/proc/' + str(pid) + '/exe') == expected.get('executableSha256')
                and digest('/proc/' + str(pid) + '/cmdline') == expected.get('commandLineSha256'))
    except OSError:
        return False


def executable_identity(pid, sdk):
    try:
        link = Path('/proc') / str(pid) / 'exe'
        executable = link.resolve(strict=True)
        size = link.stat().st_size
        assert size <= 512 * 1024 * 1024
        return {'basename': executable.name, 'sha256': digest(link), 'bytes': size,
                'insideSdk': executable.is_relative_to(Path(sdk).resolve()),
                'qemuExecutable': executable.name in ('qemu-system-x86_64', 'qemu-system-x86_64-headless')}
    except (OSError, ValueError, AssertionError):
        return None


def run_child(command, executable, output, *, sdk, seconds=MAX_SECONDS, budget=MAX_OUTPUT, forward_output=False):
    """Own the real child and retain its actual wait status, never a guessed QEMU status."""
    assert 0 < seconds <= MAX_SECONDS and 0 < budget <= MAX_OUTPUT
    output = Path(output); output.mkdir(exist_ok=False)
    original_sha = digest(executable)
    argv_hash = hashlib.sha256(b'\0'.join(os.fsencode(x) for x in command) + b'\0').hexdigest()
    started = time.monotonic(); selector = selectors.DefaultSelector()
    streams = {key: (output / (key + '.log')).open('xb') for key in ('stdout', 'stderr')}
    totals = dict.fromkeys(streams, 0); kept = dict.fromkeys(streams, 0)
    hashes = {key: hashlib.sha256() for key in streams}
    handlers = {}; received = []; child = None; intervention = None; signalled_at = None
    report = {'status': 'starting', 'scope': 'Actual owned launcher child; QEMU identity requires observed exec binding',
              'supervisor': owned_supervisor_identity(), 'startedAtEpoch': time.time(),
              'spawnExecutableSha256': original_sha, 'argumentSha256': argv_hash,
              'argv0': command[0], 'arguments': command[1:], 'environmentRecorded': False,
              'originalActionOutputForwarding': forward_output, 'closedForwardStreams': [],
              'executables': [], 'actualQemuExitProven': False, 'qemuExitCode': None, 'rootCauseProven': False}
    def save():
        atomic_json(output / 'report.json', report)
    def handle(number, _frame):
        if not received: received.append(number)
    try:
        for number in (signal.SIGINT, signal.SIGTERM):
            handlers[number] = signal.signal(number, handle)
        if received: raise InterruptedError('Supervisor stopped before child launch')
        child = subprocess.Popen(command, executable=str(executable), stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, start_new_session=True)
        report.update(status='running', child=process_identity(child.pid))
        selector.register(child.stdout, selectors.EVENT_READ, 'stdout')
        selector.register(child.stderr, selectors.EVENT_READ, 'stderr')
        save(); next_identity = 0; last_executable = None; last_save = started
        while selector.get_map() or child.poll() is None:
            current = time.monotonic()
            if current >= next_identity and child.poll() is None:
                # Hash only when the observed executable changes, not every poll.
                try: identity = os.readlink('/proc/' + str(child.pid) + '/exe')
                except OSError: identity = None
                if identity is not None and identity != last_executable:
                    value = executable_identity(child.pid, sdk)
                    proc = process_identity(child.pid)
                    if value and len(report['executables']) < 8:
                        report['executables'].append({'elapsedSeconds': current - started, **proc, **value})
                    last_executable = identity
                next_identity = current + .05
            if (received or current - started >= seconds) and signalled_at is None:
                intervention = 'supervisor-signal' if received else 'supervisor-deadline'
                signalled_at = current
                try: os.killpg(child.pid, received[0] if received else signal.SIGTERM)
                except ProcessLookupError: pass
            if signalled_at is not None and current - signalled_at >= 3:
                try: os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError: pass
            if signalled_at is not None and current - signalled_at >= 5:
                report['inheritedOutputDrainIncomplete'] = bool(selector.get_map())
                break
            for key, _ in selector.select(.02):
                data = os.read(key.fileobj.fileno(), 16384)
                if not data:
                    selector.unregister(key.fileobj); continue
                name = key.data; totals[name] += len(data); hashes[name].update(data)
                retain = data[:max(0, budget - kept[name])]
                streams[name].write(retain); kept[name] += len(retain)
                # Keep the original action's stdout/stderr listeners (including
                # its invalid-argument check). Only archived files are capped.
                if forward_output and name not in report['closedForwardStreams']:
                    try:
                        pending = memoryview(data)
                        while pending:
                            pending = pending[os.write(1 if name == 'stdout' else 2, pending):]
                    except OSError:
                        report['closedForwardStreams'].append(name)
            if current - last_save >= 1:
                report['lastObservedAtEpoch'] = time.time()
                report['launcherReturnCodeObserved'] = child.poll(); save(); last_save = current
        code = child.wait(timeout=2)
        owned = report['child']; observations = report['executables']
        bound_qemu = bool(type(owned.get('starttimeTicks')) is int and observations
                          and observations[-1]['qemuExecutable'] and observations[-1]['insideSdk']
                          and observations[-1]['pid'] == owned['pid']
                          and observations[-1]['starttimeTicks'] == owned['starttimeTicks'])
        report.update(status='completed', returnCode=code, normalExitCode=code if code >= 0 else None,
                      terminationSignal=-code if code < 0 else None, actualQemuExitProven=bound_qemu,
                      qemuExitCode=code if bound_qemu else None,
                      qemuExitScope='Observed same-PID/starttime QEMU exec' if bound_qemu else 'Unknown: no owned QEMU exec was observed; launcher wait is not a descendant exit')
    except BaseException as error:
        report.update(status='supervisor-error', errorType=type(error).__name__)
        raise
    finally:
        if child is not None and child.poll() is None:
            intervention = intervention or 'supervisor-error-cleanup'
            try:
                try: os.killpg(child.pid, signal.SIGTERM); child.wait(timeout=3)
                except (ProcessLookupError, subprocess.TimeoutExpired):
                    if child.poll() is None:
                        os.killpg(child.pid, signal.SIGKILL); child.wait(timeout=2)
            except (OSError, subprocess.TimeoutExpired) as cleanup_error:
                report['cleanupErrorType'] = type(cleanup_error).__name__
                report['childStillRunningAfterCleanupBudget'] = child.poll() is None
        selector.close()
        if child is not None:
            child.stdout.close(); child.stderr.close()
        for stream in streams.values(): stream.close()
        report.update(finishedAtEpoch=time.time(), elapsedSeconds=time.monotonic() - started,
                      receivedSignal=received[0] if received else None, intervention=intervention,
                      bytesRead=totals, bytesRetained=kept, logLimitBytesPerStream=budget,
                      outputTruncated={key: totals[key] > kept[key] for key in streams},
                      outputSha256={key: hashes[key].hexdigest() for key in streams},
                      originalExecutableUnchanged=digest(executable) == original_sha)
        save()
        for number, handler in handlers.items(): signal.signal(number, handler)
    return report


def query(entry, destination):
    # Query stdout/stderr are bounded independently of the long-running capture.
    return run_child([str(entry), '-version'], entry, destination, sdk=entry.parent.parent,
                     seconds=15, budget=65536)


def load_state(output):
    output = Path(output).resolve()
    state = json.loads((output / 'state.json').read_text())
    assert state['output'] == str(output)
    sdk = Path(state['sdk']).resolve(); entry = sdk / 'emulator/emulator'
    assert state['entry'] == str(entry) and state['backup'] == str(entry.with_name(BACKUP_NAME))
    assert state['sourceSha256'] == digest(output / 'executed-supervisor.py')
    return output, state


def restore(output, *, stop=True):
    output, state = load_state(output); entry = Path(state['entry']); backup = Path(state['backup'])
    cleanup_incomplete = False
    if stop and (output / 'launch/report.json').is_file():
        launch = json.loads((output / 'launch/report.json').read_text())
        supervisor = launch.get('supervisor', {})
        if launch.get('status') == 'running' and supervisor.get('pid') != os.getpid():
            actual = process_identity(supervisor['pid'])
            if actual.get('starttimeTicks') == supervisor.get('starttimeTicks') and actual.get('starttimeTicks') is not None:
                assert matches_supervisor(supervisor), 'Refuse to signal an unverified supervisor identity'
                os.kill(supervisor['pid'], signal.SIGTERM)
                until = time.monotonic() + 7
                while time.monotonic() < until and process_identity(supervisor['pid']).get('starttimeTicks') == supervisor['starttimeTicks']:
                    if json.loads((output / 'launch/report.json').read_text()).get('status') != 'running': break
                    time.sleep(.05)
                state['cleanupSignalledOwnedSupervisor'] = True
                cleanup_incomplete = matches_supervisor(supervisor) and json.loads((output / 'launch/report.json').read_text()).get('status') == 'running'
    assert not entry.is_symlink() and entry.is_file(), 'Unexpected SDK entry during restore'
    if digest(entry) == state['original']['sha256']:
        if backup.exists():
            assert not backup.is_symlink() and digest(backup) == state['original']['sha256']
            backup.unlink()
    else:
        assert digest(entry) == state['shimSha256'], 'Refuse to overwrite an unexpected SDK entry'
        assert backup.is_file() and not backup.is_symlink() and digest(backup) == state['original']['sha256']
        assert stat.S_IMODE(backup.stat().st_mode) == state['original']['mode']
        os.replace(backup, entry)
    assert digest(entry) == state['original']['sha256'] and stat.S_IMODE(entry.stat().st_mode) == state['original']['mode']
    temporary = entry.with_name(SHIM_NAME)
    if temporary.exists():
        assert not temporary.is_symlink() and digest(temporary) == state['shimSha256']; temporary.unlink()
    state.update(restored=True, restoredAtEpoch=time.time(), supervisorCleanupIncomplete=cleanup_incomplete)
    atomic_json(output / 'state.json', state)
    assert not cleanup_incomplete, 'SDK restored but supervisor did not finish within cleanup budget'
    return state


def prepare(sdk, output):
    sdk = Path(sdk).resolve(); entry = sdk / 'emulator/emulator'; backup = entry.with_name(BACKUP_NAME)
    assert not entry.parent.is_symlink() and entry.parent.resolve() == sdk / 'emulator'
    assert not entry.is_symlink() and stat.S_ISREG(entry.lstat().st_mode) and entry.stat().st_mode & 0o111
    assert not backup.exists() and not backup.is_symlink() and not entry.with_name(SHIM_NAME).exists() and not entry.with_name(SHIM_NAME).is_symlink(), 'Existing supervisor entry or backup'
    output = Path(output).resolve(); output.mkdir(parents=True, exist_ok=False)
    source = Path(__file__).read_bytes(); assert len(source) < SOURCE_LIMIT
    copied = output / 'executed-supervisor.py'; copied.write_bytes(source)
    wrapper = ('#!' + sys.executable + '\nimport os,sys\nos.execv(' + repr(sys.executable)
               + ',[' + repr(sys.executable) + ',' + repr(str(copied)) + ',"launch","--output",'
               + repr(str(output)) + ',"--",*sys.argv[1:]])\n').encode()
    state = {'schemaVersion': 1, 'status': 'preparing', 'sdk': str(sdk), 'entry': str(entry), 'backup': str(backup),
             'output': str(output), 'sourceSha256': hashlib.sha256(source).hexdigest(),
             'original': {'sha256': digest(entry), 'bytes': entry.stat().st_size, 'mode': stat.S_IMODE(entry.stat().st_mode)},
             'shimSha256': hashlib.sha256(wrapper).hexdigest(), 'expectedArguments': EXPECTED_ARGS,
             'qaSourceSha': os.environ.get('GITHUB_SHA'), 'qaRunId': os.environ.get('GITHUB_RUN_ID'),
             'qaRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT'), 'game': 'ponpoko-kart', 'restored': False}
    atomic_json(output / 'state.json', state)
    try:
        original = query(entry, output / 'original-query')
        assert original['returnCode'] == 0 and original['intervention'] is None and not any(original['outputTruncated'].values())
        version = (output / 'original-query/stdout.log').read_bytes()
        assert b'Android emulator version 37.3.10.0' in version and b'16970787' in version, 'Unexpected actual emulator version'
        assert digest(entry) == state['original']['sha256']
        os.link(entry, backup)
        temporary = entry.with_name(SHIM_NAME)
        with temporary.open('xb') as stream:
            stream.write(wrapper); stream.flush(); os.fsync(stream.fileno())
        os.chmod(temporary, state['original']['mode'])
        os.replace(temporary, entry)
        state['status'] = 'checking-wrapper'; atomic_json(output / 'state.json', state)
        wrapped = query(entry, output / 'wrapped-query')
        assert wrapped['returnCode'] == original['returnCode'] and wrapped['intervention'] is None
        assert not any(wrapped['outputTruncated'].values())
        for name in ('stdout.log', 'stderr.log'):
            assert (output / 'original-query' / name).read_bytes() == (output / 'wrapped-query' / name).read_bytes(), 'Wrapped version query differs'
        assert digest(backup) == state['original']['sha256'] and digest(entry) == state['shimSha256']
        state.update(status='verified', queriesIdentical=True, verifiedAtEpoch=time.time())
        atomic_json(output / 'state.json', state)
        return state
    except BaseException as error:
        state.update(status='failed', errorType=type(error).__name__)
        try: atomic_json(output / 'state.json', state)
        finally: restore(output, stop=False)
        raise


def assert_ready(output):
    output, state = load_state(output)
    assert state['status'] == 'verified' and state.get('queriesIdentical') is True and state['restored'] is False
    assert digest(state['entry']) == state['shimSha256'] and digest(state['backup']) == state['original']['sha256']
    assert state['qaSourceSha'] == os.environ['GITHUB_SHA'] and state['qaRunId'] == os.environ['GITHUB_RUN_ID']
    assert state['qaRunAttempt'] == os.environ['GITHUB_RUN_ATTEMPT']
    return state


def launch(output, arguments):
    assert enabled(), 'Supervisor opt-in disappeared'
    output, state = load_state(output)
    assert digest(state['backup']) == state['original']['sha256'] and digest(state['entry']) == state['shimSha256']
    # Version/other non-AVD queries use the original executable directly with the
    # original argv0. They never create or overwrite an AVD launch observation.
    if arguments in (['-version'], ['-list-avds'], ['-accel-check'], ['-help'], ['-help-all']):
        os.execv(state['backup'], [state['entry'], *arguments])
    assert_ready(output)
    assert arguments == EXPECTED_ARGS, 'Unexpected supervised emulator arguments'
    result = run_child([state['entry'], *arguments], Path(state['backup']), output / 'launch', sdk=state['sdk'], forward_output=True)
    return 128 - result['returnCode'] if result['returnCode'] < 0 else result['returnCode']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['prepare', 'assert-ready', 'launch', 'restore'])
    parser.add_argument('--sdk', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args, extra = parser.parse_known_args()
    assert args.operation == 'launch' or not extra
    if not enabled():
        print(json.dumps({'status': 'disabled', 'sdkChanged': False})); return
    if args.operation == 'prepare':
        assert args.sdk and args.sdk.resolve() == Path(os.environ['ANDROID_HOME']).resolve()
        prepare(args.sdk, args.output)
    elif args.operation == 'restore':
        if (args.output / 'state.json').is_file(): restore(args.output)
    elif args.operation == 'assert-ready':
        assert_ready(args.output)
    else:
        arguments = extra[1:] if extra[:1] == ['--'] else extra
        sys.exit(launch(args.output, arguments))


if __name__ == '__main__':
    main()
