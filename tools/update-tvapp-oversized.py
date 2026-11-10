#!/usr/bin/env python3
"""Generate the oversized TVAPP inventory and implementation planning documents."""
import argparse
import collections
import csv
import hashlib
import io
import json
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {'media': '影音', 'game': '游戏', 'education': '教育', 'tools': '工具', 'fitness': '健身'}
LIMIT = 10_000_000


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def md(value):
    return str(value).replace('|', r'\|').replace('\n', ' ').replace('[', r'\[').replace(']', r'\]')


def hints(path):
    name = Path(path).name
    system_pattern = re.compile(r'(?:不支持|兼容|支持|适用于)?(?:Android|安卓)\s*\d+(?:\.[\dx]+)*(?:[-—~至]\d+(?:\.\d+)*)?(?:以上|以下|专版|版本|系统)?', re.I)
    systems = list(dict.fromkeys(system_pattern.findall(name)))
    version_text = system_pattern.sub('', name)
    # A revision followed by its Git hash (BV) is not another dotted version.
    version_text = re.sub(r'\br\d+\.[0-9a-f]+\b', '', version_text, flags=re.I)
    versions = list(dict.fromkeys(re.findall(r'(?<!\d)(\d+(?:\.\d+){1,5})(?!\d)', version_text)))
    builds = list(dict.fromkeys(re.findall(r'(?<!\d)(20\d{6}(?:[-_]\d{4})?)(?!\d)', name)))
    variants = list(dict.fromkeys(re.findall(r'32位|64位|arm32|arm64|armeabi(?:-v7a)?|x86_64|x86|v7a|v8a|java(?:32|64)?|python(?:32|64)?|手机|电视|TV|平板|mobile|leanback|tablet|universal|模拟器|海信|小米', name, re.I)))
    return {'versionHints': versions, 'buildHints': builds, 'variantHints': variants, 'systemHints': systems,
            'hintsBasis': 'upstream-filename-only'}


