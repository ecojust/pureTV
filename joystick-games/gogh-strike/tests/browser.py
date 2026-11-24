"""Run the shipped page with keyboard, or a phone/Wi-Fi native bridge fixture. No simulation hooks."""
import argparse
import json
import os
import shutil
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

GAME = Path(__file__).resolve().parents[1]
STATE = "window.JoystickGameQA.snapshot()"

class LocalAssets(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def check(page, expression):
    state = page.wait_for_function("""() => {
        const error=document.getElementById('fatal-error');
        if(error&&!error.hidden)return document.getElementById('fatal-error-message').textContent||'Fatal boot error';
        return ("""+expression+""") ? true : false;
    }""", polling=120, timeout=180000).json_value()
    assert state is True,state

def run(browser, url, mode, width, height, evidence, video=None):
    page = browser.new_page(viewport={"width":width,"height":height})
    failures = []
    def on_error(error):
        failures.append(str(error))
        print(str(error),file=sys.stderr,flush=True)
    page.on("pageerror", on_error)
    page.on("response", lambda r: failures.append(f"{r.status} {r.url}") if r.status >= 400 else None)
    def route(request):
        if request.request.url.startswith((url, "data:", "blob:")):
            request.continue_()
        else:
            failures.append("External request: " + request.request.url)
            request.abort()
    page.route("**/*", route)
    if mode=="gamepad":
        page.add_init_script("""window.seat=null;
            Object.defineProperty(navigator,'getGamepads',{value:()=>seat?.connected?[seat]:[]});""")
    elif mode != "keyboard":
        page.add_init_script("""window.seat=null;window.PureGameHost={
            snapshot:()=>JSON.stringify({players:window.seat?[seat]:[],inputActive:true}),
            getInfo:()=>JSON.stringify({url:'http://127.0.0.1/room',wifiController:{port:63485}}),
            publish:v=>window.lastReport=JSON.parse(v)}""")
    def state():
        return page.evaluate(STATE)
    keys = {"UP":"ArrowUp","DOWN":"ArrowDown","RIGHT":"ArrowRight","LEFT":"ArrowLeft",
            "A":"z","B":"x","X":"c","Y":"v","START":"p"}
    def button(action, held):
        if mode == "keyboard":
            (page.keyboard.down if held else page.keyboard.up)(keys[action])
        elif mode=="gamepad":
            index={"A":0,"B":1,"X":2,"Y":3,"START":9,"UP":12,"DOWN":13,"LEFT":14,"RIGHT":15}[action]
            page.evaluate("([i,v])=>seat.buttons[i].pressed=v",[index,held])
        else:
            page.evaluate("""([k,down])=>{
              if(seat.transport==='wifi')seat.buttons[k]=down;
              else if(k==='UP'||k==='DOWN')seat.y=down?(k==='UP'?-1:1):0;
              else if(k==='LEFT'||k==='RIGHT')seat.x=down?(k==='LEFT'?-1:1):0;
              else seat[({START:'start',A:'a',B:'b',X:'buttonX',Y:'buttonY'})[k]]=down
            }""",[action,held])
        check(page,f"{STATE}.controller.buttons.{action} === {str(held).lower()}")
    def press(action, until):
        button(action,True)
        check(page, until)
        button(action,False)
        print(mode,action,until,file=sys.stderr,flush=True)
    def capture(name):
        if evidence:
            evidence.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=evidence/f"{width}-{mode}-{name}.jpg",type="jpeg",quality=85,timeout=180000)
    page.goto(url+"/tv.html",wait_until="commit",timeout=60000)
    check(page,f"window.JoystickGameQA && {STATE}.stage === 'menu'")
    print(mode,"menu", file=sys.stderr,flush=True)
    measure = "document.querySelector('#world').getBoundingClientRect().toJSON()"
    original = page.evaluate(measure)
    if mode!="keyboard":
        if mode=="gamepad":
            page.evaluate("""window.seat={id:'standard-pad-fixture',index:0,connected:true,mapping:'standard',
                    axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))}""")
        else:
            page.evaluate("""t=>window.seat={id:1,connected:true,transport:t,x:0,y:0,buttons:{},session:'one',
                      controllerId:'test-pad',cancelSeq:0}""",mode)
        check(page,STATE+".controller.connected")
        assert page.evaluate(measure)==original
    capture("lobby")
    role = state()["gameplay"]["role"]
    press("RIGHT",f"{STATE}.gameplay.role !== {json.dumps(role)}")
    # Returning to Van Gogh also verifies selection in both directions.
    press("LEFT",f"{STATE}.gameplay.role === {json.dumps(role)}")
    press("Y",STATE+".gameplay.menu === 'settings'")
    press("B",STATE+".gameplay.menu === 'menu'")
    press("START",STATE+".stage === 'playing'")
    check(page,STATE+".gameplay.ready")
    assert state()["gameplay"]["actors"]==12
    print(mode,"deployed",file=sys.stderr,flush=True)
    recording=None
    if video:
        from recording import Recording
        recording=Recording(page,video)
    point=state()["gameplay"]["position"]
    press("UP",f"JSON.stringify({STATE}.gameplay.position) !== {json.dumps(json.dumps(point,separators=(',',':')))}")
    yaw=state()["gameplay"]["yaw"]
    press("RIGHT",f"Math.abs({STATE}.gameplay.yaw - ({yaw})) > .15")
    button("X",True)
    pitch=state()["gameplay"]["pitch"]
    press("UP",f"{STATE}.gameplay.pitch > {pitch}+.06")
    button("X",False)
    press("A",STATE+".gameplay.shots > 0")
    weapon=state()["gameplay"]["weapon"]
    press("Y",f"{STATE}.gameplay.weapon !== {json.dumps(weapon)}")
    if recording:recording.finish()
    capture("match")
    if mode=="keyboard":
        press("START",STATE+".paused")
    else:
        button("A",True)
        page.evaluate("seat.connected=false")
        check(page,STATE+".paused")
    frozen=state()["gameplay"]
    page.wait_for_timeout(350)
    assert state()["gameplay"]==frozen
    assert page.evaluate(measure)==original
    if mode!="keyboard":
        page.evaluate("seat.connected=true")
        check(page,STATE+".controller.connected")
        assert state()["paused"]
    press("START",STATE+".stage === 'playing'")
    assert state()["gameplay"]["shots"]==frozen["shots"]
    if mode!="keyboard":
        button("A",False)
        if mode!="gamepad":assert page.evaluate("lastReport.controller.pollCount > 0")
    assert not failures,failures
    report={"input":mode,"transport":{"keyboard":"keyboard","gamepad":"browser standard Gamepad API fixture"}.get(mode,"browser native bridge fixture"),
            "viewport":[width,height],"renderer":state()["webglVersion"],"canvas":original,
            "observed":frozen,"externalOrAssetErrors":failures}
    page.close()
    if evidence:
        (evidence/f"{width}-{mode}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False),flush=True)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--mode",choices=["keyboard","phone","wifi","gamepad","all"],default="all")
    parser.add_argument("--evidence",type=Path)
    parser.add_argument("--video",type=Path,help="Record the selected input route to a WebM file (requires ffmpeg).")
    args=parser.parse_args()
    if args.video and args.mode=="all":parser.error("--video needs a single --mode")
    with ThreadingHTTPServer(("127.0.0.1",0),partial(LocalAssets,directory=GAME/"dist")) as server,sync_playwright() as pw:
        Thread(target=server.serve_forever,daemon=True).start()
        url=f"http://127.0.0.1:{server.server_port}"
        browser=pw.chromium.launch(executable_path=shutil.which("chromium"), env={**os.environ,"LIBGL_ALWAYS_SOFTWARE":"1","DISPLAY":os.environ.get("DISPLAY",":0")},args=["--no-sandbox","--disable-dev-shm-usage",
           "--ignore-gpu-blocklist","--use-gl=angle","--use-angle=gl-egl"])
        try:
            for mode,width,height in [("keyboard",960,540),("wifi",1280,720),("phone",960,540),("gamepad",960,540)]:
                if args.mode in ("all",mode):run(browser,url,mode,width,height,args.evidence,args.video)
        finally: browser.close()
