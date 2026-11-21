"""Render mid-lap art previews from the unmodified Kart Royale distribution."""

import argparse
import functools
import hashlib
import io
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


# Fractions of a lap, measured from the start line. The gallery uses one mark per circuit.
STATIONS = {
    "cape-crown": 0.770,
    "marina-esses": 0.745,
    "sunset-bay": 0.745,
}

ADVANCE_TO_STATION = """target => {
    const ctx = window.__ctx;
    const race = ctx.race;
    const dt = 1 / 30;
    for (let frame = 0; frame < 9000; frame++) {
        ctx.dt = dt;
        ctx.time += dt;
        race.update(ctx, dt);
        window.__camRig.lateUpdate(ctx, dt);
        const t = race.player.t;
        if (race.state === 2 && t >= target && t < target + 0.04) {
            const gl = ctx.renderer.getContext();
            const rendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                lapFraction: t,
                meters: t * ctx.track.length,
                speedMetersPerSecond: race.player.forwardSpeed,
                camera: ctx.camera.position.toArray(),
                quality: ctx.settings.quality,
                renderWidth: ctx.renderer.domElement.width,
                renderHeight: ctx.renderer.domElement.height,
                gpu: rendererInfo ? gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : null
            };
        }
    }
    throw new Error('The AI did not reach the requested lap fraction: ' + target);
}"""


def capture(browser, url, course, station, output):
    page = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    page.set_default_timeout(240_000)
    try:
        page.goto(f"{url}?track={course}&quality=high&scale=1&scaler=off",
                  wait_until="domcontentloaded")
        page.wait_for_function("window.__gameReady && window.__ctx?.race?.player")
        # The game's screenshot hook pauses real-time simulation while allowing the
        # original pipeline to present. The shipping AI moves the kart from the grid.
        page.evaluate("""() => {
            window.__freeze = true;
            window.__ctx.race.autoDrive = true;
            window.__ctx.race.start();
        }""")
        observation = page.evaluate(ADVANCE_TO_STATION, station)
        if (observation["quality"], observation["renderWidth"], observation["renderHeight"]) != (2, 1280, 720):
            raise RuntimeError(f"Expected High at 1280×720 for {course}, got {observation}")
        # Preserve every canvas (including the minimap and dashboard instruments).
        # Hide text/menu DOM so the countdown and controller panel do not cover the bend.
        page.add_style_tag(content="""
            body * { visibility: hidden !important }
            canvas { visibility: visible !important }
        """)
        frame = page.evaluate("window.__ctx.frame")
        page.wait_for_function("first => window.__ctx.frame >= first + 7", arg=frame)
        raw = page.screenshot(type="png")
        destination = output / f"{course}-midcourse.jpg"
        with Image.open(io.BytesIO(raw)) as picture:
            picture.convert("RGB").save(destination, quality=94, subsampling=0, optimize=True)
        observation["course"] = course
        observation["jpegSha256"] = hashlib.sha256(destination.read_bytes()).hexdigest()
        print(json.dumps(observation, ensure_ascii=False), flush=True)
    finally:
        page.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=Path(__file__).resolve().parents[2] / "dist")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--chromium", help="Chromium executable (defaults to Playwright's Chromium)")
    parser.add_argument("--course", choices=STATIONS, action="append",
                        help="Render a specific circuit; repeat to render several")
    parser.add_argument("--angle", choices=["gl-egl", "swiftshader"], default="gl-egl")
    args = parser.parse_args()
    if not (args.dist / "tv.html").is_file():
        parser.error(f"Missing built game in {args.dist}")
    args.output.mkdir(exist_ok=True, parents=True)
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(args.dist.resolve()))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        url = f"http://127.0.0.1:{server.server_port}/tv.html"
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=args.chromium,
                    args=["--use-gl=angle", f"--use-angle={args.angle}", "--enable-gpu",
                          "--ignore-gpu-blocklist", "--disable-accelerated-2d-canvas"],
                )
                try:
                    for course in args.course or STATIONS:
                        capture(browser, url, course, STATIONS[course], args.output)
                finally:
                    browser.close()
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
