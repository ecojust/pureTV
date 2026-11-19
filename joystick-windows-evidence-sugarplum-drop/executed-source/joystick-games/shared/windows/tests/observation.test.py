#!/usr/bin/env python3
"""Bounded original-byte reads; atomic replacement test requires real Windows."""
import importlib.util,json,os,sys,tempfile,threading,time,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('observation',ROOT/'joystick-games/tools/windows-observation.py');observation=importlib.util.module_from_spec(spec);spec.loader.exec_module(observation)
class Reads(unittest.TestCase):
    def run_read(self,values,required=True):
        clock=[0.0];errors=[];calls=[]
        def reader(path):
            value=values.pop(0) if len(values)>1 else values[0];calls.append(path)
            if isinstance(value,Exception):raise value
            return value
        def wait(seconds):clock[0]+=seconds
        result=observation.read_state('original.json',errors,required=required,alive=lambda:None,reader=reader,clock=lambda:clock[0],wait=wait)
        return result,errors,calls
    def test_transient_error_reads_new_original_bytes_instead_of_cached_state(self):
        result,errors,calls=self.run_read([PermissionError('replacement in progress'),b'{"timestamp":2,"game":{"stage":"paused"}}'])
        self.assertEqual(result['timestamp'],2);self.assertEqual(len(errors),1);self.assertEqual(len(calls),2)
    def test_incomplete_or_invalid_utf8_original_bytes_retry_then_parse_exact_unicode(self):
        result,errors,_=self.run_read([b'{',b'\xff',json.dumps({'title':'糖梅','timestamp':3},ensure_ascii=False).encode()]);self.assertEqual(result['title'],'糖梅');self.assertEqual(len(errors),2)
    def test_only_initial_missing_file_can_be_pending(self):
        self.assertIsNone(self.run_read([FileNotFoundError('before launch')],required=False)[0])
        with self.assertRaisesRegex(AssertionError,'0.5 seconds'):self.run_read([FileNotFoundError('after ready')])
    def test_persistent_invalid_content_never_becomes_cached_success(self):
        with self.assertRaisesRegex(AssertionError,'0.5 seconds'):self.run_read([b'invalid original bytes'])
    def test_non_object_snapshot_is_fatal(self):
        with self.assertRaisesRegex(AssertionError,'not an object'):self.run_read([b'null'])
    def test_native_process_exit_is_not_hidden_by_retry(self):
        def exited():raise RuntimeError('App exited 1')
        with self.assertRaisesRegex(RuntimeError,'App exited'):observation.read_state('unused',[],required=True,alive=exited)
    @unittest.skipUnless(sys.platform=='win32','Requires real Win32 CreateFile sharing and replacement')
    def test_real_windows_reader_allows_atomic_replacement_without_torn_json(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary);path=root/'state.json';path.write_text(json.dumps({'timestamp':0,'value':'糖梅'*5000}),encoding='utf-8');failures=[]
            def replace():
                try:
                    for number in range(1,101):
                        temporary_path=root/'state.tmp';temporary_path.write_text(json.dumps({'timestamp':number,'value':'糖梅'*5000},ensure_ascii=False),encoding='utf-8');os.replace(temporary_path,path);time.sleep(.001)
                except Exception as error:failures.append(str(error))
            writer=threading.Thread(target=replace);writer.start();errors=[];samples=0
            try:
                while writer.is_alive() or samples<100:
                    state=observation.read_state(path,errors,required=True,alive=lambda:None);self.assertEqual(state['value'],'糖梅'*5000);self.assertIn(state['timestamp'],range(101));samples+=1
            finally:writer.join(timeout=10)
            self.assertFalse(writer.is_alive());self.assertEqual(failures,[])
if __name__=='__main__':unittest.main()
