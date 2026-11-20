"""Injected window API boundary checks; never claims actual Win32 execution."""
import importlib.util,unittest
from pathlib import Path
path=Path(__file__).with_name('navigation-observation.py')
spec=importlib.util.spec_from_file_location('navigation_observation',path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class API:
    def __init__(self,windows):self.windows=windows;self.observed=[]
    def enumerate(self,parent,visit):
        for hwnd,row in self.windows.items():
            if row.get('parent')==parent and not visit(hwnd):break
    def pid(self,hwnd):return self.windows[hwnd]['pid']
    def class_name(self,hwnd):return self.windows[hwnd]['class']
    def describe(self,hwnd):
        self.observed.append(hwnd);return {'visible':True,'rect':{'left':0,'top':0,'right':640,'bottom':480},'text':self.windows[hwnd].get('text','window'),'textWin32Error':None,'environment':'must not appear'}

class Boundaries(unittest.TestCase):
    def test_only_owner_and_static_children(self):
        a=API({1:{'pid':17,'class':'#32770'},2:{'pid':99,'class':'other','text':'foreign secret'},3:{'pid':17,'class':'Static','parent':1,'text':'Cannot create game view'},4:{'pid':99,'class':'Static','parent':1},5:{'pid':17,'class':'Button','parent':1}})
        r=m.collect_owned_windows(17,a);self.assertEqual(a.observed,[1,3]);self.assertEqual(r['windows'][0]['staticChildren'][0]['text'],'Cannot create game view');self.assertNotIn('environment',str(r));self.assertNotIn('secret',str(r))
    def test_window_limit(self):
        a=API({i:{'pid':17,'class':'host'} for i in range(20)})
        r=m.collect_owned_windows(17,a);self.assertEqual(len(r['windows']),16);self.assertTrue(r['bounded'])
    def test_child_and_text_limits(self):
        a=API({1:{'pid':17,'class':'host'},**{i:{'pid':17,'class':'Static','parent':1,'text':'x'*3000} for i in range(2,82)}})
        r=m.collect_owned_windows(17,a);self.assertEqual(len(r['windows'][0]['staticChildren']),64);self.assertEqual(len(r['windows'][0]['staticChildren'][0]['text']),1024);self.assertTrue(r['bounded'])
    def test_time_and_visit_limits(self):
        a=API({i:{'pid':99,'class':'other'} for i in range(5000)})
        r=m.collect_owned_windows(17,a,lambda:0);self.assertTrue(r['bounded']);self.assertEqual(a.observed,[])
        calls=iter([0,4,4]);r=m.collect_owned_windows(17,API({1:{'pid':17,'class':'host'}}),lambda:next(calls));self.assertTrue(r['bounded']);self.assertEqual(r['windows'],[])
    def test_api_error_preserved_and_capped(self):
        class Broken(API):
            def pid(self,hwnd):raise OSError('original failure '+'x'*300)
        r=m.collect_owned_windows(17,Broken({i:{'pid':17,'class':'host'} for i in range(50)}));self.assertEqual(len(r['errors']),16);self.assertTrue(all(e['type']=='OSError' and len(e['message'])==256 for e in r['errors']));self.assertEqual(r['windows'],[])
    def test_invalid_pid(self):
        for value in (True,0,-1,'17'):
            with self.subTest(pid=value),self.assertRaises(AssertionError):m.collect_owned_windows(value,API({}))

if __name__=='__main__':unittest.main()
