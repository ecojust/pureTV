#!/usr/bin/env python3
"""Contract/proxy tests. These do not claim actual Android gameplay acceptance."""
import importlib.util
import json
import socketserver
import tempfile
import threading
import time
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('android_acceptance', HERE/'run.py')
runner = importlib.util.module_from_spec(spec); spec.loader.exec_module(runner)

class AckFixture(socketserver.StreamRequestHandler):
    def handle(self):
        for line in self.rfile:
            event = json.loads(line)
            if event.get('key') == getattr(self.server, 'drop_key', None):
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

if __name__=='__main__': unittest.main(verbosity=2)
