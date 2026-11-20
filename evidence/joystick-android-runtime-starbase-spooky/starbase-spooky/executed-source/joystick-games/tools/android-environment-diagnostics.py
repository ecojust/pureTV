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
import stat
import struct
import subprocess
import sys
import time

INTERVAL_SECONDS = 5
MAX_SAMPLES = 540
MAX_LOG_BYTES = 2 * 1024 * 1024
MAX_SAMPLE_BYTES = 32 * 1024
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
CRASH_DATABASE = re.compile(r'emu-crash-[0-9]+(?:\.[0-9]+){2,3}\.db\Z')
CRASH_FILE = re.compile(r'[a-fA-F0-9-]{16,64}\.(?:dmp|meta)\Z')
MAX_CRASH_FILE_BYTES = 16 * 1024 * 1024
MAX_CRASH_TOTAL_BYTES = 32 * 1024 * 1024
MAX_CRASH_FILES = 32
PROCESS_LIMIT_NAMES = ('Max address space', 'Max data size', 'Max resident set', 'Max cpu time',
                       'Max core file size', 'Max locked memory', 'Max processes', 'Max open files')
MAX_CGROUP_ANCESTORS = 8


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
        self.process_cgroups = {}

    def limits(self, path):
        text, error = bounded_text(path / 'limits', 16384)
        if error:
            return {'status': 'unavailable', 'error': error}
        values = {}
        for line in text.splitlines():
            for name in PROCESS_LIMIT_NAMES:
                if line.startswith(name + ' '):
                    fields = line[len(name):].split()
                    if len(fields) in (2, 3) and all(re.fullmatch(r'[0-9]+|unlimited', x) for x in fields[:2]) and (len(fields) == 2 or fields[2] in ('bytes', 'seconds', 'processes', 'files')):
                        values[name] = {'soft': fields[0], 'hard': fields[1], 'unit': fields[2] if len(fields) == 3 else None}
        return {'status': 'read', 'values': values}

    def cgroup_ancestors(self, directory):
        root = self.cgroup_root.resolve()
        directory = directory.resolve()
        if not directory.is_relative_to(root):
            return {'status': 'unavailable', 'reason': 'CgroupPathOutsideRoot'}
        paths = [directory]
        while paths[-1] != root:
            paths.append(paths[-1].parent)
        selected = list(enumerate(paths))
        omitted = max(0, len(selected) - MAX_CGROUP_ANCESTORS)
        if omitted:
            selected = selected[:MAX_CGROUP_ANCESTORS - 1] + [selected[-1]]
        groups = []
        for depth, path in selected:
            relative = path.relative_to(root).as_posix()
            identity = '/' if relative == '.' else '/' + relative
            group = {'depth': depth, 'namespaceRoot': path == root,
                     'pathSha256': hashlib.sha256(identity.encode()).hexdigest(), 'files': {}}
            for name in CGROUP_FILES + ('memory.high', 'memory.oom.group'):
                text, error = bounded_text(path / name, 4096)
                if error:
                    value = {'status': 'unavailable', 'error': error}
                elif name in ('memory.events', 'memory.events.local'):
                    values = {}
                    for line in text.splitlines():
                        fields = line.split()
                        if len(fields) == 2 and fields[0] in {'low', 'high', 'max', 'oom', 'oom_kill', 'oom_group_kill', 'sock_throttled'} and fields[1].isdigit():
                            values[fields[0]] = int(fields[1])
                    value = {'status': 'read', 'fields': values}
                elif re.fullmatch(r'(?:[0-9]+|max)\s*', text):
                    value = {'status': 'read', 'value': text.strip()}
                else:
                    value = {'status': 'unavailable', 'reason': 'UnexpectedCounterFormat'}
                group['files'][name] = value
            groups.append(group)
        return {'status': 'sampled', 'groups': groups, 'omittedMiddleAncestors': omitted,
                'pathNamesRecorded': False, 'maximumGroups': MAX_CGROUP_ANCESTORS}

    def process_cgroup(self, path, key):
        text, error = bounded_text(path / 'cgroup', 16384)
        if error:
            return {'status': 'unavailable', 'error': error}
        memberships = [line.split(':', 2)[2] for line in text.splitlines() if line.startswith('0::')]
        if len(memberships) != 1:
            return {'status': 'unavailable', 'reason': 'UnifiedCgroupMembershipUnavailable'}
        relative = Path(memberships[0].lstrip('/'))
        if '..' in relative.parts or len(relative.parts) > 64:
            return {'status': 'unavailable', 'reason': 'UnsafeCgroupMembership'}
        directory = (self.cgroup_root / relative).resolve()
        if not directory.is_relative_to(self.cgroup_root.resolve()):
            return {'status': 'unavailable', 'reason': 'CgroupPathOutsideRoot'}
        if key in self.process_cgroups or len(self.process_cgroups) < MAX_PROCESSES:
            self.process_cgroups[key] = directory
        return self.cgroup_ancestors(directory)

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
        boot, _ = bounded_text(self.proc_root / 'stat')
        boot_match = re.search(r'^btime ([0-9]+)$', boot or '', re.M)
        boot_time = int(boot_match[1]) if boot_match else None
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
                    if boot_time is not None:
                        entry['startTimeEpochSeconds'] = boot_time + starttime / os.sysconf('SC_CLK_TCK')
                    if fields[0] == 'Z' and len(fields) > 49 and fields[49].isdigit():
                        entry['observedZombieWaitStatus'] = int(fields[49])
                        entry['observedZombieWaitStatusScope'] = 'Kernel proc/stat field 52; not a wait() result owned by this wrapper'
                except (ValueError, IndexError):
                    starttime = None
                    entry['statError'] = {'type': 'UnexpectedProcStatFormat'}
            entry['memory'] = {'error': status_error} if status_error else numeric_fields(status_text, PROCESS_KEYS)
            entry['limits'] = self.limits(path)
            entry['cgroupAncestors'] = self.process_cgroup(path, (pid, starttime))
            found[(pid, starttime)] = entry
        # Only absence from proc is called gone; read failures or PID reuse stay explicit.
        gone = []
        for (pid, started), old in self.previous.items():
            if (pid, started) not in found:
                exists = (self.proc_root / str(pid)).exists()
                gone.append({'pid': pid, 'starttimeTicks': started, 'observation': 'not_observed' if exists else 'gone',
                             'exitCode': None, 'cause': 'unknown'})
                if (pid, started) in self.process_cgroups:
                    gone[-1]['cgroupAfterDisappearance'] = self.cgroup_ancestors(self.process_cgroups[(pid, started)])
        self.previous = found
        return {'status': 'sampled', 'observed': list(found.values()), 'gone': gone,
                'scanTruncated': truncated, 'exitCode': None, 'exitCodeReason': 'EmulatorIsNotAnOwnedChild'}

    def sample(self):
        return {'at': now(), 'memory': self.memory(), 'cgroup': self.cgroup(), 'emulator': self.processes()}


