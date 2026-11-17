#!/usr/bin/env python3
"""Packaging rejection boundaries; no signing key and no fake gameplay result."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('joystick_build_under_test', HERE / 'android-build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
spec = importlib.util.spec_from_file_location('joystick_release_under_test', HERE / 'android-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class PayloadBoundaries(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='joystick-android-contract-')
        self.root = Path(self.tmp.name)
        self.game = self.root / 'joystick-games/cf-transport-ship'
        self.dist = self.game / 'dist'
        self.dist.mkdir(parents=True)
        (self.dist / 'tv.html').write_text('<!doctype html><title>Packaging fixture only</title>')
        self.meta = {'id': 'cf-transport-ship', 'packageName': 'com.ecojust.joystickcf',
                     'name': '运输船 CF', 'nameEn': 'CF Transport Ship', 'version': '0.1.0', 'versionCode': 1}
        (self.game / 'game.json').write_text(json.dumps(self.meta))
        self.patcher = patch.object(build, 'ROOT', self.root)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.tmp.cleanup()

    def prepare(self):
        stage = self.root / 'composition'
        stage.mkdir()
        return build.prepare('cf-transport-ship', stage)

    def test_original_host_is_unmodified_and_only_payload_is_composed(self):
        before = {p.relative_to(build.KIT).as_posix(): build.record(p) for p in (build.KIT / 'android/src/main').rglob('*') if p.is_file()}
        kit, game, payload = self.prepare()
        actual = {p.relative_to(kit).as_posix(): build.record(p) for p in (kit / 'android/src/main').rglob('*') if p.is_file()}
        self.assertEqual(before, actual)
        self.assertEqual(payload['tv.html'], (self.dist / 'tv.html').read_bytes())
        self.assertEqual(json.loads(payload['game-config.json']), self.meta)
        self.assertEqual(set(json.loads(payload['assets-index.json'])), set(payload) - {'assets-index.json'})
        for name in build.PHONE:
            self.assertEqual(payload[name], (build.KIT / 'web' / name).read_bytes())

    def test_nested_payload_is_rejected(self):
        (self.dist / 'nested').mkdir()
        with self.assertRaises(AssertionError):
            self.prepare()

    def test_symlink_asset_is_rejected(self):
        outside = self.root / 'outside.js'; outside.write_text('fixture')
        (self.dist / 'escape.js').symlink_to(outside)
        with self.assertRaises(AssertionError):
            self.prepare()

    def test_shared_phone_asset_cannot_be_overridden(self):
        (self.dist / 'controller.js').write_text('replaced')
        with self.assertRaises(AssertionError):
            self.prepare()

    def test_generated_metadata_cannot_be_overridden(self):
        (self.dist / 'game-config.json').write_text('{}')
        with self.assertRaises(AssertionError):
            self.prepare()

    def test_arbitrary_package_cannot_use_game_registration(self):
        self.meta['packageName'] = 'com.ecojust.someothergame'
        (self.game / 'game.json').write_text(json.dumps(self.meta))
        with self.assertRaises(AssertionError):
            build.metadata('cf-transport-ship')

    def test_missing_tv_entry_is_rejected(self):
        (self.dist / 'tv.html').rename(self.dist / 'index.html')
        with self.assertRaises(AssertionError):
            self.prepare()

    def test_oversized_asset_is_rejected(self):
        (self.dist / 'large.js').write_bytes(b' ' * 8_000_001)
        with self.assertRaises(ValueError):
            self.prepare()


class SignatureInputBoundaries(unittest.TestCase):
    def test_workflow_must_be_present_in_sparse_source_checkout(self):
        with tempfile.TemporaryDirectory(prefix='joystick-sparse-contract-') as tmp:
            root = Path(tmp); kit = root / 'resource/game-kit'; game = root / 'joystick-games/cf-transport-ship'
            for folder in (kit / 'android/src/main', game / 'src', game / 'dist', root / 'joystick-games/shared/web'):
                folder.mkdir(parents=True)
            files = [kit / 'build.py', root / 'tools/resource_catalog.py', root / 'tools/puretv-release-certificate-v2.sha256',
                     *[game / n for n in ('game.json', 'package.json', 'package-lock.json', 'build.mjs')],
                     *[kit / 'web' / n for n in build.PHONE]]
            for path in files:
                path.parent.mkdir(parents=True, exist_ok=True); path.write_text('fixture')
            with patch.object(build, 'ROOT', root), patch.object(build, 'KIT', kit), patch.object(build, 'metadata', return_value={}):
                with self.assertRaises(AssertionError):
                    build.sources('cf-transport-ship')
                workflow = root / '.github/workflows/joystick-games-android.yml'
                workflow.parent.mkdir(parents=True); workflow.write_text('fixture workflow')
                self.assertIn('.github/workflows/joystick-games-android.yml', build.sources('cf-transport-ship'))

    def test_source_binding_rejects_unsafe_paths_before_reading(self):
        for name in ('../outside', '/outside', 'folder\\outside', 'source\x00.js'):
            with self.assertRaises(AssertionError):
                build.assert_committed({name: {}}, '0' * 40)

    def test_zip_duplicate_and_parent_traversal_are_rejected(self):
        with tempfile.TemporaryDirectory(prefix='joystick-archive-contract-') as tmp:
            for names in [('assets/tv.html', 'assets/tv.html'), ('../outside',)]:
                apk = Path(tmp) / 'bad.apk'
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', UserWarning)
                    with zipfile.ZipFile(apk, 'w') as archive:
                        for name in names:
                            archive.writestr(name, 'fixture')
                with self.assertRaises(AssertionError):
                    release.content(apk)

    def test_changed_checkout_does_not_satisfy_frozen_source_binding(self):
        with tempfile.TemporaryDirectory(prefix='joystick-frozen-contract-') as tmp:
            root = Path(tmp)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            p = root / 'source.js'; p.write_text('original')
            subprocess.run(['git', '-C', str(root), 'add', 'source.js'], check=True)
            subprocess.run(['git', '-C', str(root), '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], check=True)
            commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
            with patch.object(build, 'ROOT', root):
                build.assert_committed({'source.js': build.record(p)}, commit)
                p.write_text('changed')
                with self.assertRaises(AssertionError):
                    build.assert_committed({'source.js': build.record(p)}, commit)


class CatalogRegistrationBoundaries(unittest.TestCase):
    def registry(self, games=None):
        games = games or {'fixture-game': {'packageName': 'com.ecojust.joystick.fixturegame'}}
        return {'schemaVersion': 1, 'games': games, 'batches': {'fixture-batch': list(games)}}

    def test_registration_derives_exact_separate_identity_and_preserves_legacy(self):
        packages = build.registered_packages(data=self.registry())
        self.assertEqual(packages['fixture-game'], 'com.ecojust.joystick.fixturegame')
        for slug, package in build.LEGACY_PACKAGES.items(): self.assertEqual(packages[slug], package)
        self.assertEqual(build.selected_games(), list(build.LEGACY_PACKAGES))
        with self.assertRaises(AssertionError): build.selected_games('unregistered-game')
        with self.assertRaises(AssertionError): build.selected_games('qq-speed,qq-speed')

    def test_path_traversal_legacy_override_and_derived_package_collision_rejected(self):
        for games in [
            {'../escape': {'packageName': 'com.ecojust.joystick.escape'}},
            {'qq-speed': {'packageName': 'com.ecojust.joystick.qqspeed'}},
            {'fixture-game': {'packageName': 'com.ecojust.someothergame'}},
            {'fixture-game': {'packageName': 'com.ecojust.joystick.fixturegame'},
             'fixturegame': {'packageName': 'com.ecojust.joystick.fixturegame'}},
        ]:
            with self.assertRaises(AssertionError): build.registered_packages(data=self.registry(games))

    def test_duplicate_json_keys_and_unregistered_batch_members_rejected(self):
        with self.assertRaises(AssertionError): build.registry_data('{"games":{},"games":{}}')
        registry = self.registry(); registry['batches']['fixture-batch'].append('unknown')
        with self.assertRaises(AssertionError): build.registered_packages(data=registry)
        registry = self.registry(); registry['schemaVersion'] = True
        with self.assertRaises(AssertionError): build.registered_packages(data=registry)

    def test_catalog_source_inventory_matches_frozen_qa_inventory(self):
        spec = importlib.util.spec_from_file_location('catalog_runtime_inputs_under_test', HERE / 'android-runtime-inputs.py')
        runtime = importlib.util.module_from_spec(spec); spec.loader.exec_module(runtime)
        with tempfile.TemporaryDirectory(prefix='catalog-frozen-inventory-') as tmp:
            root = Path(tmp); kit = root / 'resource/game-kit'; game = root / 'joystick-games/fixture-game'
            for directory in ('resource/game-kit/android/src/main', 'joystick-games/shared/web', 'joystick-games/fixture-game/src', 'joystick-games/fixture-game/dist'):
                (root / directory).mkdir(parents=True)
            files = ['resource/game-kit/build.py', 'tools/resource_catalog.py', 'tools/puretv-release-certificate-v2.sha256',
                     '.github/workflows/joystick-games-android.yml', build.CATALOG_WORKFLOW, 'joystick-games/tools/qa-plan.py',
                     'joystick-games/tools/android-build.py', 'joystick-games/shared/crisp/vendor/engine.js',
                     'joystick-games/shared/triptych/build.mjs', 'joystick-games/shared/web/input.js',
                     'resource/game-kit/android/src/main/AndroidManifest.xml',
                     *['resource/game-kit/web/' + name for name in build.PHONE],
                     *['joystick-games/fixture-game/' + name for name in ('game.json', 'package.json', 'package-lock.json', 'build.mjs', 'qa-plan.json', 'NOTICE.md', 'LICENSE.txt', 'src/game.js', 'dist/tv.html')]]
            for name in files:
                path = root / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_text('fixture')
            (root / build.REGISTRY).write_text(json.dumps(self.registry()))
            with patch.object(build, 'ROOT', root), patch.object(build, 'KIT', kit), patch.object(build, 'metadata', return_value={}):
                inputs = build.sources('fixture-game')
                subprocess.run(['git', 'init', '-q', str(root)], check=True)
                subprocess.run(['git', '-C', str(root), 'add', '.'], check=True)
                subprocess.run(['git', '-C', str(root), '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'frozen fixture'], check=True)
                commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
                self.assertEqual(set(inputs), runtime.expected_inputs(root, commit, 'fixture-game'))
                build.assert_committed(inputs, commit)
                self.assertIn('joystick-games/shared/crisp/vendor/engine.js', inputs)
                self.assertIn('joystick-games/shared/triptych/build.mjs', inputs)
                (game / 'LICENSE').write_text('ambiguous second license')
                with self.assertRaises(AssertionError): build.sources('fixture-game')
                (game / 'LICENSE').unlink()
                (root / build.CATALOG_WORKFLOW).unlink()
                with self.assertRaises(AssertionError): build.sources('fixture-game')


if __name__ == '__main__':
    unittest.main(verbosity=2)
