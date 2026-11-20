"""Drive the shipped HTML using the original TCP SDK and a local browser host fixture."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import importlib.util
import json
from pathlib import Path
from socketserver import StreamRequestHandler, ThreadingTCPServer
import sys
import threading
import time
from playwright.sync_api import sync_playwright

GAME = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GAME.parents[1] / 'puretv-joystick'))
from joystick_sdk import JoystickClient, KEYS
spec = importlib.util.spec_from_file_location('qa', GAME.parent / 'tools/qa-plan.py')
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)

class Wire(StreamRequestHandler):
    def handle(self):
        identity = None
        try:
            for line in self.rfile:
                event = json.loads(line)
                with self.server.lock:
                    if event['type'] == 'hello':
                        identity = event['controller_id']
                        self.server.sessions += 1
                        self.server.player = dict(id=1, controllerId=identity, session=str(self.server.sessions),
                                                  cancelSeq=0, transport='wifi', connected=True, buttons=dict.fromkeys(KEYS, False))
                    if event['type'] == 'button' and identity:
                        self.server.player['buttons'][event['key']] = event['pressed']
                    self.wfile.write((json.dumps({'type':'ack','seq':event['seq']})+'\n').encode())
        finally:
            with self.server.lock:
                if self.server.player and self.server.player['controllerId'] == identity:
                    self.server.player = None

class PageHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_GET(self):
        if self.path != '/controller': return super().do_GET()
        with self.server.tcp.lock:
            player=self.server.tcp.player
            body=json.dumps({'players':[player] if player else []}).encode()
        self.send_response(200)
        self.send_header('Content-Type','application/json')
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        self.wfile.write(body)

def run(page, client, out, width):
    plan=qa.load_plan(GAME / 'qa-plan.json')
    def snap(): return page.evaluate('window.JoystickGameQA.snapshot()')
    def wait(predicate, limit=12):
        start=time.monotonic()
        while time.monotonic()-start<limit:
            state=snap()
            assert not state['errors'],state['errors']
            if predicate(state):return state
            page.wait_for_timeout(55)
        raise AssertionError(str(state['gameplay']))
    def tap(key):
        client.button(key,'down')
        wait(lambda s:s['controller']['buttons'][key])
        page.wait_for_timeout(100)
        client.button(key,'up')
        wait(lambda s:not s['controller']['buttons'][key])
    page.wait_for_function('window.JoystickGameQA?.snapshot().stage==="menu"')
    client.connect()
    wait(lambda s:s['controller']['connected'])
    page.screenshot(path=out/f'title-{width}.png')
    evidence=[]
    for step in plan['steps']:
        before=snap();tap(step['keys'][0])
        after=wait(lambda s:qa.matches(step['expect'],s,before),step['timeoutSeconds'])
        evidence.append({'action':step['name'],'stage':after['stage'],'gameplay':after['gameplay']})
        if step['name']=='Close the pickup narration':
            page.screenshot(path=out/f'cottage-{width}.png')
        if step['name']=='Explicitly resume the story':
            page.screenshot(path=out/f'green-{width}.png')
    # Observe a real TCP client disconnect, confirm stable simulation, reconnect then explicit START.
    client.disconnect();paused=wait(lambda s:s['paused'])
    page.wait_for_timeout(350)
    assert all(qa.read_path(paused,k)==qa.read_path(snap(),k) for k in plan['pauseStablePaths'])
    client.connect();wait(lambda s:s['paused'] and s['controller']['connected'])
    tap('START');wait(lambda s:s['stage']=='playing')
    previous=snap()['gameplay']
    client.disconnect()
    page.reload()
    page.wait_for_function("window.JoystickGameQA?.snapshot().stage==='menu' && document.activeElement?.id==='t-continue'")
    client.connect();wait(lambda s:s['controller']['connected'])
    tap('A')
    restored=wait(lambda s:s['gameplay']['screen']=='world' and not s['gameplay']['busy'])
    for field in ('inventory','scene','score','talkedMab','visited'):
        assert restored['gameplay'][field]==previous[field],field
    page.keyboard.press('p');wait(lambda s:s['paused'])
    page.keyboard.press('p');wait(lambda s:not s['paused'])
    client.disconnect()
    evidence.append({'action':'Reload and continue the original autosave', 'gameplay':restored['gameplay']})
    return evidence

if __name__=='__main__':
    args=argparse.ArgumentParser()
    args.add_argument('output',type=Path);args.add_argument('--chromium',default='chromium')
    args=args.parse_args();args.output.mkdir(exist_ok=True,parents=True)
    import shutil
    with ThreadingTCPServer(('127.0.0.1',0),Wire) as tcp, ThreadingHTTPServer(('127.0.0.1',0),partial(PageHandler,directory=GAME/'dist')) as http:
        tcp.lock=threading.Lock();tcp.sessions=0;tcp.player=None;http.tcp=tcp
        for server in (tcp,http):threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=shutil.which(args.chromium),args=['--no-sandbox'])
                results={}
                for width,height in [(960,540),(1280,720)]:
                    page=browser.new_page(viewport=dict(width=width,height=height))
                    page.add_init_script("""(()=>{let frame='{"players":[]}';window.PureGameHost={getInfo:()=>JSON.stringify({wifiController:{state:'listening',port:PORT,serviceName:'Story Thief'}}),snapshot:()=>frame};
                      async function read(){try{const r=await fetch('/controller');if(r.ok)frame=await r.text();}finally{setTimeout(read,18)}}read()})();""".replace('PORT',str(tcp.server_address[1])))
                    client=JoystickClient('127.0.0.1',tcp.server_address[1])
                    page.goto(f'http://127.0.0.1:{http.server_address[1]}/tv.html')
                    try:results[str(width)]=run(page,client,args.output,width)
                    finally:client.disconnect();page.close()
                (args.output/'sdk-browser.json').write_text(json.dumps(results,indent=2)+'\n')
                browser.close()
        finally:tcp.shutdown();http.shutdown()
