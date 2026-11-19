#!/usr/bin/env python3
"""Display-mode selection/cleanup tests with a fake API, not native Windows QA."""
import copy,ctypes,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('display',ROOT/'joystick-games/tools/windows-display.py');display=importlib.util.module_from_spec(spec);spec.loader.exec_module(display)
def mode(width,height,frequency=60):return {'width':width,'height':height,'bitsPerPixel':32,'frequency':frequency,'orientation':0}
class Fake:
    def __init__(self):self.current=mode(1024,768);self.available=[mode(1024,768),mode(1600,900),mode(1920,1080)];self.calls=[];self.fail_test=False;self.fail_apply=False;self.fail_restore=False
    def snapshot(self):return {'currentMode':copy.deepcopy(self.current),'screenPixels':[self.current['width'],self.current['height']],'virtualScreenPixels':[self.current['width'],self.current['height']],'workArea':{'left':0,'top':0,'right':self.current['width'],'bottom':self.current['height']-40}}
    def modes(self):return copy.deepcopy(self.available)
    def change(self,value,test=False):
        self.calls.append((copy.deepcopy(value),test))
        if test:return -2 if self.fail_test else 0
        if value['width']==1024 and self.fail_restore:return -1
        self.current=copy.deepcopy(value)
        return -1 if value['width']!=1024 and self.fail_apply else 0
class Display(unittest.TestCase):
    def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'original-display.json';self.api=Fake();self.session=display.DisplaySession(self.path,self.api)
    def tearDown(self):self.tmp.cleanup()
    def test_exact_windows_devmode_layout(self):
        self.assertEqual(ctypes.sizeof(display.DevMode),220);self.assertEqual(display.DevMode.pelsWidth.offset,172);self.assertEqual(display.DevMode.displayFrequency.offset,184)
    def test_only_enumerated_adequate_mode_is_selected_and_original_restored(self):
        self.session.prepare();self.assertEqual(self.api.current['width'],1600);self.assertEqual(self.api.calls[0][1],True);self.session.restore();self.assertEqual(self.api.current,mode(1024,768));record=json.loads(self.path.read_text());self.assertTrue(record['originalModeRestored']);self.assertFalse(record['persistentRegistryChange']);self.assertEqual(len(record['enumeratedModes']),3)
    def test_missing_adequate_mode_fails_without_forcing_unsupported_resolution(self):
        self.api.available=[mode(1024,768)]
        with self.assertRaises(AssertionError):self.session.prepare()
        self.session.restore();self.assertEqual(self.api.calls,[]);self.assertEqual(json.loads(self.path.read_text())['status'],'failed')
    def test_test_failure_prevents_apply(self):
        self.api.fail_test=True
        with self.assertRaises(AssertionError):self.session.prepare()
        self.session.restore();self.assertEqual(len(self.api.calls),1);self.assertEqual(self.api.calls[0][1],True)
    def test_failed_apply_also_attempts_original_restore(self):
        self.api.fail_apply=True
        with self.assertRaises(AssertionError):self.session.prepare()
        self.session.restore();self.assertEqual(self.api.current,mode(1024,768));self.assertEqual(json.loads(self.path.read_text())['applyReturnCode'],-1)
    def test_restore_failure_blocks_even_if_setup_succeeded(self):
        self.session.prepare();self.api.fail_restore=True
        with self.assertRaises(AssertionError):self.session.restore()
        self.assertEqual(json.loads(self.path.read_text())['status'],'failed');self.assertNotIn('originalModeRestored',self.session.report)
    def test_existing_large_desktop_is_observed_without_changes(self):
        self.api.current=mode(1920,1080);self.session.prepare();self.session.restore();self.assertEqual(self.api.calls,[])
if __name__=='__main__':unittest.main()
