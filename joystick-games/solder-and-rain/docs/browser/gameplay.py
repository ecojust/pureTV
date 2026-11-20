"""Replay the solder-and-rain gameplay browser acceptance against the local dist directory."""

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
    result = page.evaluate("""
async () => {
    const events = [];
    const point = (key) => {
        const s = snap();
        events.push({
            key,
            frames: s.frames,
            gameplay: s.gameplay
        });
        console.log('FOCUS ' + key + ' ' + JSON.stringify(s.gameplay))
    };
    await until('title focus', () => document.activeElement?.dataset.act === 'new');
    await press('DOWN');
    if (document.activeElement.dataset.act !== 'free') throw Error('free button not selected');
    await press('A');
    await until('free bench', () => snap().gameplay.screen === 'freebench');
    const kind = document.querySelector('#fb-kind');
    for (let n = 0; n < kind.options.length && kind.value !== 'noodlebot'; n++) await press('RIGHT');
    if (kind.value !== 'noodlebot') throw Error('noodle-bot unavailable');
    await press('DOWN');
    const tier = document.querySelector('#fb-tier');
    for (let n = 0; n < tier.options.length && tier.value !== '1'; n++) await press('LEFT');
    if (tier.value !== '1') throw Error('tier one unavailable');
    await press('DOWN');
    const seed = document.querySelector('#fb-seed');
    const beforeSeed = +seed.value;
    await press('RIGHT');
    if (+seed.value !== beforeSeed + 1) throw Error('seed input');
    while (document.activeElement.id !== 'fb-go') await press('DOWN');
    await press('A');
    await until('workbench', () => snap().gameplay.phase === 'bench');
    const driver = document.querySelector('.tool[data-tool=driver]');
    const bit = () => driver.querySelector('.bit').textContent;
    async function moveTo(key, target, negative, positive) {
        let before = snap().gameplay[key],
            button = target > before ? positive : negative;
        fixture.buttons = {
            [button]: true
        };
        await until('cursor reach ' + key, () => button === positive ? snap().gameplay[key] >= target - 5 : snap().gameplay[key] <= target + 5);
        fixture.buttons = {};
        await until('release cursor', () => !snap().controller.buttons[button]);
    }
    const r = driver.getBoundingClientRect();
    await moveTo('cursorX', r.x + r.width / 2, 'LEFT', 'RIGHT');
    await moveTo('cursorY', r.y + r.height / 2, 'UP', 'DOWN');
    if (!document.elementFromPoint(snap().gameplay.cursorX, snap().gameplay.cursorY)?.closest('.tool[data-tool=driver]')) throw Error('cursor missed toolbar');
    await press('A');
    if (snap().gameplay.tool !== 'driver') throw Error('driver selection');
    const before = bit();
    await press('A');
    await until('cycled original driver bit', () => bit() !== before);
    point('tool bit changed through genuine toolbar');
    await press('Y');
    await until('guide cursor hit', () => snap().gameplay.ref?.startsWith('hole:'));
    const turns = snap().gameplay.turns;
    fixture.buttons = {
        A: true
    };
    await until('unfasten actual screw', () => snap().gameplay.turns > turns && snap().gameplay.screws >= 1);
    fixture.buttons = {};
    await until('released handle', () => !snap().controller.buttons.A);
    point('removed screw into the original parts dish');
    await press('X');
    await until('test', () => snap().gameplay.tests > 0);
    point('original electrical test');
    if (snap().errors.length) throw Error('game errors');
    return {
        events,
        beforeSeed,
        seed: +seed.value,
        beforeBit: before,
        afterBit: bit(),
        last: snap()
    };
}
""")
    page.screenshot(path=out / "workbench.png")
    (out / "report.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print("PASS WORKBENCH", flush=True)
    b.close()
