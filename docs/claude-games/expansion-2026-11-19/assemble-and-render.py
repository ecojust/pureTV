#!/usr/bin/env python3
"""Merge this reviewed expansion once and render only the reference blocks."""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
catalog_path = ROOT / 'docs/claude-games/catalog.json'
data = json.loads(catalog_path.read_text())
inputs = [HERE / (name + '-research.json') for name in ('root', 'karts', 'strategy', 'arcade')]
new = [game for path in inputs for game in json.loads(path.read_text())['games']]
assert len(new) == 79
new_ids = {game['id'] for game in new}
old = [game for game in data['games'] if game['id'] not in new_ids]
assert len(old) == 301, 'Preserve the existing 301 references'
games = new + old
assert len({game['id'].lower() for game in games}) == len(games)
assert len({game['sourceUrl'].lower() for game in games}) == len(games)
category_rename = {'3D 动作、探索与模拟': '动作、角色扮演与探索'}
categories = [category_rename.get(name, name) for name in data['categoryCounts']]
for game in games:
    game['category'] = category_rename.get(game['category'], game['category'])
    game.setdefault('checkedAt', '2026-11-19' if game['id'] in new_ids else '2026-11-17')
    if game['title'] == 'Couch Colony':
        game['runtimeLabel'] = 'webOS / 需 root'
counts = collections.Counter(game['category'] for game in games)
assert set(counts) == set(categories)
previous_expansion = data.get('expansion')
if previous_expansion and previous_expansion['checkedAt'] == '2026-11-17':
    data['previousExpansion'] = previous_expansion
data.update(checkedAt='2026-11-19', count=len(games), repositoryCount=len({game['repository'].lower() for game in games}),
            games=games, categoryCounts={name: counts[name] for name in categories})
data['expansion'] = {'checkedAt': '2026-11-19', 'previousCount': 301, 'addedCount': len(new),
                     'previousRepositoryCount': 178, 'originalPortingBaseline': 'porting-baseline-93.json',
                     'researchDirectory': 'expansion-2026-11-19/'}
catalog_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def esc(value):
    return str(value).replace('|', '&#124;').replace('\n', ' ').replace('\r', ' ')

def link(label, url):
    return '[' + esc(label) + '](' + url + ')'

lines = ['<!-- claude-games:start -->', '<a id="claude-游戏参考清单"></a>',
         f'## Claude 游戏参考清单（{data["count"]} 项 / {data["repositoryCount"]} 个仓库）', '',
         '本轮继续搜索 GitHub，新增 **79 项**，按玩法分为以下 8 类。新增条目排在各分类前面；点击展开可查看源码、玩法、运行入口、Claude 依据和许可。', '',
         '优先看看 **Voxel Musou（体素无双）、Inkline Town、Fall Line、Hollow Crown、Demolition Derby、Spirit Call、Solder & Rain、Rainglass**：分别是三国无双、城市经营、开放雪山滑雪、像素 RPG、碰撞赛车、元素小队动作、电子维修和雨窗休闲。', '',
         '按玩法完整度、实际源码、可运行入口和画面资料初筛，核对作者制作说明或确实修改游戏源码的 Claude 署名提交。Claude 参与不表示全部代码、美术和音乐均由它独立生成。**尚未逐款完整试玩；HTTP 可达不等于游戏运行通过。⭐ 是各条目检查时的仓库星标，新增项检查于 2026-11-19，原301项保留2026-11-17快照。**', '',
         '镜像、迁址、重命名和同一游戏的多个版本不重复计数；合集中的独立玩法可分列，相近模式按一项合并。许可证和运行条件分别标明，清单包含网页、原生引擎与特殊宿主项目，不代表均能直接安装到电视。核查与筛选记录见[来源说明](docs/claude-games/README.md)。', '',
         '九款赛车适配按本次扩充前已登记的 **31 个候选**继续推进，见[赛车对比与三平台适配计划](docs/racing-nine/README.md)。原93项已完成[逐项评估](docs/claude-games/tv-assessment.md)，其余批量适配按用户要求暂停；新增参考不会自动加入适配任务。已交付安装包见[手柄游戏目录](joystick-games/README.md)，参考条目数不等于已发布游戏数。', '']
