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
    def make_catalog(self, root):
        (root / 'tools').mkdir()
        order = {'launcher': ['launcher/home'], 'media': ['apps/player'],
                 'game': ['apps/first', 'apps/second'], 'tools': ['apps/putrtv-store']}
        resources, translations = [], {}
        for category, identities in order.items():
            for identity in identities:
                directory = root / 'resource' / identity
                directory.mkdir(parents=True)
                (directory / 'app.apk').write_bytes(b'PK\x03\x04')
                (directory / 'thumb.png').write_bytes(b'png')
                (directory / 'logo.svg').write_text('<svg><circle r="5"/></svg>')
                (directory / 'LICENSE').write_text('Fixture license')
                (directory / 'README.md').write_text('Fixture resource')
                info = {'kind': 'launcher' if category == 'launcher' else 'app',
                        'name': identity, 'author': 'Fixture author', 'supportsLayoutJson': False,
                        'apk': 'app.apk', 'packageName': 'com.example.' + identity.split('/')[1].replace('-', ''),
                        'version': '0.1.0', 'versionCode': 1, 'apkBytes': 4,
                        'sha256': 'a' * 64, 'certificateSha256': 'b' * 64, 'cover': 'thumb.png'}
                (directory / 'resource.json').write_text(json.dumps(info))
                resources.append({**info, 'path': f'resource/{identity}/app.apk'})
                translations[identity] = {'name': identity}
        (root / 'tools/resource-order.json').write_text(json.dumps(order))
        (root / 'tools/resource-index.en.json').write_text(json.dumps(translations))
        return resources, order, translations

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

    def test_apps_only_listing_preserves_creation_order_and_validates_launchers(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            resources, _, _ = self.make_catalog(root)
            with patch.object(FEED, 'verify_catalog', return_value=resources) as verify, patch.object(FEED, 'min_sdk', return_value=19) as sdk:
                catalog, lint = FEED.generate(root, root)
            verify.assert_called_once_with(root, root, allow_unpublished_putrtv_store=False)
            self.assertEqual(['apps/player', 'apps/second', 'apps/first', 'apps/putrtv-store'],
                             [entry['id'] for entry in catalog['entries']])
            self.assertEqual({'media', 'game', 'tools'}, {entry['category'] for entry in catalog['entries']})
            sdk.assert_any_call(root / 'resource/launcher/home/app.apk', root)
            self.assertFalse(lint)

    def test_hidden_launcher_does_not_bypass_signature_or_identity_validation(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            resources, _, _ = self.make_catalog(root)
            launcher = resources[0]
            actual = {'packageName': launcher['packageName'], 'versionCode': launcher['versionCode'],
                      'versionName': launcher['version'], 'certificateSha256': launcher['certificateSha256'],
                      'sha256': launcher['sha256'], 'bytes': launcher['apkBytes']}
            for field, invalid in [('packageName', 'com.example.other'), ('versionCode', 2),
                                   ('versionName', '0.2.0'), ('certificateSha256', 'c' * 64),
                                   ('sha256', 'd' * 64), ('bytes', 5)]:
                with self.subTest(field=field), patch('resource_catalog.apk_info', return_value={**actual, field: invalid}) as inspect, self.assertRaises(AssertionError):
                    FEED.generate(root, root)
                inspect.assert_called_once_with(root / launcher['path'], root)
            with patch('resource_catalog.apk_info', side_effect=AssertionError('Invalid APK signature: launcher')) as inspect:
                with self.assertRaisesRegex(AssertionError, 'Invalid APK signature: launcher'):
                    FEED.generate(root, root)
                inspect.assert_called_once_with(root / launcher['path'], root)

    def test_hidden_launcher_metadata_and_creation_order_remain_required(self):
        mutations = ('missing-order', 'wrong-category', 'missing-name', 'duplicate-package')
        for mutation in mutations:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                resources, order, translations = self.make_catalog(root)
                if mutation == 'missing-order':
                    order['launcher'].clear()
                elif mutation == 'wrong-category':
                    order['media'].extend(order['launcher'])
                    order['launcher'].clear()
                elif mutation == 'missing-name':
                    translations['launcher/home']['name'] = ''
                else:
                    resources[0]['packageName'] = resources[1]['packageName']
                (root / 'tools/resource-order.json').write_text(json.dumps(order))
                (root / 'tools/resource-index.en.json').write_text(json.dumps(translations))
                with patch.object(FEED, 'verify_catalog', return_value=resources), patch.object(FEED, 'min_sdk', return_value=19), self.assertRaises(AssertionError):
                    FEED.generate(root, root)

    def test_snapshot_rejects_legacy_catalog_with_launchers(self):
        catalog = {'schemaVersion': 1, 'entries': [{'id': 'launcher/home', 'category': 'launcher'}]}
        with self.assertRaisesRegex(AssertionError, 'Store snapshot must contain apps only'):
            FEED.snapshot(Path('/unused'), catalog, 'a' * 40)

    def test_actual_snapshot_is_apps_only_and_includes_only_published_store_hash(self):
        root = Path(__file__).resolve().parents[1]
        snapshot = json.loads((root / FEED.SNAPSHOT).read_text())
        self.assertEqual('801bf6c212fd17a63399f7eb48d7b05936f8954b', snapshot['revision'])
        self.assertEqual(117, len(snapshot['catalog']['entries']))
        self.assertEqual(117, len({entry['packageName'] for entry in snapshot['catalog']['entries']}))
        order = json.loads((root / 'tools/resource-order.json').read_text())
        snapshot_ids = {entry['id'] for entry in snapshot['catalog']['entries']}
        expected_ids = [identity for category in ('media', 'game', 'tools')
                        for identity in reversed(order[category]) if identity in snapshot_ids]
        self.assertEqual(expected_ids, [entry['id'] for entry in snapshot['catalog']['entries']])
        store = next(entry for entry in snapshot['catalog']['entries'] if entry['id'] == 'apps/putrtv-store')
        self.assertEqual('0.1.0', store['versionName'])
        self.assertEqual(1, store['versionCode'])
        # These are the verified 0.1.0 release values at the pinned revision.
        # Keep this check independent of Git history so a shallow CI checkout works.
        self.assertEqual('53e5c279204b52fa262bc040b003d09b7fd9374ee0aecbb9325edf452e322f2f', store['sha256'])
        self.assertEqual('eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23', store['certificateSha256'])
        self.assertEqual('putrtv-store-0.1.0.apk', Path(store['apkPath']).name)
        for entry in snapshot['catalog']['entries']:
            self.assertTrue(entry['id'].startswith('apps/'))
            self.assertIn(entry['category'], ('media', 'game', 'tools'))
            self.assertGreater(entry['minSdk'], 0)
            self.assertRegex(entry['sha256'], r'^[a-f0-9]{64}$')
            self.assertRegex(entry['certificateSha256'], r'^[a-f0-9]{64}$')
            if entry['logoSvg']:
                self.assertTrue(FEED.safe_logo(entry['logoSvg']))

    def test_actual_feed_has_only_apps_and_retains_repository_order(self):
        root = Path(__file__).resolve().parents[1]
        catalog = json.loads((root / FEED.FEED).read_text())
        order = json.loads((root / 'tools/resource-order.json').read_text())
        expected_ids = [identity for category in ('media', 'game', 'tools') for identity in reversed(order[category])]
        self.assertEqual(expected_ids, [entry['id'] for entry in catalog['entries']])
        self.assertEqual(len(expected_ids), len(catalog['entries']))
        self.assertTrue(all(entry['id'].startswith('apps/') and entry['category'] in ('media', 'game', 'tools')
                            for entry in catalog['entries']))


if __name__ == '__main__':
    unittest.main()
