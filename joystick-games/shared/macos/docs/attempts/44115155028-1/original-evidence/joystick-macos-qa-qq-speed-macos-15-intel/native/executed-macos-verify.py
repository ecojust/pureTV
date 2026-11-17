#!/usr/bin/env python3
"""Observe the actual native app; drive it only through the unchanged TCP SDK."""
import argparse,datetime,hashlib,importlib.util,json,math,os,platform,plistlib,select,shutil,socket,subprocess,sys,threading,time,traceback
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'joystick-games/shared/macos'
SDK=ROOT/'puretv-joystick/joystick_sdk.py'
KEYS=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
class Observer:
    """Forward TCP bytes unchanged while recording complete JSON lines both ways."""
    def __init__(self, target, report):
        self.target, self.report = target, report
        self.server = socket.socket()
        self.server.bind(('127.0.0.1', 0))
        self.server.listen(4)
        self.server.settimeout(.2)
        self.port = self.server.getsockname()[1]
        self.stop = threading.Event()
        self.connections = 0
        self.sockets = []
        threading.Thread(target=self.accept, daemon=True).start()

    def accept(self):
        while not self.stop.is_set():
            try:
                peer, _ = self.server.accept()
            except socket.timeout:
                continue
            except OSError:
                return
            upstream = socket.create_connection(self.target, timeout=3)
            self.connections += 1
            self.sockets.extend((peer, upstream))
            threading.Thread(target=self.forward, args=(peer, upstream, self.connections), daemon=True).start()

    def forward(self, peer, upstream, connection):
        buffers = {peer:b'', upstream:b''}
        try:
            while not self.stop.is_set():
                ready, _, _ = select.select([peer, upstream], [], [], .2)
                for source in ready:
                    body = source.recv(65536)
                    if not body:
                        return
                    (upstream if source is peer else peer).sendall(body)
                    buffers[source] += body
                    while b'\n' in buffers[source]:
                        line, buffers[source] = buffers[source].split(b'\n', 1)
                        self.report['wire'].append({'at':now(), 'connection':connection,
                            'direction':'sdk-to-game' if source is peer else 'game-to-sdk',
                            'message':json.loads(line)})
        except OSError as error:
            self.report['observerConnectionEnds'].append({'connection':connection,'error':str(error)})
        except ValueError as error:
            self.report['observerErrors'].append(str(error))
        finally:
            for item in (peer, upstream):
                try:
                    item.shutdown(socket.SHUT_RDWR)
                except OSError:
                    pass
                item.close()

    def close(self):
        self.stop.set()
        self.server.close()
        for item in self.sockets:
            try:
                item.close()
            except OSError:
                pass

