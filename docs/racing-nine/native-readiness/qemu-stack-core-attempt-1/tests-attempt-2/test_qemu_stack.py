#!/usr/bin/env python3
"""Bounded MI/owned-process tests and real small ELF diagnostics, never an AVD/game pass."""
import collections
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[3]
MODULE = ROOT / 'joystick-games/tools/android-qemu-stack.py'
spec = importlib.util.spec_from_file_location('qemu_stack_tests_helper', MODULE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
SECRET = 'QEMU_TEST_ARGUMENT_LOCAL_ENV_MUST_NOT_BE_RECORDED'
GDB = Path(os.environ.get('PURETV_QEMU_TEST_GDB', '/usr/bin/gdb'))
ENVIRONMENT = {'PATH': '/usr/bin:/bin', 'LANG': 'C', 'LC_ALL': 'C', 'DEBUGINFOD_URLS': ''}
if os.environ.get('PURETV_QEMU_TEST_GDB_LIBRARY_PATH'):
    ENVIRONMENT['LD_LIBRARY_PATH'] = os.environ['PURETV_QEMU_TEST_GDB_LIBRARY_PATH']

ELF_SOURCE = r'''
#define _GNU_SOURCE
#include <signal.h>
#include <setjmp.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/resource.h>
static volatile sig_atomic_t go;
static sigjmp_buf saved;
static void ready(int n) {(void)n; go=1;}
static void handled(int n) {(void)n; siglongjmp(saved,1);}
__attribute__((noinline)) static void fault(const char *secret) {
 volatile const char *local=secret; (void)local; *(volatile int *)0=7;
}
int main(int argc,char **argv) {
 (void)argc; struct rlimit zero={0,0}; setrlimit(RLIMIT_CORE,&zero);
 const char *secret="QEMU_TEST_ARGUMENT_LOCAL_ENV_MUST_NOT_BE_RECORDED";
 signal(SIGUSR1,ready); puts("ready"); fflush(stdout);
 while(!go) usleep(1000);
 if(!strcmp(argv[1],"zero")) return 0;
 if(!strcmp(argv[1],"handled")) {
  signal(SIGSEGV,handled);
  if(!sigsetjmp(saved,1)) fault(secret);
  puts("handled"); fflush(stdout); signal(SIGSEGV,SIG_DFL);
 }
 fault(secret); return 99;
}
'''


class ParserBoundaries(unittest.TestCase):
    def test_real_thread_inventory_duplicates_and_bounded_frames_parse(self):
        record = m.parse_record('12^done,thread-ids={thread-id="1",thread-id="2"},number-of-threads="2"')
        self.assertEqual(record['data']['thread-ids']['thread-id'], ['1', '2'])
        frame = m.parse_record('13^done,stack=[frame={level="0",addr="0xabc",func="fault"}]')
        self.assertEqual(frame['data']['stack'][0]['frame']['func'], 'fault')

    def test_malformed_duplicate_and_untrusted_mi_are_rejected(self):
        for line in ['1^done,a="x",a="y"', '1^done,x="bad\\q"', '1^done,x={',
                     '1^done,x=["bad"', '1^done,x="unterminated', '1^done,x=__import__("os")',
                     '~"raw console is not a parsed result"']:
            with self.subTest(line=line), self.assertRaises(m.Rejected):
                m.parse_record(line)

    def test_string_line_depth_and_node_limits_reject(self):
        for line in ['1^done,x="'+'a'*8193+'"', '1^done,x="'+'a'*65537+'"',
                     '1^done,x='+'['*18+'"a"'+']'*18,
                     '1^done,x=['+','.join('"a"' for _ in range(4100))+']']:
            with self.subTest(bytes=len(line)), self.assertRaises(m.Rejected):
                m.parse_record(line)

    def test_escaped_strings_are_data_and_symbol_output_is_bounded(self):
        self.assertEqual(m.parse_record('1^done,x="a\\n\\141\\\""')['data']['x'], 'a\na"')
        self.assertEqual(m.symbol('a\n'+('b'*300)), 'a?'+('b'*198))
        self.assertIsNone(m.symbol({'not': 'text'}))


class MIProcessBoundaries(unittest.TestCase):
    def client(self, code, **kwargs):
        client = m.MIClient([sys.executable, '-u', '-c', code], command_seconds=.2, **kwargs)
        self.addCleanup(self.cleanup, client)
        return client

    @staticmethod
    def cleanup(client):
        # These processes are synthetic MI peers, never a debugger attached to a target.
        if client.process.poll() is None:
            client.process.terminate()
        client.process.wait(timeout=3)
        client.close_pipes()

    def test_eof_is_rejected_and_cannot_be_a_matching_response(self):
        c = self.client('import sys;sys.stdin.readline()')
        with self.assertRaises(m.Rejected):
            c.command('-gdb-set pagination off')
        self.assertFalse(c.summary()['rawStreamsRetained'])

    def test_wrong_token_times_out_without_stale_success(self):
        c = self.client('import sys,time;sys.stdin.readline();print("999^done",flush=True);time.sleep(1)')
        started = time.monotonic()
        with self.assertRaises(TimeoutError):
            c.command('-gdb-set pagination off')
        self.assertLess(time.monotonic()-started, 1)

    def test_raw_console_and_stderr_secrets_never_enter_summary(self):
        code = 'import sys;sys.stdin.readline();print(\'~"'+SECRET+'"\');print("1^done");print("'+SECRET+'",file=sys.stderr)'
        c = self.client(code)
        self.assertEqual(c.command('-gdb-set pagination off'), {})
        c.process.wait(timeout=3)
        for _ in range(3):
            c.read(.01)
        value = json.dumps(c.summary())
        self.assertNotIn(SECRET, value)
        self.assertGreater(c.summary()['rawBytesRead'], 0)

    def test_read_and_line_budgets_hard_fail_without_storing_raw(self):
        for kind in ['read', 'line']:
            c = self.client('import sys;sys.stdin.readline();sys.stdout.write("x"*2048);sys.stdout.flush()')
            with self.subTest(kind=kind), patch.object(m, 'MAX_READ' if kind=='read' else 'MAX_LINE', 1024):
                with self.assertRaises(m.Rejected):
                    c.command('-gdb-set pagination off')
            self.assertNotIn('x'*20, json.dumps(c.summary()))

    def test_cleanup_has_separate_bounded_read_budget(self):
        c = self.client('import sys;sys.stdin.readline();print("1^done",flush=True)')
        c.read_bytes = m.MAX_READ
        c.begin_cleanup()
        self.assertEqual(c.command('-target-detach', cleanup=True), {})
        self.assertGreater(c.cleanup_bytes, 0)
        self.assertLessEqual(c.cleanup_bytes, m.MAX_LINE)

    def test_expired_capture_deadline_sends_nothing_but_cleanup_still_works(self):
        c = self.client('import sys;sys.stdin.readline();print("1^done",flush=True)')
        with self.assertRaises(m.Rejected):
            c.command('-stack-list-frames 0 11', deadline=time.monotonic()-1)
        self.assertEqual(c.commands, [])
        self.assertEqual(c.sequence, 0)
        self.assertEqual(c.command('-target-detach', cleanup=True), {})

    def test_delayed_attach_reply_is_bound_to_original_token(self):
        code = ('import sys,time;sys.stdin.readline();time.sleep(.08);'
                'print("1^done",flush=True);sys.stdin.readline();'
                'print(\'2^error,msg="not attached"\',flush=True)')
        c = self.client(code)
        c.command_seconds = .02
        with self.assertRaises(TimeoutError):
            c.command('-target-attach 123')
        self.assertNotIn('resultClass', c.commands[0])
        c.command_seconds = .4
        with self.assertRaises(m.Rejected):
            c.command('-target-detach', cleanup=True)
        self.assertEqual(c.commands[0]['resultClass'], 'done')
        self.assertEqual(c.commands[1]['resultClass'], 'error')


@unittest.skipUnless(shutil.which('cc'), 'C compiler unavailable; no ELF claim')
class OwnedELF(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix='qemu-stack-elf-')
        cls.root = Path(cls.temporary.name)
        (cls.root/'fixture.c').write_text(ELF_SOURCE)
        cls.executable = cls.root/'fixture'
        subprocess.run(['cc', '-g', '-O0', '-fno-omit-frame-pointer', str(cls.root/'fixture.c'),
                        '-o', str(cls.executable)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def setUp(self):
        self.children = []
        self.sessions = []
        self.counter = 0

    def tearDown(self):
        for session in self.sessions:
            if not session.done:
                session.finish()
        for child in self.children:
            # Owned disposable test ELF only, not the production QEMU cleanup contract.
            if child.poll() is None:
                child.terminate()
            child.communicate(timeout=3)

    def child(self, mode='zero'):
        child = subprocess.Popen([str(self.executable), mode, SECRET], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.children.append(child)
        self.assertEqual(child.stdout.readline(), b'ready\n')
        return child

    def session(self, child, **kwargs):
        if not GDB.is_file():
            self.skipTest('GDB unavailable; real attached ELF checks not executed')
        self.counter += 1
        output = self.root/(self.id().split('.')[-1]+'-'+str(self.counter))
        session = m.TraceSession(m.proc_identity(child.pid), output, gdb_path=GDB,
                                 environment=ENVIRONMENT, **kwargs)
        self.sessions.append(session)
        return session

    def run_until_done(self, session, child, timeout=10):
        deadline = time.monotonic()+timeout
        while not session.done and time.monotonic()<deadline:
            session.tick()
            # start() already resolved attachment; reaping here cannot target a reused PID.
            if child.poll() is not None:
                session.finish()
                break
            time.sleep(.01)
        self.assertTrue(session.done, session.report)
        stdout, stderr = child.communicate(timeout=3)
        return stdout, stderr

    def assert_clean(self, session):
        report = json.loads((session.output/'report.json').read_text())
        self.assertTrue(report['cleanup']['confirmed'], report)
        self.assertFalse(report['cleanup']['blindKillSent'])
        self.assertFalse(report['cleanup']['artificialInterruptSent'])
        self.assertTrue(session.attachment_resolved)
        self.assertFalse(report['rootCauseProven'])
        self.assertFalse(report['coreCreated'])
        self.assertNotIn(SECRET, json.dumps(report))
        self.assertLessEqual((session.output/'report.json').stat().st_size, m.MAX_REPORT)
        self.assertFalse(any(p.name.startswith('core') for p in self.root.iterdir()))
        return report

    def test_owned_identity_accepts_real_child_and_rejects_mutations(self):
        child = self.child(); expected = m.proc_identity(child.pid)
        self.assertEqual(m.require_owned(expected)['pid'], child.pid)
        for key, value in [('starttimeTicks', expected['starttimeTicks']+1), ('parentPid', os.getpid()+1),
                           ('executablePath', '/different'), ('executableSha256', '0'*64), ('uid', expected['uid']+1),
                           ('pid', False), ('pid', 0), ('pid', os.getpid())]:
            with self.subTest(key=key,value=value), self.assertRaises(m.Rejected):
                m.require_owned(dict(expected, **{key:value}))
        with self.assertRaises(m.Rejected):
            m.require_owned(expected, tracer=123456)

    def test_exited_child_and_wrong_start_are_not_owned(self):
        child = self.child(); expected = m.proc_identity(child.pid)
        child.terminate(); child.wait(timeout=3)
        with self.assertRaises((m.Rejected, OSError)):
            m.require_owned(expected)

    def test_invalid_deadlines_and_existing_output_fail_before_attach(self):
        child = self.child()
        for seconds in [0, -1, 301, float('nan')]:
            with self.subTest(seconds=seconds), self.assertRaises(m.Rejected):
                self.session(child, seconds=seconds)
        session = self.session(child)
        with self.assertRaises(m.Rejected):
            m.TraceSession(m.proc_identity(child.pid), session.output, gdb_path=GDB)

    def test_actual_fatal_signal_remains_original_parent_minus_eleven(self):
        child = self.child('fatal'); session = self.session(child)
        self.assertTrue(session.start(), session.report)
        child.send_signal(signal.SIGUSR1)
        self.run_until_done(session, child)
        self.assertEqual(child.returncode, -signal.SIGSEGV)
        report = self.assert_clean(session)
        self.assertEqual(len(report['events']), 1)
        self.assertEqual(report['events'][0]['signal'], 'SIGSEGV')
        self.assertFalse(report['events'][0]['terminalCauseProven'])
        self.assertLessEqual(len(report['events'][0]['threads']), m.MAX_THREADS)

    def test_first_handled_segv_is_not_mislabeled_terminal(self):
        child = self.child('handled'); session = self.session(child)
        self.assertTrue(session.start(), session.report)
        child.send_signal(signal.SIGUSR1)
        stdout, _ = self.run_until_done(session, child)
        self.assertIn(b'handled\n', stdout)
        self.assertEqual(child.returncode, -signal.SIGSEGV)
        report = self.assert_clean(session)
        self.assertEqual(len(report['events']), 2)
        self.assertTrue(all(not e['terminalCauseProven'] for e in report['events']))

    def test_external_term_and_int_are_forwarded_without_invented_exit(self):
        for number in [signal.SIGTERM, signal.SIGINT]:
            with self.subTest(signal=number):
                child = self.child(); session = self.session(child)
                self.assertTrue(session.start(), session.report)
                child.send_signal(number)
                self.run_until_done(session, child)
                self.assertEqual(child.returncode, -number)
                self.assertEqual(self.assert_clean(session)['events'], [])

    def test_deadline_direct_detach_keeps_healthy_target_running(self):
        child = self.child(); session = self.session(child, seconds=.5)
        self.assertTrue(session.start(), session.report)
        deadline = time.monotonic()+5
        while not session.done and time.monotonic()<deadline:
            session.tick(); time.sleep(.01)
        self.assertTrue(session.done)
        self.assertIsNone(child.poll())
        self.assertEqual(m.proc_status(child.pid)['tracerPid'], 0)
        report = self.assert_clean(session)
        self.assertEqual(report['stopReason'], 'diagnostic-deadline')
        child.send_signal(signal.SIGUSR1); child.communicate(timeout=3)
        self.assertEqual(child.returncode, 0)

    def test_exit_before_start_blocks_without_any_frame_query(self):
        child = self.child(); session = self.session(child)
        child.terminate(); child.wait(timeout=3)
        self.assertFalse(session.start())
        self.assertEqual(session.report['status'], 'blocked')
        self.assertIsNone(session.mi)
        self.assertTrue(session.attachment_resolved)

    def test_exit_during_handshake_cannot_read_replaced_target(self):
        child = self.child(); session = self.session(child)
        command = m.MIClient.command
        def exit_before_attach(client, value, **kwargs):
            if value.startswith('-target-attach '):
                child.send_signal(signal.SIGKILL)
                # Do not reap: the original PID cannot be recycled during attach.
                deadline=time.monotonic()+2
                while m.proc_status(child.pid)['state']!='Z' and time.monotonic()<deadline:
                    time.sleep(.005)
            return command(client, value, **kwargs)
        with patch.object(m.MIClient, 'command', exit_before_attach):
            self.assertFalse(session.start())
        self.assertEqual(session.report['status'], 'blocked')
        self.assertFalse(any(x['command'].startswith('-stack-') for x in session.mi.commands))
        self.assertTrue(session.attachment_resolved)
        child.communicate(timeout=3); self.assertEqual(child.returncode,-signal.SIGKILL)

    def test_event_budget_detaches_and_preserves_pending_fault(self):
        child = self.child('fatal'); session = self.session(child)
        self.assertTrue(session.start(), session.report)
        with patch.object(m, 'MAX_EVENTS', 1):
            child.send_signal(signal.SIGUSR1)
            self.run_until_done(session, child)
        self.assertEqual(child.returncode,-signal.SIGSEGV)
        self.assertEqual(self.assert_clean(session)['stopReason'], 'event-budget')

    def test_unconfirmed_cleanup_is_blocked_never_claims_detached_or_kills(self):
        child = self.child(); session = self.session(child)
        fake = Mock()
        fake.commands = []
        fake.summary.return_value = {'rawStreamsRetained': False}
        fake.command.side_effect = EOFError('fixture transport lost '+SECRET)
        fake.process.wait.side_effect = subprocess.TimeoutExpired('fixture', 3)
        session.mi = fake; session.attach_issued = True
        state = dict(m.proc_status(child.pid), tracerPid=123456)
        with patch.object(m, 'proc_status', return_value=state):
            report = session.finish()
        self.assertEqual(report['status'], 'blocked')
        self.assertFalse(report['cleanup']['confirmed'])
        self.assertFalse(session.attachment_resolved)
        self.assertFalse(report['cleanup']['blindKillSent'])
        fake.process.kill.assert_not_called(); fake.process.terminate.assert_not_called()
        self.assertNotIn(SECRET, json.dumps(report))
        self.assertIsNone(child.poll())
        self.assertEqual(m.proc_status(child.pid)['tracerPid'], 0)

    def test_detach_error_without_original_attach_result_never_unlocks_reap(self):
        child = self.child(); session = self.session(child)
        fake = Mock(); fake.commands=[{'command':'-target-attach '+str(child.pid)}]
        fake.summary.return_value={'commands':fake.commands, 'rawStreamsRetained':False}
        def fail(value, **kwargs):
            if value=='-target-detach':
                fake.commands.append({'command':value,'resultClass':'error'})
            raise EOFError('no original attach result')
        fake.command.side_effect=fail
        fake.process.wait.side_effect=subprocess.TimeoutExpired('fake',3)
        session.mi=fake;session.attach_issued=True;session.attach_token=1
        report=session.finish()
        self.assertFalse(session.attachment_resolved)
        self.assertFalse(report['cleanup']['confirmed'])
        self.assertEqual(report['status'],'blocked')
        # Only the original attach token can subsequently resolve its ambiguity.
        fake.commands[0]['resultClass']='error';session.refresh_attachment_resolution()
        self.assertTrue(session.attachment_resolved)

    def test_module_symlink_cannot_hash_outside_allowed_root(self):
        child=self.child();session=self.session(child)
        allowed=session.output/'allowed';allowed.mkdir()
        outside=session.output/'outside.bin';outside.write_bytes(b'outside must not be hashed')
        link=allowed/'inside.so';link.symlink_to(outside)
        session.module_roots=[allowed.resolve()]
        with patch.object(m,'digest', wraps=m.digest) as digest:
            value=session.module(0x1100,[(0x1000,0x2000,0,str(link))])
        self.assertIsNone(value['sha256']);digest.assert_not_called()
        real=allowed/'regular.so';real.write_bytes(b'allowed module')
        self.assertEqual(session.module(0x1100,[(0x1000,0x2000,0,str(real))])['sha256'], m.digest(real))

    def test_each_thread_frame_query_requires_fresh_target_debugger_identity(self):
        child=self.child();session=self.session(child)
        commands=[]
        def command(value, **kwargs):
            commands.append(value)
            if value=='-thread-list-ids':return {'thread-ids':{'thread-id':['1','2']}}
            if value.startswith('-stack-list-frames'):return {'stack':[]}
            return {}
        with patch.object(session,'command',side_effect=command), patch.object(session,'maps',return_value=[]), \
             patch.object(session,'verify_attached',side_effect=[None,None,m.Rejected('identity changed')]):
            with self.assertRaises(m.Rejected):session.capture({'thread-id':'1'})
        self.assertEqual(sum(x.startswith('-stack-list-frames') for x in commands),1)
        self.assertEqual(commands[-1],'-thread-select 2')
        session.debugger_pid=123456
        expected={'pid':123456,'starttimeTicks':42,'parentPid':os.getpid(),'uid':os.getuid(),'executableSha256':'a'*64}
        session.report['actualDebuggerIdentity']=expected
        with patch.object(m,'proc_identity',return_value=dict(expected,executablePath=str(GDB),starttimeTicks=43)):
            with self.assertRaises(m.Rejected):session.verify_attached()
        with patch.object(m,'proc_identity',return_value=dict(expected,executablePath=str(session.gdb))), \
             patch.object(m,'require_owned',side_effect=m.Rejected('target changed')):
            with self.assertRaises(m.Rejected):session.verify_attached()

    def test_maximal_frame_payload_keeps_small_blocked_cleanup_report(self):
        child=self.child();session=self.session(child)
        frames=[{'level':i,'address':'0xffffffffffffffff','function':'F'*200,
                 'module':{'basename':'M'*128,'fileOffset':'0xffffffffffffffff','sha256':'a'*64}}
                for i in range(m.MAX_FRAMES)]
        session.report['events']=[{'atEpoch':time.time(),'signal':'SIGSEGV','terminalCauseProven':False,
                                  'threads':[{'id':str(j),'frames':frames} for j in range(m.MAX_THREADS)]}
                                 for _ in range(m.MAX_EVENTS)]
        self.assertGreater(len(json.dumps(session.report,indent=2).encode()),m.MAX_REPORT)
        session.save();session.finish()
        saved=json.loads((session.output/'report.json').read_text())
        self.assertEqual(saved['status'],'blocked')
        self.assertTrue(saved['cleanup']['confirmed'])
        self.assertEqual(saved['payloadTruncation']['omittedFrameCount'],m.MAX_FRAMES*m.MAX_THREADS*m.MAX_EVENTS)
        self.assertTrue(all(e['framesOmittedByBudget'] for e in saved['events']))
        self.assertLessEqual((session.output/'report.json').stat().st_size,m.MAX_REPORT)

    def test_initial_fault_stop_is_deferred_without_arguments_or_early_continue(self):
        child=self.child();session=self.session(child)
        fake=Mock();fake.sequence=0;fake.commands=[];fake.stops=collections.deque()
        fake.process.pid=child.pid;fake.process.returncode=0
        stop={'reason':'signal-received','signal-name':'SIGSEGV','thread-id':'1',
              'frame':{'args':[{'name':SECRET,'value':SECRET}]},'private':SECRET}
        fake.stop.return_value=stop
        def command(value, **kwargs):
            fake.sequence+=1;fake.commands.append({'command':value,'resultClass':'done'});return {}
        fake.command.side_effect=command
        fake.summary.side_effect=lambda:{'commands':fake.commands,'rawStreamsRetained':False}
        # Synthetic MI event only: this test does not claim an actual attach-time crash.
        with patch.object(m,'MIClient',return_value=fake), \
             patch.object(session,'bind_debugger',side_effect=lambda pid:setattr(session,'debugger_pid',0)):
            self.assertTrue(session.start(),session.report)
        self.assertTrue(session.report['initialAttachStop']['captureDeferredToTick'])
        self.assertEqual(fake.stops.popleft(),stop)
        self.assertFalse(any(x['command']=='-exec-continue' for x in fake.commands))
        self.assertNotIn(SECRET,json.dumps(session.report))
        session.finish()


if __name__ == '__main__':
    unittest.main(verbosity=2)
