"""Play the distribution at two TV sizes using only the native-host button interface."""
import argparse, contextlib, hashlib, http.server, json, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main(game):
    out=game/'docs/browser'
    out.mkdir(parents=True,exist_ok=True)
    plan=json.loads((game/'qa-plan.json').read_text())
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw): super().__init__(*a,directory=game/'dist',**kw)
        def log_message(self,*a): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin='http://127.0.0.1:'+str(server.server_port)
    report=dict(game=game.name,syntheticHostBridge=True,nativePackageTested=False,physicalTvTested=False,physicalPhoneTested=False,htmlSha256=digest(game/'dist/tv.html'),planSha256=digest(game/'qa-plan.json'),results=[])
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'],env=__import__('os').environ|{'LIBGL_ALWAYS_SOFTWARE':'1'})
        report['chromium']=browser.version
        for width,height in [(960,540),(1280,720)]:
            ctx=browser.new_context(viewport=dict(width=width,height=height),device_scale_factor=1)
            page=ctx.new_page();errors=[];external=[]
            result=dict(width=width,height=height,steps=[],runtimeErrors=errors,externalRequests=external)
            report['results'].append(result)
            page.on('pageerror',lambda e: errors.append(str(e.stack)))
            page.on('request',lambda r: external.append(r.url[:160]) if not r.url.startswith((origin,'data:','blob:')) else None)
            page.add_init_script("""const keys=['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'];
            window.testController={id:1,controllerId:'puzzle-browser',session:'one',connected:true,inputActive:true,transport:'wifi',cancelSeq:0,rssi:-49,buttons:Object.fromEntries(keys.map(k=>[k,false]))};
            window.testAudio=[];const OriginalAC=window.AudioContext;
            window.AudioContext=class extends OriginalAC {constructor(...args){super(...args);testAudio.push(this)}};
            window.reads=0;window.PureGameHost={snapshot(){reads++;return JSON.stringify({players:[testController],inputActive:true});},getInfo(){return JSON.stringify({wifiController:{port:63485,state:'ready',addresses:['127.0.0.1']}});}};""")
            snap=lambda:page.evaluate('JoystickGameQA.snapshot()')
            def until(js,arg=None):
                page.wait_for_function(js,arg=arg,timeout=120000,polling=150)
            def tap(keys):
                page.evaluate('ks=>{for(const k of ks)testController.buttons[k]=true}',keys)
                until('ks=>ks.every(k=>JoystickGameQA.snapshot().controller.buttons[k])',keys)
                page.evaluate('()=>{for(const k in testController.buttons)testController.buttons[k]=false}')
                until('()=>Object.values(JoystickGameQA.snapshot().controller.buttons).every(x=>!x)')
            def shot(name): page.screenshot(path=out/f'{name}-{width}.png',timeout=60000)
            try:
                page.goto(origin+'/tv.html',wait_until='commit',timeout=120000)
                until('()=>window.JoystickGameQA?.snapshot().frames>2');s=snap()
                assert s['stage']=='menu' and not s['paused'];shot('menu')
                result['webglVersion']=s['webglVersion']
                for step in plan['steps']:
                    before=snap();tap(step['keys'])
                    until("""({expect,before})=>{const s=JoystickGameQA.snapshot(),read=(s,p)=>p.split('.').reduce((a,k)=>a?.[k],s);
                    return expect.every(e=>{const v=read(s,e.path),b=read(before,e.path);return v!=null&&({eq:v===e.value,gte:v>=e.value,changed:v!==b,increased:v>b})[e.op]})}""",dict(expect=step['expect'],before=before))
                    after=snap();result['steps'].append(dict(name=step['name'],keys=step['keys'],stage=after['stage'],gameplay=after['gameplay']))
                    print(width,step['name'],after['gameplay'],flush=True)
                    if after['stage']=='playing':
                        until("()=>testAudio.length===1&&testAudio[0].state==='running'")
                    if after['paused']:
                        until("()=>testAudio[0].state==='suspended'")
                        timeBefore=page.evaluate('testAudio[0].currentTime')
                        shot('paused')
                        assert page.evaluate('testAudio[0].currentTime')==timeBefore
                        paused=after['gameplay'];page.wait_for_timeout(400);assert paused==snap()['gameplay']
                if game.name=='bumble-basket': until('()=>!JoystickGameQA.snapshot().gameplay.busy')
                shot('playing')
                page.evaluate('testController.connected=false')
                until("()=>JoystickGameQA.snapshot().paused&&testAudio[0].state==='suspended'")
                page.evaluate("()=>{testController.buttons.START=true;testController.session='two';testController.connected=true}")
                until('()=>JoystickGameQA.snapshot().controller.connected')
                page.wait_for_timeout(250);assert snap()['paused'] and page.evaluate('testAudio[0].state')=='suspended'
                page.evaluate('testController.buttons.START=false')
                until('()=>!JoystickGameQA.snapshot().controller.players[0].buttons.START')
                tap(['START']);assert snap()['stage']=='playing'
                old=snap()['frames']
                page.evaluate('window.PureGame.focus(false)')
                until('old=>{const s=JoystickGameQA.snapshot();return s.paused&&s.frames>old+1&&!s.controller.players[0].buttons.START}',old)
                until("()=>testAudio[0].state==='suspended'")
                page.evaluate('window.PureGame.focus(true)')
                tap(['START']);assert snap()['stage']=='playing'
                until("()=>testAudio[0].state==='running'")
                old=snap()['frames']
                page.evaluate('window.PureGame.suspend(true)')
                until("old=>JoystickGameQA.snapshot().frames>old+1&&JoystickGameQA.snapshot().paused&&testAudio[0].state==='suspended'",old)
                page.evaluate('window.PureGame.resume()')
                assert snap()['paused'] and page.evaluate('testAudio[0].state')=='suspended'
                tap(['START'])
                until("()=>JoystickGameQA.snapshot().stage==='playing'&&testAudio[0].state==='running'")
                result['audio']={'playing':'running','paused':'suspended','pausedClockFrozen':True,'disconnect':'suspended','heldReconnect':'suspended','focusLoss':'suspended','hostBackground':'suspended','hostForeground':'suspended','manualResume':'running'}
                result['layout']=page.evaluate("""()=>{const r=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};const s=JoystickGameQA.snapshot();return {panel:r('puretv-controller-panel'),controls:r('tv-controls'),viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,frames:s.frames,polls:s.controller.pollCount,nativeReads:reads,storedKeys:Object.keys(localStorage)}}""")
                layout=result['layout'];assert layout['controls']['bottom']<=height and layout['panel']['right']<=width and layout['scrollWidth']==width
                assert layout['frames']==layout['polls']==layout['nativeReads'] and not errors and not external and not snap()['errors']
                result.update(disconnectPaused=True,reconnectHeldStartIgnored=True,focusLossPaused=True)
            except Exception as e:
                result['failure']=str(e)[:640]
                with contextlib.suppress(Exception):result['last']=snap();shot('failure')
                print(result,flush=True)
                raise
            finally:
                (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
                ctx.close()
        browser.close();server.shutdown()

if __name__=='__main__':
    import sys
    main(Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2])