class Check:
    def __init__(self,args):
        self.args=args;self.out=args.output.resolve();self.out.mkdir(parents=True,exist_ok=True);assert not any(self.out.iterdir())
        self.diag=self.out/'diagnostics';self.diag.mkdir();self.processes=[];self.logs=[];self.client=None;self.proxy=None;self.app=None;self.blocker=None;self.held=set();self.stop=threading.Event();self.last=None
        self.report={'status':'running','startedAt':now(),'game':args.game,'method':'Actual AppKit/WKWebView app, unchanged official Python SDK, byte-transparent TCP observer and read-only diagnostic files. No game-state or clock writes.','physicalEsp32Tested':False,'tests':[],'wire':[],'observerErrors':[],'observerConnectionEnds':[],'snapshots':[],'screenshots':[],'sourceHashes':{str(p.relative_to(ROOT)):digest(p) for p in [Path(__file__),SDK,SHARED/'Sources/main.swift',SHARED/'Sources/ControllerServer.swift',SHARED/'Web/bridge.js']}}
    def process(self,argv,name):
        log=(self.out/name).open('wb');self.logs.append(log);p=subprocess.Popen([str(a) for a in argv],stdout=log,stderr=subprocess.STDOUT);self.processes.append(p);return p
    def read(self):
        if self.app and self.app.poll() is not None:raise RuntimeError('App exited '+str(self.app.returncode))
        try:self.last=json.loads((self.diag/'state.json').read_text());return self.last
        except (OSError,ValueError):return None
    def until(self,predicate,label,seconds=25):
        end=time.monotonic()+seconds
        while time.monotonic()<end:
            s=self.read()
            if s and predicate(s):self.report['snapshots'].append({'label':label,'at':now(),'state':s});return s
            time.sleep(.08)
        raise AssertionError(label+' timed out: '+json.dumps(self.last,ensure_ascii=False)[:3500])
    def check(self,name,fn):
        r={'name':name,'status':'running'};self.report['tests'].append(r)
        try:r['details']=fn();r['status']='passed'
        except Exception:r['status']='failed';r['error']=traceback.format_exc();raise
        finally:print(name+': '+r['status'],flush=True)
    def player(self,s):return next((p for p in s.get('input',{}).get('players',[]) if p.get('connected')), {})
    def screenshot(self,name):
        time.sleep(1.5);(self.diag/'screenshot-request.txt').write_text(name)
        end=time.monotonic()+20
        while time.monotonic()<end:
            p=self.diag/name
            if p.is_file() and p.stat().st_size>1000:self.report['screenshots'].append({'path':'diagnostics/'+name,'bytes':p.stat().st_size,'sha256':digest(p)});return
            time.sleep(.1)
        raise AssertionError('Missing native screenshot '+name)
    def press(self,k):self.client.button(k,'down');self.held.add(k)
    def release(self,k):self.client.button(k,'tap',duration=100);self.held.discard(k)
    def fresh(self,s,before,game_frame=False):
        return s.get('timestamp',0)>before.get('timestamp',0) and (not game_frame or s.get('game',{}).get('controller',{}).get('pollCount',0)>before.get('game',{}).get('controller',{}).get('pollCount',0))
    def observed_button(self,k,held):
        before=self.read();(self.press if held else self.release)(k)
        return self.until(lambda s:self.fresh(s,before,True) and s.get('game',{}).get('controller',{}).get('buttons',{}).get(k) is held,'Game consumes '+k+(' down' if held else ' release'))
    def tap(self,k):
        # A bounded observation of the actual cached frame, not a wall-clock
        # assumption about the WKWebView render rate. No extra input snapshot.
        self.observed_button(k,True);self.observed_button(k,False)
    def settle_input(self,label):
        before=self.read()
        return self.until(lambda s:self.fresh(s,before,True) and not any(s.get('game',{}).get('controller',{}).get('buttons',{}).values()),label)
    def ping_ack(self):
        self.client.ping();seq=self.client.seq;connection=self.proxy.connections
        end=time.monotonic()+10
        while time.monotonic()<end:
            if any(r['connection']==connection and r['direction']=='game-to-sdk' and r['message']=={'type':'ack','seq':seq} for r in self.report['wire']):return seq
            time.sleep(.05)
        raise AssertionError('Missing ping ACK '+str(seq))
    def clear(self):
        for k in list(self.held):self.release(k)
    def heartbeat(self):
        while not self.stop.wait(4):
            try:
                if self.client and self.client.sock:self.client.ping()
            except OSError:pass
    def paused(self,s):return s.get('game',{}).get('stage') in ['paused','pause'] or s.get('game',{}).get('paused') is True
    def playing(self,s):return s.get('game',{}).get('stage') in ['race','playing','game'] and not self.paused(s)
    def display(self,present=True):
        def match(s):
            rows=[r for r in s.get('document',{}).get('controllerClients',[]) if r.get('visible')]
            return not rows if not present else len(rows)==1 and rows[0]['controllerId']==self.client.identity and rows[0]['idText']=='ID: '+self.client.identity and all(rows[0].get(k) for k in ['fullyVisible','iconVisible','idTextFullyVisible'])
        return self.until(match,'Identity card '+str(present))['document']['controllerClients']
    def discovery(self):
        s=self.until(lambda s:s.get('server',{}).get('wifiController',{}).get('state')=='available','Bonjour ready',40);info=s['server']['wifiController'];self.port=int(info['port']);self.service=info['serviceName']
        assert self.port!=63485 if self.args.occupy_default_port else self.port==63485
        self.process(['/usr/bin/dns-sd','-B','_puretv._tcp','local.'],'bonjour-browse.txt');self.process(['/usr/bin/dns-sd','-L',self.service,'_puretv._tcp','local.'],'bonjour-resolve.txt')
        end=time.monotonic()+20
        while time.monotonic()<end:
            text=(self.out/'bonjour-resolve.txt').read_text(errors='replace')
            if f':{self.port}' in text and 'version=1' in text:return {'service':self.service,'port':self.port,'txtVersion':'1'}
            time.sleep(.2)
        raise AssertionError('Bonjour did not resolve port/version')
    def connect(self):
        self.proxy=Observer(('127.0.0.1',self.port),self.report);spec=importlib.util.spec_from_file_location('sdk',SDK);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        self.client=module.JoystickClient('127.0.0.1',self.proxy.port);self.client.connect();threading.Thread(target=self.heartbeat,daemon=True).start()
        self.until(lambda s:self.player(s).get('controllerId')==self.client.identity,'SDK hello')
        if self.graphics:self.display()
        self.screenshot('connected-menu.png')
        messages=[r['message'] for r in self.report['wire'] if r['direction']=='sdk-to-game'];assert messages[0]['type']=='hello';assert [(m['key'],m['action'],m['pressed']) for m in messages[1:10]]==[(k,'sync',False) for k in KEYS]
        return {'id':self.client.identity,'nineInitialSyncs':True}
    def gameplay(self):
        self.tap('START');start=self.until(self.playing,'Start gameplay',60);self.display();self.screenshot('playing.png')
        if self.args.game=='qq-speed':
            self.observed_button('UP',True);self.until(lambda s:s['game']['player']['speed']>25,'Accelerate')
            cases=[]
            for key in ['LEFT','RIGHT']:
                before=self.read();expected=1 if key=='LEFT' else -1
                self.observed_button(key,True)
                def changed(s):
                    delta=(s['game']['player']['h']-before['game']['player']['h']+math.pi)%(2*math.pi)-math.pi
                    return self.fresh(s,before,True) and delta*expected>.015
                after=self.until(changed,key+' actual heading change');self.observed_button(key,False)
                delta=(after['game']['player']['h']-before['game']['player']['h']+math.pi)%(2*math.pi)-math.pi
                cases.append({'key':key,'before':before['game'],'after':after['game'],'headingDelta':delta})
            self.observed_button('A',True);self.observed_button('LEFT',True)
            drift=self.until(lambda s:s['game']['player'].get('drift') and s['game']['player'].get('driftTime',0)>.25,'Real drift accumulated time')
            self.observed_button('LEFT',False);self.observed_button('A',False);self.tap('X');self.tap('B');self.clear();self.settle_input('Released driving keys')
            before=self.read();self.tap('Y');self.until(lambda s:self.fresh(s,before,True) and s['game'].get('stats',{}).get('resets',0)>before['game'].get('stats',{}).get('resets',0),'Y recovery')
            details={'turnCases':cases,'driftObserved':drift['game']['player'],'boostNitroInputsConsumed':True,'recoveryObserved':True,'fullRaceCompleted':False}
        else:
            before=self.read();self.observed_button('RIGHT',True)
            turn=self.until(lambda s:self.fresh(s,before,True) and abs(s['game']['player']['yaw']-before['game']['player']['yaw'])>.04,'CF actual turn')
            self.observed_button('RIGHT',False);before_move=self.read();self.observed_button('UP',True)
            moved=self.until(lambda s:self.fresh(s,before_move,True) and sum((s['game']['player']['position'][k]-before_move['game']['player']['position'][k])**2 for k in ['x','z'])>.04,'CF actual movement')
            self.observed_button('UP',False);before_fire=self.read();self.observed_button('A',True)
            fired=self.until(lambda s:self.fresh(s,before_fire,True) and s['game']['player']['shotsFired']>before_fire['game']['player']['shotsFired'],'CF actual shot')
            self.observed_button('A',False);self.tap('X');self.tap('Y')
            before_aim=self.read();self.observed_button('B',True);self.observed_button('UP',True)
            aimed=self.until(lambda s:self.fresh(s,before_aim,True) and abs(s['game']['player']['pitch']-before_aim['game']['player']['pitch'])>.02,'CF actual pitch aim')
            self.observed_button('UP',False);self.observed_button('B',False)
            details={'before':before['game']['player'],'turn':turn['game']['player'],'moved':moved['game']['player'],'fired':fired['game']['player'],'aimed':aimed['game']['player'],'reloadJumpInputsConsumed':True,'fullRoundCompleted':False}
        before=self.read();self.tap('START');self.until(lambda s:self.fresh(s,before,True) and self.paused(s),'START pauses');self.display();self.screenshot('paused.png')
        before=self.read();self.tap('START');self.until(lambda s:self.fresh(s,before,True) and self.playing(s),'START resumes');return details
    def focus(self):
        baseline=self.read();session=self.player(baseline)['session'];sock=self.client.sock;cycles=[]
        def neutral(s):return not any(self.player(s).get('buttons',{}).values())
        def stable(s):assert s['server']['wifiController']['port']==self.port and self.player(s)['session']==session and self.client.sock is sock
        def activate(name):subprocess.run(['/usr/bin/osascript','-e','tell application '+json.dumps(name)+' to activate'],check=True,capture_output=True,timeout=15)
        for i in range(3):
            if self.graphics:self.observed_button('RIGHT',True);self.observed_button('A',True)
            else:self.press('RIGHT');self.press('A')
            before=self.read();activate('Finder')
            background=self.until(lambda s:self.fresh(s,before) and not s.get('active') and not s['server']['wifiController']['inputEnabled'] and neutral(s) and (not self.graphics or self.paused(s)),'Background '+str(i));stable(background)
            counts=self.player(background)['buttonCounters']
            for k in KEYS:
                if k not in self.held:self.press(k)
            seq=self.ping_ack();before=self.read()
            suppressed=self.until(lambda s:self.fresh(s,before) and neutral(s) and self.player(s)['buttonCounters']==counts,'Fresh suppressed background input '+str(i));stable(suppressed)
            activate(str(self.args.app.resolve()))
            foreground=self.until(lambda s:self.fresh(s,suppressed) and s.get('active') and s['server']['wifiController']['inputEnabled'] and neutral(s) and (not self.graphics or self.paused(s)),'Foreground '+str(i));stable(foreground)
            self.clear()
            if self.graphics:
                self.settle_input('Fresh released quarantine '+str(i));before=self.read();self.tap('START');self.until(lambda s:self.fresh(s,before,True) and self.playing(s),'Fresh START '+str(i))
            cycles.append({'cycle':i+1,'samePort':True,'sameSocket':True,'heldKeysSuppressed':True,'backgroundPingAck':seq,'freshStartResumes':self.graphics})
        return {'cycles':cycles,'port':self.port,'defaultPortOccupied':self.args.occupy_default_port}
    def reconnect(self):
        self.clear()
        if self.graphics:self.settle_input('Before reconnect keys released');self.observed_button('A',True)
        else:self.press('A')
        before=self.read();self.client.disconnect();self.held.clear();self.until(lambda s:self.fresh(s,before) and not self.player(s),'Disconnect')
        if self.graphics:self.display(False);self.until(lambda s:self.fresh(s,before) and self.paused(s),'Disconnect pauses')
        self.screenshot('disconnected.png');self.client.connect()
        for k in ['START','A','B','X','Y']:self.client.send('button',key=k,action='sync',pressed=True,duration_ms=0)
        self.ping_ack();before=self.read()
        synced=self.until(lambda s:self.fresh(s,before) and self.player(s).get('controllerId')==self.client.identity and not any(self.player(s).get('buttons',{}).values()) and (not self.graphics or self.paused(s)),'Fresh held-sync reconnect')
        if self.graphics:self.display()
        for k in KEYS:self.client.send('button',key=k,action='sync',pressed=False,duration_ms=0)
        if self.graphics:self.settle_input('Reconnect sync released')
        self.screenshot('reconnected.png');return {'sameIdentity':self.client.identity,'heldSyncNoResume':True,'observedState':synced['game']}
    def acks(self):
        self.stop.set();self.ping_ack()
        sent={(r['connection'],r['message']['seq']) for r in self.report['wire'] if r['direction']=='sdk-to-game'};acks={(r['connection'],r['message']['seq']) for r in self.report['wire'] if r['direction']=='game-to-sdk' and r['message'].get('type')=='ack'}
        assert sent==acks and not self.report['observerErrors'];return {'messages':len(sent),'matchingAcks':len(acks)}
    def quit(self):
        self.client.disconnect();subprocess.run(['/usr/bin/osascript','-e','tell application '+json.dumps(str(self.args.app.resolve()))+' to quit'],check=True,capture_output=True,timeout=15);self.app.wait(timeout=15);assert self.app.returncode==0
        try:
            socket.create_connection(('127.0.0.1',self.port),timeout=1);raise AssertionError('TCP still open')
        except OSError:pass
        end=time.monotonic()+15
        while time.monotonic()<end:
            lines=(self.out/'bonjour-browse.txt').read_text(errors='replace').splitlines()
            if any('Rmv' in line and self.service in line for line in lines):break
            time.sleep(.2)
        else:raise AssertionError('Bonjour service withdrawal was not observed')
        self.app=None;return {'normalExit':True,'tcpClosed':True,'mdnsWithdrawn':True}
    def run(self):
        try:
            info=plistlib.loads((self.args.app/'Contents/Info.plist').read_bytes());binary=self.args.app/'Contents/MacOS'/info['CFBundleExecutable'];self.report['binarySha256']=digest(binary)
            if os.environ.get('GITHUB_ACTIONS')=='true':self.process([sys.executable,SHARED/'tools/allow-local-network.py',self.args.app],'network-prompts.txt')
            if self.args.occupy_default_port:self.blocker=socket.socket();self.blocker.bind(('0.0.0.0',63485));self.blocker.listen(1)
            prefix=['/usr/bin/arch','-'+self.args.launch_architecture] if self.args.launch_architecture else []
            self.app=self.process(prefix+[binary,'--diagnostics-dir',self.diag,'--preferences-domain','com.ecojust.joystick.qa.'+str(os.getpid()),'--language','zh'],'native.log')
            initial=self.until(lambda s:s.get('ready') and s.get('game') and s.get('active'),'Native ready',70);self.report['nativeProcessArchitecture']=initial['processArchitecture'];self.graphics=not initial['document']['webglError'];self.report['webglAvailable']=self.graphics
            assert self.graphics or self.args.allow_unavailable_webgl
            self.screenshot('menu.png');self.check('Bonjour actual port and version',self.discovery);self.check('Original SDK and complete identity card' if self.graphics else 'Original SDK native receiver without renderer',self.connect)
            if self.graphics:self.check('Real gameplay actions and START pause/resume',self.gameplay)
            self.check('Three foreground cycles keep transport stable',self.focus);self.check('Disconnect, held sync and same-ID reconnect',self.reconnect);self.check('Same-sequence ACK for every SDK message',self.acks);self.check('Normal quit closes TCP',self.quit)
            self.report['status']='passed' if self.graphics else 'limited_graphics';self.report['fullGameCompletionTested']=False
            if not self.graphics:self.report['limitations']=['Native renderer lacks WebGL2; native TCP/Bonjour/ACK/lifecycle and error screen only. No gameplay or rendered controller-card claim.']
        except Exception:self.report['status']='failed';self.report['error']=traceback.format_exc();self.report['lastState']=self.last;print(self.report['error'],file=sys.stderr)
        finally:
            self.stop.set()
            if self.client:self.client.disconnect()
            if self.proxy:self.proxy.close()
            for p in reversed(self.processes):
                if p.poll() is None:
                    p.terminate()
                    try:p.wait(timeout=5)
                    except subprocess.TimeoutExpired:p.kill()
            if self.blocker:self.blocker.close()
            for log in self.logs:log.close()
            self.report['finishedAt']=now();(self.out/'report.json').write_text(json.dumps(self.report,ensure_ascii=False,indent=2)+'\n');shutil.copy2(__file__,self.out/'executed-macos-verify.py')
        return 0 if self.report['status'] in ['passed','limited_graphics'] else 1
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--game',choices=['cf-transport-ship','qq-speed'],required=True);parser.add_argument('--app',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--launch-architecture',choices=['arm64','x86_64']);parser.add_argument('--occupy-default-port',action='store_true');parser.add_argument('--allow-unavailable-webgl',action='store_true');args=parser.parse_args()
    if sys.platform!='darwin':parser.error('Requires the actual macOS GUI app; no simulated substitute')
    sys.exit(Check(args).run())
