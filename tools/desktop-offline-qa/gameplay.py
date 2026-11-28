"""Cold-start installed game URLs with Chromium isolated from the internet.

python tools/desktop-offline-qa/gameplay.py --base http://127.0.0.1:PORT/games/TOKEN/ \
    --browser /usr/bin/chromium --report /tmp/gameplay.json
"""
import argparse
from collections import Counter
import hashlib
import io
import json
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads((ROOT / "tools/pc-games/catalog.json").read_text(encoding="utf-8"))
READ_STATE = """() => {
    const s = window.JoystickGameQA?.snapshot?.() || window.PureTVQA?.snapshot?.();
    if (!s) return null;
    const r = s.renderer;
    const renderer = typeof r === 'object' && r ? {
        backend: r.backend, renderer: r.renderer, webglVersion: r.webglVersion, drawCalls: r.drawCalls
    } : r;
    return {phase: s.stage || s.phase, renderer, game: s.game, frames: s.frames, inputPolls: s.controller?.pollCount,
      canvas: [...document.querySelectorAll('canvas')].filter(c => {
        const r = c.getBoundingClientRect();
        return c.width > 8 && c.height > 8 && r.width > 8 && r.height > 8;
      }).map(c => [c.width, c.height])};
}"""


def wait_for_game(page):
    return page.wait_for_function("""() => {
      const s = window.JoystickGameQA?.snapshot?.() || window.PureTVQA?.snapshot?.();
      const phase = s?.stage || s?.phase;
      return s?.ready !== false && phase && !['loading', 'boot', 'error'].includes(phase) && !s.webglError;
    }""", polling=200)


def tetris(page):
    page.keyboard.down("p")
    try:
        page.wait_for_function("() => window.PureTVQA.snapshot().phase === 'playing'", polling=100)
    finally:
        page.keyboard.up("p")
    position = "() => window.PureTVQA.snapshot().players[0].piece.x"
    before = page.evaluate(position)
    page.keyboard.down("ArrowRight")
    try:
        after = page.wait_for_function("x => window.PureTVQA.snapshot().players[0].piece.x > x && window.PureTVQA.snapshot().players[0].piece.x", arg=before).json_value()
    finally:
        page.keyboard.up("ArrowRight")
    return {"phase": "playing", "pieceXBefore": before, "pieceXAfter": after}


def backroad(page):
    # Open the original garage, stage selector and race with actual menu controls.
    for label in ["快速赛段", "选择赛段", "开始"]:
        page.get_by_text(label, exact=True).first.click()
    page.wait_for_function("() => window.JoystickGameQA?.snapshot?.().gameplay?.phase === 'running'", polling=250)
    model = "() => window.JoystickGameQA.snapshot().gameplay"
    before = page.evaluate(model)["speed"]
    page.keyboard.down("ArrowUp")
    try:
        page.wait_for_function("min => window.JoystickGameQA.snapshot().gameplay.speed > min", arg=max(2, before + 1))
        after = page.evaluate(model)["speed"]
    finally:
        page.keyboard.up("ArrowUp")
    return {"phase": "running", "speedBefore": before, "speedAfter": after}


def openaero(page):
    page.locator('[data-assist="pilot"]').click()
    page.locator('[data-time="2"]').click()
    page.locator("#btnStartFlight").click()
    page.wait_for_function("() => window.JoystickGameQA.snapshot().stage === 'playing'", polling=250)
    before = page.evaluate("window.openaeroDebug().bankRightDeg")
    page.keyboard.down("KeyD")
    try:
        page.wait_for_function("""() => window.JoystickGameQA.snapshot().gameplay.rollInput > 0.5
            && window.openaeroDebug().bankRightDeg > 5""")
        after = page.evaluate("window.openaeroDebug().bankRightDeg")
    finally:
        page.keyboard.up("KeyD")
    return {"phase": "playing", "bankDegreesBefore": before, "bankDegreesAfter": after}


def zof_duty(page):
    page.locator("#primary").click()
    page.wait_for_function("() => window.JoystickGameQA.snapshot().stage === 'playing'")
    before = page.evaluate("window.JoystickGameQA.snapshot().gameplay.score")
    page.keyboard.press("Space", delay=120)
    page.wait_for_function("() => window.JoystickGameQA.snapshot().gameplay.hits === 1")
    after = page.evaluate("window.JoystickGameQA.snapshot().gameplay.score")
    assert after == before + 100
    return {"phase": "playing", "scoreBefore": before, "scoreAfter": after}


ACTIONS = {"zof-duty": zof_duty, "tetris": tetris, "backroad-rally": backroad, "openaero-dfw": openaero}


