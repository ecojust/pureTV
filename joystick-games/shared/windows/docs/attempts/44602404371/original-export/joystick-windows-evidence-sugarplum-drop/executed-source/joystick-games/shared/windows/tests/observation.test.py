#!/usr/bin/env python3
"""Bounded original-byte reads; atomic replacement test requires real Windows."""
import ctypes,importlib.util,json,os,sys,tempfile,threading,time,unittest
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
            root=Path(temporary);path=root/'state.json';path.write_text(json.dumps({'timestamp':0,'value':'糖梅'*5000}),encoding='utf-8');failures=[];events=[];completed=[];stop=threading.Event()
            api=ctypes.WinDLL('kernel32',use_last_error=True)
            api.MoveFileExW.argtypes=[ctypes.c_wchar_p,ctypes.c_wchar_p,ctypes.c_uint32];api.MoveFileExW.restype=ctypes.c_int
            def replace():
                try:
                    for number in range(1,101):
                        if stop.is_set():return
                        temporary_path=root/'state.tmp';temporary_path.write_text(json.dumps({'timestamp':number,'value':'糖梅'*5000},ensure_ascii=False),encoding='utf-8')
                        # The actual production writer uses MoveFileExW with
                        # REPLACE_EXISTING|WRITE_THROUGH, not os.replace. Keep
                        # its 500 ms bound and exact transient-error whitelist.
                        started=time.monotonic()
                        while True:
                            success=api.MoveFileExW(str(temporary_path),str(path),1|8);error=0 if success else ctypes.get_last_error();elapsed=(time.monotonic()-started)*1000
                            events.append({'write':number,'success':bool(success),'winerror':error,'elapsedMilliseconds':elapsed})
                            if success:completed.append(number);break
                            if error not in (5,32,33) or elapsed>=500:raise ctypes.WinError(error)
                            time.sleep(.001)
                        time.sleep(.001)
                except Exception as error:failures.append(str(error))
            writer=threading.Thread(target=replace);writer.start();errors=[];samples=0;deadline=time.monotonic()+15
            try:
                while writer.is_alive() or samples<100:
                    self.assertLess(time.monotonic(),deadline,'Native atomic-replacement observation exceeded 15 seconds')
                    state=observation.read_state(path,errors,required=True,alive=lambda:None);self.assertEqual(state['value'],'糖梅'*5000);self.assertIn(state['timestamp'],range(101));samples+=1
                    time.sleep(.001)
            finally:
                stop.set();writer.join(timeout=2)
                record={'method':'Actual Windows MoveFileExW and CreateFileW, original JSON bytes under concurrent replacement','sourceCommit':os.environ.get('GITHUB_SHA'),'moveFlags':9,'retryLimitMilliseconds':500,'retryableWindowsErrors':[5,32,33],'completedWrites':len(completed),'readSamples':samples,'writeFailures':failures,'readErrors':errors,'moveAttempts':events,'writerStillAlive':writer.is_alive()}
                if os.environ.get('RUNNER_TEMP'):(Path(os.environ['RUNNER_TEMP'])/'observation-replace-evidence.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
                print(json.dumps({key:record[key] for key in ['completedWrites','readSamples','writeFailures','writerStillAlive']}),flush=True)
            self.assertFalse(writer.is_alive());self.assertEqual(failures,[]);self.assertEqual(completed,list(range(1,101)))
            final=observation.read_state(path,errors,required=True,alive=lambda:None);self.assertEqual(final['timestamp'],100);self.assertEqual(final['value'],'糖梅'*5000)
if __name__=='__main__':unittest.main()
