#!/usr/bin/env python3
"""Select registered catalog batches and run both immutable installed-APK scenarios."""
import argparse
from contextlib import contextmanager, nullcontext
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

spec = importlib.util.spec_from_file_location('joystick_build', Path(__file__).with_name('android-build.py'))
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)


def select(batch, games):
    registry = build.registry_data((build.ROOT / build.REGISTRY).read_text())
    packages = build.registered_packages(data=registry)
    assert batch in registry.get('batches', {}), 'Unknown registered batch'
    batch_games = registry['batches'][batch]
    assert isinstance(batch_games, list) and batch_games and len(batch_games) == len(set(batch_games))
    selected = [game.strip() for game in games.split(',')] if games else batch_games
    assert isinstance(selected, list) and selected and len(selected) == len(set(selected))
    assert all(slug in batch_games and slug in packages and slug not in build.LEGACY_PACKAGES for slug in selected)
    return selected


@contextmanager
def device_diagnostics(adb, output):
    """Keep guest evidence even if the emulator disappears before QA cleanup."""
    output.mkdir(parents=True, exist_ok=True)
    package = 'com.ecojust.joystick.claudeoftanks'
    tags = ['PureTVQA:W', 'ActivityManager:I', 'ActivityTaskManager:I', 'AndroidRuntime:E',
            'chromium:W', 'Choreographer:I', 'HWUI:I', 'lowmemorykiller:I', 'lmkd:I',
            'am_kill:I', 'am_proc_died:I', 'am_anr:I', 'am_crash:I', '*:S']
    logcat = subprocess.Popen([adb, 'logcat', '-b', 'main', '-b', 'system', '-b', 'events',
                               '-b', 'crash', '-v', 'threadtime', '-T', '1', *tags],
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    stop = threading.Event()
    def log_guest():
        budget = 4 * 1024 * 1024
        with (output / 'logcat.txt').open('wb') as stream:
            for line in logcat.stdout:
                if len(line) <= budget:
                    stream.write(line)
                    stream.flush()
                    budget -= len(line)
    def sample_guest():
        # The disposable test image runs only the target app and the usual Android services.
        command = (f"ps -A -o PID,PPID,RSS,STAT,NAME | grep -E '{package}|webview:sandboxed'; "
                   "grep -E '^(MemAvailable|MemFree|SwapFree):' /proc/meminfo; "
                   "dumpsys activity activities | grep -m1 -E 'topResumedActivity|mResumedActivity'")
        with (output / 'guest-state.jsonl').open('w', encoding='utf-8') as stream:
            while not stop.is_set():
                started = time.time()
                row = {'at': started}
                try:
                    response = subprocess.run([adb, 'shell', command], capture_output=True, timeout=6)
                    row.update(exitCode=response.returncode, stdout=response.stdout.decode(errors='replace')[:16384],
                               stderr=response.stderr.decode(errors='replace')[:2048])
                except subprocess.TimeoutExpired:
                    row['error'] = 'ADB shell timed out after 6 seconds'
                stream.write(json.dumps(row) + '\n')
                stream.flush()
                stop.wait(max(0, 10 - (time.time() - started)))
    readers = [threading.Thread(target=worker, daemon=True) for worker in (log_guest, sample_guest)]
    for reader in readers:
        reader.start()
    try:
        yield
    finally:
        stop.set()
        logcat.terminate()
        try:
            logcat.wait(timeout=3)
        except subprocess.TimeoutExpired:
            logcat.kill()
            logcat.wait()
        for reader in readers:
            reader.join(timeout=7)
        logcat.stdout.close()


def runtime(args):
    meta = build.metadata(args.game)
    assert args.game not in build.LEGACY_PACKAGES
    confirm_install = getattr(args, 'confirm_backroad_install', 'false') == 'true'
    assert not confirm_install or args.game == 'backroad-rally', 'Installation confirmation is Backroad-only'
    outcomes = []
    for mode in ('normal', 'occupied'):
        cmd = [sys.executable, str(build.ROOT / 'joystick-games/qa/android/run.py'), '--game', args.game,
               '--apk', str(args.input / 'packages' / args.game / (args.game + '-' + meta['version'] + '.apk')),
               '--observer', str(args.input / 'observers' / args.game / ('observer-' + args.game + '.apk')),
               '--output', str(args.output / (args.game + '-' + mode)), '--adb', args.adb]
        if mode == 'occupied': cmd += ['--occupy-default-port']
        if confirm_install: cmd += ['--confirm-backroad-install']
        diagnostics = (device_diagnostics(args.adb, args.output / args.game / 'device-diagnostics' / mode)
                       if args.game == 'claude-of-tanks' else nullcontext())
        with diagnostics:
            outcomes.append({'mode': mode, 'exitCode': subprocess.run(cmd, check=False).returncode})
    build.write(args.output / (args.game + '-outcomes.json'), outcomes)
    assert all(item['exitCode'] == 0 for item in outcomes), 'Original scenario failures retained'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest='command', required=True)
    p = subs.add_parser('select'); p.add_argument('--batch', default='one-button-01'); p.add_argument('--games')
    p = subs.add_parser('runtime'); p.add_argument('--game', required=True, choices=build.PACKAGES)
    for name in ('input', 'output'): p.add_argument('--' + name, type=Path, required=True)
    p.add_argument('--adb', default='adb')
    p.add_argument('--confirm-backroad-install', choices=('false', 'true'), default='false')
    args = parser.parse_args()
    if args.command == 'select':
        games = select(args.batch, args.games)
        result = {'matrix': json.dumps({'game': games}, separators=(',', ':')), 'games': ','.join(games)}
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
                for key, value in result.items(): output.write(key + '=' + value + '\n')
        print(json.dumps(result))
    else: runtime(args)


if __name__ == '__main__': main()
