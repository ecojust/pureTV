#!/usr/bin/env python3
"""Publish verified store/launcher CI exports into the APK resource directories.

This does not sign locally, publish a GitHub Release, push Git, or alter Gitee.
"""
import argparse
import hashlib
import json
import posixpath
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

from resource_catalog import apk_info, digest, expected_release_certificate, launcher_source_tree
from resource_previews import validate_png, write_english_previews

ROOT = Path(__file__).resolve().parents[1]
LAUNCHERS = ('puretv', 'nova', 'forma', 'moss', 'aster', 'sol', 'mono', 'pixel', 'circuit', 'drift')
PACKAGES = {slug: 'com.ecojust.' + ('puretv' if slug == 'puretv' else slug + 'tv') for slug in LAUNCHERS}
LAUNCHER_PREVIEWS = ('home-render.png', 'apps-render.png', 'home-render.en.png', 'apps-render.en.png', 'add-to-home.png')
STORE_PREVIEWS = ('putrtv-store.png', 'putrtv-store.en.png')


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def source_archive(source_sha, slug, target):
    assert slug in LAUNCHERS
    paths = ['resource/launcher/' + slug, 'resource/launcher/shared', 'LICENSE']
    if slug == 'puretv':
        # Its settings include other app projects, even when only :app is built.
        settings = git('show', source_sha + ':resource/launcher/puretv/settings.gradle').decode()
        dependencies = re.findall(r"project\('(:[^']+)'\)\.projectDir\s*=\s*file\('([^']+)'\)", settings)
        configured = re.findall(r"include\s+'(:[^']+)'", settings)
        assert set(configured) == {':app', *(name for name, _ in dependencies)}, 'Unrecognized settings dependency'
        for _, relative in dependencies:
            path = posixpath.normpath('resource/launcher/puretv/' + relative)
            assert re.fullmatch(r'resource/apps/[a-z0-9-]+', path), 'Unexpected project outside application sources'
            paths.append(path)
    files = git('ls-tree', '-r', '--name-only', source_sha, '--', *paths).decode().splitlines()
    excluded_names = {'resource.json', 'SHA256SUMS.txt', 'source.tar.gz', 'thumb.png', 'apps.png'}
    included = []
    for name in files:
        path = PurePosixPath(name)
        if path.name in excluded_names or path.suffix == '.apk' or 'docs' in path.parts or 'build' in path.parts:
            continue
        # source assets remain included; public recordings and gallery files are not build inputs.
        if any(part in ('qa', 'recordings', 'previews') for part in path.parts):
            continue
        included.append(name)
    assert included
    assert any(name.startswith('resource/launcher/shared/src/main/java/') for name in included), 'Missing shared implementation'
    assert any(name.startswith('resource/launcher/shared/src/test/java/') for name in included), 'Missing shared tests'
    with target.open('wb') as stream:
        subprocess.run(['git', '-C', str(ROOT), 'archive', '--format=tar.gz', source_sha, '--', *included], stdout=stream, check=True)


def export_record_limit(kind, path):
    """Keep accepted paths and bounds identical to the producing CI workflow."""
    parsed = PurePosixPath(path)
    assert path and not parsed.is_absolute() and '..' not in parsed.parts and parsed.as_posix() == path and '\\' not in path
    if path.startswith('reports/'):
        assert parsed.suffix.lower() in ('.xml', '.log', '.png'), 'Unexpected diagnostic format'
        return 4000000
    if kind == 'store':
        prefix = 'release/'
    else:
        assert len(parsed.parts) >= 3 and parsed.parts[1] in LAUNCHERS, 'Unknown launcher export path'
        prefix = 'release/' + parsed.parts[1] + '/'
    assert path.startswith(prefix), 'Unexpected export directory'
    filename = path[len(prefix):]
    if filename in ('metadata.json', 'SHA256SUMS.txt'):
        return 64000
    if re.fullmatch(r'previews/[A-Za-z0-9._-]+\.png', filename):
        return 4000000
    assert re.fullmatch(r'[A-Za-z0-9._-]+\.apk', filename), 'Unexpected release file'
    return 9999999 if kind == 'store' else 5 * 1024 * 1024 - 1