def minidump_metadata(data):
    """Decode only fixed numeric fields and module basenames, never memory/annotations."""
    assert len(data) >= 32 and data[:4] == b'MDMP'
    def read(offset, size):
        assert type(offset) is int and 0 <= offset <= len(data) and 0 <= size <= len(data) - offset
        return data[offset:offset + size]
    def u32(offset):
        return struct.unpack('<I', read(offset, 4))[0]
    def u64(offset):
        return struct.unpack('<Q', read(offset, 8))[0]
    count, directory = u32(8), u32(12)
    assert 0 < count <= 128
    streams = {}
    for index in range(count):
        kind, size, offset = struct.unpack('<III', read(directory + index * 12, 12))
        assert kind not in streams
        read(offset, size)
        streams[kind] = (offset, size)
    result = {'format': 'minidump', 'timestamp': u32(20), 'streamTypes': sorted(streams),
              'memoryStreamsCopied': False, 'annotationsCopied': False, 'commandLinesCopied': False}
    if 15 in streams:
        offset, size = streams[15]
        assert size >= 24 and 24 <= u32(offset) <= size
        flags = u32(offset + 4)
        if flags & 1:
            result['processId'] = u32(offset + 8)
        if flags & 2:
            result['processCreateTime'] = u32(offset + 12)
    if 6 in streams:
        offset, size = streams[6]
        assert size >= 168 and u32(offset + 32) <= 15
        result['exception'] = {'threadId': u32(offset), 'code': u32(offset + 8),
                               'flags': u32(offset + 12), 'address': u64(offset + 24)}
    if 7 in streams:
        offset, size = streams[7]
        assert size >= 32
        result['system'] = {'processorArchitecture': struct.unpack('<H', read(offset, 2))[0],
                            'processorCount': read(offset + 6, 1)[0],
                            'majorVersion': u32(offset + 8), 'minorVersion': u32(offset + 12),
                            'buildNumber': u32(offset + 16), 'platformId': u32(offset + 20)}
    if 4 in streams:
        offset, size = streams[4]
        assert size >= 4
        modules = u32(offset)
        assert modules <= 512 and 4 + modules * 108 <= size
        retained = []
        exception_address = result.get('exception', {}).get('address')
        for index in range(modules):
            item = offset + 4 + index * 108
            base, length, name_offset = u64(item), u32(item + 8), u32(item + 20)
            name_bytes = u32(name_offset)
            assert name_bytes <= 1024 and name_bytes % 2 == 0
            name = read(name_offset + 4, name_bytes).decode('utf-16-le').replace('\\', '/').rsplit('/', 1)[-1]
            if not re.fullmatch(r'[A-Za-z0-9_.+-]{1,160}', name):
                name = 'name-omitted'
            contains = exception_address is not None and base <= exception_address < base + length
            if contains or len(retained) < 32:
                retained.append({'basename': name, 'baseAddress': base, 'imageBytes': length,
                                 'containsExceptionAddress': contains})
        result['modules'] = retained
        result['moduleCount'] = modules
    return result


