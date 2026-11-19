#!/usr/bin/env python3
"""Resource-policy rejection and exact payload tests; no gameplay claims."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


policy = module('resource_policy_tests', ROOT / 'joystick-games/tools/asset-policy.py')
kit = module('resource_kit_tests', ROOT / 'resource/game-kit/build.py')
android = module('resource_android_tests', ROOT / 'joystick-games/tools/android-build.py')
macos = module('resource_macos_tests', ROOT / 'joystick-games/tools/macos-build.py')


def metadata():
    return {'id': 'fixture-racer', 'packageName': 'com.ecojust.joystick.fixtureracer',
            'name': '资源边界测试', 'nameEn': 'Resource boundary fixture',
            'version': '0.1.0', 'versionCode': 1}


def large_policy():
    return {'schemaVersion': 1, 'maxAssetBytes': 32_000_000,
            'maxTotalBytes': 128_000_000, 'maxApkBytes': 99_000_000}


class PolicyBoundaries(unittest.TestCase):
    def test_old_defaults_are_unchanged_without_explicit_registration(self):
        self.assertEqual(policy.limits(metadata()), {
            'maxAssetBytes': 8_000_000, 'maxTotalBytes': 32_000_000, 'maxApkBytes': 10_000_000})
        self.assertIsNone(policy.android_limits(metadata()))
        self.assertEqual(kit.MAX_APK_BYTES, 10_000_000)
        self.assertEqual(kit.checked_limits(), dict(policy.DEFAULT_ANDROID, extraExtensions=()))
        self.assertEqual(policy.limits(metadata(), platform='macos')['maxAssetBytes'], 10 * 1024 * 1024)

    def test_policy_requires_matching_game_registry_and_package(self):
        meta = dict(metadata(), assetPolicy=large_policy())
        registration = {'packageName': meta['packageName'], 'assetPolicy': large_policy()}
        self.assertEqual(policy.declaration(meta, registration), large_policy())
        for bad in [None, {}, {'packageName': meta['packageName']},
                    dict(registration, packageName='com.ecojust.joystickcf'),
                    dict(registration, assetPolicy=dict(large_policy(), maxApkBytes=98_000_000))]:
            with self.subTest(registration=bad), self.assertRaises(AssertionError):
                policy.declaration(meta, bad)
        with self.assertRaises(AssertionError):
            policy.declaration(metadata(), registration)

    def test_policy_rejects_loose_types_unknown_fields_and_unbounded_values(self):
        valid = large_policy()
        mutations = [dict(valid, schemaVersion=True), dict(valid, schemaVersion=2),
                     dict(valid, maxAssetBytes=True), dict(valid, maxTotalBytes=1.0),
                     dict(valid, maxApkBytes=128_000_001), dict(valid, maxAssetBytes=0),
                     dict(valid, maxAssetBytes=64 * 1024 * 1024 + 1),
                     dict(valid, maxTotalBytes=256 * 1024 * 1024 + 1),
                     dict(valid, maxTotalBytes=valid['maxAssetBytes'] - 1),
                     dict(valid, allowSymlinks=True), None]
        missing = dict(valid); missing.pop('maxApkBytes'); mutations.append(missing)
        for bad in mutations:
            meta = dict(metadata(), assetPolicy=bad)
            registration = {'packageName': meta['packageName'], 'assetPolicy': bad}
            with self.subTest(policy=bad), self.assertRaises(AssertionError):
                policy.declaration(meta, registration)

    def test_low_level_builder_keeps_a_hard_upper_bound(self):
        limits = dict(kit.DEFAULT_LIMITS, extraExtensions=('.glb',))
        for bad in [dict(limits, maxApkBytes=128_000_001), dict(limits, maxAssetBytes=True),
                    dict(limits, extraExtensions=['.exe']), dict(limits, extraExtensions=[[]]),
                    dict(limits, extraExtensions=['.glb', '.glb']), dict(limits, ignoreTotal=True)]:
            with self.subTest(limits=bad), self.assertRaises(ValueError):
                kit.checked_limits(bad)

    def test_explicit_128mb_cap_and_desktop_defaults(self):
        meta=dict(metadata(),assetPolicy=dict(large_policy(),maxApkBytes=128_000_000))
        entry={'packageName':meta['packageName'],'assetPolicy':meta['assetPolicy']}
        for platform in ['android','macos','windows']:
            self.assertEqual(policy.limits(meta,entry,platform)['maxApkBytes'],128_000_000)
        self.assertEqual(kit.checked_limits(policy.android_limits(meta,entry))['maxApkBytes'],128_000_000)
        self.assertEqual(policy.desktop_package_limit(meta,entry),128_000_000)
        self.assertEqual(policy.desktop_package_limit(metadata()),100_000_000)
        self.assertEqual(policy.limits(metadata())['maxApkBytes'],10_000_000)
        self.assertEqual(policy.limits(metadata(),platform='windows'),policy.DEFAULT_MACOS)


class ExactPayload(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='racing-assets-')
        self.root = Path(self.temp.name).resolve()
        self.game = self.root / 'game'
        self.assets = self.game / 'src/main/assets'
        self.assets.mkdir(parents=True)
        self.web = self.root / 'kit/web'; self.web.mkdir(parents=True)
        for name in ('controller.html', 'controller.js', 'controller.css'):
            (self.web / name).write_text('fixture')
        (self.assets / 'tv.html').write_text('<!doctype html><title>Asset fixture only</title>')
        (self.game / 'game.json').write_text(json.dumps(metadata()))
        self.patch = patch.object(kit, 'KIT', self.web.parent); self.patch.start()
        self.meta = dict(metadata(), assetPolicy=large_policy())
        self.registration = {'packageName': self.meta['packageName'], 'assetPolicy': large_policy()}
        self.limits = policy.android_limits(self.meta, self.registration)

    def tearDown(self):
        self.patch.stop(); self.temp.cleanup()

    def test_separate_binary_model_and_text_dependency_are_exact(self):
        model = b'glTF\0\xff\x80\x01' * 8192
        (self.assets / 'car.glb').write_bytes(model)
        (self.assets / 'track.gltf').write_text('{"buffers":[{"uri":"track.bin"}]}')
        (self.assets / 'track.bin').write_bytes(b'\xff\0\x80')
        data = kit.payload(self.game, self.limits)
        self.assertEqual(data['car.glb'], model)
        self.assertEqual(data['track.bin'], b'\xff\0\x80')
        self.assertEqual(set(json.loads(data['assets-index.json'])), set(data) - {'assets-index.json'})
        with self.assertRaises(ValueError):
            kit.payload(self.game)

    def test_oversized_old_asset_needs_explicit_caller_policy(self):
        (self.assets / 'large.js').write_bytes(b' ' * 8_000_001)
        (self.game / 'game.json').write_text(json.dumps(self.meta))
        with self.assertRaises(ValueError):
            kit.payload(self.game)  # Declaring a field alone cannot affect old GameKit CLI.
        self.assertEqual(len(kit.payload(self.game, self.limits)['large.js']), 8_000_001)

    def test_per_asset_total_and_index_budgets_are_independently_enforced(self):
        (self.assets / 'model.glb').write_bytes(b'x' * 128)
        with self.assertRaises(ValueError):
            kit.payload(self.game, dict(self.limits, maxAssetBytes=127))
        with self.assertRaises(ValueError):
            kit.payload(self.game, dict(self.limits, maxAssetBytes=128, maxTotalBytes=129))
        (self.assets / 'model.glb').unlink()
        for index in range(400):
            (self.assets / (str(index) + 'a' * 180 + '.js')).write_bytes(b'x')
        with self.assertRaisesRegex(ValueError, 'index'):
            kit.payload(self.game, self.limits)

    def test_paths_symlinks_and_reserved_names_stay_rejected(self):
        for name in ('nested', '.hidden.js', 'percent%20.js', 'back\\slash.js', 'assets-index.json', 'game-config.json', 'controller.js'):
            path = self.assets / name
            if name == 'nested': path.mkdir()
            else: path.write_text('not trusted')
            with self.subTest(name=name), self.assertRaises(ValueError):
                kit.payload(self.game, self.limits)
            if path.is_dir(): path.rmdir()
            else: path.unlink()
        outside = self.root / 'outside.glb'; outside.write_bytes(b'x')
        (self.assets / 'escape.glb').symlink_to(outside)
        with self.assertRaises(ValueError):
            kit.payload(self.game, self.limits)

    def test_mac_flat_copy_rejects_undeclared_binary_and_preserves_declared_bytes(self):
        model = b'\0\xff\x80' * 1024
        (self.assets / 'car.glb').write_bytes(model)
        target = self.root / 'mac'; target.mkdir()
        with self.assertRaises(AssertionError):
            macos.copy_web_assets(self.assets, target, policy.DEFAULT_MACOS)
        macos.copy_web_assets(self.assets, target, policy.limits(self.meta, self.registration, 'macos'), explicit=True)
        self.assertEqual((target / 'car.glb').read_bytes(), model)
        with self.assertRaises(AssertionError):
            macos.verify_web_budget(target, {'maxAssetBytes': 10_000, 'maxTotalBytes': 3000})
        (self.assets / 'bridge.js').write_text('override')
        with self.assertRaises(AssertionError):
            macos.copy_web_assets(self.assets, target, policy.DEFAULT_MACOS, explicit=True)

    def test_real_opus_and_m4a_only_enter_explicit_payload_unchanged(self):
        fixtures=ROOT/'joystick-games/tools/fixtures/audio'
        records=json.loads((fixtures/'provenance.json').read_text())['files']
        for name in ['backfire.opus','backfire.m4a']:
            data=(fixtures/name).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(),records[name]['sha256'])
            (self.assets/name).write_bytes(data)
        self.assertTrue((self.assets/'backfire.opus').read_bytes().startswith(b'OggS'))
        self.assertEqual((self.assets/'backfire.m4a').read_bytes()[4:8],b'ftyp')
        with self.assertRaises(ValueError):kit.payload(self.game)
        output=kit.payload(self.game,self.limits)
        for name in ['backfire.opus','backfire.m4a']:
            self.assertEqual(output[name],(fixtures/name).read_bytes())
        target=self.root/'audio-mac';target.mkdir()
        with self.assertRaises(AssertionError):macos.copy_web_assets(self.assets,target,policy.DEFAULT_MACOS)
        macos.copy_web_assets(self.assets,target,policy.limits(self.meta,self.registration,'macos'),explicit=True)
        for name in ['backfire.opus','backfire.m4a']:
            self.assertEqual((target/name).read_bytes(),(fixtures/name).read_bytes())


class NativeMime(unittest.TestCase):
    def test_actual_java_mime_method_with_jdk(self):
        javac = shutil.which('javac')
        if javac is None: self.skipTest('Requires JDK; no Android runtime claim')
        java = str(Path(javac).with_name('java'))
        source = (ROOT / 'resource/game-kit/android/src/main/java/com/ecojust/gamekit/MainActivity.java').read_text()
        method = source[source.index('    static String bundledAssetMime('):source.index('    WebResourceResponse localAsset(')]
        expected = {'car.glb': 'model/gltf-binary', 'CAR.GLB': 'model/gltf-binary', 'car.gltf': 'model/gltf+json',
                    'mesh.bin': 'application/octet-stream', 'decoder.wasm': 'application/wasm',
                    'car.ktx2': 'image/ktx2', 'sky.hdr': 'application/octet-stream',
                    'font.woff2': 'font/woff2', 'music.mp3': 'audio/mpeg',
                    'backfire.opus':'audio/ogg','backfire.m4a':'audio/mp4','BACKFIRE.M4A':'audio/mp4','unsafe.exe': None}
        with tempfile.TemporaryDirectory(prefix='actual-mime-java-') as tmp:
            path = Path(tmp) / 'MimeFixture.java'
            path.write_text('public final class MimeFixture {\n' + method + '\npublic static void main(String[] args) { for (String arg: args) System.out.println(bundledAssetMime(arg)); }}\n')
            subprocess.run([javac, str(path)], check=True, capture_output=True)
            actual = subprocess.check_output([java, '-cp', tmp, 'MimeFixture', *expected], text=True).splitlines()
            self.assertEqual(actual, [value or 'null' for value in expected.values()])


if __name__ == '__main__':
    unittest.main(verbosity=2)
