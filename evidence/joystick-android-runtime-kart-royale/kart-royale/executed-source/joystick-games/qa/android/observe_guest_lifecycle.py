"""Retain bounded Android system evidence while the normal game driver runs."""
import argparse
from collections import deque
from pathlib import Path
import json
import subprocess
import threading
import time

PACKAGE = 'com.ecojust.joystick.kartroyale'
RELATED = (PACKAGE, 'com.ecojust.joystickqa.kartroyale', 'com.android.vending',
           'com.google.android.gms', 'FontsProvider', 'fontsprovider')

def exit_info(adb):
    try:
        proc = subprocess.run([adb, 'shell', 'dumpsys', 'activity', 'exit-info', PACKAGE],
                              capture_output=True, text=True, check=False, timeout=12)
        return {'returncode': proc.returncode, 'output': proc.stdout[-64000:], 'stderr': proc.stderr[-1200:]}
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {'error': type(exc).__name__}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('child', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    assert args.child and args.child[0] == '--' and len(args.child) > 1
    args.output.mkdir(parents=True, exist_ok=True)
    recent = deque(maxlen=2000)
    tags = ['ActivityManager:I', 'ActivityTaskManager:I', 'PackageManager:I', 'am_kill:I',
            'am_crash:I', 'am_proc_start:I', 'am_proc_died:I', 'am_anr:I', 'AndroidRuntime:E', '*:S']
    started = time.time()
    pre = exit_info(args.adb)
    log = subprocess.Popen([args.adb, 'logcat', '-v', 'threadtime', '-b', 'system', '-b', 'events',
                            '-b', 'crash', '-b', 'main', *tags], stdout=subprocess.PIPE,
                           stderr=subprocess.DEVNULL, text=True, errors='replace')
    def drain():
        for line in log.stdout:
            if any(token in line for token in RELATED):
                recent.append(line.rstrip()[:1500])
    reader = threading.Thread(target=drain, daemon=True)
    reader.start()
    try:
        child = subprocess.run(args.child[1:], check=False)
    finally:
        after = exit_info(args.adb)
        log.terminate()
        try:
            log.wait(timeout=5)
        except subprocess.TimeoutExpired:
            log.kill()
            log.wait(timeout=5)
        reader.join(timeout=5)
        result = {'startedAt': started, 'endedAt': time.time(), 'targetPackage': PACKAGE,
                  'logcatMaxLines': recent.maxlen, 'activityExitInfoBefore': pre,
                  'activityExitInfoAfter': after, 'matchingLogLines': list(recent)}
        (args.output/'guest-process-history.json').write_text(json.dumps(result, indent=2)+'\n')
    return child.returncode

if __name__ == '__main__':
    raise SystemExit(main())
