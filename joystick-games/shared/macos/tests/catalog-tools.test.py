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
            for name in ['joystick-games/shared/macos/Sources/main.swift', 'joystick-games/shared/web/input.js', 'joystick-games/shared/crisp/vendor/engine.js', 'joystick-games/shared/crisp/tv.js', 'joystick-games/sample/src/game.js', 'joystick-games/sample/dist/tv.html', 'joystick-games/sample/game.json', 'joystick-games/sample/qa-plan.json', 'puretv-joystick/joystick_sdk.py', 'joystick-games/tools/macos-build.py', 'joystick-games/tools/qa-plan.py', 'joystick-games/catalog-registry.json', '.github/workflows/joystick-games-macos.yml', '.github/workflows/joystick-catalog-macos.yml']:
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
