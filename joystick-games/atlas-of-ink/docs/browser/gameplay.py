"""Replay the atlas-of-ink gameplay browser acceptance against the local dist directory."""

import json, sys, time, os, threading, functools, http.server
from pathlib import Path
from playwright.sync_api import sync_playwright

d = Path(__file__).resolve().parents[2]
slug = d.name
width = int(os.environ.get("TV_W", "960"))
h = int(width * 9 / 16)
httpd = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(d / "dist")),
)
base = "http://127.0.0.1:" + str(httpd.server_port)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_BIN", "/usr/bin/chromium"),
        args=[
            "--no-sandbox",
            "--enable-unsafe-swiftshader",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-dev-shm-usage",
        ]
        + (["--disable-gpu", "--disable-accelerated-2d-canvas"] if slug == "atlas-of-ink" else []),
    )
    page = b.new_page(viewport={"width": width, "height": h})
    page.set_default_timeout(210000)
    errors = []
    network = []
    page.on("pageerror", lambda e: (errors.append(str(e)), print("PAGE ERROR", str(e), flush=True)))
    page.on(
        "request",
        lambda r: (
            network.append(r.url)
            if r.url.startswith(("https:", "http:")) and (not r.url.startswith(base + "/"))
            else None
        ),
    )
    page.add_init_script("""
window.fixture = {
    id: 1,
    controllerId: 'TV-PUZZLE-QA',
    session: 'live-1',
    connected: true,
    transport: 'wifi',
    inputActive: true,
    cancelSeq: 0,
    buttons: {}
};
window.nativeReads = 0;
window.PureGameHost = {
    snapshot() {
        ++nativeReads;
        return JSON.stringify({
            inputActive: true,
            players: [fixture]
        })
    },
    getInfo() {
        return JSON.stringify({
            wifiController: {
                state: 'ready',
                port: 63485
            }
        })
    }
}
""")
    start = time.monotonic()
    page.goto(base + "/tv.html", wait_until="commit")
    page.wait_for_function("window.JoystickGameQA?.snapshot().frames>2")
    snap = lambda: page.evaluate("JoystickGameQA.snapshot()")
    print("Ready", round(time.monotonic() - start, 2), snap()["frames"], flush=True)

    def at(s, path):
        for part in path.split("."):
            s = s[part]
        return s

    def press(keys, ms=210):
        page.evaluate("(ks)=>fixture.buttons=Object.fromEntries(ks.map(k=>[k,true]))", keys)
        page.wait_for_function(
            "ks=>ks.every(k=>JoystickGameQA.snapshot().controller.buttons[k])", arg=keys
        )
        page.wait_for_timeout(ms)
        page.evaluate("fixture.buttons={}")
        page.wait_for_function(
            "Object.values(JoystickGameQA.snapshot().controller.buttons).every(v=>!v)"
        )

    stage = snap()
    assert stage["stage"] == "menu"
    out = Path(os.environ.get("PURETV_QA_OUTPUT", "/tmp/puretv-browser-" + slug))
    out.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=out / "menu.png")
    results = []
    for st in json.loads((d / "qa-plan.json").read_text())["steps"]:
        before = snap()
        press(st["keys"], st["holdMs"])

        def ok(s):
            return all(
                (
                    (
                        at(s, e["path"]) == e["value"]
                        if e["op"] == "eq"
                        else (
                            at(s, e["path"]) > at(before, e["path"])
                            if e["op"] == "increased"
                            else at(s, e["path"]) != at(before, e["path"])
                        )
                    )
                    for e in st["expect"]
                )
            )

        end = time.monotonic() + 55
        while not ok((after := snap())) and time.monotonic() < end:
            page.wait_for_timeout(200)
        print(st["name"], {e["path"]: at(after, e["path"]) for e in st["expect"]}, flush=True)
        if not ok(after):
            print("ERROR", before, after, errors, flush=True)
            raise Exception(st["name"])
        results.append([st["name"], after["gameplay"]])
    assert after["stage"] == "playing"
    page.screenshot(path=out / "playing.png")
    if slug == "atlas-of-ink":
        press(["X"])
        press(["DOWN"])
        press(["A"])
        assert snap()["gameplay"]["screen"] == "result"
        press(["A"])
        assert snap()["gameplay"]["commission"] == 1
        press(["A"])
        press(["DOWN"], 360)
        press(["A"], 420)
    page.evaluate("fixture.connected=false")
    page.wait_for_function('JoystickGameQA.snapshot().stage==="paused"')
    stable = snap()
    page.wait_for_timeout(390)
    paused = snap()
    for pth in json.loads((d / "qa-plan.json").read_text())["pauseStablePaths"]:
        assert at(stable, pth) == at(paused, pth), pth
    page.evaluate("fixture.connected=true;fixture.session='live-2'")
    page.wait_for_function(
        'JoystickGameQA.snapshot().controller.players.some(p=>p.connected && p.session==="live-2")'
    )
    assert snap()["stage"] == "paused"
    press(["A"])
    assert snap()["stage"] == "paused"
    press(["START"])
    assert snap()["stage"] == "playing"
    before = snap()
    activekeys = ["UP", "DOWN", "LEFT", "RIGHT", "A", "B", "X", "Y", "START"]
    press(activekeys)
    n = snap()["frames"]
    page.evaluate("PureGame.focus(false)")
    assert snap()["stage"] == "paused"
    page.wait_for_function(
        "n=>JoystickGameQA.snapshot().frames>n && Object.values(JoystickGameQA.snapshot().controller.buttons).every(v=>!v)",
        arg=n,
    )
    press(["START"])
    assert page.evaluate("Object.keys(localStorage)").count(slug + ".v1") == 1
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("window.JoystickGameQA?.snapshot().frames>2")
    assert page.locator("#btn-continue").is_visible()
    press(["START"])
    assert snap()["stage"] == "playing"
    calls = page.evaluate(
        "({reads:nativeReads,frames:JoystickGameQA.snapshot().frames,errors:JoystickGameQA.snapshot().errors})"
    )
    assert (
        calls["reads"] == calls["frames"]
        and (not errors)
        and (not calls["errors"])
        and (not network)
    ), (errors, network, calls)
    print("OK", slug, calls, flush=True)
    (out / "report.json").write_text(
        json.dumps(
            {
                "slug": slug,
                "viewport": width,
                "steps": results,
                "last": snap(),
                "offlineRequests": network,
                "errors": errors,
                "calls": calls,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    b.close()
