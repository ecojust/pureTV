#!/usr/bin/env python3
"""Test provenance and failure preservation; does not emulate macOS graphics."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[3] / 'tools/macos-capability.py'
spec = importlib.util.spec_from_file_location('native_capability_tests', SOURCE)
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)


class CapabilityEvidence(unittest.TestCase):
    def identity(self):
        return {key: {'returncode': 0, 'stdout': value + '\n', 'stderr': ''} for key, value in {
            'hw.machine': 'x86_64', 'machdep.cpu.brand_string': 'Intel(R) Xeon(R) CPU',
            'sysctl.proc_translated': '0', 'hw.optional.arm64': '0'}.items()}

    def test_native_intel_identity_requires_actual_host_not_only_x86_process(self):
        records = self.identity(); self.assertTrue(module.native_intel('x86_64', records))
        for key, value in [('hw.machine', 'arm64'), ('machdep.cpu.brand_string', 'Apple M4'),
                           ('sysctl.proc_translated', '1'), ('hw.optional.arm64', '1')]:
            bad = copy.deepcopy(records); bad[key]['stdout'] = value
            self.assertFalse(module.native_intel('x86_64', bad))
        self.assertFalse(module.native_intel('arm64', records))

    def test_only_exact_native_missing_sysctl_error_is_an_observation(self):
        records = self.identity()
        for key in ['sysctl.proc_translated', 'hw.optional.arm64']:
            records[key] = {'returncode': 1, 'stdout': '', 'stderr': "sysctl: unknown oid '" + key + "'\n"}
        self.assertTrue(module.native_intel('x86_64', records))
        for record in [{'returncode': 1, 'stdout': '', 'stderr': 'permission denied'},
                       {'returncode': 1, 'stdout': '', 'stderr': ''},
                       {'returncode': 0, 'stdout': '', 'stderr': ''},
                       {'returncode': 0, 'stdout': '0', 'stderr': 'warning'}]:
            bad = copy.deepcopy(records); bad['sysctl.proc_translated'] = record
            self.assertFalse(module.native_intel('x86_64', bad))

    def test_job_is_unique_and_binds_attempt_runner_source_and_labels(self):
        source = 'a' * 40
        good = {'id': 45, 'run_id': 31, 'run_attempt': 2, 'head_sha': source,
                'runner_name': 'GitHub Actions fixture', 'status': 'in_progress',
                'name': 'verify (racing-01, example, macos-15-intel)', 'labels': ['macos-15-intel']}
        args = (31, 2, source, good['runner_name'], 'macos-15-intel', 'racing-01')
        self.assertEqual(module.select_job([good], *args), good)
        for key, value in [('run_id', 30), ('run_attempt', 1), ('head_sha', 'b' * 40),
                           ('runner_name', 'other'), ('status', 'completed'), ('labels', ['macos-latest']),
                           ('name', 'verify (racing-02, example, macos-15-intel)')]:
            with self.assertRaises(AssertionError): module.select_job([dict(good, **{key: value})], *args)
        with self.assertRaises(AssertionError): module.select_job([good, dict(good, id=46)], *args)
        with self.assertRaises(AssertionError): module.select_job([], *args)

    def test_nonzero_and_timeout_keep_original_stdout_stderr(self):
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary)
            with patch.object(module.subprocess, 'run', return_value=subprocess.CompletedProcess(['probe'], 3, b'original stdout', b'original error')):
                with self.assertRaises(AssertionError): module.command(['probe'], out, 'failed')
            self.assertEqual((out / 'failed-stderr.log').read_bytes(), b'original error')
            self.assertEqual(json.loads((out / 'failed-command.json').read_text())['returncode'], 3)
            with patch.object(module.subprocess, 'run', side_effect=subprocess.TimeoutExpired(['probe'], 30, output=b'partial output', stderr=b'partial failure')):
                with self.assertRaises(AssertionError): module.command(['probe'], out, 'timeout')
            self.assertEqual((out / 'timeout-stdout.log').read_bytes(), b'partial output')
            self.assertEqual((out / 'timeout-stderr.log').read_bytes(), b'partial failure')
            self.assertTrue(json.loads((out / 'timeout-command.json').read_text())['timedOut'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
