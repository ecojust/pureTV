#!/usr/bin/env python3
"""Real short-child and synthetic proc boundaries; no Android/game run."""
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
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
MODULE_PATH = ROOT / 'joystick-games/tools/android-environment-diagnostics.py'
spec = importlib.util.spec_from_file_location('android_environment_diagnostics', MODULE_PATH)
diagnostics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(diagnostics)


class EnvironmentDiagnostics(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='android-environment-tests-')
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def run_child(self, code, *, budget=diagnostics.MAX_LOG_BYTES, samples=4, kernel=None):
        out = self.root / 'output'
        returned = diagnostics.run_wrapper([sys.executable, '-c', code, 'private-command-argument'], out,
                                           proc_root=self.root / 'missing-proc', cgroup_root=self.root / 'missing-cgroup',
                                           interval=.02, max_samples=samples, log_budget=budget,
                                           kernel_reader=kernel or (lambda: {'status': 'unavailable', 'reason': 'TestFixture'}))
        return returned, out, json.loads((out / 'report.json').read_text())

    def test_real_short_lived_child_success_and_source_are_preserved(self):
        code, out, report = self.run_child('pass')
        self.assertEqual(code, 0)
        self.assertEqual(report['childReturnCode'], 0)
        self.assertTrue(report['childResultPreserved'])
        self.assertEqual((out / report['source']['path']).read_bytes(), MODULE_PATH.read_bytes())
        self.assertIsNone(report['emulatorExitCode'])
        self.assertFalse(report['rootCauseProven'])
        for f in out.iterdir():
            self.assertNotIn(b'private-command-argument', f.read_bytes())

    def test_real_failure_exit_is_not_replaced_by_diagnostic_read_failure(self):
        def failed_probe():
            raise PermissionError(13, 'private exception text must not be logged')
        code, out, report = self.run_child('raise SystemExit(23)', kernel=failed_probe)
        self.assertEqual(code, 23)
        self.assertEqual(report['childReturnCode'], 23)
        self.assertEqual(len(report['diagnosticErrors']), 2)
        self.assertNotIn('private exception text', (out / 'report.json').read_text())

    def test_missing_proc_is_explicit_and_does_not_claim_oom_or_stop_child(self):
        code, out, report = self.run_child('import time; time.sleep(.08)')
        self.assertEqual(code, 0)
        rows = [json.loads(line) for line in (out / 'samples.jsonl').read_text().splitlines()]
        self.assertTrue(rows)
        self.assertTrue(all(row['memory']['status'] == 'unavailable' for row in rows))
        self.assertEqual(report['finalEmulatorObservation']['status'], 'unavailable')
        self.assertIsNone(report['finalEmulatorObservation']['exitCode'])

    def test_small_log_budget_and_sample_count_keep_complete_json_lines(self):
        code, out, report = self.run_child('import time; time.sleep(.15)', budget=550, samples=3)
        self.assertEqual(code, 0)
        self.assertLessEqual((out / 'samples.jsonl').stat().st_size, 550)
        self.assertLessEqual(report['sampling']['samplesAttempted'], 3)
        self.assertGreater(report['log']['rowsOmittedByBudget'], 0)
        for line in (out / 'samples.jsonl').read_text().splitlines():
            self.assertIsInstance(json.loads(line), dict)
        self.assertLessEqual((out / 'report.json').stat().st_size, diagnostics.MAX_REPORT_BYTES)

    def test_proc_pid_starttime_memory_and_gone_never_invent_exit_status(self):
        proc = self.root / 'proc'
        (proc / 'self').mkdir(parents=True)
        (proc / 'self/cgroup').write_text('0::/qa\n')
        (proc / 'meminfo').write_text('MemAvailable: 123 kB\nSwapFree: 456 kB\nSecretToken: private-value\n')
        cgroup = self.root / 'cgroup/qa'
        cgroup.mkdir(parents=True)
        (cgroup / 'memory.events').write_text('oom 2\noom_kill 1\nprivate_token 99\n')
        (cgroup / 'memory.current').write_text('9876\n')
        pid = proc / '42'
        pid.mkdir()
        (pid / 'comm').write_text('qemu-system-x86\n')
        (pid / 'cmdline').write_bytes(b'private-command-line\0token=private-token')
        fields = ['0'] * 22
        fields[0], fields[1], fields[19], fields[21] = 'S', '7', '123456', '32'
        (pid / 'stat').write_text('42 (qemu with spaces) ' + ' '.join(fields) + '\n')
        (pid / 'status').write_text('VmRSS: 128 kB\nVmHWM: 256 kB\nThreads: 4\nToken: private-token\n')
        sampler = diagnostics.ProcSampler(proc, self.root / 'cgroup')
        first = sampler.sample()
        process = first['emulator']['observed'][0]
        self.assertEqual((process['pid'], process['starttimeTicks'], process['memory']['VmRSS']['value']), (42, 123456, 128))
        self.assertEqual(first['cgroup']['files']['memory.events']['fields'], {'oom': 2, 'oom_kill': 1})
        self.assertNotIn('private', json.dumps(first))
        for f in pid.iterdir():
            f.unlink()
        pid.rmdir()
        gone = sampler.sample()['emulator']['gone'][0]
        self.assertEqual(gone['observation'], 'gone')
        self.assertEqual(gone['cause'], 'unknown')
        self.assertIsNone(gone['exitCode'])

    def test_kernel_filter_bounds_matching_lines_and_omits_unrelated_text(self):
        actual_popen = subprocess.Popen
        program = "print('private-unrelated-log');\nfor i in range(100): print('Out of memory: '+str(i)+' '+('x'*300))"
        def substitute(_command, **kwargs):
            return actual_popen([sys.executable, '-c', program], **kwargs)
        with patch.object(diagnostics.subprocess, 'Popen', side_effect=substitute):
            report = diagnostics.kernel_oom_snapshot()
        self.assertEqual(report['exitCode'], 0)
        self.assertGreater(report['matchingLinesOmitted'], 0)
        self.assertLessEqual(len(report['lines']), 32)
        self.assertLessEqual(sum(len(line.encode()) for line in report['lines']), 8192)
        self.assertNotIn('private-unrelated-log', json.dumps(report))

    def test_real_sigterm_reaches_owned_child_and_is_not_success(self):
        marker = self.root / 'child-pid'
        out = self.root / 'signal-output'
        child_code = "import os,time;from pathlib import Path;Path(" + repr(str(marker)) + ").write_text(str(os.getpid()));time.sleep(30)"
        driver = self.root / 'driver.py'
        driver.write_text('import importlib.util,sys\nfrom pathlib import Path\n'
                          + 's=importlib.util.spec_from_file_location("diagnostics",' + repr(str(MODULE_PATH)) + ');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\n'
                          + 'sys.exit(m.run_wrapper([sys.executable,"-c",' + repr(child_code) + '],Path(' + repr(str(out)) + '),interval=.02,max_samples=4,kernel_reader=lambda:{"status":"test-fixture"}))\n')
        process = subprocess.Popen([sys.executable, str(driver)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            deadline = time.monotonic() + 5
            while not marker.exists() and process.poll() is None and time.monotonic() < deadline:
                time.sleep(.02)
            self.assertTrue(marker.exists(), 'Real child did not start')
            child_pid = int(marker.read_text())
            process.send_signal(signal.SIGTERM)
            stdout, stderr = process.communicate(timeout=10)
            self.assertEqual(process.returncode, 128 + signal.SIGTERM, (stdout, stderr))
            report = json.loads((out / 'report.json').read_text())
            self.assertEqual(report['receivedSignal'], signal.SIGTERM)
            self.assertEqual(report['childReturnCode'], -signal.SIGTERM)
            with self.assertRaises(ProcessLookupError):
                os.kill(child_pid, 0)
        finally:
            if process.poll() is None:
                process.kill()
                process.wait(timeout=5)


if __name__ == '__main__':
    unittest.main(verbosity=2)
