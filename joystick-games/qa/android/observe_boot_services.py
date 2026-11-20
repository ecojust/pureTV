#!/usr/bin/env python3
"""Observe first-boot system package replacements before the untouched TV app starts."""
import argparse
import json
import subprocess
import time
from pathlib import Path

def observe_packages(adb):
    def shell(*args):
        result = subprocess.run([adb, 'shell', *args], text=True, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, check=False, timeout=8)
        return result.stdout.strip() if result.returncode == 0 else None
    return {
        'bootCompleted': shell('getprop', 'sys.boot_completed'),
        'storeApks': shell('pm', 'path', 'com.android.vending'),
        'gmsApks': shell('pm', 'path', 'com.google.android.gms'),
        'fontProviderProcess': shell('pidof', 'com.google.android.gms.persistent'),
    }

def observe_until_quiet(read, clock=time.monotonic, sleep=time.sleep):
    # In the captured first boot, Play Store was replaced 32 s after BOOT_COMPLETED
    # and the GMS FontsProvider exited. Keep watching the actual package paths and PID.
    started = last_change = clock()
    previous = None
    samples = []
    while True:
        try:
            state = read()
        except (OSError, subprocess.TimeoutExpired) as error:
            state = {'readError': type(error).__name__}
        now = clock()
        if state != previous:
            last_change = now
            previous = state
        samples.append({'elapsedSeconds': round(now-started, 2), 'state': state})
        ready = (state.get('bootCompleted') == '1' and state.get('storeApks')
                 and state.get('gmsApks') and state.get('fontProviderProcess'))
        if ready and now-started >= 75 and now-last_change >= 30:
            status = 'stable'
            break
        if now-started >= 180:
            status = 'bounded-observation-ended'
            break
        sleep(min(5, 180 - (now-started)))
    return {'status': status, 'samples': samples, 'minimumObservationSeconds': 75,
            'minimumQuietSeconds': 30, 'maximumObservationSeconds': 180,
            'systemSettingsChanged': False, 'appStartedDuringObservation': False}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    report = observe_until_quiet(lambda: observe_packages(args.adb))
    args.output.parent.mkdir(exist_ok=True, parents=True)
    args.output.write_text(json.dumps(report, indent=2)+'\n')
    print(report['status'], report['samples'][-1]['elapsedSeconds'], flush=True)
