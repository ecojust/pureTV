import hashlib
import json
import importlib.util
from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('freeze_market', Path(__file__).with_name('freeze-tv-market.py'))
market = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(market)


class Response(BytesIO):
    def __init__(self, data):
        super().__init__(data)
        self.headers = {'Content-Length': str(len(data)), 'ETag': '"fixed"'}


class FreezeTests(unittest.TestCase):
    def test_directory_only_follows_direct_app_folders(self):
        pages = {
            'media/': '<a href="../">parent</a><a href="bbll/">app</a><a href="https://other/">remote</a>',
            'launcher/': '', 'game/': '',
            'media/bbll/': '<a href="%E5%AE%BD%E5%B8%A6%20TV.apk">APK</a><a href="a%2Fb.apk">bad</a>'
                           '<a href="docs/">not an application folder</a>',
        }
        def fetch(path, _limit):
            return ('<title>Index of /</title><pre>' + pages[path] + '</pre>').encode()
        with patch.object(market, 'read_small', side_effect=fetch):
            self.assertEqual(market.discover(), {'media/bbll/宽带 TV.apk'})
        with patch.object(market, 'read_small', return_value=b'<html>server login page</html>'):
            with self.assertRaisesRegex(ValueError, 'Invalid marketplace directory'):
                market.discover()

    def test_desktop_version_groups_use_filename_and_parent_folder(self):
        items = {f'game/a/Game-{i}.0.apk' for i in range(1, 7)}
        items.update({'game/a/Game-10.0.apk', 'media/a/Game-1.0.apk', 'media/bbll/BBLL5改1.5.2.apk'})
        self.assertEqual(market.selected(items), [f'game/a/Game-{i}.0.apk' for i in (10, 6, 5, 4, 3)] +
                         ['media/a/Game-1.0.apk', 'media/bbll/BBLL5改1.5.2.apk'])
        self.assertEqual(market.display('media/bbll/BBLL5改1.5.2.apk'), ('BBLL5改1.5.2', ''))
        self.assertEqual(market.display('media/ktv/Maidong-KTV-2.1.10.apk'), ('Maidong-KTV', '2.1.10'))

    def test_numeric_version_ties_prefer_more_components_then_lowercase_extension(self):
        paths = ['game/a/Game-1.2.APK', 'game/a/Game-1.2.apk', 'game/a/Game-1.2.0.apk']
        self.assertEqual(market.selected(paths), list(reversed(paths)))

    def test_signed_apk_remains_listed_with_a_safe_or_missing_folder_logo(self):
        files = {'media/app/Logo.apk', 'media/app/logo.svg', 'media/app/thumb.png'}
        row = {'apkPath': 'media/app/Logo.apk', 'coverPath': 'media/app/thumb.png', 'bytes': 100}
        examples = [(b'<svg viewBox="0 0 10 10"><path d="M0 0h1"/></svg>', True),
                    (b'<svg><script/></svg>', False), (b'<bad', False)]
        for logo, safe in examples:
            with self.subTest(logo=logo), tempfile.TemporaryDirectory() as tmp, \
                    patch.object(market, 'discover', return_value=files), \
                    patch.object(market, 'verify_package', return_value=(row.copy(), False)), \
                    patch.object(market, 'read_small', return_value=logo) as fetch:
                dest = Path(tmp) / 'snapshot.json'
                market.freeze(Path('.'), dest)
                entry, = json.loads(dest.read_text())['catalog']['entries']
                self.assertEqual(bool(entry['logoSvg']), safe)
                self.assertEqual(entry['coverPath'], 'media/app/thumb.png')
                fetch.assert_called_once_with('media/app/logo.svg', 8192)

    def test_requires_valid_http_validators(self):
        date = 'Tue, 24 Nov 2026 14:47:04 GMT'
        self.assertEqual(market.validators({'Content-Length': '1', 'ETag': 'W/"x"', 'Last-Modified': date}), (1, '', date))
        for size, etag in [('0', '"x"'), ('12', 'W/"x"'), ('12', 'bad'), (str(2**32), '"x"')]:
            with self.subTest(size=size, etag=etag), self.assertRaises(ValueError):
                market.validators({'Content-Length': size, 'ETag': etag})

    def test_checksum_used_only_for_the_specific_filename(self):
        manifest = {'provider': '  桔子桑 ', 'packages': [{'file': 'new.apk', 'bytes': 2, 'sha256': 'a'*64}]}
        self.assertEqual(market.manifest_data(manifest, 'old.apk', 2), ('桔子桑', ''))
        self.assertEqual(market.manifest_data(manifest, 'new.apk', 2), ('桔子桑', 'a'*64))
        with self.assertRaises(ValueError):
            market.manifest_data(manifest, 'new.apk', 3)
        self.assertEqual(market.manifest_data({'packages': [{'file': 'new.apk'}]}, 'new.apk', 2), ('', ''))
        del manifest['packages'][0]['bytes']
        self.assertEqual(market.manifest_data(manifest, 'new.apk', 2), ('桔子桑', 'a'*64))

    def test_get_is_conditional_and_package_identity_is_separate_from_display(self):
        path = 'media/ktv/KT V-1.0.apk'
        package = b'fixture bytes'
        digest = hashlib.sha256(package).hexdigest()
        identity = {'packageName': 'org.example.ktv', 'versionCode': 8, 'apkVersionName': 'release', 'minSdk': 23,
                    'certificateSha256': 'a'*64, 'sha256': digest}
        calls = []
        def fetch(*args, **kwargs):
            calls.append((args, kwargs))
            return Response(package)
        manifest = {'packages': [{'file':'KT V-1.0.apk', 'bytes':len(package), 'sha256':digest}]}
        with patch.object(market, 'request', side_effect=fetch), patch.object(market, 'apk_identity', return_value=identity):
            row, matched = market.verify_package(path, Path('.'), {path, path + '.thumb.png'}, {'media/ktv': manifest})
            self.assertTrue(matched)
            self.assertEqual(calls[-1][1]['conditions'], {'If-Match': '"fixed"'})
            self.assertEqual((row['versionName'], row['apkVersionName'], row['coverPath']), ('1.0', 'release', path + '.thumb.png'))
            self.assertEqual(row['gitBlobSha'], hashlib.sha1(f'blob {len(package)}\0'.encode() + package).hexdigest())
            manifest['packages'][0]['sha256'] = 'b'*64
            with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                market.verify_package(path, Path('.'), {path}, {'media/ktv': manifest})

    def test_apk_identity_uses_long_version_code_and_requires_one_current_signer(self):
        badging = "package: name='test.app' versionCode='-1' versionName='release'\nsdkVersion:'26'\n"
        manifest = 'A: android:versionCodeMajor(0x01010575)=(type 0x10)0x2'
        signer = 'Signer #1 certificate SHA-256 digest: ' + 'a' * 64 + '\n'
        with patch.object(market, 'digest', return_value='b'*64), \
                patch.object(market.subprocess, 'check_output', side_effect=[badging, manifest, signer]):
            identity = market.apk_identity(Path('apk'), Path('.'))
            self.assertEqual(identity['versionCode'], (2 << 32) | 0xffffffff)
            self.assertEqual(identity['apkVersionName'], 'release')
        with patch.object(market.subprocess, 'check_output', side_effect=[badging, manifest, signer + signer.replace('#1', '#2')]):
            with self.assertRaisesRegex(ValueError, 'exactly one verified current signer'):
                market.apk_identity(Path('apk'), Path('.'))

    def test_empty_market_can_be_frozen_and_bad_optional_manifest_does_not_hide_apk(self):
        with patch.object(market, 'read_small', side_effect=OSError('server unavailable')):
            self.assertEqual(market.optional_manifest('media/app/manifest.json'), {})
        with patch.object(market, 'read_small', return_value=b'not JSON'):
            self.assertEqual(market.optional_manifest('media/app/manifest.json'), {})
        with tempfile.TemporaryDirectory() as tmp, patch.object(market, 'discover', return_value=set()):
            dest = Path(tmp) / 'snapshot.json'
            market.freeze(Path('.'), dest)
            self.assertEqual(json.loads(dest.read_text())['catalog']['entries'], [])

    def test_failed_freeze_preserves_previous_snapshot(self):
        paths = {c + '/game.apk' for c in market.CATEGORIES}
        with tempfile.TemporaryDirectory() as tmp, patch.object(market, 'discover', return_value=paths), \
                patch.object(market, 'verify_package', side_effect=ValueError('invalid APK')):
            dest = Path(tmp) / 'snapshot.json'
            dest.write_bytes(b'previous')
            with self.assertRaisesRegex(ValueError, 'invalid APK'):
                market.freeze(Path('.'), dest)
            self.assertEqual(dest.read_bytes(), b'previous')


if __name__ == '__main__':
    unittest.main()
