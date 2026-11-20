"""Run with Python Playwright and Chromium. The URL must serve dist/tv.html."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('url')
parser.add_argument('output', type=Path)
parser.add_argument('--chromium',default='/usr/bin/chromium')
args=parser.parse_args()
args.output.mkdir(exist_ok=True,parents=True)
result=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=args.chromium, args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for width,height in [(960,540),(1280,720),(720,480)]:
        page=browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
        errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(args.url)
        snap='window.JoystickGameQA.snapshot()'
        def wait(condition): page.wait_for_function(snap+condition,timeout=45000)
        def press(key): page.keyboard.press(key,delay=100)
        wait('.ready');wait('.frames>2')
        canvas=page.locator('canvas')
        bounds=canvas.bounding_box(); page.screenshot(path=args.output/f'{width}-title.png')
        press('z');wait(".stage==='playing'")
        press('ArrowRight');wait('.gameplay.steps>0')
        press('v');wait(".gameplay.overlay==='book'"); press('x');wait(".stage==='playing'")
        press('p');wait(".paused");press('p');wait(".stage==='playing'")
        # Navigate the two eastward entrance tiles and encounter the first stone beast.
        point=page.evaluate(snap)['gameplay']['position']
        for _ in range(3-point[0]): press('ArrowRight')
        for _ in range(2): press('ArrowUp')
        wait(".gameplay.mode==='duel'")
        remote=page.evaluate(snap)['gameplay']['duelHealth']; press('z')
        page.wait_for_function(f"{snap}.gameplay.duelHealth<{remote}")
        page.screenshot(path=args.output/f'{width}-duel.png')
        # Native host fixture; only the shared bridge reads the frame, exactly once.
        page.evaluate("""() => {
          window.fixture={players:[{connected:true,id:1,controllerId:'qa-tower',transport:'wifi',session:3,buttons:{}}]};
          window.PureGameHost={snapshot:()=>JSON.stringify(fixture),getInfo:()=>JSON.stringify({wifiController:{port:63485}})};
        }""")
        wait('.controller.connected'); assert canvas.bounding_box()==bounds
        page.evaluate('fixture.players=[]');wait('.paused');assert canvas.bounding_box()==bounds
        page.evaluate("fixture.players=[{connected:true,id:1,x:0,y:0,transport:'phone'}]")
        wait(".controller.transport==='phone'")
        assert page.evaluate(snap)['paused']
        page.evaluate('fixture.players[0].start=true');wait(".stage==='playing'")
        page.evaluate('fixture.players[0].start=false')
        assert canvas.bounding_box()==bounds
        assert not errors, errors
        result.append({'viewport':[width,height],'keyboard':'move, bestiary, pause, saber hit',
                       'bridgeFixture':'wifi join, disconnect pause, phone join, explicit START',
                       'canvasBounds':bounds,'pageErrors':errors})
        page.close()
    browser.close()
print(json.dumps(result,ensure_ascii=False,indent=2))
