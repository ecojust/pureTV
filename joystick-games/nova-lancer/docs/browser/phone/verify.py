"""Drive the shipped Nova Lancer phone controller against the production Java LAN room."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[5]
KIT = Path("resource/game-kit")
FIXTURE = KIT / "qa/controller-browser-2026-11-20"
JAVA_SOURCES = (
    KIT / "android/src/main/java/com/ecojust/gamekit/LanGameServer.java",
    FIXTURE / "ActualPhoneRoom.java",
    FIXTURE / "Qr.java",
)
ASSETS = (
    "controller.html", "controller.js", "controller.css", "game-config.json",
    "nova-lancer.js", "tv.html", "assets-index.json", "THIRD-PARTY-NOTICES.txt",
)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prepare(args, work):
    classes = work / "classes"
    classes.mkdir()
    jars = os.pathsep.join(map(str, [args.json_jar.resolve(), args.zxing_jar.resolve()]))
    sources = []
    hashes = {}
    for source in JAVA_SOURCES:
        local = ROOT / source
        data = local.read_bytes() if local.is_file() else subprocess.check_output(
            ["git", "show", "HEAD:" + source.as_posix()], cwd=ROOT)
        target = work / source.name
        target.write_bytes(data)
        hashes[source.name] = sha(data)
        sources.append(str(target))
    subprocess.run(["javac", "-encoding", "UTF-8", "-cp", jars, "-d", str(classes), *sources], check=True)
    (work / "assets").mkdir()
    (work / "empty-overlay").mkdir()
    with ZipFile(args.apk) as apk:
        assets = {name: apk.read("assets/" + name) for name in ASSETS}
    config = json.loads(assets["game-config.json"])
    if config["id"] != "nova-lancer" or config["phoneControllerButtons"] != 9:
        raise ValueError("Expected the Nova Lancer nine-button APK")
    for name, payload in assets.items():
        (work / "assets" / name).write_bytes(payload)
    record = {
        "game": config["id"], "apkSha256": sha(args.apk.read_bytes()),
        "inputs": {name: sha(payload) for name, payload in assets.items()},
        "testSources": hashes, "actions": [], "errors": [], "passed": False,
        "method": "Desktop JVM production LAN server, separate Chromium game and phone contexts, touchscreen input",
        "physicalPhoneTested": False, "physicalTVTested": False,
    }
    return ["java", "-XX:ActiveProcessorCount=2", "-Djava.awt.headless=true",
            "-cp", str(classes) + os.pathsep + jars], record


def test(browser, room_url, tv_url, java, output, record):
    def check(name, value):
        record["actions"].append({"check": name, "value": value})
        print(name, flush=True)

    tv = browser.new_page(viewport={"width": 960, "height": 540}, locale="zh-CN")
    tv.on("pageerror", lambda error: record["errors"].append(str(error)))
    qr = subprocess.check_output([*java, "Qr", room_url], text=True)
    info = {"url": room_url, "qr": qr, "language": "zh", "addresses": ["127.0.0.1"],
            "wifiController": {"state": "available", "port": 63485, "inputActive": True}}
    # Same read/publish bridge used by the repository's phone-room.cjs fixture.
    tv.add_init_script("window.PureGameHost={getInfo:()=>JSON.stringify(" + json.dumps(info) + """),
        snapshot() {
            const req = new XMLHttpRequest();
            req.open('GET','/__snapshot',false);
            req.send();
            return req.responseText;
        },
        publish(value) {fetch('/__publish',{method:'POST',body:value})},setLanguage(){},exit(){}};""")
    tv.goto(tv_url, wait_until="domcontentloaded", timeout=120000)

    def wait(condition):
        tv.wait_for_function("() => { const s = window.JoystickGameQA?.snapshot(); return s && (" +
                             condition + "); }", polling=150, timeout=120000)

    def state():
        return tv.evaluate("""() => {
          const {stage,gameplay:g,controller:c}=JoystickGameQA.snapshot();
          return {stage,shots:g.shots,x:g.x,distance:g.distance,transport:c.transport,
            connected:c.connected,seat:c.players.filter(p=>p.connected).map(p=>p.id)};
        }""")

    def ui():
        return tv.evaluate("""() => {
          const box = selector => {
            const e = document.querySelector(selector);
            if (!e || !e.checkVisibility()) return null;
            const {x,y,width,height} = e.getBoundingClientRect();
            return {x,y,width,height};
          };
          return {canvas:box('#gl'), qr:box('.ptv-phone img'), badge:box('.ptv-status'),
            score:box('.hud-tr'), status:document.querySelector('#puretv-controller-panel').innerText};
        }""")

    wait("s.ready && s.stage==='menu'")
    qr_image = tv.locator(".ptv-phone img")
    qr_image.wait_for(state="visible")
    png = qr_image.screenshot(path=output / "qr.png")
    decoded = subprocess.check_output([*java, "Qr"], input=base64.b64encode(png)).decode()
    assert decoded == room_url
    before = ui()
    check("Visible menu QR decodes to this Java room", before)
    tv.screenshot(path=output / "tv-menu.jpg", quality=82)
    phone = browser.new_context(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True, locale="en-US")
    pad = phone.new_page()
    pad.on("pageerror", lambda error: record["errors"].append(str(error)))
    pad.goto(decoded, wait_until="domcontentloaded")
    connected = "()=>document.querySelector('#status').textContent.includes('Connected')"
    pad.wait_for_function(connected)
    wait("s.controller.transport==='phone' && s.controller.connected")
    joined = ui()
    assert state()["seat"] == [1] and joined["canvas"] == before["canvas"] and joined["qr"] is None
    check("Phone joins seat 1 and the fixed-size TV canvas stays in place", joined)
    pad.screenshot(path=output / "phone-pad.jpg", quality=82)
    touch = phone.new_cdp_session(pad)

    def point(selector):
        box = pad.locator(selector).bounding_box()
        return {"x": box["x"] + box["width"]/2, "y": box["y"] + box["height"]/2}

    def contact(kind, points):
        touch.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

    def tap(selector, milliseconds):
        contact("touchStart", [point(selector)])
        pad.wait_for_timeout(milliseconds)
        contact("touchEnd", [])

    tap("#start", 1000)
    wait("s.stage==='playing' && s.gameplay.controllable")
    check("Phone START launches Quick Sortie", state())
    playing = ui()
    assert playing["canvas"] == before["canvas"] and playing["qr"] is None
    assert "1P 手机手柄已连接" in playing["status"]
    assert playing["badge"]["y"] >= playing["score"]["y"] + playing["score"]["height"]
    check("Connected badge fits below the score HUD", playing)
    shots = state()["shots"]
    tap("#a", 800)
    wait(f"s.gameplay.shots>{shots}")
    check("Touch A fires", state())
    x = state()["x"]
    stick = point("#stick-zone")
    contact("touchStart", [stick])
    contact("touchMove", [{"x": stick["x"]+75, "y": stick["y"]}])
    wait(f"s.gameplay.x>{x + .1}")
    check("Touch stick steers right", state())
    contact("touchEnd", [])
    tv.screenshot(path=output / "tv-playing.jpg", quality=82)
    pad.goto("about:blank")
    wait("!s.controller.connected && s.stage==='paused'")
    disconnected = ui()
    assert disconnected["canvas"] == before["canvas"] and disconnected["qr"]
    check("Leaving the phone page pauses the flight and displays its QR again", disconnected)
    pad.go_back(wait_until="domcontentloaded")
    pad.wait_for_function(connected)
    wait("s.controller.connected && s.stage==='paused'")
    check("Browser back reconnects to the paused flight", state())
    touch.detach()
    touch = phone.new_cdp_session(pad)
    # Read the game once per rendered frame without writing inputs, state or time.
    tv.evaluate("""() => {
      const rows = window.__novaPhoneStartTrace = [];
      function observe() {
        const s = JoystickGameQA.snapshot();
        const row = {stage:s.stage, start:s.controller.buttons.START};
        if (JSON.stringify(rows.at(-1))!==JSON.stringify(row)) rows.push(row);
        if (rows.length < 16) requestAnimationFrame(observe);
      }
      observe();
    }""")
    distance = state()["distance"]
    tap("#start", 800)
    wait(f"s.stage==='playing' && !s.controller.buttons.START && s.gameplay.distance>{distance+1}")
    trace = tv.evaluate("window.__novaPhoneStartTrace")
    held = [row for row in trace if row["start"]]
    assert held and all(row["stage"] == "playing" for row in held)
    check("One held START resumes once and the spacecraft advances", {"frames": trace, "state": state()})
    tap("#start", 400)
    wait("s.stage==='paused' && !s.controller.buttons.START")
    paused = state()
    pad.wait_for_timeout(500)
    assert state()["distance"] == paused["distance"]
    check("A new START contact pauses again", paused)
    assert not record["errors"], record["errors"]
    record["passed"] = True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk", type=Path, required=True)
    parser.add_argument("--json-jar", type=Path, required=True)
    parser.add_argument("--zxing-jar", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--chromium", default=shutil.which("chromium"))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        work = Path(temp)
        java, record = prepare(args, work)
        server = subprocess.Popen([*java, "ActualPhoneRoom", "com.ecojust.gamekit",
                                   str(work / "assets"), str(work / "empty-overlay")],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        try:
            room_url, tv_url = server.stdout.readline().split()
            with sync_playwright() as pw:
                browser = pw.chromium.launch(executable_path=args.chromium,
                    args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                          "--disable-background-timer-throttling", "--disable-renderer-backgrounding"])
                test(browser, room_url, tv_url, java, args.output, record)
                browser.close()
        finally:
            server.communicate(input="\n", timeout=15)
            (args.output / "phone.json").write_text(json.dumps(record, indent=2, ensure_ascii=False)+"\n",
                                                    encoding="utf-8")


if __name__ == "__main__":
    main()
