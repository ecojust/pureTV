#!/usr/bin/env python3
"""Bounded, read-only Linux diagnostics around the unchanged Android QA command.

The emulator belongs to the workflow action, not this wrapper. Its exit code is
therefore always unknown here; a missing PID is never labelled an OOM kill.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import selectors
import signal
import subprocess
import sys
import time

INTERVAL_SECONDS = 5
MAX_SAMPLES = 540
MAX_LOG_BYTES = 2 * 1024 * 1024
MAX_SAMPLE_BYTES = 16 * 1024
MAX_PROCESSES = 16
MAX_SCANNED_PIDS = 4096
MAX_SOURCE_BYTES = 64 * 1024
MAX_REPORT_BYTES = 64 * 1024
MEMORY_KEYS = {'MemTotal', 'MemFree', 'MemAvailable', 'Buffers', 'Cached',
               'SwapTotal', 'SwapFree', 'Dirty', 'Writeback', 'AnonPages',
               'Mapped', 'Shmem', 'Slab', 'PageTables', 'CommitLimit', 'Committed_AS'}
PROCESS_KEYS = {'VmRSS', 'VmHWM', 'VmSize', 'Threads'}
CGROUP_FILES = ('memory.events', 'memory.events.local', 'memory.current',
                'memory.max', 'memory.peak', 'memory.swap.current', 'memory.swap.max')
OOM_PATTERN = re.compile(r'\boom\b|oom[-_ ](?:kill|reaper)|out of memory|\bkill(?:ed|ing)?\b', re.I)
EMULATOR_NAME = re.compile(r'(?:emulator(?:64-[a-z0-9_+-]+)?|qemu-system-[a-z0-9_+-]+)\Z')


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def error_record(error):
    # Do not persist arbitrary exception text (which can contain command arguments).
    return {'type': type(error).__name__, 'errno': getattr(error, 'errno', None)}


def bounded_text(path, limit=65536):
    try:
        with path.open('rb') as source:
            data = source.read(limit + 1)
        if len(data) > limit:
            return None, {'type': 'ReadBudgetExceeded', 'limitBytes': limit}
        return data.decode('utf-8', errors='replace'), None
    except OSError as error:
        return None, error_record(error)


def numeric_fields(text, allowed):
    result = {}
    for line in text.splitlines():
        key, separator, value = line.partition(':')
        if separator and key in allowed:
            parts = value.split()
            if parts and parts[0].isdigit() and (len(parts) == 1 or parts[1:] == ['kB']):
                result[key] = {'value': int(parts[0]), 'unit': 'kB' if len(parts) == 2 else 'count'}
    return result


class ProcSampler:
    def __init__(self, proc_root=Path('/proc'), cgroup_root=Path('/sys/fs/cgroup')):
        self.proc_root = Path(proc_root)
        self.cgroup_root = Path(cgroup_root)
        self.previous = {}

    def memory(self):
        text, error = bounded_text(self.proc_root / 'meminfo')
        return {'status': 'unavailable', 'error': error} if error else {'status': 'read', 'fields': numeric_fields(text, MEMORY_KEYS)}

    def cgroup(self):
        text, error = bounded_text(self.proc_root / 'self/cgroup', 16384)
        if error:
            return {'status': 'unavailable', 'error': error}
        memberships = [line.split(':', 2)[2] for line in text.splitlines() if line.startswith('0::')]
        if len(memberships) != 1:
            return {'status': 'unavailable', 'reason': 'UnifiedCgroupMembershipUnavailable'}
        relative = Path(memberships[0].lstrip('/'))
        if '..' in relative.parts:
            return {'status': 'unavailable', 'reason': 'UnsafeCgroupMembership'}
        directory = self.cgroup_root / relative
        try:
            if not directory.resolve().is_relative_to(self.cgroup_root.resolve()):
                return {'status': 'unavailable', 'reason': 'CgroupPathOutsideRoot'}
        except OSError as error:
            return {'status': 'unavailable', 'error': error_record(error)}
        files = {}
        for name in CGROUP_FILES:
            value, failure = bounded_text(directory / name, 4096)
            if failure:
                files[name] = {'status': 'unavailable', 'error': failure}
            elif name in ('memory.events', 'memory.events.local'):
                fields = {}
                for line in value.splitlines():
                    parts = line.split()
                    if len(parts) == 2 and parts[0] in {'low', 'high', 'max', 'oom', 'oom_kill', 'oom_group_kill', 'sock_throttled'} and parts[1].isdigit():
                        fields[parts[0]] = int(parts[1])
                files[name] = {'status': 'read', 'fields': fields}
            elif re.fullmatch(r'(?:[0-9]+|max)\s*', value):
                files[name] = {'status': 'read', 'value': value.strip()}
            else:
                files[name] = {'status': 'unavailable', 'reason': 'UnexpectedCounterFormat'}
        return {'status': 'sampled', 'version': 2, 'files': files}

    def processes(self):
        try:
            paths = sorted((p for p in self.proc_root.iterdir() if p.name.isdecimal()), key=lambda p: int(p.name))
        except OSError as error:
            return {'status': 'unavailable', 'error': error_record(error), 'observed': [], 'gone': [], 'exitCode': None}
        found = {}
        truncated = len(paths) > MAX_SCANNED_PIDS
        for path in paths[:MAX_SCANNED_PIDS]:
            comm, error = bounded_text(path / 'comm', 256)
            if error:
                continue
            name = comm.strip()
            try:
                executable = Path(os.readlink(path / 'exe')).name
            except OSError:
                executable = ''
            if not EMULATOR_NAME.fullmatch(executable or name) and not EMULATOR_NAME.fullmatch(name):
                continue
            if len(found) >= MAX_PROCESSES:
                truncated = True
                break
            pid = int(path.name)
            stat_text, stat_error = bounded_text(path / 'stat', 8192)
            status_text, status_error = bounded_text(path / 'status', 8192)
            entry = {'pid': pid, 'executableName': executable if EMULATOR_NAME.fullmatch(executable) else name,
                     'exitCode': None, 'exitCodeReason': 'EmulatorIsNotAnOwnedChild'}
            if stat_error:
                entry['statError'] = stat_error
                starttime = None
            else:
                fields = stat_text.rsplit(')', 1)[-1].split()
                try:
                    starttime = int(fields[19])
                    entry.update(state=fields[0], parentPid=int(fields[1]), starttimeTicks=starttime, residentPages=int(fields[21]))
                except (ValueError, IndexError):
                    starttime = None
                    entry['statError'] = {'type': 'UnexpectedProcStatFormat'}
            entry['memory'] = {'error': status_error} if status_error else numeric_fields(status_text, PROCESS_KEYS)
            found[(pid, starttime)] = entry
        # Only absence from proc is called gone; read failures or PID reuse stay explicit.
        gone = []
        for (pid, started), old in self.previous.items():
            if (pid, started) not in found:
                exists = (self.proc_root / str(pid)).exists()
                gone.append({'pid': pid, 'starttimeTicks': started, 'observation': 'not_observed' if exists else 'gone',
                             'exitCode': None, 'cause': 'unknown'})
        self.previous = found
        return {'status': 'sampled', 'observed': list(found.values()), 'gone': gone,
                'scanTruncated': truncated, 'exitCode': None, 'exitCodeReason': 'EmulatorIsNotAnOwnedChild'}

    def sample(self):
        return {'at': now(), 'memory': self.memory(), 'cgroup': self.cgroup(), 'emulator': self.processes()}


def kernel_oom_snapshot():
    """Read and filter kernel output; never save the unfiltered log or command arguments."""
    result = {'at': now(), 'method': 'sudo -n dmesg (OOM/kill lines only)', 'lines': []}
    try:
        child = subprocess.Popen(['sudo', '-n', 'dmesg', '--time-format', 'iso'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError as error:
        return dict(result, status='unavailable', error=error_record(error))
    selector = selectors.DefaultSelector()
    selector.register(child.stdout, selectors.EVENT_READ, 'stdout')
    selector.register(child.stderr, selectors.EVENT_READ, 'stderr')
    started = time.monotonic()
    total = 0
    pending = b''
    stderr = b''
    retained = 0
    omitted = 0
    limited = False
    try:
        while selector.get_map():
            if time.monotonic() - started >= 3 or total >= 1024 * 1024:
                limited = True
                child.terminate()
                break
            for key, _ in selector.select(.05):
                data = os.read(key.fileobj.fileno(), min(16384, 1024 * 1024 - total))
                if not data:
                    selector.unregister(key.fileobj)
                    continue
                total += len(data)
                if key.data == 'stderr':
                    stderr = (stderr + data)[:1024]
                    continue
                pending += data
                parts = pending.split(b'\n')
                pending = parts.pop()[-4096:]
                for raw in parts:
                    line = raw[:2048].decode('utf-8', errors='replace')
                    if OOM_PATTERN.search(line):
                        if len(result['lines']) < 32 and retained + len(line.encode()) <= 8192:
                            result['lines'].append(line)
                            retained += len(line.encode())
                        else:
                            omitted += 1
        try:
            code = child.wait(timeout=1)
        except subprocess.TimeoutExpired:
            limited = True
            child.kill()
            code = child.wait(timeout=1)
    finally:
        selector.close()
        child.stdout.close()
        child.stderr.close()
        if child.poll() is None:
            child.kill()
            child.wait(timeout=1)
    result.update(status='read' if code == 0 and not limited else 'unavailable', exitCode=code,
                  stderr=stderr.decode('utf-8', errors='replace'), captureLimited=limited,
                  unfilteredBytesRead=total, matchingLinesOmitted=omitted, rootCauseProven=False)
    return result


class BoundedLog:
    def __init__(self, path, budget):
        self.stream = path.open('xb')
        self.budget = budget
        self.bytes = 0
        self.rows = 0
        self.dropped = 0

    def append(self, value):
        raw = (json.dumps(value, separators=(',', ':'), ensure_ascii=True) + '\n').encode()
        if len(raw) > MAX_SAMPLE_BYTES or self.bytes + len(raw) > self.budget:
            self.dropped += 1
            return False
        self.stream.write(raw)
        self.stream.flush()
        self.bytes += len(raw)
        self.rows += 1
        return True

    def close(self):
        self.stream.close()


def run_wrapper(command, output, *, proc_root=Path('/proc'), cgroup_root=Path('/sys/fs/cgroup'),
                interval=INTERVAL_SECONDS, max_samples=MAX_SAMPLES, log_budget=MAX_LOG_BYTES,
                kernel_reader=kernel_oom_snapshot):
    assert command and 0 < interval <= INTERVAL_SECONDS and 2 <= max_samples <= MAX_SAMPLES
    assert 0 < log_budget <= MAX_LOG_BYTES
    output = Path(output)
    output.mkdir(parents=True, exist_ok=False)
    source = Path(__file__).read_bytes()
    assert len(source) <= MAX_SOURCE_BYTES
    source_name = 'executed-android-environment-diagnostics.py'
    (output / source_name).write_bytes(source)
    report = {'schemaVersion': 1, 'startedAt': now(), 'scope': 'Read-only host diagnostics; not a game acceptance result',
              'source': {'path': source_name, 'bytes': len(source), 'sha256': hashlib.sha256(source).hexdigest()},
              'sampling': {'intervalSeconds': interval, 'maxSamples': max_samples, 'maxLogBytes': log_budget},
              'emulatorExitCode': None, 'emulatorExitCodeReason': 'EmulatorIsNotAnOwnedChild',
              'environmentVariablesDumped': False, 'commandArgumentsRecorded': False, 'rootCauseProven': False,
              'diagnosticErrors': []}
    for key, name, pattern in [('GITHUB_SHA', 'qaSourceSha', r'[a-f0-9]{40}'),
                               ('GITHUB_RUN_ID', 'qaRunId', r'[1-9][0-9]*'),
                               ('GITHUB_RUN_ATTEMPT', 'qaRunAttempt', r'[1-9][0-9]*')]:
        value = os.environ.get(key, '')
        report[name] = value if re.fullmatch(pattern, value) else None
    sampler = ProcSampler(proc_root, cgroup_root)
    log = BoundedLog(output / 'samples.jsonl', log_budget)
    signals = []
    previous_handlers = {}
    child = None
    forwarded_at = None
    code = None
    sampled = 0

    def handle_signal(number, _frame):
        if not signals:
            signals.append(number)

    def diagnostic(call, fallback):
        try:
            return call()
        except Exception as error:
            if len(report['diagnosticErrors']) < 16:
                report['diagnosticErrors'].append(error_record(error))
            return fallback

    try:
        for number in (signal.SIGINT, signal.SIGTERM):
            previous_handlers[number] = signal.signal(number, handle_signal)
        report['kernelBefore'] = diagnostic(kernel_reader, {'status': 'unavailable'})
        before = diagnostic(sampler.sample, {'at': now(), 'status': 'unavailable'})
        diagnostic(lambda: log.append(dict(before, phase='before-child')), False)
        sampled = 1
        if signals:
            raise InterruptedError('Signal received before child launch')
        child = subprocess.Popen(command, start_new_session=True)
        report['childPid'] = child.pid
        next_sample = time.monotonic() + interval
        while child.poll() is None:
            if signals and forwarded_at is None:
                os.killpg(child.pid, signals[0])
                forwarded_at = time.monotonic()
            if forwarded_at is not None and time.monotonic() - forwarded_at >= 5:
                if child.poll() is None:
                    os.killpg(child.pid, signal.SIGKILL)
                report['childRequiredForcedKill'] = True
                break
            if sampled < max_samples - 1 and time.monotonic() >= next_sample:
                state = dict(diagnostic(sampler.sample, {'at': now(), 'status': 'unavailable'}), phase='child-running')
                diagnostic(lambda: log.append(state), False)
                sampled += 1
                next_sample = time.monotonic() + interval
            time.sleep(min(.1, interval))
        code = child.wait(timeout=5)
    except BaseException as error:
        report['wrapperError'] = error_record(error)
        if child is not None:
            if child.poll() is None:
                try:
                    os.killpg(child.pid, signal.SIGTERM)
                    child.wait(timeout=5)
                except (ProcessLookupError, subprocess.TimeoutExpired):
                    if child.poll() is None:
                        os.killpg(child.pid, signal.SIGKILL)
                        child.wait(timeout=5)
            code = child.returncode
    finally:
        final = diagnostic(sampler.sample, {'at': now(), 'status': 'unavailable'})
        diagnostic(lambda: log.append(dict(final, phase='after-child')), False)
        sampled += 1
        diagnostic(log.close, None)
        report['kernelAfter'] = diagnostic(kernel_reader, {'status': 'unavailable'})
        report['childReturnCode'] = code
        report['receivedSignal'] = signals[0] if signals else None
        exit_code = 128 + signals[0] if signals else (128 - code if code is not None and code < 0 else code if code is not None else 1)
        if exit_code == 0 and 'wrapperError' in report:
            exit_code = 1
        report['sampling']['samplesAttempted'] = sampled
        report.update(finishedAt=now(), wrapperExitCode=exit_code, childResultPreserved=code is not None and not signals and 'wrapperError' not in report,
                      log={'path': 'samples.jsonl', 'bytes': log.bytes, 'rows': log.rows, 'rowsOmittedByBudget': log.dropped},
                      finalEmulatorObservation=final.get('emulator'), finalMemoryObservation=final.get('memory'),
                      finalCgroupObservation=final.get('cgroup'))
        try:
            raw = (json.dumps(report, ensure_ascii=True, indent=2) + '\n').encode()
            while len(raw) > MAX_REPORT_BYTES:
                candidates = [report.get(name, {}) for name in ('kernelBefore', 'kernelAfter')]
                candidate = next((value for value in candidates if value.get('lines')), None)
                if candidate is None:
                    raise ValueError('Bounded report exceeds fixed limit')
                candidate['lines'].pop()
                candidate['reportBudgetOmittedLines'] = candidate.get('reportBudgetOmittedLines', 0) + 1
                raw = (json.dumps(report, ensure_ascii=True, indent=2) + '\n').encode()
            (output / 'report.json').write_bytes(raw)
        except Exception as error:
            print('Environment diagnostic report unavailable: ' + type(error).__name__, file=sys.stderr)
            if exit_code == 0:
                exit_code = 1
        finally:
            for number, handler in previous_handlers.items():
                signal.signal(number, handler)
    return exit_code


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('command', nargs=argparse.REMAINDER, help='Existing QA command after --; arguments are not recorded')
    args = p.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        p.error('Existing child QA command is required')
    sys.exit(run_wrapper(command, args.output))


if __name__ == '__main__':
    main()
