#!/usr/bin/env python3
"""Contract/proxy tests. These do not claim actual Android gameplay acceptance."""
import importlib.util
import copy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import socketserver
import tempfile
import threading
import time
import unittest
from unittest import mock
from types import SimpleNamespace
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('android_acceptance', HERE/'run.py')
runner = importlib.util.module_from_spec(spec); spec.loader.exec_module(runner)

class AckFixture(socketserver.StreamRequestHandler):
    def handle(self):
        for line in self.rfile:
            event = json.loads(line)
            if self.server.drop_key is not None and event.get('key') == self.server.drop_key:
                continue
            reply = (json.dumps({'type':'ack','seq':event['seq']})+'\n').encode()
            # Deliberate fragmentation validates real TCP line assembly.
            try:
                self.wfile.write(reply[:4]); self.wfile.flush()
                self.wfile.write(reply[4:]); self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                # The missing-ACK negative case deliberately closes its TCP client.
                return

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

class Contracts(unittest.TestCase):
    def proxy_case(self, drop=None):
        directory = tempfile.TemporaryDirectory(prefix='joystick-proxy-', dir='/dev/shm')
        server = Server(('127.0.0.1',0), AckFixture); server.drop_key = drop
        threading.Thread(target=server.serve_forever, daemon=True).start()
        proxy = runner.WireProxy(server.server_address, Path(directory.name)/'wire.jsonl')
        client = runner.JoystickClient('127.0.0.1',proxy.port)
        def wait_for_replies(expected):
            until=time.monotonic()+4
            while time.monotonic()<until:
                result=proxy.summary()
                if result['sdkMessages']==expected and (drop or result['matchingAcks']==expected):
                    return
                time.sleep(.02)
            self.fail('Fragmented ACK fixture did not finish: '+repr(proxy.summary()))
        try:
            client.connect()
            for key in runner.KEYS:
                client.button(key,'down'); client.button(key,'long_press',600); client.button(key,'long_release',610)
            client.ping(); wait_for_replies(38); client.disconnect()
            client.connect(); client.ping(); wait_for_replies(49)
            summary = proxy.summary()
            self.assertEqual(summary['keysSent'],sorted(runner.KEYS))
            self.assertEqual(summary['sdkMessages'],49)
            self.assertEqual(summary['errors'],[])
            self.assertTrue(all(json.loads(r['line']) == r['message'] for r in proxy.records))
            if drop:
                self.assertGreater(len(summary['missingAcks']),0)
                self.assertLess(summary['matchingAcks'],summary['sdkMessages'])
            else:
                self.assertEqual(summary['matchingAcks'],49)
                self.assertEqual(summary['missingAcks'],[])
        finally:
            client.disconnect(); proxy.close(); server.shutdown(); server.server_close(); directory.cleanup()

    def test_original_sdk_frames_and_fragmented_acks(self): self.proxy_case()
    def test_missing_ack_is_not_invented(self): self.proxy_case('X')

    def test_observer_is_read_only(self):
        text=(HERE/'src/com/ecojust/controllerqa/Observer.java').read_text()
        self.assertIn('window.JoystickGameQA.snapshot()',text)
        self.assertEqual(text.count('web.evaluateJavascript('),1)
        self.assertIn('GET /snapshot HTTP/1.1',text)
        self.assertIn('GET /status HTTP/1.1',text)
        self.assertNotIn('POST ',text)
        self.assertNotIn('dispatchEvent',text)
        self.assertNotIn('PureGameHost.snapshot()',text)
        self.assertNotIn('window.__game',text)
        self.assertNotIn('window.game',text)
        self.assertIn('getInfo()',text)

    def test_runner_input_is_original_sdk(self):
        text=(HERE/'run.py').read_text()
        self.assertIn('from joystick_sdk import JoystickClient, KEYS',text)
        for forbidden in ['evaluateJavascript(', 'fastForward(', 'window.__game', 'window.game', 'touchscreen', 'input keyevent', 'model.step(']:
            self.assertNotIn(forbidden,text)
        self.assertIn("'modelWrites': False",text)
        self.assertIn("'clockOverrides': False",text)

    def test_pause_contracts_match_both_games(self):
        self.assertTrue(runner.Acceptance.paused({'game':{'stage':'pause','paused':True}}))
        self.assertTrue(runner.Acceptance.paused({'game':{'stage':'paused','paused':True}}))
        self.assertFalse(runner.Acceptance.paused({'game':{'stage':'menu','paused':False}}))

    def test_identity_requires_icon_and_full_dom_id(self):
        row={'controllerId':'virtual-123456789012','idText':'virtual-123456789012','visible':True,'iconVisible':True}
        sample={'page':{'controllerClients':{'containers':[{'visible':True,'rows':[row]}]}}}
        self.assertEqual(runner.Acceptance.visible_ids(sample),[row['controllerId']])
        row['idText']='virtual-123...'; self.assertEqual(runner.Acceptance.visible_ids(sample),[])
        row['idText']=row['controllerId']; row['iconVisible']=False
        self.assertEqual(runner.Acceptance.visible_ids(sample),[])

    def test_actual_android_failed_snapshots_have_exact_prefixed_complete_id(self):
        fixture=json.loads((HERE/'fixtures/id-dom-run-44110295680.json').read_text())
        self.assertEqual(len(fixture['cases']),2)
        for case in fixture['cases']:
            self.assertEqual(runner.Acceptance.visible_ids(case['snapshot']),[case['expectedControllerId']])
            row=case['snapshot']['page']['controllerClients']['containers'][0]['rows'][0]
            self.assertEqual(row['idText'],'ID: '+case['expectedControllerId'])

    def test_prefixed_id_rejects_truncation_extra_text_and_wrong_identity(self):
        identity='virtual-2c074df64494'
        row={'controllerId':identity,'idText':'ID: '+identity}
        self.assertTrue(runner.Acceptance.full_id_text(row))
        for bad in ['ID: virtual-2c074df…','ID: virtual-2c074df64493','ID: '+identity+'suffix',
                    'prefix ID: '+identity, 'ID: '+identity[:-1], 'ID: '+identity+' ', None, '']:
            row['idText']=bad; self.assertFalse(runner.Acceptance.full_id_text(row),bad)
        self.assertFalse(runner.Acceptance.full_id_text({'controllerId':'','idText':'ID: '}))

    def test_freshness_rejects_stale_missing_boolean_and_reset_counters(self):
        before = {'game': {'controller': {'pollCount': 8}}}
        for value in [None, True, False, 7, 8]:
            after = {'game': {'controller': {'pollCount': value}}}
            self.assertFalse(runner.Acceptance.frame_advanced(after, before))
        self.assertTrue(runner.Acceptance.frame_advanced({'game': {'controller': {'pollCount': 9}}}, before))
        self.assertFalse(runner.Acceptance.frame_advanced({'game': {'controller': {'pollCount': 9}}}, before, frames=3))
        self.assertTrue(runner.Acceptance.frame_advanced({'game': {'controller': {'pollCount': 11}}}, before, frames=3))

    def test_wait_fresh_rejects_stale_success_and_fresh_non_action(self):
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        acceptance.report = {}; acceptance.snapshots = []
        def snapshot(count, action): return {'game': {'controller': {'pollCount': count}, 'actualAction': action}}
        samples = iter([snapshot(8, True), snapshot(9, False), snapshot(10, True)])
        acceptance.snapshot = lambda **_kwargs: next(samples)
        found = acceptance.wait_fresh(snapshot(8, False), lambda s: s['game']['actualAction'], timeout=2, label='fixture-action')
        self.assertEqual(found['game']['controller']['pollCount'], 10)
        self.assertEqual(acceptance.report['freshnessChecks'][0]['beforePollCount'], 8)
        self.assertEqual(acceptance.report['freshnessChecks'][0]['afterPollCount'], 10)

    def test_stalled_frame_times_out_even_when_action_value_is_true(self):
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        acceptance.report = {}; acceptance.snapshots = []
        stale = {'game': {'controller': {'pollCount': 8}, 'actualAction': True}}
        acceptance.snapshot = lambda **_kwargs: stale
        with self.assertRaisesRegex(AssertionError, 'timed out'):
            acceptance.wait_fresh(stale, lambda s: s['game']['actualAction'], timeout=.02, label='stalled-fixture')
        self.assertEqual(acceptance.snapshots[0]['snapshot'], stale)
        self.assertNotIn('freshnessChecks', acceptance.report)

    def test_sync_observation_requires_ack_for_matching_connection_and_sequence(self):
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        client = SimpleNamespace(identity='virtual-test')
        sent = {'direction':'sdk-to-game','connection':1,'message':{'controller_id':client.identity,'seq':12}}
        wrong_connection = {'direction':'game-to-sdk','connection':2,'message':{'type':'ack','seq':12}}
        wrong_sequence = {'direction':'game-to-sdk','connection':1,'message':{'type':'ack','seq':11}}
        acceptance.proxy = SimpleNamespace(lock=threading.Lock(), records=[sent,wrong_connection,wrong_sequence])
        with self.assertRaisesRegex(AssertionError,'ACK did not arrive'):
            acceptance.wait_sent_ack(client,12,timeout=.02)
        acceptance.proxy.records.append({'direction':'game-to-sdk','connection':1,'message':{'type':'ack','seq':12}})
        acceptance.wait_sent_ack(client,12,timeout=.02)

    def single_seat_cases(self):
        return json.loads((HERE/'fixtures/single-seat-run-44115154856.json').read_text())['cases']

    def wire_summary(self, case, expected=True):
        proxy = runner.WireProxy.__new__(runner.WireProxy)
        proxy.lock = threading.Lock(); proxy.records = case['wire']; proxy.errors = []
        proxy.expected_busy_ids = {case['rejectedId']} if expected else set()
        return proxy.summary()

    def test_real_single_seat_rejections_are_separate_from_primary_acks(self):
        for case in self.single_seat_cases():
            summary = self.wire_summary(case)
            primary_count = sum(r['direction']=='sdk-to-game' and r['connection']==1 for r in case['wire'])
            self.assertEqual(summary['matchingAcks'], primary_count)
            self.assertEqual(summary['acceptedSdkMessages'], primary_count)
            self.assertEqual(summary['sdkMessages'], primary_count + summary['rejectedSdkMessages'])
            self.assertEqual(summary['missingAcks'], [])
            self.assertEqual(summary['unexpectedReplies'], [])
            self.assertEqual(summary['duplicateAcks'], [])
            self.assertEqual(len(summary['rejectedConnections']), 1)
            rejected = summary['rejectedConnections'][0]
            self.assertEqual(rejected['controllerId'], case['rejectedId'])
            self.assertEqual(rejected['response'], {'type':'error','message':'controller_busy','seq':1})
            self.assertEqual(summary['hostReplies'], primary_count + 1)

    def test_busy_must_be_expected_and_match_hello_identity_connection_and_sequence(self):
        original = self.single_seat_cases()[0]
        unregistered = self.wire_summary(original, expected=False)
        self.assertEqual(unregistered['rejectedConnections'], [])
        self.assertTrue(unregistered['unexpectedReplies'])
        for mutation in ['non-busy', 'wrong-seq', 'boolean-seq', 'wrong-connection', 'wrong-identity', 'extra-ack']:
            case = copy.deepcopy(original)
            error = next(r for r in case['wire'] if r['direction']=='game-to-sdk' and r['connection']==2)
            if mutation == 'non-busy': error['message']['message'] = 'invalid_message'
            if mutation == 'wrong-seq': error['message']['seq'] = 2
            if mutation == 'boolean-seq': error['message']['seq'] = True
            if mutation == 'wrong-connection': error['connection'] = 3
            if mutation == 'wrong-identity': case['rejectedId'] = 'virtual-unrelated'
            if mutation == 'extra-ack': case['wire'].append({'direction':'game-to-sdk','connection':2,'message':{'type':'ack','seq':1}})
            result = self.wire_summary(case)
            self.assertEqual(result['rejectedConnections'], [], mutation)
            self.assertTrue(result['unexpectedReplies'], mutation)

    def test_busy_does_not_hide_missing_primary_ack_or_other_errors(self):
        original = self.single_seat_cases()[0]
        case = copy.deepcopy(original)
        first_ack = next(r for r in case['wire'] if r['direction']=='game-to-sdk' and r['connection']==1)
        case['wire'].remove(first_ack)
        result = self.wire_summary(case)
        self.assertEqual(len(result['rejectedConnections']), 1)
        self.assertEqual(result['missingAcks'], [{'connection':1,'seq':first_ack['message']['seq']}])
        for message in [{'type':'error','message':'controller_busy','seq':99}, {'type':'ack','seq':999}]:
            case = copy.deepcopy(original)
            case['wire'].append({'direction':'game-to-sdk','connection':1,'message':message})
            self.assertTrue(self.wire_summary(case)['unexpectedReplies'])
        case = copy.deepcopy(original); case['wire'].append(copy.deepcopy(first_ack))
        self.assertTrue(self.wire_summary(case)['duplicateAcks'])
        case = copy.deepcopy(original)
        ack = next(r['message'] for r in case['wire'] if r['direction']=='game-to-sdk' and r['connection']==1 and r['message']['seq']==1)
        ack['seq'] = True
        result = self.wire_summary(case)
        self.assertEqual(result['missingAcks'], [{'connection':1,'seq':1}])
        self.assertTrue(result['unexpectedReplies'])

    def test_rejected_connection_cannot_include_gameplay_or_another_identity(self):
        original = self.single_seat_cases()[0]
        for mutation in ['button-down', 'another-id', 'wrong-sync-key']:
            case = copy.deepcopy(original)
            sync = next(r['message'] for r in case['wire'] if r['direction']=='sdk-to-game' and r['connection']==2 and r['message']['type']=='button')
            if mutation == 'button-down': sync.update(action='down',pressed=True)
            if mutation == 'another-id': sync['controller_id'] = case['primaryId']
            if mutation == 'wrong-sync-key': sync['key'] = 'Y'
            self.assertEqual(self.wire_summary(case)['rejectedConnections'], [], mutation)

    def test_real_single_seat_snapshot_rejects_stolen_or_duplicate_identity(self):
        for case in self.single_seat_cases():
            snapshot = case['timeoutSnapshot']
            session = runner.Acceptance.single_seat_session(snapshot, case['primaryId'])
            self.assertTrue(session)
            self.assertIsNone(runner.Acceptance.single_seat_session(snapshot, case['rejectedId']))
            for mutation in ['wrong-seat', 'extra-player', 'missing-session', 'wrong-dom-seat', 'truncated-id']:
                bad = copy.deepcopy(snapshot)
                player = bad['game']['controller']['players'][0]
                row = bad['page']['controllerClients']['containers'][0]['rows'][0]
                if mutation == 'wrong-seat': player['id'] = 2
                if mutation == 'extra-player': bad['game']['controller']['players'].append(copy.deepcopy(player))
                if mutation == 'missing-session': player['session'] = ''
                if mutation == 'wrong-dom-seat': row['playerId'] = 2
                if mutation == 'truncated-id': row['idText'] = 'ID: virtual-...'
                self.assertIsNone(runner.Acceptance.single_seat_session(bad,case['primaryId']),mutation)


