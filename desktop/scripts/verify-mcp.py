#!/usr/bin/env python3
"""Exercise the built GUI through its stdio MCP proxy using a simulated TV.

Linux CI runs this inside Xvfb. No real TV, network downloads, or user data.
"""
import argparse
import json
import os
from pathlib import Path
import queue
import subprocess
import tempfile
import threading
import time

FAKE_ADB = r'''#!/usr/bin/env python3
import json, os, sys, time, base64, re
from pathlib import Path
root=Path(os.environ['PURETV_FAKE_ROOT'])
with (root/'adb-calls.jsonl').open('a') as calls:calls.write(json.dumps(sys.argv[1:])+'\n')
p=root/'tv.json';tv=json.loads(p.read_text());args=sys.argv[1:]
def save():
 temp=p.with_suffix('.tmp');temp.write_text(json.dumps(tv));os.replace(temp,p)
if args[0]=='version':print('Android Debug Bridge version 1.0.41')
elif args[0]=='kill-server':print('')
elif args[0]=='devices':print('List of devices attached\n192.168.1.50:5555\tdevice model:TestTV')
elif args[0]=='pair':
 assert sys.stdin.read().strip()=='123456';print('Successfully paired to 192.168.1.50:33111')
elif args[0] in ['connect','disconnect']:print('connected' if args[0]=='connect' else 'disconnected')
elif args[:2]==['-s','192.168.1.50:5555']:
 if args[2]=='exec-out':sys.stdout.buffer.write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII='))
 elif args[2]=='pull':Path(args[-1]).write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII='));print('pulled')
 elif args[2]=='install':tv['installed'].append('com.imported.app');save();print('Success')
 else:
  a=args[3:]
  if a[0]=='am':print('Starting HOME' if a[1]=='start' else '0')
  elif a[0] in ['screencap','rm']:print('')
  elif a[0]=='content':
   method=a[a.index('--method')+1];uri=a[a.index('--uri')+1]
   defaults={'content://com.ecojust.puretv.layout':'default-layout.json','content://com.ecojust.novatv.layout':'nova-layout.json'}
   assert uri in defaults,uri
   layouts=tv.setdefault('layouts',{})
   if method=='apply':layouts[uri]=json.loads(base64.b64decode(a[a.index('--arg')+1]));save()
   elif method=='reset':layouts.pop(uri,None);save()
   else:assert method=='status',method
   default=json.loads((root/defaults[uri]).read_text())
   result={'supported':True,'version':5,'custom':uri in layouts,'layout':layouts.get(uri,default),'systemBasis':{'screen':default['screen'],'home':default['home']['system'],'apps':default['apps']['system']},'apps':[{'packageName':'com.ecojust.puretv','label':'pureTV'}]}
   print('Bundle[{result='+base64.b64encode(json.dumps(result).encode()).decode()+'}]')
  elif a[0]=='cat':print('MemTotal: 4096 kB\nMemAvailable: 1024 kB' if a[1]=='/proc/meminfo' else '3600.25 20.0')
  elif a[0]=='df':print('Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/data 4096 1024 3072 25% /data')
  elif a[0]=='wm':print('Physical size: 1920x1080')
  elif a[0]=='getprop' and len(a)==1:print('[ro.product.manufacturer]: [Test Maker]\n[ro.build.version.sdk]: [33]\n[ro.product.cpu.abi]: [arm64-v8a]')
  elif a[0]=='getprop':
   if (root/'slow').exists():time.sleep(3)
   print('MCP Test TV' if a[1]=='ro.product.model' else '13')
  elif a[0]=='dumpsys':print('Packages:\n  User 0: installed=true hidden=false enabled=0')
  elif a[0]=='sh':
   script=a[2]
   if 'for p in ' in script:
    names=script.split('for p in ',1)[1].split('; do',1)[0].split()
    for name in names:print('@@puretv@@'+name+'\npackage:/data/app/'+name+'/base.apk')
   else:
    for name in re.findall(r'@@puretv@@([A-Za-z0-9_.]+)',script):print('@@puretv@@'+name+'\n1024')
  elif a[0]=='stat':print('1024')
  elif a[:2]==['pm','path']:print('package:/data/app/example/base.apk')
  elif a[:2]==['pm','list']:
   data=tv['system'] if '-s' in a else tv['disabled'] if '-d' in a else list(set(tv['installed']+tv['system'])) if '-u' in a else tv['installed']
   print('\n'.join('package:'+x for x in data))
  elif a[0]=='pm':
   target=a[-1]
   if a[1]=='disable-user':tv['disabled'].append(target)
   elif a[1] in ['enable','default-state']:tv['disabled']=[p for p in tv['disabled'] if p!=target]
   elif a[1]=='uninstall':tv['installed'].remove(target)
   else:raise AssertionError(a)
   save();print('Success' if a[1]=='uninstall' else 'new state: changed')
  elif a[:2]==['cmd','package']:
   if a[2]=='query-activities':print('com.stock.home/.Main\ncom.ecojust.puretv/.MainActivity\ncom.ecojust.novatv/.MainActivity')
   elif a[2]=='resolve-activity':print(tv['home'])
   elif a[2]=='set-home-activity':tv['home']=a[-1].strip("'");save();print('Success')
   elif a[2]=='install-existing':tv['installed'].append(a[-1]);save();print('Package installed for user')
   else:raise AssertionError(a)
  else:raise AssertionError(a)
else:raise AssertionError(args)
'''

