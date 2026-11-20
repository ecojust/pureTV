"""Exercise a packaged desktop player using the original SDK and normal keyboard events."""
import argparse
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from urllib.request import ProxyHandler, build_opener

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'puretv-joystick'))
from joystick_sdk import JoystickClient


def free_port():
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        return probe.getsockname()[1]


def wait_for(page, predicate, argument=None, timeout=25):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if page.evaluate(predicate, argument):
            return
        page.wait_for_timeout(80)
    raise AssertionError(f'Timed out waiting for {predicate}')


def exercise(command, browser_channel):
    web_port = free_port()
    controller_port = free_port()
    while web_port == controller_port:
        controller_port = free_port()
    url = f'http://127.0.0.1:{web_port}/tv.html'
    opener = build_opener(ProxyHandler({}))
    with tempfile.TemporaryDirectory() as cache:
        child = subprocess.Popen([*command, 'tetris', '--cache', cache, '--http-port', str(web_port),
                                  '--controller-port', str(controller_port), '--no-browser'])
        try:
            deadline = time.monotonic() + 90
            while time.monotonic() < deadline and child.poll() is None:
                try:
                    with opener.open(url, timeout=2) as page:
                        if page.status == 200:
                            break
                except OSError:
                    pass
                time.sleep(.2)
            else:
                raise RuntimeError(f'Game failed to start (exit {child.poll()})')

            with sync_playwright() as pw:
                options = dict(channel=browser_channel) if browser_channel else {}
                if os.environ.get('PURETV_CHROMIUM'):
                    options = dict(executable_path=os.environ['PURETV_CHROMIUM'])
                browser = pw.chromium.launch(**options)
                page = browser.new_page(viewport={'width': 1280, 'height': 720})
                page.goto(url, wait_until='domcontentloaded')
                phase = 'window.PureTVQA?.snapshot().phase'
                wait_for(page, '() => ' + phase + ' === "title"')
                page.keyboard.press('Enter', delay=100)
                wait_for(page, '() => ' + phase + ' === "playing"')
                piece_x = 'window.PureTVQA.snapshot().players[0].piece?.x'
                start_x = page.evaluate('() => ' + piece_x)
                page.keyboard.down('ArrowLeft')
                try:
                    wait_for(page, 'start => ' + piece_x + ' < start', start_x)
                finally:
                    page.keyboard.up('ArrowLeft')
                print('Keyboard started Tetris and moved the falling piece', flush=True)
                page.reload(wait_until='domcontentloaded')
                wait_for(page, '() => ' + phase + ' === "title"')
                client = JoystickClient('127.0.0.1', controller_port)
                client.connect()
                stopped = threading.Event()

                def keep_alive():
                    while not stopped.wait(.4):
                        client.ping()

                heartbeat = threading.Thread(target=keep_alive, daemon=True)
                heartbeat.start()
                try:
                    wait_for(page, 'id => document.body.innerText.includes(id)', client.identity)
                    client.button('START', 'down')
                    wait_for(page, '() => ' + phase + ' === "playing"')
                    client.button('START', 'tap', 100)
                    start_x = page.evaluate('() => ' + piece_x)
                    client.button('RIGHT', 'down')
                    wait_for(page, 'start => ' + piece_x + ' > start', start_x)
                    client.button('RIGHT', 'tap', 100)
                    print('Wi-Fi protocol started Tetris and moved the falling piece', flush=True)
                finally:
                    stopped.set()
                    heartbeat.join()
                    client.disconnect()
                wait_for(page, 'id => !document.body.innerText.includes(id)', client.identity)
                browser.close()
        finally:
            if os.name == 'nt' and child.poll() is None:
                # The PyInstaller one-file bootloader owns a second player process.
                subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'], check=False)
            elif child.poll() is None:
                child.terminate()
            child.wait(timeout=25)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', type=Path)
    parser.add_argument('--channel')
    args = parser.parse_args()
    command = [str(args.exe.resolve())] if args.exe else [sys.executable, str(Path(__file__).with_name('launcher.py'))]
    exercise(command, args.channel)