class CrashEvidence:
    """Inspect only emulator crash databases; raw dump bytes never leave this process."""
    def __init__(self, root=Path('/tmp/android-runner')):
        self.root = Path(root)
        self.identities = {}

    def remember(self, sample):
        for process in (sample.get('emulator') or {}).get('observed', []):
            if len(self.identities) < MAX_PROCESSES:
                key = (process.get('pid'), process.get('starttimeTicks'))
                self.identities[key] = process.get('startTimeEpochSeconds')

    def collect(self):
        report = {'at': now(), 'scope': 'Current observed emulator PID and start time only',
                  'rawDatabaseCopied': False, 'rawMemoryCopied': False, 'environmentCopied': False,
                  'commandArgumentsCopied': False, 'rootCauseProven': False, 'files': [],
                  'limits': {'files': MAX_CRASH_FILES, 'perFileBytes': MAX_CRASH_FILE_BYTES,
                             'totalReadBytes': MAX_CRASH_TOTAL_BYTES, 'wallSeconds': 3},
                  'bytesRead': 0, 'truncated': False, 'omittedReasons': {}}
        try:
            if any(path.is_symlink() for path in (self.root, *self.root.parents)):
                return dict(report, status='unavailable', reason='SymlinkCrashRoot')
            databases = []
            with os.scandir(self.root) as entries:
                for index, entry in enumerate(entries):
                    if index >= 64:
                        report['truncated'] = True
                        break
                    if CRASH_DATABASE.fullmatch(entry.name) and not entry.is_symlink():
                        databases.append(Path(entry.path))
            deadline = time.monotonic() + 3
            for database in databases[:8]:
                if not database.is_dir():
                    continue
                for bucket in ('new', 'pending', 'completed'):
                    directory = database / bucket
                    if directory.is_symlink() or not directory.is_dir():
                        continue
                    with os.scandir(directory) as files:
                        for index, entry in enumerate(files):
                            if index >= 64 or len(report['files']) >= MAX_CRASH_FILES or time.monotonic() >= deadline:
                                report['truncated'] = True
                                break
                            if not CRASH_FILE.fullmatch(entry.name) or entry.is_symlink() or not entry.is_file(follow_symlinks=False):
                                continue
                            item = {'path': database.name + '/' + bucket + '/' + entry.name}
                            report['files'].append(item)
                            fd = None
                            try:
                                fd = os.open(entry.path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
                                assert Path('/proc/self/fd/' + str(fd)).resolve().is_relative_to(self.root.resolve())
                                before = os.fstat(fd)
                                if not stat.S_ISREG(before.st_mode):
                                    item.update(status='omitted', reason='NotRegularFile')
                                    continue
                                item.update(bytes=before.st_size, modifiedAtEpoch=before.st_mtime)
                                if before.st_size > MAX_CRASH_FILE_BYTES or report['bytesRead'] + before.st_size > MAX_CRASH_TOTAL_BYTES:
                                    item.update(status='omitted', reason='ReadBudgetExceeded')
                                    report['truncated'] = True
                                    continue
                                if not entry.name.endswith('.dmp'):
                                    item.update(status='metadata-only', reason='NoRawDatabaseOrAnnotationExport')
                                    continue
                                chunks = []
                                remaining = before.st_size
                                while remaining and time.monotonic() < deadline:
                                    block = os.read(fd, min(65536, remaining))
                                    if not block:
                                        break
                                    chunks.append(block)
                                    remaining -= len(block)
                                    report['bytesRead'] += len(block)
                                after = os.fstat(fd)
                                if remaining or (before.st_ino, before.st_size, before.st_mtime_ns) != (after.st_ino, after.st_size, after.st_mtime_ns):
                                    item.update(status='omitted', reason='ReadIncompleteOrFileChanged')
                                    continue
                                data = b''.join(chunks)
                                metadata = minidump_metadata(data)
                                candidates = [(key, started) for key, started in self.identities.items()
                                              if key[0] == metadata.get('processId') and started is not None]
                                associated = len(candidates) == 1 and candidates[0][1] - 2 <= metadata['timestamp'] <= time.time() + 2
                                if associated and 'processCreateTime' in metadata:
                                    associated = abs(candidates[0][1] - metadata['processCreateTime']) <= 2
                                if not associated:
                                    item.update(status='omitted', reason='NotBoundToCurrentObservedEmulator')
                                    continue
                                item.update(status='bound-minidump-metadata', sha256=hashlib.sha256(data).hexdigest(),
                                            observedPid=candidates[0][0][0], observedStarttimeTicks=candidates[0][0][1],
                                            metadata=metadata)
                            except (OSError, ValueError, AssertionError, UnicodeError, struct.error) as error:
                                item.update(status='unavailable', error=error_record(error))
                            finally:
                                if fd is not None:
                                    os.close(fd)
                                if item.get('status') != 'bound-minidump-metadata':
                                    report['files'].pop()
                                    reason = item.get('reason', item.get('error', {}).get('type', 'Unavailable'))
                                    report['omittedReasons'][reason] = report['omittedReasons'].get(reason, 0) + 1
            return dict(report, status='sampled')
        except OSError as error:
            return dict(report, status='unavailable', error=error_record(error))


def kernel_oom_snapshot():
    """Read and filter kernel output; never save the unfiltered log or command arguments."""
    result = {'at': now(), 'method': 'sudo -n dmesg (OOM/kill lines and numeric emulator faults only)',
              'lines': [], 'emulatorFaults': []}
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
                    fault = re.search(r'(?P<name>qemu-system-[A-Za-z0-9_+-]+|emulator[A-Za-z0-9_+-]*)\[(?P<pid>[0-9]+)\]:? '
                                      r'(?P<kind>segfault at [0-9a-fA-F]+|general protection fault) '
                                      r'ip[: ]+(?P<ip>[0-9a-fA-F]+) sp[: ]+(?P<sp>[0-9a-fA-F]+) error[: ]+(?P<error>[0-9a-fA-F]+)', line)
                    if fault and len(result['emulatorFaults']) < 32:
                        result['emulatorFaults'].append({'executableName': fault['name'], 'pid': int(fault['pid']),
                                                        'kind': fault['kind'], 'instructionPointer': int(fault['ip'], 16),
                                                        'stackPointer': int(fault['sp'], 16), 'errorCode': int(fault['error'], 16)})
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


def oomd_event(raw):
    """Keep numeric journal fields and hashes, never arbitrary message/path text."""
    try:
        event = json.loads(raw)
    except (ValueError, UnicodeError):
        return None
    if not isinstance(event, dict) or (event.get('_SYSTEMD_UNIT') != 'systemd-oomd.service'
                                      and event.get('SYSLOG_IDENTIFIER') != 'systemd-oomd'):
        return None
    message = event.get('MESSAGE')
    if not isinstance(message, str):
        return None
    lowered = message.lower()
    kind = 'kill' if re.search(r'\bkill(?:ed|ing)?\b', lowered) else 'pressure' if 'pressure' in lowered else 'swap' if 'swap' in lowered else 'other'
    result = {'kind': kind, 'messageSha256': hashlib.sha256(message.encode()).hexdigest()}
    for source, target in [('__REALTIME_TIMESTAMP', 'realtimeMicroseconds'), ('_PID', 'journalProcessId')]:
        value = event.get(source)
        result[target] = int(value) if isinstance(value, str) and re.fullmatch(r'[0-9]{1,20}', value) else None
    group = re.search(r'\bKill(?:ed|ing)\s+[\'\"]?(/[^\s\'\"]+)', message)
    if group and len(group[1]) <= 4096:
        result['reportedCgroupPathSha256'] = hashlib.sha256(group[1].encode()).hexdigest()
    return result


def oomd_snapshot(since_epoch):
    assert type(since_epoch) is int and since_epoch >= 0
    result = {'at': now(), 'sinceEpochSeconds': since_epoch, 'events': [],
              'method': 'Read-only systemd-oomd journal numeric/hash summary',
              'rawMessagesRecorded': False, 'rootCauseProven': False}
    command = ['sudo', '-n', 'journalctl', '--no-pager', '--quiet', '-o', 'json',
               '-u', 'systemd-oomd.service', '--since=@' + str(since_epoch)]
    try:
        child = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError as error:
        return dict(result, status='unavailable', error=error_record(error))
    selector = selectors.DefaultSelector()
    selector.register(child.stdout, selectors.EVENT_READ, 'stdout')
    selector.register(child.stderr, selectors.EVENT_READ, 'stderr')
    started, total, omitted = time.monotonic(), 0, 0
    pending, stderr = b'', bytearray()
    limited, dropping = False, False
    try:
        while selector.get_map():
            if time.monotonic() - started >= 3 or total >= 256 * 1024:
                limited = True
                child.terminate()
                break
            for key, _ in selector.select(.05):
                data = os.read(key.fileobj.fileno(), min(16384, 256 * 1024 - total))
                if not data:
                    selector.unregister(key.fileobj)
                    continue
                total += len(data)
                if key.data == 'stderr':
                    stderr.extend(data[:max(0, 1024 - len(stderr))])
                    continue
                for part in data.splitlines(keepends=True):
                    complete = part.endswith(b'\n')
                    if not dropping:
                        pending += part
                        if len(pending) > 32768:
                            pending, dropping = b'', True
                            omitted += 1
                    if complete:
                        event = None if dropping else oomd_event(pending)
                        if event:
                            if len(result['events']) < 32:
                                result['events'].append(event)
                            else:
                                omitted += 1
                        pending, dropping = b'', False
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
                  captureLimited=limited, unfilteredBytesRead=total, omittedEvents=omitted,
                  stderrBytesRetained=len(stderr), stderrSha256=hashlib.sha256(stderr).hexdigest(),
                  permissionDenied=any(word in stderr.lower() for word in (b'permission denied', b'password is required', b'not allowed')))
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
                kernel_reader=kernel_oom_snapshot, crash_root=Path('/tmp/android-runner'),
                oomd_reader=oomd_snapshot):
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
    crashes = CrashEvidence(crash_root)
    log = BoundedLog(output / 'samples.jsonl', log_budget)
    signals = []
    previous_handlers = {}
    child = None
    forwarded_at = None
    code = None
    sampled = 0
    journal_since = int(time.time())

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
        for process in before.get('emulator', {}).get('observed', []):
            stamp = process.get('startTimeEpochSeconds')
            if isinstance(stamp, (int, float)) and 0 <= stamp <= journal_since:
                journal_since = min(journal_since, int(stamp))
        crashes.remember(before)
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
                crashes.remember(state)
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
        crashes.remember(final)
        diagnostic(lambda: log.append(dict(final, phase='after-child')), False)
        sampled += 1
        diagnostic(log.close, None)
        report['kernelAfter'] = diagnostic(kernel_reader, {'status': 'unavailable'})
        report['systemdOomdAfter'] = diagnostic(lambda: oomd_reader(journal_since), {'status': 'unavailable'})
        def write_crashes():
            value = crashes.collect()
            raw = (json.dumps(value, ensure_ascii=True, indent=2) + '\n').encode()
            while len(raw) > MAX_REPORT_BYTES and value.get('files'):
                value['files'].pop()
                value['truncated'] = True
                value['summaryBudgetOmittedFiles'] = value.get('summaryBudgetOmittedFiles', 0) + 1
                raw = (json.dumps(value, ensure_ascii=True, indent=2) + '\n').encode()
            assert len(raw) <= MAX_REPORT_BYTES
            name = 'crash-report.json'
            (output / name).write_bytes(raw)
            return {'path': name, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
                    'status': value['status'], 'rawDatabaseCopied': False, 'rawMemoryCopied': False}
        report['crashEvidence'] = diagnostic(write_crashes, {'status': 'unavailable'})
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