class CatalogContracts(unittest.TestCase):
    def acceptance(self):
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        acceptance.args = SimpleNamespace(game='fixture-game')
        acceptance.plan = {'renderer': 'canvas2d', 'pauseStablePaths': ['gameplay.tick']}
        return acceptance

    def snapshot(self):
        return {'game': {'game': 'fixture-game', 'renderer': 'canvas2d', 'stage': 'menu', 'paused': False,
                         'frames': 10, 'gameplay': {'tick': 0}, 'errors': []},
                'page': {'canvases': [{'width': 960, 'height': 540, 'visible': True}]}}

    def test_canvas_game_does_not_require_a_webgl_context(self):
        acceptance = self.acceptance(); snapshot = self.snapshot()
        snapshot['game']['webglVersion'] = None
        acceptance.validate_catalog_snapshot(snapshot)

    def test_numeric_and_driver_string_versions_require_the_matching_webgl_renderer(self):
        for version in (1, 2):
            acceptance = self.acceptance(); acceptance.plan['renderer'] = 'webgl' + str(version)
            snapshot = self.snapshot(); snapshot['game']['renderer'] = acceptance.plan['renderer']
            for actual in (version, 'WebGL ' + str(version), 'WebGL ' + str(version) + '.0 (OpenGL ES Chromium)'):
                snapshot['game']['webglVersion'] = actual
                acceptance.validate_catalog_snapshot(snapshot)
            for invalid in (None, True, False, float(version), 0, 3, 3-version, '', str(version),
                            'WebGL ' + str(3-version) + '.0', 'WebGL ' + str(version) + '0.0',
                            'WebGL ' + str(version) + '.1', 'WebGL unavailable'):
                snapshot['game']['webglVersion'] = invalid
                with self.assertRaises(AssertionError, msg=repr(invalid)):
                    acceptance.validate_catalog_snapshot(snapshot)

    def test_all_four_original_triptych_webgl_observations_match_their_frozen_plans(self):
        fixtures = json.loads((HERE/'fixtures/catalog-webgl-versions.json').read_text())
        self.assertEqual(len(fixtures['cases']), 4)
        for case in fixtures['cases']:
            acceptance = self.acceptance(); acceptance.args.game = case['game']
            acceptance.plan = runner.plan.load_plan(runner.ROOT/'joystick-games'/case['game']/'qa-plan.json')
            snapshot = self.snapshot(); snapshot['game'] = case['browserObservation']
            acceptance.validate_catalog_snapshot(snapshot)

    def test_failed_renderer_wrong_game_and_missing_actual_model_are_rejected(self):
        for mutation in ('error', 'wrong-game', 'missing-state', 'null-state', 'invisible-canvas', 'wrong-renderer'):
            snapshot = self.snapshot()
            if mutation == 'error': snapshot['game']['errors'] = ['Renderer failed']
            if mutation == 'wrong-game': snapshot['game']['game'] = 'another-game'
            if mutation == 'missing-state': snapshot['game']['gameplay'] = {}
            if mutation == 'null-state': snapshot['game'].update(stage='paused', paused=True); snapshot['game']['gameplay']['tick'] = None
            if mutation == 'invisible-canvas': snapshot['page']['canvases'][0]['visible'] = False
            if mutation == 'wrong-renderer': snapshot['game']['renderer'] = 'webgl2'
            with self.assertRaises((AssertionError, ValueError), msg=mutation):
                self.acceptance().validate_catalog_snapshot(snapshot)

    def test_observer_never_allocates_canvas_context_for_diagnostics(self):
        text = (HERE/'src/com/ecojust/controllerqa/Observer.java').read_text()
        self.assertIn('canvases:Array.prototype.map.call', text)
        self.assertNotIn('.getContext(', text)

    def test_pause_observation_is_mandatory_and_cannot_pass_missing_values(self):
        plan = {'schemaVersion': 1, 'renderer': 'canvas2d', 'pauseStablePaths': ['gameplay.tick'],
                'steps': [{'name': 'actual movement', 'keys': ['A'], 'holdMs': 100,
                           'expect': [{'path': 'gameplay.position', 'op': 'changed'}]}]}
        runner.plan.validate_plan(plan)
        self.assertFalse(runner.plan.matches(plan['steps'][0]['expect'], {'gameplay': {}}, {'gameplay': {}}))
        plan['pauseStablePaths'] = []
        with self.assertRaises(AssertionError): runner.plan.validate_plan(plan)


