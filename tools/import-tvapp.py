#!/usr/bin/env python3
"""Arrange a pinned, verified TVAPP snapshot without modifying APK bytes."""
import argparse
import collections
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
from urllib.parse import quote

CATEGORIES = {'media': '影音', 'game': '游戏', 'education': '教育', 'tools': '工具', 'fitness': '健身'}
DESCRIPTIONS = {
    'bbll': '哔哩哔哩视频第三方电视客户端。',
    'myyy': '面向电视的音乐播放应用。',
    'bilibili-tv': '上游收录的哔哩哔哩电视客户端变体。',
    'xiqu-duoduo': '戏曲、曲艺等内容播放应用。',
    'fantaiying': '电视影视播放应用。',
    'vstv': '电视直播应用，保留上游 ARM 与 x86_64 命名变体。',
    'vstv-harmony': 'VsTV 的 HarmonyOS 命名变体，桌面名称为 Z视介，使用独立包名。',
    'webviewtv': '使用网页播放源的电视直播客户端。',
    'my-tv': '我的電視·〇，电视直播客户端。',
    'qianxun-tv': '千寻电视直播应用。',
    'kuandai-tv': '宽带电视直播应用。',
    'huan-assistant': '电视应用管理辅助工具。',
    'tv-screen-master': '电视屏幕测试工具。',
    'fittime-tv': '电视健身训练应用。',
}


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def arrange(args):
    output = args.output.resolve()
    inventory = read(args.inventory / 'inventory.json')
    audit = read(args.audit / 'summary.json')
    assert inventory['commit'] == audit['revision']
    source = {'repository': inventory['repository'], 'commit': inventory['commit'],
              'thresholdExclusiveBytes': inventory['thresholdExclusiveBytes'],
              'sourceApkCount': inventory['apkCount']}
    (output / 'upstream').mkdir(parents=True, exist_ok=True)
    (output / 'verification').mkdir(exist_ok=True)
    for name in ['tree.json', 'commit.json', 'inventory.json', 'candidates-raw.json', 'README.md', 'LICENSE', 'VsTV-README.md']:
        incoming, target = args.inventory / name, output / 'upstream' / name
        if incoming.resolve() != target.resolve():
            shutil.copyfile(incoming, target)
    by_path = {r['sourcePath']: r for r in audit['records']}
    assert set(by_path) == {c['upstreamPath'] for c in inventory['candidates']}
    groups = collections.defaultdict(list)
    for candidate in inventory['candidates']:
        group = candidate['suggestedGroup']
        if candidate['upstreamPath'].endswith('-HarmonyOS.apk'):
            group = 'vstv-harmony'
        assert candidate['category'] in CATEGORIES and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', group)
        assert group in DESCRIPTIONS
        assert not Path(candidate['upstreamPath']).is_absolute() and '..' not in Path(candidate['upstreamPath']).parts
        assert '\n' not in candidate['upstreamPath'] and '\r' not in candidate['upstreamPath']
        groups[(candidate['category'], group)].append((candidate, by_path[candidate['upstreamPath']]))
    # Validate the entire incoming batch before moving any original file.
    for (category, group), pairs in groups.items():
        assert len({r['packageName'] for _, r in pairs}) == 1
        assert len({Path(c['upstreamPath']).name for c, _ in pairs}) == len(pairs)
        for candidate, record in pairs:
            blob = candidate['gitBlobSha']
            assert re.fullmatch(r'[0-9a-f]{40}', blob)
            assert record['signatureVerified'] and record['zipCrcVerified'] and record['badgingExitCode'] == 0
            target = output / category / group / Path(candidate['upstreamPath']).name
            incoming = target if target.exists() else args.apks / (blob + '.apk')
            data = incoming.read_bytes()
            assert 0 < len(data) == candidate['bytes'] == record['bytes'] < source['thresholdExclusiveBytes']
            assert hashlib.sha256(data).hexdigest() == record['sha256']
            assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == blob
    apps, batch = [], []
    for (category, group), pairs in sorted(groups.items()):
        folder = output / category / group
        folder.mkdir(parents=True, exist_ok=True)
        packages = []
        # A representative cover is not an assertion of the newest or safest build.
        pairs.sort(key=lambda pair: (int(pair[1]['versionCode']), pair[0]['upstreamPath']), reverse=True)
        representative = next((pair for pair in pairs if '老版本' not in pair[0]['upstreamPath']), pairs[0])
        name = {'vstv-harmony': 'VsTV · HarmonyOS', 'fittime-tv': 'Fittime TV'}.get(group, representative[0]['suggestedDisplayName'])
        for candidate, record in pairs:
            assert record['signatureVerified'] and record['zipCrcVerified']
            blob = candidate['gitBlobSha']
            target = folder / Path(candidate['upstreamPath']).name
            incoming = args.apks / (blob + '.apk')
            if target.exists():
                assert digest(target) == record['sha256'], f'Refusing to overwrite {target}'
            elif args.move:
                incoming.rename(target)
            else:
                shutil.copyfile(incoming, target)
            assert target.stat().st_size == candidate['bytes'] < source['thresholdExclusiveBytes']
            assert digest(target) == record['sha256']
            assert hashlib.sha1(b'blob ' + str(target.stat().st_size).encode() + b'\0' + target.read_bytes()).hexdigest() == blob
            evidence = output / 'verification' / 'apks' / blob
            evidence.mkdir(parents=True, exist_ok=True)
            for item in ['badging.stdout.txt', 'badging.stderr.txt', 'signature.stdout.txt', 'signature.stderr.txt']:
                shutil.copyfile(args.audit / blob / item, evidence / item)
            relative = '../../verification/apks/' + blob + '/'
            package = {
                'file': target.name, 'bytes': record['bytes'], 'sha256': record['sha256'],
                'gitBlobSha': blob, 'sourcePath': candidate['upstreamPath'],
                'sourceUrl': candidate['sourceUrl'], 'downloadUrl': candidate['downloadUrl'],
                'packageName': record['packageName'], 'label': record['labels'].get('zh-CN', record['labels'].get('')),
                'versionName': record['versionName'], 'versionCode': int(record['versionCode']),
                'minSdk': record['minSdk'], 'targetSdk': record['targetSdk'],
                'nativeCode': record['nativeAbis'], 'permissions': record['permissions'],
                'zipCrcVerified': True,
                'signature': {'verified': True, 'schemes': record['signatureSchemes'],
                              'certificates': record['certificates'],
                              'stdout': relative + 'signature.stdout.txt', 'stderr': relative + 'signature.stderr.txt'},
                'badging': {'stdout': relative + 'badging.stdout.txt', 'stderr': relative + 'badging.stderr.txt'},
            }
            packages.append(package)
        warnings = []
        certificates = {tuple(c['sha256'] for c in p['signature']['certificates']) for p in packages}
        if len(certificates) > 1:
            warnings.append('同包名的收录版本使用不同签名，不能作为同一签名链直接覆盖升级。')
        if len({p['versionCode'] for p in packages}) < len(packages):
            warnings.append('部分文件的 versionCode 相同，文件名变体和版本名不代表可自动判定升级顺序。')
        if group == 'xiqu-duoduo':
            warnings.append('上游“老版本免费版”的内部版本为9.9.9/code9999；保留真实元数据，不把此数值解释为官方最新版本。')
        if group.startswith('vstv'):
            warnings.append('上游架构命名仅保留为文件名；APK实际同时含arm64-v8a、armeabi-v7a和x86_64库，以nativeCode为准。')
        manifest = {'schemaVersion': 1, 'id': group, 'name': name, 'category': category,
                    'description': DESCRIPTIONS[group], 'provider': None,
                    'providerNote': '上游未提供可核实的原作者信息；仓库维护者仅记入来源。',
                    'source': source, 'representativeApk': Path(representative[0]['upstreamPath']).name,
                    'packages': packages, 'notes': warnings,
                    'licenseNote': 'APK及原图标版权归各原作者；上游仓库Apache-2.0不等于各APK获得该许可。见../../NOTICE.md。',
                    'physicalTvTested': False, 'apkExecuted': False}
        write(folder / 'manifest.json', manifest)
        apps.append({'id': group, 'name': name, 'category': category, 'path': f'{category}/{group}',
                     'manifest': f'{category}/{group}/manifest.json', 'apkCount': len(packages)})
        rep = representative[1]
        batch.append({'appDir': str(folder), 'apk': str(folder / manifest['representativeApk']),
                      'name': name, 'category': category, 'version': rep['versionName'], 'bytes': rep['bytes'],
                      'badgingFile': str(output / 'verification/apks' / rep['blobSha1'] / 'badging.stdout.txt')})
    categories = [{'id': key, 'name': value, 'appCount': sum(a['category'] == key for a in apps),
                   'apkCount': sum(a['apkCount'] for a in apps if a['category'] == key)} for key, value in CATEGORIES.items()]
    write(output / 'catalog.json', {'schemaVersion': 1, 'source': source, 'appCount': len(apps),
                                  'apkCount': len(by_path), 'apkBytes': audit['apkBytes'],
                                  'categories': categories, 'apps': apps})
    write(args.batch_output, batch)
    print(f'Arranged {len(by_path)} APKs in {len(apps)} app directories; assets batch: {args.batch_output}')


