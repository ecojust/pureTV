#!/usr/bin/env python3
"""Contract/proxy tests. These do not claim actual Android gameplay acceptance."""
import importlib.util
import copy
import json
import socketserver
import tempfile
import threading
import time
import unittest
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
            self.wfile.write(reply[:4]); self.wfile.flush()
            self.wfile.write(reply[4:]); self.wfile.flush()

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
        acceptance.snapshot = lambda: next(samples)
        found = acceptance.wait_fresh(snapshot(8, False), lambda s: s['game']['actualAction'], timeout=2, label='fixture-action')
        self.assertEqual(found['game']['controller']['pollCount'], 10)
        self.assertEqual(acceptance.report['freshnessChecks'][0]['beforePollCount'], 8)
        self.assertEqual(acceptance.report['freshnessChecks'][0]['afterPollCount'], 10)

    def test_stalled_frame_times_out_even_when_action_value_is_true(self):
        acceptance = runner.Acceptance.__new__(runner.Acceptance)
        acceptance.report = {}; acceptance.snapshots = []
        stale = {'game': {'controller': {'pollCount': 8}, 'actualAction': True}}
        acceptance.snapshot = lambda: stale
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

if __name__=='__main__': unittest.main(verbosity=2)
