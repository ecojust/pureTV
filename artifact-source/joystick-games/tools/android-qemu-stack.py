#!/usr/bin/env python3
"""Default-off owned-QEMU stack diagnostics. Never produces a core or accepts arbitrary GDB commands."""
from pathlib import Path
import collections
import ctypes
import hashlib
import json
import os
import re
import selectors
import stat
import subprocess
import threading
import time

GDB = Path('/usr/bin/gdb')
QEMU_SHA = 'b7b911bbecea4303624eab82de262550f4d29d389f5f7411de3f586ce0f2f596'
MAX_LINE = 65536
MAX_READ = 2 * 1024 * 1024
MAX_REPORT = 128 * 1024
MAX_THREADS = 4
MAX_FRAMES = 12
MAX_EVENTS = 4
MAX_SECONDS = 300
COMMAND_SECONDS = 3
HANDSHAKE_SECONDS = 8
FINAL_REPORT_RESERVE = 24576
PR_SET_PTRACER = 0x59616D61
SETTINGS = ['pagination off', 'confirm off', 'auto-load off', 'debuginfod enabled off',
            'print frame-arguments none', 'print entry-values no', 'print thread-events off', 'mi-async on']
SIGNAL_POLICIES = ['all nostop noprint pass', 'SIGINT stop print pass', 'SIGTRAP stop print pass', 'SIGSEGV stop print pass']


class Rejected(Exception):
    pass


def require(value, message):
    if not value:
        raise Rejected(message)


def digest(path, limit=64 * 1024 * 1024):
    path = Path(path)
    require(path.stat().st_size <= limit, 'Executable hash byte budget')
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(65536), b''):
            value.update(block)
    return value.hexdigest()


def proc_status(pid):
    require(type(pid) is int and pid > 1, 'Invalid process identity')
    root = Path('/proc') / str(pid)
    fields = (root / 'stat').read_text().rsplit(')', 1)[1].split()
    status = (root / 'status').read_text()
    result = {'pid': pid, 'starttimeTicks': int(fields[19]), 'parentPid': int(fields[1]),
              'state': fields[0],
              'tracerPid': int(next(line.split(':', 1)[1] for line in status.splitlines() if line.startswith('TracerPid:'))),
              'uid': int(next(line.split(':', 1)[1].split()[0] for line in status.splitlines() if line.startswith('Uid:')))}
    again = (root / 'stat').read_text().rsplit(')', 1)[1].split()
    require(int(again[19]) == result['starttimeTicks'], 'Replaced process')
    return result


def proc_identity(pid):
    result = proc_status(pid)
    require(result['state'] != 'Z', 'Exited process')
    executable = Path('/proc') / str(pid) / 'exe'
    result.update(executablePath=str(executable.resolve(strict=True)), executableSha256=digest(executable))
    again = proc_status(pid)
    require(again['starttimeTicks'] == result['starttimeTicks'] and again['state'] != 'Z', 'Exited or replaced process')
    return result


def require_owned(expected, tracer=0):
    require(expected['parentPid'] == os.getpid() and expected['pid'] != os.getpid(), 'Not the current supervisor child')
    actual = proc_identity(expected['pid'])
    for name in ['pid', 'starttimeTicks', 'parentPid', 'executablePath', 'executableSha256', 'uid']:
        require(actual[name] == expected[name], 'Owned identity changed: ' + name)
    require(actual['tracerPid'] == tracer, 'Unexpected tracer')
    return actual


class MIParser:
    """Bounded MI values, without eval or interpreting debugger strings as code."""
    def __init__(self, text):
        require(len(text.encode()) <= MAX_LINE, 'MI line budget')
        self.text = text
        self.at = 0
        self.nodes = 0

    def string(self):
        require(self.text[self.at] == '"', 'Expected MI string')
        self.at += 1
        result = []
        while self.at < len(self.text):
            c = self.text[self.at]
            self.at += 1
            if c == '"':
                return ''.join(result)
            if c == '\\':
                require(self.at < len(self.text), 'Truncated MI escape')
                c = self.text[self.at]
                self.at += 1
                escapes = {'n': '\n', 'r': '\r', 't': '\t', 'b': '\b', 'f': '\f', 'a': '\a', 'v': '\v', '\\': '\\', '"': '"', "'": "'"}
                if c in '01234567':
                    digits = c
                    while self.at < len(self.text) and len(digits) < 3 and self.text[self.at] in '01234567':
                        digits += self.text[self.at]
                        self.at += 1
                    c = chr(int(digits, 8))
                else:
                    require(c in escapes, 'Unknown MI escape')
                    c = escapes[c]
            result.append(c)
            require(len(result) <= 8192, 'MI string budget')
        raise Rejected('Unterminated MI string')

    def key(self):
        match = re.match(r'[A-Za-z][A-Za-z0-9_-]*=', self.text[self.at:])
        require(match, 'Invalid MI key')
        self.at += len(match[0])
        return match[0][:-1]

    def pairs(self, end=None, depth=0):
        result = {}
        while self.at < len(self.text) and (end is None or self.text[self.at] != end):
            key = self.key()
            value = self.value(depth + 1)
            if key in result:
                require(key == 'thread-id', 'Duplicate MI key')
                if not isinstance(result[key], list):
                    result[key] = [result[key]]
                result[key].append(value)
            else:
                result[key] = value
            if self.at < len(self.text) and self.text[self.at] == ',':
                self.at += 1
            else:
                break
        return result

    def value(self, depth):
        self.nodes += 1
        require(depth <= 16 and self.nodes <= 4096 and self.at < len(self.text), 'MI structure budget')
        c = self.text[self.at]
        if c == '"':
            return self.string()
        if c == '{':
            self.at += 1
            result = self.pairs('}', depth)
            require(self.at < len(self.text) and self.text[self.at] == '}', 'Unclosed MI object')
            self.at += 1
            return result
        if c == '[':
            self.at += 1
            result = []
            while self.at < len(self.text) and self.text[self.at] != ']':
                if re.match(r'[A-Za-z][A-Za-z0-9_-]*=', self.text[self.at:]):
                    key = self.key()
                    result.append({key: self.value(depth + 1)})
                else:
                    result.append(self.value(depth + 1))
                if self.at < len(self.text) and self.text[self.at] == ',':
                    self.at += 1
                else:
                    break
            require(self.at < len(self.text) and self.text[self.at] == ']', 'Unclosed MI list')
            self.at += 1
            return result
        raise Rejected('Unsupported MI value')