class Client:
    def __init__(self, binary, session, env):
        self.process = subprocess.Popen([str(binary), '--mcp', str(session)], env=env,
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.messages = queue.Queue()
        self.saved = {}
        self.serial = 0
        def read():
            for line in self.process.stdout:
                try: self.messages.put(json.loads(line))
                except Exception as e: self.messages.put(e)
        threading.Thread(target=read, daemon=True).start()
    def send(self, method, params=None):
        self.serial += 1
        self.process.stdin.write(json.dumps({'jsonrpc':'2.0','id':self.serial,'method':method,'params':params or {}})+'\n')
        self.process.stdin.flush()
        return self.serial
    def receive(self, request_id):
        end = time.monotonic()+30
        while request_id not in self.saved:
            value = self.messages.get(timeout=max(0.01,end-time.monotonic()))
            assert isinstance(value,dict), value
            self.saved[value['id']] = value
        return self.saved.pop(request_id)
    def rpc(self, method, params=None): return self.receive(self.send(method,params))
    def call(self, name, arguments=None, failure=False):
        response = self.rpc('tools/call', {'name':name,'arguments':arguments or {}})
        assert 'error' not in response, response
        result = response['result']
        assert result['isError'] == failure, response
        print('PASS MCP:', name, '(expected failure)' if failure else '', flush=True)
        return result.get('structuredContent',{}).get('result')
    def close(self):
        self.process.stdin.close()
        try: self.process.wait(timeout=10)
        except subprocess.TimeoutExpired: self.process.kill(); self.process.wait()


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--binary',required=True)
    binary=Path(parser.parse_args().binary).resolve()
    with tempfile.TemporaryDirectory(prefix='puretv-mcp-smoke-') as temp:
        root=Path(temp);adb=root/'adb';adb.write_text(FAKE_ADB);adb.chmod(0o755)
        (root/'tv.json').write_text(json.dumps({'installed':['android','com.android.systemui','com.stock.home','com.ecojust.puretv','com.ecojust.novatv','com.vendor.ads'], 'system':['android','com.android.systemui','com.stock.home','com.vendor.ads','com.vendor.removed'],'disabled':[],'home':'com.stock.home/.Main'}))
        (root/'default-layout.json').write_text(Path('../resource/launcher/puretv/app/src/main/assets/layout.json').read_text())
        (root/'nova-layout.json').write_text(Path('../resource/launcher/nova/app/src/main/assets/layout.json').read_text())
        env={**os.environ,'XDG_DATA_HOME':str(root/'data'),'XDG_CONFIG_HOME':str(root/'config'),'XDG_CACHE_HOME':str(root/'cache'),'PURETV_ADB':str(adb),'PURETV_FAKE_ROOT':str(root)}
        with (root/'gui.log').open('w') as log:
            gui=subprocess.Popen([str(binary)],env=env,stdout=log,stderr=log)
            client=None
            try:
                session=root/'data/com.ecojust.puretv.manager/mcp-session.json'
                for _ in range(200):
                    if gui.poll() is not None: raise RuntimeError((root/'gui.log').read_text())
                    if session.exists():break
                    time.sleep(.1)
                assert session.exists(), (root/'gui.log').read_text()
                client=Client(binary,session,env)
                init=client.rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'puretv-smoke','version':'1'}})
                assert init['result']['serverInfo']['name']=='pureTV Manager',init
                names={t['name'] for t in client.rpc('tools/list')['result']['tools']}
                assert len(names)==31,names
                network=client.call('get_local_network')['localNetwork']
                assert isinstance(network['addresses'],list)
                for row in network['addresses']:assert row['interfaceName'] and not row['ip'].startswith('127.') and 0<=row['prefixLength']<=32
                client.call('set_interface_preferences',{'locale':'en','theme':'ocean'})
                assert client.call('get_interface_preferences')['theme']=='ocean'
                assert client.call('get_state')['adbAvailable']
                client.call('set_adb_path',{'path':str(adb)})
                state=client.call('connect',{'host':'192.168.1.50','port':5555})
                assert state['device']['model']=='MCP Test TV'
                assert state['systemInfo']['memoryTotalBytes']==4194304
                client.call('refresh_system_info')
                assert next(p for p in state['packages'] if p['packageName']=='com.ecojust.puretv')['apkSizeBytes']==1024
                client.call('set_enabled',{'packages':['com.vendor.ads'],'enabled':False})
                assert next(p for p in client.call('get_state')['packages'] if p['packageName']=='com.vendor.ads')['enabled'] is False
                client.call('set_enabled',{'packages':['com.vendor.ads'],'enabled':True})
                protected=client.call('uninstall',{'packages':['com.android.systemui']},failure=True)
                assert protected['failedTargets'] and protected['snapshot']['history'][0]['success'] is False
                client.call('uninstall',{'packages':['com.vendor.ads']})
                client.call('restore',{'packages':['com.vendor.ads']})
                apk=root/'example.apk';apk.write_bytes(b'fake APK for simulated ADB')
                client.call('install',{'paths':[str(apk)]})
                before_home=client.call('get_state')['defaultHome'];assert isinstance(client.call('get_launcher_backgrounds')['backgrounds'],dict);assert client.call('get_state')['defaultHome']==before_home
                assert client.call('get_launcher_layout')['supported'] is False
                client.call('apply_launcher_layout',{'layoutJson':(root/'default-layout.json').read_text()},failure=True)
                client.call('set_home',{'component':'com.ecojust.puretv/.MainActivity'})
                layout=client.call('get_launcher_layout');assert layout['supported'] is True,layout
                draft=layout['layout']
                draft['home']['users']=[{'id':'user-puretv','name':'pureTV','text':'Open pureTV','action':'com.ecojust.puretv','frame':{'x':48,'y':220,'width':200,'height':150},'visible':True,'icon':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>','textColor':'#FFFFFF','iconColor':'#C6DDCF','backgroundColor':'#374959'}]
                tampered=json.loads(json.dumps(draft));tampered['home']['system'][0]['frame']['x']+=1
                client.call('apply_launcher_layout',{'layoutJson':json.dumps(tampered)},failure=True)
                assert client.call('apply_launcher_layout',{'layoutJson':json.dumps(draft)})['layout']==draft
                assert client.call('get_launcher_layout')['layout']['home']['users'][0]['action']=='com.ecojust.puretv'
                assert client.call('reset_launcher_layout')['custom'] is False
                # Exercise the second package through the actual GUI + stdio bridge.
                # Each provider owns its state; an incorrect URI must fail these comparisons.
                pure_default=json.loads((root/'default-layout.json').read_text())
                nova_default=json.loads((root/'nova-layout.json').read_text())
                assert nova_default!=pure_default
                client.call('set_home',{'component':'com.ecojust.novatv/.MainActivity'})
                nova=client.call('get_launcher_layout')
                assert nova['supported'] is True and nova['layout']==nova_default,nova
                assert nova['component'].split('/')[0]=='com.ecojust.novatv'
                nova_draft=json.loads(json.dumps(nova_default));nova_draft['home']['users']=draft['home']['users']
                nova_draft['home']['background']['color']='#142334'
                tampered=json.loads(json.dumps(nova_draft));tampered['home']['system'][0]['frame']['x']+=1
                client.call('apply_launcher_layout',{'layoutJson':json.dumps(tampered)},failure=True)
                assert client.call('apply_launcher_layout',{'layoutJson':json.dumps(nova_draft)})['layout']==nova_draft
                assert client.call('get_launcher_layout')['layout']==nova_draft
                saved_tv=json.loads((root/'tv.json').read_text())
                assert saved_tv['layouts']['content://com.ecojust.novatv.layout']==nova_draft
                assert 'content://com.ecojust.puretv.layout' not in saved_tv['layouts']
                backgrounds=client.call('get_launcher_backgrounds')['backgrounds']
                if 'image' in nova_default['home']['background']:
                    assert backgrounds[nova['component']]==nova_default['home']['background']['image']
                assert client.call('get_state')['defaultHome']==nova['component']
                reset=client.call('reset_launcher_layout');assert reset['custom'] is False and reset['layout']==nova_default
                assert client.call('get_launcher_layout')['layout']==nova_default
                client.call('set_home',{'component':'com.ecojust.puretv/.MainActivity'})
                assert client.call('get_launcher_layout')['layout']==pure_default
                print('PASS: independent Nova and pureTV providers, v5 editing, system lock, covers and reset',flush=True)
                assert client.call('get_launcher_covers')=={}
                assert client.call('get_state')['originalHome']=='com.stock.home/com.stock.home.Main'
                client.call('restore_home')
                assert client.call('get_state')['defaultHome']=='com.stock.home/com.stock.home.Main'
                assert client.call('platform_tools_info')['version']=='37.0.1'
                client.call('install_platform_tools',{'acceptedLicense':True},failure=True) # TV is connected: never downloads.
                client.call('install_platform_tools',{'acceptedLicense':True,'forceDownload':True},failure=True) # Same connected-TV guard for forced replacement.
                invalid=client.rpc('tools/call',{'name':'install_platform_tools','arguments':{'acceptedLicense':False}})
                assert invalid['error']['code']==-32602
                (root/'slow').touch()
                pending=client.send('tools/call',{'name':'scan','arguments':{}})
                for _ in range(50):
                    if client.call('get_status')['running']:break
                    time.sleep(.05)
                else: raise AssertionError('Scan never became busy')
                client.call('clear_history',failure=True) # GUI and MCP share the busy gate.
                client.call('cancel')
                assert client.receive(pending)['result']['isError']
                (root/'slow').unlink()
                client.call('scan')
                client.call('clear_history')
                assert client.call('get_state')['history']==[]
                client.call('disconnect')
                assert client.call('get_state')['device'] is None
                # Pairing code never reaches saved state.
                saved=(session.parent/'state.json').read_text();assert '123456' not in saved
                denied=client.rpc('tools/call',{'name':'close_manager','arguments':{'confirmShutdown':False}})
                assert denied['error']['code']==-32602 and gui.poll() is None
                client.call('connect',{'host':'192.168.1.50','port':5555})
                (root/'slow').touch()
                client.send('tools/call',{'name':'scan','arguments':{}})
                for _ in range(50):
                    if client.call('get_status')['running']:break
                    time.sleep(.05)
                else: raise AssertionError('Shutdown scan never became busy')
                client.send('tools/call',{'name':'close_manager','arguments':{'confirmShutdown':True}})
                client.send('tools/call',{'name':'close_manager','arguments':{'confirmShutdown':True}})
                gui.wait(timeout=20);assert gui.returncode==0
                calls=[json.loads(line) for line in (root/'adb-calls.jsonl').read_text().splitlines()]
                assert calls[-1]==['kill-server'] and calls.count(['kill-server'])==1,calls[-4:]
                print('PASS: normal shutdown stops ADB exactly once before exiting',flush=True)
                closed=client.rpc('tools/call',{'name':'get_state'})
                assert closed['error']['code']==-32603
                print('PASS: real GUI, MCP stdio, all device actions, protection, cancellation, and closed-window errors',flush=True)
            finally:
                if client:client.close()
                if gui.poll() is None:gui.terminate();gui.wait(timeout=10)

if __name__=='__main__': main()
