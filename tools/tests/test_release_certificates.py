"""Certificate migration must not weaken verification of old or unrelated APKs."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import resource_catalog


class ReleaseCertificatesTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / 'tools').mkdir()
        (self.root / 'resource/apps').mkdir(parents=True)
        (self.root / 'resource/launcher').mkdir()
        self.old = '1' * 64
        self.new = '2' * 64
        (self.root / 'tools/puretv-release-certificate.sha256').write_text(self.old + '\n')
        (self.root / 'tools/game-release-certificate.sha256').write_text(self.new + '\n')

    def identity(self, package, code, version, certificate=None):
        return {'packageName': package, 'versionCode': code, 'versionName': version,
                'certificateSha256': certificate or self.old, 'bytes': 3,
                'sha256': hashlib.sha256(b'APK').hexdigest()}

    def fixture(self, name, identity):
        folder = self.root / 'resource/apps' / name
        folder.mkdir()
        (folder / 'game.apk').write_bytes(b'APK')
        (folder / 'LICENSE').write_text('Fixture')
        (folder / 'README.md').write_text('Fixture')
        metadata = dict(identity, kind='app', name=name, author='fixture',
                        supportsLayoutJson=False, apk='game.apk',
                        version=identity['versionName'], apkBytes=identity['bytes'])
        (folder / 'resource.json').write_text(json.dumps(metadata))
        return folder

    def test_nine_exact_packages_change_at_the_first_050_version_code(self):
        releases = [
            ('tanktv', 7, '0.3.1'), ('jackaltv', 4, '0.3.0'),
            ('jeweltv', 2, '0.1.0'), ('tetristv', 2, '0.1.0'),
            ('bombjacktv', 2, '0.1.0'), ('adventureislandtv', 2, '0.1.0'),
            ('supermariotv', 2, '0.1.0'), ('coastkarttv', 2, '0.1.0'),
            ('cozyislandtv', 2, '0.1.0'),
        ]
        for suffix, code, previous in releases:
            with self.subTest(package=suffix):
                package = 'com.ecojust.' + suffix
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity(package, code - 1, previous)), self.old)
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity(package, code, '0.5.0')), self.new)
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity(package, code + 1, '0.6.0')), self.new)

    def test_launcher_other_apps_and_similar_package_names_keep_the_old_pin(self):
        for package in ('com.ecojust.puretv', 'com.ecojust.music',
                        'com.ecojust.coastkarttv.clone', 'com.ecojust.tanktv2'):
            with self.subTest(package=package):
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity(package, 999, '99.0.0')), self.old)

    def test_inconsistent_version_names_and_codes_cannot_choose_a_different_pin(self):
        for code, version in ((6, '0.5.0'), (7, '0.4.0'), (7, 'invalid'), (100, '0.1.0')):
            with self.subTest(code=code, version=version), self.assertRaises(AssertionError):
                resource_catalog.expected_release_certificate(
                    self.root, self.identity('com.ecojust.tanktv', code, version))

    def test_missing_game_pin_fails_closed_without_breaking_historical_packages(self):
        (self.root / 'tools/game-release-certificate.sha256').unlink()
        self.assertEqual(resource_catalog.expected_release_certificate(
            self.root, self.identity('com.ecojust.tanktv', 6, '0.3.1')), self.old)
        with self.assertRaises(FileNotFoundError):
            resource_catalog.expected_release_certificate(
                self.root, self.identity('com.ecojust.tanktv', 7, '0.5.0'))

    def test_malformed_pin_is_rejected(self):
        (self.root / 'tools/game-release-certificate.sha256').write_text('pending\n')
        with self.assertRaisesRegex(AssertionError, 'Invalid release certificate'):
            resource_catalog.expected_release_certificate(
                self.root, self.identity('com.ecojust.tanktv', 7, '0.5.0'))

    def test_catalog_accepts_mixed_legacy_apps_and_new_games(self):
        identities = {
            'tank': self.identity('com.ecojust.tanktv', 7, '0.5.0', self.new),
            'jewel': self.identity('com.ecojust.jeweltv', 1, '0.1.0', self.old),
            'music': self.identity('com.ecojust.music', 99, '0.9.0', self.old),
        }
        for name, identity in identities.items():
            self.fixture(name, identity)
        with patch.object(resource_catalog, 'apk_info', side_effect=lambda path, tools: identities[path.parent.name]):
            self.assertEqual(len(resource_catalog.verify_catalog(self.root, Path('/unused'))), 3)

    def test_catalog_rejects_wrong_pin_even_when_metadata_matches_apk(self):
        cases = [
            self.identity('com.ecojust.tanktv', 7, '0.5.0', self.old),
            self.identity('com.ecojust.tanktv', 6, '0.3.1', self.new),
            self.identity('com.ecojust.music', 99, '0.9.0', self.new),
        ]
        for index, identity in enumerate(cases):
            with self.subTest(identity=identity):
                folder = self.fixture('wrong', identity)
                with patch.object(resource_catalog, 'apk_info', return_value=identity):
                    with self.assertRaisesRegex(AssertionError, 'unexpected release signing certificate'):
                        resource_catalog.verify_catalog(self.root, Path('/unused'))
                for path in folder.iterdir():
                    path.unlink()
                folder.rmdir()


if __name__ == '__main__':
    unittest.main()
