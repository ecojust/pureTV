#!/usr/bin/env python3
"""Focused feed tests; the full generator additionally verifies every actual signed APK."""
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('tv_store_feed', Path(__file__).with_name('update-tv-store-catalog.py'))
FEED = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FEED)


class StoreFeedTest(unittest.TestCase):
    def test_static_svg_preserved_and_accessibility_only_normalized(self):
        value = FEED.safe_logo('<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Store"><title>Store</title><path d="M0 0h10v10z" fill="#fff"/></svg>')
        self.assertIn('path', value)
        self.assertNotIn('title', value)
        self.assertNotIn('aria-', value)
        self.assertNotIn('role=', value)

    def test_unsafe_svg_is_never_embedded(self):
        for value in ['<!DOCTYPE svg [<!ENTITY a SYSTEM "https://example.com">]><svg/>',
                      '<svg><script/></svg>', '<svg><path fill="url(#x)"/></svg>',
                      '<svg onload="go()"/>', '<svg><image href="https://example.com"/></svg>',
                      '<svg xmlns="urn:other"/>', '<svg><title><path/></title></svg>',
                      '<svg>' + ' ' * 8192 + '</svg>']:
            with self.subTest(value=value[:60]), self.assertRaises(ValueError):
                FEED.safe_logo(value)

    def test_git_blob_hash_includes_object_header(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'sample.apk'
            path.write_bytes(b'PK\x03\x04fake APK')
            expected = subprocess.check_output(['git', 'hash-object', str(path)], text=True).strip()
            self.assertEqual(expected, FEED.git_blob(path))

    def test_generation_is_deterministic_and_check_does_not_write(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'feed.json'
            data = FEED.encode({'schemaVersion': 1, 'entries': []})
            self.assertTrue(FEED.write_if_changed(path, data))
            stamp = path.stat().st_mtime_ns
            self.assertFalse(FEED.write_if_changed(path, data))
            self.assertEqual(stamp, path.stat().st_mtime_ns)
            with self.assertRaises(AssertionError):
                FEED.write_if_changed(path, b'changed', check=True)
            self.assertEqual(data, path.read_bytes())

    def test_bootstrap_skips_only_registered_store_and_newest_is_first(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'tools').mkdir()
            resources = []
            for identity in ['apps/first', 'apps/second']:
                directory = root / 'resource' / identity
                directory.mkdir(parents=True)
                (directory / 'app.apk').write_bytes(b'PK\x03\x04')
                (directory / 'thumb.png').write_bytes(b'png')
                (directory / 'logo.svg').write_text('<svg><circle r="5"/></svg>')
                resources.append({'kind': 'app', 'name': identity, 'path': f'resource/{identity}/app.apk',
                                  'packageName': 'com.ecojust.' + identity.split('/')[1], 'version': '0.1.0',
                                  'versionCode': 1, 'apkBytes': 4, 'sha256': 'a' * 64,
                                  'certificateSha256': 'b' * 64, 'cover': 'thumb.png'})
            order = {'launcher': [], 'media': [], 'game': ['apps/first', 'apps/second'], 'tools': ['apps/putrtv-store']}
            (root / 'tools/resource-order.json').write_text(json.dumps(order))
            (root / 'tools/resource-index.en.json').write_text(json.dumps({identity: {'name': identity} for identity in ['apps/first', 'apps/second']}))
            with patch.object(FEED, 'verify_catalog', return_value=resources) as verify, patch.object(FEED, 'min_sdk', return_value=19):
                catalog, lint = FEED.generate(root, root, True)
                verify.assert_called_once_with(root, root, allow_unpublished_putrtv_store=True)
                self.assertEqual(['apps/second', 'apps/first'], [entry['id'] for entry in catalog['entries']])
                self.assertFalse(lint)
                with self.assertRaises(AssertionError):
                    FEED.generate(root, root, False)
                order['tools'].append('apps/not-registered')
                (root / 'tools/resource-order.json').write_text(json.dumps(order))
                with self.assertRaises(AssertionError):
                    FEED.generate(root, root, True)

    def test_actual_snapshot_is_pinned_and_contains_no_store_hash_cycle(self):
        root = Path(__file__).resolve().parents[1]
        snapshot = json.loads((root / FEED.SNAPSHOT).read_text())
        self.assertEqual('23bf3b11c156922a70a64d5f10f2700c52ac10f6', snapshot['revision'])
        self.assertEqual(126, len(snapshot['catalog']['entries']))
        self.assertNotIn('apps/putrtv-store', {entry['id'] for entry in snapshot['catalog']['entries']})
        self.assertEqual(126, len({entry['packageName'] for entry in snapshot['catalog']['entries']}))
        for entry in snapshot['catalog']['entries']:
            self.assertGreater(entry['minSdk'], 0)
            self.assertRegex(entry['sha256'], r'^[a-f0-9]{64}$')
            self.assertRegex(entry['certificateSha256'], r'^[a-f0-9]{64}$')
            if entry['logoSvg']:
                self.assertTrue(FEED.safe_logo(entry['logoSvg']))


if __name__ == '__main__':
    unittest.main()
