#!/usr/bin/env python3
"""Negative artifact/source boundary checks using the real failed-run export."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('runtime_inputs', Path(__file__).with_name('android-runtime-inputs.py'))
runtime = importlib.util.module_from_spec(spec); spec.loader.exec_module(runtime)
ARTIFACT = Path(os.environ['JOYSTICK_RUNTIME_TEST_EXPORT'])
SOURCE = 'd30e1ce26abbf27d07d149b708c6a491abb105b3'
RUN = '44110295680'


class ExportBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((ARTIFACT / 'export-manifest.json').read_text())
        assert cls.manifest['sourceSha'] == SOURCE and str(cls.manifest['runId']) == RUN
        cls.receipt = json.loads((ARTIFACT / 'packages/qq-speed/signing-receipt.json').read_text())

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='joystick-runtime-boundary-')
        self.root = Path(self.temp.name) / 'artifact'

    def tearDown(self):
        self.temp.cleanup()

    def copied(self):
        shutil.copytree(ARTIFACT, self.root, ignore=shutil.ignore_patterns('.git'))
        return self.root

    def test_real_original_export_is_complete(self):
        self.assertEqual(runtime.verify_manifest(ARTIFACT, self.manifest), 65)

    def test_manifest_is_bound_to_immutable_git_blob_not_only_head(self):
        subprocess.run(['git', 'clone', '--quiet', '--no-hardlinks', str(ARTIFACT), str(self.root)], check=True)
        commit = runtime.git(self.root, 'rev-parse', 'HEAD').decode().strip()
        self.assertEqual(runtime.verify_export_origin(self.root, commit), self.manifest)
        changed = copy.deepcopy(self.manifest);changed['runtimeResult'] = 'success'
        (self.root / 'export-manifest.json').write_text(json.dumps(changed))
        self.assertEqual(runtime.git(self.root, 'rev-parse', 'HEAD').decode().strip(), commit)
        with self.assertRaises(AssertionError):
            runtime.verify_export_origin(self.root, commit)

    def test_altered_apk_is_rejected_by_export_hash(self):
        root = self.copied(); p = root / 'packages/qq-speed/qq-speed-0.1.0.apk'
        p.write_bytes(p.read_bytes() + b'changed')
        with self.assertRaises(AssertionError):
            runtime.verify_manifest(root, self.manifest)

    def test_missing_original_failure_report_is_rejected(self):
        root = self.copied()
        (root / 'reports/joystick-android-report-runtime-qq-speed/qq-speed-normal/report.json').unlink()
        with self.assertRaises(AssertionError):
            runtime.verify_manifest(root, self.manifest)

    def test_unlisted_file_is_rejected(self):
        root = self.copied(); (root / 'unexpected.txt').write_text('extra')
        with self.assertRaises(AssertionError):
            runtime.verify_manifest(root, self.manifest)

    def test_symlink_is_rejected(self):
        root = self.copied(); p = root / 'packages/qq-speed/SHA256SUMS.txt';data = p.read_bytes();p.unlink()
        outside = Path(self.temp.name) / 'outside';outside.write_bytes(data);p.symlink_to(outside)
        with self.assertRaises(AssertionError):
            runtime.verify_manifest(root, self.manifest)

    def test_manifest_cannot_escape_export_root(self):
        for name in ('../outside', '/absolute', 'x/../outside', 'x\\outside', '.git/config'):
            value = copy.deepcopy(self.manifest);value['files'][name] = {'bytes': 0, 'sha256': '0' * 64}
            with self.assertRaises(AssertionError):
                runtime.verify_manifest(ARTIFACT, value)

    def test_actual_receipt_keeps_original_source_and_run(self):
        runtime.check_receipt_origin(self.receipt, SOURCE, RUN)
        with self.assertRaises(AssertionError):
            runtime.check_receipt_origin(self.receipt, '0' * 40, RUN)
        with self.assertRaises(AssertionError):
            runtime.check_receipt_origin(self.receipt, SOURCE, '999999')
        bad = copy.deepcopy(self.receipt);bad['signatureVerified'] = False
        with self.assertRaises(AssertionError):
            runtime.check_receipt_origin(bad, SOURCE, RUN)

    def test_duplicate_and_traversal_zip_entries_are_rejected(self):
        for names in [('classes.dex', 'classes.dex'), ('../outside',), ('/absolute',)]:
            p = Path(self.temp.name) / 'bad.apk'
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', UserWarning)
                with zipfile.ZipFile(p, 'w') as z:
                    for name in names:z.writestr(name, 'fixture')
            with self.assertRaises(AssertionError):
                runtime.archive_content(p)

    def test_qa_current_production_must_match_original_and_commit(self):
        p = Path(self.temp.name) / 'input.js'
        original = b'original production';p.write_bytes(original)
        runtime.check_production_bytes(p, original, original)
        p.write_bytes(b'changed production')
        with self.assertRaises(AssertionError):
            runtime.check_production_bytes(p, original, original)
        p.write_bytes(original)
        with self.assertRaises(AssertionError):
            runtime.check_production_bytes(p, original, b'changed committed production')

    def test_actual_signed_content_is_bound_by_receipt(self):
        apk = ARTIFACT / 'packages/qq-speed/qq-speed-0.1.0.apk'
        self.assertEqual(runtime.archive_content(apk), self.receipt['contentSha256'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
