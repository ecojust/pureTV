#!/usr/bin/env python3
"""Offline boundary tests: fake curl responses, never network or build execution."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('zxing', Path(__file__).with_name('android-zxing.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='zxing-tests-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.output = self.root / 'core.jar'; self.receipt = self.root / 'receipt.json'
        self.calls = []

    def fake(self, responses):
        def run(command, **kwargs):
            self.calls.append(command)
            self.assertEqual(kwargs['timeout'], 35)
            self.assertEqual(command[command.index('--max-time') + 1], '30')
            self.assertEqual(command[command.index('--max-filesize') + 1], '3')
            self.assertIn(command[-1], m.URLS)
            row = responses[len(self.calls)-1]
            if isinstance(row, Exception): raise row
            code, status, data = row
            Path(command[command.index('--output')+1]).write_bytes(data)
            return subprocess.CompletedProcess(command, code, status, 'fixed test error' if code else '')
        return run

    def invoke(self, responses):
        with patch.object(m, 'EXPECTED_BYTES', 3), patch.object(m, 'EXPECTED_SHA256', hashlib.sha256(b'abc').hexdigest()):
            return m.download(self.output, self.receipt, self.fake(responses))

    def test_production_pins_and_only_central_sources(self):
        self.assertEqual(m.EXPECTED_BYTES, 607650)
        self.assertEqual(m.EXPECTED_SHA256, '8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82')
        self.assertEqual(m.URLS, ('https://repo.maven.apache.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar', 'https://repo1.maven.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar', 'https://maven-central.storage-download.googleapis.com/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar'))

    def test_cached_archive_is_checked_without_network(self):
        archive = self.root / 'cached.jar'
        archive.write_bytes(b'abc')
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        with patch.object(m, 'EXPECTED_BYTES', 3), patch.object(m, 'EXPECTED_SHA256', digest):
            result = m.download(self.output, self.receipt, self.fake([]), archive=archive)
        self.assertEqual(result['selectedArchive'], str(archive))
        self.assertEqual(result['sha256'], digest)
        self.assertEqual(self.output.read_bytes(), archive.read_bytes())
        self.assertEqual(self.calls, [])

    def test_local_archive_with_wrong_content_cannot_be_used(self):
        archive = self.root / 'wrong.jar'
        archive.write_bytes(b'x' * m.EXPECTED_BYTES)
        with self.assertRaises(RuntimeError):
            m.download(self.output, self.receipt, self.fake([]), archive=archive)
        self.assertFalse(self.output.exists())
        self.assertEqual(json.loads(self.receipt.read_text())['attempts'][0]['error'], 'SHA-256 mismatch')

    def test_primary_exact_content_stops_without_requesting_mirror(self):
        result = self.invoke([(0, '200', b'abc')])
        self.assertEqual(self.output.read_bytes(), b'abc'); self.assertEqual(len(self.calls), 1)
        self.assertEqual(result['selectedUrl'], m.URLS[0]); self.assertFalse(list(self.root.glob('.zxing-*')))

    def test_404_falls_back_once_and_receipt_preserves_first_failure(self):
        result = self.invoke([(22, '404', b''), (0, '200', b'abc')])
        self.assertEqual(result['selectedUrl'], m.URLS[1]); self.assertEqual(result['attempts'][0]['httpStatus'], '404')
        self.assertEqual(len(self.calls), 2); self.assertEqual(json.loads(self.receipt.read_text()), result)

    def test_two_404s_use_google_maven_central_mirror(self):
        result = self.invoke([(22, '404', b''), (22, '404', b''), (0, '200', b'abc')])
        self.assertEqual(result['selectedUrl'], m.URLS[2])
        self.assertEqual(self.output.read_bytes(), b'abc')

    def test_wrong_size_short_or_long_and_wrong_hash_are_rejected(self):
        for data, reason in [(b'ab', 'Unexpected byte count'), (b'abcd', 'Unexpected byte count'), (b'xyz', 'SHA-256 mismatch')]:
            with self.subTest(data=data):
                self.calls.clear(); self.output.unlink(missing_ok=True); self.receipt.unlink(missing_ok=True)
                result = self.invoke([(0, '200', data), (0, '200', b'abc')])
                self.assertEqual(result['attempts'][0]['error'], reason); self.assertEqual(self.output.read_bytes(), b'abc')

    def test_non_200_rejected_even_if_content_matches(self):
        result = self.invoke([(0, '206', b'abc'), (0, '200', b'abc')])
        self.assertEqual(result['selectedUrl'], m.URLS[1])

    def test_timeout_uses_next_fixed_endpoint(self):
        result = self.invoke([subprocess.TimeoutExpired('curl', 35), (0, '200', b'abc')])
        self.assertEqual(result['attempts'][0]['error'], '35 second process deadline exceeded')

    def test_all_sources_fail_no_jar_or_partial_file_survives(self):
        with self.assertRaises(RuntimeError): self.invoke([(22, '404', b'bad'), (0, '200', b'xyz'), (22, '404', b'')])
        self.assertFalse(self.output.exists()); self.assertFalse(list(self.root.glob('.zxing-*')))
        self.assertEqual(json.loads(self.receipt.read_text())['status'], 'failed'); self.assertEqual(len(self.calls), 3)

    def test_existing_output_or_receipt_is_never_replaced(self):
        for target in [self.output, self.receipt]:
            with self.subTest(target=target):
                target.write_bytes(b'keep')
                with self.assertRaises(ValueError): self.invoke([])
                self.assertEqual(target.read_bytes(), b'keep'); target.unlink()
        self.assertEqual(self.calls, [])

    def test_symlink_and_identical_destinations_are_rejected(self):
        self.output.symlink_to(self.root / 'missing')
        with self.assertRaises(ValueError): self.invoke([])
        self.output.unlink()
        with self.assertRaises(ValueError): m.download(self.output, self.output, self.fake([]))
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