def probe(browser, base, entry):
    slug = entry["id"]
    origin = urlsplit(base).netloc
    local, failed, extensions, wasm = set(), set(), Counter(), set()
    attempted, exceptions = set(), []
    result = {"id": slug, "apkSha256": entry["sha256"]}
    with browser.new_context(viewport={"width": 800, "height": 450}, device_scale_factor=0.75, locale="zh-CN", service_workers="block") as ctx:
        def restrict(route):
            url = urlsplit(route.request.url)
            if url.scheme == "http" and url.netloc == origin:
                route.continue_()
            elif url.scheme in ("data", "blob"):
                route.continue_()
            else:
                attempted.add(url.hostname or url.scheme)
                route.abort("internetdisconnected")

        def response(res):
            url = urlsplit(res.url)
            if url.netloc != origin:
                return
            path = url.path.removeprefix(urlsplit(base).path)
            if res.status >= 400:
                failed.add(f"{res.status} {path}")
            elif 200 <= res.status < 300:
                if path not in local:
                    ext = Path(path).suffix
                    extensions[ext] += 1
                    if ext == ".wasm":
                        wasm.add(path)
                local.add(path)

        ctx.route("**/*", restrict)
        page = ctx.new_page()
        page.set_default_timeout(150000 if slug in {"backroad-rally", "openaero-dfw"} else 45000)
        page.on("pageerror", lambda err: exceptions.append(str(err).replace(base, "")[:220]))
        ctx.on("response", response)
        stage = "navigation"
        try:
            url = f"{base}{slug}/tv.html?lang=zh"
            document = page.goto(url, wait_until="commit")
            assert document and document.ok, "Local HTML failed to load"
            source = page.evaluate("""async () => {
                const response = await fetch('puretv-licenses/source.json');
                if (!response.ok) throw Error('Missing installed game provenance');
                return response.json();
            }""")
            assert source["game"] == slug and source["apk_sha256"] == entry["sha256"], "Unexpected installed game revision"
            stage = "game state"
            wait_for_game(page)
            result["initialPhase"] = page.evaluate(READ_STATE)["phase"]
            if slug in ACTIONS:
                stage = "game interaction"
                result["action"] = ACTIONS[slug](page)
            stage = "canvas"
            page.wait_for_function("() => [...document.querySelectorAll('canvas')].some(c => c.width > 8 && c.height > 8 && c.getBoundingClientRect().width > 8)", polling=250)
            result["state"] = page.evaluate(READ_STATE)
            stage = "frame capture"
            pixels = page.screenshot(timeout=45000)
            with Image.open(io.BytesIO(pixels)) as image:
                sample = image.convert("RGB").resize((80, 45))
                colors = len(sample.getcolors(maxcolors=80 * 45))
            assert colors >= 24, f"Frame has only {colors} colors in an 80×45 sample"
            result.update(frameSha256=hashlib.sha256(pixels).hexdigest(), sampledColors=colors)
            assert any(path.startswith(slug + "/") for path in local), "No game-specific local response"
            assert {"web-host.js", "pc-bridge.js"} <= local, "Desktop input/host assets missing"
            if slug == "openaero-dfw":
                assert any("jsbsim_wasm" in path for path in wasm), "The original flight-model WASM was not loaded"
            assert not failed, "Local resources failed"
            assert not exceptions, "Game JavaScript threw an exception"
            result["passed"] = True
        except Exception as err:
            result.update(passed=False, failedStage=stage, error=str(err).replace(base, "")[:550])
        result.update(localResources=len(local), localTypes=dict(sorted(extensions.items())))
        if wasm:
            result["loadedWasm"] = sorted(wasm)
        if attempted:
            result["blockedHosts"] = sorted(attempted)
        if failed:
            result["failedLocal"] = sorted(failed)
        if exceptions:
            result["exceptions"] = exceptions[:8]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, help="Live local_game_base URL")
    parser.add_argument("--browser", help="Installed Chromium executable")
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--game", action="append", choices=[g["id"] for g in CATALOG], help="Run a subset")
    args = parser.parse_args()
    base = args.base.rstrip("/") + "/"
    parsed = urlsplit(base)
    if parsed.scheme != "http" or parsed.hostname not in ("127.0.0.1", "localhost", "::1"):
        parser.error("Expected a loopback HTTP base")
    with sync_playwright() as pw:
        # Also prevent workers/speculative requests from reaching the network outside of Playwright routes.
        browser = pw.chromium.launch(executable_path=args.browser, args=[
            "--proxy-server=http://127.0.0.1:9", "--disable-quic", "--disable-background-networking",
            "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        ])
        report = {"browser": browser.version, "scope": "New browser context per signed game, blocked service workers, loopback HTTP only", "games": []}
        try:
            for game in CATALOG:
                if args.game and game["id"] not in args.game:
                    continue
                print(f"Loading {game['id']}…", flush=True)
                row = probe(browser, base, game)
                report["games"].append(row)
                args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                print(f"{game['id']}: {row.get('error', 'ok')}", flush=True)
        finally:
            browser.close()
    if not all(row["passed"] for row in report["games"]):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