for category, count in data['categoryCounts'].items():
    lines += ['<details open>' if category == '竞速与体育' else '<details>',
              f'<summary><strong>{category}（{count}）</strong></summary>', '',
              '| 游戏与源码 | 玩法与看点 | 运行方式 / 入口 | Claude 依据 / 许可 |',
              '| --- | --- | --- | --- |']
    for game in (g for g in games if g['category'] == category):
        title = link(game['title'], game['sourceUrl']) + f' · ⭐ {game["stars"]}'
        runtime = esc(game['runtimeLabel'])
        demo = game['demo']
        if demo.get('url') and demo.get('httpStatus') == 200:
            runtime += ' · ' + link(demo.get('label', '演示'), demo['url'])
        else:
            runtime += ' · 从源码运行'
        evidence = link('Claude 依据', game['claudeEvidence']['url']) + ' · '
        evidence += link(game['licenseLabel'], game['license']['url']) if game['license'].get('url') else esc(game['licenseLabel'])
        lines.append('| ' + title + ' | ' + esc(game['summary']) + ' | ' + runtime + ' | ' + evidence + ' |')
    lines += ['', '</details>', '']
lines += ['继续发现候选可参考 [Awesome AI-Built Games](https://github.com/lappemic/awesome-ai-built-games)、[Frontier Games](https://github.com/theolundqvist/frontier-games) 和 [Opus 5.5 Games](https://github.com/gamingnews5/awesome-opus-5.5-games)。这些聚合目录可能混有其他模型、重复项目或未核实作品，不计入上述数量。', '<!-- claude-games:end -->']

def replace_block(path, block):
    text = path.read_text()
    start = '<!-- claude-games:start -->'
    end = '<!-- claude-games:end -->'
    assert text.count(start) == text.count(end) == 1
    a, b = text.index(start), text.index(end) + len(end)
    path.write_text(text[:a] + block + text[b:])

replace_block(ROOT / 'README.md', '\n'.join(lines))
english = ['<!-- claude-games:start -->', '## Claude-assisted game references', '',
           f'The [Chinese README lists {data["count"]} references from {data["repositoryCount"]} GitHub repositories](README.md#claude-游戏参考清单), including **79 newly researched entries**. Expand its eight categories for source code, gameplay, demo or build instructions, Claude attribution, and license details.', '',
           'New highlights include **Voxel Musou, Inkline Town, Fall Line, Hollow Crown, Demolition Derby, Spirit Call, Solder & Rain, and Rainglass**. Entries were screened through original source, author statements or Claude-signed commits affecting game code, and available visual material. This is not a tested quality ranking: HTTP availability does not establish working gameplay or pureTV compatibility. Stars are dated snapshots: 2026-11-19 for this expansion and 2026-11-17 for the preceding 301 entries.', '',
           'The [nine-racer project](docs/racing-nine/README.md) continues against its previously frozen 31 candidates. The original 93-entry bulk porting task remains paused; expanding this reference list does not add porting commitments or published games. See the [source and review records](docs/claude-games/README.md) and the [delivered controller games](joystick-games/README.md).', '<!-- claude-games:end -->']
replace_block(ROOT / 'README.en.md', '\n'.join(english))
(HERE / 'assembly-inputs.json').write_text(json.dumps({'count': len(games), 'addedCount': len(new),
    'repositoryCount': data['repositoryCount'], 'categoryCounts': data['categoryCounts'],
    'inputs': {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in inputs},
    'categoryRename': category_rename, 'preservedPriorReferences': len(old)}, ensure_ascii=False, indent=2) + '\n')
print('Rendered', len(games), 'references from', data['repositoryCount'], 'repositories')
