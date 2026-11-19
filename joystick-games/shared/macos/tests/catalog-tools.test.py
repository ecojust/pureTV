#!/usr/bin/env python3
"""Catalog boundaries: frozen inputs, cached executable, observed native state."""
import copy
import importlib.util
import json
import socket
import threading
import time
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

TOOLS = Path(__file__).resolve().parents[3] / 'tools'

def module(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), TOOLS / (name + '.py'))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

builder = module('macos-build')
packages = module('macos-packages')
verify = module('macos-verify')
plan = module('qa-plan')

class CatalogTools(unittest.TestCase):
    def good_plan(self):
        return {'schemaVersion': 1, 'renderer': 'canvas2d', 'pauseStablePaths': ['gameplay.tick'], 'steps': [{'name': 'A jumps', 'keys': ['A'], 'holdMs': 120, 'expect': [{'path': 'gameplay.jumps', 'op': 'increased'}]}]}

    def test_plan_observes_model_and_rejects_scripts_missing_and_null(self):
        value = self.good_plan()
        self.assertEqual(plan.validate_plan(value), value)
        for bad in [dict(value, pauseStablePaths=[]), dict(value, renderer='gpu'), dict(value, steps=[]), dict(value, pauseStablePaths=['controller.pollCount'])]:
            with self.assertRaises(AssertionError):
                plan.validate_plan(bad)
        clocks = copy.deepcopy(value)
        clocks['steps'][0]['expect'][0]['path'] = 'gameplay.ticks'
        with self.assertRaises(AssertionError):
            plan.validate_plan(clocks)
        startup = copy.deepcopy(value)
        startup['steps'][0]['keys'] = ['START']
        with self.assertRaises(AssertionError):
            plan.validate_plan(startup)
        bad = copy.deepcopy(value)
        bad['steps'][0]['expect'][0]['path'] = 'gameplay.x=1'
        with self.assertRaises(AssertionError):
            plan.validate_plan(bad)
        expectations = value['steps'][0]['expect']
        self.assertTrue(plan.matches(expectations, {'gameplay': {'jumps': 2}}, {'gameplay': {'jumps': 1}}))
        for current in [{}, {'gameplay': {}}, {'gameplay': {'jumps': None}}, {'gameplay': {'jumps': True}}, {'gameplay': {'jumps': float('nan')}}, {'gameplay': {'jumps': 1}}]:
            self.assertFalse(plan.matches(expectations, current, {'gameplay': {'jumps': 1}}))
        self.assertFalse(plan.matches([{'path': 'gameplay.tick', 'op': 'eq', 'value': False}], {'gameplay': {'tick': 0}}, {}))

    def test_renderer_fallback_only_accepts_real_webgl_versions(self):
        value = dict(self.good_plan(), renderer='webgl2', compatibleRenderers=['webgl1', 'webgl2'])
        self.assertEqual(plan.accepted_renderers(plan.validate_plan(value)), ['webgl1', 'webgl2'])
        for values in [[], ['webgl1'], ['webgl2', 'canvas2d'], ['webgl2', 'webgl2']]:
            with self.assertRaises(AssertionError):
                plan.validate_plan(dict(value, compatibleRenderers=values))
        with self.assertRaises(AssertionError):
            plan.validate_plan(dict(self.good_plan(), compatibleRenderers=['canvas2d']))
        state = {'renderer': 'webgl1', 'webglVersion': 'WebGL 1.0 (WebKit)', 'stage': 'menu', 'paused': False, 'frames': 3, 'gameplay': {}, 'controller': {'pollCount': 3}}
        self.assertEqual(verify.initialization(state, renderer=['webgl1', 'webgl2']), 'ready')
        state['webglVersion'] = 'WebGL 2.0 (WebKit)'
        self.assertEqual(verify.initialization(state, renderer=['webgl1', 'webgl2']), 'pending')
        state.update(stage='error', error='Error creating WebGL context.')
        self.assertEqual(verify.initialization(state, renderer=['webgl1', 'webgl2']), 'initialization_error')

    def test_renderer_contract_has_no_catalog_graphics_exception(self):
        state = {'game': 'sample', 'renderer': 'canvas2d', 'stage': 'menu', 'paused': False, 'frames': 3, 'gameplay': {'tick': 0}, 'controller': {'pollCount': 3}}
        self.assertEqual(verify.initialization(state, renderer='canvas2d'), 'ready')
        for field, value in [('frames', 0), ('frames', True), ('renderer', 'webgl2'), ('stage', 'playing'), ('gameplay', None), ('paused', True)]:
            self.assertEqual(verify.initialization(dict(state, **{field: value}), renderer='canvas2d'), 'pending')
        state.update(stage='error', error='Error creating WebGL context.')
        self.assertEqual(verify.initialization(state, renderer='canvas2d'), 'initialization_error')
        self.assertEqual(verify.initialization(state, renderer='webgl2'), 'initialization_error')
        state.update(stage='menu', renderer='webgl1', webglVersion='WebGL 1.0 (OpenGL ES 2.0)')
        self.assertEqual(verify.initialization(state, renderer='webgl1'), 'ready')
        self.assertEqual(verify.initialization(state, renderer='webgl2'), 'pending')

    def test_actual_triptych_numeric_context_versions_are_strict(self):
        # The four Three games derive 1/2 from their actual context type;
        # rejecting that observation must not force a production asset rewrite.
        state = {'game': 'phosphor-patrol', 'renderer': 'webgl2', 'webglVersion': 2,
                 'stage': 'menu', 'paused': False, 'frames': 3,
                 'gameplay': {'tick': 0}, 'controller': {'pollCount': 3}}
        self.assertEqual(verify.initialization(state, renderer='webgl2'), 'ready')
        for version in [1, True, False, None, 2.0, '2', 'WebGL 1.0 (WebKit)', 'WebGL 20', 'WebGL 2.01', 'WebGL 2.0spoof']:
            with self.subTest(version=version):
                self.assertEqual(verify.initialization(dict(state, webglVersion=version), renderer='webgl2'), 'pending')
        for version in ['WebGL 2', 'WebGL 2.0 (WebKit)', 'WebGL 2.0(WebKit)']:
            self.assertEqual(verify.initialization(dict(state, webglVersion=version), renderer='webgl2'), 'ready')
        state.update(renderer='webgl1', webglVersion=1)
        self.assertEqual(verify.initialization(state, renderer=['webgl1','webgl2']), 'ready')
        self.assertEqual(verify.initialization(dict(state, webglVersion=2), renderer=['webgl1','webgl2']), 'pending')
        self.assertEqual(verify.initialization(dict(state, webglVersion=True), renderer=['webgl1','webgl2']), 'pending')

    def test_retained_browser_observations_match_native_type_contract(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures/catalog-webgl-versions.json').read_text())
        self.assertEqual(len(fixture['cases']), 4)
        for case in fixture['cases']:
            with self.subTest(game=case['game']):
                self.assertEqual(verify.initialization(case['browserObservation'], renderer='webgl2'), 'ready')

    def test_registry_rejects_duplicate_and_unsafe_application_identity(self):
        with self.assertRaises(AssertionError):
            builder.registry_data('{"games":{"sample":1,"sample":2}}')
        registry = {'schemaVersion': 1, 'games': {'sample': {'packageName': 'com.example.sample', 'appName': 'Sample Game', 'executable': 'SampleGame', 'initials': 'SG'}}, 'batches': {'batch-01': ['sample']}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'registry.json'
            with patch.object(builder, 'REGISTRY', path):
                path.write_text(json.dumps(registry))
                self.assertEqual(builder.registry_games(), registry['games'])
                for field, bad in [('initials', '\";fatalError()'), ('appName', '../Game'), ('executable', 'game/name'), ('packageName', 'no spaces.allowed')]:
                    mutated = copy.deepcopy(registry)
                    mutated['games']['sample'][field] = bad
                    path.write_text(json.dumps(mutated))
                    with self.assertRaises(AssertionError):
                        builder.registry_games()
                mutated = copy.deepcopy(registry)
                mutated['games']['other'] = dict(mutated['games']['sample'])
                path.write_text(json.dumps(mutated))
                with self.assertRaises(AssertionError):
                    builder.registry_games()

    def test_cache_rejects_wrong_inputs_changed_binary_and_symlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory).resolve() / 'cache'
            cache.mkdir()
            binary = cache / 'JoystickGame'
            binary.write_bytes(b'universal-host')
            binary.chmod(0o755)
            manifest = {'inputs': {'source': 'sha256'}, 'binary': builder.regular_input(binary)}
            path = cache / 'host-manifest.json'
            path.write_text(json.dumps(manifest))
            with patch.object(builder, 'capture', return_value='arm64 x86_64'):
                self.assertEqual(builder.validate_cached_host(cache, manifest['inputs']), manifest)
                with self.assertRaises(AssertionError):
                    builder.validate_cached_host(cache, {'source': 'other'})
                binary.write_bytes(b'changed')
                with self.assertRaises(AssertionError):
                    builder.validate_cached_host(cache, manifest['inputs'])
                binary.unlink()
                target = cache.parent / 'outside'
                target.write_bytes(b'universal-host')
                binary.symlink_to(target)
                with self.assertRaises(AssertionError):
                    builder.validate_cached_host(cache, manifest['inputs'])

    def test_storage_keys_are_explicit_exact_and_preserve_legacy_defaults(self):
        self.assertIsNone(builder.storage_keys('qq-speed', {}))
        self.assertEqual(builder.storage_keys('sample', {'storageKeys': []}), [])
        self.assertEqual(builder.storage_keys('sample', {'storageKeys': ['crisp-game-A%20B--123']}), ['crisp-game-A%20B--123'])
        for value in [None, 'save', ['save', 'save'], [''], ['joystick.language'], ['__proto__'], ['save\n'], ['a' * 129]]:
            with self.assertRaises(AssertionError):
                builder.storage_keys('sample', {'storageKeys': value})

    def test_expanded_storage_keys_require_matching_registered_policy_and_exact_keys(self):
        policy={'schemaVersion':1,'maxAssetBytes':32_000_000,'maxTotalBytes':128_000_000,'maxApkBytes':128_000_000}
        keys=['fixture-racer.ghost.'+str(index) for index in range(512)]
        meta={'id':'fixture-racer','packageName':'com.ecojust.joystick.fixtureracer','assetPolicy':policy,'storageKeys':keys}
        entry={'packageName':meta['packageName'],'assetPolicy':policy}
        with patch.object(builder,'registry_games',return_value={'fixture-racer':entry}):
            self.assertEqual(builder.storage_keys('fixture-racer',meta),keys)
            for bad in [dict(meta,storageKeys=keys+['one.more']),dict(meta,storageKeys=keys[:-1]+[keys[0]]),
                        dict(meta,storageKeys=['fixture-racer.ghost.*']),dict(meta,assetPolicy={}),
                        dict(meta,assetPolicy=dict(policy,maxApkBytes=127_000_000)),dict(meta,id='other-game'),
                        dict(meta,packageName='com.ecojust.joystick.othergame')]:
                with self.assertRaises(AssertionError):builder.storage_keys('fixture-racer',bad)
        for keys in [list(map(str,range(65))),list(map(str,range(512)))]:
            with self.assertRaises(AssertionError):builder.storage_keys('sample',{'storageKeys':keys})
        self.assertEqual(len(builder.storage_keys('sample',{'storageKeys':list(map(str,range(64)))})),64)

    def test_installation_requires_identical_file_set_not_just_known_files(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory).resolve() / 'Game.app'
            app.mkdir()
            (app / 'binary').write_bytes(b'frozen')
            expected = {'binary': packages.file_record(app / 'binary')}
            packages.exact_files(app, expected)
            (app / 'extra').write_text('injected')
            with self.assertRaises(AssertionError):
                packages.exact_files(app, expected)
            (app / 'extra').unlink()
            (app / 'alias').symlink_to(app / 'binary')
            with self.assertRaises(AssertionError):
                packages.exact_files(app, expected)

    def test_nested_resources_preserve_paths_bytes_and_generated_budgets(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve();source=root/'dist';target=root/'Web';source.mkdir();target.mkdir()
            assets={'tv.html':b'<script type="module" src="./js/main.js"></script>',
                    'js/main.js':b'fetch("../data/track.json")', 'data/track.json':b'{"mesh":"../models/car.bin"}',
                    'models/car.bin':bytes(range(256))*300, 'audio/effects/a.opus':b'OggS\0\xff',
                    'fonts/title.woff2':b'wOF2', 'vendor/LICENSE':b'Original notice'}
            for name,data in assets.items():
                path=source/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            limits={'maxAssetBytes':1_000_000,'maxTotalBytes':2_000_000}
            with self.assertRaises(AssertionError):builder.copy_web_assets(source,target,limits)
            builder.copy_web_assets(source,target,limits,explicit=True)
            self.assertEqual(builder.files(source),builder.files(target))
            builder.verify_web_budget(target,limits,explicit=True)
            self.assertEqual((target/'models/car.bin').read_bytes(),assets['models/car.bin'])
            (target/'bridge.js').write_bytes(b'host bridge')
            with self.assertRaises(AssertionError):builder.verify_web_budget(target,dict(limits,maxTotalBytes=sum(map(len,assets.values()))),explicit=True)
            with self.assertRaises(AssertionError):builder.verify_web_budget(target,dict(limits,maxAssetBytes=100),explicit=True)
            with self.assertRaises(AssertionError):builder.verify_web_budget(target,limits)

    def test_nested_resource_paths_reject_aliases_symlinks_and_reserved_roots(self):
        for bad in ['models/CON.glb','models/lpt9.bin','assets./car.bin','models/bad%20.bin','models/back\\slash.bin','node_modules/a.js']:
            with self.subTest(path=bad),tempfile.TemporaryDirectory() as directory:
                root=Path(directory).resolve();(root/'tv.html').write_text('entry')
                path=root/bad;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'x')
                with self.assertRaises(AssertionError):builder.web_asset_paths(root,explicit=True)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve();source=root/'dist';source.mkdir();target=root/'Web';target.mkdir()
            (source/'tv.html').write_text('entry');(source/'models').mkdir();(source/'models/car.bin').write_bytes(b'x')
            (source/'alias').symlink_to(source/'models',target_is_directory=True)
            with self.assertRaises(AssertionError):builder.web_asset_paths(source,explicit=True)
            (source/'alias').unlink();(source/'Models').mkdir(exist_ok=True)
            if len([p for p in source.iterdir() if p.name.lower()=='models'])==2:
                with self.assertRaises(AssertionError):builder.web_asset_paths(source,explicit=True)
                (source/'Models').rmdir()
            (source/'bridge.js').mkdir()
            with self.assertRaises(AssertionError):builder.copy_web_assets(source,target,{'maxAssetBytes':100,'maxTotalBytes':1000},explicit=True)

    def test_nested_resource_depth_file_node_and_index_limits(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve();path=root/('/'.join(['a']*15))/'a.js';path.parent.mkdir(parents=True);path.write_bytes(b'x')
            self.assertEqual(len(builder.web_asset_paths(root,explicit=True)),1)
            too_deep=path.parent/'deep';too_deep.mkdir();(too_deep/'a.js').write_bytes(b'x')
            with self.assertRaises(AssertionError):builder.web_asset_paths(root,explicit=True)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve()
            for index in range(2049):(root/(str(index)+'.js')).write_bytes(b'x')
            with self.assertRaisesRegex(AssertionError,'Too many bundled assets'):builder.web_asset_paths(root,explicit=True)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve()
            for index in range(4097):(root/str(index)).mkdir()
            with self.assertRaisesRegex(AssertionError,'nodes'):builder.web_asset_paths(root,explicit=True)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve()
            for index in range(400):(root/(str(index)+'a'*180+'.js')).write_bytes(b'x')
            with self.assertRaisesRegex(AssertionError,'index'):builder.web_asset_paths(root,explicit=True)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve();path=root/('/'.join(['a'*150]*7))/'a.js';path.parent.mkdir(parents=True);path.write_bytes(b'x')
            with self.assertRaisesRegex(AssertionError,'path exceeds'):builder.web_asset_paths(root,explicit=True)

    def test_package_manifest_binds_full_nested_paths_and_rejects_aliases(self):
        with tempfile.TemporaryDirectory() as directory:
            app=Path(directory).resolve();path=app/'Contents/Resources/Web/models/car.bin';path.parent.mkdir(parents=True);path.write_bytes(b'actual model')
            expected={'Contents/Resources/Web/models/car.bin':packages.file_record(path)}
            packages.exact_files(app,expected)
            for name in ['../car.bin','/car.bin','Contents//car.bin','Contents/./car.bin','Contents\\car.bin']:
                with self.subTest(name=name),self.assertRaises(AssertionError):packages.validate_file_records({name:packages.file_record(path)})
            for name in ['Contents/Resources/Web/Models/other.bin','Contents/Resources/Web/models','Contents/Resources/Web/models/CAR.bin']:
                with self.subTest(name=name),self.assertRaises(AssertionError):packages.validate_file_records({**expected,name:packages.file_record(path)})
            path.rename(path.parent.parent/'car.bin')
            with self.assertRaises(AssertionError):packages.exact_files(app,expected)

    def test_second_sdk_retains_terminal_busy_error(self):
        spec = importlib.util.spec_from_file_location('catalog_sdk_fixture', verify.SDK)
        sdk = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sdk)
        server = socket.socket()
        server.bind(('127.0.0.1', 0))
        server.listen(1)
        def reject():
            peer, _ = server.accept()
            try:
                with peer.makefile('rb') as stream:
                    hello = json.loads(stream.readline())
                    peer.sendall((json.dumps({'type': 'error', 'message': 'controller_busy', 'seq': hello['seq']}) + '\n').encode())
            finally:
                peer.close()
        worker = threading.Thread(target=reject, daemon=True)
        worker.start()
        report = {'wire': [], 'observerErrors': [], 'observerConnectionEnds': []}
        observer = verify.RejectionObserver(server.getsockname(), report)
        client = sdk.JoystickClient('127.0.0.1', observer.port)
        try:
            try:
                client.connect()
            except OSError:
                pass
            deadline = time.monotonic() + 3
            while time.monotonic() < deadline:
                if any(item['message'].get('message') == 'controller_busy' for item in report['wire']):
                    break
                time.sleep(.02)
            self.assertTrue(any(item['direction'] == 'game-to-sdk' and item['message'].get('message') == 'controller_busy' for item in report['wire']))
            self.assertFalse(report['observerErrors'])
        finally:
            client.disconnect()
            observer.close()
            server.close()
            worker.join(timeout=3)

    def test_shared_engine_and_registry_are_frozen_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            shared = root / 'joystick-games/shared/macos'
            game = root / 'joystick-games/sample'
            for name in ['joystick-games/shared/macos/Sources/main.swift', 'joystick-games/shared/web/input.js', 'joystick-games/shared/crisp/vendor/engine.js', 'joystick-games/shared/crisp/tv.js', 'joystick-games/sample/src/game.js', 'joystick-games/sample/dist/tv.html', 'joystick-games/sample/game.json', 'joystick-games/sample/qa-plan.json', 'puretv-joystick/joystick_sdk.py', 'joystick-games/tools/macos-build.py', 'joystick-games/tools/asset-policy.py', 'joystick-games/tools/qa-plan.py', 'joystick-games/catalog-registry.json', '.github/workflows/joystick-games-macos.yml', '.github/workflows/joystick-catalog-macos.yml']:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(name)
            with patch.object(builder, 'ROOT', root), patch.object(builder, 'SHARED', shared), patch.object(builder, 'REGISTRY', root / 'joystick-games/catalog-registry.json'):
                (game / 'package-lock.json').write_text('{"lockfileVersion":3}')
                frozen = builder.inputs(game)
                for name in ['joystick-games/shared/crisp/vendor/engine.js', 'joystick-games/shared/crisp/tv.js', 'joystick-games/tools/qa-plan.py', 'joystick-games/catalog-registry.json', '.github/workflows/joystick-catalog-macos.yml']:
                    self.assertIn(name, frozen)
                self.assertIn('joystick-games/sample/package-lock.json', frozen)
                dependencies = root / 'external-node-modules'
                dependencies.mkdir()
                (dependencies / 'installed.js').write_text('installed dependency')
                (game / 'node_modules').symlink_to(dependencies, target_is_directory=True)
                self.assertEqual(builder.inputs(game), frozen, 'Root dependency symlink is not source')
                link = game / 'src/alias.js'
                link.symlink_to(dependencies / 'installed.js')
                with self.assertRaises(AssertionError):
                    builder.inputs(game)
                link.unlink()
                link = game / 'other-source.js'
                link.symlink_to(dependencies / 'installed.js')
                with self.assertRaises(AssertionError):
                    builder.inputs(game)
                link.unlink()
                (root / 'joystick-games/shared/crisp/new.js').write_text('new production asset')
                self.assertNotEqual(builder.inputs(game), frozen)


if __name__ == '__main__':
    unittest.main()
