#!/usr/bin/env python3
"""Sign successful CI-built TV apps and publish their matching bilingual previews."""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from resource_catalog import apk_info, digest
from resource_previews import validate_png, write_english_previews

parser = argparse.ArgumentParser()
parser.add_argument('--stage-branch', required=True)
parser.add_argument('--source-sha', required=True)
parser.add_argument('--build-tools', required=True, type=Path)
parser.add_argument('--skip-index', action='store_true', help='Defer resource index regeneration until the batch is complete')
parser.add_argument('--app', action='append', choices=['music', 'shortvideo', 'webtv', 'hifini', 'cctv', 'tank', 'jackal'], help='Update only this app; repeat to select several (default: music, shortvideo, webtv)')
args = parser.parse_args()
if not re.fullmatch(r'build-assets/resources-\d+', args.stage_branch) or not re.fullmatch(r'[a-f0-9]{40}', args.source_sha):
    parser.error('Expected a build-assets/resources-RUN_ID branch and a complete source SHA')
root = Path(__file__).resolve().parents[1]
auth = os.environ.get('PURETV_GITHUB_HEADER')


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def git(*arguments):
    prefix = ['git', '-C', str(root)] + (['-c', 'http.extraHeader=' + auth] if auth else [])
    return subprocess.check_output(prefix + list(arguments))


run_id = args.stage_branch.rsplit('-', 1)[1]
status = json.loads(subprocess.check_output(['gh', 'api'] + (['-H', auth] if auth else []) + [f'repos/ecojust/pureTV/actions/runs/{run_id}']))
require(status['status'] == 'completed' and status['conclusion'] == 'success', 'Resource build must have completed successfully')
require(status['head_sha'] == args.source_sha, 'Resource build does not match the requested source commit')
run_url = f'https://github.com/ecojust/pureTV/actions/runs/{run_id}'
stage_ref = 'refs/remotes/origin/' + args.stage_branch
git('fetch', 'origin', 'refs/heads/' + args.stage_branch + ':' + stage_ref)


def artifact(name):
    return git('show', stage_ref + ':release-staging/' + name)


