#!/usr/bin/env python3
"""Run the actual Windows WebView2 app through the unchanged official TCP SDK."""
import argparse,ctypes,hashlib,importlib.util,json,os,shutil,socket,subprocess,sys,threading,time,traceback
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
base=module('macos_observation',Path(__file__).with_name('macos-verify.py'))
display_api=module('windows_display',Path(__file__).with_name('windows-display.py'))
observation_api=module('windows_observation',Path(__file__).with_name('windows-observation.py'))
plan_api=base.qa_plan
class WindowsCheck(base.CatalogCheck):
    def __init__(self,args):
        self.args=args;self.out=args.output.resolve();self.out.mkdir(parents=True,exist_ok=True);assert not any(self.out.iterdir())
        self.diag=self.out/'diagnostics';self.diag.mkdir();self.profile=self.out/'profile';self.profile.mkdir();self.processes=[];self.logs=[];self.client=None;self.proxy=None;self.app=None;self.blocker=None;self.held=set();self.stop=threading.Event();self.last=None;self.graphics=True
        self.plan=plan_api.load_plan(ROOT/'joystick-games'/args.game/'qa-plan.json');self.renderers=plan_api.accepted_renderers(self.plan)
        self.report={'status':'running','game':args.game,'platform':'windows','qaSourceCommit':os.environ.get('GITHUB_SHA'),'startedAt':base.now(),'method':'Actual Win32/WebView2 app, unchanged official Python SDK, byte-transparent TCP observer and read-only diagnostics. No model/time/storage writes.','physicalTvTested':False,'physicalEsp32Tested':False,'tests':[],'wire':[],'observerErrors':[],'observerConnectionEnds':[],'snapshots':[],'screenshots':[],'qaPlan':self.plan,'binarySha256':base.digest(args.app/'PureTVGame.exe'),'sourceHashes':{p.relative_to(ROOT).as_posix():base.digest(p) for p in [Path(__file__),Path(base.__file__),Path(plan_api.__file__),base.SDK,ROOT/'joystick-games'/args.game/'qa-plan.json']}}
        self.user=ctypes.WinDLL('user32',use_last_error=True)
        self.user.SetThreadDpiAwarenessContext.argtypes=[ctypes.c_void_p];self.user.SetThreadDpiAwarenessContext.restype=ctypes.c_void_p
        assert self.user.SetThreadDpiAwarenessContext(ctypes.c_void_p(-4)), 'Cannot disable DPI virtualization for native window measurement'
        self.display_session=display_api.DisplaySession(self.out/'display-setup.json');self.report['nativeDisplay']=self.display_session.report
        self.report['sourceHashes']['joystick-games/tools/windows-display.py']=base.digest(display_api.__file__)
        self.report['sourceHashes']['joystick-games/tools/windows-observation.py']=base.digest(observation_api.__file__);self.report['diagnosticReadErrors']=[]
        self.user.FindWindowW.argtypes=[ctypes.c_wchar_p,ctypes.c_wchar_p];self.user.FindWindowW.restype=ctypes.c_void_p
        self.user.PostMessageW.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_size_t,ctypes.c_ssize_t]
        self.user.ShowWindow.argtypes=[ctypes.c_void_p,ctypes.c_int];self.user.SetForegroundWindow.argtypes=[ctypes.c_void_p]
        self.user.GetWindowThreadProcessId.argtypes=[ctypes.c_void_p,ctypes.POINTER(ctypes.c_ulong)]
        self.user.SendMessageW.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_size_t,ctypes.c_ssize_t]
        self.user.SetWindowPos.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_uint]
        self.user.GetWindowRect.argtypes=[ctypes.c_void_p,ctypes.c_void_p]
        for p in [Path(__file__),Path(base.__file__),Path(display_api.__file__),Path(observation_api.__file__),Path(plan_api.__file__),base.SDK,ROOT/'joystick-games'/args.game/'qa-plan.json']:shutil.copy2(p,self.out/('executed-'+p.name))
    def read(self):
        def alive():
            if self.app and self.app.poll() is not None:raise RuntimeError('App exited '+str(self.app.returncode))
        state=observation_api.read_state(self.diag/'state.json',self.report['diagnosticReadErrors'],required=self.last is not None,alive=alive)
        if state:
            if isinstance(state.get('game'),dict):assert not state['game'].get('errors'),'Game runtime errors: '+json.dumps(state['game']['errors'])
            self.last=state
        return state
    def fresh(self,state,before,game_frame=False):
        # Poll counters belong to a document. A normal location.reload() resets
        # them; a late snapshot from the old document must not pass as the new
        # document merely because its native callback timestamp is newer.
        def has_epoch(value):
            document=value.get('document')
            return 'documentEpoch' in value or isinstance(document,dict) and 'epoch' in document
        if not has_epoch(state) and not has_epoch(before):
            return super().fresh(state,before,game_frame)
        def epoch(value):
            native=value.get('documentEpoch');document=value.get('document')
            if not isinstance(document,dict):return None
            document=document.get('epoch')
            return native if type(native) is int and 0<native<=9007199254740991 and type(document) is int and document==native else None
        current_epoch=epoch(state);previous_epoch=epoch(before)
        if current_epoch is None or previous_epoch is None or current_epoch<previous_epoch:return False
        timestamp=state.get('timestamp');previous_timestamp=before.get('timestamp')
        if not plan_api.numeric(timestamp) or not plan_api.numeric(previous_timestamp) or timestamp<=previous_timestamp:return False
        if current_epoch>previous_epoch:
            # New-document freshness requires its actual renderer and initial
            # input polls. It does not waive the caller's original expectation.
            return state.get('ready') is True and not state.get('lastJavaScriptError') and not state.get('diagnosticError') and base.initialization(state.get('game'),renderer=self.renderers)=='ready'
        if not game_frame:return True
        current_poll=state.get('game',{}).get('controller',{}).get('pollCount');previous_poll=before.get('game',{}).get('controller',{}).get('pollCount')
        return plan_api.numeric(current_poll) and plan_api.numeric(previous_poll) and current_poll>previous_poll
    def connect(self):
        connected=super().connect();self.report['additionalBusyRejections']=[]
        # Repeat actual independent SDK clients after the original check. Each
        # sends hello plus all nine syncs while the host half-closes its reply.
        owner=self.player(self.read())
        for attempt in range(2):
            rejection={'wire':[],'observerErrors':[],'observerConnectionEnds':[]};proxy=base.RejectionObserver(('127.0.0.1',self.port),rejection)
            sdk=module('windows_second_sdk_'+str(attempt),base.SDK);second=sdk.JoystickClient('127.0.0.1',proxy.port)
            try:
                assert second.identity!=self.client.identity
                try:second.connect()
                except OSError as error:rejection['connectError']=str(error)
                deadline=time.monotonic()+5
                while time.monotonic()<deadline:
                    if any(row['direction']=='game-to-sdk' and row['message']=={'type':'error','message':'controller_busy','seq':1} for row in rejection['wire']):break
                    time.sleep(.05)
                else:raise AssertionError('Repeated second SDK did not receive controller_busy before close')
                current=self.until(lambda state:self.player(state).get('controllerId')==owner['controllerId'] and self.player(state).get('session')==owner['session'],'Owner retains seat after repeated rejected SDK')
                assert len([player for player in current['input']['players'] if player.get('connected')])==1
                self.ping_ack()
            finally:
                second.disconnect();proxy.close();self.report['additionalBusyRejections'].append(dict(rejection,identity=second.identity))
        return dict(connected,independentBusyRejections=3)
    def screenshot(self,name):
        assert Path(name).name==name and '/' not in name and '\\' not in name and name.endswith('.png')
        path=self.diag/name;assert not path.exists(),'A new capture must not reuse an existing PNG'
        time.sleep(1.5);(self.diag/'screenshot-request.txt').write_text(name,encoding='utf-8')
        record={'path':'diagnostics/'+name,'requestedAt':base.now()};self.report.setdefault('screenshotObservations',[]).append(record)
        def alive():
            if self.app and self.app.poll() is not None:raise RuntimeError('App exited during screenshot '+str(self.app.returncode))
        data=observation_api.read_png(path,record,alive=alive)
        self.report['screenshots'].append({'path':'diagnostics/'+name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    def pause_stability(self,background=False):
        before=self.until(self.paused,'Paused before model stability observation');values={path:plan_api.read_path(before['game'],path) for path in self.plan['pauseStablePaths']}
        assert any(plan_api.numeric(value) for value in values.values()),'Pause observations require a finite model counter or coordinate'
        def stable(state):
            assert self.paused(state),'Pause ended without fresh START'
            if background:
                assert state['active'] is False and state['server']['wifiController']['inputEnabled'] is False,'Background observation unexpectedly regained input'
                assert not any(self.player(state).get('buttons',{}).values()),'Native inputs remained held in background'
            assert {path:plan_api.read_path(state['game'],path) for path in values}==values,'Gameplay progressed while paused'
        started=time.monotonic();samples=[];previous=before
        observation={'background':background,'timeoutSeconds':15,'baselineTimestamp':before['timestamp'],'baselinePollCount':before['game']['controller']['pollCount'],'expectedPaths':values,'samples':[],'status':'observing'}
        self.report.setdefault('pauseObservations',[]).append(observation)
        while time.monotonic()-started<.5 or len(samples)<4:
            if time.monotonic()-started>=15:
                observation.update(status='failed',elapsedSeconds=time.monotonic()-started);raise AssertionError('Insufficient fresh real snapshots during pause')
            state=self.read();elapsed=time.monotonic()-started
            observation['samples'].append({'elapsedSeconds':elapsed,'nativeTimestamp':state.get('timestamp'),'pollCount':state.get('game',{}).get('controller',{}).get('pollCount'),'freshNativeSnapshot':self.fresh(state,previous),'paused':self.paused(state),'active':state.get('active'),'inputEnabled':state.get('server',{}).get('wifiController',{}).get('inputEnabled'),'paths':{path:plan_api.read_path(state['game'],path) for path in values}})
            assert elapsed<=15,'Pause snapshot arrived after observation deadline'
            stable(state)
            if self.fresh(state,previous):samples.append(state['timestamp']);previous=state
            time.sleep(.04)
        # WebView2 may suspend requestAnimationFrame while minimized. The
        # native receiver and read-only diagnostics must still run; actual
        # frame/input polling remains mandatory in front and after restoration.
        after=self.until(lambda state:self.fresh(state,before,not background),'Fresh native background observation' if background else 'Controller keeps polling during pause')
        stable(after)
        observation.update(status='passed',elapsedSeconds=time.monotonic()-started,uniqueNativeSnapshots=len(samples),finalTimestamp=after['timestamp'],finalPollCount=after['game']['controller']['pollCount'])
        return {'paths':values,'samples':len(samples),'freshSnapshotTimestamps':samples,'realSeconds':time.monotonic()-started,'background':background,'controllerPollingRequired':not background,'controllerFramesAdvanced':after['game']['controller']['pollCount']-before['game']['controller']['pollCount']}
    def hwnd(self):
        title=json.loads((self.args.app/'game.json').read_text(encoding='utf-8'))['name'];window=self.user.FindWindowW('PureTVGameWindow',title)
        assert window,'Actual game window missing';pid=ctypes.c_ulong();self.user.GetWindowThreadProcessId(window,ctypes.byref(pid));assert pid.value==self.app.pid,'Wrong game window process';return window
    def launch(self):
        self.last=None
        self.app=self.process([self.args.app/'PureTVGame.exe','--diagnostics',self.diag,'--profile',self.profile],'native-'+self.diag.name+'.log')
        state=self.until(lambda s:s.get('ready') and base.initialization(s.get('game'),renderer=self.renderers)=='ready','Actual renderer initialized',90)
        self.user.ShowWindow(self.hwnd(),9);self.user.SetForegroundWindow(self.hwnd());return self.until(lambda s:s.get('active') and s['server']['wifiController']['inputEnabled'],'Foreground game ready',30)
    def window_bounds(self):
        from ctypes import wintypes
        class Point(ctypes.Structure):_fields_=[('x',ctypes.c_long),('y',ctypes.c_long)]
        class Minimum(ctypes.Structure):_fields_=[('reserved',Point),('maximumSize',Point),('maximumPosition',Point),('minimumTrack',Point),('maximumTrack',Point)]
        handle=self.hwnd();outer=wintypes.RECT();assert self.user.GetWindowRect(handle,ctypes.byref(outer))
        initial=self.read();self.report['nativeWindowSetup']={'originalOuterPixels':{key:getattr(outer,key) for key in ('left','top','right','bottom')},'originalClientPixels':initial['clientPixels'],'originalDocumentViewport':{key:initial['document'][key] for key in ('width','height')},'windowDpi':initial['windowDpi'],'resizeFlags':0x0016,'resizeFlagsMeaning':'SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE'}
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
            background_stability=self.pause_stability(background=True);counts=self.player(background)['buttonCounters']
            for k in base.KEYS:
                if k not in self.held:self.press(k)
            ack=self.ping_ack();self.until(lambda s:self.fresh(s,background) and self.player(s)['buttonCounters']==counts and not any(self.player(s)['buttons'].values()),'Background presses suppressed')
            before=self.read();self.user.ShowWindow(self.hwnd(),9);self.user.SetForegroundWindow(self.hwnd())
            restored=self.until(lambda s:self.fresh(s,before,True) and s.get('active') and s['server']['wifiController']['inputEnabled'] and self.paused(s) and not any(self.player(s)['buttons'].values()) and not any(s['game']['controller']['buttons'].values()),'Restore resumes actual polling but stays paused and quarantined')
            assert restored['server']['wifiController']['port']==self.port and self.player(restored)['session']==session and self.client.sock is connection
            self.clear();self.settle_input('Fresh release after restore');self.start_transition(self.playing,'Fresh START resumes after restore')
            cycles.append({'cycle':i+1,'samePort':True,'sameSocket':True,'sameSession':True,'backgroundStability':background_stability,'backgroundPingAck':ack,'heldSuppressed':True,'restoredPollingVerified':True,'freshStartRequired':True})
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
            self.display_session.prepare()
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
            try:self.display_session.restore()
            except Exception:self.report['status']='failed';self.report['displayRestoreError']=traceback.format_exc()
            self.report['finishedAt']=base.now();(self.out/'report.json').write_text(json.dumps(self.report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        return 0 if self.report['status']=='passed' else 1
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--game',required=True);p.add_argument('--app',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--occupy-default-port',action='store_true');args=p.parse_args()
    if sys.platform!='win32':p.error('Requires actual Windows GUI, not a Linux browser substitute')
    sys.exit(WindowsCheck(args).run())
