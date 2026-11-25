#!/usr/bin/env python3
"""Real same-user process-local permission gate; never changes global ptrace policy."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import selectors
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[3]
HELPER = ROOT / 'joystick-games/tools/android-qemu-stack.py'
spec = importlib.util.spec_from_file_location('permission_stack', HELPER)
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
GDB = Path(os.environ.get('PURETV_QEMU_TEST_GDB', '/usr/bin/gdb'))
ENVIRONMENT = {'PATH': '/usr/bin:/bin', 'LANG': 'C', 'LC_ALL': 'C', 'DEBUGINFOD_URLS': ''}
if os.environ.get('PURETV_QEMU_TEST_GDB_LIBRARY_PATH'):
    ENVIRONMENT['LD_LIBRARY_PATH'] = os.environ['PURETV_QEMU_TEST_GDB_LIBRARY_PATH']
SOURCE = r'''
#include <signal.h>
#include <setjmp.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/resource.h>
static volatile sig_atomic_t go;
static sigjmp_buf saved;
static void ready(int n) {(void)n;go=1;}
static void handled(int n) {(void)n;siglongjmp(saved,1);}
__attribute__((noinline)) static void fault(const char *arg) {
 volatile const char *local=arg;(void)local;*(volatile int*)0=1;
}
int main(int argc,char **argv) {
 (void)argc;struct rlimit zero={0,0};setrlimit(RLIMIT_CORE,&zero);
 signal(SIGUSR1,ready);puts("ready");fflush(stdout);
 while(!go)usleep(1000);
 if(!strcmp(argv[1],"zero"))return 0;
 if(!strcmp(argv[1],"handled")){
  signal(SIGSEGV,handled);if(!sigsetjmp(saved,1))fault("PRIVATE_ARG");
  puts("handled");fflush(stdout);signal(SIGSEGV,SIG_DFL);
 }
 fault("PRIVATE_ARG");return 99;
}
'''
CASES = ['fatal', 'handled', 'external-signals', 'deadline-detach', 'pending-fault-detach',
         'wrong-start', 'constructor-rejection', 'exit-before-start', 'exit-during-attach', 'supervisor-original-wait']


class PermissionELF(unittest.TestCase):
    output = None

    @classmethod
    def setUpClass(cls):
        # No skip: a diagnostic run may not start an AVD without this capability.
        if not GDB.is_file() or not os.access(GDB, os.X_OK) or not shutil.which('cc'):
            raise RuntimeError('Real same-user GDB and C compiler are required')
        cls.temporary = tempfile.TemporaryDirectory(prefix='qemu-permission-elf-')
        cls.root = Path(cls.temporary.name)
        (cls.root / 'fixture.c').write_text(SOURCE)
        cls.executable = cls.root / 'fixture'
        subprocess.run(['cc', '-g', '-O0', '-fno-omit-frame-pointer', str(cls.root / 'fixture.c'), '-o', str(cls.executable)],
                       check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
        (cls.output / 'fixture-source.c').write_text(SOURCE)
        cls.fixture_sha = m.digest(cls.executable)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def setUp(self):
        self.children = []
        self.prepared = []
        self.sessions = []
        self.folder = self.output / self._testMethodName
        self.folder.mkdir()

    def tearDown(self):
        for session in self.sessions:
            session.finish()
        for prepared in self.prepared:
            if not prepared.adopted:
                prepared.close()
        for child in self.children:
            # Only these disposable fixture children; never the production target.
            if child.poll() is None:
                child.terminate()
            child.communicate(timeout=3)

    def launch(self, mode='zero'):
        prepared = m.PreparedDebugger(self.folder / ('prepared-' + str(len(self.prepared))), gdb_path=GDB, environment=ENVIRONMENT)
        self.prepared.append(prepared)
        child = prepared.spawn([str(self.executable), mode], self.executable)
        self.children.append(child)
        self.assertTrue(prepared.grant_succeeded, prepared.report)
        with selectors.DefaultSelector() as selector:
            selector.register(child.stdout, selectors.EVENT_READ)
            self.assertTrue(selector.select(2), 'Fixture never reached its actual executable')
            self.assertEqual(child.stdout.readline(), b'ready\n')
        expected = m.proc_identity(child.pid)
        self.assertEqual(expected['executableSha256'], self.fixture_sha)
        self.assertEqual(expected['uid'], os.getuid())
        self.assertEqual(prepared.report['grant']['ownedChildStarttimeTicks'], expected['starttimeTicks'])
        return prepared, child, expected

    def attach(self, prepared, expected, **kwargs):
        session = prepared.session(expected, self.folder / ('trace-' + str(len(self.sessions))), **kwargs)
        self.sessions.append(session)
        self.assertTrue(session.start(), session.report)
        self.assertEqual(session.debugger_pid, prepared.identity['pid'])
        self.assertEqual(session.report['actualDebuggerIdentity']['uid'], os.getuid())
        self.assertEqual(session.gdb_sha, m.digest(GDB))
        return session

    def until_done(self, session, child):
        deadline = time.monotonic() + 8
        while not session.done and time.monotonic() < deadline:
            session.tick()
            if session.attachment_resolved and child.poll() is not None:
                session.finish()
            time.sleep(.005)
        self.assertTrue(session.done, session.report)
        self.assertTrue(session.report['cleanup']['confirmed'], session.report)
        self.assertNotIn('PRIVATE_ARG', json.dumps(session.report))

    def test_01_fatal(self):
        prepared, child, expected = self.launch('fatal'); session = self.attach(prepared, expected)
        child.send_signal(signal.SIGUSR1); self.until_done(session, child)
        self.assertEqual(child.wait(timeout=3), -signal.SIGSEGV)
        self.assertEqual(len(session.report['events']), 1)

    def test_02_handled(self):
        prepared, child, expected = self.launch('handled'); session = self.attach(prepared, expected)
        child.send_signal(signal.SIGUSR1); self.until_done(session, child)
        stdout, _ = child.communicate(timeout=3)
        self.assertIn(b'handled\n', stdout); self.assertEqual(child.returncode, -signal.SIGSEGV)
        self.assertEqual(len(session.report['events']), 2)

    def test_03_external_signals(self):
        for number in [signal.SIGINT, signal.SIGTERM]:
            prepared, child, expected = self.launch(); session = self.attach(prepared, expected)
            child.send_signal(number); self.until_done(session, child)
            self.assertEqual(child.wait(timeout=3), -number)

    def test_04_deadline_detach(self):
        prepared, child, expected = self.launch(); session = self.attach(prepared, expected, seconds=.5)
        self.until_done(session, child)
        self.assertIsNone(child.poll()); self.assertEqual(m.proc_status(child.pid)['tracerPid'], 0)
        child.send_signal(signal.SIGUSR1); self.assertEqual(child.wait(timeout=3), 0)

    def test_05_pending_fault_detach(self):
        prepared, child, expected = self.launch('fatal'); session = self.attach(prepared, expected)
        child.send_signal(signal.SIGUSR1)
        stop = session.mi.stop(2); self.assertEqual(stop['signal-name'], 'SIGSEGV')
        session.finish(); self.assertTrue(session.report['cleanup']['confirmed'])
        self.assertEqual(child.wait(timeout=3), -signal.SIGSEGV)

    def test_06_wrong_start(self):
        prepared, child, expected = self.launch()
        with self.assertRaises(m.Rejected):
            prepared.session(dict(expected, starttimeTicks=expected['starttimeTicks'] + 1), self.folder / 'wrong')
        self.assertFalse(prepared.adopted); self.assertTrue(prepared.close())
        child.send_signal(signal.SIGUSR1); self.assertEqual(child.wait(timeout=3), 0)

    def test_07_constructor_rejection(self):
        prepared, child, expected = self.launch()
        with self.assertRaises(m.Rejected):
            prepared.session(expected, self.folder / 'invalid', seconds=0)
        self.assertFalse(prepared.adopted); self.assertTrue(prepared.close())
        self.assertEqual(m.proc_status(child.pid)['tracerPid'], 0)

    def test_08_exit_before_start(self):
        prepared, child, expected = self.launch()
        session = prepared.session(expected, self.folder / 'exit-before-start'); self.sessions.append(session)
        child.send_signal(signal.SIGUSR1)
        deadline = time.monotonic() + 2
        while m.proc_status(child.pid)['state'] != 'Z' and time.monotonic() < deadline:
            time.sleep(.005)
        self.assertFalse(session.start()); self.assertTrue(session.report['cleanup']['confirmed'])
        self.assertEqual(prepared.mi.process.poll(), 0)
        self.assertEqual(child.wait(timeout=3), 0)

    def test_09_exit_during_attach(self):
        from unittest.mock import patch
        prepared, child, expected = self.launch()
        session = prepared.session(expected, self.folder / 'exit-during-attach'); self.sessions.append(session)
        original = m.MIClient.command
        def exit_now(client, command, **kwargs):
            if command.startswith('-target-attach '):
                child.send_signal(signal.SIGUSR1)
                deadline = time.monotonic() + 2
                while m.proc_status(child.pid)['state'] != 'Z' and time.monotonic() < deadline:
                    time.sleep(.005)
            return original(client, command, **kwargs)
        with patch.object(m.MIClient, 'command', exit_now):
            self.assertFalse(session.start())
        self.assertTrue(session.report['cleanup']['confirmed']); self.assertTrue(session.attachment_resolved)
        self.assertFalse(any(x['command'].startswith('-stack-') for x in session.mi.commands))
        self.assertEqual(child.wait(timeout=3), 0)

    def test_10_supervisor_original_wait(self):
        spec=importlib.util.spec_from_file_location('permission_supervisor', ROOT/'joystick-games/tools/android-emulator-supervisor.py')
        supervisor=importlib.util.module_from_spec(spec);spec.loader.exec_module(supervisor)
        sdk=self.folder/'sdk';sdk.mkdir();target=sdk/'qemu-system-x86_64-headless'
        shutil.copyfile(self.executable,target);target.chmod(0o755)
        owner=m.OwnedDiagnostic(self.folder/'owned',gdb_path=GDB,environment=ENVIRONMENT,qemu_sha=self.fixture_sha)
        trace=self.folder/'owned/trace/report.json'
        # A separate disposable fixture trigger waits for the proven attach;
        # no threads are added to the parent before its process-local grant.
        driver=r'''
import json,os,pathlib,signal,sys,time
p=pathlib.Path(sys.argv[1]);deadline=time.monotonic()+8
while time.monotonic()<deadline:
 if p.is_file():
  r=json.loads(p.read_text())
  if r.get('status')=='attached':
   expected=r['expectedOwnedIdentity'];fields=pathlib.Path('/proc',str(expected['pid']),'stat').read_text().rsplit(')',1)[1].split()
   assert int(fields[19])==expected['starttimeTicks']
   os.kill(expected['pid'],signal.SIGUSR1);sys.exit(0)
 time.sleep(.005)
sys.exit(1)
'''
        trigger=subprocess.Popen([sys.executable,'-c',driver,str(trace)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        try:
            report=supervisor.run_child([str(target),'fatal'],target,self.folder/'launch',sdk=sdk,seconds=10,diagnostic=owner)
            trigger.communicate(timeout=3);self.assertEqual(trigger.returncode,0)
            self.assertEqual(report['returnCode'],-signal.SIGSEGV);self.assertTrue(report['actualQemuExitProven'])
            self.assertIsNone(report['intervention']);self.assertTrue(report['diagnosticIntervened'])
            self.assertFalse(report['nativeAcceptanceAllowed']);self.assertEqual(len(owner.session.report['events']),1)
            self.assertTrue(owner.session.report['cleanup']['confirmed'])
        finally:
            if trigger.poll() is None:trigger.terminate()
            trigger.communicate(timeout=3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    PermissionELF.output = args.output
    started = time.time()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PermissionELF)
    result = unittest.TextTestRunner(verbosity=2, failfast=True).run(suite)
    value = {'schemaVersion': 1, 'status': 'passed' if result.wasSuccessful() and result.testsRun == len(CASES) and not result.skipped else 'blocked',
             'testsRun': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors), 'skipped': len(result.skipped),
             'realPermissionCases': CASES, 'permissionMethod': 'same-user-exact-PR_SET_PTRACER', 'globalSettingsChanged': False,
             'qaSourceSha': os.environ.get('GITHUB_SHA'), 'qaRunId': os.environ.get('GITHUB_RUN_ID'),
             'qaRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT'), 'runnerName': os.environ.get('RUNNER_NAME'),
             'helperSha256': m.digest(HELPER), 'testSha256': m.digest(__file__),
             'gdbPath': str(GDB.resolve()), 'gdbSha256': m.digest(GDB) if GDB.is_file() else None,
             'startedAtEpoch': started, 'finishedAtEpoch': time.time(), 'avdStarted': False,
             'localPositiveGrantRequired': True, 'nativeAcceptanceAllowed': False}
    (args.output / 'report.json').write_text(json.dumps(value, indent=2) + '\n')
    raise SystemExit(0 if value['status'] == 'passed' else 1)


if __name__ == '__main__':
    main()
