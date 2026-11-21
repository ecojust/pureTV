"""Attach Windows icon-refresh outputs only after every install/launch job passed."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

TAG = 'gameplay-icons-2026.11.21'


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packages', type=Path, required=True)
    folder = parser.parse_args().packages
    release = json.loads(gh('release', 'view', TAG, '--json', 'isDraft,apiUrl'))
    if not release['isDraft']:
        raise ValueError('Expected a draft release')
    asset_api = release['apiUrl'].split('api.github.com/')[1] + '/assets?per_page=100'
    pages = json.loads(gh('api', '--paginate', '--slurp', asset_api))
    existing = {a['name']: a['digest'] for page in pages for a in page}
    repo = Path(__file__).resolve().parents[2]
    source = json.loads((repo / 'tools/game-client-icon-inputs.json').read_text(encoding='utf-8'))
    inventory = {r['id']: r for r in source if r.get('windows')}
    records = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(folder.glob('*-windows-icon-verification.json'))]
    if len(records) != len(inventory) or {r['id'] for r in records} != inventory.keys():
        raise ValueError('Incomplete Windows reports')
    upload = []
    for record in records:
        slug = record['id']
        if record['sourceInstallerSha256'] != inventory[slug]['windowsSha256']:
            raise ValueError('Original installer digest mismatch for ' + slug)
        outputs = [{'file': record['installer'], 'sha256': record['sha256'], 'bytes': record['bytes']}]
        if 'portable' in record:
            outputs.append(record['portable'])
        for item in outputs:
            file = folder / item['file']
            if file.parent != folder or file.stat().st_size != item['bytes'] or hashlib.sha256(file.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError('Windows asset mismatch: ' + file.name)
            upload.append((file, item['sha256']))
    receipt = folder / 'windows-game-icons.json'
    receipt.write_text(json.dumps({
        'sourceCommit': os.environ['GITHUB_SHA'],
        'workflowRun': 'https://github.com/' + os.environ['GITHUB_REPOSITORY'] + '/actions/runs/' + os.environ['GITHUB_RUN_ID'],
        'games': records
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    upload.append((receipt, hashlib.sha256(receipt.read_bytes()).hexdigest()))
    for path, digest in upload:
        if path.name in existing and existing[path.name] != 'sha256:' + digest:
            raise ValueError('A different release asset already exists: ' + path.name)
    for path, _ in upload:
        if path.name not in existing:
            gh('release', 'upload', TAG, str(path))
        print(path.name, flush=True)


if __name__ == '__main__':
    main()