class InstallationSetup(unittest.TestCase):
    class LaunchReached(Exception):
        pass

    def setup_case(self, slug, occupied=False, reset_stdout=b'Success\n', reset_exit=0, initial=None):
        """Run the real setup until instrumentation launch against a stateful ADB fixture."""
        directory = tempfile.TemporaryDirectory(prefix='joystick-install-', dir='/dev/shm')
        self.addCleanup(directory.cleanup)
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        acceptance.out = Path(directory.name)
        acceptance.adb = ['fixture-adb', '-s', 'isolated-tv']
        acceptance.args = SimpleNamespace(game=slug, apk=Path('/fixture/game.apk'),
            observer=Path('/fixture/observer.apk'), occupy_default_port=occupied)
        acceptance.args.apk = acceptance.out/'game.apk'; acceptance.args.apk.write_bytes(b'fixture-game')
        acceptance.args.observer = acceptance.out/'observer.apk'; acceptance.args.observer.write_bytes(b'fixture-observer')
        acceptance.package = runner.PACKAGES[slug]
        acceptance.plan = None if slug in runner.build.LEGACY_PACKAGES else {'renderer': 'canvas2d'}
        acceptance.snapshots = []; acceptance.report = {'snapshots': acceptance.snapshots}; acceptance.tests = []
        if initial is not None:
            acceptance.plan = {'renderer': 'webgl2', 'pauseStablePaths': ['gameplay.tick']}
            def initial_observation(predicate, **kwargs):
                self.assertTrue(predicate(initial))
                return initial
            acceptance.wait = initial_observation
        state = {'gameInstalled': False, 'observerInstalled': False, 'stopped': False,
                 'storySeen': True, 'observerData': 'preserved', 'unrelatedData': 'preserved',
                 'cleared': [], 'launches': 0, 'forwards': 0}

        def adb(argv, **kwargs):
            self.assertEqual(argv[:3], acceptance.adb)
            command = argv[3:]
            stdout, status = b'', 0
            if command == ['wait-for-device']:
                pass
            elif command[:1] == ['install']:
                # Updating an installed APK preserves its existing story flag.
                if command[-1] == str(acceptance.args.apk): state['gameInstalled'] = True
                elif command[-1] == str(acceptance.args.observer): state['observerInstalled'] = True
                else: self.fail('Unexpected installed package')
            elif command[:3] == ['shell', 'am', 'force-stop']:
                self.assertTrue(state['gameInstalled'] and state['observerInstalled'])
                self.assertEqual(command[3:], [acceptance.package]); state['stopped'] = True
            elif command[:3] == ['shell', 'pm', 'clear']:
                self.assertTrue(state['stopped']); self.assertEqual(state['launches'], 0)
                self.assertEqual(command[3:], [acceptance.package])
                state['cleared'].append(command[3])
                stdout, status = reset_stdout, reset_exit
                if status == 0 and stdout.strip() == b'Success': state['storySeen'] = False
            elif command[:1] == ['forward']:
                state['forwards'] += 1; stdout = b'40123\n'
            else:
                self.fail('Unexpected ADB operation: ' + repr(command))
            return SimpleNamespace(returncode=status, stdout=stdout, stderr=b'fixture failure' if status else b'')

        def launch(argv, **kwargs):
            self.assertEqual(argv[:6], acceptance.adb + ['shell', 'am', 'instrument'])
            self.assertTrue(state['stopped'])
            if acceptance.plan:
                self.assertFalse(state['storySeen'], 'Story state must be reset before target launch')
                self.assertEqual(acceptance.report['installationSetup']['status'], 'passed')
            state['launches'] += 1
            if initial is not None: return SimpleNamespace()
            raise self.LaunchReached()

        error = None
        with mock.patch.object(runner.subprocess, 'run', side_effect=adb), \
                mock.patch.object(runner.subprocess, 'Popen', side_effect=launch):
            try:
                acceptance.setup()
            except (self.LaunchReached, AssertionError, RuntimeError) as caught:
                error = caught
            finally:
                if hasattr(acceptance, 'instrument_log'): acceptance.instrument_log.close()
        commands = [json.loads(line) for line in (acceptance.out/'adb-commands.jsonl').read_text().splitlines()]
        self.assertEqual(state['observerData'], 'preserved')
        self.assertEqual(state['unrelatedData'], 'preserved')
        return acceptance, state, error, commands

    def test_failed_initial_context_validation_preserves_the_actual_observation(self):
        initial = {'game': {'game': 'phosphor-patrol', 'renderer': 'webgl2', 'webglVersion': 1,
            'stage': 'menu', 'paused': False, 'frames': 2, 'gameplay': {'tick': 0},
            'controller': {'pollCount': 2}, 'errors': []},
            'info': {'wifiController': {'port': 63485, 'serviceType': '_puretv._tcp', 'version': '1'}},
            'page': {'canvases': [{'width': 960, 'height': 540, 'visible': True}]}}
        acceptance, state, error, _ = self.setup_case('phosphor-patrol', initial=initial)
        self.assertIsInstance(error, AssertionError)
        self.assertIn('No matching initialized WebGL context', str(error))
        self.assertEqual(state['forwards'], 1)  # Observer only; no controller connection yet.
        saved = json.loads((acceptance.out/'report.json').read_text())
        self.assertEqual(saved['snapshots'][0]['label'], 'initial-menu')
        self.assertEqual(saved['snapshots'][0]['snapshot'], initial)

    def test_each_catalog_scenario_clears_only_target_before_launch(self):
        for occupied in (False, True):
            acceptance, state, error, commands = self.setup_case('starblazer-86', occupied)
            self.assertIsInstance(error, self.LaunchReached)
            self.assertEqual(state['launches'], 1)
            self.assertEqual(state['cleared'], [acceptance.package])
            self.assertFalse(state['storySeen'])
            self.assertEqual(acceptance.report['installationSetup']['phase'], 'before-target-launch')
            reset = next(item for item in commands if item['command'][3:6] == ['shell', 'pm', 'clear'])
            self.assertEqual(reset['stdout'], 'Success\n')
            self.assertEqual(reset['exitCode'], 0)

    def test_failed_or_unconfirmed_reset_blocks_instrumentation_and_game_launch(self):
        for stdout, code in [(b'Failed\n', 0), (b'', 0), (b'Success\nextra output\n', 0), (b'Success\n', 1)]:
            acceptance, state, error, _ = self.setup_case('starblazer-86', reset_stdout=stdout, reset_exit=code)
            self.assertIsInstance(error, (AssertionError, RuntimeError))
            self.assertEqual(state['launches'], 0)
            self.assertEqual(state['forwards'], 0)
            self.assertTrue(state['storySeen'])
            self.assertEqual(acceptance.report['installationSetup']['status'], 'failed')
            saved = json.loads((acceptance.out/'report.json').read_text())
            self.assertEqual(saved['installationSetup']['status'], 'failed')

    def test_legacy_games_keep_existing_install_and_data_behavior(self):
        for slug in runner.build.LEGACY_PACKAGES:
            acceptance, state, error, _ = self.setup_case(slug)
            self.assertIsInstance(error, self.LaunchReached)
            self.assertEqual(state['launches'], 1)
            self.assertEqual(state['cleared'], [])
            self.assertTrue(state['storySeen'])
            self.assertNotIn('installationSetup', acceptance.report)

