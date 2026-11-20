"""Replay the solder-and-rain focus-and-audio browser acceptance against the local dist directory."""

from pathlib import Path
import os, sys, threading, functools, http.server, json, time
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
slug = root.name
out = Path(os.environ.get("PURETV_QA_OUTPUT", "/tmp/puretv-browser-" + slug))
out.mkdir(exist_ok=True, parents=True)
httpd = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root / "dist")),
)
base = "http://127.0.0.1:" + str(httpd.server_port)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
with sync_playwright() as p:
    args = [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--disable-accelerated-2d-canvas",
        "--autoplay-policy=no-user-gesture-required",
        "--disable-dev-shm-usage",
    ]
    if slug == "atlas-of-ink":
        args += ["--disable-gpu"]
    b = p.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_BIN", "/usr/bin/chromium"), args=args
    )
    page = b.new_page(viewport={"width": 860, "height": 484})
    page.set_default_timeout(240000)
    page.on("pageerror", lambda e: print("ERROR", e, flush=True))
    page.on("console", lambda a: print(a.text, flush=True) if "FOCUS" in a.text else None)
    page.add_init_script("""
window.fixture = {
    id: 1,
    controllerId: 'PUZZLE-QA',
    session: 'one',
    connected: true,
    transport: 'wifi',
    inputActive: true,
    cancelSeq: 0,
    buttons: {}
};
window.reads = 0;
window.PureGameHost = {
    snapshot() {
        reads++;
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
};
""")
    start = time.monotonic()
    page.goto(base + "/tv.html", wait_until="commit")
    page.wait_for_function("window.JoystickGameQA?.snapshot().frames >= 1")
    print("start", time.monotonic() - start, flush=True)
    api = """
async () => {
    window.snap = () => JoystickGameQA.snapshot();
    window.until = async (why, fn) => {
        let until = performance.now() + 180000;
        while (!fn()) {
            if (performance.now() > until) throw Error(why + ' ' + JSON.stringify(snap()));
            await new Promise(r => setTimeout(r, 25))
        }
    };
    window.press = async (key, duration = 130) => {
        fixture.buttons = {
            [key]: true
        };
        await until('down ' + key, () => snap().controller.buttons[key]);
        await new Promise(r => setTimeout(r, duration));
        fixture.buttons = {};
        await until('up ' + key, () => !snap().controller.buttons[key]);
    };
}
"""
    page.evaluate(api)
    result = page.evaluate(
        """
async slug => {
    const record = [];
    const point = (name) => {
        const s = snap();
        record.push({
            name,
            audio: s.audioState,
            stage: s.stage,
            frames: s.frames,
            gameplay: s.gameplay
        });
        console.log('FOCUS ' + name + ' ' + s.audioState + ' ' + s.stage)
    };
    await press('START');
    if (slug === 'atlas-of-ink') {
        await press('A');
        await press('RIGHT', 300);
        await press('A', 410)
    } else {
        await press('X')
    }
    await until('initial audio', () => snap().audioState === 'running');
    point('initial gameplay');
    await press('START');
    await until('pause', () => snap().stage === 'paused' && snap().audioState === 'suspended');
    point('pause');
    await press('START');
    await until('resumed', () => snap().stage === 'playing' && snap().audioState === 'running');
    point('manual resume');
    fixture.connected = false;
    await until('disconnected', () => !snap().controller.connected && snap().stage === 'paused' && snap().audioState === 'suspended');
    point('disconnected');
    const freeze = snap().gameplay.tick;
    fixture.session = 'two';
    fixture.connected = true;
    await until('reconnected neutral', () => snap().controller.players.some(v => v.session === 'two') && !Object.values(snap().controller.buttons).some(Boolean));
    await press('A');
    if (snap().gameplay.tick !== freeze || snap().audioState !== 'suspended') throw Error('unsolicited resume');
    point('reconnected A ignored');
    await press('START');
    await until('reconnected resume', () => snap().stage === 'playing' && snap().audioState === 'running');
    point('reconnected resume');
    const n = snap().frames;
    PureGame.focus(false);
    await until('focus neutral', () => snap().frames > n + 1 && snap().audioState === 'suspended' && snap().stage === 'paused');
    PureGame.focus(true);
    point('regained focus stays silent');
    await press('START');
    await until('explicit focus resume', () => snap().stage === 'playing' && snap().audioState === 'running');
    point('focus resume');
    if (snap().errors.length || reads !== snap().frames) throw Error('invalid observations');
    return {
        observations: record,
        reads,
        storage: Object.keys(localStorage),
        errors: snap().errors
    };
}
""",
        slug,
    )
    page.reload(wait_until="commit")
    page.wait_for_function("window.JoystickGameQA?.snapshot().frames>=1")
    page.evaluate(api)
    assert page.locator("#btn-continue").is_visible()
    page.evaluate(
        "async()=>{await press('START');await until('restore',()=>snap().stage==='playing')}"
    )
    result["restored"] = page.evaluate("snap()")
    result["source"] = (
        "Local Chromium, offline dist and browser Wi-Fi bridge fixture, no native hardware"
    )
    (out / "focus-and-audio.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print("PASS", slug, flush=True)
    b.close()