def grid(apps, prefix=''):
    rows = []
    for offset in range(0, len(apps), 4):
        cells = []
        for app in apps[offset:offset + 4]:
            path = prefix + app['path'] + '/'
            cells.append(f'<td width="25%" align="center"><a href="{path}"><img src="{path}thumb.png" width="240" alt="{html.escape(app["name"])}"><br>{html.escape(app["name"])}</a></td>')
        cells.extend('<td width="25%"></td>' for _ in range(4 - len(cells)))
        rows.append('<tr>' + ''.join(cells) + '</tr>')
    return '<table>\n' + '\n'.join(rows) + '\n</table>\n'


def finalize(output):
    catalog = read(output / 'catalog.json')
    for app in catalog['apps']:
        folder = output / app['path']
        manifest = read(folder / 'manifest.json')
        manifest['assets'] = read(folder / 'assets.json')
        write(folder / 'manifest.json', manifest)
        rows = []
        for p in manifest['packages']:
            rows.append(f"| [{p['file']}]({quote(p['file'])}?raw=1) | {p['versionName']} / {p['versionCode']} | {p['bytes']:,} | {p['minSdk']} |")
        notes = '\n'.join('- ' + n for n in manifest['notes'])
        body = f'''# {app['name']}

{manifest['description']}

![应用介绍封面，非运行截图](thumb.png)

分类：{CATEGORIES[app['category']]}。原作者信息：上游未提供，manifest的provider保留为null。

| APK下载（上游原文件名） | 实际版本 / versionCode | 字节数 | 最低SDK |
| --- | --- | ---: | ---: |
{chr(10).join(rows)}

每份APK均保留原始二进制与签名，通过上游Git blob、SHA256、ZIP CRC及apksigner校验。未在实体电视运行；最低SDK来自APK声明，不表示已验证所有设备兼容性。

{notes}

[完整元数据](manifest.json) · [资源生成来源](assets.json) · [64×64 SVG](logo.svg) · [校验清单](SHA256SUMS.txt)

图标来源和转换方式见assets.json；thumb是生成的应用介绍封面，不是应用运行截图。

来源：[youhunwl/TVAPP](https://github.com/youhunwl/TVAPP/tree/{catalog['source']['commit']})。每份APK的固定提交原路径、真实包名/版本/架构、证书SHA256及校验输出均在manifest中记录。APK和原图标权利归原作者；详见[来源与许可说明](../../NOTICE.md)。

[返回分类](../README.md) · [全部收录](../../README.md)
'''
        (folder / 'README.md').write_text(body, encoding='utf-8')
        files = sorted(p for p in folder.iterdir() if p.is_file() and p.name != 'SHA256SUMS.txt')
        (folder / 'SHA256SUMS.txt').write_text(''.join(f'{digest(p)}  {p.name}\n' for p in files), encoding='utf-8')
    sections = []
    for category in catalog['categories']:
        members = [a for a in catalog['apps'] if a['category'] == category['id']]
        heading = f"{category['name']} / {category['id']}（{category['appCount']}款 / {category['apkCount']}个APK）"
        if members:
            content = grid(members)
        elif category['id'] == 'game':
            content = '上游3个游戏APK均超过限制，最小为24,678,211字节，本次不收录。\n'
        else:
            content = '上游8个教育APK均超过限制，最小为14,096,805字节，本次不收录。\n'
        sections.append('## ' + heading + '\n\n' + content)
        folder = output / category['id']
        folder.mkdir(exist_ok=True)
        (folder / 'README.md').write_text('# ' + heading + '\n\n' + (grid(members, '../') if members else content) + '\n[返回收录目录](../README.md)\n', encoding='utf-8')
    text = f'''# TVAPP 小体积应用收录

从 [youhunwl/TVAPP](https://github.com/youhunwl/TVAPP) 的固定提交 [`{catalog['source']['commit'][:8]}`](https://github.com/youhunwl/TVAPP/tree/{catalog['source']['commit']}) 收录全部严格小于 **10,000,000字节** 的APK：**{catalog['appCount']}款应用（按包名分组），{catalog['apkCount']}个APK，共{catalog['apkBytes']:,}字节**。不同版本和架构命名变体均保留；筛选针对该提交实际存放的APK，不含历史已删除文件或外链仓库。

每款应用提供原APK、`logo.svg`、原图标（可提取时）、`thumb.png`、`manifest.json`、`assets.json`、README和SHA256清单。下方封面均为生成的介绍卡，不是运行截图。署名没有可靠依据时provider为null，未把收集者当作应用作者。

[机器目录](catalog.json) · [超限应用与复刻清单](OVERSIZED.md) · [完整性校验](verification/report.json) · [来源与许可](NOTICE.md) · [维护说明](MAINTENANCE.md)

本目录为独立第三方归档，尚未接入Gitee APK市场或电视商城。原APK未改签、未执行；包签名验证只证明完整性，不代表原开发者身份或内容安全。戏曲多多两版签名不同，详见对应目录。

''' + '\n'.join(sections)
    (output / 'README.md').write_text(text, encoding='utf-8')
    selected = sorted([p for p in output.rglob('*.apk')] + [output / a['path'] / 'SHA256SUMS.txt' for a in catalog['apps']])
    (output / 'SHA256SUMS.txt').write_text(''.join(f'{digest(p)}  {p.relative_to(output).as_posix()}\n' for p in selected), encoding='utf-8')
    print(f'Finalized metadata, readmes and checksums for {len(catalog["apps"])} apps.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('fork'))
    parser.add_argument('--inventory', type=Path)
    parser.add_argument('--audit', type=Path)
    parser.add_argument('--apks', type=Path)
    parser.add_argument('--batch-output', type=Path)
    parser.add_argument('--move', action='store_true', help='Move verified staging APKs instead of copying them.')
    parser.add_argument('--finalize', action='store_true', help='Merge generated assets and write documentation/checksums.')
    args = parser.parse_args()
    if args.finalize:
        finalize(args.output.resolve())
    else:
        if not all([args.inventory, args.audit, args.apks, args.batch_output]):
            parser.error('Import requires --inventory, --audit, --apks and --batch-output.')
        arrange(args)


if __name__ == '__main__':
    main()
