#!/usr/bin/env python3
"""Exercise the built macOS app using the unchanged pureTV Python joystick SDK.

Requires macOS GUI, Python 3.9+, Node and dns-sd. The app is observed through its
opt-in read-only diagnostic files. All driving is ordinary TCP controller input.
Each invocation requires a fresh output directory; failed evidence is preserved.
"""
import argparse
import datetime
import hashlib
import http.client
import importlib.util
import json
import os
import platform
import plistlib
import re
import select
import shutil
import socket
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]
SDK = REPO / 'puretv-joystick/joystick_sdk.py'
KEYS = ('UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y')

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

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

class NativeCheck:
    def __init__(self, args):
        self.args = args
        self.out = args.output.resolve()
        self.out.mkdir(parents=True, exist_ok=True)
        if any(self.out.iterdir()):
            raise ValueError('Output directory must be empty; retain earlier attempts')
        self.diag = self.out / 'diagnostics'
        self.diag.mkdir()
        self.report = {'startedAt':now(), 'status':'running', 'system':platform.platform(),
            'architecture':platform.machine(), 'language':args.language,
            'defaultPortOccupied':args.occupy_default_port,
            'method':'Actual AppKit/WKWebView app and production TCP receiver. Unchanged official Python SDK sends normal buttons through a byte-transparent observer. Read-only diagnostic snapshots and the existing observation-based driving strategy; no game state or clock writes.',
            'physicalTvTested':False, 'physicalPhoneTested':False, 'physicalEsp32Tested':False,
            'nativeMacOSAppTested':True, 'officialVirtualWebPageTested':False,
            'tests':[], 'wire':[], 'observerErrors':[], 'observerConnectionEnds':[], 'snapshots':[], 'screenshots':[],
            'sourceHashes':{str(p.relative_to(REPO)):digest(p) for p in [Path(__file__), HERE/'native-drive.mjs', HERE/'official-virtual-native.mjs', HERE/'allow-local-network.py', SDK, REPO/'puretv-joystick/bridge.py', REPO/'puretv-joystick/virtual.html',
                HERE.parents[1]/'tests/automation.mjs', HERE.parents[1]/'source/model.mjs', HERE.parents[1]/'source/tracks.mjs']}}
        self.app = self.client = self.proxy = self.driver = self.browse = self.resolve = self.bridge = self.permission_watcher = None
        self.port_blocker = None
        self.held = set()
        self.heartbeat_stop = threading.Event()
        self.last_state = None
        self.logs = []

    def read(self):
        if self.app and self.app.poll() is not None:
            raise RuntimeError('Native application exited: '+str(self.app.returncode))
        try:
            state = json.loads((self.diag/'state.json').read_text())
            self.last_state = state
            return state
        except (OSError, ValueError):
            return None

    def until(self, predicate, label, seconds=15):
        end = time.monotonic()+seconds
        while time.monotonic()<end:
            state = self.read()
            if state and predicate(state):
                self.report['snapshots'].append({'label':label, 'at':now(), 'state':state})
                return state
            time.sleep(.07)
        raise AssertionError(label+' timed out; last state: '+json.dumps(self.last_state, ensure_ascii=False)[:2500])

    def check(self, name, action):
        row = {'name':name, 'status':'running'}
        self.report['tests'].append(row)
        try:
            row['details'] = action()
            row['status'] = 'passed'
        except Exception:
            row['status'] = 'failed'
            row['error'] = traceback.format_exc()
            raise
        finally:
            print(name+': '+row['status'], flush=True)

    def log_process(self, argv, basename):
        log = (self.out/basename).open('wb')
        self.logs.append(log)
        return subprocess.Popen(argv, stdout=log, stderr=subprocess.STDOUT)

    def screenshot(self, name):
        target = self.diag/name
        (self.diag/'screenshot-request.txt').write_text(name)
        end = time.monotonic()+15
        while time.monotonic()<end:
            if target.exists() and target.stat().st_size>1000:
                self.report['screenshots'].append({'file':'diagnostics/'+name, 'bytes':target.stat().st_size, 'sha256':digest(target)})
                return
            time.sleep(.1)
        raise AssertionError('Native screenshot not written: '+name)

    def player(self, state):
        return next((p for p in state['input'].get('players', []) if p.get('connected')), {})

    def press(self, key):
        self.client.button(key, 'down')
        self.held.add(key)

    def release(self, key):
        self.client.button(key, 'tap', duration=100)
        self.held.discard(key)

    def release_all(self):
        for key in list(self.held):
            self.release(key)

    def tap(self, key):
        self.press(key)
        self.release(key)

    def heartbeat(self):
        while not self.heartbeat_stop.wait(4):
            try:
                if self.client and self.client.sock:
                    self.client.ping()
            except OSError:
                pass

    def local_assets(self):
        url=urllib.parse.urlparse(self.read()['document']['url'])
        assert url.scheme=='http' and url.hostname=='127.0.0.1' and url.path=='/tv.html'
        def request(method,path,host=None):
            connection=http.client.HTTPConnection(url.hostname,url.port,timeout=5)
            try:
                connection.request(method,path,headers={'Host':host or url.netloc})
                response=connection.getresponse()
                body=response.read(2*1024*1024)
                return response.status,dict(response.getheaders()),body
            finally:
                connection.close()
        result=[]
        for filename in ('tv.html','game-config.json'):
            expected=(self.args.app/'Contents/Resources/Web'/filename).read_bytes()
            status,headers,body=request('GET','/'+filename)
            assert status==200 and body==expected
            assert int(headers['Content-Length'])==len(expected)
            head,head_headers,empty=request('HEAD','/'+filename)
            assert head==200 and empty==b'' and int(head_headers['Content-Length'])==len(expected)
            result.append({'file':filename,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'getMatchesBundle':True,'headMatchesGet':True})
        for method,path,host,expected in [('GET','/game-config.json','example.invalid',403),('GET','/%2e%2e/Info.plist',None,404),('GET','/not-bundled.txt',None,404),('POST','/game-config.json',None,405)]:
            status,_,_=request(method,path,host)
            assert status==expected, (method,path,status,expected)
            result.append({'method':method,'path':path,'host':host or url.netloc,'status':status})
        return result

    def discovery(self):
        state = self.until(lambda s:s['server'].get('wifiController',s['server']).get('state')=='available', 'Bonjour registration', 30)
        info = state['server'].get('wifiController',state['server'])
        self.port = int(info['port'])
        self.service = info['serviceName']
        assert 0<self.port<65536
        self.report['initialControllerPort']=self.port
        if self.args.occupy_default_port:
            assert self.port!=63485, 'Occupied default port must select one fallback port at startup'
        self.browse = self.log_process(['/usr/bin/dns-sd','-B','_puretv._tcp','local.'], 'bonjour-browse.txt')
        self.resolve = self.log_process(['/usr/bin/dns-sd','-L',self.service,'_puretv._tcp','local.'], 'bonjour-resolve.txt')
        end = time.monotonic()+20
        while time.monotonic()<end:
            text = (self.out/'bonjour-resolve.txt').read_text(errors='replace')
            browse = (self.out/'bonjour-browse.txt').read_text(errors='replace')
            if f':{self.port}' in text and 'version=1' in text and self.service in browse:
                self.report['mdns']={'type':'_puretv._tcp','serviceName':self.service,'port':self.port,'txtVersion':'1','observedWith':'macOS dns-sd browse and resolve; not ESP32 search'}
                return self.report['mdns']
            time.sleep(.2)
        raise AssertionError('dns-sd did not resolve the actual service port and TXT version=1')

    def connect(self):
        self.proxy = Observer(('127.0.0.1',self.port), self.report)
        spec = importlib.util.spec_from_file_location('official_joystick_sdk', SDK)
        sdk = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sdk)
        self.client = sdk.JoystickClient('127.0.0.1', self.proxy.port)
        self.client.connect()
        threading.Thread(target=self.heartbeat, daemon=True).start()
        self.until(lambda s:s['game']['connection']['controllerKind']=='wifi' and s['game']['connection']['connected'], 'SDK connection')
        messages=[r['message'] for r in self.report['wire'] if r['direction']=='sdk-to-game']
        assert messages[0]['type']=='hello'
        assert [(m['key'],m['action'],m['pressed']) for m in messages[1:10]]==[(key,'sync',False) for key in KEYS]
        assert self.read()['game']['phase']=='menu'
        return {'initialSyncKeys':len(KEYS),'sdkUnmodified':digest(SDK)==self.report['sourceHashes'][str(SDK.relative_to(REPO))]}

    def sync_and_aliases(self):
        for key,field,value in [('UP','y',-1),('DOWN','y',1),('LEFT','x',-1),('RIGHT','x',1)]:
            self.press(key)
            self.until(lambda s:self.player(s).get(field)==value, key+' held')
            self.release(key)
        for key in ('A','X'):
            self.press(key)
        self.until(lambda s:self.player(s).get('a') is True, 'A/X held')
        self.release('A')
        self.until(lambda s:self.player(s).get('a') is True, 'X remains held after A release')
        time.sleep(.65)
        self.client.button('X','long_press', duration=650)
        self.client.button('X','long_release', duration=700)
        self.held.discard('X')
        self.until(lambda s:self.player(s).get('a') is False, 'X released')
        for key in ('START','A','B','X','Y'):
            self.client.send('button',key=key,action='sync',pressed=True,duration_ms=0)
        time.sleep(.35)
        assert self.read()['game']['phase']=='menu'
        for key in ('START','A','B','X','Y'):
            self.client.send('button',key=key,action='sync',pressed=False,duration_ms=0)
        self.until(lambda s:not any(self.player(s).get(key) for key in ['a','b','start']), 'Synced actions released')
        return {'directions':4,'driftAliasAggregation':True,'heldSyncDoesNotStart':True,'longHold':True}

    def restart_race_from_menu(self, label):
        # Command-R is the app's shipped Restart Race menu item. This invokes
        # normal macOS input, not a diagnostic mutation or a model setter.
        assert self.read()['active'], 'Native game must have focus for its menu shortcut'
        self.release_all()
        result=subprocess.run(['/usr/bin/osascript','-e','tell application "System Events" to keystroke "r" using command down'],capture_output=True,text=True,timeout=15)
        (self.out/(label+'-menu-restart.txt')).write_text(result.stdout+result.stderr)
        assert result.returncode==0, 'Normal Restart Race menu shortcut failed'
        return self.until(lambda s:s['game']['phase']=='playing' and not s['game']['paused'] and s['game']['model']['countdown']>2 and s['game']['model']['raceTime']==0, label+' ordinary restart')

    def steering_direction(self):
        """Use the actual camera, not model yaw conventions or its AI strategy."""
        def project(matrix, car):
            assert len(matrix)==16
            values=[matrix[row]*car['x']+matrix[4+row]*(car['y']+.5)+matrix[8+row]*car['z']+matrix[12+row] for row in range(4)]
            assert values[3]>.01, 'Observed car is behind the frozen reference camera'
            return values[0]/values[3]
        cases=[]
        for key,sign in [('LEFT',-1),('RIGHT',1)]:
            self.restart_race_from_menu('steering-'+key.lower())
            before=self.until(lambda s:s['game']['model']['raceTime']>=.9,'Straight acceleration before '+key,40)['game']
            assert before['model']['trackId']=='skyport', 'Direction check starts on the known straight'
            matrix=before['renderer']['cameraViewProjection']
            assert isinstance(matrix,list) and len(matrix)==16
            self.press(key)
            after=self.until(lambda s:s['game']['model']['raceTime']>=before['model']['raceTime']+.65,'SDK turn '+key,20)['game']
            self.release(key)
            self.tap('START')
            self.until(lambda s:s['game']['paused'],'Pause after SDK turn '+key)
            self.screenshot('steering-'+key.lower()+'.png')
            delta=project(matrix,after['model']['player'])-project(matrix,before['model']['player'])
            row={'input':key,'expectedSign':sign,'screenDeltaX':delta,'before':before,'after':after}
            cases.append(row)
            # Save partial results too, so a failing first direction stays visible.
            self.report['steeringDirection']={'passed':False,'reference':'actual renderer camera view-projection frozen at start of each turn','cases':cases,'sdkUnmodified':digest(SDK)==self.report['sourceHashes'][str(SDK.relative_to(REPO))],'gameStateWrites':False}
            assert after['model']['stats']['collisions']==before['model']['stats']['collisions'], 'Collision interfered with the screen-direction check'
            assert delta*sign>.015, key+' moved in the wrong screen direction: '+str(delta)
        self.report['steeringDirection']['passed']=True
        self.restart_race_from_menu('steering-cleanup')
        self.tap('START')
        self.until(lambda s:s['game']['paused'] and s['game']['model']['countdown']>1,'Fresh race paused for existing drive acceptance')
        return self.report['steeringDirection']

    def drive(self):
        self.tap('START')
        self.until(lambda s:s['game']['phase']=='playing' and not s['game']['paused'], 'Fast START tap begins game')
        self.until(lambda s:s['game']['model']['countdown']<=0 and s['game']['model']['player']['speed']>10, 'Actual WebGL race movement', 40)
        self.driver=subprocess.Popen(['node',str(HERE/'native-drive.mjs')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=(self.out/'driver-stderr.txt').open('w'),text=True,bufsize=1)
        before=self.read()['game']
        target=before['model']['raceTime']+28
        end=time.monotonic()+110
        variants=set()
        while time.monotonic()<end:
            state=self.read()['game']
            if state['model']['raceTime']>=target:
                break
            assert state['phase']=='playing' and not state['paused'], 'Driving unexpectedly paused or ended'
            self.driver.stdin.write(json.dumps(state)+'\n')
            self.driver.stdin.flush()
            picked=json.loads(self.driver.stdout.readline())
            assert isinstance(picked,list),picked
            alias='AB' if state['model']['raceTime']-before['model']['raceTime']<14 else 'XY'
            variants.add(alias)
            mapping={'ArrowLeft':'LEFT','ArrowRight':'RIGHT','ArrowDown':'DOWN','ArrowUp':'UP','Space':alias[0],'b':alias[1]}
            wanted={mapping[key] for key in picked if key in mapping}
            for key in list(self.held-wanted):
                self.release(key)
            for key in wanted-self.held:
                self.press(key)
            time.sleep(.08)
        self.release_all()
        after=self.read()['game']
        assert after['model']['raceTime']>=target-.2, 'Actual race did not advance enough'
        assert after['model']['player']['progress']>before['model']['player']['progress']+30
        for stat in ('drifts','miniBoosts','nitros'):
            assert after['model']['stats'][stat]>0, 'Normal driving did not perform '+stat
        assert variants=={'AB','XY'}
        self.tap('START')
        paused=self.until(lambda s:s['game']['paused'], 'START pause')
        self.screenshot('driving-paused.png')
        model=paused['game']['model']
        time.sleep(.35)
        assert self.read()['game']['model']==model, 'Paused simulation changed'
        self.tap('START')
        self.until(lambda s:not s['game']['paused'] and s['game']['tick']>paused['game']['tick'], 'START resume')
        return {'stats':after['model']['stats'],'progress':after['model']['player']['progress'],'variants':sorted(variants),'pauseFrozen':True}

    def focus_lifecycle(self):
        """Change real macOS focus; never fake host lifecycle or write game state."""
        initial=self.read()
        baseline_session=self.player(initial)['session']
        baseline_id=self.player(initial)['controllerId']
        baseline_socket=self.client.sock
        baseline_connections=self.proxy.connections
        cycles=[]
        graphics=self.report['webglAvailable']
        assert baseline_socket is not None
        assert initial['server']['wifiController']['inputEnabled'] is True

        def neutral(state):
            p=self.player(state)
            return p.get('x')==0 and p.get('y')==0 and not any(p.get(k) for k in ('a','b','start','select'))

        def stable(state):
            p=self.player(state)
            info=state['server']['wifiController']
            assert int(info['port'])==self.port, 'Focus change moved the TCP listener port'
            assert info['state']=='available' and info['serviceName']==self.service, 'Focus change withdrew or renamed Bonjour'
            assert p.get('session')==baseline_session and p.get('controllerId')==baseline_id, 'Focus change replaced the controller session'
            assert self.client.sock is baseline_socket, 'Original SDK socket disconnected'
            assert self.proxy.connections==baseline_connections, 'A new TCP connection was opened'

        def activate(target, name):
            target=target.replace('\\','\\\\').replace('"','\\"')
            result=subprocess.run(['/usr/bin/osascript','-e','tell application "'+target+'" to activate'],capture_output=True,text=True,timeout=15)
            (self.out/name).write_text(result.stdout+result.stderr)
            assert result.returncode==0, 'Actual macOS focus change failed'

        for index in range(1,4):
            self.press('RIGHT')
            self.press('A')
            self.until(lambda s:self.player(s).get('x')==1 and self.player(s).get('a'), 'Held input before focus cycle '+str(index))
            activate('Finder','focus-'+str(index)+'-finder.txt')
            background=self.until(lambda s:not s.get('active') and s['server']['wifiController'].get('inputEnabled') is False and neutral(s) and (not graphics or s['game']['paused']), 'Background clears game input '+str(index))
            stable(background)
            assert background['frontmostApplication']['bundleIdentifier']=='com.apple.finder', 'Finder did not actually take focus'
            frozen=background['game']['model']
            counters=self.player(background)['pulseCounters']
            # All nine keys are physically held at the end; none may produce
            # a gameplay axis or edge while this app lacks foreground focus.
            for key in KEYS:
                if key not in self.held:
                    self.press(key)
                observed=self.until(neutral,'Background suppresses '+key+' '+str(index))
                stable(observed)
                assert self.player(observed)['pulseCounters']==counters, 'Background key generated a pulse'
            self.client.button('A','long_press',duration=650)
            self.client.ping()
            ping_sequence=self.client.seq
            end=time.monotonic()+5
            while time.monotonic()<end:
                if any(row['direction']=='game-to-sdk' and row['connection']==baseline_connections and row['message']=={'type':'ack','seq':ping_sequence} for row in self.report['wire']):
                    break
                time.sleep(.05)
            else:
                raise AssertionError('Background TCP heartbeat did not receive ACK')
            time.sleep(.25)
            observed=self.read()
            stable(observed)
            assert neutral(observed) and self.player(observed)['pulseCounters']==counters
            assert observed['game']['model']==frozen, 'Background controller input advanced the model'
            activate(str(self.args.app.resolve()),'focus-'+str(index)+'-game.txt')
            foreground=self.until(lambda s:s.get('active') and s['server']['wifiController'].get('inputEnabled') is True,'Game foreground '+str(index))
            stable(foreground)
            time.sleep(.25)
            foreground=self.read()
            stable(foreground)
            assert neutral(foreground), 'Held background keys became active on focus return'
            assert self.player(foreground)['pulseCounters']==counters, 'Focus return replayed stale pulses'
            assert foreground['game']['model']==frozen, 'Focus return auto-resumed the game'
            if graphics:
                assert foreground['game']['paused'], 'Fresh START must be required'
            self.release_all()
            released=self.until(neutral,'Release quarantined keys '+str(index))
            assert released['game']['model']==frozen, 'Releasing quarantined keys rewarded gameplay'
            if graphics:
                self.tap('START')
                self.until(lambda s:not s['game']['paused'] and s['game']['tick']>foreground['game']['tick'],'Fresh START works after focus '+str(index))
            self.press('RIGHT')
            self.press('A')
            fresh=self.until(lambda s:self.player(s).get('x')==1 and self.player(s).get('a'),'Fresh direction and drift work '+str(index))
            stable(fresh)
            self.release_all()
            self.until(neutral,'Fresh input release '+str(index))
            cycles.append({'cycle':index,'port':self.port,'session':baseline_session,'backgroundPingAckSequence':ping_sequence,'sameConnection':True,'modelFrozenWhileBackground':True,'heldKeysQuarantined':True,'freshStartResumesGame':True if graphics else None})
        self.report['portStability']={'cycles':len(cycles),'port':self.port,'session':baseline_session,'sameConnection':True,'samePort':True,'backgroundInputSuppressed':True,'foregroundHeldKeysQuarantined':True,'freshPressWorks':True,'defaultPortOccupied':self.args.occupy_default_port,'nativeGameplayAvailable':graphics,'observations':cycles}
        return self.report['portStability']

    def reconnect(self):
        self.press('RIGHT')
        self.press('A')
        self.until(lambda s:self.player(s).get('x')==1 and self.player(s).get('a'), 'Held controls before disconnect')
        self.client.disconnect()
        self.held.clear()
        paused=self.until(lambda s:s['game']['paused'] and s['game']['connection']['disconnected'], 'Disconnect pauses game')
        frozen=paused['game']['model']
        self.client.connect()
        for key in ('START','A','B','X','Y'):
            self.client.send('button',key=key,action='sync',pressed=True,duration_ms=0)
        self.until(lambda s:s['game']['connection']['connected'], 'Reconnected')
        time.sleep(.35)
        synced=self.read()['game']
        assert synced['paused'] and synced['model']==frozen, 'Held reconnect sync advanced the simulation'
        for key in KEYS:
            self.client.send('button',key=key,action='sync',pressed=False,duration_ms=0)
        self.until(lambda s:not any(self.player(s).get(key) for key in ['a','b','start']), 'Reconnect release baseline')
        self.tap('START')
        resumed=self.until(lambda s:not s['game']['paused'] and s['game']['tick']>paused['game']['tick'], 'Fresh START resumes after reconnect')
        assert resumed['game']['model']['stats']['nitros']==frozen['stats']['nitros']
        assert resumed['game']['model']['stats']['miniBoosts']==frozen['stats']['miniBoosts']
        self.tap('START')
        self.until(lambda s:s['game']['paused'], 'Final paused screen')
        self.screenshot('reconnected.png')
        return {'disconnectClearsInput':True,'heldSyncDoesNotResume':True,'noRewardOnCancellation':True}

    def virtual_page(self):
        self.client.disconnect()
        self.until(lambda s:s['game']['connection']['disconnected'], 'SDK releases seat for official page')
        self.bridge=self.log_process([sys.executable,str(REPO/'puretv-joystick/bridge.py'),'127.0.0.1','--port',str(self.proxy.port),'--web-port','0'],'official-bridge.txt')
        end=time.monotonic()+15
        url=None
        while time.monotonic()<end:
            text=(self.out/'official-bridge.txt').read_text(errors='replace')
            match=re.search(r'http://127\.0\.0\.1:[0-9]+/',text)
            if match:
                url=match[0]
                break
            if self.bridge.poll() is not None:
                raise AssertionError('Official bridge exited: '+text)
            time.sleep(.1)
        assert url, 'Official bridge startup URL missing'
        # A first-run macOS prompt may background the game, but it must not
        # recreate the transport or move the already-advertised TCP endpoint.
        current=self.until(lambda s:s.get('active') and s['server']['wifiController']['state']=='available', 'Game foreground after Python network permission', 30)
        assert int(current['server']['wifiController']['port'])==self.port, 'Controller port changed after a system prompt'
        assert current['server']['wifiController']['serviceName']==self.service
        assert self.proxy.target==('127.0.0.1',self.port), 'Observer endpoint must never be retargeted'
        self.report['virtualControllerPort']=self.port
        log=(self.out/'official-virtual-output.txt').open('w')
        self.logs.append(log)
        result=subprocess.run(['node',str(HERE/'official-virtual-native.mjs'),'--url',url,'--diagnostics',str(self.diag),'--output',str(self.out/'official-virtual')],stdout=log,stderr=subprocess.STDOUT,timeout=100)
        assert result.returncode==0, 'Official virtual-controller browser acceptance failed; see its preserved report'
        details=json.loads((self.out/'official-virtual/report.json').read_text())
        assert details['status']=='passed'
        self.report['officialVirtualWebPageTested']=True
        self.bridge.terminate()
        self.bridge.wait(timeout=5)
        self.screenshot('official-controller-paused.png')
        return {'report':'official-virtual/report.json','testsPassed':len(details['tests']),'originalHtmlSha256':details['originalHtmlSha256']}

    def ack_check(self):
        self.heartbeat_stop.set()
        if self.client.sock:
            self.client.ping()
        time.sleep(.3)
        sent={(row['connection'],row['message']['seq']) for row in self.report['wire'] if row['direction']=='sdk-to-game'}
        replies={(row['connection'],row['message']['seq']) for row in self.report['wire'] if row['direction']=='game-to-sdk' and row['message'].get('type')=='ack'}
        assert sent==replies, {'sent':len(sent),'acks':len(replies),'missing':sorted(sent-replies)}
        assert not self.report['observerErrors'], self.report['observerErrors']
        return {'messages':len(sent),'matchingAcks':len(replies),'connections':self.proxy.connections}

    def shutdown(self):
        self.client.disconnect()
        bundle=str(self.args.app.resolve()).replace('\\','\\\\').replace('"','\\"')
        result=subprocess.run(['/usr/bin/osascript','-e',f'tell application "{bundle}" to quit'],capture_output=True,text=True,timeout=15)
        (self.out/'quit.txt').write_text(result.stdout+result.stderr)
        assert result.returncode==0, 'macOS quit command failed'
        self.app.wait(timeout=15)
        assert self.app.returncode==0, 'Application did not exit normally'
        end=time.monotonic()+15
        removed=False
        while time.monotonic()<end:
            lines=(self.out/'bonjour-browse.txt').read_text(errors='replace').splitlines()
            if any('Rmv' in row and self.service in row for row in lines):
                removed=True
                break
            time.sleep(.2)
        assert removed, 'Bonjour service withdrawal was not observed'
        try:
            with socket.create_connection(('127.0.0.1',self.port),timeout=1):
                raise AssertionError('TCP still accepts after app exit')
        except OSError:
            pass
        return {'normalExit':True,'mdnsWithdrawn':True,'tcpClosed':True}

    def run(self):
        try:
            info=plistlib.loads((self.args.app/'Contents/Info.plist').read_bytes())
            binary=self.args.app/'Contents/MacOS'/info['CFBundleExecutable']
            self.report['binarySha256']=digest(binary)
            profile=subprocess.run(['/usr/sbin/system_profiler','SPDisplaysDataType','-json'],capture_output=True,text=True,timeout=30)
            (self.out/'graphics-system.json').write_text(profile.stdout or profile.stderr)
            if os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('RUNNER_OS')=='macOS':
                self.permission_watcher=self.log_process([sys.executable,str(HERE/'allow-local-network.py'),str(self.args.app.resolve())],'network-permission-test.txt')
            if self.args.occupy_default_port:
                self.port_blocker=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
                self.port_blocker.bind(('0.0.0.0',63485))
                self.port_blocker.listen(1)
                self.report['defaultPortOccupation']={'host':'0.0.0.0','port':63485,'listeningBeforeApplicationStart':True,'heldUntilApplicationExit':True}
            launch_prefix=['/usr/bin/arch','-'+self.args.launch_architecture] if self.args.launch_architecture else []
            self.app=self.log_process(launch_prefix+[str(binary),'--diagnostics-dir',str(self.diag),'--language',self.args.language,'--preferences-domain','com.ecojust.neonrush.qa.'+str(os.getpid())],'native-output.txt')
            initial=self.until(lambda s:s.get('ready') and s.get('game',{}).get('phase')=='menu' and s.get('active'), 'Native game menu', 60)
            self.report['nativeProcessArchitecture']=initial.get('processArchitecture')
            graphics_available=not initial['document']['webglError']
            self.report['webglAvailable']=graphics_available
            assert graphics_available or self.args.allow_unavailable_webgl, 'Actual WKWebView could not create WebGL'
            assert initial['document']['scrollWidth']<=initial['document']['width']+1
            assert initial['document']['scrollHeight']<=initial['document']['height']+1
            self.screenshot('menu.png')
            self.check('Local HTTP assets match the bundle and reject invalid requests',self.local_assets)
            self.check('Bonjour resolves the actual TCP port and version',self.discovery)
            self.check('Unmodified SDK connects and synchronizes nine keys',self.connect)
            self.check('Directions, A/X aggregation, long hold and sync suppression',self.sync_and_aliases)
            if graphics_available:
                self.check('SDK LEFT and RIGHT move toward their actual screen directions',self.steering_direction)
                self.check('Real race using TCP A/B and X/Y, drift, nitro and pause',self.drive)
            self.check('Three real focus changes keep TCP stable and quarantine background input',self.focus_lifecycle)
            if graphics_available:
                self.check('Disconnect cancellation and held-sync reconnect safety',self.reconnect)
                self.check('Official virtual page controls the actual native application',self.virtual_page)
            else:
                self.report['limitations']=['This hosted Intel Mac could not create a WebGL context; actual 3D driving and virtual-page gameplay checks were not run on this machine. Package, native protocol, TCP/SDK, Bonjour and error UI checks still ran.']
            self.check('Every observed SDK message has the same-sequence ACK',self.ack_check)
            self.check('Normal quit closes TCP and withdraws Bonjour',self.shutdown)
            for path,expected in self.report['sourceHashes'].items():
                assert digest(REPO/path)==expected, 'Test source changed during run: '+path
            self.report['status']='passed' if graphics_available else 'limited_graphics'
        except Exception:
            self.report['status']='failed'
            self.report['error']=traceback.format_exc()
            self.report['lastState']=self.last_state
            subprocess.run(['/usr/sbin/screencapture','-x',str(self.out/'failure-screen.png')],capture_output=True,timeout=10)
            subprocess.run(['/usr/bin/osascript','-e','tell application "System Events" to get name of every application process whose frontmost is true'],stdout=(self.out/'failure-frontmost.txt').open('w'),stderr=subprocess.STDOUT,timeout=10)
            print(self.report['error'],file=sys.stderr)
        finally:
            self.heartbeat_stop.set()
            if self.client:
                self.client.disconnect()
            if self.proxy:
                self.proxy.close()
            for process in (self.driver,self.bridge,self.resolve,self.browse,self.permission_watcher,self.app):
                if process and process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
            if self.port_blocker:
                self.port_blocker.close()
            for log in self.logs:
                log.close()
            shutil.copy2(__file__,self.out/'executed-verify-native.py')
            shutil.copy2(HERE/'native-drive.mjs',self.out/'executed-native-drive.mjs')
            shutil.copy2(HERE/'allow-local-network.py',self.out/'executed-allow-local-network.py')
            shutil.copy2(HERE/'official-virtual-native.mjs',self.out/'executed-official-virtual-native.mjs')
            self.report['finishedAt']=now()
            (self.out/'report.json').write_text(json.dumps(self.report,ensure_ascii=False,indent=2)+'\n')
            print('Evidence: '+str(self.out/'report.json'),flush=True)
        return 0 if self.report['status'] in ('passed','limited_graphics') else 1

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--language',choices=['zh','en'],default='zh')
    parser.add_argument('--launch-architecture',choices=['arm64','x86_64'])
    parser.add_argument('--allow-unavailable-webgl',action='store_true')
    parser.add_argument('--occupy-default-port',action='store_true',help='Occupy TCP 63485 before launch and verify one stable fallback throughout the same acceptance suite')
    arguments=parser.parse_args()
    if sys.platform!='darwin':
        parser.error('Run on macOS against the built .app; no simulated substitute')
    sys.exit(NativeCheck(arguments).run())