class InstallationBudgetTests(unittest.TestCase):
    def test_actual_size_budget_preserves_small_floor_and_existing_hard_limit(self):
        for size, expected in [(1, 45), (1_124_106, 45), (7_000_000, 45),
                               (8_000_000, 46), (10_000_000, 50),
                               (105_020_455, 240), (127_999_999, 240)]:
            self.assertEqual(runner.install_timeout(size), expected)
        for size in [0, -1, True, 1.5, 128_000_000, 128_000_001]:
            with self.assertRaises(AssertionError): runner.install_timeout(size)

    def fixture(self):
        directory = tempfile.TemporaryDirectory(prefix='joystick-install-budget-', dir='/dev/shm')
        self.addCleanup(directory.cleanup)
        a = runner.Acceptance.__new__(runner.Acceptance)
        a.out = Path(directory.name); a.adb = ['fixture-adb']
        apk = a.out/'original-large.apk'
        with apk.open('wb') as stream: stream.truncate(105_020_455)
        return a, apk

    def test_only_install_uses_file_size_and_nonzero_exit_still_fails(self):
        a, apk = self.fixture()
        outputs = [SimpleNamespace(returncode=0, stdout=b'Success\n', stderr=b''),
                   SimpleNamespace(returncode=0, stdout=b'', stderr=b''),
                   SimpleNamespace(returncode=1, stdout=b'', stderr=b'INSTALL_FAILED_INVALID_APK')]
        with mock.patch.object(runner.subprocess, 'run', side_effect=outputs) as process:
            self.assertEqual(a.command('install', '-r', str(apk)), b'Success\n')
            a.command('shell', 'am', 'force-stop', 'com.ecojust.joystick.backroadrally')
            with self.assertRaisesRegex(RuntimeError, 'INSTALL_FAILED_INVALID_APK'):
                a.command('install', '-r', str(apk))
            self.assertEqual([call.kwargs['timeout'] for call in process.call_args_list], [240, 45, 240])
            with apk.open('r+b') as stream: stream.truncate(128_000_000)
            with self.assertRaises(AssertionError): a.command('install', '-r', str(apk))
            self.assertEqual(process.call_count, 3)
        rows = [json.loads(s) for s in (a.out/'adb-commands.jsonl').read_text().splitlines()]
        self.assertEqual(rows[0]['apkBytes'], 105_020_455)
        self.assertNotIn('apkBytes', rows[1])
        self.assertEqual(rows[2]['exitCode'], 1)

    def test_real_process_timeout_preserves_partial_output_and_does_not_retry(self):
        a, apk = self.fixture()
        script = a.out/'slow-adb.py'
        script.write_text("import sys,time\nprint('Performing Streamed Install',flush=True)\nprint('still pending',file=sys.stderr,flush=True)\ntime.sleep(10)\n")
        a.adb = [runner.sys.executable, str(script)]
        started = time.monotonic()
        with mock.patch.object(runner, 'install_timeout', return_value=.2):
            with self.assertRaises(runner.subprocess.TimeoutExpired):
                a.command('install', '-r', str(apk))
        self.assertLess(time.monotonic()-started, 3)
        rows = [json.loads(s) for s in (a.out/'adb-commands.jsonl').read_text().splitlines()]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['status'], 'timed-out')
        self.assertIsNone(rows[0]['exitCode'])
        self.assertEqual(rows[0]['errorType'], 'TimeoutExpired')
        self.assertIn('Performing Streamed Install', rows[0]['stdout'])
        self.assertIn('still pending', rows[0]['stderr'])

    def test_original_backroad_install_failures_remain_failures(self):
        fixture = json.loads((HERE/'fixtures/install-timeout-run-44599353036.json').read_text())
        self.assertEqual(fixture['runId'], 44599353036)
        self.assertEqual(fixture['apk']['bytes'], 105_020_455)
        for mode in fixture['modes']:
            self.assertEqual(mode['originalStatus'], 'failed')
            self.assertEqual(mode['pythonException'], 'TimeoutExpired')
            self.assertEqual(mode['originalInstallTimeoutSeconds'], 45)
            self.assertEqual(mode['testsExecuted'], 0)
            self.assertEqual(mode['snapshotsCaptured'], 0)
            self.assertEqual(mode['gameplayScenariosExecuted'], False)


