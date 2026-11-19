#!/usr/bin/env python3
"""Run the actual Windows WebView2 app through the unchanged official TCP SDK."""
import argparse,ctypes,hashlib,importlib.util,json,os,shutil,socket,subprocess,sys,threading,time,traceback
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
base=module('macos_observation',Path(__file__).with_name('macos-verify.py'))
plan_api=base.qa_plan
class WindowsCheck(base.CatalogCheck):
    def __init__(self,args):
        self.args=args;self.out=args.output.resolve();self.out.mkdir(parents=True,exist_ok=True);assert not any(self.out.iterdir())
        self.diag=self.out/'diagnostics';self.diag.mkdir();self.profile=self.out/'profile';self.profile.mkdir();self.processes=[];self.logs=[];self.client=None;self.proxy=None;self.app=None;self.blocker=None;self.held=set();self.stop=threading.Event();self.last=None;self.graphics=True
        self.plan=plan_api.load_plan(ROOT/'joystick-games'/args.game/'qa-plan.json');self.renderers=plan_api.accepted_renderers(self.plan)
        self.report={'status':'running','game':args.game,'platform':'windows','qaSourceCommit':os.environ.get('GITHUB_SHA'),'startedAt':base.now(),'method':'Actual Win32/WebView2 app, unchanged official Python SDK, byte-transparent TCP observer and read-only diagnostics. No model/time/storage writes.','physicalTvTested':False,'physicalEsp32Tested':False,'tests':[],'wire':[],'observerErrors':[],'observerConnectionEnds':[],'snapshots':[],'screenshots':[],'qaPlan':self.plan,'binarySha256':base.digest(args.app/'PureTVGame.exe'),'sourceHashes':{str(p.relative_to(ROOT)):base.digest(p) for p in [Path(__file__),Path(base.__file__),Path(plan_api.__file__),base.SDK,ROOT/'joystick-games'/args.game/'qa-plan.json']}}
        self.user=ctypes.WinDLL('user32',use_last_error=True)
        self.user.SetThreadDpiAwarenessContext.argtypes=[ctypes.c_void_p];self.user.SetThreadDpiAwarenessContext.restype=ctypes.c_void_p
        assert self.user.SetThreadDpiAwarenessContext(ctypes.c_void_p(-4)), 'Cannot disable DPI virtualization for native window measurement'
        self.user.FindWindowW.argtypes=[ctypes.c_wchar_p,ctypes.c_wchar_p];self.user.FindWindowW.restype=ctypes.c_void_p
        self.user.PostMessageW.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_size_t,ctypes.c_ssize_t]
        self.user.ShowWindow.argtypes=[ctypes.c_void_p,ctypes.c_int];self.user.SetForegroundWindow.argtypes=[ctypes.c_void_p]
        self.user.GetWindowThreadProcessId.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_ulong)]
        self.user.SendMessageW.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_size_t,ctypes.c_ssize_t]
        self.user.SetWindowPos.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_uint]
        self.user.GetWindowRect.argtypes=[ctypes.c_void_p,ctypes.c_void_p]
        for p in [Path(__file__),Path(base.__file__),Path(plan_api.__file__),base.SDK,ROOT/'joystick-games'/args.game/'qa-plan.json']:shutil.copy2(p,self.out/('executed-'+p.name))
    def hwnd(self):
        title=json.loads((self.args.app/'game.json').read_text(encoding='utf-8'))['name'];window=self.user.FindWindowW('PureTVGameWindow',title)
        assert window,'Actual game window missing';pid=ctypes.c_ulong();self.user.GetWindowThreadProcessId(window,ctypes.byref(pid));assert pid.value==self.app.pid,'Wrong game window process';return window
    def launch(self):
        self.app=self.process([self.args.app/'PureTVGame.exe','--diagnostics',self.diag,'--profile',self.profile],'native-'+self.diag.name+'.log')
        state=self.until(lambda s:s.get('ready') and base.initialization(s.get('game'),renderer=self.renderers)=='ready','Actual renderer initialized',90)
        self.user.ShowWindow(self.hwnd(),9);self.user.SetForegroundWindow(self.hwnd());return self.until(lambda s:s.get('active') and s['server']['wifiController']['inputEnabled'],'Foreground game ready',30)
    def window_bounds(self):
        from ctypes import wintypes
        class Point(ctypes.Structure):_fields_=[('x',ctypes.c_long),('y',ctypes.c_long)]
        class Minimum(ctypes.Structure):_fields_=[('reserved',Point),('maximumSize',Point),('maximumPosition',Point),('minimumTrack',Point),('maximumTrack',Point)]
        handle=self.hwnd();outer=wintypes.RECT();assert self.user.GetWindowRect(handle,ctypes.byref(outer))
        minimum=Minimum();self.user.SendMessageW(handle,0x0024,0,ctypes.addressof(minimum))
        assert minimum.minimumTrack.x>=960 and minimum.minimumTrack.y>=540
        before=self.read();assert self.user.SetWindowPos(handle,None,0,0,minimum.minimumTrack.x,minimum.minimumTrack.y,0x0016)
        state=self.until(lambda s:self.fresh(s,before) and 959<=s['document']['width']<=961 and 539<=s['document']['height']<=541,'Actual minimum logical viewport')
        dpi=state['windowDpi'];assert type(dpi) is int and dpi>=96
        assert abs(state['clientPixels']['width']*96/dpi-state['document']['width'])<=2
        assert abs(state['clientPixels']['height']*96/dpi-state['document']['height'])<=2
        self.screenshot('minimum-window.png');before=self.read()
        assert self.user.SetWindowPos(handle,None,0,0,outer.right-outer.left,outer.bottom-outer.top,0x0016)
        restored=self.until(lambda s:self.fresh(s,before) and s['document']['width']>=1279 and s['document']['height']>=719,'Actual initial logical viewport restored')
        return {'observedDpi':dpi,'minimumViewport':[state['document']['width'],state['document']['height']],'restoredViewport':[restored['document']['width'],restored['document']['height']],'physicalPixels':state['clientPixels'],'otherDpiScalesTested':False}
    def discovery(self):
        from zeroconf import Zeroconf,IPVersion
        state=self.until(lambda s:s.get('server',{}).get('wifiController',{}).get('state')=='available','Windows DNS-SD registration',40);info=state['server']['wifiController'];self.port=info['port'];self.service=info['serviceName']
        assert (self.port!=63485) if self.args.occupy_default_port else (self.port==63485)
        self.zeroconf=Zeroconf(ip_version=IPVersion.V4Only);resolved=self.zeroconf.get_service_info('_puretv._tcp.local.',self.service+'._puretv._tcp.local.',timeout=15000)
        assert resolved and resolved.port==self.port and resolved.properties.get(b'version')==b'1','Actual multicast DNS discovery did not resolve expected port/version'
        return {'serviceName':resolved.name,'port':resolved.port,'addresses':resolved.parsed_addresses(),'txtVersion':'1'}
    def focus(self):
        baseline=self.read();session=self.player(baseline)['session'];connection=self.client.sock;cycles=[]
        for i in range(3):
            self.ensure_playing();self.observed_button('RIGHT',True);self.observed_button('A',True);before=self.read();self.user.ShowWindow(self.hwnd(),6)
            background=self.until(lambda s:self.fresh(s,before) and not s.get('active') and not s['server']['wifiController']['inputEnabled'] and not any(self.player(s).get('buttons',{}).values()) and self.paused(s),'Minimize cancels actual gameplay')
            self.pause_stability();counts=self.player(background)['buttonCounters']
            for k in base.KEYS:
                if k not in self.held:self.press(k)
            ack=self.ping_ack();self.until(lambda s:self.fresh(s,background) and self.player(s)['buttonCounters']==counts and not any(self.player(s)['buttons'].values()),'Background presses suppressed')
            before=self.read();self.user.ShowWindow(self.hwnd(),9);self.user.SetForegroundWindow(self.hwnd())
            restored=self.until(lambda s:self.fresh(s,before) and s.get('active') and s['server']['wifiController']['inputEnabled'] and self.paused(s) and not any(self.player(s)['buttons'].values()),'Restore remains paused and quarantined')
            assert restored['server']['wifiController']['port']==self.port and self.player(restored)['session']==session and self.client.sock is connection
            self.clear();self.settle_input('Fresh release after restore');self.start_transition(self.playing,'Fresh START resumes after restore')
            cycles.append({'cycle':i+1,'samePort':True,'sameSocket':True,'sameSession':True,'backgroundPingAck':ack,'heldSuppressed':True,'freshStartRequired':True})
        return {'cycles':cycles}
    def quit(self):
        if self.client:self.client.disconnect()
        self.user.PostMessageW(self.hwnd(),0x0010,0,0);self.app.wait(timeout=20);assert self.app.returncode==0;self.app=None
        try:socket.create_connection(('127.0.0.1',self.port),timeout=1);raise AssertionError('TCP still listening')
        except OSError:pass
        self.zeroconf.close()
        return {'normalExit':True,'tcpClosed':True}
    def restart_storage(self):
        saved=json.loads((self.profile/'preferences.json').read_text(encoding='utf-8')) if (self.profile/'preferences.json').is_file() else {}
        assert set(saved)<=set(self.storage_before['current'])
        if self.plan.get('storageRestartRequired'):assert saved,'Actual save required'
        # Only delete the old browser cache after app exit. Native saves are not
        # edited: a new profile WebView store must hydrate the real native data.
        cache=self.profile/'WebView2';assert self.app is None
        if cache.exists():
            for attempt in range(15):
                try:shutil.rmtree(cache);break
                except OSError:
                    if attempt==14:raise
                    time.sleep(1)
        self.diag=self.out/'diagnostics-restart';self.diag.mkdir();state=self.launch();expected={k:saved.get(k) for k in self.storage_before['current']}
        assert state['storage']['initial']==expected
        self.report['storageRestart'].update(status='passed' if saved else 'not_exercised',nativeSavedAfterQuit=saved,cleanBrowserCacheVerified=True,initialHydrationEqual=True,after=state['storage'])
        self.user.PostMessageW(self.hwnd(),0x0010,0,0);self.app.wait(timeout=20);assert self.app.returncode==0;self.app=None;return self.report['storageRestart']
    def run(self):
        try:
            if self.args.occupy_default_port:
                self.blocker=socket.socket();self.blocker.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1);self.blocker.bind(('0.0.0.0',63485));self.blocker.listen(1)
            initial=self.launch();assert all(v is None for v in initial['storage']['initial'].values()),'Fresh profile had saves'
            self.check('Native DPI-scaled minimum and initial viewport',self.window_bounds)
            self.check('DNS-SD resolves actual listener and TXT',self.discovery)
            self.check('Official SDK and single controller seat',self.connect)
            self.check('Actual gameplay and pause model freeze',self.gameplay)
            self.check('Three minimize and restore cycles keep endpoint stable',self.focus)
            self.check('Disconnect and held-sync reconnect remain paused',self.reconnect)
            self.check('Normal gameplay saves reach native store',self.capture_storage)
            self.check('Every SDK message receives exact sequence ACK',self.acks)
            self.check('Normal close releases TCP',self.quit)
            self.check('Real save restored with fresh browser cache',self.restart_storage)
            self.report['status']='passed'
        except Exception:self.report['status']='failed';self.report['error']=traceback.format_exc();print(self.report['error'],flush=True)
        finally:
            self.stop.set()
            if self.client:self.client.disconnect()
            if self.proxy:self.proxy.close()
            if hasattr(self,'zeroconf'):self.zeroconf.close()
            for process in reversed(self.processes):
                if process.poll() is None:
                    process.terminate()
                    try:process.wait(timeout=5)
                    except subprocess.TimeoutExpired:process.kill()
            if self.blocker:self.blocker.close()
            for log in self.logs:log.close()
            self.report['finishedAt']=base.now();(self.out/'report.json').write_text(json.dumps(self.report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return 0 if self.report['status']=='passed' else 1
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--game',required=True);p.add_argument('--app',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--occupy-default-port',action='store_true');args=p.parse_args()
    if sys.platform!='win32':p.error('Requires actual Windows GUI, not a Linux browser substitute')
    sys.exit(WindowsCheck(args).run())
