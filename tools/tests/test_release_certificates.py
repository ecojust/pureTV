"""Certificate migration must not weaken verification of old or unrelated APKs."""
import hashlib
import json
import shutil
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
        (self.root / 'tools/puretv-release-certificate-v2.sha256').write_text(self.new + '\n')

    def identity(self, package, code, version, certificate=None):
        return {'packageName': package, 'versionCode': code, 'versionName': version,
                'certificateSha256': certificate or self.old, 'bytes': 3,
                'sha256': hashlib.sha256(b'APK').hexdigest()}

    def fixture(self, name, identity, kind='app'):
        folder = self.root / 'resource' / ('apps' if kind == 'app' else 'launcher') / name
        folder.mkdir()
        (folder / 'game.apk').write_bytes(b'APK')
        (folder / 'LICENSE').write_text('Fixture')
        (folder / 'README.md').write_text('Fixture')
        metadata = dict(identity, kind=kind, name=name, author='fixture',
                        supportsLayoutJson=False, apk='game.apk',
                        version=identity['versionName'], apkBytes=identity['bytes'])
        if identity['packageName'] == 'com.ecojust.puretv':
            metadata.update(sourceTreeSha='fixture-tree', sourceCommit='fixture-commit')
        (folder / 'resource.json').write_text(json.dumps(metadata))
        return folder

    def test_all_24_exact_packages_change_at_the_first_050_version_code(self):
        releases = [
            ('puretv', 14, '0.3.7'), ('novatv', 4, '0.1.2'),
            ('formatv', 3, '0.1.1'), ('mosstv', 3, '0.1.1'),
            ('astertv', 3, '0.1.1'), ('soltv', 3, '0.1.1'),
            ('monotv', 3, '0.1.1'), ('pixeltv', 3, '0.1.1'),
            ('circuittv', 3, '0.1.1'), ('drifttv', 3, '0.1.1'),
            ('music', 5, '0.1.3'), ('hifinitv', 6, '0.1.4'),
            ('cctvlive', 2, '0.1.0'), ('webtv', 3, '0.1.1'),
            ('shortvideo', 3, '0.1.1'),
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

    def test_used_car_first_release_uses_only_the_new_certificate(self):
        for code, version in ((1, '0.1.0'), (2, '0.1.1'), (20, '1.0.0')):
            with self.subTest(code=code, version=version):
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity('com.ecojust.usedcartv', code, version)), self.new)
        for code, version in ((0, '0.1.0'), (1, '0.0.9'), (1, 'invalid')):
            with self.subTest(code=code, version=version), self.assertRaises(AssertionError):
                resource_catalog.expected_release_certificate(
                    self.root, self.identity('com.ecojust.usedcartv', code, version))
        identity = self.identity('com.ecojust.usedcartv', 1, '0.1.0', self.old)
        self.fixture('used-car-racing', identity)
        with patch.object(resource_catalog, 'apk_info', return_value=identity):
            with self.assertRaisesRegex(AssertionError, 'unexpected release signing certificate'):
                resource_catalog.verify_catalog(self.root, Path('/unused'))

    def test_unknown_and_similar_package_names_cannot_automatically_use_the_new_pin(self):
        for package in ('com.ecojust.unknown', 'com.ecojust.newapp',
                        'com.ecojust.coastkarttv.clone', 'com.ecojust.tanktv2',
                        'com.ecojust.usedcartv.clone', 'com.ecojust.usedcartv2'):
            with self.subTest(package=package):
                self.assertEqual(resource_catalog.expected_release_certificate(
                    self.root, self.identity(package, 999, '99.0.0')), self.old)

    def test_inconsistent_version_names_and_codes_cannot_choose_a_different_pin(self):
        for code, version in ((6, '0.5.0'), (7, '0.4.0'), (7, 'invalid'), (100, '0.1.0')):
            with self.subTest(code=code, version=version), self.assertRaises(AssertionError):
                resource_catalog.expected_release_certificate(
                    self.root, self.identity('com.ecojust.tanktv', code, version))

    def test_missing_new_pin_fails_closed_without_breaking_historical_packages(self):
        (self.root / 'tools/puretv-release-certificate-v2.sha256').unlink()
        self.assertEqual(resource_catalog.expected_release_certificate(
            self.root, self.identity('com.ecojust.tanktv', 6, '0.3.1')), self.old)
        with self.assertRaises(FileNotFoundError):
            resource_catalog.expected_release_certificate(
                self.root, self.identity('com.ecojust.tanktv', 7, '0.5.0'))

    def test_malformed_pin_is_rejected(self):
        (self.root / 'tools/puretv-release-certificate-v2.sha256').write_text('pending\n')
        with self.assertRaisesRegex(AssertionError, 'Invalid release certificate'):
            resource_catalog.expected_release_certificate(
                self.root, self.identity('com.ecojust.tanktv', 7, '0.5.0'))

    def test_catalog_accepts_mixed_legacy_and_new_apps_and_launchers(self):
        identities = {
            'tank': self.identity('com.ecojust.tanktv', 7, '0.5.0', self.new),
            'jewel': self.identity('com.ecojust.jeweltv', 1, '0.1.0', self.old),
            'music': self.identity('com.ecojust.music', 4, '0.1.3', self.old),
            'hifini': self.identity('com.ecojust.hifinitv', 6, '0.5.0', self.new),
            'puretv': self.identity('com.ecojust.puretv', 14, '0.5.0', self.new),
            'nova': self.identity('com.ecojust.novatv', 3, '0.1.2', self.old),
        }
        for name, identity in identities.items():
            self.fixture(name, identity, 'launcher' if name in ('puretv', 'nova') else 'app')
        with patch.object(resource_catalog, 'apk_info', side_effect=lambda path, tools: identities[path.parent.name]):
            self.assertEqual(len(resource_catalog.verify_catalog(self.root, Path('/unused'))), 6)

    def test_third_party_apks_keep_their_original_certificate(self):
        identity = self.identity('org.jellyfin.androidtv', 190010, '0.19.10', '3' * 64)
        self.fixture('third-party', identity)
        with patch.object(resource_catalog, 'apk_info', return_value=identity):
            entries = resource_catalog.verify_catalog(self.root, Path('/unused'))
        self.assertEqual(entries[0]['certificateSha256'], '3' * 64)

    def test_catalog_rejects_wrong_pin_even_when_metadata_matches_apk(self):
        cases = [
            self.identity('com.ecojust.tanktv', 7, '0.5.0', self.old),
            self.identity('com.ecojust.tanktv', 6, '0.3.1', self.new),
            self.identity('com.ecojust.music', 4, '0.1.3', self.new),
            self.identity('com.ecojust.music', 5, '0.5.0', self.old),
            self.identity('com.ecojust.novatv', 3, '0.1.2', self.new),
            self.identity('com.ecojust.novatv', 4, '0.5.0', self.old),
            self.identity('com.ecojust.unknown', 999, '99.0.0', self.new),
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

    def test_source_only_used_car_requires_build_opt_in_and_keeps_existing_checks(self):
        identity = self.identity('com.ecojust.tanktv', 7, '0.5.0', self.new)
        tank = self.fixture('tank', identity)
        new_app = self.root / 'resource/apps/used-car-racing'
        new_app.mkdir()
        generated = new_app / 'build/outputs/apk/release/used-car-racing-release-unsigned.apk'
        generated.parent.mkdir(parents=True)
        generated.write_bytes(b'fresh unsigned build')
        with patch.object(resource_catalog, 'apk_info', return_value=identity) as inspect:
            with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
                resource_catalog.verify_catalog(self.root, Path('/unused'))
            inspect.reset_mock()
            entries = resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)
            self.assertEqual([entry['packageName'] for entry in entries], ['com.ecojust.tanktv'])
            inspect.assert_called_once_with(tank / 'game.apk', Path('/unused'))
            inspect.return_value = dict(identity, certificateSha256=self.old)
            with self.assertRaisesRegex(AssertionError, 'certificateSha256 mismatch'):
                resource_catalog.verify_catalog(
                    self.root, Path('/unused'), allow_unpublished_used_car=True)

    def test_build_bootstrap_never_skips_old_similar_or_launcher_directories(self):
        for relative in ('apps/tank', 'apps/used-car-racing-copy', 'launcher/used-car-racing'):
            with self.subTest(relative=relative):
                folder = self.root / 'resource' / relative
                folder.mkdir()
                with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
                    resource_catalog.verify_catalog(
                        self.root, Path('/unused'), allow_unpublished_used_car=True)
                folder.rmdir()

    def test_build_bootstrap_rejects_any_top_level_resource_apk_without_metadata(self):
        folder = self.root / 'resource/apps/used-car-racing'
        folder.mkdir()
        for name, kind in (('game.apk', 'file'), ('game.APK', 'file'),
                           ('game.apk', 'broken-link'), ('game.apk', 'directory')):
            with self.subTest(name=name, kind=kind):
                candidate = folder / name
                if kind == 'file':
                    candidate.write_bytes(b'')
                elif kind == 'broken-link':
                    candidate.symlink_to(folder / 'missing-target')
                else:
                    candidate.mkdir()
                with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
                    resource_catalog.verify_catalog(
                        self.root, Path('/unused'), allow_unpublished_used_car=True)
                candidate.rmdir() if kind == 'directory' else candidate.unlink()

    def test_build_bootstrap_rejects_invalid_or_incomplete_metadata(self):
        folder = self.root / 'resource/apps/used-car-racing'
        folder.mkdir()
        metadata = folder / 'resource.json'
        metadata.symlink_to(folder / 'missing-target')
        with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
            resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)
        metadata.unlink()
        metadata.write_text('not JSON')
        with self.assertRaises(json.JSONDecodeError):
            resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)
        shutil.rmtree(folder)
        identity = self.identity('com.ecojust.usedcartv', 1, '0.1.0', self.new)
        folder = self.fixture('used-car-racing', identity)
        (folder / 'game.apk').unlink()
        with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
            resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)

    def test_build_bootstrap_does_not_skip_published_used_car_or_its_certificate(self):
        identity = self.identity('com.ecojust.usedcartv', 1, '0.1.0', self.new)
        folder = self.fixture('used-car-racing', identity)
        with patch.object(resource_catalog, 'apk_info', return_value=identity) as inspect:
            entries = resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)
            self.assertEqual(entries[0]['packageName'], 'com.ecojust.usedcartv')
            inspect.assert_called_once_with(folder / 'game.apk', Path('/unused'))
        old_identity = dict(identity, certificateSha256=self.old)
        metadata_path = folder / 'resource.json'
        metadata = json.loads(metadata_path.read_text())
        metadata['certificateSha256'] = self.old
        metadata_path.write_text(json.dumps(metadata))
        with patch.object(resource_catalog, 'apk_info', return_value=old_identity):
            with self.assertRaisesRegex(AssertionError, 'unexpected release signing certificate'):
                resource_catalog.verify_catalog(
                    self.root, Path('/unused'), allow_unpublished_used_car=True)

    def test_build_bootstrap_does_not_skip_a_symlinked_app_directory(self):
        target = self.root / 'outside'
        target.mkdir()
        (self.root / 'resource/apps/used-car-racing').symlink_to(target, target_is_directory=True)
        with self.assertRaisesRegex(AssertionError, 'Missing regular resource file'):
            resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)

    def test_build_bootstrap_still_requires_a_published_catalog_entry(self):
        (self.root / 'resource/apps/used-car-racing').mkdir()
        with self.assertRaisesRegex(AssertionError, 'No APK resources found'):
            resource_catalog.verify_catalog(
                self.root, Path('/unused'), allow_unpublished_used_car=True)


if __name__ == '__main__':
    unittest.main()
