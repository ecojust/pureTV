"""Play catalog APKs through the desktop HTTP host and real JoystickClient TCP connections."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import platform
import re
import subprocess
import shutil
import sys
import time
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

PC = Path(__file__).resolve().parents[1]
ROOT = PC.parents[1]
sys.path.insert(0, str(PC))
from verify_resource_inputs import desktop, pad  # noqa: E402 - repository-local host and SDK fixtures

plan_spec = importlib.util.spec_from_file_location("qa_plan", ROOT / "joystick-games/tools/qa-plan.py")
qa = importlib.util.module_from_spec(plan_spec)
plan_spec.loader.exec_module(qa)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def wait(page, label, predicate, timeout=180):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        state = page.evaluate("window.JoystickGameQA?.snapshot?.() || null")
        if state and predicate(state):
            return state
        page.wait_for_timeout(100)
    raise AssertionError(f"{label} timed out; last state {str(state)[:2500]}")


def model_fields(state, paths):
    return {path: qa.read_path(state, path) for path in paths}


def press(page, client, step):
    before = page.evaluate("window.JoystickGameQA.snapshot()")
    keys = step["keys"]
    for key in keys:
        client.button(key, "down")
    try:
        after = wait(
            page,
            step["name"],
            lambda state: all(state["controller"]["buttons"].get(key) for key in keys)
            and qa.matches(step["expect"], state, before),
        )
    finally:
        for key in keys:
            client.button(key, "up")
    wait(page, "physical key release", lambda s: all(not s["controller"]["buttons"][k] for k in keys))
    paths = [e["path"] for e in step["expect"]]
    starting = {}
    for path in paths:
        try:
            starting[path] = qa.read_path(before, path)
        except ValueError:
            pass  # The original game may create a field when entering a match.
    return {"keys": keys, "name": step["name"], "before": starting, "after": model_fields(after, paths)}


def signature(apk, verifier):
    output = subprocess.run(
        [verifier, "verify", "--print-certs", str(apk)], check=True, capture_output=True, text=True
    ).stdout
    actual = re.findall(r"^Signer #\d+ certificate SHA-256 digest:\s*([a-fA-F0-9]{64})$", output, re.M)
    expected = json.loads((apk.parent / "packages.json").read_text())["android"]["certificateSha256"]
    assert [v.lower() for v in actual] == [expected], f"Unexpected signer on {apk}"
    return actual[0].lower()


def run(browser, row, verifier):
    slug = row["id"]
    directory = ROOT / "joystick-games" / slug
    apk = directory / Path(urlsplit(row["url"]).path).name
    sha = digest(apk)
    assert apk.stat().st_size == row["bytes"] and sha == row["sha256"], f"Catalog mismatch for {apk}"
    signer = signature(apk, verifier) if verifier else None
    plan = qa.load_plan(directory / "qa-plan.json")
    with (
        desktop(slug, apk) as (url, tcp),
        browser.new_context(viewport={"width": 800, "height": 450}) as context,
    ):
        page = context.new_page()
        errors, external, local = [], [], set()
        origin = urlsplit(url).netloc

        def restrict(route):
            target = urlsplit(route.request.url)
            if target.netloc == origin and target.scheme == "http":
                local.add(target.path)
                route.continue_()
            elif target.scheme in ("data", "blob"):
                route.continue_()
            else:
                external.append(route.request.url)
                route.abort()

        page.route("**/*", restrict)
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on(
            "response",
            lambda res: errors.append(f"HTTP {res.status} {res.url}") if res.status >= 400 else None,
        )
        page.goto(url, wait_until="domcontentloaded", timeout=180000)
        menu = wait(
            page,
            "original game menu",
            lambda s: s["stage"] == "menu" and s["controller"]["pollCount"] > 1,
        )
        with pad(tcp) as client:

            def joined(state):
                return next(
                    (
                        p
                        for p in state["controller"]["players"]
                        if p.get("connected")
                        and p["controllerId"] == client.identity
                        and p["transport"] == "wifi"
                    ),
                    None,
                )

            first = joined(wait(page, "SDK hello", joined))
            observations = [press(page, client, step) for step in plan["steps"]]
            assert page.evaluate("window.JoystickGameQA.snapshot().stage") == "playing", (
                "Lifecycle check needs running gameplay"
            )
            # Close the real socket while a physical direction remains down;
            # there is deliberately no button-up packet before disconnection.
            client.button("RIGHT", "down")
            wait(
                page,
                "held direction before disconnect",
                lambda s: s["stage"] == "playing" and s["controller"]["buttons"]["RIGHT"],
            )
            client.disconnect()
            paused = wait(
                page,
                "socket disconnect pauses game",
                lambda s: s["stage"] == "paused" and not s["controller"].get("connected"),
            )
            assert not any(paused["controller"]["buttons"].values()), (
                "Held key survived socket disconnect"
            )
            stable = model_fields(paused, plan["pauseStablePaths"])
            client.connect()
            rejoined = wait(
                page, "new TCP session", lambda s: joined(s) and joined(s)["session"] != first["session"]
            )
            assert rejoined["stage"] == "paused" and not any(rejoined["controller"]["buttons"].values())
            reread = wait(
                page,
                "reconnected game remains paused",
                lambda s: s["controller"]["pollCount"] >= rejoined["controller"]["pollCount"] + 3,
            )
            assert (
                reread["stage"] == "paused" and model_fields(reread, plan["pauseStablePaths"]) == stable
            )
            resume = press(
                page,
                client,
                {
                    "keys": ["START"],
                    "name": "Explicit resume after reconnect",
                    "expect": [{"path": "stage", "op": "eq", "value": "playing"}],
                },
            )
        assert not errors and not external, {"pageErrors": errors, "externalRequests": external}
    return {
        "game": slug,
        "apk": apk.relative_to(ROOT).as_posix(),
        "bytes": apk.stat().st_size,
        "sha256": sha,
        "certificateSha256": signer,
        "renderer": menu["renderer"],
        "webgl": menu.get("webglVersion"),
        "steps": observations,
        "localPaths": len(local),
        "pageErrors": errors,
        "externalRequests": external,
        "controller": {
            "seat": first["id"],
            "transport": first["transport"],
            "reconnectedWithNewSession": True,
            "keyDownAtDisconnect": "RIGHT",
            "disconnectedKeysNeutral": True,
            "reconnectedKeysNeutral": True,
            "pausedFields": stable,
            "resume": resume,
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("games", nargs="+")
    parser.add_argument("--browser", default=shutil.which("chromium"))
    parser.add_argument("--apksigner", help="Verify the Android release signer too")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    catalog = {r["id"]: r for r in json.loads((PC / "catalog.json").read_text())}
    chromium_args = [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--disable-gpu-sandbox",
    ]
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=args.browser, args=chromium_args)
        result = {
            "platform": platform.system(),
            "browser": browser.version,
            "chromiumArgs": chromium_args,
            "sourceSha256": {
                path.relative_to(ROOT).as_posix(): digest(path)
                for path in [
                    PC / "host.py",
                    PC / "pc-bridge.js",
                    ROOT / "puretv-joystick/joystick_sdk.py",
                ]
            },
            "games": [],
        }
        failed = False
        for slug in args.games:
            try:
                receipt = run(browser, catalog[slug], args.apksigner)
            except Exception as exc:
                receipt = {"game": slug, "error": str(exc)}
                failed = True
            result["games"].append(receipt)
            args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
            print(slug, receipt.get("error") or "PASS", flush=True)
        browser.close()
    return failed


if __name__ == "__main__":
    sys.exit(main())
