#!/usr/bin/env python3
"""Read-only host evidence for disposable Android CI, including before AVD boot."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def read_optional(path):
    try:
        return Path(path).read_text()
    except OSError as error:
        return {'error': repr(error)}


def process_rows(text):
    rows = []
    for line in text.splitlines():
        fields = line.split(maxsplit=4)
        if len(fields) != 5:
            continue
        try:
            rows.append({'pid': int(fields[0]), 'ppid': int(fields[1]),
                         'rssKiB': int(fields[2]), 'cpuPercent': float(fields[3]),
                         'commandName': fields[4]})
        except ValueError:
            continue
    # Command names only: never collect arguments, environments, or credentials.
    rows.sort(key=lambda row: row['rssKiB'], reverse=True)
    watched = ('qemu', 'emulator', 'chrome', 'chromium', 'adb', 'node', 'python')
    selected = [row for index, row in enumerate(rows)
                if index < 40 or any(name in row['commandName'] for name in watched)]
    return {'totalProcesses': len(rows), 'largestAndRelevantProcesses': selected}


def capture(command, timeout=10):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
        return {'command': command, 'exitCode': result.returncode,
                'stdout': result.stdout, 'stderr': result.stderr}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {'command': command, 'error': repr(error)}


def sample():
    processes = capture(['ps', '-eo', 'pid=,ppid=,rss=,pcpu=,comm='])
    result = {'at': stamp(), 'memory': read_optional('/proc/meminfo'),
              'memoryPressure': read_optional('/proc/pressure/memory'),
              'cpuPressure': read_optional('/proc/pressure/cpu'),
              'cgroup': {name: read_optional('/sys/fs/cgroup/' + name)
                         for name in ['memory.current', 'memory.max', 'memory.events', 'memory.peak']}}
    result['processes'] = process_rows(processes['stdout']) if processes.get('exitCode') == 0 else processes
    return result


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')


def kernel_snapshot(output, label):
    result = capture(['sudo', '-n', 'dmesg', '--time-format', 'iso'])
    (output / ('kernel-' + label + '.txt')).write_text(result.pop('stdout', ''))
    write_json(output / ('kernel-' + label + '-status.json'), result)


def collect(output):
    write_json(output / 'collector.json', {'pid': os.getpid(), 'startedAt': stamp(),
                                         'sampleIntervalSeconds': 5, 'readOnly': True,
                                         'commandArgumentsCollected': False})
    kernel_snapshot(output, 'before')
    with (output / 'host-samples.jsonl').open('w') as stream:
        while True:
            stream.write(json.dumps(sample()) + '\n'); stream.flush()
            if (output / 'stop-requested').exists():
                break
            for _ in range(10):
                if (output / 'stop-requested').exists():
                    break
                time.sleep(.5)
    kernel_snapshot(output, 'after')
    crash_root = Path('/tmp/android-runner')
    copied = []
    if crash_root.is_dir():
        for source in crash_root.glob('emu-crash-*'):
            if source.is_symlink():
                continue
            destination = output / 'emulator-crash-data' / source.name
            destination.parent.mkdir(exist_ok=True)
            try:
                if source.is_dir():
                    shutil.copytree(source, destination)
                elif source.is_file():
                    shutil.copy2(source, destination)
                copied.append(source.name)
            except OSError as error:
                copied.append({'name': source.name, 'error': repr(error)})
    write_json(output / 'finished.json', {'finishedAt': stamp(), 'crashData': copied})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['start', 'stop', 'collect'])
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(); output = args.output.resolve()
    if args.action == 'start':
        output.mkdir(parents=True, exist_ok=False)
        with (output / 'collector-stderr.txt').open('w') as stream:
            child = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), 'collect',
                                      '--output', str(output)], stdout=stream, stderr=subprocess.STDOUT,
                                     start_new_session=True)
        write_json(output / 'start.json', {'pid': child.pid, 'requestedAt': stamp()})
    elif args.action == 'stop':
        if not output.exists():
            return
        (output / 'stop-requested').write_text(stamp() + '\n')
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline and not (output / 'finished.json').exists():
            time.sleep(.25)
        write_json(output / 'stop-status.json', {'at': stamp(), 'collectorFinished': (output / 'finished.json').exists()})
    else:
        collect(output)


if __name__ == '__main__':
    main()