def parse_record(line):
    match = re.fullmatch(r'(\d*)([\^*=])(\w[\w-]*)(?:,(.*))?', line)
    require(match, 'Unsupported MI record')
    parser = MIParser(match[4] or '')
    value = parser.pairs()
    require(parser.at == len(parser.text), 'Trailing MI data')
    return {'token': match[1], 'kind': match[2], 'class': match[3], 'data': value}


class MIClient:
    """Raw MI is transient: no console, argument, local, environment or stderr text is retained."""
    def __init__(self, command, *, environment=None, command_seconds=COMMAND_SECONDS):
        self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, env=environment, start_new_session=True)
        self.selector = selectors.DefaultSelector()
        for stream in [self.process.stdout, self.process.stderr]:
            self.selector.register(stream, selectors.EVENT_READ)
        self.buffers = {self.process.stdout: b'', self.process.stderr: b''}
        self.pending = collections.deque()
        self.stops = collections.deque()
        self.sequence = 0
        self.command_seconds = command_seconds
        self.read_bytes = 0
        self.cleanup_bytes = 0
        self.raw_sha = hashlib.sha256()
        self.commands = []
        self.protocol_errors = []
        self.closed = False
        self.hold_reaping = False

    def read(self, timeout, cleanup=False):
        if self.pending:
            return self.pending.popleft()
        for key, _ in self.selector.select(timeout):
            stream = key.fileobj
            data = os.read(stream.fileno(), 16384)
            if not data:
                self.selector.unregister(stream)
                continue
            self.read_bytes += len(data)
            self.raw_sha.update(data)
            if cleanup:
                self.cleanup_bytes += len(data)
                require(self.cleanup_bytes <= MAX_LINE, 'MI cleanup byte budget')
            else:
                require(self.read_bytes <= MAX_READ, 'MI capture byte budget')
            if stream is self.process.stderr:
                continue
            self.buffers[stream] += data
            require(len(self.buffers[stream]) <= MAX_LINE, 'MI line budget')
            while b'\n' in self.buffers[stream]:
                raw, self.buffers[stream] = self.buffers[stream].split(b'\n', 1)
                line = raw.decode('utf-8', errors='replace').rstrip('\r')
                if not re.match(r'\d*[\^*=]', line):
                    continue
                try:
                    value = parse_record(line)
                except Rejected:
                    self.protocol_errors.append({'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
                    require(len(self.protocol_errors) <= 4, 'Too many invalid MI records')
                    raise
                self.pending.append(value)
                require(len(self.pending) <= 256, 'MI pending record budget')
                if value['kind'] == '*' and value['class'] == 'stopped':
                    self.stops.append(value['data'])
                    require(len(self.stops) <= 16, 'MI stop budget')
                if value['kind'] == '^' and value['token'].isdigit():
                    number = int(value['token'])
                    if 1 <= number <= len(self.commands):
                        self.commands[number - 1]['resultClass'] = value['class']
        if self.pending:
            return self.pending.popleft()
        return None

    def command(self, value, *, cleanup=False, deadline=None):
        deadline = min(time.monotonic() + self.command_seconds, deadline) if deadline is not None else time.monotonic() + self.command_seconds
        require(time.monotonic() < deadline, 'Diagnostic command window expired')
        self.sequence += 1
        token = str(self.sequence)
        require(len(self.commands) < (256 if cleanup else 240), 'MI command budget')
        entry = {'sequence': self.sequence, 'command': value, 'startedAtEpoch': time.time(), 'cleanup': cleanup}
        self.commands.append(entry)
        self.process.stdin.write((token + value + '\n').encode())
        self.process.stdin.flush()
        try:
            while time.monotonic() < deadline:
                record = self.read(max(0, min(.1, deadline - time.monotonic())), cleanup=cleanup)
                if record and record['kind'] == '^' and record['token'] == token:
                    entry['resultClass'] = record['class']
                    require(record['class'] != 'error', 'GDB command rejected: ' + value.split()[0])
                    return record['data']
                if self.hold_reaping:
                    try:
                        exited = proc_status(self.process.pid)['state'] == 'Z'
                    except FileNotFoundError:
                        exited = True
                else:
                    exited = self.process.poll() is not None
                if exited and not self.pending:
                    raise Rejected('GDB exited before command response')
            raise TimeoutError('GDB command deadline: ' + value.split()[0])
        finally:
            entry['finishedAtEpoch'] = time.time()

    def stop(self, timeout):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self.stops:
                return self.stops.popleft()
            self.read(min(.1, max(0, deadline - time.monotonic())))
        return None

    def summary(self):
        return {'commands': self.commands, 'rawBytesRead': self.read_bytes, 'rawStreamSha256': self.raw_sha.hexdigest(),
                'rawStreamsRetained': False, 'protocolErrors': self.protocol_errors,
                'cleanupBytesRead': self.cleanup_bytes}

    def begin_cleanup(self):
        # Cleanup has a separate byte/command budget; a bad or overlong capture
        # record cannot prevent attempts to use GDB's normal detach protocol.
        self.pending.clear()
        self.stops.clear()
        self.buffers = {stream: b'' for stream in self.buffers}

    def close_pipes(self):
        if self.closed:
            return
        self.selector.close()
        for stream in [self.process.stdin, self.process.stdout, self.process.stderr]:
            stream.close()
        self.closed = True


def symbol(value, limit=200):
    if not isinstance(value, str):
        return None
    return ''.join(c if 32 <= ord(c) < 127 else '?' for c in value)[:limit]


def debugger_command(path):
    return [str(path), '-q', '-nx', '-nh', '--interpreter=mi2',
            '-iex', 'set auto-load off', '-iex', 'set debuginfod enabled off']


def configure_debugger(mi, deadline):
    for setting in SETTINGS:
        mi.command('-gdb-set ' + setting, deadline=deadline)
    for policy in SIGNAL_POLICIES:
        mi.command('-interpreter-exec console "handle ' + policy + '"', deadline=deadline)


def verify_permission_gate(path, test_path, environment=os.environ, *, gdb_path=GDB):
    path = Path(path)
    require(path.is_file() and not path.is_symlink() and path.stat().st_size <= MAX_REPORT, 'Missing bounded permission gate')
    value = json.loads(path.read_text())
    require(value['status'] == 'passed' and value['failures'] == 0 and value['errors'] == 0 and value['skipped'] == 0,
            'Real same-permission ELF gate did not pass')
    required = ['fatal', 'handled', 'external-signals', 'deadline-detach', 'pending-fault-detach',
                'wrong-start', 'constructor-rejection', 'exit-before-start', 'exit-during-attach', 'supervisor-original-wait']
    require(value['realPermissionCases'] == required and value['testsRun'] == len(required), 'Incomplete permission cases')
    for key, name in [('qaSourceSha', 'GITHUB_SHA'), ('qaRunId', 'GITHUB_RUN_ID'), ('qaRunAttempt', 'GITHUB_RUN_ATTEMPT')]:
        require(value[key] == environment[name], 'Permission gate belongs to a different job')
    require(value['runnerName'] == environment['RUNNER_NAME'], 'Permission gate runner mismatch')
    require(value['helperSha256'] == digest(__file__) and value['testSha256'] == digest(test_path), 'Permission gate source mismatch')
    require(value['gdbSha256'] == digest(gdb_path) and value['gdbPath'] == str(Path(gdb_path).resolve()), 'Permission gate tool mismatch')
    require(value['permissionMethod'] == 'same-user-exact-PR_SET_PTRACER' and value['globalSettingsChanged'] is False,
            'Wrong permission method')
    return value


class PreparedDebugger:
    """Keep the exact same-user GDB child unreaped across the owned child's grant/exec window."""
    def __init__(self, output, *, gdb_path=GDB, environment=None):
        self.output = Path(output)
        require(not self.output.exists() and not self.output.is_symlink(), 'Existing debugger preparation output')
        self.output.mkdir(parents=True)
        self.gdb = Path(gdb_path).resolve(strict=True)
        require(stat.S_ISREG(self.gdb.stat().st_mode), 'GDB is not regular')
        self.gdb_sha = digest(self.gdb)
        self.environment = environment or {'PATH': '/usr/bin:/bin', 'LANG': 'C', 'LC_ALL': 'C', 'DEBUGINFOD_URLS': ''}
        self.started = time.monotonic()
        self.mi = None
        self.child = None
        self.adopted = False
        self.grant_succeeded = False
        self.report = {'schemaVersion': 1, 'status': 'preparing', 'sudoUsed': False, 'globalSettingsChanged': False,
                       'PR_SET_PTRACER_ANYUsed': False, 'grantScope': 'One named GDB PID; Linux Yama also permits its descendants',
                       'actualTracerMustBeExactGdbPid': True, 'startedAtEpoch': time.time(), 'grant': None, 'errors': []}
        # Resolve the C function and prebuild all receipt bytes in the parent.
        # The child callback imports nothing, allocates no locks and runs only
        # after both Python and kernel confirm this parent has one thread.
        self.libc = ctypes.CDLL(None, use_errno=True)
        self.prctl = self.libc.prctl
        self.prctl.argtypes = [ctypes.c_int, ctypes.c_ulong, ctypes.c_ulong, ctypes.c_ulong, ctypes.c_ulong]
        self.prctl.restype = ctypes.c_int
        self.failure_receipts = tuple(b'F' + bytes([number]) for number in range(256))
        try:
            policy = Path('/proc/sys/kernel/yama/ptrace_scope')
            self.report['yamaMode'] = int(policy.read_text().strip()) if policy.exists() else None
            require(self.report['yamaMode'] in [None, 0, 1], 'Yama policy does not permit this process-local path')
            self.mi = MIClient(debugger_command(self.gdb), environment=self.environment)
            configure_debugger(self.mi, self.started + HANDSHAKE_SECONDS)
            self.identity = proc_identity(self.mi.process.pid)
            require(self.identity['parentPid'] == os.getpid() and self.identity['uid'] == os.getuid(), 'GDB is not the owned same-user child')
            require(self.identity['executablePath'] == str(self.gdb) and self.identity['executableSha256'] == self.gdb_sha, 'GDB executable mismatch')
            self.report.update(status='prepared', debuggerIdentity=self.identity)
            self.save()
        except Exception as error:
            self.report['errors'].append({'phase': 'prepare', 'type': type(error).__name__})
            self.close()
            raise

    def save(self):
        value = dict(self.report)
        if self.mi:
            value['mi'] = self.mi.summary()
        data = (json.dumps(value, indent=2) + '\n').encode()
        require(len(data) <= MAX_REPORT, 'Preparation report budget')
        temporary = self.output / 'report.tmp'
        temporary.write_bytes(data)
        os.replace(temporary, self.output / 'report.json')

    def validate_debugger(self):
        actual = proc_identity(self.identity['pid'])
        for key in ['pid', 'starttimeTicks', 'parentPid', 'uid', 'executablePath', 'executableSha256']:
            require(actual[key] == self.identity[key], 'Prepared debugger identity changed: ' + key)
        return actual

    def spawn(self, command, executable):
        require(self.child is None and not self.adopted, 'Only one owned child can receive this grant')
        require(threading.active_count() == 1 and len(list(Path('/proc/self/task').iterdir())) == 1,
                'Process-local preexec requires a single-threaded supervisor')
        self.validate_debugger()
        self.mi.hold_reaping = True
        read_fd, write_fd = os.pipe2(os.O_CLOEXEC)
        debugger_pid = self.identity['pid']
        require(type(debugger_pid) is int and debugger_pid > 1 and debugger_pid != os.getpid(), 'Invalid named ptracer')
        call = self.prctl
        failures = self.failure_receipts

        def grant_exact_debugger():
            result = call(PR_SET_PTRACER, debugger_pid, 0, 0, 0)
            error = ctypes.get_errno() if result != 0 else 0
            os.write(write_fd, b'G\x00' if result == 0 else failures[min(error, 255)])
            os.close(write_fd)
            if result != 0:
                os._exit(125)

        try:
            # Same original argv, executable, UID, stdio and session behavior.
            # No GDB poll/wait occurs until the target's actual exec is checked.
            self.validate_debugger()
            self.child = subprocess.Popen(command, executable=str(executable), stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE, start_new_session=True,
                                          preexec_fn=grant_exact_debugger, pass_fds=(write_fd,))
            self.child_identity = proc_status(self.child.pid)
            require(self.child_identity['parentPid'] == os.getpid(), 'Grant child parent mismatch')
            os.close(write_fd)
            write_fd = None
            with selectors.DefaultSelector() as selector:
                selector.register(read_fd, selectors.EVENT_READ)
                require(selector.select(COMMAND_SECONDS), 'Grant receipt deadline')
                receipt = os.read(read_fd, 3)
            require(len(receipt) == 2 and receipt[:1] in [b'G', b'F'], 'Invalid grant receipt')
            self.grant_succeeded = receipt == b'G\x00'
            self.report['grant'] = {'status': 'granted' if self.grant_succeeded else 'rejected',
                                    'errno': receipt[1], 'debuggerPid': debugger_pid,
                                    'debuggerStarttimeTicks': self.identity['starttimeTicks'],
                                    'ownedChildPid': self.child.pid, 'singleThreadPrecondition': True,
                                    'ownedChildStarttimeTicks': self.child_identity['starttimeTicks'],
                                    'debuggerKeptUnreaped': True}
            self.report['status'] = 'grant-written-awaiting-observed-exec' if self.grant_succeeded else 'blocked'
            if not self.grant_succeeded:
                # The child exits 125 before exec. There is no attach command.
                self.mi.hold_reaping = False
            self.save()
            return self.child
        except Exception as error:
            self.report['errors'].append({'phase': 'grant', 'type': type(error).__name__})
            self.report['status'] = 'blocked'
            self.save()
            if self.child is not None:
                # Preserve the real child owner even if its receipt is invalid.
                # No attach is issued; the caller still observes its actual wait.
                return self.child
            self.mi.hold_reaping = False
            raise
        finally:
            if write_fd is not None:
                os.close(write_fd)
            os.close(read_fd)

    def session(self, expected, output, **kwargs):
        require(self.grant_succeeded and self.child is not None and not self.adopted, 'No unique successful grant to adopt')
        require(expected['pid'] == self.child.pid, 'Different child after grant')
        require(expected['starttimeTicks'] == self.child_identity['starttimeTicks'], 'Different child start after grant')
        self.validate_debugger()
        require_owned(expected)
        self.report['observedExecIdentity'] = expected
        self.report['status'] = 'observed-exec'
        self.save()
        session = TraceSession(expected, output, gdb_path=self.gdb, environment=self.environment, prepared=self, **kwargs)
        self.mi.hold_reaping = False
        self.adopted = True
        return session

    def observe_exec_or_exit(self):
        """Release only the GDB PID hold, never reap the original target here."""
        if not self.mi.hold_reaping:
            return True
        require(self.child is not None, 'No grant child')
        state = proc_status(self.child.pid)
        require(state['parentPid'] == os.getpid(), 'Grant child owner changed')
        require(state['starttimeTicks'] == self.child_identity['starttimeTicks'], 'Grant child start changed')
        if state['state'] == 'Z':
            self.report['grantWindowEnded'] = 'original-child-exited-unreaped'
        else:
            actual = proc_identity(self.child.pid)
            require(actual['executablePath'] != str(Path('/proc/self/exe').resolve()), 'Child has not execed')
            self.report['observedExecIdentity'] = actual
            self.report['grantWindowEnded'] = 'actual-owned-exec-observed'
        self.mi.hold_reaping = False
        self.save()
        return True

    def close(self):
        require(not self.adopted, 'The attached session owns debugger cleanup')
        if self.report.get('cleanup', {}).get('confirmed'):
            return True
        if self.mi and self.mi.hold_reaping:
            self.observe_exec_or_exit()
        confirmed = self.mi is None
        if self.mi:
            self.mi.begin_cleanup()
            try:
                self.mi.command('-gdb-exit', cleanup=True)
            except Exception as error:
                self.report['errors'].append({'phase': 'gdb-exit', 'type': type(error).__name__})
                try:
                    self.mi.process.stdin.close()
                except OSError:
                    pass
            try:
                self.mi.process.wait(timeout=COMMAND_SECONDS)
                confirmed = True
                self.mi.close_pipes()
            except subprocess.TimeoutExpired as error:
                self.report['errors'].append({'phase': 'gdb-exit-wait', 'type': type(error).__name__})
        self.report['cleanup'] = {'confirmed': confirmed, 'blindKillSent': False, 'attachCommandEverIssued': False}
        if self.report['status'] != 'blocked':
            self.report['status'] = 'closed' if confirmed else 'blocked'
        self.save()
        return confirmed


class TraceSession:
    """One attachment attempt. Caller must not reap its child until attachment_resolved is true."""
    def __init__(self, expected, output, *, gdb_path=GDB, use_sudo=False, seconds=MAX_SECONDS,
                 environment=None, module_roots=(), prepared=None):
        require(0 < seconds <= MAX_SECONDS, 'Stack diagnostic deadline')
        require(use_sudo is False, 'Only same-user process-local debugging is permitted')
        require_owned(expected)
        self.expected = dict(expected)
        self.output = Path(output)
        require(not self.output.exists() and not self.output.is_symlink(), 'Existing diagnostic output')
        self.output.mkdir(parents=True)
        self.gdb = Path(gdb_path).resolve(strict=True)
        require(stat.S_ISREG(self.gdb.stat().st_mode), 'GDB is not a regular executable')
        self.gdb_sha = digest(self.gdb)
        self.use_sudo = use_sudo
        self.seconds = seconds
        self.environment = environment or {'PATH': '/usr/bin:/bin', 'LANG': 'C', 'LC_ALL': 'C', 'DEBUGINFOD_URLS': ''}
        self.module_roots = [Path(p).resolve() for p in module_roots]
        self.module_hashes = {}
        self.mi = prepared.mi if prepared else None
        self.prepared = prepared
        self.start_called = False
        self.attach_issued = False
        self.attach_token = None
        self.attachment_resolved = False
        self.debugger_pid = None
        self.done = False
        self.started = time.monotonic()
        self.report = {'schemaVersion': 1, 'status': 'preparing', 'scope': 'Debugger-intervened diagnostic, never gameplay acceptance',
                       'expectedOwnedIdentity': self.expected, 'startedAtEpoch': time.time(),
                       'debuggerAttached': False, 'diagnosticIntervened': False, 'sudoUsed': use_sudo,
                       'gdb': {'basename': self.gdb.name, 'sha256': self.gdb_sha, 'bytes': self.gdb.stat().st_size},
                       'limits': {'seconds': seconds, 'events': MAX_EVENTS, 'threadsPerEvent': MAX_THREADS,
                                  'framesPerThread': MAX_FRAMES, 'reportBytes': MAX_REPORT, 'rawReadBytes': MAX_READ},
                       'events': [], 'otherStops': [], 'errors': [], 'coreCreated': False,
                       'rawMemoryRecorded': False, 'environmentRecorded': False, 'frameArgumentsRecorded': False,
                       'localsRecorded': False, 'rootCauseProven': False, 'originalWaitRequiredForTerminalSignal': True}
        self.save()

    def save(self):
        value = dict(self.report)
        value['attachmentResolved'] = self.attachment_resolved
        if self.mi:
            value['mi'] = self.mi.summary()
        data = (json.dumps(value, indent=2) + '\n').encode()
        if len(data) > MAX_REPORT:
            # Keep cleanup/status writable even if an unexpected payload reaches
            # the hard cap. Report the omission; never silently drop frames.
            omitted = sum(len(t.get('frames', [])) for e in self.report['events'] for t in e.get('threads', []))
            self.report['payloadTruncation'] = {'serializedBytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                                               'omittedFrameCount': omitted, 'reason': 'report-hard-limit'}
            self.error('report-budget', Rejected())
            self.report['status'] = 'blocked'
            self.report['events'] = [{'atEpoch': e.get('atEpoch'), 'signal': e.get('signal'),
                                      'terminalCauseProven': False, 'framesOmittedByBudget': True} for e in self.report['events']]
            value = dict(self.report)
            value['attachmentResolved'] = self.attachment_resolved
            if self.mi:
                summary = self.mi.summary()
                summary['commandsOmittedByBudget'] = len(summary['commands'])
                summary['commandsSha256'] = hashlib.sha256(json.dumps(summary['commands']).encode()).hexdigest()
                summary['commands'] = []
                value['mi'] = summary
            data = (json.dumps(value, indent=2) + '\n').encode()
            require(len(data) <= MAX_REPORT, 'Minimal diagnostic report byte budget')
        target = self.output / 'report.json'
        temporary = target.with_suffix('.tmp')
        with temporary.open('wb') as stream:
            stream.write(data)
            stream.flush()
        os.replace(temporary, target)

    def error(self, phase, error):
        if len(self.report['errors']) < 16:
            # Exception messages can contain MI data; keep only the class.
            self.report['errors'].append({'phase': phase, 'type': type(error).__name__, 'atEpoch': time.time()})

    def bind_debugger(self, pid):
        actual = proc_identity(pid)
        require(actual['executablePath'] == str(self.gdb) and actual['executableSha256'] == self.gdb_sha, 'Unexpected tracer executable')
        require(actual['uid'] == os.getuid(), 'Unexpected tracer owner')
        require(actual['parentPid'] == os.getpid(), 'Tracer is not the direct owned debugger child')
        require(actual['pid'] == self.mi.process.pid and actual['starttimeTicks'] == self.gdb_outer['starttimeTicks'],
                'Tracer is not the exact owned GDB process')
        self.debugger_pid = pid
        self.report['actualDebuggerIdentity'] = {k: actual[k] for k in ['pid', 'starttimeTicks', 'parentPid', 'uid', 'executableSha256']}

    def verify_attached(self):
        actual = proc_identity(self.debugger_pid)
        expected = self.report['actualDebuggerIdentity']
        require(all(actual[k] == v for k, v in expected.items()), 'Actual debugger identity changed')
        require(actual['executablePath'] == str(self.gdb), 'Actual debugger path changed')
        return require_owned(self.expected, self.debugger_pid)

    def command(self, value, *, handshake=False):
        return self.mi.command(value, deadline=self.started + (HANDSHAKE_SECONDS if handshake else self.seconds))

    def fits_capture_budget(self):
        value = dict(self.report)
        value['mi'] = self.mi.summary()
        return len((json.dumps(value, indent=2) + '\n').encode()) <= MAX_REPORT - FINAL_REPORT_RESERVE

    def refresh_attachment_resolution(self):
        if self.mi and self.attach_token is not None:
            result = self.mi.commands[self.attach_token - 1].get('resultClass')
            if result in ['done', 'error']:
                self.attachment_resolved = True
                self.report['originalAttachCommandResult'] = result

    def start(self):
        require(not self.start_called, 'A second attachment is forbidden')
        self.start_called = True
        try:
            require_owned(self.expected)
            if self.prepared:
                require(self.prepared.adopted and self.prepared.child.pid == self.expected['pid'], 'Prepared grant ownership mismatch')
                self.prepared.validate_debugger()
                require(self.prepared.gdb_sha == self.gdb_sha, 'Prepared GDB bytes changed')
                self.mi = self.prepared.mi
                self.gdb_outer = self.prepared.identity
                self.report['processLocalGrant'] = self.prepared.report['grant']
            else:
                self.mi = MIClient(debugger_command(self.gdb), environment=self.environment)
                self.gdb_outer = proc_status(self.mi.process.pid)
                configure_debugger(self.mi, self.started + HANDSHAKE_SECONDS)
            require_owned(self.expected)
            self.attach_issued = True
            self.attach_token = self.mi.sequence + 1
            self.report['diagnosticIntervened'] = True
            self.report['status'] = 'attaching'
            self.save()
            self.command('-target-attach ' + str(self.expected['pid']), handshake=True)
            self.attachment_resolved = True
            stopped = self.mi.stop(max(0, min(COMMAND_SECONDS, self.started + HANDSHAKE_SECONDS - time.monotonic())))
            require(stopped is not None, 'No initial attach stop')
            actual = proc_identity(self.expected['pid'])
            self.bind_debugger(actual['tracerPid'])
            require_owned(self.expected, self.debugger_pid)
            self.report.update(status='attached', debuggerAttached=True, attachedAtEpoch=time.time())
            self.report['initialAttachStop'] = {'reason': symbol(stopped.get('reason'), 64),
                                               'signal': symbol(stopped.get('signal-name'), 32),
                                               'threadId': symbol(stopped.get('thread-id'), 32)}
            # No frame query is made before this post-attach ownership check.
            if stopped.get('signal-name') == 'SIGSEGV':
                # A real fault can coincide with attachment. Keep it pending
                # for the bounded tick capture after the handshake, rather than
                # resuming and losing the first stack before it is observed.
                self.mi.stops.appendleft(stopped)
                self.report['initialAttachStop']['captureDeferredToTick'] = True
            else:
                self.command('-exec-continue', handshake=True)
            self.save()
            return True
        except Exception as error:
            self.error('attach', error)
            self.report['status'] = 'blocked'
            self.finish()
            return False

    def maps(self):
        path = Path('/proc') / str(self.expected['pid']) / 'maps'
        with path.open('rb') as stream:
            raw = stream.read(131073)
        require(len(raw) <= 131072, 'Module mapping byte budget')
        result = []
        for line in raw.decode('utf-8', errors='replace').splitlines():
            fields = line.split(None, 5)
            if len(fields) < 6 or 'x' not in fields[1]:
                continue
            start, end = [int(x, 16) for x in fields[0].split('-')]
            result.append((start, end, int(fields[2], 16), fields[5]))
            require(len(result) <= 1024, 'Module mapping count budget')
        return result

    def module(self, pc, mappings):
        for start, end, offset, name in mappings:
            if start <= pc < end:
                path = Path(name)
                sha = None
                if name == self.expected['executablePath']:
                    sha = self.expected['executableSha256']
                elif path.is_absolute():
                    if name not in self.module_hashes and len(self.module_hashes) < 16:
                        try:
                            resolved = path.resolve(strict=True)
                            require(stat.S_ISREG(resolved.stat().st_mode), 'Mapped module is not a regular file')
                            require(any(resolved.is_relative_to(root) for root in self.module_roots), 'Mapped module outside permitted roots')
                            self.module_hashes[name] = digest(resolved)
                        except (OSError, Rejected):
                            self.module_hashes[name] = None
                    sha = self.module_hashes.get(name)
                return {'basename': symbol(path.name, 128), 'fileOffset': hex(pc - start + offset), 'sha256': sha}
        return None

    def capture(self, stop):
        self.verify_attached()
        event = {'atEpoch': time.time(), 'signal': 'SIGSEGV', 'terminalCauseProven': False, 'threads': [], 'captureStatus': 'partial'}
        self.report['events'].append(event)
        response = self.command('-thread-list-ids')
        identifiers = response.get('thread-ids', {}).get('thread-id', [])
        if isinstance(identifiers, str):
            identifiers = [identifiers]
        require(isinstance(identifiers, list) and len(identifiers) <= 256, 'Thread inventory budget')
        require(all(isinstance(x, str) and re.fullmatch('[1-9][0-9]*', x) for x in identifiers), 'Invalid thread identity')
        fault = stop.get('thread-id')
        require(fault in identifiers, 'Faulting thread absent')
        chosen = [fault] + [x for x in sorted(identifiers, key=int) if x != fault]
        event.update(faultingThreadId=fault, totalThreadCount=len(identifiers), omittedThreads=max(0, len(chosen) - MAX_THREADS))
        mappings = self.maps()
        for identifier in chosen[:MAX_THREADS]:
            self.command('-thread-select ' + identifier)
            self.verify_attached()
            response = self.command('-stack-list-frames --no-frame-filters 0 ' + str(MAX_FRAMES - 1))
            frames = response.get('stack', [])
            require(isinstance(frames, list) and len(frames) <= MAX_FRAMES, 'Frame budget')
            safe = []
            event['threads'].append({'id': identifier, 'frames': safe, 'frameLimit': MAX_FRAMES})
            for item in frames:
                frame = item['frame']
                address = frame.get('addr')
                require(isinstance(address, str) and re.fullmatch('0x[0-9a-fA-F]{1,16}', address), 'Invalid frame address')
                safe.append({'level': int(frame['level']), 'address': address,
                             'function': symbol(frame.get('func')), 'module': self.module(int(address, 16), mappings)})
                if not self.fits_capture_budget():
                    safe.pop()
                    event['framesOmittedByBudget'] = True
                    raise Rejected('Frame payload budget, cleanup reserve retained')
        self.command('-thread-select ' + fault)
        self.verify_attached()
        event['captureStatus'] = 'complete'

    def tick(self):
        if self.done or not self.report['debuggerAttached']:
            return
        try:
            if time.monotonic() - self.started >= self.seconds:
                self.report['stopReason'] = 'diagnostic-deadline'
                self.finish()
                return
            self.mi.read(0)
            if not self.mi.stops:
                return
            stop = self.mi.stops.popleft()
            reason = stop.get('reason')
            if reason in ['exited', 'exited-normally', 'exited-signalled']:
                self.report['debuggerExitObservation'] = {'reason': reason, 'signal': symbol(stop.get('signal-name'), 32),
                                                         'exitCode': symbol(stop.get('exit-code'), 32)}
                self.report['stopReason'] = 'inferior-exited'
                self.finish()
                return
            if stop.get('signal-name') == 'SIGSEGV':
                self.capture(stop)
                self.save()
                if len(self.report['events']) >= MAX_EVENTS:
                    self.report['stopReason'] = 'event-budget'
                    self.finish()
                    return
            else:
                require(len(self.report['otherStops']) < 16, 'Other stop budget')
                self.report['otherStops'].append({'reason': symbol(reason, 64), 'signal': symbol(stop.get('signal-name'), 32)})
            # No signal 0, manual signal injection or synthetic interrupt.
            self.command('-exec-continue')
            self.save()
        except Exception as error:
            self.error('capture', error)
            self.report['status'] = 'blocked'
            self.finish()

    def finish(self):
        if self.done:
            return self.report
        cleanup = {'detachCommandResult': None, 'originalTargetUntracedOrExited': False,
                   'debuggerExited': self.mi is None, 'blindKillSent': False, 'artificialInterruptSent': False}
        if self.mi:
            self.mi.begin_cleanup()
            original_exited = False
            try:
                actual = proc_status(self.expected['pid'])
                original_exited = actual['starttimeTicks'] != self.expected['starttimeTicks'] or actual['state'] == 'Z'
            except FileNotFoundError:
                original_exited = True
            except Exception as error:
                self.error('pre-cleanup-identity', error)
            self.refresh_attachment_resolution()
            if self.attach_issued and self.attachment_resolved and original_exited:
                cleanup['detachCommandResult'] = 'not-needed-original-exited'
            elif self.attach_issued:
                try:
                    self.mi.command('-target-detach', cleanup=True)
                    cleanup['detachCommandResult'] = 'done'
                    self.attachment_resolved = True
                except Exception as error:
                    self.error('detach', error)
                    entry = self.mi.commands[-1] if self.mi.commands else {}
                    if entry.get('command') == '-target-detach' and entry.get('resultClass') == 'error':
                        cleanup['detachCommandResult'] = 'error'
                    self.refresh_attachment_resolution()
            try:
                actual = proc_status(self.expected['pid'])
                cleanup['originalTargetUntracedOrExited'] = (actual['starttimeTicks'] != self.expected['starttimeTicks']
                                                             or (actual['tracerPid'] == 0 and actual['state'] not in ['T', 't']))
                cleanup['targetStateAfterCleanup'] = actual['state']
                cleanup['tracerPidAfterCleanup'] = actual['tracerPid']
            except FileNotFoundError:
                cleanup['originalTargetUntracedOrExited'] = True
            except Exception as error:
                self.error('detach-verification', error)
            try:
                self.mi.command('-gdb-exit', cleanup=True)
            except Exception as error:
                self.error('gdb-exit', error)
                # EOF is normal debugger shutdown, never SIGKILL/terminate.
                try:
                    self.mi.process.stdin.close()
                except OSError:
                    pass
            try:
                self.mi.process.wait(timeout=COMMAND_SECONDS)
                cleanup['debuggerExited'] = True
                cleanup['debuggerReturnCode'] = self.mi.process.returncode
                self.attachment_resolved = True
                self.mi.close_pipes()
            except subprocess.TimeoutExpired as error:
                self.error('gdb-exit-wait', error)
            # An exit/EOF can perform the successful detach after an earlier
            # detach error. Recheck the actual target, never infer from exit.
            try:
                actual = proc_status(self.expected['pid'])
                cleanup['originalTargetUntracedOrExited'] = (actual['starttimeTicks'] != self.expected['starttimeTicks']
                                                             or (actual['tracerPid'] == 0 and actual['state'] not in ['T', 't']))
                cleanup['targetStateAfterCleanup'] = actual['state']
                cleanup['tracerPidAfterCleanup'] = actual['tracerPid']
            except FileNotFoundError:
                cleanup['originalTargetUntracedOrExited'] = True
            except Exception as error:
                self.error('final-detach-verification', error)
        else:
            self.attachment_resolved = True
            cleanup['originalTargetUntracedOrExited'] = True
        cleanup['confirmed'] = cleanup['originalTargetUntracedOrExited'] and cleanup['debuggerExited'] and self.attachment_resolved
        self.report['cleanup'] = cleanup
        self.report['finishedAtEpoch'] = time.time()
        self.report['status'] = 'completed' if cleanup['confirmed'] and not self.report['errors'] else 'blocked'
        self.done = True
        self.save()
        return self.report


class OwnedDiagnostic:
    """One opt-in supervisor child; diagnostics never replace the parent's wait result."""
    def __init__(self, output, *, gdb_path=GDB, environment=None, qemu_sha=QEMU_SHA, module_roots=()):
        self.output = Path(output)
        self.output.mkdir(exist_ok=False)
        self.expected_qemu_sha = qemu_sha
        self.module_roots = module_roots
        self.prepared = PreparedDebugger(self.output / 'prepared', gdb_path=gdb_path, environment=environment)
        self.session = None
        self.child = None
        self.started = time.monotonic()
        self.finished = False
        self.report = {'schemaVersion': 1, 'diagnosticIntervened': True, 'nativeAcceptanceAllowed': False,
                       'status': 'prepared', 'originalWaitIsSoleTerminalEvidence': True,
                       'internalErrorKilledTarget': False, 'errors': []}
        self.save()

    def save(self):
        value = dict(self.report)
        value['preparationStatus'] = self.prepared.report['status']
        if self.session:
            value['attachmentResolved'] = self.session.attachment_resolved
            value['traceStatus'] = self.session.report['status']
            value['traceCleanup'] = self.session.report.get('cleanup')
        data = (json.dumps(value, indent=2) + '\n').encode()
        require(len(data) <= MAX_REPORT, 'Owner report budget')
        temporary = self.output / 'report.tmp'
        temporary.write_bytes(data)
        os.replace(temporary, self.output / 'report.json')

    def error(self, phase, error):
        if len(self.report['errors']) < 16:
            self.report['errors'].append({'phase': phase, 'type': type(error).__name__})
        self.report['status'] = 'blocked'
        self.save()

    def spawn(self, command, executable):
        self.child = self.prepared.spawn(command, executable)
        self.report['childPid'] = self.child.pid
        if not self.prepared.grant_succeeded:
            self.report['status'] = 'blocked'
        self.save()
        return self.child

    def observe(self, value):
        if self.finished or self.session or not self.prepared.grant_succeeded:
            return
        if not value or not value.get('qemuExecutable') or not value.get('insideSdk'):
            return
        try:
            require(value['pid'] == self.child.pid and value['sha256'] == self.expected_qemu_sha,
                    'Observed QEMU does not match the fixed binary')
            expected = proc_identity(self.child.pid)
            require(expected['executableSha256'] == self.expected_qemu_sha and expected['starttimeTicks'] == value['starttimeTicks'],
                    'Actual QEMU exec identity differs')
            self.session = self.prepared.session(expected, self.output / 'trace', module_roots=self.module_roots)
            self.session.start()  # synchronous handshake: no parent poll/wait in this window
            self.report['status'] = 'observing' if not self.session.done else self.session.report['status']
            self.save()
        except Exception as error:
            self.error('observe-and-attach', error)
            self.finish()

    def reap_allowed(self):
        if self.prepared.mi.hold_reaping:
            try:
                self.prepared.observe_exec_or_exit()
            except (OSError, Rejected):
                return False
        if self.session and not self.session.attachment_resolved:
            # Keep the original target unreaped until the exact GDB process has
            # exited or its original attach command is conclusively resolved.
            self.session.refresh_attachment_resolution()
            if not self.session.attachment_resolved and self.session.mi.process.poll() is not None:
                self.session.attachment_resolved = True
                self.report['lateDebuggerExitObserved'] = True
                self.save()
            if not self.session.attachment_resolved:
                return False
        return True

    def poll(self, child):
        require(child is self.child, 'Different supervisor child')
        return child.poll() if self.reap_allowed() else None

    def tick(self):
        if self.finished:
            return
        try:
            if self.session:
                self.session.tick()
                if self.session.done:
                    self.finished = True
                    self.report['status'] = self.session.report['status']
                    self.save()
            elif time.monotonic() - self.started >= MAX_SECONDS or not self.prepared.grant_succeeded:
                self.report['stopReason'] = 'no-verified-qemu-within-window' if self.prepared.grant_succeeded else 'grant-rejected'
                self.report['status'] = 'blocked'
                self.finish()
        except Exception as error:
            self.error('tick', error)
            self.finish()

    def finish(self):
        if self.finished:
            return
        try:
            if self.session:
                result = self.session.finish()
                self.report['cleanupConfirmed'] = result['cleanup']['confirmed']
                self.report['status'] = result['status']
            else:
                self.report['cleanupConfirmed'] = self.prepared.close()
                if self.report['status'] != 'blocked':
                    self.report['status'] = 'closed-without-attachment'
            self.finished = True
            self.save()
        except Exception as error:
            self.error('cleanup', error)

    def wait_for_reap_permission(self, save_status, external_control=None):
        # Exceptional protocol-loss quarantine: do not kill a target because a
        # diagnostic failed, or release its PID while a delayed attach exists.
        # The job's external cancellation limit still applies. No bounded
        # successful cleanup is claimed if GDB never exits/responds.
        self.finish()
        if not self.reap_allowed():
            self.report['cleanupIncomplete'] = True
            self.report['quarantine'] = 'Holding original child unreaped; waiting for actual GDB exit without reading further MI; external job timeout remains a boundary'
            self.save()
            save_status()
        while not self.reap_allowed():
            if external_control:
                external_control()
            time.sleep(.05)