def build():
    fork = ROOT / 'fork'
    tree = read(fork / 'upstream/tree.json')
    commit = read(fork / 'upstream/commit.json')
    archive = read(fork / 'catalog.json')
    notes_file = fork / 'planning/app-notes.json'
    groups = read(notes_file)
    revision = archive['source']['commit']
    assert commit['sha'] == revision and tree['sha'] in (revision, commit['commit']['tree']['sha'])
    assert tree['truncated'] is False
    apks = {x['path']: x for x in tree['tree'] if x['type'] == 'blob' and x['path'].lower().endswith('.apk')}
    expected = {path: x for path, x in apks.items() if x['size'] > LIMIT}
    boundary = [path for path, x in apks.items() if x['size'] == LIMIT]
    readme = (fork / 'upstream/README.md').read_text(encoding='utf-8').splitlines()
    imported = {}
    for item in archive['apps']:
        manifest = read(fork / item['manifest'])
        assert manifest['source']['commit'] == revision
        for package in manifest['packages']:
            path = package['sourcePath']
            assert path in apks and path not in imported
            assert package['bytes'] == apks[path]['size'] and package['gitBlobSha'] == apks[path]['sha']
            imported[path] = {'package': package, 'archivePath': f"{item['path']}/{package['file']}",
                              'manifestPath': item['manifest']}
            assert (fork / imported[path]['archivePath']).is_file()
            assert (fork / imported[path]['archivePath']).stat().st_size == package['bytes']
    # Oversized files remain in this inventory even when explicitly selected later.
    # Keep the original full snapshot coverage while reporting current archive state.
    small = {path for path, item in apks.items() if item['size'] < LIMIT}
    assert small <= set(imported)
    assert set(apks) == set(imported) | set(expected) | set(boundary)
    imported_oversized = set(imported) & set(expected)
    seen, ids, applications, files = set(), set(), [], []
    blob_paths = collections.defaultdict(list)
    for path, item in expected.items():
        blob_paths[item['sha']].append(path)
    for group in groups:
        key = group['id']
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', key) and key not in ids
        ids.add(key)
        assert group['category'] in CATEGORIES and group['difficulty'] in ('低', '中', '高')
        assert group['priority'] in ('P1', 'P2', 'P3')
        assert group['descriptionBasis'] in ('upstream-readme', 'filename-inference')
        assert group['paths'] and 2 <= len(group['mvp']) <= 5
        evidence = group['evidence']
        if group['descriptionBasis'] == 'upstream-readme':
            assert evidence, key
        for entry in evidence:
            assert entry['path'] == 'fork/upstream/README.md' and 1 <= entry['line'] <= len(readme)
        records = []
        for path in sorted(group['paths']):
            assert path in expected and path not in seen, path
            seen.add(path)
            item = expected[path]
            archived = imported.get(path)
            package = archived['package'] if archived else None
            record = {'appId': key, 'appName': group['name'], 'category': group['category'],
                      'subcategory': group['subcategory'], 'path': path, 'fileName': Path(path).name,
                      'bytes': item['size'], 'sizeMB': round(item['size'] / 1_000_000, 3),
                      'upstreamGitBlobSha': item['sha'], 'sourceCommit': revision,
                      'sourceUrl': f'https://github.com/youhunwl/TVAPP/blob/{revision}/' + quote(path, safe='/'),
                      'downloadUrl': f'https://raw.githubusercontent.com/youhunwl/TVAPP/{revision}/' + quote(path, safe='/'),
                      **hints(path), 'sameBlobPaths': [p for p in blob_paths[item['sha']] if p != path],
                      'archiveStatus': 'archived' if archived else 'not-archived',
                      'archivePath': archived['archivePath'] if archived else None,
                      'manifestPath': archived['manifestPath'] if archived else None,
                      'downloaded': bool(archived),
                      'apkMetadataVerified': bool(package and package.get('badging') and package.get('signature', {}).get('verified')),
                      'packageName': package['packageName'] if package else None,
                      'minSdk': package['minSdk'] if package else None,
                      'signatureSha256': [c['sha256'] for c in package['signature']['certificates']] if package else None}
            records.append(record)
            files.append(record)
        red_flags = [{'line': e['line'], 'status': '🔴', 'basis': 'upstream-readme-snapshot'}
                     for e in evidence if '🔴' in readme[e['line'] - 1]]
        applications.append({**group, 'apkCount': len(records),
                             'archivedApkCount': sum(p['downloaded'] for p in records),
                             'uniqueBlobCount': len({p['upstreamGitBlobSha'] for p in records}),
                             'minBytes': min(p['bytes'] for p in records), 'maxBytes': max(p['bytes'] for p in records),
                             'upstreamStatusFlags': red_flags, 'developmentStatus': '未开始',
                             'groupingBasis': 'upstream-names-and-descriptions-not-verified-package-identity'})
    assert seen == set(expected), f'Missing paths: {sorted(set(expected)-seen)}'
    applications.sort(key=lambda a: (list(CATEGORIES).index(a['category']), a['subcategory'], a['id']))
    files.sort(key=lambda f: (list(CATEGORIES).index(f['category']), f['appId'], f['path']))
    stats = {'upstreamApkPaths': len(apks), 'importedApkPaths': len(imported), 'oversizedApkPaths': len(files),
             'importedSmallApkPaths': len(small), 'importedOversizedApkPaths': len(imported_oversized),
             'uncollectedOversizedApkPaths': len(expected) - len(imported_oversized),
             'uniqueOversizedBlobs': len(blob_paths), 'duplicatePathSurplus': len(files) - len(blob_paths),
             'referenceFamilies': len(applications), 'totalBytesIncludingDuplicatePaths': sum(p['bytes'] for p in files),
             'exactlyAtThresholdPaths': boundary,
             'categories': [{'id': category, 'name': name,
                             'families': sum(a['category'] == category for a in applications),
                             'apkPaths': sum(f['category'] == category for f in files)} for category, name in CATEGORIES.items()]}
    source = {'repository': 'https://github.com/youhunwl/TVAPP', 'commit': revision,
              'thresholdBytes': LIMIT, 'selection': 'bytes > thresholdBytes',
              'treeSha256': hashlib.sha256((fork / 'upstream/tree.json').read_bytes()).hexdigest(),
              'notesSha256': hashlib.sha256(notes_file.read_bytes()).hexdigest()}
    result = {'schemaVersion': 1, 'source': source, 'statistics': stats, 'applications': applications, 'files': files,
              'scope': 'Current pinned tree only; historical files and external repositories are excluded.',
              'assessmentStatus': 'Functional scope, priorities and size approaches are planning suggestions, not implemented or measured outcomes.',
              'largeApksDownloaded': bool(imported_oversized), 'physicalTvTested': False}
    overview = [f'''# 超过10 MB的应用清单与收录状态

与归档目录使用同一上游快照：[`{revision[:8]}`](https://github.com/youhunwl/TVAPP/tree/{revision})。{len(apks)}个APK文件包含{len(small)}个小包和 **{len(files)}个超限文件 / {len(blob_paths)}份不同Git blob内容**，按名称和用途整理为 **{len(applications)}个参考家族**。超限文件中 **{len(imported_oversized)}个已按用户指定收录，{len(expected)-len(imported_oversized)}个尚未收录**；本页保留全部{len(files)}条原始记录。超限文件总大小 **{stats['totalBytesIncludingDuplicatePaths']:,}字节（约{stats['totalBytesIncludingDuplicatePaths']/1_000_000_000:.2f} GB，含重复文件）**。

阈值按10,000,000字节计算；本快照没有刚好等于阈值的APK。本清单保留全部版本、手机/电视变体及同内容别名，家族数不代表已经核验的包名数量。

[全部{len(files)}个APK明细](planning/oversized-apks.md) · [逐应用复刻参考](planning/replication-notes.md) · [JSON](planning/oversized.json) · [CSV](planning/oversized.csv) · [已收录应用](README.md)

大小和Git blob来自固定目录树；用途来自上游说明或明确标注的名称推断。版本、架构、系统支持列保留文件名线索；已收录条目的实际包名、签名和minSDK见对应manifest及JSON，其他条目尚未下载核验。所有条目均未在实体电视运行，服务可用性仍待核实。下列优先级、难度、首版范围和包体建议是开发评估，当前所有复刻项目均未开始，收录原包不代表完成复刻。

## 怎么选第一批

先选择功能闭环明确、内容可自行提供的方向：电视文件管理/局域网传文件、应用安装管理、训练计时与自有课程播放、儿童本地内容播放。影音类可先做一个共用播放器和收藏/历史框架，再针对直播、音乐、戏曲扩展。

K歌依赖伴奏和歌词，教育/健身依赖课程，聚合直播依赖服务接口；界面相似不等于这些能力已具备。游戏三项主要是游戏集合或模拟器平台，首版可从本地游戏库和手柄导航开始，再单独评估模拟核心。复刻以独立实现功能为目标，使用自己的名称、界面与素材。

P1：优先验证轻量核心功能；P2：需要先确认内容/接口或较多功能；P3：多平台接口、脚本/模拟器/解码能力等依赖较重。难度针对表中建议首版，不代表完整替代原产品的难度；小于10 MB仍需实际构建测量。

可优先复用本仓库已有能力：

| 方向 | 建议起点 | 已有基础 |
| --- | --- | --- |
| 应用管理 / 局域网传APK | [应用管家](planning/replication-notes.md#app-housekeeper)、[野草助手](planning/replication-notes.md#wild-grass-assistant) | [putrtv商城](../resource/apps/putrtv-store/)已有安装流程，可评估复用其校验和遥控器交互。 |
| 原创儿童练习 | [宝宝趣学类功能](planning/replication-notes.md#baby-fun-learning) | [Game Kit](../resource/game-kit/README.md)已有输入和关卡机制，可用于新的数字、颜色、图形练习。 |
| 哔哩哔哩客户端功能 | [BV](planning/replication-notes.md#bv)、[上游BiliTV](planning/replication-notes.md#bili-tv-upstream) | [现有哔哩哔哩应用](../resource/apps/bilibili/)已有搜索、登录和播放实现，可先评估完善；与上游同名软件不推定同源。 |

同类K歌产品可共用一个轻量点歌和播放内核；17个品牌条目不必对应17个新项目。上述方向尚未开工，复用也需要逐项验证。
''']
    summary_rows = ['| 分类 | 参考家族 | APK文件 |', '| --- | ---: | ---: |']
    summary_rows += [f"| {row['name']} / {row['id']} | {row['families']} | {row['apkPaths']} |" for row in stats['categories']]
    overview.append('\n'.join(summary_rows))
    details = ['# 逐应用复刻参考\n\n[返回总清单](../OVERSIZED.md) · [全部APK明细](oversized-apks.md)\n\n每条用途说明与开发建议分开记录。开发状态均为“未开始”；本页不表示已完成复刻、已实现相同服务或已验证小于10 MB。\n']
    package_md = [f'# 超限APK完整明细\n\n[返回总清单](../OVERSIZED.md) · [JSON](oversized.json) · [CSV](oversized.csv)\n\n保留全部{len(files)}个源文件路径，其中{len(imported_oversized)}个已收录、{len(expected)-len(imported_oversized)}个尚未收录。版本/构建/设备/系统列均为**文件名线索**，不是解包验证结果；已收录条目的真实包信息见收录目录manifest。大小采用十进制MB；上游链接固定到源提交。Git blob相同的文件是内容别名，不能据不同文件名重复计算开发项目。\n']
    for category, label in CATEGORIES.items():
        selected = [a for a in applications if a['category'] == category]
        overview += [f'## {label} / {category}（{len(selected)}个家族）',
                     '| 应用/系列 | APK数 | 大小范围 MB | 用途与定位 | 优先 / 首版难度 | 收录状态 |',
                     '| --- | ---: | ---: | --- | --- | --- |']
        for app in selected:
            key = app['id']
            sizes = f"{app['minBytes']/1_000_000:.2f}" if app['minBytes'] == app['maxBytes'] else f"{app['minBytes']/1_000_000:.2f}–{app['maxBytes']/1_000_000:.2f}"
            inferred = '（名称推断）' if app['descriptionBasis'] == 'filename-inference' else ''
            red = ' 上游标红，状态待核实。' if app['upstreamStatusFlags'] else ''
            archive_status = f"{app['archivedApkCount']}/{app['apkCount']}个APK已收录" if app['archivedApkCount'] else '尚未收录'
            overview.append(f"| [{md(app['name'])}](planning/replication-notes.md#{key}) | {app['apkCount']} | {sizes} | {md(app['description'])}{inferred}{red} | {app['priority']} / {app['difficulty']} | {archive_status} |")
            evidence_links = '、'.join(f"[上游README第{e['line']}行](https://github.com/youhunwl/TVAPP/blob/{revision}/README.md#L{e['line']})" for e in app['evidence']) or '仅依据文件名和上游目录，功能细节待确认。'
            details += [f'## {key}', f"**{app['name']}** · {label} / {app['subcategory']} · {app['apkCount']}个APK · {sizes} MB · {app['priority']} / 首版难度{app['difficulty']} · 复刻未开始 · {archive_status}",
                        f"用途：{app['description']}{inferred}\n\n依据：{evidence_links}", '**建议首版范围**\n\n' + '\n'.join('- ' + x for x in app['mvp']),
                        '**主要依赖 / 待确认**\n\n' + '\n'.join('- ' + x for x in app['dependencies']), f"**小于10 MB的实现方向（待构建验证）：** {app['sizeApproach']}"]
            if app['notes']:
                details += ['**补充信息**\n\n' + '\n'.join('- ' + x for x in app['notes'])]
            if app['upstreamStatusFlags']:
                details += ['上游快照README对此系列含🔴标记，实际服务状态需要重新确认。']
            details += [f'[查看全部版本和原包链接](oversized-apks.md#{key})\n']
            package_md += [f'## {key}', f"**{app['name']}** · {label} / {app['subcategory']} · [复刻参考](replication-notes.md#{key})",
                           '| 上游APK原路径 / 链接 | 文件名版本 / 构建线索 | 字节数（MB） | 终端 / 架构 / 系统线索 | 同内容别名 | 收录状态 |',
                           '| --- | --- | ---: | --- | --- | --- |']
            for file in (f for f in files if f['appId'] == key):
                version = ' / '.join(file['versionHints'] + file['buildHints']) or '未标明'
                variant = '、'.join(file['variantHints'] + file['systemHints']) or '未标明'
                duplicate = '；'.join(file['sameBlobPaths']) or '—'
                archive_link = f"[已收录](../{quote(str(Path(file['manifestPath']).parent), safe='/')}/)" if file['downloaded'] else '尚未收录'
                package_md.append(f"| [{md(file['path'])}]({file['sourceUrl']}) | {md(version)} | {file['bytes']:,}（{file['sizeMB']:.3f}） | {md(variant)} | {md(duplicate)} | {archive_link} |")
    duplicate_groups = [paths for paths in blob_paths.values() if len(paths) > 1]
    overview += ['## 同内容文件与已收录小版本',
                 f'共有{len(duplicate_groups)}组Git blob完全相同的别名文件，逐文件表已互相标出。和音元与爱唱KTV的两份文件内容相同，已合为一个参考家族。',
                 'VsTV的ARM/x86_64/HarmonyOS小包已在[收录目录](media/vstv/)与[HarmonyOS目录](media/vstv-harmony/)；本清单只补充较大的arm-av3a变体。饭太硬同名系列已有[小包](media/fantaiying/)，本次列出的是另一个大文件；没有解包核实其与小包的升级关系。',
                 '只列入固定树中实际存在的超限APK。README中指向其他仓库、外站或仅有说明而未存放APK的条目不计入这205份。',
                 '维护：编辑[应用评估](planning/app-notes.json)，运行 `python3 tools/update-tvapp-oversized.py`；用 `--check` 核对所有文件恰好覆盖一次以及生成文档一致。']
    buffer = io.StringIO(newline='')
    columns = ['category', 'subcategory', 'appId', 'appName', 'path', 'bytes', 'sizeMB', 'versionHints', 'buildHints', 'variantHints', 'systemHints', 'upstreamGitBlobSha', 'sourceCommit', 'sourceUrl', 'downloadUrl', 'sameBlobPaths', 'archiveStatus', 'archivePath', 'manifestPath']
    writer = csv.DictWriter(buffer, fieldnames=columns, lineterminator='\n')
    writer.writeheader()
    for file in files:
        writer.writerow({key: ' | '.join(file[key]) if isinstance(file[key], list) else file[key] for key in columns})
    outputs = {'fork/OVERSIZED.md': '\n\n'.join(overview) + '\n',
               'fork/planning/replication-notes.md': '\n\n'.join(details).rstrip() + '\n',
               'fork/planning/oversized-apks.md': '\n\n'.join(package_md) + '\n',
               'fork/planning/oversized.json': json.dumps(result, ensure_ascii=False, indent=2) + '\n',
               'fork/planning/oversized.csv': buffer.getvalue()}
    # Tables must remain contiguous in CommonMark despite section spacing.
    for name in ['fork/OVERSIZED.md', 'fork/planning/oversized-apks.md']:
        outputs[name] = re.sub(r'(?m)(^\|[^\n]*\|)\n\n(?=\|)', r'\1\n', outputs[name])
    report = {'status': 'passed', 'source': source, 'statistics': stats,
              'exactCoverage': True, 'noImportedSmallApksIncluded': True,
              'eachPathAssignedOnce': True, 'validReadmeEvidenceLines': True,
              'largeApksDownloaded': bool(imported_oversized), 'physicalTvTested': False,
              'outputs': {name: hashlib.sha256(value.encode()).hexdigest() for name, value in outputs.items()}}
    outputs['fork/planning/validation.json'] = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    return outputs, stats


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate coverage and compare generated files without writing.')
    args = parser.parse_args()
    outputs, stats = build()
    for name, value in outputs.items():
        path = ROOT / name
        if args.check:
            assert path.read_text(encoding='utf-8') == value, f'Generated file is stale: {name}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(value, encoding='utf-8')
    print(json.dumps({'status': 'passed', 'checkOnly': args.check, **stats}, ensure_ascii=False))


if __name__ == '__main__':
    main()
