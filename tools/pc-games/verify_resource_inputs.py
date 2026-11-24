"""Exercise the catalog’s original Android TV games through their desktop host with an actual SDK client."""

import argparse
import contextlib
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "puretv-joystick"))
from joystick_sdk import JoystickClient

# The first phase reached by START is game-specific.
STARTED = {
    "alien-shooter": "playing",
    "jackal": "intro",
    "jewel": "playing",
    "neon-rush": "playing",
    "super-mario": "playing",
    "tank": "stageintro",
    "tetris": "playing",
    "used-car-racing": "countdown",
}
ONE_SEAT = {"alien-shooter", "neon-rush"}
OBSERVE = """() => {
  const qa = window.PureTVQA?.snapshot();
  return qa ? {
    phase: qa.phase,
    players: (qa.controllers || []).map(p => ({
      id: p.id, connected: p.connected, identity: p.controllerId, x: p.x,
      right: p.buttons?.RIGHT, transport: p.transport
    })),
  } : {};
}"""


def wait_for(page, condition, label, timeout=40):
    deadline = time.monotonic() + timeout
    state = {}
    while time.monotonic() < deadline:
        state = page.evaluate(OBSERVE)
        if condition(state):
            return state
        page.wait_for_timeout(85)
    raise AssertionError(f"{label} timed out; last game snapshot was {state}")


@contextlib.contextmanager
def desktop(slug, package):
    command = [
        sys.executable,
        "-u",
        str(Path(__file__).with_name("host.py")),
        "--game",
        slug,
        "--apk",
        str(package),
        "--language",
        "en",
        "--no-browser",
        "--http-port",
        "0",
        "--controller-port",
        "0",
    ]
    child = subprocess.Popen(command, stdout=subprocess.PIPE, text=True)
    try:
        game_log, pad_log = child.stdout.readline(), child.stdout.readline()
        if not game_log.startswith("Game: ") or not pad_log.startswith(
            "Controller: TCP "
        ):
            raise RuntimeError(f"Host failed to start: {game_log} {pad_log}")
        yield game_log.split()[1], int(pad_log.split()[2])
    finally:
        child.terminate()
        child.wait(timeout=20)
        child.stdout.close()


@contextlib.contextmanager
def pad(port):
    client = JoystickClient("127.0.0.1", port)
    client.connect()
    stop = threading.Event()

    def heartbeat():
        while not stop.wait(0.5):
            with contextlib.suppress(OSError):
                client.ping()

    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    try:
        yield client
    finally:
        stop.set()
        thread.join()
        client.disconnect()


def expect_seat(page, client, seat, **state):
    expected = dict(
        id=seat, identity=client.identity, connected=True, transport="wifi", **state
    )
    wait_for(
        page,
        lambda model: any(
            all(player.get(k) == value for k, value in expected.items())
            for player in model.get("players", [])
        ),
        f"seat {seat} {state}",
    )


def start(page, slug, down, up):
    for attempt in range(3):
        down()
        try:
            return wait_for(
                page,
                lambda q: q.get("phase") == STARTED[slug],
                f"{slug} START",
                timeout=8,
            )["phase"]
        except AssertionError:
            if attempt == 2:
                raise
        finally:
            up()
        page.wait_for_timeout(150)


def exercise(browser, slug, package):
    issues = []
    context = browser.new_context(
        viewport={"width": 640, "height": 360}, device_scale_factor=0.5
    )
    try:
        page = context.new_page()
        page.on("pageerror", lambda error: issues.append(str(error)))
        with desktop(slug, package) as (url, port):
            page.goto(url, wait_until="domcontentloaded", timeout=150000)
            page.bring_to_front()
            initial = wait_for(
                page,
                lambda q: bool(q.get("phase")) and q["phase"] != "loading",
                "original game start",
                timeout=150,
            )["phase"]
            keyboard = start(
                page,
                slug,
                lambda: page.keyboard.down("p"),
                lambda: page.keyboard.up("p"),
            )
            page.reload(wait_until="domcontentloaded", timeout=150000)
            wait_for(page, lambda q: q.get("phase") == initial, "restored menu")
            with contextlib.ExitStack() as pads:
                first = pads.enter_context(pad(port))
                expect_seat(page, first, 1)
                if slug not in ONE_SEAT:
                    second = pads.enter_context(pad(port))
                    expect_seat(page, second, 2)
                    second.button("RIGHT", "down")
                    expect_seat(page, second, 2, right=True, x=1)
                    expect_seat(page, first, 1, right=False, x=0)
                    second.button("RIGHT", "up")
                    expect_seat(page, second, 2, right=False, x=0)
                wifi = start(
                    page,
                    slug,
                    lambda: first.button("START", "down"),
                    lambda: first.button("START", "up"),
                )
                first.button("RIGHT", "down")
                expect_seat(page, first, 1, right=True, x=1)
                first.button("RIGHT", "up")
                expect_seat(page, first, 1, right=False, x=0)
            wait_for(
                page,
                lambda q: not any(
                    p["connected"] and p["transport"] == "wifi"
                    for p in q.get("players", [])
                ),
                "disconnect",
            )
            if issues:
                raise AssertionError(issues)
            with package.open("rb") as stream:
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            return dict(
                game=slug,
                sha256=digest,
                initial=initial,
                keyboard=keyboard,
                wifi=wifi,
                seats=1 if slug in ONE_SEAT else 2,
                rightReleased=True,
                disconnected=True,
            )
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory",
        type=Path,
        help="game.apk or game/*.apk; .zip payloads also accepted",
    )
    parser.add_argument("games", nargs="*", help="default: all supported games")
    parser.add_argument(
        "--browser", type=Path, default=os.environ.get("PURETV_CHROMIUM")
    )
    parser.add_argument("--browser-arg", action="append", default=[])
    args = parser.parse_args()
    failures = 0
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=args.browser, args=args.browser_arg
        )
        for slug in args.games or sorted(STARTED):
            if slug not in STARTED:
                parser.error("Unknown resource game: " + slug)
            files = [
                p
                for suffix in ("apk", "zip")
                for p in (
                    args.directory / f"{slug}.{suffix}",
                    *sorted((args.directory / slug).glob(f"*.{suffix}")),
                )
                if p.is_file()
            ]
            if len(files) != 1:
                parser.error(f"Expected exactly one package for {slug}: {files}")
            try:
                result = exercise(browser, slug, files[0])
            except Exception as exc:
                failures += 1
                result = dict(game=slug, error=str(exc))
            print(json.dumps(result, ensure_ascii=False), flush=True)
        browser.close()
    return bool(failures)


if __name__ == "__main__":
    sys.exit(main())
