"""Exercise the offline distribution with actual keyboard input plus a synthetic host controller."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import argparse
import json
from playwright.sync_api import sync_playwright

game = Path(__file__).resolve().parents[1]
out = game / "docs/browser"
out.mkdir(exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Quiet, directory=str(game / "dist")))
Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}"
results = {"keyboard": [], "hostFixture": {}, "errors": [], "externalRequests": []}
snapshot = "window.JoystickGameQA.snapshot()"

def wait(page, condition):
    try:
        page.wait_for_function(f"() => window.JoystickGameQA && ((s) => {condition})({snapshot})", timeout=30000)
    except Exception:
        print("Failed:", condition, page.evaluate(snapshot), results["errors"], flush=True)
        raise

def keyboard(page, code, ms=130):
    actions = {"Numpad5":"START","KeyP":"START","Numpad1":"A","ArrowRight":"RIGHT"}
    page.keyboard.down(code)
    action = actions.get(code)
    if action:
        wait(page,f"s.controller.buttons.{action}")
    page.wait_for_timeout(ms)
    page.keyboard.up(code)
    if action:
        wait(page,f"!s.controller.buttons.{action}")

def open_game(context):
    page = context.new_page()
    page.on("pageerror", lambda err: results["errors"].append(str(err)))
    def intercept(route):
        if urlsplit(route.request.url).netloc != urlsplit(base).netloc:
            results["externalRequests"].append(route.request.url)
            route.abort()
        else:
            route.continue_()
    page.route("**/*", intercept)
    page.goto(base+"/tv.html")
    wait(page, "s.ready && s.stage === 'menu' && s.frames > 2")
    return page

parser=argparse.ArgumentParser()
parser.add_argument("--only",choices=("classic","three","host"))
opts=parser.parse_args()
with sync_playwright() as pw:
    flags = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] if opts.only in (None,"three") else ["--disable-gpu"]
    browser = pw.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox",*flags])
    for width, height in ([(960, 540), (1280, 720)] if opts.only in (None,"classic") else []):
        context = browser.new_context(viewport={"width":width,"height":height})
        page = open_game(context)
        page.screenshot(path=out/f"menu-{width}.png")
        keyboard(page,"Numpad5")
        wait(page, "s.stage === 'playing' && s.gameplay.players === 4")
        x = page.evaluate(snapshot+".gameplay.x")
        page.keyboard.down("ArrowRight")
        wait(page,f"s.gameplay.x > {x}")
        page.keyboard.up("ArrowRight")
        keyboard(page,"Numpad1")
        wait(page,"s.gameplay.ownBombs > 0")
        page.screenshot(path=out/f"playing-{width}.png")
        observed = page.evaluate(snapshot+".gameplay")
        keyboard(page,"KeyP")
        wait(page,"s.stage === 'paused'")
        paused = page.evaluate(snapshot+".gameplay.tick")
        page.wait_for_timeout(250)
        assert page.evaluate(snapshot+".gameplay.tick") == paused
        keyboard(page,"KeyP")
        wait(page,f"s.stage === 'playing' && s.gameplay.tick > {paused}")
        results["keyboard"].append({"viewport":[width,height],"afterBomb":observed,"pausedTick":paused})
        if width == 960:
            keyboard(page,"Numpad5"); wait(page, "s.stage === 'paused'"); page.locator("#pauseQuit").click()
            page.locator("#local").click()
            keyboard(page,"Space");wait(page,"s.stage === 'localLobby'")
            keyboard(page,"Numpad5")
            wait(page,"s.stage === 'playing' && s.gameplay.humans === 2")
            start = page.evaluate(snapshot+".gameplay.positions")
            page.keyboard.down("ArrowRight"); wait(page,f"s.gameplay.positions[0].x != {start[0]['x']}"); page.keyboard.up("ArrowRight")
            page.keyboard.down("KeyA"); wait(page,f"s.gameplay.positions[1].x != {start[1]['x']}"); page.keyboard.up("KeyA")
            after = page.evaluate(snapshot+".gameplay.positions")
            assert after[0]["x"] != start[0]["x"] and after[1]["x"] != start[1]["x"], (start,after)
            results["localVersus"]={"before": start, "after": after}
        context.close()
    if opts.only in (None,'three'):
        context = browser.new_context(viewport={"width":1280,"height":720})
        page = open_game(context)
        page.locator('[data-gfx="3d"]').click()
        keyboard(page,"Numpad5")
        wait(page,"s.stage === 'playing' && s.renderer === 'webgl2' && s.gameplay.tick > 3")
        keyboard(page,"ArrowRight",300);keyboard(page,"Numpad1")
        wait(page,"s.gameplay.ownBombs > 0")
        page.screenshot(path=game/"thumb.png")
        results["three"] = page.evaluate(snapshot+".webglVersion")
        context.close()
    if opts.only in (None,'host'):
        context = browser.new_context(viewport={"width":960,"height":540})
        context.add_init_script("""window.padFixture={players:[]}; window.PureGameHost={
          snapshot:()=>JSON.stringify(window.padFixture),getInfo:()=>'{}',
          publish:value=>{window.lastHostFrame=JSON.parse(value)}};""")
        page = open_game(context)
        page.evaluate("""window.padFixture.players=[{id:1,session:1,transport:'wifi',connected:true,inputActive:true,controllerId:'fixture',cancelSeq:0,buttons:{}}]""")
        wait(page,"s.controller.connected")
        def press(key, condition):
            page.evaluate("(key)=>window.padFixture.players[0].buttons={[key]:true}",key)
            wait(page,condition)
            page.evaluate("window.padFixture.players[0].buttons={}")
            wait(page,f"!s.controller.buttons.{key}")
        press("START","s.stage === 'playing'")
        x=page.evaluate(snapshot+".gameplay.x")
        press("RIGHT",f"s.gameplay.x > {x}")
        press("A","s.gameplay.ownBombs > 0")
        page.evaluate("window.padFixture.players=[]")
        wait(page,"s.paused && !s.controller.connected")
        page.evaluate("""window.padFixture.players=[{id:1,session:2,transport:'wifi',connected:true,inputActive:true,controllerId:'fixture',cancelSeq:1,buttons:{}}]""")
        wait(page,"s.paused && s.controller.connected")
        press("START","s.stage === 'playing'")
        results["hostFixture"]=page.evaluate(snapshot+".gameplay")
        wait(page,"!!window.lastHostFrame && window.lastHostFrame.game==='kaboom-arena'")
        context.close()
    results["browser"]=browser.version
    browser.close()
server.shutdown()
assert not results["errors"] and not results["externalRequests"], results
(out/(f"{opts.only}-results.json" if opts.only else "results.json")).write_text(json.dumps(results,indent=2)+"\n")
print(f"{opts.only or 'All'} browser checks passed.")