def load_export(run_id, kind):
    assert re.fullmatch(r'\d+', run_id)
    assert kind in ('store', 'launcher')
    workflow = 'putrtv-store' if kind == 'store' else 'launcher-store-integration'
    branch_prefix = 'putrtv-store' if kind == 'store' else 'launcher-store'
    status = json.loads(subprocess.check_output(['gh', 'api', 'repos/ecojust/pureTV/actions/runs/' + run_id]))
    assert status['status'] == 'completed' and status['conclusion'] == 'success', 'CI must fully succeed before publication'
    assert status['repository']['full_name'] == 'ecojust/pureTV' and status['head_repository']['full_name'] == 'ecojust/pureTV'
    assert status['head_branch'] in ('master', 'feat/putrtv-store') and status['event'] in ('push', 'workflow_dispatch')
    assert status['path'] == '.github/workflows/' + workflow + '.yml', 'Unexpected workflow'
    sha = status['head_sha']; assert re.fullmatch(r'[0-9a-f]{40}', sha)
    branch = 'build-assets/' + branch_prefix + '-' + run_id
    ref = 'refs/remotes/origin/' + branch
    git('fetch', 'origin', 'refs/heads/' + branch + ':' + ref)
    assert git('rev-parse', ref + '^').decode().strip() == sha, 'Export must directly descend from exact build source'
    prefix = 'release-staging/' + branch_prefix + '/'
    manifest = json.loads(git('show', ref + ':' + prefix + 'export-metadata.json'))
    assert manifest['sourceSha'] == sha and str(manifest['runId']) == run_id
    assert manifest['buildResult'] == manifest['signResult'] == 'success'
    assert manifest['runUrl'] == status['html_url']
    data = {}; total = 0
    assert isinstance(manifest['files'], list) and manifest['files'], 'Empty export manifest'
    for record in manifest['files']:
        path = record['path']
        assert path not in data, 'Duplicate export entry'
        assert type(record['bytes']) is int and 0 < record['bytes'] <= export_record_limit(kind, path)
        assert re.fullmatch(r'[a-f0-9]{64}', record['sha256'])
        total += record['bytes']; assert total <= (25000000 if kind == 'store' else 100000000)
        content = git('show', ref + ':' + prefix + path)
        assert len(content) == record['bytes'] and hashlib.sha256(content).hexdigest() == record['sha256'], path
        data[path] = content
    return status, manifest, data


