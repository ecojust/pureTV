#!/usr/bin/env python3
"""Fetch selected original capability evidence; never run or alter a game.

Uses only public immutable GitHub URLs. Every saved original file is checked
against its Git blob identity and the original export's SHA-256 manifest.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

REPOSITORY = 'ecojust/pureTV'
EXPORT = 'd26c8eabe88dea372fc342e38c3f48361bf72cd3'
INTEL_EXPORT = 'c4114b6fcf0c91264ae8373b8f680860334f67f9'
OUT = Path(__file__).resolve().parent / 'original-capability'


def download(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'pureTV-readonly-capability-evidence',
    }), timeout=60) as response:
        return response.read()


def tree(commit):
    raw = download(f'https://api.github.com/repos/{REPOSITORY}/git/trees/{commit}?recursive=1')
    data = json.loads(raw)
    assert data.get('truncated') is False
    return {entry['path']: entry for entry in data['tree'] if entry['type'] == 'blob'}


def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def main():
    source_tree = tree(EXPORT)
    intel_tree = tree(INTEL_EXPORT)
    names = ['export-manifest.json']
    for runner in ['macos-15-intel', 'macos-latest']:
        prefix = 'joystick-macos-capability-' + runner + '/'
        names += [prefix + name for name in [
            'observation-report.json', 'startup-summary.json',
            'webgl1-native.json', 'webgl2-native.json',
            'executed-webgl-probe.swift', 'executed-webgl1-probe.swift',
        ]]
        names += [prefix + game + '/diagnostics/state.json' for game in [
            'bubble-nebula', 'phosphor-patrol', 'wyrmzone', 'quiverspire',
        ]]
    names += ['joystick-macos-capability-macos-latest/' + name
              for name in ['webgl1-rosetta.json', 'webgl2-rosetta.json']]

    def fetch(name):
        data = download(f'https://raw.githubusercontent.com/{REPOSITORY}/{EXPORT}/{name}')
        expected = source_tree[name]
        assert len(data) == expected['size'] and blob_sha(data) == expected['sha'], name
        return name, data

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        originals = dict(pool.map(fetch, names))
    manifest = json.loads(originals['export-manifest.json'])
    assert manifest['runId'] == 44159596612 and manifest['runAttempt'] == 1
    assert manifest['nativeGameplayVerified'] is False
    records = {}
    for name, data in sorted(originals.items()):
        record = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        if name != 'export-manifest.json':
            assert record == manifest['files'][name], name
        record['gitBlobSha1'] = blob_sha(data)
        record['sourceUrl'] = f'https://raw.githubusercontent.com/{REPOSITORY}/{EXPORT}/{name}'
        if name.startswith('joystick-macos-capability-macos-15-intel/'):
            earlier_name = 'artifact/' + name.split('/', 1)[1]
            assert intel_tree[earlier_name]['sha'] == record['gitBlobSha1'], name
            record['sameOriginalIntelExport'] = {
                'commit': INTEL_EXPORT, 'path': earlier_name,
                'gitBlobSha1': intel_tree[earlier_name]['sha'],
            }
        target = OUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        records[name] = record
    (OUT.parent / 'capability-provenance.json').write_text(json.dumps({
        'schemaVersion': 1, 'repository': REPOSITORY, 'runId': 44159596612,
        'runAttempt': 1, 'exportCommit': EXPORT, 'originalIntelExportCommit': INTEL_EXPORT,
        'method': 'Read-only original byte retrieval; Git blob and original manifest checks',
        'gamesExecuted': False, 'packagesModified': False,
        'newNativeGameplayVerified': False, 'files': records,
    }, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'verifiedOriginalFiles': len(records), 'bytes': sum(
        record['bytes'] for record in records.values()), 'exportCommit': EXPORT}))


if __name__ == '__main__':
    main()