class ObserverTransportTests(unittest.TestCase):
    class HttpFixture(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def do_GET(self):
            with self.server.action_lock:
                self.server.requests.append((self.command, self.path))
                action, value = self.server.actions.pop(0)
            if action == 'close':
                self.close_connection = True
                return  # Same EOF-before-status behavior as the original Observer timeout.
            if action == 'slow':
                time.sleep(value)
                action, value = 'json', {'late': True}
            body = value if action == 'invalid' else json.dumps(value).encode()
            try:
                self.send_response(503 if action == 'status' else 200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers(); self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass  # The bounded-timeout negative test deliberately closes its socket.

    def serve(self, actions):
        server = ThreadingHTTPServer(('127.0.0.1', 0), self.HttpFixture)
        server.daemon_threads = True
        server.actions = list(actions); server.requests = []; server.action_lock = threading.Lock()
        thread = threading.Thread(target=lambda: server.serve_forever(poll_interval=.01), daemon=True)
        thread.start()
        self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        return server

    def acceptance(self, server):
        a = runner.Acceptance.__new__(runner.Acceptance)
        a.observer_port = server.server_address[1]; a.service_port = 63485
        a.report = {}; a.snapshots = []
        return a

    def value(self, count=12):
        return {'info': {'wifiController': {'port': 63485}},
                'game': {'game': 'dirt-crown', 'renderer': 'webgl2', 'webglVersion': 2,
                         'stage': 'playing', 'paused': False, 'frames': count,
                         'gameplay': {'time': 2}, 'controller': {'pollCount': count}},
                'page': {'canvases': [{'width': 1280, 'height': 720, 'visible': True}]}}

    def test_real_http_eof_is_recorded_then_new_response_returned(self):
        expected = self.value(31)
        server = self.serve([('close', None), ('json', expected)])
        acceptance = self.acceptance(server)
        self.assertEqual(acceptance.snapshot(), expected)
        self.assertEqual(server.requests, [('GET', '/snapshot')]*2)
        events = acceptance.report['observerTransportEvents']
        self.assertEqual([x['status'] for x in events], ['transport-failed', 'transport-recovered'])
        self.assertEqual(events[0]['errorType'], 'RemoteDisconnected')
        self.assertIn('Remote end closed connection without response', events[0]['error'])
        self.assertTrue(events[1]['responseFromNewGet'])

    def test_permanent_eof_exhausts_three_attempts_and_never_uses_prior_snapshot(self):
        server = self.serve([('json', self.value(12)), *[('close', None)]*3])
        acceptance = self.acceptance(server)
        self.assertEqual(acceptance.snapshot(), self.value(12))
        with self.assertRaises(runner.RemoteDisconnected): acceptance.snapshot()
        self.assertEqual(len(server.requests), 4)
        events = acceptance.report['observerTransportEvents']
        self.assertEqual([x['attempt'] for x in events], [1, 2, 3])
        self.assertFalse(events[-1]['retryScheduled'])
        self.assertTrue(all(x['snapshotCall'] == 2 for x in events))

    def test_real_socket_timeout_is_recorded_and_recovers_with_fresh_get(self):
        server = self.serve([('slow', .1), ('json', self.value(44))])
        acceptance = self.acceptance(server)
        with mock.patch.object(runner, 'OBSERVER_REQUEST_TIMEOUT', .03):
            self.assertEqual(acceptance.snapshot(timeout=.8), self.value(44))
        events = acceptance.report['observerTransportEvents']
        self.assertIn(events[0]['errorType'], ('TimeoutError', 'URLError'))
        self.assertEqual(events[1]['status'], 'transport-recovered')

    def test_invalid_json_and_explicit_http_error_are_not_retried(self):
        for action, value, error in [('invalid', b'{', json.JSONDecodeError), ('status', {'error': 'observer failure'}, runner.HTTPError)]:
            server = self.serve([(action, value), ('json', self.value())])
            acceptance = self.acceptance(server)
            with self.assertRaises(error): acceptance.snapshot()
            self.assertEqual(len(server.requests), 1)
            self.assertNotIn('observerTransportEvents', acceptance.report)

    def test_recovered_response_still_rejects_changed_service_port(self):
        wrong = self.value(); wrong['info']['wifiController']['port'] = 63500
        server = self.serve([('close', None), ('json', wrong)])
        with self.assertRaisesRegex(AssertionError, 'changed controller TCP port'):
            self.acceptance(server).snapshot()
        self.assertEqual(len(server.requests), 2)

    def test_recovered_response_still_requires_correct_game_identity(self):
        wrong = self.value(); wrong['game']['game'] = 'another-game'
        server = self.serve([('close', None), ('json', wrong)])
        acceptance = self.acceptance(server)
        acceptance.args = SimpleNamespace(game='dirt-crown')
        acceptance.plan = {'renderer': 'webgl2', 'pauseStablePaths': ['gameplay.time']}
        with self.assertRaisesRegex(AssertionError, 'identity mismatch'):
            acceptance.validate_catalog_snapshot(acceptance.snapshot())
        self.assertEqual(len(server.requests), 2)

    def test_wait_deadline_bounds_nested_snapshot_request(self):
        server = self.serve([('slow', .3)])
        acceptance = self.acceptance(server); started = time.monotonic()
        with self.assertRaisesRegex(AssertionError, 'timed out'):
            acceptance.wait(lambda _value: True, timeout=.08, label='bounded-observer')
        self.assertLess(time.monotonic()-started, .6)
        self.assertEqual(len(server.requests), 1)
        event = acceptance.report['observerTransportEvents'][0]
        self.assertLessEqual(event['requestTimeoutSeconds'], .08)
        self.assertFalse(event['retryScheduled'])

    def test_original_ci_failure_fixture_is_transport_timeout_not_a_pass(self):
        fixture = json.loads((HERE/'fixtures/observer-timeout-run-44600442272.json').read_text())
        self.assertEqual(fixture['runId'], 44600442272)
        self.assertEqual(len(fixture['modes']), 2)
        for mode in fixture['modes']:
            self.assertEqual(mode['originalStatus'], 'failed')
            self.assertEqual(mode['pythonException'], 'RemoteDisconnected')
            self.assertIn('WebView snapshot timed out', mode['observerLog'])
            self.assertEqual(mode['originalGameplayScenariosExecuted'], False)

if __name__=='__main__': unittest.main(verbosity=2)
