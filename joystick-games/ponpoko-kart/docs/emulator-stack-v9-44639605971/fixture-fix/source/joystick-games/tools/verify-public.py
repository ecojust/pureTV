#!/usr/bin/env python3
"""Download every declared delivery file without credentials and compare exact bytes."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    assert re.fullmatch('[0-9a-f]{40}', args.ref), 'Use an immutable commit SHA'
    assert not args.output.exists(), 'Preserve earlier verification results'
    manifest = json.loads(args.manifest.read_text())
    names = manifest['publicFiles']
    assert isinstance(names, list) and names and len(set(names)) == len(names)
    expected = {}
    for name in names:
        assert isinstance(name, str) and name and not PurePosixPath(name).is_absolute()
        assert '..' not in PurePosixPath(name).parts and '\\' not in name
        path = ROOT / name
        assert path.is_file() and not path.is_symlink()
        local = path.read_bytes()
        frozen = subprocess.check_output(['git', 'show', args.ref + ':' + name], cwd=ROOT)
        assert local == frozen, 'Local file is not the declared publication: ' + name
        expected[name] = {'bytes': len(local), 'sha256': hashlib.sha256(local).hexdigest()}

    def download(name):
        url = 'https://raw.githubusercontent.com/ecojust/pureTV/' + args.ref + '/' + quote(name)
        attempts = []
        for attempt in range(1, 4):
            try:
                length = 0
                digest = hashlib.sha256()
                with urlopen(Request(url, headers={'User-Agent': 'pureTV-joystick-game-public-verification'}), timeout=60) as response:
                    assert response.status == 200
                    while block := response.read(1024 * 1024):
                        length += len(block)
                        digest.update(block)
                actual = {'bytes': length, 'sha256': digest.hexdigest()}
                assert actual == expected[name], 'Downloaded bytes differ'
                attempts.append({'attempt': attempt, 'status': 'passed', **actual})
                return {'path': name, 'url': url, 'status': 'passed', 'attempts': attempts}
            except Exception as error:
                attempts.append({'attempt': attempt, 'status': 'failed', 'error': repr(error)})
                if attempt < 3:
                    time.sleep(attempt)
        return {'path': name, 'url': url, 'status': 'failed', 'attempts': attempts}

    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for future in as_completed([pool.submit(download, name) for name in names]):
            results.append(future.result())
            if len(results) % 10 == 0:
                print(json.dumps({'checked': len(results), 'total': len(names)}), flush=True)
    status = 'passed' if all(item['status'] == 'passed' for item in results) else 'failed'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({
        'status': status, 'publicationCommit': args.ref,
        'method': 'Full unauthenticated HTTP GET; size and SHA256 compared with the exact committed files.',
        'files': sorted(results, key=lambda item: item['path']), 'marketServerUploaded': False,
    }, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': status, 'filesVerified': len(results)}))
    assert status == 'passed'


if __name__ == '__main__':
    main()