metadata = json.loads(artifact('release-metadata.json'))['launcher']
require(metadata['sourceSha'] == args.source_sha, 'Staged metadata does not match the requested source commit')
expected = (root / 'tools/puretv-release-certificate.sha256').read_text().strip()
key = os.environ['PURETV_KEYSTORE_PATH']
require(bool(os.environ.get('PURETV_KEYSTORE_PASSWORD')), 'PURETV_KEYSTORE_PASSWORD is required')
apps = [
    ('music', 'Music TV', '原生电视音乐播放器', 'music-tv', 'music-tv', 'com.ecojust.music'),
    ('shortvideo', 'ShortVideo TV', '遥控器短视频播放器', 'shortvideo-tv', 'controls-preview', 'com.ecojust.shortvideo'),
    ('webtv', 'WebTV', '电视直播与 M3U 播放器', 'webtv-controls', 'controls-render', 'com.ecojust.webtv'),
    ('hifini', 'HIFINi TV', '基于 HiFiNi 的电视音乐播放器', 'hifini-tv', 'hifini-tv', 'com.ecojust.hifinitv'),
    ('cctv', 'CCTV Live', '央视官网播放器与电视频道导航', 'cctv-live', 'cctv-live', 'com.ecojust.cctvlive'),
    ('tank', 'Tank TV', '独立重写的 35 关坦克大战，支持手机扫码双人合作', 'tank-tv', 'tank-tv', 'com.ecojust.tanktv'),
    ('jackal', 'Jackal TV', '独立重写的六关吉普车营救游戏，支持手机扫码双人合作', 'jackal-tv', 'jackal-tv', 'com.ecojust.jackaltv'),
]
selected_apps = args.app or ['music', 'shortvideo', 'webtv']
apps = [app for app in apps if app[0] in selected_apps]
with tempfile.TemporaryDirectory(prefix='puretv-app-resources-') as temporary:
    temporary = Path(temporary)
    for slug, name, description, capture, doc_image, package_name in apps:
        folder = root / 'resource/apps' / slug
        require(folder.is_dir(), f'{slug}: missing application source directory')
        resource_path = folder / 'resource.json'
        old_resource = json.loads(resource_path.read_text()) if resource_path.exists() else {}
        old_name = old_resource.get('apk')
        if resource_path.exists():
            require(isinstance(old_name, str) and Path(old_name).name == old_name and '/' not in old_name and '\\' not in old_name and old_name.endswith('.apk'), f'{slug}: invalid previous APK name')
        # Both previews must come from this successful build, never from older docs.
        chinese = validate_png(artifact(capture + '.png'))[0]
        english = validate_png(artifact(capture + '.en.png'))[0]
        unsigned = temporary / (slug + '.apk')
        unsigned.write_bytes(artifact(slug + '.apk'))
        identity = apk_info(unsigned, args.build_tools, allow_unsigned=True)
        require(identity['packageName'] == package_name and not identity['certificateSha256'], f'{slug}: expected the unsigned application artifact')
        gradle = git('show', args.source_sha + ':resource/apps/' + slug + '/build.gradle').decode()
        application_id = re.search(r"applicationId '([^']+)'", gradle)
        require(application_id is not None and application_id[1] == package_name, f'{slug}: source application ID does not match the expected package')
        version = re.search(r"versionName '([^']+)'", gradle)[1]
        code = int(re.search(r'versionCode (\d+)', gradle)[1])
        require(bool(re.fullmatch(r'\d+\.\d+\.\d+(?:-preview\.\d+)?', version)), f'{slug}: invalid application version')
        maximum_bytes = (16 if slug == 'jackal' else 5) * 1024 * 1024
        require(identity['versionName'] == version and identity['versionCode'] == code and 0 < identity['bytes'] < maximum_bytes, f'{slug}: artifact identity or size does not match the source build')
        aligned = temporary / (slug + '-aligned.apk')
        signed = temporary / (slug + '-signed.apk')
        subprocess.run([str(args.build_tools / 'zipalign'), '-f', '4', str(unsigned), str(aligned)], check=True)
        subprocess.run([str(args.build_tools / 'apksigner'), 'sign', '--v4-signing-enabled', 'false', '--ks', key, '--ks-key-alias', 'puretv', '--ks-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--key-pass', 'env:PURETV_KEYSTORE_PASSWORD', '--out', str(signed), str(aligned)], check=True)
        info = apk_info(signed, args.build_tools)
        require(info['certificateSha256'] == expected, f'{slug}: unexpected release signing certificate')
        require(all(info[field] == identity[field] for field in ('packageName', 'versionName', 'versionCode')), f'{slug}: signed application identity changed')
        subprocess.run([str(args.build_tools / 'zipalign'), '-c', '4', str(signed)], check=True)
        apk = folder / (slug + '-' + version + '.apk')
        shutil.copyfile(signed, apk)
        shutil.copyfile(root / 'LICENSE', folder / 'LICENSE')
        docs = folder / 'docs'
        docs.mkdir(exist_ok=True)
        (folder / 'thumb.png').write_bytes(chinese)
        (docs / (doc_image + '.png')).write_bytes(chinese)
        (docs / (doc_image + '.en.png')).write_bytes(english)
        if slug in ('tank', 'jackal'):
            for suffix in ('', '.en'):
                (docs / ('controller' + suffix + '.png')).write_bytes(validate_png(artifact(slug + '-controller' + suffix + '.png'))[0])
        preview_options = {'renderer': 'Chromium', 'provenance': 'Actual bundled game page rendered in Chromium with English locale and a simulated native room bridge; not a physical TV capture.'} if slug in ('tank', 'jackal') else {}
        write_english_previews(root, 'apps', slug, version, args.source_sha, run_url, english, **preview_options)
        resource = {
            'kind': 'app', 'name': name, 'author': 'ecojust / 桔子桑', 'description': description,
            'version': info['versionName'], 'packageName': info['packageName'], 'versionCode': info['versionCode'],
            'apk': apk.name, 'apkBytes': info['bytes'], 'sha256': info['sha256'], 'certificateSha256': info['certificateSha256'],
            'supportsLayoutJson': False, 'languages': ['zh', 'en'], 'cover': 'thumb.png',
            'coverSource': ('Actual bundled game page rendered in Chromium with Chinese locale and a simulated native room bridge; not a physical TV capture' if slug in ('tank', 'jackal') else 'Real Android idle UI rendered in Chinese by Robolectric native graphics with the bundled M3U catalog; not a physical TV capture' if slug == 'cctv' else 'Real Android UI rendered in Chinese by Robolectric native graphics with fixture content; not a physical TV capture'),
            'license': old_resource.get('license', 'MIT'), 'sourceCommit': args.source_sha, 'buildRun': run_url,
        }
        if old_resource.get('assetNotices'):
            resource['assetNotices'] = old_resource['assetNotices']
        if '-preview.' in version:
            resource['releaseChannel'] = 'preview'
        if slug in ('tank', 'jackal'):
            resource['romIncluded'] = False
        resource_path.write_text(json.dumps(resource, ensure_ascii=False, indent=2) + '\n')
        checksums = [apk.name, 'thumb.png', 'docs/' + doc_image + '.png', 'docs/' + doc_image + '.en.png']
        logo = folder / 'logo.svg'
        has_logo = logo.is_file() and not logo.is_symlink()
        if has_logo:
            checksums.append('logo.svg')
        if slug in ('tank', 'jackal'):
            checksums += ['docs/controller.png', 'docs/controller.en.png']
        (folder / 'SHA256SUMS.txt').write_text(''.join(f'{digest(folder / filename)}  {filename}\n' for filename in checksums))
        readme = folder / 'README.md'
        readme_text = readme.read_text() if readme.exists() else '# ' + name + '\n'
        heading, _, rest = readme_text.partition('\n')
        rest = re.sub(r'\n*<!-- apk-resource:start -->.*?<!-- apk-resource:end -->\n*', '\n', rest, flags=re.S)
        logo_link = ' · [64×64 SVG 图标](logo.svg)' if has_logo else ''
        readme.write_text(heading + '\n\n<!-- apk-resource:start -->\n[下载 APK](' + apk.name + '?raw=1) · [校验值](SHA256SUMS.txt) · [签名及构建来源](resource.json) · [源码](src/)' + logo_link + '\n\n此目录内 APK 使用 pureTV 发布证书签名。若设备中存在使用旧证书的同包应用，Android 无法直接覆盖安装；需先备份数据并卸载旧包。\n<!-- apk-resource:end -->\n' + rest)
        english_readme = folder / 'README.en.md'
        if english_readme.exists():
            english_text = english_readme.read_text()
            logo_link_en = ' · [64×64 SVG icon](logo.svg)' if has_logo else ''
            block = ('<!-- apk-resource:start -->\n[Download APK](' + apk.name + '?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/)' + logo_link_en + '\n\n'
                     'The APK in this directory is signed with the pureTV release certificate. Android cannot update an existing installation of the same package if it uses a different signing certificate. Back up its data and uninstall the old package first.\n<!-- apk-resource:end -->')
            if '<!-- apk-resource:start -->' in english_text:
                english_text = re.sub(r'<!-- apk-resource:start -->.*?<!-- apk-resource:end -->', lambda _: block, english_text, flags=re.S)
            else:
                english_heading, english_rest = english_text.split('\n', 1)
                english_text = english_heading + '\n\n' + block + '\n' + english_rest
            english_readme.write_text(english_text)
        if old_name is not None and old_name != apk.name:
            (folder / old_name).unlink(missing_ok=True)
        print(json.dumps({'app': name, 'apk': str(apk.relative_to(root)), 'bytes': info['bytes'], 'verified': True, 'previews': ['zh', 'en']}))
if not args.skip_index:
    subprocess.run([sys.executable, str(root / 'tools/update-resource-index.py')], cwd=root, check=True)