def publish(run_id, kind, tools):
    status, manifest, data = load_export(run_id, kind)
    sha = status['head_sha']
    verified = []
    for slug in (('putrtv-store',) if kind == 'store' else LAUNCHERS):
        category = 'apps' if kind == 'store' else 'launcher'
        folder = ROOT / 'resource' / category / slug
        prefix = 'release/' if kind == 'store' else 'release/' + slug + '/'
        info = json.loads(data[prefix + 'metadata.json'])
        assert info['sourceSha'] == sha and info['buildRun'] == status['html_url'] and info['signatureVerified'] is True
        assert info['minSdk'] == (19 if kind == 'store' else 26) and info['targetSdk'] == 29
        assert info['physicalTvTested'] is False and info['previewData'] == 'simulated'
        package = 'com.ecojust.putrtvstore' if kind == 'store' else PACKAGES[slug]
        assert info['packageName'] == package
        gradle_path = 'resource/apps/putrtv-store/build.gradle' if kind == 'store' else 'resource/launcher/' + slug + '/app/build.gradle'
        gradle = git('show', sha + ':' + gradle_path).decode()
        assert info['versionName'] == re.search(r"versionName '([^']+)'", gradle)[1]
        assert info['versionCode'] == int(re.search(r'versionCode (\d+)', gradle)[1])
        assert re.search(r"applicationId '([^']+)'", gradle)[1] == package
        assert info['certificateSha256'] == expected_release_certificate(ROOT, info)
        apk_prefix = 'putrtv-store' if kind == 'store' else 'pureTV' if slug == 'puretv' else slug.capitalize() + 'TV'
        apk_name = apk_prefix + '-' + info['versionName'] + '.apk'
        if kind != 'store':
            assert info['launcher'] == slug and info['apk'] == apk_name
        assert re.fullmatch(r'[A-Za-z0-9._-]+\.apk', apk_name)
        apk_bytes = data[prefix + apk_name]
        assert len(apk_bytes) == info['bytes'] and hashlib.sha256(apk_bytes).hexdigest() == info['sha256']
        assert data[prefix + 'SHA256SUMS.txt'].decode() == info['sha256'] + '  ' + apk_name + '\n'
        previews = {path[len(prefix + 'previews/'):]: value for path, value in data.items() if path.startswith(prefix + 'previews/')}
        assert set(STORE_PREVIEWS if kind == 'store' else LAUNCHER_PREVIEWS) <= previews.keys(), 'Missing native previews'
        for name, content in previews.items():
            assert PurePosixPath(name).name == name and name.endswith('.png')
            _, width, height = validate_png(content)
            # The actual Dialog decor is captured at 600x470; its parent TV is
            # 960x540 or 1280x720. Keep the full-screen minimum for every other view.
            dialog = kind == 'store' and name in ('putrtv-store-detail.png', 'putrtv-store-detail.en.png', 'putrtv-store-detail-1280.png')
            minimum_width, minimum_height = (480, 320) if dialog else (640, 360)
            assert width >= minimum_width and height >= minimum_height and width > height, 'Expected a TV screen or documented dialog preview'
        with tempfile.TemporaryDirectory(prefix='tv-store-verify-') as temporary:
            apk = Path(temporary) / apk_name; apk.write_bytes(apk_bytes)
            actual = apk_info(apk, tools)
            assert all(actual[key] == info[key] for key in actual), slug
            sdk = '19' if kind == 'store' else '26'
            badging = subprocess.check_output([str(tools / 'aapt'), 'dump', 'badging', str(apk)], text=True)
            assert re.search(r"^sdkVersion:'" + sdk + r"'$", badging, re.M)
            assert re.search(r"^targetSdkVersion:'29'$", badging, re.M)
            subprocess.run([str(tools / 'apksigner'), 'verify', '--min-sdk-version', sdk, str(apk)], check=True)
            subprocess.run([str(tools / 'zipalign'), '-c', '4', str(apk)], check=True)
            # Exact source assets, including the offline catalog, must match the signed build.
            asset_root = 'resource/' + category + '/' + slug + ('/src/main/assets' if kind == 'store' else '/app/src/main/assets')
            asset_files = git('ls-tree', '-r', '--name-only', sha, '--', asset_root).decode().splitlines()
            with zipfile.ZipFile(apk) as archive:
                for path in asset_files:
                    assert archive.read('assets/' + path[len(asset_root) + 1:]) == git('show', sha + ':' + path), path
        verified.append((slug, category, folder, info, package, apk_name, apk_bytes, previews, actual, len(asset_files)))
    # Reject a broken later launcher before replacing any earlier resource.
    evidence = ROOT / 'resource/apps/putrtv-store/docs/release-evidence' / run_id
    evidence.mkdir(parents=True, exist_ok=True)
    (evidence / 'export-metadata.json').write_text(json.dumps(manifest, indent=2) + '\n')
    results = []
    for slug, category, folder, info, package, apk_name, apk_bytes, previews, actual, asset_count in verified:
        previous = json.loads((folder / 'resource.json').read_text()) if (folder / 'resource.json').exists() else None
        (folder / apk_name).write_bytes(apk_bytes)
        for name, content in previews.items():
            target = folder / 'docs/previews' / name; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(content)
        home = 'putrtv-store.png' if kind == 'store' else 'home-render.png'
        english = 'putrtv-store.en.png' if kind == 'store' else 'home-render.en.png'
        (folder / 'thumb.png').write_bytes(previews[home])
        if kind != 'store': (folder / 'apps.png').write_bytes(previews['apps-render.png'])
        write_english_previews(ROOT, category, slug, info['versionName'], sha, status['html_url'], previews[english], None if kind == 'store' else previews['apps-render.en.png'])
        resource = dict(previous or {'kind':'app', 'name':'putrtv商城', 'author':'ecojust / 桔子桑', 'description':'直接在电视上浏览、安装应用和检查更新', 'license':'MIT'})
        resource.update(version=info['versionName'], packageName=package, versionCode=info['versionCode'], apk=apk_name,
                        apkBytes=info['bytes'], sha256=info['sha256'], certificateSha256=info['certificateSha256'],
                        supportsLayoutJson=kind != 'store', languages=['zh','en'], cover='thumb.png',
                        coverSource='Real Android UI rendered by Robolectric with fixtures; not a physical TV capture',
                        sourceCommit=sha, buildRun=status['html_url'], releaseChannel='preview' if kind == 'store' else 'stable',
                        verification={'signatureVerified':True, 'sourceAssetsMatchApk':True, 'checkedSourceAssetFiles':asset_count, 'physicalTvTested':False})
        names = [apk_name, 'thumb.png']
        if kind != 'store':
            source_archive(sha, slug, folder / 'source.tar.gz')
            resource.update(sourceArchive='source.tar.gz', sourceArchiveSha256=digest(folder / 'source.tar.gz'),
                            supportsAddToHome=True, upstreamRelease='https://github.com/ecojust/pureTV/tree/master/resource/launcher/' + slug)
            names.extend(['source.tar.gz', 'apps.png', 'layout.example.json', 'layout.example.en.json'])
            if slug == 'puretv': resource['sourceTreeSha'] = launcher_source_tree(ROOT, sha)
        if (folder / 'logo.svg').exists(): names.append('logo.svg')
        (folder / 'resource.json').write_text(json.dumps(resource, ensure_ascii=False, indent=2) + '\n')
        (folder / 'SHA256SUMS.txt').write_text(''.join(digest(folder / name) + '  ' + name + '\n' for name in names))
        if previous and previous['apk'] != apk_name:
            old = folder / previous['apk']; assert old.parent == folder and old.suffix == '.apk'; old.unlink()
        results.append({'slug':slug, 'sourceCommit':sha, 'buildRun':status['html_url'], 'apk':apk_name, **actual})
    (evidence / 'verified-resources.json').write_text(json.dumps(results, indent=2) + '\n')
    print(json.dumps(results, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store-run')
    parser.add_argument('--launcher-run')
    parser.add_argument('--build-tools', type=Path, required=True)
    args = parser.parse_args()
    assert args.store_run or args.launcher_run
    if args.store_run: publish(args.store_run, 'store', args.build_tools)
    if args.launcher_run: publish(args.launcher_run, 'launcher', args.build_tools)


if __name__ == '__main__': main()
