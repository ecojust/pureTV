#!/usr/bin/env python3
"""Publish the existing Android release draft only after all package checks pass."""
import argparse
import json
import re
import subprocess
import tempfile
import time
import zipfile
from pathlib import Path

from resource_catalog import digest, verify_catalog, RELEASE_CERTIFICATE_CUTOVERS

REPOSITORY = 'ecojust/pureTV'


def api(path, payload=None):
    command = ['gh', 'api', path + ('&' if '?' in path else '?') + f'nocache={time.time_ns()}']
    if payload is not None:
        command += ['--method', 'PATCH', '--input', '-']
    return json.loads(subprocess.check_output(command, input=json.dumps(payload).encode() if payload is not None else None))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--build-tools', required=True, type=Path)
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    assert re.fullmatch(r'[0-9a-f]{40}', args.source_sha), 'Exact source SHA required'
    version_match = re.fullmatch(r'android-v(\d+\.\d+\.\d+)', args.tag)
    assert version_match, 'Expected an Android version tag'
    version = version_match[1]
    root = Path(__file__).resolve().parents[1]
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip() == args.source_sha
    entries = verify_catalog(root, args.build_tools)
    packages = [entry for entry in entries if entry['packageName'].startswith('com.ecojust.')]
    assert {entry['packageName'] for entry in packages} == set(RELEASE_CERTIFICATE_CUTOVERS), 'Expected all 24 self-developed packages'
    certificate = (root / 'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    builds = {}
    files = []
    for entry in packages:
        assert entry['version'] == version and entry['certificateSha256'] == certificate
        assert re.fullmatch(r'[A-Za-z0-9._-]+\.apk', entry['apk'])
        build_match = re.fullmatch(r'https://github.com/ecojust/pureTV/actions/runs/(\d+)', entry['buildRun'])
        assert build_match and re.fullmatch(r'[a-f0-9]{40}', entry['sourceCommit'])
        run_id = build_match[1]
        if run_id not in builds:
            builds[run_id] = api(f'repos/{REPOSITORY}/actions/runs/{run_id}')
        build = builds[run_id]
        assert build['status'] == 'completed' and build['conclusion'] == 'success'
        assert build['head_sha'] == entry['sourceCommit']
        assert build['repository']['full_name'] == REPOSITORY and build['head_repository']['full_name'] == REPOSITORY
        package = root / entry['path']
        folder = package.parent
        expected_workflow = 'android.yml' if entry['kind'] == 'app' or folder.name == 'puretv' else 'nova.yml' if folder.name == 'nova' else 'launcher-collection.yml'
        assert build['path'] == '.github/workflows/' + expected_workflow
        # Release metadata/docs may change after the build, but its inputs may not.
        inputs = [folder / name for name in ('src', 'app', 'build.gradle', 'settings.gradle', 'gradle', 'gradle.properties', 'tools', 'proguard-rules.pro')]
        inputs += [root / 'resource/launcher/puretv' / name for name in ('build.gradle', 'settings.gradle', 'gradle.properties', 'gradle')]
        subprocess.run(['git', 'diff', '--exit-code', '--quiet', entry['sourceCommit'], args.source_sha, '--', *map(str, inputs)], cwd=root, check=True)
        assets = folder / ('app/src/main/assets' if entry['kind'] == 'launcher' else 'src/main/assets')
        with zipfile.ZipFile(package) as archive:
            assert len(archive.namelist()) == len(set(archive.namelist()))
            for asset in assets.rglob('*'):
                assert not asset.is_symlink()
                if asset.is_file():
                    assert archive.read('assets/' + asset.relative_to(assets).as_posix()) == asset.read_bytes()
        for line in (folder / 'SHA256SUMS.txt').read_text().splitlines():
            checksum, name = line.split('  ', 1)
            path = (folder / name).resolve()
            assert path.is_relative_to(folder.resolve()) and digest(path) == checksum
        files.append(package)
    assert len(files) == len({file.name for file in files}) == 24
    releases = []
    page = 1
    while True:
        batch = api(f'repos/{REPOSITORY}/releases?per_page=100&page={page}')
        releases.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    matches = [release for release in releases if release['tag_name'] == args.tag]
    assert len(matches) == 1, 'An existing reviewed release draft is required'
    release = matches[0]
    endpoint = f'repos/{REPOSITORY}/releases/{release["id"]}'
    if args.validate_only:
        print(json.dumps({'verifiedApks': len(files), 'verifiedBuilds': len(builds), 'release': release['html_url']}))
        return
    with tempfile.TemporaryDirectory(prefix='android-release-') as temporary:
        temporary = Path(temporary)
        sums = temporary / 'SHA256SUMS.txt'
        sums.write_text(''.join(digest(file) + '  ' + file.name + '\n' for file in files))
        fingerprint = temporary / 'SIGNING-CERTIFICATE-SHA256.txt'
        fingerprint.write_text(certificate + '\n')
        files += [sums, fingerprint]
        expected = {file.name: {'size': file.stat().st_size, 'digest': 'sha256:' + digest(file)} for file in files}
        if release['draft']:
            assert all(asset['name'] in expected for asset in release['assets']), 'Unexpected draft attachments'
            subprocess.run(['gh', 'release', 'upload', args.tag, *map(str, files), '--clobber', '--repo', REPOSITORY], check=True)
        for attempt in range(10):
            latest = api(endpoint)
            actual = {asset['name']: asset for asset in latest['assets']}
            verified = set(actual) == set(expected) and all(
                actual[name]['state'] == 'uploaded' and actual[name]['size'] == info['size'] and actual[name].get('digest') == info['digest']
                for name, info in expected.items())
            if verified:
                break
            time.sleep(2)
        assert verified, 'Remote release assets do not match the verified local files'
        if latest['draft']:
            latest = api(endpoint, {'draft': False, 'target_commitish': args.source_sha, 'make_latest': 'false'})
        assert not latest['draft'] and latest['target_commitish'] == args.source_sha
        print(json.dumps({'published': latest['html_url'], 'verifiedAssets': len(files)}))


if __name__ == '__main__':
    main()
