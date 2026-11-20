#!/usr/bin/env python3
"""Integration boundaries. Synthetic grants below are NOT permission capability evidence."""
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('integration_stack', ROOT / 'joystick-games/tools/android-qemu-stack.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
GDB = Path(os.environ.get('PURETV_QEMU_TEST_GDB', '/usr/bin/gdb'))
ENVIRONMENT = {'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C','DEBUGINFOD_URLS':''}
if os.environ.get('PURETV_QEMU_TEST_GDB_LIBRARY_PATH'):
    ENVIRONMENT['LD_LIBRARY_PATH'] = os.environ['PURETV_QEMU_TEST_GDB_LIBRARY_PATH']


class IntegrationBoundaries(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='stack-integration-')
        self.root=Path(self.temp.name);self.prepared=[];self.children=[];self.sessions=[]

    def tearDown(self):
        for session in self.sessions:session.finish()
        for prepared in self.prepared:
            if not prepared.adopted:prepared.close()
        for child in self.children:
            if child.poll() is None:child.terminate()
            child.communicate(timeout=3)
        self.temp.cleanup()

    def prepare(self):
        if not GDB.is_file():self.skipTest('Actual GDB unavailable; preparation not executed')
        prepared=m.PreparedDebugger(self.root/('prepared'+str(len(self.prepared))),gdb_path=GDB,environment=ENVIRONMENT)
        self.prepared.append(prepared);return prepared

    def synthetic_grant_child(self, prepared):
        # Test only: validates ownership plumbing, not the kernel permission path.
        prepared.prctl=lambda *args:0
        child=prepared.spawn(['/bin/sleep','10'],'/bin/sleep');self.children.append(child)
        return child,m.proc_identity(child.pid)

    def test_exact_positive_pid_only_and_grant_receipt_binds_start(self):
        prepared=self.prepare();marker=self.root/'synthetic-prctl-call.json'
        def call(*args):
            marker.write_text(json.dumps(args));return 0
        prepared.prctl=call
        child=prepared.spawn(['/bin/sleep','10'],'/bin/sleep');self.children.append(child)
        self.assertEqual(json.loads(marker.read_text()),[m.PR_SET_PTRACER,prepared.identity['pid'],0,0,0])
        self.assertTrue(prepared.mi.hold_reaping)
        grant=prepared.report['grant'];self.assertEqual(grant['ownedChildPid'],child.pid)
        self.assertEqual(grant['ownedChildStarttimeTicks'],m.proc_status(child.pid)['starttimeTicks'])
        prepared.observe_exec_or_exit();self.assertFalse(prepared.mi.hold_reaping)

    def test_rejected_grant_never_executes_target_or_sends_attach(self):
        prepared=self.prepare();prepared.prctl=lambda *args:-1
        child=prepared.spawn(['/bin/sleep','10'],'/bin/sleep');self.children.append(child)
        self.assertFalse(prepared.grant_succeeded);self.assertEqual(child.wait(timeout=3),125)
        self.assertTrue(prepared.close())
        self.assertFalse(any(x['command'].startswith('-target-attach') for x in prepared.mi.commands))

    def test_multithread_precondition_and_changed_debugger_refuse_spawn(self):
        prepared=self.prepare()
        with patch.object(m.threading,'active_count',return_value=2),patch.object(m.subprocess,'Popen') as spawn:
            with self.assertRaises(m.Rejected):prepared.spawn(['/bin/true'],'/bin/true')
            spawn.assert_not_called()
        prepared.identity['starttimeTicks']+=1
        with patch.object(m.subprocess,'Popen') as spawn:
            with self.assertRaises(m.Rejected):prepared.spawn(['/bin/true'],'/bin/true')
            spawn.assert_not_called()
        prepared.identity['starttimeTicks']-=1

    def test_wrong_child_start_and_constructor_error_keep_cleanup_owner(self):
        prepared=self.prepare();child,expected=self.synthetic_grant_child(prepared)
        with self.assertRaises(m.Rejected):prepared.session(dict(expected,starttimeTicks=expected['starttimeTicks']+1),self.root/'wrong')
        with self.assertRaises(m.Rejected):prepared.session(expected,self.root/'bad',seconds=0)
        self.assertFalse(prepared.adopted);self.assertTrue(prepared.close())
        self.assertIsNone(child.poll());self.assertEqual(m.proc_status(child.pid)['tracerPid'],0)

    def test_exit_after_session_before_start_closes_prepared_debugger(self):
        prepared=self.prepare();child,expected=self.synthetic_grant_child(prepared)
        session=prepared.session(expected,self.root/'trace');self.sessions.append(session)
        child.terminate()
        deadline=time.monotonic()+2
        while m.proc_status(child.pid)['state']!='Z' and time.monotonic()<deadline:time.sleep(.005)
        self.assertFalse(session.start());self.assertTrue(session.report['cleanup']['confirmed'])
        self.assertEqual(prepared.mi.process.poll(),0)
        self.assertEqual(child.wait(timeout=3),-signal.SIGTERM)

    def test_receipt_failure_preserves_real_owned_child_handle(self):
        prepared=self.prepare();prepared.prctl=lambda *args:0
        original=m.os.read
        def receipt(fd, count):
            value=original(fd,count)
            return b'bad' if count==3 else value
        with patch.object(m.os,'read',receipt):child=prepared.spawn(['/bin/sleep','10'],'/bin/sleep')
        self.children.append(child)
        self.assertIs(prepared.child,child);self.assertEqual(prepared.report['status'],'blocked')
        self.assertFalse(prepared.grant_succeeded);self.assertTrue(prepared.close())

    def test_unresolved_attach_never_polls_original_child(self):
        owner=m.OwnedDiagnostic.__new__(m.OwnedDiagnostic)
        owner.child=Mock();owner.prepared=Mock();owner.prepared.mi.hold_reaping=False
        owner.session=Mock();owner.session.attachment_resolved=False
        owner.session.mi.process.poll.return_value=None
        owner.report={};owner.save=Mock()
        self.assertIsNone(owner.poll(owner.child));owner.child.poll.assert_not_called()
        owner.session.mi.process.poll.return_value=0;owner.child.poll.return_value=-11
        self.assertEqual(owner.poll(owner.child),-11);self.assertTrue(owner.report['lateDebuggerExitObserved'])

    def test_unknown_cleanup_quarantine_keeps_external_control_callback(self):
        owner=m.OwnedDiagnostic.__new__(m.OwnedDiagnostic)
        owner.finish=Mock();owner.report={};owner.save=Mock()
        owner.reap_allowed=Mock(side_effect=[False,False,True])
        save=Mock();control=Mock()
        with patch.object(m.time,'sleep'):
            owner.wait_for_reap_permission(save,control)
        self.assertTrue(owner.report['cleanupIncomplete']);control.assert_called_once();save.assert_called_once()

    def test_gate_requires_same_tool_source_run_full_cases_and_no_skips(self):
        path=self.root/'gate.json';test=self.root/'test.py';test.write_text('test fixture\n')
        tool=self.root/'gdb';tool.write_text('tool fixture\n')
        env={'GITHUB_SHA':'a'*40,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1','RUNNER_NAME':'same-runner'}
        value={'status':'passed','failures':0,'errors':0,'skipped':0,'testsRun':10,
               'realPermissionCases':['fatal','handled','external-signals','deadline-detach','pending-fault-detach','wrong-start','constructor-rejection','exit-before-start','exit-during-attach','supervisor-original-wait'],
               'qaSourceSha':env['GITHUB_SHA'],'qaRunId':'123','qaRunAttempt':'1','runnerName':'same-runner',
               'helperSha256':m.digest(m.__file__),'testSha256':m.digest(test),'gdbSha256':m.digest(tool),'gdbPath':str(tool.resolve()),
               'permissionMethod':'same-user-exact-PR_SET_PTRACER','globalSettingsChanged':False}
        path.write_text(json.dumps(value));self.assertEqual(m.verify_permission_gate(path,test,env,gdb_path=tool),value)
        for key,changed in [('status','blocked'),('skipped',1),('testsRun',8),('realPermissionCases',value['realPermissionCases'][:-1]),
                            ('qaSourceSha','b'*40),('qaRunId','124'),('qaRunAttempt','2'),('runnerName','other'),
                            ('helperSha256','0'*64),('testSha256','0'*64),('gdbSha256','0'*64),('gdbPath','/wrong'),
                            ('permissionMethod','sudo'),('globalSettingsChanged',True)]:
            path.write_text(json.dumps(dict(value,**{key:changed})))
            with self.subTest(key=key),self.assertRaises(m.Rejected):m.verify_permission_gate(path,test,env,gdb_path=tool)


if __name__=='__main__':unittest.main(verbosity=2)
